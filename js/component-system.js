/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Sistema de Componentes Modular
 * 
 * Este módulo proporciona una arquitectura basada en componentes para
 * mejorar el rendimiento y la mantenibilidad de la interfaz de usuario.
 */

const ComponentSystem = {
  // Registro de componentes
  registry: {},
  
  // Caché de elementos renderizados
  cache: {},
  
  // Configuración del sistema
  config: {
    enableCaching: true,
    enableLazyLoading: true,
    enableVirtualRendering: true,
    renderThrottleMs: 16, // Aproximadamente 60fps
    virtualRenderThreshold: 50 // Número de elementos para activar renderizado virtual
  },
  
  /**
   * Inicializa el sistema de componentes
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[ComponentSystem] Inicializando sistema de componentes');
    
    // Inicializar sistema de observación de cambios
    this._initObserver();
    
    return this;
  },
  
  /**
   * Inicializa el observer para detectar cambios en el DOM
   * @private
   */
  _initObserver: function() {
    // Crear un MutationObserver para detectar cambios en el DOM
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Detectar componentes que se han eliminado del DOM
          Array.from(mutation.removedNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this._cleanupRemovedComponents(node);
            }
          });
        }
      });
    });
    
    // Comenzar a observar el documento
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  /**
   * Limpia los recursos de componentes eliminados
   * @param {HTMLElement} node - Nodo eliminado
   * @private
   */
  _cleanupRemovedComponents: function(node) {
    // Buscar componentes dentro del nodo eliminado
    const componentElements = node.querySelectorAll('[data-component]');
    
    componentElements.forEach(el => {
      const componentId = el.dataset.componentId;
      if (componentId && this.cache[componentId]) {
        // Ejecutar método de limpieza si existe
        const componentName = el.dataset.component;
        const component = this.registry[componentName];
        
        if (component && typeof component.onDestroy === 'function') {
          try {
            component.onDestroy(el, this.cache[componentId].state);
          } catch (e) {
            console.error(`Error al limpiar componente ${componentName}:`, e);
          }
        }
        
        // Eliminar de la caché
        delete this.cache[componentId];
      }
    });
  },
  
  /**
   * Registra un nuevo componente
   * @param {string} name - Nombre único del componente
   * @param {Object} component - Definición del componente
   * @returns {Object} - El componente registrado
   */
  register: function(name, component) {
    if (this.registry[name]) {
      console.warn(`[ComponentSystem] El componente "${name}" ya está registrado y será sobrescrito`);
    }
    
    // Validar que el componente tenga los métodos requeridos
    if (typeof component.render !== 'function') {
      throw new Error(`El componente "${name}" debe tener un método render`);
    }
    
    // Registrar el componente
    this.registry[name] = component;
    console.info(`[ComponentSystem] Componente "${name}" registrado`);
    
    return component;
  },
  
  /**
   * Crea una instancia de un componente
   * @param {string} name - Nombre del componente a crear
   * @param {Object} props - Propiedades para el componente
   * @param {Object} state - Estado inicial del componente (opcional)
   * @returns {Object} - Instancia del componente
   */
  create: function(name, props = {}, state = {}) {
    const component = this.registry[name];
    
    if (!component) {
      throw new Error(`El componente "${name}" no está registrado`);
    }
    
    // Generar ID único para esta instancia
    const instanceId = `${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Crear objeto de instancia
    const instance = {
      id: instanceId,
      name,
      props,
      state: {...state},
      
      /**
       * Renderiza el componente en un contenedor
       * @param {string|HTMLElement} container - Contenedor donde renderizar
       * @returns {HTMLElement} - El elemento renderizado
       */
      render: function(container) {
        return ComponentSystem.renderComponent(name, props, state, container, instanceId);
      },
      
      /**
       * Actualiza el estado del componente y lo vuelve a renderizar
       * @param {Object} newState - Nuevo estado parcial
       * @returns {HTMLElement} - El elemento actualizado
       */
      setState: function(newState) {
        return ComponentSystem.updateComponentState(instanceId, newState);
      },
      
      /**
       * Actualiza las propiedades del componente y lo vuelve a renderizar
       * @param {Object} newProps - Nuevas propiedades parciales
       * @returns {HTMLElement} - El elemento actualizado
       */
      setProps: function(newProps) {
        return ComponentSystem.updateComponentProps(instanceId, newProps);
      },
      
      /**
       * Elimina el componente del DOM y libera recursos
       */
      destroy: function() {
        ComponentSystem.destroyComponent(instanceId);
      }
    };
    
    return instance;
  },
  
  /**
   * Renderiza un componente en un contenedor
   * @param {string} name - Nombre del componente
   * @param {Object} props - Propiedades del componente
   * @param {Object} state - Estado inicial del componente
   * @param {string|HTMLElement} container - Contenedor donde renderizar
   * @param {string} instanceId - ID de instancia (opcional)
   * @returns {HTMLElement} - El elemento renderizado
   */
  renderComponent: function(name, props = {}, state = {}, container, instanceId) {
    const component = this.registry[name];
    
    if (!component) {
      throw new Error(`El componente "${name}" no está registrado`);
    }
    
    // Obtener el contenedor
    const containerEl = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;
    
    if (!containerEl) {
      throw new Error(`Contenedor no encontrado: ${container}`);
    }
    
    // Generar ID de instancia si no se proporciona
    const id = instanceId || `${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Medir tiempo de renderizado si el analizador está disponible
    let renderResult;
    if (typeof UIPerformanceAnalyzer !== 'undefined') {
      renderResult = UIPerformanceAnalyzer.measureRenderTime(name, () => {
        return this._renderComponentInternal(component, props, state, containerEl, id);
      });
    } else {
      renderResult = this._renderComponentInternal(component, props, state, containerEl, id);
    }
    
    return renderResult;
  },
  
  /**
   * Implementación interna del renderizado de componentes
   * @private
   */
  _renderComponentInternal: function(component, props, state, containerEl, id) {
    // Crear elemento principal del componente
    let el;
    
    // Verificar si ya existe en el contenedor
    const existingEl = containerEl.querySelector(`[data-component-id="${id}"]`);
    
    if (existingEl) {
      // Actualizar elemento existente
      el = existingEl;
    } else {
      // Crear nuevo elemento
      el = document.createElement('div');
      el.setAttribute('data-component', component.name);
      el.setAttribute('data-component-id', id);
      
      // Agregar al contenedor
      containerEl.appendChild(el);
    }
    
    // Ejecutar método de inicialización si existe y es primera renderización
    if (!existingEl && typeof component.onInit === 'function') {
      try {
        component.onInit(el, props, state);
      } catch (e) {
        console.error(`Error en onInit del componente ${component.name}:`, e);
      }
    }
    
    // Ejecutar método de renderizado
    try {
      component.render(el, props, state);
    } catch (e) {
      console.error(`Error al renderizar componente ${component.name}:`, e);
      el.innerHTML = `<div class="error">Error al renderizar componente: ${e.message}</div>`;
    }
    
    // Ejecutar método después de renderizar si existe
    if (typeof component.afterRender === 'function') {
      try {
        component.afterRender(el, props, state);
      } catch (e) {
        console.error(`Error en afterRender del componente ${component.name}:`, e);
      }
    }
    
    // Almacenar en caché
    if (this.config.enableCaching) {
      this.cache[id] = {
        element: el,
        props: {...props},
        state: {...state},
        component
      };
    }
    
    return el;
  },
  
  /**
   * Actualiza el estado de un componente y lo vuelve a renderizar
   * @param {string} instanceId - ID de la instancia del componente
   * @param {Object} newState - Nuevo estado parcial
   * @returns {HTMLElement} - El elemento actualizado
   */
  updateComponentState: function(instanceId, newState) {
    const cached = this.cache[instanceId];
    
    if (!cached) {
      throw new Error(`Componente con ID "${instanceId}" no encontrado en la caché`);
    }
    
    // Actualizar estado
    cached.state = {...cached.state, ...newState};
    
    // Throttle de renderizado para evitar demasiadas actualizaciones
    if (cached.renderTimeout) {
      clearTimeout(cached.renderTimeout);
    }
    
    cached.renderTimeout = setTimeout(() => {
      // Renderizar con el estado actualizado
      this._renderComponentInternal(
        cached.component,
        cached.props,
        cached.state,
        cached.element.parentNode,
        instanceId
      );
      
      delete cached.renderTimeout;
    }, this.config.renderThrottleMs);
    
    return cached.element;
  },
  
  /**
   * Actualiza las propiedades de un componente y lo vuelve a renderizar
   * @param {string} instanceId - ID de la instancia del componente
   * @param {Object} newProps - Nuevas propiedades parciales
   * @returns {HTMLElement} - El elemento actualizado
   */
  updateComponentProps: function(instanceId, newProps) {
    const cached = this.cache[instanceId];
    
    if (!cached) {
      throw new Error(`Componente con ID "${instanceId}" no encontrado en la caché`);
    }
    
    // Actualizar propiedades
    cached.props = {...cached.props, ...newProps};
    
    // Throttle de renderizado para evitar demasiadas actualizaciones
    if (cached.renderTimeout) {
      clearTimeout(cached.renderTimeout);
    }
    
    cached.renderTimeout = setTimeout(() => {
      // Renderizar con las propiedades actualizadas
      this._renderComponentInternal(
        cached.component,
        cached.props,
        cached.state,
        cached.element.parentNode,
        instanceId
      );
      
      delete cached.renderTimeout;
    }, this.config.renderThrottleMs);
    
    return cached.element;
  },
  
  /**
   * Elimina un componente del DOM y libera recursos
   * @param {string} instanceId - ID de la instancia del componente
   */
  destroyComponent: function(instanceId) {
    const cached = this.cache[instanceId];
    
    if (!cached) {
      return; // Ya no existe
    }
    
    // Ejecutar método de limpieza si existe
    if (typeof cached.component.onDestroy === 'function') {
      try {
        cached.component.onDestroy(cached.element, cached.state);
      } catch (e) {
        console.error(`Error al destruir componente ${cached.component.name}:`, e);
      }
    }
    
    // Eliminar del DOM
    if (cached.element.parentNode) {
      cached.element.parentNode.removeChild(cached.element);
    }
    
    // Eliminar de la caché
    delete this.cache[instanceId];
  },
  
  /**
   * Crea un renderizador virtual para listas grandes
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - API del renderizador virtual
   */
  createVirtualRenderer: function(options = {}) {
    const config = {
      itemHeight: 40, // Altura estimada de cada elemento en píxeles
      overscan: 5,    // Número de elementos adicionales a renderizar fuera de la vista
      container: null, // Contenedor del renderizador virtual
      renderItem: null, // Función para renderizar cada elemento
      items: [],      // Datos de los elementos
      ...options
    };
    
    if (!config.container) {
      throw new Error('Se requiere un contenedor para el renderizador virtual');
    }
    
    if (typeof config.renderItem !== 'function') {
      throw new Error('Se requiere una función renderItem para el renderizador virtual');
    }
    
    // Crear elementos del renderizador virtual
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'width: 100%; height: 100%; overflow-y: auto; position: relative;';
    
    const innerContainer = document.createElement('div');
    innerContainer.style.cssText = 'width: 100%; position: relative;';
    
    scrollContainer.appendChild(innerContainer);
    config.container.appendChild(scrollContainer);
    
    // Estado del renderizador
    const state = {
      items: [...config.items],
      scrollTop: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      totalHeight: 0,
      visibleHeight: 0
    };
    
    // Calcular altura total y actualizar contenedor
    const updateTotalHeight = () => {
      state.totalHeight = state.items.length * config.itemHeight;
      innerContainer.style.height = `${state.totalHeight}px`;
    };
    
    // Calcular índices visibles
    const calculateVisibleIndices = () => {
      state.scrollTop = scrollContainer.scrollTop;
      state.visibleHeight = scrollContainer.clientHeight;
      
      const startIndex = Math.floor(state.scrollTop / config.itemHeight);
      const endIndex = Math.min(
        state.items.length - 1,
        Math.ceil((state.scrollTop + state.visibleHeight) / config.itemHeight)
      );
      
      state.visibleStartIndex = Math.max(0, startIndex - config.overscan);
      state.visibleEndIndex = Math.min(state.items.length - 1, endIndex + config.overscan);
    };
    
    // Renderizar elementos visibles
    const renderVisibleItems = () => {
      // Limpiar contenedor
      while (innerContainer.firstChild) {
        innerContainer.removeChild(innerContainer.firstChild);
      }
      
      // Renderizar solo los elementos visibles
      for (let i = state.visibleStartIndex; i <= state.visibleEndIndex; i++) {
        const item = state.items[i];
        const itemEl = config.renderItem(item, i);
        
        if (itemEl) {
          itemEl.style.position = 'absolute';
          itemEl.style.top = `${i * config.itemHeight}px`;
          itemEl.style.width = '100%';
          itemEl.style.height = `${config.itemHeight}px`;
          
          innerContainer.appendChild(itemEl);
        }
      }
    };
    
    // Manejar evento de scroll
    const handleScroll = () => {
      requestAnimationFrame(() => {
        calculateVisibleIndices();
        renderVisibleItems();
      });
    };
    
    // Inicializar
    updateTotalHeight();
    calculateVisibleIndices();
    renderVisibleItems();
    
    // Agregar listener de scroll
    scrollContainer.addEventListener('scroll', handleScroll);
    
    // API pública del renderizador virtual
    return {
      // Actualizar los elementos
      setItems: function(newItems) {
        state.items = [...newItems];
        updateTotalHeight();
        calculateVisibleIndices();
        renderVisibleItems();
      },
      
      // Actualizar configuración
      updateConfig: function(newConfig) {
        Object.assign(config, newConfig);
        updateTotalHeight();
        calculateVisibleIndices();
        renderVisibleItems();
      },
      
      // Forzar actualización
      refresh: function() {
        calculateVisibleIndices();
        renderVisibleItems();
      },
      
      // Destruir el renderizador
      destroy: function() {
        scrollContainer.removeEventListener('scroll', handleScroll);
        config.container.removeChild(scrollContainer);
      },
      
      // Obtener estado actual
      getState: function() {
        return {...state};
      }
    };
  }
};

// Exportar el objeto ComponentSystem
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentSystem;
}
