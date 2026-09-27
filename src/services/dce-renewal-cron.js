/**
 * src/services/dce-renewal-cron.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Subscription & License Renewal Cron Engine
 * 
 * Capabilities:
 * 1. Proactive 7-day horizon tracking for expiring digital licenses
 * 2. Automated email dispatch with 1-click renewal links via Resend
 * 3. 48-Hour Anti-Spam Frequency Capping (prevents duplicate nags)
 * 4. Executive Telegram Group Digest for customer retention telemetry
 * 5. On-demand manual trigger API
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { sendRenewalReminderEmail } = require('./resend');
const { getTeamBot } = require('./bot');

let cronTimer = null;

/**
 * Evaluates expiring digital licenses and dispatches renewal reminders
 * @returns {Promise<{ success: boolean, processed: number, remindersSent: number, dueLicenses: Array }>}
 */
async function runDCERenewalCheck() {
  console.log('⏰ [DCE Renewal Engine] Evaluating expiring licenses across brands...');
  const now = new Date();
  let licenses = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_digital_licenses')
        .select(`
          *,
          dce_customers(full_name, email, phone),
          dce_skus(sku, title, dce_products(brand_id, dce_brands(name)))
        `)
        .eq('is_active', true)
        .not('expires_at', 'is', null);

      if (!error && data) licenses = data;
    } catch (err) {
      console.error('❌ [DCE Renewal Engine DB Error]:', err.message);
    }
  }

  let remindersSent = 0;
  const dueLicenses = [];

  for (const lic of licenses) {
    if (!lic.expires_at) continue;
    const expiry = new Date(lic.expires_at);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Target licenses expiring within 7 days or expired within last 3 days
    if (daysRemaining <= 7 && daysRemaining >= -3) {
      dueLicenses.push({ ...lic, daysRemaining });

      // Anti-Spam Check: Ensure at least 48 hours since last reminder
      let shouldSend = true;
      if (lic.last_reminder_at) {
        const lastSent = new Date(lic.last_reminder_at);
        const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 48) {
          shouldSend = false;
        }
      }

      if (shouldSend) {
        const customerEmail = lic.dce_customers?.email;
        const brandName = lic.dce_skus?.dce_products?.dce_brands?.name || 'GRO10X Brand';

        if (customerEmail) {
          try {
            await sendRenewalReminderEmail({
              customerEmail,
              customerName: lic.dce_customers?.full_name,
              brandName,
              productTitle: lic.dce_skus?.title || 'Subscription Asset',
              sku: lic.dce_skus?.sku || lic.sku || 'DCE-SKU',
              daysRemaining: Math.max(0, daysRemaining),
              renewalUrl: `https://gro10x-ai.vercel.app/dce/renew?lic=${lic.license_key}`
            });
            remindersSent++;

            // Update DB telemetry
            if (isSupabaseConfigured() && lic.id) {
              await supabase
                .from('dce_digital_licenses')
                .update({
                  last_reminder_at: now.toISOString(),
                  renewal_count: (lic.renewal_count || 0) + 1,
                  updated_at: now.toISOString()
                })
                .eq('id', lic.id);
            }
          } catch (e) {
            console.warn(`[DCE Renewal] Reminder failed for license ${lic.license_key}:`, e.message);
          }
        }
      }
    }
  }

  // Telegram Group Alert Digest
  if (dueLicenses.length > 0) {
    try {
      const teamBot = getTeamBot();
      if (teamBot && process.env.TELEGRAM_TEAM_GROUP_ID) {
        const digest = `🔔 *DCE License Renewal Telemetry Digest*\n\n` +
          `• *Expiring Licenses:* ${dueLicenses.length} accounts\n` +
          `• *Reminders Dispatched:* ${remindersSent} customers\n\n` +
          dueLicenses.slice(0, 5).map(l => `• \`${l.license_key.slice(0, 16)}...\`: ${l.daysRemaining <= 0 ? '⚠️ Expired' : `${l.daysRemaining}d remaining`}`).join('\n') +
          (dueLicenses.length > 5 ? `\n• _+${dueLicenses.length - 5} more in Operations Dashboard_` : '') +
          `\n\n_Action: View in Operations Dashboard ➔ Licenses Tab._`;

        teamBot.sendMessage(process.env.TELEGRAM_TEAM_GROUP_ID, digest, { parse_mode: 'Markdown' }).catch(() => {});
      }
    } catch (e) {}
  }

  console.log(`✅ [DCE Renewal Engine] Finished: ${dueLicenses.length} due, ${remindersSent} reminders sent.`);
  return {
    success: true,
    processed: licenses.length,
    remindersSent,
    dueLicenses
  };
}

/**
 * Initializes the background scheduled DCE renewal cron worker
 */
function initDCERenewalCron() {
  if (cronTimer) return;

  // Run initial check 15 seconds after boot (staggered from DigiVault cron)
  const bootTimer = setTimeout(() => {
    runDCERenewalCheck().catch(err => console.error('DCE Cron initial run error:', err.message));
  }, 15000);
  if (bootTimer.unref) bootTimer.unref();

  // Set recurring 12-hour interval
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  cronTimer = setInterval(() => {
    runDCERenewalCheck().catch(err => console.error('DCE Cron interval run error:', err.message));
  }, TWELVE_HOURS);
  if (cronTimer.unref) cronTimer.unref();

  console.log('⏰ [DCE Renewal Engine] Background schedule initialized (12h interval).');
}

module.exports = {
  runDCERenewalCheck,
  initDCERenewalCron
};
