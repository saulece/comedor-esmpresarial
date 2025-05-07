/**
 * simple-firebase-menu.js
 * Versión simplificada para gestionar menús con Firebase Firestore
 * Este módulo proporciona funciones básicas para crear, leer y actualizar menús
 * sin necesidad de autenticación ni configuraciones complejas.
 */

// Importar solo lo necesario de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDyCRgqHkCy7gusyAeB724Okmc4IVXNXIE",
    authDomain: "comedor-empresarial.firebaseapp.com",
    projectId: "comedor-empresarial",
    storageBucket: "comedor-empresarial.appspot.com",
    messagingSenderId: "786660040665",
    appId: "1:786660040665:web:2c25dff6524f57f763c3c8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Administrador simple de menús con Firebase
 */
const SimpleMenuManager = {
    // Nombre de la colección en Firestore
    COLLECTION: 'menus',
    
    // Referencia a listeners activos
    _listeners: {},
    
    /**
     * Crea un nuevo menú
     * @param {Object} menu - Datos del menú
     * @returns {Promise<string>} - Promesa que resuelve con el ID del menú creado
     */
    createMenu: async function(menu) {
        try {
            // Validar menú
            if (!menu.id) {
                menu.id = 'menu_' + Date.now();
            }
            
            // Agregar metadatos
            menu.createdAt = new Date().toISOString();
            menu.updatedAt = new Date().toISOString();
            
            // Guardar en Firestore
            await setDoc(doc(db, this.COLLECTION, menu.id), menu);
            
            console.log(`Menú creado con ID: ${menu.id}`);
            return menu.id;
        } catch (error) {
            console.error('Error al crear menú:', error);
            throw error;
        }
    },
    
    /**
     * Obtiene un menú por su ID
     * @param {string} menuId - ID del menú
     * @returns {Promise<Object|null>} - Promesa que resuelve con el menú o null si no existe
     */
    getMenuById: async function(menuId) {
        try {
            const menuDoc = await getDoc(doc(db, this.COLLECTION, menuId));
            
            if (menuDoc.exists()) {
                return menuDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error al obtener menú ${menuId}:`, error);
            return null;
        }
    },
    
    /**
     * Obtiene todos los menús
     * @param {Object} options - Opciones de consulta
     * @param {boolean} options.onlyActive - Si solo se deben obtener los menús activos
     * @param {number} options.limit - Límite de menús a obtener
     * @returns {Promise<Array>} - Promesa que resuelve con un array de menús
     */
    getAllMenus: async function(options = {}) {
        try {
            let q = collection(db, this.COLLECTION);
            
            // Aplicar filtros si es necesario
            if (options.onlyActive) {
                q = query(q, where('active', '==', true));
            }
            
            // Ordenar por fecha de creación (más reciente primero)
            q = query(q, orderBy('createdAt', 'desc'));
            
            // Aplicar límite si se especifica
            if (options.limit && options.limit > 0) {
                q = query(q, limit(options.limit));
            }
            
            const querySnapshot = await getDocs(q);
            const menus = [];
            
            querySnapshot.forEach((doc) => {
                menus.push(doc.data());
            });
            
            return menus;
        } catch (error) {
            console.error('Error al obtener menús:', error);
            return [];
        }
    },
    
    /**
     * Actualiza un menú existente
     * @param {string} menuId - ID del menú a actualizar
     * @param {Object} menuData - Datos a actualizar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se actualizó correctamente
     */
    updateMenu: async function(menuId, menuData) {
        try {
            // Asegurar que no se modifique el ID
            delete menuData.id;
            
            // Actualizar fecha de modificación
            menuData.updatedAt = new Date().toISOString();
            
            // Actualizar en Firestore
            await updateDoc(doc(db, this.COLLECTION, menuId), menuData);
            
            console.log(`Menú ${menuId} actualizado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al actualizar menú ${menuId}:`, error);
            return false;
        }
    },
    
    /**
     * Elimina un menú
     * @param {string} menuId - ID del menú a eliminar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se eliminó correctamente
     */
    deleteMenu: async function(menuId) {
        try {
            // Eliminar de Firestore
            await deleteDoc(doc(db, this.COLLECTION, menuId));
            
            console.log(`Menú ${menuId} eliminado correctamente`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar menú ${menuId}:`, error);
            return false;
        }
    },
    
    /**
     * Establece un menú como activo
     * @param {string} menuId - ID del menú a activar
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se activó correctamente
     */
    setActiveMenu: async function(menuId) {
        try {
            // Primero desactivar todos los menús
            const menus = await this.getAllMenus();
            
            for (const menu of menus) {
                if (menu.active) {
                    await updateDoc(doc(db, this.COLLECTION, menu.id), {
                        active: false,
                        updatedAt: new Date().toISOString()
                    });
                }
            }
            
            // Activar el menú seleccionado
            await updateDoc(doc(db, this.COLLECTION, menuId), {
                active: true,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`Menú ${menuId} establecido como activo`);
            return true;
        } catch (error) {
            console.error(`Error al activar menú ${menuId}:`, error);
            return false;
        }
    },
    
    /**
     * Obtiene el menú activo actual
     * @returns {Promise<Object|null>} - Promesa que resuelve con el menú activo o null si no hay
     */
    getActiveMenu: async function() {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('active', '==', true)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error al obtener menú activo:', error);
            return null;
        }
    },
    
    /**
     * Escucha cambios en los menús
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToMenus: function(callback) {
        try {
            // Crear un ID único para este listener
            const listenerId = 'menus_' + Date.now();
            
            // Configurar la consulta
            const q = query(
                collection(db, this.COLLECTION),
                orderBy('createdAt', 'desc')
            );
            
            // Iniciar la escucha
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const menus = [];
                
                snapshot.forEach((doc) => {
                    menus.push(doc.data());
                });
                
                // Llamar al callback con los menús actualizados
                callback(menus);
            });
            
            // Guardar referencia al unsubscribe
            this._listeners[listenerId] = unsubscribe;
            
            // Devolver función para cancelar la escucha
            return () => {
                if (this._listeners[listenerId]) {
                    this._listeners[listenerId]();
                    delete this._listeners[listenerId];
                }
            };
        } catch (error) {
            console.error('Error al escuchar cambios en menús:', error);
            return () => {}; // Devolver función vacía
        }
    },
    
    /**
     * Escucha cambios en el menú activo
     * @param {Function} callback - Función a llamar cuando hay cambios
     * @returns {Function} - Función para cancelar la escucha
     */
    listenToActiveMenu: function(callback) {
        try {
            // Crear un ID único para este listener
            const listenerId = 'active_menu_' + Date.now();
            
            // Configurar la consulta
            const q = query(
                collection(db, this.COLLECTION),
                where('active', '==', true)
            );
            
            // Iniciar la escucha
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    // Llamar al callback con el menú activo
                    callback(snapshot.docs[0].data());
                } else {
                    // No hay menú activo
                    callback(null);
                }
            });
            
            // Guardar referencia al unsubscribe
            this._listeners[listenerId] = unsubscribe;
            
            // Devolver función para cancelar la escucha
            return () => {
                if (this._listeners[listenerId]) {
                    this._listeners[listenerId]();
                    delete this._listeners[listenerId];
                }
            };
        } catch (error) {
            console.error('Error al escuchar cambios en menú activo:', error);
            return () => {}; // Devolver función vacía
        }
    },
    
    /**
     * Detiene todas las escuchas
     */
    stopAllListeners: function() {
        Object.values(this._listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this._listeners = {};
    }
};

export default SimpleMenuManager;
