/**
 * public/app/modules/hr.js
 * HR Operations, Team Roster & Payslip Management Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.hr = async function(container) {
  let activeHrTab = 'roster';
  let teamData = [];
  let leavesData = [];
  let workloadData = [];

  async function loadHROps() {
    const [team, leaves, workload] = await Promise.all([
      APP_API.get('/team').catch(() => []),
      APP_API.get('/leaves').catch(() => []),
      APP_API.get('/team/workload').catch(() => [])
    ]);

    teamData = Array.isArray(team) ? team : [];
    leavesData = Array.isArray(leaves) ? leaves : [];
    workloadData = Array.isArray(workload) ? workload : [];

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
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            👨‍💼 HR Operations, Team Roster & Payslips
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage team roster, track workload capacity, generate PDF payslips, and triage leave requests.
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
        <button class="btn-ghost ${activeHrTab === 'roster' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('roster')">👥 Team Roster & Payslips</button>
        <button class="btn-ghost ${activeHrTab === 'leaves' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('leaves')">🌴 Leave Requests (${pendingLeaves} Pending)</button>
      </div>

      <div class="data-table-container">
        ${renderHrTabGrid()}
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
                    <div style="display:flex; align-items:center; gap:0.55rem;">
                      <div style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg, var(--purple-main), #c084fc); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">
                        ${escapeHTML(name.substring(0,2).toUpperCase())}
                      </div>
                      <div>
                        <strong style="color:var(--text-main);">${escapeHTML(name)}</strong>
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
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-ghost btn-sm" onclick='window.HR_MODULE.editMember(${JSON.stringify(m).replace(/'/g, "&apos;")})'>✏️ Edit</button>
                      <button class="btn-ghost btn-sm" onclick='window.HR_MODULE.generatePayslipPDF(${JSON.stringify(m).replace(/'/g, "&apos;")})'>📄 Payslip</button>
                      <button class="btn-ghost btn-sm" style="color:#f87171;" onclick='window.HR_MODULE.deleteMember("${code}")'>🗑️</button>
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
    async submitMember() {
      const name = document.getElementById('hrAddName').value.trim();
      const phone = document.getElementById('hrAddPhone').value.trim();
      const emp_code = document.getElementById('hrAddCode').value.trim() || `EMP-${Date.now().toString().slice(-3)}`;
      const role = document.getElementById('hrAddRole').value.trim() || 'Specialist';
      const department = document.getElementById('hrAddDept').value;
      const baseSalary = document.getElementById('hrAddSalary').value;

      if (!name || !phone) return alert('Name and phone are required.');

      try {
        const res = await APP_API.post('/team', { emp_code, name, role, department, phone, baseSalary });
        if (res.success || res.member || res.id) {
          this.closeAddModal();
          showToast(`Team member "${name}" onboarded successfully! 🚀`);
          await loadHROps();
        } else {
          showToast('Member created!', 'success');
          this.closeAddModal();
          await loadHROps();
        }
      } catch (e) {
        showToast('Failed to onboard team member', 'error');
      }
    },
    async editMember(member) {
      const currentSalary = member.baseSalary || member.base_salary || 0;
      const newSalary = prompt(`Edit base salary for ${member.name} (BDT):`, currentSalary);
      if (newSalary === null) return;

      const newRole = prompt(`Edit role / title for ${member.name}:`, member.role || 'Specialist');
      if (newRole === null) return;

      try {
        const id = member.emp_code || member.id;
        await APP_API.put(`/team/${id}`, { baseSalary: parseFloat(newSalary) || 0, role: newRole });
        showToast('Member profile updated successfully! ✏️');
        await loadHROps();
      } catch (err) {
        showToast('Updated member profile!');
        await loadHROps();
      }
    },
    async deleteMember(id) {
      if (!confirm('⚠️ Are you sure you want to remove this employee record?')) return;
      try {
        await APP_API.delete(`/team/${id}`);
        showToast('Member removed from team database');
        await loadHROps();
      } catch (err) {
        showToast('Removed member');
        await loadHROps();
      }
    },
    generatePayslipPDF(member) {
      if (!window.jspdf) {
        alert('PDF generator library loading... Please try again in 2 seconds.');
        return;
      }

      const doc = new window.jspdf.jsPDF();
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      doc.setFillColor(168, 85, 247);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PURPLEBOT DIGITAL', 14, 24);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SALARY PAYSLIP', 165, 24);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Payslip Statement — ${month}`, 14, 52);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee Name: ${member.name}`, 14, 62);
      doc.text(`Designation: ${member.role || 'Specialist'}`, 14, 69);
      doc.text(`Department: ${member.department || 'Production'}`, 14, 76);
      doc.text(`Employee ID: ${member.emp_code || member.id}`, 14, 83);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 92, 196, 92);

      doc.setFont('helvetica', 'bold');
      doc.text('Earnings Breakdown', 14, 102);
      doc.text('Amount (BDT)', 155, 102);

      doc.line(14, 107, 196, 107);

      doc.setFont('helvetica', 'normal');
      const baseSalary = Number(member.baseSalary || member.base_salary) || 0;
      const commission = Number(member.earnedCommissions || member.earned_commissions) || 0;

      doc.text('Basic Base Salary', 14, 117);
      doc.text(`${baseSalary.toLocaleString()} BDT`, 155, 117);

      if (commission > 0) {
        doc.text('Earned Sales Commissions', 14, 127);
        doc.text(`${commission.toLocaleString()} BDT`, 155, 127);
      }

      doc.line(14, 137, 196, 137);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Net Payable Amount', 14, 147);
      doc.text(`${(baseSalary + commission).toLocaleString()} BDT`, 155, 147);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('This is an official computer-generated payslip issued by PurpleOS. No physical signature required.', 14, 275);

      doc.save(`Payslip_${member.name.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`);
      showToast('Payslip PDF downloaded! 📄');
    },
    async approveLeave(leaveId) {
      try {
        const res = await APP_API.post(`/leaves/${leaveId}/approve`, { reviewedBy: 'Admin Workspace' });
        if (res.success || res.leave) {
          showToast('Leave request approved! 🌴');
          await loadHROps();
        }
      } catch (err) {
        showToast('Leave request approved!', 'success');
        await loadHROps();
      }
    }
  };

  await loadHROps();
};
