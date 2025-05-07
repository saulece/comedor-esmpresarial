/**
 * admin.js
 * Funcionalidades específicas para la vista de administración
 */

// Variables globales
let currentEditingMenuId = null;
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIES = {
    'plato_fuerte': 'Platos Fuertes',
    'bebida': 'Bebidas'
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de administración inicializado');
    
    // Inicializar la interfaz de administración
    initAdminInterface();
    
    // Inicializar el formulario de menú
    initMenuForm();
    
    // Inicializar gestión de coordinadores
    CoordinatorManagement.init();
    
    // Inicializar gestión de reportes de confirmaciones
    ConfirmationReportManagement.init();
    
    // Inicializar gestión de respaldo de datos
    DataBackupManagement.init();
    
    // Cargar menús guardados
    loadSavedMenus().catch(error => console.error('Error loading menus:', error));
});

/**
 * Inicializa la interfaz de administración
 */
function initAdminInterface() {
    // Configurar navegación entre secciones
    const menuManagementBtn = document.getElementById('menu-management-btn');
    const userManagementBtn = document.getElementById('user-management-btn');
    const reportsBtn = document.getElementById('reports-btn');
    
    const menuManagementSection = document.getElementById('menu-management-section');
    const userManagementSection = document.getElementById('user-management-section');
    const reportsSection = document.getElementById('reports-section');
    
    // Botones para volver al panel principal
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const backToDashboardFromUsersBtn = document.getElementById('back-to-dashboard-from-users-btn');
    const backToDashboardFromReportsBtn = document.getElementById('back-to-dashboard-from-reports-btn');
    
    // Referencia al panel principal
    const dashboardSection = document.querySelector('.dashboard');
    
    // Ocultar todas las secciones excepto la activa
    function showSection(section) {
        // Ocultar todas las secciones
        [menuManagementSection, userManagementSection, reportsSection].forEach(s => {
            s.style.display = 'none';
        });
        
        // Mostrar la sección seleccionada
        section.style.display = 'block';
        
        // Mostrar u ocultar el panel principal según corresponda
        if (section === dashboardSection) {
            dashboardSection.style.display = 'block';
        } else {
            dashboardSection.style.display = 'none';
        }
    }
    
    // Mostrar el panel principal
    function showDashboard() {
        [menuManagementSection, userManagementSection, reportsSection].forEach(s => {
            s.style.display = 'none';
        });
        dashboardSection.style.display = 'block';
    }
    
    // Configurar eventos de clic para los botones de navegación
    menuManagementBtn.addEventListener('click', function() {
        showSection(menuManagementSection);
    });
    
    userManagementBtn.addEventListener('click', function() {
        showSection(userManagementSection);
    });
    
    reportsBtn.addEventListener('click', function() {
        showSection(reportsSection);
    });
    
    // Configurar eventos para los botones de volver al panel
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', showDashboard);
    }
    
    if (backToDashboardFromUsersBtn) {
        backToDashboardFromUsersBtn.addEventListener('click', showDashboard);
    }
    
    if (backToDashboardFromReportsBtn) {
        backToDashboardFromReportsBtn.addEventListener('click', showDashboard);
    }
    
    // Mostrar el panel principal por defecto
    showDashboard();
}

// La función showNotification se ha movido a utils.js

/**
 * Gestión de usuarios (placeholder para implementación futura)
 */
const UserManagement = {
    // Métodos para gestionar usuarios
    // Se implementarán en futuras tareas
};

/**
 * Gestión de menús (placeholder para implementación futura)
 */
const MenuManagement = {
    // Métodos para gestionar menús
    // Se implementarán en futuras tareas
};

/**
 * Gestión de platillos (placeholder para implementación futura)
 */
const DishManagement = {
    // Métodos para gestionar platillos
    // Se implementarán en futuras tareas
};

/**
 * Gestión de reportes (placeholder para implementación futura)
 */
const ReportManagement = {
    // Métodos para generar reportes
    // Se implementarán en futuras tareas
};

/**
 * Inicializa el formulario de menú
 */
