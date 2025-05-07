/**
 * firebase-menu-model.js
 * Modelo para gestionar menús en Firestore
 */

const FirebaseMenuModel = {
    /**
     * Obtiene todos los menús de Firestore
     * @returns {Promise<Array>} - Promesa que resuelve a un array de menús
     */
    getAll: async function() {
        try {
            const snapshot = await firebase.firestore().collection('menus').get();
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error('Error al obtener menús de Firestore:', error);
            return [];
        }
    },

    /**
     * Obtiene un menú específico por su ID
     * @param {string} menuId - ID del menú a obtener
     * @returns {Promise<Object|null>} - Promesa que resuelve al menú o null si no existe
     */
    get: async function(menuId) {
        try {
            const doc = await firebase.firestore().collection('menus').doc(menuId).get();
            if (doc.exists) {
                return {
                    ...doc.data(),
                    id: doc.id
                };
            }
            return null;
        } catch (error) {
            console.error(`Error al obtener menú ${menuId} de Firestore:`, error);
            return null;
        }
    },

    /**
     * Obtiene el menú activo (más reciente)
     * @returns {Promise<Object|null>} - Promesa que resuelve al menú activo o null si no existe
     */
    getActive: async function() {
        try {
            const today = new Date();
            const snapshot = await firebase.firestore()
                .collection('menus')
                .where('startDate', '<=', today.toISOString().split('T')[0])
                .where('endDate', '>=', today.toISOString().split('T')[0])
                .orderBy('startDate', 'desc')
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
            console.error('Error al obtener menú activo de Firestore:', error);
            return null;
        }
    },

    /**
     * Agrega un nuevo menú a Firestore
     * @param {Object} menu - Menú a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    add: async function(menu) {
        try {
            // Asegurar que el menú tenga timestamps
            const menuWithTimestamps = {
                ...menu,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebase.firestore().collection('menus').add(menuWithTimestamps);
            console.log(`Menú agregado con ID: ${docRef.id}`);
            return true;
        } catch (error) {
            console.error('Error al agregar menú a Firestore:', error);
            return false;
        }
    },

    /**
     * Actualiza un menú existente en Firestore
     * @param {string} menuId - ID del menú a actualizar
     * @param {Object} menuData - Datos actualizados del menú
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    update: async function(menuId, menuData) {
        try {
            // Asegurar que el menú tenga timestamp de actualización
            const menuWithTimestamp = {
                ...menuData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('menus').doc(menuId).update(menuWithTimestamp);
            console.log(`Menú ${menuId} actualizado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al actualizar menú ${menuId} en Firestore:`, error);
            return false;
        }
    },

    /**
     * Elimina un menú de Firestore
     * @param {string} menuId - ID del menú a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    delete: async function(menuId) {
        try {
            await firebase.firestore().collection('menus').doc(menuId).delete();
            console.log(`Menú ${menuId} eliminado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar menú ${menuId} de Firestore:`, error);
            return false;
        }
    },

    /**
     * Escucha cambios en tiempo real en el menú activo
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToActiveMenu: function(callback) {
        const today = new Date();
        const unsubscribe = firebase.firestore()
            .collection('menus')
            .where('startDate', '<=', today.toISOString().split('T')[0])
            .where('endDate', '>=', today.toISOString().split('T')[0])
            .orderBy('startDate', 'desc')
            .limit(1)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    callback(null);
                    return;
                }

                const doc = snapshot.docs[0];
                const menu = {
                    ...doc.data(),
                    id: doc.id
                };
                callback(menu);
            }, error => {
                console.error('Error al escuchar cambios en menú activo:', error);
                callback(null, error);
            });

        return unsubscribe;
    },

    /**
     * Escucha cambios en tiempo real en todos los menús
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la suscripción
     */
    listenToAllMenus: function(callback) {
        const unsubscribe = firebase.firestore()
            .collection('menus')
            .orderBy('startDate', 'desc')
            .onSnapshot(snapshot => {
                const menus = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(menus);
            }, error => {
                console.error('Error al escuchar cambios en menús:', error);
                callback([], error);
            });

        return unsubscribe;
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseMenuModel;
} else {
    // Para uso en navegador
    window.FirebaseMenuModel = FirebaseMenuModel;
}
