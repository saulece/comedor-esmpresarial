/**
 * firebase-menu-model.js
 * Modelo para gestionar menús en Firestore
 */

const FirebaseMenuModel = {
    // ... (las funciones getAll, get, add, update, delete, listenToAllMenus permanecen igual que en la versión anterior que te di) ...

    /**
     * Obtiene el menú activo (más reciente que ha comenzado y aún no ha terminado)
     * @returns {Promise<Object|null>} - Promesa que resuelve al menú activo o null si no existe
     */
    getActive: async function() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const snapshot = await firebase.firestore()
                .collection('menus')
                // 1. Obtener menús que AÚN NO HAN TERMINADO o TERMINAN HOY.
                .where('endDate', '>=', todayStr)
                // 2. El PRIMER orderBy DEBE ser en 'endDate' porque es el campo de la desigualdad.
                .orderBy('endDate', 'asc') // Ordenar por fecha de finalización ascendente (los que terminan antes primero)
                                           // o 'desc' si quieres los que terminan más tarde primero,
                                           // pero luego el filtro de cliente es más importante.
                .get();

            if (snapshot.empty) {
                return null;
            }

            // 3. En el cliente, encontrar el menú que YA HA COMENZADO y es el más adecuado.
            // Como ordenamos por endDate, necesitamos filtrar los que ya comenzaron y luego
            // podríamos querer el que comenzó más recientemente de ese subconjunto.
            const validMenus = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(menu => menu.startDate <= todayStr); // Filtrar los que ya comenzaron

            if (validMenus.length === 0) {
                return null;
            }

            // De los menús válidos (que ya comenzaron y no han terminado),
            // tomar el que tiene la fecha de inicio más reciente.
            validMenus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            
            return validMenus[0];

        } catch (error) {
            console.error('Error al obtener menú activo de Firestore:', error);
            return null;
        }
    },

    /**
     * Escucha cambios en tiempo real en el menú activo
     * @param {Function} callback - Función a llamar cuando hay cambios (menu, error)
     * @returns {string} - ID del listener para cancelarlo posteriormente
     */
    listenToActiveMenu: function(callback) {
        const todayStr = new Date().toISOString().split('T')[0];
        
        return FirebaseRealtime.listenToCollection('menus', {
            where: [['endDate', '>=', todayStr]],
            orderBy: [['endDate', 'asc']],
            onSnapshot: (snapshot) => {
                try {
                    if (snapshot.empty) {
                        callback(null);
                        return;
                    }
                    
                    // Filtrar menús que ya han comenzado
                    const validMenus = snapshot.docs
                        .map(doc => ({ ...doc.data(), id: doc.id }))
                        .filter(menu => menu.startDate <= todayStr);
                    
                    if (validMenus.length === 0) {
                        callback(null);
                        return;
                    }
                    
                    // Ordenar por fecha de inicio descendente y tomar el primero
                    validMenus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                    callback(validMenus[0]);
                } catch (error) {
                    callback(null, error);
                }
            },
            onError: (error) => callback(null, error)
        });
    },
    
    /**
     * Escucha cambios en los menús futuros a partir de una fecha
     * @param {string} startDate - Fecha de inicio mínima en formato YYYY-MM-DD
     * @param {number} daysAhead - Número de días hacia adelante para buscar (opcional, por defecto 14)
     * @param {Function} callback - Función a llamar cuando haya cambios
     * @returns {string} - ID del listener para cancelarlo posteriormente
     */
    listenToFutureMenus: function(startDate, daysAhead = 14, callback) {
        // Si el tercer parámetro no es una función, asumir que daysAhead es la función callback
        if (typeof daysAhead === 'function') {
            callback = daysAhead;
            daysAhead = 14; // Valor por defecto
        }
        
        // Calcular la fecha límite (startDate + daysAhead)
        const startDateObj = new Date(startDate + 'T00:00:00');
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + daysAhead);
        const endDateStr = endDateObj.toISOString().split('T')[0];
        
        return FirebaseRealtime.listenToCollection('menus', {
            where: [
                ['startDate', '>=', startDate],
                ['startDate', '<=', endDateStr]
            ],
            orderBy: [['startDate', 'asc']],
            onSnapshot: (snapshot) => {
                try {
                    if (snapshot.empty) {
                        callback([]);
                        return;
                    }
                    
                    // Convertir documentos a objetos de menú
                    const menus = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    callback(menus);
                } catch (error) {
                    callback([], error);
                }
            },
            onError: (error) => callback([], error)
        });
    },
    // ... (las demás funciones como getAll, get, add, update, delete, listenToAllMenus permanecen igual) ...
    // Asegúrate de incluir las demás funciones que te pasé en la respuesta anterior si no están aquí.
    // Esta es solo la parte modificada.

    /**
     * Obtiene todos los menús de Firestore
     * @returns {Promise<Array>} - Promesa que resuelve a un array de menús
     */
    getAll: async function() {
        try {
            const snapshot = await firebase.firestore().collection('menus').orderBy('startDate', 'desc').get();
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
     * Agrega un nuevo menú a Firestore
     * @param {Object} menu - Menú a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    add: async function(menu) {
        try {
            const menuWithTimestamps = {
                ...menu,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await firebase.firestore().collection('menus').add(menuWithTimestamps);
            console.log(`Menú agregado con ID: ${docRef.id}`);
            return true;
        } catch (error)
        {
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
            const menuWithTimestamp = {
                ...menuData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            // Eliminar el id del objeto de datos si se pasó accidentalmente, ya que es el ID del documento
            delete menuWithTimestamp.id;


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
     * Escucha cambios en tiempo real en todos los menús
     * @param {Function} callback - Función a llamar cuando hay cambios (menus, error)
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