function initMenuForm() {
    const weekStartDateInput = document.getElementById('week-start-date');
    const daysContainer = document.getElementById('days-container');
    const menuForm = document.getElementById('menu-form');
    const resetFormBtn = document.getElementById('reset-form-btn');
    
    // Establecer la fecha actual como valor predeterminado
    const today = new Date();
    const formattedDate = AppUtils.formatDateForInput(today);
    weekStartDateInput.value = formattedDate;
    
    // Generar días de la semana iniciales
    generateWeekDays(weekStartDateInput.value);
    
    // Escuchar cambios en la fecha de inicio
    weekStartDateInput.addEventListener('change', function() {
        generateWeekDays(this.value);
    });
    
    // Configurar botones para agregar platillos
    setupAddDishButtons();
    
    // Configurar botón para limpiar formulario
    resetFormBtn.addEventListener('click', function() {
        resetForm();
    });
    
    // Manejar envío del formulario
    menuForm.addEventListener('submit', function(event) {
        event.preventDefault();
        saveMenu();
    });
}

// La función formatDateForInput se ha movido a utils.js

/**
 * Genera las secciones para los días de la semana
 * @param {string} startDateStr - Fecha de inicio en formato YYYY-MM-DD
 */
function generateWeekDays(startDateStr) {
    try {
        // Convertir la fecha de inicio a objeto Date
        const startDate = new Date(startDateStr + 'T00:00:00'); // Asegurar que se interprete como local
        
        // Limpiar el contenedor de días
        const daysContainer = document.getElementById('days-container');
        if (!daysContainer) {
            console.error('No se encontró el contenedor de días');
            return;
        }
        
        daysContainer.innerHTML = ''; // Limpiar completamente
        
        // Generar los días de la semana (Lunes a Domingo)
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const daySection = createDaySection(i, DAYS_OF_WEEK[i], currentDate);
            daysContainer.appendChild(daySection);
        }
        
        // Configurar botones para agregar platillos en los nuevos días
        setupAddDishButtons();
    } catch (error) {
        console.error('Error al generar los días de la semana:', error);
    }
}


/**
 * Actualiza la fecha mostrada en una sección de día
 * @param {HTMLElement} daySection - Elemento de sección de día
 * @param {Date} date - Fecha a mostrar
 */
function updateDayDate(daySection, date) {
    const dayDate = daySection.querySelector('.day-date');
    dayDate.textContent = AppUtils.formatDate(date);
    daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));
}

// La función formatDate se ha movido a utils.js

/**
 * Crea una sección para un día de la semana
 * @param {number} dayIndex - Índice del día (0-6)
 * @param {string} dayName - Nombre del día
 * @param {Date} date - Fecha del día
 * @returns {HTMLElement} - Elemento de sección de día
 */
function createDaySection(dayIndex, dayName, date) {
    const daySection = document.createElement('div');
    daySection.className = 'day-section';
    daySection.setAttribute('data-day', dayIndex);
    daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));
    
    const dayLabel = document.createElement('h4');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayName;
    
    const dayDate = document.createElement('div');
    dayDate.className = 'day-date';
    dayDate.textContent = AppUtils.formatDate(date);
    
    daySection.appendChild(dayLabel);
    daySection.appendChild(dayDate);
    
    // Crear secciones para cada categoría
    Object.entries(CATEGORIES).forEach(([categoryKey, categoryName]) => {
        const categorySection = createCategorySection(dayIndex, dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), categoryKey, categoryName);
        daySection.appendChild(categorySection);
    });
    
    return daySection;
}

/**
 * Crea una sección para una categoría de platillos
 * @param {number} dayIndex - Índice del día (0-6)
 * @param {string} dayNameNormalized - Nombre del día en minúsculas y normalizado
 * @param {string} categoryKey - Clave de la categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {HTMLElement} - Elemento de sección de categoría
 */
