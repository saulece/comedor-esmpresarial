/**
 * attendance-manager.js
 * Gestiona las confirmaciones de asistencia para el comedor empresarial
 */

// Verificar que las dependencias necesarias estén disponibles
if (typeof AppUtils === 'undefined') {
    console.error('AttendanceManager: AppUtils no está disponible');
    // Crear un objeto AppUtils mínimo para evitar errores
    window.AppUtils = window.AppUtils || {
        showNotification: function(message, type) {
            console.log('[Notificación]', type, message);
            alert(message);
        }
    };
}

// Objeto global para gestionar la asistencia
const AttendanceManager = {
    // Propiedades
    currentWeekData: null,
    nextWeekData: null,
    currentMenuData: null,
    nextMenuData: null,
    activeWeekType: 'current', // 'current' o 'next'
    initialized: false,
    
    /**
     * Inicializa el gestor de asistencia
     */
    init: function() {
        console.log('Inicializando AttendanceManager...');
        
        // Evitar inicialización múltiple
        if (this.initialized) {
            console.log('AttendanceManager ya está inicializado');
            return;
        }
        
        try {
            // Verificar que los elementos necesarios existan en el DOM
            const confirmationContainer = document.getElementById('confirmation-container');
            if (!confirmationContainer) {
                console.error('No se encontró el contenedor de confirmaciones');
                return;
            }
            
            // Inicializar con un pequeño retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                try {
                    // Configurar formularios
                    this.setupForms();
                    
                    // Cargar datos iniciales
                    this.loadAttendanceData();
                    
                    // Marcar como inicializado
                    this.initialized = true;
                    
                    console.log('AttendanceManager inicializado correctamente');
                } catch (setupError) {
                    console.error('Error en la inicialización diferida de AttendanceManager:', setupError);
                }
            }, 300);
        } catch (error) {
            console.error('Error al inicializar AttendanceManager:', error);
            // Usar una versión segura de AppUtils
            if (typeof AppUtils !== 'undefined' && AppUtils.showNotification) {
                AppUtils.showNotification('Error al inicializar el gestor de asistencia', 'error');
            }
        }
    },
    
    /**
     * Configura los formularios de asistencia
     */
    setupForms: function() {
        console.log('Configurando formularios de asistencia...');
        
        try {
            // Verificar si los contenedores de confirmación existen
            const currentWeekConfirmation = document.getElementById('current-week-confirmation');
            const nextWeekConfirmation = document.getElementById('next-week-confirmation');
            
            if (!currentWeekConfirmation || !nextWeekConfirmation) {
                console.error('No se encontraron los contenedores de confirmación');
                return;
            }
            
            // Crear formularios si no existen
            this.createFormIfNotExists('current');
            this.createFormIfNotExists('next');
            
            // Configurar formulario de la semana actual
            const currentForm = document.getElementById('current-attendance-form');
            if (currentForm) {
                // Eliminar event listeners previos para evitar duplicados
                const newCurrentForm = currentForm.cloneNode(true);
                if (currentForm.parentNode) {
                    currentForm.parentNode.replaceChild(newCurrentForm, currentForm);
                }
                
                newCurrentForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.saveAttendance('current');
                });
                
                const resetCurrentBtn = newCurrentForm.querySelector('#reset-current-attendance-btn');
                if (resetCurrentBtn) {
                    resetCurrentBtn.addEventListener('click', () => this.resetForm('current'));
                }
            }
            
            // Configurar formulario de la próxima semana
            const nextForm = document.getElementById('next-attendance-form');
            if (nextForm) {
                // Eliminar event listeners previos para evitar duplicados
                const newNextForm = nextForm.cloneNode(true);
                if (nextForm.parentNode) {
                    nextForm.parentNode.replaceChild(newNextForm, nextForm);
                }
                
                newNextForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.saveAttendance('next');
                });
                
                const resetNextBtn = newNextForm.querySelector('#reset-next-attendance-btn');
                if (resetNextBtn) {
                    resetNextBtn.addEventListener('click', () => this.resetForm('next'));
                }
            }
            
            console.log('Formularios de asistencia configurados correctamente');
        } catch (error) {
            console.error('Error al configurar formularios de asistencia:', error);
        }
    },
    
    /**
     * Crea un formulario de asistencia si no existe
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     */
    createFormIfNotExists: function(weekType) {
        const formId = `${weekType}-attendance-form`;
        const existingForm = document.getElementById(formId);
        
        if (!existingForm) {
            console.log(`Creando formulario para ${weekType}...`);
            
            const weekConfirmation = document.getElementById(`${weekType}-week-confirmation`);
            if (!weekConfirmation) {
                console.error(`No se encontró el contenedor de confirmación para ${weekType}`);
                return;
            }
            
            // Crear formulario
            const form = document.createElement('form');
            form.id = formId;
            form.className = 'attendance-form';
            if (weekType === 'current') {
                form.classList.add('active');
            }
            
            // Crear contenido del formulario
            form.innerHTML = `
                <h4><i class="fas fa-users"></i> Confirmar Asistencia - ${weekType === 'current' ? 'Semana Actual' : 'Próxima Semana'}</h4>
                <p class="help-text">Indique el número estimado de personas que asistirán cada día${weekType === 'next' ? ' para la próxima semana' : ''}:</p>
                
                <div id="${weekType}-attendance-inputs" class="attendance-inputs">
                    <!-- Los inputs para cada día se generarán dinámicamente -->
                    <p class="empty-state">Cargando menú...</p>
                </div>
                
                <div class="form-actions">
                    <button type="submit" id="save-${weekType}-attendance-btn" class="primary-btn">
                        <i class="fas fa-save"></i> Confirmar Asistencia
                    </button>
                    <button type="button" id="reset-${weekType}-attendance-btn" class="secondary-btn">
                        <i class="fas fa-undo"></i> Restablecer
                    </button>
                </div>
                
                <div id="${weekType}-last-update-info" class="last-update-info" style="display: none;">
                    <i class="fas fa-clock"></i> Última actualización: <span id="${weekType}-last-update-time"></span>
                </div>
            `;
            
            // Agregar formulario al contenedor
            weekConfirmation.appendChild(form);
            
            console.log(`Formulario para ${weekType} creado correctamente`);
        }
    },
    
    /**
     * Carga los datos de asistencia desde Firebase
     */
    loadAttendanceData: function() {
        console.log('Cargando datos de asistencia...');
        
        // Obtener el ID del coordinador de la sesión
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) {
            console.error('No hay un coordinador con sesión activa');
            return;
        }
        
        try {
            // Cargar datos de la semana actual
            this.loadWeekAttendance('current', coordinatorId);
            
            // Cargar datos de la próxima semana
            this.loadWeekAttendance('next', coordinatorId);
        } catch (error) {
            console.error('Error al cargar datos de asistencia:', error);
            AppUtils.showNotification('Error al cargar datos de asistencia', 'error');
        }
    },
    
    /**
     * Carga los datos de asistencia para una semana específica
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {string} coordinatorId - ID del coordinador
     */
    loadWeekAttendance: function(weekType, coordinatorId) {
        console.log(`Cargando datos de asistencia para la semana ${weekType}...`);
        
        // Referencia a la colección de asistencia en Firebase
        const attendanceRef = firebase.firestore().collection('attendance')
            .where('coordinatorId', '==', coordinatorId)
            .where('weekType', '==', weekType);
        
        attendanceRef.get().then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Hay datos de asistencia
                const attendanceDoc = querySnapshot.docs[0];
                const attendanceData = attendanceDoc.data();
                
                console.log(`Datos de asistencia para semana ${weekType} encontrados:`, attendanceData);
                
                // Almacenar datos
                if (weekType === 'current') {
                    this.currentWeekData = attendanceData;
                } else {
                    this.nextWeekData = attendanceData;
                }
                
                // Actualizar formulario
                this.updateFormWithData(weekType, attendanceData);
                
                // Mostrar información de última actualización
                this.showLastUpdateInfo(weekType, attendanceData.lastUpdate);
            } else {
                console.log(`No hay datos de asistencia para la semana ${weekType}`);
                
                // Limpiar formulario
                this.resetForm(weekType);
                
                // Ocultar información de última actualización
                this.hideLastUpdateInfo(weekType);
            }
        }).catch((error) => {
            console.error(`Error al cargar datos de asistencia para semana ${weekType}:`, error);
            AppUtils.showNotification(`Error al cargar datos de asistencia para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'}`, 'error');
        });
    },
    
    /**
     * Actualiza el formulario con los datos de asistencia
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {object} data - Datos de asistencia
     */
    updateFormWithData: function(weekType, data) {
        console.log(`Actualizando formulario ${weekType} con datos:`, data);
        
        const inputsContainer = document.getElementById(`${weekType}-attendance-inputs`);
        if (!inputsContainer) {
            console.error(`No se encontró el contenedor de inputs para ${weekType}`);
            return;
        }
        
        // Verificar si hay datos de asistencia por día
        if (data.dailyAttendance && Object.keys(data.dailyAttendance).length > 0) {
            // Recorrer cada día y actualizar el input correspondiente
            Object.keys(data.dailyAttendance).forEach(day => {
                const input = document.getElementById(`${weekType}-attendance-${day}`);
                if (input) {
                    input.value = data.dailyAttendance[day];
                }
            });
        }
    },
    
    /**
     * Muestra la información de última actualización
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {number} timestamp - Timestamp de la última actualización
     */
    showLastUpdateInfo: function(weekType, timestamp) {
        const infoContainer = document.getElementById(`${weekType}-last-update-info`);
        const timeSpan = document.getElementById(`${weekType}-last-update-time`);
        
        if (infoContainer && timeSpan && timestamp) {
            // Formatear fecha
            const date = new Date(timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            // Actualizar y mostrar
            timeSpan.textContent = formattedDate;
            infoContainer.style.display = 'block';
        }
    },
    
    /**
     * Oculta la información de última actualización
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     */
    hideLastUpdateInfo: function(weekType) {
        const infoContainer = document.getElementById(`${weekType}-last-update-info`);
        
        if (infoContainer) {
            infoContainer.style.display = 'none';
        }
    },
    
    /**
     * Guarda los datos de asistencia
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     */
    saveAttendance: function(weekType) {
        console.log(`Guardando asistencia para semana ${weekType}...`);
        
        // Obtener el ID del coordinador
        const coordinatorId = sessionStorage.getItem('coordinatorId');
        if (!coordinatorId) {
            console.error('No hay un coordinador con sesión activa');
            AppUtils.showNotification('Error: No hay sesión activa', 'error');
            return;
        }
        
        try {
            // Obtener datos del formulario
            const inputsContainer = document.getElementById(`${weekType}-attendance-inputs`);
            if (!inputsContainer) {
                console.error(`No se encontró el contenedor de inputs para ${weekType}`);
                return;
            }
            
            // Recopilar datos de asistencia por día
            const dailyAttendance = {};
            const inputs = inputsContainer.querySelectorAll('input[type="number"]');
            
            inputs.forEach(input => {
                const day = input.getAttribute('data-day');
                const count = parseInt(input.value) || 0;
                
                if (day) {
                    dailyAttendance[day] = count;
                }
            });
            
            // Verificar que haya datos
            if (Object.keys(dailyAttendance).length === 0) {
                console.error('No hay datos de asistencia para guardar');
                AppUtils.showNotification('Error: No hay datos para guardar', 'error');
                return;
            }
            
            // Crear objeto de datos
            const attendanceData = {
                coordinatorId,
                weekType,
                dailyAttendance,
                lastUpdate: Date.now()
            };
            
            // Guardar en Firebase
            this.saveAttendanceToFirebase(weekType, attendanceData);
        } catch (error) {
            console.error(`Error al guardar asistencia para semana ${weekType}:`, error);
            AppUtils.showNotification(`Error al guardar asistencia para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'}`, 'error');
        }
    },
    
    /**
     * Guarda los datos de asistencia en Firebase
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {object} data - Datos de asistencia
     */
    saveAttendanceToFirebase: function(weekType, data) {
        console.log(`Guardando datos en Firebase para semana ${weekType}:`, data);
        
        // Referencia a la colección de asistencia
        const attendanceRef = firebase.firestore().collection('attendance');
        
        // Buscar si ya existe un documento para este coordinador y tipo de semana
        attendanceRef
            .where('coordinatorId', '==', data.coordinatorId)
            .where('weekType', '==', weekType)
            .get()
            .then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    // Actualizar documento existente
                    const docId = querySnapshot.docs[0].id;
                    return attendanceRef.doc(docId).update(data);
                } else {
                    // Crear nuevo documento
                    return attendanceRef.add(data);
                }
            })
            .then(() => {
                console.log(`Datos de asistencia para semana ${weekType} guardados correctamente`);
                AppUtils.showNotification(`Asistencia para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'} guardada correctamente`, 'success');
                
                // Actualizar datos locales
                if (weekType === 'current') {
                    this.currentWeekData = data;
                } else {
                    this.nextWeekData = data;
                }
                
                // Mostrar información de última actualización
                this.showLastUpdateInfo(weekType, data.lastUpdate);
            })
            .catch((error) => {
                console.error(`Error al guardar datos en Firebase para semana ${weekType}:`, error);
                AppUtils.showNotification(`Error al guardar asistencia para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'}`, 'error');
            });
    },
    
    /**
     * Resetea el formulario de asistencia
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     */
    resetForm: function(weekType) {
        console.log(`Reseteando formulario para semana ${weekType}...`);
        
        const inputsContainer = document.getElementById(`${weekType}-attendance-inputs`);
        if (!inputsContainer) {
            console.error(`No se encontró el contenedor de inputs para ${weekType}`);
            return;
        }
        
        // Resetear todos los inputs
        const inputs = inputsContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.value = '0';
        });
        
        AppUtils.showNotification(`Formulario de la ${weekType === 'current' ? 'semana actual' : 'próxima semana'} restablecido`, 'info');
    },
    
    /**
     * Actualiza el menú para una semana específica
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {object} menuData - Datos del menú
     */
    updateMenu: function(weekType, menuData) {
        console.log(`Actualizando menú para semana ${weekType}:`, menuData);
        
        // Almacenar datos del menú
        if (weekType === 'current') {
            this.currentMenuData = menuData;
        } else {
            this.nextMenuData = menuData;
        }
        
        // Mostrar menú en la sección de confirmaciones
        this.displayMenuInConfirmation(weekType, menuData);
        
        // Generar inputs de asistencia basados en el menú
        this.generateAttendanceInputs(weekType, menuData);
    },
    
    /**
     * Muestra el menú en la sección de confirmaciones
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {object} menuData - Datos del menú
     */
    displayMenuInConfirmation: function(weekType, menuData) {
        console.log(`Mostrando menú en sección de confirmaciones para semana ${weekType}`);
        
        const menuDisplay = document.getElementById(`${weekType}-confirmation-menu-display`);
        if (!menuDisplay) {
            console.error(`No se encontró el contenedor para mostrar el menú de la semana ${weekType}`);
            return;
        }
        
        // Limpiar contenedor
        menuDisplay.innerHTML = '';
        
        if (!menuData || !menuData.days || Object.keys(menuData.days).length === 0) {
            // No hay datos de menú
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = `No hay menú disponible para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'}.`;
            menuDisplay.appendChild(emptyState);
            return;
        }
        
        // Crear tabla de menú
        const menuTable = document.createElement('table');
        menuTable.className = 'menu-table';
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Columna de día
        const dayHeader = document.createElement('th');
        dayHeader.textContent = 'Día';
        headerRow.appendChild(dayHeader);
        
        // Columna de platillo
        const dishHeader = document.createElement('th');
        dishHeader.textContent = 'Platillo';
        headerRow.appendChild(dishHeader);
        
        thead.appendChild(headerRow);
        menuTable.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Ordenar días de la semana
        const daysOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
        const sortedDays = Object.keys(menuData.days).sort((a, b) => {
            return daysOrder.indexOf(a.toLowerCase()) - daysOrder.indexOf(b.toLowerCase());
        });
        
        // Agregar filas para cada día
        sortedDays.forEach(day => {
            const dayData = menuData.days[day];
            
            const row = document.createElement('tr');
            
            // Celda de día
            const dayCell = document.createElement('td');
            dayCell.textContent = this.capitalizeFirstLetter(day);
            row.appendChild(dayCell);
            
            // Celda de platillo
            const dishCell = document.createElement('td');
            dishCell.textContent = dayData.dish || 'No especificado';
            row.appendChild(dishCell);
            
            tbody.appendChild(row);
        });
        
        menuTable.appendChild(tbody);
        menuDisplay.appendChild(menuTable);
    },
    
    /**
     * Genera los inputs de asistencia basados en el menú
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     * @param {object} menuData - Datos del menú
     */
    generateAttendanceInputs: function(weekType, menuData) {
        console.log(`Generando inputs de asistencia para semana ${weekType}`);
        
        const inputsContainer = document.getElementById(`${weekType}-attendance-inputs`);
        if (!inputsContainer) {
            console.error(`No se encontró el contenedor de inputs para ${weekType}`);
            return;
        }
        
        // Limpiar contenedor
        inputsContainer.innerHTML = '';
        
        if (!menuData || !menuData.days || Object.keys(menuData.days).length === 0) {
            // No hay datos de menú
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = `No hay menú disponible para la ${weekType === 'current' ? 'semana actual' : 'próxima semana'}.`;
            inputsContainer.appendChild(emptyState);
            
            // Ocultar botones de acción
            const formActions = inputsContainer.closest('form').querySelector('.form-actions');
            if (formActions) {
                formActions.style.display = 'none';
            }
            
            return;
        }
        
        // Mostrar botones de acción
        const formActions = inputsContainer.closest('form').querySelector('.form-actions');
        if (formActions) {
            formActions.style.display = 'flex';
        }
        
        // Ordenar días de la semana
        const daysOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
        const sortedDays = Object.keys(menuData.days).sort((a, b) => {
            return daysOrder.indexOf(a.toLowerCase()) - daysOrder.indexOf(b.toLowerCase());
        });
        
        // Crear inputs para cada día
        sortedDays.forEach(day => {
            const dayData = menuData.days[day];
            
            // Crear contenedor para el día
            const dayContainer = document.createElement('div');
            dayContainer.className = 'attendance-day';
            
            // Crear etiqueta
            const label = document.createElement('label');
            label.setAttribute('for', `${weekType}-attendance-${day}`);
            label.textContent = `${this.capitalizeFirstLetter(day)} (${dayData.dish || 'No especificado'}):`;
            dayContainer.appendChild(label);
            
            // Crear input
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `${weekType}-attendance-${day}`;
            input.name = `${weekType}-attendance-${day}`;
            input.setAttribute('data-day', day);
            input.min = '0';
            input.value = '0';
            
            // Si hay datos previos, establecer el valor
            const weekData = weekType === 'current' ? this.currentWeekData : this.nextWeekData;
            if (weekData && weekData.dailyAttendance && weekData.dailyAttendance[day] !== undefined) {
                input.value = weekData.dailyAttendance[day];
            }
            
            dayContainer.appendChild(input);
            
            // Agregar al contenedor
            inputsContainer.appendChild(dayContainer);
        });
    },
    
    /**
     * Cambia entre semana actual y próxima semana
     * @param {string} weekType - Tipo de semana ('current' o 'next')
     */
    switchWeek: function(weekType) {
        console.log(`Cambiando a semana ${weekType}...`);
        
        // Actualizar semana activa
        this.activeWeekType = weekType;
        
        // Mostrar formulario correspondiente
        const currentForm = document.getElementById('current-attendance-form');
        const nextForm = document.getElementById('next-attendance-form');
        
        if (currentForm && nextForm) {
            if (weekType === 'current') {
                currentForm.style.display = 'block';
                nextForm.style.display = 'none';
                currentForm.classList.add('active');
                nextForm.classList.remove('active');
            } else {
                currentForm.style.display = 'none';
                nextForm.style.display = 'block';
                currentForm.classList.remove('active');
                nextForm.classList.add('active');
            }
        }
    },
    
    /**
     * Capitaliza la primera letra de una cadena
     * @param {string} string - Cadena a capitalizar
     * @returns {string} - Cadena con la primera letra en mayúscula
     */
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
};
