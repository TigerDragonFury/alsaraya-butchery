// ============================================
// AL SARAYA AUTHENTICATION SYSTEM
// Handles login, registration, Google OAuth, and user management
// Using Firebase for FREE phone authentication (10,000 SMS/month)
// ============================================

// Authentication State
let currentUser = null;
let userProfile = null;
let userAddresses = [];
let confirmationResult = null; // Firebase phone verification

// Initialize Authentication
async function initAuth() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not loaded yet');
            updateUIForGuestUser();
            return;
        }

        // Listen for Firebase auth state changes
        firebase.auth().onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in with Firebase
                currentUser = firebaseUser;
                
                // Sync with Supabase database
                await syncFirebaseUserToSupabase(firebaseUser);
                
                // Load user profile and addresses from Supabase
                await loadUserProfile();
                await loadUserAddresses();
                
                updateUIForLoggedInUser();
                closeAuthModal();
            } else {
                // User is signed out
                currentUser = null;
                userProfile = null;
                userAddresses = [];
                updateUIForGuestUser();
            }
        });
    } catch (error) {
        console.error('Auth initialization error:', error);
        updateUIForGuestUser();
    }
}

// ============================================
// PHONE NUMBER AUTHENTICATION (Firebase - FREE)
// ============================================

async function sendOTP(phoneNumber) {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not loaded. Please refresh the page.');
        }

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

        // Clear existing reCAPTCHA verifier to avoid "already rendered" error
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.log('Error clearing reCAPTCHA:', e);
            }
            window.recaptchaVerifier = null;
        }

        // Setup fresh reCAPTCHA verifier (invisible)
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved
            }
        });

        const appVerifier = window.recaptchaVerifier;
        
        // Send OTP via Firebase
        confirmationResult = await firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier);
        
        showNotification('OTP sent to your phone! (Free via Firebase)', 'success');
        return { success: true, phone: formattedPhone };
    } catch (error) {
        console.error('Send OTP error:', error);
        
        // Better error messages
        let errorMsg = error.message;
        if (error.code === 'auth/invalid-phone-number') {
            errorMsg = 'Invalid phone number format';
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Too many requests. Please try again later.';
        } else if (error.code === 'auth/quota-exceeded') {
            errorMsg = 'SMS quota exceeded. Please contact support.';
        }
        
        showNotification(errorMsg, 'error');
        
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }
        
        return { success: false, error: errorMsg };
    }
}

async function verifyOTP(phoneNumber, otp) {
    try {
        if (!confirmationResult) {
            throw new Error('Please request OTP first');
        }

        // Verify OTP with Firebase
        const result = await confirmationResult.confirm(otp);
        const firebaseUser = result.user;
        
        // Sync with Supabase database
        currentUser = {
            id: firebaseUser.uid,
            phone: firebaseUser.phoneNumber,
            email: firebaseUser.email
        };
        
        // Create/update user profile in Supabase
        await syncFirebaseUserToSupabase(firebaseUser);
        await loadUserProfile();
        await loadUserAddresses();
        
        showNotification('Successfully logged in!', 'success');
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Verify OTP error:', error);
        
        let errorMsg = 'Invalid OTP. Please try again.';
        if (error.code === 'auth/invalid-verification-code') {
            errorMsg = 'Invalid OTP code. Please check and try again.';
        } else if (error.code === 'auth/code-expired') {
            errorMsg = 'OTP expired. Please request a new one.';
        }
        
        showNotification(errorMsg, 'error');
        return { success: false, error: errorMsg };
    }
}

