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
    loadSavedMenus();
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
    const formattedDate = formatDateForInput(today);
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

/**
 * Formatea una fecha para usarla en un input de tipo date
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Genera las secciones para los días de la semana
 * @param {string} startDateStr - Fecha de inicio en formato YYYY-MM-DD
 */
function generateWeekDays(startDateStr) {
    try {
        // Convertir la fecha de inicio a objeto Date
        const startDate = new Date(startDateStr);
        
        // Limpiar el contenedor de días
        const daysContainer = document.getElementById('days-container');
        if (!daysContainer) {
            console.error('No se encontró el contenedor de días');
            return;
        }
        
        // Guardar referencia al primer día si existe
        const firstDay = daysContainer.querySelector('.day-section[data-day="0"]');
        
        // Limpiar el contenedor
        daysContainer.innerHTML = '';
        
        // Añadir el primer día de vuelta si existía
        if (firstDay) {
            daysContainer.appendChild(firstDay);
            // Actualizar la fecha del primer día
            updateDayDate(firstDay, startDate);
        } else {
            // Si no existía, crear el primer día (Lunes)
            const mondaySection = createDaySection(0, DAYS_OF_WEEK[0], startDate);
            daysContainer.appendChild(mondaySection);
        }
        
        // Generar los demás días de la semana
        for (let i = 1; i < 7; i++) {
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + i);
            
            const daySection = createDaySection(i, DAYS_OF_WEEK[i], nextDate);
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
    dayDate.textContent = formatDate(date);
    daySection.setAttribute('data-date', formatDateForInput(date));
}

/**
 * Formatea una fecha para mostrarla al usuario
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

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
    daySection.setAttribute('data-date', formatDateForInput(date));
    
    const dayLabel = document.createElement('h4');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayName;
    
    const dayDate = document.createElement('div');
    dayDate.className = 'day-date';
    dayDate.textContent = formatDate(date);
    
    daySection.appendChild(dayLabel);
    daySection.appendChild(dayDate);
    
    // Crear secciones para cada categoría
    Object.entries(CATEGORIES).forEach(([categoryKey, categoryName]) => {
        const categorySection = createCategorySection(dayIndex, dayName.toLowerCase(), categoryKey, categoryName);
        daySection.appendChild(categorySection);
    });
    
    return daySection;
}

/**
 * Crea una sección para una categoría de platillos
 * @param {number} dayIndex - Índice del día (0-6)
 * @param {string} dayName - Nombre del día en minúsculas
 * @param {string} categoryKey - Clave de la categoría
 * @param {string} categoryName - Nombre de la categoría
 * @returns {HTMLElement} - Elemento de sección de categoría
 */
function createCategorySection(dayIndex, dayName, categoryKey, categoryName) {
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('h5');
    categoryTitle.textContent = categoryName;
    
    const dishesContainer = document.createElement('div');
    dishesContainer.className = 'dishes-container';
    dishesContainer.setAttribute('data-category', categoryKey);
    
    // Crear el primer grupo de entrada de platillo
    const dishInputGroup = createDishInputGroup(dayName, categoryKey, 0);
    dishesContainer.appendChild(dishInputGroup);
    
    const addDishBtn = document.createElement('button');
    addDishBtn.type = 'button';
    addDishBtn.className = 'add-dish-btn';
    addDishBtn.setAttribute('data-day', dayIndex);
    addDishBtn.setAttribute('data-category', categoryKey);
    addDishBtn.textContent = `+ Agregar ${categoryName.slice(0, -1)}`;
    
    categorySection.appendChild(categoryTitle);
    categorySection.appendChild(dishesContainer);
    categorySection.appendChild(addDishBtn);
    
    return categorySection;
}

/**
 * Crea un grupo de entrada para un platillo
 * @param {string} dayName - Nombre del día en minúsculas
 * @param {string} categoryKey - Clave de la categoría
 * @param {number} index - Índice del platillo
 * @returns {HTMLElement} - Elemento de grupo de entrada
 */
function createDishInputGroup(dayName, categoryKey, index) {
    const dishInputGroup = document.createElement('div');
    dishInputGroup.className = 'dish-input-group';
    
    const dishInput = document.createElement('input');
    dishInput.type = 'text';
    dishInput.className = 'dish-input';
    dishInput.name = `dish-${dayName}-${categoryKey}-${index}`;
    dishInput.placeholder = 'Nombre del platillo';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn';
    removeBtn.textContent = '-';
    removeBtn.addEventListener('click', function() {
        const parent = dishInputGroup.parentNode;
        parent.removeChild(dishInputGroup);
        
        // Si no quedan platillos, agregar uno vacío
        if (parent.children.length === 0) {
            const newDishInputGroup = createDishInputGroup(dayName, categoryKey, 0);
            parent.appendChild(newDishInputGroup);
        }
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
        // Eliminar eventos anteriores para evitar duplicados
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
            const dayIndex = this.getAttribute('data-day');
            const categoryKey = this.getAttribute('data-category');
            const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
            const dayName = daySection.querySelector('.day-label').textContent.toLowerCase();
            const dishesContainer = this.previousElementSibling;
            
            // Crear nuevo grupo de entrada
            const index = dishesContainer.children.length;
            const dishInputGroup = createDishInputGroup(dayName, categoryKey, index);
            dishesContainer.appendChild(dishInputGroup);
        });
    });
}

/**
 * Guarda el menú actual en el almacenamiento
 */
