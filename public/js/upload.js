// Receipt Upload functionality

let selectedFile = null;

// Initialize upload page
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeUploadPage();
    }
});

async function initializeUploadPage() {
    // Load trips
    const tripSelect = document.getElementById('tripSelect');
    await loadTrips(tripSelect);

    // Pre-fill member name
    const userData = await getCurrentUser();
    document.getElementById('memberName').value = userData?.name || '';

    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();

    // File upload handlers
    setupFileUpload();

    // Form submission
    document.getElementById('receiptForm').addEventListener('submit', handleReceiptSubmit);
}

function setupFileUpload() {
    const fileInput = document.getElementById('receiptFile');
    const uploadArea = document.getElementById('fileUploadArea');
    const placeholder = uploadArea.querySelector('.file-upload-placeholder');
    const preview = document.getElementById('filePreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const removeBtn = document.getElementById('removeFile');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (!e.target.closest('#removeFile')) {
            fileInput.click();
        }
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gray-300)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gray-300)';

        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(file);
        }
    });

    // Remove file
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        placeholder.classList.remove('hidden');
        preview.classList.add('hidden');
        previewImage.src = '';
    });

    function handleFileSelect(file) {
        const validation = validateFile(file);

        if (!validation.valid) {
            showNotification(validation.error, 'error');
            return;
        }

        selectedFile = file;
        fileName.textContent = file.name;

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            previewImage.classList.add('hidden');
        }

        placeholder.classList.add('hidden');
        preview.classList.remove('hidden');
    }
}

async function handleReceiptSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const uploadProgress = document.getElementById('uploadProgress');

    // Validate file
    if (!selectedFile) {
        showNotification('Please select a receipt file', 'error');
        return;
    }

    // Get form data
    const formData = {
        tripId: document.getElementById('tripSelect').value,
        memberName: document.getElementById('memberName').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('date').value)),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value
    };

    // Validate
    if (!formData.tripId) {
        showNotification('Please select a trip', 'error');
        return;
    }

    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        uploadProgress.classList.remove('hidden');

        // Upload file to Firebase Storage
        const user = auth.currentUser;
        const fileName = `receipts/${user.uid}/${Date.now()}_${selectedFile.name}`;
        const fileUrl = await uploadFile(selectedFile, fileName);

        // Create receipt document
        const receiptData = {
            ...formData,
            uploaderId: user.uid,
            uploaderEmail: user.email,
            fileUrl: fileUrl,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            status: STATUS.PENDING,
            currency: APP_CONFIG.CURRENCY,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const receiptRef = await db.collection(COLLECTIONS.RECEIPTS).add(receiptData);

        // Log audit
        await logAudit('receipt_uploaded', {
            receiptId: receiptRef.id,
            amount: formData.amount,
            category: formData.category
        });

        showNotification('Receipt uploaded successfully!', 'success');

        // Reset form
        document.getElementById('receiptForm').reset();
        selectedFile = null;
        document.querySelector('.file-upload-placeholder').classList.remove('hidden');
        document.getElementById('filePreview').classList.add('hidden');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Failed to upload receipt: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        uploadProgress.classList.add('hidden');
    }
}
