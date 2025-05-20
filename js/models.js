/**
 * models.js
 * Define las estructuras de datos básicas para el sistema de comedor empresarial
 */

// Modelo de Usuario
class User {
    constructor(id, name, role, department) {
        this.id = id;
        this.name = name;
        this.role = role; // admin, coordinator, employee
        this.department = department;
        this.createdAt = new Date();
    }
}

// Modelo de Platillo
class Dish {
    constructor(id, name, description, category, price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category; // entrada, plato fuerte, postre, bebida
        this.price = price;
        this.available = true;
    }
}

// Modelo de Menú
class Menu {
    constructor(id, name, items, date, type = 'comida') {
        this.id = id || this.generateId();
        this.name = name || `Menú ${new Date().toLocaleDateString()}`;
        this.items = items || []; // Array de objetos de platillos por categoría
        this.date = date || new Date();
        this.type = type; // 'comida' o 'desayuno'
        this.active = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addItem(item) {
        if (!item.id) {
            item.id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }
        this.items.push(item);
        this.updatedAt = new Date();
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updatedAt = new Date();
    }

    updateItem(itemId, updatedData) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...updatedData };
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    validate() {
        // Validación básica
        if (!this.name || this.name.trim() === '') {
            return { valid: false, error: 'El nombre del menú es requerido' };
        }
        if (!Array.isArray(this.items) || this.items.length === 0) {
            return { valid: false, error: 'El menú debe contener al menos un platillo' };
        }
        return { valid: true };
    }
}

// Modelo de Coordinador
class Coordinator {
    constructor(id, name, email, phone, department) {
        this.id = id || this.generateId();
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.active = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'coord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    validate() {
        // Validación básica
        if (!this.name || this.name.trim() === '') {
            return { valid: false, error: 'El nombre del coordinador es requerido' };
        }
        if (!this.email || !this.validateEmail(this.email)) {
            return { valid: false, error: 'El email del coordinador es inválido' };
        }
        if (!this.department || this.department.trim() === '') {
            return { valid: false, error: 'El departamento del coordinador es requerido' };
        }
        return { valid: true };
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
}

// Modelo de Confirmación
class Confirmation {
    constructor(id, menuId, coordinatorId, date, status, items) {
        this.id = id || this.generateId();
        this.menuId = menuId;
        this.coordinatorId = coordinatorId;
        this.date = date || new Date();
        this.status = status || 'pending'; // pending, confirmed, canceled
        this.items = items || []; // Array de { itemId, quantity, notes }
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'conf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addItem(itemId, quantity = 1, notes = '') {
        const existingItem = this.items.find(item => item.itemId === itemId);
        if (existingItem) {
            existingItem.quantity += quantity;
            if (notes) existingItem.notes = notes;
        } else {
            this.items.push({ itemId, quantity, notes });
        }
        this.updatedAt = new Date();
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.itemId !== itemId);
        this.updatedAt = new Date();
    }

    updateItem(itemId, updatedData) {
        const index = this.items.findIndex(item => item.itemId === itemId);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...updatedData };
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    updateStatus(newStatus) {
        const validStatuses = ['pending', 'confirmed', 'canceled'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    validate() {
        // Validación básica
        if (!this.menuId) {
            return { valid: false, error: 'El ID del menú es requerido' };
        }
        if (!this.coordinatorId) {
            return { valid: false, error: 'El ID del coordinador es requerido' };
        }
        if (!Array.isArray(this.items) || this.items.length === 0) {
            return { valid: false, error: 'La confirmación debe contener al menos un platillo' };
        }
        return { valid: true };
    }
}

// Modelo de Pedido
class Order {
    constructor(id, userId, items, date) {
        this.id = id || this.generateId();
        this.userId = userId;
        this.items = items || []; // Array de { dishId, quantity }
        this.date = date || new Date();
        this.status = 'pending'; // pending, preparing, delivered, completed
        this.total = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateTotal(dishesData) {
        this.total = this.items.reduce((sum, item) => {
            const dish = dishesData.find(d => d.id === item.dishId);
            return sum + (dish ? dish.price * item.quantity : 0);
        }, 0);
        this.updatedAt = new Date();
        return this.total;
    }

    addItem(dishId, quantity = 1) {
        const existingItem = this.items.find(item => item.dishId === dishId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({ dishId, quantity });
        }
        this.updatedAt = new Date();
    }

    removeItem(dishId) {
        this.items = this.items.filter(item => item.dishId !== dishId);
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        const validStatuses = ['pending', 'preparing', 'delivered', 'completed'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    validate() {
        // Validación básica
        if (!this.userId) {
            return { valid: false, error: 'El ID del usuario es requerido' };
        }
        if (!Array.isArray(this.items) || this.items.length === 0) {
            return { valid: false, error: 'El pedido debe contener al menos un platillo' };
        }
        return { valid: true };
    }
}

// Modelo de Confirmación de Asistencia
class AttendanceConfirmation {
    constructor(id, coordinatorId, weekStartDate, attendanceCounts, type = 'comida') {
        this.id = id || this.generateId();
        this.coordinatorId = coordinatorId;
        this.weekStartDate = weekStartDate; // Fecha de inicio de la semana (lunes)
        this.attendanceCounts = attendanceCounts || {}; // Objeto con conteos por día {dayId: count}
        this.type = type; // 'comida' o 'desayuno'
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'attend_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateCount(dayId, count) {
        if (count < 0) count = 0;
        this.attendanceCounts[dayId] = count;
        this.updatedAt = new Date();
    }

    getCount(dayId) {
        return this.attendanceCounts[dayId] || 0;
    }

    getTotalCount() {
        return Object.values(this.attendanceCounts).reduce((sum, count) => sum + count, 0);
    }

    validate() {
        // Validación básica
        if (!this.coordinatorId) {
            return { valid: false, error: 'El ID del coordinador es requerido' };
        }
        if (!this.weekStartDate) {
            return { valid: false, error: 'La fecha de inicio de la semana es requerida' };
        }
        if (typeof this.attendanceCounts !== 'object') {
            return { valid: false, error: 'Los conteos de asistencia deben ser un objeto válido' };
        }
        
        // Verificar que los conteos sean números no negativos
        for (const dayId in this.attendanceCounts) {
            const count = this.attendanceCounts[dayId];
            if (typeof count !== 'number' || count < 0) {
                return { valid: false, error: 'Los conteos de asistencia deben ser números no negativos' };
            }
        }
        
        return { valid: true };
    }
}

// Exportar los modelos para su uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { User, Dish, Menu, Coordinator, Confirmation, Order, AttendanceConfirmation };
} else {
    // Para uso en el navegador
    window.AppModels = { User, Dish, Menu, Coordinator, Confirmation, Order, AttendanceConfirmation };
}
