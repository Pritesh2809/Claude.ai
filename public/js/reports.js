// Reports and Export functionality

let currentReportData = null;

// Initialize reports page
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeReportsPage();
    }
});

async function initializeReportsPage() {
    // Load trips
    const tripSelect = document.getElementById('tripSelect');
    await loadTrips(tripSelect);

    // Event listeners
    document.getElementById('previewBtn').addEventListener('click', generatePreview);
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('refreshPreview')?.addEventListener('click', generatePreview);
}

async function generatePreview() {
    const tripId = document.getElementById('tripSelect').value;
    const status = document.getElementById('reportStatus').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const includeTransfers = document.getElementById('includeTransfers').checked;

    if (!tripId) {
        showNotification('Please select a trip', 'error');
        return;
    }

    try {
        // Fetch trip data
        const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(tripId).get();
        const tripData = tripDoc.data();

        // Fetch receipts
        let receiptsQuery = db.collection(COLLECTIONS.RECEIPTS)
            .where('tripId', '==', tripId);

        if (status !== 'all') {
            receiptsQuery = receiptsQuery.where('status', '==', status);
        }

        const receiptsSnapshot = await receiptsQuery.get();
        let receipts = [];

        receiptsSnapshot.forEach(doc => {
            const receipt = { id: doc.id, ...doc.data() };

            // Apply date filters
            if (dateFrom || dateTo) {
                const receiptDate = receipt.date.toDate();
                if (dateFrom && receiptDate < new Date(dateFrom)) return;
                if (dateTo && receiptDate > new Date(dateTo)) return;
            }

            receipts.push(receipt);
        });

        // Fetch transfers if needed
        let transfers = [];
        if (includeTransfers) {
            const transfersSnapshot = await db.collection(COLLECTIONS.TRANSFERS)
                .where('tripId', '==', tripId)
                .get();

            transfersSnapshot.forEach(doc => {
                const transfer = { id: doc.id, ...doc.data() };

                // Apply date filters
                if (dateFrom || dateTo) {
                    const transferDate = transfer.date.toDate();
                    if (dateFrom && transferDate < new Date(dateFrom)) return;
                    if (dateTo && transferDate > new Date(dateTo)) return;
                }

                transfers.push(transfer);
            });
        }

        // Calculate totals
        const categoryTotals = {
            travel: 0,
            food: 0,
            accommodation: 0,
            misc: 0
        };

        let totalExpenses = 0;
        receipts.forEach(receipt => {
            totalExpenses += receipt.amount;
            if (categoryTotals.hasOwnProperty(receipt.category)) {
                categoryTotals[receipt.category] += receipt.amount;
            }
        });

        const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);

        // Store report data
        currentReportData = {
            trip: tripData,
            tripId: tripId,
            receipts: receipts,
            transfers: transfers,
            categoryTotals: categoryTotals,
            totalExpenses: totalExpenses,
            totalTransfers: totalTransfers,
            generatedAt: new Date(),
            filters: { status, dateFrom, dateTo, includeTransfers }
        };

        // Display summary
        displaySummary();

        // Display preview
        displayPreview();

    } catch (error) {
        console.error('Error generating preview:', error);
        showNotification('Failed to generate preview: ' + error.message, 'error');
    }
}

