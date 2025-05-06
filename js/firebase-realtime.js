/**
 * firebase-realtime.js
 * Sincronización en tiempo real con Firebase Firestore
 * Este módulo proporciona funciones para escuchar cambios en tiempo real
 * y mantener la interfaz de usuario actualizada.
 */

import { db, collection, doc, onSnapshot, query, where } from './firebase-config.js';
import { logError, logCustomEvent } from './firebase-monitoring.js';

const RealtimeSync = {
    /**
     * Listeners activos
     */
    activeListeners: {},

    /**
     * Escucha cambios en una colección completa
     * @param {string} collectionName - Nombre de la colección
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener para poder cancelarlo después
     */
    listenToCollection: function(collectionName, callback) {
        try {
            const listenerId = `collection_${collectionName}_${Date.now()}`;
            
            // Crear listener
            const unsubscribe = onSnapshot(
                collection(db, collectionName),
                (snapshot) => {
                    const documents = [];
                    snapshot.forEach((doc) => {
                        documents.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Llamar al callback con los documentos
                    callback(documents);
                    
                    // Registrar evento
                    logCustomEvent('realtime_update', {
                        type: 'collection',
                        collection: collectionName,
                        count: documents.length
                    });
                },
                (error) => {
                    logError(error, { operation: 'listenToCollection', collection: collectionName });
                    console.error(`Error al escuchar cambios en colección ${collectionName}:`, error);
                }
            );
            
            // Guardar referencia para poder cancelar después
            this.activeListeners[listenerId] = unsubscribe;
            
            return listenerId;
        } catch (error) {
            logError(error, { operation: 'listenToCollection', collection: collectionName });
            console.error(`Error al configurar listener para colección ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Escucha cambios en un documento específico
     * @param {string} collectionName - Nombre de la colección
     * @param {string} documentId - ID del documento
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener para poder cancelarlo después
     */
    listenToDocument: function(collectionName, documentId, callback) {
        try {
            const listenerId = `document_${collectionName}_${documentId}_${Date.now()}`;
            
            // Crear listener
            const unsubscribe = onSnapshot(
                doc(db, collectionName, documentId),
                (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        // Llamar al callback con el documento
                        callback({
                            id: docSnapshot.id,
                            ...docSnapshot.data()
                        });
                        
                        // Registrar evento
                        logCustomEvent('realtime_update', {
                            type: 'document',
                            collection: collectionName,
                            document: documentId
                        });
                    } else {
                        // Documento eliminado
                        callback(null);
                        
                        // Registrar evento
                        logCustomEvent('realtime_update', {
                            type: 'document_deleted',
                            collection: collectionName,
                            document: documentId
                        });
                    }
                },
                (error) => {
                    logError(error, { operation: 'listenToDocument', collection: collectionName, document: documentId });
                    console.error(`Error al escuchar cambios en documento ${collectionName}/${documentId}:`, error);
                }
            );
            
            // Guardar referencia para poder cancelar después
            this.activeListeners[listenerId] = unsubscribe;
            
            return listenerId;
        } catch (error) {
            logError(error, { operation: 'listenToDocument', collection: collectionName, document: documentId });
            console.error(`Error al configurar listener para documento ${collectionName}/${documentId}:`, error);
            throw error;
        }
    },

    /**
     * Escucha cambios en documentos que cumplen una condición
     * @param {string} collectionName - Nombre de la colección
     * @param {string} field - Campo por el que filtrar
     * @param {string} operator - Operador de comparación ('==', '>', '<', '>=', '<=', '!=')
     * @param {any} value - Valor a comparar
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener para poder cancelarlo después
     */
    listenToQuery: function(collectionName, field, operator, value, callback) {
        try {
            const listenerId = `query_${collectionName}_${field}_${operator}_${Date.now()}`;
            
            // Crear query
            const q = query(
                collection(db, collectionName),
                where(field, operator, value)
            );
            
            // Crear listener
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const documents = [];
                    snapshot.forEach((doc) => {
                        documents.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    // Llamar al callback con los documentos
                    callback(documents);
                    
                    // Registrar evento
                    logCustomEvent('realtime_update', {
                        type: 'query',
                        collection: collectionName,
                        field: field,
                        operator: operator,
                        value: value,
                        count: documents.length
                    });
                },
                (error) => {
                    logError(error, { operation: 'listenToQuery', collection: collectionName, field, operator, value });
                    console.error(`Error al escuchar cambios en query ${collectionName}:`, error);
                }
            );
            
            // Guardar referencia para poder cancelar después
            this.activeListeners[listenerId] = unsubscribe;
            
            return listenerId;
        } catch (error) {
            logError(error, { operation: 'listenToQuery', collection: collectionName, field, operator, value });
            console.error(`Error al configurar listener para query ${collectionName}:`, error);
            throw error;
        }
    },

    /**
     * Cancela un listener específico
     * @param {string} listenerId - ID del listener a cancelar
     * @returns {boolean} - true si se canceló correctamente, false si no existía
     */
    cancelListener: function(listenerId) {
        if (this.activeListeners[listenerId]) {
            // Ejecutar función de cancelación
            this.activeListeners[listenerId]();
            
            // Eliminar referencia
            delete this.activeListeners[listenerId];
            
            return true;
        }
        
        return false;
    },

    /**
     * Cancela todos los listeners activos
     */
    cancelAllListeners: function() {
        for (const listenerId in this.activeListeners) {
            this.cancelListener(listenerId);
        }
        
        console.log('Todos los listeners de tiempo real han sido cancelados');
    },

    /**
     * Escucha cambios en menús activos
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener
     */
    listenToActiveMenus: function(callback) {
        return this.listenToQuery('menus', 'active', '==', true, callback);
    },

    /**
     * Escucha cambios en coordinadores activos
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener
     */
    listenToActiveCoordinators: function(callback) {
        return this.listenToQuery('coordinators', 'active', '==', true, callback);
    },

    /**
     * Escucha cambios en confirmaciones de asistencia de un coordinador
     * @param {string} coordinatorId - ID del coordinador
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener
     */
    listenToCoordinatorAttendance: function(coordinatorId, callback) {
        return this.listenToQuery('attendanceConfirmations', 'coordinatorId', '==', coordinatorId, callback);
    },

    /**
     * Escucha cambios en confirmaciones de asistencia para una semana específica
     * @param {string|Date} weekStartDate - Fecha de inicio de la semana
     * @param {Function} callback - Función a ejecutar cuando hay cambios
     * @returns {string} - ID del listener
     */
    listenToWeekAttendance: function(weekStartDate, callback) {
        // Normalizar fecha
        if (weekStartDate instanceof Date) {
            weekStartDate = weekStartDate.toISOString().split('T')[0];
        }
        
        return this.listenToQuery('attendanceConfirmations', 'weekStartDate', '==', weekStartDate, callback);
    }
};

// Exportar módulo
export default RealtimeSync;
