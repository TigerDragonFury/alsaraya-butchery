# How to Enable Google Maps Geocoding API

## Current Status
The Google Maps is working and displaying correctly, but the **Geocoding API** is not enabled. This causes console warnings but doesn't break functionality.

## What is Geocoding API?
The Geocoding API converts coordinates (latitude/longitude) to human-readable addresses. When users drag the map marker, we use this API to automatically fill the address field.

## How to Enable It

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Select Your Project**
   - Make sure you're in the correct project (the one with API key: AIzaSyAqs6k9yZisdszgk-eUYZIryRyRSEgVR6M)

3. **Enable Geocoding API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Geocoding API"
   - Click on "Geocoding API"
   - Click the blue "ENABLE" button

4. **Verify It Works**
   - After enabling, wait 1-2 minutes
   - Refresh your website
   - Drag the map marker - the address should auto-fill
   - No more console errors!

## Current Workaround
Even without the Geocoding API enabled:
- ✅ Map displays correctly
- ✅ Users can drag the marker
- ✅ Users can click "Use My Location" button
- ✅ Users can select from saved addresses
- ✅ Users can manually type/edit the address
- ❌ Address doesn't auto-fill when dragging marker (shows coordinates instead)

## Cost
The Geocoding API is FREE for:
- First 40,000 requests per month
- You're unlikely to exceed this for a food delivery site

After enabling, everything will work perfectly!
