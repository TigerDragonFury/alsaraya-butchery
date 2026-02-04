require('dotenv').config();
const axios = require('axios');

const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_BASE_URL = 'https://api-eu.iiko.services';

// The latest order ID from server startup
const ORDER_ID = '71f5ce4b-593e-43dc-a938-30ae081c0d64';

async function getToken() {
    const response = await axios.post(`${IIKO_BASE_URL}/api/1/access_token`, {
        apiLogin: IIKO_API_LOGIN
    });
    return response.data.token;
}

async function checkOrder() {
    try {
        console.log('\n╔═══════════════════════════════════════════════╗');
        console.log('║   Check Latest Order - Al Saraya             ║');
        console.log('╚═══════════════════════════════════════════════╝\n');

        console.log('🔐 Authenticating...');
        const token = await getToken();
        console.log('✅ Authenticated!\n');

        console.log(`📦 Checking order: ${ORDER_ID}\n`);

        const response = await axios.post(
            `${IIKO_BASE_URL}/api/1/deliveries/by_id`,
            {
                organizationId: IIKO_ORG_ID,
                orderIds: [ORDER_ID]
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📄 Full Response:', JSON.stringify(response.data, null, 2));
        console.log('\n');
        
        const orders = response.data.orders || [];
        
        if (orders.length === 0) {
            console.log('⏳ Order Status: InProgress');
            console.log('   The order is still being processed by iiko POS');
            console.log('   This can take 30 seconds to a few minutes\n');
            
            console.log('💡 Tips:');
            console.log('   • Orders in "InProgress" status are being validated');
            console.log('   • Once processed, they become searchable and visible');
            console.log('   • Run this script again in a minute to see full details\n');
            return;
        }

        const order = orders[0];
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ORDER FOUND IN IIKO POS!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`📋 Order Number: ${order.number || 'N/A'}`);
        console.log(`🆔 Order ID: ${order.id}`);
        console.log(`📅 Created: ${new Date(order.whenCreated).toLocaleString()}`);
        console.log(`📦 Status: ${order.status}`);
        console.log(`💰 Total: ${order.sum} ${order.currency || ''}`);
        
        if (order.deliveryPoint) {
            console.log(`\n📍 Delivery Details:`);
            console.log(`   Address: ${order.deliveryPoint.address?.street || 'N/A'}`);
            if (order.completeBefore) {
                console.log(`   🕐 Complete Before: ${new Date(order.completeBefore).toLocaleString()}`);
            }
        }

        if (order.customer) {
            console.log(`\n👤 Customer:`);
            console.log(`   Name: ${order.customer.name || 'N/A'}`);
            console.log(`   Phone: ${order.customer.phone || 'N/A'}`);
        }

        if (order.items && order.items.length > 0) {
            console.log(`\n🛒 Items (${order.items.length}):`);
            order.items.forEach((item, idx) => {
                console.log(`   ${idx + 1}. ${item.product?.name || 'Unknown'} x${item.amount} - ${item.sum}`);
            });
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Order successfully created and visible in iiko POS!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error checking order:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

checkOrder();
