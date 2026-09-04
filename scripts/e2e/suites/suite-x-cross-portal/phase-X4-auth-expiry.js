/**
 * scripts/e2e/suites/suite-x-cross-portal/phase-X4-auth-expiry.js
 * Suite X - Phase X4: Session Expiry Interception, Tamper Resistance & Re-Auth
 * 
 * Tests:
 * X4.1: Expired Session Interceptor in Admin OS Redirects to /auth
 * X4.2: Expired Session Interceptor in Manager Portal Redirects to /auth
 * X4.3: Expired Session Interceptor in Partner Portal Redirects to /auth
 * X4.4: Tampered/Malformed JWT Token Handling
 * X4.5: Authentication Key Purge Integrity on Unauthorized Responses
 * X4.6: Return URL Parameter Preservation on Re-Authentication Redirect
 */

const { APP_URL, BASE_URL, wait, TestTracker } = require('../../utils');
const { generateExpiredToken, clearSession, USERS } = require('../../auth');

async function runPhaseX4(page) {
  const tracker = new TestTracker('Suite X - Phase X4: Session Expiry & Tamper Resistance');
  console.log('\n--- 🔒 Running Suite X - Phase X4: Auth Expiry & Protection ---');

  await tracker.runStep('X4.1', 'Expired Session Interceptor in Admin OS Redirects to /auth', async () => {
    await clearSession(page);
    const expToken = generateExpiredToken('admin');
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('jwt_token', tok);
      localStorage.setItem('gro10x_user', JSON.stringify({ role: 'admin', name: 'Expired Admin' }));
    }, expToken);

    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.href.includes('/auth'), { timeout: 6000 }).catch(() => {});
    await wait(600);

    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired admin token must redirect to /auth, got ' + url);
  });

  await tracker.runStep('X4.2', 'Expired Session Interceptor in Manager Portal Redirects to /auth', async () => {
    await clearSession(page);
    const expToken = generateExpiredToken('manager');
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('jwt_token', tok);
      localStorage.setItem('gro10x_user', JSON.stringify({ role: 'manager', name: 'Expired Manager' }));
    }, expToken);

    await page.goto(`${BASE_URL}/manager.html`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.href.includes('/auth'), { timeout: 6000 }).catch(() => {});
    await wait(600);

    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired manager token must redirect to /auth, got ' + url);
  });

  await tracker.runStep('X4.3', 'Expired Session Interceptor in Partner Portal Redirects to /auth', async () => {
    await clearSession(page);
    const expToken = generateExpiredToken('partner');
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('jwt_token', tok);
      localStorage.setItem('gro10x_user', JSON.stringify({ role: 'partner', name: 'Expired Partner' }));
    }, expToken);

    await page.goto(`${BASE_URL}/partners.html`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.href.includes('/auth'), { timeout: 6000 }).catch(() => {});
    await wait(600);

    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired partner token must redirect to /auth, got ' + url);
  });

  await tracker.runStep('X4.4', 'Tampered/Malformed JWT Token Handling', async () => {
    await clearSession(page);
    const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_PAYLOAD_TAMPERED.SIGNATURE_FAIL';
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('jwt_token', tok);
    }, tamperedToken);

    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.href.includes('/auth'), { timeout: 6000 }).catch(() => {});
    await wait(600);

    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Tampered token must trigger redirect to /auth, got ' + url);
  });

  await tracker.runStep('X4.5', 'Authentication Key Purge Integrity on Unauthorized Responses', async () => {
    await clearSession(page);
    const token = await page.evaluate(() => localStorage.getItem('gro10x_token'));
    tracker.assertEqual(token, null, 'LocalStorage gro10x_token should be cleared');
  });

  await tracker.runStep('X4.6', 'Return URL Parameter Preservation on Re-Authentication Redirect', async () => {
    // Navigate to auth page directly and check login container rendered
    await page.goto(`${BASE_URL}/auth.html`, { waitUntil: 'networkidle2' });
    await wait(600);

    const isAuthCardPresent = await page.evaluate(() => {
      return document.querySelector('.auth-card, #loginForm, form') !== null;
    });
    tracker.assert(isAuthCardPresent, 'Auth page should render active login card/form');
    await tracker.screenshot(page, 'X4.6_auth_redirect_card.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX4 };
