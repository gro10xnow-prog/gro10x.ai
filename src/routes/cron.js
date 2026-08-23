const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { sendTelegramNotification } = require('../services/bot');
const {
  buildMorningBriefing,
  buildEODSummary,
  buildChairmanBriefing
} = require('../services/automation');
const { getFirstName } = require('../utils/name');

/**
 * Middleware to authorize Cron requests.
 * Checks for CRON_SECRET header or Vercel cron header.
 */
function authorizeCron(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  const cronHeader = req.headers['x-cron-secret'];
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isHeaderValid = cronHeader === cronSecret;
    if (!isBearerValid && !isHeaderValid && !isVercelCron) {
      console.warn('⚠️ Unauthorized cron attempt blocked');
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }
  } else if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    if (!isVercelCron) {
      console.warn('⚠️ Cron invocation rejected: CRON_SECRET not configured and not from Vercel');
      return res.status(401).json({ error: 'Unauthorized cron request: CRON_SECRET required in production' });
    }
  }

  next();
}

/**
 * Helper to fetch full DB snapshot from Supabase for briefings
 */
async function fetchSupabaseSnapshot() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const [
    profilesRes,
    expensesRes,
    invoicesRes,
    tasksRes,
    attendanceRes,
    eodRes,
    leadsRes,
    clientsRes,
    leaveRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').limit(200),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('eod_reports').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('clients').select('*').limit(200),
    supabase.from('leaves').select('*').order('created_at', { ascending: false }).limit(100)
  ]);

  const team = (profilesRes.data || []).map(t => ({
    ...t,
    id: t.emp_code,
    telegramId: t.telegram_id,
    accessLevel: t.access_level,
    baseSalary: t.base_salary,
    agreementStage: t.agreement_stage,
    agreementComplete: t.agreement_complete,
    role: t.role,
    name: t.name,
    status: t.status || 'Offline'
  }));

  const expenses = (expensesRes.data || []).map(e => ({
    ...e,
    loggedBy: e.logged_by,
    amount: Number(e.amount || 0),
    status: e.status,
    date: e.date,
    createdAt: e.created_at
  }));

  const invoices = (invoicesRes.data || []).map(i => ({
    ...i,
    amount: Number(i.amount || 0),
    status: i.status,
    paidAt: i.paid_at,
    issueDate: i.issue_date
  }));

  const tasks = (tasksRes.data || []).map(t => ({
    ...t,
    stage: t.stage
  }));

  const attendance = (attendanceRes.data || []).map(a => ({
    ...a,
    clockInTime: a.clock_in_time,
    date: a.date
  }));

  const eodReports = (eodRes.data || []).map(r => ({
    ...r,
    employeeName: r.employee_name,
    submittedAt: r.submitted_at,
    date: r.date,
    summary: r.summary,
    tasks: r.tasks
  }));

  const leads = (leadsRes.data || []).map(l => ({
    ...l,
    value: Number(l.value || 0),
    wonAt: l.won_at
  }));

  const clients = (clientsRes.data || []).map(c => ({
    ...c,
    status: c.status
  }));

  const leaveRequests = (leaveRes.data || []).map(l => ({
    ...l,
    status: l.status
  }));

  return {
    team,
    expenses,
    invoices,
    tasks,
    attendance,
    eodReports,
    leads,
    clients,
    leaveRequests
  };
}