// Sync Firebase user to Supabase database
async function syncFirebaseUserToSupabase(firebaseUser) {
    try {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', firebaseUser.uid)
            .single();

        if (!existingProfile) {
            // Create new profile
            const { error } = await supabase
                .from('user_profiles')
                .insert([{
                    id: firebaseUser.uid,
                    phone_number: firebaseUser.phoneNumber,
                    email: firebaseUser.email || null,
                    full_name: firebaseUser.displayName || null,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
        } else {
            // Update existing profile
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    phone_number: firebaseUser.phoneNumber,
                    updated_at: new Date().toISOString()
                })
                .eq('id', firebaseUser.uid);

            if (error) throw error;
        }
    } catch (error) {
        console.error('Error syncing user to Supabase:', error);
    }
}

// Logout from Firebase
async function firebaseSignOut() {
    try {
        await firebase.auth().signOut();
        currentUser = null;
        userProfile = null;
        userAddresses = [];
        updateUIForGuestUser();
        showNotification('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
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
            .eq('id', currentUser.uid)
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
                id: currentUser.uid,
                email: currentUser.email || null,
                phone_number: currentUser.phoneNumber || null,
                full_name: currentUser.displayName || null
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
            .eq('id', currentUser.uid)
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
            .eq('user_id', currentUser.uid)
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
                user_id: currentUser.uid,
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
            .eq('user_id', currentUser.uid)
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
            .eq('user_id', currentUser.uid);

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
            .eq('user_id', currentUser.uid);

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
        // Call Firebase sign out (which triggers onAuthStateChanged)
        await firebaseSignOut();
        
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
                    <a href="profile.html">
                        <i class="fas fa-user"></i> My Profile
                    </a>
                    <a href="profile.html?tab=addresses">
                        <i class="fas fa-map-marker-alt"></i> My Addresses
                    </a>
                    <a href="profile.html?tab=orders">
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
// Use getCurrentUser to avoid circular reference with window.currentUser
window.getCurrentUser = () => currentUser;
window.getUserProfile = () => userProfile;
window.getUserAddresses = () => userAddresses;
window.currentUser = () => currentUser;  // Keep for backward compatibility
window.userProfile = () => userProfile;  // Keep for backward compatibility
window.userAddresses = () => userAddresses;  // Keep for backward compatibility
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

// ============================================
// MODAL CONTROL FUNCTIONS
// ============================================

// Auth Modal Functions
let currentPhone = '';

function openAuthModal(mode = 'login') {
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetAuthForm();
    }
}

function resetAuthForm() {
    const loginPhone = document.getElementById('loginPhone');
    const otpForm = document.getElementById('otpForm');
    
    if (loginPhone) loginPhone.value = '';
    if (otpForm) otpForm.style.display = 'none';
    
    document.querySelectorAll('.otp-input').forEach(input => input.value = '');
}

async function handleSendOTP() {
    const phoneInput = document.getElementById('loginPhone');
    const phone = phoneInput.value.trim();
    const sendButton = event.target;
    
    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        return;
    }
    
    // Show loading state
    const originalText = sendButton.innerHTML;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        const result = await sendOTP(phone);
        if (result.success) {
            currentPhone = result.phone;
            document.getElementById('otpForm').style.display = 'block';
            const firstInput = document.querySelector('.otp-input');
            if (firstInput) firstInput.focus();
            sendButton.innerHTML = '<i class="fas fa-check"></i> OTP Sent';
        } else {
            sendButton.innerHTML = originalText;
        }
    } catch (error) {
        sendButton.innerHTML = originalText;
    } finally {
        setTimeout(() => {
            sendButton.disabled = false;
            sendButton.innerHTML = originalText;
        }, 2000);
    }
}

async function handleVerifyOTP() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    const verifyButton = event.target;
    
    if (otp.length !== 6) {
        showNotification('Please enter the 6-digit OTP', 'error');
        return;
    }
    
    // Show loading state
    const originalText = verifyButton.innerHTML;
    verifyButton.disabled = true;
    verifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    try {
        const result = await verifyOTP(currentPhone, otp);
        if (result.success) {
            verifyButton.innerHTML = '<i class="fas fa-check"></i> Success!';
            setTimeout(() => {
                closeAuthModal();
            }, 500);
        } else {
            verifyButton.innerHTML = originalText;
            verifyButton.disabled = false;
        }
    } catch (error) {
        verifyButton.innerHTML = originalText;
        verifyButton.disabled = false;
    }
}

