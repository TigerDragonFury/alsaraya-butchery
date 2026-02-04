const axios = require('axios');
require('dotenv').config();

const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_BASE_URL = 'https://api-eu.iiko.services';
const IIKO_TERMINAL_ID = process.env.IIKO_TERMINAL_ID;
const IIKO_WEBSITE_ORDER_TYPE = process.env.IIKO_WEBSITE_ORDER_TYPE;
const IIKO_PAYMENT_TYPE_ID = process.env.IIKO_PAYMENT_TYPE_ID;

async function getToken() {
    const response = await axios.post(`${IIKO_BASE_URL}/api/1/access_token`, {
        apiLogin: IIKO_API_LOGIN
    });
    return response.data.token;
}

function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function testMinimalOrder() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   Test: Can we create order with empty items?║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        console.log('🔐 Authenticating...');
        const token = await getToken();
        console.log('✅ Authenticated!\n');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        // Test 1: Order with empty items array
        console.log('📋 Test 1: Order with empty items array\n');
        
        const orderWithEmptyItems = {
            organizationId: IIKO_ORG_ID,
            terminalGroupId: IIKO_TERMINAL_ID,
            order: {
                id: generateGUID(),
                date: new Date().toISOString(),
                phone: '+971500000000',
                completeBefore: tomorrow.toISOString(),
                customer: {
                    name: 'Test Customer',
                    phone: '+971500000000'
                },
                deliveryPoint: {
                    address: {
                        street: {
                            classifierId: "00000000-0000-0000-0000-000000000000",
                            name: 'Test Address, Dubai'
                        },
                        house: '123'
                    },
                    comment: 'Test order with no items'
                },
                items: [], // Empty items array
                payments: [{
                    paymentTypeKind: 'Cash',
                    paymentTypeId: IIKO_PAYMENT_TYPE_ID,
                    sum: 0,
                    isProcessedExternally: true
                }],
                comment: 'Test: Empty items array',
                sourceKey: 'website',
                orderTypeId: IIKO_WEBSITE_ORDER_TYPE
            }
        };

        try {
            const response1 = await axios.post(
                `${IIKO_BASE_URL}/api/1/deliveries/create`,
                orderWithEmptyItems,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ SUCCESS! Order with empty items created:');
            console.log(JSON.stringify(response1.data, null, 2));
        } catch (error) {
            console.log('❌ FAILED: Order with empty items');
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Error:', JSON.stringify(error.response.data, null, 2));
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Test 2: Order without items field at all
        console.log('📋 Test 2: Order without items field\n');
        
        const orderWithoutItems = {
            organizationId: IIKO_ORG_ID,
            terminalGroupId: IIKO_TERMINAL_ID,
            order: {
                id: generateGUID(),
                date: new Date().toISOString(),
                phone: '+971500000000',
                completeBefore: tomorrow.toISOString(),
                customer: {
                    name: 'Test Customer',
                    phone: '+971500000000'
                },
                deliveryPoint: {
                    address: {
                        street: {
                            classifierId: "00000000-0000-0000-0000-000000000000",
                            name: 'Test Address, Dubai'
                        },
                        house: '123'
                    },
                    comment: 'Test order with no items field'
                },
                // No items field
                payments: [{
                    paymentTypeKind: 'Cash',
                    paymentTypeId: IIKO_PAYMENT_TYPE_ID,
                    sum: 0,
                    isProcessedExternally: true
                }],
                comment: 'Test: No items field',
                sourceKey: 'website',
                orderTypeId: IIKO_WEBSITE_ORDER_TYPE
            }
        };

        try {
            const response2 = await axios.post(
                `${IIKO_BASE_URL}/api/1/deliveries/create`,
                orderWithoutItems,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ SUCCESS! Order without items field created:');
            console.log(JSON.stringify(response2.data, null, 2));
        } catch (error) {
            console.log('❌ FAILED: Order without items field');
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Error:', JSON.stringify(error.response.data, null, 2));
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('If both tests failed, orders MUST have valid product items.');
        console.log('You will need to either:');
        console.log('  1. Wait for Back Office access to configure products');
        console.log('  2. Manually enter orders into iiko POS');
        console.log('  3. Create a dummy "Website Order" product in iiko\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testMinimalOrder();
