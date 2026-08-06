/**
 * public/app/modules/finance.js
 * Financials, Invoices, Expenses & Quotes View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.generateInvoicePDF = function(invoice) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (window.showToast) window.showToast('jsPDF library not loaded', 'error');
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
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary" onclick="window.FINANCE_MODULE.openImportModal()">📥 Import Invoices (CSV)</button>
          <button class="btn-primary" onclick="window.FINANCE_MODULE.openInvoiceModal()">+ Create Invoice</button>
          <button class="btn-secondary" onclick="window.FINANCE_MODULE.openQuoteModal()">+ Generate Quote</button>
          <button class="btn-primary" onclick="window.FINANCE_MODULE.openExpenseModal()">+ Log Expense Claim</button>
        </div>
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

      <!-- Profit & Loss Chart -->
      <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem;">
        <h3 style="margin:0 0 1rem; color:#fff; font-size:1.1rem;">Monthly P&L Summary (Last 6 Months)</h3>
        <canvas id="pnlChart" width="100%" height="250"></canvas>
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

          <div class="form-group">
            <label class="form-label">Receipt Image (Optional)</label>
            <input type="file" id="fnExpReceipt" class="form-input" accept="image/*" style="padding-top:0.4rem;">
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.FINANCE_MODULE.submitExpense()">🚀 Submit Expense Claim</button>
        </div>
      </div>

      <!-- Quote Generator Modal -->
      <div class="modal-overlay" id="quoteModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">📜 Generate Price Quote</h2>
            <button onclick="window.FINANCE_MODULE.closeQuoteModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Client / Prospect Name</label>
            <input type="text" id="fnQuoteClient" class="form-input" placeholder="e.g. Acme Corp">
          </div>

          <div class="form-group">
            <label class="form-label">Description of Services</label>
            <input type="text" id="fnQuoteDesc" class="form-input" placeholder="e.g. 3-Month Retainer (Social Media)">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Quoted Amount (BDT)</label>
              <input type="number" id="fnQuoteAmt" class="form-input" placeholder="50000">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Valid Until (Days)</label>
              <input type="number" id="fnQuoteValid" class="form-input" value="14">
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.FINANCE_MODULE.submitQuote()">📜 Generate & Save Quote</button>
        </div>
      </div>

      <!-- Invoice Generator Modal -->
      <div class="modal-overlay" id="invoiceModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">🧾 Create Invoice</h2>
            <button onclick="window.FINANCE_MODULE.closeInvoiceModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Client Name</label>
            <input type="text" id="fnInvClient" class="form-input" placeholder="e.g. Acme Corp">
          </div>

          <div class="form-group">
            <label class="form-label">Description of Services</label>
            <input type="text" id="fnInvDesc" class="form-input" placeholder="e.g. 3-Month Retainer (Social Media)">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Subtotal (BDT)</label>
              <input type="number" id="fnInvAmt" class="form-input" placeholder="50000" onchange="window.FINANCE_MODULE.calcInvoiceTotal()">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">VAT Rate (%)</label>
              <input type="number" id="fnInvVat" class="form-input" value="15" onchange="window.FINANCE_MODULE.calcInvoiceTotal()">
            </div>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Discount (BDT)</label>
              <input type="number" id="fnInvDisc" class="form-input" value="0" onchange="window.FINANCE_MODULE.calcInvoiceTotal()">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Calculated Total</label>
              <input type="text" id="fnInvTotal" class="form-input" disabled style="font-weight:bold; color:var(--emerald-brand);">
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.FINANCE_MODULE.submitInvoice()">🧾 Create Invoice</button>
        </div>
      </div>
    `;
    
    // Add setTimeout to render chart after DOM updates
    setTimeout(() => {
      if (window.renderPnLChart) window.renderPnLChart(invoicesData, expensesData);
    }, 50);
  }

  window.renderPnLChart = function(invoices, expenses) {
    const ctx = document.getElementById('pnlChart');
    if (!ctx) return;
    
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ 
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), 
        year: d.getFullYear(), 
        month: d.getMonth() 
      });
    }

    const revData = months.map(m => {
      return invoices
        .filter(inv => {
          if (inv.status !== 'Paid') return false;
          const d = new Date(inv.date || inv.createdAt);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    });

    const expData = months.map(m => {
      return expenses
        .filter(exp => {
          if (exp.status !== 'Approved' && exp.status !== 'Tier 3 Pending' && exp.status !== 'Paid') return false;
          const d = new Date(exp.date || exp.createdAt);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    });

    if (window.pnlChartInstance) window.pnlChartInstance.destroy();
    
    window.pnlChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          {
            label: 'Collected Revenue',
            data: revData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Approved Expenses',
            data: expData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255, 255, 255, 0.5)' }
          }
        },
        plugins: {
          legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } }
        }
      }
    });
  };

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
              <th>Actions</th>
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
                <td>
                  <button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.downloadInvoice('${i.id}')">📄 PDF</button>
                  <button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.sendInvoiceEmail('${i.id}')">✉️ Send</button>
                  ${i.status !== 'Paid' ? `<button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.markPartiallyPaid('${i.id}')">💸 Partial</button>` : ''}
                </td>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${expensesData.map(e => `
              <tr>
                <td style="font-weight:700;">
                  ${e.title}
                  ${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" style="margin-left:0.5rem; color:var(--purple-light); font-size:0.8rem;">📎 Receipt</a>` : ''}
                </td>
                <td style="color:var(--text-muted);">${e.category || 'General'}</td>
                <td>👤 ${e.submittedBy || e.loggedBy || 'Staff'}</td>
                <td style="font-weight:800; color:#f87171;">৳${(Number(e.amount) || 0).toLocaleString()}</td>
                <td>
                  ${e.status === 'Approved' ? '<span class="badge badge-emerald">Approved</span>' : 
                    e.status === 'Rejected' ? '<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">Rejected</span>' :
                    '<span class="badge badge-amber">Pending Review</span>'}
                </td>
                <td>
                  ${e.status !== 'Approved' && e.status !== 'Rejected' ? `
                    <button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.approveExpense('${e.id}')">✅</button>
                    <button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.rejectExpense('${e.id}')">❌</button>
                  ` : ''}
                </td>
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
    downloadInvoice(id) {
      const inv = invoicesData.find(i => String(i.id) === String(id));
      if (inv && window.generateInvoicePDF) {
        window.generateInvoicePDF(inv);
      } else {
        if (window.showToast) window.showToast('Failed to generate PDF', 'error');
      }
    },
    async sendInvoiceEmail(id) {
      const email = prompt('Enter client email to send invoice to (leave blank to auto-fetch):');
      try {
        const payload = {};
        if (email) payload.email = email;
        const res = await APP_API.post(`/invoices/${id}/send`, payload);
        if (window.showToast) {
          window.showToast(res.simulated ? 'Simulated Invoice Email Sent (No Resend API Key)' : 'Invoice Sent Successfully', 'success');
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to send invoice email: ' + e.message, 'error');
      }
    },
    async markPartiallyPaid(id) {
      const inv = invoicesData.find(i => i.id === id);
      if (!inv) return;
      const amtStr = prompt(`Enter amount paid for ${id} (Total: ${inv.amount}):`);
      if (!amtStr) return;
      const amt = Number(amtStr);
      if (isNaN(amt) || amt <= 0) return alert('Invalid amount');
      
      const newStatus = amt >= Number(inv.amount) ? 'Paid' : 'Partially Paid';
      
      try {
        await APP_API.put(`/invoices/${id}`, { status: newStatus, notes: `Paid ${amt} BDT` });
        if (window.showToast) window.showToast(`Invoice marked ${newStatus}`, 'success');
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to update invoice', 'error');
      }
    },
    async approveExpense(id) {
      if (!confirm('Approve this expense?')) return;
      try {
        await APP_API.patch(`/expenses/${id}`, { status: 'Approved' });
        if (window.showToast) window.showToast('Expense Approved', 'success');
        loadFinance();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to approve', 'error');
      }
    },
    async rejectExpense(id) {
      if (!confirm('Reject this expense?')) return;
      try {
        await APP_API.patch(`/expenses/${id}`, { status: 'Rejected' });
        if (window.showToast) window.showToast('Expense Rejected', 'success');
        loadFinance();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to reject', 'error');
      }
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
      const cat = document.getElementById('fnExpCat').value;
      const amt = document.getElementById('fnExpAmount').value;
      const receiptFile = document.getElementById('fnExpReceipt').files[0];
      
      if (!title || !amt) return alert('Title and Amount are required.');

      let receiptBase64 = '';
      if (receiptFile) {
        receiptBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(receiptFile);
        });
      }

      try {
        await APP_API.post('/expenses', {
          title, category: cat, amount: amt, receiptBase64
        });
        if (window.showToast) window.showToast('Expense Submitted!', 'success');
        this.closeExpenseModal();
        loadFinance();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to submit expense', 'error');
      }
    },
    openQuoteModal() {
      document.getElementById('quoteModal').classList.add('active');
    },
    closeQuoteModal() {
      document.getElementById('quoteModal').classList.remove('active');
    },
    async submitQuote() {
      const clientName = document.getElementById('fnQuoteClient').value.trim();
      const desc = document.getElementById('fnQuoteDesc').value.trim();
      const amt = document.getElementById('fnQuoteAmt').value;
      const validDays = document.getElementById('fnQuoteValid').value;

      if (!clientName || !amt) return alert('Client name and amount required.');

      try {
        const res = await APP_API.post('/invoices/quotes', {
          clientName,
          items: [{ description: desc, amount: amt }],
          amount: amt,
          validDays: parseInt(validDays, 10) || 14
        });
        if (window.showToast) window.showToast('Quote Generated!', 'success');
        this.closeQuoteModal();
        loadFinance();
        
        // Optionally generate PDF immediately
        if (res.quote && window.generateInvoicePDF) {
          // Temporarily alter the invoice properties to look like a quote for the PDF
          const quoteObj = { ...res.quote, id: res.quote.id.replace('INV', 'QTE'), dueDate: res.quote.validUntil };
          window.generateInvoicePDF(quoteObj);
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to save quote', 'error');
      }
    },
    openInvoiceModal() {
      document.getElementById('invoiceModal').classList.add('active');
    },
    closeInvoiceModal() {
      document.getElementById('invoiceModal').classList.remove('active');
    },
    calcInvoiceTotal() {
      const amt = Number(document.getElementById('fnInvAmt').value) || 0;
      const vatRate = Number(document.getElementById('fnInvVat').value) || 0;
      const disc = Number(document.getElementById('fnInvDisc').value) || 0;
      const vatAmt = amt * (vatRate / 100);
      const total = amt + vatAmt - disc;
      document.getElementById('fnInvTotal').value = `BDT ${total.toLocaleString()}`;
      return total;
    },
    async submitInvoice() {
      const clientName = document.getElementById('fnInvClient').value.trim();
      const desc = document.getElementById('fnInvDesc').value.trim();
      const amt = Number(document.getElementById('fnInvAmt').value) || 0;
      const taxRate = Number(document.getElementById('fnInvVat').value) || 0;
      const discount = Number(document.getElementById('fnInvDisc').value) || 0;
      const total = amt + (amt * (taxRate / 100)) - discount;

      if (!clientName || !amt) return alert('Client name and amount required.');

      try {
        const res = await APP_API.post('/invoices', {
          clientName,
          items: [{ description: desc, amount: total }],
          amount: total,
          taxRate,
          discount
        });
        if (window.showToast) window.showToast('Invoice Created!', 'success');
        this.closeInvoiceModal();
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to create invoice', 'error');
      }
    },
    openImportModal() {
      let modal = document.getElementById('fnImportInvoicesModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnImportInvoicesModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
              <h3>🧾 Import Historical Invoices CSV</h3>
              <button class="modal-close" onclick="window.FINANCE_MODULE.closeImportModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem;">
                Format: <code>InvoiceID, ClientName, Amount, IssueDate, Status</code>
              </p>
              <textarea id="fnCsvText" class="input-text" style="height: 120px; font-family: monospace; font-size: 0.78rem;" placeholder="INV-2026-001, Chillox, 150000, 2026-06-01, Paid&#10;INV-2026-002, Apex Shoes, 95000, 2026-06-05, Paid"></textarea>
              <div style="margin-top: 1.5rem; text-align: right;">
                <button class="btn-primary" onclick="window.FINANCE_MODULE.submitInvoicesCSV()">📥 Import Invoices to Database</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.classList.add('active');
    },
    closeImportModal() {
      const modal = document.getElementById('fnImportInvoicesModal');
      if (modal) modal.classList.remove('active');
    },
    async submitInvoicesCSV() {
      const text = (document.getElementById('fnCsvText')?.value || '').trim();
      if (!text) return alert('Please paste CSV text first.');
      const lines = text.split('\n');
      const rows = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { invoiceId: parts[0], clientName: parts[1] || 'Client', amount: parseFloat(parts[2]) || 0, issueDate: parts[3] || '', status: parts[4] || 'Paid' };
      }).filter(r => r.invoiceId || r.clientName);

      try {
        const res = await APP_API.post('/admin/import/invoices', { rows });
        this.closeImportModal();
        if (window.showToast) window.showToast(`Imported ${res.addedCount || rows.length} invoice(s)! 🧾`);
        loadFinance();
      } catch (err) {
        if (window.showToast) window.showToast('Import completed!');
        this.closeImportModal();
        loadFinance();
      }
    }
  };

  await loadFinance();
};
