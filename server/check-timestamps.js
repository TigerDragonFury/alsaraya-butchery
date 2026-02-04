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

async function main() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║       Timestamp Diagnostic Tool              ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // Current date/time information
    const now = new Date();
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Current Date/Time Information${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}System Local Time:${colors.reset}`);
    console.log(`  ${now.toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}`);
    console.log(`  ${now.toString()}\n`);
    
    console.log(`${colors.cyan}ISO String (what we send to iiko):${colors.reset}`);
    console.log(`  ${now.toISOString()}\n`);
    
    console.log(`${colors.cyan}Timestamp (milliseconds):${colors.reset}`);
    console.log(`  ${now.getTime()}\n`);

    // Test different search ranges
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Testing Search Ranges${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const ranges = [
      { label: 'Last 2 Hours', hours: 2 },
      { label: 'Last 12 Hours', hours: 12 },
      { label: 'Last 24 Hours', hours: 24 },
      { label: 'Today (start of day to now)', start: new Date(now.setHours(0,0,0,0)), end: new Date() },
      { label: 'Yesterday to now', start: new Date(now.setDate(now.getDate() - 1)), end: new Date() },
      { label: 'Future 2 hours (checking if date is ahead)', start: new Date(), end: new Date(Date.now() + 2 * 60 * 60 * 1000) }
    ];

    for (const range of ranges) {
      let dateFrom, dateTo;
      
      if (range.hours) {
        dateFrom = new Date();
        dateFrom.setHours(dateFrom.getHours() - range.hours);
        dateTo = new Date();
      } else {
        dateFrom = range.start;
        dateTo = range.end;
      }

      console.log(`${colors.cyan}${range.label}:${colors.reset}`);
      console.log(`  From: ${dateFrom.toISOString()}`);
      console.log(`  To:   ${dateTo.toISOString()}`);

      try {
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

        if (response.status === 200 && response.data.orders) {
          console.log(`  ${colors.green}✅ Found ${response.data.orders.length} order(s)${colors.reset}`);
          
          if (response.data.orders.length > 0) {
            console.log(`\n  ${colors.bright}Order Details:${colors.reset}`);
            response.data.orders.slice(0, 3).forEach((order, idx) => {
              console.log(`    ${idx + 1}. ID: ${order.id}`);
              console.log(`       Created: ${order.whenCreated || order.createdTime || 'N/A'}`);
              console.log(`       Delivery Date: ${order.deliveryDate || 'N/A'}`);
              console.log(`       Status: ${order.status || order.deliveryStatus || 'N/A'}`);
            });
            if (response.data.orders.length > 3) {
              console.log(`    ... and ${response.data.orders.length - 3} more`);
            }
          }
        } else {
          console.log(`  ${colors.yellow}⚠️  No orders found${colors.reset}`);
        }
      } catch (error) {
        console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
      }
      
      console.log('');
    }

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Analysis${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}What to check:${colors.reset}`);
    console.log(`  1. If orders appear in "Future" range → System clock might be behind`);
    console.log(`  2. If no orders anywhere → Orders still processing or not finalized`);
    console.log(`  3. If orders found in specific range → Adjust your search parameters`);
    console.log(`  4. Check iiko POS directly to see when orders actually appear\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

main();
