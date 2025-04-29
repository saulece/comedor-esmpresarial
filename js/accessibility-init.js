/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Inicialización de Accesibilidad
 * 
 * Este archivo inicializa todos los componentes de accesibilidad
 * y asegura que se carguen en el orden correcto.
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.info('[Accessibility] Inicializando componentes de accesibilidad...');
  
  // Inicializar componentes en el orden correcto
  initAccessibilityComponents();
  
  // Inicializar modo oscuro y crear botón de alternancia
  initDarkMode();
});

/**
 * Inicializa los componentes de accesibilidad en el orden correcto
 */
function initAccessibilityComponents() {
  // 1. Inicializar módulo básico de accesibilidad
  if (window.Accessibility) {
    window.Accessibility.init();
    console.info('[Accessibility] Módulo básico inicializado');
  } else {
    console.warn('[Accessibility] Módulo básico no encontrado');
  }
  
  // 2. Inicializar soporte para lectores de pantalla
  if (window.ScreenReaderSupport) {
    window.ScreenReaderSupport.init();
    console.info('[Accessibility] Soporte para lectores de pantalla inicializado');
  } else {
    console.warn('[Accessibility] Módulo de soporte para lectores de pantalla no encontrado');
  }
  
  // 3. Inicializar navegación por salto
  if (window.SkipNavigation) {
    window.SkipNavigation.init();
    console.info('[Accessibility] Navegación por salto inicializada');
  } else {
    console.warn('[Accessibility] Módulo de navegación por salto no encontrado');
  }
  
  // 4. Inicializar gestor de accesibilidad (integra todos los componentes)
  if (window.AccessibilityManager) {
    window.AccessibilityManager.init();
    console.info('[Accessibility] Gestor de accesibilidad inicializado');
  } else {
    console.warn('[Accessibility] Gestor de accesibilidad no encontrado');
  }
  
  // 5. Mejorar elementos existentes
  enhanceExistingElements();
}

/**
 * Mejora los elementos existentes en la página para accesibilidad
 */
function enhanceExistingElements() {
  // Identificar y mejorar landmarks principales
  setupMainLandmarks();
  
  // Mejorar tablas existentes
  enhanceTables();
  
  // Mejorar formularios existentes
  enhanceForms();
  
  // Mejorar modales existentes
  enhanceModals();
  
  console.info('[Accessibility] Elementos existentes mejorados');
}

/**
 * Configura los landmarks principales de la aplicación
 */
function setupMainLandmarks() {
  // Identificar contenido principal
  const mainContent = document.querySelector('main') || document.getElementById('main-content');
  if (mainContent) {
    if (!mainContent.hasAttribute('role')) {
      mainContent.setAttribute('role', 'main');
    }
    if (!mainContent.hasAttribute('id')) {
      mainContent.id = 'main-content';
    }
    if (!mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }
  }
  
  // Identificar navegación principal
  const mainNav = document.querySelector('nav') || document.getElementById('main-navigation');
  if (mainNav) {
    if (!mainNav.hasAttribute('role')) {
      mainNav.setAttribute('role', 'navigation');
    }
    if (!mainNav.hasAttribute('id')) {
      mainNav.id = 'main-navigation';
    }
    if (!mainNav.hasAttribute('aria-label')) {
      mainNav.setAttribute('aria-label', 'Navegación principal');
    }
  }
  
  // Identificar formulario de confirmación
  const confirmationForm = document.querySelector('form') || document.getElementById('confirmation-form');
  if (confirmationForm) {
    if (!confirmationForm.hasAttribute('id')) {
      confirmationForm.id = 'confirmation-form';
    }
    if (!confirmationForm.hasAttribute('aria-label')) {
      confirmationForm.setAttribute('aria-label', 'Formulario de confirmación');
    }
  }
  
  // Identificar menú semanal
  const weeklyMenu = document.getElementById('weekly-menu');
  if (weeklyMenu) {
    if (!weeklyMenu.hasAttribute('role')) {
      weeklyMenu.setAttribute('role', 'region');
    }
    if (!weeklyMenu.hasAttribute('aria-label')) {
      weeklyMenu.setAttribute('aria-label', 'Menú semanal');
    }
  }
  
  // Identificar panel de usuario
  const userDashboard = document.getElementById('user-dashboard');
  if (userDashboard) {
    if (!userDashboard.hasAttribute('role')) {
      userDashboard.setAttribute('role', 'region');
    }
    if (!userDashboard.hasAttribute('aria-label')) {
      userDashboard.setAttribute('aria-label', 'Panel de usuario');
    }
  }
}

/**
 * Mejora las tablas existentes para accesibilidad
 */
