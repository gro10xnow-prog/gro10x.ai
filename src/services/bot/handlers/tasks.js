/**
 * src/services/bot/handlers/tasks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User Task Listing and Assignment Status Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');
const { WORKFLOW_MAP, getTaskStages } = require('../../../utils/workflows');

async function handleMyTasks(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);
    }

    let tasks = [];
    if (supabase) {
      const empCode = emp.emp_code || emp.id;
      const firstName = (emp.name || '').split(' ')[0];

      // F3-8: Query by assignee_id (employee code) or name fallback
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`)
        .not('stage', 'in', '("Done","Completed","Cancelled")')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      tasks = data || [];
    }

    if (tasks.length === 0) {
      const options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 Open Task Board', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=tasks' } },
              { text: '➕ Create Task', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=tasks&action=new' } }
            ]
          ]
        }
      };
      return teamBot.sendMessage(chatId, `📋 *Assigned Shoots & Tasks for ${emp.name}:*\n\nNo active task assignments found right now.`, options);
    }

    // Send summary header
    teamBot.sendMessage(chatId, `📋 *Assigned Shoots & Tasks for ${emp.name} (${tasks.length} Active):*`, { parse_mode: 'Markdown' });

    // Send individual task cards with 1-tap action buttons
    for (const [index, t] of tasks.entries()) {
      const stages = getTaskStages(t);
      const currStage = t.stage || stages[0];
      const currIdx = stages.indexOf(currStage);
      const nextStage = currIdx >= 0 && currIdx < stages.length - 1 ? stages[currIdx + 1] : null;

      let cardText = `${index + 1}. *${t.title}*\n`;
      cardText += `🏢 Client: *${t.client || 'Agency'}*\n`;
      cardText += `📌 Stage: *${currStage}*\n`;
      cardText += `📅 Due: ${t.due_date || t.dueDate || 'ASAP'}`;

      const inlineRow = [];
      if (nextStage) {
        inlineRow.push({ text: `→ Move to ${nextStage}`, callback_data: `task_advance:${t.id}:${nextStage}` });
      }
      inlineRow.push({ text: '📱 Details', web_app: { url: `https://gro10x-ai.vercel.app/team-miniapp?tab=tasks&taskId=${t.id}` } });

      const inlineRows = [inlineRow];
      inlineRows.push([{ text: '🤖 AI Brief Summary', callback_data: `ai_brief:${t.id}` }]);

      teamBot.sendMessage(chatId, cardText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineRows }
      });
    }
  } catch (err) {
    console.error('[Tasks Bot] handleMyTasks error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch active tasks.');
  }
}

module.exports = {
  handleMyTasks
};
