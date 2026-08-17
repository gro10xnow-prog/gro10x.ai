/**
 * public/app/modules/dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Executive Command Dashboard Module (Admin SPA Integration)
 * Pulls from 10 live platform APIs (financials, CRM, tasks, team, attendance,
 * EODs, expenses, clients, tickets, leads) and renders full executive command.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dashboard = async function(container) {
  try {
    const [
      teamRes,
      attRes,
      leaveRes,
      eodRes,
      workloadRes,
      taskRes,
      invRes,
      expRes,
      clientRes,
      leadRes
    ] = await Promise.all([
      APP_API.get('/team').catch(() => []),
      APP_API.get('/team/attendance').catch(() => []),
      APP_API.get('/leaves').catch(() => []),
      APP_API.get('/team/eod').catch(() => []),
      APP_API.get('/team/workload').catch(() => []),
      APP_API.get('/tasks').catch(() => []),
      APP_API.get('/invoices').catch(() => []),
      APP_API.get('/expenses').catch(() => []),
      APP_API.get('/clients').catch(() => []),
      APP_API.get('/leads').catch(() => [])
    ]);

    const team = teamRes || [];
    const attendance = attRes || [];
    const leaves = leaveRes || [];
    const eods = eodRes || [];
    const tasks = taskRes || [];
    const invoices = invRes || [];
    const expenses = expRes || [];
    const clients = clientRes || [];
    const leads = leadRes || [];

    // Financial Metrics
    const paidInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'paid');
    const paidTotal = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pendingInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'sent' || (i.status || '').toLowerCase() === 'pending');
    const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const overdueInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'overdue');
    const overdueTotal = overdueInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const collectionRate = totalBilled > 0 ? Math.round((paidTotal / totalBilled) * 100) : 100;

    // Expenses
    const pendingExps = expenses.filter(e => {
      const st = (e.status || '').toLowerCase();
      return st.includes('pending') || !e.tier1?.approved || !e.tier2?.approved;
    });
    const pendingExpTotal = pendingExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Operations
    const inStudioCount = team.filter(t => t.status === 'In Studio' || attendance.some(a => a.employee_id === (t.emp_code || t.id) && a.status === 'In Studio')).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEods = eods.filter(e => (e.report_date || '').startsWith(todayStr) || (e.created_at || '').startsWith(todayStr));
    const openTasks = tasks.filter(t => t.stage !== 'Approved' && t.stage !== 'Published' && t.stage !== 'Completed');
    const pendingLeavesList = leaves.filter(l => (l.status || '').toLowerCase().includes('pending'));
    const totalLeadVal = leads.reduce((sum, l) => {
      const val = parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);

    container.innerHTML = `
      <!-- Hero Header -->
      <div style="background: linear-gradient(135deg, rgba(190, 24, 93, 0.16), rgba(147, 51, 234, 0.12)); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading); margin: 0 0 0.25rem; color: var(--text-main);">
            Good Morning, Executive 👋
          </h1>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Live executive command center · Real-time financial, operational & roster status.
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <a href="#kanban" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">📋 New Task</a>
          <a href="#finance" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">🧾 New Invoice</a>
          <a href="#hr" class="btn-primary" style="font-size: 0.8rem; text-decoration: none;">👥 Manage Team</a>
        </div>
      </div>

      <!-- ROW 1: FINANCIAL COMMAND STRIP -->
      <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">
        💵 Financial Command Summary
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Monthly Revenue</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${paidTotal.toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">💰 Settled Invoices</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Outstanding Receivables</div>
          <div class="kpi-val" style="color: var(--amber-brand);">৳${pendingTotal.toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">⏳ Pending Invoices</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Overdue Invoices</div>
          <div class="kpi-val" style="color: ${overdueInvoices.length > 0 ? '#ef4444' : 'var(--text-main)'};">${overdueInvoices.length}</div>
          <div style="font-size: 0.72rem; color: ${overdueInvoices.length > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">
            ${overdueInvoices.length > 0 ? `🔴 ৳${overdueTotal.toLocaleString()} Overdue` : '🟢 All Clear'}
          </div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Pending Expense Claims</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingExps.length}</div>
          <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">৳${pendingExpTotal.toLocaleString()} Awaiting Review</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Collection Rate</div>
          <div class="kpi-val" style="color: var(--purple-light);">${collectionRate}%</div>
          <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700;">📈 Paid vs Billed</div>
        </div>
      </div>

      <!-- ROW 2: OPERATIONS COMMAND STRIP -->
      <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">
        ⚙️ Operations & Capacity Summary
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Team On Duty Today</div>
          <div class="kpi-val">${inStudioCount} / ${team.length}</div>
          <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">🟢 Live Clocked-In Roster</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">EOD Report Submissions</div>
          <div class="kpi-val">${todayEods.length} / ${team.length}</div>
          <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700;">📋 Submitted Today</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Active Production Tasks</div>
          <div class="kpi-val">${openTasks.length}</div>
          <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700;">🎬 Open Workflows</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Pending Leaves</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingLeavesList.length}</div>
          <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">🏖️ Awaiting Review</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Pipeline Lead Value</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${totalLeadVal.toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">🚀 CRM Sales Funnel</div>
        </div>
      </div>

      <!-- MAIN GRID 1: FINANCIAL & SALES -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">💳 Financials & Invoices Summary</h3>
            <a href="#finance" style="font-size: 0.75rem; color: var(--pink-brand); text-decoration: none; font-weight: 700;">View Finance →</a>
          </div>
          ${invoices.length === 0 ? `
            <div class="empty-state" style="padding: 1.5rem;">
              <div class="empty-state-icon">🧾</div>
              <div class="empty-state-title">No Invoices Logged</div>
              <div class="empty-state-desc">Create your first client invoice in the Financials portal.</div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 0.8rem;">
                <thead>
                  <tr><th>Invoice ID</th><th>Client</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${invoices.slice(0, 5).map(i => `
                    <tr>
                      <td><strong>${escapeHTML(i.id)}</strong></td>
                      <td>${escapeHTML(i.clientName || i.client || 'Client')}</td>
                      <td><strong>৳${(Number(i.amount) || 0).toLocaleString()}</strong></td>
                      <td><span class="badge ${i.status === 'Paid' ? 'badge-emerald' : i.status === 'Overdue' ? 'badge-pink' : 'badge-amber'}">${escapeHTML(i.status || 'Pending')}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">🎯 Lead Acquisition Funnel</h3>
            <a href="#leads" style="font-size: 0.75rem; color: var(--pink-brand); text-decoration: none; font-weight: 700;">View CRM →</a>
          </div>
          ${leads.length === 0 ? `
            <div class="empty-state" style="padding: 1.5rem;">
              <div class="empty-state-icon">🎯</div>
              <div class="empty-state-title">No CRM Leads Captured</div>
              <div class="empty-state-desc">Incoming leads from the website and campaigns will appear here.</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${['New Inquiry', 'Contacted', 'Proposal Sent', 'Won'].map(st => {
                const count = leads.filter(l => l.stage === st || (st === 'Won' && l.stage === 'Closed Won')).length;
                const pct = Math.round((count / Math.max(1, leads.length)) * 100);
                return `
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; margin-bottom:0.2rem;">
                      <span style="color: var(--text-primary);">${st}</span>
                      <span style="color:var(--pink-brand);">${count} leads (${pct}%)</span>
                    </div>
                    <div style="width:100%; height:8px; background:var(--surface-3); border-radius:999px; overflow:hidden;">
                      <div style="height:100%; width:${pct}%; background:var(--gradient-brand); border-radius:999px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- MAIN GRID 2: ROSTER & PRODUCTION -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">👥 Team Live Duty & EOD Status</h3>
            <a href="#hr" style="font-size: 0.75rem; color: var(--pink-brand); text-decoration: none; font-weight: 700;">Team Ops →</a>
          </div>
          ${team.length === 0 ? `
            <div class="empty-state" style="padding: 1.5rem;">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">No Team Members Found</div>
              <div class="empty-state-desc">Add staff members in the HR Operations module.</div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th style="min-width: 140px;">Member</th>
                    <th style="min-width: 120px;">Role</th>
                    <th style="text-align: center; min-width: 80px;">Status</th>
                    <th style="text-align: center; min-width: 80px;">EOD</th>
                  </tr>
                </thead>
                <tbody>
                  ${team.slice(0, 6).map(m => {
                    const empCode = m.emp_code || m.id;
                    const isOnline = m.status === 'In Studio' || attendance.some(a => a.employee_id === empCode && a.status === 'In Studio');
                    const hasEod = eods.some(e => (e.employee_id === empCode || e.employee_name === m.name) && ((e.report_date || '').startsWith(todayStr) || (e.created_at || '').startsWith(todayStr)));
                    const initials = (m.name || 'PB').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

                    return `
                      <tr>
                        <td class="nowrap">
                          <div class="member-avatar-chip">
                            <span class="member-avatar-dot">${initials}</span>
                            <span style="font-weight:700;">${escapeHTML(m.name)}</span>
                          </div>
                        </td>
                        <td class="truncate" title="${escapeHTML(m.role || 'Team')}" style="color: var(--text-muted);">${escapeHTML(m.role || 'Team')}</td>
                        <td style="text-align: center;"><span class="badge ${isOnline ? 'badge-emerald' : 'badge-amber'}">${isOnline ? '🟢 In Studio' : '⚫ Offline'}</span></td>
                        <td style="text-align: center;"><span class="badge ${hasEod ? 'badge-purple' : 'badge-amber'}">${hasEod ? '✓ Done' : '⏳ Pending'}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">🏢 Client Accounts Portfolio</h3>
            <a href="#crm" style="font-size: 0.75rem; color: var(--pink-brand); text-decoration: none; font-weight: 700;">Client Hub →</a>
          </div>
          ${clients.length === 0 ? `
            <div class="empty-state" style="padding: 1.5rem;">
              <div class="empty-state-icon">🏢</div>
              <div class="empty-state-title">No Clients in Portfolio</div>
              <div class="empty-state-desc">Add client partners in the Client CRM directory.</div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th style="min-width: 140px;">Client</th>
                    <th style="min-width: 110px;">Category</th>
                    <th style="min-width: 90px;">Total Billed</th>
                    <th style="text-align: center; min-width: 80px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.slice(0, 5).map(c => {
                    const clientInvoices = invoices.filter(i => i.clientName === c.name || i.client === c.name || i.clientId === c.id);
                    const totalSpent = clientInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
                    const initials = (c.name || 'CL').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

                    return `
                      <tr>
                        <td class="nowrap">
                          <div class="member-avatar-chip">
                            <span class="member-avatar-dot" style="background: var(--gradient-rose);">${initials}</span>
                            <span style="font-weight:700;">${escapeHTML(c.name)}</span>
                          </div>
                        </td>
                        <td class="truncate" title="${escapeHTML(c.category || c.industry || 'General')}" style="color: var(--text-muted);">${escapeHTML(c.category || c.industry || 'General')}</td>
                        <td class="nowrap"><strong style="color:var(--text-primary);">৳${totalSpent.toLocaleString()}</strong></td>
                        <td style="text-align: center;"><span class="badge badge-emerald">Active Retainer</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  } catch(err) {
    console.error('[Executive Dashboard Module Error]:', err);
    container.innerHTML = `<div style="padding: 2rem; color: #ef4444;">Failed to load Executive Dashboard: ${err.message}</div>`;
  }
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
