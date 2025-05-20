/**
 * admin.js
 * Funcionalidades específicas para la vista de administración
 */

// Define tu código de acceso de administrador aquí. (CAMBIA ESTO)
const ADMIN_MASTER_ACCESS_CODE = "ADMIN728532"; // ¡CAMBIA ESTO POR ALGO SEGURO Y ÚNICO!

// Variables globales
let currentEditingMenuId = null;
// DAYS_OF_WEEK y CATEGORIES ahora se tomarán de AppUtils (asumiendo que utils.js se carga antes)

// Flag para evitar inicialización múltiple
let isAdminInitialized = false;

// Función para esperar a que los objetos globales estén disponibles
function waitForGlobals(globalNames, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function checkGlobals() {
            attempts++;
            const missingGlobals = globalNames.filter(name => typeof window[name] === 'undefined');
            
            if (missingGlobals.length === 0) {
                console.log('[Admin] Todos los objetos globales necesarios están disponibles');
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error(`[Admin] ERROR: Después de ${maxAttempts} intentos, siguen faltando objetos globales: ${missingGlobals.join(', ')}`);
                reject(new Error(`Faltan objetos globales: ${missingGlobals.join(', ')}`));
                return;
            }
            
            console.log(`[Admin] Intento ${attempts}/${maxAttempts}: Esperando objetos globales: ${missingGlobals.join(', ')}`);
            setTimeout(checkGlobals, 200);
        }
        
        checkGlobals();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin DOMContentLoaded");
    
    // Esperar a que los objetos globales estén disponibles
    const requiredGlobals = ['AppUtils', 'FirebaseMenuModel'];
    
    waitForGlobals(requiredGlobals)
        .then(() => {
            // Iniciar la sesión de administrador cuando todos los objetos estén disponibles
            checkAdminSession();
        })
        .catch(error => {
            console.error(`[Admin] ERROR: ${error.message}`);
            // Mostrar un mensaje de error más amigable al usuario
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h2>Error al cargar la aplicación</h2>
                <p>${error.message}</p>
                <p>Por favor, recargue la página o contacte al administrador del sistema.</p>
                <button onclick="location.reload()">Recargar página</button>
            `;
            document.body.innerHTML = '';
            document.body.appendChild(errorMessage);
        });
});

function checkAdminSession() {
    console.log("Ejecutando checkAdminSession...");
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const adminMainContent = document.getElementById('admin-main-content');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    if (!adminLoginModal || !adminMainContent) {
        console.error("Elementos críticos del DOM no encontrados (#admin-login-modal o #admin-main-content).");
        return;
    }

    if (adminLoggedIn === 'true') {
        adminLoginModal.style.display = 'none';
        adminMainContent.style.display = 'block';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block';
        if (!isAdminInitialized) {
            initializeAdminFeatures();
            isAdminInitialized = true;
        }
    } else {
        adminLoginModal.style.display = 'flex';
        adminMainContent.style.display = 'none';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
        setupAdminLoginForm();
    }
}

function setupAdminLoginForm() {
    const adminLoginModal = document.getElementById('admin-login-modal');
    if (!adminLoginModal) {
        console.error("Modal de login de admin no encontrado.");
        return;
    }

    const adminLoginForm = adminLoginModal.querySelector('#admin-login-form');
    const adminLoginError = adminLoginModal.querySelector('#admin-login-error');
    const closeModalBtn = adminLoginModal.querySelector('.close-modal-btn');

    // Clonar el modal para limpiar listeners antiguos y volver a añadir los nuevos
    const newAdminLoginModal = adminLoginModal.cloneNode(true);
    adminLoginModal.parentNode.replaceChild(newAdminLoginModal, adminLoginModal);

    // Re-obtener referencias del modal clonado
    const currentModal = document.getElementById('admin-login-modal');
    const currentForm = currentModal.querySelector('#admin-login-form');
    const currentError = currentModal.querySelector('#admin-login-error');
    const currentCloseBtn = currentModal.querySelector('.close-modal-btn');

    if (currentCloseBtn) {
        currentCloseBtn.addEventListener('click', () => { currentModal.style.display = 'none'; });
    }

    currentModal.addEventListener('click', function(event) {
        if (event.target === this) {
            this.style.display = 'none';
        }
    });

    if (currentForm) {
        currentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const accessCodeInput = currentModal.querySelector('#admin-access-code'); // Buscar dentro del modal actual
            if (!accessCodeInput) return;
            const enteredCode = accessCodeInput.value;

            if (enteredCode === ADMIN_MASTER_ACCESS_CODE) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                if (currentError) currentError.style.display = 'none';
                AppUtils.showNotification('Acceso de administrador concedido.', 'success');
                checkAdminSession();
            } else {
                if (currentError) {
                    currentError.textContent = "Código de acceso incorrecto. Inténtalo de nuevo.";
                    currentError.style.display = 'block';
                }
                accessCodeInput.value = '';
                AppUtils.showNotification('Código de acceso de administrador incorrecto.', 'error');
            }
        });
    }
}


function initializeAdminFeatures() {
    console.log('Inicializando funcionalidades de administración...');
    initAdminInterface();
    
    // Inicializar el formulario de menú con un retraso mayor para asegurar que el DOM esté completamente cargado
    setTimeout(() => {
        console.log('Intentando inicializar el formulario de menú...');
        initMenuForm(); // Incluye la delegación de eventos para el formulario de menú
    }, 500);

    // Inicializar módulos de gestión
    if (typeof CoordinatorManagement?.init === 'function' && !CoordinatorManagement.initialized) {
        CoordinatorManagement.init();
        CoordinatorManagement.initialized = true;
    }
    if (typeof ConfirmationReportManagement?.init === 'function' && !ConfirmationReportManagement.initialized) {
        ConfirmationReportManagement.init();
        ConfirmationReportManagement.initialized = true;
    }
    if (typeof DataBackupManagement?.init === 'function') {
        DataBackupManagement.init();
    }

    if (typeof loadSavedMenus === 'function') {
        loadSavedMenus().catch(error => console.error('Error loading saved menus:', error));
    }

    // Configurar botón de logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        const newLogoutBtn = adminLogoutBtn.cloneNode(true);
        adminLogoutBtn.parentNode.replaceChild(newLogoutBtn, adminLogoutBtn);
        newLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            isAdminInitialized = false;
            if (CoordinatorManagement) CoordinatorManagement.initialized = false;
            if (ConfirmationReportManagement) ConfirmationReportManagement.initialized = false;
            AppUtils.showNotification('Sesión de administrador cerrada.', 'info');
            checkAdminSession();
        });
    }
}

function initAdminInterface() {
    console.log('[initAdminInterface] Inicializando interfaz de administración...');
    const buttons = {
        menuManagementBtn: document.getElementById('menu-management-btn'),
        userManagementBtn: document.getElementById('user-management-btn'),
        reportsBtn: document.getElementById('reports-btn'),
        backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),
        backToDashboardFromUsersBtn: document.getElementById('back-to-dashboard-from-users-btn'),
        backToDashboardFromReportsBtn: document.getElementById('back-to-dashboard-from-reports-btn'),
    };
    
    // Verificar que los botones existan antes de continuar
    let missingButtons = [];
    Object.entries(buttons).forEach(([key, element]) => {
        if (!element) missingButtons.push(key);
    });
    
    if (missingButtons.length > 0) {
        console.warn(`[initAdminInterface] ADVERTENCIA: Algunos botones no fueron encontrados: ${missingButtons.join(', ')}`);
    }
    const sections = {
        menuManagementSection: document.getElementById('menu-management-section'),
        userManagementSection: document.getElementById('user-management-section'),
        reportsSection: document.getElementById('reports-section'),
        dashboardSection: document.querySelector('.dashboard'),
    };

    if (Object.values(buttons).some(btn => !btn) || Object.values(sections).some(sec => !sec)) {
        console.error("Faltan elementos para la navegación del panel de admin.");
        return;
    }

    function showSection(sectionToShow) {
        Object.values(sections).forEach(sec => sec.style.display = 'none');
        if (sectionToShow) sectionToShow.style.display = 'block';
    }

    const setupListener = (button, action) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', action);
    };

    setupListener(buttons.menuManagementBtn, () => showSection(sections.menuManagementSection));
    setupListener(buttons.userManagementBtn, () => showSection(sections.userManagementSection));
    setupListener(buttons.reportsBtn, () => showSection(sections.reportsSection));
    setupListener(buttons.backToDashboardBtn, () => showSection(sections.dashboardSection));
    setupListener(buttons.backToDashboardFromUsersBtn, () => showSection(sections.dashboardSection));
    setupListener(buttons.backToDashboardFromReportsBtn, () => showSection(sections.dashboardSection));

    showSection(sections.dashboardSection); // Mostrar dashboard por defecto
}

/**
 * Obtiene el lunes de la semana para una fecha dada.
 * La fecha de entrada puede ser un string "YYYY-MM-DD" o un objeto Date.
 * Devuelve un objeto Date representando el Lunes a medianoche en la zona horaria local del navegador.
 */
function getMondayOfGivenDate(dateInput) {
    let d;
    if (dateInput instanceof Date) {
        d = new Date(dateInput.getTime()); // Clonar para no modificar la original
    } else if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Si es YYYY-MM-DD, el constructor de Date lo interpreta como UTC 00:00.
        // Para tratarlo como local 00:00, necesitamos parsearlo manualmente.
        const parts = dateInput.split('-');
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (typeof dateInput === 'string') {
        d = new Date(dateInput); // Dejar que el constructor intente con otros formatos
    } else {
        console.error("getMondayOfGivenDate: Tipo de entrada inválido", dateInput);
        d = new Date(); // Fallback a hoy
    }

    if (isNaN(d.getTime())) {
        console.warn("getMondayOfGivenDate: Fecha inválida parseada", dateInput, ". Usando hoy como fallback.");
        d = new Date();
    }

    d.setHours(0, 0, 0, 0); // Normalizar a medianoche local
    const dayOfWeek = d.getDay(); // 0 (Domingo) a 6 (Sábado) en local
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Días para llegar al Lunes
    d.setDate(d.getDate() + diffToMonday);
    
    console.log(`[getMondayOfGivenDate] Entrada: ${dateInput instanceof Date ? dateInput.toISOString() : dateInput}, Lunes Calculado: ${d.toISOString()}`);
    return d;
}

function initMenuForm() {
    console.log('[initMenuForm] Inicializando formulario de menú...');
    
    // Paso 1: Verificar que el formulario exista
    const menuForm = document.getElementById('menu-form');
    if (!menuForm) {
        console.error("[initMenuForm] ERROR CRÍTICO: Formulario de menú (#menu-form) no encontrado.");
        AppUtils.showNotification("Error al inicializar el formulario de menú. Recargue la página.", "error");
        return;
    }
    
    console.log('[initMenuForm] Formulario encontrado, buscando elementos internos...');
    
    // Paso 2: Buscar elementos del formulario de manera más robusta
    // Primero intentamos con querySelector dentro del formulario, luego con getElementById como respaldo
    let weekStartDateInput = menuForm.querySelector('#week-start-date');
    if (!weekStartDateInput) {
        weekStartDateInput = document.getElementById('week-start-date');
        console.log('[initMenuForm] Usando método alternativo para encontrar #week-start-date');
    }
    
    let resetFormBtn = menuForm.querySelector('#reset-form-btn');
    if (!resetFormBtn) {
        resetFormBtn = document.getElementById('reset-form-btn');
        console.log('[initMenuForm] Usando método alternativo para encontrar #reset-form-btn');
    }
    
    let daysContainer = menuForm.querySelector('#days-container');
    if (!daysContainer) {
        daysContainer = document.getElementById('days-container');
        console.log('[initMenuForm] Usando método alternativo para encontrar #days-container');
    }
    
    let saveMenuBtn = menuForm.querySelector('#save-menu-btn');
    if (!saveMenuBtn) {
        saveMenuBtn = document.getElementById('save-menu-btn');
        console.log('[initMenuForm] Usando método alternativo para encontrar #save-menu-btn');
    }
    
    let menuTypeInput = menuForm.querySelector('#menu-type');
    if (!menuTypeInput) {
        menuTypeInput = document.getElementById('menu-type');
        console.log('[initMenuForm] Usando método alternativo para encontrar #menu-type');
    }
    
    // Verificar cada elemento individual y mostrar información detallada para depuración
    console.log('[initMenuForm] Verificando elementos del formulario:');
    console.log(`- weekStartDateInput: ${weekStartDateInput ? 'Encontrado' : 'NO ENCONTRADO'}`);
    console.log(`- resetFormBtn: ${resetFormBtn ? 'Encontrado' : 'NO ENCONTRADO'}`);
    console.log(`- daysContainer: ${daysContainer ? 'Encontrado' : 'NO ENCONTRADO'}`);
    console.log(`- saveMenuBtn: ${saveMenuBtn ? 'Encontrado' : 'NO ENCONTRADO'}`);
    console.log(`- menuTypeInput: ${menuTypeInput ? 'Encontrado' : 'NO ENCONTRADO'}`);
    
    // Crear una lista de elementos faltantes
    let missingElements = [];
    
    if (!weekStartDateInput) {
        missingElements.push('Input de fecha (#week-start-date)');
        // Intento alternativo de encontrar el elemento
        const altWeekStartDateInput = document.querySelector('#menu-form #week-start-date');
        console.log(`Intento alternativo de encontrar #week-start-date: ${altWeekStartDateInput ? 'Encontrado' : 'NO ENCONTRADO'}`);
    }
    
    if (!resetFormBtn) missingElements.push('Botón de reset (#reset-form-btn)');
    if (!daysContainer) missingElements.push('Contenedor de días (#days-container)');
    if (!saveMenuBtn) missingElements.push('Botón de guardar (#save-menu-btn)');
    if (!menuTypeInput) missingElements.push('Selector de tipo de menú (#menu-type)');
    
    if (missingElements.length > 0) {
        console.error(`[initMenuForm] ERROR: Elementos faltantes: ${missingElements.join(', ')}`);
        AppUtils.showNotification("Error al inicializar el formulario de menú. Faltan elementos en el DOM.", "error");
        
        // Mostrar el HTML del formulario para depuración
        console.log('[initMenuForm] HTML del formulario para depuración:');
        console.log(menuForm.outerHTML);
        return;
    }
    
    console.log('[initMenuForm] Todos los elementos del formulario encontrados correctamente.');

    // Remover listeners existentes del input de fecha para evitar duplicados
    // Clonar el input de fecha UNA VEZ para limpiar listeners si es necesario
    console.log('[initMenuForm] Clonando input de fecha para limpiar listeners existentes...');
    const newWeekStartDateInput = weekStartDateInput.cloneNode(true);
    weekStartDateInput.parentNode.replaceChild(newWeekStartDateInput, weekStartDateInput);
    weekStartDateInput = newWeekStartDateInput; // Actualizar la referencia al nuevo nodo en el DOM

    // Establecer la fecha inicial (lunes de la semana actual)
    const today = new Date();
    const mondayOfThisWeek = getMondayOfGivenDate(today);
    const formattedMonday = AppUtils.formatDateForInput(mondayOfThisWeek);
    console.log(`[initMenuForm] Estableciendo fecha inicial: ${formattedMonday}`);
    weekStartDateInput.value = formattedMonday;
    
    // Generar los días de la semana para la fecha inicial
    console.log('[initMenuForm] Generando días para la fecha inicial...');
    generateWeekDays(weekStartDateInput.value); // Llamada inicial con la fecha establecida

    // Función handler para detectar cambios en la fecha
    const dateChangeHandler = function(event) {
        console.log(`[dateChangeHandler] Evento: ${event.type}, Nuevo valor de fecha: ${this.value}`);
        if (this.value) { // Verificar que haya un valor válido
            generateWeekDays(this.value);
        } else {
            console.warn('[dateChangeHandler] ADVERTENCIA: Valor de fecha vacío, no se generan días.');
        }
    };

    // Añadir listeners al input de fecha (que ahora es el clonado)
    console.log('[initMenuForm] Añadiendo listeners al input de fecha...');
    weekStartDateInput.addEventListener('change', dateChangeHandler);
    weekStartDateInput.addEventListener('input', dateChangeHandler); // 'input' es más responsivo

    // Configurar el botón de reset
    console.log('[initMenuForm] Configurando botón de reset...');
    const newResetFormBtn = resetFormBtn.cloneNode(true);
    resetFormBtn.parentNode.replaceChild(newResetFormBtn, resetFormBtn);
    newResetFormBtn.addEventListener('click', function(event) {
        console.log('[resetFormBtn] Botón de reset clickeado');
        resetMenuForm();
    });

    // Configurar el formulario para el evento submit
    console.log('[initMenuForm] Configurando evento submit del formulario...');
    const newMenuForm = menuForm.cloneNode(true); // Clonar solo el formulario
    
    // Guardar una referencia al contenido original del daysContainer
    const daysContainerContent = daysContainer.innerHTML;
    
    // Reemplazar el formulario antiguo
    if (menuForm.parentNode) {
        menuForm.parentNode.replaceChild(newMenuForm, menuForm);
        console.log('[initMenuForm] Formulario reemplazado en el DOM');
    }
    
    // Re-obtener daysContainer del DOM actual (después de reemplazar el formulario)
    console.log('[initMenuForm] Configurando delegación de eventos para el contenedor de días...');
    const actualDaysContainer = document.getElementById('days-container');
    if (actualDaysContainer) {
        // Limpiar listeners existentes clonando el contenedor
        const newActualDaysContainer = actualDaysContainer.cloneNode(true);
        actualDaysContainer.parentNode.replaceChild(newActualDaysContainer, actualDaysContainer);
        
        // Añadir el listener de delegación para manejar clics en acordeones, tabs, etc.
        newActualDaysContainer.addEventListener('click', handleMenuFormClicks);
        console.log('[initMenuForm] Listener de delegación añadido al contenedor de días');
    } else {
        console.error("[initMenuForm] ERROR: #days-container no encontrado en el DOM después de reemplazar el formulario.");
    }

    // Configurar el evento submit en el nuevo formulario
    newMenuForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('[menuForm] Formulario enviado, guardando menú...');
        
        // Verificar que todos los campos requeridos estén completos
        const menuName = document.getElementById('menu-name');
        const weekStartDate = document.getElementById('week-start-date');
        const menuType = document.getElementById('menu-type');
        
        if (!menuName || !menuName.value.trim()) {
            console.error('[menuForm] ERROR: Nombre del menú no proporcionado');
            AppUtils.showNotification('Por favor, ingrese un nombre para el menú', 'error');
            return;
        }
        
        if (!weekStartDate || !weekStartDate.value) {
            console.error('[menuForm] ERROR: Fecha de inicio no proporcionada');
            AppUtils.showNotification('Por favor, seleccione una fecha de inicio', 'error');
            return;
        }
        
        if (!menuType || !menuType.value) {
            console.error('[menuForm] ERROR: Tipo de menú no seleccionado');
            AppUtils.showNotification('Por favor, seleccione un tipo de menú', 'error');
            return;
        }
        
        // Si todo está bien, guardar el menú
        saveMenu();
    });
    
    // Verificar que el input de fecha tenga los listeners correctos
    const currentWeekStartInput = document.getElementById('week-start-date');
    if (currentWeekStartInput !== weekStartDateInput) {
        console.warn('[initMenuForm] ADVERTENCIA: La referencia al input de fecha ha cambiado, actualizando listeners...');
        currentWeekStartInput.addEventListener('change', dateChangeHandler);
        currentWeekStartInput.addEventListener('input', dateChangeHandler);
    }
    
    console.log("[initMenuForm] Formulario de menú inicializado correctamente con todos los listeners configurados.");
}

