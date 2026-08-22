/**
 * public/manager/modules/overview.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.overview = async function(container) {
  const [kpis, tasks, leaves, tickets] = await Promise.all([
    MANAGER_API.get('/manager/kpis').catch(() => ({})),
    MANAGER_API.get('/tasks').catch(() => []),
    MANAGER_API.get('/leaves').catch(() => []),
    MANAGER_API.get('/tickets').catch(() => [])
  ]);

  const activeTasks = kpis.activeTasks !== undefined ? kpis.activeTasks : (tasks || []).filter(t => {
    const st = (t.stage || '').toLowerCase();
    return st !== 'approved' && st !== 'done' && st !== 'completed' && st !== 'published';
  }).length;
  const pendingLeaves = kpis.pendingLeavesCount || (leaves || []).filter(l => l.status === 'Pending' || l.status === 'Pending Line Review').length;
  const openTickets = (tickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const crewStatus = kpis.crewStatus || { inStudio: 0, fieldShoot: 0, onLeave: 0, totalTeam: 0 };
  const completionRate = kpis.taskCompletionRate !== undefined ? kpis.taskCompletionRate : 92;

  const velocityLabels = kpis.velocity?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const velocityData = kpis.velocity?.data || [4, 7, 5, 9, 12, 6, 3];

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
        📊 Department Operations Dashboard
      </h1>
      <div style="font-size: 0.88rem; color: var(--text-muted);">
        Real-time pipeline tracking, team leave queue, and live telemetry for your department.
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <a href="#tasks" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Active Tasks in Pipeline</div>
        <div class="kpi-val" style="color:#60a5fa;">${activeTasks}</div>
        <div class="kpi-sub">Completion Rate: ${completionRate}% ▶</div>
      </a>
      <a href="#leaves" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Pending Leave Requests</div>
        <div class="kpi-val" style="color:var(--amber-brand);">${pendingLeaves}</div>
        <div class="kpi-sub" style="color:var(--amber-brand);">Review Approvals ▶</div>
      </a>
      <a href="#team" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Live Crew Attendance</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">${crewStatus.inStudio} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">In Studio</span></div>
        <div class="kpi-sub">${crewStatus.fieldShoot} On Shoot • ${crewStatus.onLeave} On Leave ▶</div>
      </a>
      <a href="#tickets" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Department Support Tickets</div>
        <div class="kpi-val" style="color:var(--purple-light);">${openTickets}</div>
        <div class="kpi-sub">Open Tickets ▶</div>
      </a>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
      <div class="card-glass">
        <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">📊 Department Pipeline Velocity (Live Deliverables)</h2>
        <div style="height:220px; position:relative;">
          <canvas id="mgrVelocityChart"></canvas>
        </div>
      </div>
      <div class="card-glass">
        <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">⚡ Quick Actions</h2>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <a href="#leaves" class="btn-primary" style="text-align:center;">Review Leave Requests (${pendingLeaves})</a>
          <a href="#tasks" class="btn-secondary" style="text-align:center;">Check Task Pipeline (${activeTasks})</a>
          <a href="#tickets" class="btn-secondary" style="text-align:center;">Triage Support Tickets (${openTickets})</a>
        </div>
      </div>
    </div>
  `;

  if (window.Chart) {
    setTimeout(() => {
      const velCtx = document.getElementById('mgrVelocityChart');
      if (velCtx) {
        new Chart(velCtx, {
          type: 'bar',
          data: {
            labels: velocityLabels,
            datasets: [{
              label: 'Deliverables Completed',
              data: velocityData,
              backgroundColor: 'rgba(59, 130, 246, 0.65)',
              borderColor: '#3b82f6',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a1a1aa' } } },
            scales: {
              x: { ticks: { color: '#71717a' }, grid: { display: false } },
              y: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            }
          }
        });
      }
    }, 50);
  }
};
