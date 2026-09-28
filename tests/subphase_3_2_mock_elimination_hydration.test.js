/**
 * tests/subphase_3_2_mock_elimination_hydration.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.2 Test Suite: Elimination of Mock/Hardcoded Fallbacks
 *
 * Verifies:
 * 1. Zero occurrences of proj-purplebot-01, Fahim Rahman, Tasin Kabir across client modules
 * 2. Zero Native Dialogs in public/client/modules/account.js (0 alert, confirm, prompt)
 * 3. Home module empty state & brief kickoff CTA when no projects active
 * 4. Retainer module dynamic quotas & elimination of hardcoded mock hours
 * 5. GET /api/clients/me returns accountManagerDetails, retainerHours & flattened properties
 * 6. Account module dynamic AM resolution with verified executive desk fallback
 * 7. Static Zero-Leakage: Zero instances of banned phone (1708) in client modules and clients.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('🚀 Sub-Phase 3.2: Elimination of Mock/Hardcoded Fallbacks in Home, Retainer & Account', () => {

  const testClientToken = signToken({
    userId: 'CLI-PURPLE-001',
    name: 'Purplebot Digital',
    company: 'Purplebot Digital',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-PURPLE-001'
  });

  const homeJsPath = path.join(__dirname, '../public/client/modules/home.js');
  const retainerJsPath = path.join(__dirname, '../public/client/modules/retainer.js');
  const accountJsPath = path.join(__dirname, '../public/client/modules/account.js');
  const clientsRoutePath = path.join(__dirname, '../src/routes/clients.js');

  test('1. Static Purge: Zero occurrences of proj-purplebot-01, Fahim Rahman, and Tasin Kabir in client modules', () => {
    const homeContent = fs.readFileSync(homeJsPath, 'utf8');
    const retainerContent = fs.readFileSync(retainerJsPath, 'utf8');
    const accountContent = fs.readFileSync(accountJsPath, 'utf8');

    const bannedKeywords = ['proj-purplebot-01', 'Fahim Rahman', 'Tasin Kabir'];

    bannedKeywords.forEach(kw => {
      expect(homeContent).not.toContain(kw);
      expect(retainerContent).not.toContain(kw);
      expect(accountContent).not.toContain(kw);
    });
  });

  test('2. Zero Native Dialogs: account.js contains zero alert(), confirm(), or prompt() calls', () => {
    const content = fs.readFileSync(accountJsPath, 'utf8');
    const alertMatches = content.match(/\balert\s*\(/g) || [];
    const confirmMatches = content.match(/\bconfirm\s*\(/g) || [];
    const promptMatches = content.match(/\bprompt\s*\(/g) || [];

    expect(alertMatches.length).toBe(0);
    expect(confirmMatches.length).toBe(0);
    expect(promptMatches.length).toBe(0);
  });

  test('3. Home module renders elegant empty state with #brief kickoff CTA when project list is empty', () => {
    const content = fs.readFileSync(homeJsPath, 'utf8');
    expect(content).toContain('No Active Delivery Sprints Yet');
    expect(content).toContain('Kick Off Your First Sprint');
    expect(content).toContain('href="#brief"');
    expect(content).toContain('msaUrl');
  });

  test('4. Retainer module dynamically derives quotas and contains zero fake hardcoded logs', () => {
    const content = fs.readFileSync(retainerJsPath, 'utf8');
    expect(content).not.toContain('usedHours: 25');
    expect(content).not.toContain('burnRatePercent: 83');
    expect(content).not.toContain('Handover Shield & Multi-day Invoicing Architecture');
    expect(content).toContain('approvedReels');
    expect(content).toContain('approvedStatics');
    expect(content).toContain('agreedQuota');
  });

  test('5. GET /api/clients/me returns accountManagerDetails, retainerHours, and flattened profile', async () => {
    const res = await request(app)
      .get('/api/clients/me')
      .set('Authorization', `Bearer ${testClientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client).toBeDefined();
    expect(res.body.id).toBeDefined();
    expect(res.body.accountManagerDetails).toBeDefined();
    expect(res.body.accountManagerDetails.name).toBeDefined();
    expect(res.body.accountManagerDetails.phone).toBeDefined();
    expect(res.body.retainerHours).toBeDefined();
  });

  test('6. Account module dynamically resolves Account Manager with verified executive desk fallback', () => {
    const content = fs.readFileSync(accountJsPath, 'utf8');
    expect(content).toContain('CLIENT_API.get(\'/team\')');
    expect(content).toContain('amDetails');
    expect(content).toContain('GRO10X Executive Desk');
  });

  test('7. Static Zero-Leakage: Zero instances of banned phone (1708) in client modules and clients.js', () => {
    const homeContent = fs.readFileSync(homeJsPath, 'utf8');
    const retainerContent = fs.readFileSync(retainerJsPath, 'utf8');
    const accountContent = fs.readFileSync(accountJsPath, 'utf8');
    const clientsContent = fs.readFileSync(clientsRoutePath, 'utf8');

    expect(homeContent).not.toContain('1708');
    expect(retainerContent).not.toContain('1708');
    expect(accountContent).not.toContain('1708');
    expect(clientsContent).not.toContain('1708');
  });
});
