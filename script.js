/**
 * script.js
 * Script principal - Sistema de Confirmación de Asistencia - Comedor Empresarial
 * Implementación en JavaScript puro (vanilla JS) sin frameworks
 */

// Elementos DOM
const elements = {
    navConfirm: document.getElementById('nav-confirm'),
    navView: document.getElementById('nav-view'),
    confirmationForm: document.getElementById('confirmation-form'),
    attendanceList: document.getElementById('attendance-list'),
    attendanceForm: document.getElementById('attendance-form'),
    dateInput: document.getElementById('attendance-date'),
    peopleCountInput: document.getElementById('people-count'),
    confirmationMessage: document.getElementById('confirmation-message'),
    attendanceRecords: document.getElementById('attendance-records'),
    filterDateInput: document.getElementById('filter-date'),
    applyFilterBtn: document.getElementById('apply-filter'),
    clearFilterBtn: document.getElementById('clear-filter'),
    importFileInput: document.getElementById('import-file')
};

// Establecer la fecha de hoy como valor predeterminado
const today = new Date().toISOString().split('T')[0];
elements.dateInput.value = today;
elements.dateInput.min = today; // No permitir fechas pasadas

// Limitar el número máximo de personas a un valor razonable
elements.peopleCountInput.max = 500;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos del localStorage
    StorageManager.loadAttendanceData();
    
    // Configurar navegación
    UI.setupNavigation(elements);
    
    // Configurar formulario
    UI.setupForm(elements, (date, peopleCount) => {
        StorageManager.saveAttendance(date, peopleCount);
    });
    
    // Configurar filtros
    UI.setupFilters(elements);
    
    // Configurar importación de datos
    UI.setupImport(elements, (file) => {
        return StorageManager.importFromJSON(file);
    });
});

// Sobrescribir el método displayAttendanceRecords de UI para integrarlo con StorageManager
UI.displayAttendanceRecords = function(filterDate = null) {
    const attendanceRecords = document.getElementById('attendance-records');
    const attendanceData = StorageManager.getAttendanceData();
    
    // Limpiar la lista actual
    attendanceRecords.innerHTML = '';
    
    // Filtrar datos si se proporciona una fecha
    let filteredData = attendanceData;
    if (filterDate) {
        filteredData = attendanceData.filter(record => record.date === filterDate);
    }
    
    if (filteredData.length === 0) {
        attendanceRecords.innerHTML = '<p>No hay confirmaciones registradas' + (filterDate ? ' para la fecha seleccionada.' : '.') + '</p>';
        return;
    }
    
    // Agregar botón de exportación
    const exportButton = document.createElement('button');
    exportButton.className = 'btn export-btn';
    exportButton.textContent = 'Exportar a JSON';
    exportButton.addEventListener('click', () => {
        const result = StorageManager.exportToJSON();
        if (result && result.success) {
            UI.showMessage(result.message, 'success');
        } else if (result) {
            UI.showMessage(result.message, 'error');
        } else {
            UI.showMessage('Datos exportados correctamente.', 'success');
        }
    });
    attendanceRecords.appendChild(exportButton);
    
    // Calcular total de personas
    const totalPeople = filteredData.reduce((sum, record) => sum + record.peopleCount, 0);
    
    // Mostrar resumen
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'summary';
    summaryDiv.innerHTML = `
        <p><strong>Total de registros:</strong> ${filteredData.length}</p>
        <p><strong>Total de asistentes:</strong> ${totalPeople} persona(s)</p>
    `;
    attendanceRecords.appendChild(summaryDiv);
    
    // Crear elementos para cada registro
    filteredData.forEach((record, index) => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        // Formatear la fecha para mostrar
        const dateObj = new Date(record.date);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Crear contenido del registro
        recordItem.innerHTML = `
            <div>
                <strong>${formattedDate}</strong>
                <p>${record.peopleCount} persona(s)</p>
            </div>
            <button class="delete-btn" data-index="${index}">Eliminar</button>
        `;
        
        // Agregar a la lista
        attendanceRecords.appendChild(recordItem);
    });
    
    // Agregar eventos para eliminar registros
    this.setupDeleteButtons((index) => {
        StorageManager.deleteAttendanceRecord(index);
        this.displayAttendanceRecords(filterDate);
    });
};
