/**
 * public/client/modules/tickets.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };
window.CLIENT_MODULES.tickets = async function(container) {
  let tickets = [];

  async function loadClientTickets() {
    tickets = await CLIENT_API.get('/tickets').catch(() => []);
    renderTickets();
  }

  function renderTickets() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎟️ Support & Service Requests</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Submit technical or creative adjustment requests and track resolution SLAs.</div>
        </div>
        <div style="display:flex; gap:0.6rem;">
          <button class="btn-secondary" style="color:#fca5a5; border-color:rgba(239,68,68,0.35); font-weight:700;" onclick="window.CLIENT_TICKETS.openEscalationModal()">
            🚨 Executive Escalation
          </button>
          <button class="btn-primary" onclick="window.CLIENT_TICKETS.openModal()">
            + Submit New Ticket
          </button>
        </div>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issue Title & Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map(t => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${escapeHTML(t.id)}</td>
                <td>
                  <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.2rem;">
                    <span class="badge ${t.category === 'Executive Escalation' ? 'badge-pink' : 'badge-purple'}" style="font-size:0.65rem;">
                      ${escapeHTML(t.category || 'General')}
                    </span>
                    <span style="font-weight:700;">${escapeHTML(t.title)}</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(t.description || '')}</div>
                </td>
                <td><span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : t.priority === 'High' ? 'badge-amber' : 'badge-purple'}">${escapeHTML(t.priority || 'Medium')}</span></td>
                <td><span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : 'badge-purple'}">${escapeHTML(t.status || 'Open')}</span></td>
                <td style="color:var(--text-muted); font-size:0.78rem;">${(t.createdAt || '').split('T')[0]}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem;">No support requests submitted yet.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" id="clTicketModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2 id="clTicketModalTitle" style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);">🎟️ Submit Support Request</h2>
            <button onclick="window.CLIENT_TICKETS.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div id="clEscalationBanner" style="display:none; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:0.75rem; font-size:0.8rem; color:#fca5a5; margin-bottom:1rem;">
            🚨 <strong>2-Hour Leadership SLA:</strong> This request routes directly to Agency Leadership (MD Mehedi Bin Jayed / MD Ifteker Mahmud) for immediate intervention.
          </div>

          <div class="form-group">
            <label class="form-label">Request Category</label>
            <select id="clTckCategory" class="form-select" onchange="window.CLIENT_TICKETS.handleCategoryChange()">
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
            <input type="text" id="clTckTitle" class="form-input" placeholder="e.g. Change banner color on Independence Day campaign">
          </div>

          <div class="form-group">
            <label class="form-label">Priority Level</label>
            <select id="clTckPrio" class="form-select">
              <option value="Medium">Medium (Standard 24h SLA)</option>
              <option value="High">High (Priority 12h SLA)</option>
              <option value="Urgent">Urgent (Immediate Campaign Blocker)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Details / Requirements</label>
            <textarea id="clTckDesc" class="form-textarea" rows="3" placeholder="Describe the change or issue..."></textarea>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CLIENT_TICKETS.submit()">🚀 Submit Ticket</button>
        </div>
      </div>
    `;
  }

  window.CLIENT_TICKETS = {
    openModal() {
      document.getElementById('clTicketModalTitle').innerText = '🎟️ Submit Support Request';
      document.getElementById('clEscalationBanner').style.display = 'none';
      document.getElementById('clTckCategory').value = 'Creative Revision';
      document.getElementById('clTckPrio').value = 'Medium';
      document.getElementById('clTicketModal').classList.add('active');
    },
    openEscalationModal() {
      document.getElementById('clTicketModalTitle').innerText = '🚨 Executive Leadership Escalation';
      document.getElementById('clEscalationBanner').style.display = 'block';
      document.getElementById('clTckCategory').value = 'Executive Escalation';
      document.getElementById('clTckPrio').value = 'Urgent';
      document.getElementById('clTicketModal').classList.add('active');
    },
    handleCategoryChange() {
      const cat = document.getElementById('clTckCategory').value;
      if (cat === 'Executive Escalation') {
        document.getElementById('clEscalationBanner').style.display = 'block';
        document.getElementById('clTckPrio').value = 'Urgent';
      } else {
        document.getElementById('clEscalationBanner').style.display = 'none';
      }
    },
    closeModal() { document.getElementById('clTicketModal').classList.remove('active'); },
    async submit() {
      const category = document.getElementById('clTckCategory').value;
      const title = document.getElementById('clTckTitle').value.trim();
      const priority = document.getElementById('clTckPrio').value;
      const description = document.getElementById('clTckDesc').value.trim();

      if (!title) {
        if (window.showClientToast) window.showClientToast('Please enter request title', 'error');
        else alert('Please enter request title.');
        return;
      }

      try {
        const res = await CLIENT_API.post('/tickets', { category, title, priority, description });
        if (res.success || res.ticket) {
          this.closeModal();
          const successMsg = category === 'Executive Escalation'
            ? '🚨 Escalation dispatched to Agency Leadership! 2h Priority SLA active.'
            : 'Ticket submitted successfully! 🎟️';
          if (window.showClientToast) window.showClientToast(successMsg);
          else alert(successMsg);
          loadClientTickets();
        }
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Failed to submit ticket: ' + e.message, 'error');
        else alert('Failed to submit ticket');
      }
    }
  };

  await loadClientTickets();
};