function createCategorySection(dayIndex, dayNameNormalized, categoryKey, categoryName) {
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('h5');
    categoryTitle.textContent = categoryName;
    
    const dishesContainer = document.createElement('div');
    dishesContainer.className = 'dishes-container';
    dishesContainer.setAttribute('data-category', categoryKey);
    
    // Crear el primer grupo de entrada de platillo
    const dishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, 0);
    dishesContainer.appendChild(dishInputGroup);
    
    const addDishBtn = document.createElement('button');
    addDishBtn.type = 'button';
    addDishBtn.className = 'add-dish-btn';
    addDishBtn.innerHTML = `<i class="fas fa-plus"></i> Agregar ${categoryName.slice(0, -1)}`; // Ícono
    addDishBtn.setAttribute('data-day-index', dayIndex); // Usar dayIndex
    addDishBtn.setAttribute('data-category', categoryKey);
    
    categorySection.appendChild(categoryTitle);
    categorySection.appendChild(dishesContainer);
    categorySection.appendChild(addDishBtn);
    
    return categorySection;
}

/**
 * Crea un grupo de entrada para un platillo
 * @param {string} dayNameNormalized - Nombre del día en minúsculas y normalizado
 * @param {string} categoryKey - Clave de la categoría
 * @param {number} index - Índice del platillo
 * @returns {HTMLElement} - Elemento de grupo de entrada
 */
function createDishInputGroup(dayNameNormalized, categoryKey, index) {
    const dishInputGroup = document.createElement('div');
    dishInputGroup.className = 'dish-input-group';
    
    const dishInput = document.createElement('input');
    dishInput.type = 'text';
    dishInput.className = 'dish-input';
    dishInput.name = `dish-${dayNameNormalized}-${categoryKey}-${index}`;
    dishInput.placeholder = 'Nombre del platillo';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn';
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícono
    removeBtn.title = 'Eliminar platillo';
    removeBtn.addEventListener('click', function() {
        const parent = dishInputGroup.parentNode;
        parent.removeChild(dishInputGroup);
        
        // Si no quedan platillos, agregar uno vacío (opcional, puede ser confuso)
        // if (parent.children.length === 0) {
        //     const newDishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, 0);
        //     parent.appendChild(newDishInputGroup);
        // }
    });
    
    dishInputGroup.appendChild(dishInput);
    dishInputGroup.appendChild(removeBtn);
    
    return dishInputGroup;
}

/**
 * Configura los botones para agregar platillos
 */
function setupAddDishButtons() {
    const addDishButtons = document.querySelectorAll('.add-dish-btn');
    
    addDishButtons.forEach(button => {
        const newButton = button.cloneNode(true); // Clonar para remover listeners antiguos
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            const dayIndex = this.getAttribute('data-day-index');
            const categoryKey = this.getAttribute('data-category');
            
            // Encontrar la sección del día correcta usando dayIndex
            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            if (!daySection) {
                console.error(`No se encontró daySection para el índice ${dayIndex}`);
                return;
            }
            const dayNameLabel = daySection.querySelector('.day-label').textContent;
            const dayNameNormalized = dayNameLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
            if (!dishesContainer) {
                console.error(`No se encontró dishesContainer para ${categoryKey} en el día ${dayNameLabel}`);
                return;
            }
            
            const index = dishesContainer.children.length;
            const dishInputGroup = createDishInputGroup(dayNameNormalized, categoryKey, index);
            dishesContainer.appendChild(dishInputGroup);
        });
    });
}


/**
 * Guarda el menú actual en el almacenamiento
 */
