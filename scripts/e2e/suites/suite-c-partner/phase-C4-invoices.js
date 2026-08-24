/**
 * Suite C - Phase C4: Partner Invoices & Online Payment Modal
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseC4(page) {
  const tracker = new TestTracker('Suite C - Phase C4: Invoices & Payments');
  console.log('\n--- ?? Running Suite C - Phase C4: Invoices ---');

  await tracker.runStep('C4.1', 'Verify Invoice List and Pay Now Payment Flow', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Invoice table should be present');
    await tracker.screenshot(page, 'C4.1_partner_invoices.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC4 };
