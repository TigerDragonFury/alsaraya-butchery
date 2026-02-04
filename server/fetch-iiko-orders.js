require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

// ANSI color codes
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
  console.log(`${colors.cyan}🔐 Authenticating with iiko...${colors.reset}`);
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

async function getOrders(token) {
  console.log(`${colors.cyan}📦 Fetching orders from iiko...${colors.reset}\n`);
  
  // Get orders from 2 days ago to now
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 2);
  dateFrom.setHours(0, 0, 0, 0);
  
  const dateTo = new Date();
  dateTo.setHours(23, 59, 59, 999);
  
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
    'POST',
    {
      organizationIds: [IIKO_ORG_ID],
      deliveryDateFrom: dateFrom.toISOString(),
      deliveryDateTo: dateTo.toISOString()
      // Don't include statuses property - fetches all
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

async function fetchOrders() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║        iiko Orders Check - Al Saraya         ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const token = await getToken();
    const ordersResponse = await getOrders(token);

    if (ordersResponse.status !== 200) {
      console.log(`${colors.red}❌ Failed to fetch orders (Status: ${ordersResponse.status})${colors.reset}`);
      console.log(JSON.stringify(ordersResponse.data, null, 2));
      return;
    }

    const orders = ordersResponse.data.orders || [];
    
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Orders Overview (Last 2 Days)${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (orders.length === 0) {
      console.log(`${colors.yellow}⚠️  No orders found in the last 2 days${colors.reset}\n`);
      console.log(`This means:`);
      console.log(`  • iiko is a fresh setup with no order history`);
      console.log(`  • Your integration is starting from scratch`);
      console.log(`  • The test order we created earlier might be the first one!\n`);
    } else {
      console.log(`${colors.green}✅ Found ${colors.bright}${orders.length}${colors.reset}${colors.green} order(s)${colors.reset}\n`);

      // Group orders by status
      const ordersByStatus = {};
      orders.forEach(order => {
        const status = order.status || 'Unknown';
        if (!ordersByStatus[status]) {
          ordersByStatus[status] = [];
        }
        ordersByStatus[status].push(order);
      });

      // Display summary by status
      console.log(`${colors.cyan}Orders by Status:${colors.reset}`);
      Object.keys(ordersByStatus).forEach(status => {
        const count = ordersByStatus[status].length;
        console.log(`  ${colors.magenta}${status}:${colors.reset} ${count}`);
      });
      console.log('');

      // Display recent orders (up to 10)
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Recent Orders (Last 10)${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      const recentOrders = orders.slice(0, 10);
      
      recentOrders.forEach((order, idx) => {
        console.log(`${colors.bright}${idx + 1}. Order ID:${colors.reset} ${colors.yellow}${order.id || order.orderId}${colors.reset}`);
        
        if (order.externalNumber) {
          console.log(`   ${colors.cyan}External #:${colors.reset} ${order.externalNumber}`);
        }
        
        if (order.customer) {
          console.log(`   ${colors.cyan}Customer:${colors.reset} ${order.customer.name || 'N/A'}`);
          if (order.customer.phone) {
            console.log(`   ${colors.cyan}Phone:${colors.reset} ${order.customer.phone}`);
          }
        }
        
        if (order.sum || order.fullSum) {
          console.log(`   ${colors.cyan}Total:${colors.reset} ${formatPrice(order.sum || order.fullSum)}`);
        }
        
        if (order.status) {
          const statusColor = order.status === 'Delivered' ? colors.green : 
                             order.status === 'InProgress' ? colors.yellow : 
                             order.status === 'Cancelled' ? colors.red : colors.cyan;
          console.log(`   ${colors.cyan}Status:${colors.reset} ${statusColor}${order.status}${colors.reset}`);
        }
        
        if (order.deliveryDate || order.whenCreated) {
          console.log(`   ${colors.cyan}Date:${colors.reset} ${formatDate(order.deliveryDate || order.whenCreated)}`);
        }
        
        if (order.sourceKey) {
          console.log(`   ${colors.cyan}Source:${colors.reset} ${order.sourceKey}`);
        }

        if (order.address) {
          console.log(`   ${colors.cyan}Address:${colors.reset} ${order.address.street?.name || 'N/A'}`);
        }
        
        console.log('');
      });

      // Summary statistics
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Statistics${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      
      console.log(`${colors.cyan}Total Orders:${colors.reset} ${orders.length}`);
      
      const websiteOrders = orders.filter(o => o.sourceKey === 'website').length;
      if (websiteOrders > 0) {
        console.log(`${colors.green}Website Orders:${colors.reset} ${websiteOrders}`);
      }
      
      const totalSum = orders.reduce((sum, order) => sum + (order.sum || order.fullSum || 0), 0);
      if (totalSum > 0) {
        console.log(`${colors.cyan}Total Revenue:${colors.reset} ${formatPrice(totalSum)}`);
      }
    }

    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Assessment${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    if (orders.length === 0) {
      console.log(`${colors.green}✅ Fresh Start:${colors.reset} Your iiko system is clean and ready`);
      console.log(`   Your website integration will be the primary order source\n`);
    } else {
      console.log(`${colors.green}✅ Active System:${colors.reset} iiko is already in use`);
      console.log(`   Your website will add to existing order flow\n`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.log(`\n${colors.yellow}Stack trace:${colors.reset}`);
      console.log(error.stack);
    }
  }
}

fetchOrders();
