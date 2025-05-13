# Comedor Empresarial

Sistema de gestión para comedores empresariales que facilita la publicación de menús semanales (incluyendo formato de imagen), registro de coordinadores por departamento, confirmación de asistencia para la semana actual y próxima, y generación de reportes.

## Características principales

-   **Publicación de menús semanales**:
    -   Interfaz para que los administradores creen y publiquen menús semanales de forma detallada (platillo por platillo).
    -   Opción para subir una imagen del menú como alternativa o complemento al menú detallado.
-   **Gestión de coordinadores**: Registro y administración de coordinadores por departamento con códigos de acceso únicos.
-   **Confirmación de asistencia**:
    -   Sistema para que los coordinadores confirmen la cantidad de personas que asistirán cada día.
    -   Permite confirmar para la semana actual y la próxima semana.
-   **Reportes de confirmaciones**: Visualización de confirmaciones por día y departamento.
-   **Interfaz responsiva**: Diseño adaptable para escritorio y dispositivos móviles.
-   **Funcionalidad Offline**: Soporte básico para operaciones sin conexión gracias a la persistencia de Firebase.
-   **Sincronización en Tiempo Real**: Algunos datos (como el menú activo para coordinadores) se actualizan en tiempo real.

## Tecnologías utilizadas

-   HTML5
-   CSS3 (con Variables CSS)
-   JavaScript (Vanilla JS)
-   **Firebase**:
    -   **Firestore**: Como base de datos principal para menús, coordinadores, y confirmaciones.
    -   **Firebase Storage**: Para el almacenamiento de imágenes de menú.
    -   (Firebase Authentication no se usa actualmente para el login de admin/coordinador, se usan códigos de acceso).

## Estructura del proyecto

## Instalación y uso

1.  Asegúrate de tener configurado un proyecto de Firebase y reemplaza la configuración en `js/firebase-config.js` con los datos de tu proyecto.
2.  Habilita Firestore y Firebase Storage en tu consola de Firebase.
3.  Abre el archivo `index.html` en un navegador web moderno.
4.  **Acceso de Administrador:**
    *   Navega a `admin.html`.
    *   Ingresa el código maestro de administrador definido en `js/admin.js` (por defecto: `ADMIN728532` - ¡**CAMBIAR ESTO EN PRODUCCIÓN!**).
5.  **Acceso de Coordinador:**
    *   El administrador debe primero registrar al coordinador y proporcionarle el código de acceso generado.
    *   El coordinador ingresa este código en `index.html` o directamente en `coordinator.html`.

## Roles de usuario

### Administrador

-   Acceso a través de `admin.html` y un código maestro.
-   Puede crear y publicar menús semanales (detallados o con imagen).
-   Gestiona coordinadores (crear, editar, eliminar, generar códigos de acceso).
-   Visualiza reportes de confirmaciones de asistencia.
-   La funcionalidad de exportar/importar datos directamente desde la UI está deshabilitada para Firebase (se gestiona desde la consola de Firebase).

### Coordinador

-   Acceso a través de un código único de 6 caracteres.
-   Visualiza el menú semanal (imagen o detalles).
-   Confirma la cantidad de asistentes por día para la semana actual y la próxima.

## Guía de uso

### Para administradores

1.  **Gestión de menús**:
    *   Ve a la sección "Gestión de Menús".
    *   Crea un nuevo menú especificando el nombre y la fecha de inicio (lunes).
    *   Opcionalmente, sube una imagen para el menú.
    *   Define los platillos para cada día y categoría (si no se usa solo imagen) o simplemente asegúrate de que los días de la semana están generados (esto define los días activos para el coordinador).
    *   Guarda el menú para publicarlo.
2.  **Gestión de coordinadores**:
    *   Ve a la sección "Gestión de Usuarios".
    *   Registra coordinadores con nombre, correo, teléfono y departamento.
    *   El sistema genera automáticamente un código de acceso. Copia y comparte este código con el coordinador correspondiente.
3.  **Visualización de confirmaciones**:
    *   Ve a la sección "Reportes".
    *   Revisa las confirmaciones por día y departamento.
    *   Utiliza los controles de navegación para ver diferentes semanas.

### Para coordinadores

1.  **Acceso al sistema**:
    *   Ingresa el código de acceso proporcionado por el administrador en `index.html` o en el modal de `coordinator.html`.
2.  **Visualización del menú**:
    *   En la pestaña "Menú Semanal", revisa el menú vigente (puede ser una imagen o detalles).
3.  **Confirmación de asistencia**:
    *   Ve a la pestaña "Confirmaciones".
    *   Usa los botones de navegación para seleccionar la semana actual o la próxima semana.
    *   Ingresa el número estimado de personas que asistirán para los días habilitados (basado en el menú publicado por el admin).
    *   Guarda la confirmación. Los cambios se pueden actualizar.

## Almacenamiento de datos

La aplicación utiliza **Firebase Firestore** para almacenar todos los datos principales:

-   `menus`: Menús semanales (incluyendo `imageUrl` si existe).
-   `coordinators`: Información de coordinadores y sus códigos de acceso.
-   `attendanceConfirmations`: Confirmaciones de asistencia por coordinador y semana.
-   `appState`: (Potencialmente) Configuración general de la aplicación en Firestore.

**Firebase Storage** se utiliza para:
-   `menus_images/`: Almacenamiento de las imágenes de los menús.

## Limitaciones

-   El login de administrador se basa en un código fijo en el frontend, lo cual no es ideal para producción.
-   La gestión de imágenes borradas de Firebase Storage (cuando un menú se elimina o la imagen se cambia) no está completamente implementada.
-   Dependencia de los servicios de Firebase.

## Desarrollo futuro

Posibles mejoras para futuras versiones:

-   **Autenticación Avanzada:**
    -   Implementar Firebase Authentication para el login de administrador.
    -   Considerar Firebase Authentication para coordinadores (vía email/contraseña o proveedores OAuth) en lugar de códigos de acceso si se requiere mayor seguridad.
-   **Gestión Completa de Imágenes en Storage:** Asegurar borrado de imágenes huérfanas.
-   **Notificaciones:** Integrar notificaciones (ej. por email o push) para nuevos menús o recordatorios de confirmación.
-   **Roles y Permisos Más Granulares.**
-   **Estadísticas Avanzadas de Asistencia.**
-   **Optimización de Consultas a Firestore** para aplicaciones con grandes volúmenes de datos.

## Licencia

Este proyecto está disponible como software de código abierto bajo la licencia MIT.