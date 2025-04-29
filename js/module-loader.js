/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Cargador de Módulos Dinámico
 * 
 * Este módulo proporciona funcionalidad para cargar scripts y módulos
 * de forma dinámica (lazy loading) sin necesidad de bundlers externos.
 */

const ModuleLoader = {
  // Registro de módulos cargados
  loadedModules: {},
  
  // Registro de módulos en proceso de carga
  loadingModules: {},
  
  // Configuración
  config: {
    basePath: '',
    moduleGroups: {
      core: [
        'js/config.js',
        'js/utils.js',
        'js/models.js'
      ],
      components: [
        'js/component-system.js',
        'js/base-components.js',
        'js/form-components.js'
      ],
      auth: [
        'js/auth.js',
        'js/user-security.js'
      ],
      storage: [
        'js/storage-manager.js',
        'js/storage-service.js',
        'js/indexeddb-crud.js'
      ],
      admin: [
        'js/admin.js'
      ],
      coordinator: [
        'js/coordinator.js'
      ],
      performance: [
        'js/ui-performance-analyzer.js',
        'js/ui-performance-metrics.js',
        'js/ui-performance-dashboard.js'
      ]
    }
  },
  
  /**
   * Inicializa el cargador de módulos
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[ModuleLoader] Inicializando cargador de módulos');
    
    // Precarga de módulos críticos si se especifica
    if (options.preloadGroups && Array.isArray(options.preloadGroups)) {
      options.preloadGroups.forEach(group => {
        this.loadModuleGroup(group);
      });
    }
    
    return this;
  },
  
  /**
   * Carga un script de forma dinámica
   * @param {string} url - URL del script a cargar
   * @returns {Promise} - Promesa que se resuelve cuando el script se carga
   */
  loadScript: function(url) {
    // Si ya está cargado, devolver promesa resuelta
    if (this.loadedModules[url]) {
      return Promise.resolve();
    }
    
    // Si está en proceso de carga, devolver la promesa existente
    if (this.loadingModules[url]) {
      return this.loadingModules[url];
    }
    
    // Crear promesa para la carga del script
    const loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      // Evento de carga exitosa
      script.onload = () => {
        this.loadedModules[url] = true;
        delete this.loadingModules[url];
        console.debug(`[ModuleLoader] Script cargado: ${url}`);
        resolve();
      };
      
      // Evento de error
      script.onerror = (error) => {
        delete this.loadingModules[url];
        console.error(`[ModuleLoader] Error al cargar script: ${url}`, error);
        reject(new Error(`Error al cargar script: ${url}`));
      };
      
      // Agregar script al documento
      document.head.appendChild(script);
    });
    
    // Registrar la promesa en módulos en carga
    this.loadingModules[url] = loadPromise;
    
    return loadPromise;
  },
  
  /**
   * Carga un grupo de módulos definido en la configuración
   * @param {string} groupName - Nombre del grupo de módulos
   * @returns {Promise} - Promesa que se resuelve cuando todos los módulos se cargan
   */
  loadModuleGroup: function(groupName) {
    if (!this.config.moduleGroups[groupName]) {
      console.warn(`[ModuleLoader] Grupo de módulos no encontrado: ${groupName}`);
      return Promise.reject(new Error(`Grupo de módulos no encontrado: ${groupName}`));
    }
    
    const moduleUrls = this.config.moduleGroups[groupName];
    const basePath = this.config.basePath || '';
    
    console.info(`[ModuleLoader] Cargando grupo de módulos: ${groupName}`);
    
    // Cargar todos los módulos del grupo en secuencia
    return moduleUrls.reduce((promise, url) => {
      return promise.then(() => this.loadScript(basePath + url));
    }, Promise.resolve());
  },
  
  /**
   * Carga un módulo específico y sus dependencias
   * @param {string} moduleName - Nombre del módulo a cargar
   * @param {Array} dependencies - Nombres de grupos de módulos dependientes (opcional)
   * @returns {Promise} - Promesa que se resuelve cuando el módulo y sus dependencias se cargan
   */
  loadModule: function(moduleName, dependencies = []) {
    console.info(`[ModuleLoader] Cargando módulo: ${moduleName}`);
    
    // Cargar dependencias primero
    const dependencyPromises = dependencies.map(dep => this.loadModuleGroup(dep));
    
    // Luego cargar el módulo principal
    return Promise.all(dependencyPromises)
      .then(() => this.loadScript(this.config.basePath + 'js/' + moduleName + '.js'))
      .catch(error => {
        console.error(`[ModuleLoader] Error al cargar módulo ${moduleName}:`, error);
        throw error;
      });
  },
  
  /**
   * Comprueba si un módulo está cargado
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean} - true si el módulo está cargado
   */
  isModuleLoaded: function(moduleName) {
    const url = this.config.basePath + 'js/' + moduleName + '.js';
    return !!this.loadedModules[url];
  },
  
  /**
   * Carga módulos bajo demanda cuando se necesitan
   * @param {string} moduleName - Nombre del módulo a cargar
   * @param {Function} callback - Función a ejecutar cuando el módulo se carga
   * @param {Array} dependencies - Nombres de grupos de módulos dependientes (opcional)
   */
  require: function(moduleName, callback, dependencies = []) {
    if (this.isModuleLoaded(moduleName)) {
      // Si ya está cargado, ejecutar callback inmediatamente
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    }
    
    // Cargar el módulo y ejecutar callback cuando termine
    return this.loadModule(moduleName, dependencies)
      .then(() => {
        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        console.error(`[ModuleLoader] Error en require para ${moduleName}:`, error);
        throw error;
      });
  }
};

// Exportar el objeto ModuleLoader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleLoader;
}
