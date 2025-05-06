/**
 * firebase-attendance.js
 * Adaptación de la funcionalidad de confirmación de asistencia para usar Firebase
 * Este módulo proporciona funciones para gestionar las confirmaciones de asistencia
 * utilizando Firestore como backend.
 */

import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, Timestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { logError, logCustomEvent } from './firebase-monitoring.js';
import { FirestoreUtil } from './firebase-storage.js';
import FirebaseOffline from './firebase-offline.js';
import FirebaseNotifications from './firebase-notifications.js';
import FirebaseMenuAdmin from './firebase-menu-admin.js';
import FirebaseCoordinatorAdmin from './firebase-coordinator-admin.js';

// Obtener instancias de Firebase
const db = getFirestore();
const auth = getAuth();

/**
 * Administrador de confirmaciones de asistencia usando Firebase
 */
const FirebaseAttendance = {
    // Configuración
    config: {
        collection: 'attendanceConfirmations',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    
    // Estado interno
    _state: {
        listeners: {},
        initialized: false,
        currentUser: null,
        currentCoordinator: null
    },
    
    /**
     * Inicializa el administrador de confirmaciones de asistencia
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
            await FirebaseMenuAdmin.initialize();
            await FirebaseCoordinatorAdmin.initialize();
            
            // Escuchar cambios en la autenticación
            onAuthStateChanged(auth, (user) => {
                this._state.currentUser = user;
            });
            
            this._state.initialized = true;
            
            logCustomEvent('attendance_initialized', {
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'initialize_attendance' });
            console.error('Error al inicializar administrador de confirmaciones de asistencia:', error);
            return false;
        }
    },
    
    /**
     * Establece el coordinador actual
     * @param {Object} coordinator - Datos del coordinador
     */
    setCurrentCoordinator: function(coordinator) {
        this._state.currentCoordinator = coordinator;
    },
    
    /**
     * Obtiene el coordinador actual
     * @returns {Object|null} - Coordinador actual o null si no hay
     */
    getCurrentCoordinator: function() {
        return this._state.currentCoordinator;
    },
    
    /**
     * Genera un ID para una confirmación de asistencia
     * @param {string} coordinatorId - ID del coordinador
     * @param {string} weekStartDate - Fecha de inicio de la semana (YYYY-MM-DD)
     * @returns {string} - ID de la confirmación
     */
    generateConfirmationId: function(coordinatorId, weekStartDate) {
        return `${coordinatorId}_${weekStartDate}`;
    },
    
    /**
     * Crea o actualiza una confirmación de asistencia
     * @param {Object} confirmation - Datos de la confirmación
     * @param {string} confirmation.coordinatorId - ID del coordinador
     * @param {string} confirmation.weekStartDate - Fecha de inicio de la semana (YYYY-MM-DD)
     * @param {Object} confirmation.attendanceCounts - Conteo de asistencia por día
     * @param {number} confirmation.attendanceCounts.monday - Conteo para lunes
     * @param {number} confirmation.attendanceCounts.tuesday - Conteo para martes
     * @param {number} confirmation.attendanceCounts.wednesday - Conteo para miércoles
     * @param {number} confirmation.attendanceCounts.thursday - Conteo para jueves
     * @param {number} confirmation.attendanceCounts.friday - Conteo para viernes
     * @returns {Promise<string>} - Promesa que resuelve con el ID de la confirmación
     */
    saveConfirmation: async function(confirmation) {
        try {
            // Validar datos mínimos
            if (!confirmation.coordinatorId || !confirmation.weekStartDate) {
                throw new Error('La confirmación debe tener ID de coordinador y fecha de inicio de semana');
            }
            
            // Validar formato de fecha
            if (!/^\d{4}-\d{2}-\d{2}$/.test(confirmation.weekStartDate)) {
                throw new Error('La fecha de inicio de semana debe tener formato YYYY-MM-DD');
            }
            
            // Generar ID único
            const confirmationId = this.generateConfirmationId(
                confirmation.coordinatorId,
                confirmation.weekStartDate
            );
            
            // Verificar si ya existe
            const existingConfirmation = await this.getConfirmationById(confirmationId);
            
            // Preparar datos de la confirmación
            let confirmationData;
            
            if (existingConfirmation) {
                // Actualizar existente
                confirmationData = {
                    ...existingConfirmation,
                    attendanceCounts: {
                        ...existingConfirmation.attendanceCounts,
                        ...confirmation.attendanceCounts
                    },
                    updatedAt: Timestamp.now()
                };
            } else {
                // Crear nueva
                confirmationData = {
                    id: confirmationId,
                    coordinatorId: confirmation.coordinatorId,
                    weekStartDate: confirmation.weekStartDate,
                    attendanceCounts: confirmation.attendanceCounts || {},
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    createdBy: this._state.currentUser ? this._state.currentUser.uid : 'system'
                };
                
                // Asegurar que todos los días tienen un valor
                this.config.daysOfWeek.forEach(day => {
                    if (!confirmationData.attendanceCounts[day]) {
                        confirmationData.attendanceCounts[day] = 0;
                    }
                });
            }
            
            // Guardar en Firestore
            await FirestoreUtil.save(this.config.collection, confirmationId, confirmationData);
            
            // Registrar evento
            logCustomEvent('attendance_confirmation_saved', {
                confirmationId,
                coordinatorId: confirmation.coordinatorId,
                weekStartDate: confirmation.weekStartDate,
                isNew: !existingConfirmation
            });
            
            // Crear notificación
            const coordinator = await FirebaseCoordinatorAdmin.getCoordinatorById(confirmation.coordinatorId);
            const coordinatorName = coordinator ? coordinator.name : 'Desconocido';
            
            await FirebaseNotifications.createNotification({
                title: existingConfirmation ? 'Confirmación Actualizada' : 'Nueva Confirmación',
                message: `${existingConfirmation ? 'Se ha actualizado' : 'Se ha registrado'} la confirmación de asistencia para ${coordinatorName} (semana del ${confirmation.weekStartDate})`,
                type: 'info',
                relatedDocId: confirmationId,
                relatedCollection: this.config.collection
            });
            
            return confirmationId;
        } catch (error) {
            logError(error, { 
                operation: 'save_confirmation',
                coordinatorId: confirmation.coordinatorId,
                weekStartDate: confirmation.weekStartDate
            });
            console.error('Error al guardar confirmación de asistencia:', error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                const confirmationId = this.generateConfirmationId(
                    confirmation.coordinatorId,
                    confirmation.weekStartDate
                );
                
                FirebaseOffline.registerPendingOperation({
                    type: 'update', // Usamos update porque funciona tanto para crear como actualizar
                    collection: this.config.collection,
                    id: confirmationId,
                    data: {
                        ...confirmation,
                        id: confirmationId,
                        updatedAt: new Date()
                    }
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Actualiza el conteo de asistencia para un día específico
     * @param {string} confirmationId - ID de la confirmación
     * @param {string} day - Día de la semana (monday, tuesday, etc.)
     * @param {number} count - Nuevo conteo de asistencia
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateDayCount: async function(confirmationId, day, count) {
        try {
            // Validar día
            if (!this.config.daysOfWeek.includes(day)) {
                throw new Error(`Día inválido: ${day}. Debe ser uno de: ${this.config.daysOfWeek.join(', ')}`);
            }
            
            // Validar conteo
            if (isNaN(count) || count < 0) {
                throw new Error('El conteo debe ser un número no negativo');
            }
            
            // Obtener confirmación actual
            const confirmation = await this.getConfirmationById(confirmationId);
            
            if (!confirmation) {
                throw new Error(`No se encontró la confirmación con ID ${confirmationId}`);
            }
            
            // Actualizar conteo
            const attendanceCounts = {
                ...confirmation.attendanceCounts,
                [day]: count
            };
            
            // Guardar cambios
            await FirestoreUtil.update(this.config.collection, confirmationId, {
                attendanceCounts,
                updatedAt: Timestamp.now()
            });
            
            // Registrar evento
            logCustomEvent('day_count_updated', {
                confirmationId,
                day,
                count
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'update_day_count', confirmationId, day });
            console.error(`Error al actualizar conteo para ${day} en confirmación ${confirmationId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                // Obtener confirmación del almacenamiento local si es posible
                const confirmation = await this.getConfirmationById(confirmationId);
                
                if (confirmation) {
                    const attendanceCounts = {
                        ...confirmation.attendanceCounts,
                        [day]: count
                    };
                    
                    FirebaseOffline.registerPendingOperation({
                        type: 'update',
                        collection: this.config.collection,
                        id: confirmationId,
                        data: {
                            attendanceCounts,
                            updatedAt: new Date()
                        }
                    });
                }
            }
            
            throw error;
        }
    },
    
    /**
     * Elimina una confirmación de asistencia
     * @param {string} confirmationId - ID de la confirmación a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteConfirmation: async function(confirmationId) {
        try {
            // Obtener confirmación para la notificación
            const confirmation = await this.getConfirmationById(confirmationId);
            
            if (!confirmation) {
                throw new Error(`No se encontró la confirmación con ID ${confirmationId}`);
            }
            
            // Eliminar de Firestore
            await FirestoreUtil.delete(this.config.collection, confirmationId);
            
            // Registrar evento
            logCustomEvent('confirmation_deleted', {
                confirmationId,
                coordinatorId: confirmation.coordinatorId,
                weekStartDate: confirmation.weekStartDate
            });
            
            // Crear notificación
            const coordinator = await FirebaseCoordinatorAdmin.getCoordinatorById(confirmation.coordinatorId);
            const coordinatorName = coordinator ? coordinator.name : 'Desconocido';
            
            await FirebaseNotifications.createNotification({
                title: 'Confirmación Eliminada',
                message: `Se ha eliminado la confirmación de asistencia para ${coordinatorName} (semana del ${confirmation.weekStartDate})`,
                type: 'warning',
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'delete_confirmation', confirmationId });
            console.error(`Error al eliminar confirmación ${confirmationId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                FirebaseOffline.registerPendingOperation({
                    type: 'delete',
                    collection: this.config.collection,
                    id: confirmationId
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Obtiene una confirmación por su ID
     * @param {string} confirmationId - ID de la confirmación
     * @returns {Promise<Object|null>} - Promesa que resuelve con la confirmación o null si no existe
     */
    getConfirmationById: async function(confirmationId) {
        try {
            return await FirestoreUtil.getById(this.config.collection, confirmationId);
        } catch (error) {
            logError(error, { operation: 'get_confirmation_by_id', confirmationId });
            console.error(`Error al obtener confirmación ${confirmationId}:`, error);
            return null;
        }
    },
    
    /**
     * Obtiene la confirmación de un coordinador para una semana específica
     * @param {string} coordinatorId - ID del coordinador
     * @param {string} weekStartDate - Fecha de inicio de la semana (YYYY-MM-DD)
     * @returns {Promise<Object|null>} - Promesa que resuelve con la confirmación o null si no existe
     */
    getConfirmationForCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
        try {
            const confirmationId = this.generateConfirmationId(coordinatorId, weekStartDate);
            return await this.getConfirmationById(confirmationId);
        } catch (error) {
            logError(error, { 
                operation: 'get_confirmation_for_coordinator_and_week',
                coordinatorId,
                weekStartDate
            });
            console.error(`Error al obtener confirmación para coordinador ${coordinatorId} y semana ${weekStartDate}:`, error);
            return null;
        }
    },
    
    /**
     * Obtiene todas las confirmaciones para una semana específica
     * @param {string} weekStartDate - Fecha de inicio de la semana (YYYY-MM-DD)
     * @returns {Promise<Array>} - Promesa que resuelve con un array de confirmaciones
     */
    getConfirmationsForWeek: async function(weekStartDate) {
        try {
            return await FirestoreUtil.query(
                this.config.collection,
                'weekStartDate',
                '==',
                weekStartDate
            );
        } catch (error) {
            logError(error, { operation: 'get_confirmations_for_week', weekStartDate });
            console.error(`Error al obtener confirmaciones para semana ${weekStartDate}:`, error);
            return [];
        }
    },
    
    /**
     * Obtiene todas las confirmaciones para un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<Array>} - Promesa que resuelve con un array de confirmaciones
     */
    getConfirmationsForCoordinator: async function(coordinatorId) {
        try {
            return await FirestoreUtil.query(
                this.config.collection,
                'coordinatorId',
                '==',
                coordinatorId,
                null,
                [['weekStartDate', 'desc']]
            );
        } catch (error) {
            logError(error, { operation: 'get_confirmations_for_coordinator', coordinatorId });
            console.error(`Error al obtener confirmaciones para coordinador ${coordinatorId}:`, error);
            return [];
        }
    },
    
    /**
     * Calcula el total de asistencia para una confirmación
     * @param {Object} confirmation - Confirmación de asistencia
     * @returns {Object} - Totales por día y total general
     */
    calculateTotals: function(confirmation) {
        if (!confirmation || !confirmation.attendanceCounts) {
            return {
                days: {},
                total: 0
            };
        }
        
        const days = {};
        let total = 0;
        
        this.config.daysOfWeek.forEach(day => {
            const count = parseInt(confirmation.attendanceCounts[day] || 0);
            days[day] = count;
            total += count;
        });
        
        return {
            days,
            total
        };
    },
    
    /**
     * Calcula los totales de asistencia para una semana
     * @param {string} weekStartDate - Fecha de inicio de la semana (YYYY-MM-DD)
     * @returns {Promise<Object>} - Promesa que resuelve con los totales
     */
    calculateWeekTotals: async function(weekStartDate) {
        try {
            const confirmations = await this.getConfirmationsForWeek(weekStartDate);
            
            const totals = {
                days: {
                    monday: 0,
                    tuesday: 0,
                    wednesday: 0,
                    thursday: 0,
                    friday: 0
                },
                total: 0,
                coordinatorCount: confirmations.length
            };
            
            confirmations.forEach(confirmation => {
                this.config.daysOfWeek.forEach(day => {
                    const count = parseInt(confirmation.attendanceCounts?.[day] || 0);
                    totals.days[day] += count;
                    totals.total += count;
                });
            });
            
            return totals;
        } catch (error) {
            logError(error, { operation: 'calculate_week_totals', weekStartDate });
            console.error(`Error al calcular totales para semana ${weekStartDate}:`, error);
            return {
                days: {
                    monday: 0,
                    tuesday: 0,
                    wednesday: 0,
                    thursday: 0,
                    friday: 0
                },
                total: 0,
                coordinatorCount: 0
            };
        }
    },
    
    /**
     * Obtiene la fecha de inicio de la semana actual (lunes)
     * @returns {string} - Fecha en formato YYYY-MM-DD
     */
    getCurrentWeekStartDate: function() {
        const now = new Date();
        const day = now.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        // Calcular días a restar para llegar al lunes
        const daysToSubtract = day === 0 ? 6 : day - 1;
        
        // Obtener fecha del lunes
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToSubtract);
        
        // Formatear como YYYY-MM-DD
        return monday.toISOString().split('T')[0];
    },
    
    /**
     * Obtiene la fecha de inicio de la semana siguiente
     * @param {string} currentWeekStartDate - Fecha de inicio de la semana actual
     * @returns {string} - Fecha en formato YYYY-MM-DD
     */
    getNextWeekStartDate: function(currentWeekStartDate) {
        const date = new Date(currentWeekStartDate);
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Obtiene la fecha de inicio de la semana anterior
     * @param {string} currentWeekStartDate - Fecha de inicio de la semana actual
     * @returns {string} - Fecha en formato YYYY-MM-DD
     */
    getPreviousWeekStartDate: function(currentWeekStartDate) {
        const date = new Date(currentWeekStartDate);
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Escucha cambios en las confirmaciones de una semana
     * @param {string} weekStartDate - Fecha de inicio de la semana
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToWeekConfirmations: function(weekStartDate, callback) {
        try {
            // Cancelar escucha previa si existe
            const listenerKey = `week_${weekStartDate}`;
            if (this._state.listeners[listenerKey]) {
                this._state.listeners[listenerKey]();
            }
            
            // Crear nueva escucha
            const q = query(
                collection(db, this.config.collection),
                where('weekStartDate', '==', weekStartDate)
            );
            
            this._state.listeners[listenerKey] = onSnapshot(q, (snapshot) => {
                const confirmations = [];
                snapshot.forEach((doc) => {
                    confirmations.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                callback(confirmations);
            }, (error) => {
                logError(error, { operation: 'listen_to_week_confirmations', weekStartDate });
                console.error(`Error al escuchar cambios en confirmaciones de semana ${weekStartDate}:`, error);
            });
            
            return this._state.listeners[listenerKey];
        } catch (error) {
            logError(error, { operation: 'listen_to_week_confirmations', weekStartDate });
            console.error(`Error al configurar escucha de confirmaciones de semana ${weekStartDate}:`, error);
            return () => {};
        }
    },
    
    /**
     * Escucha cambios en la confirmación de un coordinador para una semana
     * @param {string} coordinatorId - ID del coordinador
     * @param {string} weekStartDate - Fecha de inicio de la semana
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToCoordinatorWeekConfirmation: function(coordinatorId, weekStartDate, callback) {
        try {
            const confirmationId = this.generateConfirmationId(coordinatorId, weekStartDate);
            
            // Cancelar escucha previa si existe
            const listenerKey = `coordinator_week_${confirmationId}`;
            if (this._state.listeners[listenerKey]) {
                this._state.listeners[listenerKey]();
            }
            
            // Crear nueva escucha
            const docRef = doc(db, this.config.collection, confirmationId);
            
            this._state.listeners[listenerKey] = onSnapshot(docRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const confirmation = {
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    };
                    callback(confirmation);
                } else {
                    callback(null);
                }
            }, (error) => {
                logError(error, { 
                    operation: 'listen_to_coordinator_week_confirmation',
                    coordinatorId,
                    weekStartDate
                });
                console.error(`Error al escuchar cambios en confirmación para coordinador ${coordinatorId} y semana ${weekStartDate}:`, error);
            });
            
            return this._state.listeners[listenerKey];
        } catch (error) {
            logError(error, { 
                operation: 'listen_to_coordinator_week_confirmation',
                coordinatorId,
                weekStartDate
            });
            console.error(`Error al configurar escucha de confirmación para coordinador ${coordinatorId} y semana ${weekStartDate}:`, error);
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

export default FirebaseAttendance;
