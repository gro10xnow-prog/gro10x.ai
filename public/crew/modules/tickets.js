/**
 * public/crew/modules/tickets.js
 * Technical Support Tickets & Deployment Logger for Full-Stack Devs
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.advanceCrewTicket = async function(ticketId, newStatus, btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Updating...';

  try {
    const res = await CREW_API.patch(`/tickets/${ticketId}/status`, { status: newStatus });
    if (res && (res.success !== false && !res.error)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast(`Ticket marked as ${newStatus}! 🛠️`);
      }
      const viewContainer = document.getElementById('crew-view');
      if (viewContainer && window.CREW_MODULES.tickets) {
        window.CREW_MODULES.tickets(viewContainer);
      }
    } else {
      throw new Error(res?.error || 'Failed to update ticket');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = original;
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.submitCrewDeployLog = async function(passedEmpCode, passedEmpName) {
  const btn = document.getElementById('deploySubmitBtn');
  const empCode = passedEmpCode || btn?.dataset?.empCode || '';
  const empName = passedEmpName || btn?.dataset?.empName || '';

  const env = document.getElementById('deployEnv')?.value || 'Production';
  const notes = document.getElementById('deployNotes')?.value?.trim();
  const prLink = document.getElementById('deployPR')?.value?.trim();

  if (!notes) {
    if (typeof window.showCrewToast === 'function') window.showCrewToast('Please enter deployment description/notes.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Logging Deployment...';
  }

  try {
    const summaryText = `🚀 Deployed to ${env}: ${notes}${prLink ? ` (PR: ${prLink})` : ''}`;
    const res = await CREW_API.post('/team/eod', {
      employeeId: empCode,
      name: empName,
      summary: summaryText,
      tasks_done: summaryText,
      tasksTomorrow: 'Monitoring deploy telemetry & logs',
      blockers: 'None',
      mood: '🔥 Fired Up',
      hours: 1
    });

    if (res && (res.success !== false && !res.error)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('Deployment logged successfully! 🚀 (+10 XP)');
      }
      document.getElementById('deployNotes').value = '';
      if (document.getElementById('deployPR')) document.getElementById('deployPR').value = '';
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Log Deployment';
      }
    } else {
      throw new Error(res?.error || 'Failed to log deployment');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Log Deployment';
    }
    if (typeof window.showCrewToast === 'function') window.showCrewToast(`Error: ${err.message}`, 'error');
  }
};

window.CREW_MODULES.tickets = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id || '';
  const empName = (user.name || '').trim();
  const firstName = empName.length > 1 ? empName.split(' ')[0].toLowerCase() : '';

  const tickets = await CREW_API.get('/tickets').catch(() => []);
  const myTickets = (tickets || []).filter(t => {
    if (empCode && (t.assignedToId === empCode || t.submittedById === empCode || t.employee_id === empCode)) return true;
    if (firstName && ((t.assignedTo || '').toLowerCase().includes(firstName) || (t.submittedBy || '').toLowerCase().includes(firstName))) return true;
    if (empCode && ((t.category || '').toLowerCase().includes('tech') || (t.category || '').toLowerCase().includes('it'))) return true;
    return false;
  });

  const STATUS_STYLES = {
    'Open': { badge: 'badge-purple', next: 'In Progress' },
    'In Progress': { badge: 'badge-purple', next: 'Resolved' },
    'Resolved': { badge: 'badge-emerald', next: null },
    'Closed': { badge: 'badge-emerald', next: null }
  };

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎟️ Tech Tickets & Deploy Log</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Manage assigned engineering tickets and log infrastructure releases.</div>
      </div>
    </div>

    <!-- Quick Deploy Log Card -->
    <div class="card-glass" style="padding:1.5rem; margin-bottom:1.5rem; border:1px solid rgba(139,92,246,0.3);">
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
        <span style="font-size:1.3rem;">🚀</span>
        <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin:0; color:#fff;">Log Technical Deployment</h2>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem; margin-bottom:0.75rem;">
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Target Environment</label>
          <select id="deployEnv" style="width:100%; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
            <option value="Production">🔴 Production</option>
            <option value="Staging">🟡 Staging</option>
            <option value="Development">🟢 Development</option>
          </select>
        </div>
        <div>
          <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">GitHub PR / Commit URL (Optional)</label>
          <input type="url" id="deployPR" placeholder="https://github.com/..." style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Release Notes / What was deployed? <span style="color:#ef4444;">*</span></label>
        <input type="text" id="deployNotes" placeholder="e.g. Fixed SSE reconnection retry logic & patched profile API" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem; color:#fff; font-family:inherit; font-size:0.85rem; box-sizing:border-box;">
      </div>

      <button id="deploySubmitBtn" class="btn-primary" style="font-size:0.85rem; padding:0.55rem 1.25rem; border-radius:10px; cursor:pointer;" data-emp-code="${empCode}" data-emp-name="${(empName || '').replace(/"/g, '&quot;')}" onclick="submitCrewDeployLog()">
        🚀 Log Deployment (+10 XP)
      </button>
    </div>

    <!-- Active Tickets Queue -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
      <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin:0; color:#fff;">Assigned Engineering Tickets (${myTickets.length})</h2>
    </div>

    <div style="display:flex; flex-direction:column; gap:0.85rem;">
      ${myTickets.map(t => {
        const conf = STATUS_STYLES[t.status] || { badge: 'badge-purple', next: 'Resolved' };
        const isResolved = t.status === 'Resolved' || t.status === 'Closed';
        const priorityColor = (t.priority || '').toLowerCase() === 'urgent' || (t.priority || '').toLowerCase() === 'high' ? '#ef4444' : 'var(--purple-light)';

        return `
          <div class="card-glass" style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; padding:1.25rem;">
            <div style="flex:1; min-width:240px;">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
                <span class="badge ${conf.badge}" style="font-size:0.7rem;">${t.status || 'Open'}</span>
                <span style="font-size:0.75rem; color:${priorityColor}; font-weight:700;">⚡ ${t.priority || 'Normal'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">🏷️ ${t.category || 'Engineering'}</span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem;">${t.title}</div>
              <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.3rem; line-height:1.4;">${t.description || 'No additional details provided.'}</div>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem;">
              ${conf.next ? `
                <button class="btn-primary" style="font-size:0.78rem; padding:0.4rem 0.85rem; white-space:nowrap;" onclick="advanceCrewTicket('${t.id}', '${conf.next}', this)">
                  → Move to ${conf.next}
                </button>
              ` : `
                <span class="badge badge-emerald" style="padding:0.4rem 0.75rem;">✅ Complete</span>
              `}
            </div>
          </div>
        `;
      }).join('') || `
        <div class="card-glass" style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎟️</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem;">No Active Tickets</div>
          <div style="font-size:0.85rem; margin-top:0.3rem;">You have zero open engineering or bug tickets assigned.</div>
        </div>
      `}
    </div>
  `;
};
