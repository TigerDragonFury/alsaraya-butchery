# Stripe Payment Integration Guide

## Overview
Al Saraya Butchery now supports online payments via Stripe. Customers can choose between:
- **Cash on Delivery (COD)** - Pay when order is delivered
- **Pay Online (Card)** - Pay immediately with credit/debit card

## Test Mode Configuration

### Current Setup
- **Mode**: Test Mode (localhost development)
- **Publishable Key**: `pk_test_51Sq1jrFIlDRZOBimK3bBzcBsFLMr7zVE8dBR5WDfIFWdJL2zcP6Zg5WRe3LXI0B4lIcU2y8yiKl4Z6WGcmZ8bUTZ00TGKwF1cw`
- **Secret Key**: `sk_test_51Sq1jrFIlDRZOBim...` (stored in server/.env)
- **Currency**: AED (UAE Dirham)
- **Test Card**: 4242 4242 4242 4242

## Database Changes Required

### SQL Migration
Run the following SQL in your Supabase SQL Editor to add payment tracking columns:

```sql
-- Execute: add-payment-columns.sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

UPDATE orders SET payment_method = 'cod' WHERE payment_method IS NULL;
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;
```

## Testing Instructions

### Step 1: Start the Server
```bash
cd server
node server.js
```
Server should be running on `http://localhost:3000`

### Step 2: Test Stripe Configuration
Open `test-stripe-payment.html` in your browser:
1. The page should load without errors
2. Card input field should appear
3. Try processing a test payment with:
   - **Card**: 4242 4242 4242 4242
   - **Expiry**: Any future date (12/25)
   - **CVC**: Any 3 digits (123)
   - **Amount**: 50.00 AED

### Step 3: Test Checkout Flow
1. Go to `shop.html`
2. Add items to cart
3. Go to checkout
4. Fill in customer details:
   - Name: Test Customer
   - Mobile: 971501234567
   - Email: test@example.com
   - Address: Dubai, UAE

5. **Test Cash on Delivery**:
   - Payment Method: Cash on Delivery
   - Place Order
   - Should work as before

6. **Test Card Payment**:
   - Payment Method: Pay Online (Card)
   - Enter test card: 4242 4242 4242 4242
   - Expiry: 12/25, CVC: 123
   - Place Order
   - Payment should process
   - Order should be created

## Payment Flow

### Customer Flow
1. Customer adds items to cart
2. Goes to checkout
3. Enters delivery details
4. Selects payment method:
   - **COD**: Direct to order placement
   - **Card**: Stripe payment form appears
5. If card selected:
   - Enters card details
   - Clicks "Place Order"
   - Payment processes
   - On success: Order submitted to iiko
   - On failure: Error shown, order not placed

### Backend Flow
1. **Payment Intent Creation**:
   ```
   POST /api/stripe/create-payment-intent
   {
     amount: 55.00,
     customerName: "John Doe",
     customerEmail: "john@example.com"
   }
   Returns: { clientSecret, paymentIntentId }
   ```

2. **Payment Confirmation**:
   - Frontend confirms payment with Stripe.js
   - Stripe processes card
   - Returns payment intent status

3. **Order Creation**:
   - Order saved to Supabase with payment info
   - Order sent to iiko/Syrve POS
   - WhatsApp notification sent

### Database Schema
```
orders table:
- payment_method: 'cod' | 'card'
- payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
- payment_intent_id: Stripe PaymentIntent ID (e.g., pi_3AbCdEfGhIjKlMnO)
```

## Stripe Dashboard

### Accessing Test Payments
1. Go to: https://dashboard.stripe.com/test/payments
2. Login with your Stripe account
3. View all test payments
4. Click on payment to see details:
   - Amount
   - Customer
   - Card details
   - Status
   - Logs

## Test Cards

### Successful Payments
- **4242 4242 4242 4242** - Always succeeds
- **5555 5555 5555 4444** - Mastercard success

### Failed Payments (for testing error handling)
- **4000 0000 0000 0002** - Card declined
- **4000 0000 0000 9995** - Insufficient funds
- **4000 0000 0000 0069** - Charge expired
- **4000 0000 0000 0127** - Incorrect CVC

### Testing 3D Secure
- **4000 0025 0000 3155** - Requires 3D Secure authentication

## Error Handling

