# Guía de Componentes y Validación para el Sistema de Comedor Empresarial

Esta documentación proporciona una guía completa para utilizar los módulos de componentes UI y validación de formularios en el Sistema de Confirmación de Asistencias para Comedor Empresarial.

## Módulo de Componentes UI

El módulo de componentes (`components.js`) proporciona elementos de interfaz de usuario reutilizables que mantienen una apariencia consistente en toda la aplicación.

### Alertas

```javascript
// Crear una alerta
const alertElement = Components.createAlert(
    'Operación completada con éxito', // mensaje
    'success',                        // tipo: 'success', 'warning', 'danger', 'info'
    true,                             // dismissible (cerrable)
    5000                              // autoClose (ms, 0 = no cerrar)
);
someContainer.appendChild(alertElement);

// Mostrar alerta en un contenedor específico
Components.showAlert(
    'Ha ocurrido un error',           // mensaje
    'danger',                         // tipo
    'error-container',                // ID del contenedor
    true,                             // dismissible
    0                                 // autoClose
);
```

### Modales

```javascript
// Crear y mostrar un modal
Components.showModal({
    id: 'example-modal',              // ID único para el modal
    title: 'Título del Modal',        // Título
    content: '<p>Contenido HTML</p>', // Contenido HTML
    footer: '<button>Aceptar</button>', // Footer HTML (opcional)
    size: 'md',                       // Tamaño: 'sm', 'md', 'lg'
    backdrop: true,                   // Cerrar al hacer clic fuera
    closeButton: true                 // Mostrar botón de cierre
});

// Abrir/cerrar modal existente
Components.openModal('example-modal');
Components.closeModal('example-modal');

// Diálogo de confirmación
Components.showConfirmDialog({
    title: 'Confirmar acción',        // Título
    message: '¿Está seguro?',         // Mensaje
    confirmText: 'Sí',                // Texto del botón confirmar
    cancelText: 'No',                 // Texto del botón cancelar
    onConfirm: function() {           // Función al confirmar
        // Código al confirmar
    },
    onCancel: function() {            // Función al cancelar
        // Código al cancelar
    }
});
```

### Notificaciones (Toasts)

```javascript
// Mostrar una notificación toast
Components.showToast(
    'Cambios guardados correctamente', // mensaje
    'success',                         // tipo: 'success', 'warning', 'danger', 'info'
    3000                               // duración en ms (0 = no desaparece)
);
```

### Tarjetas

```javascript
// Crear una tarjeta
const cardElement = Components.createCard({
    title: 'Título de la tarjeta',     // Título
    content: '<p>Contenido</p>',       // Contenido HTML
    footer: 'Pie de tarjeta',          // Footer (opcional)
    headerClass: 'bg-primary',         // Clase CSS para el header
    bodyClass: '',                     // Clase CSS para el body
    footerClass: ''                    // Clase CSS para el footer
});
container.appendChild(cardElement);
```

### Tablas

```javascript
// Crear una tabla
const tableElement = Components.createTable({
    headers: ['Nombre', 'Email', 'Rol'], // Encabezados
    rows: [                             // Filas
        ['Juan Pérez', 'juan@example.com', 'Admin'],
        ['María López', 'maria@example.com', 'Coordinador']
    ],
    tableClass: 'table-striped',        // Clase CSS para la tabla
    responsive: true                    // Hacer la tabla responsive
});
container.appendChild(tableElement);
```

## Módulo de Validación

El módulo de validación (`validation.js`) proporciona funciones para validar formularios y mostrar mensajes de error de manera consistente.

### Validación Básica

```javascript
// Configurar reglas de validación
const validationRules = {
    'field-name': {
        required: true,                 // Campo obligatorio
        minLength: 3,                   // Longitud mínima
        maxLength: 50                   // Longitud máxima
    },
    'field-email': {
        required: true,
        email: true                     // Validar formato de email
    },
    'field-age': {
        required: true,
        number: true,                   // Debe ser un número
        min: 18,                        // Valor mínimo
        max: 100                        // Valor máximo
    }
};

// Validar un formulario completo
const isValid = Validation.validateForm('form-id', validationRules);

// Configurar validación en tiempo real
Validation.setupLiveValidation('form-id', validationRules);

// Limpiar errores y resetear formulario
Validation.clearFormErrors('form-id');
Validation.resetForm('form-id');
```

### Validaciones Específicas para el Comedor Empresarial

