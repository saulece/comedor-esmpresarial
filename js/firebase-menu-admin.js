/**
 * firebase-menu-admin.js
 * Adaptación de la funcionalidad de administración de menús para usar Firebase
 * Este módulo proporciona funciones para gestionar menús semanales
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
 * Administrador de menús usando Firebase
 */
const FirebaseMenuAdmin = {
    // Configuración
    config: {
        collection: 'menus',
        activeMenuKey: 'activeMenu',
        settingsCollection: 'settings'
    },
    
    // Estado interno
    _state: {
        listeners: {},
        initialized: false,
        currentUser: null
    },
    
    /**
     * Inicializa el administrador de menús
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
            
            logCustomEvent('menu_admin_initialized', {
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'initialize_menu_admin' });
            console.error('Error al inicializar administrador de menús:', error);
            return false;
        }
    },
    
    /**
     * Crea un nuevo menú semanal
     * @param {Object} menu - Datos del menú
     * @param {string} menu.id - ID único del menú (generalmente la fecha de inicio de semana)
     * @param {string} menu.name - Nombre del menú
     * @param {Object} menu.dishes - Platos por día
     * @param {Array} menu.dishes.monday - Platos del lunes
     * @param {Array} menu.dishes.tuesday - Platos del martes
     * @param {Array} menu.dishes.wednesday - Platos del miércoles
     * @param {Array} menu.dishes.thursday - Platos del jueves
     * @param {Array} menu.dishes.friday - Platos del viernes
     * @returns {Promise<string>} - Promesa que resuelve con el ID del menú creado
     */
    createMenu: async function(menu) {
        try {
            // Validar datos mínimos
            if (!menu.id || !menu.name || !menu.dishes) {
                throw new Error('El menú debe tener ID, nombre y platos');
            }
            
            // Asegurar que todos los días tienen un array de platos
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            days.forEach(day => {
                if (!menu.dishes[day] || !Array.isArray(menu.dishes[day])) {
                    menu.dishes[day] = [];
                }
            });
            
            // Agregar metadatos
            const menuData = {
                ...menu,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: this._state.currentUser ? this._state.currentUser.uid : 'system',
                active: false
            };
            
            // Guardar en Firestore
            await FirestoreUtil.save(this.config.collection, menu.id, menuData);
            
            // Registrar evento
            logCustomEvent('menu_created', {
                menuId: menu.id,
                menuName: menu.name
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Nuevo Menú Creado',
                message: `Se ha creado el menú "${menu.name}"`,
                type: 'info',
                relatedDocId: menu.id,
                relatedCollection: this.config.collection
            });
            
            return menu.id;
        } catch (error) {
            logError(error, { operation: 'create_menu' });
            console.error('Error al crear menú:', error);
            throw error;
        }
    },
    
    /**
     * Actualiza un menú existente
     * @param {string} menuId - ID del menú a actualizar
     * @param {Object} menuData - Datos a actualizar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateMenu: async function(menuId, menuData) {
        try {
            // Obtener menú actual
            const currentMenu = await this.getMenuById(menuId);
            
            if (!currentMenu) {
                throw new Error(`No se encontró el menú con ID ${menuId}`);
            }
            
            // Preparar datos para actualizar
            const updatedMenu = {
                ...currentMenu,
                ...menuData,
                updatedAt: Timestamp.now()
            };
            
            // Guardar en Firestore
            await FirestoreUtil.save(this.config.collection, menuId, updatedMenu);
            
            // Registrar evento
            logCustomEvent('menu_updated', {
                menuId: menuId,
                menuName: updatedMenu.name
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Menú Actualizado',
                message: `Se ha actualizado el menú "${updatedMenu.name}"`,
                type: 'info',
                relatedDocId: menuId,
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'update_menu', menuId });
            console.error(`Error al actualizar menú ${menuId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                FirebaseOffline.registerPendingOperation({
                    type: 'update',
                    collection: this.config.collection,
                    id: menuId,
                    data: { ...menuData, updatedAt: new Date() }
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Elimina un menú
     * @param {string} menuId - ID del menú a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteMenu: async function(menuId) {
        try {
            // Verificar si es el menú activo
            const isActive = await this.isActiveMenu(menuId);
            
            if (isActive) {
                throw new Error('No se puede eliminar el menú activo. Desactívelo primero.');
            }
            
            // Obtener nombre del menú para la notificación
            const menu = await this.getMenuById(menuId);
            const menuName = menu ? menu.name : 'Desconocido';
            
            // Eliminar de Firestore
            await FirestoreUtil.delete(this.config.collection, menuId);
            
            // Registrar evento
            logCustomEvent('menu_deleted', {
                menuId: menuId,
                menuName: menuName
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Menú Eliminado',
                message: `Se ha eliminado el menú "${menuName}"`,
                type: 'warning',
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'delete_menu', menuId });
            console.error(`Error al eliminar menú ${menuId}:`, error);
            
            // Si estamos offline, registrar operación pendiente
            if (FirebaseOffline.isOffline()) {
                FirebaseOffline.registerPendingOperation({
                    type: 'delete',
                    collection: this.config.collection,
                    id: menuId
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Obtiene un menú por su ID
     * @param {string} menuId - ID del menú
     * @returns {Promise<Object|null>} - Promesa que resuelve con el menú o null si no existe
     */
    getMenuById: async function(menuId) {
        try {
            return await FirestoreUtil.getById(this.config.collection, menuId);
        } catch (error) {
            logError(error, { operation: 'get_menu_by_id', menuId });
            console.error(`Error al obtener menú ${menuId}:`, error);
            return null;
        }
    },
    
    /**
     * Obtiene todos los menús
     * @param {Object} options - Opciones de consulta
     * @param {boolean} options.onlyActive - Si solo se deben obtener los menús activos
     * @param {number} options.limit - Límite de menús a obtener
     * @returns {Promise<Array>} - Promesa que resuelve con un array de menús
     */
    getAllMenus: async function(options = {}) {
        try {
            const defaultOptions = {
                onlyActive: false,
                limit: 50
            };
            
            const queryOptions = { ...defaultOptions, ...options };
            
            if (queryOptions.onlyActive) {
                return await FirestoreUtil.query(
                    this.config.collection,
                    'active',
                    '==',
                    true,
                    queryOptions.limit
                );
            }
            
            return await FirestoreUtil.getAll(this.config.collection, queryOptions.limit);
        } catch (error) {
            logError(error, { operation: 'get_all_menus' });
            console.error('Error al obtener todos los menús:', error);
            return [];
        }
    },
    
    /**
     * Establece un menú como activo
     * @param {string} menuId - ID del menú a activar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se activó correctamente
     */
    setActiveMenu: async function(menuId) {
        try {
            // Verificar que el menú existe
            const menu = await this.getMenuById(menuId);
            
            if (!menu) {
                throw new Error(`No se encontró el menú con ID ${menuId}`);
            }
            
            // Obtener menú activo actual
            const currentActiveMenu = await this.getActiveMenu();
            
            // Si hay un menú activo, desactivarlo
            if (currentActiveMenu && currentActiveMenu.id !== menuId) {
                await this.updateMenu(currentActiveMenu.id, { active: false });
            }
            
            // Activar el nuevo menú
            await this.updateMenu(menuId, { active: true });
            
            // Actualizar configuración global
            await FirestoreUtil.save(
                this.config.settingsCollection,
                this.config.activeMenuKey,
                { menuId, updatedAt: Timestamp.now() }
            );
            
            // Registrar evento
            logCustomEvent('menu_activated', {
                menuId: menuId,
                menuName: menu.name
            });
            
            // Crear notificación
            await FirebaseNotifications.createNotification({
                title: 'Menú Activado',
                message: `Se ha activado el menú "${menu.name}"`,
                type: 'success',
                relatedDocId: menuId,
                relatedCollection: this.config.collection
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'set_active_menu', menuId });
            console.error(`Error al activar menú ${menuId}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtiene el menú activo actual
     * @returns {Promise<Object|null>} - Promesa que resuelve con el menú activo o null si no hay
     */
    getActiveMenu: async function() {
        try {
            // Intentar obtener desde la configuración global
            const activeMenuConfig = await FirestoreUtil.getById(
                this.config.settingsCollection,
                this.config.activeMenuKey
            );
            
            if (activeMenuConfig && activeMenuConfig.menuId) {
                return await this.getMenuById(activeMenuConfig.menuId);
            }
            
            // Si no hay configuración, buscar por el campo active
            const activeMenus = await FirestoreUtil.query(
                this.config.collection,
                'active',
                '==',
                true,
                1
            );
            
            if (activeMenus && activeMenus.length > 0) {
                return activeMenus[0];
            }
            
            return null;
        } catch (error) {
            logError(error, { operation: 'get_active_menu' });
            console.error('Error al obtener menú activo:', error);
            return null;
        }
    },
    
    /**
     * Verifica si un menú es el activo
     * @param {string} menuId - ID del menú a verificar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si el menú es el activo
     */
    isActiveMenu: async function(menuId) {
        try {
            const activeMenu = await this.getActiveMenu();
            return activeMenu && activeMenu.id === menuId;
        } catch (error) {
            logError(error, { operation: 'is_active_menu', menuId });
            console.error(`Error al verificar si el menú ${menuId} es activo:`, error);
            return false;
        }
    },
    
    /**
     * Escucha cambios en los menús
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToMenus: function(callback) {
        try {
            // Cancelar escucha previa si existe
            if (this._state.listeners.menus) {
                this._state.listeners.menus();
            }
            
            // Crear nueva escucha
            const q = query(
                collection(db, this.config.collection),
                orderBy('createdAt', 'desc')
            );
            
            this._state.listeners.menus = onSnapshot(q, (snapshot) => {
                const menus = [];
                snapshot.forEach((doc) => {
                    menus.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                callback(menus);
            }, (error) => {
                logError(error, { operation: 'listen_to_menus' });
                console.error('Error al escuchar cambios en menús:', error);
            });
            
            return this._state.listeners.menus;
        } catch (error) {
            logError(error, { operation: 'listen_to_menus' });
            console.error('Error al configurar escucha de menús:', error);
            return () => {};
        }
    },
    
    /**
     * Escucha cambios en el menú activo
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToActiveMenu: function(callback) {
        try {
            // Cancelar escucha previa si existe
            if (this._state.listeners.activeMenu) {
                this._state.listeners.activeMenu();
            }
            
            // Crear nueva escucha
            const docRef = doc(db, this.config.settingsCollection, this.config.activeMenuKey);
            
            this._state.listeners.activeMenu = onSnapshot(docRef, async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const { menuId } = docSnapshot.data();
                    const menu = await this.getMenuById(menuId);
                    callback(menu);
                } else {
                    callback(null);
                }
            }, (error) => {
                logError(error, { operation: 'listen_to_active_menu' });
                console.error('Error al escuchar cambios en menú activo:', error);
            });
            
            return this._state.listeners.activeMenu;
        } catch (error) {
            logError(error, { operation: 'listen_to_active_menu' });
            console.error('Error al configurar escucha de menú activo:', error);
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

export default FirebaseMenuAdmin;
