/**
 * src/services/bot/handlers/finance-manager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Finance Manager Telegram Bot Handlers:
 * - Expense Queue (Tier 2 Pending Batch & Approvals)
 * - Payroll Summary
 * - Bank & bKash Hub
 * - Admin Team
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

/**
 * Handle "💸 Expense Queue" (Finance Manager mode)
 * Displays all claims that have received Line Manager Tier-1 approval and await Finance verification / Tier-2 sign-off.
 */
async function handleExpenseQueueFinance(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let pendingExpenses = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .or('status.eq.Tier 1 Approved,status.eq.Tier 2 Pending,status.eq.Pending')
        .neq('status', 'Disbursed')
        .neq('status', 'Declined')
        .order('created_at', { ascending: false });

      if (error) throw error;
      pendingExpenses = data || [];
    }

    const totalAmount = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    let text = `💸 *FINANCE MANAGER — EXPENSE QUEUE*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
      `• Pending Claims: *${pendingExpenses.length}*\n` +
      `• Total Queued Amount: *৳${totalAmount.toLocaleString()} BDT*\n\n`;

    const inlineKeyboard = [];

    if (pendingExpenses.length === 0) {
      text += `✅ *All submitted expense claims have been processed & cleared!*\nNo pending expense approvals at this time.`;
    } else {
      text += `*Claims Awaiting Finance Review / T2 Approval:*\n\n`;
      pendingExpenses.slice(0, 6).forEach((e, i) => {
        const staff = e.submitted_by || e.employee_name || e.name || 'Staff Member';
        const amt = Number(e.amount) || 0;
        const cat = e.category || 'General';
        const st = e.status || 'Pending';

        text += `${i + 1}. *${staff}* — ৳${amt.toLocaleString()} BDT\n`;
        text += `   📁 Category: ${cat} | Status: _${st}_\n\n`;

        inlineKeyboard.push([
          { text: `👑 Approve ৳${amt.toLocaleString()} (${staff.split(' ')[0]})`, callback_data: `approve_expense_t2:${e.id}` }
        ]);
      });

      if (pendingExpenses.length > 1) {
        inlineKeyboard.unshift([
          { text: `⚡ Batch Approve All (${pendingExpenses.length} Claims • ৳${totalAmount.toLocaleString()})`, callback_data: 'confirm_batch_expense_t2' }
        ]);
      }
    }

    inlineKeyboard.push([
      { text: '🌐 Open Web Finance Hub', web_app: { url: 'https://gro10x-ai.vercel.app/manager#finance' } },
      { text: '📊 Payroll Summary', callback_data: 'cmd_payroll_summary' }
    ]);

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });
  } catch (err) {
    console.error('[Finance Manager Bot] handleExpenseQueueFinance error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching finance expense queue.');
  }
}

/**
 * Handle "📊 Payroll Summary"
 * Aggregates monthly fixed payroll by department.
 */
async function handlePayrollSummary(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let profiles = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, department, role, base_salary');

      if (error) throw error;
      profiles = data || [];
    }

    let totalPayroll = 0;
    const deptTotals = {};

    profiles.forEach(p => {
      const sal = Number(p.base_salary) || 0;
      totalPayroll += sal;
      const dept = p.department || 'General';
      deptTotals[dept] = (deptTotals[dept] || 0) + sal;
    });

    let text = `📊 *GRO10X — MONTHLY PAYROLL SUMMARY*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}\n\n` +
      `• Total Active Payroll: *৳${totalPayroll.toLocaleString()} BDT*\n` +
      `• Total Staff on Payroll: *${profiles.length} Members*\n\n` +
      `*Department Breakdown:*\n`;

    Object.keys(deptTotals).forEach(dept => {
      text += `• *${dept}:* ৳${deptTotals[dept].toLocaleString()} BDT\n`;
    });

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🏦 Bank & bKash Hub', callback_data: 'cmd_bank_hub' },
            { text: '💸 Expense Queue', callback_data: 'cmd_expense_queue_fin' }
          ],
          [
            { text: '🌐 Open Pay Portal', url: 'https://gro10x-ai.vercel.app/app#finance' }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Finance Manager Bot] handlePayrollSummary error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error computing payroll summary.');
  }
}

/**
 * Handle "🏦 Bank & bKash Hub"
 * Lists payout account setup statuses for all team members.
 */
async function handleBankBkashHub(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let profiles = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, emp_code, name, role, department, bank_info, mfs_number, bkash_number')
        .order('name', { ascending: true });

      if (error) throw error;
      profiles = data || [];
    }

    let configuredCount = 0;
    let text = `🏦 *GRO10X SALARY & bKASH DISBURSEMENT HUB*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

    profiles.forEach(p => {
      const hasBank = p.bank_info && Object.keys(p.bank_info).length > 0;
      const hasMfs = p.mfs_number || p.bkash_number;
      if (hasBank || hasMfs) configuredCount++;
    });

    text += `• Total Profiles: *${profiles.length}*\n`;
    text += `• Configured Payout Accounts: *${configuredCount} / ${profiles.length}*\n\n`;
    text += `*Team Disbursement Methods:*\n`;

    profiles.slice(0, 8).forEach((p, i) => {
      const hasBank = p.bank_info && p.bank_info.accNo;
      const mfs = p.mfs_number || p.bkash_number || (p.bank_info && p.bank_info.mfsNo);
      let methodStr = hasBank ? `🏦 ${p.bank_info.bankName || 'Bank'}` : (mfs ? `📱 bKash (${mfs})` : `⚠️ Not Configured`);

      text += `${i + 1}. *${p.name}* (${p.emp_code || p.id})\n   └ ${methodStr}\n`;
    });

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Payroll Summary', callback_data: 'cmd_payroll_summary' },
            { text: '🌐 Full Bank Hub (Web)', url: 'https://gro10x-ai.vercel.app/app#finance' }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Finance Manager Bot] handleBankBkashHub error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching Bank & bKash Hub.');
  }
}

/**
 * Handle "👥 Admin Team"
 * Lists all staff in Finance, HR, and Administration.
 */
async function handleAdminTeam(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let team = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('department.ilike.%finance%,department.ilike.%admin%,department.ilike.%operations%,department.ilike.%executive%')
        .order('name', { ascending: true });

      if (error) throw error;
      team = data || [];
    }

    if (team.length === 0) {
      team = await state.getAllTeam();
    }

    let text = `👥 *ADMIN & FINANCE TEAM ROSTER (${team.length} Members)*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

    team.forEach((m, i) => {
      const status = m.status || 'Offline';
      const statusIcon = status === 'In Studio' ? '🟢' : (status === 'On Leave' ? '🌴' : '⬛');
      text += `${i + 1}. *${m.name}* (${m.emp_code || m.id || 'N/A'})\n`;
      text += `   💼 ${m.role || 'Finance Specialist'} (${m.department || 'Admin'})\n`;
      text += `   ${statusIcon} Status: *${status}*\n\n`;
    });

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌴 Review Leave Requests', callback_data: 'cmd_mgr_leaves' },
            { text: '💸 Expense Queue', callback_data: 'cmd_expense_queue_fin' }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Finance Manager Bot] handleAdminTeam error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching admin team roster.');
  }
}

module.exports = {
  handleExpenseQueueFinance,
  handlePayrollSummary,
  handleBankBkashHub,
  handleAdminTeam
};
