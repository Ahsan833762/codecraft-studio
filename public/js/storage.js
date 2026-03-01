/**
 * CodeCraft Studio - LocalStorage Database
 * This file provides a client-side database simulation using localStorage
 * Works completely offline without any server or database
 */

const DB = {
    // Initialize default data
    init() {
        if (!localStorage.getItem('codecraft_initialized')) {
            this.seedDefaultData();
            localStorage.setItem('codecraft_initialized', 'true');
        }
    },

    // Seed default data (admin user, settings, sample data)
    seedDefaultData() {
        // Default admin user (email: admin@codecraft.com, password: admin123)
        const adminUser = {
            id: 1,
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@codecraft.com',
            phone: '+92 300 1234567',
            password: this.hashPassword('admin123'),
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString()
        };

        // Default settings
        const settings = {
            website_name: 'CodeCraft Studio',
            website_tagline: 'Professional Web Development',
            contact_email: 'codecraftstudio@outlook.com',
            contact_phone: '+92 300 1234567',
            contact_address: 'Karachi, Pakistan',
            about_content: 'We build stunning websites that drive results.'
        };

        // Sample services
        const services = [
            { id: 1, title: 'Web Development', description: 'Custom websites built with modern technologies', price: 299, icon: 'fa-code', status: 'active' },
            { id: 2, title: 'UI/UX Design', description: 'Beautiful and intuitive user interfaces', price: 199, icon: 'fa-paint-brush', status: 'active' },
            { id: 3, title: 'E-Commerce', description: 'Full-featured online stores', price: 499, icon: 'fa-shopping-cart', status: 'active' },
            { id: 4, title: 'SEO Optimization', description: 'Improve your search rankings', price: 149, icon: 'fa-search', status: 'active' }
        ];

        // Sample employees
        const employees = [
            { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@codecraft.com', phone: '+92 300 1111111', cnic: '12345-6789012-3', designation: 'Senior Developer', department: 'Development', salary: 50000, joining_date: '2023-01-15', address: 'Karachi', status: 'active' },
            { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@codecraft.com', phone: '+92 300 2222222', cnic: '12345-6789012-4', designation: 'UI Designer', department: 'Design', salary: 40000, joining_date: '2023-03-20', address: 'Lahore', status: 'active' }
        ];

        // Sample clients
        const clients = [
            { id: 1, company_name: 'Tech Corp', contact_person: 'Alice Johnson', email: 'alice@techcorp.com', phone: '+92 300 3333333', company_address: 'Islamabad', status: 'active' },
            { id: 2, company_name: 'Business Inc', contact_person: 'Bob Williams', email: 'bob@businessinc.com', phone: '+92 300 4444444', company_address: 'Karachi', status: 'active' }
        ];

        // Sample orders
        const orders = [
            { id: 1, user_id: 1, service_type: 'Web Development', company_name: 'Tech Corp', email: 'alice@techcorp.com', phone: '+92 300 3333333', description: 'Build a corporate website', amount: 299, status: 'Completed', created_at: new Date().toISOString() },
            { id: 2, user_id: 1, service_type: 'E-Commerce', company_name: 'Business Inc', email: 'bob@businessinc.com', phone: '+92 300 4444444', description: 'Online store setup', amount: 499, status: 'Pending', created_at: new Date().toISOString() }
        ];

        // Sample payments
        const payments = [
            { id: 1, name: 'Alice Johnson', email: 'alice@techcorp.com', phone: '+92 300 3333333', company: 'Tech Corp', description: 'Website development', plan: 'Premium', amount: 299, payment_method: 'Bank Transfer', status: 'Completed' },
            { id: 2, name: 'Bob Williams', email: 'bob@businessinc.com', phone: '+92 300 4444444', company: 'Business Inc', description: 'E-commerce setup', plan: 'Business', amount: 499, payment_method: 'Credit Card', status: 'Pending' }
        ];

        // Sample contact messages
        const messages = [
            { id: 1, full_name: 'Test User', email: 'test@example.com', phone: '+92 300 5555555', subject: 'Inquiry', message: 'Interested in your services', created_at: new Date().toISOString() }
        ];

        // Store all data
        this.set('users', [adminUser]);
        this.set('settings', settings);
        this.set('services', services);
        this.set('employees', employees);
        this.set('clients', clients);
        this.set('orders', orders);
        this.set('payments', payments);
        this.set('messages', messages);
    },

    // Simple hash function for passwords (not secure for production, but works for demo)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hashed_' + Math.abs(hash).toString(16);
    },

    // Get all records from a table
    get(table) {
        const data = localStorage.getItem('codecraft_' + table);
        return data ? JSON.parse(data) : [];
    },

    // Set all records for a table
    set(table, data) {
        localStorage.setItem('codecraft_' + table, JSON.stringify(data));
    },

    // Get single record by ID
    getById(table, id) {
        const data = this.get(table);
        return data.find(item => item.id == id);
    },

    // Add new record
    add(table, record) {
        const data = this.get(table);
        const maxId = data.length > 0 ? Math.max(...data.map(item => item.id)) : 0;
        record.id = maxId + 1;
        record.created_at = new Date().toISOString();
        data.push(record);
        this.set(table, data);
        return record;
    },

    // Update record
    update(table, id, updates) {
        const data = this.get(table);
        const index = data.findIndex(item => item.id == id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.set(table, data);
            return true;
        }
        return false;
    },

    // Delete record
    delete(table, id) {
        const data = this.get(table);
        const filtered = data.filter(item => item.id != id);
        this.set(table, filtered);
        return true;
    },

    // Query with filters
    query(table, filters = {}) {
        let data = this.get(table);
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                data = data.filter(item => item[key] == filters[key]);
            }
        });
        
        return data;
    },

    // Get settings as key-value object
    getSettings() {
        return this.get('settings');
    },

    // Update settings
    updateSettings(newSettings) {
        const current = this.get('settings');
        const updated = { ...current, ...newSettings };
        this.set('settings', updated);
        return updated;
    },

    // Get statistics
    getStats() {
        return {
            employees: this.get('employees').length,
            clients: this.get('clients').length,
            orders: this.get('orders').length,
            revenue: this.get('payments').filter(p => p.status === 'Completed').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
            pending: this.get('orders').filter(o => o.status === 'Pending').length
        };
    }
};

// Auto-initialize on load
DB.init();

// Export for use in other files
window.DB = DB;
