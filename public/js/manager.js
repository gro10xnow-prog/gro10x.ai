/**
 * 🟣 PURPLEOS MANAGER PORTAL CONTROLLER (manager.js)
 * Phase MA1 & MA2 — Manager RBAC & Kanban Task Management Hub
 */

let currentManagerUser = null;
let currentKanbanTasks = [];
let kanbanDeptFilterMode = 'my'; // 'my' vs 'all'

function getManagerToken() {
  return (window.GRO10XAuth && typeof window.GRO10XAuth.getToken === 'function' && window.GRO10XAuth.getToken()) ||
         localStorage.getItem('gro10x_token') ||
         localStorage.getItem('sb-access-token') ||
         sessionStorage.getItem('gro10x_token') ||
         localStorage.getItem('jwt_token') || '';
}

function managerFetch(url, options = {}) {
  const token = getManagerToken();
  const baseHeaders = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const headers = { ...baseHeaders, ...(options.headers || {}) };
  return window.fetch(url, { ...options, headers });
}

/* -------------------------------------------------------------
 * 🔔 Manager Portal Toast Notification System
 * ------------------------------------------------------------- */
function showManagerToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('managerToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'managerToastContainer';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkManagerAuth();
  await loadManagerMetadata();
  initManagerNavigation();
  fetchAppVersion();
});

async function fetchAppVersion() {
  try {
    const res = await managerFetch('/api/version');
    if(res.ok) {
      const data = await res.json();
      const verDisplay = document.getElementById('app-version-display');
      if(verDisplay) verDisplay.innerText = `Department Manager Portal v${data.version}`;
    }
  } catch(e) {
    console.error('Failed to fetch app version', e);
  }
}

let managerClients = [];
let managerTeamMembers = [];
let managerLabels = [];
let managerCustomFields = [];
let managerTaskTemplates = [];
let selectedKanbanLabel = '';

async function loadManagerMetadata() {
  try {
    await loadManagerLabels();
    await loadManagerCustomFields();
    await loadManagerTaskTemplates();
  } catch(e) {}
  try {
    const [clientRes, teamRes] = await Promise.all([
      managerFetch('/api/clients').catch(() => null),
      managerFetch('/api/team').catch(() => null)
    ]);
    if (clientRes && clientRes.ok) managerClients = await clientRes.json();
    if (teamRes && teamRes.ok) managerTeamMembers = await teamRes.json();

    populateManagerClientDropdowns();
  } catch (err) {
    console.warn('Metadata fetch error:', err.message);
  }
}

function populateManagerClientDropdowns() {
  const clientSelects = ['postClientSelect', 'cutClientSelect', 'taskClientSelect'];
  if (!managerClients || !managerClients.length) return;

  clientSelects.forEach(selectId => {
    const el = document.getElementById(selectId);
    if (el) {
      el.innerHTML = managerClients.map(c => `<option value="${c.name}">${c.name} (${c.tier || 'Retainer'})</option>`).join('');
    }
  });
}

/**
 * 1. Authentication & Role Gate Check for /manager
 */
async function checkManagerAuth() {
  try {
    const token = (window.GRO10XAuth && window.GRO10XAuth.getToken()) ||
                  localStorage.getItem('gro10x_token') ||
                  localStorage.getItem('sb-access-token') ||
                  sessionStorage.getItem('gro10x_token') ||
                  localStorage.getItem('jwt_token');
    
    // Attempt session verification from API
    const res = await managerFetch('/api/auth/me', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      // Unauthenticated -> redirect to auth login
      window.location.href = '/auth?redirect=/manager';
      return;
    }

    const data = await res.json();
    currentManagerUser = data.user || data;

    // Role-based Redirect Gates
    const accessLevel = (currentManagerUser.accessLevel || '').trim();

    if (accessLevel === 'Owner / Admin') {
      console.log('ℹ️ Owner user detected at /manager. Redirecting to /admin...');
      window.location.href = '/admin';
      return;
    }

    if (accessLevel === 'Specialist / Crew') {
      console.log('ℹ️ Specialist user detected at /manager. Redirecting to /team...');
      window.location.href = '/team';
      return;
    }

    // Operations Director default filter to 'all', others default to 'my'
    const isOpsDirector = (currentManagerUser.role || '').toLowerCase().includes('operations') || currentManagerUser.department === 'Management';
    if (isOpsDirector) {
      kanbanDeptFilterMode = 'all';
    }

    // Valid Manager Role — Save to Session Storage
    sessionStorage.setItem('currentManagerUser', JSON.stringify(currentManagerUser));
    sessionStorage.setItem('currentUserRole', currentManagerUser.accessLevel);
    sessionStorage.setItem('currentUserDept', currentManagerUser.department || 'Management');

    // Update Header Badges
    updateManagerHeader(currentManagerUser);

    // Apply Tab Scoping Filter based on Manager Role & Dept
    applyManagerTabScoping(currentManagerUser);

  } catch (err) {
    console.warn('⚠️ Manager Auth Check Error:', err.message);
    const stored = sessionStorage.getItem('currentManagerUser');
    if (stored) {
      currentManagerUser = JSON.parse(stored);
      updateManagerHeader(currentManagerUser);
      applyManagerTabScoping(currentManagerUser);
    } else {
      window.location.href = '/auth?redirect=/manager';
    }
  }
}

/**
 * 2. Update Header User Badge & Department Tag
 */
function updateManagerHeader(user) {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRoleTag');
  const deptEl = document.getElementById('userDeptTag');
  const avatarEl = document.getElementById('userAvatar');

  if (nameEl) nameEl.textContent = user.name || 'Manager';
  if (roleEl) roleEl.textContent = user.role || user.accessLevel || 'Department Manager';
  if (deptEl) deptEl.textContent = `📍 ${user.department || 'Operations'}`;
  
  if (avatarEl && user.name) {
    const parts = user.name.split(' ');
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

/**
 * 3. Apply Tab Scoping Rules per Role & Department
 */
function applyManagerTabScoping(user) {
  const accessLevel = (user.accessLevel || '').trim();
  const department = (user.department || '').trim();
  const isOpsDirector = ['PBD-003', 'PBD-004', 'PBD-005'].includes(user.id) || (user.role || '').toLowerCase().includes('operations') || (user.role || '').toLowerCase().includes('head') || department === 'Management';

  const allNavItems = document.querySelectorAll('.sidebar-nav .nav-item');

  allNavItems.forEach(item => {
    const onclickAttr = item.getAttribute('onclick') || '';
    const tabMatch = onclickAttr.match(/switchTab\('([^']+)'\)/);
    if (!tabMatch) return;
    const tabId = tabMatch[1];

    let isAllowed = false;

    if (accessLevel === 'Finance Manager') {
      isAllowed = (tabId === 'financials');
    } else if (isOpsDirector) {
      const opsAllowedTabs = ['dashboard', 'crm', 'kanban', 'hrops', 'financials', 'reviewroom', 'social', 'assets', 'chat'];
      isAllowed = opsAllowedTabs.includes(tabId);
    } else {
      switch (department) {
        case 'Design & Post-Production':
          isAllowed = ['dashboard', 'kanban', 'hrops', 'reviewroom', 'assets'].includes(tabId);
          break;
        case 'Content Production':
          isAllowed = ['dashboard', 'kanban', 'hrops', 'reviewroom', 'assets'].includes(tabId);
          break;
        case 'Client Services':
          isAllowed = ['dashboard', 'crm', 'kanban', 'hrops', 'reviewroom', 'social', 'chat'].includes(tabId);
          break;
        case 'Strategy & Planning':
          isAllowed = ['dashboard', 'crm', 'kanban', 'hrops', 'social'].includes(tabId);
          break;
        case 'Finance & Admin':
          isAllowed = ['dashboard', 'financials', 'hrops'].includes(tabId);
          break;
        default:
          isAllowed = ['dashboard', 'kanban', 'hrops', 'financials'].includes(tabId);
      }
    }

    if (isAllowed) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });

  if (accessLevel === 'Finance Manager') {
    switchTab('financials');
  } else {
    switchTab('dashboard');
  }
}

/* -------------------------------------------------------------
 * 📱 Mobile Sidebar Navigation Drawer Handlers
 * ------------------------------------------------------------- */
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar-nav');
  const backdrop = document.getElementById('adminNavBackdrop');
  if (sidebar) sidebar.classList.toggle('is-open');
  if (backdrop) {
    backdrop.style.display = sidebar && sidebar.classList.contains('is-open') ? 'block' : 'none';
  }
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar-nav');
  const backdrop = document.getElementById('adminNavBackdrop');
  if (sidebar) sidebar.classList.remove('is-open');
  if (backdrop) backdrop.style.display = 'none';
}

/**
 * 4. Tab Switcher Function
 */
function switchTab(tabId) {
  closeMobileSidebar();

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    const onclickAttr = item.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${tabId}'`)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
    pane.style.display = 'none';
  });

  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) {
    targetPane.classList.add('active');
    targetPane.style.display = 'block';
  }

  // Load tab-specific data
  if (tabId === 'dashboard') {
    loadManagerOverviewKPIs();
  } else if (tabId === 'crm') {
    loadManagerCRM();
  } else if (tabId === 'assets') {
    loadManagerAssets();
  } else if (tabId === 'chat') {
    loadManagerChat();
  } else if (tabId === 'kanban') {
    loadManagerKanban();
  } else if (tabId === 'financials') {
    loadManagerExpenses();
  } else if (tabId === 'hrops') {
    loadManagerHROps();
  } else if (tabId === 'reviewroom') {
    loadManagerReviewRoom();
  } else if (tabId === 'social') {
    loadManagerSocialPlanner();
  } else if (tabId === 'tickets') {
    loadManagerTickets();
  } else if (tabId === 'workload') {
    loadManagerWorkload();
  }

  console.log(`📌 Manager Portal: Switched to tab '${tabId}'`);
}

