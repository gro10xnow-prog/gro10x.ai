/**
 * src/services/bot/handlers/profile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User Profile, Earnings, and Bank/bKash Details Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');

async function handleMyProfile(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
  }

  const text = `👤 *PURPLEBOT EMPLOYEE PROFILE*\n\n` +
    `• Name: *${emp.name}*\n` +
    `• Employee ID: *${emp.id}*\n` +
    `• Role: *${emp.role}*\n` +
    `• Department: *${emp.department || 'General'}*\n` +
    `• Rank & XP: *${emp.badge || '🌱 Recruit'}* (${emp.xp || 0} XP)\n` +
    `• Access Level: *${emp.accessLevel || 'Specialist'}*\n` +
    `• Current Status: *${emp.status || 'Offline'}*\n\n` +
    `🌐 Update profile details via Web App: https://purpleos-iota.vercel.app/team-miniapp`;

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleMyEarnings(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);
  }
  const total = (emp.baseSalary || 0) + (emp.earnedCommissions || 0);
  const message = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
    `• Role: *${emp.role}*\n` +
    `• Base Pay: *BDT ${(emp.baseSalary || 0).toLocaleString()}*\n` +
    `• Commissions: *BDT ${(emp.earnedCommissions || 0).toLocaleString()}*\n` +
    `-----------------------------------------\n` +
    `*Total Monthly Pay: BDT ${total.toLocaleString()}*`;
  teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function handleMyBank(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
  }

  const bank = emp.bankInfo || {};
  const text = `💳 *PAYOUT & BANK DETAILS — ${emp.name}*\n\n` +
    `• Bank Name: *${bank.bankName || 'Not configured'}*\n` +
    `• Account Name: *${bank.accName || emp.name}*\n` +
    `• Account No: *${bank.accNo || 'Not configured'}*\n` +
    `• Branch: *${bank.branch || 'Not configured'}*\n` +
    `• bKash Personal: *${bank.mfsNo || 'Not configured'}*\n\n` +
    `🌐 Update Payout Info via App: https://purpleos-iota.vercel.app/team-miniapp`;

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

module.exports = {
  handleMyProfile,
  handleMyEarnings,
  handleMyBank
};
