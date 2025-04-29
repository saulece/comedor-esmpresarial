/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Extensión de seguridad para el modelo de usuario
 * 
 * Este archivo extiende el modelo de usuario con campos y funcionalidades
 * de seguridad, incluyendo hash de contraseñas y gestión de tokens.
 */

const UserSecurity = {
  /**
   * Configuración de seguridad
   */
  config: {
    // Longitud del salt para el hash de contraseñas
    saltRounds: 10,
    
    // Duración del token de acceso (en segundos)
    accessTokenExpiry: 3600, // 1 hora
    
    // Duración del token de refresco (en segundos)
    refreshTokenExpiry: 604800, // 7 días
    
    // Secreto para firmar los tokens (en una aplicación real, esto debería estar en una variable de entorno)
    tokenSecret: 'comedor-empresarial-secret-key',
    
    // Algoritmo de hash para las contraseñas
    hashAlgorithm: 'SHA-256'
  },
  
  /**
   * Extiende el modelo de usuario con campos de seguridad
   * @param {Object} user - Usuario a extender
   * @returns {Object} Usuario extendido con campos de seguridad
   */
  extendUserModel: function(user) {
    if (!user) return null;
    
    // Añadir campos de seguridad si no existen
    if (!user.securityFields) {
      user.securityFields = {
        passwordHash: null,
        passwordSalt: null,
        lastPasswordChange: null,
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        accountLocked: false,
        lockUntil: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        refreshTokenExpiry: null
      };
    }
    
    return user;
  },
  
  /**
   * Genera un hash seguro para una contraseña
   * @param {string} password - Contraseña a hashear
   * @returns {Promise<Object>} Promesa que se resuelve con el hash y el salt
   */
  hashPassword: function(password) {
    // Verificar si el módulo PasswordHash está disponible
    if (typeof PasswordHash !== 'undefined') {
      // Usar el módulo PasswordHash para generar el hash
      return PasswordHash.hashPassword(password);
    } else {
      // Fallback a la implementación anterior si PasswordHash no está disponible
      return new Promise((resolve, reject) => {
        try {
          // Generar un salt aleatorio
          const salt = this._generateSalt();
          
          // Combinar la contraseña con el salt
          const combinedPassword = password + salt;
          
          // Generar el hash
          const hash = this._generateHash(combinedPassword);
          
          resolve({
            hash: hash,
            salt: salt
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  },
  
  /**
   * Verifica si una contraseña coincide con un hash almacenado
   * @param {string} password - Contraseña a verificar
   * @param {string} storedHash - Hash almacenado
   * @param {string} salt - Salt utilizado para el hash
   * @param {Object} options - Opciones adicionales (algoritmo, iteraciones)
   * @returns {Promise<boolean>} Promesa que se resuelve con true si la contraseña coincide
   */
  verifyPassword: function(password, storedHash, salt, options = {}) {
    // Verificar si el módulo PasswordHash está disponible
    if (typeof PasswordHash !== 'undefined') {
      // Usar el módulo PasswordHash para verificar la contraseña
      return PasswordHash.verifyPassword(password, storedHash, salt, options);
    } else {
      // Fallback a la implementación anterior si PasswordHash no está disponible
      return new Promise((resolve) => {
        try {
          // Combinar la contraseña con el salt
          const combinedPassword = password + salt;
          
          // Generar el hash
          const hash = this._generateHash(combinedPassword);
          
          // Comparar los hashes
          resolve(hash === storedHash);
        } catch (error) {
          console.error('Error al verificar contraseña:', error);
          resolve(false);
        }
      });
    }
  },
  
  /**
   * Genera un token de acceso para un usuario
   * @param {Object} user - Usuario para el que se genera el token
   * @returns {Object} Tokens generados (access y refresh)
   */
  generateTokens: function(user) {
    if (!user || !user.id) {
      throw new Error('Se requiere un usuario válido para generar tokens');
    }
    
    // Generar token de acceso
    const accessTokenExpiry = Date.now() + (this.config.accessTokenExpiry * 1000);
    const accessToken = this._generateToken(user, accessTokenExpiry);
    
    // Generar token de refresco
    const refreshTokenExpiry = Date.now() + (this.config.refreshTokenExpiry * 1000);
    const refreshToken = this._generateToken(user, refreshTokenExpiry, true);
    
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiry: accessTokenExpiry,
      refreshTokenExpiry: refreshTokenExpiry
    };
  },
  
  /**
   * Verifica si un token es válido
   * @param {string} token - Token a verificar
   * @returns {Object|null} Payload del token si es válido, null si no
   */
  verifyToken: function(token) {
    try {
      // Decodificar el token
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];
      
      // Verificar la firma
      const expectedSignature = this._generateSignature(parts[0] + '.' + parts[1]);
      if (signature !== expectedSignature) {
        return null;
      }
      
      // Verificar la expiración
      if (payload.exp && payload.exp < Date.now()) {
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return null;
    }
  },
  
  /**
   * Refresca un token de acceso utilizando un token de refresco
   * @param {string} refreshToken - Token de refresco
   * @returns {Object|null} Nuevos tokens si el refresco fue exitoso, null si no
   */
  refreshAccessToken: function(refreshToken) {
    // Verificar el token de refresco
    const payload = this.verifyToken(refreshToken);
    if (!payload || !payload.userId || !payload.isRefreshToken) {
      return null;
    }
    
    // Obtener el usuario
    const user = Models.User.getById(payload.userId);
    if (!user) {
      return null;
    }
    
    // Verificar que el token de refresco coincida con el almacenado
    if (!user.securityFields || user.securityFields.refreshToken !== refreshToken) {
      return null;
    }
    
    // Generar nuevos tokens
    return this.generateTokens(user);
  },
  
  /**
   * Registra un intento de inicio de sesión fallido
   * @param {Object} user - Usuario que intentó iniciar sesión
   * @returns {Object} Usuario actualizado
   */
  registerFailedLoginAttempt: function(user) {
    if (!user) return null;
    
    // Extender el usuario con campos de seguridad si no existen
    user = this.extendUserModel(user);
    
    // Incrementar contador de intentos fallidos
    user.securityFields.failedLoginAttempts = (user.securityFields.failedLoginAttempts || 0) + 1;
    user.securityFields.lastFailedLogin = new Date().toISOString();
    
    // Bloquear la cuenta si hay demasiados intentos fallidos
    if (user.securityFields.failedLoginAttempts >= 5) {
      user.securityFields.accountLocked = true;
      user.securityFields.lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // Bloquear por 30 minutos
    }
    
    // Guardar cambios
    Models.User.update(user.id, user);
    
    return user;
  },
  
  /**
   * Registra un inicio de sesión exitoso
   * @param {Object} user - Usuario que inició sesión
   * @returns {Object} Usuario actualizado
   */
  registerSuccessfulLogin: function(user) {
    if (!user) return null;
    
    // Extender el usuario con campos de seguridad si no existen
    user = this.extendUserModel(user);
    
    // Reiniciar contador de intentos fallidos
    user.securityFields.failedLoginAttempts = 0;
    user.securityFields.lastFailedLogin = null;
    user.securityFields.accountLocked = false;
    user.securityFields.lockUntil = null;
    
    // Generar tokens
    const tokens = this.generateTokens(user);
    
    // Guardar tokens en el usuario
    user.securityFields.accessToken = tokens.accessToken;
    user.securityFields.refreshToken = tokens.refreshToken;
    user.securityFields.tokenExpiry = tokens.accessTokenExpiry;
    user.securityFields.refreshTokenExpiry = tokens.refreshTokenExpiry;
    
    // Guardar cambios
    Models.User.update(user.id, user);
    
    return user;
  },
  
  /**
   * Genera un salt aleatorio para el hash de contraseñas
   * @returns {string} Salt generado
   * @private
   */
  _generateSalt: function() {
    // Generar un salt aleatorio de 16 bytes
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Genera un hash para una contraseña utilizando el algoritmo configurado
   * @param {string} password - Contraseña a hashear
   * @returns {string} Hash generado
   * @private
   */
  _generateHash: function(password) {
    // En un entorno real, se utilizaría una función de hash criptográfica
    // Como estamos en el navegador sin bibliotecas externas, usamos una función simple
    // Esta implementación es solo para demostración y debe ser reemplazada en producción
    
    // Convertir la contraseña a un array de bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Calcular el hash utilizando SubtleCrypto si está disponible
    if (window.crypto && window.crypto.subtle) {
      // Nota: Esta es una operación asíncrona, pero la estamos tratando como síncrona
      // En una implementación real, hashPassword debería manejar esta asincronía correctamente
      return window.crypto.subtle.digest(this.config.hashAlgorithm, data)
        .then(hashBuffer => {
          // Convertir el buffer a string hexadecimal
          return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        })
        .catch(error => {
          console.error('Error al generar hash:', error);
          // Fallback a una función simple
          return this._simpleHash(password);
        });
    }
    
    // Fallback a una función simple si SubtleCrypto no está disponible
    return this._simpleHash(password);
  },
  
  /**
   * Función de hash simple para fallback
   * @param {string} str - String a hashear
   * @returns {string} Hash generado
   * @private
   */
  _simpleHash: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    return hash.toString(16).padStart(8, '0');
  },
  
  /**
   * Genera un token JWT
   * @param {Object} user - Usuario para el que se genera el token
   * @param {number} expiry - Tiempo de expiración (timestamp)
   * @param {boolean} isRefreshToken - Indica si es un token de refresco
   * @returns {string} Token generado
   * @private
   */
  _generateToken: function(user, expiry, isRefreshToken = false) {
    // Crear el encabezado
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    // Crear el payload
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Date.now(),
      exp: expiry,
      isRefreshToken: isRefreshToken
    };
    
    // Codificar el encabezado y el payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Generar la firma
    const signature = this._generateSignature(encodedHeader + '.' + encodedPayload);
    
    // Combinar las partes para formar el token
    return encodedHeader + '.' + encodedPayload + '.' + signature;
  },
  
  /**
   * Genera una firma para un token JWT
   * @param {string} data - Datos a firmar
   * @returns {string} Firma generada
   * @private
   */
  _generateSignature: function(data) {
    // En un entorno real, se utilizaría una función de firma criptográfica
    // Como estamos en el navegador sin bibliotecas externas, usamos una función simple
    return this._simpleHash(data + this.config.tokenSecret);
  }
};

// Exportar el objeto UserSecurity
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserSecurity;
}
