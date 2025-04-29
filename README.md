# Sistema de Confirmación de Asistencia - Comedor Empresarial

Una aplicación web simple para gestionar confirmaciones de asistencia al comedor empresarial.

## Características

- Registro de confirmaciones de asistencia por fecha
- Visualización de confirmaciones registradas
- Filtrado de confirmaciones por fecha
- Resumen de total de asistentes
- Exportación de datos a formato JSON
- Importación de datos desde archivos JSON
- Almacenamiento local de datos (localStorage)
- Interfaz minimalista y fácil de usar
- Sin dependencias externas ni frameworks

## Uso

1. Abrir el archivo `index.html` en cualquier navegador moderno
2. Utilizar la navegación para alternar entre:
   - **Confirmar Asistencia**: Registrar nuevas confirmaciones
   - **Ver Confirmaciones**: Visualizar, filtrar y gestionar confirmaciones existentes
3. En la vista de confirmaciones, puede:
   - Filtrar por fecha específica
   - Ver el resumen de asistentes
   - Exportar los datos a un archivo JSON
   - Importar datos desde un archivo JSON
   - Eliminar registros individuales (con confirmación)

## Estructura del Proyecto

- `index.html`: Estructura de la aplicación y formularios
- `style.css`: Estilos básicos de la interfaz
- `script.js`: Lógica de la aplicación en JavaScript puro

## Almacenamiento de Datos

Todos los datos se almacenan localmente en el navegador utilizando localStorage. Los datos persisten incluso después de cerrar el navegador, pero se perderán si se limpia el caché del navegador.

Para evitar la pérdida de datos, se ha implementado una función de exportación a JSON que permite guardar una copia de seguridad de los datos. También se puede importar datos desde un archivo JSON previamente exportado, facilitando la transferencia de datos entre dispositivos o la restauración de copias de seguridad.

## Compatibilidad

Compatible con navegadores modernos que soporten JavaScript ES6 y localStorage.
