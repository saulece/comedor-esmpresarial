/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de hash de contraseñas
 * 
 * Este archivo implementa funciones para el hash seguro de contraseñas
 * utilizando la API Web Crypto nativa del navegador, sin dependencias externas.
 */

const PasswordHash = {
  /**
   * Configuración del sistema de hash
   */
  config: {
    // Algoritmo de hash a utilizar
    algorithm: 'SHA-256',
    
    // Longitud del salt en bytes
    saltLength: 16,
    
    // Número de iteraciones para PBKDF2
    iterations: 10000,
    
    // Longitud de la clave derivada en bytes
    derivedKeyLength: 32
  },
  
  /**
   * Genera un hash para una contraseña
   * @param {string} password - Contraseña a hashear
   * @returns {Promise<Object>} Promesa que se resuelve con el hash y el salt
   */
  hashPassword: async function(password) {
    try {
      // Generar un salt aleatorio
      const salt = this._generateRandomSalt();
      
      // Generar el hash utilizando PBKDF2 si está disponible
      if (window.crypto && window.crypto.subtle) {
        try {
          const hash = await this._hashWithCrypto(password, salt);
          return {
            hash: hash,
            salt: this._arrayBufferToHex(salt),
            algorithm: this.config.algorithm,
            iterations: this.config.iterations
          };
        } catch (cryptoError) {
          console.warn('Error al usar Web Crypto API, utilizando fallback:', cryptoError);
          // Fallback a una implementación simple
          return this._hashWithFallback(password, salt);
        }
      } else {
        // Fallback para navegadores que no soportan Web Crypto API
        return this._hashWithFallback(password, salt);
      }
    } catch (error) {
      console.error('Error al hashear contraseña:', error);
      throw error;
    }
  },
  
  /**
   * Verifica si una contraseña coincide con un hash almacenado
   * @param {string} password - Contraseña a verificar
   * @param {string} storedHash - Hash almacenado
   * @param {string} salt - Salt utilizado para el hash (en formato hexadecimal)
   * @param {Object} options - Opciones adicionales (algoritmo, iteraciones)
   * @returns {Promise<boolean>} Promesa que se resuelve con true si la contraseña coincide
   */
  verifyPassword: async function(password, storedHash, salt, options = {}) {
    try {
      const algorithm = options.algorithm || this.config.algorithm;
      const iterations = options.iterations || this.config.iterations;
      
      // Convertir el salt de hexadecimal a ArrayBuffer
      const saltBuffer = this._hexToArrayBuffer(salt);
      
      // Verificar si Web Crypto API está disponible
      if (window.crypto && window.crypto.subtle) {
        try {
          // Generar el hash con la misma contraseña y salt
          const hash = await this._hashWithCrypto(password, saltBuffer, algorithm, iterations);
          
          // Comparar los hashes
          return hash === storedHash;
        } catch (cryptoError) {
          console.warn('Error al usar Web Crypto API para verificación, utilizando fallback:', cryptoError);
          // Fallback a una implementación simple
          const result = this._hashWithFallback(password, saltBuffer);
          return result.hash === storedHash;
        }
      } else {
        // Fallback para navegadores que no soportan Web Crypto API
        const result = this._hashWithFallback(password, saltBuffer);
        return result.hash === storedHash;
      }
    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      return false;
    }
  },
  
  /**
   * Genera un salt aleatorio
   * @returns {ArrayBuffer} Salt aleatorio
   * @private
   */
  _generateRandomSalt: function() {
    const salt = new Uint8Array(this.config.saltLength);
    window.crypto.getRandomValues(salt);
    return salt.buffer;
  },
  
  /**
   * Hashea una contraseña utilizando Web Crypto API
   * @param {string} password - Contraseña a hashear
   * @param {ArrayBuffer} salt - Salt para el hash
   * @param {string} algorithm - Algoritmo a utilizar (opcional)
   * @param {number} iterations - Número de iteraciones (opcional)
   * @returns {Promise<string>} Promesa que se resuelve con el hash en formato hexadecimal
   * @private
   */
  _hashWithCrypto: async function(password, salt, algorithm, iterations) {
    // Usar los valores predeterminados si no se proporcionan
    const alg = algorithm || this.config.algorithm;
    const iters = iterations || this.config.iterations;
    
    // Convertir la contraseña a un ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Importar la contraseña como clave
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derivar una clave utilizando PBKDF2
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iters,
        hash: alg
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Exportar la clave derivada
    const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);
    
    // Convertir a formato hexadecimal
    return this._arrayBufferToHex(exportedKey);
  },
  
  /**
   * Implementación de fallback para el hash de contraseñas
   * @param {string} password - Contraseña a hashear
   * @param {ArrayBuffer} salt - Salt para el hash
   * @returns {Object} Objeto con el hash y el salt
   * @private
   */
  _hashWithFallback: function(password, salt) {
    // Convertir el salt a string hexadecimal
    const saltHex = this._arrayBufferToHex(salt);
    
    // Combinar la contraseña con el salt
    const combined = password + saltHex;
    
    // Implementación simple de hash
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    
    // Convertir a string hexadecimal y añadir complejidad
    let hashHex = Math.abs(hash).toString(16).padStart(8, '0');
    
    // Añadir más complejidad al hash
    for (let i = 0; i < 10; i++) {
      hashHex = this._simpleHash(hashHex + saltHex + i);
    }
    
    return {
      hash: hashHex,
      salt: saltHex,
      algorithm: 'FALLBACK',
      iterations: 10
    };
  },
  
  /**
   * Función de hash simple para fallback
   * @param {string} str - String a hashear
   * @returns {string} Hash generado en formato hexadecimal
   * @private
   */
  _simpleHash: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  },
  
  /**
   * Convierte un ArrayBuffer a string hexadecimal
   * @param {ArrayBuffer} buffer - Buffer a convertir
   * @returns {string} String hexadecimal
   * @private
   */
  _arrayBufferToHex: function(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  },
  
  /**
   * Convierte un string hexadecimal a ArrayBuffer
   * @param {string} hex - String hexadecimal
   * @returns {ArrayBuffer} ArrayBuffer
   * @private
   */
  _hexToArrayBuffer: function(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }
};

// Exportar el objeto PasswordHash
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PasswordHash;
}
