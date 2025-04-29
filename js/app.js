/**
 * Aplicación principal del Sistema de Confirmación de Asistencias
 * Inicializa todos los módulos y configura la aplicación
 */

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar sistema de autenticación
  Auth.init();
  
  // Inicializar sistema de gestión de almacenamiento
  if (typeof StorageManager !== 'undefined') {
    try {
      StorageManager.init();
      console.log('Sistema de gestión de almacenamiento inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el sistema de gestión de almacenamiento:', error);
    }
  } else {
    console.error('StorageManager no está disponible. Verifica que el archivo js/storage-manager.js esté incluido en index.html antes de app.js');
  }
  
  // Inicializar módulos de análisis de rendimiento UI
  if (typeof UIPerformanceAnalyzer !== 'undefined') {
    try {
      // Inicializar analizador de rendimiento
      UIPerformanceAnalyzer.init({
        enabled: true,
        logLevel: 'info'
      });
      
      // Inicializar métricas de rendimiento
      if (typeof UIPerformanceMetrics !== 'undefined') {
        UIPerformanceMetrics.init();
      }
      
      // Inicializar dashboard de rendimiento
      if (typeof UIPerformanceDashboard !== 'undefined') {
        UIPerformanceDashboard.init();
      }
      
      console.log('Sistema de análisis de rendimiento UI inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el sistema de análisis de rendimiento UI:', error);
    }
  }
  
  // Inicializar módulo de administrador
  Admin.init();
  
  // Inicializar módulo de coordinador
  Coordinator.init();
  
  // Inicializar sistema de notificaciones global
  _initializeGlobalNotifications();
});

/**
 * Inicializa el sistema de notificaciones global
 * @private
 */
function _initializeGlobalNotifications() {
  // Crear contenedor de toasts si no existe
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Reemplazar las funciones de notificación antiguas con las nuevas
  window.showNotification = function(message, type = 'info', duration = 3000) {
    Components.showToast(message, type, duration);
  };
  
  window.showSuccessNotification = function(message, duration = 3000) {
    Components.showToast(message, 'success', duration);
  };
  
  window.showErrorNotification = function(message, duration = 3000) {
    Components.showToast(message, 'danger', duration);
  };
  
  window.showWarningNotification = function(message, duration = 3000) {
    Components.showToast(message, 'warning', duration);
  };
  
  window.showInfoNotification = function(message, duration = 3000) {
    Components.showToast(message, 'info', duration);
  };
  
  // Función global para mostrar diálogos de confirmación
  window.showConfirmDialog = function(options) {
    Components.confirm(options);
  };
}
