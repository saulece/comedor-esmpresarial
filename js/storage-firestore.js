/**
 * storage-firestore.js
 * Utilidades para el manejo de almacenamiento en Firestore
 * Este módulo proporciona una capa de abstracción sobre Firestore
 * para facilitar el almacenamiento y recuperación de datos estructurados.
 */

import { db, getCollectionRef, getDocRef, createQuery } from './firebase.js';

const StorageUtil = {
    // Nombres de las colecciones en Firestore
    COLLECTIONS: {
        USERS: 'users',
        DISHES: 'dishes',
        MENUS: 'menus',
        COORDINATORS: 'coordinators',
        CONFIRMATIONS: 'confirmations',
        ORDERS: 'orders',
        APP_STATE: 'app_state',
        ATTENDANCE_CONFIRMATIONS: 'attendance_confirmations'
    },

    /**
     * Inicializa Firestore
     */
    initStorage: async function() {
        try {
            // Verifica si existe el estado de la app
            const appStateRef = getDocRef(this.COLLECTIONS.APP_STATE, 'state');
            const appStateDoc = await getDoc(appStateRef);
            
            if (!appStateDoc.exists()) {
                await setDoc(appStateRef, {
                    initialized: true,
                    lastUpdate: new Date().toISOString(),
                    version: '1.0.0'
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error al inicializar Firestore:', error);
            return false;
        }
    },

    /**
     * Guarda datos en Firestore
     */
    save: async function(collectionName, data, id = null) {
        try {
            const ref = id ? getDocRef(collectionName, id) : getCollectionRef(collectionName);
            await setDoc(ref, data);
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${collectionName}:`, error);
            return false;
        }
    },

    /**
     * Recupera datos de Firestore
     */
    get: async function(collectionName, id = null) {
        try {
            const ref = id ? getDocRef(collectionName, id) : getCollectionRef(collectionName);
            const snapshot = id ? await getDoc(ref) : await getDocs(ref);
            
            if (id) {
                return snapshot.exists() ? snapshot.data() : null;
            }
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error al obtener datos de ${collectionName}:`, error);
            return null;
        }
    },

    /**
     * Actualiza un documento en Firestore
     */
    updateItem: async function(collectionName, id, newData) {
        try {
            const ref = getDocRef(collectionName, id);
            await updateDoc(ref, newData);
            return true;
        } catch (error) {
            console.error(`Error al actualizar documento en ${collectionName}:`, error);
            return false;
        }
    },

    /**
     * Elimina un documento de Firestore
     */
    deleteItem: async function(collectionName, id) {
        try {
            const ref = getDocRef(collectionName, id);
            await deleteDoc(ref);
            return true;
        } catch (error) {
            console.error(`Error al eliminar documento de ${collectionName}:`, error);
            return false;
        }
    },

    /**
     * Agrega un documento a Firestore
     */
    addItem: async function(collectionName, item) {
        try {
            const ref = getCollectionRef(collectionName);
            await setDoc(ref, item);
            return true;
        } catch (error) {
            console.error(`Error al agregar documento a ${collectionName}:`, error);
            return false;
        }
    },

    /**
     * Obtiene un documento específico de Firestore
     */
    getItem: async function(collectionName, id) {
        try {
            const ref = getDocRef(collectionName, id);
            const doc = await getDoc(ref);
            return doc.exists() ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error(`Error al obtener documento de ${collectionName}:`, error);
            return null;
        }
    },

    /**
     * Elimina una colección de Firestore
     */
    remove: async function(collectionName) {
        try {
            const collectionRef = getCollectionRef(collectionName);
            const snapshot = await getDocs(collectionRef);
            
            // Eliminar cada documento en la colección
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            return true;
        } catch (error) {
            console.error(`Error al eliminar colección ${collectionName}:`, error);
            return false;
        }
    },

    /**
     * Limpia todo el almacenamiento
     */
    clear: async function() {
        try {
            // Eliminar cada colección
            const promises = Object.values(this.COLLECTIONS).map(collection =>
                this.remove(collection)
            );
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Error al limpiar el almacenamiento:', error);
            return false;
        }
    },

    // CRUD para Usuarios
    Users: {
        add: async function(user) {
            return StorageUtil.addItem(this.COLLECTIONS.USERS, user);
        },
        get: async function(userId) {
            return StorageUtil.getItem(this.COLLECTIONS.USERS, userId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.USERS);
        },
        update: async function(userId, userData) {
            return StorageUtil.updateItem(this.COLLECTIONS.USERS, userId, userData);
        },
        delete: async function(userId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.USERS, userId);
        }
    },

    // CRUD para Platillos
    Dishes: {
        add: async function(dish) {
            return StorageUtil.addItem(this.COLLECTIONS.DISHES, dish);
        },
        get: async function(dishId) {
            return StorageUtil.getItem(this.COLLECTIONS.DISHES, dishId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.DISHES);
        },
        getByCategory: async function(category) {
            const dishes = await StorageUtil.get(this.COLLECTIONS.DISHES);
            return dishes.filter(dish => dish.category === category);
        },
        update: async function(dishId, dishData) {
            return StorageUtil.updateItem(this.COLLECTIONS.DISHES, dishId, dishData);
        },
        delete: async function(dishId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.DISHES, dishId);
        }
    },

    // CRUD para Menús
    Menus: {
        add: async function(menu) {
            return StorageUtil.addItem(this.COLLECTIONS.MENUS, menu);
        },
        get: async function(menuId) {
            return StorageUtil.getItem(this.COLLECTIONS.MENUS, menuId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.MENUS);
        },
        getActive: async function() {
            const menus = await StorageUtil.get(this.COLLECTIONS.MENUS);
            return menus.find(menu => menu.status === 'active');
        },
        update: async function(menuId, menuData) {
            return StorageUtil.updateItem(this.COLLECTIONS.MENUS, menuId, menuData);
        },
        delete: async function(menuId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.MENUS, menuId);
        }
    },

    // CRUD para Coordinadores
    Coordinators: {
        add: async function(coordinator) {
            return StorageUtil.addItem(this.COLLECTIONS.COORDINATORS, coordinator);
        },
        get: async function(coordinatorId) {
            return StorageUtil.getItem(this.COLLECTIONS.COORDINATORS, coordinatorId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.COORDINATORS);
        },
        getByDepartment: async function(department) {
            const coordinators = await StorageUtil.get(this.COLLECTIONS.COORDINATORS);
            return coordinators.filter(coord => coord.department === department);
        },
        update: async function(coordinatorId, coordinatorData) {
            return StorageUtil.updateItem(this.COLLECTIONS.COORDINATORS, coordinatorId, coordinatorData);
        },
        delete: async function(coordinatorId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.COORDINATORS, coordinatorId);
        }
    },

    // CRUD para Confirmaciones
    Confirmations: {
        add: async function(confirmation) {
            return StorageUtil.addItem(this.COLLECTIONS.CONFIRMATIONS, confirmation);
        },
        get: async function(confirmationId) {
            return StorageUtil.getItem(this.COLLECTIONS.CONFIRMATIONS, confirmationId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.CONFIRMATIONS);
        },
        getByStatus: async function(status) {
            const confirmations = await StorageUtil.get(this.COLLECTIONS.CONFIRMATIONS);
            return confirmations.filter(conf => conf.status === status);
        },
        getByCoordinator: async function(coordinatorId) {
            const confirmations = await StorageUtil.get(this.COLLECTIONS.CONFIRMATIONS);
            return confirmations.filter(conf => conf.coordinatorId === coordinatorId);
        },
        update: async function(confirmationId, confirmationData) {
            return StorageUtil.updateItem(this.COLLECTIONS.CONFIRMATIONS, confirmationId, confirmationData);
        },
        delete: async function(confirmationId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.CONFIRMATIONS, confirmationId);
        }
    },

    // CRUD para Pedidos
    Orders: {
        add: async function(order) {
            return StorageUtil.addItem(this.COLLECTIONS.ORDERS, order);
        },
        get: async function(orderId) {
            return StorageUtil.getItem(this.COLLECTIONS.ORDERS, orderId);
        },
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.ORDERS);
        },
        getByStatus: async function(status) {
            const orders = await StorageUtil.get(this.COLLECTIONS.ORDERS);
            return orders.filter(order => order.status === status);
        },
        getByUser: async function(userId) {
            const orders = await StorageUtil.get(this.COLLECTIONS.ORDERS);
            return orders.filter(order => order.userId === userId);
        },
        update: async function(orderId, orderData) {
            return StorageUtil.updateItem(this.COLLECTIONS.ORDERS, orderId, orderData);
        },
        delete: async function(orderId) {
            return StorageUtil.deleteItem(this.COLLECTIONS.ORDERS, orderId);
        }
    },

    // CRUD para Confirmaciones de Asistencia
    AttendanceConfirmations: {
        getAll: async function() {
            return StorageUtil.get(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS);
        },
        get: async function(id) {
            return StorageUtil.getItem(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, id);
        },
        getByCoordinator: async function(coordinatorId) {
            const confirmations = await StorageUtil.get(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS);
            return confirmations.filter(conf => conf.coordinatorId === coordinatorId);
        },
        getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
            const confirmations = await StorageUtil.get(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS);
            return confirmations.find(conf => 
                conf.coordinatorId === coordinatorId && 
                conf.weekStartDate === weekStartDate
            );
        },
        add: async function(confirmation) {
            return StorageUtil.addItem(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, confirmation);
        },
        update: async function(id, updatedData) {
            return StorageUtil.updateItem(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, id, updatedData);
        },
        delete: async function(id) {
            return StorageUtil.deleteItem(this.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, id);
        }
    },

    /**
     * Exporta todos los datos a un objeto JSON
     */
    exportData: async function() {
        try {
            const data = {};
            await Promise.all(Object.entries(this.COLLECTIONS).map(async ([key, collection]) => {
                data[key] = await this.get(collection);
            }));
            return data;
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return null;
        }
    },

    /**
     * Descarga los datos como un archivo JSON
     */
    downloadData: async function() {
        try {
            const data = await this.exportData();
            if (data) {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'comedor-data-' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error al descargar datos:', error);
        }
    },

    /**
     * Importa datos desde un objeto JSON
     */
    importData: async function(data) {
        try {
            const promises = [];
            Object.entries(data).forEach(([key, items]) => {
                const collection = this.COLLECTIONS[key];
                if (collection) {
                    items.forEach(item => {
                        promises.push(this.save(collection, item, item.id));
                    });
                }
            });
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    },

    /**
     * Importa datos desde un archivo JSON
     */
    importFromFile: async function(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            return await this.importData(data);
        } catch (error) {
            console.error('Error al importar archivo:', error);
            return false;
        }
    }
};

// Exporta el módulo
export default StorageUtil;