function displaySummary() {
    const summaryDiv = document.getElementById('reportSummary');

    const html = `
        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <div class="stat-card">
                <h3>Total Receipts</h3>
                <p class="stat-value">${currentReportData.receipts.length}</p>
            </div>
            <div class="stat-card">
                <h3>Total Expenses</h3>
                <p class="stat-value">${formatCurrency(currentReportData.totalExpenses)}</p>
            </div>
            <div class="stat-card">
                <h3>Total Transfers</h3>
                <p class="stat-value">${formatCurrency(currentReportData.totalTransfers)}</p>
            </div>
            <div class="stat-card">
                <h3>Net Amount</h3>
                <p class="stat-value">${formatCurrency(currentReportData.totalExpenses + currentReportData.totalTransfers)}</p>
            </div>
        </div>

        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Category Breakdown</h3>
        <div class="category-breakdown">
            ${Object.entries(currentReportData.categoryTotals)
                .filter(([_, amount]) => amount > 0)
                .map(([category, amount]) => `
                    <div class="category-item">
                        <span class="category-name">${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                        <span class="category-amount">${formatCurrency(amount)}</span>
                    </div>
                `).join('')}
        </div>
    `;

    summaryDiv.innerHTML = html;
}

function displayPreview() {
    const previewDiv = document.getElementById('reportPreview');
    const previewContent = document.getElementById('previewContent');

    let html = `
        <div class="report-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem; background: var(--gray-50); border-radius: var(--border-radius);">
            <h1>${APP_CONFIG.COLLEGE_NAME}</h1>
            <h2>${currentReportData.trip.name}</h2>
            <p>${formatDate(currentReportData.trip.startDate)} - ${formatDate(currentReportData.trip.endDate)}</p>
            <p style="color: var(--gray-600); margin-top: 0.5rem;">Generated on: ${formatDateTime(currentReportData.generatedAt)}</p>
        </div>

        <h3>Receipts (${currentReportData.receipts.length})</h3>
        <table style="width: 100%; margin-bottom: 2rem; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--gray-50);">
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Date</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Member</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Description</th>
                    <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Category</th>
                    <th style="padding: 0.75rem; text-align: right; border: 1px solid var(--gray-200);">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${currentReportData.receipts.map(receipt => `
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${formatDate(receipt.date)}</td>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${receipt.memberName}</td>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${receipt.description}</td>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${receipt.category}</td>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: right;">${formatCurrency(receipt.amount)}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background: var(--gray-50);">
                    <td colspan="4" style="padding: 0.75rem; border: 1px solid var(--gray-200);">Total Expenses</td>
                    <td style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: right;">${formatCurrency(currentReportData.totalExpenses)}</td>
                </tr>
            </tbody>
        </table>
    `;

    if (currentReportData.transfers.length > 0) {
        html += `
            <h3>Transfers (${currentReportData.transfers.length})</h3>
            <table style="width: 100%; margin-bottom: 2rem; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--gray-50);">
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Date</th>
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">From</th>
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">To</th>
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--gray-200);">Txn ID</th>
                        <th style="padding: 0.75rem; text-align: right; border: 1px solid var(--gray-200);">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentReportData.transfers.map(transfer => `
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${formatDate(transfer.date)}</td>
                            <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${transfer.payerName}</td>
                            <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${transfer.payeeName}</td>
                            <td style="padding: 0.75rem; border: 1px solid var(--gray-200);">${transfer.txnId || '-'}</td>
                            <td style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: right;">${formatCurrency(transfer.amount)}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background: var(--gray-50);">
                        <td colspan="4" style="padding: 0.75rem; border: 1px solid var(--gray-200);">Total Transfers</td>
                        <td style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: right;">${formatCurrency(currentReportData.totalTransfers)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    previewContent.innerHTML = html;
    previewDiv.style.display = 'block';
}

async function exportToPDF() {
    if (!currentReportData) {
        showNotification('Please generate a preview first', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(APP_CONFIG.COLLEGE_NAME, 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text(currentReportData.trip.name, 105, 30, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`${formatDate(currentReportData.trip.startDate)} - ${formatDate(currentReportData.trip.endDate)}`, 105, 38, { align: 'center' });
        doc.text(`Generated: ${formatDateTime(currentReportData.generatedAt)}`, 105, 44, { align: 'center' });

        // Receipts table
        const receiptsData = currentReportData.receipts.map(r => [
            formatDate(r.date),
            r.memberName,
            r.description,
            r.category,
            formatCurrency(r.amount)
        ]);

        doc.autoTable({
            startY: 55,
            head: [['Date', 'Member', 'Description', 'Category', 'Amount']],
            body: receiptsData,
            foot: [['', '', '', 'Total:', formatCurrency(currentReportData.totalExpenses)]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        // Transfers table (if any)
        if (currentReportData.transfers.length > 0) {
            const transfersData = currentReportData.transfers.map(t => [
                formatDate(t.date),
                t.payerName,
                t.payeeName,
                t.txnId || '-',
                formatCurrency(t.amount)
            ]);

            const finalY = doc.lastAutoTable.finalY || 55;

            doc.autoTable({
                startY: finalY + 15,
                head: [['Date', 'From', 'To', 'Txn ID', 'Amount']],
                body: transfersData,
                foot: [['', '', '', 'Total:', formatCurrency(currentReportData.totalTransfers)]],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
            });
        }

        // Save PDF
        const fileName = `${currentReportData.trip.name.replace(/\s+/g, '_')}_Report_${new Date().getTime()}.pdf`;
        doc.save(fileName);

        showNotification('PDF exported successfully!', 'success');

        // Log audit
        await logAudit('report_exported', {
            format: 'pdf',
            tripId: currentReportData.tripId,
            receiptsCount: currentReportData.receipts.length,
            transfersCount: currentReportData.transfers.length
        });

    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to export PDF: ' + error.message, 'error');
    }
}

async function exportToCSV() {
    if (!currentReportData) {
        showNotification('Please generate a preview first', 'error');
        return;
    }

    try {
        let csv = '';

        // Header
        csv += `${APP_CONFIG.COLLEGE_NAME}\n`;
        csv += `${currentReportData.trip.name}\n`;
        csv += `${formatDate(currentReportData.trip.startDate)} - ${formatDate(currentReportData.trip.endDate)}\n`;
        csv += `Generated: ${formatDateTime(currentReportData.generatedAt)}\n\n`;

        // Receipts
        csv += 'RECEIPTS\n';
        csv += 'Date,Member,Description,Category,Amount\n';

        currentReportData.receipts.forEach(receipt => {
            csv += `${formatDate(receipt.date)},"${receipt.memberName}","${receipt.description}",${receipt.category},${receipt.amount}\n`;
        });

        csv += `,,,,Total:,${currentReportData.totalExpenses}\n\n`;

        // Transfers
        if (currentReportData.transfers.length > 0) {
            csv += 'TRANSFERS\n';
            csv += 'Date,From,To,Transaction ID,Notes,Amount\n';

            currentReportData.transfers.forEach(transfer => {
                csv += `${formatDate(transfer.date)},"${transfer.payerName}","${transfer.payeeName}","${transfer.txnId || ''}","${transfer.notes || ''}",${transfer.amount}\n`;
            });

            csv += `,,,,Total:,${currentReportData.totalTransfers}\n\n`;
        }

        // Category breakdown
        csv += 'CATEGORY BREAKDOWN\n';
        csv += 'Category,Amount\n';
        Object.entries(currentReportData.categoryTotals).forEach(([category, amount]) => {
            if (amount > 0) {
                csv += `${category},${amount}\n`;
            }
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentReportData.trip.name.replace(/\s+/g, '_')}_Report_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showNotification('CSV exported successfully!', 'success');

        // Log audit
        await logAudit('report_exported', {
            format: 'csv',
            tripId: currentReportData.tripId,
            receiptsCount: currentReportData.receipts.length,
            transfersCount: currentReportData.transfers.length
        });

    } catch (error) {
        console.error('CSV export error:', error);
        showNotification('Failed to export CSV: ' + error.message, 'error');
    }
}
