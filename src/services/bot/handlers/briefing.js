/**
 * src/services/bot/handlers/briefing.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Executive Morning Briefing, Business Snapshot, and Finance Summary handlers.
 * Optimized with Promise.all parallelization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handleMorningBriefing(teamBot, msg) {
  const chatId = msg.chat.id;

  const [team, tasks] = await Promise.all([
    state.getAllTeam(),
    supabase ? supabase.from('tasks').select('*').limit(3).then(r => r.data || []) : Promise.resolve([])
  ]);

  const totalStaff = team.length;
  const inStudio = team.filter(t => t.status === 'In Studio').length;
  const onShoot = team.filter(t => t.status === 'On Field Shoot').length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const offline = totalStaff - (inStudio + onShoot + onLeave);

  let text = `🌅 *PURPLEBOT MORNING BRIEFING*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
    `👥 *Team Status (${totalStaff} Members):*\n` +
    `• 🟢 In Studio: *${inStudio}*\n` +
    `• 🎬 On Shoot: *${onShoot}*\n` +
    `• 🌴 On Leave: *${onLeave}*\n` +
    `• ⬛ Offline: *${offline}*\n\n` +
    `📋 *Today's Production Focus:*\n`;

  const topTasks = (tasks || []).slice(0, 3);
  if (topTasks.length === 0) {
    text += `No urgent production tasks flagged for today.\n`;
  } else {
    topTasks.forEach((t, idx) => {
      text += `${idx + 1}. *${t.title}* (${t.client || 'Agency'})\n   👤 Assignee: ${t.assignee || 'Unassigned'}\n`;
    });
  }

  text += `\nHave a productive day! 💜`;
  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleBusinessSnapshot(teamBot, msg) {
  const chatId = msg.chat.id;

  const [team, clientsRes, tasksRes] = await Promise.all([
    state.getAllTeam(),
    supabase ? supabase.from('clients').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
    supabase ? supabase.from('tasks').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 })
  ]);

  const clientCount = clientsRes?.count || 0;
  const taskCount = tasksRes?.count || 0;

  let text = `📊 *PURPLEBOT DIGITAL BUSINESS SNAPSHOT*\n\n` +
    `• Total Team Roster: *${team.length} Members*\n` +
    `• Active Retainer Clients: *${clientCount} Clients*\n` +
    `• Active Production Tasks: *${taskCount} Tasks*\n\n` +
    `System Status: 🟢 Operational & Live`;
  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleFinanceSummary(teamBot, msg) {
  const chatId = msg.chat.id;

  let paid = 0;
  let draft = 0;
  let pendingExpenses = 0;
  let pendingExpTotal = 0;
  let disbursedExpenses = 0;
  let monthlyPayroll = 0;

  try {
    if (supabase) {
      const [invRes, expRes, profileRes] = await Promise.all([
        supabase.from('invoices').select('amount, status'),
        supabase.from('expenses').select('amount, status'),
        supabase.from('profiles').select('base_salary')
      ]);

      (invRes.data || []).forEach(i => {
        const amt = Number(i.amount) || 0;
        if ((i.status || '').toLowerCase() === 'paid') paid += amt;
        else if (i.status !== 'Cancelled') draft += amt;
      });

      (expRes.data || []).forEach(e => {
        const amt = Number(e.amount) || 0;
        const st = (e.status || '').toLowerCase();
        if (st === 'disbursed') {
          disbursedExpenses += amt;
        } else if (st.includes('pending') || st === 'approved') {
          pendingExpenses += 1;
          pendingExpTotal += amt;
        }
      });

      (profileRes.data || []).forEach(p => {
        monthlyPayroll += Number(p.base_salary) || 0;
      });
    }
  } catch (err) {
    console.error('Finance summary error:', err.message);
  }

  const totalBilled = paid + draft;
  const collectionRate = totalBilled > 0 ? Math.round((paid / totalBilled) * 100) : 100;
  const netCashPosition = paid - (disbursedExpenses + monthlyPayroll);
  const netSign = netCashPosition >= 0 ? '🟢 +৳' : '🔴 -৳';

  const text = `💰 *PURPLEBOT DIGITAL — EXECUTIVE FINANCIAL INTELLIGENCE*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
    `💵 *Revenue & Collections:*\n` +
    `• Settled Revenue: *৳${paid.toLocaleString()} BDT*\n` +
    `• Outstanding Receivables: *৳${draft.toLocaleString()} BDT*\n` +
    `• Collection Efficiency: *${collectionRate}%*\n\n` +
    `💸 *Liabilities & Operational Costs:*\n` +
    `• Pending Expense Queue: *${pendingExpenses} claims (৳${pendingExpTotal.toLocaleString()})*\n` +
    `• Monthly Fixed Payroll: *৳${monthlyPayroll.toLocaleString()} BDT*\n\n` +
    `📊 *Net Operational Cash Position:*\n` +
    `• Estimated Balance: *${netSign}${Math.abs(netCashPosition).toLocaleString()} BDT*\n\n` +
    `🌐 [Open Financial Command Center](https://purpleos-iota.vercel.app/app#finance)`;

  teamBot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🧾 View Invoices', url: 'https://purpleos-iota.vercel.app/app#finance' },
        { text: '💸 Expense Queue', callback_data: 'view_expenses_queue' }
      ]]
    }
  }).catch(() => {});
}

module.exports = {
  handleMorningBriefing,
  handleBusinessSnapshot,
  handleFinanceSummary
};
