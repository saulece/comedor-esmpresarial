/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Inicialización del sistema de almacenamiento
 * 
 * Este archivo inicializa el sistema de almacenamiento, configurando IndexedDB
 * como almacenamiento principal y localStorage como fallback.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando sistema de almacenamiento...');
  
  // Inicializar el servicio de almacenamiento
  StorageService.init({
    migrationProgressCallback: function(progress) {
      console.log(`Progreso de migración: ${progress.percentage}% (${progress.current}/${progress.total})`);
    }
  })
  .then(() => {
    console.log('Sistema de almacenamiento inicializado correctamente.');
    
    // Inicializar el gestor de almacenamiento
    StorageManager.init();
    
    // Verificar espacio disponible
    StorageManager.checkStorageSpace()
      .then(spaceInfo => {
        if (spaceInfo.percentUsed > 80) {
          console.warn(`Advertencia: El almacenamiento está al ${spaceInfo.percentUsed}% de capacidad.`);
        }
      });
  })
  .catch(error => {
    console.error('Error al inicializar el sistema de almacenamiento:', error);
    
    // Mostrar mensaje de error al usuario
    if (typeof Components !== 'undefined') {
      Components.showToast('Error al inicializar el almacenamiento. Algunas funciones pueden no estar disponibles.', 'error', 5000);
    }
  });
});
