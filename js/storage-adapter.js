/**
 * storage-adapter.js
 * Adaptador para facilitar el uso de Firebase como almacenamiento principal
 * Mantiene la misma interfaz de StorageUtil pero usa Firebase exclusivamente
 * 
 * Versión: 2.0.0
 * Mejoras:
 * - Inicialización robusta con flag de estado
 * - Manejo de modo offline/online
 * - Mejor recuperación de errores
 * - Versionado de datos consistente
 */

// Constantes para el estado de inicialización
const INIT_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// Constante para el nombre del flag de inicialización en localStorage
const INIT_FLAG_KEY = 'firebase_adapter_init_status';

// Constante para la versión de los datos
const DATA_VERSION = '2.0.0';

// Variable para controlar el estado de la conexión
let isOnline = navigator.onLine;

// Escuchar eventos de conexión
window.addEventListener('online', () => {
    console.log('[StorageAdapter] Conexión recuperada, sincronizando datos...');
    isOnline = true;
    // Intentar sincronizar datos pendientes cuando se recupere la conexión
    StorageAdapter.syncPendingData();
});

window.addEventListener('offline', () => {
    console.log('[StorageAdapter] Conexión perdida, cambiando a modo offline');
    isOnline = false;
});

// Función para inicializar la implementación de Firebase con mejor manejo de errores
async function initFirebaseStorage() {
    console.log('[StorageAdapter] Inicializando implementación de Firebase');
    
    try {
        // Verificar si ya hay una inicialización en progreso
        const currentStatus = localStorage.getItem(INIT_FLAG_KEY);
        
        if (currentStatus === INIT_STATUS.IN_PROGRESS) {
            console.log('[StorageAdapter] Inicialización ya en progreso, esperando...');
            // Esperar un momento y verificar de nuevo
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initFirebaseStorage(); // Reintentar recursivamente
        }
        
        if (currentStatus === INIT_STATUS.COMPLETED) {
            console.log('[StorageAdapter] Firebase ya inicializado según flag');
            // Verificar que realmente esté inicializado
            if (FirebaseService && FirebaseService.isInitialized()) {
                return true;
            } else {
                console.warn('[StorageAdapter] Flag indica inicializado pero Firebase no lo está, reiniciando...');
                localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.NOT_STARTED);
            }
        }
        
        // Marcar como en progreso
        localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.IN_PROGRESS);
        
        // Asegurarse de que Firebase esté disponible
        if (typeof FirebaseService === 'undefined') {
            console.error('[StorageAdapter] FirebaseService no está disponible. Revisa que firebase-config.js esté cargado.');
            localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.FAILED);
            return false;
        }
        
        // Usar el método asíncrono si está disponible
        let result;
        if (typeof FirebaseService.initFirebaseAsync === 'function') {
            result = await FirebaseService.initFirebaseAsync();
        } else {
            result = FirebaseService.initFirebase();
        }
        
        console.log('[StorageAdapter] Resultado de inicialización de Firebase:', result);
        
        if (result) {
            localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.COMPLETED);
        } else {
            localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.FAILED);
        }
        
        return result;
    } catch (error) {
        console.error('[StorageAdapter] Error durante la inicialización de Firebase:', error);
        localStorage.setItem(INIT_FLAG_KEY, INIT_STATUS.FAILED);
        return false;
    }
}

