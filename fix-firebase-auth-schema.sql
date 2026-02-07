-- ============================================
-- FIX: Change user_profiles.id from UUID to TEXT
-- Firebase Auth generates string IDs, not UUIDs
-- ============================================

-- Step 1: Drop ALL RLS policies that reference user_id columns
-- (Must be done before altering column types)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE user_addresses DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Step 3: Drop and recreate user_profiles table with TEXT id
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY,  -- Changed from UUID to TEXT for Firebase Auth
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate user_addresses table
DROP TABLE IF EXISTS user_addresses CASCADE;

CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    area TEXT NOT NULL,
    street_address TEXT NOT NULL,
    building TEXT,
    floor TEXT,
    apartment TEXT,
    landmark TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update orders table
ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON user_profiles;

-- Allow anyone to insert (for new user registration)
CREATE POLICY "Public can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (true);  -- Anyone can view profiles (needed for guest checkout)

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- User Addresses Policies  
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;

-- Allow users to manage their addresses (no auth check, managed by app)
CREATE POLICY "Users can view own addresses" ON user_addresses
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own addresses" ON user_addresses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own addresses" ON user_addresses
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete own addresses" ON user_addresses
    FOR DELETE USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at 
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDERS TABLE RLS POLICIES
-- ============================================

-- Recreate orders policies (dropped at the beginning)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (true);  -- Permissive for Firebase auth

CREATE POLICY "Public can insert orders" ON orders
    FOR INSERT WITH CHECK (true);  -- Allow order creation

-- ============================================
-- DONE!
-- Run this script in Supabase SQL Editor
-- ============================================
