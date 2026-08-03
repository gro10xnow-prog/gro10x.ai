/**
 * src/services/bot/handlers/eod.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-Of-Day Report Interactive Wizard Handler.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { getRoleKeyboard } = require('../keyboards');

async function handleInitEOD(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

  const sess = { action: 'await_eod_summary', empId: emp.emp_code, empName: emp.name };
  await state.setSession(chatId, sess);

  teamBot.sendMessage(chatId,
    `📝 *END-OF-DAY REPORT*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
    `Please reply with a *brief summary* of what you accomplished today:\n\n` +
    `_(Example: Completed 3 social posts for Client X, attended strategy call, submitted revised deck)_`,
    { parse_mode: 'Markdown' }
  );
}

async function handleEODWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (wizardState.action === 'await_eod_summary') {
    const summaryText = text;
    await state.submitEOD(emp.emp_code, emp.name, {
      done: summaryText,
      tomorrow: 'Standard daily tasks',
      blockers: 'None',
      mood: '😊 Energized',
      hours: 8
    });

    await state.clearSession(chatId);

    return teamBot.sendMessage(chatId,
      `✅ *EOD Report Submitted!*\n\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n` +
      `📝 "${summaryText.substring(0, 100)}${summaryText.length > 100 ? '...' : ''}"\n\n` +
      `Thank you for your update. Saved to Supabase! 💜`,
      { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
    );
  }
}

module.exports = {
  handleInitEOD,
  handleEODWizardStep
};
