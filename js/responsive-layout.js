/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Layout Responsivo
 * 
 * Este módulo proporciona un sistema de layout responsivo para
 * adaptar la interfaz a diferentes tamaños de pantalla.
 */

const ResponsiveLayout = {
  // Configuración por defecto
  config: {
    breakpoints: {
      xs: 0,      // Extra pequeño (móviles pequeños)
      sm: 576,    // Pequeño (móviles)
      md: 768,    // Mediano (tablets)
      lg: 992,    // Grande (desktops)
      xl: 1200    // Extra grande (desktops grandes)
    },
    containerMaxWidths: {
      sm: '540px',
      md: '720px',
      lg: '960px',
      xl: '1140px'
    },
    columns: 12,  // Sistema de rejilla de 12 columnas
    gutterWidth: 16, // Ancho del espacio entre columnas (en píxeles)
    enableAutoLayout: true, // Habilitar detección automática de layout
    mobileFirst: true, // Diseño mobile-first
    ultraCompactMode: true, // Modo ultra-compacto para móviles pequeños
    enableMediaQueries: true // Habilitar media queries dinámicas
  },
  
  // Estado del layout
  state: {
    currentBreakpoint: null,
    isUltraCompact: false,
    isMobile: false,
    isPortrait: false,
    viewportWidth: 0,
    viewportHeight: 0,
    devicePixelRatio: 1,
    layoutMode: 'normal' // 'normal', 'compact', 'ultra-compact'
  },
  
  // Elementos registrados para adaptación responsiva
  responsiveElements: [],
  
  // Callbacks registrados
  callbacks: {
    breakpointChange: [],
    modeChange: [],
    orientationChange: []
  },
  
  /**
   * Inicializa el sistema de layout responsivo
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[ResponsiveLayout] Inicializando sistema de layout responsivo');
    
    // Detectar características iniciales
    this._detectViewportSize();
    this._detectOrientation();
    this._detectDeviceType();
    this._updateLayoutMode();
    
    // Aplicar clases iniciales al documento
    this._applyLayoutClasses();
    
    // Configurar observadores
    this._setupResizeObserver();
    this._setupOrientationObserver();
    
    // Crear estilos dinámicos si están habilitados
    if (this.config.enableMediaQueries) {
      this._createDynamicStyles();
    }
    
    return this;
  },
  
  /**
   * Detecta el tamaño del viewport
   * @private
   */
  _detectViewportSize: function() {
    this.state.viewportWidth = window.innerWidth;
    this.state.viewportHeight = window.innerHeight;
    this.state.devicePixelRatio = window.devicePixelRatio || 1;
    
    // Determinar breakpoint actual
    const breakpoints = this.config.breakpoints;
    let currentBreakpoint = 'xs';
    
    if (this.state.viewportWidth >= breakpoints.xl) {
      currentBreakpoint = 'xl';
    } else if (this.state.viewportWidth >= breakpoints.lg) {
      currentBreakpoint = 'lg';
    } else if (this.state.viewportWidth >= breakpoints.md) {
      currentBreakpoint = 'md';
    } else if (this.state.viewportWidth >= breakpoints.sm) {
      currentBreakpoint = 'sm';
    }
    
    // Verificar si cambió el breakpoint
    const breakpointChanged = this.state.currentBreakpoint !== currentBreakpoint;
    this.state.currentBreakpoint = currentBreakpoint;
    
    // Notificar cambio de breakpoint
    if (breakpointChanged) {
      this._notifyBreakpointChange();
    }
  },
  
  /**
   * Detecta la orientación del dispositivo
   * @private
   */
  _detectOrientation: function() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Verificar si cambió la orientación
    const orientationChanged = this.state.isPortrait !== isPortrait;
    this.state.isPortrait = isPortrait;
    
    // Notificar cambio de orientación
    if (orientationChanged) {
      this._notifyOrientationChange();
    }
  },
  
  /**
   * Detecta el tipo de dispositivo
   * @private
   */
  _detectDeviceType: function() {
    // Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    this.state.viewportWidth <= this.config.breakpoints.md;
    
    // Detectar si está en modo ultra-compacto
    const isUltraCompact = this.state.viewportWidth <= 480;
    
    // Verificar si cambió el tipo de dispositivo
    const deviceTypeChanged = this.state.isMobile !== isMobile || this.state.isUltraCompact !== isUltraCompact;
    
    this.state.isMobile = isMobile;
    this.state.isUltraCompact = isUltraCompact;
    
    // Notificar cambio de tipo de dispositivo si es necesario
    if (deviceTypeChanged) {
      this._updateLayoutMode();
    }
  },
  
  /**
   * Actualiza el modo de layout basado en el tipo de dispositivo
   * @private
   */
  _updateLayoutMode: function() {
    let newMode = 'normal';
    
    if (this.state.isUltraCompact && this.config.ultraCompactMode) {
      newMode = 'ultra-compact';
    } else if (this.state.isMobile) {
      newMode = 'compact';
    }
    
    // Verificar si cambió el modo
    const modeChanged = this.state.layoutMode !== newMode;
    this.state.layoutMode = newMode;
    
    // Notificar cambio de modo
    if (modeChanged) {
      this._notifyModeChange();
    }
  },
  
  /**
   * Aplica clases CSS al documento según el estado actual
   * @private
   */
  _applyLayoutClasses: function() {
    const { currentBreakpoint, layoutMode, isPortrait } = this.state;
    const docElement = document.documentElement;
    
    // Limpiar clases anteriores
    docElement.classList.remove('xs', 'sm', 'md', 'lg', 'xl');
    docElement.classList.remove('normal-mode', 'compact-mode', 'ultra-compact-mode');
    docElement.classList.remove('portrait', 'landscape');
    
    // Aplicar clases de breakpoint
    docElement.classList.add(currentBreakpoint);
    
    // Aplicar clases de modo
    docElement.classList.add(`${layoutMode}-mode`);
    
    // Aplicar clases de orientación
    docElement.classList.add(isPortrait ? 'portrait' : 'landscape');
    
    // Aplicar clase mobile si corresponde
    if (this.state.isMobile) {
      docElement.classList.add('mobile');
    } else {
      docElement.classList.remove('mobile');
    }
  },
  
  /**
   * Configura el observador de cambios de tamaño
   * @private
   */
  _setupResizeObserver: function() {
    // Usar throttle para evitar demasiadas actualizaciones
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        this._detectViewportSize();
        this._detectDeviceType();
        this._applyLayoutClasses();
        this._updateResponsiveElements();
      }, 100);
    });
  },
  
  /**
   * Configura el observador de cambios de orientación
   * @private
   */
  _setupOrientationObserver: function() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this._detectViewportSize();
        this._detectOrientation();
        this._detectDeviceType();
        this._applyLayoutClasses();
        this._updateResponsiveElements();
      }, 100);
    });
  },
  
  /**
   * Crea estilos CSS dinámicos para el sistema de rejilla
   * @private
   */
  _createDynamicStyles: function() {
    // Verificar si ya existe el elemento de estilos
    let styleEl = document.getElementById('responsive-layout-styles');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'responsive-layout-styles';
      document.head.appendChild(styleEl);
    }
    
    // Generar CSS para el sistema de rejilla
    const { columns, gutterWidth, breakpoints, containerMaxWidths } = this.config;
    let css = '';
    
    // Estilos para contenedores
    css += `
      .container {
        width: 100%;
        padding-right: ${gutterWidth / 2}px;
        padding-left: ${gutterWidth / 2}px;
        margin-right: auto;
        margin-left: auto;
      }
      
      .container-fluid {
        width: 100%;
        padding-right: ${gutterWidth / 2}px;
        padding-left: ${gutterWidth / 2}px;
        margin-right: auto;
        margin-left: auto;
      }
      
      .row {
        display: flex;
        flex-wrap: wrap;
        margin-right: -${gutterWidth / 2}px;
        margin-left: -${gutterWidth / 2}px;
      }
      
      .no-gutters {
        margin-right: 0;
        margin-left: 0;
      }
      
      .no-gutters > .col,
      .no-gutters > [class*="col-"] {
        padding-right: 0;
        padding-left: 0;
      }
    `;
    
    // Estilos para columnas
    css += `
      .col, .col-auto, [class*="col-"] {
        position: relative;
        width: 100%;
        padding-right: ${gutterWidth / 2}px;
        padding-left: ${gutterWidth / 2}px;
      }
      
      .col {
        flex-basis: 0;
        flex-grow: 1;
        max-width: 100%;
      }
      
      .col-auto {
        flex: 0 0 auto;
        width: auto;
        max-width: 100%;
      }
    `;
    
    // Generar clases para cada breakpoint
    const breakpointNames = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    breakpointNames.forEach(bp => {
      // Ancho máximo del contenedor para este breakpoint
      if (containerMaxWidths[bp]) {
        css += `
          @media (min-width: ${breakpoints[bp]}px) {
            .container {
              max-width: ${containerMaxWidths[bp]};
            }
          }
        `;
      }
      
      // Solo generar media queries para breakpoints mayores que xs
      const mediaQuery = bp === 'xs' ? '' : `@media (min-width: ${breakpoints[bp]}px) {`;
      const mediaQueryEnd = bp === 'xs' ? '' : `}`;
      
      css += mediaQuery;
      
      // Generar clases de columnas
      for (let i = 1; i <= columns; i++) {
        const width = (i / columns) * 100;
        
        css += `
          .col-${bp}-${i} {
            flex: 0 0 ${width}%;
            max-width: ${width}%;
          }
        `;
      }
      
      // Clases de offset
      for (let i = 0; i < columns; i++) {
        const margin = (i / columns) * 100;
        
        css += `
          .offset-${bp}-${i} {
            margin-left: ${margin}%;
          }
        `;
      }
      
      // Clases de orden
      css += `
        .order-${bp}-first {
          order: -1;
        }
        
        .order-${bp}-last {
          order: ${columns + 1};
        }
      `;
      
      for (let i = 0; i <= columns; i++) {
        css += `
          .order-${bp}-${i} {
            order: ${i};
          }
        `;
      }
      
      // Clases de visibilidad
      css += `
        .d-${bp}-none {
          display: none !important;
        }
        
        .d-${bp}-inline {
          display: inline !important;
        }
        
        .d-${bp}-inline-block {
          display: inline-block !important;
        }
        
        .d-${bp}-block {
          display: block !important;
        }
        
        .d-${bp}-flex {
          display: flex !important;
        }
        
        .d-${bp}-inline-flex {
          display: inline-flex !important;
        }
      `;
      
      // Clases de alineación para flex
      css += `
        .justify-content-${bp}-start {
          justify-content: flex-start !important;
        }
        
        .justify-content-${bp}-end {
          justify-content: flex-end !important;
        }
        
        .justify-content-${bp}-center {
          justify-content: center !important;
        }
        
        .justify-content-${bp}-between {
          justify-content: space-between !important;
        }
        
        .justify-content-${bp}-around {
          justify-content: space-around !important;
        }
        
        .align-items-${bp}-start {
          align-items: flex-start !important;
        }
        
        .align-items-${bp}-end {
          align-items: flex-end !important;
        }
        
        .align-items-${bp}-center {
          align-items: center !important;
        }
        
        .align-items-${bp}-baseline {
          align-items: baseline !important;
        }
        
        .align-items-${bp}-stretch {
          align-items: stretch !important;
        }
      `;
      
      css += mediaQueryEnd;
    });
    
    // Estilos específicos para modo ultra-compacto
    css += `
      @media (max-width: 480px) {
        .ultra-compact-mode .compact-hide {
          display: none !important;
        }
        
        .ultra-compact-mode .compact-row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -${gutterWidth / 4}px;
          margin-left: -${gutterWidth / 4}px;
        }
        
        .ultra-compact-mode .compact-row > [class*="col-"] {
          padding-right: ${gutterWidth / 4}px;
          padding-left: ${gutterWidth / 4}px;
        }
        
        .ultra-compact-mode .compact-spacing {
          margin: 4px !important;
          padding: 4px !important;
        }
        
        .ultra-compact-mode .compact-text {
          font-size: 13px !important;
        }
        
        .ultra-compact-mode .compact-heading {
          font-size: 16px !important;
          margin-bottom: 8px !important;
        }
      }
    `;
    
    // Aplicar estilos
    styleEl.textContent = css;
  },
  
  /**
   * Notifica a los callbacks registrados sobre cambios de breakpoint
   * @private
   */
  _notifyBreakpointChange: function() {
    this.callbacks.breakpointChange.forEach(callback => {
      try {
        callback(this.state.currentBreakpoint, this.state);
      } catch (error) {
        console.error('[ResponsiveLayout] Error en callback de cambio de breakpoint:', error);
      }
    });
  },
  
  /**
   * Notifica a los callbacks registrados sobre cambios de modo
   * @private
   */
  _notifyModeChange: function() {
    this.callbacks.modeChange.forEach(callback => {
      try {
        callback(this.state.layoutMode, this.state);
      } catch (error) {
        console.error('[ResponsiveLayout] Error en callback de cambio de modo:', error);
      }
    });
  },
  
  /**
   * Notifica a los callbacks registrados sobre cambios de orientación
   * @private
   */
  _notifyOrientationChange: function() {
    this.callbacks.orientationChange.forEach(callback => {
      try {
        callback(this.state.isPortrait ? 'portrait' : 'landscape', this.state);
      } catch (error) {
        console.error('[ResponsiveLayout] Error en callback de cambio de orientación:', error);
      }
    });
  },
  
  /**
   * Actualiza todos los elementos responsivos registrados
   * @private
   */
  _updateResponsiveElements: function() {
    this.responsiveElements.forEach(element => {
      if (element.updateLayout && typeof element.updateLayout === 'function') {
        try {
          element.updateLayout(this.state);
        } catch (error) {
          console.error('[ResponsiveLayout] Error al actualizar elemento responsivo:', error);
        }
      }
    });
  },
  
  /**
   * Registra un callback para cambios de breakpoint
   * @param {Function} callback - Función a llamar cuando cambia el breakpoint
   * @returns {Function} - Función para cancelar el registro
   */
  onBreakpointChange: function(callback) {
    if (typeof callback === 'function') {
      this.callbacks.breakpointChange.push(callback);
      
      // Llamar inmediatamente con el estado actual
      callback(this.state.currentBreakpoint, this.state);
      
      // Devolver función para cancelar registro
      return () => {
        const index = this.callbacks.breakpointChange.indexOf(callback);
        if (index !== -1) {
          this.callbacks.breakpointChange.splice(index, 1);
        }
      };
    }
  },
  
  /**
   * Registra un callback para cambios de modo
   * @param {Function} callback - Función a llamar cuando cambia el modo
   * @returns {Function} - Función para cancelar el registro
   */
  onModeChange: function(callback) {
    if (typeof callback === 'function') {
      this.callbacks.modeChange.push(callback);
      
      // Llamar inmediatamente con el estado actual
      callback(this.state.layoutMode, this.state);
      
      // Devolver función para cancelar registro
      return () => {
        const index = this.callbacks.modeChange.indexOf(callback);
        if (index !== -1) {
          this.callbacks.modeChange.splice(index, 1);
        }
      };
    }
  },
  
  /**
   * Registra un callback para cambios de orientación
   * @param {Function} callback - Función a llamar cuando cambia la orientación
   * @returns {Function} - Función para cancelar el registro
   */
  onOrientationChange: function(callback) {
    if (typeof callback === 'function') {
      this.callbacks.orientationChange.push(callback);
      
      // Llamar inmediatamente con el estado actual
      callback(this.state.isPortrait ? 'portrait' : 'landscape', this.state);
      
      // Devolver función para cancelar registro
      return () => {
        const index = this.callbacks.orientationChange.indexOf(callback);
        if (index !== -1) {
          this.callbacks.orientationChange.splice(index, 1);
        }
      };
    }
  },
  
  /**
   * Registra un elemento para actualizaciones responsivas
   * @param {Object} element - Elemento a registrar (debe tener método updateLayout)
   * @returns {Function} - Función para cancelar el registro
   */
  registerResponsiveElement: function(element) {
    if (element && typeof element.updateLayout === 'function') {
      this.responsiveElements.push(element);
      
      // Actualizar inmediatamente con el estado actual
      element.updateLayout(this.state);
      
      // Devolver función para cancelar registro
      return () => {
        const index = this.responsiveElements.indexOf(element);
        if (index !== -1) {
          this.responsiveElements.splice(index, 1);
        }
      };
    }
  },
  
  /**
   * Crea un componente de contenedor responsivo
   * @param {Object} options - Opciones del contenedor
   * @returns {HTMLElement} - Elemento contenedor
   */
  createContainer: function(options = {}) {
    const {
      fluid = false,
      className = '',
      id = '',
      content = ''
    } = options;
    
    const container = document.createElement('div');
    container.className = fluid ? 'container-fluid' : 'container';
    
    if (className) {
      container.className += ` ${className}`;
    }
    
    if (id) {
      container.id = id;
    }
    
    if (content) {
      if (typeof content === 'string') {
        container.innerHTML = content;
      } else if (content instanceof Node) {
        container.appendChild(content);
      }
    }
    
    return container;
  },
  
  /**
   * Crea un componente de fila responsiva
   * @param {Object} options - Opciones de la fila
   * @returns {HTMLElement} - Elemento fila
   */
  createRow: function(options = {}) {
    const {
      noGutters = false,
      className = '',
      id = '',
      columns = []
    } = options;
    
    const row = document.createElement('div');
    row.className = 'row';
    
    if (noGutters) {
      row.className += ' no-gutters';
    }
    
    if (className) {
      row.className += ` ${className}`;
    }
    
    if (id) {
      row.id = id;
    }
    
    // Añadir columnas si se proporcionan
    if (columns && Array.isArray(columns)) {
      columns.forEach(column => {
        if (column instanceof Node) {
          row.appendChild(column);
        }
      });
    }
    
    return row;
  },
  
  /**
   * Crea un componente de columna responsiva
   * @param {Object} options - Opciones de la columna
   * @returns {HTMLElement} - Elemento columna
   */
  createColumn: function(options = {}) {
    const {
      xs, sm, md, lg, xl,
      offset = {},
      order = {},
      className = '',
      id = '',
      content = ''
    } = options;
    
    const column = document.createElement('div');
    let classes = [];
    
    // Añadir clases de tamaño
    if (xs) classes.push(`col-xs-${xs}`);
    if (sm) classes.push(`col-sm-${sm}`);
    if (md) classes.push(`col-md-${md}`);
    if (lg) classes.push(`col-lg-${lg}`);
    if (xl) classes.push(`col-xl-${xl}`);
    
    // Si no se especifica ningún tamaño, usar columna automática
    if (!xs && !sm && !md && !lg && !xl) {
      classes.push('col');
    }
    
    // Añadir clases de offset
    if (offset.xs) classes.push(`offset-xs-${offset.xs}`);
    if (offset.sm) classes.push(`offset-sm-${offset.sm}`);
    if (offset.md) classes.push(`offset-md-${offset.md}`);
    if (offset.lg) classes.push(`offset-lg-${offset.lg}`);
    if (offset.xl) classes.push(`offset-xl-${offset.xl}`);
    
    // Añadir clases de orden
    if (order.xs) classes.push(`order-xs-${order.xs}`);
    if (order.sm) classes.push(`order-sm-${order.sm}`);
    if (order.md) classes.push(`order-md-${order.md}`);
    if (order.lg) classes.push(`order-lg-${order.lg}`);
    if (order.xl) classes.push(`order-xl-${order.xl}`);
    
    // Añadir clase personalizada
    if (className) {
      classes.push(className);
    }
    
    column.className = classes.join(' ');
    
    if (id) {
      column.id = id;
    }
    
    // Añadir contenido
    if (content) {
      if (typeof content === 'string') {
        column.innerHTML = content;
      } else if (content instanceof Node) {
        column.appendChild(content);
      }
    }
    
    return column;
  },
  
  /**
   * Obtiene el estado actual del layout
   * @returns {Object} - Estado actual del layout
   */
  getState: function() {
    return {...this.state};
  },
  
  /**
   * Verifica si la pantalla actual coincide con un breakpoint específico
   * @param {string} breakpoint - Breakpoint a verificar ('xs', 'sm', 'md', 'lg', 'xl')
   * @returns {boolean} - true si coincide con el breakpoint
   */
  isBreakpoint: function(breakpoint) {
    return this.state.currentBreakpoint === breakpoint;
  },
  
  /**
   * Verifica si la pantalla actual es menor o igual a un breakpoint específico
   * @param {string} breakpoint - Breakpoint a verificar ('xs', 'sm', 'md', 'lg', 'xl')
   * @returns {boolean} - true si es menor o igual al breakpoint
   */
  isDown: function(breakpoint) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpoints.indexOf(this.state.currentBreakpoint);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex <= targetIndex;
  },
  
  /**
   * Verifica si la pantalla actual es mayor o igual a un breakpoint específico
   * @param {string} breakpoint - Breakpoint a verificar ('xs', 'sm', 'md', 'lg', 'xl')
   * @returns {boolean} - true si es mayor o igual al breakpoint
   */
  isUp: function(breakpoint) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpoints.indexOf(this.state.currentBreakpoint);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex >= targetIndex;
  },
  
  /**
   * Verifica si la pantalla actual está en modo móvil
   * @returns {boolean} - true si está en modo móvil
   */
  isMobile: function() {
    return this.state.isMobile;
  },
  
  /**
   * Verifica si la pantalla actual está en modo ultra-compacto
   * @returns {boolean} - true si está en modo ultra-compacto
   */
  isUltraCompact: function() {
    return this.state.isUltraCompact;
  },
  
  /**
   * Verifica si la pantalla actual está en orientación vertical
   * @returns {boolean} - true si está en orientación vertical
   */
  isPortrait: function() {
    return this.state.isPortrait;
  },
  
  /**
   * Verifica si la pantalla actual está en orientación horizontal
   * @returns {boolean} - true si está en orientación horizontal
   */
  isLandscape: function() {
    return !this.state.isPortrait;
  }
};

// Exportar el objeto ResponsiveLayout
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveLayout;
}
