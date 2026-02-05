require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
    orgId: process.env.IIKO_ORG_ID
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sync interval in minutes (default: 15 minutes)
const SYNC_INTERVAL_MINUTES = process.env.SYNC_INTERVAL_MINUTES || 15;

let iikoToken = null;
let tokenExpiry = null;

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
    if (iikoToken && tokenExpiry && Date.now() < tokenExpiry) {
        return iikoToken;
    }

    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    
    iikoToken = response.token;
    tokenExpiry = Date.now() + (50 * 60 * 1000); // 50 minutes
    return iikoToken;
}

async function getIikoProducts() {
    const token = await getToken();
    const response = await makeRequest('POST', '/api/2/menu/by_id', {
        organizationIds: [IIKO_CONFIG.orgId],
        externalMenuId: "9321"
    }, token);

    const products = [];
    if (response && response.itemCategories && response.itemCategories.length > 0) {
        response.itemCategories.forEach(category => {
            const categoryName = category.name || 'uncategorized';
            const categoryId = category.id || null;

            if (category.items && category.items.length > 0) {
                category.items.forEach(item => {
                    const price = item.itemSizes?.[0]?.prices?.[0]?.price || 0;
                    products.push({
                        iiko_product_id: item.itemId,
                        name: item.name,
                        description: item.description || '',
                        price: price,
                        category: categoryName,
                        iiko_category_id: categoryId
                    });
                });
            }
        });
    }

    return products;
}

async function getSupabaseProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, iiko_product_id, iiko_category_id');
    
    if (error) throw error;
    return data || [];
}

async function syncProducts() {
    console.log(`\n⏰ [${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' })}] Starting product sync...`);
    
    try {
        // Fetch products from both sources
        const iikoProducts = await getIikoProducts();
        const supabaseProducts = await getSupabaseProducts();
        
        console.log(`📦 Found ${iikoProducts.length} products in iiko`);
        console.log(`💾 Found ${supabaseProducts.length} products in Supabase`);
        
        if (iikoProducts.length === 0) {
            console.log('⚠️  Menu ID 9321 is empty in iiko - skipping sync');
            return { added: 0, updated: 0, unchanged: 0 };
        }
        
        let added = 0;
        let updated = 0;
        let unchanged = 0;
        
        // Process each iiko product
        for (const iikoProduct of iikoProducts) {
            // Find matching product in Supabase
            const existing = supabaseProducts.find(p => 
                p.iiko_product_id === iikoProduct.iiko_product_id
            );
            
            if (existing) {
                // Check if product needs update
                const needsUpdate = 
                    existing.name !== iikoProduct.name ||
                    existing.price !== iikoProduct.price ||
                    existing.category !== iikoProduct.category;
                
                if (needsUpdate) {
                    console.log(`🔄 Updating: ${iikoProduct.name}`);
                    
                    const { error } = await supabase
                        .from('products')
                        .update({
                            name: iikoProduct.name,
                            description: iikoProduct.description,
                            price: iikoProduct.price,
                            category: iikoProduct.category,
                            iiko_category_id: iikoProduct.iiko_category_id
                        })
                        .eq('iiko_product_id', iikoProduct.iiko_product_id);
                    
                    if (error) {
                        console.error(`   ❌ Error updating: ${error.message}`);
                    } else {
                        updated++;
                        console.log(`   ✅ Updated successfully`);
                    }
                } else {
                    unchanged++;
                }
            } else {
                // Product doesn't exist - add it
                console.log(`➕ Adding new product: ${iikoProduct.name}`);
                
                const { error } = await supabase
                    .from('products')
                    .insert([iikoProduct]);
                
                if (error) {
                    console.error(`   ❌ Error adding: ${error.message}`);
                } else {
                    added++;
                    console.log(`   ✅ Added successfully`);
                }
            }
        }
        
        console.log(`\n📊 Sync complete:`);
        console.log(`   ➕ Added: ${added}`);
        console.log(`   🔄 Updated: ${updated}`);
        console.log(`   ✓ Unchanged: ${unchanged}`);
        
        return { added, updated, unchanged };
        
    } catch (error) {
        console.error('❌ Sync error:', error.message);
        throw error;
    }
}

async function startAutoSync() {
    console.log('🚀 Auto-sync service started');
    console.log(`⏱️  Sync interval: ${SYNC_INTERVAL_MINUTES} minutes`);
    console.log(`📡 iiko API: ${IIKO_CONFIG.apiUrl}`);
    console.log(`💾 Supabase: ${SUPABASE_URL}\n`);
    
    // Run initial sync
    await syncProducts();
    
    // Schedule periodic syncs
    setInterval(async () => {
        try {
            await syncProducts();
        } catch (error) {
            console.error('Sync failed, will retry on next interval');
        }
    }, SYNC_INTERVAL_MINUTES * 60 * 1000);
    
    console.log(`\n⏰ Next sync in ${SYNC_INTERVAL_MINUTES} minutes...\n`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down auto-sync service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down auto-sync service...');
    process.exit(0);
});

// Start the service
if (require.main === module) {
    startAutoSync().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { syncProducts };
