/**
 * firebase-user-management.js
 * Gestión de usuarios con Firebase Authentication para el sistema de comedor empresarial
 * Este módulo proporciona funciones para la gestión de usuarios, roles y permisos
 */

import { auth, db, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from './firebase-config.js';
import { logAuthOperation, logError } from './firebase-monitoring.js';

const UserManagement = {
    /**
     * Roles disponibles en el sistema
     */
    ROLES: {
        ADMIN: 'admin',
        COORDINATOR: 'coordinator',
        EMPLOYEE: 'employee'
    },

    /**
     * Registra un nuevo usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @param {string} name - Nombre completo del usuario
     * @param {string} role - Rol del usuario (admin, coordinator, employee)
     * @param {string} department - Departamento del usuario (opcional)
     * @returns {Promise<Object>} - Promesa que resuelve con el usuario creado
     */
    registerUser: async function(email, password, name, role, department = '') {
        try {
            // Crear usuario en Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Actualizar perfil con nombre
            await updateProfile(user, {
                displayName: name
            });
            
            // Guardar información adicional en Firestore
            const userData = {
                uid: user.uid,
                email: email,
                name: name,
                role: role,
                department: department,
                createdAt: new Date().toISOString(),
                active: true
            };
            
            await setDoc(doc(db, 'users', user.uid), userData);
            
            // Registrar operación
            logAuthOperation('signup', user.uid);
            
            return {
                user: user,
                userData: userData
            };
        } catch (error) {
            logError(error, { operation: 'registerUser', email });
            throw error;
        }
    },

    /**
     * Inicia sesión con email y contraseña
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Promesa que resuelve con el usuario autenticado
     */
    loginUser: async function(email, password) {
        try {
            // Iniciar sesión con Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Obtener información adicional de Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // Si no existe el documento en Firestore, crearlo
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || '',
                    role: this.ROLES.EMPLOYEE, // Rol por defecto
                    createdAt: new Date().toISOString(),
                    active: true
                };
                
                await setDoc(doc(db, 'users', user.uid), userData);
            }
            
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            // Verificar si el usuario está activo
            if (userData.active === false) {
                await signOut(auth);
                throw new Error('Usuario desactivado. Contacte al administrador.');
            }
            
            // Registrar operación
            logAuthOperation('signin', user.uid);
            
            return {
                user: user,
                userData: userData
            };
        } catch (error) {
            logError(error, { operation: 'loginUser', email });
            throw error;
        }
    },

    /**
     * Cierra la sesión del usuario actual
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se cerró la sesión correctamente
     */
    logoutUser: async function() {
        try {
            const userId = auth.currentUser?.uid;
            await signOut(auth);
            
            // Registrar operación
            if (userId) {
                logAuthOperation('signout', userId);
            }
            
            return true;
        } catch (error) {
            logError(error, { operation: 'logoutUser' });
            throw error;
        }
    },

    /**
     * Envía un correo para restablecer la contraseña
     * @param {string} email - Email del usuario
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se envió el correo correctamente
     */
    resetPassword: async function(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            
            // Registrar operación
            logAuthOperation('reset_password', null);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'resetPassword', email });
            throw error;
        }
    },

    /**
     * Obtiene el usuario actual
     * @returns {Promise<Object|null>} - Promesa que resuelve con el usuario actual o null si no hay usuario autenticado
     */
    getCurrentUser: async function() {
        try {
            const user = auth.currentUser;
            
            if (!user) {
                return null;
            }
            
            // Obtener información adicional de Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            return {
                user: user,
                userData: userData
            };
        } catch (error) {
            logError(error, { operation: 'getCurrentUser' });
            return null;
        }
    },

    /**
     * Verifica si el usuario actual tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si el usuario tiene el rol especificado
     */
    hasRole: async function(role) {
        try {
            const userInfo = await this.getCurrentUser();
            
            if (!userInfo) {
                return false;
            }
            
            return userInfo.userData.role === role;
        } catch (error) {
            logError(error, { operation: 'hasRole', role });
            return false;
        }
    },

    /**
     * Actualiza el perfil de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} userData - Datos actualizados del usuario
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateUserProfile: async function(userId, userData) {
        try {
            // Verificar permisos (solo el propio usuario o un admin pueden actualizar perfiles)
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser) {
                throw new Error('No hay usuario autenticado');
            }
            
            if (currentUser.user.uid !== userId && currentUser.userData.role !== this.ROLES.ADMIN) {
                throw new Error('No tiene permisos para actualizar este perfil');
            }
            
            // Actualizar en Firestore
            await updateDoc(doc(db, 'users', userId), {
                ...userData,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateUserProfile', userId });
            throw error;
        }
    },

    /**
     * Cambia el rol de un usuario
     * @param {string} userId - ID del usuario
     * @param {string} newRole - Nuevo rol
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    changeUserRole: async function(userId, newRole) {
        try {
            // Verificar que el usuario actual sea admin
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser || currentUser.userData.role !== this.ROLES.ADMIN) {
                throw new Error('Solo los administradores pueden cambiar roles');
            }
            
            // Verificar que el rol sea válido
            if (!Object.values(this.ROLES).includes(newRole)) {
                throw new Error('Rol inválido');
            }
            
            // Actualizar en Firestore
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'changeUserRole', userId, newRole });
            throw error;
        }
    },

    /**
     * Activa o desactiva un usuario
     * @param {string} userId - ID del usuario
     * @param {boolean} active - Estado de activación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    setUserActive: async function(userId, active) {
        try {
            // Verificar que el usuario actual sea admin
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser || currentUser.userData.role !== this.ROLES.ADMIN) {
                throw new Error('Solo los administradores pueden activar/desactivar usuarios');
            }
            
            // Actualizar en Firestore
            await updateDoc(doc(db, 'users', userId), {
                active: active,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'setUserActive', userId, active });
            throw error;
        }
    },

    /**
     * Obtiene todos los usuarios
     * @returns {Promise<Array>} - Promesa que resuelve con un array de usuarios
     */
    getAllUsers: async function() {
        try {
            // Verificar que el usuario actual sea admin
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser || currentUser.userData.role !== this.ROLES.ADMIN) {
                throw new Error('Solo los administradores pueden ver todos los usuarios');
            }
            
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = [];
            
            usersSnapshot.forEach((doc) => {
                usersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return usersList;
        } catch (error) {
            logError(error, { operation: 'getAllUsers' });
            throw error;
        }
    },

    /**
     * Obtiene usuarios por rol
     * @param {string} role - Rol a filtrar
     * @returns {Promise<Array>} - Promesa que resuelve con un array de usuarios con el rol especificado
     */
    getUsersByRole: async function(role) {
        try {
            // Verificar que el usuario actual sea admin o coordinator
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser || (currentUser.userData.role !== this.ROLES.ADMIN && currentUser.userData.role !== this.ROLES.COORDINATOR)) {
                throw new Error('No tiene permisos para ver esta información');
            }
            
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('role', '==', role));
            const usersSnapshot = await getDocs(q);
            const usersList = [];
            
            usersSnapshot.forEach((doc) => {
                usersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return usersList;
        } catch (error) {
            logError(error, { operation: 'getUsersByRole', role });
            throw error;
        }
    },

    /**
     * Obtiene usuarios por departamento
     * @param {string} department - Departamento a filtrar
     * @returns {Promise<Array>} - Promesa que resuelve con un array de usuarios del departamento especificado
     */
    getUsersByDepartment: async function(department) {
        try {
            // Verificar que el usuario actual sea admin o coordinator
            const currentUser = await this.getCurrentUser();
            
            if (!currentUser || (currentUser.userData.role !== this.ROLES.ADMIN && currentUser.userData.role !== this.ROLES.COORDINATOR)) {
                throw new Error('No tiene permisos para ver esta información');
            }
            
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('department', '==', department));
            const usersSnapshot = await getDocs(q);
            const usersList = [];
            
            usersSnapshot.forEach((doc) => {
                usersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return usersList;
        } catch (error) {
            logError(error, { operation: 'getUsersByDepartment', department });
            throw error;
        }
    }
};

export default UserManagement;
