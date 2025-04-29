/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Analizador de rendimiento de UI
 * 
 * Este módulo proporciona herramientas para analizar y monitorear el rendimiento
 * de la interfaz de usuario, establecer métricas y detectar problemas.
 */

const UIPerformanceAnalyzer = {
  // Configuración del analizador
  config: {
    enabled: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    sampleSize: 5,    // Número de muestras para promediar
    metrics: {
      renderTime: true,
      domSize: true,
      memoryUsage: true,
      eventListeners: true,
      reflows: true
    }
  },
  
  // Almacenamiento de métricas
  metrics: {
    renderTimes: {},
    domSizes: {},
    memoryUsage: [],
    eventListeners: {},
    reflows: 0,
    interactionDelays: []
  },
  
  /**
   * Inicializa el analizador de rendimiento
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    this.log('info', 'Inicializando analizador de rendimiento de UI');
    
    // Iniciar monitoreo automático si está habilitado
    if (this.config.enabled) {
      this.startMonitoring();
    }
    
    return this;
  },
  
  /**
   * Inicia el monitoreo continuo del rendimiento
   */
  startMonitoring: function() {
    this.log('info', 'Iniciando monitoreo de rendimiento');
    
    // Monitorear tamaño del DOM
    if (this.config.metrics.domSize) {
      this.measureDOMSize();
      setInterval(() => this.measureDOMSize(), 5000);
    }
    
    // Monitorear uso de memoria
    if (this.config.metrics.memoryUsage && window.performance && window.performance.memory) {
      this.measureMemoryUsage();
      setInterval(() => this.measureMemoryUsage(), 10000);
    }
    
    // Monitorear reflows
    if (this.config.metrics.reflows) {
      this.setupReflowDetection();
    }
    
    // Monitorear delays de interacción
    this.setupInteractionDelayMonitoring();
    
    return this;
  },
  
  /**
   * Mide el tiempo de renderizado de un componente o sección
   * @param {string} componentId - Identificador del componente o sección
   * @param {Function} renderFunction - Función que realiza el renderizado
   * @returns {number} - Tiempo de renderizado en milisegundos
   */
  measureRenderTime: function(componentId, renderFunction) {
    if (!this.config.enabled || !this.config.metrics.renderTime) {
      return renderFunction();
    }
    
    this.log('debug', `Midiendo tiempo de renderizado para: ${componentId}`);
    
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    const renderTime = end - start;
    
    // Almacenar métrica
    if (!this.metrics.renderTimes[componentId]) {
      this.metrics.renderTimes[componentId] = [];
    }
    
    this.metrics.renderTimes[componentId].push(renderTime);
    
    // Mantener solo las últimas N muestras
    if (this.metrics.renderTimes[componentId].length > this.config.sampleSize) {
      this.metrics.renderTimes[componentId].shift();
    }
    
    this.log('debug', `Tiempo de renderizado para ${componentId}: ${renderTime.toFixed(2)}ms`);
    
    return result;
  },
  
  /**
   * Mide el tamaño actual del DOM
   * @returns {Object} - Métricas del tamaño del DOM
   */
  measureDOMSize: function() {
    if (!this.config.enabled || !this.config.metrics.domSize) {
      return null;
    }
    
    const elements = document.querySelectorAll('*');
    const totalElements = elements.length;
    
    // Contar por tipo de elemento
    const elementCounts = {};
    elements.forEach(el => {
      const tagName = el.tagName.toLowerCase();
      elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;
    });
    
    // Contar elementos anidados profundamente
    const deeplyNested = Array.from(elements).filter(el => {
      let depth = 0;
      let parent = el;
      while (parent && depth < 20) {
        parent = parent.parentElement;
        depth++;
      }
      return depth >= 10; // Elementos con profundidad >= 10 se consideran muy anidados
    }).length;
    
    const domMetrics = {
      totalElements,
      elementCounts,
      deeplyNested,
      timestamp: Date.now()
    };
    
    // Almacenar métrica
    this.metrics.domSizes = domMetrics;
    
    this.log('debug', `Tamaño del DOM: ${totalElements} elementos, ${deeplyNested} muy anidados`);
    
    return domMetrics;
  },
  
  /**
   * Mide el uso actual de memoria
   * @returns {Object|null} - Métricas de uso de memoria o null si no está disponible
   */
  measureMemoryUsage: function() {
    if (!this.config.enabled || !this.config.metrics.memoryUsage || !window.performance || !window.performance.memory) {
      return null;
    }
    
    const memory = window.performance.memory;
    const memoryMetrics = {
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };
    
    // Almacenar métrica
    this.metrics.memoryUsage.push(memoryMetrics);
    
    // Mantener solo las últimas N muestras
    if (this.metrics.memoryUsage.length > this.config.sampleSize) {
      this.metrics.memoryUsage.shift();
    }
    
    this.log('debug', `Uso de memoria: ${(memoryMetrics.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memoryMetrics.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
    
    return memoryMetrics;
  },
  
  /**
   * Configura la detección de reflows
   */
  setupReflowDetection: function() {
    if (!this.config.enabled || !this.config.metrics.reflows) {
      return;
    }
    
    // Contador de reflows
    let reflowCount = 0;
    
    // Crear un elemento para detectar reflows
    const detector = document.createElement('div');
    detector.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(detector);
    
    // Función para detectar reflows
    const detectReflow = () => {
      // Forzar reflow
      void detector.offsetWidth;
      reflowCount++;
      this.metrics.reflows = reflowCount;
    };
    
    // Monitorear eventos que pueden causar reflows
    const events = ['resize', 'scroll', 'mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove'];
    events.forEach(event => {
      window.addEventListener(event, () => {
        requestAnimationFrame(detectReflow);
      }, { passive: true });
    });
    
    this.log('info', 'Detección de reflows configurada');
  },
  
  /**
   * Configura el monitoreo de delays en interacciones
   */
  setupInteractionDelayMonitoring: function() {
    if (!this.config.enabled) {
      return;
    }
    
    // Monitorear clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      const startTime = performance.now();
      
      // Detectar la próxima actualización visual
      requestAnimationFrame(() => {
        const delay = performance.now() - startTime;
        
        // Almacenar métrica si el delay es significativo (> 16ms, lo que equivale a un frame a 60fps)
        if (delay > 16) {
          this.metrics.interactionDelays.push({
            type: 'click',
            target: target.tagName + (target.id ? `#${target.id}` : ''),
            delay,
            timestamp: Date.now()
          });
          
          // Mantener solo las últimas N muestras
          if (this.metrics.interactionDelays.length > 20) {
            this.metrics.interactionDelays.shift();
          }
          
          this.log('debug', `Delay de interacción (click): ${delay.toFixed(2)}ms`);
        }
      });
    }, { passive: true });
    
    // Monitorear inputs
    document.addEventListener('input', (e) => {
      const target = e.target;
      const startTime = performance.now();
      
      // Detectar la próxima actualización visual
      requestAnimationFrame(() => {
        const delay = performance.now() - startTime;
        
        // Almacenar métrica si el delay es significativo
        if (delay > 16) {
          this.metrics.interactionDelays.push({
            type: 'input',
            target: target.tagName + (target.id ? `#${target.id}` : ''),
            delay,
            timestamp: Date.now()
          });
          
          // Mantener solo las últimas N muestras
          if (this.metrics.interactionDelays.length > 20) {
            this.metrics.interactionDelays.shift();
          }
          
          this.log('debug', `Delay de interacción (input): ${delay.toFixed(2)}ms`);
        }
      });
    }, { passive: true });
    
    this.log('info', 'Monitoreo de delays de interacción configurado');
  },
  
  /**
   * Cuenta los event listeners en el DOM
   * @returns {Object} - Conteo de event listeners por tipo
   */
  countEventListeners: function() {
    if (!this.config.enabled || !this.config.metrics.eventListeners) {
      return null;
    }
    
    // Esta es una aproximación, ya que no hay una forma directa de contar todos los event listeners
    const elements = document.querySelectorAll('*');
    const listenerTypes = ['click', 'input', 'change', 'keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchmove', 'touchend'];
    
    // Contar elementos con atributos on*
    const attributeListeners = {};
    listenerTypes.forEach(type => {
      const selector = `[on${type}]`;
      attributeListeners[type] = document.querySelectorAll(selector).length;
    });
    
    // Almacenar métrica
    this.metrics.eventListeners = attributeListeners;
    
    this.log('debug', `Event listeners detectados: ${JSON.stringify(attributeListeners)}`);
    
    return attributeListeners;
  },
  
  /**
   * Genera un informe completo de rendimiento
   * @returns {Object} - Informe de rendimiento
   */
  generateReport: function() {
    if (!this.config.enabled) {
      return { enabled: false };
    }
    
    // Calcular promedios de tiempos de renderizado
    const renderTimeAverages = {};
    Object.keys(this.metrics.renderTimes).forEach(componentId => {
      const times = this.metrics.renderTimes[componentId];
      if (times.length > 0) {
        const sum = times.reduce((acc, time) => acc + time, 0);
        renderTimeAverages[componentId] = sum / times.length;
      }
    });
    
    // Calcular promedio de uso de memoria
    let avgMemoryUsage = null;
    if (this.metrics.memoryUsage.length > 0) {
      const sum = this.metrics.memoryUsage.reduce((acc, m) => acc + m.usedJSHeapSize, 0);
      avgMemoryUsage = sum / this.metrics.memoryUsage.length;
    }
    
    // Identificar componentes lentos
    const slowComponents = Object.keys(renderTimeAverages)
      .filter(id => renderTimeAverages[id] > 50) // Componentes que tardan más de 50ms en renderizar
      .map(id => ({
        id,
        avgRenderTime: renderTimeAverages[id]
      }))
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime);
    
    // Identificar interacciones lentas
    const slowInteractions = this.metrics.interactionDelays
      .filter(d => d.delay > 100) // Interacciones con delay mayor a 100ms
      .sort((a, b) => b.delay - a.delay);
    
    // Generar recomendaciones
    const recommendations = [];
    
    if (slowComponents.length > 0) {
      recommendations.push({
        type: 'renderTime',
        message: `Optimizar los componentes lentos: ${slowComponents.map(c => c.id).join(', ')}`,
        severity: 'high'
      });
    }
    
    if (this.metrics.domSizes && this.metrics.domSizes.totalElements > 1000) {
      recommendations.push({
        type: 'domSize',
        message: 'Reducir el tamaño del DOM, hay demasiados elementos',
        severity: 'medium'
      });
    }
    
    if (this.metrics.domSizes && this.metrics.domSizes.deeplyNested > 50) {
      recommendations.push({
        type: 'domNesting',
        message: 'Reducir la profundidad de anidación del DOM',
        severity: 'medium'
      });
    }
    
    if (avgMemoryUsage && avgMemoryUsage > 50 * 1024 * 1024) { // Más de 50MB
      recommendations.push({
        type: 'memoryUsage',
        message: 'Optimizar el uso de memoria',
        severity: 'high'
      });
    }
    
    if (this.metrics.reflows > 100) {
      recommendations.push({
        type: 'reflows',
        message: 'Reducir el número de reflows, considerar usar CSS transforms y opacity',
        severity: 'high'
      });
    }
    
    if (slowInteractions.length > 0) {
      recommendations.push({
        type: 'interactionDelay',
        message: 'Mejorar la respuesta a interacciones del usuario',
        severity: 'high'
      });
    }
    
    // Generar informe completo
    return {
      timestamp: Date.now(),
      enabled: this.config.enabled,
      summary: {
        domSize: this.metrics.domSizes ? this.metrics.domSizes.totalElements : null,
        deeplyNestedElements: this.metrics.domSizes ? this.metrics.domSizes.deeplyNested : null,
        memoryUsage: avgMemoryUsage ? Math.round(avgMemoryUsage / 1024 / 1024) + 'MB' : null,
        reflows: this.metrics.reflows,
        slowComponents: slowComponents.length,
        slowInteractions: slowInteractions.length
      },
      details: {
        renderTimes: renderTimeAverages,
        domSizes: this.metrics.domSizes,
        memoryUsage: this.metrics.memoryUsage,
        eventListeners: this.metrics.eventListeners,
        reflows: this.metrics.reflows,
        interactionDelays: this.metrics.interactionDelays
      },
      recommendations
    };
  },
  
  /**
   * Registra un mensaje en la consola según el nivel de log configurado
   * @param {string} level - Nivel de log: 'debug', 'info', 'warn', 'error'
   * @param {string} message - Mensaje a registrar
   */
  log: function(level, message) {
    const logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    if (logLevels[level] >= logLevels[this.config.logLevel]) {
      const prefix = '[UIPerformanceAnalyzer]';
      switch (level) {
        case 'debug':
          console.debug(prefix, message);
          break;
        case 'info':
          console.info(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'error':
          console.error(prefix, message);
          break;
      }
    }
  }
};

// Exportar el objeto UIPerformanceAnalyzer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIPerformanceAnalyzer;
}
