-- Add missing columns to orders table
-- Execute this in your Supabase SQL Editor

-- Step 1: Add the missing columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS iiko_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS iiko_sync_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS iiko_sync_error TEXT,
ADD COLUMN IF NOT EXISTS iiko_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_iiko_order_id ON orders(iiko_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_iiko_sync_status ON orders(iiko_sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time ON orders(delivery_time);

-- Step 3: Update RLS policy for UPDATE operations
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
CREATE POLICY "Allow public update on orders" ON orders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN orders.iiko_order_id IS 'iiko POS order ID for syncing with POS system';
COMMENT ON COLUMN orders.iiko_sync_status IS 'iiko sync status: pending, synced, failed, fallback';
COMMENT ON COLUMN orders.iiko_sync_error IS 'Error message if iiko sync failed';
COMMENT ON COLUMN orders.iiko_synced_at IS 'Timestamp when order was synced to iiko';
COMMENT ON COLUMN orders.delivery_time IS 'Requested delivery time';
COMMENT ON COLUMN orders.notes IS 'Customer order notes';

-- Verify the policies
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY cmd;
