/**
 * src/services/bot/notifications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Notification & Alert Dispatch Utilities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TelegramBot = require('node-telegram-bot-api');

function sendTelegramNotification(chatId, text, inlineKeyboard = null, isTeam = false) {
  const legacyBot = require('../bot');
  const teamBot = legacyBot.getTeamBot();
  const clientBot = legacyBot.getClientBot();

  let targetBot = isTeam ? (teamBot || clientBot) : (clientBot || teamBot);

  if (!targetBot) {
    const token = process.env.TEAM_BOT_TOKEN || process.env.CLIENT_BOT_TOKEN || null?.teamBot?.token;
    if (token && token.trim() !== '' && !token.includes('your_token')) {
      try {
        targetBot = new TelegramBot(token, { polling: false });
      } catch (e) {}
    }
  }

  if (!targetBot) return false;

  const targetChatId = (chatId === '1708459008' || chatId === '+8801708459008') ? '7754769807' : chatId;

  const options = { parse_mode: 'Markdown' };
  if (inlineKeyboard && inlineKeyboard.length > 0) {
    options.reply_markup = { inline_keyboard: inlineKeyboard };
  }

  targetBot.sendMessage(targetChatId, text, options).catch(err => {
    console.warn('Telegram send error with Markdown, retrying plain text:', err.message);
    delete options.parse_mode;
    targetBot.sendMessage(targetChatId, text, options).catch(e2 => console.error('Telegram fallback error:', e2.message));
  });
  return true;
}

function sendToGroup(chatId, text, isTeam = true) {
  return sendTelegramNotification(chatId, text, null, isTeam);
}

async function sendAgreementNotification(stage, emp, dbData) {
  const legacyBot = require('../bot');
  const teamBot = legacyBot.getTeamBot();
  const { getRoleKeyboard } = require('./keyboards');

  if (!teamBot) return;

  if (stage === 1) {
    const finance = (dbData.team || []).find(e => e.accessLevel === 'Finance Manager');
    if (finance?.telegramId) {
      const msg = `📄 *Employment Agreement — Action Required*\n\n` +
        `*${emp.name}* (${emp.id}) has signed their Employment Agreement.\n` +
        `Role: *${emp.role}* · Dept: *${emp.department}*\n\n` +
        `📌 *Stage 2:* Your Finance Manager countersignature is required.`;
      teamBot.sendMessage(finance.telegramId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Counter-Sign as Finance Manager', callback_data: `agr_stage2:${emp.id}` }
          ]]
        }
      }).catch(() => {});
    }
    if (emp.telegramId) {
      teamBot.sendMessage(emp.telegramId,
        `✍️ *Agreement Signed!*\n\nYour Employment Agreement has been submitted.\n` +
        `Finance Manager will countersign within 24h.\n\n` +
        `📌 *Stage 2 of 3:* Awaiting Finance Manager countersignature.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  }

  if (stage === 2) {
    let finalApprover = null;
    if (emp.id === 'PBD-001') {
      finalApprover = (dbData.team || []).find(e => e.id === 'PBD-002');
    }
    if (!finalApprover) {
      finalApprover = (dbData.team || []).find(e =>
        (e.accessLevel === 'Owner / Admin' && e.id !== 'PBD-000' && e.id !== emp.id)
      ) || (dbData.team || []).find(e => e.id === 'PBD-000');
    }
    if (finalApprover?.telegramId) {
      const isMD = emp.id === 'PBD-001';
      const msg = `📄 *Employment Agreement — Final Approval Required*\n\n` +
        `*${emp.name}* (${emp.id}) — *${emp.role}*\n` +
        `Finance Manager has countersigned.\n\n` +
        `📌 *Stage 3 of 3:* ${isMD ? 'Chairman approval' : 'Owner approval'} will fully activate this employee.`;
      teamBot.sendMessage(finalApprover.telegramId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: isMD ? '🏛️ Chairman Final Seal & Activate' : '👑 Owner Final Seal & Activate Employee', callback_data: `agr_stage3:${emp.id}` }
          ]]
        }
      }).catch(() => {});
    }
    if (emp.telegramId) {
      teamBot.sendMessage(emp.telegramId,
        `✅ *Finance Manager Countersigned!*\n\nYour agreement has been verified by Finance.\n` +
        `Now pending final approval.\n\n` +
        `📌 *Stage 3 of 3:* Awaiting final sign-off. Usually done within 24–48h.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  }

  if (stage === 3) {
    if (emp.telegramId) {
      const keyboard = getRoleKeyboard(emp.accessLevel, true, { ...emp, onboardingComplete: true });
      teamBot.sendMessage(emp.telegramId,
        `🎉 *CONGRATULATIONS, ${emp.name}!*\n\n` +
        `Your Employment Agreement is fully executed and signed by all parties.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🚀 *You are now an official Purplebot Digital team member!*\n\n` +
        `📌 *Your Next Steps:*\n` +
        `1. 📍 Do your first GPS Clock-In to go Online\n` +
        `2. 📋 Check *My Tasks* for your first assignment\n` +
        `3. 💳 Verify your *Bank & bKash* payout accounts\n` +
        `4. 👤 Review your *My Profile* — check your salary details\n\n` +
        `Tap *Open App* to access your full dashboard. Welcome to the team! 💜`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      ).catch(() => {});
    }
  }
}

function sendClientDeliverableNotification(chatId, deliverable = {}) {
  const title = deliverable.project_name || deliverable.projectName || deliverable.title || 'Video Cut';
  const version = deliverable.active_version || deliverable.version || 'v1';
  const reviewId = deliverable.id;
  const reviewUrl = `https://gro10x-ai.vercel.app/reviewroom.html?id=${reviewId}`;

  const text = `🎬 *New Creative Deliverable Ready for Review!*\n\n` +
    `Project: *${title}*\n` +
    `Version: *${version}*\n\n` +
    `Your production team has uploaded a new cut for your feedback and approval.\n\n` +
    `Tap the button below to stream and leave timecoded notes:`;

  const inlineKeyboard = [
    [{ text: '▶ Review & Approve Cut', url: reviewUrl }],
    [{ text: '📱 Open Client Portal', web_app: { url: 'https://gro10x-ai.vercel.app/client' } }]
  ];

  return sendTelegramNotification(chatId, text, inlineKeyboard, false);
}

function sendClientInvoiceNotification(chatId, invoice = {}) {
  const invId = invoice.id || 'INV-001';
  const amount = Number(invoice.amount || 0).toLocaleString();
  const due = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'Due on receipt';
  const scope = invoice.projectName || invoice.description || 'Monthly Retainer';

  const text = `💳 *New Invoice Issued*\n\n` +
    `Invoice: *${invId}*\n` +
    `Scope: *${scope}*\n` +
    `Total Payable: *BDT ${amount}*\n` +
    `Due Date: *${due}*\n\n` +
    `You can view invoice details, download PDF, or submit payment proof directly in the Client Portal.`;

  const inlineKeyboard = [
    [{ text: '💳 Pay / View Invoice', web_app: { url: 'https://gro10x-ai.vercel.app/client' } }]
  ];

  return sendTelegramNotification(chatId, text, inlineKeyboard, false);
}

module.exports = {
  sendTelegramNotification,
  sendToGroup,
  sendAgreementNotification,
  sendClientDeliverableNotification,
  sendClientInvoiceNotification
};
