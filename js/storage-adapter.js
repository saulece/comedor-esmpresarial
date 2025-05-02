/**
 * storage-adapter.js
 * Adaptador para facilitar la transición de localStorage a Firebase
 * Mantiene la misma interfaz de StorageUtil pero permite cambiar entre implementaciones
 */

// Variable para controlar qué implementación usar
let useFirebase = true;

// Función para cambiar entre implementaciones
function setStorageImplementation(useFirebaseImpl) {
    useFirebase = useFirebaseImpl;
    console.log(`Usando implementación de ${useFirebase ? 'Firebase' : 'localStorage'}`);
    
    // Inicializar la implementación seleccionada
    if (useFirebase) {
        // Asegurarse de que Firebase esté inicializado
        if (typeof FirebaseService !== 'undefined') {
            FirebaseService.initFirebase();
        } else {
            console.error('FirebaseService no está disponible. Revisa que firebase-config.js esté cargado.');
            // Fallback a localStorage si Firebase no está disponible
            useFirebase = false;
        }
    }
}

// Función para convertir métodos síncronos a asíncronos cuando sea necesario
async function asyncWrapper(fn, ...args) {
    try {
        const result = fn(...args);
        return result;
    } catch (error) {
        console.error('Error en asyncWrapper:', error);
        throw error;
    }
}

// Objeto que intercepta las llamadas y las redirige a la implementación correcta
const StorageAdapter = {
    // Referencia a las implementaciones
    localStorage: window.StorageUtil, // La implementación original
    firebase: window.FirestoreUtil,   // La implementación de Firebase
    
    // Método para inicializar el almacenamiento
    async initStorage() {
        if (useFirebase) {
            return await this.firebase.initStorage();
        } else {
            return this.localStorage.initStorage();
        }
    },
    
    // Métodos principales
    async save(key, data) {
        if (useFirebase) {
            return await this.firebase.save(key, data);
        } else {
            return this.localStorage.save(key, data);
        }
    },
    
    async get(key, defaultValue = null) {
        if (useFirebase) {
            return await this.firebase.get(key, defaultValue);
        } else {
            return this.localStorage.get(key, defaultValue);
        }
    },
    
    async updateItem(key, itemId, newData) {
        if (useFirebase) {
            return await this.firebase.updateItem(key, itemId, newData);
        } else {
            return this.localStorage.updateItem(key, itemId, newData);
        }
    },
    
    async deleteItem(key, itemId) {
        if (useFirebase) {
            return await this.firebase.deleteItem(key, itemId);
        } else {
            return this.localStorage.deleteItem(key, itemId);
        }
    },
    
    async addItem(key, item) {
        if (useFirebase) {
            return await this.firebase.addItem(key, item);
        } else {
            return this.localStorage.addItem(key, item);
        }
    },
    
    async getItem(key, itemId) {
        if (useFirebase) {
            return await this.firebase.getItem(key, itemId);
        } else {
            return this.localStorage.getItem(key, itemId);
        }
    },
    
    async remove(key) {
        if (useFirebase) {
            return await this.firebase.remove(key);
        } else {
            return this.localStorage.remove(key);
        }
    },
    
    async clear() {
        if (useFirebase) {
            return await this.firebase.clear();
        } else {
            return this.localStorage.clear();
        }
    },
    
    // Exportar/importar datos
    async exportData() {
        if (useFirebase) {
            return await this.firebase.exportData();
        } else {
            return this.localStorage.exportData();
        }
    },
    
    async downloadData() {
        if (useFirebase) {
            return await this.firebase.downloadData();
        } else {
            return this.localStorage.downloadData();
        }
    },
    
    async importData(data) {
        if (useFirebase) {
            return await this.firebase.importData(data);
        } else {
            return this.localStorage.importData(data);
        }
    },
    
    async importFromFile(file) {
        if (useFirebase) {
            return await this.firebase.importFromFile(file);
        } else {
            return this.localStorage.importFromFile(file);
        }
    },
    
    // Claves para las colecciones (mantener sincronizadas con ambas implementaciones)
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
            // Si la propiedad es una función, devolver una función que redirecciona
            if (typeof StorageAdapter.localStorage[collectionName][prop] === 'function') {
                return async function(...args) {
                    if (useFirebase) {
                        return await StorageAdapter.firebase[collectionName][prop](...args);
                    } else {
                        // Para localStorage, envolver en una promesa para mantener la interfaz consistente
                        return await asyncWrapper(StorageAdapter.localStorage[collectionName][prop], ...args);
                    }
                };
            }
            
            // Si no es una función, devolver el valor directamente
            return useFirebase 
                ? StorageAdapter.firebase[collectionName][prop]
                : StorageAdapter.localStorage[collectionName][prop];
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

// Inicializar con Firebase por defecto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase !== 'undefined') {
        setStorageImplementation(true);
        console.log('Usando Firebase como almacenamiento');
    } else {
        setStorageImplementation(false);
        console.warn('Firebase no está disponible, usando localStorage como fallback');
    }
    
    // Inicializar el almacenamiento
    StorageAdapter.initStorage().then(initialized => {
        console.log(`Almacenamiento ${initialized ? 'inicializado' : 'ya estaba inicializado'}`);
    });
});
