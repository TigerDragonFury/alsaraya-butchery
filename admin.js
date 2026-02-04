// Admin.js - Admin panel functionality
// Supabase client is initialized in app.js

// Global state
let allOrders = [];
let allProducts = [];
let currentOrderFilter = 'all';

// Initialize admin page
document.addEventListener('DOMContentLoaded', async function() {
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup navigation
    setupAdminNavigation();
    
    // Load all data
    await loadDashboardData();
    await loadCategories(); // Load categories first
    await loadProducts();
    await loadOrders();
    
    // Setup form handlers
    setupFormHandlers();
});

// Mobile Menu Function
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

// Close menu function for mobile
window.closeMenu = function() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');
    if (navLinks) navLinks.classList.remove('active');
    if (menuToggle) menuToggle.classList.remove('active');
}

// Navigation
function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            closeMenu();
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Dashboard Data
async function loadDashboardData() {
    try {
        // Load orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (ordersError) throw ordersError;
        
        // Load products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*');
        
        if (productsError) throw productsError;
        
        // Calculate stats
        const totalOrders = orders?.length || 0;
        const totalProducts = products?.length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
        
        // Update dashboard
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = pendingOrders;
        
        // Load recent orders
        displayRecentOrders(orders?.slice(0, 5) || []);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function displayRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${order.customer_name || 'N/A'}</td>
            <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn-icon" onclick="viewOrderDetails(${order.id})" title="View Details">👁️</button>
            </td>
        </tr>
    `).join('');
}

// Products Management
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        allProducts = products || [];
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=350&fit=crop';
        return `
        <div class="admin-product-card">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=350&fit=crop'">
                <div class="product-overlay">
                    <span class="product-icon">${product.icon || '🥩'}</span>
                </div>
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                ${product.arabic_name ? `<p class="product-arabic">${product.arabic_name}</p>` : ''}
                <p class="product-category"><span class="category-badge">${product.category}</span></p>
                <div class="product-footer">
                    <div class="product-price">
                        $${parseFloat(product.price).toFixed(2)}<span>/${product.unit || 'kg'}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-icon btn-edit" onclick="editProduct(${product.id})" title="Edit">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Filter products by search
window.filterProducts = function() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('productCategoryFilter').value;
    
    let filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.arabic_name && product.arabic_name.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    displayProducts(filteredProducts);
}

// Product Modal
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    form.reset();
    document.getElementById('productId').value = '';
    
    if (productId) {
        title.textContent = 'Edit Product';
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productArabicName').value = product.arabic_name || '';
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productUnit').value = product.unit || 'kg';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productIcon').value = product.icon || '';
            document.getElementById('productBadge').value = product.badge || '';
            document.getElementById('productImageUrl').value = product.image_url || '';
            
            // Show image preview if exists
            if (product.image_url) {
                document.getElementById('previewImg').src = product.image_url;
                document.getElementById('imagePreview').style.display = 'block';
            }
        }
    } else {
        title.textContent = 'Add New Product';
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('imagePreview').style.display = 'none';
}

window.editProduct = async function(productId) {
    openProductModal(productId);
}

window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        showNotification('Product deleted successfully!');
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Orders Management
async function loadOrders() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allOrders = orders || [];
        applyOrderFilters(currentOrderFilter);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders', 'error');
    }
}

function applyOrderFilters(status) {
    currentOrderFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === status || (status === 'all' && btn.textContent.toLowerCase() === 'all')) {
            btn.classList.add('active');
        }
    });
    
    // Get search term
    const searchInput = document.getElementById('orderSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Filter orders by status
    let filtered = status === 'all' 
        ? allOrders 
        : allOrders.filter(o => o.status === status);
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.customer_name?.toLowerCase().includes(searchTerm) ||
            order.id.toString().includes(searchTerm) ||
            order.customer_mobile?.toLowerCase().includes(searchTerm)
        );
    }
    
    displayOrders(filtered);
}

// Filter orders by status from buttons
window.filterOrdersByStatus = function(status) {
    applyOrderFilters(status);
}

// Filter orders by search input
window.filterOrders = function() {
    applyOrderFilters(currentOrderFilter);
}

