/**
 * Suite X - Phase X4: Session Expiry Interception & Redirect
 */
const { APP_URL, BASE_URL, wait, TestTracker } = require('../../utils');
const { generateExpiredToken } = require('../../auth');

async function runPhaseX4(page) {
  const tracker = new TestTracker('Suite X - Phase X4: Session Expiry Handling');
  console.log('\n--- ?? Running Suite X - Phase X4: Auth Expiry ---');

  await tracker.runStep('X4.1', 'Expired Session Interceptor Redirects to /auth', async () => {
    await page.goto(BASE_URL + '/auth.html', { waitUntil: 'domcontentloaded' });
    const expToken = generateExpiredToken('admin');
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('gro10x_token', tok);
    }, expToken);
    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await wait(1200);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired token must redirect to /auth');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX4 };
