/**
 * public/app/modules/finance.js
 * Financials, Invoices, Expenses & Quotes View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.finance = async function(container) {
  let activeTab = 'invoices';
  let invoicesData = [];
  let expensesData = [];
  let quotesData = [];
  let paymentsData = [];

  async function loadFinance() {
    const [inv, exp, qts, pay] = await Promise.all([
      APP_API.get('/invoices/invoices').catch(() => []),
      APP_API.get('/expenses').catch(() => []),
      APP_API.get('/invoices/quotes').catch(() => []),
      APP_API.get('/payments').catch(() => [])
    ]);

    invoicesData = inv || [];
    expensesData = exp || [];
    quotesData = qts || [];
    paymentsData = pay || [];

    renderFinanceView();
  }

  function renderFinanceView() {
    const totInvoiced = invoicesData.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totCollected = invoicesData.filter(i => (i.status || '').toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingExpCount = expensesData.filter(e => !(e.tier1?.approved && e.tier2?.approved)).length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            💰 Financials & Expense Command
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client retainer invoicing, 2-tier expense claims, and price quotes.
          </div>
        </div>
        <button class="btn-primary" onclick="window.FINANCE_MODULE.openExpenseModal()">+ Log Expense Claim</button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Invoiced</div>
          <div class="kpi-val">৳${totInvoiced.toLocaleString()}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Collected Revenue</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${totCollected.toLocaleString()}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Expense Claims</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingExpCount}</div>
        </div>
      </div>

      <!-- Subtab Navigation Switcher -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem;">
        <button class="btn-ghost ${activeTab === 'invoices' ? 'btn-secondary' : ''}" onclick="window.FINANCE_MODULE.switchSubtab('invoices')">📄 Client Invoices</button>
        <button class="btn-ghost ${activeTab === 'payments' ? 'btn-secondary' : ''}" onclick="window.FINANCE_MODULE.switchSubtab('payments')">💳 Verifications (${paymentsData.filter(p => !p.verified).length})</button>
        <button class="btn-ghost ${activeTab === 'expenses' ? 'btn-secondary' : ''}" onclick="window.FINANCE_MODULE.switchSubtab('expenses')">💸 Expense Queue (${pendingExpCount})</button>
        <button class="btn-ghost ${activeTab === 'quotes' ? 'btn-secondary' : ''}" onclick="window.FINANCE_MODULE.switchSubtab('quotes')">📜 Price Quotes (${quotesData.length})</button>
      </div>

      <!-- Active Subtab Table Data Grid -->
      <div class="data-table-container">
        ${renderActiveTabGrid()}
      </div>

      <!-- Expense Log Modal -->
      <div class="modal-overlay" id="expModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">💸 Log Expense Claim</h2>
            <button onclick="window.FINANCE_MODULE.closeExpenseModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Expense Description</label>
            <input type="text" id="fnExpTitle" class="form-input" placeholder="e.g. Transport for Commercial Shoot">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Category</label>
              <select id="fnExpCat" class="form-select">
                <option value="Transport">Transport</option>
                <option value="Food & Catering">Food & Catering</option>
                <option value="Equipment">Equipment & Gear</option>
                <option value="Software / SaaS">Software / SaaS</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Amount (BDT ৳)</label>
              <input type="number" id="fnExpAmount" class="form-input" placeholder="1500">
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.FINANCE_MODULE.submitExpense()">🚀 Submit Expense Claim</button>
        </div>
      </div>
    `;
  }

  function renderActiveTabGrid() {
    if (activeTab === 'invoices') {
      if (invoicesData.length === 0) return `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No invoices logged yet.</div>`;
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Client Name</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoicesData.map(i => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${i.id || 'INV-101'}</td>
                <td style="font-weight:700;">${i.clientName || 'Agency Client'}</td>
                <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(i.amount) || 0).toLocaleString()}</td>
                <td style="color:var(--text-muted);">${i.dueDate || 'ASAP'}</td>
                <td><span class="badge ${i.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}">${i.status || 'Pending'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'expenses') {
      if (expensesData.length === 0) return `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No expense claims logged.</div>`;
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Expense Description</th>
              <th>Category</th>
              <th>Submitted By</th>
              <th>Amount</th>
              <th>Approval Status</th>
            </tr>
          </thead>
          <tbody>
            ${expensesData.map(e => `
              <tr>
                <td style="font-weight:700;">${e.title}</td>
                <td style="color:var(--text-muted);">${e.category || 'General'}</td>
                <td>👤 ${e.submittedBy || e.loggedBy || 'Staff'}</td>
                <td style="font-weight:800; color:#f87171;">৳${(Number(e.amount) || 0).toLocaleString()}</td>
                <td><span class="badge badge-amber">Tier 1: Pending Review</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'quotes') {
      if (quotesData.length === 0) return `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No price quotes logged.</div>`;
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Client Name</th>
              <th>Valid Until</th>
              <th>Quoted Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${quotesData.map(q => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${q.id || 'QTE-101'}</td>
                <td style="font-weight:700;">${q.clientName || 'Client'}</td>
                <td style="color:var(--text-muted);">${q.validUntil || 'N/A'}</td>
                <td style="font-weight:800; color:var(--purple-light);">৳${(Number(q.amount) || 0).toLocaleString()}</td>
                <td><span class="badge badge-purple">${q.status || 'Draft'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'payments') {
      if (paymentsData.length === 0) return `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No payment logs waiting for verification.</div>`;
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Invoice No</th>
              <th>Client</th>
              <th>Channel</th>
              <th>TrxID / Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsData.map(p => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${p.id}</td>
                <td>${p.invoice_id || p.invoiceId || 'N/A'}</td>
                <td style="font-weight:700;">${p.client_name || p.clientName || 'Client'}</td>
                <td><span class="badge badge-purple">${p.payment_method || p.paymentMethod || 'bKash'}</span></td>
                <td style="font-family:monospace; font-weight:700; color:#38bdf8;">${p.trx_id || p.trxId || 'N/A'}</td>
                <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(p.amount) || 0).toLocaleString()}</td>
                <td>
                  <span class="badge ${p.verified ? 'badge-emerald' : 'badge-amber'}">
                    ${p.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </td>
                <td>
                  ${!p.verified ? `
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-primary btn-sm" onclick="window.FINANCE_MODULE.verifyPayment('${p.id}')">Approve & Mark Paid</button>
                      <button class="btn-danger btn-sm" onclick="window.FINANCE_MODULE.rejectPayment('${p.id}')">Reject</button>
                    </div>
                  ` : `<span style="font-size:0.75rem; color:var(--emerald-brand);">Verified</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  window.FINANCE_MODULE = {
    switchSubtab(tab) {
      activeTab = tab;
      renderFinanceView();
    },
    openExpenseModal() {
      document.getElementById('expModal').classList.add('active');
    },
    closeExpenseModal() {
      document.getElementById('expModal').classList.remove('active');
    },
    async verifyPayment(payId) {
      try {
        const res = await APP_API.post(`/payments/${payId}/verify`);
        if (res.success) {
          showToast('Payment verified! Invoice marked as Paid 💰');
          loadFinance();
        }
      } catch (err) {
        showToast('Failed to verify payment', 'error');
      }
    },
    async rejectPayment(payId) {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      try {
        const res = await APP_API.post(`/payments/${payId}/reject`, { reason });
        if (res.success) {
          showToast('Payment proof rejected');
          loadFinance();
        }
      } catch (err) {
        showToast('Failed to reject payment', 'error');
      }
    },
    async submitExpense() {
      const title = document.getElementById('fnExpTitle').value.trim();
      const category = document.getElementById('fnExpCat').value;
      const amount = parseFloat(document.getElementById('fnExpAmount').value);

      if (!title || !amount) return alert('Please enter title and amount.');

      try {
        const res = await APP_API.post('/expenses', { title, category, amount });
        if (res.success || res.id) {
          this.closeExpenseModal();
          showToast('Expense claim logged for approval!');
          loadFinance();
        }
      } catch (err) {
        showToast('Failed to submit expense', 'error');
      }
    }
  };

  await loadFinance();
};
