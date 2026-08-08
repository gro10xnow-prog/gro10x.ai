/**
 * src/services/bot/handlers/mystats.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Personal Quick Dashboard Command Handler (/status).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handleStatus(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

    const empCode = emp.emp_code || emp.id;
    const empName = emp.name || '';
    const firstName = empName.split(' ')[0] || '';
    const today = new Date().toISOString().split('T')[0];

    // Fetch Today's Attendance, Open Tasks, and Pending Leaves in parallel
    const [attRes, tasksRes, leavesRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('employee_id', empCode).eq('date', today).maybeSingle(),
      supabase.from('tasks').select('id, title, stage, due_date').or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`).neq('stage', 'Done').neq('stage', 'Completed'),
      supabase.from('leaves').select('id, status, leave_type').eq('employee_id', empCode).eq('status', 'Pending')
    ]);

    const att = attRes.data;
    const tasks = tasksRes.data || [];
    const pendingLeaves = leavesRes.data || [];

    const attStatus = att ? `✅ Clocked In (${att.clock_in_time || 'In Studio'})` : `❌ Not Clocked In Today`;
    const openTasksCount = tasks.length;
    const pendingLeavesCount = pendingLeaves.length;
    const xpVal = Number(emp.xp) || 0;
    const badge = emp.badge || '🌱 Recruit';

    const dashMsg =
      `📊 *YOUR PERSONAL DASHBOARD*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
      `👤 *${empName}* (${emp.role || 'Team Specialist'})\n` +
      `⏰ *Attendance:* ${attStatus}\n` +
      `📋 *Open Tasks:* ${openTasksCount} active task${openTasksCount !== 1 ? 's' : ''}\n` +
      `🌴 *Pending Leaves:* ${pendingLeavesCount} request${pendingLeavesCount !== 1 ? 's' : ''}\n` +
      `🏆 *XP & Badge:* ${xpVal.toLocaleString()} XP (${badge})\n\n` +
      `_Type /mytasks for task details or /leave for leave requests._`;

    teamBot.sendMessage(chatId, dashMsg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Status Bot] handleStatus error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch personal dashboard status.');
  }
}

module.exports = {
  handleStatus
};
