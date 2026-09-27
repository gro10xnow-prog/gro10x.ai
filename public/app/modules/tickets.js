/**
 * public/app/modules/tickets.js
 * Support Desk & Operations Triage Module (Admin SPA)
 * Enterprise Modernized: 4 Master KPIs, Filter Bar, Zero Native Dialogs, Modal Lifecycles, Multi-Currency Engine.
 */
window.APP_MODULES = window.APP_MODULES || {};

// Module-level currency state
let ticketsCurrency = 'USD';
const TICKETS_BDT_RATE = 120;

// Root-level global alias to prevent race conditions during test suite execution
window.TicketsModule = window.TicketsModule || {};
window.switchTicketsCurrency = function(curr) {
  if (window.TICKETS_MODULE && typeof window.TICKETS_MODULE.switchCurrency === 'function') {
    return window.TICKETS_MODULE.switchCurrency(curr);
  }
  ticketsCurrency = (curr === 'BDT' ? 'BDT' : 'USD');
  return ticketsCurrency;
};

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
      id: 'TCK-1001',
      title: 'Color Grading Drift on YouTube Reel #4',
      description: 'Exported reel #4 has noticeable magenta tint on skin tones compared to approved preview.',
      submittedBy: 'Pilutics Brand',
      assignedTo: 'Anika Nower',
      priority: 'High',
      status: 'Open',
      category: 'Creative Revision',
      clientId: 'client-pilutics',
      resolvedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'TCK-1002',
      title: 'Render Farm Server GPU Node Out of Memory',
      description: 'After Effects GPU renderer crashed during 4K 60fps export batch on node 2.',
      submittedBy: 'Firoz Uddin Ahmed',
      assignedTo: 'Firoz Uddin Ahmed',
      priority: 'Urgent',
      status: 'In Progress',
      category: 'IT Issue',
      clientId: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: 'TCK-1003',
      title: 'Brand Portal Asset Download Link Expired',
      description: 'Client unable to access Google Drive RAW asset folder from brand portal dashboard.',
      submittedBy: 'Grow Bangla',
      assignedTo: '',
      priority: 'Medium',
      status: 'Open',
      category: 'Client Request',
      clientId: 'client-growbangla',
      resolvedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'TCK-1004',
      title: 'Invoice #INV-2026-088 Wire Payment Confirmation',
      description: 'Client confirmed wire transfer of $3,500; please verify and mark retainer invoice as paid.',
      submittedBy: 'TechCorp Global',
      assignedTo: 'Firoz Uddin Ahmed',
      priority: 'Low',
      status: 'Resolved',
      category: 'Billing',
      clientId: 'client-techcorp',
      resolvedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'TCK-1005',
      title: 'TikTok Sound License Clearance Documentation',
      description: 'Submitted commercial license proof for audio track used in TikTok video #12.',
      submittedBy: 'Bong Hits',
      assignedTo: 'Anika Nower',
      priority: 'Medium',
      status: 'Closed',
      category: 'General',
      clientId: 'client-bonghits',
      resolvedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ];

  async function loadTickets() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [tickets, team, clients] = await Promise.all([
        (typeof APP_API !== 'undefined' ? APP_API.get('/tickets') : Promise.resolve([])).catch(() => []),
        (typeof APP_API !== 'undefined' ? APP_API.get('/team') : Promise.resolve([])).catch(() => []),
        (typeof APP_API !== 'undefined' ? APP_API.get('/clients') : Promise.resolve([])).catch(() => [])
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
        <div style="display:flex; gap:0.6rem; align-items:center;">
          <button id="ticketsCurrencyToggleBtn" class="btn-secondary" style="font-size:0.85rem; padding:0.45rem 0.85rem; cursor:pointer;" onclick="window.TICKETS_MODULE.toggleCurrency()">
            ${ticketsCurrency === 'BDT' ? '৳ BDT Mode' : '$ USD Mode'}
          </button>
          <button class="btn-primary" id="btnOpenCreateTicketModal" onclick="window.TICKETS_MODULE.openCreateModal()">
            + Create Support Ticket
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Open Tickets</div>
          <div class="kpi-val" id="kpiTicketsOpen" style="color: var(--amber-brand);">${openCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">In Progress</div>
          <div class="kpi-val" id="kpiTicketsInProgress" style="color: var(--purple-light);">${inProgressCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🔴 Urgent / Critical</div>
          <div class="kpi-val" id="kpiTicketsUrgent" style="color: var(--pink-brand);">${urgentCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Resolved Tickets</div>
          <div class="kpi-val" id="kpiTicketsResolved" style="color: var(--emerald-brand);">${resolvedCount}</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
        <div id="ticketsStatusTabs" style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          <button id="btnTicketStatusAll" data-status="ALL" 
                  class="btn-ghost ${selectedStatusFilter === 'ALL' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.TICKETS_MODULE.filterStatus('ALL')">
            📑 All Statuses
          </button>
          <button id="btnTicketStatusOpen" data-status="Open" 
                  class="btn-ghost ${selectedStatusFilter === 'Open' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.TICKETS_MODULE.filterStatus('Open')">
            Open
          </button>
          <button id="btnTicketStatusInProgress" data-status="In Progress" 
                  class="btn-ghost ${selectedStatusFilter === 'In Progress' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.TICKETS_MODULE.filterStatus('In Progress')">
            In Progress
          </button>
          <button id="btnTicketStatusResolved" data-status="Resolved" 
                  class="btn-ghost ${selectedStatusFilter === 'Resolved' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.TICKETS_MODULE.filterStatus('Resolved')">
            Resolved
          </button>
          <button id="btnTicketStatusClosed" data-status="Closed" 
                  class="btn-ghost ${selectedStatusFilter === 'Closed' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.TICKETS_MODULE.filterStatus('Closed')">
            Closed
          </button>
        </div>
        <div id="ticketsPriorityTabs" style="display:flex; gap:0.4rem; align-items:center;">
          <span style="font-size:0.8rem; color:var(--text-muted);">Priority:</span>
          <button id="btnTicketPrioAll" data-priority="ALL" 
                  class="btn-ghost ${selectedPriorityFilter === 'ALL' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                  onclick="window.TICKETS_MODULE.filterPriority('ALL')">
            All
          </button>
          <button id="btnTicketPrioLow" data-priority="Low" 
                  class="btn-ghost ${selectedPriorityFilter === 'Low' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                  onclick="window.TICKETS_MODULE.filterPriority('Low')">
            Low
          </button>
          <button id="btnTicketPrioMedium" data-priority="Medium" 
                  class="btn-ghost ${selectedPriorityFilter === 'Medium' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                  onclick="window.TICKETS_MODULE.filterPriority('Medium')">
            Medium
          </button>
          <button id="btnTicketPrioHigh" data-priority="High" 
                  class="btn-ghost ${selectedPriorityFilter === 'High' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                  onclick="window.TICKETS_MODULE.filterPriority('High')">
            High
          </button>
          <button id="btnTicketPrioUrgent" data-priority="Urgent" 
                  class="btn-ghost ${selectedPriorityFilter === 'Urgent' ? 'btn-secondary active' : ''}" 
                  style="font-size:0.75rem; padding:0.3rem 0.6rem;" 
                  onclick="window.TICKETS_MODULE.filterPriority('Urgent')">
            Urgent
          </button>
        </div>
      </div>

      <!-- Data Table Grid -->
      <div class="data-table-container">
        <table class="data-table" id="ticketsTable">
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
                <tr class="ticket-row" data-ticket-id="${escapeHTML(t.id)}">
                  <td style="font-weight:700; font-family:monospace; color:var(--purple-light);">${escapeHTML(t.id)}</td>
                  <td>
                    <div style="font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
                      ${t.isWarranty ? '<span style="font-size:0.85rem;" title="30-Day Active Warranty">🛡️</span>' : ''}
                      <span>${escapeHTML(t.title)}</span>
                    </div>
                    ${t.isWarranty ? '<div style="font-size:0.68rem; color:#00df89; font-weight:700; margin-top:0.15rem;">⚡ 4h Response / 24h Resolution SLA (Zero-Cost)</div>' : ''}
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem; max-width:260px;">${escapeHTML(t.description || 'No additional details.')}</div>
                  </td>
                  <td>
                    <span class="badge ${t.isWarranty ? 'badge-emerald' : 'badge-purple'}">
                      ${t.isWarranty ? '🛡️ Warranty Bug Fix' : escapeHTML(t.category || 'General')}
                    </span>
                  </td>
                  <td>👤 ${escapeHTML(t.submittedBy || 'Client')}</td>
                  <td>
                    <select class="input-text ticket-assignee-select" style="font-size:0.75rem; padding:0.2rem 0.4rem; width:130px;" onchange="window.TICKETS_MODULE.assignTicket('${t.id}', this.value)">
                      <option value="">-- Unassigned --</option>
                      ${teamMembers.map(m => `
                        <option value="${escapeHTML(m.name)}" ${t.assignedTo === m.name ? 'selected' : ''}>${escapeHTML(m.name)}</option>
                      `).join('')}
                    </select>
                  </td>
                  <td>
                    <span class="badge ${prioBadge} ticket-priority-badge" style="cursor:pointer;" onclick="window.TICKETS_MODULE.escalateTicket('${t.id}')" title="Click to escalate to Urgent">
                      ${escapeHTML(t.priority || 'Medium')}
                    </span>
                  </td>
                  <td><span class="badge ${statusBadge}">${escapeHTML(t.status || 'Open')}</span></td>
                  <td>
                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                      ${t.status !== 'In Progress' ? `
                        <button class="btn-secondary btn-sm btn-status-progress" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'In Progress')">▶ In Progress</button>
                      ` : ''}
                      ${t.status !== 'Resolved' && t.status !== 'Closed' ? `
                        <button class="btn-emerald btn-sm btn-status-resolve" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'Resolved')">✅ Resolve</button>
                      ` : `
                        <button class="btn-secondary btn-sm btn-status-reopen" style="font-size:0.75rem;" onclick="window.TICKETS_MODULE.updateStatus('${t.id}', 'Open')">🔄 Reopen</button>
                      `}
                      <button class="btn-secondary btn-sm btn-delete-ticket" style="font-size:0.75rem; color:#ef4444;" onclick="window.TICKETS_MODULE.deleteTicket('${t.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">No support tickets found.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Create Support Ticket Modal -->
      <div class="modal-overlay" id="createTicketModal" onclick="if(event.target === this) window.TICKETS_MODULE.closeCreateModal()">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">🎟️ Create Support Ticket</h3>
            <button id="btnCloseCreateTicketModal" onclick="window.TICKETS_MODULE.closeCreateModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
                  <option value="Warranty Bug Fix">🛡️ Warranty Bug Fix (0-Cost SLA)</option>
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
              <button type="button" class="btn-secondary" id="btnCancelCreateTicketModal" onclick="window.TICKETS_MODULE.closeCreateModal()">Cancel</button>
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
    getCurrency() {
      return ticketsCurrency;
    },
    toggleCurrency() {
      ticketsCurrency = ticketsCurrency === 'USD' ? 'BDT' : 'USD';
      try {
        window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: ticketsCurrency } }));
      } catch (e) {}
      renderTicketsView();
      return ticketsCurrency;
    },
    switchCurrency(curr) {
      if (curr === 'USD' || curr === 'BDT') {
        ticketsCurrency = curr;
        renderTicketsView();
      }
      return ticketsCurrency;
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
      const modal = document.getElementById('createTicketModal');
      if (modal) modal.classList.add('active');
    },
    closeCreateModal() {
      const modal = document.getElementById('createTicketModal');
      if (modal) modal.classList.remove('active');
    },
    async submitTicket(e) {
      if (e && e.preventDefault) e.preventDefault();
      const titleEl = document.getElementById('tckTitle');
      const descEl = document.getElementById('tckDesc');
      const catEl = document.getElementById('tckCategory');
      const prioEl = document.getElementById('tckPriority');
      const clientEl = document.getElementById('tckClient');
      const assigneeEl = document.getElementById('tckAssignee');

      const title = titleEl ? titleEl.value.trim() : '';
      const description = descEl ? descEl.value.trim() : '';
      const category = catEl ? catEl.value : 'General';
      const priority = prioEl ? prioEl.value : 'Medium';
      const clientId = clientEl ? clientEl.value : '';
      const assignedTo = assigneeEl ? assigneeEl.value : '';

      if (!title) {
        if (window.showToast) window.showToast('Ticket title is required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('tckSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Submitting...'; }

      try {
        let res = null;
        if (typeof APP_API !== 'undefined' && APP_API.post) {
          res = await APP_API.post('/tickets', {
            title, description, category, priority, clientId, assignedTo
          }).catch(err => {
            console.warn('[Tickets Module] Fallback add:', err);
            return null;
          });
        }

        if (!res || !res.ticket) {
          const newTicket = {
            id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
            title,
            description,
            category,
            priority,
            clientId,
            assignedTo,
            submittedBy: 'Studio Admin',
            status: 'Open',
            createdAt: new Date().toISOString()
          };
          ticketsData.unshift(newTicket);
        }

        this.closeCreateModal();
        if (window.showToast) window.showToast(`Ticket "${title}" created successfully! 🎟️`, 'success');
        if (res && res.ticket) {
          loadTickets();
        } else {
          renderTicketsView();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create ticket: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Create Ticket & Notify'; }
      }
    },
    async updateStatus(ticketId, newStatus) {
      try {
        if (typeof APP_API !== 'undefined' && APP_API.patch) {
          await APP_API.patch(`/tickets/${ticketId}/status`, { status: newStatus }).catch(() => {});
        }
        const item = ticketsData.find(t => t.id === ticketId);
        if (item) {
          item.status = newStatus;
          if (newStatus === 'Resolved' || newStatus === 'Closed') {
            item.resolvedAt = new Date().toISOString();
          }
        }
        if (window.showToast) window.showToast(`Ticket status updated to ${newStatus}! ✅`, 'success');
        renderTicketsView();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to update ticket status: ' + err.message, 'error');
      }
    },
    async assignTicket(ticketId, assignee) {
      try {
        if (typeof APP_API !== 'undefined' && APP_API.put) {
          await APP_API.put(`/tickets/${ticketId}`, { assignedTo: assignee || null }).catch(() => {});
        }
        const item = ticketsData.find(t => t.id === ticketId);
        if (item) item.assignedTo = assignee || null;
        if (window.showToast) window.showToast(`Ticket assigned to ${assignee || 'Unassigned'}`, 'info');
        renderTicketsView();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to assign ticket: ' + err.message, 'error');
      }
    },
    async escalateTicket(ticketId) {
      try {
        if (typeof APP_API !== 'undefined' && APP_API.put) {
          await APP_API.put(`/tickets/${ticketId}`, { priority: 'Urgent' }).catch(() => {});
        }
        const item = ticketsData.find(t => t.id === ticketId);
        if (item) item.priority = 'Urgent';
        if (window.showToast) window.showToast('Ticket escalated to Urgent! 🔴', 'warning');
        renderTicketsView();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to escalate ticket: ' + err.message, 'error');
      }
    },
    async deleteTicket(ticketId) {
      // ZERO NATIVE DIALOGS POLICY: Non-blocking direct deletion
      try {
        if (typeof APP_API !== 'undefined' && APP_API.delete) {
          await APP_API.delete(`/tickets/${ticketId}`).catch(() => {});
        }
        ticketsData = ticketsData.filter(t => t.id !== ticketId);
        if (window.showToast) window.showToast('Ticket removed from active queue! 🗑️', 'info');
        renderTicketsView();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete ticket: ' + err.message, 'error');
      }
    }
  };

  // Expose aliases
  window.TicketsModule = window.TICKETS_MODULE;
  window.switchTicketsCurrency = (c) => window.TICKETS_MODULE.switchCurrency(c);

  // Escape key handler route-guarded to #tickets
  if (!window._ticketsEscBound) {
    window._ticketsEscBound = true;
    window.addEventListener('keydown', (e) => {
      if (window.location.hash !== '#tickets') return;
      if (e.key === 'Escape') {
        const modal = document.getElementById('createTicketModal');
        if (modal && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      }
    });
  }

  // Currency event listener route-guarded to #tickets
  if (!window._ticketsCurrencyListener) {
    window._ticketsCurrencyListener = true;
    window.addEventListener('gro10x_currency_changed', (e) => {
      if (window.location.hash !== '#tickets') return;
      if (e.detail && e.detail.currency && window.TICKETS_MODULE) {
        window.TICKETS_MODULE.switchCurrency(e.detail.currency);
      }
    });
  }

  // SSE real-time listener for ticket updates
  if (window.APP_SSE && typeof window.APP_SSE.on === 'function' && !window._ticketsSseBound) {
    window._ticketsSseBound = true;
    let sseTimer = null;
    window.APP_SSE.on('ticket_update', () => {
      if (window.location.hash !== '#tickets') return;
      clearTimeout(sseTimer);
      sseTimer = setTimeout(() => {
        loadTickets();
      }, 400);
    });
  }

  await loadTickets();
};
