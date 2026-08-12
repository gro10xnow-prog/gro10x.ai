/**
 * public/app/modules/hr.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HR Operations, Team Roster & Staff Profile Drawer Module (Admin SPA)
 * v2.0 — Full Rebuild with Real jsPDF Payslips, ❌ Reject Leave button,
 * 4 KPI tiles, UUID emp_code generation, toast notifications, and error states.
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
  let invitationsData = [];
  let isLoading = true;
  let hasError = false;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function loadHROps() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [team, leaves, workload, attendance, eod, invites] = await Promise.all([
        APP_API.get('/team').catch(err => { throw err; }),
        APP_API.get('/leaves').catch(() => []),
        APP_API.get('/team/workload').catch(() => []),
        APP_API.get('/team/attendance').catch(() => []),
        APP_API.get('/team/eod').catch(() => []),
        APP_API.get('/team/invitation-status').catch(() => ({ members: [] }))
      ]);

      teamData = Array.isArray(team) ? team : (team && Array.isArray(team.data) ? team.data : []);
      leavesData = Array.isArray(leaves) ? leaves : [];
      workloadData = Array.isArray(workload) ? workload : [];
      attendanceData = Array.isArray(attendance) ? attendance : [];
      eodData = Array.isArray(eod) ? eod : [];
      invitationsData = invites && Array.isArray(invites.members) ? invites.members : [];

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

      isLoading = false;
      renderHRView();
    } catch (err) {
      console.error('[HR Module] Load error:', err);
      isLoading = false;
      hasError = true;
      renderErrorState(err.message || 'Failed to load team roster and HR data.');
    }
  }

  function renderSkeleton() {
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
      </div>
      <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading team roster and HR operations...</div>
    `;
  }

  function renderErrorState(message) {
    container.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; margin-top:2rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading HR Operations</div>
        <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
        <button class="btn-primary" onclick="window.HR_MODULE.reload()">🔄 Retry Loading</button>
      </div>
    `;
  }

  function renderHRView() {
    const pendingLeaves = leavesData.filter(l => l.status === 'Pending').length;
    const inStudioCount = teamData.filter(m => (m.status || '').toLowerCase() === 'in studio').length;
    const onLeaveCount = teamData.filter(m => (m.status || '').toLowerCase() === 'on leave').length;
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const approvedThisMonth = leavesData.filter(l => l.status === 'Approved' && (l.startDate || '').startsWith(currentMonthStr)).length;

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
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <a href="/api/team/attendance-report" target="_blank" class="btn-secondary" style="text-decoration:none; font-size:0.85rem;">📊 Export Attendance (CSV)</a>
          <button class="btn-primary" onclick="window.HR_MODULE.openAddModal()">+ Onboard Team Member</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Active Headcount</div>
          <div class="kpi-val">${teamData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Currently In Studio</div>
          <div class="kpi-val" style="color: var(--emerald-brand);">${inStudioCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🌴 On Leave Today</div>
          <div class="kpi-val" style="color: var(--purple-light);">${onLeaveCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Pending Leave Requests</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${pendingLeaves}</div>
        </div>
      </div>

      <!-- Subtab Switcher -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem; flex-wrap:wrap;">
        <button class="btn-ghost ${activeHrTab === 'roster' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('roster')">👥 Team Roster & Profiles (${teamData.length})</button>
        <button class="btn-ghost ${activeHrTab === 'invitations' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('invitations')">📩 Onboarding & PIN Invites (${invitationsData.length})</button>
        <button class="btn-ghost ${activeHrTab === 'attendance' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('attendance')">📍 Today's Attendance (${attendanceData.length})</button>
        <button class="btn-ghost ${activeHrTab === 'eod' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('eod')">📝 EOD Reports (${eodData.length})</button>
        <button class="btn-ghost ${activeHrTab === 'leaves' ? 'btn-secondary' : ''}" onclick="window.HR_MODULE.switchTab('leaves')">🌴 Leave Requests (${pendingLeaves} Pending)</button>
      </div>

      <div class="data-table-container">
        ${renderHrTabGrid()}
      </div>

      <!-- Staff Profile Drawer Overlay -->
      <div id="hrProfileDrawer" class="modal-overlay">
        <div class="modal-box" style="max-width:560px; max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem; margin-bottom:1.25rem;">
            <h2 style="font-size:1.2rem; font-weight:800; margin:0; color:#fff;" id="drawerStaffName">Staff Profile</h2>
            <div style="display:flex; align-items:center; gap:0.5rem;" id="drawerHeaderActions">
              <button onclick="window.HR_MODULE.closeProfileDrawer()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
            </div>
          </div>
          <div id="drawerStaffContent">Loading staff details...</div>
        </div>
      </div>

      <!-- Edit Team Member Modal -->
      <div id="hrEditMemberModal" class="modal-overlay">
        <div class="modal-box" style="max-width:540px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">✏️ Edit Team Profile</h3>
            <button onclick="window.HR_MODULE.closeEditModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="window.HR_MODULE.submitEditMember(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <input type="hidden" id="hrEditCode" />
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="hrEditName" class="input-text" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number (Login ID) *</label>
              <input type="text" id="hrEditPhone" class="input-text" required />
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Role / Title</label>
                <input type="text" id="hrEditRole" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Department</label>
                <select id="hrEditDept" class="input-text">
                  <option value="Production">Production</option>
                  <option value="Post Production">Post Production</option>
                  <option value="Strategy">Strategy & Account Management</option>
                  <option value="Creative">Creative & Design</option>
                  <option value="Growth">Growth & Ads</option>
                  <option value="Admin">Admin & Finance</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Base Salary (BDT)</label>
                <input type="number" id="hrEditSalary" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Personal Email</label>
                <input type="email" id="hrEditEmail" class="input-text" />
              </div>
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Blood Group</label>
                <input type="text" id="hrEditBlood" placeholder="e.g. B+" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">NID Number</label>
                <input type="text" id="hrEditNid" placeholder="e.g. 1234567890" class="input-text" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Contact</label>
              <input type="text" id="hrEditEmergency" placeholder="e.g. +88017..." class="input-text" />
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.8rem;">
              <button type="button" class="btn-secondary" onclick="window.HR_MODULE.closeEditModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="hrEditSubmitBtn">💾 Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Onboard Team Member Modal -->
      <div id="hrAddMemberModal" class="modal-overlay">
        <div class="modal-box" style="max-width:540px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; color:#fff; font-family:var(--font-heading);">+ Onboard Team Member</h3>
            <button onclick="window.HR_MODULE.closeAddModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="window.HR_MODULE.submitMember(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="hrAddName" placeholder="e.g. Ayman Rahman" class="input-text" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number (Login ID) *</label>
              <input type="text" id="hrAddPhone" placeholder="e.g. +8801700000000" class="input-text" required />
            </div>
            <div class="form-group">
              <label class="form-label">Employee Code (Leave blank to auto-generate)</label>
              <input type="text" id="hrAddCode" placeholder="e.g. EMP-109" class="input-text" />
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Role / Title</label>
                <input type="text" id="hrAddRole" placeholder="e.g. Senior Video Editor" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Department</label>
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
                <label class="form-label">Base Salary (BDT)</label>
                <input type="number" id="hrAddSalary" placeholder="35000" class="input-text" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">bKash Number</label>
                <input type="text" id="hrAddBkash" placeholder="01700000000" class="input-text" />
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.8rem;">
              <button type="button" class="btn-secondary" onclick="window.HR_MODULE.closeAddModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="hrSubmitBtn">🚀 Onboard Member & Create Profile</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Send PIN Invitation Modal -->
      <div id="hrInviteModal" class="modal-overlay">
        <div class="modal-box" style="max-width:540px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
            <h3 style="margin:0; color:#fff; font-family:var(--font-heading);" id="inviteModalTitle">📋 Send PIN Invitation</h3>
            <button onclick="window.HR_MODULE.closeInviteModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <div id="inviteModalContent" style="display:flex; flex-direction:column; gap:1rem;">
            Loading invitation options...
          </div>
        </div>
      </div>
    `;
  }

  function renderHrTabGrid() {
    if (activeHrTab === 'invitations') {
      const pinsSent = invitationsData.filter(m => m.hasPIN).length;
      const tgLinked = invitationsData.filter(m => m.telegramLinked).length;
      const onboarded = invitationsData.filter(m => m.onboardingComplete).length;
      const pct = invitationsData.length > 0 ? Math.round((onboarded / invitationsData.length) * 100) : 0;

      return `
        <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1.25rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
            <div>
              <div style="font-size:1.1rem; font-weight:800; color:#fff;">📋 Platform Onboarding & PIN Invitation Pipeline</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">Track workspace PIN generation, Telegram bot linking, survey progress, and agreement sign-offs.</div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-secondary btn-sm" disabled title="Will be activated after feedback cycle sign-off" style="opacity:0.6; cursor:not-allowed;">🚀 Bulk Send PINs (Pending Sign-off)</button>
            </div>
          </div>

          <div style="margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.3rem;">
              <span>Overall Onboarding Completion</span>
              <span style="color:var(--purple-light);">${onboarded} / ${invitationsData.length} Members (${pct}%)</span>
            </div>
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--purple-brand), var(--pink-brand)); border-radius:4px;"></div>
            </div>
          </div>

          <div style="display:flex; gap:1.5rem; font-size:0.82rem; color:var(--text-muted);">
            <span>🔑 PIN Generated: <b style="color:#fff;">${pinsSent}</b></span>
            <span>📱 Telegram Linked: <b style="color:#fff;">${tgLinked}</b></span>
            <span>✅ Onboarding Complete: <b style="color:#fff;">${onboarded}</b></span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Role & Dept</th>
              <th>Phone Number</th>
              <th>PIN Status</th>
              <th>Telegram</th>
              <th>Survey & Agreement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invitationsData.map(m => {
              const name = m.name || 'Member';
              const code = m.empCode || 'EMP';
              const role = m.role || 'Specialist';
              const dept = m.department || 'General';
              const phone = m.phone || 'N/A';
              const pinBadge = m.hasPIN
                ? (m.pinIsTemp ? '<span class="badge badge-amber">⏳ Temp PIN</span>' : '<span class="badge badge-emerald">✅ Perm PIN</span>')
                : '<span class="badge badge-pink">❌ No PIN</span>';

              const tgBadge = m.telegramLinked
                ? '<span class="badge badge-emerald">✅ Linked</span>'
                : '<span class="badge badge-amber">❌ Pending</span>';

              const progressBadge = m.onboardingComplete
                ? '<span class="badge badge-emerald">🎉 Fully Onboarded</span>'
                : m.surveyComplete
                ? '<span class="badge badge-purple">📋 Survey Signed</span>'
                : '<span class="badge badge-amber">⏳ Pending</span>';

              return `
                <tr>
                  <td>
                    <strong style="color:#fff;">${escapeHTML(name)}</strong>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${escapeHTML(code)}</div>
                  </td>
                  <td>
                    <div>${escapeHTML(role)}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${escapeHTML(dept)}</div>
                  </td>
                  <td style="font-family:monospace;">${escapeHTML(phone)}</td>
                  <td>${pinBadge}</td>
                  <td>${tgBadge}</td>
                  <td>${progressBadge}</td>
                  <td>
                    <button class="btn-primary btn-sm" onclick='window.HR_MODULE.openInviteModal("${code}")'>
                      🔑 ${m.hasPIN ? 'Resend PIN' : 'Generate & Send PIN'}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

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
              const statusColor = m.status === 'In Studio' ? 'badge-emerald' : m.status === 'On Leave' ? 'badge-pink' : 'badge-purple';

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
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-primary btn-sm" onclick='window.HR_MODULE.viewProfile("${code}")'>👁️ Profile</button>
                      <button class="btn-secondary btn-sm" onclick='window.HR_MODULE.openEditModal("${code}")'>✏️ Edit</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (activeHrTab === 'attendance') {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${attendanceData.map(a => `
              <tr>
                <td style="font-weight:700;">👤 ${escapeHTML(a.employeeName || a.name || a.employee_name || a.employee_id || 'Staff')}</td>
                <td>${escapeHTML(a.date || a.clockInDate || 'Today')}</td>
                <td style="color:#34d399; font-weight:700;">${escapeHTML(a.clockInTime || a.clock_in_time || '—')}</td>
                <td style="color:var(--text-muted);">${escapeHTML(a.clockOutTime || a.clock_out_time || '—')}</td>
                <td><span class="badge badge-emerald">● ${escapeHTML(a.status || 'In Studio')}</span></td>
                <td style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(a.location || 'Studio HQ')}</td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No attendance records logged for today</td></tr>`}
          </tbody>
        </table>
      `;
    } else if (activeHrTab === 'eod') {
      return `
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Date</th>
              <th>Tasks Completed</th>
              <th>Blockers</th>
              <th>Highlights</th>
              <th>Mood</th>
            </tr>
          </thead>
          <tbody>
            ${eodData.map(e => `
              <tr style="${e.blockers ? 'background:rgba(239,68,68,0.05);' : ''}">
                <td style="font-weight:700;">👤 ${escapeHTML(e.employee_name || e.employee_id || 'Staff')}</td>
                <td>${escapeHTML(e.report_date || (e.created_at ? new Date(e.created_at).toLocaleDateString() : 'Today'))}</td>
                <td style="font-size:0.8rem; color:var(--text-main); max-width:220px;">${escapeHTML(e.tasks_completed || e.summary || 'N/A')}</td>
                <td style="font-size:0.8rem; color:${e.blockers ? '#fca5a5' : 'var(--text-muted)'}; max-width:180px;">${escapeHTML(e.blockers || 'None')}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary); max-width:180px;">${escapeHTML(e.highlights || 'N/A')}</td>
                <td><span style="font-size:1.1rem;">${escapeHTML(e.mood || '😊')}</span></td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No EOD reports logged yet</td></tr>`}
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
              <th>Dates & Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leavesData.map(l => {
              const start = l.startDate || l.fromDate;
              const end = l.endDate || l.toDate;
              let daysStr = 'N/A';
              if (start && end) {
                const diff = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
                daysStr = `${diff} day${diff > 1 ? 's' : ''}`;
              }

              return `
                <tr>
                  <td style="font-weight:700;">👤 ${escapeHTML(l.employeeName || l.staffName || 'Staff Member')}</td>
                  <td><span class="badge badge-purple">${escapeHTML(l.leaveType || 'Casual Leave')}</span></td>
                  <td style="color:var(--text-muted);">
                    <div>${escapeHTML(start || 'N/A')} ➔ ${escapeHTML(end || 'N/A')}</div>
                    <div style="font-size:0.72rem; color:var(--purple-light); font-weight:700;">⏱️ ${daysStr}</div>
                  </td>
                  <td style="font-size:0.8rem; color:var(--text-secondary); max-width:200px;">${escapeHTML(l.reason || 'No reason specified')}</td>
                  <td>
                    <span class="badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-pink' : 'badge-amber'}">
                      ${escapeHTML(l.status || 'Pending')}
                    </span>
                  </td>
                  <td>
                    ${l.status === 'Pending' ? `
                      <div style="display:flex; gap:0.4rem;">
                        <button class="btn-emerald btn-sm" onclick="window.HR_MODULE.approveLeave('${l.id}')">✅ Approve</button>
                        <button class="btn-secondary btn-sm" style="color:#ef4444;" onclick="window.HR_MODULE.rejectLeave('${l.id}')">❌ Reject</button>
                      </div>
                    ` : `<span style="font-size:0.75rem; color:var(--text-muted);">Reviewed</span>`}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">No leave requests logged</td></tr>`}
          </tbody>
        </table>
      `;
    }
  }

  window.HR_MODULE = {
    reload() {
      loadHROps();
    },
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
    closeProfileDrawer() {
      document.getElementById('hrProfileDrawer').classList.remove('active');
    },
    openEditModal(code) {
      const member = teamData.find(m => (m.emp_code || m.id) === code || m.name === code);
      if (!member) return;

      document.getElementById('hrEditCode').value = member.emp_code || member.id || '';
      document.getElementById('hrEditName').value = member.name || '';
      document.getElementById('hrEditPhone').value = member.phone || member.whatsapp || '';
      document.getElementById('hrEditRole').value = member.role || '';
      document.getElementById('hrEditDept').value = member.department || 'Production';
      document.getElementById('hrEditSalary').value = member.baseSalary || member.base_salary || 0;
      document.getElementById('hrEditEmail').value = member.email || member.personal_email || '';
      document.getElementById('hrEditBlood').value = member.bloodGroup || member.blood_group || '';
      document.getElementById('hrEditNid').value = member.nidNo || member.nid_no || '';
      document.getElementById('hrEditEmergency').value = member.emergency_contact || member.emergencyContact || '';

      document.getElementById('hrEditMemberModal').classList.add('active');
    },
    closeEditModal() {
      document.getElementById('hrEditMemberModal').classList.remove('active');
    },
    async submitEditMember(e) {
      if (e && e.preventDefault) e.preventDefault();
      const code = document.getElementById('hrEditCode').value;
      const name = document.getElementById('hrEditName').value.trim();
      const phone = document.getElementById('hrEditPhone').value.trim();
      
      if (!code || !name || !phone) {
        if (window.showToast) window.showToast('Name and phone number are required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('hrEditSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      const payload = {
        name,
        phone,
        role: document.getElementById('hrEditRole').value.trim(),
        department: document.getElementById('hrEditDept').value,
        baseSalary: Number(document.getElementById('hrEditSalary').value) || 0,
        personal_email: document.getElementById('hrEditEmail').value.trim(),
        blood_group: document.getElementById('hrEditBlood').value.trim(),
        nid_no: document.getElementById('hrEditNid').value.trim(),
        emergency_contact: document.getElementById('hrEditEmergency').value.trim()
      };

      try {
        await APP_API.put(`/team/${encodeURIComponent(code)}`, payload);
        if (window.showToast) window.showToast('Team member profile updated successfully! 🚀', 'success');
        this.closeEditModal();
        this.closeProfileDrawer();
        loadHROps();
      } catch(err) {
        if (window.showToast) window.showToast('Failed to update profile: ' + (err.message || 'Error'), 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 Save Changes'; }
      }
    },
    viewProfile(code) {
      const member = teamData.find(m => (m.emp_code || m.id) === code || m.name === code);
      if (!member) return;

      document.getElementById('drawerStaffName').textContent = `${member.name} (${member.emp_code || member.id})`;
      const drawerActions = document.getElementById('drawerHeaderActions');
      if (drawerActions) {
        drawerActions.innerHTML = `
          <button class="btn-secondary btn-sm" style="font-size:0.8rem; padding:0.25rem 0.65rem;" onclick='window.HR_MODULE.openEditModal("${member.emp_code || member.id}")'>✏️ Edit Profile</button>
          <button onclick="window.HR_MODULE.closeProfileDrawer()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
        `;
      }

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

          <!-- Identity & Emergency -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:var(--purple-light); text-transform:uppercase; margin-bottom:0.5rem;">Identity & Emergency</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; font-size:0.85rem;">
              <div><strong>Blood Group:</strong> ${escapeHTML(member.bloodGroup || member.blood_group || 'N/A')}</div>
              <div><strong>NID No:</strong> ${escapeHTML(member.nidNo || member.nid_no || 'N/A')}</div>
              <div><strong>TIN No:</strong> ${escapeHTML(member.tinNo || member.tin_no || 'N/A')}</div>
              <div><strong>Driving License:</strong> ${escapeHTML(member.drivingLicense || member.driving_license || 'N/A')}</div>
              <div><strong>Emergency Contact:</strong> ${escapeHTML(member.emergency_contact || member.emergencyContact || 'N/A')}</div>
              <div><strong>Relation:</strong> ${escapeHTML(member.emergencyRelation || member.emergency_relation || 'N/A')}</div>
            </div>
          </div>

          <!-- Education & Professional -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:0.5rem;">Education & Skills</div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
              <div><strong>Degree & Institute:</strong> ${escapeHTML(member.educationDegree || 'N/A')} — ${escapeHTML(member.institution || 'N/A')} (${escapeHTML(member.passingYear || 'N/A')})</div>
              <div><strong>Primary Skill:</strong> ${escapeHTML(member.primarySkill || member.skills || 'N/A')}</div>
              <div><strong>Secondary Skill:</strong> ${escapeHTML(member.secondarySkill || 'N/A')}</div>
              <div><strong>Portfolio:</strong> ${member.portfolioUrl ? `<a href="${escapeHTML(member.portfolioUrl)}" target="_blank" style="color:var(--purple-light);">${escapeHTML(member.portfolioUrl)}</a>` : 'N/A'}</div>
            </div>
          </div>

          <!-- Studio Equipment & Preferences -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:#f472b6; text-transform:uppercase; margin-bottom:0.5rem;">Studio Equipment & Gear</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; font-size:0.85rem;">
              <div><strong>Laptop Serial:</strong> ${escapeHTML(member.laptopSerial || 'N/A')}</div>
              <div><strong>Studio Gear:</strong> ${escapeHTML(member.studioGear || 'N/A')}</div>
              <div><strong>T-Shirt Size:</strong> ${escapeHTML(member.tshirtSize || 'N/A')}</div>
              <div><strong>Dietary Pref:</strong> ${escapeHTML(member.dietaryPref || 'N/A')}</div>
            </div>
          </div>

          <!-- Recent Attendance History -->
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem;">
            <div style="font-size:0.75rem; font-weight:800; color:#34d399; text-transform:uppercase; margin-bottom:0.5rem;">Recent Attendance Logs</div>
            ${memberAtt.length === 0 ? '<div style="font-size:0.8rem; color:var(--text-muted);">No recent clock-in logs.</div>' : `
              <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;">
                ${memberAtt.slice(0, 5).map(a => `
                  <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.25rem;">
                    <span>📅 ${escapeHTML(a.date || 'Today')} (${escapeHTML(a.status || 'In Studio')})</span>
                    <span style="color:#34d399; font-weight:700;">${escapeHTML(a.clock_in_time || 'Recorded')}</span>
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
                      <span>Mood: ${escapeHTML(e.mood || '😊')}</span>
                    </div>
                    <div style="color:var(--text-muted); margin-top:0.25rem;">${escapeHTML(e.tasks_completed || e.summary || 'Tasks completed')}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      document.getElementById('hrProfileDrawer').classList.add('active');
    },
    async submitMember(e) {
      if (e && e.preventDefault) e.preventDefault();
      const name = document.getElementById('hrAddName').value.trim();
      const phone = document.getElementById('hrAddPhone').value.trim();
      
      if (!name || !phone) {
        if (window.showToast) window.showToast('Name and phone number are required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('hrSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Onboarding...'; }

      const autoEmpCode = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const payload = {
        name,
        phone,
        emp_code: document.getElementById('hrAddCode').value.trim() || autoEmpCode,
        role: document.getElementById('hrAddRole').value.trim() || 'Specialist',
        department: document.getElementById('hrAddDept').value,
        base_salary: Number(document.getElementById('hrAddSalary').value) || 0,
        bkash: document.getElementById('hrAddBkash').value.trim()
      };

      try {
        await APP_API.post('/team', payload);
        if (window.showToast) window.showToast('Team member onboarded successfully! 🚀', 'success');
        this.closeAddModal();
        loadHROps();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to onboard: ' + e.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Onboard Member & Create Profile'; }
      }
    },
    async approveLeave(id) {
      try {
        await APP_API.put(`/leaves/${id}`, { status: 'Approved' });
        if (window.showToast) window.showToast('Leave request approved! ✅', 'success');
        loadHROps();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to approve leave: ' + e.message, 'error');
      }
    },
    async rejectLeave(id) {
      try {
        await APP_API.put(`/leaves/${id}`, { status: 'Rejected' });
        if (window.showToast) window.showToast('Leave request rejected', 'info');
        loadHROps();
      } catch(e) {
        if (window.showToast) window.showToast('Failed to reject leave: ' + e.message, 'error');
      }
    },
    generatePayslipPDF(code) {
      const member = teamData.find(m => (m.emp_code || m.id) === code || m.name === code);
      if (!member) return;

      if (!window.jspdf || !window.jspdf.jsPDF) {
        if (window.showToast) window.showToast('jsPDF library not loaded', 'error');
        return;
      }

      const doc = new window.jspdf.jsPDF();
      const salary = Number(member.baseSalary || member.base_salary) || 0;
      const monthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      // Header details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237); // Purple
      doc.text("PURPLEBOT DIGITAL", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Plot 7, Road 17, Banani C/A, Dhaka - 1213", 14, 28);
      doc.text("hr@purplebot.digital | +880 1711 019550", 14, 33);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(30, 30, 30);
      doc.text("SALARY PAYSLIP", 120, 25);
      
      // Details
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Period: ${monthStr}`, 120, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 120, 42);

      // Staff Info Box
      doc.setFillColor(245, 243, 255);
      doc.rect(14, 50, 180, 28, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(124, 58, 237);
      doc.text("EMPLOYEE DETAILS", 18, 57);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Name: ${member.name || 'Staff Member'}`, 18, 64);
      doc.text(`Emp Code: ${member.emp_code || member.id || 'N/A'}`, 18, 71);
      doc.text(`Department: ${member.department || 'Production'}`, 110, 64);
      doc.text(`Role: ${member.role || 'Specialist'}`, 110, 71);

      // Earnings Table Header
      let yPos = 90;
      doc.setFillColor(124, 58, 237);
      doc.rect(14, yPos - 6, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Component", 18, yPos);
      doc.text("Amount (BDT)", 150, yPos);

      yPos += 12;
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      
      doc.text("Base Salary", 18, yPos);
      doc.text(`BDT ${salary.toLocaleString()}`, 150, yPos);
      
      yPos += 10;
      const commission = Number(member.earnedCommissions) || 0;
      doc.text("Earned Performance Bonus / Commission", 18, yPos);
      doc.text(`BDT ${commission.toLocaleString()}`, 150, yPos);

      yPos += 15;
      doc.line(14, yPos - 5, 194, yPos - 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Net Payable:", 110, yPos);
      doc.setTextColor(124, 58, 237);
      doc.text(`BDT ${(salary + commission).toLocaleString()}`, 150, yPos);

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text("Confidential — Issued by Purplebot Digital HR Operations", 105, 270, null, null, "center");

      doc.save(`Payslip-${member.emp_code || 'EMP'}-${monthStr.replace(' ', '-')}.pdf`);
      if (window.showToast) window.showToast(`PDF Payslip generated for ${member.name}! 📄`, 'success');
    },

    openInviteModal(code) {
      const member = invitationsData.find(m => m.empCode === code || m.name === code);
      if (!member) return;

      const modal = document.getElementById('hrInviteModal');
      const title = document.getElementById('inviteModalTitle');
      const content = document.getElementById('inviteModalContent');

      if (!modal || !content) return;

      title.textContent = `📋 Send PIN Invitation — ${member.name}`;
      content.innerHTML = `
        <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:12px; border:1px solid var(--border-subtle);">
          <div style="font-weight:700; color:#fff; font-size:1rem; margin-bottom:0.3rem;">${escapeHTML(member.name)} (${escapeHTML(member.empCode)})</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">Role: <b>${escapeHTML(member.role)}</b> (${escapeHTML(member.department)})</div>
          <div style="font-size:0.85rem; color:var(--text-muted); font-family:monospace;">Phone: <b>${escapeHTML(member.phone)}</b></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <button class="btn-primary" style="width:100%; justify-content:center;" onclick='window.HR_MODULE.pushTelegramPin("${member.phone}", "${member.empCode}")'>
            📲 Generate & Push PIN via Telegram
          </button>
          
          <button class="btn-secondary" style="width:100%; justify-content:center;" onclick='window.HR_MODULE.copyWhatsAppInvite("${member.phone}", "${member.empCode}")'>
            📱 Copy WhatsApp Direct Invite Link
          </button>
        </div>

        <div id="inviteResultArea" style="display:none; background:var(--surface-2); padding:1rem; border-radius:12px; border:1px solid var(--border-active); font-size:0.85rem;">
        </div>
      `;

      modal.classList.add('active');
    },

    closeInviteModal() {
      const modal = document.getElementById('hrInviteModal');
      if (modal) modal.classList.remove('active');
    },

    async pushTelegramPin(phone, code) {
      try {
        if (window.showToast) window.showToast('Generating PIN and sending Telegram push...', 'info');
        const res = await APP_API.post('/auth/pin/generate', {
          phone,
          linkedId: code,
          linkedType: 'team',
          sendTelegram: true
        });

        const resultArea = document.getElementById('inviteResultArea');
        if (resultArea && res.success) {
          resultArea.style.display = 'block';
          resultArea.innerHTML = `
            <div style="color:var(--emerald-brand); font-weight:700; margin-bottom:0.4rem;">✅ Temp PIN Generated: <span style="font-size:1.1rem; font-family:monospace;">${res.pin}</span></div>
            <div style="color:var(--text-muted); font-size:0.8rem; margin-bottom:0.6rem;">${res.telegramPushed ? '📲 Telegram push notification sent successfully!' : '⚠️ Telegram ID not linked yet for this member. Share via WhatsApp or text below.'}</div>
            <button class="btn-secondary btn-sm" onclick="navigator.clipboard.writeText(\`${escapeHTML(res.inviteCardText)}\`); if(window.showToast) window.showToast('Invite text copied! 📋', 'success');">📋 Copy Access Card Text</button>
          `;
        }

        if (window.showToast) window.showToast(`PIN ${res.pin} generated for ${phone}! 🔑`, 'success');
        loadHROps();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to generate PIN: ' + (err.message || 'Error'), 'error');
      }
    },

    async copyWhatsAppInvite(phone, code) {
      try {
        const res = await APP_API.post('/auth/pin/generate', {
          phone,
          linkedId: code,
          linkedType: 'team',
          sendTelegram: false
        });

        if (res.whatsappLink) {
          navigator.clipboard.writeText(res.whatsappLink);
          if (window.showToast) window.showToast('WhatsApp link copied to clipboard! 📱', 'success');
          
          const resultArea = document.getElementById('inviteResultArea');
          if (resultArea) {
            resultArea.style.display = 'block';
            resultArea.innerHTML = `
              <div style="color:var(--purple-light); font-weight:700; margin-bottom:0.4rem;">🔑 Temp PIN Generated: <span style="font-size:1.1rem; font-family:monospace;">${res.pin}</span></div>
              <div style="margin-bottom:0.5rem; word-break:break-all;"><a href="${res.whatsappLink}" target="_blank" style="color:var(--purple-light); text-decoration:underline;">Click to Open WhatsApp Web</a></div>
            `;
          }
        }
        loadHROps();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to generate link: ' + (err.message || 'Error'), 'error');
      }
    }
  };

  await loadHROps();
};
