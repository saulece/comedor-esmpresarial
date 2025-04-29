/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de sanitización de entradas
 * 
 * Este archivo implementa funciones para sanitizar entradas de usuario
 * y prevenir ataques XSS e inyecciones sin dependencias externas.
 */

const InputSanitizer = {
  /**
   * Sanitiza un string para prevenir ataques XSS
   * @param {string} input - String a sanitizar
   * @returns {string} String sanitizado
   */
  sanitizeString: function(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Reemplazar caracteres especiales con entidades HTML
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  /**
   * Sanitiza un objeto recursivamente
   * @param {Object} obj - Objeto a sanitizar
   * @returns {Object} Objeto sanitizado
   */
  sanitizeObject: function(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    // Si es un array, sanitizar cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    // Si es un objeto, sanitizar cada propiedad
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Sanitizar el valor según su tipo
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  },
  
  /**
   * Sanitiza los datos de un formulario
   * @param {string} formId - ID del formulario
   * @returns {Object} Datos sanitizados del formulario
   */
  sanitizeForm: function(formId) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Formulario con ID ${formId} no encontrado`);
      return {};
    }
    
    const formData = {};
    const elements = form.elements;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      // Omitir elementos sin nombre o botones
      if (!element.name || element.type === 'button' || element.type === 'submit' || element.type === 'reset') {
        continue;
      }
      
      // Procesar según el tipo de elemento
      if (element.type === 'checkbox') {
        formData[element.name] = element.checked;
      } else if (element.type === 'radio') {
        if (element.checked) {
          formData[element.name] = this.sanitizeString(element.value);
        }
      } else if (element.type === 'select-multiple') {
        const selectedValues = [];
        for (let j = 0; j < element.options.length; j++) {
          if (element.options[j].selected) {
            selectedValues.push(this.sanitizeString(element.options[j].value));
          }
        }
        formData[element.name] = selectedValues;
      } else {
        formData[element.name] = this.sanitizeString(element.value);
      }
    }
    
    return formData;
  },
  
  /**
   * Sanitiza una URL para prevenir ataques de inyección
   * @param {string} url - URL a sanitizar
   * @returns {string} URL sanitizada
   */
  sanitizeUrl: function(url) {
    if (typeof url !== 'string') {
      return '';
    }
    
    // Eliminar protocolos no seguros
    let sanitized = url.replace(/^(javascript|data|vbscript):/i, '');
    
    // Asegurarse de que la URL comienza con http:// o https://
    if (sanitized && !sanitized.match(/^https?:\/\//i)) {
      sanitized = 'http://' + sanitized;
    }
    
    return sanitized;
  },
  
  /**
   * Sanitiza un valor para uso en SQL (previene inyección SQL)
   * Nota: Esto es una simulación simple, en un entorno real se usarían
   * consultas preparadas con parámetros
   * @param {string} value - Valor a sanitizar
   * @returns {string} Valor sanitizado
   */
  sanitizeForSQL: function(value) {
    if (typeof value !== 'string') {
      return '';
    }
    
    // Escapar comillas simples y otros caracteres problemáticos
    return value
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\x1a/g, '\\Z');
  },
  
  /**
   * Sanitiza un valor para uso en HTML (previene XSS)
   * @param {string} html - HTML a sanitizar
   * @returns {string} HTML sanitizado
   */
  sanitizeHTML: function(html) {
    if (typeof html !== 'string') {
      return '';
    }
    
    // Crear un elemento temporal
    const tempElement = document.createElement('div');
    
    // Asignar el HTML como texto (esto convierte automáticamente las entidades HTML)
    tempElement.textContent = html;
    
    // Devolver el HTML sanitizado
    return tempElement.innerHTML;
  },
  
  /**
   * Valida y sanitiza una dirección de correo electrónico
   * @param {string} email - Correo electrónico a validar
   * @returns {string} Correo electrónico sanitizado o cadena vacía si es inválido
   */
  sanitizeEmail: function(email) {
    if (typeof email !== 'string') {
      return '';
    }
    
    // Expresión regular para validar correos electrónicos
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Verificar si el correo es válido
    if (!emailRegex.test(email)) {
      return '';
    }
    
    // Sanitizar el correo (convertir a minúsculas y eliminar espacios)
    return email.toLowerCase().trim();
  },
  
  /**
   * Aplica sanitización a un elemento de entrada en tiempo real
   * @param {string} elementId - ID del elemento
   * @param {string} sanitizeType - Tipo de sanitización (string, url, email, etc.)
   */
  setupLiveSanitization: function(elementId, sanitizeType = 'string') {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Elemento con ID ${elementId} no encontrado`);
      return;
    }
    
    // Aplicar sanitización en eventos de entrada
    element.addEventListener('input', () => {
      let sanitizedValue;
      
      switch (sanitizeType) {
        case 'url':
          sanitizedValue = this.sanitizeUrl(element.value);
          break;
        case 'email':
          sanitizedValue = this.sanitizeEmail(element.value);
          break;
        case 'html':
          sanitizedValue = this.sanitizeHTML(element.value);
          break;
        case 'sql':
          sanitizedValue = this.sanitizeForSQL(element.value);
          break;
        case 'string':
        default:
          sanitizedValue = this.sanitizeString(element.value);
          break;
      }
      
      // Solo actualizar si el valor ha cambiado
      if (element.value !== sanitizedValue) {
        element.value = sanitizedValue;
      }
    });
    
    // También sanitizar al perder el foco
    element.addEventListener('blur', () => {
      let sanitizedValue;
      
      switch (sanitizeType) {
        case 'url':
          sanitizedValue = this.sanitizeUrl(element.value);
          break;
        case 'email':
          sanitizedValue = this.sanitizeEmail(element.value);
          break;
        case 'html':
          sanitizedValue = this.sanitizeHTML(element.value);
          break;
        case 'sql':
          sanitizedValue = this.sanitizeForSQL(element.value);
          break;
        case 'string':
        default:
          sanitizedValue = this.sanitizeString(element.value);
          break;
      }
      
      element.value = sanitizedValue;
    });
  }
};

// Exportar el objeto InputSanitizer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputSanitizer;
}
