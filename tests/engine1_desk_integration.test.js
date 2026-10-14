/**
 * tests/engine1_desk_integration.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete Jest Integration Test Suite for Engine 1 Desk (GRO10X OS v2.0)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const { signToken } = require('../src/services/jwt');

// Ensure test environment
process.env.NODE_ENV = 'test';

let app;
let adminToken;

beforeAll(() => {
  // Load server instance first to ensure env initialization
  app = require('../server');
  // Generate admin authorization token with Tier 3 seniority
  adminToken = signToken({
    id: 'emp_admin_001',
    name: 'Firoz Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    emp_code: 'GRO-001'
  });
});

describe('🤖 Engine 1 Desk: Comprehensive Backend & Cockpit Integration', () => {

  describe('1. Live Telemetry & 5 KPI Cards', () => {
    test('GET /api/chat/telemetry returns all 5 top KPI metrics', async () => {
      const res = await request(app)
        .get('/api/chat/telemetry')
        .expect(200);

      expect(res.body.ok).toBe(true);
      const kpis = res.body.data.kpis;
      expect(typeof kpis.activeConversations).toBe('number');
      expect(typeof kpis.waitingHumanTriage).toBe('number');
      expect(typeof kpis.resolvedByAiPercent).toBe('number');
      expect(typeof kpis.handoffsToday).toBe('number');
      expect(typeof kpis.avgCsat).toBe('number');
      expect(kpis.avgCsat).toBeGreaterThanOrEqual(1.0);
      expect(kpis.avgCsat).toBeLessThanOrEqual(5.0);

      // Verify channels and spend limits
      expect(res.body.data.channels).toHaveProperty('web');
      expect(res.body.data.channels).toHaveProperty('telegram');
      expect(res.body.data.channels).toHaveProperty('whatsapp');
      expect(res.body.data.spendingLimits).toHaveProperty('monthlyBudgetUSD');
    });
  });

  describe('2. Omnichannel Conversation Stream & Filters', () => {
    test('GET /api/chat/conversations returns seeded threads', async () => {
      const res = await request(app)
        .get('/api/chat/conversations')
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    test('GET /api/chat/conversations?channel=web filters by channel', async () => {
      const res = await request(app)
        .get('/api/chat/conversations?channel=web')
        .expect(200);

      expect(res.body.ok).toBe(true);
      res.body.data.forEach(c => {
        expect(c.channel).toBe('web');
      });
    });

    test('GET /api/chat/conversations/:id returns thread messages & metadata', async () => {
      const listRes = await request(app).get('/api/chat/conversations');
      const firstId = listRes.body.data[0].id;

      const res = await request(app)
        .get(`/api/chat/conversations/${firstId}`)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe(firstId);
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });
  });

  describe('3. 1-Click Human Takeover & Operator Direct Reply Bypass', () => {
    let targetConvId;

    beforeAll(async () => {
      const listRes = await request(app).get('/api/chat/conversations');
      targetConvId = listRes.body.data[0].id;
    });

    test('POST /api/chat/takeover activates human takeover lock', async () => {
      const res = await request(app)
        .post('/api/chat/takeover')
        .send({
          conversationId: targetConvId,
          enabled: true,
          operatorName: 'Firoz Ahmed (Founder)'
        })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.conversation.isHumanTakeover).toBe(true);
      expect(res.body.data.conversation.takenOverBy).toBe('Firoz Ahmed (Founder)');
    });

    test('POST /api/chat/send respects human takeover lock and bypasses AI', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          conversationId: targetConvId,
          command: 'Where is the bug fix update?',
          channel: 'web'
        })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe('taken_over');
      expect(res.body.isHumanTakeover).toBe(true);
      expect(res.body.reply).toContain('Operator Takeover Active');
    });

    test('POST /api/chat/operator-reply sends human message and appends to thread', async () => {
      const res = await request(app)
        .post('/api/chat/operator-reply')
        .send({
          conversationId: targetConvId,
          text: 'I am looking into this directly now.',
          operatorName: 'Firoz Ahmed (Founder)'
        })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('delivered');
      expect(res.body.data.message.sender).toBe('operator');
      expect(res.body.data.message.text).toBe('I am looking into this directly now.');
    });

    test('POST /api/chat/takeover releases thread back to AI co-pilot', async () => {
      const res = await request(app)
        .post('/api/chat/takeover')
        .send({
          conversationId: targetConvId,
          enabled: false
        })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.conversation.isHumanTakeover).toBe(false);
      expect(res.body.data.conversation.takenOverBy).toBeNull();
    });
  });

  describe('4. Internal COGS, Spending Limits & Safety Kill Switch', () => {
    test('POST /api/chat/spending-limits updates monthly ceiling and kill switch', async () => {
      const res = await request(app)
        .post('/api/chat/spending-limits')
        .send({
          monthlyBudgetUSD: 220,
          safetyKillSwitchActive: false
        })
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.data.spendingLimits.monthlyBudgetUSD).toBe(220);
      expect(res.body.data.spendingLimits.safetyKillSwitchActive).toBe(false);
    });
  });

  describe('5. Standalone Engine 1 Satellite Bridge & Telemetry', () => {
    test('GET /api/engines/engine1/bridge returns satellite status and telemetry', async () => {
      const res = await request(app)
        .get('/api/engines/engine1/bridge')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.engineId).toBe('engine1');
      expect(res.body.data).toBeDefined();
      expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.data.status);
      expect(typeof res.body.data.benchCount).toBe('number');
    });

    test('GET /api/engines/summary enriches engine1 with live satellite telemetry', async () => {
      const res = await request(app)
        .get('/api/engines/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.engines).toBeDefined();
      expect(res.body.engines.engine1).toBeDefined();
      expect(res.body.engines.engine1.satellite).toBeDefined();
      expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.engines.engine1.satellite.status);
    });
  });
});
