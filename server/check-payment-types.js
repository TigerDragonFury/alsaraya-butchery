require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_LOGIN,
    orgId: process.env.IIKO_ORG_ID,
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

async function getPaymentTypes(token) {
    console.log('💳 Fetching available payment types...');
    console.log('─'.repeat(60) + '\n');

    const response = await makeRequest('POST', '/api/1/payment_types', {
        organizationIds: [IIKO_CONFIG.orgId]
    }, token);

    // Debug: show raw response structure
    console.log('Raw response structure:', JSON.stringify(response.data, null, 2));

    return response.data;
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          iiko Payment Types - Al Saraya                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Currently configured Payment Type ID: ${IIKO_CONFIG.paymentTypeId}\n`);

    try {
        const token = await getToken();
        await getPaymentTypes(token);

        console.log('═'.repeat(60));
        console.log('Recommendation:');
        console.log('═'.repeat(60));
        console.log('\nMake sure to use the correct paymentTypeKind in your order:');
        console.log('  - If payment type is "Card", use paymentTypeKind: "Card"');
        console.log('  - If payment type is "Cash", use paymentTypeKind: "Cash"');
        console.log('  - If payment type is "External", use paymentTypeKind: "External"');
        console.log('\nFor online payments (Stripe), use a Card type or External type.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