async function saveMenu() {
    try {
        // Recopilar datos del formulario
        const menuName = document.getElementById('menu-name').value;
        const weekStartDate = document.getElementById('week-start-date').value;
        
        // Validar datos básicos
        if (!menuName || !weekStartDate) {
            showNotification('Por favor, complete el nombre del menú y la fecha de inicio.', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        const saveButton = document.getElementById('save-menu-btn');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        // Crear estructura de datos del menú
        const menuData = {
            id: currentEditingMenuId || 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: menuName,
            items: [],
            startDate: weekStartDate,
            endDate: calculateEndDate(weekStartDate),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Organizar los días y platillos
        const days = [];
        const daySections = document.querySelectorAll('.day-section');
        
        daySections.forEach(daySection => {
            const dayIndex = parseInt(daySection.getAttribute('data-day'));
            const dayDate = daySection.getAttribute('data-date');
            const dayName = DAYS_OF_WEEK[dayIndex];
            
            // Crear objeto para el día
            const day = {
                id: dayName.toLowerCase(),
                name: dayName,
                date: dayDate,
                dishes: []
            };
            
            // Recopilar platillos por categoría
            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                if (!dishesContainer) return;
                
                const dishGroups = dishesContainer.querySelectorAll('.dish-input-group');
                
                dishGroups.forEach(dishGroup => {
                    const dishName = dishGroup.querySelector('.dish-input').value;
                    
                    // Solo agregar platillos con nombre
                    if (dishName.trim()) {
                        day.dishes.push({
                            id: 'dish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            name: dishName,
                            category: categoryKey
                        });
                    }
                });
            });
            
            // Solo agregar días con platillos
            if (day.dishes.length > 0) {
                days.push(day);
            }
        });
        
        // Validar que haya al menos un día con platillos
        if (days.length === 0) {
            showNotification('Por favor, agregue al menos un platillo al menú.', 'error');
            return;
        }
        
        // Agregar días al menú
        menuData.days = days;
        
        // Guardar menú en almacenamiento
        let success = false;
        
        if (currentEditingMenuId) {
            // Actualizar menú existente
            success = await StorageUtil.Menus.update(currentEditingMenuId, menuData);
            if (success) {
                showNotification('Menú actualizado correctamente.');
                console.log('Menú actualizado:', menuData);
            } else {
                showNotification('Error al actualizar el menú.', 'error');
            }
        } else {
            // Crear nuevo menú
            success = await StorageUtil.Menus.add(menuData);
            if (success) {
                showNotification('Menú guardado correctamente.');
                console.log('Menú guardado:', menuData);
            } else {
                showNotification('Error al guardar el menú.', 'error');
            }
        }
        
        // Recargar menús guardados y resetear formulario
        if (success) {
            await loadSavedMenus();
            resetForm();
        }
    } catch (error) {
        console.error('Error al guardar menú:', error);
        showNotification('Error al guardar el menú: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        const saveButton = document.getElementById('save-menu-btn');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Menú';
        }
    }
}

/**
 * Calcula la fecha de fin basada en la fecha de inicio
 * @param {string} startDateStr - Fecha de inicio en formato YYYY-MM-DD
 * @returns {string} - Fecha de fin en formato YYYY-MM-DD (5 días después)
 */
function calculateEndDate(startDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // 5 días en total (lunes a viernes)
    return endDate.toISOString().split('T')[0];
}

/**
 * Carga los menús guardados y los muestra en la interfaz
 */
async function loadSavedMenus() {
    const savedMenusContainer = document.getElementById('saved-menus-container');
    
    try {
        // Mostrar indicador de carga
        savedMenusContainer.innerHTML = '<p class="loading-state">Cargando menús...</p>';
        
        // Obtener menús del almacenamiento (ahora es asíncrono con Firebase)
        const menus = await StorageUtil.Menus.getAll();
        console.log('Menús cargados:', menus);
        
        // Limpiar contenedor
        savedMenusContainer.innerHTML = '';
        
        if (!menus || menus.length === 0) {
            // Mostrar mensaje si no hay menús
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No hay menús guardados aún.';
            savedMenusContainer.appendChild(emptyState);
            return;
        }
        
        // Verificar que menus sea un array
        if (!Array.isArray(menus)) {
            console.error('Error: menus no es un array', menus);
            savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar los menús. Por favor, recargue la página.</p>';
            return;
        }
        
        // Ordenar menús por fecha (más reciente primero)
        // Usar slice() para crear una copia del array antes de ordenarlo
        const sortedMenus = menus.slice().sort((a, b) => {
            return new Date(b.startDate) - new Date(a.startDate);
        });
        
        // Crear elementos para cada menú
        sortedMenus.forEach(menu => {
            const menuItem = createMenuItemElement(menu);
            savedMenusContainer.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error al cargar menús:', error);
        savedMenusContainer.innerHTML = '<p class="error-state">Error al cargar los menús: ' + error.message + '</p>';
    }
}

/**
 * Crea un elemento para mostrar un menú guardado
 * @param {Object} menu - Objeto de menú
 * @returns {HTMLElement} - Elemento de menú
 */
function createMenuItemElement(menu) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.setAttribute('data-id', menu.id);
    
    // Crear encabezado del menú
    const menuHeader = document.createElement('div');
    menuHeader.className = 'menu-header';
    
    const menuInfo = document.createElement('div');
    menuInfo.className = 'menu-info';
    
    const menuTitle = document.createElement('h4');
    menuTitle.className = 'menu-title';
    menuTitle.textContent = menu.name;
    
    const menuDate = document.createElement('div');
    menuDate.className = 'menu-date';
    menuDate.textContent = new Date(menu.startDate).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    menuInfo.appendChild(menuTitle);
    menuInfo.appendChild(menuDate);
    
    const menuActions = document.createElement('div');
    menuActions.className = 'menu-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-menu-btn';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        editMenu(menu.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-menu-btn';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        deleteMenu(menu.id);
    });
    
    menuActions.appendChild(editBtn);
    menuActions.appendChild(deleteBtn);
    
    menuHeader.appendChild(menuInfo);
    menuHeader.appendChild(menuActions);
    
    // Crear contenido del menú (inicialmente oculto)
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    
    // Agrupar platillos por día
    const itemsByDay = {};
    menu.days.forEach(day => {
        itemsByDay[day.id] = day.dishes;
    });
    
    // Crear secciones para cada día
    Object.keys(itemsByDay).sort((a, b) => a.localeCompare(b)).forEach(dayId => {
        const dayItems = itemsByDay[dayId];
        if (dayItems.length === 0) return;
        
        const daySection = document.createElement('div');
        daySection.className = 'menu-day';
        
        const dayTitle = document.createElement('h5');
        dayTitle.className = 'menu-day-title';
        dayTitle.textContent = dayId.charAt(0).toUpperCase() + dayId.slice(1) + ' - ' + new Date(menu.startDate).toLocaleDateString('es-ES');
        
        daySection.appendChild(dayTitle);
        
        // Agrupar platillos por categoría
        const itemsByCategory = {};
        dayItems.forEach(item => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = [];
            }
            itemsByCategory[item.category].push(item);
        });
        
        // Crear secciones para cada categoría
        Object.keys(itemsByCategory).forEach(categoryKey => {
            const categoryItems = itemsByCategory[categoryKey];
            if (categoryItems.length === 0) return;
            
            const categorySection = document.createElement('div');
            categorySection.className = 'menu-category';
            
            const categoryTitle = document.createElement('h6');
            categoryTitle.className = 'menu-category-title';
            categoryTitle.textContent = CATEGORIES[categoryKey];
            
            const dishesList = document.createElement('div');
            dishesList.className = 'menu-dishes';
            
            // Crear elementos para cada platillo
            categoryItems.forEach(item => {
                const dishElement = document.createElement('div');
                dishElement.className = 'menu-dish';
                
                const dishName = document.createElement('span');
                dishName.className = 'menu-dish-name';
                dishName.textContent = item.name;
                
                dishElement.appendChild(dishName);
                dishesList.appendChild(dishElement);
            });
            
            categorySection.appendChild(categoryTitle);
            categorySection.appendChild(dishesList);
            daySection.appendChild(categorySection);
        });
        
        menuContent.appendChild(daySection);
    });
    
    // Configurar evento para mostrar/ocultar contenido
    menuHeader.addEventListener('click', function() {
        menuContent.classList.toggle('active');
    });
    
    menuItem.appendChild(menuHeader);
    menuItem.appendChild(menuContent);
    
    return menuItem;
}