/**
 * 5. KANBAN MANAGEMENT (Phase MA2)
 */

async function loadManagerKanban() {
  try {
    const res = await managerFetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to load tasks');
    currentKanbanTasks = await res.json();
    renderManagerKanbanBoard();
  } catch (err) {
    console.error('Error loading Kanban tasks:', err);
  }
}

function setKanbanDeptFilter(mode) {
  kanbanDeptFilterMode = mode;
  const btnMy = document.getElementById('btnFilterMyDept');
  const btnAll = document.getElementById('btnFilterAllDepts');

  if (mode === 'my') {
    if (btnMy) { btnMy.style.background = '#3b82f6'; btnMy.style.color = '#fff'; }
    if (btnAll) { btnAll.style.background = 'transparent'; btnAll.style.color = '#a1a1aa'; }
  } else {
    if (btnAll) { btnAll.style.background = '#3b82f6'; btnAll.style.color = '#fff'; }
    if (btnMy) { btnMy.style.background = 'transparent'; btnMy.style.color = '#a1a1aa'; }
  }

  renderManagerKanbanBoard();
}

function renderManagerKanbanBoard() {
  const userDept = (currentManagerUser?.department || 'Management').toLowerCase();
  const isOps = (currentManagerUser?.role || '').toLowerCase().includes('operations') || userDept === 'management';

  // Filter tasks based on mode & user dept
  let filteredTasks = currentKanbanTasks;
  if (kanbanDeptFilterMode === 'my' && !isOps) {
    filteredTasks = currentKanbanTasks.filter(t => {
      const tDept = (t.department || t.category || '').toLowerCase();
      const tAssignee = (t.assignee || '').toLowerCase();
      return tDept.includes(userDept) || tAssignee.includes(userDept.split(' ')[0]);
    });
  }

  // Filter tasks by selected tag label
  if (selectedKanbanLabel) {
    filteredTasks = filteredTasks.filter(t => (t.labels || []).some(l => l.id === selectedKanbanLabel));
  }

  // Map task stage to column ID
  const columns = {
    'Briefing': document.getElementById('col-Briefing'),
    'Production': document.getElementById('col-Production'),
    'Editing': document.getElementById('col-Editing'),
    'ClientReview': document.getElementById('col-ClientReview'),
    'Approved': document.getElementById('col-Approved')
  };

  const counts = {
    'Briefing': 0, 'Production': 0, 'Editing': 0, 'ClientReview': 0, 'Approved': 0
  };

  // Clear existing cards
  Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

  filteredTasks.forEach(task => {
    let colKey = 'Briefing';
    const stage = (task.stage || '').toLowerCase();

    if (stage.includes('brief') || stage.includes('script')) colKey = 'Briefing';
    else if (stage.includes('prod') || stage.includes('shoot') || stage.includes('field')) colKey = 'Production';
    else if (stage.includes('edit') || stage.includes('motion') || stage.includes('post')) colKey = 'Editing';
    else if (stage.includes('client') || stage.includes('review')) colKey = 'ClientReview';
    else if (stage.includes('approved') || stage.includes('done') || stage.includes('paid')) colKey = 'Approved';

    counts[colKey]++;

    const colEl = columns[colKey];
    if (colEl) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.style.cssText = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.85rem; cursor: pointer; transition: all 0.2s;';

      const priorityColor = task.priority === 'High' ? '#f87171' : (task.priority === 'Medium' ? '#fbbf24' : '#34d399');
      
      const labelsHtml = (task.labels && task.labels.length > 0)
        ? `<div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.4rem;">
            ${task.labels.map(l => `<span style="font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; color: #fff; background: ${l.color || '#3b82f6'}; display: inline-block;">${l.name}</span>`).join('')}
           </div>`
        : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <span style="font-size: 0.72rem; padding: 0.1rem 0.4rem; background: rgba(255,255,255,0.06); border-radius: 6px; color: #94a3b8; font-weight: 600;">${task.client || 'Agency Client'}</span>
          <span style="font-size: 0.68rem; font-weight: 700; color: ${priorityColor};">● ${task.priority || 'Normal'}</span>
        </div>
        ${labelsHtml}
        <div style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.5rem; line-height: 1.3;">${task.title}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b;">
          <span>👤 ${task.assignee || 'Unassigned'}</span>
          <span>📅 ${task.dueDate || 'Soon'}</span>
        </div>
        <div style="display: flex; gap: 0.3rem; margin-top: 0.6rem; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.05);">
          ${colKey !== 'Briefing' ? `<button onclick="advanceTaskStage('${task.id}', '${getPrevStage(colKey)}')" style="padding: 0.15rem 0.4rem; font-size: 0.68rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #cbd5e1; cursor: pointer;">← Back</button>` : ''}
          ${colKey !== 'Approved' ? `<button onclick="advanceTaskStage('${task.id}', '${getNextStage(colKey)}')" style="padding: 0.15rem 0.4rem; font-size: 0.68rem; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.3); border-radius: 4px; color: #60a5fa; cursor: pointer; margin-left: auto;">Advance →</button>` : ''}
        </div>
      `;
      colEl.appendChild(card);
    }
  });

  // Update counts & render empty state placeholders
  Object.keys(counts).forEach(k => {
    const badge = document.getElementById(`count-${k}`);
    if (badge) badge.textContent = counts[k];

    const colEl = columns[k];
    if (colEl && counts[k] === 0) {
      colEl.innerHTML = `
        <div class="kanban-empty-card" style="padding: 1.25rem 0.75rem; text-align: center; color: #64748b; font-size: 0.78rem; background: rgba(15,23,42,0.4); border: 1px dashed rgba(255,255,255,0.06); border-radius: 10px;">
          <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">📋</div>
          <div>No tasks in this stage</div>
        </div>
      `;
    }
  });
}

function getNextStage(currentCol) {
  switch (currentCol) {
    case 'Briefing': return 'Production';
    case 'Production': return 'Editing';
    case 'Editing': return 'Client Review';
    case 'ClientReview': return 'Approved';
    default: return 'Approved';
  }
}

function getPrevStage(currentCol) {
  switch (currentCol) {
    case 'Approved': return 'Client Review';
    case 'ClientReview': return 'Editing';
    case 'Editing': return 'Production';
    case 'Production': return 'Scripting';
    default: return 'Scripting';
  }
}

async function advanceTaskStage(taskId, newStage) {
  try {
    const res = await managerFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
    const data = await res.json();
    if (data.success) {
      if (newStage === 'Editing') {
        showManagerToast('🎬 Task advanced to Editing — Telegram notification sent to assigned editor (AUT-001)!', 'success');
      } else if (newStage === 'Client Review') {
        showManagerToast('👁️ Task advanced to Client Review — Telegram push sent to client with Review Room link (AUT-004)!', 'success');
      } else {
        showManagerToast(`▶️ Task stage updated to ${newStage}`, 'success');
      }
      await loadManagerKanban();
    }
  } catch (err) {
    showManagerToast('Error updating task stage: ' + err.message, 'error');
  }
}

/**
 * TASK CREATE MODAL HANDLERS
 */
function openManagerTaskModal() {
  const modal = document.getElementById('managerTaskModal');
  const assigneeSelect = document.getElementById('taskAssigneeSelect');

  if (assigneeSelect) {
    // Populate team roster based on manager dept
    managerFetch('/api/team')
      .then(res => res.json())
      .then(team => {
        assigneeSelect.innerHTML = '';
        const userDept = (currentManagerUser?.department || '').toLowerCase();
        const isOps = (currentManagerUser?.role || '').toLowerCase().includes('operations') || userDept.includes('management');

        const filteredTeam = isOps ? team : team.filter(t => (t.department || '').toLowerCase().includes(userDept) || userDept.includes((t.department || '').toLowerCase()));
        
        const listToRender = filteredTeam.length > 0 ? filteredTeam : team;
        listToRender.forEach(member => {
          const opt = document.createElement('option');
          opt.value = member.name;
          opt.textContent = `${member.name} (${member.role || member.department})`;
          assigneeSelect.appendChild(opt);
        });
      }).catch(e => {});
  }

  if (modal) modal.style.display = 'flex';
}

function closeManagerTaskModal() {
  const modal = document.getElementById('managerTaskModal');
  if (modal) modal.style.display = 'none';
}

async function submitManagerTask(event) {
  event.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const client = document.getElementById('taskClientSelect').value;
  const priority = document.getElementById('taskPrioritySelect').value;
  const assignee = document.getElementById('taskAssigneeSelect').value;
  const dueDate = document.getElementById('taskDueDateInput').value;
  const estimatedHours = document.getElementById('taskEstimatedHoursInput') ? document.getElementById('taskEstimatedHoursInput').value : 0;

  const labelCheckboxes = document.querySelectorAll('.task-label-checkbox:checked');
  const labelIds = Array.from(labelCheckboxes).map(cb => cb.value);

  const cfInputs = document.querySelectorAll('.task-cf-input');
  const customFields = {};
  cfInputs.forEach(input => {
    const fId = input.getAttribute('data-field-id');
    if (fId && input.value) {
      customFields[fId] = input.value;
    }
  });

  try {
    const res = await managerFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, client, priority, assignee, dueDate, estimatedHours, labelIds, customFields })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Production task "${title}" created successfully!`, 'success');
      closeManagerTaskModal();
      await loadManagerKanban();
    } else {
      showManagerToast('Error creating task: ' + (data.error || 'Check fields'), 'error');
    }
  } catch (err) {
    showManagerToast('Error submitting task: ' + err.message, 'error');
  }
}

