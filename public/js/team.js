// 👥 PURPLEBOT CREW OPERATIONS PORTAL JS

let currentCrewEmpCode = 'EMP-002';
let crewStaffList = [];
let crewTasks = [];
let crewAttendance = [];
let crewAssets = [];

/* -------------------------------------------------------------
 * 🔔 Team Portal Toast Notification System
 * ------------------------------------------------------------- */
function showTeamToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('teamToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'teamToastContainer';
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

document.addEventListener('DOMContentLoaded', () => {
  initCrewPortal();
});

let authUser = null;

async function initCrewPortal() {
  try {
    // 1. Fetch Authenticated User Session
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        authUser = authData.user;
      }
    } catch (e) {
      console.warn('Auth check fallback:', e.message);
    }

    const [dbRes, teamRes, taskRes, attRes, assetRes] = await Promise.all([
      fetch('/api/db').catch(() => null),
      fetch('/api/team').catch(() => null),
      fetch('/api/tasks').catch(() => null),
      fetch('/api/team/attendance').catch(() => null),
      fetch('/api/assets').catch(() => null)
    ]);

    if (teamRes && teamRes.ok) crewStaffList = await teamRes.json();
    if (taskRes && taskRes.ok) crewTasks = await taskRes.json();
    if (attRes && attRes.ok) crewAttendance = await attRes.json();
    if (assetRes && assetRes.ok) crewAssets = await assetRes.json();

    if (!crewStaffList || !crewStaffList.length) {
      const db = dbRes && dbRes.ok ? await dbRes.json() : {};
      crewStaffList = db.team || [
        { id: 'EMP-001', emp_code: 'EMP-001', name: 'Mahmudul Hasan', role: 'Agency Founder & Director', baseSalary: 120000, earnedCommissions: 25000 },
        { id: 'EMP-002', emp_code: 'EMP-002', name: 'Farhan Ahmed', role: 'Lead Director & Cinematographer', baseSalary: 65000, earnedCommissions: 12500 },
        { id: 'EMP-003', emp_code: 'EMP-003', name: 'Raihan Kabir', role: 'Senior Video Editor & Colorist', baseSalary: 55000, earnedCommissions: 8000 },
        { id: 'EMP-004', emp_code: 'EMP-004', name: 'Nusrat Jahan', role: 'Social Media & Motion Designer', baseSalary: 48000, earnedCommissions: 5000 }
      ];
    }

    // 2. Lock profile to authenticated user if not Admin/Owner/Manager
    const isAdminUser = authUser && (
      authUser.accessLevel === 'Owner / Admin' ||
      authUser.accessLevel === 'Manager / Director' ||
      authUser.role === 'Agency Owner' ||
      authUser.role === 'Admin'
    );

    if (authUser) {
      const matchedEmp = crewStaffList.find(e =>
        e.id === authUser.linkedId ||
        e.emp_code === authUser.linkedId ||
        e.id === authUser.id ||
        (e.email && authUser.email && e.email.toLowerCase() === authUser.email.toLowerCase())
      );
      if (matchedEmp) {
        currentCrewEmpCode = matchedEmp.emp_code || matchedEmp.id;
      }
    }

    // Populate Staff Selector
    const select = document.getElementById('teamStaffSelect');
    if (select) {
      select.innerHTML = crewStaffList.map(e => `
        <option value="${e.emp_code || e.id}" ${ (e.emp_code || e.id) === currentCrewEmpCode ? 'selected' : '' }>
          👤 ${e.name} (${e.emp_code || e.id})
        </option>
      `).join('');

      if (!isAdminUser) {
        select.disabled = true;
        select.title = '🔒 Profile switching is locked to your authenticated identity';
        select.style.opacity = '0.75';
        select.style.cursor = 'not-allowed';
      }
    }

    renderCrewView();
  } catch (err) {
    console.error('Error initializing crew portal:', err);
  }
}

function switchTeamProfile(empCode) {
  const isAdminUser = authUser && (
    authUser.accessLevel === 'Owner / Admin' ||
    authUser.accessLevel === 'Manager / Director' ||
    authUser.role === 'Agency Owner' ||
    authUser.role === 'Admin'
  );

  if (!isAdminUser && authUser) {
    showTeamToast('🔒 Profile switching is restricted to Administrators', 'error');
    const select = document.getElementById('teamStaffSelect');
    if (select) select.value = currentCrewEmpCode;
    return;
  }

  currentCrewEmpCode = empCode;
  renderCrewView();
}

