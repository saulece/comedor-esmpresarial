/**
 * utils.js
 * Funciones de utilidad compartidas para toda la aplicación
 */

const AppUtils = {
    /**
     * Constantes globales para categorias y dias de la semana
     */
    CATEGORIES: {
        'plato_fuerte': 'Platos Fuertes',
        'bebida': 'Bebidas',
        'entrada': 'Entradas',
        'postre': 'Postres',
        'guarnicion': 'Guarniciones'
    },
    
    DAYS_OF_WEEK: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    
    /**
     * Muestra una notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación ('success' o 'error')
     */
    showNotification: function(message, type = 'success') {
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
    },

    /**
     * Formatea una fecha para usarla en un input de tipo date
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
     * @param {Date|string} date - Fecha a formatear o string en formato ISO
     * @returns {string} - Fecha formateada (ej: "15 de abril de 2025")
     */
    formatDate: function(date) {
        // Si es un string, convertir a objeto Date
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
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
