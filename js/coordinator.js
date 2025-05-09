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
    console.log('Inicializando interfaz de coordinador...');
    
    // Forzar la carga de menús inmediatamente
    setTimeout(() => {
        console.log('Forzando carga de menús...');
        loadCurrentMenu();
        loadNextWeekMenu();
        
        // Agregar botón para recargar menús
        addReloadMenusButton();
        
        // Inicializar el gestor de asistencia
        if (typeof AttendanceManager !== 'undefined') {
            try {
                console.log('Inicializando AttendanceManager...');
                AttendanceManager.init(); // Para la pestaña de "Confirmaciones"
            } catch (error) {
                console.error('Error al inicializar AttendanceManager:', error);
            }
        } else {
            console.error('AttendanceManager no está disponible');
        }
    }, 300);
}

// Nota: La función setupTabNavigation se ha movido a coordinator-ui.js

// Nota: La función setupWeekSelectors se ha movido a coordinator-ui.js

// Nota: La función setupMenuWeekSelector se ha movido a coordinator-ui.js

// Nota: La función setupConfirmationWeekSelector se ha movido a coordinator-ui.js

// Nota: La función setupLogoutButton se ha movido a coordinator-ui.js

/**
 * Agrega un botón para recargar los menús manualmente
 */
function addReloadMenusButton() {
    // Buscar el contenedor del menú semanal
    const menuSection = document.querySelector('.menu-section');
    if (!menuSection) return;
    
    // Verificar si ya existe el botón
    if (document.querySelector('.reload-all-menus-btn')) return;
    
    // Crear el botón de recarga
    const reloadButton = document.createElement('button');
    reloadButton.className = 'reload-all-menus-btn';
    reloadButton.innerHTML = '<i class="fas fa-sync-alt"></i> Recargar menús';
    reloadButton.style.marginBottom = '15px';
    reloadButton.style.padding = '5px 10px';
    reloadButton.style.backgroundColor = '#3498db';
    reloadButton.style.color = 'white';
    reloadButton.style.border = 'none';
    reloadButton.style.borderRadius = '4px';
    reloadButton.style.cursor = 'pointer';
    
    // Agregar evento de clic
    reloadButton.addEventListener('click', function() {
        console.log('Recargando todos los menús...');
        AppUtils.showNotification('Recargando menús...', 'info');
        loadMenusWithRetry();
    });
    
    // Insertar el botón al principio de la sección de menú
    menuSection.insertBefore(reloadButton, menuSection.firstChild);
}

/**
 * Carga los menús con reintentos en caso de error
 */
