/**
 * scripts/e2e/report.js
 * HTML and JSON Test Report Generator for PurpleOS E2E Suite
 */
const fs = require('fs');
const path = require('path');
const { REPORTS_DIR, SCREENSHOTS_DIR } = require('./utils');

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
    totalTests,
    totalPassed,
    totalFailed,
    passRate,
    totalDurationMs: totalDuration,
    phases: suiteResults,
    consoleAudit
  };

  fs.writeFileSync(path.join(runReportDir, 'summary.json'), JSON.stringify(jsonSummary, null, 2));

  // Generate beautiful HTML Report
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PurpleOS E2E Test Report — ${new Date().toLocaleString()}</title>
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
      grid-template-columns: repeat(4, 1fr);
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
    .test-list { list-style: none; padding: 0; margin: 0; }
    .test-item {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }
    .badge {
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-pass { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
    .badge-fail { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0; font-size:1.6rem; color:var(--pink);">⚡ PurpleOS Browser Automation Report</h1>
      <p style="margin:0.25rem 0 0; color:var(--text-muted); font-size:0.85rem;">Generated on ${new Date().toLocaleString()} · Automated E2E Regression Suite</p>
    </div>
    <div class="badge ${totalFailed === 0 ? 'badge-pass' : 'badge-fail'}" style="font-size:1rem; padding:0.4rem 1rem;">
      ${totalFailed === 0 ? '✅ ALL TESTS PASSING (100%)' : `🚨 ${totalFailed} TESTS FAILED`}
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Total Test Assertions</div>
      <div class="kpi-val" style="color:var(--purple);">${totalTests}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Passed</div>
      <div class="kpi-val" style="color:var(--green);">${totalPassed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Failed</div>
      <div class="kpi-val" style="color:var(--red);">${totalFailed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Pass Rate</div>
      <div class="kpi-val" style="color:${passRate === 100 ? 'var(--green)' : 'var(--pink)'};">${passRate}%</div>
    </div>
  </div>

  <h2>🧪 Phase Test Breakdown</h2>
  ${suiteResults.map(s => `
    <div class="phase-card">
      <div class="phase-header">
        <h3 style="margin:0; font-size:1.05rem;">${s.phase}</h3>
        <div>
          <span class="badge ${s.failed === 0 ? 'badge-pass' : 'badge-fail'}">${s.passed}/${s.total} Passed (${s.duration}ms)</span>
        </div>
      </div>
      <ul class="test-list">
        ${s.results.map(r => `
          <li class="test-item">
            <div>
              <strong>[${r.id}]</strong> ${r.title}
              ${r.error ? `<div style="color:var(--red); font-size:0.8rem; margin-top:0.3rem;">⚠️ ${r.error}</div>` : ''}
            </div>
            <div>
              <span class="badge ${r.status === 'PASSED' ? 'badge-pass' : 'badge-fail'}">${r.status} (${r.duration}ms)</span>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('')}

</body>
</html>`;

  fs.writeFileSync(path.join(runReportDir, 'index.html'), html);
  // Also copy to latest index.html
  fs.writeFileSync(path.join(REPORTS_DIR, 'latest-report.html'), html);
  console.log(`📊 Report generated at: ${path.join(runReportDir, 'index.html')}`);
  return { jsonSummary, reportPath: path.join(runReportDir, 'index.html') };
}

module.exports = {
  generateReport
};
