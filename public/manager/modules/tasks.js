/**
 * public/manager/modules/tasks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Interactive Task Pipeline Module
 * - Instant Search & Category Filter Pills
 * - In-place Stage Advancement Dropdown
 * - 1-Click Review Room Integration
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.tasks = async function(container) {
  let allTasks = [];
  let currentFilter = 'all';
  let searchQuery = '';

  async function loadTasks() {
    allTasks = await MANAGER_API.get('/tasks').catch(() => []);
    render();
  }

  function getFilteredTasks() {
    return (allTasks || []).filter(t => {
      const matchesSearch = !searchQuery ||
        (t.title || '').toLowerCase().includes(searchQuery) ||
        (t.client || '').toLowerCase().includes(searchQuery) ||
        (t.assignee || '').toLowerCase().includes(searchQuery);

      if (!matchesSearch) return false;

      const stage = (t.stage || '').toLowerCase();
      if (currentFilter === 'all') return true;
      if (currentFilter === 'active') return !['done', 'completed', 'approved', 'published', 'cancelled'].includes(stage);
      if (currentFilter === 'review') return stage.includes('review') || stage.includes('qc');
      if (currentFilter === 'production') return stage.includes('production') || stage.includes('shoot') || stage.includes('design') || stage.includes('edit');
      if (currentFilter === 'done') return ['done', 'completed', 'approved', 'published'].includes(stage);
      return true;
    });
  }

  function render() {
    const tasks = getFilteredTasks();
    const activeCount = allTasks.filter(t => !['done', 'completed', 'approved', 'published', 'cancelled'].includes((t.stage || '').toLowerCase())).length;
    const reviewCount = allTasks.filter(t => (t.stage || '').toLowerCase().includes('review') || (t.stage || '').toLowerCase().includes('qc')).length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            📋 Department Task Pipeline
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Manage and advance active deliverables through production stages in real-time.
          </div>
        </div>

        <!-- Live Search Input -->
        <div style="position:relative; width:100%; max-width:320px;">
          <input
            type="text"
            id="taskSearchInput"
            placeholder="🔍 Search tasks, clients, designers..."
            value="${searchQuery}"
            style="width:100%; padding:0.6rem 1rem; background:var(--surface-2); border:1px solid var(--border-medium); border-radius:10px; color:var(--text-primary); font-size:0.85rem;"
            oninput="window.MGR_TASKS.onSearch(this.value)"
          />
        </div>
      </div>

      <!-- Filter Pills -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; overflow-x:auto; padding-bottom:0.25rem;">
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="window.MGR_TASKS.setFilter('all')">
          All Tasks (${allTasks.length})
        </button>
        <button class="filter-pill ${currentFilter === 'active' ? 'active' : ''}" onclick="window.MGR_TASKS.setFilter('active')">
          ⚡ Active Pipeline (${activeCount})
        </button>
        <button class="filter-pill ${currentFilter === 'review' ? 'active' : ''}" onclick="window.MGR_TASKS.setFilter('review')">
          👁️ In QC / Review (${reviewCount})
        </button>
        <button class="filter-pill ${currentFilter === 'production' ? 'active' : ''}" onclick="window.MGR_TASKS.setFilter('production')">
          🎬 In Production
        </button>
        <button class="filter-pill ${currentFilter === 'done' ? 'active' : ''}" onclick="window.MGR_TASKS.setFilter('done')">
          ✅ Completed / Approved
        </button>
      </div>

      <!-- Tasks Table -->
      <div class="data-table-container card-glass">
        <table class="data-table">
          <thead>
            <tr>
              <th>Deliverable Title</th>
              <th>Client Brand</th>
              <th>Assignee</th>
              <th>Stage Progression</th>
              <th>Due Date</th>
              <th>Quick Action</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const stage = t.stage || 'Briefing';
              const isReview = stage.toLowerCase().includes('review') || stage.toLowerCase().includes('qc');
              const isDone = ['done', 'completed', 'approved', 'published'].includes(stage.toLowerCase());

              return `
                <tr>
                  <td style="font-weight:700; color:var(--text-primary); max-width:280px;">
                    <div>${t.title}</div>
                    <span style="font-size:0.72rem; color:var(--text-muted); font-weight:500;">ID: ${t.id}</span>
                  </td>
                  <td>
                    <span class="badge badge-purple">🏢 ${t.client || 'Agency Internal'}</span>
                  </td>
                  <td>
                    <span style="font-weight:600; color:var(--text-secondary);">👤 ${t.assignee || 'Unassigned'}</span>
                  </td>
                  <td>
                    <select
                      class="stage-select ${isDone ? 'stage-done' : (isReview ? 'stage-review' : '')}"
                      onchange="window.MGR_TASKS.updateStage('${t.id}', this.value)"
                      style="padding:0.35rem 0.6rem; background:var(--surface-3); border:1px solid var(--border-medium); border-radius:8px; color:var(--text-primary); font-size:0.8rem; font-weight:600; cursor:pointer;"
                    >
                      <option value="Briefing" ${stage === 'Briefing' ? 'selected' : ''}>📜 Briefing</option>
                      <option value="In Production" ${stage === 'In Production' || stage === 'Draft' ? 'selected' : ''}>🎬 In Production</option>
                      <option value="Internal QC" ${stage === 'Internal QC' || stage === 'Script QC' ? 'selected' : ''}>🔍 Internal QC</option>
                      <option value="Client Review" ${stage === 'Client Review' ? 'selected' : ''}>👁️ Client Review</option>
                      <option value="Approved" ${stage === 'Approved' || stage === 'Done' ? 'selected' : ''}>✅ Approved / Done</option>
                    </select>
                  </td>
                  <td style="color:var(--text-muted); font-size:0.82rem;">
                    📅 ${t.dueDate || t.due_date || 'ASAP'}
                  </td>
                  <td>
                    ${isReview ? `
                      <a href="/reviewroom?taskId=${t.id}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.25rem;">
                        👁️ Review
                      </a>
                    ` : `
                      <span style="font-size:0.75rem; color:var(--text-dim);">—</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No tasks match your active filters.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_TASKS = {
    onSearch(q) {
      searchQuery = (q || '').trim().toLowerCase();
      render();
    },
    setFilter(filter) {
      currentFilter = filter;
      render();
    },
    async updateStage(taskId, newStage) {
      try {
        await MANAGER_API.patch(`/tasks/${taskId}`, { stage: newStage });
        showManagerToast(`Task moved to ${newStage}! 🚀`);
        const task = allTasks.find(t => t.id === taskId);
        if (task) task.stage = newStage;
        render();
      } catch (e) {
        showManagerToast('Failed to update stage', 'error');
      }
    }
  };

  await loadTasks();
};
