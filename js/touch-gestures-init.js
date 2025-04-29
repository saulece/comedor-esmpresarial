/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Inicialización de Gestos Táctiles
 * 
 * Este archivo inicializa y configura los gestos táctiles
 * para mejorar la experiencia en dispositivos móviles.
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.info('[TouchGestures] Inicializando gestos táctiles...');
  
  // Inicializar gestos táctiles
  initTouchGestures();
});

/**
 * Inicializa el módulo de gestos táctiles y configura los elementos interactivos
 */
function initTouchGestures() {
  if (window.TouchGestures) {
    // Inicializar módulo con detección automática de dispositivos táctiles
    window.TouchGestures.init({
      swipeThreshold: 50,
      tapThreshold: 10,
      doubleTapDelay: 300,
      longPressDelay: 500,
      preventDefaultTouchEvents: false
    });
    
    // Solo continuar si es un dispositivo táctil
    if (window.TouchGestures.isTouchDevice()) {
      console.info('[TouchGestures] Dispositivo táctil detectado, aplicando optimizaciones');
      
      // Añadir clase a body para aplicar estilos táctiles
      document.body.classList.add('touch-enabled');
      
      // Mejorar elementos táctiles
      enhanceTouchElements();
      
      // Configurar gestos específicos
      setupSwipeGestures();
      setupTapGestures();
      
      // Configurar carruseles táctiles
      setupCarousels();
      
      // Configurar listas deslizables
      setupSwipeLists();
      
      console.info('[TouchGestures] Gestos táctiles inicializados correctamente');
    } else {
      console.info('[TouchGestures] No se detectó un dispositivo táctil, modo pasivo activado');
    }
  } else {
    console.warn('[TouchGestures] Módulo de gestos táctiles no encontrado');
  }
}

/**
 * Mejora los elementos para interacción táctil
 */
function enhanceTouchElements() {
  // Mejorar botones para interacción táctil
  const buttons = document.querySelectorAll('button, .btn');
  buttons.forEach(button => {
    // Añadir clases para estilos táctiles
    button.classList.add('touch-target');
    
    // Añadir efecto de ripple
    if (!button.classList.contains('no-ripple')) {
      button.classList.add('touch-ripple');
    }
  });
  
  // Mejorar enlaces para interacción táctil
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    // Solo mejorar enlaces que no son solo texto
    if (link.querySelector('img, svg, .icon') || link.classList.contains('btn')) {
      link.classList.add('touch-target');
    }
  });
  
  // Mejorar controles de formulario
  const formControls = document.querySelectorAll('input[type="checkbox"], input[type="radio"], select');
  formControls.forEach(control => {
    control.classList.add('touch-target');
  });
}

/**
 * Configura gestos de deslizamiento (swipe)
 */
function setupSwipeGestures() {
  // Configurar navegación por pestañas con swipe
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabContents.length > 0) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(tabContent => {
      window.TouchGestures.register(tabContent, {
        swipeleft: function() {
          // Cambiar a la siguiente pestaña
          const currentTab = document.querySelector('.tab-btn.active');
          const nextTab = currentTab.nextElementSibling;
          
          if (nextTab && nextTab.classList.contains('tab-btn')) {
            nextTab.click();
          }
        },
        swiperight: function() {
          // Cambiar a la pestaña anterior
          const currentTab = document.querySelector('.tab-btn.active');
          const prevTab = currentTab.previousElementSibling;
          
          if (prevTab && prevTab.classList.contains('tab-btn')) {
            prevTab.click();
          }
        }
      });
    });
  }
  
  // Configurar navegación entre secciones con swipe
  const mainSections = document.querySelectorAll('main > .container > section');
  if (mainSections.length > 0) {
    mainSections.forEach(section => {
      if (!section.classList.contains('hidden')) {
        window.TouchGestures.register(section, {
          swipeup: function() {
            // Scroll suave hacia abajo
            window.scrollBy({
              top: window.innerHeight * 0.7,
              behavior: 'smooth'
            });
          },
          swipedown: function() {
            // Scroll suave hacia arriba
            window.scrollBy({
              top: -window.innerHeight * 0.7,
              behavior: 'smooth'
            });
          }
        });
      }
    });
  }
}

/**
 * Configura gestos de toque (tap)
 */
