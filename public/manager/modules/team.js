/**
 * public/manager/modules/team.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Team Workload & Roster Module
 * - Department Filter Pills & Search
 * - Live Attendance Indicators
 * - Capacity & Workload Heatmap Badges
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.team = async function(container) {
  let allTeam = [];
  let allTasks = [];
  let currentDeptFilter = 'all';
  let searchQuery = '';

  async function loadData() {
    const [teamRes, taskRes] = await Promise.all([
      MANAGER_API.get('/team').catch(() => []),
      MANAGER_API.get('/tasks').catch(() => [])
    ]);
    allTeam = teamRes || [];
    allTasks = taskRes || [];
    render();
  }

  function getFilteredTeam() {
    return allTeam.filter(m => {
      const matchesSearch = !searchQuery ||
        (m.name || '').toLowerCase().includes(searchQuery) ||
        (m.role || '').toLowerCase().includes(searchQuery) ||
        (m.emp_code || m.id || '').toLowerCase().includes(searchQuery);

      if (!matchesSearch) return false;

      if (currentDeptFilter === 'all') return true;
      const dept = (m.department || '').toLowerCase();
      return dept.includes(currentDeptFilter);
    });
  }

  function render() {
    const team = getFilteredTeam();

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            👥 Team Roster & Workload Allocation
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Real-time crew attendance, department assignments, and active workload capacity.
          </div>
        </div>

        <div style="position:relative; width:100%; max-width:320px;">
          <input
            type="text"
            placeholder="🔍 Search team member or role..."
            value="${searchQuery}"
            style="width:100%; padding:0.6rem 1rem; background:var(--surface-2); border:1px solid var(--border-medium); border-radius:10px; color:var(--text-primary); font-size:0.85rem;"
            oninput="window.MGR_TEAM.onSearch(this.value)"
          />
        </div>
      </div>

      <!-- Department Filter Pills -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; overflow-x:auto; padding-bottom:0.25rem;">
        <button class="filter-pill ${currentDeptFilter === 'all' ? 'active' : ''}" onclick="window.MGR_TEAM.setDept('all')">
          All Departments (${allTeam.length})
        </button>
        <button class="filter-pill ${currentDeptFilter === 'creative' ? 'active' : ''}" onclick="window.MGR_TEAM.setDept('creative')">
          🎨 Creative & Design
        </button>
        <button class="filter-pill ${currentDeptFilter === 'production' ? 'active' : ''}" onclick="window.MGR_TEAM.setDept('production')">
          🎬 Video Production
        </button>
        <button class="filter-pill ${currentDeptFilter === 'technology' ? 'active' : ''}" onclick="window.MGR_TEAM.setDept('technology')">
          💻 Technology
        </button>
        <button class="filter-pill ${currentDeptFilter === 'finance' ? 'active' : ''}" onclick="window.MGR_TEAM.setDept('finance')">
          💰 Finance & Admin
        </button>
      </div>

      <!-- Team Table -->
      <div class="data-table-container card-glass">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Department & Role</th>
              <th>Live Status</th>
              <th>Active Workload</th>
              <th>Rank & XP</th>
              <th>Direct Contact</th>
            </tr>
          </thead>
          <tbody>
            ${team.map(m => {
              const status = m.status || 'Offline';
              const statusBadgeClass = status === 'In Studio' ? 'badge-emerald' : (status === 'On Field Shoot' ? 'badge-purple' : (status === 'On Leave' ? 'badge-pink' : 'badge-amber'));

              // Compute member active tasks
              const memberTasks = allTasks.filter(t =>
                !['done', 'completed', 'approved', 'published', 'cancelled'].includes((t.stage || '').toLowerCase()) &&
                ((t.assignee && t.assignee.includes(m.name)) || t.assignee_id === m.emp_code || t.assignee_id === m.id)
              );
              const taskCount = memberTasks.length;
              const loadColor = taskCount >= 5 ? 'var(--red-brand)' : (taskCount >= 3 ? 'var(--amber-brand)' : 'var(--emerald-brand)');
              const loadText = taskCount >= 5 ? '🔴 Overloaded' : (taskCount >= 3 ? '🟡 Busy' : '🟢 Optimal');

              return `
                <tr>
                  <td style="font-weight:700; color:var(--text-primary);">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <div style="width:32px; height:32px; border-radius:50%; background:var(--surface-3); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:var(--purple-light); border:1px solid var(--border-medium);">
                        ${(m.name || 'T')[0]}
                      </div>
                      <div>
                        <div>${m.name}</div>
                        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:500;">${m.emp_code || m.id || 'PBD'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:600; color:var(--text-primary);">${m.role || 'Specialist'}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${m.department || 'Operations'}</div>
                  </td>
                  <td>
                    <span class="badge ${statusBadgeClass}">${status}</span>
                  </td>
                  <td>
                    <div style="font-weight:700; color:${loadColor};">
                      ${taskCount} active task${taskCount === 1 ? '' : 's'}
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-dim);">${loadText}</div>
                  </td>
                  <td>
                    <span class="badge badge-purple">⭐ ${m.badge || '🌱 Recruit'}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.3rem;">(${m.xp || 0} XP)</span>
                  </td>
                  <td>
                    ${m.phone ? `
                      <a href="tel:${m.phone}" style="color:var(--purple-light); font-size:0.8rem; text-decoration:none; font-weight:600;">
                        📞 ${m.phone}
                      </a>
                    ` : `<span style="font-size:0.75rem; color:var(--text-dim);">—</span>`}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No team members found for this department.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_TEAM = {
    onSearch(q) {
      searchQuery = (q || '').trim().toLowerCase();
      render();
    },
    setDept(dept) {
      currentDeptFilter = dept;
      render();
    }
  };

  await loadData();
};
