// Supabase Configuration
const SUPABASE_URL = 'https://volqsrawddjdvykbgqgr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbHFzcmF3ZGRqZHZ5a2JncWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDQ1MjgsImV4cCI6MjA4NTUyMDUyOH0.VCeo_gHgmHUl7qIsXymYBzkjqSPeS6dYCKqZYCv6itg';

// Initialize Supabase client (global for admin.js to use)
var supabase;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
});

// Product Data
const products = [
    {
        id: 1,
        name: "Prime Ribeye Steak",
        category: "beef",
        price: 28.99,
        unit: "per lb",
        description: "Marbled perfection with exceptional tenderness",
        badge: "Premium",
        icon: "🥩",
        image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        name: "Wagyu Beef",
        category: "beef",
        price: 89.99,
        unit: "per lb",
        description: "World-renowned for its buttery texture",
        badge: "Exclusive",
        icon: "🥩",
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        name: "Lamb Chops",
        category: "lamb",
        price: 24.99,
        unit: "per lb",
        description: "Tender and flavorful premium cuts",
        badge: "Popular",
        icon: "🍖",
        image: "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop"
    },
    {
        id: 4,
        name: "Whole Lamb Leg",
        category: "lamb",
        price: 18.99,
        unit: "per lb",
        description: "Perfect for roasting and special occasions",
        badge: null,
        icon: "🍖",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop"
    },
    {
        id: 5,
        name: "Free Range Chicken",
        category: "chicken",
        price: 8.99,
        unit: "per lb",
        description: "Farm-raised with no antibiotics",
        badge: "Fresh",
        icon: "🍗",
        image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop"
    },
    {
        id: 6,
        name: "Chicken Breast",
        category: "chicken",
        price: 6.99,
        unit: "per lb",
        description: "Lean and versatile protein",
        badge: null,
        icon: "🍗",
        image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop"
    },
    {
        id: 7,
        name: "Beef Tenderloin",
        category: "beef",
        price: 32.99,
        unit: "per lb",
        description: "The most tender cut available",
        badge: "Premium",
        icon: "🥩",
        image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop"
    },
    {
        id: 8,
        name: "Lamb Rack",
        category: "lamb",
        price: 34.99,
        unit: "per lb",
        description: "Elegant presentation, superior taste",
        badge: "Premium",
        icon: "🍖",
        image: "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&h=300&fit=crop"
    },
    {
        id: 9,
        name: "Ground Beef",
        category: "beef",
        price: 7.99,
        unit: "per lb",
        description: "80/20 blend perfect for burgers",
        badge: null,
        icon: "🥩",
        image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=300&fit=crop&sat=-20"
    },
    {
        id: 10,
        name: "Beef Short Ribs",
        category: "beef",
        price: 15.99,
        unit: "per lb",
        description: "Rich, fall-off-the-bone delicious",
        badge: null,
        icon: "🥩",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop"
    },
    {
        id: 11,
        name: "Lamb Shoulder",
        category: "lamb",
        price: 14.99,
        unit: "per lb",
        description: "Perfect for slow cooking",
        badge: null,
        icon: "🍖",
        image: "https://images.unsplash.com/photo-1595777216528-071e0127ccf4?w=400&h=300&fit=crop"
    },
    {
        id: 12,
        name: "Chicken Thighs",
        category: "chicken",
        price: 5.99,
        unit: "per lb",
        description: "Juicy and full of flavor",
        badge: null,
        icon: "🍗",
        image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=300&fit=crop"
    },
    {
        id: 13,
        name: "Dry-Aged Steak",
        category: "specialty",
        price: 45.99,
        unit: "per lb",
        description: "45-day aged for intense flavor",
        badge: "Exclusive",
        icon: "⭐",
        image: "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&h=300&fit=crop&sat=20"
    },
    {
        id: 14,
        name: "Kobe Beef",
        category: "specialty",
        price: 149.99,
        unit: "per lb",
        description: "The ultimate luxury experience",
        badge: "Luxury",
        icon: "⭐",
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop&sat=30"
    },
    {
        id: 15,
        name: "Specialty Sausages",
        category: "specialty",
        price: 12.99,
        unit: "per lb",
        description: "House-made with premium ingredients",
        badge: "Popular",
        icon: "🌭",
        image: "https://images.unsplash.com/photo-1612380456226-85c0a6c6a63f?w=400&h=300&fit=crop"
    }
];

