/**
 * storage.js
 * Utilidades para el manejo de almacenamiento local (localStorage)
 * Este módulo proporciona una capa de abstracción sobre localStorage
 * para facilitar el almacenamiento y recuperación de datos estructurados.
 */

const StorageUtil = {
    // Claves para las colecciones en localStorage
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

    /**
     * Inicializa el almacenamiento con datos predeterminados si no existen
     * @returns {boolean} - true si se inicializó el almacenamiento, false si ya existía
     */
    initStorage: function() {
        console.log('Verificando almacenamiento existente...');
        
        // Verificar cada colección individualmente y solo inicializar las que no existen
        let initialized = false;
        
        // Verificar cada clave y crear solo las que no existen
        Object.values(this.KEYS).forEach(key => {
            if (localStorage.getItem(key) === null) {
                // Si la clave no existe, inicializarla con un array vacío o un objeto según corresponda
                if (key === this.KEYS.APP_STATE) {
                    this.save(key, {
                        initialized: true,
                        lastUpdate: new Date().toISOString(),
                        version: '1.0.0'
                    });
                } else {
                    this.save(key, []);
                }
                console.log(`Colección ${key} inicializada`);
                initialized = true;
            } else {
                console.log(`Colección ${key} ya existe, preservando datos existentes`);
                
                // Verificar que el formato de los datos sea válido
                try {
                    JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.error(`Error en el formato de datos para ${key}, reinicializando:`, error);
                    if (key === this.KEYS.APP_STATE) {
                        this.save(key, {
                            initialized: true,
                            lastUpdate: new Date().toISOString(),
                            version: '1.0.0'
                        });
                    } else {
                        this.save(key, []);
                    }
                    initialized = true;
                }
            }
        });
        
        if (initialized) {
            console.log('Almacenamiento inicializado o actualizado correctamente');
        } else {
            console.log('Almacenamiento ya estaba correctamente inicializado');
        }
        
        return initialized;
    },

    /**
     * Guarda datos en localStorage
     * @param {string} key - Clave para almacenar los datos
     * @param {any} data - Datos a almacenar (se convertirán a JSON)
     * @returns {boolean} - true si se guardó correctamente
     */
    save: function(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error(`Error al guardar datos en ${key}:`, error);
            return false;
        }
    },

    /**
     * Recupera datos de localStorage
     * @param {string} key - Clave para recuperar los datos
     * @param {any} defaultValue - Valor por defecto si no se encuentra la clave
     * @returns {any} - Datos recuperados o defaultValue si no existen
     */
    get: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            
            if (data === null) {
                return defaultValue;
            }
            
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error al recuperar datos de ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Actualiza un elemento específico en una colección almacenada
     * @param {string} key - Clave de la colección en localStorage
     * @param {string} itemId - ID del elemento a actualizar
     * @param {any} newData - Nuevos datos para el elemento
     * @returns {boolean} - true si se actualizó correctamente
     */
    updateItem: function(key, itemId, newData) {
        try {
            // Obtener la colección actual
            const collection = this.get(key, []);
            
            // Buscar el índice del elemento
            const index = collection.findIndex(item => item.id === itemId);
            
            if (index === -1) {
                console.warn(`No se encontró el elemento con ID ${itemId} en ${key}`);
                return false;
            }
            
            // Preservar el ID original
            newData.id = itemId;
            
            // Actualizar el elemento
            collection[index] = { ...collection[index], ...newData };
            
            // Guardar la colección actualizada
            return this.save(key, collection);
        } catch (error) {
            console.error(`Error al actualizar elemento en ${key}:`, error);
            return false;
        }
    },

    /**
     * Elimina un elemento de una colección almacenada
     * @param {string} key - Clave de la colección en localStorage
     * @param {string} itemId - ID del elemento a eliminar
     * @returns {boolean} - true si se eliminó correctamente
     */
    deleteItem: function(key, itemId) {
        try {
            // Obtener la colección actual
            const collection = this.get(key, []);
            
            // Filtrar el elemento a eliminar
            const newCollection = collection.filter(item => item.id !== itemId);
            
            // Verificar si se eliminó algún elemento
            if (newCollection.length === collection.length) {
                console.warn(`No se encontró el elemento con ID ${itemId} en ${key}`);
                return false;
            }
            
            // Guardar la colección actualizada
            return this.save(key, newCollection);
        } catch (error) {
            console.error(`Error al eliminar elemento de ${key}:`, error);
            return false;
        }
    },

    /**
     * Agrega un elemento a una colección almacenada
     * @param {string} key - Clave de la colección en localStorage
     * @param {any} item - Elemento a agregar
     * @returns {boolean} - true si se agregó correctamente
     */
    addItem: function(key, item) {
        try {
            // Verificar que el elemento tenga un ID
            if (!item.id) {
                console.error(`No se puede agregar un elemento sin ID a ${key}`);
                return false;
            }
            
            // Obtener la colección actual
            const collection = this.get(key, []);
            
            // Verificar si ya existe un elemento con el mismo ID
            const exists = collection.some(existingItem => existingItem.id === item.id);
            
            if (exists) {
                console.warn(`Ya existe un elemento con ID ${item.id} en ${key}`);
                return false;
            }
            
            // Agregar el elemento y guardar
            collection.push(item);
            return this.save(key, collection);
        } catch (error) {
            console.error(`Error al agregar elemento a ${key}:`, error);
            return false;
        }
    },

    /**
     * Obtiene un elemento específico de una colección
     * @param {string} key - Clave de la colección en localStorage
     * @param {string} itemId - ID del elemento a obtener
     * @returns {any|null} - El elemento encontrado o null si no existe
     */
    getItem: function(key, itemId) {
        try {
            // Obtener la colección
            const collection = this.get(key, []);
            
            // Buscar el elemento
            return collection.find(item => item.id === itemId) || null;
        } catch (error) {
            console.error(`Error al obtener elemento de ${key}:`, error);
            return null;
        }
    },

    /**
     * Elimina una clave de localStorage
     * @param {string} key - Clave a eliminar
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error al eliminar ${key}:`, error);
        }
    },

    /**
     * Limpia todo el localStorage
     */
    clear: function() {
        try {
            localStorage.clear();
            console.log('Almacenamiento limpiado correctamente');
        } catch (error) {
            console.error('Error al limpiar el almacenamiento:', error);
        }
    },

    // CRUD para Usuarios
    Users: {
        add: function(user) {
            return StorageUtil.addItem(StorageUtil.KEYS.USERS, user);
        },
        get: function(userId) {
            return StorageUtil.getItem(StorageUtil.KEYS.USERS, userId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.USERS, []);
        },
        update: function(userId, userData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.USERS, userId, userData);
        },
        delete: function(userId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.USERS, userId);
        }
    },

    // CRUD para Platillos
    Dishes: {
        add: function(dish) {
            return StorageUtil.addItem(StorageUtil.KEYS.DISHES, dish);
        },
        get: function(dishId) {
            return StorageUtil.getItem(StorageUtil.KEYS.DISHES, dishId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.DISHES, []);
        },
        getByCategory: function(category) {
            const dishes = StorageUtil.get(StorageUtil.KEYS.DISHES, []);
            return dishes.filter(dish => dish.category === category);
        },
        update: function(dishId, dishData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.DISHES, dishId, dishData);
        },
        delete: function(dishId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.DISHES, dishId);
        }
    },

    // CRUD para Menús
    Menus: {
        add: function(menu) {
            return StorageUtil.addItem(StorageUtil.KEYS.MENUS, menu);
        },
        get: function(menuId) {
            return StorageUtil.getItem(StorageUtil.KEYS.MENUS, menuId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.MENUS, []);
        },
        getActive: function() {
            const menus = StorageUtil.get(StorageUtil.KEYS.MENUS, []);
            return menus.filter(menu => menu.active);
        },
        update: function(menuId, menuData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.MENUS, menuId, menuData);
        },
        delete: function(menuId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.MENUS, menuId);
        }
    },

    // CRUD para Coordinadores
    Coordinators: {
        add: function(coordinator) {
            return StorageUtil.addItem(StorageUtil.KEYS.COORDINATORS, coordinator);
        },
        get: function(coordinatorId) {
            return StorageUtil.getItem(StorageUtil.KEYS.COORDINATORS, coordinatorId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.COORDINATORS, []);
        },
        getByDepartment: function(department) {
            const coordinators = StorageUtil.get(StorageUtil.KEYS.COORDINATORS, []);
            return coordinators.filter(coordinator => coordinator.department === department);
        },
        update: function(coordinatorId, coordinatorData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.COORDINATORS, coordinatorId, coordinatorData);
        },
        delete: function(coordinatorId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.COORDINATORS, coordinatorId);
        }
    },

    // CRUD para Confirmaciones
    Confirmations: {
        add: function(confirmation) {
            return StorageUtil.addItem(StorageUtil.KEYS.CONFIRMATIONS, confirmation);
        },
        get: function(confirmationId) {
            return StorageUtil.getItem(StorageUtil.KEYS.CONFIRMATIONS, confirmationId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.CONFIRMATIONS, []);
        },
        getByStatus: function(status) {
            const confirmations = StorageUtil.get(StorageUtil.KEYS.CONFIRMATIONS, []);
            return confirmations.filter(confirmation => confirmation.status === status);
        },
        getByCoordinator: function(coordinatorId) {
            const confirmations = StorageUtil.get(StorageUtil.KEYS.CONFIRMATIONS, []);
            return confirmations.filter(confirmation => confirmation.coordinatorId === coordinatorId);
        },
        update: function(confirmationId, confirmationData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.CONFIRMATIONS, confirmationId, confirmationData);
        },
        delete: function(confirmationId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.CONFIRMATIONS, confirmationId);
        }
    },

    // CRUD para Pedidos
    Orders: {
        add: function(order) {
            return StorageUtil.addItem(StorageUtil.KEYS.ORDERS, order);
        },
        get: function(orderId) {
            return StorageUtil.getItem(StorageUtil.KEYS.ORDERS, orderId);
        },
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.ORDERS, []);
        },
        getByStatus: function(status) {
            const orders = StorageUtil.get(StorageUtil.KEYS.ORDERS, []);
            return orders.filter(order => order.status === status);
        },
        getByUser: function(userId) {
            const orders = StorageUtil.get(StorageUtil.KEYS.ORDERS, []);
            return orders.filter(order => order.userId === userId);
        },
        update: function(orderId, orderData) {
            return StorageUtil.updateItem(StorageUtil.KEYS.ORDERS, orderId, orderData);
        },
        delete: function(orderId) {
            return StorageUtil.deleteItem(StorageUtil.KEYS.ORDERS, orderId);
        }
    },

    /**
     * Operaciones CRUD para las confirmaciones de asistencia
     */
    AttendanceConfirmations: {
        /**
         * Obtiene todas las confirmaciones de asistencia
         * @returns {Array} - Lista de confirmaciones de asistencia
         */
        getAll: function() {
            return StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
        },
        
        /**
         * Obtiene una confirmación de asistencia por su ID
         * @param {string} id - ID de la confirmación de asistencia
         * @returns {Object|null} - Confirmación de asistencia o null si no existe
         */
        get: function(id) {
            const confirmations = StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
            return confirmations.find(confirmation => confirmation.id === id) || null;
        },
        
        /**
         * Obtiene las confirmaciones de asistencia de un coordinador
         * @param {string} coordinatorId - ID del coordinador
         * @returns {Array} - Lista de confirmaciones de asistencia del coordinador
         */
        getByCoordinator: function(coordinatorId) {
            const confirmations = StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
            return confirmations.filter(confirmation => confirmation.coordinatorId === coordinatorId);
        },
        
        /**
         * Obtiene la confirmación de asistencia de un coordinador para una semana específica
         * @param {string} coordinatorId - ID del coordinador
         * @param {Date|string} weekStartDate - Fecha de inicio de la semana
         * @returns {Object|null} - Confirmación de asistencia o null si no existe
         */
        getByCoordinatorAndWeek: function(coordinatorId, weekStartDate) {
            // Normalizar la fecha de inicio de semana a formato ISO
            let weekStart;
            
            if (weekStartDate instanceof Date) {
                weekStart = weekStartDate.toISOString().split('T')[0];
            } else if (typeof weekStartDate === 'string') {
                // Si es una fecha ISO completa, extraer solo la parte de la fecha
                if (weekStartDate.includes('T')) {
                    weekStart = weekStartDate.split('T')[0];
                } else {
                    weekStart = weekStartDate;
                }
            } else {
                console.error('Formato de fecha inválido');
                return null;
            }
            
            // Obtener todas las confirmaciones del coordinador
            const confirmations = this.getByCoordinator(coordinatorId);
            
            // Buscar la confirmación para la semana específica
            return confirmations.find(confirmation => {
                // Normalizar la fecha de la confirmación
                const confirmationWeekStart = confirmation.weekStartDate instanceof Date
                    ? confirmation.weekStartDate.toISOString().split('T')[0]
                    : confirmation.weekStartDate.split('T')[0];
                
                return confirmationWeekStart === weekStart;
            }) || null;
        },
        
        /**
         * Agrega una nueva confirmación de asistencia
         * @param {Object} confirmation - Confirmación de asistencia a agregar
         * @returns {boolean} - true si se agregó correctamente
         */
        add: function(confirmation) {
            try {
                // Verificar que tenga los campos requeridos
                if (!confirmation.coordinatorId || !confirmation.weekStartDate) {
                    console.error('La confirmación debe tener coordinatorId y weekStartDate');
                    return false;
                }
                
                // Verificar si ya existe una confirmación para esta semana y coordinador
                const existing = this.getByCoordinatorAndWeek(
                    confirmation.coordinatorId,
                    confirmation.weekStartDate
                );
                
                if (existing) {
                    console.warn('Ya existe una confirmación para esta semana y coordinador');
                    return false;
                }
                
                // Obtener todas las confirmaciones
                const confirmations = StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
                
                // Agregar la nueva confirmación
                confirmations.push(confirmation);
                
                // Guardar
                return StorageUtil.save(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, confirmations);
            } catch (error) {
                console.error('Error al agregar confirmación de asistencia:', error);
                return false;
            }
        },
        
        /**
         * Actualiza una confirmación de asistencia existente
         * @param {string} id - ID de la confirmación de asistencia
         * @param {Object} updatedData - Datos actualizados
         * @returns {boolean} - true si se actualizó correctamente
         */
        update: function(id, updatedData) {
            try {
                // Obtener todas las confirmaciones
                const confirmations = StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
                
                // Buscar el índice de la confirmación
                const index = confirmations.findIndex(confirmation => confirmation.id === id);
                
                if (index === -1) {
                    console.warn(`No se encontró la confirmación con ID ${id}`);
                    return false;
                }
                
                // Actualizar la confirmación
                confirmations[index] = {
                    ...confirmations[index],
                    ...updatedData,
                    updatedAt: new Date()
                };
                
                // Asegurarse de que el ID no cambie
                confirmations[index].id = id;
                
                // Guardar
                return StorageUtil.save(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, confirmations);
            } catch (error) {
                console.error('Error al actualizar confirmación de asistencia:', error);
                return false;
            }
        },
        
        /**
         * Elimina una confirmación de asistencia
         * @param {string} id - ID de la confirmación de asistencia
         * @returns {boolean} - true si se eliminó correctamente
         */
        delete: function(id) {
            try {
                // Obtener todas las confirmaciones
                const confirmations = StorageUtil.get(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, []);
                
                // Filtrar la confirmación a eliminar
                const newConfirmations = confirmations.filter(confirmation => confirmation.id !== id);
                
                // Verificar si se eliminó alguna confirmación
                if (newConfirmations.length === confirmations.length) {
                    console.warn(`No se encontró la confirmación con ID ${id}`);
                    return false;
                }
                
                // Guardar
                return StorageUtil.save(StorageUtil.KEYS.ATTENDANCE_CONFIRMATIONS, newConfirmations);
            } catch (error) {
                console.error('Error al eliminar confirmación de asistencia:', error);
                return false;
            }
        }
    },

    /**
     * Exporta todos los datos a un objeto JSON
     * @returns {Object} - Objeto con todos los datos
     */
    exportData: function() {
        try {
            const data = {};
            
            // Exportar cada colección
            Object.keys(this.KEYS).forEach(keyName => {
                const key = this.KEYS[keyName];
                data[keyName] = this.get(key, []);
            });
            
            // Agregar metadatos
            data.metadata = {
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            return data;
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return null;
        }
    },

    /**
     * Descarga los datos como un archivo JSON
     */
    downloadData: function() {
        try {
            // Exportar datos
            const data = this.exportData();
            
            if (!data) {
                console.error('No se pudieron exportar los datos');
                return false;
            }
            
            // Convertir a JSON
            const jsonData = JSON.stringify(data, null, 2);
            
            // Crear blob
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Crear URL
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = `comedor_data_${new Date().toISOString().split('T')[0]}.json`;
            
            // Simular clic
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al descargar datos:', error);
            return false;
        }
    },

    /**
     * Importa datos desde un objeto JSON
     * @param {Object} data - Datos a importar
     * @returns {boolean} - true si se importó correctamente
     */
    importData: function(data) {
        try {
            // Verificar que los datos tengan la estructura correcta
            if (!data || typeof data !== 'object') {
                console.error('Los datos no tienen el formato correcto');
                return false;
            }
            
            // Verificar que existan las colecciones principales
            const requiredKeys = ['MENUS', 'COORDINATORS', 'ATTENDANCE_CONFIRMATIONS'];
            const missingKeys = requiredKeys.filter(key => !data[key]);
            
            if (missingKeys.length > 0) {
                console.error(`Faltan las siguientes colecciones: ${missingKeys.join(', ')}`);
                return false;
            }
            
            // Importar cada colección
            let importSuccess = true;
            
            Object.keys(this.KEYS).forEach(keyName => {
                if (data[keyName]) {
                    const key = this.KEYS[keyName];
                    const success = this.save(key, data[keyName]);
                    
                    if (!success) {
                        console.error(`Error al importar ${keyName}`);
                        importSuccess = false;
                    }
                }
            });
            
            return importSuccess;
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
    importFromFile: function(file) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar que sea un archivo JSON
                if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                    console.error('El archivo debe ser de tipo JSON');
                    resolve(false);
                    return;
                }
                
                // Leer el archivo
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        // Parsear el contenido
                        const data = JSON.parse(event.target.result);
                        
                        // Importar los datos
                        const success = this.importData(data);
                        resolve(success);
                    } catch (error) {
                        console.error('Error al parsear el archivo JSON:', error);
                        resolve(false);
                    }
                };
                
                reader.onerror = (error) => {
                    console.error('Error al leer el archivo:', error);
                    resolve(false);
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('Error al importar desde archivo:', error);
                resolve(false);
            }
        });
    }
};

