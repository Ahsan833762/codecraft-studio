// =====================================================
// CodeCraft Studio - Complete Admin System
// Role-Based Authentication with Employee & Order Management
// =====================================================

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'codecraft_studio',
    waitForConnections: true,
    connectionLimit: 10
};

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Database connection error:', err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
        connection.release();
    }
});

// =====================================================
// INITIALIZE DATABASE & TABLES
// =====================================================

function initializeDatabase() {
    const mysqlPromise = require('mysql2/promise');
    
    mysqlPromise.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    }).then(async (connection) => {
        await connection.query('CREATE DATABASE IF NOT EXISTS codecraft_studio');
        console.log('✅ Database ensured');
        
        await connection.query('USE codecraft_studio');
        
        // Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                cnic VARCHAR(20),
                designation VARCHAR(100),
                department VARCHAR(100),
                salary DECIMAL(10, 2),
                joining_date DATE,
                address TEXT,
                photo VARCHAR(255),
                status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Clients Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(100),
                contact_person VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                company_website VARCHAR(200),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Orders Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_name VARCHAR(100),
                service_type VARCHAR(100),
                description TEXT,
                amount DECIMAL(10, 2),
                status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
                payment_status ENUM('Unpaid', 'Paid', 'Partial') DEFAULT 'Unpaid',
                order_date DATE,
                completed_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add client_name column if it doesn't exist (for existing tables)
        try {
            await connection.query(`ALTER TABLE orders ADD COLUMN client_name VARCHAR(100) AFTER id`);
        } catch (e) {
            // Column already exists, ignore
        }
        
        // Payments Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                company VARCHAR(100),
                description TEXT,
                plan VARCHAR(50),
                amount DECIMAL(10, 2),
                payment_method VARCHAR(50),
                card_number VARCHAR(20),
                card_expiry VARCHAR(10),
                card_cvv VARCHAR(10),
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Website Settings Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS website_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(50) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Services Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100),
                description TEXT,
                price DECIMAL(10, 2),
                icon VARCHAR(50),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Contact Messages Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                subject VARCHAR(200),
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // User Packages Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                package_type VARCHAR(50) NOT NULL,
                package_name VARCHAR(100) NOT NULL,
                amount DECIMAL(10, 2) DEFAULT 0,
                payment_method VARCHAR(50),
                status VARCHAR(20) DEFAULT 'active',
                is_trial TINYINT(1) DEFAULT 0,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ All tables created successfully');
        
        // Create default admin
        const [rows] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@codecraft.com']);
        if (rows.length === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await connection.query(`INSERT INTO users (first_name, last_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['Admin', 'User', 'admin@codecraft.com', '+92 300 1234567', hashedPassword, 'admin', 'active']);
            console.log('✅ Default admin created: admin@codecraft.com / admin123');
        }
        
        // Insert default website settings
        const defaultSettings = [
            ['website_name', 'CodeCraft Studio'],
            ['website_tagline', 'Professional Web Development'],
            ['contact_email', 'codecraftstudio@outlook.com'],
            ['contact_phone', '+92 300 1234567'],
            ['contact_address', 'Karachi, Pakistan'],
            ['about_content', 'We build stunning websites that drive results.']
        ];
        
        for (const [key, value] of defaultSettings) {
            await connection.query('INSERT IGNORE INTO website_settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
        }
        
        await connection.end();
    }).catch(err => console.error('Database init error:', err.message));
}

initializeDatabase();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'codecraft-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Please login first' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Access denied' });
    }
    next();
}

// Make user available to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// =====================================================
// PUBLIC PAGES (Normal Visitors)
// =====================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/project', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'project-details.html'));
});

app.get('/process', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'process.html'));
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

// =====================================================
// AUTH PAGES
// =====================================================

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'newlogin.html'));
});

app.get('/admin-login', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'newlogin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// =====================================================
// ADMIN PAGES (Protected)
// =====================================================

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/employees', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-employees.html'));
});

app.get('/admin/clients', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-clients.html'));
});

app.get('/admin/orders', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-orders.html'));
});

app.get('/admin/settings', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-settings.html'));
});

app.get('/admin/services', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-services.html'));
});

app.get('/admin/messages', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-messages.html'));
});

app.get('/admin/payments', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-payments.html'));
});

// =====================================================
// API ROUTES - AUTHENTICATION
// =====================================================

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        
        if (user.status !== 'active') {
            return res.json({ success: false, message: 'Account is inactive' });
        }
        
        req.session.user = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
        };
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: req.session.user,
            redirect: user.role === 'admin' ? '/admin' : '/'
        });
    });
});

app.post('/api/signup', async (req, res) => {
    const { first_name, last_name, email, phone, password } = req.body;
    
    pool.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
        if (results.length > 0) {
            return res.json({ success: false, message: 'Email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        pool.query(`INSERT INTO users (first_name, last_name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, 'user', 'active')`,
            [first_name, last_name, email, phone, hashedPassword], (err, result) => {
                if (err) {
                    return res.json({ success: false, message: 'Error creating account' });
                }
                
                req.session.user = {
                    id: result.insertId,
                    first_name,
                    last_name,
                    email,
                    role: 'user'
                };
                
                res.json({ success: true, message: 'Account created', redirect: '/' });
            });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

// API - Get current user session
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ 
            success: true, 
            user: {
                id: req.session.user.id,
                first_name: req.session.user.first_name,
                last_name: req.session.user.last_name,
                email: req.session.user.email,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ success: false, user: null });
    }
});

// =====================================================
// API ROUTES - EMPLOYEES
// =====================================================

app.get('/api/employees', requireAuth, requireAdmin, (req, res) => {
    pool.query('SELECT * FROM employees ORDER BY created_at DESC', (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, employees: results });
    });
});

app.post('/api/employees', requireAuth, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone, cnic, designation, department, salary, joining_date, address } = req.body;
    
    pool.query(`INSERT INTO employees (first_name, last_name, email, phone, cnic, designation, department, salary, joining_date, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, phone, cnic, designation, department, salary, joining_date, address], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error adding employee' });
            res.json({ success: true, message: 'Employee added successfully' });
        });
});

