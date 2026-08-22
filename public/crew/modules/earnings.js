/**
 * public/crew/modules/earnings.js
 * Crew Workspace Earnings, Payroll Breakdown, Milestone Progress & Mood Analytics
 */
window.CREW_MODULES = window.CREW_MODULES || {};

// Canonical 6-Tier XP Ladder: mirrors src/utils/xp.js
const CREW_XP_TIERS = [
  { level: 'LV6', minXP: 6000, name: 'Maestro', badge: '👑 Maestro' },
  { level: 'LV5', minXP: 3500, name: 'Veteran', badge: '🎖️ Veteran' },
  { level: 'LV4', minXP: 2000, name: 'Champion', badge: '💜 Champion' },
  { level: 'LV3', minXP: 1000, name: 'Performer', badge: '🔥 Performer' },
  { level: 'LV2', minXP: 500,  name: 'Rising Star', badge: '⭐ Rising Star' },
  { level: 'LV1', minXP: 0,    name: 'Recruit', badge: '🌱 Recruit' }
];

function computeXPLevel(xp) {
  const num = Number(xp) || 0;
  const tier = CREW_XP_TIERS.find(t => num >= t.minXP) || CREW_XP_TIERS[CREW_XP_TIERS.length - 1];
  return tier.level;
}

window.openCrewPayslip = async function(btn) {
  const original = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Loading Payslip...';
  }

  // Pre-open window synchronously to preserve user activation gesture on mobile
  const newWin = window.open('', '_blank');

  try {
    const token = localStorage.getItem('sb-access-token') || 
                  localStorage.getItem('purpleos_pin_token') || 
                  localStorage.getItem('purple_token') || '';
    const res = await fetch('/api/team/payslip', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!res.ok) {
      if (newWin) newWin.close();
      throw new Error(`Failed to generate payslip (${res.status})`);
    }

    const html = await res.text();
    if (newWin && !newWin.closed) {
      newWin.document.open();
      newWin.document.write(html);
      newWin.document.close();
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.CREW_MODULES.earnings = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id;

  const eodHistory = await CREW_API.get(`/team/eod?employeeId=${encodeURIComponent(empCode || '')}`).catch(() => []);

  const baseSalary = Number(user.baseSalary || user.salary || 35000);
  const earnedCommissions = Number(user.earnedCommissions || user.earned_commissions || 0);
  const totalAccrued = baseSalary + earnedCommissions;
  const xp = Number(user.xp || 0);
  const level = computeXPLevel(xp);
  const badge = user.badge || '🌱 Recruit';

  // XP Progress Calculation
  const MILESTONES = [500, 1000, 2000, 3500, 6000];
  const nextMilestone = MILESTONES.find(m => m > xp) || 6000;
  const prevMilestone = MILESTONES.filter(m => m <= xp).pop() || 0;
  const progressPct = xp >= 6000 ? 100 : Math.min(100, Math.max(0, Math.round(((xp - prevMilestone) / (nextMilestone - prevMilestone)) * 100)));

  // This month's mood analytics
  const thisMonth = new Date().toISOString().slice(0, 7);
  const myEods = (eodHistory || []).filter(e => {
    const isMine = (e.employeeId === empCode || e.employee_id === empCode || (e.name && (e.name === user.name)));
    const isThisMonth = (e.date || e.report_date || e.created_at || '').startsWith(thisMonth);
    return isMine && isThisMonth;
  });

  const moodTally = {};
  myEods.forEach(e => {
    const m = e.mood || '😊 Energized';
    moodTally[m] = (moodTally[m] || 0) + 1;
  });
  const totalMoodEods = Object.values(moodTally).reduce((a, b) => a + b, 0);

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">💰 Earnings & Payroll Breakdown</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Salary structure, project commissions, and bKash payout schedule.</div>
      </div>
      <button class="btn-primary" style="font-size:0.85rem; padding:0.55rem 1.1rem; border-radius:10px; display:flex; align-items:center; gap:0.4rem; cursor:pointer;" onclick="openCrewPayslip(this)">
        <span>🖨️</span> <span>Print Payslip Statement</span>
      </button>
    </div>

    <!-- Earnings KPI Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <div class="kpi-tile">
        <div class="kpi-label">Base Monthly Salary</div>
        <div class="kpi-val" style="color:var(--text-primary);">${typeof CREW_API.formatBDT === 'function' ? CREW_API.formatBDT(baseSalary) : `৳${baseSalary.toLocaleString()}`}</div>
        <div class="kpi-sub">Fixed Specialist Rate</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">Project Commissions</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">+${typeof CREW_API.formatBDT === 'function' ? CREW_API.formatBDT(earnedCommissions) : `৳${earnedCommissions.toLocaleString()}`}</div>
        <div class="kpi-sub">Accrued Performance Bonus</div>
      </div>
      <div class="kpi-tile">
        <div class="kpi-label">Estimated Monthly Payout</div>
        <div class="kpi-val" style="color:var(--purple-light);">${typeof CREW_API.formatBDT === 'function' ? CREW_API.formatBDT(totalAccrued) : `৳${totalAccrued.toLocaleString()}`}</div>
        <div class="kpi-sub" style="color:var(--purple-light);">Scheduled for 1st of Next Month</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
      <!-- Compensation Details Card -->
      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading); color:#fff;">💳 Compensation & Disbursement</h3>
        <div style="display:flex; flex-direction:column; gap:0.65rem; font-size:0.88rem;">
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Staff Name:</span> <strong>${user.name || 'Specialist'}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Emp Code:</span> <span style="color:var(--purple-light); font-weight:700;">${user.emp_code || user.id || 'PBD-001'}</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Role / Title:</span> <strong>${user.role || 'Production Specialist'}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Department:</span> <strong>${user.department || 'Production'}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">bKash Disbursement:</span> <strong>${user.bankInfo?.mfsNo || user.phone || 'Connected'}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-muted);">Roster Status:</span> <span class="badge badge-emerald">Active Roster</span></div>
        </div>
      </div>

      <!-- XP & Level Card with Progress Bar -->
      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading); color:#fff;">🏆 Production XP & Level</h3>
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
          <div style="width:52px; height:52px; border-radius:50%; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.2rem; color:#fff; box-shadow:0 4px 14px rgba(139,92,246,0.4);">${level}</div>
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--text-primary); font-size:1rem;">${badge}</div>
            <div style="font-size:0.8rem; color:var(--purple-light); margin-top:0.15rem;">${xp.toLocaleString()} XP Total</div>
          </div>
        </div>

        <!-- Progress to Next Tier -->
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.35rem;">
            <span>Tier Progress</span>
            <span>${xp >= 6000 ? 'Max Rank Reached 👑' : `${xp} / ${nextMilestone} XP`}</span>
          </div>
          <div style="background:rgba(255,255,255,0.06); border-radius:8px; height:8px; overflow:hidden; border:1px solid var(--border-subtle);">
            <div style="width:${progressPct}%; height:100%; background:var(--gradient-brand); border-radius:8px; transition:width 0.4s ease;"></div>
          </div>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); line-height:1.4;">
          Earn XP for every deliverable completed (+15 XP), daily EOD submitted (+10 XP), and onboarding milestone unlocked (+100–200 XP).
        </div>
      </div>
    </div>

    <!-- Mood Distribution Analytics Card -->
    <div class="card-glass">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <h3 style="font-size:1.1rem; margin:0; font-family:var(--font-heading); color:#fff;">📊 Daily Mood & Energy Tracker</h3>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Aggregated from your daily End-of-Day (EOD) logs for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.</div>
        </div>
        <span class="badge badge-purple">${totalMoodEods} EOD Reports Logged</span>
      </div>

      ${totalMoodEods === 0 ? `
        <div style="text-align:center; padding:1.75rem; color:var(--text-muted); font-size:0.85rem;">
          No EOD mood reports logged yet this month. Submit your daily EOD report to build your monthly mood telemetry!
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:0.65rem;">
          ${Object.entries(moodTally).map(([mood, count]) => {
            const pct = Math.round((count / totalMoodEods) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">
                  <span>${mood}</span>
                  <span style="color:var(--text-muted); font-weight:700;">${count} day${count > 1 ? 's' : ''} (${pct}%)</span>
                </div>
                <div style="background:rgba(255,255,255,0.06); border-radius:6px; height:8px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:var(--gradient-brand); border-radius:6px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
};
