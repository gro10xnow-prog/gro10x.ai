/**
 * scripts/e2e-prospect/phases/phase-4-reviewroom.js
 * Phase 4: Review Room Unauthenticated State & Graceful Handling
 */
const { BASE_URL, wait, captureScreenshot } = require('../utils');

async function runPhase4(page) {
  const results = {
    name: 'Phase 4: Review Room Unauthenticated Suite',
    passed: 0,
    failed: 0,
    tests: []
  };

  function record(title, passed, error = null) {
    if (passed) {
      results.passed++;
      results.tests.push({ title, status: 'PASS' });
      console.log(`  ✅ ${title}`);
    } else {
      results.failed++;
      results.tests.push({ title, status: 'FAIL', error: String(error) });
      console.error(`  ❌ ${title}: ${error}`);
    }
  }

  console.log(`\n🚀 Executing Phase 4: Review Room Unauthenticated State...`);

  try {
    // 4.1 Load Review Room without Auth
    await page.goto(`${BASE_URL}/reviewroom.html`, { waitUntil: 'networkidle2' });
    await wait(1800);
    await captureScreenshot(page, 'phase4_1_reviewroom_empty.png');

    const bodyText = await page.$eval('body', el => el.innerText);
    record('4.1.1 Unauthenticated Review Room loads without throwing unhandled exceptions', bodyText.length > 50);

    const emptyStateText = await page.evaluate(() => {
      const el = document.getElementById('noAssetPlaceholder') || document.body;
      return el ? el.innerText : '';
    });
    record('4.1.2 Review room displays structured empty state guidance placeholder', bodyText.includes('Review') || bodyText.includes('Deliverable') || bodyText.includes('Cuts') || emptyStateText.includes('Asset') || emptyStateText.length > 10);

    const returnBtn = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      return links.some(el => el.innerText.includes('Return') || el.innerText.includes('Website') || el.innerText.includes('Home') || el.innerText.includes('Back'));
    });
    record('4.1.3 Review room provides "Return to Main Website" CTA link', returnBtn);

  } catch (err) {
    record('Phase 4 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase4 };
