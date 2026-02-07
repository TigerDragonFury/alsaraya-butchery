// ============================================
// AL SARAYA AUTHENTICATION SYSTEM
// Handles login, registration, Google OAuth, and user management
// ============================================

// Authentication State
let currentUser = null;
let userProfile = null;
let userAddresses = [];

// Initialize Authentication
async function initAuth() {
    try {
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            await loadUserAddresses();
            updateUIForLoggedInUser();
        } else {
            updateUIForGuestUser();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                loadUserProfile();
                loadUserAddresses();
                updateUIForLoggedInUser();
                closeAuthModal();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                userProfile = null;
                userAddresses = [];
                updateUIForGuestUser();
            }
        });
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
}

// ============================================
// PHONE NUMBER AUTHENTICATION
// ============================================

async function sendOTP(phoneNumber) {
    try {
        // Validate UAE phone number format
        const phoneRegex = /^(\+971|00971|971|0)?[0-9]{9}$/;
        if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
            throw new Error('Please enter a valid UAE phone number');
        }

        // Format phone number to international format
        let formattedPhone = phoneNumber.replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+971' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+971' + formattedPhone;
        }

        const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
        });

        if (error) throw error;

        showNotification('OTP sent to your phone!', 'success');
        return { success: true, phone: formattedPhone };
    } catch (error) {
        console.error('Send OTP error:', error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
    }
}

async function verifyOTP(phoneNumber, otp) {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            phone: phoneNumber,
            token: otp,
            type: 'sms'
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserProfile();
        await loadUserAddresses();
        
        showNotification('Successfully logged in!', 'success');
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Verify OTP error:', error);
        showNotification('Invalid OTP. Please try again.', 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// GOOGLE AUTHENTICATION
// ============================================

async function signInWithGoogle() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/index.html`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;
    } catch (error) {
        console.error('Google sign in error:', error);
        showNotification('Google sign in failed. Please try again.', 'error');
    }
}

// ============================================
// USER PROFILE MANAGEMENT
// ============================================

async function loadUserProfile() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            userProfile = data;
        } else {
            // Create profile if doesn't exist
            await createUserProfile();
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

async function createUserProfile() {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
                id: currentUser.id,
                email: currentUser.email,
                phone_number: currentUser.phone,
                full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]
            }])
            .select()
            .single();

        if (error) throw error;
        userProfile = data;
    } catch (error) {
        console.error('Create profile error:', error);
    }
}

async function updateUserProfile(updates) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;

        userProfile = data;
        showNotification('Profile updated successfully!', 'success');
        return { success: true, profile: data };
    } catch (error) {
        console.error('Update profile error:', error);
        showNotification('Failed to update profile', 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// ADDRESS MANAGEMENT
// ============================================

async function loadUserAddresses() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        userAddresses = data || [];
        return userAddresses;
    } catch (error) {
        console.error('Load addresses error:', error);
        return [];
    }
}

async function addUserAddress(addressData) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .insert([{
                user_id: currentUser.id,
                ...addressData
            }])
            .select()
            .single();

        if (error) throw error;

        await loadUserAddresses();
        showNotification('Address added successfully!', 'success');
        return { success: true, address: data };
    } catch (error) {
        console.error('Add address error:', error);
        showNotification('Failed to add address', 'error');
        return { success: false, error: error.message };
    }
}

async function updateUserAddress(addressId, updates) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_addresses')
            .update(updates)
            .eq('id', addressId)
            .eq('user_id', currentUser.id)
            .select()
            .single();

        if (error) throw error;

        await loadUserAddresses();
        showNotification('Address updated successfully!', 'success');
        return { success: true, address: data };
    } catch (error) {
        console.error('Update address error:', error);
        showNotification('Failed to update address', 'error');
        return { success: false, error: error.message };
    }
}

async function deleteUserAddress(addressId) {
    if (!currentUser) return;

    try {
        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        await loadUserAddresses();
        showNotification('Address deleted successfully!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Delete address error:', error);
        showNotification('Failed to delete address', 'error');
        return { success: false, error: error.message };
    }
}

async function setDefaultAddress(addressId) {
    if (!currentUser) return;

    try {
        // Update the address to be default
        const { error } = await supabase
            .from('user_addresses')
            .update({ is_default: true })
            .eq('id', addressId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        await loadUserAddresses();
        showNotification('Default address updated!', 'success');
        return { success: true };
    } catch (error) {
        console.error('Set default address error:', error);
        showNotification('Failed to set default address', 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// SIGN OUT
// ============================================

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        userProfile = null;
        userAddresses = [];
        
        showNotification('Signed out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Failed to sign out', 'error');
    }
}

// ============================================
// UI HELPERS
// ============================================

function updateUIForLoggedInUser() {
    // Update header to show user menu
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const authBtnContainer = document.getElementById('authBtnContainer');
        if (authBtnContainer) {
            authBtnContainer.innerHTML = `
                <button class="user-menu-btn" id="userMenuBtn" onclick="toggleUserMenu()">
                    <i class="fas fa-user-circle"></i>
                    <span>${userProfile?.full_name || 'Account'}</span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="#" onclick="showProfile(); return false;">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <a href="#" onclick="showAddresses(); return false;">
                        <i class="fas fa-map-marker-alt"></i> My Addresses
                    </a>
                    <a href="orders.html">
                        <i class="fas fa-shopping-bag"></i> My Orders
                    </a>
                    <a href="#" onclick="signOut(); return false;">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </a>
                </div>
            `;
        }
    }
}

function updateUIForGuestUser() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const authBtnContainer = document.getElementById('authBtnContainer');
        if (authBtnContainer) {
            authBtnContainer.innerHTML = `
                <button class="btn-auth" onclick="openAuthModal('login')">
                    <i class="fas fa-user"></i> Login
                </button>
            `;
        }
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdown && !userMenuBtn?.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// ============================================
// MODAL FUNCTIONS (defined in HTML)
// ============================================

// Note: openAuthModal, closeAuthModal, showProfile, showAddresses
// are defined in the HTML file that includes this script

// Export functions for global use
window.currentUser = () => currentUser;
window.userProfile = () => userProfile;
window.userAddresses = () => userAddresses;
window.signOut = signOut;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.signInWithGoogle = signInWithGoogle;
window.loadUserAddresses = loadUserAddresses;
window.addUserAddress = addUserAddress;
window.updateUserAddress = updateUserAddress;
window.deleteUserAddress = deleteUserAddress;
window.setDefaultAddress = setDefaultAddress;
window.updateUserProfile = updateUserProfile;
window.toggleUserMenu = toggleUserMenu;

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