function loadMenusWithRetry(attempt = 1) {
    console.log(`Intentando cargar menús (intento ${attempt})`);
    
    try {
        // Cargar menú actual con un pequeño retraso para evitar bloqueos
        setTimeout(() => {
            try {
                loadCurrentMenu();
            } catch (currentError) {
                console.error('Error al cargar menú actual:', currentError);
            }
        }, 100);
        
        // Cargar menú de la próxima semana con un retraso mayor
        setTimeout(() => {
            try {
                loadNextWeekMenu();
            } catch (nextError) {
                console.error('Error al cargar menú de la próxima semana:', nextError);
            }
        }, 500);
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
            if (typeof AppUtils !== 'undefined' && AppUtils.showNotification) {
                AppUtils.showNotification('Error al cargar los menús. Por favor, recargue la página.', 'error');
            }
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
 * Carga el menú de la próxima semana (la que comienza el lunes siguiente)
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
            // Obtener la fecha actual
            const today = new Date();
            
            // Calcular la fecha del próximo lunes
            const nextMonday = new Date(today);
            const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
            const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay; // Si hoy es domingo, el próximo lunes es mañana
            nextMonday.setDate(today.getDate() + daysUntilNextMonday);
            
            // Formatear la fecha para la consulta (YYYY-MM-DD)
            const nextMondayFormatted = nextMonday.toISOString().split('T')[0];
            
            console.log('Fecha actual:', today.toISOString().split('T')[0]);
            console.log('Próximo lunes:', nextMondayFormatted);
            console.log('Buscando menú que comienza el lunes de la próxima semana:', nextMondayFormatted);
            
            // Buscar menús que comiencen exactamente el lunes de la próxima semana
            const unsubscribe = FirebaseRealtime.listenToCollection('menus', {
                where: [
                    ['startDate', '==', nextMondayFormatted]
                ],
                onSnapshot: (snapshot) => {
                    try {
                        console.log('Snapshot recibido para menú del próximo lunes, docs:', snapshot.docs.length);
                        
                        if (snapshot.empty) {
                            console.log('No se encontró menú para el lunes', nextMondayFormatted);
                            console.log('Buscando menús futuros cercanos como alternativa...');
                            
                            // Si no hay menú para el lunes exacto, buscar menús futuros cercanos
                            searchNearbyFutureMenus(nextMenuContainer, nextMondayFormatted);
                            return;
                        }
                        
                        // Convertir documentos a objetos de menú
                        const menus = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                        console.log('Menú para el lunes encontrado:', menus.length);
                        
                        if (menus.length > 0) {
                            const nextWeekMenu = menus[0];
                            console.log('Mostrando menú del próximo lunes:', nextWeekMenu.name, 'ID:', nextWeekMenu.id);
                            
                            displayMenuForCoordinator(nextWeekMenu, nextMenuContainer);
                            
                            // Marcar el contenedor como cargado
                            nextMenuContainer.dataset.loaded = 'true';
                            nextMenuContainer.dataset.unsubscribeListenerId = unsubscribe;
                        } else {
                            searchNearbyFutureMenus(nextMenuContainer, nextMondayFormatted);
                        }
                    } catch (error) {
                        console.error('Error procesando snapshot para menú del próximo lunes:', error);
                        searchNearbyFutureMenus(nextMenuContainer, nextMondayFormatted);
                    }
                },
                onError: (error) => {
                    console.error('Error en la búsqueda del menú del próximo lunes:', error);
                    searchNearbyFutureMenus(nextMenuContainer, nextMondayFormatted);
                }
            });
            
            return unsubscribe;
        } catch (error) {
            console.error('Error al iniciar la búsqueda del menú de la próxima semana:', error);
            nextMenuContainer.innerHTML = '<p class="error-state">Error al cargar el menú de la próxima semana. <button class="reload-menu-btn">Reintentar</button></p>';
            
            // Agregar evento al botón de reintentar
            const retryBtn = nextMenuContainer.querySelector('.reload-menu-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadNextWeekMenu);
            }
        }
    } else {
        console.error('FirebaseMenuModel no está disponible');
        nextMenuContainer.innerHTML = '<p class="error-state">Error: Componente de menú no disponible. <button class="reload-menu-btn">Reintentar</button></p>';
        
        // Agregar evento al botón de reintentar
        const retryBtn = nextMenuContainer.querySelector('.reload-menu-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadNextWeekMenu);
        }
    }
}

/**
 * Busca menús futuros cercanos como alternativa si no se encuentra un menú para el lunes exacto
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 * @param {string} startDate - Fecha de inicio para la búsqueda (YYYY-MM-DD)
 */
