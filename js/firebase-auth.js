/**
 * firebase-auth.js
 * Gestión de autenticación con Firebase para el sistema de comedor empresarial
 * Este módulo proporciona funciones para iniciar sesión, cerrar sesión y verificar el estado de autenticación
 */

import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';

const FirebaseAuth = {
  /**
   * Usuario actual autenticado
   */
  currentUser: null,

  /**
   * Inicializa el sistema de autenticación y configura el listener para cambios de estado
   * @returns {Promise} Promesa que se resuelve cuando se ha inicializado la autenticación
   */
  init: function() {
    return new Promise((resolve) => {
      // Configurar el listener para cambios en el estado de autenticación
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        console.log('Estado de autenticación cambiado:', user ? 'Usuario autenticado' : 'Usuario no autenticado');
        resolve(user);
      });
    });
  },

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} Promesa que se resuelve con el usuario autenticado
   */
  login: async function(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo usuario con email y contraseña
   * @param {string} email - Email del nuevo usuario
   * @param {string} password - Contraseña del nuevo usuario
   * @returns {Promise} Promesa que se resuelve con el usuario creado
   */
  register: async function(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   * @returns {Promise} Promesa que se resuelve cuando se ha cerrado la sesión
   */
  logout: async function() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns {boolean} true si hay un usuario autenticado, false en caso contrario
   */
  isAuthenticated: function() {
    return this.currentUser !== null;
  },

  /**
   * Obtiene el ID del usuario actual
   * @returns {string|null} ID del usuario actual o null si no hay usuario autenticado
   */
  getCurrentUserId: function() {
    return this.currentUser ? this.currentUser.uid : null;
  },

  /**
   * Obtiene el email del usuario actual
   * @returns {string|null} Email del usuario actual o null si no hay usuario autenticado
   */
  getCurrentUserEmail: function() {
    return this.currentUser ? this.currentUser.email : null;
  }
};

export default FirebaseAuth;
