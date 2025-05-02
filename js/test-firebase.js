/**
 * test-firebase.js
 * Script para probar la conexión con Firebase y el guardado de menús
 */

// Función para probar la conexión con Firebase
async function testFirebaseConnection() {
    console.log('Iniciando prueba de conexión con Firebase...');
    
    try {
        // Verificar que FirebaseService esté disponible
        if (typeof FirebaseService === 'undefined') {
            throw new Error('FirebaseService no está disponible. Asegúrate de que firebase-config.js esté cargado.');
        }
        
        // Inicializar Firebase
        const initSuccess = FirebaseService.initFirebase();
        console.log('Inicialización de Firebase:', initSuccess ? 'Exitosa' : 'Fallida');
        
        // Verificar que StorageAdapter esté disponible
        if (typeof StorageAdapter === 'undefined') {
            throw new Error('StorageAdapter no está disponible. Asegúrate de que storage-adapter.js esté cargado.');
        }
        
        // Inicializar almacenamiento
        const storageInitSuccess = await StorageAdapter.initStorage();
        console.log('Inicialización de almacenamiento:', storageInitSuccess ? 'Exitosa' : 'Fallida');
        
        // Verificar que StorageUtil esté disponible
        if (typeof StorageUtil === 'undefined') {
            throw new Error('StorageUtil no está disponible. Asegúrate de que storage-adapter.js esté cargado completamente.');
        }
        
        // Probar la creación de un menú de prueba
        const testMenuId = 'test_menu_' + Date.now();
        const testMenu = {
            id: testMenuId,
            name: 'Menú de Prueba',
            startDate: '2025-05-02',
            endDate: '2025-05-06',
            active: true,
            days: [{
                id: 'lunes',
                name: 'Lunes',
                date: '2025-05-02',
                dishes: [{
                    id: 'dish_test_1',
                    name: 'Platillo de prueba',
                    category: 'plato_fuerte'
                }]
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('Intentando guardar menú de prueba:', testMenu);
        
        // Guardar menú de prueba
        const saveSuccess = await StorageUtil.Menus.add(testMenu);
        console.log('Guardado de menú de prueba:', saveSuccess ? 'Exitoso' : 'Fallido');
        
        if (saveSuccess) {
            // Intentar recuperar el menú guardado
            console.log('Intentando recuperar menú de prueba...');
            const retrievedMenu = await StorageUtil.Menus.get(testMenuId);
            console.log('Menú recuperado:', retrievedMenu);
            
            // Eliminar el menú de prueba
            console.log('Eliminando menú de prueba...');
            const deleteSuccess = await StorageUtil.Menus.delete(testMenuId);
            console.log('Eliminación de menú de prueba:', deleteSuccess ? 'Exitosa' : 'Fallida');
        }
        
        // Probar la obtención de todos los menús
        console.log('Obteniendo todos los menús...');
        const allMenus = await StorageUtil.Menus.getAll();
        console.log('Menús obtenidos:', allMenus);
        
        return {
            success: true,
            message: 'Prueba completada exitosamente',
            results: {
                firebaseInit: initSuccess,
                storageInit: storageInitSuccess,
                menuSave: saveSuccess,
                allMenus: allMenus
            }
        };
    } catch (error) {
        console.error('Error durante la prueba de Firebase:', error);
        return {
            success: false,
            message: 'Error durante la prueba: ' + error.message,
            error: error
        };
    }
}

// Ejecutar la prueba cuando se cargue el script
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar un momento para asegurar que todos los scripts se hayan cargado
    setTimeout(async function() {
        console.log('Ejecutando prueba de Firebase...');
        const result = await testFirebaseConnection();
        
        // Mostrar resultado en la consola
        console.log('Resultado de la prueba:', result);
        
        // Mostrar resultado en la página si existe un elemento con id 'test-result'
        const resultElement = document.getElementById('test-result');
        if (resultElement) {
            resultElement.innerHTML = `
                <h3>Resultado de la prueba de Firebase</h3>
                <p><strong>Estado:</strong> ${result.success ? 'Exitoso' : 'Fallido'}</p>
                <p><strong>Mensaje:</strong> ${result.message}</p>
                <pre>${JSON.stringify(result.results || result.error, null, 2)}</pre>
            `;
        }
    }, 1000);
});
