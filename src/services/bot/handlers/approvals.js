/**
 * src/services/bot/handlers/approvals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pending Approvals Dashboard Handler (Leaves, Expenses, Tasks in Review).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handlePendingApprovals(teamBot, msg) {
  const chatId = msg.chat.id;

  let pendingLeaves = [];
  let pendingExpenses = [];
  let pendingTasks = [];

  if (supabase) {
    try {
      const [lRes, eRes, tRes] = await Promise.all([
        supabase.from('leaves').select('*').or('status.eq.Pending,status.ilike.%Review%'),
        supabase.from('expenses').select('*').neq('status', 'Disbursed'),
        supabase.from('tasks').select('*').ilike('stage', '%Review%')
      ]);
      pendingLeaves = lRes.data || [];
      pendingExpenses = eRes.data || [];
      pendingTasks = tRes.data || [];
    } catch (err) {
      console.error('Pending Approvals DB Error:', err.message);
    }
  }

  let text = `✍️ *PENDING APPROVALS DASHBOARD*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

  text += `🌴 *Leave Requests (${pendingLeaves.length}):*\n`;
  if (pendingLeaves.length === 0) {
    text += `   ✅ No pending leave requests\n\n`;
  } else {
    pendingLeaves.forEach((l, i) => {
      text += `   ${i + 1}. *${l.employee_name || l.name || 'Staff'}* — ${l.leave_type || 'Leave'} (${l.start_date || 'TBD'})\n`;
    });
    text += `\n`;
  }

  text += `💸 *Expense Claims (${pendingExpenses.length}):*\n`;
  if (pendingExpenses.length === 0) {
    text += `   ✅ No pending expense claims\n\n`;
  } else {
    pendingExpenses.forEach((e, i) => {
      text += `   ${i + 1}. *${e.submitted_by || e.employee_name || 'Staff'}* — BDT ${(Number(e.amount) || 0).toLocaleString()} (${e.category || 'General'})\n`;
    });
    text += `\n`;
  }

  text += `🎬 *Tasks In Review (${pendingTasks.length}):*\n`;
  if (pendingTasks.length === 0) {
    text += `   ✅ No tasks awaiting review\n`;
  } else {
    pendingTasks.forEach((t, i) => {
      text += `   ${i + 1}. *${t.title}* — ${t.client || 'General'} (${t.stage})\n`;
    });
  }

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

module.exports = {
  handlePendingApprovals
};
