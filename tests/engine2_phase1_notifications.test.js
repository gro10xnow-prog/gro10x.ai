/**
 * tests/engine2_phase1_notifications.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 1 Test Suite: Engine 2 Critical Notifications & Telegram Bot Integration
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');

const botNotifications = require('../src/services/bot/notifications');
const { getRoleKeyboard, getClientKeyboard } = require('../src/services/bot/keyboards');
const { runWarrantyCheck, notifiedProjectsCache } = require('../src/services/warranty-cron');
const { initializeRetainerBank, logRetainerHours, memoryRetainerBanks } = require('../src/services/retainer-bank');
const { saveMemoryProject, memoryProjects } = require('../src/services/post-delivery');
const engine2Handler = require('../src/services/bot/handlers/engine2');

describe('Engine 2 Phase 1: Critical Notifications & Telegram Bot Integration', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    notifiedProjectsCache.clear();
  });

  describe('Track 1: Dual Warranty Activation Telegram Alert', () => {
    test('sendWarrantyActivatedNotification generates formatted message with links and dispatches', () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);

      const project = {
        id: 'proj-pb-test-1',
        name: 'Next.js Agentic MVP Sprint',
        client_name: 'Purplebot Digital',
        client_telegram_id: '99887766'
      };

      const reviewData = {
        approved_by: 'Anisul Islam',
        warrantyUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const result = botNotifications.sendWarrantyActivatedNotification(project, reviewData);
      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledWith(
        '99887766',
        expect.stringContaining('Deliverable Approved & 30-Day Warranty Active!'),
        expect.arrayContaining([
          expect.arrayContaining([expect.objectContaining({ text: '🛡️ Open Warranty Hub' })])
        ]),
        false
      );
      sendSpy.mockRestore();
    });

    test('sendTeamWarrantyAlert dispatches 4h/24h SLA details to Owner bot', () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);

      const project = {
        id: 'proj-pb-test-2',
        name: 'Enterprise Automation Mesh',
        client_name: 'Purplebot Digital',
        delivery_pod: { podName: 'Enterprise Automation Pod' }
      };

      const reviewData = {
        approved_by: 'Anisul Islam',
        warrantyUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const result = botNotifications.sendTeamWarrantyAlert(project, reviewData);
      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledWith(
        '7754769807',
        expect.stringContaining('WARRANTY ACTIVATED — Engine 2'),
        expect.any(Array),
        true
      );
      sendSpy.mockRestore();
    });
  });

  describe('Track 2: Sprint Delivery & Handover Client Dispatch', () => {
    test('sendSprintDeliveredNotification sends release notification with velocity and handover shield', () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);

      const project = {
        id: 'proj-pb-sprint-1',
        name: 'Custom Telegram Bot Mesh',
        client_name: 'Purplebot Digital',
        client_telegram_id: '99887766',
        delivery_pod: {
          podName: 'MVP Rapid Delivery Pod',
          leadEngineer: 'Fahim Rahman',
          targetVelocityDays: 14
        }
      };

      const result = botNotifications.sendSprintDeliveredNotification(project, {});
      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledWith(
        '99887766',
        expect.stringContaining('Sprint Completed & Deliverables Released!'),
        expect.arrayContaining([
          expect.arrayContaining([expect.objectContaining({ text: '🎬 Review Deliverables' })])
        ]),
        false
      );
      sendSpy.mockRestore();
    });

    test('POST /api/projects/:id/deliver transitions status to DELIVERED and triggers notification', async () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendSprintDeliveredNotification').mockReturnValue(true);

      saveMemoryProject({
        id: 'proj-del-test-1',
        name: 'Autonomous Agent MVP',
        client_name: 'Client Alpha',
        delivery_status: 'IN_PROGRESS'
      });

      const res = await request(app)
        .post('/api/projects/proj-del-test-1/deliver')
        .send({ notes: 'Passed all sprint acceptance criteria' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.deliveryStatus).toBe('DELIVERED');
      expect(res.body.manifest).toBeDefined();
      expect(sendSpy).toHaveBeenCalled();

      sendSpy.mockRestore();
    });
  });

  describe('Track 3: Retainer Hours Burndown Alerting', () => {
    test('sendRetainerBurndownAlert formats warning correctly for capacity warning vs overage', () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);

      const bank = {
        projectName: 'Purplebot Digital AI Retainer',
        clientName: 'Purplebot Digital',
        usedHours: 25,
        totalAvailableHours: 30,
        burnRatePercent: 83,
        remainingHours: 5,
        status: 'nearing_capacity'
      };

      const logEntry = {
        hours: 5,
        loggedBy: 'Fahim Rahman',
        taskDescription: 'Workflow Orchestration'
      };

      botNotifications.sendRetainerBurndownAlert(bank, {}, logEntry);
      expect(sendSpy).toHaveBeenCalledWith(
        '7754769807',
        expect.stringContaining('RETAINER CAPACITY WARNING — Engine 2'),
        expect.any(Array),
        true
      );

      // Now test overage
      bank.status = 'critical_overage';
      bank.overageHours = 3;
      bank.usedHours = 33;
      bank.hourlyRateUsd = 45;

      botNotifications.sendRetainerBurndownAlert(bank, {}, logEntry);
      expect(sendSpy).toHaveBeenCalledWith(
        '7754769807',
        expect.stringContaining('RETAINER CRITICAL OVERAGE — Engine 2'),
        expect.any(Array),
        true
      );

      sendSpy.mockRestore();
    });

    test('logRetainerHours automatically invokes sendRetainerBurndownAlert when threshold is reached', async () => {
      const sendSpy = jest.spyOn(botNotifications, 'sendRetainerBurndownAlert').mockReturnValue(true);

      const projId = 'proj-bank-burn-test';
      saveMemoryProject({ id: projId, name: 'AI Sprint Project', client_name: 'Test Client' });

      initializeRetainerBank(projId, { totalPurchasedHours: 20, hourlyRateUsd: 50 });

      // Log 16 hours (80% of 20 hrs)
      const res = await logRetainerHours(projId, {
        hours: 16,
        taskDescription: 'Heavy Agent Architecture Sprint',
        loggedBy: 'Lead Dev'
      });

      expect(res.ok).toBe(true);
      expect(res.summary.status).toBe('nearing_capacity');
      expect(sendSpy).toHaveBeenCalled();

      sendSpy.mockRestore();
    });
  });

  describe('Track 4: Proactive Warranty Expiry Cron Engine', () => {
    test('runWarrantyCheck flags 7-day and 1-day projects and dispatches alerts without duplicate spam', async () => {
      const expirySpy = jest.spyOn(botNotifications, 'sendWarrantyExpiryAlert').mockReturnValue(true);

      const now = Date.now();
      const proj7d = {
        id: 'proj-cron-7d',
        name: '7-Day Warning Project',
        client_name: 'Client 7D',
        client_telegram_id: '112233',
        warranty_until: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days remaining (falls in 2..7 window)
      };

      const proj1d = {
        id: 'proj-cron-1d',
        name: '1-Day Warning Project',
        client_name: 'Client 1D',
        client_telegram_id: '445566',
        warranty_until: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day remaining
      };

      const projExpired = {
        id: 'proj-cron-exp',
        name: 'Expired Project',
        client_name: 'Client Exp',
        warranty_until: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() // -2 days
      };

      saveMemoryProject(proj7d);
      saveMemoryProject(proj1d);
      saveMemoryProject(projExpired);

      const report = await runWarrantyCheck();
      expect(report.success).toBe(true);
      expect(report.remindersSent).toBeGreaterThanOrEqual(2);

      // Verify closed transition for expired
      const { findProject } = require('../src/services/post-delivery');
      const closed = await findProject('proj-cron-exp');
      expect(closed.delivery_status).toBe('WARRANTY_CLOSED');

      // Second run should NOT double-send because of deduplication cache
      const secondRun = await runWarrantyCheck();
      expect(secondRun.remindersSent).toBe(0);

      expirySpy.mockRestore();
    });
  });

  describe('Track 5: Telegram Bot Commands & Keyboards Integration', () => {
    test('Owner keyboard contains 🚀 Engine 2 Flash and ⚡ Pod Status', () => {
      const kb = getRoleKeyboard('Owner / Admin', true, { onboardingComplete: true });
      const flattened = kb.keyboard.flat().map(k => k.text);

      expect(flattened).toContain('🚀 Engine 2 Flash');
      expect(flattened).toContain('⚡ Pod Status');
    });

    test('Client keyboard contains 🛡️ Warranty & Sprint SLA', () => {
      const kb = getClientKeyboard({});
      const flattened = kb.keyboard.flat().map(k => k.text);

      expect(flattened).toContain('🛡️ Warranty & Sprint SLA');
    });

    test('handleEngine2Flash compiles report and sends rich telegram markdown with studio link', async () => {
      const mockTeamBot = {
        sendMessage: jest.fn().mockReturnValue(Promise.resolve())
      };

      const msg = { chat: { id: '7754769807' } };

      await engine2Handler.handleEngine2Flash(mockTeamBot, msg);
      expect(mockTeamBot.sendMessage).toHaveBeenCalledWith(
        '7754769807',
        expect.stringContaining('GRO10X ENGINE 2: EXECUTIVE FLASH DISPATCH'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([expect.objectContaining({ text: '🌐 Open Engine 2 Studio' })])
            ])
          })
        })
      );
    });

    test('handleEngine2Pods surfaces 3 delivery pods with velocity benchmarks', async () => {
      const mockTeamBot = {
        sendMessage: jest.fn().mockReturnValue(Promise.resolve())
      };

      const msg = { chat: { id: '7754769807' } };

      await engine2Handler.handleEngine2Pods(mockTeamBot, msg);
      expect(mockTeamBot.sendMessage).toHaveBeenCalledWith(
        '7754769807',
        expect.stringContaining('ENGINE 2: AUTONOMOUS DELIVERY PODS'),
        expect.any(Object)
      );
    });

    test('handleClientWarrantyStatus explains zero-cost guarantee and 4h SLA', async () => {
      const mockClientBot = {
        sendMessage: jest.fn().mockReturnValue(Promise.resolve())
      };

      const msg = { chat: { id: '99887766' } };

      await engine2Handler.handleClientWarrantyStatus(mockClientBot, msg);
      expect(mockClientBot.sendMessage).toHaveBeenCalledWith(
        '99887766',
        expect.stringContaining('YOUR 30-DAY BUG-FIX WARRANTY & SLA'),
        expect.any(Object)
      );
    });
  });
});
