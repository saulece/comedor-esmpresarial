/**
 * firebase-config.js
 * Configuración y inicialización de Firebase para la aplicación Comedor Empresarial
 */

// Importar funciones necesarias de Firebase
// Nota: Como estamos usando JS vanilla sin bundlers, usamos la versión CDN
// Las importaciones se manejan a través de los scripts cargados en el HTML

// Configuración de Firebase para la aplicación
const firebaseConfig = {
  apiKey: "AIzaSyDyCRgqHkCy7gusyAeB724Okmc4IVXNXIE",
  authDomain: "comedor-empresarial.firebaseapp.com",
  projectId: "comedor-empresarial",
  storageBucket: "comedor-empresarial.firebasestorage.app",
  messagingSenderId: "786660040665",
  appId: "1:786660040665:web:2c25dff6524f57f763c3c8"
};

// Inicializar Firebase (se exporta para uso en otros módulos)
let firebaseApp;
let db;

// Función para inicializar Firebase
function initFirebase() {
  // Verificar que firebase esté disponible (cargado vía CDN)
  if (typeof firebase !== 'undefined') {
    // Inicializar Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    
    // Inicializar Firestore
    db = firebase.firestore();
    console.log('Firebase inicializado correctamente');
    return true;
  } else {
    console.error('Firebase no está disponible. Asegúrate de incluir los scripts de Firebase en tu HTML');
    return false;
  }
}

// Exportar para uso en otros módulos
const FirebaseService = {
  initFirebase,
  getFirestore: () => db,
  getApp: () => firebaseApp
};
