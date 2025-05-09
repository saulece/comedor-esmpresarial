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
    const closeModalBtn = document.getElementById('close-login-modal');
    
    if (loginModal) {
        // Asegurarse que el modal se muestre y esté visible
        loginModal.classList.add('active'); 
        loginModal.style.display = 'block';
        
        // Limpiar cualquier error anterior
        const errorMessage = document.querySelector('#login-modal .error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
        
        // Configurar el botón de cierre del modal
        if (closeModalBtn) {
            // Eliminar listeners anteriores para evitar duplicados
            const newCloseBtn = closeModalBtn.cloneNode(true);
            closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);
            
            // Agregar listener al nuevo botón
            newCloseBtn.addEventListener('click', function() {
                loginModal.classList.remove('active');
                loginModal.style.display = 'none';
                // Redirigir al usuario a la página principal
                window.location.href = 'index.html';
            });
        }
        
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
    console.log('Inicializando interfaz de coordinador');
    
    // Mostrar información del coordinador
    displayCoordinatorInfo();
    
    // Configurar botones y navegación
    setupLogoutButton();
    setupTabNavigation();
    setupMenuWeekSelector(); // Configurar selector de semana para menús
    setupConfirmationWeekSelector(); // Configurar selector de semana para confirmaciones
    
    // Verificar que Firebase esté disponible antes de cargar los menús
    if (typeof firebase === 'undefined' || typeof FirebaseMenuModel === 'undefined') {
        console.error('Firebase o FirebaseMenuModel no están disponibles');
        AppUtils.showNotification('Error: No se puede conectar con la base de datos. Por favor, recargue la página.', 'error');
        return;
    }
    
    // Cargar menús con reintentos
    loadMenusWithRetry();
    
    // Inicializar el gestor de asistencia
    if (typeof AttendanceManager !== 'undefined') {
        AttendanceManager.init(); // Para la pestaña de "Confirmaciones"
    } else {
        console.error('AttendanceManager no está disponible');
    }
}

/**
 * Carga los menús con reintentos en caso de error
 */
function loadMenusWithRetry(attempt = 1) {
    console.log(`Intentando cargar menús (intento ${attempt})`);
    
    try {
        // Cargar menú actual
        loadCurrentMenu();
        
        // Cargar menú de la próxima semana
        loadNextWeekMenu();
    } catch (error) {
        console.error(`Error al cargar menús (intento ${attempt}):`, error);
        
        // Reintentar hasta 3 veces con un retraso creciente
        if (attempt < 3) {
            const delay = attempt * 1000; // 1s, 2s, 3s
            console.log(`Reintentando en ${delay}ms...`);
            
            setTimeout(() => {
                loadMenusWithRetry(attempt + 1);
            }, delay);
        } else {
            console.error('Se alcanzó el número máximo de intentos para cargar los menús');
            AppUtils.showNotification('Error al cargar los menús. Por favor, recargue la página.', 'error');
        }
    }
}

/**
 * Configura el selector de semana para las confirmaciones
 */
function setupConfirmationWeekSelector() {
    const weekButtons = document.querySelectorAll('.confirmation-week-btn');
    const confirmationContents = document.querySelectorAll('.confirmation-content');
    const attendanceForms = document.querySelectorAll('.attendance-form');
    
    weekButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Quitar clase active de todos los botones y contenidos
            weekButtons.forEach(btn => btn.classList.remove('active'));
            confirmationContents.forEach(content => content.classList.remove('active'));
            
            // Ocultar todos los formularios
            attendanceForms.forEach(form => form.style.display = 'none');
            
            // Agregar clase active al botón clickeado
            button.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const weekType = button.getAttribute('data-confirmation-week');
            const confirmationContent = document.getElementById(weekType + '-week-confirmation');
            const attendanceForm = document.getElementById(weekType + '-attendance-form');
            
            if (confirmationContent) {
                confirmationContent.classList.add('active');
            }
            
            if (attendanceForm) {
                attendanceForm.style.display = 'block';
            }
            
            // Cargar los datos correspondientes si es necesario
            if (weekType === 'current') {
                // Cargar datos para la semana actual
                AttendanceManager.loadCurrentWeekData();
            } else if (weekType === 'next') {
                // Cargar datos para la próxima semana
                AttendanceManager.loadNextWeekData();
            }
        });
    });
}

/**
 * Configura el selector de semana para los menús
 */
