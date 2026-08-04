/**
 * public/manager/modules/team.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.team = async function(container) {
  const team = await MANAGER_API.get('/team').catch(() => []);

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">👥 Team Roster & Active Status</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">View specialists and production team members.</div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Staff Code</th>
            <th>Name</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(team || []).map(m => `
            <tr>
              <td style="font-weight:700; color:var(--purple-light);">${m.emp_code || m.id}</td>
              <td style="font-weight:700; color:var(--text-primary);">👤 ${m.name}</td>
              <td>${m.role || 'Specialist'}</td>
              <td>${m.department || 'Production'}</td>
              <td><span class="badge badge-emerald">${m.status || 'Active'}</span></td>
            </tr>
          `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem;">No team members logged.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
};
