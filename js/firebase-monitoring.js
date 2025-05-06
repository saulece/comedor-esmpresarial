/**
 * firebase-monitoring.js
 * Configuración de monitoreo para Firebase en el sistema de comedor empresarial
 * Este módulo proporciona funciones para monitorear el rendimiento y los errores
 * de la aplicación, así como para controlar el uso de recursos de Firebase.
 */

import { app } from './firebase-config.js';

// Objeto para almacenar trazas de rendimiento
const performanceTraces = {};

// Contador de operaciones para monitorear el uso
const operationCounters = {
  reads: 0,
  writes: 0,
  deletes: 0,
  auth: 0
};

// Límites configurables para alertas de uso
const usageLimits = {
  reads: 50000,   // Número máximo de lecturas por día
  writes: 20000,  // Número máximo de escrituras por día
  deletes: 10000, // Número máximo de eliminaciones por día
  auth: 1000      // Número máximo de operaciones de autenticación por día
};

/**
 * Inicializa el sistema de monitoreo
 */
function initMonitoring() {
  console.log('[Monitoring] Sistema de monitoreo inicializado');
  
  // Resetear contadores diariamente
  resetCountersDaily();
  
  // Registrar inicio de la aplicación
  logCustomEvent('app_start', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}

/**
 * Resetea los contadores de operaciones diariamente
 */
function resetCountersDaily() {
  // Obtener la fecha actual
  const now = new Date();
  const today = now.toDateString();
  
  // Verificar si ya se resetearon los contadores hoy
  const lastReset = localStorage.getItem('monitoring_last_reset');
  
  if (lastReset !== today) {
    // Resetear contadores
    operationCounters.reads = 0;
    operationCounters.writes = 0;
    operationCounters.deletes = 0;
    operationCounters.auth = 0;
    
    // Guardar fecha de último reset
    localStorage.setItem('monitoring_last_reset', today);
    
    console.log('[Monitoring] Contadores reseteados para el nuevo día');
  }
}

/**
 * Registra un evento personalizado
 * @param {string} eventName - Nombre del evento
 * @param {Object} eventParams - Parámetros del evento
 */
function logCustomEvent(eventName, eventParams = {}) {
  try {
    console.log(`[Monitoring] Event: ${eventName}`, eventParams);
    
    // Guardar evento en localStorage para análisis offline
    const events = JSON.parse(localStorage.getItem('monitoring_events') || '[]');
    events.push({
      name: eventName,
      params: eventParams,
      timestamp: new Date().toISOString()
    });
    
    // Limitar a los últimos 100 eventos para no sobrecargar localStorage
    if (events.length > 100) {
      events.shift();
    }
    
    localStorage.setItem('monitoring_events', JSON.stringify(events));
  } catch (error) {
    console.error('Error al registrar evento:', error);
  }
}

/**
 * Registra un error
 * @param {Error} error - Error a registrar
 * @param {Object} context - Contexto adicional del error
 */
function logError(error, context = {}) {
  try {
    console.error(`[Monitoring] Error:`, error, context);
    
    // Guardar error en localStorage para análisis offline
    const errors = JSON.parse(localStorage.getItem('monitoring_errors') || '[]');
    errors.push({
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    });
    
    // Limitar a los últimos 50 errores para no sobrecargar localStorage
    if (errors.length > 50) {
      errors.shift();
    }
    
    localStorage.setItem('monitoring_errors', JSON.stringify(errors));
  } catch (err) {
    console.error('Error al registrar error:', err);
  }
}

/**
 * Inicia una traza de rendimiento personalizada
 * @param {string} traceName - Nombre de la traza
 * @returns {Object} - Objeto de traza con métodos start, stop y record
 */
function startPerformanceTrace(traceName) {
  try {
    const startTime = performance.now();
    
    // Crear objeto de traza
    const trace = {
      name: traceName,
      startTime: startTime,
      stopTime: null,
      duration: null,
      
      // Método para detener la traza
      stop: function() {
        if (this.stopTime === null) {
          this.stopTime = performance.now();
          this.duration = this.stopTime - this.startTime;
          
          // Registrar la traza completada
          logCustomEvent('performance_trace', {
            name: this.name,
            duration: this.duration,
            timestamp: new Date().toISOString()
          });
          
          console.log(`[Monitoring] Trace: ${this.name} completed in ${this.duration.toFixed(2)}ms`);
        }
        return this.duration;
      },
      
      // Método para registrar un valor métrico
      record: function(metricName, value) {
        logCustomEvent('performance_metric', {
          traceName: this.name,
          metricName: metricName,
          value: value,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    // Almacenar la traza
    performanceTraces[traceName] = trace;
    
    console.log(`[Monitoring] Trace: ${traceName} started`);
    return trace;
  } catch (error) {
    console.error('Error al iniciar traza de rendimiento:', error);
    return {
      stop: () => {},
      record: () => {}
    };
  }
}

/**
 * Registra una operación de lectura en Firestore
 * @param {string} collection - Nombre de la colección
 * @param {string} docId - ID del documento (opcional)
 */
function logReadOperation(collection, docId = null) {
  operationCounters.reads++;
  
  // Verificar si se ha alcanzado el límite
  if (operationCounters.reads >= usageLimits.reads) {
    console.warn(`[Monitoring] Alerta: Se ha alcanzado el límite de lecturas (${usageLimits.reads})`);
    
    // Registrar evento de límite alcanzado
    logCustomEvent('usage_limit_reached', {
      operation: 'read',
      limit: usageLimits.reads,
      timestamp: new Date().toISOString()
    });
  }
  
  // Registrar operación para análisis
  if (operationCounters.reads % 100 === 0) {
    logCustomEvent('operation_count', {
      type: 'read',
      count: operationCounters.reads,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Registra una operación de escritura en Firestore
 * @param {string} collection - Nombre de la colección
 * @param {string} docId - ID del documento
 */
function logWriteOperation(collection, docId) {
  operationCounters.writes++;
  
  // Verificar si se ha alcanzado el límite
  if (operationCounters.writes >= usageLimits.writes) {
    console.warn(`[Monitoring] Alerta: Se ha alcanzado el límite de escrituras (${usageLimits.writes})`);
    
    // Registrar evento de límite alcanzado
    logCustomEvent('usage_limit_reached', {
      operation: 'write',
      limit: usageLimits.writes,
      timestamp: new Date().toISOString()
    });
  }
  
  // Registrar operación para análisis
  if (operationCounters.writes % 50 === 0) {
    logCustomEvent('operation_count', {
      type: 'write',
      count: operationCounters.writes,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Registra una operación de eliminación en Firestore
 * @param {string} collection - Nombre de la colección
 * @param {string} docId - ID del documento
 */
function logDeleteOperation(collection, docId) {
  operationCounters.deletes++;
  
  // Verificar si se ha alcanzado el límite
  if (operationCounters.deletes >= usageLimits.deletes) {
    console.warn(`[Monitoring] Alerta: Se ha alcanzado el límite de eliminaciones (${usageLimits.deletes})`);
    
    // Registrar evento de límite alcanzado
    logCustomEvent('usage_limit_reached', {
      operation: 'delete',
      limit: usageLimits.deletes,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Registra una operación de autenticación
 * @param {string} operation - Tipo de operación (signin, signup, signout)
 * @param {string} userId - ID del usuario (opcional)
 */
function logAuthOperation(operation, userId = null) {
  operationCounters.auth++;
  
  // Verificar si se ha alcanzado el límite
  if (operationCounters.auth >= usageLimits.auth) {
    console.warn(`[Monitoring] Alerta: Se ha alcanzado el límite de operaciones de autenticación (${usageLimits.auth})`);
    
    // Registrar evento de límite alcanzado
    logCustomEvent('usage_limit_reached', {
      operation: 'auth',
      limit: usageLimits.auth,
      timestamp: new Date().toISOString()
    });
  }
  
  // Registrar operación para análisis
  logCustomEvent('auth_operation', {
    type: operation,
    userId: userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Obtiene un informe de uso actual
 * @returns {Object} - Informe de uso
 */
function getUsageReport() {
  return {
    operations: {
      reads: operationCounters.reads,
      writes: operationCounters.writes,
      deletes: operationCounters.deletes,
      auth: operationCounters.auth
    },
    limits: usageLimits,
    usage: {
      reads: (operationCounters.reads / usageLimits.reads * 100).toFixed(2) + '%',
      writes: (operationCounters.writes / usageLimits.writes * 100).toFixed(2) + '%',
      deletes: (operationCounters.deletes / usageLimits.deletes * 100).toFixed(2) + '%',
      auth: (operationCounters.auth / usageLimits.auth * 100).toFixed(2) + '%'
    },
    lastReset: localStorage.getItem('monitoring_last_reset')
  };
}

/**
 * Configura los límites de uso
 * @param {Object} newLimits - Nuevos límites
 */
function setUsageLimits(newLimits) {
  if (newLimits.reads) usageLimits.reads = newLimits.reads;
  if (newLimits.writes) usageLimits.writes = newLimits.writes;
  if (newLimits.deletes) usageLimits.deletes = newLimits.deletes;
  if (newLimits.auth) usageLimits.auth = newLimits.auth;
  
  // Guardar límites en localStorage
  localStorage.setItem('monitoring_limits', JSON.stringify(usageLimits));
  
  console.log('[Monitoring] Límites de uso actualizados:', usageLimits);
}

// Cargar límites guardados si existen
try {
  const savedLimits = JSON.parse(localStorage.getItem('monitoring_limits'));
  if (savedLimits) {
    setUsageLimits(savedLimits);
  }
} catch (error) {
  console.error('Error al cargar límites guardados:', error);
}

// Exportar funciones de monitoreo
export {
  initMonitoring,
  logCustomEvent,
  logError,
  startPerformanceTrace,
  logReadOperation,
  logWriteOperation,
  logDeleteOperation,
  logAuthOperation,
  getUsageReport,
  setUsageLimits
};
