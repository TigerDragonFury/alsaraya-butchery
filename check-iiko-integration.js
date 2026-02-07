const fetch = require('node-fetch');
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

async function fetchItemList(token) {
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
      throw new Error(`Failed to fetch item list: ${response.status}`);
    }

    const data = await response.json();
    console.log('Item list fetched successfully:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching item list:', error);
    throw error;
  }
}

(async () => {
  try {
    console.log('Checking IIKO integration...');
    const token = await getToken();
    await fetchItemList(token);
  } catch (error) {
    console.error('IIKO integration check failed:', error);
  }
})();