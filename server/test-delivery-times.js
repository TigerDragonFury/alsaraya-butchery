require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_TERMINAL_ID = process.env.IIKO_TERMINAL_ID;
const IIKO_DELIVERY_ORDER_TYPE = process.env.IIKO_WEBSITE_ORDER_TYPE || process.env.IIKO_DELIVERY_ORDER_TYPE;
const IIKO_PAYMENT_TYPE_ID = process.env.IIKO_PAYMENT_TYPE_ID;

// ANSI color codes
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

function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testOrder(token, deliveryType, deliveryTime) {
  const testOrder = {
    organizationId: IIKO_ORG_ID,
    terminalGroupId: IIKO_TERMINAL_ID,
    order: {
      id: generateGUID(),
      date: new Date().toISOString(),
      completeBefore: deliveryTime,
      phone: "+971501234567",
      customer: {
        name: `Test Customer (${deliveryType})`,
        phone: "+971501234567"
      },
      orderTypeId: IIKO_DELIVERY_ORDER_TYPE,
      deliveryPoint: {
        address: {
          street: {
            classifierId: "00000000-0000-0000-0000-000000000000",
            name: "Test Street"
          },
          house: "123"
        }
      },
      items: [
        {
          type: "Product",
          productId: "00000000-0000-0000-0000-000000000000",
          amount: 1
        }
      ],
      payments: [
        {
          paymentTypeKind: "Cash",
          sum: 50,
          paymentTypeId: IIKO_PAYMENT_TYPE_ID,
          isProcessedExternally: true
        }
      ],
      comment: `Test order - ${deliveryType} delivery`
    }
  };

  return await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/create`,
    'POST',
    testOrder,
    { 'Authorization': `Bearer ${token}` }
  );
}

async function main() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║    Test Different Delivery Times             ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    const now = new Date();
    
    // Different delivery time scenarios
    const scenarios = [
      {
        label: 'ASAP (4 hours from now)',
        time: new Date(Date.now() + 4 * 60 * 60 * 1000)
      },
      {
        label: 'Later Today (7 PM)',
        time: (() => {
          const today7PM = new Date();
          today7PM.setHours(19, 0, 0, 0);
          return today7PM;
        })()
      },
      {
        label: 'Tomorrow Morning (10 AM)',
        time: (() => {
          const tomorrow10AM = new Date();
          tomorrow10AM.setDate(tomorrow10AM.getDate() + 1);
          tomorrow10AM.setHours(10, 0, 0, 0);
          return tomorrow10AM;
        })()
      }
    ];

    console.log(`${colors.yellow}Choose a delivery time scenario:${colors.reset}\n`);
    scenarios.forEach((scenario, idx) => {
      console.log(`  ${colors.cyan}${idx + 1}.${colors.reset} ${scenario.label}`);
      console.log(`     ${scenario.time.toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}`);
      console.log('');
    });

    // For demo, test the ASAP scenario
    const selectedScenario = scenarios[0];
    
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Testing: ${selectedScenario.label}${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}Order Time:${colors.reset} ${now.toLocaleString('en-AE')}`);
    console.log(`${colors.cyan}Delivery Time:${colors.reset} ${selectedScenario.time.toLocaleString('en-AE')}`);
    console.log(`${colors.cyan}Time Until Delivery:${colors.reset} ${Math.round((selectedScenario.time - now) / (60 * 1000))} minutes\n`);

    console.log(`${colors.cyan}🚀 Sending test order...${colors.reset}\n`);

    const response = await testOrder(token, selectedScenario.label, selectedScenario.time.toISOString());

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Response${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (response.status === 200) {
      const orderInfo = response.data.orderInfo;
      
      if (orderInfo.creationStatus === 'Success' || orderInfo.creationStatus === 'InProgress') {
        console.log(`${colors.green}✅ SUCCESS!${colors.reset}\n`);
        console.log(`${colors.cyan}Order ID:${colors.reset} ${orderInfo.id}`);
        console.log(`${colors.cyan}Status:${colors.reset} ${orderInfo.creationStatus}`);
        console.log(`${colors.cyan}Scenario:${colors.reset} ${selectedScenario.label}\n`);
        
        console.log(`${colors.green}This order should appear when searching for deliveries on:${colors.reset}`);
        console.log(`  ${selectedScenario.time.toLocaleDateString('en-AE')}`);
      } else if (orderInfo.errorInfo) {
        console.log(`${colors.red}❌ ERROR: ${orderInfo.errorInfo.message}${colors.reset}\n`);
        console.log(`${colors.yellow}Error Code:${colors.reset} ${orderInfo.errorInfo.code}`);
        console.log(`${colors.yellow}Description:${colors.reset} ${orderInfo.errorInfo.description}\n`);
        
        if (orderInfo.errorInfo.code === 'TooSmallDeliveryDate') {
          console.log(`${colors.cyan}Solution:${colors.reset} Increase the minimum delivery time.`);
          console.log(`Current time: ${selectedScenario.time.toLocaleString('en-AE')}`);
          console.log(`Try setting delivery time further in the future (4+ hours).\n`);
        }
      }
    } else {
      console.log(`${colors.red}❌ Request failed with status ${response.status}${colors.reset}`);
    }

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}How to Use in Your Website${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.cyan}Option 1: ASAP Delivery${colors.reset}`);
    console.log(`  orderData.deliveryType = 'asap'`);
    console.log(`  → Delivers in 3 hours\n`);
    
    console.log(`${colors.cyan}Option 2: Today Delivery${colors.reset}`);
    console.log(`  orderData.deliveryType = 'today'`);
    console.log(`  → Delivers at 6 PM or 4 hours later, whichever is later\n`);
    
    console.log(`${colors.cyan}Option 3: Scheduled Delivery${colors.reset}`);
    console.log(`  orderData.deliveryTime = '2026-02-04T15:00:00Z'`);
    console.log(`  → Delivers at customer's chosen time\n`);
    
    console.log(`${colors.cyan}Option 4: Default (Tomorrow)${colors.reset}`);
    console.log(`  Don't specify deliveryType or deliveryTime`);
    console.log(`  → Delivers tomorrow at noon\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

main();