/**
 * Edita un menú existente
 * @param {string} menuId - ID del menú a editar
 */
async function editMenu(menuId) {
    try {
        // Mostrar indicador de carga
        showNotification('Cargando menú...', 'info');
        
        // Obtener menú del almacenamiento
        const menu = await StorageUtil.Menus.get(menuId);
        if (!menu) {
            showNotification('No se encontró el menú.', 'error');
            return;
        }
        
        // Guardar ID del menú que se está editando
        currentEditingMenuId = menuId;
        
        // Llenar formulario con datos del menú
        document.getElementById('menu-name').value = menu.name;
        document.getElementById('week-start-date').value = menu.startDate;
        
        // Generar días de la semana
        generateWeekDays(menu.startDate);
        
        // Llenar campos de platillos
        menu.days.forEach(day => {
            const daySection = document.querySelector(`.day-section[data-day="${DAYS_OF_WEEK.indexOf(day.name)}"]`);
            if (!daySection) return;
            
            // Recopilar platillos por categoría
            Object.keys(CATEGORIES).forEach(categoryKey => {
                const dishesContainer = daySection.querySelector(`.dishes-container[data-category="${categoryKey}"]`);
                if (!dishesContainer) return;
                
                // Buscar un campo vacío o crear uno nuevo
                let emptyInputGroup = null;
                const inputGroups = dishesContainer.querySelectorAll('.dish-input-group');
                
                for (let i = 0; i < inputGroups.length; i++) {
                    const nameInput = inputGroups[i].querySelector('.dish-input');
                    if (!nameInput.value) {
                        emptyInputGroup = inputGroups[i];
                        break;
                    }
                }
                
                if (!emptyInputGroup) {
                    // No hay campos vacíos, crear uno nuevo
                    const dayName = DAYS_OF_WEEK[DAYS_OF_WEEK.indexOf(day.name)].toLowerCase();
                    const index = inputGroups.length;
                    emptyInputGroup = createDishInputGroup(dayName, categoryKey, index);
                    dishesContainer.appendChild(emptyInputGroup);
                }
                
                // Llenar campos
                day.dishes.forEach(dish => {
                    if (dish.category === categoryKey) {
                        emptyInputGroup.querySelector('.dish-input').value = dish.name;
                        
                        // Crear un nuevo campo vacío
                        const dayName = DAYS_OF_WEEK[DAYS_OF_WEEK.indexOf(day.name)].toLowerCase();
                        const index = inputGroups.length;
                        emptyInputGroup = createDishInputGroup(dayName, categoryKey, index);
                        dishesContainer.appendChild(emptyInputGroup);
                    }
                });
            });
        });
        
        // Desplazarse al formulario
        document.getElementById('menu-form').scrollIntoView({ behavior: 'smooth' });
        
        showNotification('Menú cargado para edición.');
    } catch (error) {
        console.error('Error al cargar menú para edición:', error);
        showNotification('Error al cargar menú: ' + error.message, 'error');
    }
}

