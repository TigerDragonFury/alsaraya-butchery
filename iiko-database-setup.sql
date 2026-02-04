-- =============================================
-- iiko POS Integration Database Setup
-- Al Saraya Butchery
-- =============================================

-- Add iiko-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS iiko_order_id TEXT,
ADD COLUMN IF NOT EXISTS iiko_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS iiko_sync_error TEXT,
ADD COLUMN IF NOT EXISTS iiko_synced_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN orders.iiko_order_id IS 'Order ID from iiko POS system';
COMMENT ON COLUMN orders.iiko_sync_status IS 'Sync status: pending, synced, failed';
COMMENT ON COLUMN orders.iiko_sync_error IS 'Error message if sync failed';
COMMENT ON COLUMN orders.iiko_synced_at IS 'Timestamp when order was synced to iiko';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_iiko_order_id ON orders(iiko_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_iiko_sync_status ON orders(iiko_sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_iiko_synced_at ON orders(iiko_synced_at);

-- Add iiko product ID to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS iiko_product_id TEXT,
ADD COLUMN IF NOT EXISTS iiko_category_id TEXT;

-- Add comments
COMMENT ON COLUMN products.iiko_product_id IS 'Product ID in iiko menu';
COMMENT ON COLUMN products.iiko_category_id IS 'Category ID in iiko menu';

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_iiko_product_id ON products(iiko_product_id);

-- Create view for failed syncs (for admin monitoring)
CREATE OR REPLACE VIEW orders_iiko_failed AS
SELECT 
    id,
    customer_name,
    customer_mobile,
    customer_email,
    delivery_address,
    total_amount,
    status,
    iiko_sync_status,
    iiko_sync_error,
    created_at
FROM orders
WHERE iiko_sync_status = 'failed'
ORDER BY created_at DESC;

-- Create view for pending syncs
CREATE OR REPLACE VIEW orders_iiko_pending AS
SELECT 
    id,
    customer_name,
    customer_mobile,
    total_amount,
    status,
    iiko_sync_status,
    created_at
FROM orders
WHERE iiko_sync_status = 'pending'
ORDER BY created_at DESC;

-- Create function to retry failed syncs
CREATE OR REPLACE FUNCTION retry_failed_iiko_sync(order_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET 
        iiko_sync_status = 'pending',
        iiko_sync_error = NULL
    WHERE id = order_id_param 
    AND iiko_sync_status = 'failed';
END;
$$ LANGUAGE plpgsql;

-- Create function to mark order as synced
CREATE OR REPLACE FUNCTION mark_order_iiko_synced(
    order_id_param INTEGER,
    iiko_order_id_param TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET 
        iiko_order_id = iiko_order_id_param,
        iiko_sync_status = 'synced',
        iiko_synced_at = NOW(),
        iiko_sync_error = NULL
    WHERE id = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark order sync as failed
CREATE OR REPLACE FUNCTION mark_order_iiko_failed(
    order_id_param INTEGER,
    error_message TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET 
        iiko_sync_status = 'failed',
        iiko_sync_error = error_message
    WHERE id = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON orders_iiko_failed TO authenticated;
-- GRANT SELECT ON orders_iiko_pending TO authenticated;
-- GRANT EXECUTE ON FUNCTION retry_failed_iiko_sync TO authenticated;

-- Sample query to check sync status
-- SELECT 
--     iiko_sync_status,
--     COUNT(*) as count
-- FROM orders
-- GROUP BY iiko_sync_status;

COMMENT ON VIEW orders_iiko_failed IS 'View of orders that failed to sync with iiko POS';
COMMENT ON VIEW orders_iiko_pending IS 'View of orders pending sync with iiko POS';
COMMENT ON FUNCTION retry_failed_iiko_sync IS 'Reset failed order to retry iiko sync';
COMMENT ON FUNCTION mark_order_iiko_synced IS 'Mark order as successfully synced to iiko';
COMMENT ON FUNCTION mark_order_iiko_failed IS 'Mark order as failed to sync to iiko';

-- =============================================
-- Run this script in your Supabase SQL Editor
-- =============================================
