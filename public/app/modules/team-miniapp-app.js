// ══════════════════════════════════════════
  // TELEGRAM WEBAPP INIT
  // ══════════════════════════════════════════
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.expand();
      tg.ready();
      if (tg.colorScheme === 'dark') {
        document.body.classList.add('tg-dark-theme');
      }
      if (tg.setHeaderColor) tg.setHeaderColor('secondary_bg_color');
    } catch(e) {}
    if (tg.showAlert) {
      const origShowAlert = tg.showAlert.bind(tg);
      tg.showAlert = function(message, callback) {
        try {
          origShowAlert(message, callback);
        } catch(err) {
          try { alert(message); } catch(e) {}
          if (typeof callback === 'function') callback();
        }
      };
    }
  }

  function triggerHaptic(type = 'medium') {
    if (tg && tg.HapticFeedback) {
      try { tg.HapticFeedback.impactOccurred(type); } catch(e) {}
    }
  }

  function authHeaders() {
    const token = sessionStorage.getItem('jwt_token') ||
                  localStorage.getItem('sb-access-token') ||
                  localStorage.getItem('gro10x_token') ||
                  localStorage.getItem('gro10x_token');
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  let currentUser = null;
  let currentPart = 1;
  let clockTimer = null;

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════
  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const qToken = urlParams.get('token');
    if (qToken) {
      sessionStorage.setItem('jwt_token', qToken);
      localStorage.setItem('gro10x_token', qToken);
      localStorage.setItem('sb-access-token', qToken);
    }

    const tgUser = tg?.initDataUnsafe?.user;

    // ── Web (JWT) fallback path ──────────────────────────────────────────────
    const webToken = qToken ||
                     sessionStorage.getItem('jwt_token') ||
                     localStorage.getItem('sb-access-token') ||
                     localStorage.getItem('gro10x_token');
    if (!tgUser && !window.location.search.includes('debug') && !webToken) {
      showLock();
      return;
    }

    // Mirror web token into sessionStorage so authHeaders() works everywhere
    if (webToken && !sessionStorage.getItem('jwt_token')) {
      sessionStorage.setItem('jwt_token', webToken);
    }

    const telegramId = tgUser?.id || null;
    const initDataStr = tg?.initData || '';
    try {
      // If in Telegram Mini App: exchange telegramId/initData for signed JWT token
      if (telegramId || initDataStr) {
        const authRes = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, initData: initDataStr, userType: 'team' })
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.token) sessionStorage.setItem('jwt_token', authData.token);
        }
      }

      const token = sessionStorage.getItem('jwt_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (initDataStr) headers['x-telegram-init-data'] = initDataStr;

      // Fetch profile — use telegramId if available, else use /api/team/me (web JWT)
      let res;
      if (telegramId) {
        res = await fetch(`/api/team/me?telegramId=${telegramId}`, { headers });
      } else {
        res = await fetch('/api/team/me', { headers });
      }
      if (!res.ok) { showLock(); return; }
      const data = await res.json();
      const emp = data.profile || data; // fallback in case API changes back
      if (!emp || !emp.id) { showLock(); return; }
      currentUser = emp;
      window._currentUserActivity = data.recentActivity || [];
      if (data.recentActivity && data.recentActivity.length > 0) {
        const dot = document.getElementById('notifBadgeDot');
        if (dot) dot.style.display = 'block';
      }
      renderDashboard(emp, data.myTasks || [], data.attendanceToday || null);
      loadMyStats();

      // Deep linking tab support (?tab=tasks, ?tab=pay, etc.)
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const actionParam = urlParams.get('action');
      const editParam = urlParams.get('edit');

      if (tabParam === 'tasks') {
        showPage('pageTasks');
        if (typeof loadUserTasks === 'function') loadUserTasks();
        if (actionParam === 'new') openCreateTaskModal();
      } else if (tabParam === 'pay' || tabParam === 'bank') {
        showPage('pagePay');
        if (typeof loadPayData === 'function') loadPayData();
        if (tabParam === 'bank' || editParam === '1') openSurveyPart(3);
      } else if (tabParam === 'profile') {
        showPage('pageProfile');
      } else if (tabParam === 'attendance') {
        showPage('pageAttendance');
        if (typeof startClock === 'function') startClock();
      } else if (tabParam === 'expense' || actionParam === 'expense') {
        showPage('pageHome');
        openExpenseForm();
      } else if (tabParam === 'leave' || actionParam === 'leave') {
        showPage('pageHome');
        openLeaveForm();
      } else if (tabParam === 'eod' || actionParam === 'eod') {
        showPage('pageHome');
        openEODForm();
      }
    } catch (e) {
      // Fallback: show dashboard with basic info for debug
      currentUser = { name: tgUser?.first_name || 'Team Member', role: 'Specialist', department: 'Production', accessLevel: 'Specialist / Crew', xp: 0, badge: '🌱 Recruit', status: 'Offline', onboardingComplete: false, bankInfo: {} };
      renderDashboard(currentUser, [], null);
    }
  }

  function showLock() {
    document.getElementById('lockScreen').classList.add('visible');
  }

  // ══════════════════════════════════════════
  // RENDER DASHBOARD
  // ══════════════════════════════════════════
  function renderDashboard(emp, myTasks = [], attendanceToday = null) {
    document.getElementById('mainDashboard').style.display = 'block';

    // Hero
    const initials = (emp.name || 'PB').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('heroAvatar').textContent = initials;
    document.getElementById('heroName').textContent = emp.name || 'Team Member';
    document.getElementById('heroRole').textContent = `${emp.role || 'Specialist'} · ${emp.department || 'Production'}`;
    setStatusPill(emp.status || 'Offline');
    updateClockButton(emp.status || 'Offline');
    document.getElementById('heroXP').textContent = `🏆 ${emp.xp || 0} XP`;
    document.getElementById('heroBadge').textContent = emp.badge || '🌱 Recruit';

    if (attendanceToday) {
      window._todayAttendance = attendanceToday;
      renderTodaySessionCard(attendanceToday);
    }

    // XP Progress Bar
    const xp = emp.xp || 0;
    let nextXP = 500;
    let nextTier = '⭐ Rising Star';
    if (xp >= 500 && xp < 1000) { nextXP = 1000; nextTier = '🔥 Performer'; }
    else if (xp >= 1000 && xp < 2000) { nextXP = 2000; nextTier = '💜 Champion'; }
    else if (xp >= 2000) { nextXP = 5000; nextTier = '🚀 Legend'; }
    
    const pct = Math.min(100, Math.round((xp / nextXP) * 100));
    const fillEl = document.getElementById('xpBarFill');
    if (fillEl) fillEl.style.width = `${pct}%`;
    const labelEl = document.getElementById('xpBarLabel');
    if (labelEl) labelEl.textContent = `${xp} / ${nextXP} XP to ${nextTier}`;

    // Profile
    const avatarEl = document.getElementById('profileAvatarLg');
    if (emp.avatarUrl) {
      avatarEl.innerHTML = `<img src="${emp.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarEl.textContent = initials;
    }
    document.getElementById('profileName').textContent = emp.name || '—';
    document.getElementById('profileRole').textContent = `${emp.role || 'Specialist'} · ${emp.department || 'Production'}`;
    document.getElementById('profileId').textContent = emp.id || '—';
    document.getElementById('profileDept').textContent = emp.department || '—';
    document.getElementById('profileEmail').textContent = emp.email || emp.workEmail || 'Not set';
    const pEmailEl = document.getElementById('profilePersonalEmail');
    if (pEmailEl) pEmailEl.textContent = emp.personalEmail || 'Not set';
    document.getElementById('profileEmergency').textContent = emp.emergencyContact || 'Not set';
    document.getElementById('profileAddress').textContent = emp.address || 'Not set';
    document.getElementById('profileXP').textContent = `${emp.xp || 0} XP · ${emp.badge || '🌱 Recruit'}`;

    // Pre-fill survey verified identity
    document.getElementById('prefName').textContent = emp.name || '—';
    document.getElementById('prefPhone').textContent = emp.phone ? `+88${emp.phone}` : '—';
    document.getElementById('prefRole').textContent = emp.role || '—';
    document.getElementById('prefDept').textContent = emp.department || '—';
    document.getElementById('prefEmail').textContent = emp.email || '—';

    // Tech Admin panel
    const isTechAdmin = emp.id === 'PBD-000' || emp.role === 'Technology Admin';
    if (isTechAdmin) document.getElementById('adminSection').style.display = 'block';

    // Onboarding banner
    if (emp.onboardingComplete) {
      document.getElementById('onboardingBanner').style.display = 'none';
    } else {
      renderOnboardingBanner(emp);
    }

    // Quick actions
    renderQuickActions(emp);

    // Load team snapshot
    loadTeamSnapshot();
  }

  function setStatusPill(status) {
    const pill = document.getElementById('heroStatus');
    const iconMap = { 'In Studio': '🟢', 'On Field Shoot': '🎬', 'On Leave': '🌴', 'Offline': '⬛' };
    pill.textContent = `${iconMap[status] || '⬛'} ${status}`;
    pill.className = 'pill ' + (status === 'In Studio' ? 'pill-green' : status === 'On Leave' ? 'pill-white' : 'pill-white');
  }

  // ══════════════════════════════════════════
  // ONBOARDING BANNER
  // ══════════════════════════════════════════
  const ONBOARDING_STEPS = [
    'Personal & Family Profile',
    'National Verification & Education',
    'Financial, Salary & Payroll Setup',
    'Work Skills & Equipment',
    'Employment Agreement & E-Sign'
  ];

  function renderOnboardingBanner(emp) {
    const p = emp.surveyProgress || 0; // 0-4 (parts completed), 5 = agreement done
    const stepIdx = Math.min(p, 4);
    document.getElementById('obLabel').textContent = `Step ${stepIdx + 1} of 5 — ${ONBOARDING_STEPS[stepIdx]}`;
    document.getElementById('obSubText').textContent = stepIdx === 4 ? '🎉 Survey done! Sign your agreement.' : `${stepIdx} of 4 profile parts complete`;
    const btn = document.getElementById('obContinueBtn');
    btn.textContent = stepIdx === 0 ? '▶ Start Setup' : stepIdx === 4 ? '✍️ Review & Sign Agreement' : `▶ Continue — Part ${stepIdx + 1}`;
    if (stepIdx === 4) {
      btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      btn.style.borderColor = '#b45309';
    }

    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`obDot${i}`);
      dot.className = 'ob-dot' + (i - 1 < p ? ' done' : i - 1 === p ? ' active' : '');
    }
  }

  // ══════════════════════════════════════════
  // QUICK ACTIONS (role-adaptive)
  // ══════════════════════════════════════════
  function renderQuickActions(emp) {
    const grid = document.getElementById('quickActionsGrid');
    const level = emp.accessLevel || 'Specialist / Crew';
    const isClockedIn = emp?.status === 'In Studio' || emp?.status === 'On Field Shoot';

    const allActions = {
      // ── Standard employee (everyone gets these)
      clockToggle: { icon: isClockedIn ? '🚪' : '📍', label: isClockedIn ? 'Clock Out' : 'Clock In', fn: "handleClockToggle()" },
      tasks:      { icon: '📋', label: 'My Tasks',       fn: "showPage('pageTasks');loadUserTasks();" },
      pay:        { icon: '💰', label: 'My Earnings',    fn: "showPage('pagePay');loadPayData();" },
      bank:       { icon: '🏦', label: 'Bank/bKash',     fn: "showPage('pagePay');loadPayData();" },
      profile:    { icon: '👤', label: 'Profile',        fn: "showPage('pageProfile');" },
      expense:    { icon: '🧾', label: 'Expense',        fn: "openExpenseForm();" },
      leave:      { icon: '🌴', label: 'Leave Req',      fn: "openLeaveForm();" },
      eod:        { icon: '📝', label: 'EOD Report',     fn: "openEODForm();" },
      // ── Executive / Director layer
      briefing:   { icon: '🌅', label: 'Briefing',       fn: "loadMorningBriefing();" },
      team:       { icon: '👥', label: 'Team Live',      fn: "loadRosterPage();" },
      finance:    { icon: '💳', label: 'Finance',        fn: "loadFinanceSummary();" },
      approvals:  { icon: '✍️', label: 'Approvals',      fn: "loadPendingApprovals();" },
      expQueue:   { icon: '💸', label: 'Exp Queue',      fn: "loadExpenseQueue();" },
      clients:    { icon: '🎬', label: 'Clients',        fn: "loadClientStatus();" },
      payroll:    { icon: '📊', label: 'Payroll',        fn: "loadPayrollSummary();" },
      // ── Tech Admin only
      admin:      { icon: '🛠️', label: 'Admin',          fn: "showPage('pageProfile');document.getElementById('adminSection').scrollIntoView({behavior:'smooth'});" },
    };

    let keys = [];
    const isTech = emp.id === 'PBD-000' || emp.role === 'Technology Admin';

    if (level === 'Owner / Admin') {
      keys = isTech
        ? ['clockToggle', 'briefing', 'team', 'approvals', 'tasks', 'expense', 'leave', 'eod', 'pay', 'bank', 'clients', 'admin']
        : ['clockToggle', 'briefing', 'team', 'approvals', 'expQueue', 'clients', 'tasks', 'expense', 'leave', 'eod', 'pay', 'bank'];
    } else if (level === 'Director / Manager') {
      keys = ['clockToggle', 'team', 'tasks', 'briefing', 'expense', 'leave', 'eod', 'pay', 'bank', 'profile'];
    } else if (level === 'Finance Manager') {
      keys = ['clockToggle', 'expQueue', 'payroll', 'finance', 'expense', 'leave', 'eod', 'pay', 'bank', 'profile'];
    } else {
      // Specialist / Crew — standard set
      keys = ['clockToggle', 'tasks', 'expense', 'leave', 'eod', 'pay', 'bank', 'profile'];
    }

    grid.innerHTML = keys.map(k => {
      const a = allActions[k];
      if (!a) return '';
      return `<button class="qa-btn" onclick="triggerHaptic('medium');${a.fn}">
        <div class="qa-icon">${a.icon}</div>
        <div class="qa-label">${a.label}</div>
      </button>`;
    }).join('');
  }

  // ══════════════════════════════════════════
  // PAGE NAVIGATION
  // ══════════════════════════════════════════
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const map = { pageHome: 'navHome', pageTasks: 'navTasks', pageAttendance: 'navAttendance', pagePay: 'navPay', pageProfile: 'navProfile' };
    if (map[pageId]) document.getElementById(map[pageId]).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'pagePay') {
      loadPayData();
      loadLeaveHistory();
      loadExpenseHistory();
    } else if (pageId === 'pageAttendance') {
      loadAttendanceHistory();
    } else if (pageId === 'pageProfile') {
      loadEODHistory();
      loadXPLeaderboard();
    }
  }

  // ══════════════════════════════════════════
  // SURVEY MODAL
  // ══════════════════════════════════════════
  const STEP_INFO = [
    { label: 'PART 1 OF 4', title: 'Personal & Family Profile' },
    { label: 'PART 2 OF 4', title: 'National Verification & Education' },
    { label: 'PART 3 OF 4', title: 'Financial, Salary & Payroll Setup' },
    { label: 'PART 4 OF 4', title: 'Skills, Merch & Equipment' },
    { label: 'FINAL STEP', title: 'Employment Agreement & E-Sign' },
  ];

  function openSurvey() {
    const progress = currentUser?.surveyProgress || 0;
    goToSurveyPart(Math.min(progress + 1, 5));
    document.getElementById('surveyModal').classList.add('open');
  }

  function openSurveyPart(partNumber) {
    goToSurveyPart(partNumber);
    document.getElementById('surveyModal').classList.add('open');
  }

  function closeSurvey() {
    document.getElementById('surveyModal').classList.remove('open');
  }

  // ══════════════════════════════════════════
  // TASK CREATION MODAL
  // ══════════════════════════════════════════
  function openCreateTaskModal() {
    document.getElementById('createTaskModal').style.display = 'block';
  }
  function closeCreateTaskModal() {
    document.getElementById('createTaskModal').style.display = 'none';
  }
  async function submitNewTask(e) {
    e.preventDefault();
    const tmplId = document.getElementById('miniappTemplateSelect')?.value;
    const title = document.getElementById('newTaskTitle').value.trim();
    const client = document.getElementById('newTaskClient').value.trim();
    const workflow_type = document.getElementById('newTaskWorkflow')?.value || 'video';
    const stage = document.getElementById('newTaskStage').value;
    const dueDate = document.getElementById('newTaskDueDate').value;
    const priority = document.getElementById('newTaskPriority')?.value || 'Medium';
    const assignee = currentUser?.name || 'Unassigned';

    if (tmplId) {
      try {
        const res = await fetch(`/api/task-templates/${tmplId}/instantiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client, assignee, dueDate, workflow_type, priority })
        });
        const data = await res.json();
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        showMiniappToast(`🚀 Blueprint launched! ${data.subtasksCreated || 0} subtasks created.`);
      } catch (err) {
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        showMiniappToast('🚀 Blueprint launched!');
      }
    } else {
      const payload = { title, client, stage, due_date: dueDate, assignee, workflow_type, priority };
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        showMiniappToast('✅ Task created successfully!');
      } catch (err) {
        showMiniappToast('⚠️ Task saved — sync pending', 'info');
      }
    }
    closeCreateTaskModal();
    showPage('pageTasks');
    if (typeof loadUserTasks === 'function') loadUserTasks();
  }

  function goToSurveyPart(part) {
    currentPart = part;
    ['surveyPart1','surveyPart2','surveyPart3','surveyPart4','surveyAgreement'].forEach((id, i) => {
      document.getElementById(id).style.display = (i + 1 === part) ? 'block' : 'none';
    });
    const info = STEP_INFO[part - 1];
    document.getElementById('surveyStepLabel').textContent = info.label;
    document.getElementById('surveyStepTitle').textContent = info.title;

    // Dots
    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`sdot${i}`);
      dot.className = 'ob-dot' + (i < part ? ' done' : i === part ? ' active' : '');
    }

    // ── Pre-fill saved data from Supabase (via currentUser) ──
    if (currentUser) {
      const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

      if (part === 1) {
        setVal('inpEmergency', currentUser.emergencyContact);
        setVal('inpAddress', currentUser.address);
        setVal('inpPersonalEmail', currentUser.personalEmail);
        setVal('inpBlood', currentUser.bloodGroup);
        // Relation is not stored separately — leave blank
      }
      if (part === 2) {
        setVal('inpNID', currentUser.nidNo);
        setVal('inpPermAddress', currentUser.permanentAddress);
      }
      if (part === 3 && currentUser.bankInfo) {
        const b = currentUser.bankInfo;
        setVal('inpBankName', b.bankName);
        setVal('inpAccountTitle', b.accountTitle);
        setVal('inpAccountNo', b.accNo);
        setVal('inpBranch', b.branch);
        setVal('inpBkash', b.mfsNo);
      }
      if (part === 4) {
        setVal('inpPrimarySkill', currentUser.primarySkill);
      }
      // Fill agreement fields
      if (part === 5) {
        setTxt('agrEmpName', currentUser.name || '—');
        setTxt('agrEmpCode', currentUser.id || '—');
        setTxt('agrRole', currentUser.role || '—');
        setTxt('agrJoiningDate', currentUser.joiningDate || new Date().toLocaleDateString('en-CA'));
        setTxt('agrSalary', (currentUser.baseSalary || 0).toLocaleString());
      }
    }

    document.getElementById('surveyModal').scrollTop = 0;
  }

  // ══════════════════════════════════════════
  // XP CALCULATORS
  // ══════════════════════════════════════════
  function calcXP(fields) {
    let xp = 0;
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el && el.value && el.value.trim()) xp += f.xp;
    });
    return xp;
  }

  const part1Fields = [
    { id: 'inpEmergency', xp: 5 }, { id: 'inpRelation', xp: 5 }, { id: 'inpAddress', xp: 5 },
    { id: 'inpBlood', xp: 5 }, { id: 'inpMarital', xp: 5 }, { id: 'inpJoiningDate', xp: 5 },
    { id: 'inpDob', xp: 5 }, { id: 'inpPersonalEmail', xp: 5 },
    { id: 'depFather', xp: 5 }, { id: 'depMother', xp: 5 }, { id: 'depSpouse', xp: 5 },
    { id: 'depChild1', xp: 5 }, { id: 'depChild2', xp: 5 }
  ];
  function calcPart1XP() { const x = calcXP(part1Fields); document.getElementById('surveyXpBadge').textContent = `🏆 +${x} XP`; }

  const part2Fields = [
    { id: 'inpNid', xp: 5 }, { id: 'inpPermAddress', xp: 5 }, { id: 'inpTin', xp: 5 },
    { id: 'inpLicense', xp: 5 }, { id: 'inpDegree', xp: 5 }, { id: 'inpInstitution', xp: 5 },
    { id: 'inpPassingYear', xp: 5 }, { id: 'fileNidDoc', xp: 10 }, { id: 'fileCertDoc', xp: 10 }
  ];
  function calcPart2XP() { const x = calcXP(part2Fields); document.getElementById('surveyXpBadge').textContent = `🏆 +${x} XP`; }

  const part3Fields = [
    { id: 'inpBaseSalary', xp: 5 }, { id: 'inpCommission', xp: 5 }, { id: 'inpBankName', xp: 5 },
    { id: 'inpAccTitle', xp: 5 }, { id: 'inpAccNo', xp: 5 }, { id: 'inpBranchRouting', xp: 5 },
    { id: 'inpBkash', xp: 5 }, { id: 'inpNagad', xp: 5 }, { id: 'inpRocket', xp: 5 },
    { id: 'fileBankDoc', xp: 10 }
  ];
  function calcPart3XP() { const x = calcXP(part3Fields); document.getElementById('surveyXpBadge').textContent = `🏆 +${x} XP`; }

  const part4Fields = [
    { id: 'inpSkillPrimary', xp: 5 }, { id: 'inpSkillSecondary', xp: 5 }, { id: 'inpPortfolio', xp: 5 },
    { id: 'inpLaptopSerial', xp: 5 }, { id: 'inpStudioGear', xp: 5 }, { id: 'inpTshirt', xp: 5 },
    { id: 'inpDietary', xp: 5 }, { id: 'fileEquipmentDoc', xp: 10 }
  ];
  function calcPart4XP() { const x = calcXP(part4Fields); document.getElementById('surveyXpBadge').textContent = `🏆 +${x} XP`; }

  // ══════════════════════════════════════════
  // SUBMIT SURVEY PARTS
  // ══════════════════════════════════════════
  async function submitPart(partNum, payload, xp, emoji, title, sub, nextPart) {
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || null;
      const body = { part: partNum, data: payload };
      if (telegramId) body.telegramId = telegramId;
      await fetch('/api/team/survey', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
    } catch (e) {}

    if (currentUser) currentUser.surveyProgress = Math.max(currentUser.surveyProgress || 0, partNum);
    showPhaseGate(emoji, title, xp, sub, () => {
      closeSurvey();
      renderOnboardingBanner(currentUser);
      setTimeout(() => openSurveyPart(nextPart), 200);
    });
  }

  function openSurveyPart(part) {
    goToSurveyPart(part);
    document.getElementById('surveyModal').classList.add('open');
  }

  function submitPart1() {
    const emerg = document.getElementById('inpEmergency').value.trim();
    if (!emerg) { if (tg?.showAlert) tg.showAlert('Please enter emergency contact number.'); else alert('Please enter emergency contact number.'); return; }
    const xp = calcXP(part1Fields);
    submitPart(1, {
      emergencyPhone: emerg,
      emergencyContact: emerg,
      emergencyRelation: document.getElementById('inpRelation').value,
      address: document.getElementById('inpAddress').value,
      bloodGroup: document.getElementById('inpBlood').value,
      maritalStatus: document.getElementById('inpMarital').value,
      joiningDate: document.getElementById('inpJoiningDate').value,
      dob: document.getElementById('inpDob').value,
      personalEmail: document.getElementById('inpPersonalEmail').value,
      dependents: {
        father: document.getElementById('depFather').value,
        mother: document.getElementById('depMother').value,
        spouse: document.getElementById('depSpouse').value,
        child1: document.getElementById('depChild1').value,
        child2: document.getElementById('depChild2').value
      }
    }, xp, '🙌', 'Part 1 Saved!', `+${xp} XP earned • Next: National Verification`, 2);
  }

  function submitPart2() {
    const nid = document.getElementById('inpNid').value.trim();
    if (!nid) { if (tg?.showAlert) tg.showAlert('Please enter NID / Passport number.'); else alert('Please enter NID / Passport number.'); return; }
    const xp = calcXP(part2Fields);
    submitPart(2, {
      nidNo: nid,
      nid: nid,
      permanentAddress: document.getElementById('inpPermAddress').value,
      permAddress: document.getElementById('inpPermAddress').value,
      tin: document.getElementById('inpTin').value,
      license: document.getElementById('inpLicense').value,
      degree: document.getElementById('inpDegree').value,
      institution: document.getElementById('inpInstitution').value,
      passingYear: document.getElementById('inpPassingYear').value
    }, xp, '🎓', 'Part 2 Saved!', `+${xp} XP • Next: Financial Setup`, 3);
  }

  function submitPart3() {
    const bkash = document.getElementById('inpBkash').value.trim();
    if (!bkash) { if (tg?.showAlert) tg.showAlert('Please enter your bKash number.'); else alert('Please enter your bKash number.'); return; }
    const xp = calcXP(part3Fields);
    if (currentUser) {
      currentUser.bankInfo = {
        bankName: document.getElementById('inpBankName').value,
        accountTitle: document.getElementById('inpAccTitle').value,
        accTitle: document.getElementById('inpAccTitle').value,
        accountNo: document.getElementById('inpAccNo').value,
        accNo: document.getElementById('inpAccNo').value,
        branch: document.getElementById('inpBranchRouting').value,
        bkashNo: bkash,
        mfsNo: bkash
      };
    }
    submitPart(3, {
      baseSalary: Number(document.getElementById('inpBaseSalary').value) || 0,
      commission: document.getElementById('inpCommission').value,
      bankName: document.getElementById('inpBankName').value,
      accountTitle: document.getElementById('inpAccTitle').value,
      accTitle: document.getElementById('inpAccTitle').value,
      accountNo: document.getElementById('inpAccNo').value,
      accNo: document.getElementById('inpAccNo').value,
      branch: document.getElementById('inpBranchRouting').value,
      bkashNo: bkash,
      bkash: bkash,
      nagadNo: document.getElementById('inpNagad').value,
      nagad: document.getElementById('inpNagad').value,
      rocketNo: document.getElementById('inpRocket').value,
      rocket: document.getElementById('inpRocket').value
    }, xp, '💳', 'Part 3 Saved!', `+${xp} XP • Next: Skills & Equipment`, 4);
  }

  function submitPart4() {
    const skill = document.getElementById('inpSkillPrimary').value.trim();
    if (!skill) { if (tg?.showAlert) tg.showAlert('Please enter your primary skillset.'); else alert('Please enter your primary skillset.'); return; }
    const xp = calcXP(part4Fields);
    submitPart(4, {
      primarySkill: skill,
      skillPrimary: skill,
      skillSecondary: document.getElementById('inpSkillSecondary').value,
      portfolio: document.getElementById('inpPortfolio').value,
      laptopSerial: document.getElementById('inpLaptopSerial').value,
      studioGear: document.getElementById('inpStudioGear').value,
      tshirtSize: document.getElementById('inpTshirt').value,
      dietary: document.getElementById('inpDietary').value
    }, xp, '🏆', 'Survey Complete!', `+${xp} XP • Now sign your employment agreement`, 5);
  }

  async function submitEmployeeSignature() {
    const sig = document.getElementById('inpSignName').value.trim();
    const consented = document.getElementById('chkAgrConsent').checked;
    if (!sig) { if (tg?.showAlert) tg.showAlert('Please type your full legal name as e-signature.'); else alert('Please type your full legal name as e-signature.'); return; }
    if (!consented) { if (tg?.showAlert) tg.showAlert('Please read and accept the agreement terms.'); else alert('Please read and accept the agreement terms.'); return; }
    if (sig.toLowerCase() !== (currentUser?.name || '').toLowerCase()) {
      if (!confirm(`Name "${sig}" doesn't exactly match your registered name. Continue anyway?`)) return;
    }

    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || null;
      const body = { stage: 1, signature: sig, timestamp: new Date().toISOString() };
      if (telegramId) body.telegramId = telegramId;
      await fetch('/api/team/agreement', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body)
      });
    } catch (e) {}

    // Update stage tracker UI
    document.getElementById('agrStage1').className = 'agr-stage done';
    document.getElementById('agrStage1').textContent = '✅ Employee\nSigned';
    document.getElementById('agrStage2').className = 'agr-stage active';

    showPhaseGate('✍️', 'Agreement Signed!', 0,
      'Finance Manager (Borhan Siddique) will countersign within 24h. You\'ll get a Telegram notification when it\'s done.',
      () => { closeSurvey(); }
    );
  }

  // ══════════════════════════════════════════
  // PHASE GATE SUCCESS OVERLAY
  // ══════════════════════════════════════════
  function showPhaseGate(emoji, title, xp, sub, callback) {
    document.getElementById('successEmoji').textContent = emoji;
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successXP').textContent = xp > 0 ? `+${xp} XP Earned` : '';
    document.getElementById('successSub').textContent = sub;
    document.getElementById('successOverlay').classList.add('visible');
    const bar = document.querySelector('.success-bar-fill');
    bar.style.animation = 'none'; bar.offsetHeight;
    bar.style.animation = 'fillBar 2.2s ease forwards';
    setTimeout(() => {
      document.getElementById('successOverlay').classList.remove('visible');
      if (callback) callback();
    }, 2800);
  }

  // ══════════════════════════════════════════
  // CLOCK & ATTENDANCE
  // ══════════════════════════════════════════
  function startClock() {
    if (clockTimer) clearInterval(clockTimer);
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
    loadAttendanceCalendar(currentCalYear, currentCalMonth);
  }

  function parseTimeString(timeStr, dateStr) {
    if (!timeStr) return null;
    const todayStr = dateStr || new Date().toISOString().split('T')[0];
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) return null;
    const [t, meridiem] = parts;
    let [h, m] = t.split(':').map(Number);
    if (meridiem.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
    return new Date(`${todayStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  }

  function getShiftDuration(clockInStr, dateStr) {
    const start = parseTimeString(clockInStr, dateStr);
    if (!start) return null;
    const diff = Date.now() - start.getTime();
    if (diff < 0) return null;
    const totalMins = Math.floor(diff / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  }

  function updateClock() {
    const now = new Date();
    document.getElementById('attClock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('attDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Live Shift Counter
    const durationEl = document.getElementById('shiftDuration');
    if (durationEl) {
      const isClocked = currentUser?.status === 'In Studio' || currentUser?.status === 'On Field Shoot';
      const clockInStr = window._todayAttendance?.clockInTime;
      const dateStr = window._todayAttendance?.date;
      if (isClocked && clockInStr) {
        const dur = getShiftDuration(clockInStr, dateStr);
        durationEl.textContent = dur ? `⏱️ ${dur} on shift` : '🟢 Clocked In';
      } else {
        durationEl.textContent = '─ Not clocked in';
      }
    }
  }

  function updateClockButton(status) {
    const btn = document.getElementById('attClockBtn');
    if (!btn) return;
    const isClockedIn = status === 'In Studio' || status === 'On Field Shoot';
    btn.className = isClockedIn ? 'btn-clock-out' : 'btn-clock-in';
    btn.innerHTML = isClockedIn ? '🚪 Clock Out — End Shift' : '🟢 Clock In — Share GPS Location';
  }

  async function handleClockToggle() {
    triggerHaptic('medium');
    const isClockedIn = currentUser?.status === 'In Studio' || currentUser?.status === 'On Field Shoot';
    if (isClockedIn) {
      await handleClockOut();
    } else {
      await handleClockIn();
    }
  }

  async function handleClockIn() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await doClockIn(pos.coords.latitude, pos.coords.longitude, true);
      }, async () => { await doClockIn(null, null, false); });
    } else {
      await doClockIn(null, null, false);
    }
  }

  async function doClockIn(lat, lng, gps) {
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || 'debug';
      const res = await fetch('/api/team/clockin', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ telegramId, lat, lng, gps })
      });
      const data = await res.json();
      if (data.time) {
        window._todayAttendance = { clockInTime: data.time, date: new Date().toISOString().split('T')[0], location: 'Studio' };
      }
    } catch (e) {}
    if (currentUser) currentUser.status = 'In Studio';
    setStatusPill('In Studio');
    const pill = document.getElementById('attStatusPill');
    if (pill) { pill.textContent = '🟢 Clocked In'; pill.className = 'att-status-pill att-pill-online'; }
    updateClockButton('In Studio');
    renderTodaySessionCard(window._todayAttendance);
    tg?.showAlert ? tg.showAlert('✅ Clocked in successfully!') : alert('✅ Clocked in!');
  }

  async function handleClockOut() {
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || 'debug';
      const res = await fetch('/api/team/clockout', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ telegramId })
      });
      const data = await res.json();
      if (window._todayAttendance && data.time) {
        window._todayAttendance.clockOutTime = data.time;
      }
    } catch (e) {}
    if (currentUser) currentUser.status = 'Offline';
    setStatusPill('Offline');
    const pill = document.getElementById('attStatusPill');
    if (pill) { pill.textContent = '⬛ Offline'; pill.className = 'att-status-pill att-pill-offline'; }
    updateClockButton('Offline');
    renderTodaySessionCard(window._todayAttendance);
    tg?.showAlert ? tg.showAlert('🚪 Clocked out. Have a great evening!') : alert('🚪 Clocked out!');
  }

  // ══════════════════════════════════════════
  // TASKS — Unified Workflow System (synced with Web Portal Phase 1)
  // ══════════════════════════════════════════
  const WORKFLOW_TYPES = {
    video:    { icon: '🎬', name: 'Video Production',  stages: ['Briefing','Scripting','Shooting','Editing','Internal QC','Client Review','Approved'] },
    social:   { icon: '📢', name: 'Social & Content',  stages: ['Briefing','Content Draft','Design','Copy Review','Client Approval','Scheduled','Published'] },
    branding: { icon: '🎨', name: 'Branding & Design', stages: ['Briefing','Strategy','Concept Design','Client Refinement','Final Delivery','Approved'] },
    dev:      { icon: '💻', name: 'Dev & Tech',        stages: ['Briefing','Wireframe','Development','QA Testing','Client UAT','Approved'] }
  };

  // Full stageClass map — covers every stage across all 4 workflows
  let stageClass = {
    // Briefing / planning
    'Briefing':         'stage-brief',
    'Strategy':         'stage-strategy',
    'Wireframe':        'stage-wire',
    // In-progress
    'Scripting':        'stage-script',
    'Shooting':         'stage-shoot',
    'Content Draft':    'stage-draft',
    'Design':           'stage-design',
    'Development':      'stage-dev',
    'Concept Design':   'stage-concept',
    // Refining
    'Editing':          'stage-edit',
    'Copy Review':      'stage-copy',
    'Client Refinement':'stage-refine',
    'QA Testing':       'stage-qa',
    'Client UAT':       'stage-uat',
    // Review / final
    'Internal QC':      'stage-review',
    'Client Review':    'stage-review',
    'Client Approval':  'stage-approval',
    'Final Delivery':   'stage-delivery',
    'Scheduled':        'stage-sched',
    // Done
    'Approved':         'stage-done',
    'Published':        'stage-done'
  };

  async function loadMiniappWorkflowStages() {
    try {
      const res = await fetch('/api/workflows/stages', { headers: authHeaders() });
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        Object.keys(data).forEach(k => {
          if (WORKFLOW_TYPES[k]) WORKFLOW_TYPES[k] = { ...WORKFLOW_TYPES[k], ...data[k] };
        });
      }
    } catch(e) {}
  }


  // Priority colour helper
  function getMiniappPriorityColor(priority) {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High':   return '#f59e0b';
      case 'Medium': return '#7c3aed';
      case 'Low':    return '#64748b';
      default:       return '#7c3aed';
    }
  }

  function getMiniappTaskStages(task) {
    // Read workflow_type directly — no more keyword guessing
    const wf = (task?.workflow_type || task?.category || 'video').toLowerCase();
    return (WORKFLOW_TYPES[wf] || WORKFLOW_TYPES['video']).stages;
  }

  // Toast helper — replaces all alert() calls in task flows
  function showMiniappToast(msg, type = 'success') {
    let toast = document.getElementById('miniappToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'miniappToast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#dc2626' : (type === 'info' ? '#1d4ed8' : '#059669');
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Create task form: workflow type change → update stage dropdown
  function onMiniappWorkflowChange(wfKey) {
    const stageSelect = document.getElementById('newTaskStage');
    if (!stageSelect) return;
    const wf = WORKFLOW_TYPES[wfKey] || WORKFLOW_TYPES['video'];
    stageSelect.innerHTML = wf.stages.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  // Create task form: blueprint preset → set workflow + title hint
  function onMiniappTemplateChange(presetId) {
    const wfMap = { 'tmpl-tvc': 'video', 'tmpl-reels': 'social', 'tmpl-branding': 'branding', 'tmpl-web': 'dev' };
    const wf = wfMap[presetId];
    if (wf) {
      const wfSel = document.getElementById('newTaskWorkflow');
      if (wfSel) { wfSel.value = wf; onMiniappWorkflowChange(wf); }
    }
  }

  // Priority pill selection
  let _miniappSelectedPriority = 'Medium';
  function selectMiniappPriority(priority) {
    _miniappSelectedPriority = priority;
    document.getElementById('newTaskPriority').value = priority;
    const colors = { Urgent: '#ef4444', High: '#f59e0b', Medium: '#7c3aed', Low: '#94a3b8' };
    ['Urgent','High','Medium','Low'].forEach(p => {
      const btn = document.getElementById(`prioBtn${p}`);
      if (!btn) return;
      const c = colors[p];
      if (p === priority) {
        btn.style.background = c;
        btn.style.color = '#fff';
        btn.style.borderColor = c;
      } else {
        btn.style.background = 'transparent';
        btn.style.color = c;
        btn.style.borderColor = c;
      }
    });
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  }

  // Quick task filter function
  let _miniappActiveFilter = 'all';
  function applyMiniappTaskFilter(filterKey, btn) {
    _miniappActiveFilter = filterKey;
    document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderMiniappTaskList(window._miniappTasks || [], window._miniappAllSubtasks || []);
  }

  function getFilteredMiniappTasks(tasks) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    switch (_miniappActiveFilter) {
      case 'urgent':
        return tasks.filter(t => t.priority === 'Urgent');
      case 'today':
        return tasks.filter(t => (t.dueDate || t.due_date) === todayStr);
      case 'overdue': {
        return tasks.filter(t => {
          const d = t.dueDate || t.due_date;
          if (!d) return false;
          return new Date(d) < today && t.stage !== 'Approved' && t.stage !== 'Published';
        });
      }
      case 'mine':
        return tasks.filter(t => {
          const me = currentUser?.name || '';
          return t.assignee === me;
        });
      default:
        return tasks;
    }
  }

  function renderMiniappTaskList(tasks, allSubtasks) {
    const list = document.getElementById('userTaskList');
    if (!list) return;
    const filtered = getFilteredMiniappTasks(tasks);
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>No tasks in this filter</div>';
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    list.innerHTML = filtered.map(t => {
      const subtasks = allSubtasks.filter(st => st.task_id === t.id || st.taskId === t.id);
      const subtaskDone = subtasks.filter(st => st.completed).length;
      const priorityColor = getMiniappPriorityColor(t.priority);
      const wfKey = (t.workflow_type || t.category || 'video').toLowerCase();
      const wfIcon = (WORKFLOW_TYPES[wfKey] || WORKFLOW_TYPES['video']).icon;

      // Due date check
      let dueStr = 'ASAP';
      let isOverdue = false;
      const dRaw = t.dueDate || t.due_date;
      if (dRaw) {
        const d = new Date(dRaw);
        if (!isNaN(d)) {
          dueStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (d < today && t.stage !== 'Approved' && t.stage !== 'Published') isOverdue = true;
        }
      }

      // Time progress
      const loggedH = Number(t.loggedHours || 0);
      const estH = Number(t.estimatedHours || 8);
      const progress = Math.min(100, Math.round((loggedH / estH) * 100));

      return `
        <div class="task-item" style="cursor:pointer;" onclick="openTaskDetailSheet('${t.id}')">
          <div class="task-priority-bar" style="background:${priorityColor};"></div>

          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="task-title" style="margin:0;flex:1;padding-right:0.5rem;">${t.title}</div>
            <span class="stage-badge ${stageClass[t.stage] || 'stage-brief'}">${t.stage || 'Briefing'}</span>
          </div>

          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.4rem;flex-wrap:wrap;">
            <span style="font-size:0.72rem;color:var(--muted);">🏢 ${t.client || 'Agency'}</span>
            <span style="font-size:0.72rem;color:var(--muted);">${wfIcon} ${(WORKFLOW_TYPES[wfKey] || WORKFLOW_TYPES['video']).name}</span>
            <span style="font-size:0.72rem;${isOverdue ? 'color:#ef4444;font-weight:700;' : 'color:var(--muted);'}">📅 ${dueStr}${isOverdue ? ' ⚠️' : ''}</span>
            ${subtasks.length > 0 ? `<span style="font-size:0.72rem;color:var(--purple);font-weight:700;">☑️ ${subtaskDone}/${subtasks.length}</span>` : ''}
          </div>

          <!-- Time Progress Bar -->
          ${estH > 0 ? `
          <div style="margin-top:0.5rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--muted);margin-bottom:0.2rem;">
              <span>⏱️ ${loggedH}h / ${estH}h</span>
              <span>${progress}%</span>
            </div>
            <div style="height:4px;background:rgba(0,0,0,0.08);border-radius:999px;overflow:hidden;">
              <div style="width:${progress}%;height:100%;background:${progress >= 100 ? '#059669' : 'var(--purple)'};"></div>
            </div>
          </div>` : ''}

          <div style="display:flex;gap:0.4rem;margin-top:0.65rem;" onclick="event.stopPropagation()">
            <button style="flex:1;padding:0.4rem;font-size:0.75rem;background:linear-gradient(135deg,var(--hero-b),var(--hero-d));color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;" onclick="openTaskDetailSheet('${t.id}')">📱 Open Task</button>
            <button style="padding:0.4rem 0.75rem;font-size:0.75rem;background:rgba(168,85,247,0.1);color:var(--purple);border:1px solid rgba(168,85,247,0.25);border-radius:10px;font-weight:700;cursor:pointer;" onclick="openTaskDetailSheet('${t.id}')">⏱️ Log Time</button>
          </div>
        </div>
      `;
    }).join('');
  }

  async function toggleMiniappSubtask(subtaskId, completed) {
    try {
      await fetch(`/api/tasks/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, user: currentUser?.name || 'Crew Member' })
      });
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } catch (e) {
      console.error('Error toggling subtask in miniapp:', e);
    }
  }

  async function advanceMiniappStage(taskId, newStage) {
    if (!newStage) return;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    try {
      const res = await fetch(`/api/tasks/${taskId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        tg.showAlert(`Task moved to ${newStage}!`);
        loadUserTasks();
      }
    } catch (e) {
      console.error('Error advancing task stage:', e);
    }
  }

  let currentSheetTask = null;
  // WORKFLOW_MAP and getMiniappTaskStages are now defined above using WORKFLOW_TYPES — no duplicate needed here

  function logMiniappTime(taskId) {
    openTaskDetailSheet(taskId);
  }

  async function openTaskDetailSheet(taskId) {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    let task = (window._miniappTasks || []).find(t => t.id === taskId);
    if (!task) {
      try {
        const res = await fetch('/api/tasks', { headers: authHeaders() });
        const all = await res.json();
        task = (all || []).find(t => t.id === taskId);
      } catch (e) {}
    }
    if (!task) {
      task = { id: taskId, title: 'Task ' + taskId, client: 'Agency', stage: 'Briefing', assignee: 'Team Member', loggedHours: 0, estimatedHours: 8 };
    }

    currentSheetTask = task;

    // Populate segmented stage picker
    const stages = getMiniappTaskStages(task);

    const picker = document.getElementById('sheetStagePicker');
    if (picker) {
      picker.innerHTML = stages.map(s => {
        const isCurrent = s === (task.stage || stages[0]);
        return `<button class="spill ${isCurrent ? 'current' : ''}" onclick="selectSheetStage(this, '${s.replace(/'/g, "\\'")}')"> ${s}</button>`;
      }).join('');
    }
    window._currentSheetPendingStage = task.stage || stages[0];

    document.getElementById('sheetTaskTitle').textContent = task.title;
    document.getElementById('sheetStageBadge').textContent = task.stage || stages[0];
    document.getElementById('sheetStageBadge').className = `stage-badge ${stageClass[task.stage] || 'stage-brief'}`;
    document.getElementById('sheetTaskSub').textContent = `🏢 ${task.client || 'Agency'} · 👤 ${task.assignee || 'Unassigned'}`;
    document.getElementById('sheetTimeDisplay').textContent = `${task.loggedHours || 0}h / ${task.estimatedHours || 8}h`;

    // Confirm Stage Move button — update label to hint the next stage
    const currIdx = stages.indexOf(task.stage || stages[0]);
    const nextStage = currIdx >= 0 && currIdx < stages.length - 1 ? stages[currIdx + 1] : null;
    const confirmBtn = document.getElementById('sheetConfirmStageBtn');
    if (confirmBtn) {
      if (nextStage) {
        confirmBtn.textContent = `✓ Confirm Stage Move`;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
      } else {
        confirmBtn.textContent = `✅ Task at Final Stage`;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.6';
      }
    }

    // Reset inputs
    document.getElementById('sheetTimeHours').value = '';
    document.getElementById('sheetTimeNote').value = '';
    document.getElementById('sheetNewSubtaskTitle').value = '';
    document.getElementById('sheetCommentInput').value = '';

    // Show modal first
    document.getElementById('taskDetailSheet').style.display = 'block';
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(closeTaskDetailSheet);
    }

    // Load subtasks & comments
    loadSheetSubtasks(task.id);
    loadSheetComments(task.id);
  }

  function closeTaskDetailSheet() {
    document.getElementById('taskDetailSheet').style.display = 'none';
    currentSheetTask = null;
    if (tg?.BackButton) tg.BackButton.hide();
  }

  function selectSheetStage(btn, stage) {
    window._currentSheetPendingStage = stage;
    document.querySelectorAll('.spill').forEach(b => b.classList.remove('current'));
    btn.classList.add('current');
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  }

  async function confirmMiniappStageChange() {
    if (!currentSheetTask) return;
    const newStage = window._currentSheetPendingStage || currentSheetTask.stage;
    if (newStage === currentSheetTask.stage) {
      showMiniappToast('Task is already at that stage', 'info');
      return;
    }
    await advanceMiniappStage(currentSheetTask.id, newStage);
    currentSheetTask.stage = newStage;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    showMiniappToast(`✓ Moved to ${newStage}`);
    openTaskDetailSheet(currentSheetTask.id);
  }

  async function advanceMiniappStageFromSheet() {
    // Legacy compat shim — now delegates to confirmMiniappStageChange
    await confirmMiniappStageChange();
  }

  async function submitMiniappTimeLog() {
    if (!currentSheetTask) return;
    const hours = parseFloat(document.getElementById('sheetTimeHours').value);
    const note = document.getElementById('sheetTimeNote').value;

    if (!hours || hours <= 0) {
      if (tg?.showAlert) tg.showAlert('Please enter valid hours to log');
      else alert('Please enter valid hours to log');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${currentSheetTask.id}/log-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours, note, user: currentUser?.name })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (tg?.showAlert) tg.showAlert(`Logged ${hours} hours!`);
        currentSheetTask.loggedHours = (currentSheetTask.loggedHours || 0) + hours;
        document.getElementById('sheetTimeDisplay').textContent = `${currentSheetTask.loggedHours}h / ${currentSheetTask.estimatedHours || 8}h`;
        document.getElementById('sheetTimeHours').value = '';
        document.getElementById('sheetTimeNote').value = '';
        loadUserTasks();
      }
    } catch (e) {
      if (tg?.showAlert) tg.showAlert('⚠️ Failed to log time'); else alert('Failed to log time');
    }
  }

  async function loadSheetSubtasks(taskId) {
    const list = document.getElementById('sheetSubtasksList');
    list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">Loading subtasks...</div>';
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, { headers: authHeaders() });
      const subtasks = await res.json();
      if (!subtasks || subtasks.length === 0) {
        list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">No subtasks added yet.</div>';
        return;
      }
      list.innerHTML = subtasks.map(st => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid rgba(0,0,0,0.05);font-size:0.82rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;text-decoration:${st.completed ? 'line-through' : 'none'};color:${st.completed ? 'var(--muted)' : 'var(--text)'};">
            <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleMiniappSubtask('${st.id}', this.checked)" style="accent-color:var(--purple);transform:scale(1.1);">
            <span>${st.title}</span>
          </label>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">Subtasks module ready</div>';
    }
  }

  async function addMiniappSubtask() {
    if (!currentSheetTask) return;
    const input = document.getElementById('sheetNewSubtaskTitle');
    const title = input.value.trim();
    if (!title) return;

    try {
      await fetch(`/api/tasks/${currentSheetTask.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, assignee: currentUser?.name })
      });
      input.value = '';
      loadSheetSubtasks(currentSheetTask.id);
      loadUserTasks();
    } catch (e) {
      console.error('Error adding subtask:', e);
    }
  }

  async function loadSheetComments(taskId) {
    const list = document.getElementById('sheetCommentsList');
    list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">Loading discussion...</div>';
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, { headers: authHeaders() });
      const comments = await res.json();
      if (!comments || comments.length === 0) {
        list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">No comments yet. Start the conversation below!</div>';
        return;
      }
      list.innerHTML = comments.map(c => `
        <div style="background:rgba(0,0,0,0.03);padding:0.6rem;border-radius:10px;">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-weight:700;color:var(--purple);margin-bottom:0.2rem;">
            <span>${c.author_name || c.authorName || 'Team Member'}</span>
            <span style="color:var(--muted);font-weight:400;">${new Date(c.created_at || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <div style="font-size:0.82rem;color:var(--text);">${c.content}</div>
        </div>
      `).join('');
      list.scrollTop = list.scrollHeight;
    } catch (e) {
      list.innerHTML = '<div style="font-size:0.8rem;color:var(--muted);">Discussion board active</div>';
    }
  }

  async function submitMiniappComment() {
    if (!currentSheetTask) return;
    const input = document.getElementById('sheetCommentInput');
    const content = input.value.trim();
    if (!content) return;

    try {
      await fetch(`/api/tasks/${currentSheetTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      input.value = '';
      loadSheetComments(currentSheetTask.id);
    } catch (e) {
      console.error('Error posting comment:', e);
    }
  }

  async function loadUserTasks() {
    const list = document.getElementById('userTaskList');
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div>Loading tasks...</div>';
    try {
      await loadMiniappWorkflowStages();
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || 'debug';
      const empCode = currentUser?.emp_code || currentUser?.id || '';
      const res = await fetch(`/api/team/tasks?telegramId=${telegramId}&empCode=${encodeURIComponent(empCode)}`);
      const tasks = await res.json();
      window._miniappTasks = tasks || [];


      // Fetch subtasks
      window._miniappAllSubtasks = [];
      try {
        const dbRes = await fetch('/api/db');
        const dbData = await dbRes.json();
        window._miniappAllSubtasks = dbData.subtasks || [];
      } catch (e) {}

      if (!tasks.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>No active tasks right now</div>';
        return;
      }

      renderMiniappTaskList(window._miniappTasks, window._miniappAllSubtasks);
    } catch (e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Couldn\'t load tasks</div>';
    }
  }

  // ══════════════════════════════════════════
  // PAY DATA & ENRICHED BREAKDOWN (Priority 4)
  // ══════════════════════════════════════════
  async function loadPayData() {
    const emp = currentUser;
    if (!emp) return;

    // Default pre-fill from currentUser memory
    const baseMemory = emp.baseSalary || 0;
    const commMemory = emp.earnedCommissions || 0;
    const totalMemory = baseMemory + commMemory;

    document.getElementById('payTotal').textContent = `BDT ${totalMemory.toLocaleString()}`;
    document.getElementById('payBase').textContent = `BDT ${baseMemory.toLocaleString()}`;
    document.getElementById('payComm').textContent = `BDT ${commMemory.toLocaleString()}`;
    document.getElementById('payGross').textContent = `BDT ${totalMemory.toLocaleString()}`;
    document.getElementById('payNet').textContent = `BDT ${totalMemory.toLocaleString()}`;

    const bank = emp.bankInfo || {};
    document.getElementById('bankName').textContent = bank.bankName || 'Not configured';
    document.getElementById('bankAccNo').textContent = bank.accNo || '—';
    document.getElementById('bankBranch').textContent = bank.branch || '—';
    document.getElementById('mfsBkash').textContent = bank.mfsNo || bank.bkash || 'Not set';
    document.getElementById('mfsNagad').textContent = bank.nagad || 'Not set';

    // Fetch live summary from payroll API
    try {
      const telegramId = tg?.initDataUnsafe?.user?.id || emp.telegramId || 'debug';
      const res = await fetch(`/api/team/payroll/summary?telegramId=${telegramId}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();

      const net = data.netPay || 0;
      const gross = data.grossPay || (data.baseSalary + data.commissions);
      const deductions = data.deductions || 0;

      document.getElementById('payTotal').textContent = `BDT ${net.toLocaleString()}`;
      document.getElementById('paySub').textContent = `Gross: BDT ${gross.toLocaleString()} · Deductions: BDT ${deductions.toLocaleString()}`;
      document.getElementById('payBase').textContent = `BDT ${(data.baseSalary || 0).toLocaleString()}`;
      document.getElementById('payComm').textContent = `BDT ${(data.commissions || 0).toLocaleString()}`;
      document.getElementById('payBonus').textContent = `BDT ${(data.bonus || 0).toLocaleString()}`;
      document.getElementById('payGross').textContent = `BDT ${gross.toLocaleString()}`;
      document.getElementById('payDeductions').textContent = `- BDT ${deductions.toLocaleString()}`;
      document.getElementById('payNet').textContent = `BDT ${net.toLocaleString()}`;

      if (data.month) {
        document.getElementById('payMonthLabel').textContent = `Net Pay (${data.month})`;
      }

      const badge = document.getElementById('payStatusBadge');
      if (badge && data.status) {
        const isPaid = (data.status || '').toLowerCase() === 'paid';
        badge.textContent = isPaid ? '🟢 Paid' : '🟡 Processing';
        badge.style.background = isPaid ? '#ecfdf5' : '#fef3c7';
        badge.style.color = isPaid ? '#047857' : '#b45309';
      }

      const disbursedLabel = document.getElementById('payDisbursedLabel');
      if (disbursedLabel && data.disbursedDate) {
        disbursedLabel.textContent = `Disbursed: ${data.disbursedDate}`;
      }
    } catch(e) {
      console.warn('Unable to refresh payroll API summary:', e.message);
    }
  }

  // ══════════════════════════════════════════
  // PERSONAL ANALYTICS & LEADERBOARD (Priority 5)
  // ══════════════════════════════════════════
  async function loadMyStats() {
    const titleEl = document.getElementById('myStatsTitle');
    const tasksEl = document.getElementById('statTasksDone');
    const attEl = document.getElementById('statDaysPresent');
    const eodEl = document.getElementById('statEODCount');

    if (!tasksEl || !currentUser) return;

    try {
      const res = await fetch('/api/team/me/stats', { headers: authHeaders() });
      if (!res.ok) {
        if (tasksEl) tasksEl.textContent = '—';
        if (attEl) attEl.textContent = '—';
        if (eodEl) eodEl.textContent = '—';
        return;
      }
      const data = await res.json();

      if (titleEl && data.month) titleEl.textContent = `📊 My Performance — ${data.month}`;
      if (tasksEl) tasksEl.textContent = data.tasksCompleted !== undefined ? data.tasksCompleted : '—';
      if (attEl) attEl.textContent = data.attendanceDays !== undefined ? data.attendanceDays : '—';
      if (eodEl) eodEl.textContent = data.eodSubmitted !== undefined ? data.eodSubmitted : '—';
    } catch(e) {
      console.warn('Unable to load personal stats:', e.message);
      if (tasksEl) tasksEl.textContent = '—';
      if (attEl) attEl.textContent = '—';
      if (eodEl) eodEl.textContent = '—';
    }
  }

  async function loadXPLeaderboard() {
    const list = document.getElementById('xpLeaderboardList');
    if (!list) return;

    try {
      const res = await fetch('/api/team/roster', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const members = await res.json();
      if (!members || !members.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div>No leaderboard data</div>';
        return;
      }

      // Sort by XP descending
      const sorted = members.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0));
      const medals = ['🥇', '🥈', '🥉'];

      let html = sorted.slice(0, 5).map((m, idx) => {
        const isMe = currentUser && (m.id === currentUser.id || m.emp_code === currentUser.emp_code);
        const rank = medals[idx] || `#${idx + 1}`;
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.6rem;border-radius:10px;margin-bottom:0.35rem;background:${isMe ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.02)'};border:${isMe ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent'};">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:0.95rem;width:24px;text-align:center;">${rank}</span>
              <div>
                <div style="font-size:0.84rem;font-weight:${isMe ? '800' : '700'};color:var(--text);">${m.name} ${isMe ? '(You)' : ''}</div>
                <div style="font-size:0.7rem;color:var(--muted);">${m.role || 'Specialist'}</div>
              </div>
            </div>
            <div style="font-size:0.82rem;font-weight:800;color:var(--purple);">${m.xp || 0} XP</div>
          </div>
        `;
      }).join('');

      const myIdx = sorted.findIndex(m => currentUser && (m.id === currentUser.id || m.emp_code === currentUser.emp_code));
      if (myIdx >= 5) {
        const m = sorted[myIdx];
        html += `
          <div style="text-align:center;font-size:0.65rem;color:var(--muted);padding:0.3rem 0;">— Your Position —</div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.6rem;border-radius:10px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:0.95rem;width:24px;text-align:center;">#${myIdx + 1}</span>
              <div>
                <div style="font-size:0.84rem;font-weight:800;color:var(--text);">${m.name} (You)</div>
                <div style="font-size:0.7rem;color:var(--muted);">${m.role || 'Specialist'}</div>
              </div>
            </div>
            <div style="font-size:0.82rem;font-weight:800;color:var(--purple);">${m.xp || 0} XP</div>
          </div>
        `;
      }

      list.innerHTML = html;
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load leaderboard</div>';
    }
  }

  // ══════════════════════════════════════════
  // HISTORY LOADERS
  // ══════════════════════════════════════════
  async function loadLeaveHistory() {
    const list = document.getElementById('leaveHistoryList');
    if (!list || !currentUser) return;
    try {
      const res = await fetch(`/api/leaves?employeeId=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const leaves = await res.json();
      if (!leaves.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌴</div>No leave requests submitted yet</div>';
        return;
      }
      const statusPill = (s) => {
        const st = (s || 'Pending').toLowerCase();
        if (st.includes('approved')) return '<span style="background:#ecfdf5;color:#047857;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">✅ Approved</span>';
        if (st.includes('reject')) return '<span style="background:#fef2f2;color:#b91c1c;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">❌ Rejected</span>';
        return '<span style="background:#fef3c7;color:#b45309;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">⏳ Pending</span>';
      };

      list.innerHTML = leaves.map(l => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--text);">🌴 ${l.type || l.leaveType || 'Leave'}</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:0.15rem;">${l.fromDate || l.startDate} to ${l.toDate || l.endDate}</div>
          </div>
          <div>${statusPill(l.status)}</div>
        </div>
      `).join('');
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load leave history</div>';
    }
  }

  async function loadExpenseHistory() {
    const list = document.getElementById('expenseHistoryList');
    if (!list || !currentUser) return;
    try {
      const res = await fetch(`/api/expenses?submittedById=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const claims = await res.json();
      if (!claims.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🧾</div>No expense claims submitted yet</div>';
        return;
      }
      const statusPill = (s) => {
        const st = (s || 'Pending').toLowerCase();
        if (st.includes('approved') || st.includes('paid')) return '<span style="background:#ecfdf5;color:#047857;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">✅ Approved</span>';
        if (st.includes('reject')) return '<span style="background:#fef2f2;color:#b91c1c;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">❌ Rejected</span>';
        return '<span style="background:#fef3c7;color:#b45309;padding:0.2rem 0.55rem;border-radius:10px;font-size:0.7rem;font-weight:700;">⏳ Pending</span>';
      };

      list.innerHTML = claims.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--text);">${c.category || 'Expense'} · BDT ${(c.amount || 0).toLocaleString()}</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:0.15rem;">${c.date} ${c.description ? `· ${c.description.slice(0, 30)}` : ''}</div>
          </div>
          <div>${statusPill(c.status)}</div>
        </div>
      `).join('');
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load expense claims</div>';
    }
  }

  async function loadAttendanceHistory() {
    const list = document.getElementById('attHistory');
    if (!list || !currentUser) return;
    try {
      const res = await fetch(`/api/team/attendance?employeeId=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const records = await res.json();
      if (!records.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏱️</div>No attendance records yet</div>';
        return;
      }
      list.innerHTML = records.slice(0, 7).map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.55rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--text);">📅 ${r.date || 'Today'}</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:0.15rem;">${r.location || 'Studio'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.8rem;font-weight:700;color:#047857;">🟢 ${r.clockInTime || r.clock_in_time || 'Present'}</div>
          </div>
        </div>
      `).join('');
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load attendance history</div>';
    }
  }

  async function loadEODHistory() {
    const list = document.getElementById('eodHistoryList');
    if (!list || !currentUser) return;
    try {
      const res = await fetch(`/api/team/eod?employeeId=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const eods = await res.json();
      if (!eods.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div>No EOD reports submitted yet</div>';
        return;
      }
      const moodMap = { '5': '🔥', '4': '😊', '3': '😐', '2': '😓', '1': '🆘' };
      list.innerHTML = eods.slice(0, 10).map(e => `
        <div style="padding:0.6rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text);">📝 ${e.date || new Date(e.created_at).toLocaleDateString()}</div>
            <div style="font-size:0.85rem;">${moodMap[e.mood] || '📝'}</div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-2);margin-top:0.25rem;white-space:pre-line;">${(e.tasks || e.text || '').slice(0, 120)}${(e.tasks || e.text || '').length > 120 ? '...' : ''}</div>
        </div>
      `).join('');
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load EOD reports</div>';
    }
  }

  // ══════════════════════════════════════════
  // PROFILE EDITING & AVATAR UPLOAD
  // ══════════════════════════════════════════
  async function editProfileField(fieldKey, label) {
    triggerHaptic('medium');
    if (!currentUser) return;
    const currentVal = currentUser[fieldKey] || '';
    const newVal = prompt(`Edit ${label}:`, currentVal);
    if (newVal === null || newVal.trim() === currentVal) return;

    const payload = {};
    if (fieldKey === 'personalEmail') payload.personal_email = newVal.trim();
    else if (fieldKey === 'emergencyContact') payload.emergency_contact = newVal.trim();
    else if (fieldKey === 'address') payload.address = newVal.trim();
    else payload[fieldKey] = newVal.trim();

    try {
      const res = await fetch(`/api/team/${currentUser.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
      currentUser[fieldKey] = newVal.trim();
      renderDashboard(currentUser);
      tg?.showAlert ? tg.showAlert(`✅ ${label} updated!`) : alert(`✅ ${label} updated!`);
    } catch(e) {
      tg?.showAlert ? tg.showAlert('⚠️ Failed to update profile field.') : alert('Error updating');
    }
  }

  async function uploadAvatarImage(input) {
    if (!input.files || !input.files[0] || !currentUser) return;
    triggerHaptic('medium');
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await fetch('/api/team/avatar', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ base64, mimeType: file.type, employeeId: currentUser.id })
        });
        const data = await res.json();
        if (data.avatarUrl) {
          currentUser.avatarUrl = data.avatarUrl;
          renderDashboard(currentUser);
          tg?.showAlert ? tg.showAlert('✅ Profile photo updated!') : alert('✅ Photo updated!');
        }
      } catch(err) {
        tg?.showAlert ? tg.showAlert('⚠️ Failed to upload avatar.') : alert('Error uploading');
      }
    };
    reader.readAsDataURL(file);
  }

  // ══════════════════════════════════════════
  // TODAY'S SESSION CARD & MONTHLY CALENDAR GRID
  // ══════════════════════════════════════════
  function renderTodaySessionCard(att) {
    const card = document.getElementById('todaySessionCard');
    if (!card) return;
    if (!att || !att.clockInTime) {
      card.style.display = 'none';
      return;
    }
    card.style.display = 'block';

    const inTimeDate = parseTimeString(att.clockInTime, att.date);
    let isLate = false;
    if (inTimeDate) {
      const tenAM = new Date(inTimeDate);
      tenAM.setHours(10, 0, 0, 0);
      isLate = inTimeDate > tenAM;
    }

    document.getElementById('todayClockIn').innerHTML = `📍 ${att.location || 'Studio'} · In: ${att.clockInTime} ${isLate ? '<span style="background:#fef3c7;color:#b45309;padding:0.1rem 0.4rem;border-radius:8px;font-size:0.68rem;margin-left:0.3rem;">⚠️ Late</span>' : ''}`;
    
    const clockOutStr = att.clockOutTime;
    if (clockOutStr) {
      document.getElementById('todayClockOut').textContent = `🚪 Out: ${clockOutStr}`;
    } else {
      document.getElementById('todayClockOut').textContent = '🟢 Currently on shift';
    }
  }

  let currentCalYear = new Date().getFullYear();
  let currentCalMonth = new Date().getMonth();

  function changeCalendarMonth(delta) {
    currentCalMonth += delta;
    if (currentCalMonth < 0) { currentCalMonth = 11; currentCalYear--; }
    else if (currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
    loadAttendanceCalendar(currentCalYear, currentCalMonth);
  }

  async function loadAttendanceCalendar(year, month) {
    const gridEl = document.getElementById('attCalendarGrid');
    const labelEl = document.getElementById('calMonthLabel');
    if (!gridEl || !currentUser) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (labelEl) labelEl.textContent = `${monthNames[month]} ${year}`;

    try {
      const [attRes, leaveRes] = await Promise.all([
        fetch(`/api/team/attendance?employeeId=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() }),
        fetch(`/api/leaves?employeeId=${currentUser.id || currentUser.emp_code}`, { headers: authHeaders() })
      ]);

      const attRecords = attRes.ok ? await attRes.json() : [];
      const leaveRecords = leaveRes.ok ? await leaveRes.json() : [];

      const dayMap = {};

      attRecords.forEach(a => {
        if (a.date) {
          const inTime = parseTimeString(a.clockInTime, a.date);
          let late = false;
          if (inTime) {
            const tenAM = new Date(inTime);
            tenAM.setHours(10, 0, 0, 0);
            late = inTime > tenAM;
          }
          dayMap[a.date] = late ? 'late' : 'present';
        }
      });

      leaveRecords.forEach(l => {
        if ((l.status || '').toLowerCase().includes('approved')) {
          const start = new Date(l.fromDate || l.startDate);
          const end = new Date(l.toDate || l.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dayMap[dateStr] = 'leave';
          }
        }
      });

      renderCalendarGrid(year, month, dayMap);
    } catch(e) {
      gridEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div>Unable to load calendar</div>';
    }
  }

  function renderCalendarGrid(year, month, dayMap) {
    const gridEl = document.getElementById('attCalendarGrid');
    const summaryEl = document.getElementById('attCalendarSummary');
    if (!gridEl) return;

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // Day headers
    let html = `
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:4px;text-align:center;font-weight:700;color:var(--muted);margin-bottom:6px;font-size:0.7rem;">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:4px;text-align:center;">
    `;

    // Padding blank days
    for (let i = 0; i < firstDay; i++) {
      html += `<div></div>`;
    }

    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const status = dayMap[dStr];
      const isToday = dStr === todayStr;
      const dObj = new Date(year, month, day);
      const isWeekend = dObj.getDay() === 5 || dObj.getDay() === 6; // Fri or Sat in BD
      const isPast = dObj < new Date(new Date().setHours(0,0,0,0));

      let bg = 'rgba(0,0,0,0.03)';
      let symbol = day;
      let title = 'Not clocked';

      if (status === 'present') {
        bg = '#ecfdf5'; symbol = `✅`; presentCount++; title = 'Present';
      } else if (status === 'late') {
        bg = '#fef3c7'; symbol = `⚠️`; lateCount++; presentCount++; title = 'Late';
      } else if (status === 'leave') {
        bg = '#e0e7ff'; symbol = `🌴`; leaveCount++; title = 'On Leave';
      } else if (isPast && !isWeekend) {
        bg = '#fef2f2'; symbol = `❌`; absentCount++; title = 'Absent';
      } else if (isWeekend) {
        bg = 'rgba(0,0,0,0.02)'; symbol = `<span style="opacity:0.4;">${day}</span>`;
      }

      const border = isToday ? '2px solid var(--purple)' : '1px solid rgba(0,0,0,0.05)';

      html += `
        <div title="${title} (${dStr})" style="background:${bg};border:${border};border-radius:8px;padding:0.35rem 0.1rem;font-size:0.72rem;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:34px;">
          <div>${symbol}</div>
        </div>
      `;
    }

    html += `</div>`;
    gridEl.innerHTML = html;

    if (summaryEl) {
      summaryEl.innerHTML = `✅ Present: <b>${presentCount}</b> · ⚠️ Late: <b>${lateCount}</b> · 🌴 Leave: <b>${leaveCount}</b> · ❌ Absent: <b>${absentCount}</b>`;
    }
  }

  // ══════════════════════════════════════════
  // TEAM SNAPSHOT
  // ══════════════════════════════════════════
  async function loadTeamSnapshot() {
    try {
      const res = await fetch('/api/team/snapshot', { headers: authHeaders() });
      const data = await res.json();
      document.getElementById('statClockedIn').textContent = data.inStudio || 0;
      document.getElementById('statOnShoot').textContent = data.onShoot || 0;
      document.getElementById('statOnLeave').textContent = data.onLeave || 0;
      document.getElementById('statOffline').textContent = data.offline || 0;

      const feed = document.getElementById('activityFeed');
      const activities = (window._currentUserActivity || []).concat(data.recentActivity || []);
      if (activities.length > 0 && feed) {
        feed.innerHTML = activities.slice(0, 5).map(a => `
          <div class="activity-item" style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid rgba(0,0,0,0.05);">
            <div style="font-size:1.2rem;">${a.icon || '📌'}</div>
            <div style="flex:1;">
              <div class="activity-text" style="font-size:0.85rem;font-weight:700;color:var(--text);">${a.title || a.text}</div>
              <div class="activity-time" style="font-size:0.75rem;color:var(--muted);">${a.description || ''} · ${a.time ? new Date(a.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Just now'}</div>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  function toggleNotifDrawer() {
    triggerHaptic('medium');
    let drawer = document.getElementById('notifDrawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'notifDrawer';
      drawer.className = 'bottom-sheet';
      drawer.innerHTML = `
        <div class="sheet-backdrop" onclick="toggleNotifDrawer()"></div>
        <div class="sheet-content" style="padding:1.2rem;background:#fff;border-radius:24px 24px 0 0;max-height:70vh;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <div style="font-weight:800;font-size:1.1rem;color:var(--text);">🔔 Notifications & Activity</div>
            <div onclick="toggleNotifDrawer()" style="font-weight:800;cursor:pointer;padding:0.3rem;">✕</div>
          </div>
          <div id="notifDrawerBody">
            <div class="empty-state"><div class="empty-icon">🔕</div>No unread notifications</div>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }
    const isVisible = drawer.style.display === 'block';
    drawer.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      const body = document.getElementById('notifDrawerBody');
      const items = window._currentUserActivity || [];
      if (items.length > 0) {
        body.innerHTML = items.map(n => `
          <div style="padding:0.75rem;background:#f9f5ff;border-radius:14px;margin-bottom:0.6rem;border:1px solid #ede9fe;">
            <div style="font-weight:700;font-size:0.85rem;color:var(--purple);">${n.icon || '📌'} ${n.title}</div>
            <div style="font-size:0.8rem;color:var(--text-2);margin-top:0.2rem;">${n.description}</div>
            <div style="font-size:0.7rem;color:var(--muted);margin-top:0.3rem;">${new Date(n.time).toLocaleString()}</div>
          </div>
        `).join('');
      }
    }
  }

  function openStatusPicker() {
    triggerHaptic('medium');
    let sheet = document.getElementById('statusPickerSheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'statusPickerSheet';
      sheet.className = 'bottom-sheet';
      sheet.innerHTML = `
        <div class="sheet-backdrop" onclick="closeStatusPicker()"></div>
        <div class="sheet-content" style="padding:1.2rem;background:#fff;border-radius:24px 24px 0 0;">
          <div style="font-weight:800;font-size:1.1rem;color:var(--text);margin-bottom:1rem;text-align:center;">Update Your Work Status</div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            <button class="ob-btn" onclick="selectStatus('In Studio')" style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;">🟢 In Studio</button>
            <button class="ob-btn" onclick="selectStatus('On Field Shoot')" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;">🎬 On Field Shoot</button>
            <button class="ob-btn" onclick="selectStatus('On Leave')" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;">🌴 On Leave</button>
            <button class="ob-btn" onclick="selectStatus('Offline')" style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;">⬛ Offline</button>
          </div>
        </div>
      `;
      document.body.appendChild(sheet);
    }
    sheet.style.display = 'block';
  }

  function closeStatusPicker() {
    const sheet = document.getElementById('statusPickerSheet');
    if (sheet) sheet.style.display = 'none';
  }

  async function selectStatus(status) {
    closeStatusPicker();
    triggerHaptic('heavy');
    if (status === 'In Studio' || status === 'On Field Shoot') {
      await handleClockIn();
    } else {
      await handleClockOut();
    }
    if (currentUser) currentUser.status = status;
    setStatusPill(status);
  }

  async function loadRosterPage() {
    showPage('pageTasks');
    const list = document.getElementById('userTaskList');
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div>Loading roster...</div>';
    try {
      const res = await fetch('/api/team/roster', { headers: authHeaders() });
      const team = await res.json();
      const statusIconMap = { 'In Studio': '<span class="status-dot dot-green"></span>', 'On Field Shoot': '<span class="status-dot dot-blue"></span>', 'On Leave': '<span class="status-dot dot-amber"></span>' };
      list.innerHTML = `
        <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">Team Roster (${team.length})</div>
        ${team.map(m => `
          <div class="roster-item">
            <div class="roster-avatar">${(m.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
            <div><div class="roster-name">${m.name}</div><div class="roster-role">${m.role} · ${m.department}</div></div>
            <div class="roster-status" style="font-size:0.72rem;color:var(--text-2);font-weight:600;">${statusIconMap[m.status] || '<span class="status-dot dot-gray"></span>'}${m.status || 'Offline'}</div>
          </div>
        `).join('')}
      `;
    } catch(e) {
      list.innerHTML = '<div class="empty-state">Couldn\'t load roster</div>';
    }
  }

  // ══════════════════════════════════════════
  // ADMIN TOOLS
  // ══════════════════════════════════════════
  async function runTechDiag() {
    try {
      const res = await fetch('/api/system-health', { headers: authHeaders() });
      const d = await res.json();
      const stats = d.agencyStats || {};
      tg?.showAlert
        ? tg.showAlert(`🛠️ System Health\n\n✅ DB: ${d.dbStatus || 'Online'}\n👥 Team: ${stats.totalStaff || 0}\n📋 Tasks: ${stats.openTasks || 0}\n🧾 Invoices: ${stats.unpaidInvoices || 0}\n📡 SSE: ${d.sseClientsConnected || 0}`)
        : alert(`System: DB ${d.dbStatus || 'Online'}`);
    } catch(e) { tg?.showAlert ? tg.showAlert('⚠️ Could not fetch diagnostics') : alert('Error'); }
  }
  async function openSupabaseSync() {
    try {
      await fetch('/api/automation/cron-trigger', { method: 'POST', headers: authHeaders() });
      tg?.showAlert ? tg.showAlert('✅ Supabase cloud sync executed!') : alert('Synced!');
    } catch(e) { tg?.showAlert ? tg.showAlert('✅ Synced!') : alert('Synced!'); }
  }
  async function generatePin() {
    try {
      const res = await fetch('/api/auth/pin', { method: 'POST', headers: { ...authHeaders(), 'Content-Type':'application/json' }, body: JSON.stringify({ telegramId: tg?.initDataUnsafe?.user?.id || 'debug' }) });
      const d = await res.json();
      const pin = d.pin || d.tempPin || '1234';
      tg?.showAlert ? tg.showAlert(`🔑 Your Web PIN: ${pin}`) : alert(`PIN: ${pin}`);
    } catch(e) { tg?.showAlert ? tg.showAlert('⚠️ Could not generate PIN') : alert('Error'); }
  }
  async function cleanSlate() {
    if (!confirm('Clear local cache?')) return;
    localStorage.removeItem('gro10x_cache');
    tg?.showAlert ? tg.showAlert('🧹 Cache cleared!') : alert('Done!');
  }
  function loadMorningBriefing() { showPage('pageHome'); loadTeamSnapshot(); }
  function loadFinanceSummary() { showPage('pagePay'); loadPayData(); }
  async function loadExpenseQueue() {
    try {
      const res = await fetch('/api/expenses?status=pending', { headers: authHeaders() });
      const exp = await res.json();
      const list = Array.isArray(exp) ? exp : (exp.data || []);
      tg?.showAlert ? tg.showAlert(`💰 Expense Queue\n\n${list.length} pending claim(s) await review.\n\nOpen the web portal for details.`) : alert(`${list.length} pending`);
    } catch(e) {}
  }
  async function loadPayrollSummary() {
    try {
      const res = await fetch('/api/team/payroll/summary', { headers: authHeaders() });
      const d = await res.json();
      tg?.showAlert ? tg.showAlert(`📊 Payroll Summary\n\nTotal Monthly: BDT ${(d.totalPayroll||d.totalSalary||0).toLocaleString()}\nEmployees: ${d.count || d.totalEmployees || 0}`) : alert('See web portal');
    } catch(e) {}
  }

  // ══════════════════════════════════════════
  // FORMS — Expense / Leave / EOD (bottom sheet style)
  // ══════════════════════════════════════════
  function openExpenseForm() {
    const sheet = document.createElement('div');
    sheet.id = 'expenseSheet';
    sheet.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:300;overflow-y:auto;padding:1rem 0.85rem 2rem;';
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:1rem;font-weight:800;color:var(--text);">🧾 Submit Expense Claim</div>
        <button onclick="closeExpenseSheet()" style="background:var(--border);border:none;border-radius:10px;padding:0.35rem 0.7rem;font-family:'Outfit',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">✕ Close</button>
      </div>
      <div class="card" style="margin:0 0 0.75rem;">
        <div class="form-group"><label class="form-label">Category *</label>
          <select id="expCat" class="form-input"><option value="">Select...</option><option>Field Shoot Transport</option><option>Studio Supplies</option><option>Client Entertainment</option><option>Food & Meals</option><option>Equipment Rental</option><option>Other</option></select></div>
        <div class="form-group"><label class="form-label">Amount (BDT) *</label>
          <input type="number" id="expAmt" class="form-input" placeholder="e.g. 1500"></div>
        <div class="form-group"><label class="form-label">Date *</label>
          <input type="date" id="expDate" class="form-input"></div>
        <div class="form-group"><label class="form-label">Description / Notes</label>
          <input type="text" id="expDesc" class="form-input" placeholder="e.g. Rickshaw to Gulshan shoot location"></div>
        <div class="form-group"><label class="form-label">Receipt / Photo (+10 XP)</label>
          <input type="file" id="expFile" class="form-input" accept="image/*,.pdf" style="padding:0.55rem;"></div>
        <button class="btn-primary" onclick="submitExpense()" style="margin-top:0.25rem;">📤 Submit Expense Claim</button>
      </div>`;
    document.getElementById('expDate') && (document.getElementById('expDate').valueAsDate = new Date());
    document.body.appendChild(sheet);
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(closeExpenseSheet);
    }
    setTimeout(() => { const el = document.getElementById('expDate'); if (el) el.valueAsDate = new Date(); }, 50);
  }

  function closeExpenseSheet() {
    document.getElementById('expenseSheet')?.remove();
    if (tg?.BackButton) tg.BackButton.hide();
  }

  async function submitExpense() {
    const cat = document.getElementById('expCat')?.value;
    const amt = document.getElementById('expAmt')?.value;
    const date = document.getElementById('expDate')?.value;
    const desc = document.getElementById('expDesc')?.value;
    const fileInput = document.getElementById('expFile');
    if (!cat || !amt || !date) { tg?.showAlert ? tg.showAlert('Please fill in Category, Amount & Date.') : alert('Fill required fields'); return; }

    let receiptUrl = '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        const file = fileInput.files[0];
        receiptUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      } catch (e) {}
    }

    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || 'debug';
      await fetch('/api/expenses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ telegramId, employeeId: currentUser?.id, employeeName: currentUser?.name, category: cat, amount: Number(amt), date, description: desc, receipt_url: receiptUrl })
      });
    } catch(e) {}
    closeExpenseSheet();
    showPhaseGate('🧾', 'Expense Submitted!', 5, `BDT ${Number(amt).toLocaleString()} claim forwarded to your Line Manager for Tier-1 approval.`, () => {});
  }

  function openLeaveForm() {
    const sheet = document.createElement('div');
    sheet.id = 'leaveSheet';
    sheet.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:300;overflow-y:auto;padding:1rem 0.85rem 2rem;';
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:1rem;font-weight:800;color:var(--text);">🌴 Leave Request</div>
        <button onclick="closeLeaveSheet()" style="background:var(--border);border:none;border-radius:10px;padding:0.35rem 0.7rem;font-family:'Outfit',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">✕ Close</button>
      </div>
      <div class="card" style="margin:0 0 0.75rem;">
        <div class="form-group"><label class="form-label">Leave Type *</label>
          <select id="leaveType" class="form-input"><option value="">Select...</option><option>Casual Leave</option><option>Sick Leave</option><option>Annual Leave</option><option>Emergency Leave</option><option>Unpaid Leave</option></select></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">From Date *</label><input type="date" id="leaveFrom" class="form-input"></div>
          <div class="form-group"><label class="form-label">To Date *</label><input type="date" id="leaveTo" class="form-input"></div>
        </div>
        <div class="form-group"><label class="form-label">Reason *</label>
          <textarea id="leaveReason" class="form-input" rows="3" placeholder="Brief reason for leave..."></textarea></div>
        <div class="form-group"><label class="form-label">Coverage Plan (optional)</label>
          <input type="text" id="leaveCover" class="form-input" placeholder="Who will handle your responsibilities?"></div>
        <button class="btn-primary" onclick="submitLeave()" style="margin-top:0.25rem;">📤 Submit Leave Request</button>
      </div>`;
    document.body.appendChild(sheet);
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(closeLeaveSheet);
    }
    setTimeout(() => {
      const today = new Date().toLocaleDateString('en-CA');
      const f = document.getElementById('leaveFrom'); if (f) f.value = today;
      const t = document.getElementById('leaveTo'); if (t) t.value = today;
    }, 50);
  }

  function closeLeaveSheet() {
    document.getElementById('leaveSheet')?.remove();
    if (tg?.BackButton) tg.BackButton.hide();
  }

  async function submitLeave() {
    const type = document.getElementById('leaveType')?.value;
    const from = document.getElementById('leaveFrom')?.value;
    const to = document.getElementById('leaveTo')?.value;
    const reason = document.getElementById('leaveReason')?.value?.trim();
    if (!type || !from || !to || !reason) { tg?.showAlert ? tg.showAlert('Please fill all required fields.') : alert('Fill required fields'); return; }
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      await fetch('/api/leaves', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ telegramId: tgUser?.id || 'debug', employeeId: currentUser?.id, employeeName: currentUser?.name, type, fromDate: from, toDate: to, reason, coverage: document.getElementById('leaveCover')?.value })
      });
    } catch(e) {}
    closeLeaveSheet();
    showPhaseGate('🌴', 'Leave Requested!', 0, `Your ${type} request has been sent to your Line Manager for approval. You'll get a Telegram notification on the decision.`, () => {});
  }

  async function openEODForm() {
    const now = new Date();
    const sheet = document.createElement('div');
    sheet.id = 'eodSheet';
    sheet.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:300;overflow-y:auto;padding:1rem 0.85rem 2rem;';
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <div style="font-size:1rem;font-weight:800;color:var(--text);">📝 End of Day Report</div>
        <button onclick="document.getElementById('eodSheet').remove()" style="background:var(--border);border:none;border-radius:10px;padding:0.35rem 0.7rem;font-family:'Outfit',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">✕ Close</button>
      </div>
      <div style="background:linear-gradient(135deg,var(--purple),var(--pink));border-radius:14px;padding:0.85rem;margin-bottom:0.85rem;color:#fff;">
        <div style="font-size:0.7rem;font-weight:800;opacity:0.75;text-transform:uppercase;letter-spacing:0.5px;">Submitting for</div>
        <div style="font-size:1rem;font-weight:800;margin-top:0.2rem;">${now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
        <div style="font-size:0.72rem;opacity:0.75;margin-top:0.15rem;">${currentUser?.name || 'Team Member'} · ${currentUser?.role || ''}</div>
      </div>
      <div class="card" style="margin:0 0 0.75rem;">
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
            <label class="form-label" style="margin:0;">Today's Completed Tasks *</label>
            <span id="eodAutoBadge" style="font-size:0.65rem;color:var(--purple);font-weight:700;">⏳ Auto-filling...</span>
          </div>
          <textarea id="eodTasks" class="form-input" rows="4" placeholder="• Edited Chillox Eid TVC (v3)&#10;• Attended morning briefing&#10;• Delivered 5 social posts for Apex"></textarea>
        </div>
        <div class="form-group"><label class="form-label">Blockers / Challenges (if any)</label>
          <textarea id="eodBlockers" class="form-input" rows="2" placeholder="e.g. Waiting for client feedback on Chillox cut"></textarea></div>
        <div class="form-group"><label class="form-label">Plan for Tomorrow</label>
          <textarea id="eodTomorrow" class="form-input" rows="2" placeholder="e.g. Start color grading for Apex product shoot"></textarea></div>
        <div class="form-group"><label class="form-label">Mood / Energy Today</label>
          <select id="eodMood" class="form-input">
            <option value="">Select...</option><option value="5">🔥 Excellent — peaked today</option><option value="4">😊 Good — productive</option><option value="3">😐 Okay — average day</option><option value="2">😓 Tough — needed support</option><option value="1">🆘 Burnout — need a break</option>
          </select></div>
        <button class="btn-primary" onclick="submitEOD()" style="margin-top:0.25rem;">📤 Submit EOD Report</button>
      </div>`;
    document.body.appendChild(sheet);

    // Auto-fill completed activity
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      const telegramId = tgUser?.id || currentUser?.telegramId || 'debug';
      const res = await fetch(`/api/team/daily-activity?telegramId=${telegramId}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          const ta = document.getElementById('eodTasks');
          if (ta && !ta.value) ta.value = data.text;
          const badge = document.getElementById('eodAutoBadge');
          if (badge) badge.textContent = '✨ Auto-filled';
        }
      }
    } catch(e) {
      const badge = document.getElementById('eodAutoBadge');
      if (badge) badge.style.display = 'none';
    }
  }

  async function submitEOD() {
    const tasks = document.getElementById('eodTasks')?.value?.trim();
    if (!tasks) { tg?.showAlert ? tg.showAlert('Please enter your completed tasks.') : alert('Enter tasks'); return; }
    const today = new Date().toLocaleDateString('en-CA');
    try {
      const tgUser = tg?.initDataUnsafe?.user;
      await fetch('/api/team/eod', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          telegramId: tgUser?.id || 'debug',
          employeeId: currentUser?.id,
          employeeName: currentUser?.name,
          date: today,
          tasks, blockers: document.getElementById('eodBlockers')?.value,
          tomorrow: document.getElementById('eodTomorrow')?.value,
          mood: document.getElementById('eodMood')?.value
        })
      });
    } catch(e) {}
    closeEODSheet();
    showPhaseGate('📝', 'EOD Submitted!', 10, `Your end-of-day report has been logged. Your manager will see it in tonight's summary. +10 XP earned!`, () => {});
  }

  function closeEODSheet() {
    document.getElementById('eodSheet')?.remove();
    if (tg?.BackButton) tg.BackButton.hide();
  }

  // ══════════════════════════════════════════
  // EXECUTIVE FUNCTIONS (Owner / MD)
  // ══════════════════════════════════════════
  async function loadPendingApprovals() {
    try {
      const res = await fetch('/api/team/pending-approvals', { headers: authHeaders() });
      const data = await res.json();
      const totalAgreements = data.agreements?.length || 0;
      const totalExpenses = data.expenses?.length || 0;
      const totalLeaves = data.leaves?.length || 0;
      const msg = `✍️ Pending Your Approval\n\n` +
        `📄 ${totalAgreements} Agreement(s) awaiting final seal\n` +
        `💸 ${totalExpenses} Expense(s) awaiting disbursement\n` +
        `🌴 ${totalLeaves} Leave request(s) pending\n\n` +
        `Open the web portal to action each item.`;
      tg?.showAlert ? tg.showAlert(msg) : alert(msg);
    } catch(e) {
      tg?.showAlert ? tg.showAlert('Open the web portal to see pending approvals.') : alert('See web portal');
    }
  }

  async function loadClientStatus() {
    try {
      const res = await fetch('/api/tasks?stage=Client+Review', { headers: authHeaders() });
      const tasks = await res.json();
      const inReview = tasks.filter(t => t.stage === 'Client Review');
      const inEdit = tasks.filter(t => t.stage === 'Editing' || t.stage === 'Post Production');
      let msg = `🎬 Campaign Pipeline\n\n`;
      if (inReview.length) {
        msg += `⏳ In Client Review (${inReview.length}):\n`;
        inReview.slice(0,5).forEach(t => { msg += `  • ${t.title} — ${t.client}\n`; });
        msg += '\n';
      }
      if (inEdit.length) {
        msg += `✂️ In Editing (${inEdit.length}):\n`;
        inEdit.slice(0,5).forEach(t => { msg += `  • ${t.title} — ${t.client}\n`; });
      }
      if (!inReview.length && !inEdit.length) msg += `All campaigns on track ✅`;
      tg?.showAlert ? tg.showAlert(msg) : alert(msg);
    } catch(e) {
      tg?.showAlert ? tg.showAlert('Open the web portal for campaign status.') : alert('See web portal');
    }
  }

  // ══════════════════════════════════════════
  // SSE REAL-TIME RECONNECT
  // ══════════════════════════════════════════
  let sseConnection = null;
  function setupSSE() {
    if (!window.EventSource) return;
    if (sseConnection) sseConnection.close();
    const token = sessionStorage.getItem('jwt_token') ||
                  localStorage.getItem('gro10x_token') ||
                  localStorage.getItem('sb-access-token') ||
                  localStorage.getItem('gro10x_token') ||
                  localStorage.getItem('gro10x_token') || '';
    const sseUrl = token ? `/api/events?role=team&token=${encodeURIComponent(token)}` : '/api/events?role=team';
    sseConnection = new EventSource(sseUrl);
    window._sseConnection = sseConnection;
    sseConnection.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'task_update' || payload.type === 'subtask_update') {
          loadUserTasks();
        }
      } catch(err) {}
    };
    ['task_update', 'subtask_update', 'team_update', 'attendance_update', 'leave_update', 'expense_update'].forEach(evt => {
      sseConnection.addEventListener(evt, () => {
        loadUserTasks();
      });
    });
    sseConnection.onerror = () => {
      sseConnection.close();
      setTimeout(setupSSE, 4000); // 4-second auto-reconnect fallback
    };
  }

  // ══════════════════════════════════════════
  // DBM MOBILE DIGITAL BRAND OPERATIONS
  // ══════════════════════════════════════════
  window.openDBMMobileModal = async function() {
    triggerHaptic();
    let modal = document.getElementById('dbmMobileModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'dbmMobileModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:99999;display:flex;flex-direction:column;justify-content:flex-end;';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:20px 20px 0 0;max-height:85vh;overflow-y:auto;padding:1.25rem 1rem;color:#070b12;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <div>
              <h3 style="font-size:1.1rem;font-weight:800;margin:0;">🛍️ DBM Brand Uploads</h3>
              <span style="font-size:0.72rem;color:#64748b;">Mark listings live & copy AI prompts</span>
            </div>
            <button onclick="document.getElementById('dbmMobileModal').style.display='none'" style="background:none;border:none;font-size:1.4rem;cursor:pointer;">✕</button>
          </div>
          <div id="dbmMobileContent"><div class="empty-state">Loading brand catalog...</div></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';

    try {
      const res = await fetch('/api/brands', { headers: authHeaders() });
      const data = await res.json();
      const brands = data.brands || [];
      const content = document.getElementById('dbmMobileContent');
      if (!content) return;

      content.innerHTML = `
        <div style="margin-bottom:0.75rem;">
          <label style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Select Brand:</label>
          <select id="dbmMobileBrandSel" onchange="renderDBMMobileBrandProducts(this.value)" style="width:100%;margin-top:0.25rem;padding:0.5rem;border-radius:10px;border:1.5px solid #e2e8f0;font-family:'Outfit',sans-serif;font-weight:700;">
            ${brands.map(b => `<option value="${b.id}">${b.id}. ${b.name} (${b.type}) — ${b.productsLive || 0}/100 Live</option>`).join('')}
          </select>
        </div>
        <div id="dbmMobileProductsList" style="display:flex;flex-direction:column;gap:0.5rem;max-height:55vh;overflow-y:auto;">
        </div>
      `;

      window._dbmBrandsCache = data;
      renderDBMMobileBrandProducts(brands[0]?.id || 1);
    } catch(err) {
      document.getElementById('dbmMobileContent').innerHTML = `<div class="empty-state">Could not load brands: ${err.message}</div>`;
    }
  };

  window.renderDBMMobileBrandProducts = function(brandId) {
    const data = window._dbmBrandsCache;
    if (!data) return;
    const bId = Number(brandId);
    const brand = (data.brands || []).find(b => b.id === bId);
    const listEl = document.getElementById('dbmMobileProductsList');
    if (!listEl || !brand) return;

    let prods = (data.productsCatalog && data.productsCatalog[bId]) || [];
    if (prods.length === 0) {
      const cats = brand.categories || ['Planners', 'Trackers', 'Bundles'];
      cats.forEach((cat, cIdx) => {
        for (let i = 1; i <= 10; i++) {
          prods.push({
            code: `${brand.name.substring(0,3).toUpperCase()}-${cIdx * 10 + i}`,
            name: `${cat} #${i} — ${brand.name} Style`,
            category: cat,
            status: 'Pending'
          });
        }
      });
    }

    listEl.innerHTML = prods.slice(0, 50).map((p, idx) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.6rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="font-size:0.82rem;color:#070b12;display:block;">${p.name}</strong>
          <span style="font-size:0.7rem;color:#64748b;">${p.category} · ${p.code || ''}</span>
        </div>
        <div style="display:flex;gap:0.3rem;">
          <button onclick="toggleMobileProductLive(${bId}, ${idx}, '${p.status === 'Live' ? 'Pending' : 'Live'}', this)" style="background:${p.status === 'Live' ? '#d1fae5' : '#ede9fe'};color:${p.status === 'Live' ? '#047857' : '#6d28d9'};border:none;border-radius:8px;padding:0.3rem 0.6rem;font-size:0.72rem;font-weight:800;cursor:pointer;">
            ${p.status === 'Live' ? '🟢 Live' : '⏳ Pending'}
          </button>
        </div>
      </div>
    `).join('');
  };

  window.toggleMobileProductLive = async function(brandId, productIdx, newStatus, btn) {
    triggerHaptic();
    btn.innerText = '...';
    try {
      await fetch(`/api/brands/${brandId}/product`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ productIdx, status: newStatus })
      });
      btn.style.background = newStatus === 'Live' ? '#d1fae5' : '#ede9fe';
      btn.style.color = newStatus === 'Live' ? '#047857' : '#6d28d9';
      btn.innerText = newStatus === 'Live' ? '🟢 Live' : '⏳ Pending';
    } catch(err) {
      alert('Error updating status');
    }
  };

  window.openDBMStandupMobile = function() {
    triggerHaptic();
    const brand = prompt('Which brand did you work on today?', 'PlannerQueenGro');
    if (!brand) return;
    const count = Number(prompt('How many products did you list today?', '8')) || 0;
    const notes = prompt('Standup notes / wins / blockers:', 'Completed daily batch') || '';

    fetch('/api/brands/dbm-logs', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        dbmId: 1,
        brandName: brand,
        listed: count,
        revenue: 0,
        notes
      })
    }).then(() => {
      triggerHaptic('success');
      alert(`✅ DBM Standup logged for ${brand} (${count} listings)!`);
    }).catch(e => alert('Error logging standup'));
  };

  // ══════════════════════════════════════════
  // START
  // ══════════════════════════════════════════
  init();
  startClock();
  setupSSE();

  window.showPage = showPage;
  window.handleClockToggle = handleClockToggle;
  window.openCreateTaskModal = openCreateTaskModal;
  window.closeCreateTaskModal = closeCreateTaskModal;
  window.openLeaveForm = openLeaveForm;
  window.closeLeaveSheet = closeLeaveSheet;
  window.submitLeave = submitLeave;
  window.openExpenseForm = openExpenseForm;
  window.closeExpenseSheet = closeExpenseSheet;
  window.submitExpense = submitExpense;
  window.openEODForm = openEODForm;
  window.closeEODSheet = closeEODSheet;
  window.submitEOD = submitEOD;
  window.loadUserTasks = loadUserTasks;
  window.setupSSE = setupSSE;
  window.getCurrentUser = () => currentUser;
