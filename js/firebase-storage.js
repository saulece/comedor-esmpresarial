/**
 * firebase-storage.js
 * Adaptador de Firebase Firestore para la aplicación Comedor Empresarial
 * Mantiene la misma interfaz que StorageUtil pero usa Firestore en lugar de localStorage
 */

// Asumimos que FirebaseService ya está disponible desde firebase-config.js
const FirestoreUtil = {
    // Claves para las colecciones en Firestore (mantenemos los mismos nombres)
    KEYS: {
        USERS: 'comedor_users',
        DISHES: 'comedor_dishes',
        MENUS: 'comedor_menus',
        COORDINATORS: 'comedor_coordinators',
        CONFIRMATIONS: 'comedor_confirmations',
        ORDERS: 'comedor_orders',
        APP_STATE: 'comedor_app_state',
        ATTENDANCE_CONFIRMATIONS: 'attendanceConfirmations'
    },

    // Referencia a Firestore
    db: null,

    /**
     * Inicializa la conexión con Firestore
     * @returns {boolean} - true si se inicializó correctamente
     */
    init: function() {
        try {
            // Obtener la instancia de Firestore
            this.db = FirebaseService.getFirestore();
            console.log('FirestoreUtil inicializado correctamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar FirestoreUtil:', error);
            return false;
        }
    },

    /**
     * Inicializa el almacenamiento con datos predeterminados si no existen
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se inicializó el almacenamiento
     */
    initStorage: async function() {
        console.log('Verificando almacenamiento existente en Firestore...');
        
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            // Verificar si existe el documento de estado de la aplicación
            const appStateRef = this.db.collection('system').doc('app_state');
            const appStateDoc = await appStateRef.get();
            
            if (!appStateDoc.exists) {
                // Si no existe, inicializar las colecciones
                console.log('Primera inicialización de Firestore');
                
                // Crear documento de estado
                await appStateRef.set({
                    initialized: true,
                    lastUpdate: new Date().toISOString(),
                    version: '1.0.0'
                });
                
                // Crear colecciones vacías (en Firestore, las colecciones se crean automáticamente)
                console.log('Almacenamiento en Firestore inicializado correctamente');
                return true;
            } else {
                console.log('Almacenamiento en Firestore ya estaba inicializado');
                return false;
            }
        } catch (error) {
            console.error('Error al inicializar almacenamiento en Firestore:', error);
            return false;
        }
    },

    /**
     * Guarda datos en una colección de Firestore
     * @param {string} key - Nombre de la colección
     * @param {any} data - Datos a guardar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se guardó correctamente
     */
    save: async function(key, data) {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            // Si key es APP_STATE, guardar como documento único
            if (key === this.KEYS.APP_STATE) {
                await this.db.collection('system').doc('app_state').set(data);
            } else {
                // Para colecciones de arrays, reemplazar toda la colección
                // Esto es diferente a como funciona Firestore normalmente,
                // pero mantiene la compatibilidad con la API actual
                
                // Primero eliminar todos los documentos existentes
                const batch = this.db.batch();
                const snapshot = await this.db.collection(key).get();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                // Luego agregar los nuevos documentos
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        const docRef = this.db.collection(key).doc(item.id);
                        batch.set(docRef, item);
                    });
                }
                
                await batch.commit();
            }
            
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${key}:`, error);
            return false;
        }
    },

    /**
     * Recupera datos de Firestore
     * @param {string} key - Nombre de la colección
     * @param {any} defaultValue - Valor por defecto si no se encuentra la colección
     * @returns {Promise<any>} - Promesa que resuelve a los datos recuperados
     */
    get: async function(key, defaultValue = null) {
        if (!this.db) {
            if (!this.init()) {
                return defaultValue;
            }
        }
        
        try {
            if (key === this.KEYS.APP_STATE) {
                const doc = await this.db.collection('system').doc('app_state').get();
                return doc.exists ? doc.data() : defaultValue;
            } else {
                const snapshot = await this.db.collection(key).get();
                
                if (snapshot.empty) {
                    return defaultValue;
                }
                
                // Convertir a array para mantener compatibilidad
                return snapshot.docs.map(doc => doc.data());
            }
        } catch (error) {
            console.error(`Error al recuperar datos de ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Actualiza un elemento específico en una colección
     * @param {string} key - Nombre de la colección
     * @param {string} itemId - ID del elemento a actualizar
     * @param {any} newData - Nuevos datos para el elemento
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateItem: async function(key, itemId, newData) {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            // Preservar el ID original
            newData.id = itemId;
            
            // Actualizar el documento
            await this.db.collection(key).doc(itemId).update(newData);
            
            return true;
        } catch (error) {
            console.error(`Error al actualizar elemento en ${key}:`, error);
            return false;
        }
    },

    /**
     * Elimina un elemento de una colección
     * @param {string} key - Nombre de la colección
     * @param {string} itemId - ID del elemento a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteItem: async function(key, itemId) {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            await this.db.collection(key).doc(itemId).delete();
            return true;
        } catch (error) {
            console.error(`Error al eliminar elemento de ${key}:`, error);
            return false;
        }
    },

    /**
     * Agrega un elemento a una colección con mejor manejo de errores
     * @param {string} key - Nombre de la colección
     * @param {any} item - Elemento a agregar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se agregó correctamente
     */
    addItem: async function(key, item) {
        console.log(`[Firestore] Agregando item a colección ${key}`);
        
        // 1. Validación de parámetros
        if (!key) {
            console.error(`[Firestore] ERROR: Nombre de colección no proporcionado`);
            return false;
        }
        
        if (!item) {
            console.error(`[Firestore] ERROR: Item no proporcionado para colección ${key}`);
            return false;
        }
        
        // 2. Verificar que el elemento tenga un ID válido
        if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
            console.error(`[Firestore] ERROR: Item sin ID válido para colección ${key}:`, item);
            return false;
        }
        
        // 3. Asegurar que Firestore esté inicializado
        if (!this.db) {
            console.warn(`[Firestore] Base de datos no inicializada, intentando inicializar...`);
            try {
                const initResult = this.init();
                if (!initResult) {
                    console.error(`[Firestore] ERROR: No se pudo inicializar Firestore`);
                    return false;
                }
                console.log(`[Firestore] Inicialización exitosa de Firestore`);
            } catch (initError) {
                console.error(`[Firestore] ERROR: Excepción al inicializar Firestore:`, initError);
                return false;
            }
        }
        
        // 4. Verificar nuevamente que this.db esté disponible después de la inicialización
        if (!this.db) {
            console.error(`[Firestore] ERROR: Firestore no disponible después de inicialización`);
            return false;
        }
        
        // 5. Procesar el item para asegurar que sea compatible con Firestore
        const processedItem = this.processItemForFirestore(item);
        
        try {
            // 6. Crear referencia al documento
            const docRef = this.db.collection(key).doc(processedItem.id);
            
            // 7. Intentar la operación de escritura con reintentos
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!success && attempts < maxAttempts) {
                attempts++;
                try {
                    // Intentar guardar el documento
                    await docRef.set(processedItem);
                    success = true;
                    console.log(`[Firestore] Item guardado exitosamente en ${key}/${processedItem.id} (intento ${attempts})`);
                } catch (writeError) {
                    if (attempts < maxAttempts) {
                        console.warn(`[Firestore] Error al guardar en intento ${attempts}, reintentando:`, writeError);
                        // Esperar un momento antes de reintentar
                        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
                    } else {
                        // Último intento falló, propagar el error
                        throw writeError;
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error(`[Firestore] ERROR: No se pudo guardar el item en ${key}:`, error);
            
            // 8. Intentar guardar localmente como respaldo si falla Firebase
            try {
                if (window.localStorage) {
                    const backupKey = `firebase_backup_${key}_${item.id}`;
                    localStorage.setItem(backupKey, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        collection: key,
                        item: processedItem
                    }));
                    console.warn(`[Firestore] Item guardado como respaldo local en ${backupKey}`);
                }
            } catch (backupError) {
                console.error(`[Firestore] ERROR: No se pudo crear respaldo local:`, backupError);
            }
            
            return false;
        }
    },
    
    /**
     * Procesa un item para asegurar que sea compatible con Firestore
     * @private
     * @param {Object} item - Item a procesar
     * @returns {Object} - Item procesado
     */
    processItemForFirestore: function(item) {
        // Crear una copia para no modificar el original
        const processed = JSON.parse(JSON.stringify(item));
        
        // Asegurar que las fechas estén en formato ISO string
        if (processed.createdAt instanceof Date) {
            processed.createdAt = processed.createdAt.toISOString();
        }
        
        if (processed.updatedAt instanceof Date) {
            processed.updatedAt = processed.updatedAt.toISOString();
        }
        
        // Si no tiene timestamps, agregarlos
        if (!processed.createdAt) {
            processed.createdAt = new Date().toISOString();
        }
        
        processed.updatedAt = new Date().toISOString();
        
        return processed;
    }
    },

    /**
     * Obtiene un elemento específico de una colección
     * @param {string} key - Nombre de la colección
     * @param {string} itemId - ID del elemento a obtener
     * @returns {Promise<any|null>} - Promesa que resuelve al elemento encontrado o null
     */
    getItem: async function(key, itemId) {
        if (!this.db) {
            if (!this.init()) {
                return null;
            }
        }
        
        try {
            const doc = await this.db.collection(key).doc(itemId).get();
            
            if (!doc.exists) {
                return null;
            }
            
            return doc.data();
        } catch (error) {
            console.error(`Error al obtener elemento de ${key}:`, error);
            return null;
        }
    },

    /**
     * Elimina una colección completa
     * @param {string} key - Nombre de la colección a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    remove: async function(key) {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            const batch = this.db.batch();
            const snapshot = await this.db.collection(key).get();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            return true;
        } catch (error) {
            console.error(`Error al eliminar colección ${key}:`, error);
            return false;
        }
    },

    /**
     * Limpia todas las colecciones
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se limpió correctamente
     */
    clear: async function() {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            // Eliminar todas las colecciones una por una
            for (const key of Object.values(this.KEYS)) {
                await this.remove(key);
            }
            
            // Eliminar también el estado de la aplicación
            await this.db.collection('system').doc('app_state').delete();
            
            return true;
        } catch (error) {
            console.error('Error al limpiar todas las colecciones:', error);
            return false;
        }
    },

    // Adaptadores para mantener compatibilidad con la API existente
    // Estos métodos son versiones asíncronas de los originales

    // CRUD para Usuarios
    Users: {
        add: async function(user) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.USERS, user);
        },
        get: async function(userId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.USERS, userId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.USERS, []);
        },
        update: async function(userId, userData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.USERS, userId, userData);
        },
        delete: async function(userId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.USERS, userId);
        }
    },

    // CRUD para Platillos
    Dishes: {
        add: async function(dish) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.DISHES, dish);
        },
        get: async function(dishId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.DISHES, dishId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.DISHES, []);
        },
        getByCategory: async function(category) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.DISHES)
                    .where('category', '==', category)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener platillos por categoría:`, error);
                return [];
            }
        },
        update: async function(dishId, dishData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.DISHES, dishId, dishData);
        },
        delete: async function(dishId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.DISHES, dishId);
        }
    },

    // CRUD para Menús
    Menus: {
        add: async function(menu) {
            console.log('[DEBUG] Menus.add llamado con menu:', JSON.stringify(menu));
            try {
                const result = await FirestoreUtil.addItem(FirestoreUtil.KEYS.MENUS, menu);
                console.log('[DEBUG] Resultado de Menus.add:', result);
                return result;
            } catch (error) {
                console.error('[ERROR] Error en Menus.add:', error);
                return false;
            }
        },
        get: async function(menuId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.MENUS, menuId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.MENUS, []);
        },
        getActive: async function() {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return null;
                }
            }
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.MENUS)
                    .where('startDate', '<=', today)
                    .where('endDate', '>=', today)
                    .limit(1)
                    .get();
                
                return snapshot.empty ? null : snapshot.docs[0].data();
            } catch (error) {
                console.error(`Error al obtener menú activo:`, error);
                return null;
            }
        },
        update: async function(menuId, menuData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.MENUS, menuId, menuData);
        },
        delete: async function(menuId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.MENUS, menuId);
        }
    },

    // CRUD para Coordinadores
    Coordinators: {
        add: async function(coordinator) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.COORDINATORS, coordinator);
        },
        get: async function(coordinatorId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.COORDINATORS, coordinatorId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.COORDINATORS, []);
        },
        getByDepartment: async function(department) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.COORDINATORS)
                    .where('department', '==', department)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener coordinadores por departamento:`, error);
                return [];
            }
        },
        update: async function(coordinatorId, coordinatorData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.COORDINATORS, coordinatorId, coordinatorData);
        },
        delete: async function(coordinatorId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.COORDINATORS, coordinatorId);
        }
    },

    // CRUD para Confirmaciones
    Confirmations: {
        add: async function(confirmation) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.CONFIRMATIONS, confirmation);
        },
        get: async function(confirmationId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.CONFIRMATIONS, confirmationId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.CONFIRMATIONS, []);
        },
        getByStatus: async function(status) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.CONFIRMATIONS)
                    .where('status', '==', status)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener confirmaciones por estado:`, error);
                return [];
            }
        },
        getByCoordinator: async function(coordinatorId) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.CONFIRMATIONS)
                    .where('coordinatorId', '==', coordinatorId)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener confirmaciones por coordinador:`, error);
                return [];
            }
        },
        update: async function(confirmationId, confirmationData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.CONFIRMATIONS, confirmationId, confirmationData);
        },
        delete: async function(confirmationId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.CONFIRMATIONS, confirmationId);
        }
    },

    // CRUD para Pedidos
    Orders: {
        add: async function(order) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.ORDERS, order);
        },
        get: async function(orderId) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.ORDERS, orderId);
        },
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.ORDERS, []);
        },
        getByStatus: async function(status) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.ORDERS)
                    .where('status', '==', status)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener pedidos por estado:`, error);
                return [];
            }
        },
        getByUser: async function(userId) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.ORDERS)
                    .where('userId', '==', userId)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener pedidos por usuario:`, error);
                return [];
            }
        },
        update: async function(orderId, orderData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.ORDERS, orderId, orderData);
        },
        delete: async function(orderId) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.ORDERS, orderId);
        }
    },

    /**
     * Operaciones CRUD para las confirmaciones de asistencia
     */
    AttendanceConfirmations: {
        getAll: async function() {
            return await FirestoreUtil.get(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
        },
        
        get: async function(id) {
            return await FirestoreUtil.getItem(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS, id);
        },
        
        getByCoordinator: async function(coordinatorId) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return [];
                }
            }
            
            try {
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS)
                    .where('coordinatorId', '==', coordinatorId)
                    .get();
                
                return snapshot.empty ? [] : snapshot.docs.map(doc => doc.data());
            } catch (error) {
                console.error(`Error al obtener confirmaciones por coordinador:`, error);
                return [];
            }
        },
        
        getByCoordinatorAndWeek: async function(coordinatorId, weekStartDate) {
            if (!FirestoreUtil.db) {
                if (!FirestoreUtil.init()) {
                    return null;
                }
            }
            
            try {
                // Normalizar la fecha de inicio de semana
                let startDateStr;
                
                if (weekStartDate instanceof Date) {
                    startDateStr = weekStartDate.toISOString().split('T')[0];
                } else if (typeof weekStartDate === 'string') {
                    // Asumimos que ya está en formato YYYY-MM-DD
                    startDateStr = weekStartDate;
                } else {
                    console.error('Formato de fecha inválido');
                    return null;
                }
                
                const snapshot = await FirestoreUtil.db.collection(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS)
                    .where('coordinatorId', '==', coordinatorId)
                    .where('weekStartDate', '==', startDateStr)
                    .limit(1)
                    .get();
                
                return snapshot.empty ? null : snapshot.docs[0].data();
            } catch (error) {
                console.error(`Error al obtener confirmación por coordinador y semana:`, error);
                return null;
            }
        },
        
        add: async function(confirmation) {
            return await FirestoreUtil.addItem(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS, confirmation);
        },
        
        update: async function(id, updatedData) {
            return await FirestoreUtil.updateItem(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS, id, updatedData);
        },
        
        delete: async function(id) {
            return await FirestoreUtil.deleteItem(FirestoreUtil.KEYS.ATTENDANCE_CONFIRMATIONS, id);
        }
    },

    /**
     * Exporta todos los datos a un objeto JSON
     * @returns {Promise<Object>} - Promesa que resuelve a un objeto con todos los datos
     */
    exportData: async function() {
        if (!this.db) {
            if (!this.init()) {
                return {};
            }
        }
        
        try {
            const data = {};
            
            // Exportar cada colección
            for (const key of Object.values(this.KEYS)) {
                data[key] = await this.get(key, []);
            }
            
            // Exportar también el estado de la aplicación
            const appState = await this.db.collection('system').doc('app_state').get();
            data.app_state = appState.exists ? appState.data() : null;
            
            return data;
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return {};
        }
    },

    /**
     * Descarga los datos como un archivo JSON
     */
    downloadData: async function() {
        try {
            const data = await this.exportData();
            
            // Crear un blob con los datos
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Crear un enlace para descargar el archivo
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comedor_data_${new Date().toISOString().split('T')[0]}.json`;
            
            // Simular clic en el enlace para descargar el archivo
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } catch (error) {
            console.error('Error al descargar datos:', error);
        }
    },

    /**
     * Importa datos desde un objeto JSON
     * @param {Object} data - Datos a importar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se importó correctamente
     */
    importData: async function(data) {
        if (!this.db) {
            if (!this.init()) {
                return false;
            }
        }
        
        try {
            // Verificar que los datos sean válidos
            if (!data || typeof data !== 'object') {
                console.error('Datos de importación inválidos');
                return false;
            }
            
            // Limpiar todas las colecciones primero
            await this.clear();
            
            // Importar cada colección
            for (const key of Object.values(this.KEYS)) {
                if (data[key] && Array.isArray(data[key])) {
                    await this.save(key, data[key]);
                }
            }
            
            // Importar también el estado de la aplicación
            if (data.app_state) {
                await this.db.collection('system').doc('app_state').set(data.app_state);
            }
            
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    },

    /**
     * Importa datos desde un archivo JSON
     * @param {File} file - Archivo JSON a importar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se importó correctamente
     */
    importFromFile: async function(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        const success = await this.importData(data);
                        resolve(success);
                    } catch (error) {
                        console.error('Error al procesar archivo JSON:', error);
                        reject(error);
                    }
                };
                
                reader.onerror = (error) => {
                    console.error('Error al leer archivo:', error);
                    reject(error);
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('Error al importar desde archivo:', error);
                reject(error);
            }
        });
    }
};

// Exportar para uso en otros módulos
const StorageUtil = FirestoreUtil;
