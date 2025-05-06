/**
 * firebase-mobile-ui.js
 * Optimización de UI para dispositivos móviles en la integración con Firebase
 * Este script inyecta estilos CSS optimizados para móviles y proporciona
 * utilidades para mejorar la experiencia en dispositivos pequeños.
 */

// Inyectar estilos CSS para móviles
(function injectMobileStyles() {
    const mobileStyles = `
    /* Estilos generales para móviles */
    @media (max-width: 768px) {
        /* Contenedores principales */
        .container {
            padding: 10px;
            width: 100%;
            max-width: 100%;
        }
        
        /* Tarjetas y paneles */
        .card {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 8px;
        }
        
        .card h2 {
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 15px;
        }
        
        /* Formularios */
        .form-group {
            margin-bottom: 12px;
        }
        
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        input[type="date"],
        select,
        textarea {
            font-size: 16px; /* Evita zoom en iOS */
            padding: 10px;
            width: 100%;
        }
        
        /* Botones */
        .btn {
            display: block;
            width: 100%;
            margin-bottom: 10px;
            padding: 12px;
            font-size: 16px;
            text-align: center;
        }
        
        .btn-group .btn {
            margin-right: 0;
        }
        
        /* Botones de acción flotantes */
        .fab {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
            z-index: 1000;
        }
        
        /* Página de login */
        .login-container {
            width: 100%;
            max-width: 100%;
            padding: 15px;
        }
        
        .login-form {
            padding: 15px;
        }
        
        .login-logo {
            max-width: 80%;
            margin: 0 auto 20px;
        }
        
        /* Administración de usuarios */
        .user-list {
            overflow-x: auto;
        }
        
        .user-item {
            flex-direction: column;
            padding: 10px;
        }
        
        .user-actions {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            width: 100%;
        }
        
        .user-details {
            width: 100%;
        }
        
        /* Menús y coordinadores */
        .menu-week-selector,
        .coordinator-selector {
            flex-direction: column;
        }
        
        .menu-day {
            margin-bottom: 15px;
        }
        
        .menu-items {
            padding-left: 0;
        }
        
        .menu-item {
            padding: 8px;
        }
        
        .coordinator-list {
            overflow-x: auto;
        }
        
        .coordinator-item {
            flex-direction: column;
            padding: 10px;
        }
        
        .coordinator-actions {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            width: 100%;
        }
        
        /* Confirmaciones de asistencia */
        .attendance-grid {
            display: block;
        }
        
        .attendance-day {
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
        }
        
        .attendance-counter {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .attendance-counter input[type="number"] {
            width: 80px;
        }
        
        .attendance-summary {
            margin-top: 20px;
            padding: 10px;
            border-radius: 8px;
            background-color: #f5f5f5;
        }
        
        /* Notificaciones */
        .notification-list {
            max-height: 300px;
        }
        
        .notification-item {
            padding: 10px;
        }
        
        .notification-actions {
            margin-left: 0;
            margin-top: 10px;
            display: flex;
            justify-content: flex-end;
        }
        
        .notification-bell {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background-color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        /* Exportación de datos */
        .export-options {
            flex-direction: column;
        }
        
        .export-format {
            margin-bottom: 15px;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        .preview-table {
            min-width: 500px;
        }
        
        /* Modo offline */
        .connection-status {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 5px 10px;
            z-index: 1000;
            font-size: 12px;
            text-align: center;
        }
        
        .connection-status.online {
            background-color: #d4edda;
            color: #155724;
        }
        
        .connection-status.offline {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .pending-operations-badge {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: #dc3545;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            z-index: 1000;
        }
        
        /* Indicadores de carga y sincronización */
        .loading-indicator {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .loading-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .sync-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            z-index: 1000;
            font-size: 14px;
            max-width: 80%;
            text-align: center;
        }
        
        /* Mejoras de accesibilidad para pantallas táctiles */
        button, 
        .btn,
        select,
        input[type="checkbox"],
        input[type="radio"] {
            min-height: 44px; /* Recomendación de Apple para áreas táctiles */
        }
        
        /* Espaciado entre elementos interactivos */
        .btn + .btn,
        .form-check + .form-check {
            margin-top: 8px;
        }
        
        /* Mejorar legibilidad */
        body {
            font-size: 16px;
            line-height: 1.5;
        }
        
        /* Evitar que el contenido se salga de la pantalla */
        img, video, canvas, svg {
            max-width: 100%;
            height: auto;
        }
    }
    
    /* Modo ultra-compacto para pantallas muy pequeñas */
    @media (max-width: 360px) {
        body {
            font-size: 14px;
        }
        
        .card {
            padding: 10px;
            margin-bottom: 10px;
        }
        
        .card h2 {
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .form-group {
            margin-bottom: 8px;
        }
        
        .btn {
            padding: 8px;
            font-size: 14px;
        }
        
        .table th, .table td {
            padding: 5px;
            font-size: 12px;
        }
        
        /* Ocultar elementos no esenciales */
        .d-xs-none {
            display: none !important;
        }
        
        /* Reducir padding y márgenes */
        .container, .row, .col {
            padding: 5px;
        }
    }
    `;
    
    // Crear elemento style y agregar al head
    const styleElement = document.createElement('style');
    styleElement.textContent = mobileStyles;
    document.head.appendChild(styleElement);
})();

