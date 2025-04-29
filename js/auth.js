/**
 * Sistema de autenticación para el Sistema de Confirmación de Asistencias
 * Maneja el inicio de sesión, cierre de sesión y gestión de sesiones
 */

const Auth = {
  /**
   * Usuario actualmente autenticado
   */
  currentUser: null,

  /**
   * Inicializa el sistema de autenticación
   */
  init: function() {
    // Cargar usuario de sesión si existe
    this.loadUserSession();
    
    // Inicializar usuario administrador predeterminado si no hay usuarios
    Models.User.initDefaultAdmin();
    
    // Configurar eventos de autenticación
    this._setupAuthEvents();
  },

  /**
   * Carga la sesión del usuario desde localStorage
   */
  loadUserSession: function() {
    const savedUser = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      this.currentUser = savedUser;
      this._updateUIForAuthenticatedUser();
    } else {
      this._showLoginForm();
    }
  },

  /**
   * Inicia sesión con nombre de usuario y contraseña
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {boolean} True si el inicio de sesión fue exitoso
   */
  login: function(username, password) {
    const user = Models.User.getByUsername(username);
    
    if (!user || user.password !== password) {
      // Mostrar error con el nuevo sistema de toasts
      Components.showToast('Usuario o contraseña incorrectos', 'danger');
      
      // Marcar campos como inválidos
      const usernameField = document.getElementById('username');
      const passwordField = document.getElementById('password');
      
      if (usernameField && passwordField) {
        // Aplicar efecto de shake a los campos para feedback visual
        usernameField.classList.add('shake');
        passwordField.classList.add('shake');
        
        // Quitar la clase después de la animación
        setTimeout(() => {
          usernameField.classList.remove('shake');
          passwordField.classList.remove('shake');
        }, 500);
      }
      
      return false;
    }
    
    // Guardar usuario en sesión
    this.currentUser = user;
    Utils.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
    
    // Actualizar UI
    this._updateUIForAuthenticatedUser();
    
    // Mostrar mensaje de bienvenida con el nuevo sistema de toasts
    Components.showToast(`Bienvenido, ${user.name}`, 'success');
    
    return true;
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout: function() {
    // Guardar nombre del usuario para el mensaje de despedida
    const userName = this.currentUser ? this.currentUser.name : '';
    
    // Limpiar sesión
    this.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    
    // Mostrar formulario de login con animación de fade
    this._showLoginForm();
    
    // Mostrar mensaje de despedida con el nuevo sistema de toasts
    if (userName) {
      Components.showToast(`Hasta pronto, ${userName}. Sesión cerrada correctamente`, 'info');
    } else {
      Components.showToast('Sesión cerrada correctamente', 'info');
    }
    
    // Limpiar campos del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.reset();
      Validation.clearFormErrors('login-form');
    }
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns {boolean} True si hay un usuario autenticado
   */
  isAuthenticated: function() {
    return this.currentUser !== null;
  },

  /**
   * Verifica si el usuario actual tiene un rol específico
   * @param {string} role - Rol a verificar
   * @returns {boolean} True si el usuario tiene el rol especificado
   */
  hasRole: function(role) {
    return this.isAuthenticated() && this.currentUser.role === role;
  },

  /**
   * Configura los eventos relacionados con la autenticación
   * @private
   */
  _setupAuthEvents: function() {
    // Manejar envío del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      // Configurar validación del formulario de login
      this._setupLoginValidation();
      
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // Validar formulario antes de procesar
        const isValid = Validation.validateForm('login-form', this._getLoginValidationRules());
        
        if (isValid) {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          this.login(username, password);
        }
      });
      
      // Añadir animación al botón de login
      const loginButton = loginForm.querySelector('button[type="submit"]');
      if (loginButton) {
        loginButton.addEventListener('click', function() {
          if (!this.classList.contains('loading')) {
            // Añadir clase de loading solo si el formulario es válido
            const isValid = Validation.validateForm('login-form', Auth._getLoginValidationRules());
            if (isValid) {
              this.classList.add('loading');
              this.innerHTML = '<span class="spinner-sm"></span> Ingresando...';
              
              // Restaurar botón después de un tiempo
              setTimeout(() => {
                this.classList.remove('loading');
                this.innerHTML = 'Ingresar';
              }, 1500);
            }
          }
        });
      }
    }
    
    // Configurar botón de logout
    document.addEventListener('click', (event) => {
      if (event.target.matches('.logout-btn')) {
        event.preventDefault();
        
        // Mostrar diálogo de confirmación
        Components.confirm({
          title: 'Cerrar sesión',
          message: '¿Está seguro de que desea cerrar la sesión?',
          confirmText: 'Sí, cerrar sesión',
          cancelText: 'No, continuar',
          onConfirm: () => {
            this.logout();
          }
        });
      }
    });
  },
  
  /**
   * Configura la validación del formulario de login
   * @private
   */
  _setupLoginValidation: function() {
    // Configurar validación en tiempo real
    Validation.setupLiveValidation('login-form', this._getLoginValidationRules());
    
    // Añadir mensajes de ayuda a los campos
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (usernameField && usernameField.parentNode) {
      const helpText = document.createElement('div');
      helpText.className = 'form-help';
      helpText.textContent = 'Ingrese su nombre de usuario asignado';
      usernameField.parentNode.appendChild(helpText);
    }
    
    if (passwordField && passwordField.parentNode) {
      const helpText = document.createElement('div');
      helpText.className = 'form-help';
      helpText.textContent = 'Ingrese su contraseña';
      passwordField.parentNode.appendChild(helpText);
    }
  },
  
  /**
   * Obtiene las reglas de validación para el formulario de login
   * @private
   * @returns {Object} Reglas de validación
   */
  _getLoginValidationRules: function() {
    return {
      'username': {
        required: true,
        minLength: 3,
        maxLength: 50
      },
      'password': {
        required: true,
        minLength: 4
      }
    };
  },

  /**
   * Actualiza la interfaz para un usuario autenticado
   * @private
   */
  _updateUIForAuthenticatedUser: function() {
    // Ocultar sección de login
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.classList.add('hidden');
    }
    
    // Mostrar sección correspondiente según el rol
    if (this.hasRole(CONFIG.ROLES.ADMIN)) {
      const adminSection = document.getElementById('admin-section');
      if (adminSection) {
        adminSection.classList.remove('hidden');
      }
    } else if (this.hasRole(CONFIG.ROLES.COORDINATOR)) {
      const coordinatorSection = document.getElementById('coordinator-section');
      if (coordinatorSection) {
        coordinatorSection.classList.remove('hidden');
      }
    }
    
    // Actualizar información del usuario en la cabecera
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.innerHTML = `
        <span class="username">${this.currentUser.name}</span>
        <span class="role">(${this.currentUser.role === CONFIG.ROLES.ADMIN ? 'Administrador' : 'Coordinador'})</span>
        <button class="logout-btn">Cerrar sesión</button>
      `;
    }
  },

  /**
   * Muestra el formulario de login con animación
   * @private
   */
  _showLoginForm: function() {
    // Ocultar secciones de admin y coordinador primero
    const adminSection = document.getElementById('admin-section');
    if (adminSection) {
      adminSection.classList.add('hidden');
    }
    
    const coordinatorSection = document.getElementById('coordinator-section');
    if (coordinatorSection) {
      coordinatorSection.classList.add('hidden');
    }
    
    // Limpiar información del usuario en la cabecera
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.innerHTML = '';
    }
    
    // Mostrar sección de login con animación
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      // Primero quitar la clase hidden
      loginSection.classList.remove('hidden');
      
      // Aplicar efecto de fade-in
      loginSection.style.opacity = '0';
      loginSection.style.transform = 'translateY(20px)';
      loginSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      
      // Forzar un reflow para que la transición funcione
      loginSection.offsetHeight;
      
      // Aplicar valores finales para la animación
      loginSection.style.opacity = '1';
      loginSection.style.transform = 'translateY(0)';
      
      // Limpiar estilos después de la animación
      setTimeout(() => {
        loginSection.style.transition = '';
      }, 500);
      
      // Enfocar el campo de usuario después de la animación
      setTimeout(() => {
        const usernameField = document.getElementById('username');
        if (usernameField) {
          usernameField.focus();
        }
      }, 600);
    }
  }
};
