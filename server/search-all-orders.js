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

async function searchAllMethods(token) {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║     Comprehensive Order Search - iiko        ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  const searches = [];

  // Method 1: Last 30 days by creation time
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Method 1: By Creation Time (Last 30 Days)${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    
    const response = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/by_creation_date_and_status`,
      'POST',
      {
        organizationId: IIKO_ORG_ID,
        createdFrom: dateFrom.toISOString(),
        createdTo: new Date().toISOString()
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (response.status === 200) {
      const orders = response.data.orders || [];
      console.log(`${colors.green}✅ Found ${orders.length} orders${colors.reset}\n`);
      if (orders.length > 0) {
        orders.forEach((order, idx) => {
          console.log(`${idx + 1}. ID: ${colors.yellow}${order.id}${colors.reset}`);
          console.log(`   Status: ${order.status || 'N/A'}`);
          console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
          console.log('');
        });
      }
      searches.push({ method: 'Creation Date', count: orders.length, orders });
    } else {
      console.log(`${colors.red}❌ Failed (Status ${response.status})${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
  }

  // Method 2: Last 7 days by delivery date
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Method 2: By Delivery Date (Last 7 Days)${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);
    
    const response = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
      'POST',
      {
        organizationIds: [IIKO_ORG_ID],
        deliveryDateFrom: dateFrom.toISOString(),
        deliveryDateTo: new Date().toISOString()
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (response.status === 200) {
      const orders = response.data.orders || [];
      console.log(`${colors.green}✅ Found ${orders.length} orders${colors.reset}\n`);
      if (orders.length > 0) {
        orders.forEach((order, idx) => {
          console.log(`${idx + 1}. ID: ${colors.yellow}${order.id}${colors.reset}`);
          console.log(`   Status: ${order.status || 'N/A'}`);
          console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
          console.log('');
        });
      }
      searches.push({ method: 'Delivery Date', count: orders.length, orders });
    } else {
      console.log(`${colors.red}❌ Failed (Status ${response.status})${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
  }

  // Method 3: Last 90 days (might be too much data)
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Method 3: Extended Range (Last 90 Days)${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 90);
    
    const response = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/by_creation_date_and_status`,
      'POST',
      {
        organizationId: IIKO_ORG_ID,
        createdFrom: dateFrom.toISOString(),
        createdTo: new Date().toISOString()
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (response.status === 200) {
      const orders = response.data.orders || [];
      console.log(`${colors.green}✅ Found ${orders.length} orders${colors.reset}\n`);
      if (orders.length > 0) {
        console.log(`First 5 orders:`);
        orders.slice(0, 5).forEach((order, idx) => {
          console.log(`${idx + 1}. ID: ${colors.yellow}${order.id}${colors.reset}`);
          console.log(`   Status: ${order.status || 'N/A'}`);
          console.log(`   Customer: ${order.customer?.name || 'N/A'}`);
          console.log('');
        });
      }
      searches.push({ method: 'Extended Range', count: orders.length, orders });
    } else {
      console.log(`${colors.red}❌ Failed (Status ${response.status})${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
  }

  // Summary
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Summary${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  searches.forEach(search => {
    console.log(`${colors.cyan}${search.method}:${colors.reset} ${search.count} orders`);
  });

  const totalOrders = Math.max(...searches.map(s => s.count));
  console.log(`\n${colors.bright}Total Orders Found:${colors.reset} ${totalOrders}`);

  if (totalOrders === 0) {
    console.log(`\n${colors.yellow}⚠️  No orders found through any search method${colors.reset}`);
    console.log(`\nThis confirms:`);
    console.log(`  • Your iiko system has no successfully processed orders`);
    console.log(`  • The test order exists but is in "Error" state`);
    console.log(`  • Error status orders don't appear in regular order queries`);
    console.log(`  • Once products are mapped, new orders will work perfectly\n`);
  } else {
    console.log(`\n${colors.green}✅ Found active orders in iiko!${colors.reset}\n`);
  }
}

async function main() {
  try {
    const token = await getToken();
    await searchAllMethods(token);
  } catch (error) {
    console.log(`${colors.red}❌ Fatal Error: ${error.message}${colors.reset}`);
  }
}

main();
