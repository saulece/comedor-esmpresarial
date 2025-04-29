/**
 * Aplicación principal del Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo principal de la aplicación
 */

// Objeto principal de la aplicación
const App = {
  // Estado de inicialización
  initialized: false,
  
  // Módulos cargados
  loadedModules: {},
  
  /**
   * Inicializa la aplicación
   */
  init: function() {
    console.log('[App] Inicializando aplicación...');
    
    // Inicializar analizador de rendimiento UI
    if (typeof UIPerformanceAnalyzer !== 'undefined') {
      UIPerformanceAnalyzer.init();
    }
    
    // Integrar optimizadores con el sistema de componentes
    this.setupOptimizers();
    
    // Inicializar sistema de componentes
    if (typeof ComponentSystem !== 'undefined') {
      ComponentSystem.init();
    }
    
    // Inicializar módulo de accesibilidad
    if (typeof Accessibility !== 'undefined') {
      Accessibility.init({
        focusVisible: true,
        announceChanges: true
      });
      
      // Crear atajos de teclado para accesibilidad
      this._setupAccessibilityShortcuts();
    }
    
    // Inicializar soporte para lectores de pantalla
    if (typeof ScreenReaderSupport !== 'undefined') {
      ScreenReaderSupport.init({
        ariaLivePolite: true,
        ariaLiveAssertive: true,
        keyboardNavigation: true,
        focusTrap: true
      });
      
      // Mejorar componentes existentes para accesibilidad
      this._enhanceComponentsForAccessibility();
    }
    
    // Integrar sistema de layout responsivo
    this._integrateResponsiveLayout();
    
    // Inicializar autenticación
    this.initAuth();
    
    // Inicializar almacenamiento
    this.initStorage();
    
    // Inicializar módulos
    this.initModules();
    
    // Configurar eventos globales
    this.setupEvents();
    
    // Inicializar notificaciones
    this.initNotifications();
    
    // Disparar evento de inicialización completa
    document.dispatchEvent(new CustomEvent('app:initialized'));
    
    console.log('[App] Aplicación inicializada correctamente');
  },
  
  /**
   * Configurar optimizadores de DOM y renderizado
   */
  setupOptimizers: function() {
    console.log('[App] Configurando optimizadores de rendimiento...');
    
    // Integrar DOMOptimizer con el sistema de componentes
    if (typeof DOMOptimizer !== 'undefined' && typeof ComponentSystem !== 'undefined') {
      // Extender el método de creación de componentes para usar DOMOptimizer
      const originalCreateComponent = ComponentSystem.createComponent;
      ComponentSystem.createComponent = function(type, props = {}) {
        // Usar createElement optimizado si está disponible
        if (props.optimizeDOM !== false) {
          const component = originalCreateComponent.call(this, type, props);
          
          // Aplicar optimizaciones al componente creado
          if (component && component.element) {
            // Marcar elementos que deberían tener renderizado diferido
            if (props.deferRender) {
              component.element.classList.add('defer-render');
            }
            
            // Aplicar optimizaciones para componentes pesados
            if (props.heavyComponent) {
              component.element.classList.add('optimize-paint');
            }
          }
          
          return component;
        }
        
        return originalCreateComponent.call(this, type, props);
      };
      
      // Optimizar método de actualización de componentes
      if (ComponentSystem.BaseComponent) {
        const originalUpdateMethod = ComponentSystem.BaseComponent.prototype.update;
        ComponentSystem.BaseComponent.prototype.update = function(newProps = {}) {
          // Usar actualización por lotes para minimizar reflows
          if (this.props.optimizeDOM !== false && DOMOptimizer) {
            DOMOptimizer.batchUpdate(() => {
              originalUpdateMethod.call(this, newProps);
            });
            return this;
          }
          
          return originalUpdateMethod.call(this, newProps);
        };
      }
    }
    
    // Integrar RenderOptimizer con el sistema de componentes
    if (typeof RenderOptimizer !== 'undefined' && typeof ComponentSystem !== 'undefined') {
      // Optimizar renderizado de listas
      if (ComponentSystem.ListComponent) {
        const originalRenderMethod = ComponentSystem.ListComponent.prototype.render;
        ComponentSystem.ListComponent.prototype.render = function() {
          // Usar renderizado optimizado para listas
          if (this.props.items && this.props.items.length > 0 && RenderOptimizer) {
            const container = this.element;
            const items = this.props.items;
            const renderItem = this.renderItem.bind(this);
            
            // Usar renderizado virtual para listas grandes
            if (items.length > 50 && this.props.virtualList !== false) {
              RenderOptimizer.renderList(items, renderItem, container, {
                virtual: true,
                itemHeight: this.props.itemHeight || 50,
                keyFn: this.props.keyFn || (item => item.id || null)
              });
              return this;
            }
            
            // Usar renderizado por lotes para listas medianas
            if (items.length > 10) {
              RenderOptimizer.renderList(items, renderItem, container, {
                batchSize: this.props.batchSize || 20,
                keyFn: this.props.keyFn || (item => item.id || null)
              });
              return this;
            }
          }
          
          // Fallback al método original
          return originalRenderMethod.call(this);
        };
      }
      
      // Optimizar componentes de tabla
      if (ComponentSystem.TableComponent) {
        const originalRenderMethod = ComponentSystem.TableComponent.prototype.render;
        ComponentSystem.TableComponent.prototype.render = function() {
          // Usar renderizado optimizado para tablas grandes
          if (this.props.data && this.props.data.length > 20 && RenderOptimizer) {
            // Implementar renderizado virtual para tablas grandes
            this.element.classList.add('optimize-table');
            
            // Observar visibilidad para renderizado diferido
            if (!this._isObserved) {
              RenderOptimizer.observeElement(this.element, {
                once: true,
                onVisible: () => {
                  originalRenderMethod.call(this);
                }
              });
              this._isObserved = true;
              return this;
            }
          }
          
          // Fallback al método original
          return originalRenderMethod.call(this);
        };
      }
    }
    
    // Inicializar componentes de renderizado virtual
    this._initVirtualComponents();
    
    // Optimizar Components.js existente (si está disponible)
    if (typeof Components !== 'undefined') {
      // Optimizar creación de tablas
      const originalCreateTable = Components.createTable;
      Components.createTable = function(options) {
        // Para tablas pequeñas, usar el método original
        if (!options.data || options.data.length <= 50 || !DOMOptimizer) {
          return originalCreateTable.call(this, options);
        }
        
        // Para tablas grandes, usar renderizado optimizado
        return DOMOptimizer.batchUpdate(() => {
          const table = originalCreateTable.call(Components, options);
          
          // Aplicar optimizaciones adicionales
          if (table) {
            table.classList.add('optimize-paint');
            
            // Optimizar eventos de scroll en tablas grandes
            const tableBody = table.querySelector('tbody');
            if (tableBody) {
              tableBody.addEventListener('scroll', DOMOptimizer.throttle(function() {
                // Manejar scroll optimizado
              }, 16), { passive: true });
            }
          }
          
          return table;
        });
      };
      
      // Optimizar creación de modales
      const originalCreateModal = Components.createModal;
      Components.createModal = function(options) {
        // Usar creación optimizada
        if (DOMOptimizer) {
          return DOMOptimizer.batchUpdate(() => {
            const modal = originalCreateModal.call(Components, options);
            
            // Aplicar optimizaciones adicionales
            if (modal) {
              modal.classList.add('optimize-composite');
            }
            
            return modal;
          });
        }
        
        return originalCreateModal.call(this, options);
      };
    }
  },
  
  /**
   * Inicializa componentes de renderizado virtual
   * @private
   */
  _initVirtualComponents: function() {
    console.log('[App] Inicializando componentes de renderizado virtual...');
    
    // Inicializar VirtualRenderer si está disponible
    if (typeof VirtualRenderer !== 'undefined') {
      VirtualRenderer.init({
        itemHeight: 50,
        overscanCount: 5,
        mobileOptimizations: true
      });
    }
    
    // Extender Components con métodos para crear componentes virtuales
    if (typeof Components !== 'undefined') {
      // Añadir método para crear tablas virtuales
      Components.createVirtualTable = function(options) {
        const container = document.createElement('div');
        container.className = 'virtual-table-container';
        
        if (options.containerId) {
          const parent = document.getElementById(options.containerId);
          if (parent) {
            parent.appendChild(container);
          }
        }
        
        if (typeof VirtualTable !== 'undefined') {
          return VirtualTable.create(container, options);
        }
        
        // Fallback a tabla normal si no está disponible VirtualTable
        return Components.createTable(options);
      };
      
      // Añadir método para crear listas virtuales
      Components.createVirtualList = function(options) {
        const container = document.createElement('div');
        container.className = 'virtual-list-container';
        
        if (options.containerId) {
          const parent = document.getElementById(options.containerId);
          if (parent) {
            parent.appendChild(container);
          }
        }
        
        if (typeof VirtualList !== 'undefined') {
          return VirtualList.create(container, options);
        }
        
        // Fallback a lista normal si no está disponible VirtualList
        const list = document.createElement('ul');
        container.appendChild(list);
        
        if (options.items && Array.isArray(options.items)) {
          options.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.text || item.name || item.title || JSON.stringify(item);
            list.appendChild(li);
          });
        }
        
        return {
          container,
          list,
          setItems: function(items) {
            list.innerHTML = '';
            if (items && Array.isArray(items)) {
              items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.text || item.name || item.title || JSON.stringify(item);
                list.appendChild(li);
              });
            }
          }
        };
      };
      
      // Mejorar método existente de creación de tablas para usar tablas virtuales automáticamente
      const originalCreateTable = Components.createTable;
      Components.createTable = function(options) {
        // Usar tabla virtual para conjuntos grandes de datos
        if (options.data && options.data.length > 100 && typeof VirtualTable !== 'undefined') {
          return Components.createVirtualTable(options);
        }
        
        // Usar tabla normal para conjuntos pequeños de datos
        return originalCreateTable.call(this, options);
      };
    }
    
    // Integrar con ComponentSystem si está disponible
    if (typeof ComponentSystem !== 'undefined') {
      // Registrar componentes virtuales
      ComponentSystem.registerComponent('virtualList', function(props) {
        const component = this.createBaseComponent('div', props);
        component.element.className = 'virtual-list-container';
        
        // Crear lista virtual
        if (typeof VirtualList !== 'undefined') {
          component.virtualList = VirtualList.create(component.element, {
            items: props.items || [],
            itemHeight: props.itemHeight || 50,
            itemTemplate: props.itemTemplate,
            enableSelection: props.enableSelection !== false,
            onItemClick: props.onItemClick,
            onSelectionChange: props.onSelectionChange
          });
          
          // Añadir métodos al componente
          component.setItems = function(items) {
            this.virtualList.setItems(items);
            return this;
          };
          
          component.getSelectedItems = function() {
            return this.virtualList.getSelectedItems();
          };
          
          component.selectItem = function(index, selected) {
            this.virtualList.selectItem(index, selected);
            return this;
          };
          
          component.refresh = function() {
            this.virtualList.refresh();
            return this;
          };
          
          // Método de limpieza
          component.destroy = function() {
            if (this.virtualList) {
              this.virtualList.destroy();
            }
            this.element.remove();
          };
        }
        
        return component;
      });
      
      // Registrar componente de tabla virtual
      ComponentSystem.registerComponent('virtualTable', function(props) {
        const component = this.createBaseComponent('div', props);
        component.element.className = 'virtual-table-container';
        
        // Crear tabla virtual
        if (typeof VirtualTable !== 'undefined') {
          component.virtualTable = VirtualTable.create(component.element, {
            data: props.data || [],
            columns: props.columns || [],
            rowHeight: props.rowHeight || 40,
            enableSelection: props.enableSelection !== false,
            enableSorting: props.enableSorting !== false,
            enableFiltering: props.enableFiltering !== false,
            onSelectionChange: props.onSelectionChange
          });
          
          // Añadir métodos al componente
          component.setData = function(data) {
            this.virtualTable.setData(data);
            return this;
          };
          
          component.getSelectedRows = function() {
            return this.virtualTable.getSelectedRows();
          };
          
          component.selectRow = function(index, selected) {
            this.virtualTable.selectRow(index, selected);
            return this;
          };
          
          component.sort = function(columnId, direction) {
            this.virtualTable.sort(columnId, direction);
            return this;
          };
          
          component.filter = function(filterText) {
            this.virtualTable.filter(filterText);
            return this;
          };
          
          component.refresh = function() {
            this.virtualTable.refresh();
            return this;
          };
          
          // Método de limpieza
          component.destroy = function() {
            if (this.virtualTable) {
              this.virtualTable.destroy();
            }
            this.element.remove();
          };
        }
        
        return component;
      });
    }
  },
  
  /**
   * Integra el sistema de layout responsivo con la aplicación
   * @private
   */
  _integrateResponsiveLayout: function() {
    console.log('[App] Integrando sistema de layout responsivo...');
    
    // Verificar si el sistema de layout responsivo está disponible
    if (typeof ResponsiveLayout === 'undefined') {
      console.warn('[App] Sistema de layout responsivo no disponible');
      return;
    }
    
    // Integrar con el sistema de componentes
    if (typeof ComponentSystem !== 'undefined') {
      // Extender el método de creación de componentes para aplicar clases responsivas
      const originalCreateComponent = ComponentSystem.createComponent;
      ComponentSystem.createComponent = function(type, props = {}) {
        // Crear componente normalmente
        const component = originalCreateComponent.call(this, type, props);
        
        // Aplicar clases responsivas si están definidas
        if (component && component.element) {
          // Aplicar clases de visibilidad responsiva
          if (props.hideXs) component.element.classList.add('hide-xs');
          if (props.hideSm) component.element.classList.add('hide-sm');
          if (props.hideMd) component.element.classList.add('hide-md');
          if (props.hideLg) component.element.classList.add('hide-lg');
          if (props.hideXl) component.element.classList.add('hide-xl');
          
          // Aplicar clases de orientación
          if (props.hidePortrait) component.element.classList.add('hide-portrait');
          if (props.hideLandscape) component.element.classList.add('hide-landscape');
          
          // Aplicar clases de layout
          if (props.container) component.element.classList.add(props.fluid ? 'container-fluid' : 'container');
          if (props.row) component.element.classList.add('row');
          if (props.noGutters) component.element.classList.add('no-gutters');
          
          // Aplicar clases de columnas
          if (props.col) {
            if (props.col === true) {
              component.element.classList.add('col');
            } else if (typeof props.col === 'object') {
              // Columnas responsivas
              if (props.col.xs) component.element.classList.add(`col-xs-${props.col.xs}`);
              if (props.col.sm) component.element.classList.add(`col-sm-${props.col.sm}`);
              if (props.col.md) component.element.classList.add(`col-md-${props.col.md}`);
              if (props.col.lg) component.element.classList.add(`col-lg-${props.col.lg}`);
              if (props.col.xl) component.element.classList.add(`col-xl-${props.col.xl}`);
            } else {
              component.element.classList.add(`col-${props.col}`);
            }
          }
          
          // Aplicar clases de orden
          if (props.order) {
            if (typeof props.order === 'object') {
              // Orden responsivo
              if (props.order.xs) component.element.classList.add(`order-xs-${props.order.xs}`);
              if (props.order.sm) component.element.classList.add(`order-sm-${props.order.sm}`);
              if (props.order.md) component.element.classList.add(`order-md-${props.order.md}`);
              if (props.order.lg) component.element.classList.add(`order-lg-${props.order.lg}`);
              if (props.order.xl) component.element.classList.add(`order-xl-${props.order.xl}`);
            } else {
              component.element.classList.add(`order-${props.order}`);
            }
          }
          
          // Aplicar clases para modo compacto
          if (props.compactHide) component.element.classList.add('compact-hide');
          if (props.compactRow) component.element.classList.add('compact-row');
          if (props.compactSpacing) component.element.classList.add('compact-spacing');
          if (props.compactText) component.element.classList.add('compact-text');
          if (props.compactHeading) component.element.classList.add('compact-heading');
        }
        
        return component;
      };
      
      // Añadir métodos para crear componentes de layout
      ComponentSystem.createContainer = function(props = {}) {
        return this.createComponent('div', {
          ...props,
          container: true,
          fluid: props.fluid || false
        });
      };
      
      ComponentSystem.createRow = function(props = {}) {
        return this.createComponent('div', {
          ...props,
          row: true,
          noGutters: props.noGutters || false
        });
      };
      
      ComponentSystem.createColumn = function(props = {}) {
        return this.createComponent('div', {
          ...props,
          col: props.col || props.size || true
        });
      };
    }
    
    // Integrar con Components.js existente
    if (typeof Components !== 'undefined') {
      // Añadir métodos para crear componentes de layout
      Components.createContainer = function(options = {}) {
        return ResponsiveLayout.createContainer(options);
      };
      
      Components.createRow = function(options = {}) {
        return ResponsiveLayout.createRow(options);
      };
      
      Components.createColumn = function(options = {}) {
        return ResponsiveLayout.createColumn(options);
      };
      
      // Mejorar métodos existentes para ser responsivos
      const originalCreateCard = Components.createCard;
      Components.createCard = function(options = {}) {
        const card = originalCreateCard.call(this, options);
        
        // Hacer la tarjeta responsiva
        card.classList.add('card-responsive');
        
        // Aplicar clases para modo compacto si es necesario
        if (ResponsiveLayout && ResponsiveLayout.isUltraCompact()) {
          const cardHeader = card.querySelector('.card-header');
          const cardBody = card.querySelector('.card-body');
          
          if (cardHeader) cardHeader.classList.add('compact-spacing');
          if (cardBody) cardBody.classList.add('compact-spacing');
        }
        
        return card;
      };
      
      const originalCreateTable = Components.createTable;
      Components.createTable = function(options = {}) {
        // Si no es una tabla virtual, hacerla responsiva
        if (!options.virtual) {
          const tableWrapper = document.createElement('div');
          tableWrapper.className = 'table-responsive';
          
          const table = originalCreateTable.call(this, options);
          tableWrapper.appendChild(table);
          
          // Aplicar clases para modo compacto si es necesario
          if (ResponsiveLayout && ResponsiveLayout.isUltraCompact()) {
            table.classList.add('compact-table');
          }
          
          return tableWrapper;
        }
        
        return originalCreateTable.call(this, options);
      };
    }
    
    // Registrar la aplicación como elemento responsivo
    if (ResponsiveLayout) {
      ResponsiveLayout.registerResponsiveElement({
        updateLayout: (state) => {
          // Actualizar la interfaz según el estado del layout
          this._updateLayoutBasedOnState(state);
        }
      });
    }
  },
  
  /**
   * Actualiza la interfaz según el estado del layout
   * @param {Object} state - Estado del layout
   * @private
   */
  _updateLayoutBasedOnState: function(state) {
    // Aplicar optimizaciones según el modo de layout
    if (state.layoutMode === 'ultra-compact') {
      // Modo ultra-compacto (móviles pequeños)
      document.querySelectorAll('.compact-hide').forEach(el => {
        el.style.display = 'none';
      });
      
      document.querySelectorAll('table:not(.compact-table)').forEach(el => {
        el.classList.add('compact-table');
      });
      
      document.querySelectorAll('.card:not(.compact-spacing)').forEach(el => {
        const cardHeader = el.querySelector('.card-header');
        const cardBody = el.querySelector('.card-body');
        
        if (cardHeader) cardHeader.classList.add('compact-spacing');
        if (cardBody) cardBody.classList.add('compact-spacing');
      });
    } else if (state.layoutMode === 'compact') {
      // Modo compacto (móviles)
      document.querySelectorAll('.compact-hide').forEach(el => {
        el.style.display = '';
      });
    } else {
      // Modo normal (tablets y escritorio)
      document.querySelectorAll('.compact-hide').forEach(el => {
        el.style.display = '';
      });
    }
  },
  
  /**
   * Inicializa el sistema de autenticación
   * @returns {Promise}
   */
  initAuth: function() {
    return new Promise((resolve, reject) => {
      if (typeof Auth !== 'undefined') {
        try {
          Auth.init();
          console.log('Sistema de autenticación inicializado correctamente');
          resolve();
        } catch (error) {
          console.error('Error al inicializar el sistema de autenticación:', error);
          reject(error);
        }
      } else {
        // Cargar módulo de autenticación dinámicamente
        ModuleLoader.loadScript('js/auth.js')
          .then(() => {
            Auth.init();
            console.log('Sistema de autenticación cargado e inicializado correctamente');
            resolve();
          })
          .catch(reject);
      }
    });
  },
  
  /**
   * Inicializa el sistema de almacenamiento
   * @returns {Promise}
   */
  initStorage: function() {
    return new Promise((resolve, reject) => {
      // Verificar si el sistema de almacenamiento ya está cargado
      if (typeof StorageManager !== 'undefined') {
        try {
          StorageManager.init();
          console.log('Sistema de gestión de almacenamiento inicializado correctamente');
          resolve();
        } catch (error) {
          console.error('Error al inicializar el sistema de gestión de almacenamiento:', error);
          reject(error);
        }
      } else {
        // Cargar módulos de almacenamiento dinámicamente
        ModuleLoader.loadModuleGroup('storage')
          .then(() => {
            StorageManager.init();
            console.log('Sistema de gestión de almacenamiento cargado e inicializado correctamente');
            resolve();
          })
          .catch(error => {
            console.error('Error al cargar e inicializar el sistema de almacenamiento:', error);
            reject(error);
          });
      }
    });
  },
  
  /**
   * Inicializa los módulos principales de la aplicación
   * @returns {Promise}
   */
  initModules: function() {
    return new Promise((resolve, reject) => {
      // Determinar qué módulos cargar según el rol del usuario
      const currentUser = Auth.getCurrentUser();
      const userRole = currentUser ? currentUser.role : null;
      
      if (userRole === 'admin') {
        // Cargar módulos de administrador
        ModuleLoader.loadScript('js/admin.js')
          .then(() => {
            Admin.init();
            console.log('Módulo de administrador inicializado correctamente');
            resolve();
          })
          .catch(reject);
      } else if (userRole === 'coordinator') {
        // Cargar módulos de coordinador
        ModuleLoader.loadScript('js/coordinator.js')
          .then(() => {
            Coordinator.init();
            console.log('Módulo de coordinador inicializado correctamente');
            resolve();
          })
          .catch(reject);
      } else {
        // Usuario no autenticado, no cargar módulos adicionales
        resolve();
      }
    });
  },
  
  /**
   * Configura eventos globales
   */
  setupEvents: function() {
    // Configurar eventos globales aquí
  },
  
  /**
   * Inicializa el sistema de notificaciones
   */
  initNotifications: function() {
    // Inicializar sistema de notificaciones aquí
  },
  
  /**
   * Inicializa el sistema de componentes
   * @returns {Promise}
   */
  initComponentSystem: function() {
    return new Promise((resolve, reject) => {
      // Verificar si el sistema de componentes ya está cargado
      if (typeof ComponentSystem !== 'undefined') {
        try {
          // Inicializar sistema de componentes base
          ComponentSystem.init({
            enableCaching: true,
            enableLazyLoading: true,
            enableVirtualRendering: true
          });
          
          // Cargar e inicializar componentes base
          this.loadComponentModules()
            .then(() => {
              console.log('Sistema de componentes inicializado correctamente');
              resolve();
            })
            .catch(reject);
        } catch (error) {
          console.error('Error al inicializar el sistema de componentes:', error);
          reject(error);
        }
      } else {
        // Cargar el sistema de componentes dinámicamente
        ModuleLoader.loadScript('js/component-system.js')
          .then(() => {
            // Inicializar sistema de componentes
            ComponentSystem.init({
              enableCaching: true,
              enableLazyLoading: true,
              enableVirtualRendering: true
            });
            
            // Cargar e inicializar componentes base
            return this.loadComponentModules();
          })
          .then(() => {
            console.log('Sistema de componentes cargado e inicializado correctamente');
            resolve();
          })
          .catch(reject);
      }
    });
  },
  
  /**
   * Carga e inicializa los módulos de componentes
   * @returns {Promise}
   */
  loadComponentModules: function() {
    return new Promise((resolve, reject) => {
      // Cargar módulos de componentes
      Promise.all([
        ModuleLoader.loadScript('js/base-components.js'),
        ModuleLoader.loadScript('js/form-components.js'),
        ModuleLoader.loadScript('js/components.js')
      ])
      .then(() => {
        // Inicializar componentes base
        if (typeof BaseComponents !== 'undefined') {
          BaseComponents.init();
        }
        
        // Inicializar componentes de formulario
        if (typeof FormComponents !== 'undefined') {
          FormComponents.init();
        }
        
        resolve();
      })
      .catch(reject);
    });
  },
  
  /**
        // Cargar módulo de autenticación dinámicamente
        ModuleLoader.loadScript('js/auth.js')
          .then(() => {
            Auth.init();
            console.log('Sistema de autenticación cargado e inicializado correctamente');
            resolve();
          })
          .catch(reject);
      }
    });
  },
  
  /**
   * Inicializa el sistema de almacenamiento
   * @returns {Promise}
   */
  initStorage: function() {
    return new Promise((resolve, reject) => {
      // Verificar si el sistema de almacenamiento ya está cargado
      if (typeof StorageManager !== 'undefined') {
        try {
          StorageManager.init();
          console.log('Sistema de gestión de almacenamiento inicializado correctamente');
          resolve();
        } catch (error) {
          console.error('Error al inicializar el sistema de gestión de almacenamiento:', error);
          reject(error);
        }
      } else {
        // Cargar módulos de almacenamiento dinámicamente
        ModuleLoader.loadModuleGroup('storage')
          .then(() => {
            StorageManager.init();
            console.log('Sistema de gestión de almacenamiento cargado e inicializado correctamente');
            resolve();
          })
          .catch(error => {
            console.error('Error al cargar e inicializar el sistema de almacenamiento:', error);
            reject(error);
          });
      }
    });
  },
  
  /**
   * Inicializa el sistema de análisis de rendimiento
   * @returns {Promise}
   */
  initPerformanceAnalysis: function() {
    return new Promise((resolve) => {
      // El análisis de rendimiento es opcional, por lo que siempre resolvemos la promesa
      if (typeof UIPerformanceAnalyzer !== 'undefined') {
        try {
          // Inicializar analizador de rendimiento
          UIPerformanceAnalyzer.init({
            enabled: true,
            logLevel: 'info'
          });
          
          // Inicializar métricas de rendimiento
          if (typeof UIPerformanceMetrics !== 'undefined') {
            UIPerformanceMetrics.init();
          }
          
          // Inicializar dashboard de rendimiento
          if (typeof UIPerformanceDashboard !== 'undefined') {
            UIPerformanceDashboard.init();
          }
          
          console.log('Sistema de análisis de rendimiento UI inicializado correctamente');
        } catch (error) {
          console.error('Error al inicializar el sistema de análisis de rendimiento UI:', error);
        }
      } else {
        // Cargar módulos de rendimiento en segundo plano
        ModuleLoader.loadModuleGroup('performance')
          .then(() => {
            try {
              // Inicializar analizador de rendimiento
              UIPerformanceAnalyzer.init({
                enabled: true,
                logLevel: 'info'
              });
              
              // Inicializar métricas de rendimiento
              if (typeof UIPerformanceMetrics !== 'undefined') {
                UIPerformanceMetrics.init();
              }
              
              // Inicializar dashboard de rendimiento
              if (typeof UIPerformanceDashboard !== 'undefined') {
                UIPerformanceDashboard.init();
              }
              
              console.log('Sistema de análisis de rendimiento UI cargado e inicializado correctamente');
            } catch (error) {
              console.error('Error al inicializar el sistema de análisis de rendimiento UI:', error);
            }
          })
          .catch(error => {
            console.error('Error al cargar módulos de análisis de rendimiento:', error);
          });
      }
      
      // Siempre resolver, ya que este módulo es opcional
      resolve();
    });
  },
  
  /**
   * Inicializa los módulos principales de la aplicación
   * @returns {Promise}
   */
  initModules: function() {
    return new Promise((resolve, reject) => {
      // Determinar qué módulos cargar según el rol del usuario
      const currentUser = Auth.getCurrentUser();
      const userRole = currentUser ? currentUser.role : null;
      
      if (userRole === 'admin') {
        // Cargar módulos de administrador
        ModuleLoader.loadScript('js/admin.js')
          .then(() => {
            Admin.init();
            console.log('Módulo de administrador inicializado correctamente');
            resolve();
          })
          .catch(reject);
      } else if (userRole === 'coordinator') {
        // Cargar módulos de coordinador
        ModuleLoader.loadScript('js/coordinator.js')
          .then(() => {
            Coordinator.init();
            console.log('Módulo de coordinador inicializado correctamente');
            resolve();
          })
          .catch(reject);
      } else {
        // Usuario no autenticado, no cargar módulos adicionales
        resolve();
      }
    });
  },
  
  /**
   * Inicializa el sistema de notificaciones global
   * @private
   */
  /**
   * Mejora los componentes existentes para accesibilidad
   * @private
   */
  _enhanceComponentsForAccessibility: function() {
    if (typeof ScreenReaderSupport === 'undefined') return;
    
    console.log('[App] Mejorando componentes para accesibilidad...');
    
    // Mejorar tablas existentes
    document.querySelectorAll('table').forEach(table => {
      ScreenReaderSupport.enhanceTable(table);
    });
    
    // Mejorar formularios existentes
    document.querySelectorAll('form').forEach(form => {
      ScreenReaderSupport.enhanceForm(form);
    });
    
    // Mejorar modales existentes
    document.querySelectorAll('.modal').forEach(modal => {
      ScreenReaderSupport.enhanceModal(modal);
    });
    
    // Integrar con el sistema de componentes
    if (typeof ComponentSystem !== 'undefined') {
      // Extender el método de creación de tablas
      const originalCreateTable = ComponentSystem.createTable || Components.createTable;
      if (originalCreateTable) {
        const enhancedCreateTable = function(options) {
          const table = originalCreateTable.call(this, options);
          if (table && table.element) {
            ScreenReaderSupport.enhanceTable(table.element);
          }
          return table;
        };
        
        // Reemplazar método en ambos objetos si existen
        if (ComponentSystem.createTable) ComponentSystem.createTable = enhancedCreateTable;
        if (Components && Components.createTable) Components.createTable = enhancedCreateTable;
      }
      
      // Extender el método de creación de modales
      const originalCreateModal = ComponentSystem.createModal || Components.createModal;
      if (originalCreateModal) {
        const enhancedCreateModal = function(options) {
          const modal = originalCreateModal.call(this, options);
          if (modal && modal.element) {
            ScreenReaderSupport.enhanceModal(modal.element);
          }
          return modal;
        };
        
        // Reemplazar método en ambos objetos si existen
        if (ComponentSystem.createModal) ComponentSystem.createModal = enhancedCreateModal;
        if (Components && Components.createModal) Components.createModal = enhancedCreateModal;
      }
    }
    
    // Configurar observador para mejorar componentes creados dinámicamente
    if (window.MutationObserver) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Mejorar tablas añadidas
                if (node.tagName === 'TABLE') {
                  ScreenReaderSupport.enhanceTable(node);
                } else {
                  const tables = node.querySelectorAll('table');
                  tables.forEach(table => ScreenReaderSupport.enhanceTable(table));
                }
                
                // Mejorar formularios añadidos
                if (node.tagName === 'FORM') {
                  ScreenReaderSupport.enhanceForm(node);
                } else {
                  const forms = node.querySelectorAll('form');
                  forms.forEach(form => ScreenReaderSupport.enhanceForm(form));
                }
                
                // Mejorar modales añadidos
                if (node.classList && node.classList.contains('modal')) {
                  ScreenReaderSupport.enhanceModal(node);
                } else {
                  const modals = node.querySelectorAll('.modal');
                  modals.forEach(modal => ScreenReaderSupport.enhanceModal(modal));
                }
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  },
  
  /**
   * Configura atajos de teclado para funciones de accesibilidad
   * @private
   */
  _setupAccessibilityShortcuts: function() {
    if (typeof Accessibility === 'undefined') return;
    
    // Atajo para mostrar ayuda de atajos de teclado (Alt+H)
    Accessibility.createKeyboardShortcut('Alt+H', () => {
      Accessibility.showKeyboardShortcuts();
    }, 'Mostrar ayuda de atajos de teclado');
    
    // Atajo para alternar alto contraste (Alt+C)
    Accessibility.createKeyboardShortcut('Alt+C', () => {
      Accessibility.toggleHighContrast();
    }, 'Alternar modo de alto contraste');
    
    // Atajo para aumentar tamaño de texto (Alt+Plus)
    Accessibility.createKeyboardShortcut('Alt+=', () => {
      const currentSize = Accessibility.config.textSize;
      const sizes = ['small', 'normal', 'large', 'x-large'];
      const currentIndex = sizes.indexOf(currentSize);
      if (currentIndex < sizes.length - 1) {
        Accessibility.setTextSize(sizes[currentIndex + 1]);
      }
    }, 'Aumentar tamaño de texto');
    
    // Atajo para reducir tamaño de texto (Alt+Minus)
    Accessibility.createKeyboardShortcut('Alt+-', () => {
      const currentSize = Accessibility.config.textSize;
      const sizes = ['small', 'normal', 'large', 'x-large'];
      const currentIndex = sizes.indexOf(currentSize);
      if (currentIndex > 0) {
        Accessibility.setTextSize(sizes[currentIndex - 1]);
      }
    }, 'Reducir tamaño de texto');
    
    // Atajo para alternar reducción de movimiento (Alt+M)
    Accessibility.createKeyboardShortcut('Alt+M', () => {
      Accessibility.toggleReduceMotion();
    }, 'Alternar reducción de movimiento');
    
    console.log('[App] Atajos de teclado para accesibilidad configurados');
  },
  
  _initializeGlobalNotifications: function() {
    // Crear contenedor de toasts si no existe
    if (!document.getElementById('toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Reemplazar las funciones de notificación antiguas con las nuevas
    window.showNotification = function(message, type = 'info', duration = 3000) {
      if (typeof Components !== 'undefined' && Components.showToast) {
        Components.showToast(message, type, duration);
      } else {
        // Fallback simple si Components no está disponible
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
          toast.classList.add('fade-out');
          setTimeout(() => toast.remove(), 300);
        }, duration);
      }
    };
    
    window.showSuccessNotification = function(message, duration = 3000) {
      window.showNotification(message, 'success', duration);
    };
    
    window.showErrorNotification = function(message, duration = 3000) {
      window.showNotification(message, 'danger', duration);
    };
    
    window.showWarningNotification = function(message, duration = 3000) {
      window.showNotification(message, 'warning', duration);
    };
    
    window.showInfoNotification = function(message, duration = 3000) {
      window.showNotification(message, 'info', duration);
    };
    
    // Función global para mostrar diálogos de confirmación
    window.showConfirmDialog = function(options) {
      if (typeof Components !== 'undefined' && Components.confirm) {
        Components.confirm(options);
      } else {
        // Fallback simple si Components no está disponible
        if (confirm(options.message)) {
          if (typeof options.onConfirm === 'function') {
            options.onConfirm();
          }
        } else {
          if (typeof options.onCancel === 'function') {
            options.onCancel();
          }
        }
      }
    };
  }
};

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  // La inicialización se maneja en el script de index.html
  // que carga los módulos críticos primero
  if (typeof ModuleLoader === 'undefined') {
    // Si no está disponible el cargador de módulos, inicializar directamente
    App.init();
  }
});

/**
 * Inicializa el sistema de notificaciones global
 * @private
 */
function _initializeGlobalNotifications() {
  // Crear contenedor de toasts si no existe
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Reemplazar las funciones de notificación antiguas con las nuevas
  window.showNotification = function(message, type = 'info', duration = 3000) {
    Components.showToast(message, type, duration);
  };
  
  window.showSuccessNotification = function(message, duration = 3000) {
    Components.showToast(message, 'success', duration);
  };
  
  window.showErrorNotification = function(message, duration = 3000) {
    Components.showToast(message, 'danger', duration);
  };
  
  window.showWarningNotification = function(message, duration = 3000) {
    Components.showToast(message, 'warning', duration);
  };
  
  window.showInfoNotification = function(message, duration = 3000) {
    Components.showToast(message, 'info', duration);
  };
  
  // Función global para mostrar diálogos de confirmación
  window.showConfirmDialog = function(options) {
    Components.confirm(options);
  };
}
