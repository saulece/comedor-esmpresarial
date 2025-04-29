/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Biblioteca de componentes UI reutilizables
 * 
 * Este archivo contiene funciones para crear componentes de UI consistentes
 * que pueden ser utilizados en toda la aplicación.
 */

const Components = {
    /**
     * Crea un componente de alerta
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de alerta: 'success', 'warning', 'danger', 'info'
     * @param {boolean} dismissible - Si la alerta puede ser cerrada
     * @param {number} autoClose - Milisegundos para cerrar automáticamente (0 = no cerrar)
     * @returns {HTMLElement} - Elemento de alerta
     */
    createAlert: function(message, type = 'info', dismissible = true, autoClose = 0) {
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type}`;
        
        if (dismissible) {
            alertEl.classList.add('alert-dismissible');
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close';
            closeBtn.innerHTML = '&times;';
            closeBtn.setAttribute('aria-label', 'Cerrar');
            closeBtn.addEventListener('click', () => {
                alertEl.remove();
            });
            
            alertEl.appendChild(closeBtn);
        }
        
        alertEl.innerHTML += message;
        
        if (autoClose > 0) {
            setTimeout(() => {
                alertEl.classList.add('fade-out');
                setTimeout(() => alertEl.remove(), 300);
            }, autoClose);
        }
        
        return alertEl;
    },
    
    /**
     * Muestra una alerta en un contenedor específico
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de alerta: 'success', 'warning', 'danger', 'info'
     * @param {string} containerId - ID del contenedor donde mostrar la alerta
     * @param {boolean} dismissible - Si la alerta puede ser cerrada
     * @param {number} autoClose - Milisegundos para cerrar automáticamente (0 = no cerrar)
     */
    showAlert: function(message, type = 'info', containerId, dismissible = true, autoClose = 3000) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const alertEl = this.createAlert(message, type, dismissible, autoClose);
        container.prepend(alertEl);
    },
    
    /**
     * Crea un componente de tarjeta (card)
     * @param {Object} options - Opciones de configuración
     * @param {string} options.title - Título de la tarjeta (opcional)
     * @param {string} options.content - Contenido HTML de la tarjeta
     * @param {string} options.footer - Contenido HTML del footer (opcional)
     * @param {string} options.variant - Variante de la tarjeta: 'primary', 'secondary', 'success', 'danger' (opcional)
     * @returns {HTMLElement} - Elemento de tarjeta
     */
    createCard: function(options) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        if (options.variant) {
            cardEl.classList.add(`card-${options.variant}`);
        }
        
        if (options.title) {
            const headerEl = document.createElement('div');
            headerEl.className = 'card-header';
            headerEl.innerHTML = options.title;
            cardEl.appendChild(headerEl);
        }
        
        const bodyEl = document.createElement('div');
        bodyEl.className = 'card-body';
        bodyEl.innerHTML = options.content;
        cardEl.appendChild(bodyEl);
        
        if (options.footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'card-footer';
            footerEl.innerHTML = options.footer;
            cardEl.appendChild(footerEl);
        }
        
        return cardEl;
    },
    
    /**
     * Crea un conjunto de pestañas (tabs)
     * @param {Object[]} tabs - Array de objetos con configuración de pestañas
     * @param {string} tabs[].id - ID único para la pestaña
     * @param {string} tabs[].title - Título de la pestaña
     * @param {string} tabs[].content - Contenido HTML de la pestaña
     * @param {boolean} tabs[].active - Si la pestaña está activa inicialmente
     * @returns {Object} - Objeto con elementos de tabs y contenido
     */
    createTabs: function(tabs) {
        const tabsContainer = document.createElement('div');
        const tabsNav = document.createElement('div');
        const tabsContent = document.createElement('div');
        
        tabsNav.className = 'tabs';
        tabsContent.className = 'tab-contents';
        
        tabs.forEach(tab => {
            // Crear botón de pestaña
            const tabBtn = document.createElement('button');
            tabBtn.className = 'tab-btn';
            tabBtn.setAttribute('data-tab', tab.id);
            tabBtn.innerHTML = tab.title;
            
            // Crear contenido de pestaña
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';
            tabContent.setAttribute('id', `tab-${tab.id}`);
            tabContent.innerHTML = tab.content;
            
            if (tab.active) {
                tabBtn.classList.add('active');
                tabContent.classList.add('active');
            }
            
            // Manejar clics en pestañas
            tabBtn.addEventListener('click', () => {
                // Desactivar todas las pestañas
                tabsNav.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabsContent.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Activar la pestaña seleccionada
                tabBtn.classList.add('active');
                tabContent.classList.add('active');
            });
            
            tabsNav.appendChild(tabBtn);
            tabsContent.appendChild(tabContent);
        });
        
        tabsContainer.appendChild(tabsNav);
        tabsContainer.appendChild(tabsContent);
        
        return {
            container: tabsContainer,
            nav: tabsNav,
            content: tabsContent
        };
    },
    
    /**
     * Crea un componente de modal
     * @param {Object} options - Opciones de configuración
     * @param {string} options.id - ID único para el modal
     * @param {string} options.title - Título del modal
     * @param {string} options.content - Contenido HTML del modal
     * @param {string} options.footer - Contenido HTML del footer (opcional)
     * @param {string} options.size - Tamaño del modal: 'sm', 'md', 'lg' (por defecto: 'md')
     * @returns {HTMLElement} - Elemento modal
     */
    createModal: function(options) {
        // Crear estructura del modal
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = `modal-overlay-${options.id}`;
        
        const modalContainer = document.createElement('div');
        modalContainer.className = `modal-container modal-${options.size || 'md'}`;
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'modal-title';
        modalTitle.innerHTML = options.title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.innerHTML = options.content;
        
        // Construir el modal
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        
        if (options.footer) {
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.innerHTML = options.footer;
            modalContainer.appendChild(modalFooter);
        }
        
        modalOverlay.appendChild(modalContainer);
        
        // Funcionalidad para cerrar el modal
        closeBtn.addEventListener('click', () => {
            this.closeModal(options.id);
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal(options.id);
            }
        });
        
        return modalOverlay;
    },
    
    /**
     * Abre un modal
     * @param {string} modalId - ID del modal a abrir
     */
    openModal: function(modalId) {
        const modalOverlay = document.getElementById(`modal-overlay-${modalId}`);
        if (!modalOverlay) return;
        
        document.body.classList.add('modal-open');
        modalOverlay.classList.add('active');
        
        // Añadir al body si no existe
        if (!modalOverlay.parentElement) {
            document.body.appendChild(modalOverlay);
        }
    },
    
    /**
     * Cierra un modal
     * @param {string} modalId - ID del modal a cerrar
     */
    closeModal: function(modalId) {
        const modalOverlay = document.getElementById(`modal-overlay-${modalId}`);
        if (!modalOverlay) return;
        
        document.body.classList.remove('modal-open');
        modalOverlay.classList.remove('active');
    },
    
    /**
     * Crea un componente de tabla
     * @param {Object} options - Opciones de configuración
     * @param {string[]} options.headers - Array con textos de encabezados
     * @param {Array[]} options.rows - Array de arrays con datos de filas
     * @param {boolean} options.striped - Si la tabla debe tener filas alternadas
     * @param {boolean} options.bordered - Si la tabla debe tener bordes
     * @param {boolean} options.responsive - Si la tabla debe ser responsiva
     * @returns {HTMLElement} - Elemento tabla con contenedor
     */
    createTable: function(options) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        const table = document.createElement('table');
        table.className = 'table';
        
        if (options.striped) {
            table.classList.add('table-striped');
        }
        
        if (options.bordered) {
            table.classList.add('table-bordered');
        }
        
        // Crear encabezado
        if (options.headers && options.headers.length) {
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            options.headers.forEach(header => {
                const th = document.createElement('th');
                th.innerHTML = header;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        if (options.rows && options.rows.length) {
            options.rows.forEach(row => {
                const tr = document.createElement('tr');
                
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.innerHTML = cell;
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
        }
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        return tableContainer;
    },
    
    /**
     * Crea un componente de gráfico de barras simple
     * @param {Object} options - Opciones de configuración
     * @param {string[]} options.labels - Array con etiquetas para cada barra
     * @param {number[]} options.values - Array con valores para cada barra
     * @param {number[]} options.compareValues - Array con valores de comparación (opcional)
     * @param {string} options.title - Título del gráfico (opcional)
     * @param {Object} options.legend - Configuración de leyenda {current: 'texto', compare: 'texto'} (opcional)
     * @returns {HTMLElement} - Elemento contenedor del gráfico
     */
    createBarChart: function(options) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        if (options.title) {
            const titleEl = document.createElement('h4');
            titleEl.className = 'chart-title';
            titleEl.innerHTML = options.title;
            chartContainer.appendChild(titleEl);
        }
        
        const chartContent = document.createElement('div');
        chartContent.className = 'chart-content';
        
        // Encontrar el valor máximo para calcular porcentajes
        const allValues = [...options.values];
        if (options.compareValues) {
            allValues.push(...options.compareValues);
        }
        const maxValue = Math.max(...allValues, 1); // Evitar división por cero
        
        // Crear barras
        options.labels.forEach((label, index) => {
            const chartDay = document.createElement('div');
            chartDay.className = 'chart-day';
            
            const chartBars = document.createElement('div');
            chartBars.className = 'chart-bars';
            
            // Barra principal
            if (options.values[index] !== undefined) {
                const value = options.values[index];
                const height = (value / maxValue) * 100;
                
                const bar = document.createElement('div');
                bar.className = 'chart-bar current';
                bar.style.height = `${height}%`;
                
                const valueLabel = document.createElement('div');
                valueLabel.className = 'chart-value';
                valueLabel.innerHTML = value;
                
                bar.appendChild(valueLabel);
                chartBars.appendChild(bar);
            }
            
            // Barra de comparación
            if (options.compareValues && options.compareValues[index] !== undefined) {
                const value = options.compareValues[index];
                const height = (value / maxValue) * 100;
                
                const bar = document.createElement('div');
                bar.className = 'chart-bar compare';
                bar.style.height = `${height}%`;
                
                const valueLabel = document.createElement('div');
                valueLabel.className = 'chart-value';
                valueLabel.innerHTML = value;
                
                bar.appendChild(valueLabel);
                chartBars.appendChild(bar);
            }
            
            const labelEl = document.createElement('div');
            labelEl.className = 'chart-label';
            labelEl.innerHTML = label;
            
            chartDay.appendChild(chartBars);
            chartDay.appendChild(labelEl);
            chartContent.appendChild(chartDay);
        });
        
        chartContainer.appendChild(chartContent);
        
        // Crear leyenda si es necesario
        if (options.legend) {
            const legendContainer = document.createElement('div');
            legendContainer.className = 'chart-legend';
            
            if (options.legend.current) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                
                const colorBox = document.createElement('span');
                colorBox.className = 'legend-color current';
                
                const text = document.createElement('span');
                text.innerHTML = options.legend.current;
                
                legendItem.appendChild(colorBox);
                legendItem.appendChild(text);
                legendContainer.appendChild(legendItem);
            }
            
            if (options.legend.compare) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                
                const colorBox = document.createElement('span');
                colorBox.className = 'legend-color compare';
                
                const text = document.createElement('span');
                text.innerHTML = options.legend.compare;
                
                legendItem.appendChild(colorBox);
                legendItem.appendChild(text);
                legendContainer.appendChild(legendItem);
            }
            
            chartContainer.appendChild(legendContainer);
        }
        
        return chartContainer;
    },
    
    /**
     * Crea un componente de spinner de carga
     * @param {string} size - Tamaño del spinner: 'sm', 'md', 'lg' (por defecto: 'md')
     * @param {string} text - Texto a mostrar junto al spinner (opcional)
     * @returns {HTMLElement} - Elemento spinner
     */
    createSpinner: function(size = 'md', text = '') {
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';
        
        const spinner = document.createElement('div');
        spinner.className = `spinner spinner-${size}`;
        
        spinnerContainer.appendChild(spinner);
        
        if (text) {
            const textEl = document.createElement('span');
            textEl.className = 'spinner-text';
            textEl.innerHTML = text;
            spinnerContainer.appendChild(textEl);
        }
        
        return spinnerContainer;
    },
    
    /**
     * Crea un componente de badge/etiqueta
     * @param {string} text - Texto del badge
     * @param {string} type - Tipo de badge: 'primary', 'secondary', 'success', 'warning', 'danger', 'info'
     * @returns {HTMLElement} - Elemento badge
     */
    createBadge: function(text, type = 'primary') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${type}`;
        badge.innerHTML = text;
        return badge;
    },
    
    /**
     * Crea un componente de confirmación
     * @param {Object} options - Opciones de configuración
     * @param {string} options.title - Título del diálogo
     * @param {string} options.message - Mensaje de confirmación
     * @param {string} options.confirmText - Texto del botón de confirmación
     * @param {string} options.cancelText - Texto del botón de cancelación
     * @param {Function} options.onConfirm - Función a ejecutar al confirmar
     * @param {Function} options.onCancel - Función a ejecutar al cancelar
     */
    confirm: function(options) {
        const modalId = 'confirm-' + Date.now();
        
        // Crear botones para el footer
        const footerContent = `
            <button class="btn btn-secondary mr-2" id="confirm-cancel-${modalId}">${options.cancelText || 'Cancelar'}</button>
            <button class="btn btn-primary" id="confirm-ok-${modalId}">${options.confirmText || 'Aceptar'}</button>
        `;
        
        // Crear y mostrar el modal
        const modal = this.createModal({
            id: modalId,
            title: options.title || 'Confirmar',
            content: `<p>${options.message}</p>`,
            footer: footerContent,
            size: 'sm'
        });
        
        document.body.appendChild(modal);
        this.openModal(modalId);
        
        // Configurar eventos
        document.getElementById(`confirm-cancel-${modalId}`).addEventListener('click', () => {
            if (typeof options.onCancel === 'function') {
                options.onCancel();
            }
            this.closeModal(modalId);
            setTimeout(() => modal.remove(), 300);
        });
        
        document.getElementById(`confirm-ok-${modalId}`).addEventListener('click', () => {
            if (typeof options.onConfirm === 'function') {
                options.onConfirm();
            }
            this.closeModal(modalId);
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    /**
     * Crea un componente de toast/notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast: 'success', 'warning', 'danger', 'info'
     * @param {number} duration - Duración en milisegundos (0 = no desaparece)
     * @returns {HTMLElement} - Elemento toast
     */
    createToast: function(message, type = 'info', duration = 3000) {
        // Crear contenedor de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = message;
        
        // Añadir botón de cierre
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 300);
        });
        
        toast.appendChild(closeBtn);
        
        // Mostrar toast
        toastContainer.appendChild(toast);
        
        // Configurar auto-cierre
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    },
    
    /**
     * Muestra un toast/notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast: 'success', 'warning', 'danger', 'info'
     * @param {number} duration - Duración en milisegundos (0 = no desaparece)
     */
    showToast: function(message, type = 'info', duration = 3000) {
        this.createToast(message, type, duration);
    }
};

// Exportar el objeto Components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Components;
}
