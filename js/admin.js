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
    'plato_fuerte': 'Platos Fuertes',
    'bebida': 'Bebidas'
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
    const closeModalBtn = document.getElementById('close-admin-login-modal');
    
    if (!adminLoginForm) {
        console.error("Formulario de login de admin no encontrado.");
        return;
    }
    
    // Configurar el botón de cierre del modal
    if (closeModalBtn) {
        // Eliminar listeners anteriores para evitar duplicados
        const newCloseBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
        
        // Agregar listener al nuevo botón
        newCloseBtn.addEventListener('click', function() {
            const adminLoginModal = document.getElementById('admin-login-modal');
            if (adminLoginModal) {
                adminLoginModal.style.display = 'none';
                // Redirigir al usuario a la página principal
                window.location.href = 'index.html';
            }
        });
    }

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
    console.log("Ejecutando initMenuForm...");
    const weekStartDateInput = document.getElementById('week-start-date');
    const menuForm = document.getElementById('menu-form');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const menuImageInput = document.getElementById('menu-image');
    const menuImagePreviewContainer = document.getElementById('menu-image-preview-container');
    const menuImagePreview = document.getElementById('menu-image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (!weekStartDateInput || !menuForm || !resetFormBtn) {
        console.error("Elementos del formulario de menú no encontrados.");
        return;
    }
    
    const today = new Date();
    const formattedDate = AppUtils.formatDateForInput(today);
    weekStartDateInput.value = formattedDate;
    
    // Listener para reset
    const newResetBtn = resetFormBtn.cloneNode(true);
    resetFormBtn.parentNode.replaceChild(newResetBtn, resetFormBtn);
    newResetBtn.addEventListener('click', resetMenuForm);
    
    // Configurar el formulario de menú
    const newMenuForm = menuForm.cloneNode(true);
    menuForm.parentNode.replaceChild(newMenuForm, menuForm);
    
    // Listener para submit
    newMenuForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveMenu();
    });
    
    // Configurar el botón de guardar (ahora es type="button")
    const saveMenuBtn = document.getElementById('save-menu-btn');
    if (saveMenuBtn) {
        // Reemplazar para evitar duplicar listeners
        const newSaveMenuBtn = saveMenuBtn.cloneNode(true);
        saveMenuBtn.parentNode.replaceChild(newSaveMenuBtn, saveMenuBtn);
        
        newSaveMenuBtn.addEventListener('click', function() {
            console.log('Botón de guardar presionado');
            saveMenu();
        });
    }

    // Configurar carga de imagen con el nuevo botón
    if (menuImageInput) {
        // Reemplazar para evitar duplicar listeners
        const newMenuImageInput = menuImageInput.cloneNode(true);
        menuImageInput.parentNode.replaceChild(newMenuImageInput, menuImageInput);
        
        // Configurar el botón de selección de imagen
        const selectImageBtn = document.getElementById('select-image-btn');
        const selectedFileName = document.getElementById('selected-file-name');
        
        if (selectImageBtn) {
            // Reemplazar para evitar duplicar listeners
            const newSelectImageBtn = selectImageBtn.cloneNode(true);
            selectImageBtn.parentNode.replaceChild(newSelectImageBtn, selectImageBtn);
            
            newSelectImageBtn.addEventListener('click', function() {
                newMenuImageInput.click(); // Simular clic en el input de archivo
            });
        }
        
        newMenuImageInput.addEventListener('change', function(e) {
            // Actualizar el nombre del archivo seleccionado
            if (selectedFileName && e.target.files && e.target.files.length > 0) {
                selectedFileName.textContent = e.target.files[0].name;
            }
            
            handleMenuImageUpload(e);
        });
    }
    
    // Configurar botón para eliminar imagen
    if (removeImageBtn) {
        const newRemoveImageBtn = removeImageBtn.cloneNode(true);
        removeImageBtn.parentNode.replaceChild(newRemoveImageBtn, removeImageBtn);
        
        newRemoveImageBtn.addEventListener('click', function() {
            removeMenuImage();
        });
    }
}

/**
 * Maneja la carga de una imagen para el menú
 */
