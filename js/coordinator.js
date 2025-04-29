/**
 * coordinator.js
 * Funcionalidades específicas para la vista de coordinación
 */

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de coordinación inicializado');
    
    // Verificar si hay una sesión activa
    const hasSession = checkSession();
    
    if (hasSession) {
        // Ya hay una sesión activa, inicializar la interfaz
        initCoordinatorInterface();
    } else {
        // No hay sesión, mostrar modal de login
        showLoginModal();
    }
});

/**
 * Verifica si hay una sesión activa
 * @returns {boolean} - true si hay una sesión activa, false si no
 */
function checkSession() {
    const coordinatorId = sessionStorage.getItem('coordinatorId');
    
    if (!coordinatorId) {
        return false;
    }
    
    // Verificar que el coordinador exista en la base de datos
    const coordinator = StorageUtil.Coordinators.get(coordinatorId);
    
    if (!coordinator) {
        // El coordinador no existe, limpiar sesión
        sessionStorage.removeItem('coordinatorId');
        sessionStorage.removeItem('coordinatorName');
        sessionStorage.removeItem('loginTime');
        return false;
    }
    
    return true;
}

/**
 * Muestra el modal de login
 */
function showLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    
    if (loginModal) {
        loginModal.classList.add('active');
        
        // Configurar formulario de login
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const accessCode = document.getElementById('access-code').value.trim();
                
                if (accessCode) {
                    loginCoordinator(accessCode);
                }
            });
        }
    }
}

/**
 * Inicia sesión con un código de acceso
 * @param {string} accessCode - Código de acceso del coordinador
 */
function loginCoordinator(accessCode) {
    // Buscar el coordinador por código de acceso
    const coordinators = StorageUtil.Coordinators.getAll();
    const coordinator = coordinators.find(c => c.accessCode === accessCode);
    
    if (coordinator) {
        // Guardar información de sesión
        sessionStorage.setItem('coordinatorId', coordinator.id);
        sessionStorage.setItem('coordinatorName', coordinator.name);
        sessionStorage.setItem('loginTime', new Date().toISOString());
        
        // Ocultar modal de login
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('active');
        }
        
        // Inicializar interfaz
        initCoordinatorInterface();
        
        // Mostrar notificación de bienvenida
        showNotification(`Bienvenido, ${coordinator.name}`, 'success');
    } else {
        // Mostrar error
        showNotification('Código de acceso inválido', 'error');
    }
}

/**
 * Cierra la sesión del coordinador
 */
