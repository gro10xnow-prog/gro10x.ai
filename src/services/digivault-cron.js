/**
 * src/services/digivault-cron.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DigiVault — Automated Subscription Retention & Renewal Cron Service v1.0
 * 
 * Capabilities:
 * 1. Proactive 3-Day & Expiry Horizon Tracking
 * 2. Telegram Bot Push Renewal Notifications with 1-Click Renewal Buttons
 * 3. Anti-Spam Frequency Capping (40-hour cooldown per reminder)
 * 4. Executive Admin & Team Alert Telemetry
 * 5. On-Demand Trigger API Support
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { getDigiVaultBot, sendRenewalReminder } = require('./digivault-bot');
const { getTeamBot } = require('./bot');

let cronTimer = null;

/**
 * Runs a comprehensive subscription renewal check across active orders.
 * @returns {Promise<{ success: boolean, processed: number, remindersSent: number, dueOrders: Array }>}
 */
async function runDigiVaultRenewalCheck() {
  console.log('⏰ [DigiVault Retention Cron] Starting daily renewal evaluation...');
  const now = new Date();
  let orders = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('digi_orders')
        .select('*')
        .eq('delivery_status', 'delivered')
        .eq('is_renewed', false)
        .not('expiry_date', 'is', null);

      if (!error && data) {
        orders = data;
      }
    } catch (err) {
      console.error('❌ [DigiVault Retention Cron] DB fetch error:', err.message);
    }
  }

  let remindersSent = 0;
  const dueOrders = [];
  const bot = getDigiVaultBot();

  for (const order of orders) {
    if (!order.expiry_date) continue;
    const expiry = new Date(order.expiry_date);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Target orders expiring within 3 days or expired within the last 7 days
    if (daysRemaining <= 3 && daysRemaining >= -7) {
      dueOrders.push({ ...order, daysRemaining });

      // Anti-Spam Check: Ensure at least 40 hours since last reminder
      let shouldSend = true;
      if (order.last_renewal_reminder_at) {
        const lastSent = new Date(order.last_renewal_reminder_at);
        const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 40) {
          shouldSend = false;
        }
      }

      if (shouldSend) {
        // 1. Proactive Customer Push on Telegram
        if (order.telegram_chat_id && bot) {
          try {
            await sendRenewalReminder(bot, order.telegram_chat_id, order, daysRemaining);
            remindersSent++;
          } catch (e) {
            console.warn(`[DigiVault Cron] Telegram reminder failed for ${order.order_number}:`, e.message);
          }
        }

        // 2. Update DB Telemetry
        if (isSupabaseConfigured() && order.id) {
          try {
            await supabase.from('digi_orders').update({
              last_renewal_reminder_at: now.toISOString(),
              renewal_reminder_count: (order.renewal_reminder_count || 0) + 1,
              updated_at: now.toISOString()
            }).eq('id', order.id);
          } catch (e) {}
        }
      }
    }
  }

  // 3. Consolidated Admin Digest
  if (dueOrders.length > 0) {
    try {
      const adminChatId = process.env.DIGIVAULT_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
      const digestMsg = `🔔 *DigiVault Daily Renewal Telemetry Report*\n\n` +
        `📋 *Subscriptions Due:* ${dueOrders.length} accounts\n` +
        `📱 *Automated Push Sent:* ${remindersSent} customers\n\n` +
        dueOrders.slice(0, 5).map(o => `• \`${o.order_number}\`: ${o.product_name} (${o.daysRemaining <= 0 ? '⚠️ Expired' : `${o.daysRemaining}d left`})`).join('\n') +
        (dueOrders.length > 5 ? `\n• _+${dueOrders.length - 5} more in Admin Panel_` : '') +
        `\n\n_Action: Review in Admin Panel ➔ Renewals Tab._`;

      if (bot && adminChatId) {
        bot.sendMessage(adminChatId, digestMsg, { parse_mode: 'Markdown' }).catch(() => {});
      }

      const teamBot = getTeamBot();
      if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
        teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, digestMsg, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (e) {}
  }

  // 4. Prune Abandoned Bot Sessions
  let prunedSessionsCount = 0;
  try {
    const pruneRes = await pruneAbandonedBotSessions(7);
    prunedSessionsCount = pruneRes.deleted || 0;
  } catch (e) {}

  console.log(`✅ [DigiVault Retention Cron] Finished. ${dueOrders.length} due, ${remindersSent} reminders dispatched, ${prunedSessionsCount} stale sessions pruned.`);
  return {
    success: true,
    processed: orders.length,
    remindersSent,
    dueOrders,
    prunedSessions: prunedSessionsCount
  };
}

/**
 * Prunes abandoned or inactive Telegram bot sessions older than maxAgeDays.
 * @param {number} maxAgeDays Default is 7 days
 * @returns {Promise<{ success: boolean, deleted: number }>}
 */
async function pruneAbandonedBotSessions(maxAgeDays = 7) {
  console.log(`🧹 [DigiVault Cron] Pruning bot sessions older than ${maxAgeDays} days...`);
  let deletedCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('digi_bot_sessions')
        .delete()
        .lt('updated_at', cutoff)
        .select();

      if (!error && data) {
        deletedCount = data.length;
      }
    } catch (err) {
      console.error('❌ [DigiVault Cron] Session pruning error:', err.message);
    }
  }

  console.log(`✅ [DigiVault Cron] Pruned ${deletedCount} abandoned bot sessions.`);
  return {
    success: true,
    deleted: deletedCount
  };
}

/**
 * Initializes the background scheduled renewal cron worker.
 */
function initDigiVaultCron() {
  if (cronTimer) return;

  // Run initial check 10 seconds after boot
  const bootTimer = setTimeout(() => {
    runDigiVaultRenewalCheck().catch(err => console.error('Cron initial run error:', err.message));
  }, 10000);
  if (bootTimer.unref) bootTimer.unref();

  // Set recurring 24-hour interval
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  cronTimer = setInterval(() => {
    runDigiVaultRenewalCheck().catch(err => console.error('Cron interval run error:', err.message));
  }, TWENTY_FOUR_HOURS);
  if (cronTimer.unref) cronTimer.unref();

  console.log('⏰ [DigiVault Retention Cron] Background schedule initialized (24h interval).');
}

module.exports = {
  runDigiVaultRenewalCheck,
  pruneAbandonedBotSessions,
  initDigiVaultCron
};
