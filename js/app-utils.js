/**
 * app-utils.js
 * Exporta las utilidades de AppUtils desde utils.js para mantener compatibilidad
 */

// Si AppUtils ya está definido en el contexto global (desde utils.js), usarlo
if (typeof AppUtils !== 'undefined') {
    console.log('AppUtils ya está definido, utilizando la instancia existente');
} else {
    // Si no está definido, crear un objeto AppUtils básico
    console.warn('AppUtils no está definido. Creando una implementación básica.');
    
    window.AppUtils = {
        /**
         * Muestra una notificación temporal
         * @param {string} message - Mensaje a mostrar
         * @param {string} type - Tipo de notificación ('success' o 'error')
         */
        showNotification: function(message, type = 'success') {
            console.log(`[Notificación ${type}]: ${message}`);
            
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
                
                // Ocultar después de un tiempo
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 5000);
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
            if (!date) return '';
            
            try {
                const d = date instanceof Date ? date : new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                
                return `${year}-${month}-${day}`;
            } catch (error) {
                console.error('Error al formatear fecha para input:', error);
                return '';
            }
        },
        
        /**
         * Formatea una fecha para mostrarla al usuario
         * @param {Date|string} date - Fecha a formatear o string en formato ISO
         * @returns {string} - Fecha formateada (ej: "15 de abril de 2025")
         */
        formatDate: function(date) {
            if (!date) return '';
            
            try {
                const d = date instanceof Date ? date : new Date(date);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return d.toLocaleDateString('es-ES', options);
            } catch (error) {
                console.error('Error al formatear fecha:', error);
                return '';
            }
        }
    };
}

// Asegurarse de que AppUtils esté disponible globalmente
window.AppUtils = AppUtils;
