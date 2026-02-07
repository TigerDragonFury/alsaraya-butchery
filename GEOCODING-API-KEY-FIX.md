# Geocoding API - REQUEST_DENIED Fix

## Problem
You've enabled the Geocoding API, but still getting `REQUEST_DENIED` errors and seeing coordinates instead of street addresses.

## Root Cause
The Geocoding API is enabled in your project, BUT your **API key** doesn't have permission to use it. This is usually due to **API Key Restrictions**.

## Solution - Check Your API Key Settings

### Step 1: Go to API Credentials
1. Visit: https://console.cloud.google.com/google/maps-apis/credentials
2. Find your API key: `AIzaSyAqs6k9yZisdszgk-eUYZIryRyRSEgVR6M`
3. Click on the key name to edit

### Step 2: Check API Restrictions
Look for **"API restrictions"** section:

**Option A: None (Recommended for testing)**
- Select: **"Don't restrict key"**
- This allows the key to access ALL Google APIs
- ✅ Best for development/testing

**Option B: Restrict key (More secure)**
- Select: **"Restrict key"**
- Under "Select APIs", make sure these are ALL checked:
  - ✅ Places API
  - ✅ Maps JavaScript API
  - ✅ **Geocoding API** ← THIS ONE IS CRITICAL
  - ✅ Geolocation API (optional)

### Step 3: Check Website Restrictions
Look for **"Website restrictions"** section:

**For Production (alsaraya-butchery.vercel.app):**
- ✅ `alsaraya-butchery.vercel.app/*`
- ✅ `*.alsaraya-butchery.vercel.app/*`

**For Local Testing:**
- ✅ `localhost/*`
- ✅ `127.0.0.1/*`

### Step 4: Check Billing
**IMPORTANT**: Geocoding API requires billing to be enabled!

1. Go to: https://console.cloud.google.com/billing
2. Make sure a billing account is linked to your project
3. Even with free tier, billing MUST be enabled
4. Don't worry - you get $200 free credit per month!

### Step 5: Wait & Test
1. Click **"SAVE"** after making changes
2. Wait 2-5 minutes for changes to propagate
3. Clear your browser cache (Ctrl + Shift + Delete)
4. Refresh your website
5. Click "Use My Location" on the map
6. Check browser console (F12) for detailed error messages

## Expected Results After Fix

✅ **Before Fix:**
```
Lat: 25.204800, Lng: 55.270800 (API Key Error)
```

✅ **After Fix:**
```
Sheikh Mohammed bin Rashid Blvd, Dubai, UAE
```

## Common Mistakes

❌ **Enabled API but didn't add it to key restrictions**
- If you have "Restrict key" selected, you MUST add Geocoding API to the list

❌ **Billing not enabled**
- Geocoding API requires billing even for free tier usage

❌ **Wrong referrer restrictions**
- Make sure your domain is added: `alsaraya-butchery.vercel.app/*`

❌ **Didn't wait for changes to propagate**
- API key changes can take 2-5 minutes to take effect

## Debug in Browser Console

Refresh your page and open Browser Console (F12 → Console tab). You should see detailed error messages:

```javascript
🚨 Geocoding API ERROR: REQUEST_DENIED
This usually means:
1. Your API key has HTTP referrer restrictions
2. Geocoding API is not enabled for THIS specific API key
3. Billing is not enabled on your Google Cloud project

Check: https://console.cloud.google.com/google/maps-apis/credentials
```

## Still Not Working?

If you've done all the above and it still doesn't work:

1. **Create a NEW API Key:**
   - Go to: https://console.cloud.google.com/google/maps-apis/credentials
   - Click "CREATE CREDENTIALS" → "API key"
   - Set: **"Don't restrict key"** (for testing)
   - Copy the new key
   - Replace on lines 23 in `profile.html` and `checkout.html`

2. **Check Project Billing Status:**
   - Some APIs won't work without billing enabled
   - You must add a payment method (won't be charged if under free tier)

3. **Check Browser Console:**
   - Open F12 → Console
   - Look for exact error messages
   - Share those with support if needed

## Quick Test
1. Open: https://alsaraya-butchery.vercel.app/checkout.html
2. Open Browser Console (F12)
3. Click "Use My Location" on map
4. Check console for: `Geocoding status: OK` ✅
5. Address should show street name, not coordinates

Good luck! 🚀
