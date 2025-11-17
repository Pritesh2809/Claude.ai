// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from Firebase Console > Project Settings > Your apps > Firebase SDK snippet

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// App configuration
const APP_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    CURRENCY: 'INR',
    COLLEGE_NAME: 'Your College Name',
    TRIP_NAME: 'Mumbai Trip 2024'
};

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    TRIPS: 'trips',
    RECEIPTS: 'receipts',
    TRANSFERS: 'transfers',
    AUDIT_LOG: 'audit_log'
};

// User roles
const ROLES = {
    MEMBER: 'member',
    ADMIN: 'admin',
    VIEWER: 'viewer'
};

// Receipt statuses
const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Categories
const CATEGORIES = {
    TRAVEL: 'travel',
    FOOD: 'food',
    ACCOMMODATION: 'accommodation',
    MISC: 'misc'
};

// Category labels with emojis
const CATEGORY_LABELS = {
    travel: '🚗 Travel',
    food: '🍽️ Food',
    accommodation: '🏨 Accommodation',
    misc: '📦 Miscellaneous'
};