// Profile Modal Functions
function showProfile() {
    if (!userProfile) return;
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    
    if (profileName) profileName.value = userProfile.full_name || '';
    if (profileEmail) profileEmail.value = userProfile.email || '';
    if (profilePhone) profilePhone.value = userProfile.phone_number || '';
    
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Addresses Modal Functions
async function showAddresses() {
    const addresses = await loadUserAddresses();
    renderAddressesList(addresses);
    
    const modal = document.getElementById('addressesModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddressesModal() {
    const modal = document.getElementById('addressesModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        hideAddressForm();
    }
}

function renderAddressesList(addresses) {
    const list = document.getElementById('addressesList');
    if (!list) return;
    
    if (addresses.length === 0) {
        list.innerHTML = '<p class="no-addresses">No addresses saved yet. Add your first address!</p>';
        return;
    }
    
    list.innerHTML = addresses.map(addr => `
        <div class="address-card ${addr.is_default ? 'default' : ''}">
            <div class="address-header">
                <span class="address-label">
                    <i class="fas fa-${addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'map-marker-alt'}"></i>
                    ${addr.label}
                </span>
                ${addr.is_default ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <div class="address-details">
                <p><strong>${addr.full_name}</strong></p>
                <p>${addr.street_address}</p>
                <p>${[addr.building, addr.floor, addr.apartment].filter(Boolean).join(', ')}</p>
                <p>${addr.area}, ${addr.city}</p>
                <p><i class="fas fa-phone"></i> ${addr.phone_number}</p>
            </div>
            <div class="address-actions">
                ${!addr.is_default ? `<button onclick="setDefaultAddress('${addr.id}')" class="btn-icon" title="Set as default"><i class="fas fa-star"></i></button>` : ''}
                <button onclick="editAddress('${addr.id}')" class="btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="confirmDeleteAddress('${addr.id}')" class="btn-icon btn-danger" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function showAddAddressForm() {
    const formTitle = document.getElementById('addressFormTitle');
    const form = document.getElementById('addressForm');
    const addressId = document.getElementById('addressId');
    const formContainer = document.getElementById('addressFormContainer');
    
    if (formTitle) formTitle.textContent = 'Add New Address';
    if (form) form.reset();
    if (addressId) addressId.value = '';
    if (formContainer) formContainer.style.display = 'block';
}

function hideAddressForm() {
    const formContainer = document.getElementById('addressFormContainer');
    const form = document.getElementById('addressForm');
    
    if (formContainer) formContainer.style.display = 'none';
    if (form) form.reset();
}

function editAddress(addressId) {
    const address = userAddresses.find(a => a.id === addressId);
    if (!address) return;
    
    document.getElementById('addressFormTitle').textContent = 'Edit Address';
    document.getElementById('addressId').value = address.id;
    document.getElementById('addressLabel').value = address.label;
    document.getElementById('addressFullName').value = address.full_name;
    document.getElementById('addressPhone').value = address.phone_number;
    document.getElementById('addressArea').value = address.area;
    document.getElementById('addressStreet').value = address.street_address;
    document.getElementById('addressBuilding').value = address.building || '';
    document.getElementById('addressFloor').value = address.floor || '';
    document.getElementById('addressApartment').value = address.apartment || '';
    document.getElementById('addressLandmark').value = address.landmark || '';
    document.getElementById('addressDefault').checked = address.is_default;
    
    document.getElementById('addressFormContainer').style.display = 'block';
}

async function confirmDeleteAddress(addressId) {
    if (confirm('Are you sure you want to delete this address?')) {
        const result = await deleteUserAddress(addressId);
        if (result.success) {
            const addresses = await loadUserAddresses();
            renderAddressesList(addresses);
        }
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupAuthEventListeners() {
    // OTP Input Handling
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Profile Form Submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                full_name: document.getElementById('profileName').value,
                email: document.getElementById('profileEmail').value
            };
            
            const result = await updateUserProfile(updates);
            if (result.success) {
                closeProfileModal();
                updateUIForLoggedInUser();
            }
        });
    }

    // Address Form Submit
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const addressData = {
                label: document.getElementById('addressLabel').value,
                full_name: document.getElementById('addressFullName').value,
                phone_number: document.getElementById('addressPhone').value,
                area: document.getElementById('addressArea').value,
                street_address: document.getElementById('addressStreet').value,
                building: document.getElementById('addressBuilding').value || null,
                floor: document.getElementById('addressFloor').value || null,
                apartment: document.getElementById('addressApartment').value || null,
                landmark: document.getElementById('addressLandmark').value || null,
                is_default: document.getElementById('addressDefault').checked
            };
            
            const addressId = document.getElementById('addressId').value;
            
            let result;
            if (addressId) {
                result = await updateUserAddress(addressId, addressData);
            } else {
                result = await addUserAddress(addressData);
            }
            
            if (result.success) {
                hideAddressForm();
                const addresses = await loadUserAddresses();
                renderAddressesList(addresses);
            }
        });
    }
}

// Make functions globally available
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleSendOTP = handleSendOTP;
window.handleVerifyOTP = handleVerifyOTP;
window.signInWithGoogle = signInWithGoogle;
window.showProfile = showProfile;
window.closeProfileModal = closeProfileModal;
window.showAddresses = showAddresses;
window.closeAddressesModal = closeAddressesModal;
window.showAddAddressForm = showAddAddressForm;
window.hideAddressForm = hideAddressForm;
window.editAddress = editAddress;
window.confirmDeleteAddress = confirmDeleteAddress;
window.setDefaultAddress = setDefaultAddress;

// ============================================
// INITIALIZATION
// ============================================

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAuth();
        setupAuthEventListeners();
    });
} else {
    initAuth();
    // Setup event listeners after components are loaded
    setTimeout(setupAuthEventListeners, 100);
}
