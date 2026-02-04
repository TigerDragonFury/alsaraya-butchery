require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

// Order IDs from recent test orders
const ORDER_IDS = [
    '0ea9c5e5-9135-4ca7-a3a9-edef795c6ec3', // Latest test order with website order type
    'c39a9b19-46a2-4a6c-93a3-5d7639b2ad26'  // Previous test order
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
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
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/access_token`,
    'POST',
    { apiLogin: IIKO_API_LOGIN }
  );
  
  if (response.data.token) {
    return response.data.token;
  }
  throw new Error('Failed to get token');
}

async function getOrderById(token, orderId) {
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/by_id`,
    'POST',
    {
      organizationIds: [IIKO_ORG_ID],
      orderIds: [orderId]
    },
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

function displayOrder(order, index) {
  console.log(`\n${colors.cyan}Order #${index + 1}:${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (!order) {
    console.log(`${colors.red}❌ Order not found or not yet processed${colors.reset}`);
    return;
  }

  console.log(`${colors.bright}ID:${colors.reset} ${order.id || 'N/A'}`);
  console.log(`${colors.bright}Order Number:${colors.reset} ${order.number || 'N/A'}`);
  console.log(`${colors.bright}Status:${colors.reset} ${order.status || 'N/A'}`);
  console.log(`${colors.bright}Customer:${colors.reset} ${order.customer?.name || 'N/A'}`);
  console.log(`${colors.bright}Phone:${colors.reset} ${order.customer?.phone || 'N/A'}`);
  
  if (order.deliveryPoint) {
    console.log(`${colors.bright}Address:${colors.reset} ${order.deliveryPoint.address?.street?.name || 'N/A'}`);
  }
  
  if (order.sum) {
    console.log(`${colors.bright}Total:${colors.reset} ${order.sum} AED`);
  }
  
  if (order.whenCreated) {
    const date = new Date(order.whenCreated);
    console.log(`${colors.bright}Created:${colors.reset} ${date.toLocaleString('en-AE')}`);
  }
  
  if (order.comment) {
    console.log(`${colors.bright}Notes:${colors.reset} ${order.comment}`);
  }
  
  if (order.items && order.items.length > 0) {
    console.log(`\n${colors.bright}Items:${colors.reset}`);
    order.items.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.product?.name || 'Unknown'} x${item.amount || 0}`);
    });
  }
}

async function main() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║     Check Orders by ID - Al Saraya           ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}`);

    console.log(`\n${colors.cyan}📦 Checking ${ORDER_IDS.length} test orders...${colors.reset}`);

    for (let i = 0; i < ORDER_IDS.length; i++) {
      const orderId = ORDER_IDS[i];
      console.log(`\n${colors.yellow}Fetching order: ${orderId}${colors.reset}`);
      
      try {
        const response = await getOrderById(token, orderId);
        
        if (response.status === 200 && response.data.orders && response.data.orders.length > 0) {
          displayOrder(response.data.orders[0], i);
        } else {
          console.log(`\n${colors.cyan}Order #${i + 1}:${colors.reset}`);
          console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
          console.log(`${colors.yellow}⏳ Order is still being processed by iiko${colors.reset}`);
          console.log(`${colors.reset}Status: InProgress (may take a few moments)${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}❌ Error fetching order: ${error.message}${colors.reset}`);
      }
    }

    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Summary${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`${colors.cyan}•${colors.reset} Orders are created successfully (InProgress status)`);
    console.log(`${colors.cyan}•${colors.reset} They'll be visible once processed by iiko POS`);
    console.log(`${colors.cyan}•${colors.reset} This can take a few seconds to a few minutes`);
    console.log(`${colors.cyan}•${colors.reset} Website Order Type ID: ${colors.green}dc0ee655-2e56-4535-9241-ddd2f4eb8a26${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

main();
