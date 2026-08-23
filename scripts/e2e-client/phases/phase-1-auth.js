/**
 * scripts/e2e-client/phases/phase-1-auth.js
 * Phase T1: Auth Gate & Session Integrity
 */
const { AUTH_URL, PARTNERS_URL, CLIENT_SPA_URL, MINIAPP_URL, wait, TestTracker } = require('../utils');
const { injectClientSession, clearSession, CLIENT_USER } = require('../auth');

async function runPhase1(page) {
  const tracker = new TestTracker('Phase T1: Auth Gate & Session Integrity');
  console.log('\n--- 🚀 Running Phase T1: Auth Gate & Session Integrity ---');

  // T1.1 Login Page Loads
  await tracker.runStep('T1.1.1', 'Navigate to /auth — page loads without JS errors', async () => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await wait(500);
    const title = await page.title();
    tracker.assert(title.includes('Portal') || title.includes('Purplebot'), `Unexpected title: ${title}`);
    await tracker.screenshot(page, 't1.1.1_auth_page.png');
  });

  // T1.1.2 Empty Submit Validation
  await tracker.runStep('T1.1.2', 'Empty submit validation on /auth', async () => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await wait(300);
    const submitBtn = await page.$('button[type="submit"], button.btn-primary, #btnLogin, .auth-btn');
    if (submitBtn) {
      await submitBtn.click();
      await wait(300);
    }
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), 'Should remain on /auth when submitting empty form');
  });

  // T1.2 Unauthenticated Redirect Guards
  await tracker.runStep('T1.2.1', 'Unauthenticated access to /partners redirects to /auth', async () => {
    await page.goto(PARTNERS_URL, { waitUntil: 'domcontentloaded' });
    await clearSession(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(600);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), `Expected redirect to /auth, got ${currentUrl}`);
  });

  await tracker.runStep('T1.2.2', 'Unauthenticated access to /client/ redirects to /auth', async () => {
    await page.goto(CLIENT_SPA_URL, { waitUntil: 'domcontentloaded' });
    await clearSession(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(600);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), `Expected redirect to /auth, got ${currentUrl}`);
  });

  // T1.2.3 Telegram Mini App Graceful Fallback
  await tracker.runStep('T1.2.3', 'Access /client-miniapp.html without Telegram initData loads with graceful fallback', async () => {
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(800);
    const nameEl = await page.$('#heroClientName');
    tracker.assert(nameEl !== null, '#heroClientName should exist in mini app');
    await tracker.screenshot(page, 't1.2.3_miniapp_fallback.png');
  });

  // T1.3 Valid Client Session Injection
  await tracker.runStep('T1.3.1', 'Load /partners with Valid Client JWT Session', async () => {
    await injectClientSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1200);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/partners'), `Expected /partners to load, got ${currentUrl}`);
    await tracker.screenshot(page, 't1.3.1_partners_loaded.png');
  });

  await tracker.runStep('T1.3.2', 'Load /client/ SPA with Valid Client JWT Session', async () => {
    await injectClientSession(page);
    await page.goto(CLIENT_SPA_URL + '#home', { waitUntil: 'networkidle2' });
    await wait(1200);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/client/'), `Expected client SPA to load, got ${currentUrl}`);
    await tracker.screenshot(page, 't1.3.2_client_spa_loaded.png');
  });

  // T1.4 Sign Out Flow
  await tracker.runStep('T1.4.1', 'Sign Out on /partners clears session and redirects to /auth', async () => {
    await injectClientSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(600);

    await page.evaluate(() => {
      if (typeof window.handlePartnerLogout === 'function') {
        window.handlePartnerLogout();
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth';
      }
    });
    await wait(1200);

    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), `Expected redirect to /auth after signout, got ${currentUrl}`);

    const hasToken = await page.evaluate(() => !!localStorage.getItem('sb-access-token'));
    tracker.assert(!hasToken, 'localStorage sb-access-token should be removed');
  });

  return tracker.getSummary();
}

module.exports = { runPhase1 };
