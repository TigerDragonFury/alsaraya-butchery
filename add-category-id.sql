-- Migration: Add category_id to products table
-- Run this in Supabase SQL Editor

-- Step 1: Add category_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Step 2: Update products to link with categories based on matching slug or name
-- This handles both cases where products.category contains slug or name
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE LOWER(p.category) = LOWER(c.slug)
   OR LOWER(p.category) = LOWER(c.name);

-- Step 3: Add foreign key constraint (optional but recommended)
-- First check that all products have been linked
-- SELECT * FROM products WHERE category_id IS NULL;

-- If all products are linked, add the constraint:
-- ALTER TABLE products
-- ADD CONSTRAINT fk_products_category
-- FOREIGN KEY (category_id) REFERENCES categories(id);

-- Step 4: Verify the migration
SELECT
    p.name as product_name,
    p.category as old_category,
    c.name as new_category_name,
    c.slug as category_slug,
    p.category_id
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.name;
