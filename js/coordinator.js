/**
 * coordinator.js
 * Funcionalidades específicas para la vista de coordinación
 */

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Módulo de coordinación inicializado');
    
    try {
        // Inicializar Firebase Offline primero para evitar problemas de sincronización
        if (typeof FirebaseOffline !== 'undefined') {
            try {
                await FirebaseOffline.init();
                console.log('Funcionalidad offline inicializada correctamente');
            } catch (offlineError) {
                console.warn('Error no crítico al inicializar funcionalidad offline:', offlineError);
                // Continuamos a pesar del error en la inicialización offline
            }
        }
        
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
    const closeModalBtn = loginModal ? loginModal.querySelector('.close-modal-btn') : null;
    
    if (loginModal) {
        // Asegurarse que el modal se muestre y esté visible
        loginModal.classList.add('active'); 
        loginModal.style.display = 'block';
        
        // Configurar el botón de cierre del modal
        if (closeModalBtn) {
            // Remover listener anterior para evitar duplicados
            const newCloseBtn = closeModalBtn.cloneNode(true);
            closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
            
            // Añadir nuevo listener
            newCloseBtn.addEventListener('click', function() {
                loginModal.classList.remove('active');
                loginModal.style.display = 'none';
                // Redirigir a la página de inicio para mejor experiencia de usuario
                window.location.href = 'index.html';
            });
            console.log("Listener para botón de cierre de modal configurado.");
        }
        
        // Añadir listener para cerrar el modal al hacer clic fuera de él
        loginModal.addEventListener('click', function(event) {
            // Si el clic fue directamente en el fondo del modal (no en su contenido)
            if (event.target === loginModal) {
                loginModal.classList.remove('active');
                loginModal.style.display = 'none';
                // Redirigir a la página de inicio para mejor experiencia de usuario
                window.location.href = 'index.html';
            }
        });
        
        if (loginForm) {
            // Eliminar event listeners previos para evitar duplicados
            const newForm = loginForm.cloneNode(true);
            loginForm.parentNode.replaceChild(newForm, loginForm);
            
            newForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const accessCodeInput = document.getElementById('access-code'); // ID del input en el modal
                const accessCode = accessCodeInput.value.trim().toUpperCase();
                
                const submitButton = newForm.querySelector('button[type="submit"]');
                const originalButtonHtml = submitButton.innerHTML;

                if (accessCode) {
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.innerHTML = '<span class="spinner"></span> Verificando...';
                    }
                    
                    try {
                        const loginSuccess = await loginCoordinatorWithCode(accessCode); // Renombrada para claridad
                        if (!loginSuccess && submitButton) { // Si el login no es exitoso, restaurar botón
                           submitButton.disabled = false;
                           submitButton.innerHTML = originalButtonHtml;
                        }
                    } catch (error) {
                        console.error('Error al iniciar sesión:', error);
                        AppUtils.showNotification('Error al iniciar sesión. Por favor, intente nuevamente.', 'error');
                        if (submitButton) {
                           submitButton.disabled = false;
                           submitButton.innerHTML = originalButtonHtml;
                        }
                    }
                } else {
                     AppUtils.showNotification('Por favor, ingrese un código de acceso.', 'error');
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
async function loginCoordinatorWithCode(accessCode) { // Renombrada
    try {
        console.log('Verificando código de acceso en Firebase:', accessCode);
        const coordinator = await FirebaseCoordinatorModel.verifyAccessCode(accessCode);
        
        if (coordinator) {
            console.log('Código de acceso válido para coordinador:', coordinator.name);
            
            sessionStorage.setItem('coordinatorId', coordinator.id);
            sessionStorage.setItem('coordinatorName', coordinator.name);
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            // Asegurarse de que el modal se oculte correctamente
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.remove('active');
                loginModal.style.display = 'none'; // Forzar ocultamiento con estilo
            }
            
            // Pequeño retraso para asegurar que el modal se oculte antes de inicializar la interfaz
            setTimeout(() => {
                initCoordinatorInterface();
                AppUtils.showNotification(`Bienvenido, ${coordinator.name}`, 'success');
            }, 100);
            
            return true;
        } else {
            AppUtils.showNotification('Código de acceso inválido.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al verificar código de acceso en Firebase:', error);
        AppUtils.showNotification('Error al verificar código. Por favor, intente nuevamente.', 'error');
        // No relanzar error aquí para que el botón se restaure en el caller.
        return false;
    }
}

/**
 * Cierra la sesión del coordinador
 */
function logoutCoordinator() {
    sessionStorage.removeItem('coordinatorId');
    sessionStorage.removeItem('coordinatorName');
    sessionStorage.removeItem('loginTime');
    
    // Recargar la página para asegurar que el modal de login se muestre y se limpie el estado
    window.location.reload(); 
    // AppUtils.showNotification('Sesión cerrada correctamente', 'success'); // Se pierde al recargar
}

/**
 * Inicializa la interfaz de coordinación
 */
function initCoordinatorInterface() {
    displayCoordinatorInfo();
    setupLogoutButton();
    setupTabNavigation();
    loadCurrentMenu(); // Para la pestaña de "Menú Semanal"
    AttendanceManager.init(); // Para la pestaña de "Confirmaciones"
}

/**
 * Muestra la información del coordinador en la interfaz
 */
function displayCoordinatorInfo() {
    const coordinatorName = sessionStorage.getItem('coordinatorName');
    const nameElement = document.getElementById('coordinator-name');
    if (nameElement && coordinatorName) nameElement.textContent = coordinatorName;
}

/**
 * Configura el botón de cierre de sesión
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutCoordinator);
}

/**
 * Configura la navegación por pestañas
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) tabContent.classList.add('active');

            // Si se activa la pestaña de menú, recargar el menú
            if (tabId === 'menu-tab') {
                loadCurrentMenu();
            }
        });
    });
}

// Variables globales para almacenar los menús y el índice actual
let allMenus = [];
let currentMenuIndex = 0;

// Variables para rastrear el tipo de menú seleccionado (comida o desayuno)
let currentMenuType = 'comida';
let currentConfirmationType = 'comida';

/**
 * Inicializa la navegación de menús
 */
function initMenuNavigation() {
    const prevMenuBtn = document.getElementById('prev-menu-btn');
    const nextMenuBtn = document.getElementById('next-menu-btn');
    const foodMenuBtn = document.getElementById('food-menu-btn');
    const breakfastMenuBtn = document.getElementById('breakfast-menu-btn');
    
    if (prevMenuBtn) {
        prevMenuBtn.onclick = function() {
            if (currentMenuIndex > 0) {
                currentMenuIndex--;
                updateMenuDisplay();
            }
        };
    }
    
    if (nextMenuBtn) {
        nextMenuBtn.onclick = function() {
            if (currentMenuIndex < allMenus.length - 1) {
                currentMenuIndex++;
                updateMenuDisplay();
            }
        };
    }
    
    // Manejar los botones de tipo de menú
    if (foodMenuBtn) {
        foodMenuBtn.onclick = function() {
            if (currentMenuType !== 'comida') {
                currentMenuType = 'comida';
                // Actualizar clases de los botones
                foodMenuBtn.classList.add('active');
                if (breakfastMenuBtn) breakfastMenuBtn.classList.remove('active');
                // Recargar menús con el nuevo tipo
                loadCurrentMenu();
            }
        };
    }
    
    if (breakfastMenuBtn) {
        breakfastMenuBtn.onclick = function() {
            if (currentMenuType !== 'desayuno') {
                currentMenuType = 'desayuno';
                // Actualizar clases de los botones
                breakfastMenuBtn.classList.add('active');
                if (foodMenuBtn) foodMenuBtn.classList.remove('active');
                // Recargar menús con el nuevo tipo
                loadCurrentMenu();
            }
        };
    }
}

/**
 * Actualiza la visualización del menú según el índice actual
 */
function updateMenuDisplay() {
    const currentMenuContainer = document.getElementById('current-menu');
    const selectedMenuDisplay = document.getElementById('selected-menu-display');
    const prevMenuBtn = document.getElementById('prev-menu-btn');
    const nextMenuBtn = document.getElementById('next-menu-btn');
    
    if (!currentMenuContainer) return;
    
    if (allMenus.length === 0) {
        currentMenuContainer.innerHTML = '<p class="empty-state">No hay menús disponibles.</p>';
        if (selectedMenuDisplay) selectedMenuDisplay.textContent = 'Sin menús';
        if (prevMenuBtn) prevMenuBtn.disabled = true;
        if (nextMenuBtn) nextMenuBtn.disabled = true;
        return;
    }
    
    // Actualizar estado de los botones
    if (prevMenuBtn) prevMenuBtn.disabled = currentMenuIndex === 0;
    if (nextMenuBtn) nextMenuBtn.disabled = currentMenuIndex === allMenus.length - 1;
    
    const menu = allMenus[currentMenuIndex];
    
    // Actualizar el texto del indicador
    if (selectedMenuDisplay) {
        const today = new Date();
        const startDate = new Date(menu.startDate + 'T00:00:00');
        const endDate = new Date(menu.endDate + 'T00:00:00');
        
        let menuStatus = '';
        if (today >= startDate && today <= endDate) {
            menuStatus = 'Menú actual';
        } else if (today < startDate) {
            menuStatus = 'Menú futuro';
        } else {
            menuStatus = 'Menú pasado';
        }
        
        selectedMenuDisplay.textContent = `${menuStatus} (${AppUtils.formatDate(startDate)} - ${AppUtils.formatDate(endDate)})`;
    }
    
    // Mostrar el menú
    displayMenuForCoordinator(menu, currentMenuContainer);
}

/**
 * Carga los menús disponibles (actuales y futuros) con sincronización en tiempo real
 */
function loadCurrentMenu() {
    const currentMenuContainer = document.getElementById('current-menu');
    if (!currentMenuContainer) return;

    currentMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menús...</p>';
    
    if (typeof FirebaseMenuModel !== 'undefined') {
        // Cancelar listener anterior si existe
        if (currentMenuContainer.dataset.unsubscribeFunction) {
            try {
                const unsubscribeFunc = new Function('return ' + currentMenuContainer.dataset.unsubscribeFunction)();
                if (typeof unsubscribeFunc === 'function') {
                    unsubscribeFunc();
                }
            } catch (e) {
                console.warn('Error al cancelar listener anterior:', e);
            }
        }

        try {
            // Obtener la fecha actual
            const today = new Date();
            const todayStr = AppUtils.formatDateForInput(today);
            
            // Escuchar a todos los menús que terminan hoy o en el futuro y son del tipo seleccionado
            const unsubscribe = firebase.firestore()
                .collection('menus')
                .where('endDate', '>=', todayStr)
                .where('type', '==', currentMenuType) // Filtrar por tipo de menú (comida o desayuno)
                .orderBy('endDate', 'asc')
                .onSnapshot(snapshot => {
                    if (snapshot.empty) {
                        allMenus = [];
                        currentMenuIndex = 0;
                        currentMenuContainer.innerHTML = '<p class="empty-state">No hay menús disponibles para la fecha actual o futuras.</p>';
                        return;
                    }
                    
                    // Obtener todos los menús y ordenarlos por fecha de inicio
                    allMenus = snapshot.docs
                        .map(doc => ({ ...doc.data(), id: doc.id }))
                        .sort((a, b) => new Date(a.startDate + 'T00:00:00Z') - new Date(b.startDate + 'T00:00:00Z'));
                    
                    // Encontrar el índice del menú actual (si existe)
                    const activeMenuIndex = allMenus.findIndex(menu => {
                        return menu.startDate <= todayStr && menu.endDate >= todayStr;
                    });
                    
                    // Si hay un menú activo, seleccionarlo; de lo contrario, seleccionar el primer menú futuro
                    if (activeMenuIndex !== -1) {
                        currentMenuIndex = activeMenuIndex;
                    } else {
                        // Si no hay menú activo, seleccionar el primer menú futuro (que debería ser el primero en la lista)
                        currentMenuIndex = 0;
                    }
                    
                    // Actualizar la visualización
                    updateMenuDisplay();
                    
                    // Mostrar indicador de sincronización
                    const syncIndicator = document.createElement('div');
                    syncIndicator.className = 'sync-indicator';
                    syncIndicator.innerHTML = '<span class="sync-icon"></span> Sincronizado';
                    const header = currentMenuContainer.querySelector('.menu-header');
                    if (header) header.appendChild(syncIndicator);
                    else currentMenuContainer.appendChild(syncIndicator);

                    setTimeout(() => {
                        syncIndicator.classList.add('fade-out');
                        setTimeout(() => syncIndicator.remove(), 500);
                    }, 3000);
                }, error => {
                    console.error('Error en la escucha de menús:', error);
                    currentMenuContainer.innerHTML = '<p class="error-state">Error al cargar los menús. Por favor, recarga la página.</p>';
                });
            
            // Guardar la función de cancelación
            currentMenuContainer.dataset.unsubscribeFunction = unsubscribe.toString();
            
            // Inicializar la navegación de menús
            initMenuNavigation();

        } catch (error) {
            console.error('Error al inicializar escucha de menús con Firebase:', error);
            currentMenuContainer.innerHTML = '<p class="error-state">Error al conectar con Firebase. Por favor, recarga la página.</p>';
        }
    } else {
        console.error('FirebaseMenuModel no está disponible.');
        currentMenuContainer.innerHTML = '<p class="error-state">Error: Componente de menú no disponible.</p>';
    }
}


/**
 * Muestra un menú en el contenedor especificado para el coordinador
 * @param {Object} menu - Objeto de menú
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 */
function displayMenuForCoordinator(menu, container) {
    if (!menu || typeof menu !== 'object') {
        container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
        return;
    }

    let html = `
        <div class="menu-header">
            <h4>${menu.name || 'Menú Semanal'}</h4>
            <p>Vigente del ${AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00'))} al ${AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00'))}</p>
        </div>
        <div class="menu-days">
    `;
    
    if (Array.isArray(menu.days) && menu.days.length > 0) {
        // Ordenar días
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };
        const sortedDays = [...menu.days].sort((a, b) => {
            const aKey = a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const bKey = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (dayOrder[aKey] || 99) - (dayOrder[bKey] || 99);
        });

        sortedDays.forEach(day => {
            const dayDate = day.date ? AppUtils.formatDate(new Date(day.date + 'T00:00:00')) : '';
            html += `
                <div class="menu-day card">
                    <h5>${day.name} <small>(${dayDate})</small></h5>
            `;
            
            if (day.dishes && day.dishes.length > 0) {
                // Agrupar por categoría
                const dishesByCategory = {};
                day.dishes.forEach(dish => {
                    if (!dishesByCategory[dish.category]) {
                        dishesByCategory[dish.category] = [];
                    }
                    dishesByCategory[dish.category].push(dish);
                });

                Object.keys(dishesByCategory).forEach(categoryKey => {
                    html += `<div class="menu-category-display">
                                <h6>${CATEGORIES[categoryKey] || categoryKey}</h6>
                                <ul class="dishes-list">`;
                    dishesByCategory[categoryKey].forEach(dish => {
                        html += `
                            <li class="dish-item">
                                <span class="dish-name">${dish.name}</span>
                                <!-- Podrías añadir precio/descripción si están en 'dish'
                                <span class="dish-price">$${dish.price ? dish.price.toFixed(2) : 'N/A'}</span>
                                <p class="dish-description">${dish.description || ''}</p> 
                                -->
                            </li>
                        `;
                    });
                    html += `</ul></div>`;
                });
            } else {
                html += '<p class="empty-state-small">No hay platillos para este día.</p>';
            }
            html += `</div>`; // Cierre de menu-day
        });
    } else {
        html += '<p class="empty-state">El menú no contiene días configurados.</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}
// Mapeo global de categorías para ser usado por displayMenuForCoordinator
const CATEGORIES = {
    'plato_fuerte': 'Platos Fuertes',
    'bebida': 'Bebidas',
    // ... puedes añadir más categorías aquí si las usas en admin.js
    'entrada': 'Entradas',
    'postre': 'Postres',
    'guarnicion': 'Guarniciones'
};


/**
 * Gestión de asistencia para coordinadores
 */
const AttendanceManager = {
    currentWeekStartDate: null,
    currentMenu: null,
    currentConfirmation: null, // Almacena la confirmación actual para la semana y coordinador
    
    init: function() {
        const prevWeekBtn = document.getElementById('prev-week-btn');
        const nextWeekBtn = document.getElementById('next-week-btn');
        const attendanceForm = document.getElementById('attendance-form');
        const resetBtn = document.getElementById('reset-attendance-btn');
        const foodConfirmBtn = document.getElementById('food-confirm-btn');
        const breakfastConfirmBtn = document.getElementById('breakfast-confirm-btn');

        if(prevWeekBtn) prevWeekBtn.addEventListener('click', () => this.changeWeek(-1));
        if(nextWeekBtn) nextWeekBtn.addEventListener('click', () => this.changeWeek(1));
        
        // Manejar los botones de tipo de menú para confirmaciones
        if (foodConfirmBtn) {
            foodConfirmBtn.addEventListener('click', () => {
                if (currentConfirmationType !== 'comida') {
                    currentConfirmationType = 'comida';
                    // Actualizar clases de los botones
                    foodConfirmBtn.classList.add('active');
                    if (breakfastConfirmBtn) breakfastConfirmBtn.classList.remove('active');
                    // Recargar menú y confirmaciones con el nuevo tipo
                    this.setCurrentWeek(this.currentWeekStartDate || new Date());
                }
            });
        }
        
        if (breakfastConfirmBtn) {
            breakfastConfirmBtn.addEventListener('click', () => {
                if (currentConfirmationType !== 'desayuno') {
                    currentConfirmationType = 'desayuno';
                    // Actualizar clases de los botones
                    breakfastConfirmBtn.classList.add('active');
                    if (foodConfirmBtn) foodConfirmBtn.classList.remove('active');
                    // Recargar menú y confirmaciones con el nuevo tipo
                    this.setCurrentWeek(this.currentWeekStartDate || new Date());
                }
            });
        }
        
        if(attendanceForm) {
            attendanceForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = document.getElementById('save-attendance-btn');
                const originalButtonHtml = submitButton.innerHTML;
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="spinner"></span> Guardando...';
                }
                try {
                    await this.saveAttendance();
                } catch (error) {
                    console.error('Error al guardar confirmación:', error);
                    AppUtils.showNotification('Error al guardar la confirmación.', 'error');
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonHtml; // Se actualizará en loadExistingConfirmation
                    }
                }
            });
        }
        if(resetBtn) resetBtn.addEventListener('click', () => this.resetForm());
        
        this.setCurrentWeek(this.getStartOfWeek(new Date()));
    },
    
    getStartOfWeek: function(date) {
        const d = new Date(date);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0,0,0,0); // Normalizar a medianoche
        return d;
    },
    
    setCurrentWeek: async function(startDate) {
        this.currentWeekStartDate = startDate;
        this.updateWeekDisplay();
        
        const menuContainer = document.getElementById('confirmation-menu-display');
        if(menuContainer) menuContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando...</p>';
        
        try {
            await this.loadMenuForWeek(); // Carga el menú y luego los inputs y confirmaciones
        } catch (error) {
            console.error('Error al establecer la semana actual:', error);
            if(menuContainer) menuContainer.innerHTML = '<p class="error-state">Error al cargar datos de la semana.</p>';
            this.generateAttendanceInputs(null); // Generar inputs vacíos o mensaje
        }
    },
    
    changeWeek: async function(offsetWeeks) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + (offsetWeeks * 7));
        await this.setCurrentWeek(newDate);
    },
    
    updateWeekDisplay: function() {
        const weekDisplay = document.getElementById('selected-week-display');
        if (!weekDisplay || !this.currentWeekStartDate) return;
        
        const endDate = new Date(this.currentWeekStartDate);
        endDate.setDate(endDate.getDate() + 6); // Lunes a Domingo
        
        const startStr = AppUtils.formatDate(this.currentWeekStartDate);
        const endStr = AppUtils.formatDate(endDate);
        weekDisplay.textContent = `Semana del ${startStr} al ${endStr}`;
    },
    
    loadMenuForWeek: async function() {
        const menuContainer = document.getElementById('confirmation-menu-display');
        if (!menuContainer) return;
        menuContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando menú...</p>';

        try {
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            const weekEnd = new Date(this.currentWeekStartDate);
            weekEnd.setDate(weekEnd.getDate() + 6); // Hasta Domingo
            const weekEndStr = AppUtils.formatDateForInput(weekEnd);

            // Consulta para menús cuya vigencia se solape con la semana seleccionada y sean del tipo seleccionado
            const snapshot = await firebase.firestore().collection('menus')
                .where('startDate', '<=', weekEndStr) // Menú debe empezar antes o el mismo día que termina la semana
                .where('type', '==', currentConfirmationType) // Filtrar por tipo de menú (comida o desayuno)
                .orderBy('startDate', 'desc') // Priorizar menús que empiezan más tarde
                .get();

            let foundMenu = null;
            for (const doc of snapshot.docs) {
                const menu = { ...doc.data(), id: doc.id };
                // El menú debe terminar después o el mismo día que empieza la semana
                if (menu.endDate >= weekStartStr) {
                    foundMenu = menu;
                    break; 
                }
            }
            
            this.currentMenu = foundMenu;

            if (this.currentMenu) {
                console.log('Menú encontrado:', this.currentMenu.name);
                // No mostramos el menú aquí, solo generamos inputs
                menuContainer.innerHTML = ''; // Limpiar "Cargando menú..."
            } else {
                menuContainer.innerHTML = '<p class="empty-state">No hay menú publicado para esta semana.</p>';
            }
            // Siempre generar inputs y cargar confirmaciones, incluso si no hay menú (para mostrar "N/A")
            this.generateAttendanceInputs(this.currentMenu); 
            await this.loadExistingConfirmation();

        } catch (error) {
            console.error('Error al cargar menú para la semana:', error);
            menuContainer.innerHTML = `<p class="error-state">Error al cargar el menú.</p>`;
            this.currentMenu = null;
            this.generateAttendanceInputs(null);
            await this.loadExistingConfirmation(); // Intentar cargar si hay confirmación previa
        }
    },
        
    generateAttendanceInputs: function(menu) {
        const inputsContainer = document.getElementById('attendance-inputs');
        if (!inputsContainer) return;
        inputsContainer.innerHTML = '';

        const daysToDisplay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        daysToDisplay.forEach((dayName, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'attendance-day card'; // Añadido card
            
            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            dayDiv.dataset.dayId = dayId;

            const currentDate = new Date(this.currentWeekStartDate);
            currentDate.setDate(currentDate.getDate() + index);

            const header = document.createElement('div');
            header.className = 'attendance-day-header';
            header.innerHTML = `<h5>${dayName} <small>(${AppUtils.formatDate(currentDate)})</small></h5>`;
            
            // Verificar si este día está en el menú actual
            const dayInMenu = menu && menu.days && menu.days.find(d => {
                // Normalizar el nombre del día para comparación
                const normalizedName = d.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const normalizedDayName = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return normalizedName === normalizedDayName;
            });
            
            // Añadir sección de menú del día
            const menuSection = document.createElement('div');
            menuSection.className = 'day-menu-preview';
            
            if (dayInMenu && dayInMenu.dishes && dayInMenu.dishes.length > 0) {
                // Agrupar por categoría
                const dishesByCategory = {};
                dayInMenu.dishes.forEach(dish => {
                    if (!dishesByCategory[dish.category]) {
                        dishesByCategory[dish.category] = [];
                    }
                    dishesByCategory[dish.category].push(dish);
                });
                
                // Crear HTML para cada categoría
                let menuHtml = '<div class="menu-preview">';
                
                Object.keys(dishesByCategory).forEach(categoryKey => {
                    menuHtml += `<div class="menu-category">
                                <h6>${CATEGORIES[categoryKey] || categoryKey}</h6>
                                <ul class="dishes-list-compact">`;
                    dishesByCategory[categoryKey].forEach(dish => {
                        menuHtml += `<li class="dish-item-compact">${dish.name}</li>`;
                    });
                    menuHtml += `</ul></div>`;
                });
                
                menuHtml += '</div>';
                menuSection.innerHTML = menuHtml;
            } else {
                menuSection.innerHTML = '<p class="empty-state-small">No hay menú disponible para este día.</p>';
            }
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.htmlFor = `attendance-${dayId}`;
            label.textContent = 'Asistentes:';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `attendance-${dayId}`;
            input.className = 'attendance-count form-control'; // form-control para mejor estilo
            input.min = '0';
            input.value = '0'; // Por defecto
            input.required = true;

            if (!dayInMenu) {
                input.disabled = true;
                input.value = '';
                input.placeholder = "No disponible";
            }
            
            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            
            dayDiv.appendChild(header);
            dayDiv.appendChild(menuSection); // Añadir la sección del menú
            dayDiv.appendChild(inputGroup);
            inputsContainer.appendChild(dayDiv);
        });
    },
    
    loadExistingConfirmation: async function() {
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId || !this.currentWeekStartDate) return;

        const saveButton = document.getElementById('save-attendance-btn');
        const lastUpdateInfo = document.getElementById('last-update-info');
        const lastUpdateTime = document.getElementById('last-update-time');

        // Guardar HTML original del botón antes de poner spinner
        const originalButtonHtml = saveButton ? saveButton.innerHTML : '';
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner"></span> Cargando confirmación...';
        }
        if(lastUpdateInfo) lastUpdateInfo.style.display = 'none';

        try {
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            // Buscar confirmación existente para este coordinador, semana y tipo de menú
            this.currentConfirmation = await FirebaseAttendanceModel.getByCoordinatorAndWeek(
                coordinatorId, 
                weekStartStr,
                currentConfirmationType // Pasar el tipo de menú (comida o desayuno)
            );
            
            const attendanceDays = document.querySelectorAll('.attendance-day');
            attendanceDays.forEach(dayDiv => {
                const dayId = dayDiv.dataset.dayId;
                const input = dayDiv.querySelector('input.attendance-count');
                if (input) {
                    input.value = (this.currentConfirmation && this.currentConfirmation.attendanceCounts && this.currentConfirmation.attendanceCounts[dayId] !== undefined)
                        ? this.currentConfirmation.attendanceCounts[dayId]
                        : (input.disabled ? '' : '0'); // Mantener vacío si está deshabilitado, sino 0
                }
            });

            if (this.currentConfirmation && lastUpdateInfo && lastUpdateTime) {
                const updateDate = this.currentConfirmation.updatedAt?.toDate ? this.currentConfirmation.updatedAt.toDate() : new Date(this.currentConfirmation.updatedAt);
                lastUpdateTime.textContent = updateDate.toLocaleString('es-ES');
                lastUpdateInfo.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error al cargar confirmación existente:', error);
            AppUtils.showNotification('Error al cargar datos de confirmación previos.', 'error');
        } finally {
            if (saveButton) {
                const iconHtml = '<i class="fas fa-save"></i> ';
                saveButton.innerHTML = iconHtml + (this.currentConfirmation ? 'Actualizar Asistencia' : 'Confirmar Asistencia');
                saveButton.disabled = false;
            }
        }
    },
    
    saveAttendance: async function() {
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId || !this.currentMenu) { // Solo guardar si hay un menú para la semana
            AppUtils.showNotification('No hay un menú activo para esta semana o no ha iniciado sesión.', 'warning');
            return false;
        }
        
        const attendanceCounts = {};
        const attendanceDays = document.querySelectorAll('.attendance-day');
        let hasValidInput = false;

        attendanceDays.forEach(dayDiv => {
            const dayId = dayDiv.dataset.dayId;
            const input = dayDiv.querySelector('input.attendance-count');
            if (input && !input.disabled) { // Solo considerar inputs habilitados
                const count = parseInt(input.value, 10);
                attendanceCounts[dayId] = isNaN(count) || count < 0 ? 0 : count;
                if(attendanceCounts[dayId] > 0) hasValidInput = true;
            }
        });

        // if (!hasValidInput && !this.currentConfirmation) { // Si es una nueva confirmación y todo es 0
        //     AppUtils.showNotification('Por favor, ingrese al menos una asistencia.', 'info');
        //     return false;
        // }

        const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
        const confirmationData = {
            coordinatorId,
            weekStartDate: weekStartStr,
            menuId: this.currentMenu.id, // Guardar ID del menú con la confirmación
            attendanceCounts,
            type: currentConfirmationType, // Incluir el tipo de menú (comida o desayuno)
            // createdAt y updatedAt serán manejados por FirebaseAttendanceModel
        };
        
        try {
            let success = false;
            if (this.currentConfirmation) {
                success = await FirebaseAttendanceModel.update(this.currentConfirmation.id, confirmationData);
            } else {
                // Generar un ID para la nueva confirmación si el modelo no lo hace
                // confirmationData.id = 'attend_' + Date.now(); 
                success = await FirebaseAttendanceModel.add(confirmationData);
            }
            
            if (success) {
                AppUtils.showNotification('Confirmación de asistencia guardada.', 'success');
                await this.loadExistingConfirmation(); // Recargar para actualizar UI (ej. hora de última actualización)
                return true;
            } else {
                AppUtils.showNotification('Error al guardar la confirmación.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error al guardar confirmación en Firebase:', error);
            AppUtils.showNotification('Error al guardar la confirmación: ' + error.message, 'error');
            return false;
        }
    },
    
    resetForm: function() {
        const attendanceDays = document.querySelectorAll('.attendance-day');
        attendanceDays.forEach(dayDiv => {
            const input = dayDiv.querySelector('input.attendance-count');
            if (input && !input.disabled) input.value = '0';
        });
        // Opcionalmente, recargar la confirmación existente para volver a los valores guardados
        // this.loadExistingConfirmation();
    }
};