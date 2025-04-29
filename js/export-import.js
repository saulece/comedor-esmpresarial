/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de exportación e importación de datos
 * 
 * Este archivo contiene funciones para exportar e importar datos
 * en diferentes formatos (Excel, CSV, JSON).
 */

const ExportImport = {
  /**
   * Exporta datos a formato Excel utilizando SheetJS
   * @param {Array} data - Datos a exportar
   * @param {Array} headers - Encabezados de las columnas
   * @param {string} sheetName - Nombre de la hoja
   * @param {string} fileName - Nombre del archivo (sin extensión)
   */
  exportToExcel: function(data, headers, sheetName = 'Datos', fileName = 'exportacion') {
    // Verificar que SheetJS esté disponible
    if (typeof XLSX === 'undefined') {
      console.error('La librería SheetJS (XLSX) no está disponible');
      Components.showToast('Error: Librería de exportación no disponible', 'danger');
      return;
    }
    
    try {
      // Crear matriz de datos con encabezados
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Crear libro y añadir hoja
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Guardar archivo
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      
      Components.showToast('Datos exportados correctamente a Excel', 'success');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      Components.showToast('Error al exportar datos a Excel', 'danger');
    }
  },
  
  /**
   * Exporta datos a formato CSV
   * @param {Array} data - Datos a exportar
   * @param {Array} headers - Encabezados de las columnas
   * @param {string} fileName - Nombre del archivo (sin extensión)
   */
  exportToCSV: function(data, headers, fileName = 'exportacion') {
    try {
      // Crear contenido CSV
      let csvContent = headers.join(',') + '\n';
      
      // Añadir filas de datos
      data.forEach(row => {
        const csvRow = row.map(cell => {
          // Escapar comas y comillas
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',');
        
        csvContent += csvRow + '\n';
      });
      
      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Components.showToast('Datos exportados correctamente a CSV', 'success');
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      Components.showToast('Error al exportar datos a CSV', 'danger');
    }
  },
  
  /**
   * Exporta datos a formato JSON
   * @param {Object|Array} data - Datos a exportar
   * @param {string} fileName - Nombre del archivo (sin extensión)
   */
  exportToJSON: function(data, fileName = 'exportacion') {
    try {
      // Crear blob y descargar
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.json`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Components.showToast('Datos exportados correctamente a JSON', 'success');
    } catch (error) {
      console.error('Error al exportar a JSON:', error);
      Components.showToast('Error al exportar datos a JSON', 'danger');
    }
  },
  
  /**
   * Importa datos desde un archivo Excel
   * @param {File} file - Archivo Excel a importar
   * @returns {Promise} Promesa que resuelve con los datos importados
   */
  importFromExcel: function(file) {
    return new Promise((resolve, reject) => {
      // Verificar que SheetJS esté disponible
      if (typeof XLSX === 'undefined') {
        reject(new Error('La librería SheetJS (XLSX) no está disponible'));
        Components.showToast('Error: Librería de importación no disponible', 'danger');
        return;
      }
      
      try {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // Obtener primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Extraer encabezados y datos
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            resolve({ headers, rows });
            Components.showToast('Datos importados correctamente desde Excel', 'success');
          } catch (error) {
            reject(error);
            Components.showToast('Error al procesar el archivo Excel', 'danger');
          }
        };
        
        reader.onerror = function(error) {
          reject(error);
          Components.showToast('Error al leer el archivo Excel', 'danger');
        };
        
        reader.readAsBinaryString(file);
      } catch (error) {
        reject(error);
        Components.showToast('Error al importar datos desde Excel', 'danger');
      }
    });
  },
  
  /**
   * Importa datos desde un archivo CSV
   * @param {File} file - Archivo CSV a importar
   * @returns {Promise} Promesa que resuelve con los datos importados
   */
  importFromCSV: function(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            const csvData = e.target.result;
            const lines = csvData.split('\n');
            
            // Procesar encabezados
            const headers = lines[0].split(',').map(header => 
              header.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"')
            );
            
            // Procesar filas
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Parsear CSV considerando comillas
              const row = [];
              let inQuotes = false;
              let currentValue = '';
              
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                  if (j < line.length - 1 && line[j + 1] === '"') {
                    // Doble comilla dentro de comillas
                    currentValue += '"';
                    j++;
                  } else {
                    // Inicio o fin de texto entrecomillado
                    inQuotes = !inQuotes;
                  }
                } else if (char === ',' && !inQuotes) {
                  // Fin de celda
                  row.push(currentValue);
                  currentValue = '';
                } else {
                  // Cualquier otro carácter
                  currentValue += char;
                }
              }
              
              // Añadir último valor
              row.push(currentValue);
              rows.push(row);
            }
            
            resolve({ headers, rows });
            Components.showToast('Datos importados correctamente desde CSV', 'success');
          } catch (error) {
            reject(error);
            Components.showToast('Error al procesar el archivo CSV', 'danger');
          }
        };
        
        reader.onerror = function(error) {
          reject(error);
          Components.showToast('Error al leer el archivo CSV', 'danger');
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
        Components.showToast('Error al importar datos desde CSV', 'danger');
      }
    });
  },
  
  /**
   * Importa datos desde un archivo JSON
   * @param {File} file - Archivo JSON a importar
   * @returns {Promise} Promesa que resuelve con los datos importados
   */
  importFromJSON: function(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            const jsonData = JSON.parse(e.target.result);
            resolve(jsonData);
            Components.showToast('Datos importados correctamente desde JSON', 'success');
          } catch (error) {
            reject(error);
            Components.showToast('Error al procesar el archivo JSON', 'danger');
          }
        };
        
        reader.onerror = function(error) {
          reject(error);
          Components.showToast('Error al leer el archivo JSON', 'danger');
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(error);
        Components.showToast('Error al importar datos desde JSON', 'danger');
      }
    });
  },
  
  /**
   * Prepara los datos de menús para exportación
   * @returns {Object} Objeto con headers y rows para exportar
   */
  prepareMenusForExport: function() {
    const menus = Models.getAllMenus();
    
    const headers = [
      'ID', 'Semana', 'Estado', 
      'Lunes - Principal', 'Lunes - Guarnición', 'Lunes - Bebida',
      'Martes - Principal', 'Martes - Guarnición', 'Martes - Bebida',
      'Miércoles - Principal', 'Miércoles - Guarnición', 'Miércoles - Bebida',
      'Jueves - Principal', 'Jueves - Guarnición', 'Jueves - Bebida',
      'Viernes - Principal', 'Viernes - Guarnición', 'Viernes - Bebida'
    ];
    
    const rows = menus.map(menu => {
      const row = [
        menu.id,
        Utils.formatDate(menu.weekStart),
        menu.status
      ];
      
      // Añadir datos de cada día (lunes a viernes)
      for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
        const dayData = menu.days.find(day => day.dayOfWeek === dayIndex) || { mainDish: '', sideDish: '', drink: '' };
        row.push(dayData.mainDish || '');
        row.push(dayData.sideDish || '');
        row.push(dayData.drink || '');
      }
      
      return row;
    });
    
    return { headers, rows };
  },
  
  /**
   * Prepara los datos de confirmaciones para exportación
   * @returns {Object} Objeto con headers y rows para exportar
   */
  prepareConfirmationsForExport: function() {
    const confirmations = Models.getAllConfirmations();
    const coordinators = Models.getAllCoordinators();
    
    const headers = [
      'ID', 'Coordinador', 'Semana', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Total'
    ];
    
    const rows = confirmations.map(confirmation => {
      const coordinator = coordinators.find(c => c.id === confirmation.coordinatorId) || { name: 'Desconocido' };
      
      // Obtener asistentes por día
      const attendanceByDay = [1, 2, 3, 4, 5].map(dayOfWeek => {
        const dayData = confirmation.days.find(day => day.dayOfWeek === dayOfWeek);
        return dayData ? dayData.attendees : 0;
      });
      
      // Calcular total
      const total = attendanceByDay.reduce((sum, count) => sum + count, 0);
      
      return [
        confirmation.id,
        coordinator.name,
        Utils.formatDate(confirmation.weekStart),
        ...attendanceByDay,
        total
      ];
    });
    
    return { headers, rows };
  },
  
  /**
   * Prepara los datos de coordinadores para exportación
   * @returns {Object} Objeto con headers y rows para exportar
   */
  prepareCoordinatorsForExport: function() {
    const coordinators = Models.getAllCoordinators();
    
    const headers = ['ID', 'Nombre', 'Usuario', 'Máximo de Personas'];
    
    const rows = coordinators.map(coordinator => [
      coordinator.id,
      coordinator.name,
      coordinator.username,
      coordinator.maxPeople
    ]);
    
    return { headers, rows };
  },
  
  /**
   * Prepara los datos de reportes para exportación
   * @param {string} menuId - ID del menú para el reporte
   * @returns {Object} Objeto con headers y rows para exportar
   */
  prepareReportForExport: function(menuId) {
    const menu = Models.getMenuById(menuId);
    if (!menu) return { headers: [], rows: [] };
    
    const report = Models.generateAttendanceReport(menuId);
    const coordinators = Models.getAllCoordinators();
    
    // Encabezados con nombres de coordinadores
    const headers = ['Día', 'Fecha', 'Menú Principal', ...coordinators.map(c => c.name), 'Total'];
    
    // Filas con datos por día
    const rows = [];
    
    // Días de la semana (lunes a viernes)
    for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
      const dayName = CONFIG.DAYS_OF_WEEK[dayIndex].name;
      const dayData = menu.days.find(day => day.dayOfWeek === dayIndex) || {};
      const date = report.days[dayIndex - 1]?.date || '';
      
      const row = [
        dayName,
        Utils.formatDate(date),
        dayData.mainDish || ''
      ];
      
      // Asistentes por coordinador
      coordinators.forEach(coordinator => {
        const attendance = report.days[dayIndex - 1]?.byCoordinator[coordinator.id] || 0;
        row.push(attendance);
      });
      
      // Total del día
      row.push(report.days[dayIndex - 1]?.total || 0);
      
      rows.push(row);
    }
    
    // Fila de totales
    const totalsRow = [
      'TOTAL',
      '',
      ''
    ];
    
    // Totales por coordinador
    coordinators.forEach(coordinator => {
      const total = report.days.reduce((sum, day) => sum + (day.byCoordinator[coordinator.id] || 0), 0);
      totalsRow.push(total);
    });
    
    // Total general
    totalsRow.push(report.total);
    
    rows.push(totalsRow);
    
    return { headers, rows };
  }
};

// Exportar el objeto ExportImport
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportImport;
}
