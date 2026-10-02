/**
 * src/services/warranty-cron.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: 30-Day Bug-Fix Warranty Expiry Horizon Monitor & Cron Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 * 1. Proactively scans all active Engine 2 projects under 30-Day SLA warranty
 * 2. 7-Day Advance Warning: Alerts client & team of impending warranty closure
 * 3. 1-Day Final Warning: Dispatches last-call defect notice to client & team
 * 4. Automatic Transition: Flags expired warranties to 'WARRANTY_CLOSED'
 * 5. Anti-Spam Frequency Capping: Dedupes notifications per milestone
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { readDB, writeDB } = require('./db');
const { sendWarrantyExpiryAlert } = require('./bot/notifications');
const { broadcast } = require('./sse');

let cronInterval = null;

// In-memory notified cache to prevent duplicate alerts during same cycle
const notifiedProjectsCache = new Map();

/**
 * Evaluates active warranty projects and dispatches milestone alerts
 * @returns {Promise<{ success: boolean, evaluatedCount: number, remindersSent: number, dueProjects: Array }>}
 */
async function runWarrantyCheck() {
  console.log('⏰ [Warranty Cron] Evaluating active project warranties...');
  const now = new Date();
  let projects = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .not('warranty_until', 'is', null);

      if (!error && data) {
        projects = data;
      }
    } catch (err) {
      console.warn('⚠️ [Warranty Cron DB Note]:', err.message);
    }
  }

  if (projects.length === 0) {
    try {
      const db = await readDB();
      projects = (db.projects || []).filter(p => p.warranty_until || p.warrantyUntil);
    } catch (_) {}
  }

  // Merge in-memory projects from post-delivery service (for resilience & tests)
  try {
    const { memoryProjects } = require('./post-delivery');
    if (memoryProjects && memoryProjects.size > 0) {
      for (const [id, mp] of memoryProjects.entries()) {
        if (mp.warranty_until || mp.warrantyUntil) {
          const exIdx = projects.findIndex(p => p.id === id);
          if (exIdx !== -1) {
            projects[exIdx] = { ...projects[exIdx], ...mp };
          } else {
            projects.push(mp);
          }
        }
      }
    }
  } catch (_) {}

  let remindersSent = 0;
  const dueProjects = [];

  for (const project of projects) {
    const rawExpiry = project.warranty_until || project.warrantyUntil;
    if (!rawExpiry) continue;

    // Check if project is under active dispute (timer is frozen)
    const isDisputed = (project.delivery_status || project.deliveryStatus) === 'DISPUTED';
    if (isDisputed) continue;

    const expiry = new Date(rawExpiry);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const cacheKey = `${project.id}_${expiry.toISOString().split('T')[0]}`;
    const notifiedState = notifiedProjectsCache.get(cacheKey) || {
      warned7d: project.warranty_notified_7d || false,
      warned1d: project.warranty_notified_1d || false,
      closed: project.delivery_status === 'WARRANTY_CLOSED'
    };

    // 1. 7-Day Horizon Alert (2 to 7 days remaining)
    if (daysRemaining <= 7 && daysRemaining > 1 && !notifiedState.warned7d) {
      dueProjects.push({ ...project, daysRemaining, milestone: '7_DAYS' });
      try {
        sendWarrantyExpiryAlert(project, 7, true);  // To Client
        sendWarrantyExpiryAlert(project, 7, false); // To Team / Founder
        notifiedState.warned7d = true;
        project.warranty_notified_7d = true;
        remindersSent++;
      } catch (err) {
        console.warn(`[Warranty Cron] 7d alert failed for ${project.id}:`, err.message);
      }
    }

    // 2. 1-Day Final Notice (0 to 1 days remaining)
    if (daysRemaining === 1 && !notifiedState.warned1d) {
      dueProjects.push({ ...project, daysRemaining, milestone: '1_DAY' });
      try {
        sendWarrantyExpiryAlert(project, 1, true);  // To Client
        sendWarrantyExpiryAlert(project, 1, false); // To Team / Founder
        notifiedState.warned1d = true;
        project.warranty_notified_1d = true;
        remindersSent++;
      } catch (err) {
        console.warn(`[Warranty Cron] 1d alert failed for ${project.id}:`, err.message);
      }
    }

    // 3. Warranty Closed Transition
    if (daysRemaining <= 0 && !notifiedState.closed) {
      project.delivery_status = 'WARRANTY_CLOSED';
      project.deliveryStatus = 'WARRANTY_CLOSED';
      notifiedState.closed = true;

      try {
        const { memoryProjects } = require('./post-delivery');
        if (memoryProjects && memoryProjects.has(project.id)) {
          const mem = memoryProjects.get(project.id);
          mem.delivery_status = 'WARRANTY_CLOSED';
          mem.deliveryStatus = 'WARRANTY_CLOSED';
        }
      } catch (_) {}

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('projects').update({
            delivery_status: 'WARRANTY_CLOSED',
            updated_at: new Date().toISOString()
          }).eq('id', project.id);
        } catch (_) {}
      }

      broadcast('project_update', { id: project.id, delivery_status: 'WARRANTY_CLOSED' });
      console.log(`🛡️ [Warranty Cron] Project ${project.id} warranty period completed and closed.`);

      // Release contractor escrow if all warranty defects are resolved.
      // Query Supabase directly — tickets are fully persisted, no in-process array.
      try {
        let openDefects = [];
        if (isSupabaseConfigured()) {
          const { data: defectRows } = await supabase
            .from('tickets')
            .select('id')
            .or(`project_id.eq.${project.id}`)
            .not('status', 'in', '("resolved","closed","Resolved","Closed")');
          openDefects = defectRows || [];
        }

        if (openDefects.length === 0) {
          const { emitStakeholderEvent } = require('./stakeholder-events');
          emitStakeholderEvent('ticket.sla_holdback_released', {
            projectId: project.id,
            projectName: project.name || project.title,
            status: 'RELEASED_FROM_ESCROW'
          }, {
            stakeholderId: project.id,
            stakeholderType: 'contractor'
          }).catch?.(() => {});

          if (isSupabaseConfigured()) {
            supabase.from('sla_holdbacks')
              .update({ status: 'RELEASED', resolved_at: new Date().toISOString() })
              .eq('project_id', project.id)
              .in('status', ['HELD_IN_ESCROW', 'HELD'])
              .then?.(() => {}).catch?.(() => {});
          }
        }
      } catch (_) {}
    }

    notifiedProjectsCache.set(cacheKey, notifiedState);
  }

  console.log(`✅ [Warranty Cron] Evaluated ${projects.length} projects: ${remindersSent} alerts sent, ${dueProjects.length} due milestones.`);

  return {
    success: true,
    evaluatedCount: projects.length,
    remindersSent,
    dueProjects
  };
}

/**
 * Initializes background cron schedule (runs once daily)
 */
function initWarrantyCron(intervalMs = 24 * 60 * 60 * 1000) {
  if (process.env.NODE_ENV === 'test' || process.env.VERCEL) {
    return;
  }

  if (cronInterval) {
    clearInterval(cronInterval);
  }

  // Initial evaluation after 20 seconds (unref'd so it never blocks process shutdown)
  const bootTimer = setTimeout(() => {
    runWarrantyCheck().catch(e => console.warn('[Warranty Cron] Initial run note:', e.message));
  }, 20000);
  if (bootTimer.unref) bootTimer.unref();

  cronInterval = setInterval(() => {
    runWarrantyCheck().catch(e => console.warn('[Warranty Cron] Schedule run note:', e.message));
  }, intervalMs);
  if (cronInterval.unref) cronInterval.unref();

  console.log('⏰ [Warranty Cron] Background schedule initialized (24h interval).');
}

function stopWarrantyCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}

module.exports = {
  runWarrantyCheck,
  initWarrantyCron,
  stopWarrantyCron,
  notifiedProjectsCache
};
