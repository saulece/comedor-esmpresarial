/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de operaciones CRUD para IndexedDB
 * 
 * Este archivo contiene funciones para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * en la base de datos IndexedDB, proporcionando una interfaz unificada para manipular los datos.
 * Incluye soporte para almacenamiento seguro de datos sensibles mediante encriptación.
 */

const IndexedDBCrud = {
  /**
   * Agrega un objeto a un almacén específico
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {Object} data - Datos a agregar
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<any>} Promesa que se resuelve con el ID del objeto agregado
   */
  add: function(storeName, data, secure = true) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          // Asegurarse de que el objeto tenga un ID único si no lo tiene
          if (!data.id) {
            data.id = this._generateUniqueId();
          }
          
          // Agregar marca de tiempo si no existe
          if (!data.creationDate) {
            data.creationDate = new Date().toISOString();
          }
          
          // Encriptar datos sensibles si está habilitado y el módulo está disponible
          let dataToStore = data;
          if (secure && typeof SecureStorage !== 'undefined') {
            dataToStore = SecureStorage.encryptSensitiveData(data, storeName);
          }
          
          const request = store.add(dataToStore);
          
          request.onsuccess = (event) => {
            resolve(request.result);
          };
          
          request.onerror = (event) => {
            console.error(`Error al agregar datos en ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.oncomplete = () => {
            console.log(`Datos agregados correctamente en ${storeName}`);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Obtiene un objeto por su ID
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {string|number} id - ID del objeto a obtener
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Object>} Promesa que se resuelve con el objeto encontrado o null si no existe
   */
  getById: function(storeName, id, decrypt = true) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);
          
          request.onsuccess = (event) => {
            let result = request.result || null;
            
            // Desencriptar datos sensibles si está habilitado y el módulo está disponible
            if (result && decrypt && typeof SecureStorage !== 'undefined' && 
                SecureStorage.hasEncryptedData(result, storeName)) {
              result = SecureStorage.decryptSensitiveData(result, storeName);
            }
            
            resolve(result);
          };
          
          request.onerror = (event) => {
            console.error(`Error al obtener objeto con ID ${id} de ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Obtiene todos los objetos de un almacén
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos
   */
  getAll: function(storeName, decrypt = true) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          
          request.onsuccess = (event) => {
            let results = request.result || [];
            
            // Desencriptar datos sensibles si está habilitado y el módulo está disponible
            if (decrypt && typeof SecureStorage !== 'undefined' && results.length > 0) {
              results = results.map(item => {
                if (SecureStorage.hasEncryptedData(item, storeName)) {
                  return SecureStorage.decryptSensitiveData(item, storeName);
                }
                return item;
              });
            }
            
            resolve(results);
          };
          
          request.onerror = (event) => {
            console.error(`Error al obtener todos los objetos de ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Actualiza un objeto existente
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {Object} data - Datos a actualizar (debe incluir el ID)
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se actualizó correctamente
   */
  update: function(storeName, data, secure = true) {
    return new Promise((resolve, reject) => {
      if (!data || !data.id) {
        reject(new Error('Se requiere un objeto con ID para actualizar'));
        return;
      }
      
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          // Agregar marca de tiempo de actualización
          data.lastModified = new Date().toISOString();
          
          // Encriptar datos sensibles si está habilitado y el módulo está disponible
          let dataToStore = data;
          if (secure && typeof SecureStorage !== 'undefined') {
            dataToStore = SecureStorage.encryptSensitiveData(data, storeName);
          }
          
          const request = store.put(dataToStore);
          
          request.onsuccess = (event) => {
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error(`Error al actualizar objeto en ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.oncomplete = () => {
            console.log(`Objeto actualizado correctamente en ${storeName}`);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Elimina un objeto por su ID
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {string|number} id - ID del objeto a eliminar
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminó correctamente
   */
  delete: function(storeName, id) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);
          
          request.onsuccess = (event) => {
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error(`Error al eliminar objeto con ID ${id} de ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.oncomplete = () => {
            console.log(`Objeto con ID ${id} eliminado correctamente de ${storeName}`);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Elimina todos los objetos de un almacén
   * @param {string} storeName - Nombre del almacén de objetos
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminaron correctamente
   */
  deleteAll: function(storeName) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = (event) => {
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error(`Error al eliminar todos los objetos de ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.oncomplete = () => {
            console.log(`Todos los objetos eliminados correctamente de ${storeName}`);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Busca objetos por un campo y valor específicos
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {string} indexName - Nombre del índice a utilizar para la búsqueda
   * @param {any} value - Valor a buscar
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos que coinciden
   */
  findByIndex: function(storeName, indexName, value, decrypt = true) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          
          // Verificar si el índice existe
          if (!store.indexNames.contains(indexName)) {
            reject(new Error(`El índice ${indexName} no existe en ${storeName}`));
            return;
          }
          
          const index = store.index(indexName);
          const request = index.getAll(value);
          
          request.onsuccess = (event) => {
            let results = request.result || [];
            
            // Desencriptar datos sensibles si está habilitado y el módulo está disponible
            if (decrypt && typeof SecureStorage !== 'undefined' && results.length > 0) {
              results = results.map(item => {
                if (SecureStorage.hasEncryptedData(item, storeName)) {
                  return SecureStorage.decryptSensitiveData(item, storeName);
                }
                return item;
              });
            }
            
            resolve(results);
          };
          
          request.onerror = (event) => {
            console.error(`Error al buscar por índice ${indexName} en ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Busca objetos en un rango de valores para un índice específico
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {string} indexName - Nombre del índice a utilizar para la búsqueda
   * @param {IDBKeyRange} range - Rango de valores a buscar
   * @param {boolean} decrypt - Indica si se deben desencriptar datos sensibles
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos que coinciden
   */
  findByRange: function(storeName, indexName, range, decrypt = true) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          
          // Verificar si el índice existe
          if (!store.indexNames.contains(indexName)) {
            reject(new Error(`El índice ${indexName} no existe en ${storeName}`));
            return;
          }
          
          const index = store.index(indexName);
          const request = index.getAll(range);
          
          request.onsuccess = (event) => {
            let results = request.result || [];
            
            // Desencriptar datos sensibles si está habilitado y el módulo está disponible
            if (decrypt && typeof SecureStorage !== 'undefined' && results.length > 0) {
              results = results.map(item => {
                if (SecureStorage.hasEncryptedData(item, storeName)) {
                  return SecureStorage.decryptSensitiveData(item, storeName);
                }
                return item;
              });
            }
            
            resolve(results);
          };
          
          request.onerror = (event) => {
            console.error(`Error al buscar por rango en ${indexName} de ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Cuenta el número de objetos en un almacén
   * @param {string} storeName - Nombre del almacén de objetos
   * @returns {Promise<number>} Promesa que se resuelve con el número de objetos
   */
  count: function(storeName) {
    return new Promise((resolve, reject) => {
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.count();
          
          request.onsuccess = (event) => {
            resolve(request.result);
          };
          
          request.onerror = (event) => {
            console.error(`Error al contar objetos en ${storeName}:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
  },
  
  /**
   * Genera un ID único para nuevos objetos
   * @returns {string} ID único generado
   * @private
   */
  _generateUniqueId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
  },
  
  /**
   * Realiza una operación en lote (múltiples operaciones en una sola transacción)
   * @param {string} storeName - Nombre del almacén de objetos
   * @param {string} operation - Tipo de operación ('add', 'put', 'delete')
   * @param {Array} items - Array de objetos o IDs (dependiendo de la operación)
   * @param {boolean} secure - Indica si se debe aplicar encriptación a datos sensibles
   * @returns {Promise<boolean>} Promesa que se resuelve con true si todas las operaciones fueron exitosas
   */
  bulkOperation: function(storeName, operation, items, secure = true) {
    return new Promise((resolve, reject) => {
      if (!items || !Array.isArray(items) || items.length === 0) {
        reject(new Error('Se requiere un array de elementos para la operación en lote'));
        return;
      }
      
      IndexedDBManager.getDatabase()
        .then(db => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          let successCount = 0;
          
          // Función para procesar cada elemento
          const processItem = (item, index) => {
            let request;
            let processedItem = item;
            
            switch (operation) {
              case 'add':
                // Asegurarse de que el objeto tenga un ID único si no lo tiene
                if (!processedItem.id) {
                  processedItem.id = this._generateUniqueId();
                }
                // Agregar marca de tiempo si no existe
                if (!processedItem.creationDate) {
                  processedItem.creationDate = new Date().toISOString();
                }
                // Encriptar datos sensibles si está habilitado
                if (secure && typeof SecureStorage !== 'undefined') {
                  processedItem = SecureStorage.encryptSensitiveData(processedItem, storeName);
                }
                request = store.add(processedItem);
                break;
              case 'put':
                // Agregar marca de tiempo de actualización
                processedItem.lastModified = new Date().toISOString();
                // Encriptar datos sensibles si está habilitado
                if (secure && typeof SecureStorage !== 'undefined') {
                  processedItem = SecureStorage.encryptSensitiveData(processedItem, storeName);
                }
                request = store.put(processedItem);
                break;
              case 'delete':
                // Si el item es un objeto con ID, usar ese ID, de lo contrario asumir que el item es el ID
                const id = (typeof processedItem === 'object' && processedItem !== null) ? processedItem.id : processedItem;
                request = store.delete(id);
                break;
              default:
                throw new Error(`Operación no soportada: ${operation}`);
            }
            
            request.onsuccess = () => {
              successCount++;
            };
            
            request.onerror = (event) => {
              console.error(`Error en operación ${operation} para el elemento ${index}:`, event.target.error);
              // No rechazamos la promesa aquí para permitir que otras operaciones continúen
            };
          };
          
          // Procesar todos los elementos
          items.forEach(processItem);
          
          transaction.oncomplete = () => {
            console.log(`Operación en lote completada. ${successCount} de ${items.length} operaciones exitosas.`);
            resolve(successCount === items.length);
          };
          
          transaction.onerror = (event) => {
            console.error(`Error en la transacción de operación en lote:`, event.target.error);
            reject(event.target.error);
          };
        })
        .catch(error => {
          console.error('Error al obtener la base de datos:', error);
          reject(error);
        });
    });
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

// Exportar el objeto IndexedDBCrud
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexedDBCrud;
}
