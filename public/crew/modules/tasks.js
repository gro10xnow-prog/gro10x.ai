/**
 * public/crew/modules/tasks.js
 * Interactive Crew Task Pipeline with Self-Advancement & Detail View
 */
window.CREW_MODULES = window.CREW_MODULES || {};

const WORKFLOW_MAP = {
  video:       ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved'],
  social:      ['Draft', 'Graphic Design', 'Copy Review', 'Scheduled', 'Published'],
  branding:    ['Strategy', 'Concepts', 'Client Refinement', 'Master Delivered'],
  development: ['Backlog', 'In Dev', 'Code Review', 'QA Testing', 'Deployed'],
  default:     ['To Do', 'In Progress', 'In Review', 'Done']
};

function getNextStage(task) {
  const type = (task.workflowType || task.workflow_type || task.category || 'default').toLowerCase();
  let stages = WORKFLOW_MAP.default;
  if (type.includes('video') || type.includes('edit') || type.includes('animat')) stages = WORKFLOW_MAP.video;
  else if (type.includes('social') || type.includes('content') || type.includes('post')) stages = WORKFLOW_MAP.social;
  else if (type.includes('brand') || type.includes('design') || type.includes('3d')) stages = WORKFLOW_MAP.branding;
  else if (type.includes('dev') || type.includes('tech') || type.includes('software')) stages = WORKFLOW_MAP.development;

  const currentStage = task.stage || task.customStatus || 'To Do';
  const idx = stages.findIndex(s => s.toLowerCase() === currentStage.toLowerCase());
  if (idx >= 0 && idx < stages.length - 1) {
    return stages[idx + 1];
  }
  if (idx === -1) {
    // If not in matched list, check if Done
    if (['approved', 'done', 'published', 'deployed', 'completed'].includes(currentStage.toLowerCase())) {
      return null;
    }
    return 'Done';
  }
  return null;
}

function formatDue(raw) {
  if (!raw) return 'ASAP';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parts = raw.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : raw;
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

window.crewAdvanceTask = async function(taskId, newStage, btn) {
  if (!taskId || !newStage) return;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.7;">⏳ Moving...</span>';

  try {
    const res = await CREW_API.patch(`/tasks/${taskId}`, { stage: newStage });
    if (res && (res.success !== false && !res.error)) {
      if (typeof window.showCrewToast === 'function') {
        window.showCrewToast(`Stage advanced to ${newStage}! 🎯`);
      }
      const modal = document.getElementById('crewTaskModal');
      if (modal) modal.style.display = 'none';
      // Re-render tasks view
      const viewContainer = document.getElementById('crew-view');
      if (viewContainer && window.CREW_MODULES.tasks) {
        window.CREW_MODULES.tasks(viewContainer);
      }
    } else {
      throw new Error(res?.error || 'Failed to update stage');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalText;
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`Error: ${err.message}`, 'error');
    }
  }
};

