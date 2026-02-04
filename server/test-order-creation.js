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
  console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/access_token`,
    'POST',
    { apiLogin: IIKO_API_LOGIN }
  );
  
  if (response.data.token) {
    console.log(`${colors.green}✅ Authenticated successfully!${colors.reset}\n`);
    return response.data.token;
  }
  throw new Error('Failed to get token');
}

async function testOrderCreation() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║        iiko Order Creation Test              ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const token = await getToken();

    // Generate a proper GUID for order ID
    function generateGUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Create a test order payload
    // Set delivery for tomorrow at noon (iiko requires advance scheduling)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const deliveryTime = tomorrow.toISOString();
    
    const testOrder = {
      organizationId: IIKO_ORG_ID,
      terminalGroupId: IIKO_TERMINAL_ID,
      order: {
        id: generateGUID(),
        date: new Date().toISOString(),
        completeBefore: deliveryTime, // Delivery date - CRITICAL for finding orders!
        phone: "+971501234567",
        customer: {
          name: "Test Customer",
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
        ]
      }
    };

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Test Order Details:${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`${colors.cyan}Organization ID:${colors.reset} ${IIKO_ORG_ID}`);
    console.log(`${colors.cyan}Terminal ID:${colors.reset} ${IIKO_TERMINAL_ID}`);
    console.log(`${colors.cyan}Order Type:${colors.reset} ${IIKO_DELIVERY_ORDER_TYPE}`);
    console.log(`${colors.cyan}Payment Type:${colors.reset} ${IIKO_PAYMENT_TYPE_ID}`);
    console.log(`${colors.cyan}Customer:${colors.reset} Test Customer`);
    console.log(`${colors.cyan}Total:${colors.reset} 50 AED\n`);

    console.log(`${colors.cyan}🚀 Sending test order to iiko...${colors.reset}\n`);

    const response = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/create`,
      'POST',
      testOrder,
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Response:${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`${colors.cyan}Status Code:${colors.reset} ${response.status}\n`);

    if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✅ SUCCESS! Order created successfully!${colors.reset}\n`);
      console.log(`${colors.bright}Order Details:${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
    } else if (response.status === 400) {
      console.log(`${colors.red}❌ Bad Request (400)${colors.reset}\n`);
      console.log(`${colors.yellow}This usually means:${colors.reset}`);
      console.log(`  • Invalid Terminal ID`);
      console.log(`  • Invalid Order Type ID`);
      console.log(`  • Invalid Payment Type ID`);
      console.log(`  • Invalid Product ID`);
      console.log(`  • Missing required fields\n`);
      console.log(`${colors.bright}Error Details:${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
    } else if (response.status === 401) {
      console.log(`${colors.red}❌ Unauthorized (401)${colors.reset}\n`);
      console.log(`Authentication token might be invalid or expired.`);
    } else if (response.status === 403) {
      console.log(`${colors.red}❌ Forbidden (403)${colors.reset}\n`);
      console.log(`Your API key doesn't have permission to create orders.`);
    } else {
      console.log(`${colors.red}❌ Unexpected Response${colors.reset}\n`);
      console.log(JSON.stringify(response.data, null, 2));
    }

    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}What to do next:${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    if (response.status === 400) {
      console.log(`1. Check the error message above for specific field issues`);
      console.log(`2. Verify Terminal ID with iiko support`);
      console.log(`3. Verify Order Type and Payment Type IDs`);
      console.log(`4. Make sure your iiko account is properly configured for delivery\n`);
    } else if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✅ Everything is working!${colors.reset}`);
      console.log(`Your iiko integration is ready to accept real orders.\n`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Fatal Error: ${error.message}${colors.reset}`);
    console.log(`\nStack trace:`);
    console.log(error.stack);
    process.exit(1);
  }
}

testOrderCreation();
