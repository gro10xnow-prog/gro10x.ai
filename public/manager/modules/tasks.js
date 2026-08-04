/**
 * public/manager/modules/tasks.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.tasks = async function(container) {
  const tasks = await MANAGER_API.get('/tasks').catch(() => []);

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📋 Department Task Pipeline</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Monitor and progress active team tasks.</div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Client</th>
            <th>Assignee</th>
            <th>Stage</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${(tasks || []).map(t => `
            <tr>
              <td style="font-weight:700; color:var(--text-primary);">${t.title}</td>
              <td>${t.client || 'Agency Internal'}</td>
              <td><span class="badge badge-purple">👤 ${t.assignee || 'Unassigned'}</span></td>
              <td><span class="badge badge-purple">${t.stage || 'To Do'}</span></td>
              <td style="color:var(--text-muted);">${t.dueDate || 'ASAP'}</td>
            </tr>
          `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem;">No tasks logged.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
};
