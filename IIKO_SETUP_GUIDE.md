# iiko POS Integration Setup Guide

## 📋 Overview
This guide will help you integrate your Al Saraya Butchery website with iiko POS system so that online orders automatically appear in your POS terminal.

---

## 🔑 Step 1: Get iiko API Credentials

1. **Contact iiko Support**
   - Email: support@iiko.com
   - Or contact your iiko account manager
   - Request API access for your organization

2. **You will need:**
   - ✅ Organization ID
   - ✅ API Login
   - ✅ API Key/Password
   - ✅ Terminal Group ID (for the location receiving orders)
   - ✅ API Base URL (e.g., `https://api-ru.iiko.services` for Russia)

3. **Save credentials securely** - you'll need them in Step 3

---

## 🗄️ Step 2: Update Supabase Database

Add iiko-related columns to your `orders` table:

```sql
-- Add iiko columns to orders table
ALTER TABLE orders 
ADD COLUMN iiko_order_id TEXT,
ADD COLUMN iiko_sync_status TEXT DEFAULT 'pending',
ADD COLUMN iiko_sync_error TEXT;

-- Create index for faster lookups
CREATE INDEX idx_orders_iiko_order_id ON orders(iiko_order_id);
CREATE INDEX idx_orders_iiko_sync_status ON orders(iiko_sync_status);
```

Run this SQL in your Supabase SQL Editor.

---

## 🖥️ Step 3: Setup Backend Server

### 3.1 Install Node.js
- Download from: https://nodejs.org/
- Install LTS version (Long Term Support)

### 3.2 Setup Server Files

1. **Navigate to server directory:**
```powershell
cd C:\Users\Exceed\Desktop\AlSaraya\server
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Create .env file:**
Copy `.env.example` to `.env` and fill in your credentials:

```env
# iiko POS Configuration
IIKO_API_URL=https://api-ru.iiko.services
IIKO_ORG_ID=your-actual-organization-id
IIKO_API_LOGIN=your-actual-api-login
IIKO_API_KEY=your-actual-api-key
IIKO_TERMINAL_ID=your-actual-terminal-id

# Server Configuration
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

### 3.3 Test the Server

1. **Start the server:**
```powershell
npm start
```

2. **Test iiko connection:**
Open browser and go to: `http://localhost:3000/api/iiko/test`

You should see:
```json
{
  "success": true,
  "message": "Successfully connected to iiko API",
  "hasToken": true
}
```

---

## 🔗 Step 4: Map Products to iiko

You need to match your website products with iiko menu items.

### Option A: Manual Mapping (Simple)

Add `iiko_product_id` column to your products table:

```sql
ALTER TABLE products 
ADD COLUMN iiko_product_id TEXT;
```

Then update each product with its iiko ID:

```sql
UPDATE products 
SET iiko_product_id = 'iiko-id-here' 
WHERE id = your-product-id;
```

### Option B: Automatic Sync (Advanced)

1. Get iiko menu:
```
GET http://localhost:3000/api/iiko/menu
```

2. Create a mapping script to match products by name
3. Store iiko IDs in your database

---

## 🚀 Step 5: Deploy to Production

### 5.1 Update Frontend Configuration

In `iiko-integration.js`, change server URL:

```javascript
// For production
const IIKO_SERVER_URL = 'https://your-domain.com';
```

### 5.2 Deploy Backend Server

**Option A: Deploy on VPS/Cloud Server**
- Upload server folder to your hosting
- Install Node.js on server
- Run: `npm install`
- Use PM2 to keep server running:
```bash
npm install -g pm2
pm2 start server.js --name iiko-integration
pm2 save
pm2 startup
```

**Option B: Deploy on Heroku (Free Tier Available)**
1. Create Heroku account
2. Install Heroku CLI
3. Run:
```bash
heroku create alsaraya-iiko
git add .
git commit -m "iiko integration"
git push heroku main
```
4. Set environment variables in Heroku dashboard

**Option C: Deploy on Vercel/Railway**
- Similar to Heroku but with easier setup
- Import GitHub repository
- Add environment variables
- Deploy

---

## ✅ Step 6: Testing

### 6.1 Test Order Flow

1. **Add items to cart** on your website
2. **Go to checkout**
3. **Fill in customer details**
4. **Place order**
5. **Check:**
   - ✅ Order appears in iiko POS terminal
   - ✅ Order saved in Supabase with `iiko_order_id`
   - ✅ `iiko_sync_status` = 'synced'

### 6.2 Test Error Handling

1. **Stop iiko server** (simulate connection failure)
2. **Place an order**
3. **Verify:**
   - ✅ Order still completes
   - ✅ Customer gets confirmation
   - ✅ `iiko_sync_status` = 'failed'
   - ✅ Staff notification sent

---

## 🔧 Step 7: Monitoring & Maintenance

### 7.1 Monitor Failed Syncs

Create admin view to see failed syncs:

```sql
SELECT id, customer_name, customer_mobile, total_amount, iiko_sync_error
FROM orders
WHERE iiko_sync_status = 'failed'
ORDER BY created_at DESC;
```

### 7.2 Retry Failed Orders

Create retry button in admin panel that calls:
```javascript
await iikoIntegration.sendOrder(orderData);
```

### 7.3 Server Monitoring

Use tools like:
- **UptimeRobot** - Monitor server availability
- **PM2 Monitor** - Check server health
- **CloudWatch/Datadog** - Advanced monitoring

---

## 📞 Troubleshooting

### Problem: "Failed to authenticate with iiko API"
**Solution:** Check your API credentials in `.env` file

### Problem: "Order created but not in iiko"
**Solutions:**
1. Check server logs: `pm2 logs`
2. Verify terminal ID is correct
3. Test API connection: `/api/iiko/test`

### Problem: "Product ID not found in iiko"
**Solution:** Complete product mapping (Step 4)

### Problem: Server not running
**Solution:**
```bash
pm2 restart iiko-integration
pm2 logs
```

---

## 📚 Additional Resources

- **iiko API Documentation:** https://api-ru.iiko.services/
- **iiko Support:** support@iiko.com
- **Server Repository:** Your GitHub repo
- **Support Contact:** your-email@example.com

---

## 🔐 Security Notes

1. **Never commit `.env` file** to Git
2. **Use HTTPS** in production
3. **Enable CORS** only for your domain
4. **Rotate API keys** periodically
5. **Monitor API usage** to detect issues

---

## 📊 Features Included

✅ Real-time order sync to iiko POS
✅ Automatic error handling
✅ Failed sync tracking
✅ Product mapping support
✅ Customer information transfer
✅ Order items with quantities
✅ Delivery information
✅ Payment method tracking
✅ Order notes/comments

---

## 🎯 Next Steps

1. [ ] Get iiko API credentials
2. [ ] Update Supabase database
3. [ ] Configure backend server
4. [ ] Test connection
5. [ ] Map products
6. [ ] Deploy to production
7. [ ] Test end-to-end
8. [ ] Train staff
9. [ ] Go live! 🚀

---

**Need Help?** Contact iiko support or your development team.
