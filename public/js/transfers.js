// Transfers functionality

let selectedProofFile = null;
let currentTripFilter = '';

// Initialize transfers page
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeTransfersPage();
    }
});

async function initializeTransfersPage() {
    // Load trips
    const tripSelect = document.getElementById('tripSelect');
    const filterTrip = document.getElementById('filterTrip');

    await loadTrips(tripSelect);
    await loadTrips(filterTrip);

    // Pre-fill payer name
    const userData = await getCurrentUser();
    document.getElementById('payerName').value = userData?.name || '';

    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();

    // Setup file upload
    setupProofUpload();

    // Form submission
    document.getElementById('transferForm').addEventListener('submit', handleTransferSubmit);

    // Filter listener
    filterTrip.addEventListener('change', async (e) => {
        currentTripFilter = e.target.value;
        await loadTransfersList();
    });

    // Load initial transfers
    await loadTransfersList();
}

function setupProofUpload() {
    const fileInput = document.getElementById('proofFile');
    const uploadArea = document.getElementById('fileUploadArea');
    const placeholder = uploadArea.querySelector('.file-upload-placeholder');
    const preview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const removeBtn = document.getElementById('removeFile');

    uploadArea.addEventListener('click', (e) => {
        if (!e.target.closest('#removeFile')) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = validateFile(file);
            if (!validation.valid) {
                showNotification(validation.error, 'error');
                return;
            }

            selectedProofFile = file;
            fileName.textContent = file.name;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        }
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedProofFile = null;
        fileInput.value = '';
        placeholder.classList.remove('hidden');
        preview.classList.add('hidden');
    });
}

async function handleTransferSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const uploadProgress = document.getElementById('uploadProgress');

    // Get form data
    const formData = {
        tripId: document.getElementById('tripSelect').value,
        payerName: document.getElementById('payerName').value,
        payeeName: document.getElementById('payeeName').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('date').value)),
        txnId: document.getElementById('txnId').value,
        notes: document.getElementById('notes').value
    };

    // Validate
    if (!formData.tripId) {
        showNotification('Please select a trip', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        uploadProgress.classList.remove('hidden');

        // Upload proof file if selected
        let proofUrl = null;
        if (selectedProofFile) {
            const user = auth.currentUser;
            const fileName = `transfers/${user.uid}/${Date.now()}_${selectedProofFile.name}`;
            proofUrl = await uploadFile(selectedProofFile, fileName);
        }

        // Create transfer document
        const transferData = {
            ...formData,
            payerId: auth.currentUser.uid,
            payerEmail: auth.currentUser.email,
            proofUrl: proofUrl,
            currency: APP_CONFIG.CURRENCY,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const transferRef = await db.collection(COLLECTIONS.TRANSFERS).add(transferData);

        // Log audit
        await logAudit('transfer_recorded', {
            transferId: transferRef.id,
            amount: formData.amount,
            from: formData.payerName,
            to: formData.payeeName
        });

        showNotification('Transfer recorded successfully!', 'success');

        // Reset form
        document.getElementById('transferForm').reset();
        selectedProofFile = null;
        document.querySelector('#fileUploadArea .file-upload-placeholder').classList.remove('hidden');
        document.getElementById('filePreview').classList.add('hidden');

        // Reload transfers list
        await loadTransfersList();

    } catch (error) {
        console.error('Transfer submission error:', error);
        showNotification('Failed to record transfer: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        uploadProgress.classList.add('hidden');
    }
}

async function loadTransfersList() {
    try {
        const transfersList = document.getElementById('transfersList');
        transfersList.innerHTML = '<p class="loading">Loading transfers...</p>';

        let query = db.collection(COLLECTIONS.TRANSFERS)
            .orderBy('date', 'desc');

        if (currentTripFilter) {
            query = query.where('tripId', '==', currentTripFilter);
        }

        const transfersSnapshot = await query.limit(50).get();

        if (transfersSnapshot.empty) {
            transfersList.innerHTML = '<p class="info-text">No transfers recorded yet</p>';
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
                            ${transfer.notes ? `<span>📝 ${transfer.notes}</span>` : ''}
                        </div>
                        ${transfer.proofUrl ? `<a href="${transfer.proofUrl}" target="_blank" class="btn btn-sm" style="margin-top: 0.5rem;">View Proof</a>` : ''}
                    </div>
                    <div class="transfer-amount">${formatCurrency(transfer.amount)}</div>
                </div>
            `;
        });

        transfersList.innerHTML = html;

    } catch (error) {
        console.error('Error loading transfers:', error);
        document.getElementById('transfersList').innerHTML = '<p class="info-text">Failed to load transfers</p>';
    }
}
