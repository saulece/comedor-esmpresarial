/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Gestos Táctiles
 * 
 * Este módulo implementa soporte para gestos táctiles para mejorar
 * la experiencia en dispositivos móviles.
 */

const TouchGestures = {
  // Configuración
  config: {
    enabled: true,
    swipeThreshold: 50, // Distancia mínima para detectar un swipe
    tapThreshold: 10, // Distancia máxima para considerar un tap
    doubleTapDelay: 300, // Tiempo máximo entre taps para considerar doble tap
    longPressDelay: 500, // Tiempo mínimo para considerar long press
    preventDefaultTouchEvents: false // Prevenir comportamiento por defecto de eventos táctiles
  },
  
  // Estado
  state: {
    isInitialized: false,
    isTouchDevice: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    touchStartTime: 0,
    lastTapTime: 0,
    longPressTimer: null,
    registeredElements: [],
    activeElement: null
  },
  
  /**
   * Inicializa el módulo de gestos táctiles
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    // Detectar si es un dispositivo táctil
    this._detectTouchDevice();
    
    if (this.state.isTouchDevice) {
      console.info('[TouchGestures] Inicializando módulo de gestos táctiles');
      
      // Configurar listeners globales
      this._setupGlobalListeners();
    } else {
      console.info('[TouchGestures] No se detectó un dispositivo táctil, módulo en modo pasivo');
    }
    
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Detecta si el dispositivo es táctil
   * @private
   */
  _detectTouchDevice: function() {
    this.state.isTouchDevice = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) || 
                              (navigator.msMaxTouchPoints > 0);
  },
  
  /**
   * Configura los listeners globales para eventos táctiles
   * @private
   */
  _setupGlobalListeners: function() {
    // Prevenir comportamiento por defecto de eventos táctiles si está configurado
    if (this.config.preventDefaultTouchEvents) {
      document.addEventListener('touchstart', function(e) {
        if (e.target.tagName !== 'INPUT' && 
            e.target.tagName !== 'TEXTAREA' && 
            e.target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      }, { passive: false });
      
      document.addEventListener('touchmove', function(e) {
        if (e.target.tagName !== 'INPUT' && 
            e.target.tagName !== 'TEXTAREA' && 
            e.target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      }, { passive: false });
    }
    
    // Detectar cambios en la orientación
    window.addEventListener('orientationchange', () => {
      this._triggerEvent('orientationchange', {
        orientation: window.orientation || 0
      });
    });
  },
  
  /**
   * Registra un elemento para detectar gestos táctiles
   * @param {HTMLElement|string} element - Elemento o selector a registrar
   * @param {Object} events - Objeto con callbacks para diferentes eventos
   * @returns {Object} - Objeto con métodos para controlar el registro
   */
  register: function(element, events = {}) {
    let el = element;
    
    // Si es un selector, obtener el elemento
    if (typeof element === 'string') {
      el = document.querySelector(element);
    }
    
    if (!el) {
      console.error('[TouchGestures] Elemento no encontrado:', element);
      return null;
    }
    
    // Crear objeto de registro
    const registration = {
      element: el,
      events: events,
      touchStartX: 0,
      touchStartY: 0,
      touchEndX: 0,
      touchEndY: 0,
      touchStartTime: 0,
      longPressTimer: null,
      isActive: true
    };
    
    // Añadir listeners
    el.addEventListener('touchstart', this._handleTouchStart.bind(this, registration), { passive: !this.config.preventDefaultTouchEvents });
    el.addEventListener('touchmove', this._handleTouchMove.bind(this, registration), { passive: !this.config.preventDefaultTouchEvents });
    el.addEventListener('touchend', this._handleTouchEnd.bind(this, registration), { passive: !this.config.preventDefaultTouchEvents });
    
    // Añadir a la lista de elementos registrados
    this.state.registeredElements.push(registration);
    
    // Devolver objeto con métodos para controlar el registro
    return {
      element: el,
      disable: () => {
        registration.isActive = false;
        return this;
      },
      enable: () => {
        registration.isActive = true;
        return this;
      },
      update: (newEvents) => {
        registration.events = {...registration.events, ...newEvents};
        return this;
      },
      unregister: () => {
        this._unregisterElement(registration);
        return this;
      }
    };
  },
  
  /**
   * Elimina el registro de un elemento
   * @param {Object} registration - Objeto de registro a eliminar
   * @private
   */
  _unregisterElement: function(registration) {
    const index = this.state.registeredElements.indexOf(registration);
    
    if (index !== -1) {
      const el = registration.element;
      
      // Eliminar listeners
      el.removeEventListener('touchstart', this._handleTouchStart.bind(this, registration));
      el.removeEventListener('touchmove', this._handleTouchMove.bind(this, registration));
      el.removeEventListener('touchend', this._handleTouchEnd.bind(this, registration));
      
      // Eliminar de la lista
      this.state.registeredElements.splice(index, 1);
    }
  },
  
  /**
   * Maneja el evento touchstart
   * @param {Object} registration - Objeto de registro del elemento
   * @param {TouchEvent} e - Evento táctil
   * @private
   */
  _handleTouchStart: function(registration, e) {
    if (!registration.isActive) return;
    
    const touch = e.touches[0];
    registration.touchStartX = touch.clientX;
    registration.touchStartY = touch.clientY;
    registration.touchStartTime = Date.now();
    this.state.activeElement = registration;
    
    // Iniciar timer para long press
    if (registration.events.longpress) {
      clearTimeout(registration.longPressTimer);
      registration.longPressTimer = setTimeout(() => {
        const distance = Math.sqrt(
          Math.pow(registration.touchEndX - registration.touchStartX, 2) +
          Math.pow(registration.touchEndY - registration.touchStartY, 2)
        );
        
        // Solo disparar si no se ha movido mucho el dedo
        if (distance < this.config.tapThreshold) {
          this._triggerCallback(registration, 'longpress', {
            x: registration.touchStartX,
            y: registration.touchStartY,
            duration: Date.now() - registration.touchStartTime
          });
        }
      }, this.config.longPressDelay);
    }
    
    // Disparar evento touchstart
    if (registration.events.touchstart) {
      this._triggerCallback(registration, 'touchstart', {
        x: touch.clientX,
        y: touch.clientY,
        originalEvent: e
      });
    }
  },
  
  /**
   * Maneja el evento touchmove
   * @param {Object} registration - Objeto de registro del elemento
   * @param {TouchEvent} e - Evento táctil
   * @private
   */
  _handleTouchMove: function(registration, e) {
    if (!registration.isActive) return;
    
    const touch = e.touches[0];
    registration.touchEndX = touch.clientX;
    registration.touchEndY = touch.clientY;
    
    // Cancelar long press si el dedo se mueve demasiado
    if (registration.longPressTimer) {
      const distance = Math.sqrt(
        Math.pow(registration.touchEndX - registration.touchStartX, 2) +
        Math.pow(registration.touchEndY - registration.touchStartY, 2)
      );
      
      if (distance > this.config.tapThreshold) {
        clearTimeout(registration.longPressTimer);
        registration.longPressTimer = null;
      }
    }
    
    // Disparar evento touchmove
    if (registration.events.touchmove) {
      this._triggerCallback(registration, 'touchmove', {
        x: touch.clientX,
        y: touch.clientY,
        deltaX: touch.clientX - registration.touchStartX,
        deltaY: touch.clientY - registration.touchStartY,
        originalEvent: e
      });
    }
  },
  
  /**
   * Maneja el evento touchend
   * @param {Object} registration - Objeto de registro del elemento
   * @param {TouchEvent} e - Evento táctil
   * @private
   */
  _handleTouchEnd: function(registration, e) {
    if (!registration.isActive) return;
    
    // Cancelar timer de long press
    clearTimeout(registration.longPressTimer);
    registration.longPressTimer = null;
    
    // Obtener posición final
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      registration.touchEndX = touch.clientX;
      registration.touchEndY = touch.clientY;
    }
    
    // Calcular distancia y dirección
    const deltaX = registration.touchEndX - registration.touchStartX;
    const deltaY = registration.touchEndY - registration.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - registration.touchStartTime;
    
    // Detectar swipe
    if (distance >= this.config.swipeThreshold) {
      // Determinar dirección
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      let direction = '';
      
      if (angle > -45 && angle <= 45) {
        direction = 'right';
      } else if (angle > 45 && angle <= 135) {
        direction = 'down';
      } else if (angle > 135 || angle <= -135) {
        direction = 'left';
      } else {
        direction = 'up';
      }
      
      // Disparar evento swipe
      if (registration.events.swipe) {
        this._triggerCallback(registration, 'swipe', {
          direction: direction,
          distance: distance,
          duration: duration,
          deltaX: deltaX,
          deltaY: deltaY,
          originalEvent: e
        });
      }
      
      // Disparar evento específico de dirección
      const directionEvent = 'swipe' + direction.charAt(0).toUpperCase() + direction.slice(1);
      if (registration.events[directionEvent]) {
        this._triggerCallback(registration, directionEvent, {
          distance: distance,
          duration: duration,
          deltaX: deltaX,
          deltaY: deltaY,
          originalEvent: e
        });
      }
    } 
    // Detectar tap
    else if (distance < this.config.tapThreshold) {
      // Verificar si es un doble tap
      const now = Date.now();
      const timeSinceLastTap = now - this.state.lastTapTime;
      
      if (timeSinceLastTap < this.config.doubleTapDelay && registration.events.doubletap) {
        this._triggerCallback(registration, 'doubletap', {
          x: registration.touchEndX,
          y: registration.touchEndY,
          originalEvent: e
        });
        this.state.lastTapTime = 0; // Reiniciar para evitar triple tap
      } else {
        // Es un tap simple
        if (registration.events.tap) {
          this._triggerCallback(registration, 'tap', {
            x: registration.touchEndX,
            y: registration.touchEndY,
            originalEvent: e
          });
        }
        this.state.lastTapTime = now;
      }
    }
    
    // Disparar evento touchend
    if (registration.events.touchend) {
      this._triggerCallback(registration, 'touchend', {
        x: registration.touchEndX,
        y: registration.touchEndY,
        deltaX: deltaX,
        deltaY: deltaY,
        duration: duration,
        originalEvent: e
      });
    }
    
    this.state.activeElement = null;
  },
  
  /**
   * Dispara un callback de evento
   * @param {Object} registration - Objeto de registro del elemento
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos del evento
   * @private
   */
  _triggerCallback: function(registration, eventName, data) {
    if (registration.events[eventName]) {
      registration.events[eventName].call(registration.element, data);
    }
  },
  
  /**
   * Dispara un evento personalizado
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos del evento
   * @private
   */
  _triggerEvent: function(eventName, data) {
    const event = new CustomEvent('gesture:' + eventName, {
      detail: data
    });
    
    document.dispatchEvent(event);
  },
  
  /**
   * Verifica si el dispositivo es táctil
   * @returns {boolean} - true si es un dispositivo táctil
   */
  isTouchDevice: function() {
    return this.state.isTouchDevice;
  },
  
  /**
   * Crea un elemento deslizable (swipeable)
   * @param {HTMLElement|string} element - Elemento o selector a hacer deslizable
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - Objeto con métodos para controlar el elemento deslizable
   */
  createSwipeable: function(element, options = {}) {
    const defaults = {
      directions: ['left', 'right'], // Direcciones permitidas
      threshold: this.config.swipeThreshold, // Umbral para detectar swipe
      animationDuration: 300, // Duración de la animación en ms
      snapThreshold: 0.3, // Porcentaje del ancho para hacer snap
      onSwipeStart: null, // Callback al iniciar swipe
      onSwipeMove: null, // Callback durante el swipe
      onSwipeEnd: null, // Callback al finalizar swipe
      onSwipeLeft: null, // Callback específico para swipe izquierdo
      onSwipeRight: null // Callback específico para swipe derecho
    };
    
    const settings = {...defaults, ...options};
    let el = element;
    
    // Si es un selector, obtener el elemento
    if (typeof element === 'string') {
      el = document.querySelector(element);
    }
    
    if (!el) {
      console.error('[TouchGestures] Elemento no encontrado:', element);
      return null;
    }
    
    // Asegurar que el elemento tenga posición relativa
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.position === 'static') {
      el.style.position = 'relative';
    }
    
    // Registrar eventos
    const registration = this.register(el, {
      touchstart: function(data) {
        // Reiniciar transformación
        this.style.transition = 'none';
        
        if (settings.onSwipeStart) {
          settings.onSwipeStart.call(this, data);
        }
      },
      touchmove: function(data) {
        // Solo permitir movimiento horizontal si está configurado
        if (settings.directions.includes('left') || settings.directions.includes('right')) {
          // Limitar movimiento según direcciones permitidas
          let moveX = data.deltaX;
          
          if (!settings.directions.includes('left') && moveX < 0) {
            moveX = 0;
          }
          
          if (!settings.directions.includes('right') && moveX > 0) {
            moveX = 0;
          }
          
          this.style.transform = `translateX(${moveX}px)`;
          
          if (settings.onSwipeMove) {
            settings.onSwipeMove.call(this, data);
          }
        }
      },
      touchend: function(data) {
        const width = this.offsetWidth;
        const moveX = data.deltaX;
        const percentMoved = Math.abs(moveX) / width;
        
        // Determinar si hacer snap o volver a la posición original
        if (percentMoved > settings.snapThreshold) {
          // Hacer snap a la posición final
          const snapPosition = moveX > 0 ? width : -width;
          this.style.transition = `transform ${settings.animationDuration}ms ease-out`;
          this.style.transform = `translateX(${snapPosition}px)`;
          
          // Disparar evento específico
          if (moveX > 0 && settings.onSwipeRight) {
            settings.onSwipeRight.call(this, data);
          } else if (moveX < 0 && settings.onSwipeLeft) {
            settings.onSwipeLeft.call(this, data);
          }
        } else {
          // Volver a la posición original
          this.style.transition = `transform ${settings.animationDuration}ms ease-out`;
          this.style.transform = 'translateX(0)';
        }
        
        if (settings.onSwipeEnd) {
          settings.onSwipeEnd.call(this, data);
        }
      }
    });
    
    return {
      element: el,
      reset: function() {
        el.style.transition = `transform ${settings.animationDuration}ms ease-out`;
        el.style.transform = 'translateX(0)';
        return this;
      },
      disable: function() {
        registration.disable();
        return this;
      },
      enable: function() {
        registration.enable();
        return this;
      },
      destroy: function() {
        registration.unregister();
        el.style.transform = '';
        el.style.transition = '';
        return this;
      }
    };
  },
  
  /**
   * Crea un carrusel táctil
   * @param {HTMLElement|string} container - Contenedor del carrusel
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - Objeto con métodos para controlar el carrusel
   */
  createCarousel: function(container, options = {}) {
    const defaults = {
      itemSelector: '.carousel-item', // Selector para los elementos del carrusel
      wrapperSelector: '.carousel-wrapper', // Selector para el wrapper del carrusel
      loop: false, // Si el carrusel debe hacer loop
      startIndex: 0, // Índice inicial
      animationDuration: 300, // Duración de la animación en ms
      snapThreshold: 0.1, // Porcentaje del ancho para hacer snap
      onSlideChange: null, // Callback al cambiar de slide
      onSlideStart: null, // Callback al iniciar el deslizamiento
      onSlideEnd: null // Callback al finalizar el deslizamiento
    };
    
    const settings = {...defaults, ...options};
    let containerEl = container;
    
    // Si es un selector, obtener el elemento
    if (typeof container === 'string') {
      containerEl = document.querySelector(container);
    }
    
    if (!containerEl) {
      console.error('[TouchGestures] Contenedor no encontrado:', container);
      return null;
    }
    
    // Obtener wrapper y elementos
    const wrapper = containerEl.querySelector(settings.wrapperSelector);
    const items = containerEl.querySelectorAll(settings.itemSelector);
    
    if (!wrapper || items.length === 0) {
      console.error('[TouchGestures] Wrapper o elementos no encontrados');
      return null;
    }
    
    // Configurar estilos
    containerEl.style.overflow = 'hidden';
    wrapper.style.display = 'flex';
    wrapper.style.transition = `transform ${settings.animationDuration}ms ease-out`;
    
    // Configurar elementos
    items.forEach(item => {
      item.style.flex = '0 0 100%';
    });
    
    // Estado del carrusel
    const state = {
      currentIndex: settings.startIndex,
      itemCount: items.length,
      touchStartX: 0,
      touchStartY: 0,
      touchMoveX: 0,
      isMoving: false
    };
    
    // Ir al slide inicial
    goToSlide(state.currentIndex, false);
    
    // Registrar eventos táctiles
    const registration = this.register(containerEl, {
      touchstart: function(data) {
        state.touchStartX = data.x;
        state.touchStartY = data.y;
        state.isMoving = true;
        wrapper.style.transition = 'none';
        
        if (settings.onSlideStart) {
          settings.onSlideStart.call(this, state.currentIndex);
        }
      },
      touchmove: function(data) {
        if (!state.isMoving) return;
        
        state.touchMoveX = data.deltaX;
        
        // Calcular posición con resistencia en los extremos
        let moveX = -state.currentIndex * containerEl.offsetWidth + state.touchMoveX;
        
        // Aplicar resistencia en los extremos si no es loop
        if (!settings.loop) {
          if ((state.currentIndex === 0 && state.touchMoveX > 0) || 
              (state.currentIndex === state.itemCount - 1 && state.touchMoveX < 0)) {
            moveX = -state.currentIndex * containerEl.offsetWidth + state.touchMoveX * 0.3;
          }
        }
        
        wrapper.style.transform = `translateX(${moveX}px)`;
      },
      touchend: function(data) {
        if (!state.isMoving) return;
        
        state.isMoving = false;
        wrapper.style.transition = `transform ${settings.animationDuration}ms ease-out`;
        
        // Determinar si cambiar de slide
        const containerWidth = containerEl.offsetWidth;
        const movePercent = Math.abs(state.touchMoveX) / containerWidth;
        
        if (movePercent > settings.snapThreshold) {
          if (state.touchMoveX < 0 && (settings.loop || state.currentIndex < state.itemCount - 1)) {
            // Deslizar a la derecha
            state.currentIndex = Math.min(state.currentIndex + 1, state.itemCount - 1);
          } else if (state.touchMoveX > 0 && (settings.loop || state.currentIndex > 0)) {
            // Deslizar a la izquierda
            state.currentIndex = Math.max(state.currentIndex - 1, 0);
          }
        }
        
        // Manejar loop
        if (settings.loop && state.currentIndex >= state.itemCount) {
          state.currentIndex = 0;
        } else if (settings.loop && state.currentIndex < 0) {
          state.currentIndex = state.itemCount - 1;
        }
        
        goToSlide(state.currentIndex, true);
        
        if (settings.onSlideEnd) {
          settings.onSlideEnd.call(this, state.currentIndex);
        }
      }
    });
    
    // Función para ir a un slide específico
    function goToSlide(index, animate) {
      if (index < 0 || index >= state.itemCount) return;
      
      state.currentIndex = index;
      
      if (!animate) {
        wrapper.style.transition = 'none';
      } else {
        wrapper.style.transition = `transform ${settings.animationDuration}ms ease-out`;
      }
      
      const position = -index * containerEl.offsetWidth;
      wrapper.style.transform = `translateX(${position}px)`;
      
      if (!animate) {
        // Forzar reflow para que la transición se aplique correctamente
        wrapper.offsetHeight;
        wrapper.style.transition = `transform ${settings.animationDuration}ms ease-out`;
      }
      
      if (settings.onSlideChange) {
        settings.onSlideChange.call(containerEl, index);
      }
    }
    
    // Manejar cambios de tamaño
    const resizeHandler = () => {
      goToSlide(state.currentIndex, false);
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // Devolver API pública
    return {
      goToSlide: (index) => goToSlide(index, true),
      next: () => {
        if (settings.loop || state.currentIndex < state.itemCount - 1) {
          goToSlide(state.currentIndex + 1, true);
        }
      },
      prev: () => {
        if (settings.loop || state.currentIndex > 0) {
          goToSlide(state.currentIndex - 1, true);
        }
      },
      getCurrentIndex: () => state.currentIndex,
      getItemCount: () => state.itemCount,
      destroy: () => {
        registration.unregister();
        window.removeEventListener('resize', resizeHandler);
        wrapper.style.transform = '';
        wrapper.style.transition = '';
        items.forEach(item => {
          item.style.flex = '';
        });
      }
    };
  }
};

// Exportar el objeto TouchGestures
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchGestures;
}
