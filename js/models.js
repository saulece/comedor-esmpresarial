/**
 * Modelos de datos para el Sistema de Confirmación de Asistencias
 * Define las estructuras de datos y operaciones CRUD para la aplicación
 */

const Models = {
  /**
   * Modelo de Usuario
   */
  User: {
    /**
     * Obtiene todos los usuarios
     * @returns {Array} Lista de usuarios
     */
    getAll: function() {
      return Utils.getFromStorage(CONFIG.STORAGE_KEYS.USERS, []);
    },

    /**
     * Obtiene un usuario por su ID
     * @param {string} id - ID del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    getById: function(id) {
      const users = this.getAll();
      return Utils.findById(users, id);
    },

    /**
     * Obtiene un usuario por su nombre de usuario
     * @param {string} username - Nombre de usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    getByUsername: function(username) {
      const users = this.getAll();
      return users.find(user => user.username === username) || null;
    },

    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Object} Usuario creado
     */
    create: function(userData) {
      const users = this.getAll();
      
      // Verificar si ya existe un usuario con el mismo nombre de usuario
      if (this.getByUsername(userData.username)) {
        throw new Error(`El usuario ${userData.username} ya existe`);
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: Utils.generateId(),
        username: userData.username,
        password: userData.password, // En una aplicación real, esto debería estar hasheado
        name: userData.name,
        role: userData.role,
        maxPeople: userData.role === CONFIG.ROLES.COORDINATOR ? (userData.maxPeople || 0) : null,
        createdAt: new Date().toISOString()
      };
      
      // Guardar en el almacenamiento
      users.push(newUser);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, users);
      
      return newUser;
    },

    /**
     * Actualiza un usuario existente
     * @param {string} id - ID del usuario
     * @param {Object} userData - Datos actualizados
     * @returns {Object} Usuario actualizado
     */
    update: function(id, userData) {
      const users = this.getAll();
      const index = users.findIndex(user => user.id === id);
      
      if (index === -1) {
        throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      
      // Si se está cambiando el nombre de usuario, verificar que no exista otro igual
      if (userData.username && userData.username !== users[index].username) {
        const existingUser = this.getByUsername(userData.username);
        if (existingUser && existingUser.id !== id) {
          throw new Error(`El usuario ${userData.username} ya existe`);
        }
      }
      
      // Actualizar usuario
      users[index] = {
        ...users[index],
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // Si el rol cambió a admin, eliminar maxPeople
      if (users[index].role === CONFIG.ROLES.ADMIN) {
        users[index].maxPeople = null;
      }
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, users);
      
      return users[index];
    },

    /**
     * Elimina un usuario
     * @param {string} id - ID del usuario
     * @returns {boolean} True si se eliminó correctamente
     */
    delete: function(id) {
      const users = this.getAll();
      const filteredUsers = users.filter(user => user.id !== id);
      
      if (filteredUsers.length === users.length) {
        throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, filteredUsers);
      
      return true;
    },

    /**
     * Obtiene todos los coordinadores
     * @returns {Array} Lista de coordinadores
     */
    getAllCoordinators: function() {
      const users = this.getAll();
      return users.filter(user => user.role === CONFIG.ROLES.COORDINATOR);
    },

    /**
     * Inicializa el usuario administrador predeterminado si no existe ningún usuario
     */
    initDefaultAdmin: function() {
      const users = this.getAll();
      
      if (users.length === 0) {
        this.create(CONFIG.DEFAULT_ADMIN);
        console.log('Usuario administrador predeterminado creado');
      }
    }
  },

  /**
   * Modelo de Menú Semanal
   */
  Menu: {
    /**
     * Obtiene todos los menús
     * @returns {Array} Lista de menús
     */
    getAll: function() {
      return Utils.getFromStorage(CONFIG.STORAGE_KEYS.MENUS, []);
    },

    /**
     * Obtiene un menú por su ID
     * @param {string} id - ID del menú
     * @returns {Object|null} Menú encontrado o null
     */
    getById: function(id) {
      const menus = this.getAll();
      return Utils.findById(menus, id);
    },

    /**
     * Obtiene el menú activo más reciente
     * @returns {Object|null} Menú activo o null
     */
    getActiveMenu: function() {
      const menus = this.getAll();
      const publishedMenus = menus.filter(menu => 
        menu.status === CONFIG.MENU_STATUS.PUBLISHED
      );
      
      // Ordenar por fecha de inicio de semana (más reciente primero)
      publishedMenus.sort((a, b) => 
        new Date(b.weekStartDate) - new Date(a.weekStartDate)
      );
      
      return publishedMenus.length > 0 ? publishedMenus[0] : null;
    },

    /**
     * Crea un nuevo menú semanal
     * @param {Object} menuData - Datos del menú
     * @returns {Object} Menú creado
     */
    create: function(menuData) {
      const menus = this.getAll();
      
      // Crear nuevo menú
      const newMenu = {
        id: Utils.generateId(),
        weekStartDate: menuData.weekStartDate || Utils.getCurrentWeekStartDate().toISOString(),
        status: menuData.status || CONFIG.MENU_STATUS.DRAFT,
        days: menuData.days || this._createEmptyWeekDays(),
        createdBy: menuData.createdBy,
        createdAt: new Date().toISOString()
      };
      
      // Guardar en el almacenamiento
      menus.push(newMenu);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, menus);
      
      return newMenu;
    },

    /**
     * Actualiza un menú existente
     * @param {string} id - ID del menú
     * @param {Object} menuData - Datos actualizados
     * @returns {Object} Menú actualizado
     */
    update: function(id, menuData) {
      const menus = this.getAll();
      const index = menus.findIndex(menu => menu.id === id);
      
      if (index === -1) {
        throw new Error(`Menú con ID ${id} no encontrado`);
      }
      
      // Actualizar menú
      menus[index] = {
        ...menus[index],
        ...menuData,
        updatedAt: new Date().toISOString()
      };
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, menus);
      
      return menus[index];
    },

    /**
     * Elimina un menú
     * @param {string} id - ID del menú
     * @returns {boolean} True si se eliminó correctamente
     */
    delete: function(id) {
      const menus = this.getAll();
      const filteredMenus = menus.filter(menu => menu.id !== id);
      
      if (filteredMenus.length === menus.length) {
        throw new Error(`Menú con ID ${id} no encontrado`);
      }
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, filteredMenus);
      
      return true;
    },

    /**
     * Publica un menú
     * @param {string} id - ID del menú
     * @returns {Object} Menú publicado
     */
    publish: function(id) {
      return this.update(id, { status: CONFIG.MENU_STATUS.PUBLISHED });
    },

    /**
     * Archiva un menú
     * @param {string} id - ID del menú
     * @returns {Object} Menú archivado
     */
    archive: function(id) {
      return this.update(id, { status: CONFIG.MENU_STATUS.ARCHIVED });
    },

    /**
     * Crea una estructura vacía para los días de la semana
     * @returns {Array} Estructura de días vacía
     * @private
     */
    _createEmptyWeekDays: function() {
      const weekStart = Utils.getCurrentWeekStartDate();
      const weekDays = Utils.getWeekDays(weekStart);
      
      return weekDays.map(day => ({
        dayOfWeek: day.dayOfWeek,
        date: day.date.toISOString(),
        mainDish: '',
        sideDish: '',
        beverage: '',
        published: false
      }));
    }
  },

  /**
   * Modelo de Confirmación de Asistencia
   */
  Confirmation: {
    /**
     * Obtiene todas las confirmaciones
     * @returns {Array} Lista de confirmaciones
     */
    getAll: function() {
      return Utils.getFromStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, []);
    },

    /**
     * Obtiene una confirmación por su ID
     * @param {string} id - ID de la confirmación
     * @returns {Object|null} Confirmación encontrada o null
     */
    getById: function(id) {
      const confirmations = this.getAll();
      return Utils.findById(confirmations, id);
    },

    /**
     * Obtiene las confirmaciones para un menú específico
     * @param {string} menuId - ID del menú
     * @returns {Array} Lista de confirmaciones para el menú
     */
    getByMenuId: function(menuId) {
      const confirmations = this.getAll();
      return confirmations.filter(conf => conf.menuId === menuId);
    },

    /**
     * Obtiene la confirmación de un coordinador para un menú específico
     * @param {string} coordinatorId - ID del coordinador
     * @param {string} menuId - ID del menú
     * @returns {Object|null} Confirmación encontrada o null
     */
    getByCoordinatorAndMenu: function(coordinatorId, menuId) {
      const confirmations = this.getAll();
      return confirmations.find(
        conf => conf.coordinatorId === coordinatorId && conf.menuId === menuId
      ) || null;
    },

    /**
     * Crea una nueva confirmación de asistencia
     * @param {Object} confirmationData - Datos de la confirmación
     * @returns {Object} Confirmación creada
     */
    create: function(confirmationData) {
      const confirmations = this.getAll();
      
      // Verificar si ya existe una confirmación para este coordinador y menú
      const existingConf = this.getByCoordinatorAndMenu(
        confirmationData.coordinatorId, 
        confirmationData.menuId
      );
      
      if (existingConf) {
        throw new Error('Ya existe una confirmación para este coordinador y menú');
      }
      
      // Crear nueva confirmación
      const newConfirmation = {
        id: Utils.generateId(),
        coordinatorId: confirmationData.coordinatorId,
        menuId: confirmationData.menuId,
        confirmations: confirmationData.confirmations || [],
        createdAt: new Date().toISOString()
      };
      
      // Guardar en el almacenamiento
      confirmations.push(newConfirmation);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, confirmations);
      
      return newConfirmation;
    },

    /**
     * Actualiza una confirmación existente
     * @param {string} id - ID de la confirmación
     * @param {Object} confirmationData - Datos actualizados
     * @returns {Object} Confirmación actualizada
     */
    update: function(id, confirmationData) {
      const confirmations = this.getAll();
      const index = confirmations.findIndex(conf => conf.id === id);
      
      if (index === -1) {
        throw new Error(`Confirmación con ID ${id} no encontrada`);
      }
      
      // Actualizar confirmación
      confirmations[index] = {
        ...confirmations[index],
        ...confirmationData,
        updatedAt: new Date().toISOString()
      };
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, confirmations);
      
      return confirmations[index];
    },

    /**
     * Elimina una confirmación
     * @param {string} id - ID de la confirmación
     * @returns {boolean} True si se eliminó correctamente
     */
    delete: function(id) {
      const confirmations = this.getAll();
      const filteredConfirmations = confirmations.filter(conf => conf.id !== id);
      
      if (filteredConfirmations.length === confirmations.length) {
        throw new Error(`Confirmación con ID ${id} no encontrada`);
      }
      
      // Guardar en el almacenamiento
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, filteredConfirmations);
      
      return true;
    },

    /**
     * Obtiene el total de asistencias confirmadas por día para un menú
     * @param {string} menuId - ID del menú
     * @returns {Object} Totales por día
     */
    getTotalsByDay: function(menuId) {
      const confirmations = this.getByMenuId(menuId);
      const totals = {};
      
      // Inicializar totales para cada día de la semana
      for (let i = 0; i < 7; i++) {
        totals[i] = 0;
      }
      
      // Sumar confirmaciones por día
      confirmations.forEach(conf => {
        conf.confirmations.forEach(dayConf => {
          totals[dayConf.dayOfWeek] += Number(dayConf.peopleCount) || 0;
        });
      });
      
      return totals;
    },

    /**
     * Obtiene estadísticas detalladas de asistencia para un menú
     * @param {string} menuId - ID del menú
     * @returns {Object} Estadísticas de asistencia
     */
    getAttendanceStats: function(menuId) {
      const totals = this.getTotalsByDay(menuId);
      const menu = Models.Menu.getById(menuId);
      const stats = {
        dailyTotals: totals,
        weekTotal: 0,
        averagePerDay: 0,
        highestDay: { dayOfWeek: 0, count: 0 },
        lowestDay: { dayOfWeek: 0, count: Number.MAX_SAFE_INTEGER },
        daysWithData: 0
      };
      
      // Calcular totales y promedios
      let validDays = 0;
      
      for (let i = 0; i < 7; i++) {
        const dayTotal = totals[i] || 0;
        stats.weekTotal += dayTotal;
        
        // Solo contar días con datos de menú
        if (menu && menu.days.some(day => day.dayOfWeek === i)) {
          validDays++;
          
          if (dayTotal > 0) {
            stats.daysWithData++;
          }
          
          // Actualizar día con mayor asistencia
          if (dayTotal > stats.highestDay.count) {
            stats.highestDay = { dayOfWeek: i, count: dayTotal };
          }
          
          // Actualizar día con menor asistencia (solo si hay asistencia)
          if (dayTotal > 0 && dayTotal < stats.lowestDay.count) {
            stats.lowestDay = { dayOfWeek: i, count: dayTotal };
          }
        }
      }
      
      // Calcular promedio por día (solo días válidos)
      if (validDays > 0) {
        stats.averagePerDay = Math.round(stats.weekTotal / validDays);
      }
      
      // Si no hay días con datos, reiniciar el día más bajo
      if (stats.daysWithData === 0) {
        stats.lowestDay = { dayOfWeek: 0, count: 0 };
      }
      
      return stats;
    },

    /**
     * Obtiene estadísticas de asistencia por coordinador para un menú
     * @param {string} menuId - ID del menú
     * @returns {Array} Estadísticas por coordinador
     */
    getStatsByCoordinator: function(menuId) {
      const confirmations = this.getByMenuId(menuId);
      const coordinators = Models.User.getAllCoordinators();
      const menu = Models.Menu.getById(menuId);
      
      return coordinators.map(coordinator => {
        const confirmation = confirmations.find(c => c.coordinatorId === coordinator.id);
        const stats = {
          coordinator: coordinator,
          dailyTotals: {},
          weekTotal: 0,
          attendanceRate: 0 // Porcentaje de asistencia respecto al máximo posible
        };
        
        // Inicializar totales diarios
        for (let i = 0; i < 7; i++) {
          stats.dailyTotals[i] = 0;
        }
        
        // Calcular totales por día
        if (confirmation) {
          confirmation.confirmations.forEach(dayConf => {
            const count = Number(dayConf.peopleCount) || 0;
            stats.dailyTotals[dayConf.dayOfWeek] = count;
            stats.weekTotal += count;
          });
        }
        
        // Calcular tasa de asistencia (si hay un máximo definido)
        if (coordinator.maxPeople && coordinator.maxPeople > 0) {
          const validDays = menu ? menu.days.length : 5; // Usar 5 días laborables por defecto
          const maxPossible = coordinator.maxPeople * validDays;
          stats.attendanceRate = maxPossible > 0 ? Math.round((stats.weekTotal / maxPossible) * 100) : 0;
        }
        
        return stats;
      });
    },

    /**
     * Crea una estructura vacía para las confirmaciones de los días de la semana
     * @param {Array} menuDays - Días del menú
     * @returns {Array} Estructura de confirmaciones vacía
     */
    createEmptyConfirmations: function(menuDays) {
      return menuDays.map(day => ({
        dayOfWeek: day.dayOfWeek,
        date: day.date,
        peopleCount: 0
      }));
    }
  }
};
