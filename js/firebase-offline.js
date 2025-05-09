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
     * @returns {Promise<void>} - Promesa que se resuelve cuando se completa la inicialización
     */
    init: async function() {
        console.log('Iniciando módulo de funcionalidad offline...');
        
        try {
            // Configurar Firebase para persistencia offline (esperar a que se complete)
            await this._setupFirebasePersistence();
            
            // Configurar listeners para detectar cambios en la conexión
            this._setupConnectionListeners();
            
            // Mostrar indicador de estado inicial
            this._updateOfflineIndicator();
            
            console.log('Módulo de funcionalidad offline inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar módulo offline:', error);
        }
        
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
            
            // Variable para verificar si ya se intentó habilitar la persistencia
            if (window._firebasePersistenceEnabled) {
                console.log('La persistencia offline ya fue configurada anteriormente');
                return;
            }
            
            // Intentar habilitar persistencia offline con manejo de errores mejorado
            try {
                await firebase.firestore().enablePersistence({
                    synchronizeTabs: true
                });
                window._firebasePersistenceEnabled = true;
                console.log('Persistencia offline de Firebase habilitada correctamente');
            } catch (persistenceError) {
                // Manejar error de múltiples pestañas
                if (persistenceError.code === 'failed-precondition') {
                    console.log('La persistencia offline ya está habilitada en otra pestaña. Esto es normal.');
                    window._firebasePersistenceEnabled = true; // Marcar como habilitada aunque sea en otra pestaña
                } 
                // Manejar error de navegador no compatible
                else if (persistenceError.code === 'unimplemented') {
                    console.warn('Este navegador no soporta persistencia offline de Firebase');
                } 
                // Otros errores
                else {
                    throw persistenceError; // Re-lanzar para el catch externo
                }
            }
            
            // Configurar monitoreo de estado de conexión de Firestore (solo si no hay errores)
            try {
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
            } catch (monitorError) {
                console.warn('No se pudo configurar el monitoreo de conexión:', monitorError);
            }
        } catch (error) {
            // Evitar mostrar errores en la consola para no alarmar al usuario
            console.log('Nota: Se detectó un problema con la persistencia offline, pero la aplicación seguirá funcionando normalmente.');
            console.debug('Detalles del error (solo para desarrollo):', error);
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
            
            // Crear contenido con icono y texto informativo
            indicator.innerHTML = `
                <i class="fas fa-wifi" style="margin-right: 8px;"></i>
                <span>Sin conexión - Los cambios se sincronizarán cuando vuelvas a estar en línea</span>
                <button class="close-btn" style="margin-left: 16px; background: transparent; border: none; color: white; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Agregar al DOM
            document.body.prepend(indicator);
            
            // Configurar botón de cierre
            const closeBtn = indicator.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    indicator.style.display = 'none';
                });
            }
            
            // Mostrar notificación adicional
            this._showOfflineNotification();
        } else {
            // Si estamos online y había un indicador antes (transición offline->online)
            if (existingIndicator) {
                // Mostrar notificación de reconexión
                this._showOnlineNotification();
            }
        }
    },
    
    /**
     * Muestra una notificación cuando se pierde la conexión
     * @private
     */
    _showOfflineNotification: function() {
        if (typeof AppUtils !== 'undefined' && AppUtils.showNotification) {
            AppUtils.showNotification('Trabajando sin conexión. Los cambios se guardarán localmente.', 'warning');
        }
    },
    
    /**
     * Muestra una notificación cuando se recupera la conexión
     * @private
     */
    _showOnlineNotification: function() {
        if (typeof AppUtils !== 'undefined' && AppUtils.showNotification) {
            AppUtils.showNotification('Conexión restablecida. Sincronizando cambios...', 'success');
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