/* -------------------------------------------------------------
 * 🏷️ Customized Labels Management Helper Functions
 * ------------------------------------------------------------- */
async function loadManagerLabels() {
  try {
    const res = await managerFetch('/api/labels');
    if (!res.ok) return;
    managerLabels = await res.json();
    populateKanbanLabelFilter();
    populateTaskModalLabels();
    populateManageLabelsModalList();
  } catch (e) {
    console.error('Error loading labels:', e);
  }
}

function populateKanbanLabelFilter() {
  const filterSelect = document.getElementById('kanbanLabelFilter');
  if (!filterSelect) return;
  const currentVal = filterSelect.value;
  filterSelect.innerHTML = '<option value="">🏷️ All Tag Labels</option>';
  managerLabels.forEach(lbl => {
    const opt = document.createElement('option');
    opt.value = lbl.id;
    opt.textContent = `🏷️ ${lbl.name}`;
    if (currentVal === lbl.id) opt.selected = true;
    filterSelect.appendChild(opt);
  });
}

function onKanbanLabelFilterChange() {
  const filterSelect = document.getElementById('kanbanLabelFilter');
  selectedKanbanLabel = filterSelect ? filterSelect.value : '';
  renderManagerKanbanBoard();
}

function populateTaskModalLabels() {
  const container = document.getElementById('taskLabelCheckboxes');
  if (!container) return;
  container.innerHTML = '';
  if (managerLabels.length === 0) {
    container.innerHTML = '<div style="font-size:0.75rem; color:#64748b;">No custom labels found</div>';
    return;
  }
  managerLabels.forEach(lbl => {
    const labelWrapper = document.createElement('label');
    labelWrapper.style.cssText = 'display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.5rem; background: rgba(255,255,255,0.06); border-radius: 6px; font-size: 0.72rem; cursor: pointer; color: #fff;';
    labelWrapper.innerHTML = `
      <input type="checkbox" value="${lbl.id}" class="task-label-checkbox" style="cursor: pointer; accent-color: ${lbl.color || '#3b82f6'};">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${lbl.color || '#3b82f6'};"></span>
      <span>${lbl.name}</span>
    `;
    container.appendChild(labelWrapper);
  });
}

function openManageLabelsModal() {
  const modal = document.getElementById('managerLabelModal');
  if (modal) {
    modal.style.display = 'flex';
    populateManageLabelsModalList();
  }
}

function closeManageLabelsModal() {
  const modal = document.getElementById('managerLabelModal');
  if (modal) modal.style.display = 'none';
}

function populateManageLabelsModalList() {
  const container = document.getElementById('labelsListContainer');
  if (!container) return;
  container.innerHTML = '';
  if (managerLabels.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem; color:#64748b; padding:0.5rem;">No labels created yet. Add one above!</div>';
    return;
  }
  managerLabels.forEach(lbl => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.04); border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.06);';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${lbl.color || '#3b82f6'};"></span>
        <span style="font-weight: 600; color: #f8fafc;">${lbl.name}</span>
      </div>
      <button onclick="deleteCustomLabel('${lbl.id}')" style="background: transparent; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px;">🗑️ Delete</button>
    `;
    container.appendChild(item);
  });
}

async function submitCreateLabel(event) {
  event.preventDefault();
  const nameInput = document.getElementById('newLabelNameInput');
  const colorInput = document.getElementById('newLabelColorInput');
  if (!nameInput || !nameInput.value.trim()) return;

  try {
    const res = await managerFetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value.trim(), color: colorInput.value })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Custom tag "${nameInput.value}" created!`, 'success');
      nameInput.value = '';
      await loadManagerLabels();
    } else {
      showManagerToast('Error creating tag: ' + (data.error || 'Check input'), 'error');
    }
  } catch (err) {
    showManagerToast('Error creating label: ' + err.message, 'error');
  }
}

async function deleteCustomLabel(labelId) {
  if (!confirm('Are you sure you want to delete this label?')) return;
  try {
    const res = await managerFetch(`/api/labels/${labelId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showManagerToast('🗑️ Label deleted successfully', 'success');
      await loadManagerLabels();
      await loadManagerKanban();
    }
  } catch (err) {
    showManagerToast('Error deleting label: ' + err.message, 'error');
  }
}

/**
 * 6. EXPENSE 3-TIER APPROVALS (Phase MA3)
 */
async function loadManagerExpenses() {
  const tbody = document.getElementById('managerExpenseTableBody');
  if (!tbody) return;

  try {
    const res = await managerFetch('/api/expenses');
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const expenses = await res.json();

    tbody.innerHTML = '';
    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: #64748b;">No expense claims found.</td></tr>`;
      return;
    }

    const userRole = (currentManagerUser?.accessLevel || '').trim();
    const isFinance = (userRole === 'Finance Manager');
    const isManager = (userRole === 'Director / Manager');

    expenses.forEach(exp => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1;';

      const t1Done = exp.tier1 && exp.tier1.approved;
      const t2Done = exp.tier2 && exp.tier2.approved;
      const t3Done = exp.tier3 && exp.tier3.approved;

      let badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(251,191,36,0.2); color: #fbbf24;">T1 ⏳ Line Review</span>`;
      if (t3Done) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(52,211,153,0.2); color: #34d399;">✅ Disbursed & Paid</span>`;
      } else if (t2Done) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(192,132,252,0.2); color: #c084fc;">T3 👑 Owner Release</span>`;
      } else if (t1Done) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(59,130,246,0.2); color: #60a5fa;">T2 💰 Finance Verification</span>`;
      }

      let actionBtn = `<span style="font-size: 0.75rem; color: #64748b;">No Action Needed</span>`;
      if (!t1Done && isManager) {
        actionBtn = `<button onclick="approveExpenseT1('${exp.id}')" style="padding: 0.3rem 0.7rem; font-size: 0.75rem; font-weight: 600; background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #34d399; border-radius: 6px; cursor: pointer;">✅ Approve T1</button>`;
      } else if (t1Done && !t2Done && isFinance) {
        actionBtn = `<button onclick="approveExpenseT2('${exp.id}')" style="padding: 0.3rem 0.7rem; font-size: 0.75rem; font-weight: 600; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #60a5fa; border-radius: 6px; cursor: pointer;">💰 Verify T2</button>`;
      }

      const receiptLink = exp.receiptUrl ? `<a href="${exp.receiptUrl}" target="_blank" style="color: #60a5fa; text-decoration: none;">📎 Receipt</a>` : '<span style="color: #64748b;">None</span>';

      tr.innerHTML = `
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #38bdf8;">${exp.id}</td>
        <td style="padding: 0.75rem 0.5rem;">${exp.submittedBy}</td>
        <td style="padding: 0.75rem 0.5rem;">${exp.category}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #f8fafc;">BDT ${(Number(exp.amount) || 0).toLocaleString()}</td>
        <td style="padding: 0.75rem 0.5rem;">${receiptLink}</td>
        <td style="padding: 0.75rem 0.5rem;">${badgeHtml}</td>
        <td style="padding: 0.75rem 0.5rem; text-align: right;">${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error loading manager expenses:', err);
  }
}

async function approveExpenseT1(expId) {
  try {
    const res = await managerFetch(`/api/expenses/${expId}/approve-tier1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Line Manager' })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Tier 1 Approved for ${expId}! Status updated to Tier 2 Pending — Finance Lead Roksana notified via Telegram (AUT-008).`, 'success');
      await loadManagerExpenses();
    }
  } catch (err) {
    showManagerToast('Error approving Tier 1: ' + err.message, 'error');
  }
}

