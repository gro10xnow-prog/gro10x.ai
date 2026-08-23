/**
 * scripts/e2e-client/phases/phase-9-cross-browser.js
 * Phase T9: Cross-Surface Console Audit & Integrity
 */
const { AUTH_URL, PARTNERS_URL, CLIENT_SPA_URL, MINIAPP_URL, wait, TestTracker } = require('../utils');
const { injectClientSession } = require('../auth');

async function runPhase9(page) {
  const tracker = new TestTracker('Phase T9: Cross-Surface Console & Integrity Audit');
  console.log('\n--- 🚀 Running Phase T9: Console Audit & Integrity ---');

  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  const isCriticalError = (e) => {
    return !e.includes('favicon') && 
           !e.includes('Failed to load resource') && 
           !e.includes('abort') && 
           !e.includes('Unexpected end of input');
  };

  // T9.1 Audit Auth Page
  await tracker.runStep('T9.1.1', 'Audit /auth for zero uncaught JavaScript errors', async () => {
    pageErrors.length = 0;
    await page.goto(AUTH_URL, { waitUntil: 'networkidle2' });
    await wait(600);
    const critical = pageErrors.filter(isCriticalError);
    tracker.assert(critical.length === 0, `Uncaught JS errors found on /auth: ${critical.join(', ')}`);
  });

  // T9.2 Audit Partners Page
  await tracker.runStep('T9.1.2', 'Audit /partners for zero uncaught JavaScript errors', async () => {
    pageErrors.length = 0;
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await injectClientSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(800);
    const critical = pageErrors.filter(isCriticalError);
    tracker.assert(critical.length === 0, `Uncaught JS errors found on /partners: ${critical.join(', ')}`);
  });

  // T9.3 Audit Client SPA
  await tracker.runStep('T9.1.3', 'Audit /client/ SPA for zero uncaught JavaScript errors', async () => {
    pageErrors.length = 0;
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await injectClientSession(page);
    await page.goto(CLIENT_SPA_URL + '#home', { waitUntil: 'networkidle2' });
    await wait(800);
    const critical = pageErrors.filter(isCriticalError);
    tracker.assert(critical.length === 0, `Uncaught JS errors found on /client/: ${critical.join(', ')}`);
  });

  // T9.4 Audit Mini App
  await tracker.runStep('T9.1.4', 'Audit /client-miniapp.html for zero uncaught JavaScript errors', async () => {
    pageErrors.length = 0;
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(800);
    const critical = pageErrors.filter(isCriticalError);
    tracker.assert(critical.length === 0, `Uncaught JS errors found on /client-miniapp.html: ${critical.join(', ')}`);
  });

  return tracker.getSummary();
}

module.exports = { runPhase9 };
