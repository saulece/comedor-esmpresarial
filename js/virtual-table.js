/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Componente de Tabla Virtual para grandes conjuntos de datos
 * 
 * Este módulo implementa una tabla con renderizado virtual para
 * manejar eficientemente grandes conjuntos de datos.
 */

const VirtualTable = {
  // Configuración por defecto
  config: {
    rowHeight: 40,           // Altura predeterminada de cada fila en píxeles
    headerHeight: 45,        // Altura del encabezado en píxeles
    overscanCount: 5,        // Número de filas adicionales a renderizar fuera de la vista
    enableSorting: true,     // Habilitar ordenamiento de columnas
    enableFiltering: true,   // Habilitar filtrado de datos
    enableSelection: true,   // Habilitar selección de filas
    enablePagination: false, // Habilitar paginación (alternativa a virtualización)
    pageSize: 50,            // Tamaño de página si se usa paginación
    mobileOptimizations: true, // Aplicar optimizaciones adicionales en dispositivos móviles
    fixedHeader: true,       // Mantener encabezado fijo durante el scroll
    stripedRows: true,       // Alternar colores de filas
    highlightHover: true,    // Resaltar fila al pasar el mouse
    responsiveColumns: true, // Ocultar/mostrar columnas según el ancho disponible
    defaultSortColumn: null, // Columna por la que ordenar por defecto
    defaultSortDirection: 'asc', // Dirección de ordenamiento por defecto
    emptyMessage: 'No hay datos disponibles', // Mensaje cuando no hay datos
    loadingMessage: 'Cargando datos...' // Mensaje durante la carga de datos
  },
  
  // Registro de instancias de tablas virtuales
  instances: {},
  
  /**
   * Crea una nueva tabla virtual
   * @param {HTMLElement|string} container - Contenedor o ID del contenedor
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - API de la tabla virtual
   */
  create: function(container, options = {}) {
    // Obtener elemento contenedor
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    
    if (!container) {
      console.error('[VirtualTable] Contenedor no encontrado');
      return null;
    }
    
    // Generar ID único para esta instancia
    const id = 'vtable_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Combinar opciones con configuración predeterminada
    const config = {...this.config, ...options};
    
    // Crear estructura de la instancia
    const instance = {
      id,
      container,
      config,
      data: options.data || [],
      columns: options.columns || [],
      filteredData: [],
      sortedData: [],
      displayData: [],
      state: {
        sortColumn: config.defaultSortColumn,
        sortDirection: config.defaultSortDirection,
        selectedRows: [],
        currentPage: 0,
        filter: '',
        isLoading: false
      },
      elements: {
        table: null,
        header: null,
        body: null,
        footer: null
      },
      virtualList: null
    };
    
    // Inicializar la tabla
    this._initTable(instance);
    
    // Registrar instancia
    this.instances[id] = instance;
    
    // Devolver API pública
    return {
      id,
      setData: (data) => this.setData(id, data),
      getSelectedRows: () => this.getSelectedRows(id),
      selectRow: (rowIndex, selected) => this.selectRow(id, rowIndex, selected),
      sort: (columnId, direction) => this.sortData(id, columnId, direction),
      filter: (filterText) => this.filterData(id, filterText),
      refresh: () => this.refreshTable(id),
      destroy: () => this.destroyTable(id)
    };
  },
  
  /**
   * Inicializa una tabla virtual
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _initTable: function(instance) {
    const { container, config } = instance;
    
    // Limpiar contenedor
    container.innerHTML = '';
    container.classList.add('virtual-table-container');
    
    // Aplicar estilos al contenedor
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Crear estructura de la tabla
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'virtual-table-wrapper';
    tableWrapper.style.width = '100%';
    tableWrapper.style.height = '100%';
    tableWrapper.style.overflow = 'auto';
    
    const table = document.createElement('table');
    table.className = 'virtual-table';
    
    if (config.stripedRows) {
      table.classList.add('striped');
    }
    
    // Crear encabezado
    const header = document.createElement('thead');
    header.className = 'virtual-table-header';
    
    // Crear cuerpo
    const body = document.createElement('tbody');
    body.className = 'virtual-table-body';
    
    // Crear pie
    const footer = document.createElement('tfoot');
    footer.className = 'virtual-table-footer';
    
    // Ensamblar tabla
    table.appendChild(header);
    table.appendChild(body);
    table.appendChild(footer);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
    
    // Guardar referencias
    instance.elements.table = table;
    instance.elements.header = header;
    instance.elements.body = body;
    instance.elements.footer = footer;
    instance.elements.wrapper = tableWrapper;
    
    // Renderizar encabezado
    this._renderHeader(instance);
    
    // Procesar datos iniciales
    this._processData(instance);
    
    // Inicializar renderizado virtual si hay datos
    if (instance.displayData.length > 0) {
      this._initVirtualRendering(instance);
    } else {
      // Mostrar mensaje de no hay datos
      this._showEmptyMessage(instance);
    }
    
    // Configurar eventos
    this._setupEvents(instance);
  },
  
  /**
   * Renderiza el encabezado de la tabla
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _renderHeader: function(instance) {
    const { header } = instance.elements;
    const { columns, config } = instance;
    
    // Limpiar encabezado
    header.innerHTML = '';
    
    // Crear fila de encabezado
    const headerRow = document.createElement('tr');
    
    // Crear celdas de encabezado
    columns.forEach(column => {
      const th = document.createElement('th');
      th.className = 'virtual-table-header-cell';
      
      if (column.width) {
        th.style.width = column.width;
      }
      
      // Contenido del encabezado
      const headerContent = document.createElement('div');
      headerContent.className = 'header-content';
      headerContent.textContent = column.title || column.id;
      
      // Añadir icono de ordenamiento si está habilitado
      if (config.enableSorting && column.sortable !== false) {
        th.classList.add('sortable');
        
        // Indicador de ordenamiento
        const sortIndicator = document.createElement('span');
        sortIndicator.className = 'sort-indicator';
        
        // Establecer estado inicial de ordenamiento
        if (instance.state.sortColumn === column.id) {
          th.classList.add('sorted');
          th.classList.add(instance.state.sortDirection === 'asc' ? 'asc' : 'desc');
        }
        
        headerContent.appendChild(sortIndicator);
        
        // Evento de clic para ordenar
        th.addEventListener('click', () => {
          this._handleSortClick(instance, column.id);
        });
      }
      
      th.appendChild(headerContent);
      headerRow.appendChild(th);
    });
    
    // Añadir fila al encabezado
    header.appendChild(headerRow);
    
    // Configurar encabezado fijo si está habilitado
    if (config.fixedHeader) {
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '1';
      header.style.backgroundColor = 'var(--background-color, #fff)';
    }
  },
  
  /**
   * Maneja el clic en una columna para ordenar
   * @param {Object} instance - Instancia de tabla
   * @param {string} columnId - ID de la columna
   * @private
   */
  _handleSortClick: function(instance, columnId) {
    const { state } = instance;
    
    // Determinar dirección de ordenamiento
    let direction = 'asc';
    
    if (state.sortColumn === columnId) {
      // Cambiar dirección si ya está ordenado por esta columna
      direction = state.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    // Ordenar datos
    this.sortData(instance.id, columnId, direction);
  },
  
  /**
   * Inicializa el renderizado virtual
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _initVirtualRendering: function(instance) {
    const { body, wrapper } = instance.elements;
    const { config, displayData } = instance;
    
    // Limpiar cuerpo
    body.innerHTML = '';
    
    // Si hay pocas filas, renderizar todas sin virtualización
    if (displayData.length <= 50) {
      this._renderAllRows(instance);
      return;
    }
    
    // Usar VirtualRenderer si está disponible
    if (typeof VirtualRenderer !== 'undefined') {
      instance.virtualList = VirtualRenderer.createVirtualList(
        wrapper,
        displayData,
        (item, index) => this._renderRow(instance, item, index),
        {
          itemHeight: config.rowHeight,
          overscanCount: config.overscanCount
        }
      );
    } else {
      // Fallback si VirtualRenderer no está disponible
      this._renderAllRows(instance);
    }
  },
  
  /**
   * Renderiza todas las filas (sin virtualización)
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _renderAllRows: function(instance) {
    const { body } = instance.elements;
    const { displayData } = instance;
    
    // Limpiar cuerpo
    body.innerHTML = '';
    
    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Renderizar cada fila
    displayData.forEach((item, index) => {
      const row = this._renderRow(instance, item, index);
      fragment.appendChild(row);
    });
    
    // Añadir filas al cuerpo
    body.appendChild(fragment);
  },
  
  /**
   * Renderiza una fila de la tabla
   * @param {Object} instance - Instancia de tabla
   * @param {Object} item - Datos de la fila
   * @param {number} index - Índice de la fila
   * @returns {HTMLElement} - Elemento TR
   * @private
   */
  _renderRow: function(instance, item, index) {
    const { columns, config, state } = instance;
    
    // Crear fila
    const row = document.createElement('tr');
    row.className = 'virtual-table-row';
    row.dataset.index = index;
    
    // Aplicar altura fija
    row.style.height = `${config.rowHeight}px`;
    
    // Aplicar estilo alternado
    if (config.stripedRows && index % 2 === 1) {
      row.classList.add('striped');
    }
    
    // Marcar como seleccionada si corresponde
    if (config.enableSelection && state.selectedRows.includes(index)) {
      row.classList.add('selected');
    }
    
    // Crear celdas
    columns.forEach(column => {
      const cell = document.createElement('td');
      cell.className = 'virtual-table-cell';
      
      // Obtener valor de la celda
      let value = item[column.id];
      
      // Aplicar formateador si existe
      if (column.formatter && typeof column.formatter === 'function') {
        value = column.formatter(value, item, index);
      }
      
      // Establecer contenido
      if (typeof value === 'string' || typeof value === 'number' || value === null || value === undefined) {
        cell.textContent = value !== null && value !== undefined ? value : '';
      } else {
        // Si es un elemento DOM o HTML
        cell.innerHTML = '';
        if (value instanceof Node) {
          cell.appendChild(value);
        } else {
          // Asumir que es HTML
          cell.innerHTML = value;
        }
      }
      
      // Aplicar alineación
      if (column.align) {
        cell.style.textAlign = column.align;
      }
      
      // Añadir celda a la fila
      row.appendChild(cell);
    });
    
    // Configurar eventos de la fila
    if (config.enableSelection) {
      row.addEventListener('click', () => {
        this._handleRowClick(instance, index);
      });
    }
    
    if (config.highlightHover) {
      row.addEventListener('mouseenter', () => {
        row.classList.add('hover');
      });
      
      row.addEventListener('mouseleave', () => {
        row.classList.remove('hover');
      });
    }
    
    return row;
  },
  
  /**
   * Maneja el clic en una fila
   * @param {Object} instance - Instancia de tabla
   * @param {number} index - Índice de la fila
   * @private
   */
  _handleRowClick: function(instance, index) {
    if (!instance.config.enableSelection) return;
    
    // Alternar selección
    this.selectRow(instance.id, index, !instance.state.selectedRows.includes(index));
  },
  
  /**
   * Muestra un mensaje cuando no hay datos
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _showEmptyMessage: function(instance) {
    const { body } = instance.elements;
    const { columns, config } = instance;
    
    // Limpiar cuerpo
    body.innerHTML = '';
    
    // Crear fila para mensaje
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    
    // Configurar celda
    cell.className = 'empty-message';
    cell.colSpan = columns.length;
    cell.textContent = instance.state.isLoading ? config.loadingMessage : config.emptyMessage;
    
    // Añadir celda a la fila
    row.appendChild(cell);
    
    // Añadir fila al cuerpo
    body.appendChild(row);
  },
  
  /**
   * Configura eventos de la tabla
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _setupEvents: function(instance) {
    const { wrapper, table } = instance.elements;
    const { config } = instance;
    
    // Evento de redimensionamiento
    window.addEventListener('resize', () => {
      this.refreshTable(instance.id);
    });
    
    // Eventos de scroll para encabezado fijo
    if (config.fixedHeader) {
      wrapper.addEventListener('scroll', () => {
        // Sincronizar posición del encabezado
        instance.elements.header.style.transform = `translateY(${wrapper.scrollTop}px)`;
      }, { passive: true });
    }
  },
  
  /**
   * Procesa los datos de la tabla (filtrado, ordenamiento)
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _processData: function(instance) {
    // Aplicar filtro
    this._applyFilter(instance);
    
    // Aplicar ordenamiento
    this._applySort(instance);
    
    // Actualizar datos a mostrar
    instance.displayData = [...instance.sortedData];
  },
  
  /**
   * Aplica filtro a los datos
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _applyFilter: function(instance) {
    const { data, state, config } = instance;
    
    // Si no hay filtro, usar todos los datos
    if (!state.filter || state.filter.trim() === '') {
      instance.filteredData = [...data];
      return;
    }
    
    // Filtrar datos
    const filterText = state.filter.toLowerCase();
    
    instance.filteredData = data.filter(item => {
      // Buscar en todas las propiedades del objeto
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(filterText);
      });
    });
  },
  
  /**
   * Aplica ordenamiento a los datos
   * @param {Object} instance - Instancia de tabla
   * @private
   */
  _applySort: function(instance) {
    const { filteredData, state, columns } = instance;
    
    // Si no hay columna de ordenamiento, usar datos filtrados
    if (!state.sortColumn) {
      instance.sortedData = [...filteredData];
      return;
    }
    
    // Encontrar configuración de la columna
    const column = columns.find(col => col.id === state.sortColumn);
    
    if (!column) {
      instance.sortedData = [...filteredData];
      return;
    }
    
    // Clonar datos para no modificar los originales
    const sortedData = [...filteredData];
    
    // Ordenar datos
    sortedData.sort((a, b) => {
      let valueA = a[state.sortColumn];
      let valueB = b[state.sortColumn];
      
      // Usar comparador personalizado si existe
      if (column.sorter && typeof column.sorter === 'function') {
        return column.sorter(valueA, valueB, a, b) * (state.sortDirection === 'asc' ? 1 : -1);
      }
      
      // Comparación predeterminada
      if (valueA === valueB) return 0;
      
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
    
    instance.sortedData = sortedData;
  },
  
  /**
   * Establece los datos de la tabla
   * @param {string} id - ID de la instancia
   * @param {Array} data - Nuevos datos
   */
  setData: function(id, data) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar datos
    instance.data = Array.isArray(data) ? data : [];
    
    // Procesar datos
    this._processData(instance);
    
    // Actualizar renderizado
    if (instance.displayData.length > 0) {
      if (instance.virtualList) {
        // Actualizar lista virtual
        instance.virtualList.update(instance.displayData);
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
   * Ordena los datos de la tabla
   * @param {string} id - ID de la instancia
   * @param {string} columnId - ID de la columna
   * @param {string} direction - Dirección ('asc' o 'desc')
   */
  sortData: function(id, columnId, direction = 'asc') {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Validar dirección
    direction = direction === 'desc' ? 'desc' : 'asc';
    
    // Actualizar estado
    instance.state.sortColumn = columnId;
    instance.state.sortDirection = direction;
    
    // Actualizar encabezado
    const headerCells = instance.elements.header.querySelectorAll('th');
    
    headerCells.forEach(cell => {
      const headerContent = cell.querySelector('.header-content');
      
      if (!headerContent) return;
      
      const columnTitle = headerContent.textContent.trim();
      const column = instance.columns.find(col => (col.title || col.id) === columnTitle);
      
      if (!column) return;
      
      // Eliminar clases de ordenamiento
      cell.classList.remove('sorted', 'asc', 'desc');
      
      // Añadir clases si es la columna ordenada
      if (column.id === columnId) {
        cell.classList.add('sorted');
        cell.classList.add(direction);
      }
    });
    
    // Procesar datos
    this._processData(instance);
    
    // Actualizar renderizado
    if (instance.virtualList) {
      instance.virtualList.update(instance.displayData);
    } else {
      this._renderAllRows(instance);
    }
  },
  
  /**
   * Filtra los datos de la tabla
   * @param {string} id - ID de la instancia
   * @param {string} filterText - Texto de filtro
   */
  filterData: function(id, filterText) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar estado
    instance.state.filter = filterText;
    
    // Procesar datos
    this._processData(instance);
    
    // Actualizar renderizado
    if (instance.displayData.length > 0) {
      if (instance.virtualList) {
        instance.virtualList.update(instance.displayData);
      } else {
        this._renderAllRows(instance);
      }
    } else {
      this._showEmptyMessage(instance);
    }
  },
  
  /**
   * Selecciona o deselecciona una fila
   * @param {string} id - ID de la instancia
   * @param {number} rowIndex - Índice de la fila
   * @param {boolean} selected - Estado de selección
   */
  selectRow: function(id, rowIndex, selected) {
    const instance = this.instances[id];
    
    if (!instance || !instance.config.enableSelection) {
      return;
    }
    
    // Actualizar estado de selección
    const selectedRows = [...instance.state.selectedRows];
    
    if (selected && !selectedRows.includes(rowIndex)) {
      selectedRows.push(rowIndex);
    } else if (!selected && selectedRows.includes(rowIndex)) {
      const index = selectedRows.indexOf(rowIndex);
      selectedRows.splice(index, 1);
    }
    
    instance.state.selectedRows = selectedRows;
    
    // Actualizar visualización
    const row = instance.elements.body.querySelector(`tr[data-index="${rowIndex}"]`);
    
    if (row) {
      if (selected) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    }
    
    // Disparar evento de selección
    if (instance.config.onSelectionChange && typeof instance.config.onSelectionChange === 'function') {
      const selectedItems = selectedRows.map(index => instance.displayData[index]);
      instance.config.onSelectionChange(selectedItems, selectedRows);
    }
  },
  
  /**
   * Obtiene las filas seleccionadas
   * @param {string} id - ID de la instancia
   * @returns {Array} - Filas seleccionadas
   */
  getSelectedRows: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
      return [];
    }
    
    return instance.state.selectedRows.map(index => ({
      index,
      data: instance.displayData[index]
    }));
  },
  
  /**
   * Refresca la tabla
   * @param {string} id - ID de la instancia
   */
  refreshTable: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
      return;
    }
    
    // Actualizar renderizado
    if (instance.virtualList) {
      instance.virtualList.refresh();
    } else {
      this._renderAllRows(instance);
    }
  },
  
  /**
   * Destruye una tabla virtual
   * @param {string} id - ID de la instancia
   */
  destroyTable: function(id) {
    const instance = this.instances[id];
    
    if (!instance) {
      console.error(`[VirtualTable] No se encontró la instancia con ID ${id}`);
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

// Exportar el objeto VirtualTable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualTable;
}
