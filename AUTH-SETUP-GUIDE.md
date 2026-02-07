# AL SARAYA AUTHENTICATION SETUP GUIDE

## 🔐 Complete Authentication System with Phone & Google Login

This guide will help you set up the complete authentication system including:
- ✅ Phone number authentication with OTP
- ✅ Google OAuth login
- ✅ User profiles
- ✅ Multiple addresses per user
- ✅ Guest checkout (optional login)

---

## 📋 STEP 1: Database Setup

### Run the SQL Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `auth-schema.sql`
4. Copy and paste the entire SQL code
5. Click **Run** to execute

This will create:
- `user_profiles` table
- `user_addresses` table
- `guest_orders` table
- All necessary RLS policies
- Triggers for automatic profile creation

---

## 📱 STEP 2: Enable Phone Authentication in Supabase

### Configure Phone Auth Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Phone** provider and click **Enable**
3. Choose your SMS provider (recommended options):
   - **Twilio** (most reliable)
   - **MessageBird**
   - **Vonage**

### Twilio Setup (Recommended):

1. Create account at [twilio.com](https://www.twilio.com)
2. Get your credentials:
   - Account SID
   - Auth Token
   - Phone Number (must be from Twilio)
3. In Supabase Phone settings, enter:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Phone Number
4. Click **Save**

### Test Phone Auth:

```javascript
// This is already in auth.js, just test it
await sendOTP('+971501234567');
```

---

## 🔑 STEP 3: Enable Google OAuth

### Configure Google Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. You'll need to create a Google OAuth app:

### Create Google OAuth App:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Configure OAuth consent screen (External)
6. Add authorized redirect URIs:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**

### Add Credentials to Supabase:

1. Back in Supabase Google provider settings
2. Paste:
   - **Client ID**
   - **Client Secret**
3. Click **Save**

---

## 🎨 STEP 4: Update Your HTML Files

### Add to ALL pages (index.html, shop.html, checkout.html, etc.):

1. **Add auth.js before closing `</body>` tag:**

```html
<!-- Before closing body tag -->
<script src="app.js"></script>
<script src="auth.js"></script>
</body>
```

2. **Add auth container in header (after cart button):**

```html
<div class="header-actions">
    <!-- Existing cart button -->
    <button class="cart-btn" id="cartBtn">
        <i class="fas fa-shopping-cart"></i>
        <span class="cart-count" id="cartCount">0</span>
    </button>
    
    <!-- NEW: Add this auth button container -->
    <div id="authBtnContainer">
        <button class="btn-auth" onclick="openAuthModal('login')">
            <i class="fas fa-user"></i> Login
        </button>
    </div>
    
    <!-- Existing mobile menu button -->
    <button class="mobile-menu-btn" id="mobileMenuBtn">
        ...
    </button>
</div>
```

3. **Add auth modals before closing `</body>` tag:**

Copy the entire content from `auth-components.html` and paste it before the closing `</body>` tag (after cart modal).

---

## 📝 STEP 5: Update Checkout Page for Guest/User Flow

### Modify checkout.html

The system already supports both logged-in and guest checkout. Add this logic:

```javascript
// Check if user is logged in
if (currentUser) {
    // Show saved addresses
    loadUserAddresses().then(addresses => {
        populateAddressDropdown(addresses);
    });
} else {
    // Show guest checkout form
    showGuestCheckoutForm();
}

// Save order with user_id or guest_data
async function submitOrder(orderData) {
    if (currentUser) {
        orderData.user_id = currentUser.id;
        orderData.is_guest = false;
    } else {
        orderData.is_guest = true;
        orderData.guest_data = {
            name: guestName,
            phone: guestPhone,
            email: guestEmail
        };
    }
    
    // Submit to database
    const { data, error } = await supabase
        .from('orders')
        .insert([orderData]);
}
```

---

## 🔒 STEP 6: Security Configuration

### Configure RLS Policies

The schema already includes RLS policies. Verify in Supabase:

1. Go to **Database** → **Tables**
2. Check each table has policies enabled
3. Test with different users to ensure isolation

### Environment Variables

If you want to restrict Google OAuth domains:

1. In Supabase, go to **Settings** → **API**
2. Add to site URL: `https://yourdomain.com`
3. Add redirect URLs:
   ```
   https://yourdomain.com
   https://yourdomain.com/index.html
   ```

---

## 🧪 STEP 7: Testing

### Test Phone Authentication:

1. Open your website
2. Click **Login**
3. Enter UAE phone number (e.g., 050 123 4567)
4. Click **Send OTP**
5. Check your phone for OTP
6. Enter OTP and verify

### Test Google Authentication:

1. Click **Continue with Google**
2. Select Google account
3. Authorize the app
4. Should redirect back and log you in

### Test Address Management:

1. Login with phone or Google
2. Click on your user menu
3. Go to **My Addresses**
4. Add a new address
5. Set one as default
6. Edit/delete addresses

### Test Guest Checkout:

1. Do NOT login
2. Add items to cart
3. Go to checkout
4. Fill in guest information
5. Complete order
6. Order should save with guest data

---

## 🎯 STEP 8: Customization

### Change OTP Template (Optional):

In Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Scroll to **SMS Templates**
3. Customize the OTP message

### Change OAuth Redirect:

In `auth.js`, modify the redirect URL:

```javascript
async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/checkout.html`, // Change here
            ...
        }
    });
}
```

### Customize User Menu:

In `auth-components.html`, modify the dropdown menu:

```html
<div class="user-dropdown" id="userDropdown">
    <!-- Add/remove menu items here -->
    <a href="/profile"><i class="fas fa-user"></i> My Profile</a>
    <a href="/orders"><i class="fas fa-shopping-bag"></i> My Orders</a>
    <!-- Add more items -->
