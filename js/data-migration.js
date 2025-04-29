/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de migración de datos desde localStorage a IndexedDB
 * 
 * Este archivo contiene utilidades para migrar datos desde el almacenamiento
 * local (localStorage) a la base de datos IndexedDB, asegurando la compatibilidad
 * y preservación de los datos existentes.
 */

const DataMigration = {
  /**
   * Configuración del sistema de migración
   */
  config: {
    // Mapeo de claves de localStorage a almacenes de IndexedDB
    storeMappings: {
      'comedor_MENUS': 'menus',
      'comedor_CONFIRMATIONS': 'confirmations',
      'comedor_USERS': 'users',
      'comedor_ARCHIVED_MENUS': 'archivedMenus',
      'comedor_ARCHIVED_CONFIRMATIONS': 'archivedConfirmations',
      'comedor_CONFIG': 'config'
    },
    
    // Flag para indicar si la migración está en progreso
    isMigrationInProgress: false,
    
    // Flag para indicar si la migración se ha completado
    migrationCompleted: false,
    
    // Clave para almacenar el estado de la migración
    migrationStatusKey: 'comedor_MIGRATION_STATUS',
    
    // Versión de la migración
    migrationVersion: '1.0'
  },
  
  /**
   * Verifica si es necesario realizar una migración
   * @returns {Promise<boolean>} Promesa que se resuelve con true si es necesario migrar
   */
  checkMigrationNeeded: function() {
    return new Promise((resolve, reject) => {
      try {
        // Verificar si la migración ya se ha completado
        const migrationStatus = localStorage.getItem(this.config.migrationStatusKey);
        if (migrationStatus) {
          try {
            const status = JSON.parse(migrationStatus);
            if (status.completed && status.version === this.config.migrationVersion) {
              console.log('La migración ya se ha completado anteriormente.');
              this.config.migrationCompleted = true;
              resolve(false);
              return;
            }
          } catch (e) {
            console.warn('Error al parsear el estado de migración:', e);
          }
        }
        
        // Verificar si hay datos en localStorage que necesiten ser migrados
        let hasDataToMigrate = false;
        for (const localStorageKey in this.config.storeMappings) {
          const data = localStorage.getItem(localStorageKey);
          if (data && data !== '[]' && data !== '{}') {
            hasDataToMigrate = true;
            break;
          }
        }
        
        if (!hasDataToMigrate) {
          console.log('No hay datos en localStorage que necesiten ser migrados.');
          // Marcar como completado aunque no haya datos
          this._saveMigrationStatus(true);
          resolve(false);
          return;
        }
        
        // Verificar si IndexedDB está disponible
        if (!window.indexedDB) {
          console.warn('IndexedDB no está disponible, no se puede realizar la migración.');
          resolve(false);
          return;
        }
        
        // Es necesario realizar la migración
        resolve(true);
      } catch (error) {
        console.error('Error al verificar la necesidad de migración:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Inicia el proceso de migración de datos
   * @param {Function} progressCallback - Función de callback para reportar progreso (opcional)
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la migración
   */
  migrateData: function(progressCallback) {
    return new Promise((resolve, reject) => {
      // Verificar si la migración ya está en progreso
      if (this.config.isMigrationInProgress) {
        reject(new Error('Ya hay una migración en progreso.'));
        return;
      }
      
      // Verificar si la migración ya se ha completado
      if (this.config.migrationCompleted) {
        resolve({
          success: true,
          message: 'La migración ya se ha completado anteriormente.',
          migrated: 0,
          errors: 0
        });
        return;
      }
      
      // Iniciar la migración
      this.config.isMigrationInProgress = true;
      this._saveMigrationStatus(false, 'iniciando');
      
      // Verificar si es necesario realizar la migración
      this.checkMigrationNeeded()
        .then(needsMigration => {
          if (!needsMigration) {
            this.config.isMigrationInProgress = false;
            resolve({
              success: true,
              message: 'No es necesario realizar la migración.',
              migrated: 0,
              errors: 0
            });
            return;
          }
          
          // Realizar la migración
          this._performMigration(progressCallback)
            .then(result => {
              this.config.isMigrationInProgress = false;
              this.config.migrationCompleted = result.success;
              this._saveMigrationStatus(result.success);
              resolve(result);
            })
            .catch(error => {
              this.config.isMigrationInProgress = false;
              this._saveMigrationStatus(false, error.message);
              reject(error);
            });
        })
        .catch(error => {
          this.config.isMigrationInProgress = false;
          reject(error);
        });
    });
  },
  
  /**
   * Realiza el proceso de migración de datos
   * @param {Function} progressCallback - Función de callback para reportar progreso
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la migración
   * @private
   */
  _performMigration: function(progressCallback) {
    return new Promise((resolve, reject) => {
      // Verificar que IndexedDB esté inicializado
      if (!IndexedDBManager.isDatabaseReady()) {
        IndexedDBManager.initDatabase()
          .then(() => this._migrateAllStores(progressCallback))
          .then(result => resolve(result))
          .catch(error => reject(error));
      } else {
        this._migrateAllStores(progressCallback)
          .then(result => resolve(result))
          .catch(error => reject(error));
      }
    });
  },
  
  /**
   * Migra todos los almacenes de datos
   * @param {Function} progressCallback - Función de callback para reportar progreso
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la migración
   * @private
   */
  _migrateAllStores: function(progressCallback) {
    return new Promise((resolve, reject) => {
      const storeMappings = this.config.storeMappings;
      const totalStores = Object.keys(storeMappings).length;
      let processedStores = 0;
      let migratedItems = 0;
      let errors = 0;
      
      // Función para reportar progreso
      const reportProgress = (store, current, total) => {
        if (typeof progressCallback === 'function') {
          const storeProgress = total > 0 ? (current / total) : 1;
          const overallProgress = (processedStores + storeProgress) / totalStores;
          progressCallback({
            store: store,
            storeProgress: Math.round(storeProgress * 100),
            overallProgress: Math.round(overallProgress * 100),
            migratedItems: migratedItems,
            errors: errors
          });
        }
      };
      
      // Migrar cada almacén secuencialmente
      const migrateNextStore = (storeKeys, index) => {
        if (index >= storeKeys.length) {
          // Todos los almacenes han sido procesados
          resolve({
            success: errors === 0,
            message: errors === 0 ? 'Migración completada correctamente.' : `Migración completada con ${errors} errores.`,
            migrated: migratedItems,
            errors: errors
          });
          return;
        }
        
        const localStorageKey = storeKeys[index];
        const indexedDBStore = storeMappings[localStorageKey];
        
        // Actualizar estado de migración
        this._saveMigrationStatus(false, `migrando ${indexedDBStore}`);
        
        // Migrar el almacén actual
        this._migrateStore(localStorageKey, indexedDBStore, reportProgress)
          .then(result => {
            migratedItems += result.migrated;
            errors += result.errors;
            processedStores++;
            
            // Migrar el siguiente almacén
            migrateNextStore(storeKeys, index + 1);
          })
          .catch(error => {
            console.error(`Error al migrar ${indexedDBStore}:`, error);
            errors++;
            processedStores++;
            
            // Continuar con el siguiente almacén a pesar del error
            migrateNextStore(storeKeys, index + 1);
          });
      };
      
      // Iniciar la migración con el primer almacén
      migrateNextStore(Object.keys(storeMappings), 0);
    });
  },
  
  /**
   * Migra un almacén específico desde localStorage a IndexedDB
   * @param {string} localStorageKey - Clave en localStorage
   * @param {string} indexedDBStore - Nombre del almacén en IndexedDB
   * @param {Function} progressCallback - Función de callback para reportar progreso
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la migración
   * @private
   */
  _migrateStore: function(localStorageKey, indexedDBStore, progressCallback) {
    return new Promise((resolve, reject) => {
      try {
        // Obtener datos de localStorage
        const data = localStorage.getItem(localStorageKey);
        if (!data || data === '[]' || data === '{}') {
          // No hay datos para migrar
          resolve({
            migrated: 0,
            errors: 0
          });
          return;
        }
        
        // Parsear datos
        let items;
        try {
          items = JSON.parse(data);
          
          // Verificar si los datos están comprimidos
          if (typeof items === 'string' && items.startsWith('{"meta":{"prefix":"__COMPRESSED__"')) {
            items = DataCompression.decompress(items);
          }
          
          // Asegurarse de que sea un array
          if (!Array.isArray(items)) {
            if (typeof items === 'object' && items !== null) {
              // Convertir objeto a array de pares clave-valor para el almacén de configuración
              if (indexedDBStore === 'config') {
                const configArray = [];
                for (const key in items) {
                  if (Object.prototype.hasOwnProperty.call(items, key)) {
                    configArray.push({
                      key: key,
                      value: items[key]
                    });
                  }
                }
                items = configArray;
              } else {
                // Para otros almacenes, convertir a array si es posible
                items = Object.values(items);
              }
            } else {
              // No se puede convertir a array
              throw new Error(`Los datos en ${localStorageKey} no son un array ni un objeto.`);
            }
          }
        } catch (e) {
          console.error(`Error al parsear datos de ${localStorageKey}:`, e);
          reject(e);
          return;
        }
        
        // Si no hay elementos, no hay nada que migrar
        if (items.length === 0) {
          resolve({
            migrated: 0,
            errors: 0
          });
          return;
        }
        
        // Migrar elementos a IndexedDB
        let migrated = 0;
        let errors = 0;
        let processed = 0;
        
        // Función para procesar un lote de elementos
        const processBatch = (startIndex, batchSize) => {
          const endIndex = Math.min(startIndex + batchSize, items.length);
          const batch = items.slice(startIndex, endIndex);
          
          // Reportar progreso
          progressCallback(indexedDBStore, processed, items.length);
          
          // Usar la operación en lote para agregar los elementos
          IndexedDBCrud.bulkOperation(indexedDBStore, 'add', batch)
            .then(success => {
              migrated += batch.length;
              processed += batch.length;
              
              // Reportar progreso
              progressCallback(indexedDBStore, processed, items.length);
              
              if (endIndex < items.length) {
                // Procesar el siguiente lote
                processBatch(endIndex, batchSize);
              } else {
                // Todos los elementos han sido procesados
                resolve({
                  migrated: migrated,
                  errors: errors
                });
              }
            })
            .catch(error => {
              console.error(`Error al migrar lote de ${indexedDBStore}:`, error);
              
              // Intentar migrar los elementos uno por uno
              console.log(`Intentando migrar elementos de ${indexedDBStore} uno por uno...`);
              
              const promises = batch.map(item => {
                return IndexedDBCrud.add(indexedDBStore, item)
                  .then(() => {
                    migrated++;
                    return true;
                  })
                  .catch(itemError => {
                    console.error(`Error al migrar elemento de ${indexedDBStore}:`, itemError);
                    errors++;
                    return false;
                  });
              });
              
              Promise.all(promises)
                .then(() => {
                  processed += batch.length;
                  
                  // Reportar progreso
                  progressCallback(indexedDBStore, processed, items.length);
                  
                  if (endIndex < items.length) {
                    // Procesar el siguiente lote
                    processBatch(endIndex, batchSize);
                  } else {
                    // Todos los elementos han sido procesados
                    resolve({
                      migrated: migrated,
                      errors: errors
                    });
                  }
                })
                .catch(batchError => {
                  console.error(`Error al procesar lote individual de ${indexedDBStore}:`, batchError);
                  errors += batch.length;
                  processed += batch.length;
                  
                  if (endIndex < items.length) {
                    // Procesar el siguiente lote a pesar del error
                    processBatch(endIndex, batchSize);
                  } else {
                    // Todos los elementos han sido procesados
                    resolve({
                      migrated: migrated,
                      errors: errors
                    });
                  }
                });
            });
        };
        
        // Iniciar el procesamiento con el primer lote
        processBatch(0, 50); // Procesar en lotes de 50 elementos
      } catch (error) {
        console.error(`Error general al migrar ${indexedDBStore}:`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Guarda el estado de la migración en localStorage
   * @param {boolean} completed - Indica si la migración se ha completado
   * @param {string} status - Estado actual de la migración
   * @private
   */
  _saveMigrationStatus: function(completed, status = '') {
    try {
      const migrationStatus = {
        completed: completed,
        version: this.config.migrationVersion,
        timestamp: new Date().toISOString(),
        status: status
      };
      
      localStorage.setItem(this.config.migrationStatusKey, JSON.stringify(migrationStatus));
    } catch (error) {
      console.error('Error al guardar el estado de la migración:', error);
    }
  },
  
  /**
   * Obtiene el estado actual de la migración
   * @returns {Object} Estado de la migración
   */
  getMigrationStatus: function() {
    try {
      const migrationStatus = localStorage.getItem(this.config.migrationStatusKey);
      if (migrationStatus) {
        return JSON.parse(migrationStatus);
      }
    } catch (error) {
      console.error('Error al obtener el estado de la migración:', error);
    }
    
    return {
      completed: false,
      version: this.config.migrationVersion,
      timestamp: null,
      status: 'no iniciada'
    };
  },
  
  /**
   * Verifica si la migración se ha completado
   * @returns {boolean} True si la migración se ha completado
   */
  isMigrationCompleted: function() {
    if (this.config.migrationCompleted) {
      return true;
    }
    
    try {
      const status = this.getMigrationStatus();
      this.config.migrationCompleted = status.completed;
      return status.completed;
    } catch (error) {
      console.error('Error al verificar si la migración está completada:', error);
      return false;
    }
  },
  
  /**
   * Realiza una copia de seguridad de los datos de localStorage antes de la migración
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la copia de seguridad
   */
  backupLocalStorageData: function() {
    return new Promise((resolve, reject) => {
      try {
        const backup = {};
        let totalItems = 0;
        
        // Recorrer todas las claves de localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('comedor_')) {
            const value = localStorage.getItem(key);
            backup[key] = value;
            
            try {
              const parsedValue = JSON.parse(value);
              if (Array.isArray(parsedValue)) {
                totalItems += parsedValue.length;
              }
            } catch (e) {
              // No es JSON, contar como 1 elemento
              totalItems++;
            }
          }
        }
        
        // Comprimir y guardar la copia de seguridad
        const compressedBackup = DataCompression.compress(backup);
        const backupKey = 'comedor_MIGRATION_BACKUP';
        localStorage.setItem(backupKey, compressedBackup);
        
        const backupInfo = {
          timestamp: new Date().toISOString(),
          keys: Object.keys(backup).length,
          items: totalItems,
          size: compressedBackup.length
        };
        
        localStorage.setItem('comedor_MIGRATION_BACKUP_INFO', JSON.stringify(backupInfo));
        
        resolve({
          success: true,
          message: 'Copia de seguridad creada correctamente.',
          info: backupInfo
        });
      } catch (error) {
        console.error('Error al crear copia de seguridad:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Restaura los datos de localStorage desde una copia de seguridad
   * @returns {Promise<Object>} Promesa que se resuelve con el resultado de la restauración
   */
  restoreFromBackup: function() {
    return new Promise((resolve, reject) => {
      try {
        const backupKey = 'comedor_MIGRATION_BACKUP';
        const compressedBackup = localStorage.getItem(backupKey);
        
        if (!compressedBackup) {
          reject(new Error('No se encontró una copia de seguridad para restaurar.'));
          return;
        }
        
        // Descomprimir la copia de seguridad
        const backup = DataCompression.decompress(compressedBackup);
        
        if (!backup || typeof backup !== 'object') {
          reject(new Error('La copia de seguridad está dañada o tiene un formato incorrecto.'));
          return;
        }
        
        // Restaurar cada clave
        for (const key in backup) {
          if (Object.prototype.hasOwnProperty.call(backup, key)) {
            localStorage.setItem(key, backup[key]);
          }
        }
        
        // Restablecer el estado de la migración
        this._saveMigrationStatus(false, 'restaurada desde copia de seguridad');
        this.config.migrationCompleted = false;
        
        resolve({
          success: true,
          message: 'Datos restaurados correctamente desde la copia de seguridad.',
          keys: Object.keys(backup).length
        });
      } catch (error) {
        console.error('Error al restaurar desde copia de seguridad:', error);
        reject(error);
      }
    });
  }
};

// Exportar el objeto DataMigration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataMigration;
}
