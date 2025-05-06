/**
 * firebase-notifications.js
 * Sistema de notificaciones para la aplicación Comedor Empresarial
 * Proporciona funcionalidades para mostrar notificaciones en tiempo real
 * basadas en cambios en Firestore y eventos del sistema.
 */

import { getFirestore, collection, doc, onSnapshot, query, where, orderBy, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { logError, logCustomEvent } from './firebase-monitoring.js';
import { FirestoreUtil } from './firebase-storage.js';

// Obtener instancias de Firebase
const db = getFirestore();
const auth = getAuth();

/**
 * Sistema de notificaciones para la aplicación
 */
const FirebaseNotifications = {
    // Configuración
    config: {
        maxNotifications: 50,         // Máximo número de notificaciones a almacenar
        defaultTTL: 7 * 24 * 60 * 60, // Tiempo de vida por defecto (7 días en segundos)
        autoCleanup: true,            // Limpiar automáticamente notificaciones antiguas
        notificationSound: true,       // Reproducir sonido al recibir notificación
        desktopNotifications: true,    // Mostrar notificaciones de escritorio
        collection: 'notifications'    // Nombre de la colección en Firestore
    },
    
    // Estado interno
    _state: {
        listeners: {},                // Listeners activos
        unreadCount: 0,               // Contador de notificaciones no leídas
        initialized: false,           // Si el sistema está inicializado
        currentUser: null,            // Usuario actual
        callbacks: {                  // Callbacks para eventos
            onNotificationReceived: [],
            onNotificationRead: [],
            onUnreadCountChanged: []
        }
    },
    
    /**
     * Inicializa el sistema de notificaciones
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
     */
    initialize: async function() {
        try {
            if (this._state.initialized) {
                return true;
            }
            
            // Solicitar permiso para notificaciones de escritorio
            if (this.config.desktopNotifications && 'Notification' in window) {
                if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    await Notification.requestPermission();
                }
            }
            
            // Escuchar cambios en la autenticación
            onAuthStateChanged(auth, (user) => {
                this._state.currentUser = user;
                
                if (user) {
                    // Si hay un usuario autenticado, iniciar escucha de notificaciones
                    this._startListeningToNotifications(user.uid);
                    
                    // Limpiar notificaciones antiguas si está habilitado
                    if (this.config.autoCleanup) {
                        this._cleanupOldNotifications(user.uid);
                    }
                } else {
                    // Si no hay usuario, detener escucha
                    this._stopListeningToNotifications();
                }
            });
            
            this._state.initialized = true;
            
            logCustomEvent('notifications_initialized', {
                desktopEnabled: this.config.desktopNotifications,
                soundEnabled: this.config.notificationSound
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'initialize_notifications' });
            console.error('Error al inicializar notificaciones:', error);
            return false;
        }
    },
    
    /**
     * Crea una nueva notificación
     * @param {Object} notification - Datos de la notificación
     * @param {string} notification.title - Título de la notificación
     * @param {string} notification.message - Mensaje de la notificación
     * @param {string} notification.type - Tipo de notificación (info, success, warning, error)
     * @param {string} notification.targetUserId - ID del usuario destinatario (opcional, si es null es para todos)
     * @param {string} notification.relatedDocId - ID del documento relacionado (opcional)
     * @param {string} notification.relatedCollection - Colección del documento relacionado (opcional)
     * @param {number} notification.ttl - Tiempo de vida en segundos (opcional, por defecto 7 días)
     * @returns {Promise<string>} - Promesa que resuelve con el ID de la notificación creada
     */
    createNotification: async function(notification) {
        try {
            // Validar datos mínimos
            if (!notification.title || !notification.message) {
                throw new Error('La notificación debe tener título y mensaje');
            }
            
            // Establecer valores por defecto
            const type = notification.type || 'info';
            const ttl = notification.ttl || this.config.defaultTTL;
            
            // Crear objeto de notificación
            const notificationData = {
                title: notification.title,
                message: notification.message,
                type: type,
                createdAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(new Date(Date.now() + ttl * 1000)),
                read: false,
                targetUserId: notification.targetUserId || null,
                relatedDocId: notification.relatedDocId || null,
                relatedCollection: notification.relatedCollection || null,
                createdBy: this._state.currentUser ? this._state.currentUser.uid : 'system'
            };
            
            // Guardar en Firestore
            const notificationRef = await FirestoreUtil.add(this.config.collection, notificationData);
            
            logCustomEvent('notification_created', {
                type: type,
                targetType: notification.targetUserId ? 'specific_user' : 'all_users'
            });
            
            return notificationRef.id;
        } catch (error) {
            logError(error, { operation: 'create_notification' });
            console.error('Error al crear notificación:', error);
            throw error;
        }
    },
    
    /**
     * Marca una notificación como leída
     * @param {string} notificationId - ID de la notificación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se marcó correctamente
     */
    markAsRead: async function(notificationId) {
        try {
            await FirestoreUtil.update(this.config.collection, notificationId, {
                read: true,
                readAt: Timestamp.now()
            });
            
            // Disparar callbacks
            this._triggerCallbacks('onNotificationRead', notificationId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'mark_notification_read', notificationId });
            console.error('Error al marcar notificación como leída:', error);
            return false;
        }
    },
    
    /**
     * Marca todas las notificaciones como leídas
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se marcaron correctamente
     */
    markAllAsRead: async function() {
        try {
            if (!this._state.currentUser) {
                throw new Error('Usuario no autenticado');
            }
            
            const userId = this._state.currentUser.uid;
            
            // Obtener notificaciones no leídas
            const notifications = await this._getUserUnreadNotifications(userId);
            
            // Marcar cada una como leída
            const promises = notifications.map(notification => 
                this.markAsRead(notification.id)
            );
            
            await Promise.all(promises);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'mark_all_notifications_read' });
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            return false;
        }
    },
    
    /**
     * Elimina una notificación
     * @param {string} notificationId - ID de la notificación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteNotification: async function(notificationId) {
        try {
            await FirestoreUtil.delete(this.config.collection, notificationId);
            return true;
        } catch (error) {
            logError(error, { operation: 'delete_notification', notificationId });
            console.error('Error al eliminar notificación:', error);
            return false;
        }
    },
    
    /**
     * Obtiene las notificaciones del usuario actual
     * @param {Object} options - Opciones de consulta
     * @param {boolean} options.onlyUnread - Si solo se deben obtener las no leídas
     * @param {number} options.limit - Límite de notificaciones a obtener
     * @returns {Promise<Array>} - Promesa que resuelve con un array de notificaciones
     */
    getUserNotifications: async function(options = {}) {
        try {
            if (!this._state.currentUser) {
                return [];
            }
            
            const userId = this._state.currentUser.uid;
            const defaultOptions = {
                onlyUnread: false,
                limit: this.config.maxNotifications
            };
            
            const queryOptions = { ...defaultOptions, ...options };
            
            // Construir consulta
            let constraints = [
                where('expiresAt', '>', Timestamp.now()),
                orderBy('expiresAt', 'desc'),
                orderBy('createdAt', 'desc'),
                limit(queryOptions.limit)
            ];
            
            // Filtrar por usuario (notificaciones para este usuario o para todos)
            constraints.unshift(
                where('targetUserId', 'in', [userId, null])
            );
            
            // Filtrar por no leídas si es necesario
            if (queryOptions.onlyUnread) {
                constraints.unshift(where('read', '==', false));
            }
            
            // Ejecutar consulta
            const q = query(collection(db, this.config.collection), ...constraints);
            const querySnapshot = await getDocs(q);
            
            // Procesar resultados
            const notifications = [];
            querySnapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            logError(error, { operation: 'get_user_notifications' });
            console.error('Error al obtener notificaciones del usuario:', error);
            return [];
        }
    },
    
    /**
     * Obtiene el número de notificaciones no leídas
     * @returns {Promise<number>} - Promesa que resuelve con el número de notificaciones no leídas
     */
    getUnreadCount: async function() {
        try {
            if (!this._state.currentUser) {
                return 0;
            }
            
            const userId = this._state.currentUser.uid;
            
            // Construir consulta
            const q = query(
                collection(db, this.config.collection),
                where('targetUserId', 'in', [userId, null]),
                where('read', '==', false),
                where('expiresAt', '>', Timestamp.now())
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            logError(error, { operation: 'get_unread_count' });
            console.error('Error al obtener conteo de notificaciones no leídas:', error);
            return 0;
        }
    },
    
    /**
     * Registra un callback para cuando se recibe una notificación
     * @param {Function} callback - Función a llamar cuando se recibe una notificación
     */
    onNotificationReceived: function(callback) {
        if (typeof callback === 'function') {
            this._state.callbacks.onNotificationReceived.push(callback);
        }
    },
    
    /**
     * Registra un callback para cuando se lee una notificación
     * @param {Function} callback - Función a llamar cuando se lee una notificación
     */
    onNotificationRead: function(callback) {
        if (typeof callback === 'function') {
            this._state.callbacks.onNotificationRead.push(callback);
        }
    },
    
    /**
     * Registra un callback para cuando cambia el contador de no leídas
     * @param {Function} callback - Función a llamar cuando cambia el contador
     */
    onUnreadCountChanged: function(callback) {
        if (typeof callback === 'function') {
            this._state.callbacks.onUnreadCountChanged.push(callback);
        }
    },
    
    /**
     * Inicia la escucha de notificaciones para un usuario
     * @private
     * @param {string} userId - ID del usuario
     */
    _startListeningToNotifications: function(userId) {
        // Detener listeners previos si existen
        this._stopListeningToNotifications();
        
        // Construir consulta para notificaciones nuevas (para este usuario o para todos)
        const q = query(
            collection(db, this.config.collection),
            where('targetUserId', 'in', [userId, null]),
            where('expiresAt', '>', Timestamp.now()),
            orderBy('expiresAt', 'desc'),
            orderBy('createdAt', 'desc')
        );
        
        // Iniciar escucha
        this._state.listeners.notifications = onSnapshot(q, (snapshot) => {
            // Procesar cambios
            snapshot.docChanges().forEach(change => {
                const notification = {
                    id: change.doc.id,
                    ...change.doc.data()
                };
                
                // Si es una notificación nueva
                if (change.type === 'added' && !notification.read) {
                    // Actualizar contador
                    this._state.unreadCount++;
                    
                    // Mostrar notificación
                    this._showNotification(notification);
                    
                    // Disparar callbacks
                    this._triggerCallbacks('onNotificationReceived', notification);
                }
                
                // Si se modificó una notificación (ej: se marcó como leída)
                if (change.type === 'modified') {
                    const oldNotification = change.oldIndex >= 0 ? 
                        snapshot.docs[change.oldIndex].data() : null;
                    
                    // Si pasó de no leída a leída
                    if (oldNotification && !oldNotification.read && notification.read) {
                        this._state.unreadCount = Math.max(0, this._state.unreadCount - 1);
                    }
                }
                
                // Si se eliminó una notificación no leída
                if (change.type === 'removed' && !notification.read) {
                    this._state.unreadCount = Math.max(0, this._state.unreadCount - 1);
                }
            });
            
            // Disparar callbacks de cambio en contador
            this._triggerCallbacks('onUnreadCountChanged', this._state.unreadCount);
        });
    },
    
    /**
     * Detiene la escucha de notificaciones
     * @private
     */
    _stopListeningToNotifications: function() {
        // Detener cada listener
        Object.values(this._state.listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        // Reiniciar estado
        this._state.listeners = {};
        this._state.unreadCount = 0;
    },
    
    /**
     * Muestra una notificación al usuario
     * @private
     * @param {Object} notification - Datos de la notificación
     */
    _showNotification: function(notification) {
        // Mostrar notificación de escritorio si está habilitado
        if (this.config.desktopNotifications && 
            'Notification' in window && 
            Notification.permission === 'granted') {
            
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/img/logo.png' // Asegúrate de tener este archivo
            });
            
            // Cerrar después de 5 segundos
            setTimeout(() => {
                desktopNotification.close();
            }, 5000);
            
            // Al hacer clic, marcar como leída
            desktopNotification.onclick = () => {
                this.markAsRead(notification.id);
                
                // Si hay un documento relacionado, redirigir
                if (notification.relatedCollection && notification.relatedDocId) {
                    // Implementar redirección según la colección
                    // (esto dependerá de la estructura de tu aplicación)
                }
                
                desktopNotification.close();
            };
        }
        
        // Reproducir sonido si está habilitado
        if (this.config.notificationSound) {
            this._playNotificationSound();
        }
    },
    
    /**
     * Reproduce un sonido de notificación
     * @private
     */
    _playNotificationSound: function() {
        try {
            // Crear elemento de audio
            const audio = new Audio('/sounds/notification.mp3'); // Asegúrate de tener este archivo
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('Error al reproducir sonido de notificación:', error);
        }
    },
    
    /**
     * Obtiene las notificaciones no leídas de un usuario
     * @private
     * @param {string} userId - ID del usuario
     * @returns {Promise<Array>} - Promesa que resuelve con un array de notificaciones
     */
    _getUserUnreadNotifications: async function(userId) {
        try {
            // Construir consulta
            const q = query(
                collection(db, this.config.collection),
                where('targetUserId', 'in', [userId, null]),
                where('read', '==', false),
                where('expiresAt', '>', Timestamp.now())
            );
            
            const querySnapshot = await getDocs(q);
            
            // Procesar resultados
            const notifications = [];
            querySnapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return notifications;
        } catch (error) {
            logError(error, { operation: '_getUserUnreadNotifications' });
            console.error('Error al obtener notificaciones no leídas:', error);
            return [];
        }
    },
    
    /**
     * Limpia notificaciones antiguas
     * @private
     * @param {string} userId - ID del usuario
     */
    _cleanupOldNotifications: async function(userId) {
        try {
            // Obtener notificaciones expiradas
            const q = query(
                collection(db, this.config.collection),
                where('targetUserId', '==', userId),
                where('expiresAt', '<', Timestamp.now())
            );
            
            const querySnapshot = await getDocs(q);
            
            // Eliminar cada notificación expirada
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            if (querySnapshot.size > 0) {
                await batch.commit();
                
                logCustomEvent('notifications_cleaned_up', {
                    count: querySnapshot.size
                });
            }
        } catch (error) {
            logError(error, { operation: '_cleanupOldNotifications' });
            console.error('Error al limpiar notificaciones antiguas:', error);
        }
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
    }
};

export default FirebaseNotifications;