function renderCrewView() {
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[1] || crewStaffList[0];
  if (!staff) return;

  document.getElementById('crewStaffName').innerText = staff.name;
  document.getElementById('crewStaffRole').innerText = staff.role;
  document.getElementById('crewEmpCode').innerText = staff.emp_code || staff.id;

  // Attendance Status
  const att = crewAttendance.find(a => (a.employeeId || a.id) === staff.id || a.name === staff.name);
  const statusEl = document.getElementById('crewAttStatus');
  if (statusEl) {
    const isClockedIn = att && att.status && att.status.includes('Studio');
    statusEl.innerText = isClockedIn ? '🟢 Studio Active' : '🔴 Clocked Out';
    statusEl.className = isClockedIn ? 'badge badge-emerald' : 'badge badge-pink';
  }

  // Pay & Commissions
  const base = Number(staff.baseSalary || staff.base_salary || 60000);
  const comm = Number(staff.earnedCommissions || staff.earned_commissions || 10000);
  const total = base + comm;

  const totalEl = document.getElementById('crewTotalPay');
  if (totalEl) totalEl.innerText = `BDT ${total.toLocaleString()}`;

  const breakdownEl = document.getElementById('crewPayBreakdown');
  if (breakdownEl) {
    breakdownEl.innerHTML = `
      • Base Salary: <strong>BDT ${base.toLocaleString()}</strong><br>
      • Shoot Commissions: <strong>BDT ${comm.toLocaleString()}</strong>
    `;
  }

  // Gear Checked Out
  const checkedOutAsset = crewAssets.find(a => a.assignedTo === staff.name || (a.condition === 'In Use' && a.assignedTo && a.assignedTo.includes(staff.name.split(' ')[0])));
  if (checkedOutAsset) {
    document.getElementById('crewGearCount').innerText = '1 Gear Checked Out';
    document.getElementById('crewGearCount').className = 'badge badge-amber';
    document.getElementById('crewActiveGear').innerText = checkedOutAsset.name;
    document.getElementById('crewGearDate').innerText = `Category: ${checkedOutAsset.category || 'Gear'}`;
  } else {
    document.getElementById('crewGearCount').innerText = 'No Field Gear Out';
    document.getElementById('crewGearCount').className = 'badge badge-emerald';
    document.getElementById('crewActiveGear').innerText = 'All Gear in Studio Vault';
    document.getElementById('crewGearDate').innerText = 'Ready for shoot checkout';
  }

  // Filter Tasks for Staff
  const firstName = staff.name.split(' ')[0].toLowerCase();
  const assigned = crewTasks.filter(t => {
    if (t.assignees && Array.isArray(t.assignees)) {
      return t.assignees.some(a => a.toLowerCase().includes(firstName));
    }
    return (t.assignee || '').toLowerCase().includes(firstName) || (t.assignedTo || '').toLowerCase().includes(firstName);
  });

  const taskListEl = document.getElementById('crewTaskList');
  const taskBadge = document.getElementById('crewTaskBadge');
  if (taskBadge) taskBadge.innerText = `${assigned.length} Active Tasks`;

  if (taskListEl) {
    if (assigned.length === 0) {
      taskListEl.innerHTML = `
        <div class="team-empty-state" style="text-align: center; padding: 2.2rem 1.5rem; background: rgba(15,23,42,0.4); border: 1px dashed rgba(255,255,255,0.08); border-radius: 12px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎬</div>
          <h3 style="font-size: 0.95rem; color: #f1f5f9; font-weight: 700; margin-bottom: 0.25rem;">No Active Shoots or Edit Tasks</h3>
          <p style="font-size: 0.8rem; color: #94a3b8; max-width: 380px; margin: 0 auto;">You have no pending production tasks assigned right now. Enjoy your downtime or check the studio schedule!</p>
        </div>
      `;
    } else {
      taskListEl.innerHTML = assigned.map(t => `
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
              <strong style="color:#fff; font-size:1rem;">${t.title}</strong>
              <span class="badge ${t.priority === 'Urgent' || t.priority === 'High' ? 'badge-pink' : 'badge-purple'}">${t.priority || 'Normal'}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">🏢 Client: ${t.client || 'Agency Project'} • 📅 Due: ${t.dueDate || t.due_date || 'Soon'}</div>
          </div>

          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="badge badge-amber">Stage: ${t.stage || 'Production'}</span>
            <button class="btn-purple" style="font-size:0.78rem; padding:0.35rem 0.7rem;" onclick="advanceCrewTask('${t.id}', '${t.stage || 'Production'}')">
              ▶️ Advance Stage
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

async function crewClockIn() {
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];
  try {
    const res = await fetch('/api/telegram-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: '/clockin', text: `/clockin ${staff.emp_code}` })
    });
    const data = await res.json();
    showTeamToast(`🟢 Clock In Recorded for ${staff.name}! Studio attendance updated.`, 'success');
    initCrewPortal();
  } catch (err) {
    showTeamToast('Clock-in error: ' + err.message, 'error');
  }
}

async function crewClockOut() {
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];
  try {
    const res = await fetch('/api/telegram-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: '/clockout', text: `/clockout ${staff.emp_code}` })
    });
    const data = await res.json();
    showTeamToast(`🔴 Clock Out Recorded for ${staff.name}. Have a great rest of your day!`, 'info');
    initCrewPortal();
  } catch (err) {
    showTeamToast('Clock-out error: ' + err.message, 'error');
  }
}

async function advanceCrewTask(taskId, currentStage) {
  const stages = ['Strategy', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'];
  const curIdx = stages.indexOf(currentStage);
  const nextStage = curIdx >= 0 && curIdx < stages.length - 1 ? stages[curIdx + 1] : 'Approved';

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage })
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`▶️ Task stage advanced to "${nextStage}"!`, 'success');
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error advancing task stage: ' + err.message, 'error');
  }
}

async function quickGearCheckout(gearIdInput) {
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];
  const gearId = gearIdInput || 'AST-001';

  try {
    const res = await fetch(`/api/assets/${gearId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrower: staff.name })
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`📤 Equipment ${gearId} checked out to ${staff.name}`, 'success');
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error checking out gear: ' + err.message, 'error');
  }
}

