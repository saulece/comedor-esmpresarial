/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Optimizador de Manipulación del DOM
 * 
 * Este módulo proporciona técnicas y utilidades para optimizar
 * la manipulación del DOM y el renderizado, reduciendo reflows
 * y mejorando el rendimiento general de la interfaz.
 */

const DOMOptimizer = {
  // Configuración
  config: {
    batchUpdates: true,
    useDocumentFragment: true,
    deferNonCriticalUpdates: true,
    useRAF: true,
    debounceTimeout: 150,
    throttleTimeout: 16 // ~60fps
  },
  
  // Registro de actualizaciones pendientes
  pendingUpdates: {},
  
  // Registro de funciones debounced/throttled
  debouncedFunctions: {},
  throttledFunctions: {},
  
  /**
   * Inicializa el optimizador del DOM
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[DOMOptimizer] Inicializando optimizador del DOM');
    
    // Inicializar optimizaciones globales
    this._setupGlobalOptimizations();
    
    return this;
  },
  
  /**
   * Configura optimizaciones globales para toda la aplicación
   * @private
   */
  _setupGlobalOptimizations: function() {
    // Parchar métodos nativos para optimizar
    this._patchDOMAPIs();
    
    // Configurar detección de reflows forzados
    this._setupReflowDetection();
    
    // Configurar optimización de eventos
    this._setupEventOptimization();
  },
  
  /**
   * Parcha métodos del DOM para optimizar su rendimiento
   * @private
   */
  _patchDOMAPIs: function() {
    // Solo aplicar parches si está habilitado
    if (!this.config.batchUpdates) return;
    
    // Guardar referencia al objeto original
    const self = this;
    
    // Optimizar appendChild para usar DocumentFragment cuando se añaden múltiples elementos
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
      if (self.config.useDocumentFragment && Array.isArray(child)) {
        const fragment = document.createDocumentFragment();
        child.forEach(node => fragment.appendChild(node));
        return originalAppendChild.call(this, fragment);
      }
      return originalAppendChild.call(this, child);
    };
    
    // Optimizar insertBefore para usar DocumentFragment cuando se añaden múltiples elementos
    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function(child, reference) {
      if (self.config.useDocumentFragment && Array.isArray(child)) {
        const fragment = document.createDocumentFragment();
        child.forEach(node => fragment.appendChild(node));
        return originalInsertBefore.call(this, fragment, reference);
      }
      return originalInsertBefore.call(this, child, reference);
    };
  },
  
  /**
   * Configura detección de reflows forzados para advertir sobre patrones ineficientes
   * @private
   */
  _setupReflowDetection: function() {
    // Lista de propiedades que causan reflow cuando se leen
    const reflowProperties = [
      'offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight',
      'clientLeft', 'clientTop', 'clientWidth', 'clientHeight',
      'scrollLeft', 'scrollTop', 'scrollWidth', 'scrollHeight',
      'getComputedStyle', 'getBoundingClientRect'
    ];
    
    // Monitorear acceso a propiedades que causan reflow
    reflowProperties.forEach(prop => {
      if (Element.prototype[prop]) {
        const original = Element.prototype[prop];
        Element.prototype[prop] = function() {
          console.warn(`[DOMOptimizer] Posible reflow forzado: ${prop} fue accedido durante una actualización del DOM`);
          return original.apply(this, arguments);
        };
      }
    });
    
    // Monitorear getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function() {
      console.warn('[DOMOptimizer] Posible reflow forzado: getComputedStyle fue llamado durante una actualización del DOM');
      return originalGetComputedStyle.apply(this, arguments);
    };
  },
  
  /**
   * Configura optimización de eventos para mejorar el rendimiento
   * @private
   */
  _setupEventOptimization: function() {
    // Implementar delegación de eventos para eventos comunes
    const commonEvents = ['click', 'input', 'change', 'submit'];
    const self = this;
    
    commonEvents.forEach(eventType => {
      document.addEventListener(eventType, function(event) {
        // Usar el sistema de delegación para manejar eventos
        self._handleDelegatedEvent(event);
      }, { passive: true });
    });
  },
  
  /**
   * Maneja eventos delegados para optimizar listeners
   * @param {Event} event - Evento del DOM
   * @private
   */
  _handleDelegatedEvent: function(event) {
    // Buscar elementos con atributo data-event-[tipo]
    const eventAttr = `data-event-${event.type}`;
    let target = event.target;
    
    // Recorrer hacia arriba en el árbol del DOM buscando manejadores
    while (target && target !== document) {
      if (target.hasAttribute(eventAttr)) {
        const handlerName = target.getAttribute(eventAttr);
        
        // Verificar si existe el manejador global
        if (typeof window[handlerName] === 'function') {
          window[handlerName].call(target, event);
        }
      }
      
      target = target.parentNode;
    }
  },
  
  /**
   * Crea un DocumentFragment para construir DOM de forma eficiente
   * @returns {DocumentFragment} - Un nuevo DocumentFragment
   */
  createFragment: function() {
    return document.createDocumentFragment();
  },
  
  /**
   * Realiza múltiples actualizaciones del DOM en un solo reflow
   * @param {Function} updateFn - Función que realiza actualizaciones del DOM
   */
  batchUpdate: function(updateFn) {
    if (!this.config.batchUpdates) {
      updateFn();
      return;
    }
    
    // Usar requestAnimationFrame para agrupar actualizaciones
    if (this.config.useRAF) {
      requestAnimationFrame(() => {
        updateFn();
      });
    } else {
      // Ejecutar inmediatamente si no se usa RAF
      updateFn();
    }
  },
  
  /**
   * Aplaza actualizaciones no críticas del DOM
   * @param {string} id - Identificador único para la actualización
   * @param {Function} updateFn - Función que realiza actualizaciones del DOM
   * @param {number} delay - Retraso en ms (opcional)
   */
  deferUpdate: function(id, updateFn, delay = 0) {
    if (!this.config.deferNonCriticalUpdates) {
      updateFn();
      return;
    }
    
    // Cancelar actualización pendiente anterior con el mismo ID
    if (this.pendingUpdates[id]) {
      clearTimeout(this.pendingUpdates[id]);
    }
    
    // Programar nueva actualización
    this.pendingUpdates[id] = setTimeout(() => {
      updateFn();
      delete this.pendingUpdates[id];
    }, delay);
  },
  
  /**
   * Cancela una actualización diferida pendiente
   * @param {string} id - Identificador de la actualización
   */
  cancelDeferredUpdate: function(id) {
    if (this.pendingUpdates[id]) {
      clearTimeout(this.pendingUpdates[id]);
      delete this.pendingUpdates[id];
    }
  },
  
  /**
   * Crea una versión debounced de una función
   * @param {Function} fn - Función a debounce
   * @param {number} wait - Tiempo de espera en ms
   * @param {boolean} immediate - Si debe ejecutarse al inicio en lugar del final
   * @returns {Function} - Función debounced
   */
  debounce: function(fn, wait = this.config.debounceTimeout, immediate = false) {
    let timeout;
    
    return function() {
      const context = this;
      const args = arguments;
      
      const later = function() {
        timeout = null;
        if (!immediate) fn.apply(context, args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) fn.apply(context, args);
    };
  },
  
  /**
   * Crea una versión throttled de una función
   * @param {Function} fn - Función a throttle
   * @param {number} limit - Límite de tiempo en ms
   * @returns {Function} - Función throttled
   */
  throttle: function(fn, limit = this.config.throttleTimeout) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    
    return function() {
      const context = this;
      const args = arguments;
      
      if (!inThrottle) {
        fn.apply(context, args);
        lastRan = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFunc);
        
        lastFunc = setTimeout(function() {
          if (Date.now() - lastRan >= limit) {
            fn.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  },
  
  /**
   * Obtiene o crea una función debounced con un ID específico
   * @param {string} id - Identificador único para la función
   * @param {Function} fn - Función a debounce
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} - Función debounced
   */
  getDebouncedFn: function(id, fn, wait = this.config.debounceTimeout) {
    if (!this.debouncedFunctions[id]) {
      this.debouncedFunctions[id] = this.debounce(fn, wait);
    }
    
    return this.debouncedFunctions[id];
  },
  
  /**
   * Obtiene o crea una función throttled con un ID específico
   * @param {string} id - Identificador único para la función
   * @param {Function} fn - Función a throttle
   * @param {number} limit - Límite de tiempo en ms
   * @returns {Function} - Función throttled
   */
  getThrottledFn: function(id, fn, limit = this.config.throttleTimeout) {
    if (!this.throttledFunctions[id]) {
      this.throttledFunctions[id] = this.throttle(fn, limit);
    }
    
    return this.throttledFunctions[id];
  },
  
  /**
   * Optimiza la creación de elementos del DOM
   * @param {string} tag - Etiqueta HTML
   * @param {Object} attributes - Atributos del elemento
   * @param {Array|string} children - Hijos del elemento (nodos o texto)
   * @returns {HTMLElement} - Elemento creado
   */
  createElement: function(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Aplicar atributos
    Object.keys(attributes).forEach(key => {
      if (key === 'style' && typeof attributes[key] === 'object') {
        // Aplicar estilos en lote
        Object.assign(element.style, attributes[key]);
      } else if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'dataset') {
        // Aplicar atributos data-*
        Object.keys(attributes[key]).forEach(dataKey => {
          element.dataset[dataKey] = attributes[key][dataKey];
        });
      } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
        // Manejar eventos
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, attributes[key]);
      } else {
        // Atributos normales
        element.setAttribute(key, attributes[key]);
      }
    });
    
    // Agregar hijos
    if (children) {
      if (typeof children === 'string') {
        element.textContent = children;
      } else if (Array.isArray(children)) {
        const fragment = this.createFragment();
        
        children.forEach(child => {
          if (typeof child === 'string') {
            fragment.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            fragment.appendChild(child);
          }
        });
        
        element.appendChild(fragment);
      }
    }
    
    return element;
  },
  
  /**
   * Optimiza la actualización de elementos del DOM
   * @param {HTMLElement} element - Elemento a actualizar
   * @param {Object} updates - Actualizaciones a aplicar
   */
  updateElement: function(element, updates = {}) {
    if (!element) return;
    
    // Agrupar actualizaciones para minimizar reflows
    this.batchUpdate(() => {
      // Actualizar atributos
      if (updates.attributes) {
        Object.keys(updates.attributes).forEach(key => {
          element.setAttribute(key, updates.attributes[key]);
        });
      }
      
      // Actualizar estilos
      if (updates.styles) {
        Object.assign(element.style, updates.styles);
      }
      
      // Actualizar clases
      if (updates.addClass) {
        if (Array.isArray(updates.addClass)) {
          element.classList.add(...updates.addClass);
        } else {
          element.classList.add(updates.addClass);
        }
      }
      
      if (updates.removeClass) {
        if (Array.isArray(updates.removeClass)) {
          element.classList.remove(...updates.removeClass);
        } else {
          element.classList.remove(updates.removeClass);
        }
      }
      
      if (updates.toggleClass) {
        Object.keys(updates.toggleClass).forEach(className => {
          element.classList.toggle(className, updates.toggleClass[className]);
        });
      }
      
      // Actualizar contenido
      if (updates.html !== undefined) {
        element.innerHTML = updates.html;
      }
      
      if (updates.text !== undefined) {
        element.textContent = updates.text;
      }
      
      // Actualizar dataset
      if (updates.dataset) {
        Object.keys(updates.dataset).forEach(key => {
          element.dataset[key] = updates.dataset[key];
        });
      }
    });
  },
  
  /**
   * Optimiza la renderización de listas grandes
   * @param {HTMLElement} container - Contenedor donde renderizar la lista
   * @param {Array} items - Elementos a renderizar
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {Object} options - Opciones adicionales
   */
  renderList: function(container, items, renderItem, options = {}) {
    if (!container || !items || !renderItem) return;
    
    const {
      batchSize = 50,
      useFragment = true,
      clearContainer = true,
      keyFn = null
    } = options;
    
    // Limpiar contenedor si es necesario
    if (clearContainer) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
    
    // Si hay pocos elementos, renderizar todos de una vez
    if (items.length <= batchSize) {
      this._renderItemsBatch(container, items, renderItem, useFragment, keyFn);
      return;
    }
    
    // Renderizar en lotes para no bloquear el hilo principal
    let index = 0;
    
    const renderNextBatch = () => {
      if (index >= items.length) return;
      
      const batch = items.slice(index, index + batchSize);
      this._renderItemsBatch(container, batch, renderItem, useFragment, keyFn);
      
      index += batchSize;
      
      // Programar el siguiente lote
      if (index < items.length) {
        requestAnimationFrame(renderNextBatch);
      }
    };
    
    // Iniciar renderizado por lotes
    renderNextBatch();
  },
  
  /**
   * Renderiza un lote de elementos
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {Array} batch - Lote de elementos a renderizar
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {boolean} useFragment - Si usar DocumentFragment
   * @param {Function} keyFn - Función para generar claves únicas
   * @private
   */
  _renderItemsBatch: function(container, batch, renderItem, useFragment, keyFn) {
    if (useFragment) {
      const fragment = this.createFragment();
      
      batch.forEach((item, index) => {
        const element = renderItem(item, index);
        
        if (element) {
          // Agregar atributo de clave si se proporciona una función de clave
          if (keyFn) {
            const key = keyFn(item);
            if (key) {
              element.setAttribute('data-key', key);
            }
          }
          
          fragment.appendChild(element);
        }
      });
      
      container.appendChild(fragment);
    } else {
      // Renderizar directamente en el contenedor
      batch.forEach((item, index) => {
        const element = renderItem(item, index);
        
        if (element) {
          // Agregar atributo de clave si se proporciona una función de clave
          if (keyFn) {
            const key = keyFn(item);
            if (key) {
              element.setAttribute('data-key', key);
            }
          }
          
          container.appendChild(element);
        }
      });
    }
  },
  
  /**
   * Optimiza la actualización de listas existentes (reconciliación)
   * @param {HTMLElement} container - Contenedor de la lista
   * @param {Array} items - Nuevos elementos
   * @param {Function} renderItem - Función para renderizar cada elemento
   * @param {Function} keyFn - Función para generar claves únicas
   */
  updateList: function(container, items, renderItem, keyFn) {
    if (!container || !items || !renderItem || !keyFn) return;
    
    // Obtener elementos actuales
    const currentElements = Array.from(container.children);
    const currentKeys = currentElements.map(el => el.getAttribute('data-key'));
    
    // Generar claves para los nuevos elementos
    const newKeys = items.map(item => keyFn(item));
    
    // Crear mapa de elementos actuales por clave
    const currentElementsByKey = {};
    currentElements.forEach(el => {
      const key = el.getAttribute('data-key');
      if (key) {
        currentElementsByKey[key] = el;
      }
    });
    
    // Crear fragment para los nuevos elementos
    const fragment = this.createFragment();
    
    // Procesar cada nuevo elemento
    items.forEach((item, index) => {
      const key = keyFn(item);
      
      if (currentKeys.includes(key)) {
        // El elemento ya existe, reutilizarlo
        const existingElement = currentElementsByKey[key];
        
        // Actualizar el elemento si es necesario
        if (typeof renderItem.update === 'function') {
          renderItem.update(existingElement, item, index);
        }
        
        // Mover al fragment en la nueva posición
        fragment.appendChild(existingElement);
      } else {
        // Crear nuevo elemento
        const newElement = renderItem(item, index);
        
        if (newElement) {
          // Agregar atributo de clave
          newElement.setAttribute('data-key', key);
          fragment.appendChild(newElement);
        }
      }
    });
    
    // Limpiar contenedor
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Agregar nuevos elementos
    container.appendChild(fragment);
  },
  
  /**
   * Optimiza la visibilidad de elementos (más eficiente que display:none)
   * @param {HTMLElement} element - Elemento a mostrar/ocultar
   * @param {boolean} visible - Si debe ser visible
   */
  setVisibility: function(element, visible) {
    if (!element) return;
    
    if (visible) {
      // Restaurar visibilidad
      if (element.style.transform === 'translateX(-9999px)') {
        this.batchUpdate(() => {
          element.style.transform = '';
          element.style.position = '';
          element.style.visibility = '';
        });
      }
    } else {
      // Ocultar sin usar display:none (evita reflow)
      this.batchUpdate(() => {
        element.style.transform = 'translateX(-9999px)';
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
      });
    }
  },
  
  /**
   * Optimiza la medición de elementos del DOM
   * @param {HTMLElement} element - Elemento a medir
   * @returns {Object} - Dimensiones del elemento
   */
  measureElement: function(element) {
    if (!element) return null;
    
    // Usar un único acceso a getBoundingClientRect para minimizar reflows
    const rect = element.getBoundingClientRect();
    
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    };
  },
  
  /**
   * Optimiza el desplazamiento a un elemento
   * @param {HTMLElement} element - Elemento al que desplazarse
   * @param {Object} options - Opciones de desplazamiento
   */
  scrollToElement: function(element, options = {}) {
    if (!element) return;
    
    const {
      behavior = 'smooth',
      block = 'start',
      inline = 'nearest',
      offset = 0
    } = options;
    
    // Usar scrollIntoView con opciones para una animación suave
    try {
      element.scrollIntoView({
        behavior,
        block,
        inline
      });
      
      // Aplicar offset si es necesario
      if (offset !== 0) {
        setTimeout(() => {
          window.scrollBy(0, offset);
        }, 0);
      }
    } catch (error) {
      // Fallback para navegadores que no soportan scrollIntoView con opciones
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      window.scrollTo(0, rect.top + scrollTop + offset);
    }
  }
};

// Exportar el objeto DOMOptimizer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMOptimizer;
}
