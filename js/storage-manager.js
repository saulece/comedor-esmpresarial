/**
 * Sistema de Confirmación de Asistencias para Comedor Empresarial
 * Módulo de gestión de almacenamiento y persistencia de datos
 * 
 * Este archivo contiene funciones para gestionar eficientemente el almacenamiento local,
 * incluyendo archivado, compresión, limpieza automática y respaldo/restauración de datos.
 */

const StorageManager = {
  /**
   * Configuración del sistema de almacenamiento
   */
  config: {
    // Tiempo máximo (en días) para mantener datos activos antes de archivarlos
    archiveThreshold: 30,
    
    // Tiempo máximo (en días) para mantener datos archivados antes de eliminarlos
    cleanupThreshold: 90,
    
    // Tamaño máximo aproximado (en bytes) para el almacenamiento local
    maxStorageSize: 4.5 * 1024 * 1024, // ~4.5MB (localStorage suele tener un límite de 5MB)
    
    // Claves para datos archivados
    archivedDataKey: 'comedor_archived_data',
    
    // Claves de archivo para tipos específicos
    archiveKeys: {
      MENUS: 'comedor_archived_menus',
      CONFIRMATIONS: 'comedor_archived_confirmations'
    },
    
    // Clave para configuración
    configKey: 'comedor_storage_config',
    
    // Claves para respaldo
    backupKeys: {
      BACKUP: 'comedor_backup_data',
      BACKUP_DATE: 'comedor_backup_date'
    }
  },
  
  /**
   * Inicializa el sistema de gestión de almacenamiento
   */
  init: function() {
    console.log('Inicializando sistema de gestión de almacenamiento...');
    
    // Verificar espacio disponible al iniciar
    this.checkStorageSpace();
    
    // Programar limpieza automática cada día (si el usuario mantiene la aplicación abierta)
    setInterval(() => {
      this.archiveOldData();
      this.cleanupArchivedData();
      this.checkStorageSpace();
    }, 24 * 60 * 60 * 1000); // 24 horas
    
    // Ejecutar limpieza inicial
    this.archiveOldData();
    this.cleanupArchivedData();
  },
  
  /**
   * Archiva datos antiguos (menús y confirmaciones) que superan el umbral de antigüedad
   * 
   * Este proceso mueve los datos antiguos desde el almacenamiento activo al almacenamiento
   * de archivo para optimizar el rendimiento del sistema y reducir el uso de memoria.
   * Los datos archivados siguen siendo accesibles pero no se cargan en la interfaz principal.
   * 
   * @param {number} thresholdDays - Días de antigüedad para archivar (opcional, usa config.archiveThreshold por defecto)
   * @returns {Object} Resultado de la operación con información sobre el éxito y cantidad de elementos archivados
   */
  archiveOldData: function(thresholdDays) {
    try {
      // Usar umbral configurado si no se especifica uno
      const threshold = thresholdDays || this.config.archiveThreshold;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - threshold);
      
      console.log(`Archivando datos anteriores a ${thresholdDate.toLocaleDateString()}...`);
      
      // Obtener datos actuales
      const menus = Models.getAllMenus() || [];
      const confirmations = Models.getAllConfirmations() || [];
      
      // Obtener datos ya archivados
      const archivedData = Utils.getFromStorage(this.config.archivedDataKey) || {
        menus: [],
        confirmations: []
      };
      
      // Identificar menús antiguos para archivar
      const currentMenus = [];
      const menusToArchive = [];
      
      menus.forEach(menu => {
        const menuDate = new Date(menu.weekStart);
        if (menuDate < thresholdDate) {
          menusToArchive.push(menu);
        } else {
          currentMenus.push(menu);
        }
      });
      
      // Identificar confirmaciones antiguas para archivar
      const currentConfirmations = [];
      const confirmationsToArchive = [];
      
      confirmations.forEach(confirmation => {
        const confirmationDate = new Date(confirmation.weekStart);
        if (confirmationDate < thresholdDate) {
          confirmationsToArchive.push(confirmation);
        } else {
          currentConfirmations.push(confirmation);
        }
      });
      
      // Actualizar datos archivados
      archivedData.menus = [...archivedData.menus, ...menusToArchive];
      archivedData.confirmations = [...archivedData.confirmations, ...confirmationsToArchive];
      
      // Guardar datos archivados
      Utils.saveToStorage(this.config.archivedDataKey, archivedData);
      
      // Actualizar datos activos
      if (menusToArchive.length > 0) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, currentMenus);
      }
      
      if (confirmationsToArchive.length > 0) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, currentConfirmations);
      }
      
      const totalArchived = menusToArchive.length + confirmationsToArchive.length;
      console.log(`Archivado completado: ${menusToArchive.length} menús y ${confirmationsToArchive.length} confirmaciones archivadas.`);
      
      return {
        success: true,
        archivedCount: totalArchived,
        archivedMenus: menusToArchive.length,
        archivedConfirmations: confirmationsToArchive.length
      };
    } catch (error) {
      console.error('Error al archivar datos antiguos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Archiva menús antiguos
   * @param {Date} archiveDate - Fecha límite para archivar
   * @returns {number} Número de menús archivados
   * @private
   */
  _archiveOldMenus: function(archiveDate) {
    // Obtener menús actuales
    const menus = Utils.getFromStorage(CONFIG.STORAGE_KEYS.MENUS, []);
    
    // Obtener menús archivados existentes
    const archivedMenus = Utils.getFromStorage(this.config.archiveKeys.MENUS, []);
    
    // Filtrar menús a archivar (publicados y con fecha anterior al límite)
    const menusToArchive = menus.filter(menu => {
      const menuDate = new Date(menu.weekStart);
      return menuDate < archiveDate && menu.status === CONFIG.MENU_STATUS.PUBLISHED;
    });
    
    if (menusToArchive.length === 0) {
      return 0;
    }
    
    // Actualizar estado de los menús a archivar
    menusToArchive.forEach(menu => {
      menu.status = CONFIG.MENU_STATUS.ARCHIVED;
      menu.archivedAt = new Date().toISOString();
    });
    
    // Combinar con menús archivados existentes
    const updatedArchivedMenus = [...archivedMenus, ...menusToArchive];
    
    // Guardar menús archivados
    Utils.saveToStorage(this.config.archiveKeys.MENUS, updatedArchivedMenus);
    
    // Actualizar lista de menús activos (eliminar los archivados)
    const activeMenus = menus.filter(menu => !menusToArchive.some(m => m.id === menu.id));
    Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, activeMenus);
    
    return menusToArchive.length;
  },
  
  /**
   * Archiva confirmaciones antiguas
   * @param {Date} archiveDate - Fecha límite para archivar
   * @returns {number} Número de confirmaciones archivadas
   * @private
   */
  _archiveOldConfirmations: function(archiveDate) {
    // Obtener confirmaciones actuales
    const confirmations = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, []);
    
    // Obtener confirmaciones archivadas existentes
    const archivedConfirmations = Utils.getFromStorage(this.config.archiveKeys.CONFIRMATIONS, []);
    
    // Filtrar confirmaciones a archivar (con fecha anterior al límite)
    const confirmationsToArchive = confirmations.filter(confirmation => {
      const confirmationDate = new Date(confirmation.weekStart);
      return confirmationDate < archiveDate;
    });
    
    if (confirmationsToArchive.length === 0) {
      return 0;
    }
    
    // Marcar como archivadas
    confirmationsToArchive.forEach(confirmation => {
      confirmation.archived = true;
      confirmation.archivedAt = new Date().toISOString();
    });
    
    // Combinar con confirmaciones archivadas existentes
    const updatedArchivedConfirmations = [...archivedConfirmations, ...confirmationsToArchive];
    
    // Guardar confirmaciones archivadas
    Utils.saveToStorage(this.config.archiveKeys.CONFIRMATIONS, updatedArchivedConfirmations);
    
    // Actualizar lista de confirmaciones activas (eliminar las archivadas)
    const activeConfirmations = confirmations.filter(
      confirmation => !confirmationsToArchive.some(c => c.id === confirmation.id)
    );
    Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, activeConfirmations);
    
    return confirmationsToArchive.length;
  },
  
  /**
   * Limpia datos archivados que superan el umbral de antigüedad
   * @returns {Object} Estadísticas del proceso de limpieza
   */
  cleanupArchivedData: function() {
    console.log('Limpiando datos archivados antiguos...');
    const stats = { menus: 0, confirmations: 0 };
    
    try {
      // Establecer fecha límite para eliminar (90 días atrás por defecto)
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - this.config.cleanupThreshold);
      
      // Limpiar menús archivados antiguos
      stats.menus = this._cleanupArchivedMenus(cleanupDate);
      
      // Limpiar confirmaciones archivadas antiguas
      stats.confirmations = this._cleanupArchivedConfirmations(cleanupDate);
      
      console.log(`Limpieza completada: ${stats.menus} menús y ${stats.confirmations} confirmaciones eliminadas.`);
      return stats;
    } catch (error) {
      console.error('Error al limpiar datos archivados:', error);
      return stats;
    }
  },
  
  /**
   * Limpia menús archivados antiguos
   * @param {Date} cleanupDate - Fecha límite para eliminar
   * @returns {number} Número de menús eliminados
   * @private
   */
  _cleanupArchivedMenus: function(cleanupDate) {
    // Obtener menús archivados
    const archivedMenus = Utils.getFromStorage(this.config.archiveKeys.MENUS, []);
    
    // Filtrar menús a eliminar (con fecha de archivado anterior al límite)
    const menusToKeep = archivedMenus.filter(menu => {
      const archivedDate = new Date(menu.archivedAt || menu.updatedAt);
      return archivedDate >= cleanupDate;
    });
    
    // Guardar menús archivados actualizados
    Utils.saveToStorage(this.config.archiveKeys.MENUS, menusToKeep);
    
    return archivedMenus.length - menusToKeep.length;
  },
  
  /**
   * Limpia confirmaciones archivadas antiguas
   * @param {Date} cleanupDate - Fecha límite para eliminar
   * @returns {number} Número de confirmaciones eliminadas
   * @private
   */
  _cleanupArchivedConfirmations: function(cleanupDate) {
    // Obtener confirmaciones archivadas
    const archivedConfirmations = Utils.getFromStorage(this.config.archiveKeys.CONFIRMATIONS, []);
    
    // Filtrar confirmaciones a eliminar (con fecha de archivado anterior al límite)
    const confirmationsToKeep = archivedConfirmations.filter(confirmation => {
      const archivedDate = new Date(confirmation.archivedAt || confirmation.updatedAt);
      return archivedDate >= cleanupDate;
    });
    
    // Guardar confirmaciones archivadas actualizadas
    Utils.saveToStorage(this.config.archiveKeys.CONFIRMATIONS, confirmationsToKeep);
    
    return archivedConfirmations.length - confirmationsToKeep.length;
  },
  
  /**
   * Comprime datos para optimizar el almacenamiento en localStorage
   * 
   * Esta función utiliza la biblioteca LZString para comprimir datos JSON y reducir
   * significativamente su tamaño, lo que permite almacenar más información en el
   * limitado espacio de localStorage. Si LZString no está disponible, se utiliza
   * una compresión básica mediante expresiones regulares.
   * 
   * @param {Object|Array} data - Datos a comprimir (objeto o array)
   * @returns {string} Datos comprimidos en formato string
   */
  compressData: function(data) {
    try {
      if (!data) {
        console.warn('Intentando comprimir datos nulos o indefinidos');
        return null;
      }
      
      // Convertir datos a JSON
      const jsonString = JSON.stringify(data);
      
      // Utilizar LZString para compresión real
      if (typeof LZString !== 'undefined') {
        // Usar compresión UTF16 para mayor compatibilidad
        return LZString.compressToUTF16(jsonString);
      } else {
        // Fallback a compresión básica si LZString no está disponible
        console.warn('LZString no está disponible, usando compresión básica');
        
        // Usar expresiones regulares con banderas globales para reemplazar todas las ocurrencias
        return jsonString
          .replace(/\s+/g, '') // Eliminar espacios en blanco
          .replace(/":\s*"/g, '":"') // Normalizar pares clave-valor
          .replace(/",\s*"/g, '","') // Normalizar separadores de valores
          .replace(/}\]/g, '}]'); // Reducir espacios al final de arrays
      }
    } catch (error) {
      console.error('Error al comprimir datos:', error);
      return JSON.stringify(data);
    }
  },
  
  /**
   * Descomprime datos previamente comprimidos
   * @param {string} compressedData - Datos comprimidos
   * @returns {Object|Array} Datos descomprimidos
   */
  decompressData: function(compressedData) {
    try {
      // Intentar descomprimir con LZString primero
      if (typeof LZString !== 'undefined') {
        try {
          // Intentar descomprimir como datos comprimidos con LZString
          const decompressed = LZString.decompressFromUTF16(compressedData);
          if (decompressed) {
            return JSON.parse(decompressed);
          }
        } catch (lzError) {
          console.warn('Error al descomprimir con LZString, intentando como JSON plano:', lzError);
        }
      }
      
      // Fallback: intentar parsear directamente como JSON
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Error al descomprimir datos:', error);
      return null;
    }
  },
  
  /**
   * Obtiene una configuración del almacenamiento
   * @param {string} key - Clave de la configuración
   * @returns {*} Valor de la configuración o null si no existe
   */
  getConfig: function(key) {
    try {
      const config = Utils.getFromStorage('comedor_storage_config') || {};
      return config[key] || null;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      return null;
    }
  },
  
  /**
   * Establece una configuración en el almacenamiento
   * @param {string} key - Clave de la configuración
   * @param {*} value - Valor de la configuración
   * @returns {boolean} true si se guardó correctamente, false en caso contrario
   */
  setConfig: function(key, value) {
    try {
      const config = Utils.getFromStorage('comedor_storage_config') || {};
      config[key] = value;
      Utils.saveToStorage('comedor_storage_config', config);
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  },
  
  /**
   * Obtiene estadísticas del almacenamiento
   * @returns {Object} Estadísticas de uso del almacenamiento
   */
  getStorageStats: function() {
    try {
      // Obtener datos activos
      const menus = Models.getAllMenus() || [];
      const confirmations = Models.getAllConfirmations() || [];
      const users = Models.getAllUsers() || [];
      
      // Obtener datos archivados
      const archivedData = Utils.getFromStorage('comedor_archived_data') || { menus: [], confirmations: [] };
      
      // Calcular tamaño total utilizado (aproximado)
      const activeDataSize = this._calculateStorageSize({
        menus: menus,
        confirmations: confirmations,
        users: users
      });
      
      const archivedDataSize = this._calculateStorageSize(archivedData);
      
      // Calcular espacio total disponible (5MB es el límite típico para localStorage)
      const totalStorage = 5 * 1024 * 1024; // 5MB en bytes
      const usedStorage = activeDataSize + archivedDataSize;
      const usedPercentage = (usedStorage / totalStorage) * 100;
      
      return {
        total: totalStorage,
        used: usedStorage,
        free: totalStorage - usedStorage,
        usedPercentage: usedPercentage,
        activeMenus: menus.length,
        archivedMenus: archivedData.menus ? archivedData.menus.length : 0,
        activeConfirmations: confirmations.length,
        archivedConfirmations: archivedData.confirmations ? archivedData.confirmations.length : 0,
        users: users.length
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de almacenamiento:', error);
      return {
        total: 5 * 1024 * 1024,
        used: 0,
        free: 5 * 1024 * 1024,
        usedPercentage: 0,
        activeMenus: 0,
        archivedMenus: 0,
        activeConfirmations: 0,
        archivedConfirmations: 0,
        users: 0
      };
    }
  },
  
  /**
   * Calcula el tamaño aproximado de los datos en bytes
   * @param {Object} data - Datos a calcular
   * @returns {number} Tamaño aproximado en bytes
   * @private
   */
  _calculateStorageSize: function(data) {
    try {
      // Convertir a JSON y calcular longitud
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Aproximación: cada carácter ocupa 2 bytes en UTF-16
    } catch (error) {
      console.error('Error al calcular tamaño de almacenamiento:', error);
      return 0;
    }
  },
  
  /**
   * Crea un respaldo completo de todos los datos del sistema
   * 
   * Esta función recopila todos los datos importantes del sistema (menús, confirmaciones,
   * usuarios, datos archivados) y crea un respaldo comprimido que se almacena en localStorage.
   * El respaldo incluye metadatos como la versión y la fecha de creación.
   * 
   * @returns {Object} Resultado de la operación con información sobre el éxito y detalles
   */
  createBackup: function() {
    try {
      console.log('Creando respaldo completo del sistema...');
      
      // Verificar espacio disponible antes de crear el respaldo
      const storageInfo = this.checkStorageSpace();
      if (storageInfo.usedPercentage > 90) {
        console.warn('Espacio de almacenamiento casi lleno. Se recomienda limpiar datos antiguos antes de crear un respaldo.');
      }
      
      // Obtener todos los datos activos
      const menus = Utils.getFromStorage(CONFIG.STORAGE_KEYS.MENUS, []);
      const confirmations = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, []);
      const users = Utils.getFromStorage(CONFIG.STORAGE_KEYS.USERS, []);
      
      // Obtener datos archivados
      const archivedData = Utils.getFromStorage(this.config.archivedDataKey, { menus: [], confirmations: [] });
      const archivedMenus = Utils.getFromStorage(this.config.archiveKeys.MENUS, []);
      const archivedConfirmations = Utils.getFromStorage(this.config.archiveKeys.CONFIRMATIONS, []);
      
      // Obtener configuración
      const config = Utils.getFromStorage(this.config.configKey, {});
      
      // Crear objeto de datos para el respaldo
      const backupData = {
        menus: menus,
        confirmations: confirmations,
        users: users,
        archivedData: archivedData,
        archivedMenus: archivedMenus,
        archivedConfirmations: archivedConfirmations,
        config: config,
        timestamp: new Date().toISOString(),
        version: '1.1',
        appName: 'Sistema de Confirmación de Asistencias para Comedor Empresarial'
      };
      
      // Comprimir datos para optimizar almacenamiento
      const compressedData = this.compressData(backupData);
      
      // Guardar respaldo en localStorage
      Utils.saveToStorage(this.config.backupKeys.BACKUP, compressedData);
      Utils.saveToStorage(this.config.backupKeys.BACKUP_DATE, backupData.timestamp);
      
      const backupSize = this._calculateStorageSize(compressedData);
      console.log(`Respaldo creado correctamente (${Math.round(backupSize / 1024)} KB) con fecha: ${backupData.timestamp}`);
      
      return {
        success: true,
        timestamp: backupData.timestamp,
        size: backupSize,
        sizeKB: Math.round(backupSize / 1024),
        version: backupData.version
      };
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Verifica si existe un respaldo
   * @returns {boolean} true si existe un respaldo, false en caso contrario
   */
  hasBackup: function() {
    try {
      const backup = Utils.getFromStorage('comedor_backup');
      return !!backup;
    } catch (error) {
      console.error('Error al verificar respaldo:', error);
      return false;
    }
  },
  
  /**
   * Obtiene el respaldo actual
   * @returns {Object|null} Datos del respaldo o null si no existe
   */
  getBackup: function() {
    try {
      return Utils.getFromStorage('comedor_backup');
    } catch (error) {
      console.error('Error al obtener respaldo:', error);
      return null;
    }
  },
  
  /**
   * Restaura un respaldo completo del sistema
   * 
   * Esta función restaura todos los datos del sistema desde un respaldo previamente
   * creado. Antes de restaurar, valida la estructura del respaldo y realiza una copia
   * de seguridad del estado actual por si es necesario revertir los cambios.
   * 
   * @param {Object} backupData - Datos del respaldo (objeto con propiedades data y date)
   * @returns {Object} Resultado de la operación con información sobre el éxito y detalles
   */
  restoreBackup: function(backupData) {
    try {
      console.log('Iniciando restauración de respaldo...');
      
      // Validar estructura del respaldo
      if (!backupData) {
        throw new Error('No se proporcionaron datos de respaldo');
      }
      
      // Manejar tanto el nuevo formato (objeto con data) como el antiguo (datos directos)
      let dataToRestore;
      
      if (backupData.data) {
        // Nuevo formato
        dataToRestore = backupData.data;
        console.log('Restaurando respaldo con fecha:', backupData.date || 'desconocida');
      } else {
        // Formato antiguo o datos directos
        dataToRestore = backupData;
        console.log('Restaurando respaldo en formato antiguo');
      }
      
      // Intentar descomprimir si es necesario
      if (typeof dataToRestore === 'string') {
        try {
          dataToRestore = this.decompressData(dataToRestore);
          if (!dataToRestore) {
            throw new Error('Error al descomprimir datos del respaldo');
          }
        } catch (decompressError) {
          console.error('Error al procesar datos del respaldo:', decompressError);
          throw new Error('El formato de los datos del respaldo es inválido');
        }
      }
      
      // Crear respaldo del estado actual antes de restaurar (por seguridad)
      const currentBackupName = `comedor_pre_restore_backup_${new Date().toISOString()}`;
      try {
        const currentData = {
          menus: Utils.getFromStorage(CONFIG.STORAGE_KEYS.MENUS, []),
          users: Utils.getFromStorage(CONFIG.STORAGE_KEYS.USERS, []),
          confirmations: Utils.getFromStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, []),
          archivedData: Utils.getFromStorage(this.config.archivedDataKey, {}),
          timestamp: new Date().toISOString()
        };
        
        // Guardar respaldo del estado actual
        localStorage.setItem(currentBackupName, JSON.stringify(currentData));
        console.log('Creado respaldo de seguridad antes de restaurar');
      } catch (backupError) {
        console.warn('No se pudo crear respaldo de seguridad:', backupError);
      }
      
      // Restaurar datos
      if (dataToRestore.users) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, dataToRestore.users);
      }
      
      if (dataToRestore.menus) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, dataToRestore.menus);
      }
      
      if (dataToRestore.confirmations) {
        Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, dataToRestore.confirmations);
      }
      
      // Restaurar datos archivados
      if (dataToRestore.archivedData) {
        Utils.saveToStorage(this.config.archivedDataKey, dataToRestore.archivedData);
      } else if (dataToRestore.archived) {
        // Compatibilidad con formato antiguo
        Utils.saveToStorage(this.config.archivedDataKey, dataToRestore.archived);
      }
      
      // Restaurar menús archivados (compatibilidad con diferentes formatos)
      if (dataToRestore.archivedMenus) {
        Utils.saveToStorage(this.config.archiveKeys.MENUS, dataToRestore.archivedMenus);
      }
      
      // Restaurar confirmaciones archivadas (compatibilidad con diferentes formatos)
      if (dataToRestore.archivedConfirmations) {
        Utils.saveToStorage(this.config.archiveKeys.CONFIRMATIONS, dataToRestore.archivedConfirmations);
      }
      
      console.log('Respaldo restaurado correctamente');
      return {
        success: true,
        message: 'Respaldo restaurado correctamente',
        backupDate: backupData.date || 'desconocida',
        preRestoreBackup: currentBackupName
      };
    } catch (error) {
      console.error('Error al restaurar respaldo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Verifica el espacio disponible en localStorage y evalúa si hay suficiente para una operación
   * 
   * Esta función analiza el uso actual del almacenamiento local, calcula el espacio disponible
   * y determina si hay suficiente espacio para realizar una operación que requiere una cantidad
   * específica de bytes. También proporciona información sobre el nivel de advertencia y
   * sugerencias para gestionar el espacio.
   * 
   * @param {number} requiredSpace - Espacio requerido en bytes (opcional)
   * @returns {Object} Información sobre el espacio utilizado y si hay suficiente espacio
   */
  checkStorageSpace: function(requiredSpace) {
    try {
      // Valor por defecto para requiredSpace
      const neededSpace = requiredSpace || 0;
      
      // Obtener estadísticas actuales
      const stats = this.getStorageStats();
      
      // Verificar si hay suficiente espacio para la operación solicitada
      const hasEnoughSpace = stats.free > neededSpace;
      
      // Calcular nivel de advertencia
      let warningLevel = 'none';
      if (stats.usedPercentage > 90) {
        warningLevel = 'critical';
      } else if (stats.usedPercentage > 80) {
        warningLevel = 'high';
      } else if (stats.usedPercentage > 70) {
        warningLevel = 'medium';
      } else if (stats.usedPercentage > 60) {
        warningLevel = 'low';
      }
      
      // Si el espacio está casi lleno, sugerir acciones
      let suggestedAction = '';
      if (warningLevel === 'critical') {
        suggestedAction = 'Se recomienda eliminar datos archivados inmediatamente para evitar pérdida de información.';
      } else if (warningLevel === 'high') {
        suggestedAction = 'Se recomienda archivar datos antiguos y limpiar datos archivados.';
      } else if (warningLevel === 'medium') {
        suggestedAction = 'Considere archivar datos antiguos para liberar espacio.';
      }
      
      return {
        total: stats.total,
        used: stats.used,
        free: stats.free,
        usedPercentage: stats.usedPercentage,
        hasEnoughSpace: hasEnoughSpace,
        requiredSpace: neededSpace,
        warningLevel: warningLevel,
        suggestedAction: suggestedAction,
        shouldWarnUser: warningLevel === 'high' || warningLevel === 'critical'
      };
    } catch (error) {
      console.error('Error al verificar espacio de almacenamiento:', error);
      return {
        total: 5 * 1024 * 1024, // 5MB por defecto
        used: 0,
        free: 5 * 1024 * 1024,
        usedPercentage: 0,
        hasEnoughSpace: false,
        requiredSpace: neededSpace,
        warningLevel: 'error',
        suggestedAction: 'Error al verificar el espacio disponible. Intente nuevamente.',
        shouldWarnUser: true,
        error: error.message
      };
    }
  },
  
  /**
   * Crea un respaldo de todos los datos importantes
   * @returns {boolean} True si el respaldo se creó correctamente
   */
  createBackup: function() {
    try {
      console.log('Creando respaldo de datos...');
      
      // Recopilar datos a respaldar
      const backupData = {
        users: Utils.getFromStorage(CONFIG.STORAGE_KEYS.USERS, []),
        menus: Utils.getFromStorage(CONFIG.STORAGE_KEYS.MENUS, []),
        archivedMenus: Utils.getFromStorage(this.config.archiveKeys.MENUS, []),
        confirmations: Utils.getFromStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, []),
        archivedConfirmations: Utils.getFromStorage(this.config.archiveKeys.CONFIRMATIONS, []),
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Comprimir datos
      const compressedBackup = this.compressData(backupData);
      
      // Guardar respaldo
      Utils.saveToStorage(this.config.backupKeys.BACKUP, compressedBackup);
      Utils.saveToStorage(this.config.backupKeys.BACKUP_DATE, backupData.timestamp);
      
      console.log('Respaldo creado correctamente:', backupData.timestamp);
      return true;
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      return false;
    }
  },
  
  /**
   * Restaura datos desde un respaldo
   * @param {string} backupData - Datos de respaldo (opcional, si no se proporciona se usa el último respaldo)
   * @returns {boolean} True si la restauración se realizó correctamente
   */
  restoreFromBackup: function(backupData) {
    try {
      console.log('Restaurando datos desde respaldo...');
      
      // Si no se proporciona respaldo, usar el último guardado
      if (!backupData) {
        backupData = Utils.getFromStorage(this.config.backupKeys.BACKUP);
        if (!backupData) {
          console.error('No hay respaldo disponible para restaurar.');
          return false;
        }
      }
      
      // Descomprimir datos
      const restoredData = this.decompressData(backupData);
      if (!restoredData) {
        console.error('Error al descomprimir datos de respaldo.');
        return false;
      }
      
      // Verificar versión y estructura del respaldo
      if (!restoredData.version || !restoredData.timestamp) {
        console.error('El formato del respaldo no es válido.');
        return false;
      }
      
      // Restaurar datos
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.USERS, restoredData.users || []);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.MENUS, restoredData.menus || []);
      Utils.saveToStorage(this.config.archiveKeys.MENUS, restoredData.archivedMenus || []);
      Utils.saveToStorage(CONFIG.STORAGE_KEYS.CONFIRMATIONS, restoredData.confirmations || []);
      Utils.saveToStorage(this.config.archiveKeys.CONFIRMATIONS, restoredData.archivedConfirmations || []);
      
      console.log('Restauración completada correctamente. Fecha del respaldo:', restoredData.timestamp);
      return true;
    } catch (error) {
      console.error('Error al restaurar desde respaldo:', error);
      return false;
    }
  },
  
  /**
   * Exporta un respaldo de datos para descarga
   * @returns {Object} Objeto con datos para la descarga
   */
  exportBackup: function() {
    try {
      // Crear respaldo
      this.createBackup();
      
      // Obtener datos de respaldo
      const backupData = Utils.getFromStorage(this.config.backupKeys.BACKUP);
      const backupDate = Utils.getFromStorage(this.config.backupKeys.BACKUP_DATE);
      
      if (!backupData) {
        throw new Error('No se pudo crear el respaldo para exportar.');
      }
      
      // Formatear fecha para el nombre del archivo
      const dateStr = new Date(backupDate).toISOString().split('T')[0];
      
      return {
        data: backupData,
        filename: `comedor-empresarial-backup-${dateStr}.json`,
        date: backupDate
      };
    } catch (error) {
      console.error('Error al exportar respaldo:', error);
      return null;
    }
  },
  
  /**
   * Importa un respaldo desde un archivo
   * @param {string} backupData - Datos del respaldo a importar
   * @returns {boolean} True si la importación se realizó correctamente
   */
  importBackup: function(backupData) {
    try {
      // Validar datos de respaldo
      if (!backupData) {
        throw new Error('Los datos de respaldo son inválidos.');
      }
      
      // Intentar descomprimir para validar formato
      const testDecompress = this.decompressData(backupData);
      if (!testDecompress || !testDecompress.version) {
        throw new Error('El formato del archivo de respaldo no es válido.');
      }
      
      // Crear respaldo del estado actual antes de restaurar
      this.createBackup();
      
      // Restaurar desde el respaldo importado
      const success = this.restoreFromBackup(backupData);
      
      return success;
    } catch (error) {
      console.error('Error al importar respaldo:', error);
      return false;
    }
  },
  
  /**
   * Obtiene información sobre los respaldos disponibles
   * @returns {Object} Información sobre respaldos
   */
  getBackupInfo: function() {
    const lastBackupDate = Utils.getFromStorage(this.config.backupKeys.BACKUP_DATE);
    
    return {
      hasBackup: !!lastBackupDate,
      lastBackupDate: lastBackupDate,
      formattedDate: lastBackupDate ? new Date(lastBackupDate).toLocaleString() : 'Nunca'
    };
  }
};

// Exportar el objeto StorageManager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
