/**
 * public/crew/modules/home.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.home = async function(container) {
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const tasks = await CREW_API.get('/tasks').catch(() => []);

  const myTasks = (tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((user.name || '').toLowerCase()));
  const activeCount = myTasks.filter(t => t.stage !== 'Approved').length;

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
        ⚡ Welcome back, ${user.name || 'Specialist'}!
      </h1>
      <div style="font-size: 0.88rem; color: var(--text-muted);">
        Your daily task pipeline and personal workspace.
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <a href="#tasks" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Active Tasks Assigned</div>
        <div class="kpi-val" style="color:var(--purple-light);">${activeCount}</div>
        <div class="kpi-sub">View My Tasks ▶</div>
      </a>
      <a href="#leaves" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Leave Request Status</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">Active</div>
        <div class="kpi-sub">Apply PTO ▶</div>
      </a>
    </div>

    <div class="card-glass">
      <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0;">📱 Field Actions (Telegram Bot)</h2>
      <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Clocking in/out, submitting daily EOD reports, and GPS check-ins are done via Telegram Bot for maximum speed.
      </div>
      <a href="https://t.me/PurpleManBot" target="_blank" class="btn-primary">🤖 Launch Crew Bot (@PurpleManBot)</a>
    </div>
  `;
};