/**
 * Elimina un menú
 * @param {string} menuId - ID del menú a eliminar
 */
async function deleteMenu(menuId) {
    try {
        // Confirmar eliminación
        if (!confirm('¿Está seguro de que desea eliminar este menú? Esta acción no se puede deshacer.')) {
            return;
        }
        
        // Mostrar indicador de carga
        showNotification('Eliminando menú...', 'info');
        
        // Eliminar menú del almacenamiento
        const success = await StorageUtil.Menus.delete(menuId);
        
        if (success) {
            showNotification('Menú eliminado correctamente.');
            await loadSavedMenus();
            
            // Si estamos editando este menú, resetear el formulario
            if (currentEditingMenuId === menuId) {
                resetForm();
            }
        } else {
            showNotification('Error al eliminar el menú.', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar menú:', error);
        showNotification('Error al eliminar menú: ' + error.message, 'error');
    }
}

/**
 * Resetea el formulario
 */
function resetForm() {
    // Limpiar ID de menú en edición
    currentEditingMenuId = null;
    
    // Resetear campos del formulario
    document.getElementById('menu-form').reset();
    
    // Establecer fecha actual
    const today = new Date();
    document.getElementById('week-start-date').value = formatDateForInput(today);
    
    // Regenerar días de la semana
    generateWeekDays(formatDateForInput(today));
    
    // Limpiar todos los campos de platillos
    const dishInputs = document.querySelectorAll('.dish-input');
    
    dishInputs.forEach(input => input.value = '');
}

/**
 * Gestión de coordinadores
 */
const CoordinatorManagement = {
    currentEditingCoordinatorId: null,
    
    /**
     * Inicializa la gestión de coordinadores
     */
    init: function() {
        // Configurar formulario
        const coordinatorForm = document.getElementById('coordinator-form');
        const resetFormBtn = document.getElementById('reset-coordinator-form-btn');
        
        // Manejar envío del formulario
        coordinatorForm.addEventListener('submit', function(event) {
            event.preventDefault();
            CoordinatorManagement.saveCoordinator();
        });
        
        // Configurar botón para limpiar formulario
        resetFormBtn.addEventListener('click', function() {
            CoordinatorManagement.resetForm();
        });
        
        // Configurar botones para código de acceso
        const copyAccessCodeBtn = document.getElementById('copy-access-code-btn');
        const regenerateAccessCodeBtn = document.getElementById('regenerate-access-code-btn');
        
        copyAccessCodeBtn.addEventListener('click', function() {
            CoordinatorManagement.copyAccessCode();
        });
        
        regenerateAccessCodeBtn.addEventListener('click', function() {
            CoordinatorManagement.regenerateAccessCode();
        });
        
        // Cargar coordinadores existentes
        this.loadCoordinators();
    },
    
    /**
     * Genera un código de acceso aleatorio
     * @returns {string} - Código de acceso de 6 caracteres
     */
    generateAccessCode: function() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },
    
    saveCoordinator: async function() {
        // Recopilar datos del formulario
        const name = document.getElementById('coordinator-name').value.trim();
        const email = document.getElementById('coordinator-email').value.trim();
        const phone = document.getElementById('coordinator-phone').value.trim();
        const department = document.getElementById('coordinator-department').value;
        
        // Validar datos básicos
        if (!name || !email || !department) {
            showNotification('Por favor, complete todos los campos requeridos.', 'error');
            return;
        }
        
        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Por favor, ingrese un correo electrónico válido.', 'error');
            return;
        }
        
        let accessCode;
        
        // Si estamos editando, usar el código existente o generar uno nuevo
        if (this.currentEditingCoordinatorId) {
            accessCode = document.getElementById('coordinator-access-code').value;
            if (!accessCode) {
                accessCode = this.generateAccessCode();
            }
        } else {
            // Generar nuevo código de acceso
            accessCode = this.generateAccessCode();
        }
        
        // Crear objeto de coordinador directamente
        const coordinatorData = {
            id: this.currentEditingCoordinatorId || 'coord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            email: email,
            phone: phone,
            department: department,
            accessCode: accessCode,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            let success = false;
            
            if (this.currentEditingCoordinatorId) {
                // Actualizar coordinador existente
                success = await StorageUtil.Coordinators.update(this.currentEditingCoordinatorId, coordinatorData);
                if (success) {
                    showNotification('Coordinador actualizado correctamente.');
                } else {
                    showNotification('Error al actualizar el coordinador.', 'error');
                }
            } else {
                // Crear nuevo coordinador
                success = await StorageUtil.Coordinators.add(coordinatorData);
                if (success) {
                    showNotification('Coordinador guardado correctamente.');
                    console.log('Coordinador guardado:', coordinatorData);
                } else {
                    showNotification('Error al guardar el coordinador.', 'error');
                }
            }
            
            // Recargar coordinadores y resetear formulario
            if (success) {
                this.loadCoordinators();
                this.resetForm();
            }
        } catch (error) {
            console.error('Error al guardar coordinador:', error);
            showNotification('Error al guardar el coordinador: ' + error.message, 'error');
            
            // Restaurar botón
            this.exportBtn.disabled = false;
            this.exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
        }
    },
    
    /**
     * Edita un coordinador existente
     * @param {string} coordinatorId - ID del coordinador a editar
     */
    editCoordinator: async function(coordinatorId) {
        try {
            // Obtener el coordinador del almacenamiento
            const coordinator = await StorageUtil.Coordinators.get(coordinatorId);
            
            if (!coordinator) {
                showNotification('No se encontró el coordinador especificado.', 'error');
                return;
            }
            
            // Llenar el formulario con los datos del coordinador
            document.getElementById('coordinator-name').value = coordinator.name || '';
            document.getElementById('coordinator-email').value = coordinator.email || '';
            document.getElementById('coordinator-phone').value = coordinator.phone || '';
            document.getElementById('coordinator-department').value = coordinator.department || '';
            
            // Mostrar el contenedor de código de acceso
            const accessCodeContainer = document.getElementById('access-code-container');
            accessCodeContainer.style.display = 'block';
            
            // Establecer el código de acceso
            document.getElementById('coordinator-access-code').value = coordinator.accessCode || '';
            
            // Cambiar el texto del botón de guardar
            const saveButton = document.getElementById('save-coordinator-btn');
            saveButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Coordinador';
            
            // Guardar el ID del coordinador que se está editando
            this.currentEditingCoordinatorId = coordinatorId;
            
            // Desplazarse al formulario
            document.getElementById('coordinator-form').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error al editar coordinador:', error);
            showNotification('Error al cargar los datos del coordinador: ' + error.message, 'error');
        }
    },
    
    /**
     * Elimina un coordinador
     * @param {string} coordinatorId - ID del coordinador a eliminar
     */
    deleteCoordinator: async function(coordinatorId) {
        // Confirmar eliminación
        if (!confirm('¿Está seguro de que desea eliminar este coordinador? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            // Eliminar coordinador del almacenamiento
            const success = await StorageUtil.Coordinators.delete(coordinatorId);
            
            if (success) {
                showNotification('Coordinador eliminado correctamente.');
                // Recargar lista de coordinadores
                this.loadCoordinators();
            } else {
                showNotification('Error al eliminar el coordinador.', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar coordinador:', error);
            showNotification('Error al eliminar el coordinador: ' + error.message, 'error');
        }
    },
    
    /**
     * Copia el código de acceso al portapapeles
     */
    copyAccessCode: function() {
        const accessCodeInput = document.getElementById('coordinator-access-code');
        
        // Seleccionar el texto
        accessCodeInput.select();
        accessCodeInput.setSelectionRange(0, 99999); // Para dispositivos móviles
        
        // Copiar al portapapeles
        document.execCommand('copy');
        
        // Deseleccionar
        accessCodeInput.blur();
        
        showNotification('Código de acceso copiado al portapapeles.');
    },
    
    /**
     * Regenera el código de acceso
     */
    regenerateAccessCode: function() {
        const accessCodeInput = document.getElementById('coordinator-access-code');
        const newCode = this.generateAccessCode();
        accessCodeInput.value = newCode;
        
        // Si estamos editando un coordinador, actualizar su código de acceso
        if (this.currentEditingCoordinatorId) {
            const coordinator = StorageUtil.Coordinators.get(this.currentEditingCoordinatorId);
            if (coordinator) {
                coordinator.accessCode = newCode;
                StorageUtil.Coordinators.update(this.currentEditingCoordinatorId, coordinator);
                this.loadCoordinators();
                showNotification('Código de acceso regenerado correctamente.');
            }
        }
    },
    
    /**
     * Resetea el formulario
     */
    resetForm: function() {
        // Limpiar ID de coordinador en edición
        this.currentEditingCoordinatorId = null;
        
        // Resetear campos del formulario
        document.getElementById('coordinator-form').reset();
        
        // Ocultar contenedor de código de acceso
        document.getElementById('access-code-container').style.display = 'none';
        
        // Restaurar texto del botón de guardar
        document.getElementById('save-coordinator-btn').textContent = 'Agregar Coordinador';
    },
    
    /**
     * Carga los coordinadores guardados y los muestra en la interfaz
     */
    loadCoordinators: async function() {
        const coordinatorsList = document.getElementById('coordinators-list');
        const noCoordinatorsMessage = document.getElementById('no-coordinators-message');
        const coordinatorsTable = document.getElementById('coordinators-table');
        
        try {
            // Obtener coordinadores del almacenamiento (ahora es asíncrono con Firebase)
            const coordinators = await StorageUtil.Coordinators.getAll();
            console.log('Coordinadores cargados:', coordinators);
            
            // Limpiar lista
            coordinatorsList.innerHTML = '';
            
            if (!coordinators || coordinators.length === 0) {
                // Mostrar mensaje si no hay coordinadores
                noCoordinatorsMessage.style.display = 'block';
                coordinatorsTable.style.display = 'none';
                return;
            }
            
            // Ocultar mensaje y mostrar tabla
            noCoordinatorsMessage.style.display = 'none';
            coordinatorsTable.style.display = 'table';
            
            // Ordenar coordinadores por nombre
            coordinators.sort((a, b) => a.name.localeCompare(b.name));
            
            // Crear filas para cada coordinador
            coordinators.forEach(coordinator => {
                const row = document.createElement('tr');
                
                // Columna de nombre
                const nameCell = document.createElement('td');
                nameCell.textContent = coordinator.name;
                row.appendChild(nameCell);
                
                // Columna de email
                const emailCell = document.createElement('td');
                emailCell.textContent = coordinator.email;
                row.appendChild(emailCell);
                
                // Columna de departamento
                const departmentCell = document.createElement('td');
                departmentCell.textContent = coordinator.department;
                row.appendChild(departmentCell);
                
                // Columna de código de acceso
                const accessCodeCell = document.createElement('td');
                const maskedCode = this.getMaskedCode(coordinator.accessCode);
                
                const codeSpan = document.createElement('span');
                codeSpan.className = 'masked-code';
                codeSpan.textContent = maskedCode;
                codeSpan.title = 'Haga clic para mostrar/ocultar';
                codeSpan.style.cursor = 'pointer';
                
                // Alternar entre código enmascarado y completo al hacer clic
                codeSpan.addEventListener('click', function() {
                    if (codeSpan.textContent === maskedCode) {
                        codeSpan.textContent = coordinator.accessCode;
                    } else {
                        codeSpan.textContent = maskedCode;
                    }
                });
                
                accessCodeCell.appendChild(codeSpan);
                row.appendChild(accessCodeCell);
                
                // Columna de acciones
                const actionsCell = document.createElement('td');
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'action-buttons';
                
                // Botón de editar
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit-btn';
                editBtn.textContent = 'Editar';
                editBtn.addEventListener('click', function() {
                    CoordinatorManagement.editCoordinator(coordinator.id);
                });
                
                // Botón de eliminar
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn delete-btn';
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.addEventListener('click', function() {
                    CoordinatorManagement.deleteCoordinator(coordinator.id);
                });
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                actionsCell.appendChild(actionsDiv);
                row.appendChild(actionsCell);
                
                // Agregar fila a la tabla
                coordinatorsList.appendChild(row);
            });
        } catch (error) {
            console.error('Error al cargar coordinadores:', error);
            showNotification('Error al cargar los coordinadores: ' + error.message, 'error');
            
            // Mostrar mensaje de error
            noCoordinatorsMessage.textContent = 'Error al cargar coordinadores. Por favor, intente de nuevo.';
            noCoordinatorsMessage.style.display = 'block';
            coordinatorsTable.style.display = 'none';
        }
    },
    
    /**
     * Obtiene una versión enmascarada del código de acceso
     * @param {string} code - Código de acceso completo
     * @returns {string} - Código enmascarado (ej: AB****)
     */
    getMaskedCode: function(code) {
        if (!code || code.length < 2) return '******';
        return code.substring(0, 2) + '*'.repeat(code.length - 2);
    },
};

/**
 * Gestión de reportes de confirmaciones
 */
const ConfirmationReportManagement = {
    // Variables para el estado actual
    currentWeekStartDate: null,
    daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    
    /**
     * Inicializa la gestión de reportes de confirmaciones
     */
    init: function() {
        console.log('Inicializando gestión de reportes de confirmaciones');
        
        // Obtener referencias a elementos DOM
        this.weekSelector = document.getElementById('week-selector');
        this.prevWeekBtn = document.getElementById('prev-week-btn');
        this.nextWeekBtn = document.getElementById('next-week-btn');
        this.daysHeader = document.getElementById('days-header');
        this.confirmationsBody = document.getElementById('confirmations-body');
        this.totalsFooter = document.getElementById('totals-footer');
        
        // Establecer la fecha actual como valor predeterminado (ajustado al lunes de la semana)
        const today = new Date();
        this.setCurrentWeek(this.getMonday(today));
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Cargar datos iniciales
        this.loadConfirmationData();
    },
    
    /**
     * Configura los escuchadores de eventos
     */
    setupEventListeners: function() {
        // Evento para cambio de semana en el selector
        this.weekSelector.addEventListener('change', () => {
            const selectedDate = new Date(this.weekSelector.value);
            this.setCurrentWeek(this.getMonday(selectedDate));
            this.loadConfirmationData();
        });
        
        // Eventos para botones de navegación de semana
        this.prevWeekBtn.addEventListener('click', () => {
            const prevWeek = new Date(this.currentWeekStartDate);
            prevWeek.setDate(prevWeek.getDate() - 7);
            this.setCurrentWeek(prevWeek);
            this.loadConfirmationData();
        });
        
        this.nextWeekBtn.addEventListener('click', () => {
            const nextWeek = new Date(this.currentWeekStartDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            this.setCurrentWeek(nextWeek);
            this.loadConfirmationData();
        });
    },
    
    /**
     * Establece la semana actual y actualiza la interfaz
     * @param {Date} monday - Fecha del lunes de la semana
     */
    setCurrentWeek: function(monday) {
        this.currentWeekStartDate = monday;
        this.weekSelector.value = this.formatDateForInput(monday);
        this.updateDaysHeader();
    },
    
    /**
     * Obtiene la fecha del lunes de la semana para una fecha dada
     * @param {Date} date - Fecha de referencia
     * @returns {Date} - Fecha del lunes
     */
    getMonday: function(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que la semana comience el lunes
        const monday = new Date(date);
        monday.setDate(diff);
        return monday;
    },
    
    /**
     * Formatea una fecha para un input de tipo date
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (YYYY-MM-DD)
     */
    formatDateForInput: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Formatea una fecha para mostrarla al usuario
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada (DD/MM)
     */
    formatDateForDisplay: function(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    },
    
    /**
     * Actualiza el encabezado de días en la tabla
     */
    updateDaysHeader: function() {
        // Limpiar encabezados existentes excepto el primero y el último
        while (this.daysHeader.children.length > 2) {
            this.daysHeader.removeChild(this.daysHeader.children[1]);
        }
        
        // Generar encabezados para cada día de la semana
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(this.currentWeekStartDate);
            dayDate.setDate(dayDate.getDate() + i);
            
            const th = document.createElement('th');
            th.innerHTML = `${this.daysOfWeek[i]}<br>${this.formatDateForDisplay(dayDate)}`;
            th.dataset.dayIndex = i;
            
            // Insertar antes del último encabezado (Total)
            this.daysHeader.insertBefore(th, this.daysHeader.lastElementChild);
        }
    },
    
    /**
     * Carga los datos de confirmación para la semana actual
     */
    loadConfirmationData: function() {
        // Obtener todos los coordinadores
        const coordinators = StorageUtil.Coordinators.getAll();
        
        // Obtener todas las confirmaciones de asistencia
        const allConfirmations = StorageUtil.AttendanceConfirmations.getAll();
        
        // Filtrar confirmaciones para la semana actual
        const weekStartStr = this.formatDateForInput(this.currentWeekStartDate);
        const confirmationsForWeek = allConfirmations.filter(conf => {
            // Convertir la fecha de inicio de la semana a string para comparar
            const confWeekStart = new Date(conf.weekStartDate);
            const confWeekStartStr = this.formatDateForInput(confWeekStart);
            return confWeekStartStr === weekStartStr;
        });
        
        // Organizar datos por departamento y día
        const departmentData = this.organizeDepartmentData(coordinators, confirmationsForWeek);
        
        // Actualizar la tabla con los datos
        this.updateConfirmationsTable(departmentData);
    },
    
    /**
     * Organiza los datos de confirmaciones por departamento
     * @param {Array} coordinators - Lista de coordinadores
     * @param {Array} confirmations - Lista de confirmaciones para la semana actual
     * @returns {Object} - Datos organizados por departamento
     */
    organizeDepartmentData: function(coordinators, confirmations) {
        const departmentData = {};
        
        // Agrupar coordinadores por departamento
        coordinators.forEach(coordinator => {
            const department = coordinator.department;
            
            if (!departmentData[department]) {
                departmentData[department] = {
                    name: department,
                    coordinators: [],
                    days: Array(7).fill(0),
                    total: 0,
                    pending: Array(7).fill(true)
                };
            }
            
            departmentData[department].coordinators.push(coordinator);
            
            // Buscar confirmación para este coordinador
            const confirmation = confirmations.find(conf => conf.coordinatorId === coordinator.id);
            
            if (confirmation) {
                // Actualizar conteos por día
                for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                    const dayId = `day_${dayIndex}`;
                    const count = confirmation.attendanceCounts[dayId] || 0;
                    
                    departmentData[department].days[dayIndex] += count;
                    departmentData[department].total += count;
                    departmentData[department].pending[dayIndex] = false;
                }
            }
        });
        
        return departmentData;
    },
    
    /**
     * Actualiza la tabla de confirmaciones con los datos organizados
     * @param {Object} departmentData - Datos organizados por departamento
     */
    updateConfirmationsTable: function(departmentData) {
        // Limpiar tabla
        this.confirmationsBody.innerHTML = '';
        
        // Inicializar totales por día
        const dayTotals = Array(7).fill(0);
        let grandTotal = 0;
        
        // Crear filas para cada departamento
        for (const department in departmentData) {
            const data = departmentData[department];
            
            const row = document.createElement('tr');
            
            // Celda de departamento
            const departmentCell = document.createElement('td');
            departmentCell.textContent = data.name;
            row.appendChild(departmentCell);
            
            // Celdas para cada día
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const cell = document.createElement('td');
                const count = data.days[dayIndex];
                
                cell.textContent = count;
                cell.classList.add('confirmation-cell');
                
                // Agregar clase según estado (pendiente o confirmado)
                if (data.pending[dayIndex]) {
                    cell.classList.add('pending');
                    cell.textContent = 'Pendiente';
                } else {
                    cell.classList.add('confirmed');
                }
                
                row.appendChild(cell);
                
                // Actualizar total del día
                dayTotals[dayIndex] += count;
            }
            
            // Celda de total por departamento
            const totalCell = document.createElement('td');
            totalCell.textContent = data.total;
            totalCell.classList.add('department-total');
            row.appendChild(totalCell);
            
            // Actualizar total general
            grandTotal += data.total;
            
            // Agregar fila a la tabla
            this.confirmationsBody.appendChild(row);
        }
        
        // Actualizar fila de totales
        this.updateTotalsFooter(dayTotals, grandTotal);
        
        // Mostrar mensaje si no hay datos
        if (Object.keys(departmentData).length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 9; // 7 días + departamento + total
            emptyCell.textContent = 'No hay datos de confirmación para esta semana';
            emptyCell.classList.add('empty-state');
            emptyRow.appendChild(emptyCell);
            this.confirmationsBody.appendChild(emptyRow);
        }
    },
    
    /**
     * Actualiza la fila de totales en el pie de la tabla
     * @param {Array} dayTotals - Totales por día
     * @param {number} grandTotal - Total general
     */
    updateTotalsFooter: function(dayTotals, grandTotal) {
        // Limpiar totales existentes
        while (this.totalsFooter.children.length > 1) {
            this.totalsFooter.removeChild(this.totalsFooter.children[1]);
        }
        
        // Agregar celdas para cada día
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const cell = document.createElement('th');
            cell.textContent = dayTotals[dayIndex];
            this.totalsFooter.appendChild(cell);
        }
        
        // Agregar celda para el total general
        const grandTotalCell = document.createElement('th');
        grandTotalCell.textContent = grandTotal;
        this.totalsFooter.appendChild(grandTotalCell);
    }
};

