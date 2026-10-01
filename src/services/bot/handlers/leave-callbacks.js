/**
 * src/services/bot/handlers/leave-callbacks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Leave Approval & Workflow Callback Handlers.
 * Supports:
 * - Line Manager Approval: `approve_leave:{id}` & `leave_approve:{id}`
 * - Owner Final Approval: `approve_leave_owner:{id}` & `leave_approve_owner:{id}`
 * - Leave Rejection: `reject_leave:{id}` & `leave_reject:{id}`
 *
 * Integrates:
 * - Supabase `leaves` status update ('Manager Approved', 'Approved', 'Declined')
 * - Supabase `profiles` leave balance deductions (casual_leaves_used / sick_leaves_used)
 * - data/db.json file persistence & offline fallback
 * - Real-time SSE `leave_update` event broadcasts
 * - Telegram notification chaining (Tier 1 -> Owner sign-off; Tier 2 -> Employee confirmation)
 * - Message button removal and audit banner to prevent double-clicks
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('../../supabase');
const state = require('../../state');
const sse = require('../../sse');
const { readDB, writeDB } = require('../../db');
const botService = require('../../bot');

/**
 * Helper to check if string matches standard UUID format
 */
function isUuid(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Main dispatcher for leave callback queries
 */
async function handleLeaveCallback(bot, query) {
  const data = query.data || '';

  // 1. Owner Final Approval
  if (data.startsWith('approve_leave_owner:') || data.startsWith('leave_approve_owner:')) {
    const leaveId = data.replace(/^(approve_leave_owner:|leave_approve_owner:)/, '').trim();
    return handleLeaveApprove(bot, query, leaveId, true);
  }

  // 2. Line Manager Approval
  if (data.startsWith('approve_leave:') || data.startsWith('leave_approve:')) {
    const leaveId = data.replace(/^(approve_leave:|leave_approve:)/, '').trim();
    return handleLeaveApprove(bot, query, leaveId, false);
  }

  // 3. Rejection / Decline
  if (data.startsWith('reject_leave:') || data.startsWith('leave_reject:')) {
    const leaveId = data.replace(/^(reject_leave:|leave_reject:)/, '').trim();
    return handleLeaveReject(bot, query, leaveId);
  }
}

/**
 * Handle Leave Approval (Tier 1 Manager or Tier 2 Owner)
 */
async function handleLeaveApprove(bot, query, leaveId, isOwner = false) {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  // 1. Dismiss spinner immediately
  try {
    const spinnerMsg = isOwner ? '👑 Processing Owner Final Sign-Off...' : '⏳ Reviewing Leave Request...';
    await bot.answerCallbackQuery(queryId, { text: spinnerMsg });
  } catch (_) {}

  try {
    // Determine reviewing user
    const reviewer = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || {
      name: isOwner ? 'Managing Director' : 'Line Manager',
      emp_code: isOwner ? 'OWNER' : 'MGR'
    };
    const reviewerName = reviewer?.name || (isOwner ? 'Managing Director' : 'Line Manager');

    // 2. Fetch target leave record
    let targetLeave = null;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('leaves').select('*').eq('id', leaveId).maybeSingle();
      if (!error && data) targetLeave = data;
    }

    if (!targetLeave) {
      try {
        const db = await readDB();
        targetLeave = (db.leaves || []).find(l => String(l.id) === String(leaveId));
      } catch (_) {}
    }

    if (!targetLeave) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Leave request \`${leaveId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    // 3. Idempotency guards
    if (isOwner && targetLeave.status === 'Approved') {
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `ℹ️ Leave request \`${leaveId}\` is already *Approved* and finalized.`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
      await removeMessageButtons(bot, query, `✅ *ALREADY OWNER APPROVED*`);
      return;
    }

    if (!isOwner && (targetLeave.status === 'Manager Approved' || targetLeave.status === 'Approved')) {
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `ℹ️ Leave request \`${leaveId}\` has already been reviewed (${targetLeave.status}).`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
      await removeMessageButtons(bot, query, `✅ *ALREADY REVIEWED (${targetLeave.status})*`);
      return;
    }

    const nowIso = new Date().toISOString();
    const newStatus = isOwner ? 'Approved' : 'Manager Approved';

    // 4. Update Leave in Supabase & Disk DB
    const updates = {
      status: newStatus,
      updated_at: nowIso
    };

    if (isOwner) {
      updates.owner_approved_at = nowIso;
      if (targetLeave.manager_reviewed_by) {
        updates.manager_reviewed_by = targetLeave.manager_reviewed_by;
      }
    } else {
      updates.manager_reviewed_by = reviewerName;
    }

    if (isSupabaseConfigured()) {
      try {
        const { error: updErr } = await supabase.from('leaves').update(updates).eq('id', leaveId);
        if (updErr) {
          console.warn('[Leave Callback] Supabase update warning:', updErr.message);
        }
      } catch (dbErr) {
        console.warn('[Leave Callback] Supabase update warning:', dbErr.message);
      }
    }

    try {
      const db = await readDB();
      db.leaves = db.leaves || [];
      const idx = db.leaves.findIndex(l => String(l.id) === String(leaveId));
      if (idx !== -1) {
        db.leaves[idx] = { ...db.leaves[idx], ...updates };
      }
      await writeDB(db);
    } catch (_) {}

    // 5. Deduct Leave Balances upon Owner Final Approval
    if (isOwner && targetLeave.employee_id) {
      await deductLeaveBalance(targetLeave);
    }

    // 6. Broadcast SSE real-time event
    const ssePayload = [{
      id: leaveId,
      status: newStatus,
      manager_reviewed_by: updates.manager_reviewed_by || targetLeave.manager_reviewed_by,
      manager_approved_at: updates.manager_approved_at || targetLeave.manager_approved_at,
      owner_approved_at: updates.owner_approved_at || targetLeave.owner_approved_at
    }];
    sse.broadcast('leave_update', ssePayload);

    // 7. Remove buttons and post audit stamp
    const auditBanner = isOwner
      ? `👑 *OWNER FINAL SIGN-OFF GRANTED by ${reviewerName} on ${new Date().toLocaleDateString('en-GB')}*`
      : `✅ *APPROVED BY MANAGER (${reviewerName}) on ${new Date().toLocaleDateString('en-GB')}*`;
    await removeMessageButtons(bot, query, auditBanner);

    // 8. Send Telegram notifications & chaining
    const staffName = targetLeave.employee_name || targetLeave.staffName || targetLeave.name || 'Staff Member';
    const leaveType = targetLeave.leave_type || targetLeave.type || 'Leave';
    const dates = `${targetLeave.start_date || 'N/A'} to ${targetLeave.end_date || 'N/A'}`;

    if (isOwner) {
      // Confirm to Owner
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `👑 *Leave ${leaveId} Owner Approved!*\n` +
          `• Employee: *${staffName}*\n` +
          `• Type: *${leaveType}*\n` +
          `• Dates: *${dates}*\n\n` +
          `Leave balances and calendar records updated.`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }

      // Notify Employee of Final Approval
      await notifyEmployee(targetLeave.employee_id,
        `🎉 *CONGRATULATIONS! Leave Fully Approved!*\n\n` +
        `Your *${leaveType}* (${dates}) has received final approval from the Managing Director! 🌴💜`
      );

    } else {
      // Confirm to Manager
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `✅ *Leave ${leaveId} Manager Approved!*\n` +
          `• Employee: *${staffName}*\n` +
          `Forwarded to Owner for final sign-off.`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }

      // Notify Employee of Manager Approval
      await notifyEmployee(targetLeave.employee_id,
        `✅ *Leave Status Update:*\n\n` +
        `Your *${leaveType}* request (${dates}) has been approved by Manager *${reviewerName}* and forwarded for final Owner sign-off.`
      );

      // Forward to Owner for Tier 2 Final Sign-Off
      await forwardToOwner(leaveId, targetLeave, staffName, leaveType, dates);
    }

  } catch (err) {
    console.error('[Leave Callback Approve Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error approving leave: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Handle Leave Rejection
 */
async function handleLeaveReject(bot, query, leaveId) {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  try {
    await bot.answerCallbackQuery(queryId, { text: '❌ Rejecting Leave Request...' });
  } catch (_) {}

  try {
    const reviewer = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || {
      name: 'Manager',
      emp_code: 'MGR'
    };
    const reviewerName = reviewer?.name || 'Manager';

    // 1. Fetch leave record
    let targetLeave = null;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('leaves').select('*').eq('id', leaveId).maybeSingle();
      if (!error && data) targetLeave = data;
    }

    if (!targetLeave) {
      try {
        const db = await readDB();
        targetLeave = (db.leaves || []).find(l => String(l.id) === String(leaveId));
      } catch (_) {}
    }

    if (!targetLeave) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Leave request \`${leaveId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    // 2. Idempotency check
    if (targetLeave.status === 'Declined' || targetLeave.status === 'Rejected') {
      if (chatId) {
        await bot.sendMessage(chatId, `ℹ️ Leave request \`${leaveId}\` is already marked as Declined.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      await removeMessageButtons(bot, query, `❌ *ALREADY DECLINED*`);
      return;
    }

    const nowIso = new Date().toISOString();
    const updates = {
      status: 'Declined',
      manager_reviewed_by: reviewerName,
      updated_at: nowIso
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('leaves').update(updates).eq('id', leaveId);
      } catch (dbErr) {
        console.warn('[Leave Callback] Supabase reject warning:', dbErr.message);
      }
    }

    try {
      const db = await readDB();
      db.leaves = db.leaves || [];
      const idx = db.leaves.findIndex(l => String(l.id) === String(leaveId));
      if (idx !== -1) {
        db.leaves[idx] = { ...db.leaves[idx], ...updates };
      }
      await writeDB(db);
    } catch (_) {}

    // 3. SSE Broadcast
    sse.broadcast('leave_update', [{ id: leaveId, status: 'Declined', manager_reviewed_by: reviewerName }]);

    // 4. Strip buttons & add audit stamp
    await removeMessageButtons(bot, query, `❌ *DECLINED by ${reviewerName} on ${new Date().toLocaleDateString('en-GB')}*`);

    // 5. Send message to reviewer
    if (chatId) {
      await bot.sendMessage(chatId, `❌ *Leave ${leaveId} Declined by ${reviewerName}.*`, { parse_mode: 'Markdown' }).catch(() => {});
    }

    // 6. Notify Employee
    const leaveType = targetLeave.leave_type || targetLeave.type || 'Leave';
    const dates = `${targetLeave.start_date || 'N/A'} to ${targetLeave.end_date || 'N/A'}`;
    await notifyEmployee(targetLeave.employee_id,
      `❌ *Leave Request Declined*\n\n` +
      `Your request for *${leaveType}* (${dates}) has been declined by *${reviewerName}*.`
    );

  } catch (err) {
    console.error('[Leave Callback Reject Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error declining leave: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Deduct leave days from employee profile in Supabase and db.json
 */
async function deductLeaveBalance(leave) {
  try {
    const days = Number(leave.total_days || leave.days) || 1;
    const isSick = (leave.leave_type || leave.type || '').toLowerCase().includes('sick');
    const usedCol = isSick ? 'sick_leaves_used' : 'casual_leaves_used';

    if (isSupabaseConfigured() && leave.employee_id) {
      let q = supabase.from('profiles').select('*');
      if (isUuid(leave.employee_id)) {
        q = q.eq('id', leave.employee_id);
      } else {
        q = q.eq('emp_code', leave.employee_id);
      }

      const { data: profile, error } = await q.maybeSingle();
      if (!error && profile) {
        const currentUsed = Number(profile[usedCol]) || 0;
        const targetIdCol = isUuid(leave.employee_id) ? 'id' : 'emp_code';
        await supabase
          .from('profiles')
          .update({ [usedCol]: currentUsed + days, updated_at: new Date().toISOString() })
          .eq(targetIdCol, leave.employee_id);
      }
    }

    // Local db.json sync
    try {
      const db = await readDB();
      const member = (db.team || []).find(m => m.id === leave.employee_id || m.emp_code === leave.employee_id || m.empCode === leave.employee_id);
      if (member) {
        member[usedCol] = (Number(member[usedCol]) || 0) + days;
        await writeDB(db);
      }
    } catch (_) {}
  } catch (balErr) {
    console.warn('[Leave Callback] Leave balance deduction warning:', balErr.message);
  }
}

/**
 * Send Telegram DM notification to employee
 */
async function notifyEmployee(employeeId, text) {
  if (!employeeId) return;

  try {
    let telegramId = null;

    if (isSupabaseConfigured()) {
      let q = supabase.from('profiles').select('telegram_id');
      if (isUuid(employeeId)) {
        q = q.eq('id', employeeId);
      } else {
        q = q.eq('emp_code', employeeId);
      }
      const { data } = await q.maybeSingle();
      if (data?.telegram_id) telegramId = data.telegram_id;
    }

    if (!telegramId) {
      try {
        const db = await readDB();
        const member = (db.team || []).find(m => m.id === employeeId || m.emp_code === employeeId || m.empCode === employeeId);
        if (member?.telegram_id || member?.telegramId) {
          telegramId = member.telegram_id || member.telegramId;
        }
      } catch (_) {}
    }

    if (telegramId) {
      if (typeof botService.sendTelegramNotification === 'function') {
        await botService.sendTelegramNotification(telegramId, text, null, false);
      } else {
        const teamBot = botService.getTeamBot ? botService.getTeamBot() : null;
        if (teamBot) {
          await teamBot.sendMessage(telegramId, text, { parse_mode: 'Markdown' }).catch(() => {});
        }
      }
    }
  } catch (notifErr) {
    console.warn('[Leave Callback] Notify employee warning:', notifErr.message);
  }
}

/**
 * Forward leave request to Owner with inline action buttons
 */
async function forwardToOwner(leaveId, targetLeave, staffName, leaveType, dates) {
  try {
    let ownerTelegramId = null;

    if (isSupabaseConfigured()) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('telegram_id')
        .ilike('access_level', '%owner%')
        .maybeSingle();
      if (owner?.telegram_id) ownerTelegramId = owner.telegram_id;
    }

    if (!ownerTelegramId) {
      try {
        const db = await readDB();
        const owner = (db.team || []).find(m =>
          (m.role || '').toLowerCase().includes('founder') ||
          (m.role || '').toLowerCase().includes('director') ||
          (m.accessLevel || m.access_level || '').toLowerCase().includes('owner')
        );
        if (owner?.telegramId || owner?.telegram_id) {
          ownerTelegramId = owner.telegramId || owner.telegram_id;
        }
      } catch (_) {}
    }

    if (!ownerTelegramId) {
      ownerTelegramId = process.env.OWNER_TELEGRAM_ID;
    }

    if (ownerTelegramId) {
      const ownerMsg =
        `🌴 *LEAVE: Manager Approved → Owner Final Sign-Off*\n\n` +
        `• Employee: *${staffName}*\n` +
        `• Type: *${leaveType}*\n` +
        `• Dates: *${dates}*\n` +
        `• Total Days: *${targetLeave.total_days || 1}*\n` +
        `• Reason: _${targetLeave.reason || 'Not specified'}_\n\n` +
        `_Tap below for final approval:_`;

      const buttons = [
        [{ text: '👑 Final Approve (Owner)', callback_data: `approve_leave_owner:${leaveId}` }],
        [{ text: '❌ Decline', callback_data: `reject_leave:${leaveId}` }]
      ];

      if (typeof botService.sendTelegramNotification === 'function') {
        await botService.sendTelegramNotification(ownerTelegramId, ownerMsg, buttons, true);
      } else {
        const teamBot = botService.getTeamBot ? botService.getTeamBot() : null;
        if (teamBot) {
          await teamBot.sendMessage(ownerTelegramId, ownerMsg, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          }).catch(() => {});
        }
      }
    }
  } catch (ownerErr) {
    console.warn('[Leave Callback] Forward to owner warning:', ownerErr.message);
  }
}

/**
 * Strip inline buttons from query message and attach audit banner
 */
async function removeMessageButtons(bot, query, auditBanner) {
  const chatId = query.message?.chat?.id || query.from?.id;
  const messageId = query.message?.message_id;

  if (!chatId || !messageId) return;

  try {
    const existingText = query.message?.text || '';
    const updatedText = existingText ? `${existingText}\n\n${auditBanner}` : auditBanner;

    if (typeof bot.editMessageText === 'function') {
      await bot.editMessageText(updatedText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] }
      }).catch(async () => {
        if (typeof bot.editMessageReplyMarkup === 'function') {
          await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: chatId,
            message_id: messageId
          }).catch(() => {});
        }
      });
    } else if (typeof bot.editMessageReplyMarkup === 'function') {
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: messageId
      }).catch(() => {});
    }
  } catch (_) {}
}

module.exports = {
  isUuid,
  handleLeaveCallback,
  handleLeaveApprove,
  handleLeaveReject,
  deductLeaveBalance,
  notifyEmployee,
  forwardToOwner,
  removeMessageButtons
};
