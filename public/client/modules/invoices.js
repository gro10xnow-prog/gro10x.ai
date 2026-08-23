/**
 * public/client/modules/invoices.js
 * Client Portal Invoices & Payment Submission Module
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

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
  doc.text("Purplebot Digital Limited, Dhaka, Bangladesh", 14, 28);
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
  const issueDate = new Date(invoice.issueDate || invoice.created_at || Date.now()).toLocaleDateString('en-GB');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'Due on receipt';
  doc.text(`Date: ${issueDate}`, 130, 42);
  doc.text(`Due Date: ${dueDate}`, 130, 49);
  
  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName || invoice.client || 'Client Partner', 14, 57);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 14, 64);
  
  // Line items
  let yPos = 80;
  
  // Table Header
  doc.setFillColor(124, 58, 237);
  doc.rect(14, yPos - 6, 180, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 16, yPos);
  doc.text("Amount (BDT)", 145, yPos);
  
  yPos += 10;
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  
  let items = invoice.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch(e) { items = []; }
  }
  
  if (items.length === 0) {
    items = [{ description: invoice.description || invoice.projectName || 'Digital Marketing & Creative Retainer', amount: invoice.amount }];
  }
  
  items.forEach(item => {
    doc.text(item.description || 'Service Deliverable', 16, yPos);
    doc.text(`BDT ${Number(item.amount || 0).toLocaleString()}`, 145, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 6;
  doc.line(14, yPos - 3, 194, yPos - 3);
  doc.setFont("helvetica", "bold");
  
  const totalGross = Number(invoice.amount) || 0;
  const taxRate = Number(invoice.taxRate) || 0;
  
  if (taxRate > 0) {
    const subTotal = totalGross / (1 + (taxRate / 100));
    const taxAmt = totalGross - subTotal;
    doc.text("Subtotal (Net):", 115, yPos);
    doc.text(`BDT ${Math.round(subTotal).toLocaleString()}`, 145, yPos);
    yPos += 8;
    doc.text(`VAT / Tax (${taxRate}%):`, 115, yPos);
    doc.text(`BDT ${Math.round(taxAmt).toLocaleString()}`, 145, yPos);
    yPos += 8;
  }
  
  doc.setFontSize(13);
  doc.text("Total Payable:", 115, yPos);
  doc.setTextColor(124, 58, 237);
  doc.text(`BDT ${totalGross.toLocaleString()}`, 145, yPos);
  
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
        <div class="modal-box" style="max-width: 520px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">💳 Submit Payment Proof</h3>
            <button onclick="window.CLIENT_INVOICES.closePayModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <!-- Official Payment Channels Info Box -->
          <div style="background:rgba(124, 58, 237, 0.12); border:1px solid rgba(139, 92, 246, 0.3); border-radius:12px; padding:0.85rem; margin-bottom:1.2rem; font-size:0.82rem; line-height:1.5;">
          <div style="background:var(--surface-2); padding:0.85rem; border-radius:10px; font-size:0.82rem; color:var(--text-secondary); margin-bottom:1rem; border:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#fff; display:block; margin-bottom:0.4rem;">Official Agency Payment Accounts:</strong>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span>• <strong>bKash / Nagad:</strong> <code>01711-019550</code> (Merchant)</span>
              <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="window.CLIENT_INVOICES.copyInfo('01711019550', 'bKash Merchant Number')">📋 Copy</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>• <strong>Bank Wire:</strong> Purplebot Digital Ltd (BRAC Bank)</span>
              <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="window.CLIENT_INVOICES.copyInfo('Purplebot Digital Limited', 'Bank Beneficiary')">📋 Copy</button>
            </div>
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
              <option value="bKash Merchant">bKash (01711-019550)</option>
              <option value="Nagad">Nagad (01711-019550)</option>
              <option value="Bank Transfer">Bank Wire / Corporate Transfer</option>
              <option value="Cash / Cheque">Corporate Cheque</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Transaction ID (TrxID) / Bank Ref No</label>
            <input type="text" id="payTrxId" class="form-input" placeholder="e.g. BKS982347102 or Cheque #">
          </div>

          <div class="form-group">
            <label class="form-label">Payment Screenshot / Deposit Slip (Optional)</label>
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
    copyInfo(text, label) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (window.showClientToast) window.showClientToast(`Copied ${label} to clipboard! 📋`);
          else alert(`Copied ${label}!`);
        }).catch(() => {});
      }
    },
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
        if (!jsPDF) {
          if (window.showClientToast) window.showClientToast('PDF Engine not loaded', 'error');
          else alert('PDF Engine not loaded');
          return;
        }
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

      if (!invoiceId) {
        if (window.showClientToast) window.showClientToast('Invoice ID missing', 'error');
        else alert('Invoice ID missing');
        return;
      }
      if (!amount) {
        if (window.showClientToast) window.showClientToast('Amount missing', 'error');
        else alert('Amount missing');
        return;
      }
      if (!trxId) {
        if (window.showClientToast) window.showClientToast('Transaction ID / Reference is required', 'error');
        else alert('Transaction ID is required');
        return;
      }

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
          if (window.showClientToast) window.showClientToast('Payment proof submitted! Awaiting finance verification 💳');
          else alert('Payment submitted! Waiting for finance verification.');
          window.CLIENT_INVOICES.closePayModal();
          loadInvoicesData();
        } else {
          const errMsg = data.error || 'Unknown error';
          if (window.showClientToast) window.showClientToast('Failed to submit: ' + errMsg, 'error');
          else alert('Failed to submit: ' + errMsg);
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Payment Error: ' + err.message, 'error');
        else alert('Payment Submission Error: ' + err.message);
      }
    }
  };

  await loadInvoicesData();
};
