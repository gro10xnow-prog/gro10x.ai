/**
 * src/services/bot/handlers/eod.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-Of-Day Report Interactive Wizard & History Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { supabase } = require('../../supabase');

async function handleInitEOD(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please send your contact via the Verify button first.`, { parse_mode: 'Markdown' });

    const empCode = emp.emp_code || emp.id;
    const firstName = (emp.name || '').split(' ')[0];
    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

    let todayCompletedTasks = [];
    if (supabase) {
      const { data: completed } = await supabase
        .from('tasks')
        .select('id, title, stage')
        .or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`)
        .in('stage', ['Done', 'Completed', 'Approved', 'Published', 'Deployed', 'Internal QC'])
        .gte('updated_at', todayStart)
        .limit(5);
      todayCompletedTasks = completed || [];
    }

    if (todayCompletedTasks.length > 0) {
      const taskList = todayCompletedTasks.map(t => `• *${t.title}* (${t.stage})`).join('\n');
      const autoSummary = `Completed/advanced ${todayCompletedTasks.length} task${todayCompletedTasks.length > 1 ? 's' : ''}: ${todayCompletedTasks.map(t => t.title).join(', ')}.`;

      await state.setSession(chatId, {
        action: 'await_eod_autofill',
        empId: empCode,
        empName: emp.name,
        autoSummary
      });

      return teamBot.sendMessage(chatId,
        `📝 *SMART EOD — Daily Accomplishments Detected*\n\n` +
        `🎯 *Work updated today:*\n${taskList}\n\n` +
        `Would you like to pre-fill your EOD summary with this work?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Yes, pre-fill summary', callback_data: 'eod_autofill:yes' },
                { text: '✏️ Type manually', callback_data: 'eod_autofill:no' }
              ],
              [
                { text: '📱 Open EOD Form (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=eod&action=new' } }
              ]
            ]
          }
        }
      );
    }

    const sess = { action: 'await_eod_summary', empId: emp.emp_code, empName: emp.name };
    await state.setSession(chatId, sess);

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Open EOD Report Form (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=eod&action=new' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId,
      `📝 *END-OF-DAY REPORT (Step 1/3)*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
      `Tap **Open EOD Report Form** for full Mini App submission,\n` +
      `_or simply reply here with a brief summary of what you accomplished today:_`,
      options
    );
  } catch (err) {
    console.error('[EOD Bot] handleInitEOD error:', err.message);
    await state.clearSession(chatId).catch(() => {});
    teamBot.sendMessage(chatId, '⚠️ Could not start EOD report wizard. Please try again.');
  }
}

async function handleEODWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    if (wizardState.action === 'await_eod_summary') {
      await state.setSession(chatId, {
        ...wizardState,
        action: 'await_eod_blockers',
        summary: text
      });

      return teamBot.sendMessage(chatId,
        `📝 *END-OF-DAY REPORT (Step 2/3)*\n\n` +
        `Summary logged: _"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"_\n\n` +
        `Any blockers or challenges faced today? (Reply with text, or reply **none** if clear):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_eod_blockers') {
      const summaryText = wizardState.summary || 'Daily tasks completed';
      const blockersText = text;

      await state.setSession(chatId, {
        ...wizardState,
        action: 'await_eod_mood',
        summary: summaryText,
        blockers: blockersText
      });

      return teamBot.sendMessage(chatId,
        `📝 *END-OF-DAY REPORT (Step 3/3)*\n\n` +
        `How was your energy and mood today? Select an option below:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '😊 Energized', callback_data: 'eod_mood:😊 Energized' },
                { text: '🔥 Fired Up', callback_data: 'eod_mood:🔥 Fired Up' }
              ],
              [
                { text: '😐 Neutral', callback_data: 'eod_mood:😐 Neutral' },
                { text: '😓 Stressed', callback_data: 'eod_mood:😓 Stressed' }
              ],
              [
                { text: '😴 Tired', callback_data: 'eod_mood:😴 Tired' }
              ]
            ]
          }
        }
      );
    }

    if (wizardState.action === 'await_eod_mood') {
      return teamBot.sendMessage(chatId,
        `⚠️ *Please select your mood from the options below to complete your EOD report:*`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '😊 Energized', callback_data: 'eod_mood:😊 Energized' },
                { text: '🔥 Fired Up', callback_data: 'eod_mood:🔥 Fired Up' }
              ],
              [
                { text: '😐 Neutral', callback_data: 'eod_mood:😐 Neutral' },
                { text: '😓 Stressed', callback_data: 'eod_mood:😓 Stressed' }
              ],
              [
                { text: '😴 Tired', callback_data: 'eod_mood:😴 Tired' }
              ]
            ]
          }
        }
      );
    }
  } catch (err) {
    console.error('[EOD Bot] handleEODWizardStep error:', err.message);
    await state.clearSession(chatId).catch(() => {});
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
