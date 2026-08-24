/**
 * public/app/modules/finance.js
 * Financials, Invoices, Expenses & Quotes View Module
 * v2.0 — Full Rebuild with CRM Client Dropdowns, Overdue Badge & KPI, "Mark Paid" button, Quote->Invoice conversion, PDF Quote download, Toast notifications, and Error States
 */
window.APP_MODULES = window.APP_MODULES || {};

window.generateInvoicePDF = function(invoice) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (window.showToast) window.showToast('jsPDF library not loaded', 'error');
    return;
  }
  
  const doc = new window.jspdf.jsPDF();
  const isQuote = (invoice.id || '').startsWith('QTE');
  
  // Header details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 223, 137); // Cyber Emerald
  doc.text("GRO10X AI AGENCY", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Dhaka, Bangladesh · BST (UTC+6) / Global Remote Ops", 14, 28);
  doc.text("gro10xnow@gmail.com | +880 1708-459008", 14, 33);
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(30, 30, 30);
  doc.text(isQuote ? "PROPOSAL QUOTE" : "INVOICE", 120, 25);
  
  // Details
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`${isQuote ? 'Quote' : 'Invoice'} No: ${invoice.id || 'INV-000'}`, 120, 35);
  const issueDate = new Date(invoice.date || invoice.created_at || Date.now()).toLocaleDateString();
  const dueDate = invoice.dueDate || invoice.validUntil ? new Date(invoice.dueDate || invoice.validUntil).toLocaleDateString() : 'Due on receipt';
  doc.text(`Date: ${issueDate}`, 120, 42);
  doc.text(`${isQuote ? 'Valid Until' : 'Due Date'}: ${dueDate}`, 120, 49);
  
  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("PREPARED FOR:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName || invoice.client || 'Client Name', 14, 57);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 14, 64);
  
  // Table Header
  let yPos = 80;
  doc.setFillColor(0, 223, 137);
  doc.rect(14, yPos - 6, 180, 10, 'F');
  doc.setTextColor(7, 11, 18);
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
    items = [{ description: invoice.description || 'AI Engineering & Growth Services', amount: invoice.amount }];
  }
  
  items.forEach(item => {
    doc.text(item.description || 'Service', 16, yPos);
    doc.text(`$${Number(item.amount || 0).toLocaleString()} (৳${Math.round(Number(item.amount || 0) * 118).toLocaleString()})`, 150, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.line(14, yPos - 5, 194, yPos - 5);
  doc.setFont("helvetica", "bold");
  
  doc.setFontSize(14);
  doc.text("Total:", 120, yPos);
  doc.setTextColor(0, 223, 137);
  doc.text(`$${Number(invoice.amount || 0).toLocaleString()}`, 150, yPos);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for scaling with GRO10X! — https://gro10x-ai.vercel.app", 105, 270, null, null, "center");
  
  doc.save(`${invoice.id || 'Document'}.pdf`);
};

window.APP_MODULES.finance = async function(container) {
  let activeTab = 'invoices';
  let invoicesData = [];
  let expensesData = [];
  let quotesData = [];
  let paymentsData = [];
  let clientsData = [];
  let isLoading = true;
  let hasError = false;

  // Filter & Search states
  let invoiceFilter = 'all';
  let invoiceSearch = '';
  let expenseFilter = 'all';
  let expenseSearch = '';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const DEFAULT_INVOICES = [
    {
      id: 'INV-2026-001',
      clientId: 'cli_chillox',
      clientName: 'Chillox Bangladesh',
      projectName: 'Monthly Social Media Retainer (Q1)',
      date: '2026-08-01',
      dueDate: '2026-08-15',
      paidDate: '2026-08-05',
      amount: 75000,
      taxRate: 15,
      discount: 0,
      status: 'Paid',
      items: [
        { description: 'Social Media Management & 16 Content Pieces', qty: 1, rate: 75000, amount: 75000 }
      ],
      notes: 'Paid via bKash Merchant Gateway'
    },
    {
      id: 'INV-2026-002',
      clientId: 'cli_aura',
      clientName: 'Aura Cosmetics',
      projectName: 'Beauty TVC & 10 Short-Form Reels',
      date: '2026-08-10',
      dueDate: '2026-08-25',
      amount: 45000,
      taxRate: 15,
      discount: 0,
      status: 'Pending',
      items: [
        { description: 'Studio Production & Color Grading Package', qty: 1, rate: 45000, amount: 45000 }
      ],
      notes: 'Awaiting client direct bank transfer'
    },
    {
      id: 'INV-2026-003',
      clientId: 'cli_apex',
      clientName: 'Apex Footwear',
      projectName: 'Footwear Collection Launch Motion Kit',
      date: '2026-07-20',
      dueDate: '2026-08-05',
      amount: 120000,
      taxRate: 15,
      discount: 0,
      status: 'Overdue',
      items: [
        { description: '3D Motion Brand Identity & Packaging Suite', qty: 1, rate: 120000, amount: 120000 }
      ],
      notes: 'Followed up via Account Manager'
    }
  ];

  const DEFAULT_EXPENSES = [
    {
      id: 'EXP-001',
      title: 'Niketon Studio Production Lighting Gear & Softboxes',
      category: 'Equipment & Gear',
      amount: 12500,
      date: '2026-08-10',
      loggedBy: 'Borhan (Finance & Studio Lead)',
      submittedBy: 'Borhan (Finance & Studio Lead)',
      description: 'Godox softbox replacement diffuser and C-stand mounts',
      status: 'Approved',
      tier1: { approved: true, approvedBy: 'Ayman Rahman', approvedAt: '2026-08-10T14:30:00Z' },
      tier2: { approved: true, approvedBy: 'H. M. Ifteker Mahmud', approvedAt: '2026-08-10T16:00:00Z' }
    },
    {
      id: 'EXP-002',
      title: 'Food Styling & Props for Chillox Campaign Shoot',
      category: 'Shoot Props',
      amount: 4200,
      date: '2026-08-14',
      loggedBy: 'Asif (Creative Lead)',
      submittedBy: 'Asif (Creative Lead)',
      description: 'Gourmet background condiments, acrylic styling props, ice cubes',
      status: 'Tier 2 Pending',
      tier1: { approved: true, approvedBy: 'Ayman Rahman', approvedAt: '2026-08-14T11:00:00Z' },
      tier2: { approved: false }
    }
  ];

  const DEFAULT_QUOTES = [
    {
      id: 'QTE-2026-001',
      clientName: 'LG Electronics Bangladesh',
      amount: 150000,
      taxRate: 15,
      discount: 0,
      status: 'Sent',
      date: '2026-08-12',
      validUntil: '2026-08-31',
      items: [{ description: 'Enterprise Digital Marketing & Influencer Campaign', qty: 1, rate: 150000, amount: 150000 }],
      terms: '50% advance upon contract signing, 50% upon final delivery.'
    },
    {
      id: 'QTE-2026-002',
      clientName: 'Daraz Bangladesh',
      amount: 85000,
      taxRate: 15,
      discount: 0,
      status: 'Draft',
      date: '2026-08-15',
      validUntil: '2026-09-05',
      items: [{ description: '11.11 Megasale Creative Asset Suite', qty: 1, rate: 85000, amount: 85000 }],
      terms: 'Net 15 days payment terms.'
    }
  ];

  const DEFAULT_CLIENTS = [
    { id: 'cli_chillox', name: 'Chillox Bangladesh', company: 'Chillox Bangladesh' },
    { id: 'cli_aura', name: 'Aura Cosmetics', company: 'Aura Cosmetics' },
    { id: 'cli_apex', name: 'Apex Footwear', company: 'Apex Footwear' },
    { id: 'cli_gp', name: 'Grameenphone', company: 'Grameenphone' },
    { id: 'cli_daraz', name: 'Daraz Bangladesh', company: 'Daraz Bangladesh' }
  ];

  async function loadFinance() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [inv, exp, qts, pay, cls] = await Promise.all([
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/expenses').catch(() => []),
        APP_API.get('/invoices/quotes').catch(() => []),
        APP_API.get('/payments').catch(() => []),
        APP_API.get('/clients').catch(() => [])
      ]);

      invoicesData = (Array.isArray(inv) && inv.length > 0) ? inv : DEFAULT_INVOICES;
      expensesData = (Array.isArray(exp) && exp.length > 0) ? exp : DEFAULT_EXPENSES;
      quotesData = (Array.isArray(qts) && qts.length > 0) ? qts : DEFAULT_QUOTES;
      paymentsData = Array.isArray(pay) ? pay : [];
      clientsData = (Array.isArray(cls) && cls.length > 0) ? cls : DEFAULT_CLIENTS;

      isLoading = false;
      renderFinanceView();
    } catch (err) {
      console.warn('[Finance Module] Load fallback note:', err);
      invoicesData = DEFAULT_INVOICES;
      expensesData = DEFAULT_EXPENSES;
      quotesData = DEFAULT_QUOTES;
      clientsData = DEFAULT_CLIENTS;
      isLoading = false;
      renderFinanceView();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            💰 Financials & Expense Command
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client retainer invoicing, 2-tier expense claims, payment verification, and price quotes.
          </div>
        </div>
      </div>
      <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading financial data...</div>
    `;
  }

  function renderErrorState(message) {
    container.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; margin-top:2rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Financials</div>
        <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
        <button class="btn-primary" onclick="window.FINANCE_MODULE.reload()">🔄 Retry Loading</button>
      </div>
    `;
  }

  function isOverdue(inv) {
    if (inv.status === 'Paid') return false;
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date(new Date().toISOString().split('T')[0]);
  }

  function renderFinanceView() {
    const todayStr = new Date().toISOString().split('T')[0];
    const totInvoiced = invoicesData.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totCollected = invoicesData.filter(i => (i.status || '').toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totOverdue = invoicesData.filter(i => i.status !== 'Paid' && i.dueDate && new Date(i.dueDate) < new Date(todayStr)).reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingExpCount = expensesData.filter(e => !(e.tier1?.approved && e.tier2?.approved) && e.status !== 'Approved' && e.status !== 'Rejected').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            💰 Financials & Expense Command
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client retainer invoicing, 2-tier expense claims, payment verification, and price quotes.
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary" onclick="window.FINANCE_MODULE.openImportModal()">📥 Import Invoices (CSV)</button>
          <button class="btn-primary" onclick="window.FINANCE_MODULE.openInvoiceModal()">+ Create Invoice</button>
          <button class="btn-secondary" onclick="window.FINANCE_MODULE.openQuoteModal()">+ Generate Quote</button>
          <button class="btn-primary" onclick="window.FINANCE_MODULE.openExpenseModal()">+ Log Expense Claim</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Invoiced</div>
          <div class="kpi-val">৳${totInvoiced.toLocaleString()}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Collected Revenue</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${totCollected.toLocaleString()}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🔴 Overdue Unpaid</div>
          <div class="kpi-val" style="color: #ef4444;">৳${totOverdue.toLocaleString()}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Expense Claims</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingExpCount}</div>
        </div>
      </div>

      <!-- Profit & Loss Chart -->
      <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem;">
        <h3 style="margin:0 0 1rem; color:#fff; font-size:1.1rem;">Monthly P&L Summary (Last 6 Months)</h3>
        <div style="position:relative; height:230px; width:100%;">
          <canvas id="pnlChart"></canvas>
        </div>
      </div>

      <!-- Subtab Navigation Switcher -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem; flex-wrap:wrap;">
        <button class="btn-ghost ${activeTab === 'invoices' ? 'btn-secondary' : ''}" onclick="window.FINANCE_MODULE.switchSubtab('invoices')">📄 Client Invoices (${invoicesData.length})</button>
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

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Expense Description *</label>
            <input type="text" id="fnExpTitle" class="input-text" placeholder="e.g. Transport for Commercial Shoot" required>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Category</label>
              <select id="fnExpCat" class="input-text">
                <option value="Transport">Transport</option>
                <option value="Food & Catering">Food & Catering</option>
                <option value="Equipment">Equipment & Gear</option>
                <option value="Software / SaaS">Software / SaaS</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Amount (BDT ৳) *</label>
              <input type="number" id="fnExpAmount" class="input-text" placeholder="1500" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Receipt Image (Optional)</label>
            <input type="file" id="fnExpReceipt" class="input-text" accept="image/*" style="padding-top:0.4rem;">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
            <button type="button" class="btn-secondary" onclick="window.FINANCE_MODULE.closeExpenseModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="window.FINANCE_MODULE.submitExpense()">🚀 Submit Expense Claim</button>
          </div>
        </div>
      </div>

      <!-- Quote Generator Modal -->
      <div class="modal-overlay" id="quoteModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">📜 Generate Price Quote</h2>
            <button onclick="window.FINANCE_MODULE.closeQuoteModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Client Account *</label>
            <select id="fnQuoteClientSelect" class="input-text" required onchange="window.FINANCE_MODULE.syncQuoteClient(this)">
              <option value="">-- Select Client from CRM --</option>
            </select>
            <input type="hidden" id="fnQuoteClient" value="">
          </div>

          <div class="form-group">
            <label class="form-label">Description of Services</label>
            <input type="text" id="fnQuoteDesc" class="input-text" placeholder="e.g. 3-Month Retainer (Social Media)">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Quoted Amount (BDT) *</label>
              <input type="number" id="fnQuoteAmt" class="input-text" placeholder="50000" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Valid Until (Days)</label>
              <input type="number" id="fnQuoteValid" class="input-text" value="14">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
            <button type="button" class="btn-secondary" onclick="window.FINANCE_MODULE.closeQuoteModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="window.FINANCE_MODULE.submitQuote()">📜 Generate & Save Quote</button>
          </div>
        </div>
      </div>

      <!-- Invoice Generator Modal -->
      <div class="modal-overlay" id="invoiceModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">🧾 Create Invoice</h2>
            <button onclick="window.FINANCE_MODULE.closeInvoiceModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">Client Account *</label>
            <select id="fnInvClientSelect" class="input-text" required onchange="window.FINANCE_MODULE.syncInvClient(this)">
              <option value="">-- Select Client from CRM --</option>
            </select>
            <input type="hidden" id="fnInvClient" value="">
            <input type="hidden" id="fnInvClientId" value="">
          </div>

          <div class="form-group">
            <label class="form-label">Description of Services</label>
            <input type="text" id="fnInvDesc" class="input-text" placeholder="e.g. 3-Month Retainer (Social Media)">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Subtotal (BDT) *</label>
              <input type="number" id="fnInvAmt" class="input-text" placeholder="50000" oninput="window.FINANCE_MODULE.calcInvoiceTotal()" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">VAT Rate (%)</label>
              <input type="number" id="fnInvVat" class="input-text" value="15" oninput="window.FINANCE_MODULE.calcInvoiceTotal()">
            </div>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Discount (BDT)</label>
              <input type="number" id="fnInvDisc" class="input-text" value="0" oninput="window.FINANCE_MODULE.calcInvoiceTotal()">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Calculated Total</label>
              <input type="text" id="fnInvTotal" class="input-text" disabled style="font-weight:bold; color:var(--emerald-brand);">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
            <button type="button" class="btn-secondary" onclick="window.FINANCE_MODULE.closeInvoiceModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="window.FINANCE_MODULE.submitInvoice()">🧾 Create Invoice</button>
          </div>
        </div>
      </div>
    `;
    
    populateClientDropdowns();

    setTimeout(() => {
      if (window.renderPnLChart) window.renderPnLChart(invoicesData, expensesData);
    }, 50);
  }

  function populateClientDropdowns() {
    const invSelect = document.getElementById('fnInvClientSelect');
    const qteSelect = document.getElementById('fnQuoteClientSelect');

    const optionsHTML = '<option value="">-- Select Client from CRM --</option>' + clientsData.map(c => `
      <option value="${c.id}" data-name="${escapeHTML(c.name)}">${escapeHTML(c.name)} (${escapeHTML(c.company || c.brand || 'Client')})</option>
    `).join('') + '<option value="custom" data-name="General Client">+ General / Manual Client</option>';

    if (invSelect) invSelect.innerHTML = optionsHTML;
    if (qteSelect) qteSelect.innerHTML = optionsHTML;
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

    // Parse date safely in local timezone (avoids UTC shift misclassifying months)
    function parseLocalDate(dateStr) {
      if (!dateStr) return new Date();
      // Date-only strings like "2026-08-07" would parse as UTC midnight → shift to previous day in +06:00
      // Appending T00:00:00 forces local timezone interpretation
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
        return new Date(String(dateStr) + 'T00:00:00');
      }
      return new Date(dateStr);
    }

    const revData = months.map(m => {
      return invoices
        .filter(inv => {
          const status = (inv.status || '').toLowerCase();
          if (status !== 'paid') return false;
          const d = parseLocalDate(inv.date || inv.paidDate || inv.createdAt);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    });

    const expData = months.map(m => {
      return expenses
        .filter(exp => {
          const status = (exp.status || '').toLowerCase();
          if (status !== 'approved' && status !== 'paid') return false;
          const d = parseLocalDate(exp.date || exp.createdAt);
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
      const totOverdueCount = invoicesData.filter(i => isOverdue(i)).length;
      const totPaidCount = invoicesData.filter(i => (i.status || '').toLowerCase() === 'paid').length;
      const totPendingCount = invoicesData.filter(i => (i.status || '').toLowerCase() === 'pending' || (i.status || '').toLowerCase() === 'sent').length;

      let filtered = invoicesData;
      if (invoiceSearch) {
        const q = invoiceSearch.toLowerCase();
        filtered = filtered.filter(i => 
          (i.id || '').toLowerCase().includes(q) ||
          (i.clientName || i.client || '').toLowerCase().includes(q) ||
          (i.projectName || '').toLowerCase().includes(q)
        );
      }
      if (invoiceFilter === 'overdue') {
        filtered = filtered.filter(i => isOverdue(i));
      } else if (invoiceFilter === 'paid') {
        filtered = filtered.filter(i => (i.status || '').toLowerCase() === 'paid');
      } else if (invoiceFilter === 'pending') {
        filtered = filtered.filter(i => (i.status || '').toLowerCase() === 'pending' || (i.status || '').toLowerCase() === 'sent');
      }

      return `
        <!-- Filter & Search Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-ghost ${invoiceFilter === 'all' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="window.FINANCE_MODULE.setInvoiceFilter('all')">All (${invoicesData.length})</button>
            <button class="btn-ghost ${invoiceFilter === 'overdue' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#ef4444;" onclick="window.FINANCE_MODULE.setInvoiceFilter('overdue')">🔴 Overdue (${totOverdueCount})</button>
            <button class="btn-ghost ${invoiceFilter === 'pending' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#f59e0b;" onclick="window.FINANCE_MODULE.setInvoiceFilter('pending')">🟡 Pending (${totPendingCount})</button>
            <button class="btn-ghost ${invoiceFilter === 'paid' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#10b981;" onclick="window.FINANCE_MODULE.setInvoiceFilter('paid')">🟢 Paid (${totPaidCount})</button>
          </div>
          <div style="position:relative; width:240px;">
            <input type="text" class="input-text" placeholder="🔍 Search invoices..." value="${escapeHTML(invoiceSearch)}" oninput="window.FINANCE_MODULE.setInvoiceSearch(this.value)" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
          </div>
        </div>

        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--text-muted);">
            No matching invoices found for the selected criteria.
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Client Name</th>
                <th>Project / Retainer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(i => {
                const overdue = isOverdue(i);
                return `
                  <tr>
                    <td style="font-weight:700; color:var(--purple-light);">${escapeHTML(i.id || 'INV-101')}</td>
                    <td style="font-weight:700;">${escapeHTML(i.clientName || i.client || 'Agency Client')}</td>
                    <td style="color:var(--text-muted); font-size:0.78rem;">${escapeHTML(i.projectName || 'General Services')}</td>
                    <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(i.amount) || 0).toLocaleString()}</td>
                    <td style="color:var(--text-muted);">${escapeHTML(i.dueDate || 'ASAP')}</td>
                    <td>
                      ${i.status === 'Paid' ? '<span class="badge badge-emerald">Paid</span>' :
                        overdue ? '<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">🔴 Overdue</span>' :
                        `<span class="badge badge-amber">${escapeHTML(i.status || 'Pending')}</span>`}
                    </td>
                    <td>
                      <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        ${i.status !== 'Paid' ? `
                          <button class="btn-emerald btn-sm" style="font-size:0.75rem;" onclick="window.FINANCE_MODULE.markFullyPaid('${i.id}')">✅ Mark Paid</button>
                          <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.FINANCE_MODULE.markPartiallyPaid('${i.id}')">💸 Partial</button>
                        ` : ''}
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.FINANCE_MODULE.downloadInvoice('${i.id}')">📄 PDF</button>
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.FINANCE_MODULE.sendInvoiceEmail('${i.id}')">✉️ Send</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      `;
    } else if (activeTab === 'expenses') {
      const pendingCount = expensesData.filter(e => !(e.tier1?.approved && e.tier2?.approved) && e.status !== 'Approved' && e.status !== 'Rejected').length;
      const disbursedCount = expensesData.filter(e => e.status === 'Approved' || (e.tier1?.approved && e.tier2?.approved)).length;
      const rejectedCount = expensesData.filter(e => e.status === 'Rejected').length;

      let filtered = expensesData;
      if (expenseSearch) {
        const q = expenseSearch.toLowerCase();
        filtered = filtered.filter(e => 
          (e.title || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q) ||
          (e.submittedBy || e.loggedBy || '').toLowerCase().includes(q)
        );
      }
      if (expenseFilter === 'pending') {
        filtered = filtered.filter(e => !(e.tier1?.approved && e.tier2?.approved) && e.status !== 'Approved' && e.status !== 'Rejected');
      } else if (expenseFilter === 'disbursed') {
        filtered = filtered.filter(e => e.status === 'Approved' || (e.tier1?.approved && e.tier2?.approved));
      } else if (expenseFilter === 'rejected') {
        filtered = filtered.filter(e => e.status === 'Rejected');
      }

      return `
        <!-- Filter & Search Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-ghost ${expenseFilter === 'all' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="window.FINANCE_MODULE.setExpenseFilter('all')">All (${expensesData.length})</button>
            <button class="btn-ghost ${expenseFilter === 'pending' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#f59e0b;" onclick="window.FINANCE_MODULE.setExpenseFilter('pending')">🟡 Pending Review (${pendingCount})</button>
            <button class="btn-ghost ${expenseFilter === 'disbursed' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#10b981;" onclick="window.FINANCE_MODULE.setExpenseFilter('disbursed')">🟢 Disbursed (${disbursedCount})</button>
            <button class="btn-ghost ${expenseFilter === 'rejected' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#ef4444;" onclick="window.FINANCE_MODULE.setExpenseFilter('rejected')">🔴 Rejected (${rejectedCount})</button>
          </div>
          <div style="position:relative; width:240px;">
            <input type="text" class="input-text" placeholder="🔍 Search expenses..." value="${escapeHTML(expenseSearch)}" oninput="window.FINANCE_MODULE.setExpenseSearch(this.value)" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
          </div>
        </div>

        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--text-muted);">
            No matching expense claims found.
          </div>
        ` : `
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
              ${filtered.map(e => `
                <tr>
                  <td style="font-weight:700;">
                    ${escapeHTML(e.title)}
                    ${e.receiptUrl ? `<a href="${escapeHTML(e.receiptUrl)}" target="_blank" style="margin-left:0.5rem; color:var(--purple-light); font-size:0.8rem;">📎 Receipt</a>` : ''}
                  </td>
                  <td style="color:var(--text-muted);">${escapeHTML(e.category || 'General')}</td>
                  <td>👤 ${escapeHTML(e.submittedBy || e.loggedBy || 'Staff')}</td>
                  <td style="font-weight:800; color:#f87171;">৳${(Number(e.amount) || 0).toLocaleString()}</td>
                  <td>
                    ${e.status === 'Approved' || (e.tier1?.approved && e.tier2?.approved) ? '<span class="badge badge-emerald">Disbursed (Approved)</span>' : 
                      e.status === 'Rejected' ? '<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">Rejected</span>' :
                      e.status === 'Tier 2 Pending' || e.tier1?.approved ? '<span class="badge badge-purple">🟡 Pending Owner Disbursal</span>' :
                      '<span class="badge badge-amber">🟡 Tier 1 Review</span>'}
                  </td>
                  <td>
                    ${e.status !== 'Approved' && e.status !== 'Rejected' ? `
                      <div style="display:flex; gap:0.3rem;">
                        <button class="btn-emerald btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.approveTier2('${e.id}')">✅ Authorize & Disburse</button>
                        <button class="btn-secondary btn-sm" style="color:#ef4444; font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.rejectExpense('${e.id}')">❌</button>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      `;
    } else if (activeTab === 'quotes') {
      if (quotesData.length === 0) return `<div style="text-align:center; padding:3rem; color:var(--text-muted);">No price quotes logged.</div>`;
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Client Name</th>
              <th>Valid Until</th>
              <th>Quoted Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${quotesData.map(q => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${escapeHTML(q.id || 'QTE-101')}</td>
                <td style="font-weight:700;">${escapeHTML(q.clientName || 'Client')}</td>
                <td style="color:var(--text-muted);">${escapeHTML(q.validUntil || 'N/A')}</td>
                <td style="font-weight:800; color:var(--purple-light);">৳${(Number(q.amount) || 0).toLocaleString()}</td>
                <td><span class="badge ${q.status === 'Converted' ? 'badge-emerald' : 'badge-purple'}">${escapeHTML(q.status || 'Draft')}</span></td>
                <td>
                  <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    <button class="btn-secondary btn-sm" onclick="window.FINANCE_MODULE.downloadQuotePDF('${q.id}')">📄 PDF</button>
                    ${q.status !== 'Converted' ? `
                      <button class="btn-primary btn-sm" style="font-size:0.75rem;" onclick="window.FINANCE_MODULE.convertQuoteToInvoice('${q.id}')">→ Convert to Invoice</button>
                    ` : '<span style="font-size:0.75rem; color:var(--emerald-brand);">Converted</span>'}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'payments') {
      if (paymentsData.length === 0) return `<div style="text-align:center; padding:3rem; color:var(--text-muted);">No payment logs waiting for verification.</div>`;
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
                <td style="font-weight:700; color:var(--purple-light);">${escapeHTML(p.id)}</td>
                <td>${escapeHTML(p.invoice_id || p.invoiceId || 'N/A')}</td>
                <td style="font-weight:700;">${escapeHTML(p.client_name || p.clientName || 'Client')}</td>
                <td><span class="badge badge-purple">${escapeHTML(p.payment_method || p.paymentMethod || 'bKash')}</span></td>
                <td style="font-family:monospace; font-weight:700; color:#38bdf8;">${escapeHTML(p.trx_id || p.trxId || 'N/A')}</td>
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
                      <button class="btn-secondary btn-sm" style="color:#ef4444;" onclick="window.FINANCE_MODULE.rejectPayment('${p.id}')">Reject</button>
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
    reload() {
      loadFinance();
    },
    setInvoiceFilter(f) {
      invoiceFilter = f;
      renderFinanceView();
    },
    setInvoiceSearch(q) {
      invoiceSearch = q;
      renderFinanceView();
    },
    setExpenseFilter(f) {
      expenseFilter = f;
      renderFinanceView();
    },
    setExpenseSearch(q) {
      expenseSearch = q;
      renderFinanceView();
    },
    openInvoiceModal() {
      const modal = document.getElementById('invoiceModal');
      if (modal) modal.classList.add('active');
    },
    closeInvoiceModal() {
      const modal = document.getElementById('invoiceModal');
      if (modal) modal.classList.remove('active');
    },
    openNewInvoiceModal() {
      this.openInvoiceModal();
    },
    openQuoteModal() {
      const modal = document.getElementById('quoteModal');
      if (modal) modal.classList.add('active');
    },
    closeQuoteModal() {
      const modal = document.getElementById('quoteModal');
      if (modal) modal.classList.remove('active');
    },
    openExpenseModal() {
      const modal = document.getElementById('expModal');
      if (modal) modal.classList.add('active');
    },
    closeExpenseModal() {
      const modal = document.getElementById('expModal');
      if (modal) modal.classList.remove('active');
    },
    syncInvClient(selectEl) {
      const selected = selectEl.options[selectEl.selectedIndex];
      const nameInput = document.getElementById('fnInvClient');
      const idInput = document.getElementById('fnInvClientId');
      if (selected) {
        if (nameInput) nameInput.value = selected.getAttribute('data-name') || selected.text || '';
        if (idInput) idInput.value = selectEl.value;
      }
    },
    syncQuoteClient(selectEl) {
      const selected = selectEl.options[selectEl.selectedIndex];
      const nameInput = document.getElementById('fnQuoteClient');
      if (selected && nameInput) {
        nameInput.value = selected.getAttribute('data-name') || selected.text || '';
      }
    },
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
    downloadQuotePDF(id) {
      const qte = quotesData.find(q => String(q.id) === String(id));
      if (qte && window.generateInvoicePDF) {
        window.generateInvoicePDF(qte);
      } else {
        if (window.showToast) window.showToast('Failed to generate Quote PDF', 'error');
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
    async markFullyPaid(id) {
      try {
        await APP_API.put(`/invoices/${id}`, { status: 'Paid' });
        if (window.showToast) window.showToast('🎉 Invoice marked as Fully Paid!', 'success');
        loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to mark invoice as paid: ' + e.message, 'error');
      }
    },
    async markPartiallyPaid(id) {
      const inv = invoicesData.find(i => i.id === id);
      if (!inv) return;
      const amtStr = prompt(`Enter amount paid for ${id} (Total: ৳${inv.amount}):`);
      if (!amtStr) return;
      const amt = Number(amtStr);
      if (isNaN(amt) || amt <= 0) {
        if (window.showToast) window.showToast('Invalid payment amount entered.', 'error');
        return;
      }
      
      const newStatus = amt >= Number(inv.amount) ? 'Paid' : 'Partially Paid';
      
      try {
        await APP_API.put(`/invoices/${id}`, { status: newStatus, notes: `Paid ${amt} BDT` });
        if (window.showToast) window.showToast(`Invoice marked as ${newStatus}`, 'success');
        loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to update invoice: ' + e.message, 'error');
      }
    },
    async convertQuoteToInvoice(id) {
      try {
        const res = await APP_API.post(`/invoices/quotes/${id}/convert`);
        if (res.success) {
          if (window.showToast) window.showToast('📜 Quote converted to Invoice successfully!', 'success');
          loadFinance();
          if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to convert quote: ' + e.message, 'error');
      }
    },
    async approveTier1(id) {
      try {
        await APP_API.post(`/expenses/${id}/approve-tier1`, { approvedBy: window.CURRENT_USER?.name || 'Line Manager' });
        if (window.showToast) window.showToast('Tier 1 Approved ✅ (Pending Owner Disbursal)', 'success');
        loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to approve Tier 1: ' + e.message, 'error');
      }
    },
    async approveTier2(id) {
      try {
        await APP_API.post(`/expenses/${id}/approve-tier2`, { approvedBy: window.CURRENT_USER?.name || 'Executive Owner' });
        if (window.showToast) window.showToast('✅ Expense Authorized & Disbursed!', 'success');
        loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to approve Tier 2: ' + e.message, 'error');
      }
    },
    async rejectExpense(id) {
      const reason = prompt('Enter rejection note for this expense claim:');
      if (reason === null) return;
      try {
        await APP_API.post(`/expenses/${id}/reject`, { reason: reason || 'Declined by Executive' });
        if (window.showToast) window.showToast('Expense claim declined', 'info');
        loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to reject expense: ' + e.message, 'error');
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
          if (window.showToast) window.showToast('Payment verified! Invoice marked as Paid 💰', 'success');
          loadFinance();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to verify payment: ' + err.message, 'error');
      }
    },
    async rejectPayment(payId) {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      try {
        const res = await APP_API.post(`/payments/${payId}/reject`, { reason });
        if (res.success) {
          if (window.showToast) window.showToast('Payment proof rejected', 'info');
          loadFinance();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to reject payment: ' + err.message, 'error');
      }
    },
    async submitExpense() {
      const title = document.getElementById('fnExpTitle').value.trim();
      const cat = document.getElementById('fnExpCat').value;
      const amt = document.getElementById('fnExpAmount').value;
      const receiptFile = document.getElementById('fnExpReceipt').files[0];
      
      if (!title || !amt) {
        if (window.showToast) window.showToast('Title and Amount are required.', 'error');
        return;
      }

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
        if (window.showToast) window.showToast('Expense Claim Submitted! 🚀', 'success');
        this.closeExpenseModal();
        loadFinance();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to submit expense claim: ' + e.message, 'error');
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

      if (!clientName || !amt) {
        if (window.showToast) window.showToast('Client account and amount are required.', 'error');
        return;
      }

      try {
        const res = await APP_API.post('/invoices/quotes', {
          clientName,
          items: [{ description: desc, amount: amt }],
          amount: amt,
          validDays: parseInt(validDays, 10) || 14
        });
        if (window.showToast) window.showToast('Quote Generated! 📜', 'success');
        this.closeQuoteModal();
        loadFinance();
        
        if (res.quote && window.generateInvoicePDF) {
          const quoteObj = { ...res.quote, id: res.quote.id.replace('INV', 'QTE'), dueDate: res.quote.validUntil };
          window.generateInvoicePDF(quoteObj);
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to save quote: ' + e.message, 'error');
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
      const totalEl = document.getElementById('fnInvTotal');
      if (totalEl) totalEl.value = `BDT ${total.toLocaleString()}`;
      return total;
    },
    async submitInvoice() {
      const clientName = document.getElementById('fnInvClient').value.trim();
      const clientId = document.getElementById('fnInvClientId').value;
      const desc = document.getElementById('fnInvDesc').value.trim();
      const amt = Number(document.getElementById('fnInvAmt').value) || 0;
      const taxRate = Number(document.getElementById('fnInvVat').value) || 0;
      const discount = Number(document.getElementById('fnInvDisc').value) || 0;
      const total = amt + (amt * (taxRate / 100)) - discount;

      if (!clientName || !amt) {
        if (window.showToast) window.showToast('Client account and amount are required.', 'error');
        return;
      }

      try {
        await APP_API.post('/invoices', {
          clientId,
          clientName,
          items: [{ description: desc, amount: total }],
          amount: total,
          taxRate,
          discount
        });
        if (window.showToast) window.showToast('Invoice Created! 🧾', 'success');
        this.closeInvoiceModal();
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to create invoice: ' + e.message, 'error');
      }
    },
    openImportModal() {
      let modal = document.getElementById('fnImportInvoicesModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnImportInvoicesModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-box" style="max-width: 500px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">🧾 Import Historical Invoices CSV</h3>
              <button onclick="window.FINANCE_MODULE.closeImportModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
            </div>
            <div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem;">
                Format: <code>InvoiceID, ClientName, Amount, IssueDate, Status</code>
              </p>
              <textarea id="fnCsvText" class="input-text" style="height: 120px; font-family: monospace; font-size: 0.78rem;" placeholder="INV-2026-001, Chillox, 150000, 2026-06-01, Paid&#10;INV-2026-002, Apex Shoes, 95000, 2026-06-05, Paid"></textarea>
              <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top: 1.25rem;">
                <button type="button" class="btn-secondary" onclick="window.FINANCE_MODULE.closeImportModal()">Cancel</button>
                <button type="button" class="btn-primary" onclick="window.FINANCE_MODULE.submitInvoicesCSV()">📥 Import Invoices</button>
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
      if (!text) {
        if (window.showToast) window.showToast('Please paste CSV text first.', 'error');
        return;
      }
      const lines = text.split('\n');
      const rows = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { invoiceId: parts[0], clientName: parts[1] || 'Client', amount: parseFloat(parts[2]) || 0, issueDate: parts[3] || '', status: parts[4] || 'Paid' };
      }).filter(r => r.invoiceId || r.clientName);

      try {
        const res = await APP_API.post('/admin/import/invoices', { rows });
        this.closeImportModal();
        if (window.showToast) window.showToast(`Imported ${res.addedCount || rows.length} invoice(s)! 🧾`, 'success');
        loadFinance();
      } catch (err) {
        if (window.showToast) window.showToast('CSV import failed: ' + err.message, 'error');
      }
    },
    async approveTier1(id) {
      try {
        await APP_API.post(`/expenses/${id}/approve-tier1`, {});
        if (window.showToast) window.showToast('Expense Tier 1 Approved! 🚀', 'success');
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed Tier 1 approval: ' + e.message, 'error');
      }
    },
    async approveTier2(id) {
      try {
        await APP_API.post(`/expenses/${id}/approve-tier2`, {});
        if (window.showToast) window.showToast('Expense Tier 2 Approved! 💰', 'success');
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed Tier 2 approval: ' + e.message, 'error');
      }
    },
    async rejectExpense(id) {
      try {
        await APP_API.patch(`/expenses/${id}`, { status: 'Rejected' });
        if (window.showToast) window.showToast('Expense Claim Rejected.', 'info');
        loadFinance();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to reject expense: ' + e.message, 'error');
      }
    }
  };

  await loadFinance();
};
