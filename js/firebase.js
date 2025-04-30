// js/firebase.js
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    enableIndexedDbPersistence,
    addDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Usar la instancia de Firebase inicializada globalmente
let db;

// Verificar si Firebase ya está inicializado globalmente
if (window.firestoreDB) {
    console.log('Usando instancia de Firebase global');
    db = window.firestoreDB;
} else {
    console.error('Firebase no está inicializado globalmente. Esto puede causar problemas.');
    // Intentar inicializar Firebase aquí como respaldo (no debería ser necesario)
    try {
        // Importar dinámicamente
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js').then(({ initializeApp }) => {
            import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then(({ getFirestore }) => {
                const firebaseConfig = {
                    apiKey: "AIzaSyDyCRgqHkCy7gusyAeB724Okmc4IVXNXIE",
                    authDomain: "comedor-empresarial.firebaseapp.com",
                    projectId: "comedor-empresarial",
                    storageBucket: "comedor-empresarial.firebasestorage.app",
                    messagingSenderId: "786660040665",
                    appId: "1:786660040665:web:2c25dff6524f57f763c3c8"
                };
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                console.log('Firebase inicializado como respaldo');
            });
        });
    } catch (error) {
        console.error('Error al inicializar Firebase como respaldo:', error);
    }
}

// Exportar la instancia de Firestore y todas las funciones necesarias
export { 
    db, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    enableIndexedDbPersistence,
    addDoc,
    onSnapshot
};

// Habilitar persistencia offline para Firestore
if (db) {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log('Persistencia offline habilitada correctamente');
        })
        .catch((err) => {
            console.error('Error al habilitar persistencia offline:', err);
            if (err.code == 'failed-precondition') {
                // Múltiples pestañas abiertas, solo una puede usar persistencia
                console.warn('La persistencia offline solo funciona en una pestaña a la vez');
            } else if (err.code == 'unimplemented') {
                // El navegador actual no soporta persistencia
                console.warn('Este navegador no soporta persistencia offline');
            }
        });
}

// Función para verificar y configurar el acceso a Firestore
export async function verifyFirestoreAccess() {
    try {
        console.log('Verificando acceso a Firestore...');
        
        // Intentar leer datos para verificar el acceso
        const testRef = doc(db, 'app_state', 'access_test');
        
        // Intentar escribir datos de prueba
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            device: navigator.userAgent,
            test: 'cross_device_access'
        });
        
        console.log('Acceso a Firestore verificado correctamente');
        return true;
    } catch (error) {
        console.error('Error al verificar acceso a Firestore:', error);
        
        // Mostrar mensaje de error al usuario
        alert('Error de acceso a la base de datos. Es posible que necesites configurar las reglas de seguridad de Firestore.\n\nPara solucionar este problema, sigue estos pasos:\n1. Ve a la consola de Firebase (https://console.firebase.google.com)\n2. Selecciona tu proyecto "comedor-empresarial"\n3. Ve a Firestore Database > Reglas\n4. Actualiza las reglas con las siguientes:\n\nrules_version = "2";\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}\n\nNota: Estas reglas permiten acceso completo a la base de datos. Para producción, deberías implementar reglas más restrictivas.');
        
        return false;
    }
}

// Funciones utilitarias para Firestore
export const getCollectionRef = (collectionName) => collection(db, collectionName);
export const getDocRef = (collectionName, docId) => doc(db, collectionName, docId);
export const createQuery = (collectionRef, ...conditions) => {
    let q = query(collectionRef);
    if (conditions && conditions.length > 0) {
        conditions.forEach(([field, operator, value]) => {
            q = query(q, where(field, operator, value));
        });
    }
    return q;
};

// Función para inicializar las colecciones básicas
export async function initializeCollections() {
    try {
        // Inicializa la colección de estado de la app
        const appStateRef = doc(db, 'app_state', 'state');
        const appStateDoc = await getDoc(appStateRef);
        
        if (!appStateDoc.exists()) {
            await setDoc(appStateRef, {
                initialized: true,
                lastUpdate: new Date().toISOString(),
                version: '1.0.0'
            });
        }
        
        console.log('Colecciones inicializadas correctamente');
        return true;
    } catch (error) {
        console.error('Error al inicializar colecciones:', error);
        return false;
    }
}
