/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Soporte para lectores de pantalla y navegación por teclado
 * 
 * Este módulo implementa funcionalidades específicas para mejorar
 * la experiencia de usuarios con lectores de pantalla y aquellos
 * que navegan principalmente por teclado.
 */

const ScreenReaderSupport = {
  // Configuración
  config: {
    enabled: true,
    ariaLivePolite: true,
    ariaLiveAssertive: true,
    keyboardNavigation: true,
    focusTrap: true,
    focusIndicators: true
  },
  
  // Estado
  state: {
    isInitialized: false,
    focusableSelectors: 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
    currentFocusTrap: null,
    keyboardUser: false,
    ariaLiveRegions: {
      polite: null,
      assertive: null
    }
  },
  
  /**
   * Inicializa el soporte para lectores de pantalla
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[ScreenReaderSupport] Inicializando soporte para lectores de pantalla y navegación por teclado');
    
    // Crear regiones ARIA Live
    this._setupAriaLiveRegions();
    
    // Mejorar navegación por teclado
    this._enhanceKeyboardNavigation();
    
    // Añadir atributos ARIA a elementos existentes
    this._enhanceExistingElements();
    
    // Configurar observador de cambios en el DOM
    this._setupMutationObserver();
    
    // Marcar como inicializado
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Configura regiones ARIA Live para anuncios
   * @private
   */
  _setupAriaLiveRegions: function() {
    // Región para anuncios polite (no interrumpe al usuario)
    if (this.config.ariaLivePolite) {
      let politeRegion = document.getElementById('aria-live-polite');
      
      if (!politeRegion) {
        politeRegion = document.createElement('div');
        politeRegion.id = 'aria-live-polite';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.className = 'sr-only';
        document.body.appendChild(politeRegion);
      }
      
      this.state.ariaLiveRegions.polite = politeRegion;
    }
    
    // Región para anuncios assertive (interrumpe al usuario)
    if (this.config.ariaLiveAssertive) {
      let assertiveRegion = document.getElementById('aria-live-assertive');
      
      if (!assertiveRegion) {
        assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'aria-live-assertive';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.className = 'sr-only';
        document.body.appendChild(assertiveRegion);
      }
      
      this.state.ariaLiveRegions.assertive = assertiveRegion;
    }
  },
  
  /**
   * Mejora la navegación por teclado
   * @private
   */
  _enhanceKeyboardNavigation: function() {
    if (!this.config.keyboardNavigation) return;
    
    // Detectar uso de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
        this.state.keyboardUser = true;
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-user');
      this.state.keyboardUser = false;
    });
    
    // Añadir manejo de tecla Escape para cerrar modales y menús
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Cerrar modales abiertos
        const openModals = document.querySelectorAll('.modal.active, [role="dialog"].active');
        if (openModals.length > 0) {
          const lastModal = openModals[openModals.length - 1];
          const closeButton = lastModal.querySelector('.close-button, .modal-close, [data-dismiss="modal"]');
          
          if (closeButton) {
            closeButton.click();
            e.preventDefault();
          }
        }
        
        // Cerrar menús desplegables abiertos
        const openMenus = document.querySelectorAll('.dropdown.open, .dropdown-menu.show');
        if (openMenus.length > 0) {
          openMenus.forEach(menu => {
            menu.classList.remove('open', 'show');
          });
          e.preventDefault();
        }
      }
    });
    
    // Mejorar navegación con flechas en elementos interactivos
    document.addEventListener('keydown', (e) => {
      // Navegación en menús con flechas
      if (e.key.startsWith('Arrow')) {
        const activeElement = document.activeElement;
        
        // Navegación en menús
        if (activeElement && activeElement.closest('.dropdown-menu, [role="menu"]')) {
          const menu = activeElement.closest('.dropdown-menu, [role="menu"]');
          const items = Array.from(menu.querySelectorAll('a, button, [role="menuitem"]'));
          const currentIndex = items.indexOf(activeElement);
          
          if (currentIndex !== -1) {
            let nextIndex;
            
            if (e.key === 'ArrowDown') {
              nextIndex = (currentIndex + 1) % items.length;
              e.preventDefault();
            } else if (e.key === 'ArrowUp') {
              nextIndex = (currentIndex - 1 + items.length) % items.length;
              e.preventDefault();
            }
            
            if (nextIndex !== undefined) {
              items[nextIndex].focus();
            }
          }
        }
        
        // Navegación en tabs
        if (activeElement && activeElement.closest('.tab-btn, [role="tab"]')) {
          const tabList = activeElement.closest('.tabs, [role="tablist"]');
          if (tabList) {
            const tabs = Array.from(tabList.querySelectorAll('.tab-btn, [role="tab"]'));
            const currentIndex = tabs.indexOf(activeElement);
            
            if (currentIndex !== -1) {
              let nextIndex;
              
              if (e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % tabs.length;
                e.preventDefault();
              } else if (e.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                e.preventDefault();
              }
              
              if (nextIndex !== undefined) {
                tabs[nextIndex].focus();
                tabs[nextIndex].click(); // Activar la pestaña
              }
            }
          }
        }
      }
    });
  },
  
  /**
   * Mejora elementos existentes con atributos ARIA
   * @private
   */
  _enhanceExistingElements: function() {
    // Mejorar tabs
    document.querySelectorAll('.tabs').forEach(tabContainer => {
      if (!tabContainer.hasAttribute('role')) {
        tabContainer.setAttribute('role', 'tablist');
      }
      
      const tabButtons = tabContainer.querySelectorAll('.tab-btn');
      const tabContents = [];
      
      tabButtons.forEach((btn, index) => {
        // Añadir roles y atributos ARIA a botones de tabs
        if (!btn.hasAttribute('role')) {
          btn.setAttribute('role', 'tab');
        }
        
        // Generar IDs si no existen
        if (!btn.id) {
          btn.id = `tab-${index}-${Date.now()}`;
        }
        
        // Encontrar panel asociado
        const tabId = btn.getAttribute('data-tab');
        if (tabId) {
          const panel = document.getElementById(tabId);
          if (panel) {
            tabContents.push(panel);
            
            // Añadir roles y atributos ARIA a paneles
            if (!panel.hasAttribute('role')) {
              panel.setAttribute('role', 'tabpanel');
            }
            
            // Asociar panel con botón
            panel.setAttribute('aria-labelledby', btn.id);
            btn.setAttribute('aria-controls', panel.id);
            
            // Establecer estado
            const isActive = btn.classList.contains('active');
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
          }
        }
      });
    });
    
    // Mejorar modales
    document.querySelectorAll('.modal').forEach(modal => {
      if (!modal.hasAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }
      
      if (!modal.hasAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }
      
      // Buscar encabezado para usar como etiqueta
      const header = modal.querySelector('.modal-header h1, .modal-header h2, .modal-header h3, .modal-header h4, .modal-header h5, .modal-header h6');
      if (header && !modal.hasAttribute('aria-labelledby') && header.id) {
        modal.setAttribute('aria-labelledby', header.id);
      } else if (header && !header.id) {
        header.id = `modal-title-${Date.now()}`;
        modal.setAttribute('aria-labelledby', header.id);
      }
      
      // Añadir descripción si hay un cuerpo de modal
      const body = modal.querySelector('.modal-body');
      if (body && !modal.hasAttribute('aria-describedby') && body.id) {
        modal.setAttribute('aria-describedby', body.id);
      } else if (body && !body.id) {
        body.id = `modal-body-${Date.now()}`;
        modal.setAttribute('aria-describedby', body.id);
      }
    });
    
    // Mejorar menús desplegables
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (toggle && menu) {
        // Añadir atributos ARIA al botón de toggle
        if (!toggle.hasAttribute('aria-haspopup')) {
          toggle.setAttribute('aria-haspopup', 'true');
        }
        
        if (!toggle.hasAttribute('aria-expanded')) {
          toggle.setAttribute('aria-expanded', 'false');
        }
        
        // Añadir role al menú
        if (!menu.hasAttribute('role')) {
          menu.setAttribute('role', 'menu');
        }
        
        // Añadir roles a elementos del menú
        menu.querySelectorAll('a, button').forEach(item => {
          if (!item.hasAttribute('role')) {
            item.setAttribute('role', 'menuitem');
          }
        });
      }
    });
    
    // Mejorar alertas
    document.querySelectorAll('.alert').forEach(alert => {
      if (!alert.hasAttribute('role')) {
        alert.setAttribute('role', 'alert');
      }
    });
    
    // Mejorar spinners y loaders
    document.querySelectorAll('.spinner, .loader').forEach(spinner => {
      if (!spinner.hasAttribute('role')) {
        spinner.setAttribute('role', 'status');
      }
      
      // Añadir texto para lectores de pantalla si no existe
      if (!spinner.querySelector('.sr-only')) {
        const srText = document.createElement('span');
        srText.className = 'sr-only';
        srText.textContent = 'Cargando...';
        spinner.appendChild(srText);
      }
    });
  },
  
  /**
   * Configura un observador de mutaciones para mejorar nuevos elementos
   * @private
   */
  _setupMutationObserver: function() {
    if (!window.MutationObserver) return;
    
    const observer = new MutationObserver(mutations => {
      let shouldEnhance = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldEnhance = true;
        }
      });
      
      if (shouldEnhance) {
        this._enhanceExistingElements();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  /**
   * Anuncia un mensaje a través de una región ARIA Live
   * @param {string} message - Mensaje a anunciar
   * @param {string} priority - Prioridad del mensaje ('polite' o 'assertive')
   */
  announce: function(message, priority = 'polite') {
    if (!message || !this.state.isInitialized) return;
    
    const region = priority === 'assertive' 
      ? this.state.ariaLiveRegions.assertive 
      : this.state.ariaLiveRegions.polite;
    
    if (!region) return;
    
    // Limpiar contenido previo
    region.textContent = '';
    
    // Usar setTimeout para asegurar que los lectores de pantalla detecten el cambio
    setTimeout(() => {
      region.textContent = message;
    }, 50);
  },
  
  /**
   * Crea una trampa de foco para un elemento modal o diálogo
   * @param {HTMLElement|string} element - Elemento o selector para la trampa de foco
   * @returns {Object} - Objeto con métodos para controlar la trampa de foco
   */
  createFocusTrap: function(element) {
    if (!this.config.focusTrap) return null;
    
    let el = element;
    
    if (typeof element === 'string') {
      el = document.querySelector(element);
    }
    
    if (!el) return null;
    
    // Guardar el elemento actualmente enfocado
    const previouslyFocused = document.activeElement;
    
    // Encontrar elementos focusables dentro del contenedor
    const focusableElements = Array.from(
      el.querySelectorAll(this.state.focusableSelectors)
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    
    // Si no hay elementos focusables, no podemos crear una trampa
    if (focusableElements.length === 0) return null;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Función para manejar el evento keydown
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      // Si presiona Shift+Tab y está en el primer elemento, ir al último
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } 
      // Si presiona Tab y está en el último elemento, ir al primero
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };
    
    // Añadir event listener
    el.addEventListener('keydown', handleKeyDown);
    
    // Enfocar el primer elemento
    setTimeout(() => {
      firstFocusable.focus();
    }, 100);
    
    // Guardar referencia a la trampa de foco actual
    this.state.currentFocusTrap = {
      element: el,
      handleKeyDown,
      previouslyFocused
    };
    
    // Devolver objeto con métodos para controlar la trampa
    return {
      activate: () => {
        el.addEventListener('keydown', handleKeyDown);
        firstFocusable.focus();
      },
      deactivate: () => {
        el.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
          previouslyFocused.focus();
        }
        if (this.state.currentFocusTrap && this.state.currentFocusTrap.element === el) {
          this.state.currentFocusTrap = null;
        }
      }
    };
  },
  
  /**
   * Desactiva la trampa de foco actual si existe
   */
  deactivateCurrentFocusTrap: function() {
    if (this.state.currentFocusTrap) {
      const { element, handleKeyDown, previouslyFocused } = this.state.currentFocusTrap;
      
      element.removeEventListener('keydown', handleKeyDown);
      
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
      
      this.state.currentFocusTrap = null;
    }
  },
  
  /**
   * Mejora un componente de tabla para hacerlo accesible
   * @param {HTMLElement|string} table - Tabla o selector de tabla
   */
  enhanceTable: function(table) {
    let tableEl = table;
    
    if (typeof table === 'string') {
      tableEl = document.querySelector(table);
    }
    
    if (!tableEl || tableEl.tagName !== 'TABLE') return;
    
    // Añadir role si no existe
    if (!tableEl.hasAttribute('role')) {
      tableEl.setAttribute('role', 'table');
    }
    
    // Añadir caption si no existe pero hay un data-title
    if (!tableEl.querySelector('caption') && tableEl.hasAttribute('data-title')) {
      const caption = document.createElement('caption');
      caption.textContent = tableEl.getAttribute('data-title');
      tableEl.prepend(caption);
    }
    
    // Mejorar encabezados
    const headers = tableEl.querySelectorAll('th');
    headers.forEach(header => {
      if (!header.hasAttribute('scope')) {
        // Determinar si es encabezado de columna o fila
        const isInThead = header.closest('thead') !== null;
        header.setAttribute('scope', isInThead ? 'col' : 'row');
      }
      
      // Generar ID si no tiene para referencias
      if (!header.id) {
        header.id = `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    });
    
    // Asociar celdas con encabezados
    const rows = tableEl.querySelectorAll('tbody tr');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      
      cells.forEach((cell, cellIndex) => {
        // Si hay encabezados de columna, asociar con ellos
        const headerRow = tableEl.querySelector('thead tr');
        if (headerRow) {
          const headers = headerRow.querySelectorAll('th');
          if (headers[cellIndex]) {
            cell.setAttribute('headers', headers[cellIndex].id);
          }
        }
        
        // Si la primera celda de la fila es un th, asociar también
        const rowHeader = row.querySelector('th');
        if (rowHeader) {
          const currentHeaders = cell.getAttribute('headers') || '';
          cell.setAttribute('headers', `${currentHeaders} ${rowHeader.id}`.trim());
        }
      });
    });
  },
  
  /**
   * Mejora un formulario para hacerlo más accesible
   * @param {HTMLElement|string} form - Formulario o selector de formulario
   */
  enhanceForm: function(form) {
    let formEl = form;
    
    if (typeof form === 'string') {
      formEl = document.querySelector(form);
    }
    
    if (!formEl || formEl.tagName !== 'FORM') return;
    
    // Mejorar campos de formulario
    const fields = formEl.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      // Asegurar que cada campo tenga un ID
      if (!field.id) {
        field.id = `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Buscar o crear etiqueta
      let label = formEl.querySelector(`label[for="${field.id}"]`);
      
      if (!label) {
        // Buscar etiqueta como padre o hermano
        const parentLabel = field.closest('label');
        if (parentLabel) {
          parentLabel.setAttribute('for', field.id);
        } else {
          // Buscar texto descriptivo cercano
          const fieldContainer = field.closest('.form-group, .field-container');
          if (fieldContainer) {
            const possibleLabel = fieldContainer.querySelector('label:not([for]), .field-label');
            if (possibleLabel) {
              possibleLabel.setAttribute('for', field.id);
            }
          }
        }
      }
      
      // Marcar campos requeridos
      if (field.required && !field.hasAttribute('aria-required')) {
        field.setAttribute('aria-required', 'true');
      }
      
      // Añadir descripciones si existen
      const helpText = field.closest('.form-group, .field-container')?.querySelector('.help-text, .form-text');
      if (helpText) {
        if (!helpText.id) {
          helpText.id = `help-${field.id}`;
        }
        field.setAttribute('aria-describedby', helpText.id);
      }
      
      // Mejorar campos de error
      if (field.classList.contains('is-invalid')) {
        field.setAttribute('aria-invalid', 'true');
        
        const errorMessage = field.closest('.form-group, .field-container')?.querySelector('.invalid-feedback, .error-message');
        if (errorMessage) {
          if (!errorMessage.id) {
            errorMessage.id = `error-${field.id}`;
          }
          
          const currentDescribedby = field.getAttribute('aria-describedby') || '';
          field.setAttribute('aria-describedby', `${currentDescribedby} ${errorMessage.id}`.trim());
        }
      }
    });
    
    // Mejorar grupos de radio y checkbox
    const fieldsets = formEl.querySelectorAll('fieldset');
    fieldsets.forEach(fieldset => {
      const legend = fieldset.querySelector('legend');
      
      if (legend) {
        // Asegurar que los inputs dentro del fieldset estén asociados con la leyenda
        const inputs = fieldset.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        
        if (!legend.id) {
          legend.id = `legend-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        inputs.forEach(input => {
          input.setAttribute('aria-describedby', legend.id);
        });
      }
    });
  },
  
  /**
   * Mejora un componente de modal para hacerlo accesible
   * @param {HTMLElement|string} modal - Modal o selector de modal
   * @returns {Object} - Objeto con métodos para controlar el modal
   */
  enhanceModal: function(modal) {
    let modalEl = modal;
    
    if (typeof modal === 'string') {
      modalEl = document.querySelector(modal);
    }
    
    if (!modalEl) return null;
    
    // Añadir atributos ARIA
    if (!modalEl.hasAttribute('role')) {
      modalEl.setAttribute('role', 'dialog');
    }
    
    if (!modalEl.hasAttribute('aria-modal')) {
      modalEl.setAttribute('aria-modal', 'true');
    }
    
    // Buscar encabezado para usar como etiqueta
    const header = modalEl.querySelector('.modal-header h1, .modal-header h2, .modal-header h3, .modal-header h4, .modal-header h5, .modal-header h6');
    if (header) {
      if (!header.id) {
        header.id = `modal-title-${Date.now()}`;
      }
      modalEl.setAttribute('aria-labelledby', header.id);
    }
    
    // Buscar cuerpo para usar como descripción
    const body = modalEl.querySelector('.modal-body');
    if (body) {
      if (!body.id) {
        body.id = `modal-body-${Date.now()}`;
      }
      modalEl.setAttribute('aria-describedby', body.id);
    }
    
    // Buscar botón de cierre
    const closeButton = modalEl.querySelector('.close-button, .modal-close, [data-dismiss="modal"]');
    if (closeButton && !closeButton.hasAttribute('aria-label')) {
      closeButton.setAttribute('aria-label', 'Cerrar');
    }
    
    // Crear trampa de foco
    const focusTrap = this.createFocusTrap(modalEl);
    
    // Devolver objeto con métodos para controlar el modal
    return {
      open: () => {
        modalEl.classList.add('active', 'show');
        modalEl.setAttribute('aria-hidden', 'false');
        
        if (focusTrap) {
          focusTrap.activate();
        }
        
        // Anunciar apertura
        this.announce(`Diálogo abierto: ${header ? header.textContent : 'Modal'}`, 'assertive');
      },
      close: () => {
        modalEl.classList.remove('active', 'show');
        modalEl.setAttribute('aria-hidden', 'true');
        
        if (focusTrap) {
          focusTrap.deactivate();
        }
        
        // Anunciar cierre
        this.announce('Diálogo cerrado', 'polite');
      }
    };
  }
};

// Exportar el objeto ScreenReaderSupport
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScreenReaderSupport;
}
