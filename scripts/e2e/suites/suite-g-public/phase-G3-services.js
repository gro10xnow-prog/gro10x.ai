/**
 * Suite G - Phase G3: Service Detail Catalog Pages
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseG3(page) {
  const tracker = new TestTracker('Suite G - Phase G3: Service Detail');
  console.log('\n--- ?? Running Suite G - Phase G3: Services ---');

  await tracker.runStep('G3.1', 'Load Service Detail Page & Inspect Showcase Media', async () => {
    await page.goto(BASE_URL + '/service-detail.html', { waitUntil: 'networkidle2' });
    await wait(800);
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Service detail page should render');
    await tracker.screenshot(page, 'G3.1_service_detail.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseG3 };
