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

        console.log('Creating iiko order with data:', JSON.stringify(orderData).substring(0, 200));

        // Validate environment variables
        if (!process.env.IIKO_API_URL || !process.env.IIKO_API_LOGIN || !process.env.IIKO_ORG_ID) {
            console.error('Missing iiko environment variables');
            throw new Error('iiko API not configured');
        }

        // Get iiko API token first
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
            console.error('No token received from iiko');
            throw new Error('No authentication token received');
        }

        console.log('iiko authentication successful');

        // Format phone number (add +971 if not present)
        const phone = orderData.customerPhone;
        const formattedPhone = phone.startsWith('+') ? phone : `+971${phone}`;

        // Calculate delivery time
        const deliveryTime = orderData.deliveryTime || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

        // Build iiko order structure
        const iikoOrder = {
            organizationId: process.env.IIKO_ORG_ID,
            terminalGroupId: process.env.IIKO_TERMINAL_ID,
            order: {
                phone: formattedPhone,
                completeBefore: deliveryTime,
                customer: {
                    name: orderData.customerName,
                    phone: formattedPhone
                },
                deliveryPoint: {
                    address: {
                        street: {
                            classifierId: "00000000-0000-0000-0000-000000000000",
                            name: orderData.address
                        },
                        house: "",
                        phone: formattedPhone
                    },
                    comment: orderData.notes || ''
                },
                items: orderData.items.map(item => ({
                    type: "Product",
                    productId: item.iikoProductId || "00000000-0000-0000-0000-000000000000",
                    amount: item.quantity,
                    comment: `${item.name} (Qty: ${item.quantity})`
                })),
                payments: [{
                    paymentTypeKind: orderData.paymentMethod === 'card' ? 'Card' : 'Cash',
                    paymentTypeId: process.env.IIKO_PAYMENT_TYPE_ID,
                    sum: orderData.total,
                    isProcessedExternally: true
                }],
                comment: orderData.notes || '',
                sourceKey: 'website',
                orderTypeId: process.env.IIKO_WEBSITE_ORDER_TYPE || process.env.IIKO_DELIVERY_ORDER_TYPE
            }
        };

        console.log('Sending iiko order:', JSON.stringify(iikoOrder).substring(0, 300));

        // Create order in iiko
        const orderResponse = await fetch(`${process.env.IIKO_API_URL}/api/1/deliveries/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(iikoOrder)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('iiko order creation failed:', orderResponse.status);
            console.error('Error response:', errorText);
            console.error('Request data sent:', JSON.stringify(iikoOrder, null, 2));
            throw new Error(`iiko order creation failed: ${orderResponse.status} - ${errorText.substring(0, 200)}`);
        }

        const result = await orderResponse.json();
        console.log('iiko order created:', JSON.stringify(result).substring(0, 200));

        // Check if we got an order ID
        const orderId = result.orderId || result.id || result.orderInfo?.id;
        
        if (!orderId) {
            console.error('No order ID in response:', result);
            throw new Error('No order ID received from iiko');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orderId: orderId,
                fallbackMode: false
            })
        };

    } catch (error) {
        console.error('iiko order creation error:', error.message);
        
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
