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
  if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please send your contact via the Verify button first.`, { parse_mode: 'Markdown' });

  const sess = { action: 'await_eod_summary', empId: emp.emp_code, empName: emp.name };
  await state.setSession(chatId, sess);

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📱 Open EOD Report Form (Mini App)', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=eod&action=new' } }
        ]
      ]
    }
  };

  teamBot.sendMessage(chatId,
    `📝 *END-OF-DAY REPORT*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
    `Tap **Open EOD Report Form** below for the full Mini App form (tasks, blockers, plan & mood rating).\n\n` +
    `_Or simply reply here with a brief summary of what you accomplished today:_`,
    options
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
