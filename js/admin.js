/**
 * admin.js
 * Funcionalidades específicas para la vista de administración
 */

// Define tu código de acceso de administrador aquí. (CAMBIA ESTO)
const ADMIN_MASTER_ACCESS_CODE = "ADMIN728532"; // ¡CAMBIA ESTO POR ALGO SEGURO Y ÚNICO!

// Variables globales
let currentEditingMenuId = null;
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIES = {
    'plato_fuerte': 'Plato Fuerte',
    'bebida': 'Bebida'
};

// Flag para evitar inicialización múltiple
let isAdminInitialized = false; 

document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin DOMContentLoaded");
    checkAdminSession(); // Verificar sesión al cargar la página
});

function checkAdminSession() {
    console.log("Ejecutando checkAdminSession..."); // Log para confirmar ejecución
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const adminMainContent = document.getElementById('admin-main-content');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Verificar si los elementos existen ANTES de usarlos
    if (!adminLoginModal) {
        console.error("¡Elemento #admin-login-modal no encontrado en admin.html!");
        return; // Detener si falta el modal
    }
    if (!adminMainContent) {
        console.error("¡Elemento #admin-main-content no encontrado en admin.html!");
        return; // Detener si falta el contenido principal
    }

    if (adminLoggedIn === 'true') {
        console.log("Admin logueado. Mostrando contenido principal.");
        adminLoginModal.style.display = 'none';
        adminMainContent.style.display = 'block'; // Mostrar contenido
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block'; // Mostrar botón logout
        
        // Inicializar solo si no se ha hecho antes
        if (!isAdminInitialized) {
            initializeAdminFeatures();
            isAdminInitialized = true;
        }
    } else {
        console.log("Admin NO logueado. Mostrando modal.");
        adminLoginModal.style.display = 'flex'; // Mostrar modal
        adminMainContent.style.display = 'none'; // Asegurarse que el contenido está oculto
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none'; // Ocultar botón logout
        
        // Configurar el listener del formulario de login (solo si no está logueado)
        setupAdminLoginForm(); 
    }
}

function setupAdminLoginForm() {
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLoginError = document.getElementById('admin-login-error');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const closeModalBtn = adminLoginModal ? adminLoginModal.querySelector('.close-modal-btn') : null;
    
    // Configurar el botón de cierre del modal
    if (closeModalBtn) {
        // Remover listener anterior para evitar duplicados
        const newCloseBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
        
        // Añadir nuevo listener
        newCloseBtn.addEventListener('click', function() {
            adminLoginModal.style.display = 'none';
        });
        console.log("Listener para botón de cierre de modal configurado.");
    }
    
    // Añadir listener para cerrar el modal al hacer clic fuera de él
    if (adminLoginModal) {
        adminLoginModal.addEventListener('click', function(event) {
            // Si el clic fue directamente en el fondo del modal (no en su contenido)
            if (event.target === adminLoginModal) {
                adminLoginModal.style.display = 'none';
            }
        });
        console.log("Listener para cerrar modal al hacer clic fuera configurado.");
    }
    
    // NO obtener el input aquí fuera

    console.log("Configurando formulario de login admin. Código esperado:", ADMIN_MASTER_ACCESS_CODE);

    if (adminLoginForm) { // Solo necesitamos el formulario aquí
        // Remover listener anterior para evitar duplicados si esta función se llama más de una vez
        // En lugar de clonar, simplemente removemos el listener si ya existe (aunque con la lógica actual no debería)
        // O más simple: asegurarnos que solo se añade una vez via checkAdminSession
        
        // Limpiar listener anterior por si acaso (opcional pero seguro)
        const newForm = adminLoginForm.cloneNode(true);
        adminLoginForm.parentNode.replaceChild(newForm, adminLoginForm);


        newForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log("Admin login form submitted."); 

            // **** OBTENER EL INPUT Y SU VALOR AQUÍ DENTRO ****
            const currentInput = document.getElementById('admin-access-code'); 
            if (!currentInput) {
                console.error("Input #admin-access-code no encontrado DENTRO del listener!");
                return; // Salir si no se encuentra el input
            }
            const enteredCode = currentInput.value; 
            // *************************************************

            // Logs detallados
            console.log("Código ingresado:", `"${enteredCode}"`);
            console.log("Código esperado:", `"${ADMIN_MASTER_ACCESS_CODE}"`);
            console.log("Longitud código ingresado:", enteredCode.length);
            console.log("Longitud código esperado:", ADMIN_MASTER_ACCESS_CODE.length);
            console.log("¿Son iguales?", enteredCode === ADMIN_MASTER_ACCESS_CODE);
            
            // Comparación 
            if (enteredCode === ADMIN_MASTER_ACCESS_CODE) {
                console.log("Comparación: ¡Éxito!");
                sessionStorage.setItem('adminLoggedIn', 'true');
                if (adminLoginError) adminLoginError.style.display = 'none';
                AppUtils.showNotification('Acceso de administrador concedido.', 'success');
                checkAdminSession(); // Actualizar UI
            } else {
                console.log("Comparación: ¡Fallo!");
                if (adminLoginError) {
                    adminLoginError.textContent = "Código de acceso incorrecto. Inténtalo de nuevo.";
                    adminLoginError.style.display = 'block';
                }
                currentInput.value = ''; // Limpiar el input actual
                AppUtils.showNotification('Código de acceso de administrador incorrecto.', 'error');
            }
        });
        console.log("Listener para admin-login-form configurado.");
    } else {
        console.error("Formulario #admin-login-form no encontrado.");
    }
}

