/**
 * firebase-offline.js
 * Módulo para gestionar la funcionalidad offline con Firebase
 */

const FirebaseOffline = {
    /**
     * Estado de la conexión
     */
    _isOnline: navigator.onLine,
    
    /**
     * Callbacks para cambios de estado
     */
    _callbacks: {
        online: [],
        offline: []
    },
    
    /**
     * Inicializa el módulo de funcionalidad offline
     */
    init: function() {
        // Configurar Firebase para persistencia offline
        this._setupFirebasePersistence();
        
        // Configurar listeners para detectar cambios en la conexión
        this._setupConnectionListeners();
        
        // Mostrar indicador de estado inicial
        this._updateOfflineIndicator();
        
        console.log('Módulo de funcionalidad offline inicializado');
        return this;
    },
    
    /**
     * Configura Firebase para persistencia offline
     * @private
     */
    _setupFirebasePersistence: async function() {
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('Firebase no está disponible para configurar persistencia offline');
                return;
            }
            
            // Habilitar persistencia offline
            await firebase.firestore().enablePersistence({
                synchronizeTabs: true
            });
            
            console.log('Persistencia offline de Firebase habilitada');
            
            // Configurar monitoreo de estado de conexión de Firestore
            firebase.firestore().collection('_connection_status').doc('status')
                .onSnapshot(() => {
                    // Esta callback se ejecutará cuando haya conexión con Firestore
                    if (!this._isOnline) {
                        this._isOnline = true;
                        this._updateOfflineIndicator();
                        this._notifyStateChange('online');
                    }
                }, () => {
                    // Esta callback se ejecutará cuando no haya conexión con Firestore
                    if (this._isOnline) {
                        this._isOnline = false;
                        this._updateOfflineIndicator();
                        this._notifyStateChange('offline');
                    }
                });
        } catch (error) {
            console.error('Error al configurar persistencia offline:', error);
            
            // Si hay un error de múltiples pestañas, mostrar mensaje informativo
            if (error.code === 'failed-precondition') {
                console.warn('La persistencia offline ya está habilitada en otra pestaña');
            }
        }
    },
    
    /**
     * Configura listeners para detectar cambios en la conexión
     * @private
     */
    _setupConnectionListeners: function() {
        // Listener para evento online
        window.addEventListener('online', () => {
            this._isOnline = true;
            this._updateOfflineIndicator();
            this._notifyStateChange('online');
        });
        
        // Listener para evento offline
        window.addEventListener('offline', () => {
            this._isOnline = false;
            this._updateOfflineIndicator();
            this._notifyStateChange('offline');
        });
    },
    
    /**
     * Actualiza el indicador de estado offline en la UI
     * @private
     */
    _updateOfflineIndicator: function() {
        // Eliminar indicador existente si hay
        const existingIndicator = document.querySelector('.offline-indicator');
        if (existingIndicator) {
            existingIndicator.parentNode.removeChild(existingIndicator);
        }
        
        // Si estamos offline, mostrar indicador
        if (!this._isOnline) {
            const indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.textContent = 'Sin conexión - Los cambios se sincronizarán cuando vuelvas a estar en línea';
            document.body.prepend(indicator);
        }
    },
    
    /**
     * Notifica a los callbacks registrados sobre un cambio de estado
     * @private
     * @param {string} state - Estado de conexión ('online' o 'offline')
     */
    _notifyStateChange: function(state) {
        this._callbacks[state].forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error(`Error en callback de ${state}:`, error);
            }
        });
    },
    
    /**
     * Registra un callback para cuando la conexión esté online
     * @param {Function} callback - Función a llamar cuando la conexión esté online
     * @returns {Function} - Función para cancelar el registro
     */
    onOnline: function(callback) {
        this._callbacks.online.push(callback);
        
        // Devolver función para cancelar
        return () => {
            const index = this._callbacks.online.indexOf(callback);
            if (index !== -1) {
                this._callbacks.online.splice(index, 1);
            }
        };
    },
    
    /**
     * Registra un callback para cuando la conexión esté offline
     * @param {Function} callback - Función a llamar cuando la conexión esté offline
     * @returns {Function} - Función para cancelar el registro
     */
    onOffline: function(callback) {
        this._callbacks.offline.push(callback);
        
        // Devolver función para cancelar
        return () => {
            const index = this._callbacks.offline.indexOf(callback);
            if (index !== -1) {
                this._callbacks.offline.splice(index, 1);
            }
        };
    },
    
    /**
     * Verifica si la aplicación está online
     * @returns {boolean} - true si está online, false si está offline
     */
    isOnline: function() {
        return this._isOnline;
    },
    
    /**
     * Verifica si la aplicación está offline
     * @returns {boolean} - true si está offline, false si está online
     */
    isOffline: function() {
        return !this._isOnline;
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseOffline;
} else {
    // Para uso en navegador
    window.FirebaseOffline = FirebaseOffline;
}