function setupTapGestures() {
  // Configurar doble tap para zoom en imágenes
  const images = document.querySelectorAll('img:not(.no-zoom)');
  images.forEach(img => {
    window.TouchGestures.register(img, {
      doubletap: function() {
        if (img.classList.contains('zoomed')) {
          // Quitar zoom
          img.classList.remove('zoomed');
          img.style.transform = '';
        } else {
          // Aplicar zoom
          img.classList.add('zoomed');
          img.style.transform = 'scale(1.5)';
          
          // Quitar zoom después de un tiempo o al tocar otra parte
          document.addEventListener('touchstart', function removeZoom(e) {
            if (e.target !== img) {
              img.classList.remove('zoomed');
              img.style.transform = '';
              document.removeEventListener('touchstart', removeZoom);
            }
          });
        }
      }
    });
  });
  
  // Configurar long press para mostrar menú contextual
  const longPressElements = document.querySelectorAll('.long-press-menu');
  longPressElements.forEach(element => {
    window.TouchGestures.register(element, {
      longpress: function(data) {
        // Mostrar menú contextual
        const menu = element.querySelector('.context-menu');
        if (menu) {
          menu.style.display = 'block';
          menu.style.left = `${data.x}px`;
          menu.style.top = `${data.y}px`;
          
          // Ocultar menú al tocar otra parte
          document.addEventListener('touchstart', function hideMenu(e) {
            if (!menu.contains(e.target)) {
              menu.style.display = 'none';
              document.removeEventListener('touchstart', hideMenu);
            }
          });
        }
      }
    });
  });
}

/**
 * Configura carruseles táctiles
 */
function setupCarousels() {
  // Buscar todos los carruseles
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    // Verificar si tiene los elementos necesarios
    const wrapper = carousel.querySelector('.carousel-wrapper');
    const items = carousel.querySelectorAll('.carousel-item');
    
    if (wrapper && items.length > 0) {
      // Crear carrusel táctil
      const carouselInstance = window.TouchGestures.createCarousel(carousel, {
        loop: carousel.hasAttribute('data-loop'),
        startIndex: parseInt(carousel.getAttribute('data-start-index') || '0', 10),
        onSlideChange: function(index) {
          // Actualizar indicadores
          const indicators = carousel.querySelectorAll('.carousel-indicator');
          indicators.forEach((indicator, i) => {
            if (i === index) {
              indicator.classList.add('active');
            } else {
              indicator.classList.remove('active');
            }
          });
        }
      });
      
      // Crear indicadores si no existen
      if (!carousel.querySelector('.carousel-indicators')) {
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        
        for (let i = 0; i < items.length; i++) {
          const indicator = document.createElement('div');
          indicator.className = 'carousel-indicator';
          if (i === 0) indicator.classList.add('active');
          
          // Añadir evento de clic
          indicator.addEventListener('click', () => {
            carouselInstance.goToSlide(i);
          });
          
          indicators.appendChild(indicator);
        }
        
        carousel.appendChild(indicators);
      }
      
      // Guardar instancia en el elemento
      carousel._carouselInstance = carouselInstance;
    }
  });
}

/**
 * Configura listas deslizables
 */
function setupSwipeLists() {
  // Buscar todos los elementos de lista deslizables
  const swipeListItems = document.querySelectorAll('.swipe-list-item');
  
  swipeListItems.forEach(item => {
    // Verificar si tiene los elementos necesarios
    const content = item.querySelector('.swipe-list-content');
    const actions = item.querySelector('.swipe-list-actions');
    
    if (content && actions) {
      // Crear elemento deslizable
      const swipeableInstance = window.TouchGestures.createSwipeable(content, {
        directions: ['left'], // Solo permitir deslizar hacia la izquierda
        snapThreshold: 0.3,
        onSwipeLeft: function() {
          // Mostrar acciones
          const actionsWidth = actions.offsetWidth;
          content.style.transform = `translateX(-${actionsWidth}px)`;
        }
      });
      
      // Añadir evento para cerrar al tocar fuera
      document.addEventListener('touchstart', function closeSwipe(e) {
        if (!item.contains(e.target) && content.style.transform !== '') {
          swipeableInstance.reset();
        }
      });
      
      // Guardar instancia en el elemento
      item._swipeableInstance = swipeableInstance;
    }
  });
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initTouchGestures,
    enhanceTouchElements,
    setupSwipeGestures,
    setupTapGestures,
    setupCarousels,
    setupSwipeLists
  };
}
