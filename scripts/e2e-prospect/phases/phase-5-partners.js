/**
 * scripts/e2e-prospect/phases/phase-5-partners.js
 * Phase 5: Partners & Showcase Verification Suite
 */
const { BASE_URL, wait, captureScreenshot } = require('../utils');

async function runPhase5(page) {
  const results = {
    name: 'Phase 5: Partners & Showcase Verification Suite',
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

  console.log(`\n🚀 Executing Phase 5: Partners Page Suite...`);

  try {
    await page.goto(`${BASE_URL}/partners.html`, { waitUntil: 'networkidle2' });
    await wait(600);
    await captureScreenshot(page, 'phase5_1_partners_page.png');

    const title = await page.title();
    record('5.1.1 Partners page title is properly configured', title.length > 5);

    const consultationCta = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      return links.some(el => el.innerText.includes('Consultation') || el.innerText.includes('Purplebot') || el.innerText.includes('Contact'));
    });
    record('5.1.2 Partners page includes active agency contact & consultation pathway', consultationCta);

  } catch (err) {
    record('Phase 5 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase5 };
