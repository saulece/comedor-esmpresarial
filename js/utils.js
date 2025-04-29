/**
 * Utilidades para el Sistema de Confirmación de Asistencias
 * Contiene funciones de ayuda utilizadas en toda la aplicación
 */

const Utils = {
  /**
   * Genera un ID único
   * @returns {string} ID único basado en timestamp y número aleatorio
   */
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Formatea una fecha según el formato especificado
   * @param {Date|string} date - Fecha a formatear
   * @param {Object} options - Opciones de formato (opcional)
   * @returns {string} Fecha formateada
   */
  formatDate: function(date, options = CONFIG.DEFAULT_DATE_FORMAT) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', options);
  },

  /**
   * Obtiene la fecha de inicio de la semana actual (lunes)
   * @returns {Date} Fecha de inicio de la semana
   */
  getCurrentWeekStartDate: function() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que la semana comience el lunes
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  },

  /**
   * Obtiene un array con las fechas de los 7 días de la semana a partir de una fecha
   * @param {Date} startDate - Fecha de inicio
   * @returns {Array} Array de objetos fecha para cada día de la semana
   */
  getWeekDays: function(startDate) {
    const weekDays = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      weekDays.push({
        date: date,
        dayOfWeek: date.getDay(),
        dayName: CONFIG.DAYS_OF_WEEK[date.getDay()].name
      });
    }
    
    return weekDays;
  },

  /**
   * Guarda datos en localStorage
   * @param {string} key - Clave para almacenar
   * @param {any} data - Datos a almacenar
   */
  saveToStorage: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      this.showNotification('Error al guardar datos localmente', 'error');
    }
  },

  /**
   * Obtiene datos de localStorage
   * @param {string} key - Clave para recuperar
   * @param {any} defaultValue - Valor predeterminado si no existe la clave
   * @returns {any} Datos recuperados o valor predeterminado
   */
  getFromStorage: function(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Error al recuperar de localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Muestra una notificación en la interfaz
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, error, warning, info)
   * @param {number} duration - Duración en milisegundos
   */
  showNotification: function(message, type = 'info', duration = 3000) {
    // Eliminar notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Ocultar después de la duración especificada
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  /**
   * Valida un formulario HTML5
   * @param {HTMLFormElement} form - Formulario a validar
   * @returns {boolean} True si el formulario es válido
   */
  validateForm: function(form) {
    if (!form.checkValidity()) {
      // Mostrar mensajes de validación nativos del navegador
      form.reportValidity();
      return false;
    }
    return true;
  },

  /**
   * Limpia todos los campos de un formulario
   * @param {HTMLFormElement} form - Formulario a limpiar
   */
  clearForm: function(form) {
    form.reset();
    // Limpiar también campos personalizados si es necesario
    form.querySelectorAll('input[type="hidden"]').forEach(input => {
      input.value = '';
    });
  },

  /**
   * Crea un elemento DOM con atributos y contenido
   * @param {string} tag - Etiqueta HTML
   * @param {Object} attributes - Atributos para el elemento
   * @param {string|Node|Array} content - Contenido del elemento
   * @returns {HTMLElement} Elemento creado
   */
  createElement: function(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Añadir atributos
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Añadir contenido
    if (content) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (content instanceof Node) {
        element.appendChild(content);
      } else if (Array.isArray(content)) {
        content.forEach(item => {
          if (item instanceof Node) {
            element.appendChild(item);
          }
        });
      }
    }
    
    return element;
  },

  /**
   * Suma un array de números
   * @param {Array} numbers - Array de números
   * @returns {number} Suma total
   */
  sumArray: function(numbers) {
    return numbers.reduce((sum, num) => sum + (Number(num) || 0), 0);
  },

  /**
   * Comprueba si un objeto está vacío
   * @param {Object} obj - Objeto a comprobar
   * @returns {boolean} True si el objeto está vacío
   */
  isEmptyObject: function(obj) {
    return Object.keys(obj).length === 0;
  },

  /**
   * Filtra un array de objetos por una propiedad y valor
   * @param {Array} array - Array de objetos
   * @param {string} property - Propiedad a filtrar
   * @param {any} value - Valor a buscar
   * @returns {Array} Array filtrado
   */
  filterArrayByProperty: function(array, property, value) {
    return array.filter(item => item[property] === value);
  },

  /**
   * Encuentra un objeto en un array por su ID
   * @param {Array} array - Array de objetos
   * @param {string} id - ID a buscar
   * @returns {Object|null} Objeto encontrado o null
   */
  findById: function(array, id) {
    return array.find(item => item.id === id) || null;
  }
};
