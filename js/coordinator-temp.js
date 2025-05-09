/**
 * Muestra un menú en el contenedor especificado para el coordinador
 * @param {Object} menu - Objeto de menú
 * @param {HTMLElement} container - Contenedor donde mostrar el menú
 */
function displayMenuForCoordinator(menu, container) {
    console.log('Iniciando displayMenuForCoordinator con:', menu ? menu.name : 'menú indefinido');
    
    if (!menu || typeof menu !== 'object') {
        console.error('Error: Formato de menú inválido', menu);
        container.innerHTML = '<p class="empty-state">Error: Formato de menú inválido.</p>';
        return;
    }
    
    // Determinar si es el menú actual o el de la próxima semana
    const isCurrentMenu = container.id === 'current-menu';
    const weekType = isCurrentMenu ? 'current' : 'next';
    
    console.log(`Mostrando menú para ${weekType}:`, menu.name);

    // Verificar si AppUtils está disponible
    if (typeof AppUtils === 'undefined') {
        console.error('Error: AppUtils no está definido. Usando formateo básico de fechas.');
        // Implementar formateo básico si AppUtils no está disponible
        if (!window.AppUtils) {
            window.AppUtils = {
                formatDate: function(date) {
                    if (!date) return '';
                    try {
                        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                    } catch (e) {
                        return date.toString();
                    }
                }
            };
        }
    }

    // Crear el HTML base para el menú
    let html = `
        <div class="menu-header">
            <h4>${menu.name || 'Menú Semanal'}</h4>
            <p>Vigente del ${AppUtils.formatDate(new Date(menu.startDate + 'T00:00:00'))} al ${AppUtils.formatDate(new Date(menu.endDate + 'T00:00:00'))}</p>
        </div>
    `;
    
    // Si hay una imagen del menú, agregar el contenedor de imagen
    if (menu.imageUrl) {
        console.log('El menú tiene imageUrl:', typeof menu.imageUrl, menu.imageUrl ? menu.imageUrl.substring(0, 50) + '...' : 'vacío');
        
        html += `
            <div class="menu-image-display">
                <div class="loading-indicator"><span class="spinner"></span> Cargando imagen...</div>
                <img alt="Imagen del menú ${menu.name || 'Semanal'}" class="menu-image" style="display:none;">
            </div>
        `;
    }
    
    // Agregar sección de días del menú
    html += `<div class="menu-days">`;
    
    if (Array.isArray(menu.days) && menu.days.length > 0) {
        // Ordenar días
        const dayOrder = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };
        const sortedDays = [...menu.days].sort((a, b) => {
            const aKey = a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const bKey = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (dayOrder[aKey] || 99) - (dayOrder[bKey] || 99);
        });

        sortedDays.forEach(day => {
            const dayDate = day.date ? AppUtils.formatDate(new Date(day.date + 'T00:00:00')) : '';
            html += `
                <div class="menu-day card">
                    <h5>${day.name} <small>(${dayDate})</small></h5>
            `;
            
            if (day.dishes && day.dishes.length > 0) {
                // Agrupar por categoría
                const dishesByCategory = {};
                day.dishes.forEach(dish => {
                    const category = dish.category || 'otros';
                    if (!dishesByCategory[category]) {
                        dishesByCategory[category] = [];
                    }
                    dishesByCategory[category].push(dish);
                });
                
                // Mostrar platos por categoría
                Object.keys(dishesByCategory).forEach(category => {
                    const dishes = dishesByCategory[category];
                    const categoryName = CATEGORIES[category] || category.charAt(0).toUpperCase() + category.slice(1);
                    
                    html += `<div class="dish-category"><h6>${categoryName}</h6><ul class="dish-list">`;
                    
                    dishes.forEach(dish => {
                        html += `<li>${dish.name}</li>`;
                    });
                    
                    html += `</ul></div>`;
                });
            } else {
                html += `<p class="empty-state">No hay platos definidos para este día.</p>`;
            }
            
            html += `</div>`;
        });
    } else {
        html += `<p class="empty-state">El menú no contiene días configurados.</p>`;
    }
    
    html += `</div>`;
    
    // Aplicar el HTML al contenedor
    container.innerHTML = html;
    
    // Si hay imagen, configurar eventos para cargarla
    if (menu.imageUrl) {
        const menuImage = container.querySelector('.menu-image');
        const loadingIndicator = container.querySelector('.loading-indicator');
        
        if (menuImage && loadingIndicator) {
            // Evento cuando la imagen carga correctamente
            menuImage.onload = function() {
                console.log('Imagen del menú cargada correctamente');
                menuImage.style.display = 'block';
                loadingIndicator.style.display = 'none';
            };
            
            // Evento cuando hay un error al cargar la imagen
            menuImage.onerror = function() {
                console.error('Error al cargar la imagen del menú:', menu.imageUrl);
                loadingIndicator.innerHTML = '<p class="error-state">Error al cargar la imagen. <button class="retry-btn">Reintentar</button></p>';
                
                // Agregar botón para reintentar
                const retryBtn = loadingIndicator.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.onclick = function() {
                        console.log('Reintentando carga de imagen con timestamp');
                        // Reintentar carga de imagen
                        const timestamp = new Date().getTime();
                        menuImage.src = menu.imageUrl + '?t=' + timestamp; // Evitar caché
                        loadingIndicator.innerHTML = '<span class="spinner"></span> Cargando imagen...';
                    };
                }
            };
            
            // Iniciar la carga de la imagen
            if (menu.imageUrl.length > 1000 && menu.imageUrl.startsWith('data:')) {
                // Para data URLs largas, usar una imagen temporal primero
                try {
                    const tempImg = new Image();
                    tempImg.onload = function() {
                        menuImage.src = menu.imageUrl;
                    };
                    tempImg.onerror = function() {
                        menuImage.onerror();
                    };
                    tempImg.src = menu.imageUrl;
                } catch (error) {
                    console.error('Error al procesar la data URL:', error);
                    menuImage.onerror();
                }
            } else {
                // URL normal, cargar directamente
                menuImage.src = menu.imageUrl;
            }
        }
    }
    
    // Actualizar el menú en el gestor de asistencia si está disponible
    setTimeout(() => {
        if (typeof AttendanceManager !== 'undefined') {
            try {
                const menuData = {
                    id: menu.id,
                    name: menu.name,
                    startDate: menu.startDate,
                    endDate: menu.endDate,
                    days: {}
                };
                
                // Convertir los días a formato compatible con AttendanceManager
                if (Array.isArray(menu.days)) {
                    menu.days.forEach(day => {
                        const dayName = day.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        menuData.days[dayName] = {
                            date: day.date,
                            dish: day.dishes && day.dishes.length > 0 ? day.dishes[0].name : 'No especificado'
                        };
                    });
                }
                
                // Actualizar el menú en el gestor de asistencia
                AttendanceManager.updateMenu(weekType, menuData);
                console.log(`Menú ${weekType} actualizado en AttendanceManager`);
            } catch (error) {
                console.error('Error al actualizar menú en AttendanceManager:', error);
            }
        }
    }, 200);
}
