# Comedor Empresarial

Sistema de gestión para comedores empresariales que facilita la publicación de menús semanales, registro de coordinadores por departamento, confirmación de asistencia y generación de reportes.

## Características principales

- **Publicación de menús semanales**: Interfaz para que los administradores creen y publiquen menús semanales.
- **Gestión de coordinadores**: Registro y administración de coordinadores por departamento.
- **Confirmación de asistencia**: Sistema para que los coordinadores confirmen la cantidad de personas que asistirán cada día.
- **Reportes de confirmaciones**: Visualización de confirmaciones por día y departamento.
- **Respaldo de datos**: Exportación e importación de datos para respaldo.
- **Interfaz responsiva**: Diseño adaptable para escritorio y tablets.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript (vanilla, sin frameworks)
- LocalStorage para persistencia de datos

## Estructura del proyecto

```
comedor-esmpresarial/
├── index.html           # Página de inicio y acceso
├── admin.html           # Interfaz de administrador
├── coordinator.html     # Interfaz de coordinador
├── styles.css           # Estilos globales
├── js/
│   ├── admin.js         # Funcionalidades de administrador
│   ├── coordinator.js   # Funcionalidades de coordinador
│   ├── index.js         # Funcionalidades de la página de inicio
│   ├── models.js        # Modelos de datos
│   └── storage.js       # Utilidades de almacenamiento
└── scripts/
    └── PRD.txt          # Documento de requisitos
```

## Instalación y uso

Al ser una aplicación web que utiliza tecnologías estándar sin dependencias externas, no requiere un proceso de instalación complejo:

1. Clona o descarga este repositorio
2. Abre el archivo `index.html` en un navegador web moderno
3. Para acceder como administrador, simplemente navega a `admin.html`
4. Para acceder como coordinador, utiliza el código de acceso proporcionado por el administrador

## Roles de usuario

### Administrador

- Acceso a través de `admin.html`
- Puede crear y publicar menús semanales
- Gestiona coordinadores (crear, editar, eliminar)
- Visualiza reportes de confirmaciones
- Puede exportar e importar datos

### Coordinador

- Acceso a través de un código único de 6 caracteres
- Visualiza el menú semanal
- Confirma la cantidad de asistentes por día

## Guía de uso

### Para administradores

1. **Gestión de menús**:
   - Crea un nuevo menú especificando la fecha de inicio (lunes)
   - Agrega platillos para cada día y categoría
   - Guarda el menú para publicarlo

2. **Gestión de coordinadores**:
   - Registra coordinadores con nombre, correo, teléfono y departamento
   - El sistema genera automáticamente un código de acceso
   - Comparte el código con el coordinador correspondiente

3. **Visualización de confirmaciones**:
   - Revisa las confirmaciones por día y departamento
   - Utiliza los controles de navegación para ver diferentes semanas

4. **Respaldo de datos**:
   - Exporta todos los datos a un archivo JSON
   - Importa datos desde un archivo JSON previamente exportado

### Para coordinadores

1. **Acceso al sistema**:
   - Ingresa el código de acceso proporcionado por el administrador
   - El sistema te redirigirá a la interfaz de coordinador

2. **Visualización del menú**:
   - Revisa el menú semanal publicado por el administrador

3. **Confirmación de asistencia**:
   - Selecciona la semana correspondiente
   - Ingresa el número estimado de personas que asistirán cada día
   - Guarda la confirmación

## Almacenamiento de datos

La aplicación utiliza localStorage para almacenar todos los datos, organizados en las siguientes colecciones:

- `comedor_menus`: Menús semanales
- `comedor_coordinators`: Información de coordinadores
- `attendanceConfirmations`: Confirmaciones de asistencia
- `comedor_app_state`: Estado general de la aplicación

## Limitaciones

- Al utilizar localStorage, los datos están limitados a aproximadamente 5MB
- Los datos se almacenan en el navegador del usuario, por lo que no se comparten entre dispositivos
- No hay autenticación avanzada para el acceso de administrador

## Desarrollo futuro

Posibles mejoras para futuras versiones:

- Implementación de backend para almacenamiento centralizado
- Autenticación avanzada para administradores
- Notificaciones por correo electrónico
- Estadísticas avanzadas de asistencia
- Aplicación móvil para coordinadores

## Licencia

Este proyecto está disponible como software de código abierto bajo la licencia MIT.
