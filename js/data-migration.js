/**
 * data-migration.js
 * Utilidades para migrar datos de localStorage a Firestore
 * Este módulo proporciona funciones para migrar datos existentes
 * de localStorage a Firestore para permitir sincronización entre dispositivos.
 */

import { db, collection, doc, setDoc, getDoc, addDoc, onSnapshot } from './firebase.js';

// Claves de localStorage a migrar
const LOCAL_STORAGE_KEYS = {
    USERS: 'comedor_users',
    DISHES: 'comedor_dishes',
    MENUS: 'comedor_menus',
    COORDINATORS: 'comedor_coordinators',
    CONFIRMATIONS: 'comedor_confirmations',
    ORDERS: 'comedor_orders',
    ATTENDANCE_CONFIRMATIONS: 'attendanceConfirmations'
};

// Mapeo de claves de localStorage a colecciones de Firestore
const COLLECTION_MAPPING = {
    'comedor_users': 'users',
    'comedor_dishes': 'dishes',
    'comedor_menus': 'menus',
    'comedor_coordinators': 'coordinators',
    'comedor_confirmations': 'confirmations',
    'comedor_orders': 'orders',
    'attendanceConfirmations': 'attendance_confirmations',
    'comedor_app_state': 'app_state'
};

/**
 * Migra datos de localStorage a Firestore
 * @returns {Promise<boolean>} - true si la migración se completó correctamente
 */
export async function migrateLocalDataToFirestore() {
    console.log('Iniciando migración de datos locales a Firestore...');
    
    // Verificar si ya se ha realizado la migración
    try {
        const migrationDoc = await getDoc(doc(db, 'app_state', 'migration_status'));
        if (migrationDoc.exists() && migrationDoc.data().completed) {
            console.log('La migración ya se realizó anteriormente');
            return true;
        }
    } catch (error) {
        console.error('Error al verificar estado de migración:', error);
    }
    
    // Migrar cada colección
    for (const [localKey, firestoreCollection] of Object.entries(COLLECTION_MAPPING)) {
        try {
            // Obtener datos de localStorage
            const localData = localStorage.getItem(localKey);
            
            if (localData) {
                const parsedData = JSON.parse(localData);
                
                // Si es un array, migrar cada elemento
                if (Array.isArray(parsedData)) {
                    for (const item of parsedData) {
                        if (item.id) {
                            // Usar el ID existente
                            await setDoc(doc(db, firestoreCollection, item.id), item);
                        } else {
                            // Generar un nuevo ID
                            const newDocRef = doc(collection(db, firestoreCollection));
                            item.id = newDocRef.id;
                            await setDoc(newDocRef, item);
                        }
                    }
                    console.log(`Migrados ${parsedData.length} elementos de ${localKey} a ${firestoreCollection}`);
                } else if (typeof parsedData === 'object') {
                    // Si es un objeto, migrarlo directamente
                    const docId = localKey === 'comedor_app_state' ? 'state' : 'data';
                    await setDoc(doc(db, firestoreCollection, docId), parsedData);
                    console.log(`Migrado objeto de ${localKey} a ${firestoreCollection}`);
                }
            }
        } catch (error) {
            console.error(`Error al migrar ${localKey}:`, error);
        }
    }
    
    // Marcar la migración como completada
    try {
        await setDoc(doc(db, 'app_state', 'migration_status'), {
            completed: true,
            timestamp: new Date().toISOString(),
            device: navigator.userAgent
        });
        console.log('Migración completada y registrada');
        return true;
    } catch (error) {
        console.error('Error al registrar estado de migración:', error);
        return false;
    }
}

/**
 * Muestra un indicador de estado de conexión
 * @param {Function} callback - Función a llamar cuando cambia el estado de conexión
 * @returns {Function} - Función para detener la monitorización
 */
export function monitorConnectionState(callback) {
    try {
        const connStateRef = doc(db, '.info', 'connected');
        return onSnapshot(connStateRef, (snap) => {
            const isConnected = snap.data()?.connected || false;
            callback(isConnected);
        });
    } catch (error) {
        console.error('Error al monitorear estado de conexión:', error);
        // Llamar al callback con estado desconectado en caso de error
        callback(false);
        return () => {}; // Función vacía para detener la monitorización
    }
}
