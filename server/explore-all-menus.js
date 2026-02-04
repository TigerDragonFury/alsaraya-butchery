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

async function getMenuWithId(token, menuId) {
    try {
        const response = await axios.post(
            `${IIKO_BASE_URL}/api/2/menu`,
            {
                organizationIds: [IIKO_ORG_ID],
                externalMenuId: menuId.toString()
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
        return null;
    }
}

async function exploreMenus() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║     Explore All iiko Menus - Al Saraya       ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        console.log('🔐 Authenticating...');
        const token = await getToken();
        console.log('✅ Authenticated!\n');

        console.log('🔍 Searching for available menus...\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Try different menu IDs (common patterns)
        const menuIdsToTry = [
            '9321',  // Current one
            '1',     // Default
            '0',     // Sometimes used
            '2',
            '10',
            '100',
            '1000',
            'default',
            'main',
            'delivery',
            'website'
        ];

        let menusFound = 0;
        let menusWithProducts = 0;

        for (const menuId of menuIdsToTry) {
            const menu = await getMenuWithId(token, menuId);
            
            if (menu && menu.externalMenus && menu.externalMenus.length > 0) {
                menusFound++;
                const externalMenu = menu.externalMenus[0];
                
                const itemGroups = externalMenu.itemGroups || [];
                const totalProducts = itemGroups.reduce((sum, group) => 
                    sum + (group.items?.length || 0), 0);

                if (totalProducts > 0) {
                    menusWithProducts++;
                    console.log(`✅ Menu ID: "${menuId}"`);
                    console.log(`   📦 Products: ${totalProducts}`);
                    console.log(`   📁 Categories: ${itemGroups.length}`);
                    console.log(`   🏷️  Name: ${externalMenu.name || 'Unnamed'}`);
                    
                    // Show first few products
                    if (itemGroups.length > 0 && itemGroups[0].items) {
                        console.log(`\n   Sample Products:`);
                        itemGroups[0].items.slice(0, 3).forEach(item => {
                            console.log(`      • ${item.name} (ID: ${item.itemId})`);
                            if (item.itemSizes && item.itemSizes.length > 0) {
                                console.log(`        Price: ${item.itemSizes[0].prices?.[0]?.price || 'N/A'} AED`);
                            }
                        });
                    }
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                } else {
                    console.log(`⚠️  Menu ID: "${menuId}" - Empty (0 products)`);
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`📊 Menus Found: ${menusFound}`);
        console.log(`✅ Menus with Products: ${menusWithProducts}`);
        console.log(`❌ Empty Menus: ${menusFound - menusWithProducts}\n`);

        if (menusWithProducts === 0) {
            console.log('⚠️  No menus with products found.\n');
            console.log('This means:');
            console.log('  • External menus haven\'t been configured in iiko Back Office');
            console.log('  • Products need to be added to an external menu');
            console.log('  • Menu needs to be published\n');
            console.log('💡 Alternative: Use iiko\'s internal nomenclature API');
            console.log('   This allows direct access to POS products without external menu setup\n');
        }

    } catch (error) {
        console.error('\n❌ Error exploring menus:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

exploreMenus();
