/**
 * firebase-offline.js
 * Sistema de sincronización offline para la aplicación Comedor Empresarial
 * Permite que la aplicación funcione sin conexión a internet y sincronice
 * los cambios cuando se restablezca la conexión.
 */

import { getFirestore, enableIndexedDbPersistence, disableNetwork, enableNetwork, waitForPendingWrites } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { logError, logCustomEvent } from './firebase-monitoring.js';

// Obtener instancias de Firebase
const db = getFirestore();
const auth = getAuth();

/**
 * Sistema de sincronización offline
 */
const FirebaseOffline = {
    // Estado interno
    _state: {
        initialized: false,
        isOnline: navigator.onLine,
        pendingOperations: [],
        persistenceEnabled: false,
        offlineMode: false,
        listeners: {
            online: null,
            offline: null
        },
        callbacks: {
            onStatusChange: [],
            onSyncComplete: []
        }
    },
    
    /**
     * Inicializa el sistema de sincronización offline
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
     */
    initialize: async function() {
        try {
            if (this._state.initialized) {
                return true;
            }
            
            // Habilitar persistencia en IndexedDB
            try {
                await enableIndexedDbPersistence(db);
                this._state.persistenceEnabled = true;
                
                logCustomEvent('offline_persistence_enabled', {
                    success: true
                });
            } catch (err) {
                console.error('Error al habilitar persistencia offline:', err);
                logError(err, { operation: 'enable_persistence' });
                
                // Si el error es porque ya está habilitada en otra pestaña, no es un problema
                if (err.code === 'failed-precondition') {
                    console.warn('La persistencia offline ya está habilitada en otra pestaña.');
                    this._state.persistenceEnabled = true;
                } else {
                    // Si es otro tipo de error, intentamos continuar sin persistencia
                    console.error('No se pudo habilitar la persistencia offline. La app puede no funcionar sin conexión.');
                }
            }
            
            // Configurar listeners de conexión
            this._setupConnectionListeners();
            
            // Cargar operaciones pendientes del almacenamiento local
            this._loadPendingOperations();
            
            this._state.initialized = true;
            
            // Notificar estado inicial
            this._notifyStatusChange();
            
            return true;
        } catch (error) {
            logError(error, { operation: 'initialize_offline' });
            console.error('Error al inicializar sincronización offline:', error);
            return false;
        }
    },
    
    /**
     * Activa el modo offline manualmente
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se activó correctamente
     */
    goOffline: async function() {
        try {
            await disableNetwork(db);
            this._state.offlineMode = true;
            this._notifyStatusChange();
            
            logCustomEvent('manual_offline_mode', {
                enabled: true
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'go_offline' });
            console.error('Error al activar modo offline:', error);
            return false;
        }
    },
    
    /**
     * Desactiva el modo offline manualmente
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se desactivó correctamente
     */
    goOnline: async function() {
        try {
            await enableNetwork(db);
            this._state.offlineMode = false;
            this._notifyStatusChange();
            
            // Intentar sincronizar operaciones pendientes
            if (this._state.isOnline) {
                this.syncPendingOperations();
            }
            
            logCustomEvent('manual_offline_mode', {
                enabled: false
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'go_online' });
            console.error('Error al desactivar modo offline:', error);
            return false;
        }
    },
    
    /**
     * Verifica si la aplicación está en modo offline
     * @returns {boolean} - true si está en modo offline
     */
    isOffline: function() {
        return !this._state.isOnline || this._state.offlineMode;
    },
    
    /**
     * Registra una operación pendiente para sincronizar cuando haya conexión
     * @param {Object} operation - Operación a sincronizar
     * @param {string} operation.type - Tipo de operación (create, update, delete)
     * @param {string} operation.collection - Colección de Firestore
     * @param {string} operation.id - ID del documento
     * @param {Object} operation.data - Datos del documento (para create y update)
     * @returns {string} - ID de la operación pendiente
     */
    registerPendingOperation: function(operation) {
        try {
            // Validar operación
            if (!operation.type || !operation.collection || !operation.id) {
                throw new Error('Operación inválida. Debe tener tipo, colección e ID.');
            }
            
            // Validar tipo
            if (!['create', 'update', 'delete'].includes(operation.type)) {
                throw new Error('Tipo de operación inválido. Debe ser create, update o delete.');
            }
            
            // Validar datos para create y update
            if ((operation.type === 'create' || operation.type === 'update') && !operation.data) {
                throw new Error('Las operaciones create y update deben incluir datos.');
            }
            
            // Generar ID único para la operación
            const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Crear objeto de operación
            const pendingOperation = {
                id: operationId,
                type: operation.type,
                collection: operation.collection,
                docId: operation.id,
                data: operation.data || null,
                timestamp: Date.now(),
                attempts: 0,
                userId: auth.currentUser ? auth.currentUser.uid : null
            };
            
            // Agregar a la lista de operaciones pendientes
            this._state.pendingOperations.push(pendingOperation);
            
            // Guardar en localStorage
            this._savePendingOperations();
            
            // Intentar sincronizar si hay conexión
            if (this._state.isOnline && !this._state.offlineMode) {
                this.syncPendingOperations();
            }
            
            return operationId;
        } catch (error) {
            logError(error, { operation: 'register_pending_operation' });
            console.error('Error al registrar operación pendiente:', error);
            throw error;
        }
    },
    
    /**
     * Sincroniza las operaciones pendientes con Firestore
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se sincronizaron correctamente
     */
    syncPendingOperations: async function() {
        try {
            // Si no hay conexión o está en modo offline, no sincronizar
            if (!this._state.isOnline || this._state.offlineMode) {
                return false;
            }
            
            // Si no hay operaciones pendientes, no hacer nada
            if (this._state.pendingOperations.length === 0) {
                return true;
            }
            
            // Esperar a que se completen las escrituras pendientes de Firestore
            await waitForPendingWrites(db);
            
            // Clonar array para no modificar el original durante la iteración
            const operations = [...this._state.pendingOperations];
            const successfulOps = [];
            
            // Procesar cada operación
            for (const operation of operations) {
                try {
                    // Incrementar contador de intentos
                    operation.attempts++;
                    
                    // Ejecutar operación según su tipo
                    switch (operation.type) {
                        case 'create':
                            await this._executeCreate(operation);
                            break;
                        case 'update':
                            await this._executeUpdate(operation);
                            break;
                        case 'delete':
                            await this._executeDelete(operation);
                            break;
                    }
                    
                    // Si llegamos aquí, la operación fue exitosa
                    successfulOps.push(operation.id);
                    
                    logCustomEvent('offline_operation_synced', {
                        type: operation.type,
                        collection: operation.collection,
                        success: true
                    });
                } catch (error) {
                    logError(error, { 
                        operation: 'sync_operation', 
                        opType: operation.type,
                        collection: operation.collection,
                        docId: operation.docId,
                        attempts: operation.attempts
                    });
                    
                    console.error(`Error al sincronizar operación ${operation.id}:`, error);
                    
                    // Si ha habido demasiados intentos, marcar como fallida
                    if (operation.attempts >= 5) {
                        successfulOps.push(operation.id);
                        
                        logCustomEvent('offline_operation_failed', {
                            type: operation.type,
                            collection: operation.collection,
                            attempts: operation.attempts
                        });
                    }
                }
            }
            
            // Eliminar operaciones exitosas
            if (successfulOps.length > 0) {
                this._state.pendingOperations = this._state.pendingOperations.filter(
                    op => !successfulOps.includes(op.id)
                );
                
                // Guardar estado actualizado
                this._savePendingOperations();
            }
            
            // Notificar que se completó la sincronización
            this._triggerCallbacks('onSyncComplete', {
                total: operations.length,
                successful: successfulOps.length,
                pending: this._state.pendingOperations.length
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'sync_pending_operations' });
            console.error('Error al sincronizar operaciones pendientes:', error);
            return false;
        }
    },
    
    /**
     * Obtiene el número de operaciones pendientes
     * @returns {number} - Número de operaciones pendientes
     */
    getPendingOperationsCount: function() {
        return this._state.pendingOperations.length;
    },
    
    /**
     * Obtiene las operaciones pendientes
     * @returns {Array} - Array de operaciones pendientes
     */
    getPendingOperations: function() {
        return [...this._state.pendingOperations];
    },
    
    /**
     * Registra un callback para cuando cambia el estado de conexión
     * @param {Function} callback - Función a llamar cuando cambia el estado
     */
    onStatusChange: function(callback) {
        if (typeof callback === 'function') {
            this._state.callbacks.onStatusChange.push(callback);
            
            // Notificar estado actual inmediatamente
            callback({
                isOnline: this._state.isOnline,
                offlineMode: this._state.offlineMode,
                persistenceEnabled: this._state.persistenceEnabled,
                pendingOperations: this._state.pendingOperations.length
            });
        }
    },
    
    /**
     * Registra un callback para cuando se completa una sincronización
     * @param {Function} callback - Función a llamar cuando se completa una sincronización
     */
    onSyncComplete: function(callback) {
        if (typeof callback === 'function') {
            this._state.callbacks.onSyncComplete.push(callback);
        }
    },
    
    /**
     * Configura los listeners de conexión
     * @private
     */
    _setupConnectionListeners: function() {
        // Remover listeners previos si existen
        if (this._state.listeners.online) {
            window.removeEventListener('online', this._state.listeners.online);
        }
        if (this._state.listeners.offline) {
            window.removeEventListener('offline', this._state.listeners.offline);
        }
        
        // Crear nuevos listeners
        this._state.listeners.online = () => {
            this._state.isOnline = true;
            this._notifyStatusChange();
            
            // Intentar sincronizar operaciones pendientes
            if (!this._state.offlineMode) {
                this.syncPendingOperations();
            }
            
            logCustomEvent('connection_status', { online: true });
        };
        
        this._state.listeners.offline = () => {
            this._state.isOnline = false;
            this._notifyStatusChange();
            
            logCustomEvent('connection_status', { online: false });
        };
        
        // Agregar listeners
        window.addEventListener('online', this._state.listeners.online);
        window.addEventListener('offline', this._state.listeners.offline);
    },
    
    /**
     * Notifica a los callbacks que cambió el estado de conexión
     * @private
     */
    _notifyStatusChange: function() {
        const status = {
            isOnline: this._state.isOnline,
            offlineMode: this._state.offlineMode,
            persistenceEnabled: this._state.persistenceEnabled,
            pendingOperations: this._state.pendingOperations.length
        };
        
        this._triggerCallbacks('onStatusChange', status);
    },
    
    /**
     * Dispara callbacks registrados para un evento
     * @private
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a pasar al callback
     */
    _triggerCallbacks: function(event, data) {
        if (this._state.callbacks[event]) {
            this._state.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en callback de ${event}:`, error);
                }
            });
        }
    },
    
    /**
     * Carga las operaciones pendientes del almacenamiento local
     * @private
     */
    _loadPendingOperations: function() {
        try {
            const stored = localStorage.getItem('pendingOperations');
            if (stored) {
                this._state.pendingOperations = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error al cargar operaciones pendientes:', error);
            this._state.pendingOperations = [];
        }
    },
    
    /**
     * Guarda las operaciones pendientes en el almacenamiento local
     * @private
     */
    _savePendingOperations: function() {
        try {
            localStorage.setItem('pendingOperations', JSON.stringify(this._state.pendingOperations));
        } catch (error) {
            console.error('Error al guardar operaciones pendientes:', error);
        }
    },
    
    /**
     * Ejecuta una operación de creación
     * @private
     * @param {Object} operation - Operación a ejecutar
     * @returns {Promise<void>}
     */
    _executeCreate: async function(operation) {
        const { collection, docId, data } = operation;
        
        // Crear referencia al documento
        const docRef = doc(db, collection, docId);
        
        // Crear documento
        await setDoc(docRef, data);
    },
    
    /**
     * Ejecuta una operación de actualización
     * @private
     * @param {Object} operation - Operación a ejecutar
     * @returns {Promise<void>}
     */
    _executeUpdate: async function(operation) {
        const { collection, docId, data } = operation;
        
        // Crear referencia al documento
        const docRef = doc(db, collection, docId);
        
        // Actualizar documento
        await updateDoc(docRef, data);
    },
    
    /**
     * Ejecuta una operación de eliminación
     * @private
     * @param {Object} operation - Operación a ejecutar
     * @returns {Promise<void>}
     */
    _executeDelete: async function(operation) {
        const { collection, docId } = operation;
        
        // Crear referencia al documento
        const docRef = doc(db, collection, docId);
        
        // Eliminar documento
        await deleteDoc(docRef);
    }
};

export default FirebaseOffline;
