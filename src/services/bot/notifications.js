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

  const defaultAdminId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || '7754769807';
  const targetChatId = (chatId === '1708459008' || chatId === '+8801708459008' || chatId === '7754769807') ? defaultAdminId : (chatId || defaultAdminId);

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
        `🚀 *You are now an official GRO10X team member!*\n\n` +
        `📌 *Your Next Steps:*\n` +
        `1. 📍 Do your first GPS Clock-In to go Online\n` +
        `2. 📋 Check *My Tasks* for your first assignment\n` +
        `3. 💳 Verify your *Bank & bKash* payout accounts\n` +
        `4. 👤 Review your *My Profile* — check your salary details\n\n` +
        `Tap *Open App* to access your full dashboard. Welcome to the team! ⚡`,
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

function sendProposalViewedNotification(proposal = {}) {
  const title = proposal.project_title || proposal.projectTitle || 'Client Proposal';
  const client = proposal.client_name || proposal.clientName || 'Prospective Client';
  const propId = proposal.id || 'PROP-001';
  const token = proposal.share_token || proposal.shareToken || '';
  const views = proposal.view_count || 1;
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
  const proposalUrl = `${baseUrl}/proposal.html?t=${token}`;

  const text = `👀 *Proposal Viewed by Client!*\n\n` +
    `Client: *${client}*\n` +
    `Proposal: *${title}* (${propId})\n` +
    `Total Views: *${views}*\n` +
    `Timestamp: *${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })} BST*\n\n` +
    `The client is currently reviewing your proposal document.`;

  const inlineKeyboard = [
    [{ text: '🔗 View Live Proposal', url: proposalUrl }],
    [{ text: '📊 Open Admin Command Center', url: `${baseUrl}/app#proposals` }]
  ];

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || '7754769807';
  return sendTelegramNotification(adminChatId, text, inlineKeyboard, true);
}

function sendProposalAcceptedNotification(proposal = {}) {
  const title = proposal.project_title || proposal.projectTitle || 'Client Proposal';
  const client = proposal.client_name || proposal.clientName || 'Prospective Client';
  const propId = proposal.id || 'PROP-001';
  const currency = proposal.currency || 'BDT';
  const oneTime = Number(proposal.one_time_total || proposal.oneTimeTotal || 0).toLocaleString();
  const recurring = Number(proposal.recurring_total || proposal.recurringTotal || 0).toLocaleString();
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  const invoiceRef = proposal.invoiceId || proposal.invoice_id ? `\n💳 Settlement Invoice: *${proposal.invoiceId || proposal.invoice_id}* (5% VAT Included)` : '';

  const text = `🎉 *PROPOSAL ACCEPTED!* 🚀\n\n` +
    `Client: *${client}*\n` +
    `Project: *${title}* (${propId})\n` +
    `Build Total: *${currency} ${oneTime}*\n` +
    `Monthly Retainer: *${currency} ${recurring}/mo*` +
    `${invoiceRef}\n` +
    `Accepted At: *${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })} BST*\n\n` +
    `⚡ Client confirmed acceptance! Open Admin to convert this into an active production project.`;

  const inlineKeyboard = [
    [{ text: '🚀 Convert to Project in Admin', url: `${baseUrl}/app#proposals` }]
  ];

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || '7754769807';
  return sendTelegramNotification(adminChatId, text, inlineKeyboard, true);
}

function sendProposalCallRequestNotification(proposal = {}, contact = {}) {
  const title = proposal.project_title || proposal.projectTitle || 'Client Proposal';
  const client = proposal.client_name || proposal.clientName || 'Prospective Client';
  const name = contact.name || client;
  const phone = contact.phone || 'Not provided';
  const note = contact.note || 'Requested alignment call';
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  const text = `📞 *Proposal Alignment Call Requested!*\n\n` +
    `Project: *${title}*\n` +
    `Contact Name: *${name}*\n` +
    `Phone: *${phone}*\n` +
    `Note: "${note}"\n\n` +
    `Please reach out to schedule or confirm the onboarding kickoff call.`;

  const inlineKeyboard = [
    [{ text: '📊 Open Admin Proposals', url: `${baseUrl}/app#proposals` }]
  ];

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID || '7754769807';
  return sendTelegramNotification(adminChatId, text, inlineKeyboard, true);
}

