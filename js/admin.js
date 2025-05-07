/**
 * admin.js
 * Funcionalidades específicas para la vista de administración
 */

// Define tu código de acceso de administrador aquí.
// ¡IMPORTANTE!: Este código estará visible en el frontend. Para mayor seguridad,
// considera Firebase Authentication para el admin en el futuro.
// ADMIN_MASTER_ACCESS_CODE generado: ADMN7X8P (CAMBIA ESTO)
const ADMIN_MASTER_ACCESS_CODE = "ADMN7X8P"; // ¡CAMBIA ESTO POR ALGO SEGURO Y ÚNICO!

// Variables globales
let currentEditingMenuId = null;
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIES = {
    'plato_fuerte': 'Platos Fuertes',
    'bebida': 'Bebidas',
    'entrada': 'Entradas',
    'postre': 'Postres',
    'guarnicion': 'Guarniciones'
};

document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession(); // Verificar sesión al cargar la página
});

function checkAdminSession() {
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const adminMainContent = document.getElementById('admin-main-content');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    if (adminLoggedIn === 'true') {
        console.log("Administrador ya logueado.");
        if (adminLoginModal) adminLoginModal.style.display = 'none';
        if (adminMainContent) adminMainContent.style.display = 'block';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block'; // Mostrar botón de logout
        initializeAdminFeatures();
    } else {
        console.log("Administrador no logueado. Mostrando modal.");
        if (adminLoginModal) adminLoginModal.style.display = 'flex';
        if (adminMainContent) adminMainContent.style.display = 'none';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none'; // Ocultar botón de logout
        setupAdminLoginForm();
    }
}

function setupAdminLoginForm() {
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLoginError = document.getElementById('admin-login-error');
    const adminAccessCodeInput = document.getElementById('admin-access-code');

    if (adminLoginForm && adminAccessCodeInput) { // Asegurarse que el input existe
        adminLoginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const enteredCode = adminAccessCodeInput.value;

            if (enteredCode === ADMIN_MASTER_ACCESS_CODE) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                if (adminLoginError) adminLoginError.style.display = 'none';
                AppUtils.showNotification('Acceso de administrador concedido.', 'success');
                
                const adminLoginModal = document.getElementById('admin-login-modal');
                const adminMainContent = document.getElementById('admin-main-content');
                const adminLogoutBtn = document.getElementById('admin-logout-btn');

                if (adminLoginModal) adminLoginModal.style.display = 'none';
                if (adminMainContent) adminMainContent.style.display = 'block';
                if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block';
                
                initializeAdminFeatures();
            } else {
                if (adminLoginError) {
                    adminLoginError.textContent = 'Código de acceso incorrecto.';
                    adminLoginError.style.display = 'block';
                }
                adminAccessCodeInput.value = '';
                AppUtils.showNotification('Código de acceso de administrador incorrecto.', 'error');
            }
        });
    } else {
        console.error("No se pudo configurar el formulario de login de admin, elementos no encontrados.");
    }
}

function initializeAdminFeatures() {
    console.log('Módulo de administración inicializado (después del login)');
    
    initAdminInterface();
    initMenuForm();
    
    if (typeof CoordinatorManagement !== 'undefined' && typeof CoordinatorManagement.init === 'function') {
        CoordinatorManagement.init();
    } else {
        console.warn("CoordinatorManagement no está definido o no tiene init.");
    }
    
    if (typeof ConfirmationReportManagement !== 'undefined' && typeof ConfirmationReportManagement.init === 'function') {
        ConfirmationReportManagement.init();
    } else {
        console.warn("ConfirmationReportManagement no está definido o no tiene init.");
    }
    
    if (typeof DataBackupManagement !== 'undefined' && typeof DataBackupManagement.init === 'function') {
        DataBackupManagement.init();
    } else {
        console.warn("DataBackupManagement no está definido o no tiene init.");
    }
    
    if (typeof loadSavedMenus === 'function') {
         loadSavedMenus().catch(error => console.error('Error loading menus:', error));
    } else {
        console.warn("loadSavedMenus no está definido.");
    }

    // Configurar botón de logout si existe
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        // Remover listener anterior para evitar duplicados si initializeAdminFeatures se llama múltiples veces
        const newLogoutBtn = adminLogoutBtn.cloneNode(true);
        adminLogoutBtn.parentNode.replaceChild(newLogoutBtn, adminLogoutBtn);

        newLogoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('adminLoggedIn');
            AppUtils.showNotification('Sesión de administrador cerrada.', 'info');
            
            const adminLoginModal = document.getElementById('admin-login-modal');
            const adminMainContent = document.getElementById('admin-main-content');
            const currentLogoutBtn = document.getElementById('admin-logout-btn'); // Obtener referencia actual

            if (adminMainContent) adminMainContent.style.display = 'none';
            if (adminLoginModal) adminLoginModal.style.display = 'flex';
            if (currentLogoutBtn) currentLogoutBtn.style.display = 'none'; // Ocultar el botón de logout
             // No es necesario llamar a setupAdminLoginForm() aquí, checkAdminSession lo hará si recarga o navega
        });
    }
}

