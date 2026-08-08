/**
 * src/services/bot/handlers/leaves.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Leave Request Interactive Wizard & Leave Balance Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { supabase } = require('../../supabase');
const { getRoleKeyboard } = require('../keyboards');

// Default agency leave policy allowances per calendar year
const LEAVE_POLICY = {
  Annual: 18,
  Sick: 7,
  Emergency: 3,
  Unpaid: 99
};

async function handleInitLeave(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please send your contact via the Verify button first.`, { parse_mode: 'Markdown' });

    const sess = { action: 'await_leave_type', empId: emp.emp_code, empName: emp.name, reportsTo: emp.reportsTo };
    await state.setSession(chatId, sess);

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Open Leave Request Form (Mini App)', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=leave&action=new' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId,
      `🌴 *LEAVE REQUEST (Step 1/3)*\n\n` +
      `Tap **Open Leave Request Form** for date range picker,\n` +
      `_or reply here with your leave type:_\n1️⃣ Annual Leave\n2️⃣ Sick Leave\n3️⃣ Emergency Leave\n4️⃣ Unpaid Leave`,
      options
    );
  } catch (err) {
    console.error('[Leaves Bot] handleInitLeave error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not start leave request wizard. Please try again.');
  }
}

async function handleLeaveWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    if (wizardState.action === 'await_leave_type') {
      const leaveTypes = { '1': 'Annual Leave', '2': 'Sick Leave', '3': 'Emergency Leave', '4': 'Unpaid Leave' };
      const leaveType = leaveTypes[text] || text;
      
      const nextState = { ...wizardState, leaveType, action: 'await_leave_start_date' };
      await state.setSession(chatId, nextState);
      return teamBot.sendMessage(chatId,
        `📅 Leave Type: *${leaveType}* (Step 2/3)\n\nPlease reply with the *Start Date* (e.g. \`2026-08-15\` or \`15 Aug\`):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_leave_start_date') {
      const startDate = text;
      const nextState = { ...wizardState, startDate, action: 'await_leave_end_date' };
      await state.setSession(chatId, nextState);
      return teamBot.sendMessage(chatId,
        `📅 Start Date: *${startDate}* (Step 3/3)\n\nPlease reply with the *End Date* (e.g. \`2026-08-17\`, or reply **same** for a 1-day leave):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_leave_end_date') {
      const startDate = wizardState.startDate;
      let endDate = text.toLowerCase() === 'same' ? startDate : text;
      
      // Calculate total days (simple estimate if same month/year or 1 day)
      let totalDays = 1;
      try {
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
          const diffTime = Math.abs(d2 - d1);
          totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
      } catch (e) {}

      const newLeave = await state.submitLeave(emp.emp_code, emp.name, {
        leaveType: wizardState.leaveType,
        startDate: startDate,
        endDate: endDate,
        totalDays: totalDays,
        reason: `Leave request for ${startDate} to ${endDate}`
      });

      await state.clearSession(chatId);

      const manager = await state.getEmployeeByTelegramId(emp.reportsTo);
      if (manager && manager.telegramId) {
        try {
          teamBot.sendMessage(manager.telegramId,
            `🌴 *NEW LEAVE REQUEST*\n\n` +
            `From: *${emp.name}*\n` +
            `Type: *${wizardState.leaveType}*\n` +
            `Dates: *${startDate}* to *${endDate}* (${totalDays} day${totalDays > 1 ? 's' : ''})\n\n` +
            `_Approve or reject via the Pending Approvals button._`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
      }

      return teamBot.sendMessage(chatId,
        `✅ *Leave Request Submitted!*\n\n` +
        `• Type: *${wizardState.leaveType}*\n` +
        `• Period: *${startDate}* to *${endDate}* (${totalDays} day${totalDays > 1 ? 's' : ''})\n` +
        `• Status: *Pending Line Review*\n\n` +
        `Your manager ${manager ? `(*${manager.name}*)` : ''} has been notified.`,
        { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
      );
    }
  } catch (err) {
    console.error('[Leaves Bot] handleLeaveWizardStep error:', err.message);
    await state.clearSession(chatId);
    teamBot.sendMessage(chatId, '⚠️ Failed to submit leave request. Please try again.');
  }
}

async function handleLeaveBalance(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

    const empCode = emp.emp_code || emp.id;
    const currentYear = new Date().getFullYear();

    // Query approved leaves for current year from Supabase
    const { data: approvedLeaves, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', empCode)
      .eq('status', 'Approved');

    if (error) throw error;

    const used = { Annual: 0, Sick: 0, Emergency: 0, Unpaid: 0 };
    (approvedLeaves || []).forEach(l => {
      const type = l.leave_type || l.type || 'Annual';
      const days = Number(l.total_days || l.days) || 1;
      if (type.includes('Annual')) used.Annual += days;
      else if (type.includes('Sick')) used.Sick += days;
      else if (type.includes('Emergency')) used.Emergency += days;
      else used.Unpaid += days;
    });

    const annualRem = Math.max(0, LEAVE_POLICY.Annual - used.Annual);
    const sickRem = Math.max(0, LEAVE_POLICY.Sick - used.Sick);
    const emergencyRem = Math.max(0, LEAVE_POLICY.Emergency - used.Emergency);

    const balanceMsg =
      `🌴 *Your Leave Balance — ${currentYear}*\n\n` +
      `✅ *Annual Leave:*   ${annualRem} / ${LEAVE_POLICY.Annual} days remaining (used ${used.Annual})\n` +
      `🤒 *Sick Leave:*     ${sickRem} / ${LEAVE_POLICY.Sick} days remaining (used ${used.Sick})\n` +
      `🆘 *Emergency:*      ${emergencyRem} / ${LEAVE_POLICY.Emergency} days remaining (used ${used.Emergency})\n` +
      `📝 *Unpaid Taken:*   ${used.Unpaid} days\n\n` +
      `_Type /leave to submit a new leave request._`;

    teamBot.sendMessage(chatId, balanceMsg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Leaves Bot] handleLeaveBalance error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not calculate leave balance.');
  }
}

module.exports = {
  handleInitLeave,
  handleLeaveWizardStep,
  handleLeaveBalance
};
