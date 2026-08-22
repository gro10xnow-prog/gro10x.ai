/**
 * public/manager/modules/finance.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Interactive Financial Command Hub
 * - Selective Multi-Checkbox Batch Approval
 * - Invoice Aging Analysis (Current / Pending / Overdue)
 * - CSV Export for Accounting Reconciliation
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.finance = async function(container) {
  let expenses = [];
  let invoices = [];
  let team = [];
  let selectedExpenseIds = new Set();
  let currentTab = 'expenses'; // 'expenses' | 'invoices'

  async function loadData() {
    const [expRes, invRes, teamRes] = await Promise.all([
      MANAGER_API.get('/expenses').catch(() => []),
      MANAGER_API.get('/invoices').catch(() => []),
      MANAGER_API.get('/team').catch(() => [])
    ]);
    expenses = expRes || [];
    invoices = invRes || [];
    team = teamRes || [];
    render();
  }

  function render() {
    const pendingExpenses = expenses.filter(e => e.status === 'Tier 1 Approved' || e.status === 'Tier 2 Pending' || e.status === 'Pending');
    const totalPendingAmt = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const totalCollected = paidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalPayroll = team.reduce((sum, m) => sum + (Number(m.baseSalary || m.base_salary) || 0), 0);

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            💰 Department Financial Command Hub
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage expense claim sign-offs, invoice receivables aging, and payroll liability.
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary" onclick="window.MGR_FINANCE.exportCSV()">
            📥 Export to CSV
          </button>
          ${selectedExpenseIds.size > 0 ? `
            <button class="btn-primary" onclick="window.MGR_FINANCE.batchApproveSelected()">
              ⚡ Approve Selected (${selectedExpenseIds.size} Claims)
            </button>
          ` : (pendingExpenses.length > 0 ? `
            <button class="btn-primary" onclick="window.MGR_FINANCE.batchApproveAll()">
              ⚡ Batch Approve All (${pendingExpenses.length} Claims • ৳${totalPendingAmt.toLocaleString()})
            </button>
          ` : '')}
        </div>
      </div>

      <!-- Financial Telemetry Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Pending Expense Queue</div>
          <div class="kpi-val" style="color:var(--amber-brand);">৳${totalPendingAmt.toLocaleString()}</div>
          <div class="kpi-sub">${pendingExpenses.length} claims awaiting sign-off</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Invoices Collected</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">৳${totalCollected.toLocaleString()}</div>
          <div class="kpi-sub">${paidInvoices.length} invoices settled</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Monthly Team Payroll</div>
          <div class="kpi-val" style="color:#60a5fa;">৳${totalPayroll.toLocaleString()}</div>
          <div class="kpi-sub">${team.length} staff members on roster</div>
        </div>
      </div>

      <!-- Expense Queue Table -->
      <div class="card-glass" style="margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h2 style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); margin:0;">
            💸 Claims Awaiting Finance Review (${pendingExpenses.length})
          </h2>
          ${pendingExpenses.length > 0 ? `
            <button class="filter-pill" onclick="window.MGR_FINANCE.toggleSelectAll()">
              ${selectedExpenseIds.size === pendingExpenses.length ? 'Deselect All' : 'Select All'}
            </button>
          ` : ''}
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;">Select</th>
                <th>Staff Member</th>
                <th>Category</th>
                <th>Amount (BDT)</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingExpenses.map(e => `
                <tr>
                  <td>
                    <input
                      type="checkbox"
                      ${selectedExpenseIds.has(e.id) ? 'checked' : ''}
                      onchange="window.MGR_FINANCE.toggleSelect('${e.id}')"
                      style="cursor:pointer; width:16px; height:16px; accent-color:var(--purple-brand);"
                    />
                  </td>
                  <td style="font-weight:700; color:var(--text-primary);">
                    👤 ${e.submittedBy || e.employeeName || 'Staff Member'}
                  </td>
                  <td>
                    <span class="badge badge-purple">${e.category || 'General'}</span>
                  </td>
                  <td style="font-weight:800; color:var(--emerald-brand);">
                    ৳${(Number(e.amount) || 0).toLocaleString()}
                  </td>
                  <td>
                    <span class="badge badge-amber">${e.status || 'Pending'}</span>
                  </td>
                  <td style="color:var(--text-muted); font-size:0.8rem;">
                    ${(e.createdAt || e.created_at || '').split('T')[0] || 'Recent'}
                  </td>
                  <td>
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-primary btn-sm" onclick="window.MGR_FINANCE.approveTier2('${e.id}')">Approve</button>
                      <button class="btn-danger btn-sm" onclick="window.MGR_FINANCE.reject('${e.id}')">Reject</button>
                    </div>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted);">✅ All submitted expense claims have been processed & cleared!</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Invoices Aging & Receivables Table -->
      <div class="card-glass">
        <h2 style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">
          🧾 Invoices & Receivable Aging Pipeline
        </h2>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client Brand</th>
                <th>Amount (BDT)</th>
                <th>Aging Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${(invoices || []).slice(0, 10).map(i => {
                const isPaid = i.status === 'Paid';
                const isOverdue = i.status === 'Overdue';

                return `
                  <tr>
                    <td style="font-weight:700; color:var(--purple-light);">${i.invoiceId || i.id}</td>
                    <td style="font-weight:700;">🏢 ${i.clientName || 'Client'}</td>
                    <td style="font-weight:800;">৳${(Number(i.amount) || 0).toLocaleString()}</td>
                    <td>
                      <span class="badge ${isPaid ? 'badge-emerald' : (isOverdue ? 'badge-pink' : 'badge-amber')}">
                        ${isPaid ? '🟢 Paid' : (isOverdue ? '🚨 Critical Overdue' : '🟡 In Terms (0-15d)')}
                      </span>
                    </td>
                    <td style="color:var(--text-muted); font-size:0.82rem;">${i.dueDate || 'Upon Receipt'}</td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No invoices found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  window.MGR_FINANCE = {
    toggleSelect(id) {
      if (selectedExpenseIds.has(id)) selectedExpenseIds.delete(id);
      else selectedExpenseIds.add(id);
      render();
    },
    toggleSelectAll() {
      const pending = expenses.filter(e => e.status === 'Tier 1 Approved' || e.status === 'Tier 2 Pending' || e.status === 'Pending');
      if (selectedExpenseIds.size === pending.length) {
        selectedExpenseIds.clear();
      } else {
        selectedExpenseIds = new Set(pending.map(e => e.id));
      }
      render();
    },
    async approveTier2(id) {
      try {
        await MANAGER_API.post(`/expenses/${id}/approve-tier2`, { approvedBy: 'Finance Manager' });
        showManagerToast('Expense approved! 💰');
        selectedExpenseIds.delete(id);
        loadData();
      } catch (e) {
        showManagerToast('Failed to approve expense', 'error');
      }
    },
    async reject(id) {
      try {
        await MANAGER_API.patch(`/expenses/${id}`, { status: 'Declined' });
        showManagerToast('Expense claim declined');
        selectedExpenseIds.delete(id);
        loadData();
      } catch (e) {
        showManagerToast('Failed to decline expense', 'error');
      }
    },
    async batchApproveSelected() {
      try {
        const ids = Array.from(selectedExpenseIds);
        await Promise.all(ids.map(id => MANAGER_API.post(`/expenses/${id}/approve-tier2`, { approvedBy: 'Finance Manager' })));
        showManagerToast(`Batch approved ${ids.length} selected expense claims! ⚡`);
        selectedExpenseIds.clear();
        loadData();
      } catch (e) {
        showManagerToast('Batch approval failed', 'error');
      }
    },
    async batchApproveAll() {
      try {
        const pending = expenses.filter(e => e.status === 'Tier 1 Approved' || e.status === 'Tier 2 Pending' || e.status === 'Pending');
        await Promise.all(pending.map(e => MANAGER_API.post(`/expenses/${e.id}/approve-tier2`, { approvedBy: 'Finance Manager' })));
        showManagerToast(`Batch approved ${pending.length} expense claims! ⚡`);
        selectedExpenseIds.clear();
        loadData();
      } catch (e) {
        showManagerToast('Batch approval failed', 'error');
      }
    },
    exportCSV() {
      try {
        const pending = expenses.filter(e => e.status === 'Tier 1 Approved' || e.status === 'Tier 2 Pending' || e.status === 'Pending');
        const rows = [
          ['ID', 'Staff Member', 'Category', 'Amount (BDT)', 'Status', 'Date'],
          ...pending.map(e => [e.id, e.submittedBy || e.employeeName || 'Staff', e.category || 'General', e.amount || 0, e.status || 'Pending', (e.createdAt || '').split('T')[0]])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `PurpleOS_Expense_Queue_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showManagerToast('Exported expense queue to CSV! 📥');
      } catch (e) {
        showManagerToast('Failed to export CSV', 'error');
      }
    }
  };

  await loadData();
};