function handleMenuFormClicks(event){
    const target = event.target;

    // Acordeones de día
    const accordionHeader = target.closest('.accordion-header');
    if (accordionHeader) {
        event.stopPropagation();
        const content = accordionHeader.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
            const isActive = accordionHeader.classList.toggle('active');
            content.style.display = isActive ? 'block' : 'none';
            const icon = accordionHeader.querySelector('.accordion-icon');
            if (icon) {
                icon.classList.toggle('fa-chevron-down', !isActive);
                icon.classList.toggle('fa-chevron-up', isActive);
            }
        }
        return;
    }

    // Pestañas de categoría
    const tabButton = target.closest('.tab-btn-category');
    if (tabButton) {
        event.stopPropagation();
        const daySection = tabButton.closest('.day-section.accordion-item');
        if (daySection) {
            const categoryKey = tabButton.getAttribute('data-category');
            daySection.querySelectorAll('.tab-btn-category').forEach(btn => btn.classList.remove('active'));
            daySection.querySelectorAll('.tab-content-category').forEach(tc => tc.classList.remove('active'));
            tabButton.classList.add('active');
            const selectedContent = daySection.querySelector(`.tab-content-category[data-category="${categoryKey}"]`);
            if (selectedContent) selectedContent.classList.add('active');
        }
        return;
    }

    // Botones de eliminar platillo
    const removeButton = target.closest('.remove-dish-btn');
    if (removeButton) {
        const dishGroup = removeButton.closest('.dish-input-group');
        if (dishGroup) dishGroup.remove();
        return;
    }

    // Botones de agregar platillo
    const addButton = target.closest('.add-dish-btn');
    if (addButton) {
        const daySection = addButton.closest('.day-section.accordion-item');
        const categoryKey = addButton.getAttribute('data-category');

        if (daySection && categoryKey) {
            const dayNameLabel = daySection.querySelector('.day-label').textContent;
            const dayNameNormalized = dayNameLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            // El dishesContainer está dentro del tab-content-category (que podría no estar activo)
            // pero el botón "add-dish-btn" está DENTRO del category-section-content que SÍ está visible
            // porque su tab-content-category padre está activo.
            const categorySectionContent = addButton.closest('.category-section-content');
            if (!categorySectionContent) {
                 console.error("No se encontró .category-section-content para el botón de agregar");
                 return;
            }
            const dishesContainer = categorySectionContent.querySelector(`.dishes-container[data-category="${categoryKey}"]`);

            if (dishesContainer) {
                const dishIndex = dishesContainer.children.length;
                const newDishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, dishIndex);
                dishesContainer.appendChild(newDishInputGroup);
            } else {
                console.error("Dishes container no encontrado para:", categoryKey, "en", daySection);
            }
        }
    }
}


