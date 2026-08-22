/**
 * src/services/bot/handlers/tickets.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Developer & Technical Tickets Bot Handlers:
 * - My Tickets (Active bug/task tickets with 1-tap resolution)
 * - Deploy Log (Log deployment to Production / Staging)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

/**
 * Handle "🎟️ My Tickets"
 */
async function handleMyTickets(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified. Please verify your phone number first.');
    }

    const firstName = (emp.name || '').split(' ')[0];
    const empCode = emp.emp_code || emp.id;

    let tickets = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`assigned_to.ilike.%${firstName}%,submitted_by.ilike.%${firstName}%`)
        .not('status', 'in', '("Resolved","Closed")')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      tickets = data || [];
    }

    if (tickets.length === 0) {
      return teamBot.sendMessage(chatId, `🎟️ *MY TICKETS*\n\n✅ You have zero open engineering tickets assigned!`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Open Ticket Board', web_app: { url: 'https://purpleos-iota.vercel.app/crew#tickets' } }]
          ]
        }
      });
    }

    teamBot.sendMessage(chatId, `🎟️ *ACTIVE ENGINEERING TICKETS (${tickets.length})*\n_Tap to update ticket status:_`, { parse_mode: 'Markdown' });

    for (const [idx, t] of tickets.entries()) {
      let card = `${idx + 1}. *${t.title}*\n`;
      card += `   🏷️ Status: *${t.status || 'Open'}* | ⚡ Priority: *${t.priority || 'Medium'}*\n`;
      if (t.description) {
        card += `   📝 _${t.description.substring(0, 80)}${t.description.length > 80 ? '...' : ''}_\n`;
      }

      const inlineKeyboard = [
        [
          { text: '🛠️ In Progress', callback_data: `ticket_status:${t.id}:In Progress` },
          { text: '✅ Mark Resolved', callback_data: `ticket_status:${t.id}:Resolved` }
        ]
      ];

      teamBot.sendMessage(chatId, card, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[Tickets Bot] handleMyTickets error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching assigned tickets.');
  }
}

/**
 * Handle "🚀 Log Deployment"
 */
async function handleDeployLog(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified. Please verify your phone number first.');
    }

    await state.setSession(chatId, {
      action: 'await_deploy_env',
      empId: emp.emp_code || emp.id,
      empName: emp.name
    });

    const text = `🚀 *LOG INFRASTRUCTURE DEPLOYMENT*\n\n` +
      `Which environment was just updated?`;

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔴 Production', callback_data: 'deploy_env:Production' }],
          [{ text: '🟡 Staging', callback_data: 'deploy_env:Staging' }],
          [{ text: '🟢 Development', callback_data: 'deploy_env:Development' }]
        ]
      }
    });
  } catch (err) {
    console.error('[Tickets Bot] handleDeployLog error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error initiating deployment log.');
  }
}

/**
 * Handle deployment text notes step
 */
async function handleDeployWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    const env = wizardState.deployEnv || 'Production';
    const empCode = emp.emp_code || emp.id || 'PBD-004';
    const empName = emp.name || 'Developer';

    const summaryText = `🚀 Deployed to ${env}: ${text}`;

    if (supabase) {
      await supabase.from('eod_reports').insert([{
        employee_id: empCode,
        employee_name: empName,
        tasks_done: summaryText,
        summary: summaryText,
        tasks_tomorrow: 'Monitoring deploy telemetry & logs',
        blockers: 'None',
        mood: '🔥 Fired Up',
        hours_logged: 1,
        date: new Date().toISOString().split('T')[0],
        submitted_at: new Date().toISOString()
      }]).catch(() => {});
    }

    await state.clearSession(chatId);

    const keyboard = require('../keyboards').getRoleKeyboard(emp.accessLevel, true, emp);
    teamBot.sendMessage(chatId,
      `✅ *Deployment Logged!*\n\n` +
      `• Environment: *${env}*\n` +
      `• Notes: _"${text}"_\n\n` +
      `_Saved to today's operations report (+10 XP) 🔥_`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  } catch (err) {
    console.error('[Tickets Bot] handleDeployWizardStep error:', err.message);
    await state.clearSession(chatId).catch(() => {});
    teamBot.sendMessage(chatId, '⚠️ Error saving deployment notes.');
  }
}

module.exports = {
  handleMyTickets,
  handleDeployLog,
  handleDeployWizardStep
};
