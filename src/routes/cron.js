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
const { broadcast } = require('../services/sse');

/**
 * Middleware to authorize Cron requests.
 * Checks for CRON_SECRET header or Vercel cron header.
 */
function authorizeCron(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  const cronHeader = req.headers['x-cron-secret'];
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.RENDER);

  // In production, CRON_SECRET is strictly mandatory
  if (isProd && !cronSecret) {
    console.error('⚠️ [Cron] CRON_SECRET not configured in production environment — blocking execution');
    return res.status(403).json({ error: 'Cron blocked: CRON_SECRET must be configured in production' });
  }

  // When CRON_SECRET is configured, require a matching secret (prevent header spoofing of x-vercel-cron)
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isHeaderValid = cronHeader === cronSecret;
    if (!isBearerValid && !isHeaderValid) {
      console.warn('⚠️ Unauthorized cron attempt blocked: invalid secret token');
      return res.status(401).json({ error: 'Unauthorized cron request: invalid or missing secret token' });
    }
    return next();
  }

  // In local development / test without CRON_SECRET, allow vercel header or dev access
  if (isVercelCron || !isProd) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized cron request' });
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
    leaveRes,
    telegramGroupsRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').limit(200),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('eod_reports').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('clients').select('*').limit(200),
    supabase.from('leaves').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('telegram_groups').select('*').limit(100)
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

  const telegramGroups = (telegramGroupsRes?.data || []).map(g => ({
    ...g,
    chatId: g.chat_id || g.chatId,
    department: g.department,
    name: g.name
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
    leaveRequests,
    telegramGroups,
    groups: telegramGroups
  };
}

// 🛡️ Global Cron Authorization Guard for all /api/cron/* routes
router.use(authorizeCron);

// GET /api/cron/morning-briefing
router.get('/morning-briefing', async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const owners = db.team.filter(t => t.accessLevel === 'Owner / Admin' && t.telegramId);

    if (!owners.length) {
      return res.json({ success: true, message: 'No owners with Telegram ID found', sentCount: 0 });
    }

    let sentCount = 0;
    for (const owner of owners) {
      // GRO-002 / PBD-002 (Chairman) gets board briefing, others get operational briefing
      const msg = (owner.id === 'GRO-002' || owner.id === 'PBD-002' || (owner.role || '').toLowerCase().includes('chairman'))
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
    const { sendLeadFollowUpEmail } = require('../services/resend');
    
    // === BLOCK 1: MANUAL SCHEDULED FOLLOW-UPS (follow_up_date <= now) ===
    const followUpLeads = db.leads.filter(lead => {
      if (lead.stage === 'Won / Closed' || lead.stage === 'Lost' || lead.stage === 'Spam') return false;
      if (!lead.follow_up_date) return false;
      const followUpDate = new Date(lead.follow_up_date);
      return followUpDate <= now;
    });

    let manualSentCount = 0;
    if (followUpLeads.length > 0) {
      let msg = `🔥 *Lead Follow-up Reminders*\n\n`;
      msg += `You have *${followUpLeads.length}* lead(s) with scheduled follow-ups due today:\n\n`;
      
      followUpLeads.forEach(lead => {
        msg += `• *${lead.company || lead.contact_person}*\n`;
        msg += `   Service: ${lead.service}\n`;
        msg += `   Stage: ${lead.stage}\n`;
        msg += `   Phone: \`${lead.phone || 'N/A'}\`\n\n`;
      });

      const owners = db.team.filter(t => (t.accessLevel === 'Owner / Admin' || t.role === 'Sales') && t.telegramId);
      for (const owner of owners) {
        await sendTelegramNotification(owner.telegramId, msg, null, true);
        manualSentCount++;
      }
    }

    // === BLOCK 2: 24h AUTOMATED PROSPECT EMAIL FOLLOW-UP ===
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const thirtyTwoHoursAgo = new Date(now.getTime() - 32 * 60 * 60 * 1000);

    const followUpEmailCandidates = db.leads.filter(lead => {
      if (lead.stage !== 'New Inquiry') return false;
      if (!lead.email || !lead.email.includes('@') || lead.email.includes('lead.com')) return false;
      const created = new Date(lead.created_at || lead.createdAt || 0);
      return created <= twentyHoursAgo && created >= thirtyTwoHoursAgo;
    });

    let emailsSent = 0;
    for (const lead of followUpEmailCandidates) {
      try {
        await sendLeadFollowUpEmail({
          contactPerson: lead.contact_person || lead.contactPerson,
          email: lead.email,
          service: lead.service,
          company: lead.company
        });
        emailsSent++;
      } catch (e) {
        console.warn(`[Cron] 24h follow-up email failed for lead ${lead.id}:`, e.message);
      }
    }

    // === BLOCK 3: 48h STALE LEAD BATCH TELEGRAM ALERT ===
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const staleLeads = db.leads.filter(lead => {
      if (lead.stage !== 'New Inquiry') return false;
      const created = new Date(lead.created_at || lead.createdAt || 0);
      return created < fortyEightHoursAgo;
    });

    let staleAlertsSent = 0;
    if (staleLeads.length > 0) {
      let staleMsg = `⚠️ *STALE LEAD ALERT — ACTION REQUIRED*\n\n`;
      staleMsg += `There are *${staleLeads.length}* lead(s) in "New Inquiry" uncontacted for 48+ hours:\n\n`;
      staleLeads.slice(0, 8).forEach(lead => {
        const dateStr = (lead.created_at || lead.createdAt || '').split('T')[0];
        staleMsg += `• *${lead.company || lead.contact_person || 'Lead'}* — ${lead.service || 'General'}\n`;
        staleMsg += `  📞 \`${lead.phone || lead.whatsapp || 'No Phone'}\` | Created: ${dateStr}\n\n`;
      });
      if (staleLeads.length > 8) {
        staleMsg += `_...and ${staleLeads.length - 8} more in CRM_\n\n`;
      }
      staleMsg += `Please reach out to these prospects or update their pipeline stage.`;

      const owners = db.team.filter(t => (t.accessLevel === 'Owner / Admin' || t.role === 'Sales') && t.telegramId);
      for (const owner of owners) {
        await sendTelegramNotification(owner.telegramId, staleMsg, [
          [{ text: '📊 Open CRM Leads', url: 'https://gro10x-ai.vercel.app/admin?tab=leads' }]
        ], true);
        staleAlertsSent++;
      }
    }

    return res.json({
      success: true,
      manualFollowUps: followUpLeads.length,
      emailsSent,
      staleLeadsCount: staleLeads.length,
      staleAlertsSent,
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
      await processAutomationEvent('task_overdue', { task }, db, () => {}, broadcast);
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
      await processAutomationEvent('payroll_reminder', {}, db, () => {}, broadcast);
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
        [[{ text: '📱 Open EOD Form', url: 'https://gro10x-ai.vercel.app/crew#eod' }]],
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
    await processAutomationEvent('specialist_daily_briefing', {}, db, () => {}, broadcast);
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
        [[{ text: '📍 Clock In Studio', url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=attendance' }]],
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
    const managers = db.team.filter(t => (t.accessLevel || '').toLowerCase().includes('manager') || (t.accessLevel || '').toLowerCase().includes('owner') || (t.role || '').toLowerCase().includes('managing director') || t.id === 'GRO-001' || t.id === 'PBD-001');

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
        await sendTelegramNotification(mgr.telegramId, msg, [[{ text: '🌐 Open Manager Portal', url: 'https://gro10x-ai.vercel.app/manager' }]], true);
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

    const finTeam = db.team.filter(t => (t.accessLevel || '').toLowerCase().includes('finance manager') || (t.role || '').toLowerCase().includes('finance') || (t.accessLevel || '').toLowerCase().includes('owner') || t.id === 'GRO-001' || t.id === 'PBD-001');
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
        const keyboard = [[{ text: '💳 Open Client Portal', web_app: { url: 'https://gro10x-ai.vercel.app/client#invoices' } }]];
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
    await processAutomationEvent('eod_evening_digest', {}, db, () => {}, broadcast);
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
    await processAutomationEvent('eod_daily_prompt', {}, db, () => {}, broadcast);
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
    await processAutomationEvent('morning_executive_briefing', {}, db, () => {}, broadcast);
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
    await processAutomationEvent('evening_digest', {}, db, () => {}, broadcast);
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
    await processAutomationEvent('weekly_kpi_summary', {}, db, () => {}, broadcast);
    return res.json({ success: true, message: 'Weekly executive KPI summary sent to leadership', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Weekly KPI summary error:', error);
    return res.status(500).json({ error: error.message });
  }
});


// GET /api/cron/lead-pipeline-summary — Sunday 9:00 AM BD Weekly Lead Pipeline Report
router.get('/lead-pipeline-summary', authorizeCron, async (req, res) => {
  try {
    const db = await fetchSupabaseSnapshot();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const allLeads = db.leads || [];
    const weeklyNewLeads = allLeads.filter(l => new Date(l.created_at || l.createdAt || 0) >= oneWeekAgo);

    // Stage breakdown
    const newInquiryCount = allLeads.filter(l => l.stage === 'New Inquiry').length;
    const contactedCount = allLeads.filter(l => l.stage === 'Contacted' || l.stage === 'Meeting Scheduled').length;
    const proposalSentCount = allLeads.filter(l => l.stage === 'Proposal Sent').length;
    const wonThisWeek = allLeads.filter(l => (l.stage === 'Won / Closed' || l.stage === 'Won') && new Date(l.updated_at || l.wonAt || l.created_at || 0) >= oneWeekAgo).length;
    const lostCount = allLeads.filter(l => l.stage === 'Lost' || l.stage === 'Spam').length;

    // Stale leads > 48h in New Inquiry
    const staleCount = allLeads.filter(l => l.stage === 'New Inquiry' && new Date(l.created_at || l.createdAt || 0) < fortyEightHoursAgo).length;

    // Top requested services
    const serviceCounts = {};
    weeklyNewLeads.forEach(l => {
      const svc = l.service || 'General Inquiries';
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    });
    const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const dateRangeStr = `${oneWeekAgo.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    let msg = `📊 *PURPLEOS WEEKLY LEAD PIPELINE REPORT*\n`;
    msg += `🗓️ *Period:* ${dateRangeStr}\n\n`;
    msg += `📥 *New Inquiries This Week:* *${weeklyNewLeads.length}*\n`;
    msg += `📞 *Active Uncontacted:* *${newInquiryCount}*\n`;
    msg += `🤝 *In Conversation / Discovery:* *${contactedCount}*\n`;
    msg += `📋 *Proposals In Review:* *${proposalSentCount}*\n`;
    msg += `🏆 *Deals Closed / Won (7d):* *${wonThisWeek}*\n`;
    if (lostCount > 0) msg += `❌ *Lost / Disqualified:* ${lostCount}\n`;
    msg += `\n`;

    if (sortedServices.length > 0) {
      msg += `🔥 *Top Requested Services:*\n`;
      sortedServices.forEach(([svc, count]) => {
        msg += `  • ${svc}: *${count} inquiries*\n`;
      });
      msg += `\n`;
    }

    if (staleCount > 0) {
      msg += `⚠️ *Attention:* *${staleCount}* lead(s) uncontacted for >48h\n\n`;
    }

    msg += `🌐 Open CRM Leads: https://gro10x-ai.vercel.app/admin?tab=leads`;

    const owners = db.team.filter(t => (t.accessLevel === 'Owner / Admin' || t.role === 'Sales') && t.telegramId);
    let sentCount = 0;
    for (const owner of owners) {
      await sendTelegramNotification(owner.telegramId, msg, [
        [{ text: '📊 Open CRM Leads Pipeline', url: 'https://gro10x-ai.vercel.app/admin?tab=leads' }]
      ], true);
      sentCount++;
    }

    return res.json({
      success: true,
      weeklyNewLeads: weeklyNewLeads.length,
      newInquiryCount,
      wonThisWeek,
      staleCount,
      sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lead pipeline summary cron error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cron/digivault-renewals
 * Daily 9 AM BST Digest of subscriptions expiring in next 3 days
 */
router.get('/digivault-renewals', authorizeCron, async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({ success: true, message: 'Supabase not configured, skipped.' });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysAhead = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0];

    // Find subscriptions expiring in <= 3 days that haven't been alerted or renewed
    const { data: expiring, error } = await supabase
      .from('digi_orders')
      .select('*')
      .eq('delivery_status', 'delivered')
      .eq('is_renewed', false)
      .lte('expiry_date', threeDaysAhead)
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    if (!expiring || expiring.length === 0) {
      return res.json({ success: true, count: 0, message: 'No subscriptions due for renewal in next 3 days.' });
    }

    const unalerted = expiring.filter(o => !o.renewal_reminder_sent);
    let totalPotentialRev = expiring.reduce((sum, o) => sum + Number(o.sale_price || 0), 0);

    let msg = `🔔 *DigiVault Daily Renewal Intelligence*\n\n`;
    msg += `📅 *Date:* ${todayStr}\n`;
    msg += `📋 *Expiring within 3 days:* ${expiring.length} active subscription(s)\n`;
    msg += `💰 *Renewal Revenue Potential:* ৳${totalPotentialRev.toLocaleString()}\n\n`;

    expiring.slice(0, 10).forEach(o => {
      const isPast = o.expiry_date < todayStr;
      const statusIcon = isPast ? '⚠️ EXPIRED' : '⏳ Due';
      msg += `  • *${o.customer_name}* — ${o.product_name} (${o.duration})\n`;
      msg += `    ${statusIcon}: \`${o.expiry_date}\` · Price: ৳${Number(o.sale_price || 0).toLocaleString()}\n`;
    });

    if (expiring.length > 10) {
      msg += `\n_...and ${expiring.length - 10} more subscriptions._\n`;
    }

    msg += `\n🌐 Manage DigiVault: https://gro10x-ai.vercel.app/app/index.html`;

    // Mark alerted
    const idsToMark = unalerted.map(o => o.id);
    if (idsToMark.length > 0) {
      await supabase.from('digi_orders').update({ renewal_reminder_sent: true }).in('id', idsToMark);
    }

    // Send to team Telegram group or admins
    if (process.env.TELEGRAM_TEAM_GROUP_ID) {
      const { getTeamBot } = require('../services/bot');
      const teamBot = getTeamBot();
      if (teamBot) {
        teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, msg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      expiringCount: expiring.length,
      unalertedCount: unalerted.length,
      potentialRevenue: totalPotentialRev,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[DigiVault Renewal Cron Error]:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/dbm-morning-nudge
router.get('/dbm-morning-nudge', async (req, res) => {
  try {
    const { loadBrandsState } = require('./brands');
    const brandsState = await loadBrandsState();
    
    // Query DBM team members from Supabase profiles
    const { data: dbmProfiles } = await supabase
      .from('profiles')
      .select('*')
      .not('telegram_id', 'is', null);

    const dbmUsers = (dbmProfiles || []).filter(p => {
      const r = (p.role || '').toLowerCase();
      return r.includes('brand manager') || r.includes('digital brand') || r.includes('dbm');
    });

    if (!dbmUsers.length) {
      return res.json({ success: true, message: 'No DBMs with telegram_id found', sentCount: 0 });
    }

    let sentCount = 0;
    for (const dbm of dbmUsers) {
      const dbmId = dbm.dbm_id || dbm.dbmId || 1;
      const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || { assignedBrands: [1, 5, 8], dailyTarget: 8 };
      const assignedBrandIds = dbmInfo.assignedBrands || [1, 5, 8];
      const activeBrandId = assignedBrandIds[0] || 1;
      const activeBrand = brandsState.brands?.find(b => b.id === activeBrandId) || brandsState.brands?.[0] || { name: 'PlannerQueenGro' };
      const catalog = brandsState.productsCatalog?.[activeBrand.id] || [];

      const drafts = catalog.filter(p => p.status !== 'Live' && p.status !== 'Pending Review');
      const dailyTarget = dbmInfo.dailyTarget || 8;
      const batchStart = drafts[0];
      const batchEnd = drafts[Math.max(0, dailyTarget - 1)] || drafts[drafts.length - 1] || batchStart;

      const batchLabel = batchStart && batchEnd && batchStart.code !== batchEnd.code
        ? `SKUs ${batchStart.code} through ${batchEnd.code}`
        : batchStart ? `SKU ${batchStart.code}` : 'All complete!';

      const firstName = (dbm.name || 'Brand Manager').split(' ')[0];

      const nudgeMsg =
        `☀️ *Good Morning, ${firstName}! Ready to build?*\n\n` +
        `📋 *TODAY'S PRODUCTION MISSION:*\n` +
        `🏪 *Active Brand:* ${activeBrand.name}\n` +
        `🎯 *Target Batch:* ${batchLabel} (*${dailyTarget} Products Quota*)\n` +
        `📦 *Catalog Progress:* ${100 - drafts.length}/100 Completed\n` +
        `⏰ *EOD Standup Deadline:* 5:00 PM BST\n\n` +
        `🚀 *Recommended Flow (3 Blocks):*\n` +
        `• 🌅 *9AM–1PM:* 4 Product Blueprints & Vaults\n` +
        `• ⚡ *1PM–5PM:* 4 Mockups, Videos & AI SEO\n` +
        `• 📝 *5PM–6PM:* Submit QC Review & Daily Standup\n\n` +
        `🌐 [Open DBM Workspace](https://gro10x-ai.vercel.app/dbm#workspace) · [Studio](https://gro10x-ai.vercel.app/dbm#studio)`;

      try {
        await sendTelegramNotification(dbm.telegram_id, nudgeMsg, null, true);
        sentCount++;
      } catch (tgErr) {
        console.warn(`[Morning Nudge Telegram Error for ${dbm.name}]:`, tgErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Morning nudge dispatched to ${sentCount} DBM(s)`,
      sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in DBM morning nudge cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/cron/dbm-standup-reminder
router.get('/dbm-standup-reminder', async (req, res) => {
  try {
    const { data: dbmProfiles } = await supabase
      .from('profiles')
      .select('*')
      .not('telegram_id', 'is', null);

    const dbmUsers = (dbmProfiles || []).filter(p => {
      const r = (p.role || '').toLowerCase();
      return r.includes('brand manager') || r.includes('digital brand') || r.includes('dbm');
    });

    if (!dbmUsers.length) {
      return res.json({ success: true, message: 'No DBMs found', sentCount: 0 });
    }

    // Check today's standup logs to only notify those who haven't submitted yet
    const todayStr = new Date().toISOString().split('T')[0];
    let submittedEmpCodes = [];
    try {
      if (isSupabaseConfigured()) {
        // 1. Primary KV Store: app_settings (key: dbm_standup_logs)
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'dbm_standup_logs')
          .maybeSingle();
        
        let logs = (settingData && Array.isArray(settingData.value)) ? settingData.value : [];

        // 2. Fallback to custom_fields if app_settings is empty
        if (!logs.length) {
          const { data: logsData } = await supabase
            .from('custom_fields')
            .select('value')
            .eq('entity_type', 'brand_empire')
            .eq('field_name', 'dbm_eod_logs')
            .maybeSingle();
          logs = logsData?.value || [];
        }

        submittedEmpCodes = logs
          .filter(l => l && (l.date === todayStr || (l.timestamp && l.timestamp.startsWith(todayStr))))
          .map(l => l.empCode || l.emp_code || l.dbmName || l.dbm_name || l.name);

        // 3. Also check relational eod_reports table
        const { data: eodData } = await supabase
          .from('eod_reports')
          .select('emp_code, name, created_at')
          .gte('created_at', `${todayStr}T00:00:00.000Z`)
          .limit(100);

        if (eodData && Array.isArray(eodData)) {
          eodData.forEach(e => {
            if (e.emp_code) submittedEmpCodes.push(e.emp_code);
            if (e.name) submittedEmpCodes.push(e.name);
          });
        }
      }
    } catch (e) {
      console.warn('[Cron DBM Standup Reminder] Error checking submission state:', e.message);
    }

    let sentCount = 0;
    for (const dbm of dbmUsers) {
      const alreadySubmitted = submittedEmpCodes.some(c => c && (c === dbm.emp_code || c === dbm.name));
      if (alreadySubmitted) continue; // Skip if already submitted!

      const firstName = (dbm.name || 'Brand Manager').split(' ')[0];
      const reminderMsg =
        `🕔 *5:00 PM Standup Reminder — ${firstName}!*\n\n` +
        `It's time to log your daily output report. It takes less than 30 seconds!\n\n` +
        `Tap the button below or reply with /dbmstandup:\n\n` +
        `🌐 [Submit EOD Standup Online](https://gro10x-ai.vercel.app/dbm#standup)`;

      try {
        await sendTelegramNotification(dbm.telegram_id, reminderMsg, null, true);
        sentCount++;
      } catch (tgErr) {
        console.warn(`[Standup Reminder Telegram Error for ${dbm.name}]:`, tgErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Standup reminder sent to ${sentCount} DBM(s) (Skipped ${dbmUsers.length - sentCount} already logged)`,
      sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in DBM standup reminder cron:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;



