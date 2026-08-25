/**
 * public/crew/modules/home.js
 * Crew Home Dashboard with Live Attendance, EOD Streaks & Quick Action Shortcuts
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.home = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id;

  const [tasks, attendanceRaw, eodHistory] = await Promise.all([
    CREW_API.get('/tasks').catch(() => []),
    CREW_API.get('/team/attendance').catch(() => []),
    CREW_API.get(`/team/eod?employeeId=${encodeURIComponent(empCode || '')}`).catch(() => [])
  ]);
  // Normalize attendance — API may return array or { data: [...] } object
  const attendance = Array.isArray(attendanceRaw) ? attendanceRaw : (Array.isArray(attendanceRaw?.data) ? attendanceRaw.data : []);


  const myTasks = (tasks || []).filter(t => 
    (t.assignee || '').toLowerCase().includes((user.name || '').toLowerCase()) ||
    t.assignee_id === empCode ||
    t.assigneeId === empCode
  );
  const activeCount = myTasks.filter(t => t.stage !== 'Approved' && t.stage !== 'Done' && t.stage !== 'Published').length;

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = (attendance || []).find(a => {
    const dateMatch = (a.date || a.created_at || '').split('T')[0] === today;
    const idMatch = empCode && (a.employeeId === empCode || a.employee_id === empCode || a.emp_code === empCode);
    const nameMatch = user.name && a.name && (a.name.toLowerCase() === user.name.toLowerCase());
    return dateMatch && (idMatch || nameMatch);
  });

  const isClockedIn = !!todayRecord && (
    todayRecord.status === 'In Studio' ||
    (!todayRecord.clockOutTime && !todayRecord.clock_out_time && !!(todayRecord.clockInTime || todayRecord.clock_in_time))
  );

  const rawClockTime = todayRecord?.clockInTime || todayRecord?.clock_in_time;
  let clockedInTime = null;
  if (rawClockTime) {
    if (typeof rawClockTime === 'string' && (rawClockTime.includes('AM') || rawClockTime.includes('PM') || /^\d{1,2}:\d{2}/.test(rawClockTime))) {
      clockedInTime = rawClockTime;
    } else {
      const d = new Date(rawClockTime);
      clockedInTime = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : rawClockTime;
    }
  }

  // Calculate EOD consecutive working-day streak (skipping Fri & Sat weekends)
  const myEods = (eodHistory || [])
    .filter(e => {
      const idMatch = empCode && (e.employeeId === empCode || e.employee_id === empCode || e.emp_code === empCode);
      const nameMatch = user.name && e.name && (e.name.toLowerCase() === user.name.toLowerCase());
      return idMatch || nameMatch;
    })
    .map(e => (e.date || e.report_date || e.submitted_at || e.created_at || '').split('T')[0])
    .filter(Boolean)
    .sort()
    .reverse();

  const uniqueEodDates = [...new Set(myEods)];
  let eodStreak = 0;
  if (uniqueEodDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mostRecent = new Date(uniqueEodDates[0]);
    mostRecent.setHours(0, 0, 0, 0);
    const daysSince = Math.round((today - mostRecent) / (1000 * 60 * 60 * 24));
    const todayDay = today.getDay(); // 0=Sun, 5=Fri, 6=Sat

    // Freshness window: today (0), yesterday (1), or weekend bridges
    const isWeekendFresh = (todayDay === 5 && daysSince <= 1) || // Friday, Thursday EOD is 1 day ago
                          (todayDay === 6 && daysSince <= 2) || // Saturday, Thursday EOD is 2 days ago
                          (todayDay === 0 && daysSince <= 3);   // Sunday, Thursday EOD is 3 days ago / Friday EOD is 2 days ago

    const isFresh = daysSince <= 1 || isWeekendFresh;

    if (isFresh) {
      eodStreak = 1;
      for (let i = 0; i < uniqueEodDates.length - 1; i++) {
        const curr = new Date(uniqueEodDates[i]);
        const prev = new Date(uniqueEodDates[i + 1]);
        let dayDiff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        
        // If Sunday to Thursday gap (3 days spanning Fri & Sat weekend), treat as consecutive
        if (curr.getDay() === 0 && prev.getDay() === 4 && dayDiff === 3) {
          dayDiff = 1;
        }
        // If Sunday to Friday gap (2 days, Friday overtime), treat as consecutive
        if (curr.getDay() === 0 && prev.getDay() === 5 && dayDiff === 2) {
          dayDiff = 1;
        }
        if (dayDiff === 1) {
          eodStreak++;
        } else {
          break;
        }
      }
    }
  }

  const onboardingComplete = user.onboarding_complete || user.onboardingComplete;
  const surveyComplete = user.survey_complete || user.surveyComplete;

  const onboardingBanner = !onboardingComplete ? `
    <div style="background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.12)); border: 1px solid rgba(139,92,246,0.5); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
        <span style="font-size:1.8rem;">📋</span>
        <div>
          <div style="font-size:1rem; font-weight:800; color:#fff;">Complete Your Onboarding</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
            ${surveyComplete
              ? '✅ Survey done — sign your employment agreement to fully unlock your account.'
              : 'Fill your profile survey & sign your employment agreement to unlock all features.'}
          </div>
        </div>
      </div>
      <a href="/team-miniapp.html" class="btn-primary" style="font-size:0.85rem; padding:0.5rem 1.1rem; text-decoration:none; display:inline-block;">
        ${surveyComplete ? '✍️ Review & Sign Agreement →' : '▶ Start Onboarding Survey →'}
      </a>
    </div>
  ` : '';

  container.innerHTML = `
    ${onboardingBanner}
    <div style="margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
        ⚡ Welcome back, ${user.name || 'Specialist'}!
      </h1>
      <div style="font-size: 0.88rem; color: var(--text-muted);">
        Your daily task pipeline and personal workspace.
      </div>
    </div>

    <!-- 3 KPI Widgets (Tasks, Attendance, EOD Streak) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.1rem; margin-bottom: 1.5rem;">
      <a href="#tasks" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Active Tasks</div>
        <div class="kpi-val" style="color:var(--purple-light);">${activeCount}</div>
        <div class="kpi-sub">View My Tasks ▶</div>
      </a>
      <div class="kpi-tile">
        <div class="kpi-label">Today's Attendance</div>
        <div class="kpi-val" style="color:${isClockedIn ? 'var(--emerald-brand)' : todayRecord ? 'var(--text-primary)' : 'var(--text-muted)'};">
          ${isClockedIn ? '🟢 Online' : todayRecord ? '🔴 Clocked Out' : '⏳ Not Clocked In'}
        </div>
        <div class="kpi-sub" style="color:var(--text-muted);">
          ${isClockedIn ? `Since ${clockedInTime || 'earlier today'}` : todayRecord ? 'Shift complete' : 'Clock in via Telegram'}
        </div>
      </div>
      <a href="#leaderboard" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">EOD Streak</div>
        <div class="kpi-val" style="color:orange;">🔥 ${eodStreak}</div>
        <div class="kpi-sub">${eodStreak === 1 ? '1 day' : `${eodStreak} days`} consecutive ▶</div>
      </a>
    </div>

    <!-- Quick Actions Row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 0.65rem; margin-bottom: 1.5rem;">
      <a href="#tasks" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">📋 Tasks</a>
      <a href="#deliverables" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">📤 Deliver</a>
      <a href="#tickets" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">🎟️ Tickets</a>
      <a href="#calendar" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">📅 Calendar</a>
      <a href="#leaderboard" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">🏆 Ranks</a>
      <a href="#eod" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">📝 EOD</a>
      <a href="#expenses" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">🧾 Expense</a>
      <a href="#leaves" class="btn-secondary" style="text-align:center; text-decoration:none; border-radius:12px; padding:0.6rem 0.35rem; font-size:0.82rem; font-weight:700;">🌴 Leaves</a>
    </div>

    <div class="card-glass">
      <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0;">📱 Field Actions (Telegram Bot)</h2>
      <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Clocking in/out, GPS check-ins, and mobile instant reports are synced live with your Telegram Bot.
      </div>
      <a href="https://t.me/purplemanosbot" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none;">🤖 Launch Crew Bot (@purplemanosbot)</a>
    </div>
  `;
};
