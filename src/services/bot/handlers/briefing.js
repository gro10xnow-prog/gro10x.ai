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

  let paid = 0, draft = 0, pendingExpenses = 0;
  try {
    if (supabase) {
      const [{ data: inv }, { count: expCount }] = await Promise.all([
        supabase.from('invoices').select('amount, status'),
        supabase.from('expenses').select('*', { count: 'exact', head: true }).neq('status', 'Disbursed')
      ]);
      (inv || []).forEach(i => {
        if (i.status === 'Paid') paid += Number(i.amount) || 0;
        else if (i.status === 'Draft' || i.status === 'Pending') draft += Number(i.amount) || 0;
      });
      pendingExpenses = expCount || 0;
    }
  } catch (err) {
    console.error('Finance summary error:', err.message);
  }

  let text = `💰 *PURPLEBOT FINANCE SNAPSHOT*\n\n` +
    `• Paid Invoices: *$${paid.toLocaleString()} USD*\n` +
    `• Draft/Pending Invoices: *$${draft.toLocaleString()} USD*\n` +
    `• Pending Expense Claims: *${pendingExpenses} claims*\n\n` +
    `🌐 Open Web Finance Portal: https://purpleos-iota.vercel.app/admin`;
  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(()=>{});
}

module.exports = {
  handleMorningBriefing,
  handleBusinessSnapshot,
  handleFinanceSummary
};
