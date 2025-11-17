// Dashboard functionality

let currentTripId = null;

// Initialize dashboard
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeDashboard();
    }
});

async function initializeDashboard() {
    try {
        // Load trips
        const tripSelect = document.getElementById('tripSelect');
        await loadTrips(tripSelect);

        // Set current trip (first one by default)
        if (tripSelect.options.length > 1) {
            currentTripId = tripSelect.value || tripSelect.options[1].value;
            tripSelect.value = currentTripId;
        }

        // Load dashboard data
        await loadDashboardData();

        // Trip change listener
        tripSelect.addEventListener('change', async (e) => {
            currentTripId = e.target.value;
            await loadDashboardData();
        });

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

async function loadDashboardData() {
    if (!currentTripId) return;

    await Promise.all([
        loadStats(),
        loadRecentReceipts(),
        loadCategoryBreakdown(),
        loadRecentTransfers()
    ]);
}

async function loadStats() {
    try {
        const user = auth.currentUser;

        // Get all receipts for this trip
        const receiptsSnapshot = await db.collection(COLLECTIONS.RECEIPTS)
            .where('tripId', '==', currentTripId)
            .get();

        let totalExpenses = 0;
        let myUploads = 0;
        let pendingCount = 0;
        let approvedCount = 0;

        receiptsSnapshot.forEach(doc => {
            const receipt = doc.data();
            totalExpenses += receipt.amount || 0;

            if (receipt.uploaderId === user.uid) {
                myUploads++;
            }

            if (receipt.status === STATUS.PENDING) {
                pendingCount++;
            } else if (receipt.status === STATUS.APPROVED) {
                approvedCount++;
            }
        });

        // Update UI
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('myUploads').textContent = myUploads;
        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedCount').textContent = approvedCount;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentReceipts() {
    try {
        const user = auth.currentUser;
        const receiptsContainer = document.getElementById('recentReceipts');

        const receiptsSnapshot = await db.collection(COLLECTIONS.RECEIPTS)
            .where('tripId', '==', currentTripId)
            .where('uploaderId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (receiptsSnapshot.empty) {
            receiptsContainer.innerHTML = '<p class="info-text">No receipts uploaded yet. <a href="upload.html">Upload your first receipt</a></p>';
            return;
        }

        let html = '';
        receiptsSnapshot.forEach(doc => {
            const receipt = doc.data();
            html += `
                <div class="receipt-item">
                    <div class="receipt-info">
                        <h4>${getCategoryIcon(receipt.category)} ${receipt.description}</h4>
                        <div class="receipt-meta">
                            <span>📅 ${formatDate(receipt.date)}</span>
                            <span>${getStatusBadge(receipt.status)}</span>
                        </div>
                    </div>
                    <div class="receipt-amount">${formatCurrency(receipt.amount)}</div>
                </div>
            `;
        });

        receiptsContainer.innerHTML = html;

    } catch (error) {
        console.error('Error loading receipts:', error);
        document.getElementById('recentReceipts').innerHTML = '<p class="info-text">Failed to load receipts</p>';
    }
}

async function loadCategoryBreakdown() {
    try {
        const categoryContainer = document.getElementById('categoryBreakdown');

        const receiptsSnapshot = await db.collection(COLLECTIONS.RECEIPTS)
            .where('tripId', '==', currentTripId)
            .where('status', '==', STATUS.APPROVED)
            .get();

        const categoryTotals = {
            travel: 0,
            food: 0,
            accommodation: 0,
            misc: 0
        };

        receiptsSnapshot.forEach(doc => {
            const receipt = doc.data();
            if (categoryTotals.hasOwnProperty(receipt.category)) {
                categoryTotals[receipt.category] += receipt.amount || 0;
            }
        });

        let html = '';
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > 0) {
                html += `
                    <div class="category-item">
                        <span class="category-name">${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                        <span class="category-amount">${formatCurrency(amount)}</span>
                    </div>
                `;
            }
        }

        categoryContainer.innerHTML = html || '<p class="info-text">No approved expenses yet</p>';

    } catch (error) {
        console.error('Error loading category breakdown:', error);
        document.getElementById('categoryBreakdown').innerHTML = '<p class="info-text">Failed to load categories</p>';
    }
}

async function loadRecentTransfers() {
    try {
        const transfersContainer = document.getElementById('recentTransfers');

        const transfersSnapshot = await db.collection(COLLECTIONS.TRANSFERS)
            .where('tripId', '==', currentTripId)
            .orderBy('date', 'desc')
            .limit(5)
            .get();

        if (transfersSnapshot.empty) {
            transfersContainer.innerHTML = '<p class="info-text">No transfers recorded yet. <a href="transfers.html">Add a transfer</a></p>';
            return;
        }

        let html = '';
        transfersSnapshot.forEach(doc => {
            const transfer = doc.data();
            html += `
                <div class="transfer-item">
                    <div class="transfer-info">
                        <h4>💸 ${transfer.payerName} → ${transfer.payeeName}</h4>
                        <div class="transfer-meta">
                            <span>📅 ${formatDate(transfer.date)}</span>
                            ${transfer.txnId ? `<span>🔖 ${transfer.txnId}</span>` : ''}
                        </div>
                    </div>
                    <div class="transfer-amount">${formatCurrency(transfer.amount)}</div>
                </div>
            `;
        });

        transfersContainer.innerHTML = html;

    } catch (error) {
        console.error('Error loading transfers:', error);
        document.getElementById('recentTransfers').innerHTML = '<p class="info-text">Failed to load transfers</p>';
    }
}
