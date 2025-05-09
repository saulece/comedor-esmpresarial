/**
 * coordinator-ui.js
 * Maneja la interfaz de usuario básica para la vista del coordinador
 * Este script se carga antes que cualquier otro para garantizar que los botones funcionen
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando coordinator-ui.js...');
    
    // Configurar navegación de pestañas
    setupTabs();
    
    // Configurar selectores de semana
    setupWeekSelectors();
    
    // Configurar botón de cerrar sesión
    setupLogoutButton();
    
    console.log('coordinator-ui.js inicializado correctamente');
});

/**
 * Configura la navegación entre pestañas
 */
function setupTabs() {
    console.log('Configurando pestañas...');
    
    // Obtener todos los botones de pestaña y contenidos
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (!tabButtons.length || !tabContents.length) {
        console.error('No se encontraron botones de pestaña o contenidos');
        return;
    }
    
    // Agregar event listeners a cada botón de pestaña
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Obtener el ID de la pestaña a mostrar
            const tabId = this.getAttribute('data-tab');
            console.log('Cambiando a pestaña:', tabId);
            
            // Desactivar todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar el botón y contenido seleccionados
            this.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.error('No se encontró el contenido de pestaña:', tabId);
            }
        });
    });
    
    console.log('Pestañas configuradas correctamente');
}

/**
 * Configura los selectores de semana
 */
function setupWeekSelectors() {
    console.log('Configurando selectores de semana...');
    
    // Configurar selector de semana para menús
    setupMenuWeekSelector();
    
    // Configurar selector de semana para confirmaciones
    setupConfirmationWeekSelector();
}

/**
 * Configura el selector de semana para menús
 */
function setupMenuWeekSelector() {
    const menuWeekButtons = document.querySelectorAll('.menu-week-btn');
    const menuContents = document.querySelectorAll('.menu-content');
    
    if (!menuWeekButtons.length || !menuContents.length) {
        console.error('No se encontraron botones de selector de semana para menús');
        return;
    }
    
    menuWeekButtons.forEach(button => {
        button.addEventListener('click', function() {
            const weekType = this.getAttribute('data-menu-week');
            console.log('Cambiando a menú de semana:', weekType);
            
            // Desactivar todos los botones y contenidos
            menuWeekButtons.forEach(btn => btn.classList.remove('active'));
            menuContents.forEach(content => content.classList.remove('active'));
            
            // Activar el botón y contenido seleccionados
            this.classList.add('active');
            const menuContent = document.getElementById(weekType + '-menu');
            if (menuContent) {
                menuContent.classList.add('active');
            } else {
                console.error('No se encontró el contenido de menú:', weekType + '-menu');
            }
        });
    });
    
    console.log('Selector de semana para menús configurado correctamente');
}

/**
 * Configura el selector de semana para confirmaciones
 */
function setupConfirmationWeekSelector() {
    const confirmationWeekButtons = document.querySelectorAll('.confirmation-week-btn');
    const confirmationContents = document.querySelectorAll('.confirmation-content');
    
    if (!confirmationWeekButtons.length) {
        console.error('No se encontraron botones de selector de semana para confirmaciones');
        return;
    }
    
    confirmationWeekButtons.forEach(button => {
        button.addEventListener('click', function() {
            const weekType = this.getAttribute('data-confirmation-week');
            console.log('Cambiando a confirmaciones de semana:', weekType);
            
            // Desactivar todos los botones
            confirmationWeekButtons.forEach(btn => btn.classList.remove('active'));
            
            // Activar el botón seleccionado
            this.classList.add('active');
            
            // Activar el contenedor de confirmación correspondiente
            if (confirmationContents.length > 0) {
                confirmationContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(`${weekType}-week-confirmation`);
                if (targetContent) {
                    targetContent.classList.add('active');
                } else {
                    console.error('No se encontró el contenido de confirmación:', `${weekType}-week-confirmation`);
                }
            }
            
            // Mostrar/ocultar formularios de asistencia
            const currentForm = document.getElementById('current-attendance-form');
            const nextForm = document.getElementById('next-attendance-form');
            
            if (currentForm && nextForm) {
                if (weekType === 'current') {
                    currentForm.style.display = 'block';
                    nextForm.style.display = 'none';
                } else {
                    currentForm.style.display = 'none';
                    nextForm.style.display = 'block';
                }
            }
        });
    });
    
    console.log('Selector de semana para confirmaciones configurado correctamente');
}

/**
 * Configura el botón de cerrar sesión
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!logoutBtn) {
        console.error('No se encontró el botón de cerrar sesión');
        return;
    }
    
    logoutBtn.addEventListener('click', function() {
        console.log('Cerrando sesión...');
        logoutCoordinator();
    });
    
    console.log('Botón de cerrar sesión configurado correctamente');
}

/**
 * Cierra la sesión del coordinador
 */
function logoutCoordinator() {
    console.log('Ejecutando logoutCoordinator...');
    
    try {
        // Limpiar datos de sesión
        sessionStorage.removeItem('coordinatorId');
        sessionStorage.removeItem('coordinatorName');
        
        // Mostrar notificación si está disponible
        if (typeof AppUtils !== 'undefined' && AppUtils.showNotification) {
            AppUtils.showNotification('Sesión cerrada correctamente', 'success');
        }
        
        // Redirigir a la página principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Redirigir de todos modos
        window.location.href = 'index.html';
    }
}