function handleMenuImageUpload(event) {
    try {
        const file = event.target.files[0];
        if (!file) {
            console.log('No se seleccionó ningún archivo');
            return;
        }
        
        console.log('Archivo seleccionado:', file.name, 'Tipo:', file.type, 'Tamaño:', file.size);
        
        // Verificar la extensión del archivo directamente
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
        let isValidExtension = false;
        
        for (const ext of validExtensions) {
            if (fileName.endsWith(ext)) {
                isValidExtension = true;
                break;
            }
        }
        
        if (!isValidExtension) {
            AppUtils.showNotification('Por favor, selecciona un archivo de imagen válido (JPG, PNG, GIF, etc).', 'error');
            event.target.value = '';
            document.getElementById('selected-file-name').textContent = 'Ninguna imagen seleccionada';
            return;
        }
        
        // Verificar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if (file.size > maxSize) {
            AppUtils.showNotification('La imagen es demasiado grande. El tamaño máximo es 10MB.', 'error');
            event.target.value = '';
            document.getElementById('selected-file-name').textContent = 'Ninguna imagen seleccionada';
            return;
        }
        
        // Mostrar vista previa
        const reader = new FileReader();
        reader.onload = function(e) {
            // Crear o actualizar la vista previa
            let previewContainer = document.getElementById('menu-image-preview-container');
            let previewImage = document.getElementById('menu-image-preview');
            
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.id = 'menu-image-preview-container';
                previewContainer.className = 'menu-image-preview-container';
                document.querySelector('.menu-image-upload').appendChild(previewContainer);
            }
            
            if (!previewImage) {
                previewImage = document.createElement('img');
                previewImage.id = 'menu-image-preview';
                previewImage.className = 'menu-image-preview';
                previewContainer.appendChild(previewImage);
                
                // Agregar botón para eliminar la vista previa
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'remove-preview-btn';
                removeButton.innerHTML = '<i class="fas fa-trash"></i>';
                removeButton.addEventListener('click', function() {
                    previewContainer.style.display = 'none';
                    previewImage.src = '';
                    document.getElementById('menu-image').value = '';
                    document.getElementById('selected-file-name').textContent = 'Ninguna imagen seleccionada';
                });
                previewContainer.appendChild(removeButton);
            }
            
            // Asegurarse de que la vista previa sea visible
            previewContainer.style.display = 'block';
            previewImage.src = e.target.result;
            
            // Verificar que la imagen se cargó correctamente
            previewImage.onload = function() {
                console.log('Vista previa cargada correctamente, dimensiones:', previewImage.width, 'x', previewImage.height);
                // Guardar la URL de la imagen en un atributo de datos para facilitar el acceso
                previewImage.setAttribute('data-image-loaded', 'true');
            };
            
            previewImage.onerror = function() {
                console.log('Advertencia: Hubo un problema al cargar la vista previa, pero se intentará continuar con el proceso');
                // No mostrar notificación de error al usuario si la imagen se ve correctamente
                // Solo registrar en consola para depuración
            };
        };
        
        reader.onerror = function(error) {
            console.error('Error al leer el archivo:', error);
            AppUtils.showNotification('Error al procesar la imagen.', 'error');
            event.target.value = '';
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error al manejar la carga de imagen:', error);
        AppUtils.showNotification('Error al procesar la imagen.', 'error');
        if (event.target) event.target.value = '';
    }
}

/**
 * Elimina la imagen seleccionada para el menú
 */
function removeMenuImage() {
    const menuImageInput = document.getElementById('menu-image');
    const previewContainer = document.getElementById('menu-image-preview-container');
    const previewImage = document.getElementById('menu-image-preview');
    
    if (menuImageInput) {
        menuImageInput.value = '';
    }
    
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    if (previewImage) {
        previewImage.src = '';
    }
}

// ... (Aquí irían TODAS las demás funciones que ya tenías en admin.js:
//      generateWeekDays, createDaySection, createCategorySection, 
//      createDishInputGroup, setupAddDishButtons, saveMenu, 
//      calculateEndDateForMenu, loadSavedMenus, createMenuItemElement, 
//      editMenu, deleteMenu, resetMenuForm, 
//      CoordinatorManagement (objeto completo), 
//      ConfirmationReportManagement (objeto completo),
//      DataBackupManagement (objeto completo) 
//      ...)

// Asegúrate de que todas las funciones necesarias estén definidas en este archivo.
// He incluido las más relevantes para la inicialización y el login,
// pero necesitas el resto del código que tenías para la funcionalidad completa.

