/**
 * firebase-storage-utils.js
 * Utilidades para manejar el almacenamiento de archivos en Firebase Storage
 * Especialmente optimizado para imágenes de menús
 */

/**
 * Clase para manejar operaciones con Firebase Storage
 */
class FirebaseStorageUtils {
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
                if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') {
                    return reject(new Error('Firebase Storage no está disponible'));
                }
                
                // Obtener referencia a Storage
                const storage = firebase.storage();
                
                // Convertir data URL a Blob
                const blob = await this.dataURLtoBlob(dataUrl);
                
                // Generar un nombre único si no se proporciona uno
                if (!path) {
                    const timestamp = new Date().getTime();
                    path = `menus/menu_${timestamp}.jpg`;
                }
                
                // Crear referencia al archivo en Storage
                const storageRef = storage.ref();
                const fileRef = storageRef.child(path);
                
                // Configurar metadatos por defecto
                const defaultMetadata = {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000' // 1 año de caché
                };
                
                // Combinar metadatos por defecto con los proporcionados
                const fileMetadata = {...defaultMetadata, ...metadata};
                
                // Subir archivo
                console.log('Subiendo imagen a:', path);
                const uploadTask = fileRef.put(blob, fileMetadata);
                
                // Monitorear progreso de subida
                uploadTask.on('state_changed', 
                    // Progreso
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Progreso de subida: ' + Math.round(progress) + '%');
                    },
                    // Error
                    (error) => {
                        console.error('Error al subir imagen:', error);
                        reject(error);
                    },
                    // Completado
                    async () => {
                        try {
                            // Obtener URL de descarga
                            const downloadURL = await fileRef.getDownloadURL();
                            console.log('Imagen subida exitosamente. URL:', downloadURL);
                            resolve(downloadURL);
                        } catch (urlError) {
                            console.error('Error al obtener URL de descarga:', urlError);
                            reject(urlError);
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
            console.log('Optimizando y subiendo imagen de menú...');
            
            // Comprimir la imagen antes de subirla
            const compressedDataUrl = await this.compressMenuImage(dataUrl);
            
            // Generar ruta para la imagen
            const timestamp = new Date().getTime();
            const path = `menus/${menuId || 'menu_' + timestamp}.jpg`;
            
            // Subir imagen comprimida
            return await this.uploadImage(compressedDataUrl, path, {
                contentType: 'image/jpeg',
                metadata: {
                    purpose: 'menu-image',
                    menuId: menuId || '',
                    timestamp: timestamp
                }
            });
        } catch (error) {
            console.error('Error en uploadMenuImage:', error);
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
