/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Accesibilidad
 * 
 * Este módulo implementa los fundamentos de conformidad WCAG 2.1 AA
 * para mejorar la accesibilidad de la aplicación.
 */

const Accessibility = {
  // Configuración
  config: {
    enabled: true,
    highContrast: false,
    focusVisible: true,
    textSize: 'normal', // 'small', 'normal', 'large', 'x-large'
    reduceMotion: false,
    announceChanges: true
  },
  
  // Estado
  state: {
    isInitialized: false,
    focusableElements: [],
    ariaLiveRegion: null
  },
  
  /**
   * Inicializa el módulo de accesibilidad
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[Accessibility] Inicializando módulo de accesibilidad');
    
    // Crear región para anuncios de cambios
    this._createAriaLiveRegion();
    
    // Mejorar manejo de foco
    this._enhanceFocusManagement();
    
    // Aplicar configuración inicial
    this._applyConfiguration();
    
    // Agregar atributos ARIA a elementos existentes
    this._enhanceExistingElements();
    
    // Agregar event listeners
    this._setupEventListeners();
    
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Crea una región para anuncios de cambios
   * @private
   */
  _createAriaLiveRegion: function() {
    // Verificar si ya existe
    let liveRegion = document.getElementById('aria-live-announcer');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-announcer';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only'; // Solo visible para lectores de pantalla
      document.body.appendChild(liveRegion);
    }
    
    this.state.ariaLiveRegion = liveRegion;
  },
  
  /**
   * Mejora el manejo de foco para navegación por teclado
   * @private
   */
  _enhanceFocusManagement: function() {
    // Agregar clase para mostrar foco visible
    if (this.config.focusVisible) {
      document.documentElement.classList.add('focus-visible');
    }
    
    // Detectar uso de teclado vs. ratón
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        document.documentElement.classList.add('keyboard-user');
      }
    });
    
    document.addEventListener('mousedown', function() {
      document.documentElement.classList.remove('keyboard-user');
    });
    
    // Escanear elementos focusables
    this._scanFocusableElements();
  },
  
  /**
   * Escanea y registra elementos focusables en la página
   * @private
   */
  _scanFocusableElements: function() {
    const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    this.state.focusableElements = Array.from(document.querySelectorAll(selector));
    
    // Verificar elementos sin etiquetas adecuadas
    this.state.focusableElements.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
          const id = el.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (!label) {
              console.warn('[Accessibility] Elemento sin etiqueta:', el);
            }
          } else {
            console.warn('[Accessibility] Elemento sin ID ni etiqueta:', el);
          }
        }
      }
    });
  },
  
  /**
   * Aplica la configuración de accesibilidad
   * @private
   */
  _applyConfiguration: function() {
    const html = document.documentElement;
    
    // Aplicar alto contraste si está habilitado
    if (this.config.highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
    
    // Aplicar tamaño de texto
    html.classList.remove('text-small', 'text-normal', 'text-large', 'text-x-large');
    html.classList.add(`text-${this.config.textSize}`);
    
    // Aplicar reducción de movimiento
    if (this.config.reduceMotion) {
      html.classList.add('reduce-motion');
    } else {
      html.classList.remove('reduce-motion');
    }
  },
  
  /**
   * Mejora elementos existentes con atributos ARIA
   * @private
   */
  _enhanceExistingElements: function() {
    // Mejorar tablas
    document.querySelectorAll('table').forEach(table => {
      if (!table.hasAttribute('role')) {
        table.setAttribute('role', 'table');
      }
      
      // Añadir caption si no existe
      if (!table.querySelector('caption') && table.hasAttribute('data-title')) {
        const caption = document.createElement('caption');
        caption.textContent = table.getAttribute('data-title');
        table.prepend(caption);
      }
    });
    
    // Mejorar formularios
    document.querySelectorAll('form').forEach(form => {
      // Asegurar que todos los campos requeridos estén marcados
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.hasAttribute('aria-required')) {
          field.setAttribute('aria-required', 'true');
        }
        
        // Añadir texto de "requerido" a la etiqueta si existe
        if (field.id) {
          const label = document.querySelector(`label[for="${field.id}"]`);
          if (label && !label.querySelector('.required-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'required-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            indicator.textContent = ' *';
            label.appendChild(indicator);
          }
        }
      });
    });
    
    // Mejorar imágenes
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt')) {
        console.warn('[Accessibility] Imagen sin atributo alt:', img);
        // No asignar alt automáticamente, pero advertir para revisión manual
      }
    });
    
    // Mejorar botones sin texto
    document.querySelectorAll('button').forEach(button => {
      if (!button.textContent.trim() && !button.hasAttribute('aria-label')) {
        console.warn('[Accessibility] Botón sin texto ni aria-label:', button);
      }
    });
  },
  
  /**
   * Configura event listeners para accesibilidad
   * @private
   */
  _setupEventListeners: function() {
    // Monitorear cambios en el DOM para actualizar accesibilidad
    if (window.MutationObserver) {
      const observer = new MutationObserver(mutations => {
        let shouldRescan = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldRescan = true;
          }
        });
        
        if (shouldRescan) {
          this._scanFocusableElements();
          this._enhanceExistingElements();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  },
  
  /**
   * Anuncia un mensaje a los lectores de pantalla
   * @param {string} message - Mensaje a anunciar
   * @param {string} priority - Prioridad del mensaje ('polite' o 'assertive')
   */
  announce: function(message, priority = 'polite') {
    if (!this.config.announceChanges || !this.state.ariaLiveRegion) return;
    
    // Establecer prioridad
    this.state.ariaLiveRegion.setAttribute('aria-live', priority);
    
    // Limpiar anuncios anteriores
    this.state.ariaLiveRegion.textContent = '';
    
    // Usar setTimeout para asegurar que los lectores de pantalla detecten el cambio
    setTimeout(() => {
      this.state.ariaLiveRegion.textContent = message;
    }, 50);
  },
  
  /**
   * Activa/desactiva el modo de alto contraste
   * @param {boolean} enable - Activar o desactivar
   */
  toggleHighContrast: function(enable) {
    this.config.highContrast = enable !== undefined ? enable : !this.config.highContrast;
    this._applyConfiguration();
    
    // Anunciar cambio
    const message = this.config.highContrast ? 
      'Modo de alto contraste activado' : 
      'Modo de alto contraste desactivado';
    
    this.announce(message);
    
    return this.config.highContrast;
  },
  
  /**
   * Cambia el tamaño del texto
   * @param {string} size - Tamaño del texto ('small', 'normal', 'large', 'x-large')
   */
  setTextSize: function(size) {
    if (['small', 'normal', 'large', 'x-large'].includes(size)) {
      this.config.textSize = size;
      this._applyConfiguration();
      
      // Anunciar cambio
      this.announce(`Tamaño de texto cambiado a ${size}`);
    }
    
    return this.config.textSize;
  },
  
  /**
   * Activa/desactiva la reducción de movimiento
   * @param {boolean} enable - Activar o desactivar
   */
  toggleReduceMotion: function(enable) {
    this.config.reduceMotion = enable !== undefined ? enable : !this.config.reduceMotion;
    this._applyConfiguration();
    
    // Anunciar cambio
    const message = this.config.reduceMotion ? 
      'Animaciones reducidas activadas' : 
      'Animaciones reducidas desactivadas';
    
    this.announce(message);
    
    return this.config.reduceMotion;
  },
  
  /**
   * Establece el foco en un elemento
   * @param {HTMLElement|string} element - Elemento o selector a enfocar
   * @param {boolean} announce - Anunciar el cambio de foco
   */
  setFocus: function(element, announce = true) {
    let el = element;
    
    if (typeof element === 'string') {
      el = document.querySelector(element);
    }
    
    if (el && typeof el.focus === 'function') {
      el.focus();
      
      if (announce && el.textContent) {
        this.announce(`Foco en: ${el.textContent.trim()}`);
      }
      
      return true;
    }
    
    return false;
  },
  
  /**
   * Crea un atajo de teclado
   * @param {string} key - Tecla o combinación de teclas (ej: 'Escape', 'Control+S')
   * @param {Function} callback - Función a ejecutar
   * @param {string} description - Descripción del atajo para ayuda
   */
  createKeyboardShortcut: function(key, callback, description) {
    if (!key || typeof callback !== 'function') return false;
    
    const handler = (event) => {
      const keys = key.split('+');
      const mainKey = keys.pop().toLowerCase();
      
      // Verificar modificadores
      const hasCtrl = keys.includes('Control') || keys.includes('Ctrl');
      const hasAlt = keys.includes('Alt');
      const hasShift = keys.includes('Shift');
      
      if (event.key.toLowerCase() === mainKey &&
          event.ctrlKey === hasCtrl &&
          event.altKey === hasAlt &&
          event.shiftKey === hasShift) {
        
        event.preventDefault();
        callback(event);
      }
    };
    
    document.addEventListener('keydown', handler);
    
    // Registrar atajo para ayuda
    if (!this.state.keyboardShortcuts) {
      this.state.keyboardShortcuts = [];
    }
    
    this.state.keyboardShortcuts.push({
      key,
      description,
      handler
    });
    
    return true;
  },
  
  /**
   * Muestra una lista de atajos de teclado disponibles
   */
  showKeyboardShortcuts: function() {
    if (!this.state.keyboardShortcuts || this.state.keyboardShortcuts.length === 0) {
      this.announce('No hay atajos de teclado disponibles');
      return;
    }
    
    // Crear modal con lista de atajos
    const shortcuts = this.state.keyboardShortcuts.map(s => 
      `<tr><td><kbd>${s.key}</kbd></td><td>${s.description}</td></tr>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'a11y-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'keyboard-shortcuts-title');
    
    modal.innerHTML = `
      <div class="a11y-modal-content">
        <h2 id="keyboard-shortcuts-title">Atajos de teclado</h2>
        <table class="a11y-shortcuts-table">
          <thead>
            <tr>
              <th>Atajo</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${shortcuts}
          </tbody>
        </table>
        <button class="a11y-modal-close" aria-label="Cerrar">×</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Manejar cierre
    const closeButton = modal.querySelector('.a11y-modal-close');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Cerrar con Escape
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
      }
    });
    
    // Enfocar el modal
    this.setFocus(modal);
  },
  
  /**
   * Valida la accesibilidad de un elemento
   * @param {HTMLElement|string} element - Elemento o selector a validar
   * @returns {Object} - Resultados de la validación
   */
  validateElement: function(element) {
    let el = element;
    
    if (typeof element === 'string') {
      el = document.querySelector(element);
    }
    
    if (!el) return { valid: false, errors: ['Elemento no encontrado'] };
    
    const errors = [];
    
    // Validar imágenes
    if (el.tagName === 'IMG') {
      if (!el.hasAttribute('alt')) {
        errors.push('La imagen no tiene atributo alt');
      }
    }
    
    // Validar controles de formulario
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        const id = el.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label) {
            errors.push('El campo no tiene etiqueta asociada');
          }
        } else {
          errors.push('El campo no tiene ID ni etiqueta');
        }
      }
    }
    
    // Validar botones
    if (el.tagName === 'BUTTON') {
      if (!el.textContent.trim() && !el.hasAttribute('aria-label')) {
        errors.push('El botón no tiene texto ni aria-label');
      }
    }
    
    // Validar enlaces
    if (el.tagName === 'A') {
      if (!el.textContent.trim() && !el.hasAttribute('aria-label')) {
        errors.push('El enlace no tiene texto ni aria-label');
      }
      
      if (el.getAttribute('target') === '_blank' && !el.getAttribute('rel')?.includes('noopener')) {
        errors.push('Enlace que abre en nueva ventana sin rel="noopener"');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
};

// Exportar el objeto Accessibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Accessibility;
}
