require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
    orgId: process.env.IIKO_ORG_ID,
    terminalId: process.env.IIKO_TERMINAL_ID,
    deliveryOrderType: process.env.IIKO_DELIVERY_ORDER_TYPE,
    collectionOrderType: process.env.IIKO_COLLECTION_ORDER_TYPE,
    websiteOrderType: process.env.IIKO_WEBSITE_ORDER_TYPE,
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

async function checkOrderById(token, orderId) {
    console.log(`\n🔍 Looking up order: ${orderId}`);
    console.log('─'.repeat(60));

    const response = await makeRequest('POST', '/api/1/deliveries/by_id', {
        organizationId: IIKO_CONFIG.orgId, // Note: singular, not array
        orderIds: [orderId]
    }, token);

    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 1000));

    if (response.data.orders && response.data.orders.length > 0) {
        const order = response.data.orders[0];
        console.log('✅ Order found!\n');
        console.log('Order Details:');
        console.log(`  ID: ${order.id}`);
        console.log(`  Number: ${order.number || 'N/A'}`);
        console.log(`  Status: ${order.status || 'Unknown'}`);
        console.log(`  Created: ${order.creationDate || 'N/A'}`);
        console.log(`  Delivery Date: ${order.whenDeliveryDate || order.deliveryDate || 'N/A'}`);
        console.log(`  Customer: ${order.customer?.name || 'N/A'}`);
        console.log(`  Phone: ${order.customer?.phone || order.phone || 'N/A'}`);
        console.log(`  Address: ${order.deliveryPoint?.address?.street?.name || 'N/A'}`);
        console.log(`  Sum: ${order.sum || 'N/A'}`);

        if (order.items && order.items.length > 0) {
            console.log(`  Items (${order.items.length}):`);
            order.items.forEach(item => {
                console.log(`    - ${item.name || item.productId}: x${item.amount}`);
            });
        }

        if (order.errorInfo) {
            console.log(`\n⚠️ Error Info: ${JSON.stringify(order.errorInfo)}`);
        }

        return order;
    } else {
        console.log('❌ Order not found in iiko system');
        console.log('   This could mean:');
        console.log('   - Order is still being processed');
        console.log('   - Order ID is incorrect');
        console.log('   - Order was rejected');
        return null;
    }
}