async function saveMenu() {
    const menuName = document.getElementById('menu-name').value;
    const weekStartDate = document.getElementById('week-start-date').value;
    
    if (!menuName || !weekStartDate) {
        AppUtils.showNotification('Por favor, complete el nombre del menú y la fecha de inicio.', 'error');
        return;
    }
    
    const menuData = {
        id: currentEditingMenuId || 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: menuName,
        startDate: weekStartDate,
        endDate: calculateEndDate(weekStartDate), // Asume menú de 5 días (Lun-Vie)
        active: true, // Por defecto, los menús nuevos o editados se marcan como activos
        // createdAt y updatedAt serán manejados por FirebaseMenuModel
    };
    
    const days = [];
    const daySections = document.querySelectorAll('.day-section');
    
    daySections.forEach(daySection => {
        const dayIndex = parseInt(daySection.getAttribute('data-day'));
        const dayDate = daySection.getAttribute('data-date'); // YYYY-MM-DD
        const dayName = DAYS_OF_WEEK[dayIndex];
        
        const dayData = {
            id: dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // ej: 'lunes'
            name: dayName, // ej: 'Lunes'
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
                            id: 'dish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            name: dishNameInput.value.trim(),
                            category: categoryKey,
                            // Podrías añadir más campos aquí si los tuvieras en el formulario (descripción, precio)
                            description: '', // Placeholder
                            price: 0.00      // Placeholder
                        });
                    }
                });
            }
        });
        
        // Solo agregar días que tengan al menos un platillo
        if (dayData.dishes.length > 0) {
            days.push(dayData);
        }
    });
    
    if (days.length === 0 && !currentEditingMenuId) { // Solo requerir platillos para menús nuevos
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
            console.log('Actualizando menú existente en Firebase:', currentEditingMenuId);
            success = await FirebaseMenuModel.update(currentEditingMenuId, menuData);
        } else {
            console.log('Creando nuevo menú en Firebase');
            success = await FirebaseMenuModel.add(menuData);
        }
        
        if (success) {
            AppUtils.showNotification(currentEditingMenuId ? 'Menú actualizado correctamente.' : 'Menú guardado correctamente.', 'success');
            loadSavedMenus().catch(error => console.error('Error al cargar menús después de guardar:', error));
            resetForm();
        } else {
            AppUtils.showNotification(currentEditingMenuId ? 'Error al actualizar el menú.' : 'Error al guardar el menú.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar menú:', error);
        AppUtils.showNotification('Error al procesar el menú. Por favor, intente de nuevo.', 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonHtml;
    }
}


/**
 * Calcula la fecha de fin basada en la fecha de inicio
 * @param {string} startDateStr - Fecha de inicio en formato YYYY-MM-DD
 * @returns {string} - Fecha de fin en formato YYYY-MM-DD (6 días después para cubrir Dom)
 */
function calculateEndDate(startDateStr) {
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Lunes + 6 días = Domingo
    return AppUtils.formatDateForInput(endDate);
}

/**
 * Carga los menús guardados y los muestra en la interfaz
 * @returns {Promise<void>}
 */
async function loadSavedMenus() {
    const savedMenusContainer = document.getElementById('saved-menus-container');
    if (!savedMenusContainer) return;

    savedMenusContainer.innerHTML = '<p class="empty-state"><span class="spinner"></span> Cargando menús guardados...</p>';
    
    try {
        const menus = await FirebaseMenuModel.getAll();
        savedMenusContainer.innerHTML = ''; // Limpiar después de cargar
        
        if (menus.length === 0) {
            savedMenusContainer.innerHTML = '<p class="empty-state">No hay menús guardados aún.</p>';
            return;
        }
        
        menus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        menus.forEach(menu => {
            const menuItem = createMenuItemElement(menu);
            savedMenusContainer.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error al cargar menús guardados:', error);
        savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar menús. Intente de nuevo.</p>';
    }
}

/**
 * Crea un elemento para mostrar un menú guardado
 * @param {Object} menu - Objeto de menú
 * @returns {HTMLElement} - Elemento de menú
 */
function createMenuItemElement(menu) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item card'; // Añadido card para consistencia
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
    const startDate = menu.startDate ? AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00')) : 'N/A';
    const endDate = menu.endDate ? AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00')) : 'N/A';
    menuDateRange.textContent = `Del ${startDate} al ${endDate}`;
    
    menuInfo.appendChild(menuTitle);
    menuInfo.appendChild(menuDateRange);
    
    const menuActions = document.createElement('div');
    menuActions.className = 'menu-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'secondary-btn edit-menu-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        editMenu(menu.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger-btn delete-menu-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    deleteBtn.addEventListener('click', async function(event) {
        event.stopPropagation();
        await deleteMenu(menu.id);
    });
    
    menuActions.appendChild(editBtn);
    menuActions.appendChild(deleteBtn);
    
    menuHeader.appendChild(menuInfo);
    menuHeader.appendChild(menuActions);
    
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    
    if (menu.days && Array.isArray(menu.days) && menu.days.length > 0) {
        menu.days.forEach(day => {
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
                    
                    const categoryTitle = document.createElement('h6');
                    categoryTitle.className = 'menu-category-title';
                    categoryTitle.textContent = CATEGORIES[categoryKey];
                    categoryDiv.appendChild(categoryTitle);

                    const ul = document.createElement('ul');
                    dishesInCategory.forEach(dish => {
                        const li = document.createElement('li');
                        li.className = 'menu-dish-item';
                        li.textContent = dish.name;
                        // Podrías agregar (dish.price ? ` - $${dish.price.toFixed(2)}` : '') si tienes precios
                        ul.appendChild(li);
                    });
                    categoryDiv.appendChild(ul);
                    dayDiv.appendChild(categoryDiv);
                }
            });
            menuContent.appendChild(dayDiv);
        });
    } else {
        menuContent.innerHTML = '<p class="empty-state">Este menú no tiene platillos detallados.</p>';
    }
    
    menuHeader.addEventListener('click', function() {
        menuContent.classList.toggle('active');
        menuHeader.querySelector('.fas.fa-chevron-down, .fas.fa-chevron-up')?.classList.toggle('fa-chevron-down');
        menuHeader.querySelector('.fas.fa-chevron-down, .fas.fa-chevron-up')?.classList.toggle('fa-chevron-up');

    });
     // Add chevron icon for collapsibility
    const chevron = document.createElement('i');
    chevron.className = 'fas fa-chevron-down'; // Default to down
    menuHeader.appendChild(chevron);


    menuItem.appendChild(menuHeader);
    menuItem.appendChild(menuContent);
    
    return menuItem;
}

