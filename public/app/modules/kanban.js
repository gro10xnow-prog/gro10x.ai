/**
 * public/app/modules/kanban.js
 * Production Kanban Pipeline Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.kanban = async function(container) {
  let tasksData = [];
  const stages = ['Strategy', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'];

  async function loadTasks() {
    tasksData = await APP_API.get('/tasks').catch(() => []);
    renderKanbanBoard();
  }

  function renderKanbanBoard() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📋 Production Pipeline Hub
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage creative shoots, editing cuts, scripting, and client approval stages.
          </div>
        </div>
        <button class="btn-primary" onclick="window.KANBAN_MODULE.openTaskModal()">+ New Production Task</button>
      </div>

      <!-- Kanban 6-Stage Columns Grid -->
      <div style="display:grid; grid-template-columns: repeat(6, minmax(240px, 1fr)); gap:1rem; overflow-x:auto; padding-bottom:1rem;">
        ${stages.map(stage => {
          const stageTasks = tasksData.filter(t => t.stage === stage);
          return `
            <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1rem; min-height:480px; display:flex; flex-direction:column; gap:0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.5rem; font-weight:800; font-size:0.8rem; color:var(--purple-light); text-transform:uppercase;">
                <span>${stage}</span>
                <span class="badge badge-purple" style="font-size:0.7rem;">${stageTasks.length}</span>
              </div>

              ${stageTasks.map(t => `
                <div class="card-glass" style="padding:0.85rem; display:flex; flex-direction:column; gap:0.4rem; cursor:pointer;" onclick="window.KANBAN_MODULE.advanceTask('${t.id}', '${stage}')">
                  <div style="font-weight:700; color:var(--text-primary); font-size:0.88rem;">${t.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">🏢 ${t.client || 'Agency Client'}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; margin-top:0.3rem;">
                    <span style="color:var(--text-dim);">👤 ${t.assignee || 'Unassigned'}</span>
                    <span class="badge ${t.priority === 'Urgent' ? 'badge-pink' : 'badge-purple'}" style="font-size:0.65rem;">${t.priority || 'Medium'}</span>
                  </div>
                  <div style="font-size:0.7rem; color:var(--purple-light); text-align:right; margin-top:0.2rem;">Click to advance ▶️</div>
                </div>
              `).join('') || `<div style="text-align:center; color:var(--text-dim); padding:2rem; font-size:0.8rem;">No tasks in stage</div>`}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Task Modal -->
      <div class="modal-overlay" id="taskModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">📋 Add Production Task</h2>
            <button onclick="window.KANBAN_MODULE.closeTaskModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input type="text" id="taskTitleInput" class="form-input" placeholder="e.g. Shoot TVC Reel for Chillox">
          </div>

          <div class="form-group">
            <label class="form-label">Client Name</label>
            <input type="text" id="taskClientInput" class="form-input" placeholder="e.g. Chillox Bangladesh">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Pipeline Stage</label>
              <select id="taskStageInput" class="form-select">
                ${stages.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Priority</label>
              <select id="taskPrioInput" class="form-select">
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.KANBAN_MODULE.submitTask()">🚀 Create Task</button>
        </div>
      </div>
    `;
  }

  window.KANBAN_MODULE = {
    openTaskModal() {
      document.getElementById('taskModal').classList.add('active');
    },
    closeTaskModal() {
      document.getElementById('taskModal').classList.remove('active');
    },
    async submitTask() {
      const title = document.getElementById('taskTitleInput').value.trim();
      const client = document.getElementById('taskClientInput').value.trim() || 'Agency Client';
      const stage = document.getElementById('taskStageInput').value;
      const priority = document.getElementById('taskPrioInput').value;

      if (!title) return alert('Please enter a task title.');

      try {
        const res = await APP_API.post('/tasks', { title, client, stage, priority });
        if (res.success || res.id) {
          this.closeTaskModal();
          showToast('Task created successfully!');
          loadTasks();
        }
      } catch (err) {
        showToast('Failed to create task', 'error');
      }
    },
    async advanceTask(taskId, currentStage) {
      const currentIndex = stages.indexOf(currentStage);
      if (currentIndex === -1 || currentIndex >= stages.length - 1) return;

      const nextStage = stages[currentIndex + 1];
      try {
        const res = await APP_API.put(`/tasks/${taskId}`, { stage: nextStage });
        if (res.success || res.id) {
          showToast(`Task advanced to ${nextStage}`);
          loadTasks();
        }
      } catch (err) {
        showToast('Failed to update stage', 'error');
      }
    }
  };

  await loadTasks();
};
