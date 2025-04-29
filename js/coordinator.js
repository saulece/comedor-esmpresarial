/**
 * Funcionalidades del coordinador para el Sistema de Confirmación de Asistencias
 * Maneja la visualización de menús y confirmación de asistencias
 */

const Coordinator = {
  /**
   * Inicializa el módulo de coordinador
   */
  init: function() {
    // Solo inicializar si el usuario es coordinador
    if (!Auth.hasRole(CONFIG.ROLES.COORDINATOR)) return;
    
    // Cargar menú activo
    this._loadActiveMenu();
  },

  /**
   * Carga el menú activo y muestra el formulario de confirmación
   * @private
   */
  _loadActiveMenu: function() {
    const menuViewContainer = document.getElementById('coordinator-menu-view');
    const attendanceFormContainer = document.getElementById('attendance-form-container');
    
    if (!menuViewContainer || !attendanceFormContainer) return;
    
    try {
      // Obtener menú activo
      const activeMenu = Models.Menu.getActiveMenu();
      
      if (!activeMenu) {
        menuViewContainer.innerHTML = '<div class="alert alert-info">No hay menús publicados actualmente.</div>';
        attendanceFormContainer.innerHTML = '';
        return;
      }
      
      // Mostrar menú
      this._displayMenu(activeMenu, menuViewContainer);
      
      // Mostrar formulario de confirmación
      this._displayAttendanceForm(activeMenu, attendanceFormContainer);
      
    } catch (error) {
      console.error('Error al cargar menú activo:', error);
      menuViewContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
  },

  /**
   * Muestra el menú en el contenedor especificado
   * @param {Object} menu - Menú a mostrar
   * @param {HTMLElement} container - Contenedor donde mostrar el menú
   * @private
   */
  _displayMenu: function(menu, container) {
    let html = `<h3>Menú Semanal - Semana del ${Utils.formatDate(menu.weekStartDate)}</h3>`;
    
    html += '<div class="menu-cards">';
    
    menu.days.forEach(day => {
      const dayName = CONFIG.DAYS_OF_WEEK[day.dayOfWeek].name;
      const dateFormatted = Utils.formatDate(day.date);
      
      html += `
        <div class="card menu-day-card mb-3">
          <div class="card-header">
            <h4>${dayName} - ${dateFormatted}</h4>
          </div>
          <div class="card-body">
            <p><strong>Plato principal:</strong> ${day.mainDish || 'No especificado'}</p>
            <p><strong>Guarnición:</strong> ${day.sideDish || 'No especificada'}</p>
            <p><strong>Bebida:</strong> ${day.beverage || 'No especificada'}</p>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Muestra el formulario de confirmación de asistencia
   * @param {Object} menu - Menú para el que se confirma asistencia
   * @param {HTMLElement} container - Contenedor donde mostrar el formulario
   * @private
   */
  _displayAttendanceForm: function(menu, container) {
    try {
      // Obtener confirmación existente para este coordinador y menú
      const existingConfirmation = Models.Confirmation.getByCoordinatorAndMenu(
        Auth.currentUser.id,
        menu.id
      );
      
      let html = `
        <div class="card">
          <div class="card-header">
            <h3>Confirmación de Asistencias</h3>
            <p>Indique el número de personas que asistirán cada día</p>
          </div>
          <div class="card-body">
            <form id="attendance-form" class="form attendance-form">
              <input type="hidden" id="menu-id" value="${menu.id}">
              <input type="hidden" id="confirmation-id" value="${existingConfirmation ? existingConfirmation.id : ''}">
      `;
      
      // Obtener el máximo de personas para este coordinador
      const maxPeople = Auth.currentUser.maxPeople || 0;
      
      menu.days.forEach(day => {
        const dayName = CONFIG.DAYS_OF_WEEK[day.dayOfWeek].name;
        const dateFormatted = Utils.formatDate(day.date);
        
        // Obtener valor existente si hay una confirmación previa
        let currentValue = 0;
        if (existingConfirmation) {
          const dayConf = existingConfirmation.confirmations.find(c => c.dayOfWeek === day.dayOfWeek);
          if (dayConf) {
            currentValue = dayConf.peopleCount || 0;
          }
        }
        
        html += `
          <div class="form-group">
            <label for="attendance-${day.dayOfWeek}">
              ${dayName} - ${dateFormatted}:
            </label>
            <input 
              type="number" 
              id="attendance-${day.dayOfWeek}" 
              name="attendance-${day.dayOfWeek}" 
              min="0" 
              max="${maxPeople}"
              value="${currentValue}"
              data-day="${day.dayOfWeek}"
              data-date="${day.date}"
              required
            >
            <small class="form-text text-muted">Máximo: ${maxPeople} personas</small>
          </div>
        `;
      });
      
      html += `
              <div class="form-group text-center">
                <button type="submit" class="btn btn-primary">Guardar Confirmación</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      // Mostrar historial de confirmaciones
      html += `
        <div class="card mt-4">
          <div class="card-header">
            <h3>Historial de Confirmaciones</h3>
          </div>
          <div class="card-body" id="confirmation-history">
            <p class="text-center">Cargando historial...</p>
          </div>
        </div>
      `;
      
      container.innerHTML = html;
      
      // Configurar evento de envío del formulario
      const attendanceForm = document.getElementById('attendance-form');
      if (attendanceForm) {
        attendanceForm.addEventListener('submit', (event) => {
          event.preventDefault();
          this._saveAttendance();
        });
      }
      
      // Cargar historial de confirmaciones
      this._loadConfirmationHistory();
      
    } catch (error) {
      console.error('Error al mostrar formulario de confirmación:', error);
      container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
  },

  /**
   * Guarda la confirmación de asistencia
   * @private
   */
  _saveAttendance: function() {
    try {
      const attendanceForm = document.getElementById('attendance-form');
      if (!Utils.validateForm(attendanceForm)) return;
      
      const menuId = document.getElementById('menu-id').value;
      const confirmationId = document.getElementById('confirmation-id').value;
      
      // Recopilar datos de asistencia
      const attendanceInputs = attendanceForm.querySelectorAll('input[type="number"]');
      const confirmations = [];
      
      attendanceInputs.forEach(input => {
        confirmations.push({
          dayOfWeek: parseInt(input.getAttribute('data-day'), 10),
          date: input.getAttribute('data-date'),
          peopleCount: parseInt(input.value, 10) || 0
        });
      });
      
      // Datos de la confirmación
      const confirmationData = {
        coordinatorId: Auth.currentUser.id,
        menuId: menuId,
        confirmations: confirmations
      };
      
      // Crear o actualizar confirmación
      let confirmation;
      if (confirmationId) {
        confirmation = Models.Confirmation.update(confirmationId, confirmationData);
        Utils.showNotification('Confirmación actualizada correctamente', 'success');
      } else {
        confirmation = Models.Confirmation.create(confirmationData);
        Utils.showNotification('Confirmación guardada correctamente', 'success');
        
        // Actualizar ID en el formulario
        document.getElementById('confirmation-id').value = confirmation.id;
      }
      
      // Actualizar historial
      this._loadConfirmationHistory();
      
    } catch (error) {
      console.error('Error al guardar confirmación:', error);
      Utils.showNotification(`Error: ${error.message}`, 'error');
    }
  },

  /**
   * Carga el historial de confirmaciones
   * @private
   */
  _loadConfirmationHistory: function() {
    const historyContainer = document.getElementById('confirmation-history');
    if (!historyContainer) return;
    
    try {
      // Obtener todas las confirmaciones de este coordinador
      const allConfirmations = Models.Confirmation.getAll();
      const coordinatorConfirmations = allConfirmations.filter(
        conf => conf.coordinatorId === Auth.currentUser.id
      );
      
      if (coordinatorConfirmations.length === 0) {
        historyContainer.innerHTML = '<p class="text-center">No hay confirmaciones registradas</p>';
        return;
      }
      
      // Ordenar por fecha (más reciente primero)
      coordinatorConfirmations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Obtener menús
      const menus = Models.Menu.getAll();
      
      let html = '<div class="table-container"><table class="table">';
      html += `
        <thead>
          <tr>
            <th>Semana</th>
            <th>Fecha de Confirmación</th>
            <th>Total Personas</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      coordinatorConfirmations.forEach(conf => {
        // Obtener menú relacionado
        const menu = menus.find(m => m.id === conf.menuId);
        if (!menu) return;
        
        // Calcular total de personas
        const totalPeople = conf.confirmations.reduce(
          (sum, dayConf) => sum + (parseInt(dayConf.peopleCount, 10) || 0), 
          0
        );
        
        html += `
          <tr>
            <td>Semana del ${Utils.formatDate(menu.weekStartDate)}</td>
            <td>${Utils.formatDate(conf.createdAt)}</td>
            <td>${totalPeople}</td>
            <td>
              <button class="btn btn-sm btn-info view-details-btn" data-id="${conf.id}">
                Ver Detalles
              </button>
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      
      // Contenedor para detalles
      html += '<div id="confirmation-details" class="mt-3"></div>';
      
      historyContainer.innerHTML = html;
      
      // Configurar eventos para botones de detalles
      historyContainer.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', () => {
          const confId = button.getAttribute('data-id');
          this._showConfirmationDetails(confId);
        });
      });
      
    } catch (error) {
      console.error('Error al cargar historial de confirmaciones:', error);
      historyContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
    }
  },

  /**
   * Muestra los detalles de una confirmación
   * @param {string} confirmationId - ID de la confirmación
   * @private
   */
  _showConfirmationDetails: function(confirmationId) {
    const detailsContainer = document.getElementById('confirmation-details');
    if (!detailsContainer) return;
    
    try {
      const confirmation = Models.Confirmation.getById(confirmationId);
      if (!confirmation) throw new Error('Confirmación no encontrada');
      
      // Obtener menú relacionado
      const menu = Models.Menu.getById(confirmation.menuId);
      if (!menu) throw new Error('Menú no encontrado');
      
      let html = `
        <div class="card">
          <div class="card-header">
            <h4>Detalles de Confirmación - Semana del ${Utils.formatDate(menu.weekStartDate)}</h4>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Fecha</th>
                    <th>Menú</th>
                    <th>Personas</th>
                  </tr>
                </thead>
                <tbody>
      `;
      
      // Ordenar confirmaciones por día de la semana
      confirmation.confirmations.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      
      confirmation.confirmations.forEach(dayConf => {
        // Obtener información del día del menú
        const menuDay = menu.days.find(d => d.dayOfWeek === dayConf.dayOfWeek);
        if (!menuDay) return;
        
        const dayName = CONFIG.DAYS_OF_WEEK[dayConf.dayOfWeek].name;
        
        html += `
          <tr>
            <td>${dayName}</td>
            <td>${Utils.formatDate(dayConf.date)}</td>
            <td>
              <strong>${menuDay.mainDish || 'No especificado'}</strong><br>
              <small>${menuDay.sideDish || 'No especificada'} / ${menuDay.beverage || 'No especificada'}</small>
            </td>
            <td><strong>${dayConf.peopleCount || 0}</strong></td>
          </tr>
        `;
      });
      
      // Calcular total
      const totalPeople = confirmation.confirmations.reduce(
        (sum, dayConf) => sum + (parseInt(dayConf.peopleCount, 10) || 0), 
        0
      );
      
      html += `
                  <tr class="table-active">
                    <td colspan="3"><strong>TOTAL</strong></td>
                    <td><strong>${totalPeople}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-muted mt-2">
              Última actualización: ${Utils.formatDate(confirmation.updatedAt || confirmation.createdAt)}
            </p>
          </div>
        </div>
      `;
      
      detailsContainer.innerHTML = html;
      
    } catch (error) {
      console.error('Error al mostrar detalles de confirmación:', error);
      detailsContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
  }
};
