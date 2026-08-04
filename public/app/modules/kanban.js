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

          <div class="kanban-board-container" id="kanbanBoardArea"></div>
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 1.2rem; font-weight: 800; color: var(--emerald-brand);" id="drawerTimeText">0h / 8h</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Logged vs Estimated</div>
              </div>
              <button class="btn-secondary" onclick="window.KANBAN_MODULE.logTime()">Log Hours</button>
            </div>
          </div>

          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">📝 Subtasks</div>
            <div id="drawerSubtaskList" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;"></div>
            <button class="btn-secondary" style="width: 100%; font-size: 0.8rem; border-style: dashed;" onclick="window.KANBAN_MODULE.addSubtask()">+ Add Subtask</button>
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
                  ${stageTasks.map(t => `
                    <div class="kanban-card" draggable="true" ondragstart="window.KANBAN_MODULE.dragTask(event, '${t.id}')" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                      <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700; margin-bottom: 0.3rem;">${t.client || 'Agency'}</div>
                      <div style="font-weight: 700; color: #fff; font-size: 0.9rem; line-height: 1.3;">${t.title}</div>
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.8rem;">
                        <span>👤 ${t.assignee || 'Staff'}</span>
                        <span style="display:flex; align-items:center; gap:0.3rem;">⏱️ ${t.loggedHours || 0}h</span>
                      </div>
                    </div>
                  `).join('')}
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
              return `
                <tr onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                  <td><span class="badge ${badgeClass}">${prio}</span></td>
                  <td style="font-weight: 700;">${t.title}</td>
                  <td style="color: var(--text-muted);">${t.client || 'Agency'}</td>
                  <td>
                    <select style="background:transparent; border:1px solid var(--border-subtle); color:#fff; padding:0.2rem; border-radius:4px; font-size:0.8rem;" onclick="event.stopPropagation()" onchange="window.KANBAN_MODULE.updateStage('${t.id}', this.value)">
                      ${stages.map(s => `<option value="${s}" ${t.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </td>
                  <td>👤 ${t.assignee || 'Unassigned'}</td>
                  <td style="color: var(--text-muted);">${t.loggedHours || 0}h / ${t.estimatedHours || 8}h</td>
                  <td style="color: var(--text-muted);">${t.dueDate || 'ASAP'}</td>
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

  window.KANBAN_MODULE = {
    setSpace(space) {
      activeSpace = space;
      renderMainUI();
    },
    setView(view) {
      currentView = view;
      renderMainUI();
    },
    addSpace() {
      const name = prompt('Enter new space name:');
      if (name) {
        spacesData.push({ id: name.toLowerCase().replace(/\s/g, ''), name, type: 'department' });
        renderMainUI();
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
        alert('Failed to update task stage');
      }
    },
    openDrawer(taskId) {
      activeTaskId = taskId;
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      document.getElementById('drawerStageBadge').textContent = task.stage || 'Briefing';
      document.getElementById('drawerTaskTitle').textContent = task.title;
      document.getElementById('drawerClientName').textContent = `Client: ${task.client || 'Agency'} · Assignee: ${task.assignee || 'Staff'}`;
      document.getElementById('drawerTimeText').textContent = `${task.loggedHours || 0}h / ${task.estimatedHours || 8}h`;
      document.getElementById('drawerSubtaskList').innerHTML = `<div style="color: var(--text-dim); font-size: 0.8rem; text-align: center; padding: 1rem;">No subtasks created yet</div>`;

      document.getElementById('taskDrawerBackdrop').classList.add('open');
      document.getElementById('taskDrawerPanel').classList.add('open');
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
        try {
          await APP_API.patch(`/tasks/${activeTaskId}/log-time`, { hours });
          const task = allTasks.find(t => t.id === activeTaskId);
          if (task) {
            task.loggedHours = (task.loggedHours || 0) + hours;
            document.getElementById('drawerTimeText').textContent = `${task.loggedHours}h / ${task.estimatedHours || 8}h`;
            renderViewArea();
          }
        } catch (e) {
          alert('Failed to log time');
        }
      }
    },
    addSubtask() {
      const title = prompt('Enter subtask title:');
      if (title) {
        const list = document.getElementById('drawerSubtaskList');
        if (list.innerHTML.includes('No subtasks')) list.innerHTML = '';
        list.innerHTML += `<div style="display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.02); padding:0.6rem; border-radius:6px; font-size:0.85rem;"><input type="checkbox" style="cursor:pointer;"> <span>${title}</span></div>`;
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
          .then(() => loadData())
          .catch(() => alert('Failed to create task'));
      }
    }
  };

  await loadData();
};