async function approveExpenseT2(expId) {
  try {
    const res = await managerFetch(`/api/expenses/${expId}/approve-tier2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Roksana Islam (Finance Lead)' })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`💰 Tier 2 Verified for ${expId}! Status updated to Tier 3 Pending — Owner notified for final disbursement (AUT-009).`, 'success');
      await loadManagerExpenses();
    }
  } catch (err) {
    showManagerToast('Error verifying Tier 2: ' + err.message, 'error');
  }
}

function openSubmitExpenseModal() {
  const amountStr = prompt('Enter Expense Claim Amount in BDT (৳):', '1500');
  if (!amountStr) return;
  const amount = Number(amountStr);
  if (!amount || isNaN(amount)) return;
  const category = prompt('Enter Expense Category (e.g. Equipment, Travel, Software, Production):', 'Production');
  if (!category) return;
  const desc = prompt('Enter Short Note / Description:', 'Shooting Props & Travel');

  managerFetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      category,
      description: desc || 'Manager submitted expense',
      submittedBy: currentManagerUser?.name || 'Department Manager'
    })
  }).then(res => res.json()).then(() => {
    showManagerToast('✅ Expense claim submitted successfully!', 'success');
    loadManagerExpenses();
  }).catch(err => {
    showManagerToast('Error submitting claim: ' + err.message, 'error');
  });
}

/**
 * 7. HR OPS: 3-TIER LEAVES & EOD REVIEWS (Phase MA4)
 */
async function loadManagerHROps() {
  const leaveTbody = document.getElementById('managerLeaveTableBody');
  const eodContainer = document.getElementById('managerEodList');
  const rateBadge = document.getElementById('eodRateBadge');

  // 1. Fetch & Render Leave Requests
  if (leaveTbody) {
    try {
      const res = await managerFetch('/api/leaves');
      if (res.ok) {
        const leaves = await res.json();
        leaveTbody.innerHTML = '';
        if (leaves.length === 0) {
          leaveTbody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: #64748b;">No leave requests logged.</td></tr>`;
        } else {
          leaves.forEach(leave => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1;';

            let badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(251,191,36,0.2); color: #fbbf24;">T1 ⏳ Pending Line Review</span>`;
            const st = (leave.status || '').toLowerCase();
            if (st.includes('owner') || st === 'approved') {
              badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(52,211,153,0.2); color: #34d399;">✅ Owner Approved</span>`;
            } else if (st.includes('manager')) {
              badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(192,132,252,0.2); color: #c084fc;">T2 👑 Pending Owner Sign-off</span>`;
            } else if (st.includes('decline') || st.includes('reject')) {
              badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(239,68,68,0.2); color: #f87171;">❌ Rejected</span>`;
            }

            let actionBtns = `<span style="font-size: 0.75rem; color: #64748b;">No Action Needed</span>`;
            const userRole = (currentManagerUser?.accessLevel || '').trim();
            if ((st.includes('pending') || !st.includes('manager')) && !st.includes('approved') && !st.includes('decline') && !st.includes('reject') && userRole.includes('Manager')) {
              actionBtns = `
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <button onclick="approveLeaveManager('${leave.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #34d399; border-radius: 6px; cursor: pointer;">✅ Approve</button>
                  <button onclick="rejectLeaveManager('${leave.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); color: #f87171; border-radius: 6px; cursor: pointer;">❌ Reject</button>
                </div>
              `;
            }

            tr.innerHTML = `
              <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #38bdf8;">${leave.id}</td>
              <td style="padding: 0.75rem 0.5rem; font-weight: 600;">${leave.staffName || 'Staff'}</td>
              <td style="padding: 0.75rem 0.5rem;">${leave.type}</td>
              <td style="padding: 0.75rem 0.5rem;">${leave.startDate} to ${leave.endDate} (${leave.totalDays || 1}d)</td>
              <td style="padding: 0.75rem 0.5rem;">${leave.reason}</td>
              <td style="padding: 0.75rem 0.5rem;">${badgeHtml}</td>
              <td style="padding: 0.75rem 0.5rem; text-align: right;">${actionBtns}</td>
            `;
            leaveTbody.appendChild(tr);
          });
        }
      }
    } catch (e) {
      console.error('Error fetching leaves:', e);
    }
  }

  // 2. Fetch & Render Team EOD Reports
  if (eodContainer) {
    try {
      const res = await managerFetch('/api/eod');
      if (res.ok) {
        const eods = await res.json();
        eodContainer.innerHTML = '';
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEods = eods.filter(e => (e.date || '').startsWith(todayStr) || (e.submittedAt || '').startsWith(todayStr));

        if (rateBadge) {
          rateBadge.textContent = `📊 ${todayEods.length} Team Submission(s) Logged Today`;
        }

        const reportsToDisplay = todayEods.length > 0 ? todayEods : eods;

        if (reportsToDisplay.length === 0) {
          eodContainer.innerHTML = `<div style="padding: 1rem; color: #64748b; font-size: 0.85rem;">No EOD reports logged for today.</div>`;
        } else {
          reportsToDisplay.forEach(eod => {
            const hasBlockers = eod.blockers && !eod.blockers.toLowerCase().includes('none') && eod.blockers.trim() !== '';
            const blockerStyle = hasBlockers ? 'border: 1px solid rgba(239,68,68,0.4); background: rgba(239,68,68,0.08);' : 'border: 1px solid rgba(255,255,255,0.05); background: rgba(15,23,42,0.6);';

            const item = document.createElement('div');
            item.style.cssText = `border-radius: 10px; padding: 1rem; ${blockerStyle}`;
            item.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 700; color: #f8fafc; font-size: 0.9rem;">👤 ${eod.staffName || 'Crew Member'}</span>
                <span style="font-size: 0.72rem; color: #94a3b8;">🕒 ${eod.date || 'Today'}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; font-size: 0.8rem; color: #cbd5e1;">
                <div>
                  <div style="color: #34d399; font-weight: 700; margin-bottom: 0.2rem;">✅ Completed Tasks:</div>
                  <div style="white-space: pre-line; line-height: 1.4;">${eod.tasksCompleted || 'None'}</div>
                </div>
                <div>
                  <div style="color: #60a5fa; font-weight: 700; margin-bottom: 0.2rem;">🔄 In Progress:</div>
                  <div style="white-space: pre-line; line-height: 1.4;">${eod.tasksInProgress || 'None'}</div>
                </div>
                <div>
                  <div style="color: ${hasBlockers ? '#f87171' : '#a78bfa'}; font-weight: 700; margin-bottom: 0.2rem;">🚨 Blockers / Help:</div>
                  <div style="white-space: pre-line; line-height: 1.4; ${hasBlockers ? 'color: #f87171; font-weight: 600;' : ''}">${eod.blockers || 'None'}</div>
                </div>
              </div>
            `;
            eodContainer.appendChild(item);
          });
        }
      }
    } catch (e) {
      console.error('Error fetching EOD reports:', e);
    }
  }
}

async function approveLeaveManager(leaveId) {
  try {
    const res = await managerFetch(`/api/leaves/${leaveId}/manager-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Line Manager' })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`🌴 Leave Request ${leaveId} Manager Approved! Forwarded to Owner for final sign-off.`, 'success');
      await loadManagerHROps();
    }
  } catch (err) {
    showManagerToast('Error approving leave: ' + err.message, 'error');
  }
}

async function rejectLeaveManager(leaveId, customReason) {
  const reason = customReason || 'Operational schedule conflict';

  try {
    const res = await managerFetch(`/api/leaves/${leaveId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy: currentManagerUser?.name || 'Line Manager', reason })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`❌ Leave Request ${leaveId} Rejected — Staff member notified.`, 'info');
      await loadManagerHROps();
    }
  } catch (err) {
    showManagerToast('Error rejecting leave: ' + err.message, 'error');
  }
}

/**
 * 8. REVIEW ROOM V2 & CUT DELIVERABLES (Phase MA6)
 */
async function loadManagerReviewRoom() {
  const tbody = document.getElementById('managerReviewTableBody');
  if (!tbody) return;

  try {
    const res = await managerFetch('/api/reviews');
    if (!res.ok) throw new Error('Failed to fetch reviews');
    const reviews = await res.json();

    tbody.innerHTML = '';
    if (reviews.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: #64748b;">No video cuts in review pipeline.</td></tr>`;
      return;
    }

    reviews.forEach(rev => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1;';

      const st = (rev.status || 'Pending Review').toLowerCase();
      let badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(251,191,36,0.2); color: #fbbf24;">👁️ Pending Client Sign-off</span>`;
      if (st.includes('approved')) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(52,211,153,0.2); color: #34d399;">✅ Approved (Invoice Released)</span>`;
      } else if (st.includes('revision')) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(244,114,182,0.2); color: #f472b6;">✂️ Revisions Requested</span>`;
      }

      const videoLink = rev.videoUrl ? `<a href="${rev.videoUrl}" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 600;">▶️ Play Cut</a>` : '<span style="color: #64748b;">No Video Link</span>';

      tr.innerHTML = `
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #38bdf8;">${rev.id || rev.reviewId || 'REV-101'}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 600;">${rev.title || rev.projectTitle || 'Commercial Cut'}</td>
        <td style="padding: 0.75rem 0.5rem;">${rev.client || 'Agency Client'}</td>
        <td style="padding: 0.75rem 0.5rem;"><span style="padding: 0.15rem 0.45rem; background: rgba(255,255,255,0.06); border-radius: 6px; font-size: 0.72rem;">${rev.version || 'v1.0 Cut'}</span></td>
        <td style="padding: 0.75rem 0.5rem;">${videoLink}</td>
        <td style="padding: 0.75rem 0.5rem;">${badgeHtml}</td>
        <td style="padding: 0.75rem 0.5rem; text-align: right;">
          <a href="/client-miniapp?reviewId=${rev.id || 'REV-101'}" target="_blank" style="padding: 0.3rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #60a5fa; border-radius: 6px; text-decoration: none; display: inline-block;">👁️ Open Review Room</a>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error loading manager review room:', err);
  }
}

function openUploadCutModal() {
  const modal = document.getElementById('managerUploadCutModal');
  if (modal) modal.style.display = 'flex';
}

function closeUploadCutModal() {
  const modal = document.getElementById('managerUploadCutModal');
  if (modal) modal.style.display = 'none';
}

async function submitManagerReviewCut(event) {
  event.preventDefault();
  const title = document.getElementById('cutTitleInput').value.trim();
  const client = document.getElementById('cutClientSelect').value;
  const version = document.getElementById('cutVersionInput').value.trim();
  const videoUrl = document.getElementById('cutVideoUrlInput').value.trim();

  try {
    const res = await managerFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        client,
        version,
        videoUrl,
        uploadedBy: currentManagerUser?.name || 'Lead Director',
        status: 'Pending Review'
      })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`🎬 Video cut deliverable "${title}" (${version}) uploaded successfully! Client notified via Telegram (AUT-004).`, 'success');
      closeUploadCutModal();
      await loadManagerReviewRoom();
    } else {
      showManagerToast('Error uploading cut: ' + (data.error || 'Check fields'), 'error');
    }
  } catch (err) {
    showManagerToast('Error submitting review cut: ' + err.message, 'error');
  }
}

/**
 * 9. SOCIAL PLANNER & CONTENT DISPATCH (Phase MA7)
 */
let currentSocialFilter = 'all';

async function loadManagerSocialPlanner() {
  const tbody = document.getElementById('managerSocialTableBody');
  if (!tbody) return;

  try {
    const res = await managerFetch('/api/social-posts');
    if (!res.ok) throw new Error('Failed to fetch social posts');
    let posts = await res.json();

    if (currentSocialFilter !== 'all') {
      posts = posts.filter(p => (p.platform || '').toLowerCase() === currentSocialFilter.toLowerCase());
    }

    tbody.innerHTML = '';
    if (posts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 1.5rem; text-align: center; color: #64748b;">No scheduled social posts found. Click "Schedule New Social Post" above to add one.</td></tr>`;
      return;
    }

    posts.forEach(p => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1;';

      const platformIcon = p.platform === 'Instagram' ? '📷' : (p.platform === 'Facebook' ? '📘' : (p.platform === 'TikTok' ? '🎵' : '💼'));
      const st = (p.status || 'Pending Client Approval').toLowerCase();
      let badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(251,191,36,0.2); color: #fbbf24;">⏳ Pending Approval</span>`;
      if (st.includes('approved') || st.includes('scheduled')) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(52,211,153,0.2); color: #34d399;">✅ Scheduled</span>`;
      } else if (st.includes('published')) {
        badgeHtml = `<span style="padding: 0.2rem 0.5rem; font-size: 0.72rem; font-weight: 700; border-radius: 6px; background: rgba(59,130,246,0.2); color: #60a5fa;">🚀 Published</span>`;
      }

      tr.innerHTML = `
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #38bdf8;">${p.id || 'POST-101'}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 600;">${p.title || 'Campaign Reel'}</td>
        <td style="padding: 0.75rem 0.5rem;">${p.client || 'Chillox Fast Food'}</td>
        <td style="padding: 0.75rem 0.5rem;"><span style="padding: 0.15rem 0.45rem; background: rgba(255,255,255,0.06); border-radius: 6px; font-size: 0.75rem;">${platformIcon} ${p.platform}</span></td>
        <td style="padding: 0.75rem 0.5rem; font-size: 0.78rem;">${(p.scheduledTime || '').replace('T', ' ').slice(0, 16)}</td>
        <td style="padding: 0.75rem 0.5rem;">${badgeHtml}</td>
        <td style="padding: 0.75rem 0.5rem; text-align: right;">
          <button onclick="approveSocialPost('${p.id}')" style="padding: 0.3rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #34d399; border-radius: 6px; cursor: pointer;">✅ Approve & Schedule</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error loading manager social planner:', err);
  }
}

function filterSocialPlatform(platform) {
  currentSocialFilter = platform;
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    btn.style.color = '#94a3b8';
  });
  if (event && event.target) {
    event.target.style.background = 'rgba(59,130,246,0.2)';
    event.target.style.borderColor = 'rgba(255,255,255,0.15)';
    event.target.style.color = '#60a5fa';
  }
  loadManagerSocialPlanner();
}

function openSocialPostModal() {
  const modal = document.getElementById('managerSocialPostModal');
  if (modal) modal.style.display = 'flex';
}

function closeSocialPostModal() {
  const modal = document.getElementById('managerSocialPostModal');
  if (modal) modal.style.display = 'none';
}

async function submitManagerSocialPost(event) {
  event.preventDefault();
  const title = document.getElementById('postTitleInput').value.trim();
  const client = document.getElementById('postClientSelect').value;
  const platform = document.getElementById('postPlatformSelect').value;
  const caption = document.getElementById('postCaptionInput').value.trim();

  try {
    const res = await managerFetch('/api/social-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        client,
        platform,
        caption,
        author: currentManagerUser?.name || 'Mehedi Hasan (Social Lead)'
      })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`📱 Social media post "${title}" scheduled on ${platform}! Client notified for approval (AUT-016).`, 'success');
      closeSocialPostModal();
      await loadManagerSocialPlanner();
    } else {
      showManagerToast('Error scheduling post: ' + (data.error || 'Check fields'), 'error');
    }
  } catch (err) {
    showManagerToast('Error submitting post: ' + err.message, 'error');
  }
}

async function approveSocialPost(postId) {
  try {
    const res = await managerFetch(`/api/social-posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved & Scheduled' })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Social post ${postId} approved & scheduled for dispatch!`, 'success');
      await loadManagerSocialPlanner();
    }
  } catch (err) {
    showManagerToast('Error approving post: ' + err.message, 'error');
  }
}

