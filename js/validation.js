/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de validación de formularios
 * 
 * Este archivo contiene funciones para validar formularios y mostrar
 * mensajes de error de manera consistente.
 */

const Validation = {
    /**
     * Errores comunes para mostrar mensajes amigables
     */
    errorMessages: {
        required: 'Este campo es obligatorio',
        email: 'Ingrese un correo electrónico válido',
        min: 'El valor debe ser al menos {0}',
        max: 'El valor no debe ser mayor a {0}',
        minLength: 'Debe tener al menos {0} caracteres',
        maxLength: 'No debe tener más de {0} caracteres',
        pattern: 'El formato ingresado no es válido',
        number: 'Ingrese un número válido',
        integer: 'Ingrese un número entero válido',
        date: 'Ingrese una fecha válida',
        match: 'Los campos no coinciden',
        unique: 'Este valor ya existe en el sistema',
        // Mensajes específicos para el comedor empresarial
        futureDate: 'La fecha debe ser igual o posterior a hoy',
        workDay: 'La fecha debe ser un día laboral (lunes a viernes)',
        attendanceLimit: 'El número de asistentes excede el límite permitido',
        menuRequired: 'Debe especificar al menos el plato principal para este día',
        invalidWeek: 'La semana seleccionada no es válida',
        // Mensajes de seguridad
        xss: 'El texto contiene caracteres no permitidos',
        sql: 'El texto contiene caracteres no permitidos',
        url: 'La URL ingresada no es válida o segura'
    },
    
    /**
     * Indica si se debe aplicar sanitización automática a las entradas
     */
    autoSanitize: true,
    
    /**
     * Valida un campo individual
     * @param {HTMLElement} field - Campo a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} - Resultado de la validación {valid: boolean, message: string}
     */
    validateField: function(field, rules) {
        // Aplicar sanitización automática si está habilitada y el módulo está disponible
        if (this.autoSanitize && typeof InputSanitizer !== 'undefined') {
            // Determinar el tipo de sanitización según las reglas
            let sanitizeType = 'string';
            if (rules.email) sanitizeType = 'email';
            else if (rules.url) sanitizeType = 'url';
            
            // Sanitizar el valor
            const sanitizedValue = this._sanitizeValue(field.value, sanitizeType);
            if (field.value !== sanitizedValue) {
                field.value = sanitizedValue;
            }
        }
        
        const value = field.value.trim();
        const result = { valid: true, message: '' };
        
        // Validar campo requerido
        if (rules.required && value === '') {
            result.valid = false;
            result.message = this.errorMessages.required;
            return result;
        }
        
        // Si el campo está vacío y no es requerido, no validar más reglas
        if (value === '' && !rules.required) {
            return result;
        }
        
        // Validar tipo de correo electrónico
        if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            result.valid = false;
            result.message = this.errorMessages.email;
            return result;
        }
        
        // Validar valor mínimo (para números)
        if (rules.min !== undefined && parseFloat(value) < rules.min) {
            result.valid = false;
            result.message = this.errorMessages.min.replace('{0}', rules.min);
            return result;
        }
        
        // Validar valor máximo (para números)
        if (rules.max !== undefined && parseFloat(value) > rules.max) {
            result.valid = false;
            result.message = this.errorMessages.max.replace('{0}', rules.max);
            return result;
        }
        
        // Validar longitud mínima
        if (rules.minLength !== undefined && value.length < rules.minLength) {
            result.valid = false;
            result.message = this.errorMessages.minLength.replace('{0}', rules.minLength);
            return result;
        }
        
        // Validar longitud máxima
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            result.valid = false;
            result.message = this.errorMessages.maxLength.replace('{0}', rules.maxLength);
            return result;
        }
        
        // Validar patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            result.valid = false;
            result.message = rules.patternMessage || this.errorMessages.pattern;
            return result;
        }
        
        // Validar que sea un número
        if (rules.number && isNaN(parseFloat(value))) {
            result.valid = false;
            result.message = this.errorMessages.number;
            return result;
        }
        
        // Validar que sea un entero
        if (rules.integer && (!Number.isInteger(Number(value)) || isNaN(Number(value)))) {
            result.valid = false;
            result.message = this.errorMessages.integer;
            return result;
        }
        
        // Validar coincidencia con otro campo
        if (rules.match) {
            const matchField = document.getElementById(rules.match);
            if (matchField && value !== matchField.value) {
                result.valid = false;
                result.message = this.errorMessages.match;
                return result;
            }
        }
        
        // Validar unicidad (requiere una función de verificación)
        if (rules.unique && typeof rules.uniqueCheck === 'function') {
            if (!rules.uniqueCheck(value)) {
                result.valid = false;
                result.message = rules.uniqueMessage || this.errorMessages.unique;
                return result;
            }
        }
        
        // Validación personalizada
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value, field);
            if (customResult !== true) {
                result.valid = false;
                result.message = customResult || 'Validación fallida';
                return result;
            }
        }
        
        return result;
    },
    
    /**
     * Muestra un mensaje de error para un campo
     * @param {HTMLElement} field - Campo con error
     * @param {string} message - Mensaje de error
     */
    showFieldError: function(field, message) {
        // Eliminar mensajes de error existentes
        this.clearFieldError(field);
        
        // Marcar el campo como inválido
        field.classList.add('is-invalid');
        
        // Crear elemento de mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        
        // Insertar mensaje después del campo
        if (field.parentNode) {
            field.parentNode.appendChild(errorElement);
        }
    },
    
    /**
     * Elimina el mensaje de error de un campo
     * @param {HTMLElement} field - Campo a limpiar
     */
    clearFieldError: function(field) {
        // Quitar clase de inválido
        field.classList.remove('is-invalid');
        
        // Eliminar mensaje de error si existe
        if (field.parentNode) {
            const errorElement = field.parentNode.querySelector('.form-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    },
    
    /**
     * Marca un campo como válido
     * @param {HTMLElement} field - Campo a marcar como válido
     */
    markFieldAsValid: function(field) {
        // Quitar clase de inválido y añadir clase de válido
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Eliminar mensaje de error si existe
        this.clearFieldError(field);
    },
    
    /**
     * Valida un formulario completo
     * @param {string} formId - ID del formulario a validar
     * @param {Object} validationRules - Reglas de validación para cada campo
     * @returns {boolean} - True si el formulario es válido, false si no
     */
    validateForm: function(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Sanitizar todo el formulario primero si está habilitado
        if (this.autoSanitize && typeof InputSanitizer !== 'undefined') {
            this._sanitizeForm(form, validationRules);
        }
        
        let isValid = true;
        
        // Recorrer todas las reglas y validar cada campo
        for (const fieldName in validationRules) {
            const field = form.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
            if (!field) continue;
            
            const rules = validationRules[fieldName];
            const result = this.validateField(field, rules);
            
            if (!result.valid) {
                this.showFieldError(field, result.message);
                isValid = false;
            } else {
                this.markFieldAsValid(field);
            }
        }
        
        return isValid;
    },
    
    /**
     * Configura la validación en tiempo real para un formulario
     * @param {string} formId - ID del formulario
     * @param {Object} validationRules - Reglas de validación para cada campo
     */
    setupLiveValidation: function(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Para cada campo con reglas, añadir listeners de eventos
        for (const fieldName in validationRules) {
            const field = form.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
            if (!field) continue;
            
            const rules = validationRules[fieldName];
            
            // Determinar el tipo de sanitización según las reglas
            let sanitizeType = 'string';
            if (rules.email) sanitizeType = 'email';
            else if (rules.url) sanitizeType = 'url';
            
            // Configurar sanitización en tiempo real si está habilitada
            if (this.autoSanitize && typeof InputSanitizer !== 'undefined') {
                // Sanitizar al escribir
                field.addEventListener('input', () => {
                    const sanitizedValue = this._sanitizeValue(field.value, sanitizeType);
                    if (field.value !== sanitizedValue) {
                        // Guardar la posición del cursor
                        const cursorPos = field.selectionStart;
                        field.value = sanitizedValue;
                        // Restaurar la posición del cursor si es posible
                        if (cursorPos <= sanitizedValue.length) {
                            field.setSelectionRange(cursorPos, cursorPos);
                        }
                    }
                });
            }
            
            // Validar al perder el foco
            field.addEventListener('blur', () => {
                const result = this.validateField(field, rules);
                if (!result.valid) {
                    this.showFieldError(field, result.message);
                } else {
                    this.markFieldAsValid(field);
                }
            });
            
            // Limpiar error al comenzar a escribir
            field.addEventListener('input', () => {
                this.clearFieldError(field);
                field.classList.remove('is-valid', 'is-invalid');
            });
        }
        
        // Validar todo el formulario al enviar
        form.addEventListener('submit', (e) => {
            const isValid = this.validateForm(formId, validationRules);
            if (!isValid) {
                e.preventDefault();
                
                // Mostrar mensaje de error general
                Components.showToast('Por favor, corrija los errores en el formulario', 'danger');
                
                // Hacer scroll al primer campo con error
                const firstErrorField = form.querySelector('.is-invalid');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
            }
        });
    },
    
    /**
     * Limpia todos los errores de un formulario
     * @param {string} formId - ID del formulario
     */
    clearFormErrors: function(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Limpiar todos los campos con errores
        const invalidFields = form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            this.clearFieldError(field);
        });
        
        // Quitar clases de validación
        const validatedFields = form.querySelectorAll('.is-valid, .is-invalid');
        validatedFields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
    },
    
    /**
     * Resetea un formulario y limpia todos los errores
     * @param {string} formId - ID del formulario
     */
    resetForm: function(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Resetear el formulario
        form.reset();
        
        // Limpiar errores
        this.clearFormErrors(formId);
    },
    
    /**
     * Validaciones específicas para el Sistema de Comedor Empresarial
     */
    
    /**
     * Valida si una fecha es un día laboral (lunes a viernes)
     * @param {Date|string} date - Fecha a validar
     * @returns {boolean} - True si es día laboral, false si no
     */
    isWorkDay: function(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (!(dateObj instanceof Date) || isNaN(dateObj)) return false;
        
        const day = dateObj.getDay();
        // 0 = domingo, 6 = sábado
        return day > 0 && day < 6;
    },
    
    /**
     * Valida si una fecha es futura
     * @param {Date|string} date - Fecha a validar
     * @returns {boolean} - True si es fecha futura, false si no
     */
    isFutureDate: function(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (!(dateObj instanceof Date) || isNaN(dateObj)) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dateObj >= today;
    },
    
    /**
     * Valida si el número de asistentes está dentro del límite permitido
     * @param {number} attendees - Número de asistentes
     * @param {number} maxAttendees - Límite máximo de asistentes
     * @returns {boolean} - True si está dentro del límite, false si no
     */
    isWithinAttendanceLimit: function(attendees, maxAttendees) {
        return parseInt(attendees) <= parseInt(maxAttendees);
    },
    
    /**
     * Valida un campo de fecha para el comedor empresarial
     * @param {HTMLElement} field - Campo a validar
     * @param {Object} rules - Reglas de validación adicionales
     * @returns {Object} - Resultado de la validación {valid: boolean, message: string}
     */
    validateMenuDate: function(field, rules = {}) {
        const value = field.value.trim();
        const result = { valid: true, message: '' };
        
        // Validar formato de fecha
        const dateObj = new Date(value);
        if (!(dateObj instanceof Date) || isNaN(dateObj)) {
            result.valid = false;
            result.message = this.errorMessages.date;
            return result;
        }
        
        // Validar que sea fecha futura si se requiere
        if (rules.futureDate && !this.isFutureDate(dateObj)) {
            result.valid = false;
            result.message = this.errorMessages.futureDate;
            return result;
        }
        
        // Validar que sea día laboral si se requiere
        if (rules.workDay && !this.isWorkDay(dateObj)) {
            result.valid = false;
            result.message = this.errorMessages.workDay;
            return result;
        }
        
        return result;
    },
    
    /**
     * Valida un campo de asistentes para el comedor empresarial
     * @param {HTMLElement} field - Campo a validar
     * @param {number} maxAttendees - Límite máximo de asistentes
     * @returns {Object} - Resultado de la validación {valid: boolean, message: string}
     */
    validateAttendance: function(field, maxAttendees) {
        const value = field.value.trim();
        const result = { valid: true, message: '' };
        
        // Validar que sea un número
        if (isNaN(parseInt(value))) {
            result.valid = false;
            result.message = this.errorMessages.number;
            return result;
        }
        
        // Validar que sea un entero positivo
        if (parseInt(value) < 0 || !Number.isInteger(Number(value))) {
            result.valid = false;
            result.message = this.errorMessages.integer;
            return result;
        }
        
        // Validar límite de asistentes
        if (!this.isWithinAttendanceLimit(value, maxAttendees)) {
            result.valid = false;
            result.message = this.errorMessages.attendanceLimit;
            return result;
        }
        
        return result;
    }
};

