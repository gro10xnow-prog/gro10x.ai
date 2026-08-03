/**
 * src/services/bot/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Modular Entry Point Bridge for PurpleOS Telegram Bot Service.
 * Ensures 100% backwards compatibility during Phase 2 refactoring.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const legacyBot = require('../bot');
const keyboards = require('./keyboards');
const notifications = require('./notifications');

module.exports = {
  initBot: legacyBot.initBot,
  getTeamBot: legacyBot.getTeamBot,
  getClientBot: legacyBot.getClientBot,
  sendTelegramNotification: notifications.sendTelegramNotification,
  sendToGroup: notifications.sendToGroup,
  sendAgreementNotification: notifications.sendAgreementNotification,
  getRoleKeyboard: keyboards.getRoleKeyboard,
  getClientKeyboard: keyboards.getClientKeyboard
};
