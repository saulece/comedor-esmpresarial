/**
 * storage-adapter.js
 * Adaptador para mantener compatibilidad entre StorageUtil y Firebase
 * Proporciona la misma interfaz que StorageUtil pero utiliza Firebase
 */

const StorageAdapter = {
    // Claves para las colecciones (mantenemos las mismas para compatibilidad)
    KEYS: {
        USERS: 'comedor_users',
        DISHES: 'comedor_dishes',
        MENUS: 'comedor_menus',
        COORDINATORS: 'comedor_coordinators',
        CONFIRMATIONS: 'comedor_confirmations',
        ORDERS: 'comedor_orders',
        APP_STATE: 'comedor_app_state',
        ATTENDANCE_CONFIRMATIONS: 'attendanceConfirmations'
    },

    /**
     * Inicializa el adaptador de almacenamiento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó correctamente
     */
    initStorage: async function() {
        console.log('Inicializando adaptador de almacenamiento con Firebase...');
        
        try {
            // Verificar si Firebase está disponible
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('Firebase no está disponible. Usando localStorage como fallback.');
                return StorageUtil.initStorage();
            }
            
            // Verificar si las colecciones existen y crearlas si no
            const db = firebase.firestore();
            const collections = ['menus', 'coordinators', 'attendanceConfirmations', 'appState'];
            
            // Verificar appState para saber si ya se inicializó
            const appStateDoc = await db.collection('appState').doc('config').get();
            
            if (!appStateDoc.exists) {
                // Crear documento de estado de la aplicación
                await db.collection('appState').doc('config').set({
                    initialized: true,
                    lastUpdate: new Date().toISOString(),
                    version: '1.0.0'
                });
                
                console.log('Estado de aplicación inicializado en Firebase');
                return true;
            } else {
                console.log('Firebase ya está inicializado correctamente');
                return false;
            }
        } catch (error) {
            console.error('Error al inicializar Firebase:', error);
            console.log('Usando localStorage como fallback');
            return StorageUtil.initStorage();
        }
    },

    /**
     * Guarda datos en Firebase o localStorage como fallback
     * @param {string} key - Clave para almacenar los datos
     * @param {any} data - Datos a almacenar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    save: async function(key, data) {
        try {
            // Si Firebase no está disponible, usar localStorage
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                return StorageUtil.save(key, data);
            }
            
            // Mapear la clave a una colección de Firebase
            const collectionName = this._getCollectionName(key);
            
            // Si es un array, guardar cada elemento como documento separado
            if (Array.isArray(data)) {
                const batch = firebase.firestore().batch();
                
                // Eliminar documentos existentes
                const snapshot = await firebase.firestore().collection(collectionName).get();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Agregar nuevos documentos
                data.forEach(item => {
                    const docRef = firebase.firestore().collection(collectionName).doc(item.id);
                    batch.set(docRef, {
                        ...item,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                
                await batch.commit();
            } else {
                // Si es un objeto, guardarlo como documento único
                await firebase.firestore().collection(collectionName).doc('config').set({
                    ...data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${key} con Firebase:`, error);
            // Intentar con localStorage como fallback
            return StorageUtil.save(key, data);
        }
    },

    /**
     * Recupera datos de Firebase o localStorage como fallback
     * @param {string} key - Clave para recuperar los datos
     * @param {any} defaultValue - Valor por defecto si no se encuentra la clave
     * @returns {Promise<any>} - Promesa que resuelve a los datos recuperados
     */
    get: async function(key, defaultValue = null) {
        try {
            // Si Firebase no está disponible, usar localStorage
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                return StorageUtil.get(key, defaultValue);
            }
            
            // Mapear la clave a una colección de Firebase
            const collectionName = this._getCollectionName(key);
            
            // Si es una clave de configuración, obtener documento único
            if (key === this.KEYS.APP_STATE) {
                const doc = await firebase.firestore().collection(collectionName).doc('config').get();
                return doc.exists ? doc.data() : defaultValue;
            } else {
                // Si es una colección, obtener todos los documentos
                const snapshot = await firebase.firestore().collection(collectionName).get();
                return snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
            }
        } catch (error) {
            console.error(`Error al recuperar datos de ${key} con Firebase:`, error);
            // Intentar con localStorage como fallback
            return StorageUtil.get(key, defaultValue);
        }
    },

    /**
     * Convierte una clave de almacenamiento a un nombre de colección de Firebase
     * @private
     * @param {string} key - Clave de almacenamiento
     * @returns {string} - Nombre de colección de Firebase
     */
    _getCollectionName: function(key) {
        const collectionMap = {
            [this.KEYS.USERS]: 'users',
            [this.KEYS.DISHES]: 'dishes',
            [this.KEYS.MENUS]: 'menus',
            [this.KEYS.COORDINATORS]: 'coordinators',
            [this.KEYS.CONFIRMATIONS]: 'confirmations',
            [this.KEYS.ORDERS]: 'orders',
            [this.KEYS.APP_STATE]: 'appState',
            [this.KEYS.ATTENDANCE_CONFIRMATIONS]: 'attendanceConfirmations'
        };
        
        return collectionMap[key] || key.replace('comedor_', '');
    }
};

// Implementar los submodulos con la misma interfaz que StorageUtil
StorageAdapter.Menus = {
    add: async function(menu) {
        return FirebaseMenuModel.add(menu);
    },
    
    get: async function(menuId) {
        return FirebaseMenuModel.get(menuId);
    },
    
    getAll: async function() {
        return FirebaseMenuModel.getAll();
    },
    
    getActive: async function() {
        return FirebaseMenuModel.getActive();
    },
    
    update: async function(menuId, menuData) {
        return FirebaseMenuModel.update(menuId, menuData);
    },
    
    delete: async function(menuId) {
        return FirebaseMenuModel.delete(menuId);
    }
};

StorageAdapter.Coordinators = {
    add: async function(coordinator) {
        return FirebaseCoordinatorModel.add(coordinator);
    },
    
    get: async function(coordinatorId) {
        return FirebaseCoordinatorModel.get(coordinatorId);
    },
    
    getAll: async function() {
        return FirebaseCoordinatorModel.getAll();
    },
    
    getByDepartment: async function(department) {
        return FirebaseCoordinatorModel.getByDepartment(department);
    },
    
    update: async function(coordinatorId, coordinatorData) {
        return FirebaseCoordinatorModel.update(coordinatorId, coordinatorData);
    },
    
    delete: async function(coordinatorId) {
        return FirebaseCoordinatorModel.delete(coordinatorId);
    }
};

StorageAdapter.AttendanceConfirmations = {
    getAll: async function() {
        return FirebaseAttendanceModel.getAll();
    },
    
    get: async function(id) {
        return FirebaseAttendanceModel.get(id);
    },
    
    getByCoordinator: async function(coordinatorId) {
        return FirebaseAttendanceModel.getByCoordinator(coordinatorId);
    },
    
    getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
        return FirebaseAttendanceModel.getByCoordinatorAndWeek(coordinatorId, weekStartDate);
    },
    
    add: async function(confirmation) {
        return FirebaseAttendanceModel.add(confirmation);
    },
    
    update: async function(id, updatedData) {
        return FirebaseAttendanceModel.update(id, updatedData);
    },
    
    delete: async function(id) {
        return FirebaseAttendanceModel.delete(id);
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageAdapter;
} else {
    // Para uso en navegador
    window.StorageAdapter = StorageAdapter;
}
