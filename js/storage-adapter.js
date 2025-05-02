/**
 * storage-adapter.js
 * Adaptador para facilitar el uso de Firebase como almacenamiento principal
 * Mantiene la misma interfaz de StorageUtil pero usa Firebase exclusivamente
 */

// Variable para controlar qué implementación usar - Siempre Firebase
let useFirebase = true;

// Función para inicializar la implementación de Firebase
function initFirebaseStorage() {
    console.log('Usando implementación de Firebase exclusivamente');
    
    // Asegurarse de que Firebase esté inicializado
    if (typeof FirebaseService !== 'undefined') {
        return FirebaseService.initFirebase();
    } else {
        console.error('FirebaseService no está disponible. Revisa que firebase-config.js esté cargado.');
        return false;
    }
}

// Objeto que intercepta las llamadas y las redirige a la implementación de Firebase
const StorageAdapter = {
    // Referencia a la implementación de Firebase
    firebase: null, // Se inicializará después
    
    // Método para inicializar el almacenamiento
    async initStorage() {
        if (!this.firebase) {
            if (typeof FirestoreUtil !== 'undefined') {
                this.firebase = window.FirestoreUtil;
                console.log('Firebase inicializado correctamente en StorageAdapter');
            } else {
                console.error('FirestoreUtil no está disponible. Revisa que firebase-storage.js esté cargado.');
                return false;
            }
        }
        
        try {
            return await this.firebase.initStorage();
        } catch (error) {
            console.error('Error al inicializar el almacenamiento:', error);
            return false;
        }
    },
    
    // Métodos principales
    async save(key, data) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.save(key, data);
        } catch (error) {
            console.error(`Error al guardar datos en ${key}:`, error);
            return false;
        }
    },
    
    async get(key, defaultValue = null) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.get(key, defaultValue);
        } catch (error) {
            console.error(`Error al obtener datos de ${key}:`, error);
            return defaultValue;
        }
    },
    
    async updateItem(key, itemId, newData) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.updateItem(key, itemId, newData);
        } catch (error) {
            console.error(`Error al actualizar item en ${key}:`, error);
            return false;
        }
    },
    
    async deleteItem(key, itemId) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.deleteItem(key, itemId);
        } catch (error) {
            console.error(`Error al eliminar item de ${key}:`, error);
            return false;
        }
    },
    
    async addItem(key, item) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.addItem(key, item);
        } catch (error) {
            console.error(`Error al añadir item a ${key}:`, error);
            return false;
        }
    },
    
    async getItem(key, itemId) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.getItem(key, itemId);
        } catch (error) {
            console.error(`Error al obtener item de ${key}:`, error);
            return null;
        }
    },
    
    async remove(key) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.remove(key);
        } catch (error) {
            console.error(`Error al eliminar ${key}:`, error);
            return false;
        }
    },
    
    async clear() {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.clear();
        } catch (error) {
            console.error('Error al limpiar el almacenamiento:', error);
            return false;
        }
    },
    
    // Exportar/importar datos
    async exportData() {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.exportData();
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return null;
        }
    },
    
    async downloadData() {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.downloadData();
        } catch (error) {
            console.error('Error al descargar datos:', error);
            return false;
        }
    },
    
    async importData(data) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.importData(data);
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    },
    
    async importFromFile(file) {
        if (!this.firebase) await this.initStorage();
        try {
            return await this.firebase.importFromFile(file);
        } catch (error) {
            console.error('Error al importar desde archivo:', error);
            return false;
        }
    },
    
    // Claves para las colecciones (mantener sincronizadas con la implementación de Firebase)
    KEYS: {
        USERS: 'comedor_users',
        DISHES: 'comedor_dishes',
        MENUS: 'comedor_menus',
        COORDINATORS: 'comedor_coordinators',
        CONFIRMATIONS: 'comedor_confirmations',
        ORDERS: 'comedor_orders',
        APP_STATE: 'comedor_app_state',
        ATTENDANCE_CONFIRMATIONS: 'attendanceConfirmations'
    }
};

// Crear proxies para cada subcolección (Users, Dishes, etc.)
const createCollectionProxy = (collectionName) => {
    return new Proxy({}, {
        get: function(target, prop) {
            // Si la propiedad es una función, devolver una función que redirecciona a Firebase
            return async function(...args) {
                if (!StorageAdapter.firebase) await StorageAdapter.initStorage();
                
                if (typeof StorageAdapter.firebase[collectionName][prop] === 'function') {
                    try {
                        return await StorageAdapter.firebase[collectionName][prop](...args);
                    } catch (error) {
                        console.error(`Error en ${collectionName}.${prop}:`, error);
                        return prop === 'getAll' ? [] : null;
                    }
                } else {
                    return StorageAdapter.firebase[collectionName][prop];
                }
            };
        }
    });
};

// Crear proxies para cada colección
StorageAdapter.Users = createCollectionProxy('Users');
StorageAdapter.Dishes = createCollectionProxy('Dishes');
StorageAdapter.Menus = createCollectionProxy('Menus');
StorageAdapter.Coordinators = createCollectionProxy('Coordinators');
StorageAdapter.Confirmations = createCollectionProxy('Confirmations');
StorageAdapter.Orders = createCollectionProxy('Orders');
StorageAdapter.AttendanceConfirmations = createCollectionProxy('AttendanceConfirmations');

// Reemplazar el StorageUtil global con nuestro adaptador
window.StorageUtil = StorageAdapter;

// Inicializar Firebase cuando se carga el documento
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase !== 'undefined') {
            const success = initFirebaseStorage();
            if (success) {
                console.log('Firebase inicializado como almacenamiento principal');
                StorageAdapter.firebase = window.FirestoreUtil;
            } else {
                console.error('No se pudo inicializar Firebase.');
            }
        } else {
            console.error('Firebase no está disponible. La aplicación no funcionará correctamente.');
        }
        
        // Inicializar el almacenamiento
        const initialized = await StorageAdapter.initStorage();
        console.log(`Almacenamiento ${initialized ? 'inicializado' : 'ya estaba inicializado'}`);
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
});
