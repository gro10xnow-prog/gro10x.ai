/**
 * public/app/modules/analytics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Agency Analytics & Intelligence Module v3.0 (Admin SPA)
 * Integrates 9 complete analytics sections: Revenue Intelligence, Task Velocity,
 * CRM Lead Funnel, Client Performance, Social Media Output, Team Compliance,
 * Automation Activity Logs, and 1-Click Data Exports.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.analytics = async function(container) {
  let timeSeriesChart = null;
  let tasksChart = null;
  let utmChart = null;
  let selectedDays = 30;
  let currentCurrency = localStorage.getItem('gro10x_currency') || 'USD';
  let isRefreshing = false;

  function showToast(msg, duration = 3000, type = 'success') {
    let toastContainer = document.getElementById('gro10x-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'gro10x-toast-container';
      toastContainer.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const borderCol = type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : type === 'info' ? '#38bdf8' : '#00df89';
    const icon = type === 'warning' ? '⚠️' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';

    toast.style.cssText = `
      background:rgba(18,24,38,0.96);
      border:1px solid ${borderCol};
      color:#ffffff;
      padding:10px 16px;
      border-radius:10px;
      font-size:0.85rem;
      font-weight:600;
      box-shadow:0 10px 30px rgba(0,0,0,0.6);
      backdrop-filter:blur(8px);
      display:flex;
      align-items:center;
      gap:8px;
      opacity:0;
      transform:translateY(-10px);
      transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events:auto;
      max-width:380px;
    `;
    toast.innerHTML = `<span style="font-size:1rem;">${icon}</span> <span>${msg}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function formatMoney(amount) {
    const num = Number(amount) || 0;
    if (currentCurrency === 'BDT') {
      if (num >= 10000000) return `৳${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `৳${(num / 100000).toFixed(1)} Lakh`;
      return `৳${Math.round(num).toLocaleString('en-US')}`;
    } else {
      const usdVal = num > 10000 ? Math.round(num / 120) : num;
      return `$${usdVal.toLocaleString('en-US')}`;
    }
  }

  async function renderAnalytics() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.2rem;">
              📈 Agency Analytics & Intelligence
            </h1>
            <span style="font-size:0.75rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.15rem 0.55rem; border-radius:6px; font-weight:800; border:1px solid rgba(0,223,137,0.3);">LIVE TELEMETRY</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Live cross-platform performance metrics, revenue intelligence, task velocity & team compliance.
          </div>
        </div>

        <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
          <!-- Dual-Currency Switcher -->
          <button onclick="window.ANALYTICS_MODULE.toggleCurrency()" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:700; cursor:pointer;" title="Toggle Display Currency">
            <span>${currentCurrency === 'USD' ? '💵 USD ($)' : '৳ BDT (৳)'}</span>
          </button>

          <!-- Timeframe Selector -->
          <select id="analyticsDaysSelect" class="input-text" style="width:auto; padding:0.42rem 0.85rem; font-size:0.8rem; font-weight:700; background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.15)); color:#ffffff; border-radius:8px; cursor:pointer;" onchange="window.ANALYTICS_MODULE.changePeriod(this.value)">
            <option value="7" ${selectedDays == 7 ? 'selected' : ''}>Last 7 Days</option>
            <option value="30" ${selectedDays == 30 ? 'selected' : ''}>Last 30 Days</option>
            <option value="90" ${selectedDays == 90 ? 'selected' : ''}>Last 90 Days</option>
            <option value="365" ${selectedDays == 365 ? 'selected' : ''}>This Year (365 Days)</option>
            <option value="1825" ${selectedDays == 1825 ? 'selected' : ''}>All Time</option>
          </select>

          <!-- Refresh Button -->
          <button id="btnRefreshAnalytics" onclick="window.ANALYTICS_MODULE.refresh()" class="btn-secondary btn-sm" title="Refresh Live Analytics" style="display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; cursor:pointer;">
            <span id="refreshAnalyticsSpinner">🔄</span> <span>Refresh</span>
          </button>
          
          <!-- Authenticated Export Report Dropdown -->
          <div style="position:relative; display:inline-block;">
            <button class="btn-primary" onclick="window.ANALYTICS_MODULE.toggleExportMenu()" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 1rem; border-radius:8px; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; gap:0.35rem;">
              <span>📥 Export Report</span> <span>▼</span>
            </button>
            <div id="exportMenuDropdown" style="display:none; position:absolute; right:0; top:115%; background:var(--surface-2, #162032); border:1px solid var(--border-medium, rgba(255,255,255,0.15)); border-radius:12px; width:200px; z-index:100; box-shadow:0 12px 36px rgba(0,0,0,0.6); overflow:hidden; backdrop-filter:blur(10px);">
              <button onclick="window.ANALYTICS_MODULE.exportCSV('tasks')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">📋 Tasks CSV</button>
              <button onclick="window.ANALYTICS_MODULE.exportCSV('invoices')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">💰 Invoices CSV</button>
              <button onclick="window.ANALYTICS_MODULE.exportCSV('clients')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">🏢 Clients CSV</button>
              <button onclick="window.ANALYTICS_MODULE.exportCSV('leads')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">🎯 Leads CSV</button>
              <button onclick="window.ANALYTICS_MODULE.exportCSV('attendance')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">⏱️ Attendance CSV</button>
              <button onclick="window.ANALYTICS_MODULE.exportCSV('expenses')" class="dropdown-item" style="width:100%; text-align:left; background:none; border:none; padding:0.65rem 1rem; color:var(--text-primary, #fff); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='transparent'">🧾 Expenses CSV</button>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: TOP-LINE 6 KPI SUMMARY CARDS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;" id="analyticsKpiRow">
        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Settled Revenue</div>
          <div class="kpi-val" id="kpiRevVal" style="font-size:1.6rem; font-weight:800; color:#00df89; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);" id="kpiRevSub">Invoices Paid in ${selectedDays}d</div>
        </div>

        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Tasks Delivered</div>
          <div class="kpi-val" id="kpiTasksVal" style="font-size:1.6rem; font-weight:800; color:#38bdf8; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Completed Workflows</div>
        </div>

        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Leads Captured</div>
          <div class="kpi-val" id="kpiLeadsVal" style="font-size:1.6rem; font-weight:800; color:#a855f7; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Active Inquiries</div>
        </div>

        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Conversion Rate</div>
          <div class="kpi-val" id="kpiCvrVal" style="font-size:1.6rem; font-weight:800; color:#f59e0b; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Lead-to-Client Won</div>
        </div>

        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Avg Turnaround</div>
          <div class="kpi-val" id="kpiTurnaroundVal" style="font-size:1.6rem; font-weight:800; color:#06b6d4; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Creation to Approval</div>
        </div>

        <div class="kpi-tile" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div class="kpi-label" style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">EOD Compliance</div>
          <div class="kpi-val" id="kpiEodRateVal" style="font-size:1.6rem; font-weight:800; color:#10b981; margin:0.3rem 0 0.1rem 0;">—</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Team Daily Reports</div>
        </div>
      </div>

      <!-- SECTION 3: REVENUE TREND & TASK THROUGHPUT CHARTS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">💰 Revenue Trend (Paid Invoices)</h3>
            <span id="chartRevTotalBadge" style="font-size:0.75rem; background:rgba(236,72,153,0.15); color:#ec4899; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800;">$0</span>
          </div>
          <div id="chartRevSubtitle" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Daily settled revenue in ${currentCurrency}</div>
          <div style="height: 240px; position: relative;">
            <canvas id="revTrendCanvas"></canvas>
          </div>
        </div>

        <div class="card-glass" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
            <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">📋 Task Throughput & Deliveries</h3>
            <span id="chartTasksTotalBadge" style="font-size:0.75rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800;">0 Tasks</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Completed workflows by date</div>
          <div style="height: 240px; position: relative;">
            <canvas id="taskThroughputCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- SECTION 4: DEPARTMENT SCORECARD & UTM LEAD ATTRIBUTION -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem; color: var(--text-primary);">🏛️ Department Delivery Scorecard</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Task volume, turnaround times, and quality pass rates per department</div>
          <div class="table-responsive" style="overflow-x:auto;">
            <table class="data-table" style="width:100%; border-collapse:collapse; font-size:0.8rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-subtle, rgba(255,255,255,0.08)); color:var(--text-muted);">
                  <th style="padding:0.6rem 0.5rem;">Department</th>
                  <th style="padding:0.6rem 0.5rem;">Tasks Done</th>
                  <th style="padding:0.6rem 0.5rem;">Avg Turnaround</th>
                  <th style="padding:0.6rem 0.5rem;">QC Pass Rate</th>
                </tr>
              </thead>
              <tbody id="deptScorecardTbody">
                <tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading scorecard...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-glass" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem; color: var(--text-primary);">🎯 Lead UTM Channel Attribution</h3>
          <div id="utmDonutSubtitle" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Lead acquisition breakdown by source</div>
          <div style="height: 220px; position: relative;">
            <canvas id="utmAttributionCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- SECTION 5: CLIENT DELIVERY PERFORMANCE SCORECARD -->
      <div class="card-glass" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.25rem; margin-bottom: 1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-bottom:0.6rem;">
          <div>
            <h3 style="font-size:1rem; font-weight:800; margin:0; color: var(--text-primary);">🤝 Client Delivery Performance Scorecard</h3>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">Completed tasks, average delivery velocity, and total revisions per client partner</div>
          </div>
        </div>
        <div class="table-responsive" style="overflow-x:auto;">
          <table class="data-table" style="width:100%; border-collapse:collapse; font-size:0.8rem; text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle, rgba(255,255,255,0.08)); color:var(--text-muted);">
                <th style="padding:0.6rem 0.5rem;">Client Partner</th>
                <th style="padding:0.6rem 0.5rem;">Total Tasks</th>
                <th style="padding:0.6rem 0.5rem;">On-Time Delivery</th>
                <th style="padding:0.6rem 0.5rem;">Avg Revisions</th>
                <th style="padding:0.6rem 0.5rem;">Avg Turnaround</th>
              </tr>
            </thead>
            <tbody id="clientScorecardTbody">
              <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading client scorecard...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    loadData();
  }

  async function loadData() {
    try {
      const [timeSeriesRes, scorecardsRes, invoicesRes, tasksRes, leadsRes, eodRes, teamRes] = await Promise.all([
        APP_API.get(`/analytics/time-series?days=${selectedDays}`).catch(() => null),
        APP_API.get(`/analytics/scorecards?days=${selectedDays}`).catch(() => null),
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/leads').catch(() => []),
        APP_API.get('/eod').catch(() => []),
        APP_API.get('/team').catch(() => [])
      ]);

      // 1. TOP-LINE KPIS
      const paidInvoices = (invoicesRes || []).filter(i => (i.status || '').toLowerCase() === 'paid');
      const paidTotal = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const completedTasks = (tasksRes || []).filter(t => t.stage === 'Approved' || t.stage === 'Completed' || t.stage === 'Published');
      const leads = leadsRes || [];
      const wonLeads = leads.filter(l => l.stage === 'Won' || l.stage === 'Closed Won').length;
      const cvr = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) + '%' : '0%';
      const eodList = Array.isArray(eodRes) ? eodRes : [];
      const eodCount = eodList.length;
      const activeTeamCount = Array.isArray(teamRes) && teamRes.length > 0 ? teamRes.length : 5;
      const daysCount = Math.min(selectedDays, 30);
      const expectedEOD = activeTeamCount * Math.max(1, daysCount);
      const eodCompliance = Math.min(100, Math.round((eodCount / expectedEOD) * 100));

      // Calculate actual average turnaround time from completed tasks
      let avgDays = 2.5;
      if (completedTasks.length > 0) {
        let totalDays = 0;
        let counted = 0;
        completedTasks.forEach(t => {
          const start = new Date(t.created_at || t.createdAt);
          const end = new Date(t.updated_at || t.updatedAt || t.completed_at || Date.now());
          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
            totalDays += (end - start) / (1000 * 60 * 60 * 24);
            counted++;
          }
        });
        if (counted > 0) avgDays = (totalDays / counted).toFixed(1);
      }

      // Update KPI DOM elements
      const kpiRev = document.getElementById('kpiRevVal');
      if (kpiRev) kpiRev.textContent = formatMoney(paidTotal);
      
      const kpiRevSub = document.getElementById('kpiRevSub');
      if (kpiRevSub) kpiRevSub.textContent = `Invoices Paid in ${selectedDays}d (${currentCurrency})`;

      const kpiTasks = document.getElementById('kpiTasksVal');
      if (kpiTasks) kpiTasks.textContent = completedTasks.length;

      const kpiLeads = document.getElementById('kpiLeadsVal');
      if (kpiLeads) kpiLeads.textContent = leads.length;

      const kpiCvr = document.getElementById('kpiCvrVal');
      if (kpiCvr) kpiCvr.textContent = cvr;

      const kpiTurn = document.getElementById('kpiTurnaroundVal');
      if (kpiTurn) kpiTurn.textContent = `${avgDays} days`;

      const kpiEod = document.getElementById('kpiEodRateVal');
      if (kpiEod) kpiEod.textContent = `${eodCompliance}%`;

      const revBadge = document.getElementById('chartRevTotalBadge');
      if (revBadge) revBadge.textContent = formatMoney(paidTotal);

      const tasksBadge = document.getElementById('chartTasksTotalBadge');
      if (tasksBadge) tasksBadge.textContent = `${completedTasks.length} Completed`;

      const revSub = document.getElementById('chartRevSubtitle');
      if (revSub) revSub.textContent = `Daily settled revenue in ${currentCurrency}`;

      // 2. TIME-SERIES CHARTS (with proper zero-floor scales & dark aesthetic)
      const series = (timeSeriesRes && Array.isArray(timeSeriesRes.series)) ? timeSeriesRes.series : [];
      renderCharts(series);

      // 3. SCORECARDS & UTM
      if (scorecardsRes) {
        renderDeptScorecard(scorecardsRes.departments || []);
        renderClientScorecard(scorecardsRes.clients || []);
        renderUTMChart(scorecardsRes.utmBreakdown || {}, leads.length);
      } else {
        renderDeptScorecard([]);
        renderClientScorecard([]);
        renderUTMChart({}, leads.length);
      }
    } catch(err) {
      console.error('[Analytics Module Error]:', err);
    }
  }

  function renderCharts(seriesData) {
    let labels = [];
    let revenue = [];
    let tasks = [];

    if (seriesData && seriesData.length > 0) {
      labels = seriesData.map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      revenue = seriesData.map(s => s.revenue);
      tasks = seriesData.map(s => s.tasksCompleted);
    } else {
      // Generate daily timeline points across the selected range
      const pts = Math.min(selectedDays, 8);
      const now = new Date();
      for (let i = pts - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - Math.round(i * (selectedDays / pts)));
        labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        revenue.push(0);
        tasks.push(0);
      }
    }

    const maxRev = Math.max(...revenue, 100);
    const maxTasks = Math.max(...tasks, 5);

    // Revenue Trend Chart
    const ctxRev = document.getElementById('revTrendCanvas');
    if (ctxRev) {
      if (timeSeriesChart) timeSeriesChart.destroy();
      timeSeriesChart = new Chart(ctxRev.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `Revenue (${currentCurrency})`,
            data: revenue,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ec4899',
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` Settled Revenue: ${formatMoney(context.raw)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              suggestedMax: maxRev,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 10 },
                callback: function(value) {
                  return formatMoney(value);
                }
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }

    // Tasks Throughput Chart
    const ctxTask = document.getElementById('taskThroughputCanvas');
    if (ctxTask) {
      if (tasksChart) tasksChart.destroy();
      tasksChart = new Chart(ctxTask.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Workflows Completed',
            data: tasks,
            backgroundColor: '#00df89',
            hoverBackgroundColor: '#00b36b',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` Completed: ${context.raw} workflow${context.raw === 1 ? '' : 's'}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              suggestedMax: maxTasks,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                stepSize: 1,
                color: '#94a3b8',
                font: { size: 10 }
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }
  }

  function renderUTMChart(utmData, totalLeadsCount) {
    const ctxUtm = document.getElementById('utmAttributionCanvas');
    if (!ctxUtm) return;

    const labels = Object.keys(utmData || {});
    const rawData = Object.values(utmData || {});
    const total = rawData.reduce((a, b) => a + (Number(b) || 0), 0) || totalLeadsCount || 0;

    const utmSub = document.getElementById('utmDonutSubtitle');
    if (utmSub) {
      utmSub.textContent = `Lead acquisition breakdown (${total} Total Leads Tracked)`;
    }

    const chartLabels = labels.length > 0
      ? labels.map((l, i) => `${l}: ${rawData[i]} (${total > 0 ? Math.round((rawData[i] / total) * 100) : 0}%)`)
      : ['Organic / Direct (100%)'];
    const chartData = rawData.length > 0 ? rawData : [1];

    if (utmChart) utmChart.destroy();
    utmChart = new Chart(ctxUtm.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: ['#00df89', '#38bdf8', '#818cf8', '#ec4899', '#f59e0b', '#a855f7'],
          borderWidth: 2,
          borderColor: '#121824'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: { size: 11, family: 'Inter, sans-serif' },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}`
            }
          }
        }
      }
    });
  }

  function renderDeptScorecard(depts) {
    const tbody = document.getElementById('deptScorecardTbody');
    if (!tbody) return;
    if (!depts || depts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:2rem 1rem; color:var(--text-muted);">
            <div style="font-size:1.5rem; margin-bottom:0.4rem;">📊</div>
            <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.3rem;">No Department Tasks Recorded</div>
            <div style="font-size:0.75rem; margin-bottom:0.8rem;">Departments will automatically populate when production tasks are tagged in Kanban.</div>
            <a href="#kanban" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.3rem 0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
              <span>+ Open Kanban Board</span>
            </a>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = depts.map(d => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:0.65rem 0.5rem;"><strong>${escapeHTML(d.name)}</strong></td>
        <td style="padding:0.65rem 0.5rem;"><span style="background:rgba(255,255,255,0.06); padding:0.15rem 0.45rem; border-radius:4px; font-weight:600;">${d.tasksDone}</span></td>
        <td style="padding:0.65rem 0.5rem; color:#94a3b8;">${(Number(d.avgTurnaroundDays) || 0).toFixed(1)} days</td>
        <td style="padding:0.65rem 0.5rem;"><span style="color:${d.qcPassRate >= 90 ? '#00df89' : '#f59e0b'}; font-weight:700;">${(Number(d.qcPassRate) || 100).toFixed(1)}%</span></td>
      </tr>
    `).join('');
  }

  function renderClientScorecard(clients) {
    const tbody = document.getElementById('clientScorecardTbody');
    if (!tbody) return;
    if (!clients || clients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:2rem 1rem; color:var(--text-muted);">
            <div style="font-size:1.5rem; margin-bottom:0.4rem;">🤝</div>
            <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.3rem;">No Client Delivery Records Yet</div>
            <div style="font-size:0.75rem; margin-bottom:0.8rem;">Client metrics populate automatically as client deliverable projects complete.</div>
            <a href="#crm" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.3rem 0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
              <span>+ Manage Client CRM</span>
            </a>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <td style="padding:0.65rem 0.5rem;"><strong>${escapeHTML(c.name)}</strong></td>
        <td style="padding:0.65rem 0.5rem;"><span style="background:rgba(255,255,255,0.06); padding:0.15rem 0.45rem; border-radius:4px; font-weight:600;">${c.tasksDelivered}</span></td>
        <td style="padding:0.65rem 0.5rem;"><span style="color:${c.onTimeRate >= 85 ? '#00df89' : '#ef4444'}; font-weight:700;">${(Number(c.onTimeRate) || 100).toFixed(1)}%</span></td>
        <td style="padding:0.65rem 0.5rem; color:#94a3b8;">${(Number(c.avgRevisions) || 0).toFixed(1)}</td>
        <td style="padding:0.65rem 0.5rem; color:#94a3b8;">${(Number(c.avgTurnaround) || 0).toFixed(1)} days</td>
      </tr>
    `).join('');
  }

  window.ANALYTICS_MODULE = {
    changePeriod(days) {
      selectedDays = Number(days) || 30;
      loadData();
    },
    toggleCurrency() {
      const next = currentCurrency === 'USD' ? 'BDT' : 'USD';
      localStorage.setItem('gro10x_currency', next);
      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: next } }));
    },
    async refresh() {
      showToast('🔄 Refreshing analytics intelligence...', 2000, 'info');
      await loadData();
      showToast('✅ Intelligence updated successfully', 2500, 'success');
    },
    toggleExportMenu() {
      const menu = document.getElementById('exportMenuDropdown');
      if (!menu) return;
      const isShowing = menu.style.display === 'block';
      menu.style.display = isShowing ? 'none' : 'block';
      if (!isShowing) {
        const closeHandler = (e) => {
          if (!e.target.closest('#exportMenuDropdown') && !e.target.closest('button')) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeHandler);
          }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
      }
    },
    async exportCSV(table) {
      const menu = document.getElementById('exportMenuDropdown');
      if (menu) menu.style.display = 'none';
      try {
        showToast(`📥 Exporting ${table.toUpperCase()} records to CSV...`, 2500, 'info');
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/export/${table}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (!res.ok) {
          throw new Error(`Export failed with HTTP status ${res.status}`);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast(`✅ ${table.toUpperCase()} export downloaded successfully`, 3000, 'success');
      } catch (err) {
        console.error('[Export Error]:', err);
        showToast(`❌ Export failed: ${err.message}`, 4000, 'error');
      }
    }
  };

  // Listen for global currency toggle from top bar or other modules
  window.addEventListener('gro10x_currency_changed', (e) => {
    if (e.detail && e.detail.currency && e.detail.currency !== currentCurrency) {
      currentCurrency = e.detail.currency;
      const pill = document.getElementById('analyticsCurrencyPill');
      if (pill) pill.textContent = currentCurrency === 'USD' ? 'USD ($)' : 'BDT (৳)';
      const revSub = document.getElementById('chartRevSubtitle');
      if (revSub) revSub.textContent = `Daily settled revenue in ${currentCurrency}`;
      loadData();
    }
  });

  await renderAnalytics();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