function setupMenuWeekSelector() {
    const weekButtons = document.querySelectorAll('.menu-week-btn');
    const menuContents = document.querySelectorAll('.menu-content');
    
    weekButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Quitar clase active de todos los botones y contenidos
            weekButtons.forEach(btn => btn.classList.remove('active'));
            menuContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            button.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const weekType = button.getAttribute('data-menu-week');
            const menuContent = document.getElementById(weekType + '-menu');
            if (menuContent) {
                menuContent.classList.add('active');
                
                // Recargar el menú si es necesario
                if (weekType === 'current' && !menuContent.dataset.loaded) {
                    loadCurrentMenu();
                } else if (weekType === 'next' && !menuContent.dataset.loaded) {
                    loadNextWeekMenu();
                }
            }
        });
    });
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

/**
 * Carga el menú actual con sincronización en tiempo real
 */
function loadCurrentMenu() {
    const currentMenuContainer = document.getElementById('current-menu');
    if (!currentMenuContainer) return;

    currentMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menú actual...</p>';
    
    if (typeof FirebaseMenuModel !== 'undefined') {
        // Cancelar listener anterior si existe
        if (currentMenuContainer.dataset.unsubscribeListenerId && typeof FirebaseRealtime !== 'undefined') {
            FirebaseRealtime.cancelListener(currentMenuContainer.dataset.unsubscribeListenerId);
        }

        try {
            // Usar FirebaseMenuModel.listenToActiveMenu que ya maneja la lógica de FirebaseRealtime
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
                
                displayMenuForCoordinator(menu, currentMenuContainer); // Renombrada para evitar conflicto
                
                // Marcar el contenedor como cargado
                currentMenuContainer.dataset.loaded = 'true';
                
                // Mostrar indicador de sincronización en tiempo real
                const syncIndicator = document.createElement('div');
                syncIndicator.className = 'sync-indicator';
                syncIndicator.innerHTML = '<i class="fas fa-sync"></i> Sincronizado en tiempo real';
                
                // Agregar el indicador al contenedor
                const header = currentMenuContainer.querySelector('.menu-header');
                if (header) header.appendChild(syncIndicator);
                else currentMenuContainer.appendChild(syncIndicator);

                setTimeout(() => {
                    syncIndicator.classList.add('fade-out');
                    setTimeout(() => syncIndicator.remove(), 500);
                }, 3000);
            });
            
            // Guardar la función de cancelación (el listener en sí)
            currentMenuContainer.dataset.unsubscribeFunction = unsubscribe; // Guardar la función de desuscripción real

        } catch (error) {
            console.error('Error al inicializar escucha de menú con Firebase:', error);
            currentMenuContainer.innerHTML = '<p class="error-state">Error al conectar con Firebase. Por favor, recarga la página.</p>';
        }
    } else {
        console.error('FirebaseMenuModel no está disponible.');
        currentMenuContainer.innerHTML = '<p class="error-state">Error: Componente de menú no disponible.</p>';
    }
}

/**
 * Carga el menú de la próxima semana
 */
