const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// iiko API Configuration
const IIKO_CONFIG = {
    apiUrl: process.env.IIKO_API_URL,
    orgId: process.env.IIKO_ORG_ID,
    apiLogin: process.env.IIKO_API_LOGIN,
    terminalId: process.env.IIKO_TERMINAL_ID,
    deliveryOrderType: process.env.IIKO_DELIVERY_ORDER_TYPE,
    collectionOrderType: process.env.IIKO_COLLECTION_ORDER_TYPE,
    websiteOrderType: process.env.IIKO_WEBSITE_ORDER_TYPE,
    paymentTypeId: process.env.IIKO_PAYMENT_TYPE_ID,
    menuId: process.env.IIKO_MENU_ID
};

let iikoToken = null;
let tokenExpiry = null;

// Helper function to generate GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to get iiko API token
async function getIikoToken() {
    try {
        // Check if we have a valid token
        if (iikoToken && tokenExpiry && new Date() < tokenExpiry) {
            return iikoToken;
        }

        console.log('Requesting new iiko token...');
        
        const response = await axios.post(
            `${IIKO_CONFIG.apiUrl}/api/1/access_token`,
            {
                apiLogin: IIKO_CONFIG.apiLogin
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        iikoToken = response.data.token;
        // Token typically expires in 60 minutes, refresh after 50 minutes
        tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);
        
        console.log('iiko token obtained successfully');
        return iikoToken;
    } catch (error) {
        console.error('Error getting iiko token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with iiko API');
    }
}

// Function to get iiko menu
async function getIikoMenu() {
    try {
        const token = await getIikoToken();
        
        const response = await axios.post(
            `${IIKO_CONFIG.apiUrl}/api/1/nomenclature`,
            {
                organizationId: IIKO_CONFIG.orgId
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error getting iiko menu:', error.response?.data || error.message);
        throw error;
    }
}

// Function to create order in iiko
async function createIikoOrder(orderData) {
    try {
        const token = await getIikoToken();
        
        // Format phone number - ensure it starts with +
        const formatPhoneNumber = (phone) => {
            if (!phone) return '+971500000000'; // Default UAE number
            phone = phone.trim().replace(/\s+/g, ''); // Remove spaces
            if (phone.startsWith('+')) return phone;
            if (phone.startsWith('00')) return '+' + phone.substring(2);
            if (phone.startsWith('971')) return '+' + phone;
            if (phone.startsWith('0')) return '+971' + phone.substring(1); // UAE local format
            return '+971' + phone; // Assume UAE
        };
        
        const formattedPhone = formatPhoneNumber(orderData.customerPhone);
        
        // Map your order data to iiko format
        // Calculate delivery time based on customer preference
        const deliveryTime = (() => {
            if (orderData.deliveryTime) {
                // Use customer's specified time
                return new Date(orderData.deliveryTime).toISOString();
            }
            
            // Default logic based on urgency
            if (orderData.urgent || orderData.deliveryType === 'asap') {
                // For urgent/ASAP orders: 4 hours from now (minimum iiko accepts)
                const asapTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
                return asapTime.toISOString();
            } else if (orderData.deliveryType === 'today') {
                // For "today" delivery: 5 hours from now or 7 PM, whichever is later
                const fiveHoursLater = new Date(Date.now() + 5 * 60 * 60 * 1000);
                const today7PM = new Date();
                today7PM.setHours(19, 0, 0, 0);
                return (fiveHoursLater > today7PM ? fiveHoursLater : today7PM).toISOString();
            } else {
                // Default: Tomorrow at noon (safe default)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(12, 0, 0, 0);
                return tomorrow.toISOString();
            }
        })();
        
        const iikoOrder = {
            organizationId: IIKO_CONFIG.orgId,
            terminalGroupId: IIKO_CONFIG.terminalId,
            order: {
                id: generateGUID(),
                date: new Date().toISOString(),
                phone: formattedPhone,
                completeBefore: deliveryTime, // IMPORTANT: This is the delivery date used for searches
                // Customer information
                customer: {
                    name: orderData.customerName,
                    phone: formattedPhone
                },
                // Delivery information
                deliveryPoint: {
                    address: {
                        street: {
                            classifierId: "00000000-0000-0000-0000-000000000000",
                            name: orderData.address
                        },
                        house: orderData.houseNumber || ""
                    },
                    comment: orderData.notes || ''
                },
                // Order items
                items: orderData.items.map(item => ({
                    type: "Product",
                    // Use iiko product ID if available, otherwise use placeholder GUID
                    // Note: Orders will fail validation until products are mapped in Menu ID 9321
                    productId: item.iikoProductId || "00000000-0000-0000-0000-000000000000",
                    amount: item.quantity,
                    comment: item.notes || `Supabase Product ID: ${item.id} - ${item.name || 'Unknown Product'}`
                })),
                // Payment info
                payments: [{
                    paymentTypeKind: 'Cash', // or 'Card', 'External'
                    paymentTypeId: IIKO_CONFIG.paymentTypeId, // Use configured payment type
                    sum: orderData.total,
                    isProcessedExternally: true
                }],
                // Order metadata
                comment: orderData.notes || '',
                sourceKey: 'website', // Identifies orders from your website
                orderTypeId: IIKO_CONFIG.websiteOrderType || 
                    (orderData.orderType === 'collection' ? 
                        IIKO_CONFIG.collectionOrderType : 
                        IIKO_CONFIG.deliveryOrderType) // Use website order type if available
            }
        };

        const response = await axios.post(
            `${IIKO_CONFIG.apiUrl}/api/1/deliveries/create`,
            iikoOrder,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Order created in iiko:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating iiko order:', error.response?.data || error.message);
        throw error;
    }
}

// API Endpoints

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'iiko integration server running' });
});