```javascript
// Validar si una fecha es día laboral (lunes a viernes)
const isWorkDay = Validation.isWorkDay(dateObj);

// Validar si una fecha es futura
const isFuture = Validation.isFutureDate(dateObj);

// Validar si el número de asistentes está dentro del límite
const isWithinLimit = Validation.isWithinAttendanceLimit(attendees, maxAttendees);

// Validar un campo de fecha para el menú
const dateResult = Validation.validateMenuDate(dateField, {
    futureDate: true,   // Debe ser fecha futura
    workDay: true       // Debe ser día laboral
});

// Validar un campo de asistentes
const attendanceResult = Validation.validateAttendance(attendanceField, maxAttendees);
```

### Integración con Componentes UI

```javascript
// Mostrar toast con resultado de validación
Validation.showValidationToast(
    isValid,                           // resultado de la validación
    'Datos guardados correctamente',   // mensaje de éxito
    'Por favor, corrija los errores'   // mensaje de error
);

// Mostrar error en modal
Validation.showErrorModal(
    'El número de asistentes excede el límite permitido',
    'Error de Validación'
);

// Mostrar confirmación
Validation.showConfirmationModal(
    '¿Está seguro de confirmar 15 asistentes?',
    function() {
        // Código al confirmar
    },
    'Confirmar Asistencia'
);
```

## Ejemplos de Uso en el Sistema de Comedor Empresarial

### Validación de Menú Semanal

```javascript
// Reglas para validar un menú diario
const menuValidationRules = {
    'menu-date': {
        required: true,
        custom: function(value) {
            const dateObj = new Date(value);
            
            // Validar que sea fecha futura
            if (!Validation.isFutureDate(dateObj)) {
                return Validation.errorMessages.futureDate;
            }
            
            // Validar que sea día laboral
            if (!Validation.isWorkDay(dateObj)) {
                return Validation.errorMessages.workDay;
            }
            
            return true;
        }
    },
    'menu-main': {
        required: true,
        minLength: 3
    }
};

// Validar formulario de menú
document.getElementById('menu-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isValid = Validation.validateForm('menu-form', menuValidationRules);
    
    if (isValid) {
        // Guardar menú
        Components.showToast('Menú guardado correctamente', 'success');
    }
});
```

### Validación de Confirmación de Asistencia

```javascript
// Reglas para validar confirmación de asistencia
const attendanceValidationRules = {
    'coordinator': {
        required: true
    },
    'attendance-date': {
        required: true,
        custom: function(value) {
            const dateObj = new Date(value);
            
            // Validar que sea fecha futura
            if (!Validation.isFutureDate(dateObj)) {
                return Validation.errorMessages.futureDate;
            }
            
            // Validar que sea día laboral
            if (!Validation.isWorkDay(dateObj)) {
                return Validation.errorMessages.workDay;
            }
            
            return true;
        }
    },
    'attendance-count': {
        required: true,
        integer: true,
        min: 0,
        custom: function(value, field) {
            const coordinator = document.getElementById('coordinator').value;
            let maxAttendees = getCoordinatorMaxAttendees(coordinator);
            
            // Validar límite de asistentes
            if (!Validation.isWithinAttendanceLimit(value, maxAttendees)) {
                return `El número de asistentes no puede ser mayor a ${maxAttendees}`;
            }
            
            return true;
        }
    }
};

// Validar formulario de asistencia
document.getElementById('attendance-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isValid = Validation.validateForm('attendance-form', attendanceValidationRules);
    
    if (isValid) {
        // Confirmar asistencia
        Validation.showConfirmationModal(
            '¿Está seguro de confirmar esta asistencia?',
            function() {
                // Guardar confirmación
                Components.showToast('Asistencia confirmada correctamente', 'success');
            }
        );
    }
});
```

## Consideraciones Importantes

1. **Rendimiento**: Los componentes están diseñados para ser ligeros y no depender de frameworks externos.

2. **Compatibilidad móvil**: Todos los componentes son totalmente responsivos y optimizados para dispositivos móviles.

3. **Persistencia**: La validación no interfiere con la persistencia en localStorage implementada en el sistema.

4. **Extensibilidad**: Tanto los componentes como las validaciones pueden extenderse fácilmente para casos específicos.

5. **Integración**: Los módulos están diseñados para trabajar juntos de manera óptima, pero también pueden usarse de forma independiente.
