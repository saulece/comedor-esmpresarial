/**
 * firebase-menu-model.js
 * Adaptador para el modelo de Menú con Firebase Firestore
 * Este módulo proporciona funciones para gestionar los menús en Firestore
 */

import { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from './firebase-config.js';
import { logReadOperation, logWriteOperation, logDeleteOperation, logError } from './firebase-monitoring.js';

const MenuModel = {
    /**
     * Colección en Firestore
     */
    COLLECTION: 'menus',

    /**
     * Crea un nuevo menú
     * @param {Object} menu - Datos del menú
     * @returns {Promise<string>} - Promesa que resuelve con el ID del menú creado
     */
    create: async function(menu) {
        try {
            // Validar menú
            if (!menu.id) {
                menu.id = 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Asegurar que tenga las fechas
            if (!menu.createdAt) {
                menu.createdAt = new Date().toISOString();
            }
            
            menu.updatedAt = new Date().toISOString();
            
            // Guardar en Firestore
            await setDoc(doc(db, this.COLLECTION, menu.id), menu);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, menu.id);
            
            return menu.id;
        } catch (error) {
            logError(error, { operation: 'createMenu', menu });
            throw error;
        }
    },

    /**
     * Obtiene un menú por su ID
     * @param {string} menuId - ID del menú
     * @returns {Promise<Object|null>} - Promesa que resuelve con el menú o null si no existe
     */
    getById: async function(menuId) {
        try {
            const menuDoc = await getDoc(doc(db, this.COLLECTION, menuId));
            
            // Registrar operación
            logReadOperation(this.COLLECTION, menuId);
            
            if (menuDoc.exists()) {
                return menuDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            logError(error, { operation: 'getMenuById', menuId });
            throw error;
        }
    },

    /**
     * Obtiene todos los menús
     * @returns {Promise<Array>} - Promesa que resuelve con un array de menús
     */
    getAll: async function() {
        try {
            const menusSnapshot = await getDocs(collection(db, this.COLLECTION));
            const menus = [];
            
            menusSnapshot.forEach((doc) => {
                menus.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return menus;
        } catch (error) {
            logError(error, { operation: 'getAllMenus' });
            throw error;
        }
    },

    /**
     * Obtiene los menús activos
     * @returns {Promise<Array>} - Promesa que resuelve con un array de menús activos
     */
    getActive: async function() {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('active', '==', true)
            );
            
            const menusSnapshot = await getDocs(q);
            const menus = [];
            
            menusSnapshot.forEach((doc) => {
                menus.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return menus;
        } catch (error) {
            logError(error, { operation: 'getActiveMenus' });
            throw error;
        }
    },

    /**
     * Obtiene los menús para una fecha específica
     * @param {string} date - Fecha en formato ISO (YYYY-MM-DD)
     * @returns {Promise<Array>} - Promesa que resuelve con un array de menús para la fecha
     */
    getByDate: async function(date) {
        try {
            // Normalizar fecha
            if (date instanceof Date) {
                date = date.toISOString().split('T')[0];
            }
            
            const q = query(
                collection(db, this.COLLECTION),
                where('date', '==', date)
            );
            
            const menusSnapshot = await getDocs(q);
            const menus = [];
            
            menusSnapshot.forEach((doc) => {
                menus.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return menus;
        } catch (error) {
            logError(error, { operation: 'getMenusByDate', date });
            throw error;
        }
    },

    /**
     * Actualiza un menú
     * @param {string} menuId - ID del menú
     * @param {Object} menuData - Datos actualizados del menú
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(menuId, menuData) {
        try {
            // Asegurar que no se modifique el ID
            delete menuData.id;
            
            // Actualizar fecha de modificación
            menuData.updatedAt = new Date().toISOString();
            
            // Actualizar en Firestore
            await updateDoc(doc(db, this.COLLECTION, menuId), menuData);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, menuId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateMenu', menuId });
            throw error;
        }
    },

    /**
     * Elimina un menú
     * @param {string} menuId - ID del menú
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(menuId) {
        try {
            // Eliminar de Firestore
            await deleteDoc(doc(db, this.COLLECTION, menuId));
            
            // Registrar operación
            logDeleteOperation(this.COLLECTION, menuId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'deleteMenu', menuId });
            throw error;
        }
    },

    /**
     * Activa un menú y desactiva los demás
     * @param {string} menuId - ID del menú a activar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se activó correctamente
     */
    activate: async function(menuId) {
        try {
            // Obtener menús activos
            const activeMenus = await this.getActive();
            
            // Desactivar menús activos
            for (const menu of activeMenus) {
                if (menu.id !== menuId) {
                    await updateDoc(doc(db, this.COLLECTION, menu.id), {
                        active: false,
                        updatedAt: new Date().toISOString()
                    });
                    
                    // Registrar operación
                    logWriteOperation(this.COLLECTION, menu.id);
                }
            }
            
            // Activar el menú seleccionado
            await updateDoc(doc(db, this.COLLECTION, menuId), {
                active: true,
                updatedAt: new Date().toISOString()
            });
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, menuId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'activateMenu', menuId });
            throw error;
        }
    },

    /**
     * Agrega un platillo a un menú
     * @param {string} menuId - ID del menú
     * @param {Object} item - Platillo a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    addItem: async function(menuId, item) {
        try {
            // Obtener menú actual
            const menu = await this.getById(menuId);
            
            if (!menu) {
                throw new Error('Menú no encontrado');
            }
            
            // Verificar que tenga un array de items
            if (!Array.isArray(menu.items)) {
                menu.items = [];
            }
            
            // Generar ID para el item si no tiene
            if (!item.id) {
                item.id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            }
            
            // Agregar item
            menu.items.push(item);
            
            // Actualizar menú
            await this.update(menuId, {
                items: menu.items,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'addItemToMenu', menuId });
            throw error;
        }
    },

    /**
     * Elimina un platillo de un menú
     * @param {string} menuId - ID del menú
     * @param {string} itemId - ID del platillo
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    removeItem: async function(menuId, itemId) {
        try {
            // Obtener menú actual
            const menu = await this.getById(menuId);
            
            if (!menu) {
                throw new Error('Menú no encontrado');
            }
            
            // Verificar que tenga un array de items
            if (!Array.isArray(menu.items)) {
                return false;
            }
            
            // Filtrar items
            const newItems = menu.items.filter(item => item.id !== itemId);
            
            // Verificar si se eliminó algún item
            if (newItems.length === menu.items.length) {
                return false;
            }
            
            // Actualizar menú
            await this.update(menuId, {
                items: newItems,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'removeItemFromMenu', menuId, itemId });
            throw error;
        }
    },

    /**
     * Actualiza un platillo en un menú
     * @param {string} menuId - ID del menú
     * @param {string} itemId - ID del platillo
     * @param {Object} itemData - Datos actualizados del platillo
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateItem: async function(menuId, itemId, itemData) {
        try {
            // Obtener menú actual
            const menu = await this.getById(menuId);
            
            if (!menu) {
                throw new Error('Menú no encontrado');
            }
            
            // Verificar que tenga un array de items
            if (!Array.isArray(menu.items)) {
                return false;
            }
            
            // Buscar índice del item
            const index = menu.items.findIndex(item => item.id === itemId);
            
            if (index === -1) {
                return false;
            }
            
            // Actualizar item
            menu.items[index] = {
                ...menu.items[index],
                ...itemData,
                id: itemId // Asegurar que no se cambie el ID
            };
            
            // Actualizar menú
            await this.update(menuId, {
                items: menu.items,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateItemInMenu', menuId, itemId });
            throw error;
        }
    }
};

export default MenuModel;