function searchNearbyFutureMenus(container, startDate) {
    console.log('Buscando menús futuros cercanos a partir de:', startDate);
    
    // Buscar menús que comiencen después de la fecha dada pero no más de 14 días después
    const unsubscribe = FirebaseMenuModel.listenToFutureMenus(startDate, 14, (menus, error) => {
        if (error) {
            console.error('Error en la búsqueda de menús futuros cercanos:', error);
            container.innerHTML = '<p class="error-state">Error al cargar el menú de la próxima semana. <button class="reload-menu-btn">Reintentar</button></p>';
            
            // Agregar evento al botón de reintentar
            const retryBtn = container.querySelector('.reload-menu-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadNextWeekMenu);
            }
            return;
        }
        
        console.log('Menús futuros cercanos recibidos:', menus ? menus.length : 0);
        
        if (!menus || menus.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay menú disponible para la próxima semana. <button class="reload-menu-btn">Reintentar carga</button></p>';
            
            // Agregar evento al botón de reintentar
            const retryBtn = container.querySelector('.reload-menu-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadNextWeekMenu);
            }
            return;
        }
        
        // Ordenar los menús por fecha de inicio y tomar el primero (el más cercano)
        const sortedMenus = menus.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Mostrar información detallada sobre los menús encontrados
        sortedMenus.forEach((menu, index) => {
            console.log(`Menú futuro cercano ${index + 1}:`, menu.name, 
                        'Inicio:', menu.startDate, 
                        'Fin:', menu.endDate,
                        'ID:', menu.id);
        });
        
        const nextWeekMenu = sortedMenus[0];
        console.log('Mostrando menú futuro cercano:', nextWeekMenu.name, 'ID:', nextWeekMenu.id);
        
        displayMenuForCoordinator(nextWeekMenu, container);
        
        // Marcar el contenedor como cargado
        container.dataset.loaded = 'true';
        container.dataset.unsubscribeListenerId = unsubscribe;
        
        // Mostrar indicador de sincronización en tiempo real
        const syncIndicator = document.createElement('div');
        syncIndicator.className = 'sync-indicator';
        syncIndicator.innerHTML = '<i class="fas fa-sync"></i> Sincronizado en tiempo real';
        
        // Agregar el indicador al contenedor
        const header = container.querySelector('.menu-header');
        if (header) header.appendChild(syncIndicator);
        else container.appendChild(syncIndicator);
        
        // Mostrar indicador de sincronización por un tiempo y luego ocultarlo
        setTimeout(() => {
            syncIndicator.classList.add('fade-out');
            setTimeout(() => syncIndicator.remove(), 500);
        }, 3000);
    });
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
    
    // Determinar si es el menú actual o el de la próxima semana
    const isCurrentMenu = container.id === 'current-menu';
    const weekType = isCurrentMenu ? 'current' : 'next';
    
    console.log(`Mostrando menú para ${weekType}:`, menu.name);

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

    // Crear el HTML base para el menú
    let html = `
        <div class="menu-header">
            <h4>${menu.name || 'Menú Semanal'}</h4>
            <p>Vigente del ${AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00'))} al ${AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00'))}</p>
        </div>
    `;
    
    // Si hay una imagen del menú, agregar el contenedor de imagen
    if (menu.imageUrl) {
        console.log('El menú tiene imageUrl:', typeof menu.imageUrl, menu.imageUrl ? menu.imageUrl.substring(0, 50) + '...' : 'vacío');
        
        html += `
            <div class="menu-image-display">
                <div class="loading-indicator"><span class="spinner"></span> Cargando imagen...</div>
                <img alt="Imagen del menú ${menu.name || 'Semanal'}" class="menu-image" style="display:none;">
            </div>
        `;
    }
    
    // Agregar sección de días del menú
    html += `<div class="menu-days">`;
    
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
        html += `<p class="empty-state">El menú no contiene días configurados.</p>`;
    }
    
    html += `</div>`;
    
    // Aplicar el HTML al contenedor
    container.innerHTML = html;
    
    // Si hay imagen, configurar eventos para cargarla
    if (menu.imageUrl) {
        const menuImage = container.querySelector('.menu-image');
        const loadingIndicator = container.querySelector('.loading-indicator');
        
        if (menuImage && loadingIndicator) {
            // Evento cuando la imagen carga correctamente
            menuImage.onload = function() {
                console.log('Imagen del menú cargada correctamente');
                menuImage.style.display = 'block';
                loadingIndicator.style.display = 'none';
            };
            
            // Evento cuando hay un error al cargar la imagen
            menuImage.onerror = function() {
                console.error('Error al cargar la imagen del menú:', menu.imageUrl);
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
            };
            
            // Iniciar la carga de la imagen
            if (menu.imageUrl.length > 1000 && menu.imageUrl.startsWith('data:')) {
                // Para data URLs largas, usar una imagen temporal primero
                try {
                    const tempImg = new Image();
                    tempImg.onload = function() {
                        menuImage.src = menu.imageUrl;
                    };
                    tempImg.onerror = function() {
                        menuImage.onerror();
                    };
                    tempImg.src = menu.imageUrl;
                } catch (error) {
                    console.error('Error al procesar la data URL:', error);
                    menuImage.onerror();
                }
            } else {
                // URL normal, cargar directamente
                menuImage.src = menu.imageUrl;
            }
        }
    }
    
    // Actualizar el menú en el gestor de asistencia si está disponible
    setTimeout(() => {
        if (typeof AttendanceManager !== 'undefined') {
            try {
                const menuData = {
                    id: menu.id,
                    name: menu.name,
                    startDate: menu.startDate,
                    endDate: menu.endDate,
                    days: {}
                };
                
                // Convertir los días a formato compatible con AttendanceManager
                if (Array.isArray(menu.days)) {
                    menu.days.forEach(day => {
                        const dayName = day.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        menuData.days[dayName] = {
                            date: day.date,
                            dish: day.dishes && day.dishes.length > 0 ? day.dishes[0].name : 'No especificado'
                        };
                    });
                }
                
                // Actualizar el menú en el gestor de asistencia
                AttendanceManager.updateMenu(weekType, menuData);
                console.log(`Menú ${weekType} actualizado en AttendanceManager`);
            } catch (error) {
                console.error('Error al actualizar menú en AttendanceManager:', error);
            }
        }
    }, 200);
}

// Gestor de asistencia para coordinadores
const AttendanceManager = {
    currentWeekStartDate: null,
    nextWeekStartDate: null,
    currentMenu: null,
    nextWeekMenu: null,
    currentConfirmation: null,
    nextWeekConfirmation: null,

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