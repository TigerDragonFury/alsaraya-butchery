// iiko POS Integration Module
// This file handles communication with the backend server that connects to iiko

const IIKO_SERVER_URL = ''; // Empty string = use same origin (works on production)

// iiko Integration Class
class IikoIntegration {
    constructor(serverUrl = IIKO_SERVER_URL) {
        this.serverUrl = serverUrl;
    }

    // Test connection to iiko
    async testConnection() {
        try {
            const response = await fetch(`${this.serverUrl}/api/iiko/test`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('iiko connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get menu from iiko
    async getMenu() {
        try {
            const response = await fetch(`${this.serverUrl}/api/iiko/menu`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get iiko menu:', error);
            return { success: false, error: error.message };
        }
    }

    // Send order to iiko POS
    async sendOrder(orderData) {
        try {
            console.log('Sending order to iiko:', orderData);

            const response = await fetch(`${this.serverUrl}/api/iiko/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('Order successfully sent to iiko POS:', data);
                return {
                    success: true,
                    orderId: data.orderId,
                    fallbackMode: data.fallbackMode || false,
                    message: 'Order received by iiko POS'
                };
            } else {
                console.error('iiko order creation failed:', data.error);
                return {
                    success: false,
                    error: data.error || 'Failed to create order in iiko'
                };
            }
        } catch (error) {
            console.error('Error sending order to iiko:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Fetch fresh iiko_product_id from database for cart items
    async fetchIikoProductIds(cart) {
        if (!window.supabase) {
            console.warn('Supabase not available, using cart data as-is');
            return cart;
        }

        const productIds = cart.map(item => item.id);
        const { data: products, error } = await window.supabase
            .from('products')
            .select('id, iiko_product_id')
            .in('id', productIds);

        if (error) {
            console.error('Error fetching product IDs:', error);
            return cart;
        }

        // Create lookup map
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p.iiko_product_id;
        });

        // Update cart items with fresh iiko_product_id
        return cart.map(item => ({
            ...item,
            iiko_product_id: productMap[item.id] || item.iiko_product_id || null
        }));
    }

    // Format order data for iiko
    async formatOrderForIiko(cart, customerInfo, total) {
        // Fetch fresh iiko_product_id from database
        const updatedCart = await this.fetchIikoProductIds(cart);

        return {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerEmail: customerInfo.email || '',
            address: customerInfo.address,
            notes: customerInfo.notes || '',
            items: updatedCart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                iikoProductId: item.iiko_product_id || null, // Use fresh iiko product ID from database
                notes: item.notes || ''
            })),
            total: total,
            orderDate: new Date().toISOString(),
            paymentMethod: customerInfo.paymentMethod || 'cash',
            deliveryTime: customerInfo.deliveryTime, // Delivery time from checkout
            deliveryType: customerInfo.deliveryType  // Delivery type (asap, today, tomorrow, custom)
        };
    }
}

// Create global instance
const iikoIntegration = new IikoIntegration();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.iikoIntegration = iikoIntegration;
}