function displayOrders(orders) {
    const grid = document.getElementById('ordersGrid');
    
    if (orders.length === 0) {
        grid.innerHTML = '<div class="no-data">No orders found</div>';
        return;
    }
    
    grid.innerHTML = orders.map(order => `
        <div class="admin-order-card">
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <select class="status-select status-${order.status}" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="order-body">
                <div class="order-info">
                    <div class="info-row">
                        <span class="info-label">Customer:</span>
                        <span class="info-value">${order.customer_name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${order.customer_mobile || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Total:</span>
                        <span class="info-value order-total">$${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn btn-secondary" onclick="viewOrderDetails(${order.id})">View Details</button>
                <button class="btn btn-danger" onclick="deleteOrder(${order.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        
        if (error) throw error;
        
        showNotification('Order status updated!');
        await loadOrders();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status', 'error');
    }
}

window.viewOrderDetails = async function(orderId) {
    try {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        
        if (orderError) throw orderError;
        
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);
        
        if (itemsError) throw itemsError;
        
        const content = `
            <div class="order-details">
                <div class="detail-group">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.customer_mobile || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.delivery_address || 'N/A'}</p>
                </div>
                
                <div class="detail-group">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> #${order.id}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                    <p><strong>Payment Method:</strong> ${order.payment_method || 'Cash on Delivery'}</p>
                </div>
                
                <div class="detail-group">
                    <h3>Order Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => {
                                const itemPrice = parseFloat(item.unit_price) || 0;
                                const itemQuantity = parseInt(item.quantity) || 0;
                                const itemTotal = parseFloat(item.total_price) || (itemPrice * itemQuantity);
                                return `
                                <tr>
                                    <td>${item.product_name || 'Unknown Product'}</td>
                                    <td>$${itemPrice.toFixed(2)}</td>
                                    <td>${itemQuantity}</td>
                                    <td>$${itemTotal.toFixed(2)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="order-total">
                        <strong>Total: $${(parseFloat(order.total_amount) || 0).toFixed(2)}</strong>
                    </div>
                </div>
                
                ${order.notes ? `
                    <div class="detail-group">
                        <h3>Order Notes</h3>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('orderDetailsContent').innerHTML = content;
        document.getElementById('orderModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Error loading order details', 'error');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

window.deleteOrder = async function(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        // Delete order items first
        await supabase.from('order_items').delete().eq('order_id', orderId);
        
        // Delete order
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        
        if (error) throw error;
        
        showNotification('Order deleted successfully!');
        await loadOrders();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Error deleting order', 'error');
    }
}

// Categories Management
let allCategories = [];

async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        allCategories = categories || [];
        displayCategories(allCategories);
        populateCategoryFilters();
        
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to hardcoded categories if table doesn't exist
        allCategories = [
            { id: 1, name: 'Raw Meat', slug: 'raw-meat', icon: '🥩', description: 'Fresh cuts of various meats' },
            { id: 2, name: 'Bowels', slug: 'bowels', icon: '🫀', description: 'Offal and organ meats' },
            { id: 3, name: 'Trays', slug: 'trays', icon: '🍽️', description: 'Pre-packaged meat trays' },
            { id: 4, name: 'Appetizers', slug: 'appetizers', icon: '🥟', description: 'Ready-to-cook appetizers' },
            { id: 5, name: 'Lamb', slug: 'lamb', icon: '🍖', description: 'Lamb and mutton products' },
            { id: 6, name: 'Beef', slug: 'beef', icon: '🥩', description: 'Premium beef cuts' },
            { id: 7, name: 'Chicken', slug: 'chicken', icon: '🍗', description: 'Poultry products' },
            { id: 8, name: 'Skewers', slug: 'skewers', icon: '🍢', description: 'Marinated skewers' },
            { id: 9, name: 'Boxes', slug: 'boxes', icon: '📦', description: 'Value pack boxes' },
            { id: 10, name: 'Local Veal', slug: 'local-veal', icon: '🐄', description: 'Fresh local veal' },
            { id: 11, name: 'Specialty', slug: 'specialty', icon: '⭐', description: 'Specialty items' },
            { id: 12, name: 'Marinated', slug: 'marinated', icon: '🌶️', description: 'Pre-marinated meats' }
        ];
        displayCategories(allCategories);
        populateCategoryFilters();
    }
}