function initializeAdminFeatures() {
    console.log('Inicializando funcionalidades de administración...');
    
    initAdminInterface();
    initMenuForm();
    
    if (typeof CoordinatorManagement !== 'undefined' && typeof CoordinatorManagement.init === 'function') {
        // Asegurarse que init no se llame múltiples veces si hay recargas parciales
        if (!CoordinatorManagement.initialized) {
             CoordinatorManagement.init();
             CoordinatorManagement.initialized = true; // Añadir flag
        }
    } else {
        console.warn("CoordinatorManagement no disponible.");
    }
    
    if (typeof ConfirmationReportManagement !== 'undefined' && typeof ConfirmationReportManagement.init === 'function') {
         if (!ConfirmationReportManagement.initialized) {
            ConfirmationReportManagement.init();
            ConfirmationReportManagement.initialized = true; // Añadir flag
         }
    } else {
        console.warn("ConfirmationReportManagement no disponible.");
    }
    
    if (typeof DataBackupManagement !== 'undefined' && typeof DataBackupManagement.init === 'function') {
        DataBackupManagement.init(); // Este puede no necesitar flag si solo añade listeners
    } else {
        console.warn("DataBackupManagement no disponible.");
    }
    
    if (typeof loadSavedMenus === 'function') {
         loadSavedMenus().catch(error => console.error('Error loading menus:', error));
    } else {
        console.warn("loadSavedMenus no está definido.");
    }

    // Configurar botón de logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        const newLogoutBtn = adminLogoutBtn.cloneNode(true);
        adminLogoutBtn.parentNode.replaceChild(newLogoutBtn, adminLogoutBtn);

        newLogoutBtn.addEventListener('click', function() {
            console.log("Admin logout button clicked.");
            sessionStorage.removeItem('adminLoggedIn');
            isAdminInitialized = false; // Resetear flag de inicialización
             // Reiniciar flags de inicialización de módulos si los añadiste
            if(CoordinatorManagement) CoordinatorManagement.initialized = false;
            if(ConfirmationReportManagement) ConfirmationReportManagement.initialized = false;
            AppUtils.showNotification('Sesión de administrador cerrada.', 'info');
            checkAdminSession(); // Llamar a checkAdminSession para mostrar modal y ocultar contenido
        });
        console.log("Listener para admin-logout-btn configurado.");
    } else {
         console.warn("Botón de logout de admin no encontrado.");
    }
}

// =============================================
// == RESTO DE FUNCIONES DE ADMIN.JS ==========
// == (initAdminInterface, initMenuForm,      ==
// == generateWeekDays, createDaySection, etc.)==
// == Deben estar aquí abajo.                 ==
// =============================================

// Incluyo las funciones principales de nuevo para asegurar que están presentes.
// Si las tienes definidas más abajo, no necesitas duplicarlas.

/**
 * Inicializa la interfaz de administración (navegación entre secciones)
 */
function initAdminInterface() {
    console.log("Ejecutando initAdminInterface..."); // Log
    const menuManagementBtn = document.getElementById('menu-management-btn');
    const userManagementBtn = document.getElementById('user-management-btn');
    const reportsBtn = document.getElementById('reports-btn');
    
    const menuManagementSection = document.getElementById('menu-management-section');
    const userManagementSection = document.getElementById('user-management-section');
    const reportsSection = document.getElementById('reports-section');
    
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const backToDashboardFromUsersBtn = document.getElementById('back-to-dashboard-from-users-btn');
    const backToDashboardFromReportsBtn = document.getElementById('back-to-dashboard-from-reports-btn');
    
    const dashboardSection = document.querySelector('.dashboard');

    // Verificar que todos los elementos necesarios existen
    if (!menuManagementBtn || !userManagementBtn || !reportsBtn || !menuManagementSection || !userManagementSection || !reportsSection || !dashboardSection) {
        console.error("Faltan elementos para la navegación del panel de admin.");
        return;
    }


    function showSection(sectionToShow) {
        console.log("Mostrando sección:", sectionToShow ? sectionToShow.id : 'ninguna'); // Log
        // Ocultar todas las secciones específicas primero
         if(menuManagementSection) menuManagementSection.style.display = 'none';
         if(userManagementSection) userManagementSection.style.display = 'none';
         if(reportsSection) reportsSection.style.display = 'none';
         if(dashboardSection) dashboardSection.style.display = 'none'; // Ocultar dashboard también

         // Mostrar la sección deseada
        if(sectionToShow) {
             sectionToShow.style.display = 'block';
        } else {
             console.warn("Se intentó mostrar una sección nula.");
        }
    }
    
    function showDashboardView() { 
        showSection(dashboardSection); // Mostrar solo el dashboard
    }
    
    // Re-asignar listeners para evitar duplicados si se llama múltiples veces
    const setupListener = (button, action) => {
        if (!button) return;
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', action);
    };

    setupListener(menuManagementBtn, () => showSection(menuManagementSection));
    setupListener(userManagementBtn, () => showSection(userManagementSection));
    setupListener(reportsBtn, () => showSection(reportsSection));
    
    setupListener(backToDashboardBtn, showDashboardView);
    setupListener(backToDashboardFromUsersBtn, showDashboardView);
    setupListener(backToDashboardFromReportsBtn, showDashboardView);
    
    showDashboardView(); // Mostrar dashboard por defecto al inicializar
}


/**
 * Inicializa el formulario de menú
 */
function initMenuForm() {
     console.log("Ejecutando initMenuForm..."); // Log
    const weekStartDateInput = document.getElementById('week-start-date');
    const menuForm = document.getElementById('menu-form');
    const resetFormBtn = document.getElementById('reset-form-btn');

    if (!weekStartDateInput || !menuForm || !resetFormBtn) {
        console.error("Elementos del formulario de menú no encontrados.");
        return;
    }
    
    const today = new Date();
    const formattedDate = AppUtils.formatDateForInput(today);
    weekStartDateInput.value = formattedDate;
    
    generateWeekDays(weekStartDateInput.value);
    
    // Listener para cambio de fecha
    const newWeekInput = weekStartDateInput.cloneNode(true);
    weekStartDateInput.parentNode.replaceChild(newWeekInput, weekStartDateInput);
    newWeekInput.addEventListener('change', function() {
        generateWeekDays(this.value);
    });
    
    // Listener para reset
    const newResetBtn = resetFormBtn.cloneNode(true);
    resetFormBtn.parentNode.replaceChild(newResetBtn, resetFormBtn);
    newResetBtn.addEventListener('click', resetMenuForm);
    
    // Listener para submit
    const newMenuForm = menuForm.cloneNode(true); // Clonar form podría perder referencias internas? Mejor solo el listener
    // Remover listener anterior si existe para evitar duplicados
    // (Asumiendo que no hay otros listeners importantes en el form)
    menuForm.replaceWith(menuForm.cloneNode(true)); // Reemplazar con clon para limpiar listeners
    document.getElementById('menu-form').addEventListener('submit', function(event) { // Añadir listener al nuevo form
        event.preventDefault();
        saveMenu();
    });

    // Llamar a setupAddDishButtons después de generar los días iniciales
    setupAddDishButtons(); 
}