### Payment Errors
The system handles these scenarios:
1. **Card Declined**: Error message shown, order not placed
2. **Network Error**: Retry prompt shown
3. **Server Error**: Fallback to manual processing
4. **Insufficient Funds**: Clear error message
5. **Invalid Card**: Real-time validation

### Order Errors
- Payment succeeds but order fails: Manual review needed
- Check Stripe dashboard for successful payments
- Check Supabase for order creation
- Manually create order in iiko if needed

## Going Live (Production)

### When Ready for Production:
1. **Get Live Stripe Keys**:
   - Go to: https://dashboard.stripe.com/apikeys
   - Switch to "Live mode"
   - Copy Publishable Key and Secret Key

2. **Update server/.env**:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   ```

3. **Update checkout.html**:
   - Remove test mode notice
   - Remove test card examples

4. **Testing Checklist**:
   - [ ] Test with real card (small amount)
   - [ ] Verify payment appears in Stripe
   - [ ] Verify order created in database
   - [ ] Verify order sent to iiko
   - [ ] Verify WhatsApp notification sent
   - [ ] Test refund process
   - [ ] Test order cancellation

5. **Security Checklist**:
   - [ ] HTTPS enabled on production domain
   - [ ] Environment variables secured
   - [ ] Stripe webhook configured (optional)
   - [ ] Error logging enabled
   - [ ] Payment receipts configured

## WhatsApp Notification Format

### Cash on Delivery
```
*New Order from Al Saraya Butchery*

*Order ID:* 45
*Customer:* John Doe
*Mobile:* 971501234567
*Email:* john@example.com
*Address:* Dubai, UAE
*Delivery Time:* Mon, Jan 20, 02:00 PM
*Payment Method:* 💵 Cash on Delivery

*Order Items:*
- Ribeye Steak x 2 @ $15.00 = $30.00
- Ground Beef x 1 @ $12.00 = $12.00

*Subtotal:* $42.00
*Delivery Fee:* $5.00
*Total:* $47.00
```

### Card Payment
```
*New Order from Al Saraya Butchery*

*Order ID:* 46
*Customer:* Jane Smith
*Mobile:* 971502345678
*Email:* jane@example.com
*Address:* Abu Dhabi, UAE
*Delivery Time:* Mon, Jan 20, 03:00 PM
*Payment Method:* 💳 Card (Paid Online)
*Payment Ref:* pi_3AbCdEfGhIjKlMn...

*Order Items:*
- Lamb Chops x 3 @ $18.00 = $54.00

*Subtotal:* $54.00
*Delivery Fee:* $5.00
*Total:* $59.00
```

## Troubleshooting

### "Stripe is not defined"
- Check if Stripe.js script is loaded: `<script src="https://js.stripe.com/v3/"></script>`
- Check browser console for errors
- Ensure script loads before initializeStripe() is called

### "Failed to fetch publishable key"
- Server not running: `node server.js`
- Check server/.env has STRIPE_PUBLISHABLE_KEY
- Check port 3000 is accessible
- Check CORS is enabled

### "Payment intent creation failed"
- Check server/.env has STRIPE_SECRET_KEY
- Check Stripe SDK installed: `npm install stripe`
- Check server logs for errors
- Verify Stripe account is active

### Payment succeeds but order not created
- Check Supabase credentials in checkout.html
- Check database columns exist (run migration)
- Check browser console for errors
- Check network tab for failed requests

### Order created but not sent to iiko
- Check server is running
- Check fallback mode is working
- Check iiko credentials in server/.env
- Products may not be configured (fallback mode active)

## Files Modified

### Backend (server/)
- `server.js` - Added Stripe endpoints
- `.env` - Added Stripe keys
- `package.json` - Added stripe dependency

### Frontend
- `checkout.html` - Payment UI and integration
- `iiko-integration.js` - Payment method handling
- `app.js` - Cart with iiko_product_id
- `shop.html` - Pass iiko_product_id

### Database
- `add-payment-columns.sql` - Migration script
- `supabase-schema.sql` - Original schema

### Testing
- `test-stripe-payment.html` - Standalone payment test

## Support

### Stripe Documentation
- Dashboard: https://dashboard.stripe.com
- API Docs: https://stripe.com/docs/api
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

### Next Steps
1. Run SQL migration in Supabase
2. Test payment flow end-to-end
3. Configure products in Syrve Back Office
4. Monitor test transactions
5. Plan go-live date