function generateWeekDays(selectedDateStrFromInput) {
    try {
        console.log('[generateWeekDays] INICIO. Fecha seleccionada del input:', selectedDateStrFromInput);
        
        // Validar que la fecha de entrada sea válida
        if (!selectedDateStrFromInput) {
            console.error('[generateWeekDays] ERROR: Fecha de entrada vacía o inválida');
            AppUtils.showNotification("Fecha inválida. Usando fecha actual como fallback.", "warning");
            const today = new Date();
            const mondayOfThisWeek = getMondayOfGivenDate(today);
            selectedDateStrFromInput = AppUtils.formatDateForInput(mondayOfThisWeek);
            console.log('[generateWeekDays] Usando fecha actual como fallback:', selectedDateStrFromInput);
        }
        
        // Verificar que el contenedor de días exista antes de continuar
        let daysContainer = document.getElementById('days-container');
        if (!daysContainer) {
            console.error("[generateWeekDays] ERROR: Contenedor de días (#days-container) no encontrado. Creando uno temporal...");
            
            // Si el contenedor no existe, intentamos crearlo
            const menuForm = document.getElementById('menu-form');
            if (menuForm) {
                const tempDaysContainer = document.createElement('div');
                tempDaysContainer.id = 'days-container';
                menuForm.insertBefore(tempDaysContainer, menuForm.querySelector('.form-actions'));
                console.log('[generateWeekDays] Contenedor de días temporal creado.');
                
                // Actualizar la referencia al contenedor recién creado
                daysContainer = tempDaysContainer;
            } else {
                console.error("[generateWeekDays] ERROR: No se pudo crear el contenedor de días porque el formulario no existe.");
                return;
            }
        }
        
        // Verificar nuevamente que el contenedor exista
        if (!daysContainer) {
            console.error("[generateWeekDays] ERROR: Contenedor de días (#days-container) no encontrado aún después de intentar crearlo.");
            return;
        }

        console.log('[generateWeekDays] Limpiando secciones de días existentes...');
        // Limpiar las secciones de días existentes para recrearlas con las nuevas fechas
        const existingDaySections = daysContainer.querySelectorAll('.accordion-item');
        existingDaySections.forEach(ds => ds.remove());
        
        // Mantener los controles de acordeón si existen
        let accordionControls = daysContainer.querySelector('.accordion-controls');
        if (!accordionControls) {
            console.log('[generateWeekDays] Creando controles de acordeón...');
            accordionControls = document.createElement('div');
            accordionControls.className = 'accordion-controls';
            
            const expandAllBtn = document.createElement('button');
            expandAllBtn.type = 'button';
            expandAllBtn.className = 'secondary-btn';
            expandAllBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i> Expandir todos';
            expandAllBtn.addEventListener('click', () => toggleAllAccordions(true, daysContainer));
            
            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.type = 'button';
            collapseAllBtn.className = 'secondary-btn';
            collapseAllBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Colapsar todos';
            collapseAllBtn.addEventListener('click', () => toggleAllAccordions(false, daysContainer));
            
            accordionControls.appendChild(expandAllBtn);
            accordionControls.appendChild(collapseAllBtn);
            daysContainer.prepend(accordionControls);
        }

        // 1. Calcular el LUNES de la semana de la fecha seleccionada por el usuario
        console.log('[generateWeekDays] Calculando lunes de la semana seleccionada...');
        const actualMondayDate = getMondayOfGivenDate(selectedDateStrFromInput);
        console.log('[generateWeekDays] Lunes calculado:', actualMondayDate.toLocaleDateString('es-ES'), actualMondayDate);

        // 2. Actualizar el valor del input #week-start-date para que refleje este Lunes
        console.log('[generateWeekDays] Actualizando input de fecha para reflejar el lunes calculado...');
        const weekStartDateInput = document.getElementById('week-start-date');
        if (!weekStartDateInput) {
            console.error('[generateWeekDays] ERROR: Input de fecha (#week-start-date) no encontrado.');
        } else {
            const formattedMondayForInput = AppUtils.formatDateForInput(actualMondayDate);
            if (weekStartDateInput.value !== formattedMondayForInput) {
                console.log(`[generateWeekDays] Actualizando input: ${weekStartDateInput.value} → ${formattedMondayForInput}`);
                weekStartDateInput.value = formattedMondayForInput;
            }
        }

        // 3. Generar los 7 días de la semana a partir de 'actualMondayDate'
        console.log('[generateWeekDays] Generando fechas para los 7 días de la semana...');
        let firstDaySection = null;
        
        // Crear un array con las fechas de la semana para facilitar la depuración y procesamiento
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            // Crear una nueva fecha para cada día, clonando el lunes y sumando días
            const currentDate = new Date(actualMondayDate.getTime());
            currentDate.setDate(actualMondayDate.getDate() + i);
            
            // Guardar información completa de cada día
            weekDates.push({
                index: i,
                dayName: AppUtils.DAYS_OF_WEEK[i],
                date: currentDate,
                formattedDate: currentDate.toLocaleDateString('es-ES'),
                isoDate: currentDate.toISOString(),
                inputFormat: AppUtils.formatDateForInput(currentDate)
            });
        }
        
        console.log('[generateWeekDays] Fechas calculadas:', JSON.stringify(weekDates.map(d => ({ 
            day: d.dayName, 
            date: d.formattedDate, 
            inputFormat: d.inputFormat 
        }))));
        
        // Crear las secciones de días con las fechas calculadas
        console.log('[generateWeekDays] Creando secciones de días en el DOM...');
        weekDates.forEach(dayInfo => {
            console.log(`[generateWeekDays] Creando sección para: ${dayInfo.dayName} (${dayInfo.formattedDate})`);
            
            // Crear la sección del día con todos sus componentes
            const daySection = createDaySection(dayInfo.index, dayInfo.dayName, dayInfo.date);
            
            // Verificar que la sección se creó correctamente
            if (!daySection) {
                console.error(`[generateWeekDays] ERROR: No se pudo crear la sección para ${dayInfo.dayName}`);
                return;
            }
            
            // Añadir la sección al contenedor
            daysContainer.appendChild(daySection);
            
            // Guardar referencia al primer día (lunes) para expandirlo por defecto
            if (dayInfo.index === 0) {
                firstDaySection = daySection;
            }
        });

        // Expandir el primer día (lunes) por defecto si no estamos editando un menú existente
        if (firstDaySection && !currentEditingMenuId) {
            console.log('[generateWeekDays] Expandiendo la sección del lunes por defecto...');
            const accordionHeader = firstDaySection.querySelector('.accordion-header');
            const accordionContent = firstDaySection.querySelector('.accordion-content');
            
            if (accordionHeader && accordionContent && !accordionHeader.classList.contains('active')) {
                // Simular clic para expandir
                accordionHeader.click();
                console.log('[generateWeekDays] Sección del lunes expandida');
            }
        }
        
        // Notificar al usuario que los días se han actualizado correctamente
        const formattedNotificationDate = new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(actualMondayDate);
        
        AppUtils.showNotification(`Días actualizados para la semana del ${formattedNotificationDate}`, "success");
        console.log('[generateWeekDays] Generación de días completada exitosamente');
        
    } catch (error) {
        console.error('[generateWeekDays] ERROR CRÍTICO:', error);
        AppUtils.showNotification("Error al generar los días de la semana. Consulta la consola para más detalles.", "error");
    }
}

