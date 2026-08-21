/**
 * public/app/modules/dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Executive Command Dashboard Module (Admin SPA Integration) v3.0
 * Features:
 * 1. 1-Tap Executive Action Center (Direct sign-off for expenses & leaves)
 * 2. Overdue Deliverables Radar (High-contrast deadline alerts)
 * 3. Visual Cash Flow Gauge (Settled Rev vs Payroll vs Expenses)
 * 4. Real-Time Attendance & Studio Pulse
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dashboard = async function(container) {
  let isActionRunning = false;

  async function renderDashboard() {
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

      // Expenses & Liabilities
      const pendingExps = expenses.filter(e => {
        const st = (e.status || '').toLowerCase();
        return st.includes('pending') || (!e.tier1?.approved && !e.tier2?.approved) || (e.tier1?.approved && !e.tier2?.approved);
      });
      const pendingExpTotal = pendingExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const disbursedExps = expenses.filter(e => (e.status || '').toLowerCase() === 'disbursed' || (e.status || '').toLowerCase() === 'approved');
      const disbursedExpTotal = disbursedExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Payroll & Net Cash Flow
      const monthlyPayroll = team.reduce((sum, t) => sum + (Number(t.baseSalary || t.base_salary) || 0), 0);
      const totalOutflows = disbursedExpTotal + monthlyPayroll;
      const netCashPosition = paidTotal - totalOutflows;
      const netCashColor = netCashPosition >= 0 ? 'var(--emerald-brand, #10b981)' : '#ef4444';
      const netCashPrefix = netCashPosition >= 0 ? '+৳' : '-৳';
      const netMarginPct = paidTotal > 0 ? Math.round((netCashPosition / paidTotal) * 100) : 0;

      // Pending Executive Approvals Queue
      const pendingLeavesList = leaves.filter(l => (l.status || '').toLowerCase().includes('pending'));
      const totalPendingActions = pendingExps.length + pendingLeavesList.length;

      // Operations & Overdue Deliverables
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDate = new Date();
      const openTasks = tasks.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage));
      const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < todayStr);

      const inStudioMembers = team.filter(t => t.status === 'In Studio' || attendance.some(a => a.employee_id === (t.emp_code || t.id) && a.status === 'In Studio'));
      const onShootMembers = team.filter(t => t.status === 'On Shoot' || attendance.some(a => a.employee_id === (t.emp_code || t.id) && a.status === 'On Shoot'));
      const onLeaveMembers = team.filter(t => t.status === 'On Leave' || leaves.some(l => (l.emp_code === (t.emp_code || t.id) || l.employee_name === t.name) && (l.status || '').toLowerCase() === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date));

      const todayEods = eods.filter(e => (e.report_date || '').startsWith(todayStr) || (e.created_at || '').startsWith(todayStr));
      const totalLeadVal = leads.reduce((sum, l) => {
        const val = parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);

      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Good Morning' : (hr < 17 ? 'Good Afternoon' : 'Good Evening');
      const execName = (window.CURRENT_USER && window.CURRENT_USER.firstName) ? window.CURRENT_USER.firstName : 'Executive';

      container.innerHTML = `
        <!-- Hero Header -->
        <div style="background: linear-gradient(135deg, rgba(190, 24, 93, 0.16), rgba(147, 51, 234, 0.12)); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading); margin: 0 0 0.25rem; color: var(--text-main);">
              ${timeGreeting}, ${escapeHTML(execName)} 👋
            </h1>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Executive command center · Real-time financials, approvals, delivery radar & roster status.
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <a href="#kanban" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">📋 New Task</a>
            <a href="#finance" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">🧾 New Invoice</a>
            <button onclick="window.openOpsHealthModal()" class="btn-secondary" style="font-size: 0.8rem;">🩺 Ops Health</button>
            <a href="#hr" class="btn-primary" style="font-size: 0.8rem; text-decoration: none;">👥 Manage Team</a>
          </div>
        </div>

        <!-- ──────── SECTION 1: 1-TAP EXECUTIVE ACTION CENTER ──────── -->
        ${totalPendingActions > 0 ? `
          <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(236, 72, 153, 0.08)); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">✍️</span>
                <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                  Executive Action Center
                  <span style="background: #f59e0b; color: #000; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 999px; margin-left: 0.4rem;">${totalPendingActions} Pending Sign-Offs</span>
                </h3>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">1-Tap Owner & Managing Director Authorization</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.85rem;">
              <!-- Pending Expenses -->
              ${pendingExps.slice(0, 4).map(exp => `
                <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700;">💸 Expense Claim</span>
                      <strong style="font-size: 0.9rem; color: var(--emerald-brand, #10b981);">৳${(Number(exp.amount) || 0).toLocaleString()}</strong>
                    </div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(exp.staff_name || exp.employee_name || exp.claimant || 'Staff Member')}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(exp.description || exp.category || 'Operational Expense')}</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveExpense('${exp.id}')" style="background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;" title="Authorize Disbursal">✅ Approve</button>
                    <button onclick="window.execRejectExpense('${exp.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;" title="Reject Claim">❌</button>
                  </div>
                </div>
              `).join('')}

              <!-- Pending Leaves -->
              ${pendingLeavesList.slice(0, 4).map(leave => `
                <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="font-size: 0.72rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700;">🌴 Leave Request</span>
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">${escapeHTML(leave.leave_type || leave.type || 'Casual')} (${leave.days || 1}d)</strong>
                    </div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(leave.employee_name || leave.staff_name || 'Staff Member')}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(leave.reason || 'Personal Leave')} · ${leave.start_date || 'Upcoming'}</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveLeave('${leave.id}')" style="background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;" title="Approve Leave">✅ Approve</button>
                    <button onclick="window.execRejectLeave('${leave.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;" title="Reject Leave">❌</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ──────── SECTION 2: OVERDUE & CRITICAL RADAR ──────── -->
        ${overdueTasks.length > 0 ? `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">🚨</span>
                <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: #ef4444;">
                  Critical & Overdue Deliverables Radar
                  <span style="background: #ef4444; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 999px; margin-left: 0.4rem;">${overdueTasks.length} Delayed</span>
                </h3>
              </div>
              <a href="#kanban" style="font-size: 0.75rem; color: #f87171; text-decoration: none; font-weight: 700;">Open Kanban Hub →</a>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem;">
              ${overdueTasks.slice(0, 4).map(task => {
                const due = new Date(task.due_date);
                const diffDays = Math.ceil((todayDate - due) / (1000 * 60 * 60 * 24));
                return `
                  <div style="background: var(--surface-2, #1b1b26); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.72rem; color: #ef4444; font-weight: 800; margin-bottom: 0.15rem;">🚨 ${diffDays}d OVERDUE (${escapeHTML(task.due_date)})</div>
                      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(task.title || 'Production Task')}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">Client: <strong>${escapeHTML(task.clientName || task.client || 'Agency')}</strong> · Assignee: <strong>${escapeHTML(task.assignee || 'Unassigned')}</strong></div>
                    </div>
                    <a href="#kanban" style="background: var(--surface-3); border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 8px; text-decoration: none; font-weight: 700;">📋 Inspect</a>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ──────── SECTION 3: FINANCIAL COMMAND STRIP & CASH FLOW GAUGE ──────── -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">
            💵 Financial Oversight & Cash Flow Engine
          </div>
          <span style="font-size: 0.75rem; color: ${netCashColor}; font-weight: 800;">Operating Margin: ${netMarginPct}%</span>
        </div>

        <!-- Cash Flow Visual Breakdown Bar -->
        <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.4rem;">
            <span>💰 Settled Collections: <strong style="color: var(--emerald-brand, #10b981);">৳${paidTotal.toLocaleString()}</strong></span>
            <span>💸 Outflows (Payroll + Exp): <strong style="color: var(--purple-light, #c084fc);">৳${totalOutflows.toLocaleString()}</strong></span>
            <span>📊 Net Position: <strong style="color: ${netCashColor};">${netCashPrefix}${Math.abs(netCashPosition).toLocaleString()}</strong></span>
          </div>
          <div style="width: 100%; height: 10px; background: var(--surface-3, #2a2a3c); border-radius: 999px; overflow: hidden; display: flex;">
            <div style="height: 100%; width: ${Math.min(100, collectionRate)}%; background: linear-gradient(90deg, #10b981, #059669);" title="Settled Collections (${collectionRate}%)"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="kpi-tile">
            <div class="kpi-label">Monthly Settled Revenue</div>
            <div class="kpi-val" style="color: var(--emerald-brand, #10b981);">৳${paidTotal.toLocaleString()}</div>
            <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">💰 Paid Invoices</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-label">Net Cash Position</div>
            <div class="kpi-val" style="color: ${netCashColor};">${netCashPrefix}${Math.abs(netCashPosition).toLocaleString()}</div>
            <div style="font-size: 0.72rem; color: ${netCashColor}; font-weight: 700;">📊 Rev − Exp − Payroll</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-label">Monthly Fixed Payroll</div>
            <div class="kpi-val" style="color: var(--purple-light);">৳${monthlyPayroll.toLocaleString()}</div>
            <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700;">👥 ${team.length} Active Staff</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-label">Outstanding Receivables</div>
            <div class="kpi-val" style="color: var(--amber-brand);">৳${pendingTotal.toLocaleString()}</div>
            <div style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">⏳ Pending Invoices</div>
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

        <!-- ──────── SECTION 4: OPERATIONS & STUDIO ATTENDANCE PULSE ──────── -->
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">
          ⚙️ Operations & Real-Time Studio Pulse
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="kpi-tile">
            <div class="kpi-label">Studio On Duty Today</div>
            <div class="kpi-val" style="color: #10b981;">${inStudioMembers.length} / ${team.length}</div>
            <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">🟢 Clocked-In In Studio</div>
          </div>

          <div class="kpi-tile">
            <div class="kpi-label">Field Shoots / Remote</div>
            <div class="kpi-val" style="color: #60a5fa;">${onShootMembers.length}</div>
            <div style="font-size: 0.72rem; color: #60a5fa; font-weight: 700;">🎬 On Field Production</div>
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
  }

  // 1-Tap Executive Sign-off Handlers
  window.execApproveExpense = async function(id) {
    if (isActionRunning) return;
    isActionRunning = true;
    try {
      await APP_API.post(`/expenses/${id}/approve-tier2`, { approvedBy: window.CURRENT_USER?.name || 'Executive' });
      if (window.showToast) window.showToast('✅ Expense claim authorized and disbursed!', 'success');
      await renderDashboard();
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    } catch (e) {
      if (window.showToast) window.showToast('Error approving expense: ' + e.message, 'error');
    } finally {
      isActionRunning = false;
    }
  };

  window.execRejectExpense = async function(id) {
    const reason = prompt('Enter rejection note for this expense claim:');
    if (reason === null) return;
    try {
      await APP_API.post(`/expenses/${id}/reject`, { reason: reason || 'Declined by Executive' });
      if (window.showToast) window.showToast('Expense claim declined', 'info');
      await renderDashboard();
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    } catch (e) {
      if (window.showToast) window.showToast('Error rejecting expense: ' + e.message, 'error');
    }
  };

  window.execApproveLeave = async function(id) {
    if (isActionRunning) return;
    isActionRunning = true;
    try {
      await APP_API.post(`/leaves/${id}/approve`, { approvedBy: window.CURRENT_USER?.name || 'Executive' });
      if (window.showToast) window.showToast('✅ Leave request approved!', 'success');
      await renderDashboard();
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    } catch (e) {
      if (window.showToast) window.showToast('Error approving leave: ' + e.message, 'error');
    } finally {
      isActionRunning = false;
    }
  };

  window.execRejectLeave = async function(id) {
    const reason = prompt('Enter reason for declining this leave request:');
    if (reason === null) return;
    try {
      await APP_API.post(`/leaves/${id}/reject`, { reason: reason || 'Declined by Executive' });
      if (window.showToast) window.showToast('Leave request declined', 'info');
      await renderDashboard();
      if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges();
    } catch (e) {
      if (window.showToast) window.showToast('Error rejecting leave: ' + e.message, 'error');
    }
  };

  await renderDashboard();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
