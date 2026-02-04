/**
 * iiko API Credentials Test Script
 * Run this to verify your iiko credentials are working
 * 
 * Usage:
 *   node test-iiko-credentials.js
 */

const https = require('https');
const readline = require('readline');

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Test results storage
const results = {
    authentication: null,
    organizationAccess: null,
    terminalAccess: null,
    menuAccess: null
};

console.log(`\n${colors.cyan}${colors.bold}╔═══════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}║   iiko API Credentials Verification Tool     ║${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

// Check if .env file exists
let hasEnvFile = false;
try {
    require('dotenv').config();
    hasEnvFile = true;
} catch (e) {
    console.log(`${colors.yellow}⚠️  dotenv not installed, will prompt for credentials${colors.reset}\n`);
}

// Configuration
const config = {
    apiUrl: process.env.IIKO_API_URL || '',
    orgId: process.env.IIKO_ORG_ID || '',
    apiLogin: process.env.IIKO_API_LOGIN || '',
    terminalId: process.env.IIKO_TERMINAL_ID || ''
};

// Helper function to make HTTPS requests
function makeRequest(url, method, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

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

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test 1: Authentication
async function testAuthentication() {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}TEST 1: Authentication${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    try {
        console.log(`\n🔐 Attempting to authenticate with iiko API...`);
        console.log(`   API URL: ${config.apiUrl}`);
        console.log(`   API Login: ${config.apiLogin}`);
        
        const response = await makeRequest(
            `${config.apiUrl}/api/1/access_token`,
            'POST',
            { apiLogin: config.apiLogin }
        );

        if (response.status === 200 && response.data.token) {
            console.log(`\n${colors.green}✅ SUCCESS: Authentication successful!${colors.reset}`);
            console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
            results.authentication = { success: true, token: response.data.token };
            return response.data.token;
        } else {
            console.log(`\n${colors.red}❌ FAILED: Authentication failed${colors.reset}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Response:`, response.data);
            results.authentication = { success: false, error: response.data };
            return null;
        }
    } catch (error) {
        console.log(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
        results.authentication = { success: false, error: error.message };
        return null;
    }
}

// Test 2: Organization Access
async function testOrganizationAccess(token) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}TEST 2: Organization Access${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    try {
        console.log(`\n🏢 Checking organization access...`);
        console.log(`   Organization ID: ${config.orgId}`);
        
        const response = await makeRequest(
            `${config.apiUrl}/api/1/organizations`,
            'POST',
            { organizationIds: [config.orgId] },
            token
        );

        if (response.status === 200 && response.data.organizations) {
            const org = response.data.organizations.find(o => o.id === config.orgId);
            if (org) {
                console.log(`\n${colors.green}✅ SUCCESS: Organization found!${colors.reset}`);
                console.log(`   Name: ${org.name || 'N/A'}`);
                console.log(`   Country: ${org.country || 'N/A'}`);
                results.organizationAccess = { success: true, org };
                return true;
            } else {
                console.log(`\n${colors.red}❌ FAILED: Organization ID not found${colors.reset}`);
                results.organizationAccess = { success: false, error: 'Organization not found' };
                return false;
            }
        } else {
            console.log(`\n${colors.red}❌ FAILED: Could not access organizations${colors.reset}`);
            console.log(`   Status: ${response.status}`);
            results.organizationAccess = { success: false, error: response.data };
            return false;
        }
    } catch (error) {
        console.log(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
        results.organizationAccess = { success: false, error: error.message };
        return false;
    }
}

// Test 3: Terminal Groups
async function testTerminalAccess(token) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}TEST 3: Terminal Access${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    try {
        console.log(`\n📍 Checking terminal access...`);
        console.log(`   Terminal ID: ${config.terminalId}`);
        
        const response = await makeRequest(
            `${config.apiUrl}/api/1/terminal_groups`,
            'POST',
            { organizationIds: [config.orgId] },
            token
        );

        if (response.status === 200 && response.data.terminalGroups) {
            const terminal = response.data.terminalGroups.find(t => t.id === config.terminalId);
            if (terminal) {
                console.log(`\n${colors.green}✅ SUCCESS: Terminal found!${colors.reset}`);
                console.log(`   Name: ${terminal.name || 'N/A'}`);
                console.log(`   Address: ${terminal.address || 'N/A'}`);
                results.terminalAccess = { success: true, terminal };
                return true;
            } else {
                console.log(`\n${colors.yellow}⚠️  WARNING: Terminal ID not found in list${colors.reset}`);
                console.log(`\n   Available terminals:`);
                response.data.terminalGroups.slice(0, 5).forEach(t => {
                    console.log(`   - ${t.name} (ID: ${t.id})`);
                });
                if (response.data.terminalGroups.length > 5) {
                    console.log(`   ... and ${response.data.terminalGroups.length - 5} more`);
                }
                results.terminalAccess = { success: false, availableTerminals: response.data.terminalGroups };
                return false;
            }
        } else {
            console.log(`\n${colors.red}❌ FAILED: Could not access terminal groups${colors.reset}`);
            results.terminalAccess = { success: false, error: response.data };
            return false;
        }
    } catch (error) {
        console.log(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
        results.terminalAccess = { success: false, error: error.message };
        return false;
    }
}

// Test 4: Menu Access
async function testMenuAccess(token) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}TEST 4: Menu/Nomenclature Access${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    try {
        console.log(`\n📋 Retrieving menu/nomenclature...`);
        
        const response = await makeRequest(
            `${config.apiUrl}/api/1/nomenclature`,
            'POST',
            { organizationId: config.orgId },
            token
        );

        if (response.status === 200 && response.data.products) {
            console.log(`\n${colors.green}✅ SUCCESS: Menu retrieved!${colors.reset}`);
            console.log(`   Total products: ${response.data.products.length}`);
            console.log(`\n   Sample products:`);
            response.data.products.slice(0, 3).forEach(p => {
                console.log(`   - ${p.name} (ID: ${p.id})`);
            });
            results.menuAccess = { success: true, productCount: response.data.products.length };
            return true;
        } else {
            console.log(`\n${colors.red}❌ FAILED: Could not retrieve menu${colors.reset}`);
            console.log(`   Status: ${response.status}`);
            results.menuAccess = { success: false, error: response.data };
            return false;
        }
    } catch (error) {
        console.log(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
        results.menuAccess = { success: false, error: error.message };
        return false;
    }
}

// Print final summary
function printSummary() {
    console.log(`\n\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}                TEST SUMMARY                   ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════${colors.reset}\n`);

    const tests = [
        { name: 'Authentication', result: results.authentication },
        { name: 'Organization Access', result: results.organizationAccess },
        { name: 'Terminal Access', result: results.terminalAccess },
        { name: 'Menu Access', result: results.menuAccess }
    ];

    tests.forEach(test => {
        const status = test.result?.success ? 
            `${colors.green}✅ PASS${colors.reset}` : 
            `${colors.red}❌ FAIL${colors.reset}`;
        console.log(`${test.name.padEnd(25)} ${status}`);
    });

    const allPassed = tests.every(t => t.result?.success);

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    if (allPassed) {
        console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED!${colors.reset}`);
        console.log(`${colors.green}Your iiko credentials are working correctly.${colors.reset}`);
        console.log(`${colors.green}You can now start the integration server.${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}${colors.bold}⚠️  SOME TESTS FAILED${colors.reset}`);
        console.log(`${colors.yellow}Please check your credentials and try again.${colors.reset}\n`);
        
        // Provide specific advice
        if (!results.authentication?.success) {
            console.log(`${colors.red}→ Authentication failed: Check your API_LOGIN${colors.reset}`);
        }
        if (!results.organizationAccess?.success) {
            console.log(`${colors.red}→ Organization access failed: Check your ORG_ID${colors.reset}`);
        }
        if (!results.terminalAccess?.success) {
            console.log(`${colors.red}→ Terminal access failed: Check your TERMINAL_ID${colors.reset}`);
        }
        console.log();
    }
}