</div>
```

---

## 📱 Mobile Considerations

### Phone Number Format:

The system accepts multiple formats:
- `050 123 4567`
- `+971501234567`
- `00971501234567`
- `971501234567`

All are converted to international format (+971).

### OTP Auto-fill:

On mobile browsers, OTP codes can be auto-filled if:
1. SMS contains "Your code is: XXXXXX"
2. Domain matches the sender

---

## 🐛 Troubleshooting

### Phone OTP not sending:

1. Check Twilio credentials in Supabase
2. Verify phone number has +971 prefix
3. Check Twilio account balance
4. Verify Twilio phone number is verified

### Google OAuth not working:

1. Verify redirect URI in Google Console matches exactly
2. Check if Google Client ID/Secret are correct
3. Ensure OAuth consent screen is configured
4. Try incognito mode to rule out cache issues

### User profile not creating:

1. Check trigger exists in database
2. Verify RLS policies allow insert
3. Check browser console for errors
4. Manually test trigger with SQL:

```sql
SELECT handle_new_user();
```

### Addresses not saving:

1. Check RLS policies on user_addresses
2. Verify user is authenticated
3. Check console for Supabase errors
4. Test with SQL directly

---

## 📊 Database Schema Reference

### user_profiles
- `id` (UUID) - Links to auth.users
- `phone_number` (string) - Unique
- `full_name` (string)
- `email` (string)
- `avatar_url` (text)

### user_addresses
- `id` (UUID)
- `user_id` (UUID) - Links to user_profiles
- `label` (string) - Home/Work/Other
- `full_name`, `phone_number`, `street_address`, etc.
- `is_default` (boolean)

### orders (updated)
- `user_id` (UUID) - NULL for guest
- `is_guest` (boolean)
- `guest_data` (JSONB) - For guest orders

---

## ✅ Launch Checklist

Before going live:

- [ ] Phone auth tested and working
- [ ] Google OAuth tested and working
- [ ] Address CRUD operations working
- [ ] Guest checkout tested
- [ ] User checkout tested
- [ ] RLS policies verified
- [ ] Mobile responsive tested
- [ ] Error handling works
- [ ] Redirect URLs configured
- [ ] Production credentials set
- [ ] SMS credits purchased (Twilio)
- [ ] Terms & Privacy links updated

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs
3. Verify all files are uploaded
4. Test database connection
5. Check authentication providers status

For Supabase-specific issues:
- [Supabase Docs](https://supabase.com/docs)
- [Phone Auth Guide](https://supabase.com/docs/guides/auth/phone-login)
- [OAuth Guide](https://supabase.com/docs/guides/auth/social-login)

---

## 🎉 You're Done!

Your authentication system is now complete with:
✅ Phone authentication with OTP
✅ Google OAuth login
✅ User profiles & multiple addresses
✅ Guest checkout option
✅ Secure RLS policies

Users can now register, login, manage addresses, and checkout seamlessly!
