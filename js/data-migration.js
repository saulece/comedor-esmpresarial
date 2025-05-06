/**
 * data-migration.js
 * Utilidades para migrar datos de localStorage a Firebase Firestore
 * Este módulo proporciona funciones para migrar los datos existentes
 * en localStorage a Firebase Firestore de forma segura.
 */

import { FirestoreUtil } from './firebase-storage.js';
import FirebaseAuth from './firebase-auth.js';

// Referencia al módulo StorageUtil original
import * as LocalStorage from './storage.js';
const StorageUtil = LocalStorage.default || LocalStorage;

const DataMigration = {
    /**
     * Migra todos los datos de localStorage a Firebase Firestore
     * @returns {Promise<boolean>} - Promesa que resuelve a true si la migración fue exitosa
     */
    migrateAllData: async function() {
        try {
            console.log('Iniciando migración de datos de localStorage a Firebase...');
            
            // Verificar que el usuario esté autenticado
            if (!FirebaseAuth.isAuthenticated()) {
                console.error('Se requiere autenticación para migrar datos');
                return false;
            }
            
            // Obtener todos los datos de localStorage
            const data = StorageUtil.exportData();
            
            // Mapear las claves de localStorage a colecciones de Firestore
            const collections = {
                [StorageUtil.KEYS.USERS]: FirestoreUtil.COLLECTIONS.USERS,
                [StorageUtil.KEYS.DISHES]: FirestoreUtil.COLLECTIONS.DISHES,
                [StorageUtil.KEYS.MENUS]: FirestoreUtil.COLLECTIONS.MENUS,
                [StorageUtil.KEYS.COORDINATORS]: FirestoreUtil.COLLECTIONS.COORDINATORS,
                [StorageUtil.KEYS.CONFIRMATIONS]: FirestoreUtil.COLLECTIONS.CONFIRMATIONS,
                [StorageUtil.KEYS.ORDERS]: FirestoreUtil.COLLECTIONS.ORDERS,
                [StorageUtil.KEYS.APP_STATE]: FirestoreUtil.COLLECTIONS.APP_STATE,
                [StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS]: FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS
            };
            
            // Migrar cada colección
            for (const key in collections) {
                const collectionName = collections[key];
                const items = StorageUtil.get(key, []);
                
                console.log(`Migrando colección ${key} a ${collectionName}...`);
                
                if (key === StorageUtil.KEYS.APP_STATE) {
                    // Para APP_STATE, guardar como documento 'main'
                    await FirestoreUtil.save(collectionName, 'main', items);
                } else if (Array.isArray(items)) {
                    // Para colecciones, guardar cada elemento individualmente
                    for (const item of items) {
                        if (!item.id) {
                            console.warn('Elemento sin ID, generando uno nuevo');
                            item.id = 'migrated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        }
                        await FirestoreUtil.save(collectionName, item.id, item);
                    }
                }
            }
            
            console.log('Migración completada exitosamente');
            return true;
        } catch (error) {
            console.error('Error durante la migración de datos:', error);
            return false;
        }
    },
    
    /**
     * Migra una colección específica de localStorage a Firebase Firestore
     * @param {string} key - Clave de localStorage para la colección a migrar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si la migración fue exitosa
     */
    migrateCollection: async function(key) {
        try {
            console.log(`Iniciando migración de colección ${key} a Firebase...`);
            
            // Verificar que el usuario esté autenticado
            if (!FirebaseAuth.isAuthenticated()) {
                console.error('Se requiere autenticación para migrar datos');
                return false;
            }
            
            // Mapear la clave de localStorage a una colección de Firestore
            const collectionName = this._mapKeyToCollection(key);
            
            // Obtener los datos de localStorage
            const items = StorageUtil.get(key, []);
            
            if (key === StorageUtil.KEYS.APP_STATE) {
                // Para APP_STATE, guardar como documento 'main'
                await FirestoreUtil.save(collectionName, 'main', items);
            } else if (Array.isArray(items)) {
                // Para colecciones, guardar cada elemento individualmente
                for (const item of items) {
                    if (!item.id) {
                        console.warn('Elemento sin ID, generando uno nuevo');
                        item.id = 'migrated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    }
                    await FirestoreUtil.save(collectionName, item.id, item);
                }
            }
            
            console.log(`Migración de colección ${key} completada exitosamente`);
            return true;
        } catch (error) {
            console.error(`Error durante la migración de colección ${key}:`, error);
            return false;
        }
    },
    
    /**
     * Verifica si los datos en Firebase Firestore coinciden con los de localStorage
     * @returns {Promise<Object>} - Promesa que resuelve con un objeto con el resultado de la verificación
     */
    verifyMigration: async function() {
        try {
            console.log('Verificando migración de datos...');
            
            // Verificar que el usuario esté autenticado
            if (!FirebaseAuth.isAuthenticated()) {
                console.error('Se requiere autenticación para verificar datos');
                return { success: false, error: 'Se requiere autenticación' };
            }
            
            // Obtener todos los datos de localStorage
            const localData = StorageUtil.exportData();
            
            // Mapear las claves de localStorage a colecciones de Firestore
            const collections = {
                [StorageUtil.KEYS.USERS]: FirestoreUtil.COLLECTIONS.USERS,
                [StorageUtil.KEYS.DISHES]: FirestoreUtil.COLLECTIONS.DISHES,
                [StorageUtil.KEYS.MENUS]: FirestoreUtil.COLLECTIONS.MENUS,
                [StorageUtil.KEYS.COORDINATORS]: FirestoreUtil.COLLECTIONS.COORDINATORS,
                [StorageUtil.KEYS.CONFIRMATIONS]: FirestoreUtil.COLLECTIONS.CONFIRMATIONS,
                [StorageUtil.KEYS.ORDERS]: FirestoreUtil.COLLECTIONS.ORDERS,
                [StorageUtil.KEYS.APP_STATE]: FirestoreUtil.COLLECTIONS.APP_STATE,
                [StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS]: FirestoreUtil.COLLECTIONS.ATTENDANCE_CONFIRMATIONS
            };
            
            const result = {
                success: true,
                collections: {}
            };
            
            // Verificar cada colección
            for (const key in collections) {
                const collectionName = collections[key];
                const localItems = StorageUtil.get(key, []);
                
                if (key === StorageUtil.KEYS.APP_STATE) {
                    // Para APP_STATE, verificar el documento 'main'
                    const firestoreItem = await FirestoreUtil.get(collectionName, 'main');
                    result.collections[key] = {
                        success: firestoreItem !== null,
                        localCount: 1,
                        firestoreCount: firestoreItem ? 1 : 0
                    };
                } else if (Array.isArray(localItems)) {
                    // Para colecciones, verificar cada elemento
                    const firestoreItems = await FirestoreUtil.getAll(collectionName);
                    
                    result.collections[key] = {
                        success: localItems.length === firestoreItems.length,
                        localCount: localItems.length,
                        firestoreCount: firestoreItems.length
                    };
                }
                
                if (!result.collections[key].success) {
                    result.success = false;
                }
            }
            
            console.log('Verificación completada:', result);
            return result;
        } catch (error) {
            console.error('Error durante la verificación de datos:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Mapea una clave de localStorage a un nombre de colección de Firestore
     * @private
     * @param {string} key - Clave de localStorage
     * @returns {string} - Nombre de la colección en Firestore
     */
    _mapKeyToCollection: function(key) {
        // Eliminar el prefijo 'comedor_' si existe
        const collection = key.replace('comedor_', '');
        return collection;
    }
};

export default DataMigration;
