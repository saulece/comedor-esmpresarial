/**
 * firebase-coordinator-model.js
 * Modelo para gestionar coordinadores en Firestore
 */

const FirebaseCoordinatorModel = {
    /**
     * Obtiene todos los coordinadores de Firestore
     * @returns {Promise<Array>} - Promesa que resuelve a un array de coordinadores
     */
    getAll: async function() {
        try {
            const snapshot = await firebase.firestore().collection('coordinators').get();
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error('Error al obtener coordinadores de Firestore:', error);
            return [];
        }
    },

    /**
     * Obtiene un coordinador específico por su ID
     * @param {string} coordinatorId - ID del coordinador a obtener
     * @returns {Promise<Object|null>} - Promesa que resuelve al coordinador o null si no existe
     */
    get: async function(coordinatorId) {
        try {
            const doc = await firebase.firestore().collection('coordinators').doc(coordinatorId).get();
            if (doc.exists) {
                return {
                    ...doc.data(),
                    id: doc.id
                };
            }
            return null;
        } catch (error) {
            console.error(`Error al obtener coordinador ${coordinatorId} de Firestore:`, error);
            return null;
        }
    },

    /**
     * Obtiene coordinadores por departamento
     * @param {string} department - Departamento a filtrar
     * @returns {Promise<Array>} - Promesa que resuelve a un array de coordinadores del departamento
     */
    getByDepartment: async function(department) {
        try {
            const snapshot = await firebase.firestore()
                .collection('coordinators')
                .where('department', '==', department)
                .get();
            
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error(`Error al obtener coordinadores del departamento ${department}:`, error);
            return [];
        }
    },

    /**
     * Verifica un código de acceso y devuelve el coordinador si es válido
     * @param {string} accessCode - Código de acceso a verificar
     * @returns {Promise<Object|null>} - Promesa que resuelve al coordinador o null si el código es inválido
     */
    verifyAccessCode: async function(accessCode) {
        try {
            const snapshot = await firebase.firestore()
                .collection('coordinators')
                .where('accessCode', '==', accessCode)
                .where('active', '==', true)
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
            console.error('Error al verificar código de acceso:', error);
            return null;
        }
    },

    /**
     * Agrega un nuevo coordinador a Firestore
     * @param {Object} coordinator - Coordinador a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    add: async function(coordinator) {
        try {
            // Asegurar que el coordinador tenga timestamps
            const coordinatorWithTimestamps = {
                ...coordinator,
                active: coordinator.active !== undefined ? coordinator.active : true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebase.firestore().collection('coordinators').add(coordinatorWithTimestamps);
            console.log(`Coordinador agregado con ID: ${docRef.id}`);
            return true;
        } catch (error) {
            console.error('Error al agregar coordinador a Firestore:', error);
            return false;
        }
    },

    /**
     * Actualiza un coordinador existente en Firestore
     * @param {string} coordinatorId - ID del coordinador a actualizar
     * @param {Object} coordinatorData - Datos actualizados del coordinador
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(coordinatorId, coordinatorData) {
        try {
            // Asegurar que el coordinador tenga timestamp de actualización
            const coordinatorWithTimestamp = {
                ...coordinatorData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('coordinators').doc(coordinatorId).update(coordinatorWithTimestamp);
            console.log(`Coordinador ${coordinatorId} actualizado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al actualizar coordinador ${coordinatorId} en Firestore:`, error);
            return false;
        }
    },

    /**
     * Elimina un coordinador de Firestore
     * @param {string} coordinatorId - ID del coordinador a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(coordinatorId) {
        try {
            await firebase.firestore().collection('coordinators').doc(coordinatorId).delete();
            console.log(`Coordinador ${coordinatorId} eliminado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar coordinador ${coordinatorId} de Firestore:`, error);
            return false;
        }
    },

    /**
     * Escucha cambios en tiempo real en todos los coordinadores
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToAllCoordinators: function(callback) {
        const unsubscribe = firebase.firestore()
            .collection('coordinators')
            .onSnapshot(snapshot => {
                const coordinators = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(coordinators);
            }, error => {
                console.error('Error al escuchar cambios en coordinadores:', error);
                callback([], error);
            });

        return unsubscribe;
    },

    /**
     * Escucha cambios en tiempo real en un coordinador específico
     * @param {string} coordinatorId - ID del coordinador a escuchar
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToCoordinator: function(coordinatorId, callback) {
        const unsubscribe = firebase.firestore()
            .collection('coordinators')
            .doc(coordinatorId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const coordinator = {
                        ...doc.data(),
                        id: doc.id
                    };
                    callback(coordinator);
                } else {
                    callback(null);
                }
            }, error => {
                console.error(`Error al escuchar cambios en coordinador ${coordinatorId}:`, error);
                callback(null, error);
            });

        return unsubscribe;
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseCoordinatorModel;
} else {
    // Para uso en navegador
    window.FirebaseCoordinatorModel = FirebaseCoordinatorModel;
}
