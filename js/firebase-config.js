/**
 * firebase-config.js
 * Configuración de Firebase para la aplicación de comedor empresarial
 */

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyCRgqHkCy7gusyAeB724Okmc4IVXNXIE", // Reemplaza con tu API Key si es diferente
  authDomain: "comedor-empresarial.firebaseapp.com",
  projectId: "comedor-empresarial",
  storageBucket: "comedor-empresarial.appspot.com",
  messagingSenderId: "786660040665",
  appId: "1:786660040665:web:2c25dff6524f57f763c3c8"
};

// Inicializar Firebase
let db = null; // Hacer db y auth accesibles fuera del if
let auth = null;

if (typeof firebase !== 'undefined') {
  // Inicializar Firebase solo si no está ya inicializado
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase App inicializada.');
    } catch (e) {
      console.error("Error inicializando Firebase App:", e);
    }
  } else {
    console.log('Firebase App ya estaba inicializada.');
  }
  
  // Obtener referencias a servicios de Firebase
  // Intentar inicializar Firestore
  try {
    if (typeof firebase.firestore === 'function') {
      db = firebase.firestore();
      console.log('Firebase Firestore servicio disponible.');
    } else {
      console.warn('Firebase Firestore servicio NO disponible.');
    }
  } catch(e) {
     console.error("Error obteniendo referencia a Firestore:", e);
  }

  // Solo intenta inicializar auth si la función existe (si se cargó firebase-auth.js)
  try {
    if (typeof firebase.auth === 'function') { 
        auth = firebase.auth(); 
        console.log('Firebase Authentication servicio disponible.');
    } else {
        console.warn('Firebase Authentication servicio NO disponible (firebase-auth.js no cargado en esta página).');
    }
  } catch (e) {
     console.error("Error obteniendo referencia a Auth:", e);
  }
  
  console.log('Configuración de Firebase procesada.');

} else {
  console.error('Firebase SDK no está disponible. Asegúrate de incluir los scripts de Firebase antes de este archivo.');
}

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, db, auth }; // Exportar db y auth si se usan directamente en otros módulos (aunque los modelos los obtienen de 'firebase.')
} else {
  // Para uso en navegador
  window.firebaseConfig = firebaseConfig;
  // Opcionalmente exponer db y auth globalmente si es necesario, aunque es mejor práctica importarlos o acceder vía `firebase.`
  // window.db = db; 
  // window.auth = auth; 
}