window.crewOpenTask = function(taskId) {
  const task = (window._crewTasks || []).find(t => String(t.id) === String(taskId));
  if (!task) return;

  const modal = document.getElementById('crewTaskModal');
  const content = document.getElementById('crewTaskModalContent');
  if (!modal || !content) return;

  const nextStage = getNextStage(task);
  const priorityColor = (task.priority || '').toLowerCase() === 'high' ? '#ef4444' : (task.priority || '').toLowerCase() === 'low' ? 'var(--emerald-brand)' : 'var(--purple-light)';

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; gap:1rem;">
      <div>
        <span class="badge badge-purple" style="font-size:0.75rem; margin-bottom:0.4rem; display:inline-block;">${task.workflowType || task.category || 'Production'}</span>
        <h2 style="margin:0.2rem 0; font-size:1.25rem; font-family:var(--font-heading); color:#fff;">${task.title}</h2>
        <div style="font-size:0.8rem; color:var(--text-muted);">ID: <span style="font-family:monospace; color:var(--purple-light);">${task.id}</span></div>
      </div>
      <button onclick="document.getElementById('crewTaskModal').style.display='none'" style="background:rgba(255,255,255,0.08); border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;">✕</button>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.25rem; font-size:0.85rem;">
      <div class="card-glass" style="padding:0.75rem;">
        <div style="color:var(--text-muted); font-size:0.75rem;">Client / Brand</div>
        <div style="font-weight:700; color:var(--text-primary); margin-top:0.2rem;">🏢 ${task.client || task.company || 'Internal'}</div>
      </div>
      <div class="card-glass" style="padding:0.75rem;">
        <div style="color:var(--text-muted); font-size:0.75rem;">Priority</div>
        <div style="font-weight:700; color:${priorityColor}; margin-top:0.2rem;">⚡ ${task.priority || 'Medium'}</div>
      </div>
      <div class="card-glass" style="padding:0.75rem;">
        <div style="color:var(--text-muted); font-size:0.75rem;">Current Stage</div>
        <div style="font-weight:700; color:var(--purple-light); margin-top:0.2rem;">📌 ${task.stage || 'To Do'}</div>
      </div>
      <div class="card-glass" style="padding:0.75rem;">
        <div style="color:var(--text-muted); font-size:0.75rem;">Deadline</div>
        <div style="font-weight:700; color:var(--text-primary); margin-top:0.2rem;">📅 ${formatDue(task.dueDate || task.due_date)}</div>
      </div>
    </div>

    ${(task.qc_feedback || task.qcFeedback) ? `
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.85rem; font-weight:700; color:#ef4444; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
          <span>🔍</span> <span>QC Reviewer Feedback</span>
        </div>
        <div class="card-glass" style="padding:0.9rem 1.1rem; border:1px solid rgba(239,68,68,0.4); background:rgba(239,68,68,0.06); font-size:0.88rem; line-height:1.5; color:#fff; border-radius:12px;">
          ${task.qc_feedback || task.qcFeedback}
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom:1.5rem;">
      <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:0.4rem;">Brief & Description</div>
      <div class="card-glass" style="padding:1rem; font-size:0.88rem; line-height:1.6; color:var(--text-primary); white-space:pre-wrap; max-height:220px; overflow-y:auto;">${task.description || 'No detailed brief provided for this task.'}</div>
      <div id="aiSummaryBox_${task.id}" style="margin-top:0.75rem;"></div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:1rem; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <button class="btn-secondary" style="font-size:0.82rem; padding:0.45rem 0.85rem; color:var(--purple-light); border-color:rgba(139,92,246,0.3);" onclick="crewAISummary('${task.id}', this)">
          🤖 AI Brief Summary
        </button>
      </div>
      <div style="display:flex; gap:0.65rem;">
        <button class="btn-secondary" onclick="document.getElementById('crewTaskModal').style.display='none'">Close</button>
        ${nextStage ? `
          <button class="btn-primary" onclick="crewAdvanceTask('${task.id}', '${nextStage}', this)">
            → Advance to ${nextStage}
          </button>
        ` : `<span class="badge badge-emerald" style="padding:0.5rem 0.9rem; font-size:0.82rem;">✅ Milestone Completed</span>`}
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.crewAISummary = async function(taskId, btn) {
  const task = (window._crewTasks || []).find(t => String(t.id) === String(taskId));
  if (!task) return;

  const briefText = task.description || task.brief || '';
  if (!briefText || briefText.trim().length < 10) {
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast('Task brief is too short (minimum 10 characters required for AI summary).', 'error');
    }
    return;
  }

  const box = document.getElementById(`aiSummaryBox_${taskId}`);
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Analyzing...';
  }

  try {
    const res = await CREW_API.post('/ai/summarize-brief', {
      briefText,
      taskTitle: task.title,
      taskId
    });

    if (box && res && res.summary) {
      const bullets = Array.isArray(res.summary) ? res.summary : [res.summary];
      box.innerHTML = `
        <div style="background:linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.06)); border:1px solid var(--purple-light); border-radius:12px; padding:0.9rem 1.1rem;">
          <div style="font-size:0.8rem; font-weight:800; color:var(--purple-light); margin-bottom:0.4rem; display:flex; align-items:center; gap:0.35rem;">
            <span>🤖</span> <span>AI Brief Summary (${res.generatedBy || 'gemini'})</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.35rem;">
            ${bullets.map(b => `
              <div style="display:flex; gap:0.5rem; font-size:0.82rem; line-height:1.5; color:var(--text-primary);">
                <span style="color:var(--purple-light); font-weight:700;">&bull;</span>
                <span>${b}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  } catch (err) {
    if (typeof window.showCrewToast === 'function') {
      window.showCrewToast(`AI summary error: ${err.message}`, 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
};

window.CREW_MODULES.tasks = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const tasks = await CREW_API.get('/tasks').catch(() => []);

  const userName = (user.name || '').toLowerCase();
  const empCode = user.emp_code || user.id || '';

  const myTasks = (tasks || []).filter(t => {
    const codeMatch = empCode && (t.assignee_id === empCode || t.assigneeId === empCode);
    const direct = userName && (t.assignee || '').toLowerCase().includes(userName);
    const list = userName && Array.isArray(t.assignees) && t.assignees.some(a => (a || '').toLowerCase().includes(userName));
    return codeMatch || direct || list;
  });

  window._crewTasks = myTasks;

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📋 My Assigned Tasks (${myTasks.length})</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Advance stages as you progress through deliverables.</div>
      </div>
    </div>

    <!-- Task Cards -->
    <div style="display:flex; flex-direction:column; gap:0.85rem;">
      ${myTasks.map(t => {
        const nextStage = getNextStage(t);
        const isDone = !nextStage;
        return `
          <div class="card-glass" data-task-id="${t.id}" style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; transition:var(--transition-fast);">
            <div style="cursor:pointer; flex:1; min-width:220px;" onclick="crewOpenTask('${t.id}')">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <span class="badge ${isDone ? 'badge-emerald' : 'badge-purple'}" style="font-size:0.7rem;">${t.stage || 'To Do'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">${t.workflowType || t.category || 'Task'}</span>
              </div>
              <div style="font-weight:700; color:var(--text-primary); font-size:0.98rem;">${t.title}</div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">
                🏢 ${t.client || 'Agency'} &bull; 📅 Due: ${formatDue(t.dueDate || t.due_date)} &bull; ⚡ ${t.priority || 'Normal'}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem;">
              <button class="btn-secondary" style="font-size:0.78rem; padding:0.4rem 0.75rem;" onclick="crewOpenTask('${t.id}')">
                👁️ View
              </button>
              ${nextStage ? `
                <button class="btn-primary" style="font-size:0.78rem; padding:0.4rem 0.85rem; white-space:nowrap;" onclick="crewAdvanceTask('${t.id}', '${nextStage}', this)">
                  → ${nextStage}
                </button>
              ` : `
                <span class="badge badge-emerald" style="font-size:0.75rem; padding:0.4rem 0.6rem;">✅ Done</span>
              `}
            </div>
          </div>
        `;
      }).join('') || `
        <div class="card-glass" style="text-align:center; padding:3.5rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎉</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem;">All caught up!</div>
          <div style="font-size:0.85rem; margin-top:0.3rem;">No active production tasks assigned to you right now.</div>
        </div>
      `}
    </div>

    <!-- Task Detail Modal Backdrop -->
    <div id="crewTaskModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:2000; align-items:center; justify-content:center; padding:1rem;" onclick="if(event.target===this) this.style.display='none'">
      <div id="crewTaskModalContent" class="card-glass" style="max-width:560px; width:100%; max-height:90vh; overflow-y:auto; background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:18px; padding:1.5rem;" onclick="event.stopPropagation()">
      </div>
    </div>
  `;
};
