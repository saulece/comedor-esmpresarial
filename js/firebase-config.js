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
  storageBucket: "comedor-empresarial.appspot.com",
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
    try {
      // Inicializar Firebase (solo si no está ya inicializado)
      if (!firebase.apps || !firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = firebase.app(); // Si ya está inicializado, usar la instancia existente
      }
      
      // Inicializar Firestore
      db = firebase.firestore();
      console.log('Firebase inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
      return false;
    }
  } else {
    console.error('Firebase no está disponible. Asegúrate de incluir los scripts de Firebase en tu HTML');
    return false;
  }
}

// Inicializar Firebase automáticamente cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
  const success = initFirebase();
  if (!success) {
    console.error('No se pudo inicializar Firebase. La aplicación no funcionará correctamente.');
  }
});

// Exportar para uso en otros módulos
const FirebaseService = {
  initFirebase,
  getFirestore: () => db,
  getApp: () => firebaseApp
};