/**
 * Inicializa la interfaz de administración (navegación entre secciones)
 */
function initAdminInterface() {
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

    function showSection(sectionToShow) {
        [menuManagementSection, userManagementSection, reportsSection, dashboardSection].forEach(s => {
            if(s) s.style.display = 'none';
        });
        if(sectionToShow) sectionToShow.style.display = 'block';
    }
    
    function showDashboardView() { // Renombrado para evitar conflicto de nombres
        showSection(dashboardSection);
    }
    
    if(menuManagementBtn) menuManagementBtn.addEventListener('click', () => showSection(menuManagementSection));
    if(userManagementBtn) userManagementBtn.addEventListener('click', () => showSection(userManagementSection));
    if(reportsBtn) reportsBtn.addEventListener('click', () => showSection(reportsSection));
    
    if(backToDashboardBtn) backToDashboardBtn.addEventListener('click', showDashboardView);
    if(backToDashboardFromUsersBtn) backToDashboardFromUsersBtn.addEventListener('click', showDashboardView);
    if(backToDashboardFromReportsBtn) backToDashboardFromReportsBtn.addEventListener('click', showDashboardView);
    
    showDashboardView(); // Mostrar el panel principal por defecto al inicializar la UI de admin
}


/**
 * Inicializa el formulario de menú
 */
function initMenuForm() {
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
    
    weekStartDateInput.addEventListener('change', function() {
        generateWeekDays(this.value);
    });
    
    setupAddDishButtons(); // Asegurarse que se llama después de generateWeekDays
    
    resetFormBtn.addEventListener('click', resetMenuForm); // Renombrado para claridad
    
    menuForm.addEventListener('submit', function(event) {
        event.preventDefault();
        saveMenu();
    });
}

function generateWeekDays(startDateStr) {
    try {
        const startDate = new Date(startDateStr + 'T00:00:00');
        const daysContainer = document.getElementById('days-container');
        if (!daysContainer) {
            console.error('Contenedor de días no encontrado');
            return;
        }
        daysContainer.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const daySection = createDaySection(i, DAYS_OF_WEEK[i], currentDate);
            daysContainer.appendChild(daySection);
        }
        setupAddDishButtons(); // Llamar aquí también por si se regeneran los días
    } catch (error) {
        console.error('Error al generar días de la semana:', error);
    }
}

function createDaySection(dayIndex, dayName, date) {
    const daySection = document.createElement('div');
    daySection.className = 'day-section card'; // Añadido card
    daySection.setAttribute('data-day', dayIndex);
    daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));
    
    const dayLabel = document.createElement('h4');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayName;
    
    const dayDateDisplay = document.createElement('div'); // Renombrado para evitar conflicto
    dayDateDisplay.className = 'day-date';
    dayDateDisplay.textContent = AppUtils.formatDate(date);
    
    daySection.appendChild(dayLabel);
    daySection.appendChild(dayDateDisplay);
    
    Object.entries(CATEGORIES).forEach(([categoryKey, categoryName]) => {
        const categorySection = createCategorySection(dayIndex, dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), categoryKey, categoryName);
        daySection.appendChild(categorySection);
    });
    return daySection;
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
    addDishBtn.className = 'add-dish-btn secondary-btn'; // Añadido secondary-btn
    addDishBtn.innerHTML = `<i class="fas fa-plus"></i> Agregar ${categoryKey === 'bebida' ? 'Bebida' : 'Platillo'}`;
    addDishBtn.setAttribute('data-day-index', dayIndex);
    addDishBtn.setAttribute('data-category', categoryKey);
    
    categorySection.appendChild(categoryTitle);
    categorySection.appendChild(dishesContainer);
    categorySection.appendChild(addDishBtn);
    return categorySection;
}

