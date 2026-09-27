/**
 * src/services/defect-escalation-cron.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: Contractor Defect 24-Hour SLA Auto-Escalation Cron Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 * 1. Evaluate open subcontractor defect tickets against the 24-hour SLA window
 * 2. Detect near-breach conditions (P0 <= 4h remaining, P1 <= 8h remaining)
 * 3. Dispatch urgent Telegram alerts to Pod Leads & Managing Director
 * 4. Maintain alert deduplication cache to prevent message spamming
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { readDB } = require('./db');
const { findProject } = require('./post-delivery');
const { sendTelegramNotification } = require('./bot');

// Deduplication cache: tracks ticket ID + warning threshold so we only notify once per tier
const escalatedTickets = new Set();
let escalationCronInterval = null;

/**
 * Evaluates all open contractor defect tickets and triggers escalation alerts
 */
async function runDefectEscalationCheck() {
  const now = Date.now();
  let tickets = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .neq('status', 'resolved')
        .neq('status', 'closed');
      if (!error && data) tickets = data;
    } catch (_) {}
  }

  if (tickets.length === 0) {
    try {
      const db = await readDB();
      tickets = (db.tickets || []).filter(t => {
        const st = (t.status || '').toLowerCase();
        return st !== 'resolved' && st !== 'closed';
      });
    } catch (_) {}
  }

  const escalationResults = [];

  for (const ticket of tickets) {
    const createdTime = new Date(ticket.createdAt || ticket.created_at || now).getTime();
    const elapsedHours = (now - createdTime) / (1000 * 60 * 60);
    const slaHoursRemaining = Math.max(0, 24 - elapsedHours);
    const severity = String(ticket.severity || ticket.priority || 'P1').toUpperCase();

    const isP0 = severity === 'P0' || severity.includes('CRITICAL') || severity.includes('BLOCKER');
    const isP1 = severity === 'P1' || severity.includes('MAJOR') || severity.includes('HIGH');

    let shouldEscalate = false;
    let thresholdTag = '';

    if (isP0 && slaHoursRemaining <= 4) {
      shouldEscalate = true;
      thresholdTag = 'P0_4H_BREACH_WARNING';
    } else if (isP1 && slaHoursRemaining <= 8) {
      shouldEscalate = true;
      thresholdTag = 'P1_8H_BREACH_WARNING';
    }

    if (shouldEscalate) {
      const dedupKey = `${ticket.id || ticket._id}_${thresholdTag}`;
      const isAlreadyEscalated = escalatedTickets.has(dedupKey);

      if (!isAlreadyEscalated) {
        escalatedTickets.add(dedupKey);

        const projectId = ticket.projectId || ticket.project_id;
        let project = null;
        if (projectId) {
          try {
            project = await findProject(projectId);
          } catch (_) {}
        }

        const projName = project?.name || project?.title || ticket.projectName || 'AI Solution Sprint';
        const hoursLeftFormatted = slaHoursRemaining.toFixed(1);

        const alertMessage = `🚨 *URGENT SLA ESCALATION: Contractor Defect Nearing 24h Deadline*\n\n` +
          `🏢 *Project:* ${projName} (\`${projectId || 'N/A'}\`)\n` +
          `⚠️ *Severity Tier:* *${severity}*\n` +
          `⏱️ *Time Remaining:* *${hoursLeftFormatted} Hours* (24h Defect SLA Window)\n` +
          `📝 *Ticket:* ${ticket.title} (\`${ticket.id}\`)\n` +
          `👤 *Reported By:* ${ticket.createdBy || ticket.author || 'Contractor Specialist'}\n` +
          `📋 *Details:* ${(ticket.description || 'No description provided').slice(0, 150)}...\n\n` +
          `🚨 *Status:* Unresolved — Urgent Tech Lead & Pod Manager intervention required.`;

        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        const inlineKeyboard = [
          [
            { text: '🚨 Acknowledge SLA Warning', callback_data: `ack_defect_sla:${ticket.id}` },
            { text: '🔗 Open in Workspace', url: `${baseUrl}/workspace#operations` }
          ]
        ];

        try {
          const ownerChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_TEAM_GROUP_ID;
          if (ownerChatId) {
            await sendTelegramNotification(ownerChatId, alertMessage, inlineKeyboard, true);
          }
        } catch (_) {}

        escalationResults.push({
          ticketId: ticket.id,
          severity,
          slaHoursRemaining,
          escalated: true,
          thresholdTag
        });
      }
    }
  }

  escalationResults.evaluatedCount = tickets.length;
  escalationResults.escalatedCount = escalationResults.length;
  escalationResults.escalations = escalationResults;
  return escalationResults;
}

/**
 * Initializes the background defect SLA escalation cron scheduler
 */
function initDefectEscalationCron(intervalMs = 30 * 60 * 1000) {
  if (escalationCronInterval) {
    clearInterval(escalationCronInterval);
    escalationCronInterval = null;
  }

  if (process.env.NODE_ENV === 'test' || process.env.VERCEL) {
    return;
  }

  const bootTimer = setTimeout(() => {
    runDefectEscalationCheck().catch(err => {
      console.warn('[Defect SLA Cron] Initial check notice:', err.message);
    });
  }, 25000);
  if (bootTimer.unref) bootTimer.unref();

  escalationCronInterval = setInterval(() => {
    runDefectEscalationCheck().catch(err => {
      console.warn('[Defect SLA Cron] Recurring check notice:', err.message);
    });
  }, intervalMs);
  if (escalationCronInterval.unref) escalationCronInterval.unref();

  console.log(`⏰ [Defect SLA Cron] Background evaluator initialized (${Math.round(intervalMs / 60000)}m interval).`);
}

function stopDefectEscalationCron() {
  if (escalationCronInterval) {
    clearInterval(escalationCronInterval);
    escalationCronInterval = null;
  }
}

module.exports = {
  runDefectEscalationCheck,
  initDefectEscalationCron,
  stopDefectEscalationCron,
  escalatedTickets
};
