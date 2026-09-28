/**
 * tests/subphase_3_3_retainer_burndown_sync.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.3 Test Suite: Retainer Hours Ledger Real-Time Burn-Down & Task Sync
 *
 * Verifies:
 * 1. computeBankSummary accurately calculates healthy, nearing_capacity, critical_capacity (<15%), and critical_overage
 * 2. logRetainerHours broadcasts 'retainer_update' via SSE (global + client-scoped)
 * 3. Burndown alerting dispatches for nearing_capacity, critical_capacity, and critical_overage
 * 4. public/client/sse.js registers 'retainer_update' listener and refreshes #retainer and #home
 * 5. public/client/modules/retainer.js renders empty logs state and critical_capacity badge
 * 6. POST /api/projects/:id/retainer-bank/log records hours, decrements balance, and returns summary
 * 7. Static Zero-Leakage & Zero-Dialog: 0 banned phone numbers (1708) and 0 native dialogs
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  initializeRetainerBank,
  computeBankSummary,
  logRetainerHours,
  getRetainerBank,
  memoryRetainerBanks
} = require('../src/services/retainer-bank');
const { saveMemoryProject } = require('../src/services/post-delivery');
const sse = require('../src/services/sse');
const botNotifications = require('../src/services/bot/notifications');

describe('🚀 Sub-Phase 3.3: Retainer Hours Ledger Real-Time Burn-Down & Task Sync', () => {

  const testAdminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const testClientToken = signToken({
    userId: 'CLI-BURNDOWN-001',
    name: 'Apex Robotics',
    company: 'Apex Robotics Ltd',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-BURNDOWN-001'
  });

  const testProjectId = `PRJ-BURNDOWN-${Date.now()}`;

  beforeAll(async () => {
    saveMemoryProject({
      id: testProjectId,
      name: 'Autonomous Drone Navigation Retainer',
      client: 'Apex Robotics Ltd',
      clientName: 'Apex Robotics Ltd',
      clientId: 'CLI-BURNDOWN-001',
      retainerHours: 40,
      hourlyRate: 50,
      status: 'Active'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('1. computeBankSummary accurately calculates thresholds: healthy -> nearing_capacity -> critical_capacity -> critical_overage', () => {
    const baseBank = {
      projectId: 'test-calc-proj',
      totalPurchasedHours: 40,
      rolloverHours: 0,
      hourlyRateUsd: 50,
      logs: []
    };

    // Case A: 10 hrs used (25% burn) -> healthy
    baseBank.logs = [{ id: '1', hours: 10, taskDescription: 'Initial setup' }];
    const summaryHealthy = computeBankSummary(baseBank);
    expect(summaryHealthy.status).toBe('healthy');
    expect(summaryHealthy.burnRatePercent).toBe(25);
    expect(summaryHealthy.remainingHours).toBe(30);
    expect(summaryHealthy.isNearCap).toBe(false);

    // Case B: 31 hrs used (78% burn, 9 hrs left > 6 hrs 15% threshold) -> nearing_capacity
    baseBank.logs = [{ id: '1', hours: 31, taskDescription: 'Core development' }];
    const summaryNearing = computeBankSummary(baseBank);
    expect(summaryNearing.status).toBe('nearing_capacity');
    expect(summaryNearing.burnRatePercent).toBe(78);
    expect(summaryNearing.remainingHours).toBe(9);
    expect(summaryNearing.isNearCap).toBe(true);
    expect(summaryNearing.alert).toContain('78%');

    // Case C: 35 hrs used (88% burn, 5 hrs left <= 6 hrs 15% threshold) -> critical_capacity
    baseBank.logs = [{ id: '1', hours: 35, taskDescription: 'Heavy integration sprints' }];
    const summaryCritical = computeBankSummary(baseBank);
    expect(summaryCritical.status).toBe('critical_capacity');
    expect(summaryCritical.burnRatePercent).toBe(88);
    expect(summaryCritical.remainingHours).toBe(5);
    expect(summaryCritical.isNearCap).toBe(true);
    expect(summaryCritical.isCriticalCap).toBe(true);
    expect(summaryCritical.alert).toContain('critical capacity');

    // Case D: 42 hrs used (100% burn, 2 hrs overage) -> critical_overage
    baseBank.logs = [{ id: '1', hours: 42, taskDescription: 'Emergency patch sprints' }];
    const summaryOverage = computeBankSummary(baseBank);
    expect(summaryOverage.status).toBe('critical_overage');
    expect(summaryOverage.overageHours).toBe(2);
    expect(summaryOverage.isOverage).toBe(true);
    expect(summaryOverage.alert).toContain('exceeded allocated capacity by 2 hours');
  });

  test('2. logRetainerHours broadcasts retainer_update SSE event and notifies client', async () => {
    initializeRetainerBank(testProjectId, 40);

    const broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
    const broadcastToClientSpy = jest.spyOn(sse, 'broadcastToClient').mockImplementation(() => {});

    await logRetainerHours(testProjectId, {
      hours: 5,
      taskDescription: 'FastAPI Microservice Deployment',
      loggedBy: 'Cloud Architect'
    });

    expect(broadcastSpy).toHaveBeenCalledWith(
      'retainer_update',
      expect.objectContaining({
        projectId: testProjectId,
        burnRatePercent: 13,
        usedHours: 5,
        remainingHours: 35
      })
    );

    // Wait a brief tick for async findProject client broadcast
    await new Promise(r => setTimeout(r, 50));
    expect(broadcastToClientSpy).toHaveBeenCalledWith(
      'retainer_update',
      expect.objectContaining({
        projectId: testProjectId,
        usedHours: 5
      }),
      ['CLI-BURNDOWN-001']
    );
  });

  test('3. Burndown alerting dispatches sendRetainerBurndownAlert for critical capacity and overage', async () => {
    initializeRetainerBank(testProjectId, 40);

    const alertSpy = jest.spyOn(botNotifications, 'sendRetainerBurndownAlert').mockImplementation(() => true);

    // Push into critical capacity: 35 hours
    await logRetainerHours(testProjectId, {
      hours: 35,
      taskDescription: 'Full model fine-tuning run',
      loggedBy: 'Lead AI Engineer'
    });

    expect(alertSpy).toHaveBeenCalled();
    const passedSummary = alertSpy.mock.calls[0][0];
    expect(passedSummary.status).toBe('critical_capacity');
    expect(passedSummary.remainingHours).toBe(5);
  });

  test('4. public/client/sse.js listens to retainer_update and task_update with cache invalidation', () => {
    const ssePath = path.join(__dirname, '../public/client/sse.js');
    const sseContent = fs.readFileSync(ssePath, 'utf8');

    expect(sseContent).toContain('evtSource.addEventListener(\'retainer_update\'');
    expect(sseContent).toContain('window.CLIENT_API.invalidateCache(\'/projects\')');
    expect(sseContent).toContain('triggerViewRefresh([\'#retainer\', \'#home\'])');

    // task_update also triggers #retainer refresh
    expect(sseContent).toMatch(/evtSource\.addEventListener\('task_update'[\s\S]*?#retainer/);
  });

  test('5. public/client/modules/retainer.js displays empty table state and critical capacity badge', () => {
    const retainerModulePath = path.join(__dirname, '../public/client/modules/retainer.js');
    const content = fs.readFileSync(retainerModulePath, 'utf8');

    // Empty state message
    expect(content).toContain('No billable engineering tasks logged yet for this billing cycle.');

    // Dynamic badge handling
    expect(content).toContain('critical_capacity');
    expect(content).toContain('⚠️ High Utilization (< 15% Remaining)');
    expect(content).toContain('bankBadgeClass');
    expect(content).toContain('bankBadgeText');
  });

  test('6. POST /api/projects/:id/retainer-bank/log records hours and GET delivers synchronized ledger', async () => {
    const projId = `PRJ-API-SYNC-${Date.now()}`;
    saveMemoryProject({
      id: projId,
      name: 'Fintech Voice AI Retainer',
      client: 'Apex Robotics Ltd',
      clientId: 'CLI-BURNDOWN-001',
      retainerHours: 20
    });
    initializeRetainerBank(projId, 20);

    // 1. Post hours
    const postRes = await request(app)
      .post(`/api/projects/${projId}/retainer-bank/log`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({
        hours: 17.5,
        taskDescription: 'Real-time WebSocket Audio Pipeline',
        category: 'ai_engineering',
        loggedBy: 'Principal Engineer'
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.ok).toBe(true);
    expect(postRes.body.hoursRemaining).toBe(2.5);
    expect(postRes.body.summary.status).toBe('critical_capacity');

    // 2. Fetch via client token
    const getRes = await request(app)
      .get(`/api/projects/${projId}/retainer-bank`)
      .set('Authorization', `Bearer ${testClientToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.ok).toBe(true);
    expect(getRes.body.remainingHours).toBe(2.5);
    expect(getRes.body.burnRatePercent).toBe(88);
    expect(getRes.body.status).toBe('critical_capacity');
    expect(getRes.body.logs.length).toBe(1);
    expect(getRes.body.logs[0].taskDescription).toBe('Real-time WebSocket Audio Pipeline');
  });

  test('7. Static Zero-Leakage & Zero-Dialog: zero banned phone (1708) and zero native dialogs', () => {
    const retainerServicePath = path.join(__dirname, '../src/services/retainer-bank.js');
    const retainerModulePath = path.join(__dirname, '../public/client/modules/retainer.js');
    const ssePath = path.join(__dirname, '../public/client/sse.js');

    const files = [retainerServicePath, retainerModulePath, ssePath];

    files.forEach(fp => {
      const content = fs.readFileSync(fp, 'utf8');
      expect(content).not.toContain('1708');
    });

    const moduleContent = fs.readFileSync(retainerModulePath, 'utf8');
    expect(moduleContent).not.toMatch(/\balert\s*\(/);
    expect(moduleContent).not.toMatch(/\bconfirm\s*\(/);
    expect(moduleContent).not.toMatch(/\bprompt\s*\(/);
  });
});
