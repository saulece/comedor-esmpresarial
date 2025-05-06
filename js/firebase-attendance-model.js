/**
 * firebase-attendance-model.js
 * Adaptador para el modelo de Confirmación de Asistencia con Firebase Firestore
 * Este módulo proporciona funciones para gestionar las confirmaciones de asistencia en Firestore
 */

import { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from './firebase-config.js';
import { logReadOperation, logWriteOperation, logDeleteOperation, logError } from './firebase-monitoring.js';

const AttendanceModel = {
    /**
     * Colección en Firestore
     */
    COLLECTION: 'attendanceConfirmations',

    /**
     * Crea una nueva confirmación de asistencia
     * @param {Object} confirmation - Datos de la confirmación
     * @returns {Promise<string>} - Promesa que resuelve con el ID de la confirmación creada
     */
    create: async function(confirmation) {
        try {
            // Validar confirmación
            if (!confirmation.id) {
                confirmation.id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Asegurar que tenga las fechas
            if (!confirmation.createdAt) {
                confirmation.createdAt = new Date().toISOString();
            }
            
            confirmation.updatedAt = new Date().toISOString();
            
            // Normalizar fecha de inicio de semana si es un objeto Date
            if (confirmation.weekStartDate instanceof Date) {
                confirmation.weekStartDate = confirmation.weekStartDate.toISOString().split('T')[0];
            }
            
            // Guardar en Firestore
            await setDoc(doc(db, this.COLLECTION, confirmation.id), confirmation);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, confirmation.id);
            
            return confirmation.id;
        } catch (error) {
            logError(error, { operation: 'createAttendanceConfirmation', confirmation });
            throw error;
        }
    },

    /**
     * Obtiene una confirmación de asistencia por su ID
     * @param {string} confirmationId - ID de la confirmación
     * @returns {Promise<Object|null>} - Promesa que resuelve con la confirmación o null si no existe
     */
    getById: async function(confirmationId) {
        try {
            const confirmationDoc = await getDoc(doc(db, this.COLLECTION, confirmationId));
            
            // Registrar operación
            logReadOperation(this.COLLECTION, confirmationId);
            
            if (confirmationDoc.exists()) {
                return confirmationDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            logError(error, { operation: 'getAttendanceConfirmationById', confirmationId });
            throw error;
        }
    },

    /**
     * Obtiene todas las confirmaciones de asistencia
     * @returns {Promise<Array>} - Promesa que resuelve con un array de confirmaciones
     */
    getAll: async function() {
        try {
            const confirmationsSnapshot = await getDocs(collection(db, this.COLLECTION));
            const confirmations = [];
            
            confirmationsSnapshot.forEach((doc) => {
                confirmations.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return confirmations;
        } catch (error) {
            logError(error, { operation: 'getAllAttendanceConfirmations' });
            throw error;
        }
    },

    /**
     * Obtiene confirmaciones de asistencia por coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<Array>} - Promesa que resuelve con un array de confirmaciones del coordinador
     */
    getByCoordinator: async function(coordinatorId) {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('coordinatorId', '==', coordinatorId)
            );
            
            const confirmationsSnapshot = await getDocs(q);
            const confirmations = [];
            
            confirmationsSnapshot.forEach((doc) => {
                confirmations.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return confirmations;
        } catch (error) {
            logError(error, { operation: 'getAttendanceConfirmationsByCoordinator', coordinatorId });
            throw error;
        }
    },

    /**
     * Obtiene confirmación de asistencia por coordinador y semana
     * @param {string} coordinatorId - ID del coordinador
     * @param {string|Date} weekStartDate - Fecha de inicio de la semana
     * @returns {Promise<Object|null>} - Promesa que resuelve con la confirmación o null si no existe
     */
    getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
        try {
            // Normalizar fecha
            if (weekStartDate instanceof Date) {
                weekStartDate = weekStartDate.toISOString().split('T')[0];
            }
            
            const q = query(
                collection(db, this.COLLECTION),
                where('coordinatorId', '==', coordinatorId),
                where('weekStartDate', '==', weekStartDate)
            );
            
            const confirmationsSnapshot = await getDocs(q);
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            if (confirmationsSnapshot.empty) {
                return null;
            }
            
            // Devolver la primera confirmación que coincida
            return confirmationsSnapshot.docs[0].data();
        } catch (error) {
            logError(error, { operation: 'getAttendanceConfirmationByCoordinatorAndWeek', coordinatorId, weekStartDate });
            throw error;
        }
    },

    /**
     * Actualiza una confirmación de asistencia
     * @param {string} confirmationId - ID de la confirmación
     * @param {Object} confirmationData - Datos actualizados de la confirmación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(confirmationId, confirmationData) {
        try {
            // Asegurar que no se modifique el ID
            delete confirmationData.id;
            
            // Actualizar fecha de modificación
            confirmationData.updatedAt = new Date().toISOString();
            
            // Normalizar fecha de inicio de semana si es un objeto Date
            if (confirmationData.weekStartDate instanceof Date) {
                confirmationData.weekStartDate = confirmationData.weekStartDate.toISOString().split('T')[0];
            }
            
            // Actualizar en Firestore
            await updateDoc(doc(db, this.COLLECTION, confirmationId), confirmationData);
            
            // Registrar operación
            logWriteOperation(this.COLLECTION, confirmationId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateAttendanceConfirmation', confirmationId });
            throw error;
        }
    },

    /**
     * Elimina una confirmación de asistencia
     * @param {string} confirmationId - ID de la confirmación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(confirmationId) {
        try {
            // Eliminar de Firestore
            await deleteDoc(doc(db, this.COLLECTION, confirmationId));
            
            // Registrar operación
            logDeleteOperation(this.COLLECTION, confirmationId);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'deleteAttendanceConfirmation', confirmationId });
            throw error;
        }
    },

    /**
     * Actualiza el conteo de asistencia para un día específico
     * @param {string} confirmationId - ID de la confirmación
     * @param {string} dayId - ID del día (ej: 'monday', 'tuesday', etc.)
     * @param {number} count - Nuevo conteo de asistencia
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateDayCount: async function(confirmationId, dayId, count) {
        try {
            // Obtener confirmación actual
            const confirmation = await this.getById(confirmationId);
            
            if (!confirmation) {
                throw new Error('Confirmación no encontrada');
            }
            
            // Verificar que tenga un objeto de conteos
            if (!confirmation.attendanceCounts) {
                confirmation.attendanceCounts = {};
            }
            
            // Actualizar conteo para el día
            confirmation.attendanceCounts[dayId] = count;
            
            // Actualizar confirmación
            await this.update(confirmationId, {
                attendanceCounts: confirmation.attendanceCounts,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            logError(error, { operation: 'updateDayCount', confirmationId, dayId, count });
            throw error;
        }
    },

    /**
     * Obtiene el conteo total de asistencia para una confirmación
     * @param {string} confirmationId - ID de la confirmación
     * @returns {Promise<number>} - Promesa que resuelve con el conteo total
     */
    getTotalCount: async function(confirmationId) {
        try {
            // Obtener confirmación
            const confirmation = await this.getById(confirmationId);
            
            if (!confirmation || !confirmation.attendanceCounts) {
                return 0;
            }
            
            // Sumar conteos
            let total = 0;
            for (const dayId in confirmation.attendanceCounts) {
                total += parseInt(confirmation.attendanceCounts[dayId]) || 0;
            }
            
            return total;
        } catch (error) {
            logError(error, { operation: 'getTotalCount', confirmationId });
            throw error;
        }
    },

    /**
     * Obtiene confirmaciones para una semana específica
     * @param {string|Date} weekStartDate - Fecha de inicio de la semana
     * @returns {Promise<Array>} - Promesa que resuelve con un array de confirmaciones
     */
    getByWeek: async function(weekStartDate) {
        try {
            // Normalizar fecha
            if (weekStartDate instanceof Date) {
                weekStartDate = weekStartDate.toISOString().split('T')[0];
            }
            
            const q = query(
                collection(db, this.COLLECTION),
                where('weekStartDate', '==', weekStartDate)
            );
            
            const confirmationsSnapshot = await getDocs(q);
            const confirmations = [];
            
            confirmationsSnapshot.forEach((doc) => {
                confirmations.push(doc.data());
            });
            
            // Registrar operación
            logReadOperation(this.COLLECTION);
            
            return confirmations;
        } catch (error) {
            logError(error, { operation: 'getAttendanceConfirmationsByWeek', weekStartDate });
            throw error;
        }
    }
};

export default AttendanceModel;
