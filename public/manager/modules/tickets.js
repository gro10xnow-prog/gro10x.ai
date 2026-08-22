/**
 * public/manager/modules/tickets.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Interactive Ticket Triage Module
 * - Status & Priority Filter Pills
 * - Live Search Bar
 * - In-place Ticket Resolution Action
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.tickets = async function(container) {
  let allTickets = [];
  let currentFilter = 'open';
  let searchQuery = '';

  async function loadTickets() {
    allTickets = await MANAGER_API.get('/tickets').catch(() => []);
    renderTickets();
  }

  function getFilteredTickets() {
    return allTickets.filter(t => {
      const matchesSearch = !searchQuery ||
        (t.title || '').toLowerCase().includes(searchQuery) ||
        (t.description || '').toLowerCase().includes(searchQuery) ||
        (t.submittedBy || t.submitted_by || '').toLowerCase().includes(searchQuery) ||
        (t.id || '').toLowerCase().includes(searchQuery);

      if (!matchesSearch) return false;

      const st = (t.status || 'Open').toLowerCase();
      const prio = (t.priority || 'Medium').toLowerCase();

      if (currentFilter === 'all') return true;
      if (currentFilter === 'open') return st === 'open' || st === 'in progress';
      if (currentFilter === 'high') return prio === 'high' || prio === 'urgent';
      if (currentFilter === 'resolved') return st === 'resolved' || st === 'closed';
      return true;
    });
  }

  function renderTickets() {
    const tickets = getFilteredTickets();
    const openCount = allTickets.filter(t => (t.status || 'Open').toLowerCase() === 'open' || (t.status || '').toLowerCase() === 'in progress').length;
    const highPrioCount = allTickets.filter(t => (t.priority || '').toLowerCase() === 'high' || (t.priority || '').toLowerCase() === 'urgent').length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            🎟️ Department Support Ticket Triage
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Manage client service inquiries, bug reports, and operational escalations.
          </div>
        </div>

        <div style="position:relative; width:100%; max-width:320px;">
          <input
            type="text"
            placeholder="🔍 Search ticket title, client, ID..."
            value="${searchQuery}"
            style="width:100%; padding:0.6rem 1rem; background:var(--surface-2); border:1px solid var(--border-medium); border-radius:10px; color:var(--text-primary); font-size:0.85rem;"
            oninput="window.MGR_TICKETS.onSearch(this.value)"
          />
        </div>
      </div>

      <!-- Filter Pills -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; overflow-x:auto; padding-bottom:0.25rem;">
        <button class="filter-pill ${currentFilter === 'open' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('open')">
          ⚡ Open & Active (${openCount})
        </button>
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('all')">
          All Tickets (${allTickets.length})
        </button>
        <button class="filter-pill ${currentFilter === 'high' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('high')">
          🚨 High Priority (${highPrioCount})
        </button>
        <button class="filter-pill ${currentFilter === 'resolved' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('resolved')">
          ✅ Resolved
        </button>
      </div>

      <!-- Tickets Table -->
      <div class="data-table-container card-glass">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Request Title & Description</th>
              <th>Submitted By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map(t => {
              const isResolved = (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed';
              const isUrgent = (t.priority || '').toLowerCase() === 'urgent' || (t.priority || '').toLowerCase() === 'high';

              return `
                <tr>
                  <td style="font-weight:700; color:var(--purple-light); font-size:0.85rem;">
                    ${t.id}
                  </td>
                  <td style="max-width:320px;">
                    <div style="font-weight:700; color:var(--text-primary);">${t.title}</div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem; line-height:1.4;">
                      ${t.description || 'No additional details provided.'}
                    </div>
                  </td>
                  <td>
                    <span style="font-weight:600; color:var(--text-secondary);">
                      👤 ${t.submittedBy || t.submitted_by || 'Client Partner'}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${isUrgent ? 'badge-pink' : 'badge-amber'}">
                      ${t.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${isResolved ? 'badge-emerald' : 'badge-purple'}">
                      ${t.status || 'Open'}
                    </span>
                  </td>
                  <td>
                    ${!isResolved ? `
                      <button class="btn-primary btn-sm" onclick="window.MGR_TICKETS.resolve('${t.id}')">
                        ✅ Resolve
                      </button>
                    ` : `
                      <span style="font-size:0.75rem; color:var(--emerald-brand); font-weight:700;">Resolved</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No tickets found for this filter.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_TICKETS = {
    onSearch(q) {
      searchQuery = (q || '').trim().toLowerCase();
      renderTickets();
    },
    setFilter(f) {
      currentFilter = f;
      renderTickets();
    },
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
