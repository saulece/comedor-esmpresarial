/**
 * realtime-demo.js
 * Ejemplo de uso de sincronización en tiempo real con Firebase
 * Este archivo muestra cómo integrar la sincronización en tiempo real
 * en las páginas existentes del sistema de comedor empresarial.
 */

import RealtimeSync from './firebase-realtime.js';
import { auth, onAuthStateChanged } from './firebase-config.js';
import FirebaseAuth from './firebase-auth.js';
import MenuModel from './firebase-menu-model.js';
import CoordinatorModel from './firebase-coordinator-model.js';
import AttendanceModel from './firebase-attendance-model.js';
import { logError, logCustomEvent } from './firebase-monitoring.js';

/**
 * Clase para gestionar la sincronización en tiempo real en la página de coordinador
 */
class CoordinatorRealtimeManager {
    constructor() {
        // Listeners activos
        this.listeners = {};
        
        // Estado actual
        this.currentCoordinator = null;
        this.currentMenu = null;
        this.currentAttendance = null;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el gestor de sincronización
     */
    async init() {
        try {
            console.log('Inicializando sincronización en tiempo real...');
            
            // Verificar autenticación
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.setupRealtimeSync(user);
                } else {
                    this.clearRealtimeSync();
                }
            });
            
            // Manejar cierre de sesión
            document.getElementById('logout-btn')?.addEventListener('click', async () => {
                await FirebaseAuth.logout();
                window.location.href = 'index.html';
            });
            
        } catch (error) {
            logError(error, { operation: 'initRealtimeManager' });
            console.error('Error al inicializar sincronización en tiempo real:', error);
        }
    }
    
    /**
     * Configura la sincronización en tiempo real para un usuario autenticado
     * @param {Object} user - Usuario autenticado
     */
    async setupRealtimeSync(user) {
        try {
            console.log('Configurando sincronización en tiempo real para usuario:', user.email);
            
            // Escuchar cambios en menús activos
            this.listeners.activeMenus = RealtimeSync.listenToActiveMenus((menus) => {
                console.log('Menús activos actualizados:', menus);
                this.updateMenuUI(menus);
            });
            
            // Obtener información del coordinador
            const coordinatorId = localStorage.getItem('coordinator_id');
            
            if (coordinatorId) {
                // Obtener datos del coordinador
                const coordinator = await CoordinatorModel.getById(coordinatorId);
                this.currentCoordinator = coordinator;
                
                if (coordinator) {
                    // Actualizar UI con datos del coordinador
                    this.updateCoordinatorUI(coordinator);
                    
                    // Escuchar cambios en las confirmaciones del coordinador
                    this.listeners.coordinatorAttendance = RealtimeSync.listenToCoordinatorAttendance(
                        coordinatorId,
                        (confirmations) => {
                            console.log('Confirmaciones actualizadas:', confirmations);
                            this.updateAttendanceUI(confirmations);
                        }
                    );
                }
            }
            
            // Registrar evento
            logCustomEvent('realtime_sync_setup', { user: user.email });
            
        } catch (error) {
            logError(error, { operation: 'setupRealtimeSync' });
            console.error('Error al configurar sincronización en tiempo real:', error);
        }
    }
    
    /**
     * Limpia todos los listeners de sincronización en tiempo real
     */
    clearRealtimeSync() {
        console.log('Limpiando sincronización en tiempo real...');
        
        // Cancelar todos los listeners
        for (const key in this.listeners) {
            RealtimeSync.cancelListener(this.listeners[key]);
        }
        
        // Limpiar referencias
        this.listeners = {};
        this.currentCoordinator = null;
        this.currentMenu = null;
        this.currentAttendance = null;
    }
    
    /**
     * Actualiza la interfaz de usuario con los menús activos
     * @param {Array} menus - Menús activos
     */
    updateMenuUI(menus) {
        const menuContainer = document.getElementById('current-menu');
        
        if (!menuContainer) return;
        
        if (!menus || menus.length === 0) {
            menuContainer.innerHTML = '<p class="empty-state">No hay menú disponible para esta semana.</p>';
            return;
        }
        
        // Tomar el primer menú activo
        const menu = menus[0];
        this.currentMenu = menu;
        
        // Construir HTML del menú
        let html = `
            <div class="menu-header">
                <h4>${menu.name || 'Menú Semanal'}</h4>
                <span class="menu-date">${new Date(menu.date).toLocaleDateString()}</span>
            </div>
            <div class="menu-items">
        `;
        
        // Agrupar items por día
        const itemsByDay = {};
        
        if (Array.isArray(menu.items)) {
            menu.items.forEach(item => {
                if (!itemsByDay[item.day]) {
                    itemsByDay[item.day] = [];
                }
                itemsByDay[item.day].push(item);
            });
        }
        
        // Días de la semana
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayNames = {
            'monday': 'Lunes',
            'tuesday': 'Martes',
            'wednesday': 'Miércoles',
            'thursday': 'Jueves',
            'friday': 'Viernes'
        };
        
        // Generar HTML para cada día
        days.forEach(day => {
            const items = itemsByDay[day] || [];
            
            html += `
                <div class="menu-day">
                    <h5>${dayNames[day]}</h5>
                    <ul class="dish-list">
            `;
            
            if (items.length === 0) {
                html += '<li class="empty-day">No hay platillos para este día</li>';
            } else {
                items.forEach(item => {
                    html += `
                        <li class="dish-item">
                            <span class="dish-name">${item.name}</span>
                            <span class="dish-category">${item.category}</span>
                        </li>
                    `;
                });
            }
            
            html += `
                    </ul>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Actualizar contenedor
        menuContainer.innerHTML = html;
    }
    
    /**
     * Actualiza la interfaz de usuario con los datos del coordinador
     * @param {Object} coordinator - Datos del coordinador
     */
    updateCoordinatorUI(coordinator) {
        const coordinatorName = document.getElementById('coordinator-name');
        
        if (coordinatorName) {
            coordinatorName.textContent = coordinator.name || 'Coordinador';
        }
        
        // Actualizar otros elementos de la UI según sea necesario
    }
    
    /**
     * Actualiza la interfaz de usuario con las confirmaciones de asistencia
     * @param {Array} confirmations - Confirmaciones de asistencia
     */
    updateAttendanceUI(confirmations) {
        const confirmationsContainer = document.getElementById('confirmations-list');
        
        if (!confirmationsContainer) return;
        
        if (!confirmations || confirmations.length === 0) {
            confirmationsContainer.innerHTML = '<p class="empty-state">No hay confirmaciones de asistencia.</p>';
            return;
        }
        
        // Ordenar confirmaciones por fecha (más recientes primero)
        confirmations.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Construir HTML de confirmaciones
        let html = '';
        
        confirmations.forEach(confirmation => {
            const weekStart = new Date(confirmation.weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 4); // Viernes
            
            html += `
                <div class="confirmation-item" data-id="${confirmation.id}">
                    <div class="confirmation-header">
                        <h4>Semana del ${weekStart.toLocaleDateString()} al ${weekEnd.toLocaleDateString()}</h4>
                    </div>
                    <div class="confirmation-details">
                        <table class="attendance-table">
                            <thead>
                                <tr>
                                    <th>Día</th>
                                    <th>Asistentes</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Días de la semana
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const dayNames = {
                'monday': 'Lunes',
                'tuesday': 'Martes',
                'wednesday': 'Miércoles',
                'thursday': 'Jueves',
                'friday': 'Viernes'
            };
            
            // Generar filas para cada día
            days.forEach(day => {
                const count = confirmation.attendanceCounts?.[day] || 0;
                
                html += `
                    <tr data-day="${day}">
                        <td>${dayNames[day]}</td>
                        <td>
                            <span class="attendance-count">${count}</span>
                        </td>
                        <td>
                            <button class="btn-small edit-attendance" data-day="${day}" data-count="${count}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        // Actualizar contenedor
        confirmationsContainer.innerHTML = html;
        
        // Agregar event listeners para botones de edición
        const editButtons = confirmationsContainer.querySelectorAll('.edit-attendance');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const day = e.currentTarget.dataset.day;
                const currentCount = parseInt(e.currentTarget.dataset.count) || 0;
                const confirmationId = e.currentTarget.closest('.confirmation-item').dataset.id;
                
                this.showEditAttendanceDialog(confirmationId, day, currentCount);
            });
        });
    }
    
    /**
     * Muestra un diálogo para editar la asistencia de un día
     * @param {string} confirmationId - ID de la confirmación
     * @param {string} day - Día de la semana
     * @param {number} currentCount - Conteo actual
     */
    showEditAttendanceDialog(confirmationId, day, currentCount) {
        const dayNames = {
            'monday': 'Lunes',
            'tuesday': 'Martes',
            'wednesday': 'Miércoles',
            'thursday': 'Jueves',
            'friday': 'Viernes'
        };
        
        const newCount = prompt(`Ingrese el número de asistentes para ${dayNames[day]}:`, currentCount);
        
        if (newCount !== null) {
            const count = parseInt(newCount);
            
            if (!isNaN(count) && count >= 0) {
                this.updateAttendanceCount(confirmationId, day, count);
            } else {
                alert('Por favor ingrese un número válido.');
            }
        }
    }
    
    /**
     * Actualiza el conteo de asistencia para un día
     * @param {string} confirmationId - ID de la confirmación
     * @param {string} day - Día de la semana
     * @param {number} count - Nuevo conteo
     */
    async updateAttendanceCount(confirmationId, day, count) {
        try {
            await AttendanceModel.updateDayCount(confirmationId, day, count);
            
            // No es necesario actualizar la UI manualmente,
            // ya que el listener de tiempo real lo hará automáticamente
            
            // Registrar evento
            logCustomEvent('attendance_updated', { confirmationId, day, count });
            
        } catch (error) {
            logError(error, { operation: 'updateAttendanceCount', confirmationId, day, count });
            console.error('Error al actualizar asistencia:', error);
            alert('Error al actualizar la asistencia. Por favor intente de nuevo.');
        }
    }
}

// Exportar clase
export default CoordinatorRealtimeManager;
