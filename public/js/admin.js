// Admin Dashboard functionality

let receiptsData = [];
let currentFilters = {
    trip: '',
    status: '',
    category: ''
};

// Initialize admin page
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Check if user is admin
        const isAdminUser = await isAdmin();
        if (!isAdminUser) {
            showNotification('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }

        await initializeAdminPage();
    }
});

async function initializeAdminPage() {
    // Load trips into filter
    const tripFilter = document.getElementById('tripFilter');
    await loadTrips(tripFilter);

    // Setup filter listeners
    document.getElementById('tripFilter').addEventListener('change', handleFilterChange);
    document.getElementById('statusFilter').addEventListener('change', handleFilterChange);
    document.getElementById('categoryFilter').addEventListener('change', handleFilterChange);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadReceipts);

    // User management
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);

    // Load initial data
    await loadReceipts();
    await loadStats();
    await loadUsers();

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('receiptModal').addEventListener('click', (e) => {
        if (e.target.id === 'receiptModal') {
            closeModal();
        }
    });
}

function handleFilterChange(e) {
    currentFilters[e.target.id.replace('Filter', '')] = e.target.value;
    displayReceipts();
}

async function loadStats() {
    try {
        const receiptsSnapshot = await db.collection(COLLECTIONS.RECEIPTS).get();

        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let totalAmount = 0;

        receiptsSnapshot.forEach(doc => {
            const receipt = doc.data();
            const status = receipt.status;

            if (status === STATUS.PENDING) pendingCount++;
            else if (status === STATUS.APPROVED) approvedCount++;
            else if (status === STATUS.REJECTED) rejectedCount++;

            if (status === STATUS.APPROVED) {
                totalAmount += receipt.amount || 0;
            }
        });

        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
        document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadReceipts() {
    try {
        const receiptsTable = document.getElementById('receiptsTable');
        receiptsTable.innerHTML = '<p class="loading">Loading receipts...</p>';

        const receiptsSnapshot = await db.collection(COLLECTIONS.RECEIPTS)
            .orderBy('createdAt', 'desc')
            .get();

        receiptsData = [];
        receiptsSnapshot.forEach(doc => {
            receiptsData.push({ id: doc.id, ...doc.data() });
        });

        displayReceipts();

    } catch (error) {
        console.error('Error loading receipts:', error);
        document.getElementById('receiptsTable').innerHTML = '<p class="info-text">Failed to load receipts</p>';
    }
}

function displayReceipts() {
    const receiptsTable = document.getElementById('receiptsTable');

    // Apply filters
    let filteredReceipts = receiptsData.filter(receipt => {
        if (currentFilters.trip && receipt.tripId !== currentFilters.trip) return false;
        if (currentFilters.status && receipt.status !== currentFilters.status) return false;
        if (currentFilters.category && receipt.category !== currentFilters.category) return false;
        return true;
    });

    if (filteredReceipts.length === 0) {
        receiptsTable.innerHTML = '<p class="info-text">No receipts found</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredReceipts.forEach(receipt => {
        html += `
            <tr>
                <td>${formatDate(receipt.date)}</td>
                <td>${receipt.memberName}</td>
                <td>${receipt.description}</td>
                <td>${getCategoryIcon(receipt.category)} ${receipt.category}</td>
                <td>${formatCurrency(receipt.amount)}</td>
                <td>${getStatusBadge(receipt.status)}</td>
                <td>
                    <button class="btn btn-sm" onclick="viewReceipt('${receipt.id}')">View</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    receiptsTable.innerHTML = html;
}

async function viewReceipt(receiptId) {
    const receipt = receiptsData.find(r => r.id === receiptId);
    if (!receipt) return;

    const modal = document.getElementById('receiptModal');
    const modalBody = document.getElementById('modalBody');

    let html = `
        <div class="receipt-details">
            <div class="detail-row">
                <strong>Uploaded by:</strong>
                <span>${receipt.memberName} (${receipt.uploaderEmail})</span>
            </div>
            <div class="detail-row">
                <strong>Date:</strong>
                <span>${formatDate(receipt.date)}</span>
            </div>
            <div class="detail-row">
                <strong>Category:</strong>
                <span>${getCategoryIcon(receipt.category)} ${receipt.category}</span>
            </div>
            <div class="detail-row">
                <strong>Amount:</strong>
                <span>${formatCurrency(receipt.amount)}</span>
            </div>
            <div class="detail-row">
                <strong>Description:</strong>
                <span>${receipt.description}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span>${getStatusBadge(receipt.status)}</span>
            </div>
            <div class="detail-row">
                <strong>Receipt File:</strong>
                <a href="${receipt.fileUrl}" target="_blank" class="btn btn-sm">View Receipt</a>
            </div>
            ${receipt.verifiedBy ? `
                <div class="detail-row">
                    <strong>Verified by:</strong>
                    <span>${receipt.verifiedBy} at ${formatDateTime(receipt.verifiedAt)}</span>
                </div>
            ` : ''}
            ${receipt.adminComment ? `
                <div class="detail-row">
                    <strong>Admin Comment:</strong>
                    <span>${receipt.adminComment}</span>
                </div>
            ` : ''}
        </div>
    `;

    modalBody.innerHTML = html;

    // Setup approval/rejection buttons
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    approveBtn.onclick = () => updateReceiptStatus(receiptId, STATUS.APPROVED);
    rejectBtn.onclick = () => updateReceiptStatus(receiptId, STATUS.REJECTED);

    // Show/hide buttons based on status
    if (receipt.status !== STATUS.PENDING) {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'inline-flex';
        rejectBtn.style.display = 'inline-flex';
    }

    modal.classList.remove('hidden');
}

async function updateReceiptStatus(receiptId, status) {
    try {
        const adminComment = document.getElementById('adminComment').value;
        const user = auth.currentUser;
        const userData = await getCurrentUser();

        await db.collection(COLLECTIONS.RECEIPTS).doc(receiptId).update({
            status: status,
            verifiedBy: userData.name,
            verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
            adminComment: adminComment || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Log audit
        await logAudit('receipt_' + status, {
            receiptId: receiptId,
            comment: adminComment
        });

        showNotification(`Receipt ${status}!`, 'success');
        closeModal();
        await loadReceipts();
        await loadStats();

    } catch (error) {
        console.error('Error updating receipt:', error);
        showNotification('Failed to update receipt: ' + error.message, 'error');
    }
}

function closeModal() {
    document.getElementById('receiptModal').classList.add('hidden');
    document.getElementById('adminComment').value = '';
}

async function loadUsers() {
    try {
        const usersList = document.getElementById('usersList');
        const usersSnapshot = await db.collection(COLLECTIONS.USERS)
            .orderBy('createdAt', 'desc')
            .get();

        if (usersSnapshot.empty) {
            usersList.innerHTML = '<p class="info-text">No users found</p>';
            return;
        }

        let html = '<div style="margin-top: 1rem;">';
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            html += `
                <div style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--gray-200);">
                    <div>
                        <strong>${user.name}</strong><br>
                        <small>${user.email}</small>
                    </div>
                    <div>
                        <span class="status-badge ${user.role === ROLES.ADMIN ? 'status-approved' : 'status-pending'}">${user.role}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        usersList.innerHTML = html;

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function handleAddUser(e) {
    e.preventDefault();

    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;

    try {
        // Note: This creates a user profile, but the user must sign up themselves
        // This is a limitation of client-side Firebase - you'd need Cloud Functions for full user creation

        showNotification('User role settings saved. User must sign up with this email.', 'info');

        // You could store pending user roles here
        await db.collection('pending_users').add({
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('addUserForm').reset();

    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Failed to add user: ' + error.message, 'error');
    }
}

// Make viewReceipt available globally
window.viewReceipt = viewReceipt;