function generateWeekDays(startDateStr) {
    try {
        const daysContainer = document.getElementById('days-container');
        if (!daysContainer) {
            console.error("Contenedor de días no encontrado.");
            return;
        }
        
        daysContainer.innerHTML = ''; // Limpiar contenedor
        
        // Crear controles para expandir/colapsar todos los días
        const accordionControls = document.createElement('div');
        accordionControls.className = 'accordion-controls';
        
        const expandAllBtn = document.createElement('button');
        expandAllBtn.type = 'button';
        expandAllBtn.className = 'secondary-btn';
        expandAllBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir todos';
        expandAllBtn.addEventListener('click', function() {
            const accordionContents = daysContainer.querySelectorAll('.accordion-content');
            const accordionHeaders = daysContainer.querySelectorAll('.accordion-header');
            
            accordionContents.forEach(content => {
                content.style.display = 'block';
            });
            
            accordionHeaders.forEach(header => {
                header.classList.add('active');
                const icon = header.querySelector('.accordion-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            });
        });
        
        const collapseAllBtn = document.createElement('button');
        collapseAllBtn.type = 'button';
        collapseAllBtn.className = 'secondary-btn';
        collapseAllBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Colapsar todos';
        collapseAllBtn.addEventListener('click', function() {
            const accordionContents = daysContainer.querySelectorAll('.accordion-content');
            const accordionHeaders = daysContainer.querySelectorAll('.accordion-header');
            
            accordionContents.forEach(content => {
                content.style.display = 'none';
            });
            
            accordionHeaders.forEach(header => {
                header.classList.remove('active');
                const icon = header.querySelector('.accordion-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
        });
        
        accordionControls.appendChild(expandAllBtn);
        accordionControls.appendChild(collapseAllBtn);
        daysContainer.appendChild(accordionControls);
        
        const startDate = new Date(startDateStr + 'T00:00:00');
        if (isNaN(startDate.getTime())) {
            console.error("Fecha de inicio inválida:", startDateStr);
            return;
        }
        
        let firstDaySection = null;
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const daySection = createDaySection(i, DAYS_OF_WEEK[i], currentDate);
            daysContainer.appendChild(daySection);
            
            // Guardar referencia al primer día para expandirlo por defecto
            if (i === 0) {
                firstDaySection = daySection;
            }
        }
        
        // Expandir el primer día por defecto en un nuevo menú
        if (firstDaySection && !currentEditingMenuId) {
            const accordionHeader = firstDaySection.querySelector('.accordion-header');
            const accordionContent = firstDaySection.querySelector('.accordion-content');
            
            if (accordionHeader && accordionContent) {
                // Activar el header y mostrar el contenido
                accordionHeader.classList.add('active');
                accordionContent.style.display = 'block';
                
                // Cambiar el icono
                const icon = accordionHeader.querySelector('.accordion-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            }
        }
        
        setupAddDishButtons();
    } catch (error) {
        console.error('Error al generar días de la semana:', error);
    }
}

function createDaySection(dayIndex, dayName, date) {
    // Crear el contenedor principal del día (acordeón item)
    const daySection = document.createElement('div');
    daySection.className = 'day-section accordion-item card'; 
    daySection.setAttribute('data-day', dayIndex);
    daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));
    
    // Crear el encabezado del acordeón (header)
    const accordionHeader = document.createElement('div');
    accordionHeader.className = 'accordion-header';
    accordionHeader.setAttribute('data-day-index', dayIndex);
    
    // Crear el título del día
    const dayLabel = document.createElement('h4');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayName;
    
    // Crear el display de la fecha
    const dayDateDisplay = document.createElement('div');
    dayDateDisplay.className = 'day-date';
    dayDateDisplay.textContent = AppUtils.formatDate(date);
    
    // Crear el icono del acordeón
    const accordionIcon = document.createElement('i');
    accordionIcon.className = 'fas fa-chevron-down accordion-icon';
    
    // Añadir elementos al header
    accordionHeader.appendChild(dayLabel);
    accordionHeader.appendChild(dayDateDisplay);
    accordionHeader.appendChild(accordionIcon);
    
    // Crear el contenido colapsable
    const accordionContent = document.createElement('div');
    accordionContent.className = 'accordion-content';
    accordionContent.style.display = 'none'; // Inicialmente oculto
    
    // Crear estructura de pestañas para categorías
    const tabsCategories = document.createElement('div');
    tabsCategories.className = 'tabs-categories';
    
    // Crear contenedor para el contenido de las pestañas
    const tabContentCategoriesContainer = document.createElement('div');
    tabContentCategoriesContainer.className = 'tab-content-categories-container';
    
    // Añadir las categorías como pestañas y contenido
    Object.entries(CATEGORIES).forEach(([categoryKey, categoryName], index) => {
        // Crear botón de pestaña para esta categoría
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = 'tab-btn-category' + (index === 0 ? ' active' : '');
        tabBtn.textContent = categoryName;
        tabBtn.setAttribute('data-category', categoryKey);
        tabBtn.setAttribute('data-day-index', dayIndex);
        
        // Añadir el botón de pestaña al contenedor de pestañas
        tabsCategories.appendChild(tabBtn);
        
        // Crear el contenido de la pestaña para esta categoría
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content-category' + (index === 0 ? ' active' : '');
        tabContent.setAttribute('data-category', categoryKey);
        
        // Crear la sección de categoría y añadirla al contenido de la pestaña
        const categorySection = createCategorySection(dayIndex, dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), categoryKey, categoryName);
        tabContent.appendChild(categorySection);
        
        // Añadir el contenido de la pestaña al contenedor
        tabContentCategoriesContainer.appendChild(tabContent);
    });
    
    // Añadir las pestañas y su contenido al contenido del acordeón
    accordionContent.appendChild(tabsCategories);
    accordionContent.appendChild(tabContentCategoriesContainer);
    
    // Añadir event listener para el toggle del acordeón
    accordionHeader.addEventListener('click', function() {
        // Toggle de la clase active en el header
        this.classList.toggle('active');
        
        // Toggle del display del contenido
        const content = this.nextElementSibling;
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
        
        // Toggle del icono
        const icon = this.querySelector('.accordion-icon');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    });
    
    // Añadir elementos al contenedor principal
    daySection.appendChild(accordionHeader);
    daySection.appendChild(accordionContent);
    
    // Configurar la navegación entre pestañas para este día
    setupCategoryTabsNavigation(daySection);
    
    return daySection;
}

/**
 * Configura la navegación entre pestañas de categorías dentro de un día específico
 * @param {HTMLElement} daySection - El elemento del día que contiene las pestañas
 */
function setupCategoryTabsNavigation(daySection) {
    if (!daySection) return;
    
    // Obtener todos los botones de pestaña dentro de este día
    const tabButtons = daySection.querySelectorAll('.tab-btn-category');
    
    // Añadir event listeners a cada botón de pestaña
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryKey = this.getAttribute('data-category');
            const dayIndex = this.getAttribute('data-day-index');
            
            // Desactivar todas las pestañas y contenidos activos en este día
            const allTabButtons = daySection.querySelectorAll('.tab-btn-category');
            const allTabContents = daySection.querySelectorAll('.tab-content-category');
            
            allTabButtons.forEach(btn => btn.classList.remove('active'));
            allTabContents.forEach(content => content.classList.remove('active'));
            
            // Activar la pestaña y contenido seleccionados
            this.classList.add('active');
            const selectedContent = daySection.querySelector(`.tab-content-category[data-category="${categoryKey}"]`);
            if (selectedContent) {
                selectedContent.classList.add('active');
            }
        });
    });
}

