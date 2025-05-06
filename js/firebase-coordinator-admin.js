/**
 * firebase-coordinator-admin.js
 * Adaptación de la funcionalidad de administración de coordinadores para usar Firebase
 * Este módulo proporciona funciones para gestionar coordinadores
 * utilizando Firestore como backend.
 */

import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, Timestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { logError, logCustomEvent } from './firebase-monitoring.js';
import { FirestoreUtil } from './firebase-storage.js';
import FirebaseOffline from './firebase-offline.js';
import FirebaseNotifications from './firebase-notifications.js';

// Obtener instancias de Firebase
const db = getFirestore();
const auth = getAuth();

/**
 * Administrador de coordinadores usando Firebase
 */
const FirebaseCoordinatorAdmin = {
    // Configuración
    config: {
        collection: 'coordinators',
        accessCodeLength: 6
    },
    
    // Estado interno
    _state: {
        listeners: {},
        initialized: false,
        currentUser: null
    },
    
    /**
     * Inicializa el administrador de coordinadores
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
     */
    initialize: async function() {
        try {
            if (this._state.initialized) {
                return true;
            }
            
            // Inicializar sistemas dependientes
            await FirebaseOffline.initialize();
            await FirebaseNotifications.initialize();
            
            // Escuchar cambios en la autenticación
            onAuthStateChanged(auth, (user) => {
                this._state.currentUser = user;
            });
            
            this._state.initialized = true;
            
            logCustomEvent('coordinator_admin_initialized', {
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'initialize_coordinator_admin' });
            console.error('Error al inicializar administrador de coordinadores:', error);
            return false;
        }
    },
    
    /**
     * Genera un código de acceso único para coordinadores
     * @returns {Promise<string>} - Promesa que resuelve con el código generado
     */
    generateAccessCode: async function() {
        try {
            // Generar código aleatorio
            const generateRandomCode = () => {
                const characters = '0123456789';
                let code = '';
                for (let i = 0; i < this.config.accessCodeLength; i++) {
                    const randomIndex = Math.floor(Math.random() * characters.length);
                    code += characters[randomIndex];
                }
                return code;
            };
            
            // Verificar que el código no exista ya
            let code;
            let isUnique = false;
            let attempts = 0;
            
            while (!isUnique && attempts < 10) {
                code = generateRandomCode();
                attempts++;
                
                // Verificar si ya existe
                const existingCoordinators = await FirestoreUtil.query(
                    this.config.collection,
                    'accessCode',
                    '==',
                    code,
                    1
                );
                
                isUnique = existingCoordinators.length === 0;
            }
            
            if (!isUnique) {
                throw new Error('No se pudo generar un código único después de varios intentos');
            }
            
            return code;
        } catch (error) {
            logError(error, { operation: 'generate_access_code' });
            console.error('Error al generar código de acceso:', error);
            throw error;
        }
    },
    
    /**
     * Crea un nuevo coordinador
     * @param {Object} coordinator - Datos del coordinador
     * @param {string} coordinator.name - Nombre del coordinador
     * @param {string} coordinator.department - Departamento del coordinador
     * @param {string} coordinator.email - Email del coordinador (opcional)
     * @param {string} coordinator.phone - Teléfono del coordinador (opcional)
     * @returns {Promise<Object>} - Promesa que resuelve con el coordinador creado
     */
    createCoordinator: async function(coordinator) {
        try {
            // Validar datos mínimos
            if (!coordinator.name || !coordinator.department) {
                throw new Error('El coordinador debe tener nombre y departamento');
            }
            
            // Generar ID único si no se proporciona
            const coordinatorId = coordinator.id || `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Generar código de acceso
            const accessCode = await this.generateAccessCode();
            
            // Preparar datos del coordinador
            const coordinatorData = {
                ...coordinator,
                id: coordinatorId,
                accessCode,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: this._state.currentUser ? this._state.currentUser.uid : 'system',
                active: true
            };
            
            // Guardar en Firestore
            await FirestoreUtil.save(this.config.collection, coordinatorId, coordinatorData);
            
            // Registrar evento
            logCustomEvent('coordinator_created', {
                coordinatorId,
                coordinatorName: coordinator.name,
                department: coordinator.department
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Nuevo Coordinador Creado',
                message: `Se ha creado el coordinador "${coordinator.name}" para el departamento "${coordinator.department}"`,
                type: 'info',
                relatedDocId: coordinatorId,
                relatedCollection: this.config.collection
            });
            
            return coordinatorData;
        } catch (error) {
            logError(error, { operation: 'create_coordinator' });
            console.error('Error al crear coordinador:', error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                // No podemos generar código de acceso offline, así que usamos un placeholder
                const tempAccessCode = 'OFFLINE';
                const coordinatorId = coordinator.id || `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                FirebaseOffline.registerPendingOperation({
                    type: 'create',
                    collection: this.config.collection,
                    id: coordinatorId,
                    data: {
                        ...coordinator,
                        id: coordinatorId,
                        accessCode: tempAccessCode,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: this._state.currentUser ? this._state.currentUser.uid : 'system',
                        active: true,
                        needsAccessCodeUpdate: true // Flag para actualizar el código cuando se sincronice
                    }
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Actualiza un coordinador existente
     * @param {string} coordinatorId - ID del coordinador a actualizar
     * @param {Object} coordinatorData - Datos a actualizar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateCoordinator: async function(coordinatorId, coordinatorData) {
        try {
            // Obtener coordinador actual
            const currentCoordinator = await this.getCoordinatorById(coordinatorId);
            
            if (!currentCoordinator) {
                throw new Error(`No se encontró el coordinador con ID ${coordinatorId}`);
            }
            
            // Preparar datos para actualizar
            const updatedCoordinator = {
                ...currentCoordinator,
                ...coordinatorData,
                updatedAt: Timestamp.now()
            };
            
            // No permitir cambiar el código de acceso directamente
            if (coordinatorData.accessCode && coordinatorData.accessCode !== currentCoordinator.accessCode) {
                delete updatedCoordinator.accessCode;
            }
            
            // Guardar en Firestore
            await FirestoreUtil.save(this.config.collection, coordinatorId, updatedCoordinator);
            
            // Registrar evento
            logCustomEvent('coordinator_updated', {
                coordinatorId,
                coordinatorName: updatedCoordinator.name,
                department: updatedCoordinator.department
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Coordinador Actualizado',
                message: `Se ha actualizado la información del coordinador "${updatedCoordinator.name}"`,
                type: 'info',
                relatedDocId: coordinatorId,
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'update_coordinator', coordinatorId });
            console.error(`Error al actualizar coordinador ${coordinatorId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                FirebaseOffline.registerPendingOperation({
                    type: 'update',
                    collection: this.config.collection,
                    id: coordinatorId,
                    data: { ...coordinatorData, updatedAt: new Date() }
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Elimina un coordinador
     * @param {string} coordinatorId - ID del coordinador a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteCoordinator: async function(coordinatorId) {
        try {
            // Obtener nombre del coordinador para la notificación
            const coordinator = await this.getCoordinatorById(coordinatorId);
            const coordinatorName = coordinator ? coordinator.name : 'Desconocido';
            
            // Eliminar de Firestore
            await FirestoreUtil.delete(this.config.collection, coordinatorId);
            
            // Registrar evento
            logCustomEvent('coordinator_deleted', {
                coordinatorId,
                coordinatorName
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Coordinador Eliminado',
                message: `Se ha eliminado el coordinador "${coordinatorName}"`,
                type: 'warning',
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'delete_coordinator', coordinatorId });
            console.error(`Error al eliminar coordinador ${coordinatorId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                FirebaseOffline.registerPendingOperation({
                    type: 'delete',
                    collection: this.config.collection,
                    id: coordinatorId
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Regenera el código de acceso de un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<string>} - Promesa que resuelve con el nuevo código
     */
    regenerateAccessCode: async function(coordinatorId) {
        try {
            // Obtener coordinador actual
            const coordinator = await this.getCoordinatorById(coordinatorId);
            
            if (!coordinator) {
                throw new Error(`No se encontró el coordinador con ID ${coordinatorId}`);
            }
            
            // Generar nuevo código
            const newAccessCode = await this.generateAccessCode();
            
            // Actualizar coordinador
            await this.updateCoordinator(coordinatorId, { 
                accessCode: newAccessCode,
                accessCodeUpdatedAt: Timestamp.now()
            });
            
            // Registrar evento
            logCustomEvent('access_code_regenerated', {
                coordinatorId,
                coordinatorName: coordinator.name
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Código de Acceso Regenerado',
                message: `Se ha regenerado el código de acceso para el coordinador "${coordinator.name}"`,
                type: 'info',
                relatedDocId: coordinatorId,
                relatedCollection: this.config.collection
            });
            
            return newAccessCode;
        } catch (error) {
            logError(error, { operation: 'regenerate_access_code', coordinatorId });
            console.error(`Error al regenerar código de acceso para coordinador ${coordinatorId}:`, error);
            throw error;
        }
    },
    
    /**
     * Activa o desactiva un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @param {boolean} active - Estado de activación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se cambió correctamente
     */
    setCoordinatorActive: async function(coordinatorId, active) {
        try {
            // Obtener coordinador actual
            const coordinator = await this.getCoordinatorById(coordinatorId);
            
            if (!coordinator) {
                throw new Error(`No se encontró el coordinador con ID ${coordinatorId}`);
            }
            
            // Si ya tiene el estado deseado, no hacer nada
            if (coordinator.active === active) {
                return true;
            }
            
            // Actualizar estado
            await this.updateCoordinator(coordinatorId, { active });
            
            // Registrar evento
            logCustomEvent('coordinator_status_changed', {
                coordinatorId,
                coordinatorName: coordinator.name,
                active
            });
            
            // Crear notificación
            const actionText = active ? 'activado' : 'desactivado';
            await FirebaseNotifications.createNotification({
                title: `Coordinador ${actionText}`,
                message: `Se ha ${actionText} el coordinador "${coordinator.name}"`,
                type: active ? 'success' : 'warning',
                relatedDocId: coordinatorId,
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'set_coordinator_active', coordinatorId, active });
            console.error(`Error al ${active ? 'activar' : 'desactivar'} coordinador ${coordinatorId}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtiene un coordinador por su ID
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<Object|null>} - Promesa que resuelve con el coordinador o null si no existe
     */
    getCoordinatorById: async function(coordinatorId) {
        try {
            return await FirestoreUtil.getById(this.config.collection, coordinatorId);
        } catch (error) {
            logError(error, { operation: 'get_coordinator_by_id', coordinatorId });
            console.error(`Error al obtener coordinador ${coordinatorId}:`, error);
            return null;
        }
    },
    
    /**
     * Obtiene un coordinador por su código de acceso
     * @param {string} accessCode - Código de acceso
     * @returns {Promise<Object|null>} - Promesa que resuelve con el coordinador o null si no existe
     */
    getCoordinatorByAccessCode: async function(accessCode) {
        try {
            const coordinators = await FirestoreUtil.query(
                this.config.collection,
                'accessCode',
                '==',
                accessCode,
                1
            );
            
            return coordinators.length > 0 ? coordinators[0] : null;
        } catch (error) {
            logError(error, { operation: 'get_coordinator_by_access_code' });
            console.error('Error al obtener coordinador por código de acceso:', error);
            return null;
        }
    },
    
    /**
     * Obtiene todos los coordinadores
     * @param {Object} options - Opciones de consulta
     * @param {boolean} options.onlyActive - Si solo se deben obtener los coordinadores activos
     * @param {string} options.department - Filtrar por departamento
     * @param {number} options.limit - Límite de coordinadores a obtener
     * @returns {Promise<Array>} - Promesa que resuelve con un array de coordinadores
     */
    getAllCoordinators: async function(options = {}) {
        try {
            const defaultOptions = {
                onlyActive: false,
                department: null,
                limit: 50
            };
            
            const queryOptions = { ...defaultOptions, ...options };
            
            // Si hay filtros, usar query
            if (queryOptions.onlyActive || queryOptions.department) {
                let constraints = [];
                
                if (queryOptions.onlyActive) {
                    constraints.push(['active', '==', true]);
                }
                
                if (queryOptions.department) {
                    constraints.push(['department', '==', queryOptions.department]);
                }
                
                return await FirestoreUtil.queryMultiple(
                    this.config.collection,
                    constraints,
                    queryOptions.limit
                );
            }
            
            // Si no hay filtros, obtener todos
            return await FirestoreUtil.getAll(this.config.collection, queryOptions.limit);
        } catch (error) {
            logError(error, { operation: 'get_all_coordinators' });
            console.error('Error al obtener todos los coordinadores:', error);
            return [];
        }
    },
    
    /**
     * Obtiene todos los departamentos únicos
     * @returns {Promise<Array<string>>} - Promesa que resuelve con un array de departamentos
     */
    getAllDepartments: async function() {
        try {
            const coordinators = await this.getAllCoordinators();
            
            // Extraer departamentos únicos
            const departments = new Set();
            coordinators.forEach(coordinator => {
                if (coordinator.department) {
                    departments.add(coordinator.department);
                }
            });
            
            return Array.from(departments).sort();
        } catch (error) {
            logError(error, { operation: 'get_all_departments' });
            console.error('Error al obtener departamentos:', error);
            return [];
        }
    },
    
    /**
     * Escucha cambios en los coordinadores
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToCoordinators: function(callback) {
        try {
            // Cancelar escucha previa si existe
            if (this._state.listeners.coordinators) {
                this._state.listeners.coordinators();
            }
            
            // Crear nueva escucha
            const q = query(
                collection(db, this.config.collection),
                orderBy('name', 'asc')
            );
            
            this._state.listeners.coordinators = onSnapshot(q, (snapshot) => {
                const coordinators = [];
                snapshot.forEach((doc) => {
                    coordinators.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                callback(coordinators);
            }, (error) => {
                logError(error, { operation: 'listen_to_coordinators' });
                console.error('Error al escuchar cambios en coordinadores:', error);
            });
            
            return this._state.listeners.coordinators;
        } catch (error) {
            logError(error, { operation: 'listen_to_coordinators' });
            console.error('Error al configurar escucha de coordinadores:', error);
            return () => {};
        }
    },
    
    /**
     * Escucha cambios en un coordinador específico
     * @param {string} coordinatorId - ID del coordinador
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToCoordinator: function(coordinatorId, callback) {
        try {
            // Cancelar escucha previa si existe
            const listenerKey = `coordinator_${coordinatorId}`;
            if (this._state.listeners[listenerKey]) {
                this._state.listeners[listenerKey]();
            }
            
            // Crear nueva escucha
            const docRef = doc(db, this.config.collection, coordinatorId);
            
            this._state.listeners[listenerKey] = onSnapshot(docRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const coordinator = {
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    };
                    callback(coordinator);
                } else {
                    callback(null);
                }
            }, (error) => {
                logError(error, { operation: 'listen_to_coordinator', coordinatorId });
                console.error(`Error al escuchar cambios en coordinador ${coordinatorId}:`, error);
            });
            
            return this._state.listeners[listenerKey];
        } catch (error) {
            logError(error, { operation: 'listen_to_coordinator', coordinatorId });
            console.error(`Error al configurar escucha de coordinador ${coordinatorId}:`, error);
            return () => {};
        }
    },
    
    /**
     * Detiene todas las escuchas
     */
    stopAllListeners: function() {
        Object.values(this._state.listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this._state.listeners = {};
    }
};

export default FirebaseCoordinatorAdmin;
