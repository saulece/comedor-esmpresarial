/**
 * storage-adapter.js
 * Adaptador para la transición de localStorage a Firebase Firestore
 * Este módulo proporciona una interfaz compatible con el StorageUtil existente
 * pero utiliza Firebase Firestore como backend de almacenamiento.
 */

import { FirestoreUtil, FirestoreModules } from './firebase-storage.js';
import FirebaseAuth from './firebase-auth.js';

// Bandera para controlar el modo de almacenamiento
const useFirebase = true; // Cambiar a false para volver a localStorage

// Referencia al módulo StorageUtil original
import * as LocalStorage from './storage.js';
const StorageUtil = LocalStorage.default || LocalStorage;

/**
 * Adaptador que mantiene la misma interfaz que StorageUtil
 * pero utiliza Firebase Firestore como backend
 */
const StorageAdapter = {
    // Mantener las mismas claves que el StorageUtil original
    KEYS: StorageUtil.KEYS,

    /**
     * Inicializa el almacenamiento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
     */
    initStorage: async function() {
        if (useFirebase) {
            try {
                // Inicializar Firebase Auth
                await FirebaseAuth.init();
                
                // Inicializar Firestore
                return await FirestoreUtil.initStorage();
            } catch (error) {
                console.error('Error al inicializar Firebase:', error);
                // Fallback a localStorage si hay error
                return StorageUtil.initStorage();
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.initStorage();
        }
    },

    /**
     * Guarda datos en el almacenamiento
     * @param {string} key - Clave para almacenar los datos
     * @param {any} data - Datos a almacenar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    save: async function(key, data) {
        if (useFirebase) {
            try {
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                if (Array.isArray(data)) {
                    // Si es un array, guardar cada elemento individualmente
                    for (const item of data) {
                        if (!item.id) {
                            console.warn('Elemento sin ID, generando uno nuevo');
                            item.id = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        }
                        await FirestoreUtil.save(collectionName, item.id, item);
                    }
                } else {
                    // Si es un objeto, guardarlo con ID 'main'
                    await FirestoreUtil.save(collectionName, 'main', data);
                }
                
                return true;
            } catch (error) {
                console.error(`Error al guardar datos en Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.save(key, data);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.save(key, data);
        }
    },

    /**
     * Recupera datos del almacenamiento
     * @param {string} key - Clave para recuperar los datos
     * @param {any} defaultValue - Valor por defecto si no se encuentra la clave
     * @returns {Promise<any>} - Promesa que resuelve con los datos recuperados
     */
    get: async function(key, defaultValue = null) {
        if (useFirebase) {
            try {
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                // Obtener todos los documentos de la colección
                const data = await FirestoreUtil.getAll(collectionName);
                
                if (key === this.KEYS.APP_STATE) {
                    // Para APP_STATE, devolver el documento 'main'
                    const appState = await FirestoreUtil.get(collectionName, 'main');
                    return appState || defaultValue;
                } else {
                    // Para colecciones, devolver el array de documentos
                    return data.length > 0 ? data : defaultValue;
                }
            } catch (error) {
                console.error(`Error al recuperar datos de Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.get(key, defaultValue);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.get(key, defaultValue);
        }
    },

    /**
     * Actualiza un elemento específico en una colección almacenada
     * @param {string} key - Clave de la colección
     * @param {string} itemId - ID del elemento a actualizar
     * @param {any} newData - Nuevos datos para el elemento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateItem: async function(key, itemId, newData) {
        if (useFirebase) {
            try {
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                // Preservar el ID original
                newData.id = itemId;
                
                // Actualizar el documento en Firestore
                return await FirestoreUtil.update(collectionName, itemId, newData);
            } catch (error) {
                console.error(`Error al actualizar elemento en Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.updateItem(key, itemId, newData);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.updateItem(key, itemId, newData);
        }
    },

    /**
     * Elimina un elemento de una colección almacenada
     * @param {string} key - Clave de la colección
     * @param {string} itemId - ID del elemento a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteItem: async function(key, itemId) {
        if (useFirebase) {
            try {
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                // Eliminar el documento de Firestore
                return await FirestoreUtil.delete(collectionName, itemId);
            } catch (error) {
                console.error(`Error al eliminar elemento de Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.deleteItem(key, itemId);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.deleteItem(key, itemId);
        }
    },

    /**
     * Agrega un elemento a una colección almacenada
     * @param {string} key - Clave de la colección
     * @param {any} item - Elemento a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    addItem: async function(key, item) {
        if (useFirebase) {
            try {
                // Verificar que el elemento tenga un ID
                if (!item.id) {
                    console.error(`No se puede agregar un elemento sin ID a ${key}`);
                    return false;
                }
                
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                // Guardar el documento en Firestore
                return await FirestoreUtil.save(collectionName, item.id, item);
            } catch (error) {
                console.error(`Error al agregar elemento a Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.addItem(key, item);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.addItem(key, item);
        }
    },

    /**
     * Obtiene un elemento específico de una colección
     * @param {string} key - Clave de la colección
     * @param {string} itemId - ID del elemento a obtener
     * @returns {Promise<any|null>} - Promesa que resuelve con el elemento encontrado o null si no existe
     */
    getItem: async function(key, itemId) {
        if (useFirebase) {
            try {
                // Mapear la clave de localStorage a una colección de Firestore
                const collectionName = this._mapKeyToCollection(key);
                
                // Obtener el documento de Firestore
                return await FirestoreUtil.get(collectionName, itemId);
            } catch (error) {
                console.error(`Error al obtener elemento de Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.getItem(key, itemId);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.getItem(key, itemId);
        }
    },

    /**
     * Elimina una clave del almacenamiento
     * @param {string} key - Clave a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    remove: async function(key) {
        if (useFirebase) {
            try {
                // No es posible eliminar una colección completa en Firestore desde el cliente
                // Se podría implementar eliminando todos los documentos uno por uno
                console.warn('La eliminación de colecciones completas no está implementada en Firebase');
                return false;
            } catch (error) {
                console.error(`Error al eliminar clave de Firebase (${key}):`, error);
                // Fallback a localStorage si hay error
                return StorageUtil.remove(key);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.remove(key);
        }
    },

    /**
     * Limpia todo el almacenamiento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se limpió correctamente
     */
    clear: async function() {
        if (useFirebase) {
            try {
                // No es posible eliminar todas las colecciones desde el cliente
                console.warn('La limpieza completa de Firestore no está implementada desde el cliente');
                return false;
            } catch (error) {
                console.error('Error al limpiar Firebase:', error);
                // Fallback a localStorage si hay error
                return StorageUtil.clear();
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.clear();
        }
    },

    /**
     * Mapea una clave de localStorage a un nombre de colección de Firestore
     * @private
     * @param {string} key - Clave de localStorage
     * @returns {string} - Nombre de la colección en Firestore
     */
    _mapKeyToCollection: function(key) {
        // Eliminar el prefijo 'comedor_' si existe
        const collection = key.replace('comedor_', '');
        return collection;
    },

    // Exportar los módulos específicos para cada entidad
    // Estos módulos mantienen la misma interfaz que los originales
    // pero utilizan Firebase Firestore como backend
    
    // CRUD para Usuarios
    Users: {
        add: async function(user) {
            if (useFirebase) {
                return await FirestoreModules.Users.add(user);
            } else {
                return StorageUtil.Users.add(user);
            }
        },
        
        get: async function(userId) {
            if (useFirebase) {
                return await FirestoreModules.Users.get(userId);
            } else {
                return StorageUtil.Users.get(userId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Users.getAll();
            } else {
                return StorageUtil.Users.getAll();
            }
        },
        
        update: async function(userId, userData) {
            if (useFirebase) {
                return await FirestoreModules.Users.update(userId, userData);
            } else {
                return StorageUtil.Users.update(userId, userData);
            }
        },
        
        delete: async function(userId) {
            if (useFirebase) {
                return await FirestoreModules.Users.delete(userId);
            } else {
                return StorageUtil.Users.delete(userId);
            }
        }
    },
    
    // CRUD para Platillos
    Dishes: {
        add: async function(dish) {
            if (useFirebase) {
                return await FirestoreModules.Dishes.add(dish);
            } else {
                return StorageUtil.Dishes.add(dish);
            }
        },
        
        get: async function(dishId) {
            if (useFirebase) {
                return await FirestoreModules.Dishes.get(dishId);
            } else {
                return StorageUtil.Dishes.get(dishId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Dishes.getAll();
            } else {
                return StorageUtil.Dishes.getAll();
            }
        },
        
        getByCategory: async function(category) {
            if (useFirebase) {
                return await FirestoreModules.Dishes.getByCategory(category);
            } else {
                return StorageUtil.Dishes.getByCategory(category);
            }
        },
        
        update: async function(dishId, dishData) {
            if (useFirebase) {
                return await FirestoreModules.Dishes.update(dishId, dishData);
            } else {
                return StorageUtil.Dishes.update(dishId, dishData);
            }
        },
        
        delete: async function(dishId) {
            if (useFirebase) {
                return await FirestoreModules.Dishes.delete(dishId);
            } else {
                return StorageUtil.Dishes.delete(dishId);
            }
        }
    },
    
    // CRUD para Menús
    Menus: {
        add: async function(menu) {
            if (useFirebase) {
                return await FirestoreModules.Menus.add(menu);
            } else {
                return StorageUtil.Menus.add(menu);
            }
        },
        
        get: async function(menuId) {
            if (useFirebase) {
                return await FirestoreModules.Menus.get(menuId);
            } else {
                return StorageUtil.Menus.get(menuId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Menus.getAll();
            } else {
                return StorageUtil.Menus.getAll();
            }
        },
        
        getActive: async function() {
            if (useFirebase) {
                return await FirestoreModules.Menus.getActive();
            } else {
                return StorageUtil.Menus.getActive();
            }
        },
        
        update: async function(menuId, menuData) {
            if (useFirebase) {
                return await FirestoreModules.Menus.update(menuId, menuData);
            } else {
                return StorageUtil.Menus.update(menuId, menuData);
            }
        },
        
        delete: async function(menuId) {
            if (useFirebase) {
                return await FirestoreModules.Menus.delete(menuId);
            } else {
                return StorageUtil.Menus.delete(menuId);
            }
        }
    },
    
    // CRUD para Coordinadores
    Coordinators: {
        add: async function(coordinator) {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.add(coordinator);
            } else {
                return StorageUtil.Coordinators.add(coordinator);
            }
        },
        
        get: async function(coordinatorId) {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.get(coordinatorId);
            } else {
                return StorageUtil.Coordinators.get(coordinatorId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.getAll();
            } else {
                return StorageUtil.Coordinators.getAll();
            }
        },
        
        getByDepartment: async function(department) {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.getByDepartment(department);
            } else {
                return StorageUtil.Coordinators.getByDepartment(department);
            }
        },
        
        update: async function(coordinatorId, coordinatorData) {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.update(coordinatorId, coordinatorData);
            } else {
                return StorageUtil.Coordinators.update(coordinatorId, coordinatorData);
            }
        },
        
        delete: async function(coordinatorId) {
            if (useFirebase) {
                return await FirestoreModules.Coordinators.delete(coordinatorId);
            } else {
                return StorageUtil.Coordinators.delete(coordinatorId);
            }
        }
    },
    
    // CRUD para Confirmaciones
    Confirmations: {
        add: async function(confirmation) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.add(confirmation);
            } else {
                return StorageUtil.Confirmations.add(confirmation);
            }
        },
        
        get: async function(confirmationId) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.get(confirmationId);
            } else {
                return StorageUtil.Confirmations.get(confirmationId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.getAll();
            } else {
                return StorageUtil.Confirmations.getAll();
            }
        },
        
        getByStatus: async function(status) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.getByStatus(status);
            } else {
                return StorageUtil.Confirmations.getByStatus(status);
            }
        },
        
        getByCoordinator: async function(coordinatorId) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.getByCoordinator(coordinatorId);
            } else {
                return StorageUtil.Confirmations.getByCoordinator(coordinatorId);
            }
        },
        
        update: async function(confirmationId, confirmationData) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.update(confirmationId, confirmationData);
            } else {
                return StorageUtil.Confirmations.update(confirmationId, confirmationData);
            }
        },
        
        delete: async function(confirmationId) {
            if (useFirebase) {
                return await FirestoreModules.Confirmations.delete(confirmationId);
            } else {
                return StorageUtil.Confirmations.delete(confirmationId);
            }
        }
    },
    
    // CRUD para Pedidos
    Orders: {
        add: async function(order) {
            if (useFirebase) {
                return await FirestoreModules.Orders.add(order);
            } else {
                return StorageUtil.Orders.add(order);
            }
        },
        
        get: async function(orderId) {
            if (useFirebase) {
                return await FirestoreModules.Orders.get(orderId);
            } else {
                return StorageUtil.Orders.get(orderId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.Orders.getAll();
            } else {
                return StorageUtil.Orders.getAll();
            }
        },
        
        getByStatus: async function(status) {
            if (useFirebase) {
                return await FirestoreModules.Orders.getByStatus(status);
            } else {
                return StorageUtil.Orders.getByStatus(status);
            }
        },
        
        getByUser: async function(userId) {
            if (useFirebase) {
                return await FirestoreModules.Orders.getByUser(userId);
            } else {
                return StorageUtil.Orders.getByUser(userId);
            }
        },
        
        update: async function(orderId, orderData) {
            if (useFirebase) {
                return await FirestoreModules.Orders.update(orderId, orderData);
            } else {
                return StorageUtil.Orders.update(orderId, orderData);
            }
        },
        
        delete: async function(orderId) {
            if (useFirebase) {
                return await FirestoreModules.Orders.delete(orderId);
            } else {
                return StorageUtil.Orders.delete(orderId);
            }
        }
    },
    
    // CRUD para Confirmaciones de Asistencia
    AttendanceConfirmations: {
        add: async function(confirmation) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.add(confirmation);
            } else {
                return StorageUtil.AttendanceConfirmations.add(confirmation);
            }
        },
        
        get: async function(confirmationId) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.get(confirmationId);
            } else {
                return StorageUtil.AttendanceConfirmations.get(confirmationId);
            }
        },
        
        getAll: async function() {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.getAll();
            } else {
                return StorageUtil.AttendanceConfirmations.getAll();
            }
        },
        
        getByCoordinator: async function(coordinatorId) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.getByCoordinator(coordinatorId);
            } else {
                return StorageUtil.AttendanceConfirmations.getByCoordinator(coordinatorId);
            }
        },
        
        getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.getByCoordinatorAndWeek(coordinatorId, weekStartDate);
            } else {
                return StorageUtil.AttendanceConfirmations.getByCoordinatorAndWeek(coordinatorId, weekStartDate);
            }
        },
        
        update: async function(confirmationId, confirmationData) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.update(confirmationId, confirmationData);
            } else {
                return StorageUtil.AttendanceConfirmations.update(confirmationId, confirmationData);
            }
        },
        
        delete: async function(confirmationId) {
            if (useFirebase) {
                return await FirestoreModules.AttendanceConfirmations.delete(confirmationId);
            } else {
                return StorageUtil.AttendanceConfirmations.delete(confirmationId);
            }
        }
    },
    
    /**
     * Exporta todos los datos a un objeto JSON
     * @returns {Promise<Object>} - Promesa que resuelve con un objeto con todos los datos
     */
    exportData: async function() {
        if (useFirebase) {
            try {
                return await FirestoreUtil.exportData();
            } catch (error) {
                console.error('Error al exportar datos de Firebase:', error);
                // Fallback a localStorage si hay error
                return StorageUtil.exportData();
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.exportData();
        }
    },
    
    /**
     * Importa datos desde un objeto JSON
     * @param {Object} data - Datos a importar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se importó correctamente
     */
    importData: async function(data) {
        if (useFirebase) {
            try {
                return await FirestoreUtil.importData(data);
            } catch (error) {
                console.error('Error al importar datos a Firebase:', error);
                // Fallback a localStorage si hay error
                return StorageUtil.importData(data);
            }
        } else {
            // Usar localStorage directamente
            return StorageUtil.importData(data);
        }
    }
};

export default StorageAdapter;
