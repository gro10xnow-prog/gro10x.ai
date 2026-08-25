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
  const todayStr = new Date().toISOString().split('T')[0];

  const [team, tasks, attRes] = await Promise.all([
    state.getAllTeam(),
    supabase ? supabase.from('tasks').select('*').limit(3).then(r => r.data || []) : Promise.resolve([]),
    supabase ? supabase.from('attendance').select('*').gte('clock_in_time', todayStr).then(r => r.data || []) : Promise.resolve([])
  ]);

  const totalStaff = team.length;
  const inStudio = (attRes || []).filter(a => a.status === 'In Studio').length || team.filter(t => t.status === 'In Studio').length;
  const onShoot = (attRes || []).filter(a => a.status === 'On Field Shoot').length || team.filter(t => t.status === 'On Field Shoot').length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const offline = Math.max(0, totalStaff - (inStudio + onShoot + onLeave));

  let text = `🌅 *GRO10X — EXECUTIVE MORNING BRIEFING*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
    `👥 *Live Studio Headcount (${totalStaff} Total):*\n` +
    `• 🟢 In Studio: *${inStudio}*\n` +
    `• 🎬 On Shoot: *${onShoot}*\n` +
    `• 🌴 On Leave: *${onLeave}*\n` +
    `• ⬛ Offline: *${offline}*\n\n` +
    `📋 *Priority Deliverables Focus:*\n`;

  const topTasks = (tasks || []).slice(0, 3);
  if (topTasks.length === 0) {
    text += `No urgent production tasks flagged for today.\n`;
  } else {
    topTasks.forEach((t, idx) => {
      text += `${idx + 1}. *${t.title}* (${t.client || 'Agency'})\n   👤 Assignee: ${t.assignee || 'Unassigned'}\n`;
    });
  }

  text += `\nHave a productive and profitable day! ⚡`;

  teamBot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '📊 Command Dashboard', url: 'https://gro10x-ai.vercel.app/app' },
        { text: '✍️ Pending Approvals', callback_data: 'cmd_approvals' }
      ]]
    }
  }).catch(() => {});
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

  let text = `📊 *GRO10X BUSINESS SNAPSHOT*\n\n` +
    `• Total Team Roster: *${team.length} Members*\n` +
    `• Active Retainer Clients: *${clientCount} Clients*\n` +
    `• Active Production Tasks: *${taskCount} Tasks*\n\n` +
    `System Status: 🟢 Operational & Live`;
  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleFinanceSummary(teamBot, msg) {
  const chatId = msg.chat.id;

  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
  }

  const role = (emp.role || '').toLowerCase();
  const access = (emp.accessLevel || emp.access_level || '').toLowerCase();
  const isAuth = (
    access.includes('owner') ||
    access.includes('admin') ||
    access.includes('manager') ||
    role.includes('finance') ||
    role.includes('managing director') ||
    role.includes('chairman')
  );

  if (!isAuth) {
    return teamBot.sendMessage(chatId, `🔒 *Access Denied:* Financial Intelligence is restricted to Executive & Finance leadership.`, { parse_mode: 'Markdown' });
  }

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

  const text = `💰 *GRO10X — EXECUTIVE FINANCIAL INTELLIGENCE*\n` +
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
    `🌐 [Open Financial Command Center](https://gro10x-ai.vercel.app/app#finance)`;

  teamBot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🧾 View Invoices', url: 'https://gro10x-ai.vercel.app/app#finance' },
        { text: '💸 Expense Queue', callback_data: 'view_expenses_queue' }
      ]]
    }
  }).catch(() => {});
}

async function handleOpsHealthSummary(teamBot, msg) {
  const chatId = msg.chat.id;
  const cache = require('../../../services/cache');
  const { getActiveClientsCount } = require('../../../services/sse');
  
  let dbLatency = 0;
  let dbStatus = 'Offline';
  let openTasks = 0;
  let overdueTasks = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const dbStart = Date.now();
  try {
    if (supabase) {
      const [profRes, taskRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id, priority, due_date, stage')
      ]);
      dbLatency = Date.now() - dbStart;
      dbStatus = '🟢 Connected';
      if (taskRes.data) {
        openTasks = taskRes.data.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
        overdueTasks = taskRes.data.filter(t => t.due_date && t.due_date < todayStr && !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
      }
    }
  } catch (e) {
    dbStatus = '🔴 Error';
    dbLatency = Date.now() - dbStart;
  }

  const cacheStats = cache.stats ? cache.stats() : { activeKeys: cache.size(), hitRatePercent: 100 };
  const sseClients = getActiveClientsCount ? getActiveClientsCount() : 0;
  const memoryMB = Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100;
  const uptimeHrs = (process.uptime() / 3600).toFixed(1);

  const text = `🩺 *GRO10X — OPS HEALTH TELEMETRY*\n` +
    `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} | ⏱️ Uptime: *${uptimeHrs}h*\n\n` +
    `⚡ *System Diagnostics:*\n` +
    `• Database: *${dbStatus}* (⚡ ${dbLatency}ms latency)\n` +
    `• Telegram Bot: *🟢 Live & Responsive*\n` +
    `• Active Web SSE Clients: *${sseClients} connected*\n` +
    `• In-Memory Cache: *${cacheStats.activeKeys} keys (${cacheStats.hitRatePercent}% hit rate)*\n` +
    `• Memory Footprint: *${memoryMB} MB RSS*\n\n` +
    `📋 *Agency Pipeline Health:*\n` +
    `• Active In-Progress Tasks: *${openTasks} tasks*\n` +
    `• Overdue Deliverables: *${overdueTasks > 0 ? `🚨 ${overdueTasks} OVERDUE` : '✅ 0 Overdue'}*\n\n` +
    `🌐 [Open Live Health Center](https://gro10x-ai.vercel.app/app)`;

  teamBot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🖥️ Web Admin OS', url: 'https://gro10x-ai.vercel.app/app' },
        { text: '🔄 Refresh Status', callback_data: 'cmd_health_refresh' }
      ]]
    }
  }).catch(() => {});
}

module.exports = {
  handleMorningBriefing,
  handleBusinessSnapshot,
  handleFinanceSummary,
  handleOpsHealthSummary
};
