/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Plantillas de Menús
 * 
 * Este módulo implementa la funcionalidad de plantillas reutilizables
 * para menús recurrentes, facilitando la creación de menús semanales.
 */

const MenuTemplates = {
  // Configuración
  config: {
    storageKey: 'menuTemplates',
    maxTemplates: 10
  },
  
  // Estado
  state: {
    isInitialized: false,
    templates: [],
    selectedTemplate: null
  },
  
  /**
   * Inicializa el módulo de plantillas de menús
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    if (this.state.isInitialized) return this;
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[MenuTemplates] Inicializando módulo de plantillas de menús');
    
    // Cargar plantillas guardadas
    this._loadTemplates();
    
    this.state.isInitialized = true;
    return this;
  },
  
  /**
   * Carga las plantillas guardadas desde localStorage
   * @private
   */
  _loadTemplates: function() {
    try {
      const savedTemplates = localStorage.getItem(this.config.storageKey);
      
      if (savedTemplates) {
        this.state.templates = JSON.parse(savedTemplates);
        console.info(`[MenuTemplates] ${this.state.templates.length} plantillas cargadas`);
      } else {
        this.state.templates = [];
        console.info('[MenuTemplates] No se encontraron plantillas guardadas');
      }
    } catch (error) {
      console.error('[MenuTemplates] Error al cargar plantillas:', error);
      this.state.templates = [];
    }
  },
  
  /**
   * Guarda las plantillas en localStorage
   * @private
   */
  _saveTemplates: function() {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.templates));
      console.info(`[MenuTemplates] ${this.state.templates.length} plantillas guardadas`);
    } catch (error) {
      console.error('[MenuTemplates] Error al guardar plantillas:', error);
    }
  },
  
  /**
   * Obtiene todas las plantillas
   * @returns {Array} - Lista de plantillas
   */
  getTemplates: function() {
    return [...this.state.templates];
  },
  
  /**
   * Obtiene una plantilla por su ID
   * @param {string} id - ID de la plantilla
   * @returns {Object|null} - Plantilla encontrada o null
   */
  getTemplateById: function(id) {
    const template = this.state.templates.find(t => t.id === id);
    return template ? {...template} : null;
  },
  
  /**
   * Crea una nueva plantilla a partir de un menú semanal
   * @param {Object} menu - Menú semanal
   * @param {string} name - Nombre para la plantilla
   * @param {string} description - Descripción de la plantilla
   * @returns {string} - ID de la plantilla creada
   */
  createTemplate: function(menu, name, description = '') {
    if (!menu || !menu.days || !Array.isArray(menu.days)) {
      console.error('[MenuTemplates] Menú inválido para crear plantilla');
      return null;
    }
    
    // Verificar límite de plantillas
    if (this.state.templates.length >= this.config.maxTemplates) {
      console.warn(`[MenuTemplates] Límite de plantillas alcanzado (${this.config.maxTemplates})`);
      return null;
    }
    
    // Crear nueva plantilla
    const template = {
      id: 'template_' + Date.now(),
      name: name || 'Plantilla sin nombre',
      description: description,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
      days: menu.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        mainDish: day.mainDish,
        sideDish: day.sideDish,
        beverage: day.beverage,
        allergens: day.allergens ? [...day.allergens] : [],
        nutritionalInfo: day.nutritionalInfo ? {...day.nutritionalInfo} : {}
      }))
    };
    
    // Añadir a la lista
    this.state.templates.push(template);
    
    // Guardar cambios
    this._saveTemplates();
    
    console.info(`[MenuTemplates] Plantilla creada: ${template.name} (${template.id})`);
    return template.id;
  },
  
  /**
   * Actualiza una plantilla existente
   * @param {string} id - ID de la plantilla
   * @param {Object} updates - Cambios a aplicar
   * @returns {boolean} - true si se actualizó correctamente
   */
  updateTemplate: function(id, updates) {
    const index = this.state.templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error(`[MenuTemplates] Plantilla no encontrada: ${id}`);
      return false;
    }
    
    // Aplicar actualizaciones
    const template = this.state.templates[index];
    
    if (updates.name) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.days && Array.isArray(updates.days)) {
      template.days = updates.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        mainDish: day.mainDish,
        sideDish: day.sideDish,
        beverage: day.beverage,
        allergens: day.allergens ? [...day.allergens] : [],
        nutritionalInfo: day.nutritionalInfo ? {...day.nutritionalInfo} : {}
      }));
    }
    
    // Guardar cambios
    this._saveTemplates();
    
    console.info(`[MenuTemplates] Plantilla actualizada: ${template.name} (${template.id})`);
    return true;
  },
  
  /**
   * Elimina una plantilla
   * @param {string} id - ID de la plantilla
   * @returns {boolean} - true si se eliminó correctamente
   */
  deleteTemplate: function(id) {
    const index = this.state.templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error(`[MenuTemplates] Plantilla no encontrada: ${id}`);
      return false;
    }
    
    // Eliminar plantilla
    const template = this.state.templates[index];
    this.state.templates.splice(index, 1);
    
    // Guardar cambios
    this._saveTemplates();
    
    console.info(`[MenuTemplates] Plantilla eliminada: ${template.name} (${template.id})`);
    return true;
  },
  
  /**
   * Aplica una plantilla a un menú semanal
   * @param {string} templateId - ID de la plantilla
   * @param {Object} menu - Menú semanal a modificar
   * @returns {Object} - Menú modificado
   */
  applyTemplate: function(templateId, menu) {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      console.error(`[MenuTemplates] Plantilla no encontrada: ${templateId}`);
      return menu;
    }
    
    // Actualizar estadísticas de uso
    const index = this.state.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.state.templates[index].lastUsed = new Date().toISOString();
      this.state.templates[index].usageCount++;
      this._saveTemplates();
    }
    
    // Crear copia del menú
    const newMenu = {...menu};
    
    // Si no tiene días, inicializar array
    if (!newMenu.days || !Array.isArray(newMenu.days)) {
      newMenu.days = [];
    }
    
    // Aplicar plantilla
    template.days.forEach(templateDay => {
      // Buscar si ya existe un día con el mismo dayOfWeek
      const existingDayIndex = newMenu.days.findIndex(d => d.dayOfWeek === templateDay.dayOfWeek);
      
      if (existingDayIndex !== -1) {
        // Actualizar día existente
        newMenu.days[existingDayIndex] = {
          ...newMenu.days[existingDayIndex],
          mainDish: templateDay.mainDish,
          sideDish: templateDay.sideDish,
          beverage: templateDay.beverage,
          allergens: templateDay.allergens ? [...templateDay.allergens] : [],
          nutritionalInfo: templateDay.nutritionalInfo ? {...templateDay.nutritionalInfo} : {}
        };
      } else {
        // Añadir nuevo día
        newMenu.days.push({
          dayOfWeek: templateDay.dayOfWeek,
          date: null, // La fecha debe ser asignada por el componente de menú
          mainDish: templateDay.mainDish,
          sideDish: templateDay.sideDish,
          beverage: templateDay.beverage,
          allergens: templateDay.allergens ? [...templateDay.allergens] : [],
          nutritionalInfo: templateDay.nutritionalInfo ? {...templateDay.nutritionalInfo} : {},
          published: false
        });
      }
    });
    
    // Ordenar días por dayOfWeek
    newMenu.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    
    console.info(`[MenuTemplates] Plantilla aplicada: ${template.name} (${template.id})`);
    return newMenu;
  },
  
  /**
   * Selecciona una plantilla para su uso
   * @param {string} templateId - ID de la plantilla
   * @returns {Object|null} - Plantilla seleccionada o null
   */
  selectTemplate: function(templateId) {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      console.error(`[MenuTemplates] Plantilla no encontrada: ${templateId}`);
      this.state.selectedTemplate = null;
      return null;
    }
    
    this.state.selectedTemplate = template;
    console.info(`[MenuTemplates] Plantilla seleccionada: ${template.name} (${template.id})`);
    return template;
  },
  
  /**
   * Obtiene la plantilla seleccionada actualmente
   * @returns {Object|null} - Plantilla seleccionada o null
   */
  getSelectedTemplate: function() {
    return this.state.selectedTemplate ? {...this.state.selectedTemplate} : null;
  },
  
  /**
   * Crea un componente de selector de plantillas
   * @param {Object} options - Opciones de configuración
   * @returns {HTMLElement} - Elemento selector de plantillas
   */
  createTemplateSelector: function(options = {}) {
    const defaults = {
      container: null,
      onSelect: null,
      includeManageButton: true,
      includeApplyButton: true,
      className: ''
    };
    
    const settings = {...defaults, ...options};
    
    // Crear contenedor
    const selector = document.createElement('div');
    selector.className = 'template-selector ' + settings.className;
    
    // Crear select
    const select = document.createElement('select');
    select.className = 'template-select form-control';
    select.id = 'template-select-' + Date.now();
    
    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccionar plantilla...';
    select.appendChild(defaultOption);
    
    // Añadir opciones para cada plantilla
    this.state.templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      select.appendChild(option);
    });
    
    // Crear label
    const label = document.createElement('label');
    label.setAttribute('for', select.id);
    label.textContent = 'Plantilla de menú:';
    
    // Añadir elementos al selector
    selector.appendChild(label);
    
    // Crear contenedor para controles
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'template-selector-controls';
    controlsContainer.appendChild(select);
    
    // Añadir botón de aplicar si está habilitado
    if (settings.includeApplyButton) {
      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.className = 'btn btn-primary template-apply-btn';
      applyButton.textContent = 'Aplicar';
      applyButton.disabled = true;
      
      applyButton.addEventListener('click', () => {
        const templateId = select.value;
        if (templateId) {
          const template = this.selectTemplate(templateId);
          if (template && typeof settings.onSelect === 'function') {
            settings.onSelect(template);
          }
        }
      });
      
      // Habilitar/deshabilitar botón según selección
      select.addEventListener('change', () => {
        applyButton.disabled = !select.value;
      });
      
      controlsContainer.appendChild(applyButton);
    }
    
    // Añadir botón de gestión si está habilitado
    if (settings.includeManageButton) {
      const manageButton = document.createElement('button');
      manageButton.type = 'button';
      manageButton.className = 'btn btn-secondary template-manage-btn';
      manageButton.textContent = 'Gestionar';
      
      manageButton.addEventListener('click', () => {
        this.showTemplateManager();
      });
      
      controlsContainer.appendChild(manageButton);
    }
    
    selector.appendChild(controlsContainer);
    
    // Añadir al contenedor si se especificó
    if (settings.container) {
      const container = typeof settings.container === 'string' 
        ? document.querySelector(settings.container) 
        : settings.container;
      
      if (container) {
        container.appendChild(selector);
      }
    }
    
    return selector;
  },
  
  /**
   * Muestra el gestor de plantillas
   * @param {Object} options - Opciones de configuración
   */
  showTemplateManager: function(options = {}) {
    const defaults = {
      onSave: null,
      onClose: null
    };
    
    const settings = {...defaults, ...options};
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal template-manager-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'template-manager-title');
    
    // Crear contenido del modal
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="template-manager-title">Gestión de Plantillas de Menú</h2>
          <button type="button" class="close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <div class="template-list">
            <h3>Plantillas Disponibles</h3>
            <div class="template-list-container">
              ${this._renderTemplateList()}
            </div>
          </div>
          <div class="template-actions mt-3">
            <button type="button" class="btn btn-primary create-template-btn">Crear Nueva Plantilla</button>
          </div>
        </div>
      </div>
    `;
    
    // Añadir modal al documento
    document.body.appendChild(modal);
    
    // Mostrar modal
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Configurar eventos
    const closeButton = modal.querySelector('.close');
    const createButton = modal.querySelector('.create-template-btn');
    const templateItems = modal.querySelectorAll('.template-item');
    
    // Evento de cierre
    closeButton.addEventListener('click', () => {
      closeModal();
    });
    
    // Evento de creación
    createButton.addEventListener('click', () => {
      this._showTemplateForm();
    });
    
    // Eventos para cada plantilla
    templateItems.forEach(item => {
      const templateId = item.getAttribute('data-template-id');
      const editButton = item.querySelector('.template-edit-btn');
      const deleteButton = item.querySelector('.template-delete-btn');
      
      if (editButton) {
        editButton.addEventListener('click', () => {
          const template = this.getTemplateById(templateId);
          if (template) {
            this._showTemplateForm(template);
          }
        });
      }
      
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          if (confirm('¿Está seguro de que desea eliminar esta plantilla?')) {
            this.deleteTemplate(templateId);
            item.remove();
          }
        });
      }
    });
    
    // Función para cerrar el modal
    const closeModal = () => {
      modal.classList.remove('active');
      
      // Eliminar modal después de la animación
      setTimeout(() => {
        document.body.removeChild(modal);
        
        if (typeof settings.onClose === 'function') {
          settings.onClose();
        }
      }, 300);
    };
    
    // Cerrar con Escape
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  },
  
  /**
   * Renderiza la lista de plantillas
   * @returns {string} - HTML con la lista de plantillas
   * @private
   */
  _renderTemplateList: function() {
    if (this.state.templates.length === 0) {
      return '<p class="no-templates">No hay plantillas disponibles. Cree una nueva plantilla para comenzar.</p>';
    }
    
    return this.state.templates.map(template => `
      <div class="template-item card mb-2" data-template-id="${template.id}">
        <div class="card-body">
          <h4 class="template-name">${template.name}</h4>
          ${template.description ? `<p class="template-description">${template.description}</p>` : ''}
          <div class="template-meta">
            <span class="template-usage">Usado ${template.usageCount} veces</span>
            ${template.lastUsed ? `<span class="template-last-used">Último uso: ${new Date(template.lastUsed).toLocaleDateString()}</span>` : ''}
          </div>
          <div class="template-actions mt-2">
            <button type="button" class="btn btn-sm btn-primary template-edit-btn">Editar</button>
            <button type="button" class="btn btn-sm btn-danger template-delete-btn">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  /**
   * Muestra el formulario de creación/edición de plantillas
   * @param {Object} template - Plantilla a editar (null para crear nueva)
   * @private
   */
  _showTemplateForm: function(template = null) {
    const isEditing = !!template;
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal template-form-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'template-form-title');
    
    // Crear contenido del modal
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="template-form-title">${isEditing ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</h2>
          <button type="button" class="close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <form id="template-form">
            <div class="form-group">
              <label for="template-name">Nombre de la plantilla:</label>
              <input type="text" id="template-name" class="form-control" value="${isEditing ? template.name : ''}" required>
            </div>
            <div class="form-group">
              <label for="template-description">Descripción (opcional):</label>
              <textarea id="template-description" class="form-control" rows="3">${isEditing ? template.description : ''}</textarea>
            </div>
            
            <div class="form-group">
              <label>Días de la semana:</label>
              <div class="template-days">
                ${this._renderTemplateDaysForm(template)}
              </div>
            </div>
            
            <div class="form-actions mt-3">
              <button type="submit" class="btn btn-primary">${isEditing ? 'Guardar Cambios' : 'Crear Plantilla'}</button>
              <button type="button" class="btn btn-secondary cancel-btn">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Añadir modal al documento
    document.body.appendChild(modal);
    
    // Mostrar modal
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Configurar eventos
    const form = modal.querySelector('#template-form');
    const closeButton = modal.querySelector('.close');
    const cancelButton = modal.querySelector('.cancel-btn');
    
    // Evento de cierre
    const closeModal = () => {
      modal.classList.remove('active');
      
      // Eliminar modal después de la animación
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    };
    
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    // Evento de envío del formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Obtener valores del formulario
      const name = document.getElementById('template-name').value.trim();
      const description = document.getElementById('template-description').value.trim();
      
      // Obtener días
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayEnabled = document.getElementById(`day-enabled-${i}`).checked;
        
        if (dayEnabled) {
          const day = {
            dayOfWeek: i,
            mainDish: document.getElementById(`main-dish-${i}`).value.trim(),
            sideDish: document.getElementById(`side-dish-${i}`).value.trim(),
            beverage: document.getElementById(`beverage-${i}`).value.trim(),
            allergens: [],
            nutritionalInfo: {}
          };
          
          days.push(day);
        }
      }
      
      // Validar que haya al menos un día
      if (days.length === 0) {
        alert('Debe seleccionar al menos un día de la semana.');
        return;
      }
      
      // Crear o actualizar plantilla
      if (isEditing) {
        this.updateTemplate(template.id, {
          name,
          description,
          days
        });
      } else {
        this.createTemplate({days}, name, description);
      }
      
      // Cerrar modal
      closeModal();
      
      // Actualizar gestor de plantillas
      this.showTemplateManager();
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  },
  
  /**
   * Renderiza el formulario de días para la plantilla
   * @param {Object} template - Plantilla a editar (null para crear nueva)
   * @returns {string} - HTML con el formulario de días
   * @private
   */
  _renderTemplateDaysForm: function(template = null) {
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    return daysOfWeek.map((dayName, index) => {
      const day = template ? template.days.find(d => d.dayOfWeek === index) : null;
      const isEnabled = !!day;
      
      return `
        <div class="template-day-item card mb-2">
          <div class="card-header">
            <div class="form-check">
              <input type="checkbox" id="day-enabled-${index}" class="form-check-input day-enabled" ${isEnabled ? 'checked' : ''}>
              <label for="day-enabled-${index}" class="form-check-label">${dayName}</label>
            </div>
          </div>
          <div class="card-body day-details ${isEnabled ? '' : 'hidden'}">
            <div class="form-group">
              <label for="main-dish-${index}">Plato principal:</label>
              <input type="text" id="main-dish-${index}" class="form-control" value="${day ? day.mainDish : ''}">
            </div>
            <div class="form-group">
              <label for="side-dish-${index}">Guarnición:</label>
              <input type="text" id="side-dish-${index}" class="form-control" value="${day ? day.sideDish : ''}">
            </div>
            <div class="form-group">
              <label for="beverage-${index}">Bebida:</label>
              <input type="text" id="beverage-${index}" class="form-control" value="${day ? day.beverage : ''}">
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// Configurar eventos después de cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
  // Configurar eventos para mostrar/ocultar detalles de días
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('day-enabled')) {
      const dayItem = e.target.closest('.template-day-item');
      const dayDetails = dayItem.querySelector('.day-details');
      
      if (e.target.checked) {
        dayDetails.classList.remove('hidden');
      } else {
        dayDetails.classList.add('hidden');
      }
    }
  });
});

// Exportar el objeto MenuTemplates
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuTemplates;
}
