/**
 * CodeCraft Studio - Client-Side API
 * This file provides API functions that work with localStorage
 * Replaces the server-side Express API for Netlify deployment
 */

const API = {
    // Store current user session
    currentUser: null,

    // Initialize - load session from localStorage
    init() {
        const session = localStorage.getItem('codecraft_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    },

    // Login
    async login(email, password) {
        const users = DB.get('users');
        const hashedPassword = DB.hashPassword(password);
        
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (user) {
            if (user.status !== 'active') {
                return { success: false, message: 'Account is inactive' };
            }
            
            this.currentUser = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            };
            
            localStorage.setItem('codecraft_session', JSON.stringify(this.currentUser));
            
            return {
                success: true,
                message: 'Login successful',
                user: this.currentUser,
                redirect: user.role === 'admin' ? '/admin.html' : '/dashboard.html'
            };
        }
        
        return { success: false, message: 'Invalid email or password' };
    },

    // Signup
    async signup(first_name, last_name, email, phone, password) {
        const users = DB.get('users');
        
        // Check if email exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already exists' };
        }
        
        const newUser = DB.add('users', {
            first_name,
            last_name,
            email,
            phone,
            password: DB.hashPassword(password),
            role: 'user',
            status: 'active'
        });
        
        // Auto-login after signup
        this.currentUser = {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            role: newUser.role
        };
        
        localStorage.setItem('codecraft_session', JSON.stringify(this.currentUser));
        
        return {
            success: true,
            message: 'Account created',
            redirect: '/dashboard.html'
        };
    },

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('codecraft_session');
        return { success: true, message: 'Logged out' };
    },

    // Get current user
    getUser() {
        if (this.currentUser) {
            return { success: true, user: this.currentUser };
        }
        return { success: false, user: null };
    },

    // Check authentication
    checkAuth() {
        if (!this.currentUser) {
            return { success: false, message: 'Not authenticated' };
        }
        return { success: true, user: this.currentUser };
    },

    // Check if admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    // ============ EMPLOYEES API ============
    getEmployees() {
        if (!this.currentUser) return { success: false, message: 'Please login first' };
        if (!this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, employees: DB.get('employees') };
    },

    addEmployee(data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.add('employees', data);
        return { success: true, message: 'Employee added successfully' };
    },

    updateEmployee(id, data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.update('employees', id, data);
        return { success: true, message: 'Employee updated' };
    },

    deleteEmployee(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('employees', id);
        return { success: true, message: 'Employee deleted' };
    },

    // ============ CLIENTS API ============
    getClients() {
        if (!this.currentUser) return { success: false, message: 'Please login first' };
        if (!this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, clients: DB.get('clients') };
    },

    addClient(data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.add('clients', data);
        return { success: true, message: 'Client added successfully' };
    },

    updateClient(id, data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.update('clients', id, data);
        return { success: true, message: 'Client updated' };
    },

    deleteClient(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('clients', id);
        return { success: true, message: 'Client deleted' };
    },

    // ============ ORDERS API ============
    getOrders() {
        if (!this.currentUser) return { success: false, message: 'Please login first' };
        
        let orders = DB.get('orders');
        if (!this.isAdmin()) {
            // Regular users only see their own orders
            orders = orders.filter(o => o.user_id == this.currentUser.id);
        }
        
        return { success: true, orders };
    },

    addOrder(data) {
        if (!this.currentUser) return { success: false, message: 'Please login first' };
        
        DB.add('orders', {
            ...data,
            user_id: this.currentUser.id,
            status: 'Pending'
        });
        return { success: true, message: 'Order placed successfully' };
    },

    updateOrder(id, data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.update('orders', id, data);
        return { success: true, message: 'Order updated' };
    },

    deleteOrder(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('orders', id);
        return { success: true, message: 'Order deleted' };
    },

    // ============ PAYMENTS API ============
    getPayments() {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, payments: DB.get('payments') };
    },

    addPayment(data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.add('payments', data);
        return { success: true, message: 'Payment added successfully' };
    },

    updatePayment(id, data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.update('payments', id, data);
        return { success: true, message: 'Payment updated' };
    },

    deletePayment(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('payments', id);
        return { success: true, message: 'Payment deleted' };
    },

    // ============ SERVICES API ============
    getServices() {
        return { success: true, services: DB.get('services').filter(s => s.status === 'active') };
    },

    addService(data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.add('services', data);
        return { success: true, message: 'Service added' };
    },

    updateService(id, data) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.update('services', id, data);
        return { success: true, message: 'Service updated' };
    },

    deleteService(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('services', id);
        return { success: true, message: 'Service deleted' };
    },

    // ============ SETTINGS API ============
    getSettings() {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, settings: DB.getSettings() };
    },

    updateSettings(settings) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.updateSettings(settings);
        return { success: true, message: 'Settings saved' };
    },

    // ============ ADMIN STATS API ============
    getAdminStats() {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, stats: DB.getStats() };
    },

    // ============ CONTACT MESSAGES API ============
    submitContact(data) {
        DB.add('messages', {
            ...data,
            read: false
        });
        return { success: true, message: 'Message sent successfully! We will contact you soon.' };
    },

    getMessages() {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        return { success: true, messages: DB.get('messages') };
    },

    deleteMessage(id) {
        if (!this.currentUser || !this.isAdmin()) return { success: false, message: 'Access denied' };
        
        DB.delete('messages', id);
        return { success: true, message: 'Message deleted successfully' };
    }
};

// Initialize API
API.init();

// Export
window.API = API;
