/**
 * scripts/e2e-client/report.js
 * HTML and JSON Test Report Generator for Client Partner E2E Suite
 */
const fs = require('fs');
const path = require('path');
const { REPORTS_DIR } = require('./utils');

function generateReport(suiteResults, consoleAudit = []) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runReportDir = path.join(REPORTS_DIR, `run-${timestamp}`);
  if (!fs.existsSync(runReportDir)) fs.mkdirSync(runReportDir, { recursive: true });

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  suiteResults.forEach(s => {
    totalTests += s.total;
    totalPassed += s.passed;
    totalFailed += s.failed;
    totalDuration += s.duration;
  });

  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 100;

  const jsonSummary = {
    timestamp: new Date().toISOString(),
    stakeholder: 'Client Partner (Brands, Retainer Clients, Enterprise Accounts)',
    totalTests,
    totalPassed,
    totalFailed,
    passRate,
    totalDurationMs: totalDuration,
    phases: suiteResults,
    consoleAudit
  };

  fs.writeFileSync(path.join(runReportDir, 'summary.json'), JSON.stringify(jsonSummary, null, 2));

  // Generate HTML Report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client Partner E2E Master Test Report — ${new Date().toLocaleString()}</title>
  <style>
    :root {
      --bg: #0d0d14;
      --card: #181824;
      --border: #2e2e3e;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --green: #10b981;
      --red: #ef4444;
      --purple: #8b5cf6;
      --pink: #ec4899;
    }
    * { box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 2rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .kpi-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .kpi-val { font-size: 1.8rem; font-weight: 800; margin-top: 0.25rem; }
    .phase-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .phase-header {
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-list {
      padding: 0.5rem 1.25rem;
    }
    .test-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 0.9rem;
    }
    .test-row:last-child { border-bottom: none; }
    .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-pass { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
    .badge-fail { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
    .error-box {
      font-size: 0.8rem;
      color: #fca5a5;
      background: rgba(239,68,68,0.1);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin-top: 0.25rem;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0; font-size:1.6rem; font-weight:800;">🤝 Client Partner Stakeholder E2E Master Report</h1>
      <div style="color:var(--text-muted); font-size:0.85rem; margin-top:0.25rem;">
        Brands · Retainer Clients · Enterprise Accounts — Full Touchpoint Browser Verification
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:0.85rem; color:var(--text-muted);">${new Date().toLocaleString()}</div>
      <div style="font-size:0.85rem; color:var(--purple); font-weight:700;">PurpleOS Master Suite v2.5</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Pass Rate</div>
      <div class="kpi-val" style="color: ${passRate === 100 ? 'var(--green)' : 'var(--red)'}">${passRate}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Tests</div>
      <div class="kpi-val">${totalTests}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Passed</div>
      <div class="kpi-val" style="color:var(--green)">${totalPassed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Failed</div>
      <div class="kpi-val" style="color:${totalFailed > 0 ? 'var(--red)' : 'var(--text-muted)'}">${totalFailed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Duration</div>
      <div class="kpi-val">${(totalDuration / 1000).toFixed(2)}s</div>
    </div>
  </div>

  ${suiteResults.map(phase => `
    <div class="phase-card">
      <div class="phase-header">
        <div>
          <strong style="font-size:1.05rem;">${phase.phase}</strong>
          <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">(${phase.passed}/${phase.total} passed in ${(phase.duration/1000).toFixed(2)}s)</span>
        </div>
        <span class="badge ${phase.failed === 0 ? 'badge-pass' : 'badge-fail'}">
          ${phase.failed === 0 ? 'ALL PASSED' : `${phase.failed} FAILED`}
        </span>
      </div>
      <div class="test-list">
        ${phase.tests.map(t => `
          <div class="test-row">
            <div style="flex:1;">
              <span style="font-weight:600; color:#fff;">[${t.id}] ${t.title}</span>
              ${t.error ? `<div class="error-box">❌ ${t.error}</div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="font-size:0.8rem; color:var(--text-muted);">${t.duration}ms</span>
              <span class="badge ${t.status === 'PASSED' ? 'badge-pass' : 'badge-fail'}">${t.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}

</body>
</html>`;

  const reportPath = path.join(runReportDir, 'index.html');
  fs.writeFileSync(reportPath, html);

  // Also write to latest report
  fs.writeFileSync(path.join(REPORTS_DIR, 'latest-client-report.html'), html);

  return { jsonSummary, reportPath };
}

module.exports = { generateReport };
