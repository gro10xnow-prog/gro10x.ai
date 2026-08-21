/**
 * scripts/e2e/auth.js
 * Session & JWT Generator for E2E Browser Testing
 */
const { signToken } = require('../../src/services/jwt');

const ADMIN_USER = {
  id: 'PBD-004',
  emp_code: 'PBD-004',
  name: 'Md. Zahin Khandaker',
  phone: '01708459008',
  role: 'Tech Admin',
  access_level: 'Technology Admin',
  type: 'team'
};

function generateAdminToken() {
  return signToken(ADMIN_USER);
}

async function injectAdminSession(page) {
  const token = generateAdminToken();
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('sb-access-token', token);
    localStorage.setItem('purpleos_pin_token', token);
    localStorage.setItem('purple_token', token);
    localStorage.setItem('purple_user', JSON.stringify(user));
  }, { token, user: ADMIN_USER });
  return token;
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('purpleos_pin_token');
    localStorage.removeItem('purple_token');
    localStorage.removeItem('purple_user');
  });
}

module.exports = {
  ADMIN_USER,
  generateAdminToken,
  injectAdminSession,
  clearSession
};
