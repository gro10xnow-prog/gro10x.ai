/**
 * public/app/modules/leads.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Leads CRM Pipeline Module v4.0 (Admin SPA)
 * Full Kanban board (5 stages), lead profile drawer, correct Win/Convert flow,
 * search/filter/sort, fixed follow-up date picker, fixed stage enum consistency.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.leads = async function(container) {
  const STAGES = ['New Inquiry', 'Contacted', 'Proposal Sent', 'Meeting Scheduled', 'Won / Closed'];
  const LOST_STAGES = ['Lost', 'Spam'];
  const STAGE_COLORS = {
    'New Inquiry':        { bg: '#f59e0b22', border: '#f59e0b', badge: 'badge-amber' },
    'Contacted':          { bg: '#3b82f622', border: '#3b82f6', badge: 'badge-blue' },
    'Proposal Sent':      { bg: '#06b6d422', border: '#06b6d4', badge: 'badge-info' },
    'Meeting Scheduled':  { bg: '#ec489922', border: '#ec4899', badge: 'badge-pink' },
    'Won / Closed':       { bg: '#00df8922', border: '#00df89', badge: 'badge-emerald' },
    'Lost':               { bg: '#ef444422', border: '#ef4444', badge: 'badge-pink' },
    'Spam':               { bg: '#6b728022', border: '#6b7280', badge: 'badge-muted' },
  };

  let leadsData = [];
  let searchQuery = '';
  let filterSource = 'all';
  let sortBy = 'score';
  let showLost = false;
  let selectedLead = null;
  let parsedImportLeads = [];

  // ─── Load Data ──────────────────────────────────────────────────────────────
  async function loadLeads() {
    try {
      const data = await APP_API.get('/leads').catch(() => []);
      leadsData = Array.isArray(data) ? data : [];
      render();
      populateServicesDropdown();
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:2rem;">Error loading leads: ${err.message}</div>`;
    }
  }

  async function populateServicesDropdown() {
    try {
      const services = await APP_API.get('/services').catch(() => []);
      const select = document.getElementById('nlService');
      if (select && Array.isArray(services) && services.length > 0) {
        select.innerHTML = '<option value="">Select service from catalog...</option>' + services.map(s => `
          <option value="${String(s.title).replace(/"/g, '&quot;')}">${String(s.title).replace(/</g, '&lt;')} (${String(s.price || 'Quote').replace(/</g, '&lt;')})</option>
        `).join('') + `
          <option value="Custom Project">Custom Agency Package</option>
        `;
      }
    } catch (e) {}
  }

  // ─── Filter & Sort Leads ────────────────────────────────────────────────────
  function getFilteredLeads() {
    let leads = [...leadsData];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      leads = leads.filter(l =>
        (l.company || '').toLowerCase().includes(q) ||
        (l.contact_person || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    if (filterSource !== 'all') {
      leads = leads.filter(l => (l.source || '').toLowerCase().includes(filterSource.toLowerCase()));
    }
    if (sortBy === 'score') leads.sort((a, b) => (b.score || 0) - (a.score || 0));
    else if (sortBy === 'date') leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'followup') leads.sort((a, b) => {
      if (!a.follow_up_date) return 1;
      if (!b.follow_up_date) return -1;
      return new Date(a.follow_up_date) - new Date(b.follow_up_date);
    });
    return leads;
  }

  function getLeadsByStage(stage) {
    return getFilteredLeads().filter(l => l.stage === stage || (stage === 'New Inquiry' && (!l.stage || l.stage === 'New')));
  }

  function getLostLeads() {
    return getFilteredLeads().filter(l => LOST_STAGES.includes(l.stage));
  }

  // ─── KPI Computation ────────────────────────────────────────────────────────
  function computeKPIs() {
    const active = leadsData.filter(l => !LOST_STAGES.includes(l.stage) && l.stage !== 'Won / Closed');
    const won = leadsData.filter(l => l.stage === 'Won / Closed');
    const lost = leadsData.filter(l => l.stage === 'Lost');
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    const pipelineVal = active.reduce((s, l) => {
      const v = parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return s + v;
    }, 0);
    const avgScore = active.length > 0 ? Math.round(active.reduce((s, l) => s + (l.score || 50), 0) / active.length) : 0;
    const today = new Date().toISOString().split('T')[0];
    const followUpsDue = active.filter(l => l.follow_up_date && l.follow_up_date <= today).length;
    return { activeCount: active.length, pipelineVal, winRate, avgScore, followUpsDue };
  }

  // ─── Render Main Shell ───────────────────────────────────────────────────────
  function render() {
    const kpi = computeKPIs();
    const sources = [...new Set(leadsData.map(l => l.source).filter(Boolean))];
    const lostLeads = getLostLeads();
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:900; font-family:var(--font-heading); margin:0 0 0.25rem;">🎯 Leads CRM Pipeline</h1>
          <div style="font-size:0.85rem; color:var(--text-muted);">Full sales funnel — capture, qualify, convert, and activate clients.</div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary" style="font-size:0.8rem;" onclick="window.LEADS_MODULE.openImportModal()">📥 Bulk Import CSV</button>
          <button class="btn-primary" style="font-size:0.8rem;" onclick="window.LEADS_MODULE.openAddModal()">+ Add Lead</button>
        </div>
      </div>

      <!-- KPI Strip -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(155px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Pipeline</div>
          <div class="kpi-val">${kpi.activeCount}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Open Leads</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pipeline Value</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">৳${kpi.pipelineVal.toLocaleString()}</div>
          <div style="font-size:0.72rem; color:#10b981;">Estimated Deal Pool</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Win Rate</div>
          <div class="kpi-val" style="color:var(--purple-light);">${kpi.winRate}%</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Won vs Lost</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Avg Lead Score</div>
          <div class="kpi-val" style="color:${kpi.avgScore >= 70 ? '#10b981' : kpi.avgScore >= 40 ? '#f59e0b' : '#ef4444'};">${kpi.avgScore}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">/ 100</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Follow-Ups Due</div>
          <div class="kpi-val" style="color:${kpi.followUpsDue > 0 ? '#f59e0b' : 'var(--text-main)'};">${kpi.followUpsDue}</div>
          <div style="font-size:0.72rem; color:${kpi.followUpsDue > 0 ? '#f59e0b' : 'var(--text-muted)'};">⏰ Overdue / Today</div>
        </div>
      </div>

      <!-- Search & Filter Controls -->
      <div style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; align-items:center;">
        <input
          type="text"
          class="input-text"
          placeholder="🔍 Search leads by company or contact..."
          style="flex:1; min-width:220px;"
          value="${searchQuery}"
          oninput="window.LEADS_MODULE.setSearch(this.value)"
        >
        <select class="input-text" style="width:auto;" onchange="window.LEADS_MODULE.setFilter(this.value)">
          <option value="all" ${filterSource === 'all' ? 'selected' : ''}>All Sources</option>
          ${sources.map(s => `<option value="${escapeHTML(s)}" ${filterSource === s ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('')}
        </select>
        <select class="input-text" style="width:auto;" onchange="window.LEADS_MODULE.setSort(this.value)">
          <option value="score" ${sortBy === 'score' ? 'selected' : ''}>Sort: By Score ↓</option>
          <option value="date" ${sortBy === 'date' ? 'selected' : ''}>Sort: Newest First</option>
          <option value="followup" ${sortBy === 'followup' ? 'selected' : ''}>Sort: Follow-Up Due</option>
        </select>
      </div>

      <!-- Kanban Board -->
      <div style="display:grid; grid-template-columns:repeat(5, minmax(220px, 1fr)); gap:1rem; overflow-x:auto; padding-bottom:1rem; margin-bottom:1.5rem;">
        ${STAGES.map(stage => renderColumn(stage)).join('')}
      </div>

      <!-- Lost / Spam Archive (Collapsed) -->
      <div style="margin-bottom:1.5rem;">
        <button class="btn-ghost" style="font-size:0.8rem; color:var(--text-muted);" onclick="window.LEADS_MODULE.toggleLost()">
          ${showLost ? '▼' : '▶'} 🗄️ Lost & Spam Archive (${lostLeads.length} leads)
        </button>
        ${showLost ? `
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:0.85rem; margin-top:0.75rem; opacity:0.7;">
            ${lostLeads.map(l => renderCard(l, true)).join('') || '<div style="color:var(--text-muted); padding:1rem;">No lost/spam leads.</div>'}
          </div>
        ` : ''}
      </div>

      <!-- Lead Profile Drawer -->
      <div id="leadProfileDrawer" style="display:none; position:fixed; top:0; right:0; bottom:0; width:540px; max-width:92vw; background:var(--surface-1); border-left:1px solid var(--border-subtle); z-index:9999; box-shadow:-12px 0 40px rgba(0,0,0,0.6); overflow-y:auto;">
        <div id="leadDrawerContent" style="padding:1.5rem;">Loading...</div>
      </div>
      <div id="leadDrawerBackdrop" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9998;" onclick="window.LEADS_MODULE.closeDrawer()"></div>

      <!-- Add Lead Modal -->
      <div id="addLeadModal" class="modal-overlay">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h3>🎯 Add New Lead</h3>
            <button class="modal-close" onclick="window.LEADS_MODULE.closeAddModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:0.85rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label>Company / Brand Name *</label>
                <input type="text" id="nlCompany" class="input-text" placeholder="e.g. Chillox Bangladesh">
              </div>
              <div class="form-group">
                <label>Contact Person *</label>
                <input type="text" id="nlContact" class="input-text" placeholder="e.g. Arman Hossain">
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="nlEmail" class="input-text" placeholder="email@brand.com">
              </div>
              <div class="form-group">
                <label>Phone / WhatsApp</label>
                <input type="text" id="nlPhone" class="input-text" placeholder="+8801700000000">
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label>Service Interested In</label>
                <select id="nlService" class="input-text">
                  <option value="">Select service...</option>
                  <option>Social Media Retainer</option>
                  <option>Video Production & TVC</option>
                  <option>Branding & Identity</option>
                  <option>Web Development</option>
                  <option>Digital Marketing & Ads</option>
                  <option>Content Production</option>
                  <option>Full Agency Package</option>
                </select>
              </div>
              <div class="form-group">
                <label>Budget (BDT)</label>
                <input type="number" id="nlBudget" class="input-text" placeholder="150000">
              </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
              <div class="form-group">
                <label>Lead Source</label>
                <select id="nlSource" class="input-text">
                  <option value="Manual Entry">Manual Entry</option>
                  <option value="Referral / Partner">Referral / Partner</option>
                  <option value="Event / Network">Event / Network</option>
                  <option value="Outbound / Cold Email">Outbound / Cold Email</option>
                  <option value="Landing Page Contact Section Form">Landing Page Form</option>
                </select>
              </div>
              <div class="form-group">
                <label>Starting Stage</label>
                <select id="nlStage" class="input-text">
                  ${STAGES.slice(0, 4).map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Initial Notes</label>
              <textarea id="nlNotes" class="input-text" style="min-height:70px; resize:vertical;" placeholder="Context, referral source, timeline, special requirements..."></textarea>
            </div>
            <div style="text-align:right; margin-top:0.5rem;">
              <button class="btn-primary" onclick="window.LEADS_MODULE.submitAddLead()">🚀 Add Lead to Pipeline</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Import Leads Modal -->
      <div id="importLeadsModal" class="modal-overlay">
        <div class="modal-content" style="max-width:620px;">
          <div class="modal-header">
            <h3>📥 Bulk Import Leads (CSV)</h3>
            <button class="modal-close" onclick="window.LEADS_MODULE.closeImportModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
            
            <!-- Guideline Box -->
            <div style="background:var(--surface-3); border:1px solid var(--border-subtle); border-radius:12px; padding:0.9rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
                <div style="font-weight:800; font-size:0.82rem; color:var(--text-primary);">📋 CSV Column Format Guidelines</div>
                <button type="button" class="btn-secondary" onclick="window.LEADS_MODULE.downloadSampleCSV()" style="font-size:0.75rem; padding:0.35rem 0.75rem;">
                  📥 Download Sample CSV
                </button>
              </div>
              <div class="table-responsive" style="margin-bottom:0;">
                <table class="data-table" style="font-size:0.74rem;">
                  <thead>
                    <tr><th>Column Header</th><th>Status</th><th>Description / Example</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>Company</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Company / Brand Name (e.g. <em>Chillox BD</em>)</td></tr>
                    <tr><td><code>Contact Person</code></td><td><span style="color:#ef4444; font-weight:700;">Required</span></td><td>Primary lead contact (e.g. <em>Arman Hossain</em>)</td></tr>
                    <tr><td><code>Phone</code></td><td><span style="color:#10b981; font-weight:700;">Recommended</span></td><td>Mobile / WhatsApp (e.g. <em>+8801711223344</em>)</td></tr>
                    <tr><td><code>Email</code></td><td>Optional</td><td>Contact email (e.g. <em>arman@chillox.bd</em>)</td></tr>
                    <tr><td><code>Service</code></td><td>Optional</td><td>Service category (e.g. <em>Commercial Video & TVC</em>)</td></tr>
                    <tr><td><code>Budget</code></td><td>Optional</td><td>Estimated deal value in BDT (e.g. <em>150000</em>)</td></tr>
                    <tr><td><code>Source</code></td><td>Optional</td><td>Lead origin (e.g. <em>Outbound Campaign</em>)</td></tr>
                    <tr><td><code>Notes</code></td><td>Optional</td><td>Context, briefing, timeline requirements</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Upload / Paste Mode Switcher -->
            <div>
              <div style="display:flex; gap:0.5rem; margin-bottom:0.6rem;">
                <button type="button" id="importTabFileBtn" class="btn-secondary" style="font-size:0.78rem; padding:0.4rem 0.85rem;" onclick="window.LEADS_MODULE.switchImportTab('file')">📂 Upload CSV File</button>
                <button type="button" id="importTabPasteBtn" class="btn-ghost" style="font-size:0.78rem; padding:0.4rem 0.85rem;" onclick="window.LEADS_MODULE.switchImportTab('paste')">📋 Paste Raw CSV Text</button>
              </div>

              <div id="importFileContainer">
                <input type="file" id="leadCsvFileInput" accept=".csv,text/csv" class="input-text" style="padding:0.6rem;" onchange="window.LEADS_MODULE.handleFileSelected(event)">
              </div>

              <div id="importPasteContainer" style="display:none;">
                <textarea id="leadCsvTextInput" class="input-text" style="height:110px; font-family:monospace; font-size:0.78rem;" placeholder="Company,Contact Person,Email,Phone,Service,Budget,Source,Notes&#10;Chillox Fast Food,Arman Hossain,arman@chillox.bd,+8801711223344,Commercial TVC,150000,Outbound,Winter campaign&#10;Aura Skincare,Tania Ahmed,tania@auraskin.com,+8801811556677,Social Retainer,80000,Referral,15 monthly reels" oninput="window.LEADS_MODULE.handleTextPasted(event)"></textarea>
              </div>
            </div>

            <!-- Live Preview Container -->
            <div id="importPreviewContainer" style="display:none; background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.8rem; font-weight:800; color:var(--text-primary); margin-bottom:0.4rem;" id="importPreviewTitle">👁️ Live Pre-Import Preview</div>
              <div class="table-responsive" style="max-height:150px; overflow-y:auto;">
                <table class="data-table" style="font-size:0.74rem;" id="importPreviewTable">
                  <thead id="importPreviewThead"></thead>
                  <tbody id="importPreviewTbody"></tbody>
                </table>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.25rem;">
              <button type="button" class="btn-secondary" onclick="window.LEADS_MODULE.closeImportModal()">Cancel</button>
              <button type="button" id="submitImportLeadsBtn" class="btn-primary" disabled onclick="window.LEADS_MODULE.executeImport()">🚀 Import Leads to Pipeline</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Render Kanban Column ────────────────────────────────────────────────────
  function renderColumn(stage) {
    const color = STAGE_COLORS[stage] || STAGE_COLORS['New Inquiry'];
    const leads = getLeadsByStage(stage);
    return `
      <div style="background:rgba(255,255,255,0.025); border:1px solid var(--border-subtle); border-radius:14px; overflow:hidden; min-height:200px;">
        <!-- Column Header -->
        <div style="background:${color.bg}; border-bottom:2px solid ${color.border}; padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.82rem; font-weight:800; color:${color.border}; text-transform:uppercase; letter-spacing:0.06em;">${stage}</div>
          <div style="background:${color.border}22; color:${color.border}; font-weight:800; font-size:0.75rem; padding:0.15rem 0.5rem; border-radius:999px;">${leads.length}</div>
        </div>
        <!-- Cards -->
        <div style="display:flex; flex-direction:column; gap:0.6rem; padding:0.75rem;">
          ${leads.map(l => renderCard(l, false)).join('')}
          ${leads.length === 0 ? `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.78rem;">No leads here</div>` : ''}
        </div>
      </div>
    `;
  }

  // ─── Render Lead Card ────────────────────────────────────────────────────────
  function renderCard(lead, isLost) {
    const score = lead.score || 50;
    const scoreColor = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const today = new Date().toISOString().split('T')[0];
    const followUpOverdue = lead.follow_up_date && lead.follow_up_date < today;
    const followUpToday = lead.follow_up_date && lead.follow_up_date === today;
    const daysOld = lead.created_at ? Math.floor((Date.now() - new Date(lead.created_at)) / 86400000) : 0;

    // Determine next stage button
    const stageIdx = STAGES.indexOf(lead.stage);
    const nextStage = stageIdx >= 0 && stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;
    const nextStageLabels = {
      'Contacted': '📞 Mark Contacted',
      'Proposal Sent': '📄 Proposal Sent',
      'Meeting Scheduled': '📅 Meeting Set',
      'Won / Closed': '🏆 Won — Convert'
    };

    return `
      <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; cursor:pointer;"
           onclick="window.LEADS_MODULE.openDrawer('${lead.id}')">
        <!-- Score + Age -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <span style="font-size:0.7rem; font-weight:800; color:${scoreColor}; background:${scoreColor}18; padding:0.15rem 0.4rem; border-radius:4px;">🔥 ${score}</span>
          <span style="font-size:0.68rem; color:var(--text-muted);">${daysOld}d old</span>
        </div>

        <!-- Company -->
        <div style="font-weight:800; font-size:0.88rem; color:var(--text-main); margin-bottom:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(lead.company || 'Unknown Brand')}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.35rem;">👤 ${escapeHTML(lead.contact_person || 'N/A')}</div>

        <!-- Service + Source tags -->
        <div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:0.5rem;">
          ${lead.service || lead.service_interest ? `<span style="font-size:0.66rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.1rem 0.35rem; border-radius:4px; font-weight:700;">${escapeHTML(lead.service || lead.service_interest)}</span>` : ''}
          ${lead.source ? `<span style="font-size:0.66rem; background:rgba(255,255,255,0.06); color:var(--text-muted); padding:0.1rem 0.35rem; border-radius:4px;">${escapeHTML(lead.source.split(' ')[0])}</span>` : ''}
          ${(lead.phone || lead.whatsapp) ? `
            <a href="https://wa.me/${String(lead.phone || lead.whatsapp).replace(/[^0-9]/g, '')}" target="_blank" onclick="event.stopPropagation()" style="font-size:0.66rem; background:rgba(16,185,129,0.2); color:#34d399; padding:0.1rem 0.35rem; border-radius:4px; font-weight:700; text-decoration:none;">
              💬 WhatsApp
            </a>
          ` : ''}
        </div>

        <!-- Follow-up alert -->
        ${lead.follow_up_date ? `
          <div style="font-size:0.7rem; font-weight:700; color:${followUpOverdue ? '#ef4444' : followUpToday ? '#f59e0b' : '#10b981'}; margin-bottom:0.4rem;">
            ⏰ ${followUpOverdue ? 'OVERDUE: ' : followUpToday ? 'TODAY: ' : ''}Follow-up ${lead.follow_up_date}
          </div>
        ` : ''}

        <!-- Quick Action Buttons -->
        ${!isLost ? `
          <div style="display:flex; gap:0.3rem; margin-top:0.4rem;" onclick="event.stopPropagation()">
            ${nextStage && nextStage !== 'Won / Closed' ? `
              <button class="btn-primary btn-sm" style="flex:1; font-size:0.68rem; padding:0.25rem 0.4rem;"
                onclick="window.LEADS_MODULE.advanceStage('${lead.id}', '${nextStage}')">
                ${nextStageLabels[nextStage] || `→ ${nextStage}`}
              </button>
            ` : ''}
            ${nextStage === 'Won / Closed' ? `
              <button class="btn-primary btn-sm" style="flex:1; font-size:0.68rem; padding:0.25rem 0.4rem; background:linear-gradient(135deg,#10b981,#059669);"
                onclick="window.LEADS_MODULE.convertLead('${lead.id}')">
                🏆 Convert to Client
              </button>
            ` : ''}
            <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.25rem 0.4rem;"
              title="Open full profile"
              onclick="window.LEADS_MODULE.openDrawer('${lead.id}')">
              👁️
            </button>
          </div>
        ` : `
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.4rem;">Archived</div>
        `}
      </div>
    `;
  }

  // ─── Lead Profile Drawer ─────────────────────────────────────────────────────
  function renderDrawer(lead) {
    const score = lead.score || 50;
    const scoreColor = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const stageColor = STAGE_COLORS[lead.stage] || STAGE_COLORS['New Inquiry'];
    const today = new Date().toISOString().split('T')[0];

    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:1rem;">
        <div>
          <h2 style="font-size:1.25rem; font-weight:900; margin:0 0 0.25rem; color:var(--text-main);">${escapeHTML(lead.company || 'Unknown Brand')}</h2>
          <div style="font-size:0.8rem; color:var(--text-muted);">Lead ID: <strong>${lead.id}</strong></div>
        </div>
        <button class="btn-ghost" onclick="window.LEADS_MODULE.closeDrawer()" style="font-size:1.3rem; padding:0.25rem;">✕</button>
      </div>

      <!-- Stage + Score Header -->
      <div style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap;">
        <span style="background:${stageColor.bg}; border:1px solid ${stageColor.border}; color:${stageColor.border}; font-weight:800; font-size:0.78rem; padding:0.3rem 0.75rem; border-radius:999px;">${escapeHTML(lead.stage || 'New Inquiry')}</span>
        <span style="background:${scoreColor}18; color:${scoreColor}; font-weight:800; font-size:0.78rem; padding:0.3rem 0.75rem; border-radius:999px;">🔥 Score: ${score} / 100</span>
        <span style="background:rgba(255,255,255,0.05); color:var(--text-muted); font-size:0.75rem; padding:0.3rem 0.75rem; border-radius:999px;">📅 ${lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</span>
      </div>

      <!-- Contact Details -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.72rem; font-weight:800; color:var(--pink-brand); text-transform:uppercase; margin-bottom:0.6rem;">Contact Details</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; font-size:0.83rem;">
          <div><strong>Contact:</strong> ${escapeHTML(lead.contact_person || 'N/A')}</div>
          <div><strong>Phone:</strong> ${escapeHTML(lead.phone || lead.whatsapp || 'N/A')}</div>
          <div><strong>Email:</strong> ${escapeHTML(lead.email || 'N/A')}</div>
          <div><strong>Service:</strong> ${escapeHTML(lead.service || 'N/A')}</div>
          <div><strong>Budget:</strong> ${lead.value ? '৳' + parseFloat(String(lead.value).replace(/[^0-9.]/g, '')).toLocaleString() : 'Not specified'}</div>
          <div><strong>Source:</strong> ${escapeHTML(lead.source || 'N/A')}</div>
          ${lead.utm_source ? `<div style="grid-column:1/-1;"><strong>UTM Source:</strong> ${escapeHTML(lead.utm_source)} / ${escapeHTML(lead.utm_medium || '')} / ${escapeHTML(lead.utm_campaign || '')}</div>` : ''}
        </div>
      </div>

      <!-- Follow-Up Date -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.72rem; font-weight:800; color:#f59e0b; text-transform:uppercase; margin-bottom:0.6rem;">⏰ Follow-Up Reminder</div>
        <div style="display:flex; gap:0.75rem; align-items:center;">
          <input type="date" id="drawerFollowUpDate" class="input-text" style="flex:1;" value="${lead.follow_up_date || ''}" min="${today}">
          <button class="btn-secondary" style="font-size:0.8rem; white-space:nowrap;" onclick="window.LEADS_MODULE.saveFollowUp('${lead.id}')">💾 Save Date</button>
        </div>
      </div>

      <!-- Stage Progression Panel -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.72rem; font-weight:800; color:var(--purple-light); text-transform:uppercase; margin-bottom:0.6rem;">Stage Progression</div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          ${STAGES.filter(s => s !== lead.stage).map(s => `
            <button class="btn-secondary btn-sm" style="font-size:0.74rem;" onclick="window.LEADS_MODULE.advanceStage('${lead.id}', '${s}', true)">
              → ${s}
            </button>
          `).join('')}
          <button class="btn-ghost btn-sm" style="font-size:0.74rem; color:#ef4444;" onclick="window.LEADS_MODULE.advanceStage('${lead.id}', 'Lost', true)">🗑️ Mark Lost</button>
          <button class="btn-ghost btn-sm" style="font-size:0.74rem; color:#6b7280;" onclick="window.LEADS_MODULE.advanceStage('${lead.id}', 'Spam', true)">🚫 Spam</button>
        </div>
      </div>

      <!-- Internal Notes -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.72rem; font-weight:800; color:#10b981; text-transform:uppercase; margin-bottom:0.6rem;">📝 Internal Notes</div>
        <textarea id="drawerNotes" class="input-text" style="width:100%; min-height:90px; resize:vertical; font-size:0.82rem; box-sizing:border-box;" placeholder="Add notes about this lead...">${escapeHTML(lead.notes || '')}</textarea>
        <div style="text-align:right; margin-top:0.5rem;">
          <button class="btn-secondary btn-sm" style="font-size:0.78rem;" onclick="window.LEADS_MODULE.saveNotes('${lead.id}')">💾 Save Notes</button>
        </div>
      </div>

      <!-- Primary Action Panel -->
      <div style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.08)); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:1rem; margin-bottom:1rem;">
        <div style="font-size:0.72rem; font-weight:800; color:#10b981; text-transform:uppercase; margin-bottom:0.75rem;">🚀 Client Conversion Actions</div>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <button class="btn-primary" style="text-align:left; padding:0.65rem 1rem; background:linear-gradient(135deg,#10b981,#059669);"
            onclick="window.LEADS_MODULE.convertLead('${lead.id}', '${escapeHTML(lead.company || '')}', '${escapeHTML(lead.email || '')}', this)">
            🏆 Convert Lead → Create Client CRM Account
          </button>
          <button class="btn-secondary" style="text-align:left; padding:0.65rem 1rem;"
            onclick="window.LEADS_MODULE.sendOnboardingEmail('${lead.id}')">
            📧 Send Client Onboarding Email (Magic Link)
          </button>
        </div>
        <div id="conversionResult" style="margin-top:0.75rem; font-size:0.8rem;"></div>
      </div>

      <!-- Danger Zone -->
      <div style="text-align:right;">
        <button class="btn-ghost" style="font-size:0.75rem; color:#ef4444;" onclick="window.LEADS_MODULE.deleteLead('${lead.id}')">🗑️ Delete Lead</button>
      </div>
    `;
  }

  // ─── Module Namespace ────────────────────────────────────────────────────────
  window.LEADS_MODULE = {
    setSearch(val) {
      searchQuery = val;
      render();
    },
    setFilter(val) {
      filterSource = val;
      render();
    },
    setSort(val) {
      sortBy = val;
      render();
    },
    toggleLost() {
      showLost = !showLost;
      render();
    },

    openDrawer(id) {
      selectedLead = leadsData.find(l => l.id === id);
      if (!selectedLead) return;
      const drawer = document.getElementById('leadProfileDrawer');
      const backdrop = document.getElementById('leadDrawerBackdrop');
      const content = document.getElementById('leadDrawerContent');
      if (!drawer || !content) return;
      content.innerHTML = renderDrawer(selectedLead);
      drawer.style.display = 'block';
      if (backdrop) backdrop.style.display = 'block';
    },

    closeDrawer() {
      const drawer = document.getElementById('leadProfileDrawer');
      const backdrop = document.getElementById('leadDrawerBackdrop');
      if (drawer) drawer.style.display = 'none';
      if (backdrop) backdrop.style.display = 'none';
      selectedLead = null;
    },

    openAddModal() {
      document.getElementById('addLeadModal').classList.add('active');
    },
    closeAddModal() {
      document.getElementById('addLeadModal').classList.remove('active');
    },

    async advanceStage(id, stage, fromDrawer = false) {
      try {
        await APP_API.put(`/leads/${id}`, { stage });
        const lead = leadsData.find(l => l.id === id);
        if (lead) lead.stage = stage;
        if (fromDrawer && selectedLead && selectedLead.id === id) {
          selectedLead.stage = stage;
          document.getElementById('leadDrawerContent').innerHTML = renderDrawer(selectedLead);
        }
        render();
        window.showToast && window.showToast(`Stage updated → ${stage}`, 'success');
      } catch (err) {
        window.showToast && window.showToast('Failed to update stage: ' + err.message, 'error');
      }
    },

    async convertLead(id, company, email, btnEl) {
      if (!confirm(`Convert lead "${company || id}" into an active Client CRM account? This will mark the lead as Won and create a client record.`)) return;
      if (btnEl) { btnEl.disabled = true; btnEl.innerText = '⏳ Converting...'; }
      try {
        const result = await APP_API.post(`/leads/${id}/convert`, {});
        const lead = leadsData.find(l => l.id === id);
        if (lead) lead.stage = 'Won / Closed';

        const resultEl = document.getElementById('conversionResult');
        if (resultEl && result.client) {
          resultEl.innerHTML = `
            <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.75rem;">
              ✅ <strong>Client Created:</strong> ${escapeHTML(result.client.name || company)} · ID: <strong>${result.client.id}</strong>
              <br><a href="#crm" onclick="window.LEADS_MODULE.closeDrawer()" style="color:#10b981; font-weight:700; text-decoration:none; font-size:0.8rem; margin-top:0.3rem; display:inline-block;">👥 Open CRM Hub →</a>
            </div>
          `;
        }

        render();
        window.showToast && window.showToast('🏆 Lead converted to Client! CRM account created.', 'success');
      } catch (err) {
        if (btnEl) { btnEl.disabled = false; btnEl.innerText = '🚀 Convert to Client CRM Account'; }
        window.showToast && window.showToast('Conversion failed: ' + err.message, 'error');
      }
    },

    async sendOnboardingEmail(id) {
      try {
        const result = await APP_API.post(`/leads/${id}/onboard`, {});
        const resultEl = document.getElementById('conversionResult');
        if (resultEl) {
          resultEl.innerHTML = `
            <div style="background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.3); border-radius:8px; padding:0.75rem; font-size:0.8rem;">
              📧 <strong>Email ${result.emailSent ? 'Sent' : 'Generated'}!</strong><br>
              Client: <strong>${escapeHTML(result.clientName)}</strong> · ${escapeHTML(result.email)}<br>
              <span style="color:var(--text-muted); word-break:break-all;">Magic Link: ${escapeHTML(result.magicLink)}</span>
            </div>
          `;
        }
        window.showToast && window.showToast(result.emailSent ? '📧 Onboarding email sent!' : '🔗 Magic link generated', 'success');
      } catch (err) {
        window.showToast && window.showToast('Onboarding failed: ' + err.message, 'error');
      }
    },

    async saveFollowUp(id) {
      const dateVal = document.getElementById('drawerFollowUpDate')?.value;
      if (!dateVal) return;
      try {
        await APP_API.put(`/leads/${id}`, { follow_up_date: dateVal });
        const lead = leadsData.find(l => l.id === id);
        if (lead) lead.follow_up_date = dateVal;
        render();
        window.showToast && window.showToast(`Follow-up set for ${dateVal}`, 'success');
      } catch (err) {
        window.showToast && window.showToast('Failed to set follow-up', 'error');
      }
    },

    async saveNotes(id) {
      const notes = document.getElementById('drawerNotes')?.value || '';
      try {
        await APP_API.put(`/leads/${id}`, { notes });
        const lead = leadsData.find(l => l.id === id);
        if (lead) lead.notes = notes;
        window.showToast && window.showToast('Notes saved!', 'success');
      } catch (err) {
        window.showToast && window.showToast('Failed to save notes', 'error');
      }
    },

    async deleteLead(id) {
      if (!confirm('Permanently delete this lead? This cannot be undone.')) return;
      try {
        await APP_API.delete(`/leads/${id}`);
        leadsData = leadsData.filter(l => l.id !== id);
        this.closeDrawer();
        render();
        window.showToast && window.showToast('Lead deleted.', 'success');
      } catch (err) {
        window.showToast && window.showToast('Delete failed: ' + err.message, 'error');
      }
    },

    async submitAddLead() {
      const company = document.getElementById('nlCompany')?.value?.trim();
      const contact = document.getElementById('nlContact')?.value?.trim();
      if (!company || !contact) return window.showToast && window.showToast('Company and contact name are required.', 'error');

      const payload = {
        company,
        contactPerson: contact,
        email: document.getElementById('nlEmail')?.value?.trim() || '',
        phone: document.getElementById('nlPhone')?.value?.trim() || '',
        service: document.getElementById('nlService')?.value || 'General',
        value: document.getElementById('nlBudget')?.value || '',
        source: document.getElementById('nlSource')?.value || 'Manual Entry',
        stage: document.getElementById('nlStage')?.value || 'New Inquiry',
        notes: document.getElementById('nlNotes')?.value?.trim() || ''
      };

      try {
        const result = await APP_API.post('/leads', payload);
        if (result.success || result.lead) {
          this.closeAddModal();
          await loadLeads();
          window.showToast && window.showToast('✅ Lead added to pipeline!', 'success');
        } else {
          window.showToast && window.showToast('Failed to add lead.', 'error');
        }
      } catch (err) {
        window.showToast && window.showToast('Error: ' + err.message, 'error');
      }
    },

    openImportModal() {
      parsedImportLeads = [];
      const modal = document.getElementById('importLeadsModal');
      if (modal) {
        modal.classList.add('active');
        const fileInput = document.getElementById('leadCsvFileInput');
        const textInput = document.getElementById('leadCsvTextInput');
        const previewCont = document.getElementById('importPreviewContainer');
        const submitBtn = document.getElementById('submitImportLeadsBtn');
        if (fileInput) fileInput.value = '';
        if (textInput) textInput.value = '';
        if (previewCont) previewCont.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = '🚀 Import Leads to Pipeline';
        }
        this.switchImportTab('file');
      }
    },

    closeImportModal() {
      const modal = document.getElementById('importLeadsModal');
      if (modal) modal.classList.remove('active');
      parsedImportLeads = [];
    },

    downloadSampleCSV() {
      const csvHeader = "Company,Contact Person,Email,Phone,Service,Budget,Source,Notes\n";
      const sampleRow1 = "Chillox Fast Food,Arman Hossain,arman@chillox.bd,+8801711223344,Commercial Video & TVC,150000,Outbound Campaign,Interested in winter TVC shoot\n";
      const sampleRow2 = "Aura Skincare,Tania Ahmed,tania@auraskin.com,+8801811556677,Social Media Retainer,80000,Referral,Looking for 15 monthly short reels\n";
      const sampleRow3 = "Apex Footwear,Sabbir Rahman,sabbir@apex.bd,+8801911998877,Branding & Identity,200000,Event / Network,360 brand redesign";
      
      const csvContent = csvHeader + sampleRow1 + sampleRow2 + sampleRow3;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'purpleos_leads_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.showToast && window.showToast('📥 Downloaded sample CSV template!', 'success');
    },

    switchImportTab(tab) {
      const fileBtn = document.getElementById('importTabFileBtn');
      const pasteBtn = document.getElementById('importTabPasteBtn');
      const fileCont = document.getElementById('importFileContainer');
      const pasteCont = document.getElementById('importPasteContainer');

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
        // Handle basic quoted commas or standard comma split
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          if (cols[idx] !== undefined) row[h] = cols[idx];
        });

        const company = row.company || row['company name'] || row.client || row['brand name'] || row.brand || '';
        const contactPerson = row['contact person'] || row.contact || row.name || row['person'] || '';
        const email = row.email || row['contact email'] || row.mail || '';
        const phone = row.phone || row.mobile || row.whatsapp || row['cell'] || row['phone number'] || '';
        const service = row.service || row['service interested in'] || row.package || 'General';
        const value = row.budget || row.value || row.amount || row.price || '';
        const source = row.source || row['lead source'] || 'Bulk Import';
        const notes = row.notes || row.note || row.comment || row.description || '';

        if (company || contactPerson || phone || email) {
          parsed.push({
            company: company || contactPerson || 'New Lead',
            contactPerson: contactPerson || company || 'Contact',
            email,
            phone,
            service,
            value,
            source,
            notes
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
        parsedImportLeads = window.LEADS_MODULE.parseCSVText(text);
        window.LEADS_MODULE.renderPreview(parsedImportLeads);
      };
      reader.readAsText(file);
    },

    handleTextPasted(e) {
      const text = e.target.value;
      parsedImportLeads = window.LEADS_MODULE.parseCSVText(text);
      window.LEADS_MODULE.renderPreview(parsedImportLeads);
    },

    renderPreview(leads) {
      const previewCont = document.getElementById('importPreviewContainer');
      const thead = document.getElementById('importPreviewThead');
      const tbody = document.getElementById('importPreviewTbody');
      const title = document.getElementById('importPreviewTitle');
      const submitBtn = document.getElementById('submitImportLeadsBtn');

      if (!leads || leads.length === 0) {
        if (previewCont) previewCont.style.display = 'none';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      if (previewCont) previewCont.style.display = 'block';
      if (title) title.innerHTML = `👁️ Live Pre-Import Preview <span class="badge badge-emerald" style="margin-left:0.5rem;">${leads.length} leads detected</span>`;

      if (thead) {
        thead.innerHTML = `<tr><th>Company</th><th>Contact</th><th>Phone</th><th>Service</th><th>Budget</th></tr>`;
      }

      if (tbody) {
        tbody.innerHTML = leads.slice(0, 3).map(l => `
          <tr>
            <td class="nowrap"><strong>${escapeHTML(l.company)}</strong></td>
            <td class="nowrap">${escapeHTML(l.contactPerson)}</td>
            <td class="nowrap" style="color:var(--text-muted);">${escapeHTML(l.phone || '—')}</td>
            <td class="truncate" style="color:var(--text-muted);">${escapeHTML(l.service || 'General')}</td>
            <td class="nowrap">${l.value ? '৳' + escapeHTML(l.value) : '—'}</td>
          </tr>
        `).join('') + (leads.length > 3 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); font-size:0.75rem;">...and ${leads.length - 3} more leads ready for import</td></tr>` : '');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = `🚀 Import ${leads.length} Leads to Pipeline`;
      }
    },

    async executeImport() {
      if (!parsedImportLeads || parsedImportLeads.length === 0) {
        return window.showToast && window.showToast('Please select a valid CSV file or paste lead data first.', 'error');
      }

      const submitBtn = document.getElementById('submitImportLeadsBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Importing Leads...';
      }

      try {
        const res = await APP_API.post('/leads/bulk', { leads: parsedImportLeads });
        if (res.success) {
          this.closeImportModal();
          await loadLeads();
          window.showToast && window.showToast(`🎉 Successfully imported ${res.count} leads to pipeline!`, 'success');
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = '🚀 Import Leads to Pipeline';
          }
          window.showToast && window.showToast('Import failed: ' + (res.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = '🚀 Import Leads to Pipeline';
        }
        window.showToast && window.showToast('Import error: ' + err.message, 'error');
      }
    }
  };

  // ─── Init ────────────────────────────────────────────────────────────────────
  container.innerHTML = `<div style="padding:3rem; text-align:center; color:var(--text-muted);">⏳ Loading Leads Pipeline...</div>`;
  await loadLeads();
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