/**
 * Funciones de integración con componentes UI
 */

/**
 * Muestra un mensaje de error en un modal
 * @param {string} message - Mensaje de error
 * @param {string} title - Título del modal
 */
Validation.showErrorModal = function(message, title = 'Error de Validación') {
    // Verificar que Components esté disponible
    if (typeof Components === 'undefined') {
        console.error('El objeto Components no está disponible');
        return;
    }
    
    Components.showModal({
        id: 'validation-error-modal',
        title: title,
        content: `<div class="alert alert-danger">${message}</div>`,
        size: 'sm'
    });
};

/**
 * Muestra un mensaje de confirmación en un modal
 * @param {string} message - Mensaje de confirmación
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {string} title - Título del modal
 */
Validation.showConfirmationModal = function(message, onConfirm, title = 'Confirmar') {
    // Verificar que Components esté disponible
    if (typeof Components === 'undefined') {
        console.error('El objeto Components no está disponible');
        return;
    }
    
    Components.showConfirmDialog({
        title: title,
        message: message,
        onConfirm: onConfirm
    });
};

/**
 * Muestra un toast con el resultado de la validación
 * @param {boolean} isValid - Si la validación fue exitosa
 * @param {string} successMessage - Mensaje de éxito
 * @param {string} errorMessage - Mensaje de error
 */
