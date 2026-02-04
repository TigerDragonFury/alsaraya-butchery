-- Import Al Saraya Products
-- Run this in Supabase SQL Editor to import all products

-- First, add arabic_name column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS arabic_name VARCHAR(255);

-- Clear existing demo products (optional)
-- DELETE FROM products WHERE id > 0;

-- Raw Meat Category
INSERT INTO products (name, arabic_name, category, description, price, unit, badge, icon, in_stock) VALUES
('Raw Kebba', 'كبة لحم نية', 'raw-meat', 'Premium raw kebba meat', 68.00, 'per kg', NULL, '🥩', TRUE),
('Raw Kofta', 'كفتة لحم نية', 'raw-meat', 'Fresh raw kofta', 68.00, 'per kg', NULL, '🥩', TRUE),
('Lamb Habra', 'هبرة نية', 'raw-meat', 'Tender lamb habra', 70.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Fuse Raw', 'فتايل غنم نية', 'raw-meat', 'Premium lamb fuse strips', 96.00, 'per kg', 'Premium', '🍖', TRUE),
('Raw Liver', 'سودة نية', 'raw-meat', 'Fresh liver', 70.00, 'per kg', NULL, '🥩', TRUE);

-- Bowels Category
INSERT INTO products (name, arabic_name, category, description, price, unit, badge, icon, in_stock) VALUES
('Lamb Liver', 'كبدة غنم', 'bowels', 'Fresh lamb liver', 55.00, 'per kg', NULL, '🍖', TRUE),
('Beef Liver', 'كبد عجل', 'bowels', 'Fresh beef liver', 55.00, 'per kg', NULL, '🥩', TRUE),
('Lamb Kidney', 'كلاوي غنم', 'bowels', 'Fresh lamb kidney', 55.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Spleen', 'طحال غنم', 'bowels', 'Fresh lamb spleen', 55.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Heart', 'قلوب غنم', 'bowels', 'Fresh lamb heart', 55.00, 'per kg', NULL, '🍖', TRUE),
('Veal Heart', 'قلب عجل', 'bowels', 'Fresh veal heart', 42.00, 'per kg', NULL, '🥩', TRUE),
('Veal Kidney', 'كلاوي عجل', 'bowels', 'Fresh veal kidney', 42.00, 'per kg', NULL, '🥩', TRUE),
('Fawargh', 'فوارغ', 'bowels', 'Traditional fawargh', 75.00, 'per kg', NULL, '🍖', TRUE),
('Karshat', 'كرشات', 'bowels', 'Fresh karshat', 65.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Trotters', 'كوارع غنم', 'bowels', 'Fresh lamb trotters', 65.00, 'per kg', NULL, '🍖', TRUE),
('Veal Trotters', 'كوارع عجل', 'bowels', 'Fresh veal trotters', 65.00, 'per kg', NULL, '🥩', TRUE),
('Lamb Tongue', 'لسانات خروف', 'bowels', 'Fresh lamb tongue', 65.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Head', 'رأس خروف', 'bowels', 'Whole lamb head', 35.00, 'per piece', NULL, '🍖', TRUE);

-- Trays Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Kibbeh Tray', 'trays', 'صينية كبة', 45.00, 'per tray', 'Popular', '🍽️', TRUE),
('Kofta Tray', 'trays', 'صينية كفتة', 45.00, 'per tray', 'Popular', '🍽️', TRUE),
('Chicken Tray', 'trays', 'صينية دجاج', 40.00, 'per tray', NULL, '🍽️', TRUE),
('Lamb Chops Tray', 'trays', 'صينية ريش غنم', 75.00, 'per tray', 'Premium', '🍽️', TRUE),
('Meat Slice Tray', 'trays', 'صينية لحم شرائح', 50.00, 'per tray', NULL, '🍽️', TRUE),
('Sausage Tray', 'trays', 'صينية سجق', 45.00, 'per tray', NULL, '🍽️', TRUE),
('Nakanek Tray', 'trays', 'صينية نقانق', 45.00, 'per tray', NULL, '🍽️', TRUE);

-- Appetizers Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Grilled Kebba 2 pcs', 'appetizers', 'كبة مشوية', 10.00, 'per pack', NULL, '🥟', TRUE),
('Meat Sambosa', 'appetizers', 'سمبوسك لحم', 17.00, 'per pack', NULL, '🥟', TRUE),
('Meat Kebba 10 pcs', 'appetizers', 'كبة لحم', 18.00, 'per pack', NULL, '🥟', TRUE),
('Shishbarak 30 pcs', 'appetizers', 'شيش برك', 17.00, 'per pack', NULL, '🥟', TRUE),
('Vegetables Sambosa 10 pcs', 'appetizers', 'سمبوسك خضار', 17.00, 'per pack', NULL, '🥟', TRUE),
('Cheese Rolls', 'appetizers', 'جبن رول', 18.00, 'per pack', NULL, '🥟', TRUE),
('Cheese Sambosa', 'appetizers', 'سمبوسك جبنة', 18.00, 'per pack', NULL, '🥟', TRUE),
('Chicken Musakhan', 'appetizers', 'مسخن دجاج', 20.00, 'per pack', NULL, '🥟', TRUE),
('Kibba Patata', 'appetizers', 'كبة بطاطا', 18.00, 'per pack', NULL, '🥟', TRUE),
('Vine Leaves 1kg', 'appetizers', 'ورق عنب 1 كيلو', 95.00, 'per kg', 'Premium', '🥟', TRUE),
('Vine Leaves 30 pcs', 'appetizers', 'ورق عنب 30 حبة', 30.00, 'per pack', NULL, '🥟', TRUE);

-- Lamb Meat Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Lamb with Bones', 'lamb', 'خروف بالعضم', 49.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Shoulder with Bones', 'lamb', 'كتف غنم بعضم', 49.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Leg with Bones', 'lamb', 'فخد غنم بالعضم', 49.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Neck with Bones', 'lamb', 'رقبة غنم بالعضم', 49.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Neck Slices w/ bones', 'lamb', 'رقبة غنم طرنشات', 49.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Loin with Bones', 'lamb', 'ظهر غنم بعضم', 56.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Loin w/ bone Slices', 'lamb', 'ظهر غنم طرنشات', 56.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Shank with Bones', 'lamb', 'موزات غنم عضم', 60.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Cubes', 'lamb', 'شقف غنم', 69.00, 'per kg', 'Popular', '🍖', TRUE),
('Lamb Small Cubes', 'lamb', 'راس عصفور غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Minced 10mm / 3mm', 'lamb', 'مفروم غنم خشن / ناعم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Slices', 'lamb', 'شرحات غنم', 86.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Knife Minced', 'lamb', 'عالسكين غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Habra', 'lamb', 'هبرة غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Chops', 'lamb', 'ريش غنم', 93.00, 'per kg', 'Premium', '🍖', TRUE),
('Lamb Loin Boneless', 'lamb', 'ظهر غنم بدون عضم', 86.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Fuse', 'lamb', 'فتايل غنم', 96.00, 'per kg', 'Premium', '🍖', TRUE),
('Lamb Shank Boneless', 'lamb', 'موزات بدون عضم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Shoulder Boneless', 'lamb', 'كتف غنم بدون عضم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Rump', 'lamb', 'دقن اللحام غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Neck Boneless', 'lamb', 'رقبة غنم بدون عضم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Straganoff', 'lamb', 'اصابع غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Ribs with Bones', 'lamb', 'اضلاع غنم بالعضم', 47.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Shehbaia', 'lamb', 'شهبيات غنم', 79.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Basmashkat', 'lamb', 'بسمشكات غنم', 92.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Leg Boneless', 'lamb', 'فخد غنم كامل بدون عضم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Leg Top Side', 'lamb', 'خد فخد غنم', 78.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Knuckle', 'lamb', 'نكل غنم', 84.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Back Side Fat', 'lamb', 'لية غنم', 38.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Inside Fat', 'lamb', 'شحمة غنم', 21.00, 'per kg', NULL, '🍖', TRUE);

-- Beef Meat Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Beef Cubes', 'beef', 'شقف عجل', 45.00, 'per kg', NULL, '🥩', TRUE),
('Beef Small Cubes', 'beef', 'راس عصفور عجل', 45.00, 'per kg', NULL, '🥩', TRUE),
('Beef Minced 10mm / 3mm', 'beef', 'مفروم عجل خشن / ناعم', 44.00, 'per kg', 'Popular', '🥩', TRUE),
('Mix Minced Meat 10mm / 3mm', 'beef', 'لحم مفروم (10) / (3)', 44.00, 'per kg', NULL, '🥩', TRUE),
('Beef Steak w/o Fat', 'beef', 'ستيك عجل بدون دهن', 75.00, 'per kg', 'Premium', '🥩', TRUE),
('Beef Straganoff', 'beef', 'اصابع عجل', 46.00, 'per kg', NULL, '🥩', TRUE),
('Beef Basmashkat', 'beef', 'بسمشكات عجل', 75.00, 'per kg', NULL, '🥩', TRUE),
('Beef Shank Boneless', 'beef', 'موزات عجل بدون عضم', 52.00, 'per kg', NULL, '🥩', TRUE),
('Beef Fillet', 'beef', 'فيلية عجل', 94.00, 'per kg', 'Premium', '🥩', TRUE),
('Beef Habra', 'beef', 'هبرة عجل', 50.00, 'per kg', NULL, '🥩', TRUE),
('Beef Rosto', 'beef', 'روستو عجل', 55.00, 'per kg', NULL, '🥩', TRUE),
('Beef Knife Minced', 'beef', 'عالسكين عجل', 45.00, 'per kg', NULL, '🥩', TRUE),
('Wagyu Minced', 'beef', 'مفروم واغيو', 74.00, 'per kg', 'Exclusive', '⭐', TRUE);

-- Chicken Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Whole Chicken', 'chicken', 'دجاج كامل', 25.00, 'per kg', 'Fresh', '🍗', TRUE),
('Chicken Breast / Steak', 'chicken', 'صدر دجاج / ستيك دجاج', 38.00, 'per kg', 'Popular', '🍗', TRUE),
('Chicken Cubes / Straganoff', 'chicken', 'شقف دجاج / اصابع دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Escalope', 'chicken', 'اسكالوب دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Burger', 'chicken', 'برغر دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Shawarma', 'chicken', 'شاورما دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Kafta', 'chicken', 'كفتة دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Nuggets', 'chicken', 'ناغتس دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Fajita / Ball', 'chicken', 'فاهيتا دجاج / كرات دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Sausage', 'chicken', 'نقانق دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Kabab', 'chicken', 'كباب دجاج', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Steak w/ Marination', 'chicken', 'ستيك دجاج بالليمون', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Tandoori', 'chicken', 'دجاج تندوري', 32.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Grilled / Minced', 'chicken', 'دجاج متبل / دجاج مفروم', 35.00, 'per kg', NULL, '🍗', TRUE),
('Shish Tawook / Lemon / Yoghurt', 'chicken', 'شيش طاووق / بالليمون / بالروب', 38.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Wings / Drumstick', 'chicken', 'جوانح دجاج / فخذ دجاج', 34.00, 'per kg', NULL, '🍗', TRUE),
('Chicken Paneh', 'chicken', 'افخاد بانيه', 40.00, 'per kg', NULL, '🍗', TRUE),
('Cordon Bleu', 'chicken', 'كوردون بلو', 42.00, 'per kg', NULL, '🍗', TRUE);

-- Skewers Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Chicken Kabab Skewers', 'skewers', 'كباب دجاج مشكوك', 41.00, 'per kg', NULL, '�串', TRUE),
('Kabab Skewers', 'skewers', 'كباب مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Beef Kabab Skewers', 'skewers', 'كباب عجل مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Indian Kabab Skewers', 'skewers', 'كباب هندي مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Eggplant Kabab Skewers', 'skewers', 'كباب باذنجان مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Iraqi Kabab Skewers', 'skewers', 'كباب عراقي مشكوك', 49.00, 'per kg', NULL, '🍢', TRUE),
('Veal Kabab Skewers', 'skewers', 'كباب بتلو مشكوك', 62.00, 'per kg', NULL, '🍢', TRUE),
('Lamb Kabab Skewers', 'skewers', 'كباب غنم مشكوك', 73.00, 'per kg', 'Premium', '🍢', TRUE),
('Beef Tekka Skewers', 'skewers', 'تكا عجل مشكوك', 48.00, 'per kg', NULL, '🍢', TRUE),
('Lamb Tekka Skewers', 'skewers', 'تكا غنم مشكوك', 73.00, 'per kg', NULL, '🍢', TRUE),
('Sushi Tekka', 'skewers', 'تكا سوشي', 73.00, 'per kg', NULL, '🍢', TRUE),
('Lamb Fuse Tekka Skewers', 'skewers', 'تكا فتايل غنم مشكوك', 89.00, 'per kg', 'Premium', '🍢', TRUE),
('Shish Tawook Skewers', 'skewers', 'شيش طاووق مشكوك', 41.00, 'per kg', NULL, '🍢', TRUE),
('Sausage Skewers', 'skewers', 'سجق لحم مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Makanek Skewers', 'skewers', 'نقانق لحم مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Chicken Sausage Skewers', 'skewers', 'نقانق دجاج مشكوك', 41.00, 'per kg', NULL, '🍢', TRUE),
('Veal Liver Skewers', 'skewers', 'كبدة عجل مشكوك', 60.00, 'per kg', NULL, '🍢', TRUE),
('Lamb Liver Skewers', 'skewers', 'كبدة غنم مشكوك', 62.00, 'per kg', NULL, '🍢', TRUE),
('Grilled Kebba Skewers', 'skewers', 'كبة على السيخ مشكوك', 46.00, 'per kg', NULL, '🍢', TRUE),
('Lamb Fat Skewers', 'skewers', 'لية مشكوك', 42.00, 'per kg', NULL, '🍢', TRUE);

-- Boxes Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Mix BBQ Box', 'boxes', 'بوكس مشاوي مشكل', 80.00, 'per box', 'Popular', '📦', TRUE),
('Burger Box', 'boxes', 'بوكس برجر', 200.00, 'per box', NULL, '📦', TRUE),
('Angus Burger Box', 'boxes', 'بوكس برجر انجوس', 275.00, 'per box', 'Premium', '📦', TRUE),
('Wagyu Burger Box', 'boxes', 'بوكس برجر واغيو', 325.00, 'per box', 'Exclusive', '📦', TRUE);

-- Local Veal Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Veal Meat with Bones Holland', 'local-veal', 'عجل هولندي محلي بالعضم', 46.00, 'per kg', NULL, '🥩', TRUE),
('Veal Meat Boneless Holland', 'local-veal', 'عجل هولندي محلي بدون عضم', 66.00, 'per kg', NULL, '🥩', TRUE),
('Veal Chops Holland', 'local-veal', 'ريش عجل هولندي محلي', 86.00, 'per kg', 'Premium', '🥩', TRUE),
('Veal Fillet Holland', 'local-veal', 'فيلية عجل هولندى محلى', 100.00, 'per kg', 'Premium', '🥩', TRUE),
('Veal Steak Holland', 'local-veal', 'ستيك عجل هولندي محلي', 78.00, 'per kg', NULL, '🥩', TRUE),
('Veal T Bone Steak Holland', 'local-veal', 'تي بون عجل هولندي محلي', 84.00, 'per kg', NULL, '🥩', TRUE),
('Veal Osso Bucco Holland', 'local-veal', 'اوسوبوكو عجل هولندي محلي', 68.00, 'per kg', NULL, '🥩', TRUE),
('Veal Rump Steak Holland', 'local-veal', 'رامب ستيك عجل هولندي محلي', 78.00, 'per kg', NULL, '🥩', TRUE),
('Veal Rosto Holland', 'local-veal', 'روستو عجل هولندي محلي', 70.00, 'per kg', NULL, '🥩', TRUE),
('Veal Top Side Steak Holland', 'local-veal', 'ستيك توب سايد عجل هولندي محلي', 72.00, 'per kg', NULL, '🥩', TRUE),
('Veal Flank Steak Holland', 'local-veal', 'فلانك ستيك عجل هولندي محلي', 72.00, 'per kg', NULL, '🥩', TRUE),
('Veal Shank Boneless/Bone Holland', 'local-veal', 'موزات عجل هولندي (بدون عضم / بعضم)', 68.00, 'per kg', NULL, '🥩', TRUE),
('Veal Brisket Holland', 'local-veal', 'بريسكت عجل هولندي محلي', 46.00, 'per kg', NULL, '🥩', TRUE),
('Veal Holland Minced 3MM / 10MM', 'local-veal', 'عجل هولندي مفروم ناعم / خشن', 59.00, 'per kg', NULL, '🥩', TRUE),
('Veal Burger Holland', 'local-veal', 'برغر عجل هولندي محلي', 59.00, 'per kg', NULL, '🥩', TRUE),
('Veal Knife Minced', 'local-veal', 'مفروم عالسكين هولندي', 66.00, 'per kg', NULL, '🥩', TRUE);

-- Steaks Category (Premium)
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Beef Rib Eye (Grain Fed)', 'specialty', 'ريب اي عجل استرالي (تغزية حبوب)', 115.00, 'per kg', 'Premium', '⭐', TRUE),
('Beef Rib eye (Grass Fed)', 'specialty', 'ريب اي عجل استرالي تغزية مرعي', 100.00, 'per kg', 'Premium', '⭐', TRUE),
('Beef Rib Eye New Zealand', 'specialty', 'ريب اي عجل نيوزلندي', 100.00, 'per kg', 'Premium', '⭐', TRUE),
('Wagyu Beef Rib Eye', 'specialty', 'ريب اي واغيو استرالي', 179.00, 'per kg', 'Exclusive', '⭐', TRUE),
('Angus Beef Rib Eye', 'specialty', 'ريب اى انجوس استرالى', 136.00, 'per kg', 'Premium', '⭐', TRUE),
('Beef Angus Fillet', 'specialty', 'فيلية انجوس استرالي', 168.00, 'per kg', 'Premium', '⭐', TRUE),
('Angus Beef Short Ribs', 'specialty', 'شورت ريس انجوس استرالي', 89.00, 'per kg', NULL, '⭐', TRUE),
('Angus Beef Brisket', 'specialty', 'بريسكت انجوس استرالي', 60.00, 'per kg', NULL, '⭐', TRUE),
('Beef Striploin', 'specialty', 'ستربليون عجل استرالي', 75.00, 'per kg', NULL, '⭐', TRUE),
('Beef Tomahawk', 'specialty', 'توما هوك عجل استرالي', 175.00, 'per kg', 'Exclusive', '⭐', TRUE),
('Beef Fillet New Zealand', 'specialty', 'فيلية بقر نيوزولندي', 130.00, 'per kg', 'Premium', '⭐', TRUE),
('Wagyu Rib Eye 4-5', 'specialty', 'واغيو ريب أي (4-5)', 289.00, 'per kg', 'Luxury', '⭐', TRUE),
('Wagyu Rib Eye 6-7', 'specialty', 'واغيو ريب اي (6-7)', 348.00, 'per kg', 'Luxury', '⭐', TRUE),
('wagyu Rib Eye 7-8', 'specialty', 'واغيو ريب أي (7-8)', 419.00, 'per kg', 'Luxury', '⭐', TRUE),
('Wagyu Rib Eye 9', 'specialty', 'واغيو ريب أي (9)', 680.00, 'per kg', 'Luxury', '⭐', TRUE),
('Wagyu Striploin 7-8', 'specialty', 'واغيو ستريليون (7-8)', 380.00, 'per kg', 'Luxury', '⭐', TRUE),
('Black Angus Striploin', 'specialty', 'بلاك انجوس ستريليون', 149.00, 'per kg', 'Premium', '⭐', TRUE),
('Black Angus Tomahawk', 'specialty', 'بلاك انجوس توما هوك', 225.00, 'per kg', 'Exclusive', '⭐', TRUE),
('Black Angus Tenderloin', 'specialty', 'بلاك انجوس تندرليون', 300.00, 'per kg', 'Luxury', '⭐', TRUE),
('Wagyu Tomahawk', 'specialty', 'واغيو توماهوك', 240.00, 'per kg', 'Exclusive', '⭐', TRUE),
('Wagyu Short Ribs', 'specialty', 'شورت ريس واغيو', 115.00, 'per kg', 'Premium', '⭐', TRUE),
('Wagyu Brisket', 'specialty', 'بريسكت واغيو', 115.00, 'per kg', 'Premium', '⭐', TRUE),
('Beef T Bone Steak', 'specialty', 'تي بون عجل', 199.00, 'per kg', 'Premium', '⭐', TRUE);

-- Marinated Category
INSERT INTO products (name, category, description, price, unit, badge, icon, in_stock) VALUES
('Meat Kafta', 'marinated', 'كفتة لحم', 44.00, 'per kg', 'Popular', '🍖', TRUE),
('Beef Kafta', 'marinated', 'كفتة عجل', 44.00, 'per kg', NULL, '🥩', TRUE),
('Veal Kofta Holland', 'marinated', 'كفتة عجل هولندي محلي', 59.00, 'per kg', NULL, '🥩', TRUE),
('Lamb Kofta', 'marinated', 'كفتة غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Meat kabab', 'marinated', 'كباب لحم', 44.00, 'per kg', 'Popular', '🍖', TRUE),
('Indian Kabab', 'marinated', 'كباب هندي', 44.00, 'per kg', NULL, '🍖', TRUE),
('Iraqi Kabab', 'marinated', 'كباب عراقي', 46.00, 'per kg', NULL, '🍖', TRUE),
('Holland Veal Kabab', 'marinated', 'كباب هولندي', 59.00, 'per kg', NULL, '🥩', TRUE),
('indian Lamb Kabab', 'marinated', 'كباب هندي غنم', 68.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Kabab', 'marinated', 'كباب غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Meat Arayes', 'marinated', 'عرايس لحم', 52.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Tekka', 'marinated', 'تكا غنم', 69.00, 'per kg', NULL, '🍖', TRUE),
('Lamb Fuse Tekka', 'marinated', 'تكا فتايل غنم', 86.00, 'per kg', 'Premium', '🍖', TRUE),
('Marinated Lamb Chops', 'marinated', 'ريش غنم متبلة', 93.00, 'per kg', 'Premium', '🍖', TRUE),
('Meat Burger', 'marinated', 'برغر لحم', 44.00, 'per kg', NULL, '🍖', TRUE),
('American Burger', 'marinated', 'برغر امريكي', 50.00, 'per kg', NULL, '🍖', TRUE),
('Wagyu Burger', 'marinated', 'برغر واغيو', 74.00, 'per kg', 'Premium', '⭐', TRUE),
('Sausage', 'marinated', 'سجق لحم', 44.00, 'per kg', NULL, '🍖', TRUE),
('Makanek', 'marinated', 'نقانق لحم', 44.00, 'per kg', NULL, '🍖', TRUE),
('Meat Ball', 'marinated', 'كرات لحم', 44.00, 'per kg', NULL, '🍖', TRUE),
('Dawood Basha Mix', 'marinated', 'داوود باشا', 44.00, 'per kg', NULL, '🍖', TRUE),
('Dawood Basha LAMB', 'marinated', 'داوود باشا غنم', 68.00, 'per kg', NULL, '🍖', TRUE),
('Meat Fahita', 'marinated', 'فاهيتا لحم', 45.00, 'per kg', NULL, '🍖', TRUE),
('Meat Shawarma', 'marinated', 'شاورما لحم', 45.00, 'per kg', NULL, '🍖', TRUE),
('Beef Escalope', 'marinated', 'اسكالوب لحم', 55.00, 'per kg', NULL, '🥩', TRUE),
('meat Ajeen w/ Vegetables', 'marinated', 'لحم عجين مع خضار', 54.00, 'per kg', NULL, '🍖', TRUE),
('Meat Ajeen w/ Pomegranate', 'marinated', 'لحم عجين مع دبس رمان', 54.00, 'per kg', NULL, '🍖', TRUE),
('Bilsahen Meat', 'marinated', 'لحم بالصحن', 44.00, 'per kg', NULL, '🍖', TRUE),
('Agenna Kebba', 'marinated', 'عجينة كية', 30.00, 'per kg', NULL, '🍖', TRUE),
('Grilled Kebba', 'marinated', 'كبة علي السيخ', 44.00, 'per kg', NULL, '🍖', TRUE),
('Cheese Kafta', 'marinated', 'كفتة جبن', 55.00, 'per kg', NULL, '🧀', TRUE);

-- Success message
SELECT 'Products imported successfully!' as message;
SELECT COUNT(*) as total_products FROM products;
