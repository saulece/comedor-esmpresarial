/**
 * debug.js
 * Utilidades para depurar el almacenamiento local (localStorage)
 * Este archivo proporciona funciones para inspeccionar y manipular
 * el almacenamiento local desde la consola del navegador.
 */

const StorageDebug = {
    /**
     * Muestra el contenido actual de todas las colecciones en localStorage
     * @returns {Object} - Objeto con todas las colecciones
     */
    showAll: function() {
        const result = {};
        
        // Obtener todas las colecciones
        Object.values(StorageUtil.KEYS).forEach(key => {
            try {
                const data = localStorage.getItem(key);
                result[key] = data ? JSON.parse(data) : null;
            } catch (error) {
                result[key] = `ERROR: ${error.message}`;
            }
        });
        
        console.table(result);
        return result;
    },
    
    /**
     * Muestra el contenido de una colección específica
     * @param {string} collectionName - Nombre de la colección (sin el prefijo 'comedor_')
     * @returns {Array|Object} - Contenido de la colección
     */
    showCollection: function(collectionName) {
        const key = `comedor_${collectionName}`;
        try {
            const data = localStorage.getItem(key);
            const parsed = data ? JSON.parse(data) : null;
            
            if (Array.isArray(parsed)) {
                console.table(parsed);
            } else {
                console.log(parsed);
            }
            
            return parsed;
        } catch (error) {
            console.error(`Error al obtener la colección ${key}:`, error);
            return null;
        }
    },
    
    /**
     * Verifica si una colección existe y tiene elementos
     * @param {string} collectionName - Nombre de la colección (sin el prefijo 'comedor_')
     * @returns {boolean} - true si la colección existe y tiene elementos
     */
    checkCollection: function(collectionName) {
        const key = `comedor_${collectionName}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                console.log(`La colección ${key} no existe`);
                return false;
            }
            
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                console.log(`La colección ${key} existe y tiene ${parsed.length} elementos`);
                return parsed.length > 0;
            } else {
                console.log(`La colección ${key} existe y es un objeto`);
                return true;
            }
        } catch (error) {
            console.error(`Error al verificar la colección ${key}:`, error);
            return false;
        }
    },
    
    /**
     * Limpia una colección específica
     * @param {string} collectionName - Nombre de la colección (sin el prefijo 'comedor_')
     * @returns {boolean} - true si se limpió correctamente
     */
    clearCollection: function(collectionName) {
        const key = `comedor_${collectionName}`;
        try {
            localStorage.setItem(key, JSON.stringify([]));
            console.log(`Colección ${key} limpiada correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al limpiar la colección ${key}:`, error);
            return false;
        }
    },
    
    /**
     * Restablece el estado de inicialización para forzar una reinicialización
     * @returns {boolean} - true si se restableció correctamente
     */
    resetInitialization: function() {
        try {
            localStorage.removeItem('comedor_app_initialized');
            console.log('Estado de inicialización restablecido. Recarga la página para reinicializar el almacenamiento.');
            return true;
        } catch (error) {
            console.error('Error al restablecer el estado de inicialización:', error);
            return false;
        }
    },
    
    /**
     * Muestra el estado de inicialización
     * @returns {boolean} - true si el almacenamiento está inicializado
     */
    checkInitialization: function() {
        const initialized = localStorage.getItem('comedor_app_initialized') === 'true';
        console.log(`Estado de inicialización: ${initialized ? 'Inicializado' : 'No inicializado'}`);
        return initialized;
    },
    
    /**
     * Guarda un elemento de prueba en una colección
     * @param {string} collectionName - Nombre de la colección (sin el prefijo 'comedor_')
     * @returns {boolean} - true si se guardó correctamente
     */
    addTestItem: function(collectionName) {
        const key = `comedor_${collectionName}`;
        try {
            const testItem = {
                id: 'test_' + Date.now(),
                name: 'Elemento de prueba',
                createdAt: new Date().toISOString()
            };
            
            const data = localStorage.getItem(key);
            const collection = data ? JSON.parse(data) : [];
            
            if (!Array.isArray(collection)) {
                console.error(`La colección ${key} no es un array`);
                return false;
            }
            
            collection.push(testItem);
            localStorage.setItem(key, JSON.stringify(collection));
            
            console.log(`Elemento de prueba agregado a ${key}:`, testItem);
            return true;
        } catch (error) {
            console.error(`Error al agregar elemento de prueba a ${key}:`, error);
            return false;
        }
    }
};

// Exponer el objeto StorageDebug globalmente
window.StorageDebug = StorageDebug;

console.log('Módulo de depuración cargado. Usa StorageDebug para inspeccionar el almacenamiento.');
console.log('Ejemplos:');
console.log('- StorageDebug.showAll() - Muestra todas las colecciones');
console.log('- StorageDebug.showCollection("menus") - Muestra los menús');
console.log('- StorageDebug.showCollection("coordinators") - Muestra los coordinadores');
console.log('- StorageDebug.checkCollection("menus") - Verifica si hay menús');
console.log('- StorageDebug.addTestItem("menus") - Agrega un menú de prueba');
