// ============================================
// FIREBASE CONFIGURATION
// FREE Phone Authentication - 10,000 SMS/month
// ============================================

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console: https://console.firebase.google.com/
// Project Settings > General > Your apps > SDK setup and configuration


const firebaseConfig = {
  apiKey: "AIzaSyBdVrjQjKjUJNw3jnjMflH3jMZyoBnA8yc",
  authDomain: "alsarayabutchery-1027b.firebaseapp.com",
  projectId: "alsarayabutchery-1027b",
  storageBucket: "alsarayabutchery-1027b.firebasestorage.app",
  messagingSenderId: "484023850688",
  appId: "1:484023850688:web:b933a4474e01a8689c3f25"
};
// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully - FREE phone auth ready!');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// ============================================
// SETUP INSTRUCTIONS:
// ============================================
// 
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" or select existing project
// 3. Enable Authentication:
//    - Go to Build > Authentication > Get started
//    - Click "Phone" provider
//    - Toggle enable and save
// 4. Add your domain to authorized domains:
//    - In Authentication > Settings > Authorized domains
//    - Add your domain (e.g., alsarayabutchery.com)
//    - For testing: localhost is already authorized
// 5. Get configuration:
//    - Go to Project Settings (gear icon)
//    - Scroll to "Your apps"
//    - Click "</>" for web app
//    - Copy firebaseConfig values
// 6. Paste the values above
// 7. DONE! You get 10,000 FREE phone verifications/month
//
// ============================================