function populateCategoryFilters() {
    // Populate product category filter
    const filterSelect = document.getElementById('productCategoryFilter');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>' +
            allCategories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
    }
    
    // Populate product form category dropdown
    const formSelect = document.getElementById('productCategory');
    if (formSelect) {
        formSelect.innerHTML = '<option value="">Select Category</option>' +
            allCategories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
    }
}

function displayCategories(categories) {
    const grid = document.getElementById('categoriesGrid');
    
    grid.innerHTML = categories.map((cat) => `
        <div class="category-card">
            <div class="category-icon">${cat.icon}</div>
            <h3>${cat.name}</h3>
            <p>${cat.description}</p>
            <div class="category-actions">
                <button class="btn-sm btn-secondary" onclick="editCategory(${cat.id})">Edit</button>
                <button class="btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

window.editCategory = async function(categoryId) {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    const newName = prompt('Category Name:', category.name);
    if (!newName) return;
    
    const newIcon = prompt('Category Icon (emoji):', category.icon);
    const newDescription = prompt('Category Description:', category.description);
    
    try {
        const { error } = await supabase
            .from('categories')
            .update({
                name: newName,
                icon: newIcon || category.icon,
                description: newDescription || category.description
            })
            .eq('id', categoryId);
        
        if (error) throw error;
        
        showNotification('Category updated successfully!');
        await loadCategories();
        
    } catch (error) {
        console.error('Error updating category:', error);
        showNotification('Error updating category', 'error');
    }
}

window.deleteCategory = async function(categoryId) {
    if (!confirm('Are you sure? This will affect all products in this category!')) return;
    
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);
        
        if (error) throw error;
        
        showNotification('Category deleted successfully!');
        await loadCategories();
        
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Error deleting category', 'error');
    }
}
window.openCategoryModal = function(categoryIndex = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const title = modal.querySelector('h2');
    
    if (categoryIndex !== null) {
        title.textContent = 'Edit Category';
        // Categories are static for now
        showNotification('Categories are currently managed in the code', 'error');
    } else {
        title.textContent = 'Add New Category';
        form.reset();
        modal.classList.add('active');
    }
}

window.closeCategoryModal = function() {
    document.getElementById('categoryModal').classList.remove('active');
}

window.editCategory = function(index) {
    showNotification('Category editing coming soon! Categories are currently static.', 'error');
}

window.deleteCategory = function(slug) {
    showNotification('Category deletion coming soon! This would affect products.', 'error');
}

// Form Handlers
function setupFormHandlers() {
    // Product form
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('productName').value,
            arabic_name: document.getElementById('productArabicName').value || null,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            unit: document.getElementById('productUnit').value,
            description: document.getElementById('productDescription').value || null,
            icon: document.getElementById('productIcon').value || '🥩',
            badge: document.getElementById('productBadge').value || null,
            image_url: document.getElementById('productImageUrl').value || null
        };
        
        console.log('Submitting product:', { productId, productData });
        
        try {
            if (productId) {
                // Update existing product - convert ID to integer
                console.log('Updating product ID:', productId);
                const { data, error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', parseInt(productId))
                    .select();
                
                console.log('Update result:', { data, error });
                
                if (error) throw error;
                showNotification('Product updated successfully!');
            } else {
                // Insert new product
                console.log('Inserting new product');
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select();
                
                console.log('Insert result:', { data, error });
                
                if (error) throw error;
                showNotification('Product added successfully!');
            }
            
            closeProductModal();
            await loadProducts();
            await loadDashboardData();
            
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Error saving product: ' + error.message, 'error');
        }
    });
    
    // Category form
    document.getElementById('categoryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('Category management coming soon!');
        closeCategoryModal();
    });
}

// Image Upload to Imgur
window.uploadImageToImgur = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    showNotification('Uploading image...');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID 546c25a59c58ad7' // Public Imgur Client ID
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const imageUrl = data.data.link;
            document.getElementById('productImageUrl').value = imageUrl;
            document.getElementById('previewImg').src = imageUrl;
            document.getElementById('imagePreview').style.display = 'block';
            showNotification('Image uploaded successfully!');
        } else {
            throw new Error(data.data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error uploading image: ' + error.message, 'error');
    }
}

// Preview image when URL is pasted
document.getElementById('productImageUrl')?.addEventListener('input', function(e) {
    const url = e.target.value;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        document.getElementById('previewImg').src = url;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }
});

// Utility - showNotification is already defined in app.js, remove duplicate
// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
