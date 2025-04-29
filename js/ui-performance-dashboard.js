/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Dashboard de rendimiento de UI
 * 
 * Este módulo proporciona una interfaz visual para mostrar las métricas
 * de rendimiento y recomendaciones de optimización.
 */

const UIPerformanceDashboard = {
  // Configuración del dashboard
  config: {
    containerId: 'performance-dashboard-container',
    refreshInterval: 10000, // 10 segundos
    showRecommendations: true,
    showDetailedMetrics: false
  },
  
  /**
   * Inicializa el dashboard de rendimiento
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    console.info('[UIPerformanceDashboard] Inicializando dashboard de rendimiento');
    
    // Crear tab de rendimiento en la sección de administrador
    this.createPerformanceTab();
    
    return this;
  },
  
  /**
   * Crea una nueva pestaña de rendimiento en la sección de administrador
   */
  createPerformanceTab: function() {
    // Verificar si la sección de administrador existe
    const adminSection = document.getElementById('admin-section');
    if (!adminSection) {
      console.warn('[UIPerformanceDashboard] No se encontró la sección de administrador');
      return;
    }
    
    // Verificar si ya existe el tab
    if (document.getElementById('performance-tab')) {
      return;
    }
    
    // Agregar botón de tab
    const tabsContainer = adminSection.querySelector('.tabs');
    if (tabsContainer) {
      const tabBtn = document.createElement('button');
      tabBtn.className = 'tab-btn';
      tabBtn.setAttribute('data-tab', 'performance-tab');
      tabBtn.textContent = 'Rendimiento';
      tabsContainer.appendChild(tabBtn);
      
      // Agregar evento click
      tabBtn.addEventListener('click', (e) => {
        // Desactivar todos los tabs
        const allTabBtns = tabsContainer.querySelectorAll('.tab-btn');
        allTabBtns.forEach(btn => btn.classList.remove('active'));
        
        // Desactivar todos los contenidos de tabs
        const allTabContents = adminSection.querySelectorAll('.tab-content');
        allTabContents.forEach(content => content.classList.remove('active'));
        
        // Activar este tab
        e.target.classList.add('active');
        const tabContent = document.getElementById('performance-tab');
        if (tabContent) {
          tabContent.classList.add('active');
          
          // Actualizar el dashboard cuando se muestra
          this.updateDashboard();
        }
      });
    }
    
    // Crear contenido del tab
    const tabContent = document.createElement('div');
    tabContent.id = 'performance-tab';
    tabContent.className = 'tab-content';
    
    // Estructura básica del dashboard
    tabContent.innerHTML = `
      <h3>Dashboard de Rendimiento UI</h3>
      <p>Monitoreo y análisis del rendimiento de la interfaz de usuario.</p>
      
      <div class="row">
        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">
              <h4>Métricas Generales</h4>
            </div>
            <div class="card-body">
              <div id="general-metrics-container">
                <p>Cargando métricas...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header">
              <h4>Recomendaciones</h4>
            </div>
            <div class="card-body">
              <div id="recommendations-container">
                <p>Analizando rendimiento...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">
          <h4>Tiempos de Renderizado</h4>
        </div>
        <div class="card-body">
          <div id="render-times-container">
            <p>Recopilando datos...</p>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h4>Métricas Detalladas</h4>
          <button id="toggle-detailed-metrics" class="btn btn-sm btn-secondary">
            Mostrar Detalles
          </button>
        </div>
        <div class="card-body">
          <div id="detailed-metrics-container" style="display: none;">
            <p>Haga clic en "Mostrar Detalles" para ver métricas detalladas.</p>
          </div>
        </div>
      </div>
    `;
    
    // Agregar a la sección de administrador
    adminSection.appendChild(tabContent);
    
    // Configurar eventos
    document.getElementById('toggle-detailed-metrics').addEventListener('click', (e) => {
      const detailedContainer = document.getElementById('detailed-metrics-container');
      const isVisible = detailedContainer.style.display !== 'none';
      
      detailedContainer.style.display = isVisible ? 'none' : 'block';
      e.target.textContent = isVisible ? 'Mostrar Detalles' : 'Ocultar Detalles';
      
      if (!isVisible) {
        this.updateDetailedMetrics();
      }
    });
    
    // Iniciar actualización periódica cuando el tab está visible
    setInterval(() => {
      const tab = document.getElementById('performance-tab');
      if (tab && tab.classList.contains('active')) {
        this.updateDashboard();
      }
    }, this.config.refreshInterval);
    
    console.info('[UIPerformanceDashboard] Tab de rendimiento creado');
  },
  
  /**
   * Actualiza todo el dashboard con datos actuales
   */
  updateDashboard: function() {
    // Verificar si el analizador está disponible
    if (typeof UIPerformanceAnalyzer === 'undefined') {
      console.error('[UIPerformanceDashboard] UIPerformanceAnalyzer no está disponible');
      return;
    }
    
    // Obtener informe actual
    const report = UIPerformanceAnalyzer.generateReport();
    if (!report || !report.enabled) {
      console.warn('[UIPerformanceDashboard] El analizador de rendimiento no está habilitado');
      return;
    }
    
    // Actualizar cada sección
    this.updateGeneralMetrics(report);
    this.updateRecommendations(report);
    this.updateRenderTimes(report);
    
    // Actualizar métricas detalladas si están visibles
    const detailedContainer = document.getElementById('detailed-metrics-container');
    if (detailedContainer && detailedContainer.style.display !== 'none') {
      this.updateDetailedMetrics(report);
    }
    
    console.debug('[UIPerformanceDashboard] Dashboard actualizado');
  },
  
  /**
   * Actualiza la sección de métricas generales
   * @param {Object} report - Informe de rendimiento
   */
  updateGeneralMetrics: function(report) {
    const container = document.getElementById('general-metrics-container');
    if (!container) return;
    
    const { summary } = report;
    
    // Crear HTML para las métricas generales
    let html = `
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-value">${summary.domSize || 'N/A'}</div>
          <div class="metric-label">Elementos DOM</div>
        </div>
        
        <div class="metric-item">
          <div class="metric-value">${summary.deeplyNestedElements || 'N/A'}</div>
          <div class="metric-label">Elementos muy anidados</div>
        </div>
        
        <div class="metric-item">
          <div class="metric-value">${summary.memoryUsage || 'N/A'}</div>
          <div class="metric-label">Uso de memoria</div>
        </div>
        
        <div class="metric-item">
          <div class="metric-value">${summary.reflows}</div>
          <div class="metric-label">Reflows detectados</div>
        </div>
      </div>
      
      <div class="metrics-summary mt-3">
        <div class="alert ${summary.slowComponents > 0 ? 'alert-warning' : 'alert-success'}">
          <strong>${summary.slowComponents}</strong> componentes con renderizado lento
        </div>
        
        <div class="alert ${summary.slowInteractions > 0 ? 'alert-warning' : 'alert-success'}">
          <strong>${summary.slowInteractions}</strong> interacciones con respuesta lenta
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Agregar estilos inline si no existen en CSS
    if (!document.getElementById('performance-dashboard-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'performance-dashboard-styles';
      styleEl.textContent = `
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .metric-item {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 15px;
          text-align: center;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #6c757d;
        }
      `;
      document.head.appendChild(styleEl);
    }
  },
  
  /**
   * Actualiza la sección de recomendaciones
   * @param {Object} report - Informe de rendimiento
   */
  updateRecommendations: function(report) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const { recommendations } = report;
    
    if (!recommendations || recommendations.length === 0) {
      container.innerHTML = '<div class="alert alert-success">No hay recomendaciones de optimización en este momento.</div>';
      return;
    }
    
    // Crear HTML para las recomendaciones
    let html = '<ul class="recommendations-list">';
    
    recommendations.forEach(rec => {
      const severityClass = rec.severity === 'high' ? 'text-danger' : 
                           rec.severity === 'medium' ? 'text-warning' : 'text-info';
      
      html += `
        <li class="recommendation-item">
          <div class="recommendation-severity ${severityClass}">
            ${rec.severity === 'high' ? '⚠️ Alta' : 
              rec.severity === 'medium' ? '⚠ Media' : 'ℹ️ Baja'}
          </div>
          <div class="recommendation-message">${rec.message}</div>
        </li>
      `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
    
    // Agregar estilos inline si no existen en CSS
    if (!document.querySelector('style').textContent.includes('.recommendations-list')) {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .recommendations-list {
          list-style: none;
          padding: 0;
        }
        
        .recommendation-item {
          margin-bottom: 10px;
          padding: 10px;
          border-left: 3px solid #dee2e6;
          background-color: #f8f9fa;
        }
        
        .recommendation-severity {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .recommendation-message {
          font-size: 14px;
        }
      `;
      document.head.appendChild(styleEl);
    }
  },
  
  /**
   * Actualiza la sección de tiempos de renderizado
   * @param {Object} report - Informe de rendimiento
   */
  updateRenderTimes: function(report) {
    const container = document.getElementById('render-times-container');
    if (!container) return;
    
    const renderTimes = report.details.renderTimes;
    
    if (!renderTimes || Object.keys(renderTimes).length === 0) {
      container.innerHTML = '<p>No hay datos de tiempos de renderizado disponibles.</p>';
      return;
    }
    
    // Crear HTML para la tabla de tiempos
    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Componente</th>
            <th>Tiempo Promedio (ms)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Obtener benchmarks si están disponibles
    const benchmarks = (typeof UIPerformanceMetrics !== 'undefined' && UIPerformanceMetrics.benchmarks) 
      ? UIPerformanceMetrics.benchmarks.renderTimes 
      : {};
    
    // Ordenar componentes por tiempo (más lento primero)
    const sortedComponents = Object.keys(renderTimes).sort((a, b) => renderTimes[b] - renderTimes[a]);
    
    sortedComponents.forEach(componentId => {
      const time = renderTimes[componentId];
      const benchmark = benchmarks[componentId] || 50; // Valor predeterminado si no hay benchmark
      
      const status = time > benchmark * 1.5 ? 'danger' :
                    time > benchmark ? 'warning' : 'success';
      
      html += `
        <tr>
          <td>${componentId}</td>
          <td>${time.toFixed(2)}</td>
          <td>
            <span class="badge badge-${status}">
              ${status === 'danger' ? 'Crítico' : 
                status === 'warning' ? 'Lento' : 'Óptimo'}
            </span>
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
  },
  
  /**
   * Actualiza la sección de métricas detalladas
   * @param {Object} report - Informe de rendimiento
   */
  updateDetailedMetrics: function(report) {
    const container = document.getElementById('detailed-metrics-container');
    if (!container) return;
    
    // Si no se proporciona informe, obtenerlo
    if (!report && typeof UIPerformanceAnalyzer !== 'undefined') {
      report = UIPerformanceAnalyzer.generateReport();
    }
    
    if (!report || !report.enabled) {
      container.innerHTML = '<p>No hay datos detallados disponibles.</p>';
      return;
    }
    
    // Crear HTML para las métricas detalladas
    let html = `
      <div class="accordion" id="metricsAccordion">
        <!-- DOM Size Details -->
        <div class="card">
          <div class="card-header" id="headingDomSize">
            <h5 class="mb-0">
              <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseDomSize">
                Detalles de Tamaño del DOM
              </button>
            </h5>
          </div>
          <div id="collapseDomSize" class="collapse" data-parent="#metricsAccordion">
            <div class="card-body">
              ${this.renderDomSizeDetails(report)}
            </div>
          </div>
        </div>
        
        <!-- Memory Usage Details -->
        <div class="card">
          <div class="card-header" id="headingMemory">
            <h5 class="mb-0">
              <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseMemory">
                Uso de Memoria
              </button>
            </h5>
          </div>
          <div id="collapseMemory" class="collapse" data-parent="#metricsAccordion">
            <div class="card-body">
              ${this.renderMemoryUsageDetails(report)}
            </div>
          </div>
        </div>
        
        <!-- Interaction Delays -->
        <div class="card">
          <div class="card-header" id="headingInteractions">
            <h5 class="mb-0">
              <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseInteractions">
                Delays de Interacción
              </button>
            </h5>
          </div>
          <div id="collapseInteractions" class="collapse" data-parent="#metricsAccordion">
            <div class="card-body">
              ${this.renderInteractionDelaysDetails(report)}
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Agregar eventos para el acordeón
    container.querySelectorAll('[data-toggle="collapse"]').forEach(button => {
      button.addEventListener('click', () => {
        const target = document.querySelector(button.getAttribute('data-target'));
        if (target) {
          const isOpen = target.classList.contains('show');
          
          // Cerrar todos los paneles
          container.querySelectorAll('.collapse').forEach(panel => {
            panel.classList.remove('show');
          });
          
          // Abrir el panel seleccionado si estaba cerrado
          if (!isOpen) {
            target.classList.add('show');
          }
        }
      });
    });
  },
  
  /**
   * Renderiza los detalles del tamaño del DOM
   * @param {Object} report - Informe de rendimiento
   * @returns {string} HTML con los detalles
   */
  renderDomSizeDetails: function(report) {
    if (!report.details.domSizes) {
      return '<p>No hay datos disponibles sobre el tamaño del DOM.</p>';
    }
    
    const { elementCounts } = report.details.domSizes;
    
    // Ordenar elementos por cantidad (mayor a menor)
    const sortedElements = Object.keys(elementCounts).sort((a, b) => elementCounts[b] - elementCounts[a]);
    
    let html = `
      <p>Total de elementos: <strong>${report.details.domSizes.totalElements}</strong></p>
      <p>Elementos muy anidados: <strong>${report.details.domSizes.deeplyNested}</strong></p>
      
      <h6>Distribución por tipo de elemento:</h6>
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Elemento</th>
            <th>Cantidad</th>
            <th>Porcentaje</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    sortedElements.slice(0, 10).forEach(elementType => {
      const count = elementCounts[elementType];
      const percentage = ((count / report.details.domSizes.totalElements) * 100).toFixed(1);
      
      html += `
        <tr>
          <td><code>${elementType}</code></td>
          <td>${count}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    return html;
  },
  
  /**
   * Renderiza los detalles del uso de memoria
   * @param {Object} report - Informe de rendimiento
   * @returns {string} HTML con los detalles
   */
  renderMemoryUsageDetails: function(report) {
    if (!report.details.memoryUsage || report.details.memoryUsage.length === 0) {
      return '<p>No hay datos disponibles sobre el uso de memoria.</p>';
    }
    
    // Obtener la última medición
    const lastMemory = report.details.memoryUsage[report.details.memoryUsage.length - 1];
    
    // Convertir a MB para mejor legibilidad
    const usedMB = (lastMemory.usedJSHeapSize / 1048576).toFixed(2);
    const totalMB = (lastMemory.totalJSHeapSize / 1048576).toFixed(2);
    const limitMB = (lastMemory.jsHeapSizeLimit / 1048576).toFixed(2);
    
    // Calcular porcentaje de uso
    const usagePercentage = ((lastMemory.usedJSHeapSize / lastMemory.jsHeapSizeLimit) * 100).toFixed(1);
    
    let html = `
      <div class="memory-usage-details">
        <p>Uso actual: <strong>${usedMB} MB</strong> de ${totalMB} MB (${usagePercentage}% del límite)</p>
        <p>Límite del navegador: ${limitMB} MB</p>
        
        <div class="progress mb-3">
          <div class="progress-bar ${usagePercentage > 70 ? 'bg-danger' : usagePercentage > 50 ? 'bg-warning' : 'bg-success'}" 
               role="progressbar" 
               style="width: ${usagePercentage}%" 
               aria-valuenow="${usagePercentage}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${usagePercentage}%
          </div>
        </div>
      </div>
    `;
    
    return html;
  },
  
  /**
   * Renderiza los detalles de los delays de interacción
   * @param {Object} report - Informe de rendimiento
   * @returns {string} HTML con los detalles
   */
  renderInteractionDelaysDetails: function(report) {
    if (!report.details.interactionDelays || report.details.interactionDelays.length === 0) {
      return '<p>No se han detectado delays significativos en las interacciones.</p>';
    }
    
    // Ordenar por delay (mayor a menor)
    const sortedDelays = [...report.details.interactionDelays].sort((a, b) => b.delay - a.delay);
    
    let html = `
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Elemento</th>
            <th>Delay (ms)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    sortedDelays.forEach(delay => {
      const status = delay.delay > 100 ? 'danger' :
                    delay.delay > 50 ? 'warning' : 'success';
      
      html += `
        <tr>
          <td>${delay.type}</td>
          <td>${delay.target}</td>
          <td>${delay.delay.toFixed(2)}</td>
          <td>
            <span class="badge badge-${status}">
              ${status === 'danger' ? 'Crítico' : 
                status === 'warning' ? 'Lento' : 'Aceptable'}
            </span>
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    return html;
  }
};

// Exportar el objeto UIPerformanceDashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIPerformanceDashboard;
}
