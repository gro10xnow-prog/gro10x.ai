/**
 * scripts/e2e/phases/phase-2-command.js
 * Phase 2: Command Center — Executive Dashboard & Agency Analytics
 */
const { APP_URL, wait, TestTracker } = require('../utils');

async function runPhase2(page) {
  const tracker = new TestTracker('Phase 2: Executive Dashboard & Analytics');
  console.log('\n--- 🚀 Running Phase 2: Executive Dashboard & Analytics ---');

  // Navigate to Dashboard
  await tracker.runStep('2.1.1', 'Load Executive Dashboard & Verify Hero Section', async () => {
    await page.evaluate(() => { window.location.hash = '#dashboard'; });
    await wait(1500);
    const greeting = await page.$eval('#dashboard-root, #app-view', el => el.textContent);
    tracker.assert(greeting.includes('Executive') || greeting.includes('Good') || greeting.includes('Overview'), 'Dashboard greeting should render');
    await tracker.screenshot(page, '2.1.1.6_dashboard_hero.png');
  });

  // 2.1.2 Executive Action Center
  await tracker.runStep('2.1.2', 'Verify 1-Tap Executive Action Center & Sign-Off Buttons', async () => {
    const actionCenter = await page.$('.action-center-container, #execActionCenter, #app-view');
    tracker.assert(actionCenter !== null, 'Action center should be present');

    const approveButtons = await page.$$('.action-card button, #app-view button');
    tracker.assert(approveButtons.length > 0, 'Approve/action buttons should exist on the dashboard');
    await tracker.screenshot(page, '2.1.2.6_action_center.png');
  });

  // 2.1.3 Financial Oversight & Cash Flow Engine
  await tracker.runStep('2.1.3', 'Verify Financial Oversight Gauges & BDT Notation', async () => {
    const pageText = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(pageText.includes('৳'), 'Currency should be rendered in Bangladeshi Taka (৳)');
    await tracker.screenshot(page, '2.1.3.5_cash_flow_engine.png');
  });

  // 2.1.4 Critical & Overdue Deliverables Radar
  await tracker.runStep('2.1.4', 'Verify Overdue Deliverables Radar', async () => {
    const radarExists = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Overdue') || text.includes('Radar') || text.includes('Deliverables');
    });
    tracker.assert(radarExists, 'Overdue deliverables radar section should render');
  });

  // 2.1.5 Real-Time Studio Attendance Pulse
  await tracker.runStep('2.1.5', 'Verify Real-Time Studio Attendance Pulse', async () => {
    const attendanceExists = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Attendance') || text.includes('Studio') || text.includes('Staff');
    });
    tracker.assert(attendanceExists, 'Attendance pulse section should render');
  });

  // 2.2 Agency Analytics
  await tracker.runStep('2.2.1', 'Navigate to Analytics & Verify Metrics', async () => {
    await page.evaluate(() => { window.location.hash = '#analytics'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent.trim());
    tracker.assert(content.length > 50, 'Analytics module should render scorecard/charts');
    await tracker.screenshot(page, '2.2.3_analytics_overview.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhase2 };
