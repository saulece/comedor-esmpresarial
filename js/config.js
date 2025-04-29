/**
 * Configuración global del Sistema de Confirmación de Asistencias
 * Este archivo contiene constantes y configuraciones utilizadas en toda la aplicación
 */

const CONFIG = {
  // Nombre de la aplicación
  APP_NAME: 'Sistema de Confirmación de Asistencias - Comedor Empresarial',
  
  // Claves para localStorage
  STORAGE_KEYS: {
    USERS: 'comedor_users',
    CURRENT_USER: 'comedor_current_user',
    MENUS: 'comedor_menus',
    CONFIRMATIONS: 'comedor_confirmations'
  },
  
  // Roles de usuario
  ROLES: {
    ADMIN: 'admin',
    COORDINATOR: 'coordinator'
  },
  
  // Estados de menú
  MENU_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  },
  
  // Días de la semana
  DAYS_OF_WEEK: [
    { id: 0, name: 'Domingo', shortName: 'Dom' },
    { id: 1, name: 'Lunes', shortName: 'Lun' },
    { id: 2, name: 'Martes', shortName: 'Mar' },
    { id: 3, name: 'Miércoles', shortName: 'Mié' },
    { id: 4, name: 'Jueves', shortName: 'Jue' },
    { id: 5, name: 'Viernes', shortName: 'Vie' },
    { id: 6, name: 'Sábado', shortName: 'Sáb' }
  ],
  
  // Formato de fecha predeterminado
  DEFAULT_DATE_FORMAT: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  },
  
  // Usuario administrador predeterminado (se crea si no existe ningún usuario)
  DEFAULT_ADMIN: {
    id: 'admin-default',
    username: 'admin',
    password: 'admin123', // Esto debería cambiarse en producción
    name: 'Administrador',
    role: 'admin'
  }
};
