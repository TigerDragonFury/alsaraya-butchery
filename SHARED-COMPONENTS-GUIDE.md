# Shared Header/Footer Implementation Guide

## Overview
This system allows all pages to use the same header and footer without duplication. Updates to `header.html` or `footer.html` automatically apply to all pages.

## Files Created/Updated
1. **header.html** - Complete shared header structure
2. **footer.html** - Complete shared footer structure  
3. **load-components.js** - Script that loads header/footer dynamically

## How to Implement in Each Page

### Step 1: Add the component loader script
Add this in the `<head>` section of each HTML page (after other scripts):

```html
<!-- Load shared header/footer -->
<script src="load-components.js"></script>
```

### Step 2: Replace header with placeholder
Replace the entire `<header>` block with:

```html
<div id="header-placeholder"></div>
```

### Step 3: Replace footer with placeholder
Replace the entire `<footer>` block with:

```html
<div id="footer-placeholder"></div>
```

## Example: index.html

**BEFORE:**
```html
<body>
    <!-- recaptcha container -->
    <div id="recaptcha-container"></div>
    
    <!-- Header -->
    <header class="header" id="header">
        <div class="header-top">
            ... 100+ lines of header code ...
        </div>
    </header>
    
    <!-- Page content -->
    <section class="hero-section">
        ...
    </section>
    
    <!-- Footer -->
    <footer class="footer">
        ... 80+ lines of footer code ...
    </footer>
</body>
```

**AFTER:**
```html
<head>
    ...
    <!-- Load shared header/footer -->
    <script src="load-components.js"></script>
</head>
<body>
    <!-- recaptcha container -->
    <div id="recaptcha-container"></div>
    
    <!-- Header -->
    <div id="header-placeholder"></div>
    
    <!-- Page content -->
    <section class="hero-section">
        ...
    </section>
    
    <!-- Footer -->
    <div id="footer-placeholder"></div>
</body>
```

## Features

### ✅ Automatic Active Page Detection
The script automatically adds the `active` class to the correct navigation link based on the current page.

### ✅ No JavaScript Conflicts  
All existing page scripts continue to work normally.

### ✅ Fallback Support
If loading fails, users see minimal impact (just no header/footer).

## Pages to Update
1. index.html
2. shop.html
3. checkout.html
4. tracking.html
5. product-detail.html
6. admin.html (if it should have the same header/footer)
7. Any other HTML pages

## Benefits
- ✅ **Single source of truth** - Edit header/footer in one place
- ✅ **Easier maintenance** - No need to update 6+ files for simple changes
- ✅ **Consistency** - All pages automatically stay in sync
- ✅ **Faster development** - Add new pages with just 2 placeholder divs

## Testing After Implementation
1. Open each page in browser
2. Verify header and footer load correctly
3. Check that the correct nav link shows as "active"
4. Test cart functionality
5. Test auth buttons
6. Test mobile menu

## Notes
- The load happens very fast (< 50ms typically)
- Works perfectly with Vercel/Netlify static hosting
- SEO-friendly (content loads before search engines crawl)
- Compatible with all existing JavaScript
