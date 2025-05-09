/**
 * firebase-storage-utils.js
 * Utilidades para manejar el almacenamiento de archivos en Firebase Storage
 * Especialmente optimizado para imágenes de menús
 */

// Verificar que Firebase esté disponible
let firebaseStorageAvailable = false;

// Intentar inicializar Firebase Storage
try {
    if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
        console.log('Firebase Storage está disponible');
        firebaseStorageAvailable = true;
    } else {
        console.warn('Firebase Storage no está disponible. Algunas funcionalidades estarán limitadas.');
    }
} catch (error) {
    console.error('Error al verificar Firebase Storage:', error);
}

/**
 * Clase para manejar operaciones con Firebase Storage
 */
class FirebaseStorageUtils {
    /**
     * Verifica si Firebase Storage está disponible para su uso
     * @returns {boolean} - true si Firebase Storage está disponible
     */
    static isAvailable() {
        try {
            // Verificar que Firebase esté disponible
            if (typeof firebase === 'undefined') {
                console.warn('Firebase no está definido');
                return false;
            }
            
            // Verificar que Storage esté disponible
            if (typeof firebase.storage !== 'function') {
                console.warn('Firebase Storage no está disponible');
                return false;
            }
            
            // Intentar obtener una referencia a Storage
            try {
                const storage = firebase.storage();
                const testRef = storage.ref();
                return true;
            } catch (error) {
                console.error('Error al inicializar Firebase Storage:', error);
                return false;
            }
        } catch (error) {
            console.error('Error al verificar disponibilidad de Firebase Storage:', error);
            return false;
        }
    }
    
