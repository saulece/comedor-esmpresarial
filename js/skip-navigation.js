/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Navegación por Salto
 * 
 * Este módulo implementa enlaces de salto (skip links) para mejorar
 * la navegación por teclado y cumplir con WCAG 2.1 AA.
 */

const SkipNavigation = {
  // Configuración
  config: {
    enabled: true,
    mainContentId: 'main-content',
    mainNavigationId: 'main-navigation',
    skipLinkClass: 'skip-link',
    landmarks: [
      { id: 'main-content', label: 'Contenido principal', shortcut: 'Alt+1' },
      { id: 'main-navigation', label: 'Menú principal', shortcut: 'Alt+2' },
      { id: 'confirmation-form', label: 'Formulario de confirmación', shortcut: 'Alt+3' },
      { id: 'weekly-menu', label: 'Menú semanal', shortcut: 'Alt+4' },
      { id: 'user-dashboard', label: 'Panel de usuario', shortcut: 'Alt+5' }
    ]
  },
  
  // Estado
  state: {
    isInitialized: false,
    skipLinks: [],
    keyboardShortcuts: []
  },
  
  /**
   * Inicializa el módulo de navegación por salto
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[SkipNavigation] Inicializando módulo de navegación por salto');
    
    // Crear enlaces de salto
    this._createSkipLinks();
    
    // Configurar atajos de teclado
    this._setupKeyboardShortcuts();
    
    // Verificar landmarks
    this._validateLandmarks();
    
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Crea los enlaces de salto en el DOM
   * @private
   */
  _createSkipLinks: function() {
    // Verificar si ya existe el contenedor
    let skipLinksContainer = document.getElementById('skip-links-container');
    
    if (!skipLinksContainer) {
      skipLinksContainer = document.createElement('div');
      skipLinksContainer.id = 'skip-links-container';
      skipLinksContainer.setAttribute('aria-label', 'Enlaces de salto de navegación');
      skipLinksContainer.setAttribute('role', 'navigation');
      document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    }
    
    // Limpiar enlaces existentes
    skipLinksContainer.innerHTML = '';
    this.state.skipLinks = [];
    
    // Crear enlaces para cada landmark configurado
    this.config.landmarks.forEach(landmark => {
      // Verificar si el elemento existe
      const targetElement = document.getElementById(landmark.id);
      
      if (targetElement) {
        const skipLink = document.createElement('a');
        skipLink.href = `#${landmark.id}`;
        skipLink.className = this.config.skipLinkClass;
        skipLink.textContent = `Saltar a: ${landmark.label}`;
        skipLink.setAttribute('data-shortcut', landmark.shortcut);
        
        skipLinksContainer.appendChild(skipLink);
        this.state.skipLinks.push(skipLink);
      }
    });
  },
  
  /**
   * Configura atajos de teclado para los enlaces de salto
   * @private
   */
  _setupKeyboardShortcuts: function() {
    // Limpiar atajos existentes
    this.state.keyboardShortcuts.forEach(shortcut => {
      document.removeEventListener('keydown', shortcut.handler);
    });
    
    this.state.keyboardShortcuts = [];
    
    // Configurar nuevos atajos
    this.config.landmarks.forEach((landmark, index) => {
      const shortcutKey = landmark.shortcut.split('+')[1];
      
      const handler = (event) => {
        // Verificar si es la combinación correcta (Alt + número)
        if (event.altKey && event.key === shortcutKey) {
          event.preventDefault();
          
          const targetElement = document.getElementById(landmark.id);
          if (targetElement) {
            // Enfocar el elemento
            targetElement.tabIndex = -1;
            targetElement.focus();
            
            // Anunciar para lectores de pantalla
            if (window.Accessibility) {
              window.Accessibility.announce(`Navegado a: ${landmark.label}`);
            }
            
            // Scroll al elemento
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };
      
      document.addEventListener('keydown', handler);
      
      this.state.keyboardShortcuts.push({
        key: landmark.shortcut,
        handler: handler
      });
    });
    
    // Atajo para mostrar ayuda de navegación (Alt+0)
    const helpHandler = (event) => {
      if (event.altKey && event.key === '0') {
        event.preventDefault();
        this.showNavigationHelp();
      }
    };
    
    document.addEventListener('keydown', helpHandler);
    
    this.state.keyboardShortcuts.push({
      key: 'Alt+0',
      handler: helpHandler
    });
  },
  
  /**
   * Valida que los landmarks existan y tengan los atributos ARIA correctos
   * @private
   */
  _validateLandmarks: function() {
    this.config.landmarks.forEach(landmark => {
      const element = document.getElementById(landmark.id);
      
      if (element) {
        // Verificar si tiene un role apropiado
        if (!element.hasAttribute('role')) {
          console.warn(`[SkipNavigation] El landmark ${landmark.id} no tiene un atributo role definido`);
          
          // Asignar role basado en el elemento
          if (element.tagName === 'NAV') {
            element.setAttribute('role', 'navigation');
          } else if (element.tagName === 'MAIN') {
            element.setAttribute('role', 'main');
          } else if (element.tagName === 'FORM') {
            element.setAttribute('role', 'form');
          } else if (element.tagName === 'ASIDE') {
            element.setAttribute('role', 'complementary');
          } else {
            element.setAttribute('role', 'region');
          }
        }
        
        // Verificar si tiene un aria-label
        if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
          console.warn(`[SkipNavigation] El landmark ${landmark.id} no tiene un aria-label o aria-labelledby`);
          element.setAttribute('aria-label', landmark.label);
        }
      } else {
        console.warn(`[SkipNavigation] No se encontró el landmark con ID: ${landmark.id}`);
      }
    });
  },
  
  /**
   * Actualiza los enlaces de salto (útil después de cambios en el DOM)
   */
  update: function() {
    this._createSkipLinks();
    this._validateLandmarks();
    return this;
  },
  
  /**
   * Muestra una ayuda visual con los atajos de navegación disponibles
   */
  showNavigationHelp: function() {
    // Crear modal con lista de atajos
    const shortcuts = this.config.landmarks.map(landmark => 
      `<tr><td><kbd>${landmark.shortcut}</kbd></td><td>Saltar a: ${landmark.label}</td></tr>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'a11y-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'navigation-help-title');
    
    modal.innerHTML = `
      <div class="a11y-modal-content">
        <h2 id="navigation-help-title">Atajos de navegación por teclado</h2>
        <p>Utilice los siguientes atajos para navegar rápidamente por la aplicación:</p>
        <table class="a11y-shortcuts-table">
          <thead>
            <tr>
              <th>Atajo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${shortcuts}
            <tr><td><kbd>Alt+0</kbd></td><td>Mostrar esta ayuda</td></tr>
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
    
    // Anunciar para lectores de pantalla
    if (window.Accessibility) {
      window.Accessibility.announce('Mostrando ayuda de navegación por teclado');
    }
    
    // Crear trampa de foco si está disponible ScreenReaderSupport
    if (window.ScreenReaderSupport) {
      window.ScreenReaderSupport.createFocusTrap(modal).activate();
    }
  },
  
  /**
   * Añade un nuevo landmark a la navegación
   * @param {Object} landmark - Configuración del landmark
   * @param {string} landmark.id - ID del elemento en el DOM
   * @param {string} landmark.label - Etiqueta descriptiva
   * @param {string} landmark.shortcut - Atajo de teclado (ej: 'Alt+6')
   */
  addLandmark: function(landmark) {
    if (!landmark.id || !landmark.label || !landmark.shortcut) {
      console.error('[SkipNavigation] Se requiere id, label y shortcut para añadir un landmark');
      return false;
    }
    
    // Verificar si ya existe
    const exists = this.config.landmarks.some(l => l.id === landmark.id);
    if (exists) {
      console.warn(`[SkipNavigation] Ya existe un landmark con ID: ${landmark.id}`);
      return false;
    }
    
    // Añadir a la configuración
    this.config.landmarks.push(landmark);
    
    // Actualizar enlaces y atajos
    this._createSkipLinks();
    this._setupKeyboardShortcuts();
    this._validateLandmarks();
    
    return true;
  }
};

// Exportar el objeto SkipNavigation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkipNavigation;
}
