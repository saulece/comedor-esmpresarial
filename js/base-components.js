/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Componentes Base
 * 
 * Este módulo proporciona componentes base reutilizables para
 * la nueva arquitectura basada en componentes.
 */

// Componentes base fundamentales
const BaseComponents = {
  // Inicializa y registra todos los componentes base
  init: function() {
    if (typeof ComponentSystem === 'undefined') {
      console.error('[BaseComponents] ComponentSystem no está disponible');
      return;
    }
    
    console.info('[BaseComponents] Inicializando componentes base');
    
    // Registrar todos los componentes
    this.registerAll();
  },
  
  // Registra todos los componentes en el sistema
  registerAll: function() {
    // Componentes de interfaz de usuario
    ComponentSystem.register('Card', this.Card);
    ComponentSystem.register('Alert', this.Alert);
    ComponentSystem.register('Modal', this.Modal);
    ComponentSystem.register('Tabs', this.Tabs);
    ComponentSystem.register('Table', this.Table);
    ComponentSystem.register('Form', this.Form);
    ComponentSystem.register('List', this.List);
    
    console.info('[BaseComponents] Componentes base registrados');
  },
  
  // Componente Card
  Card: {
    name: 'Card',
    
    render: function(el, props, state) {
      const { title, content, footer, variant, className } = props;
      
      el.className = `card ${variant ? 'card-' + variant : ''} ${className || ''}`;
      
      let html = '';
      
      if (title) {
        html += `<div class="card-header">${title}</div>`;
      }
      
      html += `<div class="card-body">${content || ''}</div>`;
      
      if (footer) {
        html += `<div class="card-footer">${footer}</div>`;
      }
      
      el.innerHTML = html;
    },
    
    onInit: function(el, props, state) {
      // Inicialización opcional
    },
    
    afterRender: function(el, props, state) {
      // Acciones después del renderizado
    },
    
    onDestroy: function(el, state) {
      // Limpieza de recursos
    }
  },
  
  // Componente Alert
  Alert: {
    name: 'Alert',
    
    render: function(el, props, state) {
      const { message, type, dismissible, autoClose, className } = props;
      
      el.className = `alert alert-${type || 'info'} ${dismissible ? 'alert-dismissible' : ''} ${className || ''}`;
      
      let html = message || '';
      
      if (dismissible) {
        html += `<button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
          <span aria-hidden="true">&times;</span>
        </button>`;
      }
      
      el.innerHTML = html;
      
      // Configurar auto-cierre si es necesario
      if (autoClose && !state.autoCloseSet) {
        setTimeout(() => {
          el.classList.add('fade-out');
          setTimeout(() => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }, 300);
        }, autoClose);
        
        // Actualizar estado para evitar configurar múltiples timers
        state.autoCloseSet = true;
      }
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.autoCloseSet = false;
    },
    
    afterRender: function(el, props, state) {
      // Configurar evento de cierre
      const closeBtn = el.querySelector('.close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          el.classList.add('fade-out');
          setTimeout(() => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }, 300);
        });
      }
    }
  },
  
  // Componente Modal
  Modal: {
    name: 'Modal',
    
    render: function(el, props, state) {
      const { id, title, content, footer, size, className } = props;
      
      el.className = `modal-wrapper ${className || ''}`;
      el.setAttribute('aria-hidden', !state.isOpen);
      
      const modalSize = size ? `modal-${size}` : 'modal-md';
      
      el.innerHTML = `
        <div class="modal-backdrop ${state.isOpen ? 'show' : ''}"></div>
        <div class="modal ${state.isOpen ? 'show' : ''}" id="${id || 'modal-' + Date.now()}" tabindex="-1" role="dialog">
          <div class="modal-dialog ${modalSize}" role="document">
            <div class="modal-content">
              ${title ? `<div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Cerrar">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>` : ''}
              
              <div class="modal-body">
                ${content || ''}
              </div>
              
              ${footer ? `<div class="modal-footer">
                ${footer}
              </div>` : ''}
            </div>
          </div>
        </div>
      `;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.isOpen = props.isOpen || false;
    },
    
    afterRender: function(el, props, state) {
      // Configurar eventos
      const closeBtn = el.querySelector('.close');
      const backdrop = el.querySelector('.modal-backdrop');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.close(el, state);
          
          // Ejecutar callback de cierre si existe
          if (typeof props.onClose === 'function') {
            props.onClose();
          }
        });
      }
      
      if (backdrop && props.backdropClose !== false) {
        backdrop.addEventListener('click', () => {
          this.close(el, state);
          
          // Ejecutar callback de cierre si existe
          if (typeof props.onClose === 'function') {
            props.onClose();
          }
        });
      }
      
      // Manejar tecla ESC
      if (state.isOpen && !state.keyListenerSet) {
        document.addEventListener('keydown', this._handleEscKey = (e) => {
          if (e.key === 'Escape' && state.isOpen) {
            this.close(el, state);
            
            // Ejecutar callback de cierre si existe
            if (typeof props.onClose === 'function') {
              props.onClose();
            }
          }
        });
        
        state.keyListenerSet = true;
      }
      
      // Bloquear scroll del body cuando el modal está abierto
      if (state.isOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      if (state.keyListenerSet) {
        document.removeEventListener('keydown', this._handleEscKey);
      }
      
      // Restaurar scroll del body
      document.body.classList.remove('modal-open');
    },
    
    // Métodos adicionales
    open: function(el, state) {
      state.isOpen = true;
      ComponentSystem.updateComponentState(el.dataset.componentId, { isOpen: true });
    },
    
    close: function(el, state) {
      state.isOpen = false;
      ComponentSystem.updateComponentState(el.dataset.componentId, { isOpen: false });
    }
  },
  
  // Componente Tabs
  Tabs: {
    name: 'Tabs',
    
    render: function(el, props, state) {
      const { tabs, className, variant } = props;
      
      if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
        el.innerHTML = '<div class="alert alert-warning">No hay pestañas para mostrar</div>';
        return;
      }
      
      el.className = `tabs-container ${className || ''}`;
      
      // Determinar la pestaña activa
      const activeIndex = state.activeIndex !== undefined ? state.activeIndex : 
                         tabs.findIndex(tab => tab.active) || 0;
      
      // Generar HTML de las pestañas
      let html = `
        <div class="tabs ${variant ? 'tabs-' + variant : ''}">
          <div class="tab-buttons">
      `;
      
      // Botones de pestañas
      tabs.forEach((tab, index) => {
        const isActive = index === activeIndex;
        html += `
          <button class="tab-btn ${isActive ? 'active' : ''}" data-tab-index="${index}">
            ${tab.icon ? `<i class="${tab.icon}"></i> ` : ''}${tab.title || `Pestaña ${index + 1}`}
          </button>
        `;
      });
      
      html += `
          </div>
          <div class="tab-contents">
      `;
      
      // Contenido de pestañas
      tabs.forEach((tab, index) => {
        const isActive = index === activeIndex;
        html += `
          <div class="tab-content ${isActive ? 'active' : ''}" data-tab-content="${index}">
            ${tab.content || ''}
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
      
      el.innerHTML = html;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.activeIndex = props.activeIndex || 0;
    },
    
    afterRender: function(el, props, state) {
      // Configurar eventos de click en las pestañas
      const tabButtons = el.querySelectorAll('.tab-btn');
      
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tabIndex = parseInt(button.dataset.tabIndex, 10);
          
          // Actualizar estado
          state.activeIndex = tabIndex;
          ComponentSystem.updateComponentState(el.dataset.componentId, { activeIndex: tabIndex });
          
          // Ejecutar callback si existe
          if (typeof props.onTabChange === 'function') {
            props.onTabChange(tabIndex, props.tabs[tabIndex]);
          }
        });
      });
    }
  },
  
  // Componente Table (con soporte para renderizado virtual)
  Table: {
    name: 'Table',
    
    render: function(el, props, state) {
      const { headers, rows, className, striped, bordered, hover, responsive } = props;
      
      el.className = `table-container ${className || ''}`;
      
      if (!headers || !rows) {
        el.innerHTML = '<div class="alert alert-warning">No hay datos para mostrar</div>';
        return;
      }
      
      // Determinar si usar renderizado virtual
      const useVirtual = props.virtualScroll && rows.length > (props.virtualThreshold || 50);
      
      if (useVirtual && !state.virtualRenderer) {
        // Configurar para renderizado virtual
        el.innerHTML = `
          <div class="table-responsive">
            <div class="virtual-table-container" style="height: ${props.height || '400px'}"></div>
          </div>
        `;
        
        // El renderizador virtual se creará en afterRender
        return;
      }
      
      if (useVirtual && state.virtualRenderer) {
        // Actualizar datos del renderizador virtual
        return;
      }
      
      // Renderizado normal (no virtual)
      const tableClasses = [
        'table',
        striped ? 'table-striped' : '',
        bordered ? 'table-bordered' : '',
        hover ? 'table-hover' : ''
      ].filter(Boolean).join(' ');
      
      let html = `
        <div class="${responsive ? 'table-responsive' : ''}">
          <table class="${tableClasses}">
            <thead>
              <tr>
      `;
      
      // Encabezados
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      
      html += `
              </tr>
            </thead>
            <tbody>
      `;
      
      // Filas
      rows.forEach(row => {
        html += '<tr>';
        
        // Celdas
        row.forEach(cell => {
          html += `<td>${cell}</td>`;
        });
        
        html += '</tr>';
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      el.innerHTML = html;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.virtualRenderer = null;
    },
    
    afterRender: function(el, props, state) {
      const { headers, rows } = props;
      
      // Configurar renderizado virtual si es necesario
      if (props.virtualScroll && rows.length > (props.virtualThreshold || 50) && !state.virtualRenderer) {
        const container = el.querySelector('.virtual-table-container');
        
        if (container && typeof ComponentSystem.createVirtualRenderer === 'function') {
          // Crear renderizador virtual
          state.virtualRenderer = ComponentSystem.createVirtualRenderer({
            container,
            items: rows,
            itemHeight: props.rowHeight || 40,
            overscan: props.overscan || 5,
            
            // Función para renderizar cada fila
            renderItem: (row, index) => {
              const rowEl = document.createElement('div');
              rowEl.className = 'virtual-table-row';
              
              let html = '<div class="virtual-table-cells">';
              
              // Renderizar celdas
              row.forEach((cell, cellIndex) => {
                const width = props.columnWidths && props.columnWidths[cellIndex] 
                  ? props.columnWidths[cellIndex] 
                  : `${100 / row.length}%`;
                
                html += `<div class="virtual-table-cell" style="width: ${width}">${cell}</div>`;
              });
              
              html += '</div>';
              rowEl.innerHTML = html;
              
              return rowEl;
            }
          });
          
          // Agregar encabezados fijos
          const headerRow = document.createElement('div');
          headerRow.className = 'virtual-table-header';
          
          let headerHtml = '<div class="virtual-table-cells">';
          
          // Renderizar celdas de encabezado
          headers.forEach((header, index) => {
            const width = props.columnWidths && props.columnWidths[index] 
              ? props.columnWidths[index] 
              : `${100 / headers.length}%`;
            
            headerHtml += `<div class="virtual-table-cell" style="width: ${width}">${header}</div>`;
          });
          
          headerHtml += '</div>';
          headerRow.innerHTML = headerHtml;
          
          // Insertar encabezados antes del contenedor virtual
          container.parentNode.insertBefore(headerRow, container);
          
          // Agregar estilos inline si no existen
          if (!document.getElementById('virtual-table-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'virtual-table-styles';
            styleEl.textContent = `
              .virtual-table-container {
                overflow-y: auto;
                position: relative;
              }
              .virtual-table-header {
                position: sticky;
                top: 0;
                background-color: #f8f9fa;
                font-weight: bold;
                border-bottom: 2px solid #dee2e6;
                z-index: 1;
              }
              .virtual-table-row {
                border-bottom: 1px solid #dee2e6;
              }
              .virtual-table-cells {
                display: flex;
                width: 100%;
              }
              .virtual-table-cell {
                padding: 8px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            `;
            document.head.appendChild(styleEl);
          }
        }
      } else if (state.virtualRenderer && props.virtualScroll) {
        // Actualizar datos del renderizador virtual
        state.virtualRenderer.setItems(rows);
      }
    },
    
    onDestroy: function(el, state) {
      // Destruir renderizador virtual si existe
      if (state.virtualRenderer) {
        state.virtualRenderer.destroy();
        state.virtualRenderer = null;
      }
    }
  }
};

// Exportar el objeto BaseComponents
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseComponents;
}
