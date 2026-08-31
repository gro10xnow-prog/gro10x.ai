/**
 * scripts/e2e-client/auth.js
 * Client Stakeholder Session & JWT Generator for E2E Browser Testing
 */
const { signToken } = require('../../src/services/jwt');

const CLIENT_USER = {
  id: 'CLI-0001',
  client_id: 'CLI-0001',
  linkedId: 'CLI-0001',
  name: 'Chillox Fast Food Chain',
  company: 'Chillox Fast Food Chain',
  phone: '01708459008',
  role: 'Client',
  access_level: 'Client Partner',
  type: 'client',
  linkedType: 'client',
  pocRole: 'Brand Marketing Lead'
};

function generateClientToken(customUser = {}) {
  const merged = { ...CLIENT_USER, ...customUser };
  return signToken(merged);
}

async function injectClientSession(page, customUser = {}) {
  const user = { ...CLIENT_USER, ...customUser };
  const token = generateClientToken(user);

  await page.evaluate(({ token, user }) => {
    localStorage.setItem('gro10x_token', token);
    localStorage.setItem('gro10x_token', token);
    localStorage.setItem('gro10x_token', token);
    localStorage.setItem('purple_user', JSON.stringify(user));
    localStorage.setItem('purple_user_phone', user.phone);
    localStorage.setItem('purple_user_name', user.name);
    localStorage.setItem('purple_user_role', user.role);
    localStorage.setItem('purple_user_access', user.access_level);
    sessionStorage.setItem('jwt_token', token);
  }, { token, user });

  return { token, user };
}

async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.removeItem('gro10x_token');
    localStorage.removeItem('gro10x_token');
    localStorage.removeItem('gro10x_token');
    localStorage.removeItem('purple_user');
    localStorage.removeItem('purple_user_phone');
    localStorage.removeItem('purple_user_name');
    localStorage.removeItem('purple_user_role');
    localStorage.removeItem('purple_user_access');
    sessionStorage.removeItem('jwt_token');
  });
}

module.exports = {
  CLIENT_USER,
  generateClientToken,
  injectClientSession,
  clearSession
};
