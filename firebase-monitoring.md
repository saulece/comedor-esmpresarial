# Configuración de Monitoreo y Control de Presupuesto en Firebase

Este documento proporciona instrucciones para configurar el monitoreo y los controles de presupuesto en Firebase para el proyecto Comedor Empresarial.

## Configuración de Monitoreo

### Paso 1: Habilitar Firebase Performance Monitoring

1. En la consola de Firebase, selecciona tu proyecto "Comedor Empresarial"
2. En el menú lateral izquierdo, haz clic en "Performance"
3. Haz clic en "Comenzar"
4. Sigue las instrucciones para agregar el SDK de Performance a tu aplicación

### Paso 2: Configurar Firebase Crashlytics

1. En la consola de Firebase, selecciona tu proyecto
2. En el menú lateral izquierdo, haz clic en "Crashlytics"
3. Haz clic en "Comenzar"
4. Sigue las instrucciones para agregar el SDK de Crashlytics a tu aplicación

### Paso 3: Configurar Alertas de Firebase

1. En la consola de Firebase, selecciona tu proyecto
2. En el menú lateral izquierdo, haz clic en "Alertas"
3. Haz clic en "Crear nueva alerta"
4. Configura alertas para:
   - Picos en el uso de Firestore
   - Errores de autenticación
   - Caídas de la aplicación
   - Latencia de la aplicación

## Configuración de Control de Presupuesto

### Paso 1: Configurar Alertas de Facturación

1. En la consola de Google Cloud, selecciona tu proyecto
2. En el menú lateral izquierdo, navega a "Facturación"
3. Selecciona tu cuenta de facturación
4. Haz clic en "Presupuestos y alertas"
5. Haz clic en "Crear presupuesto"
6. Configura un presupuesto mensual para tu proyecto
7. Configura alertas en los siguientes umbrales:
   - 50% del presupuesto
   - 75% del presupuesto
   - 90% del presupuesto
   - 100% del presupuesto

### Paso 2: Configurar Límites de Cuota

1. En la consola de Google Cloud, selecciona tu proyecto
2. En el menú lateral izquierdo, navega a "IAM y administración" > "Cuotas"
3. Busca y selecciona los servicios de Firebase que estás utilizando
4. Configura límites de cuota para:
   - Operaciones de lectura de Firestore
   - Operaciones de escritura de Firestore
   - Operaciones de eliminación de Firestore
   - Almacenamiento de Firestore
   - Autenticación de usuarios

### Paso 3: Optimizar Costos

Para mantener los costos bajo control, implementa las siguientes prácticas:

1. **Optimizar consultas de Firestore**:
   - Utiliza consultas eficientes que minimicen el número de documentos leídos
   - Implementa paginación para grandes conjuntos de datos
   - Utiliza índices compuestos para consultas complejas

2. **Limitar operaciones de escritura**:
   - Agrupa múltiples operaciones de escritura en transacciones cuando sea posible
   - Evita actualizaciones innecesarias de documentos

3. **Implementar almacenamiento en caché**:
   - Utiliza el almacenamiento en caché del lado del cliente para reducir lecturas repetidas
   - Implementa estrategias de caché para datos que no cambian con frecuencia

4. **Monitorear el uso en tiempo real**:
   - Revisa regularmente los informes de uso en la consola de Firebase
   - Identifica patrones de uso inusuales que podrían indicar problemas

## Implementación en el Código

Para implementar el monitoreo en la aplicación Comedor Empresarial, agrega el siguiente código al archivo `js/firebase-monitoring.js`:

```javascript
/**
 * firebase-monitoring.js
 * Configuración de monitoreo para Firebase en el sistema de comedor empresarial
 */

import { getPerformance } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-performance.js";
import { app } from './firebase-config.js';

// Inicializar Performance Monitoring
const perf = getPerformance(app);

// Función para registrar eventos personalizados
function logCustomEvent(eventName, eventParams) {
  try {
    // Implementar registro de eventos personalizados
    console.log(`[Monitoring] Event: ${eventName}`, eventParams);
    
    // Aquí se podría integrar con Firebase Analytics si se habilita en el futuro
  } catch (error) {
    console.error('Error al registrar evento:', error);
  }
}

// Función para registrar errores
function logError(error, context = {}) {
  try {
    console.error(`[Monitoring] Error:`, error, context);
    
    // Aquí se podría integrar con Firebase Crashlytics si se habilita en el futuro
  } catch (err) {
    console.error('Error al registrar error:', err);
  }
}

// Función para iniciar una traza de rendimiento personalizada
function startPerformanceTrace(traceName) {
  try {
    return perf.trace(traceName);
  } catch (error) {
    console.error('Error al iniciar traza de rendimiento:', error);
    return null;
  }
}

// Exportar funciones de monitoreo
export {
  logCustomEvent,
  logError,
  startPerformanceTrace
};
```

## Verificación de la Configuración

Para verificar que el monitoreo y los controles de presupuesto están configurados correctamente:

1. Genera algunos eventos de prueba en la aplicación
2. Verifica que aparezcan en la consola de Firebase
3. Comprueba que las alertas se activen cuando se alcancen los umbrales configurados
4. Revisa los informes de uso y facturación para asegurarte de que los datos se estén registrando correctamente

## Recursos Adicionales

- [Documentación de Firebase Performance Monitoring](https://firebase.google.com/docs/performance)
- [Documentación de Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)
- [Guía de facturación de Google Cloud](https://cloud.google.com/billing/docs)
- [Optimización de costos de Firestore](https://firebase.google.com/docs/firestore/billing)
