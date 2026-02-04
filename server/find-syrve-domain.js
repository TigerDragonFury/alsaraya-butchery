require('dotenv').config();
const https = require('https');

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-eu.iiko.services';
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
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

async function findDomain() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║        Syrve Domain Finder - Al Saraya       ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    console.log(`${colors.cyan}🔐 Authenticating...${colors.reset}`);
    const token = await getToken();
    console.log(`${colors.green}✅ Authenticated!${colors.reset}\n`);

    // Get full organization details
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Organization Information (Full Details)${colors.reset}`);
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
      
      console.log(`${colors.bright}Full Organization Data:${colors.reset}`);
      console.log(JSON.stringify(org, null, 2));
      console.log('');

      // Look for any domain-related fields
      const possibleDomainFields = [
        'domain', 'backOfficeDomain', 'url', 'webUrl', 'portalUrl', 
        'tenant', 'subdomain', 'instanceUrl', 'host'
      ];

      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Searching for Domain Fields:${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      let foundDomain = false;
      
      function searchObject(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          
          // Check if key might contain domain info
          if (possibleDomainFields.some(field => lowerKey.includes(field))) {
            console.log(`${colors.green}✓ Found:${colors.reset} ${prefix}${key} = ${colors.cyan}${value}${colors.reset}`);
            foundDomain = true;
          }
          
          // Recursively search nested objects
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            searchObject(value, `${prefix}${key}.`);
          }
        }
      }

      searchObject(org);

      if (!foundDomain) {
        console.log(`${colors.yellow}⚠️  No domain fields found in organization data${colors.reset}\n`);
      }

      console.log('');
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Analysis${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      console.log(`${colors.cyan}API Endpoint Used:${colors.reset} ${IIKO_API_URL}`);
      console.log(`${colors.cyan}Organization Name:${colors.reset} ${org.name}`);
      console.log(`${colors.cyan}Organization ID:${colors.reset} ${org.id}\n`);

      console.log(`${colors.bright}Unfortunately:${colors.reset}`);
      console.log(`The API doesn't expose Back Office domain information.\n`);

      console.log(`${colors.bright}Your options:${colors.reset}`);
      console.log(`1. Check your Syrve/iiko setup email for the login URL`);
      console.log(`2. Contact your iiko account manager or reseller`);
      console.log(`3. Try common UAE domains:`);
      console.log(`   ${colors.cyan}https://syrve.online${colors.reset}`);
      console.log(`   ${colors.cyan}https://office.syrve.me${colors.reset}`);
      console.log(`   ${colors.cyan}https://eu.syrve.online${colors.reset}\n`);

    } else {
      console.log(`${colors.red}Failed to get organization info${colors.reset}\n`);
      console.log(JSON.stringify(orgResponse.data, null, 2));
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

findDomain();
