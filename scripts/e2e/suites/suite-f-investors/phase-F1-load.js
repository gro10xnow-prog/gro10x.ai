/**
 * Suite F - Phase F1: Investors Page Loading & Global Navigation
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseF1(page) {
  const tracker = new TestTracker('Suite F - Phase F1: Investors Page Load');
  console.log('\n--- ?? Running Suite F - Phase F1: Investors Load ---');

  const INVESTORS_URL = `${BASE_URL}/investors.html`;

  await tracker.runStep('F1.1', 'Load Public Investors Portal without Auth Wall', async () => {
    await page.goto(INVESTORS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.includes('Investor') || content.includes('Growth') || content.includes('GRO10X') || content.includes('Financials'), 'Investors portal should render');
    await tracker.screenshot(page, 'F1.1_investors_hero.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF1 };