// Prompt for credentials if not in .env
async function promptForCredentials() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log(`${colors.yellow}Please enter your iiko API credentials:${colors.reset}\n`);

    if (!config.apiUrl) {
        config.apiUrl = await question('API URL (e.g., https://api-ru.iiko.services): ') || 'https://api-ru.iiko.services';
    }
    if (!config.apiLogin) {
        config.apiLogin = await question('API Login: ');
    }
    if (!config.orgId) {
        config.orgId = await question('Organization ID: ');
    }
    if (!config.terminalId) {
        config.terminalId = await question('Terminal ID: ');
    }

    rl.close();
}

// Main execution
async function main() {
    try {
        // Check if we have all required credentials
        const hasAllCredentials = config.apiUrl && config.apiLogin && config.orgId && config.terminalId;

        if (!hasAllCredentials) {
            await promptForCredentials();
        } else {
            console.log(`${colors.green}✓ Credentials loaded from .env file${colors.reset}\n`);
        }

        // Validate we have everything
        if (!config.apiLogin || !config.orgId || !config.terminalId) {
            console.log(`\n${colors.red}❌ Error: Missing required credentials${colors.reset}\n`);
            return;
        }

        // Run tests
        const token = await testAuthentication();
        
        if (token) {
            await testOrganizationAccess(token);
            await testTerminalAccess(token);
            await testMenuAccess(token);
        }

        // Print summary
        printSummary();

    } catch (error) {
        console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}\n`);
        process.exit(1);
    }
}

// Run the script
main();
