require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Use SERVICE KEY to bypass RLS
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
    orgId: process.env.IIKO_ORG_ID,
    menuId: process.env.IIKO_MENU_ID || '9321'
};

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, IIKO_CONFIG.apiUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function getToken() {
    console.log('🔑 Getting iiko authentication token...');
    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    if (!response.token) {
        throw new Error('Failed to get iiko token');
    }
    console.log('✅ Authenticated with iiko\n');
    return response.token;
}

async function getIikoMenu(token) {
    console.log(`📋 Fetching menu ${IIKO_CONFIG.menuId} from iiko...`);
    const response = await makeRequest('POST', '/api/2/menu/by_id', {
        organizationIds: [IIKO_CONFIG.orgId],
        externalMenuId: IIKO_CONFIG.menuId
    }, token);
    return response;
}

async function deleteAllProducts() {
    console.log('🗑️  Deleting all existing products from Supabase...');
    const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', 0); // Delete all rows

    if (error) {
        throw new Error(`Failed to delete products: ${error.message}`);
    }
    console.log('✅ All products deleted\n');
}

async function deleteAllCategories() {
    console.log('🗑️  Deleting all existing categories from Supabase...');
    const { error } = await supabase
        .from('categories')
        .delete()
        .neq('id', 0); // Delete all rows

    if (error) {
        // Category table might not exist or might have different structure
        console.log(`⚠️  Could not delete categories: ${error.message}`);
        return false;
    }
    console.log('✅ All categories deleted\n');
    return true;
}

async function insertCategories(categories) {
    console.log(`📁 Inserting ${categories.length} categories...`);

    const { data, error } = await supabase
        .from('categories')
        .insert(categories)
        .select();

    if (error) {
        console.log(`⚠️  Could not insert categories: ${error.message}`);
        return null;
    }

    console.log(`✅ Inserted ${data.length} categories\n`);
    return data;
}

async function insertProducts(products, batchSize = 100) {
    console.log(`📦 Inserting ${products.length} products in batches of ${batchSize}...`);

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(products.length / batchSize);

        process.stdout.write(`   Batch ${batchNum}/${totalBatches}...`);

        const { data, error } = await supabase
            .from('products')
            .insert(batch)
            .select();

        if (error) {
            console.log(` ❌ Error: ${error.message}`);
            failed += batch.length;
        } else {
            console.log(` ✅ ${data.length} products`);
            inserted += data.length;
        }
    }

    console.log(`\n📊 Results: ${inserted} inserted, ${failed} failed\n`);
    return inserted;
}

async function main() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║  iiko to Supabase Full Import                      ║');
    console.log('║  This will DELETE all existing data and reimport   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    try {
        // Step 1: Get iiko token
        const token = await getToken();

        // Step 2: Fetch menu from iiko
        const menuData = await getIikoMenu(token);

        if (!menuData || !menuData.itemCategories || menuData.itemCategories.length === 0) {
            console.log('❌ No menu data returned from iiko');
            return;
        }

        console.log(`✅ Found ${menuData.itemCategories.length} categories in iiko\n`);

        // Step 3: Parse categories and products
        const categories = [];
        const products = [];
        const usedSlugs = new Set();

        menuData.itemCategories.forEach((category, index) => {
            const name = category.name || 'Uncategorized';
            // Generate slug from name (lowercase, replace spaces/special chars with hyphens)
            let slug = name.toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
                .replace(/\s+/g, '-')      // Replace spaces with hyphens
                .replace(/-+/g, '-')       // Replace multiple hyphens with single
                .substring(0, 50);         // Limit length

            // Ensure unique slug
            if (usedSlugs.has(slug)) {
                slug = `${slug}-${index + 1}`;
            }
            usedSlugs.add(slug);

            const categoryData = {
                name: name,
                slug: slug,
                description: category.description || ''
            };
            categories.push(categoryData);

            if (category.items && category.items.length > 0) {
                category.items.forEach(item => {
                    const price = item.itemSizes?.[0]?.prices?.[0]?.price || 0;

                    products.push({
                        name: item.name,
                        description: item.description || '',
                        price: price,
                        category: category.name || 'Uncategorized',
                        image_url: item.buttonImageUrl || null,
                        iiko_product_id: item.itemId,
                        iiko_category_id: category.id
                    });
                });
            }
        });

        console.log(`📊 Parsed: ${categories.length} categories, ${products.length} products\n`);

        // Step 4: Delete existing data
        await deleteAllProducts();
        await deleteAllCategories();

        // Step 5: Insert categories (if table exists)
        await insertCategories(categories);

        // Step 6: Insert products
        const insertedCount = await insertProducts(products);

        // Summary
        console.log('═══════════════════════════════════════════════════');
        console.log('                    IMPORT COMPLETE                 ');
        console.log('═══════════════════════════════════════════════════');
        console.log(`  Categories: ${categories.length}`);
        console.log(`  Products:   ${insertedCount} / ${products.length}`);
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

main();
