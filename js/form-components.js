/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Componentes de Formulario
 * 
 * Este módulo proporciona componentes específicos para formularios
 * utilizando la nueva arquitectura basada en componentes.
 */

const FormComponents = {
  // Inicializa y registra todos los componentes de formulario
  init: function() {
    if (typeof ComponentSystem === 'undefined') {
      console.error('[FormComponents] ComponentSystem no está disponible');
      return;
    }
    
    console.info('[FormComponents] Inicializando componentes de formulario');
    
    // Registrar todos los componentes
    this.registerAll();
  },
  
  // Registra todos los componentes en el sistema
  registerAll: function() {
    // Componentes de formulario
    ComponentSystem.register('FormGroup', this.FormGroup);
    ComponentSystem.register('Input', this.Input);
    ComponentSystem.register('Select', this.Select);
    ComponentSystem.register('Checkbox', this.Checkbox);
    ComponentSystem.register('Radio', this.Radio);
    ComponentSystem.register('Button', this.Button);
    ComponentSystem.register('FormValidator', this.FormValidator);
    
    console.info('[FormComponents] Componentes de formulario registrados');
  },
  
  // Componente FormGroup (contenedor de campos de formulario)
  FormGroup: {
    name: 'FormGroup',
    
    render: function(el, props, state) {
      const { label, htmlFor, helpText, error, className, inline } = props;
      
      el.className = `form-group ${error ? 'has-error' : ''} ${inline ? 'form-group-inline' : ''} ${className || ''}`;
      
      let html = '';
      
      if (label) {
        html += `<label ${htmlFor ? `for="${htmlFor}"` : ''}>${label}</label>`;
      }
      
      // El contenido (input, select, etc.) se insertará como children
      html += `<div class="form-control-container">${props.children || ''}</div>`;
      
      if (helpText) {
        html += `<small class="form-text text-muted">${helpText}</small>`;
      }
      
      if (error) {
        html += `<div class="invalid-feedback">${error}</div>`;
      }
      
      el.innerHTML = html;
    }
  },
  
  // Componente Input
  Input: {
    name: 'Input',
    
    render: function(el, props, state) {
      const { 
        type, id, name, value, placeholder, required, disabled, readOnly, 
        min, max, step, pattern, className, autocomplete, autofocus,
        onChange, onFocus, onBlur, onKeyDown, onKeyUp, onKeyPress
      } = props;
      
      el.className = `input-component ${className || ''}`;
      
      const inputType = type || 'text';
      const inputValue = value !== undefined ? value : (state.value || '');
      
      // Construir atributos del input
      const attributes = [
        `type="${inputType}"`,
        id ? `id="${id}"` : '',
        name ? `name="${name}"` : '',
        `value="${inputValue}"`,
        placeholder ? `placeholder="${placeholder}"` : '',
        required ? 'required' : '',
        disabled ? 'disabled' : '',
        readOnly ? 'readonly' : '',
        min !== undefined ? `min="${min}"` : '',
        max !== undefined ? `max="${max}"` : '',
        step !== undefined ? `step="${step}"` : '',
        pattern ? `pattern="${pattern}"` : '',
        autocomplete ? `autocomplete="${autocomplete}"` : '',
        autofocus ? 'autofocus' : ''
      ].filter(Boolean).join(' ');
      
      el.innerHTML = `<input class="form-control" ${attributes}>`;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.value = props.value || '';
    },
    
    afterRender: function(el, props, state) {
      const input = el.querySelector('input');
      
      if (!input) return;
      
      // Configurar eventos
      if (typeof props.onChange === 'function') {
        input.addEventListener('input', (e) => {
          state.value = e.target.value;
          props.onChange(e);
        });
      } else {
        // Actualizar estado aunque no haya callback
        input.addEventListener('input', (e) => {
          state.value = e.target.value;
        });
      }
      
      // Eventos adicionales
      if (typeof props.onFocus === 'function') {
        input.addEventListener('focus', props.onFocus);
      }
      
      if (typeof props.onBlur === 'function') {
        input.addEventListener('blur', props.onBlur);
      }
      
      if (typeof props.onKeyDown === 'function') {
        input.addEventListener('keydown', props.onKeyDown);
      }
      
      if (typeof props.onKeyUp === 'function') {
        input.addEventListener('keyup', props.onKeyUp);
      }
      
      if (typeof props.onKeyPress === 'function') {
        input.addEventListener('keypress', props.onKeyPress);
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      const input = el.querySelector('input');
      if (input) {
        input.removeEventListener('input', null);
        input.removeEventListener('focus', null);
        input.removeEventListener('blur', null);
        input.removeEventListener('keydown', null);
        input.removeEventListener('keyup', null);
        input.removeEventListener('keypress', null);
      }
    }
  },
  
  // Componente Select
  Select: {
    name: 'Select',
    
    render: function(el, props, state) {
      const { 
        id, name, options, value, placeholder, required, disabled, 
        multiple, size, className, onChange, onFocus, onBlur
      } = props;
      
      el.className = `select-component ${className || ''}`;
      
      // Construir atributos del select
      const attributes = [
        id ? `id="${id}"` : '',
        name ? `name="${name}"` : '',
        required ? 'required' : '',
        disabled ? 'disabled' : '',
        multiple ? 'multiple' : '',
        size ? `size="${size}"` : ''
      ].filter(Boolean).join(' ');
      
      let html = `<select class="form-control" ${attributes}>`;
      
      // Opción de placeholder
      if (placeholder) {
        html += `<option value="" ${!value ? 'selected' : ''} disabled>${placeholder}</option>`;
      }
      
      // Opciones
      if (options && Array.isArray(options)) {
        options.forEach(option => {
          if (typeof option === 'object') {
            const isSelected = multiple && Array.isArray(value) 
              ? value.includes(option.value)
              : value === option.value;
            
            html += `<option value="${option.value}" ${isSelected ? 'selected' : ''}>${option.label}</option>`;
          } else {
            const isSelected = multiple && Array.isArray(value)
              ? value.includes(option)
              : value === option;
            
            html += `<option value="${option}" ${isSelected ? 'selected' : ''}>${option}</option>`;
          }
        });
      }
      
      html += `</select>`;
      
      el.innerHTML = html;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.value = props.value || (props.multiple ? [] : '');
    },
    
    afterRender: function(el, props, state) {
      const select = el.querySelector('select');
      
      if (!select) return;
      
      // Configurar eventos
      if (typeof props.onChange === 'function') {
        select.addEventListener('change', (e) => {
          if (props.multiple) {
            // Para selects múltiples, obtener array de valores seleccionados
            const selectedOptions = Array.from(e.target.selectedOptions);
            state.value = selectedOptions.map(option => option.value);
          } else {
            state.value = e.target.value;
          }
          
          props.onChange(e);
        });
      } else {
        // Actualizar estado aunque no haya callback
        select.addEventListener('change', (e) => {
          if (props.multiple) {
            const selectedOptions = Array.from(e.target.selectedOptions);
            state.value = selectedOptions.map(option => option.value);
          } else {
            state.value = e.target.value;
          }
        });
      }
      
      // Eventos adicionales
      if (typeof props.onFocus === 'function') {
        select.addEventListener('focus', props.onFocus);
      }
      
      if (typeof props.onBlur === 'function') {
        select.addEventListener('blur', props.onBlur);
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      const select = el.querySelector('select');
      if (select) {
        select.removeEventListener('change', null);
        select.removeEventListener('focus', null);
        select.removeEventListener('blur', null);
      }
    }
  },
  
  // Componente Checkbox
  Checkbox: {
    name: 'Checkbox',
    
    render: function(el, props, state) {
      const { 
        id, name, label, checked, value, disabled, 
        className, onChange, inline
      } = props;
      
      el.className = `checkbox-component ${inline ? 'form-check-inline' : 'form-check'} ${className || ''}`;
      
      // Construir atributos del checkbox
      const attributes = [
        id ? `id="${id}"` : '',
        name ? `name="${name}"` : '',
        value !== undefined ? `value="${value}"` : '',
        checked || state.checked ? 'checked' : '',
        disabled ? 'disabled' : ''
      ].filter(Boolean).join(' ');
      
      el.innerHTML = `
        <label class="form-check-label">
          <input type="checkbox" class="form-check-input" ${attributes}>
          ${label || ''}
        </label>
      `;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.checked = props.checked || false;
    },
    
    afterRender: function(el, props, state) {
      const checkbox = el.querySelector('input[type="checkbox"]');
      
      if (!checkbox) return;
      
      // Configurar eventos
      if (typeof props.onChange === 'function') {
        checkbox.addEventListener('change', (e) => {
          state.checked = e.target.checked;
          props.onChange(e);
        });
      } else {
        // Actualizar estado aunque no haya callback
        checkbox.addEventListener('change', (e) => {
          state.checked = e.target.checked;
        });
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.removeEventListener('change', null);
      }
    }
  },
  
  // Componente Radio
  Radio: {
    name: 'Radio',
    
    render: function(el, props, state) {
      const { 
        id, name, label, checked, value, disabled, 
        className, onChange, inline
      } = props;
      
      el.className = `radio-component ${inline ? 'form-check-inline' : 'form-check'} ${className || ''}`;
      
      // Construir atributos del radio
      const attributes = [
        id ? `id="${id}"` : '',
        name ? `name="${name}"` : '',
        value !== undefined ? `value="${value}"` : '',
        checked || state.checked ? 'checked' : '',
        disabled ? 'disabled' : ''
      ].filter(Boolean).join(' ');
      
      el.innerHTML = `
        <label class="form-check-label">
          <input type="radio" class="form-check-input" ${attributes}>
          ${label || ''}
        </label>
      `;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.checked = props.checked || false;
    },
    
    afterRender: function(el, props, state) {
      const radio = el.querySelector('input[type="radio"]');
      
      if (!radio) return;
      
      // Configurar eventos
      if (typeof props.onChange === 'function') {
        radio.addEventListener('change', (e) => {
          state.checked = e.target.checked;
          props.onChange(e);
        });
      } else {
        // Actualizar estado aunque no haya callback
        radio.addEventListener('change', (e) => {
          state.checked = e.target.checked;
        });
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      const radio = el.querySelector('input[type="radio"]');
      if (radio) {
        radio.removeEventListener('change', null);
      }
    }
  },
  
  // Componente Button
  Button: {
    name: 'Button',
    
    render: function(el, props, state) {
      const { 
        type, id, text, icon, variant, size, disabled, 
        className, onClick, block, outline
      } = props;
      
      const buttonType = type || 'button';
      const buttonVariant = variant || 'primary';
      const buttonSize = size ? `btn-${size}` : '';
      
      const classes = [
        'btn',
        outline ? `btn-outline-${buttonVariant}` : `btn-${buttonVariant}`,
        buttonSize,
        block ? 'btn-block' : '',
        className || '',
        state.loading ? 'btn-loading' : ''
      ].filter(Boolean).join(' ');
      
      // Construir atributos del botón
      const attributes = [
        `type="${buttonType}"`,
        id ? `id="${id}"` : '',
        disabled || state.loading ? 'disabled' : ''
      ].filter(Boolean).join(' ');
      
      let buttonContent = '';
      
      if (state.loading) {
        buttonContent = `
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>${props.loadingText || 'Cargando...'}</span>
        `;
      } else {
        buttonContent = `
          ${icon ? `<i class="${icon}"></i> ` : ''}
          <span>${text || 'Botón'}</span>
        `;
      }
      
      el.innerHTML = `<button class="${classes}" ${attributes}>${buttonContent}</button>`;
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.loading = props.loading || false;
    },
    
    afterRender: function(el, props, state) {
      const button = el.querySelector('button');
      
      if (!button) return;
      
      // Configurar eventos
      if (typeof props.onClick === 'function') {
        button.addEventListener('click', (e) => {
          // Si está en estado de carga, no ejecutar onClick
          if (state.loading) return;
          
          props.onClick(e);
        });
      }
    },
    
    onDestroy: function(el, state) {
      // Limpiar event listeners
      const button = el.querySelector('button');
      if (button) {
        button.removeEventListener('click', null);
      }
    },
    
    // Métodos adicionales
    setLoading: function(el, state, isLoading) {
      state.loading = isLoading;
      ComponentSystem.updateComponentState(el.dataset.componentId, { loading: isLoading });
    }
  },
  
  // Componente FormValidator (validación de formularios)
  FormValidator: {
    name: 'FormValidator',
    
    render: function(el, props, state) {
      // Este componente no renderiza nada visible
      // Solo proporciona funcionalidad de validación
      el.style.display = 'none';
    },
    
    onInit: function(el, props, state) {
      // Inicializar estado
      state.formElement = null;
      state.validationRules = props.rules || {};
      state.errors = {};
      state.isValid = true;
      
      // Buscar el formulario
      if (props.formId) {
        state.formElement = document.getElementById(props.formId);
      } else if (props.formSelector) {
        state.formElement = document.querySelector(props.formSelector);
      }
      
      // Configurar validación
      if (state.formElement) {
        this._setupValidation(el, props, state);
      }
    },
    
    _setupValidation: function(el, props, state) {
      // Prevenir envío de formulario si hay validación personalizada
      state.formElement.addEventListener('submit', (e) => {
        // Validar el formulario
        const validationResult = this.validate(el, state);
        
        // Si hay errores, prevenir envío
        if (!validationResult.isValid) {
          e.preventDefault();
          
          // Mostrar errores
          this._showErrors(state.formElement, validationResult.errors);
          
          // Ejecutar callback de error si existe
          if (typeof props.onError === 'function') {
            props.onError(validationResult.errors);
          }
        } else {
          // Ejecutar callback de éxito si existe
          if (typeof props.onSuccess === 'function') {
            // Si el callback devuelve false, prevenir envío
            const shouldContinue = props.onSuccess();
            if (shouldContinue === false) {
              e.preventDefault();
            }
          }
        }
      });
      
      // Validación en tiempo real si está habilitada
      if (props.liveValidation) {
        // Validar campos al perder el foco
        state.formElement.addEventListener('blur', (e) => {
          if (e.target.name && state.validationRules[e.target.name]) {
            const fieldValue = e.target.value;
            const fieldRules = state.validationRules[e.target.name];
            
            // Validar campo individual
            const fieldErrors = this._validateField(fieldValue, fieldRules);
            
            // Actualizar errores
            if (fieldErrors.length > 0) {
              state.errors[e.target.name] = fieldErrors[0];
            } else {
              delete state.errors[e.target.name];
            }
            
            // Mostrar/ocultar error para este campo
            this._showFieldError(state.formElement, e.target.name, fieldErrors[0]);
          }
        }, true);
      }
    },
    
    validate: function(el, state) {
      if (!state.formElement) {
        return { isValid: false, errors: { form: 'Formulario no encontrado' } };
      }
      
      const formData = new FormData(state.formElement);
      const errors = {};
      
      // Validar cada campo según las reglas
      for (const [fieldName, rules] of Object.entries(state.validationRules)) {
        const fieldValue = formData.get(fieldName);
        const fieldErrors = this._validateField(fieldValue, rules);
        
        if (fieldErrors.length > 0) {
          errors[fieldName] = fieldErrors[0]; // Solo guardamos el primer error
        }
      }
      
      const isValid = Object.keys(errors).length === 0;
      
      // Actualizar estado
      state.errors = errors;
      state.isValid = isValid;
      
      return { isValid, errors };
    },
    
    _validateField: function(value, rules) {
      const errors = [];
      
      // Aplicar cada regla de validación
      for (const rule of rules) {
        if (typeof rule === 'function') {
          // Regla personalizada como función
          const error = rule(value);
          if (error) {
            errors.push(error);
          }
        } else if (typeof rule === 'object') {
          // Regla como objeto { type, message, ... }
          switch (rule.type) {
            case 'required':
              if (!value || value.trim() === '') {
                errors.push(rule.message || 'Este campo es obligatorio');
              }
              break;
              
            case 'email':
              if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push(rule.message || 'Email inválido');
              }
              break;
              
            case 'minLength':
              if (value && value.length < rule.value) {
                errors.push(rule.message || `Mínimo ${rule.value} caracteres`);
              }
              break;
              
            case 'maxLength':
              if (value && value.length > rule.value) {
                errors.push(rule.message || `Máximo ${rule.value} caracteres`);
              }
              break;
              
            case 'pattern':
              if (value && !new RegExp(rule.pattern).test(value)) {
                errors.push(rule.message || 'Formato inválido');
              }
              break;
              
            case 'min':
              if (value && parseFloat(value) < rule.value) {
                errors.push(rule.message || `Valor mínimo: ${rule.value}`);
              }
              break;
              
            case 'max':
              if (value && parseFloat(value) > rule.value) {
                errors.push(rule.message || `Valor máximo: ${rule.value}`);
              }
              break;
          }
        }
      }
      
      return errors;
    },
    
    _showErrors: function(formElement, errors) {
      // Limpiar errores anteriores
      const errorElements = formElement.querySelectorAll('.invalid-feedback');
      errorElements.forEach(el => el.remove());
      
      const invalidFields = formElement.querySelectorAll('.is-invalid');
      invalidFields.forEach(el => el.classList.remove('is-invalid'));
      
      // Mostrar nuevos errores
      for (const [fieldName, errorMessage] of Object.entries(errors)) {
        this._showFieldError(formElement, fieldName, errorMessage);
      }
    },
    
    _showFieldError: function(formElement, fieldName, errorMessage) {
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      
      if (!field) return;
      
      if (errorMessage) {
        // Mostrar error
        field.classList.add('is-invalid');
        
        // Buscar contenedor del campo
        const fieldContainer = field.closest('.form-group') || field.parentNode;
        
        // Verificar si ya existe un mensaje de error
        let errorEl = fieldContainer.querySelector('.invalid-feedback');
        
        if (!errorEl) {
          // Crear elemento de error
          errorEl = document.createElement('div');
          errorEl.className = 'invalid-feedback';
          fieldContainer.appendChild(errorEl);
        }
        
        errorEl.textContent = errorMessage;
      } else {
        // Quitar error
        field.classList.remove('is-invalid');
        
        // Buscar y eliminar mensaje de error
        const fieldContainer = field.closest('.form-group') || field.parentNode;
        const errorEl = fieldContainer.querySelector('.invalid-feedback');
        
        if (errorEl) {
          errorEl.remove();
        }
      }
    }
  }
};

// Exportar el objeto FormComponents
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormComponents;
}
