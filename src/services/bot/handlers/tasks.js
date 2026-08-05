/**
 * src/services/bot/handlers/tasks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User Task Listing and Assignment Status Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

const WORKFLOW_MAP = {
  'social': ['Draft', 'Graphic Design', 'Copy Review', 'Scheduled', 'Published'],
  'branding': ['Strategy', 'Concepts', 'Client Refinement', 'Master Delivered'],
  'video': ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved']
};

function getTaskStages(task) {
  const category = (task.category || task.workflow_type || task.department || task.title || '').toLowerCase();
  if (category.includes('social') || category.includes('posm')) return WORKFLOW_MAP['social'];
  if (category.includes('brand') || category.includes('identity')) return WORKFLOW_MAP['branding'];
  return WORKFLOW_MAP['video'];
}

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

  if (tasks.length === 0) {
    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Open Task Board', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=tasks' } },
            { text: '➕ Create Task', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=tasks&action=new' } }
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
    inlineRow.push({ text: '📱 Details', web_app: { url: `https://purpleos-iota.vercel.app/team-miniapp?tab=tasks&taskId=${t.id}` } });

    teamBot.sendMessage(chatId, cardText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [inlineRow] }
    });
  }
}

module.exports = {
  handleMyTasks
};
