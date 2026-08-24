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
  'Casual Leave': 14,
  'Sick Leave': 10,
  'Earned Leave': 18,
  'Unpaid Leave': 99
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
            { text: '📱 Open Leave Request Form (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=leave&action=new' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId,
      `🌴 *LEAVE REQUEST (Step 1/3)*\n\n` +
      `Tap **Open Leave Request Form** for date range picker,\n` +
      `_or reply here with your leave type:_\n1️⃣ Casual Leave\n2️⃣ Sick Leave\n3️⃣ Earned Leave\n4️⃣ Unpaid Leave`,
      options
    );
  } catch (err) {
    console.error('[Leaves Bot] handleInitLeave error:', err.message);
    await state.clearSession(chatId).catch(() => {});
    teamBot.sendMessage(chatId, '⚠️ Could not start leave request wizard. Please try again.');
  }
}

function parseDateInput(text) {
  if (!text) return null;
  const str = text.trim();
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : str;
  }
  // Try DD MMM or DD Month (e.g. 15 Aug, 20 August)
  const d = new Date(`${str} ${new Date().getFullYear()}`);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

async function handleLeaveWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    if (wizardState.action === 'await_leave_type') {
      const leaveTypes = { '1': 'Casual Leave', '2': 'Sick Leave', '3': 'Earned Leave', '4': 'Unpaid Leave' };
      const leaveType = leaveTypes[text] || text;
      
      const nextState = { ...wizardState, leaveType, action: 'await_leave_start_date' };
      await state.setSession(chatId, nextState);
      return teamBot.sendMessage(chatId,
        `📅 Leave Type: *${leaveType}* (Step 2/3)\n\nPlease reply with the *Start Date* (e.g. \`2026-08-15\` or \`15 Aug\`):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_leave_start_date') {
      const startDate = parseDateInput(text);
      if (!startDate) {
        return teamBot.sendMessage(chatId,
          `⚠️ *Invalid Date Format*\n\nPlease reply with a valid start date e.g. \`2026-08-15\` or \`15 Aug\` (or type /cancel to abort):`,
          { parse_mode: 'Markdown' }
        );
      }
      const nextState = { ...wizardState, startDate, action: 'await_leave_end_date' };
      await state.setSession(chatId, nextState);
      return teamBot.sendMessage(chatId,
        `📅 Start Date: *${startDate}* (Step 3/3)\n\nPlease reply with the *End Date* (e.g. \`2026-08-17\`, or reply **same** for a 1-day leave):`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_leave_end_date') {
      const startDate = wizardState.startDate;
      let endDate = text.toLowerCase() === 'same' ? startDate : parseDateInput(text);
      
      if (!endDate) {
        return teamBot.sendMessage(chatId,
          `⚠️ *Invalid Date Format*\n\nPlease reply with a valid end date e.g. \`2026-08-17\`, or type **same** for 1 day:`,
          { parse_mode: 'Markdown' }
        );
      }

      // Calculate total working days (excluding Friday & Saturday)
      let totalDays = 1;
      try {
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
          let workingDays = 0;
          let cur = new Date(d1);
          while (cur <= d2) {
            const dayOfWeek = cur.getDay();
            // 5 = Friday, 6 = Saturday (Bangladesh corporate weekend)
            if (dayOfWeek !== 5 && dayOfWeek !== 6) {
              workingDays++;
            }
            cur.setDate(cur.getDate() + 1);
          }
          totalDays = Math.max(1, workingDays);
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
        `• Status: *Pending Review*\n\n` +
        `Your manager ${manager ? `(*${manager.name}*)` : ''} has been notified.`,
        { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
      );
    }
  } catch (err) {
    console.error('[Leaves Bot] handleLeaveWizardStep error:', err.message);
    await state.clearSession(chatId).catch(() => {});
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

    const used = { 'Casual Leave': 0, 'Sick Leave': 0, 'Earned Leave': 0, 'Unpaid Leave': 0 };
    (approvedLeaves || []).forEach(l => {
      const type = l.leave_type || l.type || 'Casual Leave';
      const days = Number(l.total_days || l.days) || 1;
      if (type.includes('Casual') || type.includes('Annual')) used['Casual Leave'] += days;
      else if (type.includes('Sick')) used['Sick Leave'] += days;
      else if (type.includes('Earned') || type.includes('Emergency')) used['Earned Leave'] += days;
      else used['Unpaid Leave'] += days;
    });

    const casualRem = Math.max(0, LEAVE_POLICY['Casual Leave'] - used['Casual Leave']);
    const sickRem = Math.max(0, LEAVE_POLICY['Sick Leave'] - used['Sick Leave']);
    const earnedRem = Math.max(0, LEAVE_POLICY['Earned Leave'] - used['Earned Leave']);

    const balanceMsg =
      `🌴 *Your Leave Balance — ${currentYear}*\n\n` +
      `🌴 *Casual Leave:*   ${casualRem} / ${LEAVE_POLICY['Casual Leave']} days remaining (used ${used['Casual Leave']})\n` +
      `🤒 *Sick Leave:*     ${sickRem} / ${LEAVE_POLICY['Sick Leave']} days remaining (used ${used['Sick Leave']})\n` +
      `🏖️ *Earned Leave:*   ${earnedRem} / ${LEAVE_POLICY['Earned Leave']} days remaining (used ${used['Earned Leave']})\n` +
      `📝 *Unpaid Taken:*   ${used['Unpaid Leave']} days\n\n` +
      `_Type /leave to submit a new leave request._`;

    teamBot.sendMessage(chatId, balanceMsg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Leaves Bot] handleLeaveBalance error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not calculate leave balance.');
  }
}