/**
 * 10. MANAGER DASHBOARD KPIS (Phase MA8)
 */
async function loadManagerOverviewKPIs() {
  try {
    const dept = currentManagerUser?.department || 'Operations';
    const res = await managerFetch(`/api/manager/kpis?dept=${encodeURIComponent(dept)}`);
    if (!res.ok) return;
    const kpis = await res.json();

    const activeTasksElem = document.getElementById('kpiActiveTasks');
    const teamActiveElem = document.getElementById('kpiTeamActive');
    const pendingApprElem = document.getElementById('kpiPendingApprovals');

    if (activeTasksElem) activeTasksElem.textContent = kpis.totalTasks || '4';
    if (teamActiveElem) teamActiveElem.textContent = `${kpis.crewStatus?.inStudio + kpis.crewStatus?.fieldShoot || 3} / ${kpis.crewStatus?.totalTeam || 4}`;
    if (pendingApprElem) pendingApprElem.textContent = (kpis.pendingLeavesCount + kpis.pendingExpensesCount) || '2';

  } catch (err) {
    console.error('Error loading manager overview KPIs:', err);
  }
}

/**
 * Support Tickets Manager Logic
 */
async function loadManagerTickets() {
  const tbody = document.getElementById('managerTicketsTbody');
  if (!tbody) return;

  try {
    const res = await managerFetch('/api/tickets');
    const tickets = await res.json();

    if (!Array.isArray(tickets) || tickets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No support tickets found.</td></tr>`;
      return;
    }

    tbody.innerHTML = tickets.map(t => {
      let priorityClass = 'badge-cyan';
      if (t.priority === 'High' || t.priority === 'Urgent') priorityClass = 'badge-pink';
      else if (t.priority === 'Low') priorityClass = 'badge-purple';

      let statusClass = 'badge-amber';
      if (t.status === 'Resolved' || t.status === 'Closed') statusClass = 'badge-emerald';
      else if (t.status === 'In Progress') statusClass = 'badge-cyan';

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
          <td style="padding: 0.75rem;"><code>${t.id}</code></td>
          <td style="padding: 0.75rem; font-weight: 600; color: #fff;">${t.title}</td>
          <td style="padding: 0.75rem; color: #cbd5e1;">${t.submittedBy}</td>
          <td style="padding: 0.75rem; color: #94a3b8;">${t.category}</td>
          <td style="padding: 0.75rem;"><span class="badge ${priorityClass}">${t.priority}</span></td>
          <td style="padding: 0.75rem;"><span class="badge ${statusClass}">${t.status}</span></td>
          <td style="padding: 0.75rem; text-align: right;">
            ${t.status !== 'Resolved' ? `
              <button class="btn-purple" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; background: #10b981;" onclick="updateTicketStatus('${t.id}', 'Resolved')">✅ Mark Resolved</button>
            ` : `<span style="font-size: 0.75rem; color: #10b981; font-weight: 700;">✅ Resolved</span>`}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading manager tickets:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load tickets: ${err.message}</td></tr>`;
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    const res = await managerFetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      loadManagerTickets();
    } else {
      alert('Error updating ticket: ' + (data.error || 'Failed'));
    }
  } catch (err) {
    alert('Error updating ticket: ' + err.message);
  }
}

/**
 * 11. Logout Handler
 */
function logoutManager() {
  localStorage.removeItem('gro10x_token');
  sessionStorage.removeItem('gro10x_token');
  sessionStorage.removeItem('currentManagerUser');
  window.location.href = '/auth';
}

function setupManagerSSE() {
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || sessionStorage.getItem('gro10x_token') || '';
    const sseUrl = token ? `/api/events?role=manager&token=${encodeURIComponent(token)}` : '/api/events?role=manager';
    const es = new EventSource(sseUrl);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'task_update' && typeof loadManagerKanban === 'function') loadManagerKanban();
        if (msg.type === 'expense_update' && typeof loadManagerExpenses === 'function') loadManagerExpenses();
        if (msg.type === 'leave_update' && typeof loadManagerHROps === 'function') loadManagerHROps();
        if (msg.type === 'post_update' && typeof loadManagerSocialPlanner === 'function') loadManagerSocialPlanner();
        if (msg.type === 'attendance_update' && typeof loadManagerOverviewKPIs === 'function') loadManagerOverviewKPIs();
        if (msg.type === 'eod_update' && typeof loadManagerOverviewKPIs === 'function') loadManagerOverviewKPIs();
        if (msg.type === 'ticket_update' && typeof loadManagerTickets === 'function') loadManagerTickets();
      } catch (err) {}
    };
    ['task_update', 'expense_update', 'leave_update', 'post_update', 'attendance_update', 'eod_update', 'ticket_update'].forEach(evt => {
      es.addEventListener(evt, () => {
        if (evt === 'task_update' && typeof loadManagerKanban === 'function') loadManagerKanban();
        if (evt === 'expense_update' && typeof loadManagerExpenses === 'function') loadManagerExpenses();
        if (evt === 'leave_update' && typeof loadManagerHROps === 'function') loadManagerHROps();
        if (evt === 'post_update' && typeof loadManagerSocialPlanner === 'function') loadManagerSocialPlanner();
        if (evt === 'attendance_update' && typeof loadManagerOverviewKPIs === 'function') loadManagerOverviewKPIs();
        if (evt === 'eod_update' && typeof loadManagerOverviewKPIs === 'function') loadManagerOverviewKPIs();
        if (evt === 'ticket_update' && typeof loadManagerTickets === 'function') loadManagerTickets();
      });
    });
    es.onerror = () => {
      es.close();
      setTimeout(setupManagerSSE, 5000);
    };
  } catch (err) {}
}

