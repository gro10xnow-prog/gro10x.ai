/**
 * tests/subphase_2_2_agreement_callbacks.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.2: Agreement Sign Callbacks (Stage 2 & Stage 3)
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. registerTeamBotCallbacks routes agr_stage2: and agr_stage3: callbacks
 * 2. agr_stage2:{empId} updates agreement_stage to 2, emits SSE team_update,
 *    triggers Stage 2 notification chaining, and removes inline buttons
 * 3. agr_stage3:{empId} updates agreement_stage to 3, sets agreement_complete=true,
 *    emits SSE team_update, upgrades employee role keyboard, and removes buttons
 * 4. Flexible identifier resolution (resolves both emp_code and id)
 * 5. Idempotent re-tap protection for Stage 2 & Stage 3
 * 6. Graceful handling of non-existent employee ID without crashing
 */

const crypto = require('crypto');
const sse = require('../src/services/sse');
const botService = require('../src/services/bot');
const { registerTeamBotCallbacks } = require('../src/services/bot/team-bot');
const { handleAgreementCallback } = require('../src/services/bot/handlers/agreement-callbacks');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
const { readDB, writeDB } = require('../src/services/db');

describe('Sub-Phase 2.2: Agreement Sign Callbacks in Team Bot', () => {
  let mockBot;
  let broadcastSpy;
  let notifSpy;
  let tgSpy;

  const testSuffix = Date.now();
  const testEmpCode = `EMP-TEST-${testSuffix}`;
  const testEmpId = crypto.randomUUID();

  const testProfile = {
    id: testEmpId,
    emp_code: testEmpCode,
    name: 'Tariq Video Specialist',
    role: 'Motion Graphics Lead',
    department: 'Creative & Video',
    access_level: 'Specialist / Crew',
    agreement_stage: 1,
    agreement_complete: false,
    telegram_id: '9911223344',
    created_at: new Date().toISOString()
  };

  beforeAll(async () => {
    broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
    notifSpy = jest.spyOn(botService, 'sendAgreementNotification').mockImplementation(() => Promise.resolve(true));
    tgSpy = jest.spyOn(botService, 'sendTelegramNotification').mockImplementation(() => Promise.resolve(true));

    // Seed disk db
    try {
      const db = await readDB();
      db.team = db.team || [];
      db.team.push({
        ...testProfile,
        empCode: testEmpCode,
        telegramId: '9911223344',
        accessLevel: 'Specialist / Crew'
      });
      await writeDB(db);
    } catch (_) {}

    // Seed Supabase with valid UUID id
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').insert([testProfile]);
      } catch (err) {
        console.warn('Agreement test setup Supabase note:', err.message);
      }
    }
  });

  afterAll(async () => {
    broadcastSpy.mockRestore();
    notifSpy.mockRestore();
    tgSpy.mockRestore();

    // Clean up disk db
    try {
      const db = await readDB();
      if (Array.isArray(db.team)) {
        db.team = db.team.filter(m => m.emp_code !== testEmpCode && m.id !== testEmpId);
        await writeDB(db);
      }
    } catch (_) {}

    // Clean up Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').delete().or(`emp_code.eq.${testEmpCode},id.eq.${testEmpId}`);
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
      sendMessage: jest.fn().mockResolvedValue({ message_id: 2001 }),
      editMessageText: jest.fn().mockResolvedValue(true),
      editMessageReplyMarkup: jest.fn().mockResolvedValue(true)
    };
  });

  test('1. registerTeamBotCallbacks registers callback_query listener for agreement callbacks', () => {
    registerTeamBotCallbacks(mockBot);
    expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
    expect(mockBot.callbacks['callback_query']).toBeDefined();
  });

  test('2. agr_stage2:{empId} updates agreement_stage to 2, emits SSE team_update, and triggers Stage 2 notification', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const stage2Query = {
      id: 'query_stage2_001',
      data: `agr_stage2:${testEmpCode}`,
      from: { id: 7754769807, first_name: 'Firoz' },
      message: {
        message_id: 601,
        chat: { id: 7754769807 },
        text: `📄 Employment Agreement — Action Required for ${testProfile.name}`
      }
    };

    await callbackHandler(stage2Query);

    // 1. Immediately dismiss loading spinner
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('query_stage2_001', expect.objectContaining({
      text: expect.stringContaining('Countersigning Agreement')
    }));

    // 2. Real-time SSE team_update emitted
    expect(broadcastSpy).toHaveBeenCalledWith('team_update', expect.arrayContaining([
      expect.objectContaining({
        emp_code: testEmpCode,
        agreement_stage: 2
      })
    ]));

    // 3. Chained notification dispatched
    expect(notifSpy).toHaveBeenCalledWith(2, expect.objectContaining({
      name: testProfile.name
    }), expect.any(Object));

    // 4. Buttons removed and replaced with audit banner
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('COUNTERSIGNED'),
      expect.objectContaining({
        chat_id: 7754769807,
        message_id: 601,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // 5. Operator confirmed
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('Agreement Countersigned!'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );

    // 6. Supabase verification
    if (isSupabaseConfigured()) {
      const { data: updated } = await supabase.from('profiles').select('*').eq('emp_code', testEmpCode).single();
      expect(updated).toBeDefined();
      expect(Number(updated.agreement_stage)).toBe(2);
    }
  });

  test('3. Idempotent re-tap on agr_stage2 informs operator and prevents duplicated stage update', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const repeatQuery = {
      id: 'query_stage2_repeat',
      data: `agr_stage2:${testEmpCode}`,
      from: { id: 7754769807, first_name: 'Firoz' },
      message: {
        message_id: 602,
        chat: { id: 7754769807 },
        text: `📄 Employment Agreement for ${testProfile.name}`
      }
    };

    await callbackHandler(repeatQuery);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('already been countersigned'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });

  test('4. agr_stage3:{empId} applies final seal, sets agreement_complete=true, emits SSE, and activates employee', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const stage3Query = {
      id: 'query_stage3_001',
      data: `agr_stage3:${testEmpCode}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 603,
        chat: { id: 7754769807 },
        text: `📄 Employment Agreement — Final Approval Required for ${testProfile.name}`
      }
    };

    await callbackHandler(stage3Query);

    // 1. Loading spinner dismissed
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('query_stage3_001', expect.objectContaining({
      text: expect.stringContaining('Applying Owner Seal')
    }));

    // 2. Real-time SSE team_update emitted with onboarding_complete: true
    expect(broadcastSpy).toHaveBeenCalledWith('team_update', expect.arrayContaining([
      expect.objectContaining({
        emp_code: testEmpCode,
        agreement_stage: 3,
        onboarding_complete: true
      })
    ]));

    // 3. Activation notification dispatched
    expect(notifSpy).toHaveBeenCalledWith(3, expect.objectContaining({
      name: testProfile.name,
      onboardingComplete: true
    }), expect.any(Object));

    // 4. Buttons removed and replaced with final seal banner
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('FINAL SEAL APPLIED'),
      expect.objectContaining({
        chat_id: 7754769807,
        message_id: 603,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // 5. Operator confirmed
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('Employee Fully Activated!'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );

    // 6. Supabase verification
    if (isSupabaseConfigured()) {
      const { data: updated } = await supabase.from('profiles').select('*').eq('emp_code', testEmpCode).single();
      expect(updated).toBeDefined();
      expect(Number(updated.agreement_stage)).toBe(3);
      expect(updated.agreement_complete).toBe(true);
    }
  });

  test('5. Idempotent re-tap on agr_stage3 informs operator that employee is already activated', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const repeatQuery = {
      id: 'query_stage3_repeat',
      data: `agr_stage3:${testEmpCode}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 604,
        chat: { id: 7754769807 },
        text: `📄 Employment Agreement for ${testProfile.name}`
      }
    };

    await callbackHandler(repeatQuery);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('already fully activated'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });

  test('6. Flexible identifier resolution supports passing profile UUID id instead of emp_code', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const idQuery = {
      id: 'query_id_test',
      data: `agr_stage3:${testEmpId}`,
      from: { id: 7754769807, first_name: 'Mehedi' },
      message: {
        message_id: 605,
        chat: { id: 7754769807 },
        text: `📄 Employment Agreement for ${testProfile.name}`
      }
    };

    // Since already activated, it should resolve the profile by UUID and report already activated
    await callbackHandler(idQuery);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      7754769807,
      expect.stringContaining('already fully activated'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
  });

  test('7. Invalid employee ID informs operator without throwing unhandled exceptions', async () => {
    registerTeamBotCallbacks(mockBot);
    const callbackHandler = mockBot.callbacks['callback_query'];

    const invalidQuery = {
      id: 'query_invalid_emp',
      data: 'agr_stage2:EMP-NONEXISTENT-999999',
      from: { id: 7754769807, first_name: 'Firoz' },
      message: {
        message_id: 606,
        chat: { id: 7754769807 },
        text: 'Some agreement text'
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
