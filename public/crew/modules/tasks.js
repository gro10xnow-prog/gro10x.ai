/**
 * public/crew/modules/tasks.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.tasks = async function(container) {
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const tasks = await CREW_API.get('/tasks').catch(() => []);
  const myTasks = (tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((user.name || '').toLowerCase()) || (t.assignees || []).includes(user.name));

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📋 My Assigned Tasks (${myTasks.length})</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Production tasks assigned specifically to you.</div>
    </div>

    <div style="display:flex; flex-direction:column; gap:0.85rem;">
      ${myTasks.map(t => `
        <div class="card-glass" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${t.title}</div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">🏢 Client: ${t.client || 'Agency'} &bull; Due: ${t.dueDate || 'ASAP'}</div>
          </div>
          <span class="badge badge-purple">${t.stage || 'To Do'}</span>
        </div>
      `).join('') || `<div class="card-glass" style="text-align:center; padding:3rem; color:var(--text-muted);">No tasks assigned to you right now.</div>`}
    </div>
  `;
};
