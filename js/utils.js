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
        // Puedes añadir más categorías aquí si las necesitas en el futuro,
        // pero admin.js actualmente solo usa estas dos.
        // 'entrada': 'Entradas',
        // 'postre': 'Postres',
        // 'guarnicion': 'Guarniciones'
    },

    /**
     * Muestra una notificación temporal.
     * @param {string} message - Mensaje a mostrar.
     * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info'). Por defecto 'info'.
     */
    showNotification: function(message, type = 'info') {
        try {
            // Eliminar notificaciones existentes para evitar superposición
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Forzar reflujo para que la transición se aplique
            void notification.offsetWidth; 

            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
                // Esperar a que termine la animación de salida antes de eliminar el elemento
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300); // Este tiempo debe coincidir con la duración de la transición de salida en CSS
            }, 3000); // Duración de la notificación visible
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
        }
    },

    /**
     * Formatea un objeto Date para usarlo en un input de tipo date (YYYY-MM-DD).
     * El objeto Date de entrada se asume que representa la fecha deseada (ya sea local o UTC).
     * Esta función extrae año, mes y día de ese objeto Date.
     * @param {Date} dateObj - Objeto Date a formatear.
     * @returns {string} - Fecha formateada como "YYYY-MM-DD".
     */
    formatDateForInput: function(dateObj) {
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            console.error("formatDateForInput: Se esperaba un objeto Date válido. Recibido:", dateObj);
            const today = new Date(); // Fallback a hoy
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        // Para inputs type="date", el formato YYYY-MM-DD se interpreta generalmente
        // en la zona horaria del usuario, pero el valor se envía como UTC 00:00:00.
        // Extraer los componentes de la fecha sin conversión de zona horaria explícita aquí
        // suele ser lo más compatible con cómo los inputs date manejan las fechas.
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Formatea una fecha para mostrarla al usuario en un formato legible (ej: "13 de mayo de 2025").
     * Si se recibe un string, se intenta parsear como una fecha UTC para consistencia,
     * especialmente si son fechas "YYYY-MM-DD" que pueden ser ambiguas.
     * La salida se formatea para 'es-ES' y también en UTC para evitar cambios de día por zona horaria.
     * @param {Date|string} dateInput - Objeto Date o string de fecha (idealmente YYYY-MM-DD o ISO completo).
     * @returns {string} - Fecha formateada.
     */
    formatDate: function(dateInput) {
        let dateObj;
        if (typeof dateInput === 'string') {
            // Si el string es YYYY-MM-DD, el constructor de Date lo trata como UTC si no hay hora.
            // Si hay hora sin 'Z', lo trata como local.
            // Para forzar UTC desde YYYY-MM-DD:
            if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateObj = new Date(dateInput + 'T00:00:00.000Z');
            } else {
                dateObj = new Date(dateInput); // Dejar que el constructor de Date intente parsear otros formatos ISO
            }
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
        // Formatear usando opciones para mostrar la fecha como si fuera UTC,
        // esto evita que cambie el día al mostrarlo si la zona horaria local es diferente.
        const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        return dateObj.toLocaleDateString('es-ES', options);
    }
};

// Exportar para su uso en otros módulos (si usas un sistema de módulos como CommonJS o ES Modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppUtils;
} else {
    // Para uso directo en el navegador, AppUtils ya está en el scope global (window)
    // No es necesario window.AppUtils = AppUtils; aquí si el script se carga directamente.
}