function toggleAllAccordions(expand, container) {
    const accordionItems = container.querySelectorAll('.accordion-item'); // Iterar sobre los items
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = header ? header.querySelector('.accordion-icon') : null;
        if (header && content) {
            if (expand) {
                header.classList.add('active');
                content.style.display = 'block';
                if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
            } else {
                header.classList.remove('active');
                content.style.display = 'none';
                if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
            }
        }
    });
}

function createDaySection(dayIndex, dayName, date) {
    try {
        console.log(`[createDaySection] Creando para: dayIndex=${dayIndex}, dayName=${dayName}, dateObj=${date.toISOString()}, data-date a establecer: ${AppUtils.formatDateForInput(date)}`);
        
        // Verificar que los parámetros sean válidos
        if (dayIndex === undefined || dayIndex === null || dayName === undefined || !date) {
            console.error(`[createDaySection] ERROR: Parámetros inválidos - dayIndex: ${dayIndex}, dayName: ${dayName}, date: ${date}`);
            return null;
        }
        
        // Crear la sección del día
        const daySection = document.createElement('div');
        daySection.className = 'day-section accordion-item card';
        daySection.setAttribute('data-day-index', dayIndex);
        daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));

        const accordionHeader = document.createElement('div');
        accordionHeader.className = 'accordion-header';
        
        const dayLabel = document.createElement('h4');
        dayLabel.className = 'day-label';
        dayLabel.textContent = dayName;
        
        // Mejorar la visualización de la fecha con formato más claro
        const dayDateDisplay = document.createElement('div');
        dayDateDisplay.className = 'day-date';
        
        // Formato más detallado para la fecha (día, mes y año)
        const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
        
        dayDateDisplay.textContent = formattedDate;
        dayDateDisplay.setAttribute('data-full-date', date.toISOString());
        
        const accordionIcon = document.createElement('i');
        accordionIcon.className = 'fas fa-chevron-down accordion-icon';
        accordionHeader.appendChild(dayLabel);
        accordionHeader.appendChild(dayDateDisplay);
        accordionHeader.appendChild(accordionIcon);

        const accordionContent = document.createElement('div');
        accordionContent.className = 'accordion-content';
        accordionContent.style.display = 'none';

        const tabsCategories = document.createElement('div');
        tabsCategories.className = 'tabs-categories';
        
        const tabContentCategoriesContainer = document.createElement('div');
        tabContentCategoriesContainer.className = 'tab-content-categories-container';

        Object.entries(AppUtils.CATEGORIES).forEach(([categoryKey, categoryName], index) => {
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = `tab-btn-category ${index === 0 ? 'active' : ''}`;
            tabBtn.setAttribute('data-category', categoryKey);
            tabBtn.textContent = categoryName;
            tabsCategories.appendChild(tabBtn);

            const tabContent = document.createElement('div');
            tabContent.className = `tab-content-category ${index === 0 ? 'active' : ''}`;
            tabContent.setAttribute('data-category', categoryKey);
            
            const categorySectionDiv = createCategorySectionDiv(dayIndex, dayName, categoryKey, categoryName);
            tabContent.appendChild(categorySectionDiv);
            
            tabContentCategoriesContainer.appendChild(tabContent);
        });

        accordionContent.appendChild(tabsCategories);
        accordionContent.appendChild(tabContentCategoriesContainer);
        
        daySection.appendChild(accordionHeader);
        daySection.appendChild(accordionContent);
        return daySection;
    } catch (error) {
        console.error(`[createDaySection] ERROR: ${error.message}`, error);
        return null;
    }
}

function createCategorySectionDiv(dayIndex, dayName, categoryKey, categoryName) {
    const categorySectionDiv = document.createElement('div');
    categorySectionDiv.className = 'category-section-content';

    const categoryTitle = document.createElement('h5');
    categoryTitle.textContent = categoryName; 
    // categorySectionDiv.appendChild(categoryTitle); // Comentado por ahora, la pestaña ya lo indica

    const dishesContainer = document.createElement('div');
    dishesContainer.className = 'dishes-container';
    dishesContainer.setAttribute('data-category', categoryKey);
    const firstDishInputGroup = createDishInputGroup(dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), categoryKey, 0);
    dishesContainer.appendChild(firstDishInputGroup);
    categorySectionDiv.appendChild(dishesContainer);

    const addDishBtn = document.createElement('button');
    addDishBtn.type = 'button';
    addDishBtn.className = 'add-dish-btn secondary-btn';
    addDishBtn.innerHTML = `<i class="fas fa-plus"></i> Agregar Opción`;
    addDishBtn.setAttribute('data-day-index', dayIndex);
    addDishBtn.setAttribute('data-category', categoryKey);
    categorySectionDiv.appendChild(addDishBtn);

    return categorySectionDiv;
}

function createDishInputGroup(dayNameNormalized, categoryKey, index) {
    const dishInputGroup = document.createElement('div');
    dishInputGroup.className = 'dish-input-group';
    
    const dishInput = document.createElement('input');
    dishInput.type = 'text';
    dishInput.className = 'dish-input form-control';
    dishInput.name = `dish-${dayNameNormalized}-${categoryKey}-${index}`;
    dishInput.placeholder = categoryKey === 'bebida' ? 'Nombre de la bebida' : 'Nombre del plato';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn danger-btn icon-btn';
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    removeBtn.title = 'Eliminar';
    
    dishInputGroup.appendChild(dishInput);
    dishInputGroup.appendChild(removeBtn);
    return dishInputGroup;
}


