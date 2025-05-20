/**
 * firebase-attendance-model.js
 * Modelo para gestionar confirmaciones de asistencia en Firestore
 */

const FirebaseAttendanceModel = {
    /**
     * Obtiene todas las confirmaciones de asistencia de Firestore
     * @returns {Promise<Array>} - Promesa que resuelve a un array de confirmaciones
     */
    getAll: async function() {
        try {
            const snapshot = await firebase.firestore().collection('attendanceConfirmations').get();
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error('Error al obtener confirmaciones de asistencia de Firestore:', error);
            return [];
        }
    },

    /**
     * Obtiene una confirmación de asistencia específica por su ID
     * @param {string} id - ID de la confirmación a obtener
     * @returns {Promise<Object|null>} - Promesa que resuelve a la confirmación o null si no existe
     */
    get: async function(id) {
        try {
            const doc = await firebase.firestore().collection('attendanceConfirmations').doc(id).get();
            if (doc.exists) {
                return {
                    ...doc.data(),
                    id: doc.id
                };
            }
            return null;
        } catch (error) {
            console.error(`Error al obtener confirmación ${id} de Firestore:`, error);
            return null;
        }
    },

    /**
     * Obtiene las confirmaciones de asistencia de un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @returns {Promise<Array>} - Promesa que resuelve a un array de confirmaciones del coordinador
     */
    getByCoordinator: async function(coordinatorId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('attendanceConfirmations')
                .where('coordinatorId', '==', coordinatorId)
                .get();
            
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error(`Error al obtener confirmaciones del coordinador ${coordinatorId}:`, error);
            return [];
        }
    },

    /**
     * Obtiene la confirmación de asistencia de un coordinador para una semana específica
     * @param {string} coordinatorId - ID del coordinador
     * @param {Date|string} weekStartDate - Fecha de inicio de la semana
     * @param {string} type - Tipo de menú ('comida' o 'desayuno')
     * @returns {Promise<Object|null>} - Promesa que resuelve a la confirmación o null si no existe
     */
    getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate, type = 'comida') {
        try {
            // Normalizar la fecha de inicio de semana
            let startDateStr;
            if (weekStartDate instanceof Date) {
                startDateStr = weekStartDate.toISOString().split('T')[0];
            } else {
                startDateStr = new Date(weekStartDate).toISOString().split('T')[0];
            }
            
            const snapshot = await firebase.firestore()
                .collection('attendanceConfirmations')
                .where('coordinatorId', '==', coordinatorId)
                .where('weekStartDate', '==', startDateStr)
                .where('type', '==', type) // Filtrar por tipo de menú
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return {
                ...doc.data(),
                id: doc.id
            };
        } catch (error) {
            console.error(`Error al obtener confirmación para coordinador ${coordinatorId} y semana ${weekStartDate} de tipo ${type}:`, error);
            return null;
        }
    },

    /**
     * Agrega una nueva confirmación de asistencia a Firestore
     * @param {Object} confirmation - Confirmación a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    add: async function(confirmation) {
        try {
            // Verificar si ya existe una confirmación para este coordinador y semana
            const existingConfirmation = await this.getByCoordinatorAndWeek(
                confirmation.coordinatorId, 
                confirmation.weekStartDate
            );
            
            if (existingConfirmation) {
                console.warn('Ya existe una confirmación para este coordinador y semana');
                return false;
            }
            
            // Asegurar que la confirmación tenga timestamps
            const confirmationWithTimestamps = {
                ...confirmation,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebase.firestore().collection('attendanceConfirmations').add(confirmationWithTimestamps);
            console.log(`Confirmación agregada con ID: ${docRef.id}`);
            return true;
        } catch (error) {
            console.error('Error al agregar confirmación a Firestore:', error);
            return false;
        }
    },

    /**
     * Actualiza una confirmación de asistencia existente en Firestore
     * @param {string} id - ID de la confirmación a actualizar
     * @param {Object} updatedData - Datos actualizados de la confirmación
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(id, updatedData) {
        try {
            // Asegurar que la confirmación tenga timestamp de actualización
            const confirmationWithTimestamp = {
                ...updatedData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('attendanceConfirmations').doc(id).update(confirmationWithTimestamp);
            console.log(`Confirmación ${id} actualizada correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al actualizar confirmación ${id} en Firestore:`, error);
            return false;
        }
    },

    /**
     * Elimina una confirmación de asistencia de Firestore
     * @param {string} id - ID de la confirmación a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(id) {
        try {
            await firebase.firestore().collection('attendanceConfirmations').doc(id).delete();
            console.log(`Confirmación ${id} eliminada correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar confirmación ${id} de Firestore:`, error);
            return false;
        }
    },

    /**
     * Escucha cambios en tiempo real en las confirmaciones de un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToCoordinatorConfirmations: function(coordinatorId, callback) {
        const unsubscribe = firebase.firestore()
            .collection('attendanceConfirmations')
            .where('coordinatorId', '==', coordinatorId)
            .onSnapshot(snapshot => {
                const confirmations = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(confirmations);
            }, error => {
                console.error(`Error al escuchar cambios en confirmaciones del coordinador ${coordinatorId}:`, error);
                callback([], error);
            });

        return unsubscribe;
    },

    /**
     * Escucha cambios en tiempo real en una confirmación específica
     * @param {string} id - ID de la confirmación a escuchar
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToConfirmation: function(id, callback) {
        const unsubscribe = firebase.firestore()
            .collection('attendanceConfirmations')
            .doc(id)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const confirmation = {
                        ...doc.data(),
                        id: doc.id
                    };
                    callback(confirmation);
                } else {
                    callback(null);
                }
            }, error => {
                console.error(`Error al escuchar cambios en confirmación ${id}:`, error);
                callback(null, error);
            });

        return unsubscribe;
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAttendanceModel;
} else {
    // Para uso en navegador
    window.FirebaseAttendanceModel = FirebaseAttendanceModel;
}
