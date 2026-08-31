/**
 * scripts/e2e/auth.js
 * Session & JWT Generator for Multi-Stakeholder E2E Browser Testing
 */
const { signToken } = require('../../src/services/jwt');

const USERS = {
  owner: {
    id: 'PBD-001',
    emp_code: 'PBD-001',
    name: 'Iftekhar Mahmud',
    phone: '+8801708459008',
    role: 'Managing Director',
    access_level: 'Owner',
    type: 'team'
  },
  admin: {
    id: 'PBD-004',
    emp_code: 'PBD-004',
    name: 'Md. Zahin Khandaker',
    phone: '01708459008',
    role: 'Tech Admin',
    access_level: 'Technology Admin',
    type: 'team'
  },
  finance: {
    id: 'PBD-029',
    emp_code: 'PBD-029',
    name: 'Borhan Siddique',
    phone: '+8801711223344',
    role: 'Finance Manager',
    access_level: 'Finance Manager',
    type: 'team'
  },
  manager: {
    id: 'PBD-005',
    emp_code: 'PBD-005',
    name: 'Creative Director',
    phone: '+8801711223355',
    role: 'Creative Director',
    access_level: 'Department Manager',
    department: 'Post Production',
    type: 'team'
  },
  specialist: {
    id: 'PBD-003',
    emp_code: 'PBD-003',
    name: 'Jayed Hasan',
    phone: '+8801711223366',
    role: 'Lead Video Editor',
    access_level: 'Specialist / Crew',
    department: 'Post Production',
    type: 'team'
  },
  client: {
    id: 'CLI-001',
    name: 'Apex Footwear',
    email: 'brand@apexfootwear.com',
    role: 'Client Partner',
    access_level: 'Client',
    type: 'client'
  },
  partner: {
    id: 'CLI-001',
    name: 'Apex Footwear',
    email: 'brand@apexfootwear.com',
    role: 'Client Partner',
    access_level: 'Client',
    type: 'client'
  }
};

function generateTokenForRole(role = 'admin', customExpiry = 7 * 24 * 60 * 60) {
  const user = USERS[role] || USERS.admin;
  return signToken(user, customExpiry);
}

function generateAdminToken() {
  return generateTokenForRole('admin');
}

function generateExpiredToken(role = 'admin') {
  const user = USERS[role] || USERS.admin;
  return signToken(user, -3600); // 1 hour in the past
}

async function injectRoleSession(page, role = 'admin') {
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.startsWith('http')) {
    const { BASE_URL } = require('./utils');
    await page.goto(BASE_URL + '/auth.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  const token = generateTokenForRole(role);
  const user = USERS[role] || USERS.admin;
  await page.evaluate(({ token, user }) => {
    try {
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('purple_user', JSON.stringify(user));
      sessionStorage.setItem('jwt_token', token);
      sessionStorage.setItem('gro10x_token', token);
    } catch (e) {}
  }, { token, user });
  return token;
}

async function injectAdminSession(page) {
  return injectRoleSession(page, 'owner');
}

async function clearSession(page) {
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.startsWith('http')) {
    const { BASE_URL } = require('./utils');
    await page.goto(BASE_URL + '/auth.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  });
}

module.exports = {
  USERS,
  generateTokenForRole,
  generateAdminToken,
  generateExpiredToken,
  injectRoleSession,
  injectAdminSession,
  clearSession
};