// --- Funciones de guardado, carga y edición de Menús ---
async function saveMenu() {
    const menuName = document.getElementById('menu-name').value;
    const weekStartDate = document.getElementById('menu-start-date').value; // Ya es Lunes
    const menuType = document.getElementById('menu-type').value; // Nuevo campo para tipo de menú

    if (!menuName || !weekStartDate || !menuType) {
        AppUtils.showNotification('Por favor, complete el nombre del menú, la fecha de inicio y el tipo de menú.', 'error');
        return;
    }

    const menuData = {
        name: menuName,
        startDate: weekStartDate,
        endDate: calculateEndDateForMenu(weekStartDate),
        type: menuType, // Agregar el tipo de menú (comida o desayuno)
        active: true,
        days: []
    };

    const daySections = document.querySelectorAll('#days-container .day-section.accordion-item');
    daySections.forEach(daySection => {
        const dayIndex = parseInt(daySection.getAttribute('data-day-index'));
        const dayDate = daySection.getAttribute('data-date');
        const dayName = AppUtils.DAYS_OF_WEEK[dayIndex];
        
        console.log(`[saveMenu] Procesando DaySection: dayIndex=${dayIndex}, data-date leído=${dayDate}, dayName calculado=${dayName}`);

        const dayDataObject = {
            id: dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            name: dayName,
            date: dayDate,
            dishes: []
        };
        
        console.log('[saveMenu] dayDataObject a pushear:', JSON.parse(JSON.stringify(dayDataObject)));

        Object.keys(AppUtils.CATEGORIES).forEach(categoryKey => {
            const tabContentForCategory = daySection.querySelector(`.tab-content-category[data-category="${categoryKey}"]`);
            if (tabContentForCategory) {
                const dishesContainer = tabContentForCategory.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                if (dishesContainer) {
                    dishesContainer.querySelectorAll('.dish-input-group .dish-input').forEach(dishInput => {
                        if (dishInput.value.trim()) {
                            dayDataObject.dishes.push({
                                id: `dish_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${categoryKey}_${dayIndex}`,
                                name: dishInput.value.trim(),
                                category: categoryKey,
                                description: '',
                                price: 0.00
                            });
                        }
                    });
                }
            }
        });
        // Guardar el día incluso si no tiene platillos (para que el coordinador sepa que está activo)
        menuData.days.push(dayDataObject);
    });
    
    console.log('[saveMenu] menuData.days final a guardar:', JSON.parse(JSON.stringify(menuData.days)));

    // Validar si hay al menos un platillo si es un menú nuevo
    const totalDishes = menuData.days.reduce((acc, day) => acc + day.dishes.length, 0);
    if (totalDishes === 0 && !currentEditingMenuId) {
        AppUtils.showNotification('Por favor, agregue al menos un platillo a algún día del menú.', 'error');
        return;
    }

    const saveButton = document.getElementById('save-menu-btn');
    const originalButtonHtml = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner"></span> Guardando...';

    try {
        let success;
        if (currentEditingMenuId) {
            menuData.id = currentEditingMenuId; // Añadir ID para la actualización
            success = await FirebaseMenuModel.update(currentEditingMenuId, menuData);
        } else {
            // Para un nuevo menú, FirebaseMenuModel.add se encarga de generar el ID
            const newMenuId = await FirebaseMenuModel.addAndGetId(menuData); // Asumimos que addAndGetId existe y devuelve el ID
            if (newMenuId) {
                 success = true;
                 // No necesitamos hacer nada más con newMenuId aquí a menos que
                 // la lógica de subida de imagen se reintroduzca y necesite este ID.
            } else {
                success = false;
            }
        }

        if (success) {
            AppUtils.showNotification(currentEditingMenuId ? 'Menú actualizado.' : 'Menú guardado.', 'success');
            loadSavedMenus();
            resetMenuForm();
        } else {
            AppUtils.showNotification('Error al guardar menú.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar menú:', error);
        AppUtils.showNotification('Error al procesar el menú.', 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHtml;
    }
}


function calculateEndDateForMenu(startDateStr) {
    const startDate = new Date(startDateStr + 'T00:00:00Z');
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    return AppUtils.formatDateForInput(endDate);
}

async function loadSavedMenus() {
    const savedMenusContainer = document.getElementById('saved-menus-container');
    if (!savedMenusContainer) return;
    savedMenusContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menús...</p>';
    try {
        const menus = await FirebaseMenuModel.getAll();
        savedMenusContainer.innerHTML = '';
        if (menus.length === 0) {
            savedMenusContainer.innerHTML = '<p class="empty-state">No hay menús guardados.</p>';
            return;
        }
        menus.sort((a, b) => new Date(b.startDate + 'T00:00:00Z') - new Date(a.startDate + 'T00:00:00Z'));
        menus.forEach(menu => savedMenusContainer.appendChild(createMenuItemElement(menu)));
    } catch (error) {
        console.error('Error al cargar menús guardados:', error);
        savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar menús.</p>';
    }
}

function createMenuItemElement(menu) {
    console.log('[createMenuItemElement] Mostrando menú guardado:', JSON.parse(JSON.stringify(menu)));
    
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item card';
    menuItem.setAttribute('data-id', menu.id);

    const menuHeader = document.createElement('div');
    menuHeader.className = 'menu-header';
    const menuInfo = document.createElement('div');
    menuInfo.className = 'menu-info';
    const menuTitle = document.createElement('h4');
    menuTitle.className = 'menu-title';
    menuTitle.textContent = menu.name;
    const menuDateRange = document.createElement('div');
    menuDateRange.className = 'menu-date';
    const startDateObj = menu.startDate ? new Date(menu.startDate + 'T00:00:00Z') : null;
    const endDateObj = menu.endDate ? new Date(menu.endDate + 'T00:00:00Z') : null;
    menuDateRange.textContent = `Vigente: ${startDateObj ? AppUtils.formatDate(startDateObj) : 'N/A'} - ${endDateObj ? AppUtils.formatDate(endDateObj) : 'N/A'}`;
    menuInfo.appendChild(menuTitle);
    menuInfo.appendChild(menuDateRange);

    const menuActions = document.createElement('div');
    menuActions.className = 'menu-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'secondary-btn icon-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editBtn.title = "Editar Menú";
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); editMenu(menu.id); });
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger-btn icon-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    deleteBtn.title = "Eliminar Menú";
    deleteBtn.addEventListener('click', async (e) => { e.stopPropagation(); await deleteMenu(menu.id); });
    menuActions.appendChild(editBtn);
    menuActions.appendChild(deleteBtn);

    const chevron = document.createElement('i');
    chevron.className = 'fas fa-chevron-down collapser-icon';
    menuHeader.appendChild(menuInfo);
    menuHeader.appendChild(menuActions);
    menuHeader.appendChild(chevron);

    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    if (menu.days && menu.days.some(day => day.dishes && day.dishes.length > 0)) {
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };
        const sortedDays = [...menu.days].sort((a,b) => (dayOrder[a.id] || 99) - (dayOrder[b.id] || 99));
        
        sortedDays.forEach(day => {
            console.log(`[createMenuItemElement] Mostrando día: Nombre=${day.name}, Fecha Almacenada=${day.date}`);
            
            if (!day.dishes || day.dishes.length === 0) return;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'menu-day-details';
            const dayTitleElement = document.createElement('h5');
            dayTitleElement.className = 'menu-day-title';
            
            const dateForDisplay = new Date(day.date + 'T00:00:00Z');
            console.log(`[createMenuItemElement] Objeto Date para display: ${dateForDisplay.toISOString()}, Formateado: ${AppUtils.formatDate(dateForDisplay)}`);
            
            const dayDate = AppUtils.formatDate(dateForDisplay);
            dayTitleElement.textContent = `${day.name} (${dayDate})`;
            dayDiv.appendChild(dayTitleElement);

            Object.entries(AppUtils.CATEGORIES).forEach(([categoryKey, categoryName]) => {
                const dishesInCategory = day.dishes.filter(d => d.category === categoryKey);
                if (dishesInCategory.length > 0) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'menu-category-details';
                    const categoryTitleElement = document.createElement('h6');
                    categoryTitleElement.className = 'menu-category-title';
                    categoryTitleElement.textContent = categoryName;
                    categoryDiv.appendChild(categoryTitleElement);
                    const ul = document.createElement('ul');
                    dishesInCategory.forEach(dish => {
                        const li = document.createElement('li');
                        li.className = 'menu-dish-item';
                        li.textContent = dish.name;
                        ul.appendChild(li);
                    });
                    categoryDiv.appendChild(ul);
                    dayDiv.appendChild(categoryDiv);
                }
            });
            menuContent.appendChild(dayDiv);
        });
    } else {
        menuContent.innerHTML = '<p class="empty-state-small">No hay platillos detallados para este menú.</p>';
    }

    menuHeader.addEventListener('click', function() {
        const isActive = menuContent.classList.toggle('active');
        chevron.classList.toggle('fa-chevron-down', !isActive);
        chevron.classList.toggle('fa-chevron-up', isActive);
    });

    menuItem.appendChild(menuHeader);
    menuItem.appendChild(menuContent);
    return menuItem;
}

