/**
 * public/manager/modules/tickets.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Interactive Ticket Triage & Scope Change Desk
 * - Status & Priority Filter Pills
 * - 24-Hour Contractor Defect SLA Enforcement (15% Escrow Holdback)
 * - Scope Change Order Triage Desk & Counter-Proposal Drawer
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.tickets = async function(container) {
  let allTickets = [];
  let pendingChangeOrders = [];
  let activeTab = 'tickets'; // 'tickets' | 'change_orders'
  let currentFilter = 'open';
  let searchQuery = '';

  async function loadData() {
    const [tRes, coRes] = await Promise.all([
      MANAGER_API.get('/tickets').catch(() => []),
      MANAGER_API.get('/projects/change-orders/pending').catch(() => ({ pendingChangeOrders: [] }))
    ]);
    allTickets = Array.isArray(tRes) ? tRes : (tRes.tickets || []);
    pendingChangeOrders = coRes.pendingChangeOrders || [];
    render();
  }

  function isContractorDefect(t) {
    const text = `${t.type || ''} ${t.category || ''} ${t.submittedBy || ''} ${t.submitted_by || ''} ${t.title || ''} ${t.description || ''} ${t.source || ''}`.toLowerCase();
    return text.includes('contractor') || text.includes('defect') || text.includes('bug') || text.includes('qc') || t.isContractorDefect || t.slaHoldback;
  }

  function getSlaStatus(t) {
    if (t.slaHoldback || t.status === 'Escalated - Holdback Applied') {
      return { label: '❄️ 15% Holdback Active', class: 'badge-pink', text: 'Escrow Frozen (P0 Breach)' };
    }
    const isResolved = (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed';
    if (isResolved) return { label: '✅ SLA Met', class: 'badge-emerald', text: 'Resolved in SLA' };

    const createdTime = new Date(t.createdAt || t.created_at || t.timestamp || Date.now()).getTime();
    const deadlineTime = createdTime + (24 * 60 * 60 * 1000); // 24-hour SLA
    const diffMs = deadlineTime - Date.now();

    if (diffMs <= 0) {
      return { label: '⚠️ SLA Breached', class: 'badge-pink', text: 'Overdue (>24h)' };
    }
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs < 4) {
      return { label: `🚨 ${diffHrs}h ${diffMins}m Left`, class: 'badge-pink', text: 'Critical Action Req' };
    }
    return { label: `⏳ ${diffHrs}h ${diffMins}m Left`, class: 'badge-amber', text: 'Active 24h Window' };
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
      if (currentFilter === 'defect') return isContractorDefect(t);
      if (currentFilter === 'resolved') return st === 'resolved' || st === 'closed';
      return true;
    });
  }

  function render() {
    const tickets = getFilteredTickets();
    const openCount = allTickets.filter(t => (t.status || 'Open').toLowerCase() === 'open' || (t.status || '').toLowerCase() === 'in progress').length;
    const highPrioCount = allTickets.filter(t => (t.priority || '').toLowerCase() === 'high' || (t.priority || '').toLowerCase() === 'urgent').length;
    const defectTickets = allTickets.filter(t => isContractorDefect(t));
    const defectCount = defectTickets.length;
    const criticalSlaCount = defectTickets.filter(t => {
      if (t.slaHoldback) return true;
      const st = (t.status || '').toLowerCase();
      if (st === 'resolved' || st === 'closed') return false;
      const created = new Date(t.createdAt || t.created_at || Date.now()).getTime();
      return (created + 24 * 3600 * 1000 - Date.now()) < 4 * 3600 * 1000;
    }).length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            🎟️ Pod Triage & Governance Desk
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            24-hour contractor defect SLA triage, scope change order approvals, and warranty governance.
          </div>
        </div>

        <!-- Tab Switcher -->
        <div style="display:flex; gap:0.5rem; background:rgba(0,0,0,0.35); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle);">
          <button id="tabBtnTickets" type="button" class="${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}" style="font-size:0.82rem; padding:0.45rem 0.9rem; border-radius:8px; cursor:pointer;" onclick="window.MGR_TICKETS.switchTab('tickets')">
            🎟️ Support & Defects (${allTickets.length})
          </button>
          <button id="tabBtnChangeOrders" type="button" class="${activeTab === 'change_orders' ? 'btn-primary' : 'btn-secondary'}" style="font-size:0.82rem; padding:0.45rem 0.9rem; border-radius:8px; cursor:pointer;" onclick="window.MGR_TICKETS.switchTab('change_orders')">
            📝 Scope Change Orders (${pendingChangeOrders.length})
          </button>
        </div>
      </div>

      ${activeTab === 'tickets' ? `
        <!-- 24-Hour Contractor Defect SLA Triage Desk -->
        <div class="card-glass" style="margin-bottom:1.5rem; padding:1.25rem; border:1px solid rgba(239,68,68,0.3); background:linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.04)); border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.85rem;">
            <div>
              <div style="font-size:0.72rem; font-weight:800; color:#f87171; text-transform:uppercase; letter-spacing:0.08em;">🛡️ Contractor Quality Governance</div>
              <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0.15rem 0 0 0;">24-Hour Contractor Defect SLA Triage Desk</h3>
            </div>
            <span class="badge ${criticalSlaCount > 0 ? 'badge-pink' : 'badge-emerald'}" style="font-size:0.75rem; padding:0.35rem 0.75rem; font-weight:800;">
              ${criticalSlaCount > 0 ? `🚨 ${criticalSlaCount} SLA Critical / Breached` : '🟢 All Defects Within SLA Window'}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem; font-size:0.82rem;">
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.65rem 0.85rem;">
              <div style="font-size:0.7rem; color:var(--text-muted);">Defect Queue</div>
              <div style="font-size:1.1rem; font-weight:800; color:#fff; margin-top:0.15rem;">${defectCount} Tickets</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.65rem 0.85rem;">
              <div style="font-size:0.7rem; color:var(--text-muted);">SLA Window</div>
              <div style="font-size:1.1rem; font-weight:800; color:#60a5fa; margin-top:0.15rem;">24 Hours Max</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.65rem 0.85rem;">
              <div style="font-size:0.7rem; color:var(--text-muted);">Holdback Policy</div>
              <div style="font-size:1.1rem; font-weight:800; color:#f87171; margin-top:0.15rem;">15% Escrow Freeze</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.65rem 0.85rem;">
              <div style="font-size:0.7rem; color:var(--text-muted);">Warranty Shield</div>
              <div style="font-size:1.1rem; font-weight:800; color:var(--emerald-brand, #10b981); margin-top:0.15rem;">30-Day Zero Cost</div>
            </div>
          </div>
        </div>

        <!-- Filter Pills & Search -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
          <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.25rem;">
            <button class="filter-pill ${currentFilter === 'open' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('open')">
              ⚡ Open & Active (${openCount})
            </button>
            <button id="mgrFilterDefectSla" class="filter-pill ${currentFilter === 'defect' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('defect')">
              🚨 24h Defect SLA (${defectCount})
            </button>
            <button id="mgrFilterHighPrio" class="filter-pill ${currentFilter === 'high' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('high')">
              ⚡ High Priority (${highPrioCount})
            </button>
            <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('all')">
              All Tickets (${allTickets.length})
            </button>
            <button class="filter-pill ${currentFilter === 'resolved' ? 'active' : ''}" onclick="window.MGR_TICKETS.setFilter('resolved')">
              ✅ Resolved
            </button>
          </div>

          <div style="position:relative; width:100%; max-width:280px;">
            <input
              type="text"
              placeholder="🔍 Search tickets..."
              value="${searchQuery}"
              style="width:100%; padding:0.55rem 0.9rem; background:var(--surface-2); border:1px solid var(--border-medium); border-radius:10px; color:var(--text-primary); font-size:0.82rem;"
              oninput="window.MGR_TICKETS.onSearch(this.value)"
            />
          </div>
        </div>

        <!-- Tickets Table -->
        <div class="data-table-container card-glass">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Request Title & Description</th>
                <th>Submitted By / Assignee</th>
                <th>24h SLA Countdown</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Governance Action</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => {
                const isResolved = (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed';
                const isUrgent = (t.priority || '').toLowerCase() === 'urgent' || (t.priority || '').toLowerCase() === 'high';
                const sla = getSlaStatus(t);
                const hasHoldback = Boolean(t.slaHoldback || t.status === 'Escalated - Holdback Applied');
                const contractorId = t.assigned_to || t.assignedTo || 'Contractor Specialist';

                return `
                  <tr>
                    <td style="font-weight:700; color:var(--purple-light); font-size:0.85rem;">
                      ${t.id}
                    </td>
                    <td style="max-width:300px;">
                      <div style="font-weight:700; color:var(--text-primary);">${t.title}</div>
                      <div style="font-size:0.76rem; color:var(--text-secondary); margin-top:0.2rem; line-height:1.4;">
                        ${t.description || 'No additional details provided.'}
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600; color:var(--text-secondary); font-size:0.82rem;">
                        👤 ${t.submittedBy || t.submitted_by || 'Client Partner'}
                      </div>
                      ${t.assigned_to || t.assignedTo ? `
                        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem;">
                          👷 ${t.assigned_to || t.assignedTo}
                        </div>
                      ` : ''}
                    </td>
                    <td>
                      <span class="badge ${sla.class}" style="font-size:0.72rem; padding:0.25rem 0.55rem; font-weight:800;">
                        ${sla.label}
                      </span>
                      <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.2rem;">${sla.text}</div>
                    </td>
                    <td>
                      <span class="badge ${isUrgent ? 'badge-pink' : 'badge-amber'}">
                        ${t.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${isResolved ? 'badge-emerald' : (hasHoldback ? 'badge-pink' : 'badge-purple')}">
                        ${t.status || 'Open'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-start;">
                        ${!isResolved ? `
                          <button class="btn-primary btn-sm" onclick="window.MGR_TICKETS.resolve('${t.id}')">
                            ✅ Resolve
                          </button>
                          ${!hasHoldback && isContractorDefect(t) ? `
                            <button class="btn-secondary btn-sm" style="color:#ef4444; border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); font-size:0.72rem;" onclick="window.MGR_TICKETS.enforceHoldback('${t.id}', '${contractorId}')">
                              ❄️ Enforce 15% Holdback
                            </button>
                          ` : ''}
                          ${hasHoldback ? `
                            <span style="font-size:0.7rem; color:#ef4444; font-weight:800;">🔒 15% Frozen</span>
                          ` : ''}
                        ` : `
                          <span style="font-size:0.75rem; color:var(--emerald-brand); font-weight:700;">Resolved</span>
                        `}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No tickets found for this filter.</td></tr>`}
            </tbody>
          </table>
        </div>
      ` : `
        <!-- Scope Change Orders Triage Desk -->
        <div id="managerChangeOrdersDesk" class="card-glass" style="padding:1.5rem; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1rem;">
            <div>
              <h2 style="font-size:1.25rem; font-weight:800; margin:0; color:#fff; font-family:var(--font-heading);">
                📝 Scope Change Orders Triage Desk
              </h2>
              <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.25rem;">
                Review out-of-scope feature addendums, adjust delivery timelines & fees, and counter-propose to clients.
              </div>
            </div>
            <span class="badge badge-amber" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem;">
              ${pendingChangeOrders.length} Change Orders Pending Review
            </span>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Project & Scope Request</th>
                  <th>Urgency</th>
                  <th>Proposed Fee</th>
                  <th>Timeline Delta</th>
                  <th>Manager Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pendingChangeOrders.map(co => `
                  <tr>
                    <td style="font-weight:700; color:var(--accent-cyan); font-family:var(--font-mono); font-size:0.85rem;">
                      ${co.id || 'CO-001'}
                    </td>
                    <td style="max-width:320px;">
                      <div style="font-weight:800; color:#fff;">${co.title || co.scopeTitle || 'Scope Addendum'}</div>
                      <div style="font-size:0.76rem; color:var(--text-muted); margin-top:0.2rem;">
                        Project: <strong>${co.projectId || 'PRJ-001'}</strong>
                      </div>
                      <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.3rem;">
                        ${co.description || co.requirements || 'No details specified.'}
                      </div>
                    </td>
                    <td>
                      <span class="badge ${co.urgency === 'urgent' ? 'badge-pink' : 'badge-amber'}">
                        ${(co.urgency || 'Standard').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style="font-size:0.95rem; font-weight:800; color:var(--accent-mint); font-family:var(--font-mono);">
                        ৳${Number(co.proposedFeeBDT || co.feeBDT || 25000).toLocaleString()} BDT
                      </div>
                    </td>
                    <td>
                      <div style="font-size:0.9rem; font-weight:700; color:#fff; font-family:var(--font-mono);">
                        +${co.estimatedDays || co.timelineDeltaDays || 5} Days
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.MGR_TICKETS.openAdjustModal('${co.projectId}', '${co.id}', ${co.proposedFeeBDT || co.feeBDT || 25000}, ${co.estimatedDays || 5})">
                          ✏️ Counter-Propose
                        </button>
                        <button class="btn-primary btn-sm" style="font-size:0.75rem;" onclick="window.MGR_TICKETS.approveChangeOrder('${co.projectId}', '${co.id}')">
                          ✓ Fast-Track Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('') || `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">
                      ✅ Zero pending change orders across all autonomous delivery pods.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      `}

      <!-- Counter-Proposal Adjustment Modal -->
      <div id="mgrCoAdjustModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:1rem;">
        <div class="card-glass" style="max-width:480px; width:100%; border:1px solid var(--accent-cyan); padding:1.75rem; border-radius:16px;">
          <h3 style="font-size:1.2rem; font-weight:800; margin:0 0 0.5rem; color:#fff;">✏️ Adjust Scope Counter-Proposal</h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1.25rem;">
            Adjust fee and timeline for the client addendum. The client will be notified to accept the revised invoice.
          </p>

          <input type="hidden" id="mgrCoAdjProjId">
          <input type="hidden" id="mgrCoAdjOrderId">

          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:0.78rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.35rem;">
              Adjusted Addendum Fee (BDT ৳) *
            </label>
            <input type="number" id="mgrCoAdjustFee" min="1000" step="500" style="width:100%; padding:0.65rem 0.85rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; font-family:var(--font-mono); font-weight:700; box-sizing:border-box;">
          </div>

          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:0.78rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.35rem;">
              Timeline Delta (Days to Add) *
            </label>
            <input type="number" id="mgrCoAdjustTimeline" min="1" max="60" style="width:100%; padding:0.65rem 0.85rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; font-family:var(--font-mono); font-weight:700; box-sizing:border-box;">
          </div>

          <div style="margin-bottom:1.5rem;">
            <label style="display:block; font-size:0.78rem; font-weight:800; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.35rem;">
              Technical Justification & Pod Lead Notes
            </label>
            <textarea id="mgrCoAdjustNotes" rows="3" placeholder="Explain rationale for additional timeline or compute requirements..." style="width:100%; padding:0.65rem 0.85rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <button type="button" class="btn-secondary" onclick="window.MGR_TICKETS.closeAdjustModal()">Cancel</button>
            <button type="button" class="btn-primary" id="mgrCoSubmitAdjustBtn" onclick="window.MGR_TICKETS.submitAdjustProposal()">
              Submit Counter-Proposal
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.MGR_TICKETS = {
    switchTab(tab) {
      activeTab = tab;
      render();
    },
    onSearch(q) {
      searchQuery = (q || '').trim().toLowerCase();
      render();
    },
    setFilter(f) {
      currentFilter = f;
      render();
    },
    async resolve(id) {
      try {
        await MANAGER_API.patch(`/tickets/${id}`, { status: 'Resolved' });
        showManagerToast('Ticket marked as resolved! 🎟️');
        loadData();
      } catch (e) {
        showManagerToast('Failed to update ticket', 'error');
      }
    },
    async enforceHoldback(ticketId, contractorId) {
      const ok = confirm(`Executing holdback will freeze 15% of contractor milestone funds via /api/tickets/${ticketId}/sla-holdback until QA confirms hotfix. Proceed?`);
      if (!ok) return;

      try {
        const res = await MANAGER_API.post(`/tickets/${ticketId}/sla-holdback`, {
          holdbackPercent: 15,
          reason: 'Critical P0 Warranty Defect SLA Breach',
          contractorId: contractorId || 'Contractor Specialist'
        });

        if (res && (res.ok || res.success)) {
          showManagerToast('15% Contractor Escrow Holdback Enforced! ❄️');
          loadData();
        } else {
          throw new Error(res?.error || 'Holdback execution failed');
        }
      } catch (err) {
        showManagerToast('Holdback Error: ' + err.message, 'error');
      }
    },
    openAdjustModal(projectId, orderId, curFee, curDays) {
      document.getElementById('mgrCoAdjProjId').value = projectId;
      document.getElementById('mgrCoAdjOrderId').value = orderId;
      document.getElementById('mgrCoAdjustFee').value = curFee || 25000;
      document.getElementById('mgrCoAdjustTimeline').value = curDays || 5;
      document.getElementById('mgrCoAdjustNotes').value = '';
      const modal = document.getElementById('mgrCoAdjustModal');
      if (modal) modal.style.display = 'flex';
    },
    closeAdjustModal() {
      const modal = document.getElementById('mgrCoAdjustModal');
      if (modal) modal.style.display = 'none';
    },
    async submitAdjustProposal() {
      const projId = document.getElementById('mgrCoAdjProjId').value;
      const orderId = document.getElementById('mgrCoAdjOrderId').value;
      const proposedFeeBDT = parseFloat(document.getElementById('mgrCoAdjustFee').value);
      const estimatedDays = parseInt(document.getElementById('mgrCoAdjustTimeline').value, 10);
      const notes = document.getElementById('mgrCoAdjustNotes').value.trim();

      if (!proposedFeeBDT || !estimatedDays) {
        return alert('Please specify valid fee and timeline delta.');
      }

      const btn = document.getElementById('mgrCoSubmitAdjustBtn');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      try {
        const res = await MANAGER_API.put(`/projects/${encodeURIComponent(projId)}/change-order/${encodeURIComponent(orderId)}/adjust`, {
          proposedFeeBDT,
          estimatedDays,
          notes
        });

        if (res && (res.ok || res.success)) {
          showManagerToast('Counter-proposal dispatched to client! 📝');
          window.MGR_TICKETS.closeAdjustModal();
          loadData();
        } else {
          throw new Error(res?.error || 'Failed to adjust change order');
        }
      } catch (err) {
        alert('Counter-proposal Error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Counter-Proposal';
      }
    },
    async approveChangeOrder(projectId, orderId) {
      if (!confirm('Fast-track approve this scope change order and issue milestone invoice addendum?')) return;
      try {
        const res = await MANAGER_API.post(`/projects/${encodeURIComponent(projectId)}/change-order/${encodeURIComponent(orderId)}/approve`, {});
        if (res && (res.ok || res.success)) {
          showManagerToast('Change order approved and addendum issued! 🚀');
          loadData();
        } else {
          throw new Error(res?.error || 'Approval failed');
        }
      } catch (err) {
        showManagerToast('Approval Error: ' + err.message, 'error');
      }
    }
  };

  await loadData();
};

