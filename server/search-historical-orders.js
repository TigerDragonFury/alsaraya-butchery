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

async function searchHistoricalOrders() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║    Historical Order Search - Al Saraya       ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // Try different historical periods (1 day at a time for various months)
    const testDates = [
      { daysAgo: 7, label: '7 days ago' },
      { daysAgo: 14, label: '2 weeks ago' },
      { daysAgo: 30, label: '1 month ago' },
      { daysAgo: 60, label: '2 months ago' },
      { daysAgo: 90, label: '3 months ago' },
      { daysAgo: 180, label: '6 months ago' },
      { daysAgo: 365, label: '1 year ago' }
    ];

    let foundOrders = false;

    for (const testDate of testDates) {
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Testing: ${testDate.label}${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - testDate.daysAgo);
      dateFrom.setHours(0, 0, 0, 0);
      
      const dateTo = new Date(dateFrom);
      dateTo.setHours(23, 59, 59, 999);

      console.log(`${colors.cyan}Date Range:${colors.reset} ${dateFrom.toLocaleDateString()} to ${dateTo.toLocaleDateString()}\n`);

      const response = await makeRequest(
        `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
        'POST',
        {
          organizationIds: [IIKO_ORG_ID],
          deliveryDateFrom: dateFrom.toISOString(),
          deliveryDateTo: dateTo.toISOString()
        },
        { 'Authorization': `Bearer ${token}` }
      );

      if (response.status === 200) {
        const orders = response.data.orders || [];
        
        if (orders.length > 0) {
          foundOrders = true;
          console.log(`${colors.green}✅ FOUND ${orders.length} orders on this date!${colors.reset}\n`);
          
          // Show first 3 orders
          const displayOrders = orders.slice(0, 3);
          
          displayOrders.forEach((order, idx) => {
            console.log(`${colors.bright}${colors.magenta}Order ${idx + 1}:${colors.reset}`);
            console.log(`  ${colors.cyan}ID:${colors.reset} ${order.id || order.orderId}`);
            console.log(`  ${colors.cyan}Customer:${colors.reset} ${order.customer?.name || 'N/A'}`);
            console.log(`  ${colors.cyan}Total:${colors.reset} ${order.sum || order.fullSum || 0} AED`);
            console.log(`  ${colors.cyan}Status:${colors.reset} ${order.status || 'N/A'}`);
            console.log('');
          });

          if (orders.length > 3) {
            console.log(`${colors.yellow}... and ${orders.length - 3} more orders on this date${colors.reset}\n`);
          }
          
          // Found data, show summary and stop
          break;
        } else {
          console.log(`${colors.yellow}⚠️  No orders found on this date${colors.reset}\n`);
        }
      } else if (response.status === 422) {
        console.log(`${colors.green}✅ TOO MANY ORDERS on this date!${colors.reset}`);
        console.log(`${colors.bright}This date has lots of order activity${colors.reset}\n`);
        foundOrders = true;
        break;
      } else {
        console.log(`${colors.red}❌ Error (Status ${response.status})${colors.reset}`);
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!foundOrders) {
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}No Orders Found in Any Period${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      console.log(`This could mean:`);
      console.log(`  • Orders are stored as a different order type (not delivery)`);
      console.log(`  • Need to query pickup/collection orders separately`);
      console.log(`  • Orders might be in a different organization ID`);
      console.log(`  • API permissions may limit order visibility\n`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

searchHistoricalOrders();
