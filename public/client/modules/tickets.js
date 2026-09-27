/**
 * public/client/modules/tickets.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client Portal Support, 30-Day Bug-Fix Warranty, Dispute & Social Proof Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) {
  return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
};

window.CLIENT_MODULES.tickets = async function(container) {
  let tickets = [];
  let clientProjects = [];
  let activeWarrantyProject = null;
  let changeOrders = [];
  let currentView = 'tickets';

  async function loadClientTickets() {
    try {
      const [tData, pData] = await Promise.all([
        CLIENT_API.get('/tickets').catch(() => []),
        CLIENT_API.get('/projects').catch(() => [])
      ]);
      tickets = Array.isArray(tData) ? tData : [];
      clientProjects = Array.isArray(pData) ? pData : [];
      
      // Find project with active warranty
      activeWarrantyProject = clientProjects.find(p => {
        const w = p.warrantyUntil || p.warranty_until;
        return w && new Date(w) > new Date();
      }) || clientProjects[0] || null;

      // Immediate initial render so tabs and tickets mount instantly
      renderTickets();

      // Fetch active change orders across client projects
      changeOrders = [];
      for (const p of clientProjects) {
        try {
          const coRes = await CLIENT_API.get(`/projects/${p.id}/change-orders`).catch(() => []);
          const list = Array.isArray(coRes) ? coRes : (coRes?.changeOrders || []);
          list.forEach(co => {
            changeOrders.push({ ...co, projectName: p.name, projectId: p.id });
          });
        } catch (_) {}
      }

      renderTickets();
    } catch (err) {
      console.warn('Error loading client tickets/projects:', err);
      renderTickets();
    }
  }

  function renderTickets() {
    const warrantyUntilStr = activeWarrantyProject?.warrantyUntil || activeWarrantyProject?.warranty_until;
    let warrantyDaysRemaining = 0;
    let isWarrantyActive = false;

    if (warrantyUntilStr) {
      const diff = new Date(warrantyUntilStr).getTime() - Date.now();
      if (diff > 0) {
        isWarrantyActive = true;
        warrantyDaysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    }

    container.innerHTML = `
      <!-- Warranty Shield Banner -->
      ${isWarrantyActive ? `
        <div style="background: linear-gradient(135deg, rgba(0,223,137,0.12), rgba(124,58,237,0.12)); border: 1px solid rgba(0,223,137,0.35); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display:flex; align-items:center; gap:0.85rem;">
            <div style="font-size: 1.8rem;">🛡️</div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #00df89; display: flex; align-items: center; gap: 0.5rem;">
                <span>Active 30-Day Bug-Fix Warranty Shield</span>
                <span style="background: rgba(0,223,137,0.2); color: #00df89; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 6px;">${warrantyDaysRemaining} Days Remaining</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Project: <strong>${escapeHTML(activeWarrantyProject.name || 'AI Agency OS')}</strong> • Guaranteed 4h Response / 24h Defect Remediation SLA (Zero-Cost).
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn-secondary" style="font-size: 0.78rem; padding: 0.4rem 0.8rem;" onclick="window.CLIENT_TICKETS.openWarrantyModal()">
              🛡️ File Warranty Bug Fix
            </button>
            <a href="/handover-view.html?projectId=${encodeURIComponent(activeWarrantyProject.id)}" target="_blank" class="btn-secondary" style="font-size: 0.78rem; padding: 0.4rem 0.8rem; text-decoration: none; color: #fff;">
              📄 IP Handover Manifest
            </a>
          </div>
        </div>
      ` : ''}

      <!-- Page Header & Action Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎟️ Support & Service Requests</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Submit technical adjustments, bug-fix warranty requests, or executive escalations.</div>
        </div>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <button class="btn-secondary" style="color:#a78bfa; border-color:rgba(167,139,250,0.35); font-weight:700;" onclick="window.CLIENT_TICKETS.openTestimonialModal()">
            ⭐ Share Feedback
          </button>
          <button class="btn-secondary" style="color:#fca5a5; border-color:rgba(239,68,68,0.35); font-weight:700;" onclick="window.CLIENT_TICKETS.openDisputeModal()">
            ⚖️ Raise Dispute
          </button>
          <button class="btn-secondary" style="color:#fca5a5; border-color:rgba(239,68,68,0.35); font-weight:700;" onclick="window.CLIENT_TICKETS.openEscalationModal()">
            🚨 Executive Escalation
          </button>
          <button class="btn-primary" onclick="window.CLIENT_TICKETS.openModal()">
            + Submit New Ticket
          </button>
        </div>
      </div>

      <!-- View Switcher Tabs -->
      <div style="display:flex; gap:0.6rem; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem; flex-wrap:wrap;">
        <button id="tabBtnTickets" class="${currentView === 'tickets' ? 'btn-primary' : 'btn-secondary'}" style="font-size:0.85rem; padding:0.45rem 1rem;" onclick="window.CLIENT_TICKETS.switchView('tickets')">
          🎟️ Support & Bug-Fix Tickets (${tickets.length})
        </button>
        <button id="tabBtnChangeOrders" class="${currentView === 'changeOrders' ? 'btn-primary' : 'btn-secondary'}" style="font-size:0.85rem; padding:0.45rem 1rem;" onclick="window.CLIENT_TICKETS.switchView('changeOrders')">
          ⚡ Scope Change Orders & Addenda (${changeOrders.length})
        </button>
      </div>

      ${currentView === 'tickets' ? `
        <!-- Tickets Data Table -->
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Title & Category</th>
                <th>SLA & Warranty</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => `
                <tr>
                  <td style="font-weight:700; color:var(--purple-light); font-family:monospace;">${escapeHTML(t.id)}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.2rem;">
                      <span class="badge ${t.isWarranty ? 'badge-emerald' : t.category === 'Executive Escalation' ? 'badge-pink' : 'badge-purple'}" style="font-size:0.65rem;">
                        ${escapeHTML(t.category || 'General')}
                      </span>
                      <span style="font-weight:700;">${escapeHTML(t.title)}</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(t.description || '')}</div>
                  </td>
                  <td>
                    ${t.isWarranty ? `
                      <div style="font-size:0.72rem; color:#00df89; font-weight:700;">🛡️ 4h Response / 24h Target</div>
                      <div style="font-size:0.65rem; color:var(--text-muted);">Zero-Cost In-Scope</div>
                    ` : `
                      <div style="font-size:0.72rem; color:var(--text-muted);">${t.billable ? 'Standard Service' : 'Complimentary'}</div>
                    `}
                  </td>
                  <td><span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : t.priority === 'High' ? 'badge-amber' : 'badge-purple'}">${escapeHTML(t.priority || 'Medium')}</span></td>
                  <td><span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : 'badge-purple'}">${escapeHTML(t.status || 'Open')}</span></td>
                  <td style="color:var(--text-muted); font-size:0.78rem;">${(t.createdAt || '').split('T')[0]}</td>
                </tr>
              `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem;">No support requests submitted yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      ` : `
        <!-- Scope Change Orders Desk -->
        <div class="data-table-container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.6rem;">
            <div>
              <h3 style="margin:0; font-size:1.15rem; color:#fff; font-family:var(--font-heading);">Scope Change Orders & Addenda</h3>
              <div style="font-size:0.78rem; color:var(--text-muted);">Authorized sprint addenda, additional feature deliverables, and manager adjustments.</div>
            </div>
            <button class="btn-primary btn-sm" onclick="window.CLIENT_TICKETS.openChangeOrderModal()" style="background:linear-gradient(135deg, #06b6d4, #00df89);">
              + Request Scope Addendum
            </button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Addendum ID</th>
                <th>Project & Scope Details</th>
                <th>Timeline Delta</th>
                <th>Proposed Fee</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${changeOrders.map(co => `
                <tr>
                  <td style="font-family:monospace; font-weight:700; color:var(--purple-light);">${escapeHTML(co.id || co.coId)}</td>
                  <td>
                    <div style="font-weight:700; color:#fff;">${escapeHTML(co.title || 'Scope Expansion')}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">${escapeHTML(co.description || '')}</div>
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.15rem;">Project: ${escapeHTML(co.projectName || co.projectId)}</div>
                  </td>
                  <td>
                    <span class="badge badge-purple">+${co.estimatedDays || 3} Days</span>
                  </td>
                  <td style="font-weight:700; color:#00df89;">
                    ৳${(co.proposedFeeBDT || co.feeBDT || 15000).toLocaleString()} BDT
                  </td>
                  <td>
                    <span class="badge ${co.status === 'APPROVED' ? 'badge-emerald' : 'badge-amber'}">
                      ${escapeHTML(co.status || 'PENDING_APPROVAL')}
                    </span>
                  </td>
                  <td style="text-align:right;">
                    ${co.status !== 'APPROVED' ? `
                      <button class="btn-primary btn-sm" style="background:linear-gradient(135deg, #10b981, #059669); font-size:0.75rem; padding:0.35rem 0.75rem;"
                        onclick="window.CLIENT_TICKETS.approveChangeOrder('${escapeHTML(co.projectId)}', '${escapeHTML(co.id || co.coId)}')">
                        ✅ Authorize & Invoice
                      </button>
                    ` : `
                      <span style="font-size:0.75rem; color:#10b981; font-weight:700;">✓ Invoiced</span>
                    `}
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No scope change orders found. Use "+ Request Scope Addendum" to request new features.</td></tr>`}
            </tbody>
          </table>
        </div>
      `}

      <!-- Ticket Creation Modal -->
      <div class="modal-overlay" id="clTicketModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2 id="clTicketModalTitle" style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);">🎟️ Submit Support Request</h2>
            <button onclick="window.CLIENT_TICKETS.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div id="clEscalationBanner" style="display:none; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:0.75rem; font-size:0.8rem; color:#fca5a5; margin-bottom:1rem;">
            🚨 <strong>2-Hour Leadership SLA:</strong> Routes directly to Managing Directors for immediate intervention.
          </div>

          <div id="clWarrantyBanner" style="display:none; background:rgba(0,223,137,0.12); border:1px solid rgba(0,223,137,0.3); border-radius:10px; padding:0.75rem; font-size:0.8rem; color:#00df89; margin-bottom:1rem;">
            🛡️ <strong>30-Day Bug-Fix SLA Active:</strong> 4h response & 24h resolution guarantee at zero additional billing.
          </div>

          <div class="form-group">
            <label class="form-label">Linked Project</label>
            <select id="clTckProject" class="form-select">
              ${clientProjects.map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('') || '<option value="">-- General Agency Request --</option>'}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Request Category</label>
            <select id="clTckCategory" class="form-select" onchange="window.CLIENT_TICKETS.handleCategoryChange()">
              <option value="Warranty Bug Fix">🛡️ Warranty Bug Fix (0-Cost SLA)</option>
              <option value="Creative Revision">🎨 Creative Revision / Asset Adjustment</option>
              <option value="Campaign Scope">📈 Campaign Scope / Schedule</option>
              <option value="Billing Query">💳 Billing & Invoice Query</option>
              <option value="Technical Issue">⚙️ Technical Support / Integration</option>
              <option value="Executive Escalation">🚨 Executive Escalation (Critical Blocker)</option>
              <option value="General Support">💬 General Support</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Request Title</label>
            <input type="text" id="clTckTitle" class="form-input" placeholder="e.g. Bug fix in webhook signature verification">
          </div>

          <div class="form-group">
            <label class="form-label">Priority Level</label>
            <select id="clTckPrio" class="form-select">
              <option value="Medium">Medium (Standard 24h SLA)</option>
              <option value="High" selected>High (Priority 12h SLA)</option>
              <option value="Urgent">Urgent (Immediate Campaign Blocker)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Details / Requirements</label>
            <textarea id="clTckDesc" class="form-textarea" rows="3" placeholder="Describe the change or defect observed..."></textarea>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CLIENT_TICKETS.submit()">🚀 Submit Ticket</button>
        </div>
      </div>

      <!-- Deliverable Dispute Modal -->
      <div class="modal-overlay" id="clDisputeModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);">⚖️ Raise Deliverable Dispute</h2>
            <button onclick="window.CLIENT_TICKETS.closeDisputeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:0.75rem; font-size:0.78rem; color:#fca5a5; margin-bottom:1rem;">
            ⏸️ <strong>Warranty Freeze Protection:</strong> Submitting a formal dispute automatically pauses your 30-day warranty countdown so no warranty time is lost during investigation.
          </div>

          <div class="form-group">
            <label class="form-label">Project In Dispute</label>
            <select id="clDispProject" class="form-select">
              ${clientProjects.map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('') || '<option value="PRJ-CURRENT">Current Project</option>'}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Dispute Category</label>
            <select id="clDispReason" class="form-select">
              <option value="SCOPE_MISMATCH">Scope Mismatch / Missing Delivery Criteria</option>
              <option value="QUALITY_DEFECT">Quality Defect / Critical Code Failure</option>
              <option value="SLA_BREACH">SLA Breach / Significant Milestone Delay</option>
              <option value="TECHNICAL_FAILURE">Technical Failure in Production Staging</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Requested Remedy</label>
            <select id="clDispRemedy" class="form-select">
              <option value="CORRECTION_SPRINT">Complimentary Correction Sprint (Target 72h)</option>
              <option value="CREDIT_NOTE">Courtesy Commercial Credit / Milestone Deduction</option>
              <option value="MILESTONE_EXTENSION">Timeline Grace Extension & Architecture Rework</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Dispute Evidence / Context</label>
            <textarea id="clDispDesc" class="form-textarea" rows="3" placeholder="Explain the discrepancy and paste any relevant staging/error links..."></textarea>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem; background:linear-gradient(135deg, #ef4444, #dc2626);" onclick="window.CLIENT_TICKETS.submitDispute()">⚖️ File Formal Dispute</button>
        </div>
      </div>

      <!-- Testimonial & Social Proof Modal -->
      <div class="modal-overlay" id="clTestimonialModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);">⭐ Client Testimonial & Review</h2>
            <button onclick="window.CLIENT_TICKETS.closeTestimonialModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Overall Experience (CSAT: 1-5 Stars)</label>
            <select id="clTstRating" class="form-select">
              <option value="5">⭐⭐⭐⭐⭐ Exceptional (5/5)</option>
              <option value="4">⭐⭐⭐⭐ Great (4/5)</option>
              <option value="3">⭐⭐⭐ Satisfactory (3/5)</option>
              <option value="2">⭐⭐ Needs Improvement (2/5)</option>
              <option value="1">⭐ Unsatisfactory (1/5)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Net Promoter Score (NPS: 0-10)</label>
            <select id="clTstNps" class="form-select">
              <option value="10" selected>10 — Extremely Likely to Recommend</option>
              <option value="9">9 — Very Likely</option>
              <option value="8">8 — Likely</option>
              <option value="7">7 — Neutral</option>
              <option value="5">5 — Unlikely</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Your Review & Comments</label>
            <textarea id="clTstReview" class="form-textarea" rows="3" placeholder="Share your experience working with Gro10x.ai on this sprint..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Video Testimonial Link (Loom / YouTube / Drive)</label>
            <input type="text" id="clTstVideo" class="form-input" placeholder="https://www.loom.com/share/...">
          </div>

          <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:0.4rem;">
            <input type="checkbox" id="clTstConsent" checked style="width:18px; height:18px; cursor:pointer;">
            <label for="clTstConsent" style="font-size:0.75rem; color:#cbd5e1; cursor:pointer;">
              Authorize Gro10x.ai to showcase this testimonial in portfolio & case studies.
            </label>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.75rem;" onclick="window.CLIENT_TICKETS.submitTestimonial()">🌟 Submit Testimonial</button>
        </div>
      </div>

      <!-- Scope Change Order Request Modal -->
      <div class="modal-overlay" id="clChangeOrderModal">
        <div class="modal-box" style="max-width: 540px; border: 1px solid rgba(6,182,212,0.35); box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.3rem;">⚡</span>
              <h2 style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);">Request Scope Addendum</h2>
            </div>
            <button onclick="window.CLIENT_TICKETS.closeChangeOrderModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25); border-radius:10px; padding:0.75rem; font-size:0.8rem; color:#bae6fd; margin-bottom:1rem; line-height:1.4;">
            <strong>ℹ️ Scope Expansion Policy:</strong> Scope addenda allow you to add new integrations, custom features, or extended deliverables to active sprints without delaying primary sprint delivery milestones.
          </div>

          <div class="form-group">
            <label class="form-label">Linked Project *</label>
            <select id="clCoProject" class="form-select">
              ${clientProjects.map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('') || '<option value="">-- Active Project --</option>'}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Addendum Title *</label>
            <input type="text" id="clCoTitle" class="form-input" placeholder="e.g. Automated Multi-Agent WhatsApp Routing Integration">
          </div>

          <div class="form-group">
            <label class="form-label">Scope Description & Target DoD *</label>
            <textarea id="clCoDesc" class="form-textarea" rows="3" placeholder="Describe the feature, endpoints, or UI deliverables required..."></textarea>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Requested Timeline Delta</label>
              <select id="clCoDays" class="form-select">
                <option value="2">+2 Days (Minor Addon)</option>
                <option value="3" selected>+3 Days (Standard Addon)</option>
                <option value="5">+5 Days (Complex Feature)</option>
                <option value="7">+7 Days (Subsystem Sprint)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Proposed Budget (BDT)</label>
              <input type="number" id="clCoFee" class="form-input" value="15000" min="5000" step="1000">
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.75rem; background:linear-gradient(135deg, #06b6d4, #00df89);" onclick="window.CLIENT_TICKETS.submitChangeOrder()">
            🚀 Submit Scope Change Order
          </button>
        </div>
      </div>
    `;
  }

  window.CLIENT_TICKETS = {
    switchView(view) {
      currentView = view;
      renderTickets();
    },
    openChangeOrderModal() {
      const modal = document.getElementById('clChangeOrderModal');
      if (modal) modal.classList.add('active');
    },
    closeChangeOrderModal() {
      const modal = document.getElementById('clChangeOrderModal');
      if (modal) modal.classList.remove('active');
    },
    async submitChangeOrder() {
      const pId = document.getElementById('clCoProject')?.value || activeWarrantyProject?.id;
      const title = (document.getElementById('clCoTitle')?.value || '').trim();
      const description = (document.getElementById('clCoDesc')?.value || '').trim();
      const estimatedDays = Number(document.getElementById('clCoDays')?.value) || 3;
      const proposedFeeBDT = Number(document.getElementById('clCoFee')?.value) || 15000;

      if (!title || !description) {
        if (window.showClientToast) window.showClientToast('Title and description are required', 'error');
        else alert('Title and description are required');
        return;
      }
      if (!pId) {
        if (window.showClientToast) window.showClientToast('No project selected for addendum', 'error');
        else alert('No project selected');
        return;
      }

      try {
        const res = await CLIENT_API.post(`/projects/${pId}/change-order`, {
          title,
          description,
          estimatedDays,
          proposedFeeBDT
        });

        if (res.ok || res.success || res.changeOrder) {
          this.closeChangeOrderModal();
          const msg = `⚡ Scope Change Order ${res.changeOrder?.id || ''} submitted! Pod Manager alerted.`;
          if (window.showClientToast) window.showClientToast(msg);
          else alert(msg);
          await loadClientTickets();
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Error: ' + err.message, 'error');
        else alert('Error: ' + err.message);
      }
    },
    async approveChangeOrder(projectId, coId) {
      if (!confirm('Authorize this change order addendum and issue settlement invoice?')) return;

      try {
        const res = await CLIENT_API.put(`/projects/${projectId}/change-order/${coId}/approve`);
        if (res.ok || res.success) {
          const msg = `✅ Change Order Approved! Invoice ${res.invoiceId || 'issued'}.`;
          if (window.showClientToast) window.showClientToast(msg);
          else alert(msg);
          await loadClientTickets();
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Error: ' + err.message, 'error');
        else alert('Error: ' + err.message);
      }
    },
    openModal() {
      document.getElementById('clTicketModalTitle').innerText = '🎟️ Submit Support Request';
      document.getElementById('clEscalationBanner').style.display = 'none';
      document.getElementById('clWarrantyBanner').style.display = 'none';
      document.getElementById('clTckCategory').value = 'General Support';
      document.getElementById('clTckPrio').value = 'Medium';
      document.getElementById('clTicketModal').classList.add('active');
    },
    openWarrantyModal() {
      document.getElementById('clTicketModalTitle').innerText = '🛡️ File Warranty Bug Fix Request';
      document.getElementById('clEscalationBanner').style.display = 'none';
      document.getElementById('clWarrantyBanner').style.display = 'block';
      document.getElementById('clTckCategory').value = 'Warranty Bug Fix';
      document.getElementById('clTckPrio').value = 'High';
      document.getElementById('clTicketModal').classList.add('active');
    },
    openEscalationModal() {
      document.getElementById('clTicketModalTitle').innerText = '🚨 Executive Leadership Escalation';
      document.getElementById('clEscalationBanner').style.display = 'block';
      document.getElementById('clWarrantyBanner').style.display = 'none';
      document.getElementById('clTckCategory').value = 'Executive Escalation';
      document.getElementById('clTckPrio').value = 'Urgent';
      document.getElementById('clTicketModal').classList.add('active');
    },
    openDisputeModal() {
      document.getElementById('clDisputeModal').classList.add('active');
    },
    closeDisputeModal() {
      document.getElementById('clDisputeModal').classList.remove('active');
    },
    openTestimonialModal() {
      document.getElementById('clTestimonialModal').classList.add('active');
    },
    closeTestimonialModal() {
      document.getElementById('clTestimonialModal').classList.remove('active');
    },
    handleCategoryChange() {
      const cat = document.getElementById('clTckCategory').value;
      if (cat === 'Executive Escalation') {
        document.getElementById('clEscalationBanner').style.display = 'block';
        document.getElementById('clWarrantyBanner').style.display = 'none';
        document.getElementById('clTckPrio').value = 'Urgent';
      } else if (cat === 'Warranty Bug Fix') {
        document.getElementById('clEscalationBanner').style.display = 'none';
        document.getElementById('clWarrantyBanner').style.display = 'block';
        document.getElementById('clTckPrio').value = 'High';
      } else {
        document.getElementById('clEscalationBanner').style.display = 'none';
        document.getElementById('clWarrantyBanner').style.display = 'none';
      }
    },
    closeModal() {
      document.getElementById('clTicketModal').classList.remove('active');
    },
    async submit() {
      const category = document.getElementById('clTckCategory').value;
      const title = document.getElementById('clTckTitle').value.trim();
      const priority = document.getElementById('clTckPrio').value;
      const description = document.getElementById('clTckDesc').value.trim();
      const projectId = document.getElementById('clTckProject').value || activeWarrantyProject?.id;

      if (!title) {
        if (window.showClientToast) window.showClientToast('Please enter request title', 'error');
        else alert('Please enter request title.');
        return;
      }

      try {
        const res = await CLIENT_API.post('/tickets', { category, title, priority, description, projectId });
        if (res.success || res.ticket) {
          this.closeModal();
          const msg = category === 'Warranty Bug Fix'
            ? '🛡️ Warranty ticket submitted! 4h response SLA active.'
            : category === 'Executive Escalation'
            ? '🚨 Escalation dispatched to Agency Leadership! 2h Priority SLA active.'
            : 'Ticket submitted successfully! 🎟️';
          if (window.showClientToast) window.showClientToast(msg);
          else alert(msg);
          loadClientTickets();
        }
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Failed to submit ticket: ' + e.message, 'error');
        else alert('Failed to submit ticket: ' + e.message);
      }
    },
    async submitDispute() {
      const projectId = document.getElementById('clDispProject').value || activeWarrantyProject?.id;
      const reason = document.getElementById('clDispReason').value;
      const requestedRemedy = document.getElementById('clDispRemedy').value;
      const description = document.getElementById('clDispDesc').value.trim();

      if (!description) {
        alert('Please describe the reason for your dispute.');
        return;
      }

      try {
        const res = await CLIENT_API.post(`/projects/${projectId}/dispute`, {
          reason,
          requestedRemedy,
          description
        });
        if (res.ok || res.success) {
          this.closeDisputeModal();
          const alertMsg = '⚖️ Dispute recorded. Warranty timer has been FROZEN to protect your coverage. Leadership will reach out within 2 hours.';
          if (window.showClientToast) window.showClientToast(alertMsg);
          else alert(alertMsg);
          loadClientTickets();
        }
      } catch (err) {
        alert('Error submitting dispute: ' + err.message);
      }
    },
    async submitTestimonial() {
      const projectId = activeWarrantyProject?.id || clientProjects[0]?.id;
      const csatRating = document.getElementById('clTstRating').value;
      const npsScore = document.getElementById('clTstNps').value;
      const reviewText = document.getElementById('clTstReview').value.trim();
      const videoUrl = document.getElementById('clTstVideo').value.trim();
      const consentShowcase = document.getElementById('clTstConsent').checked;

      if (!projectId) {
        alert('No project found to attach testimonial.');
        return;
      }

      try {
        const res = await CLIENT_API.post(`/projects/${projectId}/testimonial`, {
          csatRating,
          npsScore,
          reviewText,
          videoUrl,
          consentShowcase
        });
        if (res.ok || res.testimonial) {
          this.closeTestimonialModal();
          const alertMsg = '🌟 Thank you for your review! Your feedback helps us continuously elevate our service.';
          if (window.showClientToast) window.showClientToast(alertMsg);
          else alert(alertMsg);
        }
      } catch (err) {
        alert('Error submitting testimonial: ' + err.message);
      }
    }
  };

  await loadClientTickets();
};
