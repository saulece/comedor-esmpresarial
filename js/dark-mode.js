/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Modo Oscuro
 * 
 * Este módulo implementa la funcionalidad de modo oscuro/claro
 * para mejorar la accesibilidad y reducir la fatiga visual.
 */

const DarkMode = {
  // Configuración
  config: {
    enabled: false,
    autoDetect: true,
    storageKey: 'darkModePreference',
    transitionDuration: 300 // ms
  },
  
  // Estado
  state: {
    isInitialized: false,
    isDarkMode: false,
    systemPrefersDark: false,
    mediaQuery: null
  },
  
  /**
   * Inicializa el módulo de modo oscuro
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[DarkMode] Inicializando módulo de modo oscuro');
    
    // Detectar preferencia del sistema
    this._detectSystemPreference();
    
    // Cargar preferencia guardada
    this._loadSavedPreference();
    
    // Aplicar modo inicial
    this._applyCurrentMode();
    
    // Configurar observador de cambios en la preferencia del sistema
    this._setupMediaQueryListener();
    
    // Marcar como inicializado
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Detecta la preferencia del sistema (modo oscuro/claro)
   * @private
   */
  _detectSystemPreference: function() {
    // Verificar si el navegador soporta la media query prefers-color-scheme
    if (window.matchMedia) {
      this.state.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.state.systemPrefersDark = this.state.mediaQuery.matches;
      
      console.info(`[DarkMode] Preferencia del sistema: ${this.state.systemPrefersDark ? 'oscuro' : 'claro'}`);
    } else {
      console.warn('[DarkMode] El navegador no soporta la detección de preferencia de color');
      this.state.systemPrefersDark = false;
    }
  },
  
  /**
   * Configura el listener para cambios en la preferencia del sistema
   * @private
   */
  _setupMediaQueryListener: function() {
    if (this.state.mediaQuery && this.state.mediaQuery.addEventListener) {
      // Usar addEventListener (más moderno)
      this.state.mediaQuery.addEventListener('change', (e) => {
        this.state.systemPrefersDark = e.matches;
        console.info(`[DarkMode] Preferencia del sistema cambiada a: ${this.state.systemPrefersDark ? 'oscuro' : 'claro'}`);
        
        // Si está configurado para detectar automáticamente, aplicar el cambio
        if (this.config.autoDetect) {
          this._applyCurrentMode();
        }
      });
    } else if (this.state.mediaQuery && this.state.mediaQuery.addListener) {
      // Fallback para navegadores antiguos
      this.state.mediaQuery.addListener((e) => {
        this.state.systemPrefersDark = e.matches;
        
        // Si está configurado para detectar automáticamente, aplicar el cambio
        if (this.config.autoDetect) {
          this._applyCurrentMode();
        }
      });
    }
  },
  
  /**
   * Carga la preferencia guardada del usuario
   * @private
   */
  _loadSavedPreference: function() {
    try {
      const savedPreference = localStorage.getItem(this.config.storageKey);
      
      if (savedPreference !== null) {
        // Si hay una preferencia guardada, usarla
        this.state.isDarkMode = savedPreference === 'true';
        console.info(`[DarkMode] Preferencia guardada: ${this.state.isDarkMode ? 'oscuro' : 'claro'}`);
      } else if (this.config.autoDetect) {
        // Si no hay preferencia guardada y está habilitada la detección automática,
        // usar la preferencia del sistema
        this.state.isDarkMode = this.state.systemPrefersDark;
        console.info(`[DarkMode] Usando preferencia del sistema: ${this.state.isDarkMode ? 'oscuro' : 'claro'}`);
      } else {
        // Valor predeterminado si no hay preferencia guardada y no está habilitada la detección automática
        this.state.isDarkMode = this.config.enabled;
        console.info(`[DarkMode] Usando valor predeterminado: ${this.state.isDarkMode ? 'oscuro' : 'claro'}`);
      }
    } catch (error) {
      console.error('[DarkMode] Error al cargar preferencia:', error);
      this.state.isDarkMode = this.config.enabled;
    }
  },
  
  /**
   * Guarda la preferencia del usuario
   * @private
   */
  _savePreference: function() {
    try {
      localStorage.setItem(this.config.storageKey, this.state.isDarkMode);
      console.info(`[DarkMode] Preferencia guardada: ${this.state.isDarkMode ? 'oscuro' : 'claro'}`);
    } catch (error) {
      console.error('[DarkMode] Error al guardar preferencia:', error);
    }
  },
  
  /**
   * Aplica el modo actual (oscuro/claro)
   * @private
   */
  _applyCurrentMode: function() {
    if (this.state.isDarkMode) {
      this._enableDarkMode();
    } else {
      this._disableDarkMode();
    }
  },
  
  /**
   * Habilita el modo oscuro
   * @private
   */
  _enableDarkMode: function() {
    // Añadir clase al elemento raíz (html)
    document.documentElement.classList.add('dark-mode');
    
    // Actualizar meta tag theme-color para navegadores móviles
    this._updateThemeColor('#121212'); // Color de fondo del modo oscuro
    
    // Actualizar estado
    this.state.isDarkMode = true;
    
    // Disparar evento personalizado
    this._triggerEvent('darkmode:enabled');
  },
  
  /**
   * Deshabilita el modo oscuro
   * @private
   */
  _disableDarkMode: function() {
    // Quitar clase del elemento raíz (html)
    document.documentElement.classList.remove('dark-mode');
    
    // Actualizar meta tag theme-color para navegadores móviles
    this._updateThemeColor('#ffffff'); // Color de fondo del modo claro
    
    // Actualizar estado
    this.state.isDarkMode = false;
    
    // Disparar evento personalizado
    this._triggerEvent('darkmode:disabled');
  },
  
  /**
   * Actualiza el meta tag theme-color
   * @param {string} color - Color en formato hexadecimal
   * @private
   */
  _updateThemeColor: function(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = color;
  },
  
  /**
   * Dispara un evento personalizado
   * @param {string} eventName - Nombre del evento
   * @private
   */
  _triggerEvent: function(eventName) {
    const event = new CustomEvent(eventName, {
      detail: {
        isDarkMode: this.state.isDarkMode
      }
    });
    
    document.dispatchEvent(event);
  },
  
  /**
   * Activa/desactiva el modo oscuro
   * @param {boolean} [enable] - Si se proporciona, establece el modo oscuro a este valor
   * @returns {boolean} - El nuevo estado del modo oscuro
   */
  toggle: function(enable) {
    // Si se proporciona un valor, usarlo; de lo contrario, invertir el valor actual
    if (typeof enable !== 'undefined') {
      this.state.isDarkMode = enable;
    } else {
      this.state.isDarkMode = !this.state.isDarkMode;
    }
    
    // Aplicar el cambio
    this._applyCurrentMode();
    
    // Guardar preferencia
    this._savePreference();
    
    return this.state.isDarkMode;
  },
  
  /**
   * Verifica si el modo oscuro está activo
   * @returns {boolean} - true si el modo oscuro está activo
   */
  isDark: function() {
    return this.state.isDarkMode;
  },
  
  /**
   * Verifica si el sistema prefiere el modo oscuro
   * @returns {boolean} - true si el sistema prefiere el modo oscuro
   */
  systemPrefersDark: function() {
    return this.state.systemPrefersDark;
  },
  
  /**
   * Crea un botón de alternancia para el modo oscuro
   * @param {Object} options - Opciones para el botón
   * @returns {HTMLElement} - El botón creado
   */
  createToggleButton: function(options = {}) {
    const defaults = {
      container: document.body,
      position: 'fixed', // 'fixed', 'inline'
      darkIcon: '🌙', // Icono para modo oscuro
      lightIcon: '☀️', // Icono para modo claro
      ariaLabel: 'Alternar modo oscuro',
      className: 'dark-mode-toggle',
      insertPosition: 'beforeend' // 'beforebegin', 'afterbegin', 'beforeend', 'afterend'
    };
    
    const settings = {...defaults, ...options};
    
    // Crear botón
    const button = document.createElement('button');
    button.type = 'button';
    button.className = settings.className;
    button.setAttribute('aria-label', settings.ariaLabel);
    button.setAttribute('title', settings.ariaLabel);
    
    // Establecer icono inicial
    button.innerHTML = this.state.isDarkMode ? settings.darkIcon : settings.lightIcon;
    
    // Aplicar estilos según la posición
    if (settings.position === 'fixed') {
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.left = '20px';
      button.style.zIndex = '1000';
      button.style.width = '44px';
      button.style.height = '44px';
      button.style.borderRadius = '50%';
      button.style.border = 'none';
      button.style.backgroundColor = this.state.isDarkMode ? '#555' : '#f0f0f0';
      button.style.color = this.state.isDarkMode ? '#fff' : '#333';
      button.style.cursor = 'pointer';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.fontSize = '20px';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    }
    
    // Añadir evento de clic
    button.addEventListener('click', () => {
      const newState = this.toggle();
      button.innerHTML = newState ? settings.darkIcon : settings.lightIcon;
      
      if (settings.position === 'fixed') {
        button.style.backgroundColor = newState ? '#555' : '#f0f0f0';
        button.style.color = newState ? '#fff' : '#333';
      }
    });
    
    // Añadir evento para actualizar el botón cuando cambie el modo
    document.addEventListener('darkmode:enabled', () => {
      button.innerHTML = settings.darkIcon;
      if (settings.position === 'fixed') {
        button.style.backgroundColor = '#555';
        button.style.color = '#fff';
      }
    });
    
    document.addEventListener('darkmode:disabled', () => {
      button.innerHTML = settings.lightIcon;
      if (settings.position === 'fixed') {
        button.style.backgroundColor = '#f0f0f0';
        button.style.color = '#333';
      }
    });
    
    // Insertar botón en el contenedor
    settings.container.insertAdjacentElement(settings.insertPosition, button);
    
    return button;
  }
};

// Exportar el objeto DarkMode
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkMode;
}
