/**
 * public/app/modules/analytics.js
 * Agency Analytics & Delivery Scorecards Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.analytics = async function(container) {
  let selectedDays = 30;
  let revenueChartInstance = null;
  let tasksChartInstance = null;
  let utmChartInstance = null;

  async function initView() {
    renderSkeleton();
    await loadData();
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📈 Agency Analytics & Performance Scorecards
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Real-time financial performance, turnaround times, lead UTM sources, and client scorecards.
          </div>
        </div>
        <div style="display: flex; gap: 0.8rem; align-items: center;">
          <select id="anDaysSelect" class="input-text" style="width: auto; padding: 0.45rem 0.85rem;" onchange="window.ANALYTICS_MODULE.changeTimeframe(this.value)">
            <option value="30" ${selectedDays == 30 ? 'selected' : ''}>Last 30 Days</option>
            <option value="90" ${selectedDays == 90 ? 'selected' : ''}>Last 90 Days</option>
            <option value="365" ${selectedDays == 365 ? 'selected' : ''}>This Year (365 Days)</option>
          </select>
          <button class="btn-primary" onclick="window.ANALYTICS_MODULE.exportCSV()">📥 Export Data (CSV)</button>
        </div>
      </div>

      <!-- Time Series Charts Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="card-glass" style="padding: 1.25rem; position: relative;">
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">💰 Revenue Trend</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Daily paid invoice revenue (BDT)</div>
          <div style="height: 240px; position: relative;"><canvas id="anRevenueCanvas"></canvas></div>
        </div>

        <div class="card-glass" style="padding: 1.25rem; position: relative;">
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">📋 Production Throughput</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Tasks completed by date</div>
          <div style="height: 240px; position: relative;"><canvas id="anTasksCanvas"></canvas></div>
        </div>
      </div>

      <!-- Scorecard & UTM Grid -->
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="card-glass" style="padding: 1.25rem;">
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">🎯 Lead UTM Attribution</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Landed leads breakdown by channel</div>
          <div style="height: 220px; position: relative;"><canvas id="anUtmCanvas"></canvas></div>
        </div>

        <div class="card-glass" style="padding: 1.25rem;">
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">🏢 Department Delivery Scorecard</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">Turnaround & Quality Control pass rates</div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Tasks Done</th>
                  <th>Avg Turnaround</th>
                  <th>QC Pass Rate</th>
                </tr>
              </thead>
              <tbody id="anDeptBody">
                <tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading scorecard...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Client Scorecard Card -->
      <div class="card-glass" style="padding: 1.25rem;">
        <div style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">🤝 Client Account Delivery Scorecard</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 1rem;">On-time delivery rates, revision averages, turnaround times per account</div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Delivered Items</th>
                <th>On-Time Delivery</th>
                <th>Avg Revision Cycles</th>
                <th>Avg Turnaround</th>
              </tr>
            </thead>
            <tbody id="anClientBody">
              <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading client metrics...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const [timeSeries, scorecards] = await Promise.all([
        APP_API.get(`/analytics/time-series?days=${selectedDays}`).catch(() => []),
        APP_API.get(`/analytics/scorecards?days=${selectedDays}`).catch(() => ({}))
      ]);

      renderTimeSeries(timeSeries || []);
      renderUTMChart(scorecards.utmBreakdown || {});
      renderDeptScorecard(scorecards.departments || []);
      renderClientScorecard(scorecards.clients || []);
    } catch (err) {
      console.error('[Analytics Module] Load error:', err);
      showToast('Error loading analytics data', 'error');
    }
  }

  function renderTimeSeries(data) {
    if (!window.Chart) return;
    Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    const labels = data.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const revenue = data.map(d => d.revenue || 0);
    const tasks = data.map(d => d.tasksCompleted || 0);

    // Revenue Line Chart
    if (revenueChartInstance) revenueChartInstance.destroy();
    const revEl = document.getElementById('anRevenueCanvas');
    if (revEl) {
      revenueChartInstance = new Chart(revEl.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenue (BDT)',
            data: revenue,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Tasks Bar Chart
    if (tasksChartInstance) tasksChartInstance.destroy();
    const taskEl = document.getElementById('anTasksCanvas');
    if (taskEl) {
      tasksChartInstance = new Chart(taskEl.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Tasks Completed',
            data: tasks,
            backgroundColor: '#a855f7',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  function renderUTMChart(utmData) {
    if (!window.Chart) return;
    const labels = Object.keys(utmData);
    const data = Object.values(utmData);

    if (utmChartInstance) utmChartInstance.destroy();
    const utmEl = document.getElementById('anUtmCanvas');
    if (utmEl) {
      utmChartInstance = new Chart(utmEl.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Organic / Direct'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6b7280'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
      });
    }
  }

  function renderDeptScorecard(depts) {
    const tbody = document.getElementById('anDeptBody');
    if (!tbody) return;

    if (!depts || depts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No department metrics logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = depts.map(d => `
      <tr>
        <td><strong style="color:var(--text-main);">${escapeHTML(d.name)}</strong></td>
        <td style="font-weight:700;">${d.tasksDone || 0}</td>
        <td style="color:var(--text-muted);">${(d.avgTurnaroundDays || 0).toFixed(1)} days</td>
        <td><span class="badge ${d.qcPassRate >= 90 ? 'badge-emerald' : 'badge-amber'}">${(d.qcPassRate || 0).toFixed(1)}%</span></td>
      </tr>
    `).join('');
  }

  function renderClientScorecard(clients) {
    const tbody = document.getElementById('anClientBody');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No client metrics logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.55rem;">
            <div style="width:28px; height:28px; border-radius:8px; background:rgba(168,85,247,0.15); color:var(--purple-light); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">
              ${escapeHTML(c.name.substring(0,2).toUpperCase())}
            </div>
            <strong style="color:var(--text-main);">${escapeHTML(c.name)}</strong>
          </div>
        </td>
        <td style="font-weight:700;">${c.tasksDelivered || 0}</td>
        <td><span class="badge ${c.onTimeRate >= 85 ? 'badge-emerald' : 'badge-pink'}">${(c.onTimeRate || 0).toFixed(1)}%</span></td>
        <td style="color:var(--text-muted);">${(c.avgRevisions || 0).toFixed(1)}</td>
        <td style="color:var(--text-muted);">${(c.avgTurnaround || 0).toFixed(1)} days</td>
      </tr>
    `).join('');
  }

  window.ANALYTICS_MODULE = {
    async changeTimeframe(val) {
      selectedDays = parseInt(val, 10) || 30;
      await loadData();
    },
    exportCSV() {
      const table = prompt('Which dataset would you like to export?\nOptions: tasks, clients, invoices, leads, attendance, expenses', 'tasks');
      const valid = ['tasks', 'clients', 'invoices', 'leads', 'attendance', 'expenses'];
      if (table) {
        const norm = table.toLowerCase().trim();
        if (valid.includes(norm)) {
          window.location.href = `/api/export/${norm}`;
        } else {
          alert('Invalid choice. Available datasets: ' + valid.join(', '));
        }
      }
    }
  };

  await initView();
};