function createCategorySection(dayIndex, dayNameNormalized, categoryKey, categoryName) {
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('h5');
    categoryTitle.textContent = categoryName;
    
    const dishesContainer = document.createElement('div');
    dishesContainer.className = 'dishes-container';
    dishesContainer.setAttribute('data-category', categoryKey);
    
    const firstDishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, 0);
    dishesContainer.appendChild(firstDishInputGroup);
    
    const addDishBtn = document.createElement('button');
    addDishBtn.type = 'button';
    addDishBtn.className = 'add-dish-btn secondary-btn';
    addDishBtn.innerHTML = `<i class="fas fa-plus"></i> Agregar ${categoryKey === 'bebida' ? 'Bebida' : 'Plato'}`;
    addDishBtn.setAttribute('data-day-index', dayIndex);
    addDishBtn.setAttribute('data-category', categoryKey);
    
    categorySection.appendChild(categoryTitle);
    categorySection.appendChild(dishesContainer);
    categorySection.appendChild(addDishBtn);
    return categorySection;
}


function createDishInputGroup(dayNameNormalized, categoryKey, index) {
    console.log(`Creando grupo de input para ${categoryKey} con índice ${index}`);
    
    const dishInputGroup = document.createElement('div');
    dishInputGroup.className = 'dish-input-group';
    dishInputGroup.setAttribute('data-category', categoryKey);
    dishInputGroup.setAttribute('data-index', index);
    
    const dishInput = document.createElement('input');
    dishInput.type = 'text';
    dishInput.className = 'dish-input form-control';
    dishInput.name = `dish-${dayNameNormalized}-${categoryKey}-${index}`;
    
    // Usar placeholder específico según la categoría
    if (categoryKey === 'bebida') {
        dishInput.placeholder = 'Nombre de la bebida';
    } else {
        dishInput.placeholder = 'Nombre del plato';
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn danger-btn icon-btn'; 
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    removeBtn.title = 'Eliminar';
    // Ya no añadimos event listener aquí, lo manejamos con delegación de eventos
    
    dishInputGroup.appendChild(dishInput);
    dishInputGroup.appendChild(removeBtn);
    
    console.log('Grupo de input creado:', dishInputGroup);
    return dishInputGroup;
}


/**
 * Configura la delegación de eventos para los botones de agregar y eliminar platillos
 * Esta función reemplaza el enfoque anterior de añadir listeners individuales
 */
function setupAddDishButtons() {
    console.log("Configurando delegación de eventos para botones de platillos...");
    
    // Obtener el contenedor principal del formulario de menú
    const menuForm = document.getElementById('menu-form');
    if (!menuForm) {
        console.error("Formulario de menú no encontrado");
        return;
    }
    
    // Eliminar listener anterior si existe (para evitar duplicados)
    const newMenuForm = menuForm.cloneNode(true);
    menuForm.parentNode.replaceChild(newMenuForm, menuForm);
    
    // Añadir un solo listener al formulario para manejar todos los clics
    document.getElementById('menu-form').addEventListener('click', function(event) {
        // Manejar botones de eliminar platillo
        const removeButton = event.target.closest('.remove-dish-btn');
        if (removeButton) {
            console.log('Botón Eliminar clickeado:', removeButton);
            const dishGroup = removeButton.closest('.dish-input-group');
            console.log('Grupo de platillo encontrado:', dishGroup);
            
            if (dishGroup) {
                console.log('Eliminando grupo de platillo...');
                dishGroup.remove();
                console.log('Grupo de platillo eliminado con éxito');
            } else {
                console.error('No se pudo encontrar el grupo de platillo para eliminar');
            }
            return;
        }
        
        // Manejar botones de agregar platillo
        const addButton = event.target.closest('.add-dish-btn');
        if (addButton) {
            console.log('Botón Agregar clickeado:', addButton);
            
            const dayIndex = addButton.getAttribute('data-day-index');
            const categoryKey = addButton.getAttribute('data-category');
            console.log('Day Index:', dayIndex, 'Category Key:', categoryKey);
            
            // Buscar la sección del día usando el índice
            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            console.log('Day Section encontrada:', daySection);
            
            if (!daySection) {
                console.error(`No se encontró la sección para el día ${dayIndex}`);
                return;
            }

            // Obtener el nombre del día normalizado
            const dayNameLabel = daySection.querySelector('.day-label').textContent;
            const dayNameNormalized = dayNameLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            console.log('Nombre del día normalizado:', dayNameNormalized);
            
            // Buscar el contenedor de platillos usando la categoría
            const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
            console.log('Contenedor de platillos encontrado:', dishesContainer);
            
            if (!dishesContainer) {
                console.error(`No se encontró el contenedor para la categoría ${categoryKey} en el día ${dayIndex}`);
                return;
            }
            
            // Crear y añadir un nuevo grupo de input para platillo
            const dishIndex = dishesContainer.children.length;
            console.log('Creando nuevo input group con índice:', dishIndex);
            
            const newDishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, dishIndex);
            dishesContainer.appendChild(newDishInputGroup);
            console.log('Nuevo grupo de platillo añadido con éxito');
        }
    });
    
    console.log("Delegación de eventos configurada correctamente");
}


