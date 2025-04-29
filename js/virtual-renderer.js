/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Renderizado Virtual para grandes conjuntos de datos
 * 
 * Este módulo proporciona funcionalidades para renderizar eficientemente
 * grandes conjuntos de datos mediante técnicas de virtualización.
 */

const VirtualRenderer = {
  // Configuración por defecto
  config: {
    itemHeight: 50,           // Altura predeterminada de cada elemento en píxeles
    overscanCount: 5,         // Número de elementos adicionales a renderizar fuera de la vista
    scrollThrottle: 16,       // Tiempo de throttle para eventos de scroll (ms)
    batchSize: 20,            // Tamaño de lote para renderizado por lotes
    enableSmoothScrolling: true, // Habilitar scroll suave
    useResizeObserver: true,  // Usar ResizeObserver para detectar cambios de tamaño
    useIntersectionObserver: true, // Usar IntersectionObserver para detectar visibilidad
    mobileOptimizations: true // Aplicar optimizaciones adicionales en dispositivos móviles
  },
  
  // Registro de instancias de renderizadores virtuales
  instances: {},
  
  /**
   * Inicializa el sistema de renderizado virtual
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[VirtualRenderer] Inicializando sistema de renderizado virtual');
    
    // Detectar si es un dispositivo móvil
    this.isMobile = this._detectMobileDevice();
    
    // Aplicar optimizaciones específicas para móviles si es necesario
    if (this.isMobile && this.config.mobileOptimizations) {
      this.config.overscanCount = 3; // Reducir overscan en móviles
      this.config.scrollThrottle = 32; // Aumentar throttle en móviles
    }
    
    return this;
  },
  
  /**
   * Detecta si el dispositivo es móvil
   * @returns {boolean} - true si es un dispositivo móvil
   * @private
   */
  _detectMobileDevice: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
  },
  
  /**
   * Crea una nueva instancia de renderizador virtual para una lista
   * @param {HTMLElement} container - Contenedor donde se renderizará la lista
   * @param {Array} items - Elementos a renderizar
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {Object} options - Opciones adicionales
   * @returns {Object} - Instancia del renderizador virtual
   */
  createVirtualList: function(container, items, renderItem, options = {}) {
    if (!container || !items || !renderItem) {
      console.error('[VirtualRenderer] Faltan parámetros requeridos para crear lista virtual');
      return null;
    }
    
    // Generar ID único para esta instancia
    const id = 'vlist_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Crear nueva instancia
    const instance = {
      id,
      container,
      items,
      renderItem,
      options: {...this.config, ...options},
      state: {
        scrollTop: 0,
        startIndex: 0,
        endIndex: 0,
        visibleCount: 0,
        totalHeight: 0,
        containerHeight: 0,
        isScrolling: false
      },
      elements: {
        heightContainer: null,
        itemsContainer: null
      },
      handlers: {
        scroll: null,
        resize: null
      }
    };
    
    // Inicializar la instancia
    this._initVirtualList(instance);
    
    // Registrar instancia
    this.instances[id] = instance;
    
    return {
      id,
      update: (newItems) => this.updateVirtualList(id, newItems),
      destroy: () => this.destroyVirtualList(id),
      scrollToIndex: (index) => this.scrollToIndex(id, index),
      refresh: () => this.refreshVirtualList(id)
    };
  },
  
  /**
   * Inicializa una instancia de lista virtual
   * @param {Object} instance - Instancia a inicializar
   * @private
   */
  _initVirtualList: function(instance) {
    const { container, options } = instance;
    
    // Preparar el contenedor
    container.style.position = 'relative';
    container.style.overflow = 'auto';
    container.classList.add('virtual-list-container');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear contenedor de altura total
    const heightContainer = document.createElement('div');
    heightContainer.style.width = '100%';
    heightContainer.style.position = 'relative';
    heightContainer.classList.add('virtual-list-height-container');
    container.appendChild(heightContainer);
    
    // Crear contenedor para elementos visibles
    const itemsContainer = document.createElement('div');
    itemsContainer.style.width = '100%';
    itemsContainer.style.position = 'absolute';
    itemsContainer.style.top = '0';
    itemsContainer.style.left = '0';
    itemsContainer.classList.add('virtual-list-items-container');
    container.appendChild(itemsContainer);
    
    // Guardar referencias a elementos
    instance.elements.heightContainer = heightContainer;
    instance.elements.itemsContainer = itemsContainer;
    
    // Calcular altura total
    const totalHeight = instance.items.length * options.itemHeight;
    heightContainer.style.height = `${totalHeight}px`;
    instance.state.totalHeight = totalHeight;
    
    // Calcular dimensiones iniciales
    this._updateDimensions(instance);
    
    // Crear manejadores de eventos con throttle
    instance.handlers.scroll = this._createThrottledScrollHandler(instance);
    instance.handlers.resize = this._createResizeHandler(instance);
    
    // Registrar eventos
    container.addEventListener('scroll', instance.handlers.scroll, { passive: true });
    
    // Usar ResizeObserver si está disponible
    if (options.useResizeObserver && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(instance.handlers.resize);
      resizeObserver.observe(container);
      instance.resizeObserver = resizeObserver;
    } else {
      // Fallback a evento de resize
      window.addEventListener('resize', instance.handlers.resize);
    }
    
    // Renderizar elementos iniciales
    this._renderVisibleItems(instance);
  },
  
  /**
   * Crea un manejador de scroll con throttle
   * @param {Object} instance - Instancia de lista virtual
   * @returns {Function} - Manejador de scroll con throttle
   * @private
   */
  _createThrottledScrollHandler: function(instance) {
    let lastScrollTime = 0;
    
    return (event) => {
      const now = Date.now();
      
      // Aplicar throttle al evento de scroll
      if (now - lastScrollTime < instance.options.scrollThrottle) {
        return;
      }
      
      lastScrollTime = now;
      
      // Marcar que está scrolleando
      if (!instance.state.isScrolling) {
        instance.state.isScrolling = true;
        instance.container.classList.add('is-scrolling');
      }
      
      // Limpiar timeout anterior
      if (instance.scrollTimeout) {
        clearTimeout(instance.scrollTimeout);
      }
      
      // Actualizar estado de scroll
      instance.state.scrollTop = instance.container.scrollTop;
      
      // Programar renderizado en el próximo frame
      requestAnimationFrame(() => {
        this._renderVisibleItems(instance);
      });
      
      // Programar fin de scroll
      instance.scrollTimeout = setTimeout(() => {
        instance.state.isScrolling = false;
        instance.container.classList.remove('is-scrolling');
      }, 100);
    };
  },
  
  /**
   * Crea un manejador de resize
   * @param {Object} instance - Instancia de lista virtual
   * @returns {Function} - Manejador de resize
   * @private
   */
  _createResizeHandler: function(instance) {
    return () => {
      this._updateDimensions(instance);
      this._renderVisibleItems(instance);
    };
  },
  
  /**
   * Actualiza las dimensiones de la instancia
   * @param {Object} instance - Instancia de lista virtual
   * @private
   */
  _updateDimensions: function(instance) {
    const { container } = instance;
    
    // Actualizar altura del contenedor
    instance.state.containerHeight = container.clientHeight;
    
    // Calcular número de elementos visibles
    instance.state.visibleCount = Math.ceil(instance.state.containerHeight / instance.options.itemHeight);
  },
  
  /**
   * Calcula los índices de los elementos visibles
   * @param {Object} instance - Instancia de lista virtual
   * @returns {Object} - Índices de inicio y fin
   * @private
   */
  _calculateVisibleRange: function(instance) {
    const { scrollTop, containerHeight } = instance.state;
    const { itemHeight, overscanCount } = instance.options;
    
    // Calcular índices
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const endIndex = Math.min(
      instance.items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
    );
    
    return { startIndex, endIndex };
  },
  
  /**
   * Renderiza los elementos visibles
   * @param {Object} instance - Instancia de lista virtual
   * @private
   */
  _renderVisibleItems: function(instance) {
    const { startIndex, endIndex } = this._calculateVisibleRange(instance);
    
    // Si no hay cambios, no hacer nada
    if (startIndex === instance.state.startIndex && endIndex === instance.state.endIndex) {
      return;
    }
    
    // Actualizar índices
    instance.state.startIndex = startIndex;
    instance.state.endIndex = endIndex;
    
    // Posicionar contenedor de elementos
    instance.elements.itemsContainer.style.transform = `translateY(${startIndex * instance.options.itemHeight}px)`;
    
    // Limpiar contenedor de elementos
    instance.elements.itemsContainer.innerHTML = '';
    
    // Renderizar elementos visibles
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i <= endIndex; i++) {
      const item = instance.items[i];
      if (!item) continue;
      
      const element = instance.renderItem(item, i);
      
      if (element) {
        // Configurar elemento
        element.style.height = `${instance.options.itemHeight}px`;
        element.style.boxSizing = 'border-box';
        element.dataset.virtualIndex = i;
        
        // Añadir al fragmento
        fragment.appendChild(element);
      }
    }
    
    // Añadir elementos al contenedor
    instance.elements.itemsContainer.appendChild(fragment);
  },
  
  /**
   * Actualiza los elementos de una lista virtual
   * @param {string} id - ID de la instancia
   * @param {Array} newItems - Nuevos elementos
   */
  updateVirtualList: function(id, newItems) {
    const instance = this.instances[id];
    
    if (!instance || !newItems) {
      console.error(`[VirtualRenderer] No se encontró la instancia con ID ${id} o los elementos son inválidos`);
      return;
    }
    
    // Actualizar elementos
    instance.items = newItems;
    
    // Recalcular altura total
    const totalHeight = newItems.length * instance.options.itemHeight;
    instance.elements.heightContainer.style.height = `${totalHeight}px`;
    instance.state.totalHeight = totalHeight;
    
    // Renderizar elementos visibles
    this._renderVisibleItems(instance);
  },
  
  /**
   * Refresca una lista virtual
   * @param {string} id - ID de la instancia
   */
  refreshVirtualList: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualRenderer] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar dimensiones
    this._updateDimensions(instance);
    
    // Renderizar elementos visibles
    this._renderVisibleItems(instance);
  },
  
  /**
   * Desplaza la lista a un índice específico
   * @param {string} id - ID de la instancia
   * @param {number} index - Índice al que desplazarse
   */
  scrollToIndex: function(id, index) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualRenderer] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Validar índice
    if (index < 0 || index >= instance.items.length) {
      console.warn(`[VirtualRenderer] Índice ${index} fuera de rango`);
      return;
    }
    
    // Calcular posición de scroll
    const scrollTop = index * instance.options.itemHeight;
    
    // Aplicar scroll
    if (instance.options.enableSmoothScrolling) {
      instance.container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    } else {
      instance.container.scrollTop = scrollTop;
    }
  },
  
  /**
   * Destruye una instancia de lista virtual
   * @param {string} id - ID de la instancia
   */
  destroyVirtualList: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualRenderer] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Eliminar eventos
    instance.container.removeEventListener('scroll', instance.handlers.scroll);
    window.removeEventListener('resize', instance.handlers.resize);
    
    // Eliminar ResizeObserver si existe
    if (instance.resizeObserver) {
      instance.resizeObserver.disconnect();
    }
    
    // Limpiar timeouts
    if (instance.scrollTimeout) {
      clearTimeout(instance.scrollTimeout);
    }
    
    // Eliminar instancia del registro
    delete this.instances[id];
  }
};

// Exportar el objeto VirtualRenderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualRenderer;
}
