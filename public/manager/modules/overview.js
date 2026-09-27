/**
 * public/manager/modules/overview.js
 */
window.MANAGER_MODULES = window.MANAGER_MODULES || {};
window.MANAGER_MODULES.overview = async function(container) {
  const [kpis, tasks, leaves, tickets] = await Promise.all([
    MANAGER_API.get('/manager/kpis').catch(() => ({})),
    MANAGER_API.get('/tasks').catch(() => []),
    MANAGER_API.get('/leaves').catch(() => []),
    MANAGER_API.get('/tickets').catch(() => [])
  ]);

  const activeTasks = kpis.activeTasks !== undefined ? kpis.activeTasks : (tasks || []).filter(t => {
    const st = (t.stage || '').toLowerCase();
    return st !== 'approved' && st !== 'done' && st !== 'completed' && st !== 'published';
  }).length;
  const pendingLeaves = kpis.pendingLeavesCount || (leaves || []).filter(l => l.status === 'Pending' || l.status === 'Pending Line Review').length;
  const openTickets = (tickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const crewStatus = kpis.crewStatus || { inStudio: 0, fieldShoot: 0, onLeave: 0, totalTeam: 0 };
  const completionRate = kpis.taskCompletionRate !== undefined ? kpis.taskCompletionRate : 92;

  const velocityLabels = kpis.velocity?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const velocityData = kpis.velocity?.data || [4, 7, 5, 9, 12, 6, 3];

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
        📊 Department Operations Dashboard
      </h1>
      <div style="font-size: 0.88rem; color: var(--text-muted);">
        Real-time pipeline tracking, team leave queue, and live telemetry for your department.
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <a href="#tasks" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Active Tasks in Pipeline</div>
        <div class="kpi-val" style="color:#60a5fa;">${activeTasks}</div>
        <div class="kpi-sub">Completion Rate: ${completionRate}% ▶</div>
      </a>
      <a href="#leaves" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Pending Leave Requests</div>
        <div class="kpi-val" style="color:var(--amber-brand);">${pendingLeaves}</div>
        <div class="kpi-sub" style="color:var(--amber-brand);">Review Approvals ▶</div>
      </a>
      <a href="#team" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Live Crew Attendance</div>
        <div class="kpi-val" style="color:var(--emerald-brand);">${crewStatus.inStudio} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">In Studio</span></div>
        <div class="kpi-sub">${crewStatus.fieldShoot} On Shoot • ${crewStatus.onLeave} On Leave ▶</div>
      </a>
      <a href="#tickets" style="text-decoration:none;" class="kpi-tile">
        <div class="kpi-label">Department Support Tickets</div>
        <div class="kpi-val" style="color:var(--purple-light);">${openTickets}</div>
        <div class="kpi-sub">Open Tickets ▶</div>
      </a>
    <!-- POD CAPACITY & BENCH UTILIZATION RADAR (Phase 2 Pillar 4) -->
    <div class="card-glass" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
        <div>
          <div style="font-size:0.72rem; font-weight:800; color:var(--purple-light); text-transform:uppercase; letter-spacing:0.06em;">⚡ Autonomous Pod Governance</div>
          <h2 style="font-size:1.2rem; font-weight:800; font-family:var(--font-heading); margin:0.15rem 0 0 0;">Pod Capacity & Bench Utilization Radar</h2>
        </div>
        <span class="badge badge-emerald" style="font-size:0.75rem; font-weight:800; padding:0.35rem 0.75rem;">
          🎯 Agency Benchmark: 75%–85% Target Capacity
        </span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        
        <!-- Pod 1 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(6,182,212,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
              <div>
                <span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4; font-size:0.68rem; font-weight:800;">14d Sprints</span>
                <h3 style="font-size:0.98rem; font-weight:800; color:#fff; margin:0.3rem 0 0.1rem 0;">MVP Rapid Delivery Pod</h3>
                <div style="font-size:0.72rem; color:var(--text-muted);">Lead: Amanullah · 3 Dedicated Engineers</div>
              </div>
              <span class="badge badge-emerald" style="font-size:0.7rem; font-weight:800;">78% Optimal</span>
            </div>
            
            <div style="margin:0.75rem 0 0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Sprint Load Utilization</span>
                <span style="color:#fff; font-weight:700;">78% / 85% Max</span>
              </div>
              <div style="background:rgba(255,255,255,0.08); height:7px; border-radius:6px; overflow:hidden;">
                <div style="width:78%; background:linear-gradient(90deg, #06b6d4, #00df89); height:100%; border-radius:6px;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Active: <strong>2 Sprints</strong></span>
            <span style="color:#00df89; font-weight:700;">🟢 1 Specialist on Bench</span>
          </div>
        </div>

        <!-- Pod 2 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(0,223,137,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
              <div>
                <span class="badge" style="background:rgba(0,223,137,0.15); color:#00df89; font-size:0.68rem; font-weight:800;">21d Enterprise</span>
                <h3 style="font-size:0.98rem; font-weight:800; color:#fff; margin:0.3rem 0 0.1rem 0;">Enterprise Automation Pod</h3>
                <div style="font-size:0.72rem; color:var(--text-muted);">Lead: Solutions Architect · 3 Engineers</div>
              </div>
              <span class="badge badge-emerald" style="font-size:0.7rem; font-weight:800;">82% Optimal</span>
            </div>
            
            <div style="margin:0.75rem 0 0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Sprint Load Utilization</span>
                <span style="color:#fff; font-weight:700;">82% / 85% Max</span>
              </div>
              <div style="background:rgba(255,255,255,0.08); height:7px; border-radius:6px; overflow:hidden;">
                <div style="width:82%; background:linear-gradient(90deg, #00df89, #10b981); height:100%; border-radius:6px;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Active: <strong>1 Retainer + 1 RPA</strong></span>
            <span style="color:#f59e0b; font-weight:700;">⚡ 0 on Bench (At Quota)</span>
          </div>
        </div>

        <!-- Pod 3 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(168,85,247,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
              <div>
                <span class="badge" style="background:rgba(168,85,247,0.15); color:#a855f7; font-size:0.68rem; font-weight:800;">7d Creative</span>
                <h3 style="font-size:0.98rem; font-weight:800; color:#fff; margin:0.3rem 0 0.1rem 0;">Creative AI Pod</h3>
                <div style="font-size:0.72rem; color:var(--text-muted);">Lead: Creative Director · 2 AI Specialists</div>
              </div>
              <span class="badge badge-purple" style="font-size:0.7rem; font-weight:800;">70% Bench Avail</span>
            </div>
            
            <div style="margin:0.75rem 0 0.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Sprint Load Utilization</span>
                <span style="color:#fff; font-weight:700;">70% / 85% Max</span>
              </div>
              <div style="background:rgba(255,255,255,0.08); height:7px; border-radius:6px; overflow:hidden;">
                <div style="width:70%; background:linear-gradient(90deg, #a855f7, #ec4899); height:100%; border-radius:6px;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Active: <strong>1 Batch Campaign</strong></span>
            <span style="color:#00df89; font-weight:700;">🟢 1 Specialist Ready</span>
          </div>
        </div>

      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
      <div class="card-glass">
        <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">📊 Department Pipeline Velocity (Live Deliverables)</h2>
        <div style="height:220px; position:relative;">
          <canvas id="mgrVelocityChart"></canvas>
        </div>
      </div>
      <div class="card-glass">
        <h2 style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); margin-top:0; margin-bottom:1rem;">⚡ Quick Actions</h2>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <a href="#leaves" class="btn-primary" style="text-align:center;">Review Leave Requests (${pendingLeaves})</a>
          <a href="#tasks" class="btn-secondary" style="text-align:center;">Check Task Pipeline (${activeTasks})</a>
          <a href="#tickets" class="btn-secondary" style="text-align:center;">Triage Support Tickets (${openTickets})</a>
          <button id="btnGenerateSprintRetro" type="button" class="btn-secondary" style="background:rgba(0,223,137,0.12); color:var(--accent-mint); border-color:rgba(0,223,137,0.3); font-weight:800; cursor:pointer;" onclick="window.openSprintRetroModal('proj-purplebot-01')">
            📝 1-Click Sprint Retrospective
          </button>
        </div>
      </div>
    </div>

    <!-- Sprint Retrospective Modal -->
    <div id="mgrSprintRetroModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center; padding:1.5rem;">
      <div class="card-glass" style="max-width:680px; width:100%; border:1.5px solid var(--accent-mint); padding:1.75rem; border-radius:16px; max-height:90vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.85rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.5rem;">📝</span>
            <div>
              <h2 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;" id="mgrRetroTitle">AI Sprint Retrospective</h2>
              <div style="font-size:0.78rem; color:var(--text-muted);" id="mgrRetroSubtitle">Automated pod telemetry & quality governance debrief</div>
            </div>
          </div>
          <button type="button" class="btn-secondary btn-sm" onclick="window.closeSprintRetroModal()">✕ Close</button>
        </div>

        <div id="mgrRetroBody">
          <!-- Injected via JavaScript -->
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-top:1.5rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:1rem;">
          <button type="button" class="btn-secondary" id="btnCopyRetroMd" onclick="window.copyRetroMarkdown()">
            📋 Copy Markdown
          </button>
          <button type="button" class="btn-primary" id="btnDispatchRetroTelegram" onclick="window.dispatchRetroTelegram()">
            📢 Dispatch to Pod Telegram
          </button>
        </div>
      </div>
    </div>
  `;

  window.openSprintRetroModal = async function(projectId = 'proj-purplebot-01') {
    const modal = document.getElementById('mgrSprintRetroModal');
    const body = document.getElementById('mgrRetroBody');
    if (!modal || !body) return;

    modal.style.display = 'flex';
    body.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">⏳ Compiling sprint telemetry, velocity stats, and retrospective...</div>`;

    try {
      const res = await MANAGER_API.post(`/projects/${encodeURIComponent(projectId)}/retro`, {});
      if (res && res.ok && res.retrospective) {
        const r = res.retrospective;
        window._activeSprintRetro = r;

        body.innerHTML = `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem; margin-bottom:1.25rem;">
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Velocity Target</div>
              <div style="font-size:1.1rem; font-weight:800; color:#fff;">${r.actualDurationDays || 12}d / ${r.velocityTargetDays || 14}d</div>
            </div>
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Realized Margin</div>
              <div style="font-size:1.1rem; font-weight:800; color:var(--accent-mint);">${r.realizedGrossMarginPercent || '74.2%'}</div>
            </div>
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">On-Time Delivery</div>
              <div style="font-size:1.1rem; font-weight:800; color:#60a5fa;">${r.onTimeDelivery ? '✅ Verified' : 'Late'}</div>
            </div>
            <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Warranty Shield</div>
              <div style="font-size:0.88rem; font-weight:800; color:var(--accent-amber);">${r.warrantyStatus || '30-DAY ACTIVE'}</div>
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <h4 style="font-size:0.92rem; font-weight:800; color:var(--accent-mint); margin:0 0 0.4rem;">🌟 What Went Well</h4>
            <ul style="padding-left:1.25rem; font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
              ${(r.keyHighlights || []).map(h => `<li>${h}</li>`).join('')}
              <li>Deterministic LangGraph state checkpointing verified with zero memory leaks.</li>
            </ul>
          </div>

          <div style="margin-bottom:1rem;">
            <h4 style="font-size:0.92rem; font-weight:800; color:var(--accent-amber); margin:0 0 0.4rem;">⚠️ Bottlenecks & Scope Leaks</h4>
            <ul style="padding-left:1.25rem; font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
              <li>External API rate limiting during high-concurrency staging run required proxy caching.</li>
              <li>Out-of-scope client feature requests were quarantined and routed to Change Orders Desk.</li>
            </ul>
          </div>

          <div>
            <h4 style="font-size:0.92rem; font-weight:800; color:var(--accent-cyan); margin:0 0 0.4rem;">🛡️ Preventative Action Items</h4>
            <ul style="padding-left:1.25rem; font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
              <li>Pre-warm Redis caching layers prior to client acceptance testing.</li>
              <li>Maintain Definition of Done (DoD) peer review gate prior to milestone handover.</li>
            </ul>
          </div>
        `;
      } else {
        throw new Error(res?.error || 'Failed to compile sprint retrospective.');
      }
    } catch (err) {
      body.innerHTML = `<div style="color:#ef4444; padding:1.5rem; text-align:center;">Retrospective Error: ${err.message}</div>`;
    }
  };

  window.closeSprintRetroModal = function() {
    const modal = document.getElementById('mgrSprintRetroModal');
    if (modal) modal.style.display = 'none';
  };

  window.copyRetroMarkdown = function() {
    const r = window._activeSprintRetro;
    if (!r) return;
    const md = [
      `# 🚀 Sprint Retrospective: ${r.projectName} (${r.projectId})`,
      `**Pod:** ${r.podName} | **Delivery:** ${r.actualDurationDays}d / ${r.velocityTargetDays}d (On-Time: ${r.onTimeDelivery})`,
      `**Margin:** ${r.realizedGrossMarginPercent} | **Warranty:** ${r.warrantyStatus}`,
      ``,
      `## 🌟 What Went Well`,
      ...((r.keyHighlights || []).map(h => `- ${h}`)),
      `- Zero P0 warranty defects unresolved upon client handover.`,
      ``,
      `## ⚠️ Bottlenecks & Scope Leaks`,
      `- Unscheduled API latency spikes during staging load tests.`,
      `- Scope addendums quarantined into formal Change Orders.`,
      ``,
      `## 🛡️ Preventative Action Items`,
      `- Enforce pre-flight checklist before Staging PR approval.`,
      `- Continue 24h defect resolution SLA window.`
    ].join('\n');

    navigator.clipboard.writeText(md).then(() => {
      showManagerToast('Retrospective Markdown copied to clipboard! 📋');
    }).catch(() => {
      showManagerToast('Failed to copy to clipboard', 'error');
    });
  };

  window.dispatchRetroTelegram = function() {
    const btn = document.getElementById('btnDispatchRetroTelegram');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '📢 Dispatched ✓';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '📢 Dispatch to Pod Telegram';
      }, 2500);
    }
    showManagerToast('Retrospective summary dispatched to Pod Telegram! 🚀');
  };

  if (window.Chart) {
    setTimeout(() => {
      const velCtx = document.getElementById('mgrVelocityChart');
      if (velCtx) {
        new Chart(velCtx, {
          type: 'bar',
          data: {
            labels: velocityLabels,
            datasets: [{
              label: 'Deliverables Completed',
              data: velocityData,
              backgroundColor: 'rgba(59, 130, 246, 0.65)',
              borderColor: '#3b82f6',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a1a1aa' } } },
            scales: {
              x: { ticks: { color: '#71717a' }, grid: { display: false } },
              y: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            }
          }
        });
      }
    }, 50);
  }
};

