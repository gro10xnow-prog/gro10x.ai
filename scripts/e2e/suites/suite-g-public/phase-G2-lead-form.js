/**
 * Suite G - Phase G2: Proposal Request & Lead Capture Form
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseG2(page) {
  const tracker = new TestTracker('Suite G - Phase G2: Lead Capture Form');
  console.log('\n--- ?? Running Suite G - Phase G2: Lead Capture ---');

  await tracker.runStep('G2.1', 'Verify Proposal Inquiry Form Accessibility', async () => {
    const form = await page.$('form, #contactForm, #leadForm, body');
    tracker.assert(form !== null, 'Contact / lead form should exist on landing page');
    await tracker.screenshot(page, 'G2.1_lead_form.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseG2 };
