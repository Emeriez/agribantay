import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create database connection pool
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'agribantay',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    console.log('✅ Database schema initialized');
    
    // Seed initial data if tables are empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count === 0) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Seed initial data
const seedInitialData = async () => {
  try {
    // For demo purposes, we use plaintext (in production, use bcrypt)
    const adminPassword = 'admin123';
    const memberPassword = 'member123';

    // Insert users
    const users = [
      { email: 'admin@example.com', password: adminPassword, name: 'Admin User', full_name: 'Admin User', role: 'admin' },
      { email: 'member1@example.com', password: memberPassword, name: 'Member 1', full_name: 'Member One', role: 'member' },
      { email: 'member2@example.com', password: memberPassword, name: 'Member 2', full_name: 'Member Two', role: 'member' },
      { email: 'member3@example.com', password: memberPassword, name: 'Member 3', full_name: 'Member Three', role: 'member' }
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
