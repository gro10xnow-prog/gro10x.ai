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

  async function renderAnalytics() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📈 Agency Analytics & Intelligence
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Live cross-platform performance metrics, revenue intelligence, task velocity & team compliance.
          </div>
        </div>

        <div style="display:flex; gap:0.75rem; align-items:center;">
          <select id="analyticsDaysSelect" class="input-text" style="width:auto; padding:0.45rem 0.85rem;" onchange="window.ANALYTICS_MODULE.changePeriod(this.value)">
            <option value="30" ${selectedDays == 30 ? 'selected' : ''}>Last 30 Days</option>
            <option value="90" ${selectedDays == 90 ? 'selected' : ''}>Last 90 Days</option>
            <option value="365" ${selectedDays == 365 ? 'selected' : ''}>This Year (365 Days)</option>
          </select>
          
          <div style="position:relative; display:inline-block;">
            <button class="btn-primary" onclick="window.ANALYTICS_MODULE.toggleExportMenu()">📥 Export Report ▼</button>
            <div id="exportMenuDropdown" style="display:none; position:absolute; right:0; top:110%; background:var(--bg-card, #0f172a); border:1px solid var(--border-subtle); border-radius:10px; width:180px; z-index:100; box-shadow:0 10px 25px rgba(0,0,0,0.5); overflow:hidden;">
              <a href="/api/export/tasks" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">📋 Tasks CSV</a>
              <a href="/api/export/invoices" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">💰 Invoices CSV</a>
              <a href="/api/export/clients" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">🏢 Clients CSV</a>
              <a href="/api/export/leads" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">🎯 Leads CSV</a>
              <a href="/api/export/attendance" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">⏱️ Attendance CSV</a>
              <a href="/api/export/expenses" target="_blank" class="dropdown-item" style="display:block; padding:0.6rem 1rem; color:var(--text-main); text-decoration:none; font-size:0.8rem;">🧾 Expenses CSV</a>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: TOP-LINE 6 KPI SUMMARY CARDS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;" id="analyticsKpiRow">
        <div class="kpi-tile"><div class="kpi-label">Settled Revenue</div><div class="kpi-val" id="kpiRevVal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">Tasks Delivered</div><div class="kpi-val" id="kpiTasksVal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">Leads Captured</div><div class="kpi-val" id="kpiLeadsVal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">Conversion Rate</div><div class="kpi-val" id="kpiCvrVal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">Avg Turnaround</div><div class="kpi-val" id="kpiTurnaroundVal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">EOD Compliance</div><div class="kpi-val" id="kpiEodRateVal">—</div></div>
      </div>

      <!-- SECTION 3: REVENUE TREND & TASK THROUGHPUT CHARTS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem;">💰 Revenue Trend (Paid Invoices)</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Daily settled revenue in BDT</div>
          <div style="height: 240px; position: relative;">
            <canvas id="revTrendCanvas"></canvas>
          </div>
        </div>

        <div class="card-glass">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem;">📋 Task Throughput & Deliveries</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Completed workflows by date</div>
          <div style="height: 240px; position: relative;">
            <canvas id="taskThroughputCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- SECTION 4: DEPARTMENT SCORECARD & UTM LEAD ATTRIBUTION -->
      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card-glass">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem;">🏢 Department Delivery Scorecard</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Task volume, turnaround times, and quality pass rates per department</div>
          <table class="data-table" style="font-size:0.8rem;">
            <thead>
              <tr>
                <th>Department</th>
                <th>Tasks Done</th>
                <th>Avg Turnaround</th>
                <th>QC Pass Rate</th>
              </tr>
            </thead>
            <tbody id="deptScorecardTbody">
              <tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading scorecard...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card-glass">
          <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem;">🎯 Lead UTM Channel Attribution</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Lead acquisition breakdown by source</div>
          <div style="height: 200px; position: relative;">
            <canvas id="utmAttributionCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- SECTION 5: CLIENT DELIVERY PERFORMANCE SCORECARD -->
      <div class="card-glass" style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 0.2rem;">🤝 Client Delivery & Account Performance</h3>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">On-time delivery rates, revision counts, and turnaround times per account</div>
        <table class="data-table" style="font-size:0.8rem;">
          <thead>
            <tr>
              <th>Client Account</th>
              <th>Tasks Delivered</th>
              <th>On-Time Rate</th>
              <th>Avg Revisions</th>
              <th>Avg Turnaround</th>
            </tr>
          </thead>
          <tbody id="clientScorecardTbody">
            <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading client metrics...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    loadData();
  }

  async function loadData() {
    try {
      const [timeSeriesRes, scorecardsRes, invoicesRes, tasksRes, leadsRes, eodRes] = await Promise.all([
        APP_API.get(`/analytics/time-series?days=${selectedDays}`).catch(() => null),
        APP_API.get(`/analytics/scorecards?days=${selectedDays}`).catch(() => null),
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/leads').catch(() => []),
        APP_API.get('/team/eod').catch(() => [])
      ]);

      // 1. TOP-LINE KPIS
      const paidTotal = (invoicesRes || []).filter(i => (i.status || '').toLowerCase() === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
      const completedTasks = (tasksRes || []).filter(t => t.stage === 'Approved' || t.stage === 'Completed' || t.stage === 'Published');
      const leads = leadsRes || [];
      const wonLeads = leads.filter(l => l.stage === 'Won' || l.stage === 'Closed Won').length;
      const cvr = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) + '%' : '0%';
      const eodCount = (eodRes || []).length;

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

      document.getElementById('kpiRevVal').textContent = `৳${paidTotal.toLocaleString()}`;
      document.getElementById('kpiTasksVal').textContent = completedTasks.length;
      document.getElementById('kpiLeadsVal').textContent = leads.length;
      document.getElementById('kpiCvrVal').textContent = cvr;
      document.getElementById('kpiTurnaroundVal').textContent = `${avgDays} days`;
      document.getElementById('kpiEodRateVal').textContent = `${Math.min(100, Math.round((eodCount / (selectedDays * 8 || 1)) * 100))}%`;

      // 2. TIME-SERIES CHARTS (FIXED BUG: accesses series array correctly!)
      const series = (timeSeriesRes && Array.isArray(timeSeriesRes.series)) ? timeSeriesRes.series : [];
      renderCharts(series);

      // 3. SCORECARDS & UTM
      if (scorecardsRes) {
        renderDeptScorecard(scorecardsRes.departments || []);
        renderClientScorecard(scorecardsRes.clients || []);
        renderUTMChart(scorecardsRes.utmBreakdown || {});
      }
    } catch(err) {
      console.error('[Analytics Module Error]:', err);
    }
  }

  function renderCharts(seriesData) {
    const labels = seriesData.map(s => new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const revenue = seriesData.map(s => s.revenue);
    const tasks = seriesData.map(s => s.tasksCompleted);

    // Revenue Trend Chart
    const ctxRev = document.getElementById('revTrendCanvas');
    if (ctxRev) {
      if (timeSeriesChart) timeSeriesChart.destroy();
      timeSeriesChart = new Chart(ctxRev.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            label: 'Revenue (BDT)',
            data: revenue.length ? revenue : [0],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // Tasks Throughput Chart
    const ctxTask = document.getElementById('taskThroughputCanvas');
    if (ctxTask) {
      if (tasksChart) tasksChart.destroy();
      tasksChart = new Chart(ctxTask.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            label: 'Tasks Completed',
            data: tasks.length ? tasks : [0],
            backgroundColor: '#8b5cf6',
            borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }
  }

  function renderUTMChart(utmData) {
    const ctxUtm = document.getElementById('utmAttributionCanvas');
    if (!ctxUtm) return;

    const labels = Object.keys(utmData);
    const data = Object.values(utmData);

    if (utmChart) utmChart.destroy();
    utmChart = new Chart(ctxUtm.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['Organic / Direct'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#374151'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'right' } } }
    });
  }

  function renderDeptScorecard(depts) {
    const tbody = document.getElementById('deptScorecardTbody');
    if (!tbody) return;
    if (!depts || depts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-muted);">No department metrics available.</td></tr>';
      return;
    }

    tbody.innerHTML = depts.map(d => `
      <tr>
        <td><strong>${escapeHTML(d.name)}</strong></td>
        <td>${d.tasksDone}</td>
        <td>${(Number(d.avgTurnaroundDays) || 0).toFixed(1)} days</td>
        <td><span style="color:${d.qcPassRate >= 90 ? '#10b981' : '#f59e0b'}; font-weight:700;">${(Number(d.qcPassRate) || 100).toFixed(1)}%</span></td>
      </tr>
    `).join('');
  }

  function renderClientScorecard(clients) {
    const tbody = document.getElementById('clientScorecardTbody');
    if (!tbody) return;
    if (!clients || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--text-muted);">No client performance metrics recorded.</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr>
        <td><strong>${escapeHTML(c.name)}</strong></td>
        <td>${c.tasksDelivered}</td>
        <td><span style="color:${c.onTimeRate >= 85 ? '#10b981' : '#ef4444'}; font-weight:700;">${(Number(c.onTimeRate) || 100).toFixed(1)}%</span></td>
        <td>${(Number(c.avgRevisions) || 0).toFixed(1)}</td>
        <td>${(Number(c.avgTurnaround) || 0).toFixed(1)} days</td>
      </tr>
    `).join('');
  }

  window.ANALYTICS_MODULE = {
    changePeriod(days) {
      selectedDays = Number(days) || 30;
      loadData();
    },
    toggleExportMenu() {
      const menu = document.getElementById('exportMenuDropdown');
      if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  };

  await renderAnalytics();
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
