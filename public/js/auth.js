// Authentication Logic

// Check if user is already logged in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in, redirect to dashboard
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Google Sign In
document.getElementById('googleSignIn')?.addEventListener('click', async () => {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;

        // Create or update user document in Firestore
        await createUserProfile(user);

        showNotification('Successfully signed in!', 'success');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification('Failed to sign in with Google: ' + error.message, 'error');
    }
});

// Email/Password Sign In
document.getElementById('emailLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        const user = result.user;

        showNotification('Successfully signed in!', 'success');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Email sign-in error:', error);

        // If user doesn't exist, create account
        if (error.code === 'auth/user-not-found') {
            try {
                const result = await auth.createUserWithEmailAndPassword(email, password);
                const user = result.user;

                await createUserProfile(user);

                showNotification('Account created successfully!', 'success');
                window.location.href = 'dashboard.html';
            } catch (signupError) {
                console.error('Sign-up error:', signupError);
                showNotification('Failed to create account: ' + signupError.message, 'error');
            }
        } else {
            showNotification('Sign-in failed: ' + error.message, 'error');
        }
    }
});

// Toggle between sign-in and sign-up
document.getElementById('toggleSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    const form = document.getElementById('emailLoginForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const toggleText = document.getElementById('toggleSignup');

    if (submitBtn.textContent === 'Sign In') {
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account? Sign in';
    } else {
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = 'Sign up';
    }
});

// Create user profile in Firestore
async function createUserProfile(user) {
    const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        await userRef.set({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: ROLES.MEMBER, // Default role
            photoURL: user.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Log the creation
        await logAudit('user_created', { userId: user.uid, email: user.email });
    } else {
        // Update last login
        await userRef.update({
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

// Logout functionality (used on other pages)
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showNotification('Logged out successfully', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Failed to log out', 'error');
    }
});

// Audit logging function
async function logAudit(action, data) {
    try {
        await db.collection(COLLECTIONS.AUDIT_LOG).add({
            action: action,
            userId: auth.currentUser?.uid || 'anonymous',
            userEmail: auth.currentUser?.email || 'anonymous',
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}
