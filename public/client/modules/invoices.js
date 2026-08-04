/**
 * public/client/modules/invoices.js
 * Client Portal Invoices & Payment Submission Module
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};

window.CLIENT_MODULES.invoices = async function(container) {
  let invoices = [];

  async function loadInvoicesData() {
    invoices = await CLIENT_API.get('/invoices/invoices').catch(() => []);
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
              return `
                <tr>
                  <td style="font-weight:700; color:var(--purple-light);">${i.id || 'INV-101'}</td>
                  <td>${i.projectName || 'Monthly Retainer'}</td>
                  <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(i.amount) || 0).toLocaleString()}</td>
                  <td style="color:var(--text-muted);">${i.dueDate || 'ASAP'}</td>
                  <td>
                    <span class="badge ${isPaid ? 'badge-emerald' : isPendingVerif ? 'badge-amber' : 'badge-pink'}">
                      ${i.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    ${!isPaid && !isPendingVerif ? `
                      <button class="btn-primary btn-sm" onclick="window.CLIENT_INVOICES.openPayModal('${i.id}', ${i.amount || 0})">
                        💳 Pay / Submit Proof
                      </button>
                    ` : isPendingVerif ? `
                      <span style="font-size:0.78rem; color:var(--amber-brand); font-weight:600;">⌛ Verification Pending</span>
                    ` : `
                      <span style="font-size:0.78rem; color:var(--emerald-brand); font-weight:700;">✅ Paid</span>
                    `}
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
    closePayModal() {
      document.getElementById('clientPayModal').classList.remove('active');
    },
    async submitPayment() {
      const invoiceId = document.getElementById('payInvId').value;
      const amount = document.getElementById('payAmount').value;
      const paymentMethod = document.getElementById('payMethod').value;
      const trxId = document.getElementById('payTrxId').value.trim();

      if (!trxId) return alert('Transaction ID (TrxID) is required.');

      try {
        const res = await CLIENT_API.post('/payments', {
          invoiceId,
          amount,
          paymentMethod,
          trxId
        });

        if (res.success || res.payment) {
          this.closePayModal();
          showClientToast('Payment proof submitted! Verification in progress 💳');
          loadInvoicesData();
        }
      } catch (err) {
        showClientToast('Error submitting payment proof');
      }
    }
  };

  await loadInvoicesData();
};
