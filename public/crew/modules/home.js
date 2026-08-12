/**
 * public/crew/modules/home.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.home = async function(container) {
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const tasks = await CREW_API.get('/tasks').catch(() => []);

  const myTasks = (tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((user.name || '').toLowerCase()));
  const activeCount = myTasks.filter(t => t.stage !== 'Approved').length;

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

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <a href="#tasks" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Active Tasks Assigned</div>
        <div class="kpi-val" style="color:var(--purple-light);">${activeCount}</div>
        <div class="kpi-sub">View My Tasks ▶</div>
      </a>
      <a href="#leaves" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Leave Request Status</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">Active</div>
        <div class="kpi-sub">Apply PTO ▶</div>
      </a>
    </div>

    <div class="card-glass">
      <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0;">📱 Field Actions (Telegram Bot)</h2>
      <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
        Clocking in/out, submitting daily EOD reports, and GPS check-ins are done via Telegram Bot for maximum speed.
      </div>
      <a href="https://t.me/purplemanosbot" target="_blank" class="btn-primary">🤖 Launch Crew Bot (@purplemanosbot)</a>
    </div>
  `;
};
