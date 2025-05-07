/**
 * Funcionalidad principal para la página de inicio
 * Maneja el inicio de sesión de coordinadores
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de inicio inicializada');
    initCoordinatorLogin();
});

/**
 * Inicializa el formulario de inicio de sesión para coordinadores
 */
function initCoordinatorLogin() {
    const loginForm = document.getElementById('coordinator-login-form'); // ID del form en index.html
    const errorMessage = document.getElementById('login-error');
    
    if (!loginForm) {
        console.error("Formulario de login 'coordinator-login-form' no encontrado en index.html.");
        return;
    }
    
    // Opcional: Verificar si ya hay una sesión activa y el usuario está en index.html
    // checkExistingSessionAndRedirect(); 
    
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (errorMessage) errorMessage.style.display = 'none';
        
        const accessCodeInput = document.getElementById('access-code-main'); // ID del input en index.html
        if (!accessCodeInput) {
            console.error("Input de código de acceso 'access-code-main' no encontrado en index.html.");
            return;
        }
        
        const accessCode = accessCodeInput.value.trim().toUpperCase();
        
        if (!validateAccessCodeFormat(accessCode)) {
            showLoginError('El código debe tener 6 caracteres alfanuméricos.');
            return;
        }
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonHtml = submitButton ? submitButton.innerHTML : '<i class="fas fa-sign-in-alt"></i> Ingresar';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Verificando...';
        }
        
        try {
            const loginSuccessful = await verifyAccessCodeAndLogin(accessCode);

            if (!loginSuccessful && submitButton) { // Si el login falla (y no hubo excepción), restaurar el botón
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHtml;
            }
        } catch (error) {
            // El error ya se loguea en verifyAccessCodeAndLogin y se muestra al usuario
            // Aquí solo restauramos el botón si hubo una excepción no manejada allí.
            console.error('Excepción durante el proceso de login:', error); // Adicional para depuración
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHtml;
            }
        }
    });
}

/**
 * Valida el formato del código de acceso
 * @param {string} code - Código de acceso a validar
 * @returns {boolean} - true si el código es válido
 */
function validateAccessCodeFormat(code) {
    // Verificar que tenga 6 caracteres alfanuméricos
    return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Verifica el código de acceso contra la base de datos en Firebase y,
 * si es válido, guarda la sesión y redirige.
 * @param {string} accessCode - Código de acceso a verificar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si el login y redirección fueron exitosos, false si no.
 */
async function verifyAccessCodeAndLogin(accessCode) {
    console.log('Verificando código de acceso en Firebase desde index.js:', accessCode);
    
    try {
        // Asegurarse que FirebaseCoordinatorModel está disponible
        if (typeof FirebaseCoordinatorModel === 'undefined' || typeof FirebaseCoordinatorModel.verifyAccessCode !== 'function') {
            console.error('FirebaseCoordinatorModel no está disponible o no tiene el método verifyAccessCode.');
            showLoginError('Error del sistema. Intente más tarde.');
            return false;
        }

        const coordinator = await FirebaseCoordinatorModel.verifyAccessCode(accessCode);
        
        if (coordinator) {
            console.log('Código válido para coordinador:', coordinator.name, coordinator.id);
            // Guardar información de sesión
            sessionStorage.setItem('coordinatorId', coordinator.id);
            sessionStorage.setItem('coordinatorName', coordinator.name);
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            // Mostrar notificación de bienvenida y redirigir
            if (typeof AppUtils !== 'undefined' && typeof AppUtils.showNotification === 'function') {
                AppUtils.showNotification(`Bienvenido, ${coordinator.name}. Redirigiendo...`, 'success');
            } else {
                alert(`Bienvenido, ${coordinator.name}. Redirigiendo...`); // Fallback si AppUtils no está
            }
            
            // Pequeño delay para que se vea la notificación antes de redirigir
            setTimeout(() => {
                window.location.href = 'coordinator.html';
            }, 1200); // Un poco más de tiempo para ver la notificación
            return true; // Login y redirección iniciados
        } else {
            console.log('Código de acceso inválido o coordinador no activo.');
            showLoginError('Código de acceso inválido o el coordinador no está activo. Verifique e intente nuevamente.');
            return false; // Código inválido
        }
    } catch (error) {
        console.error('Error al verificar código de acceso en Firebase:', error);
        showLoginError('Error al conectar con el servidor para verificar el código. Por favor, intente más tarde.');
        // No relanzar el error aquí, ya que se maneja mostrando un mensaje al usuario.
        return false; // Indicar que el login falló
    }
}


/**
 * Muestra un mensaje de error en el formulario de login
 * @param {string} message - Mensaje de error a mostrar
 */
function showLoginError(message) {
    const errorMessage = document.getElementById('login-error');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    } else {
        console.warn("Elemento de error 'login-error' no encontrado para mostrar: " + message);
    }
}

/**
 * Verifica si ya existe una sesión activa.
 * Si el usuario está en index.html y ya tiene una sesión, podría ser útil
 * ofrecer un enlace rápido a su panel o simplemente no hacer nada.
 * La redirección forzada desde index.html si hay sesión puede ser molesta.
 */
function checkExistingSessionAndRedirect() {
    const coordinatorId = sessionStorage.getItem('coordinatorId');
    // Solo redirigir si estamos en index.html y hay un coordinatorId
    if (coordinatorId && window.location.pathname.includes('index.html')) {
        console.log("Sesión de coordinador existente detectada en index.html, redirigiendo a coordinator.html...");
        // Descomentar la siguiente línea si quieres forzar la redirección:
        // window.location.href = 'coordinator.html';
    }
}

// Nota: La función logoutCoordinator() generalmente no se necesita en index.js.
// Se usa en las páginas donde el usuario está logueado (como coordinator.html)
// para cerrar su sesión y usualmente redirigir a index.html.