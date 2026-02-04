-- Fix Row Level Security Policies for Al Saraya Butchery
-- Run this in your Supabase SQL Editor to fix the 401/RLS errors

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public read on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated update on orders" ON orders;

-- Disable RLS temporarily to ensure tables are accessible
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access (website orders)
-- Policy 1: Allow anyone to insert orders
CREATE POLICY "Enable insert for anon users" ON orders
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Allow anyone to insert order items
CREATE POLICY "Enable insert for anon users" ON order_items
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 3: Allow public to read products (for shop display)
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- Policy 4: Allow authenticated users (admin) to read all orders
CREATE POLICY "Enable read for authenticated users" ON orders
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy 5: Allow authenticated users (admin) to read order items
CREATE POLICY "Enable read for authenticated users" ON order_items
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy 6: Allow authenticated users (admin) to update orders
CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 7: Allow authenticated users to manage products
CREATE POLICY "Enable all for authenticated users" ON products
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'products', 'customers')
ORDER BY tablename, policyname;

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON orders TO anon, authenticated;
GRANT INSERT ON order_items TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT, UPDATE ON orders TO authenticated;
GRANT SELECT ON order_items TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON customers TO authenticated;

-- Grant sequence permissions (needed for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been successfully updated!';
    RAISE NOTICE 'Your website should now be able to create orders.';
END $$;
