# Stripe Integration - Quick Start Checklist

## ✅ Completed Setup

### Backend Configuration
- [x] Stripe SDK installed (`npm install stripe`)
- [x] Environment variables configured (`.env`)
  - STRIPE_PUBLISHABLE_KEY
  - STRIPE_SECRET_KEY
- [x] Server endpoints created:
  - GET `/api/stripe/config` - Returns publishable key
  - POST `/api/stripe/create-payment-intent` - Creates payment
  - POST `/api/stripe/verify-payment` - Verifies payment status

### Frontend Integration
- [x] Stripe.js library added to checkout.html
- [x] Payment method selector (COD / Card)
- [x] Stripe card element created and styled
- [x] Payment processing functions:
  - `initializeStripe()` - Initialize Stripe
  - `togglePaymentFields()` - Show/hide card fields
  - `processStripePayment()` - Process payment
- [x] Payment integration in `placeOrder()` function
- [x] WhatsApp notification includes payment info
- [x] Test mode notice for customers

### Database Changes
- [x] Migration script created (`add-payment-columns.sql`)
- [ ] **PENDING**: Run migration in Supabase SQL Editor

### Testing Tools
- [x] Standalone test page (`test-stripe-payment.html`)
- [x] Test cards documented
- [x] Integration guide created

## 🔄 Next Steps

### 1. Database Migration (REQUIRED)
**Action**: Run `add-payment-columns.sql` in Supabase SQL Editor

```sql
-- Copy and execute this in Supabase:
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
```

**How to run**:
1. Go to https://supabase.com/dashboard
2. Select your project (volqsrawddjdvykbgqgr)
3. Click "SQL Editor" in left menu
4. Click "New Query"
5. Paste the SQL from `add-payment-columns.sql`
6. Click "Run"

### 2. Test Stripe Integration

**Test Payment Endpoint**:
```bash
# Start server first
cd server
node server.js

# Open in browser:
http://localhost:3000/test-stripe-payment.html
```

**Test Card**: 4242 4242 4242 4242
- Expiry: Any future date (12/25)
- CVC: Any 3 digits (123)
- Should show "Payment Successful! 🎉"

### 3. Test Full Checkout Flow

**Step-by-step**:
1. Open `shop.html`
2. Add items to cart (e.g., Ribeye Steak)
3. Click "Proceed to Checkout"
4. Fill customer details:
   - Name: Test Customer
   - Mobile: 971501234567
   - Email: test@example.com
   - Address: Dubai, UAE
5. Select delivery time (ASAP)
6. **Test COD first**:
   - Payment Method: Cash on Delivery
   - Place Order
   - ✅ Should create order successfully
7. **Test Card Payment**:
   - Add items again
   - Checkout again
   - Payment Method: Pay Online (Card)
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25, CVC: 123
   - Place Order
   - ✅ Should process payment then create order

### 4. Verify in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/payments
2. Should see test payment with customer details
3. Click payment to see:
   - Amount (AED)
   - Customer name
   - Card ending in 4242
   - Status: Succeeded

### 5. Verify in Supabase
1. Go to Supabase Dashboard
2. Table Editor → orders
3. Find recent order
4. Check columns:
   - `payment_method`: "card"
   - `payment_status`: "succeeded"
   - `payment_intent_id`: "pi_3..."

## 🧪 Test Scenarios

### Successful Payment
- **Card**: 4242 4242 4242 4242
- **Expected**: Payment succeeds, order created

### Declined Card
- **Card**: 4000 0000 0000 0002
- **Expected**: Error message, order NOT created

### Insufficient Funds
- **Card**: 4000 0000 0000 9995
- **Expected**: Clear error message

### Missing Card Details
- **Test**: Click "Place Order" without entering card
- **Expected**: Validation error from Stripe

## 📊 Monitoring

### During Testing, Check:
- [ ] Browser console (F12) for errors
- [ ] Network tab for API calls
- [ ] Server terminal for logs
- [ ] Stripe dashboard for payments
- [ ] Supabase for order creation
- [ ] WhatsApp for notifications

### Expected Console Logs:
```
✅ Stripe initialized successfully
🔄 Creating payment intent...
✅ Payment intent created: pi_3AbCdEfGhIjKlMnO
🔄 Confirming payment...
✅ Payment confirmed: pi_3AbCdEfGhIjKlMnO
🔄 Verifying payment...
✅ Payment verified: { status: 'succeeded' }
Sending order to iiko POS...
✅ Order successfully sent to iiko POS: <guid>
```

## 🚨 Common Issues

### Issue: "Stripe is not defined"
**Fix**: Check Stripe.js script is loaded in checkout.html head section

### Issue: "Failed to fetch publishable key"
**Fix**: 
- Ensure server is running: `node server.js`
- Check server/.env has STRIPE_PUBLISHABLE_KEY

### Issue: Payment succeeds but order fails
**Check**:
1. Database migration completed?
2. Supabase credentials correct?
3. Browser console errors?

### Issue: "payment_method column doesn't exist"
**Fix**: Run the database migration SQL in Supabase

## 🎯 Success Criteria

Your integration is working when:
- [x] Test payment page processes payment successfully
- [ ] Checkout with COD works (existing functionality)
- [ ] Checkout with Card processes payment
- [ ] Payment appears in Stripe dashboard
- [ ] Order saved to Supabase with payment info
- [ ] Order sent to iiko/Syrve (or fallback mode)
- [ ] WhatsApp message shows payment method
- [ ] Declined cards show proper errors
- [ ] No console errors

## 📝 Going Live Checklist

Before switching to live mode:
- [ ] Test all payment scenarios
- [ ] Test refund process
- [ ] Get live Stripe keys
- [ ] Update .env with live keys
- [ ] Remove test card notices from UI
- [ ] Enable HTTPS on production domain
- [ ] Configure Stripe webhooks (optional)
- [ ] Set up payment alerts
- [ ] Document refund procedures
- [ ] Train staff on payment handling

## 🔗 Resources

- **Stripe Integration Guide**: STRIPE-INTEGRATION-GUIDE.md
- **Test Page**: test-stripe-payment.html
- **Migration SQL**: add-payment-columns.sql
- **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
- **Stripe Test Cards**: https://stripe.com/docs/testing

## 📞 Next Action

**IMMEDIATE**: Run database migration in Supabase
**THEN**: Test payment flow end-to-end
**FINALLY**: Monitor first real transactions

---

**Current Status**: ✅ Code complete, awaiting database migration and testing
