/**
 * public/client/modules/invoices.js
 * Client Portal Invoices & Payment Submission Module
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.generateInvoicePDF = function(invoice) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (window.showClientToast) window.showClientToast('jsPDF library not loaded', 'error');
    return;
  }
  
  const doc = new window.jspdf.jsPDF();
  
  // Header details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 223, 137); // GRO10X Emerald Primary
  doc.text("GRO10X AGENCY OS", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Official Tax Invoice & Payment Receipt", 14, 28);
  doc.text("Institutional Wire Rail: BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)", 14, 34);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 38, 196, 38);

  // Meta details
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Invoice ID: ${invoice.id || 'N/A'}`, 14, 48);
  doc.text(`Project: ${invoice.projectName || 'Client Retainer'}`, 14, 55);
  doc.text(`Issue Date: ${invoice.createdAt ? invoice.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}`, 14, 62);
  doc.text(`Due Date: ${invoice.dueDate || 'Upon Receipt'}`, 14, 69);
  doc.text(`Status: ${invoice.status || 'Pending'}`, 14, 76);

  // Table header
  let yPos = 90;
  doc.setFillColor(240, 240, 245);
  doc.rect(14, yPos - 6, 182, 10, 'F');
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Description", 16, yPos);
  doc.text("Amount (BDT)", 150, yPos);

  // Table row
  yPos += 12;
  doc.setFont("helvetica", "normal");
  const totalGross = Number(invoice.amount) || 0;
  doc.text(invoice.projectName || "Autonomous Growth Retainer Delivery", 16, yPos);
  doc.text(`BDT ${totalGross.toLocaleString()}`, 150, yPos);

  // Subtotal & VAT breakdown
  yPos += 20;
  const taxRate = Number(invoice.taxRate) || 5;
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
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">💳 Billing & Invoices</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">View invoices, payment history, and submit transaction proofs.</div>
        </div>
      </div>

      <!-- Institutional Settlement Rails Banner -->
      <div class="card-glass" style="margin-bottom:1.25rem; padding:0.85rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; border:1px solid rgba(0, 223, 137, 0.25); background:rgba(0, 223, 137, 0.05); border-radius:12px;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:1.5rem;">🏦</span>
          <div>
            <div style="font-weight:700; font-size:0.88rem; color:#fff;">Institutional Settlement Rails: <span style="color:#00df89;">BRAC Bank Limited</span></div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Beneficiary: <strong>Neoncore Tech Solution</strong> | Account No: <code>2081636480001</code> | Routing: <code>060263290</code> | Mohakhali Branch</div>
          </div>
        </div>
        <button type="button" class="btn-secondary btn-sm" onclick="window.CLIENT_INVOICES.copyInfo('2081636480001', 'Account Number')" style="font-size:0.75rem;">📋 Copy Bank Info</button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Project / Scope</th>
              <th>Taxable Base</th>
              <th>VAT (5%)</th>
              <th>Total Payable</th>
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
              
              const totalAmt = Number(i.amount) || 0;
              const isEngine2 = (i.engine_tag || i.engineTag) === 'engine2' || i.is_engine2 || (i.projectName || '').toLowerCase().includes('sprint');
              const currSym = i.currency === 'USD' ? '$' : '৳';
              const vatAmt = Number(i.vatAmount || i.vat_amount) || Math.round(totalAmt * 0.05);
              const baseAmt = Number(i.taxableBase || i.taxable_base) || Math.max(0, totalAmt - vatAmt);

              return `
                <tr>
                  <td style="font-weight:700; color:var(--purple-light);">
                    ${safeId}
                    ${isEngine2 ? `<div style="font-size:0.65rem; color:#38bdf8; font-weight:700;">ENGINE 2 SPRINT</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight:600; color:#fff;">${safeProjectName}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">BRAC Bank Wire Transfer Rail</div>
                  </td>
                  <td style="color:var(--text-secondary);">${currSym}${baseAmt.toLocaleString()}</td>
                  <td style="color:#a78bfa; font-weight:600;">+${currSym}${vatAmt.toLocaleString()}</td>
                  <td style="font-weight:800; color:var(--emerald-brand);">${currSym}${totalAmt.toLocaleString()}</td>
                  <td style="color:var(--text-muted);">${safeDueDate}</td>
                  <td>
                    <span class="badge ${isPaid ? 'badge-emerald' : isPendingVerif ? 'badge-amber' : 'badge-pink'}">
                      ${safeStatus}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                      ${!isPaid && !isPendingVerif ? `
                        <button class="btn-primary btn-sm" onclick="window.CLIENT_INVOICES.openPayModal('${safeId}', ${totalAmt})">
                          💳 Pay / Wire Slip
                        </button>
                      ` : isPendingVerif ? `
                        <span style="font-size:0.75rem; color:var(--amber-brand); font-weight:700;">⌛ Verifying Wire</span>
                      ` : `
                        <span style="font-size:0.75rem; color:var(--emerald-brand); font-weight:700;">✅ Settled</span>
                      `}
                      <a href="/invoice-view.html?id=${safeId}" target="_blank" class="btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.3rem; text-decoration:none; justify-content:center;">
                        📄 Download Tax Invoice (PDF)
                      </a>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No invoices logged</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Payment Submission Modal -->
      <div class="modal-overlay" id="clientPayModal">
        <div class="modal-box" style="max-width: 520px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">💳 Submit Bank Wire Slip / Payment Proof</h3>
            <button onclick="window.CLIENT_INVOICES.closePayModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <!-- Official Payment Channels Info Box -->
          <div style="background:rgba(0, 223, 137, 0.08); border:1px solid rgba(0, 223, 137, 0.25); border-radius:12px; padding:0.85rem; margin-bottom:1.2rem; font-size:0.82rem; line-height:1.5;">
            <strong style="color:var(--primary); display:block; margin-bottom:0.4rem;">🏦 Official Corporate Bank Wire Details:</strong>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span>• <strong>Beneficiary:</strong> Neoncore Tech Solution</span>
              <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="window.CLIENT_INVOICES.copyInfo('Neoncore Tech Solution', 'Beneficiary')">📋 Copy</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span>• <strong>Bank:</strong> BRAC Bank Limited (Mohakhali Branch | 060263290)</span>
              <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="window.CLIENT_INVOICES.copyInfo('060263290', 'Routing Number')">📋 Routing</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>• <strong>Account No:</strong> <code>2081636480001</code></span>
              <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="window.CLIENT_INVOICES.copyInfo('2081636480001', 'Account Number')">📋 Copy</button>
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
              <option value="Corporate Bank Wire">Corporate Bank Wire (BRAC Bank Limited)</option>
              <option value="Card / Stripe">Online Card Checkout / Stripe</option>
              <option value="Wise / SWIFT">Wise / International Wire</option>
              <option value="Cash / Cheque">Corporate Cheque</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Bank Wire Reference / Deposit Slip No</label>
            <input type="text" id="payTrxId" class="form-input" placeholder="e.g. BRAC-DEP-849201 or Wire Ref">
          </div>

          <div class="form-group">
            <label class="form-label">Deposit Slip / Bank Receipt (PDF / Image)</label>
            <input type="file" id="payScreenshot" class="form-input" accept="image/*,application/pdf" style="padding: 0.4rem;">
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
        }).catch(() => {});
      }
    },
    openPayModal(invId, amount) {
      document.getElementById('payInvId').value = invId;
      document.getElementById('payAmount').value = amount || 0;
      document.getElementById('clientPayModal').classList.add('active');
    },
    downloadInvoice(id) {
      window.open(`/invoice-view.html?id=${encodeURIComponent(id)}`, '_blank');
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
        return;
      }
      if (!amount) {
        if (window.showClientToast) window.showClientToast('Amount missing', 'error');
        return;
      }
      if (!trxId) {
        if (window.showClientToast) window.showClientToast('Transaction ID / Reference is required', 'error');
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
          window.CLIENT_INVOICES.closePayModal();
          loadInvoicesData();
        } else {
          const errMsg = data.error || 'Unknown error';
          if (window.showClientToast) window.showClientToast('Failed to submit: ' + errMsg, 'error');
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Payment Error: ' + err.message, 'error');
      }
    }
  };

  await loadInvoicesData();
};
