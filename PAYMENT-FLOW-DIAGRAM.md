# Stripe Payment Flow Diagram

## Complete Payment Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER JOURNEY                            │
└─────────────────────────────────────────────────────────────────────┘

1. SHOP PAGE (shop.html)
   │
   ├── Browse Products
   ├── Add to Cart (with iiko_product_id)
   └── Click "Proceed to Checkout"
       │
       ▼

2. CHECKOUT PAGE (checkout.html)
   │
   ├── Fill Customer Details
   │   ├── Name
   │   ├── Mobile
   │   ├── Email
   │   └── Address
   │
   ├── Select Delivery Time
   │   ├── ASAP (4 hours)
   │   ├── Today (5 hours / 7PM)
   │   ├── Tomorrow (noon)
   │   └── Custom (date picker)
   │
   ├── SELECT PAYMENT METHOD
   │   │
   │   ├─────────────────────┬────────────────────────┐
   │   │                     │                        │
   │   ▼                     ▼                        ▼
   │  
   │  COD                  CARD                     (future)
   │  (Skip payment)       (Process Stripe)         (Other)
   │   │                     │
   │   │                     ▼
   │   │           ┌─────────────────────┐
   │   │           │  STRIPE PAYMENT     │
   │   │           │  PROCESSING         │
   │   │           └─────────────────────┘
   │   │                     │
   │   │           ┌─────────┴─────────┐
   │   │           │                   │
   │   │           ▼                   ▼
   │   │        SUCCESS             FAILURE
   │   │           │                   │
   │   │           │                   └─── Show Error
   │   │           │                         Stop Process
   │   │           ▼
   │   │      Save paymentIntentId
   │   │           │
   │   └───────────┴──────────────────────┐
   │                                      │
   └──────────────────────────────────────┘
                     │
                     ▼

3. ORDER CREATION
   │
   ├── Save to Supabase Database
   │   ├── Customer info
   │   ├── Order items
   │   ├── Total amount
   │   ├── payment_method (cod/card)
   │   ├── payment_status (pending/succeeded)
   │   └── payment_intent_id (if card)
   │
   ├── Send to iiko/Syrve POS
   │   ├── Check product IDs
   │   ├── Format order data
   │   ├── Include payment info
   │   └── POST to iiko API
   │
   └── Send WhatsApp Notification
       ├── Order details
       ├── Payment method
       └── Payment reference (if card)
           │
           ▼

4. CONFIRMATION
   │
   ├── Clear cart
   ├── Show success message
   └── Redirect to tracking (optional)
```

## Stripe Payment Flow (Detail)

```
CUSTOMER                 FRONTEND              BACKEND (Node.js)       STRIPE API
  │                         │                         │                    │
  │  Click "Place Order"    │                         │                    │
  │────────────────────────>│                         │                    │
  │                         │                         │                    │
  │                         │  Check payment method   │                    │
  │                         │  IF card selected:      │                    │
  │                         │                         │                    │
  │                         │  1. Create Intent       │                    │
  │                         │────────────────────────>│                    │
  │                         │                         │                    │
  │                         │                         │  POST /v1/payment_intents
  │                         │                         │───────────────────>│
  │                         │                         │                    │
  │                         │                         │  { clientSecret }  │
  │                         │                         │<───────────────────│
  │                         │                         │                    │
  │                         │  { clientSecret }       │                    │
  │                         │<────────────────────────│                    │
  │                         │                         │                    │
  │                         │  2. Confirm Payment     │                    │
  │                         │  (with card details)    │                    │
  │                         │─────────────────────────────────────────────>│
  │                         │                         │                    │
  │                         │                         │    Process card    │
  │                         │                         │    Validate CVC    │
  │                         │                         │    Check balance   │
  │                         │                         │                    │
  │                         │  { paymentIntent }      │                    │
  │                         │<─────────────────────────────────────────────│
  │                         │                         │                    │
  │                         │  3. Verify Status       │                    │
  │                         │────────────────────────>│                    │
  │                         │                         │                    │
  │                         │                         │  GET /v1/payment_intents/:id
  │                         │                         │───────────────────>│
  │                         │                         │                    │
  │                         │                         │  { status: "succeeded" }
  │                         │                         │<───────────────────│
  │                         │                         │                    │
  │                         │  { verified }           │                    │
  │                         │<────────────────────────│                    │
  │                         │                         │                    │
  │                         │  4. Create Order        │                    │
  │                         │  (with payment info)    │                    │
  │                         │                         │                    │
  │  Order Confirmed        │                         │                    │
  │<────────────────────────│                         │                    │
  │                         │                         │                    │
```

## Payment Status States

```
┌──────────────┐
│   PENDING    │ ← Initial state (COD or before payment)
└──────┬───────┘
       │
       ├─── Card Payment Selected
       │
       ▼
┌──────────────┐
│  PROCESSING  │ ← Stripe processing card
└──────┬───────┘
       │
       ├────────┬──────────┐
       │        │          │
       ▼        ▼          ▼
┌──────────┐ ┌──────┐ ┌─────────┐
│SUCCEEDED │ │FAILED│ │REQUIRES │
│          │ │      │ │  ACTION │
└────┬─────┘ └───┬──┘ └────┬────┘
     │           │         │
     │           │         └─── 3D Secure, etc.
     │           │
     │           └─── Declined, Insufficient Funds, etc.
     │
     └─── Order Created Successfully
