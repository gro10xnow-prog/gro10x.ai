/**
 * public/planner/planner.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PlannerQueenGro · Daily & Weekly Planners #1 (SKU: PLA-14)
 * Core Interactive Engine v1.0
 * 
 * Features:
 * 1. Local-first persistence (localStorage with debounced auto-save)
 * 2. 16-spread dynamic rendering (Calendar, Habits, Finances, Bookshelf, Timeline)
 * 3. Reactive calculation engines (Cash flow, habit streaks, consistency %)
 * 4. Dual-mode output (Interactive touch UI + 16-spread pristine PDF print)
 * 5. Data backup / restore / reset utilities
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'gro10x_pla14_state_v1';
let state = {};

// ── 1. DOM INITIALIZATION & DYNAMIC SPREAD BUILDERS ──

document.addEventListener('DOMContentLoaded', () => {
  buildSpreadElements();
  loadSavedState();
  initTabNavigation();
  initEventListeners();
  recalculateAll();
  initAiCoachEngine();
  initCommerceUpsellBridge();
});

function buildSpreadElements() {
  buildYearMiniGrids();
  buildMonthlyGrid();
  buildWeeklyMonThu();
  buildDailyTimeline();
  buildWaterTracker();
  buildHabitMatrix();
  buildFixedBills();
  buildVariableExpenses();
  buildBookshelf();
}

// Spread 3: 12-Month Calendar Mini-Grids
function buildYearMiniGrids() {
  const container = document.getElementById('yearMiniGrids');
  if (!container) return;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  container.innerHTML = months.map((m, idx) => {
    const qNum = Math.floor(idx / 3) + 1;
    return `
      <div class="planner-card" style="padding: 0.75rem; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span style="font-family: var(--font-heading); font-weight: 700; color: var(--primary-plum); font-size: 0.9rem;">${m}</span>
          <span style="font-size: 0.65rem; color: var(--text-subtle); font-weight: 700;">Q${qNum}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 0.62rem; color: var(--text-muted); margin-bottom: 3px;">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 0.65rem; font-weight: 600;">
          ${Array.from({ length: 30 }, (_, d) => `<span style="padding: 2px 0;">${d + 1}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Spread 5: 5x7 Open Undated Monthly Calendar Grid
function buildMonthlyGrid() {
  const container = document.getElementById('monthlyGrid');
  if (!container) return;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = `
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-weight: 700; font-size: 0.76rem; color: var(--primary-plum); margin-bottom: 6px;">
      ${days.map(d => `<div>${d}</div>`).join('')}
    </div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
  `;
  for (let i = 1; i <= 35; i++) {
    html += `
      <div style="min-height: 70px; background: var(--surface-card-subtle); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 4px; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">
          <span>${i <= 31 ? i : ''}</span>
        </div>
        <textarea id="cal_cell_${i}" style="flex: 1; width: 100%; border: none; background: transparent; font-size: 0.72rem; resize: none; padding: 2px; line-height: 1.2;"></textarea>
      </div>
    `;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// Spread 6: Weekly Schedule Columns (Mon - Thu)
function buildWeeklyMonThu() {
  const container = document.getElementById('weeklyColumnsMonThu');
  if (!container) return;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  container.innerHTML = days.map((day, idx) => `
    <div class="planner-card" style="background: #FFFFFF;">
      <div class="planner-card-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.4rem;">
        <span>${day}</span>
      </div>
      <div style="margin-bottom: 0.6rem;">
        <label style="font-size: 0.7rem; font-weight: 700; color: var(--primary-plum); text-transform: uppercase;">Top Priority</label>
        <input type="text" id="week_day_top_${idx}" placeholder="Main focus..." class="clean-input-line" style="font-size: 0.8rem;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 3px;">
        ${['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM'].map((hr, hIdx) => `
          <div style="display: grid; grid-template-columns: 42px 1fr; align-items: center; gap: 4px;">
            <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-subtle);">${hr}</span>
            <input type="text" id="week_${idx}_slot_${hIdx}" style="padding: 0.2rem 0.35rem; font-size: 0.75rem; height: 26px;">
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Spread 8: Daily 6 AM - 9 PM Hourly Timeline
function buildDailyTimeline() {
  const container = document.getElementById('dailyTimeline');
  if (!container) return;
  const hours = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
  ];
  container.innerHTML = hours.map((hr, idx) => `
    <div class="timeblock-row">
      <span class="timeblock-label">${hr}</span>
      <div class="timeblock-slot">
        <input type="text" id="timeblock_${idx}" placeholder="Focus task or appointment...">
      </div>
    </div>
  `).join('');
}

// Spread 8: 8 Water Droplets
function buildWaterTracker() {
  const container = document.getElementById('waterTracker');
  if (!container) return;
  container.innerHTML = Array.from({ length: 8 }, (_, idx) => `
    <div class="water-drop" data-index="${idx}" title="Cup ${idx + 1} (250ml)"></div>
  `).join('');

  container.querySelectorAll('.water-drop').forEach(drop => {
    drop.addEventListener('click', (e) => {
      e.target.classList.toggle('filled');
      triggerAutoSave();
    });
  });
}

// Spread 10: 30-Day Habit Matrix
function buildHabitMatrix() {
  const tableHead = document.querySelector('#habitTable thead tr');
  const tableBody = document.getElementById('habitTableBody');
  if (!tableHead || !tableBody) return;

  // Add Day 1..31 columns
  let headHtml = '<th class="habit-name-col">Habit Focus (20 Rows)</th>';
  for (let d = 1; d <= 31; d++) {
    headHtml += `<th style="font-size: 0.68rem; width: 22px; padding: 2px;">${d}</th>`;
  }
  headHtml += '<th style="font-size: 0.72rem; min-width: 65px;">Streak</th>';
  tableHead.innerHTML = headHtml;

  // 20 Default Habit Rows
  const defaultHabits = [
    'Morning Glass of Water', '15 Min Natural Sunlight', 'Top Priority Deep Work',
    '10,000 Daily Steps', 'No Phone in Bed', 'Reading 15+ Pages',
    'Healthy Balanced Dinner', 'Zero Impulse Spending', 'Vitamins & Hydration',
    'Daily Gratitude Reflection', 'Stretch / Mobility', 'Desk Clean & Reset',
    'Inbox Zero Routine', 'Meditation / Breathing', 'Family / Offline Quality Time',
    'Daily Budget Logging', 'Protein Target Met', 'Evening Herbal Tea',
    'Consistent Sleep Schedule', 'Tomorrow Daily Plan Set'
  ];

  tableBody.innerHTML = defaultHabits.map((habitName, rIdx) => {
    let rowHtml = `
      <tr>
        <td class="habit-name-col">
          <input type="text" id="habit_name_${rIdx}" value="${habitName}" class="clean-input-line" style="font-size: 0.8rem; font-weight: 600;">
        </td>
    `;
    for (let d = 1; d <= 31; d++) {
      rowHtml += `
        <td>
          <span class="habit-bubble" data-row="${rIdx}" data-day="${d}"></span>
        </td>
      `;
    }
    rowHtml += `
        <td>
          <span class="habit-streak-badge" id="habit_streak_${rIdx}">0d</span>
        </td>
      </tr>
    `;
    return rowHtml;
  }).join('');

  tableBody.querySelectorAll('.habit-bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      bubble.classList.toggle('done');
      calculateHabitMetrics();
      triggerAutoSave();
    });
  });
}

// Spread 12: Fixed Recurring Bills
function buildFixedBills() {
  const container = document.getElementById('fixedBillsList');
  if (!container) return;
  const defaultBills = [
    { name: 'Rent / Home Mortgage', amount: 1450, due: '1st' },
    { name: 'Electricity & Gas', amount: 120, due: '5th' },
    { name: 'High-Speed Fiber Wi-Fi', amount: 65, due: '10th' },
    { name: 'Mobile Phone Plan', amount: 45, due: '15th' },
    { name: 'Health & Life Insurance', amount: 180, due: '20th' },
    { name: 'Cloud & App Subscriptions', amount: 55, due: '28th' }
  ];

  container.innerHTML = defaultBills.map((bill, idx) => `
    <div style="display: grid; grid-template-columns: 24px 1fr 90px 60px; gap: 6px; align-items: center;">
      <input type="checkbox" id="bill_paid_${idx}" class="bill-paid-toggle" style="width: 16px; height: 16px;">
      <input type="text" id="bill_name_${idx}" value="${bill.name}" style="font-size: 0.82rem; padding: 0.25rem 0.4rem;">
      <input type="number" id="bill_amt_${idx}" value="${bill.amount}" class="bill-amount-input" style="font-size: 0.82rem; padding: 0.25rem 0.4rem; text-align: right;">
      <input type="text" id="bill_due_${idx}" value="${bill.due}" style="font-size: 0.74rem; padding: 0.25rem 0.2rem; text-align: center; color: var(--text-muted);">
    </div>
  `).join('');
}

// Spread 12: Variable Daily Expense Log
function buildVariableExpenses() {
  const container = document.getElementById('variableExpensesList');
  if (!container) return;
  const defaultExpenses = [
    { date: '01/09', desc: 'Organic Groceries', amt: 78.50 },
    { date: '02/09', desc: 'Coffee & Breakfast', amt: 12.00 },
    { date: '04/09', desc: 'Gasoline refill', amt: 45.00 },
    { date: '05/09', desc: 'Pharmacy & Health', amt: 24.80 }
  ];

  container.innerHTML = defaultExpenses.map((exp, idx) => renderExpenseRow(idx, exp.date, exp.desc, exp.amt)).join('');

  document.getElementById('btnAddExpense')?.addEventListener('click', () => {
    const nextIdx = container.children.length;
    const row = document.createElement('div');
    row.innerHTML = renderExpenseRow(nextIdx, 'Today', 'New Expense', 0);
    container.appendChild(row.firstElementChild);
    attachExpenseListeners();
    recalculateFinances();
    triggerAutoSave();
  });

  attachExpenseListeners();
}

function renderExpenseRow(idx, date, desc, amt) {
  return `
    <div class="expense-row" style="display: grid; grid-template-columns: 75px 1fr 85px 24px; gap: 6px; align-items: center;">
      <input type="text" class="exp-date" value="${date}" style="font-size: 0.78rem; padding: 0.25rem 0.35rem;">
      <input type="text" class="exp-desc" value="${desc}" style="font-size: 0.82rem; padding: 0.25rem 0.45rem;">
      <input type="number" class="exp-amt" value="${amt}" style="font-size: 0.82rem; padding: 0.25rem 0.45rem; text-align: right;">
      <button class="btn-del-exp" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 0.85rem;" title="Remove row">×</button>
    </div>
  `;
}

function attachExpenseListeners() {
  document.querySelectorAll('.exp-amt').forEach(input => {
    input.addEventListener('input', recalculateFinances);
  });
  document.querySelectorAll('.btn-del-exp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.expense-row')?.remove();
      recalculateFinances();
      triggerAutoSave();
    });
  });
}

// Spread 14: 12-Book Visual Bookshelf
function buildBookshelf() {
  const container = document.getElementById('bookshelfGrid');
  if (!container) return;
  const sampleBooks = [
    { title: 'Atomic Habits', author: 'James Clear', stars: 5, notes: 'Systems are greater than goals' },
    { title: 'Deep Work', author: 'Cal Newport', stars: 5, notes: 'Protect high-value cognitive hours' },
    { title: 'The Psychology of Money', author: 'Morgan Housel', stars: 4, notes: 'Controlling your time is highest dividend' },
    { title: 'Essentialism', author: 'Greg McKeown', stars: 4, notes: 'Less but better' }
  ];

  container.innerHTML = Array.from({ length: 12 }, (_, idx) => {
    const b = sampleBooks[idx] || { title: '', author: '', stars: 0, notes: '' };
    return `
      <div class="book-card" data-index="${idx}">
        <input type="text" id="book_title_${idx}" value="${b.title}" placeholder="Book Title ${idx + 1}" style="font-weight: 700; font-size: 0.84rem; padding: 0.2rem 0.4rem;">
        <input type="text" id="book_author_${idx}" value="${b.author}" placeholder="Author..." class="clean-input-line" style="font-size: 0.76rem;">
        <div class="star-rating" data-book="${idx}">
          ${[1, 2, 3, 4, 5].map(s => `
            <span class="star ${s <= b.stars ? 'filled' : ''}" data-star="${s}">★</span>
          `).join('')}
        </div>
        <textarea id="book_takeaway_${idx}" rows="2" placeholder="Key takeaway quote..." style="font-size: 0.74rem; margin-top: 0.3rem;">${b.notes}</textarea>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.star-rating .star').forEach(star => {
    star.addEventListener('click', (e) => {
      const starVal = parseInt(e.target.dataset.star, 10);
      const parent = e.target.closest('.star-rating');
      parent.querySelectorAll('.star').forEach(s => {
        const val = parseInt(s.dataset.star, 10);
        s.classList.toggle('filled', val <= starVal);
      });
      triggerAutoSave();
    });
  });
}

// ── 2. REACTIVE CALCULATIONS & METRICS ──

function recalculateAll() {
  calculateHabitMetrics();
  recalculateFinances();
  updateWellnessScores();
}

function calculateHabitMetrics() {
  const bubbles = document.querySelectorAll('.habit-bubble');
  const totalCompleted = Array.from(bubbles).filter(b => b.classList.contains('done')).length;
  const totalPossible = 20 * 31;
  const consistencyRate = Math.round((totalCompleted / totalPossible) * 100);

  const rateEl = document.getElementById('habitConsistencyRate');
  const countEl = document.getElementById('habitTotalChecks');
  const streakEl = document.getElementById('habitBestStreak');
  if (rateEl) rateEl.textContent = `${consistencyRate}%`;
  if (countEl) countEl.textContent = totalCompleted;

  // Calculate streaks per row
  let maxActiveStreak = 0;
  for (let r = 0; r < 20; r++) {
    const rowBubbles = document.querySelectorAll(`.habit-bubble[data-row="${r}"]`);
    let currentStreak = 0;
    let maxRowStreak = 0;
    rowBubbles.forEach(b => {
      if (b.classList.contains('done')) {
        currentStreak++;
        if (currentStreak > maxRowStreak) maxRowStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });
    const streakBadge = document.getElementById(`habit_streak_${r}`);
    if (streakBadge) streakBadge.textContent = `${maxRowStreak}d`;
    if (maxRowStreak > maxActiveStreak) maxActiveStreak = maxRowStreak;
  }

  if (streakEl) streakEl.textContent = `${maxActiveStreak} Days`;
}

function recalculateFinances() {
  const income = parseFloat(document.getElementById('fin_income')?.value || 0);

  // Sum Fixed Bills
  let fixedSum = 0;
  document.querySelectorAll('.bill-amount-input').forEach(inp => {
    fixedSum += parseFloat(inp.value || 0);
  });

  // Sum Variable Expenses
  let varSum = 0;
  document.querySelectorAll('.exp-amt').forEach(inp => {
    varSum += parseFloat(inp.value || 0);
  });

  const netSavings = income - (fixedSum + varSum);

  const fixedEl = document.getElementById('fin_fixed_total');
  const varEl = document.getElementById('fin_var_total');
  const netEl = document.getElementById('fin_net_savings');

  if (fixedEl) fixedEl.textContent = `$${fixedSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (varEl) varEl.textContent = `$${varSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (netEl) {
    netEl.textContent = `$${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    netEl.classList.toggle('positive', netSavings >= 0);
    netEl.classList.toggle('negative', netSavings < 0);
  }
}

function updateWellnessScores() {
  ['phys', 'emot', 'ment', 'spir'].forEach(key => {
    const slider = document.getElementById(`wheel_${key}`);
    const lbl = document.getElementById(`score_${key}_lbl`);
    if (slider && lbl) {
      lbl.textContent = `${slider.value}/10`;
    }
  });

  const energySlider = document.getElementById('energy_slider');
  const energyLabel = document.getElementById('energyLabel');
  if (energySlider && energyLabel) {
    const map = {
      '1': 'Level 1 — Exhausted / Rest Needed',
      '2': 'Level 2 — Sluggish',
      '3': 'Level 3 — Steady & Balanced',
      '4': 'Level 4 — High Vibrancy',
      '5': 'Level 5 — Peak Creative Flow'
    };
    energyLabel.textContent = map[energySlider.value] || 'Level 3';
  }
}

// ── 3. LOCAL-FIRST PERSISTENCE ENGINE ──

let saveTimeout = null;
function triggerAutoSave() {
  const syncText = document.getElementById('syncStatusText');
  if (syncText) syncText.textContent = 'Saving...';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    collectAndSaveState();
    if (syncText) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      syncText.textContent = `Auto-Saved (${now})`;
    }
  }, 350);
}

function collectAndSaveState() {
  const data = {
    inputs: {},
    checkboxes: {},
    water: [],
    habits: [],
    stars: []
  };

  // Text inputs & textareas
  document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="range"], textarea').forEach(el => {
    if (el.id) data.inputs[el.id] = el.value;
  });

  // Checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(el => {
    if (el.id) data.checkboxes[el.id] = el.checked;
  });

  // Water droplets
  document.querySelectorAll('.water-drop').forEach((d, idx) => {
    if (d.classList.contains('filled')) data.water.push(idx);
  });

  // Habits
  document.querySelectorAll('.habit-bubble.done').forEach(b => {
    data.habits.push(`${b.dataset.row}_${b.dataset.day}`);
  });

  // Star ratings
  document.querySelectorAll('.book-card').forEach((card, bIdx) => {
    const count = card.querySelectorAll('.star.filled').length;
    data.stars[bIdx] = count;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage quota warning:', e.message);
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    // Restore inputs
    if (data.inputs) {
      Object.keys(data.inputs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data.inputs[id];
      });
    }

    // Restore checkboxes
    if (data.checkboxes) {
      Object.keys(data.checkboxes).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = data.checkboxes[id];
      });
    }

    // Restore water
    if (Array.isArray(data.water)) {
      document.querySelectorAll('.water-drop').forEach((d, idx) => {
        d.classList.toggle('filled', data.water.includes(idx));
      });
    }

    // Restore habits
    if (Array.isArray(data.habits)) {
      data.habits.forEach(key => {
        const [r, d] = key.split('_');
        const bubble = document.querySelector(`.habit-bubble[data-row="${r}"][data-day="${d}"]`);
        if (bubble) bubble.classList.add('done');
      });
    }

    // Restore book stars
    if (Array.isArray(data.stars)) {
      data.stars.forEach((stars, bIdx) => {
        const card = document.querySelector(`.book-card[data-index="${bIdx}"]`);
        if (card) {
          card.querySelectorAll('.star').forEach(s => {
            const v = parseInt(s.dataset.star, 10);
            s.classList.toggle('filled', v <= stars);
          });
        }
      });
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
}

// ── 4. NAVIGATION & TAB SWITCHING ──

function initTabNavigation() {
  const sideTabs = document.querySelectorAll('.side-tab');
  const mobileTabs = document.querySelectorAll('.mobile-tab-btn');

  function switchTab(tabId) {
    // Hide all tab sections
    document.querySelectorAll('.tab-content').forEach(sec => {
      sec.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    // Update active states
    sideTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    mobileTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sideTabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  mobileTabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Numeric 1-8 keys & Arrow keys navigation
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const tabList = ['tab-index', 'tab-vision', 'tab-monthly', 'tab-weekly', 'tab-daily', 'tab-habits', 'tab-finances', 'tab-life'];
    if (e.key >= '1' && e.key <= '8') {
      const idx = parseInt(e.key, 10) - 1;
      switchTab(tabList[idx]);
    }
  });
}

// ── 5. EVENT LISTENERS, BACKUP & PRINT COMPILATION ──

function initEventListeners() {
  // Auto-save on all user input
  document.addEventListener('input', (e) => {
    if (e.target.matches('#fin_income, .bill-amount-input, .exp-amt')) {
      recalculateFinances();
    }
    if (e.target.matches('#wheel_phys, #wheel_emot, #wheel_ment, #wheel_spir, #energy_slider')) {
      updateWellnessScores();
    }
    triggerAutoSave();
  });

  document.addEventListener('change', triggerAutoSave);

  // Print 16 Spreads Engine
  const printBtn = document.getElementById('btnPrintPdf');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Temporarily show all 16 spreads across all tabs so @media print captures everything
      const currentActive = document.querySelector('.side-tab.active')?.dataset.tab || 'tab-index';
      document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'block');

      window.print();

      // Restore active tab after print dialog closes
      setTimeout(() => {
        document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'none');
        const activeSec = document.getElementById(currentActive);
        if (activeSec) activeSec.style.display = 'block';
      }, 500);
    });
  }

  // Backup JSON
  document.getElementById('btnExportJson')?.addEventListener('click', () => {
    const raw = localStorage.getItem(STORAGE_KEY) || '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlannerQueenGro_PLA14_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Reset Data
  document.getElementById('btnResetData')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your planner entries?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
}

// ── 6. GEMINI AI FOCUS COACH & GROCREDITS INTEGRATION ──

const CUSTOMER_TOKEN_KEY = 'gro10x_customer_token';

function initAiCoachEngine() {
  refreshCustomerWallet();

  // Topbar Button: switch to Daily tab & launch coach briefing
  document.getElementById('btnAiCoachTopbar')?.addEventListener('click', () => {
    // Switch to Daily tab
    const dailyTabBtn = document.querySelector('.side-tab[data-tab="tab-daily"]');
    if (dailyTabBtn) dailyTabBtn.click();
    triggerAiCoach();
  });

  // Daily Spread Button
  document.getElementById('btnTriggerAiCoach')?.addEventListener('click', triggerAiCoach);

  // Modal Dismiss / Close
  document.getElementById('btnCloseAiModal')?.addEventListener('click', closeAiModal);
  document.getElementById('btnDismissAiModal')?.addEventListener('click', closeAiModal);

  const modalOverlay = document.getElementById('aiCoachModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeAiModal();
    });
  }
}

async function getOrProvisionCustomerToken() {
  let token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (token) return token;

  // Seamless auto-provisioning for instant demo / fresh Etsy users
  try {
    const res = await fetch('/api/portal/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'PLA14-DEMO-2026',
        email: 'creator.demo@plannerqueengro.com',
        name: 'Elena (VIP Creator)'
      })
    });
    const data = await res.json();
    if (data.ok && data.token) {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
      return data.token;
    }
  } catch (err) {
    console.warn('[AI Coach] Token auto-provision warning:', err.message);
  }
  return null;
}

async function refreshCustomerWallet() {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch('/api/portal/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.ok && data.wallet) {
      updateWalletPills(data.wallet.balance);
    }
  } catch (err) {
    console.warn('[AI Coach] Wallet refresh warning:', err.message);
  }
}

function updateWalletPills(balance) {
  const balEl = document.getElementById('plannerCreditBal');
  if (balEl) balEl.textContent = balance;
}

async function triggerAiCoach() {
  const modal = document.getElementById('aiCoachModal');
  const loading = document.getElementById('aiModalLoading');
  const result = document.getElementById('aiModalResult');

  if (modal) modal.style.display = 'flex';
  if (loading) loading.style.display = 'block';
  if (result) result.innerHTML = '';

  const token = await getOrProvisionCustomerToken();
  if (!token) {
    if (loading) loading.style.display = 'none';
    if (result) {
      result.innerHTML = `
        <div class="ai-briefing-box" style="border-left-color: var(--accent-rose);">
          <h4>⚠️ Customer Session Required</h4>
          <p>Please activate your digital planner license in your <a href="/my-portal" target="_blank" style="color: var(--primary-plum); font-weight: 700;">Customer Vault</a> to claim your 200 GroCredits.</p>
        </div>
      `;
    }
    return;
  }

  // Gather daily context
  const dateVal = document.getElementById('daily_date')?.value || new Date().toISOString().split('T')[0];
  const intentionVal = document.getElementById('daily_intention')?.value || 'High focus, creative flow, and graceful execution';
  const must1 = document.getElementById('eisen_must1')?.value || '';
  const must2 = document.getElementById('eisen_must2')?.value || '';
  const should1 = document.getElementById('eisen_should1')?.value || '';
  const energyVal = document.getElementById('energy_slider')?.value || '4';

  const priorities = [must1, must2, should1].filter(Boolean);
  if (priorities.length === 0) {
    priorities.push('Primary high-leverage project deliverable', 'Strategic focus block');
  }

  try {
    const res = await fetch('/api/portal/ai-assist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: dateVal,
        intention: intentionVal,
        priorities,
        energy: energyVal
      })
    });

    const data = await res.json();
    if (loading) loading.style.display = 'none';

    if (data.ok) {
      updateWalletPills(data.newBalance);

      // Format markdown-like output nicely
      const formatted = data.coaching
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>');

      result.innerHTML = `
        <div class="ai-briefing-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-sage); text-transform: uppercase;">✨ Morning Briefing Generated</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Energy Level: ${energyVal}/5</span>
          </div>
          <div>${formatted}</div>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="ai-briefing-box" style="border-left-color: var(--accent-rose);">
          <h4>⚠️ Unable to Generate Briefing</h4>
          <p>${data.error || 'Check your GroCredits balance or connection.'}</p>
        </div>
      `;
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (result) {
      result.innerHTML = `
        <div class="ai-briefing-box" style="border-left-color: var(--accent-rose);">
          <h4>⚠️ Connection Error</h4>
          <p>Failed to reach AI Coach service: ${err.message}</p>
        </div>
      `;
    }
  }
}

function closeAiModal() {
  const modal = document.getElementById('aiCoachModal');
  if (modal) modal.style.display = 'none';
}

// ── 7. COMMERCE UPSELL BRIDGE & LICENSE HYDRATION ──

const UPSELL_SKU = 'sku-pq-phys-01';

function initCommerceUpsellBridge() {
  hydrateCustomerLicenseKey();

  // Modal triggers
  const triggers = ['btnUpgradeHardcover', 'btnRibbonUpgrade', 'btnSpread16Upgrade', 'btnClaimCertificate'];
  triggers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openUpsellModal();
      });
    }
  });

  // Modal dismiss buttons
  document.getElementById('btnCloseUpsellModal')?.addEventListener('click', closeUpsellModal);
  document.getElementById('btnDismissUpsellModal')?.addEventListener('click', closeUpsellModal);

  const upsellOverlay = document.getElementById('plannerUpsellModal');
  if (upsellOverlay) {
    upsellOverlay.addEventListener('click', (e) => {
      if (e.target === upsellOverlay) closeUpsellModal();
    });
  }

  // 1-Click Buy Checkout trigger
  document.getElementById('btn1ClickCheckout')?.addEventListener('click', () => {
    window.location.href = `/dce/store?sku=${encodeURIComponent(UPSELL_SKU)}`;
  });

  // Copy License Button
  document.getElementById('btnCopyUpsellLicense')?.addEventListener('click', () => {
    const licenseInput = document.getElementById('upsellLicenseKeyInput');
    if (!licenseInput) return;
    navigator.clipboard?.writeText(licenseInput.value).then(() => {
      const copyBtn = document.getElementById('btnCopyUpsellLicense');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.color = '#2E7D32';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.color = '';
        }, 2000);
      }
    }).catch(() => {
      licenseInput.select();
      document.execCommand('copy');
    });
  });
}

function hydrateCustomerLicenseKey() {
  const activeKey = localStorage.getItem('pq_license_key') ||
                    localStorage.getItem('gro10x_license_key') ||
                    'PLA-14-VIP-2026';

  const codeEl = document.getElementById('ownerLicenseCode');
  if (codeEl) codeEl.textContent = activeKey;

  const upsellInput = document.getElementById('upsellLicenseKeyInput');
  if (upsellInput) upsellInput.value = activeKey;
}

function openUpsellModal() {
  const modal = document.getElementById('plannerUpsellModal');
  if (modal) modal.style.display = 'flex';
}

function closeUpsellModal() {
  const modal = document.getElementById('plannerUpsellModal');
  if (modal) modal.style.display = 'none';
}


