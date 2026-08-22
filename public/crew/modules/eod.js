/**
 * public/crew/modules/eod.js
 * Native Web EOD Submission Module for Crew Workspace
 */
window.CREW_MODULES = window.CREW_MODULES || {};

window.selectCrewMood = function(btn) {
  document.querySelectorAll('.crew-mood-btn').forEach(b => {
    b.style.borderColor = 'var(--border-subtle)';
    b.style.background = 'rgba(255,255,255,0.03)';
    b.classList.remove('selected');
  });
  btn.style.borderColor = 'var(--purple-light)';
  btn.style.background = 'rgba(139,92,246,0.2)';
  btn.classList.add('selected');
};

window.submitCrewEOD = async function(passedEmpCode, passedEmpName) {
  const btn = document.getElementById('crewEodSubmitBtn');
  const empCode = passedEmpCode || btn?.dataset?.empCode || '';
  const empName = passedEmpName || btn?.dataset?.empName || '';

  const summary = (document.getElementById('crewEodSummary')?.value || '').trim();
  if (!summary) {
    if (typeof window.showCrewToast === 'function') window.showCrewToast('Please enter your summary of tasks completed today.', 'error');
    return;
  }

  const tomorrow = (document.getElementById('crewEodTomorrow')?.value || '').trim();
  const blockers = (document.getElementById('crewEodBlockers')?.value || '').trim() || 'None';
  const hours = parseFloat(document.getElementById('crewEodHours')?.value) || 8;
  const selectedMoodEl = document.querySelector('.crew-mood-btn.selected');
  const mood = selectedMoodEl ? selectedMoodEl.dataset.mood : '😊 Energized';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Submitting EOD...';
  }

  try {
    const res = await CREW_API.post('/team/eod', {
      employeeId: empCode,
      name: empName,
      summary: summary,
      tasks_done: summary,
      tasksTomorrow: tomorrow || 'Standard pipeline queue',
      blockers: blockers,
      mood: mood,
      hours: hours
    });

    if (res && (res.success !== false && !res.error)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast('EOD Report submitted successfully! +10 XP 🔥');
      }
      setTimeout(() => {
        window.location.hash = '#home';
      }, 900);
    } else {
      throw new Error(res?.error || 'Failed to submit EOD report');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '✅ Submit Daily EOD Report (+10 XP)';
    }
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.CREW_MODULES.eod = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const empCode = user.emp_code || user.id || 'PBD-001';
  const empName = user.name || 'Specialist';
  const todayStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📝 Submit Daily EOD Report</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Daily accountability log for ${todayStr}.</div>
    </div>

    <div class="card-glass" style="max-width:680px; margin:0 auto; padding:1.75rem;">
      <div style="margin-bottom:1.25rem;">
        <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
          What did you accomplish today? <span style="color:#ef4444;">*</span>
        </label>
        <textarea id="crewEodSummary" rows="4" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; resize:vertical; box-sizing:border-box;" placeholder="• Completed edit on Video Project #2\n• Rendered 3D scene lighting\n• Fixed backend API bug"></textarea>
      </div>

      <div style="margin-bottom:1.25rem;">
        <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
          What are your key priorities for tomorrow?
        </label>
        <textarea id="crewEodTomorrow" rows="2" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; resize:vertical; box-sizing:border-box;" placeholder="• Begin sound design & color grade\n• Client review check-in"></textarea>
      </div>

      <div style="margin-bottom:1.25rem;">
        <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
          Any blockers or bottlenecks?
        </label>
        <input type="text" id="crewEodBlockers" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; box-sizing:border-box;" placeholder="None (or explain what you are waiting on)">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Hours Logged
          </label>
          <input type="number" id="crewEodHours" value="8" min="1" max="16" step="0.5" style="width:100%; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem; color:#fff; font-family:inherit; font-size:0.9rem; box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block; font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">
            Today's Mood / Energy
          </label>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="crew-mood-btn selected" data-mood="😊 Energized" onclick="selectCrewMood(this)" aria-label="Energized" title="Energized" style="display:flex; align-items:center; gap:0.3rem; min-height:44px; min-width:44px; padding:0.5rem 0.75rem; border-radius:10px; border:1px solid var(--purple-light); background:rgba(139,92,246,0.2); color:#fff; cursor:pointer; font-size:1.15rem;">
              <span>😊</span> <span style="font-size:0.75rem; font-weight:700;">Energized</span>
            </button>
            <button type="button" class="crew-mood-btn" data-mood="🔥 Fired Up" onclick="selectCrewMood(this)" aria-label="Fired Up" title="Fired Up" style="display:flex; align-items:center; gap:0.3rem; min-height:44px; min-width:44px; padding:0.5rem 0.75rem; border-radius:10px; border:1px solid var(--border-subtle); background:rgba(255,255,255,0.03); color:#fff; cursor:pointer; font-size:1.15rem;">
              <span>🔥</span> <span style="font-size:0.75rem; font-weight:700;">Fired Up</span>
            </button>
            <button type="button" class="crew-mood-btn" data-mood="😐 Neutral" onclick="selectCrewMood(this)" aria-label="Neutral" title="Neutral" style="display:flex; align-items:center; gap:0.3rem; min-height:44px; min-width:44px; padding:0.5rem 0.75rem; border-radius:10px; border:1px solid var(--border-subtle); background:rgba(255,255,255,0.03); color:#fff; cursor:pointer; font-size:1.15rem;">
              <span>😐</span> <span style="font-size:0.75rem; font-weight:700;">Neutral</span>
            </button>
            <button type="button" class="crew-mood-btn" data-mood="😓 Stressed" onclick="selectCrewMood(this)" aria-label="Stressed" title="Stressed" style="display:flex; align-items:center; gap:0.3rem; min-height:44px; min-width:44px; padding:0.5rem 0.75rem; border-radius:10px; border:1px solid var(--border-subtle); background:rgba(255,255,255,0.03); color:#fff; cursor:pointer; font-size:1.15rem;">
              <span>😓</span> <span style="font-size:0.75rem; font-weight:700;">Stressed</span>
            </button>
            <button type="button" class="crew-mood-btn" data-mood="😴 Tired" onclick="selectCrewMood(this)" aria-label="Tired" title="Tired" style="display:flex; align-items:center; gap:0.3rem; min-height:44px; min-width:44px; padding:0.5rem 0.75rem; border-radius:10px; border:1px solid var(--border-subtle); background:rgba(255,255,255,0.03); color:#fff; cursor:pointer; font-size:1.15rem;">
              <span>😴</span> <span style="font-size:0.75rem; font-weight:700;">Tired</span>
            </button>
          </div>
        </div>
      </div>

      <button id="crewEodSubmitBtn" class="btn-primary" style="width:100%; padding:0.85rem; font-size:1rem; font-weight:700; border-radius:12px; cursor:pointer;" data-emp-code="${empCode}" data-emp-name="${(empName || '').replace(/"/g, '&quot;')}" onclick="submitCrewEOD()">
        ✅ Submit Daily EOD Report (+10 XP)
      </button>
    </div>
  `;
};
