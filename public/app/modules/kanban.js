/**
 * public/app/modules/kanban.js
 * Production Kanban & Projects Management Module v3.0
 * Features:
 * - 4 Modular Workflows (Video, Social, Branding, Dev) with dynamic stage pipelines
 * - Full-featured Task Creation Modal (replaces legacy prompt)
 * - Pre-built agency task templates
 * - Enhanced Kanban Cards (Priority bars, due date badges, subtask progress, time tracking bar)
 * - Fully functional Monthly Calendar View + Backlog Sidebar
 * - Multi-select bulk actions, Task Drawer, Time Logging, Comments & Subtasks
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.kanban = async function(container) {
  let allTasks = [];
  let teamMembers = [];
  let clientList = [];
  let spacesData = [
    { id: 'internal', name: 'Internal Agency', type: 'department' },
    { id: 'clients', name: 'Client Campaigns', type: 'client' }
  ];
  let activeSpace = 'all';
  let activeWorkflowFilter = 'all'; // 'all', 'video', 'social', 'branding', 'dev'
  let currentView = 'kanban'; // 'kanban', 'list', 'calendar'
  let activeTaskId = null;
  let selectedTasks = new Set();
  let lastSelectedTaskId = null;

  // Calendar State
  let calCurrentYear = new Date().getFullYear();
  let calCurrentMonth = new Date().getMonth(); // 0-indexed

  // Workflow Types & Default Stage Pipelines (hydrated dynamically from API)
  let WORKFLOW_TYPES = {
    video: {
      name: 'Video Production',
      icon: '🎬',
      stages: ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved']
    },
    social: {
      name: 'Social & Content',
      icon: '📢',
      stages: ['Briefing', 'Content Draft', 'Design', 'Copy Review', 'Client Approval', 'Scheduled', 'Published']
    },
    branding: {
      name: 'Branding & Design',
      icon: '🎨',
      stages: ['Briefing', 'Strategy', 'Concept Design', 'Client Refinement', 'Final Delivery', 'Approved']
    },
    dev: {
      name: 'Dev & Tech',
      icon: '💻',
      stages: ['Briefing', 'Wireframe', 'Development', 'QA Testing', 'Client UAT', 'Approved']
    }
  };

  // Pre-built Agency Task Blueprints
  const PRESET_TEMPLATES = [
    {
      id: 'tvc_prod',
      name: '📦 Commercial TVC / OVC Production',
      workflow: 'video',
      estimatedHours: 40,
      description: 'End-to-end commercial video shoot: script writing, talent scouting, lighting setup, 4K shoot, color grading, sound design and final master cut.'
    },
    {
      id: 'reels_pkg',
      name: '📦 Social Media Reels Campaign (10 Reels)',
      workflow: 'social',
      estimatedHours: 20,
      description: '10 viral short-form videos tailored for IG Reels & TikTok including scriptwriting, filming, motion graphics, audio sync, and scheduling.'
    },
    {
      id: 'brand_360',
      name: '📦 360° Brand Identity System',
      workflow: 'branding',
      estimatedHours: 35,
      description: 'Full brand guidelines, logo suite, color palette, typography stack, social media templates, merchandise and packaging collateral.'
    },
    {
      id: 'web_build',
      name: '📦 High-Converting Landing Page & App',
      workflow: 'dev',
      estimatedHours: 30,
      description: 'Custom responsive web app / landing page design, Next.js / Vite build, database integration, SEO optimization, and analytics setup.'
    }
  ];

  async function loadData() {
    try {
      const [tasksRes, spacesRes, teamRes, clientsRes, stagesRes] = await Promise.all([
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/projects/spaces').catch(() => []),
        APP_API.get('/team').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/workflows/stages').catch(() => null)
      ]);

      allTasks = Array.isArray(tasksRes) ? tasksRes : [];
      if (spacesRes && spacesRes.length > 0) spacesData = spacesRes;
      teamMembers = Array.isArray(teamRes) ? teamRes : [];
      clientList = Array.isArray(clientsRes) ? clientsRes : [];
      if (stagesRes && Object.keys(stagesRes).length > 0) {
        WORKFLOW_TYPES = { ...WORKFLOW_TYPES, ...stagesRes };
      }

      renderMainUI();
    } catch (e) {
      console.error('[Kanban] Failed to load initial data', e);
    }
  }


  function getActiveStages() {
    if (activeWorkflowFilter !== 'all' && WORKFLOW_TYPES[activeWorkflowFilter]) {
      return WORKFLOW_TYPES[activeWorkflowFilter].stages;
    }
    // Default fallback to standard 6-stage pipeline
    return ['Briefing', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved'];
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High':   return '#f59e0b';
      case 'Medium': return '#7c3aed';
      case 'Low':    return '#64748b';
      default:       return '#7c3aed';
    }
  }

  function renderMainUI() {
    container.innerHTML = `
      <style>
        .kanban-layout { display: flex; gap: 1.25rem; height: calc(100vh - 110px); }
        .kanban-sidebar { width: 230px; background: var(--surface-1); border-right: 1px solid var(--border-subtle); border-radius: 16px; padding: 1rem 0.85rem; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; flex-shrink: 0; }
        .sidebar-section-title { font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800; letter-spacing: 0.06em; margin-top: 0.8rem; margin-bottom: 0.3rem; padding-left: 0.6rem; }
        
        .space-item { padding: 0.55rem 0.75rem; border-radius: 10px; cursor: pointer; color: var(--text-muted); font-size: 0.84rem; font-weight: 600; transition: var(--transition-fast); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .space-item:hover { background: var(--surface-3); color: var(--text-primary); }
        .space-item.active { background: rgba(124, 58, 237, 0.18); color: var(--purple-light); font-weight: 700; border-left: 3px solid var(--purple-brand); }
        
        .kanban-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        
        .view-toggles { display: flex; gap: 0.35rem; background: var(--surface-1); padding: 0.3rem; border-radius: 12px; border: 1px solid var(--border-subtle); }
        .view-btn { padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; border: none; background: transparent; color: var(--text-muted); font-weight: 600; transition: var(--transition-fast); }
        .view-btn.active { background: var(--gradient-brand); color: #fff; box-shadow: var(--shadow-sm); }

        .filter-bar { margin-bottom: 1rem; display: flex; gap: 0.6rem; flex-wrap: wrap; background: var(--surface-1); padding: 0.75rem; border-radius: 14px; border: 1px solid var(--border-subtle); align-items: center; }

        .kanban-board-container { flex: 1; overflow-x: auto; overflow-y: hidden; }
        .kanban-grid { display: flex; gap: 1rem; height: 100%; padding-bottom: 1rem; }
        .kanban-col { min-width: 290px; max-width: 290px; background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
        .kanban-col-header { padding: 0.9rem 1.1rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.82rem; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--surface-2); }
        .kanban-col-body { padding: 0.8rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; }
        
        .kanban-card { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1rem; cursor: grab; transition: var(--transition-fast); position: relative; display: flex; flex-direction: column; gap: 0.6rem; box-shadow: var(--shadow-sm); }
        .kanban-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card); border-color: var(--border-glow); }
        .kanban-card:active { cursor: grabbing; }
        
        .kanban-list-view { width: 100%; border-collapse: collapse; text-align: left; background: var(--surface-1); border-radius: 16px; border: 1px solid var(--border-subtle); overflow: hidden; }
        .kanban-list-view th { padding: 0.85rem 1rem; background: var(--surface-2); border-bottom: 1px solid var(--border-subtle); color: var(--text-dim); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .kanban-list-view td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-subtle); font-size: 0.85rem; color: var(--text-primary); }
        .kanban-list-view tr:hover td { background: rgba(255,255,255,0.03); cursor: pointer; }

        /* Calendar View Styles */
        .calendar-wrapper { display: flex; gap: 1.25rem; height: 100%; overflow: hidden; }
        .calendar-main-grid { flex: 1; background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; padding: 1rem; }
        .calendar-header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .calendar-grid-table { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; flex: 1; overflow-y: auto; }
        .cal-day-header { text-align: center; font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; padding: 0.4rem; background: var(--surface-2); border-radius: 6px; }
        .cal-cell { background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 10px; min-height: 85px; padding: 0.4rem; display: flex; flex-direction: column; gap: 0.3rem; overflow-y: auto; }
        .cal-cell.other-month { opacity: 0.35; background: transparent; }
        .cal-cell.today { border-color: var(--purple-brand); box-shadow: 0 0 8px rgba(124,58,237,0.3); }
        .cal-date-num { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-align: right; }
        .cal-task-chip { padding: 0.25rem 0.45rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: #fff; cursor: pointer; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; display: flex; align-items: center; gap: 0.3rem; }

        .calendar-backlog-panel { width: 260px; background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; flex-shrink: 0; }

        /* Drawer Overlay */
        .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 10000; display: none; opacity: 0; transition: opacity 0.3s; }
        .drawer-panel { position: fixed; right: -520px; top: 0; bottom: 0; width: 480px; max-width: 95vw; background: var(--surface-1); border-left: 1px solid var(--border-glow); z-index: 10001; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; box-shadow: var(--shadow-elevated); }
        .drawer-panel.open { right: 0; }
        .drawer-backdrop.open { display: block; opacity: 1; }
        .drawer-header { padding: 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: flex-start; background: var(--surface-2); }
        .drawer-body { padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .drawer-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-subtle); background: var(--surface-2); display: flex; justify-content: flex-end; gap: 0.8rem; }
      </style>

      <div class="kanban-layout">
        <!-- Sidebar Navigation -->
        <div class="kanban-sidebar">
          <div class="sidebar-section-title">Workspaces</div>
          <div class="space-item ${activeSpace === 'all' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('all')">
            <span>🌐 All Projects</span>
          </div>
          ${spacesData.map(s => `
            <div class="space-item ${activeSpace === s.name ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('${s.name}')">
              <span>${s.type === 'client' ? '🟣' : '🏢'} ${escapeHTML(s.name)}</span>
            </div>
          `).join('')}
          <div style="margin-top: 0.3rem;">
            <button class="btn-secondary btn-sm" style="width: 100%; border-style: dashed;" onclick="window.KANBAN_MODULE.addSpace()">+ New Space</button>
          </div>

          <div class="sidebar-section-title">Workflow Pipeline</div>
          <div class="space-item ${activeWorkflowFilter === 'all' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setWorkflowFilter('all')">
            <span>⚡ All Workflows</span>
          </div>
          ${Object.keys(WORKFLOW_TYPES).map(key => {
            const wf = WORKFLOW_TYPES[key];
            return `
              <div class="space-item ${activeWorkflowFilter === key ? 'active' : ''}" onclick="window.KANBAN_MODULE.setWorkflowFilter('${key}')">
                <span>${wf.icon} ${wf.name}</span>
              </div>
            `;
          }).join('')}
          <div style="margin-top: 0.3rem;">
            <button class="btn-secondary btn-sm" style="width: 100%; border-style: dashed;" onclick="window.KANBAN_MODULE.openStageEditor()">⚙️ Edit Pipeline Stages</button>
          </div>
        </div>


        <!-- Main Content Area -->
        <div class="kanban-main">
          <div class="kanban-header">
            <div>
              <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.2rem;">
                ${activeSpace === 'all' ? 'Production Pipeline Hub' : escapeHTML(activeSpace)}
                ${activeWorkflowFilter !== 'all' ? `<span style="font-size:0.85rem; font-weight:600; color:var(--purple-light); margin-left:0.5rem;">(${WORKFLOW_TYPES[activeWorkflowFilter].name})</span>` : ''}
              </h1>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                Manage agency tasks, time tracking, blueprints, and delivery schedules.
              </div>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center;">
              <div class="view-toggles">
                <button class="view-btn ${currentView === 'kanban' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('kanban')">🗂️ Board</button>
                <button class="view-btn ${currentView === 'list' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('list')">📄 List</button>
                <button class="view-btn ${currentView === 'calendar' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('calendar')">📅 Calendar</button>
              </div>
              <button class="btn-primary" onclick="window.KANBAN_MODULE.openNewTaskModal()">+ New Task</button>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="filter-bar">
            <input type="text" id="kanbanSearchQuery" placeholder="🔍 Search tasks or clients..." oninput="window.KANBAN_MODULE.applyFilters()" class="input-text" style="width: 220px; padding: 0.45rem 0.85rem;">
            
            <select id="kanbanFilterAssignee" onchange="window.KANBAN_MODULE.applyFilters()" class="input-text" style="width: 170px; padding: 0.45rem 0.85rem;">
              <option value="">All Assignees</option>
            </select>
            
            <select id="kanbanFilterPriority" onchange="window.KANBAN_MODULE.applyFilters()" class="input-text" style="width: 150px; padding: 0.45rem 0.85rem;">
              <option value="">All Priorities</option>
              <option value="Urgent">🔴 Urgent</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🔵 Medium</option>
              <option value="Low">⚪ Low</option>
            </select>

            <select id="kanbanFilterWorkflow" onchange="window.KANBAN_MODULE.setWorkflowFilter(this.value)" class="input-text" style="width: 170px; padding: 0.45rem 0.85rem;">
              <option value="all">⚡ All Workflows</option>
              <option value="video" ${activeWorkflowFilter === 'video' ? 'selected' : ''}>🎬 Video Production</option>
              <option value="social" ${activeWorkflowFilter === 'social' ? 'selected' : ''}>📢 Social & Content</option>
              <option value="branding" ${activeWorkflowFilter === 'branding' ? 'selected' : ''}>🎨 Branding & Design</option>
              <option value="dev" ${activeWorkflowFilter === 'dev' ? 'selected' : ''}>💻 Dev & Tech</option>
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
            <h2 id="drawerTaskTitle" style="margin: 0; font-size: 1.2rem; font-family: var(--font-heading); color: var(--text-primary);">Task Title</h2>
            <div id="drawerClientName" style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.3rem;">Client: Agency · Assignee: Staff</div>
          </div>
          <button class="modal-close" onclick="window.KANBAN_MODULE.closeDrawer()">✕</button>
        </div>
        
        <div class="drawer-body">
          <!-- QC Panel & Blocker UI -->
          <div id="drawerQcPanel" style="display:none; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:1.1rem; margin-bottom:0.5rem;">
            <div style="font-size:0.78rem; font-weight:800; color:var(--amber-brand); margin-bottom:0.5rem; text-transform:uppercase;">🔍 Internal QC Handoff Actions</div>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-primary" style="flex:1; font-size:0.78rem; background:linear-gradient(135deg,#10b981,#059669);" onclick="window.KANBAN_MODULE.qcApproveActiveTask()">
                ✅ QC Approve → Client Review
              </button>
              <button class="btn-secondary" style="flex:1; font-size:0.78rem; border-color:#ef4444; color:#ef4444;" onclick="window.KANBAN_MODULE.qcRejectActiveTask()">
                ↩️ Return Briefing Revisions
              </button>
            </div>
          </div>

          <div style="background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.1rem;">
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">⏱️ Time Tracking</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
              <div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--emerald-brand);" id="drawerTimeText">0h / 8h</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Logged vs Estimated</div>
              </div>
              <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.logTime()">Log Hours</button>
            </div>
            <div id="drawerTimeLogList" style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;"></div>
          </div>

          <!-- Dependency / Blocker Panel -->
          <div style="background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.1rem;">
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">🔒 Task Dependency / Blocker</div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <select id="drawerBlockerSelect" class="input-text" style="flex:1; font-size:0.82rem;" onchange="window.KANBAN_MODULE.setTaskBlocker(this.value)">
                <option value="">No Blocker Task (Clear)</option>
              </select>
            </div>
            <div id="drawerBlockerStatus" style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;"></div>
          </div>

          <div>
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">📝 Subtasks Checklist</div>
            <div id="drawerSubtaskList" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;"></div>
            <button class="btn-secondary btn-sm" style="width: 100%; border-style: dashed;" onclick="window.KANBAN_MODULE.addSubtask()">+ Add Subtask Item</button>
          </div>
          
          <div>
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">💬 Activity & Discussion</div>
            <div id="drawerCommentsList" style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1rem; max-height:280px; overflow-y:auto; padding-right:0.3rem;"></div>
            <form onsubmit="window.KANBAN_MODULE.postComment(event)" style="display:flex; gap:0.5rem;">
              <input type="text" id="drawerCommentInput" placeholder="Write a comment..." class="input-text" style="flex:1; padding:0.55rem 0.85rem;" required>
              <button type="submit" class="btn-primary btn-sm">Post</button>
            </form>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.closeDrawer()">Close</button>
          <button class="btn-primary btn-sm" onclick="window.KANBAN_MODULE.markApproved()">Mark Approved</button>
        </div>
      </div>

      <!-- Rich Task Creation Modal -->
      <div class="modal-overlay" id="newTaskModalOverlay">
        <div class="modal-content" style="max-width: 580px;">
          <div class="modal-header">
            <span>📋 Create New Production Task</span>
            <button class="modal-close" onclick="window.KANBAN_MODULE.closeNewTaskModal()">✕</button>
          </div>
          <div class="modal-body" style="gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Task Blueprint / Preset (Optional)</label>
              <select id="ntPresetSelect" class="input-text" onchange="window.KANBAN_MODULE.applyTemplatePreset(this.value)">
                <option value="">-- Custom Blank Task --</option>
                ${PRESET_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Task Title *</label>
              <input type="text" id="ntTitle" class="input-text" placeholder="e.g. Commercial Reel Edit for Chillox" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Workflow Type *</label>
                <select id="ntWorkflow" class="input-text" onchange="window.KANBAN_MODULE.onModalWorkflowChange(this.value)">
                  <option value="video">🎬 Video Production</option>
                  <option value="social">📢 Social & Content</option>
                  <option value="branding">🎨 Branding & Design</option>
                  <option value="dev">💻 Dev & Tech</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Stage Pipeline</label>
                <select id="ntStage" class="input-text"></select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Client / Account Space</label>
                <select id="ntClient" class="input-text">
                  <option value="Agency">Internal Agency</option>
                  ${clientList.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Assignee</label>
                <select id="ntAssignee" class="input-text">
                  <option value="">Unassigned</option>
                  ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}">${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Priority</label>
                <select id="ntPriority" class="input-text">
                  <option value="Medium" selected>🔵 Medium</option>
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Due Date</label>
                <input type="date" id="ntDueDate" class="input-text">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Est. Hours</label>
                <input type="number" id="ntEstHours" class="input-text" placeholder="8" value="8" min="1">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Brief & Description</label>
              <textarea id="ntDescription" class="input-text" style="height: 75px;" placeholder="Add production notes, client specs, link to assets..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="window.KANBAN_MODULE.closeNewTaskModal()">Cancel</button>
            <button class="btn-primary" onclick="window.KANBAN_MODULE.submitNewTaskModal()">🚀 Create Task</button>
          </div>
        </div>
      </div>
    `;

    renderViewArea();
  }

  function getFilteredTasks() {
    let displayTasks = allTasks;

    // Filter by active workspace space
    if (activeSpace !== 'all') {
      displayTasks = displayTasks.filter(t => t.client === activeSpace || t.category === activeSpace);
    }

    // Filter by Workflow
    if (activeWorkflowFilter !== 'all') {
      displayTasks = displayTasks.filter(t => {
        const wf = (t.workflow_type || t.category || '').toLowerCase();
        if (wf.includes(activeWorkflowFilter)) return true;
        // Fallback detection
        if (activeWorkflowFilter === 'video' && (t.department === 'Video' || (t.title || '').toLowerCase().includes('video') || (t.title || '').toLowerCase().includes('reel'))) return true;
        if (activeWorkflowFilter === 'social' && (t.department === 'Social' || (t.title || '').toLowerCase().includes('post'))) return true;
        if (activeWorkflowFilter === 'branding' && (t.department === 'Graphics' || (t.title || '').toLowerCase().includes('brand'))) return true;
        if (activeWorkflowFilter === 'dev' && (t.department === 'Tech' || (t.title || '').toLowerCase().includes('app'))) return true;
        return false;
      });
    }

    // Apply Filter Bar criteria
    const searchQ = document.getElementById('kanbanSearchQuery')?.value.toLowerCase() || '';
    const assigneeF = document.getElementById('kanbanFilterAssignee')?.value || '';
    const priorityF = document.getElementById('kanbanFilterPriority')?.value || '';
    
    return displayTasks.filter(t => {
      if (searchQ && !t.title.toLowerCase().includes(searchQ) && !(t.client || '').toLowerCase().includes(searchQ)) return false;
      if (assigneeF && t.assignee !== assigneeF) return false;
      if (priorityF && t.priority !== priorityF) return false;
      return true;
    });
  }

  function renderViewArea() {
    const area = document.getElementById('kanbanBoardArea');
    if (!area) return;

    const displayTasks = getFilteredTasks();
    const currentStages = getActiveStages();

    if (currentView === 'kanban') {
      area.innerHTML = `
        <div class="kanban-grid">
          ${currentStages.map(stg => {
            const stageTasks = displayTasks.filter(t => (t.stage || currentStages[0]) === stg);
            return `
              <div class="kanban-col" ondragover="event.preventDefault()" ondrop="window.KANBAN_MODULE.dropTask(event, '${escapeHTML(stg)}')">
                <div class="kanban-col-header">
                  <span>${escapeHTML(stg)}</span>
                  <span class="badge badge-purple">${stageTasks.length}</span>
                </div>
                <div class="kanban-col-body">
                  ${stageTasks.map(t => {
                    const safeClient = escapeHTML(t.client || 'Agency');
                    const safeTitle = escapeHTML(t.title);
                    const safeAssignee = escapeHTML(t.assignee || 'Unassigned');
                    const assigneeInitials = escapeHTML(safeAssignee.substring(0, 2).toUpperCase());
                    const priorityColor = getPriorityColor(t.priority);
                    const loggedH = Number(t.loggedHours || 0);
                    const estH = Number(t.estimatedHours || 8);
                    const timeProgress = Math.min(100, Math.round((loggedH / estH) * 100));
                    
                    // Due Date Check
                    let isOverdue = false;
                    let dueStr = '';
                    if (t.dueDate || t.due_date) {
                      const d = new Date(t.dueDate || t.due_date);
                      if (!isNaN(d)) {
                        dueStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        if (d < new Date() && stg !== 'Approved' && stg !== 'Published') {
                          isOverdue = true;
                        }
                      }
                    }

                    return `
                    <div class="kanban-card" 
                         style="border-left: 4px solid ${priorityColor}; ${t.priority === 'Urgent' ? 'background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--surface-2));' : ''}" 
                         draggable="true" 
                         ondragstart="window.KANBAN_MODULE.dragTask(event, '${t.id}')" 
                         onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                      
                      <input type="checkbox" class="task-cb" ${selectedTasks.has(t.id) ? 'checked' : ''} onclick="event.stopPropagation(); window.KANBAN_MODULE.toggleSelect(event, '${t.id}')" style="position:absolute; top:0.8rem; right:0.8rem; transform:scale(1.15); cursor:pointer; accent-color: var(--purple-brand);">
                      
                      <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 700; padding-right: 1.5rem;">
                        🏢 ${safeClient}
                      </div>

                      <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; line-height: 1.35;">
                        ${safeTitle}
                      </div>

                      <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; font-size: 0.7rem;">
                        ${t.priority ? `<span class="badge" style="background:rgba(255,255,255,0.06); color:${priorityColor}; border:1px solid ${priorityColor}55;">${escapeHTML(t.priority)}</span>` : ''}
                        ${dueStr ? `<span class="badge ${isOverdue ? 'badge-pink' : 'badge-gray'}">📅 ${dueStr} ${isOverdue ? '⚠️' : ''}</span>` : ''}
                      </div>

                      <!-- Hours Progress Bar -->
                      <div style="margin-top: 0.2rem;">
                        <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: var(--text-dim); margin-bottom: 0.2rem;">
                          <span>⏱️ ${loggedH}h / ${estH}h</span>
                          <span>${timeProgress}%</span>
                        </div>
                        <div style="height: 4px; background: var(--surface-3); border-radius: 999px; overflow: hidden;">
                          <div style="width: ${timeProgress}%; height: 100%; background: ${timeProgress >= 100 ? 'var(--emerald-brand)' : 'var(--gradient-brand)'};"></div>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                        <div style="display:flex; align-items:center; gap:0.4rem;">
                          <div style="width:22px; height:22px; border-radius:50%; background:var(--gradient-rose); font-size:0.65rem; font-weight:800; color:#fff; display:flex; align-items:center; justify-content:center;">
                            ${assigneeInitials}
                          </div>
                          <span>${safeAssignee}</span>
                        </div>
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
              <th>Stage Pipeline</th>
              <th>Assignee</th>
              <th>Time Logged</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${displayTasks.map(t => {
              const prio = (t.priority || 'Medium');
              const priorityColor = getPriorityColor(prio);
              const safeTitle = escapeHTML(t.title);
              const safeClient = escapeHTML(t.client || 'Agency');
              const safeAssignee = escapeHTML(t.assignee || 'Unassigned');
              return `
                <tr onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                  <td onclick="event.stopPropagation()"><input type="checkbox" class="task-cb" ${selectedTasks.has(t.id) ? 'checked' : ''} onclick="window.KANBAN_MODULE.toggleSelect(event, '${t.id}')" style="transform:scale(1.15); cursor:pointer; accent-color: var(--purple-brand);"></td>
                  <td><span class="badge" style="background:rgba(255,255,255,0.06); color:${priorityColor}; border:1px solid ${priorityColor}55;">${escapeHTML(prio)}</span></td>
                  <td style="font-weight: 700; color: var(--text-primary);">${safeTitle}</td>
                  <td style="color: var(--purple-light); font-weight:600;">🏢 ${safeClient}</td>
                  <td>
                    <select style="background:var(--surface-3); border:1px solid var(--border-subtle); color:var(--text-primary); padding:0.3rem 0.5rem; border-radius:8px; font-size:0.78rem;" onclick="event.stopPropagation()" onchange="window.KANBAN_MODULE.updateStage('${t.id}', this.value)">
                      ${currentStages.map(s => `<option value="${s}" ${t.stage === s ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('')}
                    </select>
                  </td>
                  <td>👤 ${safeAssignee}</td>
                  <td style="color: var(--text-muted); font-weight:600;">⏱️ ${escapeHTML(t.loggedHours || 0)}h / ${escapeHTML(t.estimatedHours || 8)}h</td>
                  <td style="color: var(--text-muted);">${escapeHTML(t.dueDate || t.due_date || 'ASAP')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (currentView === 'calendar') {
      renderCalendarView(area, displayTasks);
    }
  }

  function renderCalendarView(area, tasks) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // First day of month & Total days
    const firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

    // Partition tasks: Scheduled vs Backlog
    const scheduledTasks = [];
    const backlogTasks = [];

    tasks.forEach(t => {
      const dStr = t.dueDate || t.due_date;
      if (dStr) {
        const d = new Date(dStr);
        if (!isNaN(d)) {
          scheduledTasks.push({ ...t, parsedDate: d });
          return;
        }
      }
      backlogTasks.push(t);
    });

    let cellsHtml = '';

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      cellsHtml += `<div class="cal-cell other-month"><div class="cal-date-num">${prevMonthDays - i}</div></div>`;
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = (today.getFullYear() === calCurrentYear && today.getMonth() === calCurrentMonth && today.getDate() === day);
      
      const dayTasks = scheduledTasks.filter(t => 
        t.parsedDate.getFullYear() === calCurrentYear &&
        t.parsedDate.getMonth() === calCurrentMonth &&
        t.parsedDate.getDate() === day
      );

      cellsHtml += `
        <div class="cal-cell ${isToday ? 'today' : ''}">
          <div class="cal-date-num">${day}</div>
          ${dayTasks.map(t => {
            const pColor = getPriorityColor(t.priority);
            return `
              <div class="cal-task-chip" style="background: ${pColor};" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                <span>•</span> ${escapeHTML(t.title)}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    area.innerHTML = `
      <div class="calendar-wrapper">
        <div class="calendar-main-grid">
          <div class="calendar-header-nav">
            <h2 style="font-size:1.15rem; font-weight:800; font-family:var(--font-heading); margin:0;">
              📅 ${monthNames[calCurrentMonth]} ${calCurrentYear}
            </h2>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.changeCalMonth(-1)">◀ Prev</button>
              <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.setCalToday()">Today</button>
              <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.changeCalMonth(1)">Next ▶</button>
            </div>
          </div>

          <div class="calendar-grid-table">
            <div class="cal-day-header">Sun</div>
            <div class="cal-day-header">Mon</div>
            <div class="cal-day-header">Tue</div>
            <div class="cal-day-header">Wed</div>
            <div class="cal-day-header">Thu</div>
            <div class="cal-day-header">Fri</div>
            <div class="cal-day-header">Sat</div>
            ${cellsHtml}
          </div>
        </div>

        <!-- Backlog Unscheduled Sidebar -->
        <div class="calendar-backlog-panel">
          <div style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--text-dim); letter-spacing:0.05em;">
            📦 Unscheduled Backlog (${backlogTasks.length})
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">
            Tasks without an assigned due date.
          </div>
          <div style="display:flex; flex-direction:column; gap:0.6rem; flex:1; overflow-y:auto;">
            ${backlogTasks.map(t => {
              const pColor = getPriorityColor(t.priority);
              return `
                <div class="card-glass" style="padding:0.75rem; cursor:pointer; border-left:3px solid ${pColor};" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                  <div style="font-weight:700; font-size:0.82rem; color:var(--text-primary);">${escapeHTML(t.title)}</div>
                  <div style="font-size:0.72rem; color:var(--purple-light); margin-top:0.2rem;">🏢 ${escapeHTML(t.client || 'Agency')}</div>
                </div>
              `;
            }).join('') || `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:1.5rem;">All tasks scheduled!</div>`}
          </div>
        </div>
      </div>
    `;
  }

  window.KANBAN_MODULE = {
    setSpace(space) {
      activeSpace = space;
      renderMainUI();
      this.populateFilterDropdowns();
    },
    setWorkflowFilter(wfKey) {
      activeWorkflowFilter = wfKey;
      renderMainUI();
      this.populateFilterDropdowns();
    },
    setView(view) {
      currentView = view;
      renderMainUI();
      this.populateFilterDropdowns();
    },
    changeCalMonth(delta) {
      calCurrentMonth += delta;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear += 1;
      } else if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear -= 1;
      }
      renderViewArea();
    },
    setCalToday() {
      calCurrentYear = new Date().getFullYear();
      calCurrentMonth = new Date().getMonth();
      renderViewArea();
    },
    populateFilterDropdowns() {
      const select = document.getElementById('kanbanFilterAssignee');
      if (select) {
        const assignees = [...new Set(allTasks.map(t => t.assignee).filter(Boolean))];
        const currentVal = select.value;
        select.innerHTML = '<option value="">All Assignees</option>' + assignees.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join('');
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
      
      renderViewArea();
      this.renderBulkToolbar();
    },
    addSpace() {
      const name = prompt('Enter new space name:');
      if (name && name.trim()) {
        APP_API.post('/projects/spaces', { name: name.trim() }).then(() => loadData());
      }
    },
    renderBulkToolbar() {
      const container = document.getElementById('bulkToolbarContainer');
      if (!container) return;
      if (selectedTasks.size === 0) {
        container.innerHTML = '';
        return;
      }
      const currentStages = getActiveStages();
      container.innerHTML = `
        <div style="background:var(--surface-2); border:1px solid var(--purple-brand); border-radius:16px; padding:0.75rem 1.5rem; display:flex; align-items:center; gap:1rem; box-shadow:var(--shadow-elevated); backdrop-filter:blur(8px);">
          <div style="font-weight:800; color:var(--text-primary); font-size:0.88rem;">${selectedTasks.size} Selected</div>
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <select id="bulkStageSelect" class="input-text" style="width: 150px; padding: 0.35rem 0.6rem;">
            <option value="">Move to Stage...</option>
            ${currentStages.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}
          </select>
          <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.applyBulkAction('stage')">Apply Stage</button>
          
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <input type="text" id="bulkAssigneeInput" placeholder="Assignee Name" class="input-text" style="width: 120px; padding: 0.35rem 0.6rem;">
          <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.applyBulkAction('assign')">Assign</button>
          
          <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
          <button class="btn-danger btn-sm" onclick="window.KANBAN_MODULE.applyBulkAction('delete')">Delete Selected</button>
          
          <button onclick="window.KANBAN_MODULE.clearSelection()" style="background:none; border:none; color:var(--text-muted); margin-left:0.5rem; cursor:pointer; font-size:1.1rem;">✕</button>
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
        if (res.success || res.task) {
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

    /* ── Modal Task Creation ── */
    openNewTaskModal() {
      const modal = document.getElementById('newTaskModalOverlay');
      if (!modal) return;

      // Populate stages for current modal workflow
      const wfSelect = document.getElementById('ntWorkflow');
      if (wfSelect) {
        const currentWf = activeWorkflowFilter !== 'all' ? activeWorkflowFilter : 'video';
        wfSelect.value = currentWf;
        this.onModalWorkflowChange(currentWf);
      }

      // Pre-select active space if client selected
      const clientSelect = document.getElementById('ntClient');
      if (clientSelect && activeSpace !== 'all') {
        clientSelect.value = activeSpace;
      }

      modal.classList.add('active');
    },
    closeNewTaskModal() {
      const modal = document.getElementById('newTaskModalOverlay');
      if (modal) modal.classList.remove('active');
    },
    onModalWorkflowChange(wfKey) {
      const stageSelect = document.getElementById('ntStage');
      if (!stageSelect) return;
      const wf = WORKFLOW_TYPES[wfKey] || WORKFLOW_TYPES['video'];
      stageSelect.innerHTML = wf.stages.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
    },
    applyTemplatePreset(presetId) {
      if (!presetId) return;
      const preset = PRESET_TEMPLATES.find(p => p.id === presetId);
      if (!preset) return;

      document.getElementById('ntTitle').value = preset.name.replace('📦 ', '');
      document.getElementById('ntWorkflow').value = preset.workflow;
      this.onModalWorkflowChange(preset.workflow);
      document.getElementById('ntEstHours').value = preset.estimatedHours;
      document.getElementById('ntDescription').value = preset.description;
    },
    async submitNewTaskModal() {
      const title = document.getElementById('ntTitle').value.trim();
      if (!title) return alert('Please enter a task title');

      const workflow_type = document.getElementById('ntWorkflow').value;
      const stage = document.getElementById('ntStage').value;
      const client = document.getElementById('ntClient').value;
      const assignee = document.getElementById('ntAssignee').value;
      const priority = document.getElementById('ntPriority').value;
      const due_date = document.getElementById('ntDueDate').value;
      const estimatedHours = Number(document.getElementById('ntEstHours').value) || 8;
      const description = document.getElementById('ntDescription').value.trim();

      const payload = {
        title,
        workflow_type,
        stage,
        client,
        assignee,
        priority,
        due_date,
        estimatedHours,
        description,
        category: workflow_type
      };

      try {
        const res = await APP_API.post('/tasks', payload);
        if (window.showToast) window.showToast('🚀 Task created successfully!', 'success');
        this.closeNewTaskModal();
        
        // Reset form
        document.getElementById('ntTitle').value = '';
        document.getElementById('ntDescription').value = '';
        
        loadData();
      } catch (err) {
        console.error('Failed to create task', err);
        if (window.showToast) window.showToast('Failed to create task', 'error');
        else alert('Failed to create task');
      }
    },

    /* ── Task Detail Drawer ── */
    async openDrawer(taskId) {
      activeTaskId = taskId;
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      document.getElementById('drawerStageBadge').textContent = task.stage || 'Briefing';
      document.getElementById('drawerTaskTitle').textContent = task.title;
      document.getElementById('drawerClientName').textContent = `Client: ${task.client || 'Agency'} · Assignee: ${task.assignee || 'Unassigned'}`;
      // Toggle QC Panel visibility
      const qcPanel = document.getElementById('drawerQcPanel');
      if (qcPanel) {
        qcPanel.style.display = (task.stage === 'Internal QC') ? 'block' : 'none';
      }

      // Populate Blocker Dropdown
      const blockerSelect = document.getElementById('drawerBlockerSelect');
      const blockerStatus = document.getElementById('drawerBlockerStatus');
      if (blockerSelect) {
        const otherTasks = allTasks.filter(t => t.id !== taskId);
        blockerSelect.innerHTML = '<option value="">No Blocker Task (Clear)</option>' +
          otherTasks.map(t => `<option value="${t.id}" ${task.blockedBy === t.id || task.blocked_by === t.id ? 'selected' : ''}>[${t.id}] ${escapeHTML(t.title)} (${t.stage})</option>`).join('');
      }
      if (blockerStatus) {
        const blockerId = task.blockedBy || task.blocked_by;
        if (blockerId) {
          const blockerTask = allTasks.find(t => t.id === blockerId);
          blockerStatus.innerHTML = `<span style="color:#ef4444; font-weight:700;">🔒 Blocked by: ${blockerId} (${blockerTask?.stage || 'Unknown'})</span>`;
        } else {
          blockerStatus.innerHTML = '<span style="color:var(--emerald-brand);">✅ Not blocked</span>';
        }
      }

      try {
        const [subtasks, logs, comments] = await Promise.all([
          APP_API.get(`/tasks/${taskId}/subtasks`).catch(() => []),
          APP_API.get(`/tasks/${taskId}/time-logs`).catch(() => []),
          APP_API.get(`/tasks/${taskId}/comments`).catch(() => [])
        ]);

        // Render Subtasks
        const subHtml = (subtasks || []).map(st => `
          <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface-3); padding:0.4rem 0.75rem; border-radius:8px;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="window.KANBAN_MODULE.toggleSubtask('${st.id}')" style="accent-color:var(--purple-brand); cursor:pointer;">
              <span style="${st.completed ? 'text-decoration:line-through; opacity:0.6;' : ''} font-size:0.84rem; color:var(--text-primary);">${escapeHTML(st.title)}</span>
            </div>
          </div>
        `).join('');
        document.getElementById('drawerSubtaskList').innerHTML = subHtml || '<div style="color:var(--text-dim); font-size:0.8rem; text-align:center; padding:0.5rem;">No subtasks created yet</div>';
        
        // Render Time Logs
        const logsHtml = (logs || []).map(l => `
          <div style="display:flex; justify-content:space-between; background:var(--surface-3); padding:0.4rem 0.6rem; border-radius:6px;">
            <span><span style="color:var(--purple-light); font-weight:700;">${escapeHTML(l.user_name || 'Staff')}</span>: ${escapeHTML(l.note || 'Logged time')}</span>
            <span style="color:var(--emerald-brand); font-weight:800;">+${l.duration_hours}h</span>
          </div>
        `).join('');
        document.getElementById('drawerTimeLogList').innerHTML = logsHtml || '<div style="color:var(--text-dim);">No time logged yet.</div>';

        // Render Comments
        const commentsHtml = (comments || []).map(c => `
          <div style="background:var(--surface-3); padding:0.75rem; border-radius:10px; border:1px solid var(--border-subtle);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; font-size:0.75rem;">
              <strong style="color:var(--purple-light);">${escapeHTML(c.author_name || 'Staff')}</strong>
              <span style="color:var(--text-dim);">${new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div style="font-size:0.85rem; color:var(--text-primary);">${escapeHTML(c.content)}</div>
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
      const title = prompt('Enter subtask item title:');
      if (title && title.trim()) {
        try {
          await APP_API.post(`/tasks/${activeTaskId}/subtasks`, { title: title.trim() });
          if (window.showToast) window.showToast('Subtask created!', 'success');
          this.openDrawer(activeTaskId);
        } catch(e) {
          if (window.showToast) window.showToast('Failed to create subtask', 'error');
        }
      }
    },
    async toggleSubtask(subtaskId) {
      try {
        await APP_API.patch(`/tasks/subtasks/${subtaskId}/toggle`);
        if (activeTaskId) this.openDrawer(activeTaskId);
      } catch (e) {
        console.error('Toggle subtask error', e);
      }
    },
    async qcApproveActiveTask() {
      if (!activeTaskId) return;
      try {
        await APP_API.post(`/tasks/${activeTaskId}/qc-approve`, {});
        if (window.showToast) window.showToast('✅ QC Approved! Advanced to Client Review', 'success');
        this.closeDrawer();
        loadData();
      } catch (err) {
        if (window.showToast) window.showToast('QC Approval failed: ' + err.message, 'error');
      }
    },
    async qcRejectActiveTask() {
      if (!activeTaskId) return;
      const feedback = prompt('Enter revision notes / feedback for the production team:');
      if (feedback === null) return;
      try {
        await APP_API.post(`/tasks/${activeTaskId}/qc-reject`, { feedback: feedback.trim() });
        if (window.showToast) window.showToast('↩️ Returned for Briefing revisions', 'success');
        this.closeDrawer();
        loadData();
      } catch (err) {
        if (window.showToast) window.showToast('QC Rejection failed: ' + err.message, 'error');
      }
    },
    async setTaskBlocker(blockedBy) {
      if (!activeTaskId) return;
      try {
        await APP_API.patch(`/tasks/${activeTaskId}/dependency`, { blockedBy: blockedBy || null });
        if (window.showToast) window.showToast(blockedBy ? '🔒 Task blocker configured!' : '🔓 Task blocker cleared', 'success');
        loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to set blocker: ' + err.message, 'error');
      }
    },
    async markApproved() {
      if (activeTaskId) {
        const currentStages = getActiveStages();
        const lastStage = currentStages[currentStages.length - 1];
        await this.updateStage(activeTaskId, lastStage);
        this.closeDrawer();
      }
    },

    /* ── Phase 3: Stage Editor ── */
    openStageEditor() {
      const targetWf = activeWorkflowFilter !== 'all' ? activeWorkflowFilter : 'video';
      const wf = WORKFLOW_TYPES[targetWf];
      if (!wf) return;

      const newStagesStr = prompt(`⚙️ Edit stage pipeline for ${wf.name} (${wf.icon}):\nEnter comma-separated stage names in order:`, wf.stages.join(', '));
      if (newStagesStr === null) return;

      const newStages = newStagesStr.split(',').map(s => s.trim()).filter(Boolean);
      if (newStages.length < 2) return alert('Pipeline must have at least 2 stages.');

      const payload = {
        [targetWf]: {
          stages: newStages
        }
      };

      APP_API.put('/workflows/stages', payload)
        .then(res => {
          if (window.showToast) window.showToast('✅ Workflow stages updated and saved!');
          else alert('Workflow stages updated!');
          loadData();
        })
        .catch(err => {
          alert('Failed to update stages: ' + (err.message || 'Permission denied'));
        });
    }
  };

  await loadData();

  if (window.KANBAN_MODULE && window.KANBAN_MODULE.populateFilterDropdowns) {
    window.KANBAN_MODULE.populateFilterDropdowns();
  }
};
