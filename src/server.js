import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getPool } from './db/init.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from Vite build (dist folder)
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize database on startup
await initializeDatabase();

// ===== AUTH ENDPOINTS =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Login failed - User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    // In production, use bcrypt to compare password hashes
    if (user.password_hash !== password) {
      console.log('❌ Login failed - Invalid credentials:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ Login successful:', { email, role: user.role, id: user.id });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      full_name: user.full_name,
      role: user.role
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const userId = parseInt(token);

    if (isNaN(userId)) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, full_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== USER ENDPOINTS =====
app.get('/api/users', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, email, name, full_name, role FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, full_name, email, role } = req.body;
    const pool = getPool();

    const result = await pool.query(
      'UPDATE users SET name = $1, full_name = $2, email = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, name, full_name, role',
      [name, full_name, email, role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PRODUCT ENDPOINTS =====
app.get('/api/products', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, quantity, unit, price_per_unit } = req.body;
    const created_date = new Date().toISOString().split('T')[0];
    const pool = getPool();

    const result = await pool.query(
      'INSERT INTO products (name, category, quantity, unit, price_per_unit, created_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, quantity, unit, price_per_unit, created_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, category, quantity, unit, price_per_unit } = req.body;
    const pool = getPool();

    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, quantity = $3, unit = $4, price_per_unit = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, category, quantity, unit, price_per_unit, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const pool = getPool();

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/filter', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM products';
    const params = [];

    if (req.query.product_id) {
      query += ' WHERE id = $1';
      params.push(parseInt(req.query.product_id));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Filter products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== EVENT ENDPOINTS =====
app.get('/api/events', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM events';
    const order = req.query.order;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (order === '-event_date') {
      query += ' ORDER BY event_date DESC';
    } else {
      query += ' ORDER BY id';
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, event_date, location, image_url, author_name, author_email, status } = req.body;
    const created_date = new Date().toISOString().split('T')[0];
    const pool = getPool();

    const result = await pool.query(
      'INSERT INTO events (title, description, event_date, location, image_url, author_name, author_email, status, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, description, event_date, location, image_url, author_name, author_email, status || 'upcoming', created_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const pool = getPool();

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== LOAN REQUEST ENDPOINTS =====
app.get('/api/loans', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM loans';
    const order = req.query.order;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (order === '-created_date') {
      query += ' ORDER BY created_date DESC';
    } else {
      query += ' ORDER BY id';
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get loans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const { member_email, product_id, quantity, type } = req.body;
    const status = 'pending';
    const created_date = new Date().toISOString().split('T')[0];
    const pool = getPool();

    const result = await pool.query(
      'INSERT INTO loans (member_email, product_id, quantity, type, status, created_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [member_email, product_id, quantity, type, status, created_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create loan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/loans/:id', async (req, res) => {
  try {
    const loanId = parseInt(req.params.id);
    const { status } = req.body;
    const pool = getPool();

    const result = await pool.query(
      'UPDATE loans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, loanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update loan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/loans/filter', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM loans WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (req.body.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(req.body.status);
      paramIndex++;
    }

    if (req.body.member_email) {
      query += ` AND member_email = $${paramIndex}`;
      params.push(req.body.member_email);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Filter loans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== TRANSACTION ENDPOINTS =====
app.get('/api/transactions', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM transactions';
    const order = req.query.order;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (order === '-created_date') {
      query += ' ORDER BY created_date DESC';
    } else {
      query += ' ORDER BY id';
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    console.log("🔄 Fetching transactions from database...");
    const result = await pool.query(query);
    console.log("✅ Transactions returned:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, type, member_name, member_email, product_name, product_id } = req.body;
    const created_date = new Date().toISOString().split('T')[0];
    const pool = getPool();

    const result = await pool.query(
      'INSERT INTO transactions (amount, type, member_name, member_email, product_name, product_id, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [amount, type, member_name, member_email, product_name, product_id, created_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions/filter', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (req.body.product_id) {
      query += ` AND product_id = $${paramIndex}`;
      params.push(req.body.product_id);
      paramIndex++;
    }

    if (req.body.member_email) {
      query += ` AND member_email = $${paramIndex}`;
      params.push(req.body.member_email);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Filter transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== AUTH LOGOUT =====
app.post('/api/auth/logout', (req, res) => {
  console.log('🔒 User logout request received');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ===== DIAGNOSTIC ENDPOINTS =====
app.get('/api/diagnostic/users', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, email, name, full_name, role FROM users');
    console.log('🔍 Diagnostic: All users in database:', JSON.stringify(result.rows, null, 2));
    res.json({
      users: result.rows,
      message: 'Check console on server for full details'
    });
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Serve index.html for all non-API routes (React Router SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Accessible on WiFi at http://<your-ip>:${PORT}`);
});
