// Netlify Serverless Function: Create iiko Order
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const orderData = JSON.parse(event.body);

        // Get iiko API token first
        const authResponse = await fetch(`${process.env.IIKO_API_URL}/api/1/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiLogin: process.env.IIKO_API_LOGIN
            })
        });

        const { token } = await authResponse.json();

        // Create order in iiko
        const orderResponse = await fetch(`${process.env.IIKO_API_URL}/api/1/deliveries/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                organizationId: process.env.IIKO_ORG_ID,
                ...orderData
            })
        });

        const result = await orderResponse.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orderId: result.orderId,
                fallbackMode: false
            })
        };

    } catch (error) {
        console.error('iiko order creation error:', error);
        
        // Fallback mode - log order for manual processing
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orderId: `FALLBACK-${Date.now()}`,
                fallbackMode: true,
                error: error.message
            })
        };
    }
};