function initManagerNavigation() {
  console.log('🚀 PurpleOS Manager Portal JS Initialized');
  setupManagerSSE();
}

/* -------------------------------------------------------------
 * 📊 Resource Allocation & Workload Controller (Phase 0.6.2/3)
 * ------------------------------------------------------------- */
async function loadManagerWorkload() {
  const container = document.getElementById('teamWorkloadCardsContainer');
  if (!container) return;

  try {
    const res = await managerFetch('/api/team/workload');
    if (!res.ok) throw new Error('Failed to fetch workload data');
    const workloadList = await res.json();

    let totalCapacity = 0;
    let totalAssigned = 0;
    let totalFree = 0;
    let overloadedCount = 0;

    container.innerHTML = '';

    if (!workloadList || workloadList.length === 0) {
      container.innerHTML = '<div style="font-size:0.85rem; color:#64748b; padding:1rem;">No team capacity data available.</div>';
      return;
    }

    workloadList.forEach(member => {
      totalCapacity += member.weeklyCapacityHours;
      totalAssigned += member.assignedHours;
      totalFree += member.availableCapacityHours;
      if (member.status === 'Overloaded') overloadedCount++;

      const barColor = member.status === 'Overloaded' ? '#ef4444' : (member.status === 'Balanced' ? '#f59e0b' : '#10b981');
      const badgeBg = member.status === 'Overloaded' ? 'rgba(239,68,68,0.2)' : (member.status === 'Balanced' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)');

      const card = document.createElement('div');
      card.style.cssText = 'background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.1rem;';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #f8fafc;">${member.name}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">${member.role} • <span style="color:#60a5fa;">${member.department}</span></div>
          </div>
          <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 12px; background: ${badgeBg}; color: ${barColor};">
            ${member.status === 'Overloaded' ? '🔴 Overloaded' : (member.status === 'Balanced' ? '🟡 Balanced' : '🟢 Available')}
          </span>
        </div>

        <div style="margin-bottom: 0.6rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #cbd5e1; margin-bottom: 0.3rem;">
            <span>Assigned Load (${member.activeTasksCount} active tasks)</span>
            <span style="font-weight: 700;">${member.assignedHours} / ${member.weeklyCapacityHours} hrs (${member.workloadPercent}%)</span>
          </div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(100, member.workloadPercent)}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.05);">
          <span>⏱️ Logged: ${member.loggedHours} hrs</span>
          <span>💡 Free Capacity: ${member.availableCapacityHours} hrs</span>
        </div>
      `;
      container.appendChild(card);
    });

    const capEl = document.getElementById('workloadTotalCapacity');
    const assEl = document.getElementById('workloadAssignedHours');
    const freeEl = document.getElementById('workloadFreeHours');
    const overEl = document.getElementById('workloadOverloadedCount');

    if (capEl) capEl.textContent = `${totalCapacity} hrs/wk`;
    if (assEl) assEl.textContent = `${totalAssigned} hrs`;
    if (freeEl) freeEl.textContent = `${totalFree} hrs`;
    if (overEl) overEl.textContent = `${overloadedCount} Members`;
  } catch (err) {
    console.error('Error loading workload:', err);
  }
}

async function suggestBestMatchAssignee() {
  const estInput = document.getElementById('taskEstimatedHoursInput');
  const estHours = estInput ? estInput.value : 0;
  const userDept = currentManagerUser?.department || 'Production';

  try {
    const res = await managerFetch(`/api/team/best-match?department=${encodeURIComponent(userDept)}&estimatedHours=${estHours}`);
    const data = await res.json();
    if (data.bestMatch) {
      const assigneeSelect = document.getElementById('taskAssigneeSelect');
      if (assigneeSelect) {
        let matchedOpt = false;
        for (let opt of assigneeSelect.options) {
          if (opt.value.toLowerCase().includes(data.bestMatch.name.toLowerCase()) || data.bestMatch.name.toLowerCase().includes(opt.value.toLowerCase())) {
            opt.selected = true;
            matchedOpt = true;
            break;
          }
        }
        if (!matchedOpt && assigneeSelect.options.length > 0) {
          assigneeSelect.options[0].selected = true;
        }
      }
      showManagerToast(`🎯 Best Match: ${data.bestMatch.name} (${data.bestMatch.freeHours} hrs free capacity)`, 'info');
    }
  } catch (err) {
    showManagerToast('Error calculating best match: ' + err.message, 'error');
  }
}

/* -------------------------------------------------------------
 * ⚙️ Custom Fields Management Controller (Phase 0.6.4/5)
 * ------------------------------------------------------------- */
async function loadManagerCustomFields() {
  try {
    const res = await managerFetch('/api/custom-fields');
    if (!res.ok) return;
    managerCustomFields = await res.json();
    renderTaskModalCustomFields();
    populateManageCustomFieldsModalList();
  } catch (e) {
    console.error('Error loading custom fields:', e);
  }
}

function renderTaskModalCustomFields() {
  const container = document.getElementById('taskCustomFieldsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!managerCustomFields || managerCustomFields.length === 0) return;

  managerCustomFields.forEach(field => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 0.2rem;';
    const label = `<label style="font-size: 0.78rem; font-weight: 600; color: #cbd5e1;">${field.name}</label>`;

    let inputHtml = '';
    if (field.fieldType === 'dropdown') {
      const opts = field.options || [];
      const optsHtml = opts.map(o => `<option value="${o}">${o}</option>`).join('');
      inputHtml = `<select class="task-cf-input form-input" data-field-id="${field.id}" style="width: 100%; padding: 0.45rem; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.82rem;"><option value="">Select ${field.name}...</option>${optsHtml}</select>`;
    } else if (field.fieldType === 'number') {
      inputHtml = `<input type="number" step="any" class="task-cf-input form-input" data-field-id="${field.id}" placeholder="Enter ${field.name}" style="width: 100%; padding: 0.45rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.82rem;">`;
    } else if (field.fieldType === 'date') {
      inputHtml = `<input type="date" class="task-cf-input form-input" data-field-id="${field.id}" style="width: 100%; padding: 0.45rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.82rem;">`;
    } else {
      inputHtml = `<input type="text" class="task-cf-input form-input" data-field-id="${field.id}" placeholder="Enter ${field.name}" style="width: 100%; padding: 0.45rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.82rem;">`;
    }

    fieldWrapper.innerHTML = label + inputHtml;
    container.appendChild(fieldWrapper);
  });
}

function openManageCustomFieldsModal() {
  const modal = document.getElementById('managerCustomFieldsModal');
  if (modal) {
    modal.style.display = 'flex';
    populateManageCustomFieldsModalList();
  }
}

function closeManageCustomFieldsModal() {
  const modal = document.getElementById('managerCustomFieldsModal');
  if (modal) modal.style.display = 'none';
}

function onCFTypeChange() {
  const typeSelect = document.getElementById('newCFTypeSelect');
  const optsGroup = document.getElementById('cfOptionsGroup');
  if (typeSelect && optsGroup) {
    optsGroup.style.display = typeSelect.value === 'dropdown' ? 'block' : 'none';
  }
}

function populateManageCustomFieldsModalList() {
  const container = document.getElementById('customFieldsListContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!managerCustomFields || managerCustomFields.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem; color:#64748b; padding:0.5rem;">No custom fields created yet.</div>';
    return;
  }
  managerCustomFields.forEach(field => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.65rem; background: rgba(255,255,255,0.04); border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.06);';
    item.innerHTML = `
      <div>
        <span style="font-weight: 600; color: #f8fafc;">${field.name}</span>
        <span style="font-size: 0.7rem; padding: 0.1rem 0.4rem; background: rgba(59,130,246,0.15); color: #60a5fa; border-radius: 4px; margin-left: 0.4rem;">${field.fieldType}</span>
      </div>
      <button onclick="deleteCustomField('${field.id}')" style="background: transparent; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer;">🗑️ Delete</button>
    `;
    container.appendChild(item);
  });
}

async function submitCreateCustomField(event) {
  event.preventDefault();
  const nameInput = document.getElementById('newCFNameInput');
  const typeSelect = document.getElementById('newCFTypeSelect');
  const optsInput = document.getElementById('newCFOptionsInput');

  if (!nameInput || !nameInput.value.trim()) return;

  const fieldType = typeSelect ? typeSelect.value : 'text';
  let options = [];
  if (fieldType === 'dropdown' && optsInput && optsInput.value.trim()) {
    options = optsInput.value.split(',').map(s => s.trim()).filter(Boolean);
  }

  try {
    const res = await managerFetch('/api/custom-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value.trim(), fieldType, options })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Custom field "${nameInput.value}" created!`, 'success');
      nameInput.value = '';
      if (optsInput) optsInput.value = '';
      await loadManagerCustomFields();
    } else {
      showManagerToast('Error creating field: ' + (data.error || 'Check input'), 'error');
    }
  } catch (err) {
    showManagerToast('Error creating custom field: ' + err.message, 'error');
  }
}