/**
 * Utilidades para mejorar la experiencia en dispositivos móviles
 */
const FirebaseMobileUI = {
    // Configuración
    config: {
        mobileBreakpoint: 768,
        smallScreenBreakpoint: 360,
        loadingTimeout: 10000, // 10 segundos
        toastDuration: 3000 // 3 segundos
    },
    
    // Estado interno
    _state: {
        isMobile: window.innerWidth <= 768,
        isSmallScreen: window.innerWidth <= 360,
        loadingIndicator: null,
        syncToast: null,
        loadingTimeout: null
    },
    
    /**
     * Inicializa las mejoras de UI para móviles
     */
    initialize: function() {
        // Detectar cambios en el tamaño de la ventana
        window.addEventListener('resize', this._handleResize.bind(this));
        
        // Inicializar estado
        this._handleResize();
        
        // Crear elementos UI
        this._createUIElements();
        
        // Aplicar mejoras táctiles
        this._enhanceTouchInteractions();
        
        console.log('Firebase Mobile UI initialized');
        
        return this;
    },
    
    /**
     * Muestra un indicador de carga
     * @param {string} message - Mensaje a mostrar
     * @param {number} timeout - Tiempo de espera en ms (opcional)
     * @returns {Object} - Referencia a this para encadenamiento
     */
    showLoading: function(message = 'Cargando...', timeout = this.config.loadingTimeout) {
        if (!this._state.loadingIndicator) {
            this._createLoadingIndicator();
        }
        
        // Actualizar mensaje
        const messageElement = this._state.loadingIndicator.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Mostrar indicador
        this._state.loadingIndicator.style.display = 'flex';
        
        // Configurar timeout
        if (this._state.loadingTimeout) {
            clearTimeout(this._state.loadingTimeout);
        }
        
        if (timeout > 0) {
            this._state.loadingTimeout = setTimeout(() => {
                this.hideLoading();
            }, timeout);
        }
        
        return this;
    },
    
    /**
     * Oculta el indicador de carga
     * @returns {Object} - Referencia a this para encadenamiento
     */
    hideLoading: function() {
        if (this._state.loadingIndicator) {
            this._state.loadingIndicator.style.display = 'none';
        }
        
        if (this._state.loadingTimeout) {
            clearTimeout(this._state.loadingTimeout);
            this._state.loadingTimeout = null;
        }
        
        return this;
    },
    
    /**
     * Muestra un toast de sincronización
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (opcional)
     * @returns {Object} - Referencia a this para encadenamiento
     */
    showToast: function(message, duration = this.config.toastDuration) {
        if (!this._state.syncToast) {
            this._createSyncToast();
        }
        
        // Actualizar mensaje
        this._state.syncToast.textContent = message;
        
        // Mostrar toast
        this._state.syncToast.style.display = 'block';
        
        // Ocultar después de la duración
        setTimeout(() => {
            this.hideToast();
        }, duration);
        
        return this;
    },
    
    /**
     * Oculta el toast de sincronización
     * @returns {Object} - Referencia a this para encadenamiento
     */
    hideToast: function() {
        if (this._state.syncToast) {
            this._state.syncToast.style.display = 'none';
        }
        
        return this;
    },
    
    /**
     * Muestra un indicador de estado de conexión
     * @param {boolean} isOnline - Si está en línea
     * @param {number} pendingOps - Número de operaciones pendientes
     * @returns {Object} - Referencia a this para encadenamiento
     */
    showConnectionStatus: function(isOnline, pendingOps = 0) {
        // Crear o actualizar indicador de estado
        let statusElement = document.querySelector('.connection-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }
        
        // Actualizar clase y contenido
        statusElement.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
        statusElement.textContent = isOnline ? 'Conectado' : 'Sin conexión';
        
        // Mostrar badge de operaciones pendientes si hay
        if (pendingOps > 0) {
            let badgeElement = document.querySelector('.pending-operations-badge');
            
            if (!badgeElement) {
                badgeElement = document.createElement('div');
                badgeElement.className = 'pending-operations-badge';
                document.body.appendChild(badgeElement);
            }
            
            badgeElement.textContent = pendingOps > 99 ? '99+' : pendingOps;
            badgeElement.style.display = 'flex';
        } else {
            const badgeElement = document.querySelector('.pending-operations-badge');
            if (badgeElement) {
                badgeElement.style.display = 'none';
            }
        }
        
        return this;
    },
    
    /**
     * Crea un botón de acción flotante
     * @param {string} icon - Clase de icono (Font Awesome)
     * @param {Function} onClick - Función a ejecutar al hacer clic
     * @param {string} color - Color de fondo (opcional)
     * @returns {HTMLElement} - Elemento del botón
     */
    createFloatingActionButton: function(icon, onClick, color = '#3498db') {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = `<i class="${icon}"></i>`;
        fab.style.backgroundColor = color;
        fab.style.color = 'white';
        
        fab.addEventListener('click', onClick);
        
        document.body.appendChild(fab);
        
        return fab;
    },
    
    /**
     * Optimiza una tabla para móviles
     * @param {HTMLElement} table - Elemento de tabla a optimizar
     * @returns {Object} - Referencia a this para encadenamiento
     */
    optimizeTable: function(table) {
        if (!table || !this._state.isMobile) {
            return this;
        }
        
        // Envolver en contenedor con scroll horizontal
        const parent = table.parentNode;
        
        if (!parent.classList.contains('table-container')) {
            const container = document.createElement('div');
            container.className = 'table-container';
            
            // Reemplazar tabla con contenedor
            parent.replaceChild(container, table);
            container.appendChild(table);
        }
        
        // Identificar columnas menos importantes
        const headers = Array.from(table.querySelectorAll('th'));
        
        if (this._state.isSmallScreen && headers.length > 3) {
            // En pantallas muy pequeñas, ocultar todas las columnas excepto las 3 primeras
            const rows = Array.from(table.querySelectorAll('tr'));
            
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                
                cells.forEach((cell, index) => {
                    if (index >= 3) {
                        cell.classList.add('d-xs-none');
                    }
                });
            });
        }
        
        return this;
    },
    
    /**
     * Maneja cambios en el tamaño de la ventana
     * @private
     */
    _handleResize: function() {
        const width = window.innerWidth;
        
        this._state.isMobile = width <= this.config.mobileBreakpoint;
        this._state.isSmallScreen = width <= this.config.smallScreenBreakpoint;
    },
    
    /**
     * Crea elementos de UI necesarios
     * @private
     */
    _createUIElements: function() {
        // Los elementos se crearán bajo demanda
    },
    
    /**
     * Crea el indicador de carga
     * @private
     */
    _createLoadingIndicator: function() {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.style.display = 'none';
        
        indicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">Cargando...</div>
        `;
        
        document.body.appendChild(indicator);
        this._state.loadingIndicator = indicator;
    },
    
    /**
     * Crea el toast de sincronización
     * @private
     */
    _createSyncToast: function() {
        const toast = document.createElement('div');
        toast.className = 'sync-toast';
        toast.style.display = 'none';
        
        document.body.appendChild(toast);
        this._state.syncToast = toast;
    },
    
    /**
     * Mejora las interacciones táctiles
     * @private
     */
    _enhanceTouchInteractions: function() {
        if (!this._state.isMobile) {
            return;
        }
        
        // Mejorar formularios
        document.querySelectorAll('input, select, textarea, button, .btn').forEach(el => {
            if (el.offsetHeight < 44) {
                el.style.minHeight = '44px';
            }
        });
        
        // Evitar zoom en inputs en iOS
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.style.fontSize = '16px';
        });
    }
};

// Exportar módulo
export default FirebaseMobileUI;
