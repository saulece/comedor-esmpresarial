/**
 * ui.js
 * Módulo para gestionar la interfaz de usuario
 * Sistema de Confirmación de Asistencia - Comedor Empresarial
 */

const UI = {
    /**
     * Muestra un mensaje temporal al usuario
     * @param {string} text - Texto del mensaje
     * @param {string} type - Tipo de mensaje ('success' o 'error')
     */
    showMessage: function(text, type) {
        const confirmationMessage = document.getElementById('confirmation-message');
        confirmationMessage.textContent = text;
        confirmationMessage.className = 'message ' + type;
        confirmationMessage.classList.remove('hidden');
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
            confirmationMessage.classList.add('hidden');
        }, 3000);
    },

    /**
     * Muestra una sección específica y oculta las demás
     * @param {HTMLElement} section - Sección a mostrar
     */
    showSection: function(section) {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('main section');
        sections.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active-section');
        });
        
        // Mostrar la sección seleccionada
        section.classList.remove('hidden');
        section.classList.add('active-section');
    },

    /**
     * Establece el elemento de navegación activo
     * @param {HTMLElement} navItem - Elemento de navegación a activar
     */
    setActiveNav: function(navItem) {
        // Quitar clase activa de todos los elementos de navegación
        const navItems = document.querySelectorAll('nav a');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Agregar clase activa al elemento seleccionado
        navItem.classList.add('active');
    },

    /**
     * Configura los eventos de navegación
     * @param {Object} elements - Elementos DOM necesarios
     */
    setupNavigation: function(elements) {
        const { navConfirm, navView, confirmationForm, attendanceList } = elements;
        
        navConfirm.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(confirmationForm);
            this.setActiveNav(navConfirm);
        });
        
        navView.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(attendanceList);
            this.setActiveNav(navView);
            this.displayAttendanceRecords();
        });
    },

    /**
     * Configura los eventos del formulario de asistencia
     * @param {Object} elements - Elementos DOM necesarios
     * @param {Function} saveCallback - Función para guardar la asistencia
     */
    setupForm: function(elements, saveCallback) {
        const { attendanceForm, dateInput, peopleCountInput } = elements;
        
        attendanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const date = dateInput.value;
            const peopleCount = parseInt(peopleCountInput.value, 10);
            
            if (!date || isNaN(peopleCount) || peopleCount < 1) {
                this.showMessage('Por favor, complete todos los campos correctamente.', 'error');
                return;
            }
            
            // Guardar la confirmación
            saveCallback(date, peopleCount);
            
            // Mostrar mensaje de éxito
            this.showMessage('Confirmación registrada correctamente.', 'success');
            
            // Resetear el formulario (manteniendo la fecha)
            peopleCountInput.value = '';
        });
    },

    /**
     * Configura los eventos de filtrado
     * @param {Object} elements - Elementos DOM necesarios
     */
    setupFilters: function(elements) {
        const { filterDateInput, applyFilterBtn, clearFilterBtn } = elements;
        
        applyFilterBtn.addEventListener('click', () => {
            const filterDate = filterDateInput.value;
            if (!filterDate) {
                this.showMessage('Por favor, seleccione una fecha para filtrar.', 'error');
                return;
            }
            this.displayAttendanceRecords(filterDate);
        });
        
        clearFilterBtn.addEventListener('click', () => {
            filterDateInput.value = '';
            this.displayAttendanceRecords();
        });
    },

    /**
     * Configura los eventos de importación de datos
     * @param {Object} elements - Elementos DOM necesarios
     * @param {Function} importCallback - Función para importar datos
     */
    setupImport: function(elements, importCallback) {
        const { importFileInput } = elements;
        
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            
            importCallback(file)
                .then(result => {
                    this.showMessage(result.message, 'success');
                    this.displayAttendanceRecords();
                })
                .catch(error => {
                    this.showMessage(error.message, 'error');
                });
                
            // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
            importFileInput.value = '';
        });
    },

    /**
     * Configura los botones de eliminación de registros
     * @param {Function} deleteCallback - Función para eliminar un registro
     */
    setupDeleteButtons: function(deleteCallback) {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'), 10);
                
                // Pedir confirmación antes de eliminar
                if (confirm('¿Está seguro de que desea eliminar este registro?')) {
                    deleteCallback(index);
                    this.displayAttendanceRecords();
                }
            });
        });
    },

    /**
     * Muestra los registros de asistencia
     * @param {string|null} filterDate - Fecha para filtrar (opcional)
     * @param {Function} getDataCallback - Función para obtener los datos
     * @param {Function} exportCallback - Función para exportar datos
     */
    displayAttendanceRecords: function(filterDate = null, getDataCallback, exportCallback) {
        const attendanceRecords = document.getElementById('attendance-records');
        const attendanceData = getDataCallback();
        
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
            const result = exportCallback();
            if (result.success) {
                this.showMessage(result.message, 'success');
            } else {
                this.showMessage(result.message, 'error');
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
        this.setupDeleteButtons(index => {
            StorageManager.deleteAttendanceRecord(index);
        });
    }
};
