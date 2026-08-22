/**
 * public/manager/modules/leaves.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Department Manager Portal — Interactive Leave Approvals Module
 * - Status Filter Pills & Search
 * - 1-Click Approve/Reject with Toast Feedback
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.leaves = async function(container) {
  let allLeaves = [];
  let currentFilter = 'pending';
  let searchQuery = '';

  async function loadLeaves() {
    allLeaves = await MANAGER_API.get('/leaves').catch(() => []);
    renderLeaves();
  }

  function getFilteredLeaves() {
    return allLeaves.filter(l => {
      const matchesSearch = !searchQuery ||
        (l.employeeName || l.staffName || '').toLowerCase().includes(searchQuery) ||
        (l.leaveType || '').toLowerCase().includes(searchQuery) ||
        (l.reason || '').toLowerCase().includes(searchQuery);

      if (!matchesSearch) return false;

      const st = (l.status || 'Pending').toLowerCase();
      if (currentFilter === 'all') return true;
      if (currentFilter === 'pending') return st.includes('pending');
      if (currentFilter === 'approved') return st.includes('approved');
      if (currentFilter === 'rejected') return st.includes('reject') || st.includes('decline');
      return true;
    });
  }

  function renderLeaves() {
    const leaves = getFilteredLeaves();
    const pendingCount = allLeaves.filter(l => (l.status || 'Pending').toLowerCase().includes('pending')).length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            🌴 Department Leave Approvals (${pendingCount} Pending)
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Review and sign off on vacation, casual, and sick leave requests from your team.
          </div>
        </div>

        <div style="position:relative; width:100%; max-width:320px;">
          <input
            type="text"
            placeholder="🔍 Search employee name or reason..."
            value="${searchQuery}"
            style="width:100%; padding:0.6rem 1rem; background:var(--surface-2); border:1px solid var(--border-medium); border-radius:10px; color:var(--text-primary); font-size:0.85rem;"
            oninput="window.MGR_LEAVES.onSearch(this.value)"
          />
        </div>
      </div>

      <!-- Filter Pills -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; overflow-x:auto; padding-bottom:0.25rem;">
        <button class="filter-pill ${currentFilter === 'pending' ? 'active' : ''}" onclick="window.MGR_LEAVES.setFilter('pending')">
          ⏳ Pending Review (${pendingCount})
        </button>
        <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="window.MGR_LEAVES.setFilter('all')">
          All Requests (${allLeaves.length})
        </button>
        <button class="filter-pill ${currentFilter === 'approved' ? 'active' : ''}" onclick="window.MGR_LEAVES.setFilter('approved')">
          ✅ Approved
        </button>
        <button class="filter-pill ${currentFilter === 'rejected' ? 'active' : ''}" onclick="window.MGR_LEAVES.setFilter('rejected')">
          ❌ Declined
        </button>
      </div>

      <!-- Leaves Table -->
      <div class="data-table-container card-glass">
        <table class="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Leave Type</th>
              <th>Requested Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => {
              const isPending = (l.status || 'Pending').toLowerCase().includes('pending');
              const isApproved = (l.status || '').toLowerCase().includes('approved');
              const isRejected = (l.status || '').toLowerCase().includes('reject') || (l.status || '').toLowerCase().includes('decline');

              return `
                <tr>
                  <td style="font-weight:700; color:var(--text-primary);">
                    👤 ${l.employeeName || l.staffName || 'Staff Member'}
                  </td>
                  <td>
                    <span class="badge badge-purple">${l.leaveType || 'Casual Leave'}</span>
                  </td>
                  <td style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">
                    📅 ${l.startDate || l.fromDate || 'N/A'} ➔ ${l.endDate || l.toDate || 'N/A'}
                  </td>
                  <td style="font-size:0.82rem; color:var(--text-secondary); max-width:260px;">
                    ${l.reason || 'No reason specified'}
                  </td>
                  <td>
                    <span class="badge ${isApproved ? 'badge-emerald' : (isRejected ? 'badge-pink' : 'badge-amber')}">
                      ${l.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    ${isPending ? `
                      <div style="display:flex; gap:0.4rem;">
                        <button class="btn-primary btn-sm" onclick="window.MGR_LEAVES.approve('${l.id}')">Approve</button>
                        <button class="btn-danger btn-sm" onclick="window.MGR_LEAVES.reject('${l.id}')">Reject</button>
                      </div>
                    ` : `
                      <span style="font-size:0.75rem; color:var(--text-dim);">Processed</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No leave requests found for this filter.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  window.MGR_LEAVES = {
    onSearch(q) {
      searchQuery = (q || '').trim().toLowerCase();
      renderLeaves();
    },
    setFilter(filter) {
      currentFilter = filter;
      renderLeaves();
    },
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