function sendWarrantyActivatedNotification(project = {}, reviewData = {}) {
  const title = project.name || reviewData.project_name || reviewData.projectName || 'AI Sprint Solution';
  const client = project.client_name || project.clientName || reviewData.client || 'Client Partner';
  const approver = reviewData.approved_by || reviewData.approvedBy || 'Client Lead';
  const rawExpiry = reviewData.warrantyUntil || project.warranty_until || project.warrantyUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiryDate = new Date(rawExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
  const projectId = project.id || reviewData.project_id || reviewData.projectId || 'proj-purplebot-01';

  const text = `🎉 *Deliverable Approved & 30-Day Warranty Active!*\n\n` +
    `Project: *${title}*\n` +
    `Client: *${client}*\n` +
    `Approved By: *${approver}*\n\n` +
    `🛡️ *Your 30-Day Bug-Fix Warranty is now officially active!*\n` +
    `• Expiry Date: *${expiryDate}* (30 Days)\n` +
    `• Response SLA: *4h Critical P0* / *24h Standard P1*\n` +
    `• Warranty Cost: *৳0 (Zero-Cost Bug Resolution Guarantee)*\n\n` +
    `Need adjustments or notice any defects during this period? You can file a zero-cost warranty ticket directly from your Client Portal.`;

  const inlineKeyboard = [
    [{ text: '🛡️ Open Warranty Hub', web_app: { url: `${baseUrl}/client#tickets` } }],
    [{ text: '📄 View IP Handover Shield', url: `${baseUrl}/handover-view.html?id=${projectId}` }]
  ];

  const targetChatId = project.client_telegram_id || project.clientTelegramId || reviewData.chatId || reviewData.client_telegram_id;
  if (targetChatId) {
    return module.exports.sendTelegramNotification(targetChatId, text, inlineKeyboard, false);
  }
  return false;
}

function sendTeamWarrantyAlert(project = {}, reviewData = {}) {
  const title = project.name || reviewData.project_name || reviewData.projectName || 'AI Sprint Solution';
  const client = project.client_name || project.clientName || reviewData.client || 'Client Partner';
  const approver = reviewData.approved_by || reviewData.approvedBy || 'Client Lead';
  const rawExpiry = reviewData.warrantyUntil || project.warranty_until || project.warrantyUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiryDate = new Date(rawExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
  const pod = project.delivery_pod || project.deliveryPod || {};
  const podName = pod.podName || pod.name || 'MVP Rapid Delivery Pod';

  const text = `🛡️ *WARRANTY ACTIVATED — Engine 2*\n\n` +
    `Project: *${title}* (${client})\n` +
    `Approved By: *${approver}*\n` +
    `Assigned Pod: *${podName}*\n` +
    `Warranty Closes: *${expiryDate}* (30 Days)\n` +
    `SLA Commitment: *4h P0 Critical / 24h P1 Standard*\n\n` +
    `⚡ Project successfully cascaded to Completed state with zero-cost bug warranty governance.`;

  const inlineKeyboard = [
    [{ text: '📊 Open Engine 2 Studio', url: `${baseUrl}/app#engines` }]
  ];

  const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807';
  return module.exports.sendTelegramNotification(ownerChatId, text, inlineKeyboard, true);
}

function sendSprintDeliveredNotification(project = {}, manifest = {}) {
  const title = project.name || manifest.projectName || 'AI Sprint Solution';
  const client = project.client_name || manifest.clientName || 'Client Partner';
  const pod = project.delivery_pod || manifest.deliveryPod || {};
  const podName = pod.podName || pod.name || 'MVP Rapid Delivery Pod';
  const lead = pod.leadEngineer || 'Lead Developer';
  const velocity = pod.targetVelocityDays || 14;
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
  const projectId = project.id || manifest.projectId || 'proj-purplebot-01';

  const text = `🚀 *Sprint Completed & Deliverables Released!*\n\n` +
    `Project: *${title}*\n` +
    `Client: *${client}*\n` +
    `Delivery Pod: *${podName}* (${velocity}-Day Sprint Target)\n` +
    `Lead Engineer: *${lead}*\n\n` +
    `All production deliverables have passed internal QA and are now ready for your review.\n` +
    `Review your deliverables to sign off and unlock your 30-day bug-fix warranty and IP handover.`;

  const inlineKeyboard = [
    [{ text: '🎬 Review Deliverables', web_app: { url: `${baseUrl}/client#reviews` } }],
    [{ text: '🛡️ View Handover Shield', url: `${baseUrl}/handover-view.html?id=${projectId}` }]
  ];

  const targetChatId = project.client_telegram_id || project.clientTelegramId;
  if (targetChatId) {
    return module.exports.sendTelegramNotification(targetChatId, text, inlineKeyboard, false);
  }
  return false;
}

function sendRetainerBurndownAlert(bank = {}, project = {}, logEntry = {}) {
  const title = project.name || bank.projectName || 'AI Retainer';
  const client = project.client_name || bank.clientName || 'Client Partner';
  const isOverage = bank.status === 'critical_overage' || (bank.overageHours || 0) > 0;
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  const text = isOverage
    ? `🚨 *RETAINER CRITICAL OVERAGE — Engine 2*\n\n` +
      `Project: *${title}* (${client})\n` +
      `Logged: *+${logEntry.hours} hrs* by ${logEntry.loggedBy || 'Pod Engineer'}\n` +
      `Task: "${logEntry.taskDescription || 'Sprint Task'}"\n\n` +
      `📊 *Capacity Exhausted:*\n` +
      `• Consumed: *${bank.usedHours} / ${bank.totalAvailableHours} hrs* (${bank.burnRatePercent}%)\n` +
      `• Overage: *${bank.overageHours} hrs*\n` +
      `• Billing Rate: *$${bank.hourlyRateUsd || 45}/hr*\n\n` +
      `⚠️ *Action Required:* Billable capacity exceeded. Review overage with client.`
    : `⚠️ *RETAINER CAPACITY WARNING — Engine 2*\n\n` +
      `Project: *${title}* (${client})\n` +
      `Logged: *+${logEntry.hours} hrs* by ${logEntry.loggedBy || 'Pod Engineer'}\n` +
      `Task: "${logEntry.taskDescription || 'Sprint Task'}"\n\n` +
      `📊 *Burndown Status:*\n` +
      `• Consumed: *${bank.usedHours} / ${bank.totalAvailableHours} hrs* (${bank.burnRatePercent}%)\n` +
      `• Remaining: *${bank.remainingHours} hrs*\n` +
      `• Status: *Nearing Capacity (>=75%)*`;

  const inlineKeyboard = [
    [{ text: '⏳ Retainer Bank in Admin', url: `${baseUrl}/app#engines` }]
  ];

  const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807';
  return module.exports.sendTelegramNotification(ownerChatId, text, inlineKeyboard, true);
}

function sendWarrantyExpiryAlert(project = {}, daysRemaining = 7, isClient = true) {
  const title = project.name || 'AI Sprint Solution';
  const client = project.client_name || project.clientName || 'Client Partner';
  const rawExpiry = project.warranty_until || project.warrantyUntil || new Date();
  const expiryDate = new Date(rawExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  if (isClient) {
    const isLastDay = daysRemaining <= 1;
    const text = isLastDay
      ? `🚨 *Warranty Final Notice: Expires Tomorrow!*\n\n` +
        `Project: *${title}*\n` +
        `Warranty Closes: *${expiryDate}*\n\n` +
        `Your 30-day bug-fix warranty expires tomorrow. Please perform any final checks on your live solution and submit any defects before coverage closes.`
      : `⏰ *Warranty Reminder: 7 Days Remaining*\n\n` +
        `Project: *${title}*\n` +
        `Warranty Closes: *${expiryDate}*\n\n` +
        `Your 30-day bug-fix warranty is entering its final week. Need any final bug adjustments before standard maintenance transition? File a ticket in your portal.`;

    const inlineKeyboard = [
      [{ text: '🛡️ Open Warranty Desk', web_app: { url: `${baseUrl}/client#tickets` } }]
    ];

    const targetChatId = project.client_telegram_id || project.clientTelegramId;
    if (targetChatId) {
      return module.exports.sendTelegramNotification(targetChatId, text, inlineKeyboard, false);
    }
    return false;
  } else {
    const text = `🔔 *WARRANTY EXPIRY HORIZON (${daysRemaining} Days)*\n\n` +
      `Project: *${title}* (${client})\n` +
      `Warranty End Date: *${expiryDate}*\n` +
      `Status: Scheduled for handover archiving in ${daysRemaining} days.`;

    const inlineKeyboard = [
      [{ text: '📊 Open Engine 2 Studio', url: `${baseUrl}/app#engines` }]
    ];

    const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807';
    return module.exports.sendTelegramNotification(ownerChatId, text, inlineKeyboard, true);
  }
}

module.exports = {
  sendTelegramNotification,
  sendToGroup,
  sendAgreementNotification,
  sendClientDeliverableNotification,
  sendClientInvoiceNotification,
  sendProposalViewedNotification,
  sendProposalAcceptedNotification,
  sendProposalCallRequestNotification,
  sendWarrantyActivatedNotification,
  sendTeamWarrantyAlert,
  sendSprintDeliveredNotification,
  sendRetainerBurndownAlert,
  sendWarrantyExpiryAlert
};


