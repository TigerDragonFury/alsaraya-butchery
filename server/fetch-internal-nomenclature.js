require('dotenv').config();
const axios = require('axios');

const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_BASE_URL = 'https://api-eu.iiko.services';

async function getToken() {
    const response = await axios.post(`${IIKO_BASE_URL}/api/1/access_token`, {
        apiLogin: IIKO_API_LOGIN
    });
    return response.data.token;
}

async function getNomenclature(token) {
    try {
        const response = await axios.post(
            `${IIKO_BASE_URL}/api/1/nomenclature`,
            {
                organizationId: IIKO_ORG_ID
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function fetchInternalProducts() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   iiko Internal Nomenclature - Al Saraya    ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        console.log('🔐 Authenticating...');
        const token = await getToken();
        console.log('✅ Authenticated!\n');

        console.log('📦 Fetching internal nomenclature (POS products)...\n');

        const nomenclature = await getNomenclature(token);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Nomenclature Overview');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const products = nomenclature.products || [];
        const groups = nomenclature.groups || [];
        const productCategories = nomenclature.productCategories || [];

        console.log(`📊 Statistics:`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Groups: ${groups.length}`);
        console.log(`   Categories: ${productCategories.length}\n`);

        if (products.length > 0) {
            console.log('✅ PRODUCTS FOUND IN POS!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Sample Products (First 10)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            products.slice(0, 10).forEach((product, idx) => {
                console.log(`${idx + 1}. ${product.name}`);
                console.log(`   ID: ${product.id}`);
                console.log(`   Type: ${product.type || 'N/A'}`);
                if (product.parentGroup) {
                    const group = groups.find(g => g.id === product.parentGroup);
                    console.log(`   Group: ${group?.name || product.parentGroup}`);
                }
                if (product.sizePrices && product.sizePrices.length > 0) {
                    const price = product.sizePrices[0].price?.currentPrice;
                    if (price) {
                        console.log(`   Price: ${price} AED`);
                    }
                }
                console.log('');
            });

            if (products.length > 10) {
                console.log(`... and ${products.length - 10} more products\n`);
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Product Groups');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            groups.slice(0, 10).forEach((group, idx) => {
                const groupProducts = products.filter(p => p.parentGroup === group.id);
                console.log(`${idx + 1}. ${group.name}`);
                console.log(`   ID: ${group.id}`);
                console.log(`   Products: ${groupProducts.length}`);
                console.log('');
            });

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💡 Next Steps');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('✅ You can now:');
            console.log('   1. Use these product IDs directly in orders');
            console.log('   2. Map them to your website products in the database');
            console.log('   3. Create orders without needing external menu setup\n');
            console.log('💾 To save these products to database:');
            console.log('   Run: node sync-products-from-iiko.js\n');

        } else {
            console.log('⚠️  No products found in internal nomenclature either.\n');
            console.log('This is unusual and might indicate:');
            console.log('  • API permissions issue');
            console.log('  • No products configured in iiko POS');
            console.log('  • Organization ID incorrect\n');
        }

        // Save to file for reference
        const fs = require('fs');
        fs.writeFileSync(
            'iiko-nomenclature.json',
            JSON.stringify(nomenclature, null, 2)
        );
        console.log('📄 Full nomenclature saved to: iiko-nomenclature.json\n');

    } catch (error) {
        console.error('\n❌ Error fetching nomenclature:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

fetchInternalProducts();
