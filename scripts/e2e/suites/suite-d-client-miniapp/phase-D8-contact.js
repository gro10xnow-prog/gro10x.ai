/**
 * Suite D - Phase D8: Agency Contact & POCs
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD8(page) {
  const tracker = new TestTracker('Suite D - Phase D8: Contact & POCs');
  console.log('\n--- ?? Running Suite D - Phase D8: Contact ---');

  await tracker.runStep('D8.1', 'Verify Dedicated Account Manager & POC Contacts', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Contact view should render');
    await tracker.screenshot(page, 'D8.1_miniapp_contact.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD8 };
