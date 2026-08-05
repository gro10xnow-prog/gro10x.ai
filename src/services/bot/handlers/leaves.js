/**
 * src/services/bot/handlers/leaves.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Leave Request Interactive Wizard Handler.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { getRoleKeyboard } = require('../keyboards');

async function handleInitLeave(teamBot, msg) {
  const chatId = msg.chat.id;
  let emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    try {
      const { readDB } = require('../../jsonDb');
      const dbData = await readDB();
      const raw = (dbData.team || []).find(e => String(e.telegramId) === String(chatId) || String(e.telegram_id) === String(chatId));
      if (raw) emp = { emp_code: raw.emp_code || raw.id, name: raw.name, reportsTo: raw.reportsTo, accessLevel: raw.accessLevel || 'Specialist / Crew' };
    } catch(e) {}
  }
  if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

  const sess = { action: 'await_leave_type', empId: emp.emp_code, empName: emp.name, reportsTo: emp.reportsTo };
  await state.setSession(chatId, sess);

  teamBot.sendMessage(chatId,
    `🌴 *LEAVE REQUEST*\n\n` +
    `Please select leave type by replying:\n\n` +
    `1️⃣ Casual Leave\n` +
    `2️⃣ Sick Leave\n` +
    `3️⃣ Half Day\n\n` +
    `Reply with \`1\`, \`2\`, or \`3\``,
    { parse_mode: 'Markdown' }
  );
}

async function handleLeaveWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (wizardState.action === 'await_leave_type') {
    const leaveTypes = { '1': 'Casual Leave', '2': 'Sick Leave', '3': 'Half Day' };
    const leaveType = leaveTypes[text];
    if (!leaveType) {
      return teamBot.sendMessage(chatId, `⚠️ Please reply with \`1\`, \`2\`, or \`3\`.`, { parse_mode: 'Markdown' });
    }
    const nextState = { ...wizardState, leaveType, action: 'await_leave_date' };
    await state.setSession(chatId, nextState);
    return teamBot.sendMessage(chatId,
      `📅 Leave Type: *${leaveType}*\n\nPlease reply with the *date* (e.g. \`Aug 5\` or \`2026-08-05\`):`,
      { parse_mode: 'Markdown' }
    );
  }

  if (wizardState.action === 'await_leave_date') {
    const dateStr = text;
    const newLeave = await state.submitLeave(emp.emp_code, emp.name, {
      leaveType: wizardState.leaveType,
      startDate: dateStr,
      endDate: dateStr,
      totalDays: 1,
      reason: `Leave request for ${dateStr}`
    });

    await state.clearSession(chatId);

    const manager = await state.getEmployeeByTelegramId(emp.reportsTo);
    if (manager && manager.telegramId) {
      try {
        teamBot.sendMessage(manager.telegramId,
          `🌴 *NEW LEAVE REQUEST*\n\n` +
          `From: *${emp.name}*\n` +
          `Type: *${wizardState.leaveType}*\n` +
          `Date: *${dateStr}*\n\n` +
          `_Approve or reject via the Pending Approvals button._`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    }

    return teamBot.sendMessage(chatId,
      `✅ *Leave Request Submitted!*\n\n` +
      `• Type: *${wizardState.leaveType}*\n` +
      `• Date: *${dateStr}*\n` +
      `• Status: *Pending Line Review*\n\n` +
      `Your manager ${manager ? `(*${manager.name}*)` : ''} has been notified.`,
      { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
    );
  }
}

module.exports = {
  handleInitLeave,
  handleLeaveWizardStep
};
