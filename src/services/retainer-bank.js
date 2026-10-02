/**
 * src/services/retainer-bank.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Retainer Hours Banking & Burn-Down Engine
 * Provides:
 * 1. Monthly Retainer Hours Ledger & Burn-Down Tracking
 * 2. Real-Time Capacity Alerting ('healthy' -> 'nearing_capacity' -> 'critical_overage')
 * 3. Overage Detection & Rollover Hour Governance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { supabase, isSupabaseConfigured } = require('./supabase');
const { findProject } = require('./post-delivery');

// In-memory fallback cache for retainer ledgers
const memoryRetainerBanks = new Map();

/**
 * Initializes or resets a Retainer Bank for a project
 */
function initializeRetainerBank(projectId, config = {}) {
  const cfg = typeof config === 'number' ? { totalPurchasedHours: config } : config;
  const totalPurchasedHours = Number(cfg.totalPurchasedHours || cfg.hours || cfg.hoursBanked || 40);
  const hourlyRateUsd = Number(cfg.hourlyRateUsd || cfg.overageHourlyRateUsd || 45);
  const rolloverHours = Number(cfg.rolloverHours || 0);

  const now = new Date();
  const cycleStart = config.billingCycleStart || now.toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const cycleEnd = config.billingCycleEnd || end.toISOString();

  const bank = {
    projectId,
    totalPurchasedHours,
    rolloverHours,
    totalAvailableHours: totalPurchasedHours + rolloverHours,
    hourlyRateUsd,
    billingCycleStart: cycleStart,
    billingCycleEnd: cycleEnd,
    logs: [],
    status: 'healthy',
    lastUpdatedAt: new Date().toISOString()
  };

  memoryRetainerBanks.set(projectId, bank);

  if (isSupabaseConfigured()) {
    try {
      supabase.from('retainer_banks').upsert({
        project_id: projectId,
        total_purchased_hours: totalPurchasedHours,
        rollover_hours: rolloverHours,
        hourly_rate_usd: hourlyRateUsd,
        billing_cycle_start: cycleStart,
        billing_cycle_end: cycleEnd,
        status: 'healthy',
        updated_at: bank.lastUpdatedAt
      }).then?.(() => {}).catch?.(() => {});
    } catch (_) {}
  }

  return computeBankSummary(bank);
}

// Pre-initialize demo/fallback retainer bank for purplebot
try {
  initializeRetainerBank('proj-purplebot-01', {
    totalPurchasedHours: 30,
    hourlyRateUsd: 45,
    rolloverHours: 0
  });
  const defaultBank = memoryRetainerBanks.get('proj-purplebot-01');
  if (defaultBank) {
    defaultBank.logs = [
      { id: 'log-01', hours: 18, taskDescription: 'LangGraph Agent Orchestration & Node State Routing', category: 'Architecture & System Design', loggedBy: 'Lead AI Engineer', loggedAt: new Date().toISOString() },
      { id: 'log-02', hours: 7, taskDescription: 'Supabase pgvector Indexing & Multi-Tenant RLS Policy', category: 'Core AI/LLM Development', loggedBy: 'Database Architect', loggedAt: new Date().toISOString() }
    ];
  }
} catch (_) {}

/**
 * Helper to calculate current consumption and status
 */
