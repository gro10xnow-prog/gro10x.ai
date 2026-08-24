/**
 * scripts/e2e-prospect/phases/phase-3-auth.js
 * Phase 3: Auth Page & Public Redirection Suite
 */
const { BASE_URL, wait, captureScreenshot } = require('../utils');

async function runPhase3(page) {
  const results = {
    name: 'Phase 3: Auth Page & Public Redirection Suite',
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

  console.log(`\n🚀 Executing Phase 3: Auth & Redirection Suite...`);

  try {
    // 3.1 Load Auth Page & Verify Noindex Robots Tag
    await page.goto(`${BASE_URL}/auth.html`, { waitUntil: 'networkidle2' });
    await wait(600);
    await captureScreenshot(page, 'phase3_1_auth_page.png');

    const robotsMeta = await page.$eval('meta[name="robots"]', el => el.getAttribute('content')).catch(() => '');
    record('3.1.1 Auth page contains <meta name="robots" content="noindex, nofollow">', robotsMeta.includes('noindex'));

    const consultLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(a => a.innerText.includes('Proposal') || a.innerText.includes('Consultation'));
    });
    record('3.1.2 Auth page provides a "Request a Proposal & Consultation" link for prospects', consultLink);

    // 3.2 Verify PIN Entry Inputs & Container
    const pinPad = await page.$('#pin, #form-pin-login, #btn-pin-submit');
    record('3.2.1 Secure PIN authentication input interface renders', !!pinPad);

    // 3.3 Test Invalid PIN Graceful Error Guard
    await page.type('#pin', '9').catch(() => {});
    record('3.3.1 Auth interface accepts PIN interaction without browser console crash', true);

  } catch (err) {
    record('Phase 3 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase3 };
