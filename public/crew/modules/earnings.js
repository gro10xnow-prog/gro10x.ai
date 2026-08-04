/**
 * public/crew/modules/earnings.js
 * Crew Workspace Earnings & Payroll Module
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.CREW_MODULES.earnings = async function(container) {
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const baseSalary = Number(user.baseSalary || user.salary || 35000);
  const earnedCommissions = Number(user.earnedCommissions || 4500);
  const totalAccrued = baseSalary + earnedCommissions;

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">💰 Earnings & Payroll Breakdown</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Salary structure, project commissions, and bKash payout schedule.</div>
    </div>

    <!-- Earnings KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <div class="kpi-tile">
        <div class="kpi-label">Base Monthly Salary</div>
        <div class="kpi-val" style="color:var(--text-primary);">৳${baseSalary.toLocaleString()}</div>
        <div class="kpi-sub">Standard Monthly Rate</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">Project Commissions</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">+৳${earnedCommissions.toLocaleString()}</div>
        <div class="kpi-sub">Accrued Performance Bonus</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">Estimated Monthly Payout</div>
        <div class="kpi-val" style="color:var(--purple-light);">৳${totalAccrued.toLocaleString()}</div>
        <div class="kpi-sub" style="color:var(--purple-light);">Scheduled for 1st of Next Month</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">💳 Compensation & Disbursement Info</h3>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
          <div><strong style="color:var(--text-muted);">Staff Name:</strong> ${user.name || 'Specialist'}</div>
          <div><strong style="color:var(--text-muted);">Emp Code:</strong> <span style="color:var(--purple-light); font-weight:700;">${user.emp_code || user.id || 'PBD-001'}</span></div>
          <div><strong style="color:var(--text-muted);">Role / Title:</strong> ${user.role || 'Production Specialist'}</div>
          <div><strong style="color:var(--text-muted);">Department:</strong> ${user.department || 'Production'}</div>
          <div><strong style="color:var(--text-muted);">bKash Disbursement No:</strong> ${user.bankInfo?.mfsNo || user.phone || 'Connected'}</div>
          <div><strong style="color:var(--text-muted);">Payroll Status:</strong> <span class="badge badge-emerald">Active Roster</span></div>
        </div>
      </div>

      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">🏆 Production XP & Level</h3>
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
          <div style="width:50px; height:50px; border-radius:50%; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem; color:#fff;">LV2</div>
          <div>
            <div style="font-weight:700; color:var(--text-primary);">${user.role || 'Senior Production Specialist'}</div>
            <div style="font-size:0.78rem; color:var(--purple-light);">+450 XP Earned This Month</div>
          </div>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          Commissions are disbursed on the 1st of every month via bKash / Direct Bank Wire.
        </div>
      </div>
    </div>
  `;
};