// Shopping Cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update Cart Count on Load
function updateCartCount() {
    // Reload cart from localStorage to ensure sync
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update desktop cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Update mobile cart count (check both possible IDs)
    const cartCountMobile = document.getElementById('cartCountMobile');
    if (cartCountMobile) {
        cartCountMobile.textContent = totalItems;
    }
    
    const mobileCartCount = document.getElementById('mobileCartCount');
    if (mobileCartCount) {
        mobileCartCount.textContent = totalItems;
    }
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Add to Cart from Database (for shop.html and index.html)
function addToCartFromDB(id, name, price, category, unit, iiko_product_id = null, quantity = 1) {
    const product = {
        id: id,
        name: name,
        price: parseFloat(price),
        category: category,
        unit: unit,
        iiko_product_id: iiko_product_id
    };
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Update Cart
function updateCart() {
    // Reload cart from localStorage to ensure sync
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    updateCartCount();
    
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems || !cartTotal) return;

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `${totalPrice.toFixed(2)} AED`;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)} AED / ${item.unit}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn qty-minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn qty-plus" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">×</button>
            </div>
        `).join('');
        
        // Add event listeners to buttons
        attachCartButtonListeners();
    }
}

// Attach event listeners to cart buttons
function attachCartButtonListeners() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    // Quantity minus buttons
    cartItems.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            console.log('Minus clicked for:', id);
            updateQuantity(id, -1);
        });
    });
    
    // Quantity plus buttons
    cartItems.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            console.log('Plus clicked for:', id);
            updateQuantity(id, 1);
        });
    });
    
    // Remove buttons
    cartItems.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            console.log('Remove clicked for:', id);
            removeFromCart(id);
        });
    });
}

// Display Cart (alias for updateCart - used by other pages)
function displayCart() {
    updateCart();
}

// Update Quantity
function updateQuantity(productId, change) {
    console.log('updateQuantity called:', productId, change);
    productId = Number(productId);
    const item = cart.find(i => Number(i.id) === productId);
    console.log('found item:', item);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCart();
        }
    }
}

// Remove from Cart
function removeFromCart(productId) {
    console.log('removeFromCart called:', productId);
    productId = Number(productId);
    cart = cart.filter(item => Number(item.id) !== productId);
    console.log('cart after remove:', cart);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Get Cart Total
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Clear Cart
function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCart();
}

// Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: red;
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close mobile menu on link click
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Scroll Reveal Animation
    function reveal() {
        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', reveal);
    reveal();

    // Parallax Effect for Shapes
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.shape').forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            if (shape) {
                shape.style.transform = `translateY(${scrolled * speed}px)`;
            }
        });
    });

    // Cart Modal
    const cartIcon = document.getElementById('cartIcon');
    const cartIconBottom = document.getElementById('cartIconBottom');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');

    if (cartIcon && cartModal) {
        cartIcon.addEventListener('click', () => {
            cartModal.classList.add('active');
            updateCart();
        });
    }
    
    if (cartIconBottom && cartModal) {
        cartIconBottom.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.classList.add('active');
            updateCart();
        });
    }

    if (closeCart && cartModal) {
        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });

        cartModal.addEventListener('click', (e) => {
            if (e.target.id === 'cartModal') {
                cartModal.classList.remove('active');
            }
        });
    }

    // Update cart count on page load
    updateCartCount();
});

// Proceed to Checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// ===== SEARCH FUNCTIONALITY =====
function escapeAttr(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

let searchTimeout;

function debounceSearch(callback, delay = 300) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(callback, delay);
}

async function performSearch(query, resultsContainer) {
    if (!query.trim()) {
        resultsContainer.classList.remove('active');
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price, image_url, category')
            .ilike('name', `%${query}%`)
            .eq('in_stock', true)
            .limit(8);

        if (error) throw error;

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No products found</div>';
            resultsContainer.classList.add('active');
            return;
        }

        const html = data.map(product => `
            <div class="search-result-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
                ${product.image_url ? `<img src="${product.image_url}" alt="${escapeAttr(product.name)}" class="search-result-img">` : ''}
                <div class="search-result-name">${escapeAttr(product.name)}</div>
                <div class="search-result-price">${Number(product.price).toFixed(2)} AED</div>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('active');
    } catch (err) {
        console.error('Search error:', err);
        resultsContainer.innerHTML = '<div class="search-no-results">Search error</div>';
    }
}

// Setup search functionality
function initializeSearch() {
    const desktopSearch = document.querySelector('.nav-search');
    const mobileSearch = document.querySelector('.nav-mobile-search');
    const desktopResults = document.getElementById('desktopSearchResults');
    const mobileResults = document.getElementById('mobileSearchResults');

    if (desktopSearch) {
        desktopSearch.addEventListener('input', (e) => {
            debounceSearch(() => {
                performSearch(e.target.value, desktopResults);
            });
        });

        document.addEventListener('click', (e) => {
            if (!desktopSearch.contains(e.target) && !desktopResults.contains(e.target)) {
                desktopResults.classList.remove('active');
            }
        });
    }

    if (mobileSearch) {
        mobileSearch.addEventListener('input', (e) => {
            debounceSearch(() => {
                performSearch(e.target.value, mobileResults);
            });
        });

        document.addEventListener('click', (e) => {
            if (!mobileSearch.contains(e.target) && !mobileResults.contains(e.target)) {
                mobileResults.classList.remove('active');
            }
        });
    }
}

// Initialize search when header is loaded
window.addEventListener('headerLoaded', initializeSearch);

document.addEventListener('DOMContentLoaded', () => {
    // Try to initialize search immediately (if header already loaded)
    const desktopSearch = document.querySelector('.nav-search');
    if (desktopSearch) {
        initializeSearch();
    }
});