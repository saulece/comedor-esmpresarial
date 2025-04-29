/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Servicio unificado de almacenamiento
 * 
 * Este archivo proporciona una fachada unificada para acceder al almacenamiento,
 * utilizando IndexedDB como almacenamiento principal y localStorage como fallback.
 * Incluye soporte para almacenamiento seguro de datos sensibles mediante encriptación.
 */

const StorageService = {
  /**
   * Configuración del servicio
   */
  config: {
    // Indica si el servicio está inicializado
    isInitialized: false,
    
    // Indica si se está utilizando el fallback
    usingFallback: false,
    
    // Indica si se debe usar almacenamiento seguro
    useSecureStorage: true,
    
    // Mapeo de nombres de almacenes
    stores: {
      MENUS: 'menus',
      CONFIRMATIONS: 'confirmations',
      USERS: 'users',
      ARCHIVED_MENUS: 'archivedMenus',
      ARCHIVED_CONFIRMATIONS: 'archivedConfirmations',
      CONFIG: 'config'
    },
    
    // Mapeo de índices para búsquedas
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
   * Inicializa el servicio de almacenamiento
   * @param {Object} options - Opciones de inicialización
   * @returns {Promise} Promesa que se resuelve cuando el servicio está inicializado
   */
  init: function(options = {}) {
    return new Promise((resolve, reject) => {
      // Si ya está inicializado, resolver inmediatamente
      if (this.config.isInitialized) {
        resolve();
        return;
      }
      
      console.log('Inicializando servicio de almacenamiento...');
      
      // Verificar si es necesario migrar datos
      DataMigration.checkMigrationNeeded()
        .then(needsMigration => {
          // Intentar inicializar IndexedDB
          return IndexedDBManager.initDatabase()
            .then(() => {
              console.log('IndexedDB inicializado correctamente.');
              this.config.usingFallback = false;
              
              // Si es necesario migrar datos, hacerlo
              if (needsMigration) {
                console.log('Se requiere migración de datos desde localStorage.');
                return DataMigration.migrateData(options.migrationProgressCallback);
              }
              
              return Promise.resolve();
            })
            .catch(error => {
              console.warn('Error al inicializar IndexedDB, utilizando fallback:', error);
              this.config.usingFallback = true;
              
              // Verificar si localStorage está disponible
              if (!StorageFallback.isLocalStorageAvailable()) {
                throw new Error('No se pudo inicializar IndexedDB ni localStorage.');
              }
              
              // Activar modo fallback
              StorageFallback.activateFallback('Error al inicializar IndexedDB: ' + error.message);
              return Promise.resolve();
            });
        })
        .then(() => {
          this.config.isInitialized = true;
          console.log(`Servicio de almacenamiento inicializado. Usando fallback: ${this.config.usingFallback}`);
          resolve();
        })
        .catch(error => {
          console.error('Error al inicializar el servicio de almacenamiento:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Agrega un objeto al almacenamiento
   * @param {string} storeName - Nombre del almacén
   * @param {Object} data - Datos a agregar
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<string>} Promesa que se resuelve con el ID del objeto agregado
   */
  add: function(storeName, data, secure = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useSecure = secure !== null ? secure : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          // En modo fallback, aplicar encriptación manual si es necesario
          let dataToStore = data;
          if (useSecure && typeof SecureStorage !== 'undefined') {
            dataToStore = SecureStorage.encryptSensitiveData(data, storeName);
          }
          return StorageFallback.add(storeName, dataToStore);
        } else {
          return IndexedDBCrud.add(storeName, data, useSecure);
        }
      });
  },
  
  /**
   * Obtiene un objeto por su ID
   * @param {string} storeName - Nombre del almacén
   * @param {string|number} id - ID del objeto a obtener
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Object>} Promesa que se resuelve con el objeto encontrado o null si no existe
   */
  getById: function(storeName, id, decrypt = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useDecrypt = decrypt !== null ? decrypt : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          // Obtener datos del fallback
          return StorageFallback.getById(storeName, id)
            .then(result => {
              // Desencriptar si es necesario
              if (result && useDecrypt && typeof SecureStorage !== 'undefined' && 
                  SecureStorage.hasEncryptedData(result, storeName)) {
                return SecureStorage.decryptSensitiveData(result, storeName);
              }
              return result;
            });
        } else {
          return IndexedDBCrud.getById(storeName, id, useDecrypt);
        }
      });
  },
  
  /**
   * Obtiene todos los objetos de un almacén
   * @param {string} storeName - Nombre del almacén
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos
   */
  getAll: function(storeName, decrypt = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useDecrypt = decrypt !== null ? decrypt : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          // Obtener datos del fallback
          return StorageFallback.getAll(storeName)
            .then(results => {
              // Desencriptar si es necesario
              if (useDecrypt && typeof SecureStorage !== 'undefined' && results.length > 0) {
                return results.map(item => {
                  if (SecureStorage.hasEncryptedData(item, storeName)) {
                    return SecureStorage.decryptSensitiveData(item, storeName);
                  }
                  return item;
                });
              }
              return results;
            });
        } else {
          return IndexedDBCrud.getAll(storeName, useDecrypt);
        }
      });
  },
  
  /**
   * Actualiza un objeto existente
   * @param {string} storeName - Nombre del almacén
   * @param {Object} data - Datos a actualizar (debe incluir el ID)
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se actualizó correctamente
   */
  update: function(storeName, data, secure = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useSecure = secure !== null ? secure : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          // En modo fallback, aplicar encriptación manual si es necesario
          let dataToStore = data;
          if (useSecure && typeof SecureStorage !== 'undefined') {
            dataToStore = SecureStorage.encryptSensitiveData(data, storeName);
          }
          return StorageFallback.update(storeName, dataToStore);
        } else {
          return IndexedDBCrud.update(storeName, data, useSecure);
        }
      });
  },
  
  /**
   * Elimina un objeto por su ID
   * @param {string} storeName - Nombre del almacén
   * @param {string|number} id - ID del objeto a eliminar
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminó correctamente
   */
  delete: function(storeName, id) {
    return this._ensureInitialized()
      .then(() => {
        if (this.config.usingFallback) {
          return StorageFallback.delete(storeName, id);
        } else {
          return IndexedDBCrud.delete(storeName, id);
        }
      });
  },
  
  /**
   * Elimina todos los objetos de un almacén
   * @param {string} storeName - Nombre del almacén
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminaron correctamente
   */
  deleteAll: function(storeName) {
    return this._ensureInitialized()
      .then(() => {
        if (this.config.usingFallback) {
          return StorageFallback.deleteAll(storeName);
        } else {
          return IndexedDBCrud.deleteAll(storeName);
        }
      });
  },
  
  /**
   * Busca objetos por un campo y valor específicos
   * @param {string} storeName - Nombre del almacén
   * @param {string} field - Campo por el que buscar
   * @param {any} value - Valor a buscar
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos que coinciden
   */
  findByField: function(storeName, field, value, decrypt = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useDecrypt = decrypt !== null ? decrypt : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          return StorageFallback.findByField(storeName, field, value)
            .then(results => {
              // Desencriptar si es necesario
              if (useDecrypt && typeof SecureStorage !== 'undefined' && results.length > 0) {
                return results.map(item => {
                  if (SecureStorage.hasEncryptedData(item, storeName)) {
                    return SecureStorage.decryptSensitiveData(item, storeName);
                  }
                  return item;
                });
              }
              return results;
            });
        } else {
          // Verificar si el campo tiene un índice
          const storeIndexes = this._getIndexesForStore(storeName);
          if (storeIndexes && storeIndexes[field]) {
            return IndexedDBCrud.findByIndex(storeName, storeIndexes[field], value, useDecrypt);
          } else {
            // Si no hay índice, obtener todos y filtrar
            return IndexedDBCrud.getAll(storeName, useDecrypt)
              .then(items => items.filter(item => item[field] === value));
          }
        }
      });
  },
  
  /**
   * Busca objetos en un rango de fechas
   * @param {string} storeName - Nombre del almacén
   * @param {string} dateField - Campo de fecha
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos que coinciden
   */
  findByDateRange: function(storeName, dateField, startDate, endDate) {
    return this._ensureInitialized()
      .then(() => {
        if (this.config.usingFallback) {
          // En fallback, obtener todos y filtrar
          return StorageFallback.getAll(storeName)
            .then(items => {
              return items.filter(item => {
                const itemDate = new Date(item[dateField]);
                return itemDate >= startDate && itemDate <= endDate;
              });
            });
        } else {
          // Verificar si el campo tiene un índice
          const storeIndexes = this._getIndexesForStore(storeName);
          if (storeIndexes && storeIndexes[dateField]) {
            const range = IDBKeyRange.bound(
              startDate.toISOString(),
              endDate.toISOString()
            );
            return IndexedDBCrud.findByRange(storeName, storeIndexes[dateField], range);
          } else {
            // Si no hay índice, obtener todos y filtrar
            return IndexedDBCrud.getAll(storeName)
              .then(items => {
                return items.filter(item => {
                  const itemDate = new Date(item[dateField]);
                  return itemDate >= startDate && itemDate <= endDate;
                });
              });
          }
        }
      });
  },
  
  /**
   * Realiza una operación en lote
   * @param {string} storeName - Nombre del almacén
   * @param {string} operation - Tipo de operación ('add', 'update', 'delete')
   * @param {Array} items - Array de objetos o IDs
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<boolean>} Promesa que se resuelve con true si todas las operaciones fueron exitosas
   */
  bulkOperation: function(storeName, operation, items, secure = null) {
    return this._ensureInitialized()
      .then(() => {
        // Usar la configuración global si no se especifica
        const useSecure = secure !== null ? secure : this.config.useSecureStorage;
        
        if (this.config.usingFallback) {
          // En modo fallback, aplicar encriptación manual si es necesario
          let processedItems = items;
          if (useSecure && typeof SecureStorage !== 'undefined' && 
              (operation === 'add' || operation === 'update') && 
              processedItems.length > 0) {
            processedItems = processedItems.map(item => {
              if (typeof item === 'object' && item !== null) {
                return SecureStorage.encryptSensitiveData(item, storeName);
              }
              return item;
            });
          }
          return StorageFallback.bulkOperation(storeName, operation, processedItems);
        } else {
          return IndexedDBCrud.bulkOperation(storeName, operation, items, useSecure);
        }
      });
  },
  
  /**
   * Obtiene una configuración
   * @param {string} key - Clave de la configuración
   * @returns {Promise<any>} Promesa que se resuelve con el valor de la configuración
   */
  getConfig: function(key) {
    return this._ensureInitialized()
      .then(() => {
        return this.getById(this.config.stores.CONFIG, key)
          .then(config => {
            return config ? config.value : null;
          });
      });
  },
  
  /**
   * Establece una configuración
   * @param {string} key - Clave de la configuración
   * @param {any} value - Valor de la configuración
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se guardó correctamente
   */
  setConfig: function(key, value) {
    return this._ensureInitialized()
      .then(() => {
        return this.getById(this.config.stores.CONFIG, key)
          .then(config => {
            if (config) {
              config.value = value;
              return this.update(this.config.stores.CONFIG, config);
            } else {
              return this.add(this.config.stores.CONFIG, {
                key: key,
                value: value
              });
            }
          });
      });
  },
  
  /**
   * Obtiene información sobre el almacenamiento
   * @returns {Promise<Object>} Promesa que se resuelve con información sobre el almacenamiento
   */
  getStorageInfo: function() {
    return this._ensureInitialized()
      .then(() => {
        if (this.config.usingFallback) {
          return StorageFallback.getStorageInfo();
        } else {
          return IndexedDBManager.getDatabaseInfo();
        }
      })
      .then(info => {
        return {
          ...info,
          usingFallback: this.config.usingFallback,
          useSecureStorage: this.config.useSecureStorage,
          migrationStatus: DataMigration.getMigrationStatus()
        };
      });
  },
  
  /**
   * Crea un respaldo de los datos
   * @returns {Promise<Object>} Promesa que se resuelve con información sobre el respaldo
   */
  createBackup: function() {
    return this._ensureInitialized()
      .then(() => {
        // Obtener todos los datos
        const promises = [];
        const stores = this.config.stores;
        const data = {};
        
        for (const storeKey in stores) {
          if (Object.prototype.hasOwnProperty.call(stores, storeKey)) {
            const storeName = stores[storeKey];
            promises.push(
              this.getAll(storeName)
                .then(items => {
                  data[storeName] = items;
                })
            );
          }
        }
        
        return Promise.all(promises)
          .then(() => {
            // Comprimir los datos
            const compressed = DataCompression.compress(data);
            
            // Crear metadatos del respaldo
            const backup = {
              data: compressed,
              metadata: {
                version: '1.0',
                timestamp: new Date().toISOString(),
                usingFallback: this.config.usingFallback
              }
            };
            
            // Guardar en localStorage para que sea accesible incluso si IndexedDB falla
            localStorage.setItem('comedor_backup', JSON.stringify(backup.metadata));
            localStorage.setItem('comedor_backup_data', compressed);
            
            return {
              success: true,
              timestamp: backup.metadata.timestamp,
              size: compressed.length
            };
          });
      });
  },
  
  /**
   * Restaura datos desde un respaldo
   * @param {Object} backupData - Datos del respaldo (opcional)
   * @returns {Promise<Object>} Promesa que se resuelve con información sobre la restauración
   */
  restoreFromBackup: function(backupData) {
    return this._ensureInitialized()
      .then(() => {
        // Si no se proporciona respaldo, usar el último guardado
        if (!backupData) {
          backupData = localStorage.getItem('comedor_backup_data');
          if (!backupData) {
            throw new Error('No hay respaldo disponible para restaurar.');
          }
        }
        
        // Descomprimir datos
        const decompressed = DataCompression.decompress(backupData);
        if (!decompressed) {
          throw new Error('Error al descomprimir datos de respaldo.');
        }
        
        // Restaurar cada almacén
        const promises = [];
        const stores = this.config.stores;
        let totalItems = 0;
        
        for (const storeKey in stores) {
          if (Object.prototype.hasOwnProperty.call(stores, storeKey)) {
            const storeName = stores[storeKey];
            if (decompressed[storeName] && Array.isArray(decompressed[storeName])) {
              const items = decompressed[storeName];
              totalItems += items.length;
              
              // Limpiar almacén y agregar nuevos datos
              promises.push(
                this.deleteAll(storeName)
                  .then(() => this.bulkOperation(storeName, 'add', items))
              );
            }
          }
        }
        
        return Promise.all(promises)
          .then(() => {
            return {
              success: true,
              message: 'Restauración completada correctamente.',
              itemsRestored: totalItems
            };
          });
      });
  },
  
  /**
   * Asegura que el servicio esté inicializado antes de usarlo
   * @returns {Promise} Promesa que se resuelve cuando el servicio está inicializado
   * @private
   */
  _ensureInitialized: function() {
    if (this.config.isInitialized) {
      return Promise.resolve();
    } else {
      return this.init();
    }
  },
  
  /**
   * Obtiene los índices para un almacén específico
   * @param {string} storeName - Nombre del almacén
   * @returns {Object|null} Índices del almacén o null si no existen
   * @private
   */
  _getIndexesForStore: function(storeName) {
    // Convertir nombre de almacén a clave de índice
    let indexKey = null;
    for (const key in this.config.stores) {
      if (this.config.stores[key] === storeName) {
        indexKey = key;
        break;
      }
    }
    
    if (indexKey && this.config.indexes[indexKey]) {
      return this.config.indexes[indexKey];
    }
    
    return null;
  },
  
  /**
   * Configura si se debe usar almacenamiento seguro
   * @param {boolean} useSecure - Indica si se debe usar almacenamiento seguro
   */
  setSecureStorage: function(useSecure) {
    this.config.useSecureStorage = !!useSecure;
    console.log(`Almacenamiento seguro ${this.config.useSecureStorage ? 'activado' : 'desactivado'}`);
  },
  
  /**
   * Verifica si un objeto tiene datos encriptados y los desencripta si es necesario
   * @param {Object} data - Datos a verificar y posiblemente desencriptar
   * @param {string} storeName - Nombre del almacén de objetos
   * @returns {Object} Objeto desencriptado si tenía datos encriptados, o el objeto original
   */
  ensureDecrypted: function(data, storeName) {
    if (!data || typeof data !== 'object' || !storeName) {
      return data;
    }
    
    // Verificar si el módulo SecureStorage está disponible
    if (typeof SecureStorage === 'undefined') {
      return data;
    }
    
    // Verificar si el objeto tiene datos encriptados
    if (SecureStorage.hasEncryptedData(data, storeName)) {
      return SecureStorage.decryptSensitiveData(data, storeName);
    }
    
    return data;
  }
};

// Exportar el objeto StorageService
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
}
