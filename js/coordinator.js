/**
 * coordinator.js
 * Funcionalidades específicas para la vista de coordinación
 */

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Módulo de coordinación inicializado');
    
    try {
        // Verificar si hay una sesión activa
        const hasSession = await checkSession();
        
        if (hasSession) {
            // Ya hay una sesión activa, inicializar la interfaz
            initCoordinatorInterface();
        } else {
            // No hay sesión, mostrar modal de login
            showLoginModal();
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        document.body.innerHTML = '<div class="error-message">Error al verificar sesión. Por favor, recarga la página.</div>';
    }
});

/**
                {
                    id: 'jueves',
                    name: 'Jueves',
                    dishes: [
                        {
                            id: 'dish_7',
                            name: 'Pozole Rojo',
                            description: 'Con maíz cacahuazintle y cerdo',
                            price: 85.00
                        },
                        {
                            id: 'dish_8',
                            name: 'Tostadas de Tinga',
                            description: 'Con pollo deshebrado en salsa de chipotle',
                            price: 65.00
                        }
                    ]
                },
                {
                    id: 'viernes',
                    name: 'Viernes',
                    dishes: [
                        {
                            id: 'dish_9',
                            name: 'Pescado a la Veracruzana',
                            description: 'Con salsa de tomate, aceitunas y alcaparras',
                            price: 110.00
                        },
                        {
                            id: 'dish_10',
                            name: 'Ensalada César',
                            description: 'Con aderezo casero y crutones',
                            price: 60.00
                        }
                    ]
                }
            ]
        };
        
        // Guardar el menú de ejemplo
        StorageUtil.Menus.add(sampleMenu);
        console.log('Menú de ejemplo inicializado correctamente');
        
        // Crear un coordinador de ejemplo si no existe ninguno
        const coordinators = StorageUtil.Coordinators.getAll();
        
        if (coordinators.length === 0) {
            const sampleCoordinator = {
                id: 'coord_' + Date.now(),
                name: 'Coordinador Demo',
                department: 'Sistemas',
                accessCode: '1234',
                email: 'demo@example.com',
                phone: '555-123-4567'
            };
            
            StorageUtil.Coordinators.add(sampleCoordinator);
            console.log('Coordinador de ejemplo inicializado correctamente');
        }
    }
}

/**
 * Verifica si hay una sesión activa
 * @returns {Promise<boolean>} - Promesa que resuelve a true si hay una sesión activa, false si no
 */
async function checkSession() {
    const coordinatorId = sessionStorage.getItem('coordinatorId');
    
    if (!coordinatorId) {
        return false;
    }
    
    try {
        console.log('Verificando sesión con Firebase para coordinador ID:', coordinatorId);
        
        // Verificar que el coordinador exista en Firebase
        const coordinator = await FirebaseCoordinatorModel.get(coordinatorId);
        
        if (!coordinator) {
            console.log('Coordinador no encontrado en Firebase, limpiando sesión');
            // El coordinador no existe, limpiar sesión
            sessionStorage.removeItem('coordinatorId');
            sessionStorage.removeItem('coordinatorName');
            sessionStorage.removeItem('loginTime');
            return false;
        }
        
        console.log('Sesión válida para coordinador:', coordinator.name);
        return true;
    } catch (error) {
        console.error('Error al verificar sesión en Firebase:', error);
        // En caso de error, limpiar sesión por seguridad
        sessionStorage.removeItem('coordinatorId');
        sessionStorage.removeItem('coordinatorName');
        sessionStorage.removeItem('loginTime');
        return false;
    }
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
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const accessCode = document.getElementById('access-code').value.trim();
                
                if (accessCode) {
                    // Mostrar indicador de carga
                    const submitButton = loginForm.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.innerHTML = '<span class="spinner"></span> Verificando...';
                    }
                    
                    try {
                        await loginCoordinator(accessCode);
                    } catch (error) {
                        console.error('Error al iniciar sesión:', error);
                        showNotification('Error al iniciar sesión. Por favor, intente nuevamente.', 'error');
                    } finally {
                        // Restaurar botón
                        if (submitButton) {
                            submitButton.disabled = false;
                            submitButton.innerHTML = 'Ingresar';
                        }
                    }
                }
            });
        }
    }
}

