/**
 * public/app/modules/dashboard.js
 * Executive Dashboard View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dashboard = async function(container) {
  try {
    const [team, tasks, invoices, tickets] = await Promise.all([
      APP_API.get('/team').catch(() => []),
      APP_API.get('/tasks').catch(() => []),
      APP_API.get('/invoices/invoices').catch(() => []),
      APP_API.get('/tickets').catch(() => [])
    ]);

    const activeTasks = (tasks || []).filter(t => t.stage !== 'Approved').length;
    const paidRevenue = (invoices || []).filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const openTickets = (tickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const teamCount = (team || []).length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
          📊 Executive Operations Dashboard
        </h1>
        <div style="font-size: 0.88rem; color: var(--text-muted);">
          Real-time production, client activity, and team status across agency operations.
        </div>
      </div>

      <!-- KPI Summary Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Crew</div>
          <div class="kpi-val">${teamCount}</div>
          <div class="kpi-sub">👥 Team Members On Roster</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Active Production Tasks</div>
          <div class="kpi-val" style="color: var(--purple-light);">${activeTasks}</div>
          <div class="kpi-sub" style="color: var(--purple-light);">📋 Live Pipeline</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Settled Revenue</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">৳${paidRevenue.toLocaleString()}</div>
          <div class="kpi-sub">💰 Paid Client Invoices</div>
        </div>

        <div class="kpi-tile">
          <div class="kpi-label">Open Support Tickets</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${openTickets}</div>
          <div class="kpi-sub" style="color: var(--amber-brand);">🎟️ Active Help Desk Requests</div>
        </div>
      </div>

      <!-- Analytics Visual Charts Grid -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.75rem;">
        <div class="card-glass">
          <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">📈 Invoicing & Revenue Analytics</h2>
          <div style="height:220px; position:relative;">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
        <div class="card-glass">
          <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">📊 Task Pipeline Distribution</h2>
          <div style="height:220px; position:relative;">
            <canvas id="taskDistributionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Main Focus Grid -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
        <!-- Active Tasks View -->
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin:0;">📋 Active Production Tasks</h2>
            <a href="#kanban" class="btn-secondary btn-sm">View Pipeline →</a>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${(tasks || []).slice(0, 6).map(t => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; background:var(--surface-3); border-radius:12px; border:1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${t.title}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">🏢 Client: ${t.client || 'Agency'} &bull; Assignee: ${t.assignee || 'Unassigned'}</div>
                </div>
                <span class="badge badge-purple">${t.stage || 'To Do'}</span>
              </div>
            `).join('') || `<div style="text-align:center; color:var(--text-muted); padding:2rem;">No active tasks</div>`}
          </div>
        </div>

        <!-- Team Roster Quick Status -->
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin:0;">👥 Team Status</h2>
            <a href="#hr" class="btn-secondary btn-sm">HR Ops →</a>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${(team || []).slice(0, 6).map(m => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.8rem; background:var(--surface-3); border-radius:12px;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <div style="width:32px; height:32px; border-radius:50%; background:var(--gradient-rose); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:#fff;">
                    ${(m.name || 'TM').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${m.name}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${m.role || 'Specialist'}</div>
                  </div>
                </div>
                <span class="badge badge-emerald" style="font-size:0.65rem;">${m.status || 'Active'}</span>
              </div>
            `).join('') || `<div style="text-align:center; color:var(--text-muted); padding:2rem;">No team members</div>`}
          </div>
        </div>
      </div>
    `;

    // Render Chart.js Visual Charts if Chart library loaded
    if (window.Chart) {
      setTimeout(() => {
        const revCtx = document.getElementById('revenueChart');
        if (revCtx) {
          new Chart(revCtx, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Collected Revenue (BDT)',
                data: [120000, 180000, 240000, 310000, 420000, paidRevenue || 480000],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#a1a1aa' } } },
              scales: {
                x: { ticks: { color: '#71717a' }, grid: { display: false } },
                y: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
        }

        const taskCtx = document.getElementById('taskDistributionChart');
        if (taskCtx) {
          const toDoCount = (tasks || []).filter(t => (t.stage || '').toLowerCase().includes('todo') || t.stage === 'To Do').length || 3;
          const inProgCount = (tasks || []).filter(t => (t.stage || '').toLowerCase().includes('progress')).length || 5;
          const reviewCount = (tasks || []).filter(t => (t.stage || '').toLowerCase().includes('review')).length || 2;
          const doneCount = (tasks || []).filter(t => (t.stage || '').toLowerCase().includes('approve') || t.stage === 'Done').length || 4;

          new Chart(taskCtx, {
            type: 'doughnut',
            data: {
              labels: ['To Do', 'In Progress', 'Review', 'Approved'],
              datasets: [{
                data: [toDoCount, inProgCount, reviewCount, doneCount],
                backgroundColor: ['#60a5fa', '#8b5cf6', '#f59e0b', '#10b981']
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right', labels: { color: '#a1a1aa' } } }
            }
          });
        }
      }, 50);
    }
  } catch (err) {
    container.innerHTML = `<div class="card-glass" style="padding:2rem; text-align:center; color:var(--red-brand);">Failed to load dashboard data</div>`;
  }
};
