/**
 * src/services/bot/handlers/approvals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Executive Pending Approvals Handler (Agreements, Expenses, Leaves, Payments).
 * Generates dynamic, interactive 1-tap inline buttons for Owner/Executive action.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handlePendingApprovals(teamBot, msg) {
  const chatId = msg.chat.id;

  let pendingAgreements = [];
  let pendingLeaves = [];
  let pendingExpenses = [];
  let pendingPayments = [];
  let pendingTasks = [];

  if (supabase) {
    try {
      const [lRes, eRes, tRes, aRes, pRes] = await Promise.all([
        supabase.from('leaves').select('*').or('status.eq.Pending,status.eq.Manager Approved').limit(5),
        supabase.from('expenses').select('*').or('status.eq.Finance Verified,status.eq.Tier 1 Approved,status.eq.Pending').limit(5),
        supabase.from('tasks').select('*').ilike('stage', '%Review%').limit(5),
        supabase.from('profiles').select('id, emp_code, name, role, department, agreement_stage').eq('agreement_stage', 2).limit(3),
        supabase.from('payment_logs').select('*').eq('verified', false).limit(3)
      ]);
      pendingLeaves = lRes.data || [];
      pendingExpenses = eRes.data || [];
      pendingTasks = tRes.data || [];
      pendingAgreements = aRes.data || [];
      pendingPayments = pRes.data || [];
    } catch (err) {
      console.error('Pending Approvals DB Error:', err.message);
    }
  }

  let text = `✍️ *EXECUTIVE PENDING APPROVALS DASHBOARD*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

  const inlineKeyboard = [];

  // 1. Employment Agreements (Stage 3 Owner Seal)
  if (pendingAgreements.length > 0) {
    text += `🏛️ *Employment Agreements Awaiting Seal (${pendingAgreements.length}):*\n`;
    pendingAgreements.forEach((a, i) => {
      text += `   ${i + 1}. *${a.name}* (${a.emp_code || a.id}) — ${a.role || 'Specialist'}\n`;
      inlineKeyboard.push([
        { text: `🏛️ Seal Agreement: ${a.name.split(' ')[0]}`, callback_data: `agr_stage3:${a.emp_code || a.id}` }
      ]);
    });
    text += `\n`;
  }

  // 2. Unverified Payments
  if (pendingPayments.length > 0) {
    text += `💳 *bKash Payments Awaiting Verification (${pendingPayments.length}):*\n`;
    pendingPayments.forEach((p, i) => {
      text += `   ${i + 1}. *${p.client_name || 'Client'}* — ৳${(Number(p.amount) || 0).toLocaleString()} (TrxID: \`${p.trx_id || 'N/A'}\`)\n`;
      inlineKeyboard.push([
        { text: `💳 Approve Payment: ৳${p.amount} (${(p.client_name || 'Client').split(' ')[0]})`, callback_data: `pay_approve:${p.id}` }
      ]);
    });
    text += `\n`;
  }

  // 3. Expense Claims (Owner T2 Sign-off)
  text += `💸 *Expense Claims Awaiting Sign-off (${pendingExpenses.length}):*\n`;
  if (pendingExpenses.length === 0) {
    text += `   ✅ No pending expense claims\n\n`;
  } else {
    pendingExpenses.forEach((e, i) => {
      const amt = Number(e.amount) || 0;
      const staffName = e.submitted_by || e.employee_name || 'Staff';
      text += `   ${i + 1}. *${staffName}* — ৳${amt.toLocaleString()} BDT (${e.category || 'General'})\n`;
      inlineKeyboard.push([
        { text: `👑 Approve Exp ৳${amt} (${staffName.split(' ')[0]})`, callback_data: `approve_expense_t2:${e.id}` }
      ]);
    });
    text += `\n`;
  }

  // 4. Leave Requests (Owner Final Sign-off)
  text += `🌴 *Leave Requests Awaiting Sign-off (${pendingLeaves.length}):*\n`;
  if (pendingLeaves.length === 0) {
    text += `   ✅ No pending leave requests\n\n`;
  } else {
    pendingLeaves.forEach((l, i) => {
      const staffName = l.employee_name || l.name || 'Staff';
      text += `   ${i + 1}. *${staffName}* — ${l.leave_type || 'Leave'} (${l.start_date || 'TBD'} to ${l.end_date || 'TBD'})\n`;
      inlineKeyboard.push([
        { text: `🌴 Approve Leave (${staffName.split(' ')[0]})`, callback_data: `approve_leave_owner:${l.id}` }
      ]);
    });
    text += `\n`;
  }

  // 5. Tasks In Review (Informational)
  text += `🎬 *Tasks In Client / QC Review (${pendingTasks.length}):*\n`;
  if (pendingTasks.length === 0) {
    text += `   ✅ No tasks awaiting review\n`;
  } else {
    pendingTasks.forEach((t, i) => {
      text += `   ${i + 1}. *${t.title}* — ${t.client || 'General'} (${t.stage})\n`;
    });
  }

  // Add Portal Deep Link
  inlineKeyboard.push([
    { text: '🌐 Open Web Admin Hub', url: 'https://gro10x-ai.vercel.app/app' }
  ]);

  teamBot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: inlineKeyboard }
  }).catch(err => {
    console.error('handlePendingApprovals send error:', err.message);
  });
}

module.exports = {
  handlePendingApprovals
};
