/**
 * tests/subphase_2_3_leave_callbacks.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.3: Leave Approval Callbacks (Manager & Owner)
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. registerTeamBotCallbacks routes approve_leave:, leave_approve:, approve_leave_owner:,
 *    leave_approve_owner:, reject_leave:, and leave_reject: callbacks
 * 2. Tier 1 Manager Approval:
 *    - Updates leaves status to 'Manager Approved'
 *    - Emits SSE leave_update broadcast
 *    - Strips inline buttons and appends audit banner
 *    - Notifies employee via Telegram DM
 *    - Forwards request with inline action buttons to Owner
 * 3. Tier 2 Owner Final Sign-off:
 *    - Updates leaves status to 'Approved'
 *    - Deducts leave balance from profile (casual_leaves_used / sick_leaves_used)
 *    - Emits SSE leave_update broadcast
 *    - Dispatches celebratory confirmation DM to employee
 * 4. Rejection:
 *    - Updates leaves status to 'Declined'
 *    - Emits SSE leave_update broadcast
 *    - Dispatches decline notice DM to employee
 * 5. Idempotent re-tap protection
 * 6. Non-existent leave ID handled gracefully without crash
 */

const crypto = require('crypto');
const sse = require('../src/services/sse');
const botService = require('../src/services/bot');
const { registerTeamBotCallbacks } = require('../src/services/bot/team-bot');
const { handleLeaveCallback, deductLeaveBalance } = require('../src/services/bot/handlers/leave-callbacks');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
const { readDB, writeDB } = require('../src/services/db');

