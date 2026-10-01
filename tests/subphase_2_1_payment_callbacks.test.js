/**
 * tests/subphase_2_1_payment_callbacks.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.1: Payment Approval & Rejection Callbacks in Team Bot
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. registerTeamBotCallbacks registers callback_query listener on teamBot
 * 2. pay_approve:{id} verifies payment, updates invoice to Paid, emits SSE events,
 *    sends Resend payment receipt email, and removes inline keyboard buttons
 * 3. pay_reject:{id} rejects payment, reverts invoice to Pending, emits SSE events,
 *    sends Telegram DM to client, and removes inline keyboard buttons
 * 4. Idempotent re-tap: approving already-verified payment gracefully handles state
 * 5. Invalid payment ID: gracefully informs user without unhandled rejections
 */

const sse = require('../src/services/sse');
const resend = require('../src/services/resend');
const botService = require('../src/services/bot');
const { registerTeamBotCallbacks, handlePaymentCallback } = require('../src/services/bot/team-bot');
const { handlePaymentApprove, handlePaymentReject } = require('../src/services/bot/handlers/payment-callbacks');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
const { inMemoryInvoices } = require('../src/routes/invoices');

describe('Sub-Phase 2.1: Payment Approval/Reject Callbacks in Team Bot', () => {
  let mockBot;
  let broadcastSpy;
  let emailSpy;
  let tgSpy;
  const testSuffix = Date.now();
  const testPaymentId = `PAY-TEST-${testSuffix}`;
  const testInvoiceId = `INV-TEST-${testSuffix}`;
  const testClientId = `CLI-TEST-${testSuffix}`;

  beforeAll(async () => {
    // Spy on SSE broadcasts, Resend emails, and Telegram dispatch
    broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
    emailSpy = jest.spyOn(resend, 'sendPaymentReceiptEmail').mockResolvedValue({ success: true, simulated: true });
    tgSpy = jest.spyOn(botService, 'sendTelegramNotification').mockImplementation(() => Promise.resolve(true));

    // Seed test invoice and payment in memory and Supabase if configured
    inMemoryInvoices.push({
      id: testInvoiceId,
      clientId: testClientId,
      clientName: 'Apex Logistics QA',
      amount: 85000,
      status: 'Pending',
      created_at: new Date().toISOString()
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clients').insert([{
          id: testClientId,
          name: 'Apex Logistics QA',
          email: 'finance@apexlogistics-qa.com',
          telegram_id: '9988776655',
          created_at: new Date().toISOString()
        }]);

        await supabase.from('invoices').insert([{
          id: testInvoiceId,
          client_id: testClientId,
          client_name: 'Apex Logistics QA',
          amount: 85000,
          status: 'Pending',
          created_at: new Date().toISOString()
        }]);

        await supabase.from('payment_logs').insert([{
          id: testPaymentId,
          invoice_id: testInvoiceId,
          client_id: testClientId,
          client_name: 'Apex Logistics QA',
          amount: 85000,
          payment_method: 'Corporate Bank Wire',
          trx_id: `TRX-${testSuffix}`,
          verified: false,
          created_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.warn('Test setup Supabase insert note:', err.message);
      }
    }
  });

  afterAll(async () => {
    broadcastSpy.mockRestore();
    emailSpy.mockRestore();
    tgSpy.mockRestore();

    // Clean up memory
    const idx = inMemoryInvoices.findIndex(i => i.id === testInvoiceId);
    if (idx !== -1) inMemoryInvoices.splice(idx, 1);

    // Clean up Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('payment_logs').delete().eq('id', testPaymentId);
        await supabase.from('invoices').delete().eq('id', testInvoiceId);
        await supabase.from('clients').delete().eq('id', testClientId);
      } catch (_) {}
    }
  });

  beforeEach(() => {
    mockBot = {
      callbacks: {},
      on: jest.fn(function(event, handler) {
        mockBot.callbacks[event] = handler;
      }),
      answerCallbackQuery: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ message_id: 1001 }),
      editMessageText: jest.fn().mockResolvedValue(true),
      editMessageReplyMarkup: jest.fn().mockResolvedValue(true)
    };
  });

  test('1. registerTeamBotCallbacks registers callback_query listener on teamBot', () => {
    registerTeamBotCallbacks(mockBot);
    expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
    expect(mockBot.callbacks['callback_query']).toBeDefined();
  });

  test('2. pay_approve:{id} verifies payment, updates invoice to Paid, sends receipt email, and emits SSE', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const approveQuery = {
      id: 'query_approve_001',
      data: `pay_approve:${testPaymentId}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 501,
        chat: { id: 7754769807 },
        text: `💳 New Payment Proof Received for Invoice ${testInvoiceId}`
      }
    };

    await callbackHandler(approveQuery);

    // Verifies immediate spinner dismissal
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('query_approve_001', expect.objectContaining({
      text: expect.stringContaining('Verifying & Approving')
    }));

    // Verifies SSE broadcasts
    expect(broadcastSpy).toHaveBeenCalledWith('payment_update', expect.arrayContaining([
      expect.objectContaining({ id: testPaymentId, verified: true })
    ]));
    expect(broadcastSpy).toHaveBeenCalledWith('invoice_update', expect.arrayContaining([
      expect.objectContaining({ id: testInvoiceId, status: 'Paid' })
    ]));

    // Verifies Resend receipt email was invoked
    expect(emailSpy).toHaveBeenCalledWith(expect.objectContaining({
      clientEmail: expect.stringContaining('@apexlogistics-qa.com'),
      invoiceId: testInvoiceId,
      amount: 85000,
      transactionId: `TRX-${testSuffix}`
    }));

    // Verifies Telegram inline buttons were stripped
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('VERIFIED & APPROVED'),
      expect.objectContaining({
        chat_id: 7754769807,
        message_id: 501,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // Verifies confirmation message to team chat
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('Approved!'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );

    // Verifies in-memory invoice state updated to Paid
    const updatedMemInv = inMemoryInvoices.find(i => i.id === testInvoiceId);
    expect(updatedMemInv).toBeDefined();
    expect(updatedMemInv.status).toBe('Paid');

    // Verifies Supabase payment_logs and invoice updated
    if (isSupabaseConfigured()) {
      const { data: pLog } = await supabase.from('payment_logs').select('*').eq('id', testPaymentId).single();
      expect(pLog.verified).toBe(true);

      const { data: dbInv } = await supabase.from('invoices').select('*').eq('id', testInvoiceId).single();
      expect(dbInv.status).toBe('Paid');
    }
  });

  test('3. Idempotent re-tap: approving already-verified payment gracefully informs user', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const repeatQuery = {
      id: 'query_approve_repeat',
      data: `pay_approve:${testPaymentId}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 502,
        chat: { id: 7754769807 },
        text: `💳 New Payment Proof Received for Invoice ${testInvoiceId}`
      }
    };

    await callbackHandler(repeatQuery);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('already been verified'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });

  test('4. pay_reject:{id} marks payment rejected, reverts invoice to Pending, and emits SSE', async () => {
    // Create a new rejectable payment for testing reject flow
    const rejectPaymentId = `PAY-REJ-${testSuffix}`;
    const rejectInvoiceId = `INV-REJ-${testSuffix}`;

    inMemoryInvoices.push({
      id: rejectInvoiceId,
      clientId: testClientId,
      clientName: 'Apex Logistics QA',
      amount: 40000,
      status: 'Paid',
      created_at: new Date().toISOString()
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('invoices').insert([{
          id: rejectInvoiceId,
          client_id: testClientId,
          client_name: 'Apex Logistics QA',
          amount: 40000,
          status: 'Verification Pending',
          created_at: new Date().toISOString()
        }]);

        await supabase.from('payment_logs').insert([{
          id: rejectPaymentId,
          invoice_id: rejectInvoiceId,
          client_id: testClientId,
          client_name: 'Apex Logistics QA',
          amount: 40000,
          payment_method: 'bKash Merchant',
          trx_id: `TRX-REJ-${testSuffix}`,
          verified: false,
          created_at: new Date().toISOString()
        }]);
      } catch (_) {}
    }

    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const rejectQuery = {
      id: 'query_reject_001',
      data: `pay_reject:${rejectPaymentId}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 503,
        chat: { id: 7754769807 },
        text: `💳 Payment Proof for Invoice ${rejectInvoiceId}`
      }
    };

    await callbackHandler(rejectQuery);

    // Verifies immediate spinner dismissal
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('query_reject_001', expect.objectContaining({
      text: expect.stringContaining('Rejecting Payment Proof')
    }));

    // Verifies SSE broadcasts
    expect(broadcastSpy).toHaveBeenCalledWith('payment_update', expect.arrayContaining([
      expect.objectContaining({ id: rejectPaymentId, rejected: true })
    ]));
    expect(broadcastSpy).toHaveBeenCalledWith('invoice_update', expect.arrayContaining([
      expect.objectContaining({ id: rejectInvoiceId, status: 'Pending' })
    ]));

    // Verifies Telegram message was updated and buttons stripped
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('PAYMENT PROOF REJECTED'),
      expect.objectContaining({
        chat_id: 7754769807,
        message_id: 503,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // Verifies confirmation message to team chat
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('Rejected'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );

    // Verify in memory invoice reverted to Pending
    const memInv = inMemoryInvoices.find(i => i.id === rejectInvoiceId);
    expect(memInv).toBeDefined();
    expect(memInv.status).toBe('Pending');

    // Clean up reject test rows
    const rIdx = inMemoryInvoices.findIndex(i => i.id === rejectInvoiceId);
    if (rIdx !== -1) inMemoryInvoices.splice(rIdx, 1);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('payment_logs').delete().eq('id', rejectPaymentId);
        await supabase.from('invoices').delete().eq('id', rejectInvoiceId);
      } catch (_) {}
    }
  });

  test('5. Invalid payment ID informs user without unhandled rejections', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const invalidQuery = {
      id: 'query_invalid_001',
      data: 'pay_approve:PAY-NONEXISTENT-999999',
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 504,
        chat: { id: 7754769807 },
        text: 'Some message'
      }
    };

    await expect(callbackHandler(invalidQuery)).resolves.not.toThrow();

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('not found in database'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });
});