```

## Files Interaction Map

```
┌───────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  checkout.html                                                │
│  ├── Payment UI (dropdown, card element)                     │
│  ├── initializeStripe() ────────────────┐                    │
│  ├── togglePaymentFields()              │                    │
│  ├── processStripePayment() ────┐       │                    │
│  └── placeOrder() ──────────────┼───────┼──────┐            │
│                                  │       │      │            │
│  iiko-integration.js             │       │      │            │
│  ├── formatOrderForIiko()        │       │      │            │
│  └── sendOrder() ────────────────┼───────┼──────┼───────┐   │
│                                  │       │      │       │   │
│  app.js                          │       │      │       │   │
│  ├── Cart management             │       │      │       │   │
│  └── addToCartFromDB()           │       │      │       │   │
│                                  │       │      │       │   │
└──────────────────────────────────┼───────┼──────┼───────┼───┘
                                   │       │      │       │
                                   ▼       ▼      ▼       ▼
┌───────────────────────────────────────────────────────────────┐
│                         BACKEND                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  server/server.js                                             │
│  ├── GET /api/stripe/config ◄────────────────┘      │       │
│  ├── POST /api/stripe/create-payment-intent ◄───────┘       │
│  ├── POST /api/stripe/verify-payment                         │
│  ├── POST /api/iiko/create-order ◄──────────────────────────┘
│  └── Stripe SDK (const stripe = require('stripe')...)        │
│                                                               │
│  server/.env                                                  │
│  ├── STRIPE_PUBLISHABLE_KEY                                  │
│  ├── STRIPE_SECRET_KEY                                       │
│  ├── SUPABASE_URL                                            │
│  └── IIKO_API_TOKEN                                          │
│                                                               │
└───────────────────────────┬──────────────────┬────────────────┘
                            │                  │
                            ▼                  ▼
                    ┌────────────┐      ┌─────────────┐
                    │   STRIPE   │      │   SUPABASE  │
                    │    API     │      │  DATABASE   │
                    └────────────┘      └─────────────┘
                            │                  │
                            └──────┬───────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ iiko/Syrve  │
                            │     POS     │
                            └─────────────┘
```

## Data Flow

### Card Payment Request
```javascript
// 1. Frontend initiates payment
{
  amount: 55.00,
  customerName: "John Doe",
  customerEmail: "john@example.com"
}
    ↓
// 2. Backend creates intent
{
  clientSecret: "pi_3AbC_secret_XyZ",
  paymentIntentId: "pi_3AbCdEfGhIjKlMnO"
}
    ↓
// 3. Frontend confirms with card
{
  payment_method: {
    card: cardElement,
    billing_details: { name, email }
  }
}
    ↓
// 4. Stripe processes
{
  id: "pi_3AbCdEfGhIjKlMnO",
  status: "succeeded",
  amount: 5500, // cents
  currency: "aed"
}
    ↓
// 5. Save to database
{
  order_id: 45,
  payment_method: "card",
  payment_status: "succeeded",
  payment_intent_id: "pi_3AbCdEfGhIjKlMnO",
  total_amount: 55.00
}
```

### COD Request (No Payment Processing)
```javascript
// 1. Skip payment processing
payment_method: "cod"
    ↓
// 2. Direct to order creation
{
  order_id: 46,
  payment_method: "cod",
  payment_status: "pending",
  payment_intent_id: null,
  total_amount: 45.00
}
```

## Error Handling Flow

```
Payment Attempt
     │
     ├─── Card Declined
     │    ├── Show error: "Card was declined"
     │    ├── Keep cart
     │    └── Allow retry
     │
     ├─── Network Error
     │    ├── Show error: "Connection failed"
     │    └── Suggest retry
     │
     ├─── Server Error
     │    ├── Log error details
     │    ├── Show generic error
     │    └── Contact support
     │
     └─── Success but Order Fails
          ├── Payment succeeded in Stripe
          ├── Order creation failed
          ├── Log: paymentIntentId + error
          └── Manual review required
```

## Security Flow

```
┌─────────────┐
│   Browser   │
│  (checkout) │
└──────┬──────┘
       │
       │ HTTPS (production)
       │ localhost (development)
       │
       ▼
┌─────────────┐
│  Node.js    │
│  Server     │
└──────┬──────┘
       │
       │ TLS/SSL encrypted
       │ API key in .env (never exposed)
       │
       ▼
┌─────────────┐
│   Stripe    │
│     API     │
└─────────────┘

Card Details Flow:
- NEVER touch server
- Direct: Browser ──Stripe.js──> Stripe API
- Server only handles: clientSecret, paymentIntentId
- PCI compliance maintained
```

---

## Summary

### Key Points:
1. **Payment Method Selection**: Customer chooses COD or Card
2. **Card Processing**: 3-step process (intent → confirm → verify)
3. **Order Creation**: Always happens (with or without payment)
4. **Database**: Tracks payment method and status
5. **Security**: Card details never touch our server
6. **Fallback**: COD always available if payment fails

### Test Flow:
```
Test Payment → Test Checkout → Verify Stripe → Verify Database → Production
```
