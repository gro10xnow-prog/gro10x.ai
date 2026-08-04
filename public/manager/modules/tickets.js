/**
 * public/manager/modules/tickets.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.tickets = async function(container) {
  let tickets = [];

  async function loadTickets() {
    tickets = await MANAGER_API.get('/tickets').catch(() => []);
    renderTickets();
  }

  function renderTickets() {
    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎟️ Department Support Ticket Triage</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Manage client support tickets and operational service requests.</div>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title / Request</th>
              <th>Submitted By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td>${t.submittedBy || 'Client'}</td>
                <td><span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : 'badge-amber'}">${t.priority || 'Medium'}</span></td>
                <td><span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : 'badge-purple'}">${t.status || 'Open'}</span></td>
                <td>
                  ${t.status !== 'Resolved' ? `
                    <button class="btn-primary btn-sm" onclick="window.MGR_TICKETS.resolve('${t.id}')">Resolve</button>
                  ` : `<span style="font-size:0.75rem; color:var(--emerald-brand);">Resolved</span>`}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem;">No support tickets logged.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_TICKETS = {
    async resolve(id) {
      try {
        await MANAGER_API.patch(`/tickets/${id}`, { status: 'Resolved' });
        showManagerToast('Ticket marked as resolved! 🎟️');
        loadTickets();
      } catch (e) {
        showManagerToast('Failed to update ticket', 'error');
      }
    }
  };

  await loadTickets();
};
