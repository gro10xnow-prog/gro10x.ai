/**
 * public/client/modules/tickets.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
window.CLIENT_MODULES.tickets = async function(container) {
  let tickets = [];

  async function loadClientTickets() {
    tickets = await CLIENT_API.get('/tickets').catch(() => []);
    renderTickets();
  }

  function renderTickets() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎟️ Support & Service Requests</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Submit technical or creative adjustment requests.</div>
        </div>
        <button class="btn-primary" onclick="window.CLIENT_TICKETS.openModal()">+ Submit New Ticket</button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issue Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map(t => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${t.id}</td>
                <td>
                  <div style="font-weight:700;">${t.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${t.description || ''}</div>
                </td>
                <td><span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : 'badge-amber'}">${t.priority || 'Medium'}</span></td>
                <td><span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : 'badge-purple'}">${t.status || 'Open'}</span></td>
                <td style="color:var(--text-muted); font-size:0.78rem;">${(t.createdAt || '').split('T')[0]}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem;">No support requests submitted yet.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" id="clTicketModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">🎟️ Submit Support Request</h2>
            <button onclick="window.CLIENT_TICKETS.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Request Title</label>
            <input type="text" id="clTckTitle" class="form-input" placeholder="e.g. Change banner color on Independence Day campaign">
          </div>

          <div class="form-group">
            <label class="form-label">Priority Level</label>
            <select id="clTckPrio" class="form-select">
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
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
    openModal() { document.getElementById('clTicketModal').classList.add('active'); },
    closeModal() { document.getElementById('clTicketModal').classList.remove('active'); },
    async submit() {
      const title = document.getElementById('clTckTitle').value.trim();
      const priority = document.getElementById('clTckPrio').value;
      const description = document.getElementById('clTckDesc').value.trim();

      if (!title) return alert('Please enter request title.');

      try {
        const res = await CLIENT_API.post('/tickets', { title, priority, description });
        if (res.success || res.ticket) {
          this.closeModal();
          showClientToast('Ticket submitted successfully! 🎟️');
          loadClientTickets();
        }
      } catch (e) {
        showClientToast('Failed to submit ticket', 'error');
      }
    }
  };

  await loadClientTickets();
};
