/**
 * firebase-menu-model.js
 * Modelo para gestionar menús en Firestore
 */

const FirebaseMenuModel = {
    /**
     * Obtiene todos los menús de Firestore, ordenados por fecha de inicio descendente.
     * @returns {Promise<Array>} - Promesa que resuelve a un array de menús.
     */
    getAll: async function() {
        try {
            const snapshot = await firebase.firestore().collection('menus')
                .orderBy('startDate', 'desc')
                .get();
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
     * Obtiene un menú específico por su ID.
     * @param {string} menuId - ID del menú a obtener.
     * @returns {Promise<Object|null>} - Promesa que resuelve al menú o null si no existe.
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
     * Agrega un nuevo menú a Firestore y devuelve su ID.
     * @param {Object} menu - Menú a agregar.
     * @returns {Promise<string|null>} - Promesa que resuelve al ID del nuevo menú o null si falla.
     */
    add: async function(menu) { // Modificado para devolver ID o null
        try {
            const menuWithTimestamps = {
                ...menu,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            // Si menuData ya tiene un ID (por ejemplo, de currentEditingMenuId),
            // Firestore usará ese ID. Si no, generará uno nuevo.
            // Para asegurar que siempre se genere uno nuevo si no se provee,
            // podríamos hacer:
            // const docRef = menu.id 
            //    ? firebase.firestore().collection('menus').doc(menu.id)
            //    : firebase.firestore().collection('menus').doc();
            // await docRef.set(menuWithTimestamps);
            // Por ahora, la lógica de add() original es mejor si queremos que Firestore genere el ID.
            // El ID se asigna en admin.js antes de llamar a add si es una edición.

            const docRef = await firebase.firestore().collection('menus').add(menuWithTimestamps);
            console.log(`Menú agregado con ID: ${docRef.id}`);
            return docRef.id; // Devuelve el ID del nuevo documento
        } catch (error) {
            console.error('Error al agregar menú a Firestore:', error);
            return null; // Devuelve null en caso de error
        }
    },
    
    /**
     * (Alternativa) Agrega un nuevo menú a Firestore y devuelve su ID.
     * Este es el que admin.js ahora espera para nuevos menús.
     * @param {Object} menuData - Datos del menú a agregar (sin ID).
     * @returns {Promise<string|null>} - Promesa que resuelve al ID del nuevo menú o null si falla.
     */
    addAndGetId: async function(menuData) {
        try {
            const menuWithTimestamps = {
                ...menuData, // menuData no debería tener 'id' aquí
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await firebase.firestore().collection('menus').add(menuWithTimestamps);
            console.log(`Menú agregado (addAndGetId) con ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error('Error en addAndGetId:', error);
            return null;
        }
    },


    /**
     * Actualiza un menú existente en Firestore.
     * @param {string} menuId - ID del menú a actualizar.
     * @param {Object} menuData - Datos actualizados del menú.
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente.
     */
    update: async function(menuId, menuData) {
        try {
            const menuToUpdate = { ...menuData }; // Clonar para no modificar el objeto original
            delete menuToUpdate.id; // No se debe intentar actualizar el campo 'id' dentro del documento

            const menuWithTimestamp = {
                ...menuToUpdate,
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
     * Elimina un menú de Firestore.
     * @param {string} menuId - ID del menú a eliminar.
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente.
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
     * Obtiene el menú activo (más reciente que ha comenzado y aún no ha terminado).
     * @param {string} type - Tipo de menú ('comida' o 'desayuno')
     * @returns {Promise<Object|null>} - Promesa que resuelve al menú activo o null.
     */
    getActive: async function(type = 'comida') {
        try {
            const todayStr = AppUtils.formatDateForInput(new Date()); // Usar AppUtils para consistencia
            const snapshot = await firebase.firestore()
                .collection('menus')
                .where('endDate', '>=', todayStr)
                .where('type', '==', type) // Filtrar por tipo de menú
                .orderBy('endDate', 'asc')
                .get();

            if (snapshot.empty) return null;

            const validMenus = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(menu => menu.startDate <= todayStr);

            if (validMenus.length === 0) return null;

            validMenus.sort((a, b) => new Date(b.startDate + 'T00:00:00Z') - new Date(a.startDate + 'T00:00:00Z'));
            return validMenus[0];
        } catch (error) {
            console.error(`Error al obtener menú activo de tipo ${type} de Firestore:`, error);
            return null;
        }
    },

    /**
     * Escucha cambios en tiempo real en el menú activo.
     * @param {Function} callback - Función a llamar con (menu, error).
     * @param {string} type - Tipo de menú ('comida' o 'desayuno')
     * @returns {Function} - Función para cancelar la suscripción.
     */
    listenToActiveMenu: function(callback, type = 'comida') {
        const todayStr = AppUtils.formatDateForInput(new Date());
        const unsubscribe = firebase.firestore()
            .collection('menus')
            .where('endDate', '>=', todayStr)
            .where('type', '==', type) // Filtrar por tipo de menú
            .orderBy('endDate', 'asc')
            .onSnapshot(snapshot => {
                let activeMenu = null;
                const validMenus = snapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                    .filter(menu => menu.startDate <= todayStr);

                if (validMenus.length > 0) {
                    validMenus.sort((a, b) => new Date(b.startDate + 'T00:00:00Z') - new Date(a.startDate + 'T00:00:00Z'));
                    activeMenu = validMenus[0];
                }
                callback(activeMenu, null);
            }, error => {
                console.error(`Error al escuchar cambios en menú activo de tipo ${type}:`, error);
                callback(null, error);
            });
        return unsubscribe;
    },

    /**
     * Escucha cambios en tiempo real en todos los menús.
     * @param {Function} callback - Función a llamar con (menus, error).
     * @returns {Function} - Función para cancelar la suscripción.
     */
    listenToAllMenus: function(callback) {
        const unsubscribe = firebase.firestore()
            .collection('menus')
            .orderBy('startDate', 'desc')
            .onSnapshot(snapshot => {
                const menus = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                callback(menus, null);
            }, error => {
                console.error('Error al escuchar cambios en todos los menús:', error);
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