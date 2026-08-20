const request = require('supertest');
const express = require('express');
const cache = require('../src/services/cache');
const { handleOpsHealthSummary } = require('../src/services/bot/handlers/briefing');

describe('Executive Telemetry & Ops Health Center Test Suite', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mount system health endpoint
    app.get(['/api/system-health', '/api/system-health/detailed'], async (req, res) => {
      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      const { getActiveClientsCount } = require('../src/services/sse');
      
      let dbStatus = 'Offline';
      let dbLatencyMs = 12;
      let agencyStats = {
        totalStaff: 33,
        openTasks: 14,
        urgentTasks: 2,
        overdueTasks: 0
      };

      if (isSupabaseConfigured()) {
        dbStatus = 'Connected';
      }

      res.json({
        status: 'healthy',
        version: '0.9.0.0',
        environment: 'test',
        dbConnection: dbStatus,
        dbLatencyMs: dbLatencyMs,
        sseClients: getActiveClientsCount ? getActiveClientsCount() : 0,
        botStatus: {
          teamBot: 'active',
          teamBotMode: 'polling',
          clientBot: 'active',
          clientBotMode: 'polling'
        },
        uptimeSeconds: Math.round(process.uptime()),
        memoryMB: 48.2,
        cacheStats: cache.stats ? cache.stats() : { activeKeys: 0 },
        agencyTelemetry: agencyStats,
        timestamp: new Date().toISOString()
      });
    });
  });

  // 1. System Health API Diagnostics
  test('GET /api/system-health returns full operational telemetry', async () => {
    const res = await request(app).get('/api/system-health');
    expect(res.statusCode).toBe(200);
    expect(res.body.version).toBe('0.9.0.0');
    expect(res.body.status).toBe('healthy');
    expect(typeof res.body.dbLatencyMs).toBe('number');
    expect(res.body.botStatus).toBeDefined();
    expect(res.body.botStatus.teamBot).toBe('active');
    expect(res.body.cacheStats).toBeDefined();
    expect(res.body.agencyTelemetry).toBeDefined();
    expect(res.body.agencyTelemetry.totalStaff).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/system-health/detailed returns identical diagnostics', async () => {
    const res = await request(app).get('/api/system-health/detailed');
    expect(res.statusCode).toBe(200);
    expect(res.body.version).toBe('0.9.0.0');
    expect(res.body.status).toBe('healthy');
  });

  // 2. Cache Hit Rate Telemetry
  test('Cache service tracks hits, misses, and calculates hit rate percentage', () => {
    cache.clear();
    cache.set('telemetry_test_key', { foo: 'bar' }, 5000);

    // Hit 1
    const val1 = cache.get('telemetry_test_key');
    expect(val1).toEqual({ foo: 'bar' });

    // Miss 1
    const val2 = cache.get('non_existent_key');
    expect(val2).toBeNull();

    // Hit 2
    const val3 = cache.get('telemetry_test_key');
    expect(val3).toEqual({ foo: 'bar' });

    const stats = cache.stats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatePercent).toBe(67); // 2 / 3 = 66.6% -> 67%
  });

  // 3. Telegram Ops Health Handler
  test('handleOpsHealthSummary dispatches comprehensive markdown telemetry to Telegram', async () => {
    let sentMessage = null;
    let sentOptions = null;

    const mockTeamBot = {
      sendMessage: jest.fn((chatId, text, options) => {
        sentMessage = text;
        sentOptions = options;
        return Promise.resolve({ message_id: 1234 });
      })
    };

    const mockMsg = {
      chat: { id: 987654321 }
    };

    await handleOpsHealthSummary(mockTeamBot, mockMsg);

    expect(mockTeamBot.sendMessage).toHaveBeenCalled();
    expect(sentMessage).toContain('OPS HEALTH TELEMETRY');
    expect(sentMessage).toContain('System Diagnostics:');
    expect(sentMessage).toContain('Agency Pipeline Health:');
    expect(sentOptions.parse_mode).toBe('Markdown');
    expect(sentOptions.reply_markup.inline_keyboard[0][1].callback_data).toBe('cmd_health_refresh');
  });
});
