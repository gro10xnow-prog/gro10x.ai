/**
 * public/app/modules/crm.js
 * Client CRM & Multi-POC Management View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.crm = async function(container) {
  let clientsData = [];

  async function loadCRMData() {
    clientsData = await APP_API.get('/clients').catch(() => []);
    renderCRMGrid();
  }

  function renderCRMGrid() {
    const activeCount = clientsData.filter(c => (c.status || '').toLowerCase() !== 'churned').length;
    const totSpent = clientsData.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            👥 Client CRM Directory
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client accounts, multiple points of contact (POCs), and retainer status.
          </div>
        </div>
        <button class="btn-primary" onclick="window.CRM_MODULE.openAddModal()">+ Add New Client</button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Clients</div>
          <div class="kpi-val">${activeCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Retainer Spend</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${totSpent.toLocaleString()}</div>
        </div>
      </div>

      <!-- Client Cards Container -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem;">
        ${clientsData.map(c => {
          const initials = (c.name || 'CL').substring(0, 2).toUpperCase();
          const pocs = c.pocs && c.pocs.length > 0 ? c.pocs : [{ name: c.contactPerson || 'Lead Contact', role: 'Primary' }];
          
          return `
            <div class="card-glass" style="display:flex; flex-direction:column; gap:0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="width:42px; height:42px; border-radius:12px; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff;">${initials}</div>
                <span class="badge badge-purple">${c.status || 'Active'}</span>
              </div>

              <div>
                <div style="font-weight:800; color:var(--text-primary); font-size:1.1rem;">${c.name}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${c.category || c.industry || 'General Industry'}</div>
              </div>

              <div style="background:var(--surface-3); border-radius:10px; padding:0.65rem; display:flex; flex-direction:column; gap:0.35rem;">
                <div style="font-size:0.72rem; font-weight:800; color:var(--text-dim); text-transform:uppercase;">Points of Contact (${pocs.length})</div>
                ${pocs.map(p => `
                  <div style="font-size:0.82rem; color:var(--text-primary);">
                    👤 <strong>${p.name}</strong> <span style="color:var(--text-muted); font-size:0.75rem;">(${p.role || 'Contact'})</span>
                    ${p.phone ? `<span style="font-size:0.72rem; color:var(--purple-light); display:block;">📞 ${p.phone}</span>` : ''}
                  </div>
                `).join('')}
              </div>

              <div style="display:flex; justify-content:space-between; font-size:0.78rem; border-top:1px solid var(--border-subtle); padding-top:0.6rem; margin-top:auto;">
                <span style="color:var(--text-muted);">Total Spend: <strong style="color:var(--emerald-brand);">৳${(Number(c.totalSpent) || 0).toLocaleString()}</strong></span>
                <span style="color:var(--purple-light); font-weight:700;">${c.activeCampaigns || 1} Active</span>
              </div>
            </div>
          `;
        }).join('') || `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:3rem;">No client accounts found</div>`}
      </div>

      <!-- Add Client Modal -->
      <div class="modal-overlay" id="crmModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">👥 Client Onboarding Wizard</h2>
            <button onclick="window.CRM_MODULE.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <!-- Wizard Step Indicator -->
          <div style="display:flex; gap:0.5rem; margin: 1rem 0; background:var(--surface-2); padding:0.4rem; border-radius:10px;">
            <div id="wizStepBtn1" class="badge badge-purple" style="flex:1; text-align:center; cursor:pointer;" onclick="window.CRM_MODULE.setStep(1)">1. Company Info</div>
            <div id="wizStepBtn2" class="badge" style="flex:1; text-align:center; cursor:pointer; background:transparent; color:var(--text-muted);" onclick="window.CRM_MODULE.setStep(2)">2. Contacts (POCs)</div>
          </div>

          <!-- Step 1 Pane -->
          <div id="wizStep1">
            <div class="form-group">
              <label class="form-label">Client / Brand Name</label>
              <input type="text" id="crmName" class="form-input" placeholder="e.g. Chillox Bangladesh">
            </div>

            <div class="form-group">
              <label class="form-label">Industry / Category</label>
              <input type="text" id="crmIndustry" class="form-input" placeholder="e.g. Fast Food & QSR">
            </div>

            <div class="form-group">
              <label class="form-label">Retainer Status</label>
              <select id="crmStatus" class="form-select">
                <option value="Active Retainer">Active Retainer</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Project-Based">Project-Based</option>
              </select>
            </div>

            <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CRM_MODULE.setStep(2)">Next: Add Contacts ➔</button>
          </div>

          <!-- Step 2 Pane -->
          <div id="wizStep2" style="display:none;">
            <div class="form-group">
              <label class="form-label">Points of Contact (Authorized POCs)</label>
              <div id="crmPocList" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.5rem;">
                <div class="poc-row" style="display:flex; gap:0.5rem;">
                  <input type="text" class="form-input poc-name" placeholder="Name" style="flex:1;">
                  <input type="text" class="form-input poc-role" placeholder="Role (e.g. Brand Lead)" style="flex:1;">
                  <input type="text" class="form-input poc-phone" placeholder="Phone (Login)" style="flex:1;">
                </div>
              </div>
              <button class="btn-secondary btn-sm" onclick="window.CRM_MODULE.addPocRow()">+ Add Another Contact</button>
            </div>

            <div style="display:flex; gap:0.75rem; margin-top:1rem;">
              <button class="btn-secondary" style="flex:1;" onclick="window.CRM_MODULE.setStep(1)">⬅ Back</button>
              <button class="btn-primary" style="flex:1;" onclick="window.CRM_MODULE.submitClient()">🚀 Complete Onboarding</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.CRM_MODULE = {
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
      document.getElementById('crmModal').classList.add('active');
      this.setStep(1);
    },
    closeModal() {
      document.getElementById('crmModal').classList.remove('active');
    },
    addPocRow() {
      const list = document.getElementById('crmPocList');
      if (!list) return;
      const div = document.createElement('div');
      div.className = 'poc-row';
      div.style.cssText = 'display:flex; gap:0.5rem;';
      div.innerHTML = `
        <input type="text" class="form-input poc-name" placeholder="Name" style="flex:1;">
        <input type="text" class="form-input poc-role" placeholder="Role" style="flex:1;">
        <input type="text" class="form-input poc-phone" placeholder="Phone" style="flex:1;">
        <button onclick="this.parentElement.remove()" style="background:transparent; border:none; color:var(--red-brand); cursor:pointer;">✕</button>
      `;
      list.appendChild(div);
    },
    async submitClient() {
      const name = document.getElementById('crmName').value.trim();
      const category = document.getElementById('crmIndustry').value.trim() || 'General';
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

      if (!name) return alert('Please enter client name.');

      try {
        const res = await APP_API.post('/clients', {
          name,
          category,
          contactPerson: pocs.length > 0 ? pocs[0].name : 'Lead Contact',
          phone: pocs.length > 0 ? pocs[0].phone : '',
          pocs
        });

        if (res.success || res.id) {
          this.closeModal();
          showToast(`Client "${name}" added successfully!`);
          loadCRMData();
        }
      } catch (err) {
        showToast('Failed to save client', 'error');
      }
    }
  };

  await loadCRMData();
};
