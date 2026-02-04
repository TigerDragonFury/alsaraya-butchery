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

async function getMenu(token) {
  console.log(`${colors.cyan}📋 Fetching menu from iiko...${colors.reset}`);
  console.log(`${colors.cyan}Using Menu ID: 9321${colors.reset}\n`);
  const response = await makeRequest(
    `${IIKO_API_URL}/api/2/menu`,
    'POST',
    { 
      organizationIds: [IIKO_ORG_ID],
      externalMenuId: "9321"
    },
    { 'Authorization': `Bearer ${token}` }
  );
  return response;
}

function formatPrice(price) {
  return price ? `${price.toFixed(2)} AED` : 'N/A';
}

async function fetchProducts() {
  console.log(`${colors.bright}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║       iiko Product List - Al Saraya          ║${colors.reset}`);
  console.log(`${colors.bright}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    const token = await getToken();
    const menuResponse = await getMenu(token);

    if (menuResponse.status !== 200) {
      console.log(`${colors.red}❌ Failed to fetch menu (Status: ${menuResponse.status})${colors.reset}`);
      console.log(JSON.stringify(menuResponse.data, null, 2));
      return;
    }

    const menu = menuResponse.data;
    
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}Menu Overview${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Display groups/categories
    if (menu.groups && menu.groups.length > 0) {
      console.log(`${colors.cyan}📂 Categories Found: ${colors.bright}${menu.groups.length}${colors.reset}\n`);
      menu.groups.forEach((group, idx) => {
        console.log(`${colors.magenta}${idx + 1}. ${group.name}${colors.reset}`);
        console.log(`   ID: ${colors.yellow}${group.id}${colors.reset}`);
        if (group.description) {
          console.log(`   Description: ${group.description}`);
        }
      });
      console.log('');
    } else {
      console.log(`${colors.yellow}⚠️  No categories found${colors.reset}\n`);
    }

    // Display products
    if (menu.products && menu.products.length > 0) {
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Products Found: ${menu.products.length}${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      // Group products by category
      const productsByCategory = {};
      menu.products.forEach(product => {
        const categoryId = product.parentGroup || 'uncategorized';
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = [];
        }
        productsByCategory[categoryId].push(product);
      });

      // Display products by category
      Object.keys(productsByCategory).forEach(categoryId => {
        const category = menu.groups?.find(g => g.id === categoryId);
        const categoryName = category?.name || 'Uncategorized';
        
        console.log(`${colors.bright}${colors.blue}▶ ${categoryName}${colors.reset}`);
        console.log(`${colors.blue}${'─'.repeat(50)}${colors.reset}\n`);

        productsByCategory[categoryId].forEach((product, idx) => {
          console.log(`${colors.green}${idx + 1}. ${product.name}${colors.reset}`);
          console.log(`   ${colors.cyan}ID:${colors.reset} ${colors.yellow}${product.id}${colors.reset}`);
          
          if (product.description) {
            console.log(`   ${colors.cyan}Description:${colors.reset} ${product.description}`);
          }
          
          if (product.price !== undefined) {
            console.log(`   ${colors.cyan}Price:${colors.reset} ${formatPrice(product.price)}`);
          }
          
          if (product.sizePrices && product.sizePrices.length > 0) {
            console.log(`   ${colors.cyan}Sizes:${colors.reset}`);
            product.sizePrices.forEach(size => {
              console.log(`     - ${size.sizeId?.name || 'Standard'}: ${formatPrice(size.price)}`);
            });
          }
          
          if (product.measureUnit) {
            console.log(`   ${colors.cyan}Unit:${colors.reset} ${product.measureUnit}`);
          }

          if (product.isDeleted) {
            console.log(`   ${colors.red}⚠️  DELETED${colors.reset}`);
          }

          if (product.type) {
            console.log(`   ${colors.cyan}Type:${colors.reset} ${product.type}`);
          }
          
          console.log('');
        });
      });

      // Summary
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Summary${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      console.log(`${colors.cyan}Total Categories:${colors.reset} ${menu.groups?.length || 0}`);
      console.log(`${colors.cyan}Total Products:${colors.reset} ${menu.products.length}`);
      
      const activeProducts = menu.products.filter(p => !p.isDeleted).length;
      const deletedProducts = menu.products.filter(p => p.isDeleted).length;
      
      console.log(`${colors.green}Active Products:${colors.reset} ${activeProducts}`);
      if (deletedProducts > 0) {
        console.log(`${colors.red}Deleted Products:${colors.reset} ${deletedProducts}`);
      }

      console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}Next Steps${colors.reset}`);
      console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
      
      if (activeProducts > 0) {
        console.log(`${colors.green}✅ You have ${activeProducts} products in iiko!${colors.reset}\n`);
        console.log(`${colors.bright}Option 1: Import from iiko${colors.reset}`);
        console.log(`  • Use iiko as source of truth for products`);
        console.log(`  • Sync products automatically to Supabase`);
        console.log(`  • Keep prices/availability in sync\n`);
        
        console.log(`${colors.bright}Option 2: Manual in Supabase${colors.reset}`);
        console.log(`  • Add products manually to Supabase`);
        console.log(`  • Link to iiko using iiko_product_id column`);
        console.log(`  • More control over website display\n`);
      } else {
        console.log(`${colors.yellow}⚠️  No active products found in iiko${colors.reset}`);
        console.log(`You'll need to add products to iiko or Supabase manually.\n`);
      }

    } else {
      console.log(`${colors.yellow}⚠️  No products found in iiko menu${colors.reset}\n`);
      console.log(`This could mean:`);
      console.log(`  • Products haven't been added to iiko yet`);
      console.log(`  • Your API key doesn't have access to menu data`);
      console.log(`  • Menu needs to be published in iiko\n`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.log(`\n${colors.yellow}Stack trace:${colors.reset}`);
      console.log(error.stack);
    }
  }
}

fetchProducts();
