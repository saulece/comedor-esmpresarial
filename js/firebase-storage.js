/**
 * firebase-storage.js
 * Utilidades para el manejo de almacenamiento con Firebase Firestore
 * Este módulo proporciona una capa de abstracción sobre Firestore
 * para facilitar el almacenamiento y recuperación de datos estructurados.
 */

import { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from './firebase-config.js';
import FirebaseAuth from './firebase-auth.js';

const FirestoreUtil = {
    // Nombres de las colecciones en Firestore
    COLLECTIONS: {
        USERS: 'users',
        DISHES: 'dishes',
        MENUS: 'menus',
        COORDINATORS: 'coordinators',
        CONFIRMATIONS: 'confirmations',
        ORDERS: 'orders',
        APP_STATE: 'app_state',
        ATTENDANCE_CONFIRMATIONS: 'attendanceConfirmations'
    },

    /**
     * Inicializa el almacenamiento con datos predeterminados si no existen
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó el almacenamiento, false si ya existía
     */
    initStorage: async function() {
        console.log('Verificando almacenamiento existente en Firestore...');
        
        try {
            // Verificar si existe el documento de estado de la aplicación
            const appStateRef = doc(db, this.COLLECTIONS.APP_STATE, 'main');
            const appStateDoc = await getDoc(appStateRef);
            
            if (!appStateDoc.exists()) {
                // Si no existe, inicializar con valores predeterminados
                await setDoc(appStateRef, {
                    initialized: true,
                    lastUpdate: new Date().toISOString(),
                    version: '1.0.0'
                });
                console.log('Estado de la aplicación inicializado en Firestore');
                return true;
            } else {
                console.log('El almacenamiento ya está inicializado en Firestore');
                return false;
            }
        } catch (error) {
            console.error('Error al inicializar el almacenamiento:', error);
            throw error;
        }
    },

    /**
     * Guarda datos en una colección de Firestore
     * @param {string} collectionName - Nombre de la colección
     * @param {string} id - ID del documento
     * @param {any} data - Datos a almacenar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    save: async function(collectionName, id, data) {
        try {
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Recupera un documento de Firestore
     * @param {string} collectionName - Nombre de la colección
     * @param {string} id - ID del documento
     * @returns {Promise<any>} - Promesa que resuelve con los datos recuperados o null si no existe
     */
    get: async function(collectionName, id) {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error al recuperar datos de ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Recupera todos los documentos de una colección de Firestore
     * @param {string} collectionName - Nombre de la colección
     * @returns {Promise<Array>} - Promesa que resuelve con un array de documentos
     */
    getAll: async function(collectionName) {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const documents = [];
            
            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return documents;
        } catch (error) {
            console.error(`Error al recuperar todos los datos de ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Actualiza un documento en Firestore
     * @param {string} collectionName - Nombre de la colección
     * @param {string} id - ID del documento
     * @param {any} data - Datos a actualizar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(collectionName, id, data) {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error(`Error al actualizar datos en ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un documento de Firestore
     * @param {string} collectionName - Nombre de la colección
     * @param {string} id - ID del documento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(collectionName, id) {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error al eliminar datos de ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Busca documentos en Firestore que cumplan con ciertos criterios
     * @param {string} collectionName - Nombre de la colección
     * @param {string} field - Campo por el que filtrar
     * @param {string} operator - Operador de comparación ('==', '>', '<', '>=', '<=', '!=')
     * @param {any} value - Valor a comparar
     * @returns {Promise<Array>} - Promesa que resuelve con un array de documentos
     */
    query: async function(collectionName, field, operator, value) {
        try {
            const q = query(collection(db, collectionName), where(field, operator, value));
            const querySnapshot = await getDocs(q);
            const documents = [];
            
            querySnapshot.forEach((doc) => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return documents;
        } catch (error) {
            console.error(`Error al consultar datos en ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Exporta todos los datos de Firestore a un objeto JSON
     * @returns {Promise<Object>} - Promesa que resuelve con un objeto con todos los datos
     */
    exportData: async function() {
        try {
            const data = {};
            
            // Exportar cada colección
            for (const key in this.COLLECTIONS) {
                const collectionName = this.COLLECTIONS[key];
                data[collectionName] = await this.getAll(collectionName);
            }
            
            return data;
        } catch (error) {
            console.error('Error al exportar datos:', error);
            throw error;
        }
    },

    /**
     * Importa datos a Firestore desde un objeto JSON
     * @param {Object} data - Datos a importar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se importó correctamente
     */
    importData: async function(data) {
        try {
            // Importar cada colección
            for (const collectionName in data) {
                const items = data[collectionName];
                
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const id = item.id;
                        if (id) {
                            await this.save(collectionName, id, item);
                        } else {
                            console.warn(`Elemento sin ID en colección ${collectionName}, ignorando`);
                        }
                    }
                } else {
                    console.warn(`Datos inválidos para colección ${collectionName}, debe ser un array`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            throw error;
        }
    }
};

// Módulos específicos para cada entidad
const FirestoreModules = {
    // CRUD para Usuarios
    Users: {
        add: async function(user) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.USERS, user.id, user);
        },
        
        get: async function(userId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.USERS, userId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.USERS);
        },
        
        update: async function(userId, userData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.USERS, userId, userData);
        },
        
        delete: async function(userId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.USERS, userId);
        }
    },
    
    // CRUD para Platillos
    Dishes: {
        add: async function(dish) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.DISHES, dish.id, dish);
        },
        
        get: async function(dishId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.DISHES, dishId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.DISHES);
        },
        
        getByCategory: async function(category) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.DISHES, 'category', '==', category);
        },
        
        update: async function(dishId, dishData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.DISHES, dishId, dishData);
        },
        
        delete: async function(dishId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.DISHES, dishId);
        }
    },
    
    // CRUD para Menús
    Menus: {
        add: async function(menu) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.MENUS, menu.id, menu);
        },
        
        get: async function(menuId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.MENUS, menuId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.MENUS);
        },
        
        getActive: async function() {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.MENUS, 'active', '==', true);
        },
        
        update: async function(menuId, menuData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.MENUS, menuId, menuData);
        },
        
        delete: async function(menuId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.MENUS, menuId);
        }
    },
    
    // CRUD para Coordinadores
    Coordinators: {
        add: async function(coordinator) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.COORDINATORS, coordinator.id, coordinator);
        },
        
        get: async function(coordinatorId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.COORDINATORS, coordinatorId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.COORDINATORS);
        },
        
        getByDepartment: async function(department) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.COORDINATORS, 'department', '==', department);
        },
        
        update: async function(coordinatorId, coordinatorData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.COORDINATORS, coordinatorId, coordinatorData);
        },
        
        delete: async function(coordinatorId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.COORDINATORS, coordinatorId);
        }
    },
    
    // CRUD para Confirmaciones
    Confirmations: {
        add: async function(confirmation) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, confirmation.id, confirmation);
        },
        
        get: async function(confirmationId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, confirmationId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.CONFIRMATIONS);
        },
        
        getByStatus: async function(status) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, 'status', '==', status);
        },
        
        getByCoordinator: async function(coordinatorId) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, 'coordinatorId', '==', coordinatorId);
        },
        
        update: async function(confirmationId, confirmationData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, confirmationId, confirmationData);
        },
        
        delete: async function(confirmationId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.CONFIRMATIONS, confirmationId);
        }
    },
    
    // CRUD para Pedidos
    Orders: {
        add: async function(order) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.ORDERS, order.id, order);
        },
        
        get: async function(orderId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.ORDERS, orderId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.ORDERS);
        },
        
        getByStatus: async function(status) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.ORDERS, 'status', '==', status);
        },
        
        getByUser: async function(userId) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.ORDERS, 'userId', '==', userId);
        },
        
        update: async function(orderId, orderData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.ORDERS, orderId, orderData);
        },
        
        delete: async function(orderId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.ORDERS, orderId);
        }
    },
    
    // CRUD para Confirmaciones de Asistencia
    AttendanceConfirmations: {
        add: async function(confirmation) {
            return await FirestoreUtil.save(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, confirmation.id, confirmation);
        },
        
        get: async function(confirmationId) {
            return await FirestoreUtil.get(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, confirmationId);
        },
        
        getAll: async function() {
            return await FirestoreUtil.getAll(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS);
        },
        
        getByCoordinator: async function(coordinatorId) {
            return await FirestoreUtil.query(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, 'coordinatorId', '==', coordinatorId);
        },
        
        getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
            // Convertir a string ISO si es un objeto Date
            if (weekStartDate instanceof Date) {
                weekStartDate = weekStartDate.toISOString().split('T')[0];
            }
            
            // Buscar por coordinador y fecha de inicio de semana
            const confirmations = await FirestoreUtil.query(
                FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, 
                'coordinatorId', 
                '==', 
                coordinatorId
            );
            
            // Filtrar por fecha de inicio de semana
            return confirmations.find(conf => {
                const confWeekStart = typeof conf.weekStartDate === 'string' 
                    ? conf.weekStartDate.split('T')[0] 
                    : conf.weekStartDate;
                return confWeekStart === weekStartDate;
            });
        },
        
        update: async function(confirmationId, confirmationData) {
            return await FirestoreUtil.update(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, confirmationId, confirmationData);
        },
        
        delete: async function(confirmationId) {
            return await FirestoreUtil.delete(FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS, confirmationId);
        }
    }
};

// Exportar las utilidades y módulos
export { FirestoreUtil, FirestoreModules };
