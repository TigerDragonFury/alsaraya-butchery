-- Al Saraya Butchery Database Schema
-- Execute these SQL commands in your Supabase SQL Editor

-- Table: orders
-- Stores customer order information
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    delivery_address TEXT NOT NULL,
    order_notes TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: order_items
-- Stores individual items for each order
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: products (optional - for storing product catalog)
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    arabic_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'per lb',
    badge VARCHAR(50),
    icon VARCHAR(10),
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Table: customers (optional - for customer management)
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(50) NOT NULL,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON orders(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public inserts for orders (from website)
CREATE POLICY "Allow public insert on orders" ON orders
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public insert on order_items" ON order_items
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow public read access to products
CREATE POLICY "Allow public read on products" ON products
    FOR SELECT TO anon
    USING (in_stock = true);

-- Allow authenticated users to view all orders (for admin panel)
CREATE POLICY "Allow authenticated read on orders" ON orders
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read on order_items" ON order_items
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to update order status
CREATE POLICY "Allow authenticated update on orders" ON orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Sample data insertion (optional)
INSERT INTO products (name, category, description, price, unit, badge, icon) VALUES
    ('Prime Ribeye Steak', 'beef', 'Marbled perfection with exceptional tenderness', 28.99, 'per lb', 'Premium', '🥩'),
    ('Wagyu Beef', 'beef', 'World-renowned for its buttery texture', 89.99, 'per lb', 'Exclusive', '🥩'),
    ('Lamb Chops', 'lamb', 'Tender and flavorful premium cuts', 24.99, 'per lb', 'Popular', '🍖'),
    ('Whole Lamb Leg', 'lamb', 'Perfect for roasting and special occasions', 18.99, 'per lb', NULL, '🍖'),
    ('Free Range Chicken', 'chicken', 'Farm-raised with no antibiotics', 8.99, 'per lb', 'Fresh', '🍗'),
    ('Chicken Breast', 'chicken', 'Lean and versatile protein', 6.99, 'per lb', NULL, '🍗'),
    ('Beef Tenderloin', 'beef', 'The most tender cut available', 32.99, 'per lb', 'Premium', '🥩'),
    ('Lamb Rack', 'lamb', 'Elegant presentation, superior taste', 34.99, 'per lb', 'Premium', '🍖'),
    ('Ground Beef', 'beef', '80/20 blend perfect for burgers', 7.99, 'per lb', NULL, '🥩'),
    ('Beef Short Ribs', 'beef', 'Rich, fall-off-the-bone delicious', 15.99, 'per lb', NULL, '🥩'),
    ('Lamb Shoulder', 'lamb', 'Perfect for slow cooking', 14.99, 'per lb', NULL, '🍖'),
    ('Chicken Thighs', 'chicken', 'Juicy and full of flavor', 5.99, 'per lb', NULL, '🍗'),
    ('Dry-Aged Steak', 'specialty', '45-day aged for intense flavor', 45.99, 'per lb', 'Exclusive', '⭐'),
    ('Kobe Beef', 'specialty', 'The ultimate luxury experience', 149.99, 'per lb', 'Luxury', '⭐'),
    ('Specialty Sausages', 'specialty', 'House-made with premium ingredients', 12.99, 'per lb', 'Popular', '🌭')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE orders IS 'Stores customer order information including delivery details';
COMMENT ON TABLE order_items IS 'Stores individual line items for each order';
COMMENT ON TABLE products IS 'Product catalog with pricing and availability';
COMMENT ON TABLE customers IS 'Customer database for loyalty and history tracking';

COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, preparing, out_for_delivery, delivered, cancelled';
COMMENT ON COLUMN orders.delivery_fee IS 'Delivery charge, default $5.00';
