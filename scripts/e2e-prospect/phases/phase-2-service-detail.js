/**
 * scripts/e2e-prospect/phases/phase-2-service-detail.js
 * Phase 2: Service Detail Suite (All 6 routes + unknown fallback)
 */
const { BASE_URL, wait, captureScreenshot } = require('../utils');

const SERVICE_IDS = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004', 'SVC-005', 'SVC-006'];

async function runPhase2(page) {
  const results = {
    name: 'Phase 2: Service Detail Suite',
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

  console.log(`\n🚀 Executing Phase 2: Service Detail Suite (6 Routes)...`);

  try {
    // 2.1 Test all 6 canonical service detail routes
    for (const svcId of SERVICE_IDS) {
      await page.goto(`${BASE_URL}/service-detail.html?id=${svcId}`, { waitUntil: 'networkidle2', timeout: 15000 });
      await wait(600);

      const title = await page.$eval('#svcTitle', el => el.innerText).catch(() => '');
      record(`2.1 Route ${svcId} loads valid service title: "${title.slice(0, 30)}..."`, title.length > 3);

      const startingPrice = await page.$eval('#svcStartingPriceCallout', el => el.innerText).catch(() => '');
      record(`2.1 Route ${svcId} displays starting price callout chip`, startingPrice.includes('৳') || startingPrice.length > 3);

      if (svcId === 'SVC-001') {
        await captureScreenshot(page, 'phase2_svc_001_detail.png');
      }
    }

    // 2.2 Test quote CTA button on service detail page
    const quoteBtn = await page.$('#svcCtaBtn, .pb-btn-quote, .pb-btn-primary');
    record('2.2 Service detail quote CTA button exists', !!quoteBtn);

    // 2.3 Test unknown service ID fallback
    await page.goto(`${BASE_URL}/service-detail.html?id=SVC-999`, { waitUntil: 'networkidle2' });
    await wait(500);
    const bodyText = await page.$eval('body', el => el.innerText);
    record('2.3 Unknown service ID fallback gracefully handles non-existent route without crashing', bodyText.length > 50);

  } catch (err) {
    record('Phase 2 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase2 };
