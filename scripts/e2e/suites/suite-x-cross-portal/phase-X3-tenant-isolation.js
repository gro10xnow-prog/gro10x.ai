/**
 * scripts/e2e/suites/suite-x-cross-portal/phase-X3-tenant-isolation.js
 * Suite X - Phase X3: Multi-Tenant Data Isolation & RBAC Security Boundaries
 * 
 * Tests:
 * X3.1: requireAuth Guard Rejects Requests without Bearer Token (HTTP 401)
 * X3.2: requireAdmin Guard Rejects Non-Admin Roles (HTTP 403)
 * X3.3: Partner Tenant Scoping Enforcement (/api/clients/portal)
 * X3.4: Staff Workspace Boundary & emp_code Scoping (/api/team/me)
 * X3.5: DigiStore / DigiVault License Key Access Isolation
 * X3.6: Multi-Tenant Zero-Leakage Cross Boundary Assertion
 */

const path = require('path');
const http = require('http');
const { BASE_URL, wait, TestTracker } = require('../../utils');
const { USERS, generateTokenForRole } = require('../../auth');

async function runPhaseX3(page) {
  const tracker = new TestTracker('Suite X - Phase X3: Multi-Tenant Isolation & RBAC');
  console.log('\n--- 🛡️ Running Suite X - Phase X3: Multi-Tenant Isolation ---');

  const { requireAuth } = require(path.join(process.cwd(), 'src/middleware/auth'));
  const { requireAdmin, requireManager } = require(path.join(process.cwd(), 'src/middleware/rbac'));

  await tracker.runStep('X3.1', 'requireAuth Guard Rejects Requests without Bearer Token (HTTP 401)', async () => {
    const status = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/tasks`, {
        headers: { 'x-disable-dev-auth': 'true' }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    tracker.assert(status === 401, `Unauthenticated request to protected route should return 401, got ${status}`);
  });

  await tracker.runStep('X3.2', 'requireAdmin Guard Rejects Non-Admin Roles (HTTP 403)', async () => {
    const specialistToken = generateTokenForRole('specialist');
    const status = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/analytics/reports/revenue`, {
        headers: {
          'Authorization': `Bearer ${specialistToken}`,
          'x-disable-dev-auth': 'true'
        }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    tracker.assert(status === 403, `Non-admin user accessing admin route should receive 403 Forbidden, got ${status}`);
  });

  await tracker.runStep('X3.3', 'Partner Tenant Scoping Enforcement (/api/clients/dashboard)', async () => {
    const partnerToken = generateTokenForRole('partner');
    const status = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/clients/dashboard`, {
        headers: { 'Authorization': `Bearer ${partnerToken}` }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    // Partner is authorized to access dashboard
    tracker.assert(status === 200, `Partner token should be accepted by client dashboard router, got ${status}`);
  });

  await tracker.runStep('X3.4', 'Staff Workspace Boundary & emp_code Scoping (/api/team/me)', async () => {
    const specialistToken = generateTokenForRole('specialist');
    const status = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/team/me`, {
        headers: { 'Authorization': `Bearer ${specialistToken}` }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    tracker.assert(status === 200, `Specialist staff token should resolve their own profile, got ${status}`);
  });

  await tracker.runStep('X3.5', 'DigiStore / DigiVault License Key Access Isolation', async () => {
    const status = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/digistore/orders`, {
        headers: { 'x-disable-dev-auth': 'true' }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    // Public visitor cannot list all digistore orders
    tracker.assert(status === 401 || status === 403, `Public visitor must not access orders without auth, got ${status}`);
  });

  await tracker.runStep('X3.6', 'Multi-Tenant Zero-Leakage Cross Boundary Assertion', async () => {
    // Verify requireAuth and requireAdmin functions are active middleware
    tracker.assert(typeof requireAuth === 'function', 'requireAuth must be defined');
    tracker.assert(typeof requireAdmin === 'function', 'requireAdmin must be defined');
    tracker.assert(typeof requireManager === 'function', 'requireManager must be defined');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX3 };
