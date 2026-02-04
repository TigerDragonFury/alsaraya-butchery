const axios = require('axios');

async function testFallbackMode() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('   Testing Fallback Mode - Direct Server Call');
    console.log('═══════════════════════════════════════════════\n');

    const testOrder = {
        customerName: 'Test Customer',
        customerPhone: '+971501234567',
        customerEmail: 'test@example.com',
        address: 'Test Address, Dubai',
        notes: 'Test order for fallback mode',
        items: [
            {
                id: 1,
                name: 'Test Product',
                quantity: 2,
                price: 25.00,
                iikoProductId: null // No valid iiko product ID - triggers fallback
            }
        ],
        total: 55.00,
        deliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        deliveryType: 'tomorrow'
    };

    try {
        console.log('📤 Sending test order to http://localhost:3000/api/iiko/create-order\n');
        
        const response = await axios.post(
            'http://localhost:3000/api/iiko/create-order',
            testOrder,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ Response received:\n');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.fallbackMode) {
            console.log('\n🎉 FALLBACK MODE ACTIVATED!');
            console.log('   Order ID:', response.data.orderId);
            console.log('   Message:', response.data.message);
            console.log('   Warning:', response.data.warning);
            console.log('\n✅ Check the server CMD window - you should see full order details logged there!');
        } else {
            console.log('\n⚠️  Normal mode activated (not fallback)');
        }

    } catch (error) {
        console.error('\n❌ Error sending order:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused - is the server running on port 3000?');
        } else {
            console.error(error.message);
        }
    }
}

testFallbackMode();
