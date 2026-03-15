import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeDatabase, getPool } from './db/init.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

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

    const user = result.rows[0];
    
    // Calculate balance for this user (sum of approved loans - paid amounts)
    // For seed loans, calculate amount as quantity * price_per_unit
    const loansResult = await pool.query(
      `SELECT l.type, l.amount, l.paid_amount, l.quantity, l.product_id, p.price_per_unit 
       FROM loans l 
       LEFT JOIN products p ON l.product_id = p.id 
       WHERE l.member_email = $1 AND l.status = $2`,
      [user.email, 'approved']
    );
    
    // Calculate balance: total approved loan amounts minus what they've paid
    let totalLoaned = 0;
    let totalPaid = 0;
    loansResult.rows.forEach(loan => {
      let loanAmount = loan.amount || 0;
      // For seed loans, calculate amount from quantity * price_per_unit
      if (loan.type === 'seeds' && loan.quantity && loan.price_per_unit) {
        loanAmount = loan.quantity * loan.price_per_unit;
      }
      totalLoaned += parseFloat(loanAmount) || 0;
      totalPaid += parseFloat(loan.paid_amount) || 0;
    });
    
    const balance = totalLoaned - totalPaid; // positive = they owe money, negative = overpaid

    res.json({
      ...user,
      balance: parseFloat(balance.toFixed(2))
    });
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
    
    // Calculate balance for each user (sum of approved loans - paid amounts)
    const usersWithBalance = await Promise.all(
      result.rows.map(async (user) => {
        const loansResult = await pool.query(
          `SELECT l.type, l.amount, l.paid_amount, l.quantity, l.product_id, p.price_per_unit 
           FROM loans l 
           LEFT JOIN products p ON l.product_id = p.id 
           WHERE l.member_email = $1 AND l.status = $2`,
          [user.email, 'approved']
        );
        
        // Calculate balance: total approved loan amounts minus what they've paid
        let totalLoaned = 0;
        let totalPaid = 0;
        loansResult.rows.forEach(loan => {
          let loanAmount = loan.amount || 0;
          // For seed loans, calculate amount from quantity * price_per_unit
          if (loan.type === 'seeds' && loan.quantity && loan.price_per_unit) {
            loanAmount = loan.quantity * loan.price_per_unit;
          }
          totalLoaned += parseFloat(loanAmount) || 0;
          totalPaid += parseFloat(loan.paid_amount) || 0;
        });
        
        const balance = totalLoaned - totalPaid; // positive = they owe money, negative = overpaid
        
        return {
          ...user,
          balance: parseFloat(balance.toFixed(2))
        };
      })
    );
    
    res.json(usersWithBalance);
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

    // Get current product to use as fallback for missing fields
    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = currentProduct.rows[0];

    // Use provided values or fallback to existing values
    const finalName = name !== undefined && name !== null && name !== '' ? name : product.name;
    const finalCategory = category !== undefined && category !== null && category !== '' ? category : product.category;
    const finalQuantity = quantity !== undefined && quantity !== null ? quantity : product.quantity;
    const finalUnit = unit !== undefined && unit !== null ? unit : product.unit;
    const finalPrice = price_per_unit !== undefined && price_per_unit !== null ? price_per_unit : product.price_per_unit;

    // Validate that required fields are not null after fallback
    if (!finalName) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!finalCategory) {
      return res.status(400).json({ error: 'Product category is required' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, quantity = $3, unit = $4, price_per_unit = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [finalName, finalCategory, finalQuantity, finalUnit, finalPrice, productId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { reason } = req.body;
    const pool = getPool();

    // Get product details before deletion
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Delete the product
    await pool.query(
      'DELETE FROM products WHERE id = $1',
      [productId]
    );

    // Create transaction record for product removal
    await pool.query(
      'INSERT INTO transactions (member_email, member_name, type, amount, product_name, product_id, description, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        'admin@agribantay.com',
        'Admin',
        'Product Removal',
        0,
        product.name,
        productId,
        reason || 'Product removed from inventory',
        new Date().toISOString().split('T')[0]
      ]
    );

    console.log(`✅ Product deleted: ${product.name} (ID: ${productId})`);
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
      params.push(parseInt(String(req.query.product_id), 10));
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
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : null;

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
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : null;

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
    const { member_email, member_name, product_id, product_name, quantity, type, amount, purpose } = req.body;
    const status = 'pending';
    const created_date = new Date().toISOString().split('T')[0];
    const pool = getPool();

    const result = await pool.query(
      'INSERT INTO loans (member_email, member_name, product_id, product_name, quantity, type, amount, purpose, status, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [member_email, member_name, product_id || null, product_name || null, quantity || null, type, amount || null, purpose || null, status, created_date]
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
    const { status, pickup_date, decline_reason, deadline, paid_amount } = req.body;
    const pool = getPool();

    // Get the current loan
    const currentLoan = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    if (currentLoan.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    const oldStatus = currentLoan.rows[0].status;
    
    // Build query dynamically with only provided fields to avoid type coercion issues
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];
    let paramIndex = 1;  // Track parameter index based on values array, not updates array

    // Add status if provided
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // Add pickup_date if provided and not null
    if (pickup_date !== undefined && pickup_date !== null) {
      updates.push(`pickup_date = $${paramIndex}`);
      values.push(pickup_date);
      paramIndex++;
    }

    // Add deadline if provided and not null
    if (deadline !== undefined && deadline !== null) {
      updates.push(`deadline = $${paramIndex}`);
      values.push(deadline);
      paramIndex++;
    }

    // Add decline_reason if provided and not null
    if (decline_reason !== undefined && decline_reason !== null) {
      updates.push(`decline_reason = $${paramIndex}`);
      values.push(decline_reason);
      paramIndex++;
    }

    // Add paid_amount if provided and greater than 0
    if (paid_amount !== undefined && paid_amount > 0) {
      const newPaidAmount = parseFloat(currentLoan.rows[0].paid_amount || 0) + parseFloat(paid_amount);
      updates.push(`paid_amount = $${paramIndex}`);
      values.push(newPaidAmount);
      paramIndex++;
    }

    // Reset member_notified_at if status is changing
    if (status !== undefined && status !== oldStatus) {
      updates.push(`member_notified_at = NULL`);
    }

    // Add loan ID as final parameter
    values.push(loanId);

    const query = `UPDATE loans 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const updatedLoan = result.rows[0];

    // Create transaction record if status changed to approved or declined
    if (oldStatus !== status && (status === 'approved' || status === 'declined')) {
      const loanTypeLabel = updatedLoan.type === 'seeds' ? 'Seeds' : 'Capital';
      const transactionType = status === 'approved' ? `${loanTypeLabel} Loan Approved` : `${loanTypeLabel} Loan Declined`;
      
      // Calculate amount for seed loans (quantity * price_per_unit)
      let amount = updatedLoan.amount || 0;
      if (updatedLoan.type === 'seeds' && updatedLoan.quantity && updatedLoan.product_id) {
        const productResult = await pool.query('SELECT price_per_unit FROM products WHERE id = $1', [updatedLoan.product_id]);
        if (productResult.rows.length > 0) {
          amount = updatedLoan.quantity * productResult.rows[0].price_per_unit;
        }
      }

      await pool.query(
        'INSERT INTO transactions (member_email, member_name, type, amount, product_name, product_id, description, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          updatedLoan.member_email,
          updatedLoan.member_name,
          transactionType,
          amount,
          updatedLoan.product_name || null,
          updatedLoan.product_id || null,
          `${transactionType}: ${updatedLoan.type === 'seeds' ? updatedLoan.product_name : 'Capital Loan'}`,
          new Date().toISOString().split('T')[0]
        ]
      );

      console.log(`✅ Transaction created for loan ${loanId}: ${transactionType}`);
    }

    // Create transaction record if payment is recorded
    if (paid_amount !== undefined && paid_amount > 0) {
      const loanTypeLabel = updatedLoan.type === 'seeds' ? 'Seeds' : 'Capital';
      const transactionType = `${loanTypeLabel} Loan Payment`;
      
      await pool.query(
        'INSERT INTO transactions (member_email, member_name, type, amount, product_name, product_id, description, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          updatedLoan.member_email,
          updatedLoan.member_name,
          transactionType,
          paid_amount,
          updatedLoan.product_name || null,
          updatedLoan.product_id || null,
          `${transactionType}: ₱${paid_amount} paid for ${updatedLoan.type === 'seeds' ? updatedLoan.product_name : 'Capital Loan'}`,
          new Date().toISOString().split('T')[0]
        ]
      );

      console.log(`✅ Payment transaction created for loan ${loanId}: ₱${paid_amount}`);
    }

    res.json(updatedLoan);
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

// Mark a loan as paid (partially or fully)
app.post('/api/loans/:id/mark-paid', async (req, res) => {
  try {
    const loanId = parseInt(req.params.id);
    const { paid_amount } = req.body; // Amount paid this time
    const pool = getPool();

    // Get the current loan
    const currentLoan = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    if (currentLoan.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = currentLoan.rows[0];
    
    // Calculate total amount owed
    let totalAmount = loan.amount;
    if (loan.type === 'seeds' && loan.quantity && loan.product_id) {
      // For seed loans, fetch product price and calculate amount
      const productResult = await pool.query('SELECT price_per_unit FROM products WHERE id = $1', [loan.product_id]);
      if (productResult.rows.length > 0) {
        totalAmount = loan.quantity * productResult.rows[0].price_per_unit;
      }
    }
    
    const newPaidAmount = (parseFloat(loan.paid_amount) || 0) + parseFloat(paid_amount);
    const newStatus = newPaidAmount >= totalAmount ? 'settled' : 'approved';

    // Update the loan
    const result = await pool.query(
      'UPDATE loans SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newPaidAmount, newStatus, loanId]
    );

    // Create transaction for the payment
    const loanTypeLabel = loan.type === 'seeds' ? 'Seeds' : 'Capital';
    await pool.query(
      'INSERT INTO transactions (member_email, member_name, type, amount, product_name, description, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        loan.member_email,
        loan.member_name,
        `${loanTypeLabel} Loan Payment`,
        paid_amount,
        loan.product_name || null,
        `Payment for ${loan.type === 'seeds' ? loan.product_name : 'Capital'} Loan (ID: ${loanId})`,
        new Date().toISOString().split('T')[0]
      ]
    );

    console.log(`✅ Loan ${loanId} marked as paid: ₱${paid_amount}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Mark loan paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark member's loans as notified (viewed)
app.post('/api/loans/mark-notified/:memberEmail', async (req, res) => {
  try {
    const memberEmail = req.params.memberEmail;
    const pool = getPool();

    // Update all this member's loans to mark as notified
    await pool.query(
      'UPDATE loans SET member_notified_at = CURRENT_TIMESTAMP WHERE member_email = $1 AND member_notified_at IS NULL',
      [memberEmail]
    );

    console.log(`✅ Loans marked as notified for member: ${memberEmail}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Mark notified error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== TRANSACTION ENDPOINTS =====
app.get('/api/transactions', async (req, res) => {
  try {
    const pool = getPool();
    let query = 'SELECT * FROM transactions';
    const order = req.query.order;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : null;

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

app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool();
    // Actually test the database connection
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// ===== ADMIN: SEED DATABASE (for emergency re-seeding) =====
app.post('/api/admin/seed', async (req, res) => {
  try {
    const pool = getPool();
    
    // Clear existing data (order matters due to foreign keys)
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM loans');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM products');
    
    // Insert demo users
    const users = [
      { email: 'admin@example.com', password: 'admin123', name: 'Admin User', full_name: 'Admin User', role: 'admin' },
      { email: 'member1@example.com', password: 'member123', name: 'Member 1', full_name: 'Member One', role: 'member' },
      { email: 'member2@example.com', password: 'member123', name: 'Member 2', full_name: 'Member Two', role: 'member' },
      { email: 'member3@example.com', password: 'member123', name: 'Member 3', full_name: 'Member Three', role: 'member' }
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (email, password_hash, name, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        [user.email, user.password, user.name, user.full_name, user.role]
      );
    }

    // Insert demo products
    const products = [
      { name: 'Corn Seeds', quantity: 100, created_date: '2026-03-01', category: 'Seeds', unit: 'kg', price_per_unit: 50 },
      { name: 'Wheat Seeds', quantity: 50, created_date: '2026-03-02', category: 'Seeds', unit: 'kg', price_per_unit: 60 }
    ];

    for (const product of products) {
      await pool.query(
        'INSERT INTO products (name, category, quantity, unit, price_per_unit, created_date) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.name, product.category, product.quantity, product.unit, product.price_per_unit, product.created_date]
      );
    }

    res.json({ 
      success: true, 
      message: 'Database re-seeded successfully',
      credentials: {
        admin: { email: 'admin@example.com', password: 'admin123' },
        member: { email: 'member1@example.com', password: 'member123' }
      }
    });
  } catch (error) {
    console.error('❌ Seeding error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all loans and transactions (keeps users and products) - for clean slate testing
app.post('/api/admin/clear-loans', async (req, res) => {
  try {
    const pool = getPool();
    
    // Delete loans and transactions but KEEP users and products
    const txResult = await pool.query('DELETE FROM transactions');
    const loansResult = await pool.query('DELETE FROM loans');
    
    console.log(`✅ Clean slate: Cleared ${loansResult.rowCount} loans and ${txResult.rowCount} transactions`);
    res.json({ 
      success: true, 
      message: `Clean slate! Deleted ${loansResult.rowCount} loan requests and ${txResult.rowCount} transactions. Members kept.`
    });
  } catch (error) {
    console.error('❌ Clear loans error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear only transactions while keeping loans intact
app.post('/api/admin/clear-transactions', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('DELETE FROM transactions');
    
    console.log(`✅ Cleared ${result.rowCount} transactions`);
    res.json({ 
      success: true, 
      message: `Cleared ${result.rowCount} transaction records. Loan data intact.`
    });
  } catch (error) {
    console.error('❌ Clear transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all non-API routes (React Router SPA)
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Build the frontend with "npm run build"' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Accessible on WiFi at http://<your-ip>:${PORT}`);
  console.log('🔧 Loan update endpoint: Fixed dynamic parameter indexing - v2');
});
