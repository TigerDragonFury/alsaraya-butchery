-- Add Arabic Name Column to Products Table
-- Run this FIRST before importing products

ALTER TABLE products ADD COLUMN IF NOT EXISTS arabic_name VARCHAR(255);

-- Success message
SELECT 'Arabic name column added successfully!' as message;
