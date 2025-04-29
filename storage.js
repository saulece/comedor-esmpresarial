/**
 * storage.js
 * Módulo para gestionar el almacenamiento y persistencia de datos
 * Sistema de Confirmación de Asistencia - Comedor Empresarial
 */

// Funciones de almacenamiento y visualización de datos
const StorageManager = {
    /**
     * Obtiene los datos de asistencia desde localStorage
     * @returns {Array} Array de objetos con los datos de asistencia
     */
    getAttendanceData: function() {
        const data = localStorage.getItem('attendanceData');
        return data ? JSON.parse(data) : [];
    },

    /**
     * Guarda los datos de asistencia en localStorage
     * @param {Array} data - Array de objetos con los datos de asistencia
     */
    saveAttendanceData: function(data) {
        localStorage.setItem('attendanceData', JSON.stringify(data));
    },

    /**
     * Inicializa el almacenamiento local si no existe
     */
    loadAttendanceData: function() {
        if (!localStorage.getItem('attendanceData')) {
            this.saveAttendanceData([]);
        }
    },

    /**
     * Guarda una nueva confirmación de asistencia
     * @param {string} date - Fecha en formato YYYY-MM-DD
     * @param {number} peopleCount - Número de personas
     */
    saveAttendance: function(date, peopleCount) {
        const attendanceData = this.getAttendanceData();
        
        // Verificar si ya existe una confirmación para esta fecha
        const existingIndex = attendanceData.findIndex(item => item.date === date);
        
        if (existingIndex !== -1) {
            // Actualizar confirmación existente
            attendanceData[existingIndex].peopleCount = peopleCount;
        } else {
            // Agregar nueva confirmación
            attendanceData.push({ date, peopleCount });
        }
        
        // Ordenar por fecha (más reciente primero)
        attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Guardar en localStorage
        this.saveAttendanceData(attendanceData);
    },

    /**
     * Elimina un registro de asistencia
     * @param {number} index - Índice del registro a eliminar
     */
    deleteAttendanceRecord: function(index) {
        const attendanceData = this.getAttendanceData();
        
        // Eliminar el registro
        attendanceData.splice(index, 1);
        
        // Guardar los datos actualizados
        this.saveAttendanceData(attendanceData);
    },

    /**
     * Exporta los datos a un archivo JSON
     */
    exportToJSON: function() {
        const attendanceData = this.getAttendanceData();
        
        if (attendanceData.length === 0) {
            return { success: false, message: 'No hay datos para exportar.' };
        }
        
        // Crear un objeto Blob con los datos
        const dataStr = JSON.stringify(attendanceData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Crear un enlace para descargar el archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comedor-asistencia-${new Date().toISOString().split('T')[0]}.json`;
        
        // Simular clic para descargar
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return { success: true, message: 'Datos exportados correctamente.' };
    },

    /**
     * Importa datos desde un archivo JSON
     * @param {File} file - Archivo JSON a importar
     * @returns {Promise} Promesa que se resuelve con el resultado de la importación
     */
    importFromJSON: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Parsear el contenido del archivo
                    const data = JSON.parse(e.target.result);
                    
                    // Validar que el formato sea correcto
                    if (!Array.isArray(data)) {
                        reject({ success: false, message: 'El archivo no tiene el formato correcto.' });
                        return;
                    }
                    
                    // Verificar que cada elemento tenga la estructura correcta
                    const isValid = data.every(item => 
                        typeof item === 'object' && 
                        'date' in item && 
                        'peopleCount' in item && 
                        typeof item.date === 'string' && 
                        typeof item.peopleCount === 'number'
                    );
                    
                    if (!isValid) {
                        reject({ success: false, message: 'El archivo contiene datos con formato incorrecto.' });
                        return;
                    }
                    
                    // Guardar los datos importados
                    this.saveAttendanceData(data);
                    
                    resolve({ success: true, message: `Se importaron ${data.length} registros correctamente.`, count: data.length });
                } catch (error) {
                    reject({ success: false, message: 'Error al procesar el archivo: ' + error.message });
                }
            };
            
            reader.onerror = () => {
                reject({ success: false, message: 'Error al leer el archivo.' });
            };
            
            reader.readAsText(file);
        });
    }
};
