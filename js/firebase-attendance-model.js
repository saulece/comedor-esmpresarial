/**
 * firebase-attendance-model.js
 * Modelo para gestionar confirmaciones de asistencia en Firestore
 */

const FirebaseAttendanceModel = {
    /**
     * Obtiene todas las confirmaciones de asistencia de Firestore
     * @param {string} [menuType] - Tipo de menú opcional para filtrar ('lunch' o 'breakfast')
     * @returns {Promise<Array>} - Promesa que resuelve a un array de confirmaciones
     */
    getAll: async function(menuType) {
        try {
            let query = firebase.firestore().collection('attendanceConfirmations');
            
            // Si se proporciona menuType, filtrar por ese campo
            if (menuType) {
                query = query.where('menuType', '==', menuType);
            }
            
            const snapshot = await query.get();
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
     * @param {string} [menuType] - Tipo de menú opcional para filtrar ('lunch' o 'breakfast')
     * @returns {Promise<Array>} - Promesa que resuelve a un array de confirmaciones del coordinador
     */
    getByCoordinator: async function(coordinatorId, menuType) {
        try {
            let query = firebase.firestore()
                .collection('attendanceConfirmations')
                .where('coordinatorId', '==', coordinatorId);
                
            // Si se proporciona menuType, filtrar también por ese campo
            if (menuType) {
                query = query.where('menuType', '==', menuType);
            }
            
            const snapshot = await query.get();
            
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
     * Obtiene la confirmación de asistencia de un coordinador para una semana específica y tipo de menú
     * @param {string} coordinatorId - ID del coordinador
     * @param {Date|string} weekStartDate - Fecha de inicio de la semana
     * @param {string} [menuType='lunch'] - Tipo de menú ('lunch' o 'breakfast')
     * @returns {Promise<Object|null>} - Promesa que resuelve a la confirmación o null si no existe
     */
    getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate, menuType = 'lunch') {
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
                .where('menuType', '==', menuType)
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
            console.error(`Error al obtener confirmación para coordinador ${coordinatorId} y semana ${weekStartDate}:`, error);
            return null;
        }
    },

    /**
     * Agrega una nueva confirmación de asistencia a Firestore
     * @param {Object} confirmation - Confirmación a agregar
     * @param {string} confirmation.coordinatorId - ID del coordinador
     * @param {string} confirmation.weekStartDate - Fecha de inicio de la semana
     * @param {string} [confirmation.menuType='lunch'] - Tipo de menú ('lunch' o 'breakfast')
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    add: async function(confirmation) {
        try {
            // Asegurar que menuType tenga un valor por defecto si no se proporciona
            const menuType = confirmation.menuType || 'lunch';
            
            // Verificar si ya existe una confirmación para este coordinador, semana y tipo de menú
            const existingConfirmation = await this.getByCoordinatorAndWeek(
                confirmation.coordinatorId, 
                confirmation.weekStartDate,
                menuType
            );
            
            if (existingConfirmation) {
                console.warn(`Ya existe una confirmación para este coordinador, semana y tipo de menú (${menuType})`);
                return false;
            }
            
            // Asegurar que la confirmación tenga timestamps y menuType
            const confirmationWithTimestamps = {
                ...confirmation,
                menuType: menuType, // Asegurar que menuType esté presente
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
     * @param {string} [menuType] - Tipo de menú opcional para filtrar ('lunch' o 'breakfast')
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToCoordinatorConfirmations: function(coordinatorId, callback, menuType) {
        let query = firebase.firestore()
            .collection('attendanceConfirmations')
            .where('coordinatorId', '==', coordinatorId);
            
        // Si se proporciona menuType, filtrar también por ese campo
        if (menuType) {
            query = query.where('menuType', '==', menuType);
        }
        
        const unsubscribe = query.onSnapshot(snapshot => {
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
