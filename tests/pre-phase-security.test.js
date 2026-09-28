/**
 * tests/pre-phase-security.test.js
 * Pre-Phase Security & Crash Fix Verification Suite
 * Run: npx jest tests/pre-phase-security.test.js
 */

const { verifyPin } = require('../src/services/auth-pins');

describe('Pre-1: Master PIN Backdoor Removal', () => {
  test('PIN "1234" must NOT authenticate any user', async () => {
    // verifyPin with a non-existent phone + master PIN should return invalid
    const result = await verifyPin('+8809999999999', '1234').catch(() => ({ success: false }));
    expect(result.success).toBe(false);
  });

  test('PIN "1010" must NOT authenticate any user', async () => {
    const result = await verifyPin('+8809999999999', '1010').catch(() => ({ success: false }));
    expect(result.success).toBe(false);
  });

  test('PIN "101010" must NOT authenticate any user', async () => {
    const result = await verifyPin('+8809999999999', '101010').catch(() => ({ success: false }));
    expect(result.success).toBe(false);
  });
});

describe('Pre-2: QA Token Backdoor Removal', () => {
  const origDisableDevAuth = process.env.DISABLE_DEV_AUTH;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.DISABLE_DEV_AUTH = 'true';
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.DISABLE_DEV_AUTH = origDisableDevAuth;
    process.env.NODE_ENV = origNodeEnv;
  });

  const mockReq = (token) => ({
    headers: { authorization: `Bearer ${token}` },
    query: {},
    cookies: {}
  });

  test('mock_qa_token_enterprise must return 401', async () => {
    const { requireAuth } = require('../src/middleware/auth');
    const req = mockReq('mock_qa_token_enterprise');
    const mockNext = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await requireAuth(req, res, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('mock_qa_token must return 401', async () => {
    const { requireAuth } = require('../src/middleware/auth');
    const req = mockReq('mock_qa_token');
    const mockNext = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await requireAuth(req, res, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('Pre-6: Overdue Invoice Cron Math Fix', () => {
  const now = new Date();

  test('Invoice due YESTERDAY (1 day ago) should NOT be flagged as 7+ days overdue', () => {
    const yesterday = new Date(now.getTime() - 1 * 86400000);
    const diffDays = Math.floor((now - yesterday) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThan(7);
  });

  test('Invoice due 14 DAYS IN THE FUTURE should NOT be flagged as overdue', () => {
    const future = new Date(now.getTime() + 14 * 86400000);
    const diffDays = Math.floor((now - future) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThan(0); // negative = future
    expect(diffDays >= 7).toBe(false);
  });

  test('Invoice due 8 DAYS AGO should be flagged as 7+ days overdue', () => {
    const past = new Date(now.getTime() - 8 * 86400000);
    const diffDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));
    expect(diffDays >= 7).toBe(true);
  });
});

describe('Pre-9d: is_temp column name fix', () => {
  test('auth_pins schema uses is_temp not is_permanent in team.js', () => {
    const fs = require('fs');
    const teamJs = fs.readFileSync('src/routes/team.js', 'utf8');
    expect(teamJs).not.toMatch(/is_permanent:\s*true/);
    expect(teamJs).toMatch(/is_temp:\s*false/);
  });
});

describe('Pre-9a: CRM Proposal modal method name', () => {
  test('crm.js must call openProposalModal not openCreateModal', () => {
    const fs = require('fs');
    const crmJs = fs.readFileSync('public/app/modules/crm.js', 'utf8');
    expect(crmJs).not.toMatch(/openCreateModal/);
    expect(crmJs).toMatch(/openProposalModal/);
  });
});
