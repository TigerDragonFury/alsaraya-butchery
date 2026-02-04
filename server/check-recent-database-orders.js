require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentOrders() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║     Recent Orders - Al Saraya Database      ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        // Fetch orders from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', oneDayAgo)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            console.log('⚠️  No orders found in the last 24 hours\n');
            return;
        }

        console.log(`📊 Found ${orders.length} order(s) in the last 24 hours\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            
            console.log(`Order #${i + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📋 Order ID: ${order.id}`);
            console.log(`📅 Created: ${new Date(order.created_at).toLocaleString()}`);
            console.log(`👤 Customer: ${order.customer_name}`);
            console.log(`📞 Phone: ${order.mobile_number}`);
            console.log(`📍 Address: ${order.delivery_address}`);
            console.log(`💰 Total: $${order.total_amount}`);
            console.log(`📦 Status: ${order.status}`);
            
            if (order.iiko_order_id) {
                console.log(`🔗 iiko Order ID: ${order.iiko_order_id}`);
            }
            
            if (order.iiko_sync_status) {
                console.log(`🔄 iiko Sync: ${order.iiko_sync_status}`);
            }
            
            if (order.iiko_sync_error) {
                console.log(`⚠️  Sync Error: ${order.iiko_sync_error}`);
            }
            
            if (order.delivery_time) {
                console.log(`🕐 Delivery Time: ${new Date(order.delivery_time).toLocaleString()}`);
            }
            
            if (order.notes) {
                console.log(`📝 Notes: ${order.notes}`);
            }

            // Fetch order items
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);

            if (!itemsError && items && items.length > 0) {
                console.log(`\n🛒 Items (${items.length}):`);
                items.forEach(item => {
                    console.log(`   • ${item.product_name} x${item.quantity} - $${item.total_price.toFixed(2)}`);
                    console.log(`     Category: ${item.product_category}, Unit Price: $${item.unit_price.toFixed(2)}`);
                });
            }
            
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        // Show fallback orders specifically
        const fallbackOrders = orders.filter(o => o.iiko_sync_status === 'fallback');
        if (fallbackOrders.length > 0) {
            console.log('\n⚠️  FALLBACK MODE ORDERS (Need Manual iiko Entry)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log(`${fallbackOrders.length} order(s) waiting for manual POS entry\n`);
        }

    } catch (error) {
        console.error('\n❌ Error fetching orders:');
        console.error(error.message);
    }
}

checkRecentOrders();
