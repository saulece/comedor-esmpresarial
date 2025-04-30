/**
 * debug.js
 * Utilidades para depurar el almacenamiento en Firestore
 * Este archivo proporciona funciones para inspeccionar y manipular
 * el almacenamiento desde la consola del navegador.
 */

// Importar el módulo de almacenamiento de Firestore
import StorageUtil from './storage-firestore.js';
import { db } from './firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const StorageDebug = {
    /**
     * Muestra el contenido actual de todas las colecciones en Firestore
     * @returns {Promise<Object>} - Promesa que resuelve a un objeto con todas las colecciones
     */
    showAll: async function() {
        const result = {};
        
        // Obtener todas las colecciones
        for (const [name, collectionName] of Object.entries(StorageUtil.COLLECTIONS)) {
            try {
                const collectionRef = collection(db, collectionName);
                const snapshot = await getDocs(collectionRef);
                result[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                result[collectionName] = `ERROR: ${error.message}`;
            }
        }
        
        console.table(result);
        return result;
    },
    
    /**
     * Muestra el contenido de una colección específica
     * @param {string} collectionName - Nombre de la colección en Firestore
     * @returns {Promise<Array|Object>} - Promesa que resuelve al contenido de la colección
     */
    showCollection: async function(collectionName) {
        try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (Array.isArray(data)) {
                console.table(data);
            } else {
                console.log(data);
            }
            
            return data;
        } catch (error) {
            console.error(`Error al obtener la colección ${collectionName}:`, error);
            return null;
        }
    },
    
    /**
     * Verifica si una colección existe y tiene elementos
     * @param {string} collectionName - Nombre de la colección en Firestore
     * @returns {Promise<boolean>} - Promesa que resuelve a true si la colección existe y tiene elementos
     */
    checkCollection: async function(collectionName) {
        try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                console.log(`La colección ${collectionName} está vacía`);
                return false;
            } else {
                console.log(`La colección ${collectionName} existe y tiene ${snapshot.size} elementos`);
                return true;
            }
        } catch (error) {
            console.error(`Error al verificar la colección ${collectionName}:`, error);
            return false;
        }
    },
    
    /**
     * Limpia una colección específica
     * @param {string} collectionName - Nombre de la colección en Firestore
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se limpió correctamente
     */
    clearCollection: async function(collectionName) {
        try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                console.log(`La colección ${collectionName} ya está vacía`);
                return true;
            }
            
            // Eliminar todos los documentos en la colección
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`Colección ${collectionName} limpiada correctamente (${snapshot.size} documentos eliminados)`);
            return true;
        } catch (error) {
            console.error(`Error al limpiar la colección ${collectionName}:`, error);
            return false;
        }
    },
    
    /**
     * Restablece el estado de inicialización para forzar una reinicialización
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se restableció correctamente
     */
    resetInitialization: async function() {
        try {
            const stateRef = doc(db, 'app_state', 'state');
            await setDoc(stateRef, {
                initialized: false,
                lastUpdate: new Date().toISOString(),
                version: '1.0.0',
                reset: true
            });
            console.log('Estado de inicialización restablecido. Recarga la página para reinicializar el almacenamiento.');
            return true;
        } catch (error) {
            console.error('Error al restablecer el estado de inicialización:', error);
            return false;
        }
    },
    
    /**
     * Muestra el estado de inicialización
     * @returns {Promise<boolean>} - Promesa que resuelve a true si el almacenamiento está inicializado
     */
    checkInitialization: async function() {
        try {
            const stateRef = doc(db, 'app_state', 'state');
            const stateDoc = await getDoc(stateRef);
            
            if (stateDoc.exists()) {
                const initialized = stateDoc.data().initialized === true;
                console.log(`Estado de inicialización: ${initialized ? 'Inicializado' : 'No inicializado'}`);
                return initialized;
            } else {
                console.log('Estado de inicialización: No inicializado (documento no existe)');
                return false;
            }
        } catch (error) {
            console.error('Error al verificar el estado de inicialización:', error);
            return false;
        }
    },
    
    /**
     * Guarda un elemento de prueba en una colección
     * @param {string} collectionName - Nombre de la colección en Firestore
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    addTestItem: async function(collectionName) {
        try {
            const testItem = {
                name: 'Elemento de prueba',
                createdAt: new Date().toISOString(),
                testData: true
            };
            
            // Usar un ID generado automáticamente o uno personalizado
            const docId = 'test_' + Date.now();
            const docRef = doc(db, collectionName, docId);
            
            // Guardar el documento en Firestore
            await setDoc(docRef, testItem);
            
            console.log(`Elemento de prueba agregado a ${collectionName} con ID ${docId}:`, testItem);
            return true;
        } catch (error) {
            console.error(`Error al agregar elemento de prueba a ${collectionName}:`, error);
            return false;
        }
    }
};

// Exponer el objeto StorageDebug globalmente
window.StorageDebug = StorageDebug;

console.log('Módulo de depuración cargado. Usa StorageDebug para inspeccionar el almacenamiento en Firestore.');
console.log('NOTA: Todas las funciones son asíncronas y devuelven Promesas. Usa await o .then() para obtener los resultados.');
console.log('Ejemplos:');
console.log('- await StorageDebug.showAll() - Muestra todas las colecciones');
console.log('- await StorageDebug.showCollection("menus") - Muestra los menús');
console.log('- await StorageDebug.showCollection("coordinators") - Muestra los coordinadores');
console.log('- await StorageDebug.checkCollection("menus") - Verifica si hay menús');
console.log('- await StorageDebug.addTestItem("menus") - Agrega un menú de prueba');
console.log('- await StorageDebug.clearCollection("menus") - Limpia la colección de menús');
