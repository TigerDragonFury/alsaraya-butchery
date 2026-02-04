require('dotenv').config();
const https = require('https');

const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    apiKey: process.env.IIKO_API_KEY,
    orgId: process.env.IIKO_ORG_ID
};

// Order IDs from your database
const orderIds = [
    'd55a5884-f67a-4561-8032-48a809b09c18',
    '2627f358-2c4f-4eb8-8a70-85940e155023'
];

function makeRequest(method, path, data = null) {
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
    console.log('Getting authentication token...');
    const response = await makeRequest('POST', '/api/1/access_token', {
        apiLogin: IIKO_CONFIG.apiKey
    });
    return response.token;
}

async function checkOrder(token, orderId) {
    console.log(`\nChecking order: ${orderId}`);
    
    try {
        const response = await makeRequest('POST', '/api/1/deliveries/by_id', {
            organizationIds: [IIKO_CONFIG.orgId],
            orderIds: [orderId]
        });
        
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function main() {
    try {
        const token = await getToken();
        console.log('✅ Authentication successful\n');
        
        for (const orderId of orderIds) {
            await checkOrder(token, orderId);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