async function saveMenu() {
    const menuName = document.getElementById('menu-name').value;
    const weekStartDate = document.getElementById('week-start-date').value;
    
    if (!menuName || !weekStartDate) {
        AppUtils.showNotification('Por favor, complete el nombre del menú y la fecha de inicio.', 'error');
        return;
    }
    
    const menuData = {
        name: menuName,
        startDate: weekStartDate,
        endDate: calculateEndDateForMenu(weekStartDate),
        active: true, 
    };
     if (currentEditingMenuId) {
        menuData.id = currentEditingMenuId; // Pasar ID solo si estamos editando
    }
    
    const days = [];
    const daySections = document.querySelectorAll('.day-section');
    
    daySections.forEach(daySection => {
        const dayIndex = parseInt(daySection.getAttribute('data-day'));
        const dayDate = daySection.getAttribute('data-date');
        const dayName = DAYS_OF_WEEK[dayIndex];
        
        const dayData = {
            id: dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            name: dayName,
            date: dayDate,
            dishes: []
        };
        
        Object.keys(CATEGORIES).forEach(categoryKey => {
            const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
            if (dishesContainer) {
                const dishGroups = dishesContainer.querySelectorAll('.dish-input-group');
                dishGroups.forEach(dishGroup => {
                    const dishNameInput = dishGroup.querySelector('.dish-input');
                    if (dishNameInput && dishNameInput.value.trim()) {
                        dayData.dishes.push({
                            id: 'dish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + categoryKey + dayIndex,
                            name: dishNameInput.value.trim(),
                            category: categoryKey,
                            description: '', 
                            price: 0.00      
                        });
                    }
                });
            }
        });
        
        if (dayData.dishes.length > 0) {
            days.push(dayData);
        }
    });
    
    if (days.length === 0 && !currentEditingMenuId) {
        AppUtils.showNotification('Por favor, agregue al menos un platillo al menú.', 'error');
        return;
    }
    
    menuData.days = days;
    
    const saveButton = document.getElementById('save-menu-btn');
    const originalButtonHtml = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner"></span> Guardando...';
    
    try {
        let success = false;
        if (currentEditingMenuId) {
            // Para actualizar, pasamos el ID y los datos
            success = await FirebaseMenuModel.update(currentEditingMenuId, menuData);
        } else {
             // Para añadir, no pasamos ID, Firebase lo genera
            success = await FirebaseMenuModel.add(menuData);
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
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return AppUtils.formatDateForInput(endDate);
}

async function loadSavedMenus() {
    const savedMenusContainer = document.getElementById('saved-menus-container');
    if (!savedMenusContainer) return;

    savedMenusContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando...</p>';
    
    try {
        const menus = await FirebaseMenuModel.getAll();
        savedMenusContainer.innerHTML = ''; 
        
        if (menus.length === 0) {
            savedMenusContainer.innerHTML = '<p class="empty-state">No hay menús guardados.</p>';
            return;
        }
        
        menus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        menus.forEach(menu => {
            const menuItem = createMenuItemElement(menu);
            savedMenusContainer.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error al cargar menús guardados:', error);
        savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar menús.</p>';
    }
}


function createMenuItemElement(menu) {
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
    const startDateObj = menu.startDate ? new Date(menu.startDate + 'T00:00:00') : null;
    const endDateObj = menu.endDate ? new Date(menu.endDate + 'T00:00:00') : null;
    const startDate = startDateObj ? AppUtils.formatDate(startDateObj) : 'N/A';
    const endDate = endDateObj ? AppUtils.formatDate(endDateObj) : 'N/A';
    menuDateRange.textContent = `Vigente: ${startDate} - ${endDate}`;
    
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
    
    if (menu.days && Array.isArray(menu.days) && menu.days.length > 0) {
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };
        const sortedDays = [...menu.days].sort((a,b) => {
            const aKey = a.id || a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const bKey = b.id || b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (dayOrder[aKey] || 99) - (dayOrder[bKey] || 99);
        });

        sortedDays.forEach(day => {
            if (!day.dishes || day.dishes.length === 0) return;

            const dayDiv = document.createElement('div');
            dayDiv.className = 'menu-day-details';
            
            const dayTitleElement = document.createElement('h5'); // Renombrado
            dayTitleElement.className = 'menu-day-title';
            const dayDate = day.date ? AppUtils.formatDate(new Date(day.date + 'T00:00:00')) : '';
            dayTitleElement.textContent = `${day.name} (${dayDate})`;
            dayDiv.appendChild(dayTitleElement);

            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesInCategory = day.dishes.filter(d => d.category === categoryKey);
                if (dishesInCategory.length > 0) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'menu-category-details';
                    
                    const categoryTitleElement = document.createElement('h6');
                    categoryTitleElement.className = 'menu-category-title';
                    categoryTitleElement.textContent = CATEGORIES[categoryKey] || categoryKey.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase());
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
        menuContent.innerHTML = '<p class="empty-state-small">No hay platillos detallados.</p>';
    }
    
    menuHeader.addEventListener('click', function() {
        menuContent.classList.toggle('active');
        chevron.classList.toggle('fa-chevron-down');
        chevron.classList.toggle('fa-chevron-up');
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
    document.getElementById('week-start-date').value = menu.startDate;
    
    generateWeekDays(menu.startDate); 
    
    if (menu.days && Array.isArray(menu.days)) {
        // Esperar un ciclo para asegurar que los días se hayan renderizado por generateWeekDays
        setTimeout(() => {
            menu.days.forEach(dayData => {
                const dayIndex = DAYS_OF_WEEK.indexOf(dayData.name);
                if (dayIndex === -1) return;

                const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
                if (!daySection) return;
                
                // Expandir el acordeón si contiene platos
                const accordionHeader = daySection.querySelector('.accordion-header');
                const accordionContent = daySection.querySelector('.accordion-content');
                
                if (accordionHeader && accordionContent && dayData.dishes.length > 0) {
                    // Activar el header y mostrar el contenido
                    accordionHeader.classList.add('active');
                    accordionContent.style.display = 'block';
                    
                    // Cambiar el icono
                    const icon = accordionHeader.querySelector('.accordion-icon');
                    if (icon) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    }
                    
                    // Activar las pestañas correspondientes a las categorías que tienen platos
                    const categoriesWithDishes = new Set(dayData.dishes.map(dish => dish.category));
                    
                    // Si hay platos, activar la primera pestaña que tenga platos
                    if (categoriesWithDishes.size > 0) {
                        const firstCategoryWithDishes = [...categoriesWithDishes][0];
                        
                        // Desactivar todas las pestañas y contenidos
                        const allTabButtons = daySection.querySelectorAll('.tab-btn-category');
                        const allTabContents = daySection.querySelectorAll('.tab-content-category');
                        
                        allTabButtons.forEach(btn => btn.classList.remove('active'));
                        allTabContents.forEach(content => content.classList.remove('active'));
                        
                        // Activar la pestaña y contenido de la primera categoría con platos
                        const tabButton = daySection.querySelector(`.tab-btn-category[data-category="${firstCategoryWithDishes}"]`);
                        const tabContent = daySection.querySelector(`.tab-content-category[data-category="${firstCategoryWithDishes}"]`);
                        
                        if (tabButton) tabButton.classList.add('active');
                        if (tabContent) tabContent.classList.add('active');
                    }
                }

                // Limpiar inputs antes de añadir
                Object.keys(CATEGORIES).forEach(categoryKey => {
                    const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                    if(dishesContainer) dishesContainer.innerHTML = ''; 
                });

                dayData.dishes.forEach(dish => {
                    const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${dish.category}"]`);
                    if (dishesContainer) {
                        const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const newDishGroup = createDishInputGroup(dayNameNormalized, dish.category, dishesContainer.children.length);
                        newDishGroup.querySelector('.dish-input').value = dish.name;
                        dishesContainer.appendChild(newDishGroup);
                    }
                });
                 // Añadir input vacío si la categoría quedó vacía
                Object.keys(CATEGORIES).forEach(categoryKey => {
                    const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                    if (dishesContainer && dishesContainer.children.length === 0) {
                         const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                         dishesContainer.appendChild(createDishInputGroup(dayNameNormalized, categoryKey, 0));
                    }
                });
            });
             document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
             AppUtils.showNotification('Menú cargado para edición.', 'info');
        }, 0); // Ejecutar después del render actual
    } else {
         document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
         AppUtils.showNotification('Menú cargado (sin platillos detallados).', 'info');
    }
}


async function deleteMenu(menuId) {
    if (!confirm('¿Está seguro de que desea eliminar este menú?')) {
        return false;
    }
    try {
        const success = await FirebaseMenuModel.delete(menuId);
        if (success) {
            AppUtils.showNotification('Menú eliminado.', 'success');
            loadSavedMenus();
            if (currentEditingMenuId === menuId) resetMenuForm();
            return true;
        } else {
            AppUtils.showNotification('Error al eliminar menú.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar menú:', error);
        AppUtils.showNotification('Error al eliminar menú.', 'error');
        return false;
    }
}

function resetMenuForm() { 
    currentEditingMenuId = null;
    const form = document.getElementById('menu-form');
    if(form) form.reset();
    const today = new Date();
    const dateInput = document.getElementById('week-start-date');
    if(dateInput) dateInput.value = AppUtils.formatDateForInput(today);
    generateWeekDays(AppUtils.formatDateForInput(today)); // Regenerar días vacíos
    AppUtils.showNotification('Formulario limpiado.', 'info');
}


const CoordinatorManagement = {
    currentEditingCoordinatorId: null,
    initialized: false, // Flag para evitar doble inicialización
    
    init: function() {
        if (this.initialized) return; // Evitar re-inicializar
        console.log("Inicializando CoordinatorManagement...");

        const coordinatorForm = document.getElementById('coordinator-form');
        const resetFormBtn = document.getElementById('reset-coordinator-form-btn');
        
        if (!coordinatorForm || !resetFormBtn) {
            console.error("Elementos del formulario de coordinador no encontrados.");
            return;
        }

        // Limpiar listeners previos antes de añadir nuevos
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
        this.initialized = true; // Marcar como inicializado
    },
    
    generateAccessCode: function() {
        return Array(6).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    },
    
    saveCoordinator: async function() {
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
        // NO incluir ID aquí para añadir, SÍ incluirlo para actualizar
        
        const saveButton = document.getElementById('save-coordinator-btn');
        const originalButtonHtml = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner"></span> Guardando...';

        try {
            let success = false;
            if (this.currentEditingCoordinatorId) {
                // El modelo de update necesita el ID y los datos
                success = await FirebaseCoordinatorModel.update(this.currentEditingCoordinatorId, coordinatorData);
            } else {
                 // El modelo add maneja la creación del ID si no se pasa
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
    
    loadCoordinators: async function() {
        const list = document.getElementById('coordinators-list');
        const msg = document.getElementById('no-coordinators-message');
        const table = document.getElementById('coordinators-table');

        if (!list || !msg || !table) return;
        list.innerHTML = '<td colspan="5" class="empty-state"><span class="spinner"></span> Cargando...</td>';
        
        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            list.innerHTML = ''; // Limpiar después de cargar

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
        
    editCoordinator: async function(coordinatorId) {
        console.log("Intentando editar coordinador:", coordinatorId);
        const coordinator = await FirebaseCoordinatorModel.get(coordinatorId);
        if (!coordinator) {
            AppUtils.showNotification('Coordinador no encontrado.', 'error');
            return;
        }
        
        this.currentEditingCoordinatorId = coordinatorId;
        // Asignar valores a los elementos del formulario
        const nameInput = document.getElementById('coordinator-name');
        const emailInput = document.getElementById('coordinator-email');
        const phoneInput = document.getElementById('coordinator-phone');
        const departmentSelect = document.getElementById('coordinator-department');
        const accessCodeInput = document.getElementById('coordinator-access-code');
        const accessCodeContainer = document.getElementById('access-code-container');
        const saveBtn = document.getElementById('save-coordinator-btn');
        const form = document.getElementById('coordinator-form');
        
        if(nameInput) nameInput.value = coordinator.name;
        if(emailInput) emailInput.value = coordinator.email;
        if(phoneInput) phoneInput.value = coordinator.phone || '';
        if(departmentSelect) departmentSelect.value = coordinator.department;
        if(accessCodeInput) accessCodeInput.value = coordinator.accessCode;
        if(accessCodeContainer) accessCodeContainer.style.display = 'block';
        if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Coordinador';
        if(form) form.scrollIntoView({ behavior: 'smooth' });
    },
    
    deleteCoordinator: async function(coordinatorId) {
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
    
    copyAccessCode: function() {
        const codeInput = document.getElementById('coordinator-access-code');
        if(codeInput && navigator.clipboard) { // Usar API Clipboard si está disponible
            navigator.clipboard.writeText(codeInput.value)
                .then(() => AppUtils.showNotification('Código copiado.', 'success'))
                .catch(err => {
                     console.error('Error al copiar con API Clipboard:', err);
                     // Fallback a execCommand si falla o no está disponible
                     try {
                        codeInput.select();
                        document.execCommand('copy');
                        AppUtils.showNotification('Código copiado (fallback).', 'success');
                     } catch(execErr) {
                        AppUtils.showNotification('Error al copiar código.', 'error');
                     }
                });
        } else if (codeInput) { // Fallback para navegadores antiguos
             try {
                codeInput.select();
                document.execCommand('copy');
                AppUtils.showNotification('Código copiado (fallback).', 'success');
             } catch(execErr) {
                AppUtils.showNotification('Error al copiar código.', 'error');
             }
        }
    },
    
    regenerateAccessCode: function() {
        const newCode = this.generateAccessCode();
        const codeInput = document.getElementById('coordinator-access-code');
        if(codeInput) codeInput.value = newCode;
        AppUtils.showNotification('Nuevo código generado. Guarde los cambios.', 'info');
    },
    
    resetCoordinatorForm: function() {
        this.currentEditingCoordinatorId = null;
        const form = document.getElementById('coordinator-form');
        if(form) form.reset();
        const accessCodeContainer = document.getElementById('access-code-container');
        if(accessCodeContainer) accessCodeContainer.style.display = 'none';
        const saveBtn = document.getElementById('save-coordinator-btn');
        if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Agregar Coordinador';
        // AppUtils.showNotification('Formulario de coordinador limpiado.', 'info'); // Puede ser molesto
    }
};

const ConfirmationReportManagement = {
    currentWeekStartDate: null,
    daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    initialized: false, // Flag

    init: function() {
        if(this.initialized) return;
        console.log("Inicializando ConfirmationReportManagement...");

        this.weekSelector = document.getElementById('week-selector');
        this.prevWeekBtn = document.getElementById('prev-week-btn');
        this.nextWeekBtn = document.getElementById('next-week-btn');
        this.daysHeader = document.getElementById('days-header');
        this.confirmationsBody = document.getElementById('confirmations-body');
        this.totalsFooter = document.getElementById('totals-footer');

        if (!this.weekSelector || !this.prevWeekBtn || !this.nextWeekBtn || !this.daysHeader || !this.confirmationsBody || !this.totalsFooter) {
            console.error("Elementos de la UI de reportes no encontrados.");
            return;
        }
        
        this.setCurrentWeek(this.getMonday(new Date()));
        this.setupEventListeners();
        this.loadConfirmationData().catch(error => console.error('Error loading initial report data:', error));
        this.initialized = true;
    },
    
    setupEventListeners: function() {
        // Remover listeners viejos antes de añadir nuevos
        const newWeekSel = this.weekSelector.cloneNode(true);
        this.weekSelector.parentNode.replaceChild(newWeekSel, this.weekSelector);
        this.weekSelector = newWeekSel;
        this.weekSelector.addEventListener('change', () => {
            this.setCurrentWeek(this.getMonday(new Date(this.weekSelector.value + 'T00:00:00')));
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
    },

    changeWeek: function(dayOffset) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + dayOffset);
        this.setCurrentWeek(this.getMonday(newDate)); 
        this.loadConfirmationData();
    },
    
    setCurrentWeek: function(monday) {
        this.currentWeekStartDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        this.weekSelector.value = AppUtils.formatDateForInput(this.currentWeekStartDate);
        this.updateDaysHeader();
    },
    
    getMonday: function(dParam) {
        const d = new Date(dParam); 
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
        d.setDate(diff);
        d.setHours(0,0,0,0);
        return d;
    },
    
    formatDateForDisplayInReport: function(date) { 
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    
    updateDaysHeader: function() {
         if (!this.daysHeader) return;
        // Limpiar manteniendo 'Departamento' y 'Total'
        const fixedHeaders = [this.daysHeader.firstElementChild, this.daysHeader.lastElementChild];
        this.daysHeader.innerHTML = ''; // Limpiar todo
        this.daysHeader.appendChild(fixedHeaders[0]); // Añadir 'Departamento' de nuevo

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(this.currentWeekStartDate);
            dayDate.setDate(dayDate.getDate() + i);
            const th = document.createElement('th');
            th.innerHTML = `${this.daysOfWeek[i]}<br><small>${this.formatDateForDisplayInReport(dayDate)}</small>`;
            this.daysHeader.appendChild(th); // Añadir día
        }
        this.daysHeader.appendChild(fixedHeaders[1]); // Añadir 'Total' de nuevo
    },
    
    loadConfirmationData: async function() {
        if (!this.confirmationsBody) return;
        this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state"><span class="spinner"></span> Cargando...</td></tr>`;

        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            if (coordinators.length === 0) {
                 this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state">No hay coordinadores.</td></tr>`;
                 this.updateTotalsFooter(Array(7).fill(0),0); 
                 return;
            }

            const allConfirmations = await FirebaseAttendanceModel.getAll();
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            
            const departmentData = {};
            // Inicializar todos los departamentos de los coordinadores existentes
            coordinators.forEach(coord => {
                 if (!departmentData[coord.department]) {
                    departmentData[coord.department] = {
                        name: coord.department,
                        days: Array(7).fill(0), total: 0, pendingDays: Array(7).fill(true) 
                    };
                }
            });


            allConfirmations.forEach(conf => {
                let confWeekStartStr = conf.weekStartDate;
                // Normalizar fecha de confirmación
                if (conf.weekStartDate && typeof conf.weekStartDate.toDate === 'function') {
                    confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate.toDate());
                } else if (conf.weekStartDate instanceof Date) {
                     confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate);
                } else if (typeof conf.weekStartDate === 'string' && conf.weekStartDate.includes('T')) {
                    confWeekStartStr = conf.weekStartDate.split('T')[0];
                } // Asumir que si es string sin T, ya está en YYYY-MM-DD

                // Procesar si la confirmación es de la semana actual
                if (confWeekStartStr === weekStartStr) {
                    const coordinator = coordinators.find(c => c.id === conf.coordinatorId);
                    // Sumar solo si el coordinador existe y pertenece a un departamento conocido
                    if (coordinator && departmentData[coordinator.department]) {
                        const dept = departmentData[coordinator.department];
                        this.daysOfWeek.forEach((dayName, index) => {
                            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            // Usar hasOwnProperty para distinguir 0 de undefined
                            if (conf.attendanceCounts && conf.attendanceCounts.hasOwnProperty(dayId)) { 
                                const count = parseInt(conf.attendanceCounts[dayId], 10);
                                const validCount = isNaN(count) ? 0 : count;
                                dept.days[index] += validCount;
                                dept.total += validCount;
                                dept.pendingDays[index] = false; // Marcar como no pendiente si hay datos
                            }
                        });
                    }
                }
            });
            this.updateConfirmationsTable(departmentData);
        } catch (error) {
            console.error('Error al cargar datos de confirmación:', error);
            this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="error-state">Error al cargar reportes.</td></tr>`;
        }
    },
    
    updateConfirmationsTable: function(departmentData) {
        this.confirmationsBody.innerHTML = '';
        const dayTotals = Array(7).fill(0);
        let grandTotal = 0;
        
        const sortedDepartments = Object.keys(departmentData).sort();

        if (sortedDepartments.length === 0) {
             // Caso manejado en loadConfirmationData
             this.updateTotalsFooter(dayTotals, grandTotal); // Asegurar footer vacío
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
                if (!data.pendingDays[i]) { // Solo sumar si no está pendiente
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

const DataBackupManagement = {
    exportBtn: null, importBtn: null, fileInput: null, selectedFileName: null,
    importActions: null, confirmImportBtn: null, cancelImportBtn: null, selectedFile: null,
    
    init: function() {
        this.exportBtn = document.getElementById('export-data-btn');
        this.importBtn = document.getElementById('import-data-btn');
        this.fileInput = document.getElementById('import-file-input');
        this.selectedFileName = document.getElementById('selected-file-name');
        this.importActions = document.querySelector('.import-actions');
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.cancelImportBtn = document.getElementById('cancel-import-btn');

        // Deshabilitar botones y añadir listeners informativos
        if(this.exportBtn) {
             this.exportBtn.disabled = true;
             this.exportBtn.onclick = () => AppUtils.showNotification('Exportación no aplicable con Firebase.', 'warning');
        }
        if(this.importBtn) {
            this.importBtn.disabled = true;
             this.importBtn.onclick = () => AppUtils.showNotification('Importación no aplicable con Firebase.', 'warning');
        }
       // No configurar listeners de importación real
    },
    // Dejar las funciones vacías o con notificaciones
    exportData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); },
    handleFileSelection: function(file) { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI(); },
    importData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI();},
    cancelImport: function() { this.resetImportUI(); },
    resetImportUI: function() {
        this.selectedFile = null;
        if(this.fileInput) this.fileInput.value = '';
        if(this.selectedFileName) this.selectedFileName.textContent = '';
        if(this.importActions) this.importActions.style.display = 'none';
    }
};