function computeBankSummary(bank) {
  const totalAvailable = Number(bank.totalPurchasedHours || 0) + Number(bank.rolloverHours || 0);
  const logs = bank.logs || [];
  const usedHours = Number(logs.reduce((sum, l) => sum + Number(l.hours || 0), 0).toFixed(2));
  const remainingHours = Number(Math.max(0, totalAvailable - usedHours).toFixed(2));
  const overageHours = usedHours > totalAvailable ? Number((usedHours - totalAvailable).toFixed(2)) : 0;
  
  const burnRatePercent = totalAvailable > 0 
    ? Math.min(100, Math.round((usedHours / totalAvailable) * 100))
    : 100;

  let status = 'healthy';
  let alert = null;

  if (overageHours > 0 || burnRatePercent >= 100) {
    status = 'critical_overage';
    alert = `⚠️ Retainer exceeded allocated capacity by ${overageHours} hours. Billable at standard overage rate ($${bank.hourlyRateUsd}/hr).`;
  } else if (burnRatePercent >= 85 || (totalAvailable > 0 && remainingHours <= totalAvailable * 0.15)) {
    status = 'critical_capacity';
    alert = `🚨 Retainer has reached critical capacity with ${burnRatePercent}% consumed. Only ${remainingHours} hours remaining (< 15%).`;
  } else if (burnRatePercent >= 75) {
    status = 'nearing_capacity';
    alert = `🔔 Retainer has consumed ${burnRatePercent}% of monthly hours. Only ${remainingHours} hours remaining.`;
  }

  const tasks = [...logs].reverse().map(l => ({
    id: l.id,
    hours: l.hours,
    description: l.taskDescription,
    taskDescription: l.taskDescription,
    category: l.category,
    deliverableId: l.deliverableId,
    loggedBy: l.loggedBy,
    loggedAt: l.loggedAt
  }));

  return {
    projectId: bank.projectId,
    totalPurchasedHours: bank.totalPurchasedHours,
    rolloverHours: bank.rolloverHours,
    totalAvailableHours: totalAvailable,
    usedHours,
    remainingHours,
    overageHours,
    burnRatePercent,
    hourlyRateUsd: bank.hourlyRateUsd,
    billingCycleStart: bank.billingCycleStart,
    billingCycleEnd: bank.billingCycleEnd,
    status,
    alert,
    logCount: logs.length,
    logs: [...logs].reverse(), // Most recent logs first
    // Ergonomic / Admin Studio / Test Suite aliases
    hoursBanked: totalAvailable,
    hoursLogged: usedHours,
    hoursRemaining: remainingHours,
    isNearCap: burnRatePercent >= 75 || status === 'critical_capacity' || status === 'critical_overage',
    isCriticalCap: status === 'critical_capacity' || status === 'critical_overage',
    isOverage: overageHours > 0 || status === 'critical_overage',
    tasks
  };
}

/**
 * Retrieves the retainer bank for a project
 */
async function getRetainerBank(projectId) {
  if (!memoryRetainerBanks.has(projectId)) {
    if (isSupabaseConfigured()) {
      try {
        const { data: bankData } = await supabase.from('retainer_banks').select('*').eq('project_id', projectId).maybeSingle();
        if (bankData) {
          const { data: logData } = await supabase.from('retainer_hours_logs').select('*').eq('project_id', projectId).order('logged_at', { ascending: true });
          const bank = {
            projectId,
            totalPurchasedHours: Number(bankData.total_purchased_hours || 40),
            rolloverHours: Number(bankData.rollover_hours || 0),
            totalAvailableHours: Number(bankData.total_purchased_hours || 40) + Number(bankData.rollover_hours || 0),
            hourlyRateUsd: Number(bankData.hourly_rate_usd || 45),
            billingCycleStart: bankData.billing_cycle_start,
            billingCycleEnd: bankData.billing_cycle_end,
            status: bankData.status || 'healthy',
            logs: (logData || []).map(l => ({
              id: l.id,
              hours: Number(l.hours),
              taskDescription: l.task_description,
              category: l.category,
              deliverableId: l.deliverable_id,
              loggedBy: l.logged_by,
              loggedAt: l.logged_at,
              notes: l.notes
            })),
            lastUpdatedAt: bankData.updated_at || new Date().toISOString()
          };
          memoryRetainerBanks.set(projectId, bank);
          return computeBankSummary(bank);
        }
      } catch (_) {}
    }

    const project = await findProject(projectId);
    if (!project) {
      throw new Error(`Project '${projectId}' not found.`);
    }
    initializeRetainerBank(projectId, {
      totalPurchasedHours: project.retainerHours || 40,
      hourlyRateUsd: project.hourlyRate || 45
    });
  }

  return computeBankSummary(memoryRetainerBanks.get(projectId));
}

/**
 * Logs consumed retainer hours to a project bank
 */
