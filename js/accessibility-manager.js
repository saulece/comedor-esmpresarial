/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Gestor de Accesibilidad
 * 
 * Este módulo integra y coordina todos los componentes de accesibilidad
 * para garantizar el cumplimiento de WCAG 2.1 AA.
 */

const AccessibilityManager = {
  // Componentes de accesibilidad
  components: {
    accessibility: null,
    screenReader: null,
    skipNavigation: null,
    darkMode: null
  },
  
  // Estado
  state: {
    isInitialized: false,
    userPreferences: {
      highContrast: false,
      textSize: 'normal',
      reduceMotion: false,
      screenReader: false,
      darkMode: false
    }
  },
  
  /**
   * Inicializa el gestor de accesibilidad
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    console.info('[AccessibilityManager] Inicializando gestor de accesibilidad');
    
    // Cargar preferencias del usuario desde localStorage
    this._loadUserPreferences();
    
    // Inicializar componentes
    this._initComponents(options);
    
    // Configurar panel de control de accesibilidad
    this._setupAccessibilityControls();
    
    // Aplicar preferencias del usuario
    this._applyUserPreferences();
    
    // Registrar evento para guardar preferencias al cerrar
    window.addEventListener('beforeunload', () => {
      this._saveUserPreferences();
    });
    
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Carga las preferencias de accesibilidad del usuario
   * @private
   */
  _loadUserPreferences: function() {
    try {
      const savedPreferences = localStorage.getItem('accessibilityPreferences');
      
      if (savedPreferences) {
        this.state.userPreferences = JSON.parse(savedPreferences);
        console.info('[AccessibilityManager] Preferencias de accesibilidad cargadas');
      }
    } catch (error) {
      console.error('[AccessibilityManager] Error al cargar preferencias:', error);
    }
  },
  
  /**
   * Guarda las preferencias de accesibilidad del usuario
   * @private
   */
  _saveUserPreferences: function() {
    try {
      localStorage.setItem('accessibilityPreferences', JSON.stringify(this.state.userPreferences));
    } catch (error) {
      console.error('[AccessibilityManager] Error al guardar preferencias:', error);
    }
  },
  
  /**
   * Inicializa los componentes de accesibilidad
   * @param {Object} options - Opciones de configuración
   * @private
   */
  _initComponents: function(options) {
    // Inicializar módulo principal de accesibilidad
    if (window.Accessibility) {
      this.components.accessibility = window.Accessibility.init({
        highContrast: this.state.userPreferences.highContrast,
        textSize: this.state.userPreferences.textSize,
        reduceMotion: this.state.userPreferences.reduceMotion
      });
    } else {
      console.warn('[AccessibilityManager] Módulo Accessibility no encontrado');
    }
    
    // Inicializar soporte para lectores de pantalla
    if (window.ScreenReaderSupport) {
      this.components.screenReader = window.ScreenReaderSupport.init({
        enabled: this.state.userPreferences.screenReader
      });
    } else {
      console.warn('[AccessibilityManager] Módulo ScreenReaderSupport no encontrado');
    }
    
    // Inicializar navegación por salto
    if (window.SkipNavigation) {
      this.components.skipNavigation = window.SkipNavigation.init();
    } else {
      console.warn('[AccessibilityManager] Módulo SkipNavigation no encontrado');
    }
    
    // Inicializar modo oscuro
    if (window.DarkMode) {
      this.components.darkMode = window.DarkMode.init();
    } else {
      console.warn('[AccessibilityManager] Módulo DarkMode no encontrado');
    }
  },
  
  /**
   * Configura el panel de control de accesibilidad
   * @private
   */
  _setupAccessibilityControls: function() {
    // Verificar si ya existe el botón de accesibilidad
    let accessibilityButton = document.getElementById('accessibility-toggle');
    
    if (!accessibilityButton) {
      // Crear botón flotante para acceder a opciones de accesibilidad
      accessibilityButton = document.createElement('button');
      accessibilityButton.id = 'accessibility-toggle';
      accessibilityButton.className = 'accessibility-toggle-button';
      accessibilityButton.innerHTML = '<span aria-hidden="true">⚙</span>';
      accessibilityButton.setAttribute('aria-label', 'Opciones de accesibilidad');
      accessibilityButton.setAttribute('title', 'Opciones de accesibilidad');
      
      document.body.appendChild(accessibilityButton);
      
      // Añadir evento para mostrar panel
      accessibilityButton.addEventListener('click', () => {
        this.showAccessibilityPanel();
      });
    }
    
    // Añadir atajo de teclado (Alt+A)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        this.showAccessibilityPanel();
      }
    });
  },
  
  /**
   * Aplica las preferencias de accesibilidad del usuario
   * @private
   */
  _applyUserPreferences: function() {
    // Aplicar alto contraste
    if (this.components.accessibility) {
      this.components.accessibility.toggleHighContrast(this.state.userPreferences.highContrast);
      this.components.accessibility.setTextSize(this.state.userPreferences.textSize);
      this.components.accessibility.toggleReduceMotion(this.state.userPreferences.reduceMotion);
    }
    
    // Aplicar modo oscuro
    if (this.components.darkMode) {
      this.components.darkMode.toggle(this.state.userPreferences.darkMode);
    }
  },
  
  /**
   * Muestra el panel de control de accesibilidad
   */
  showAccessibilityPanel: function() {
    // Crear modal con opciones de accesibilidad
    const modal = document.createElement('div');
    modal.className = 'a11y-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'accessibility-panel-title');
    
    modal.innerHTML = `
      <div class="a11y-modal-content">
        <h2 id="accessibility-panel-title">Opciones de accesibilidad</h2>
        
        <div class="a11y-option">
          <input type="checkbox" id="high-contrast-toggle" ${this.state.userPreferences.highContrast ? 'checked' : ''}>
          <label for="high-contrast-toggle">Modo de alto contraste</label>
        </div>
        
        <div class="a11y-option">
          <label for="text-size-select">Tamaño del texto:</label>
          <select id="text-size-select">
            <option value="small" ${this.state.userPreferences.textSize === 'small' ? 'selected' : ''}>Pequeño</option>
            <option value="normal" ${this.state.userPreferences.textSize === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="large" ${this.state.userPreferences.textSize === 'large' ? 'selected' : ''}>Grande</option>
            <option value="x-large" ${this.state.userPreferences.textSize === 'x-large' ? 'selected' : ''}>Extra grande</option>
          </select>
        </div>
        
        <div class="a11y-option">
          <input type="checkbox" id="reduce-motion-toggle" ${this.state.userPreferences.reduceMotion ? 'checked' : ''}>
          <label for="reduce-motion-toggle">Reducir movimiento</label>
        </div>
        
        <div class="a11y-option">
          <input type="checkbox" id="screen-reader-toggle" ${this.state.userPreferences.screenReader ? 'checked' : ''}>
          <label for="screen-reader-toggle">Optimizado para lector de pantalla</label>
        </div>
        
        <div class="a11y-option">
          <input type="checkbox" id="dark-mode-toggle" ${this.state.userPreferences.darkMode ? 'checked' : ''}>
          <label for="dark-mode-toggle">Modo oscuro</label>
        </div>
        
        <div class="a11y-actions">
          <button id="a11y-shortcuts-button" class="btn">Ver atajos de teclado</button>
          <button id="a11y-save-button" class="btn btn-primary">Guardar preferencias</button>
        </div>
        
        <button class="a11y-modal-close" aria-label="Cerrar">×</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const closeButton = modal.querySelector('.a11y-modal-close');
    const highContrastToggle = modal.querySelector('#high-contrast-toggle');
    const textSizeSelect = modal.querySelector('#text-size-select');
    const reduceMotionToggle = modal.querySelector('#reduce-motion-toggle');
    const screenReaderToggle = modal.querySelector('#screen-reader-toggle');
    const darkModeToggle = modal.querySelector('#dark-mode-toggle');
    const shortcutsButton = modal.querySelector('#a11y-shortcuts-button');
    const saveButton = modal.querySelector('#a11y-save-button');
    
    // Evento de cierre
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Cerrar con Escape
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
      }
    });
    
    // Mostrar atajos de teclado
    shortcutsButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      
      if (this.components.skipNavigation) {
        this.components.skipNavigation.showNavigationHelp();
      } else if (this.components.accessibility) {
        this.components.accessibility.showKeyboardShortcuts();
      }
    });
    
    // Guardar preferencias
    saveButton.addEventListener('click', () => {
      // Actualizar preferencias
      this.state.userPreferences.highContrast = highContrastToggle.checked;
      this.state.userPreferences.textSize = textSizeSelect.value;
      this.state.userPreferences.reduceMotion = reduceMotionToggle.checked;
      this.state.userPreferences.screenReader = screenReaderToggle.checked;
      this.state.userPreferences.darkMode = darkModeToggle.checked;
      
      // Aplicar cambios
      this._applyUserPreferences();
      
      // Guardar en localStorage
      this._saveUserPreferences();
      
      // Cerrar modal
      document.body.removeChild(modal);
      
      // Anunciar para lectores de pantalla
      if (this.components.accessibility) {
        this.components.accessibility.announce('Preferencias de accesibilidad guardadas');
      }
    });
    
    // Crear trampa de foco si está disponible ScreenReaderSupport
    if (this.components.screenReader) {
      this.components.screenReader.createFocusTrap(modal).activate();
    }
    
    // Enfocar el título
    const title = modal.querySelector('#accessibility-panel-title');
    if (title) {
      title.tabIndex = -1;
      title.focus();
    }
  },
  
  /**
   * Actualiza los componentes de accesibilidad (útil después de cambios en el DOM)
   */
  update: function() {
    if (this.components.skipNavigation) {
      this.components.skipNavigation.update();
    }
    
    return this;
  },
  
  /**
   * Anuncia un mensaje a través del lector de pantalla
   * @param {string} message - Mensaje a anunciar
   * @param {string} priority - Prioridad del mensaje ('polite' o 'assertive')
   */
  announce: function(message, priority = 'polite') {
    if (this.components.accessibility) {
      this.components.accessibility.announce(message, priority);
    } else if (this.components.screenReader) {
      this.components.screenReader.announce(message, priority);
    }
  }
};

// Exportar el objeto AccessibilityManager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}
