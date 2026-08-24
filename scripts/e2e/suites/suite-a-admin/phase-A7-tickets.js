/**
 * Suite A - Phase A7: Support Tickets
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseA7(page) {
  const tracker = new TestTracker('Suite A - Phase A7: Support Tickets');
  console.log('\n--- ?? Running Suite A - Phase A7: Support Tickets ---');

  await tracker.runStep('A7.1.1', 'Load Support Tickets Queue', async () => {
    await page.evaluate(() => { window.location.hash = '#tickets'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Ticket') || content.includes('Support') || content.includes('Issue'), 'Tickets module should render');
    await tracker.screenshot(page, 'A7.1_tickets_queue.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA7 };
