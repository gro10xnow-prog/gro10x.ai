const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireMiniAppAuth } = require('../middleware/telegramAuth');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { getBadge } = require('../utils/xp');

// In-memory fallback for local development or disconnected mode
let inMemoryEOD = [];

function mapEOD(e) {
  if (!e) return null;
  return {
    id: e.id,
    employeeId: e.employee_id || e.employeeId || 'GRO-000',
    name: e.employee_name || e.name || 'Team Member',
    date: e.report_date || e.date || new Date().toISOString().split('T')[0],
    tasksCompleted: e.tasks_done || e.tasksCompleted || e.summary || '',
    tasksTomorrow: e.tasks_tomorrow || e.tasksTomorrow || e.tomorrow || '',
    blockers: e.blockers || 'None',
    mood: e.mood || '😊 Energized',
    hoursWorked: Number(e.hours_worked || e.hours) || 8,
    submittedVia: e.submitted_via || 'web_portal',
    createdAt: e.created_at || e.createdAt || new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/eod — Retrieve EOD reports
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    let reports = [];

    if (isSupabaseConfigured()) {
      let query = supabase.from('eod_reports').select('*').order('created_at', { ascending: false });
      if (date) query = query.eq('report_date', date);
      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        reports = data.map(mapEOD);
      }
    }

    if (reports.length === 0) {
      reports = inMemoryEOD
        .filter(e => (!date || e.date === date) && (!employeeId || e.employeeId === employeeId))
        .map(mapEOD);
    }

    res.json(reports);
  } catch (err) {
    console.error('GET /api/eod error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/eod — Submit Daily EOD Report
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { employeeId, name, text, summary, blockers, tasksTomorrow, tomorrow, mood, hours } = req.body;
    const empCode = employeeId || req.user?.linkedId || req.user?.id || 'GRO-000';
    const empName = name || req.user?.name || 'Team Member';
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      id: `EOD-${Date.now()}`,
      employee_id: empCode,
      employee_name: empName,
      report_date: today,
      tasks_done: text || summary || 'Daily tasks completed',
      tasks_tomorrow: tasksTomorrow || tomorrow || 'Standard daily tasks',
      blockers: blockers || 'None',
      mood: mood || '😊 Energized',
      hours_worked: Number(hours) || 8,
      submitted_via: 'web_portal',
      created_at: new Date().toISOString()
    };

    inMemoryEOD.unshift(payload);

    if (isSupabaseConfigured()) {
      const { error: insErr } = await supabase.from('eod_reports').insert([payload]);
      if (insErr) console.warn('[EOD API] Supabase insert note:', insErr.message);

      // Award +10 XP for daily EOD submission
      if (empCode && empCode !== 'GRO-000' && empCode !== 'PBD-000') {
        try {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empCode);
          let pQuery = supabase.from('profiles').select('xp, badge, telegram_id, custom_fields');
          if (isUUID) {
            pQuery = pQuery.eq('id', empCode);
          } else {
            pQuery = pQuery.eq('emp_code', empCode);
          }
          const { data: prof } = await pQuery.maybeSingle();
          if (prof) {
            const newXP = (prof.xp || 0) + 10;
            const oldBadge = prof.badge || '🌱 Recruit';
            const badge = getBadge(newXP);

            const existingLog = prof.custom_fields?.xp_log || [];
            const xpLog = [...existingLog.slice(-49), {
              event: 'eod_submit',
              delta: 10,
              total: newXP,
              badge,
              ts: new Date().toISOString()
            }];
            const customFields = { ...(prof.custom_fields || {}), xp_log: xpLog };

            let uQuery = supabase.from('profiles').update({
              xp: newXP,
              badge,
              custom_fields: customFields,
              updated_at: new Date().toISOString()
            });
            if (isUUID) {
              uQuery = uQuery.eq('id', empCode);
            } else {
              uQuery = uQuery.eq('emp_code', empCode);
            }
            await uQuery;
          }
        } catch (xpErr) {
          console.warn('[EOD API] XP award note:', xpErr.message);
        }
      }
    }

    try {
      broadcast('eod_update', [mapEOD(payload)]);
    } catch (e) {}

    // Send Telegram notification to Manager/Owner
    try {
      const { sendTelegramNotification } = require('../services/bot');
      const targetChatId = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.OWNER_TELEGRAM_ID;
      if (targetChatId) {
        const msg =
          `📝 *Daily EOD Submitted — ${empName}*\n\n` +
          `• 👤 Employee: *${empName}* (\`${empCode}\`)\n` +
          `• 🎭 Mood: *${payload.mood}*\n` +
          `• ⏱️ Hours: *${payload.hours_worked} hrs*\n` +
          `• ✅ Tasks Completed:\n${payload.tasks_done}\n\n` +
          `• 📅 Tomorrow's Plan:\n${payload.tasks_tomorrow}\n\n` +
          `• 🚧 Blockers: ${payload.blockers}`;
        sendTelegramNotification(targetChatId, msg, null, true).catch(() => {});
      }
    } catch (e) {}

    res.json({ success: true, eod: mapEOD(payload) });
  } catch (err) {
    console.error('POST /api/eod error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