function enhanceTables() {
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    // Usar ScreenReaderSupport si está disponible
    if (window.ScreenReaderSupport) {
      window.ScreenReaderSupport.enhanceTable(table);
    } else {
      // Implementación básica
      if (!table.hasAttribute('role')) {
        table.setAttribute('role', 'table');
      }
      
      // Verificar si tiene caption
      if (!table.querySelector('caption')) {
        const tableTitle = table.getAttribute('aria-label') || 
                          table.getAttribute('title') || 
                          'Tabla de datos';
        
        const caption = document.createElement('caption');
        caption.className = 'sr-only'; // Solo visible para lectores de pantalla
        caption.textContent = tableTitle;
        
        if (table.firstChild) {
          table.insertBefore(caption, table.firstChild);
        } else {
          table.appendChild(caption);
        }
      }
      
      // Asegurar que las celdas de encabezado tengan scope
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        if (!header.hasAttribute('scope')) {
          // Determinar si es encabezado de fila o columna
          const isRowHeader = header.parentElement.tagName === 'TR' && 
                             Array.from(header.parentElement.children).indexOf(header) === 0;
          
          header.setAttribute('scope', isRowHeader ? 'row' : 'col');
        }
      });
    }
  });
}

/**
 * Mejora los formularios existentes para accesibilidad
 */
function enhanceForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Usar ScreenReaderSupport si está disponible
    if (window.ScreenReaderSupport) {
      window.ScreenReaderSupport.enhanceForm(form);
    } else {
      // Implementación básica
      // Verificar campos sin etiquetas
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit' && input.type !== 'reset' && input.type !== 'hidden') {
          const id = input.id;
          
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            
            if (!label) {
              console.warn(`[Accessibility] Campo sin etiqueta: ${id}`);
              
              // Crear etiqueta si tiene placeholder
              if (input.placeholder) {
                const newLabel = document.createElement('label');
                newLabel.setAttribute('for', id);
                newLabel.className = 'sr-only';
                newLabel.textContent = input.placeholder;
                
                input.parentNode.insertBefore(newLabel, input);
              }
            }
          } else {
            console.warn('[Accessibility] Campo sin ID:', input);
            
            // Generar ID y etiqueta si tiene placeholder
            if (input.placeholder) {
              const newId = `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              input.id = newId;
              
              const newLabel = document.createElement('label');
              newLabel.setAttribute('for', newId);
              newLabel.className = 'sr-only';
              newLabel.textContent = input.placeholder;
              
              input.parentNode.insertBefore(newLabel, input);
            }
          }
          
          // Marcar campos requeridos
          if (input.required && !input.hasAttribute('aria-required')) {
            input.setAttribute('aria-required', 'true');
          }
        }
      });
    }
  });
}

/**
 * Mejora los modales existentes para accesibilidad
 */
function enhanceModals() {
  const modals = document.querySelectorAll('.modal, [role="dialog"]');
  
  modals.forEach(modal => {
    // Usar ScreenReaderSupport si está disponible
    if (window.ScreenReaderSupport) {
      window.ScreenReaderSupport.enhanceModal(modal);
    } else {
      // Implementación básica
      if (!modal.hasAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }
      
      if (!modal.hasAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }
      
      // Buscar encabezado para usar como etiqueta
      const header = modal.querySelector('h1, h2, h3, h4, h5, h6');
      if (header) {
        if (!header.id) {
          header.id = `modal-title-${Date.now()}`;
        }
        modal.setAttribute('aria-labelledby', header.id);
      }
      
      // Buscar botón de cierre
      const closeButton = modal.querySelector('.close, .close-button, [data-dismiss="modal"]');
      if (closeButton && !closeButton.hasAttribute('aria-label')) {
        closeButton.setAttribute('aria-label', 'Cerrar');
      }
    }
  });
}

/**
 * Inicializa el modo oscuro y crea un botón de alternancia
 */
function initDarkMode() {
  if (window.DarkMode) {
    // Inicializar modo oscuro con detección automática de preferencias del sistema
    window.DarkMode.init({
      autoDetect: true,
      storageKey: 'darkModePreference'
    });
    
    // Crear botón de alternancia
    window.DarkMode.createToggleButton({
      position: 'fixed',
      darkIcon: '🌙',
      lightIcon: '☀️',
      ariaLabel: 'Alternar modo oscuro',
      className: 'dark-mode-toggle'
    });
    
    console.info('[Accessibility] Modo oscuro inicializado');
  } else {
    console.warn('[Accessibility] Módulo de modo oscuro no encontrado');
  }
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initAccessibilityComponents,
    enhanceExistingElements,
    setupMainLandmarks,
    enhanceTables,
    enhanceForms,
    enhanceModals,
    initDarkMode
  };
}
