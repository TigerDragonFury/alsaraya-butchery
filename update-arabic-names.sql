-- Copy Arabic descriptions to arabic_name column
-- This SQL updates products where the description contains Arabic characters
-- and the arabic_name column is empty or null

UPDATE products
SET arabic_name = description
WHERE 
    -- Check if description contains Arabic characters (Unicode range U+0600 to U+06FF)
    description ~ '[\u0600-\u06FF]'
    -- Only update if arabic_name is empty or null
    AND (arabic_name IS NULL OR arabic_name = '');

-- Verify the updates
SELECT id, name, description, arabic_name 
FROM products 
WHERE description ~ '[\u0600-\u06FF]'
ORDER BY category, name;
