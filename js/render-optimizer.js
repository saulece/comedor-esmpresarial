/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Optimizador de Renderizado
 * 
 * Este módulo proporciona técnicas y utilidades para optimizar
 * el renderizado de la interfaz de usuario, especialmente en dispositivos móviles.
 */

const RenderOptimizer = {
  // Configuración
  config: {
    enableVirtualDOM: true,
    enableLazyRendering: true,
    enableIntersectionObserver: true,
    enableResizeObserver: true,
    mobileOptimizations: true,
    renderThreshold: 100, // ms
    observerThreshold: 0.1
  },
  
  // Registro de elementos observados
  observedElements: {},
  
  // Observers
  intersectionObserver: null,
  resizeObserver: null,
  
  /**
   * Inicializa el optimizador de renderizado
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[RenderOptimizer] Inicializando optimizador de renderizado');
    
    // Detectar si es un dispositivo móvil
    this.isMobile = this._detectMobileDevice();
    
    // Inicializar observers si están disponibles y habilitados
    this._initObservers();
    
    // Aplicar optimizaciones específicas para móviles si es necesario
    if (this.isMobile && this.config.mobileOptimizations) {
      this._applyMobileOptimizations();
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
   * Inicializa los observers para renderizado optimizado
   * @private
   */
  _initObservers: function() {
    // Inicializar IntersectionObserver si está disponible y habilitado
    if (this.config.enableIntersectionObserver && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this._handleIntersection.bind(this),
        {
          root: null,
          rootMargin: '100px',
          threshold: this.config.observerThreshold
        }
      );
    }
    
    // Inicializar ResizeObserver si está disponible y habilitado
    if (this.config.enableResizeObserver && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(
        this._handleResize.bind(this)
      );
    }
  },
  
  /**
   * Aplica optimizaciones específicas para dispositivos móviles
   * @private
   */
  _applyMobileOptimizations: function() {
    // Reducir animaciones
    document.documentElement.classList.add('mobile-optimized');
    
    // Añadir estilos de optimización si no existen
    if (!document.getElementById('mobile-optimization-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'mobile-optimization-styles';
      styleEl.textContent = `
        .mobile-optimized * {
          transition-duration: 0.1s !important;
          animation-duration: 0.1s !important;
        }
        
        .mobile-optimized .heavy-animation {
          transition: none !important;
          animation: none !important;
        }
        
        .mobile-optimized .optimize-paint {
          will-change: transform;
          transform: translateZ(0);
        }
        
        .mobile-optimized .optimize-composite {
          will-change: opacity, transform;
        }
        
        @media (max-width: 768px) {
          .defer-mobile-render {
            visibility: hidden;
          }
          
          .defer-mobile-render.is-visible {
            visibility: visible;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Optimizar eventos táctiles
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    
    // Optimizar scroll
    this._optimizeScroll();
  },
  
  /**
   * Optimiza el evento de scroll para mejor rendimiento
   * @private
   */
  _optimizeScroll: function() {
    let scrollTimeout;
    const body = document.body;
    
    // Añadir clase durante el scroll
    window.addEventListener('scroll', function() {
      if (!body.classList.contains('is-scrolling')) {
        body.classList.add('is-scrolling');
      }
      
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(function() {
        body.classList.remove('is-scrolling');
      }, 100);
    }, { passive: true });
  },
  
  /**
   * Maneja eventos de intersección para elementos observados
   * @param {IntersectionObserverEntry[]} entries - Entradas del observer
   * @private
   */
  _handleIntersection: function(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      const id = element.dataset.observerId;
      
      if (!id || !this.observedElements[id]) return;
      
      const config = this.observedElements[id];
      
      if (entry.isIntersecting) {
        // Elemento visible en el viewport
        element.classList.add('is-visible');
        
        if (config.onVisible && typeof config.onVisible === 'function') {
          config.onVisible(element, entry);
        }
        
        // Dejar de observar si solo se necesita una vez
        if (config.once) {
          this.unobserveElement(element);
        }
      } else {
        // Elemento fuera del viewport
        element.classList.remove('is-visible');
        
        if (config.onHidden && typeof config.onHidden === 'function') {
          config.onHidden(element, entry);
        }
      }
    });
  },
  
  /**
   * Maneja eventos de redimensionamiento para elementos observados
   * @param {ResizeObserverEntry[]} entries - Entradas del observer
   * @private
   */
  _handleResize: function(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      const id = element.dataset.resizeId;
      
      if (!id || !this.observedElements[id]) return;
      
      const config = this.observedElements[id];
      
      if (config.onResize && typeof config.onResize === 'function') {
        const { width, height } = entry.contentRect;
        config.onResize(element, { width, height });
      }
    });
  },
  
  /**
   * Observa un elemento para renderizado optimizado
   * @param {HTMLElement} element - Elemento a observar
   * @param {Object} options - Opciones de observación
   * @returns {string} - ID de observación
   */
  observeElement: function(element, options = {}) {
    if (!element) return null;
    
    const id = 'obs_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    element.dataset.observerId = id;
    
    // Guardar configuración
    this.observedElements[id] = {
      element,
      once: options.once || false,
      onVisible: options.onVisible || null,
      onHidden: options.onHidden || null,
      onResize: options.onResize || null
    };
    
    // Añadir clase para optimización
    element.classList.add('defer-mobile-render');
    
    // Observar con IntersectionObserver
    if (this.intersectionObserver && (options.onVisible || options.onHidden)) {
      this.intersectionObserver.observe(element);
    }
    
    // Observar con ResizeObserver
    if (this.resizeObserver && options.onResize) {
      element.dataset.resizeId = id;
      this.resizeObserver.observe(element);
    }
    
    return id;
  },
  
  /**
   * Deja de observar un elemento
   * @param {HTMLElement} element - Elemento a dejar de observar
   */
  unobserveElement: function(element) {
    if (!element) return;
    
    const id = element.dataset.observerId;
    
    if (id && this.observedElements[id]) {
      // Eliminar de IntersectionObserver
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(element);
      }
      
      // Eliminar de ResizeObserver
      if (this.resizeObserver && element.dataset.resizeId) {
        this.resizeObserver.unobserve(element);
        delete element.dataset.resizeId;
      }
      
      // Eliminar de registro
      delete this.observedElements[id];
      delete element.dataset.observerId;
    }
  },
  
  /**
   * Renderiza un componente de forma optimizada
   * @param {Function} renderFn - Función de renderizado
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Object} props - Propiedades para el renderizado
   * @param {Object} options - Opciones adicionales
   */
  renderOptimized: function(renderFn, container, props = {}, options = {}) {
    if (!renderFn || !container) return;
    
    const {
      defer = false,
      lazy = this.config.enableLazyRendering,
      threshold = this.config.renderThreshold,
      priority = 'normal' // 'high', 'normal', 'low'
    } = options;
    
    // Determinar si diferir el renderizado
    if (defer || (lazy && this.isMobile)) {
      // Renderizado diferido
      this.observeElement(container, {
        once: true,
        onVisible: () => {
          this._executeRender(renderFn, container, props, priority, threshold);
        }
      });
      
      // Mostrar indicador de carga si es necesario
      if (options.showLoader) {
        container.innerHTML = '<div class="loading-placeholder"></div>';
      }
    } else {
      // Renderizado inmediato
      this._executeRender(renderFn, container, props, priority, threshold);
    }
  },
  
  /**
   * Ejecuta una función de renderizado con la prioridad adecuada
   * @param {Function} renderFn - Función de renderizado
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Object} props - Propiedades para el renderizado
   * @param {string} priority - Prioridad del renderizado
   * @param {number} threshold - Umbral para renderizado por lotes
   * @private
   */
  _executeRender: function(renderFn, container, props, priority, threshold) {
    if (priority === 'high') {
      // Renderizado inmediato
      renderFn(container, props);
    } else if (priority === 'low') {
      // Renderizado en tiempo de inactividad
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          renderFn(container, props);
        });
      } else {
        setTimeout(() => {
          renderFn(container, props);
        }, 50);
      }
    } else {
      // Renderizado normal (en el próximo frame)
      requestAnimationFrame(() => {
        renderFn(container, props);
      });
    }
  },
  
  /**
   * Optimiza el renderizado de una lista grande
   * @param {Array} items - Elementos a renderizar
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Object} options - Opciones adicionales
   */
  renderList: function(items, renderItem, container, options = {}) {
    if (!items || !renderItem || !container) return;
    
    const {
      batchSize = this.isMobile ? 10 : 20,
      batchDelay = this.isMobile ? 100 : 50,
      virtual = this.config.enableVirtualDOM && items.length > 50,
      keyFn = item => item.id || null
    } = options;
    
    // Si se solicita renderizado virtual y hay muchos elementos
    if (virtual) {
      this._renderVirtualList(items, renderItem, container, { ...options, keyFn });
      return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Si hay pocos elementos, renderizar todos de una vez
    if (items.length <= batchSize) {
      const fragment = document.createDocumentFragment();
      
      items.forEach((item, index) => {
        const element = renderItem(item, index);
        if (element) {
          fragment.appendChild(element);
        }
      });
      
      container.appendChild(fragment);
      return;
    }
    
    // Renderizar en lotes
    let currentIndex = 0;
    
    const renderNextBatch = () => {
      if (currentIndex >= items.length) return;
      
      const fragment = document.createDocumentFragment();
      const endIndex = Math.min(currentIndex + batchSize, items.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        const element = renderItem(items[i], i);
        if (element) {
          fragment.appendChild(element);
        }
      }
      
      container.appendChild(fragment);
      currentIndex = endIndex;
      
      if (currentIndex < items.length) {
        setTimeout(renderNextBatch, batchDelay);
      }
    };
    
    // Iniciar renderizado por lotes
    renderNextBatch();
  },
  
  /**
   * Implementa renderizado virtual para listas muy grandes
   * @param {Array} items - Elementos a renderizar
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Object} options - Opciones adicionales
   * @private
   */
  _renderVirtualList: function(items, renderItem, container, options) {
    // Configuración
    const {
      itemHeight = 50,
      overscan = 5,
      keyFn = null
    } = options;
    
    // Limpiar y preparar contenedor
    container.innerHTML = '';
    container.style.position = 'relative';
    
    // Crear contenedor de altura total
    const heightContainer = document.createElement('div');
    heightContainer.style.height = `${items.length * itemHeight}px`;
    heightContainer.style.width = '100%';
    heightContainer.style.position = 'relative';
    container.appendChild(heightContainer);
    
    // Contenedor para elementos visibles
    const visibleContainer = document.createElement('div');
    visibleContainer.style.width = '100%';
    visibleContainer.style.position = 'absolute';
    visibleContainer.style.top = '0';
    visibleContainer.style.left = '0';
    container.appendChild(visibleContainer);
    
    // Estado del renderizado virtual
    const state = {
      items,
      startIndex: 0,
      endIndex: 0,
      scrollTop: 0,
      viewportHeight: container.clientHeight
    };
    
    // Función para calcular elementos visibles
    const calculateVisibleItems = () => {
      state.scrollTop = container.scrollTop;
      state.viewportHeight = container.clientHeight;
      
      const startIndex = Math.max(0, Math.floor(state.scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((state.scrollTop + state.viewportHeight) / itemHeight) + overscan
      );
      
      return { startIndex, endIndex };
    };
    
    // Función para renderizar elementos visibles
    const renderVisibleItems = () => {
      const { startIndex, endIndex } = calculateVisibleItems();
      
      // Si no hay cambios, no hacer nada
      if (startIndex === state.startIndex && endIndex === state.endIndex) {
        return;
      }
      
      state.startIndex = startIndex;
      state.endIndex = endIndex;
      
      // Limpiar contenedor visible
      visibleContainer.innerHTML = '';
      
      // Posicionar contenedor visible
      visibleContainer.style.transform = `translateY(${startIndex * itemHeight}px)`;
      
      // Renderizar elementos visibles
      const fragment = document.createDocumentFragment();
      
      for (let i = startIndex; i <= endIndex; i++) {
        const item = items[i];
        const element = renderItem(item, i);
        
        if (element) {
          element.style.position = 'relative';
          element.style.height = `${itemHeight}px`;
          
          // Agregar clave si se proporciona una función
          if (keyFn) {
            const key = keyFn(item);
            if (key) {
              element.dataset.key = key;
            }
          }
          
          fragment.appendChild(element);
        }
      }
      
      visibleContainer.appendChild(fragment);
    };
    
    // Manejar eventos de scroll
    const handleScroll = () => {
      requestAnimationFrame(renderVisibleItems);
    };
    
    // Manejar eventos de redimensionamiento
    const handleResize = () => {
      renderVisibleItems();
    };
    
    // Configurar eventos
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Renderizar elementos iniciales
    renderVisibleItems();
    
    // Guardar referencias para limpieza
    container.virtualListCleanup = () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  },
  
  /**
   * Optimiza imágenes para carga diferida
   * @param {string} selector - Selector CSS para las imágenes
   * @param {Object} options - Opciones adicionales
   */
  optimizeImages: function(selector = 'img[data-src]', options = {}) {
    const {
      rootMargin = '200px 0px',
      threshold = 0.1,
      placeholder = true
    } = options;
    
    // Crear observer para carga diferida de imágenes
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            
            if (src) {
              // Crear nueva imagen para precargar
              const newImg = new Image();
              
              newImg.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                delete img.dataset.src;
              };
              
              newImg.src = src;
              
              // Dejar de observar esta imagen
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin,
        threshold
      });
      
      // Observar todas las imágenes que coincidan con el selector
      document.querySelectorAll(selector).forEach(img => {
        // Añadir placeholder si está habilitado
        if (placeholder && !img.src) {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        }
        
        imageObserver.observe(img);
      });
    } else {
      // Fallback para navegadores que no soportan IntersectionObserver
      document.querySelectorAll(selector).forEach(img => {
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          delete img.dataset.src;
        }
      });
    }
  }
};

// Exportar el objeto RenderOptimizer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderOptimizer;
}
