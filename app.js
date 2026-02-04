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
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update desktop cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Update mobile cart count
    const cartCountMobile = document.getElementById('cartCountMobile');
    if (cartCountMobile) {
        cartCountMobile.textContent = totalItems;
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
    updateCartCount();
    
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems || !cartTotal) return;

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} ${item.unit}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `).join('');
    }
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
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
    cart = cart.filter(item => item.id !== productId);
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