Validation.showValidationToast = function(isValid, successMessage = 'Datos validados correctamente', errorMessage = 'Por favor, corrija los errores en el formulario') {
    // Verificar que Components esté disponible
    if (typeof Components === 'undefined') {
        console.error('El objeto Components no está disponible');
        return;
    }
    
    if (isValid) {
        Components.showToast(successMessage, 'success');
    } else {
        Components.showToast(errorMessage, 'danger');
    }
};

/**
 * Métodos privados para sanitización
 */

/**
 * Sanitiza un valor según el tipo especificado
 * @param {string} value - Valor a sanitizar
 * @param {string} type - Tipo de sanitización (string, email, url, etc.)
 * @returns {string} - Valor sanitizado
 * @private
 */
Validation._sanitizeValue = function(value, type = 'string') {
    // Si InputSanitizer no está disponible, devolver el valor original
    if (typeof InputSanitizer === 'undefined') {
        return value;
    }
    
    // Sanitizar según el tipo
    switch (type) {
        case 'email':
            return InputSanitizer.sanitizeEmail(value);
        case 'url':
            return InputSanitizer.sanitizeUrl(value);
        case 'html':
            return InputSanitizer.sanitizeHTML(value);
        case 'sql':
            return InputSanitizer.sanitizeForSQL(value);
        case 'string':
        default:
            return InputSanitizer.sanitizeString(value);
    }
};

/**
 * Sanitiza todos los campos de un formulario
 * @param {HTMLElement} form - Formulario a sanitizar
 * @param {Object} validationRules - Reglas de validación para determinar el tipo de sanitización
 * @private
 */
Validation._sanitizeForm = function(form, validationRules) {
    // Si InputSanitizer no está disponible, no hacer nada
    if (typeof InputSanitizer === 'undefined') {
        return;
    }
    
    // Para cada campo con reglas, aplicar sanitización
    for (const fieldName in validationRules) {
        const field = form.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
        if (!field) continue;
        
        const rules = validationRules[fieldName];
        
        // Determinar el tipo de sanitización según las reglas
        let sanitizeType = 'string';
        if (rules.email) sanitizeType = 'email';
        else if (rules.url) sanitizeType = 'url';
        
        // Sanitizar el valor
        field.value = this._sanitizeValue(field.value, sanitizeType);
    }
};

// Exportar el objeto Validation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}
