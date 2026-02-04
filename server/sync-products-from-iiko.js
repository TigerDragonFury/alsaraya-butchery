require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_KEY,
    orgId: process.env.IIKO_ORG_ID
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
    console.log('🔑 Getting authentication token...');
    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    return response.token;
}

async function getMenu(token) {
    console.log('📋 Fetching menu from iiko...\n');
    
    const response = await makeRequest('POST', '/api/2/menu', {
        organizationIds: [IIKO_CONFIG.orgId],
        externalMenuId: "9321"
    }, token);
    
    return response;
}

function generateSupabaseInsert(products) {
    console.log('\n📝 Supabase INSERT statements:\n');
    console.log('-- Copy and paste this into your Supabase SQL Editor\n');
    
    products.forEach((product, index) => {
        const name = product.name.replace(/'/g, "''"); // Escape single quotes
        const description = (product.description || '').replace(/'/g, "''");
        const price = product.price || 0;
        const category = product.category || 'uncategorized';
        const iikoProductId = product.id;
        const iikoCategoryId = product.categoryId || null;
        
        console.log(`-- Product ${index + 1}: ${product.name}`);
        console.log(`INSERT INTO products (name, description, price, category, iiko_product_id, iiko_category_id)`);
        console.log(`VALUES ('${name}', '${description}', ${price}, '${category}', '${iikoProductId}', ${iikoCategoryId ? `'${iikoCategoryId}'` : 'NULL'});`);
        console.log('');
    });
}

function generateSupabaseUpdate(iikoProducts, supabaseProducts) {
    console.log('\n🔄 Supabase UPDATE statements (for existing products):\n');
    console.log('-- Map existing Supabase products to iiko product IDs\n');
    
    iikoProducts.forEach((iikoProduct) => {
        // Try to find matching product in Supabase by name similarity
        const match = supabaseProducts.find(sp => 
            sp.name.toLowerCase().includes(iikoProduct.name.toLowerCase().substring(0, 5))
        );
        
        if (match) {
            console.log(`-- Match found: "${match.name}" → "${iikoProduct.name}"`);
            console.log(`UPDATE products SET iiko_product_id = '${iikoProduct.id}' WHERE id = ${match.id};`);
        } else {
            console.log(`-- No match for: "${iikoProduct.name}" (you'll need to insert this)`);
        }
        console.log('');
    });
}

async function main() {
    try {
        const token = await getToken();
        console.log('✅ Authentication successful\n');
        
        const menuData = await getMenu(token);
        
        if (!menuData || menuData.length === 0) {
            console.log('⚠️  No menu data returned from iiko');
            console.log('📌 This means Menu ID 9321 is still empty in Back Office');
            console.log('\n💡 Next steps:');
            console.log('   1. Log into iiko Back Office');
            console.log('   2. Navigate to Menu → External Menus → Menu 9321');
            console.log('   3. Add products from your POS catalog');
            console.log('   4. Publish the menu');
            console.log('   5. Run this script again\n');
            return;
        }
        
        // Parse products
        const products = [];
        menuData.forEach(org => {
            if (org.products && org.products.length > 0) {
                org.products.forEach(product => {
                    products.push({
                        id: product.id,
                        name: product.name,
                        description: product.description || '',
                        price: product.price || 0,
                        category: product.category || 'uncategorized',
                        categoryId: product.categoryId || null
                    });
                });
            }
        });
        
        console.log(`✅ Found ${products.length} products in Menu ID 9321\n`);
        
        if (products.length === 0) {
            console.log('⚠️  Menu ID 9321 is empty');
            console.log('📌 Add products in iiko Back Office first\n');
            return;
        }
        
        // Display products
        console.log('📦 Products found:\n');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Price: ${product.price}`);
            console.log(`   Category: ${product.category}\n`);
        });
        
        // Generate SQL statements
        generateSupabaseInsert(products);
        
        console.log('\n📋 Summary:');
        console.log(`   • Total products: ${products.length}`);
        console.log(`   • Copy the SQL statements above`);
        console.log(`   • Run them in Supabase SQL Editor`);
        console.log(`   • Or manually update your existing products with iiko_product_id values\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
    }
}

main();
