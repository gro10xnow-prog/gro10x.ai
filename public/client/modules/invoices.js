/**
 * public/client/modules/invoices.js
 * Client Portal Invoices & Payment Submission Module
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};

window.generateInvoicePDF = function(invoice) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (window.showClientToast) window.showClientToast('jsPDF library not loaded', 'error');
    else alert('jsPDF not loaded');
    return;
  }
  
  const doc = new window.jspdf.jsPDF();
  
  // Header details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(124, 58, 237); // Purple
  doc.text("PURPLEBOT DIGITAL", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("123 Marketing Ave, Tech District, Dhaka", 14, 28);
  doc.text("contact@purplebot.digital | +880 1711 019550", 14, 33);
  
  // Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text("INVOICE", 130, 25);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Invoice No: ${invoice.id || 'INV-000'}`, 130, 35);
  const issueDate = new Date(invoice.issueDate || invoice.created_at || Date.now()).toLocaleDateString();
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Due on receipt';
  doc.text(`Date: ${issueDate}`, 130, 42);
  doc.text(`Due Date: ${dueDate}`, 130, 49);
  
  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName || invoice.client || 'Client Name', 14, 57);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 14, 64);
  
  // Line items
  let yPos = 80;
  
  // Table Header
  doc.setFillColor(124, 58, 237);
  doc.rect(14, yPos - 6, 180, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 16, yPos);
  doc.text("Amount", 150, yPos);
  
  yPos += 10;
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  
  let items = invoice.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch(e) { items = []; }
  }
  
  if (items.length === 0) {
    items = [{ description: invoice.description || 'Marketing Services', amount: invoice.amount }];
  }
  
  items.forEach(item => {
    doc.text(item.description || 'Service', 16, yPos);
    doc.text(`BDT ${Number(item.amount || 0).toLocaleString()}`, 150, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.line(14, yPos - 5, 194, yPos - 5);
  doc.setFont("helvetica", "bold");
  
  const taxAmt = Number(invoice.amount) * ((Number(invoice.taxRate || 15)) / 100);
  const subTotal = Number(invoice.amount) - taxAmt;

  if (taxAmt > 0) {
    doc.text("Subtotal:", 120, yPos);
    doc.text(`BDT ${subTotal.toLocaleString()}`, 150, yPos);
    yPos += 10;
    doc.text("VAT/Tax:", 120, yPos);
    doc.text(`BDT ${taxAmt.toLocaleString()}`, 150, yPos);
    yPos += 10;
  }
  
  doc.setFontSize(14);
  doc.text("Total:", 120, yPos);
  doc.setTextColor(124, 58, 237);
  doc.text(`BDT ${Number(invoice.amount).toLocaleString()}`, 150, yPos);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", 105, 270, null, null, "center");
  
  // Save PDF
  doc.save(`${invoice.id || 'Invoice'}.pdf`);
};

window.CLIENT_MODULES.invoices = async function(container) {
  let invoices = [];

  async function loadInvoicesData() {
    invoices = await CLIENT_API.get('/invoices').catch(() => []);
    renderInvoicesView();
  }

  function renderInvoicesView() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">💳 Billing & Invoices</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">View invoices, payment history, and submit transaction proofs.</div>
        </div>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Project / Scope</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${(invoices || []).map(i => {
              const isPaid = i.status === 'Paid';
              const isPendingVerif = i.status === 'Verification Pending';
              const safeId = escapeHTML(i.id || 'INV-101');
              const safeProjectName = escapeHTML(i.projectName || 'Monthly Retainer');
              const safeDueDate = escapeHTML(i.dueDate || 'ASAP');
              const safeStatus = escapeHTML(i.status || 'Pending');
              return `
                <tr>
                  <td style="font-weight:700; color:var(--purple-light);">${safeId}</td>
                  <td>${safeProjectName}</td>
                  <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(i.amount) || 0).toLocaleString()}</td>
                  <td style="color:var(--text-muted);">${safeDueDate}</td>
                  <td>
                    <span class="badge ${isPaid ? 'badge-emerald' : isPendingVerif ? 'badge-amber' : 'badge-pink'}">
                      ${safeStatus}
                    </span>
                  </td>
                  <td>
                    ${!isPaid && !isPendingVerif ? `
                      <button class="btn-primary btn-sm" onclick="window.CLIENT_INVOICES.openPayModal('${safeId}', ${i.amount || 0})">
                        💳 Pay / Submit Proof
                      </button>
                    ` : isPendingVerif ? `
                      <span style="font-size:0.78rem; color:var(--amber-brand); font-weight:600;">⌛ Verification Pending</span>
                    ` : `
                      <span style="font-size:0.78rem; color:var(--emerald-brand); font-weight:700;">✅ Paid</span>
                    `}
                    <button class="btn-secondary btn-sm" style="margin-top:0.5rem;" onclick="window.CLIENT_INVOICES.downloadInvoice('${safeId}')">
                      📄 Download
                    </button>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No invoices logged</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Payment Submission Modal -->
      <div class="modal-overlay" id="clientPayModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">💳 Submit Payment Proof</h3>
            <button onclick="window.CLIENT_INVOICES.closePayModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Invoice ID</label>
            <input type="text" id="payInvId" class="form-input" readonly>
          </div>

          <div class="form-group">
            <label class="form-label">Amount Paid (BDT)</label>
            <input type="number" id="payAmount" class="form-input" placeholder="0.00">
          </div>

          <div class="form-group">
            <label class="form-label">Payment Channel</label>
            <select id="payMethod" class="form-select">
              <option value="bKash Merchant">bKash Merchant</option>
              <option value="Bank Transfer">Bank Wire / Transfer</option>
              <option value="Nagad">Nagad</option>
              <option value="Cash / Cheque">Cash / Cheque</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Transaction ID (TrxID) / Reference No</label>
            <input type="text" id="payTrxId" class="form-input" placeholder="e.g. BKS982347102">
          </div>

          <div class="form-group">
            <label class="form-label">Payment Screenshot / Proof (Optional)</label>
            <input type="file" id="payScreenshot" class="form-input" accept="image/*" style="padding: 0.4rem;">
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CLIENT_INVOICES.submitPayment()">
            🚀 Submit Payment for Verification
          </button>
        </div>
      </div>
    `;
  }

  window.CLIENT_INVOICES = {
    openPayModal(invId, amount) {
      document.getElementById('payInvId').value = invId;
      document.getElementById('payAmount').value = amount || 0;
      document.getElementById('clientPayModal').classList.add('active');
    },
    downloadInvoice(id) {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      if (window.generateInvoicePDF) {
        window.generateInvoicePDF(inv);
      } else {
        // Fallback to minimal PDF if generateInvoicePDF is not global
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) return alert('PDF Engine not loaded');
        const doc = new jsPDF();
        doc.text(`Invoice: ${inv.id}`, 14, 20);
        doc.text(`Amount: BDT ${Number(inv.amount).toLocaleString()}`, 14, 30);
        doc.text(`Status: ${inv.status}`, 14, 40);
        doc.save(`${inv.id}.pdf`);
      }
    },
    closePayModal() {
      document.getElementById('clientPayModal').classList.remove('active');
    },
    async submitPayment() {
      const invoiceId = document.getElementById('payInvId').value;
      const amount = document.getElementById('payAmount').value;
      const paymentMethod = document.getElementById('payMethod').value;
      const trxId = document.getElementById('payTrxId').value;
      const fileInput = document.getElementById('payScreenshot');

      if (!invoiceId) return alert('Invoice ID missing');
      if (!amount) return alert('Amount missing');
      if (!trxId) return alert('Transaction ID is required');

      try {
        const formData = new FormData();
        formData.append('method', paymentMethod);
        formData.append('trxId', trxId);
        formData.append('amount', amount);
        
        if (fileInput && fileInput.files.length > 0) {
          formData.append('screenshot', fileInput.files[0]);
        }

        const res = await CLIENT_API.fetchRaw(`/api/invoices/${invoiceId}/pay`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          alert('Payment submitted! Waiting for finance verification.');
          window.CLIENT_INVOICES.closePayModal();
          loadInvoicesData();
        } else {
          alert('Failed to submit: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Payment Submission Error: ' + err.message);
      }
    }
  };

  await loadInvoicesData();
};
