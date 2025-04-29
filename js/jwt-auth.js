/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de autenticación JWT
 * 
 * Este archivo implementa funciones para la generación y validación de tokens JWT
 * utilizando las capacidades nativas del navegador, sin dependencias externas.
 */

const JWTAuth = {
  /**
   * Configuración del sistema JWT
   */
  config: {
    // Secreto para firmar los tokens (en una aplicación real, esto debería estar en una variable de entorno)
    tokenSecret: 'comedor-empresarial-jwt-secret-key',
    
    // Duración del token de acceso (en segundos)
    accessTokenExpiry: 3600, // 1 hora
    
    // Duración del token de refresco (en segundos)
    refreshTokenExpiry: 604800, // 7 días
    
    // Algoritmo de firma
    algorithm: 'HS256',
    
    // Nombre del emisor
    issuer: 'comedor-empresarial-app',
    
    // Nombre del token en localStorage
    tokenName: 'comedor_auth_token',
    
    // Nombre del token de refresco en localStorage
    refreshTokenName: 'comedor_refresh_token'
  },
  
  /**
   * Genera un token JWT para un usuario
   * @param {Object} payload - Datos a incluir en el token
   * @param {number} expirySeconds - Tiempo de expiración en segundos
   * @returns {string} Token JWT generado
   */
  generateToken: function(payload, expirySeconds) {
    // Usar el tiempo de expiración predeterminado si no se proporciona
    const expiry = expirySeconds || this.config.accessTokenExpiry;
    
    // Crear el encabezado
    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };
    
    // Crear el payload con los campos estándar
    const tokenPayload = {
      ...payload,
      iss: this.config.issuer,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiry
    };
    
    // Codificar el encabezado y el payload
    const encodedHeader = this._base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this._base64UrlEncode(JSON.stringify(tokenPayload));
    
    // Crear la firma
    const signature = this._createSignature(encodedHeader + '.' + encodedPayload);
    
    // Construir el token
    return encodedHeader + '.' + encodedPayload + '.' + signature;
  },
  
  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token JWT a verificar
   * @returns {Object|null} Payload del token si es válido, null si no
   */
  verifyToken: function(token) {
    try {
      // Verificar formato del token
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Formato de token inválido');
        return null;
      }
      
      // Decodificar encabezado y payload
      const header = JSON.parse(this._base64UrlDecode(parts[0]));
      const payload = JSON.parse(this._base64UrlDecode(parts[1]));
      
      // Verificar algoritmo
      if (header.alg !== this.config.algorithm) {
        console.error('Algoritmo no soportado:', header.alg);
        return null;
      }
      
      // Verificar firma
      const expectedSignature = this._createSignature(parts[0] + '.' + parts[1]);
      if (parts[2] !== expectedSignature) {
        console.error('Firma inválida');
        return null;
      }
      
      // Verificar expiración
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.error('Token expirado');
        return null;
      }
      
      // Verificar emisor
      if (payload.iss && payload.iss !== this.config.issuer) {
        console.error('Emisor inválido:', payload.iss);
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return null;
    }
  },
  
  /**
   * Genera un par de tokens (acceso y refresco) para un usuario
   * @param {Object} user - Usuario para el que se generan los tokens
   * @returns {Object} Objeto con los tokens generados
   */
  generateTokenPair: function(user) {
    // Crear payload para el token de acceso
    const accessPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'access'
    };
    
    // Crear payload para el token de refresco
    const refreshPayload = {
      userId: user.id,
      type: 'refresh'
    };
    
    // Generar tokens
    const accessToken = this.generateToken(accessPayload, this.config.accessTokenExpiry);
    const refreshToken = this.generateToken(refreshPayload, this.config.refreshTokenExpiry);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenExpiry
    };
  },
  
  /**
   * Refresca un token de acceso utilizando un token de refresco
   * @param {string} refreshToken - Token de refresco
   * @returns {Object|null} Nuevo par de tokens si el refresco fue exitoso, null si no
   */
  refreshAccessToken: function(refreshToken) {
    // Verificar el token de refresco
    const payload = this.verifyToken(refreshToken);
    
    // Verificar que sea un token de refresco válido
    if (!payload || payload.type !== 'refresh') {
      console.error('Token de refresco inválido');
      return null;
    }
    
    // Obtener el usuario
    const user = Models.User.getById(payload.userId);
    if (!user) {
      console.error('Usuario no encontrado');
      return null;
    }
    
    // Generar nuevo par de tokens
    return this.generateTokenPair(user);
  },
  
  /**
   * Almacena los tokens en localStorage
   * @param {Object} tokens - Tokens a almacenar
   */
  storeTokens: function(tokens) {
    localStorage.setItem(this.config.tokenName, tokens.accessToken);
    localStorage.setItem(this.config.refreshTokenName, tokens.refreshToken);
  },
  
  /**
   * Obtiene los tokens almacenados
   * @returns {Object} Tokens almacenados
   */
  getStoredTokens: function() {
    return {
      accessToken: localStorage.getItem(this.config.tokenName),
      refreshToken: localStorage.getItem(this.config.refreshTokenName)
    };
  },
  
  /**
   * Elimina los tokens almacenados
   */
  clearTokens: function() {
    localStorage.removeItem(this.config.tokenName);
    localStorage.removeItem(this.config.refreshTokenName);
  },
  
  /**
   * Verifica si hay un usuario autenticado
   * @returns {boolean} True si hay un usuario autenticado
   */
  isAuthenticated: function() {
    const tokens = this.getStoredTokens();
    return !!tokens.accessToken && !!this.verifyToken(tokens.accessToken);
  },
  
  /**
   * Obtiene el usuario autenticado actual
   * @returns {Object|null} Usuario autenticado o null si no hay ninguno
   */
  getCurrentUser: function() {
    if (!this.isAuthenticated()) {
      return null;
    }
    
    const tokens = this.getStoredTokens();
    const payload = this.verifyToken(tokens.accessToken);
    
    if (!payload) {
      return null;
    }
    
    return Models.User.getById(payload.userId);
  },
  
  /**
   * Verifica si el usuario actual tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {boolean} True si el usuario tiene el rol especificado
   */
  hasRole: function(role) {
    const user = this.getCurrentUser();
    return !!user && user.role === role;
  },
  
  /**
   * Codifica una cadena en Base64URL
   * @param {string} str - Cadena a codificar
   * @returns {string} Cadena codificada
   * @private
   */
  _base64UrlEncode: function(str) {
    // Primero codificar en Base64
    let base64 = btoa(str);
    
    // Convertir a Base64URL (reemplazar caracteres no URL-safe)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  
  /**
   * Decodifica una cadena en Base64URL
   * @param {string} str - Cadena a decodificar
   * @returns {string} Cadena decodificada
   * @private
   */
  _base64UrlDecode: function(str) {
    // Convertir de Base64URL a Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Añadir padding si es necesario
    switch (base64.length % 4) {
      case 0:
        break; // No es necesario añadir padding
      case 2:
        base64 += '==';
        break;
      case 3:
        base64 += '=';
        break;
      default:
        throw new Error('Cadena Base64URL inválida');
    }
    
    // Decodificar Base64
    return atob(base64);
  },
  
  /**
   * Crea una firma para un token JWT
   * @param {string} data - Datos a firmar
   * @returns {string} Firma en formato Base64URL
   * @private
   */
  _createSignature: function(data) {
    // En una implementación real, se utilizaría una función criptográfica
    // Como estamos en el navegador sin bibliotecas externas, usamos una función simple
    
    // Combinar los datos con el secreto
    const toSign = data + this.config.tokenSecret;
    
    // Crear un hash simple
    let hash = 0;
    for (let i = 0; i < toSign.length; i++) {
      const char = toSign.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    
    // Convertir a string hexadecimal y luego a Base64URL
    const hashHex = Math.abs(hash).toString(16).padStart(32, '0');
    return this._base64UrlEncode(hashHex);
  }
};

// Exportar el objeto JWTAuth
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JWTAuth;
}
