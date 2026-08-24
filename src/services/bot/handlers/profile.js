/**
 * src/services/bot/handlers/profile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User Profile, Earnings, and Bank/bKash Details Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');

async function handleMyProfile(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
    }

    const text = `👤 *PURPLEBOT EMPLOYEE PROFILE*\n\n` +
      `• Name: *${emp.name}*\n` +
      `• Employee ID: *${emp.emp_code || emp.id}*\n` +
      `• Role: *${emp.role}*\n` +
      `• Department: *${emp.department || 'General'}*\n` +
      `• Rank & XP: *${emp.badge || '🌱 Recruit'}* (${emp.xp || 0} XP)\n` +
      `• Access Level: *${emp.accessLevel || 'Specialist'}*\n` +
      `• Current Status: *${emp.status || 'Offline'}*`;

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Open Profile Card (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=profile' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Profile Bot] handleMyProfile error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch employee profile.');
  }
}

async function handleMyEarnings(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 View/Update Bank Details', callback_data: 'cmd_mybank' },
            { text: '📱 Open Pay Portal', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=pay' } }
          ]
        ]
      }
    };
    teamBot.sendMessage(chatId, message, options);
  } catch (err) {
    console.error('[Profile Bot] handleMyEarnings error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch earnings breakdown.');
  }
}

async function handleMyBank(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
      `• bKash Personal: *${bank.mfsNo || 'Not configured'}*`;

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Edit Bank / bKash Info', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=bank' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Profile Bot] handleMyBank error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch bank details.');
  }
}

module.exports = {
  handleMyProfile,
  handleMyEarnings,
  handleMyBank
};