async function logRetainerHours(projectId, entry = {}) {
  const hours = Number(entry.hours !== undefined ? entry.hours : entry.hoursLogged);
  if (!hours || isNaN(hours) || hours <= 0) {
    throw new Error('Valid positive numeric hours value is required.');
  }

  if (!memoryRetainerBanks.has(projectId)) {
    await getRetainerBank(projectId);
  }

  const bank = memoryRetainerBanks.get(projectId);
  const logId = `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const taskDesc = entry.taskDescription || entry.taskName || entry.description || 'General engineering sprint support';
  const engineerName = entry.loggedBy || entry.engineer || 'Delivery Pod Engineer';
  const notesText = entry.notes || '';

  const newLog = {
    id: logId,
    hours,
    taskDescription: taskDesc,
    category: entry.category || 'ai_development',
    deliverableId: entry.deliverableId || null,
    loggedBy: engineerName,
    notes: notesText,
    loggedAt: new Date().toISOString()
  };

  let summary;

  if (isSupabaseConfigured()) {
    try {
      // 1. Attempt atomic stored procedure with row-level pessimistic lock
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('burn_retainer_hours', {
        p_project_id: projectId,
        p_hours: hours,
        p_task_description: taskDesc,
        p_category: entry.category || 'ai_development',
        p_deliverable_id: entry.deliverableId || null,
        p_logged_by: engineerName,
        p_notes: notesText
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        newLog.id = rpcRes.logId || logId;
        newLog.loggedAt = rpcRes.loggedAt || newLog.loggedAt;
        bank.logs.push(newLog);
        bank.lastUpdatedAt = new Date().toISOString();
        bank.status = rpcRes.status || bank.status;
        summary = computeBankSummary(bank);
      } else {
        // Fallback if RPC is pending migration in DB
        bank.logs.push(newLog);
        bank.lastUpdatedAt = new Date().toISOString();
        summary = computeBankSummary(bank);

        await supabase.from('retainer_hours_logs').insert([{
          id: logId,
          project_id: projectId,
          hours,
          task_description: taskDesc,
          category: entry.category || 'ai_development',
          deliverable_id: entry.deliverableId || null,
          logged_by: engineerName,
          notes: notesText,
          logged_at: newLog.loggedAt
        }]);

        await supabase.from('retainer_banks').upsert({
          project_id: projectId,
          total_purchased_hours: bank.totalPurchasedHours,
          rollover_hours: bank.rolloverHours,
          hourly_rate_usd: bank.hourlyRateUsd,
          billing_cycle_start: bank.billingCycleStart,
          billing_cycle_end: bank.billingCycleEnd,
          status: summary.status,
          updated_at: bank.lastUpdatedAt
        });
      }
    } catch (_) {
      bank.logs.push(newLog);
      bank.lastUpdatedAt = new Date().toISOString();
      summary = computeBankSummary(bank);
    }
  } else {
    bank.logs.push(newLog);
    bank.lastUpdatedAt = new Date().toISOString();
    summary = computeBankSummary(bank);
  }

  // Dispatch Retainer Burndown Telegram Alert if nearing capacity (>=75%), critical capacity (<15%), or overage
  if (summary.status === 'critical_overage' || summary.status === 'critical_capacity' || summary.status === 'nearing_capacity') {
    try {
      const { sendRetainerBurndownAlert } = require('./bot/notifications');
      findProject(projectId).then(proj => {
        sendRetainerBurndownAlert(summary, proj || { id: projectId }, newLog);
      }).catch(() => {
        sendRetainerBurndownAlert(summary, { id: projectId }, newLog);
      });
    } catch (_) {}
  }

  // SSE Real-Time Broadcast to Client Portal & Operational Hubs
  try {
    const { broadcast, broadcastToClient } = require('./sse');
    const ssePayload = {
      projectId,
      log: newLog,
      summary,
      burnRatePercent: summary.burnRatePercent,
      remainingHours: summary.remainingHours,
      usedHours: summary.usedHours,
      status: summary.status
    };
    broadcast('retainer_update', ssePayload);

    findProject(projectId).then(proj => {
      const targetClientId = proj?.clientId || proj?.client_id || proj?.clientAccountId;
      if (targetClientId) {
        broadcastToClient('retainer_update', ssePayload, [targetClientId]);
      }
    }).catch(() => {});
  } catch (_) {}

  return {
    ok: true,
    log: newLog,
    summary,
    hoursRemaining: summary.remainingHours,
    hoursLogged: summary.usedHours,
    hoursBanked: summary.totalAvailableHours,
    isNearCap: summary.burnRatePercent >= 75 || summary.status === 'critical_capacity' || summary.status === 'critical_overage',
    isCriticalCap: summary.status === 'critical_capacity' || summary.status === 'critical_overage',
    isOverage: summary.overageHours > 0 || summary.status === 'critical_overage',
    tasks: summary.tasks
  };
}

module.exports = {
  initializeRetainerBank,
  getRetainerBank,
  getRetainerBalance: getRetainerBank,
  logRetainerHours,
  computeBankSummary,
  memoryRetainerBanks
};