function loadNextWeekMenu() {
    const nextMenuContainer = document.getElementById('next-menu');
    if (!nextMenuContainer) return;

    nextMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menú de la próxima semana...</p>';
    
    if (typeof FirebaseMenuModel !== 'undefined') {
        // Cancelar listener anterior si existe
        if (nextMenuContainer.dataset.unsubscribeListenerId && typeof FirebaseRealtime !== 'undefined') {
            FirebaseRealtime.cancelListener(nextMenuContainer.dataset.unsubscribeListenerId);
        }

        try {
            // Calcular la fecha de inicio de la próxima semana (7 días a partir de hoy)
            const today = new Date();
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + 7);
            
            // Formatear la fecha para la consulta
            const formattedDate = AppUtils.formatDateForInput(nextWeekStart);
            
            // Buscar menús que comiencen después de la fecha actual pero no más de 14 días después
            const unsubscribe = FirebaseMenuModel.listenToFutureMenus(formattedDate, 14, (menus, error) => {
                if (error) {
                    console.error('Error en la escucha del menú futuro:', error);
                    nextMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú de la próxima semana. Por favor, recarga la página.</p>';
                    return;
                }
                
                if (!menus || menus.length === 0) {
                    nextMenuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para la próxima semana.</p>';
                    return;
                }
                
                // Ordenar los menús por fecha de inicio y tomar el primero (el más cercano)
                const sortedMenus = menus.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                const nextWeekMenu = sortedMenus[0];
                
                displayMenuForCoordinator(nextWeekMenu, nextMenuContainer);
                
                // Marcar el contenedor como cargado
                nextMenuContainer.dataset.loaded = 'true';
                
                // Mostrar indicador de sincronización en tiempo real
                const syncIndicator = document.createElement('div');
                syncIndicator.className = 'sync-indicator';
                syncIndicator.innerHTML = '<i class="fas fa-sync"></i> Sincronizado en tiempo real';
                
                // Agregar el indicador al contenedor
                const header = nextMenuContainer.querySelector('.menu-header');
                if (header) header.appendChild(syncIndicator);
                else nextMenuContainer.appendChild(syncIndicator);
                
                // Mostrar indicador de sincronización por un tiempo y luego ocultarlo
                setTimeout(() => {
                    syncIndicator.classList.add('fade-out');
                    setTimeout(() => syncIndicator.remove(), 500);
                }, 3000);
            });
            
            // Guardar la función de cancelación
            nextMenuContainer.dataset.unsubscribeListenerId = unsubscribe;
        } catch (error) {
            console.error('Error al inicializar escucha del menú futuro con Firebase:', error);
            nextMenuContainer.innerHTML = '<p class="error-state">Error al conectar con Firebase. Por favor, recarga la página.</p>';
        }
    } else {
        console.error('FirebaseMenuModel no está disponible.');
        nextMenuContainer.innerHTML = '<p class="error-state">Error: Componente de menú no disponible.</p>';
    }
}


