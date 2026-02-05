// Vercel Serverless Function: Get Single iiko Order by ID
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required'
            });
        }

        // Validate environment variables
        if (!process.env.IIKO_API_URL || !process.env.IIKO_API_LOGIN || !process.env.IIKO_ORG_ID) {
            console.error('Missing iiko environment variables');
            throw new Error('iiko API not configured');
        }

        // Get iiko API token
        const authResponse = await fetch(`${process.env.IIKO_API_URL}/api/1/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiLogin: process.env.IIKO_API_LOGIN
            })
        });

        if (!authResponse.ok) {
            console.error('iiko auth failed:', authResponse.status);
            throw new Error(`iiko authentication failed: ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        const token = authData.token;

        if (!token) {
            throw new Error('No authentication token received');
        }

        // Fetch order by ID
        const orderResponse = await fetch(
            `${process.env.IIKO_API_URL}/api/1/deliveries/by_id`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    organizationIds: [process.env.IIKO_ORG_ID],
                    orderIds: [orderId]
                })
            }
        );

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('iiko order fetch failed:', orderResponse.status, errorText);
            throw new Error(`Failed to fetch order: ${orderResponse.status}`);
        }

        const responseData = await orderResponse.json();
        const order = responseData.orders?.[0];

        if (order) {
            return res.status(200).json({
                success: true,
                order
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'Order not found or still processing'
            });
        }

    } catch (error) {
        console.error('Error fetching iiko order:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