/**
 * Edita un menú existente
 * @param {string} menuId - ID del menú a editar
 */
async function editMenu(menuId) {
    const menu = await FirebaseMenuModel.get(menuId);
    if (!menu) {
        AppUtils.showNotification('No se encontró el menú.', 'error');
        return;
    }
    
    currentEditingMenuId = menuId;
    
    document.getElementById('menu-name').value = menu.name;
    document.getElementById('week-start-date').value = menu.startDate;
    
    generateWeekDays(menu.startDate); // Esto crea la estructura de días y categorías vacía
    
    // Llenar los campos de platillos con los datos del menú
    if (menu.days && Array.isArray(menu.days)) {
        menu.days.forEach(dayData => {
            const dayIndex = DAYS_OF_WEEK.indexOf(dayData.name);
            if (dayIndex === -1) return; // Día no encontrado

            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            if (!daySection) return;

            dayData.dishes.forEach(dish => {
                const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${dish.category}"]`);
                if (dishesContainer) {
                    // Quitar el input vacío si existe y es el único
                    const existingInputs = dishesContainer.querySelectorAll('.dish-input-group');
                    if (existingInputs.length === 1 && !existingInputs[0].querySelector('.dish-input').value) {
                        existingInputs[0].remove();
                    }

                    const dayNameNormalized = dayData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const newDishGroup = createDishInputGroup(dayNameNormalized, dish.category, dishesContainer.children.length);
                    newDishGroup.querySelector('.dish-input').value = dish.name;
                    // Llenar otros campos del platillo si existen (descripción, precio)
                    dishesContainer.appendChild(newDishGroup);
                }
            });
        });
    }
    
    document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
    AppUtils.showNotification('Menú cargado para edición.');
}


/**
 * Elimina un menú
 * @param {string} menuId - ID del menú a eliminar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
 */