function createDishInputGroup(dayNameNormalized, categoryKey, index) {
    const dishInputGroup = document.createElement('div');
    dishInputGroup.className = 'dish-input-group';
    
    const dishInput = document.createElement('input');
    dishInput.type = 'text';
    dishInput.className = 'dish-input form-control'; // form-control
    dishInput.name = `dish-${dayNameNormalized}-${categoryKey}-${index}`;
    dishInput.placeholder = 'Nombre del platillo/bebida';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn danger-btn icon-btn'; // danger-btn, icon-btn
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    removeBtn.title = 'Eliminar';
    removeBtn.addEventListener('click', function() {
        dishInputGroup.remove();
    });
    
    dishInputGroup.appendChild(dishInput);
    dishInputGroup.appendChild(removeBtn);
    return dishInputGroup;
}

function setupAddDishButtons() {
    document.querySelectorAll('.add-dish-btn').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            const dayIndex = this.getAttribute('data-day-index');
            const categoryKey = this.getAttribute('data-category');
            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            if (!daySection) return;

            const dayNameLabel = daySection.querySelector('.day-label').textContent;
            const dayNameNormalized = dayNameLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
            if (!dishesContainer) return;
            
            const dishIndex = dishesContainer.children.length;
            const newDishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, dishIndex);
            dishesContainer.appendChild(newDishInputGroup);
        });
    });
}

async function saveMenu() {
    // ... (Lógica de saveMenu de la respuesta anterior, asegurándote que usa FirebaseMenuModel)
    // Esta función ya era bastante robusta.
    const menuName = document.getElementById('menu-name').value;
    const weekStartDate = document.getElementById('week-start-date').value;
    
    if (!menuName || !weekStartDate) {
        AppUtils.showNotification('Por favor, complete el nombre del menú y la fecha de inicio.', 'error');
        return;
    }
    
    const menuData = {
        // id: será manejado por FirebaseMenuModel.add o usado si currentEditingMenuId existe
        name: menuName,
        startDate: weekStartDate,
        endDate: calculateEndDateForMenu(weekStartDate), // Usar función con nombre diferente
        active: true, 
    };
     if (currentEditingMenuId) {
        menuData.id = currentEditingMenuId;
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
            success = await FirebaseMenuModel.update(currentEditingMenuId, menuData);
        } else {
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

function calculateEndDateForMenu(startDateStr) { // Renombrada
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Lunes + 6 días = Domingo
    return AppUtils.formatDateForInput(endDate);
}

async function loadSavedMenus() {
    // ... (Lógica de loadSavedMenus de la respuesta anterior, asegurándote que usa FirebaseMenuModel)
    // Esta función ya era bastante robusta.
    const savedMenusContainer = document.getElementById('saved-menus-container');
    if (!savedMenusContainer) return;

    savedMenusContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando menús...</p>';
    
    try {
        const menus = await FirebaseMenuModel.getAll(); // Asume que getAll() ordena por defecto o no importa aquí
        savedMenusContainer.innerHTML = ''; 
        
        if (menus.length === 0) {
            savedMenusContainer.innerHTML = '<p class="empty-state">No hay menús guardados.</p>';
            return;
        }
        
        // Ordenar aquí si es necesario, por ejemplo, por fecha de inicio descendente
        menus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        menus.forEach(menu => {
            const menuItem = createMenuItemElement(menu);
            savedMenusContainer.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error al cargar menús guardados:', error);
        savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar menús guardados.</p>';
    }
}

function createMenuItemElement(menu) {
    // ... (Lógica de createMenuItemElement de la respuesta anterior)
    // Esta función ya era bastante robusta.
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
    // Asegurar que las fechas se manejan como strings YYYY-MM-DD y se les añade T00:00:00 para new Date()
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
    chevron.className = 'fas fa-chevron-down collapser-icon'; // Icono para colapsar/expandir
    
    menuHeader.appendChild(menuInfo);
    menuHeader.appendChild(menuActions);
    menuHeader.appendChild(chevron); // Añadir el chevron
    
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content'; // Oculto por CSS por defecto
    
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
            
            const dayTitle = document.createElement('h5');
            dayTitle.className = 'menu-day-title';
            const dayDate = day.date ? AppUtils.formatDate(new Date(day.date + 'T00:00:00')) : '';
            dayTitle.textContent = `${day.name} (${dayDate})`;
            dayDiv.appendChild(dayTitle);

            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesInCategory = day.dishes.filter(d => d.category === categoryKey);
                if (dishesInCategory.length > 0) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'menu-category-details';
                    
                    const categoryTitleElement = document.createElement('h6'); // Renombrado para evitar conflicto
                    categoryTitleElement.className = 'menu-category-title';
                    categoryTitleElement.textContent = CATEGORIES[categoryKey];
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
        menuContent.classList.toggle('active');
        chevron.classList.toggle('fa-chevron-down');
        chevron.classList.toggle('fa-chevron-up');
    });

    menuItem.appendChild(menuHeader);
    menuItem.appendChild(menuContent);
    return menuItem;
}

async function editMenu(menuId) {
    // ... (Lógica de editMenu de la respuesta anterior, asegurándote que usa FirebaseMenuModel.get)
    // Esta función ya era bastante robusta.
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
        menu.days.forEach(dayData => {
            const dayIndex = DAYS_OF_WEEK.indexOf(dayData.name);
            if (dayIndex === -1) return;

            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            if (!daySection) return;

            // Limpiar inputs existentes en las categorías de este día antes de añadir los nuevos
            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                if(dishesContainer) dishesContainer.innerHTML = ''; // Limpiar
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
             // Añadir un input vacío al final de cada categoría si no hay ninguno
            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                if (dishesContainer && dishesContainer.children.length === 0) {
                     const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                     dishesContainer.appendChild(createDishInputGroup(dayNameNormalized, categoryKey, 0));
                }
            });
        });
    }
    
    document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
    AppUtils.showNotification('Menú cargado para edición.', 'info');
}

