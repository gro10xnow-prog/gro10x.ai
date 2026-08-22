/**
 * public/crew/modules/calendar.js
 * Marketing & Content Calendar View for Specialists
 */
window.CREW_MODULES = window.CREW_MODULES || {};

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth(); // 0-indexed
let selectedCalDate = new Date().toISOString().split('T')[0];

window.changeCrewCalMonth = function(delta) {
  currentCalMonth += delta;
  if (currentCalMonth < 0) {
    currentCalMonth = 11;
    currentCalYear--;
  } else if (currentCalMonth > 11) {
    currentCalMonth = 0;
    currentCalYear++;
  }
  const viewContainer = document.getElementById('crew-view');
  if (viewContainer && window.CREW_MODULES.calendar) {
    window.CREW_MODULES.calendar(viewContainer);
  }
};

window.selectCrewCalDate = function(dateStr) {
  selectedCalDate = dateStr;
  const viewContainer = document.getElementById('crew-view');
  if (viewContainer && window.CREW_MODULES.calendar) {
    window.CREW_MODULES.calendar(viewContainer);
  }
};

window.CREW_MODULES.calendar = async function(container) {
  const me = await CREW_API.getMe().catch(() => ({}));
  const user = me.user || {};
  const userName = (user.name || '').toLowerCase();
  const empCode = user.emp_code || user.id || '';

  const tasks = await CREW_API.get('/tasks').catch(() => []);
  const contentTasks = (tasks || []).filter(t => {
    const type = (t.workflowType || t.category || t.department || '').toLowerCase();
    const isContentRole = type.includes('social') || type.includes('content') || type.includes('post') || type.includes('market') || type.includes('copy') || type.includes('brand');
    const isAssigned = (empCode && (t.assignee_id === empCode || t.assigneeId === empCode)) ||
                       (userName && (t.assignee || '').toLowerCase().includes(userName)) ||
                       (userName && Array.isArray(t.assignees) && t.assignees.some(a => (a || '').toLowerCase().includes(userName)));
    return isContentRole || isAssigned;
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay();
  const totalDays = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();

  // Index tasks by date YYYY-MM-DD
  const tasksByDate = {};
  contentTasks.forEach(t => {
    const rawDate = t.dueDate || t.due_date || t.created_at;
    if (rawDate) {
      const dStr = String(rawDate).split('T')[0];
      if (!tasksByDate[dStr]) tasksByDate[dStr] = [];
      tasksByDate[dStr].push(t);
    }
  });

  const dayTasks = tasksByDate[selectedCalDate] || [];

  let gridCells = '';
  // Empty lead cells
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells += `<div style="background:rgba(0,0,0,0.1); border-radius:8px; min-height:60px; opacity:0.3;"></div>`;
  }

  // Active days in month
  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(currentCalYear, currentCalMonth, day);
    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const dayStr = `${currentCalYear}-${String(currentCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayList = tasksByDate[dayStr] || [];
    const isSelected = dayStr === selectedCalDate;
    const isToday = dayStr === new Date().toISOString().split('T')[0];

    gridCells += `
      <div onclick="selectCrewCalDate('${dayStr}')" style="
        background:${isSelected ? 'rgba(139,92,246,0.25)' : isWeekend ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)'};
        border:1px solid ${isSelected ? 'var(--purple-light)' : isToday ? 'var(--emerald-brand)' : isWeekend ? 'rgba(255,255,255,0.06)' : 'var(--border-subtle)'};
        border-radius:10px;
        padding:0.4rem;
        min-height:65px;
        cursor:pointer;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        transition:all 0.15s ease;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.8rem; font-weight:${isToday || isSelected ? '800' : '600'}; color:${isToday ? 'var(--emerald-brand)' : isWeekend ? 'var(--text-muted)' : '#fff'};">${day}</span>
          ${isToday ? `<span style="font-size:0.62rem; color:var(--emerald-brand); font-weight:700;">TODAY</span>` : isWeekend ? `<span style="font-size:0.58rem; color:var(--purple-light); opacity:0.8;">OFF</span>` : ''}
        </div>
        <div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:4px;">
          ${dayList.slice(0, 3).map(t => {
            const isDone = ['published', 'approved', 'done'].includes((t.stage || '').toLowerCase());
            return `<div title="${t.title}" style="width:6px; height:6px; border-radius:50%; background:${isDone ? 'var(--emerald-brand)' : 'var(--purple-light)'};"></div>`;
          }).join('')}
          ${dayList.length > 3 ? `<span style="font-size:0.6rem; color:var(--text-muted);">+${dayList.length - 3}</span>` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
      <div>
        <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📅 Content & Campaign Calendar</h1>
        <div style="font-size:0.88rem; color:var(--text-muted);">Monthly dispatch pipeline, social drops, and deliverable deadlines.</div>
      </div>

      <!-- Month Switcher Controls -->
      <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.05); padding:0.3rem 0.6rem; border-radius:10px; border:1px solid var(--border-subtle);">
        <button onclick="changeCrewCalMonth(-1)" class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.85rem; border-radius:6px; cursor:pointer;">◀</button>
        <span style="font-weight:700; font-size:0.95rem; color:#fff; min-width:130px; text-align:center;">${monthNames[currentCalMonth]} ${currentCalYear}</span>
        <button onclick="changeCrewCalMonth(1)" class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.85rem; border-radius:6px; cursor:pointer;">▶</button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card-glass" style="padding:1.25rem; margin-bottom:1.5rem;">
      <!-- Weekday Headers -->
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem; text-align:center; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem;">
        <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div style="color:var(--purple-light);">FRI</div><div style="color:var(--purple-light);">SAT</div>
      </div>
      <!-- Days Grid -->
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem;">
        ${gridCells}
      </div>
    </div>

    <!-- Selected Date Deliverables List -->
    <div class="card-glass" style="padding:1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="margin:0; font-size:1.05rem; font-family:var(--font-heading); color:#fff;">
          📌 Deliverables for ${new Date(selectedCalDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </h3>
        <span class="badge badge-purple">${dayTasks.length} Scheduled</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        ${dayTasks.map(t => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:0.85rem; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
            <div>
              <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.2rem;">
                <span class="badge badge-purple" style="font-size:0.7rem;">${t.stage || 'Draft'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">${t.workflowType || t.category || 'Campaign'}</span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem;">${t.title}</div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">🏢 Client: ${t.client || 'Agency'} &bull; Assignee: ${t.assignee || 'Unassigned'}</div>
            </div>
            <a href="#tasks" class="btn-secondary" style="font-size:0.78rem; padding:0.4rem 0.75rem; text-decoration:none;">View Task ▶</a>
          </div>
        `).join('') || `
          <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.88rem;">
            No content deliverables or drops scheduled on this date.
          </div>
        `}
      </div>
    </div>
  `;
};