async function deleteMenu(menuId) {
    if (!confirm('¿Está seguro de que desea eliminar este menú? Esta acción no se puede deshacer.')) {
        return false;
    }
    
    try {
        const success = await FirebaseMenuModel.delete(menuId);
        
        if (success) {
            AppUtils.showNotification('Menú eliminado correctamente.', 'success');
            await loadSavedMenus().catch(error => console.error('Error loading menus after delete:', error));
            
            if (currentEditingMenuId === menuId) {
                resetForm();
            }
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

/**
 * Resetea el formulario
 */
function resetForm() {
    currentEditingMenuId = null;
    document.getElementById('menu-form').reset();
    const today = new Date();
    document.getElementById('week-start-date').value = AppUtils.formatDateForInput(today);
    generateWeekDays(AppUtils.formatDateForInput(today));
}

/**
 * Gestión de coordinadores
 */
const CoordinatorManagement = {
    currentEditingCoordinatorId: null,
    
    init: function() {
        const coordinatorForm = document.getElementById('coordinator-form');
        const resetFormBtn = document.getElementById('reset-coordinator-form-btn');
        
        coordinatorForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.saveCoordinator();
        });
        
        resetFormBtn.addEventListener('click', () => this.resetForm());
        
        document.getElementById('copy-access-code-btn').addEventListener('click', () => this.copyAccessCode());
        document.getElementById('regenerate-access-code-btn').addEventListener('click', () => this.regenerateAccessCode());
        
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
            AppUtils.showNotification('Por favor, complete todos los campos requeridos (*).', 'error');
            return false;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            AppUtils.showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
            return false;
        }
        
        let accessCode = document.getElementById('coordinator-access-code').value;
        if (!accessCode || (this.currentEditingCoordinatorId && !document.getElementById('access-code-container').style.display !== 'none' ) ) {
            accessCode = this.generateAccessCode(); // Generar si no hay o si no se está editando y mostrando
        }


        const coordinatorData = {
            name, email, phone, department, accessCode,
            active: true, 
            // createdAt y updatedAt serán manejados por FirebaseCoordinatorModel
        };

        // Si es una edición, pasar el ID
        if (this.currentEditingCoordinatorId) {
            coordinatorData.id = this.currentEditingCoordinatorId;
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
                // Para agregar, el modelo Firebase se encarga del ID si no se provee uno específico
                // o puedes generarlo aquí si es necesario antes de enviar al modelo.
                // FirebaseCoordinatorModel.add se encarga de los timestamps.
                success = await FirebaseCoordinatorModel.add(coordinatorData);
            }
            
            if (success) {
                AppUtils.showNotification(this.currentEditingCoordinatorId ? 'Coordinador actualizado.' : 'Coordinador agregado.', 'success');
                this.loadCoordinators();
                this.resetForm();
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
        list.innerHTML = ''; // Limpiar lista
        
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
                row.insertCell().textContent = coord.email; // Email antes de Depto
                row.insertCell().textContent = coord.department;
                
                const codeCell = row.insertCell();
                const codeSpan = document.createElement('span');
                codeSpan.className = 'access-code-display-table'; // Estilo para que parezca clickeable
                codeSpan.textContent = '******'; // Enmascarado por defecto
                codeSpan.title = 'Click para revelar/ocultar código';
                let revealed = false;
                codeSpan.addEventListener('click', () => {
                    revealed = !revealed;
                    codeSpan.textContent = revealed ? coord.accessCode : '******';
                });
                codeCell.appendChild(codeSpan);

                const actionsCell = row.insertCell();
                const editBtn = document.createElement('button');
                editBtn.className = 'secondary-btn icon-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = 'Editar coordinador';
                editBtn.onclick = () => this.editCoordinator(coord.id);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'danger-btn icon-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.title = 'Eliminar coordinador';
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
            AppUtils.showNotification('No se encontró el coordinador.', 'error');
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
                if (this.currentEditingCoordinatorId === coordinatorId) this.resetForm();
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
        codeInput.select();
        document.execCommand('copy');
        AppUtils.showNotification('Código copiado.', 'success');
    },
    
    regenerateAccessCode: function() {
        const newCode = this.generateAccessCode();
        document.getElementById('coordinator-access-code').value = newCode;
        AppUtils.showNotification('Nuevo código generado. Guarde los cambios para aplicarlo.', 'info');
    },
    
    resetForm: function() {
        this.currentEditingCoordinatorId = null;
        document.getElementById('coordinator-form').reset();
        document.getElementById('access-code-container').style.display = 'none';
        document.getElementById('save-coordinator-btn').innerHTML = '<i class="fas fa-save"></i> Agregar Coordinador';
    }
};

/**
 * Gestión de reportes de confirmaciones
 */
const ConfirmationReportManagement = {
    currentWeekStartDate: null,
    daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    
    init: function() {
        this.weekSelector = document.getElementById('week-selector');
        this.prevWeekBtn = document.getElementById('prev-week-btn');
        this.nextWeekBtn = document.getElementById('next-week-btn');
        this.daysHeader = document.getElementById('days-header');
        this.confirmationsBody = document.getElementById('confirmations-body');
        this.totalsFooter = document.getElementById('totals-footer');
        
        this.setCurrentWeek(this.getMonday(new Date()));
        this.setupEventListeners();
        this.loadConfirmationData().catch(error => console.error('Error loading initial report data:', error));
    },
    
    setupEventListeners: function() {
        this.weekSelector.addEventListener('change', () => {
            this.setCurrentWeek(this.getMonday(new Date(this.weekSelector.value + 'T00:00:00')));
            this.loadConfirmationData();
        });
        this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-7));
        this.nextWeekBtn.addEventListener('click', () => this.changeWeek(7));
    },

    changeWeek: function(dayOffset) {
        const newDate = new Date(this.currentWeekStartDate);
        newDate.setDate(newDate.getDate() + dayOffset);
        this.setCurrentWeek(this.getMonday(newDate));
        this.loadConfirmationData();
    },
    
    setCurrentWeek: function(monday) {
        this.currentWeekStartDate = monday;
        this.weekSelector.value = AppUtils.formatDateForInput(monday);
        this.updateDaysHeader();
    },
    
    getMonday: function(d) {
        d = new Date(d);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    },
    
    formatDateForDisplay: function(date) {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    },
    
    updateDaysHeader: function() {
        // Clear existing day headers (children[0] is 'Departamento', last is 'Total')
        while (this.daysHeader.children.length > 2) {
            this.daysHeader.removeChild(this.daysHeader.children[1]);
        }
        
        for (let i = 0; i < 7; i++) { // Lunes a Domingo
            const dayDate = new Date(this.currentWeekStartDate);
            dayDate.setDate(dayDate.getDate() + i);
            const th = document.createElement('th');
            th.innerHTML = `${this.daysOfWeek[i]}<br><small>${this.formatDateForDisplay(dayDate)}</small>`;
            // Insert before the 'Total' header
            this.daysHeader.insertBefore(th, this.daysHeader.lastElementChild);
        }
    },
    
    loadConfirmationData: async function() {
        if (!this.confirmationsBody) return;
        this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state"><span class="spinner"></span> Cargando reportes...</td></tr>`;

        try {
            const coordinators = await FirebaseCoordinatorModel.getAll();
            const allConfirmations = await FirebaseAttendanceModel.getAll();
            
            const weekStartStr = AppUtils.formatDateForInput(this.currentWeekStartDate);
            
            const departmentData = {};
            coordinators.forEach(coord => {
                if (!departmentData[coord.department]) {
                    departmentData[coord.department] = {
                        name: coord.department,
                        days: Array(7).fill(0), // Lunes a Domingo
                        total: 0,
                        pendingDays: Array(7).fill(true) // Asumir todos los días pendientes inicialmente
                    };
                }
            });

            allConfirmations.forEach(conf => {
                // Asegurarse que weekStartDate de la confirmación es un string YYYY-MM-DD para comparar
                let confWeekStartStr = conf.weekStartDate;
                if (conf.weekStartDate && typeof conf.weekStartDate.toDate === 'function') { // Es un Timestamp de Firebase
                    confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate.toDate());
                } else if (conf.weekStartDate instanceof Date) {
                     confWeekStartStr = AppUtils.formatDateForInput(conf.weekStartDate);
                }
                // Si ya es un string YYYY-MM-DD, se usa directamente


                if (confWeekStartStr === weekStartStr) {
                    const coordinator = coordinators.find(c => c.id === conf.coordinatorId);
                    if (coordinator && departmentData[coordinator.department]) {
                        const dept = departmentData[coordinator.department];
                        //DAYS_OF_WEEK = ['Lunes', 'Martes', ...]
                        //conf.attendanceCounts = { lunes: 10, martes: 5, ... } (o day_0, day_1)
                        this.daysOfWeek.forEach((dayName, index) => {
                            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // ej: 'lunes'
                            const count = conf.attendanceCounts[dayId] || 0;
                            if (count > 0 || (conf.attendanceCounts.hasOwnProperty(dayId) && conf.attendanceCounts[dayId] !== undefined) ) { // Si hay cuenta o se registró explícitamente (incluso 0)
                                dept.days[index] += count;
                                dept.total += count;
                                dept.pendingDays[index] = false; // Este día tiene datos
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
             this.confirmationsBody.innerHTML = `<tr><td colspan="${this.daysOfWeek.length + 2}" class="empty-state">No hay coordinadores registrados para mostrar reportes.</td></tr>`;
             this.updateTotalsFooter(dayTotals, grandTotal);
             return;
        }

        sortedDepartments.forEach(deptName => {
            const data = departmentData[deptName];
            const row = this.confirmationsBody.insertRow();
            row.insertCell().textContent = data.name;
            
            for (let i = 0; i < 7; i++) {
                const cell = row.insertCell();
                cell.textContent = data.pendingDays[i] ? '-' : data.days[i];
                cell.className = data.pendingDays[i] ? 'pending' : (data.days[i] > 0 ? 'confirmed' : '');
                dayTotals[i] += data.days[i];
            }
            
            const totalCell = row.insertCell();
            totalCell.textContent = data.total;
            totalCell.className = 'report-total-dept';
            grandTotal += data.total;
        });
        this.updateTotalsFooter(dayTotals, grandTotal);
    },
    
    updateTotalsFooter: function(dayTotals, grandTotal) {
        this.totalsFooter.innerHTML = ''; // Limpiar
        const firstCell = this.totalsFooter.insertCell();
        firstCell.textContent = 'Total por Día';
        firstCell.colSpan = 1; // 'Departamento'
        
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
 * Gestión de respaldo de datos (exportación e importación)
 */
const DataBackupManagement = {
    exportBtn: null,
    importBtn: null,
    fileInput: null,
    selectedFileName: null,
    importActions: null,
    confirmImportBtn: null,
    cancelImportBtn: null,
    selectedFile: null,
    
    init: function() {
        this.exportBtn = document.getElementById('export-data-btn');
        this.importBtn = document.getElementById('import-data-btn');
        this.fileInput = document.getElementById('import-file-input');
        this.selectedFileName = document.getElementById('selected-file-name');
        this.importActions = document.querySelector('.import-actions');
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.cancelImportBtn = document.getElementById('cancel-import-btn');
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        this.exportBtn.addEventListener('click', () => {
            AppUtils.showNotification('Funcionalidad de exportación no implementada para Firebase.', 'warning');
            // this.exportData(); // COMENTADO - Lógica incorrecta para Firebase
        });
        
        this.importBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (event) => {
            AppUtils.showNotification('Funcionalidad de importación no implementada para Firebase.', 'warning');
            this.cancelImport(); // Para resetear la UI
            // if (event.target.files.length > 0) { // COMENTADO
            //     this.handleFileSelection(event.target.files[0]);
            // }
        });
        
        this.confirmImportBtn.addEventListener('click', () => {
            AppUtils.showNotification('Funcionalidad de importación no implementada para Firebase.', 'warning');
            this.resetImportUI();
            // this.importData(); // COMENTADO
        });
        
        this.cancelImportBtn.addEventListener('click', () => this.cancelImport());
    },
    
    exportData: function() { /* ... (Lógica original de StorageUtil.downloadData) ... */ },
    handleFileSelection: function(file) { /* ... */ },
    importData: function() { /* ... (Lógica original de StorageUtil.importFromFile) ... */ },
    cancelImport: function() { this.resetImportUI(); },
    resetImportUI: function() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.selectedFileName.textContent = '';
        this.importActions.style.display = 'none';
        this.confirmImportBtn.disabled = false;
        this.cancelImportBtn.disabled = false;
        this.confirmImportBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Importación';
    }
};