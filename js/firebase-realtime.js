/**
 * firebase-realtime.js
 * Módulo para gestionar la sincronización en tiempo real con Firebase
 */

const FirebaseRealtime = {
    // Almacena referencias a los listeners activos para poder cancelarlos
    _activeListeners: {},
    
    /**
     * Escucha cambios en tiempo real en una colección completa
     * @param {string} collectionName - Nombre de la colección a escuchar
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @param {Object} options - Opciones adicionales (orderBy, where, limit)
     * @returns {string} - ID del listener para poder cancelarlo
     */
    listenToCollection: function(collectionName, callback, options = {}) {
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('Firebase no está disponible para sincronización en tiempo real');
                callback([], new Error('Firebase no está disponible'));
                return null;
            }
            
            // Crear referencia a la colección
            let query = firebase.firestore().collection(collectionName);
            
            // Aplicar opciones de filtrado y ordenamiento
            if (options.orderBy) {
                query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
            }
            
            if (options.where && Array.isArray(options.where)) {
                options.where.forEach(condition => {
                    query = query.where(condition.field, condition.operator, condition.value);
                });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            // Crear un ID único para este listener
            const listenerId = `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Crear el listener
            const unsubscribe = query.onSnapshot(snapshot => {
                const items = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(items);
            }, error => {
                console.error(`Error al escuchar cambios en ${collectionName}:`, error);
                callback([], error);
            });
            
            // Guardar referencia al listener
            this._activeListeners[listenerId] = {
                unsubscribe,
                collectionName,
                createdAt: new Date()
            };
            
            return listenerId;
        } catch (error) {
            console.error(`Error al crear listener para ${collectionName}:`, error);
            callback([], error);
            return null;
        }
    },
    
    /**
     * Escucha cambios en tiempo real en un documento específico
     * @param {string} collectionName - Nombre de la colección
     * @param {string} documentId - ID del documento a escuchar
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {string} - ID del listener para poder cancelarlo
     */
    listenToDocument: function(collectionName, documentId, callback) {
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('Firebase no está disponible para sincronización en tiempo real');
                callback(null, new Error('Firebase no está disponible'));
                return null;
            }
            
            // Crear un ID único para este listener
            const listenerId = `${collectionName}_${documentId}_${Date.now()}`;
            
            // Crear el listener
            const unsubscribe = firebase.firestore()
                .collection(collectionName)
                .doc(documentId)
                .onSnapshot(doc => {
                    if (doc.exists) {
                        const item = {
                            ...doc.data(),
                            id: doc.id
                        };
                        callback(item);
                    } else {
                        callback(null);
                    }
                }, error => {
                    console.error(`Error al escuchar cambios en ${collectionName}/${documentId}:`, error);
                    callback(null, error);
                });
            
            // Guardar referencia al listener
            this._activeListeners[listenerId] = {
                unsubscribe,
                collectionName,
                documentId,
                createdAt: new Date()
            };
            
            return listenerId;
        } catch (error) {
            console.error(`Error al crear listener para ${collectionName}/${documentId}:`, error);
            callback(null, error);
            return null;
        }
    },
    
    /**
     * Escucha cambios en tiempo real en documentos que cumplen una condición
     * @param {string} collectionName - Nombre de la colección
     * @param {string} field - Campo a filtrar
     * @param {string} operator - Operador de comparación (==, >, <, >=, <=)
     * @param {any} value - Valor a comparar
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @param {Object} options - Opciones adicionales (orderBy, limit)
     * @returns {string} - ID del listener para poder cancelarlo
     */
    listenToQuery: function(collectionName, field, operator, value, callback, options = {}) {
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('Firebase no está disponible para sincronización en tiempo real');
                callback([], new Error('Firebase no está disponible'));
                return null;
            }
            
            // Crear referencia a la colección con filtro
            let query = firebase.firestore()
                .collection(collectionName)
                .where(field, operator, value);
            
            // Aplicar opciones adicionales
            if (options.orderBy) {
                query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            // Crear un ID único para este listener
            const listenerId = `${collectionName}_query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Crear el listener
            const unsubscribe = query.onSnapshot(snapshot => {
                const items = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(items);
            }, error => {
                console.error(`Error al escuchar cambios en consulta de ${collectionName}:`, error);
                callback([], error);
            });
            
            // Guardar referencia al listener
            this._activeListeners[listenerId] = {
                unsubscribe,
                collectionName,
                query: { field, operator, value },
                createdAt: new Date()
            };
            
            return listenerId;
        } catch (error) {
            console.error(`Error al crear listener para consulta en ${collectionName}:`, error);
            callback([], error);
            return null;
        }
    },
    
    /**
     * Cancela un listener específico
     * @param {string} listenerId - ID del listener a cancelar
     * @returns {boolean} - true si se canceló correctamente
     */
    cancelListener: function(listenerId) {
        try {
            if (!this._activeListeners[listenerId]) {
                console.warn(`No se encontró el listener con ID ${listenerId}`);
                return false;
            }
            
            // Cancelar la suscripción
            this._activeListeners[listenerId].unsubscribe();
            
            // Eliminar la referencia
            delete this._activeListeners[listenerId];
            
            return true;
        } catch (error) {
            console.error(`Error al cancelar listener ${listenerId}:`, error);
            return false;
        }
    },
    
    /**
     * Cancela todos los listeners activos
     * @returns {number} - Número de listeners cancelados
     */
    cancelAllListeners: function() {
        try {
            const listenerIds = Object.keys(this._activeListeners);
            let canceledCount = 0;
            
            listenerIds.forEach(id => {
                try {
                    this._activeListeners[id].unsubscribe();
                    delete this._activeListeners[id];
                    canceledCount++;
                } catch (error) {
                    console.error(`Error al cancelar listener ${id}:`, error);
                }
            });
            
            return canceledCount;
        } catch (error) {
            console.error('Error al cancelar todos los listeners:', error);
            return 0;
        }
    },
    
    /**
     * Obtiene información sobre los listeners activos
     * @returns {Array} - Array con información de los listeners activos
     */
    getActiveListeners: function() {
        return Object.keys(this._activeListeners).map(id => ({
            id,
            collectionName: this._activeListeners[id].collectionName,
            documentId: this._activeListeners[id].documentId,
            query: this._activeListeners[id].query,
            createdAt: this._activeListeners[id].createdAt
        }));
    }
};

// Exportar para su uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseRealtime;
} else {
    // Para uso en navegador
    window.FirebaseRealtime = FirebaseRealtime;
}
