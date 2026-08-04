/**
 * public/crew/modules/leaves.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.leaves = async function(container) {
  let myLeaves = [];
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};

  async function loadLeaves() {
    const all = await CREW_API.get('/leaves').catch(() => []);
    myLeaves = (all || []).filter(l => (l.employeeName || l.staffName || '').toLowerCase().includes((user.name || '').toLowerCase()) || l.employeeId === user.id);
    renderLeaves();
  }

  function renderLeaves() {
    const approvedLeaves = myLeaves.filter(l => l.status === 'Approved');
    const casualUsed = approvedLeaves.filter(l => (l.leaveType || '').includes('Casual')).length * 1;
    const sickUsed = approvedLeaves.filter(l => (l.leaveType || '').includes('Sick')).length * 1;
    const casualRem = Math.max(0, 14 - casualUsed);
    const sickRem = Math.max(0, 10 - sickUsed);

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
          <div class="kpi-sub">14 Allowed &bull; ${casualUsed} Used</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Sick Leave Balance</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">${sickRem} Days</div>
          <div class="kpi-sub">10 Allowed &bull; ${sickUsed} Used</div>
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
            </select>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Start Date</label>
              <input type="date" id="crLeaveStart" class="form-input">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">End Date</label>
              <input type="date" id="crLeaveEnd" class="form-input">
            </div>
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
    async submit() {
      const leaveType = document.getElementById('crLeaveType').value;
      const startDate = document.getElementById('crLeaveStart').value;
      const endDate = document.getElementById('crLeaveEnd').value;
      const reason = document.getElementById('crLeaveReason').value.trim();

      if (!startDate || !endDate) return alert('Please select start and end dates.');

      try {
        const res = await CREW_API.post('/leaves', { leaveType, startDate, endDate, reason });
        if (res.success || res.leave) {
          this.closeModal();
          showCrewToast('Leave request submitted! 🌴');
          loadLeaves();
        }
      } catch (e) {
        showCrewToast('Failed to submit leave request', 'error');
      }
    }
  };

  await loadLeaves();
};
