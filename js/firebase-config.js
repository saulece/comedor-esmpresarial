/**
 * firebase-config.js
 * Configuración de Firebase para la aplicación de comedor empresarial
 */

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyCRgqHkCy7gusyAeB724Okmc4IVXNXIE",
  authDomain: "comedor-empresarial.firebaseapp.com",
  projectId: "comedor-empresarial",
  storageBucket: "comedor-empresarial.appspot.com",
  messagingSenderId: "786660040665",
  appId: "1:786660040665:web:2c25dff6524f57f763c3c8"
};

// Inicializar Firebase
if (typeof firebase !== 'undefined') {
  // Inicializar Firebase solo si no está ya inicializado
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Obtener referencias a servicios de Firebase
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  console.log('Firebase inicializado correctamente');
} else {
  console.error('Firebase no está disponible. Asegúrate de incluir los scripts de Firebase antes de este archivo.');
}

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
} else {
  // Para uso en navegador
  window.firebaseConfig = firebaseConfig;
}