async function editMenu(menuId) {
    const menu = await FirebaseMenuModel.get(menuId);
    if (!menu) {
        AppUtils.showNotification('Menú no encontrado.', 'error');
        return;
    }

    currentEditingMenuId = menuId;
    document.getElementById('menu-name').value = menu.name;
    document.getElementById('menu-start-date').value = menu.startDate; // Ya debería ser un Lunes
    
    // Establecer el tipo de menú (comida o desayuno)
    const menuTypeSelect = document.getElementById('menu-type');
    if (menuTypeSelect) {
        menuTypeSelect.value = menu.type || 'comida'; // Valor por defecto 'comida' si no existe
    }

    generateWeekDays(menu.startDate); // Esto regenera la estructura

    setTimeout(() => { // Delay para asegurar que el DOM esté listo
        if (menu.days && Array.isArray(menu.days)) {
            menu.days.forEach(dayData => {
                const dayIndex = AppUtils.DAYS_OF_WEEK.indexOf(dayData.name);
                if (dayIndex === -1) return;

                const daySection = document.querySelector(`#days-container .day-section[data-day-index="${dayIndex}"]`);
                if (!daySection) return;

                let firstCategoryWithDishesThisDay = null;

                // Limpiar contenedores de platillos para este día antes de llenarlos
                Object.keys(AppUtils.CATEGORIES).forEach(categoryKey => {
                    const tabContentForCategory = daySection.querySelector(`.tab-content-category[data-category="${categoryKey}"]`);
                    if (tabContentForCategory) {
                        const dishesContainer = tabContentForCategory.querySelector('.dishes-container');
                        if (dishesContainer) dishesContainer.innerHTML = ''; // Limpiar
                    }
                });
                
                // Llenar platillos
                if (dayData.dishes && dayData.dishes.length > 0) {
                    dayData.dishes.forEach(dish => {
                        const tabContentForCategory = daySection.querySelector(`.tab-content-category[data-category="${dish.category}"]`);
                        if (tabContentForCategory) {
                            const dishesContainer = tabContentForCategory.querySelector('.dishes-container');
                            if (dishesContainer) {
                                const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const newDishGroup = createDishInputGroup(dayNameNormalized, dish.category, dishesContainer.children.length);
                                newDishGroup.querySelector('.dish-input').value = dish.name;
                                dishesContainer.appendChild(newDishGroup);
                                if (!firstCategoryWithDishesThisDay) {
                                    firstCategoryWithDishesThisDay = dish.category;
                                }
                            }
                        }
                    });
                }

                // Añadir input vacío si una categoría quedó vacía después de llenarla
                Object.keys(AppUtils.CATEGORIES).forEach(categoryKey => {
                     const tabContentForCategory = daySection.querySelector(`.tab-content-category[data-category="${categoryKey}"]`);
                     if(tabContentForCategory){
                        const dishesContainer = tabContentForCategory.querySelector('.dishes-container');
                        if (dishesContainer && dishesContainer.children.length === 0) {
                            const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            dishesContainer.appendChild(createDishInputGroup(dayNameNormalized, categoryKey, 0));
                        }
                     }
                });

                // Expandir acordeón y activar la primera pestaña con contenido
                if (firstCategoryWithDishesThisDay) {
                    const accordionHeader = daySection.querySelector('.accordion-header');
                    if (accordionHeader && !accordionHeader.classList.contains('active')) {
                        accordionHeader.click(); // Simula clic para expandir
                    }
                    const tabButtonToActivate = daySection.querySelector(`.tab-btn-category[data-category="${firstCategoryWithDishesThisDay}"]`);
                    if (tabButtonToActivate && !tabButtonToActivate.classList.contains('active')) {
                         // Esperar a que el acordeón se expanda antes de clickear la pestaña
                        setTimeout(() => tabButtonToActivate.click(), 50); 
                    }
                }
            });
        }
        document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
        AppUtils.showNotification('Menú cargado para edición.', 'info');
    }, 150); // Aumentar un poco el delay general para el renderizado de todos los días
}

