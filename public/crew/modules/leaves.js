/**
 * public/crew/modules/leaves.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.leaves = async function(container) {
  let myLeaves = [];
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};

  async function loadLeaves() {
    const all = await CREW_API.get('/leaves').catch(() => []);
    const uName = (user.name || '').trim().toLowerCase();
    const uId = user.emp_code || user.employee_id || user.empCode || user.id || '';
    myLeaves = (all || []).filter(l => {
      if (uId && (l.employeeId === uId || l.employee_id === uId || l.emp_code === uId || l.staffId === uId)) return true;
      if (uName.length > 1 && (l.employeeName || l.staffName || '').toLowerCase().includes(uName)) return true;
      return false;
    });
    renderLeaves();
  }

  function renderLeaves() {
    const approvedLeaves = myLeaves.filter(l => l.status === 'Approved');
    const casualUsed = (user.casual_leaves_used !== undefined && user.casual_leaves_used !== null) 
      ? Number(user.casual_leaves_used) 
      : approvedLeaves.filter(l => (l.leaveType || l.type || '').toLowerCase().includes('casual'))
          .reduce((sum, l) => sum + (Number(l.total_days || l.totalDays || l.days) || 1), 0);
    const sickUsed = (user.sick_leaves_used !== undefined && user.sick_leaves_used !== null) 
      ? Number(user.sick_leaves_used) 
      : approvedLeaves.filter(l => (l.leaveType || l.type || '').toLowerCase().includes('sick'))
          .reduce((sum, l) => sum + (Number(l.total_days || l.totalDays || l.days) || 1), 0);
    const casualAllowed = Number(user.casual_leaves_allowed) || 14;
    const sickAllowed = Number(user.sick_leaves_allowed) || 10;
    const casualRem = Math.max(0, casualAllowed - casualUsed);
    const sickRem = Math.max(0, sickAllowed - sickUsed);

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🌴 Leave Requests & PTO</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Apply for leave and track review status.</div>
        </div>
        <button class="btn-primary" onclick="window.CREW_LEAVES.openModal()">+ Apply for Leave</button>
      </div>

      <!-- PTO Allowance Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Casual Leave Balance</div>
          <div class="kpi-val" style="color:var(--purple-light);">${casualRem} Days</div>
          <div class="kpi-sub">${casualAllowed} Allowed &bull; ${casualUsed} Used</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Sick Leave Balance</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">${sickRem} Days</div>
          <div class="kpi-sub">${sickAllowed} Allowed &bull; ${sickUsed} Used</div>
        </div>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${myLeaves.map(l => `
              <tr>
                <td><span class="badge badge-purple">${l.leaveType || 'Casual Leave'}</span></td>
                <td style="color:var(--text-muted);">${l.startDate || 'N/A'} ➔ ${l.endDate || 'N/A'}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${l.reason || 'No reason specified'}</td>
                <td><span class="badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-pink' : 'badge-amber'}">${l.status || 'Pending'}</span></td>
              </tr>
            `).join('') || `<tr><td colspan="4" style="text-align:center; padding:2rem;">No leave requests submitted</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" id="crLeaveModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">🌴 Apply for Leave</h2>
            <button onclick="window.CREW_LEAVES.closeModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Leave Type</label>
            <select id="crLeaveType" class="form-select">
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Start Date</label>
              <input type="date" id="crLeaveStart" class="form-input" onchange="window.CREW_LEAVES.calcDays()">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">End Date</label>
              <input type="date" id="crLeaveEnd" class="form-input" onchange="window.CREW_LEAVES.calcDays()">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Total Working Days</label>
            <div id="crTotalDays" style="font-size: 1.1rem; font-weight: 700; color: var(--emerald-brand);">0 Days</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Excluding Fridays & Saturdays</div>
          </div>

          <div class="form-group">
            <label class="form-label">Reason</label>
            <textarea id="crLeaveReason" class="form-textarea" rows="3" placeholder="Reason for leave request..."></textarea>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CREW_LEAVES.submit()">🚀 Submit Leave Request</button>
        </div>
      </div>
    `;
  }

  window.CREW_LEAVES = {
    openModal() { document.getElementById('crLeaveModal').classList.add('active'); },
    closeModal() { document.getElementById('crLeaveModal').classList.remove('active'); },
    calcDays() {
      const startVal = document.getElementById('crLeaveStart').value;
      const endVal = document.getElementById('crLeaveEnd').value;
      const totalEl = document.getElementById('crTotalDays');
      
      if (!startVal || !endVal) {
        totalEl.textContent = '0 Days';
        return 0;
      }

      const start = new Date(startVal);
      const end = new Date(endVal);
      if (end < start) {
        totalEl.textContent = 'Invalid Dates';
        return 0;
      }

      let days = 0;
      let cur = new Date(start);
      while (cur <= end) {
        const dayOfWeek = cur.getDay();
        // 5 = Friday, 6 = Saturday
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
          days++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      totalEl.textContent = `${days} Day${days !== 1 ? 's' : ''}`;
      return days;
    },
    async submit() {
      const leaveType = document.getElementById('crLeaveType').value;
      const startDate = document.getElementById('crLeaveStart').value;
      const endDate = document.getElementById('crLeaveEnd').value;
      const reason = document.getElementById('crLeaveReason').value.trim();
      const totalDays = this.calcDays();
      const submitBtn = document.querySelector('#crLeaveModal button.btn-primary');

      if (!startDate || !endDate) {
        if (typeof window.showCrewToast === 'function') {
          window.showCrewToast('Please select start and end dates.', 'warning');
        }
        return;
      }
      if (totalDays <= 0) {
        if (typeof window.showCrewToast === 'function') {
          window.showCrewToast('Total working days must be > 0 (select non-weekend dates).', 'warning');
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Submitting...';
      }

      try {
        const res = await CREW_API.post('/leaves', {
          employeeId: user.emp_code || user.id,
          employeeName: user.name,
          leaveType,
          type: leaveType,
          startDate,
          fromDate: startDate,
          endDate,
          toDate: endDate,
          reason,
          totalDays
        });
        if (res && (res.success || res.leave || !res.error)) {
          this.closeModal();
          if (typeof window.showCrewToast === 'function') {
            window.showCrewToast('Leave request submitted! 🌴');
          }
          loadLeaves();
        } else {
          throw new Error(res?.error || 'Failed to submit');
        }
      } catch (e) {
        if (typeof window.showCrewToast === 'function') {
          window.showCrewToast(`Failed to submit leave: ${e.message}`, 'error');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🚀 Submit Leave Request';
        }
      }
    }
  };

  await loadLeaves();
};
