/**
 * Funcionalidades del administrador para el Sistema de Confirmación de Asistencias
 * Maneja la gestión de menús, usuarios y reportes
 */

const Admin = {
  /**
   * Inicializa el módulo de administrador
   */
  init: function() {
    // Solo inicializar si el usuario es administrador
    if (!Auth.hasRole(CONFIG.ROLES.ADMIN)) return;
    
    // Configurar eventos de pestañas
    this._setupTabEvents();
    
    // Inicializar gestión de menús
    this._initMenuManagement();
    
    // Inicializar gestión de usuarios
    this._initUserManagement();
    
    // Inicializar reportes
    this._initReports();
    
    // Inicializar exportación e importación de datos
    this._initExportImport();
    
    // Inicializar gestión de almacenamiento
    this._initStorageManagement();
  },

  /**
   * Configura los eventos para las pestañas del panel de administrador
   * @private
   */
  _setupTabEvents: function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Desactivar todas las pestañas
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  },

  /**
   * Inicializa la gestión de menús semanales
   * @private
   */
  _initMenuManagement: function() {
    // Crear contenedor para el formulario de menú
    const menuFormContainer = document.getElementById('menu-form-container');
    if (menuFormContainer) {
      menuFormContainer.innerHTML = this._createMenuFormHTML();
    }
    
    // Cargar lista de menús
    this._loadMenuList();
    
    // Configurar eventos del formulario de menú
    this._setupMenuFormEvents();
  },

  /**
   * Crea el HTML para el formulario de creación/edición de menú
   * @returns {string} HTML del formulario
   * @private
   */
  _createMenuFormHTML: function() {
    const weekStart = Utils.getCurrentWeekStartDate();
    const weekDays = Utils.getWeekDays(weekStart);
    
    let daysHTML = '';
    
    weekDays.forEach(day => {
      daysHTML += `
        <div class="menu-day card mb-3">
          <div class="card-header">
            <h4>${day.dayName} - ${Utils.formatDate(day.date)}</h4>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label for="main-dish-${day.dayOfWeek}">Plato principal:</label>
              <input type="text" id="main-dish-${day.dayOfWeek}" name="main-dish-${day.dayOfWeek}" required>
            </div>
            <div class="form-group">
              <label for="side-dish-${day.dayOfWeek}">Guarnición:</label>
              <input type="text" id="side-dish-${day.dayOfWeek}" name="side-dish-${day.dayOfWeek}" required>
            </div>
            <div class="form-group">
              <label for="beverage-${day.dayOfWeek}">Bebida:</label>
              <input type="text" id="beverage-${day.dayOfWeek}" name="beverage-${day.dayOfWeek}" required>
            </div>
          </div>
        </div>
      `;
    });
    
    return `
      <form id="menu-form" class="form">
        <input type="hidden" id="menu-id" name="menu-id">
        <div class="form-group">
          <label for="week-start-date">Semana del:</label>
          <input type="date" id="week-start-date" name="week-start-date" value="${weekStart.toISOString().split('T')[0]}" required>
        </div>
        
        <h3>Menú Semanal</h3>
        <div class="menu-days">
          ${daysHTML}
        </div>
        
        <div class="form-group text-center">
          <button type="submit" id="save-menu-btn" class="btn btn-primary">Guardar Menú</button>
          <button type="button" id="publish-menu-btn" class="btn btn-success ml-2" disabled>Publicar Menú</button>
          <button type="button" id="new-menu-btn" class="btn btn-secondary ml-2">Nuevo Menú</button>
        </div>
      </form>
    `;
  },

  /**
   * Configura los eventos del formulario de menú
   * @private
   */
  _setupMenuFormEvents: function() {
    const menuForm = document.getElementById('menu-form');
    if (!menuForm) return;
    
    // Manejar envío del formulario
    menuForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this._saveMenu();
    });
    
    // Botón de publicar menú
    const publishMenuBtn = document.getElementById('publish-menu-btn');
    if (publishMenuBtn) {
      publishMenuBtn.addEventListener('click', () => {
        const menuId = document.getElementById('menu-id').value;
        if (menuId) {
          this._publishMenu(menuId);
        }
      });
    }
    
    // Botón de nuevo menú
    const newMenuBtn = document.getElementById('new-menu-btn');
    if (newMenuBtn) {
      newMenuBtn.addEventListener('click', () => {
        this._resetMenuForm();
      });
    }
  },

  /**
   * Guarda un menú (crea uno nuevo o actualiza uno existente)
   * @private
   */
  _saveMenu: function() {
    try {
      const menuForm = document.getElementById('menu-form');
      if (!Utils.validateForm(menuForm)) return;
      
      const menuId = document.getElementById('menu-id').value;
      const weekStartDate = document.getElementById('week-start-date').value;
      
      // Recopilar datos de los días
      const weekDays = Utils.getWeekDays(new Date(weekStartDate));
      const days = weekDays.map(day => {
        return {
          dayOfWeek: day.dayOfWeek,
          date: day.date.toISOString(),
          mainDish: document.getElementById(`main-dish-${day.dayOfWeek}`).value,
          sideDish: document.getElementById(`side-dish-${day.dayOfWeek}`).value,
          beverage: document.getElementById(`beverage-${day.dayOfWeek}`).value,
          published: false
        };
      });
      
      // Datos del menú
      const menuData = {
        weekStartDate: new Date(weekStartDate).toISOString(),
        days: days,
        createdBy: Auth.currentUser.id
      };
      
      // Crear o actualizar menú
      let menu;
      if (menuId) {
        menu = Models.Menu.update(menuId, menuData);
        Utils.showNotification('Menú actualizado correctamente', 'success');
      } else {
        menu = Models.Menu.create(menuData);
        Utils.showNotification('Menú creado correctamente', 'success');
      }
      
      // Actualizar ID en el formulario y habilitar botón de publicar
      document.getElementById('menu-id').value = menu.id;
      const publishMenuBtn = document.getElementById('publish-menu-btn');
      if (publishMenuBtn) {
        publishMenuBtn.disabled = false;
      }
      
      // Recargar lista de menús
      this._loadMenuList();
      
    } catch (error) {
      console.error('Error al guardar menú:', error);
      Utils.showNotification(`Error: ${error.message}`, 'error');
    }
  },

  /**
   * Publica un menú
   * @param {string} menuId - ID del menú a publicar
   * @private
   */
  _publishMenu: function(menuId) {
    try {
      // Publicar menú
      Models.Menu.publish(menuId);
      
      // Actualizar UI
      Utils.showNotification('Menú publicado correctamente', 'success');
      this._loadMenuList();
      
    } catch (error) {
      console.error('Error al publicar menú:', error);
      Utils.showNotification(`Error: ${error.message}`, 'error');
    }
  },

  /**
   * Carga un menú en el formulario para edición
   * @param {string} menuId - ID del menú a cargar
   * @private
   */
  _loadMenuToForm: function(menuId) {
    try {
      const menu = Models.Menu.getById(menuId);
      if (!menu) throw new Error('Menú no encontrado');
      
      // Establecer ID y fecha de inicio
      document.getElementById('menu-id').value = menu.id;
      document.getElementById('week-start-date').value = new Date(menu.weekStartDate).toISOString().split('T')[0];
      
      // Cargar datos de los días
      menu.days.forEach(day => {
        document.getElementById(`main-dish-${day.dayOfWeek}`).value = day.mainDish || '';
        document.getElementById(`side-dish-${day.dayOfWeek}`).value = day.sideDish || '';
        document.getElementById(`beverage-${day.dayOfWeek}`).value = day.beverage || '';
      });
      
      // Habilitar/deshabilitar botón de publicar según estado
      const publishMenuBtn = document.getElementById('publish-menu-btn');
      if (publishMenuBtn) {
        publishMenuBtn.disabled = menu.status === CONFIG.MENU_STATUS.PUBLISHED;
      }
      
    } catch (error) {
      console.error('Error al cargar menú:', error);
      Utils.showNotification(`Error: ${error.message}`, 'error');
    }
  },

  /**
   * Restablece el formulario de menú a valores predeterminados
   * @private
   */
  _resetMenuForm: function() {
    const menuForm = document.getElementById('menu-form');
    if (menuForm) {
      Utils.clearForm(menuForm);
      
      // Establecer fecha actual
      const weekStart = Utils.getCurrentWeekStartDate();
      document.getElementById('week-start-date').value = weekStart.toISOString().split('T')[0];
      
      // Deshabilitar botón de publicar
      const publishMenuBtn = document.getElementById('publish-menu-btn');
      if (publishMenuBtn) {
        publishMenuBtn.disabled = true;
      }
    }
  },

  /**
   * Carga la lista de menús
   * @private
   */
  _loadMenuList: function() {
    const menuListContainer = document.getElementById('menu-list-container');
    if (!menuListContainer) return;
    
    try {
      const menus = Models.Menu.getAll();
      
      if (menus.length === 0) {
        menuListContainer.innerHTML = '<p class="text-center">No hay menús registrados</p>';
        return;
      }
      
      // Ordenar menús por fecha (más reciente primero)
      menus.sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate));
      
      let html = '<h3 class="mt-4">Menús Registrados</h3>';
      html += '<div class="table-container"><table class="table">';
      html += `
        <thead>
          <tr>
            <th>Semana del</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      menus.forEach(menu => {
        const statusText = menu.status === CONFIG.MENU_STATUS.PUBLISHED 
          ? 'Publicado' 
          : (menu.status === CONFIG.MENU_STATUS.ARCHIVED ? 'Archivado' : 'Borrador');
        
        const statusClass = menu.status === CONFIG.MENU_STATUS.PUBLISHED 
          ? 'success' 
          : (menu.status === CONFIG.MENU_STATUS.ARCHIVED ? 'secondary' : 'warning');
        
        html += `
          <tr>
            <td>${Utils.formatDate(menu.weekStartDate)}</td>
            <td><span class="badge badge-${statusClass}">${statusText}</span></td>
            <td>${Utils.formatDate(menu.createdAt)}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-menu-btn" data-id="${menu.id}">Editar</button>
              ${menu.status !== CONFIG.MENU_STATUS.PUBLISHED ? 
                `<button class="btn btn-sm btn-success ml-1 publish-menu-btn" data-id="${menu.id}">Publicar</button>` : ''}
              ${menu.status !== CONFIG.MENU_STATUS.ARCHIVED ? 
                `<button class="btn btn-sm btn-secondary ml-1 archive-menu-btn" data-id="${menu.id}">Archivar</button>` : ''}
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      menuListContainer.innerHTML = html;
      
      // Configurar eventos para los botones
      menuListContainer.querySelectorAll('.edit-menu-btn').forEach(button => {
        button.addEventListener('click', () => {
          const menuId = button.getAttribute('data-id');
          this._loadMenuToForm(menuId);
        });
      });
      
      menuListContainer.querySelectorAll('.publish-menu-btn').forEach(button => {
        button.addEventListener('click', () => {
          const menuId = button.getAttribute('data-id');
          this._publishMenu(menuId);
        });
      });
      
      menuListContainer.querySelectorAll('.archive-menu-btn').forEach(button => {
        button.addEventListener('click', () => {
          const menuId = button.getAttribute('data-id');
          Models.Menu.archive(menuId);
          Utils.showNotification('Menú archivado correctamente', 'success');
          this._loadMenuList();
        });
      });
      
    } catch (error) {
      console.error('Error al cargar lista de menús:', error);
      menuListContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
    }
  },

  /**
   * Inicializa la gestión de usuarios
   * @private
   */
  _initUserManagement: function() {
    // Crear contenedor para el formulario de usuario
    const userFormContainer = document.getElementById('user-form-container');
    if (userFormContainer) {
      userFormContainer.innerHTML = this._createUserFormHTML();
    }
    
    // Cargar lista de usuarios
    this._loadUserList();
    
    // Configurar eventos del formulario de usuario
    this._setupUserFormEvents();
  },

  /**
   * Crea el HTML para el formulario de creación/edición de usuario
   * @returns {string} HTML del formulario
   * @private
   */
  _createUserFormHTML: function() {
    return `
      <form id="user-form" class="form">
        <input type="hidden" id="user-id" name="user-id">
        <h3 id="user-form-title">Crear Nuevo Coordinador</h3>
        
        <div class="form-group">
          <label for="user-name">Nombre completo:</label>
          <input type="text" id="user-name" name="user-name" class="form-control">
          <div class="form-help">Ingrese el nombre completo del coordinador</div>
        </div>
        
        <div class="form-group">
          <label for="user-username">Nombre de usuario:</label>
          <input type="text" id="user-username" name="user-username" class="form-control">
          <div class="form-help">Solo letras, números y guiones bajos (sin espacios)</div>
        </div>
        
        <div class="form-group">
          <label for="user-password">Contraseña:</label>
          <input type="password" id="user-password" name="user-password" class="form-control">
          <div class="form-help">Mínimo 6 caracteres. Dejarlo en blanco para mantener la contraseña actual (al editar)</div>
        </div>
        
        <div class="form-group">
          <label for="user-max-people">Número máximo de personas:</label>
          <input type="number" id="user-max-people" name="user-max-people" min="1" class="form-control">
          <div class="form-help">Número máximo de personas que este coordinador puede registrar</div>
        </div>
        
        <div class="form-group text-center">
          <button type="submit" id="save-user-btn" class="btn btn-primary">Guardar Coordinador</button>
          <button type="button" id="new-user-btn" class="btn btn-secondary ml-2">Nuevo Coordinador</button>
        </div>
      </form>
    `;
  },

  /**
   * Configura los eventos del formulario de usuario
   * @private
   */
  _setupUserFormEvents: function() {
    const userForm = document.getElementById('user-form');
    if (!userForm) return;
    
    // Definir reglas de validación
    const validationRules = {
      'user-name': {
        required: true,
        minLength: 3,
        maxLength: 100
      },
      'user-username': {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: 'Solo letras, números y guiones bajos'
      },
      'user-password': {
        required: function() {
          // Solo requerido si es un nuevo usuario (sin ID)
          return !document.getElementById('user-id').value;
        },
        minLength: 6
      },
      'user-max-people': {
        required: true,
        number: true,
        min: 1,
        max: 1000
      }
    };
    
    // Configurar validación en tiempo real
    Validation.setupLiveValidation('user-form', validationRules);
    
    // Manejar envío del formulario
    userForm.addEventListener('submit', (event) => {
      event.preventDefault();
      
      if (Validation.validateForm('user-form', validationRules)) {
        this._saveUser();
      } else {
        // Mostrar mensaje de error si la validación falla
        Components.showToast('Por favor, corrija los errores en el formulario', 'danger');
      }
    });
    
    // Botón de nuevo usuario
    const newUserBtn = document.getElementById('new-user-btn');
    if (newUserBtn) {
      newUserBtn.addEventListener('click', () => {
        this._resetUserForm();
      });
    }
  },

  /**
   * Guarda un usuario (crea uno nuevo o actualiza uno existente)
   * @private
   */
  _saveUser: function() {
    try {
      const userId = document.getElementById('user-id').value;
      const name = document.getElementById('user-name').value;
      const username = document.getElementById('user-username').value;
      const password = document.getElementById('user-password').value;
      const maxPeople = parseInt(document.getElementById('user-max-people').value, 10);
      
      // Verificar si el nombre de usuario ya existe (para nuevos usuarios)
      if (!userId) {
        const existingUser = Models.User.findByUsername(username);
        if (existingUser) {
          Validation.showFieldError('user-username', 'Este nombre de usuario ya está en uso');
          Components.showToast('El nombre de usuario ya está en uso', 'warning');
          return;
        }
      }
      
      // Datos del usuario
      const userData = {
        name: name,
        username: username,
        role: CONFIG.ROLES.COORDINATOR,
        maxPeople: maxPeople
      };
      
      // Añadir contraseña solo si se está creando un nuevo usuario o si se ha modificado
      if (!userId || password) {
        userData.password = password;
      }
      
      // Crear o actualizar usuario
      let user;
      if (userId) {
        user = Models.User.update(userId, userData);
        Components.showToast('Coordinador actualizado correctamente', 'success');
      } else {
        user = Models.User.create(userData);
        Components.showToast('Coordinador creado correctamente', 'success');
      }
      
      // Resetear formulario
      this._resetUserForm();
      
      // Recargar lista de usuarios
      this._loadUserList();
      
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      Components.showToast(`Error: ${error.message}`, 'danger');
    }
  },

  /**
   * Carga un usuario en el formulario para edición
   * @param {string} userId - ID del usuario a cargar
   * @private
   */
  _loadUserToForm: function(userId) {
    try {
      const user = Models.User.getById(userId);
      if (!user) throw new Error('Usuario no encontrado');
      
      // Establecer título del formulario
      document.getElementById('user-form-title').textContent = 'Editar Coordinador';
      
      // Cargar datos del usuario
      document.getElementById('user-id').value = user.id;
      document.getElementById('user-name').value = user.name || '';
      document.getElementById('user-username').value = user.username || '';
      document.getElementById('user-password').value = ''; // No mostrar contraseña por seguridad
      document.getElementById('user-max-people').value = user.maxPeople || '';
      
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      Utils.showNotification(`Error: ${error.message}`, 'error');
    }
  },

  /**
   * Restablece el formulario de usuario a valores predeterminados
   * @private
   */
  _resetUserForm: function() {
    const userForm = document.getElementById('user-form');
    if (userForm) {
      Utils.clearForm(userForm);
      document.getElementById('user-form-title').textContent = 'Crear Nuevo Coordinador';
    }
  },

  /**
   * Carga la lista de usuarios coordinadores
   * @private
   */
  _loadUserList: function() {
    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) return;
    
    try {
      const users = Models.User.getAllCoordinators();
      
      if (users.length === 0) {
        userListContainer.innerHTML = '<p class="text-center">No hay coordinadores registrados</p>';
        return;
      }
      
      let html = '<h3 class="mt-4">Coordinadores Registrados</h3>';
      html += '<div class="table-container"><table class="table">';
      html += `
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Máx. Personas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      users.forEach(user => {
        html += `
          <tr>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.maxPeople}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}">Editar</button>
              <button class="btn btn-sm btn-danger ml-1 delete-user-btn" data-id="${user.id}">Eliminar</button>
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      userListContainer.innerHTML = html;
      
      // Configurar eventos para los botones
      userListContainer.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', () => {
          const userId = button.getAttribute('data-id');
          this._loadUserToForm(userId);
        });
      });
      
      userListContainer.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', () => {
          const userId = button.getAttribute('data-id');
          if (confirm('¿Está seguro de eliminar este coordinador?')) {
            Models.User.delete(userId);
            Utils.showNotification('Coordinador eliminado correctamente', 'success');
            this._loadUserList();
          }
        });
      });
      
    } catch (error) {
      console.error('Error al cargar lista de usuarios:', error);
      userListContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
    }
  },

  /**
   * Inicializa los reportes de asistencia
   * @private
   */
  _initReports: function() {
    // Cargar menús activos para selector
    this._loadMenuSelector();
    
    // Configurar eventos para reportes
    document.addEventListener('change', (event) => {
      if (event.target.id === 'report-menu-selector') {
        const menuId = event.target.value;
        if (menuId) {
          this._loadAttendanceReport(menuId);
        }
      }
    });
  },

  /**
   * Carga el selector de menús para reportes
   * @private
   */
  _loadMenuSelector: function() {
    const reportsContainer = document.getElementById('reports-container');
    if (!reportsContainer) return;
    
    try {
      const menus = Models.Menu.getAll();
      
      // Filtrar menús publicados y archivados (todos los que pueden tener datos)
      const availableMenus = menus.filter(menu => 
        menu.status === CONFIG.MENU_STATUS.PUBLISHED || menu.status === CONFIG.MENU_STATUS.ARCHIVED
      );
      
      if (availableMenus.length === 0) {
        reportsContainer.innerHTML = '<p class="text-center">No hay menús disponibles para generar reportes</p>';
        return;
      }
      
      // Ordenar por fecha (más reciente primero)
      availableMenus.sort((a, b) => 
        new Date(b.weekStartDate) - new Date(a.weekStartDate)
      );
      
      // Crear estructura para filtros y selector
      let html = `
        <div class="card mb-4">
          <div class="card-header">
            <h5>Filtros de Reportes</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <div class="form-group">
                  <label for="report-menu-selector">Seleccione un menú:</label>
                  <select id="report-menu-selector" class="form-control">
                    <option value="">-- Seleccione --</option>
      `;
      
      // Agrupar menús por mes para mejor organización
      const menusByMonth = {};
      
      availableMenus.forEach(menu => {
        const date = new Date(menu.weekStartDate);
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
        const monthName = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        
        if (!menusByMonth[monthYear]) {
          menusByMonth[monthYear] = {
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            menus: []
          };
        }
        
        menusByMonth[monthYear].menus.push(menu);
      });
      
      // Crear opciones agrupadas por mes
      Object.keys(menusByMonth).sort().reverse().forEach(monthKey => {
        const monthData = menusByMonth[monthKey];
        
        html += `<optgroup label="${monthData.name}">`;
        
        monthData.menus.forEach(menu => {
          const statusLabel = menu.status === CONFIG.MENU_STATUS.ARCHIVED ? ' (Archivado)' : '';
          html += `<option value="${menu.id}">Semana del ${Utils.formatDate(menu.weekStartDate)}${statusLabel}</option>`;
        });
        
        html += `</optgroup>`;
      });
      
      html += `
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label for="report-view-type">Tipo de vista:</label>
                  <select id="report-view-type" class="form-control">
                    <option value="detailed">Detallada</option>
                    <option value="summary">Resumen</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label for="report-compare">Comparar con:</label>
                  <select id="report-compare" class="form-control">
                    <option value="">Sin comparación</option>
                    <option value="previous">Semana anterior</option>
                    <option value="average">Promedio histórico</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="attendance-report-container"></div>
      `;
      
      reportsContainer.innerHTML = html;
      
      // Configurar eventos para los filtros
      const menuSelector = document.getElementById('report-menu-selector');
      const viewTypeSelector = document.getElementById('report-view-type');
      const compareSelector = document.getElementById('report-compare');
      
      // Evento para cambio de menú
      menuSelector.addEventListener('change', () => {
        const menuId = menuSelector.value;
        if (menuId) {
          this._loadAttendanceReport(
            menuId, 
            viewTypeSelector.value, 
            compareSelector.value
          );
        }
      });
      
      // Eventos para cambio de tipo de vista y comparación
      viewTypeSelector.addEventListener('change', () => {
        const menuId = menuSelector.value;
        if (menuId) {
          this._loadAttendanceReport(
            menuId, 
            viewTypeSelector.value, 
            compareSelector.value
          );
        }
      });
      
      compareSelector.addEventListener('change', () => {
        const menuId = menuSelector.value;
        if (menuId) {
          this._loadAttendanceReport(
            menuId, 
            viewTypeSelector.value, 
            compareSelector.value
          );
        }
      });
      
      // Cargar reporte del menú más reciente automáticamente
      if (availableMenus.length > 0) {
        menuSelector.value = availableMenus[0].id;
        
        // Disparar evento change
        const event = new Event('change');
        menuSelector.dispatchEvent(event);
      }
      
    } catch (error) {
      console.error('Error al cargar selector de menús:', error);
      reportsContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
    }
  },

  /**
   * Carga el reporte de asistencia para un menú específico
   * @param {string} menuId - ID del menú
   * @param {string} viewType - Tipo de vista ('detailed' o 'summary')
   * @param {string} compareType - Tipo de comparación ('', 'previous' o 'average')
   * @private
   */
  _loadAttendanceReport: function(menuId, viewType = 'detailed', compareType = '') {
    const reportContainer = document.getElementById('attendance-report-container');
    if (!reportContainer) return;
    
    try {
      const menu = Models.Menu.getById(menuId);
      if (!menu) throw new Error('Menú no encontrado');
      
      // Obtener estadísticas de asistencia
      const stats = Models.Confirmation.getAttendanceStats(menuId);
      const coordinatorStats = Models.Confirmation.getStatsByCoordinator(menuId);
      
      // Obtener datos para comparación si es necesario
      let compareData = null;
      let compareLabel = '';
      
      if (compareType === 'previous') {
        // Buscar el menú anterior para comparar
        const menus = Models.Menu.getAll().filter(m => 
          (m.status === CONFIG.MENU_STATUS.PUBLISHED || m.status === CONFIG.MENU_STATUS.ARCHIVED) &&
          new Date(m.weekStartDate) < new Date(menu.weekStartDate)
        );
        
        // Ordenar por fecha (más reciente primero)
        menus.sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate));
        
        if (menus.length > 0) {
          const previousMenu = menus[0];
          compareData = Models.Confirmation.getAttendanceStats(previousMenu.id);
          compareLabel = `Semana del ${Utils.formatDate(previousMenu.weekStartDate)}`;
        }
      } else if (compareType === 'average') {
        // Calcular promedio histórico
        const menus = Models.Menu.getAll().filter(m => 
          (m.status === CONFIG.MENU_STATUS.PUBLISHED || m.status === CONFIG.MENU_STATUS.ARCHIVED) &&
          m.id !== menuId
        );
        
        if (menus.length > 0) {
          // Inicializar estructura para promedios
          compareData = {
            dailyTotals: {},
            weekTotal: 0,
            averagePerDay: 0,
            highestDay: { dayOfWeek: 0, count: 0 },
            lowestDay: { dayOfWeek: 0, count: 0 }
          };
          
          // Inicializar totales para cada día
          for (let i = 0; i < 7; i++) {
            compareData.dailyTotals[i] = 0;
          }
          
          // Sumar todos los totales
          let validMenus = 0;
          let totalAttendance = 0;
          
          menus.forEach(m => {
            const menuStats = Models.Confirmation.getAttendanceStats(m.id);
            if (menuStats.weekTotal > 0) {
              validMenus++;
              totalAttendance += menuStats.weekTotal;
              
              // Sumar por día
              for (let i = 0; i < 7; i++) {
                compareData.dailyTotals[i] += menuStats.dailyTotals[i] || 0;
              }
            }
          });
          
          // Calcular promedios
          if (validMenus > 0) {
            compareData.weekTotal = Math.round(totalAttendance / validMenus);
            
            for (let i = 0; i < 7; i++) {
              compareData.dailyTotals[i] = Math.round(compareData.dailyTotals[i] / validMenus);
              
              // Actualizar día con mayor asistencia
              if (compareData.dailyTotals[i] > compareData.highestDay.count) {
                compareData.highestDay = { dayOfWeek: i, count: compareData.dailyTotals[i] };
              }
              
              // Actualizar día con menor asistencia (solo si hay asistencia)
              if (compareData.dailyTotals[i] > 0 && 
                  (compareData.lowestDay.count === 0 || compareData.dailyTotals[i] < compareData.lowestDay.count)) {
                compareData.lowestDay = { dayOfWeek: i, count: compareData.dailyTotals[i] };
              }
            }
            
            compareData.averagePerDay = Math.round(compareData.weekTotal / 5); // Promedio por día laborable
            compareLabel = `Promedio histórico (${validMenus} semanas)`;
          }
        }
      }
      
      let html = `<h4 class="mt-4">Reporte de Asistencia - Semana del ${Utils.formatDate(menu.weekStartDate)}</h4>`;
      
      // Panel de resumen general
      html += `
        <div class="dashboard-summary mb-4">
          <div class="row">
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h2 class="card-title">${stats.weekTotal}</h2>
                  <p class="card-text">Total Asistentes</p>
                  ${compareData ? `<small class="${stats.weekTotal > compareData.weekTotal ? 'text-success' : 'text-danger'}">
                    ${stats.weekTotal > compareData.weekTotal ? '▲' : '▼'} ${Math.abs(stats.weekTotal - compareData.weekTotal)} vs ${compareType === 'previous' ? 'anterior' : 'prom.'}
                  </small>` : ''}
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h2 class="card-title">${stats.averagePerDay}</h2>
                  <p class="card-text">Promedio Diario</p>
                  ${compareData ? `<small class="${stats.averagePerDay > compareData.averagePerDay ? 'text-success' : 'text-danger'}">
                    ${stats.averagePerDay > compareData.averagePerDay ? '▲' : '▼'} ${Math.abs(stats.averagePerDay - compareData.averagePerDay)} vs ${compareType === 'previous' ? 'anterior' : 'prom.'}
                  </small>` : ''}
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h2 class="card-title">${stats.highestDay.count}</h2>
                  <p class="card-text">Día con Mayor Asistencia</p>
                  <small>${stats.highestDay.count > 0 ? CONFIG.DAYS_OF_WEEK[stats.highestDay.dayOfWeek].name : 'N/A'}</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h2 class="card-title">${stats.daysWithData}/${menu.days.length}</h2>
                  <p class="card-text">Días con Datos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Si es vista resumida, mostrar solo el panel de resumen
      if (viewType === 'summary') {
        // Añadir gráfico de barras para comparación visual
        html += '<div class="card mb-4"><div class="card-header"><h5>Comparativa de Asistencia Diaria</h5></div>';
        html += '<div class="card-body">';
        
        // Generar gráfico de barras simple con CSS
        html += '<div class="chart-container">';
        
        // Encontrar el valor máximo para escalar el gráfico
        let maxValue = 0;
        menu.days.forEach(day => {
          const dayTotal = stats.dailyTotals[day.dayOfWeek] || 0;
          const compareTotal = compareData ? compareData.dailyTotals[day.dayOfWeek] || 0 : 0;
          maxValue = Math.max(maxValue, dayTotal, compareTotal);
        });
        
        // Asegurar que maxValue no sea 0 para evitar división por cero
        maxValue = maxValue || 1;
        
        // Crear barras para cada día
        menu.days.forEach(day => {
          const dayTotal = stats.dailyTotals[day.dayOfWeek] || 0;
          const compareTotal = compareData ? compareData.dailyTotals[day.dayOfWeek] || 0 : 0;
          
          const currentHeight = Math.max(5, Math.round((dayTotal / maxValue) * 100));
          const compareHeight = compareData ? Math.max(5, Math.round((compareTotal / maxValue) * 100)) : 0;
          
          html += `
            <div class="chart-day">
              <div class="chart-label">${CONFIG.DAYS_OF_WEEK[day.dayOfWeek].shortName}</div>
              <div class="chart-bars">
                <div class="chart-bar current" style="height: ${currentHeight}%" title="${dayTotal} asistentes">
                  <span class="chart-value">${dayTotal}</span>
                </div>
                ${compareData ? `
                  <div class="chart-bar compare" style="height: ${compareHeight}%" title="${compareTotal} asistentes (${compareLabel})">
                    <span class="chart-value">${compareTotal}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        });
        
        html += '</div>'; // Fin chart-container
        
        // Leyenda
        if (compareData) {
          html += `
            <div class="chart-legend mt-3">
              <div class="legend-item"><span class="legend-color current"></span> Semana actual</div>
              <div class="legend-item"><span class="legend-color compare"></span> ${compareLabel}</div>
            </div>
          `;
        }
        
        html += '</div></div>'; // Fin card-body y card
      } else {
        // Vista detallada
        // Tabla de resumen por día
        html += '<div class="card mb-4"><div class="card-header"><h5>Resumen de Asistencia Diaria</h5></div>';
        html += '<div class="card-body"><div class="table-container"><table class="table">';
        html += `
          <thead>
            <tr>
              <th>Día</th>
              <th>Fecha</th>
              <th>Menú</th>
              <th>Total Asistentes</th>
              ${compareData ? '<th>Comparación</th>' : ''}
              <th>% del Total</th>
            </tr>
          </thead>
          <tbody>
        `;
        
        menu.days.forEach(day => {
          const dayTotal = stats.dailyTotals[day.dayOfWeek] || 0;
          const percentage = stats.weekTotal > 0 ? Math.round((dayTotal / stats.weekTotal) * 100) : 0;
          
          // Determinar clase CSS basada en el porcentaje de asistencia
          let rowClass = '';
          if (dayTotal > 0) {
            if (dayTotal === stats.highestDay.count) {
              rowClass = 'table-success';
            } else if (dayTotal === stats.lowestDay.count && stats.daysWithData > 1) {
              rowClass = 'table-warning';
            }
          }
          
          // Comparación si está disponible
          let compareHtml = '';
          if (compareData) {
            const compareTotal = compareData.dailyTotals[day.dayOfWeek] || 0;
            const diff = dayTotal - compareTotal;
            const diffClass = diff > 0 ? 'text-success' : (diff < 0 ? 'text-danger' : '');
            
            compareHtml = `
              <td>
                <span class="${diffClass}">
                  ${diff > 0 ? '▲' : (diff < 0 ? '▼' : '=')} 
                  ${Math.abs(diff)} (${compareTotal})
                </span>
              </td>
            `;
          }
          
          html += `
            <tr class="${rowClass}">
              <td>${CONFIG.DAYS_OF_WEEK[day.dayOfWeek].name}</td>
              <td>${Utils.formatDate(day.date)}</td>
              <td>
                <strong>${day.mainDish}</strong><br>
                <small>${day.sideDish} / ${day.beverage}</small>
              </td>
              <td><strong>${dayTotal}</strong></td>
              ${compareHtml}
              <td>
                <div class="progress">
                  <div class="progress-bar" role="progressbar" style="width: ${percentage}%" 
                       aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div>
                </div>
              </td>
            </tr>
          `;
        });
        
        html += '</tbody></table></div></div></div>';
        
        // Tabla detallada por coordinador
        html += '<div class="card"><div class="card-header"><h5>Detalle por Coordinador</h5></div>';
        html += '<div class="card-body"><div class="table-container"><table class="table">';
        html += `
          <thead>
            <tr>
              <th>Coordinador</th>
        `;
        
        // Encabezados de días
        menu.days.forEach(day => {
          html += `<th>${CONFIG.DAYS_OF_WEEK[day.dayOfWeek].shortName}</th>`;
        });
        
        html += `
              <th>Total</th>
              <th>Tasa</th>
            </tr>
          </thead>
          <tbody>
        `;
        
        // Filas por coordinador
        coordinatorStats.forEach(coordStat => {
          const coordinator = coordStat.coordinator;
          
          html += `<tr><td>${coordinator.name}</td>`;
          
          // Valores por día
          menu.days.forEach(day => {
            const dayValue = coordStat.dailyTotals[day.dayOfWeek] || 0;
            html += `<td>${dayValue}</td>`;
          });
          
          // Total y tasa de asistencia
          html += `<td><strong>${coordStat.weekTotal}</strong></td>`;
          html += `
            <td>
              <div class="progress">
                <div class="progress-bar ${coordStat.attendanceRate < 50 ? 'bg-warning' : ''}" role="progressbar" 
                     style="width: ${coordStat.attendanceRate}%" aria-valuenow="${coordStat.attendanceRate}" 
                     aria-valuemin="0" aria-valuemax="100">${coordStat.attendanceRate}%</div>
              </div>
            </td>
          </tr>`;
        });
        
        // Fila de totales
        html += '<tr class="table-active"><td><strong>TOTAL</strong></td>';
        
        menu.days.forEach(day => {
          const dayTotal = stats.dailyTotals[day.dayOfWeek] || 0;
          html += `<td><strong>${dayTotal}</strong></td>`;
        });
        
        // Calcular tasa de asistencia global
        let maxPossible = 0;
        coordinatorStats.forEach(coordStat => {
          const coordinator = coordStat.coordinator;
          if (coordinator.maxPeople) {
            maxPossible += coordinator.maxPeople * menu.days.length;
          }
        });
        
        const globalRate = maxPossible > 0 ? Math.round((stats.weekTotal / maxPossible) * 100) : 0;
        
        html += `<td><strong>${stats.weekTotal}</strong></td>`;
        html += `
          <td>
            <div class="progress">
              <div class="progress-bar ${globalRate < 50 ? 'bg-warning' : ''}" role="progressbar" 
                   style="width: ${globalRate}%" aria-valuenow="${globalRate}" 
                   aria-valuemin="0" aria-valuemax="100">${globalRate}%</div>
            </div>
          </td>
        </tr>`;
        
        html += '</tbody></table></div></div></div>';
      }
      
      reportContainer.innerHTML = html;
      
    } catch (error) {
      console.error('Error al cargar reporte de asistencia:', error);
      reportContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
    }
  },

  /**
   * Inicializa la funcionalidad de exportación e importación de datos
   * @private
   */
  _initExportImport: function() {
    // Verificar que el módulo ExportImport esté disponible
    if (typeof ExportImport === 'undefined') {
      console.error('El módulo ExportImport no está disponible');
      return;
    }
    
    // Referencia al contenedor
    const exportImportTab = document.getElementById('export-import-tab');
    if (!exportImportTab) return;
    
    // Inicializar selectores y botones
    const exportDataType = document.getElementById('export-data-type');
    const reportOptions = document.getElementById('report-options');
    const reportMenuId = document.getElementById('report-menu-id');
    const exportExcelBtn = document.getElementById('export-excel');
    const exportCsvBtn = document.getElementById('export-csv');
    const exportJsonBtn = document.getElementById('export-json');
    const importDataType = document.getElementById('import-data-type');
    const importFile = document.getElementById('import-file');
    const importButton = document.getElementById('import-button');
    
    // Mostrar/ocultar opciones de reporte según el tipo de datos seleccionado
    exportDataType.addEventListener('change', () => {
      reportOptions.style.display = exportDataType.value === 'report' ? 'block' : 'none';
      
      // Si es reporte, cargar menús disponibles
      if (exportDataType.value === 'report') {
        this._loadMenusForReport(reportMenuId);
      }
    });
    
    // Botones de exportación
    exportExcelBtn.addEventListener('click', () => this._handleExport('excel'));
    exportCsvBtn.addEventListener('click', () => this._handleExport('csv'));
    exportJsonBtn.addEventListener('click', () => this._handleExport('json'));
    
    // Botón de importación
    importButton.addEventListener('click', () => this._handleImport());
    
    // Cargar menús disponibles para reportes
    this._loadMenusForReport(reportMenuId);
  },
  
  /**
   * Carga los menús disponibles para el selector de reportes
   * @param {HTMLSelectElement} selectElement - Elemento select para menús
   * @private
   */
  _loadMenusForReport: function(selectElement) {
    // Limpiar opciones actuales
    selectElement.innerHTML = '';
    
    // Obtener menús publicados
    const menus = Models.getAllMenus().filter(menu => menu.status === CONFIG.MENU_STATUS.PUBLISHED);
    
    // Si no hay menús, mostrar mensaje
    if (menus.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No hay menús publicados disponibles';
      selectElement.appendChild(option);
      return;
    }
    
    // Añadir opciones para cada menú
    menus.forEach(menu => {
      const option = document.createElement('option');
      option.value = menu.id;
      option.textContent = `Semana del ${Utils.formatDate(menu.weekStart)}`;
      selectElement.appendChild(option);
    });
  },
  
  /**
   * Maneja la exportación de datos según el formato seleccionado
   * @param {string} format - Formato de exportación (excel, csv, json)
   * @private
   */
  _handleExport: function(format) {
    const exportDataType = document.getElementById('export-data-type').value;
    let exportData;
    let fileName = 'comedor-empresarial';
    
    // Obtener datos según el tipo seleccionado
    switch (exportDataType) {
      case 'menus':
        exportData = ExportImport.prepareMenusForExport();
        fileName = 'menus-semanales';
        break;
      case 'confirmations':
        exportData = ExportImport.prepareConfirmationsForExport();
        fileName = 'confirmaciones-asistencia';
        break;
      case 'coordinators':
        exportData = ExportImport.prepareCoordinatorsForExport();
        fileName = 'coordinadores';
        break;
      case 'report':
        const menuId = document.getElementById('report-menu-id').value;
        if (!menuId) {
          Components.showToast('Seleccione un menú para el reporte', 'warning');
          return;
        }
        exportData = ExportImport.prepareReportForExport(menuId);
        fileName = 'reporte-asistencia';
        break;
      default:
        Components.showToast('Tipo de datos no válido', 'danger');
        return;
    }
    
    // Verificar que hay datos para exportar
    if (!exportData || !exportData.rows || exportData.rows.length === 0) {
      Components.showToast('No hay datos para exportar', 'warning');
      return;
    }
    
    // Exportar según el formato seleccionado
    switch (format) {
      case 'excel':
        ExportImport.exportToExcel(exportData.rows, exportData.headers, exportDataType, fileName);
        break;
      case 'csv':
        ExportImport.exportToCSV(exportData.rows, exportData.headers, fileName);
        break;
      case 'json':
        // Convertir a formato JSON adecuado
        const jsonData = exportData.rows.map(row => {
          const obj = {};
          exportData.headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        ExportImport.exportToJSON(jsonData, fileName);
        break;
      default:
        Components.showToast('Formato no válido', 'danger');
    }
  },
  
  /**
   * Maneja la importación de datos
   * @private
   */
  _handleImport: function() {
    const dataType = document.getElementById('import-data-type').value;
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
      Components.showToast('Por favor, seleccione un archivo', 'warning');
      return;
    }
    
    // Determinar formato según extensión
    const extension = file.name.split('.').pop().toLowerCase();
    let importFunction;
    
    switch (extension) {
      case 'xlsx':
        importFunction = ExportImport.importFromExcel;
        break;
      case 'csv':
        importFunction = ExportImport.importFromCSV;
        break;
      case 'json':
        importFunction = ExportImport.importFromJSON;
        break;
      default:
        Components.showToast('Formato de archivo no soportado', 'danger');
        return;
    }
    
    // Mostrar diálogo de confirmación
    Components.showConfirmDialog({
      title: 'Confirmar Importación',
      message: `¿Está seguro de que desea importar los datos de ${dataType}? Esta acción reemplazará los datos existentes.`,
      onConfirm: () => {
        // Proceder con la importación
        importFunction(file)
          .then(data => {
            // Procesar datos según el tipo
            switch (dataType) {
              case 'menus':
                this._processImportedMenus(data);
                break;
              case 'confirmations':
                this._processImportedConfirmations(data);
                break;
              case 'coordinators':
                this._processImportedCoordinators(data);
                break;
              default:
                Components.showToast('Tipo de datos no válido', 'danger');
            }
          })
          .catch(error => {
            console.error('Error al importar:', error);
            Components.showToast('Error al importar datos', 'danger');
          });
      }
    });
  },
  
  /**
   * Procesa los menús importados
   * @param {Array} data - Datos importados
   * @private
   */
  _processImportedMenus: function(data) {
    try {
      // Verificar que los datos tengan el formato esperado
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Formato de datos inválido');
      }
      
      // Convertir datos importados al formato del modelo
      const menus = data.map(item => {
        // Verificar campos requeridos
        if (!item.ID || !item.Semana) {
          console.warn('Menú con datos incompletos:', item);
          return null;
        }
        
        // Extraer fecha de inicio de semana
        let weekStart;
        try {
          weekStart = new Date(item.Semana);
        } catch (e) {
          console.warn('Fecha de semana inválida:', item.Semana);
          return null;
        }
        
        // Crear estructura de días
        const days = [];
        const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        
        weekdays.forEach((day, index) => {
          const mainDishKey = `${day} - Principal`;
          const sideDishKey = `${day} - Guarnición`;
          const drinkKey = `${day} - Bebida`;
          
          if (item[mainDishKey] || item[sideDishKey] || item[drinkKey]) {
            days.push({
              dayOfWeek: index + 1,
              mainDish: item[mainDishKey] || '',
              sideDish: item[sideDishKey] || '',
              drink: item[drinkKey] || ''
            });
          }
        });
        
        return {
          id: item.ID,
          weekStart: weekStart,
          status: item.Estado || CONFIG.MENU_STATUS.DRAFT,
          days: days,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }).filter(menu => menu !== null);
      
      // Guardar menús en localStorage
      if (menus.length > 0) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, menus);
        Components.showToast(`${menus.length} menús importados correctamente`, 'success');
        
        // Recargar lista de menús
        this._loadMenuList();
      } else {
        Components.showToast('No se pudieron importar los menús', 'warning');
      }
    } catch (error) {
      console.error('Error al procesar menús importados:', error);
      Components.showToast(`Error al procesar los datos: ${error.message}`, 'danger');
    }
  },
  
  /**
   * Procesa los menús importados
   * @param {Array} data - Datos importados
   * @private
   */
  _processImportedMenus: function(data) {
    try {
    // Verificar que los datos tengan el formato esperado
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Formato de datos inválido');
    }
    
    // Convertir datos importados al formato del modelo
    const menus = data.map(item => {
      // Verificar campos requeridos
      if (!item.ID || !item.Semana) {
        console.warn('Menú con datos incompletos:', item);
        return null;
      }
      
      // Extraer fecha de inicio de semana
      let weekStart;
      try {
        weekStart = new Date(item.Semana);
      } catch (e) {
        console.warn('Fecha de semana inválida:', item.Semana);
        return null;
      }
      
      // Crear estructura de días
      const days = [];
      const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      
      weekdays.forEach((day, index) => {
        const mainDishKey = `${day} - Principal`;
        const sideDishKey = `${day} - Guarnición`;
        const drinkKey = `${day} - Bebida`;
        
        if (item[mainDishKey] || item[sideDishKey] || item[drinkKey]) {
          days.push({
            dayOfWeek: index + 1,
            mainDish: item[mainDishKey] || '',
            sideDish: item[sideDishKey] || '',
            drink: item[drinkKey] || ''
          });
        }
      });
      
      return {
        id: item.ID,
        weekStart: weekStart,
        status: item.Estado || CONFIG.MENU_STATUS.DRAFT,
        days: days,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).filter(menu => menu !== null);
    
    // Guardar menús en localStorage
    if (menus.length > 0) {
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, menus);
      Components.showToast(`${menus.length} menús importados correctamente`, 'success');
      
      // Recargar lista de menús
      this._loadMenuList();
    } else {
      Components.showToast('No se pudieron importar los menús', 'warning');
    }
  } catch (error) {
    console.error('Error al procesar menús importados:', error);
    Components.showToast(`Error al procesar los datos: ${error.message}`, 'danger');
  }
},
  
  /**
   * Procesa las confirmaciones importadas
   * @param {Array} data - Datos importados
   * @private
   */
  _processImportedConfirmations: function(data) {
    try {
    // Verificar que los datos tengan el formato esperado
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Formato de datos inválido');
    }
    
    // Obtener coordinadores existentes para validación
    const coordinators = Models.getAllCoordinators();
    
    // Convertir datos importados al formato del modelo
    const confirmations = data.map(item => {
      // Verificar campos requeridos
      if (!item.ID || !item.Coordinador || !item.Semana) {
        console.warn('Confirmación con datos incompletos:', item);
        return null;
      }
      
      // Buscar coordinador por nombre
      const coordinator = coordinators.find(c => c.name === item.Coordinador);
      if (!coordinator) {
        console.warn('Coordinador no encontrado:', item.Coordinador);
        return null;
      }
      
      // Extraer fecha de inicio de semana
      let weekStart;
      try {
        weekStart = new Date(item.Semana);
      } catch (e) {
        console.warn('Fecha de semana inválida:', item.Semana);
        return null;
      }
      
      // Crear estructura de días con asistentes
      const days = [];
      const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      
      weekdays.forEach((day, index) => {
        const attendees = parseInt(item[day] || 0, 10);
        if (!isNaN(attendees)) {
          days.push({
            dayOfWeek: index + 1,
            attendees: attendees
          });
        }
      });
      
      return {
        id: item.ID,
        coordinatorId: coordinator.id,
        weekStart: weekStart,
        days: days,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).filter(confirmation => confirmation !== null);
    
    // Guardar confirmaciones en localStorage
    if (confirmations.length > 0) {
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, confirmations);
      Components.showToast(`${confirmations.length} confirmaciones importadas correctamente`, 'success');
      
      // Recargar reportes si estamos en esa pestaña
      if (document.querySelector('#reports-tab.active')) {
        this._loadAttendanceReport();
      }
    } else {
      Components.showToast('No se pudieron importar las confirmaciones', 'warning');
    }
  } catch (error) {
    console.error('Error al procesar confirmaciones importadas:', error);
    Components.showToast(`Error al procesar los datos: ${error.message}`, 'danger');
  }
},
  
  /**
   * Procesa los coordinadores importados
   * @param {Array} data - Datos importados
   * @private
   */
  _processImportedCoordinators: function(data) {
    try {
    // Verificar que los datos tengan el formato esperado
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Formato de datos inválido');
    }
    
    // Convertir datos importados al formato del modelo
    const coordinators = data.map(item => {
      // Verificar campos requeridos
      if (!item.ID || !item.Nombre || !item.Usuario) {
        console.warn('Coordinador con datos incompletos:', item);
        return null;
      }
      
      // Extraer máximo de personas
      const maxPeople = parseInt(item['Máximo de Personas'] || 0, 10);
      
      return {
        id: item.ID,
        name: item.Nombre,
        username: item.Usuario,
        // Nota: Por seguridad, no importamos contraseñas. Se asigna una contraseña temporal.
        password: 'temporal123',
        role: CONFIG.ROLES.COORDINATOR,
        maxPeople: isNaN(maxPeople) ? 0 : maxPeople,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).filter(coordinator => coordinator !== null);
    
    // Guardar coordinadores en localStorage
    if (coordinators.length > 0) {
      // Obtener usuarios actuales (para mantener al admin)
      const currentUsers = Models.getAllUsers();
      const adminUsers = currentUsers.filter(user => user.role === CONFIG.ROLES.ADMIN);
      
      // Combinar admin con nuevos coordinadores
      const allUsers = [...adminUsers, ...coordinators];
      
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, allUsers);
      Components.showToast(`${coordinators.length} coordinadores importados correctamente`, 'success');
      Components.showToast('IMPORTANTE: Se han asignado contraseñas temporales a los coordinadores importados', 'warning', 5000);
      
      // Recargar lista de usuarios
      this._loadUserList();
    } else {
      Components.showToast('No se pudieron importar los coordinadores', 'warning');
    }
  } catch (error) {
    console.error('Error al procesar coordinadores importados:', error);
    Components.showToast(`Error al procesar los datos: ${error.message}`, 'danger');
  }
},

  /**
   * Inicializa la gestión de almacenamiento
   * @private
   */
  _initStorageManagement: function() {
    // Verificar que StorageManager esté disponible
    if (typeof StorageManager === 'undefined') {
      console.error('StorageManager no está disponible');
      return;
    }
    
    // Inicializar valores de los campos de configuración
    const archiveThresholdInput = document.getElementById('archive-threshold');
    const cleanupThresholdInput = document.getElementById('cleanup-threshold');
    
    if (archiveThresholdInput && cleanupThresholdInput) {
      // Cargar valores guardados o usar valores predeterminados
      archiveThresholdInput.value = StorageManager.getConfig('archiveThreshold') || 30;
      cleanupThresholdInput.value = StorageManager.getConfig('cleanupThreshold') || 90;
      
      // Guardar configuración cuando cambian los valores
      archiveThresholdInput.addEventListener('change', () => {
        const value = parseInt(archiveThresholdInput.value, 10);
        if (value >= 7 && value <= 365) {
          StorageManager.setConfig('archiveThreshold', value);
          Components.showToast('Umbral de archivado actualizado', 'success');
        }
      });
      
      cleanupThresholdInput.addEventListener('change', () => {
        const value = parseInt(cleanupThresholdInput.value, 10);
        if (value >= 30 && value <= 730) {
          StorageManager.setConfig('cleanupThreshold', value);
          Components.showToast('Umbral de limpieza actualizado', 'success');
        }
      });
    }
    
    // Configurar botones de acciones
    const archiveDataBtn = document.getElementById('archive-data-btn');
    const cleanupDataBtn = document.getElementById('cleanup-data-btn');
    const createBackupBtn = document.getElementById('create-backup-btn');
    const downloadBackupBtn = document.getElementById('download-backup-btn');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    
    // Botón para archivar datos antiguos
    if (archiveDataBtn) {
      archiveDataBtn.addEventListener('click', () => {
        Components.showConfirm(
          'Archivar datos antiguos',
          `¿Está seguro de que desea archivar los datos más antiguos que ${archiveThresholdInput.value} días? Esta acción no elimina los datos, solo los mueve al archivo.`,
          () => {
            const threshold = parseInt(archiveThresholdInput.value, 10);
            const result = StorageManager.archiveOldData(threshold);
            
            if (result.success) {
              Components.showToast(`Datos archivados: ${result.archivedCount} elementos`, 'success');
              this._updateStorageStats();
            } else {
              Components.showToast(`Error al archivar datos: ${result.error}`, 'danger');
            }
          }
        );
      });
    }
    
    // Botón para limpiar datos archivados
    if (cleanupDataBtn) {
      cleanupDataBtn.addEventListener('click', () => {
        Components.showConfirm(
          'Limpiar datos archivados',
          `¿Está seguro de que desea eliminar permanentemente los datos archivados más antiguos que ${cleanupThresholdInput.value} días? Esta acción no se puede deshacer.`,
          () => {
            const threshold = parseInt(cleanupThresholdInput.value, 10);
            const result = StorageManager.cleanupArchivedData(threshold);
            
            if (result.success) {
              Components.showToast(`Datos eliminados: ${result.cleanedCount} elementos`, 'success');
              this._updateStorageStats();
            } else {
              Components.showToast(`Error al limpiar datos: ${result.error}`, 'danger');
            }
          }
        );
      });
    }
    
    // Botón para crear respaldo
    if (createBackupBtn) {
      createBackupBtn.addEventListener('click', () => {
        const result = StorageManager.createBackup();
        
        if (result.success) {
          const lastBackupDate = new Date();
          StorageManager.setConfig('lastBackupDate', lastBackupDate.toISOString());
          document.getElementById('last-backup-date').textContent = lastBackupDate.toLocaleString();
          
          Components.showToast('Respaldo creado correctamente', 'success');
          // Habilitar botón de descarga
          downloadBackupBtn.disabled = false;
        } else {
          Components.showToast(`Error al crear respaldo: ${result.error}`, 'danger');
        }
      });
    }
    
    // Botón para descargar respaldo
    if (downloadBackupBtn) {
      // Deshabilitar si no hay respaldo
      downloadBackupBtn.disabled = !StorageManager.hasBackup();
      
      downloadBackupBtn.addEventListener('click', () => {
        try {
          // Obtener el respaldo usando la API del StorageManager
          const backup = StorageManager.getBackup();
          
          if (!backup) {
            Components.showToast('No hay respaldo disponible para descargar', 'warning');
            return;
          }
          
          // Preparar nombre del archivo con fecha
          const dateStr = backup.date ? 
            new Date(backup.date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];
          const fileName = `comedor_backup_${dateStr}.json`;
          
          // Preparar datos para la descarga
          let dataToDownload;
          
          // Si los datos ya están en formato string (comprimido), usarlos directamente
          if (typeof backup.data === 'string') {
            dataToDownload = backup.data;
          } else {
            // Si no, convertir a JSON con manejo de errores
            try {
              dataToDownload = JSON.stringify(backup.data);
            } catch (jsonError) {
              console.error('Error al convertir respaldo a JSON:', jsonError);
              Components.showToast('Error al procesar el respaldo para descarga', 'danger');
              return;
            }
          }
          
          // Crear archivo para descargar
          const blob = new Blob([dataToDownload], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.style.display = 'none'; // Ocultar el enlace
          document.body.appendChild(a);
          
          // Iniciar descarga
          a.click();
          
          // Mostrar información al usuario
          const sizeKB = Math.round((dataToDownload.length * 2) / 1024); // Aproximación del tamaño
          Components.showToast(`Respaldo descargado correctamente (${sizeKB} KB)`, 'success');
          
          // Limpiar recursos
          setTimeout(() => {
            try {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (cleanupError) {
              console.warn('Error al limpiar recursos de descarga:', cleanupError);
              // No mostramos este error al usuario ya que la descarga probablemente funcionó
            }
          }, 100);
        } catch (error) {
          console.error('Error al descargar respaldo:', error);
          Components.showToast('Error al descargar el respaldo: ' + (error.message || 'Error desconocido'), 'danger');
        }
      });
    }
    
    // Botón para restaurar respaldo
    if (restoreBackupBtn) {
      restoreBackupBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('restore-backup-file');
        
        if (!fileInput || fileInput.files.length === 0) {
          Components.showToast('Seleccione un archivo de respaldo', 'warning');
          return;
        }
        
        const file = fileInput.files[0];
        
        // Validar tipo de archivo
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          Components.showToast('El archivo debe ser de tipo JSON', 'warning');
          return;
        }
        
        // Validar tamaño del archivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          Components.showToast('El archivo es demasiado grande. El tamaño máximo es 5MB', 'warning');
          return;
        }
        
        // Mostrar confirmación antes de restaurar
        Components.showConfirm(
          'Restaurar respaldo',
          `Esta acción reemplazará todos los datos actuales con los del respaldo "${file.name}" (${Math.round(file.size/1024)} KB). ¿Está seguro de continuar?`,
          () => {
            // Mostrar indicador de carga
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'restore-loading';
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<span>Restaurando respaldo...</span>';
            document.body.appendChild(loadingIndicator);
            
            // Leer el archivo
            const reader = new FileReader();
            
            reader.onload = (e) => {
              try {
                let backupData;
                
                // Intentar parsear el JSON
                try {
                  backupData = JSON.parse(e.target.result);
                } catch (parseError) {
                  console.error('Error al parsear JSON del respaldo:', parseError);
                  Components.showToast('El archivo no contiene un JSON válido', 'danger');
                  document.body.removeChild(loadingIndicator);
                  return;
                }
                
                // Validar estructura básica del respaldo
                if (!backupData) {
                  Components.showToast('El archivo de respaldo está vacío o tiene un formato inválido', 'danger');
                  document.body.removeChild(loadingIndicator);
                  return;
                }
                
                // Restaurar el respaldo
                const result = StorageManager.restoreBackup(backupData);
                
                // Quitar indicador de carga
                document.body.removeChild(loadingIndicator);
                
                if (result.success) {
                  // Mostrar mensaje de éxito con detalles
                  let successMessage = 'Respaldo restaurado correctamente';
                  if (result.backupDate) {
                    const formattedDate = new Date(result.backupDate).toLocaleString();
                    successMessage += ` (fecha del respaldo: ${formattedDate})`;
                  }
                  
                  Components.showToast(successMessage, 'success');
                  
                  // Recargar la página para aplicar los cambios
                  setTimeout(() => {
                    Components.showToast('Recargando página para aplicar los cambios...', 'info');
                    setTimeout(() => window.location.reload(), 1000);
                  }, 1500);
                } else {
                  Components.showToast(`Error al restaurar respaldo: ${result.error || 'Error desconocido'}`, 'danger');
                }
              } catch (error) {
                console.error('Error al procesar archivo de respaldo:', error);
                Components.showToast(`Error al procesar el archivo de respaldo: ${error.message || 'Error desconocido'}`, 'danger');
                document.body.removeChild(loadingIndicator);
              }
            };
            
            reader.onerror = () => {
              Components.showToast('Error al leer el archivo', 'danger');
              document.body.removeChild(loadingIndicator);
            };
            
            // Iniciar la lectura del archivo
            reader.readAsText(file);
          }
        );
      });
    }
    
    // Mostrar fecha del último respaldo
    const lastBackupDate = StorageManager.getConfig('lastBackupDate');
    if (lastBackupDate) {
      document.getElementById('last-backup-date').textContent = new Date(lastBackupDate).toLocaleString();
    }
    
    // Actualizar estadísticas de almacenamiento
    this._updateStorageStats();
    
    // Configurar actualización periódica de estadísticas (cada 30 segundos)
    setInterval(() => this._updateStorageStats(), 30000);
  },
  
  /**
   * Actualiza las estadísticas de almacenamiento en la interfaz
   * @private
   */
  _updateStorageStats: function() {
    try {
      // Verificar si estamos en la pestaña de almacenamiento
      const storageTab = document.getElementById('storage-tab');
      const isStorageTabActive = storageTab && storageTab.classList.contains('active');
      
      // Si no estamos en la pestaña de almacenamiento, no actualizamos la UI
      if (!isStorageTabActive) {
        return;
      }
      
      // Obtener estadísticas de almacenamiento
      const stats = StorageManager.getStorageStats();
      if (!stats) {
        console.warn('No se pudieron obtener estadísticas de almacenamiento');
        return;
      }
      
      // Actualizar barra de progreso
      const usageBar = document.getElementById('storage-usage-bar');
      if (usageBar) {
        const usagePercent = Math.min(Math.round(stats.usedPercentage), 100);
        usageBar.style.width = `${usagePercent}%`;
        usageBar.textContent = `${usagePercent}%`;
        usageBar.setAttribute('aria-valuenow', usagePercent);
        
        // Cambiar color según el uso
        usageBar.className = 'progress-bar';
        if (usagePercent > 85) {
          usageBar.classList.add('bg-danger');
        } else if (usagePercent > 70) {
          usageBar.classList.add('bg-warning');
        } else {
          usageBar.classList.add('bg-success');
        }
      }
      
      // Actualizar detalles de uso
      const usageDetails = document.getElementById('storage-usage-details');
      if (usageDetails) {
        usageDetails.textContent = `${(stats.used / 1024).toFixed(2)} KB de ${(stats.total / 1024).toFixed(2)} KB utilizados`;
      }
      
      // Actualizar contadores - verificando existencia de cada elemento
      const updateElement = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = text;
        }
      };
      
      updateElement('menus-count', `${stats.activeMenus} activos`);
      updateElement('archived-menus-count', `${stats.archivedMenus} archivados`);
      updateElement('confirmations-count', `${stats.activeConfirmations} activas`);
      updateElement('archived-confirmations-count', `${stats.archivedConfirmations} archivadas`);
      updateElement('users-count', `${stats.users} usuarios`);
      
      // Mostrar advertencia si el almacenamiento está casi lleno
      if (stats.usedPercentage > 85 && !this._storageWarningShown) {
        Components.showToast('¡Advertencia! El almacenamiento local está casi lleno. Considere limpiar datos antiguos.', 'warning', 5000);
        this._storageWarningShown = true;
      } else if (stats.usedPercentage <= 70) {
        this._storageWarningShown = false;
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas de almacenamiento:', error);
      // No mostramos el error al usuario para no interrumpir su experiencia
    }
  }
};
