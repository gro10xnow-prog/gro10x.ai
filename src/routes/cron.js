const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { sendTelegramNotification } = require('../services/bot');
const {
  buildMorningBriefing,
  buildEODSummary,
  buildChairmanBriefing
} = require('../services/automation');

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
    supabase.from('profiles').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('attendance').select('*'),
    supabase.from('eod_reports').select('*'),
    supabase.from('leads').select('*'),
    supabase.from('clients').select('*'),
    supabase.from('leaves').select('*')
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

module.exports = router;
