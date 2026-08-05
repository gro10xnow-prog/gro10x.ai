/**
 * public/app/modules/kanban.js
 * Production Kanban & Projects Management Module
 * Restored advanced features: Client Spaces, Drag-and-Drop, Task Drawer, Multi-views, Time Logging
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.kanban = async function(container) {
  let allTasks = [];
  let spacesData = [
    { id: 'internal', name: 'Internal Agency', type: 'department' },
    { id: 'clients', name: 'Client Campaigns', type: 'client' }
  ];
  let activeSpace = 'all';
  let currentView = 'kanban';
  const stages = ['Briefing', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved'];
  let activeTaskId = null;

  async function loadData() {
    try {
      allTasks = await APP_API.get('/tasks').catch(() => []);
      
      // Attempt to load spaces if API supports it, else use fallback
      try {
        const dbSpaces = await APP_API.get('/projects/spaces');
        if (dbSpaces && dbSpaces.length > 0) spacesData = dbSpaces;
      } catch(e) {}

      renderMainUI();
    } catch (e) {
      console.error('Failed to load Kanban data', e);
    }
  }

  function renderMainUI() {
    container.innerHTML = `
      <style>
        .kanban-layout { display: flex; gap: 1.5rem; height: calc(100vh - 120px); }
        .kanban-sidebar { width: 240px; background: var(--surface-1); border-right: 1px solid var(--border-subtle); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
        .space-item { padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; color: var(--text-muted); font-size: 0.88rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .space-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .space-item.active { background: rgba(124,58,237,0.15); color: var(--purple-light); font-weight: 700; border-left: 3px solid var(--purple-light); }
        
        .kanban-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .view-toggles { display: flex; gap: 0.5rem; background: var(--surface-1); padding: 0.4rem; border-radius: 12px; border: 1px solid var(--border-subtle); }
        .view-btn { padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; border: none; background: transparent; color: var(--text-muted); font-weight: 600; }
        .view-btn.active { background: var(--purple-glow); color: #fff; }

        .kanban-board-container { flex: 1; overflow-x: auto; overflow-y: hidden; }
        .kanban-grid { display: flex; gap: 1rem; height: 100%; padding-bottom: 1rem; }
        .kanban-col { min-width: 280px; max-width: 280px; background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 12px; display: flex; flex-direction: column; }
        .kanban-col-header { padding: 1rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 0.85rem; color: var(--text-primary); text-transform: uppercase; }
        .kanban-col-body { padding: 0.8rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem; }
        
        .kanban-card { background: rgba(20, 15, 36, 0.75); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem; cursor: grab; transition: all 0.2s; position: relative; }
        .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.4); }
        .kanban-card:active { cursor: grabbing; }
        
        .kanban-list-view { width: 100%; border-collapse: collapse; text-align: left; background: var(--surface-1); border-radius: 12px; overflow: hidden; }
        .kanban-list-view th { padding: 1rem; border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; }
        .kanban-list-view td { padding: 1rem; border-bottom: 1px solid var(--border-subtle); font-size: 0.88rem; color: #fff; }
        .kanban-list-view tr:hover { background: rgba(255,255,255,0.02); cursor: pointer; }
        
        /* Drawer Overlay */
        .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: none; opacity: 0; transition: opacity 0.3s; }
        .drawer-panel { position: fixed; right: -480px; top: 0; bottom: 0; width: 450px; background: var(--surface-1); border-left: 1px solid var(--border-subtle); z-index: 1001; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.5); }
        .drawer-panel.open { right: 0; }
        .drawer-backdrop.open { display: block; opacity: 1; }
        .drawer-header { padding: 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: flex-start; }
        .drawer-body { padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .drawer-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); display: flex; justify-content: flex-end; gap: 0.8rem; }
      </style>

      <div class="kanban-layout">
        <div class="kanban-sidebar">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 0.5rem; padding-left: 1rem;">Workspaces</div>
          <div class="space-item ${activeSpace === 'all' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('all')">
            🌐 All Projects
          </div>
          ${spacesData.map(s => `
            <div class="space-item ${activeSpace === s.name ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('${s.name}')">
              ${s.type === 'client' ? '🟣' : '🏢'} ${s.name}
            </div>
          `).join('')}
          <div style="margin-top: 1rem; padding: 0 1rem;">
            <button class="btn-secondary" style="width: 100%; font-size: 0.78rem;" onclick="window.KANBAN_MODULE.addSpace()">+ New Space</button>
          </div>
        </div>

        <div class="kanban-main">
          <div class="kanban-header">
            <div>
              <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
                ${activeSpace === 'all' ? 'All Projects' : activeSpace}
              </h1>
              <div style="font-size: 0.88rem; color: var(--text-muted);">
                Manage tasks, time tracking, and production pipeline.
              </div>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center;">
              <div class="view-toggles">
                <button class="view-btn ${currentView === 'list' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('list')">📄 List</button>
                <button class="view-btn ${currentView === 'kanban' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('kanban')">🗂️ Kanban</button>
                <button class="view-btn ${currentView === 'calendar' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('calendar')">📅 Calendar</button>
              </div>
              <button class="btn-primary" onclick="window.KANBAN_MODULE.openNewTask()">+ New Task</button>
            </div>
          </div>

          <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; background:var(--surface-1); padding:0.8rem; border-radius:12px; border:1px solid var(--border-subtle);">
            <input type="text" id="kanbanSearchQuery" placeholder="Search tasks..." oninput="window.KANBAN_MODULE.applyFilters()" style="background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.4rem 0.8rem; border-radius:8px; width:200px;">
            <select id="kanbanFilterAssignee" onchange="window.KANBAN_MODULE.applyFilters()" style="background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.4rem 0.8rem; border-radius:8px;">
              <option value="">All Assignees</option>
            </select>
            <select id="kanbanFilterPriority" onchange="window.KANBAN_MODULE.applyFilters()" style="background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.4rem 0.8rem; border-radius:8px;">
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div class="kanban-board-container" id="kanbanBoardArea"></div>
          <div id="bulkToolbarContainer" style="position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); z-index:900;"></div>
        </div>
      </div>

      <!-- Task Details Drawer -->
      <div class="drawer-backdrop" id="taskDrawerBackdrop" onclick="window.KANBAN_MODULE.closeDrawer()"></div>
      <div class="drawer-panel" id="taskDrawerPanel">
        <div class="drawer-header">
          <div>
            <div class="badge badge-purple" id="drawerStageBadge" style="margin-bottom: 0.5rem; display: inline-block;">Briefing</div>
            <h2 id="drawerTaskTitle" style="margin: 0; font-size: 1.25rem; font-family: var(--font-heading); color: #fff;">Task Title</h2>
            <div id="drawerClientName" style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.4rem;">Client: Agency · Assignee: Staff</div>
          </div>
          <button onclick="window.KANBAN_MODULE.closeDrawer()" style="background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">✕</button>
        </div>
        
        <div class="drawer-body">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">⏱️ Time Tracking</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
              <div>
                <div style="font-size: 1.2rem; font-weight: 800; color: var(--emerald-brand);" id="drawerTimeText">0h / 8h</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Logged vs Estimated</div>
              </div>
              <button class="btn-secondary" onclick="window.KANBAN_MODULE.logTime()">Log Hours</button>
            </div>
            <div id="drawerTimeLogList" style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;"></div>
          </div>

          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">📝 Subtasks</div>
            <div id="drawerSubtaskList" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;"></div>
            <button class="btn-secondary" style="width: 100%; font-size: 0.8rem; border-style: dashed;" onclick="window.KANBAN_MODULE.addSubtask()">+ Add Subtask</button>
          </div>
          
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">💬 Activity & Comments</div>
            <div id="drawerCommentsList" style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1rem; max-height:300px; overflow-y:auto; padding-right:0.5rem;"></div>
            <form onsubmit="window.KANBAN_MODULE.postComment(event)" style="display:flex; gap:0.5rem;">
              <input type="text" id="drawerCommentInput" placeholder="Write a comment..." style="flex:1; background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.6rem; border-radius:8px; font-size:0.85rem;" required>
              <button type="submit" class="btn-primary" style="padding:0.6rem 1rem;">Post</button>
            </form>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" onclick="window.KANBAN_MODULE.closeDrawer()">Close</button>
          <button class="btn-primary" onclick="window.KANBAN_MODULE.markApproved()">Mark Approved</button>
        </div>
      </div>
    `;

    renderViewArea();
  }

  function renderViewArea() {
    const area = document.getElementById('kanbanBoardArea');
    if (!area) return;

    let displayTasks = allTasks;
    if (activeSpace !== 'all') {
      displayTasks = allTasks.filter(t => t.client === activeSpace || t.category === activeSpace);
    }

    // Apply Filters
    const searchQ = document.getElementById('kanbanSearchQuery')?.value.toLowerCase() || '';
    const assigneeF = document.getElementById('kanbanFilterAssignee')?.value || '';
    const priorityF = document.getElementById('kanbanFilterPriority')?.value || '';
    
    displayTasks = displayTasks.filter(t => {
      if (searchQ && !t.title.toLowerCase().includes(searchQ) && !(t.client || '').toLowerCase().includes(searchQ)) return false;
      if (assigneeF && t.assignee !== assigneeF) return false;
      if (priorityF && t.priority !== priorityF) return false;
      return true;
    });

    if (currentView === 'kanban') {
      area.innerHTML = `
        <div class="kanban-grid">
          ${stages.map(stg => {
            const stageTasks = displayTasks.filter(t => (t.stage || 'Briefing') === stg);
            return `
              <div class="kanban-col" ondragover="event.preventDefault()" ondrop="window.KANBAN_MODULE.dropTask(event, '${stg}')">
                <div class="kanban-col-header">
                  <span>${stg}</span>
                  <span class="badge" style="background: rgba(255,255,255,0.08);">${stageTasks.length}</span>
                </div>
                <div class="kanban-col-body">
                  ${stageTasks.map(t => {
                    const safeClient = escapeHTML(t.client || 'Agency');
                    const safeTitle = escapeHTML(t.title);
                    const safeAssignee = escapeHTML(t.assignee || 'Staff');
                    return `
                    <div class="kanban-card" draggable="true" ondragstart="window.KANBAN_MODULE.dragTask(event, '${t.id}')" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                      <input type="checkbox" class="task-cb" ${selectedTasks.has(t.id) ? 'checked' : ''} onclick="event.stopPropagation(); window.KANBAN_MODULE.toggleSelect(event, '${t.id}')" style="position:absolute; top:0.8rem; right:0.8rem; transform:scale(1.2); cursor:pointer;">
                      <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700; margin-bottom: 0.3rem; padding-right:1.5rem;">${safeClient}</div>
                      <div style="font-weight: 700; color: #fff; font-size: 0.9rem; line-height: 1.3;">${safeTitle}</div>
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.8rem;">
                        <span>👤 ${safeAssignee}</span>
                        <span style="display:flex; align-items:center; gap:0.3rem;">⏱️ ${escapeHTML(t.loggedHours || 0)}h</span>
                      </div>
                    </div>
                  `}).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (currentView === 'list') {
      area.innerHTML = `
        <table class="kanban-list-view">
          <thead>
            <tr>
              <th style="width:40px;"></th>
              <th>Priority</th>
              <th>Task Title</th>
              <th>Client Space</th>
              <th>Stage</th>
              <th>Assignee</th>
              <th>Time</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${displayTasks.map(t => {
              const prio = (t.priority || 'Medium');
              const badgeClass = prio === 'Urgent' || prio === 'High' ? 'badge-pink' : 'badge-purple';
              const safeTitle = escapeHTML(t.title);
              const safeClient = escapeHTML(t.client || 'Agency');
              const safeAssignee = escapeHTML(t.assignee || 'Unassigned');
              return `
                <tr onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                  <td onclick="event.stopPropagation()"><input type="checkbox" class="task-cb" ${selectedTasks.has(t.id) ? 'checked' : ''} onclick="window.KANBAN_MODULE.toggleSelect(event, '${t.id}')" style="transform:scale(1.2); cursor:pointer;"></td>
                  <td><span class="badge ${badgeClass}">${escapeHTML(prio)}</span></td>
                  <td style="font-weight: 700;">${safeTitle}</td>
                  <td style="color: var(--text-muted);">${safeClient}</td>
                  <td>
                    <select style="background:transparent; border:1px solid var(--border-subtle); color:#fff; padding:0.2rem; border-radius:4px; font-size:0.8rem;" onclick="event.stopPropagation()" onchange="window.KANBAN_MODULE.updateStage('${t.id}', this.value)">
                      ${stages.map(s => `<option value="${s}" ${t.stage === s ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('')}
                    </select>
                  </td>
                  <td>👤 ${safeAssignee}</td>
                  <td style="color: var(--text-muted);">${escapeHTML(t.loggedHours || 0)}h / ${escapeHTML(t.estimatedHours || 8)}h</td>
                  <td style="color: var(--text-muted);">${escapeHTML(t.dueDate || 'ASAP')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      area.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 3rem;">📅 Calendar view rendered for ${displayTasks.length} scheduled tasks.</div>`;
    }
  }

  let selectedTasks = new Set();
  let lastSelectedTaskId = null;

  window.KANBAN_MODULE = {
    setSpace(space) {
      activeSpace = space;
      renderMainUI();
      this.populateFilterDropdowns();
    },
    setView(view) {
      currentView = view;
      renderMainUI();
      this.populateFilterDropdowns();
    },
    populateFilterDropdowns() {
      const select = document.getElementById('kanbanFilterAssignee');
      if (select) {
        const assignees = [...new Set(allTasks.map(t => t.assignee).filter(Boolean))];
        const currentVal = select.value;
        select.innerHTML = '<option value="">All Assignees</option>' + assignees.map(a => `<option value="${a}">${a}</option>`).join('');
        if (assignees.includes(currentVal)) select.value = currentVal;
      }
    },
    applyFilters() {
      renderViewArea();
    },
    toggleSelect(event, taskId) {
      const idx = allTasks.findIndex(t => t.id === taskId);
      if (idx === -1) return;
      
      if (event.shiftKey && lastSelectedTaskId) {
        const lastIdx = allTasks.findIndex(t => t.id === lastSelectedTaskId);
        if (lastIdx !== -1) {
          const start = Math.min(idx, lastIdx);
          const end = Math.max(idx, lastIdx);
          const isChecked = event.target.checked;
          for (let i = start; i <= end; i++) {
            if (isChecked) selectedTasks.add(allTasks[i].id);
            else selectedTasks.delete(allTasks[i].id);
          }
        }
      } else {
        if (event.target.checked) selectedTasks.add(taskId);
        else selectedTasks.delete(taskId);
        lastSelectedTaskId = taskId;
      }
      
      // We will render bulk toolbar later (task 0.7.2.5)
      renderViewArea(); // Re-render to update checkboxes state if needed
      renderViewArea();
      if (window.KANBAN_MODULE.renderBulkToolbar) window.KANBAN_MODULE.renderBulkToolbar();
    },
    addSpace() {
      const name = prompt('Enter new space name:');
      if (name) {
        APP_API.post('/projects/spaces', { name }).then(() => loadData());
      }
    },
    renderBulkToolbar() {
      const container = document.getElementById('bulkToolbarContainer');
      if (!container) return;
      if (selectedTasks.size === 0) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = `
        <div style="background:var(--surface-2); border:1px solid var(--purple-light); border-radius:16px; padding:0.75rem 1.5rem; display:flex; align-items:center; gap:1rem; box-shadow:0 8px 32px rgba(0,0,0,0.5); backdrop-filter:blur(8px);">
          <div style="font-weight:700; color:#fff;">${selectedTasks.size} Selected</div>
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <select id="bulkStageSelect" style="background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.4rem; border-radius:8px;">
            <option value="">Move to Stage...</option>
            ${stages.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.applyBulkAction('stage')">Apply Stage</button>
          
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <input type="text" id="bulkAssigneeInput" placeholder="Assignee Name" style="background:var(--bg); border:1px solid var(--border-subtle); color:#fff; padding:0.4rem; border-radius:8px; width:120px;">
          <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.applyBulkAction('assign')">Assign</button>
          
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <button class="btn-secondary btn-sm" style="color:var(--red-brand); border-color:rgba(239,68,68,0.3);" onclick="window.KANBAN_MODULE.applyBulkAction('delete')">Delete Selected</button>
          
          <button onclick="window.KANBAN_MODULE.clearSelection()" style="background:none; border:none; color:var(--text-muted); margin-left:1rem; cursor:pointer; font-size:1.2rem;">✕</button>
        </div>
      `;
    },
    clearSelection() {
      selectedTasks.clear();
      lastSelectedTaskId = null;
      renderViewArea();
      this.renderBulkToolbar();
    },
    async applyBulkAction(action) {
      if (selectedTasks.size === 0) return;
      const taskIds = Array.from(selectedTasks);
      let payload = { action, taskIds };
      
      if (action === 'stage') {
        const stage = document.getElementById('bulkStageSelect').value;
        if (!stage) return alert('Select a stage first');
        payload.stage = stage;
      } else if (action === 'assign') {
        const assignee = document.getElementById('bulkAssigneeInput').value.trim();
        if (!assignee) return alert('Enter an assignee name');
        payload.assignee = assignee;
      } else if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) return;
      }
      
      try {
        await APP_API.post('/tasks/bulk', payload);
        if (window.showToast) window.showToast(`Bulk ${action} applied to ${taskIds.length} tasks`, 'success');
        this.clearSelection();
        loadData();
      } catch (e) {
        alert('Failed bulk action: ' + e.message);
      }
    },
    dragTask(evt, taskId) {
      evt.dataTransfer.setData('text/plain', taskId);
    },
    async dropTask(evt, targetStage) {
      evt.preventDefault();
      const taskId = evt.dataTransfer.getData('text/plain');
      if (taskId) {
        await this.updateStage(taskId, targetStage);
      }
    },
    async updateStage(taskId, newStage) {
      try {
        const res = await APP_API.patch(`/tasks/${taskId}/stage`, { stage: newStage });
        if (res.success) {
          const t = allTasks.find(x => x.id === taskId);
          if (t) t.stage = newStage;
          renderViewArea();
        }
      } catch (e) {
        console.error(e);
        if (window.showToast) window.showToast('Failed to update task stage', 'error');
        else alert('Failed to update task stage');
      }
    },
    async openDrawer(taskId) {
      activeTaskId = taskId;
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      document.getElementById('drawerStageBadge').textContent = task.stage || 'Briefing';
      document.getElementById('drawerTaskTitle').textContent = task.title;
      document.getElementById('drawerClientName').textContent = `Client: ${task.client || 'Agency'} · Assignee: ${task.assignee || 'Staff'}`;
      document.getElementById('drawerTimeText').textContent = `${task.loggedHours || 0}h / ${task.estimatedHours || 8}h`;
      document.getElementById('drawerSubtaskList').innerHTML = `<div style="color: var(--text-dim); font-size: 0.8rem; text-align: center; padding: 1rem;">No subtasks created yet</div>`;
      
      document.getElementById('drawerTimeLogList').innerHTML = '<div style="color:var(--text-muted);">Loading logs...</div>';
      document.getElementById('drawerCommentsList').innerHTML = '<div style="color:var(--text-muted);">Loading comments...</div>';

      document.getElementById('taskDrawerBackdrop').classList.add('open');
      document.getElementById('taskDrawerPanel').classList.add('open');

      try {
        const [logs, comments] = await Promise.all([
          APP_API.get(`/tasks/${taskId}/time-logs`),
          APP_API.get(`/tasks/${taskId}/comments`)
        ]);
        
        const logsHtml = (logs || []).map(l => `
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:0.4rem 0.6rem; border-radius:4px;">
            <span><span style="color:var(--purple-light);">${escapeHTML(l.user_name || 'User')}</span>: ${escapeHTML(l.note || 'Logged time')}</span>
            <span style="color:var(--emerald-brand); font-weight:700;">+${l.duration_hours}h</span>
          </div>
        `).join('');
        document.getElementById('drawerTimeLogList').innerHTML = logsHtml || '<div style="color:var(--text-dim);">No time logged yet.</div>';

        const commentsHtml = (comments || []).map(c => `
          <div style="background:rgba(255,255,255,0.02); padding:0.8rem; border-radius:8px; border:1px solid var(--border-subtle);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.75rem;">
              <strong style="color:var(--purple-light);">${escapeHTML(c.author_name || 'User')}</strong>
              <span style="color:var(--text-dim);">${new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div style="font-size:0.85rem; color:#fff;">${escapeHTML(c.content)}</div>
          </div>
        `).join('');
        document.getElementById('drawerCommentsList').innerHTML = commentsHtml || '<div style="color:var(--text-dim); font-size:0.85rem;">No comments yet.</div>';
      } catch(e) {}
    },
    closeDrawer() {
      document.getElementById('taskDrawerPanel').classList.remove('open');
      document.getElementById('taskDrawerBackdrop').classList.remove('open');
      activeTaskId = null;
    },
    async logTime() {
      if (!activeTaskId) return;
      const hoursStr = prompt('Enter worked hours to log (e.g. 2):');
      const hours = parseFloat(hoursStr);
      if (hours && hours > 0) {
        const note = prompt('Enter a short note (optional):') || 'Logged time';
        try {
          await APP_API.post(`/tasks/${activeTaskId}/log-time`, { hours, note });
          const task = allTasks.find(t => t.id === activeTaskId);
          if (task) {
            task.loggedHours = (task.loggedHours || 0) + hours;
            document.getElementById('drawerTimeText').textContent = `${task.loggedHours}h / ${task.estimatedHours || 8}h`;
            renderViewArea();
          }
          this.openDrawer(activeTaskId);
        } catch (e) {
          if (window.showToast) window.showToast('Failed to log time', 'error');
          else alert('Failed to log time');
        }
      }
    },
    async postComment(evt) {
      evt.preventDefault();
      if (!activeTaskId) return;
      const input = document.getElementById('drawerCommentInput');
      const content = input.value.trim();
      if (!content) return;
      
      try {
        await APP_API.post(`/tasks/${activeTaskId}/comments`, { content });
        input.value = '';
        this.openDrawer(activeTaskId);
      } catch (e) {
        if (window.showToast) window.showToast('Failed to post comment', 'error');
      }
    },
    async addSubtask() {
      if (!activeTaskId) return;
      const title = prompt('Enter subtask title:');
      if (title) {
        try {
          await APP_API.post('/tasks', { title, parentTaskId: activeTaskId, stage: 'To Do', client: activeSpace !== 'all' ? activeSpace : 'Agency' });
          if (window.showToast) window.showToast('Subtask created!');
          loadData();
          // Optionally refresh drawer or close it; closing it is easiest for now
          this.closeDrawer();
        } catch(e) {
          if (window.showToast) window.showToast('Failed to create subtask', 'error');
        }
      }
    },
    async markApproved() {
      if (activeTaskId) {
        await this.updateStage(activeTaskId, 'Approved');
        this.closeDrawer();
      }
    },
    openNewTask() {
      const title = prompt('Enter task title:');
      if (title) {
        APP_API.post('/tasks', { title, client: activeSpace !== 'all' ? activeSpace : 'Agency', stage: 'Briefing' })
          .then(() => {
            if (window.showToast) window.showToast('Task created successfully!');
            loadData();
          })
          .catch(() => {
            if (window.showToast) window.showToast('Failed to create task', 'error');
            else alert('Failed to create task');
          });
      }
    }
  };

  await loadData();
  if (window.KANBAN_MODULE && window.KANBAN_MODULE.populateFilterDropdowns) {
    window.KANBAN_MODULE.populateFilterDropdowns();
  }
};
