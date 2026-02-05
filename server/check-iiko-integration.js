const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
require('dotenv').config();

const IIKO_API_URL = process.env.IIKO_API_URL;
const IIKO_API_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_ORG_ID = process.env.IIKO_ORG_ID;

async function getToken() {
  try {
    const response = await fetch(`${IIKO_API_URL}/api/1/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiLogin: IIKO_API_LOGIN })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
}

async function fetchAvailableMenus(token) {
  try {
    const response = await fetch(`${IIKO_API_URL}/api/2/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ organizationIds: [IIKO_ORG_ID] })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch menu list: ${response.status}`);
    }

    const data = await response.json();
    console.log('Available menus:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching menu list:', error);
    throw error;
  }
}

async function fetchMenuItems(token, menuId) {
  try {
    console.log(`\nFetching items from menu ID: ${menuId}...`);
    const response = await fetch(`${IIKO_API_URL}/api/2/menu/by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        organizationIds: [IIKO_ORG_ID],
        externalMenuId: menuId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch menu items: ${response.status}`);
    }

    const data = await response.json();

    // Extract products from the menu structure
    const itemGroups = data.itemCategories || [];
    let totalProducts = 0;

    console.log(`\n📦 Menu "${menuId}" contents:\n`);

    itemGroups.forEach(category => {
      const items = category.items || [];
      if (items.length > 0) {
        console.log(`📁 ${category.name} (${items.length} items)`);
        items.forEach(item => {
          const price = item.itemSizes?.[0]?.prices?.[0]?.price || 0;
          console.log(`   - ${item.name}: ${price} RUB`);
        });
        totalProducts += items.length;
      }
    });

    console.log(`\n✅ Total products: ${totalProducts}`);
    return data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

(async () => {
  try {
    console.log('Checking IIKO integration...\n');
    const token = await getToken();

    // First show available menus
    const menus = await fetchAvailableMenus(token);

    // Fetch items from menu 9321 (Website Menu)
    if (menus.externalMenus && menus.externalMenus.length > 0) {
      const menuId = menus.externalMenus[0].id;
      await fetchMenuItems(token, menuId);
    }
  } catch (error) {
    console.error('IIKO integration check failed:', error);
  }
})();