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

  // Space & Stage Editor State
  let selectedSpaceIcon = '📁';
  let selectedSpaceColor = '#a855f7';
  let editorActiveWf = 'video';
  let editorStages = [];
  let selectedNewWfIcon = '🌟';

  const DEFAULT_WORKFLOW_PRESETS = {
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

  const DEFAULT_CLIENTS = [
    { id: 'cli_chillox', name: 'Chillox Bangladesh', category: 'Food & Beverage' },
    { id: 'cli_aura', name: 'Aura Cosmetics', category: 'Beauty & Fashion' },
    { id: 'cli_apex', name: 'Apex Footwear', category: 'Retail' },
    { id: 'cli_gp', name: 'Grameenphone', category: 'Telecommunications' },
    { id: 'cli_daraz', name: 'Daraz Bangladesh', category: 'E-commerce' }
  ];

  const DEFAULT_TEAM_MEMBERS = [
    { emp_code: 'PBD-001', name: 'Mahmudul Hasan', role: 'Agency Owner / Director' },
    { emp_code: 'PBD-002', name: 'H. M. Ifteker Mahmud', role: 'Managing Director' },
    { emp_code: 'PBD-003', name: 'Borhan Uddin', role: 'Lead Video Producer' },
    { emp_code: 'PBD-004', name: 'Zahin', role: 'Senior Graphic Designer' },
    { emp_code: 'PBD-005', name: 'Ruhul Amin', role: 'QC & Quality Specialist' },
    { emp_code: 'PBD-006', name: 'Firoz Ahmed', role: 'Operations & Tech Lead' }
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
      teamMembers = (Array.isArray(teamRes) && teamRes.length > 0) ? teamRes : DEFAULT_TEAM_MEMBERS;
      clientList = (Array.isArray(clientsRes) && clientsRes.length > 0) ? clientsRes : DEFAULT_CLIENTS;
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
      <div class="kanban-layout">
        <!-- Sidebar Navigation -->
        <div class="kanban-sidebar">
          <div class="sidebar-section-title">Workspaces</div>
          <div class="space-item ${activeSpace === 'all' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('all')">
            <span>🌐 All Projects</span>
          </div>
          ${spacesData.map(s => `
            <div class="space-item ${activeSpace === s.name ? 'active' : ''}" onclick="window.KANBAN_MODULE.setSpace('${s.name}')">
              <span>${s.icon || (s.type === 'client' ? '🟣' : '🏢')} ${escapeHTML(s.name)}</span>
            </div>
          `).join('')}
          <div style="margin-top: 0.3rem;">
            <button class="btn-secondary btn-sm" style="width: 100%; border-style: dashed;" onclick="window.KANBAN_MODULE.openSpaceModal('create')">+ New Space</button>
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
                ${activeWorkflowFilter !== 'all' && WORKFLOW_TYPES[activeWorkflowFilter] ? `<span style="font-size:0.85rem; font-weight:600; color:var(--purple-light); margin-left:0.5rem;">(${WORKFLOW_TYPES[activeWorkflowFilter].name})</span>` : ''}
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
                <button class="view-btn ${currentView === 'dashboard' ? 'active' : ''}" onclick="window.KANBAN_MODULE.setView('dashboard')">📊 Dashboard</button>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn-secondary" onclick="window.KANBAN_MODULE.openImportModal()">📥 Bulk Import</button>
                <button class="btn-primary" onclick="window.KANBAN_MODULE.openNewTaskModal()">+ New Task</button>
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="filter-bar" id="kanbanFilterBar">
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
              ${Object.keys(WORKFLOW_TYPES).map(k => `
                <option value="${k}" ${activeWorkflowFilter === k ? 'selected' : ''}>${WORKFLOW_TYPES[k].icon} ${WORKFLOW_TYPES[k].name}</option>
              `).join('')}
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
                <label class="form-label">⚡ Workflow Pipeline *</label>
                <select id="ntWorkflow" class="input-text" onchange="window.KANBAN_MODULE.onModalWorkflowChange(this.value)">
                  ${Object.keys(WORKFLOW_TYPES).map(k => `<option value="${k}">${WORKFLOW_TYPES[k].icon} ${WORKFLOW_TYPES[k].name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">📍 Stage Pipeline</label>
                <select id="ntStage" class="input-text"></select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">📁 Workspace Space</label>
                <select id="ntSpace" class="input-text">
                  <option value="Internal Agency">🏢 Internal Agency</option>
                  ${spacesData.filter(s => s.name !== 'Internal Agency').map(s => `<option value="${escapeHTML(s.name)}">${s.icon || (s.type === 'client' ? '🟣' : '📁')} ${escapeHTML(s.name)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">🏷️ Client / Company Tag</label>
                <select id="ntCompany" class="input-text">
                  <option value="Agency">🏢 Internal (Agency)</option>
                  ${clientList.map(c => `<option value="${escapeHTML(c.name)}" data-clientid="${escapeHTML(c.id)}">👤 ${escapeHTML(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">👤 Assignee Specialist</label>
                <select id="ntAssignee" class="input-text">
                  <option value="Unassigned">Unassigned</option>
                  ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}" data-empcode="${escapeHTML(m.emp_code || m.id || '')}">👤 ${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Priority</label>
                <select id="ntPriority" class="input-text">
                  <option value="Medium" selected>🔵 Medium</option>
                  <option value="Urgent">🔴 Urgent</option>
                  <option value="High">🟠 High</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">📅 Due Date</label>
                <input type="date" id="ntDueDate" class="input-text">
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">⏱️ Est. Hours</label>
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

      <!-- Space Creator & Manager Modal -->
      <div class="modal-overlay" id="kanbanSpaceModal">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <span style="font-weight: 800; font-family: var(--font-heading);">📁 Workspace Spaces Manager</span>
            <button class="modal-close" onclick="window.KANBAN_MODULE.closeSpaceModal()">✕</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
              <button type="button" id="spaceModalTabCreate" class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.switchSpaceTab('create')">✨ Create New Space</button>
              <button type="button" id="spaceModalTabManage" class="btn-ghost btn-sm" onclick="window.KANBAN_MODULE.switchSpaceTab('manage')">⚙️ Manage Spaces (${spacesData.length})</button>
            </div>

            <!-- Create Space Form View -->
            <div id="spaceModalCreateView">
              <div class="form-group">
                <label class="form-label">Space / Project Name *</label>
                <input type="text" id="spaceNameInput" class="input-text" placeholder="e.g. Q3 Brand Campaign, E-commerce Launch, Creative Lab" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-top: 0.75rem;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Space Category</label>
                  <select id="spaceTypeInput" class="input-text">
                    <option value="custom">📁 Custom Space</option>
                    <option value="department">🏢 Internal Department</option>
                    <option value="client">🟣 Client Partner Space</option>
                    <option value="campaign">🚀 Special Campaign</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Theme Color</label>
                  <div style="display:flex; gap:0.4rem; align-items:center; margin-top:0.35rem;" id="spaceColorPicker">
                    ${['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map(col => `
                      <div onclick="window.KANBAN_MODULE.selectSpaceColor('${col}')" 
                           style="width:24px; height:24px; border-radius:50%; background:${col}; cursor:pointer; border:2px solid ${selectedSpaceColor === col ? '#fff' : 'transparent'}; box-shadow: 0 0 4px ${col}88;"></div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="form-group" style="margin-top: 0.75rem;">
                <label class="form-label">Icon / Emoji</label>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="spaceIconPicker">
                  ${['📁', '🏢', '🟣', '🚀', '🎬', '🎯', '💻', '📦', '⚡', '🎨', '📈', '🔥'].map(ic => `
                    <button type="button" class="btn-ghost btn-sm" onclick="window.KANBAN_MODULE.selectSpaceIcon('${ic}')" style="font-size:1.1rem; padding:0.3rem 0.55rem; border:1px solid ${selectedSpaceIcon === ic ? 'var(--purple-brand)' : 'transparent'}; background:${selectedSpaceIcon === ic ? 'var(--surface-3)' : 'transparent'}; border-radius:8px;">${ic}</button>
                  `).join('')}
                </div>
              </div>

              <div style="margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn-secondary" onclick="window.KANBAN_MODULE.closeSpaceModal()">Cancel</button>
                <button type="button" class="btn-primary" onclick="window.KANBAN_MODULE.submitNewSpace()">🚀 Create Space</button>
              </div>
            </div>

            <!-- Manage Spaces List View -->
            <div id="spaceModalManageView" style="display:none;">
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Active Workspace Spaces:</div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 240px; overflow-y: auto;" id="spaceModalListContainer">
                ${spacesData.map(s => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); border:1px solid var(--border-subtle); padding:0.6rem 0.85rem; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <span style="font-size:1.1rem;">${s.icon || (s.type === 'client' ? '🟣' : '🏢')}</span>
                      <div>
                        <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${escapeHTML(s.name)}</div>
                        <div style="font-size:0.7rem; color:var(--text-dim); text-transform:capitalize;">${escapeHTML(s.type || 'Custom Space')}</div>
                      </div>
                    </div>
                    ${s.name !== 'Internal Agency' && s.name !== 'Client Retainers' ? `
                      <button class="btn-danger btn-sm" style="font-size:0.72rem; padding:0.25rem 0.5rem;" onclick="window.KANBAN_MODULE.deleteSpace('${s.id || s.name}')">🗑️ Delete</button>
                    ` : '<span style="font-size:0.72rem; color:var(--text-dim);">System Default</span>'}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Workflow Pipeline Stage Editor Modal -->
      <div class="modal-overlay" id="kanbanStageEditorModal">
        <div class="modal-content" style="max-width: 640px;">
          <div class="modal-header">
            <span style="font-weight: 800; font-family: var(--font-heading);">⚙️ Workflow Pipeline Stage Manager</span>
            <button class="modal-close" onclick="window.KANBAN_MODULE.closeStageEditor()">✕</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Workflow Tabs & Add Workflow Button -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="font-size: 0.75rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">Select Workflow Pipeline:</div>
                <button type="button" class="btn-secondary btn-sm" style="font-size: 0.72rem; border-style: dashed; padding: 0.2rem 0.5rem;" onclick="window.KANBAN_MODULE.toggleNewWorkflowForm(true)">+ Add Custom Workflow</button>
              </div>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="editorWfTabsContainer">
                ${Object.keys(WORKFLOW_TYPES).map(k => `
                  <button type="button" class="${editorActiveWf === k ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}" onclick="window.KANBAN_MODULE.selectEditorWorkflow('${k}')">
                    ${WORKFLOW_TYPES[k].icon} ${WORKFLOW_TYPES[k].name}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Inline New Custom Workflow Creator Form -->
            <div id="newWorkflowFormContainer" style="display:none; background:var(--surface-2); border:1px solid var(--purple-brand); border-radius:12px; padding:0.9rem;">
              <div style="font-size:0.82rem; font-weight:800; color:var(--text-primary); margin-bottom:0.6rem;">✨ Create New Custom Workflow Pipeline</div>
              <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:0.75rem;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Workflow Name *</label>
                  <input type="text" id="newWfNameInput" class="input-text" placeholder="e.g. Influencer Outreach, Podcast" style="font-size:0.82rem; padding:0.35rem 0.65rem;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Icon / Emoji</label>
                  <div style="display:flex; gap:0.3rem; flex-wrap:wrap;" id="newWfIconPicker">
                    ${['🌟', '📸', '🎙️', '📊', '🛍️', '🎨', '🚀', '💻', '📈', '⚡', '📢', '🎬'].map(ic => `
                      <button type="button" class="btn-ghost btn-sm" onclick="window.KANBAN_MODULE.selectNewWfIcon('${ic}')" style="font-size:1rem; padding:0.2rem 0.45rem; border:1px solid ${selectedNewWfIcon === ic ? 'var(--purple-brand)' : 'transparent'}; background:${selectedNewWfIcon === ic ? 'var(--surface-3)' : 'transparent'}; border-radius:6px;">${ic}</button>
                    `).join('')}
                  </div>
                </div>
              </div>
              <div class="form-group" style="margin-top:0.6rem; margin-bottom:0;">
                <label class="form-label">Initial Pipeline Stages (comma separated)</label>
                <input type="text" id="newWfStagesInput" class="input-text" value="Briefing, In Progress, Internal Review, Client Approval, Delivered" style="font-size:0.82rem; padding:0.35rem 0.65rem;">
              </div>
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.75rem;">
                <button type="button" class="btn-ghost btn-sm" onclick="window.KANBAN_MODULE.toggleNewWorkflowForm(false)">Cancel</button>
                <button type="button" class="btn-primary btn-sm" onclick="window.KANBAN_MODULE.submitNewCustomWorkflow()">🚀 Create Workflow</button>
              </div>
            </div>

            <!-- Stage Pills Visual Reorder List -->
            <div style="background: var(--surface-3); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 0.9rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary);" id="editorStageListTitle">
                  ${WORKFLOW_TYPES[editorActiveWf]?.icon || '⚡'} ${WORKFLOW_TYPES[editorActiveWf]?.name || 'Pipeline'} Stages
                </div>
                <div style="display:flex; gap:0.4rem; align-items:center;" id="editorWorkflowActionButtons">
                  ${!['video', 'social', 'branding', 'dev'].includes(editorActiveWf) ? `
                    <button type="button" class="btn-danger btn-sm" style="font-size:0.72rem; padding:0.2rem 0.45rem;" onclick="window.KANBAN_MODULE.deleteWorkflow('${editorActiveWf}')">
                      🗑️ Delete Workflow
                    </button>
                  ` : `
                    <button type="button" class="btn-ghost btn-sm" style="font-size: 0.72rem; color: var(--pink-brand);" onclick="window.KANBAN_MODULE.resetStagesToDefault()">
                      ↺ Reset to Preset
                    </button>
                  `}
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.45rem; max-height: 240px; overflow-y: auto;" id="editorStageList">
                <!-- Dynamically rendered via renderStageEditorContent() -->
              </div>

              <!-- Add Stage Row -->
              <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                <input type="text" id="newStageInput" class="input-text" placeholder="Add new stage name (e.g. Color Grading, Client UAT)..." style="flex:1; font-size:0.82rem; padding:0.4rem 0.75rem;" onkeydown="if(event.key==='Enter'){event.preventDefault();window.KANBAN_MODULE.addStageToEditor();}">
                <button type="button" class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.addStageToEditor()">+ Add Step</button>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem;">
              <button type="button" class="btn-secondary" onclick="window.KANBAN_MODULE.closeStageEditor()">Cancel</button>
              <button type="button" class="btn-primary" onclick="window.KANBAN_MODULE.savePipelineStages()">💾 Save Pipeline Stages</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Import Tasks Modal -->
      <div class="modal-overlay" id="kanbanImportModal" style="display:none;">
        <div class="modal-card" style="max-width: 680px; width: 95%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div style="font-size:1.15rem; font-weight:800; font-family:var(--font-heading);">
              📥 Bulk Import Tasks & Projects
            </div>
            <button class="modal-close-btn" onclick="window.KANBAN_MODULE.closeImportModal()">✕</button>
          </div>

          <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
            Upload an Excel (.csv) file or paste CSV text to pre-populate deliverables, assignees, and deadlines for September 1.
          </div>

          <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
            <button type="button" id="kImportTabFile" class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.switchImportTab('file')">📂 Upload CSV File</button>
            <button type="button" id="kImportTabPaste" class="btn-ghost btn-sm" onclick="window.KANBAN_MODULE.switchImportTab('paste')">📋 Paste Raw CSV Text</button>
            <button type="button" class="btn-ghost btn-sm" style="margin-left:auto;" onclick="window.KANBAN_MODULE.downloadSampleCSV()">📄 Download Template (.csv)</button>
          </div>

          <div id="kImportFileContainer">
            <input type="file" id="kImportFileInput" accept=".csv" class="input-text" style="width:100%; padding:0.6rem;" onchange="window.KANBAN_MODULE.handleFileSelect(event)">
          </div>

          <div id="kImportPasteContainer" style="display:none;">
            <textarea id="kImportPasteInput" class="input-text" rows="6" style="width:100%; font-family:monospace; font-size:0.75rem;" placeholder="Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description" oninput="window.KANBAN_MODULE.handlePasteInput()"></textarea>
          </div>

          <!-- Preview Table -->
          <div id="kImportPreviewContainer" style="display:none; margin-top:1rem; max-height:220px; overflow-y:auto; background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:8px; padding:0.5rem;">
            <div style="font-size:0.78rem; font-weight:800; margin-bottom:0.4rem;" id="kImportPreviewTitle">Live Preview</div>
            <table class="data-table" style="font-size:0.72rem; width:100%;" id="kImportPreviewTable">
              <thead id="kImportThead"></thead>
              <tbody id="kImportTbody"></tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="window.KANBAN_MODULE.closeImportModal()">Cancel</button>
            <button type="button" class="btn-primary" id="kImportSubmitBtn" disabled onclick="window.KANBAN_MODULE.submitImport()">🚀 Import Tasks to Kanban</button>
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
      displayTasks = displayTasks.filter(t => t.client === activeSpace || t.category === activeSpace || t.space === activeSpace);
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

    const filterBar = document.getElementById('kanbanFilterBar');
    if (filterBar) {
      filterBar.style.display = (currentView === 'dashboard') ? 'none' : 'flex';
    }

    const displayTasks = getFilteredTasks();
    const currentStages = getActiveStages();

    if (currentView === 'kanban') {
      area.style.overflowY = 'hidden';
      area.innerHTML = `
        <div class="kanban-grid">
          ${currentStages.map(stg => {
            const stageTasks = displayTasks.filter(t => (t.stage || currentStages[0]) === stg);
            return `
              <div class="kanban-col" ondragover="event.preventDefault()" ondrop="window.KANBAN_MODULE.dropTask(event, '${escapeHTML(stg)}')">
                <div class="kanban-col-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${escapeHTML(stg)}</span>
                    <span class="badge badge-purple">${stageTasks.length}</span>
                  </div>
                  <button type="button" class="btn-ghost btn-sm" style="padding: 0.15rem 0.45rem; font-size: 0.85rem; line-height: 1; font-weight: 800; border-radius: 6px;" onclick="window.KANBAN_MODULE.openNewTaskModal({ stage: '${escapeHTML(stg)}' })" title="Add task directly to ${escapeHTML(stg)}">+</button>
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
      area.style.overflowY = 'auto';
    } else if (currentView === 'calendar') {
      area.style.overflowY = 'hidden';
      renderCalendarView(area, displayTasks);
    } else if (currentView === 'dashboard') {
      area.style.overflowY = 'auto';
      const dashTasks = (activeSpace !== 'all') 
        ? allTasks.filter(t => t.client === activeSpace || t.space === activeSpace || t.category === activeSpace)
        : allTasks;
      renderDashboardView(area, dashTasks);
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

  function renderDashboardView(area, displayTasks) {
      // ── Dashboard KPI Metrics ──
      const totalTasks = displayTasks.length;
      const completedTasks = displayTasks.filter(t => ['approved', 'published', 'delivered', 'completed', 'done'].includes((t.stage || '').toLowerCase())).length;
      const inReviewTasks = displayTasks.filter(t => (t.stage || '').toLowerCase().includes('qc') || (t.stage || '').toLowerCase().includes('review') || (t.stage || '').toLowerCase().includes('approval')).length;
      const inProdTasks = Math.max(0, totalTasks - completedTasks - inReviewTasks);
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      let totalLoggedHours = 0;
      let totalEstHours = 0;
      displayTasks.forEach(t => {
        totalLoggedHours += Number(t.loggedHours || 0);
        totalEstHours += Number(t.estimatedHours || 8);
      });

      // Review & QC Radar Tasks
      const reviewRadarTasks = displayTasks.filter(t => 
        (t.stage || '').toLowerCase().includes('qc') || 
        (t.stage || '').toLowerCase().includes('review') ||
        (t.stage || '').toLowerCase().includes('approval') ||
        t.blockedBy
      );

      // Overdue & Urgent Tasks
      const now = new Date();
      const urgentOverdueTasks = displayTasks.filter(t => {
        if (['approved', 'published', 'delivered', 'completed'].includes((t.stage || '').toLowerCase())) return false;
        if (t.priority === 'Urgent') return true;
        if (t.dueDate || t.due_date) {
          const d = new Date(t.dueDate || t.due_date);
          return !isNaN(d) && d < now;
        }
        return false;
      });

      // Specialist Team Workload
      const memberMap = {};
      teamMembers.forEach(m => {
        memberMap[m.name] = { name: m.name, role: m.role || 'Specialist', taskCount: 0, workflows: new Set(), logged: 0 };
      });
      displayTasks.forEach(t => {
        if (t.assignee) {
          if (!memberMap[t.assignee]) {
            memberMap[t.assignee] = { name: t.assignee, role: 'Specialist', taskCount: 0, workflows: new Set(), logged: 0 };
          }
          memberMap[t.assignee].taskCount += 1;
          if (t.workflow_type) memberMap[t.assignee].workflows.add(t.workflow_type);
          memberMap[t.assignee].logged += Number(t.loggedHours || 0);
        }
      });
      const workloadList = Object.values(memberMap).sort((a, b) => b.taskCount - a.taskCount);

      // ── Workflow Matrix Cards ──
      const workflowCardsHtml = Object.keys(WORKFLOW_TYPES).map(wfKey => {
        const wf = WORKFLOW_TYPES[wfKey];
        const wfTasks = displayTasks.filter(t => {
          const taskWf = (t.workflow_type || t.category || '').toLowerCase();
          if (taskWf.includes(wfKey.toLowerCase())) return true;
          if (wfKey === 'video' && (t.department === 'Video' || (t.title || '').toLowerCase().includes('video') || (t.title || '').toLowerCase().includes('reel'))) return true;
          if (wfKey === 'social' && (t.department === 'Social' || (t.title || '').toLowerCase().includes('post'))) return true;
          if (wfKey === 'branding' && (t.department === 'Graphics' || (t.title || '').toLowerCase().includes('brand'))) return true;
          if (wfKey === 'dev' && (t.department === 'Tech' || (t.title || '').toLowerCase().includes('app'))) return true;
          return false;
        });

        const wfTotal = wfTasks.length;
        const wfCompleted = wfTasks.filter(t => ['approved', 'published', 'delivered', 'completed'].includes((t.stage || '').toLowerCase())).length;
        const wfPct = wfTotal > 0 ? Math.round((wfCompleted / wfTotal) * 100) : 0;
        
        let wfLogged = 0;
        wfTasks.forEach(t => { wfLogged += Number(t.loggedHours || 0); });

        const stageCounts = (wf.stages || []).map(stg => {
          const count = wfTasks.filter(t => (t.stage || wf.stages[0]) === stg).length;
          return { stage: stg, count, pct: wfTotal > 0 ? (count / wfTotal) * 100 : 0 };
        });

        return `
          <div style="background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; gap:0.9rem; box-shadow:var(--shadow-sm);">
            <!-- Workflow Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <div style="font-size:1.5rem; width:42px; height:42px; display:flex; align-items:center; justify-content:center; background:var(--surface-3); border-radius:10px; border:1px solid var(--border-subtle);">${wf.icon || '⚡'}</div>
                <div>
                  <div style="font-size:1.05rem; font-weight:800; color:var(--text-primary); font-family:var(--font-heading);">${escapeHTML(wf.name)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${wfTotal} Tasks · ${wfLogged}h Logged</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge ${wfPct === 100 ? 'badge-emerald' : 'badge-purple'}" style="font-size:0.75rem; font-weight:800;">${wfPct}% Done</span>
                <button class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onclick="window.KANBAN_MODULE.setWorkflowFilter('${wfKey}'); window.KANBAN_MODULE.setView('kanban');" title="Open ${escapeHTML(wf.name)} Board">Board ➔</button>
              </div>
            </div>

            <!-- Segmented Stage Progress Bar -->
            <div>
              <div style="font-size:0.72rem; color:var(--text-dim); font-weight:700; text-transform:uppercase; margin-bottom:0.4rem; display:flex; justify-content:space-between;">
                <span>Stage Distribution</span>
                <span>${wfCompleted} / ${wfTotal} Approved</span>
              </div>
              <div style="display:flex; height:8px; border-radius:4px; overflow:hidden; background:var(--surface-3); width:100%;">
                ${stageCounts.map((sc, i) => {
                  if (sc.count === 0) return '';
                  const colors = ['#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
                  const color = colors[i % colors.length];
                  return `<div style="width:${sc.pct}%; background:${color};" title="${escapeHTML(sc.stage)}: ${sc.count} tasks"></div>`;
                }).join('')}
              </div>
            </div>

            <!-- Stage Chips -->
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              ${stageCounts.map((sc) => {
                const isApproved = ['approved', 'published', 'delivered'].includes(sc.stage.toLowerCase());
                return `
                  <div style="display:flex; align-items:center; gap:0.3rem; background:${sc.count > 0 ? (isApproved ? 'rgba(16,185,129,0.15)' : 'var(--surface-3)') : 'transparent'}; border:1px solid ${sc.count > 0 ? (isApproved ? 'var(--emerald-brand)' : 'var(--border-subtle)') : 'rgba(255,255,255,0.05)'}; padding:0.2rem 0.45rem; border-radius:6px; font-size:0.7rem; color:${sc.count > 0 ? 'var(--text-primary)' : 'var(--text-dim)'};">
                    <span>${escapeHTML(sc.stage)}</span>
                    <span class="badge ${sc.count > 0 ? (isApproved ? 'badge-emerald' : 'badge-purple') : 'badge-gray'}" style="font-size:0.65rem; padding:0.05rem 0.35rem;">${sc.count}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Recent Active Tasks in Workflow -->
            ${wfTasks.length > 0 ? `
              <div style="border-top:1px solid var(--border-subtle); padding-top:0.65rem; display:flex; flex-direction:column; gap:0.35rem;">
                ${wfTasks.slice(0, 3).map(t => `
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; cursor:pointer;" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                    <span style="color:var(--text-primary); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65%;" title="${escapeHTML(t.title)}">• ${escapeHTML(t.title)}</span>
                    <span class="badge badge-purple" style="font-size:0.65rem;">${escapeHTML(t.stage || 'Briefing')}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<div style="font-size:0.75rem; color:var(--text-dim); text-align:center; padding:0.5rem;">No active tasks in this pipeline.</div>'}
          </div>
        `;
      }).join('');

      area.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 100%; max-width: 1300px; margin: 0 auto; padding: 0.25rem 0.25rem 4rem 0.25rem;">
          
          <!-- Executive KPI Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            <div class="card-glass" style="padding: 1.1rem; border-left: 4px solid var(--purple-brand);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">⚡ Total Tasks</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 0.2rem;">${totalTasks}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${activeSpace === 'all' ? 'All Spaces' : escapeHTML(activeSpace)}</div>
            </div>

            <div class="card-glass" style="padding: 1.1rem; border-left: 4px solid var(--blue-brand);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">🎬 In Production</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--blue-brand); margin-top: 0.2rem;">${inProdTasks}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Active shooting / build</div>
            </div>

            <div class="card-glass" style="padding: 1.1rem; border-left: 4px solid var(--amber-brand);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">🔍 QC & Client Review</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--amber-brand); margin-top: 0.2rem;">${inReviewTasks}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Awaiting sign-off</div>
            </div>

            <div class="card-glass" style="padding: 1.1rem; border-left: 4px solid var(--emerald-brand);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">✅ Approved / Delivered</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--emerald-brand); margin-top: 0.2rem;">${completedTasks} <span style="font-size:0.9rem; font-weight:600; color:var(--text-muted);">(${completionRate}%)</span></div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Completed deliverables</div>
            </div>

            <div class="card-glass" style="padding: 1.1rem; border-left: 4px solid var(--pink-brand);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">⏱️ Logged Hours</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--pink-brand); margin-top: 0.2rem;">${totalLoggedHours}h <span style="font-size:0.9rem; font-weight:600; color:var(--text-muted);">/ ${totalEstHours}h</span></div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Tracked vs estimated</div>
            </div>
          </div>

          <!-- Section: Workflow Pipeline Matrix -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
              <h2 style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-primary); margin: 0;">
                ⚡ Workflow-Wise Production Pipelines
              </h2>
              <button class="btn-secondary btn-sm" onclick="window.KANBAN_MODULE.openStageEditor()">⚙️ Manage Pipelines</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.1rem;">
              ${workflowCardsHtml}
            </div>
          </div>

          <!-- 2-Column Grid: Review Radar & Urgent Deliverables -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            
            <!-- Left: Awaiting Review Radar -->
            <div style="background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.92rem; font-weight: 800; color: var(--amber-brand); font-family: var(--font-heading);">
                  🔍 Awaiting QC & Client Sign-off (${reviewRadarTasks.length})
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 260px; overflow-y: auto;">
                ${reviewRadarTasks.map(t => `
                  <div style="background: var(--surface-3); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                    <div>
                      <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${escapeHTML(t.title)}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">🏢 ${escapeHTML(t.client || 'Agency')} · 👤 ${escapeHTML(t.assignee || 'Unassigned')}</div>
                    </div>
                    <span class="badge badge-amber" style="font-size: 0.7rem;">${escapeHTML(t.stage || 'Review')}</span>
                  </div>
                `).join('') || '<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1.5rem;">No deliverables pending review.</div>'}
              </div>
            </div>

            <!-- Right: Urgent & Overdue Radar -->
            <div style="background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.92rem; font-weight: 800; color: #ef4444; font-family: var(--font-heading);">
                  ⚠️ Urgent Deliverables & Deadlines (${urgentOverdueTasks.length})
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 260px; overflow-y: auto;">
                ${urgentOverdueTasks.map(t => `
                  <div style="background: var(--surface-3); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.KANBAN_MODULE.openDrawer('${t.id}')">
                    <div>
                      <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${escapeHTML(t.title)}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">🏢 ${escapeHTML(t.client || 'Agency')} · 👤 ${escapeHTML(t.assignee || 'Unassigned')}</div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge badge-pink" style="font-size: 0.68rem;">🔴 ${escapeHTML(t.priority || 'Urgent')}</span>
                    </div>
                  </div>
                `).join('') || '<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1.5rem;">All tasks on track!</div>'}
              </div>
            </div>

          </div>

          <!-- Section: Team Workload Allocation Table -->
          <div style="background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 1.25rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-heading); margin-bottom: 0.75rem;">
              👥 Team Specialist Workload Allocation
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-dim); font-size: 0.72rem; text-transform: uppercase;">
                    <th style="padding: 0.6rem 0.85rem;">Specialist</th>
                    <th style="padding: 0.6rem 0.85rem;">Role / Designation</th>
                    <th style="padding: 0.6rem 0.85rem;">Assigned Tasks</th>
                    <th style="padding: 0.6rem 0.85rem;">Workflows Involved</th>
                    <th style="padding: 0.6rem 0.85rem;">Logged Hours</th>
                  </tr>
                </thead>
                <tbody>
                  ${workloadList.filter(w => w.taskCount > 0 || w.logged > 0).map(w => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 0.6rem 0.85rem; font-weight: 700; color: var(--text-primary);">👤 ${escapeHTML(w.name)}</td>
                      <td style="padding: 0.6rem 0.85rem; color: var(--text-muted);">${escapeHTML(w.role)}</td>
                      <td style="padding: 0.6rem 0.85rem;">
                        <span class="badge ${w.taskCount > 4 ? 'badge-amber' : 'badge-purple'}">${w.taskCount} Tasks</span>
                      </td>
                      <td style="padding: 0.6rem 0.85rem;">
                        ${Array.from(w.workflows).map(wf => `<span class="badge badge-gray" style="margin-right:0.25rem; font-size:0.68rem; text-transform:capitalize;">${escapeHTML(wf)}</span>`).join('') || '<span style="color:var(--text-dim);">-</span>'}
                      </td>
                      <td style="padding: 0.6rem 0.85rem; font-weight: 700; color: var(--emerald-brand);">⏱️ ${w.logged}h</td>
                    </tr>
                  `).join('') || '<tr><td colspan="5" style="padding:1.5rem; text-align:center; color:var(--text-muted);">No task assignments found.</td></tr>'}
                </tbody>
              </table>
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
    /* ── Modal Task Creation ── */
    async openNewTaskModal(prefill = {}) {
      const modal = document.getElementById('newTaskModalOverlay');
      if (!modal) return;

      // Ensure teamMembers and clientList are loaded
      if (!teamMembers || teamMembers.length === 0) {
        try {
          const res = await APP_API.get('/team');
          teamMembers = (Array.isArray(res) && res.length > 0) ? res : DEFAULT_TEAM_MEMBERS;
        } catch(e) {
          teamMembers = DEFAULT_TEAM_MEMBERS;
        }
      }
      if (!clientList || clientList.length === 0) {
        try {
          const res = await APP_API.get('/clients');
          clientList = (Array.isArray(res) && res.length > 0) ? res : DEFAULT_CLIENTS;
        } catch(e) {
          clientList = DEFAULT_CLIENTS;
        }
      }

      // Repopulate Workspace Spaces
      const spaceSelect = document.getElementById('ntSpace');
      if (spaceSelect) {
        spaceSelect.innerHTML = `
          <option value="Internal Agency">🏢 Internal Agency</option>
          ${spacesData.filter(s => s.name !== 'Internal Agency').map(s => `<option value="${escapeHTML(s.name)}">${s.icon || (s.type === 'client' ? '🟣' : '📁')} ${escapeHTML(s.name)}</option>`).join('')}
        `;
        if (prefill.space) {
          spaceSelect.value = prefill.space;
        } else if (activeSpace !== 'all') {
          spaceSelect.value = activeSpace;
        }
      }

      // Repopulate Client / Company Tag
      const companySelect = document.getElementById('ntCompany');
      if (companySelect) {
        companySelect.innerHTML = `
          <option value="Agency">🏢 Internal (Agency)</option>
          ${clientList.map(c => `<option value="${escapeHTML(c.name)}" data-clientid="${escapeHTML(c.id)}">👤 ${escapeHTML(c.name)}</option>`).join('')}
        `;
        if (prefill.client || prefill.company) {
          companySelect.value = prefill.client || prefill.company;
        }
      }

      // Repopulate Assignee Specialist
      const assigneeSelect = document.getElementById('ntAssignee');
      if (assigneeSelect) {
        assigneeSelect.innerHTML = `
          <option value="Unassigned">Unassigned</option>
          ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}" data-empcode="${escapeHTML(m.emp_code || m.id || '')}">👤 ${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
        `;
        if (prefill.assignee) {
          assigneeSelect.value = prefill.assignee;
        }
      }

      // Populate workflows & stages
      const wfSelect = document.getElementById('ntWorkflow');
      if (wfSelect) {
        wfSelect.innerHTML = Object.keys(WORKFLOW_TYPES).map(k => `<option value="${k}">${WORKFLOW_TYPES[k].icon} ${WORKFLOW_TYPES[k].name}</option>`).join('');
        const currentWf = prefill.workflow || (activeWorkflowFilter !== 'all' ? activeWorkflowFilter : 'video');
        wfSelect.value = currentWf;
        this.onModalWorkflowChange(currentWf);
      }

      if (prefill.stage) {
        const stageSelect = document.getElementById('ntStage');
        if (stageSelect) stageSelect.value = prefill.stage;
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
      const title = (document.getElementById('ntTitle')?.value || '').trim();
      if (!title) { if (window.showToast) window.showToast('Please enter a task title', 'error'); return; }

      const workflow_type = document.getElementById('ntWorkflow')?.value || 'video';
      const stage = document.getElementById('ntStage')?.value || 'Briefing';
      const space = document.getElementById('ntSpace')?.value || 'Internal Agency';
      
      const companySelect = document.getElementById('ntCompany');
      const company = companySelect?.value || 'Agency';
      const client_id = companySelect?.options[companySelect.selectedIndex]?.dataset?.clientid || null;

      const assigneeSelect = document.getElementById('ntAssignee');
      const assignee = assigneeSelect?.value || 'Unassigned';
      const assignee_id = assigneeSelect?.options[assigneeSelect.selectedIndex]?.dataset?.empcode || null;

      const priority = document.getElementById('ntPriority')?.value || 'Medium';
      const due_date = document.getElementById('ntDueDate')?.value || null;
      const estimatedHours = Number(document.getElementById('ntEstHours')?.value) || 8;
      const description = (document.getElementById('ntDescription')?.value || '').trim();

      const payload = {
        title,
        workflow_type,
        stage,
        space,
        client: company,
        company,
        client_id,
        assignee,
        assignee_id,
        priority,
        due_date,
        estimatedHours,
        estimated_hours: estimatedHours,
        description,
        category: workflow_type
      };

      try {
        const res = await APP_API.post('/tasks', payload);
        if (res && res.error) {
          throw new Error(res.error);
        }
        if (window.showToast) window.showToast('🚀 Task created successfully!', 'success');
        this.closeNewTaskModal();
        
        // Reset form
        if (document.getElementById('ntTitle')) document.getElementById('ntTitle').value = '';
        if (document.getElementById('ntDescription')) document.getElementById('ntDescription').value = '';
        
        await loadData();
      } catch (err) {
        console.error('Failed to create task', err);
        if (window.showToast) window.showToast('Failed to create task: ' + (err.message || 'Error'), 'error');
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

    /* ── Bulk Actions & Drag Drop ── */
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
        const stage = document.getElementById('bulkStageSelect')?.value;
        if (!stage) { if (window.showToast) window.showToast('Select a stage first', 'error'); return; }
        payload.stage = stage;
      } else if (action === 'assign') {
        const assignee = document.getElementById('bulkAssigneeInput')?.value.trim();
        if (!assignee) { if (window.showToast) window.showToast('Enter an assignee name', 'error'); return; }
        payload.assignee = assignee;
      } else if (action === 'delete') {
        if (window.confirm && !window.confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) return;
      }
      
      try {
        await APP_API.post('/tasks/bulk', payload);
        if (window.showToast) window.showToast(`Bulk ${action} applied to ${taskIds.length} tasks`, 'success');
        this.clearSelection();
        loadData();
      } catch (e) {
        if (window.showToast) window.showToast('Failed bulk action: ' + e.message, 'error');
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
      }
    },

    /* ── Space Creator & Manager ── */
    openSpaceModal(tab = 'create') {
      const modal = document.getElementById('kanbanSpaceModal');
      if (!modal) return;
      this.switchSpaceTab(tab);
      const nameInp = document.getElementById('spaceNameInput');
      if (nameInp) nameInp.value = '';
      this.selectSpaceIcon('📁');
      this.selectSpaceColor('#a855f7');
      modal.classList.add('active');
    },
    closeSpaceModal() {
      const modal = document.getElementById('kanbanSpaceModal');
      if (modal) modal.classList.remove('active');
    },
    switchSpaceTab(tab) {
      const tabCreate = document.getElementById('spaceModalTabCreate');
      const tabManage = document.getElementById('spaceModalTabManage');
      const viewCreate = document.getElementById('spaceModalCreateView');
      const viewManage = document.getElementById('spaceModalManageView');

      if (tab === 'create') {
        if (tabCreate) tabCreate.className = 'btn-secondary btn-sm';
        if (tabManage) tabManage.className = 'btn-ghost btn-sm';
        if (viewCreate) viewCreate.style.display = 'block';
        if (viewManage) viewManage.style.display = 'none';
      } else {
        if (tabCreate) tabCreate.className = 'btn-ghost btn-sm';
        if (tabManage) tabManage.className = 'btn-secondary btn-sm';
        if (viewCreate) viewCreate.style.display = 'none';
        if (viewManage) viewManage.style.display = 'block';
      }
    },
    selectSpaceIcon(icon) {
      selectedSpaceIcon = icon;
      const picker = document.getElementById('spaceIconPicker');
      if (picker) {
        picker.querySelectorAll('button').forEach(btn => {
          if (btn.innerText.trim() === icon) {
            btn.style.borderColor = 'var(--purple-brand)';
            btn.style.background = 'var(--surface-3)';
          } else {
            btn.style.borderColor = 'transparent';
            btn.style.background = 'transparent';
          }
        });
      }
    },
    selectSpaceColor(color) {
      selectedSpaceColor = color;
      const picker = document.getElementById('spaceColorPicker');
      if (picker) {
        picker.querySelectorAll('div').forEach(dot => {
          if (dot.style.background.includes(color) || dot.getAttribute('style').includes(color)) {
            dot.style.borderColor = '#fff';
          } else {
            dot.style.borderColor = 'transparent';
          }
        });
      }
    },
    async submitNewSpace() {
      const name = (document.getElementById('spaceNameInput')?.value || '').trim();
      if (!name) {
        if (window.showToast) window.showToast('Please enter a space name', 'error');
        return;
      }
      const type = document.getElementById('spaceTypeInput')?.value || 'custom';

      try {
        await APP_API.post('/projects/spaces', {
          name,
          type,
          icon: selectedSpaceIcon,
          color: selectedSpaceColor
        });
        if (window.showToast) window.showToast(`✨ Space "${name}" created!`, 'success');
        this.closeSpaceModal();
        await loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create space: ' + err.message, 'error');
      }
    },
    async deleteSpace(spaceId) {
      if (window.confirm && !window.confirm('Are you sure you want to delete this custom space?')) return;
      try {
        await APP_API.delete(`/projects/spaces/${encodeURIComponent(spaceId)}`);
        if (window.showToast) window.showToast('Space deleted', 'success');
        if (activeSpace === spaceId) activeSpace = 'all';
        await loadData();
        this.openSpaceModal('manage');
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete space: ' + err.message, 'error');
      }
    },

    /* ── Pipeline Stage Editor ── */
    openStageEditor(wfKey = null) {
      const targetWf = wfKey || (activeWorkflowFilter !== 'all' ? activeWorkflowFilter : 'video');
      editorActiveWf = targetWf;
      const wf = WORKFLOW_TYPES[targetWf] || DEFAULT_WORKFLOW_PRESETS[targetWf] || DEFAULT_WORKFLOW_PRESETS['video'];
      editorStages = [...wf.stages];

      const modal = document.getElementById('kanbanStageEditorModal');
      if (!modal) return;

      this.renderStageEditorContent();
      modal.classList.add('active');
    },
    closeStageEditor() {
      const modal = document.getElementById('kanbanStageEditorModal');
      if (modal) modal.classList.remove('active');
    },
    selectEditorWorkflow(wfKey) {
      editorActiveWf = wfKey;
      const wf = WORKFLOW_TYPES[wfKey] || DEFAULT_WORKFLOW_PRESETS[wfKey] || DEFAULT_WORKFLOW_PRESETS['video'];
      editorStages = [...wf.stages];
      this.renderStageEditorContent();
    },
    renderStageEditorContent() {
      // Update Tab button active styles
      const tabsCont = document.getElementById('editorWfTabsContainer');
      if (tabsCont) {
        tabsCont.innerHTML = Object.keys(WORKFLOW_TYPES).map(k => `
          <button type="button" class="${editorActiveWf === k ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}" onclick="window.KANBAN_MODULE.selectEditorWorkflow('${k}')">
            ${WORKFLOW_TYPES[k].icon} ${WORKFLOW_TYPES[k].name}
          </button>
        `).join('');
      }

      const titleEl = document.getElementById('editorStageListTitle');
      if (titleEl && WORKFLOW_TYPES[editorActiveWf]) {
        titleEl.innerHTML = `${WORKFLOW_TYPES[editorActiveWf].icon} ${WORKFLOW_TYPES[editorActiveWf].name} Stages (${editorStages.length} steps)`;
      }

      const actionBtns = document.getElementById('editorWorkflowActionButtons');
      if (actionBtns) {
        if (!['video', 'social', 'branding', 'dev'].includes(editorActiveWf)) {
          actionBtns.innerHTML = `
            <button type="button" class="btn-danger btn-sm" style="font-size:0.72rem; padding:0.2rem 0.45rem;" onclick="window.KANBAN_MODULE.deleteWorkflow('${editorActiveWf}')">
              🗑️ Delete Workflow
            </button>
          `;
        } else {
          actionBtns.innerHTML = `
            <button type="button" class="btn-ghost btn-sm" style="font-size: 0.72rem; color: var(--pink-brand);" onclick="window.KANBAN_MODULE.resetStagesToDefault()">
              ↺ Reset to Preset
            </button>
          `;
        }
      }

      const listEl = document.getElementById('editorStageList');
      if (listEl) {
        listEl.innerHTML = editorStages.map((stg, idx) => `
          <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--surface-2); border: 1px solid var(--border-subtle); padding: 0.45rem 0.65rem; border-radius: 8px;">
            <span class="badge badge-purple" style="font-size:0.7rem; min-width:24px; text-align:center;">${idx + 1}</span>
            <input type="text" class="input-text" style="flex:1; padding:0.3rem 0.6rem; font-size:0.82rem;" value="${escapeHTML(stg)}" onchange="window.KANBAN_MODULE.updateStageName(${idx}, this.value)">
            <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" onclick="window.KANBAN_MODULE.moveStage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move Earlier">↑</button>
            <button type="button" class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" onclick="window.KANBAN_MODULE.moveStage(${idx}, 1)" ${idx === editorStages.length - 1 ? 'disabled' : ''} title="Move Later">↓</button>
            <button type="button" class="btn-danger btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" onclick="window.KANBAN_MODULE.removeStage(${idx})" ${editorStages.length <= 2 ? 'disabled' : ''} title="Remove Stage">✕</button>
          </div>
        `).join('');
      }
    },
    updateStageName(idx, newName) {
      if (newName && newName.trim()) {
        editorStages[idx] = newName.trim();
      }
    },
    moveStage(idx, direction) {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= editorStages.length) return;
      const temp = editorStages[idx];
      editorStages[idx] = editorStages[targetIdx];
      editorStages[targetIdx] = temp;
      this.renderStageEditorContent();
    },
    removeStage(idx) {
      if (editorStages.length <= 2) {
        if (window.showToast) window.showToast('A workflow must have at least 2 stages', 'error');
        return;
      }
      editorStages.splice(idx, 1);
      this.renderStageEditorContent();
    },
    addStageToEditor() {
      const input = document.getElementById('newStageInput');
      const val = (input?.value || '').trim();
      if (!val) return;
      if (editorStages.some(s => s.toLowerCase() === val.toLowerCase())) {
        if (window.showToast) window.showToast('This stage step already exists', 'error');
        return;
      }
      editorStages.push(val);
      if (input) input.value = '';
      this.renderStageEditorContent();
    },
    resetStagesToDefault() {
      const preset = DEFAULT_WORKFLOW_PRESETS[editorActiveWf];
      if (preset && preset.stages) {
        editorStages = [...preset.stages];
        this.renderStageEditorContent();
        if (window.showToast) window.showToast(`Reset ${preset.name} to default preset stages`, 'success');
      }
    },
    toggleNewWorkflowForm(show) {
      const form = document.getElementById('newWorkflowFormContainer');
      if (form) {
        form.style.display = show ? 'block' : 'none';
        if (show) {
          const inp = document.getElementById('newWfNameInput');
          if (inp) inp.focus();
        }
      }
    },
    selectNewWfIcon(icon) {
      selectedNewWfIcon = icon;
      const picker = document.getElementById('newWfIconPicker');
      if (picker) {
        picker.querySelectorAll('button').forEach(btn => {
          if (btn.innerText.trim() === icon) {
            btn.style.borderColor = 'var(--purple-brand)';
            btn.style.background = 'var(--surface-3)';
          } else {
            btn.style.borderColor = 'transparent';
            btn.style.background = 'transparent';
          }
        });
      }
    },
    async submitNewCustomWorkflow() {
      const nameInp = document.getElementById('newWfNameInput');
      const name = (nameInp?.value || '').trim();
      if (!name) {
        if (window.showToast) window.showToast('Please enter a workflow name', 'error');
        return;
      }

      const rawStages = document.getElementById('newWfStagesInput')?.value || 'Briefing, In Progress, Internal Review, Client Approval, Delivered';
      const stages = rawStages.split(',').map(s => s.trim()).filter(Boolean);
      if (stages.length < 2) {
        if (window.showToast) window.showToast('Workflow must have at least 2 stages', 'error');
        return;
      }

      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '') || `wf_${Date.now()}`;
      
      const payload = {
        [key]: {
          name,
          icon: selectedNewWfIcon,
          stages
        }
      };

      try {
        await APP_API.put('/workflows/stages', payload);
        if (window.showToast) window.showToast(`✨ Custom Workflow "${name}" created!`, 'success');
        this.toggleNewWorkflowForm(false);
        if (nameInp) nameInp.value = '';
        await loadData();
        this.openStageEditor(key);
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create workflow: ' + (err.message || 'Error'), 'error');
      }
    },
    async deleteWorkflow(wfKey) {
      if (['video', 'social', 'branding', 'dev'].includes(wfKey)) {
        if (window.showToast) window.showToast('Core system workflows cannot be deleted', 'error');
        return;
      }
      if (window.confirm && !window.confirm(`Are you sure you want to delete this custom workflow pipeline?`)) return;

      try {
        await APP_API.delete(`/workflows/${encodeURIComponent(wfKey)}`);
        if (window.showToast) window.showToast('Workflow deleted', 'success');
        if (activeWorkflowFilter === wfKey) activeWorkflowFilter = 'all';
        await loadData();
        this.openStageEditor('video');
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete workflow: ' + (err.message || 'Error'), 'error');
      }
    },
    async savePipelineStages() {
      if (editorStages.length < 2) {
        if (window.showToast) window.showToast('Pipeline must contain at least 2 stages', 'error');
        return;
      }

      const payload = {
        [editorActiveWf]: {
          stages: editorStages
        }
      };

      try {
        await APP_API.put('/workflows/stages', payload);
        if (window.showToast) window.showToast('✅ Workflow pipeline stages saved successfully!', 'success');
        this.closeStageEditor();
        await loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save stages: ' + (err.message || 'Error'), 'error');
      }
    },
    // Bulk Import Methods
    parsedImportTasks: [],
    openImportModal() {
      const modal = document.getElementById('kanbanImportModal');
      if (modal) modal.style.display = 'flex';
      this.parsedImportTasks = [];
      const submitBtn = document.getElementById('kImportSubmitBtn');
      if (submitBtn) submitBtn.disabled = true;
      const preview = document.getElementById('kImportPreviewContainer');
      if (preview) preview.style.display = 'none';
      const fileInp = document.getElementById('kImportFileInput');
      if (fileInp) fileInp.value = '';
      const pasteInp = document.getElementById('kImportPasteInput');
      if (pasteInp) pasteInp.value = '';
    },
    closeImportModal() {
      const modal = document.getElementById('kanbanImportModal');
      if (modal) modal.style.display = 'none';
    },
    switchImportTab(tab) {
      const fileCont = document.getElementById('kImportFileContainer');
      const pasteCont = document.getElementById('kImportPasteContainer');
      const fileBtn = document.getElementById('kImportTabFile');
      const pasteBtn = document.getElementById('kImportTabPaste');

      if (tab === 'file') {
        if (fileCont) fileCont.style.display = 'block';
        if (pasteCont) pasteCont.style.display = 'none';
        if (fileBtn) { fileBtn.className = 'btn-secondary btn-sm'; }
        if (pasteBtn) { pasteBtn.className = 'btn-ghost btn-sm'; }
      } else {
        if (fileCont) fileCont.style.display = 'none';
        if (pasteCont) pasteCont.style.display = 'block';
        if (fileBtn) { fileBtn.className = 'btn-ghost btn-sm'; }
        if (pasteBtn) { pasteBtn.className = 'btn-secondary btn-sm'; }
      }
    },
    downloadSampleCSV() {
      const csvContent = "Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description\n" +
        "Hero Commercial Video Cut 1,Apex Footwear,Apex Autumn 2026 Campaign,Md. Zahin Khandaker,Post Production,video,Editing,High,2026-09-15,12,Main 60s 4K video edit with color grading\n" +
        "Social Media 15-Grid Creative Suite,Chillox Bangladesh,Chillox September Retainer,Firoz Ahmed,Creative & Content,social,Content Draft,Medium,2026-09-10,16,15 static and carousel banners\n" +
        "Influencer Campaign Outreach,Aura Cosmetics,Aura Q3 Product Launch,Lead Video Producer,Influencer Marketing,social,Briefing,High,2026-09-08,8,Selection of 10 Tier-1 beauty influencers\n" +
        "Landing Page UI Redesign,Daraz Bangladesh,Daraz 11.11 Teaser Portal,Mahmudul Hasan,Development & Tech,dev,Wireframe,Urgent,2026-09-12,24,Responsive mobile-first components";

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'purpleos_projects_tasks_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        this.processCSVText(text);
      };
      reader.readAsText(file);
    },
    handlePasteInput() {
      const text = document.getElementById('kImportPasteInput')?.value || '';
      this.processCSVText(text);
    },
    processCSVText(text) {
      if (!text || !text.trim()) {
        const preview = document.getElementById('kImportPreviewContainer');
        if (preview) preview.style.display = 'none';
        const submitBtn = document.getElementById('kImportSubmitBtn');
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      const rows = this.parseCSV(text);
      this.parsedImportTasks = rows;
      this.renderImportPreview(rows);

      const submitBtn = document.getElementById('kImportSubmitBtn');
      if (submitBtn) submitBtn.disabled = rows.length === 0;
    },
    parseCSV(text) {
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const results = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Standard CSV cell splitter handling basic quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const values = match.map(v => v.replace(/^"|"$/g, '').trim());

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (row['task title'] || row.title || row.task) {
          results.push({
            title: row['task title'] || row.title || row.task,
            client: row['client name'] || row.client || row.company || 'Agency',
            projectName: row['project name'] || row.project || '',
            assignee: row.assignee || row['assigned to'] || '',
            department: row.department || row.dept || 'Production',
            workflowType: row['workflow type'] || row.workflow || 'video',
            stage: row.stage || row.status || 'Briefing',
            priority: row.priority || 'Medium',
            dueDate: row['due date'] || row.due || row.deadline || '',
            estimatedHours: Number(row['estimated hours'] || row.hours || 8) || 8,
            description: row.description || row.desc || row.brief || ''
          });
        }
      }
      return results;
    },
    renderImportPreview(rows) {
      const preview = document.getElementById('kImportPreviewContainer');
      const thead = document.getElementById('kImportThead');
      const tbody = document.getElementById('kImportTbody');
      const title = document.getElementById('kImportPreviewTitle');

      if (!rows || rows.length === 0) {
        if (preview) preview.style.display = 'none';
        return;
      }

      if (title) title.innerHTML = `👁️ Live Preview (${rows.length} Deliverables Detected)`;
      if (thead) thead.innerHTML = `<tr><th>Task Title</th><th>Client</th><th>Assignee</th><th>Stage</th><th>Priority</th><th>Due Date</th></tr>`;
      if (tbody) {
        tbody.innerHTML = rows.slice(0, 5).map(r => `
          <tr>
            <td><strong>${escapeHTML(r.title)}</strong></td>
            <td>${escapeHTML(r.client)}</td>
            <td>${escapeHTML(r.assignee || 'Unassigned')}</td>
            <td><span class="status-badge status-open">${escapeHTML(r.stage)}</span></td>
            <td>${escapeHTML(r.priority)}</td>
            <td>${escapeHTML(r.dueDate || 'N/A')}</td>
          </tr>
        `).join('') + (rows.length > 5 ? `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">...and ${rows.length - 5} more deliverables ready to import</td></tr>` : '');
      }
      if (preview) preview.style.display = 'block';
    },
    async submitImport() {
      if (!this.parsedImportTasks || this.parsedImportTasks.length === 0) return;
      const submitBtn = document.getElementById('kImportSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ Importing...';
      }

      try {
        const res = await APP_API.post('/admin/import/tasks', { rows: this.parsedImportTasks });
        if (res && (res.success || res.data?.success || res.imported || res.addedCount)) {
          const count = res.data?.addedCount || res.addedCount || res.imported || this.parsedImportTasks.length;
          if (window.showToast) window.showToast(`🎉 Successfully imported ${count} tasks to Kanban!`, 'success');
          this.closeImportModal();
          await loadData();
        } else {
          throw new Error(res.error || 'Import failed');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Import error: ' + err.message, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = '🚀 Import Tasks to Kanban';
        }
      }
    }
  };

  await loadData();

  if (window.KANBAN_MODULE && window.KANBAN_MODULE.populateFilterDropdowns) {
    window.KANBAN_MODULE.populateFilterDropdowns();
  }
};
