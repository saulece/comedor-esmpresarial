/**
 * utils.js
 * Funciones de utilidad compartidas para toda la aplicación
 */

const AppUtils = {
    // Constantes compartidas
    DAYS_OF_WEEK: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    CATEGORIES: {
        'plato_fuerte': 'Plato Fuerte',
        'bebida': 'Bebida'
    },

    /**
     * Muestra una notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
     */
    showNotification: function(message, type = 'info') { // Default to 'info'
        try {
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`; // success, error, warning, info
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300); // Tiempo para la animación de salida
            }, 3000); // Duración de la notificación
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
        }
    },

    /**
     * Formatea una fecha para usarla en un input de tipo date (YYYY-MM-DD)
     * @param {Date} dateObj - Objeto Date a formatear
     * @returns {string} - Fecha formateada
     */
    formatDateForInput: function(dateObj) {
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            console.error("formatDateForInput: Se esperaba un objeto Date válido. Recibido:", dateObj);
            // Devolver la fecha actual formateada como fallback o un string vacío
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        // Usar los métodos get de Date que no dependen de la zona horaria local para la lógica interna
        // pero el formateo final para el input debe ser en el formato que el input espera (generalmente basado en local).
        // Sin embargo, para consistencia, si todo es UTC internamente, el input también debería serlo.
        // Por ahora, mantenemos la lógica original que suele funcionar bien para inputs date.
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Formatea una fecha para mostrarla al usuario (ej: "13 de mayo de 2025")
     * @param {Date|string} dateInput - Objeto Date o string de fecha (idealmente YYYY-MM-DD o ISO)
     * @returns {string} - Fecha formateada
     */
    formatDate: function(dateInput) {
        let dateObj;
        if (typeof dateInput === 'string') {
            // Si el string es solo YYYY-MM-DD, el constructor de Date lo trata como UTC.
            // Si tiene T00:00:00 sin Z, lo trata como local.
            // Para asegurar consistencia si las fechas de Firestore son strings YYYY-MM-DD:
            dateObj = new Date(dateInput + 'T00:00:00Z'); // Interpretar como UTC
        } else if (dateInput instanceof Date) {
            dateObj = dateInput;
        } else {
            console.error("formatDate: Se esperaba un objeto Date o string. Recibido:", dateInput);
            return "Fecha inválida";
        }

        if (isNaN(dateObj.getTime())) {
            console.error("formatDate: Fecha parseada inválida. Original:", dateInput);
            return "Fecha inválida";
        }
        const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        return dateObj.toLocaleDateString('es-ES', options);
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppUtils;
} else {
    // Para uso en navegador
    window.AppUtils = AppUtils;
}