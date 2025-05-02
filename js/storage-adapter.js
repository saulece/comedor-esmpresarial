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
    firebase: window.FirestoreUtil,   // La implementación de Firebase
    
    // Método para inicializar el almacenamiento
    async initStorage() {
        return await this.firebase.initStorage();
    },
    
    // Métodos principales
    async save(key, data) {
        return await this.firebase.save(key, data);
    },
    
    async get(key, defaultValue = null) {
        return await this.firebase.get(key, defaultValue);
    },
    
    async updateItem(key, itemId, newData) {
        return await this.firebase.updateItem(key, itemId, newData);
    },
    
    async deleteItem(key, itemId) {
        return await this.firebase.deleteItem(key, itemId);
    },
    
    async addItem(key, item) {
        return await this.firebase.addItem(key, item);
    },
    
    async getItem(key, itemId) {
        return await this.firebase.getItem(key, itemId);
    },
    
    async remove(key) {
        return await this.firebase.remove(key);
    },
    
    async clear() {
        return await this.firebase.clear();
    },
    
    // Exportar/importar datos
    async exportData() {
        return await this.firebase.exportData();
    },
    
    async downloadData() {
        return await this.firebase.downloadData();
    },
    
    async importData(data) {
        return await this.firebase.importData(data);
    },
    
    async importFromFile(file) {
        return await this.firebase.importFromFile(file);
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
            if (typeof StorageAdapter.firebase[collectionName][prop] === 'function') {
                return async function(...args) {
                    return await StorageAdapter.firebase[collectionName][prop](...args);
                };
            }
            
            // Si no es una función, devolver el valor directamente de Firebase
            return StorageAdapter.firebase[collectionName][prop];
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
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase !== 'undefined') {
        initFirebaseStorage();
        console.log('Firebase inicializado como almacenamiento principal');
    } else {
        console.error('Firebase no está disponible. La aplicación no funcionará correctamente.');
    }
    
    // Inicializar el almacenamiento
    StorageAdapter.initStorage().then(initialized => {
        console.log(`Almacenamiento ${initialized ? 'inicializado' : 'ya estaba inicializado'}`);
    });
});