app.put('/api/employees/:id', requireAuth, requireAdmin, (req, res) => {
    const { first_name, last_name, email, phone, cnic, designation, department, salary, joining_date, address, status } = req.body;
    
    pool.query(`UPDATE employees SET first_name=?, last_name=?, email=?, phone=?, cnic=?, designation=?, department=?, salary=?, joining_date=?, address=?, status=? WHERE id=?`,
        [first_name, last_name, email, phone, cnic, designation, department, salary, joining_date, address, status, req.params.id], (err) => {
            if (err) return res.json({ success: false, message: 'Error updating' });
            res.json({ success: true, message: 'Employee updated' });
        });
});

app.delete('/api/employees/:id', requireAuth, requireAdmin, (req, res) => {
    pool.query('DELETE FROM employees WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.json({ success: false, message: 'Error deleting' });
        res.json({ success: true, message: 'Employee deleted' });
    });
});

// =====================================================
// API ROUTES - CLIENTS
// =====================================================

app.get('/api/clients', requireAuth, requireAdmin, (req, res) => {
    pool.query('SELECT * FROM clients ORDER BY created_at DESC', (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, clients: results });
    });
});

app.post('/api/clients', requireAuth, requireAdmin, (req, res) => {
    const { company_name, contact_person, email, phone, address, company_website } = req.body;
    
    pool.query(`INSERT INTO clients (company_name, contact_person, email, phone, address, company_website) VALUES (?, ?, ?, ?, ?, ?)`,
        [company_name, contact_person, email, phone, address, company_website], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error adding client' });
            res.json({ success: true, message: 'Client added successfully' });
        });
});

app.put('/api/clients/:id', requireAuth, requireAdmin, (req, res) => {
    const { company_name, contact_person, email, phone, address, company_website, status } = req.body;
    
    pool.query(`UPDATE clients SET company_name=?, contact_person=?, email=?, phone=?, address=?, company_website=?, status=? WHERE id=?`,
        [company_name, contact_person, email, phone, address, company_website, status, req.params.id], (err) => {
            if (err) return res.json({ success: false, message: 'Error updating' });
            res.json({ success: true, message: 'Client updated' });
        });
});

app.delete('/api/clients/:id', requireAuth, requireAdmin, (req, res) => {
    pool.query('DELETE FROM clients WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.json({ success: false, message: 'Error deleting' });
        res.json({ success: true, message: 'Client deleted' });
    });
});

// =====================================================
// API ROUTES - ORDERS
// =====================================================

app.get('/api/orders', requireAuth, requireAdmin, (req, res) => {
    const query = `
        SELECT * FROM orders ORDER BY created_at DESC
    `;
    pool.query(query, (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, orders: results });
    });
});

