/**
 * 🟣 PURPLEOS MANAGER PORTAL CONTROLLER (manager.js)
 * Phase MA1 & MA2 — Manager RBAC & Kanban Task Management Hub
 */

let currentManagerUser = null;
let currentKanbanTasks = [];
let kanbanDeptFilterMode = 'my'; // 'my' vs 'all'

document.addEventListener('DOMContentLoaded', async () => {
  await checkManagerAuth();
  initManagerNavigation();
});

/**
 * 1. Authentication & Role Gate Check for /manager
 */
async function checkManagerAuth() {
  try {
    const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
    
    // Attempt session verification from API
    const res = await fetch('/api/auth/me', {
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

/**
 * 4. Tab Switcher Function
 */
function switchTab(tabId) {
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
  }

  console.log(`📌 Manager Portal: Switched to tab '${tabId}'`);
}

/**
 * 5. KANBAN MANAGEMENT (Phase MA2)
 */

async function loadManagerKanban() {
  try {
    const res = await fetch('/api/tasks');
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

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <span style="font-size: 0.72rem; padding: 0.1rem 0.4rem; background: rgba(255,255,255,0.06); border-radius: 6px; color: #94a3b8; font-weight: 600;">${task.client || 'Agency Client'}</span>
          <span style="font-size: 0.68rem; font-weight: 700; color: ${priorityColor};">● ${task.priority || 'Normal'}</span>
        </div>
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

  // Update counts
  Object.keys(counts).forEach(k => {
    const badge = document.getElementById(`count-${k}`);
    if (badge) badge.textContent = counts[k];
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
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
    const data = await res.json();
    if (data.success) {
      if (newStage === 'Editing') {
        alert('🎬 Task advanced to Editing — Telegram notification sent to assigned editor (AUT-001)!');
      } else if (newStage === 'Client Review') {
        alert('👁️ Task advanced to Client Review — Telegram push sent to client with Review Room link (AUT-004)!');
      }
      await loadManagerKanban();
    }
  } catch (err) {
    alert('Error updating task stage: ' + err.message);
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
    fetch('/api/team')
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

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, client, priority, assignee, dueDate })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Production task "${title}" created successfully!`);
      closeManagerTaskModal();
      await loadManagerKanban();
    } else {
      alert('Error creating task: ' + (data.error || 'Check fields'));
    }
  } catch (err) {
    alert('Error submitting task: ' + err.message);
  }
}

/**
 * 6. EXPENSE 3-TIER APPROVALS (Phase MA3)
 */
async function loadManagerExpenses() {
  const tbody = document.getElementById('managerExpenseTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/expenses');
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
    const res = await fetch(`/api/expenses/${expId}/approve-tier1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Line Manager' })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Tier 1 Approved for ${expId}! Status updated to Tier 2 Pending — Finance Lead Roksana notified via Telegram (AUT-008).`);
      await loadManagerExpenses();
    }
  } catch (err) {
    alert('Error approving Tier 1: ' + err.message);
  }
}

async function approveExpenseT2(expId) {
  try {
    const res = await fetch(`/api/expenses/${expId}/approve-tier2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Roksana Islam (Finance Lead)' })
    });
    const data = await res.json();
    if (data.success) {
      alert(`💰 Tier 2 Verified for ${expId}! Status updated to Tier 3 Pending — Owner notified for final disbursement (AUT-009).`);
      await loadManagerExpenses();
    }
  } catch (err) {
    alert('Error verifying Tier 2: ' + err.message);
  }
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
      const res = await fetch('/api/leaves');
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
      const res = await fetch('/api/eod');
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
    const res = await fetch(`/api/leaves/${leaveId}/manager-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentManagerUser?.name || 'Line Manager' })
    });
    const data = await res.json();
    if (data.success) {
      alert(`🌴 Leave Request ${leaveId} Manager Approved! Status set to Manager Approved — Forwarded to Owner for final sign-off.`);
      await loadManagerHROps();
    }
  } catch (err) {
    alert('Error approving leave: ' + err.message);
  }
}

async function rejectLeaveManager(leaveId) {
  const reason = prompt('Enter rejection reason note for staff:', 'Operational schedule conflict');
  if (!reason) return;

  try {
    const res = await fetch(`/api/leaves/${leaveId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy: currentManagerUser?.name || 'Line Manager', reason })
    });
    const data = await res.json();
    if (data.success) {
      alert(`❌ Leave Request ${leaveId} Rejected — Staff member notified.`);
      await loadManagerHROps();
    }
  } catch (err) {
    alert('Error rejecting leave: ' + err.message);
  }
}

/**
 * 8. REVIEW ROOM V2 & CUT DELIVERABLES (Phase MA6)
 */
async function loadManagerReviewRoom() {
  const tbody = document.getElementById('managerReviewTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/reviews');
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
    const res = await fetch('/api/reviews', {
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
      alert(`🎬 Video cut deliverable "${title}" (${version}) uploaded successfully! Client notified via Telegram (AUT-004).`);
      closeUploadCutModal();
      await loadManagerReviewRoom();
    } else {
      alert('Error uploading cut: ' + (data.error || 'Check fields'));
    }
  } catch (err) {
    alert('Error submitting review cut: ' + err.message);
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
    const res = await fetch('/api/social-posts');
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
    const res = await fetch('/api/social-posts', {
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
      alert(`📱 Social media post "${title}" scheduled on ${platform}! Client notified for approval (AUT-016).`);
      closeSocialPostModal();
      await loadManagerSocialPlanner();
    } else {
      alert('Error scheduling post: ' + (data.error || 'Check fields'));
    }
  } catch (err) {
    alert('Error submitting post: ' + err.message);
  }
}

async function approveSocialPost(postId) {
  try {
    const res = await fetch(`/api/social-posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved & Scheduled' })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Social post ${postId} approved & scheduled for dispatch!`);
      await loadManagerSocialPlanner();
    }
  } catch (err) {
    alert('Error approving post: ' + err.message);
  }
}

/**
 * 10. MANAGER DASHBOARD KPIS (Phase MA8)
 */
async function loadManagerOverviewKPIs() {
  try {
    const dept = currentManagerUser?.department || 'Operations';
    const res = await fetch(`/api/manager/kpis?dept=${encodeURIComponent(dept)}`);
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
 * 11. Logout Handler
 */
function logoutManager() {
  localStorage.removeItem('sb-access-token');
  sessionStorage.removeItem('sb-access-token');
  sessionStorage.removeItem('currentManagerUser');
  window.location.href = '/auth';
}

function initManagerNavigation() {
  console.log('🚀 PurpleOS Manager Portal JS Initialized');
}
