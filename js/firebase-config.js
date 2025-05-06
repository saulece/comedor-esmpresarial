/**
 * firebase-config.js
 * Configuración de Firebase para el sistema de comedor empresarial
 * Este archivo contiene la inicialización de Firebase y exporta las instancias necesarias
 */

// Importar las funciones necesarias de los SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Authentication
const auth = getAuth(app);

// Exportar las instancias y funciones de Firebase
export {
  app,
  db,
  auth,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
