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
        console.log('Iniciando listenToActiveMenu');
        const todayStr = new Date().toISOString().split('T')[0];
        console.log('Fecha actual para filtrado:', todayStr);
        
        try {
            return FirebaseRealtime.listenToCollection('menus', {
                where: [['endDate', '>=', todayStr]],
                orderBy: [['endDate', 'asc']],
                onSnapshot: (snapshot) => {
                    try {
                        console.log('Snapshot recibido en listenToActiveMenu, docs:', snapshot.docs.length);
                        
                        if (snapshot.empty) {
                            console.log('No hay menús activos disponibles');
                            callback(null);
                            return;
                        }
                        
                        // Filtrar menús que ya han comenzado
                        const validMenus = snapshot.docs
                            .map(doc => ({ ...doc.data(), id: doc.id }))
                            .filter(menu => menu.startDate <= todayStr);
                        
                        console.log('Menús válidos (ya comenzados):', validMenus.length);
                        
                        if (validMenus.length === 0) {
                            console.log('No hay menús válidos que ya hayan comenzado');
                            callback(null);
                            return;
                        }
                        
                        // Ordenar por fecha de inicio descendente y tomar el primero
                        validMenus.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                        console.log('Menú activo seleccionado:', validMenus[0].name, 'ID:', validMenus[0].id);
                        callback(validMenus[0]);
                    } catch (error) {
                        console.error('Error procesando snapshot en listenToActiveMenu:', error);
                        callback(null, error);
                    }
                },
                onError: (error) => {
                    console.error('Error en listenToActiveMenu:', error);
                    callback(null, error);
                }
            });
        } catch (error) {
            console.error('Error al iniciar listenToActiveMenu:', error);
            callback(null, error);
            return null;
        }
    },
    
    /**
     * Escucha cambios en los menús futuros a partir de una fecha
     * @param {string} startDate - Fecha de inicio mínima en formato YYYY-MM-DD
     * @param {number} daysAhead - Número de días hacia adelante para buscar (opcional, por defecto 14)
     * @param {Function} callback - Función a llamar cuando haya cambios
     * @returns {string} - ID del listener para cancelarlo posteriormente
     */
    listenToFutureMenus: function(startDate, daysAhead = 14, callback) {
        console.log('Iniciando listenToFutureMenus con fecha:', startDate, 'y días:', daysAhead);
        
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
        
        // Obtener la fecha actual para filtrar menús que ya han pasado
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        console.log('Buscando menús futuros entre', startDate, 'y', endDateStr, '(Hoy es:', todayStr, ')');
        
        try {
            // Primero intentamos buscar menús que comiencen en el futuro
            return FirebaseRealtime.listenToCollection('menus', {
                where: [
                    // Buscamos menús que terminen en el futuro (para incluir menús actuales que se extienden al futuro)
                    ['endDate', '>=', todayStr]
                ],
                orderBy: [['startDate', 'asc']],
                onSnapshot: (snapshot) => {
                    try {
                        console.log('Snapshot recibido en listenToFutureMenus, docs:', snapshot.docs.length);
                        
                        if (snapshot.empty) {
                            console.log('No hay menús futuros disponibles');
                            callback([]);
                            return;
                        }
                        
                        // Convertir documentos a objetos de menú
                        let menus = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                        console.log('Menús encontrados (sin filtrar):', menus.length);
                        
                        // Filtrar menús que comienzan en el futuro o que incluyen la fecha de inicio solicitada
                        const futureMenus = menus.filter(menu => {
                            // Convertir fechas a objetos Date para comparación
                            const menuStartDate = new Date(menu.startDate + 'T00:00:00');
                            const menuEndDate = new Date(menu.endDate + 'T00:00:00');
                            
                            // Un menú es futuro si:
                            // 1. Comienza después de la fecha de inicio solicitada
                            // 2. No ha terminado aún (su fecha de fin es mayor o igual a hoy)
                            // 3. No es el menú actual (su fecha de inicio es mayor que hoy)
                            return menuStartDate >= startDateObj && 
                                   menuEndDate >= today && 
                                   menuStartDate > today;
                        });
                        
                        console.log('Menús futuros filtrados:', futureMenus.length);
                        
                        // Ordenar por fecha de inicio ascendente
                        futureMenus.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                        
                        // Mostrar información de los menús encontrados
                        futureMenus.forEach((menu, index) => {
                            console.log(`Menú futuro ${index + 1}:`, menu.name, 'Inicio:', menu.startDate, 'Fin:', menu.endDate);
                        });
                        
                        callback(futureMenus);
                    } catch (error) {
                        console.error('Error procesando snapshot en listenToFutureMenus:', error);
                        callback([], error);
                    }
                },
                onError: (error) => {
                    console.error('Error en listenToFutureMenus:', error);
                    callback([], error);
                }
            });
        } catch (error) {
            console.error('Error al iniciar listenToFutureMenus:', error);
            callback([], error);
            return null;
        }
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