/**
 * Gestión de respaldo de datos (exportación e importación)
 */
const DataBackupManagement = {
    // Referencias a elementos DOM
    exportBtn: null,
    importBtn: null,
    fileInput: null,
    selectedFileName: null,
    importActions: null,
    confirmImportBtn: null,
    cancelImportBtn: null,
    
    // Archivo seleccionado para importación
    selectedFile: null,
    
    /**
     * Inicializa la gestión de respaldo de datos
     */
    init: function() {
        console.log('Inicializando gestión de respaldo de datos');
        
        // Obtener referencias a elementos DOM
        this.exportBtn = document.getElementById('export-data-btn');
        this.importBtn = document.getElementById('import-data-btn');
        this.fileInput = document.getElementById('import-file-input');
        this.selectedFileName = document.getElementById('selected-file-name');
        this.importActions = document.querySelector('.import-actions');
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.cancelImportBtn = document.getElementById('cancel-import-btn');
        
        // Configurar eventos
        this.setupEventListeners();
    },
    
    /**
     * Configura los escuchadores de eventos
     */
    setupEventListeners: function() {
        // Evento para exportar datos
        this.exportBtn.addEventListener('click', () => {
            this.exportData();
        });
        
        // Evento para seleccionar archivo de importación
        this.importBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // Evento para cuando se selecciona un archivo
        this.fileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                this.handleFileSelection(event.target.files[0]);
            }
        });
        
        // Evento para confirmar importación
        this.confirmImportBtn.addEventListener('click', () => {
            this.importData();
        });
        
        // Evento para cancelar importación
        this.cancelImportBtn.addEventListener('click', () => {
            this.cancelImport();
        });
    },
    
    /**
     * Exporta todos los datos del sistema
     */
    exportData: function() {
        try {
            // Mostrar indicador de carga
            this.exportBtn.disabled = true;
            this.exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
            
            // Pequeño retraso para mostrar la animación
            setTimeout(() => {
                // Llamar a la función de exportación de StorageUtil
                const success = StorageUtil.downloadData();
                
                if (success) {
                    showNotification('Datos exportados correctamente', 'success');
                } else {
                    showNotification('Error al exportar datos', 'error');
                }
                
                // Restaurar botón
                this.exportBtn.disabled = false;
                this.exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
            }, 500);
        } catch (error) {
            console.error('Error al exportar datos:', error);
            showNotification('Error al exportar datos: ' + error.message, 'error');
            
            // Restaurar botón
            this.exportBtn.disabled = false;
            this.exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
        }
    },
    
    /**
     * Maneja la selección de un archivo para importación
     * @param {File} file - Archivo seleccionado
     */
    handleFileSelection: function(file) {
        // Validar que sea un archivo JSON
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showNotification('El archivo debe ser de tipo JSON', 'error');
            this.cancelImport();
            return;
        }
        
        // Guardar referencia al archivo
        this.selectedFile = file;
        
        // Mostrar nombre del archivo
        this.selectedFileName.textContent = file.name;
        
        // Mostrar acciones de importación
        this.importActions.style.display = 'flex';
    },
    
    /**
     * Importa los datos desde el archivo seleccionado
     */
    importData: function() {
        if (!this.selectedFile) {
            showNotification('No se ha seleccionado ningún archivo', 'error');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            this.confirmImportBtn.disabled = true;
            this.cancelImportBtn.disabled = true;
            this.confirmImportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
            
            // Importar datos
            StorageUtil.importFromFile(this.selectedFile)
                .then(success => {
                    if (success) {
                        showNotification('Datos importados correctamente', 'success');
                        
                        // Recargar la página para reflejar los cambios
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showNotification('Error al importar datos', 'error');
                        this.resetImportUI();
                    }
                })
                .catch(error => {
                    console.error('Error al importar datos:', error);
                    showNotification('Error al importar datos: ' + error.message, 'error');
                    this.resetImportUI();
                });
        } catch (error) {
            console.error('Error al importar datos:', error);
            showNotification('Error al importar datos: ' + error.message, 'error');
            this.resetImportUI();
        }
    },
    
    /**
     * Cancela la importación y resetea la interfaz
     */
    cancelImport: function() {
        this.resetImportUI();
    },
    
    /**
     * Resetea la interfaz de importación
     */
    resetImportUI: function() {
        // Limpiar archivo seleccionado
        this.selectedFile = null;
        this.fileInput.value = '';
        this.selectedFileName.textContent = '';
        
        // Ocultar acciones de importación
        this.importActions.style.display = 'none';
        
        // Resetear botones
        this.confirmImportBtn.disabled = false;
        this.cancelImportBtn.disabled = false;
        this.confirmImportBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Importación';
    }
};
