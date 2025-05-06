/**
 * firebase-export.js
 * Utilidades para exportar datos de Firebase Firestore a Excel
 * Este módulo proporciona funciones para exportar datos de Firestore
 * a formato Excel, manteniendo la compatibilidad con el sistema existente.
 */

import { FirestoreUtil } from './firebase-storage.js';
import { logError, logCustomEvent } from './firebase-monitoring.js';

// Verificar si SheetJS está disponible
const hasSheetJS = typeof XLSX !== 'undefined';

const FirebaseExport = {
    /**
     * Exporta todos los datos de Firestore a un objeto JSON
     * @returns {Promise<Object>} - Promesa que resuelve con un objeto con todos los datos
     */
    exportAllData: async function() {
        try {
            // Obtener datos de todas las colecciones
            const data = await FirestoreUtil.exportData();
            
            // Registrar evento
            logCustomEvent('data_exported', {
                format: 'json',
                collections: Object.keys(data).length
            });
            
            return data;
        } catch (error) {
            logError(error, { operation: 'exportAllData' });
            throw error;
        }
    },
    
    /**
     * Descarga los datos como un archivo JSON
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se descargó correctamente
     */
    downloadJSON: async function() {
        try {
            // Obtener datos
            const data = await this.exportAllData();
            
            // Convertir a JSON
            const jsonString = JSON.stringify(data, null, 2);
            
            // Crear blob
            const blob = new Blob([jsonString], { type: 'application/json' });
            
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
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'downloadJSON' });
            console.error('Error al descargar datos como JSON:', error);
            throw error;
        }
    },
    
    /**
     * Exporta datos de Firestore a Excel
     * @param {Object} options - Opciones de exportación
     * @param {Array<string>} options.collections - Colecciones a exportar (por defecto todas)
     * @param {boolean} options.includeTimestamps - Si se deben incluir timestamps (por defecto true)
     * @param {boolean} options.formatDates - Si se deben formatear las fechas (por defecto true)
     * @returns {Promise<Object>} - Promesa que resuelve con un objeto con las hojas de Excel
     */
    exportToExcel: async function(options = {}) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Opciones por defecto
            const defaultOptions = {
                collections: null, // Todas las colecciones
                includeTimestamps: true,
                formatDates: true
            };
            
            const exportOptions = { ...defaultOptions, ...options };
            
            // Obtener datos
            const data = await this.exportAllData();
            
            // Filtrar colecciones si es necesario
            const collectionsToExport = exportOptions.collections 
                ? Object.keys(data).filter(key => exportOptions.collections.includes(key))
                : Object.keys(data);
            
            // Crear libro de Excel
            const workbook = XLSX.utils.book_new();
            
            // Procesar cada colección
            for (const collectionName of collectionsToExport) {
                const collectionData = data[collectionName];
                
                if (!Array.isArray(collectionData) || collectionData.length === 0) {
                    continue;
                }
                
                // Procesar datos para Excel
                const processedData = collectionData.map(item => {
                    const processedItem = { ...item };
                    
                    // Eliminar timestamps si es necesario
                    if (!exportOptions.includeTimestamps) {
                        delete processedItem.createdAt;
                        delete processedItem.updatedAt;
                    } else if (exportOptions.formatDates) {
                        // Formatear fechas
                        if (processedItem.createdAt) {
                            processedItem.createdAt = this._formatDate(processedItem.createdAt);
                        }
                        if (processedItem.updatedAt) {
                            processedItem.updatedAt = this._formatDate(processedItem.updatedAt);
                        }
                        if (processedItem.date) {
                            processedItem.date = this._formatDate(processedItem.date);
                        }
                        if (processedItem.weekStartDate) {
                            processedItem.weekStartDate = this._formatDate(processedItem.weekStartDate);
                        }
                    }
                    
                    // Convertir objetos anidados a JSON
                    for (const key in processedItem) {
                        if (typeof processedItem[key] === 'object' && processedItem[key] !== null) {
                            processedItem[key] = JSON.stringify(processedItem[key]);
                        }
                    }
                    
                    return processedItem;
                });
                
                // Crear hoja de Excel
                const worksheet = XLSX.utils.json_to_sheet(processedData);
                
                // Agregar hoja al libro
                XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
            }
            
            // Registrar evento
            logCustomEvent('data_exported', {
                format: 'excel',
                collections: collectionsToExport.length
            });
            
            return workbook;
        } catch (error) {
            logError(error, { operation: 'exportToExcel' });
            console.error('Error al exportar datos a Excel:', error);
            throw error;
        }
    },
    
    /**
     * Descarga los datos como un archivo Excel
     * @param {Object} options - Opciones de exportación (ver exportToExcel)
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se descargó correctamente
     */
    downloadExcel: async function(options = {}) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Exportar a Excel
            const workbook = await this.exportToExcel(options);
            
            // Nombre del archivo
            const fileName = `comedor_data_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Descargar
            XLSX.writeFile(workbook, fileName);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'downloadExcel' });
            console.error('Error al descargar datos como Excel:', error);
            throw error;
        }
    },
    
    /**
     * Exporta una colección específica a Excel
     * @param {string} collectionName - Nombre de la colección
     * @param {Object} options - Opciones de exportación (ver exportToExcel)
     * @returns {Promise<Object>} - Promesa que resuelve con la hoja de Excel
     */
    exportCollectionToExcel: async function(collectionName, options = {}) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Obtener datos de la colección
            const collectionData = await FirestoreUtil.getAll(collectionName);
            
            if (!Array.isArray(collectionData) || collectionData.length === 0) {
                throw new Error(`La colección ${collectionName} está vacía o no existe`);
            }
            
            // Opciones por defecto
            const defaultOptions = {
                includeTimestamps: true,
                formatDates: true
            };
            
            const exportOptions = { ...defaultOptions, ...options };
            
            // Procesar datos para Excel
            const processedData = collectionData.map(item => {
                const processedItem = { ...item };
                
                // Eliminar timestamps si es necesario
                if (!exportOptions.includeTimestamps) {
                    delete processedItem.createdAt;
                    delete processedItem.updatedAt;
                } else if (exportOptions.formatDates) {
                    // Formatear fechas
                    if (processedItem.createdAt) {
                        processedItem.createdAt = this._formatDate(processedItem.createdAt);
                    }
                    if (processedItem.updatedAt) {
                        processedItem.updatedAt = this._formatDate(processedItem.updatedAt);
                    }
                    if (processedItem.date) {
                        processedItem.date = this._formatDate(processedItem.date);
                    }
                    if (processedItem.weekStartDate) {
                        processedItem.weekStartDate = this._formatDate(processedItem.weekStartDate);
                    }
                }
                
                // Convertir objetos anidados a JSON
                for (const key in processedItem) {
                    if (typeof processedItem[key] === 'object' && processedItem[key] !== null) {
                        processedItem[key] = JSON.stringify(processedItem[key]);
                    }
                }
                
                return processedItem;
            });
            
            // Crear hoja de Excel
            const worksheet = XLSX.utils.json_to_sheet(processedData);
            
            // Crear libro de Excel
            const workbook = XLSX.utils.book_new();
            
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
            
            // Registrar evento
            logCustomEvent('collection_exported', {
                format: 'excel',
                collection: collectionName,
                items: processedData.length
            });
            
            return workbook;
        } catch (error) {
            logError(error, { operation: 'exportCollectionToExcel', collection: collectionName });
            console.error(`Error al exportar colección ${collectionName} a Excel:`, error);
            throw error;
        }
    },
    
    /**
     * Descarga una colección específica como un archivo Excel
     * @param {string} collectionName - Nombre de la colección
     * @param {Object} options - Opciones de exportación (ver exportToExcel)
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se descargó correctamente
     */
    downloadCollectionAsExcel: async function(collectionName, options = {}) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Exportar a Excel
            const workbook = await this.exportCollectionToExcel(collectionName, options);
            
            // Nombre del archivo
            const fileName = `comedor_${collectionName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Descargar
            XLSX.writeFile(workbook, fileName);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'downloadCollectionAsExcel', collection: collectionName });
            console.error(`Error al descargar colección ${collectionName} como Excel:`, error);
            throw error;
        }
    },
    
    /**
     * Exporta un reporte de asistencia semanal a Excel
     * @param {string|Date} weekStartDate - Fecha de inicio de la semana
     * @returns {Promise<Object>} - Promesa que resuelve con la hoja de Excel
     */
    exportWeeklyAttendanceReport: async function(weekStartDate) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Normalizar fecha
            if (weekStartDate instanceof Date) {
                weekStartDate = weekStartDate.toISOString().split('T')[0];
            }
            
            // Obtener confirmaciones para la semana
            const confirmations = await FirestoreUtil.query(
                'attendanceConfirmations',
                'weekStartDate',
                '==',
                weekStartDate
            );
            
            if (!confirmations || confirmations.length === 0) {
                throw new Error(`No hay confirmaciones para la semana que comienza el ${weekStartDate}`);
            }
            
            // Obtener coordinadores
            const coordinators = await FirestoreUtil.getAll('coordinators');
            
            // Mapear IDs de coordinadores a nombres
            const coordinatorMap = {};
            coordinators.forEach(coordinator => {
                coordinatorMap[coordinator.id] = coordinator.name || coordinator.id;
            });
            
            // Días de la semana
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const dayNames = {
                'monday': 'Lunes',
                'tuesday': 'Martes',
                'wednesday': 'Miércoles',
                'thursday': 'Jueves',
                'friday': 'Viernes'
            };
            
            // Preparar datos para el reporte
            const reportData = [];
            
            // Agregar fila de encabezado
            reportData.push({
                Coordinador: 'Día',
                Departamento: '',
                Lunes: dayNames.monday,
                Martes: dayNames.tuesday,
                Miércoles: dayNames.wednesday,
                Jueves: dayNames.thursday,
                Viernes: dayNames.friday,
                Total: 'Total'
            });
            
            // Procesar cada confirmación
            for (const confirmation of confirmations) {
                // Obtener coordinador
                const coordinator = coordinators.find(c => c.id === confirmation.coordinatorId);
                
                if (!coordinator) continue;
                
                // Calcular total
                let total = 0;
                for (const day of days) {
                    total += parseInt(confirmation.attendanceCounts?.[day] || 0);
                }
                
                // Agregar fila
                reportData.push({
                    Coordinador: coordinator.name || 'Sin nombre',
                    Departamento: coordinator.department || 'Sin departamento',
                    Lunes: confirmation.attendanceCounts?.monday || 0,
                    Martes: confirmation.attendanceCounts?.tuesday || 0,
                    Miércoles: confirmation.attendanceCounts?.wednesday || 0,
                    Jueves: confirmation.attendanceCounts?.thursday || 0,
                    Viernes: confirmation.attendanceCounts?.friday || 0,
                    Total: total
                });
            }
            
            // Calcular totales por día
            const totals = {
                Coordinador: 'TOTAL',
                Departamento: '',
                Lunes: 0,
                Martes: 0,
                Miércoles: 0,
                Jueves: 0,
                Viernes: 0,
                Total: 0
            };
            
            for (let i = 1; i < reportData.length; i++) {
                totals.Lunes += parseInt(reportData[i].Lunes || 0);
                totals.Martes += parseInt(reportData[i].Martes || 0);
                totals.Miércoles += parseInt(reportData[i].Miércoles || 0);
                totals.Jueves += parseInt(reportData[i].Jueves || 0);
                totals.Viernes += parseInt(reportData[i].Viernes || 0);
                totals.Total += parseInt(reportData[i].Total || 0);
            }
            
            // Agregar fila de totales
            reportData.push(totals);
            
            // Crear hoja de Excel
            const worksheet = XLSX.utils.json_to_sheet(reportData);
            
            // Crear libro de Excel
            const workbook = XLSX.utils.book_new();
            
            // Formatear fecha para el nombre de la hoja
            const formattedDate = this._formatDate(weekStartDate);
            
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(workbook, worksheet, `Asistencia ${formattedDate}`);
            
            // Registrar evento
            logCustomEvent('report_exported', {
                type: 'weekly_attendance',
                week: weekStartDate,
                coordinators: confirmations.length
            });
            
            return workbook;
        } catch (error) {
            logError(error, { operation: 'exportWeeklyAttendanceReport', weekStartDate });
            console.error('Error al exportar reporte de asistencia semanal:', error);
            throw error;
        }
    },
    
    /**
     * Descarga un reporte de asistencia semanal como un archivo Excel
     * @param {string|Date} weekStartDate - Fecha de inicio de la semana
     * @returns {Promise<boolean>} - Promesa que resuelve a true si se descargó correctamente
     */
    downloadWeeklyAttendanceReport: async function(weekStartDate) {
        try {
            if (!hasSheetJS) {
                throw new Error('SheetJS (XLSX) no está disponible. Incluya la librería en su HTML.');
            }
            
            // Exportar a Excel
            const workbook = await this.exportWeeklyAttendanceReport(weekStartDate);
            
            // Formatear fecha para el nombre del archivo
            const formattedDate = this._formatDate(weekStartDate);
            
            // Nombre del archivo
            const fileName = `comedor_asistencia_${formattedDate}.xlsx`;
            
            // Descargar
            XLSX.writeFile(workbook, fileName);
            
            return true;
        } catch (error) {
            logError(error, { operation: 'downloadWeeklyAttendanceReport', weekStartDate });
            console.error('Error al descargar reporte de asistencia semanal:', error);
            throw error;
        }
    },
    
    /**
     * Formatea una fecha ISO o Date para mostrar
     * @private
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada
     */
    _formatDate: function(date) {
        if (!date) return '';
        
        try {
            if (typeof date === 'string') {
                // Si es una fecha ISO
                if (date.includes('T')) {
                    return new Date(date).toLocaleDateString();
                }
                // Si es solo una fecha (YYYY-MM-DD)
                return date;
            } else if (date instanceof Date) {
                return date.toLocaleDateString();
            }
            
            return date.toString();
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return date.toString();
        }
    }
};

export default FirebaseExport;