app.post('/api/orders', requireAuth, requireAdmin, (req, res) => {
    const { client_name, service_type, description, amount, order_date } = req.body;
    console.log('ORDER DATA:', client_name, service_type, description, amount, order_date);
    
    // First check table structure
    pool.query('DESCRIBE orders', (err, columns) => {
        if (err) { console.log('DESCRIBE error:', err); }
        else { console.log('Table columns:', columns.map(c => c.Field)); }
        
        pool.query(`INSERT INTO orders (client_name, service_type, description, amount, order_date) VALUES (?, ?, ?, ?, ?)`,
            [client_name || null, service_type, description, amount, order_date], (err2, result) => {
                if (err2) { 
                    console.log('INSERT ERROR:', err2.message);
                    return res.json({ success: false, message: 'Error: ' + err2.message }); 
                }
                console.log('INSERT SUCCESS, id:', result.insertId);
                res.json({ success: true, message: 'Order created successfully' });
            });
    });
});

app.put('/api/orders/:id', requireAuth, requireAdmin, (req, res) => {
    const { service_type, description, amount, status, payment_status, order_date, completed_date } = req.body;
    
    pool.query(`UPDATE orders SET service_type=?, description=?, amount=?, status=?, payment_status=?, order_date=?, completed_date=? WHERE id=?`,
        [service_type, description, amount, status, payment_status, order_date, completed_date, req.params.id], (err) => {
            if (err) return res.json({ success: false, message: 'Error updating' });
            res.json({ success: true, message: 'Order updated' });
        });
});

app.delete('/api/orders/:id', requireAuth, requireAdmin, (req, res) => {
    pool.query('DELETE FROM orders WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.json({ success: false, message: 'Error deleting' });
        res.json({ success: true, message: 'Order deleted' });
    });
});

// =====================================================
// API ROUTES - PAYMENTS
// =====================================================

app.get('/api/payments', requireAuth, requireAdmin, (req, res) => {
    const query = `SELECT * FROM payments ORDER BY created_at DESC`;
    pool.query(query, (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, payments: results });
    });
});

