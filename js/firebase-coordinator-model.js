/**
 * firebase-coordinator-model.js
 * Adaptador para el modelo de Coordinador con Firebase Firestore
 * Este módulo proporciona funciones para gestionar los coordinadores en Firestore
 */

import { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from './firebase-config.js';
import { logReadOperation, logWriteOperation, logDeleteOperation, logError } from './firebase-monitoring.js';

const CoordinatorModel = {
    /**
     * Colección en Firestore
     */
    COLLECTION: 'coordinators',

    /**
     * Crea un nuevo coordinador
     * @param {Object} coordinator - Datos del coordinador
     * @returns {Promise<string>} - Promesa que resuelve con el ID del coordinador creado
     */
    create: async function(coordinator) {
        try {
            // Validar coordinador
            if (!coordinator.id) {
                coordinator.id = 'coord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Asegurar que tenga las fechas
            if (!coordinator.createdAt) {
                coordinator.createdAt = new Date().toISOString();
            }
            
            coordinator.updatedAt = new Date().toISOString();
            
            // Asegurar que tenga un estado
            if (coordinator.active === undefined) {
                coordinator.active = true;
            }
            
            // Guardar en Firestore
            await setDoc(doc(db, this.COLLECTION, coordinator.id), coordinator);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, coordinator.id);
            
            return coordinator.id;
        } catch (error) {
            logError(error, { operation: 'createCoordinator', coordinator });
            throw error;
        }
    },

    /**
     * Obtiene un coordinador por su ID
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<Object|null>} - Promesa que resuelve con el coordinador o null si no existe
     */
    getById: async function(coordinatorId) {
        try {
            const coordinatorDoc = await getDoc(doc(db, this.COLLECTION, coordinatorId));
            
            // Registrar operación
            logReadOperation(this.COLLECTION, coordinatorId);
            
            if (coordinatorDoc.exists()) {
                return coordinatorDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            logError(error, { operation: 'getCoordinatorById', coordinatorId });
            throw error;
        }
    },

    /**
     * Obtiene todos los coordinadores
     * @returns {Promise<Array>} - Promesa que resuelve con un array de coordinadores
     */
    getAll: async function() {
        try {
            const coordinatorsSnapshot = await getDocs(collection(db, this.COLLECTION));
            const coordinators = [];
            
            coordinatorsSnapshot.forEach((doc) => {
                coordinators.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return coordinators;
        } catch (error) {
            logError(error, { operation: 'getAllCoordinators' });
            throw error;
        }
    },

    /**
     * Obtiene coordinadores por departamento
     * @param {string} department - Departamento a filtrar
     * @returns {Promise<Array>} - Promesa que resuelve con un array de coordinadores del departamento
     */
    getByDepartment: async function(department) {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('department', '==', department)
            );
            
            const coordinatorsSnapshot = await getDocs(q);
            const coordinators = [];
            
            coordinatorsSnapshot.forEach((doc) => {
                coordinators.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return coordinators;
        } catch (error) {
            logError(error, { operation: 'getCoordinatorsByDepartment', department });
            throw error;
        }
    },

    /**
     * Obtiene coordinadores activos
     * @returns {Promise<Array>} - Promesa que resuelve con un array de coordinadores activos
     */
    getActive: async function() {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('active', '==', true)
            );
            
            const coordinatorsSnapshot = await getDocs(q);
            const coordinators = [];
            
            coordinatorsSnapshot.forEach((doc) => {
                coordinators.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return coordinators;
        } catch (error) {
            logError(error, { operation: 'getActiveCoordinators' });
            throw error;
        }
    },

    /**
     * Actualiza un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @param {Object} coordinatorData - Datos actualizados del coordinador
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(coordinatorId, coordinatorData) {
        try {
            // Asegurar que no se modifique el ID
            delete coordinatorData.id;
            
            // Actualizar fecha de modificación
            coordinatorData.updatedAt = new Date().toISOString();
            
            // Actualizar en Firestore
            await updateDoc(doc(db, this.COLLECTION, coordinatorId), coordinatorData);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, coordinatorId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateCoordinator', coordinatorId });
            throw error;
        }
    },

    /**
     * Elimina un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(coordinatorId) {
        try {
            // Eliminar de Firestore
            await deleteDoc(doc(db, this.COLLECTION, coordinatorId));
            
            // Registrar operación
            logDeleteOperation(this.COLLECTION, coordinatorId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'deleteCoordinator', coordinatorId });
            throw error;
        }
    },

    /**
     * Verifica si un código de acceso es válido y pertenece a un coordinador activo
     * @param {string} accessCode - Código de acceso
     * @returns {Promise<Object|null>} - Promesa que resuelve con el coordinador si el código es válido, o null si no
     */
    validateAccessCode: async function(accessCode) {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('accessCode', '==', accessCode),
                where('active', '==', true)
            );
            
            const coordinatorsSnapshot = await getDocs(q);
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            if (coordinatorsSnapshot.empty) {
                return null;
            }
            
            // Devolver el primer coordinador que coincida
            return coordinatorsSnapshot.docs[0].data();
        } catch (error) {
            logError(error, { operation: 'validateAccessCode' });
            throw error;
        }
    },

    /**
     * Genera un código de acceso único para un coordinador
     * @returns {Promise<string>} - Promesa que resuelve con el código generado
     */
    generateAccessCode: async function() {
        // Generar código alfanumérico de 6 caracteres
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (I, O, 0, 1)
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };
        
        // Verificar que el código sea único
        let code = generateCode();
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
            const q = query(
                collection(db, this.COLLECTION),
                where('accessCode', '==', code)
            );
            
            const coordinatorsSnapshot = await getDocs(q);
            
            if (coordinatorsSnapshot.empty) {
                isUnique = true;
            } else {
                code = generateCode();
                attempts++;
            }
        }
        
        if (!isUnique) {
            throw new Error('No se pudo generar un código único después de varios intentos');
        }
        
        return code;
    },

    /**
     * Asigna un nuevo código de acceso a un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<string>} - Promesa que resuelve con el nuevo código
     */
    assignNewAccessCode: async function(coordinatorId) {
        try {
            // Generar nuevo código
            const newCode = await this.generateAccessCode();
            
            // Actualizar coordinador
            await this.update(coordinatorId, {
                accessCode: newCode,
                updatedAt: new Date().toISOString()
            });
            
            return newCode;
        } catch (error) {
            logError(error, { operation: 'assignNewAccessCode', coordinatorId });
            throw error;
        }
    }
};

export default CoordinatorModel;
