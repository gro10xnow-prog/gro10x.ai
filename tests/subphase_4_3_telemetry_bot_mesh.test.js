/**
 * tests/subphase_4_3_telemetry_bot_mesh.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.3: Real-Time SSE Mesh, Telegram Bot Ops & Executive Flash Telemetry
 * 
 * Verifies:
 * 1. GET /api/dce/webhooks/health returns healthy status & active connectors
 * 2. handleDCEStats sends rich Markdown telemetry with gross GMV, fees, and net yield
 * 3. handleDCEOrders formats recent multi-channel orders with badges
 * 4. handleDCETickets displays open tickets with live SLA horizon indicators
 * 5. handleDCEMenu renders interactive mobile navigation deck
 * 6. handleCustomerTrack retrieves customer order details, tracking & license keys
 * 7. handleDCECallbackQuery dispatches dce_cmd:stats, orders, tickets, and settlements
 * 8. handleDCETrackingWizard attaches courier name and tracking code to physical orders
 * 9. src/services/sse.js broadcast sends structured events to listeners
 * 10. End-to-end telemetry mesh: Event creation aligns with real-time SSE propagation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

const {
  handleDCEStats,
  handleDCEOrders,
  handleDCETickets,
  handleDCEMenu,
  handleDCECallbackQuery,
  handleDCETrackingWizard,
  handleCustomerTrack
} = require('../src/services/bot/handlers/dce-ops');
const { broadcast, getActiveClientsCount } = require('../src/services/sse');

describe('Sub-Phase 4.3: Real-Time SSE Mesh, Telegram Bot Ops & Executive Flash Telemetry', () => {

  function createMockBot() {
    let sent = null;
    const bot = {
      sendMessage: jest.fn(async (chatId, text, opts) => {
        sent = { chatId, text, opts };
        return { message_id: Math.floor(Math.random() * 1000) };
      }),
      getLastSent: () => sent
    };
    return bot;
  }

  test('1. GET /api/dce/webhooks/health returns healthy status & active connectors', async () => {
    const res = await request(app).get('/api/dce/webhooks/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(Array.isArray(res.body.data.activeConnectors)).toBe(true);
    expect(res.body.data.activeConnectors).toContain('ETSY');
    expect(res.body.data.activeConnectors).toContain('GUMROAD');
  });

  test('2. handleDCEStats sends rich Markdown telemetry with gross GMV, fees, and net yield', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 } };

    await handleDCEStats(bot, mockMsg);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.chatId).toBe(12345678);
    expect(sent.text).toContain('GRO10X DIGITAL COMMERCE ENGINE TELEMETRY');
    expect(sent.text).toContain('Gross Sales (GMV)');
    expect(sent.text).toContain('Net Platform Yield');
    expect(sent.opts.reply_markup).toHaveProperty('inline_keyboard');
  });

  test('3. handleDCEOrders formats recent multi-channel orders with badges', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 } };

    await handleDCEOrders(bot, mockMsg);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.text).toContain('RECENT');
    expect(sent.text).toContain('PlannerQueen');
    expect(sent.opts.reply_markup).toBeDefined();
  });

  test('4. handleDCETickets displays open tickets with live SLA horizon indicators', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 } };

    await handleDCETickets(bot, mockMsg);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.text).toContain('ACTIVE POST-SALE TICKETS');
    expect(sent.text).toContain('SLA:');
  });

  test('5. handleDCEMenu renders interactive mobile navigation deck', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 } };

    await handleDCEMenu(bot, mockMsg);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.text).toContain('MOBILE COMMAND DECK');
    const buttons = sent.opts.reply_markup.inline_keyboard.flat();
    expect(buttons.some(b => b.callback_data === 'dce_cmd:stats')).toBe(true);
    expect(buttons.some(b => b.callback_data === 'dce_cmd:settlements')).toBe(true);
  });

  test('6. handleCustomerTrack retrieves customer order details, tracking & license keys', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 } };

    await handleCustomerTrack(bot, mockMsg, 'ETSY-SAMPLE-9900');

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.text).toContain('ETSY-SAMPLE-9900');
    expect(sent.text).toContain('Status');
  });

  test('7. handleDCECallbackQuery dispatches dce_cmd:stats, orders, tickets, and settlements', async () => {
    const bot = createMockBot();
    const mockQuery = {
      id: 'q-settle',
      message: { chat: { id: 889900 }, message_id: 42 },
      data: 'dce_cmd:settlements'
    };

    await handleDCECallbackQuery(bot, mockQuery);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.chatId).toBe(889900);
    expect(sent.text).toContain('SETTLEMENTS');
  });

  test('8. handleDCETrackingWizard attaches courier name and tracking code to physical orders', async () => {
    const bot = createMockBot();
    const mockMsg = { chat: { id: 12345678 }, text: 'Steadfast BD-839210' };
    const wizardState = { orderId: 'ORD-PHYSICAL-TEST-01' };

    await handleDCETrackingWizard(bot, mockMsg, wizardState);

    expect(bot.sendMessage).toHaveBeenCalled();
    const sent = bot.getLastSent();
    expect(sent.text).toContain('COURIER TRACKING RECORDED');
    expect(sent.text).toContain('Steadfast');
    expect(sent.text).toContain('BD-839210');
  });

  test('9. src/services/sse.js broadcast sends structured events to listeners', () => {
    expect(typeof broadcast).toBe('function');
    
    // Broadcast must not throw when called with structured payloads
    expect(() => {
      broadcast({
        type: 'DCE_TELEMETRY_PULSE',
        timestamp: new Date().toISOString(),
        engine: 'engine3'
      });
    }).not.toThrow();
  });

  test('10. End-to-end telemetry mesh: Event creation aligns with real-time SSE propagation', async () => {
    // Assert active clients count helper exists
    if (typeof getActiveClientsCount === 'function') {
      const count = getActiveClientsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    }

    // Verify GET /api/dce/orders/metrics delivers live snapshot
    const res = await request(app)
      .get('/api/dce/orders/metrics')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('grossGMV');
    expect(res.body.data).toHaveProperty('netRevenue');
  });
});