async function getRecentOrders(token) {
    console.log('\n📋 Fetching recent orders from iiko...');
    console.log('─'.repeat(60));

    // Search within a narrower date range (today only)
    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date();
    dateTo.setHours(23, 59, 59, 999);

    console.log(`  Date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}\n`);

    // Try multiple statuses
    const statuses = ['Unconfirmed', 'WaitCooking', 'ReadyForCooking', 'CookingStarted', 'CookingCompleted', 'Waiting', 'OnWay', 'Delivered', 'Closed', 'Cancelled'];

    const response = await makeRequest('POST', '/api/1/deliveries/by_delivery_date_and_status', {
        organizationIds: [IIKO_CONFIG.orgId],
        deliveryDateFrom: dateFrom.toISOString(),
        deliveryDateTo: dateTo.toISOString(),
        statuses: statuses
    }, token);

    console.log('Raw response:', JSON.stringify(response.data, null, 2).substring(0, 2000));

    if (response.data.orders && response.data.orders.length > 0) {
        console.log(`\n✅ Found ${response.data.orders.length} orders:\n`);

        response.data.orders.forEach((order, index) => {
            console.log(`${index + 1}. Order #${order.number || 'N/A'}`);
            console.log(`   ID: ${order.id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
            console.log(`   Delivery: ${order.completeBefore || order.whenDeliveryDate || 'N/A'}`);
            console.log(`   Sum: ${order.sum || 'N/A'}`);
            console.log('');
        });

        return response.data.orders;
    } else {
        console.log('⚠️  No orders found in the date range');
        console.log('   Note: Orders may take a moment to appear');
        return [];
    }
}

async function checkTerminalGroups(token) {
    console.log('\n🖥️  Checking terminal groups...');
    console.log('─'.repeat(60));

    const response = await makeRequest('POST', '/api/1/terminal_groups', {
        organizationIds: [IIKO_CONFIG.orgId]
    }, token);

    if (response.data.terminalGroups && response.data.terminalGroups.length > 0) {
        console.log('Terminal Groups found:\n');

        response.data.terminalGroups.forEach(org => {
            console.log(`Organization: ${org.organizationId}`);
            if (org.items) {
                org.items.forEach(terminal => {
                    const isConfigured = terminal.id === IIKO_CONFIG.terminalId;
                    console.log(`  ${isConfigured ? '✅' : '  '} ${terminal.name || 'Unknown Terminal'}`);
                    console.log(`     ID: ${terminal.id}`);
                    console.log(`     Address: ${terminal.address || 'N/A'}`);
                    if (isConfigured) {
                        console.log('     ↑ This is your configured terminal');
                    }
                });
            }
        });

        // Check if configured terminal exists
        const allTerminals = response.data.terminalGroups.flatMap(org => org.items || []);
        const configuredExists = allTerminals.some(t => t.id === IIKO_CONFIG.terminalId);

        if (!configuredExists) {
            console.log(`\n⚠️  WARNING: Configured terminal ID not found!`);
            console.log(`   Current config: ${IIKO_CONFIG.terminalId}`);
            console.log('   Orders may not appear if terminal is incorrect');
        }

        return response.data.terminalGroups;
    } else {
        console.log('⚠️  No terminal groups found');
        return [];
    }
}

async function checkOrderTypes(token) {
    console.log('\n📑 Checking order types...');
    console.log('─'.repeat(60));

    const response = await makeRequest('POST', '/api/1/deliveries/order_types', {
        organizationIds: [IIKO_CONFIG.orgId]
    }, token);

    if (response.data.orderTypes && response.data.orderTypes.length > 0) {
        console.log('Order Types found:\n');

        response.data.orderTypes.forEach(org => {
            if (org.items) {
                org.items.forEach(orderType => {
                    const isDelivery = orderType.id === IIKO_CONFIG.deliveryOrderType;
                    const isCollection = orderType.id === IIKO_CONFIG.collectionOrderType;
                    const isWebsite = orderType.id === IIKO_CONFIG.websiteOrderType;

                    let marker = '';
                    if (isDelivery) marker = '(Delivery)';
                    if (isCollection) marker = '(Collection)';
                    if (isWebsite) marker = '(Website)';

                    console.log(`  ${isDelivery || isCollection || isWebsite ? '✅' : '  '} ${orderType.name || 'Unknown'} ${marker}`);
                    console.log(`     ID: ${orderType.id}`);
                    console.log(`     Order Service Type: ${orderType.orderServiceType || 'N/A'}`);
                });
            }
        });

        return response.data.orderTypes;
    } else {
        console.log('⚠️  No order types found');
        return [];
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          iiko Order Debug Tool - Al Saraya                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Current Configuration:');
    console.log(`   API URL: ${IIKO_CONFIG.apiUrl}`);
    console.log(`   Organization ID: ${IIKO_CONFIG.orgId}`);
    console.log(`   Terminal ID: ${IIKO_CONFIG.terminalId}`);
    console.log(`   Delivery Order Type: ${IIKO_CONFIG.deliveryOrderType}`);
    console.log(`   Collection Order Type: ${IIKO_CONFIG.collectionOrderType}`);
    console.log(`   Website Order Type: ${IIKO_CONFIG.websiteOrderType}`);
    console.log(`   Payment Type ID: ${IIKO_CONFIG.paymentTypeId}`);

    try {
        const token = await getToken();

        // Get order ID from command line argument
        const orderId = process.argv[2];

        if (orderId) {
            // Check specific order
            await checkOrderById(token, orderId);
        } else {
            console.log('\n💡 Tip: Run with an order ID to check specific order:');
            console.log('   node debug-iiko-orders.js <order-id>\n');
        }

        // Check terminal groups
        await checkTerminalGroups(token);

        // Check order types
        await checkOrderTypes(token);

        // Get recent orders
        await getRecentOrders(token);

        console.log('\n' + '═'.repeat(60));
        console.log('Debug Information:');
        console.log('═'.repeat(60));
        console.log('\nIf orders are not appearing in POS, check:');
        console.log('1. Terminal Group ID matches an active terminal');
        console.log('2. Order Type ID is valid for deliveries');
        console.log('3. The completeBefore date is within expected range');
        console.log('4. Check iiko Back Office > Deliveries section');
        console.log('5. Filter by "All" status, not just "New"');
        console.log('6. Ensure POS/iikoFront is connected and synced\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

main();
