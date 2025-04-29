/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Divisor de Código y Carga Bajo Demanda
 * 
 * Este módulo implementa la división de código (code splitting) y carga
 * bajo demanda (lazy loading) sin dependencias externas.
 */

const CodeSplitter = {
  // Configuración
  config: {
    // Rutas y módulos asociados
    routes: {
      'admin': ['admin', 'export-import'],
      'coordinator': ['coordinator'],
      'login': ['auth']
    },
    
    // Módulos críticos que siempre se cargan
    criticalModules: ['core', 'components'],
    
    // Módulos que se cargan bajo demanda según la acción
    onDemandModules: {
      'exportData': ['export-import'],
      'importData': ['export-import'],
      'showReports': ['reports'],
      'showPerformance': ['performance']
    }
  },
  
  /**
   * Inicializa el divisor de código
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[CodeSplitter] Inicializando sistema de división de código');
    
    // Verificar que el cargador de módulos esté disponible
    if (typeof ModuleLoader === 'undefined') {
      console.error('[CodeSplitter] ModuleLoader no está disponible');
      return;
    }
    
    // Cargar módulos críticos inmediatamente
    this._loadCriticalModules();
    
    // Configurar carga bajo demanda según la ruta actual
    this._setupRouteBasedLoading();
    
    return this;
  },
  
  /**
   * Carga los módulos críticos que siempre se necesitan
   * @private
   */
  _loadCriticalModules: function() {
    if (!this.config.criticalModules || !Array.isArray(this.config.criticalModules)) {
      return;
    }
    
    console.info('[CodeSplitter] Cargando módulos críticos');
    
    // Cargar cada grupo de módulos críticos
    this.config.criticalModules.forEach(groupName => {
      ModuleLoader.loadModuleGroup(groupName)
        .catch(error => {
          console.error(`[CodeSplitter] Error al cargar grupo crítico ${groupName}:`, error);
        });
    });
  },
  
  /**
   * Configura la carga de módulos basada en la ruta actual
   * @private
   */
  _setupRouteBasedLoading: function() {
    // Determinar la ruta actual basada en el hash o en el rol del usuario
    const currentRoute = this._determineCurrentRoute();
    
    if (currentRoute && this.config.routes[currentRoute]) {
      console.info(`[CodeSplitter] Cargando módulos para ruta: ${currentRoute}`);
      
      // Cargar módulos asociados a la ruta
      const moduleGroups = this.config.routes[currentRoute];
      
      moduleGroups.forEach(groupName => {
        ModuleLoader.loadModuleGroup(groupName)
          .catch(error => {
            console.error(`[CodeSplitter] Error al cargar grupo ${groupName} para ruta ${currentRoute}:`, error);
          });
      });
    }
    
    // Configurar listener para cambios de hash (SPA navigation)
    window.addEventListener('hashchange', () => {
      const newRoute = this._determineCurrentRoute();
      
      if (newRoute && this.config.routes[newRoute]) {
        console.info(`[CodeSplitter] Cambio de ruta detectado: ${newRoute}`);
        
        // Cargar módulos para la nueva ruta
        const moduleGroups = this.config.routes[newRoute];
        
        moduleGroups.forEach(groupName => {
          ModuleLoader.loadModuleGroup(groupName)
            .catch(error => {
              console.error(`[CodeSplitter] Error al cargar grupo ${groupName} para ruta ${newRoute}:`, error);
            });
        });
      }
    });
  },
  
  /**
   * Determina la ruta actual basada en el hash o el rol del usuario
   * @returns {string|null} - Nombre de la ruta actual o null
   * @private
   */
  _determineCurrentRoute: function() {
    // Primero intentar determinar por hash
    const hash = window.location.hash.substring(1);
    
    if (hash) {
      // Simplificar hash para coincidir con las rutas configuradas
      for (const route in this.config.routes) {
        if (hash.startsWith(route)) {
          return route;
        }
      }
    }
    
    // Si no hay hash o no coincide, intentar determinar por el rol del usuario actual
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
      const currentUser = Auth.getCurrentUser();
      
      if (currentUser) {
        if (currentUser.role === 'admin') {
          return 'admin';
        } else if (currentUser.role === 'coordinator') {
          return 'coordinator';
        }
      } else {
        return 'login';
      }
    }
    
    return null;
  },
  
  /**
   * Carga módulos bajo demanda para una acción específica
   * @param {string} action - Nombre de la acción
   * @returns {Promise} - Promesa que se resuelve cuando los módulos se cargan
   */
  loadModulesForAction: function(action) {
    if (!this.config.onDemandModules[action]) {
      return Promise.resolve();
    }
    
    console.info(`[CodeSplitter] Cargando módulos para acción: ${action}`);
    
    const moduleGroups = this.config.onDemandModules[action];
    const loadPromises = moduleGroups.map(groupName => {
      return ModuleLoader.loadModuleGroup(groupName);
    });
    
    return Promise.all(loadPromises);
  },
  
  /**
   * Registra una función para ejecutar cuando se carguen ciertos módulos
   * @param {string} action - Nombre de la acción
   * @param {Function} callback - Función a ejecutar cuando los módulos estén cargados
   */
  whenModulesLoaded: function(action, callback) {
    this.loadModulesForAction(action)
      .then(() => {
        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        console.error(`[CodeSplitter] Error al cargar módulos para acción ${action}:`, error);
      });
  },
  
  /**
   * Precarga módulos en segundo plano durante el tiempo de inactividad
   * @param {Array} moduleGroups - Grupos de módulos a precargar
   */
  preloadInBackground: function(moduleGroups) {
    if (!moduleGroups || !Array.isArray(moduleGroups)) {
      return;
    }
    
    // Usar requestIdleCallback si está disponible, o setTimeout como fallback
    const schedulePreload = window.requestIdleCallback || 
      function(callback) {
        setTimeout(callback, 1000);
      };
    
    schedulePreload(() => {
      console.info('[CodeSplitter] Precargando módulos en segundo plano');
      
      moduleGroups.forEach(groupName => {
        ModuleLoader.loadModuleGroup(groupName)
          .catch(error => {
            console.error(`[CodeSplitter] Error al precargar grupo ${groupName}:`, error);
          });
      });
    });
  }
};

// Exportar el objeto CodeSplitter
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeSplitter;
}
