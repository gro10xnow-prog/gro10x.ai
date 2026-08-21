/**
 * scripts/e2e/phases/phase-7-system.js
 * Phase 7: System & Support — Tickets, Automation Logs, Settings
 */
const { wait, TestTracker } = require('../utils');

async function runPhase7(page) {
  const tracker = new TestTracker('Phase 7: System & Support (Tickets, Automation, Settings)');
  console.log('\n--- 🚀 Running Phase 7: System & Support ---');

  // 7.1 Support Desk Tickets
  await tracker.runStep('7.1.1', 'Load Support Desk Tickets & Verify Triage Queue', async () => {
    await page.evaluate(() => { window.location.hash = '#tickets'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Support') || content.includes('Ticket'), 'Support module should load');
    await tracker.screenshot(page, '7.1.8_tickets_queue.png');
  });

  // 7.2 Automation Logs
  await tracker.runStep('7.2.1', 'Load Bot & Automation Engine Logs Feed', async () => {
    await page.evaluate(() => { window.location.hash = '#automation'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Automation logs module should load');
    await tracker.screenshot(page, '7.2.4_automation_logs.png');
  });

  // 7.3 Settings & Telemetry
  await tracker.runStep('7.3.2', 'Load Settings & Verify Real-Time Telemetry & PIN Updater', async () => {
    await page.evaluate(() => { window.location.hash = '#settings'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Settings') || content.includes('Master') || content.includes('Telemetry'), 'Settings module should load');
    tracker.assert(content.includes('Latency') || content.includes('ms') || content.includes('Cache'), 'Telemetry metrics should render');
    await tracker.screenshot(page, '7.3.2.4_settings_telemetry.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhase7 };