// GET /api/cron/morning-briefing
router.get('/morning-briefing', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const owners = db.team.filter(t => t.accessLevel === 'Owner / Admin' && t.telegramId);

    if (!owners.length) {
      return res.json({ success: true, message: 'No owners with Telegram ID found', sentCount: 0 });
    }

    let sentCount = 0;
    for (const owner of owners) {
      // PBD-002 (Chairman) gets board briefing, others get operational briefing
      const msg = owner.id === 'PBD-002'
        ? buildChairmanBriefing(db)
        : buildMorningBriefing(db);

      await sendTelegramNotification(owner.telegramId, msg, null, true);
      sentCount++;
    }

    return res.json({
      success: true,
      message: `Morning briefing sent to ${sentCount} recipient(s)`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in morning briefing cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/eod-summary
router.get('/eod-summary', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const owners = db.team.filter(t => t.accessLevel === 'Owner / Admin' && t.telegramId);

    if (!owners.length) {
      return res.json({ success: true, message: 'No owners with Telegram ID found', sentCount: 0 });
    }

    const eodMsg = buildEODSummary(db);
    let sentCount = 0;

    for (const owner of owners) {
      await sendTelegramNotification(owner.telegramId, eodMsg, null, true);
      sentCount++;
    }

    return res.json({
      success: true,
      message: `EOD summary sent to ${sentCount} recipient(s)`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in EOD summary cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/payment-reminders
router.get('/payment-reminders', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    
    // Find invoices unpaid and past 7 days from issue date (or due date if you prefer. We'll use 7 days past due date or issue date)
    const overdueInvoices = db.invoices.filter(inv => {
      if (inv.status === 'Paid') return false;
      const dateToCheck = new Date(inv.dueDate || inv.issueDate || inv.date || inv.createdAt);
      const diffTime = Math.abs(now - dateToCheck);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    });

    if (!overdueInvoices.length) {
      return res.json({ success: true, message: 'No overdue invoices.', sentCount: 0 });
    }

    // Build message
    let msg = `⚠️ *Payment Reminder Summary*\n\n`;
    msg += `There are *${overdueInvoices.length}* invoice(s) overdue by 7+ days:\n\n`;
    let totalOverdue = 0;
    
    overdueInvoices.forEach(inv => {
      msg += `• *${inv.id}* - ${inv.clientName}\n`;
      msg += `   Amount: BDT ${Number(inv.amount).toLocaleString()}\n`;
      msg += `   Status: ${inv.status}\n\n`;
      totalOverdue += Number(inv.amount);
    });

    msg += `*Total Overdue: BDT ${totalOverdue.toLocaleString()}*`;

    const owners = db.team.filter(t => (t.accessLevel === 'Owner / Admin' || t.role === 'Finance Lead') && t.telegramId);
    let sentCount = 0;

    for (const owner of owners) {
      await sendTelegramNotification(owner.telegramId, msg, null, true);
      sentCount++;
    }

    return res.json({
      success: true,
      message: `Payment reminders sent to ${sentCount} recipient(s)`,
      overdueCount: overdueInvoices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in payment reminders cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/lead-followups
router.get('/lead-followups', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    
    // Find active leads with follow_up_date <= today
    const followUpLeads = db.leads.filter(lead => {
      if (lead.stage === 'Won / Closed' || lead.stage === 'Lost' || lead.stage === 'Spam') return false;
      if (!lead.follow_up_date) return false;
      const followUpDate = new Date(lead.follow_up_date);
      // Check if it's today or in the past
      return followUpDate <= now;
    });

    if (!followUpLeads.length) {
      return res.json({ success: true, message: 'No lead follow-ups due.', sentCount: 0 });
    }

    let msg = `🔥 *Lead Follow-up Reminders*\n\n`;
    msg += `You have *${followUpLeads.length}* lead(s) to follow up with today:\n\n`;
    
    followUpLeads.forEach(lead => {
      msg += `• *${lead.company || lead.contact_person}*\n`;
      msg += `   Service: ${lead.service}\n`;
      msg += `   Stage: ${lead.stage}\n`;
      msg += `   Phone: \`${lead.phone || 'N/A'}\`\n\n`;
    });

    const owners = db.team.filter(t => (t.accessLevel === 'Owner / Admin' || t.role === 'Sales') && t.telegramId);
    let sentCount = 0;

    for (const owner of owners) {
      await sendTelegramNotification(owner.telegramId, msg, null, true);
      sentCount++;
    }

    return res.json({
      success: true,
      message: `Lead follow-up reminders sent to ${sentCount} recipient(s)`,
      followUpCount: followUpLeads.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in lead followups cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/task-overdue
router.get('/task-overdue', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    const { processAutomationEvent } = require('../services/automation');
    let triggerCount = 0;

    const overdueTasks = db.tasks.filter(task => {
      if (task.stage === 'Approved' || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const diffTime = Math.abs(now - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return now > dueDate && diffDays >= 2;
    });

    for (const task of overdueTasks) {
      await processAutomationEvent('task_overdue', { task }, db, null, null);
      triggerCount++;
    }

    return res.json({ success: true, message: `Fired task_overdue for ${triggerCount} tasks` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/payroll-reminder
router.get('/payroll-reminder', authorizeCron, async (req, res) => {
  try {
    const now = new Date();
    if (now.getDate() === 25) {
      const db = await fetchSupabaseSnapshot();
      const { processAutomationEvent } = require('../services/automation');
      await processAutomationEvent('payroll_reminder', {}, db, null, null);
      return res.json({ success: true, message: 'Fired payroll_reminder' });
    }
    return res.json({ success: true, message: 'Not the 25th today.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/weekly-digest
router.get('/weekly-digest', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    // Verify it's Monday (or run regardless if hit directly)
    if (req.query.force !== 'true' && now.getDay() !== 1) {
      return res.json({ success: true, message: 'Not Monday. Skipped.' });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Calculate Weekly KPIs
    let newRevenue = 0;
    db.invoices.forEach(i => {
      if (i.status === 'Paid' && new Date(i.paidAt || i.created_at) >= oneWeekAgo) {
        newRevenue += Number(i.amount);
      }
    });

    let tasksCompleted = 0;
    let tasksOverdue = 0;
    db.tasks.forEach(t => {
      const isDone = t.stage === 'Approved' || t.stage === 'Completed';
      if (isDone && new Date(t.updated_at || t.created_at) >= oneWeekAgo) tasksCompleted++;
      
      if (!isDone && t.dueDate && new Date(t.dueDate) < now) tasksOverdue++;
    });

    let newLeads = 0;
    db.leads.forEach(l => {
      if (new Date(l.created_at) >= oneWeekAgo) newLeads++;
    });

    let newExpenses = 0;
    db.expenses.forEach(e => {
      if (new Date(e.date || e.createdAt) >= oneWeekAgo) newExpenses += Number(e.amount);
    });

    const attendanceThisWeek = db.attendance.filter(a => new Date(a.date) >= oneWeekAgo).length;

    let msg = `📊 *PURPLEOS WEEKLY DIGEST*\n\n`;
    msg += `🗓️ *Last 7 Days Performance*\n`;
    msg += `💰 Revenue Collected: *BDT ${newRevenue.toLocaleString()}*\n`;
    msg += `💸 Expenses Logged: *BDT ${newExpenses.toLocaleString()}*\n`;
    msg += `✅ Tasks Completed: *${tasksCompleted}*\n`;
    msg += `🎯 New Leads: *${newLeads}*\n`;
    msg += `⏰ Active Overdue Tasks: *${tasksOverdue}*\n`;
    msg += `👨‍💼 Total Attendance Logs: *${attendanceThisWeek}*\n\n`;
    msg += `_Have a productive week ahead!_ 🚀`;

    const owners = db.team.filter(t => t.accessLevel === 'Owner / Admin' && t.telegramId);
    let sentCount = 0;
    for (const owner of owners) {
      await sendTelegramNotification(owner.telegramId, msg, null, true);
      sentCount++;
    }

    return res.json({ success: true, message: `Weekly digest sent to ${sentCount} admins` });
  } catch (error) {
    console.error('Weekly digest error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/eod-reminder — 6:30 PM BD reminder to team members missing EOD
router.get('/eod-reminder', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const todayStr = new Date().toLocaleDateString('en-CA');

    const submittedToday = new Set((db.eodReports || [])
      .filter(e => (e.date || e.report_date || '').startsWith(todayStr))
      .map(e => e.employee_id || e.employeeId));

    const clockedInToday = new Set((db.attendance || [])
      .filter(a => (a.date || a.clock_in_time || a.clockInTime || '').startsWith(todayStr))
      .map(a => a.employee_id || a.employeeId || a.empCode));

    const onApprovedLeave = new Set((db.leaveRequests || [])
      .filter(l => (l.status === 'Approved' || l.status === 'Owner Approved') && (l.startDate || l.start_date) <= todayStr && (l.endDate || l.end_date) >= todayStr)
      .map(l => l.employeeId || l.employee_id));

    // Only notify employees who clocked in today, have not submitted EOD, and are not on leave
    const missingEmployees = db.team.filter(t =>
      t.telegramId &&
      !submittedToday.has(t.id) &&
      (clockedInToday.has(t.id) || t.status === 'In Studio' || t.status === 'On Field Shoot') &&
      !onApprovedLeave.has(t.id) &&
      t.status !== 'On Leave'
    );

    const { sendTelegramNotification } = require('../services/bot');
    let sentCount = 0;
    for (const emp of missingEmployees) {
      const firstName = getFirstName(emp.name);
      await sendTelegramNotification(emp.telegramId,
        `📝 *EOD REPORT REMINDER*\n\nHey ${firstName}! It's past 6 PM and your End-of-Day report for today hasn't been submitted yet.\n\nPlease submit your summary via bot or web workspace:`,
        [[{ text: '📱 Open EOD Form', url: 'https://purpleos-iota.vercel.app/crew#eod' }]],
        true
      );
      sentCount++;
    }

    return res.json({ success: true, message: `EOD reminders sent to ${sentCount} employee(s)`, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('EOD reminder cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/daily-briefing — 9:00 AM BD personal daily task briefing
router.get('/daily-briefing', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('specialist_daily_briefing', {}, db, null, null);
    return res.json({ success: true, message: 'Specialist daily briefings sent', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Daily briefing cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/late-clockin-alert — 10:00 AM BD late clock-in alert
router.get('/late-clockin-alert', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const clockedIn = new Set((db.attendance || []).filter(a => (a.date || '').startsWith(todayStr)).map(a => a.employee_id || a.empCode));

    const lateEmployees = db.team.filter(t => {
      if (!t.telegramId) return false;
      if (t.status === 'On Leave') return false;
      const access = (t.accessLevel || t.access_level || '').toLowerCase();
      const role = (t.role || '').toLowerCase();
      const isLeadership = ['owner', 'founder', 'chairman', 'ceo', 'managing director', 'finance manager', 'head of'].some(kw => access.includes(kw) || role.includes(kw));
      return !isLeadership && !clockedIn.has(t.id);
    });
    const { sendTelegramNotification } = require('../services/bot');

    let sentCount = 0;
    for (const emp of lateEmployees) {
      const firstName = getFirstName(emp.name);
      await sendTelegramNotification(emp.telegramId,
        `⏰ *ATTENDANCE REMINDER (10:00 AM)*\n\nHey ${firstName}! You haven't clocked in for studio work today yet.\n\nPlease clock in using the Mini App below:`,
        [[{ text: '📍 Clock In Studio', url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=attendance' }]],
        true
      );
      sentCount++;
    }

    return res.json({ success: true, message: `Late clock-in alerts sent to ${sentCount} employee(s)`, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Late clockin cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/approval-expiry — Remind managers of stale approval items (>48h / >72h)
router.get('/approval-expiry', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    const { sendTelegramNotification } = require('../services/bot');
    const managers = db.team.filter(t => (t.accessLevel || '').toLowerCase().includes('manager') || (t.accessLevel || '').toLowerCase().includes('owner') || (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001');

    const staleLeaves = (db.leaveRequests || []).filter(l => {
      if (l.status !== 'Pending' && l.status !== 'Pending Line Review') return false;
      const age = (now - new Date(l.created_at || l.createdAt)) / 1000 / 3600;
      return age > 48;
    });

    const staleExpenses = (db.expenses || []).filter(e => {
      if (!['Tier 1 Pending', 'Tier 2 Pending', 'Finance Verified'].includes(e.status)) return false;
      const age = (now - new Date(e.created_at || e.date)) / 1000 / 3600;
      return age > 72;
    });

    if (!staleLeaves.length && !staleExpenses.length) {
      return res.json({ success: true, message: 'No stale approval requests found', timestamp: new Date().toISOString() });
    }

    let msg = `⚠️ *PENDING APPROVALS EXPIRY ALERT*\n\n`;
    if (staleLeaves.length) msg += `🌴 *${staleLeaves.length}* leave request(s) pending >48h without manager action\n`;
    if (staleExpenses.length) msg += `🧾 *${staleExpenses.length}* expense claim(s) pending >72h without approval\n`;
    msg += `\nPlease review and approve/reject pending items in the Manager/Admin Portal.`;

    let sentCount = 0;
    for (const mgr of managers) {
      if (mgr.telegramId) {
        await sendTelegramNotification(mgr.telegramId, msg, [[{ text: '🌐 Open Manager Portal', url: 'https://purpleos-iota.vercel.app/manager' }]], true);
        sentCount++;
      }
    }

    return res.json({ success: true, staleLeaves: staleLeaves.length, staleExpenses: staleExpenses.length, sentCount, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Approval expiry cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/invoice-due-reminder — 3-day upcoming invoice due alert
router.get('/invoice-due-reminder', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const { sendTelegramNotification } = require('../services/bot');

    const upcomingInvoices = (db.invoices || []).filter(inv => {
      if (inv.status === 'Paid') return false;
      const dueDate = new Date(inv.due_date || inv.dueDate || inv.issueDate);
      const diff = dueDate - now;
      return diff > 0 && diff <= THREE_DAYS_MS;
    });

    if (!upcomingInvoices.length) return res.json({ success: true, message: 'No upcoming invoice dues', sentCount: 0 });

    let msg = `💳 *INVOICE DUE REMINDER (Next 3 Days)*\n\n`;
    upcomingInvoices.forEach(inv => {
      msg += `• *${inv.id}* — ${inv.client_name || inv.clientName || 'Client'} — BDT ${Number(inv.amount || 0).toLocaleString()}\n`;
      msg += `  Due: *${inv.due_date || inv.dueDate}*\n\n`;
    });

    const finTeam = db.team.filter(t => (t.accessLevel || '').toLowerCase().includes('finance manager') || (t.role || '').toLowerCase().includes('finance') || (t.accessLevel || '').toLowerCase().includes('owner') || t.id === 'PBD-001');
    let sentCount = 0;
    for (const fin of finTeam) {
      if (fin.telegramId) {
        await sendTelegramNotification(fin.telegramId, msg, null, true);
        sentCount++;
      }
    }

    // Also notify linked Client Partners directly via client bot
    for (const inv of upcomingInvoices) {
      const invClientId = inv.client_id || inv.clientId;
      const client = (db.clients || []).find(c => (invClientId && c.id === invClientId) || (c.name && inv.client_name && c.name.toLowerCase() === inv.client_name.toLowerCase()));
      const clientTg = client?.telegram_id || client?.telegramId;
      if (clientTg) {
        const clientMsg =
          `💳 *INVOICE DUE REMINDER*\n\n` +
          `Dear *${client.name || 'Brand Partner'}*,\n` +
          `Your invoice *${inv.id}* for *BDT ${Number(inv.amount || 0).toLocaleString()}* is due on *${inv.due_date || inv.dueDate || 'Soon'}*.\n\n` +
          `You can view details or submit payment confirmation directly in your Client Portal below.`;
        const keyboard = [[{ text: '💳 Open Client Portal', web_app: { url: 'https://purpleos-iota.vercel.app/client#invoices' } }]];
        await sendTelegramNotification(clientTg, clientMsg, keyboard, false);
      }
    }

    return res.json({ success: true, message: `Invoice due reminders sent to ${sentCount} recipient(s)`, count: upcomingInvoices.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Invoice due reminder cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/social-dispatch — Daily check for approved posts due for 1-click dispatch
router.get('/social-dispatch', authorizeCron, async (req, res) => {
  try {
    const { checkScheduledSocialDispatches } = require('../services/automation');
    const { broadcast } = require('../services/sse');
    const db = await fetchSupabaseSnapshot();
    await checkScheduledSocialDispatches(db, null, broadcast);
    return res.json({ success: true, message: 'Scheduled social dispatches checked', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Social dispatch cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/eod-evening-digest — 7:30 PM BD Department Manager EOD summary
router.get('/eod-evening-digest', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('eod_evening_digest', {}, db, null, null);
    return res.json({ success: true, message: 'Department manager 7:30 PM EOD digest sent', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('EOD evening digest cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/eod-daily-prompt — 7:00 PM BD EOD reminder prompt
router.get('/eod-daily-prompt', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('eod_daily_prompt', {}, db, null, null);
    return res.json({ success: true, message: '7:00 PM EOD daily prompt sent to active crew', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('EOD daily prompt cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/morning-executive-briefing — 9:00 AM Morning Executive Briefing
router.get('/morning-executive-briefing', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('morning_executive_briefing', {}, db, null, null);
    return res.json({ success: true, message: '9:00 AM morning executive briefing sent to leadership', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Morning executive briefing error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/evening-digest — 8:30 PM Evening Executive Digest
router.get('/evening-digest', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('evening_digest', {}, db, null, null);
    return res.json({ success: true, message: '8:30 PM evening executive digest sent to leadership', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Evening digest error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/weekly-kpi-summary — Weekly Executive KPI Summary
router.get('/weekly-kpi-summary', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const { processAutomationEvent } = require('../services/automation');
    await processAutomationEvent('weekly_kpi_summary', {}, db, null, null);
    return res.json({ success: true, message: 'Weekly executive KPI summary sent to leadership', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Weekly KPI summary error:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

