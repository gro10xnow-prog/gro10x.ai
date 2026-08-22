/**
 * public/crew/modules/leaderboard.js
 * Production XP Leaderboard, Streaks & Department Rankings
 */
window.CREW_MODULES = window.CREW_MODULES || {};

let activeLeaderboardDept = 'All';

window.filterCrewLeaderboard = function(dept) {
  activeLeaderboardDept = dept;
  const filtered = dept === 'All'
    ? window._crewLeaderboardProfiles
    : (window._crewLeaderboardProfiles || []).filter(p => (p.department || '').toLowerCase().includes(dept.toLowerCase()));

  const boardEl = document.getElementById('leaderboardBoard');
  if (boardEl && typeof window._crewRenderLeaderboardFn === 'function') {
    boardEl.innerHTML = window._crewRenderLeaderboardFn(filtered);
  }

  // Update button active states
  const btns = document.querySelectorAll('.lb-filter-btn');
  btns.forEach(b => {
    if (b.getAttribute('data-dept') === dept) {
      b.className = 'lb-filter-btn btn-primary';
    } else {
      b.className = 'lb-filter-btn btn-secondary';
    }
  });
};

window.CREW_MODULES.leaderboard = async function(container) {
  const [me, team, eodReports] = await Promise.all([
    CREW_API.getMe().catch(() => ({})),
    CREW_API.get('/team').catch(() => []),
    CREW_API.get('/team/eod').catch(() => [])
  ]);

  const user = me.user || {};
  const myCode = user.emp_code || user.id;

  const profiles = (team || []).sort((a, b) => (Number(b.xp || 0)) - (Number(a.xp || 0)));

  // Calculate EOD consecutive streak (skipping Fri & Sat weekends)
  function computeStreak(empCode, empName) {
    const myEods = (eodReports || [])
      .filter(e => {
        const idMatch = empCode && (e.employeeId === empCode || e.employee_id === empCode || e.emp_code === empCode);
        const nameMatch = empName && e.name && (e.name.toLowerCase() === empName.toLowerCase());
        return idMatch || nameMatch;
      })
      .map(e => (e.date || e.report_date || e.submitted_at || e.created_at || '').split('T')[0])
      .filter(Boolean)
      .sort()
      .reverse();

    const uniqueDates = [...new Set(myEods)];
    if (!uniqueDates.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mostRecent = new Date(uniqueDates[0]);
    mostRecent.setHours(0, 0, 0, 0);
    const daysSince = Math.round((today - mostRecent) / (1000 * 60 * 60 * 24));
    const todayDay = today.getDay(); // 0=Sun, 5=Fri, 6=Sat

    const isWeekendFresh = (todayDay === 5 && daysSince <= 1) ||
                          (todayDay === 6 && daysSince <= 2) ||
                          (todayDay === 0 && daysSince <= 3);

    const isFresh = daysSince <= 1 || isWeekendFresh;
    if (!isFresh) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      let diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (curr.getDay() === 0 && prev.getDay() === 4 && diff === 3) {
        diff = 1;
      }
      if (curr.getDay() === 0 && prev.getDay() === 5 && diff === 2) {
        diff = 1;
      }
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const depts = ['All', ...new Set(profiles.map(p => p.department || 'General').filter(Boolean))];

  function renderBoard(filteredProfiles) {
    const MEDALS = ['🥇', '🥈', '🥉'];
    if (!filteredProfiles || filteredProfiles.length === 0) {
      return `
        <div class="card-glass" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          No specialists found in this department.
        </div>
      `;
    }

    return filteredProfiles.map((p, idx) => {
      const isMe = (p.emp_code === myCode || p.id === myCode);
      const xpVal = Number(p.xp || 0);
      const streak = computeStreak(p.emp_code || p.id, p.name);
      const rankIcon = MEDALS[idx] || `<span style="font-size:0.9rem; font-weight:800; color:var(--text-muted);">${idx + 1}</span>`;

      return `
        <div class="card-glass" style="
          display:flex;
          align-items:center;
          gap:1.25rem;
          padding:1.1rem 1.35rem;
          border-radius:14px;
          transition:transform 0.15s ease;
          ${isMe ? 'border:1px solid var(--purple-light); background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08)); box-shadow:0 0 20px rgba(139,92,246,0.2);' : ''}
        ">
          <!-- Rank Medal / Number -->
          <div style="font-size:1.6rem; min-width:36px; text-align:center; display:flex; align-items:center; justify-content:center;">
            ${rankIcon}
          </div>

          <!-- Specialist Info -->
          <div style="flex:1; min-width:180px;">
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <span style="font-weight:800; font-size:1rem; color:${isMe ? 'var(--purple-light)' : '#fff'};">
                ${p.name || 'Specialist'}
              </span>
              ${isMe ? `<span class="badge badge-purple" style="font-size:0.7rem; padding:0.15rem 0.5rem;">YOU</span>` : ''}
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
              ${p.role || 'Specialist'} &bull; ${p.department || 'Production'}
            </div>
          </div>

          <!-- XP & Badge & Streak -->
          <div style="text-align:right;">
            <div style="font-weight:900; font-size:1.15rem; color:var(--emerald-brand); font-family:var(--font-heading);">
              ${xpVal.toLocaleString()} <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">XP</span>
            </div>
            <div style="font-size:0.78rem; color:var(--purple-light); font-weight:600; margin-top:0.1rem;">
              ${p.badge || '🌱 Recruit'}
            </div>
            ${streak > 1 ? `
              <div style="font-size:0.72rem; color:orange; font-weight:700; margin-top:0.2rem;">
                🔥 ${streak}-day streak
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window._crewLeaderboardProfiles = profiles;
  window._crewRenderLeaderboardFn = renderBoard;

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🏆 Production XP Leaderboard</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Agency-wide specialist rankings, badges, and consecutive EOD streaks.</div>
      </div>
    </div>

    <!-- Department Filters -->
    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.25rem;">
      ${depts.map(d => `
        <button
          onclick="filterCrewLeaderboard('${d}')"
          data-dept="${d}"
          class="lb-filter-btn ${d === activeLeaderboardDept ? 'btn-primary' : 'btn-secondary'}"
          style="font-size:0.8rem; padding:0.4rem 0.85rem; border-radius:10px; cursor:pointer;"
        >
          ${d}
        </button>
      `).join('')}
    </div>

    <!-- Leaderboard Cards Container -->
    <div id="leaderboardBoard" style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
      ${renderBoard(activeLeaderboardDept === 'All' ? profiles : profiles.filter(p => (p.department || '').toLowerCase().includes(activeLeaderboardDept.toLowerCase())))}
    </div>

    <!-- XP Rules Footer -->
    <div class="card-glass" style="padding:1.25rem; font-size:0.82rem; color:var(--text-muted); line-height:1.6; text-align:center;">
      ⭐ <strong>How to Earn XP:</strong> Complete assigned production tasks (+15 XP) &bull; Submit daily EOD reports on time (+10 XP) &bull; Complete agreement and onboarding milestones (+100–200 XP).
    </div>
  `;
};
