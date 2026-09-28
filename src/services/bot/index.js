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
  sendTelegramNotification: (...args) => notifications.sendTelegramNotification(...args),
  sendToGroup: (...args) => notifications.sendToGroup(...args),
  sendAgreementNotification: (...args) => notifications.sendAgreementNotification(...args),
  sendClientDeliverableNotification: (...args) => notifications.sendClientDeliverableNotification(...args),
  sendClientInvoiceNotification: (...args) => notifications.sendClientInvoiceNotification(...args),
  sendWarrantyActivatedNotification: (...args) => notifications.sendWarrantyActivatedNotification(...args),
  sendTeamWarrantyAlert: (...args) => notifications.sendTeamWarrantyAlert(...args),
  sendSprintDeliveredNotification: (...args) => notifications.sendSprintDeliveredNotification(...args),
  sendRetainerBurndownAlert: (...args) => notifications.sendRetainerBurndownAlert(...args),
  sendWarrantyExpiryAlert: (...args) => notifications.sendWarrantyExpiryAlert(...args),
  getRoleKeyboard: keyboards.getRoleKeyboard,
  getClientKeyboard: keyboards.getClientKeyboard
};