async function deleteMenu(menuId) {
    // ... (Lógica de deleteMenu de la respuesta anterior, asegurándote que usa FirebaseMenuModel.delete)
    // Esta función ya era bastante robusta.
    if (!confirm('¿Está seguro de que desea eliminar este menú? Esta acción no se puede deshacer.')) {
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
            AppUtils.showNotification('Error al eliminar el menú.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar menú:', error);
        AppUtils.showNotification('Error al eliminar el menú.', 'error');
        return false;
    }
}

function resetMenuForm() { // Renombrado
    currentEditingMenuId = null;
    document.getElementById('menu-form').reset();
    const today = new Date();
    document.getElementById('week-start-date').value = AppUtils.formatDateForInput(today);
    generateWeekDays(AppUtils.formatDateForInput(today));
    AppUtils.showNotification('Formulario de menú limpiado.', 'info');
}


/**
 * Gestión de Coordinadores (CoordinatorManagement)
 */
const CoordinatorManagement = {
    // ... (Toda la lógica de CoordinatorManagement de la respuesta anterior)
    // Esta parte ya era bastante robusta y usaba FirebaseCoordinatorModel.
    currentEditingCoordinatorId: null,
    
    init: function() {
        const coordinatorForm = document.getElementById('coordinator-form');
        const resetFormBtn = document.getElementById('reset-coordinator-form-btn');
        
        if (!coordinatorForm || !resetFormBtn) {
            console.error("Elementos del formulario de coordinador no encontrados.");
            return;
        }

        coordinatorForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.saveCoordinator();
        });
        
        resetFormBtn.addEventListener('click', () => this.resetCoordinatorForm()); // Renombrado
        
        const copyBtn = document.getElementById('copy-access-code-btn');
        const regenBtn = document.getElementById('regenerate-access-code-btn');

        if(copyBtn) copyBtn.addEventListener('click', () => this.copyAccessCode());
        if(regenBtn) regenBtn.addEventListener('click', () => this.regenerateAccessCode());
        
        this.loadCoordinators().catch(error => console.error('Error loading coordinators:', error));
    },
    
    generateAccessCode: function() {
        return Array(6).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    },
    
    saveCoordinator: async function() {
        const name = document.getElementById('coordinator-name').value.trim();
        const email = document.getElementById('coordinator-email').value.trim();
        const phone = document.getElementById('coordinator-phone').value.trim();
        const department = document.getElementById('coordinator-department').value;
        
        if (!name || !email || !department) {
            AppUtils.showNotification('Complete los campos requeridos (*).', 'error');
            return false;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AppUtils.showNotification('Correo electrónico inválido.', 'error');
            return false;
        }
        
        let accessCode = document.getElementById('coordinator-access-code').value;
        // Generar código solo si es nuevo o si se está editando y no hay código (lo cual no debería pasar si se muestra)
        if (!this.currentEditingCoordinatorId || !accessCode) {
            accessCode = this.generateAccessCode();
        }

        const coordinatorData = { name, email, phone, department, accessCode, active: true };
        if (this.currentEditingCoordinatorId) {
            coordinatorData.id = this.currentEditingCoordinatorId; // Asegurar que el ID se envía para actualización
        }

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
        return true; // Asumiendo que la operación se intentó
    },
    
    loadCoordinators: async function() {
        const list = document.getElementById('coordinators-list');
        const msg = document.getElementById('no-coordinators-message');
        const table = document.getElementById('coordinators-table');

        if (!list || !msg || !table) return;
        list.innerHTML = '';
        
        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
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
            msg.textContent = 'Error al cargar coordinadores.';
            msg.style.display = 'block';
            table.style.display = 'none';
        }
    },
        
    editCoordinator: async function(coordinatorId) {
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
        if(codeInput) {
            codeInput.select();
            navigator.clipboard.writeText(codeInput.value)
                .then(() => AppUtils.showNotification('Código copiado.', 'success'))
                .catch(err => AppUtils.showNotification('Error al copiar código.', 'error'));
        }
    },
    
    regenerateAccessCode: function() {
        const newCode = this.generateAccessCode();
        const codeInput = document.getElementById('coordinator-access-code');
        if(codeInput) codeInput.value = newCode;
        AppUtils.showNotification('Nuevo código generado. Guarde los cambios.', 'info');
    },
    
    resetCoordinatorForm: function() { // Renombrado
        this.currentEditingCoordinatorId = null;
        const form = document.getElementById('coordinator-form');
        if(form) form.reset();
        const accessCodeContainer = document.getElementById('access-code-container');
        if(accessCodeContainer) accessCodeContainer.style.display = 'none';
        const saveBtn = document.getElementById('save-coordinator-btn');
        if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Agregar Coordinador';
        AppUtils.showNotification('Formulario de coordinador limpiado.', 'info');
    }
};

