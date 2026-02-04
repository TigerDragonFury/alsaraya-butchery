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

async function exploreOrganization() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║   Organization & Order Type Discovery        ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // 1. Get organization info
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Organization Information${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const orgResponse = await makeRequest(
      `${IIKO_API_URL}/api/1/organizations`,
      'POST',
      {
        organizationIds: [IIKO_ORG_ID],
        returnAdditionalInfo: true,
        includeDisabled: false
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (orgResponse.status === 200 && orgResponse.data.organizations) {
      const org = orgResponse.data.organizations[0];
      console.log(`${colors.cyan}Name:${colors.reset} ${org.name}`);
      console.log(`${colors.cyan}ID:${colors.reset} ${org.id}`);
      console.log(`${colors.cyan}Country:${colors.reset} ${org.country || 'N/A'}`);
      
      if (org.orderTypes) {
        console.log(`\n${colors.cyan}Available Order Types:${colors.reset}`);
        org.orderTypes.forEach((type, idx) => {
          console.log(`  ${idx + 1}. ${colors.green}${type.name}${colors.reset}`);
          console.log(`     ID: ${colors.yellow}${type.id}${colors.reset}`);
          console.log(`     Type: ${type.orderServiceType || 'N/A'}`);
        });
      }
      
      console.log('');
    } else {
      console.log(`${colors.red}Failed to get organization info${colors.reset}\n`);
    }

    // 2. Try to get order types/delivery settings
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Delivery Settings${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const settingsResponse = await makeRequest(
      `${IIKO_API_URL}/api/1/deliveries/settings`,
      'POST',
      {
        organizationIds: [IIKO_ORG_ID]
      },
      { 'Authorization': `Bearer ${token}` }
    );

    if (settingsResponse.status === 200) {
      console.log(`${colors.green}✅ Delivery settings retrieved${colors.reset}\n`);
      console.log(JSON.stringify(settingsResponse.data, null, 2));
      console.log('');
    } else {
      console.log(`${colors.yellow}⚠️  Could not retrieve delivery settings${colors.reset}`);
      console.log(JSON.stringify(settingsResponse.data, null, 2));
      console.log('');
    }

    // 3. Check if maybe this organization doesn't use delivery module
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Analysis${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.bright}Based on the findings:${colors.reset}\n`);
    console.log(`Your iiko system might be configured for:`);
    console.log(`  ${colors.cyan}•${colors.reset} In-store POS orders (not tracked via delivery API)`);
    console.log(`  ${colors.cyan}•${colors.reset} Pickup/Collection orders (different endpoint)`);
    console.log(`  ${colors.cyan}•${colors.reset} Restaurant table orders`);
    console.log(`  ${colors.cyan}•${colors.reset} Orders stored in different organization/location\n`);

    console.log(`${colors.bright}For website integration:${colors.reset}`);
    console.log(`Your website orders will CREATE NEW delivery orders`);
    console.log(`They'll appear alongside your existing in-store operations\n`);

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

exploreOrganization();
