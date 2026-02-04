-- Fix RLS for Orders Tables
-- Run this in Supabase SQL Editor to allow order submissions

-- Disable RLS on orders and order_items tables (simplest solution for small business)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you prefer to keep RLS enabled with proper policies:
-- (Uncomment the lines below and comment out the DISABLE lines above)

-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
-- DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
-- DROP POLICY IF EXISTS "Allow public insert on order_items" ON order_items;
-- DROP POLICY IF EXISTS "Allow public select on order_items" ON order_items;

-- CREATE POLICY "Allow public insert on orders" ON orders
--     FOR INSERT TO anon, authenticated
--     WITH CHECK (true);

-- CREATE POLICY "Allow public select on orders" ON orders
--     FOR SELECT TO anon, authenticated
--     USING (true);

-- CREATE POLICY "Allow public insert on order_items" ON order_items
--     FOR INSERT TO anon, authenticated
--     WITH CHECK (true);

-- CREATE POLICY "Allow public select on order_items" ON order_items
--     FOR SELECT TO anon, authenticated
--     USING (true);

-- Verify settings
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'products');
