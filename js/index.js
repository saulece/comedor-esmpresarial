/**
 * Funcionalidad principal para la página de inicio
 * Maneja el inicio de sesión de coordinadores
 */

// Importar módulos necesarios
import { db } from './firebase.js';
import StorageUtil from './storage-firestore.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de inicio inicializada');
    
    // Verificar que Firebase esté correctamente inicializado
    if (db) {
        console.log('Firebase inicializado correctamente');
    } else {
        console.error('Error al inicializar Firebase');
    }
    
    // Inicializar el formulario de inicio de sesión
    initCoordinatorLogin();
});

/**
 * Inicializa el formulario de inicio de sesión para coordinadores
 */
function initCoordinatorLogin() {
    const loginForm = document.getElementById('coordinator-login-form');
    const errorMessage = document.getElementById('login-error');
    
    if (!loginForm) return;
    
    // Verificar si ya hay una sesión activa
    checkExistingSession();
    
    // Manejar envío del formulario
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Ocultar mensaje de error previo
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        // Obtener código de acceso
        const accessCodeInput = document.getElementById('access-code');
        if (!accessCodeInput) return;
        
        const accessCode = accessCodeInput.value.trim().toUpperCase();
        
        // Validar formato del código (6 caracteres alfanuméricos)
        if (!validateAccessCode(accessCode)) {
            showLoginError('El código debe tener 6 caracteres alfanuméricos.');
            return;
        }
        
        // Verificar código de acceso (ahora es async)
        await verifyAccessCode(accessCode);
    });
}

/**
 * Valida el formato del código de acceso
 * @param {string} code - Código de acceso a validar
 * @returns {boolean} - true si el código es válido
 */
function validateAccessCode(code) {
    // Verificar que tenga 6 caracteres alfanuméricos
    return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Verifica el código de acceso contra la base de datos
 * @param {string} accessCode - Código de acceso a verificar
 */
async function verifyAccessCode(accessCode) {
    try {
        // Mostrar indicador de carga
        const loginBtn = document.querySelector('#coordinator-login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        }
        
        // Obtener todos los coordinadores (esperar a que se resuelva la promesa)
        const coordinators = await StorageUtil.Coordinators.getAll();
        
        // Buscar coordinador con el código de acceso proporcionado
        const coordinator = coordinators.find(c => c.accessCode === accessCode);
        
        // Restaurar botón
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Ingresar';
        }
        
        if (coordinator) {
            // Código válido, iniciar sesión
            loginCoordinator(coordinator);
        } else {
            // Código inválido, mostrar error
            showLoginError('Código de acceso inválido. Por favor, verifique e intente nuevamente.');
        }
    } catch (error) {
        console.error('Error al verificar código de acceso:', error);
        showLoginError('Error al verificar el código. Por favor, intente de nuevo.');
        
        // Restaurar botón en caso de error
        const loginBtn = document.querySelector('#coordinator-login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Ingresar';
        }
    }
}

/**
 * Inicia sesión para el coordinador
 * @param {Object} coordinator - Objeto coordinador
 */
function loginCoordinator(coordinator) {
    // Guardar información de sesión
    sessionStorage.setItem('coordinatorId', coordinator.id);
    sessionStorage.setItem('coordinatorName', coordinator.name);
    sessionStorage.setItem('loginTime', new Date().toISOString());
    
    // Redirigir a la página de coordinador
    window.location.href = 'coordinator.html';
}

/**
 * Muestra un mensaje de error en el formulario
 * @param {string} message - Mensaje de error a mostrar
 */
function showLoginError(message) {
    const errorMessage = document.getElementById('login-error');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

/**
 * Verifica si ya existe una sesión activa
 */
function checkExistingSession() {
    const coordinatorId = sessionStorage.getItem('coordinatorId');
    
    if (coordinatorId) {
        // Ya hay una sesión activa, redirigir a la página de coordinador
        window.location.href = 'coordinator.html';
    }
}

/**
 * Cierra la sesión del coordinador
 * Función expuesta globalmente para ser usada desde otras páginas
 */
function logoutCoordinator() {
    // Limpiar información de sesión
    sessionStorage.removeItem('coordinatorId');
    sessionStorage.removeItem('coordinatorName');
    sessionStorage.removeItem('loginTime');
    
    // Redirigir a la página de inicio
    window.location.href = 'index.html';
}
