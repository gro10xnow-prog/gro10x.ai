/**
 * public/app/modules/crm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client CRM & Multi-POC Management View Module v4.5 (Admin SPA)
 * - Dual-Currency Intelligence (BDT ৳ / USD $) with South Asian Lakh/Crore notation
 * - Decoupled In-Place DOM Updates (Preserves search input cursor focus)
 * - Non-blocking inline delete confirmation (No browser window.confirm)
 * - Wizard Step 1 & Step 2 validation guards & Primary POC selector
 * - 360° CRM Hub with Quick Actions (WhatsApp direct, Proposal, Invoices)
 * - Enhanced Bulk CSV Importer with full preview & multi-currency detection
 * - Real-Time SSE Multi-Instance Sync (APP_API.on('client_update'))
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.crm = async function(container) {
  let clientsData = [];
  let searchQuery = '';
  let filterStatus = 'all';
  let sortBy = 'revenue';
  let currentEditingClient = null;
  let parsedImportClients = [];
  let currentCurrency = localStorage.getItem('gro10x_currency') || 'BDT';
  const BDT_PER_USD = 120;

  // ─── Dual Currency Helpers ──────────────────────────────────────────────────
  function getSpendInCurrency(client, targetCurrency = currentCurrency) {
    const raw = client.totalSpent !== undefined ? client.totalSpent : client.total_spent;
    let bdtVal = 0;
    if (typeof raw === 'number') {
      bdtVal = raw;
    } else if (typeof raw === 'string') {
      const isUsd = raw.includes('$');
      const num = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
      bdtVal = isUsd ? num * BDT_PER_USD : num;
    }

    if (targetCurrency === 'USD') {
      return bdtVal / BDT_PER_USD;
    }
    return bdtVal;
  }

  function formatMoney(amount, currency = currentCurrency) {
    const num = Math.max(0, Number(amount) || 0);
    if (currency === 'BDT') {
      if (num >= 10000000) return '৳' + (num / 10000000).toFixed(2) + ' Cr';
      if (num >= 100000) return '৳' + (num / 100000).toFixed(2) + ' Lakh';
      return '৳' + Math.round(num).toLocaleString('en-IN');
    } else {
      if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
      if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'k';
      return '$' + Math.round(num).toLocaleString('en-US');
    }
  }

  // ─── Load Data ──────────────────────────────────────────────────────────────
  async function loadCRMData() {
    try {
      const data = await APP_API.get('/clients').catch(() => []);
      clientsData = Array.isArray(data) ? data : [];
      updateKpiStrip();
      renderCRMGrid();
    } catch (err) {
      const grid = document.getElementById('crmCardsGrid');
      if (grid) {
        grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-error); padding:2rem; text-align:center;">Error loading CRM data: ' + err.message + '</div>';
      }
    }
  }

  // ─── Filter & Sort ──────────────────────────────────────────────────────────
  function getFilteredClients() {
    let clients = [...clientsData];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      clients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.contactPerson || c.contact_person || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.category || c.industry || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      clients = clients.filter(c => (c.status || '').toLowerCase() === filterStatus.toLowerCase());
    }

    if (sortBy === 'revenue') {
      clients.sort((a, b) => getSpendInCurrency(b) - getSpendInCurrency(a));
    } else if (sortBy === 'name') {
      clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      clients.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    }
    return clients;
  }

  // ─── Update KPI Strip (Decoupled In-Place) ───────────────────────────────────
  function updateKpiStrip() {
    const kpiStrip = document.getElementById('crmKpiStrip');
    if (!kpiStrip) return;

    const activeClients = clientsData.filter(c => (c.status || '').toLowerCase() !== 'churned');
    const totSpent = clientsData.reduce((sum, c) => sum + getSpendInCurrency(c), 0);
    const avgSpend = activeClients.length > 0 ? Math.round(totSpent / activeClients.length) : 0;
    const onboardingCount = clientsData.filter(c => (c.status || '').toLowerCase() === 'onboarding').length;

    kpiStrip.innerHTML = `
      <div class="kpi-tile" style="background:var(--card-bg, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
        <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Active Clients</div>
        <div class="kpi-val" style="font-size:1.9rem; font-weight:900; font-family:var(--font-heading); color:#fff; margin:0.25rem 0;">${activeClients.length}</div>
        <div style="font-size:0.72rem; color:var(--text-muted);">${onboardingCount} Onboarding</div>
      </div>
      <div class="kpi-tile" style="background:var(--card-bg, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
        <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Total Retainer Spend</div>
        <div class="kpi-val" style="font-size:1.9rem; font-weight:900; font-family:var(--font-heading); color:var(--emerald-brand, #10b981); margin:0.25rem 0;">${formatMoney(totSpent)}</div>
        <div style="font-size:0.72rem; color:#10b981;">Cumulative Revenue</div>
      </div>
      <div class="kpi-tile" style="background:var(--card-bg, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
        <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Avg Account Value</div>
        <div class="kpi-val" style="font-size:1.9rem; font-weight:900; font-family:var(--font-heading); color:var(--purple-light, #c084fc); margin:0.25rem 0;">${formatMoney(avgSpend)}</div>
        <div style="font-size:0.72rem; color:var(--text-muted);">Per active client</div>
      </div>
      <div class="kpi-tile" style="background:var(--card-bg, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
        <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Total Accounts</div>
        <div class="kpi-val" style="font-size:1.9rem; font-weight:900; font-family:var(--font-heading); color:#fff; margin:0.25rem 0;">${clientsData.length}</div>
        <div style="font-size:0.72rem; color:var(--text-muted);">Master Directory</div>
      </div>
    `;

    const countBadge = document.getElementById('crmCountBadge');
    if (countBadge) {
      countBadge.innerText = `${clientsData.length} Accounts`;
    }
  }

  // ─── Render Cards Grid (Decoupled In-Place) ──────────────────────────────────
  function renderCRMGrid() {
    const grid = document.getElementById('crmCardsGrid');
    if (!grid) return;

    const filtered = getFilteredClients();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3.5rem 1.5rem; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 14px;">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
          <div style="font-weight: 700; color: #fff; font-size: 1.05rem; margin-bottom: 0.3rem;">No matching client accounts found</div>
          <div style="font-size: 0.82rem; margin-bottom: 1.2rem;">Try adjusting your search query, status filter, or add a new client to the pipeline.</div>
          <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 1rem;" onclick="window.CRM_MODULE.resetFilters()">🔄 Reset Filters & Search</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(c => renderClientCard(c)).join('');
  }

  // ─── Render Single Client Card ──────────────────────────────────────────────
  function renderClientCard(c) {
    const initials = (c.name || 'CL').substring(0, 2).toUpperCase();
    const pocs = c.pocs && Array.isArray(c.pocs) && c.pocs.length > 0
      ? c.pocs
      : [{ name: c.contactPerson || c.contact_person || 'Lead Contact', role: 'Primary', phone: c.phone || '', isPrimary: true }];
    
    const campaignsCount = Array.isArray(c.activeCampaigns)
      ? c.activeCampaigns.length
      : Number(c.activeCampaigns || c.active_campaigns) || 1;

    const spendAmount = getSpendInCurrency(c);

    let badgeClass = 'badge-purple';
    let statusGlow = '#a855f7';
    if ((c.status || '').toLowerCase() === 'active retainer') {
      badgeClass = 'badge-emerald';
      statusGlow = '#10b981';
    } else if ((c.status || '').toLowerCase() === 'onboarding') {
      badgeClass = 'badge-amber';
      statusGlow = '#f59e0b';
    } else if ((c.status || '').toLowerCase() === 'churned') {
      badgeClass = 'badge-pink';
      statusGlow = '#ef4444';
    }

    return `
      <div class="card-glass" id="client-card-${c.id}" style="display:flex; flex-direction:column; gap:0.85rem; position:relative; background:var(--card-bg, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem; transition:transform 0.2s ease, border-color 0.2s ease;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
          <div style="display:flex; gap:0.75rem; align-items:center; min-width:0;">
            <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#7c3aed,#3b82f6); display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; font-size:0.95rem; box-shadow:0 4px 12px rgba(124,58,237,0.3);">${initials}</div>
            <div style="min-width:0;">
              <div style="font-weight:800; color:var(--text-primary, #fff); font-size:1.02rem; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(c.name)}">${escapeHTML(c.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(c.category || c.industry || 'General Industry')}</div>
            </div>
          </div>
          <span class="badge ${badgeClass}" style="flex-shrink:0; font-size:0.72rem; padding:0.25rem 0.6rem; border-radius:999px; border:1px solid ${statusGlow}33;">${escapeHTML(c.status || 'Active')}</span>
        </div>

        <!-- Contact info strip -->
        <div style="font-size:0.78rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.25rem; background:rgba(0,0,0,0.2); padding:0.5rem 0.65rem; border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
          ${c.email ? `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📧 <a href="mailto:${escapeHTML(c.email)}" style="color:var(--text-muted); text-decoration:none;">${escapeHTML(c.email)}</a></div>` : '<div style="color:var(--text-dim, #666);">📧 No direct email linked</div>'}
          ${c.phone ? `<div>📞 <a href="tel:${escapeHTML(c.phone)}" style="color:var(--text-muted); text-decoration:none;">${escapeHTML(c.phone)}</a></div>` : '<div style="color:var(--text-dim, #666);">📞 No hotline linked</div>'}
        </div>

        <!-- Points of Contact List -->
        <div style="background:rgba(255,255,255,0.02); border-radius:10px; padding:0.65rem 0.75rem; display:flex; flex-direction:column; gap:0.4rem; border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.7rem; font-weight:800; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.04em; display:flex; justify-content:space-between;">
            <span>Authorized POCs (${pocs.length})</span>
            ${pocs.length > 1 ? '<span style="color:var(--purple-light); font-size:0.68rem;">Multi-Access</span>' : ''}
          </div>
          ${pocs.map((p, idx) => `
            <div style="font-size:0.8rem; color:var(--text-primary); display:flex; justify-content:space-between; align-items:center; gap:0.4rem;">
              <div style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                👤 <strong>${escapeHTML(p.name)}</strong> <span style="color:var(--text-muted); font-size:0.72rem;">(${escapeHTML(p.role || (p.isPrimary || idx === 0 ? 'Primary' : 'Contact'))})</span>
              </div>
              ${p.phone ? `<span style="font-size:0.72rem; color:var(--purple-light); flex-shrink:0;">📞 ${escapeHTML(p.phone)}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Spend & Campaigns -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; border-top:1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-top:0.65rem; margin-top:auto;">
          <span style="color:var(--text-muted);">Total Spend: <strong style="color:var(--emerald-brand, #10b981);">${formatMoney(spendAmount)}</strong></span>
          <span style="color:var(--purple-light, #c084fc); font-weight:700; background:rgba(192,132,252,0.1); padding:0.15rem 0.5rem; border-radius:6px;">${campaignsCount} Active</span>
        </div>

        <!-- Action Row -->
        <div style="display:flex; gap:0.4rem; margin-top:0.3rem;">
          <button class="btn-outline btn-sm" style="flex:1; border-radius:8px; font-size:0.75rem; padding:0.4rem;" onclick="window.CRM_MODULE.openHub('${c.id}')">📂 Open Hub</button>
          <button class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.4rem 0.6rem; border-radius:8px;" title="Edit Client" onclick="window.CRM_MODULE.openEditModal('${c.id}')">✏️</button>
          <button class="btn-ghost btn-sm delete-btn-${c.id}" style="font-size:0.75rem; padding:0.4rem 0.6rem; border-radius:8px; color:#ef4444;" title="Delete Client" onclick="window.CRM_MODULE.deleteClient('${c.id}', this)">🗑️</button>
        </div>
      </div>
    `;
  }

  // ─── Initial Full Mount ─────────────────────────────────────────────────────
  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <h1 style="font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading); margin: 0;">
            👥 Client CRM Directory
          </h1>
          <span class="badge badge-purple" id="crmCountBadge" style="font-size:0.75rem; padding:0.25rem 0.6rem;">Master Directory</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-muted); margin-top:0.25rem;">
          Manage client accounts, authorized points of contact (POCs), portal logins, and retainer status.
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
        <button id="crmCurrencyToggleBtn" class="btn-secondary" style="font-size:0.8rem; font-weight:700; padding:0.45rem 0.85rem;" onclick="window.CRM_MODULE.toggleCurrency()">
          💱 ${currentCurrency === 'USD' ? 'USD ($)' : 'BDT (৳)'}
        </button>
        <button class="btn-secondary" style="font-size:0.8rem; padding:0.45rem 0.85rem;" onclick="window.CRM_MODULE.openImportModal()">
          📥 Import Clients (CSV)
        </button>
        <button class="btn-primary" style="font-size:0.8rem; padding:0.45rem 0.95rem;" onclick="window.CRM_MODULE.openAddModal()">
          + Add New Client
        </button>
      </div>
    </div>

    <!-- KPI Strip Container -->
    <div id="crmKpiStrip" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <!-- Managed dynamically via updateKpiStrip() -->
    </div>

    <!-- Search & Filter Toolbar (Static DOM to preserve focus) -->
    <div id="crmToolbar" style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; align-items:center;">
      <input
        type="text"
        id="crmSearchInput"
        class="input-text"
        placeholder="🔍 Search by company, contact, or email..."
        style="flex:1; min-width:220px;"
        value=""
        oninput="window.CRM_MODULE.setSearch(this.value)"
      >
      <select id="crmFilterSelect" class="input-text" style="width:auto;" onchange="window.CRM_MODULE.setFilterStatus(this.value)">
        <option value="all">All Statuses</option>
        <option value="Active Retainer">Active Retainer</option>
        <option value="Onboarding">Onboarding</option>
        <option value="Project-Based">Project-Based</option>
        <option value="Churned">Churned</option>
      </select>
      <select id="crmSortSelect" class="input-text" style="width:auto;" onchange="window.CRM_MODULE.setSort(this.value)">
        <option value="revenue">Sort: By Spend ↓</option>
        <option value="name">Sort: Name A–Z</option>
        <option value="newest">Sort: Newest First</option>
      </select>
      <button class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.45rem 0.75rem;" title="Deduplicate identical client accounts" onclick="window.CRM_MODULE.deduplicateAccounts()">
        🧹 Deduplicate
      </button>
    </div>

    <!-- Client Cards Grid Container (Decoupled DOM target) -->
    <div id="crmCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1.25rem;">
      <div style="grid-column:1/-1; padding: 3rem; text-align: center; color: var(--text-muted);">⏳ Loading Client CRM Directory...</div>
    </div>

    <!-- Add / Edit Client Modal -->
    <div class="modal-overlay" id="crmModal">
      <div class="modal-box" style="max-width:550px; background:var(--surface, #1e1b2e); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:16px; padding:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);" id="crmModalTitle">👥 Client Onboarding Wizard</h2>
          <button onclick="window.CRM_MODULE.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
        </div>

        <!-- Wizard Step Indicator -->
        <div style="display:flex; gap:0.5rem; margin: 1rem 0; background:rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px;">
          <div id="wizStepBtn1" class="badge badge-purple" style="flex:1; text-align:center; cursor:pointer; padding:0.4rem 0;" onclick="window.CRM_MODULE.setStep(1)">1. Company Details</div>
          <div id="wizStepBtn2" class="badge" style="flex:1; text-align:center; cursor:pointer; background:transparent; color:var(--text-muted); padding:0.4rem 0;" onclick="window.CRM_MODULE.validateAndGoToStep2()">2. Authorized Contacts (POCs)</div>
        </div>

        <!-- Step 1 Pane -->
        <div id="wizStep1">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Client / Brand Name *</label>
              <input type="text" id="crmName" class="form-input" placeholder="e.g. Chillox Bangladesh">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Industry / Category</label>
              <input type="text" id="crmIndustry" class="form-input" placeholder="e.g. Fast Food & QSR">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Company Email *</label>
              <input type="email" id="crmEmail" class="form-input" placeholder="contact@brand.com">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Company Phone / Hotline</label>
              <input type="text" id="crmPhone" class="form-input" placeholder="+8801700000000">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Retainer Status</label>
              <select id="crmStatus" class="form-select">
                <option value="Active Retainer">Active Retainer</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Project-Based">Project-Based</option>
                <option value="Churned">Churned</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" id="crmSpendLabel" style="font-size:0.78rem; font-weight:700; color:#fff;">Total Spend (${currentCurrency === 'USD' ? 'USD $' : 'BDT ৳'})</label>
              <input type="number" id="crmTotalSpent" class="form-input" placeholder="0">
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CRM_MODULE.validateAndGoToStep2()">Next: Add Contacts ➔</button>
        </div>

        <!-- Step 2 Pane -->
        <div id="wizStep2" style="display:none;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Points of Contact (Authorized Brand Representatives)</label>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.6rem;">First contact is marked as Primary for default portal routing. Select the star to change Primary.</div>
            
            <div style="display:grid; grid-template-columns: 30px 1.2fr 1fr 1fr 28px; gap:0.4rem; font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.2rem; padding:0 0.2rem;">
              <span>PRI</span>
              <span>Name *</span>
              <span>Role</span>
              <span>Phone</span>
              <span></span>
            </div>

            <div id="crmPocList" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.5rem;">
              <!-- Managed dynamically -->
            </div>
            <button class="btn-secondary btn-sm" onclick="window.CRM_MODULE.addPocRow('', 'Authorized POC', '', false)">+ Add Another Contact</button>
          </div>

          <div style="display:flex; gap:0.75rem; margin-top:1rem;">
            <button class="btn-secondary" style="flex:1;" onclick="window.CRM_MODULE.setStep(1)">⬅ Back</button>
            <button class="btn-primary" style="flex:1;" id="crmSubmitBtn" onclick="window.CRM_MODULE.submitClient()">🚀 Complete Onboarding</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 360° CRM HUB MODAL -->
    <div class="modal-overlay" id="crmHubModal">
      <div class="modal-box" style="max-width: 880px; width: 92vw; max-height: 92vh; overflow-y: auto; background: var(--surface, #1e1b2e); border: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius: 16px; padding: 1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
          <div>
            <h2 style="color:#fff; font-size:1.4rem; margin:0; font-family: var(--font-heading);" id="hubClientName">Client Name</h2>
            <div style="font-size: 0.85rem; color: var(--text-muted);" id="hubClientSub">360° CRM Hub, Multi-POC Access & Activity Timeline</div>
          </div>
          <button onclick="window.CRM_MODULE.closeHub()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
        </div>

        <!-- Hub Quick Actions Strip -->
        <div style="display:flex; gap:0.6rem; margin-bottom:1.2rem; flex-wrap:wrap;" id="hubQuickActionsStrip">
          <!-- Populated dynamically in openHub() -->
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 1.5rem;">
          <!-- Left Col: Health & Meetings & POC Access -->
          <div>
            <!-- Health Score Widget -->
            <div style="background: rgba(0,0,0,0.25); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Account Health Score</div>
              <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.4rem;">
                <span id="hubHealthScore" style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading); color: var(--emerald-accent, #10b981);">--</span>
                <span style="color: var(--text-muted); font-size: 0.9rem;">/ 100</span>
              </div>
              <div id="hubHealthLabel" style="font-size: 0.85rem; color: var(--emerald-accent, #10b981); margin-top: 0.2rem;">Healthy</div>
              <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.4rem;">Derived from payment timeliness & task velocity</div>
            </div>

            <!-- Multi-POC Portal Access Management -->
            <div style="background: rgba(0,0,0,0.25); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase; margin-bottom:0.6rem;">🔑 Authorized POC Portal Access</div>
              <div id="hubPocAccessList" style="display:flex; flex-direction:column; gap:0.5rem;">
                <!-- Loaded dynamically -->
              </div>
            </div>

            <!-- Client Sync Log (Meetings) -->
            <div style="background: rgba(0,0,0,0.25); padding: 1rem; border-radius: 12px; border:1px solid rgba(255,255,255,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Client Sync Log</div>
                <button class="btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="window.CRM_MODULE.openLogMeetingModal()">+ Log Sync</button>
              </div>
              <div id="hubMeetingsList" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 220px; overflow-y: auto;">
                <div style="color: var(--text-dim); font-size: 0.8rem;">Loading...</div>
              </div>
            </div>
          </div>

          <!-- Right Col: Timeline -->
          <div>
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: bold; margin-bottom: 0.75rem;">Chronological CRM Activity</div>
            <div id="hubTimeline" style="display: flex; flex-direction: column; gap: 0.85rem; max-height: 520px; overflow-y: auto; padding-right: 0.5rem;">
              <div style="color: var(--text-dim); font-size: 0.8rem;">Loading timeline...</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LOG MEETING MODAL -->
    <div class="modal-overlay" id="logMeetingModal">
      <div class="modal-box" style="max-width:460px; background:var(--surface, #1e1b2e); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:16px; padding:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📝 Log Client Sync Meeting</h3>
          <button onclick="window.CRM_MODULE.closeLogMeetingModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Meeting Date *</label>
              <input type="date" id="meetDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Time</label>
              <input type="time" id="meetTime" class="form-input" value="${new Date().toTimeString().substring(0, 5)}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Notes & Summary *</label>
            <textarea id="meetNotes" class="form-input" style="min-height:85px; resize:vertical;" placeholder="Key discussion points, deliverables reviewed, budget alignment, revisions requested..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:#fff;">Action Items / Next Steps</label>
            <input type="text" id="meetActions" class="form-input" placeholder="e.g. Send revised TVC proposal by Thursday">
          </div>
          <button class="btn-primary" style="margin-top:0.5rem;" onclick="window.CRM_MODULE.submitLogMeeting()">💾 Save Meeting Log</button>
        </div>
      </div>
    </div>
  `;

  // ─── Module Public API ───────────────────────────────────────────────────────
  window.CRM_MODULE = {
    toggleCurrency() {
      currentCurrency = currentCurrency === 'BDT' ? 'USD' : 'BDT';
      localStorage.setItem('gro10x_currency', currentCurrency);
      
      const btn = document.getElementById('crmCurrencyToggleBtn');
      if (btn) btn.innerText = `💱 ${currentCurrency === 'USD' ? 'USD ($)' : 'BDT (৳)'}`;
      
      const spendLabel = document.getElementById('crmSpendLabel');
      if (spendLabel) spendLabel.innerText = `Total Spend (${currentCurrency === 'USD' ? 'USD $' : 'BDT ৳'})`;

      updateKpiStrip();
      renderCRMGrid();

      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: currentCurrency } }));
      if (window.showToast) window.showToast(`Switched CRM currency to ${currentCurrency}`, 'info');
    },

    setSearch(val) {
      searchQuery = val;
      renderCRMGrid();
    },

    setFilterStatus(val) {
      filterStatus = val;
      renderCRMGrid();
    },

    setSort(val) {
      sortBy = val;
      renderCRMGrid();
    },

    resetFilters() {
      searchQuery = '';
      filterStatus = 'all';
      sortBy = 'revenue';
      const searchInput = document.getElementById('crmSearchInput');
      const filterSelect = document.getElementById('crmFilterSelect');
      const sortSelect = document.getElementById('crmSortSelect');
      if (searchInput) searchInput.value = '';
      if (filterSelect) filterSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'revenue';
      renderCRMGrid();
    },

    setStep(step) {
      const s1 = document.getElementById('wizStep1');
      const s2 = document.getElementById('wizStep2');
      const b1 = document.getElementById('wizStepBtn1');
      const b2 = document.getElementById('wizStepBtn2');
      if (step === 1) {
        if (s1) s1.style.display = 'block';
        if (s2) s2.style.display = 'none';
        if (b1) { b1.className = 'badge badge-purple'; b1.style.color = '#fff'; b1.style.background = ''; }
        if (b2) { b2.className = 'badge'; b2.style.color = 'var(--text-muted)'; b2.style.background = 'transparent'; }
      } else {
        if (s1) s1.style.display = 'none';
        if (s2) s2.style.display = 'block';
        if (b2) { b2.className = 'badge badge-purple'; b2.style.color = '#fff'; b2.style.background = ''; }
        if (b1) { b1.className = 'badge'; b1.style.color = 'var(--text-muted)'; b1.style.background = 'transparent'; }
      }
    },

    validateAndGoToStep2() {
      const name = document.getElementById('crmName')?.value.trim();
      const email = document.getElementById('crmEmail')?.value.trim();
      const nameEl = document.getElementById('crmName');
      const emailEl = document.getElementById('crmEmail');

      if (!name) {
        if (nameEl) {
          nameEl.style.borderColor = '#ef4444';
          nameEl.focus();
        }
        return window.showToast && window.showToast('Please enter client or brand name.', 'error');
      } else if (nameEl) {
        nameEl.style.borderColor = '';
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailEl) {
          emailEl.style.borderColor = '#ef4444';
          emailEl.focus();
        }
        return window.showToast && window.showToast('Please enter a valid company email address.', 'error');
      } else if (emailEl) {
        emailEl.style.borderColor = '';
      }

      this.setStep(2);
    },

    openAddModal() {
      currentEditingClient = null;
      document.getElementById('crmModalTitle').innerText = '👥 Client Onboarding Wizard';
      document.getElementById('crmName').value = '';
      document.getElementById('crmIndustry').value = '';
      document.getElementById('crmEmail').value = '';
      document.getElementById('crmPhone').value = '';
      document.getElementById('crmStatus').value = 'Active Retainer';
      document.getElementById('crmTotalSpent').value = '0';
      
      const submitBtn = document.getElementById('crmSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '🚀 Complete Onboarding';
      }

      const spendLabel = document.getElementById('crmSpendLabel');
      if (spendLabel) spendLabel.innerText = `Total Spend (${currentCurrency === 'USD' ? 'USD $' : 'BDT ৳'})`;

      const pocList = document.getElementById('crmPocList');
      if (pocList) {
        pocList.innerHTML = '';
        this.addPocRow('', 'Brand Lead', '', true);
      }

      const modal = document.getElementById('crmModal');
      if (modal) modal.classList.add('active');
      this.setStep(1);
    },

    openEditModal(clientId) {
      const client = clientsData.find(c => c.id === clientId);
      if (!client) return;

      currentEditingClient = client;
      document.getElementById('crmModalTitle').innerText = `✏️ Edit Client: ${client.name}`;
      document.getElementById('crmName').value = client.name || '';
      document.getElementById('crmIndustry').value = client.category || client.industry || '';
      document.getElementById('crmEmail').value = client.email || '';
      document.getElementById('crmPhone').value = client.phone || '';
      document.getElementById('crmStatus').value = client.status || 'Active Retainer';
      
      document.getElementById('crmTotalSpent').value = Math.round(spendAmountVal(client));

      const submitBtn = document.getElementById('crmSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '💾 Save Client Changes';
      }

      const spendLabel = document.getElementById('crmSpendLabel');
      if (spendLabel) spendLabel.innerText = `Total Spend (${currentCurrency === 'USD' ? 'USD $' : 'BDT ৳'})`;

      const pocList = document.getElementById('crmPocList');
      if (pocList) {
        pocList.innerHTML = '';
        const pocs = client.pocs && client.pocs.length > 0 ? client.pocs : [{ name: client.contactPerson || '', role: 'Lead Contact', phone: client.phone || '', isPrimary: true }];
        pocs.forEach((p, idx) => this.addPocRow(p.name, p.role, p.phone, p.isPrimary || idx === 0));
      }

      const modal = document.getElementById('crmModal');
      if (modal) modal.classList.add('active');
      this.setStep(1);
    },

    closeModal() {
      const modal = document.getElementById('crmModal');
      if (modal) modal.classList.remove('active');
      currentEditingClient = null;
    },

    addPocRow(name = '', role = '', phone = '', isPrimary = false) {
      const list = document.getElementById('crmPocList');
      if (!list) return;

      const rowIndex = list.children.length;
      const shouldBePrimary = isPrimary || rowIndex === 0;

      const div = document.createElement('div');
      div.className = 'poc-row';
      div.style.cssText = 'display:grid; grid-template-columns: 30px 1.2fr 1fr 1fr 28px; gap:0.4rem; align-items:center;';
      div.innerHTML = `
        <label title="Primary POC" style="cursor:pointer; display:flex; align-items:center; justify-content:center;">
          <input type="radio" name="primaryPocRadio" class="poc-primary-radio" ${shouldBePrimary ? 'checked' : ''} style="cursor:pointer; accent-color:var(--purple-brand, #7c3aed);">
        </label>
        <input type="text" class="form-input poc-name" placeholder="Contact Name" value="${escapeHTML(name)}" style="font-size:0.8rem; padding:0.4rem 0.5rem;">
        <input type="text" class="form-input poc-role" placeholder="Role (e.g. Lead)" value="${escapeHTML(role || 'Authorized POC')}" style="font-size:0.8rem; padding:0.4rem 0.5rem;">
        <input type="text" class="form-input poc-phone" placeholder="Phone / WhatsApp" value="${escapeHTML(phone)}" style="font-size:0.8rem; padding:0.4rem 0.5rem;">
        <button type="button" onclick="this.closest('.poc-row').remove()" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem; padding:0;" title="Remove Contact">✕</button>
      `;
      list.appendChild(div);
    },

    async submitClient() {
      const name = document.getElementById('crmName').value.trim();
      const category = document.getElementById('crmIndustry').value.trim() || 'General';
      const email = document.getElementById('crmEmail').value.trim();
      const phone = document.getElementById('crmPhone').value.trim();
      const status = document.getElementById('crmStatus').value;
      const rawSpentInput = parseFloat(document.getElementById('crmTotalSpent').value) || 0;
      const bdtTotalSpent = currentCurrency === 'USD' ? rawSpentInput * BDT_PER_USD : rawSpentInput;

      const pocRows = document.querySelectorAll('.poc-row');
      const pocs = [];
      pocRows.forEach((row) => {
        const pName = row.querySelector('.poc-name')?.value.trim();
        const pRole = row.querySelector('.poc-role')?.value.trim();
        const pPhone = row.querySelector('.poc-phone')?.value.trim();
        const isPrimary = row.querySelector('.poc-primary-radio')?.checked || false;
        if (pName) {
          pocs.push({ name: pName, role: pRole || 'Contact', phone: pPhone, isPrimary });
        }
      });

      if (!name) {
        this.setStep(1);
        return window.showToast && window.showToast('Please enter client or brand name.', 'error');
      }

      const submitBtn = document.getElementById('crmSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Saving Account...';
      }

      const primaryPoc = pocs.find(p => p.isPrimary) || pocs[0];

      const payload = {
        name,
        category,
        email,
        phone: phone || (primaryPoc ? primaryPoc.phone : ''),
        contactPerson: primaryPoc ? primaryPoc.name : 'Lead Contact',
        status,
        totalSpent: bdtTotalSpent,
        pocs
      };

      try {
        if (currentEditingClient) {
          await APP_API.put('/clients/' + currentEditingClient.id, payload);
          window.showToast && window.showToast('Client "' + name + '" updated successfully!', 'success');
        } else {
          const res = await APP_API.post('/clients', payload);
          if (res.isExisting) {
            window.showToast && window.showToast('Merged into existing client "' + name + '"!', 'info');
          } else {
            window.showToast && window.showToast('Client "' + name + '" onboarded successfully!', 'success');
          }
        }
        this.closeModal();
        await loadCRMData();
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = currentEditingClient ? '💾 Save Client Changes' : '🚀 Complete Onboarding';
        }
        window.showToast && window.showToast('Failed to save client: ' + err.message, 'error');
      }
    },

    deleteTimeouts: {},

    async deleteClient(id, btnEl) {
      const client = clientsData.find(c => c.id === id);
      const clientName = client?.name || 'this client';

      // Inline non-blocking 4-second confirmation
      if (btnEl && !btnEl.dataset.confirming) {
        btnEl.dataset.confirming = 'true';
        const origText = btnEl.innerHTML;
        btnEl.innerHTML = '⚠️ Confirm?';
        btnEl.style.background = 'rgba(239, 68, 68, 0.2)';
        btnEl.style.color = '#ef4444';
        btnEl.style.border = '1px solid #ef4444';

        this.deleteTimeouts[id] = setTimeout(() => {
          if (btnEl) {
            delete btnEl.dataset.confirming;
            btnEl.innerHTML = origText;
            btnEl.style.background = '';
            btnEl.style.color = '#ef4444';
            btnEl.style.border = '';
          }
        }, 4000);
        return;
      }

      // Confirmed delete
      if (this.deleteTimeouts[id]) clearTimeout(this.deleteTimeouts[id]);
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '⏳';
      }

      try {
        await APP_API.delete('/clients/' + id);
        window.showToast && window.showToast('Client "' + clientName + '" deleted.', 'success');
        clientsData = clientsData.filter(c => c.id !== id);
        updateKpiStrip();
        renderCRMGrid();
      } catch (err) {
        if (btnEl) {
          delete btnEl.dataset.confirming;
          btnEl.disabled = false;
          btnEl.innerHTML = '🗑️';
        }
        window.showToast && window.showToast('Delete failed: ' + err.message, 'error');
      }
    },

    async deduplicateAccounts() {
      try {
        if (window.showToast) window.showToast('Consolidating duplicate accounts...', 'info');
        const res = await APP_API.post('/clients/cleanup/deduplicate', {});
        if (res && res.success) {
          await loadCRMData();
          window.showToast && window.showToast('🧹 Consolidated ' + (res.consolidatedCount || 0) + ' duplicate accounts.', 'success');
        } else {
          window.showToast && window.showToast('Deduplication: ' + (res.error || 'All accounts already canonical'), 'info');
        }
      } catch (e) {
        window.showToast && window.showToast('Deduplication error: ' + e.message, 'error');
      }
    },

    openHub: async function(clientId) {
      const modal = document.getElementById('crmHubModal');
      if (modal) modal.classList.add('active');
      modal.style.display = 'flex';

      document.getElementById('hubClientName').innerText = 'Loading...';
      document.getElementById('hubHealthScore').innerText = '--';
      document.getElementById('hubTimeline').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading timeline...</div>';
      document.getElementById('hubMeetingsList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading meetings...</div>';
      document.getElementById('hubPocAccessList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading POC access...</div>';

      const client = clientsData.find(c => c.id === clientId);
      if (client) {
        document.getElementById('hubClientName').innerText = client.name;
        document.getElementById('hubClientSub').innerText = (client.category || 'Client Partner') + ' · Account ID: ' + client.id;
        
        // Populate Hub Quick Actions
        const quickActions = document.getElementById('hubQuickActionsStrip');
        if (quickActions) {
          const primaryPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';
          quickActions.innerHTML = `
            ${primaryPhone ? `
              <a href="https://wa.me/${primaryPhone}" target="_blank" class="btn-secondary btn-sm" style="font-size:0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">
                📲 WhatsApp Direct
              </a>
            ` : ''}
            <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.CRM_MODULE.createProposalForClient('${escapeHTML(client.name)}', '${escapeHTML(client.email || '')}')">
              📋 Create Proposal
            </button>
            <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.CRM_MODULE.openLogMeetingModal()">
              📝 Log Meeting
            </button>
            <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.CRM_MODULE.openEditModal('${client.id}')">
              ✏️ Edit Profile
            </button>
          `;
        }
      }

      this.currentHubClientId = clientId;
      await this.loadHubData(clientId);
    },

    createProposalForClient(clientName, clientEmail) {
      this.closeHub();
      window.location.hash = '#proposals';
      setTimeout(() => {
        if (window.PROPOSALS_MODULE && typeof window.PROPOSALS_MODULE.openCreateModal === 'function') {
          window.PROPOSALS_MODULE.openCreateModal();
          const nameInput = document.getElementById('propClientName');
          if (nameInput) nameInput.value = clientName;
        }
      }, 300);
    },

    closeHub: function() {
      const modal = document.getElementById('crmHubModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
      this.currentHubClientId = null;
    },

    loadHubData: async function(clientId) {
      try {
        const client = clientsData.find(c => c.id === clientId);
        const data = await APP_API.get('/clients/' + clientId + '/timeline').catch(() => ({}));

        // Render POC Access panel
        const pocAccessEl = document.getElementById('hubPocAccessList');
        if (pocAccessEl && client) {
          const pocs = client.pocs && client.pocs.length > 0
            ? client.pocs
            : [{ name: client.contactPerson || 'Lead Contact', role: 'Primary', phone: client.phone, isPrimary: true }];

          pocAccessEl.innerHTML = pocs.map((p) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); padding:0.6rem 0.75rem; border-radius:10px; display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
              <div>
                <div style="font-size:0.82rem; font-weight:700; color:#fff;">👤 ${escapeHTML(p.name)} <span style="font-size:0.7rem; color:var(--text-muted);">(${escapeHTML(p.role || 'Authorized Contact')})</span></div>
                <div style="font-size:0.72rem; color:var(--purple-light); margin-top:0.1rem;">${p.phone ? '📞 ' + escapeHTML(p.phone) : 'No phone linked'}</div>
              </div>
              ${p.phone ? `
                <button class="btn-secondary btn-sm" style="font-size:0.68rem; padding:0.25rem 0.6rem; border-radius:6px;"
                  onclick="window.CRM_MODULE.generatePocAccess('${client.id}', '${escapeHTML(p.name)}', '${escapeHTML(p.phone)}', '${escapeHTML(p.role || '')}')">
                  🔑 Grant Access
                </button>
              ` : '<span style="font-size:0.7rem; color:var(--text-dim);">No Phone</span>'}
            </div>
          `).join('');
        }

        // Update Health
        if (data && data.health) {
          const scoreEl = document.getElementById('hubHealthScore');
          const labelEl = document.getElementById('hubHealthLabel');
          if (scoreEl) scoreEl.innerText = data.health.score;
          if (labelEl) labelEl.innerText = data.health.label;
          if (scoreEl && labelEl) {
            if (data.health.score < 50) { scoreEl.style.color = '#ef4444'; labelEl.style.color = '#ef4444'; }
            else if (data.health.score < 75) { scoreEl.style.color = '#f59e0b'; labelEl.style.color = '#f59e0b'; }
            else { scoreEl.style.color = '#10b981'; labelEl.style.color = '#10b981'; }
          }
        }

        // Update Meetings
        const meetingsList = document.getElementById('hubMeetingsList');
        if (meetingsList) {
          if (data && data.meetings && data.meetings.length > 0) {
            meetingsList.innerHTML = data.meetings.map(m => `
              <div style="background: rgba(255,255,255,0.04); padding: 0.65rem 0.75rem; border-radius: 8px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.2rem;">📅 ${new Date(m.meeting_date).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}</div>
                <div style="font-size: 0.82rem; color: var(--text-main, #fff); margin-bottom: 0.2rem; line-height:1.3;">${escapeHTML(m.notes || 'No notes')}</div>
                ${m.action_items ? `<div style="font-size: 0.72rem; color: #f59e0b; margin-top:0.2rem;">🔥 Action: ${escapeHTML(m.action_items)}</div>` : ''}
              </div>
            `).join('');
          } else {
            meetingsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1.5rem;">No sync meetings logged yet. Click "+ Log Sync" to record.</div>';
          }
        }

        // Update Timeline
        const timelineEl = document.getElementById('hubTimeline');
        if (timelineEl) {
          if (data && data.timeline && data.timeline.length > 0) {
            timelineEl.innerHTML = data.timeline.map(t => `
              <div style="display: flex; gap: 0.75rem; align-items:flex-start;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${t.color || '#3b82f6'}22; color: ${t.color || '#3b82f6'}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; margin-top:0.15rem;">${t.icon || '📌'}</div>
                <div style="background: rgba(255,255,255,0.03); padding: 0.7rem 0.85rem; border-radius: 10px; flex: 1; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 0.15rem;">${new Date(t.date).toLocaleString()}</div>
                  <div style="font-size: 0.85rem; font-weight: bold; color: var(--text-main, #fff); margin-bottom: 0.15rem;">${escapeHTML(t.title)}</div>
                  <div style="font-size: 0.78rem; color: var(--text-dim); line-height:1.3;">${escapeHTML(t.description || '')}</div>
                </div>
              </div>
            `).join('');
          } else {
            timelineEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 3rem 1rem;">No timeline activity recorded yet. Invoices, tasks, and reviews will appear here.</div>';
          }
        }
      } catch (err) {
        window.showToast && window.showToast('Failed to load CRM Hub data', 'error');
      }
    },

    async generatePocAccess(clientId, name, phone, role = '') {
      try {
        const res = await APP_API.post('/auth/pin/generate', {
          phone,
          linkedId: clientId,
          linkedType: 'client',
          contactName: name,
          pocRole: role,
          sendTelegram: false
        });

        if (res.success || res.pin) {
          this.showPocAccessModal(name, phone, res.pin, res.portalUrl, res.whatsappLink, role);
        } else {
          window.showToast && window.showToast('Failed to generate PIN', 'error');
        }
      } catch (err) {
        window.showToast && window.showToast('Access Generation Error: ' + err.message, 'error');
      }
    },

    showPocAccessModal(name, phone, pin, portalUrl, whatsappLink) {
      let modal = document.getElementById('pocAccessCardModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pocAccessCardModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal-box" style="max-width:440px; background:var(--surface, #1e1b2e); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:16px; padding:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">🔑 Portal Access Generated</h3>
            <button onclick="document.getElementById('pocAccessCardModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; font-size:0.88rem;">
            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border:1px solid var(--border-subtle, rgba(255,255,255,0.08));">
              <div style="color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">AUTHORIZED REPRESENTATIVE</div>
              <div style="font-weight:800; color:#fff; font-size:1.05rem; margin-top:0.2rem;">👤 ${escapeHTML(name)}</div>
              <div style="color:var(--purple-light); font-size:0.82rem; margin-top:0.15rem;">📞 ${escapeHTML(phone)}</div>
            </div>

            <div style="background:rgba(124, 58, 237, 0.12); padding:1rem; border-radius:12px; border:1px solid var(--purple-brand, #7c3aed); text-align:center;">
              <div style="font-size:0.75rem; color:var(--purple-light); font-weight:700; text-transform:uppercase;">Temporary 4-Digit PIN</div>
              <div style="font-size:2.2rem; font-weight:900; font-family:monospace; color:#fff; letter-spacing:0.2em; margin:0.3rem 0;">${pin}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Client will be prompted to change this on first login</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
              <a href="${whatsappLink}" target="_blank" class="btn-primary" style="text-align:center; text-decoration:none; background:linear-gradient(135deg,#059669,#10b981);">
                📲 Send Access Card via WhatsApp
              </a>
              <button class="btn-secondary" onclick="navigator.clipboard.writeText('${portalUrl}'); window.showToast && window.showToast('Portal URL copied to clipboard!', 'success');">
                📋 Copy Portal Direct Link
              </button>
            </div>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },

    openLogMeetingModal() {
      const modal = document.getElementById('logMeetingModal');
      if (modal) modal.classList.add('active');
    },

    closeLogMeetingModal() {
      const modal = document.getElementById('logMeetingModal');
      if (modal) modal.classList.remove('active');
    },

    async submitLogMeeting() {
      if (!this.currentHubClientId) return;
      const date = document.getElementById('meetDate')?.value;
      const time = document.getElementById('meetTime')?.value || '';
      const notes = document.getElementById('meetNotes')?.value?.trim();
      const action_items = document.getElementById('meetActions')?.value?.trim();

      if (!date || !notes) {
        return window.showToast && window.showToast('Date and meeting summary are required.', 'error');
      }

      const fullNotes = time ? '[' + time + '] ' + notes : notes;

      try {
        await APP_API.post('/clients/' + this.currentHubClientId + '/meetings', { meeting_date: date, notes: fullNotes, action_items });
        window.showToast && window.showToast('Meeting logged successfully!', 'success');
        this.closeLogMeetingModal();
        this.loadHubData(this.currentHubClientId);
      } catch (err) {
        window.showToast && window.showToast('Failed to log meeting: ' + err.message, 'error');
      }
    },

    openImportModal() {
      parsedImportClients = [];
      let modal = document.getElementById('crmImportClientsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'crmImportClientsModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-box" style="max-width: 660px; background:var(--surface, #1e1b2e); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:16px; padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem; margin-bottom:1rem;">
              <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">👥 Bulk Import Clients (CSV)</h3>
              <button class="modal-close" onclick="window.CRM_MODULE.closeImportModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:1rem;">
              
              <!-- Guideline Box -->
              <div style="background:var(--surface-3, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:0.9rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-weight:800; font-size:0.82rem; color:var(--text-primary, #fff);">📋 Client CSV Column Format Guidelines</div>
                  <button type="button" class="btn-secondary" onclick="window.CRM_MODULE.downloadSampleCSV()" style="font-size:0.75rem; padding:0.35rem 0.75rem;">
                    📥 Download Sample CSV
                  </button>
                </div>
                <div class="table-responsive" style="margin-bottom:0; max-height:160px; overflow-y:auto;">
                  <table class="data-table" style="font-size:0.74rem; width:100%;">
                    <thead>
                      <tr><th>Column Header</th><th>Status</th><th>Description / Example</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><code>Company Name</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Client brand / business name (e.g. <em>Chillox BD</em>)</td></tr>
                      <tr><td><code>Contact Person</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Primary POC name (e.g. <em>Arman Hossain</em>)</td></tr>
                      <tr><td><code>Phone</code></td><td><span style="color:#10b981; font-weight:700;">Recommended</span></td><td>Mobile / WhatsApp for PIN login (e.g. <em>+8801711223344</em>)</td></tr>
                      <tr><td><code>Email</code></td><td>Optional</td><td>Official email (e.g. <em>info@chillox.bd</em>)</td></tr>
                      <tr><td><code>Industry</code></td><td>Optional</td><td>Category (e.g. <em>Food & Beverage, Fashion, Retail</em>)</td></tr>
                      <tr><td><code>Monthly Retainer</code></td><td>Optional</td><td>Budget (e.g. <em>150000</em> or <em>$1,200</em>)</td></tr>
                      <tr><td><code>Status</code></td><td>Optional</td><td>Account status (<em>Active Retainer, Onboarding</em>)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Upload / Paste Mode Switcher -->
              <div>
                <div style="display:flex; gap:0.5rem; margin-bottom:0.6rem;">
                  <button type="button" id="crmImportTabFileBtn" class="btn-secondary" style="font-size:0.78rem; padding:0.4rem 0.85rem;" onclick="window.CRM_MODULE.switchImportTab('file')">📂 Upload CSV File</button>
                  <button type="button" id="crmImportTabPasteBtn" class="btn-ghost" style="font-size:0.78rem; padding:0.4rem 0.85rem;" onclick="window.CRM_MODULE.switchImportTab('paste')">📋 Paste Raw CSV Text</button>
                </div>

                <div id="crmImportFileContainer">
                  <input type="file" id="crmCsvFileInput" accept=".csv,text/csv" class="input-text" style="padding:0.6rem; width:100%;" onchange="window.CRM_MODULE.handleFileSelected(event)">
                </div>

                <div id="crmImportPasteContainer" style="display:none;">
                  <textarea id="crmCsvTextInput" class="input-text" style="height:115px; font-family:monospace; font-size:0.78rem; width:100%;" placeholder="Company Name,Contact Person,Phone,Email,Industry,Monthly Retainer,Status&#10;Chillox Bangladesh,Arman Hossain,+8801711223344,arman@chillox.bd,Food & Beverage,150000,Active Retainer&#10;Apex Footwear,Sabbir Rahman,+8801811556677,sabbir@apex.bd,Fashion & Retail,95000,Active Retainer" oninput="window.CRM_MODULE.handleTextPasted(event)"></textarea>
                </div>
              </div>

              <!-- Live Preview Container -->
              <div id="crmImportPreviewContainer" style="display:none; background:var(--surface-2, rgba(0,0,0,0.2)); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:10px; padding:0.75rem;">
                <div style="font-size:0.8rem; font-weight:800; color:var(--text-primary, #fff); margin-bottom:0.4rem;" id="crmImportPreviewTitle">👁️ Live Pre-Import Preview</div>
                <div class="table-responsive" style="max-height:160px; overflow-y:auto;">
                  <table class="data-table" style="font-size:0.74rem; width:100%;" id="crmImportPreviewTable">
                    <thead id="crmImportPreviewThead"></thead>
                    <tbody id="crmImportPreviewTbody"></tbody>
                  </table>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.25rem;">
                <button type="button" class="btn-secondary" onclick="window.CRM_MODULE.closeImportModal()">Cancel</button>
                <button type="button" id="crmSubmitImportBtn" class="btn-primary" disabled onclick="window.CRM_MODULE.executeImport()">🚀 Import Clients to Database</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      const fileInput = document.getElementById('crmCsvFileInput');
      const textInput = document.getElementById('crmCsvTextInput');
      const previewCont = document.getElementById('crmImportPreviewContainer');
      const submitBtn = document.getElementById('crmSubmitImportBtn');
      if (fileInput) fileInput.value = '';
      if (textInput) textInput.value = '';
      if (previewCont) previewCont.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '🚀 Import Clients to Database';
      }
      this.switchImportTab('file');
      modal.classList.add('active');
    },

    closeImportModal() {
      const modal = document.getElementById('crmImportClientsModal');
      if (modal) modal.classList.remove('active');
      parsedImportClients = [];
    },

    downloadSampleCSV() {
      const csvHeader = "Company Name,Contact Person,Phone,Email,Industry,Monthly Retainer,Status\n";
      const sampleRow1 = "Chillox Bangladesh,Arman Hossain,+8801711223344,arman@chillox.bd,Food & Beverage,150000,Active Retainer\n";
      const sampleRow2 = "Apex Footwear,Sabbir Rahman,+8801811556677,sabbir@apex.bd,Fashion & Retail,95000,Active Retainer\n";
      const sampleRow3 = "Aura Skincare,Tania Ahmed,+8801911998877,tania@auraskin.com,Health & Beauty,80000,Onboarding\n";
      const sampleRow4 = "Global Logistics BD,Karim Reza,+8801711889900,karim@globallogistics.com,Supply Chain,$1200,Active Retainer";
      
      const csvContent = csvHeader + sampleRow1 + sampleRow2 + sampleRow3 + sampleRow4;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'gro10x_clients_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showToast && window.showToast('📥 Downloaded sample Client CSV template!', 'success');
    },

    switchImportTab(tab) {
      const fileBtn = document.getElementById('crmImportTabFileBtn');
      const pasteBtn = document.getElementById('crmImportTabPasteBtn');
      const fileCont = document.getElementById('crmImportFileContainer');
      const pasteCont = document.getElementById('crmImportPasteContainer');

      if (tab === 'file') {
        if (fileBtn) { fileBtn.className = 'btn-secondary'; }
        if (pasteBtn) { pasteBtn.className = 'btn-ghost'; }
        if (fileCont) fileCont.style.display = 'block';
        if (pasteCont) pasteCont.style.display = 'none';
      } else {
        if (fileBtn) { fileBtn.className = 'btn-ghost'; }
        if (pasteBtn) { pasteBtn.className = 'btn-secondary'; }
        if (fileCont) fileCont.style.display = 'none';
        if (pasteCont) pasteCont.style.display = 'block';
      }
    },

    parseCSVText(text) {
      if (!text || !text.trim()) return [];
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          if (cols[idx] !== undefined) row[h] = cols[idx];
        });

        const name = row.name || row['company name'] || row.company || row.client || row['brand name'] || '';
        const contactPerson = row['contact person'] || row.contact || row.contactperson || row.name || 'Primary POC';
        const phone = row.phone || row.mobile || row.whatsapp || row['cell'] || row['phone number'] || '';
        const email = row.email || row['contact email'] || row.mail || '';
        const industry = row.industry || row.category || 'General';
        const rawRetainer = row['monthly retainer'] || row.retainervalue || row.retainer || row.budget || row.value || 0;
        const status = row.status || 'Active Retainer';

        let retainerVal = 0;
        if (typeof rawRetainer === 'string' && rawRetainer.includes('$')) {
          const num = parseFloat(rawRetainer.replace(/[^0-9.]/g, '')) || 0;
          retainerVal = num * BDT_PER_USD;
        } else {
          retainerVal = parseFloat(String(rawRetainer).replace(/[^0-9.]/g, '')) || 0;
        }

        if (name && name.toLowerCase() !== 'company name' && name.toLowerCase() !== 'name') {
          parsed.push({
            name,
            contactPerson,
            phone,
            email,
            industry,
            category: industry,
            retainerValue: retainerVal,
            status
          });
        }
      }
      return parsed;
    },

    handleFileSelected(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        parsedImportClients = window.CRM_MODULE.parseCSVText(text);
        window.CRM_MODULE.renderPreview(parsedImportClients);
      };
      reader.readAsText(file);
    },

    handleTextPasted(e) {
      const text = e.target.value;
      parsedImportClients = window.CRM_MODULE.parseCSVText(text);
      window.CRM_MODULE.renderPreview(parsedImportClients);
    },

    renderPreview(clients) {
      const previewCont = document.getElementById('crmImportPreviewContainer');
      const thead = document.getElementById('crmImportPreviewThead');
      const tbody = document.getElementById('crmImportPreviewTbody');
      const title = document.getElementById('crmImportPreviewTitle');
      const submitBtn = document.getElementById('crmSubmitImportBtn');

      if (!clients || clients.length === 0) {
        if (previewCont) previewCont.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      if (previewCont) previewCont.style.display = 'block';
      if (title) title.innerHTML = `👁️ Live Pre-Import Preview <span class="badge badge-emerald" style="margin-left:0.5rem;">${clients.length} clients detected</span>`;

      if (thead) {
        thead.innerHTML = `<tr><th>Company</th><th>Contact POC</th><th>Phone</th><th>Industry</th><th>Retainer</th><th>Status</th></tr>`;
      }

      if (tbody) {
        const maxShown = Math.min(clients.length, 6);
        tbody.innerHTML = clients.slice(0, maxShown).map(c => `
          <tr>
            <td class="nowrap"><strong>${escapeHTML(c.name)}</strong></td>
            <td class="nowrap">${escapeHTML(c.contactPerson)}</td>
            <td class="nowrap" style="color:var(--text-muted);">${escapeHTML(c.phone || '—')}</td>
            <td class="truncate" style="color:var(--text-muted);">${escapeHTML(c.industry || 'General')}</td>
            <td class="nowrap" style="color:var(--emerald-brand, #10b981);">${c.retainerValue ? formatMoney(c.retainerValue) : '—'}</td>
            <td class="nowrap"><span class="badge badge-purple" style="font-size:0.68rem;">${escapeHTML(c.status)}</span></td>
          </tr>
        `).join('') + (clients.length > maxShown ? `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.75rem; padding:0.4rem;">...and ${clients.length - maxShown} more client accounts ready for batch upsert</td></tr>` : '');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = `🚀 Import ${clients.length} Clients to Database`;
      }
    },

    async executeImport() {
      if (!parsedImportClients || parsedImportClients.length === 0) {
        return window.showToast && window.showToast('Please select a valid CSV file or paste client data first.', 'error');
      }

      const submitBtn = document.getElementById('crmSubmitImportBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Importing Accounts...';
      }

      try {
        const res = await APP_API.post('/admin/import/clients', { rows: parsedImportClients });
        if (res && (res.success || res.imported || res.addedCount !== undefined)) {
          this.closeImportModal();
          await loadCRMData();
          const added = res.addedCount || 0;
          const updated = res.updatedCount || 0;
          window.showToast && window.showToast(`🎉 Bulk import complete: ${added} added, ${updated} updated!`, 'success');
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = '🚀 Import Clients to Database';
          }
          window.showToast && window.showToast('Import failed: ' + (res.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = '🚀 Import Clients to Database';
        }
        window.showToast && window.showToast('Import error: ' + err.message, 'error');
      }
    }
  };

  function spendAmountVal(c) {
    const raw = c.totalSpent !== undefined ? c.totalSpent : c.total_spent;
    if (typeof raw === 'number') return raw;
    return parseFloat(String(raw || 0).replace(/[^0-9.]/g, '')) || 0;
  }

  // ─── Keyboard Shortcuts & Backdrop Dismissal ───────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.CRM_MODULE.closeModal();
      window.CRM_MODULE.closeHub();
      window.CRM_MODULE.closeLogMeetingModal();
      window.CRM_MODULE.closeImportModal();
      const accessModal = document.getElementById('pocAccessCardModal');
      if (accessModal) accessModal.classList.remove('active');
    }
  });

  // ─── Real-Time SSE Multi-Instance Listener ─────────────────────────────────
  if (window.APP_API && typeof window.APP_API.on === 'function') {
    window.APP_API.on('client_update', () => loadCRMData());
    window.APP_API.on('clients_update', () => loadCRMData());
  }

  window.addEventListener('gro10x_currency_changed', (e) => {
    if (e.detail && e.detail.currency && e.detail.currency !== currentCurrency) {
      currentCurrency = e.detail.currency;
      const btn = document.getElementById('crmCurrencyToggleBtn');
      if (btn) btn.innerText = `💱 ${currentCurrency === 'USD' ? 'USD ($)' : 'BDT (৳)'}`;
      updateKpiStrip();
      renderCRMGrid();
    }
  });

  // Initial load
  await loadCRMData();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
