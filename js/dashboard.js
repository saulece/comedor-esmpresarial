/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de Dashboard
 * 
 * Este archivo implementa un dashboard personalizable para administradores,
 * mostrando métricas clave y estadísticas del sistema.
 */

const Dashboard = {
  /**
   * Configuración del dashboard
   */
  config: {
    refreshInterval: 60000, // Intervalo de actualización en milisegundos (1 minuto)
    container: 'dashboard-container',
    maxHistoryItems: 5, // Número máximo de elementos históricos a mostrar
    defaultCards: [
      'attendance-summary',
      'weekly-trend',
      'storage-usage',
      'active-menus',
      'coordinator-activity'
    ]
  },
  
  /**
   * Estado del dashboard
   */
  state: {
    isInitialized: false,
    refreshTimer: null,
    metrics: {}
  },
  
  /**
   * Inicializa el dashboard
   * @param {Object} options - Opciones de configuración
   */
  init: function(options = {}) {
    // Si ya está inicializado, no hacer nada
    if (this.state.isInitialized) return;
    
    console.log('Inicializando dashboard...');
    
    // Combinar opciones con configuración predeterminada
    this.config = {...this.config, ...options};
    
    // Cargar métricas iniciales
    this.loadMetrics()
      .then(() => {
        // Renderizar dashboard
        this.render();
        
        // Configurar actualización periódica
        this.state.refreshTimer = setInterval(() => {
          this.loadMetrics().then(() => this.updateCards());
        }, this.config.refreshInterval);
        
        this.state.isInitialized = true;
        console.log('Dashboard inicializado correctamente.');
      })
      .catch(error => {
        console.error('Error al inicializar dashboard:', error);
      });
    
    // Configurar eventos
    this._setupEvents();
  },
  
  /**
   * Carga las métricas del sistema
   * @returns {Promise} Promesa que se resuelve cuando las métricas están cargadas
   */
  loadMetrics: function() {
    return new Promise((resolve) => {
      console.log('Cargando métricas del dashboard...');
      
      // Obtener estadísticas de almacenamiento
      const storageStats = StorageManager.getStorageStats();
      
      // Obtener menús activos
      const menus = Models.Menu.getAll();
      const activeMenu = Models.Menu.getActiveMenu();
      
      // Obtener confirmaciones
      const confirmations = Models.Confirmation.getAll();
      
      // Obtener coordinadores
      const coordinators = Models.User.getAllCoordinators();
      
      // Calcular métricas
      this.state.metrics = {
        storage: storageStats,
        menus: {
          total: menus.length,
          active: activeMenu ? 1 : 0,
          draft: menus.filter(m => m.status === 'draft').length,
          archived: menus.filter(m => m.status === 'archived').length
        },
        confirmations: {
          total: confirmations.length,
          thisWeek: confirmations.filter(c => {
            if (!activeMenu) return false;
            return c.menuId === activeMenu.id;
          }).length,
          completionRate: activeMenu ? this._calculateCompletionRate(activeMenu.id, coordinators.length) : 0
        },
        coordinators: {
          total: coordinators.length,
          active: this._getActiveCoordinators(confirmations, coordinators).length
        },
        attendance: this._calculateAttendanceTrend(confirmations)
      };
      
      resolve();
    });
  },
  
  /**
   * Renderiza el dashboard completo
   */
  render: function() {
    const container = document.getElementById(this.config.container);
    if (!container) {
      console.error(`Contenedor del dashboard no encontrado: #${this.config.container}`);
      return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear estructura del dashboard
    const dashboardHtml = `
      <div class="dashboard-row">
        ${this._renderCards()}
      </div>
    `;
    
    container.innerHTML = dashboardHtml;
    
    // Inicializar gráficos simples
    this._initSimpleCharts();
  },
  
  /**
   * Actualiza las tarjetas del dashboard sin volver a renderizar todo
   */
  updateCards: function() {
    // Actualizar valores en las tarjetas existentes
    this._updateCardValues();
    
    // Actualizar gráficos simples
    this._updateSimpleCharts();
  },
  
  /**
   * Renderiza las tarjetas del dashboard
   * @returns {string} HTML de las tarjetas
   * @private
   */
  _renderCards: function() {
    // Obtener tarjetas configuradas
    const cards = this.config.defaultCards;
    
    // Mapear tarjetas a HTML
    return cards.map(cardId => {
      switch (cardId) {
        case 'attendance-summary':
          return this._renderAttendanceSummaryCard();
        case 'weekly-trend':
          return this._renderWeeklyTrendCard();
        case 'storage-usage':
          return this._renderStorageUsageCard();
        case 'active-menus':
          return this._renderActiveMenusCard();
        case 'coordinator-activity':
          return this._renderCoordinatorActivityCard();
        default:
          return '';
      }
    }).join('');
  },
  
  /**
   * Renderiza la tarjeta de resumen de asistencia
   * @returns {string} HTML de la tarjeta
   * @private
   */
  _renderAttendanceSummaryCard: function() {
    const metrics = this.state.metrics;
    const completionRate = metrics.confirmations.completionRate;
    const completionClass = completionRate >= 80 ? 'positive' : (completionRate >= 50 ? 'neutral' : 'negative');
    
    return `
      <div class="dashboard-card" id="attendance-summary-card">
        <div class="dashboard-card-header">
          <div class="dashboard-card-icon bg-primary">
            <i class="fas fa-users"></i>
          </div>
          <h3 class="dashboard-card-title">Resumen de Asistencia</h3>
        </div>
        <div class="dashboard-card-content">
          <div class="dashboard-card-value" id="attendance-value">
            ${metrics.confirmations.thisWeek} / ${metrics.coordinators.total}
          </div>
          <div class="dashboard-card-label">
            Confirmaciones esta semana
          </div>
        </div>
        <div class="dashboard-card-footer">
          <div class="dashboard-card-trend ${completionClass}" id="completion-rate">
            <i class="fas fa-${completionRate >= 50 ? 'arrow-up' : 'arrow-down'}"></i>
            <span>${completionRate}% completado</span>
          </div>
          <div>
            <span id="active-coordinators">${metrics.coordinators.active}</span> coordinadores activos
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Renderiza la tarjeta de tendencia semanal
   * @returns {string} HTML de la tarjeta
   * @private
   */
  _renderWeeklyTrendCard: function() {
    const metrics = this.state.metrics;
    const trend = metrics.attendance ? metrics.attendance.weeklyChange : 0;
    const trendClass = trend > 0 ? 'positive' : (trend < 0 ? 'negative' : 'neutral');
    
    return `
      <div class="dashboard-card" id="weekly-trend-card">
        <div class="dashboard-card-header">
          <div class="dashboard-card-icon bg-info">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3 class="dashboard-card-title">Tendencia Semanal</h3>
        </div>
        <div class="dashboard-card-content">
          <div class="simple-chart" id="weekly-trend-chart">
            ${this._generateSimpleChartHtml(metrics.attendance ? metrics.attendance.weeklyData : [])}
          </div>
        </div>
        <div class="dashboard-card-footer">
          <div class="dashboard-card-trend ${trendClass}" id="weekly-trend">
            <i class="fas fa-${trend >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
            <span>${Math.abs(trend)}% ${trend >= 0 ? 'incremento' : 'decremento'}</span>
          </div>
          <div>
            Últimas ${this.config.maxHistoryItems} semanas
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Renderiza la tarjeta de uso de almacenamiento
   * @returns {string} HTML de la tarjeta
   * @private
   */
  _renderStorageUsageCard: function() {
    const metrics = this.state.metrics;
    const usedPercent = metrics.storage ? metrics.storage.usedPercentage : 0;
    const usageClass = usedPercent > 80 ? 'negative' : (usedPercent > 60 ? 'neutral' : 'positive');
    
    return `
      <div class="dashboard-card" id="storage-usage-card">
        <div class="dashboard-card-header">
          <div class="dashboard-card-icon bg-warning">
            <i class="fas fa-database"></i>
          </div>
          <h3 class="dashboard-card-title">Uso de Almacenamiento</h3>
        </div>
        <div class="dashboard-card-content">
          <div class="dashboard-card-value" id="storage-value">
            ${usedPercent}%
          </div>
          <div class="dashboard-card-label">
            ${metrics.storage ? Math.round(metrics.storage.used / 1024) : 0} KB de ${metrics.storage ? Math.round(metrics.storage.total / 1024) : 0} KB
          </div>
          <div class="progress mt-2">
            <div class="progress-bar bg-${usedPercent > 80 ? 'danger' : (usedPercent > 60 ? 'warning' : 'success')}" 
                 role="progressbar" 
                 style="width: ${usedPercent}%" 
                 aria-valuenow="${usedPercent}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
              ${usedPercent}%
            </div>
          </div>
        </div>
        <div class="dashboard-card-footer">
          <div class="dashboard-card-trend ${usageClass}" id="storage-trend">
            <i class="fas fa-${usedPercent < 60 ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${usedPercent < 60 ? 'Espacio suficiente' : (usedPercent > 80 ? 'Crítico' : 'Advertencia')}</span>
          </div>
          <div>
            <a href="#" class="storage-cleanup-link">Limpiar datos antiguos</a>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Renderiza la tarjeta de menús activos
   * @returns {string} HTML de la tarjeta
   * @private
   */
  _renderActiveMenusCard: function() {
    const metrics = this.state.metrics;
    
    return `
      <div class="dashboard-card" id="active-menus-card">
        <div class="dashboard-card-header">
          <div class="dashboard-card-icon bg-success">
            <i class="fas fa-utensils"></i>
          </div>
          <h3 class="dashboard-card-title">Menús</h3>
        </div>
        <div class="dashboard-card-content">
          <div class="dashboard-card-value" id="menus-value">
            ${metrics.menus.active} / ${metrics.menus.total}
          </div>
          <div class="dashboard-card-label">
            Menús activos / total
          </div>
        </div>
        <div class="dashboard-card-footer">
          <div>
            <span id="draft-menus">${metrics.menus.draft}</span> borradores
          </div>
          <div>
            <span id="archived-menus">${metrics.menus.archived}</span> archivados
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Renderiza la tarjeta de actividad de coordinadores
   * @returns {string} HTML de la tarjeta
   * @private
   */
  _renderCoordinatorActivityCard: function() {
    const metrics = this.state.metrics;
    const activePercent = metrics.coordinators.total > 0 
      ? Math.round((metrics.coordinators.active / metrics.coordinators.total) * 100) 
      : 0;
    
    return `
      <div class="dashboard-card" id="coordinator-activity-card">
        <div class="dashboard-card-header">
          <div class="dashboard-card-icon bg-danger">
            <i class="fas fa-user-check"></i>
          </div>
          <h3 class="dashboard-card-title">Actividad de Coordinadores</h3>
        </div>
        <div class="dashboard-card-content">
          <div class="dashboard-card-value" id="coordinator-value">
            ${activePercent}%
          </div>
          <div class="dashboard-card-label">
            Tasa de actividad
          </div>
        </div>
        <div class="dashboard-card-footer">
          <div>
            <span id="total-coordinators">${metrics.coordinators.total}</span> coordinadores totales
          </div>
          <div>
            <span id="active-coordinators-count">${metrics.coordinators.active}</span> activos esta semana
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Actualiza los valores en las tarjetas existentes
   * @private
   */
  _updateCardValues: function() {
    const metrics = this.state.metrics;
    
    // Actualizar tarjeta de resumen de asistencia
    const attendanceValue = document.getElementById('attendance-value');
    if (attendanceValue) {
      attendanceValue.textContent = `${metrics.confirmations.thisWeek} / ${metrics.coordinators.total}`;
    }
    
    const completionRate = document.getElementById('completion-rate');
    if (completionRate) {
      const rate = metrics.confirmations.completionRate;
      const completionClass = rate >= 80 ? 'positive' : (rate >= 50 ? 'neutral' : 'negative');
      
      completionRate.className = `dashboard-card-trend ${completionClass}`;
      completionRate.innerHTML = `
        <i class="fas fa-${rate >= 50 ? 'arrow-up' : 'arrow-down'}"></i>
        <span>${rate}% completado</span>
      `;
    }
    
    // Actualizar tarjeta de uso de almacenamiento
    const storageValue = document.getElementById('storage-value');
    if (storageValue) {
      const usedPercent = metrics.storage ? metrics.storage.usedPercentage : 0;
      storageValue.textContent = `${usedPercent}%`;
      
      const storageLabel = storageValue.nextElementSibling;
      if (storageLabel) {
        storageLabel.textContent = `${metrics.storage ? Math.round(metrics.storage.used / 1024) : 0} KB de ${metrics.storage ? Math.round(metrics.storage.total / 1024) : 0} KB`;
      }
      
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.width = `${usedPercent}%`;
        progressBar.setAttribute('aria-valuenow', usedPercent);
        progressBar.className = `progress-bar bg-${usedPercent > 80 ? 'danger' : (usedPercent > 60 ? 'warning' : 'success')}`;
        progressBar.textContent = `${usedPercent}%`;
      }
    }
    
    // Actualizar tarjeta de menús activos
    const menusValue = document.getElementById('menus-value');
    if (menusValue) {
      menusValue.textContent = `${metrics.menus.active} / ${metrics.menus.total}`;
    }
    
    const draftMenus = document.getElementById('draft-menus');
    if (draftMenus) {
      draftMenus.textContent = metrics.menus.draft;
    }
    
    const archivedMenus = document.getElementById('archived-menus');
    if (archivedMenus) {
      archivedMenus.textContent = metrics.menus.archived;
    }
    
    // Actualizar tarjeta de actividad de coordinadores
    const coordinatorValue = document.getElementById('coordinator-value');
    if (coordinatorValue) {
      const activePercent = metrics.coordinators.total > 0 
        ? Math.round((metrics.coordinators.active / metrics.coordinators.total) * 100) 
        : 0;
      coordinatorValue.textContent = `${activePercent}%`;
    }
    
    const totalCoordinators = document.getElementById('total-coordinators');
    if (totalCoordinators) {
      totalCoordinators.textContent = metrics.coordinators.total;
    }
    
    const activeCoordinatorsCount = document.getElementById('active-coordinators-count');
    if (activeCoordinatorsCount) {
      activeCoordinatorsCount.textContent = metrics.coordinators.active;
    }
  },
  
  /**
   * Inicializa los gráficos simples
   * @private
   */
  _initSimpleCharts: function() {
    const weeklyTrendChart = document.getElementById('weekly-trend-chart');
    if (weeklyTrendChart) {
      const weeklyData = this.state.metrics.attendance ? this.state.metrics.attendance.weeklyData : [];
      weeklyTrendChart.innerHTML = this._generateSimpleChartHtml(weeklyData);
    }
  },
  
  /**
   * Actualiza los gráficos simples
   * @private
   */
  _updateSimpleCharts: function() {
    const weeklyTrendChart = document.getElementById('weekly-trend-chart');
    if (weeklyTrendChart) {
      const weeklyData = this.state.metrics.attendance ? this.state.metrics.attendance.weeklyData : [];
      weeklyTrendChart.innerHTML = this._generateSimpleChartHtml(weeklyData);
    }
    
    const weeklyTrend = document.getElementById('weekly-trend');
    if (weeklyTrend) {
      const trend = this.state.metrics.attendance ? this.state.metrics.attendance.weeklyChange : 0;
      const trendClass = trend > 0 ? 'positive' : (trend < 0 ? 'negative' : 'neutral');
      
      weeklyTrend.className = `dashboard-card-trend ${trendClass}`;
      weeklyTrend.innerHTML = `
        <i class="fas fa-${trend >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
        <span>${Math.abs(trend)}% ${trend >= 0 ? 'incremento' : 'decremento'}</span>
      `;
    }
  },
  
  /**
   * Genera el HTML para un gráfico simple
   * @param {Array} data - Datos para el gráfico
   * @returns {string} HTML del gráfico
   * @private
   */
  _generateSimpleChartHtml: function(data) {
    if (!data || data.length === 0) {
      return '<div class="text-center text-muted">No hay datos disponibles</div>';
    }
    
    // Encontrar el valor máximo para normalizar
    const maxValue = Math.max(...data);
    
    // Generar barras
    return data.map(value => {
      const height = maxValue > 0 ? Math.max(10, Math.round((value / maxValue) * 100)) : 0;
      return `<div class="chart-bar" style="height: ${height}%" title="${value}"></div>`;
    }).join('');
  },
  
  /**
   * Calcula la tasa de finalización de confirmaciones para un menú
   * @param {string} menuId - ID del menú
   * @param {number} totalCoordinators - Número total de coordinadores
   * @returns {number} Porcentaje de finalización
   * @private
   */
  _calculateCompletionRate: function(menuId, totalCoordinators) {
    if (!menuId || totalCoordinators <= 0) return 0;
    
    const confirmations = Models.Confirmation.getByMenuId(menuId);
    return Math.round((confirmations.length / totalCoordinators) * 100);
  },
  
  /**
   * Obtiene los coordinadores activos (que han confirmado en las últimas 2 semanas)
   * @param {Array} confirmations - Lista de confirmaciones
   * @param {Array} coordinators - Lista de coordinadores
   * @returns {Array} Lista de coordinadores activos
   * @private
   */
  _getActiveCoordinators: function(confirmations, coordinators) {
    if (!confirmations || !coordinators) return [];
    
    // Obtener fecha de hace 2 semanas
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Filtrar confirmaciones recientes
    const recentConfirmations = confirmations.filter(c => {
      const confirmationDate = new Date(c.createdAt || c.updatedAt);
      return confirmationDate >= twoWeeksAgo;
    });
    
    // Obtener IDs de coordinadores activos
    const activeCoordinatorIds = recentConfirmations.map(c => c.coordinatorId);
    
    // Filtrar coordinadores activos
    return coordinators.filter(c => activeCoordinatorIds.includes(c.id));
  },
  
  /**
   * Calcula la tendencia de asistencia
   * @param {Array} confirmations - Lista de confirmaciones
   * @returns {Object} Datos de tendencia
   * @private
   */
  _calculateAttendanceTrend: function(confirmations) {
    if (!confirmations || confirmations.length === 0) {
      return {
        weeklyData: Array(this.config.maxHistoryItems).fill(0),
        weeklyChange: 0
      };
    }
    
    // Agrupar confirmaciones por semana
    const weekMap = new Map();
    
    confirmations.forEach(confirmation => {
      const weekStart = new Date(confirmation.weekStart);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          date: weekStart,
          count: 0,
          totalPeople: 0
        });
      }
      
      const weekData = weekMap.get(weekKey);
      weekData.count++;
      
      // Sumar personas confirmadas
      confirmation.confirmations.forEach(dayConf => {
        weekData.totalPeople += Number(dayConf.peopleCount) || 0;
      });
    });
    
    // Convertir a array y ordenar por fecha (más reciente primero)
    const sortedWeeks = Array.from(weekMap.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, this.config.maxHistoryItems)
      .reverse();
    
    // Extraer datos de personas confirmadas
    const attendanceData = sortedWeeks.map(week => week.totalPeople);
    
    // Calcular cambio porcentual
    let weeklyChange = 0;
    if (attendanceData.length >= 2) {
      const currentWeek = attendanceData[attendanceData.length - 1];
      const previousWeek = attendanceData[attendanceData.length - 2];
      
      if (previousWeek > 0) {
        weeklyChange = Math.round(((currentWeek - previousWeek) / previousWeek) * 100);
      } else if (currentWeek > 0) {
        weeklyChange = 100; // Si la semana anterior era 0, el incremento es del 100%
      }
    }
    
    return {
      weeklyData: attendanceData,
      weeklyChange
    };
  },
  
  /**
   * Configura los eventos del dashboard
   * @private
   */
  _setupEvents: function() {
    // Delegación de eventos para el contenedor del dashboard
    document.addEventListener('click', event => {
      // Evento para limpiar datos antiguos
      if (event.target.classList.contains('storage-cleanup-link')) {
        event.preventDefault();
        this._handleStorageCleanup();
      }
    });
  },
  
  /**
   * Maneja la limpieza de almacenamiento
   * @private
   */
  _handleStorageCleanup: function() {
    // Mostrar confirmación
    if (typeof Components !== 'undefined') {
      Components.showConfirm(
        'Limpiar datos antiguos',
        '¿Está seguro de que desea archivar y limpiar datos antiguos? Esta acción moverá menús y confirmaciones antiguas al archivo y eliminará datos muy antiguos para liberar espacio.',
        () => {
          // Ejecutar limpieza
          StorageManager.archiveOldData()
            .then(() => StorageManager.cleanupArchivedData())
            .then(() => {
              // Actualizar métricas
              this.loadMetrics().then(() => this.updateCards());
              
              // Mostrar mensaje de éxito
              Components.showToast('Limpieza de datos completada correctamente.', 'success');
            })
            .catch(error => {
              console.error('Error al limpiar datos:', error);
              Components.showToast('Error al limpiar datos: ' + error.message, 'danger');
            });
        }
      );
    }
  }
};

// Exportar el objeto Dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