/**
 * Gestión de Reportes de Confirmación (ConfirmationReportManagement)
 */
const ConfirmationReportManagement = {
    // ... (Toda la lógica de ConfirmationReportManagement de la respuesta anterior)
    // Esta parte ya era bastante robusta y usaba Firebase.
    currentWeekStartDate: null,
    daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    
    init: function() {
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
    },
    
    setupEventListeners: function() {
        this.weekSelector.addEventListener('change', () => {
            this.setCurrentWeek(this.getMonday(new Date(this.weekSelector.value + 'T00:00:00'))); //Asegurar hora local
            this.loadConfirmationData();
        });
        this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-7));
        this.nextWeekBtn.addEventListener('click', () => this.changeWeek(7));
    },

    changeWeek: function(dayOffset) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + dayOffset);
        this.setCurrentWeek(this.getMonday(newDate)); // getMonday normalizará
        this.loadConfirmationData();
    },
    
    setCurrentWeek: function(monday) {
        this.currentWeekStartDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()); // Normalizar a medianoche
        this.weekSelector.value = AppUtils.formatDateForInput(this.currentWeekStartDate);
        this.updateDaysHeader();
    },
    
    getMonday: function(dParam) {
        const d = new Date(dParam); // Crear nueva instancia para no modificar la original
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0,0,0,0); // Normalizar a medianoche
        return d;
    },
    
    formatDateForDisplayInReport: function(date) { // Renombrado para evitar conflicto
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    
    updateDaysHeader: function() {
        while (this.daysHeader.children.length > 2) { // Depto y Total son fijos
            this.daysHeader.removeChild(this.daysHeader.children[1]);
        }
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(this.currentWeekStartDate);
            dayDate.setDate(dayDate.getDate() + i);
            const th = document.createElement('th');
            th.innerHTML = `${this.daysOfWeek[i]}<br><small>${this.formatDateForDisplayInReport(dayDate)}</small>`;
            this.daysHeader.insertBefore(th, this.daysHeader.lastElementChild);
        }
    },
    
    loadConfirmationData: async function() {
        if (!this.confirmationsBody) return;
        this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state"><span class="spinner"></span> Cargando...</td></tr>`;

        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            if (coordinators.length === 0) {
                 this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state">No hay coordinadores registrados.</td></tr>`;
                 this.updateTotalsFooter([],0); // Limpiar totales
                 return;
            }

            const allConfirmations = await FirebaseAttendanceModel.getAll();
            
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            
            const departmentData = {};
            coordinators.forEach(coord => {
                if (!departmentData[coord.department]) {
                    departmentData[coord.department] = {
                        name: coord.department,
                        days: Array(7).fill(0),
                        total: 0,
                        pendingDays: Array(7).fill(true) 
                    };
                }
            });

            allConfirmations.forEach(conf => {
                let confWeekStartStr = conf.weekStartDate;
                if (conf.weekStartDate && typeof conf.weekStartDate.toDate === 'function') {
                    confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate.toDate());
                } else if (conf.weekStartDate instanceof Date) {
                     confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate);
                } else if (typeof conf.weekStartDate === 'string' && conf.weekStartDate.includes('T')) {
                    confWeekStartStr = conf.weekStartDate.split('T')[0];
                }


                if (confWeekStartStr === weekStartStr) {
                    const coordinator = coordinators.find(c => c.id === conf.coordinatorId);
                    if (coordinator && departmentData[coordinator.department]) {
                        const dept = departmentData[coordinator.department];
                        this.daysOfWeek.forEach((dayName, index) => {
                            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const count = (conf.attendanceCounts && conf.attendanceCounts[dayId] !== undefined) ? parseInt(conf.attendanceCounts[dayId], 10) : 0;
                            
                            if (conf.attendanceCounts && conf.attendanceCounts.hasOwnProperty(dayId)) { // Considerar si el día fue explícitamente guardado
                                dept.days[index] += (isNaN(count) ? 0 : count);
                                dept.total += (isNaN(count) ? 0 : count);
                                dept.pendingDays[index] = false; 
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
             // Este caso ya se maneja en loadConfirmationData si no hay coordinadores
             this.updateTotalsFooter(dayTotals, grandTotal);
             return;
        }

        sortedDepartments.forEach(deptName => {
            const data = departmentData[deptName];
            const row = this.confirmationsBody.insertRow();
            row.insertCell().textContent = data.name;
            
            for (let i = 0; i < 7; i++) {
                const cell = row.insertCell();
                cell.textContent = data.pendingDays[i] ? '—' : data.days[i]; // Usar guion para pendiente
                cell.className = data.pendingDays[i] ? 'pending' : (data.days[i] > 0 ? 'confirmed' : 'zero-confirmed'); // Nueva clase para 0 confirmado
                dayTotals[i] += data.days[i]; // Sumar solo si no está pendiente
            }
            
            const totalCell = row.insertCell();
            totalCell.textContent = data.total;
            totalCell.className = 'report-total-dept';
            grandTotal += data.total;
        });
        this.updateTotalsFooter(dayTotals, grandTotal);
    },
    
    updateTotalsFooter: function(dayTotals, grandTotal) {
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

/**
 * Gestión de Respaldo de Datos (DataBackupManagement)
 */
const DataBackupManagement = {
    // ... (Lógica de DataBackupManagement de la respuesta anterior)
    // Esta parte ya estaba deshabilitada para Firebase.
    exportBtn: null, importBtn: null, fileInput: null, selectedFileName: null,
    importActions: null, confirmImportBtn: null, cancelImportBtn: null, selectedFile: null,
    
    init: function() {
        this.exportBtn = document.getElementById('export-data-btn');
        this.importBtn = document.getElementById('import-data-btn');
        // ... (resto de las asignaciones de elementos)
        this.fileInput = document.getElementById('import-file-input');
        this.selectedFileName = document.getElementById('selected-file-name');
        this.importActions = document.querySelector('.import-actions');
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.cancelImportBtn = document.getElementById('cancel-import-btn');


        if(this.exportBtn) this.exportBtn.addEventListener('click', () => {
            AppUtils.showNotification('Exportación no aplicable con Firebase.', 'warning');
        });
        if(this.importBtn && this.fileInput) this.importBtn.addEventListener('click', () => {
             AppUtils.showNotification('Importación no aplicable con Firebase.', 'warning');
            // this.fileInput.click(); // No permitir click si está deshabilitado
        });
        // ... (resto de los listeners si son necesarios, pero la funcionalidad está "deshabilitada")
    },
    // Las funciones de export/import pueden dejarse vacías o con notificaciones.
    exportData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); },
    handleFileSelection: function(file) { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI(); },
    importData: function() { AppUtils.showNotification('No implementado para Firebase.', 'info'); this.resetImportUI();},
    cancelImport: function() { this.resetImportUI(); },
    resetImportUI: function() {
        this.selectedFile = null;
        if(this.fileInput) this.fileInput.value = '';
        if(this.selectedFileName) this.selectedFileName.textContent = '';
        if(this.importActions) this.importActions.style.display = 'none';
        // ... (resetear botones si es necesario)
    }
};