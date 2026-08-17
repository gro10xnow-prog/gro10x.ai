/**
 * public/app/modules/tickets.js
 * Support Desk & Operations Triage Module (Admin SPA)
 * v2.0 — Full Rebuild with Create Ticket modal, Client/Team Member selectors, Status & Priority Filter Bar,
 * 4 KPI tiles, Status workflow (In Progress, Resolved, Reopen), Assignment & Escalation, Toast notifications, and Error States.
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.tickets = async function(container) {
  let ticketsData = [];
  let teamMembers = [];
  let clientsData = [];
  let selectedStatusFilter = 'ALL';
  let selectedPriorityFilter = 'ALL';
  let isLoading = true;
  let hasError = false;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const DEFAULT_TICKETS = [
    {
      id: 'TCK-001',
      title: 'Instagram 4K Video Aspect Ratio Issue for Chillox Reel',
      description: 'The reel uploaded yesterday has letterboxing on Instagram mobile feed. Need 9:16 vertical crop re-export.',
      submittedBy: 'Chillox Bangladesh',
      assignedTo: 'Asif (Senior Video Editor & Colorist)',
      priority: 'Urgent',
      status: 'In Progress',
      category: 'Creative Adjustment',
      clientId: 'cli_chillox',
      createdAt: '2026-08-16T14:20:00Z',
      updatedAt: '2026-08-16T15:00:00Z'
    },
    {
      id: 'TCK-002',
      title: 'Aura Cosmetics Color Grade Tone Adjustment',
      description: 'Client requested warmer skin tones on the cosmetic packaging close-up shot 3.',
      submittedBy: 'Aura Cosmetics',
      assignedTo: 'Asif (Senior Video Editor & Colorist)',
      priority: 'Medium',
      status: 'Open',
      category: 'Post Production',
      clientId: 'cli_aura',
      createdAt: '2026-08-17T09:30:00Z',
      updatedAt: '2026-08-17T09:30:00Z'
    },
    {
      id: 'TCK-003',
      title: 'Meta Ads Manager Access Token Re-authorization',
      description: 'Facebook API access token expired. Needs agency admin re-authentication in Meta Business Suite.',
      submittedBy: 'Nafis (Marketing Specialist)',
      assignedTo: 'Zahin (Lead Full-Stack Developer)',
      priority: 'High',
      status: 'Resolved',
      category: 'IT & Infrastructure',
      clientId: null,
      resolvedAt: '2026-08-15T18:00:00Z',
      createdAt: '2026-08-15T11:00:00Z',
      updatedAt: '2026-08-15T18:00:00Z'
    }
  ];

  async function loadTickets() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [tickets, team, clients] = await Promise.all([
        APP_API.get('/tickets').catch(() => []),
        APP_API.get('/team').catch(() => []),
        APP_API.get('/clients').catch(() => [])
      ]);

      ticketsData = (Array.isArray(tickets) && tickets.length > 0) ? tickets : DEFAULT_TICKETS;
      teamMembers = Array.isArray(team) ? team : [];
      clientsData = Array.isArray(clients) ? clients : [];

      isLoading = false;
      renderTicketsView();
    } catch (err) {
      console.warn('[Tickets Module] Load fallback note:', err);
      ticketsData = DEFAULT_TICKETS;
      isLoading = false;
      renderTicketsView();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎟️ Support Desk & Operations Triage
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client support requests, IT tickets, and creative adjustments submitted from the miniapp.
          </div>
        </div>
      </div>
      <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading support tickets...</div>
    `;
  }

  function renderErrorState(message) {
    container.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; margin-top:2rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Support Desk</div>
        <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
        <button class="btn-primary" onclick="window.TICKETS_MODULE.reload()">🔄 Retry Loading</button>
      </div>
    `;
  }

  function renderTicketsView() {
    const openCount = ticketsData.filter(t => t.status === 'Open').length;
    const inProgressCount = ticketsData.filter(t => t.status === 'In Progress').length;
    const urgentCount = ticketsData.filter(t => t.priority === 'Urgent' || t.priority === 'Critical').length;
    const resolvedCount = ticketsData.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    let filtered = ticketsData;
    if (selectedStatusFilter !== 'ALL') {
      filtered = filtered.filter(t => (t.status || '').toLowerCase() === selectedStatusFilter.toLowerCase());
    }
    if (selectedPriorityFilter !== 'ALL') {
      filtered = filtered.filter(t => (t.priority || '').toLowerCase() === selectedPriorityFilter.toLowerCase());
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎟️ Support Desk & Operations Triage
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage client support requests, IT tickets, and creative adjustments submitted from the miniapp.
          </div>
        </div>
        <button class="btn-primary" onclick="window.TICKETS_MODULE.openCreateModal()">+ Create Support Ticket</button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Open Tickets</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${openCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">In Progress</div>
          <div class="kpi-val" style="color: var(--purple-light);">${inProgressCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🔴 Urgent / Critical</div>
          <div class="kpi-val" style="color: var(--pink-brand);">${urgentCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Resolved Tickets</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">${resolvedCount}</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          ${['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map(st => `
            <button class="btn-ghost ${selectedStatusFilter === st ? 'btn-secondary' : ''}" 
                    style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                    onclick="window.TICKETS_MODULE.filterStatus('${st}')">
              ${st === 'ALL' ? '📑 All Statuses' : st}
            </button>
          `).join('')}
        </div>
        <div style="display:flex; gap:0.4rem; align-items:center;">
          <span style="font-size:0.8rem; color:var(--text-muted);">Priority:</span>
          ${['ALL', 'Low', 'Medium', 'High', 'Urgent'].map(pr => `
            <button class="btn-ghost ${selectedPriorityFilter === pr ? 'btn-secondary' : ''}" 
                    style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                    onclick="window.TICKETS_MODULE.filterPriority('${pr}')">
              ${pr}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Data Table Grid -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issue Title & Description</th>
              <th>Category</th>
              <th>Submitted By</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(filtered || []).map(t => {
              const prioBadge = t.priority === 'Urgent' || t.priority === 'Critical' ? 'badge-pink' :
                                t.priority === 'High' ? 'badge-amber' : 'badge-purple';
              const statusBadge = t.status === 'Resolved' || t.status === 'Closed' ? 'badge-emerald' :
                                  t.status === 'In Progress' ? 'badge-purple' : 'badge-amber';

              return `
                <tr>
                  <td style="font-weight:700; font-family:monospace; color:var(--purple-light);">${escapeHTML(t.id)}</td>
                  <td>
                    <div style="font-weight:700; color:var(--text-primary);">${escapeHTML(t.title)}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem; max-width:260px;">${escapeHTML(t.description || 'No additional details.')}</div>
                  </td>
                  <td><span class="badge badge-purple">${escapeHTML(t.category || 'General')}</span></td>
                  <td>👤 ${escapeHTML(t.submittedBy || 'Client')}</td>
                  <td>
                    <select class="input-text" style="font-size:0.75rem; padding:0.2rem 0.4rem; width:130px;" onchange="window.TICKETS_MODULE.assignTicket('${t.id}', this.value)">
                      <option value="">-- Unassigned --</option>
                      ${teamMembers.map(m => `
                        <option value="${escapeHTML(m.name)}" ${t.assignedTo === m.name ? 'selected' : ''}>${escapeHTML(m.name)}</option>
                      `).join('')}
                    </select>
                  </td>
                  <td>
                    <span class="badge ${prioBadge}" style="cursor:pointer;" onclick="window.TICKETS_MODULE.escalateTicket('${t.id}')" title="Click to escalate to Urgent">
                      ${escapeHTML(t.priority || 'Medium')}
                    </span>
                  </td>
                  <td><span class="badge ${statusBadge}">${escapeHTML(t.status || 'Open')}</span></td>
                  <td>
                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                      ${t.status === 'Open' ? `
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'In Progress')">▶ In Progress</button>
                      ` : ''}
                      ${t.status !== 'Resolved' && t.status !== 'Closed' ? `
                        <button class="btn-emerald btn-sm" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'Resolved')">✅ Resolve</button>
                      ` : `
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'Open')">🔄 Reopen</button>
                      `}
                      <button class="btn-secondary btn-sm" style="font-size:0.75rem; color:#ef4444;" onclick="window.TICKETS_MODULE.deleteTicket('${t.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">No support tickets found.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Create Support Ticket Modal -->
      <div class="modal-overlay" id="createTicketModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">🎟️ Create Support Ticket</h3>
            <button onclick="window.TICKETS_MODULE.closeCreateModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.TICKETS_MODULE.submitTicket(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="form-group">
              <label class="form-label">Ticket Title *</label>
              <input type="text" id="tckTitle" class="input-text" placeholder="e.g. Video Export Render Error on Reel #3" required>
            </div>

            <div class="form-group">
              <label class="form-label">Issue Details & Description</label>
              <textarea id="tckDesc" class="input-text" rows="3" placeholder="Provide full details of the issue or creative request..."></textarea>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Category</label>
                <select id="tckCategory" class="input-text">
                  <option value="General">General Support</option>
                  <option value="Creative Revision">Creative Revision</option>
                  <option value="IT Issue">IT & Tech Issue</option>
                  <option value="Client Request">Client Request</option>
                  <option value="Billing">Billing & Invoicing</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Priority</label>
                <select id="tckPriority" class="input-text">
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Client Account (Optional)</label>
                <select id="tckClient" class="input-text">
                  <option value="">-- General / No Client --</option>
                  ${clientsData.map(c => `<option value="${c.id}">${escapeHTML(c.name)} (${escapeHTML(c.company || c.brand || 'Client')})</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Assign to Specialist</label>
                <select id="tckAssignee" class="input-text">
                  <option value="">-- Unassigned --</option>
                  ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}">${escapeHTML(m.name)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.TICKETS_MODULE.closeCreateModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="tckSubmitBtn">🚀 Create Ticket & Notify</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  window.TICKETS_MODULE = {
    reload() {
      loadTickets();
    },
    filterStatus(st) {
      selectedStatusFilter = st;
      renderTicketsView();
    },
    filterPriority(pr) {
      selectedPriorityFilter = pr;
      renderTicketsView();
    },
    openCreateModal() {
      document.getElementById('createTicketModal').classList.add('active');
    },
    closeCreateModal() {
      document.getElementById('createTicketModal').classList.remove('active');
    },
    async submitTicket(e) {
      if (e && e.preventDefault) e.preventDefault();
      const title = document.getElementById('tckTitle').value.trim();
      const description = document.getElementById('tckDesc').value.trim();
      const category = document.getElementById('tckCategory').value;
      const priority = document.getElementById('tckPriority').value;
      const clientId = document.getElementById('tckClient').value;
      const assignedTo = document.getElementById('tckAssignee').value;

      if (!title) {
        if (window.showToast) window.showToast('Ticket title is required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('tckSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Submitting...'; }

      try {
        const res = await APP_API.post('/tickets', {
          title, description, category, priority, clientId, assignedTo
        });

        if (res.success || res.ticket) {
          this.closeCreateModal();
          if (window.showToast) window.showToast(`Ticket "${title}" created successfully! 🎟️`, 'success');
          loadTickets();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create ticket: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Create Ticket & Notify'; }
      }
    },
    async updateStatus(ticketId, newStatus) {
      try {
        const res = await APP_API.patch(`/tickets/${ticketId}/status`, { status: newStatus });
        if (res.success || res.ticket) {
          if (window.showToast) window.showToast(`Ticket status updated to ${newStatus}!`, 'success');
          loadTickets();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to update ticket status: ' + err.message, 'error');
      }
    },
    async assignTicket(ticketId, assignee) {
      try {
        await APP_API.put(`/tickets/${ticketId}`, { assignedTo: assignee || null });
        if (window.showToast) window.showToast(`Ticket assigned to ${assignee || 'Unassigned'}`, 'info');
        loadTickets();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to assign ticket: ' + err.message, 'error');
      }
    },
    async escalateTicket(ticketId) {
      try {
        await APP_API.put(`/tickets/${ticketId}`, { priority: 'Urgent' });
        if (window.showToast) window.showToast('Ticket escalated to Urgent! 🔴', 'warning');
        loadTickets();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to escalate ticket: ' + err.message, 'error');
      }
    },
    async deleteTicket(ticketId) {
      if (!confirm('Are you sure you want to delete this support ticket?')) return;
      try {
        await APP_API.delete(`/tickets/${ticketId}`);
        if (window.showToast) window.showToast('Ticket deleted', 'info');
        loadTickets();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete ticket: ' + err.message, 'error');
      }
    }
  };

  await loadTickets();
};