function logoutCoordinator() {
    // Limpiar información de sesión
    sessionStorage.removeItem('coordinatorId');
    sessionStorage.removeItem('coordinatorName');
    sessionStorage.removeItem('loginTime');
    
    // Mostrar modal de login
    showLoginModal();
    
    // Mostrar notificación
    showNotification('Sesión cerrada correctamente', 'success');
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success' o 'error')
 */
function showNotification(message, type = 'success') {
    try {
        // Eliminar notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Error al mostrar notificación:', error);
    }
}

/**
 * Inicializa la interfaz de coordinación
 */
function initCoordinatorInterface() {
    // Mostrar nombre del coordinador
    displayCoordinatorInfo();
    
    // Configurar botón de cierre de sesión
    setupLogoutButton();
    
    // Configurar navegación por pestañas
    setupTabNavigation();
    
    // Cargar datos iniciales
    loadCurrentMenu();
    
    // Inicializar gestor de confirmaciones
    AttendanceManager.init();
}

/**
 * Muestra la información del coordinador en la interfaz
 */
function displayCoordinatorInfo() {
    const coordinatorName = sessionStorage.getItem('coordinatorName');
    const nameElement = document.getElementById('coordinator-name');
    
    if (nameElement && coordinatorName) {
        nameElement.textContent = coordinatorName;
    }
}

/**
 * Configura el botón de cierre de sesión
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutCoordinator();
        });
    }
}

/**
 * Configura la navegación por pestañas
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase activa de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar el botón y contenido seleccionado
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

/**
 * Carga el menú actual
 */
function loadCurrentMenu() {
    const currentMenuContainer = document.getElementById('current-menu');
    
    if (!currentMenuContainer) return;
    
    // Obtener todos los menús
    const menus = StorageUtil.Menus.getAll();
    
    if (menus.length === 0) {
        currentMenuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para esta semana.</p>';
        return;
    }
    
    // Ordenar menús por fecha (más reciente primero)
    menus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    // Tomar el menú más reciente
    const latestMenu = menus[0];
    
    // Verificar si el menú está activo (fecha actual dentro del rango del menú)
    const today = new Date();
    const startDate = new Date(latestMenu.startDate);
    const endDate = new Date(latestMenu.endDate);
    
    if (today < startDate || today > endDate) {
        currentMenuContainer.innerHTML = '<p class="empty-state">No hay menú activo para la fecha actual.</p>';
        return;
    }
    
    // Mostrar el menú
    displayMenu(latestMenu, currentMenuContainer);
}

/**
 * Muestra un menú en el contenedor especificado
 * @param {Object} menu - Objeto de menú
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 */
function displayMenu(menu, container) {
    // Crear contenido HTML para el menú
    let html = `
        <div class="menu-header">
            <h4>Menú del ${formatDate(menu.startDate)} al ${formatDate(menu.endDate)}</h4>
        </div>
        <div class="menu-days">
    `;
    
    // Agregar cada día del menú
    menu.days.forEach(day => {
        html += `
            <div class="menu-day">
                <h5>${day.name}</h5>
                <div class="dishes-list">
        `;
        
        // Agregar cada platillo del día
        if (day.dishes && day.dishes.length > 0) {
            day.dishes.forEach(dish => {
                html += `
                    <div class="dish-item">
                        <span class="dish-name">${dish.name}</span>
                        <span class="dish-price">$${dish.price.toFixed(2)}</span>
                        <p class="dish-description">${dish.description || 'Sin descripción'}</p>
                    </div>
                `;
            });
        } else {
            html += '<p class="empty-state">No hay platillos para este día.</p>';
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Actualizar el contenedor
    container.innerHTML = html;
}

/**
 * Formatea una fecha en formato legible
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada (ej: "15 de abril de 2025")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

/**
 * Gestión de asistencia para coordinadores
 */
const AttendanceManager = {
    currentWeekStartDate: null,
    currentMenu: null,
    currentConfirmation: null,
    
    /**
     * Inicializa el gestor de confirmaciones de asistencia
     */
    init: function() {
        // Configurar selector de semana
        const prevWeekBtn = document.getElementById('prev-week-btn');
        const nextWeekBtn = document.getElementById('next-week-btn');
        
        prevWeekBtn.addEventListener('click', () => this.changeWeek(-1));
        nextWeekBtn.addEventListener('click', () => this.changeWeek(1));
        
        // Configurar formulario de asistencia
        const attendanceForm = document.getElementById('attendance-form');
        const resetBtn = document.getElementById('reset-attendance-btn');
        
        attendanceForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.saveAttendance();
        });
        
        resetBtn.addEventListener('click', () => this.resetForm());
        
        // Inicializar con la semana actual
        this.setCurrentWeek(this.getStartOfWeek(new Date()));
    },
    
    /**
     * Obtiene la fecha de inicio de la semana (lunes) para una fecha dada
     * @param {Date} date - Fecha de referencia
     * @returns {Date} - Fecha de inicio de la semana (lunes)
     */
    getStartOfWeek: function(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
        return new Date(date.setDate(diff));
    },
    
    /**
     * Establece la semana actual y carga los datos correspondientes
     * @param {Date} startDate - Fecha de inicio de la semana
     */
    setCurrentWeek: function(startDate) {
        // Guardar fecha de inicio de la semana
        this.currentWeekStartDate = startDate;
        
        // Actualizar visualización de la semana seleccionada
        this.updateWeekDisplay();
        
        // Cargar menú para la semana seleccionada
        this.loadMenuForWeek();
        
        // Cargar confirmación existente si hay
        this.loadExistingConfirmation();
    },
    
    /**
     * Cambia la semana actual
     * @param {number} offset - Número de semanas a avanzar/retroceder
     */
    changeWeek: function(offset) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        this.setCurrentWeek(newDate);
    },
    
    /**
     * Actualiza la visualización de la semana seleccionada
     */
    updateWeekDisplay: function() {
        const weekDisplay = document.getElementById('selected-week-display');
        
        if (!weekDisplay) return;
        
        // Calcular fecha de fin de semana (viernes)
        const endDate = new Date(this.currentWeekStartDate);
        endDate.setDate(endDate.getDate() + 4); // +4 días desde el lunes = viernes
        
        // Formatear fechas
        const startStr = this.formatDate(this.currentWeekStartDate);
        const endStr = this.formatDate(endDate);
        
        weekDisplay.textContent = `Semana del ${startStr} al ${endStr}`;
    },
    
    /**
     * Formatea una fecha en formato legible
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (ej: "15 de abril")
     */
    formatDate: function(date) {
        const options = { day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    },
    
    /**
     * Carga el menú para la semana seleccionada
     */
    loadMenuForWeek: function() {
        const menuContainer = document.getElementById('confirmation-menu-display');
        
        if (!menuContainer) return;
        
        // Mostrar mensaje de carga
        menuContainer.innerHTML = '<p class="empty-state">Cargando menú semanal...</p>';
        
        // Obtener todos los menús
        const menus = StorageUtil.Menus.getAll();
        
        if (menus.length === 0) {
            menuContainer.innerHTML = '<p class="empty-state">No hay menús disponibles.</p>';
            this.currentMenu = null;
            this.generateAttendanceInputs(null);
            return;
        }
        
        // Buscar menú para la semana seleccionada
        const targetStartDate = this.currentWeekStartDate.toISOString().split('T')[0];
        
        // Encontrar el menú cuyo rango de fechas incluya la semana actual
        this.currentMenu = menus.find(menu => {
            const menuStartDate = new Date(menu.startDate);
            const menuEndDate = new Date(menu.endDate);
            
            return (
                menuStartDate <= this.currentWeekStartDate && 
                menuEndDate >= this.currentWeekStartDate
            );
        });
        
        if (!this.currentMenu) {
            menuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para esta semana.</p>';
            this.generateAttendanceInputs(null);
            return;
        }
        
        // Mostrar el menú
        this.displayMenu(this.currentMenu, menuContainer);
        
        // Generar inputs para la asistencia
        this.generateAttendanceInputs(this.currentMenu);
    },
    
    /**
     * Muestra un menú en el contenedor especificado
     * @param {Object} menu - Objeto de menú
     * @param {HTMLElement} container - Contenedor donde mostrar el menú
     */
    displayMenu: function(menu, container) {
        // Crear contenido HTML para el menú
        let html = `
            <div class="menu-header">
                <h4>Menú del ${formatDate(menu.startDate)} al ${formatDate(menu.endDate)}</h4>
            </div>
            <div class="menu-days">
        `;
        
        // Filtrar solo los días de lunes a viernes
        const weekdays = menu.days.filter(day => {
            const dayLower = day.name.toLowerCase();
            return ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].includes(dayLower);
        });
        
        // Ordenar días correctamente
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5 };
        weekdays.sort((a, b) => {
            return dayOrder[a.name.toLowerCase()] - dayOrder[b.name.toLowerCase()];
        });
        
        // Agregar cada día del menú
        weekdays.forEach(day => {
            html += `
                <div class="menu-day">
                    <h5>${day.name}</h5>
                    <div class="dishes-list">
            `;
            
            // Agregar cada platillo del día
            if (day.dishes && day.dishes.length > 0) {
                day.dishes.forEach(dish => {
                    html += `
                        <div class="dish-item">
                            <span class="dish-name">${dish.name}</span>
                            <span class="dish-price">$${dish.price.toFixed(2)}</span>
                            <p class="dish-description">${dish.description || 'Sin descripción'}</p>
                        </div>
                    `;
                });
            } else {
                html += '<p class="empty-state">No hay platillos para este día.</p>';
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Actualizar el contenedor
        container.innerHTML = html;
    },
    
    /**
     * Genera los inputs para la confirmación de asistencia
     * @param {Object} menu - Objeto de menú
     */
    generateAttendanceInputs: function(menu) {
        const inputsContainer = document.getElementById('attendance-inputs');
        
        if (!inputsContainer) return;
        
        // Limpiar contenedor
        inputsContainer.innerHTML = '';
        
        if (!menu || !menu.days || menu.days.length === 0) {
            inputsContainer.innerHTML = '<p class="empty-state">No hay días disponibles para confirmar asistencia.</p>';
            return;
        }
        
        // Filtrar solo los días de lunes a viernes
        const weekdays = menu.days.filter(day => {
            const dayLower = day.name.toLowerCase();
            return ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].includes(dayLower);
        });
        
        // Ordenar días correctamente
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5 };
        weekdays.sort((a, b) => {
            return dayOrder[a.name.toLowerCase()] - dayOrder[b.name.toLowerCase()];
        });
        
        // Calcular fechas para cada día de la semana
        const weekDates = {};
        for (let i = 0; i < 5; i++) {
            const date = new Date(this.currentWeekStartDate);
            date.setDate(date.getDate() + i);
            const dayName = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'][i];
            weekDates[dayName] = date;
        }
        
        // Crear input para cada día
        weekdays.forEach(day => {
            const dayLower = day.name.toLowerCase();
            const date = weekDates[dayLower];
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'attendance-day';
            dayDiv.dataset.dayId = day.id || dayLower;
            
            const header = document.createElement('div');
            header.className = 'attendance-day-header';
            header.textContent = day.name;
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'attendance-day-date';
            dateDiv.textContent = date ? this.formatDate(date) : '';
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.htmlFor = `attendance-${dayLower}`;
            label.textContent = 'Número de personas:';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `attendance-${dayLower}`;
            input.className = 'attendance-count';
            input.min = '0';
            input.value = '0';
            input.required = true;
            
            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            
            dayDiv.appendChild(header);
            dayDiv.appendChild(dateDiv);
            dayDiv.appendChild(inputGroup);
            
            inputsContainer.appendChild(dayDiv);
        });
    },
    
    /**
     * Carga una confirmación existente si hay para la semana actual
     */
    loadExistingConfirmation: function() {
        // Obtener ID del coordinador de la sesión
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) return;
        
        // Buscar confirmación existente
        const weekStartStr = this.currentWeekStartDate.toISOString().split('T')[0];
        this.currentConfirmation = StorageUtil.AttendanceConfirmations.getByCoordinatorAndWeek(
            coordinatorId,
            weekStartStr
        );
        
        if (!this.currentConfirmation) {
            // No hay confirmación existente
            document.getElementById('last-update-info').style.display = 'none';
            document.getElementById('save-attendance-btn').textContent = 'Confirmar Asistencia';
            return;
        }
        
        // Mostrar datos de la confirmación existente
        const attendanceDays = document.querySelectorAll('.attendance-day');
        attendanceDays.forEach(dayDiv => {
            const dayId = dayDiv.dataset.dayId;
            const input = dayDiv.querySelector('input');
            
            if (input && this.currentConfirmation.attendanceCounts && dayId in this.currentConfirmation.attendanceCounts) {
                input.value = this.currentConfirmation.attendanceCounts[dayId];
            }
        });
        
        // Mostrar fecha de última actualización
        const lastUpdateInfo = document.getElementById('last-update-info');
        const lastUpdateTime = document.getElementById('last-update-time');
        
        if (lastUpdateInfo && lastUpdateTime && this.currentConfirmation.updatedAt) {
            const updateDate = new Date(this.currentConfirmation.updatedAt);
            lastUpdateTime.textContent = updateDate.toLocaleString();
            lastUpdateInfo.style.display = 'block';
        }
        
        // Cambiar texto del botón
        document.getElementById('save-attendance-btn').textContent = 'Actualizar Confirmación';
    },
    
    /**
     * Guarda la confirmación de asistencia
     */
    saveAttendance: function() {
        // Obtener ID del coordinador de la sesión
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) {
            alert('Debe iniciar sesión para confirmar asistencia.');
            return;
        }
        
        // Recopilar datos del formulario
        const attendanceCounts = {};
        const attendanceDays = document.querySelectorAll('.attendance-day');
        
        attendanceDays.forEach(dayDiv => {
            const dayId = dayDiv.dataset.dayId;
            const input = dayDiv.querySelector('input');
            
            if (input) {
                const count = parseInt(input.value, 10);
                attendanceCounts[dayId] = isNaN(count) ? 0 : count;
            }
        });
        
        // Crear o actualizar confirmación
        let confirmation;
        
        if (this.currentConfirmation) {
            // Actualizar confirmación existente
            confirmation = this.currentConfirmation;
            confirmation.attendanceCounts = attendanceCounts;
            confirmation.updatedAt = new Date();
        } else {
            // Crear nueva confirmación
            confirmation = new AttendanceConfirmation(
                null,
                coordinatorId,
                this.currentWeekStartDate.toISOString().split('T')[0],
                attendanceCounts
            );
        }
        
        // Guardar en almacenamiento
        const success = StorageUtil.AttendanceConfirmations.add(confirmation);
        
        if (success) {
            alert('Confirmación de asistencia guardada correctamente.');
            this.loadExistingConfirmation();
        } else {
            alert('Error al guardar la confirmación de asistencia.');
        }
    },
    
    /**
     * Resetea el formulario de asistencia
     */
    resetForm: function() {
        const attendanceDays = document.querySelectorAll('.attendance-day');
        
        attendanceDays.forEach(dayDiv => {
            const input = dayDiv.querySelector('input');
            if (input) {
                input.value = '0';
            }
        });
    }
};

/**
 * Gestión de entregas (placeholder para implementación futura)
 */
const DeliveryManagement = {
    // Métodos para gestionar entregas
    // Se implementarán en futuras tareas
};

/**
 * Gestión de inventario (placeholder para implementación futura)
 */
const InventoryManagement = {
    // Métodos para gestionar inventario
    // Se implementarán en futuras tareas
};

/**
 * Gestión de estadísticas (placeholder para implementación futura)
 */
const StatisticsManagement = {
    // Métodos para generar estadísticas
    // Se implementarán en futuras tareas
};
