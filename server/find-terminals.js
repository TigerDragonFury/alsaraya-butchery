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
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getToken() {
  console.log(`${colors.cyan}🔐 Authenticating with iiko API...${colors.reset}`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/access_token`,
    'POST',
    { apiLogin: IIKO_API_LOGIN }
  );
  
  if (response.token) {
    console.log(`${colors.green}✅ Authentication successful!${colors.reset}\n`);
    return response.token;
  }
  throw new Error('Failed to get token');
}

async function getTerminalGroups(token) {
  console.log(`${colors.cyan}📍 Fetching terminal groups...${colors.reset}`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/terminal_groups?organizationIds=${IIKO_ORG_ID}`,
    'GET',
    null,
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

async function getDeliveryTerminals(token) {
  console.log(`${colors.cyan}🚚 Fetching delivery terminals...${colors.reset}`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/1/deliveries/terminals?organizationIds=${IIKO_ORG_ID}`,
    'GET',
    null,
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

async function findTerminals() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║      iiko Terminal Finder - Al Saraya        ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const token = await getToken();

    // Try terminal groups endpoint
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}METHOD 1: Terminal Groups${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    try {
      const terminalGroups = await getTerminalGroups(token);
      console.log(`${colors.green}✅ Response received!${colors.reset}\n`);
      
      if (terminalGroups.terminalGroups && terminalGroups.terminalGroups.length > 0) {
        terminalGroups.terminalGroups.forEach((group, idx) => {
          console.log(`${colors.bright}Terminal Group ${idx + 1}:${colors.reset}`);
          console.log(`  ${colors.cyan}ID:${colors.reset} ${group.id}`);
          console.log(`  ${colors.cyan}Name:${colors.reset} ${group.name || 'N/A'}`);
          console.log(`  ${colors.cyan}Organization ID:${colors.reset} ${group.organizationId}`);
          
          if (group.items && group.items.length > 0) {
            console.log(`  ${colors.cyan}Terminals in group:${colors.reset}`);
            group.items.forEach((terminal, tIdx) => {
              console.log(`    ${tIdx + 1}. ${colors.green}${terminal.name || 'Unnamed'}${colors.reset}`);
              console.log(`       ID: ${colors.yellow}${terminal.id}${colors.reset}`);
            });
          }
          console.log('');
        });
      } else {
        console.log(`${colors.yellow}No terminal groups found${colors.reset}\n`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    }

    // Try delivery terminals endpoint
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}METHOD 2: Delivery Terminals${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    try {
      const deliveryTerminals = await getDeliveryTerminals(token);
      console.log(`${colors.green}✅ Response received!${colors.reset}\n`);
      
      if (deliveryTerminals.terminalGroups && deliveryTerminals.terminalGroups.length > 0) {
        deliveryTerminals.terminalGroups.forEach((group, idx) => {
          console.log(`${colors.bright}Delivery Terminal Group ${idx + 1}:${colors.reset}`);
          console.log(`  ${colors.cyan}Organization ID:${colors.reset} ${group.organizationId}`);
          
          if (group.items && group.items.length > 0) {
            console.log(`  ${colors.cyan}Terminals:${colors.reset}`);
            group.items.forEach((terminal, tIdx) => {
              console.log(`    ${tIdx + 1}. ${colors.green}${terminal.name || 'Unnamed'}${colors.reset}`);
              console.log(`       ${colors.bright}Terminal ID: ${colors.yellow}${terminal.id}${colors.reset}`);
              console.log(`       Delivery Service Type: ${terminal.deliveryServiceType || 'N/A'}`);
            });
          }
          console.log('');
        });
      } else {
        console.log(`${colors.yellow}No delivery terminals found${colors.reset}\n`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    }

    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📋 Next Steps:${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`1. Copy the correct ${colors.yellow}Terminal ID${colors.reset} from above`);
    console.log(`2. Update ${colors.cyan}IIKO_TERMINAL_ID${colors.reset} in your ${colors.cyan}.env${colors.reset} file`);
    console.log(`3. Run ${colors.cyan}node test-iiko-credentials.js${colors.reset} again to verify\n`);

  } catch (error) {
    console.log(`${colors.red}❌ Fatal Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

findTerminals();
