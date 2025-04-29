/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Métricas de rendimiento de UI
 * 
 * Este módulo integra el analizador de rendimiento y establece métricas
 * específicas para la aplicación.
 */

const UIPerformanceMetrics = {
  // Métricas de referencia para la aplicación
  benchmarks: {
    renderTimes: {
      menuList: 50,       // ms máximos para renderizar lista de menús
      userList: 50,       // ms máximos para renderizar lista de usuarios
      reportTable: 100,   // ms máximos para renderizar tabla de reportes
      confirmationForm: 30 // ms máximos para renderizar formulario de confirmación
    },
    domSize: {
      maxElements: 1000,  // número máximo recomendado de elementos DOM
      maxNesting: 10      // profundidad máxima recomendada de anidación
    },
    interaction: {
      clickResponse: 100, // ms máximos para responder a un clic
      inputResponse: 50   // ms máximos para responder a entrada de texto
    },
    memory: {
      maxUsage: 50        // MB máximos de uso de memoria
    }
  },
  
  /**
   * Inicializa las métricas de rendimiento
   */
  init: function() {
    // Verificar si el analizador está disponible
    if (typeof UIPerformanceAnalyzer === 'undefined') {
      console.error('UIPerformanceAnalyzer no está disponible');
      return;
    }
    
    // Inicializar analizador con configuración específica
    UIPerformanceAnalyzer.init({
      enabled: true,
      logLevel: 'info',
      sampleSize: 10
    });
    
    // Registrar componentes clave para monitoreo
    this.registerKeyComponents();
    
    console.info('[UIPerformanceMetrics] Métricas de rendimiento inicializadas');
    
    // Programar generación de informe después de cargar la aplicación
    setTimeout(() => this.generateInitialReport(), 5000);
  },
  
  /**
   * Registra componentes clave para monitoreo de rendimiento
   */
  registerKeyComponents: function() {
    // Sobrescribir métodos de renderizado clave para medir su rendimiento
    
    // Ejemplo: Admin.renderMenuList
    if (typeof Admin !== 'undefined' && Admin.renderMenuList) {
      const originalRenderMenuList = Admin.renderMenuList;
      Admin.renderMenuList = function() {
        return UIPerformanceAnalyzer.measureRenderTime('menuList', () => {
          return originalRenderMenuList.apply(this, arguments);
        });
      };
    }
    
    // Ejemplo: Admin.renderUserList
    if (typeof Admin !== 'undefined' && Admin.renderUserList) {
      const originalRenderUserList = Admin.renderUserList;
      Admin.renderUserList = function() {
        return UIPerformanceAnalyzer.measureRenderTime('userList', () => {
          return originalRenderUserList.apply(this, arguments);
        });
      };
    }
    
    // Ejemplo: Admin.renderReportTable
    if (typeof Admin !== 'undefined' && Admin.renderReportTable) {
      const originalRenderReportTable = Admin.renderReportTable;
      Admin.renderReportTable = function() {
        return UIPerformanceAnalyzer.measureRenderTime('reportTable', () => {
          return originalRenderReportTable.apply(this, arguments);
        });
      };
    }
    
    // Ejemplo: Coordinator.renderConfirmationForm
    if (typeof Coordinator !== 'undefined' && Coordinator.renderConfirmationForm) {
      const originalRenderConfirmationForm = Coordinator.renderConfirmationForm;
      Coordinator.renderConfirmationForm = function() {
        return UIPerformanceAnalyzer.measureRenderTime('confirmationForm', () => {
          return originalRenderConfirmationForm.apply(this, arguments);
        });
      };
    }
  },
  
  /**
   * Genera un informe inicial de rendimiento
   */
  generateInitialReport: function() {
    const report = UIPerformanceAnalyzer.generateReport();
    console.info('[UIPerformanceMetrics] Informe inicial de rendimiento:', report);
    
    // Verificar métricas contra benchmarks
    this.analyzeReport(report);
    
    // Programar informes periódicos
    setInterval(() => {
      const updatedReport = UIPerformanceAnalyzer.generateReport();
      this.analyzeReport(updatedReport);
    }, 60000); // Cada minuto
  },
  
  /**
   * Analiza un informe de rendimiento y compara con benchmarks
   * @param {Object} report - Informe de rendimiento
   */
  analyzeReport: function(report) {
    if (!report || !report.enabled) return;
    
    const issues = [];
    
    // Verificar tiempos de renderizado
    Object.keys(report.details.renderTimes).forEach(componentId => {
      const time = report.details.renderTimes[componentId];
      const benchmark = this.benchmarks.renderTimes[componentId];
      
      if (benchmark && time > benchmark) {
        issues.push({
          component: componentId,
          metric: 'renderTime',
          value: time.toFixed(2) + 'ms',
          benchmark: benchmark + 'ms',
          message: `El tiempo de renderizado de ${componentId} (${time.toFixed(2)}ms) excede el benchmark (${benchmark}ms)`
        });
      }
    });
    
    // Verificar tamaño del DOM
    if (report.summary.domSize > this.benchmarks.domSize.maxElements) {
      issues.push({
        metric: 'domSize',
        value: report.summary.domSize,
        benchmark: this.benchmarks.domSize.maxElements,
        message: `El tamaño del DOM (${report.summary.domSize} elementos) excede el máximo recomendado (${this.benchmarks.domSize.maxElements})`
      });
    }
    
    // Verificar uso de memoria
    if (report.summary.memoryUsage) {
      const memoryMB = parseInt(report.summary.memoryUsage);
      if (memoryMB > this.benchmarks.memory.maxUsage) {
        issues.push({
          metric: 'memoryUsage',
          value: report.summary.memoryUsage,
          benchmark: this.benchmarks.memory.maxUsage + 'MB',
          message: `El uso de memoria (${report.summary.memoryUsage}) excede el máximo recomendado (${this.benchmarks.memory.maxUsage}MB)`
        });
      }
    }
    
    // Verificar interacciones lentas
    if (report.details.interactionDelays && report.details.interactionDelays.length > 0) {
      report.details.interactionDelays.forEach(delay => {
        const benchmark = delay.type === 'click' 
          ? this.benchmarks.interaction.clickResponse 
          : this.benchmarks.interaction.inputResponse;
        
        if (delay.delay > benchmark) {
          issues.push({
            metric: 'interactionDelay',
            value: delay.delay.toFixed(2) + 'ms',
            benchmark: benchmark + 'ms',
            message: `Delay de interacción ${delay.type} en ${delay.target} (${delay.delay.toFixed(2)}ms) excede el máximo recomendado (${benchmark}ms)`
          });
        }
      });
    }
    
    // Registrar problemas encontrados
    if (issues.length > 0) {
      console.warn('[UIPerformanceMetrics] Problemas de rendimiento detectados:', issues);
      
      // Almacenar en localStorage para análisis posterior
      try {
        const storedIssues = JSON.parse(localStorage.getItem('uiPerformanceIssues') || '[]');
        const updatedIssues = [...storedIssues, {
          timestamp: Date.now(),
          issues
        }];
        
        // Mantener solo los últimos 10 registros
        if (updatedIssues.length > 10) {
          updatedIssues.shift();
        }
        
        localStorage.setItem('uiPerformanceIssues', JSON.stringify(updatedIssues));
      } catch (e) {
        console.error('Error al almacenar problemas de rendimiento:', e);
      }
    } else {
      console.info('[UIPerformanceMetrics] No se detectaron problemas de rendimiento');
    }
    
    return issues;
  }
};

// Exportar el objeto UIPerformanceMetrics
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIPerformanceMetrics;
}
