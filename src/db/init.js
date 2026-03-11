import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const { Pool } = pkg;
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create database connection pool
const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Railway requires SSL
    }
  : {
      // Try to use Railway PostgreSQL variables
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432'),
      database: process.env.PGDATABASE || process.env.DB_NAME || 'agribantay',
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
      ssl: { rejectUnauthorized: false } // Railway requires SSL
    };

console.log('📊 Database Config:', {
  usingDatabaseURL: !!process.env.DATABASE_URL,
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  pgHostSet: !!process.env.PGHOST,
  pgPortSet: !!process.env.PGPORT,
  pgDatabaseSet: !!process.env.PGDATABASE,
  pgUserSet: !!process.env.PGUSER,
  pgPasswordSet: !!process.env.PGPASSWORD
});

const pool = new Pool(poolConfig);

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split statements by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement individually
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('✅ Database schema initialized');
    
    // Add missing columns to existing tables (for migration)
    try {
      await pool.query(`
        ALTER TABLE loans 
        ADD COLUMN IF NOT EXISTS member_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS purpose TEXT,
        ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pickup_date DATE,
        ADD COLUMN IF NOT EXISTS deadline DATE,
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS member_notified_at TIMESTAMP DEFAULT NULL,
        ALTER COLUMN quantity DROP NOT NULL;
      `);
      console.log('✅ Loans table columns migrated');
    } catch (migrationError) {
      console.warn('⚠️ Migration warning (may be normal):', migrationError.message);
    }

    // Add missing columns to transactions table
    try {
      await pool.query(`
        ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS description TEXT,
        ALTER COLUMN member_name DROP NOT NULL;
      `);
      console.log('✅ Transactions table columns migrated');
    } catch (migrationError) {
      console.warn('⚠️ Migration warning (may be normal):', migrationError.message);
    }

    // Fix foreign key constraints to have CASCADE delete
    try {
      await pool.query(`
        ALTER TABLE loans 
        DROP CONSTRAINT IF EXISTS loans_product_id_fkey,
        ADD CONSTRAINT loans_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraints updated');
    } catch (migrationError) {
      console.warn('⚠️ Foreign key migration warning (may be normal):', migrationError.message);
    }
    
    // Seed initial data if tables are empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count === 0) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('❌ DATABASE INITIALIZATION FAILED:', error.message);
    console.error('Full error:', error);
    // Don't throw - let the server start anyway
  }
};

// Seed initial data
const seedInitialData = async () => {
  try {
    // Passwords (these should ideally be in env variables for production)
    const adminPassword = 'admin123';
    const memberPassword = 'member123';
    
    // Hash passwords with bcrypt
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const memberPasswordHash = await bcrypt.hash(memberPassword, 10);

    // Insert users
    const users = [
      { email: 'admin@example.com', password: adminPasswordHash, name: 'Admin User', full_name: 'Admin User', role: 'admin' },
      { email: 'member1@example.com', password: memberPasswordHash, name: 'Member 1', full_name: 'Member One', role: 'member' },
      { email: 'member2@example.com', password: memberPasswordHash, name: 'Member 2', full_name: 'Member Two', role: 'member' },
      { email: 'member3@example.com', password: memberPasswordHash, name: 'Member 3', full_name: 'Member Three', role: 'member' }
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (email, password_hash, name, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        [user.email, user.password, user.name, user.full_name, user.role]
      );
    }

    // Insert products
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

    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

export const getPool = () => pool;

export const closeDatabase = async () => {
  await pool.end();
};
