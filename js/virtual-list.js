/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Componente de Lista Virtual para grandes conjuntos de datos
 * 
 * Este módulo implementa una lista con renderizado virtual para
 * manejar eficientemente grandes conjuntos de datos.
 */

const VirtualList = {
  // Configuración por defecto
  config: {
    itemHeight: 50,           // Altura predeterminada de cada elemento en píxeles
    overscanCount: 5,         // Número de elementos adicionales a renderizar fuera de la vista
    enableSelection: true,    // Habilitar selección de elementos
    enableFiltering: true,    // Habilitar filtrado de datos
    enableSorting: true,      // Habilitar ordenamiento
    mobileOptimizations: true, // Aplicar optimizaciones adicionales en dispositivos móviles
    loadingMessage: 'Cargando elementos...', // Mensaje durante la carga
    emptyMessage: 'No hay elementos disponibles', // Mensaje cuando no hay datos
    highlightHover: true,     // Resaltar elemento al pasar el mouse
    defaultSortKey: null,     // Clave por la que ordenar por defecto
    defaultSortDirection: 'asc', // Dirección de ordenamiento por defecto
    itemTemplate: null,       // Plantilla para renderizar elementos
    containerClass: 'virtual-list', // Clase CSS para el contenedor
    itemClass: 'virtual-list-item' // Clase CSS para los elementos
  },
  
  // Registro de instancias de listas virtuales
  instances: {},
  
  /**
   * Crea una nueva lista virtual
   * @param {HTMLElement|string} container - Contenedor o ID del contenedor
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - API de la lista virtual
   */
  create: function(container, options = {}) {
    // Obtener elemento contenedor
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    
    if (!container) {
      console.error('[VirtualList] Contenedor no encontrado');
      return null;
    }
    
    // Generar ID único para esta instancia
    const id = 'vlist_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Combinar opciones con configuración predeterminada
    const config = {...this.config, ...options};
    
    // Crear estructura de la instancia
    const instance = {
      id,
      container,
      config,
      items: options.items || [],
      filteredItems: [],
      sortedItems: [],
      displayItems: [],
      state: {
        sortKey: config.defaultSortKey,
        sortDirection: config.defaultSortDirection,
        selectedItems: [],
        filter: '',
        isLoading: false
      },
      elements: {
        listContainer: null,
        itemsContainer: null
      },
      virtualList: null
    };
    
    // Inicializar la lista
    this._initList(instance);
    
    // Registrar instancia
    this.instances[id] = instance;
    
    // Devolver API pública
    return {
      id,
      setItems: (items) => this.setItems(id, items),
      getSelectedItems: () => this.getSelectedItems(id),
      selectItem: (itemIndex, selected) => this.selectItem(id, itemIndex, selected),
      sort: (key, direction) => this.sortItems(id, key, direction),
      filter: (filterText) => this.filterItems(id, filterText),
      refresh: () => this.refreshList(id),
      destroy: () => this.destroyList(id)
    };
  },
  
  /**
   * Inicializa una lista virtual
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _initList: function(instance) {
    const { container, config } = instance;
    
    // Limpiar contenedor
    container.innerHTML = '';
    container.classList.add(config.containerClass);
    
    // Aplicar estilos al contenedor
    container.style.position = 'relative';
    container.style.overflow = 'auto';
    
    // Crear contenedor de lista
    const listContainer = document.createElement('div');
    listContainer.className = 'virtual-list-container';
    listContainer.style.width = '100%';
    listContainer.style.position = 'relative';
    
    // Añadir contenedor al DOM
    container.appendChild(listContainer);
    
    // Guardar referencia
    instance.elements.listContainer = listContainer;
    
    // Procesar datos iniciales
    this._processItems(instance);
    
    // Inicializar renderizado virtual si hay datos
    if (instance.displayItems.length > 0) {
      this._initVirtualRendering(instance);
    } else {
      // Mostrar mensaje de no hay datos
      this._showEmptyMessage(instance);
    }
    
    // Configurar eventos
    this._setupEvents(instance);
  },
  
  /**
   * Inicializa el renderizado virtual
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _initVirtualRendering: function(instance) {
    const { container, elements, config, displayItems } = instance;
    
    // Limpiar contenedor
    elements.listContainer.innerHTML = '';
    
    // Si hay pocos elementos, renderizar todos sin virtualización
    if (displayItems.length <= 50) {
      this._renderAllItems(instance);
      return;
    }
    
    // Usar VirtualRenderer si está disponible
    if (typeof VirtualRenderer !== 'undefined') {
      instance.virtualList = VirtualRenderer.createVirtualList(
        container,
        displayItems,
        (item, index) => this._renderItem(instance, item, index),
        {
          itemHeight: config.itemHeight,
          overscanCount: config.overscanCount
        }
      );
    } else {
      // Fallback si VirtualRenderer no está disponible
      this._renderAllItems(instance);
    }
  },
  
  /**
   * Renderiza todos los elementos (sin virtualización)
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _renderAllItems: function(instance) {
    const { elements, displayItems } = instance;
    
    // Limpiar contenedor
    elements.listContainer.innerHTML = '';
    
    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Renderizar cada elemento
    displayItems.forEach((item, index) => {
      const element = this._renderItem(instance, item, index);
      fragment.appendChild(element);
    });
    
    // Añadir elementos al contenedor
    elements.listContainer.appendChild(fragment);
  },
  
  /**
   * Renderiza un elemento de la lista
   * @param {Object} instance - Instancia de lista
   * @param {Object} item - Datos del elemento
   * @param {number} index - Índice del elemento
   * @returns {HTMLElement} - Elemento renderizado
   * @private
   */
  _renderItem: function(instance, item, index) {
    const { config, state } = instance;
    
    // Crear elemento
    const element = document.createElement('div');
    element.className = config.itemClass;
    element.dataset.index = index;
    
    // Aplicar altura fija
    element.style.height = `${config.itemHeight}px`;
    
    // Marcar como seleccionado si corresponde
    if (config.enableSelection && state.selectedItems.includes(index)) {
      element.classList.add('selected');
    }
    
    // Renderizar contenido
    if (config.itemTemplate && typeof config.itemTemplate === 'function') {
      // Usar plantilla personalizada
      const content = config.itemTemplate(item, index);
      
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Node) {
        element.appendChild(content);
      }
    } else {
      // Renderizado predeterminado
      element.textContent = item.text || item.name || item.title || JSON.stringify(item);
    }
    
    // Configurar eventos
    if (config.enableSelection) {
      element.addEventListener('click', () => {
        this._handleItemClick(instance, index);
      });
    }
    
    if (config.highlightHover) {
      element.addEventListener('mouseenter', () => {
        element.classList.add('hover');
      });
      
      element.addEventListener('mouseleave', () => {
        element.classList.remove('hover');
      });
    }
    
    return element;
  },
  
  /**
   * Maneja el clic en un elemento
   * @param {Object} instance - Instancia de lista
   * @param {number} index - Índice del elemento
   * @private
   */
  _handleItemClick: function(instance, index) {
    if (!instance.config.enableSelection) return;
    
    // Alternar selección
    this.selectItem(instance.id, index, !instance.state.selectedItems.includes(index));
    
    // Llamar al callback si existe
    if (instance.config.onItemClick && typeof instance.config.onItemClick === 'function') {
      instance.config.onItemClick(instance.displayItems[index], index);
    }
  },
  
  /**
   * Muestra un mensaje cuando no hay datos
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _showEmptyMessage: function(instance) {
    const { elements, config, state } = instance;
    
    // Limpiar contenedor
    elements.listContainer.innerHTML = '';
    
    // Crear mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'empty-message';
    messageElement.textContent = state.isLoading ? config.loadingMessage : config.emptyMessage;
    
    // Añadir mensaje al contenedor
    elements.listContainer.appendChild(messageElement);
  },
  
  /**
   * Configura eventos de la lista
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _setupEvents: function(instance) {
    // Evento de redimensionamiento
    window.addEventListener('resize', () => {
      this.refreshList(instance.id);
    });
  },
  
  /**
   * Procesa los elementos de la lista (filtrado, ordenamiento)
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _processItems: function(instance) {
    // Aplicar filtro
    this._applyFilter(instance);
    
    // Aplicar ordenamiento
    this._applySort(instance);
    
    // Actualizar elementos a mostrar
    instance.displayItems = [...instance.sortedItems];
  },
  
  /**
   * Aplica filtro a los elementos
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _applyFilter: function(instance) {
    const { items, state, config } = instance;
    
    // Si no hay filtro, usar todos los elementos
    if (!state.filter || state.filter.trim() === '') {
      instance.filteredItems = [...items];
      return;
    }
    
    // Filtrar elementos
    const filterText = state.filter.toLowerCase();
    
    // Usar filtro personalizado si existe
    if (config.filterFn && typeof config.filterFn === 'function') {
      instance.filteredItems = items.filter(item => config.filterFn(item, filterText));
      return;
    }
    
    // Filtro predeterminado
    instance.filteredItems = items.filter(item => {
      // Si el elemento es un objeto, buscar en todas sus propiedades
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filterText);
        });
      }
      
      // Si es un valor primitivo
      return String(item).toLowerCase().includes(filterText);
    });
  },
  
  /**
   * Aplica ordenamiento a los elementos
   * @param {Object} instance - Instancia de lista
   * @private
   */
  _applySort: function(instance) {
    const { filteredItems, state, config } = instance;
    
    // Si no hay clave de ordenamiento, usar elementos filtrados
    if (!state.sortKey) {
      instance.sortedItems = [...filteredItems];
      return;
    }
    
    // Clonar elementos para no modificar los originales
    const sortedItems = [...filteredItems];
    
    // Usar ordenador personalizado si existe
    if (config.sortFn && typeof config.sortFn === 'function') {
      sortedItems.sort((a, b) => config.sortFn(a, b, state.sortKey, state.sortDirection));
      instance.sortedItems = sortedItems;
      return;
    }
    
    // Ordenamiento predeterminado
    sortedItems.sort((a, b) => {
      let valueA = a[state.sortKey];
      let valueB = b[state.sortKey];
      
      // Manejar valores nulos
      if (valueA === null || valueA === undefined) return state.sortDirection === 'asc' ? -1 : 1;
      if (valueB === null || valueB === undefined) return state.sortDirection === 'asc' ? 1 : -1;
      
      // Comparar según tipo
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * (state.sortDirection === 'asc' ? 1 : -1);
      }
      
      // Comparación numérica
      return (valueA - valueB) * (state.sortDirection === 'asc' ? 1 : -1);
    });
    
    instance.sortedItems = sortedItems;
  },
  
  /**
   * Establece los elementos de la lista
   * @param {string} id - ID de la instancia
   * @param {Array} items - Nuevos elementos
   */
  setItems: function(id, items) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar elementos
    instance.items = Array.isArray(items) ? items : [];
    
    // Procesar elementos
    this._processItems(instance);
    
    // Actualizar renderizado
    if (instance.displayItems.length > 0) {
      if (instance.virtualList) {
        // Actualizar lista virtual
        instance.virtualList.update(instance.displayItems);
      } else {
        // Reinicializar renderizado virtual
        this._initVirtualRendering(instance);
      }
    } else {
      // Mostrar mensaje de no hay datos
      this._showEmptyMessage(instance);
    }
  },
  
  /**
   * Ordena los elementos de la lista
   * @param {string} id - ID de la instancia
   * @param {string} key - Clave de ordenamiento
   * @param {string} direction - Dirección ('asc' o 'desc')
   */
  sortItems: function(id, key, direction = 'asc') {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Validar dirección
    direction = direction === 'desc' ? 'desc' : 'asc';
    
    // Actualizar estado
    instance.state.sortKey = key;
    instance.state.sortDirection = direction;
    
    // Procesar elementos
    this._processItems(instance);
    
    // Actualizar renderizado
    if (instance.virtualList) {
      instance.virtualList.update(instance.displayItems);
    } else {
      this._renderAllItems(instance);
    }
  },
  
  /**
   * Filtra los elementos de la lista
   * @param {string} id - ID de la instancia
   * @param {string} filterText - Texto de filtro
   */
  filterItems: function(id, filterText) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar estado
    instance.state.filter = filterText;
    
    // Procesar elementos
    this._processItems(instance);
    
    // Actualizar renderizado
    if (instance.displayItems.length > 0) {
      if (instance.virtualList) {
        instance.virtualList.update(instance.displayItems);
      } else {
        this._renderAllItems(instance);
      }
    } else {
      this._showEmptyMessage(instance);
    }
  },
  
  /**
   * Selecciona o deselecciona un elemento
   * @param {string} id - ID de la instancia
   * @param {number} itemIndex - Índice del elemento
   * @param {boolean} selected - Estado de selección
   */
  selectItem: function(id, itemIndex, selected) {
    const instance = this.instances[id];
    
    if (!instance || !instance.config.enableSelection) {
      return;
    }
    
    // Actualizar estado de selección
    const selectedItems = [...instance.state.selectedItems];
    
    if (selected && !selectedItems.includes(itemIndex)) {
      selectedItems.push(itemIndex);
    } else if (!selected && selectedItems.includes(itemIndex)) {
      const index = selectedItems.indexOf(itemIndex);
      selectedItems.splice(index, 1);
    }
    
    instance.state.selectedItems = selectedItems;
    
    // Actualizar visualización
    const element = instance.elements.listContainer.querySelector(`[data-index="${itemIndex}"]`);
    
    if (element) {
      if (selected) {
        element.classList.add('selected');
      } else {
        element.classList.remove('selected');
      }
    }
    
    // Disparar evento de selección
    if (instance.config.onSelectionChange && typeof instance.config.onSelectionChange === 'function') {
      const selectedItemsData = selectedItems.map(index => instance.displayItems[index]);
      instance.config.onSelectionChange(selectedItemsData, selectedItems);
    }
  },
  
  /**
   * Obtiene los elementos seleccionados
   * @param {string} id - ID de la instancia
   * @returns {Array} - Elementos seleccionados
   */
  getSelectedItems: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return [];
    }
    
    return instance.state.selectedItems.map(index => ({
      index,
      data: instance.displayItems[index]
    }));
  },
  
  /**
   * Refresca la lista
   * @param {string} id - ID de la instancia
   */
  refreshList: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar renderizado
    if (instance.virtualList) {
      instance.virtualList.refresh();
    } else {
      this._renderAllItems(instance);
    }
  },
  
  /**
   * Destruye una lista virtual
   * @param {string} id - ID de la instancia
   */
  destroyList: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualList] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Destruir lista virtual si existe
    if (instance.virtualList) {
      instance.virtualList.destroy();
    }
    
    // Limpiar contenedor
    instance.container.innerHTML = '';
    
    // Eliminar instancia del registro
    delete this.instances[id];
  }
};

// Exportar el objeto VirtualList
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualList;
}
