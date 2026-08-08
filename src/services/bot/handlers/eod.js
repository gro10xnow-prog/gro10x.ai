/**
 * src/services/bot/handlers/eod.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-Of-Day Report Interactive Wizard & History Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { supabase } = require('../../supabase');
const { getRoleKeyboard } = require('../keyboards');

async function handleInitEOD(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
      `📝 *END-OF-DAY REPORT (Step 1/2)*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
      `Tap **Open EOD Report Form** for full Mini App submission,\n` +
      `_or simply reply here with a brief summary of what you accomplished today:_`,
      options
    );
  } catch (err) {
    console.error('[EOD Bot] handleInitEOD error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not start EOD report wizard. Please try again.');
  }
}

async function handleEODWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    if (wizardState.action === 'await_eod_summary') {
      await state.setSession(chatId, {
        action: 'await_eod_blockers',
        empId: emp.emp_code,
        empName: emp.name,
        summary: text
      });

      return teamBot.sendMessage(chatId,
        `📝 *END-OF-DAY REPORT (Step 2/2)*\n\n` +
        `Summary logged: _"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"_\n\n` +
        `Any blockers or challenges faced today? (Reply with text, or reply **none** if clear):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_eod_blockers') {
      const summaryText = wizardState.summary || 'Daily tasks completed';
      const blockersText = text;

      await state.submitEOD(emp.emp_code, emp.name, {
        done: summaryText,
        tomorrow: 'Standard daily tasks',
        blockers: blockersText,
        mood: '😊 Energized',
        hours: 8
      });

      await state.clearSession(chatId);

      return teamBot.sendMessage(chatId,
        `✅ *EOD Report Submitted!* (+10 XP)\n\n` +
        `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n` +
        `📝 *Summary:* "${summaryText.substring(0, 80)}${summaryText.length > 80 ? '...' : ''}"\n` +
        `🚧 *Blockers:* "${blockersText}"\n\n` +
        `Saved to database! 💜`,
        { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
      );
    }
  } catch (err) {
    console.error('[EOD Bot] handleEODWizardStep error:', err.message);
    await state.clearSession(chatId);
    teamBot.sendMessage(chatId, '⚠️ Failed to record EOD report. Please try again.');
  }
}

async function handleMyEODHistory(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

    const empCode = emp.emp_code || emp.id;
    const { data: eods, error } = await supabase
      .from('eod_reports')
      .select('*')
      .eq('employee_id', empCode)
      .order('created_at', { ascending: false })
      .limit(7);

    if (error) throw error;

    if (!eods || eods.length === 0) {
      return teamBot.sendMessage(chatId, `📝 *Your EOD History*\n\nNo EOD reports logged yet. Use /eod to submit your first report!`, { parse_mode: 'Markdown' });
    }

    let reportMsg = `📝 *Your Last ${eods.length} EOD Reports*\n\n`;
    eods.forEach(e => {
      const d = e.date || (e.created_at ? e.created_at.split('T')[0] : 'Recent');
      reportMsg += `📅 *${d}*\n`;
      reportMsg += `• Summary: ${e.text || e.summary || 'Completed tasks'}\n`;
      if (e.blockers && e.blockers.toLowerCase() !== 'none') {
        reportMsg += `• Blockers: ⚠️ ${e.blockers}\n`;
      }
      reportMsg += `\n`;
    });

    teamBot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[EOD Bot] handleMyEODHistory error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch EOD history.');
  }
}

module.exports = {
  handleInitEOD,
  handleEODWizardStep,
  handleMyEODHistory
};
