-- Add payment tracking columns to orders table
-- Execute this in your Supabase SQL Editor

-- Step 1: Add the new columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Step 2: Add indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

-- Step 3: Update existing orders to have payment_method = 'cod' if NULL
UPDATE orders 
SET payment_method = 'cod' 
WHERE payment_method IS NULL;

UPDATE orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Step 4: Drop ALL existing INSERT policies and recreate
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'orders' AND cmd = 'INSERT'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON orders';
    END LOOP;
END $$;

-- Create fresh INSERT policy
CREATE POLICY "Allow public insert on orders" ON orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders' AND cmd = 'INSERT';

-- Step 5: Add comments for documentation
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cod (cash on delivery) or card (online payment)';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, succeeded, failed, refunded';
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe PaymentIntent ID for card payments';
