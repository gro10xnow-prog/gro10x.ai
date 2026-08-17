/**
 * public/app/modules/crm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client CRM & Multi-POC Management View Module v4.0 (Admin SPA)
 * Includes Email in Wizard, Edit/Delete Client, Search/Filter/Sort,
 * Multi-POC Portal Access Generation, Fixed Spend/Campaign counts,
 * CRM Hub Sync Log with date pickers, and explicit error handling on CSV import.
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

  // ─── Load Data ──────────────────────────────────────────────────────────────
  async function loadCRMData() {
    try {
      const data = await APP_API.get('/clients').catch(() => []);
      clientsData = Array.isArray(data) ? data : [];
      renderCRMGrid();
    } catch (err) {
      container.innerHTML = `<div style="color:var(--text-error); padding: 2rem;">Error loading CRM data: ${err.message}</div>`;
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
        (c.category || c.industry || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      clients = clients.filter(c => (c.status || '').toLowerCase() === filterStatus.toLowerCase());
    }

    if (sortBy === 'revenue') {
      clients.sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0));
    } else if (sortBy === 'name') {
      clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      clients.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    }
    return clients;
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  function renderCRMGrid() {
    const filtered = getFilteredClients();
    const activeClients = clientsData.filter(c => (c.status || '').toLowerCase() !== 'churned');
    const totSpent = clientsData.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
    const avgSpend = activeClients.length > 0 ? Math.round(totSpent / activeClients.length) : 0;
    const onboardingCount = clientsData.filter(c => (c.status || '').toLowerCase() === 'onboarding').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            👥 Client CRM Directory
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client accounts, authorized points of contact (POCs), portal logins, and retainer status.
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary" style="font-size:0.8rem;" onclick="window.CRM_MODULE.openImportModal()">📥 Import Clients (CSV)</button>
          <button class="btn-primary" style="font-size:0.8rem;" onclick="window.CRM_MODULE.openAddModal()">+ Add New Client</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Clients</div>
          <div class="kpi-val">${activeClients.length}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${onboardingCount} Onboarding</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Retainer Spend</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${totSpent.toLocaleString()}</div>
          <div style="font-size:0.72rem; color:#10b981;">Cumulative Revenue</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Avg Account Value</div>
          <div class="kpi-val" style="color: var(--purple-light);">৳${avgSpend.toLocaleString()}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Per active client</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Accounts</div>
          <div class="kpi-val">${clientsData.length}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Master Directory</div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; align-items:center;">
        <input
          type="text"
          class="input-text"
          placeholder="🔍 Search by company, contact, or email..."
          style="flex:1; min-width:220px;"
          value="${escapeHTML(searchQuery)}"
          oninput="window.CRM_MODULE.setSearch(this.value)"
        >
        <select class="input-text" style="width:auto;" onchange="window.CRM_MODULE.setFilterStatus(this.value)">
          <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="Active Retainer" ${filterStatus === 'Active Retainer' ? 'selected' : ''}>Active Retainer</option>
          <option value="Onboarding" ${filterStatus === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
          <option value="Project-Based" ${filterStatus === 'Project-Based' ? 'selected' : ''}>Project-Based</option>
          <option value="Churned" ${filterStatus === 'Churned' ? 'selected' : ''}>Churned</option>
        </select>
        <select class="input-text" style="width:auto;" onchange="window.CRM_MODULE.setSort(this.value)">
          <option value="revenue" ${sortBy === 'revenue' ? 'selected' : ''}>Sort: By Spend ↓</option>
          <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Sort: Name A–Z</option>
          <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Sort: Newest First</option>
        </select>
      </div>

      <!-- Client Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1.25rem;">
        ${filtered.map(c => renderClientCard(c)).join('') || `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px;">No matching client accounts found.</div>`}
      </div>

      <!-- Add / Edit Client Modal -->
      <div class="modal-overlay" id="crmModal">
        <div class="modal-box" style="max-width:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;" id="crmModalTitle">👥 Client Onboarding Wizard</h2>
            <button onclick="window.CRM_MODULE.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <!-- Wizard Step Indicator -->
          <div style="display:flex; gap:0.5rem; margin: 1rem 0; background:rgba(255,255,255,0.05); padding:0.4rem; border-radius:10px;">
            <div id="wizStepBtn1" class="badge badge-purple" style="flex:1; text-align:center; cursor:pointer;" onclick="window.CRM_MODULE.setStep(1)">1. Company Details</div>
            <div id="wizStepBtn2" class="badge" style="flex:1; text-align:center; cursor:pointer; background:transparent; color:var(--text-muted);" onclick="window.CRM_MODULE.setStep(2)">2. Authorized Contacts (POCs)</div>
          </div>

          <!-- Step 1 Pane -->
          <div id="wizStep1">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label class="form-label">Client / Brand Name *</label>
                <input type="text" id="crmName" class="form-input" placeholder="e.g. Chillox Bangladesh">
              </div>
              <div class="form-group">
                <label class="form-label">Industry / Category</label>
                <input type="text" id="crmIndustry" class="form-input" placeholder="e.g. Fast Food & QSR">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label class="form-label">Company Email *</label>
                <input type="email" id="crmEmail" class="form-input" placeholder="contact@brand.com">
              </div>
              <div class="form-group">
                <label class="form-label">Company Phone / Hotline</label>
                <input type="text" id="crmPhone" class="form-input" placeholder="+8801700000000">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label class="form-label">Retainer Status</label>
                <select id="crmStatus" class="form-select">
                  <option value="Active Retainer">Active Retainer</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Project-Based">Project-Based</option>
                  <option value="Churned">Churned</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Total Spend (BDT)</label>
                <input type="number" id="crmTotalSpent" class="form-input" placeholder="0">
              </div>
            </div>

            <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CRM_MODULE.setStep(2)">Next: Add Contacts ➔</button>
          </div>

          <!-- Step 2 Pane -->
          <div id="wizStep2" style="display:none;">
            <div class="form-group">
              <label class="form-label">Points of Contact (Authorized Brand Representatives)</label>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.6rem;">First contact will be marked as Primary for default portal login routing.</div>
              <div id="crmPocList" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.5rem;">
                <!-- Managed dynamically -->
              </div>
              <button class="btn-secondary btn-sm" onclick="window.CRM_MODULE.addPocRow()">+ Add Another Contact</button>
            </div>

            <div style="display:flex; gap:0.75rem; margin-top:1rem;">
              <button class="btn-secondary" style="flex:1;" onclick="window.CRM_MODULE.setStep(1)">⬅ Back</button>
              <button class="btn-primary" style="flex:1;" id="crmSubmitBtn" onclick="window.CRM_MODULE.submitClient()">🚀 Complete Onboarding</button>
            </div>
          </div>
        </div>
      </div>

      <!-- CRM HUB MODAL -->
      <div class="modal-overlay" id="crmHubModal">
        <div class="modal-box" style="max-width: 860px; width: 92vw; max-height: 92vh; overflow-y: auto; background: var(--surface); padding: 1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
            <div>
              <h2 style="color:#fff; font-size:1.4rem; margin:0; font-family: var(--font-heading);" id="hubClientName">Client Name</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted);" id="hubClientSub">360° CRM Hub, Multi-POC Access & Activity Timeline</div>
            </div>
            <button onclick="window.CRM_MODULE.closeHub()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 1.5rem;">
            <!-- Left Col: Health & Meetings & POC Access -->
            <div>
              <!-- Health Score Widget -->
              <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border:1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Account Health Score</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.4rem;">
                  <span id="hubHealthScore" style="font-size: 2.2rem; font-weight: 800; font-family: var(--font-heading); color: var(--emerald-accent);">--</span>
                  <span style="color: var(--text-muted); font-size: 0.9rem;">/ 100</span>
                </div>
                <div id="hubHealthLabel" style="font-size: 0.85rem; color: var(--emerald-accent); margin-top: 0.2rem;">Healthy</div>
                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.4rem;">Derived from payment timeliness & task velocity</div>
              </div>

              <!-- Multi-POC Portal Access Management -->
              <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border:1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase; margin-bottom:0.6rem;">🔑 Authorized POC Portal Access</div>
                <div id="hubPocAccessList" style="display:flex; flex-direction:column; gap:0.5rem;">
                  <!-- Loaded dynamically -->
                </div>
              </div>

              <!-- Client Sync Log (Meetings) -->
              <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; border:1px solid rgba(255,255,255,0.05);">
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
        <div class="modal-box" style="max-width:440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0;">📝 Log Client Sync Meeting</h3>
            <button onclick="window.CRM_MODULE.closeLogMeetingModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Meeting Date *</label>
              <input type="date" id="meetDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label">Notes & Summary *</label>
              <textarea id="meetNotes" class="form-input" style="min-height:80px; resize:vertical;" placeholder="Key discussion points, budget alignment, revisions discussed..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Action Items / Next Steps</label>
              <input type="text" id="meetActions" class="form-input" placeholder="e.g. Send revised TVC proposal by Thursday">
            </div>
            <button class="btn-primary" style="margin-top:0.5rem;" onclick="window.CRM_MODULE.submitLogMeeting()">💾 Save Meeting Log</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Render Single Client Card ──────────────────────────────────────────────
  function renderClientCard(c) {
    const initials = (c.name || 'CL').substring(0, 2).toUpperCase();
    const pocs = c.pocs && Array.isArray(c.pocs) && c.pocs.length > 0
      ? c.pocs
      : [{ name: c.contactPerson || c.contact_person || 'Lead Contact', role: 'Primary', phone: c.phone || '' }];
    
    const campaignsCount = Array.isArray(c.activeCampaigns)
      ? c.activeCampaigns.length
      : Number(c.activeCampaigns || c.active_campaigns) || 1;

    const totalSpentVal = Number(c.totalSpent || c.total_spent) || 0;

    let badgeClass = 'badge-purple';
    if ((c.status || '').toLowerCase() === 'active retainer') badgeClass = 'badge-emerald';
    else if ((c.status || '').toLowerCase() === 'onboarding') badgeClass = 'badge-amber';
    else if ((c.status || '').toLowerCase() === 'churned') badgeClass = 'badge-pink';

    return `
      <div class="card-glass" style="display:flex; flex-direction:column; gap:0.85rem; position:relative;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; gap:0.75rem; align-items:center;">
            <div style="width:42px; height:42px; border-radius:12px; background:var(--gradient-brand, linear-gradient(135deg,#7c3aed,#3b82f6)); display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0;">${initials}</div>
            <div>
              <div style="font-weight:800; color:var(--text-primary); font-size:1.05rem; line-height:1.2;">${escapeHTML(c.name)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">${escapeHTML(c.category || c.industry || 'General Industry')}</div>
            </div>
          </div>
          <span class="badge ${badgeClass}">${escapeHTML(c.status || 'Active')}</span>
        </div>

        <!-- Contact info strip -->
        <div style="font-size:0.78rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.2rem;">
          ${c.email ? `<div>📧 ${escapeHTML(c.email)}</div>` : ''}
          ${c.phone ? `<div>📞 ${escapeHTML(c.phone)}</div>` : ''}
        </div>

        <!-- Points of Contact List -->
        <div style="background:rgba(255,255,255,0.03); border-radius:10px; padding:0.65rem; display:flex; flex-direction:column; gap:0.35rem; border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:0.7rem; font-weight:800; color:var(--text-dim); text-transform:uppercase; display:flex; justify-content:space-between;">
            <span>Authorized POCs (${pocs.length})</span>
          </div>
          ${pocs.map((p, idx) => `
            <div style="font-size:0.8rem; color:var(--text-primary); display:flex; justify-content:space-between; align-items:center;">
              <div>
                👤 <strong>${escapeHTML(p.name)}</strong> <span style="color:var(--text-muted); font-size:0.72rem;">(${escapeHTML(p.role || 'Contact')})</span>
              </div>
              ${p.phone ? `<span style="font-size:0.72rem; color:var(--purple-light);">📞 ${escapeHTML(p.phone)}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Spend & Campaigns -->
        <div style="display:flex; justify-content:space-between; font-size:0.78rem; border-top:1px solid var(--border-subtle); padding-top:0.6rem; margin-top:auto;">
          <span style="color:var(--text-muted);">Total Spend: <strong style="color:var(--emerald-brand);">৳${totalSpentVal.toLocaleString()}</strong></span>
          <span style="color:var(--purple-light); font-weight:700;">${campaignsCount} Active</span>
        </div>

        <!-- Action Row -->
        <div style="display:flex; gap:0.4rem; margin-top:0.3rem;">
          <button class="btn-outline btn-sm" style="flex:1; border-radius:8px; font-size:0.75rem;" onclick="window.CRM_MODULE.openHub('${c.id}')">📂 Open Hub</button>
          <button class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.25rem 0.5rem;" title="Edit Client" onclick="window.CRM_MODULE.openEditModal('${c.id}')">✏️</button>
          <button class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.25rem 0.5rem; color:#ef4444;" title="Delete Client" onclick="window.CRM_MODULE.deleteClient('${c.id}')">🗑️</button>
        </div>
      </div>
    `;
  }

  // ─── Module Public API ───────────────────────────────────────────────────────
  window.CRM_MODULE = {
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

    setStep(step) {
      const s1 = document.getElementById('wizStep1');
      const s2 = document.getElementById('wizStep2');
      const b1 = document.getElementById('wizStepBtn1');
      const b2 = document.getElementById('wizStepBtn2');
      if (step === 1) {
        if (s1) s1.style.display = 'block';
        if (s2) s2.style.display = 'none';
        if (b1) { b1.className = 'badge badge-purple'; b1.style.color = '#fff'; }
        if (b2) { b2.className = 'badge'; b2.style.color = 'var(--text-muted)'; b2.style.background = 'transparent'; }
      } else {
        if (s1) s1.style.display = 'none';
        if (s2) s2.style.display = 'block';
        if (b2) { b2.className = 'badge badge-purple'; b2.style.color = '#fff'; }
        if (b1) { b1.className = 'badge'; b1.style.color = 'var(--text-muted)'; b1.style.background = 'transparent'; }
      }
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
      document.getElementById('crmSubmitBtn').innerText = '🚀 Complete Onboarding';

      const pocList = document.getElementById('crmPocList');
      if (pocList) {
        pocList.innerHTML = '';
        this.addPocRow('', 'Brand Lead', '');
      }

      document.getElementById('crmModal').classList.add('active');
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
      document.getElementById('crmTotalSpent').value = Number(client.totalSpent || client.total_spent) || 0;
      document.getElementById('crmSubmitBtn').innerText = '💾 Save Client Changes';

      const pocList = document.getElementById('crmPocList');
      if (pocList) {
        pocList.innerHTML = '';
        const pocs = client.pocs && client.pocs.length > 0 ? client.pocs : [{ name: client.contactPerson || '', role: 'Lead Contact', phone: client.phone || '' }];
        pocs.forEach(p => this.addPocRow(p.name, p.role, p.phone));
      }

      document.getElementById('crmModal').classList.add('active');
      this.setStep(1);
    },

    closeModal() {
      document.getElementById('crmModal').classList.remove('active');
      currentEditingClient = null;
    },

    addPocRow(name = '', role = '', phone = '') {
      const list = document.getElementById('crmPocList');
      if (!list) return;
      const div = document.createElement('div');
      div.className = 'poc-row';
      div.style.cssText = 'display:flex; gap:0.5rem;';
      div.innerHTML = `
        <input type="text" class="form-input poc-name" placeholder="Contact Name" value="${escapeHTML(name)}" style="flex:1;">
        <input type="text" class="form-input poc-role" placeholder="Role (e.g. Director)" value="${escapeHTML(role)}" style="flex:1;">
        <input type="text" class="form-input poc-phone" placeholder="Phone Number" value="${escapeHTML(phone)}" style="flex:1;">
        <button onclick="this.parentElement.remove()" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;">✕</button>
      `;
      list.appendChild(div);
    },

    async submitClient() {
      const name = document.getElementById('crmName').value.trim();
      const category = document.getElementById('crmIndustry').value.trim() || 'General';
      const email = document.getElementById('crmEmail').value.trim();
      const phone = document.getElementById('crmPhone').value.trim();
      const status = document.getElementById('crmStatus').value;
      const totalSpent = parseFloat(document.getElementById('crmTotalSpent').value) || 0;
      const pocRows = document.querySelectorAll('.poc-row');

      const pocs = [];
      pocRows.forEach((row, i) => {
        const pName = row.querySelector('.poc-name').value.trim();
        const pRole = row.querySelector('.poc-role').value.trim();
        const pPhone = row.querySelector('.poc-phone').value.trim();
        if (pName) {
          pocs.push({ name: pName, role: pRole || 'Contact', phone: pPhone, isPrimary: i === 0 });
        }
      });

      if (!name) return window.showToast && window.showToast('Please enter client name.', 'error');

      const payload = {
        name,
        category,
        email,
        phone: phone || (pocs.length > 0 ? pocs[0].phone : ''),
        contactPerson: pocs.length > 0 ? pocs[0].name : 'Lead Contact',
        status,
        totalSpent,
        pocs
      };

      try {
        if (currentEditingClient) {
          // Edit mode
          await APP_API.put(`/clients/${currentEditingClient.id}`, payload);
          window.showToast && window.showToast(`Client "${name}" updated successfully!`, 'success');
        } else {
          // Create mode
          const res = await APP_API.post('/clients', payload);
          if (res.success || res.id) {
            window.showToast && window.showToast(`Client "${name}" onboarded successfully!`, 'success');
          }
        }
        this.closeModal();
        loadCRMData();
      } catch (err) {
        window.showToast && window.showToast('Failed to save client: ' + err.message, 'error');
      }
    },

    async deleteClient(id) {
      const client = clientsData.find(c => c.id === id);
      if (window.confirm && !window.confirm(`Permanently delete client account "${client?.name || id}"? This will archive their profile.`)) return;
      try {
        await APP_API.delete(`/clients/${id}`);
        window.showToast && window.showToast('Client deleted.', 'success');
        loadCRMData();
      } catch (err) {
        window.showToast && window.showToast('Delete failed: ' + err.message, 'error');
      }
    },

    openHub: async function(clientId) {
      document.getElementById('crmHubModal').style.display = 'flex';
      document.getElementById('hubClientName').innerText = 'Loading...';
      document.getElementById('hubHealthScore').innerText = '--';
      document.getElementById('hubTimeline').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading timeline...</div>';
      document.getElementById('hubMeetingsList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading meetings...</div>';
      document.getElementById('hubPocAccessList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading POC access...</div>';

      const client = clientsData.find(c => c.id === clientId);
      if (client) {
        document.getElementById('hubClientName').innerText = client.name;
        document.getElementById('hubClientSub').innerText = `${client.category || 'Client Partner'} · Account ID: ${client.id}`;
      }

      this.currentHubClientId = clientId;
      await this.loadHubData(clientId);
    },

    closeHub: function() {
      document.getElementById('crmHubModal').style.display = 'none';
      this.currentHubClientId = null;
    },

    loadHubData: async function(clientId) {
      try {
        const client = clientsData.find(c => c.id === clientId);
        const data = await APP_API.get(`/clients/${clientId}/timeline`).catch(() => ({}));

        // Render POC Access panel
        const pocAccessEl = document.getElementById('hubPocAccessList');
        if (pocAccessEl && client) {
          const pocs = client.pocs && client.pocs.length > 0 ? client.pocs : [{ name: client.contactPerson || 'Lead Contact', role: 'Primary', phone: client.phone }];
          pocAccessEl.innerHTML = pocs.map((p, idx) => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); padding:0.6rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:0.82rem; font-weight:700; color:#fff;">👤 ${escapeHTML(p.name)} <span style="font-size:0.7rem; color:var(--text-muted);">(${escapeHTML(p.role || 'Contact')})</span></div>
                <div style="font-size:0.72rem; color:var(--purple-light);">${p.phone ? '📞 ' + escapeHTML(p.phone) : 'No phone linked'}</div>
              </div>
              ${p.phone ? `
                <button class="btn-secondary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.5rem;"
                  onclick="window.CRM_MODULE.generatePocAccess('${client.id}', '${escapeHTML(p.name)}', '${escapeHTML(p.phone)}')">
                  🔑 Grant Access
                </button>
              ` : ''}
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
              <div style="background: rgba(255,255,255,0.04); padding: 0.65rem; border-radius: 8px; border:1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.2rem;">📅 ${new Date(m.meeting_date).toLocaleDateString()}</div>
                <div style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.2rem;">${escapeHTML(m.notes || 'No notes')}</div>
                ${m.action_items ? `<div style="font-size: 0.72rem; color: #f59e0b;">🔥 Action: ${escapeHTML(m.action_items)}</div>` : ''}
              </div>
            `).join('');
          } else {
            meetingsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1rem;">No sync meetings logged.</div>';
          }
        }

        // Update Timeline
        const timelineEl = document.getElementById('hubTimeline');
        if (timelineEl) {
          if (data && data.timeline && data.timeline.length > 0) {
            timelineEl.innerHTML = data.timeline.map(t => `
              <div style="display: flex; gap: 0.75rem;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${t.color || '#3b82f6'}22; color: ${t.color || '#3b82f6'}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;">${t.icon || '📌'}</div>
                <div style="background: rgba(255,255,255,0.03); padding: 0.65rem; border-radius: 8px; flex: 1; border: 1px solid rgba(255,255,255,0.05);">
                  <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 0.15rem;">${new Date(t.date).toLocaleString()}</div>
                  <div style="font-size: 0.85rem; font-weight: bold; color: var(--text-main); margin-bottom: 0.15rem;">${escapeHTML(t.title)}</div>
                  <div style="font-size: 0.78rem; color: var(--text-dim);">${escapeHTML(t.description || '')}</div>
                </div>
              </div>
            `).join('');
          } else {
            timelineEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">No timeline activity yet.</div>';
          }
        }
      } catch (err) {
        window.showToast && window.showToast('Failed to load CRM Hub data', 'error');
      }
    },

    async generatePocAccess(clientId, name, phone) {
      try {
        const res = await APP_API.post('/auth/pin/generate', {
          phone,
          linkedId: clientId,
          linkedType: 'client',
          sendTelegram: false
        });

        if (res.success || res.pin) {
          this.showPocAccessModal(name, phone, res.pin, res.portalUrl, res.whatsappLink);
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
        <div class="modal-box" style="max-width:440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">🔑 Portal Access Generated</h3>
            <button onclick="document.getElementById('pocAccessCardModal').classList.remove('active')" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; font-size:0.88rem;">
            <div style="background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid var(--border-subtle);">
              <div style="color:var(--text-muted); font-size:0.75rem;">AUTHORIZED REPRESENTATIVE</div>
              <div style="font-weight:800; color:#fff; font-size:1.05rem;">👤 ${escapeHTML(name)}</div>
              <div style="color:var(--purple-light); font-size:0.82rem; margin-top:0.15rem;">📞 ${escapeHTML(phone)}</div>
            </div>

            <div style="background:rgba(124, 58, 237, 0.12); padding:1rem; border-radius:12px; border:1px solid var(--purple-brand); text-align:center;">
              <div style="font-size:0.75rem; color:var(--purple-light); font-weight:700; text-transform:uppercase;">Temporary 4-Digit PIN</div>
              <div style="font-size:2.2rem; font-weight:900; font-family:monospace; color:#fff; letter-spacing:0.2em; margin:0.3rem 0;">${pin}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Client will be prompted to change this on first login</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
              <a href="${whatsappLink}" target="_blank" class="btn-primary" style="text-align:center; text-decoration:none; background:linear-gradient(135deg,#059669,#10b981);">
                📲 Send Access Card via WhatsApp
              </a>
              <button class="btn-secondary" onclick="navigator.clipboard.writeText('${portalUrl}'); window.showToast('Portal URL copied to clipboard!', 'success');">
                📋 Copy Portal Direct Link
              </button>
            </div>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },

    openLogMeetingModal() {
      document.getElementById('logMeetingModal').classList.add('active');
    },
    closeLogMeetingModal() {
      document.getElementById('logMeetingModal').classList.remove('active');
    },

    async submitLogMeeting() {
      if (!this.currentHubClientId) return;
      const date = document.getElementById('meetDate')?.value;
      const notes = document.getElementById('meetNotes')?.value?.trim();
      const action_items = document.getElementById('meetActions')?.value?.trim();

      if (!date || !notes) {
        return window.showToast && window.showToast('Date and meeting summary are required.', 'error');
      }

      try {
        await APP_API.post(`/clients/${this.currentHubClientId}/meetings`, { meeting_date: date, notes, action_items });
        window.showToast && window.showToast('Meeting logged successfully!', 'success');
        this.closeLogMeetingModal();
        this.loadHubData(this.currentHubClientId);
      } catch (err) {
        window.showToast && window.showToast('Failed to log meeting', 'error');
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
          <div class="modal-content" style="max-width: 640px;">
            <div class="modal-header">
              <h3>👥 Bulk Import Clients (CSV)</h3>
              <button class="modal-close" onclick="window.CRM_MODULE.closeImportModal()">✕</button>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
              
              <!-- Guideline Box -->
              <div style="background:var(--surface-3); border:1px solid var(--border-subtle); border-radius:12px; padding:0.9rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="font-weight:800; font-size:0.82rem; color:var(--text-primary);">📋 Client CSV Column Format Guidelines</div>
                  <button type="button" class="btn-secondary" onclick="window.CRM_MODULE.downloadSampleCSV()" style="font-size:0.75rem; padding:0.35rem 0.75rem;">
                    📥 Download Sample CSV
                  </button>
                </div>
                <div class="table-responsive" style="margin-bottom:0;">
                  <table class="data-table" style="font-size:0.74rem;">
                    <thead>
                      <tr><th>Column Header</th><th>Status</th><th>Description / Example</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><code>Company Name</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Client brand / business name (e.g. <em>Chillox BD</em>)</td></tr>
                      <tr><td><code>Contact Person</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Primary POC name (e.g. <em>Arman Hossain</em>)</td></tr>
                      <tr><td><code>Phone</code></td><td><span style="color:#10b981; font-weight:700;">Recommended</span></td><td>Mobile / WhatsApp for PIN login (e.g. <em>+8801711223344</em>)</td></tr>
                      <tr><td><code>Email</code></td><td>Optional</td><td>Official email (e.g. <em>info@chillox.bd</em>)</td></tr>
                      <tr><td><code>Industry</code></td><td>Optional</td><td>Category (e.g. <em>Food & Beverage, Fashion, Retail</em>)</td></tr>
                      <tr><td><code>Monthly Retainer</code></td><td>Optional</td><td>Retainer budget in BDT (e.g. <em>150000</em>)</td></tr>
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
                  <input type="file" id="crmCsvFileInput" accept=".csv,text/csv" class="input-text" style="padding:0.6rem;" onchange="window.CRM_MODULE.handleFileSelected(event)">
                </div>

                <div id="crmImportPasteContainer" style="display:none;">
                  <textarea id="crmCsvTextInput" class="input-text" style="height:110px; font-family:monospace; font-size:0.78rem;" placeholder="Company Name,Contact Person,Phone,Email,Industry,Monthly Retainer,Status&#10;Chillox Bangladesh,Arman Hossain,+8801711223344,arman@chillox.bd,Food & Beverage,150000,Active Retainer&#10;Apex Footwear,Sabbir Rahman,+8801811556677,sabbir@apex.bd,Fashion & Retail,95000,Active Retainer" oninput="window.CRM_MODULE.handleTextPasted(event)"></textarea>
                </div>
              </div>

              <!-- Live Preview Container -->
              <div id="crmImportPreviewContainer" style="display:none; background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem;">
                <div style="font-size:0.8rem; font-weight:800; color:var(--text-primary); margin-bottom:0.4rem;" id="crmImportPreviewTitle">👁️ Live Pre-Import Preview</div>
                <div class="table-responsive" style="max-height:150px; overflow-y:auto;">
                  <table class="data-table" style="font-size:0.74rem;" id="crmImportPreviewTable">
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
      const sampleRow3 = "Aura Skincare,Tania Ahmed,+8801911998877,tania@auraskin.com,Health & Beauty,80000,Onboarding";
      
      const csvContent = csvHeader + sampleRow1 + sampleRow2 + sampleRow3;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'purpleos_clients_template.csv');
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
        const retainerValue = row['monthly retainer'] || row.retainervalue || row.retainer || row.budget || row.value || 0;
        const status = row.status || 'Active Retainer';

        if (name && name.toLowerCase() !== 'company name' && name.toLowerCase() !== 'name') {
          parsed.push({
            name,
            contactPerson,
            phone,
            email,
            industry,
            category: industry,
            retainerValue,
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
        thead.innerHTML = `<tr><th>Company</th><th>Contact POC</th><th>Phone</th><th>Industry</th><th>Retainer</th></tr>`;
      }

      if (tbody) {
        tbody.innerHTML = clients.slice(0, 3).map(c => `
          <tr>
            <td class="nowrap"><strong>${escapeHTML(c.name)}</strong></td>
            <td class="nowrap">${escapeHTML(c.contactPerson)}</td>
            <td class="nowrap" style="color:var(--text-muted);">${escapeHTML(c.phone || '—')}</td>
            <td class="truncate" style="color:var(--text-muted);">${escapeHTML(c.industry || 'General')}</td>
            <td class="nowrap">${c.retainerValue ? '৳' + Number(c.retainerValue).toLocaleString() : '—'}</td>
          </tr>
        `).join('') + (clients.length > 3 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); font-size:0.75rem;">...and ${clients.length - 3} more client accounts ready for import</td></tr>` : '');
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
        submitBtn.innerText = '⏳ Importing Clients...';
      }

      try {
        const res = await APP_API.post('/admin/import/clients', { rows: parsedImportClients });
        if (res && (res.success || res.imported || res.addedCount)) {
          this.closeImportModal();
          await loadCRMData();
          window.showToast && window.showToast(`🎉 Successfully imported ${res.addedCount || res.imported || parsedImportClients.length} clients!`, 'success');
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

  // Initial load
  container.innerHTML = `<div style="padding: 3rem; text-align: center; color: var(--text-muted);">⏳ Loading Client CRM Directory...</div>`;
  await loadCRMData();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