/**
 * Handle "✅ Leave Approvals" for Department Managers
 * Lists all pending employee leave requests with 1-tap Approve/Reject inline buttons.
 */
async function handleManagerLeaveApprovals(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    let pendingLeaves = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .or('status.eq.Pending,status.eq.Pending Line Review')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      pendingLeaves = data || [];
    }

    let text = `🌴 *DEPARTMENT LEAVE APPROVALS DASHBOARD*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

    const inlineKeyboard = [];

    if (pendingLeaves.length === 0) {
      text += `✅ *No pending leave requests in your department!*\n\nAll team PTO and leave applications have been reviewed.`;
    } else {
      text += `*Leave Requests Awaiting Line Review (${pendingLeaves.length}):*\n\n`;
      pendingLeaves.forEach((l, i) => {
        const staff = l.employee_name || l.name || 'Staff Member';
        const type = l.leave_type || l.type || 'Leave';
        const start = l.start_date || l.startDate || 'TBD';
        const end = l.end_date || l.endDate || 'TBD';
        const days = l.total_days || l.days || 1;

        text += `${i + 1}. *${staff}*\n`;
        text += `   🌴 ${type} (${days} day${days > 1 ? 's' : ''})\n`;
        text += `   📅 ${start} ➔ ${end}\n`;
        if (l.reason) text += `   📝 Reason: _${l.reason}_\n`;
        text += `\n`;

        inlineKeyboard.push([
          { text: `✅ Approve (${staff.split(' ')[0]})`, callback_data: `approve_leave:${l.id}` },
          { text: `❌ Reject`, callback_data: `reject_leave:${l.id}` }
        ]);
      });
    }

    inlineKeyboard.push([
      { text: '🌐 Open Web Manager Portal', url: 'https://gro10x-ai.vercel.app/manager' }
    ]);

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  } catch (err) {
    console.error('[Leaves Bot] handleManagerLeaveApprovals error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching pending leave approvals.');
  }
}

module.exports = {
  handleInitLeave,
  handleLeaveWizardStep,
  handleLeaveBalance,
  handleManagerLeaveApprovals
};

