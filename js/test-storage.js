/**
 * test-storage.js
 * Script para probar la funcionalidad de los modelos y el almacenamiento
 */

// Importar el módulo de almacenamiento de Firestore
import StorageUtil from './storage-firestore.js';
// Importar modelos si son necesarios
import { Coordinator, Menu, Confirmation } from './models.js';

// Función para ejecutar las pruebas
function runTests() {
    console.log('Iniciando pruebas de almacenamiento...');
    
    // Limpiar almacenamiento para pruebas
    StorageUtil.clear();
    StorageUtil.initStorage();
    
    // Prueba 1: Crear y almacenar modelos
    console.log('Prueba 1: Crear y almacenar modelos');
    
    // Crear coordinador
    const coordinator = new Coordinator(
        null, 
        'Juan Pérez', 
        'juan.perez@empresa.com', 
        '555-123-4567', 
        'Recursos Humanos'
    );
    
    // Validar coordinador
    const coordValidation = coordinator.validate();
    console.log('Validación de coordinador:', coordValidation);
    
    // Guardar coordinador
    const coordSaved = StorageUtil.Coordinators.add(coordinator);
    console.log('Coordinador guardado:', coordSaved);
    
    // Crear menú
    const menu = new Menu(
        null,
        'Menú Semanal',
        [
            {
                id: 'item_1',
                name: 'Ensalada César',
                description: 'Ensalada fresca con aderezo César',
                category: 'entrada',
                price: 50
            },
            {
                id: 'item_2',
                name: 'Pollo a la parrilla',
                description: 'Pechuga de pollo a la parrilla con verduras',
                category: 'plato fuerte',
                price: 120
            },
            {
                id: 'item_3',
                name: 'Pastel de chocolate',
                description: 'Pastel de chocolate con fresas',
                category: 'postre',
                price: 45
            }
        ],
        new Date()
    );
    
    // Validar menú
    const menuValidation = menu.validate();
    console.log('Validación de menú:', menuValidation);
    
    // Guardar menú
    const menuSaved = StorageUtil.Menus.add(menu);
    console.log('Menú guardado:', menuSaved);
    
    // Crear confirmación
    const confirmation = new Confirmation(
        null,
        menu.id,
        coordinator.id,
        new Date(),
        'pending',
        [
            { itemId: 'item_1', quantity: 10, notes: 'Sin crutones' },
            { itemId: 'item_2', quantity: 10, notes: '' },
            { itemId: 'item_3', quantity: 10, notes: 'Para celebración' }
        ]
    );
    
    // Validar confirmación
    const confirmationValidation = confirmation.validate();
    console.log('Validación de confirmación:', confirmationValidation);
    
    // Guardar confirmación
    const confirmationSaved = StorageUtil.Confirmations.add(confirmation);
    console.log('Confirmación guardada:', confirmationSaved);
    
    // Prueba 2: Recuperar datos
    console.log('\nPrueba 2: Recuperar datos');
    
    // Obtener todos los coordinadores
    const allCoordinators = StorageUtil.Coordinators.getAll();
    console.log('Todos los coordinadores:', allCoordinators);
    
    // Obtener coordinador por ID
    const retrievedCoordinator = StorageUtil.Coordinators.get(coordinator.id);
    console.log('Coordinador recuperado por ID:', retrievedCoordinator);
    
    // Obtener todos los menús
    const allMenus = StorageUtil.Menus.getAll();
    console.log('Todos los menús:', allMenus);
    
    // Obtener menú por ID
    const retrievedMenu = StorageUtil.Menus.get(menu.id);
    console.log('Menú recuperado por ID:', retrievedMenu);
    
    // Obtener todas las confirmaciones
    const allConfirmations = StorageUtil.Confirmations.getAll();
    console.log('Todas las confirmaciones:', allConfirmations);
    
    // Obtener confirmación por ID
    const retrievedConfirmation = StorageUtil.Confirmations.get(confirmation.id);
    console.log('Confirmación recuperada por ID:', retrievedConfirmation);
    
    // Prueba 3: Actualizar datos
    console.log('\nPrueba 3: Actualizar datos');
    
    // Actualizar coordinador
    const coordUpdateResult = StorageUtil.Coordinators.update(coordinator.id, {
        phone: '555-987-6543',
        department: 'Administración'
    });
    console.log('Resultado de actualización de coordinador:', coordUpdateResult);
    
    // Verificar actualización
    const updatedCoordinator = StorageUtil.Coordinators.get(coordinator.id);
    console.log('Coordinador actualizado:', updatedCoordinator);
    
    // Actualizar menú
    const menuUpdateResult = StorageUtil.Menus.update(menu.id, {
        name: 'Menú Ejecutivo',
        active: true
    });
    console.log('Resultado de actualización de menú:', menuUpdateResult);
    
    // Verificar actualización
    const updatedMenu = StorageUtil.Menus.get(menu.id);
    console.log('Menú actualizado:', updatedMenu);
    
    // Actualizar confirmación
    const confirmationUpdateResult = StorageUtil.Confirmations.update(confirmation.id, {
        status: 'confirmed'
    });
    console.log('Resultado de actualización de confirmación:', confirmationUpdateResult);
    
    // Verificar actualización
    const updatedConfirmation = StorageUtil.Confirmations.get(confirmation.id);
    console.log('Confirmación actualizada:', updatedConfirmation);
    
    // Prueba 4: Exportar e importar datos
    console.log('\nPrueba 4: Exportar e importar datos');
    
    // Exportar datos
    const exportedData = StorageUtil.exportData();
    console.log('Datos exportados:', exportedData);
    
    // Limpiar almacenamiento
    StorageUtil.clear();
    
    // Verificar que se haya limpiado
    const emptyCoordinators = StorageUtil.Coordinators.getAll();
    console.log('Coordinadores después de limpiar:', emptyCoordinators);
    
    // Importar datos
    const importResult = StorageUtil.importData(exportedData);
    console.log('Resultado de importación:', importResult);
    
    // Verificar datos importados
    const importedCoordinators = StorageUtil.Coordinators.getAll();
    console.log('Coordinadores después de importar:', importedCoordinators);
    
    const importedMenus = StorageUtil.Menus.getAll();
    console.log('Menús después de importar:', importedMenus);
    
    const importedConfirmations = StorageUtil.Confirmations.getAll();
    console.log('Confirmaciones después de importar:', importedConfirmations);
    
    console.log('\nPruebas completadas.');
}

// Ejecutar pruebas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear botón para ejecutar pruebas
    const testButton = document.createElement('button');
    testButton.textContent = 'Ejecutar Pruebas';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '1000';
    testButton.style.padding = '10px 20px';
    testButton.style.backgroundColor = '#f39c12';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', runTests);
    
    document.body.appendChild(testButton);
});
