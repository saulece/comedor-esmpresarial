// js/firebase.js
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Exportar la instancia de Firestore
export { db };

// Funciones utilitarias para Firestore
export const getCollectionRef = (collectionName) => collection(db, collectionName);
export const getDocRef = (collectionName, docId) => doc(db, collectionName, docId);
export const createQuery = (collectionRef, ...conditions) => {
    let q = query(collectionRef);
    conditions.forEach(([field, operator, value]) => {
        q = where(field, operator, value);
    });
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
