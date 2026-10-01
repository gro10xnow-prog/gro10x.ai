/**
 * src/services/bot/team-bot.js
 * ───────────────
 * Team bot router & modular callback registration.
 */

const legacyBot = require('../bot');
const { handlePaymentCallback } = require('./handlers/payment-callbacks');
const { handleAgreementCallback } = require('./handlers/agreement-callbacks');
const { handleLeaveCallback } = require('./handlers/leave-callbacks');

/**
 * Register modular callback query handlers on teamBot
 */
function registerTeamBotCallbacks(bot) {
  if (!bot) return;

  bot.on('callback_query', async (query) => {
    const data = query.data || '';
    if (data.startsWith('pay_approve:') || data.startsWith('pay_reject:')) {
      return handlePaymentCallback(bot, query);
    }
    if (data.startsWith('agr_stage2:') || data.startsWith('agr_stage3:')) {
      return handleAgreementCallback(bot, query);
    }
    if (
      data.startsWith('approve_leave:') ||
      data.startsWith('leave_approve:') ||
      data.startsWith('approve_leave_owner:') ||
      data.startsWith('leave_approve_owner:') ||
      data.startsWith('reject_leave:') ||
      data.startsWith('leave_reject:')
    ) {
      return handleLeaveCallback(bot, query);
    }
  });
}

module.exports = {
  getTeamBot: legacyBot.getTeamBot,
  registerTeamBotCallbacks,
  handlePaymentCallback,
  handleAgreementCallback,
  handleLeaveCallback
};
