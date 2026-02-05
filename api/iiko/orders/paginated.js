    // Vercel Serverless Function: Get iiko Orders (Paginated)
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

            // Parse query parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            let daysBack = parseInt(req.query.days) || 7;

            // Prevent requesting excessively large date ranges which iiko may reject
            const MAX_DAYS = 14;
            if (daysBack < 1) daysBack = 1;
            if (daysBack > MAX_DAYS) {
                console.warn(`Requested days (${req.query.days}) exceeds max (${MAX_DAYS}), capping to ${MAX_DAYS}`);
                daysBack = MAX_DAYS;
            }
            const status = req.query.status || null;

            // Calculate date range
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - daysBack);
            dateFrom.setHours(0, 0, 0, 0);

            const dateTo = new Date();
            dateTo.setDate(dateTo.getDate() + 1);
            dateTo.setHours(23, 59, 59, 999);

            // Build statuses array
            const statuses = status
                ? [status]
                : ['Unconfirmed', 'WaitCooking', 'ReadyForCooking', 'CookingStarted',
                'CookingCompleted', 'Waiting', 'OnWay', 'Delivered', 'Closed', 'Cancelled'];

            const ordersResponse = await fetch(
                `${process.env.IIKO_API_URL}/api/1/deliveries/by_delivery_date_and_status`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        organizationIds: [process.env.IIKO_ORG_ID],
                        deliveryDateFrom: dateFrom.toISOString(),
                        deliveryDateTo: dateTo.toISOString(),
                        statuses: statuses
                    })
                }
            );

            if (!ordersResponse.ok) {
                const errorText = await ordersResponse.text();
                console.error('iiko orders fetch failed:', ordersResponse.status, errorText);
                // Include iiko error text for easier debugging (will be returned as part of server error)
                throw new Error(`Failed to fetch orders: ${ordersResponse.status} ${errorText}`);
            }

            const responseData = await ordersResponse.json();

            // Extract orders from response structure
            let allOrders = [];
            if (responseData.ordersByOrganizations) {
                responseData.ordersByOrganizations.forEach(org => {
                    if (org.orders) {
                        allOrders = allOrders.concat(org.orders);
                    }
                });
            } else if (responseData.orders) {
                allOrders = responseData.orders;
            }

            // Sort by order number descending (most recent first)
            allOrders.sort((a, b) => {
                const numA = a.order?.number || 0;
                const numB = b.order?.number || 0;
                return numB - numA;
            });

            // Pagination
            const totalOrders = allOrders.length;
            const totalPages = Math.ceil(totalOrders / limit);
            const startIndex = (page - 1) * limit;
            const paginatedOrders = allOrders.slice(startIndex, startIndex + limit);

            // Format orders for response
            const formattedOrders = paginatedOrders.map(order => ({
                id: order.id,
                number: order.order?.number || 'N/A',
                status: order.order?.status || order.creationStatus || 'Unknown',
                customer: order.order?.customer?.name || 'N/A',
                phone: order.order?.phone || 'N/A',
                address: order.order?.deliveryPoint?.address?.line1 || 'N/A',
                total: order.order?.sum || 0,
                items: order.order?.items?.map(item => ({
                    name: item.product?.name || 'Unknown',
                    quantity: item.amount,
                    price: item.price
                })) || [],
                payment: order.order?.payments?.[0]?.paymentType?.name || 'N/A',
                created: order.order?.whenCreated || null,
                deliveryTime: order.order?.completeBefore || null,
                comment: order.order?.comment || '',
                sourceKey: order.order?.sourceKey || 'pos'
            }));

            return res.status(200).json({
                success: true,
                orders: formattedOrders,
                pagination: {
                    page,
                    limit,
                    totalOrders,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                dateRange: {
                    from: dateFrom.toISOString(),
                    to: dateTo.toISOString()
                }
            });

        } catch (error) {
            console.error('Error fetching iiko orders:', error.message);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
