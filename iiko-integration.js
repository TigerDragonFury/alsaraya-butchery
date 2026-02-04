// iiko POS Integration Module
// This file handles communication with the backend server that connects to iiko

const IIKO_SERVER_URL = ''; // Empty string = use same origin (works on Netlify and localhost)

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

    // Format order data for iiko
    formatOrderForIiko(cart, customerInfo, total) {
        return {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerEmail: customerInfo.email || '',
            address: customerInfo.address,
            notes: customerInfo.notes || '',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                iikoProductId: item.iiko_product_id || null, // Use iiko product ID from database
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