// NOTA: Comentado para evitar reinicialización en cada carga de página
// document.addEventListener('DOMContentLoaded', function() {
//     StorageUtil.initStorage();
//     console.log('Sistema de almacenamiento inicializado');
// });

// En su lugar, verificamos si el almacenamiento ya está inicializado
// y solo lo inicializamos si es necesario
(function() {
    // Verificar si el estado de la aplicación ya existe
    const appState = localStorage.getItem(StorageUtil.KEYS.APP_STATE);
    
    // Si no existe, inicializar el almacenamiento
    if (appState === null) {
        console.log('Inicializando almacenamiento por primera vez...');
        StorageUtil.initStorage();
    } else {
        console.log('Almacenamiento ya inicializado, preservando datos existentes');
        
        // Verificar que todas las colecciones existan
        let needsInit = false;
        Object.values(StorageUtil.KEYS).forEach(key => {
            if (localStorage.getItem(key) === null) {
                needsInit = true;
            }
        });
        
        if (needsInit) {
            console.log('Algunas colecciones faltantes, inicializando...');
            StorageUtil.initStorage();
        }
    }
})();

// Agregar evento para guardar datos en localStorage al cerrar la pestaña o ventana
window.addEventListener('beforeunload', function() {
    // Guardar datos en localStorage
    Object.keys(StorageUtil.KEYS).forEach(keyName => {
        const key = StorageUtil.KEYS[keyName];
        const data = StorageUtil.get(key, []);
        StorageUtil.save(key, data);
    });
});
