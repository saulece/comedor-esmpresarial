/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de compresión de datos
 * 
 * Este archivo contiene utilidades para comprimir y descomprimir datos,
 * optimizando el almacenamiento tanto en IndexedDB como en localStorage.
 * Utiliza la biblioteca LZString para la compresión principal.
 */

const DataCompression = {
  /**
   * Configuración del sistema de compresión
   */
  config: {
    // Umbral de tamaño (en bytes) a partir del cual se comprime automáticamente
    compressionThreshold: 1024, // 1KB
    
    // Nivel de compresión (1: más rápido, menos compresión, 9: más lento, más compresión)
    compressionLevel: 5,
    
    // Flag para habilitar/deshabilitar la compresión automática
    autoCompression: true,
    
    // Metadatos para identificar datos comprimidos
    compressionMeta: {
      prefix: '__COMPRESSED__',
      version: '1.0',
      algorithm: 'lz-string'
    }
  },
  
  /**
   * Comprime datos utilizando LZString
   * @param {Object|Array|string} data - Datos a comprimir
   * @returns {string} Datos comprimidos en formato string
   */
  compress: function(data) {
    try {
      // Si los datos son null o undefined, devolver una cadena vacía
      if (data === null || data === undefined) {
        return '';
      }
      
      // Convertir a string si no lo es
      let dataString;
      if (typeof data === 'string') {
        dataString = data;
      } else {
        dataString = JSON.stringify(data);
      }
      
      // Si la cadena está vacía, devolver una cadena vacía
      if (!dataString || dataString.length === 0) {
        return '';
      }
      
      // Comprimir utilizando LZString
      const compressed = LZString.compressToUTF16(dataString);
      
      // Agregar metadatos para identificar que está comprimido
      const meta = {
        prefix: this.config.compressionMeta.prefix,
        version: this.config.compressionMeta.version,
        algorithm: this.config.compressionMeta.algorithm,
        originalSize: dataString.length,
        compressedSize: compressed.length,
        timestamp: new Date().toISOString()
      };
      
      // Combinar metadatos y datos comprimidos
      const result = JSON.stringify({
        meta: meta,
        data: compressed
      });
      
      console.log(`Compresión: ${dataString.length} bytes -> ${compressed.length} bytes (${Math.round((compressed.length / dataString.length) * 100)}%)`);
      
      return result;
    } catch (error) {
      console.error('Error al comprimir datos:', error);
      // En caso de error, devolver los datos originales en formato string
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  },
  
  /**
   * Descomprime datos previamente comprimidos
   * @param {string} compressedData - Datos comprimidos
   * @param {boolean} parseJSON - Si es true, parsea el resultado como JSON
   * @returns {Object|Array|string} Datos descomprimidos
   */
  decompress: function(compressedData, parseJSON = true) {
    try {
      // Si los datos son null, undefined o cadena vacía, devolver null
      if (!compressedData) {
        return null;
      }
      
      // Intentar parsear los datos como JSON para verificar si tienen metadatos de compresión
      let parsedData;
      try {
        parsedData = JSON.parse(compressedData);
      } catch (e) {
        // Si no se puede parsear, asumir que no está comprimido
        return compressedData;
      }
      
      // Verificar si los datos tienen el formato de datos comprimidos
      if (!parsedData.meta || !parsedData.data || parsedData.meta.prefix !== this.config.compressionMeta.prefix) {
        // No está en formato comprimido, devolver los datos originales
        return compressedData;
      }
      
      // Descomprimir utilizando LZString
      const decompressed = LZString.decompressFromUTF16(parsedData.data);
      
      // Si se solicita parsear como JSON y el resultado parece ser JSON válido
      if (parseJSON && decompressed && (decompressed.startsWith('{') || decompressed.startsWith('['))) {
        try {
          return JSON.parse(decompressed);
        } catch (e) {
          console.warn('Los datos descomprimidos no son JSON válido:', e);
          return decompressed;
        }
      }
      
      return decompressed;
    } catch (error) {
      console.error('Error al descomprimir datos:', error);
      // En caso de error, devolver los datos originales
      return compressedData;
    }
  },
  
  /**
   * Comprime datos solo si superan el umbral de tamaño configurado
   * @param {Object|Array|string} data - Datos a comprimir
   * @returns {string} Datos comprimidos o sin comprimir, según corresponda
   */
  compressIfNeeded: function(data) {
    // Si la compresión automática está deshabilitada, devolver los datos en formato string
    if (!this.config.autoCompression) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    try {
      // Convertir a string si no lo es
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Verificar si supera el umbral de compresión
      if (dataString.length > this.config.compressionThreshold) {
        return this.compress(dataString);
      } else {
        return dataString;
      }
    } catch (error) {
      console.error('Error al evaluar compresión:', error);
      // En caso de error, devolver los datos originales en formato string
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  },
  
  /**
   * Intenta descomprimir datos si están comprimidos, de lo contrario devuelve los datos originales
   * @param {string} data - Datos potencialmente comprimidos
   * @param {boolean} parseJSON - Si es true, parsea el resultado como JSON
   * @returns {Object|Array|string} Datos descomprimidos o los originales si no estaban comprimidos
   */
  decompressIfNeeded: function(data, parseJSON = true) {
    if (!data) {
      return null;
    }
    
    try {
      // Verificar si los datos parecen estar comprimidos
      if (typeof data === 'string') {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.meta && parsedData.data && parsedData.meta.prefix === this.config.compressionMeta.prefix) {
            // Está comprimido, descomprimir
            return this.decompress(data, parseJSON);
          }
        } catch (e) {
          // No es JSON válido, asumir que no está comprimido
        }
      }
      
      // Si llegamos aquí, los datos no están comprimidos
      // Si se solicita parsear como JSON y es una cadena que parece JSON
      if (parseJSON && typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
        try {
          return JSON.parse(data);
        } catch (e) {
          // No es JSON válido
          return data;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error al intentar descomprimir:', error);
      return data;
    }
  },
  
  /**
   * Comprime un objeto grande dividiéndolo en fragmentos más pequeños
   * Útil para objetos que podrían superar los límites de almacenamiento
   * @param {Object|Array} data - Datos a comprimir en fragmentos
   * @param {number} chunkSize - Tamaño máximo de cada fragmento en bytes
   * @returns {Array} Array de fragmentos comprimidos
   */
  compressInChunks: function(data, chunkSize = 1024 * 1024) { // 1MB por defecto
    try {
      // Convertir a string si no lo es
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Si los datos son más pequeños que el tamaño de fragmento, comprimir normalmente
      if (dataString.length <= chunkSize) {
        return [this.compress(dataString)];
      }
      
      // Dividir en fragmentos
      const chunks = [];
      for (let i = 0; i < dataString.length; i += chunkSize) {
        const chunk = dataString.substring(i, i + chunkSize);
        chunks.push(this.compress(chunk));
      }
      
      console.log(`Compresión en fragmentos: ${dataString.length} bytes -> ${chunks.length} fragmentos`);
      
      return chunks;
    } catch (error) {
      console.error('Error al comprimir en fragmentos:', error);
      return [this.compress(data)];
    }
  },
  
  /**
   * Descomprime y combina fragmentos previamente comprimidos
   * @param {Array} chunks - Array de fragmentos comprimidos
   * @param {boolean} parseJSON - Si es true, parsea el resultado combinado como JSON
   * @returns {Object|Array|string} Datos descomprimidos y combinados
   */
  decompressChunks: function(chunks, parseJSON = true) {
    try {
      if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        return null;
      }
      
      // Si solo hay un fragmento, descomprimir normalmente
      if (chunks.length === 1) {
        return this.decompress(chunks[0], parseJSON);
      }
      
      // Descomprimir cada fragmento y combinarlos
      let combined = '';
      for (const chunk of chunks) {
        const decompressed = this.decompress(chunk, false);
        if (decompressed) {
          combined += decompressed;
        }
      }
      
      // Si se solicita parsear como JSON y el resultado parece ser JSON válido
      if (parseJSON && combined && (combined.startsWith('{') || combined.startsWith('['))) {
        try {
          return JSON.parse(combined);
        } catch (e) {
          console.warn('Los datos combinados no son JSON válido:', e);
          return combined;
        }
      }
      
      return combined;
    } catch (error) {
      console.error('Error al descomprimir fragmentos:', error);
      return null;
    }
  },
  
  /**
   * Calcula la tasa de compresión para un conjunto de datos
   * @param {Object|Array|string} data - Datos a evaluar
   * @returns {Object} Información sobre la compresión
   */
  analyzeCompression: function(data) {
    try {
      // Convertir a string si no lo es
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Comprimir los datos
      const compressed = LZString.compressToUTF16(dataString);
      
      // Calcular estadísticas
      const originalSize = dataString.length;
      const compressedSize = compressed.length;
      const compressionRatio = compressedSize / originalSize;
      const spaceSaved = originalSize - compressedSize;
      const percentSaved = (1 - compressionRatio) * 100;
      
      return {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        spaceSaved: spaceSaved,
        percentSaved: percentSaved,
        formattedOriginalSize: this._formatBytes(originalSize),
        formattedCompressedSize: this._formatBytes(compressedSize),
        formattedSpaceSaved: this._formatBytes(spaceSaved),
        isEfficient: percentSaved > 20 // Consideramos eficiente si ahorra más del 20%
      };
    } catch (error) {
      console.error('Error al analizar compresión:', error);
      return {
        error: error.message,
        isEfficient: false
      };
    }
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
  },
  
  /**
   * Comprime un objeto JSON eliminando propiedades nulas, indefinidas o vacías
   * Esta es una forma de "compresión semántica" que reduce el tamaño sin perder información importante
   * @param {Object} obj - Objeto a comprimir semánticamente
   * @returns {Object} Objeto comprimido semánticamente
   */
  compressObject: function(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Si es un array, procesar cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => this.compressObject(item)).filter(item => {
        // Filtrar elementos nulos o indefinidos
        return item !== null && item !== undefined;
      });
    }
    
    // Procesar objeto
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Omitir propiedades nulas, indefinidas o cadenas vacías
        if (value === null || value === undefined || value === '') {
          continue;
        }
        
        // Procesar recursivamente objetos anidados
        if (typeof value === 'object') {
          const compressedValue = this.compressObject(value);
          
          // Solo incluir si el resultado no está vacío
          if (compressedValue !== null && 
              (typeof compressedValue !== 'object' || 
               Object.keys(compressedValue).length > 0 || 
               (Array.isArray(compressedValue) && compressedValue.length > 0))) {
            result[key] = compressedValue;
          }
        } else {
          // Incluir valores primitivos no vacíos
          result[key] = value;
        }
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }
};

// Exportar el objeto DataCompression
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataCompression;
}
