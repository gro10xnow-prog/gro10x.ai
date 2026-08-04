/**
 * public/app/modules/hr.js
 * HR Operations & Leave Requests Management Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.hr = async function(container) {
  let activeHrTab = 'roster';
  let teamData = [];
  let leavesData = [];

  async function loadHROps() {
    const [team, leaves] = await Promise.all([
      APP_API.get('/team').catch(() => []),
      APP_API.get('/leaves').catch(() => [])
    ]);

    teamData = team || [];
    leavesData = leaves || [];

    renderHRView();
  }

  function renderHRView() {
    const pendingLeaves = leavesData.filter(l => l.status === 'Pending').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            👨‍💼 HR Operations & Leave Triage
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage team roster, view attendance logs, and approve/reject leave requests from crew miniapp.
          </div>
        </div>
        <button class="btn-primary" onclick="window.HR_MODULE.openAddModal()">+ Add Team Member</button>
      </div>

      <!-- KPI Tiles -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Team Crew</div>
          <div class="kpi-val">${teamData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Leave Requests</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingLeaves}</div>
        </div>
      </div>

      <!-- Subtab Switcher -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem;">
        <button class="btn-ghost ${activeHrTab === 'roster' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('roster')">👥 Team Roster</button>
        <button class="btn-ghost ${activeHrTab === 'leaves' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('leaves')">🌴 Leave Requests (${pendingLeaves} Pending)</button>
      </div>

      <div class="data-table-container">
        ${renderHrTabGrid()}
      </div>
    `;
  }

  function renderHrTabGrid() {
    if (activeHrTab === 'roster') {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Role / Title</th>
              <th>Department</th>
              <th>Status</th>
              <th>Base Salary</th>
            </tr>
          </thead>
          <tbody>
            ${teamData.map(m => `
              <tr>
                <td style="font-weight:700;">👤 ${m.name}</td>
                <td>${m.role || 'Specialist'}</td>
                <td style="color:var(--text-muted);">${m.department || 'Production'}</td>
                <td><span class="badge badge-emerald">${m.status || 'Active'}</span></td>
                <td style="font-weight:700; color:var(--purple-light);">৳${(Number(m.baseSalary) || 0).toLocaleString()}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No team members found</td></tr>`}
          </tbody>
        </table>
      `;
    } else {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leavesData.map(l => `
              <tr>
                <td style="font-weight:700;">👤 ${l.employeeName || l.staffName || 'Staff Member'}</td>
                <td><span class="badge badge-purple">${l.leaveType || 'Casual Leave'}</span></td>
                <td style="color:var(--text-muted);">${l.startDate || l.fromDate || 'N/A'} ➔ ${l.endDate || l.toDate || 'N/A'}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${l.reason || 'No reason specified'}</td>
                <td><span class="badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-pink' : 'badge-amber'}">${l.status || 'Pending'}</span></td>
                <td>
                  ${l.status === 'Pending' ? `
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-primary btn-sm" onclick="window.HR_MODULE.approveLeave('${l.id}')">Approve</button>
                    </div>
                  ` : `<span style="font-size:0.75rem; color:var(--text-dim);">Processed</span>`}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No leave requests logged</td></tr>`}
          </tbody>
        </table>
      `;
    }
  }

  window.HR_MODULE = {
    switchTab(t) {
      activeHrTab = t;
      renderHRView();
    },
    openAddModal() {
      document.getElementById('hrAddMemberModal').classList.add('active');
    },
    closeAddModal() {
      document.getElementById('hrAddMemberModal').classList.remove('active');
    },
    async submitMember() {
      const name = document.getElementById('hrAddName').value.trim();
      const role = document.getElementById('hrAddRole').value.trim();
      const department = document.getElementById('hrAddDept').value;
      const phone = document.getElementById('hrAddPhone').value.trim();
      const pin = document.getElementById('hrAddPin').value.trim() || '1234';
      const baseSalary = document.getElementById('hrAddSalary').value;
      const bkashNo = document.getElementById('hrAddBkash').value.trim();

      if (!name || !phone) return alert('Name and phone are required.');

      try {
        const res = await APP_API.post('/team', { name, role, department, phone, pin, baseSalary, bkashNo });
        if (res.success || res.member) {
          this.closeAddModal();
          showToast(`Team member "${name}" added with crew portal access!`);
          loadHROps();
        }
      } catch (e) {
        showToast('Failed to add team member', 'error');
      }
    },
    async approveLeave(leaveId) {
      try {
        const res = await APP_API.post(`/leaves/${leaveId}/approve`, { reviewedBy: 'Admin Workspace' });
        if (res.success || res.leave) {
          showToast('Leave request approved! 🌴');
          loadHROps();
        }
      } catch (err) {
        showToast('Failed to approve leave request', 'error');
      }
    }
  };

  await loadHROps();
};
