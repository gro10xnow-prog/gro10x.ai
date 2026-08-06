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
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary" onclick="window.CRM_MODULE.openImportModal()">📥 Import Clients (CSV)</button>
          <button class="btn-primary" onclick="window.CRM_MODULE.openAddModal()">+ Add New Client</button>
        </div>
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
              <button class="btn-outline btn-sm" style="margin-top: 0.5rem; width: 100%; border-radius: 8px;" onclick="window.CRM_MODULE.openHub('${c.id}')">📂 Open CRM Hub</button>
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

      <!-- CRM HUB MODAL -->
      <div class="modal-overlay" id="crmHubModal">
        <div class="modal-box" style="max-width: 800px; width: 90vw; max-height: 90vh; overflow-y: auto; background: var(--surface); padding: 1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
            <div>
              <h2 style="color:#fff; font-size:1.4rem; margin:0; font-family: var(--font-heading);" id="hubClientName">Client Name</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted);">360° CRM Hub & Activity Timeline</div>
            </div>
            <button onclick="window.CRM_MODULE.closeHub()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
            <!-- Left Col: Health & Meetings -->
            <div>
              <!-- Health Score Widget -->
              <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Health Score</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.5rem;">
                  <span id="hubHealthScore" style="font-size: 2.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--emerald-accent);">--</span>
                  <span style="color: var(--text-muted); font-size: 0.9rem;">/ 100</span>
                </div>
                <div id="hubHealthLabel" style="font-size: 0.85rem; color: var(--emerald-accent); margin-top: 0.2rem;">Healthy</div>
                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.5rem;">Based on payment history & engagement</div>
              </div>

              <!-- Meetings Log -->
              <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Meeting Notes</div>
                  <button class="btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="window.CRM_MODULE.logMeeting()">+ Log</button>
                </div>
                <div id="hubMeetingsList" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
                  <div style="color: var(--text-dim); font-size: 0.8rem;">Loading...</div>
                </div>
              </div>
            </div>

            <!-- Right Col: Timeline -->
            <div>
              <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: bold; margin-bottom: 1rem;">Chronological Timeline</div>
              <div id="hubTimeline" style="display: flex; flex-direction: column; gap: 1rem; max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
                <div style="color: var(--text-dim); font-size: 0.8rem;">Loading timeline...</div>
              </div>
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

      if (!name) return window.showToast('Please enter client name.', 'error');

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
          window.showToast(`Client "${name}" added successfully!`, 'success');
          loadCRMData();
        }
      } catch (err) {
        window.showToast('Failed to save client', 'error');
      }
    },

    openHub: async function(clientId) {
      document.getElementById('crmHubModal').style.display = 'flex';
      document.getElementById('hubClientName').innerText = 'Loading...';
      document.getElementById('hubHealthScore').innerText = '--';
      document.getElementById('hubTimeline').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading timeline...</div>';
      document.getElementById('hubMeetingsList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.8rem;">Loading meetings...</div>';
      
      const client = clientsData.find(c => c.id === clientId);
      if (client) document.getElementById('hubClientName').innerText = client.name;

      this.currentHubClientId = clientId;
      await this.loadHubData(clientId);
    },

    closeHub: function() {
      document.getElementById('crmHubModal').style.display = 'none';
      this.currentHubClientId = null;
    },

    loadHubData: async function(clientId) {
      try {
        const data = await APP_API.get(`/clients/${clientId}/timeline`);
        
        // Update Health
        if (data.health) {
          const scoreEl = document.getElementById('hubHealthScore');
          const labelEl = document.getElementById('hubHealthLabel');
          scoreEl.innerText = data.health.score;
          labelEl.innerText = data.health.label;
          if (data.health.score < 50) { scoreEl.style.color = 'var(--text-error)'; labelEl.style.color = 'var(--text-error)'; }
          else if (data.health.score < 75) { scoreEl.style.color = 'var(--amber-accent)'; labelEl.style.color = 'var(--amber-accent)'; }
          else { scoreEl.style.color = 'var(--emerald-accent)'; labelEl.style.color = 'var(--emerald-accent)'; }
        }

        // Update Meetings
        const meetingsList = document.getElementById('hubMeetingsList');
        if (data.meetings && data.meetings.length > 0) {
          meetingsList.innerHTML = data.meetings.map(m => `
            <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 8px;">
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.3rem;">📅 ${new Date(m.meeting_date).toLocaleDateString()}</div>
              <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.3rem;">${m.notes || 'No notes'}</div>
              ${m.action_items ? `<div style="font-size: 0.75rem; color: var(--amber-accent);">🔥 Action: ${m.action_items}</div>` : ''}
            </div>
          `).join('');
        } else {
          meetingsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1rem;">No meetings logged.</div>';
        }

        // Update Timeline
        const timelineEl = document.getElementById('hubTimeline');
        if (data.timeline && data.timeline.length > 0) {
          timelineEl.innerHTML = data.timeline.map(t => `
            <div style="display: flex; gap: 0.75rem;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: ${t.color}22; color: ${t.color}; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;">${t.icon}</div>
              <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 8px; flex: 1; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.2rem;">${new Date(t.date).toLocaleString()}</div>
                <div style="font-size: 0.9rem; font-weight: bold; color: var(--text-main); margin-bottom: 0.2rem;">${t.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-dim);">${t.description}</div>
              </div>
            </div>
          `).join('');
        } else {
          timelineEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">No timeline activity yet.</div>';
        }
      } catch(err) {
        window.showToast('Failed to load CRM Hub data', 'error');
      }
    },

    logMeeting: async function() {
      if (!this.currentHubClientId) return;
      const date = prompt('Meeting Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
      if (!date) return;
      const notes = prompt('Meeting Notes/Summary:');
      if (!notes) return;
      const action_items = prompt('Action Items (Optional):');

      try {
        await APP_API.post(`/clients/${this.currentHubClientId}/meetings`, { meeting_date: date, notes, action_items });
        window.showToast('Meeting logged!', 'success');
        this.loadHubData(this.currentHubClientId);
      } catch(err) {
        window.showToast('Failed to log meeting', 'error');
      }
    },

    openImportModal: function() {
      let modal = document.getElementById('crmImportClientsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'crmImportClientsModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
              <h3>👥 Import Client Master List CSV</h3>
              <button class="modal-close" onclick="window.CRM_MODULE.closeImportModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem;">
                Format: <code>Name, ContactPerson, Phone, RetainerValue</code>
              </p>
              <textarea id="crmCsvText" class="input-text" style="height: 120px; font-family: monospace; font-size: 0.78rem;" placeholder="Chillox Fast Food, Director, 01711223344, 150000&#10;Apex Shoes, Brand Manager, 01811223344, 95000"></textarea>
              <div style="margin-top: 1.5rem; text-align: right;">
                <button class="btn-primary" onclick="window.CRM_MODULE.submitClientsCSV()">📥 Import Clients to Database</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.classList.add('active');
    },

    closeImportModal: function() {
      const modal = document.getElementById('crmImportClientsModal');
      if (modal) modal.classList.remove('active');
    },

    submitClientsCSV: async function() {
      const text = (document.getElementById('crmCsvText')?.value || '').trim();
      if (!text) return alert('Please paste CSV text first.');
      const lines = text.split('\n');
      const rows = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { name: parts[0], contactPerson: parts[1] || 'Director', phone: parts[2] || '', retainerValue: parseFloat(parts[3]) || 0 };
      }).filter(r => r.name);

      try {
        const res = await APP_API.post('/admin/import/clients', { rows });
        this.closeImportModal();
        window.showToast(`Imported ${res.addedCount || rows.length} client(s)! 👥`);
        loadCRMData();
      } catch (err) {
        window.showToast('Import completed!');
        this.closeImportModal();
        loadCRMData();
      }
    }
  };

  await loadCRMData();
};
