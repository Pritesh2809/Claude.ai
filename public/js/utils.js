// Utility Functions

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(date) {
    if (!date) return '';

    if (date.toDate) {
        date = date.toDate(); // Firestore timestamp
    } else if (typeof date === 'string') {
        date = new Date(date);
    }

    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Format datetime
function formatDateTime(date) {
    if (!date) return '';

    if (date.toDate) {
        date = date.toDate();
    } else if (typeof date === 'string') {
        date = new Date(date);
    }

    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Get current user data
async function getCurrentUser() {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
    return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
}

// Check if user is admin
async function isAdmin() {
    const userData = await getCurrentUser();
    return userData?.role === ROLES.ADMIN;
}

// Update user info in navbar
async function updateNavbar() {
    const user = auth.currentUser;
    if (!user) return;

    const userData = await getCurrentUser();
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = userData?.name || user.email;
    }

    // Show/hide admin link
    const adminLinks = document.querySelectorAll('.admin-only');
    if (userData?.role === ROLES.ADMIN) {
        adminLinks.forEach(link => link.classList.remove('hidden'));
    }
}

// Validate file
function validateFile(file) {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
        return { valid: false, error: `File size must be less than ${APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    if (!APP_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Only JPG, PNG, and PDF are allowed' };
    }

    return { valid: true };
}

// Upload file to Firebase Storage
async function uploadFile(file, path) {
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const storageRef = storage.ref();
    const fileRef = storageRef.child(path);

    const uploadTask = fileRef.put(file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // Update progress if there's a progress element
                const progressElement = document.getElementById('progressPercent');
                if (progressElement) {
                    progressElement.textContent = Math.round(progress) + '%';
                }
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                resolve(downloadURL);
            }
        );
    });
}

// Load trips into select element
async function loadTrips(selectElement) {
    try {
        const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS)
            .orderBy('startDate', 'desc')
            .get();

        selectElement.innerHTML = '<option value="">Select trip...</option>';

        tripsSnapshot.forEach(doc => {
            const trip = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${trip.name} (${formatDate(trip.startDate)} - ${formatDate(trip.endDate)})`;
            selectElement.appendChild(option);
        });

        // If no trips exist, create a default one
        if (tripsSnapshot.empty) {
            await createDefaultTrip();
            await loadTrips(selectElement); // Reload
        }
    } catch (error) {
        console.error('Error loading trips:', error);
        showNotification('Failed to load trips', 'error');
    }
}

// Create default trip if none exists
async function createDefaultTrip() {
    try {
        const tripRef = await db.collection(COLLECTIONS.TRIPS).add({
            name: 'Mumbai Trip 2024',
            startDate: firebase.firestore.Timestamp.fromDate(new Date('2024-01-01')),
            endDate: firebase.firestore.Timestamp.fromDate(new Date('2024-01-10')),
            members: [],
            createdBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await logAudit('trip_created', { tripId: tripRef.id, name: 'Mumbai Trip 2024' });
    } catch (error) {
        console.error('Error creating default trip:', error);
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="status-badge status-pending">Pending</span>',
        approved: '<span class="status-badge status-approved">Approved</span>',
        rejected: '<span class="status-badge status-rejected">Rejected</span>'
    };
    return badges[status] || '';
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        travel: '🚗',
        food: '🍽️',
        accommodation: '🏨',
        misc: '📦'
    };
    return icons[category] || '📦';
}

// Show notification
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

// Initialize common functionality
auth.onAuthStateChanged(async (user) => {
    if (user && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        await updateNavbar();
    }
});
