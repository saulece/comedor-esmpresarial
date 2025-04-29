/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de gestión de base de datos IndexedDB
 * 
 * Este archivo contiene funciones para gestionar la base de datos IndexedDB,
 * incluyendo la inicialización del esquema, creación de tablas y gestión de versiones.
 */

const IndexedDBManager = {
  /**
   * Configuración de la base de datos
   */
  config: {
    // Nombre de la base de datos
    dbName: 'ComedorEmpresarialDB',
    
    // Versión actual de la base de datos
    dbVersion: 1,
    
    // Nombres de los almacenes de objetos (tablas)
    stores: {
      MENUS: 'menus',
      CONFIRMATIONS: 'confirmations',
      USERS: 'users',
      ARCHIVED_MENUS: 'archivedMenus',
      ARCHIVED_CONFIRMATIONS: 'archivedConfirmations',
      CONFIG: 'config'
    },
    
    // Índices para búsquedas rápidas
    indexes: {
      MENUS: {
        BY_WEEK_START: 'weekStart',
        BY_CREATION_DATE: 'creationDate'
      },
      CONFIRMATIONS: {
        BY_WEEK_START: 'weekStart',
        BY_USER_ID: 'userId',
        BY_CREATION_DATE: 'creationDate'
      },
      USERS: {
        BY_USERNAME: 'username',
        BY_ROLE: 'role'
      }
    }
  },
  
  /**
   * Estado de la conexión a la base de datos
   */
  dbStatus: {
    isInitialized: false,
    db: null,
    error: null
  },
  
  /**
   * Inicializa la base de datos IndexedDB
   * @returns {Promise} Promesa que se resuelve cuando la base de datos está lista
   */
  initDatabase: function() {
    return new Promise((resolve, reject) => {
      // Verificar si IndexedDB está disponible en el navegador
      if (!window.indexedDB) {
        const error = new Error('IndexedDB no está disponible en este navegador.');
        this.dbStatus.error = error;
        console.error(error);
        reject(error);
        return;
      }
      
      console.log(`Inicializando IndexedDB: ${this.config.dbName} (v${this.config.dbVersion})...`);
      
      // Abrir conexión a la base de datos
      const request = window.indexedDB.open(this.config.dbName, this.config.dbVersion);
      
      // Manejador de error
      request.onerror = (event) => {
        const error = new Error(`Error al abrir la base de datos: ${event.target.error}`);
        this.dbStatus.error = error;
        console.error(error);
        reject(error);
      };
      
      // Manejador para actualización de versión o creación inicial
      request.onupgradeneeded = (event) => {
        console.log(`Creando/actualizando esquema de base de datos a versión ${this.config.dbVersion}...`);
        const db = event.target.result;
        
        // Crear almacenes de objetos si no existen
        this._createObjectStores(db);
      };
      
      // Manejador para conexión exitosa
      request.onsuccess = (event) => {
        this.dbStatus.db = event.target.result;
        this.dbStatus.isInitialized = true;
        console.log('Conexión a IndexedDB establecida correctamente.');
        
        // Configurar manejador de errores para la conexión
        this.dbStatus.db.onerror = (event) => {
          console.error('Error en la base de datos IndexedDB:', event.target.error);
        };
        
        resolve(this.dbStatus.db);
      };
    });
  },
  
  /**
   * Crea los almacenes de objetos (tablas) en la base de datos
   * @param {IDBDatabase} db - Conexión a la base de datos
   * @private
   */
  _createObjectStores: function(db) {
    const stores = this.config.stores;
    const indexes = this.config.indexes;
    
    // Crear almacén para menús
    if (!db.objectStoreNames.contains(stores.MENUS)) {
      const menuStore = db.createObjectStore(stores.MENUS, { keyPath: 'id' });
      menuStore.createIndex(indexes.MENUS.BY_WEEK_START, 'weekStart', { unique: false });
      menuStore.createIndex(indexes.MENUS.BY_CREATION_DATE, 'creationDate', { unique: false });
      console.log(`Almacén de objetos creado: ${stores.MENUS}`);
    }
    
    // Crear almacén para confirmaciones
    if (!db.objectStoreNames.contains(stores.CONFIRMATIONS)) {
      const confirmationStore = db.createObjectStore(stores.CONFIRMATIONS, { keyPath: 'id' });
      confirmationStore.createIndex(indexes.CONFIRMATIONS.BY_WEEK_START, 'weekStart', { unique: false });
      confirmationStore.createIndex(indexes.CONFIRMATIONS.BY_USER_ID, 'userId', { unique: false });
      confirmationStore.createIndex(indexes.CONFIRMATIONS.BY_CREATION_DATE, 'creationDate', { unique: false });
      console.log(`Almacén de objetos creado: ${stores.CONFIRMATIONS}`);
    }
    
    // Crear almacén para usuarios
    if (!db.objectStoreNames.contains(stores.USERS)) {
      const userStore = db.createObjectStore(stores.USERS, { keyPath: 'id' });
      userStore.createIndex(indexes.USERS.BY_USERNAME, 'username', { unique: true });
      userStore.createIndex(indexes.USERS.BY_ROLE, 'role', { unique: false });
      console.log(`Almacén de objetos creado: ${stores.USERS}`);
    }
    
    // Crear almacén para menús archivados
    if (!db.objectStoreNames.contains(stores.ARCHIVED_MENUS)) {
      const archivedMenuStore = db.createObjectStore(stores.ARCHIVED_MENUS, { keyPath: 'id' });
      archivedMenuStore.createIndex(indexes.MENUS.BY_WEEK_START, 'weekStart', { unique: false });
      console.log(`Almacén de objetos creado: ${stores.ARCHIVED_MENUS}`);
    }
    
    // Crear almacén para confirmaciones archivadas
    if (!db.objectStoreNames.contains(stores.ARCHIVED_CONFIRMATIONS)) {
      const archivedConfirmationStore = db.createObjectStore(stores.ARCHIVED_CONFIRMATIONS, { keyPath: 'id' });
      archivedConfirmationStore.createIndex(indexes.CONFIRMATIONS.BY_WEEK_START, 'weekStart', { unique: false });
      archivedConfirmationStore.createIndex(indexes.CONFIRMATIONS.BY_USER_ID, 'userId', { unique: false });
      console.log(`Almacén de objetos creado: ${stores.ARCHIVED_CONFIRMATIONS}`);
    }
    
    // Crear almacén para configuración
    if (!db.objectStoreNames.contains(stores.CONFIG)) {
      const configStore = db.createObjectStore(stores.CONFIG, { keyPath: 'key' });
      console.log(`Almacén de objetos creado: ${stores.CONFIG}`);
    }
  },
  
  /**
   * Verifica si la base de datos está inicializada
   * @returns {boolean} True si la base de datos está inicializada
   */
  isDatabaseReady: function() {
    return this.dbStatus.isInitialized && this.dbStatus.db !== null;
  },
  
  /**
   * Obtiene una conexión a la base de datos
   * @returns {Promise<IDBDatabase>} Promesa que se resuelve con la conexión a la base de datos
   */
  getDatabase: function() {
    return new Promise((resolve, reject) => {
      if (this.isDatabaseReady()) {
        resolve(this.dbStatus.db);
      } else {
        this.initDatabase()
          .then(db => resolve(db))
          .catch(error => reject(error));
      }
    });
  },
  
  /**
   * Cierra la conexión a la base de datos
   */
  closeDatabase: function() {
    if (this.isDatabaseReady()) {
      this.dbStatus.db.close();
      this.dbStatus.db = null;
      this.dbStatus.isInitialized = false;
      console.log('Conexión a IndexedDB cerrada.');
    }
  },
  
  /**
   * Elimina la base de datos completa
   * @returns {Promise} Promesa que se resuelve cuando la base de datos ha sido eliminada
   */
  deleteDatabase: function() {
    return new Promise((resolve, reject) => {
      // Cerrar la conexión actual si existe
      this.closeDatabase();
      
      // Eliminar la base de datos
      const request = window.indexedDB.deleteDatabase(this.config.dbName);
      
      request.onerror = (event) => {
        const error = new Error(`Error al eliminar la base de datos: ${event.target.error}`);
        console.error(error);
        reject(error);
      };
      
      request.onsuccess = (event) => {
        console.log(`Base de datos ${this.config.dbName} eliminada correctamente.`);
        this.dbStatus.isInitialized = false;
        this.dbStatus.db = null;
        this.dbStatus.error = null;
        resolve();
      };
    });
  },
  
  /**
   * Obtiene información sobre el estado de la base de datos
   * @returns {Promise<Object>} Promesa que se resuelve con información sobre la base de datos
   */
  getDatabaseInfo: function() {
    return new Promise((resolve, reject) => {
      if (!this.isDatabaseReady()) {
        resolve({
          isReady: false,
          error: this.dbStatus.error ? this.dbStatus.error.message : 'Base de datos no inicializada'
        });
        return;
      }
      
      const db = this.dbStatus.db;
      const stores = this.config.stores;
      const info = {
        name: db.name,
        version: db.version,
        isReady: true,
        objectStores: Array.from(db.objectStoreNames),
        storeStats: {}
      };
      
      // Obtener estadísticas de cada almacén
      const promises = [];
      
      // Función para contar registros en un almacén
      const countRecords = (storeName) => {
        return new Promise((resolveCount, rejectCount) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            info.storeStats[storeName] = {
              count: countRequest.result
            };
            resolveCount();
          };
          
          countRequest.onerror = (event) => {
            console.error(`Error al contar registros en ${storeName}:`, event.target.error);
            info.storeStats[storeName] = {
              count: 'Error',
              error: event.target.error.message
            };
            resolveCount(); // Resolvemos de todas formas para no bloquear
          };
        });
      };
      
      // Contar registros en cada almacén
      Object.values(stores).forEach(storeName => {
        if (db.objectStoreNames.contains(storeName)) {
          promises.push(countRecords(storeName));
        }
      });
      
      // Esperar a que se completen todas las operaciones
      Promise.all(promises)
        .then(() => resolve(info))
        .catch(error => {
          console.error('Error al obtener información de la base de datos:', error);
          reject(error);
        });
    });
  }
};

// Exportar el objeto IndexedDBManager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexedDBManager;
}