async function deleteCustomField(fieldId) {
  if (!confirm('Are you sure you want to delete this custom field?')) return;
  try {
    const res = await managerFetch(`/api/custom-fields/${fieldId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showManagerToast('🗑️ Custom field deleted', 'success');
      await loadManagerCustomFields();
    }
  } catch (err) {
    showManagerToast('Error deleting field: ' + err.message, 'error');
  }
}

/* -------------------------------------------------------------
 * 📋 Task Templates Controller (Phase 0.6.6 - 0.6.9)
 * ------------------------------------------------------------- */
async function loadManagerTaskTemplates() {
  try {
    const res = await managerFetch('/api/task-templates');
    if (!res.ok) return;
    managerTaskTemplates = await res.json();
    populateTaskModalTemplates();
    populateManageTaskTemplatesModalList();
  } catch (e) {
    console.error('Error loading task templates:', e);
  }
}

function populateTaskModalTemplates() {
  const select = document.getElementById('taskTemplateSelect');
  if (!select) return;
  select.innerHTML = '<option value="">📋 Select a Workflow Blueprint to pre-fill...</option>';
  managerTaskTemplates.forEach(tmpl => {
    const opt = document.createElement('option');
    opt.value = tmpl.id;
    opt.textContent = `📋 ${tmpl.name} (${tmpl.department} - ${tmpl.estimatedHours}h)`;
    select.appendChild(opt);
  });
}

function onApplyTaskTemplate() {
  const select = document.getElementById('taskTemplateSelect');
  if (!select || !select.value) return;

  const tmpl = managerTaskTemplates.find(t => t.id === select.value);
  if (!tmpl) return;

  const titleInput = document.getElementById('taskTitleInput');
  const estInput = document.getElementById('taskEstimatedHoursInput');
  const prioritySelect = document.getElementById('taskPrioritySelect');

  if (titleInput && !titleInput.value) titleInput.value = tmpl.name;
  if (estInput) estInput.value = tmpl.estimatedHours;
  if (prioritySelect) prioritySelect.value = tmpl.priority || 'Medium';

  showManagerToast(`📋 Loaded template: "${tmpl.name}" (${(tmpl.subtasks || []).length} subtasks ready)`, 'info');
}

function openManageTaskTemplatesModal() {
  const modal = document.getElementById('managerTaskTemplatesModal');
  if (modal) {
    modal.style.display = 'flex';
    populateManageTaskTemplatesModalList();
  }
}

function closeManageTaskTemplatesModal() {
  const modal = document.getElementById('managerTaskTemplatesModal');
  if (modal) modal.style.display = 'none';
}

function populateManageTaskTemplatesModalList() {
  const container = document.getElementById('templatesListContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!managerTaskTemplates || managerTaskTemplates.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem; color:#64748b; padding:0.5rem;">No templates created yet.</div>';
    return;
  }
  managerTaskTemplates.forEach(tmpl => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.65rem; background: rgba(255,255,255,0.04); border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.06);';
    item.innerHTML = `
      <div>
        <span style="font-weight: 600; color: #f8fafc;">${tmpl.name}</span>
        <span style="font-size: 0.7rem; padding: 0.1rem 0.4rem; background: rgba(59,130,246,0.15); color: #60a5fa; border-radius: 4px; margin-left: 0.4rem;">${tmpl.department} • ${tmpl.estimatedHours}h</span>
      </div>
      <button onclick="deleteTaskTemplate('${tmpl.id}')" style="background: transparent; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer;">🗑️ Delete</button>
    `;
    container.appendChild(item);
  });
}

async function submitCreateTaskTemplate(event) {
  event.preventDefault();
  const nameInput = document.getElementById('newTmplNameInput');
  const deptSelect = document.getElementById('newTmplDeptSelect');
  const subtasksInput = document.getElementById('newTmplSubtasksInput');
  const estInput = document.getElementById('newTmplEstHoursInput');
  const prioritySelect = document.getElementById('newTmplPrioritySelect');

  if (!nameInput || !nameInput.value.trim()) return;

  const subtasks = subtasksInput && subtasksInput.value.trim()
    ? subtasksInput.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  try {
    const res = await managerFetch('/api/task-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        department: deptSelect ? deptSelect.value : 'Production',
        subtasks,
        estimatedHours: estInput ? estInput.value : 8.0,
        priority: prioritySelect ? prioritySelect.value : 'Medium'
      })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`✅ Workflow Blueprint "${nameInput.value}" saved!`, 'success');
      nameInput.value = '';
      if (subtasksInput) subtasksInput.value = '';
      await loadManagerTaskTemplates();
    } else {
      showManagerToast('Error creating template: ' + (data.error || 'Check input'), 'error');
    }
  } catch (err) {
    showManagerToast('Error creating template: ' + err.message, 'error');
  }
}

async function deleteTaskTemplate(templateId) {
  if (!confirm('Are you sure you want to delete this template?')) return;
  try {
    const res = await managerFetch(`/api/task-templates/${templateId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showManagerToast('🗑️ Template deleted', 'success');
      await loadManagerTaskTemplates();
    }
  } catch (err) {
    showManagerToast('Error deleting template: ' + err.message, 'error');
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 12. CLIENT CRM TAB CONTROLLER (Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function loadManagerCRM() {
  try {
    const res = await managerFetch('/api/clients');
    if (!res.ok) throw new Error('Failed to fetch clients');
    const clients = await res.json();
    managerClients = clients;

    const totalEl = document.getElementById('crmTotalClients');
    if (totalEl) totalEl.innerText = clients.length;

    const tbody = document.getElementById('managerCrmTableBody');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #94a3b8;">No client accounts found.</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0;">
        <td style="padding: 0.75rem 0.5rem;">
          <div style="font-weight: 700; color: #fff;">${c.name}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">${c.category || 'General Partner'}</div>
        </td>
        <td style="padding: 0.75rem 0.5rem;">
          <div>${c.contactPerson || c.contact_person || 'Brand Lead'}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">${c.email || 'No email registered'}</div>
        </td>
        <td style="padding: 0.75rem 0.5rem; font-family: monospace; font-size: 0.8rem; color: #38bdf8;">
          ${c.phone || c.whatsapp || '+880 1700-000000'}
        </td>
        <td style="padding: 0.75rem 0.5rem;">
          <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(52,211,153,0.15); color: #34d399; font-weight: 700;">
            ${c.status || 'Active Retainer'}
          </span>
        </td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; color: #f472b6;">
          ${c.totalSpent || c.total_spent || '৳0'}
        </td>
        <td style="padding: 0.75rem 0.5rem; text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            ${c.phone ? `<a href="tel:${c.phone}" style="padding: 0.3rem 0.6rem; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; color: #60a5fa; font-size: 0.75rem; text-decoration: none;">📞 Call</a>` : ''}
            ${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="padding: 0.3rem 0.6rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; color: #34d399; font-size: 0.75rem; text-decoration: none;">💬 WhatsApp</a>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('CRM load error:', err.message);
    const tbody = document.getElementById('managerCrmTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #f87171;">Error loading CRM: ${err.message}</td></tr>`;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 13. ASSET REGISTRY TAB CONTROLLER (Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function loadManagerAssets() {
  try {
    const res = await managerFetch('/api/assets');
    if (!res.ok) throw new Error('Failed to fetch assets');
    const assets = await res.json();

    const totalEl = document.getElementById('assetsTotalCount');
    const vaultEl = document.getElementById('assetsInVaultCount');
    const fieldEl = document.getElementById('assetsInFieldCount');

    if (totalEl) totalEl.innerText = assets.length;
    if (vaultEl) vaultEl.innerText = assets.filter(a => a.condition !== 'In Use' && a.assignedTo === 'Unassigned').length;
    if (fieldEl) fieldEl.innerText = assets.filter(a => a.condition === 'In Use' || a.assignedTo !== 'Unassigned').length;

    const tbody = document.getElementById('managerAssetsTableBody');
    if (!tbody) return;

    if (!assets || assets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #94a3b8;">No equipment assets registered.</td></tr>';
      return;
    }

    tbody.innerHTML = assets.map(a => {
      const isInField = a.condition === 'In Use' || (a.assignedTo && a.assignedTo !== 'Unassigned');
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0;">
          <td style="padding: 0.75rem 0.5rem; font-family: monospace; font-size: 0.8rem; color: #a78bfa; font-weight: 700;">
            ${a.id}
          </td>
          <td style="padding: 0.75rem 0.5rem;">
            <div style="font-weight: 700; color: #fff;">${a.name}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">SN: ${a.serial || 'N/A'}</div>
          </td>
          <td style="padding: 0.75rem 0.5rem; color: #94a3b8;">
            ${a.category || 'Production Gear'}
          </td>
          <td style="padding: 0.75rem 0.5rem;">
            <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px; background: ${isInField ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)'}; color: ${isInField ? '#fbbf24' : '#34d399'}; font-weight: 700;">
              ${a.condition || 'Good'}
            </span>
          </td>
          <td style="padding: 0.75rem 0.5rem;">
            ${a.assignedTo || 'Unassigned'}
          </td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">
            ${isInField
              ? `<button onclick="toggleAssetCheckin('${a.id}')" style="padding: 0.35rem 0.75rem; border-radius: 8px; background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #34d399; font-size: 0.78rem; font-weight: 600; cursor: pointer;">📥 Return to Vault</button>`
              : `<button onclick="openAssetCheckoutModal('${a.id}')" style="padding: 0.35rem 0.75rem; border-radius: 8px; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #60a5fa; font-size: 0.78rem; font-weight: 600; cursor: pointer;">📤 Check Out</button>`
            }
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Assets load error:', err.message);
    const tbody = document.getElementById('managerAssetsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #f87171;">Error loading assets: ${err.message}</td></tr>`;
  }
}

async function toggleAssetCheckin(assetId) {
  try {
    const res = await managerFetch(`/api/assets/${assetId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`📥 Equipment ${assetId} returned to vault`, 'success');
      loadManagerAssets();
    } else {
      showManagerToast(data.error || 'Failed to check in equipment', 'error');
    }
  } catch (err) {
    showManagerToast('Check-in error: ' + err.message, 'error');
  }
}

async function openAssetCheckoutModal(assetId) {
  const borrower = prompt('Enter staff member name to check out to:', 'Farhan Ahmed');
  if (!borrower) return;
  try {
    const res = await managerFetch(`/api/assets/${assetId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrower })
    });
    const data = await res.json();
    if (data.success) {
      showManagerToast(`📤 Equipment ${assetId} checked out to ${borrower}`, 'success');
      loadManagerAssets();
    } else {
      showManagerToast(data.error || 'Failed to check out equipment', 'error');
    }
  } catch (err) {
    showManagerToast('Checkout error: ' + err.message, 'error');
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 14. CHAT HUB CONTROLLER (Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 */
let activeChatRecipient = null;

async function loadManagerChat() {
  try {
    const channelsBox = document.getElementById('managerChatChannels');
    if (!channelsBox) return;

    if (!managerClients || managerClients.length === 0) {
      const res = await managerFetch('/api/clients');
      if (res.ok) managerClients = await res.json();
    }

    if (!managerClients || managerClients.length === 0) {
      channelsBox.innerHTML = '<div style="color: #64748b; font-size: 0.8rem;">No active client channels.</div>';
      return;
    }

    channelsBox.innerHTML = managerClients.map((c, idx) => `
      <div onclick="selectManagerChatClient('${c.name}')" style="padding: 0.6rem; border-radius: 8px; background: ${activeChatRecipient === c.name ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${activeChatRecipient === c.name ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.85rem;">${c.name}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">${c.contactPerson || 'Client Lead'}</div>
        </div>
        <span style="font-size: 0.7rem; color: #34d399;">🟢</span>
      </div>
    `).join('');

    if (!activeChatRecipient && managerClients.length > 0) {
      selectManagerChatClient(managerClients[0].name);
    }
  } catch (err) {
    console.error('Chat load error:', err.message);
  }
}

function selectManagerChatClient(clientName) {
  activeChatRecipient = clientName;
  const header = document.getElementById('managerChatHeader');
  if (header) header.innerHTML = `💬 Dialogue with <strong>${clientName}</strong>`;

  const messagesBox = document.getElementById('managerChatMessages');
  if (messagesBox) {
    messagesBox.innerHTML = `
      <div style="align-self: flex-start; max-width: 80%; background: rgba(255,255,255,0.06); padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">${clientName} (via Telegram)</div>
        <div style="color: #e2e8f0; font-size: 0.85rem;">Hi GRO10X team! Just checking in on the latest campaign deliverables.</div>
      </div>
      <div style="align-self: flex-end; max-width: 80%; background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 0.75rem 1rem; border-radius: 12px; color: #fff;">
        <div style="font-size: 0.72rem; color: #bfdbfe; margin-bottom: 0.2rem;">You (Manager)</div>
        <div style="font-size: 0.85rem;">Hello! The latest cut has been uploaded to your Review Room portal. Let us know if you'd like any revisions!</div>
      </div>
    `;
  }
}

async function sendManagerChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById('managerChatInput');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  const messagesBox = document.getElementById('managerChatMessages');
  if (messagesBox) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'align-self: flex-end; max-width: 80%; background: linear-gradient(135deg, #00df89, #06b6d4); padding: 0.75rem 1rem; border-radius: 12px; color: #070b12; font-weight:600;';
    msgDiv.innerHTML = `
      <div style="font-size: 0.72rem; color: #042f2e; margin-bottom: 0.2rem; font-weight:800;">You (Manager)</div>
      <div style="font-size: 0.85rem;">${text}</div>
    `;
    messagesBox.appendChild(msgDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  try {
    await managerFetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: text, mode: 'team' })
    });
  } catch (err) {}
}

/* -------------------------------------------------------------
 * 🔍 Manager Universal Search & Command Palette (Ctrl+K)
 * ------------------------------------------------------------- */
function toggleCommandCenter() {
  let modal = document.getElementById('managerCmdModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'managerCmdModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(8px); z-index:99999; display:flex; justify-content:center; align-items:flex-start; padding-top:12vh;';
    modal.innerHTML = `
      <div style="background:#0f172a; border:1px solid rgba(0,223,137,0.3); border-radius:18px; width:92%; max-width:540px; box-shadow:0 24px 60px rgba(0,0,0,0.8); overflow:hidden;">
        <div style="display:flex; align-items:center; padding:0.85rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); gap:0.75rem;">
          <span style="font-size:1.2rem; color:#00df89;">⚡</span>
          <input type="text" id="mgrCmdInput" placeholder="Search tasks, clients, team members, or jump to tab..." style="flex:1; background:transparent; border:none; color:#fff; font-size:0.95rem; outline:none;" oninput="filterManagerCmdResults(this.value)">
          <kbd style="font-size:0.7rem; background:rgba(255,255,255,0.08); padding:0.2rem 0.5rem; border-radius:6px; color:#94a3b8;">ESC</kbd>
        </div>
        <div id="mgrCmdResults" style="max-height:300px; overflow-y:auto; padding:0.5rem;">
          <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('kanban'); closeManagerCmdModal();">
            <span>📋 Project Sprint Kanban</span>
            <span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
          </div>
          <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('crm'); closeManagerCmdModal();">
            <span>👥 Client Accounts & Retainers</span>
            <span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
          </div>
          <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('hrops'); closeManagerCmdModal();">
            <span>🧑‍💼 Specialist Roster & Attendance</span>
            <span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
          </div>
          <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('reviewroom'); closeManagerCmdModal();">
            <span>🎬 AI Deliverables Review Room</span>
            <span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
          </div>
        </div>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeManagerCmdModal();
    });
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
  const input = document.getElementById('mgrCmdInput');
  if (input) { input.value = ''; input.focus(); }
}

function closeManagerCmdModal() {
  const modal = document.getElementById('managerCmdModal');
  if (modal) modal.style.display = 'none';
}

function filterManagerCmdResults(query) {
  const q = (query || '').toLowerCase().trim();
  const resultsBox = document.getElementById('mgrCmdResults');
  if (!resultsBox) return;
  if (!q) {
    resultsBox.innerHTML = `
      <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('kanban'); closeManagerCmdModal();">
        <span>📋 Project Sprint Kanban</span><span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
      </div>
      <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('crm'); closeManagerCmdModal();">
        <span>👥 Client Accounts & Retainers</span><span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
      </div>
      <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('hrops'); closeManagerCmdModal();">
        <span>🧑‍💼 Specialist Roster & Attendance</span><span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
      </div>
      <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between;" onclick="switchTab('reviewroom'); closeManagerCmdModal();">
        <span>🎬 AI Deliverables Review Room</span><span style="color:#00df89; font-size:0.75rem;">Jump ➔</span>
      </div>
    `;
    return;
  }
  const filteredTasks = (currentKanbanTasks || []).filter(t => (t.title || '').toLowerCase().includes(q) || (t.client || '').toLowerCase().includes(q));
  resultsBox.innerHTML = filteredTasks.length ? filteredTasks.map(t => `
    <div style="padding:0.6rem 0.85rem; border-radius:8px; cursor:pointer; color:#f8fafc; font-size:0.85rem; display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05);" onclick="switchTab('kanban'); closeManagerCmdModal();">
      <span>📌 ${t.title || 'Task'} <small style="color:#94a3b8;">(${t.client || 'Client'})</small></span>
      <span style="color:#00df89; font-size:0.75rem;">${t.stage || 'Backlog'}</span>
    </div>
  `).join('') : `<div style="text-align:center; padding:1.5rem; color:#64748b; font-size:0.85rem;">No results found for "${query}"</div>`;
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    toggleCommandCenter();
  } else if (e.key === 'Escape') {
    closeManagerCmdModal();
  }
});

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar-nav');
  const backdrop = document.getElementById('adminNavBackdrop');
  if (sidebar) sidebar.classList.toggle('is-open');
  if (backdrop) backdrop.style.display = backdrop.style.display === 'block' ? 'none' : 'block';
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar-nav');
  const backdrop = document.getElementById('adminNavBackdrop');
  if (sidebar) sidebar.classList.remove('is-open');
  if (backdrop) backdrop.style.display = 'none';
}

// Explicit Window Method Attachments
window.getManagerToken = getManagerToken;
window.managerFetch = managerFetch;
window.switchTab = switchTab;
window.checkManagerAuth = checkManagerAuth;
window.loadManagerMetadata = loadManagerMetadata;
window.loadManagerOverviewKPIs = loadManagerOverviewKPIs;
window.loadManagerTasks = loadManagerTasks;
window.openManagerTaskModal = openManagerTaskModal;
window.closeManagerTaskModal = closeManagerTaskModal;
window.submitManagerTask = submitManagerTask;
window.openManageLabelsModal = openManageLabelsModal;
window.closeManageLabelsModal = closeManageLabelsModal;
window.openTaskTemplatesModal = openTaskTemplatesModal;
window.closeTaskTemplatesModal = closeTaskTemplatesModal;
window.openCustomFieldsModal = openCustomFieldsModal;
window.closeCustomFieldsModal = closeCustomFieldsModal;
window.approveLeaveManager = approveLeaveManager;
window.rejectLeaveManager = rejectLeaveManager;
window.approveExpenseT1 = approveExpenseT1;
window.approveExpenseT2 = approveExpenseT2;
window.updateTicketStatus = updateTicketStatus;
window.loadManagerTickets = loadManagerTickets;
window.loadManagerExpenses = loadManagerExpenses;
window.loadManagerWorkload = loadManagerWorkload;
window.setupManagerSSE = setupManagerSSE;
window.showManagerToast = showManagerToast;
window.toggleCommandCenter = toggleCommandCenter;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;


