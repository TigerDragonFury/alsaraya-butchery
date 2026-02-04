-- CRITICAL FIX: RLS Policy for Payment Columns
-- Run this IMMEDIATELY in Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'orders';

-- Drop ALL policies on orders table
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read on orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read on order_items" ON orders;

-- Recreate INSERT policy (most permissive for troubleshooting)
CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Recreate SELECT policy for authenticated users
CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT
    TO authenticated
    USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, roles, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'orders';