/**
 * Inicia sesión con un código de acceso
 * @param {string} accessCode - Código de acceso del coordinador
 * @returns {Promise<boolean>} - Promesa que resuelve a true si el inicio de sesión fue exitoso
 */
async function loginCoordinator(accessCode) {
    try {
        console.log('Verificando código de acceso en Firebase:', accessCode);
        
        // Verificar código de acceso usando Firebase
        const coordinator = await FirebaseCoordinatorModel.verifyAccessCode(accessCode);
        
        if (coordinator) {
            console.log('Código de acceso válido para coordinador:', coordinator.name);
            
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
            AppUtils.showNotification(`Bienvenido, ${coordinator.name}`, 'success');
            return true;
        } else {
            // Mostrar error
            AppUtils.showNotification('Código de acceso inválido', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al verificar código de acceso en Firebase:', error);
        AppUtils.showNotification('Error al verificar código. Por favor, intente nuevamente.', 'error');
        throw error; // Re-lanzar el error para que pueda ser capturado por el llamador
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
    AppUtils.showNotification('Sesión cerrada correctamente', 'success');
}

// La función showNotification se ha movido a utils.js

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
 * Carga el menú actual con sincronización en tiempo real
 */
function loadCurrentMenu() {
    const currentMenuContainer = document.getElementById('current-menu');
    
    if (!currentMenuContainer) return;
    
    // Mostrar indicador de carga
    currentMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menú...</p>';
    
    // Verificar si Firebase está disponible
    if (typeof FirebaseMenuModel !== 'undefined') {
        try {
            // Usar Firebase con sincronización en tiempo real
            const unsubscribe = FirebaseMenuModel.listenToActiveMenu((menu, error) => {
                if (error) {
                    console.error('Error en la escucha del menú activo:', error);
                    currentMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú. Por favor, recarga la página.</p>';
                    return;
                }
                
                if (!menu) {
                    currentMenuContainer.innerHTML = '<p class="empty-state">No hay menú activo para la fecha actual.</p>';
                    return;
                }
                
                // Mostrar el menú
                displayMenu(menu, currentMenuContainer);
                
                // Mostrar indicador de sincronización
                const syncIndicator = document.createElement('div');
                syncIndicator.className = 'sync-indicator';
                syncIndicator.innerHTML = '<span class="sync-icon"></span> Sincronizado en tiempo real';
                currentMenuContainer.appendChild(syncIndicator);
                
                // Hacer que el indicador desaparezca después de 3 segundos
                setTimeout(() => {
                    syncIndicator.classList.add('fade-out');
                    setTimeout(() => {
                        if (syncIndicator.parentNode) {
                            syncIndicator.parentNode.removeChild(syncIndicator);
                        }
                    }, 500);
                }, 3000);
            });
            
            // Guardar la función de cancelación para limpiarla cuando sea necesario
            currentMenuContainer.dataset.unsubscribe = unsubscribe;
            
            // Agregar un evento para limpiar la suscripción cuando se cambie de pestaña
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                if (button.getAttribute('data-tab') !== 'current-menu-tab') {
                    button.addEventListener('click', function() {
                        if (typeof currentMenuContainer.dataset.unsubscribe === 'function') {
                            currentMenuContainer.dataset.unsubscribe();
                            delete currentMenuContainer.dataset.unsubscribe;
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error al inicializar escucha de menú con Firebase:', error);
            currentMenuContainer.innerHTML = '<p class="error-state">Error al conectar con Firebase. Por favor, recarga la página.</p>';
        }
    } else {
        // Firebase no está disponible, mostrar mensaje de error
        console.error('Firebase no está disponible. Asegúrate de incluir los archivos necesarios.');
        currentMenuContainer.innerHTML = '<p class="error-state">Error: Firebase no está disponible. Por favor, contacta al administrador.</p>';
    }
}

/**
 * Carga el menú desde localStorage (fallback)
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 * @deprecated Esta función ya no se utiliza ya que ahora se usa Firebase para cargar el menú
 */
/* 
function loadMenuFromLocalStorage(container) {
    // Obtener todos los menús
    const menus = StorageUtil.Menus.getAll();
    
    if (menus.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay menú disponible para esta semana.</p>';
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
        container.innerHTML = '<p class="empty-state">No hay menú activo para la fecha actual.</p>';
        return;
    }
    
    // Mostrar el menú
    displayMenu(latestMenu, container);
}
*/

/**
 * Muestra un menú en el contenedor especificado
 * @param {Object} menu - Objeto de menú
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 */
function displayMenu(menu, container) {
    // Verificar que el menú tenga la estructura correcta
    if (!menu || typeof menu !== 'object') {
        container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
        return;
    }

    // Crear contenido HTML para el menú
    let html = `
        <div class="menu-header">
            <h4>Menú del ${AppUtils.formatDate(menu.startDate)} al ${AppUtils.formatDate(menu.endDate)}</h4>
        </div>
        <div class="menu-days">
    `;
    
    // Agregar cada día del menú
    if (Array.isArray(menu.days)) {
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
    } else {
        html += '<p class="empty-state">El menú no contiene días configurados.</p>';
    }
    
    html += '</div>';
    
    // Actualizar el contenedor
    container.innerHTML = html;
}

// La función formatDate se ha movido a utils.js

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
        
        attendanceForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Deshabilitar botón para evitar múltiples envíos
            const submitButton = document.getElementById('save-attendance-btn');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner"></span> Guardando...';
            }
            
            try {
                await this.saveAttendance();
            } catch (error) {
                console.error('Error al guardar confirmación:', error);
                alert('Error al guardar la confirmación de asistencia. Por favor, intente nuevamente.');
            } finally {
                // Restaurar botón
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = this.currentConfirmation ? 'Actualizar Confirmación' : 'Confirmar Asistencia';
                }
            }
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
    setCurrentWeek: async function(startDate) {
        // Guardar fecha de inicio de la semana
        this.currentWeekStartDate = startDate;
        
        // Actualizar visualización de la semana seleccionada
        this.updateWeekDisplay();
        
        // Cargar menú para la semana seleccionada (ahora es asíncrono)
        try {
            await this.loadMenuForWeek();
        } catch (error) {
            console.error('Error al cargar menú para la semana seleccionada:', error);
            // Mostrar mensaje de error en la UI
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Error al cargar el menú. Por favor, intente nuevamente.';
            
            const container = document.getElementById('confirmation-menu-display');
            if (container) {
                // Insertar al principio del contenedor
                container.innerHTML = '';
                container.appendChild(errorMsg);
                
                // Eliminar después de 5 segundos
                setTimeout(() => {
                    if (errorMsg.parentNode) {
                        errorMsg.parentNode.removeChild(errorMsg);
                    }
                }, 5000);
            }
        }
        
        // Cargar confirmación existente si hay
        try {
            await this.loadExistingConfirmation();
        } catch (error) {
            console.error('Error al cargar confirmación existente:', error);
            // Mostrar mensaje de error en la UI
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Error al cargar datos de confirmación. Por favor, intente nuevamente.';
            
            const container = document.getElementById('attendance-container');
            if (container) {
                // Insertar al principio del contenedor
                container.insertBefore(errorMsg, container.firstChild);
                
                // Eliminar después de 5 segundos
                setTimeout(() => {
                    if (errorMsg.parentNode) {
                        errorMsg.parentNode.removeChild(errorMsg);
                    }
                }, 5000);
            }
        }
    },
    
    /**
     * Cambia la semana actual
     * @param {number} offset - Número de semanas a avanzar/retroceder
     */
    changeWeek: async function(offset) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        
        // Mostrar indicador de carga
        const weekDisplay = document.getElementById('selected-week-display');
        if (weekDisplay) {
            weekDisplay.innerHTML += ' <span class="spinner small"></span>';
        }
        
        try {
            await this.setCurrentWeek(newDate);
        } catch (error) {
            console.error('Error al cambiar de semana:', error);
        } finally {
            // Actualizar visualización sin spinner
            this.updateWeekDisplay();
        }
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
        const startStr = AppUtils.formatDate(this.currentWeekStartDate);
        const endStr = AppUtils.formatDate(endDate);
        
        weekDisplay.textContent = `Semana del ${startStr} al ${endStr}`;
    },
    
    /**
     * Formatea una fecha en formato legible
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (ej: "15 de abril")
     */
    // La función formatDate se ha movido a utils.js
    formatDate: function(date) {
        const options = { day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    },
    
    /**
     * Carga el menú para la semana seleccionada usando Firebase
     * @returns {Promise<void>}
     */
    loadMenuForWeek: async function() {
        const menuContainer = document.getElementById('confirmation-menu-display');
        
        if (!menuContainer) return;
        
        // Mostrar mensaje de carga
        menuContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando menú semanal...</p>';
        
        try {
            // Obtener la fecha de inicio y fin de la semana seleccionada en formato ISO
            const weekStartDate = this.currentWeekStartDate.toISOString().split('T')[0];
            
            // Calcular la fecha de fin de la semana (viernes)
            const weekEndDate = new Date(this.currentWeekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 4); // +4 días desde el lunes = viernes
            const weekEndDateStr = weekEndDate.toISOString().split('T')[0];
            
            console.log(`Buscando menú para la semana del ${weekStartDate} al ${weekEndDateStr}`);
            
            // Consultar Firestore para obtener el menú que incluya la fecha de inicio de la semana
            const snapshot = await firebase.firestore()
                .collection('menus')
                .where('startDate', '<=', weekEndDateStr) // Menú comienza antes o en el último día de la semana
                .where('endDate', '>=', weekStartDate)   // Menú termina después o en el primer día de la semana
                .orderBy('startDate', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                console.log('No se encontró menú para la semana seleccionada');
                menuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para esta semana.</p>';
                this.currentMenu = null;
                this.generateAttendanceInputs(null);
                return;
            }
            
            // Obtener el primer documento (debería ser el único si limit(1))
            const doc = snapshot.docs[0];
            this.currentMenu = {
                ...doc.data(),
                id: doc.id
            };
            
            console.log('Menú encontrado para la semana seleccionada:', this.currentMenu);
            
            // Mostrar el menú
            this.displayMenu(this.currentMenu, menuContainer);
            
            // Generar inputs para la asistencia
            this.generateAttendanceInputs(this.currentMenu);
            
            // Mostrar indicador de sincronización
            const syncIndicator = document.createElement('div');
            syncIndicator.className = 'sync-indicator';
            syncIndicator.innerHTML = '<span class="sync-icon"></span> Datos cargados desde Firebase';
            menuContainer.appendChild(syncIndicator);
            
            // Hacer que el indicador desaparezca después de 3 segundos
            setTimeout(() => {
                syncIndicator.classList.add('fade-out');
                setTimeout(() => {
                    if (syncIndicator.parentNode) {
                        syncIndicator.parentNode.removeChild(syncIndicator);
                    }
                }, 500);
            }, 3000);
            
        } catch (error) {
            console.error('Error al cargar menú desde Firebase:', error);
            menuContainer.innerHTML = `<p class="error-state">Error al cargar el menú: ${error.message}</p>`;
            this.currentMenu = null;
            this.generateAttendanceInputs(null);
        }
    },
    
    /**
     * Muestra un menú en el contenedor especificado
     * @param {Object} menu - Objeto de menú
     * @param {HTMLElement} container - Contenedor donde mostrar el menú
     */
    displayMenu: function(menu, container) {
        // Verificar que el menú tenga la estructura correcta
        if (!menu || typeof menu !== 'object') {
            container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
            return;
        }

        // Crear contenido HTML para el menú
        let html = `
            <div class="menu-header">
                <h4>Menú del ${AppUtils.formatDate(menu.startDate)} al ${AppUtils.formatDate(menu.endDate)}</h4>
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
        
        // Calcular fechas para cada día de la semana
        const weekDates = {};
        for (let i = 0; i < 5; i++) {
            const date = new Date(this.currentWeekStartDate);
            date.setDate(date.getDate() + i);
            const dayName = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'][i];
            weekDates[dayName] = date;
        }
        
        // Crear input para cada día
        if (Array.isArray(weekdays)) {
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
                dateDiv.textContent = date ? AppUtils.formatDate(date) : '';
                
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
                
                container.appendChild(dayDiv);
            });
        } else {
            container.innerHTML = '<p class="empty-state">El menú no contiene días configurados.</p>';
        }
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
        if (Array.isArray(weekdays)) {
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
                dateDiv.textContent = date ? AppUtils.formatDate(date) : '';
                
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
        } else {
            inputsContainer.innerHTML = '<p class="empty-state">El menú no contiene días configurados.</p>';
        }
    },
    
    /**
     * Carga una confirmación existente si hay para la semana actual
     * @returns {Promise<void>} - Promesa que se resuelve cuando se completa la carga
     */
    loadExistingConfirmation: async function() {
        // Obtener ID del coordinador de la sesión
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) return;
        
        // Mostrar indicador de carga
        const saveButton = document.getElementById('save-attendance-btn');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner"></span> Cargando...';
        }
        
        try {
            // Buscar confirmación existente en Firebase
            const weekStartStr = this.currentWeekStartDate.toISOString().split('T')[0];
            console.log('Buscando confirmación para coordinador', coordinatorId, 'y semana', weekStartStr);
            
            this.currentConfirmation = await FirebaseAttendanceModel.getByCoordinatorAndWeek(
                coordinatorId,
                weekStartStr
            );
            
            if (!this.currentConfirmation) {
                console.log('No se encontró confirmación existente');
                // No hay confirmación existente
                document.getElementById('last-update-info').style.display = 'none';
                if (saveButton) {
                    saveButton.textContent = 'Confirmar Asistencia';
                    saveButton.disabled = false;
                }
                return;
            }
            
            console.log('Confirmación encontrada:', this.currentConfirmation);
        } catch (error) {
            console.error('Error al cargar confirmación desde Firebase:', error);
            if (saveButton) {
                saveButton.textContent = 'Confirmar Asistencia';
                saveButton.disabled = false;
            }
            throw error;
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
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    saveAttendance: async function() {
        // Obtener ID del coordinador de la sesión
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) {
            alert('Debe iniciar sesión para confirmar asistencia.');
            return false;
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
        let success = false;
        
        try {
            if (this.currentConfirmation) {
                // Actualizar confirmación existente
                console.log('Actualizando confirmación existente:', this.currentConfirmation.id);
                confirmation = this.currentConfirmation;
                confirmation.attendanceCounts = attendanceCounts;
                confirmation.updatedAt = new Date();
                
                // Guardar en Firebase
                success = await FirebaseAttendanceModel.update(confirmation.id, confirmation);
            } else {
                // Crear nueva confirmación
                console.log('Creando nueva confirmación para la semana:', this.currentWeekStartDate.toISOString().split('T')[0]);
                confirmation = new AttendanceConfirmation(
                    null,
                    coordinatorId,
                    this.currentWeekStartDate.toISOString().split('T')[0],
                    attendanceCounts
                );
                
                // Guardar en Firebase
                success = await FirebaseAttendanceModel.add(confirmation);
            }
            
            if (success) {
                console.log('Confirmación guardada correctamente en Firebase');
                alert('Confirmación de asistencia guardada correctamente.');
                
                // Recargar la confirmación para actualizar la UI
                await this.loadExistingConfirmation();
                return true;
            } else {
                console.error('Error al guardar la confirmación en Firebase');
                alert('Error al guardar la confirmación de asistencia.');
                return false;
            }
        } catch (error) {
            console.error('Error al guardar confirmación en Firebase:', error);
            alert('Error al guardar la confirmación de asistencia: ' + error.message);
            return false;
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