app.post('/api/payments', requireAuth, requireAdmin, (req, res) => {
    const { name, email, phone, company, description, plan, amount, payment_method, status } = req.body;
    
    pool.query(`INSERT INTO payments (name, email, phone, company, description, plan, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, company, description, plan, amount, payment_method, status || 'pending'], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error creating payment' });
            res.json({ success: true, message: 'Payment created successfully' });
        });
});

app.put('/api/payments/:id', requireAuth, requireAdmin, (req, res) => {
    const { name, email, phone, company, description, plan, amount, payment_method, status } = req.body;
    
    pool.query(`UPDATE payments SET name=?, email=?, phone=?, company=?, description=?, plan=?, amount=?, payment_method=?, status=? WHERE id=?`,
        [name, email, phone, company, description, plan, amount, payment_method, status, req.params.id], (err) => {
            if (err) return res.json({ success: false, message: 'Error updating' });
            res.json({ success: true, message: 'Payment updated' });
        });
});

app.delete('/api/payments/:id', requireAuth, requireAdmin, (req, res) => {
    pool.query('DELETE FROM payments WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.json({ success: false, message: 'Error deleting' });
        res.json({ success: true, message: 'Payment deleted' });
    });
});

// =====================================================
// API ROUTES - WEBSITE SETTINGS
// =====================================================

app.get('/api/settings', requireAuth, requireAdmin, (req, res) => {
    pool.query('SELECT * FROM website_settings', (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        
        const settings = {};
        results.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json({ success: true, settings });
    });
});

app.post('/api/settings', requireAuth, requireAdmin, (req, res) => {
    const settings = req.body;
    
    const queries = Object.entries(settings).map(([key, value]) => {
        return new Promise((resolve) => {
            pool.query('INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value], (err) => resolve(err ? null : true));
        });
    });
    
    Promise.all(queries).then(() => {
        res.json({ success: true, message: 'Settings saved' });
    });
});

// =====================================================
// API ROUTES - SERVICES
// =====================================================

app.get('/api/services', (req, res) => {
    pool.query('SELECT * FROM services WHERE status = ?', ['active'], (err, results) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, services: results });
    });
});

app.post('/api/services', requireAuth, requireAdmin, (req, res) => {
    const { title, description, price, icon } = req.body;
    
    pool.query(`INSERT INTO services (title, description, price, icon) VALUES (?, ?, ?, ?)`,
        [title, description, price, icon], (err, result) => {
            if (err) return res.json({ success: false, message: 'Error' });
            res.json({ success: true, message: 'Service added' });
        });
});

app.put('/api/services/:id', requireAuth, requireAdmin, (req, res) => {
    const { title, description, price, icon, status } = req.body;
    
    pool.query(`UPDATE services SET title=?, description=?, price=?, icon=?, status=? WHERE id=?`,
        [title, description, price, icon, status, req.params.id], (err) => {
            if (err) return res.json({ success: false, message: 'Error' });
            res.json({ success: true, message: 'Service updated' });
        });
});

app.delete('/api/services/:id', requireAuth, requireAdmin, (req, res) => {
    pool.query('DELETE FROM services WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.json({ success: false, message: 'Error' });
        res.json({ success: true, message: 'Service deleted' });
    });
});

// =====================================================
// API ROUTES - ADMIN DASHBOARD STATS
// =====================================================

app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
    const stats = {};
    
    pool.query('SELECT COUNT(*) as count FROM employees', (err, r) => stats.employees = r[0].count);
    pool.query('SELECT COUNT(*) as count FROM clients', (err, r) => stats.clients = r[0].count);
    pool.query('SELECT COUNT(*) as count FROM orders', (err, r) => stats.orders = r[0].count);
    pool.query("SELECT SUM(amount) as total FROM orders WHERE payment_status = 'Paid'", (err, r) => stats.revenue = r[0].total || 0);
    pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'", (err, r) => stats.pending = r[0].count);
    
    setTimeout(() => {
        res.json({ success: true, stats });
    }, 100);
});

// =====================================================
// API ROUTES - CHECK AUTH
// =====================================================

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, authenticated: true, user: req.session.user });
    } else {
        res.json({ success: false, authenticated: false, message: 'Not logged in' });
    }
});

// =====================================================
// API ROUTES - TRIAL & PURCHASE
// =====================================================

// Activate free trial
app.post('/api/trial', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { plan } = req.body;
    
    // Check if user already has an active trial
    const checkQuery = 'SELECT * FROM user_packages WHERE user_id = ? AND status = ?';
    pool.query(checkQuery, [userId, 'trial'], (err, results) => {
        if (err) return res.json({ success: false, message: 'Database error' });
        
        if (results.length > 0) {
            return res.json({ success: false, message: 'You already have an active trial!' });
        }
        
        // Create new trial (7 days)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        
        const insertQuery = `
            INSERT INTO user_packages (user_id, package_type, package_name, status, start_date, end_date, is_trial)
            VALUES (?, ?, ?, ?, NOW(), ?, 1)
        `;
        
        pool.query(insertQuery, [userId, plan, plan, trialEndDate], (err2, result) => {
            if (err2) return res.json({ success: false, message: 'Error activating trial' });
            res.json({ success: true, message: 'Trial activated for 7 days!' });
        });
    });
});

// Process purchase
app.post('/api/purchase', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    const { plan, price, paymentMethod } = req.body;
    
    // Calculate end date (1 year from now)
    const purchaseEndDate = new Date();
    purchaseEndDate.setFullYear(purchaseEndDate.getFullYear() + 1);
    
    const insertQuery = `
        INSERT INTO user_packages (user_id, package_type, package_name, amount, payment_method, status, start_date, end_date, is_trial)
        VALUES (?, 'premium', ?, ?, ?, 'active', NOW(), ?, 0)
    `;
    
    pool.query(insertQuery, [userId, plan, price, paymentMethod, purchaseEndDate], (err, result) => {
        if (err) return res.json({ success: false, message: 'Error processing purchase' });
        
        // Get user info for payment record
        const getUserQuery = `SELECT first_name, last_name, email FROM users WHERE id = ?`;
        pool.query(getUserQuery, [userId], (errUser, userResults) => {
            if (!errUser && userResults.length > 0) {
                const user = userResults[0];
                // Create payment record
                const paymentQuery = `
                    INSERT INTO payments (name, email, plan, amount, payment_method, status, created_at)
                    VALUES (?, ?, ?, ?, ?, 'completed', NOW())
                `;
                pool.query(paymentQuery, 
                    [user.first_name + ' ' + user.last_name, user.email, plan, price, paymentMethod], 
                    (errPay, payResult) => {
                        if (errPay) console.log('Payment record error:', errPay);
                });
            }
        });
        
        // Create order record
        const orderQuery = `
            INSERT INTO orders (client_id, service_type, description, amount, order_date, status)
            VALUES (?, 'Package Purchase', ?, ?, NOW(), 'completed')
        `;
        
        pool.query(orderQuery, [userId, plan + ' Package', price], (err2, result2) => {
            if (err2) console.log('Order creation error:', err2);
        });
        
        res.json({ success: true, message: 'Purchase successful!' });
    });
});

// Get user packages
app.get('/api/user-packages', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    
    const query = 'SELECT * FROM user_packages WHERE user_id = ? ORDER BY created_at DESC';
    pool.query(query, [userId], (err, results) => {
        if (err) return res.json({ success: false, message: 'Error fetching packages' });
        res.json({ success: true, packages: results });
    });
});

// Get all user packages (admin)
app.get('/api/admin/packages', requireAuth, requireAdmin, (req, res) => {
    const query = `
        SELECT up.*, u.first_name, u.last_name, u.email 
        FROM user_packages up
        LEFT JOIN users u ON up.user_id = u.id
        ORDER BY up.created_at DESC
    `;
    pool.query(query, (err, results) => {
        if (err) return res.json({ success: false, message: 'Error fetching packages' });
        res.json({ success: true, packages: results });
    });
});

// Update package status (admin)
app.put('/api/admin/packages/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const query = 'UPDATE user_packages SET status = ? WHERE id = ?';
    pool.query(query, [status, id], (err, result) => {
        if (err) return res.json({ success: false, message: 'Error updating package' });
        res.json({ success: true, message: 'Package status updated!' });
    });
});

// =====================================================
// CONTACT FORM API ROUTES
// =====================================================

// Submit contact form (public - no auth required)
app.post('/api/contact', [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    
    const { full_name, email, phone, subject, message } = req.body;
    
    // Insert into database with parameterized query to prevent SQL injection
    pool.query(
        'INSERT INTO contact_messages (full_name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [full_name, email, phone || '', subject || '', message],
        (err, result) => {
            if (err) {
                console.error('Contact form error:', err);
                return res.status(500).json({ success: false, message: 'Failed to submit message' });
            }
            res.json({ success: true, message: 'Message sent successfully! We will contact you soon.' });
        }
    );
});

// Get all contact messages (admin only)
app.get('/api/contact-messages', requireAuth, requireAdmin, (req, res) => {
    pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
        }
        res.json({ success: true, messages: results });
    });
});

// Delete contact message (admin only)
app.delete('/api/contact-messages/:id', requireAuth, requireAdmin, (req, res) => {
    const messageId = req.params.id;
    
    pool.query('DELETE FROM contact_messages WHERE id = ?', [messageId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to delete message' });
        }
        res.json({ success: true, message: 'Message deleted successfully' });
    });
});

// Mark contact message as read (admin only)
app.put('/api/contact-messages/:id', requireAuth, requireAdmin, (req, res) => {
    const messageId = req.params.id;
    const { is_read } = req.body;
    
    pool.query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [is_read ? 1 : 0, messageId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to update message' });
        }
        res.json({ success: true, message: 'Message updated successfully' });
    });
});

// Get unread message count (admin only)
app.get('/api/contact-messages/count', requireAuth, requireAdmin, (req, res) => {
    pool.query('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, count: 0 });
        }
        res.json({ success: true, count: results[0].count });
    });
});

// =====================================================
// PAGE ROUTES
// =====================================================

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/process', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'process.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/analytics', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/projects', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

app.get('/messages', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.get('/settings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// =====================================================
// CATCH ALL ROUTE
// =====================================================

app.get('*', (req, res) => {
    res.redirect('/');
});

// =====================================================
// START SERVER - Auto-kill port if in use
// =====================================================

const { exec } = require('child_process');

// Kill any process on port 3000 before starting
const killPort = () => {
    return new Promise((resolve) => {
        exec('netstat -ano | findstr :3000 | findstr LISTENING', (err, stdout) => {
            if (stdout) {
                const lines = stdout.trim().split('\n');
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && !isNaN(pid)) {
                        console.log(`⚠️  Killing process on port 3000 (PID: ${pid})...`);
                        exec(`taskkill /F /PID ${pid}`, () => {});
                    }
                });
                setTimeout(resolve, 1000);
            } else {
                resolve();
            }
        });
    });
};

(async () => {
    await killPort();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server Running on http://localhost:${PORT}`);
        console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`🔐 Login: http://localhost:${PORT}/login`);
        console.log(`   Admin: admin@codecraft.com / admin123\n`);
    });
})();

module.exports = app;