    /**
     * Sube una imagen a Firebase Storage
     * @param {string} dataUrl - URL de datos de la imagen (data:image/...)
     * @param {string} path - Ruta donde guardar la imagen en Storage
     * @param {Object} metadata - Metadatos opcionales para el archivo
     * @returns {Promise<string>} - URL pública de la imagen subida
     */
    static async uploadImage(dataUrl, path, metadata = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Iniciando subida de imagen a Firebase Storage...');
                
                // Verificar que Firebase y Storage estén disponibles
                if (typeof firebase === 'undefined') {
                    console.error('Firebase no está definido');
                    return reject(new Error('Firebase no está disponible. Verifique que firebase-app.js está cargado correctamente.'));
                }
                
                if (typeof firebase.storage !== 'function') {
                    console.error('Firebase Storage no está disponible');
                    return reject(new Error('Firebase Storage no está disponible. Verifique que firebase-storage.js está cargado correctamente.'));
                }
                
                // Verificar conexión a internet
                if (!navigator.onLine) {
                    console.error('No hay conexión a internet');
                    return reject(new Error('No hay conexión a internet. Verifique su conexión e intente nuevamente.'));
                }
                
                // Verificar que la URL de datos sea válida
                if (!dataUrl || typeof dataUrl !== 'string') {
                    console.error('URL de datos inválida');
                    return reject(new Error('URL de datos inválida o vacía'));
                }
                
                // Obtener referencia a Storage
                let storage;
                try {
                    storage = firebase.storage();
                } catch (storageError) {
                    console.error('Error al inicializar Firebase Storage:', storageError);
                    return reject(new Error('Error al inicializar Firebase Storage: ' + storageError.message));
                }
                
                // Convertir data URL a Blob
                let blob;
                try {
                    blob = await this.dataURLtoBlob(dataUrl);
                    console.log('Data URL convertida a Blob correctamente. Tamaño:', blob.size, 'bytes');
                } catch (blobError) {
                    console.error('Error al convertir data URL a Blob:', blobError);
                    return reject(new Error('Error al procesar la imagen: ' + blobError.message));
                }
                
                // Generar un nombre único si no se proporciona uno
                if (!path) {
                    const timestamp = new Date().getTime();
                    path = `menus/menu_${timestamp}.jpg`;
                }
                
                // Crear referencia al archivo en Storage
                let storageRef, fileRef;
                try {
                    storageRef = storage.ref();
                    fileRef = storageRef.child(path);
                } catch (refError) {
                    console.error('Error al crear referencia de Storage:', refError);
                    return reject(new Error('Error al crear referencia de almacenamiento: ' + refError.message));
                }
                
                // Configurar metadatos por defecto
                const defaultMetadata = {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000' // 1 año de caché
                };
                
                // Combinar metadatos por defecto con los proporcionados
                const fileMetadata = {...defaultMetadata, ...metadata};
                
                // Establecer un timeout para la subida (2 minutos)
                const uploadTimeout = setTimeout(() => {
                    console.error('Tiempo de espera agotado para la subida de imagen');
                    reject(new Error('Tiempo de espera agotado para la subida de imagen. La red puede estar lenta o inestable.'));
                }, 120000); // 2 minutos
                
                // Subir archivo
                console.log('Subiendo imagen a:', path, 'Tamaño:', blob.size, 'bytes');
                let uploadTask;
                try {
                    uploadTask = fileRef.put(blob, fileMetadata);
                } catch (putError) {
                    clearTimeout(uploadTimeout);
                    console.error('Error al iniciar la subida de imagen:', putError);
                    return reject(new Error('Error al iniciar la subida de imagen: ' + putError.message));
                }
                
                // Monitorear progreso de subida
                uploadTask.on('state_changed', 
                    // Progreso
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Progreso de subida: ' + Math.round(progress) + '%');
                    },
                    // Error
                    (error) => {
                        clearTimeout(uploadTimeout);
                        console.error('Error al subir imagen:', error);
                        
                        // Proporcionar mensajes de error más descriptivos según el código de error
                        let errorMessage = 'Error al subir imagen';
                        if (error.code) {
                            console.error('Código de error:', error.code);
                            
                            switch (error.code) {
                                case 'storage/unauthorized':
                                    errorMessage = 'No tiene permisos para subir archivos a Firebase Storage';
                                    break;
                                case 'storage/canceled':
                                    errorMessage = 'La subida fue cancelada';
                                    break;
                                case 'storage/unknown':
                                    errorMessage = 'Error desconocido durante la subida';
                                    break;
                                case 'storage/quota-exceeded':
                                    errorMessage = 'Cuota de almacenamiento excedida en Firebase Storage';
                                    break;
                                case 'storage/invalid-checksum':
                                    errorMessage = 'El archivo está corrupto o fue modificado durante la subida';
                                    break;
                                case 'storage/retry-limit-exceeded':
                                    errorMessage = 'Límite de reintentos excedido. La red puede ser inestable';
                                    break;
                                default:
                                    errorMessage = `Error de Firebase Storage: ${error.code}`;
                            }
                        }
                        
                        if (error.message) {
                            errorMessage += ': ' + error.message;
                        }
                        
                        reject(new Error(errorMessage));
                    },
                    // Completado
                    async () => {
                        clearTimeout(uploadTimeout);
                        try {
                            // Obtener URL de descarga
                            const downloadURL = await fileRef.getDownloadURL();
                            console.log('Imagen subida exitosamente. URL:', downloadURL);
                            resolve(downloadURL);
                        } catch (urlError) {
                            console.error('Error al obtener URL de descarga:', urlError);
                            reject(new Error('La imagen se subió correctamente pero no se pudo obtener la URL de descarga: ' + urlError.message));
                        }
                    }
                );
            } catch (error) {
                console.error('Error en uploadImage:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Convierte una data URL a un Blob para subir a Firebase Storage
     * @param {string} dataUrl - URL de datos (data:image/...)
     * @returns {Promise<Blob>} - Blob para subir
     */
    static dataURLtoBlob(dataUrl) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar que la URL de datos sea válida
                if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
                    return reject(new Error('URL de datos inválida'));
                }
                
                // Extraer la parte base64 y el tipo MIME
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                
                // Convertir a array de bytes
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                
                // Crear y devolver el Blob
                resolve(new Blob([u8arr], {type: mime}));
            } catch (error) {
                console.error('Error al convertir dataURL a Blob:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Elimina una imagen de Firebase Storage
     * @param {string} url - URL completa de la imagen a eliminar
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    static async deleteImage(url) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Iniciando eliminación de imagen en Firebase Storage...');
                
                // Verificar que Firebase y Storage estén disponibles
                if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') {
                    return reject(new Error('Firebase Storage no está disponible'));
                }
                
                // Obtener referencia a Storage
                const storage = firebase.storage();
                
                // Extraer la ruta del archivo de la URL
                const fileRef = storage.refFromURL(url);
                
                // Eliminar archivo
                await fileRef.delete();
                console.log('Imagen eliminada exitosamente:', url);
                resolve(true);
            } catch (error) {
                console.error('Error al eliminar imagen:', error);
                
                // Si el error es porque el archivo no existe, consideramos que ya está eliminado
                if (error.code === 'storage/object-not-found') {
                    console.log('La imagen ya no existía en Storage');
                    resolve(true);
                } else {
                    reject(error);
                }
            }
        });
    }
    
    /**
     * Optimiza y sube una imagen de menú a Firebase Storage
     * @param {string} dataUrl - URL de datos de la imagen
     * @param {string} menuId - ID del menú para nombrar el archivo
     * @returns {Promise<string>} - URL pública de la imagen subida
     */
    static async uploadMenuImage(dataUrl, menuId) {
        try {
            console.log('Optimizando y subiendo imagen de menú...', {
                dataUrlLength: dataUrl ? dataUrl.length : 0,
                dataUrlType: dataUrl ? (dataUrl.substring(0, 30) + '...') : 'undefined',
                menuId: menuId
            });
            
            // Verificar que la URL de datos sea válida
            if (!dataUrl || typeof dataUrl !== 'string') {
                console.error('URL de datos inválida en uploadMenuImage');
                throw new Error('URL de datos inválida o vacía');
            }
            
            // Si la URL ya es una URL de Firebase Storage, devolverla directamente
            if (dataUrl.includes('firebasestorage.googleapis.com')) {
                console.log('La URL ya es de Firebase Storage, no es necesario subirla nuevamente');
                return dataUrl;
            }
            
            // Verificar que la URL sea una data URL
            if (!dataUrl.startsWith('data:')) {
                console.error('La URL no es una data URL válida:', dataUrl.substring(0, 30) + '...');
                throw new Error('La URL de la imagen debe ser una data URL');
            }
            
            // Comprimir la imagen antes de subirla
            console.log('Comprimiendo imagen antes de subir...');
            const compressedDataUrl = await this.compressMenuImage(dataUrl);
            console.log('Imagen comprimida correctamente');
            
            // Generar ruta para la imagen
            const timestamp = new Date().getTime();
            const path = `menus/${menuId || 'menu_' + timestamp}.jpg`;
            console.log('Ruta de almacenamiento:', path);
            
            // Subir imagen comprimida
            console.log('Iniciando subida a Firebase Storage...');
            const storageUrl = await this.uploadImage(compressedDataUrl, path, {
                contentType: 'image/jpeg',
                metadata: {
                    purpose: 'menu-image',
                    menuId: menuId || '',
                    timestamp: timestamp
                }
            });
            
            console.log('Imagen subida exitosamente a Firebase Storage:', storageUrl);
            return storageUrl;
        } catch (error) {
            console.error('Error en uploadMenuImage:', error);
            // Mostrar más detalles sobre el error para facilitar la depuración
            if (error.code) {
                console.error('Código de error:', error.code);
            }
            if (error.message) {
                console.error('Mensaje de error:', error.message);
            }
            throw error;
        }
    }
    
    /**
     * Comprime una imagen de menú para optimizar su almacenamiento
     * @param {string} dataUrl - URL de datos de la imagen original
     * @param {number} maxWidth - Ancho máximo (por defecto 1200px)
     * @param {number} quality - Calidad de compresión (0-1, por defecto 0.7)
     * @returns {Promise<string>} - URL de datos de la imagen comprimida
     */
    static async compressMenuImage(dataUrl, maxWidth = 1200, quality = 0.7) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar que la URL de datos sea válida
                if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
                    return reject(new Error('URL de datos inválida'));
                }
                
                // Crear una imagen temporal para cargar la URL de datos
                const img = new Image();
                img.onload = function() {
                    try {
                        // Calcular las nuevas dimensiones manteniendo la proporción
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > maxWidth) {
                            const ratio = maxWidth / width;
                            width = maxWidth;
                            height = Math.floor(height * ratio);
                        }
                        
                        // Crear un canvas para dibujar la imagen redimensionada
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Dibujar la imagen en el canvas
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convertir el canvas a una URL de datos con la calidad especificada
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        
                        // Verificar que la compresión fue efectiva
                        console.log(`Imagen comprimida: ${Math.round(dataUrl.length/1024)}KB -> ${Math.round(compressedDataUrl.length/1024)}KB (${Math.round((compressedDataUrl.length / dataUrl.length) * 100)}%)`);
                        resolve(compressedDataUrl);
                    } catch (error) {
                        console.error('Error al comprimir la imagen:', error);
                        reject(error);
                    }
                };
                
                img.onerror = function() {
                    reject(new Error('Error al cargar la imagen para compresión'));
                };
                
                // Iniciar la carga de la imagen
                img.src = dataUrl;
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Exportar la clase para su uso en otros archivos
window.FirebaseStorageUtils = FirebaseStorageUtils;