// Get Stripe publishable key
app.get('/api/stripe/config', (req, res) => {
    res.json({ 
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
    });
});

// Create Stripe Payment Intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'aed', customerName, customerEmail } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid amount' 
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to fils (cents)
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
            description: `Al Saraya Butchery Order - ${customerName}`,
            metadata: {
                customer_name: customerName,
                customer_email: customerEmail || 'N/A'
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Verify Stripe Payment
app.post('/api/stripe/verify-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment Intent ID required' 
            });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paid: paymentIntent.status === 'succeeded'
        });
    } catch (error) {
        console.error('Stripe verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get menu from iiko
app.get('/api/iiko/menu', async (req, res) => {
    try {
        const menu = await getIikoMenu();
        res.json({ success: true, menu });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create order in iiko
app.post('/api/iiko/create-order', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Validate order data
        if (!orderData.customerName || !orderData.customerPhone || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required order information' 
            });
        }

        // WORKAROUND: Check if any products have valid iiko IDs
        const hasValidProducts = orderData.items.some(item => 
            item.iikoProductId && 
            item.iikoProductId !== '' && 
            item.iikoProductId !== '00000000-0000-0000-0000-000000000000'
        );

        if (!hasValidProducts) {
            // Fallback mode: Log order without sending to iiko
            console.log('⚠️  No valid iiko product IDs found - using fallback mode');
            console.log('📝 Order will be logged for manual processing');
            
            const fallbackOrderId = generateGUID();
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📦 FALLBACK ORDER CREATED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Order ID: ${fallbackOrderId}`);
            console.log(`Customer: ${orderData.customerName}`);
            console.log(`Phone: ${orderData.customerPhone}`);
            console.log(`Address: ${orderData.address}`);
            console.log(`Total: $${orderData.total}`);
            console.log(`Items:`);
            orderData.items.forEach(item => {
                console.log(`  • ${item.name} x${item.quantity} - $${item.price}`);
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('💡 This order needs to be manually entered in iiko POS');
            console.log('   Once products are configured, orders will sync automatically\n');
            
            return res.json({ 
                success: true, 
                orderId: fallbackOrderId,
                message: 'Order received and logged for manual processing',
                fallbackMode: true,
                warning: 'Products not yet configured in iiko POS. Order saved for manual entry.'
            });
        }

        // Create order in iiko (normal flow)
        const iikoResponse = await createIikoOrder(orderData);
        
        res.json({ 
            success: true, 
            orderId: iikoResponse.orderId || iikoResponse.orderInfo?.id,
            message: 'Order successfully created in iiko POS',
            iikoResponse 
        });
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data 
        });
    }
});

// Fetch orders from iiko
app.get('/api/iiko/orders', async (req, res) => {
    try {
        const token = await getIikoToken();
        
        // Get hours parameter from query string, default to 24 hours
        const hoursBack = parseInt(req.query.hours) || 24;
        
        const dateFrom = new Date();
        dateFrom.setHours(dateFrom.getHours() - hoursBack);
        
        const dateTo = new Date();
        
        const response = await axios.post(
            `${IIKO_CONFIG.apiUrl}/api/1/deliveries/by_delivery_date_and_status`,
            {
                organizationIds: [IIKO_CONFIG.orgId],
                deliveryDateFrom: dateFrom.toISOString(),
                deliveryDateTo: dateTo.toISOString()
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ 
            success: true, 
            orders: response.data.orders || [],
            count: response.data.orders?.length || 0,
            timeRange: `Last ${hoursBack} hours`
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get specific order by ID
app.get('/api/iiko/orders/:orderId', async (req, res) => {
    try {
        const token = await getIikoToken();
        const orderId = req.params.orderId;
        
        const response = await axios.post(
            `${IIKO_CONFIG.apiUrl}/api/1/deliveries/by_id`,
            {
                organizationIds: [IIKO_CONFIG.orgId],
                orderIds: [orderId]
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const order = response.data.orders?.[0];
        
        if (order) {
            res.json({ 
                success: true, 
                order 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Order not found or still processing' 
            });
        }
    } catch (error) {
        console.error('Failed to fetch order:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test iiko connection
app.get('/api/iiko/test', async (req, res) => {
    try {
        const token = await getIikoToken();
        res.json({ 
            success: true, 
            message: 'Successfully connected to iiko API',
            hasToken: !!token 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 iiko Integration Server running on port ${PORT}`);
    console.log(`📡 iiko API URL: ${IIKO_CONFIG.apiUrl}`);
    console.log(`🏢 Organization ID: ${IIKO_CONFIG.orgId}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/health - Health check`);
    console.log(`  GET  /api/iiko/test - Test iiko connection`);
    console.log(`  GET  /api/iiko/menu - Get iiko menu`);
    console.log(`  GET  /api/iiko/orders - Fetch all orders (optional ?hours=24)`);
    console.log(`  GET  /api/iiko/orders/:orderId - Get specific order by ID`);
    console.log(`  POST /api/iiko/create-order - Create order in iiko`);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stopping conflicting process...`);
        process.exit(1);
    }
});

module.exports = app;
