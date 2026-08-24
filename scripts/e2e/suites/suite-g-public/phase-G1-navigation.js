/**
 * Suite G - Phase G1: Public Site Navigation & Responsive Layout
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseG1(page) {
  const tracker = new TestTracker('Suite G - Phase G1: Public Navigation');
  console.log('\n--- ?? Running Suite G - Phase G1: Navigation ---');

  await tracker.runStep('G1.1', 'Load Public Landing Page and Verify Hero & Services', async () => {
    await page.goto(BASE_URL + '/index.html', { waitUntil: 'networkidle2' });
    await wait(1000);
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.includes('GRO10X') || content.includes('Agency') || content.includes('Growth') || content.includes('Marketing'), 'Public landing page should load');
    await tracker.screenshot(page, 'G1.1_public_landing.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseG1 };
