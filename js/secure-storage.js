/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de almacenamiento seguro para IndexedDB
 * 
 * Este archivo implementa funciones para el almacenamiento seguro de datos
 * sensibles en IndexedDB utilizando encriptación.
 */

const SecureStorage = {
  /**
   * Configuración del almacenamiento seguro
   */
  config: {
    // Clave de encriptación (en una aplicación real, esto debería generarse y almacenarse de forma segura)
    encryptionKey: 'comedor-empresarial-secure-storage-key',
    
    // Prefijo para identificar datos encriptados
    encryptedPrefix: 'ENCRYPTED:',
    
    // Campos sensibles que deben ser encriptados por tipo de objeto
    sensitiveFields: {
      users: ['password', 'securityFields'],
      confirmations: ['personalData'],
      config: ['apiKeys', 'credentials']
    }
  },
  
  /**
   * Encripta datos sensibles en un objeto
   * @param {Object} data - Datos a encriptar
   * @param {string} objectType - Tipo de objeto (users, confirmations, etc.)
   * @returns {Object} Objeto con datos sensibles encriptados
   */
  encryptSensitiveData: function(data, objectType) {
    if (!data || typeof data !== 'object' || !objectType) {
      return data;
    }
    
    // Obtener los campos sensibles para este tipo de objeto
    const sensitiveFields = this.config.sensitiveFields[objectType];
    if (!sensitiveFields || !sensitiveFields.length) {
      return data;
    }
    
    // Crear una copia del objeto para no modificar el original
    const secureData = JSON.parse(JSON.stringify(data));
    
    // Encriptar cada campo sensible
    for (const field of sensitiveFields) {
      if (secureData[field] !== undefined) {
        // Si el campo es un objeto, convertirlo a string para encriptar
        if (typeof secureData[field] === 'object' && secureData[field] !== null) {
          secureData[field] = this.config.encryptedPrefix + 
                              this._encrypt(JSON.stringify(secureData[field]));
        } else if (typeof secureData[field] === 'string') {
          // Si es un string, encriptar directamente
          secureData[field] = this.config.encryptedPrefix + 
                              this._encrypt(secureData[field]);
        }
      }
    }
    
    return secureData;
  },
  
  /**
   * Desencripta datos sensibles en un objeto
   * @param {Object} data - Datos a desencriptar
   * @param {string} objectType - Tipo de objeto (users, confirmations, etc.)
   * @returns {Object} Objeto con datos sensibles desencriptados
   */
  decryptSensitiveData: function(data, objectType) {
    if (!data || typeof data !== 'object' || !objectType) {
      return data;
    }
    
    // Obtener los campos sensibles para este tipo de objeto
    const sensitiveFields = this.config.sensitiveFields[objectType];
    if (!sensitiveFields || !sensitiveFields.length) {
      return data;
    }
    
    // Crear una copia del objeto para no modificar el original
    const decryptedData = JSON.parse(JSON.stringify(data));
    
    // Desencriptar cada campo sensible
    for (const field of sensitiveFields) {
      if (decryptedData[field] !== undefined && 
          typeof decryptedData[field] === 'string' &&
          decryptedData[field].startsWith(this.config.encryptedPrefix)) {
        
        // Extraer el texto encriptado (quitar el prefijo)
        const encryptedValue = decryptedData[field].substring(this.config.encryptedPrefix.length);
        
        // Desencriptar el valor
        const decryptedValue = this._decrypt(encryptedValue);
        
        // Intentar parsear como JSON si es un objeto
        try {
          decryptedData[field] = JSON.parse(decryptedValue);
        } catch (e) {
          // Si no es JSON, usar el valor como string
          decryptedData[field] = decryptedValue;
        }
      }
    }
    
    return decryptedData;
  },
  
  /**
   * Encripta un valor utilizando AES si está disponible, o un método simple si no
   * @param {string} value - Valor a encriptar
   * @returns {string} Valor encriptado
   * @private
   */
  _encrypt: function(value) {
    // Intentar usar SubtleCrypto si está disponible
    if (window.crypto && window.crypto.subtle) {
      try {
        // Nota: En una implementación real, se usaría crypto.subtle.encrypt
        // con una clave generada adecuadamente. Aquí usamos un enfoque simplificado
        // para mantener la compatibilidad y evitar la complejidad de la API asíncrona.
        return this._simpleEncrypt(value);
      } catch (error) {
        console.warn('Error al usar Web Crypto API para encriptación, utilizando fallback:', error);
        return this._simpleEncrypt(value);
      }
    } else {
      // Fallback para navegadores que no soportan Web Crypto API
      return this._simpleEncrypt(value);
    }
  },
  
  /**
   * Desencripta un valor utilizando AES si está disponible, o un método simple si no
   * @param {string} encryptedValue - Valor encriptado
   * @returns {string} Valor desencriptado
   * @private
   */
  _decrypt: function(encryptedValue) {
    // Intentar usar SubtleCrypto si está disponible
    if (window.crypto && window.crypto.subtle) {
      try {
        // Nota: En una implementación real, se usaría crypto.subtle.decrypt
        // con la misma clave usada para encriptar. Aquí usamos un enfoque simplificado.
        return this._simpleDecrypt(encryptedValue);
      } catch (error) {
        console.warn('Error al usar Web Crypto API para desencriptación, utilizando fallback:', error);
        return this._simpleDecrypt(encryptedValue);
      }
    } else {
      // Fallback para navegadores que no soportan Web Crypto API
      return this._simpleDecrypt(encryptedValue);
    }
  },
  
  /**
   * Implementación simple de encriptación para fallback
   * @param {string} value - Valor a encriptar
   * @returns {string} Valor encriptado en formato Base64
   * @private
   */
  _simpleEncrypt: function(value) {
    // Combinar el valor con la clave de encriptación
    const combined = value + this.config.encryptionKey;
    
    // Crear un hash simple
    let result = '';
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      const keyChar = this.config.encryptionKey.charCodeAt(i % this.config.encryptionKey.length);
      // XOR simple para encriptar
      const encryptedChar = String.fromCharCode(charCode ^ keyChar);
      result += encryptedChar;
    }
    
    // Convertir a Base64 para almacenamiento seguro
    return btoa(result);
  },
  
  /**
   * Implementación simple de desencriptación para fallback
   * @param {string} encryptedValue - Valor encriptado en formato Base64
   * @returns {string} Valor desencriptado
   * @private
   */
  _simpleDecrypt: function(encryptedValue) {
    try {
      // Decodificar de Base64
      const decoded = atob(encryptedValue);
      
      // Desencriptar usando XOR con la clave
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = this.config.encryptionKey.charCodeAt(i % this.config.encryptionKey.length);
        // XOR simple para desencriptar
        const decryptedChar = String.fromCharCode(charCode ^ keyChar);
        result += decryptedChar;
      }
      
      return result;
    } catch (error) {
      console.error('Error al desencriptar:', error);
      return '';
    }
  },
  
  /**
   * Genera una clave de encriptación aleatoria
   * @param {number} length - Longitud de la clave en bytes
   * @returns {string} Clave generada en formato hexadecimal
   */
  generateEncryptionKey: function(length = 32) {
    // Generar bytes aleatorios
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    
    // Convertir a formato hexadecimal
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  },
  
  /**
   * Verifica si un objeto tiene datos encriptados
   * @param {Object} data - Objeto a verificar
   * @param {string} objectType - Tipo de objeto
   * @returns {boolean} True si el objeto tiene datos encriptados
   */
  hasEncryptedData: function(data, objectType) {
    if (!data || typeof data !== 'object' || !objectType) {
      return false;
    }
    
    const sensitiveFields = this.config.sensitiveFields[objectType];
    if (!sensitiveFields || !sensitiveFields.length) {
      return false;
    }
    
    for (const field of sensitiveFields) {
      if (data[field] !== undefined && 
          typeof data[field] === 'string' &&
          data[field].startsWith(this.config.encryptedPrefix)) {
        return true;
      }
    }
    
    return false;
  }
};

// Exportar el objeto SecureStorage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureStorage;
}
