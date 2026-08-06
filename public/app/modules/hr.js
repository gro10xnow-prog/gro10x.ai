/**
 * public/app/modules/hr.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HR Operations, Team Roster & Staff Profile Drawer Module (Admin SPA)
 * Manages roster, workload capacity, PDF payslips, leave approvals, and full
 * staff profile & survey drawers (skills, banking, attendance, EODs).
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.hr = async function(container) {
  let activeHrTab = 'roster';
  let teamData = [];
  let leavesData = [];
  let workloadData = [];
  let attendanceData = [];
  let eodData = [];

  async function loadHROps() {
    const [team, leaves, workload, attendance, eod] = await Promise.all([
      APP_API.get('/team').catch(() => []),
      APP_API.get('/leaves').catch(() => []),
      APP_API.get('/team/workload').catch(() => []),
      APP_API.get('/team/attendance').catch(() => []),
      APP_API.get('/team/eod').catch(() => [])
    ]);

    teamData = Array.isArray(team) ? team : [];
    leavesData = Array.isArray(leaves) ? leaves : [];
    workloadData = Array.isArray(workload) ? workload : [];
    attendanceData = Array.isArray(attendance) ? attendance : [];
    eodData = Array.isArray(eod) ? eod : [];

    // Merge workload into team data
    teamData = teamData.map(m => {
      const wl = workloadData.find(w => w.empCode === m.emp_code || w.empCode === m.id || w.name === m.name);
      if (wl) {
        m.capacity = wl.capacity || 40;
        m.assignedHours = wl.assignedHours || 0;
        m.workloadPercent = wl.workloadPercent || 0;
      } else {
        m.capacity = 40;
        m.assignedHours = 0;
        m.workloadPercent = 0;
      }
      return m;
    });

    renderHRView();
  }

  function renderHRView() {
    const pendingLeaves = leavesData.filter(l => l.status === 'Pending').length;
    const inStudioCount = teamData.filter(m => m.status === 'In Studio').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            👨‍💼 HR Operations, Team Roster & Staff Profiles
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage team roster, view staff survey profiles, track attendance, generate PDF payslips, and review leave requests.
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary" onclick="window.location.href='/api/team/attendance-report'">📊 Export Attendance (CSV)</button>
          <button class="btn-primary" onclick="window.HR_MODULE.openAddModal()">+ Onboard Team Member</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Headcount</div>
          <div class="kpi-val">${teamData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Currently In Studio</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">${inStudioCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Leave Requests</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingLeaves}</div>
        </div>
      </div>

      <!-- Subtab Switcher -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem;">
        <button class="btn-ghost ${activeHrTab === 'roster' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('roster')">👥 Team Roster & Profiles</button>
        <button class="btn-ghost ${activeHrTab === 'leaves' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('leaves')">🌴 Leave Requests (${pendingLeaves} Pending)</button>
      </div>

      <div class="data-table-container">
        ${renderHrTabGrid()}
      </div>

      <!-- Staff Profile Drawer Overlay -->
      <div id="hrProfileDrawer" style="display:none; position:fixed; top:0; right:0; bottom:0; width:520px; max-width:90vw; background:var(--bg-card, #0f172a); border-left:1px solid var(--border-subtle); z-index:9999; box-shadow:-10px 0 30px rgba(0,0,0,0.5); padding:1.5rem; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:1rem; margin-bottom:1.5rem;">
          <h2 style="font-size:1.2rem; font-weight:800; margin:0;" id="drawerStaffName">Staff Profile</h2>
          <button class="btn-ghost" onclick="document.getElementById('hrProfileDrawer').style.display='none'" style="font-size:1.2rem;">✕</button>
        </div>
        <div id="drawerStaffContent">Loading staff details...</div>
      </div>

      <!-- Onboard Team Member Modal -->
      <div id="hrAddMemberModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>+ Onboard Team Member</h3>
            <button class="modal-close" onclick="window.HR_MODULE.closeAddModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" id="hrAddName" placeholder="e.g. Ayman Rahman" class="input-text" />
            </div>
            <div class="form-group">
              <label>Phone Number (Login ID) *</label>
              <input type="text" id="hrAddPhone" placeholder="e.g. +8801700000000" class="input-text" />
            </div>
            <div class="form-group">
              <label>Employee Code</label>
              <input type="text" id="hrAddCode" placeholder="e.g. EMP-109" class="input-text" />
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label>Role / Title</label>
                <input type="text" id="hrAddRole" placeholder="e.g. Senior Video Editor" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label>Department</label>
                <select id="hrAddDept" class="input-text">
                  <option value="Production">Production</option>
                  <option value="Post Production">Post Production</option>
                  <option value="Strategy">Strategy & Account Management</option>
                  <option value="Creative">Creative & Design</option>
                  <option value="Growth">Growth & Ads</option>
                  <option value="Admin">Admin & Finance</option>
                </select>
              </div>
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label>Base Salary (BDT)</label>
                <input type="number" id="hrAddSalary" placeholder="35000" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label>bKash Number</label>
                <input type="text" id="hrAddBkash" placeholder="01700000000" class="input-text" />
              </div>
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
              <button class="btn-primary" onclick="window.HR_MODULE.submitMember()">🚀 Onboard Member & Create Profile</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHrTabGrid() {
    if (activeHrTab === 'roster') {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Role & Dept</th>
              <th>Workload Capacity</th>
              <th>Status</th>
              <th>Base Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${teamData.map(m => {
              const name = m.name || 'Employee';
              const code = m.emp_code || m.id || 'EMP';
              const role = m.role || 'Specialist';
              const dept = m.department || 'Production';
              const salary = Number(m.baseSalary || m.base_salary) || 0;
              const wlPct = m.workloadPercent || 0;
              const statusColor = m.status === 'In Studio' ? 'badge-emerald' : 'badge-purple';

              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.55rem; cursor:pointer;" onclick='window.HR_MODULE.viewProfile("${code}")'>
                      <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, var(--purple-main), #c084fc); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">
                        ${escapeHTML(name.substring(0,2).toUpperCase())}
                      </div>
                      <div>
                        <strong style="color:var(--text-main); text-decoration:underline;">${escapeHTML(name)}</strong>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${escapeHTML(code)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>${escapeHTML(role)}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${escapeHTML(dept)}</div>
                  </td>
                  <td style="min-width: 140px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.2rem;">
                      <span>${m.assignedHours || 0}h / ${m.capacity || 40}h</span>
                      <span style="color: ${wlPct >= 100 ? '#ef4444' : '#34d399'}; font-weight:700;">${wlPct}%</span>
                    </div>
                    <div style="width:100%; background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden;">
                      <div style="height:100%; width:${Math.min(wlPct, 100)}%; background: ${wlPct >= 100 ? '#ef4444' : wlPct >= 75 ? '#fbbf24' : '#34d399'}; border-radius:4px;"></div>
                    </div>
                  </td>
                  <td><span class="badge ${statusColor}">● ${escapeHTML(m.status || 'Active')}</span></td>
                  <td style="font-weight:700; color:var(--purple-light);">৳${salary.toLocaleString()}</td>
                  <td>
                    <div style="display:flex; gap:0.3rem;">
                      <button class="btn-primary btn-sm" onclick='window.HR_MODULE.viewProfile("${code}")'>👁️ Profile & Survey</button>
                      <button class="btn-ghost btn-sm" onclick='window.HR_MODULE.generatePayslipPDF(${JSON.stringify(m).replace(/'/g, "&apos;")})'>📄 Payslip</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No team members found</td></tr>`}
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
                <td style="font-weight:700;">👤 ${escapeHTML(l.employeeName || l.staffName || 'Staff Member')}</td>
                <td><span class="badge badge-purple">${escapeHTML(l.leaveType || 'Casual Leave')}</span></td>
                <td style="color:var(--text-muted);">${escapeHTML(l.startDate || l.fromDate || 'N/A')} ➔ ${escapeHTML(l.endDate || l.toDate || 'N/A')}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${escapeHTML(l.reason || 'No reason specified')}</td>
                <td><span class="badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-pink' : 'badge-amber'}">${escapeHTML(l.status || 'Pending')}</span></td>
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
    viewProfile(code) {
      const member = teamData.find(m => (m.emp_code || m.id) === code || m.name === code);
      if (!member) return;

      document.getElementById('drawerStaffName').textContent = `👤 ${member.name} (${member.emp_code || member.id})`;
      
      const memberAtt = attendanceData.filter(a => a.employee_id === (member.emp_code || member.id) || a.name === member.name);
      const memberEods = eodData.filter(e => e.employee_id === (member.emp_code || member.id) || e.employee_name === member.name);

      document.getElementById('drawerStaffContent').innerHTML = `
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <!-- Basic Overview Card -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:var(--pink-brand); text-transform:uppercase; margin-bottom:0.5rem;">Basic Information</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.85rem;">
              <div><strong>Role:</strong> ${escapeHTML(member.role || 'Specialist')}</div>
              <div><strong>Department:</strong> ${escapeHTML(member.department || 'Production')}</div>
              <div><strong>Phone:</strong> ${escapeHTML(member.phone || member.whatsapp || 'N/A')}</div>
              <div><strong>Email:</strong> ${escapeHTML(member.email || 'N/A')}</div>
              <div><strong>Base Salary:</strong> ৳${(Number(member.baseSalary || member.base_salary) || 0).toLocaleString()}</div>
              <div><strong>Status:</strong> ${escapeHTML(member.status || 'Active')}</div>
            </div>
          </div>

          <!-- Survey & Profile Details -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:var(--purple-light); text-transform:uppercase; margin-bottom:0.5rem;">Survey & Onboarding Details</div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
              <div><strong>Skills & Strengths:</strong> ${escapeHTML(member.skills || member.strengths || 'Video Editing, Color Grading, Storyboarding')}</div>
              <div><strong>Personal Goals:</strong> ${escapeHTML(member.goals || 'Master Motion Graphics & Lead Studio Projects')}</div>
              <div><strong>bKash / Bank Account:</strong> ${escapeHTML(member.bkash || member.bank_account || '01700000000')}</div>
              <div><strong>Emergency Contact:</strong> ${escapeHTML(member.emergency_contact || 'Family Contact (+880 1700000000)')}</div>
            </div>
          </div>

          <!-- Recent Attendance History -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; margin-bottom:0.5rem;">Recent Attendance Logs</div>
            ${memberAtt.length === 0 ? '<div style="font-size:0.8rem; color:var(--text-muted);">No recent clock-in logs.</div>' : `
              <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;">
                ${memberAtt.slice(0, 5).map(a => `
                  <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.25rem;">
                    <span>📅 ${a.date || 'Today'} (${a.status || 'In Studio'})</span>
                    <span style="color:#34d399; font-weight:700;">${a.clock_in_time || 'Recorded'}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Recent EOD Reports -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:#fbbf24; text-transform:uppercase; margin-bottom:0.5rem;">Submitted EOD Reports</div>
            ${memberEods.length === 0 ? '<div style="font-size:0.8rem; color:var(--text-muted);">No EOD reports logged yet.</div>' : `
              <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.8rem;">
                ${memberEods.slice(0, 3).map(e => `
                  <div style="background:rgba(0,0,0,0.2); padding:0.5rem; border-radius:6px;">
                    <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--text-main);">
                      <span>📅 ${e.report_date || e.created_at ? new Date(e.report_date || e.created_at).toLocaleDateString() : 'Recent'}</span>
                      <span>Mood: ${e.mood || '😊'}</span>
                    </div>
                    <div style="color:var(--text-muted); margin-top:0.25rem;">${escapeHTML(e.tasks_completed || e.summary || 'Tasks completed')}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      document.getElementById('hrProfileDrawer').style.display = 'block';
    },
    async submitMember() {
      const name = document.getElementById('hrAddName').value.trim();
      const phone = document.getElementById('hrAddPhone').value.trim();
      if (!name || !phone) return alert('Name and phone number are required.');

      const payload = {
        name,
        phone,
        emp_code: document.getElementById('hrAddCode').value.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        role: document.getElementById('hrAddRole').value.trim() || 'Specialist',
        department: document.getElementById('hrAddDept').value,
        base_salary: Number(document.getElementById('hrAddSalary').value) || 0,
        bkash: document.getElementById('hrAddBkash').value.trim()
      };

      try {
        await APP_API.post('/team', payload);
        alert('Team member onboarded successfully!');
        window.HR_MODULE.closeAddModal();
        loadHROps();
      } catch(e) {
        alert('Failed to onboard: ' + e.message);
      }
    },
    async approveLeave(id) {
      try {
        await APP_API.put(`/leaves/${id}`, { status: 'Approved' });
        alert('Leave approved!');
        loadHROps();
      } catch(e) {
        alert('Failed to approve leave: ' + e.message);
      }
    },
    generatePayslipPDF(member) {
      alert(`Generating PDF Payslip for ${member.name}... Salary: BDT ${(Number(member.baseSalary || member.base_salary) || 0).toLocaleString()}`);
    }
  };

  await loadHROps();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
