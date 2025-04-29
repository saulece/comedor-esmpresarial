/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de fallback para almacenamiento local
 * 
 * Este archivo contiene funciones para proporcionar un mecanismo de fallback
 * utilizando localStorage cuando IndexedDB no está disponible o falla.
 */

const StorageFallback = {
  /**
   * Configuración del sistema de fallback
   */
  config: {
    // Prefijo para las claves en localStorage
    keyPrefix: 'comedor_',
    
    // Mapeo de almacenes de IndexedDB a claves de localStorage
    storeKeyMap: {
      menus: 'MENUS',
      confirmations: 'CONFIRMATIONS',
      users: 'USERS',
      archivedMenus: 'ARCHIVED_MENUS',
      archivedConfirmations: 'ARCHIVED_CONFIRMATIONS',
      config: 'CONFIG'
    },
    
    // Flag para indicar si estamos usando fallback
    isFallbackActive: false,
    
    // Razón por la que se activó el fallback
    fallbackReason: null
  },
  
  /**
   * Verifica si localStorage está disponible
   * @returns {boolean} True si localStorage está disponible
   */
  isLocalStorageAvailable: function() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('localStorage no está disponible:', e);
      return false;
    }
  },
  
  /**
   * Activa el modo fallback
   * @param {string} reason - Razón por la que se activa el fallback
   */
  activateFallback: function(reason) {
    this.config.isFallbackActive = true;
    this.config.fallbackReason = reason;
    console.warn(`Modo fallback activado: ${reason}`);
    
    // Guardar estado de fallback en localStorage
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(`${this.config.keyPrefix}FALLBACK_ACTIVE`, 'true');
      localStorage.setItem(`${this.config.keyPrefix}FALLBACK_REASON`, reason);
    }
  },
  
  /**
   * Verifica si el modo fallback está activo
   * @returns {boolean} True si el fallback está activo
   */
  isFallbackMode: function() {
    // Si ya sabemos que está activo, devolver true
    if (this.config.isFallbackActive) {
      return true;
    }
    
    // Verificar en localStorage si se activó anteriormente
    if (this.isLocalStorageAvailable()) {
      const fallbackActive = localStorage.getItem(`${this.config.keyPrefix}FALLBACK_ACTIVE`);
      if (fallbackActive === 'true') {
        const reason = localStorage.getItem(`${this.config.keyPrefix}FALLBACK_REASON`) || 'Desconocido';
        this.activateFallback(reason);
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Desactiva el modo fallback
   */
  deactivateFallback: function() {
    this.config.isFallbackActive = false;
    this.config.fallbackReason = null;
    console.log('Modo fallback desactivado');
    
    // Eliminar estado de fallback de localStorage
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(`${this.config.keyPrefix}FALLBACK_ACTIVE`);
      localStorage.removeItem(`${this.config.keyPrefix}FALLBACK_REASON`);
    }
  },
  
  /**
   * Obtiene la clave de localStorage correspondiente a un almacén de IndexedDB
   * @param {string} storeName - Nombre del almacén de IndexedDB
   * @returns {string} Clave de localStorage
   * @private
   */
  _getLocalStorageKey: function(storeName) {
    const mappedKey = this.config.storeKeyMap[storeName];
    return `${this.config.keyPrefix}${mappedKey || storeName.toUpperCase()}`;
  },
  
  /**
   * Agrega un objeto a localStorage
   * @param {string} storeName - Nombre del almacén (se convertirá a clave de localStorage)
   * @param {Object} data - Datos a agregar
   * @returns {Promise<string>} Promesa que se resuelve con el ID del objeto agregado
   */
  add: function(storeName, data) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        // Asegurarse de que el objeto tenga un ID único si no lo tiene
        if (!data.id) {
          data.id = this._generateUniqueId();
        }
        
        // Agregar marca de tiempo si no existe
        if (!data.creationDate) {
          data.creationDate = new Date().toISOString();
        }
        
        const key = this._getLocalStorageKey(storeName);
        let items = [];
        
        // Obtener elementos existentes
        const existingData = localStorage.getItem(key);
        if (existingData) {
          try {
            items = JSON.parse(existingData);
            if (!Array.isArray(items)) {
              items = [];
            }
          } catch (e) {
            console.error(`Error al parsear datos de ${key}:`, e);
            items = [];
          }
        }
        
        // Verificar si ya existe un elemento con el mismo ID
        const existingIndex = items.findIndex(item => item.id === data.id);
        if (existingIndex >= 0) {
          reject(new Error(`Ya existe un elemento con ID ${data.id} en ${storeName}`));
          return;
        }
        
        // Agregar nuevo elemento
        items.push(data);
        
        // Guardar en localStorage
        localStorage.setItem(key, JSON.stringify(items));
        
        console.log(`Datos agregados correctamente en ${storeName} (localStorage)`);
        resolve(data.id);
      } catch (error) {
        console.error(`Error al agregar datos en ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Obtiene un objeto por su ID desde localStorage
   * @param {string} storeName - Nombre del almacén
   * @param {string|number} id - ID del objeto a obtener
   * @returns {Promise<Object>} Promesa que se resuelve con el objeto encontrado o null si no existe
   */
  getById: function(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        const data = localStorage.getItem(key);
        
        if (!data) {
          resolve(null);
          return;
        }
        
        try {
          const items = JSON.parse(data);
          if (!Array.isArray(items)) {
            resolve(null);
            return;
          }
          
          const item = items.find(item => item.id === id);
          resolve(item || null);
        } catch (e) {
          console.error(`Error al parsear datos de ${key}:`, e);
          resolve(null);
        }
      } catch (error) {
        console.error(`Error al obtener objeto con ID ${id} de ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Obtiene todos los objetos de un almacén desde localStorage
   * @param {string} storeName - Nombre del almacén
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos
   */
  getAll: function(storeName) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        const data = localStorage.getItem(key);
        
        if (!data) {
          resolve([]);
          return;
        }
        
        try {
          const items = JSON.parse(data);
          resolve(Array.isArray(items) ? items : []);
        } catch (e) {
          console.error(`Error al parsear datos de ${key}:`, e);
          resolve([]);
        }
      } catch (error) {
        console.error(`Error al obtener todos los objetos de ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Actualiza un objeto existente en localStorage
   * @param {string} storeName - Nombre del almacén
   * @param {Object} data - Datos a actualizar (debe incluir el ID)
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se actualizó correctamente
   */
  update: function(storeName, data) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        if (!data || !data.id) {
          reject(new Error('Se requiere un objeto con ID para actualizar'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        let items = [];
        
        // Obtener elementos existentes
        const existingData = localStorage.getItem(key);
        if (existingData) {
          try {
            items = JSON.parse(existingData);
            if (!Array.isArray(items)) {
              items = [];
            }
          } catch (e) {
            console.error(`Error al parsear datos de ${key}:`, e);
            items = [];
          }
        }
        
        // Agregar marca de tiempo de actualización
        data.lastModified = new Date().toISOString();
        
        // Buscar y actualizar el elemento
        const index = items.findIndex(item => item.id === data.id);
        if (index >= 0) {
          items[index] = data;
          localStorage.setItem(key, JSON.stringify(items));
          console.log(`Objeto actualizado correctamente en ${storeName} (localStorage)`);
          resolve(true);
        } else {
          console.warn(`No se encontró un objeto con ID ${data.id} en ${storeName} para actualizar`);
          resolve(false);
        }
      } catch (error) {
        console.error(`Error al actualizar objeto en ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Elimina un objeto por su ID desde localStorage
   * @param {string} storeName - Nombre del almacén
   * @param {string|number} id - ID del objeto a eliminar
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminó correctamente
   */
  delete: function(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        let items = [];
        
        // Obtener elementos existentes
        const existingData = localStorage.getItem(key);
        if (existingData) {
          try {
            items = JSON.parse(existingData);
            if (!Array.isArray(items)) {
              items = [];
            }
          } catch (e) {
            console.error(`Error al parsear datos de ${key}:`, e);
            items = [];
          }
        }
        
        // Filtrar el elemento a eliminar
        const initialLength = items.length;
        items = items.filter(item => item.id !== id);
        
        if (items.length < initialLength) {
          localStorage.setItem(key, JSON.stringify(items));
          console.log(`Objeto con ID ${id} eliminado correctamente de ${storeName} (localStorage)`);
          resolve(true);
        } else {
          console.warn(`No se encontró un objeto con ID ${id} en ${storeName} para eliminar`);
          resolve(false);
        }
      } catch (error) {
        console.error(`Error al eliminar objeto con ID ${id} de ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Elimina todos los objetos de un almacén en localStorage
   * @param {string} storeName - Nombre del almacén
   * @returns {Promise<boolean>} Promesa que se resuelve con true si se eliminaron correctamente
   */
  deleteAll: function(storeName) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        localStorage.setItem(key, JSON.stringify([]));
        console.log(`Todos los objetos eliminados correctamente de ${storeName} (localStorage)`);
        resolve(true);
      } catch (error) {
        console.error(`Error al eliminar todos los objetos de ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Busca objetos por un campo y valor específicos en localStorage
   * @param {string} storeName - Nombre del almacén
   * @param {string} field - Campo por el que filtrar
   * @param {any} value - Valor a buscar
   * @returns {Promise<Array>} Promesa que se resuelve con un array de objetos que coinciden
   */
  findByField: function(storeName, field, value) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        this.getAll(storeName)
          .then(items => {
            const results = items.filter(item => item[field] === value);
            resolve(results);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        console.error(`Error al buscar por campo ${field} en ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Cuenta el número de objetos en un almacén de localStorage
   * @param {string} storeName - Nombre del almacén
   * @returns {Promise<number>} Promesa que se resuelve con el número de objetos
   */
  count: function(storeName) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        this.getAll(storeName)
          .then(items => {
            resolve(items.length);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        console.error(`Error al contar objetos en ${storeName} (localStorage):`, error);
        reject(error);
      }
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
   * Realiza una operación en lote (múltiples operaciones en una sola operación)
   * @param {string} storeName - Nombre del almacén
   * @param {string} operation - Tipo de operación ('add', 'update', 'delete')
   * @param {Array} items - Array de objetos o IDs (dependiendo de la operación)
   * @returns {Promise<boolean>} Promesa que se resuelve con true si todas las operaciones fueron exitosas
   */
  bulkOperation: function(storeName, operation, items) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
          reject(new Error('Se requiere un array de elementos para la operación en lote'));
          return;
        }
        
        const key = this._getLocalStorageKey(storeName);
        let storeItems = [];
        
        // Obtener elementos existentes
        const existingData = localStorage.getItem(key);
        if (existingData) {
          try {
            storeItems = JSON.parse(existingData);
            if (!Array.isArray(storeItems)) {
              storeItems = [];
            }
          } catch (e) {
            console.error(`Error al parsear datos de ${key}:`, e);
            storeItems = [];
          }
        }
        
        let successCount = 0;
        
        switch (operation) {
          case 'add':
            // Agregar nuevos elementos
            items.forEach(item => {
              // Asegurarse de que el objeto tenga un ID único si no lo tiene
              if (!item.id) {
                item.id = this._generateUniqueId();
              }
              
              // Agregar marca de tiempo si no existe
              if (!item.creationDate) {
                item.creationDate = new Date().toISOString();
              }
              
              // Verificar si ya existe un elemento con el mismo ID
              const existingIndex = storeItems.findIndex(storeItem => storeItem.id === item.id);
              if (existingIndex < 0) {
                storeItems.push(item);
                successCount++;
              }
            });
            break;
            
          case 'update':
            // Actualizar elementos existentes
            items.forEach(item => {
              if (item && item.id) {
                // Agregar marca de tiempo de actualización
                item.lastModified = new Date().toISOString();
                
                // Buscar y actualizar el elemento
                const index = storeItems.findIndex(storeItem => storeItem.id === item.id);
                if (index >= 0) {
                  storeItems[index] = item;
                  successCount++;
                }
              }
            });
            break;
            
          case 'delete':
            // Eliminar elementos
            const idsToDelete = items.map(item => (typeof item === 'object' && item !== null) ? item.id : item);
            const initialLength = storeItems.length;
            storeItems = storeItems.filter(item => !idsToDelete.includes(item.id));
            successCount = initialLength - storeItems.length;
            break;
            
          default:
            reject(new Error(`Operación no soportada: ${operation}`));
            return;
        }
        
        // Guardar en localStorage
        localStorage.setItem(key, JSON.stringify(storeItems));
        
        console.log(`Operación en lote completada. ${successCount} de ${items.length} operaciones exitosas.`);
        resolve(successCount === items.length);
      } catch (error) {
        console.error(`Error en operación en lote para ${storeName} (localStorage):`, error);
        reject(error);
      }
    });
  },
  
  /**
   * Obtiene información sobre el espacio utilizado en localStorage
   * @returns {Promise<Object>} Promesa que se resuelve con información sobre el espacio utilizado
   */
  getStorageInfo: function() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isLocalStorageAvailable()) {
          reject(new Error('localStorage no está disponible'));
          return;
        }
        
        const info = {
          totalItems: 0,
          totalSize: 0,
          keyCount: 0,
          keys: [],
          itemsByStore: {}
        };
        
        // Recorrer todas las claves de localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          const size = (key.length + (value ? value.length : 0)) * 2; // Aproximación en bytes (2 bytes por carácter)
          
          info.keyCount++;
          info.totalSize += size;
          info.keys.push(key);
          
          // Verificar si es una clave de nuestro sistema
          if (key.startsWith(this.config.keyPrefix)) {
            try {
              const data = JSON.parse(value);
              if (Array.isArray(data)) {
                const storeName = key.replace(this.config.keyPrefix, '').toLowerCase();
                info.itemsByStore[storeName] = data.length;
                info.totalItems += data.length;
              }
            } catch (e) {
              // No es un array JSON, ignorar
            }
          }
        }
        
        // Calcular porcentaje de uso (estimado, ya que el límite puede variar)
        const estimatedLimit = 5 * 1024 * 1024; // 5MB es un límite común
        info.percentUsed = (info.totalSize / estimatedLimit) * 100;
        info.formattedSize = this._formatBytes(info.totalSize);
        info.formattedLimit = this._formatBytes(estimatedLimit);
        
        resolve(info);
      } catch (error) {
        console.error('Error al obtener información de localStorage:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Formatea un tamaño en bytes a una representación legible
   * @param {number} bytes - Tamaño en bytes
   * @param {number} decimals - Número de decimales a mostrar
   * @returns {string} Tamaño formateado
   * @private
   */
  _formatBytes: function(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
};

// Exportar el objeto StorageFallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageFallback;
}