// --- INICIO DEL RESTO DEL CÓDIGO (COPIA Y PEGA EL TUYO AQUÍ) ---

// Ejemplo de cómo incluir una función existente:
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
        setupAddDishButtons(); 
    } catch (error) {
        console.error('Error al generar días de la semana:', error);
    }
}

function createDaySection(dayIndex, dayName, date) {
    const daySection = document.createElement('div');
    daySection.className = 'day-section card'; 
    daySection.setAttribute('data-day', dayIndex);
    daySection.setAttribute('data-date', AppUtils.formatDateForInput(date));
    
    const dayLabel = document.createElement('h4');
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayName;
    
    const dayDateDisplay = document.createElement('div');
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
    addDishBtn.className = 'add-dish-btn secondary-btn';
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
    dishInput.className = 'dish-input form-control';
    dishInput.name = `dish-${dayNameNormalized}-${categoryKey}-${index}`;
    dishInput.placeholder = 'Nombre del platillo/bebida';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-dish-btn danger-btn icon-btn'; 
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
    // Remover listeners antiguos antes de añadir nuevos es crucial si esta función se llama múltiples veces
    const oldButtons = document.querySelectorAll('.add-dish-btn');
    oldButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    // Añadir listeners a los botones clonados/nuevos
    document.querySelectorAll('.add-dish-btn').forEach(button => {
        button.addEventListener('click', function() {
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
    console.log('Iniciando proceso de guardado del menú');
    
    // Mostrar estado de guardado
    const saveStatus = document.getElementById('save-status');
    if (saveStatus) {
        saveStatus.className = 'save-status';
        saveStatus.textContent = 'Procesando...';
    }
    
    const menuName = document.getElementById('menu-name').value;
    const weekStartDate = document.getElementById('week-start-date').value;
    const menuImageInput = document.getElementById('menu-image');
    const menuImagePreview = document.getElementById('menu-image-preview');
    
    if (!menuName || !weekStartDate) {
        AppUtils.showNotification('Por favor, complete el nombre del menú y la fecha de inicio.', 'error');
        if (saveStatus) {
            saveStatus.className = 'save-status error';
            saveStatus.textContent = 'Error: Faltan datos requeridos';
        }
        return;
    }
    
    // Deshabilitar el botón de guardar durante el proceso
    const saveButton = document.getElementById('save-menu-btn');
    if (saveButton) {
        saveButton.disabled = true;
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Restaurar el botón después de 30 segundos por si algo falla
        setTimeout(() => {
            if (saveButton.disabled) {
                saveButton.disabled = false;
                saveButton.innerHTML = originalText;
                if (saveStatus) {
                    saveStatus.className = 'save-status error';
                    saveStatus.textContent = 'Error: Tiempo de espera agotado';
                }
                AppUtils.showNotification('El proceso de guardado está tardando demasiado. Por favor, intente nuevamente.', 'error');
            }
        }, 30000);
    }
    
    // Verificar si tenemos una imagen válida (ya sea en el input o en la vista previa)
    const previewContainer = document.getElementById('menu-image-preview-container');
    const hasPreview = previewContainer && previewContainer.style.display !== 'none' && 
                      menuImagePreview && menuImagePreview.src && 
                      menuImagePreview.src !== window.location.href;
    
    // Si no hay vista previa, verificamos si hay un archivo seleccionado
    if (!hasPreview) {
        if (!menuImageInput.files || menuImageInput.files.length === 0) {
            AppUtils.showNotification('Por favor, seleccione una imagen del menú.', 'error');
            return;
        }
        
        // Hay un archivo seleccionado pero no hay vista previa, intentamos usar el archivo directamente
        const file = menuImageInput.files[0];
        console.log('Guardando archivo sin vista previa:', file.name, 'Tipo:', file.type, 'Tamaño:', file.size);
        
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Continuar con el guardado usando e.target.result como la URL de la imagen
                continueMenuSave(menuName, weekStartDate, e.target.result);
            };
            reader.onerror = function() {
                AppUtils.showNotification('Error al procesar la imagen. Por favor, intente con otra imagen.', 'error');
            };
            reader.readAsDataURL(file);
            return; // Salimos porque el guardado continuará en el callback
        } catch (error) {
            console.error('Error al leer el archivo:', error);
            AppUtils.showNotification('Error al procesar la imagen. Por favor, intente con otra imagen.', 'error');
            return;
        }
    }
    
    // Si llegamos aquí, tenemos una vista previa válida
    console.log('Vista previa detectada, procediendo con el guardado');
    
    // Usar directamente la imagen de la vista previa
    if (menuImagePreview && menuImagePreview.src) {
        console.log('Usando imagen de vista previa para guardar');
        // Mostrar notificación de guardado en proceso
        AppUtils.showNotification('Guardando menú...', 'info');
        // Guardar usando la imagen de la vista previa
        continueMenuSave(menuName, weekStartDate, menuImagePreview.src);
    } else {
        // Este caso no debería ocurrir si la validación anterior es correcta
        console.log('Advertencia: La vista previa existe pero no tiene src. Intentando continuar...');
        // Intentar usar el archivo del input directamente si está disponible
        if (menuImageInput.files && menuImageInput.files.length > 0) {
            const file = menuImageInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                continueMenuSave(menuName, weekStartDate, e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            // Solo mostrar error si realmente no hay forma de obtener la imagen
            AppUtils.showNotification('Error al procesar la imagen. Por favor, intente con otra imagen.', 'error');
        }
    }
}

/**
 * Continúa con el proceso de guardar el menú una vez que tenemos la imagen
 * @param {string} menuName - Nombre del menú
 * @param {string} weekStartDate - Fecha de inicio
 * @param {string} imageUrl - URL de la imagen (data URL)
 */
/**
 * Comprime una imagen desde una URL de datos (data URL) para reducir su tamaño
 * @param {string} dataUrl - URL de datos de la imagen (data:image/...)
 * @param {number} maxWidth - Ancho máximo de la imagen comprimida (por defecto 1200px)
 * @param {number} quality - Calidad de la imagen comprimida (0-1, por defecto 0.7)
 * @returns {Promise<string>} - URL de datos comprimida
 */
async function compressImageUrl(dataUrl, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        try {
            // Verificar que la URL de datos sea válida
            if (!dataUrl || typeof dataUrl !== 'string') {
                return reject(new Error('URL de datos inválida o vacía'));
            }
            
            // Si no es una data URL de imagen, devolverla sin cambios
            if (!dataUrl.startsWith('data:image/')) {
                console.log('La URL no es una data URL de imagen, devolviendo sin cambios');
                return resolve(dataUrl);
            }
            
            console.log(`Comprimiendo imagen: Tamaño original ${Math.round(dataUrl.length/1024)}KB, Ancho máximo ${maxWidth}px, Calidad ${quality}`);
            
            // Crear una imagen temporal para cargar la URL de datos
            const img = new Image();
            
            // Establecer un timeout para evitar bloqueos
            const timeout = setTimeout(() => {
                console.warn('Tiempo de espera agotado al cargar la imagen para compresión');
                reject(new Error('Tiempo de espera agotado al cargar la imagen'));
            }, 10000); // 10 segundos
            
            img.onload = function() {
                clearTimeout(timeout);
                try {
                    // Calcular las nuevas dimensiones manteniendo la proporción
                    let width = img.width;
                    let height = img.height;
                    
                    console.log(`Dimensiones originales: ${width}x${height}`);
                    
                    if (width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = Math.floor(height * ratio);
                        console.log(`Dimensiones redimensionadas: ${width}x${height}`);
                    } else {
                        console.log('No es necesario redimensionar la imagen');
                    }
                    
                    // Crear un canvas para dibujar la imagen redimensionada
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Dibujar la imagen en el canvas
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF'; // Fondo blanco
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir el canvas a una URL de datos con la calidad especificada
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // Verificar que la compresión fue efectiva
                    if (compressedDataUrl.length >= dataUrl.length) {
                        console.warn('La compresión no redujo el tamaño de la imagen. Intentando con menor calidad.');
                        
                        // Intentar con menor calidad
                        const lowerQualityUrl = canvas.toDataURL('image/jpeg', quality * 0.8);
                        
                        if (lowerQualityUrl.length < dataUrl.length) {
                            console.log(`Imagen comprimida con menor calidad: ${Math.round(dataUrl.length/1024)}KB -> ${Math.round(lowerQualityUrl.length/1024)}KB (${Math.round((lowerQualityUrl.length / dataUrl.length) * 100)}%)`);
                            resolve(lowerQualityUrl);
                        } else {
                            console.warn('No se pudo reducir el tamaño de la imagen. Usando imagen original.');
                            resolve(dataUrl);
                        }
                    } else {
                        console.log(`Imagen comprimida: ${Math.round(dataUrl.length/1024)}KB -> ${Math.round(compressedDataUrl.length/1024)}KB (${Math.round((compressedDataUrl.length / dataUrl.length) * 100)}%)`);
                        resolve(compressedDataUrl);
                    }
                } catch (error) {
                    console.error('Error al comprimir la imagen:', error);
                    reject(error);
                }
            };
            
            img.onerror = function(error) {
                clearTimeout(timeout);
                console.error('Error al cargar la imagen para compresión:', error);
                reject(new Error('Error al cargar la imagen para compresión'));
            };
            
            // Iniciar la carga de la imagen
            img.src = dataUrl;
        } catch (error) {
            console.error('Error general en compressImageUrl:', error);
            reject(error);
        }
    });
}

async function continueMenuSave(menuName, weekStartDate, imageUrl) {
    console.log('Continuando con el guardado del menú con imagen', {
        menuName: menuName,
        weekStartDate: weekStartDate,
        imageUrlType: typeof imageUrl,
        imageUrlLength: imageUrl ? imageUrl.length : 0,
        imageUrlPreview: imageUrl ? (imageUrl.substring(0, 30) + '...') : 'undefined'
    });
    
    // Habilitar el botón de guardar si algo falla
    const enableSaveButton = () => {
        const saveButton = document.getElementById('save-menu-btn');
        if (saveButton && saveButton.disabled) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Guardar Menú';
        }
    };
    
    // Verificar que la URL de la imagen sea válida
    if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('URL de imagen inválida:', imageUrl);
        AppUtils.showNotification('Error: La imagen no es válida. Por favor, seleccione otra imagen.', 'error');
        enableSaveButton();
        return false;
    }
    
    // Comprobar si la URL de la imagen es demasiado larga (podría causar problemas en Firestore)
    if (imageUrl.length > 1048576 && imageUrl.startsWith('data:')) { // 1MB en bytes y es una data URL
        console.warn('La URL de la imagen es muy grande:', imageUrl.length, 'bytes');
        // Intentar comprimir la imagen
        try {
            console.log('Intentando comprimir imagen grande...');
            imageUrl = await compressImageUrl(imageUrl);
            console.log('Imagen comprimida correctamente, nuevo tamaño:', imageUrl.length, 'bytes');
        } catch (compressError) {
            console.error('Error al comprimir la imagen:', compressError);
            AppUtils.showNotification('Error: La imagen es demasiado grande. Por favor, seleccione una imagen más pequeña.', 'error');
            enableSaveButton();
            return false;
        }
    }
    
    // Si la imagen sigue siendo demasiado grande después de la compresión
    if (imageUrl.length > 1048576) {
        console.warn('La imagen sigue siendo demasiado grande después de la compresión:', imageUrl.length, 'bytes');
        // Intentar comprimir aún más con menor calidad
        try {
            imageUrl = await compressImageUrl(imageUrl, 800, 0.5);
            console.log('Imagen comprimida con calidad reducida, nuevo tamaño:', imageUrl.length, 'bytes');
            
            // Si aún es demasiado grande, comprimir al máximo
            if (imageUrl.length > 1048576) {
                imageUrl = await compressImageUrl(imageUrl, 600, 0.3);
                console.log('Imagen comprimida al máximo, nuevo tamaño:', imageUrl.length, 'bytes');
            }
        } catch (compressError) {
            console.error('Error al comprimir la imagen con calidad reducida:', compressError);
            AppUtils.showNotification('Error: No se pudo comprimir la imagen lo suficiente. Por favor, seleccione una imagen más pequeña.', 'error');
            return false;
        }
    }
    
    // Verificar si Firebase Storage está disponible para optimizar el almacenamiento de imágenes
    let useFirebaseStorage = false;
    try {
        // Usar el nuevo método isAvailable para verificar si Firebase Storage está disponible
        if (typeof FirebaseStorageUtils !== 'undefined' && typeof FirebaseStorageUtils.isAvailable === 'function') {
            useFirebaseStorage = FirebaseStorageUtils.isAvailable();
        } else {
            // Verificación alternativa si el método isAvailable no está disponible
            useFirebaseStorage = typeof FirebaseStorageUtils !== 'undefined' && 
                                 typeof firebase !== 'undefined' && 
                                 typeof firebase.storage === 'function' &&
                                 typeof FirebaseStorageUtils.uploadMenuImage === 'function';
        }
        
        console.log('Estado de Firebase Storage:', useFirebaseStorage ? 'Disponible' : 'No disponible');
        
        // Si Firebase Storage no está disponible, mostrar un mensaje en la consola
        if (!useFirebaseStorage) {
            console.warn('Firebase Storage no está disponible. Las imágenes se guardarán directamente en Firestore.');
        }
    } catch (error) {
        console.error('Error al verificar disponibilidad de Firebase Storage:', error);
        useFirebaseStorage = false;
    }
    
    // Preparar los datos del menú
    const menuData = {
        name: menuName,
        startDate: weekStartDate,
        endDate: calculateEndDateForMenu(weekStartDate),
        active: true,
        // No incluimos días ni platillos, solo la imagen del menú
        createdAt: new Date().toISOString() // Agregar timestamp para ordenar
    };
    
    // Si estamos editando, mantener el ID y agregar timestamp de actualización
    if (currentEditingMenuId) {
        menuData.id = currentEditingMenuId;
        menuData.updatedAt = new Date().toISOString();
    }
    
    // Verificar si la imagen es demasiado grande para Firestore (límite de 1MB)
    const isImageTooLargeForFirestore = imageUrl.startsWith('data:') && imageUrl.length > 1000000;
    
    // Si podemos usar Firebase Storage y la imagen es grande, intentar subir la imagen allí
    if (useFirebaseStorage && isImageTooLargeForFirestore) {
        try {
            console.log('Usando Firebase Storage para la imagen del menú');
            const saveStatus = document.getElementById('save-status');
            if (saveStatus) {
                saveStatus.textContent = 'Subiendo imagen a Firebase Storage...';
            }
            
            // Generar un ID único para el menú si no existe
            const menuId = currentEditingMenuId || 'menu_' + new Date().getTime();
            
            // Verificar si la imagen ya es una URL de Firebase Storage
            if (imageUrl.includes('firebasestorage.googleapis.com')) {
                console.log('La imagen ya es una URL de Firebase Storage, no es necesario subirla nuevamente');
                menuData.imageUrl = imageUrl;
                menuData.hasStorageImage = true;
            } 
            // Verificar si es una data URL que podemos subir
            else if (imageUrl.startsWith('data:')) {
                console.log('Subiendo data URL a Firebase Storage...');
                try {
                    // Intentar comprimir la imagen antes de subirla para reducir su tamaño
                    let imageToUpload = imageUrl;
                    if (imageUrl.length > 500000) { // Si es mayor a 500KB
                        try {
                            console.log('Comprimiendo imagen antes de subir a Firebase Storage...');
                            imageToUpload = await compressImageUrl(imageUrl, 800, 0.6);
                            console.log('Imagen comprimida correctamente para subida a Firebase Storage');
                        } catch (compressError) {
                            console.warn('No se pudo comprimir la imagen antes de subir:', compressError);
                            // Continuamos con la imagen original
                        }
                    }
                    
                    // Mostrar mensaje de estado
                    const saveStatus = document.getElementById('save-status');
                    if (saveStatus) {
                        saveStatus.textContent = 'Subiendo imagen a Firebase Storage... (puede tardar unos momentos)';
                    }
                    
                    // Subir la imagen a Firebase Storage con un timeout
                    const uploadPromise = FirebaseStorageUtils.uploadMenuImage(imageToUpload, menuId);
                    
                    // Establecer un timeout de 30 segundos para la subida
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Tiempo de espera agotado')), 30000);
                    });
                    
                    // Usar Promise.race para manejar el timeout
                    const storageUrl = await Promise.race([uploadPromise, timeoutPromise])
                        .catch(error => {
                            console.error('Error o timeout al subir imagen:', error);
                            throw error;
                        });
                    
                    console.log('Imagen subida a Firebase Storage:', storageUrl);
                    
                    // Usar la URL de Storage en lugar de la data URL
                    menuData.imageUrl = storageUrl;
                    menuData.hasStorageImage = true; // Marcar que la imagen está en Storage
                } catch (uploadError) {
                    console.error('Error al subir imagen a Firebase Storage:', uploadError);
                    AppUtils.showNotification('Error al subir la imagen a Firebase Storage. Se usará la imagen en formato alternativo.', 'warning');
                    
                    // Plan B: Intentar comprimir la imagen al máximo para usarla como data URL
                    try {
                        console.log('Implementando plan B: Comprimiendo imagen al máximo...');
                        const compressedImage = await compressImageUrl(imageUrl, 600, 0.4);
                        console.log('Imagen comprimida para plan B, tamaño:', compressedImage.length);
                        menuData.imageUrl = compressedImage;
                    } catch (compressError) {
                        console.error('Error al comprimir imagen para plan B:', compressError);
                        // Si todo falla, usar la imagen original
                        menuData.imageUrl = imageUrl;
                    }
                    
                    menuData.hasStorageImage = false;
                }
            } 
            // Si no es ninguno de los anteriores, usar la URL tal como está
            else {
                console.log('La imagen no es una data URL ni una URL de Firebase Storage, usándola tal como está');
                menuData.imageUrl = imageUrl;
                menuData.hasStorageImage = false;
            }
        } catch (storageError) {
            console.error('Error general al procesar imagen para Firebase Storage:', storageError);
            AppUtils.showNotification('Error al procesar la imagen. Se usará la imagen en formato alternativo.', 'warning');
            // Si falla, seguimos usando la URL original
            menuData.imageUrl = imageUrl;
            menuData.hasStorageImage = false;
        }
    } else {
        // Si no podemos usar Firebase Storage, usar la URL directamente
        console.log('Firebase Storage no está disponible, usando la URL de imagen directamente');
        menuData.imageUrl = imageUrl;
        menuData.hasStorageImage = false;
    }
    
    const saveButton = document.getElementById('save-menu-btn');
    const originalButtonHtml = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner"></span> Publicando...';
    
    try {
        // Actualizar el estado de guardado
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = 'Guardando en Firebase...';
        }
                        
        console.log('Intentando guardar menú en Firebase...', {
            menuData: {
                name: menuData.name,
                startDate: menuData.startDate,
                endDate: menuData.endDate,
                hasStorageImage: menuData.hasStorageImage,
                imageUrlLength: menuData.imageUrl ? menuData.imageUrl.length : 0
            }
        });
                        
        let success = false;
                        
        if (currentEditingMenuId) {
            console.log('Actualizando menú existente:', currentEditingMenuId);
            success = await FirebaseMenuModel.update(currentEditingMenuId, menuData);
        } else {
            console.log('Creando nuevo menú');
            success = await FirebaseMenuModel.add(menuData);
        }
                        
        if (success) {
            console.log('Menú guardado exitosamente');
            if (saveStatus) {
                saveStatus.className = 'save-status success';
                saveStatus.textContent = currentEditingMenuId ? 'Menú actualizado exitosamente' : 'Menú publicado exitosamente';
            }
            AppUtils.showNotification(currentEditingMenuId ? 'Menú actualizado.' : 'Menú publicado.', 'success');
            
            // Restablecer formulario
            resetMenuForm();
            
            // Actualizar lista de menús
            loadSavedMenus();
            
            // Habilitar botón de guardar
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = 'Guardar Menú';
            }
            
            return true;
        } else {
            console.error('Error al guardar menú en Firebase');
            if (saveStatus) {
                saveStatus.className = 'save-status error';
                saveStatus.textContent = 'Error al guardar menú';
            }
            AppUtils.showNotification('Error al guardar el menú. Por favor, intente nuevamente.', 'error');
            
            // Habilitar botón de guardar
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = 'Guardar Menú';
            }
            
            return false;
        }
    } catch (error) {
        console.error('Error al guardar menú:', error);
        
        // Mostrar más detalles sobre el error para facilitar la depuración
        if (error.code) {
            console.error('Código de error:', error.code);
        }
        if (error.message) {
            console.error('Mensaje de error:', error.message);
        }
        
        // Mostrar notificación al usuario
        let errorMessage = 'Error al guardar el menú';
        if (error.message) {
            // Simplificar el mensaje de error para el usuario
            if (error.message.includes('Firebase Storage')) {
                errorMessage += ': Error al subir la imagen. Intente con una imagen más pequeña.';
            } else if (error.message.includes('permission')) {
                errorMessage += ': No tiene permisos suficientes.';
            } else if (error.message.includes('network')) {
                errorMessage += ': Problema de conexión. Verifique su internet.';
            } else {
                errorMessage += ': ' + error.message;
            }
        }
        
        AppUtils.showNotification(errorMessage, 'error');
        
        // Actualizar estado de guardado
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.className = 'save-status error';
            saveStatus.textContent = 'Error: ' + (error.message || 'Error desconocido');
        }
        
        // Habilitar botón de guardar
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Guardar Menú';
        }
        
        return false;
    }
}

