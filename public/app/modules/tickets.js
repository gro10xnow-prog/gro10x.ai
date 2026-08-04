/**
 * public/app/modules/tickets.js
 * Support Desk Ticket Triage Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.tickets = async function(container) {
  let ticketsData = [];

  async function loadTickets() {
    ticketsData = await APP_API.get('/tickets').catch(() => []);
    renderTicketsView();
  }

  function renderTicketsView() {
    const openCount = ticketsData.filter(t => t.status === 'Open').length;
    const inProgressCount = ticketsData.filter(t => t.status === 'In Progress').length;
    const resolvedCount = ticketsData.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎟️ Support Desk & Operations Triage
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client support requests, IT tickets, and creative adjustments submitted from the miniapp.
          </div>
        </div>
      </div>

      <!-- KPI Tiles -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Open Tickets</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${openCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">In Progress</div>
          <div class="kpi-val" style="color: var(--purple-light);">${inProgressCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Resolved Tickets</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">${resolvedCount}</div>
        </div>
      </div>

      <!-- Data Table Grid -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issue Title & Description</th>
              <th>Submitted By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${ticketsData.map(t => `
              <tr>
                <td style="font-weight:700; color:var(--purple-light);">${t.id}</td>
                <td>
                  <div style="font-weight:700; color:var(--text-primary);">${t.title}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">${t.description || 'No additional details.'}</div>
                </td>
                <td>👤 ${t.submittedBy || 'Client'}</td>
                <td><span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : 'badge-amber'}">${t.priority || 'Medium'}</span></td>
                <td><span class="badge ${t.status === 'Resolved' ? 'badge-emerald' : t.status === 'In Progress' ? 'badge-purple' : 'badge-amber'}">${t.status || 'Open'}</span></td>
                <td>
                  ${t.status !== 'Resolved' ? `
                    <button class="btn-primary btn-sm" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'Resolved')">Mark Resolved ✅</button>
                  ` : `<span style="font-size:0.75rem; color:var(--emerald-brand); font-weight:700;">Completed</span>`}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No support tickets logged.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.TICKETS_MODULE = {
    async updateStatus(ticketId, newStatus) {
      try {
        const res = await APP_API.patch(`/tickets/${ticketId}/status`, { status: newStatus });
        if (res.success || res.ticket) {
          showToast(`Ticket ${ticketId} resolved!`);
          loadTickets();
        }
      } catch (err) {
        showToast('Failed to update ticket status', 'error');
      }
    }
  };

  await loadTickets();
};
