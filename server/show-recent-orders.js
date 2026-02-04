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

async function getOrders(token, hoursBack) {
  const dateFrom = new Date();
  dateFrom.setHours(dateFrom.getHours() - hoursBack);
  
  const dateTo = new Date();
  
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
  return response;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-AE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPrice(price) {
  return price ? `${price.toFixed(2)} AED` : 'N/A';
}

async function findRecentOrders() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║       Finding Recent Orders - Al Saraya      ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // Try progressively smaller time ranges
    const timeRanges = [
      { hours: 6, label: 'Last 6 Hours' },
      { hours: 12, label: 'Last 12 Hours' },
      { hours: 24, label: 'Last 24 Hours' },
      { hours: 48, label: 'Last 2 Days' },
      { hours: 72, label: 'Last 3 Days' }
    ];

    for (const range of timeRanges) {
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Searching: ${range.label}${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      const response = await getOrders(token, range.hours);

      if (response.status === 200) {
        const orders = response.data.orders || [];
        console.log(`${colors.green}✅ Found ${orders.length} orders${colors.reset}\n`);

        if (orders.length > 0) {
          // Display first 3 orders
          const displayOrders = orders.slice(0, 3);
          
          displayOrders.forEach((order, idx) => {
            console.log(`${colors.bright}${colors.magenta}Order ${idx + 1}:${colors.reset}`);
            console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
            
            console.log(`${colors.cyan}ID:${colors.reset} ${colors.yellow}${order.id || order.orderId}${colors.reset}`);
            
            if (order.externalNumber) {
              console.log(`${colors.cyan}Order Number:${colors.reset} ${order.externalNumber}`);
            }
            
            if (order.customer) {
              console.log(`${colors.cyan}Customer:${colors.reset} ${order.customer.name || 'N/A'}`);
              if (order.customer.phone) {
                console.log(`${colors.cyan}Phone:${colors.reset} ${order.customer.phone}`);
              }
            }
            
            if (order.sum || order.fullSum) {
              console.log(`${colors.cyan}Total:${colors.reset} ${colors.green}${formatPrice(order.sum || order.fullSum)}${colors.reset}`);
            }
            
            if (order.status) {
              const statusColor = order.status === 'Delivered' ? colors.green : 
                                 order.status === 'InProgress' ? colors.yellow : 
                                 order.status === 'Cancelled' ? colors.red : colors.cyan;
              console.log(`${colors.cyan}Status:${colors.reset} ${statusColor}${order.status}${colors.reset}`);
            }
            
            if (order.deliveryDate || order.whenCreated) {
              console.log(`${colors.cyan}Date:${colors.reset} ${formatDate(order.deliveryDate || order.whenCreated)}`);
            }
            
            if (order.sourceKey) {
              console.log(`${colors.cyan}Source:${colors.reset} ${order.sourceKey}`);
            }

            if (order.address) {
              const street = order.address.street?.name || 'N/A';
              const house = order.address.house || '';
              console.log(`${colors.cyan}Address:${colors.reset} ${street} ${house}`.trim());
            }

            if (order.items && order.items.length > 0) {
              console.log(`${colors.cyan}Items:${colors.reset}`);
              order.items.slice(0, 3).forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.product?.name || item.name || 'Unknown'} x${item.amount || item.quantity || 1}`);
              });
              if (order.items.length > 3) {
                console.log(`  ... and ${order.items.length - 3} more items`);
              }
            }
            
            console.log('');
          });

          if (orders.length > 3) {
            console.log(`${colors.yellow}... and ${orders.length - 3} more orders in this range${colors.reset}\n`);
          }

          // Success - stop searching
          console.log(`${colors.green}✅ Successfully retrieved orders from ${range.label}${colors.reset}\n`);
          return;
        }
      } else if (response.status === 422) {
        console.log(`${colors.yellow}⚠️  Too many orders in this range, trying shorter range...${colors.reset}\n`);
      } else {
        console.log(`${colors.red}❌ Error (Status ${response.status})${colors.reset}`);
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
      }
    }

    console.log(`${colors.red}❌ Could not retrieve orders - all time ranges have too much data${colors.reset}`);
    console.log(`This means your iiko has LOTS of active orders!\n`);

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.log(`\n${colors.yellow}Stack trace:${colors.reset}`);
      console.log(error.stack);
    }
  }
}

findRecentOrders();
