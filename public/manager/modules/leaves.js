/**
 * public/manager/modules/leaves.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.leaves = async function(container) {
  let leaves = [];

  async function loadLeaves() {
    leaves = await MANAGER_API.get('/leaves').catch(() => []);
    renderLeaves();
  }

  function renderLeaves() {
    const pending = leaves.filter(l => l.status === 'Pending').length;

    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🌴 Department Leave Approvals (${pending} Pending)</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Approve or reject PTO and leave requests from team members.</div>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => `
              <tr>
                <td style="font-weight:700;">👤 ${l.employeeName || l.staffName || 'Staff Member'}</td>
                <td><span class="badge badge-purple">${l.leaveType || 'Casual Leave'}</span></td>
                <td style="color:var(--text-muted);">${l.startDate || l.fromDate || 'N/A'} ➔ ${l.endDate || l.toDate || 'N/A'}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${l.reason || 'No reason specified'}</td>
                <td><span class="badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-pink' : 'badge-amber'}">${l.status || 'Pending'}</span></td>
                <td>
                  ${l.status === 'Pending' ? `
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-primary btn-sm" onclick="window.MGR_LEAVES.approve('${l.id}')">Approve</button>
                      <button class="btn-danger btn-sm" onclick="window.MGR_LEAVES.reject('${l.id}')">Reject</button>
                    </div>
                  ` : `<span style="font-size:0.75rem; color:var(--text-dim);">Processed</span>`}
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem;">No leave requests logged</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_LEAVES = {
    async approve(id) {
      try {
        await MANAGER_API.post(`/leaves/${id}/manager-approve`, { reviewedBy: 'Department Manager' });
        showManagerToast('Leave request approved! 🌴');
        loadLeaves();
      } catch (e) {
        showManagerToast('Failed to approve leave', 'error');
      }
    },
    async reject(id) {
      try {
        await MANAGER_API.post(`/leaves/${id}/reject`, { reviewedBy: 'Department Manager' });
        showManagerToast('Leave request rejected');
        loadLeaves();
      } catch (e) {
        showManagerToast('Failed to reject leave', 'error');
      }
    }
  };

  await loadLeaves();
};
