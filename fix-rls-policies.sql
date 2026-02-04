-- Fix Row Level Security (RLS) policies for admin operations
-- Run this in your Supabase SQL Editor

-- Disable RLS on products table (for development/testing)
-- Or enable RLS with permissive policies

-- Option 1: Disable RLS (simpler, less secure)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with permissive policies (more secure)
-- Uncomment these if you want to use RLS:

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- 
-- -- Allow all operations on products
-- DROP POLICY IF EXISTS "Allow all on products" ON products;
-- CREATE POLICY "Allow all on products" ON products
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
--
-- -- Allow all operations on orders
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all on orders" ON orders;
-- CREATE POLICY "Allow all on orders" ON orders
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
--
-- -- Allow all operations on order_items
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all on order_items" ON order_items;
-- CREATE POLICY "Allow all on order_items" ON order_items
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
