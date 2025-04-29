# Guía de Exportación e Importación de Datos

Este documento proporciona una guía completa para utilizar el módulo de exportación e importación de datos en el Sistema de Confirmación de Asistencias para Comedor Empresarial.

## Descripción General

El módulo de exportación e importación permite a los administradores:

- Exportar datos del sistema en diferentes formatos (Excel, CSV, JSON)
- Importar datos desde archivos externos
- Generar reportes detallados para análisis

Esta funcionalidad es especialmente útil para:
- Realizar copias de seguridad de los datos
- Transferir información entre diferentes instalaciones
- Analizar datos en herramientas externas como Excel
- Generar informes para la gerencia

## Acceso al Módulo

El módulo de exportación e importación está disponible en la sección de administrador:

1. Inicie sesión como administrador
2. En el panel de administración, haga clic en la pestaña "Exportar/Importar"

## Exportación de Datos

### Tipos de Datos Exportables

El sistema permite exportar los siguientes tipos de datos:

- **Menús Semanales**: Incluye todos los menús con sus platos por día
- **Confirmaciones de Asistencia**: Registros de asistencia por coordinador y día
- **Coordinadores**: Información de los usuarios coordinadores
- **Reportes de Asistencia**: Datos consolidados de asistencia para un menú específico

### Formatos de Exportación

Los datos pueden exportarse en tres formatos diferentes:

- **Excel (.xlsx)**: Formato de hoja de cálculo de Microsoft Excel, ideal para análisis detallado
- **CSV (.csv)**: Formato de texto con valores separados por comas, compatible con múltiples aplicaciones
- **JSON (.json)**: Formato de intercambio de datos, útil para integración con otras aplicaciones

### Pasos para Exportar Datos

1. Seleccione el tipo de datos que desea exportar en el menú desplegable
2. Si selecciona "Reporte de Asistencia", elija el menú específico del que desea generar el reporte
3. Haga clic en el botón del formato en el que desea exportar los datos (Excel, CSV o JSON)
4. El archivo se descargará automáticamente en su dispositivo

## Importación de Datos

### Tipos de Datos Importables

El sistema permite importar los siguientes tipos de datos:

- **Menús Semanales**
- **Confirmaciones de Asistencia**
- **Coordinadores**

### Formatos de Importación Soportados

Los datos pueden importarse desde los siguientes formatos:

- **Excel (.xlsx)**
- **CSV (.csv)**
- **JSON (.json)**

### Pasos para Importar Datos

1. Seleccione el tipo de datos que desea importar en el menú desplegable
2. Haga clic en "Seleccionar archivo" y elija el archivo que desea importar
3. Haga clic en el botón "Importar Datos"
4. Confirme la acción en el diálogo de confirmación

**Importante**: La importación reemplazará los datos existentes del tipo seleccionado. Asegúrese de tener una copia de seguridad antes de proceder.

## Estructura de los Datos Exportados

### Menús Semanales

Los menús semanales se exportan con la siguiente estructura:

| Campo | Descripción |
|-------|-------------|
| ID | Identificador único del menú |
| Semana | Fecha de inicio de la semana |
| Estado | Estado del menú (borrador, publicado, archivado) |
| Lunes - Principal | Plato principal del lunes |
| Lunes - Guarnición | Guarnición del lunes |
| Lunes - Bebida | Bebida del lunes |
| ... | (Igual para los demás días de la semana) |

### Confirmaciones de Asistencia

Las confirmaciones se exportan con la siguiente estructura:

| Campo | Descripción |
|-------|-------------|
| ID | Identificador único de la confirmación |
| Coordinador | Nombre del coordinador |
| Semana | Fecha de inicio de la semana |
| Lunes | Número de asistentes el lunes |
| Martes | Número de asistentes el martes |
| Miércoles | Número de asistentes el miércoles |
| Jueves | Número de asistentes el jueves |
| Viernes | Número de asistentes el viernes |
| Total | Total de asistentes en la semana |

### Coordinadores

Los datos de coordinadores se exportan con la siguiente estructura:

| Campo | Descripción |
|-------|-------------|
| ID | Identificador único del coordinador |
| Nombre | Nombre completo del coordinador |
| Usuario | Nombre de usuario |
| Máximo de Personas | Límite máximo de personas que puede confirmar |

### Reportes de Asistencia

Los reportes de asistencia se exportan con la siguiente estructura:

| Campo | Descripción |
|-------|-------------|
| Día | Nombre del día de la semana |
| Fecha | Fecha específica |
| Menú Principal | Plato principal del día |
| [Nombre Coordinador 1] | Asistentes confirmados por este coordinador |
| [Nombre Coordinador 2] | Asistentes confirmados por este coordinador |
| ... | (Columnas para cada coordinador) |
| Total | Total de asistentes para ese día |

## Requisitos para la Importación

Para que la importación funcione correctamente, los archivos deben cumplir con ciertos requisitos:

1. **Estructura de columnas**: Los archivos deben tener las mismas columnas que se generan en la exportación
2. **Tipos de datos**: Los valores deben ser del tipo correcto (números para asistentes, fechas en formato válido, etc.)
3. **Integridad referencial**: Los IDs deben ser válidos y no duplicados

## Solución de Problemas

### Problemas Comunes en la Exportación

- **No hay datos para exportar**: Asegúrese de que existan datos del tipo seleccionado en el sistema
- **Error al generar Excel**: Verifique que la librería SheetJS esté cargada correctamente
- **Archivo descargado corrupto**: Intente con un formato diferente (CSV en lugar de Excel)

### Problemas Comunes en la Importación

- **Formato de archivo no soportado**: Asegúrese de que el archivo tenga una de las extensiones soportadas (.xlsx, .csv, .json)
- **Error al procesar el archivo**: Verifique que el archivo tenga la estructura correcta
- **Datos no visibles después de importar**: Actualice la página después de la importación

## Consideraciones de Seguridad

- Los datos exportados pueden contener información sensible. Manéjelos con cuidado.
- Realice siempre una copia de seguridad antes de importar datos nuevos.
- La funcionalidad de importación está disponible solo para administradores.

## Integración con Otras Herramientas

Los datos exportados pueden utilizarse en diversas herramientas:

- **Excel/Google Sheets**: Para análisis detallado y generación de gráficos
- **Power BI/Tableau**: Para visualizaciones avanzadas
- **Sistemas de gestión de inventario**: Para planificación de compras basada en asistencia

## Ejemplo de Uso: Análisis de Tendencias

1. Exporte reportes de asistencia de varias semanas en formato Excel
2. Combine los datos en una sola hoja de cálculo
3. Cree gráficos para visualizar tendencias de asistencia por día de la semana
4. Identifique patrones para optimizar la planificación de menús

## Limitaciones Actuales

- La importación de datos está en fase de desarrollo y algunas funcionalidades pueden estar limitadas
- No se soporta la importación parcial (solo reemplazo completo)
- El tamaño máximo de archivo para importación depende del navegador utilizado