function calculateEndDateForMenu(startDateStr) {
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return AppUtils.formatDateForInput(endDate);
}

/**
 * Comprime una imagen en formato data URL para reducir su tamaño
 * @param {string} dataUrl - URL de datos de la imagen (data:image/...)
 * @returns {Promise<string>} - URL de datos comprimida
 */
async function compressImageUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        try {
            // Crear una imagen temporal
            const img = new Image();
            img.onload = function() {
                // Crear un canvas para dibujar la imagen comprimida
                const canvas = document.createElement('canvas');
                
                // Calcular nuevas dimensiones (reducir a máximo 1200px de ancho o alto)
                let width = img.width;
                let height = img.height;
                const maxDimension = 1200;
                
                if (width > height && width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
                
                // Establecer dimensiones del canvas
                canvas.width = width;
                canvas.height = height;
                
                // Dibujar la imagen en el canvas con las nuevas dimensiones
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir el canvas a data URL con calidad reducida (0.7 = 70%)
                // Intentar detectar el tipo de imagen original
                let mimeType = 'image/jpeg'; // Por defecto usar JPEG para mejor compresión
                if (dataUrl.startsWith('data:image/png')) {
                    mimeType = 'image/png';
                } else if (dataUrl.startsWith('data:image/gif')) {
                    mimeType = 'image/gif';
                }
                
                // Comprimir la imagen
                const compressedDataUrl = canvas.toDataURL(mimeType, 0.7);
                console.log('Tamaño original:', dataUrl.length, 'bytes');
                console.log('Tamaño comprimido:', compressedDataUrl.length, 'bytes');
                console.log('Reducción:', Math.round((1 - compressedDataUrl.length / dataUrl.length) * 100) + '%');
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = function() {
                reject(new Error('Error al cargar la imagen para compresión'));
            };
            
            img.src = dataUrl;
        } catch (error) {
            reject(error);
        }
    });
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
    
    // Verificar si hay imagen para mostrar
    if (menu.imageUrl) {
        const menuImageContainer = document.createElement('div');
        menuImageContainer.className = 'menu-image-container';
        
        const menuImage = document.createElement('img');
        menuImage.className = 'menu-thumbnail';
        menuImage.src = menu.imageUrl;
        menuImage.alt = `Imagen del menú ${menu.name}`;
        
        menuImageContainer.appendChild(menuImage);
        menuHeader.appendChild(menuImageContainer);
    }
    
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
    
    // Mostrar imagen si existe
    const previewContainer = document.getElementById('menu-image-preview-container');
    const previewImage = document.getElementById('menu-image-preview');
    
    if (menu.imageUrl && previewContainer && previewImage) {
        previewImage.src = menu.imageUrl;
        previewContainer.style.display = 'block';
    } else if (previewContainer) {
        previewContainer.style.display = 'none';
        if (previewImage) previewImage.src = '';
    }
    
    generateWeekDays(menu.startDate); 
    
    if (menu.days && Array.isArray(menu.days)) {
        // Esperar un ciclo para asegurar que los días se hayan renderizado por generateWeekDays
        setTimeout(() => {
            menu.days.forEach(dayData => {
                const dayIndex = DAYS_OF_WEEK.indexOf(dayData.name);
                if (dayIndex === -1) return;

                const daySection = document.querySelector(`.day-section[data-day="${dayIndex}"]`);
                if (!daySection) return;

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
    
    // Limpiar imagen
    removeMenuImage();
    
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