async function deleteMenu(menuId) {
    if (!confirm('¿Está seguro de que desea eliminar este menú?')) return false;
    try {
        const menuToDelete = await FirebaseMenuModel.get(menuId); // Obtener el menú para su imageUrl

        // Lógica para borrar la imagen de Firebase Storage si existe
        if (menuToDelete && menuToDelete.imageUrl) {
            try {
                const imageRef = firebase.storage().refFromURL(menuToDelete.imageUrl);
                await imageRef.delete();
                console.log("Imagen del menú eliminada de Storage:", menuToDelete.imageUrl);
            } catch (storageError) {
                console.error("Error al eliminar imagen del menú de Storage:", storageError);
                // No detener la eliminación del menú de Firestore si falla el borrado de la imagen,
                // pero sí notificar o loguear.
                AppUtils.showNotification('Error al eliminar imagen asociada. Contacte soporte.', 'warning');
            }
        }

        const success = await FirebaseMenuModel.delete(menuId);
        if (success) {
            AppUtils.showNotification('Menú eliminado.', 'success');
            loadSavedMenus();
            if (currentEditingMenuId === menuId) resetMenuForm();
            return true;
        } else {
            AppUtils.showNotification('Error al eliminar menú de Firestore.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error general al eliminar menú:', error);
        AppUtils.showNotification('Error al eliminar menú.', 'error');
        return false;
    }
}

function resetMenuForm() {
    currentEditingMenuId = null;
    originalMenuImageUrl = null; // Resetear imagen original rastreada
    const form = document.getElementById('menu-form');
    if (form) form.reset();

    // Resetear vista previa de imagen
    const menuImagePreview = document.getElementById('menu-image-preview');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const menuImageInput = document.getElementById('menu-image-input');
    if (menuImagePreview) menuImagePreview.src = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (menuImageInput) menuImageInput.value = '';
    
    const today = new Date();
    const mondayOfThisWeek = getMondayOfGivenDate(today);
    const dateInput = document.getElementById('week-start-date');
    if (dateInput) dateInput.value = AppUtils.formatDateForInput(mondayOfThisWeek);
    
    generateWeekDays(dateInput.value); // Regenerar con el primer día expandido
    AppUtils.showNotification('Formulario limpiado.', 'info');
}


const CoordinatorManagement = { /* Tu código existente, sin cambios directos por estos prompts */ 
    currentEditingCoordinatorId: null,
    initialized: false,
    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        // ... tu código ...
         const coordinatorForm = document.getElementById('coordinator-form');
        const resetFormBtn = document.getElementById('reset-coordinator-form-btn');
        
        if (!coordinatorForm || !resetFormBtn) {
            console.error("Elementos del formulario de coordinador no encontrados.");
            return;
        }

        const newForm = coordinatorForm.cloneNode(true);
        coordinatorForm.parentNode.replaceChild(newForm, coordinatorForm);
        newForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.saveCoordinator();
        });
        
        const newResetBtn = resetFormBtn.cloneNode(true);
        resetFormBtn.parentNode.replaceChild(newResetBtn, resetFormBtn);
        newResetBtn.addEventListener('click', () => this.resetCoordinatorForm());
        
        const copyBtn = document.getElementById('copy-access-code-btn');
        const regenBtn = document.getElementById('regenerate-access-code-btn');

        if(copyBtn) {
             const newCopyBtn = copyBtn.cloneNode(true);
             copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
             newCopyBtn.addEventListener('click', () => this.copyAccessCode());
        }
        if(regenBtn) {
             const newRegenBtn = regenBtn.cloneNode(true);
             regenBtn.parentNode.replaceChild(newRegenBtn, regenBtn);
             newRegenBtn.addEventListener('click', () => this.regenerateAccessCode());
        }
        
        this.loadCoordinators().catch(error => console.error('Error loading coordinators:', error));
    },
    generateAccessCode: function() {
        return Array(6).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    },
    saveCoordinator: async function() { /* ... Tu código ... */ 
        const nameInput = document.getElementById('coordinator-name');
        const emailInput = document.getElementById('coordinator-email');
        const phoneInput = document.getElementById('coordinator-phone');
        const departmentSelect = document.getElementById('coordinator-department');
        const accessCodeInput = document.getElementById('coordinator-access-code');

        if(!nameInput || !emailInput || !departmentSelect) {
            AppUtils.showNotification('Error interno: faltan campos del formulario.', 'error');
            return false;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const department = departmentSelect.value;
        
        if (!name || !email || !department) {
            AppUtils.showNotification('Complete los campos requeridos (*).', 'error');
            return false;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AppUtils.showNotification('Correo electrónico inválido.', 'error');
            return false;
        }
        
        let accessCode = accessCodeInput ? accessCodeInput.value : '';
        if (!this.currentEditingCoordinatorId || !accessCode) {
            accessCode = this.generateAccessCode();
        }

        const coordinatorData = { name, email, phone, department, accessCode, active: true };
        
        const saveButton = document.getElementById('save-coordinator-btn');
        const originalButtonHtml = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner"></span> Guardando...';

        try {
            let success = false;
            if (this.currentEditingCoordinatorId) {
                success = await FirebaseCoordinatorModel.update(this.currentEditingCoordinatorId, coordinatorData);
            } else {
                success = await FirebaseCoordinatorModel.add(coordinatorData);
            }
            
            if (success) {
                AppUtils.showNotification(this.currentEditingCoordinatorId ? 'Coordinador actualizado.' : 'Coordinador agregado.', 'success');
                this.loadCoordinators();
                this.resetCoordinatorForm();
            } else {
                AppUtils.showNotification('Error al guardar coordinador.', 'error');
            }
        } catch (error) {
            console.error('Error al guardar coordinador:', error);
            AppUtils.showNotification('Error al procesar el coordinador.', 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonHtml;
        }
        return true;
    },
    loadCoordinators: async function() { /* ... Tu código ... */ 
        const list = document.getElementById('coordinators-list');
        const msg = document.getElementById('no-coordinators-message');
        const table = document.getElementById('coordinators-table');

        if (!list || !msg || !table) return;
        list.innerHTML = '<tr><td colspan="5" class="loading-state"><span class="spinner"></span> Cargando...</td></tr>'; // Mejor feedback
        
        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            list.innerHTML = ''; 

            if (coordinators.length === 0) {
                msg.style.display = 'block';
                table.style.display = 'none';
                return;
            }
            
            msg.style.display = 'none';
            table.style.display = 'table';
            
            coordinators.sort((a, b) => a.name.localeCompare(b.name)).forEach(coord => {
                const row = list.insertRow();
                row.insertCell().textContent = coord.name;
                row.insertCell().textContent = coord.email;
                row.insertCell().textContent = coord.department;
                
                const codeCell = row.insertCell();
                const codeSpan = document.createElement('span');
                codeSpan.className = 'access-code-display-table';
                codeSpan.textContent = '******';
                codeSpan.title = 'Click para revelar/ocultar';
                let revealed = false;
                codeSpan.onclick = () => {
                    revealed = !revealed;
                    codeSpan.textContent = revealed ? coord.accessCode : '******';
                };
                codeCell.appendChild(codeSpan);

                const actionsCell = row.insertCell();
                const editBtn = document.createElement('button');
                editBtn.className = 'secondary-btn icon-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Editar';
                editBtn.onclick = () => this.editCoordinator(coord.id);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'danger-btn icon-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.title = 'Eliminar';
                deleteBtn.onclick = () => this.deleteCoordinator(coord.id);
                
                actionsCell.appendChild(editBtn);
                actionsCell.appendChild(deleteBtn);
            });
        } catch (error) {
            console.error('Error al cargar coordinadores:', error);
            list.innerHTML = '';
            msg.textContent = 'Error al cargar coordinadores.';
            msg.style.display = 'block';
            table.style.display = 'none';
        }
    },
    editCoordinator: async function(coordinatorId) { /* ... Tu código ... */ 
        const coordinator = await FirebaseCoordinatorModel.get(coordinatorId);
        if (!coordinator) {
            AppUtils.showNotification('Coordinador no encontrado.', 'error');
            return;
        }
        
        this.currentEditingCoordinatorId = coordinatorId;
        document.getElementById('coordinator-name').value = coordinator.name;
        document.getElementById('coordinator-email').value = coordinator.email;
        document.getElementById('coordinator-phone').value = coordinator.phone || '';
        document.getElementById('coordinator-department').value = coordinator.department;
        document.getElementById('coordinator-access-code').value = coordinator.accessCode;
        document.getElementById('access-code-container').style.display = 'block';
        document.getElementById('save-coordinator-btn').innerHTML = '<i class="fas fa-save"></i> Actualizar Coordinador';
        document.getElementById('coordinator-form').scrollIntoView({ behavior: 'smooth' });
    },
    deleteCoordinator: async function(coordinatorId) { /* ... Tu código ... */ 
         if (!confirm('¿Está seguro de que desea eliminar este coordinador?')) return;
        try {
            const success = await FirebaseCoordinatorModel.delete(coordinatorId);
            if (success) {
                AppUtils.showNotification('Coordinador eliminado.', 'success');
                this.loadCoordinators();
                if (this.currentEditingCoordinatorId === coordinatorId) this.resetCoordinatorForm();
            } else {
                AppUtils.showNotification('Error al eliminar coordinador.', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar coordinador:', error);
            AppUtils.showNotification('Error al eliminar coordinador.', 'error');
        }
    },
    copyAccessCode: function() { /* ... Tu código ... */ 
        const codeInput = document.getElementById('coordinator-access-code');
        if(codeInput && navigator.clipboard) { 
            navigator.clipboard.writeText(codeInput.value)
                .then(() => AppUtils.showNotification('Código copiado.', 'success'))
                .catch(err => {
                     AppUtils.showNotification('Error al copiar código.', 'error');
                });
        } else if (codeInput) { 
             try {
                codeInput.select();
                document.execCommand('copy');
                AppUtils.showNotification('Código copiado (fallback).', 'success');
             } catch(execErr) {
                AppUtils.showNotification('Error al copiar código.', 'error');
             }
        }
    },
    regenerateAccessCode: function() { /* ... Tu código ... */ 
        const newCode = this.generateAccessCode();
        document.getElementById('coordinator-access-code').value = newCode;
        AppUtils.showNotification('Nuevo código generado. Guarde los cambios.', 'info');
    },
    resetCoordinatorForm: function() { /* ... Tu código ... */ 
        this.currentEditingCoordinatorId = null;
        document.getElementById('coordinator-form').reset();
        document.getElementById('access-code-container').style.display = 'none';
        document.getElementById('save-coordinator-btn').innerHTML = '<i class="fas fa-save"></i> Agregar Coordinador';
    }
};
const ConfirmationReportManagement = { /* Tu código existente, asegurando uso de AppUtils.DAYS_OF_WEEK */ 
    currentWeekStartDate: null,
    // daysOfWeek: AppUtils.DAYS_OF_WEEK, // Referenciar desde AppUtils
    currentReportType: 'comida', // Tipo de menú para el reporte (comida o desayuno)
    initialized: false,
    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        
        this.weekSelector = document.getElementById('week-selector');
        this.prevWeekBtn = document.getElementById('prev-week-btn');
        this.nextWeekBtn = document.getElementById('next-week-btn');
        this.daysHeader = document.getElementById('days-header');
        this.confirmationsBody = document.getElementById('confirmations-body');
        this.totalsFooter = document.getElementById('totals-footer');
        this.foodReportBtn = document.getElementById('food-report-btn');
        this.breakfastReportBtn = document.getElementById('breakfast-report-btn');

        if (!this.weekSelector || !this.prevWeekBtn || !this.nextWeekBtn || !this.daysHeader || !this.confirmationsBody || !this.totalsFooter) {
            console.error("Elementos de la UI de reportes no encontrados.");
            return;
        }
        
        this.setCurrentWeek(this.getMonday(new Date())); 
        this.setupEventListeners();
        this.loadConfirmationData().catch(error => console.error('Error loading initial report data:', error));
    },
    setupEventListeners: function() { 
        const newWeekSel = this.weekSelector.cloneNode(true);
        this.weekSelector.parentNode.replaceChild(newWeekSel, this.weekSelector);
        this.weekSelector = newWeekSel;
        this.weekSelector.addEventListener('change', () => {
            this.setCurrentWeek(this.getMonday(new Date(this.weekSelector.value + 'T00:00:00Z')));
            this.loadConfirmationData();
        });

        const newPrevBtn = this.prevWeekBtn.cloneNode(true);
        this.prevWeekBtn.parentNode.replaceChild(newPrevBtn, this.prevWeekBtn);
        this.prevWeekBtn = newPrevBtn;
        this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-7));

        const newNextBtn = this.nextWeekBtn.cloneNode(true);
        this.nextWeekBtn.parentNode.replaceChild(newNextBtn, this.nextWeekBtn);
        this.nextWeekBtn = newNextBtn;
        this.nextWeekBtn.addEventListener('click', () => this.changeWeek(7));
        
        // Manejar los botones de tipo de menú para reportes
        if (this.foodReportBtn) {
            const newFoodBtn = this.foodReportBtn.cloneNode(true);
            this.foodReportBtn.parentNode.replaceChild(newFoodBtn, this.foodReportBtn);
            this.foodReportBtn = newFoodBtn;
            this.foodReportBtn.addEventListener('click', () => {
                if (this.currentReportType !== 'comida') {
                    this.currentReportType = 'comida';
                    // Actualizar clases de los botones
                    this.foodReportBtn.classList.add('active');
                    if (this.breakfastReportBtn) this.breakfastReportBtn.classList.remove('active');
                    // Recargar datos con el nuevo tipo
                    this.loadConfirmationData();
                }
            });
        }
        
        if (this.breakfastReportBtn) {
            const newBreakfastBtn = this.breakfastReportBtn.cloneNode(true);
            this.breakfastReportBtn.parentNode.replaceChild(newBreakfastBtn, this.breakfastReportBtn);
            this.breakfastReportBtn = newBreakfastBtn;
            this.breakfastReportBtn.addEventListener('click', () => {
                if (this.currentReportType !== 'desayuno') {
                    this.currentReportType = 'desayuno';
                    // Actualizar clases de los botones
                    this.breakfastReportBtn.classList.add('active');
                    if (this.foodReportBtn) this.foodReportBtn.classList.remove('active');
                    // Recargar datos con el nuevo tipo
                    this.loadConfirmationData();
                }
            });
        }
    },
    changeWeek: function(dayOffset) { 
        console.log(`[ConfirmationReportManagement.changeWeek] Offset: ${dayOffset}, Fecha actual: ${this.currentWeekStartDate.toISOString()}`);
        
        // Usar métodos locales para mantener consistencia
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + dayOffset); 
        
        console.log(`[ConfirmationReportManagement.changeWeek] Nueva fecha: ${newDate.toISOString()}`);
        
        // Obtener el lunes de la nueva semana y actualizar
        this.setCurrentWeek(this.getMonday(newDate));
        // No es necesario llamar a loadConfirmationData() aquí porque ya se llama en setCurrentWeek
    },
    setCurrentWeek: function(monday) { 
        console.log(`[ConfirmationReportManagement.setCurrentWeek] Lunes recibido: ${monday.toISOString()}`);
        
        // Mantener consistencia usando el formato local ya que getMondayOfGivenDate devuelve fechas locales
        this.currentWeekStartDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
        
        console.log(`[ConfirmationReportManagement.setCurrentWeek] currentWeekStartDate establecido: ${this.currentWeekStartDate.toISOString()}`);
        
        // Actualizar el valor del selector de semana
        const formattedDate = AppUtils.formatDateForInput(this.currentWeekStartDate);
        console.log(`[ConfirmationReportManagement.setCurrentWeek] Actualizando weekSelector a: ${formattedDate}`);
        this.weekSelector.value = formattedDate;
        
        // Actualizar los encabezados de días y cargar los datos
        this.updateDaysHeader();
        this.loadConfirmationData().catch(error => console.error('[ConfirmationReportManagement] Error al cargar datos:', error));
    },
    getMonday: function(dParam) { 
        // Reutilizar la función global ya corregida
        console.log(`[ConfirmationReportManagement.getMonday] Entrada: ${dParam instanceof Date ? dParam.toISOString() : dParam}`);
        const result = getMondayOfGivenDate(dParam);
        console.log(`[ConfirmationReportManagement.getMonday] Resultado: ${result.toISOString()}`);
        return result;
    },
    formatDateForDisplayInReport: function(date) { 
        // Usar métodos locales ya que getMondayOfGivenDate devuelve fechas locales
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`; 
    },
    updateDaysHeader: function() { 
        if (!this.daysHeader) return;
        console.log(`[ConfirmationReportManagement.updateDaysHeader] Actualizando encabezados para semana: ${this.currentWeekStartDate.toISOString()}`);
        
        const fixedHeaders = [this.daysHeader.firstElementChild.cloneNode(true), this.daysHeader.lastElementChild.cloneNode(true)]; // Clonar para evitar problemas al limpiar innerHTML
        this.daysHeader.innerHTML = ''; 
        this.daysHeader.appendChild(fixedHeaders[0]); 

        // Generar los encabezados para cada día de la semana
        for (let i = 0; i < 7; i++) {
            // Crear una nueva fecha para cada día, usando métodos locales
            const dayDate = new Date(this.currentWeekStartDate);
            dayDate.setDate(dayDate.getDate() + i);
            
            const formattedDate = this.formatDateForDisplayInReport(dayDate);
            console.log(`[ConfirmationReportManagement.updateDaysHeader] Día ${i}: ${AppUtils.DAYS_OF_WEEK[i]}, Fecha: ${formattedDate}, Objeto fecha: ${dayDate.toISOString()}`);
            
            const th = document.createElement('th');
            th.innerHTML = `${AppUtils.DAYS_OF_WEEK[i]}<br><small>${formattedDate}</small>`;
            th.setAttribute('data-date', AppUtils.formatDateForInput(dayDate));
            this.daysHeader.appendChild(th);
        }
        this.daysHeader.appendChild(fixedHeaders[1]);
    },
    loadConfirmationData: async function() { 
        if (!this.confirmationsBody) return;
        this.confirmationsBody.innerHTML = `<tr><td colspan="${AppUtils.DAYS_OF_WEEK.length + 2}" class="empty-state"><span class="spinner"></span> Cargando...</td></tr>`;

        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            if (coordinators.length === 0) {
                 this.confirmationsBody.innerHTML = `<tr><td colspan="${AppUtils.DAYS_OF_WEEK.length + 2}" class="empty-state">No hay coordinadores.</td></tr>`;
                 this.updateTotalsFooter(Array(7).fill(0),0); 
                 return;
            }

            const allConfirmations = await FirebaseAttendanceModel.getAll();
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            
            const departmentData = {};
            coordinators.forEach(coord => {
                 if (!departmentData[coord.department]) {
                    departmentData[coord.department] = {
                        name: coord.department,
                        days: Array(7).fill(0), total: 0, pendingDays: Array(7).fill(true) 
                    };
                }
            });

            console.log(`[ConfirmationReportManagement.loadConfirmationData] Buscando confirmaciones para la semana: ${weekStartStr}`);
            console.log(`[ConfirmationReportManagement.loadConfirmationData] Total de confirmaciones encontradas: ${allConfirmations.length}`);
            
            allConfirmations.forEach(conf => {
                let confWeekStartStr = conf.weekStartDate;
                
                // Normalizar el formato de la fecha de la confirmación
                if (conf.weekStartDate && typeof conf.weekStartDate.toDate === 'function') {
                    // Es un Timestamp de Firestore
                    confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate.toDate());
                } else if (conf.weekStartDate instanceof Date) {
                    // Es un objeto Date de JavaScript
                    confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate);
                } else if (typeof conf.weekStartDate === 'string' && conf.weekStartDate.includes('T')) {
                    // Es un ISO string completo (YYYY-MM-DDTHH:mm:ss.sssZ)
                    confWeekStartStr = conf.weekStartDate.split('T')[0];
                }
                
                // Añadir log para depuración de fechas
                // Verificar si la confirmación coincide con la semana y el tipo de menú seleccionado
                const confType = conf.type || 'comida'; // Si no tiene tipo, asumir 'comida' por compatibilidad
                console.log(`[ConfirmationReportManagement.loadConfirmationData] Comparando: Menú Semana = ${weekStartStr}, Confirmación Semana = ${confWeekStartStr}, Tipo = ${confType}, Coincide: ${confWeekStartStr === weekStartStr && confType === this.currentReportType}, CoordinatorId: ${conf.coordinatorId}`);

                if (confWeekStartStr === weekStartStr && confType === this.currentReportType) {
                    const coordinator = coordinators.find(c => c.id === conf.coordinatorId);
                    if (coordinator && departmentData[coordinator.department]) {
                        const dept = departmentData[coordinator.department];
                        AppUtils.DAYS_OF_WEEK.forEach((dayName, index) => {
                            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            if (conf.attendanceCounts && conf.attendanceCounts.hasOwnProperty(dayId)) { 
                                const count = parseInt(conf.attendanceCounts[dayId], 10);
                                const validCount = isNaN(count) ? 0 : count;
                                dept.days[index] += validCount;
                                dept.total += validCount;
                                dept.pendingDays[index] = false; 
                            }
                        });
                    }
                }
            });
            this.updateConfirmationsTable(departmentData);
        } catch (error) {
            console.error('Error al cargar datos de confirmación:', error);
            this.confirmationsBody.innerHTML = `<tr><td colspan="${AppUtils.DAYS_OF_WEEK.length + 2}" class="error-state">Error al cargar reportes.</td></tr>`;
        }
    },
    updateConfirmationsTable: function(departmentData) { 
        this.confirmationsBody.innerHTML = '';
        const dayTotals = Array(7).fill(0);
        let grandTotal = 0;
        
        const sortedDepartments = Object.keys(departmentData).sort();

        if (sortedDepartments.length === 0 && Object.keys(departmentData).length > 0) { 
             this.confirmationsBody.innerHTML = `<tr><td colspan="${AppUtils.DAYS_OF_WEEK.length + 2}" class="empty-state">No hay datos de confirmación para esta semana.</td></tr>`;
             this.updateTotalsFooter(dayTotals, grandTotal);
             return;
        } else if (Object.keys(departmentData).length === 0){
             this.updateTotalsFooter(dayTotals, grandTotal);
             return;
        }

        sortedDepartments.forEach(deptName => {
            const data = departmentData[deptName];
            const row = this.confirmationsBody.insertRow();
            row.insertCell().textContent = data.name;
            
            for (let i = 0; i < 7; i++) {
                const cell = row.insertCell();
                cell.textContent = data.pendingDays[i] ? '—' : data.days[i]; 
                cell.className = data.pendingDays[i] ? 'pending' : (data.days[i] > 0 ? 'confirmed' : 'zero-confirmed');
                if (!data.pendingDays[i]) { 
                     dayTotals[i] += data.days[i];
                }
            }
            
            const totalCell = row.insertCell();
            totalCell.textContent = data.total;
            totalCell.className = 'report-total-dept';
            grandTotal += data.total;
        });
        this.updateTotalsFooter(dayTotals, grandTotal);
    },
    updateTotalsFooter: function(dayTotals, grandTotal) { 
        if (!this.totalsFooter) return;
        this.totalsFooter.innerHTML = ''; 
        const firstCell = this.totalsFooter.insertCell();
        firstCell.textContent = 'Total por Día';
        
        dayTotals.forEach(total => {
            const cell = this.totalsFooter.insertCell();
            cell.textContent = total;
        });
        
        const grandTotalCell = this.totalsFooter.insertCell();
        grandTotalCell.textContent = grandTotal;
        grandTotalCell.className = 'report-grand-total';
    }
};
const DataBackupManagement = { /* Tu código existente */ 
    exportBtn: null, importBtn: null, fileInput: null, selectedFileName: null,
    importActions: null, confirmImportBtn: null, cancelImportBtn: null, selectedFile: null,
    init: function() {
        this.exportBtn = document.getElementById('export-data-btn');
        this.importBtn = document.getElementById('import-data-btn');
        this.fileInput = document.getElementById('import-file-input');
        this.selectedFileName = document.getElementById('selected-file-name');
        this.importActions = document.querySelector('.import-actions'); // Asegurar que se seleccione este elemento
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.cancelImportBtn = document.getElementById('cancel-import-btn');

        if(this.exportBtn) {
             this.exportBtn.disabled = true;
             this.exportBtn.onclick = () => AppUtils.showNotification('Exportación no aplicable con Firebase.', 'warning');
        }
        if(this.importBtn) {
            this.importBtn.disabled = true;
             this.importBtn.onclick = () => AppUtils.showNotification('Importación no aplicable con Firebase.', 'warning');
        }
    },
    exportData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); },
    handleFileSelection: function(file) { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI(); },
    importData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI();},
    cancelImport: function() { this.resetImportUI(); },
    resetImportUI: function() {
        this.selectedFile = null;
        if(this.fileInput) this.fileInput.value = '';
        if(this.selectedFileName) this.selectedFileName.textContent = '';
        if(this.importActions) this.importActions.style.display = 'none'; // this.importActions debería estar bien si se asignó en init
    }
};