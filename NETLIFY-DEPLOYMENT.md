# Deploy to Netlify (FREE) 🚀

## Step 1: Install Netlify CLI (Optional, for local testing)
```bash
npm install -g netlify-cli
```

## Step 2: Create Netlify Account
1. Go to https://www.netlify.com/
2. Sign up with GitHub (recommended) or email
3. Click "Add new site" → "Import an existing project"

## Step 3: Connect GitHub Repository

### Option A: Deploy via GitHub (Recommended)
1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/alsaraya.git
   git push -u origin main
   ```

2. In Netlify dashboard:
   - Click "Import from Git"
   - Choose GitHub
   - Select your repository
   - Build settings:
     - **Build command:** (leave empty)
     - **Publish directory:** `.`
   - Click "Deploy site"

### Option B: Drag & Drop (Quick Test)
1. In Netlify dashboard, drag & drop your entire project folder
2. Site will be live immediately at: `random-name.netlify.app`

## Step 4: Configure Environment Variables
1. In Netlify dashboard → Site settings → Environment variables
2. Add these variables:
   - **Key:** `STRIPE_SECRET_KEY`
     **Value:** `sk_test_51Sq1jrFIlDRZOBim...` (your test key)
   
   - **Key:** `STRIPE_PUBLISHABLE_KEY`
     **Value:** `pk_test_51Sq1jrFIlDRZOBim...` (your test key)

3. Click "Save"

## Step 5: Redeploy
- Go to "Deploys" tab
- Click "Trigger deploy" → "Clear cache and deploy site"

## Step 6: Test Your Site
Your site will be live at: `https://your-site-name.netlify.app`

Test payment with:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## Step 7: Add Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `alsaraya.com`)
4. Update DNS at your domain registrar:
   - Add CNAME record: `www` → `your-site.netlify.app`
   - Add A record: `@` → Netlify IP addresses (provided)

## Production Checklist

### Before Going Live:
1. ✅ Replace test Stripe keys with live keys in environment variables
2. ✅ Test all payment flows thoroughly
3. ✅ Update Supabase RLS policies if needed
4. ✅ Add custom domain
5. ✅ Enable HTTPS (automatic with Netlify)
6. ✅ Test iiko POS integration
7. ✅ Update WhatsApp number if needed

### Stripe Live Keys:
- Get from: https://dashboard.stripe.com/apikeys
- Replace in Netlify environment variables
- **NEVER commit live keys to Git!**

## Local Testing with Netlify Dev
```bash
# Install dependencies for functions
cd netlify/functions
npm install
cd ../..

# Run Netlify dev server
netlify dev
```

This will run your site locally with serverless functions at `http://localhost:8888`

## Troubleshooting

### Functions not working?
- Check environment variables are set in Netlify
- Check function logs in Netlify dashboard → Functions tab
- Verify `netlify.toml` is in root directory

### Payment failing?
- Verify Stripe keys are correct in environment variables
- Check browser console for errors
- Verify `/api/stripe/config` endpoint returns publishable key

### Database errors?
- Verify Supabase RLS policies allow inserts
- Check Supabase URL and keys in frontend files

## Cost Breakdown
- **Netlify:** FREE (100GB bandwidth/month)
- **Supabase:** FREE (500MB database, 2GB bandwidth)
- **Stripe:** 2.9% + $0.30 per transaction
- **Domain:** ~$10-15/year

**Total monthly cost: $0** (just transaction fees!)

## Support
- Netlify Docs: https://docs.netlify.com/
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Community: https://answers.netlify.com/
