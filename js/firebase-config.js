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

// Variables para almacenar las instancias de Firebase
let firebaseApp;
let db;
let firebaseInitialized = false;
let initializationAttempted = false;

// Servicio para manejar Firebase
const FirebaseService = {
  // Inicializar Firebase
  initFirebase: function() {
    // Si ya se intentó inicializar y falló, no intentar de nuevo
    if (initializationAttempted && !firebaseInitialized) {
      console.warn('Ya se intentó inicializar Firebase sin éxito. No se intentará de nuevo.');
      return false;
    }
    
    // Si ya está inicializado, no hacer nada
    if (firebaseInitialized) {
      return true;
    }
    
    initializationAttempted = true;
    
    // Verificar que firebase esté disponible (cargado vía CDN)
    if (typeof firebase === 'undefined') {
      console.error('Firebase no está disponible. Asegúrate de incluir los scripts de Firebase en tu HTML');
      return false;
    }
    
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
      firebaseInitialized = true;
      return true;
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
      return false;
    }
  },
  
  // Obtener la instancia de Firestore
  getFirestore: function() {
    if (!firebaseInitialized) {
      if (!this.initFirebase()) {
        throw new Error('No se pudo inicializar Firebase');
      }
    }
    return db;
  },
  
  // Verificar si Firebase está inicializado
  isInitialized: function() {
    return firebaseInitialized;
  }
};

// Inicializar Firebase automáticamente cuando se carga el script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando Firebase automáticamente...');
  FirebaseService.initFirebase();
});

// Intentar inicializar inmediatamente también (por si el DOM ya está cargado)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('DOM ya cargado, inicializando Firebase inmediatamente...');
  setTimeout(function() {
    FirebaseService.initFirebase();
  }, 1);
}
