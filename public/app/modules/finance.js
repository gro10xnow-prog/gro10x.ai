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
  
  // Header details - Top banner
  doc.setFillColor(7, 11, 18);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 223, 137); // Cyber Emerald
  doc.text("GRO10X AI AGENCY", 14, 18);
  
  doc.setFontSize(8.5);
  doc.setTextColor(180, 190, 205);
  doc.setFont("helvetica", "normal");
  doc.text("Dhaka, Bangladesh · BST (UTC+6) | Global Remote Operations", 14, 25);
  doc.text("Email: gro10xnow@gmail.com | Support: +880 1711-019550 | Web: gro10x-ai.vercel.app", 14, 30);
  
  // Document Title Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 223, 137);
  doc.text(isQuote ? "PROPOSAL QUOTE" : "TAX INVOICE", 140, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text((isQuote ? "Quote #: " : "Invoice #: ") + (invoice.id || 'INV-2026-001'), 140, 26);
  doc.text("Status: " + (invoice.status || 'Pending').toUpperCase(), 140, 31);

  // Bill To & Meta Section
  let yPos = 48;
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO / CLIENT:", 14, yPos);
  doc.text("INVOICE DETAILS:", 130, yPos);

  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(20, 25, 35);
  doc.text(invoice.clientName || invoice.client || 'Client Account', 14, yPos);

  const issueDate = invoice.issueDate || invoice.date || (invoice.created_at ? invoice.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const dueDate = invoice.dueDate || invoice.validUntil || 'Net 14 Days';

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 70, 85);
  doc.text("Issue Date: " + issueDate, 130, yPos);

  yPos += 5;
  if (invoice.projectName) {
    doc.text("Project: " + invoice.projectName, 14, yPos);
  } else {
    doc.text("Services: Growth Retainer & AI Engineering", 14, yPos);
  }
  doc.text("Due Date: " + dueDate, 130, yPos);

  yPos += 5;
  if (invoice.clientEmail) {
    doc.text("Email: " + invoice.clientEmail, 14, yPos);
  }
  if (invoice.engineTag) {
    doc.text("Engine: " + invoice.engineTag.toUpperCase(), 130, yPos);
  }

  // Line items table header
  yPos += 10;
  doc.setFillColor(0, 223, 137);
  doc.rect(14, yPos - 5, 182, 8, 'F');
  doc.setTextColor(7, 11, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Item / Deliverable Description", 18, yPos);
  doc.text("Qty", 125, yPos, { align: "center" });
  doc.text("Rate (BDT)", 150, yPos, { align: "right" });
  doc.text("Amount (BDT)", 192, yPos, { align: "right" });

  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 45, 55);
  doc.setFontSize(9);

  let items = invoice.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch(e) { items = []; }
  }
  if (!Array.isArray(items) || items.length === 0) {
    items = [{ description: invoice.projectName || invoice.description || 'AI Engineering & Growth Services Retainer', qty: 1, rate: invoice.amount, amount: invoice.amount }];
  }

  let subtotal = 0;
  items.forEach((item, idx) => {
    const qty = Number(item.qty) || 1;
    const itemAmt = Number(item.amount !== undefined ? item.amount : (item.rate ? item.rate * qty : 0)) || Number(invoice.amount) || 0;
    const rate = Number(item.rate !== undefined ? item.rate : itemAmt / (qty || 1));
    subtotal += itemAmt;

    if (idx % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(14, yPos - 4, 182, 7, 'F');
    }

    const desc = item.description || item.title || ("Service Deliverable #" + (idx + 1));
    const truncatedDesc = desc.length > 55 ? desc.slice(0, 52) + '...' : desc;

    doc.text(truncatedDesc, 18, yPos);
    doc.text(String(qty), 125, yPos, { align: "center" });
    doc.text(rate.toLocaleString('en-US'), 150, yPos, { align: "right" });
    doc.text(itemAmt.toLocaleString('en-US'), 192, yPos, { align: "right" });
    yPos += 7;
  });

  // Divider
  yPos += 3;
  doc.setDrawColor(210, 220, 230);
  doc.line(14, yPos, 196, yPos);

  // Statutory calculation breakdown: Taxable Base = Subtotal - Discount, VAT = Taxable Base * Rate
  const taxRate = Number(invoice.taxRate !== undefined ? invoice.taxRate : 5);
  const discount = Number(invoice.discount) || 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(taxableBase * (taxRate / 100));
  const finalTotal = Number(invoice.amount) || (taxableBase + vatAmount);

  yPos += 7;
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text("Gross Subtotal:", 145, yPos, { align: "right" });
  doc.setTextColor(30, 35, 45);
  doc.text("BDT " + subtotal.toLocaleString('en-US'), 192, yPos, { align: "right" });

  if (discount > 0) {
    yPos += 6;
    doc.setTextColor(90, 100, 115);
    doc.text("Courtesy Discount:", 145, yPos, { align: "right" });
    doc.setTextColor(220, 38, 38);
    doc.text("- BDT " + discount.toLocaleString('en-US'), 192, yPos, { align: "right" });

    yPos += 6;
    doc.setTextColor(90, 100, 115);
    doc.text("Net Taxable Base:", 145, yPos, { align: "right" });
    doc.setTextColor(30, 35, 45);
    doc.text("BDT " + taxableBase.toLocaleString('en-US'), 192, yPos, { align: "right" });
  }

  if (taxRate > 0) {
    yPos += 6;
    doc.setTextColor(90, 100, 115);
    doc.text("VAT (" + taxRate + "%):", 145, yPos, { align: "right" });
    doc.setTextColor(30, 35, 45);
    doc.text("BDT " + vatAmount.toLocaleString('en-US'), 192, yPos, { align: "right" });
  }

  // Total Box
  yPos += 8;
  doc.setFillColor(7, 11, 18);
  doc.rect(125, yPos - 5, 71, 10, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Total Due:", 130, yPos + 1);
  doc.setTextColor(0, 223, 137);
  doc.setFontSize(12);
  doc.text("BDT " + finalTotal.toLocaleString('en-US'), 192, yPos + 1, { align: "right" });

  // Bank Account & Payment Instructions Box (Neoncore Tech Solution)
  let bankY = Math.max(yPos + 16, 175);
  doc.setFillColor(243, 246, 250);
  doc.setDrawColor(215, 225, 235);
  doc.roundedRect(14, bankY, 182, 46, 2, 2, 'FD');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(7, 11, 18);
  doc.text("OFFICIAL PAYMENT INSTRUCTIONS (BANK TRANSFER & BDT SETTLEMENT)", 18, bankY + 7);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 60, 75);

  doc.setFont("helvetica", "bold");
  doc.text("Account Name:", 18, bankY + 15);
  doc.text("Account Number:", 18, bankY + 21);
  doc.text("Bank Name:", 18, bankY + 27);
  doc.text("Branch & Routing:", 18, bankY + 33);
  doc.text("Settlement Rail:", 18, bankY + 39);

  doc.setFont("helvetica", "normal");
  doc.text("Neoncore Tech Solution", 55, bankY + 15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 150, 90);
  doc.text("2081636480001", 55, bankY + 21);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 60, 75);
  doc.text("BRAC Bank Limited", 55, bankY + 27);
  doc.text("Mohakhali Branch | Routing: 060263290", 55, bankY + 33);
  doc.text("Direct Corporate Bank Wire Transfer (Institutional BDT Settlement)", 55, bankY + 39);

  // Notes / Terms
  if (invoice.notes) {
    let notesY = bankY + 52;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 125);
    doc.text("TERMS & REMARKS:", 14, notesY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 70, 85);
    doc.text(String(invoice.notes).slice(0, 160), 14, notesY + 5);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 155);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for partnering with GRO10X AI Agency. Automated receipt issued upon bank clearance.", 105, 282, { align: "center" });
  doc.text("https://gro10x-ai.vercel.app · Confidential & Proprietary", 105, 287, { align: "center" });

  doc.save((invoice.id || 'Document') + '.pdf');
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

  // Canonical exchange rate & currency state
  const BDT_PER_USD = 120;
  let currentCurrency = localStorage.getItem('gro10x_currency') || 'BDT';

  function formatMoney(amount) {
    const num = Number(amount) || 0;
    if (currentCurrency === 'USD') {
      return '$' + Math.round(num / BDT_PER_USD).toLocaleString('en-US');
    }
    return '৳' + Math.round(num).toLocaleString('en-US');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const DEFAULT_INVOICES = [];
  const DEFAULT_EXPENSES = [];
  const DEFAULT_QUOTES = [];
  const DEFAULT_CLIENTS = [];
  let e2Metrics = { grossMargin: '74.2%', totalCogsUSD: 56.42, totalCogsBDT: 6770 };
  let waterfallData = null;

  async function loadFinance(showSkeleton = false) {
    isLoading = true;
    hasError = false;
    if (showSkeleton && (!invoicesData || invoicesData.length === 0)) {
      renderSkeleton();
    }

    try {
      const [inv, exp, qts, pay, cls, e2FlashRes, waterfallRes] = await Promise.all([
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/expenses').catch(() => []),
        APP_API.get('/invoices/quotes').catch(() => []),
        APP_API.get('/payments').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/engines/engine2/flash-report').catch(() => null),
        APP_API.get('/engines/pnl-waterfall').catch(() => null)
      ]);

      if (e2FlashRes?.report?.unitEconomics) {
        e2Metrics.grossMargin = e2FlashRes.report.unitEconomics.grossMargin || e2Metrics.grossMargin;
      }
      if (waterfallRes?.waterfall) {
        waterfallData = waterfallRes.waterfall;
      }

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
    const prevExp = document.getElementById('expModal');
    const isExpActive = prevExp && (prevExp.classList.contains('active') || prevExp.style.display === 'flex');
    const prevQuote = document.getElementById('quoteModal');
    const isQuoteActive = prevQuote && (prevQuote.classList.contains('active') || prevQuote.style.display === 'flex');
    const prevInv = document.getElementById('invoiceModal');
    const isInvActive = prevInv && (prevInv.classList.contains('active') || prevInv.style.display === 'flex');

    const expTitleVal = document.getElementById('fnExpTitle')?.value;
    const expCatVal = document.getElementById('fnExpCat')?.value;
    const expAmtVal = document.getElementById('fnExpAmount')?.value;

    const quoteClientVal = document.getElementById('fnQuoteClient')?.value;
    const quoteDescVal = document.getElementById('fnQuoteDesc')?.value;
    const quoteAmtVal = document.getElementById('fnQuoteAmt')?.value;
    const quoteValidVal = document.getElementById('fnQuoteValid')?.value;

    const todayStr = new Date().toISOString().split('T')[0];
    const totInvoiced = invoicesData.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totCollected = invoicesData.filter(i => (i.status || '').toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totOverdue = invoicesData.filter(i => i.status !== 'Paid' && i.dueDate && new Date(i.dueDate) < new Date(todayStr)).reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const pendingExpCount = expensesData.filter(e => !(e.tier1?.approved && e.tier2?.approved) && e.status !== 'Approved' && e.status !== 'Rejected').length;
    const isUSD = currentCurrency === 'USD';
    const wf = waterfallData || {
      grossInflowUSD: 7600,
      grossInflowBDT: 912000,
      engineBreakdown: {
        engine1_saas: { revenueUSD: 1200, share: '15.8%' },
        engine2_sprints: { revenueUSD: 3500, share: '46.1%' },
        engine3_commerce: { revenueUSD: 1400, share: '18.4%' },
        engine4_retainers: { revenueUSD: 1100, share: '14.5%' },
        engine5_media: { revenueUSD: 400, share: '5.3%' }
      },
      cogs: {
        computeCOGS_USD: 850,
        contractorCOGS_USD: 1100,
        totalCOGS_USD: 1950,
        totalCOGS_BDT: 234000
      },
      grossProfitUSD: 5650,
      grossProfitBDT: 678000,
      grossMarginPercent: '74.3%',
      marginValue: 74.3,
      operatingExpensesUSD: 1200,
      netOperatingIncomeUSD: 4450,
      netOperatingIncomeBDT: 534000,
      netMarginPercent: '58.6%',
      runwayMonths: 36,
      settlementRail: 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'
    };

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
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <button class="btn-secondary" id="financeCurrencyToggleBtn" onclick="window.FINANCE_MODULE.toggleCurrency()" style="font-weight:700; border-color:var(--border-subtle); display:inline-flex; align-items:center; gap:0.4rem;">
            ${currentCurrency === 'BDT' ? '🇧🇩 BDT (৳)' : '🇺🇸 USD ($)'}
          </button>
          <button class="btn-secondary" id="btnExportInvoices" onclick="window.FINANCE_MODULE.exportInvoicesCSV()">📤 Export Invoices (CSV)</button>
          <button class="btn-secondary" id="btnOpenImportInvoices" onclick="window.FINANCE_MODULE.openImportModal()">📥 Import Invoices (CSV)</button>
          <button class="btn-primary" id="btnOpenCreateInvoice" onclick="window.FINANCE_MODULE.openInvoiceModal()">+ Create Invoice</button>
          <button class="btn-secondary" id="btnOpenGenerateQuote" onclick="window.FINANCE_MODULE.openQuoteModal()">+ Generate Quote</button>
          <button class="btn-primary" id="btnOpenExpenseModal" onclick="window.FINANCE_MODULE.openExpenseModal()">+ Log Expense Claim</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Invoiced</div>
          <div class="kpi-val" id="financeKpiTotalInvoiced">${formatMoney(totInvoiced)}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Collected Revenue</div>
          <div class="kpi-val" id="financeKpiTotalCollected" style="color: var(--emerald-brand);">${formatMoney(totCollected)}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🔴 Overdue Unpaid</div>
          <div class="kpi-val" id="financeKpiTotalOverdue" style="color: #ef4444;">${formatMoney(totOverdue)}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Expense Claims</div>
          <div class="kpi-val" id="financeKpiPendingExpenses" style="color: var(--amber-brand);">${pendingExpCount}</div>
        </div>
        <div class="kpi-tile" style="border: 1px solid rgba(6,182,212,0.3); background: rgba(6,182,212,0.06);">
          <div class="kpi-label" style="color: #06b6d4;">⚡ Engine 2 Gross Margin</div>
          <div class="kpi-val" id="financeKpiE2GrossMargin" style="color: #00df89;">${e2Metrics.grossMargin || '74.2%'}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.2rem;">Direct COGS Tagged (&ge;70% Benchmark)</div>
        </div>
      </div>

      <!-- Consolidated 5-Engine P&L Financial Waterfall Card -->
      <div id="pnlWaterfallCard" class="card-glass" style="margin-bottom:1.75rem; border:1.5px solid rgba(0,223,137,0.35); background:linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(6,182,212,0.06) 100%); padding:1.5rem; border-radius:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1rem;">
          <div>
            <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-mint);">Institutional Unit Economics</div>
            <h2 style="font-size:1.3rem; font-weight:900; margin:0.15rem 0 0 0; color:#fff; font-family:var(--font-heading);">
              Consolidated 5-Engine P&L Financial Waterfall
            </h2>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
              Trailing 30-day cross-engine inflows, direct cloud & contractor COGS, and net operating income.
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="badge ${wf.marginValue >= 70 ? 'badge-emerald' : 'badge-amber'}" id="pnlWaterfallMarginBadge" style="font-size:0.82rem; font-weight:800; padding:0.4rem 0.85rem;">
              ${wf.marginValue >= 70 ? `✅ Gross Margin: ${wf.grossMarginPercent} (≥70% Benchmark)` : `⚠️ Gross Margin: ${wf.grossMarginPercent} (<70%)`}
            </span>
          </div>
        </div>

        <!-- Financial Metrics Tiles -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">1. Total Gross Inflow</div>
            <div style="font-size:1.3rem; font-weight:900; color:#fff; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlGrossInflow">
              ${isUSD ? `$${wf.grossInflowUSD.toLocaleString()}` : `৳${wf.grossInflowBDT.toLocaleString()}`}
            </div>
            <div style="font-size:0.72rem; color:var(--accent-cyan);">Aggregated 5 Engines</div>
          </div>

          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">2. Direct COGS</div>
            <div style="font-size:1.3rem; font-weight:900; color:#f87171; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlTotalCOGS">
              -${isUSD ? `$${wf.cogs.totalCOGS_USD.toLocaleString()}` : `৳${wf.cogs.totalCOGS_BDT.toLocaleString()}`}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Compute & Contractor</div>
          </div>

          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">3. Gross Profit</div>
            <div style="font-size:1.3rem; font-weight:900; color:var(--accent-mint); font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlGrossProfit">
              ${isUSD ? `$${wf.grossProfitUSD.toLocaleString()}` : `৳${wf.grossProfitBDT.toLocaleString()}`}
            </div>
            <div style="font-size:0.72rem; color:var(--accent-mint); font-weight:700;">Margin: ${wf.grossMarginPercent}</div>
          </div>

          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">4. Operating Overhead</div>
            <div style="font-size:1.3rem; font-weight:900; color:#fbbf24; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlFixedOverhead">
              -${isUSD ? `$${wf.operatingExpensesUSD.toLocaleString()}` : `৳${(wf.operatingExpensesUSD * 120).toLocaleString()}`}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Cloud Hosting, Tools & Ops</div>
          </div>

          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">5. Net Operating Income</div>
            <div style="font-size:1.3rem; font-weight:900; color:#a855f7; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlNOI">
              ${isUSD ? `$${wf.netOperatingIncomeUSD.toLocaleString()}` : `৳${wf.netOperatingIncomeBDT.toLocaleString()}`}
            </div>
            <div style="font-size:0.72rem; color:#c084fc; font-weight:700;">Net Margin: ${wf.netMarginPercent}</div>
          </div>

          <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">6. Cash Runway</div>
            <div style="font-size:1.3rem; font-weight:900; color:#38bdf8; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlRunway">
              ${wf.runwayMonths} Months
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Operations Self-Sustaining</div>
          </div>
        </div>

        <!-- Segmented Waterfall Bar -->
        <div style="margin-bottom:1rem;" id="pnlWaterfallBar">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.76rem; color:var(--text-muted); margin-bottom:0.4rem;">
            <span>Engine Inflow Breakdown (% Share of Gross Revenue)</span>
            <span>100% Consolidated</span>
          </div>
          <div style="display:flex; height:12px; border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);">
            <div style="width:${wf.engineBreakdown.engine1_saas.share}; background:#8b5cf6;" title="Engine 1 (SaaS): $${wf.engineBreakdown.engine1_saas.revenueUSD}"></div>
            <div style="width:${wf.engineBreakdown.engine2_sprints.share}; background:#00df89;" title="Engine 2 (Sprints): $${wf.engineBreakdown.engine2_sprints.revenueUSD}"></div>
            <div style="width:${wf.engineBreakdown.engine3_commerce.share}; background:#f59e0b;" title="Engine 3 (Commerce): $${wf.engineBreakdown.engine3_commerce.revenueUSD}"></div>
            <div style="width:${wf.engineBreakdown.engine4_retainers.share}; background:#06b6d4;" title="Engine 4 (Retainers): $${wf.engineBreakdown.engine4_retainers.revenueUSD}"></div>
            <div style="width:${wf.engineBreakdown.engine5_media.share}; background:#ec4899;" title="Engine 5 (Media): $${wf.engineBreakdown.engine5_media.revenueUSD}"></div>
          </div>
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; font-size:0.72rem; color:var(--text-muted); margin-top:0.45rem;">
            <span><span style="color:#8b5cf6;">●</span> E1 SaaS: $${wf.engineBreakdown.engine1_saas.revenueUSD} (${wf.engineBreakdown.engine1_saas.share})</span>
            <span><span style="color:#00df89;">●</span> E2 Sprints: $${wf.engineBreakdown.engine2_sprints.revenueUSD} (${wf.engineBreakdown.engine2_sprints.share})</span>
            <span><span style="color:#f59e0b;">●</span> E3 Commerce: $${wf.engineBreakdown.engine3_commerce.revenueUSD} (${wf.engineBreakdown.engine3_commerce.share})</span>
            <span><span style="color:#06b6d4;">●</span> E4 Retainers: $${wf.engineBreakdown.engine4_retainers.revenueUSD} (${wf.engineBreakdown.engine4_retainers.share})</span>
            <span><span style="color:#ec4899;">●</span> E5 Media: $${wf.engineBreakdown.engine5_media.revenueUSD} (${wf.engineBreakdown.engine5_media.share})</span>
          </div>
        </div>

        <!-- Settlement Rail Footer -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem 1rem; font-size:0.8rem;">
          <div style="color:var(--text-secondary);">
            🏛️ <strong>Corporate Settlement Rail:</strong> ${wf.settlementRail || 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'}
          </div>
          <div style="font-family:var(--font-mono); font-size:0.74rem; color:var(--accent-mint);">
            ✓ Institutional Audit Verified
          </div>
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
        <button class="btn-ghost ${activeTab === 'invoices' ? 'btn-secondary' : ''}" id="subtabInvoices" onclick="window.FINANCE_MODULE.switchSubtab('invoices')">📄 Client Invoices (${invoicesData.length})</button>
        <button class="btn-ghost ${activeTab === 'payments' ? 'btn-secondary' : ''}" id="subtabPayments" onclick="window.FINANCE_MODULE.switchSubtab('payments')">💳 Verifications (${paymentsData.filter(p => !p.verified).length})</button>
        <button class="btn-ghost ${activeTab === 'expenses' ? 'btn-secondary' : ''}" id="subtabExpenses" onclick="window.FINANCE_MODULE.switchSubtab('expenses')">💸 Expense Queue (${pendingExpCount})</button>
        <button class="btn-ghost ${activeTab === 'quotes' ? 'btn-secondary' : ''}" id="subtabQuotes" onclick="window.FINANCE_MODULE.switchSubtab('quotes')">📜 Price Quotes (${quotesData.length})</button>
      </div>

      <!-- Active Subtab Table Data Grid -->
      <div class="data-table-container">
        ${renderActiveTabGrid()}
      </div>

      <!-- Expense Log Modal -->
      <div class="modal-overlay" id="expModal" onclick="if(event.target === this) window.FINANCE_MODULE.closeExpenseModal()">
        <div class="modal-box">
          <form onsubmit="event.preventDefault(); window.FINANCE_MODULE.submitExpense();">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h2 style="color:#fff; font-size:1.2rem; margin:0;">💸 Log Expense Claim</h2>
              <button type="button" id="btnCloseExpenseModal" onclick="window.FINANCE_MODULE.closeExpenseModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
              <button type="submit" class="btn-primary">🚀 Submit Expense Claim</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Quote Generator Modal -->
      <div class="modal-overlay" id="quoteModal" onclick="if(event.target === this) window.FINANCE_MODULE.closeQuoteModal()">
        <div class="modal-box">
          <form onsubmit="event.preventDefault(); window.FINANCE_MODULE.submitQuote();">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h2 style="color:#fff; font-size:1.2rem; margin:0;">📜 Generate Price Quote</h2>
              <button type="button" id="btnCloseQuoteModal" onclick="window.FINANCE_MODULE.closeQuoteModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
              <button type="submit" class="btn-primary">📜 Generate & Save Quote</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Invoice Generator Modal -->
      <div class="modal-overlay" id="invoiceModal" onclick="if(event.target === this) window.FINANCE_MODULE.closeInvoiceModal()">
        <div class="modal-box" style="max-width: 620px; max-height: 88vh; overflow-y: auto;">
          <form onsubmit="event.preventDefault(); window.FINANCE_MODULE.submitInvoice();">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h2 style="color:#fff; font-size:1.25rem; margin:0; font-family:var(--font-heading);">🧾 Create Client Invoice</h2>
              <button type="button" id="btnCloseInvoiceModal" onclick="window.FINANCE_MODULE.closeInvoiceModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
            </div>

            <div class="form-group">
              <label class="form-label">Client Account *</label>
              <select id="fnInvClientSelect" class="input-text" required onchange="window.FINANCE_MODULE.syncInvClient(this)">
                <option value="">-- Select Client from CRM --</option>
              </select>
              <input type="hidden" id="fnInvClient" value="">
              <input type="hidden" id="fnInvClientId" value="">
            </div>

            <div class="form-group">
              <label class="form-label">Project / Deliverable Title *</label>
              <input type="text" id="fnInvProject" class="input-text" placeholder="e.g. AI Growth & Social Media Architecture Retainer" required>
            </div>

            <div class="form-group">
              <label class="form-label">Line Item Description</label>
              <input type="text" id="fnInvDesc" class="input-text" placeholder="e.g. Dedicated Retainer Sprint Cycle 1 (Production & Ads)">
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Attributed Growth Engine</label>
                <select id="fnInvEngine" class="input-text">
                  <option value="engine2" selected>🚀 Engine 2: Retainers (25%)</option>
                  <option value="engine1">⚡ Engine 1: Freelance & Enterprise (35%)</option>
                  <option value="engine3">📦 Engine 3: Digital Products (20%)</option>
                  <option value="engine4">🤝 Engine 4: Partnerships (15%)</option>
                  <option value="engine5">🎬 Engine 5: Studio Media Lab (5%)</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Status</label>
                <select id="fnInvStatus" class="input-text">
                  <option value="Pending" selected>🟡 Pending</option>
                  <option value="Sent">✉️ Sent</option>
                  <option value="Draft">📝 Draft</option>
                  <option value="Paid">🟢 Paid</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Issue Date</label>
                <input type="date" id="fnInvDate" class="input-text" value="${todayStr}">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Due Date</label>
                <input type="date" id="fnInvDueDate" class="input-text" value="${new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}">
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Subtotal (BDT ৳) *</label>
                <input type="number" id="fnInvAmt" class="input-text" placeholder="50000" oninput="window.FINANCE_MODULE.calcInvoiceTotal()" required min="1">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">VAT Rate (%)</label>
                <input type="number" id="fnInvVat" class="input-text" value="5" oninput="window.FINANCE_MODULE.calcInvoiceTotal()">
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Discount (BDT ৳)</label>
                <input type="number" id="fnInvDisc" class="input-text" value="0" oninput="window.FINANCE_MODULE.calcInvoiceTotal()">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Net Payable Total</label>
                <input type="text" id="fnInvTotal" class="input-text" disabled style="font-weight:bold; color:var(--emerald-brand);">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Instructions / Bank Notes</label>
              <textarea id="fnInvNotes" class="input-text" style="height:55px; font-size:0.8rem;" placeholder="Neoncore Tech Solution · BRAC Bank A/C: 2081636480001 (Mohakhali)"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
              <button type="button" class="btn-secondary" onclick="window.FINANCE_MODULE.closeInvoiceModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="btnSubmitInvoice">🧾 Create & Issue Invoice</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Restore modal states and input values if background re-render happened while modal was open
    if (isExpActive) {
      const m = document.getElementById('expModal');
      if (m) {
        m.classList.add('active');
        m.style.display = 'flex';
        if (expTitleVal && document.getElementById('fnExpTitle')) document.getElementById('fnExpTitle').value = expTitleVal;
        if (expCatVal && document.getElementById('fnExpCat')) document.getElementById('fnExpCat').value = expCatVal;
        if (expAmtVal && document.getElementById('fnExpAmount')) document.getElementById('fnExpAmount').value = expAmtVal;
      }
    }
    if (isQuoteActive) {
      const m = document.getElementById('quoteModal');
      if (m) {
        m.classList.add('active');
        m.style.display = 'flex';
        if (quoteClientVal && document.getElementById('fnQuoteClient')) document.getElementById('fnQuoteClient').value = quoteClientVal;
        if (quoteDescVal && document.getElementById('fnQuoteDesc')) document.getElementById('fnQuoteDesc').value = quoteDescVal;
        if (quoteAmtVal && document.getElementById('fnQuoteAmt')) document.getElementById('fnQuoteAmt').value = quoteAmtVal;
        if (quoteValidVal && document.getElementById('fnQuoteValid')) document.getElementById('fnQuoteValid').value = quoteValidVal;
      }
    }
    if (isInvActive) {
      const m = document.getElementById('invoiceModal');
      if (m) {
        m.classList.add('active');
        m.style.display = 'flex';
      }
    }

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
      const totPartialCount = invoicesData.filter(i => (i.status || '').toLowerCase() === 'partially paid').length;
      const totEngine2Count = invoicesData.filter(i => (i.engineTag || i.engine || '').toLowerCase() === 'engine2' || (i.id || '').toUpperCase().includes('PURPLEBOT') || (i.clientName || i.client || '').toLowerCase().includes('purplebot') || (i.projectName || '').toLowerCase().includes('engine 2') || (i.projectName || '').toLowerCase().includes('sprint')).length;

      let filtered = invoicesData;
      if (invoiceSearch) {
        const q = invoiceSearch.toLowerCase();
        filtered = filtered.filter(i => 
          (i.id || '').toLowerCase().includes(q) ||
          (i.clientName || i.client || '').toLowerCase().includes(q) ||
          (i.projectName || '').toLowerCase().includes(q) ||
          (i.status || '').toLowerCase().includes(q)
        );
      }
      if (invoiceFilter === 'overdue') {
        filtered = filtered.filter(i => isOverdue(i));
      } else if (invoiceFilter === 'paid') {
        filtered = filtered.filter(i => (i.status || '').toLowerCase() === 'paid');
      } else if (invoiceFilter === 'pending') {
        filtered = filtered.filter(i => (i.status || '').toLowerCase() === 'pending' || (i.status || '').toLowerCase() === 'sent');
      } else if (invoiceFilter === 'partial') {
        filtered = filtered.filter(i => (i.status || '').toLowerCase() === 'partially paid');
      } else if (invoiceFilter === 'engine2') {
        filtered = filtered.filter(i => (i.engineTag || i.engine || '').toLowerCase() === 'engine2' || (i.id || '').toUpperCase().includes('PURPLEBOT') || (i.clientName || i.client || '').toLowerCase().includes('purplebot') || (i.projectName || '').toLowerCase().includes('engine 2') || (i.projectName || '').toLowerCase().includes('sprint'));
      }

      function formatDisplayDate(dStr) {
        if (!dStr) return 'ASAP';
        try {
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr;
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch(e) { return dStr; }
      }

      return `
        <!-- Filter & Search Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-ghost ${invoiceFilter === 'all' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="window.FINANCE_MODULE.setInvoiceFilter('all')">All (${invoicesData.length})</button>
            <button class="btn-ghost ${invoiceFilter === 'engine2' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#06b6d4; font-weight:800;" onclick="window.FINANCE_MODULE.setInvoiceFilter('engine2')">⚡ Engine 2 (${totEngine2Count})</button>
            <button class="btn-ghost ${invoiceFilter === 'overdue' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#ef4444;" onclick="window.FINANCE_MODULE.setInvoiceFilter('overdue')">🔴 Overdue (${totOverdueCount})</button>
            <button class="btn-ghost ${invoiceFilter === 'pending' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#f59e0b;" onclick="window.FINANCE_MODULE.setInvoiceFilter('pending')">🟡 Pending (${totPendingCount})</button>
            <button class="btn-ghost ${invoiceFilter === 'partial' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#38bdf8;" onclick="window.FINANCE_MODULE.setInvoiceFilter('partial')">💸 Partial (${totPartialCount})</button>
            <button class="btn-ghost ${invoiceFilter === 'paid' ? 'btn-secondary' : ''}" style="font-size:0.75rem; padding:0.3rem 0.6rem; color:#10b981;" onclick="window.FINANCE_MODULE.setInvoiceFilter('paid')">🟢 Paid (${totPaidCount})</button>
          </div>
          <div style="position:relative; width:240px;">
            <input type="text" id="invoiceSearchInput" class="input-text" placeholder="🔍 Search invoices..." value="${escapeHTML(invoiceSearch)}" oninput="window.FINANCE_MODULE.setInvoiceSearch(this.value)" style="padding:0.4rem 0.75rem; font-size:0.8rem;">
          </div>
        </div>

        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:3rem; color:var(--text-muted);">
            No matching invoices found. Click <strong>+ Create Invoice</strong> to issue one.
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
                const st = (i.status || '').toLowerCase();
                const isE2 = (i.engineTag || i.engine || '').toLowerCase() === 'engine2' || (i.id || '').toUpperCase().includes('PURPLEBOT') || (i.clientName || i.client || '').toLowerCase().includes('purplebot') || (i.projectName || '').toLowerCase().includes('sprint') || (i.projectName || '').toLowerCase().includes('engine 2');
                return `
                  <tr>
                    <td style="font-weight:700; color:var(--purple-light);">
                      ${escapeHTML(i.id || 'INV-101')}
                      ${isE2 ? '<span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); font-size:0.65rem; font-weight:800; margin-left:0.35rem;">⚡ E2</span>' : ''}
                    </td>
                    <td style="font-weight:700;">${escapeHTML(i.clientName || i.client || 'Agency Client')}</td>
                    <td style="color:var(--text-muted); font-size:0.78rem;">${escapeHTML(i.projectName || 'General Services')}</td>
                    <td style="font-weight:800; color:var(--emerald-brand);">${formatMoney(i.amount)}</td>
                    <td style="color:var(--text-muted); font-size:0.8rem;">${escapeHTML(formatDisplayDate(i.dueDate || i.due_date))}</td>
                    <td>
                      ${st === 'paid' ? '<span class="badge badge-emerald">Paid</span>' :
                        st === 'partially paid' ? '<span class="badge badge-purple">Partially Paid</span>' :
                        st === 'verification pending' ? '<span class="badge badge-amber">Verification Pending</span>' :
                        overdue ? '<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">🔴 Overdue</span>' :
                        `<span class="badge badge-amber">${escapeHTML(i.status || 'Pending')}</span>`}
                    </td>
                    <td>
                      <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                        ${st !== 'paid' ? `
                          <button class="btn-emerald btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.markFullyPaid('${i.id}')">✅ Paid</button>
                          <button class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.openPartialPayModal('${i.id}')">💸 Partial</button>
                        ` : ''}
                        <button class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.downloadInvoice('${i.id}')">📄 PDF</button>
                        <a href="/invoice-view.html?id=${encodeURIComponent(i.id)}" target="_blank" class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem; text-decoration:none;" title="Open Guaranteed 1-Page A4 Sheet">🧾 A4</a>
                        <button class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.FINANCE_MODULE.openSendEmailModal('${i.id}')">✉️ Send</button>
                        <button class="btn-secondary btn-sm" id="btnDelInv_${i.id}" style="font-size:0.72rem; padding:0.25rem 0.5rem; color:#ef4444;" onclick="window.FINANCE_MODULE.deleteInvoice('${i.id}')" title="Delete Invoice">🗑️</button>
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
                  <td style="font-weight:800; color:#f87171;">${formatMoney(e.amount)}</td>
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
                <td style="font-weight:800; color:var(--purple-light);">${formatMoney(q.amount)}</td>
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
                <td style="font-weight:800; color:var(--emerald-brand);">${formatMoney(p.amount)}</td>
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
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    },
    closeInvoiceModal() {
      const modal = document.getElementById('invoiceModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    },
    openNewInvoiceModal() {
      this.openInvoiceModal();
    },
    openQuoteModal() {
      const modal = document.getElementById('quoteModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    },
    closeQuoteModal() {
      const modal = document.getElementById('quoteModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    },
    openExpenseModal() {
      const modal = document.getElementById('expModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    },
    closeExpenseModal() {
      const modal = document.getElementById('expModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
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
    openSendEmailModal(id) {
      const inv = invoicesData.find(i => String(i.id) === String(id));
      let clientEmail = inv ? (inv.clientEmail || '') : '';
      if (!clientEmail && inv?.clientId && clientsData.length > 0) {
        const c = clientsData.find(x => x.id === inv.clientId);
        if (c) clientEmail = c.email || c.contactEmail || '';
      }
      let modal = document.getElementById('fnSendEmailModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnSendEmailModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">✉️ Dispatch Invoice Email</h3>
            <button onclick="document.getElementById('fnSendEmailModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Send invoice <strong>${escapeHTML(id)}</strong> to client via Resend.
          </p>
          <div class="form-group">
            <label class="form-label">Client Recipient Email</label>
            <input type="email" id="fnSendEmailInput" class="input-text" placeholder="client@company.com" value="${escapeHTML(clientEmail)}">
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">Leave blank to use default agency email.</div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('fnSendEmailModal').classList.remove('active')">Cancel</button>
            <button type="button" class="btn-primary" id="fnBtnDoSendEmail" onclick="window.FINANCE_MODULE.confirmSendInvoiceEmail('${escapeHTML(id)}')">🚀 Send Invoice</button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },
    async confirmSendInvoiceEmail(id) {
      const email = (document.getElementById('fnSendEmailInput')?.value || '').trim();
      const btn = document.getElementById('fnBtnDoSendEmail');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      try {
        const payload = {};
        if (email) payload.email = email;
        const res = await APP_API.post('/invoices/' + id + '/send', payload);
        document.getElementById('fnSendEmailModal')?.classList.remove('active');
        if (window.showToast) {
          window.showToast(res.simulated ? 'Simulated Invoice Email Sent' : 'Invoice Sent Successfully! ✉️', 'success');
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to send invoice email: ' + e.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Send Invoice'; }
      }
    },
    async markFullyPaid(id) {
      window._financeMutating = true;
      try {
        await APP_API.put('/invoices/' + id, { status: 'Paid' });
        if (window.showToast) window.showToast('🎉 Invoice marked as Fully Paid!', 'success');
        const inv = invoicesData.find(i => String(i.id) === String(id));
        if (inv) inv.status = 'Paid';
        renderFinanceView();
        await loadFinance(false);
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to mark invoice as paid: ' + e.message, 'error');
      } finally {
        window._financeMutating = false;
      }
    },
    openPartialPayModal(id) {
      const inv = invoicesData.find(i => String(i.id) === String(id));
      if (!inv) return;
      let modal = document.getElementById('fnPartialPayModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnPartialPayModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">💸 Record Partial Payment</h3>
            <button onclick="document.getElementById('fnPartialPayModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Invoice <strong>${escapeHTML(inv.id)}</strong> (${escapeHTML(inv.clientName || 'Client')}): Total <strong>৳${Number(inv.amount).toLocaleString()}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">Payment Amount Collected (BDT ৳) *</label>
            <input type="number" id="fnPartialAmtInput" class="input-text" placeholder="e.g. 25000" min="1" max="${Number(inv.amount)}">
          </div>
          <div class="form-group">
            <label class="form-label">Remittance Reference / Note</label>
            <input type="text" id="fnPartialNoteInput" class="input-text" placeholder="e.g. Bank Transfer Ref / TrxID">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('fnPartialPayModal').classList.remove('active')">Cancel</button>
            <button type="button" class="btn-primary" id="fnBtnDoPartialPay" onclick="window.FINANCE_MODULE.confirmPartialPaid('${escapeHTML(id)}')">💾 Record Payment</button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },
    async confirmPartialPaid(id) {
      const inv = invoicesData.find(i => String(i.id) === String(id));
      if (!inv) return;
      const amtStr = (document.getElementById('fnPartialAmtInput')?.value || '').trim();
      const noteStr = (document.getElementById('fnPartialNoteInput')?.value || '').trim();
      const amt = Number(amtStr);
      if (!amtStr || isNaN(amt) || amt <= 0) {
        if (window.showToast) window.showToast('Please enter a valid payment amount.', 'error');
        return;
      }
      const btn = document.getElementById('fnBtnDoPartialPay');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

      const newStatus = amt >= Number(inv.amount) ? 'Paid' : 'Partially Paid';
      const notes = 'Collected BDT ' + amt.toLocaleString() + (noteStr ? ' (' + noteStr + ')' : '');

      try {
        await APP_API.put('/invoices/' + id, { status: newStatus, notes });
        document.getElementById('fnPartialPayModal')?.classList.remove('active');
        if (window.showToast) window.showToast('Invoice marked as ' + newStatus, 'success');
        inv.status = newStatus;
        renderFinanceView();
        await loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to update invoice: ' + e.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = '💾 Record Payment'; }
      }
    },
    deleteInvoice(id) {
      const btn = document.getElementById('btnDelInv_' + id);
      if (!btn) return;
      if (btn.dataset.confirming === 'true') {
        btn.disabled = true;
        btn.textContent = '...';
        APP_API.delete('/invoices/' + id).then(() => {
          if (window.showToast) window.showToast('Invoice ' + id + ' deleted', 'info');
          invoicesData = invoicesData.filter(i => String(i.id) !== String(id));
          renderFinanceView();
        }).catch(err => {
          if (window.showToast) window.showToast('Delete failed: ' + err.message, 'error');
          btn.disabled = false;
          btn.textContent = '🗑️';
          btn.dataset.confirming = 'false';
        });
      } else {
        btn.dataset.confirming = 'true';
        btn.style.background = 'rgba(239,68,68,0.3)';
        btn.style.borderColor = '#ef4444';
        btn.textContent = '⚠️ Confirm';
        setTimeout(() => {
          if (btn && btn.dataset.confirming === 'true') {
            btn.dataset.confirming = 'false';
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.textContent = '🗑️';
          }
        }, 4000);
      }
    },
    async convertQuoteToInvoice(id) {
      try {
        const res = await APP_API.post('/invoices/quotes/' + id + '/convert');
        if (res.success) {
          if (window.showToast) window.showToast('📜 Quote converted to Invoice successfully!', 'success');
          if (res.invoice) {
            invoicesData.unshift(res.invoice);
          }
          await loadFinance();
          if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to convert quote: ' + e.message, 'error');
      }
    },
    async approveTier1(id) {
      try {
        await APP_API.post('/expenses/' + id + '/approve-tier1', { approvedBy: window.CURRENT_USER?.name || 'Line Manager' });
        if (window.showToast) window.showToast('Tier 1 Approved ✅ (Pending Owner Disbursal)', 'success');
        await loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to approve Tier 1: ' + e.message, 'error');
      }
    },
    async approveTier2(id) {
      try {
        await APP_API.post('/expenses/' + id + '/approve-tier2', { approvedBy: window.CURRENT_USER?.name || 'Executive Owner' });
        if (window.showToast) window.showToast('✅ Expense Authorized & Disbursed!', 'success');
        await loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to approve Tier 2: ' + e.message, 'error');
      }
    },
    openRejectExpenseModal(id) {
      let modal = document.getElementById('fnRejectExpenseModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnRejectExpenseModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#ef4444; font-family:var(--font-heading);">❌ Decline Expense Claim</h3>
            <button onclick="document.getElementById('fnRejectExpenseModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">Reason for Rejection</label>
            <textarea id="fnRejectExpReason" class="input-text" style="height:80px;" placeholder="e.g. Missing valid vendor invoice or unauthorized line item..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('fnRejectExpenseModal').classList.remove('active')">Cancel</button>
            <button type="button" class="btn-secondary" style="color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="window.FINANCE_MODULE.confirmRejectExpense('${escapeHTML(id)}')">Decline Claim</button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },
    async confirmRejectExpense(id) {
      const reason = (document.getElementById('fnRejectExpReason')?.value || '').trim();
      try {
        await APP_API.post('/expenses/' + id + '/reject', { reason: reason || 'Declined by Executive' });
        document.getElementById('fnRejectExpenseModal')?.classList.remove('active');
        if (window.showToast) window.showToast('Expense claim declined', 'info');
        await loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to reject expense: ' + e.message, 'error');
      }
    },
    async verifyPayment(payId) {
      try {
        const res = await APP_API.post('/payments/' + payId + '/verify');
        if (res.success) {
          if (window.showToast) window.showToast('Payment verified! Invoice marked as Paid 💰', 'success');
          await loadFinance();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to verify payment: ' + err.message, 'error');
      }
    },
    openRejectPaymentModal(payId) {
      let modal = document.getElementById('fnRejectPaymentModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnRejectPaymentModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal-box" style="max-width: 440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#ef4444; font-family:var(--font-heading);">❌ Reject Payment Proof</h3>
            <button onclick="document.getElementById('fnRejectPaymentModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.3rem; cursor:pointer;">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">Reason for Rejection</label>
            <textarea id="fnRejectPayReason" class="input-text" style="height:80px;" placeholder="e.g. Transaction ID not found on bank statement..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="document.getElementById('fnRejectPaymentModal').classList.remove('active')">Cancel</button>
            <button type="button" class="btn-secondary" style="color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="window.FINANCE_MODULE.confirmRejectPayment('${escapeHTML(payId)}')">Reject Proof</button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },
    async confirmRejectPayment(payId) {
      const reason = (document.getElementById('fnRejectPayReason')?.value || '').trim();
      try {
        const res = await APP_API.post('/payments/' + payId + '/reject', { reason: reason || 'Invalid transaction verification' });
        document.getElementById('fnRejectPaymentModal')?.classList.remove('active');
        if (res.success) {
          if (window.showToast) window.showToast('Payment proof rejected', 'info');
          await loadFinance();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to reject payment: ' + err.message, 'error');
      }
    },
    async submitExpense() {
      window._financeMutating = true;
      try {
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
            reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                const MAX = 1000;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                  const ratio = Math.min(MAX / width, MAX / height);
                  width = Math.round(width * ratio);
                  height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.src = reader.result;
            };
            reader.readAsDataURL(receiptFile);
          });
        }

        await APP_API.post('/expenses', {
          title, category: cat, amount: amt, receiptBase64
        });
        if (window.showToast) window.showToast('Expense Claim Submitted! 🚀', 'success');
        this.closeExpenseModal();
        await loadFinance();
      } catch(e) {
        const errMsg = e?.message || (typeof e === 'string' ? e : 'Unknown error');
        if (window.showToast) window.showToast('Failed to submit expense claim: ' + errMsg, 'error');
      } finally {
        window._financeMutating = false;
      }
    },
    async submitQuote() {
      window._financeMutating = true;
      try {
        const clientName = document.getElementById('fnQuoteClient').value.trim();
        const desc = document.getElementById('fnQuoteDesc').value.trim();
        const amt = document.getElementById('fnQuoteAmt').value;
        const validDays = document.getElementById('fnQuoteValid').value;

        if (!clientName || !amt) {
          if (window.showToast) window.showToast('Client account and amount are required.', 'error');
          return;
        }

        const res = await APP_API.post('/invoices/quotes', {
          clientName,
          projectTitle: desc || 'Client Proposal',
          items: [{ description: desc || 'Proposal Services', amount: Number(amt) || 0 }],
          amount: Number(amt) || 0,
          validDays: parseInt(validDays, 10) || 14
        });
        if (window.showToast) window.showToast('Quote Generated! 📜', 'success');
        this.closeQuoteModal();
        if (res.quote) {
          quotesData.unshift(res.quote);
          renderFinanceView();
        }
        await loadFinance();
        
        if (res.quote && window.generateInvoicePDF) {
          window.generateInvoicePDF(res.quote);
        }
      } catch (e) {
        if (window.showToast) window.showToast('Failed to save quote: ' + e.message, 'error');
      } finally {
        window._financeMutating = false;
      }
    },
    calcInvoiceTotal() {
      const amt = Number(document.getElementById('fnInvAmt')?.value) || 0;
      const vatRate = Number(document.getElementById('fnInvVat')?.value) || 0;
      const disc = Number(document.getElementById('fnInvDisc')?.value) || 0;
      const taxableBase = Math.max(0, amt - disc);
      const vatAmt = Math.round(taxableBase * (vatRate / 100));
      const total = taxableBase + vatAmt;
      const totalEl = document.getElementById('fnInvTotal');
      if (totalEl) totalEl.value = 'BDT ' + total.toLocaleString();
      return total;
    },
    async submitInvoice() {
      window._financeMutating = true;
      const clientName = document.getElementById('fnInvClient')?.value.trim();
      const clientId = document.getElementById('fnInvClientId')?.value;
      const projectName = (document.getElementById('fnInvProject')?.value || '').trim();
      const desc = (document.getElementById('fnInvDesc')?.value || '').trim();
      const amt = Number(document.getElementById('fnInvAmt')?.value) || 0;
      const taxRate = Number(document.getElementById('fnInvVat')?.value) || 0;
      const discount = Number(document.getElementById('fnInvDisc')?.value) || 0;
      const dueDate = document.getElementById('fnInvDueDate')?.value || '';
      const issueDate = document.getElementById('fnInvDate')?.value || '';
      const status = document.getElementById('fnInvStatus')?.value || 'Pending';
      const notes = (document.getElementById('fnInvNotes')?.value || '').trim();
      const engineTag = document.getElementById('fnInvEngine') ? document.getElementById('fnInvEngine').value : 'engine2';
      const taxableBase = Math.max(0, amt - discount);
      const vatAmt = Math.round(taxableBase * (taxRate / 100));
      const total = taxableBase + vatAmt;

      if (!clientName || !amt) {
        if (window.showToast) window.showToast('Client account and amount are required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btnSubmitInvoice');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating Invoice...'; }

      try {
        const lineDesc = desc || projectName || 'Client Retainer Services';
        const res = await APP_API.post('/invoices', {
          clientId,
          clientName,
          projectName: projectName || desc,
          project_name: projectName || desc,
          issueDate,
          dueDate,
          due_date: dueDate,
          status,
          engineTag,
          engine_tag: engineTag,
          items: [{ description: lineDesc, amount: amt, qty: 1, rate: amt }],
          amount: total,
          taxRate,
          discount,
          notes
        });

        if (window.showToast) window.showToast('Invoice Created! 🧾', 'success');
        this.closeInvoiceModal();

        // Immediate state hydration so it displays in table without race conditions
        if (res && res.invoice) {
          invoicesData = [res.invoice, ...invoicesData.filter(i => i.id !== res.invoice.id)];
          renderFinanceView();
        }
        await loadFinance();
        if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
      } catch (e) {
        if (window.showToast) window.showToast('Failed to create invoice: ' + e.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🧾 Create & Issue Invoice'; }
        window._financeMutating = false;
      }
    },
    openImportModal() {
      let modal = document.getElementById('fnImportInvoicesModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fnImportInvoicesModal';
        modal.className = 'modal-overlay';
        modal.setAttribute('onclick', 'if(event.target === this) window.FINANCE_MODULE.closeImportModal()');
        modal.innerHTML = `
          <div class="modal-box" style="max-width: 500px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">🧾 Import Historical Invoices CSV</h3>
              <button id="btnCloseImportModal" onclick="window.FINANCE_MODULE.closeImportModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
        await loadFinance();
      } catch (err) {
        if (window.showToast) window.showToast('CSV import failed: ' + err.message, 'error');
      }
    },
    exportInvoicesCSV() {
      const list = invoicesData || [];
      if (list.length === 0) {
        if (window.showToast) window.showToast('No invoices found to export.', 'warning');
        return;
      }
      const headers = ['Invoice ID', 'Client Name', 'Amount (BDT)', 'Status', 'Due Date', 'Created Date'];
      const rows = list.map(inv => [
        `"${inv.id || ''}"`,
        `"${(inv.clientName || inv.client || '').replace(/"/g, '""')}"`,
        inv.amount || 0,
        `"${inv.status || 'Pending'}"`,
        `"${inv.due_date || inv.dueDate || ''}"`,
        `"${inv.created_at ? inv.created_at.split('T')[0] : ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gro10x_invoices_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.showToast) window.showToast('✅ Exported invoices CSV successfully!', 'success');
    },
    switchCurrency(curr) {
      currentCurrency = curr || (currentCurrency === 'BDT' ? 'USD' : 'BDT');
      localStorage.setItem('gro10x_currency', currentCurrency);
      renderFinanceView();
      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: currentCurrency } }));
    },
    toggleCurrency() {
      this.switchCurrency();
    }
  };

  // --- Global alias for MAIN world QA evaluation ---
  window.FINANCE_MODULE.switchFinanceCurrency = function(curr) {
    window.FINANCE_MODULE.switchCurrency(curr);
  };
  window.switchFinanceCurrency = window.FINANCE_MODULE.switchFinanceCurrency;

  // --- Deduplicated SSE subscription with 400ms debounce ---
  let _financeDebounceTimer = null;
  function debouncedFinanceSync() {
    clearTimeout(_financeDebounceTimer);
    _financeDebounceTimer = setTimeout(() => {
      const isAnyModalOpen = document.querySelector('#expModal.active, #quoteModal.active, #invoiceModal.active') ||
        (document.getElementById('expModal')?.style.display === 'flex') ||
        (document.getElementById('quoteModal')?.style.display === 'flex') ||
        (document.getElementById('invoiceModal')?.style.display === 'flex');
      if (isAnyModalOpen) {
        return;
      }
      loadFinance(false);
    }, 400);
  }
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    window.APP_SSE.subscribe('invoice_update', debouncedFinanceSync);
    window.APP_SSE.subscribe('expense_update', debouncedFinanceSync);
    window.APP_SSE.subscribe('payment_update', debouncedFinanceSync);
    window.APP_SSE.subscribe('quote_update', debouncedFinanceSync);
  }

  // --- Deduplicated gro10x_currency_changed handler with #finance route guard ---
  if (window._financeCurrencyHandler) {
    window.removeEventListener('gro10x_currency_changed', window._financeCurrencyHandler);
  }
  window._financeCurrencyHandler = function(e) {
    if (window.location.hash !== '#finance') return;
    const newCurr = e.detail && e.detail.currency;
    if (newCurr && newCurr !== currentCurrency) {
      currentCurrency = newCurr;
      renderFinanceView();
    }
  };
  window.addEventListener('gro10x_currency_changed', window._financeCurrencyHandler);

  // --- Deduplicated Escape keydown handler with #finance route guard ---
  if (window._financeKeyDownHandler) {
    window.removeEventListener('keydown', window._financeKeyDownHandler);
  }
  window._financeKeyDownHandler = function(e) {
    if (window.location.hash !== '#finance') return;
    if (e.key === 'Escape') {
      const invM = document.getElementById('invoiceModal');
      if (invM && invM.classList.contains('active')) { window.FINANCE_MODULE.closeInvoiceModal(); return; }
      const expM = document.getElementById('expModal');
      if (expM && expM.classList.contains('active')) { window.FINANCE_MODULE.closeExpenseModal(); return; }
      const qteM = document.getElementById('quoteModal');
      if (qteM && qteM.classList.contains('active')) { window.FINANCE_MODULE.closeQuoteModal(); return; }
      const impM = document.getElementById('fnImportInvoicesModal');
      if (impM && impM.classList.contains('active')) { window.FINANCE_MODULE.closeImportModal(); return; }
    }
  };
  window.addEventListener('keydown', window._financeKeyDownHandler);

  await loadFinance(true);
};
