require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

// The test order ID from our successful test
const TEST_ORDER_ID = '229f88b0-55eb-4ea5-b8b1-ded564b0551f';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function makeRequest(url, method, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
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
  console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/access_token`,
    'POST',
    { apiLogin: IIKO_API_LOGIN }
  );
  
  if (response.data.token) {
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);
    return response.data.token;
  }
  throw new Error('Failed to get token');
}

async function getOrderById(token, orderId) {
  console.log(`${colors.cyan}🔍 Looking up order by ID...${colors.reset}\n`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/by_id`,
    'POST',
    {
      organizationId: IIKO_ORG_ID,
      orderIds: [orderId]
    },
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

async function checkTestOrder() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║         Test Order Verification              ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const token = await getToken();
    
    console.log(`${colors.cyan}Order ID:${colors.reset} ${colors.yellow}${TEST_ORDER_ID}${colors.reset}\n`);
    
    const response = await getOrderById(token, TEST_ORDER_ID);
    
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Result${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (response.status === 200) {
      const orders = response.data.orders || [];
      
      if (orders.length > 0) {
        console.log(`${colors.green}✅ Test order found!${colors.reset}\n`);
        const order = orders[0];
        
        console.log(`${colors.cyan}Order Details:${colors.reset}`);
        console.log(JSON.stringify(order, null, 2));
        
        console.log(`\n${colors.green}✅ Your test order exists in iiko!${colors.reset}`);
        console.log(`The issue with the date query might be:`);
        console.log(`  • Order doesn't have a deliveryDate field set`);
        console.log(`  • Order is indexed differently`);
        console.log(`  • There's a delay in indexing new orders\n`);
      } else {
        console.log(`${colors.yellow}⚠️  Order not found by ID query${colors.reset}\n`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log(`${colors.red}❌ Failed to fetch order (Status: ${response.status})${colors.reset}\n`);
      console.log(JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

checkTestOrder();
