require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
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

async function main() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║      Fetch Today's Orders - Al Saraya        ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // Search for today's delivery orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Searching: Today's Deliveries${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`From: ${todayStart.toLocaleString('en-AE')}`);
    console.log(`To:   ${todayEnd.toLocaleString('en-AE')}\n`);

    const response = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
      'POST',
      {
        organizationIds: [IIKO_ORG_ID],
        deliveryDateFrom: todayStart.toISOString(),
        deliveryDateTo: todayEnd.toISOString()
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (response.status === 200 && response.data.orders && response.data.orders.length > 0) {
      console.log(`${colors.green}✅ Found ${response.data.orders.length} order(s)${colors.reset}\n`);
      
      response.data.orders.forEach((order, idx) => {
        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}Order #${idx + 1}${colors.reset}`);
        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
        
        console.log(`${colors.yellow}ID:${colors.reset} ${order.id}`);
        console.log(`${colors.yellow}Order Number:${colors.reset} ${order.number || order.externalNumber || 'N/A'}`);
        console.log(`${colors.yellow}Status:${colors.reset} ${order.status || order.deliveryStatus}`);
        console.log(`${colors.yellow}Order Type:${colors.reset} ${order.orderType?.name || 'N/A'}`);
        console.log(`${colors.yellow}Customer:${colors.reset} ${order.customer?.name || 'N/A'}`);
        console.log(`${colors.yellow}Phone:${colors.reset} ${order.customer?.phone || 'N/A'}`);
        console.log(`${colors.yellow}Total:${colors.reset} ${order.sum || 0} AED`);
        
        if (order.whenCreated) {
          console.log(`${colors.yellow}Created:${colors.reset} ${new Date(order.whenCreated).toLocaleString('en-AE')}`);
        }
        
        if (order.deliveryDate || order.completeBefore) {
          const deliveryDate = order.deliveryDate || order.completeBefore;
          console.log(`${colors.yellow}Delivery Time:${colors.reset} ${new Date(deliveryDate).toLocaleString('en-AE')}`);
        }
        
        if (order.comment) {
          console.log(`${colors.yellow}Comment:${colors.reset} ${order.comment}`);
        }
        
        if (order.items && order.items.length > 0) {
          console.log(`\n${colors.yellow}Items:${colors.reset}`);
          order.items.forEach((item, i) => {
            const name = item.product?.name || item.productName || 'Unknown';
            const amount = item.amount || item.quantity || 0;
            console.log(`  ${i + 1}. ${name} x${amount}`);
          });
        }
        console.log('');
      });
      
      console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}✅ Same-day delivery is working!${colors.reset}`);
      console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      
    } else if (response.status === 200) {
      console.log(`${colors.yellow}⚠️  No orders scheduled for today yet${colors.reset}\n`);
      console.log(`${colors.cyan}This could mean:${colors.reset}`);
      console.log(`  • Orders are still being processed (wait 30-60 seconds)`);
      console.log(`  • No same-day orders have been created yet`);
      console.log(`  • Try running: node test-delivery-times.js`);
    } else {
      console.log(`${colors.red}❌ Search failed: ${response.data.errorDescription || 'Unknown error'}${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

main();
