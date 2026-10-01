/**
 * src/services/bot/team-bot.js
 * ───────────────
 * Team bot router & modular callback registration.
 */

const legacyBot = require('../bot');
const { handlePaymentCallback } = require('./handlers/payment-callbacks');

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
  });
}

module.exports = {
  getTeamBot: legacyBot.getTeamBot,
  registerTeamBotCallbacks,
  handlePaymentCallback
};
