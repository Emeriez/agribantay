-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Seeds, equipment, etc.)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming',
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan requests
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  member_email VARCHAR(255) NOT NULL,
  member_name VARCHAR(255),
  product_id INTEGER,
  quantity INTEGER,
  amount DECIMAL(10, 2),
  type VARCHAR(50) NOT NULL,
  purpose TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Transactions/History
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(100) NOT NULL,
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255) NOT NULL,
  product_name VARCHAR(255),
  product_id INTEGER,
  created_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_loans_member_email ON loans(member_email);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_transactions_member_email ON transactions(member_email);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