async function quickGearReturn() {
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];
  const gear = crewAssets.find(a => a.assignedTo === staff.name || a.condition === 'In Use');
  const gearId = gear ? gear.id : 'AST-001';

  try {
    const res = await fetch(`/api/assets/${gearId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`📥 Equipment returned to studio vault!`, 'success');
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error returning gear: ' + err.message, 'error');
  }
}

async function submitCrewExpense(event) {
  event.preventDefault();
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];

  const payload = {
    submittedBy: staff ? staff.name : 'Crew Specialist',
    submittedById: currentCrewEmpCode,
    category: document.getElementById('crewExpCategory').value,
    amount: Number(document.getElementById('crewExpAmount').value),
    receiptUrl: document.getElementById('crewExpReceipt').value.trim(),
    description: document.getElementById('crewExpDesc').value.trim(),
    status: 'Tier 1 Pending'
  };

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`✅ Field Expense claim ${data.expense.id} (BDT ${payload.amount.toLocaleString()}) submitted! Status: Tier 1 Pending.`, 'success');
      document.getElementById('crewExpAmount').value = '';
      document.getElementById('crewExpReceipt').value = '';
      document.getElementById('crewExpDesc').value = '';
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error submitting crew expense: ' + err.message, 'error');
  }
}

async function submitCrewLeave(event) {
  event.preventDefault();
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];

  const payload = {
    staffId: currentCrewEmpCode,
    staffName: staff ? staff.name : 'Crew Specialist',
    type: document.getElementById('crewLeaveType').value,
    totalDays: Number(document.getElementById('crewLeaveDays').value) || 1,
    startDate: document.getElementById('crewLeaveStart').value,
    endDate: document.getElementById('crewLeaveEnd').value,
    reason: document.getElementById('crewLeaveReason').value.trim()
  };

  try {
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`🌴 Leave request ${data.leave.id} (${payload.type}) submitted! Pending Line Manager review.`, 'success');
      document.getElementById('crewLeaveReason').value = '';
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error submitting leave: ' + err.message, 'error');
  }
}

async function submitCrewEod(event) {
  event.preventDefault();
  const staff = crewStaffList.find(e => (e.emp_code || e.id) === currentCrewEmpCode) || crewStaffList[0];

  const payload = {
    staffId: currentCrewEmpCode,
    staffName: staff ? staff.name : 'Crew Specialist',
    date: new Date().toISOString().split('T')[0],
    tasksCompleted: document.getElementById('crewEodCompleted').value.trim(),
    tasksInProgress: document.getElementById('crewEodInProgress').value.trim() || 'None',
    blockers: document.getElementById('crewEodBlockers').value.trim() || 'None'
  };

  try {
    const res = await fetch('/api/eod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showTeamToast(`📋 Daily EOD report logged for ${payload.staffName}!`, 'success');
      document.getElementById('crewEodCompleted').value = '';
      document.getElementById('crewEodInProgress').value = '';
      document.getElementById('crewEodBlockers').value = '';
      initCrewPortal();
    }
  } catch (err) {
    showTeamToast('Error submitting EOD report: ' + err.message, 'error');
  }
}

function setupTeamSSE() {
  try {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['task_update', 'attendance_update', 'leave_update'].includes(msg.type)) {
          if (typeof initCrewPortal === 'function') initCrewPortal();
        }
      } catch (err) {}
    };
    es.onerror = () => es.close();
  } catch (err) {}
}

document.addEventListener('DOMContentLoaded', () => {
  setupTeamSSE();
});
