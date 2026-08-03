/**
 * src/services/bot/handlers/tasks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User Task Listing and Assignment Status Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handleMyTasks(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);
  }

  let tasks = [];
  if (supabase) {
    const firstName = (emp.name || '').split(' ')[0];
    const { data } = await supabase.from('tasks').select('*').ilike('assignee', `%${firstName}%`);
    tasks = data || [];
  }

  let message = `📋 *Assigned Shoots & Tasks for ${emp.name}:*\n\n`;
  if (tasks.length === 0) {
    message += `No active task assignments found right now.`;
  } else {
    tasks.forEach((t, index) => {
      message += `${index + 1}. *${t.title}*\n   Client: ${t.client} | Stage: *${t.stage || t.status}* | Due: ${t.due_date || t.dueDate || 'ASAP'}\n\n`;
    });
  }
  teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

module.exports = {
  handleMyTasks
};
