/**
 * src/services/bot/handlers/agreement-callbacks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Employment Agreement Callback Handlers.
 * Handles `agr_stage2:{empId}` and `agr_stage3:{empId}` inline buttons.
 * Wires:
 * - Supabase profiles update (agreement_stage: 2, agreement_stage: 3, agreement_complete: true)
 * - data/db.json persistence & offline fallback via readDB / writeDB
 * - Real-time SSE team_update broadcasts
 * - Telegram notification chaining (Stage 2 -> Owner seal; Stage 3 -> Employee activation)
 * - Dynamic keyboard upgrade for activated employees
 * - Inline keyboard button removal and audit banner to prevent double-taps
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
 * Main dispatcher for agreement callback queries
 */
async function handleAgreementCallback(bot, query) {
  const data = query.data || '';

  if (data.startsWith('agr_stage2:')) {
    const empId = data.replace('agr_stage2:', '').trim();
    return handleAgreementStage2(bot, query, empId);
  }

  if (data.startsWith('agr_stage3:')) {
    const empId = data.replace('agr_stage3:', '').trim();
    return handleAgreementStage3(bot, query, empId);
  }
}

/**
 * Handle Stage 2: Finance Manager Countersignature
 */
async function handleAgreementStage2(bot, query, empId) {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  // 1. Immediately dismiss loading spinner
  try {
    await bot.answerCallbackQuery(queryId, { text: '✍️ Countersigning Agreement...' });
  } catch (_) {}

  try {
    const verifier = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || { name: 'Finance Manager', emp_code: 'FINANCE' };
    const verifierName = verifier?.name || 'Finance Manager';

    // 2. Fetch target profile
    let targetProfile = null;
    if (isSupabaseConfigured()) {
      let q = supabase.from('profiles').select('*');
      if (isUuid(empId)) {
        q = q.eq('id', empId);
      } else {
        q = q.eq('emp_code', empId);
      }
      const { data, error } = await q.maybeSingle();
      if (!error && data) targetProfile = data;
    }

    if (!targetProfile) {
      try {
        const db = await readDB();
        targetProfile = (db.team || []).find(m => m.emp_code === empId || m.id === empId);
      } catch (_) {}
    }

    if (!targetProfile) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Employee profile \`${empId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    // 3. Idempotency check
    if (targetProfile.agreement_stage >= 2) {
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `ℹ️ Agreement for *${targetProfile.name}* (${targetProfile.emp_code || empId}) has already been countersigned (Stage ${targetProfile.agreement_stage}).`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
      await removeMessageButtons(bot, query, `✅ *ALREADY COUNTERSIGNED (Stage ${targetProfile.agreement_stage})*`);
      return;
    }

    const now = new Date().toISOString();

    // 4. Update Supabase profiles
    if (isSupabaseConfigured()) {
      const updatePayload = {
        agreement_stage: 2,
        updated_at: now
      };
      let q = supabase.from('profiles').update(updatePayload);
      if (targetProfile.emp_code) {
        q = q.eq('emp_code', targetProfile.emp_code);
      } else if (isUuid(empId)) {
        q = q.eq('id', empId);
      } else {
        q = q.eq('emp_code', empId);
      }
      await q;
    }

    // 5. Update disk DB / db.json
    let dbData = { team: [] };
    try {
      const db = await readDB();
      dbData = db;
      if (Array.isArray(db.team)) {
        const idx = db.team.findIndex(m => m.emp_code === empId || m.id === empId || m.emp_code === targetProfile.emp_code);
        if (idx !== -1) {
          db.team[idx].agreement_stage = 2;
          db.team[idx].updated_at = now;
          await writeDB(db);
        }
      }
    } catch (_) {}

    // 6. Real-time SSE broadcast
    sse.broadcast('team_update', [{
      id: targetProfile.id || empId,
      emp_code: targetProfile.emp_code || empId,
      agreement_stage: 2,
      onboarding_complete: targetProfile.onboarding_complete || false
    }]);

    // 7. Dispatch Agreement Notification Chaining (notifies Owner for Stage 3 & Employee)
    try {
      if (typeof botService.sendAgreementNotification === 'function') {
        await botService.sendAgreementNotification(2, targetProfile, dbData);
      }
    } catch (notifErr) {
      console.warn('[Agreement Callback Stage 2 Notification Warning]:', notifErr.message);
    }

    // 8. Update Telegram message: remove inline buttons & append audit banner
    await removeMessageButtons(
      bot,
      query,
      `✅ *COUNTERSIGNED as Finance Manager by ${verifierName} on ${new Date().toLocaleDateString('en-GB')}*`
    );

    // 9. Send confirmation to operator
    if (chatId) {
      await bot.sendMessage(
        chatId,
        `✅ *Agreement Countersigned!* Stage 2 complete for *${targetProfile.name}* (${targetProfile.emp_code || empId}).\n` +
        `Forwarded to Managing Director / Owner for final seal & activation.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  } catch (err) {
    console.error('[Agreement Callback Stage 2 Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error countersigning agreement: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Handle Stage 3: Owner Final Seal & Employee Activation
 */
async function handleAgreementStage3(bot, query, empId) {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  // 1. Immediately dismiss loading spinner
  try {
    await bot.answerCallbackQuery(queryId, { text: '👑 Applying Owner Seal & Activating...' });
  } catch (_) {}

  try {
    const verifier = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || { name: 'Owner / Managing Director', emp_code: 'PBD-001' };
    const verifierName = verifier?.name || 'Owner / Managing Director';

    // 2. Fetch target profile
    let targetProfile = null;
    if (isSupabaseConfigured()) {
      let q = supabase.from('profiles').select('*');
      if (isUuid(empId)) {
        q = q.eq('id', empId);
      } else {
        q = q.eq('emp_code', empId);
      }
      const { data, error } = await q.maybeSingle();
      if (!error && data) targetProfile = data;
    }

    if (!targetProfile) {
      try {
        const db = await readDB();
        targetProfile = (db.team || []).find(m => m.emp_code === empId || m.id === empId);
      } catch (_) {}
    }

    if (!targetProfile) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Employee profile \`${empId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    // 3. Idempotency check
    if (targetProfile.agreement_stage >= 3 && (targetProfile.onboarding_complete || targetProfile.agreement_complete)) {
      if (chatId) {
        await bot.sendMessage(
          chatId,
          `ℹ️ Employee *${targetProfile.name}* (${targetProfile.emp_code || empId}) is already fully activated with Stage 3 seal.`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
      await removeMessageButtons(bot, query, `👑 *ALREADY SEALED & ACTIVATED*`);
      return;
    }

    const now = new Date().toISOString();

    // 4. Update Supabase profiles
    if (isSupabaseConfigured()) {
      const updatePayload = {
        agreement_stage: 3,
        agreement_complete: true,
        onboarding_complete: true,
        updated_at: now
      };

      const getUpdateQuery = (payload) => {
        let q = supabase.from('profiles').update(payload);
        if (targetProfile.emp_code) return q.eq('emp_code', targetProfile.emp_code);
        if (isUuid(empId)) return q.eq('id', empId);
        return q.eq('emp_code', empId);
      };

      const { error: updateErr } = await getUpdateQuery(updatePayload);
      if (updateErr) {
        delete updatePayload.onboarding_complete;
        await getUpdateQuery(updatePayload);
      }
    }

    // 5. Update disk DB / db.json
    let dbData = { team: [] };
    try {
      const db = await readDB();
      dbData = db;
      if (Array.isArray(db.team)) {
        const idx = db.team.findIndex(m => m.emp_code === empId || m.id === empId || m.emp_code === targetProfile.emp_code);
        if (idx !== -1) {
          db.team[idx].agreement_stage = 3;
          db.team[idx].agreement_complete = true;
          db.team[idx].onboarding_complete = true;
          db.team[idx].onboardingComplete = true;
          db.team[idx].updated_at = now;
          await writeDB(db);
        }
      }
    } catch (_) {}

    // 6. Real-time SSE broadcast
    sse.broadcast('team_update', [{
      id: targetProfile.id || empId,
      emp_code: targetProfile.emp_code || empId,
      agreement_stage: 3,
      onboarding_complete: true
    }]);

    // 7. Dispatch Agreement Notification Chaining (sends activation message and upgrades role keyboard)
    try {
      if (typeof botService.sendAgreementNotification === 'function') {
        await botService.sendAgreementNotification(3, {
          ...targetProfile,
          onboardingComplete: true,
          onboarding_complete: true,
          agreement_complete: true
        }, dbData);
      }
    } catch (notifErr) {
      console.warn('[Agreement Callback Stage 3 Notification Warning]:', notifErr.message);
    }

    // 8. Update Telegram message: remove inline buttons & append audit banner
    await removeMessageButtons(
      bot,
      query,
      `👑 *FINAL SEAL APPLIED & ACTIVATED by ${verifierName} on ${new Date().toLocaleDateString('en-GB')}*`
    );

    // 9. Send confirmation to operator
    if (chatId) {
      await bot.sendMessage(
        chatId,
        `👑 *Employee Fully Activated!*\n` +
        `• Name: *${targetProfile.name}* (${targetProfile.emp_code || empId})\n` +
        `• Role: *${targetProfile.role || 'Specialist'}*\n` +
        `• Department: *${targetProfile.department || 'Production'}*\n\n` +
        `Corporate seal recorded. All workspace engines and full keyboard commands unlocked.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  } catch (err) {
    console.error('[Agreement Callback Stage 3 Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error sealing agreement: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Helper to update message text and strip inline keyboard buttons
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
  handleAgreementCallback,
  handleAgreementStage2,
  handleAgreementStage3,
  removeMessageButtons
};