/**
 * Muestra un menú en el contenedor especificado para el coordinador
 * @param {Object} menu - Objeto de menú
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 */
function displayMenuForCoordinator(menu, container) {
    console.log('Iniciando displayMenuForCoordinator con:', menu ? menu.name : 'menú indefinido');
    
    if (!menu || typeof menu !== 'object') {
        console.error('Error: Formato de menú inválido', menu);
        container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
        return;
    }

    // Verificar si AppUtils está disponible
    if (typeof AppUtils === 'undefined') {
        console.error('Error: AppUtils no está definido. Usando formateo básico de fechas.');
        // Implementar formateo básico si AppUtils no está disponible
        if (!window.AppUtils) {
            window.AppUtils = {
                formatDate: function(date) {
                    if (!date) return '';
                    try {
                        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                    } catch (e) {
                        return date.toString();
                    }
                }
            };
        }
    }

    // Si hay una imagen del menú, mostrarla como contenido principal
    if (menu.imageUrl) {
        console.log('El menú tiene imageUrl:', typeof menu.imageUrl, menu.imageUrl ? menu.imageUrl.substring(0, 50) + '...' : 'vacío');
        
        let html = `
            <div class="menu-header">
                <h4>${menu.name || 'Menú Semanal'}</h4>
                <p>Vigente del ${AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00'))} al ${AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00'))}</p>
            </div>
            <div class="menu-image-display">
                <div class="loading-indicator"><span class="spinner"></span> Cargando imagen...</div>
                <img alt="Imagen del menú ${menu.name || 'Semanal'}" class="menu-image" style="display:none;">
            </div>
        `;
        container.innerHTML = html;
        
        // Obtener la referencia a la imagen y agregar eventos
        const menuImage = container.querySelector('.menu-image');
        const loadingIndicator = container.querySelector('.loading-indicator');
        
        if (menuImage) {
            console.log('Elemento de imagen encontrado, preparando para cargar');
            
            // Primero comprobamos si la URL de la imagen es muy larga (probablemente una data URL)
            if (menu.imageUrl && menu.imageUrl.length > 1000 && menu.imageUrl.startsWith('data:')) {
                console.log('Detectada data URL larga, procesando imagen...');
                // Es una data URL, la cargamos de forma segura
                try {
                    // Crear una imagen temporal para verificar que la data URL es válida
                    const tempImg = new Image();
                    tempImg.onload = function() {
                        console.log('Imagen temporal cargada correctamente, asignando a imagen principal');
                        // La data URL es válida, asignarla a la imagen principal
                        menuImage.src = menu.imageUrl;
                        menuImage.style.display = 'block';
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                    };
                    tempImg.onerror = function() {
                        console.error('Error al cargar la data URL de la imagen');
                        if (loadingIndicator) {
                            loadingIndicator.innerHTML = '<p class="error-state">Error al cargar la imagen. La URL de datos no es válida.</p>';
                        }
                    };
                    // Iniciar la carga de la imagen temporal
                    console.log('Iniciando carga de imagen temporal');
                    tempImg.src = menu.imageUrl;
                } catch (error) {
                    console.error('Error al procesar la data URL:', error);
                    if (loadingIndicator) {
                        loadingIndicator.innerHTML = '<p class="error-state">Error al procesar la imagen.</p>';
                    }
                }
            } else {
                // Es una URL normal, la cargamos directamente
                console.log('Cargando URL de imagen normal:', menu.imageUrl);
                
                // Evento cuando la imagen carga correctamente
                menuImage.onload = function() {
                    console.log('Imagen del menú cargada correctamente');
                    menuImage.style.display = 'block';
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                };
                
                // Evento cuando hay un error al cargar la imagen
                menuImage.onerror = function() {
                    console.error('Error al cargar la imagen del menú:', menu.imageUrl);
                    if (loadingIndicator) {
                        loadingIndicator.innerHTML = '<p class="error-state">Error al cargar la imagen. <button class="retry-btn">Reintentar</button></p>';
                        
                        // Agregar botón para reintentar
                        const retryBtn = loadingIndicator.querySelector('.retry-btn');
                        if (retryBtn) {
                            retryBtn.onclick = function() {
                                console.log('Reintentando carga de imagen con timestamp');
                                // Reintentar carga de imagen
                                const timestamp = new Date().getTime();
                                menuImage.src = menu.imageUrl + '?t=' + timestamp; // Evitar caché
                                loadingIndicator.innerHTML = '<span class="spinner"></span> Cargando imagen...';
                            };
                        }
                    }
                };
                
                // Asignar la URL a la imagen para iniciar la carga
                menuImage.src = menu.imageUrl;
            }
        } else {
            console.error('No se encontró el elemento de imagen en el contenedor');
        }
        
        return;
    } else {
        console.warn('El menú no tiene URL de imagen');
    }
    
    // Si no hay imagen, mostrar el formato tradicional (aunque ya no se usará)
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
    nextWeekStartDate: null,
    currentMenu: null,
    nextWeekMenu: null,
    currentConfirmation: null, // Almacena la confirmación actual para la semana y coordinador
    nextWeekConfirmation: null, // Almacena la confirmación para la próxima semana
    
    init: function() {
        // Inicializar fechas de semanas
        const today = new Date();
        this.currentWeekStartDate = this.getStartOfWeek(today);
        this.nextWeekStartDate = new Date(this.currentWeekStartDate);
        this.nextWeekStartDate.setDate(this.nextWeekStartDate.getDate() + 7);
        
        // Configurar formulario de la semana actual
        const currentAttendanceForm = document.getElementById('current-attendance-form');
        const resetCurrentBtn = document.getElementById('reset-current-attendance-btn');
        
        if(currentAttendanceForm) {
            currentAttendanceForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = document.getElementById('save-current-attendance-btn');
                const originalButtonHtml = submitButton.innerHTML;
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="spinner"></span> Guardando...';
                }
                try {
                    await this.saveCurrentAttendance();
                } catch (error) {
                    console.error('Error al guardar confirmación actual:', error);
                    AppUtils.showNotification('Error al guardar la confirmación de la semana actual.', 'error');
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonHtml;
                    }
                }
            });
        }
        if(resetCurrentBtn) resetCurrentBtn.addEventListener('click', () => this.resetCurrentForm());
        
        // Configurar formulario de la próxima semana
        const nextAttendanceForm = document.getElementById('next-attendance-form');
        const resetNextBtn = document.getElementById('reset-next-attendance-btn');
        
        if(nextAttendanceForm) {
            nextAttendanceForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = document.getElementById('save-next-attendance-btn');
                const originalButtonHtml = submitButton.innerHTML;
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="spinner"></span> Guardando...';
                }
                try {
                    await this.saveNextAttendance();
                } catch (error) {
                    console.error('Error al guardar confirmación próxima semana:', error);
                    AppUtils.showNotification('Error al guardar la confirmación de la próxima semana.', 'error');
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonHtml;
                    }
                }
            });
        }
        if(resetNextBtn) resetNextBtn.addEventListener('click', () => this.resetNextForm());
        
        // Cargar datos iniciales para la semana actual
        this.loadCurrentWeekData();
    },
    
    getStartOfWeek: function(date) {
        const d = new Date(date);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0,0,0,0); // Normalizar a medianoche
        return d;
    },
    
    /**
     * Carga los datos del menú y confirmaciones para la semana actual
     */
    loadCurrentWeekData: async function() {
        const currentMenuContainer = document.getElementById('current-confirmation-menu-display');
        if (!currentMenuContainer) return;
        currentMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menú actual...</p>';
        
        try {
            // Usar FirebaseMenuModel.listenToActiveMenu para obtener el menú actual
            const unsubscribe = FirebaseMenuModel.listenToActiveMenu((menu, error) => {
                if (error) {
                    console.error('Error en la escucha del menú activo:', error);
                    currentMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú. Por favor, recarga la página.</p>';
                    return;
                }
                
                if (!menu) {
                    currentMenuContainer.innerHTML = '<p class="empty-state">No hay menú activo para la fecha actual.</p>';
                    // Generar inputs vacíos si no hay menú
                    this.generateAttendanceInputs(null, 'current-attendance-inputs');
                    return;
                }
                
                // Guardar el menú actual
                this.currentMenu = menu;
                
                // Mostrar el menú en el contenedor
                currentMenuContainer.innerHTML = '';
                this.displayMenuInContainer(menu, currentMenuContainer);
                
                // Generar inputs para la confirmación
                this.generateAttendanceInputs(menu, 'current-attendance-inputs');
                
                // Cargar confirmación existente si hay
                this.loadExistingConfirmation('current');
            });
            
            // Guardar la función de cancelación
            currentMenuContainer.dataset.unsubscribeFunction = unsubscribe;
            
        } catch (error) {
            console.error('Error al cargar menú actual:', error);
            currentMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú actual. Por favor, recarga la página.</p>';
            this.generateAttendanceInputs(null, 'current-attendance-inputs');
        }
    },
    
    /**
     * Carga los datos del menú y confirmaciones para la próxima semana
     */
    loadNextWeekData: async function() {
        const nextMenuContainer = document.getElementById('next-confirmation-menu-display');
        if (!nextMenuContainer) return;
        nextMenuContainer.innerHTML = '<p class="loading-state"><span class="spinner"></span> Cargando menú de la próxima semana...</p>';
        
        try {
            // Calcular la fecha de inicio de la próxima semana (7 días a partir de hoy)
            const today = new Date();
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + 7);
            
            // Formatear la fecha para la consulta
            const formattedDate = AppUtils.formatDateForInput(nextWeekStart);
            
            // Buscar menús que comiencen después de la fecha actual pero no más de 14 días después
            const unsubscribe = FirebaseMenuModel.listenToFutureMenus(formattedDate, 14, (menus, error) => {
                if (error) {
                    console.error('Error en la escucha del menú futuro:', error);
                    nextMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú de la próxima semana. Por favor, recarga la página.</p>';
                    return;
                }
                
                if (!menus || menus.length === 0) {
                    nextMenuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para la próxima semana.</p>';
                    // Generar inputs vacíos si no hay menú
                    this.generateAttendanceInputs(null, 'next-attendance-inputs');
                    return;
                }
                
                // Ordenar los menús por fecha de inicio y tomar el primero (el más cercano)
                const sortedMenus = menus.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                const nextWeekMenu = sortedMenus[0];
                
                // Guardar el menú de la próxima semana
                this.nextWeekMenu = nextWeekMenu;
                
                // Mostrar el menú en el contenedor
                nextMenuContainer.innerHTML = '';
                this.displayMenuInContainer(nextWeekMenu, nextMenuContainer);
                
                // Generar inputs para la confirmación
                this.generateAttendanceInputs(nextWeekMenu, 'next-attendance-inputs');
                
                // Cargar confirmación existente si hay
                this.loadExistingConfirmation('next');
            });
            
            // Guardar la función de cancelación
            nextMenuContainer.dataset.unsubscribeFunction = unsubscribe;
            
        } catch (error) {
            console.error('Error al cargar menú de la próxima semana:', error);
            nextMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú de la próxima semana. Por favor, recarga la página.</p>';
            this.generateAttendanceInputs(null, 'next-attendance-inputs');
        }
    },
    
    /**
     * Muestra un menú en un contenedor
     */
    displayMenuInContainer: function(menu, container) {
        if (!menu || typeof menu !== 'object') {
            container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
            return;
        }
        
        // Si hay una imagen del menú, mostrarla como contenido principal
        if (menu.imageUrl) {
            let html = `
                <div class="menu-header">
                    <h4>${menu.name || 'Menú Semanal'}</h4>
                    <p>Vigente del ${AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00'))} al ${AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00'))}</p>
                </div>
                <div class="menu-image-display">
                    <div class="loading-indicator"><span class="spinner"></span> Cargando imagen...</div>
                    <img alt="Imagen del menú ${menu.name || 'Semanal'}" class="menu-image" style="display:none;">
                </div>
            `;
            container.innerHTML = html;
            
            // Obtener la referencia a la imagen y agregar eventos
            const menuImage = container.querySelector('.menu-image');
            const loadingIndicator = container.querySelector('.loading-indicator');
            
            if (menuImage) {
                // Primero comprobamos si la URL de la imagen es muy larga (probablemente una data URL)
                if (menu.imageUrl && menu.imageUrl.length > 1000 && menu.imageUrl.startsWith('data:')) {
                    console.log('Detectada data URL larga, procesando imagen...');
                    // Es una data URL, la cargamos de forma segura
                    try {
                        // Crear una imagen temporal para verificar que la data URL es válida
                        const tempImg = new Image();
                        tempImg.onload = function() {
                            // La data URL es válida, asignarla a la imagen principal
                            menuImage.src = menu.imageUrl;
                            menuImage.style.display = 'block';
                            if (loadingIndicator) loadingIndicator.style.display = 'none';
                        };
                        tempImg.onerror = function() {
                            console.error('Error al cargar la data URL de la imagen');
                            if (loadingIndicator) {
                                loadingIndicator.innerHTML = '<p class="error-state">Error al cargar la imagen. La URL de datos no es válida.</p>';
                            }
                        };
                        // Iniciar la carga de la imagen temporal
                        tempImg.src = menu.imageUrl;
                    } catch (error) {
                        console.error('Error al procesar la data URL:', error);
                        if (loadingIndicator) {
                            loadingIndicator.innerHTML = '<p class="error-state">Error al procesar la imagen.</p>';
                        }
                    }
                } else {
                    // Es una URL normal, la cargamos directamente
                    menuImage.src = menu.imageUrl;
                    
                    // Evento cuando la imagen carga correctamente
                    menuImage.onload = function() {
                        console.log('Imagen del menú cargada correctamente');
                        menuImage.style.display = 'block';
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                    };
                    
                    // Evento cuando hay un error al cargar la imagen
                    menuImage.onerror = function() {
                        console.error('Error al cargar la imagen del menú:', menu.imageUrl);
                        if (loadingIndicator) {
                            loadingIndicator.innerHTML = '<p class="error-state">Error al cargar la imagen. <button class="retry-btn">Reintentar</button></p>';
                            
                            // Agregar botón para reintentar
                            const retryBtn = loadingIndicator.querySelector('.retry-btn');
                            if (retryBtn) {
                                retryBtn.onclick = function() {
                                    // Reintentar carga de imagen
                                    const timestamp = new Date().getTime();
                                    menuImage.src = menu.imageUrl + '?t=' + timestamp; // Evitar caché
                                    loadingIndicator.innerHTML = '<span class="spinner"></span> Cargando imagen...';
                                };
                            }
                        }
                    };
                }
            }
            
            return;
        }
        
        // Si no hay imagen, mostrar el formato tradicional
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
                        const category = dish.category || 'otros';
                        if (!dishesByCategory[category]) {
                            dishesByCategory[category] = [];
                        }
                        dishesByCategory[category].push(dish);
                    });
                    
                    // Mostrar platos por categoría
                    Object.keys(dishesByCategory).forEach(category => {
                        const dishes = dishesByCategory[category];
                        const categoryName = CATEGORIES[category] || category.charAt(0).toUpperCase() + category.slice(1);
                        
                        html += `<div class="dish-category"><h6>${categoryName}</h6><ul class="dish-list">`;
                        
                        dishes.forEach(dish => {
                            html += `<li>${dish.name}</li>`;
                        });
                        
                        html += `</ul></div>`;
                    });
                } else {
                    html += `<p class="empty-state">No hay platos definidos para este día.</p>`;
                }
                
                html += `</div>`;
            });
        } else {
            html += `<p class="empty-state">No hay días definidos en este menú.</p>`;
        }
        
        html += `</div>`;
        container.innerHTML = html;
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

            // Consulta para menús cuya vigencia se solape con la semana seleccionada
            const snapshot = await firebase.firestore().collection('menus')
                .where('startDate', '<=', weekEndStr) // Menú debe empezar antes o el mismo día que termina la semana
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
        
    generateAttendanceInputs: function(menu, containerId) {
        const inputsContainer = document.getElementById(containerId);
        if (!inputsContainer) return;
        inputsContainer.innerHTML = '';

        const daysToDisplay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        // Determinar la fecha de inicio de la semana según el contenedor
        const isNextWeek = containerId === 'next-attendance-inputs';
        const weekStartDate = isNextWeek ? this.nextWeekStartDate : this.currentWeekStartDate;

        daysToDisplay.forEach((dayName, index) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'attendance-day card'; // Añadido card
            
            const dayId = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            dayDiv.dataset.dayId = dayId;

            const currentDate = new Date(weekStartDate);
            currentDate.setDate(currentDate.getDate() + index);

            const header = document.createElement('div');
            header.className = 'attendance-day-header';
            header.innerHTML = `<h5>${dayName} <small>(${AppUtils.formatDate(currentDate)})</small></h5>`;
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'form-group';
            
            const inputId = isNextWeek ? `next-attendance-${dayId}` : `current-attendance-${dayId}`;
            
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.textContent = 'Asistentes:';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = inputId;
            input.className = 'attendance-count form-control'; // form-control para mejor estilo
            input.min = '0';
            input.value = '0'; // Por defecto
            input.required = true;

            // Verificar si este día está en el menú actual
            const dayInMenu = menu && menu.days && menu.days.find(d => d.name === dayName);
            if (!dayInMenu) {
                input.disabled = true;
                input.value = '';
                input.placeholder = "No disponible";
                //label.innerHTML += ' <small>(No hay menú este día)</small>';
            }
            
            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            dayDiv.appendChild(header);
            dayDiv.appendChild(inputGroup);
            inputsContainer.appendChild(dayDiv);
        });
    },
    
    loadExistingConfirmation: async function(weekType = 'current') {
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) return;
        
        // Determinar qué semana estamos cargando
        const isNextWeek = weekType === 'next';
        const weekStartDate = isNextWeek ? this.nextWeekStartDate : this.currentWeekStartDate;
        if (!weekStartDate) return;
        
        // Elementos de la UI para la semana correspondiente
        const saveButton = document.getElementById(isNextWeek ? 'save-next-attendance-btn' : 'save-attendance-btn');
        const lastUpdateInfo = document.getElementById(isNextWeek ? 'next-last-update-info' : 'last-update-info');
        const lastUpdateTime = document.getElementById(isNextWeek ? 'next-last-update-time' : 'last-update-time');

        // Guardar HTML original del botón antes de poner spinner
        const originalButtonHtml = saveButton ? saveButton.innerHTML : '';
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner"></span> Cargando...';
        }

        try {
            const weekStartStr = AppUtils.formatDateForInput(weekStartDate);
            const confirmation = await FirebaseAttendanceModel.getConfirmationByWeek(coordinatorId, weekStartStr);
            
            // Guardar la confirmación en la propiedad correspondiente
            if (isNextWeek) {
                this.nextWeekConfirmation = confirmation;
            } else {
                this.currentConfirmation = confirmation;
            }
            
            if (confirmation) {
                // Rellenar los inputs con los valores guardados
                Object.entries(confirmation.attendanceCounts).forEach(([dayId, count]) => {
                    const prefix = isNextWeek ? 'next-attendance-' : 'current-attendance-';
                    const input = document.getElementById(`${prefix}${dayId}`);
                    if (input && !input.disabled) {
                        input.value = count;
                    }
                });
                
                // Mostrar última actualización
                if (lastUpdateTime) {
                    lastUpdateTime.textContent = AppUtils.formatDateTime(new Date(confirmation.updatedAt.seconds * 1000));
                }
                if (lastUpdateInfo) {
                    lastUpdateInfo.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error(`Error al cargar confirmación existente (${weekType}):`, error);
            AppUtils.showNotification(`Error al cargar datos de confirmación previos para ${isNextWeek ? 'la próxima semana' : 'la semana actual'}.`, 'error');
        } finally {
            if (saveButton) {
                const iconHtml = '<i class="fas fa-save"></i> ';
                const confirmation = isNextWeek ? this.nextWeekConfirmation : this.currentConfirmation;
                saveButton.innerHTML = iconHtml + (confirmation ? 'Actualizar Asistencia' : 'Confirmar Asistencia');
                saveButton.disabled = false;
            }
        }
    },
    
    saveCurrentAttendance: async function() {
        return this.saveAttendance('current');
    },
    
    saveNextAttendance: async function() {
        return this.saveAttendance('next');
    },
    
    saveAttendance: async function(weekType = 'current') {
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        
        // Determinar qué semana estamos guardando
        const isNextWeek = weekType === 'next';
        const menu = isNextWeek ? this.nextWeekMenu : this.currentMenu;
        const weekStartDate = isNextWeek ? this.nextWeekStartDate : this.currentWeekStartDate;
        const confirmation = isNextWeek ? this.nextWeekConfirmation : this.currentConfirmation;
        
        if (!coordinatorId || !menu) { // Solo guardar si hay un menú para la semana
            AppUtils.showNotification(`No hay un menú activo para ${isNextWeek ? 'la próxima semana' : 'esta semana'} o no ha iniciado sesión.`, 'warning');
            return false;
        }
        
        const attendanceCounts = {};
        let hasValidInput = false;
        
        // Seleccionar el contenedor correcto según la semana
        const inputsContainer = document.getElementById(isNextWeek ? 'next-attendance-inputs' : 'current-attendance-inputs');
        if (!inputsContainer) return false;
        
        // Obtener todos los días en el contenedor
        const attendanceDays = inputsContainer.querySelectorAll('.attendance-day');
        
        attendanceDays.forEach(dayDiv => {
            const dayId = dayDiv.dataset.dayId;
            const prefix = isNextWeek ? 'next-attendance-' : 'current-attendance-';
            const input = document.getElementById(`${prefix}${dayId}`);
            
            if (input && !input.disabled && input.value.trim() !== '') {
                const count = parseInt(input.value.trim(), 10);
                if (!isNaN(count) && count >= 0) {
                    attendanceCounts[dayId] = count;
                    hasValidInput = true;
                }
            }
        });

        if (!hasValidInput) {
            AppUtils.showNotification('Por favor, ingrese al menos un valor válido de asistencia.', 'warning');
            return false;
        }

        try {
            // Crear o actualizar la confirmación
            let success;
            if (confirmation) {
                // Actualizar confirmación existente
                success = await FirebaseAttendanceModel.update(
                    confirmation.id,
                    attendanceCounts
                );
            } else {
                // Crear nueva confirmación
                success = await FirebaseAttendanceModel.create(
                    coordinatorId,
                    AppUtils.formatDateForInput(weekStartDate),
                    attendanceCounts
                );
            }
            
            if (success) {
                AppUtils.showNotification(`Confirmación de asistencia para ${isNextWeek ? 'la próxima semana' : 'la semana actual'} guardada.`, 'success');
                await this.loadExistingConfirmation(weekType); // Recargar para actualizar UI
                return true;
            } else {
                AppUtils.showNotification(`Error al guardar la confirmación para ${isNextWeek ? 'la próxima semana' : 'la semana actual'}.`, 'error');
                return false;
            }
        } catch (error) {
            console.error(`Error al guardar confirmación en Firebase (${weekType}):`, error);
            AppUtils.showNotification(`Error al guardar la confirmación para ${isNextWeek ? 'la próxima semana' : 'la semana actual'}: ${error.message}`, 'error');
            return false;
        }
    },
    
    /**
     * Resetea el formulario de confirmación de la semana actual
     */
    resetCurrentForm: function() {
        this.resetForm('current');
    },
    
    /**
     * Resetea el formulario de confirmación de la próxima semana
     */
    resetNextForm: function() {
        this.resetForm('next');
    },
    
    /**
     * Resetea un formulario de confirmación
     */
    resetForm: function(weekType = 'current') {
        const isNextWeek = weekType === 'next';
        const inputsContainer = document.getElementById(isNextWeek ? 'next-attendance-inputs' : 'current-attendance-inputs');
        if (!inputsContainer) return;
        
        const inputs = inputsContainer.querySelectorAll('input.attendance-count');
        inputs.forEach(input => {
            if (!input.disabled) {
                input.value = '0';
            }
        });
        
        AppUtils.showNotification(`Formulario de ${isNextWeek ? 'la próxima semana' : 'la semana actual'} restablecido.`, 'info');
    }
};