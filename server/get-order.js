require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
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
    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    if (!response.token) {
        throw new Error('Failed to get iiko token');
    }
    return response.token;
}

async function getOrderById(orderId) {
    console.log(`\nFetching order: ${orderId}\n`);
    console.log('─'.repeat(60));

    const token = await getToken();

    const response = await makeRequest('POST', '/api/1/deliveries/by_id', {
        organizationId: IIKO_CONFIG.orgId,
        orderIds: [orderId]
    }, token);

    if (response.orders && response.orders.length > 0) {
        const order = response.orders[0];
        const orderData = order.order;

        console.log('\n Order Found!\n');
        console.log(`  Order ID:     ${order.id}`);
        console.log(`  Order #:      ${orderData?.number || 'N/A'}`);
        console.log(`  Status:       ${orderData?.status || 'Unknown'}`);
        console.log(`  Created:      ${orderData?.whenCreated || 'N/A'}`);
        console.log(`  Delivery By:  ${orderData?.completeBefore || 'N/A'}`);

        console.log('\n  Customer:');
        console.log(`    Name:       ${orderData?.customer?.name || 'N/A'}`);
        console.log(`    Phone:      ${orderData?.phone || 'N/A'}`);

        if (orderData?.deliveryPoint?.address) {
            const addr = orderData.deliveryPoint.address;
            console.log('\n  Delivery Address:');
            console.log(`    Street:     ${addr.street?.name || 'N/A'}`);
            console.log(`    House:      ${addr.house || 'N/A'}`);
            console.log(`    Flat:       ${addr.flat || 'N/A'}`);
            if (orderData.deliveryPoint.comment) {
                console.log(`    Comment:    ${orderData.deliveryPoint.comment}`);
            }
        }

        if (orderData?.items && orderData.items.length > 0) {
            console.log(`\n  Items (${orderData.items.length}):`);
            orderData.items.forEach((item, i) => {
                console.log(`    ${i + 1}. ${item.product?.name || item.productId}`);
                console.log(`       Qty: ${item.amount} | Price: ${item.price} | Total: ${item.resultSum}`);
            });
        }

        if (orderData?.payments && orderData.payments.length > 0) {
            console.log('\n  Payments:');
            orderData.payments.forEach(payment => {
                console.log(`    - ${payment.paymentType?.name || 'Unknown'}: ${payment.sum}`);
                console.log(`      Kind: ${payment.paymentType?.kind || 'N/A'}, External: ${payment.isProcessedExternally}`);
            });
        }

        console.log(`\n  Order Total:  ${orderData?.sum || 'N/A'}`);

        if (orderData?.comment) {
            console.log(`  Comment:      ${orderData.comment}`);
        }

        console.log('\n─'.repeat(60));
        console.log('\nFull JSON response saved to: order-details.json');

        // Save full response to file
        require('fs').writeFileSync(
            'order-details.json',
            JSON.stringify(response, null, 2)
        );

        return order;
    } else {
        console.log('\n Order not found');
        console.log('\nPossible reasons:');
        console.log('  - Order ID is incorrect');
        console.log('  - Order was deleted');
        console.log('  - Order is still being processed');
        return null;
    }
}

// Main
const orderId = process.argv[2];

if (!orderId) {
    console.log('Usage: node get-order.js <order-id>');
    console.log('\nExample:');
    console.log('  node get-order.js 0ce45f6d-bbdf-4d8d-bdeb-a143854452a2');
    process.exit(1);
}

getOrderById(orderId).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
