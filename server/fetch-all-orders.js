require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

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

async function fetchOrdersByDate(token, hoursBack = 24) {
  const dateFrom = new Date();
  dateFrom.setHours(dateFrom.getHours() - hoursBack);
  
  const dateTo = new Date();
  
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
    'POST',
    {
      organizationIds: [IIKO_ORG_ID],
      deliveryDateFrom: dateFrom.toISOString(),
      deliveryDateTo: dateTo.toISOString(),
      statuses: null // Fetch all statuses
    },
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

async function fetchOrdersByCreationDate(token, hoursBack = 24) {
  const dateFrom = new Date();
  dateFrom.setHours(dateFrom.getHours() - hoursBack);
  
  const dateTo = new Date();
  
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_phone`,
    'POST',
    {
      organizationIds: [IIKO_ORG_ID],
      deliveryDateFrom: dateFrom.toISOString(),
      deliveryDateTo: dateTo.toISOString()
    },
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

function displayOrder(order, index) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Order #${index + 1}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  console.log(`${colors.yellow}ID:${colors.reset} ${order.id || 'N/A'}`);
  console.log(`${colors.yellow}Order #:${colors.reset} ${order.number || order.externalNumber || 'N/A'}`);
  console.log(`${colors.yellow}Status:${colors.reset} ${order.status || order.deliveryStatus || 'N/A'}`);
  console.log(`${colors.yellow}Order Type:${colors.reset} ${order.orderType?.name || 'N/A'}`);
  
  if (order.customer) {
    console.log(`${colors.yellow}Customer:${colors.reset} ${order.customer.name || 'N/A'}`);
    console.log(`${colors.yellow}Phone:${colors.reset} ${order.customer.phone || 'N/A'}`);
  }
  
  if (order.deliveryPoint) {
    const address = order.deliveryPoint.address?.street?.name || 'N/A';
    console.log(`${colors.yellow}Address:${colors.reset} ${address}`);
  }
  
  if (order.sum) {
    console.log(`${colors.yellow}Total:${colors.reset} ${order.sum} AED`);
  }
  
  const created = order.whenCreated || order.createdTime;
  if (created) {
    const date = new Date(created);
    console.log(`${colors.yellow}Created:${colors.reset} ${date.toLocaleString('en-AE')}`);
  }
  
  if (order.comment) {
    console.log(`${colors.yellow}Notes:${colors.reset} ${order.comment}`);
  }
  
  if (order.items && order.items.length > 0) {
    console.log(`\n${colors.yellow}Items (${order.items.length}):${colors.reset}`);
    order.items.forEach((item, i) => {
      const name = item.product?.name || item.productName || 'Unknown';
      const amount = item.amount || item.quantity || 0;
      console.log(`  ${i + 1}. ${name} ${colors.cyan}x${amount}${colors.reset}`);
    });
  }
}

async function main() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║       Fetch All Orders - Al Saraya           ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    const timeRanges = [
      { hours: 1, label: 'Last Hour' },
      { hours: 6, label: 'Last 6 Hours' },
      { hours: 24, label: 'Last 24 Hours' },
      { hours: 48, label: 'Last 2 Days' },
      { hours: 168, label: 'Last Week' },
      { custom: true, label: 'Tomorrow (Future Orders)', from: new Date(), to: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })() }
    ];

    let foundOrders = false;

    for (const range of timeRanges) {
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Searching: ${range.label}${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

      try {
        const response = await fetchOrdersByDate(token, range.hours);
        
        if (response.status === 200 && response.data.orders && response.data.orders.length > 0) {
          console.log(`${colors.green}✅ Found ${response.data.orders.length} order(s)${colors.reset}`);
          
          response.data.orders.forEach((order, idx) => {
            displayOrder(order, idx);
          });
          
          foundOrders = true;
          break; // Found orders, no need to continue
        } else if (response.status === 200) {
          console.log(`${colors.yellow}⚠️  No orders in this range${colors.reset}\n`);
        } else {
          console.log(`${colors.red}❌ Search failed: ${response.data.errorDescription || 'Unknown error'}${colors.reset}\n`);
        }
      } catch (error) {
        console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
      }
    }

    if (!foundOrders) {
      console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}No Orders Found${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      console.log(`${colors.cyan}This could mean:${colors.reset}`);
      console.log(`  ${colors.reset}• Fresh iiko setup with no order history${colors.reset}`);
      console.log(`  ${colors.reset}• Orders are still being processed (InProgress)${colors.reset}`);
      console.log(`  ${colors.reset}• Orders are stored under a different organization${colors.reset}`);
      console.log(`  ${colors.reset}• Test orders haven't been finalized yet${colors.reset}\n`);
      console.log(`${colors.cyan}Tip:${colors.reset} Wait a few minutes and run again, or check iiko POS directly.`);
    }

    console.log(`\n${colors.green}✅ Search complete!${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

main();
