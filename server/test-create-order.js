require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
    orgId: process.env.IIKO_ORG_ID,
    terminalId: process.env.IIKO_TERMINAL_ID,
    websiteOrderType: process.env.IIKO_WEBSITE_ORDER_TYPE,
    deliveryOrderType: process.env.IIKO_DELIVERY_ORDER_TYPE,
    paymentTypeId: process.env.IIKO_PAYMENT_TYPE_ID
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
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function getToken() {
    console.log('🔑 Getting iiko authentication token...');
    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    if (!response.data.token) {
        throw new Error('Failed to get iiko token');
    }
    console.log('✅ Authenticated\n');
    return response.data.token;
}

// First, get a real product ID from the menu
async function getFirstProductId(token) {
    console.log('📋 Fetching a real product from menu...');
    const response = await makeRequest('POST', '/api/2/menu/by_id', {
        organizationIds: [IIKO_CONFIG.orgId],
        externalMenuId: "9321"
    }, token);

    if (response.data && response.data.itemCategories && response.data.itemCategories.length > 0) {
        for (const category of response.data.itemCategories) {
            if (category.items && category.items.length > 0) {
                const product = category.items[0];
                console.log(`✅ Found product: ${product.name}`);
                console.log(`   itemId: ${product.itemId}`);
                console.log(`   Price: ${product.itemSizes?.[0]?.prices?.[0]?.price || 0}`);
                return {
                    id: product.itemId,
                    name: product.name,
                    price: product.itemSizes?.[0]?.prices?.[0]?.price || 10
                };
            }
        }
    }
    throw new Error('No products found in menu');
}

async function createTestOrder(token, product) {
    console.log('\n📦 Creating test order...');
    console.log('─'.repeat(60));

    const orderId = generateGUID();

    // Set delivery time to 4 hours from now
    const deliveryTime = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const orderPayload = {
        organizationId: IIKO_CONFIG.orgId,
        terminalGroupId: IIKO_CONFIG.terminalId,
        order: {
            id: orderId,
            phone: '+971500000001',
            completeBefore: deliveryTime.toISOString(),
            customer: {
                name: 'Test Customer',
                phone: '+971500000001'
            },
            deliveryPoint: {
                address: {
                    street: {
                        classifierId: "00000000-0000-0000-0000-000000000000",
                        name: "Test Street"
                    },
                    house: "123"
                },
                comment: 'Test order from website integration'
            },
            items: [{
                type: "Product",
                productId: product.id,
                amount: 1,
                comment: ''
            }],
            payments: [{
                paymentTypeKind: 'Card', // Website payment type is Card in iiko
                paymentTypeId: IIKO_CONFIG.paymentTypeId,
                sum: product.price,
                isProcessedExternally: true
            }],
            comment: 'TEST ORDER - Please ignore',
            sourceKey: 'website',
            orderTypeId: IIKO_CONFIG.websiteOrderType || IIKO_CONFIG.deliveryOrderType
        }
    };

    console.log('\n📤 Request payload:');
    console.log(JSON.stringify(orderPayload, null, 2));

    const response = await makeRequest('POST', '/api/1/deliveries/create', orderPayload, token);

    console.log('\n📥 Full API Response:');
    console.log(`   Status: ${response.status}`);
    console.log('   Data:', JSON.stringify(response.data, null, 2));

    return { orderId, response };
}

async function checkCreationStatus(token, correlationId, maxAttempts = 10) {
    console.log('\n🔍 Polling order creation status...');
    console.log('─'.repeat(60));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\nAttempt ${attempt}/${maxAttempts}...`);

        // Use the correct endpoint to check creation status
        const response = await makeRequest('POST', '/api/1/commands/status', {
            organizationId: IIKO_CONFIG.orgId,
            correlationId: correlationId
        }, token);

        console.log('Status:', JSON.stringify(response.data, null, 2));

        if (response.data.state === 'Success') {
            console.log('\n✅ Order created successfully!');
            return response.data;
        } else if (response.data.state === 'Error') {
            console.log('\n❌ Order creation failed!');
            if (response.data.exception) {
                console.log('Error details:', response.data.exception);
            }
            return response.data;
        }

        // Wait 2 seconds before next attempt
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n⚠️ Status check timed out - order may still be processing');
    return null;
}

async function getOrderDetails(token, orderId) {
    console.log('\n📋 Getting order details...');
    console.log('─'.repeat(60));

    const response = await makeRequest('POST', '/api/1/deliveries/by_id', {
        organizationId: IIKO_CONFIG.orgId,
        orderIds: [orderId]
    }, token);

    console.log('Order details:', JSON.stringify(response.data, null, 2));
    return response.data;
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          iiko Test Order Creation - Al Saraya              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        const token = await getToken();

        // Get a real product
        const product = await getFirstProductId(token);

        // Create test order
        const { orderId, response } = await createTestOrder(token, product);

        // Extract any IDs from response
        const correlationId = response.data?.correlationId;
        const orderInfoId = response.data?.orderInfo?.id;
        const errorInfo = response.data?.errorInfo;
        const state = response.data?.orderInfo?.creationStatus;

        console.log('\n📊 Response Analysis:');
        console.log('─'.repeat(60));
        console.log(`   Our Order ID: ${orderId}`);
        console.log(`   Correlation ID: ${correlationId || 'N/A'}`);
        console.log(`   Order Info ID: ${orderInfoId || 'N/A'}`);
        console.log(`   Creation Status: ${state || 'N/A'}`);

        if (errorInfo) {
            console.log(`   ⚠️ Error Info: ${JSON.stringify(errorInfo)}`);
        }

        // Poll for creation status using correlation ID
        if (correlationId) {
            const creationResult = await checkCreationStatus(token, correlationId);

            // If successful, get the full order details
            if (creationResult && creationResult.state === 'Success') {
                await getOrderDetails(token, orderId);
            }
        } else {
            console.log('\n⚠️ No correlation ID available, cannot poll status');
        }

        console.log('\n' + '═'.repeat(60));
        console.log('Test Complete');
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

main();