describe('Sub-Phase 2.3: Leave Approval Callbacks in Team Bot', () => {
  let mockBot;
  let broadcastSpy;
  let tgSpy;

  const testSuffix = Date.now();
  const testEmpCode = `EMP-LVE-${testSuffix}`;
  const testEmpId = crypto.randomUUID();
  const testLeaveId = `LVE-TEST-${testSuffix}`;
  const testSickLeaveId = `LVE-SICK-${testSuffix}`;

  const testProfile = {
    id: testEmpId,
    emp_code: testEmpCode,
    name: 'Rahim Content Creator',
    role: 'Creator Lead',
    department: 'Content Creation',
    access_level: 'Specialist / Crew',
    telegram_id: '9988776655',
    casual_leaves_allowed: 14,
    casual_leaves_used: 2,
    sick_leaves_allowed: 10,
    sick_leaves_used: 1,
    created_at: new Date().toISOString()
  };

  const testLeave = {
    id: testLeaveId,
    employee_id: testEmpCode,
    employee_name: 'Rahim Content Creator',
    leave_type: 'Casual Leave',
    start_date: '2026-10-15',
    end_date: '2026-10-17',
    total_days: 3,
    reason: 'Family wedding event',
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  const testSickLeave = {
    id: testSickLeaveId,
    employee_id: testEmpCode,
    employee_name: 'Rahim Content Creator',
    leave_type: 'Sick Leave',
    start_date: '2026-11-01',
    end_date: '2026-11-02',
    total_days: 2,
    reason: 'Viral fever recovery',
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  beforeAll(async () => {
    broadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
    tgSpy = jest.spyOn(botService, 'sendTelegramNotification').mockImplementation(() => Promise.resolve(true));

    // Seed disk db
    try {
      const db = await readDB();
      db.team = db.team || [];
      db.team.push({
        ...testProfile,
        empCode: testEmpCode,
        telegramId: '9988776655'
      });
      db.leaves = db.leaves || [];
      db.leaves.push(testLeave);
      db.leaves.push(testSickLeave);
      await writeDB(db);
    } catch (_) {}

    // Seed Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').insert([testProfile]);
      } catch (err) {
        console.warn('Leave test setup Supabase profile note:', err.message);
      }
      try {
        await supabase.from('leaves').insert([testLeave, testSickLeave]);
      } catch (err) {
        console.warn('Leave test setup Supabase leaves note:', err.message);
      }
    }
  });

  afterAll(async () => {
    broadcastSpy.mockRestore();
    tgSpy.mockRestore();

    // Cleanup disk db
    try {
      const db = await readDB();
      if (db.team) db.team = db.team.filter(m => m.id !== testEmpId && m.emp_code !== testEmpCode);
      if (db.leaves) db.leaves = db.leaves.filter(l => l.id !== testLeaveId && l.id !== testSickLeaveId);
      await writeDB(db);
    } catch (_) {}

    // Cleanup Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('leaves').delete().in('id', [testLeaveId, testSickLeaveId]);
        await supabase.from('profiles').delete().eq('id', testEmpId);
      } catch (_) {}
    }
  });

  beforeEach(() => {
    mockBot = {
      on: jest.fn(),
      answerCallbackQuery: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ message_id: 1234 }),
      editMessageText: jest.fn().mockResolvedValue(true),
      editMessageReplyMarkup: jest.fn().mockResolvedValue(true)
    };
    broadcastSpy.mockClear();
    tgSpy.mockClear();
  });

  test('1. registerTeamBotCallbacks registers listeners for leave prefixes', () => {
    registerTeamBotCallbacks(mockBot);
    expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
  });

  test('2. Tier 1 Manager Approval: updates leaves status to Manager Approved and forwards to Owner', async () => {
    const query = {
      id: 'query-mgr-approve-1',
      data: `approve_leave:${testLeaveId}`,
      from: { id: 12345, first_name: 'Manager' },
      message: {
        message_id: 5566,
        chat: { id: 12345 },
        text: '🌴 *NEW LEAVE REQUEST SUBMITTED*\nStaff: Rahim'
      }
    };

    await handleLeaveCallback(mockBot, query);

    // Answer callback query
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
      'query-mgr-approve-1',
      expect.objectContaining({ text: expect.stringMatching(/Reviewing Leave Request/i) })
    );

    // Button removal and audit banner
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('APPROVED BY MANAGER'),
      expect.objectContaining({
        chat_id: 12345,
        message_id: 5566,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // SSE leave_update broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('leave_update', expect.arrayContaining([
      expect.objectContaining({
        id: testLeaveId,
        status: 'Manager Approved'
      })
    ]));

    // Forward to owner notification dispatched
    expect(tgSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('LEAVE: Manager Approved → Owner Final Sign-Off'),
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ callback_data: `approve_leave_owner:${testLeaveId}` })
        ])
      ]),
      true
    );

    // Employee notified via DM
    expect(tgSpy).toHaveBeenCalledWith(
      '9988776655',
      expect.stringContaining('Leave Status Update'),
      null,
      false
    );

    // Verify leave status in db
    const db = await readDB();
    const updatedLeave = (db.leaves || []).find(l => l.id === testLeaveId);
    expect(updatedLeave).toBeDefined();
    expect(updatedLeave.status).toBe('Manager Approved');
  });

  test('3. Tier 2 Owner Approval: updates leaves to Approved and deducts profile leave balance', async () => {
    const query = {
      id: 'query-owner-approve-1',
      data: `approve_leave_owner:${testLeaveId}`,
      from: { id: 778899, first_name: 'Managing Director' },
      message: {
        message_id: 5567,
        chat: { id: 778899 },
        text: '🌴 *LEAVE: Manager Approved → Owner Final Sign-Off*'
      }
    };

    await handleLeaveCallback(mockBot, query);

    // Answer callback query
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
      'query-owner-approve-1',
      expect.objectContaining({ text: expect.stringMatching(/Owner Final Sign-Off/i) })
    );

    // Button removal and owner audit banner
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('OWNER FINAL SIGN-OFF GRANTED'),
      expect.objectContaining({
        chat_id: 778899,
        message_id: 5567,
        reply_markup: { inline_keyboard: [] }
      })
    );

    // SSE leave_update broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('leave_update', expect.arrayContaining([
      expect.objectContaining({
        id: testLeaveId,
        status: 'Approved'
      })
    ]));

    // Celebratory DM to Employee
    expect(tgSpy).toHaveBeenCalledWith(
      '9988776655',
      expect.stringContaining('CONGRATULATIONS! Leave Fully Approved'),
      null,
      false
    );

    // Verify casual leave balance deduction: 2 + 3 = 5 used
    const db = await readDB();
    const updatedProfile = (db.team || []).find(m => m.id === testEmpId || m.emp_code === testEmpCode);
    expect(updatedProfile).toBeDefined();
    expect(updatedProfile.casual_leaves_used).toBe(5);

    const updatedLeave = (db.leaves || []).find(l => l.id === testLeaveId);
    expect(updatedLeave.status).toBe('Approved');
  });

  test('4. Sick leave balance deduction routes to sick_leaves_used', async () => {
    // Approve testSickLeave (2 days sick leave) directly as Owner
    const query = {
      id: 'query-sick-approve-1',
      data: `leave_approve_owner:${testSickLeaveId}`,
      from: { id: 778899, first_name: 'Managing Director' },
      message: {
        message_id: 5568,
        chat: { id: 778899 },
        text: '🌴 *LEAVE: Manager Approved → Owner Final Sign-Off*'
      }
    };

    await handleLeaveCallback(mockBot, query);

    const db = await readDB();
    const updatedProfile = (db.team || []).find(m => m.id === testEmpId || m.emp_code === testEmpCode);
    expect(updatedProfile).toBeDefined();
    // 1 previously used + 2 from testSickLeave = 3 sick leaves used
    expect(updatedProfile.sick_leaves_used).toBe(3);
  });

  test('5. Rejection: updates leave to Declined, strips buttons, and notifies employee', async () => {
    const testDeclineId = `LVE-DEC-${Date.now()}`;
    const declineLeave = {
      id: testDeclineId,
      employee_id: testEmpCode,
      employee_name: 'Rahim Content Creator',
      leave_type: 'Casual Leave',
      start_date: '2026-12-01',
      end_date: '2026-12-05',
      total_days: 5,
      status: 'Pending'
    };

    const db = await readDB();
    db.leaves.push(declineLeave);
    await writeDB(db);

    const query = {
      id: 'query-reject-1',
      data: `reject_leave:${testDeclineId}`,
      from: { id: 12345, first_name: 'Manager' },
      message: {
        message_id: 5569,
        chat: { id: 12345 },
        text: '🌴 *NEW LEAVE REQUEST*'
      }
    };

    await handleLeaveCallback(mockBot, query);

    // SSE leave_update broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('leave_update', expect.arrayContaining([
      expect.objectContaining({
        id: testDeclineId,
        status: 'Declined'
      })
    ]));

    // Button removal with DECLINED banner
    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('DECLINED'),
      expect.objectContaining({
        reply_markup: { inline_keyboard: [] }
      })
    );

    // Employee decline DM
    expect(tgSpy).toHaveBeenCalledWith(
      '9988776655',
      expect.stringContaining('Leave Request Declined'),
      null,
      false
    );

    const updatedDb = await readDB();
    const updated = (updatedDb.leaves || []).find(l => l.id === testDeclineId);
    expect(updated.status).toBe('Declined');
  });

  test('6. Idempotency: re-tapping owner approve on already approved leave alerts and removes buttons', async () => {
    const query = {
      id: 'query-idempotent-1',
      data: `approve_leave_owner:${testLeaveId}`,
      from: { id: 778899 },
      message: {
        message_id: 5570,
        chat: { id: 778899 },
        text: '🌴 *LEAVE: Manager Approved → Owner Final Sign-Off*'
      }
    };

    await handleLeaveCallback(mockBot, query);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      778899,
      expect.stringContaining('is already *Approved* and finalized'),
      expect.any(Object)
    );

    expect(mockBot.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('ALREADY OWNER APPROVED'),
      expect.any(Object)
    );
  });

  test('7. Graceful handling of non-existent leave ID', async () => {
    const query = {
      id: 'query-missing-1',
      data: `approve_leave:NON-EXISTENT-LEAVE-999`,
      from: { id: 12345 },
      message: {
        message_id: 5571,
        chat: { id: 12345 },
        text: '🌴 *LEAVE REQUEST*'
      }
    };

    await handleLeaveCallback(mockBot, query);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      12345,
      expect.stringContaining('not found in database'),
      expect.any(Object)
    );
  });
});