// Objeto que intercepta las llamadas y las redirige a la implementación de Firebase
const StorageAdapter = {
    // Referencia a la implementación de Firebase
    firebase: null, // Se inicializará después
    
    // Cola de operaciones pendientes para modo offline
    pendingOperations: [],
    
    // Estado de inicialización
    initialized: false,
    
    // Método para inicializar el almacenamiento con mejor manejo de errores
    async initStorage() {
        console.log('[StorageAdapter] Iniciando inicialización del almacenamiento');
        
        // Si ya está inicializado, retornar inmediatamente
        if (this.initialized) {
            console.log('[StorageAdapter] El adaptador ya está inicializado');
            return true;
        }
        
        // Usar la función de inicialización mejorada
        const initResult = await initFirebaseStorage();
        if (!initResult) {
            console.error('[StorageAdapter] La inicialización de Firebase falló');
            return false;
        }
        
        // Verificar que StorageUtil esté disponible y asignarlo
        if (!this.firebase) {
            if (typeof StorageUtil !== 'undefined') {
                this.firebase = StorageUtil;
                console.log('[StorageAdapter] StorageUtil asignado correctamente');
            } else {
                console.error('[StorageAdapter] ERROR: StorageUtil no está disponible. Revisa que firebase-storage.js esté cargado.');
                return false;
            }
        }
        
        // Verificar que this.firebase tenga el método initStorage
        if (typeof this.firebase.initStorage !== 'function') {
            console.error('[StorageAdapter] ERROR: El objeto StorageUtil no tiene el método initStorage');
            return false;
        }
        
        try {
            // Inicializar el almacenamiento en Firebase
            const result = await this.firebase.initStorage();
            
            // Cargar operaciones pendientes del almacenamiento local
            await this.loadPendingOperations();
            
            // Intentar sincronizar datos pendientes si estamos online
            if (isOnline) {
                await this.syncPendingData();
            }
            
            // Marcar como inicializado
            this.initialized = true;
            
            return true;
        } catch (error) {
            console.error('[StorageAdapter] ERROR: Excepción al inicializar el almacenamiento:', error);
            return false;
        }
    },
    
    // Método para cargar operaciones pendientes del almacenamiento local
    async loadPendingOperations() {
        try {
            const pendingOpsString = localStorage.getItem('pendingOperations');
            if (pendingOpsString) {
                this.pendingOperations = JSON.parse(pendingOpsString);
                console.log(`[StorageAdapter] Cargadas ${this.pendingOperations.length} operaciones pendientes`);
            }
        } catch (error) {
            console.error('[StorageAdapter] Error al cargar operaciones pendientes:', error);
            this.pendingOperations = [];
        }
    },
    
    // Método para guardar operaciones pendientes en el almacenamiento local
    savePendingOperations() {
        try {
            localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
        } catch (error) {
            console.error('[StorageAdapter] Error al guardar operaciones pendientes:', error);
        }
    },
    
    // Método para añadir una operación pendiente
    addPendingOperation(operation) {
        // Añadir timestamp a la operación
        operation.timestamp = new Date().toISOString();
        operation.version = DATA_VERSION;
        
        // Añadir a la cola
        this.pendingOperations.push(operation);
        
        // Guardar en localStorage
        this.savePendingOperations();
        
        console.log(`[StorageAdapter] Operación añadida a la cola: ${operation.type} en ${operation.collection}`);
    },
    
    // Método para sincronizar datos pendientes con Firebase
    async syncPendingData() {
        if (!isOnline || this.pendingOperations.length === 0) {
            return;
        }
        
        console.log(`[StorageAdapter] Sincronizando ${this.pendingOperations.length} operaciones pendientes`);
        
        // Copiar el array para no modificar el original durante la iteración
        const operations = [...this.pendingOperations];
        
        // Limpiar el array original
        this.pendingOperations = [];
        this.savePendingOperations();
        
        // Procesar cada operación
        for (const op of operations) {
            try {
                console.log(`[StorageAdapter] Procesando operación pendiente: ${op.type} en ${op.collection}`);
                
                switch (op.type) {
                    case 'add':
                        await this.firebase.addItem(op.collection, op.data);
                        break;
                    case 'update':
                        await this.firebase.updateItem(op.collection, op.id, op.data);
                        break;
                    case 'delete':
                        await this.firebase.deleteItem(op.collection, op.id);
                        break;
                    default:
                        console.warn(`[StorageAdapter] Tipo de operación desconocido: ${op.type}`);
                }
                
                console.log(`[StorageAdapter] Operación pendiente procesada con éxito: ${op.type}`);
            } catch (error) {
                console.error(`[StorageAdapter] Error al procesar operación pendiente:`, error);
                // Volver a añadir la operación a la cola
                this.pendingOperations.push(op);
            }
        }
        
        // Guardar las operaciones que no se pudieron procesar
        if (this.pendingOperations.length > 0) {
            console.warn(`[StorageAdapter] Quedan ${this.pendingOperations.length} operaciones pendientes`);
            this.savePendingOperations();
        } else {
            console.log('[StorageAdapter] Todas las operaciones pendientes procesadas con éxito');
        }
    },
    
    // Métodos principales con soporte para modo offline y versionado de datos
    async save(key, data) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Añadir metadatos de versión y timestamp
            const enhancedData = Array.isArray(data) 
                ? data.map(item => this.addMetadata(item))
                : this.addMetadata(data);
            
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación save para ${key} en cola`);
                this.addPendingOperation({
                    type: 'save',
                    collection: key,
                    data: enhancedData
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar guardar en Firebase
            const result = await this.firebase.save(key, enhancedData);
            
            // Si falla, guardar para reintento
            if (!result) {
                this.addPendingOperation({
                    type: 'save',
                    collection: key,
                    data: enhancedData
                });
            }
            
            return result;
        } catch (error) {
            console.error(`[StorageAdapter] Error al guardar datos en ${key}:`, error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'save',
                collection: key,
                data: Array.isArray(data) ? data.map(item => this.addMetadata(item)) : this.addMetadata(data)
            });
            
            return false;
        }
    },
    
    async get(key, defaultValue = null) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Intentar obtener datos de Firebase
            const result = await this.firebase.get(key, defaultValue);
            
            // Verificar si hay operaciones pendientes para esta colección
            const pendingOps = this.pendingOperations.filter(op => op.collection === key);
            
            // Si no hay operaciones pendientes, retornar el resultado tal cual
            if (pendingOps.length === 0) {
                return result;
            }
            
            // Si hay operaciones pendientes, aplicarlas a los datos obtenidos
            console.log(`[StorageAdapter] Aplicando ${pendingOps.length} operaciones pendientes a los datos de ${key}`);
            
            // Clonar los datos para no modificar el original
            let updatedData = result ? JSON.parse(JSON.stringify(result)) : defaultValue;
            
            // Si es un array, aplicar las operaciones pendientes
            if (Array.isArray(updatedData)) {
                for (const op of pendingOps) {
                    switch (op.type) {
                        case 'add':
                        case 'addItem':
                            // Evitar duplicados
                            if (!updatedData.some(item => item.id === op.data.id)) {
                                updatedData.push(op.data);
                            }
                            break;
                        case 'update':
                        case 'updateItem':
                            // Actualizar el item existente
                            const index = updatedData.findIndex(item => item.id === op.id);
                            if (index !== -1) {
                                updatedData[index] = { ...updatedData[index], ...op.data };
                            }
                            break;
                        case 'delete':
                        case 'deleteItem':
                            // Eliminar el item
                            updatedData = updatedData.filter(item => item.id !== op.id);
                            break;
                    }
                }
            }
            
            return updatedData;
        } catch (error) {
            console.error(`[StorageAdapter] Error al obtener datos de ${key}:`, error);
            
            // En caso de error, intentar recuperar datos del localStorage
            try {
                const localBackup = localStorage.getItem(`local_backup_${key}`);
                if (localBackup) {
                    console.log(`[StorageAdapter] Recuperando datos de respaldo local para ${key}`);
                    return JSON.parse(localBackup);
                }
            } catch (backupError) {
                console.error(`[StorageAdapter] Error al recuperar respaldo local:`, backupError);
            }
            
            return defaultValue;
        }
    },
    
    async updateItem(key, itemId, newData) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Añadir metadatos
            const enhancedData = this.addMetadata(newData);
            
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación updateItem para ${key}/${itemId} en cola`);
                this.addPendingOperation({
                    type: 'update',
                    collection: key,
                    id: itemId,
                    data: enhancedData
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar actualizar en Firebase
            const result = await this.firebase.updateItem(key, itemId, enhancedData);
            
            // Si falla, guardar para reintento
            if (!result) {
                this.addPendingOperation({
                    type: 'update',
                    collection: key,
                    id: itemId,
                    data: enhancedData
                });
            }
            
            return result;
        } catch (error) {
            console.error(`[StorageAdapter] Error al actualizar item en ${key}:`, error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'update',
                collection: key,
                id: itemId,
                data: this.addMetadata(newData)
            });
            
            return false;
        }
    },
    
    async deleteItem(key, itemId) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación deleteItem para ${key}/${itemId} en cola`);
                this.addPendingOperation({
                    type: 'delete',
                    collection: key,
                    id: itemId
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar eliminar en Firebase
            const result = await this.firebase.deleteItem(key, itemId);
            
            // Si falla, guardar para reintento
            if (!result) {
                this.addPendingOperation({
                    type: 'delete',
                    collection: key,
                    id: itemId
                });
            }
            
            return result;
        } catch (error) {
            console.error(`[StorageAdapter] Error al eliminar item de ${key}:`, error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'delete',
                collection: key,
                id: itemId
            });
            
            return false;
        }
    },
    
    async addItem(key, item) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Asegurar que el item tenga un ID
            if (!item.id) {
                item.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Añadir metadatos
            const enhancedItem = this.addMetadata(item);
            
            // Crear un respaldo local del item
            try {
                const localBackupKey = `local_item_${key}_${item.id}`;
                localStorage.setItem(localBackupKey, JSON.stringify(enhancedItem));
            } catch (backupError) {
                console.warn(`[StorageAdapter] No se pudo crear respaldo local:`, backupError);
            }
            
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación addItem para ${key} en cola`);
                this.addPendingOperation({
                    type: 'add',
                    collection: key,
                    data: enhancedItem
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar añadir en Firebase
            const result = await this.firebase.addItem(key, enhancedItem);
            
            // Si falla, guardar para reintento
            if (!result) {
                this.addPendingOperation({
                    type: 'add',
                    collection: key,
                    data: enhancedItem
                });
            }
            
            return result;
        } catch (error) {
            console.error(`[StorageAdapter] Error al añadir item a ${key}:`, error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'add',
                collection: key,
                data: this.addMetadata(item)
            });
            
            return false;
        }
    },
    
    async getItem(key, itemId) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Buscar primero en operaciones pendientes
            const pendingAdd = this.pendingOperations.find(op => 
                (op.type === 'add' || op.type === 'update') && 
                op.collection === key && 
                (op.id === itemId || (op.data && op.data.id === itemId))
            );
            
            if (pendingAdd) {
                console.log(`[StorageAdapter] Usando datos pendientes para ${key}/${itemId}`);
                return pendingAdd.data || null;
            }
            
            // Verificar si hay una operación de eliminación pendiente
            const pendingDelete = this.pendingOperations.find(op => 
                op.type === 'delete' && 
                op.collection === key && 
                op.id === itemId
            );
            
            if (pendingDelete) {
                console.log(`[StorageAdapter] Item ${key}/${itemId} está pendiente de eliminación`);
                return null;
            }
            
            // Intentar obtener de Firebase
            return await this.firebase.getItem(key, itemId);
        } catch (error) {
            console.error(`[StorageAdapter] Error al obtener item de ${key}:`, error);
            
            // Intentar recuperar del respaldo local
            try {
                const localBackupKey = `local_item_${key}_${itemId}`;
                const localBackup = localStorage.getItem(localBackupKey);
                if (localBackup) {
                    console.log(`[StorageAdapter] Recuperando item de respaldo local para ${key}/${itemId}`);
                    return JSON.parse(localBackup);
                }
            } catch (backupError) {
                console.error(`[StorageAdapter] Error al recuperar respaldo local:`, backupError);
            }
            
            return null;
        }
    },
    
    async remove(key) {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación remove para ${key} en cola`);
                this.addPendingOperation({
                    type: 'remove',
                    collection: key
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar eliminar en Firebase
            return await this.firebase.remove(key);
        } catch (error) {
            console.error(`[StorageAdapter] Error al eliminar ${key}:`, error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'remove',
                collection: key
            });
            
            return false;
        }
    },
    
    async clear() {
        // Asegurar que el adaptador esté inicializado
        if (!this.initialized) await this.initStorage();
        
        try {
            // Si estamos offline, guardar la operación para sincronizar más tarde
            if (!isOnline) {
                console.log(`[StorageAdapter] Modo offline: guardando operación clear en cola`);
                this.addPendingOperation({
                    type: 'clear'
                });
                return true; // Simular éxito en modo offline
            }
            
            // Intentar limpiar en Firebase
            return await this.firebase.clear();
        } catch (error) {
            console.error('[StorageAdapter] Error al limpiar el almacenamiento:', error);
            
            // Guardar para reintento en caso de error
            this.addPendingOperation({
                type: 'clear'
            });
            
            return false;
        }
    },
    
    // Método para añadir metadatos a los datos
    addMetadata(data) {
        if (!data || typeof data !== 'object') return data;
        
        // Crear una copia para no modificar el original
        const enhancedData = { ...data };
        
        // Añadir o actualizar metadatos
        enhancedData.updatedAt = new Date().toISOString();
        enhancedData.version = DATA_VERSION;
        
        // Si no tiene createdAt, añadirlo
        if (!enhancedData.createdAt) {
            enhancedData.createdAt = new Date().toISOString();
        }
        
        return enhancedData;
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
