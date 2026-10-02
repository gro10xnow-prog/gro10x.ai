/**
 * src/services/stakeholder-events.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Stakeholder Event Bus & Cross-Connection Reactive Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Fans out domain events across:
 * 1. Targeted Telegram Bots (Client, Team, Manager, Owner)
 * 2. Outbound Webhook Subscriptions (HMAC signed external HTTP delivery)
 * 3. Realtime SSE multi-instance broadcast
 * 4. Workflow Automation engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { EventEmitter } = require('events');
const sse = require('./sse');
const broadcast = (...args) => sse.broadcast(...args);
const { dispatchWebhookEvent } = require('./webhook-dispatcher');

class StakeholderEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupInternalListeners();
  }

  setupInternalListeners() {
    // Catch-all logger and SSE broadcast
    this.on('*', (eventName, eventData) => {
      try {
        broadcast('stakeholder_event', { event: eventName, ...eventData });
      } catch (_) {}
    });
  }

  /**
   * Primary entry point for firing stakeholder domain events
   * @param {string} eventName - Canonical event name
   * @param {object} payload - Domain payload
   * @param {object} options - Stakeholder routing options (targetChatId, recipientRole, etc.)
   */
  async emitEvent(eventName, payload = {}, options = {}) {
    this.emit(eventName, payload, options);
    this.emit('*', eventName, payload, options);

    // 1. Asynchronous Outbound Webhook Dispatch
    const webhookPromise = dispatchWebhookEvent(eventName, payload, {
      stakeholderId: options.stakeholderId || payload.clientId || payload.affiliateId || payload.contractorId,
      stakeholderType: options.stakeholderType
    }).catch(err => console.warn(`[EventBus Webhook Warning] ${eventName}:`, err.message));

    // 2. Targeted Telegram Alerts
    const telegramPromise = this.routeTelegramNotification(eventName, payload, options)
      .catch(err => console.warn(`[EventBus Telegram Warning] ${eventName}:`, err.message));

    // 3. Automation Engine Trigger
    try {
      const { processAutomationEvent } = require('./automation');
      const { readDB } = require('./db');
      const db = await readDB();
      processAutomationEvent(eventName, payload, db, () => {}, broadcast);
      if (eventName.includes('.')) {
        processAutomationEvent(eventName.replace(/\./g, '_'), payload, db, () => {}, broadcast);
      }
    } catch (_) {}

    await Promise.allSettled([webhookPromise, telegramPromise]);
    return { event: eventName, success: true };
  }

  /**
   * Dispatches tailored Telegram alerts per stakeholder role
   */
  async routeTelegramNotification(eventName, payload, options = {}) {
    let notifications = null;
    try {
      notifications = require('./bot/notifications');
    } catch (_) {
      return;
    }

    const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '7754769807';

    switch (eventName) {
      // ─── CRM & Lead Lifecycle ─────────────────────────────────────────────
      case 'lead.created': {
        const lead = payload.lead || payload;
        const msg = `🔔 *NEW CRM LEAD CAPTURED*\n\n` +
          `• Contact: *${lead.contact_person || lead.name || 'Prospective Client'}*\n` +
          `• Company: *${lead.company || 'Brand Partner'}*\n` +
          `• Service: *${lead.service || lead.service_interest || 'General'}*\n` +
          `• Value: *${lead.value || lead.budget || 'Unspecified'}*\n` +
          `• Source: *${lead.source || 'Website Form'}*`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, false);
        break;
      }

      case 'lead.converted':
      case 'lead.won': {
        const lead = payload.lead || payload;
        const client = payload.client || {};
        const msg = `🏆 *DEAL WON — LEAD CONVERTED TO CLIENT!*\n\n` +
          `• Client: *${client.name || lead.company || lead.name || 'New Client'}* (\`${client.id || lead.client_id || lead.id}\`)\n` +
          `• Contact: *${lead.contact_person || lead.name || 'Client Lead'}*\n` +
          `• Value: *${lead.value || lead.budget || 'Closed'}*\n\n` +
          `Active Client CRM account created and ready for onboarding.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'lead.lost': {
        const lead = payload.lead || payload;
        const msg = `🗑️ *Lead Marked as Lost*\n\n` +
          `• Contact: *${lead.contact_person || lead.company || lead.name || 'Lead'}*\n` +
          `• Lead ID: \`${lead.id}\`\n` +
          `• Stage: Lost / Closed`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, false);
        break;
      }

      // ─── Proposal Pipeline Lifecycle ──────────────────────────────────────
      case 'proposal.created': {
        const prop = payload.proposal || payload;
        const msg = `📄 *NEW CLIENT PROPOSAL GENERATED*\n\n` +
          `• Proposal ID: *${prop.id}*\n` +
          `• Client: *${prop.client_name || prop.clientName}* (${prop.client_company || prop.clientCompany || 'N/A'})\n` +
          `• Project: *${prop.project_title || prop.projectTitle || 'AI Solution'}*\n` +
          `• Total: *${prop.currency === 'USD' ? '$' : '৳'}${Number(prop.one_time_total || prop.oneTimeTotal || 0).toLocaleString()}*`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, false);
        break;
      }

      case 'proposal.accepted': {
        const prop = payload.proposal || payload;
        const client = payload.client || {};
        const msg = `🎉 *PROPOSAL FORMALLY ACCEPTED BY CLIENT!*\n\n` +
          `• Proposal: *${prop.id}*\n` +
          `• Client: *${client.name || prop.client_name || prop.clientName}*\n` +
          `• Total: *${prop.currency === 'USD' ? '$' : '৳'}${Number(prop.one_time_total || prop.oneTimeTotal || 0).toLocaleString()}*\n\n` +
          `⚡ Upfront invoice generated. Ready for project handover & sprint kickoff!`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'proposal.converted': {
        const prop = payload.proposal || payload;
        const proj = payload.project || {};
        const msg = `🚀 *PROPOSAL CONVERTED TO PRODUCTION PROJECT*\n\n` +
          `• Project: *${proj.name || 'Client Project'}* (\`${proj.id}\`)\n` +
          `• Client: *${proj.client_name || 'Client Partner'}*\n` +
          `• Budget: *${proj.currency === 'USD' ? '$' : '৳'}${Number(proj.budget || 0).toLocaleString()}*\n` +
          `• Converted from Proposal: *${prop.id || 'SOW Proposal'}*`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      // ─── Client Onboarding & Sprint Operations ────────────────────────────
      case 'lockin.prerequisite_submitted': {
        const item = payload.item || {};
        const note = payload.submissionNote || item.submission_note || 'Credentials/details provided';
        const progress = payload.progress || {};
        const msg = `🔐 *CLIENT PREREQUISITE SUBMITTED*\n\n` +
          `• Client: *${payload.clientName || payload.clientId}* (\`${payload.clientId}\`)\n` +
          `• Spec: \`${payload.specId}\`\n` +
          `• Item: *${item.name || payload.itemId}* (\`${payload.itemId}\`)\n` +
          `• Category: *${item.category || 'CREDENTIALS'}*\n` +
          `• Progress: *${progress.completed || 0}/${progress.total || 5} (${progress.percent || 0}%)*\n` +
          `• Note: _"${note}"_\n\n` +
          `⚡ Action required: Verify credentials in Client Handover Cockpit.`;
        const keyboard = [[{ text: '🔒 Inspect Handover Shield', url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/client#lockin` }]];
        notifications.sendTelegramNotification(ownerChatId, msg, keyboard, false);
        break;
      }

      case 'pod.assigned': {
        const msg = `⚡ *DELIVERY POD ASSIGNED — Engine 2*\n\n` +
          `• Project: *${payload.projectId}*\n` +
          `• Pod: *${payload.podName}* (${payload.targetVelocityDays}-day sprint target)\n` +
          `• Lead Engineer: *${payload.leadEngineer}*\n` +
          `• Members: ${(payload.assignedMembers || []).join(', ') || 'Pod Crew'}\n\n` +
          `Assigned sprint delivery is officially active.`;
        const keyboard = [[{ text: '📊 View Pod in Admin', url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/app#engines` }]];
        notifications.sendTelegramNotification(ownerChatId, msg, keyboard, true);
        break;
      }

      case 'cogs.margin_warning': {
        const msg = `⚠️ *GROSS MARGIN BENCHMARK WARNING — Engine 2*\n\n` +
          `• Project: *${payload.projectName || payload.projectId}* (\`${payload.projectId}\`)\n` +
          `• Gross Margin: *${payload.grossMarginPercent}%* (Benchmark: >70%)\n` +
          `• Total COGS: *৳${Number(payload.totalCOGS || 0).toLocaleString()}* ($${payload.totalCogsUSD || 0})\n` +
          `• Revenue: *৳${Number(payload.projectRevenue || 0).toLocaleString()}*\n` +
          `• Status: *${payload.status || 'LOW_MARGIN'}*\n\n` +
          `⚡ Action required: Review token consumption and compute allocation.`;
        const keyboard = [[{ text: '💰 Review Project P&L', url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/app#finance` }]];
        notifications.sendTelegramNotification(ownerChatId, msg, keyboard, true);
        break;
      }

      case 'client.onboarded': {
        const client = payload.client || payload;
        const msg = `👥 *NEW CLIENT ONBOARDED*\n\n` +
          `• Client: *${client.name}* (\`${client.id}\`)\n` +
          `• Contact: *${client.contact_person || client.contactPerson || 'N/A'}*\n` +
          `• Status: *${client.status || 'Active Retainer'}*`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, false);
        break;
      }

      case 'sprint.kickoff': {
        const msg = `⚡ *PRODUCTION SPRINT KICKOFF INITIATED*\n\n` +
          `• Project: \`${payload.projectId}\`\n` +
          `• Client: \`${payload.clientId}\`\n` +
          `• Service: *${payload.productCode || 'Sprint'}*\n` +
          `• Scheduled Handover: *${payload.targetHandover}*`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'review.approved': {
        const msg = `✅ *DELIVERABLE FORMALLY APPROVED BY CLIENT*\n\n` +
          `• Project: \`${payload.projectId}\`\n` +
          `• Approved By: *${payload.approvedBy || 'Client Signer'}*\n` +
          `• 30-Day Bug Warranty activated.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }
      // ─── Scope Change Orders ───────────────────────────────────────────────
      case 'change_order.created': {
        const co = payload.changeOrder || payload;
        const proj = payload.project || {};
        const msg = `📝 *NEW SCOPE CHANGE ORDER REQUESTED*\n\n` +
          `Project: *${proj.name || co.projectId}*\n` +
          `Addendum: *${co.title}*\n` +
          `Requested Scope: ${co.description}\n` +
          `Proposed Days: *+${co.proposedDays || co.timelineDays || 0}d* | Fee: *৳${Number(co.proposedFee || co.feeBDT || 0).toLocaleString()}*\n\n` +
          `⚡ Action required: Review and adjust or approve in Manager Desk.`;
        const keyboard = [[{ text: '📝 Review in Manager Desk', url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/manager#tickets` }]];
        notifications.sendTelegramNotification(ownerChatId, msg, keyboard, true);
        break;
      }

      case 'change_order.adjusted': {
        const co = payload.changeOrder || payload;
        const targetChat = options.targetChatId || payload.clientTelegramId;
        if (targetChat) {
          const msg = `🔔 *Scope Change Order Counter-Proposal*\n\n` +
            `Your project manager has adjusted the terms for addendum *${co.title}*:\n` +
            `• Adjusted Fee: *৳${Number(co.proposedFee || co.feeBDT || 0).toLocaleString()}*\n` +
            `• Timeline Delta: *+${co.proposedDays || co.timelineDays || 0} Days*\n` +
            `• Manager Notes: _${co.managerNotes || 'Approved with adjustments'}_\n\n` +
            `Please check your Client Portal to review final terms.`;
          notifications.sendTelegramNotification(targetChat, msg, null, false);
        }
        break;
      }

      case 'change_order.approved': {
        const co = payload.changeOrder || payload;
        const inv = payload.invoice || {};
        const targetChat = options.targetChatId || payload.clientTelegramId;
        if (targetChat) {
          const msg = `✅ *Scope Change Order Formally Approved!*\n\n` +
            `Addendum: *${co.title}*\n` +
            `Invoice Issued: *${inv.id || co.invoiceId || 'Settlement Invoice'}* (5% VAT Included)\n` +
            `Approved Timeline: *+${co.proposedDays || co.timelineDays || 0} Days*\n\n` +
            `Payment rail: BRAC Bank Limited (Neoncore Tech Solution). Work is actively underway!`;
          notifications.sendTelegramNotification(targetChat, msg, null, false);
        }
        break;
      }

      // ─── Defect Tickets & Escrow SLA Holdback ──────────────────────────────
      case 'ticket.sla_breach_holdback': {
        const ticket = payload.ticket || payload;
        const contractorChat = options.targetChatId || ticket.contractorTelegramId;
        const msg = `🚨 *DEFECT SLA ESCROW HOLDBACK APPLIED*\n\n` +
          `Ticket: *${ticket.title}* (${ticket.id})\n` +
          `Severity: *${ticket.severity || 'P0/P1'}*\n` +
          `Status: *15% Contractor Escrow Frozen (HELD_IN_ESCROW)*\n` +
          `Reason: Defect breached guaranteed SLA turnaround window.\n\n` +
          `⚠️ Resolve defect cut immediately and submit for verification to release holdback.`;
        if (contractorChat) {
          notifications.sendTelegramNotification(contractorChat, msg, null, true);
        }
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'ticket.sla_holdback_released': {
        const contractorChat = options.targetChatId || payload.contractorTelegramId;
        const msg = `🛡️ *CONTRACTOR ESCROW RELEASED*\n\n` +
          `Project: *${payload.projectName || payload.projectId}*\n` +
          `Status: 30-Day Bug Warranty closed with zero outstanding defects.\n` +
          `Escrow Status: *RELEASED_FROM_ESCROW (Eligible for Payout)*.`;
        if (contractorChat) {
          notifications.sendTelegramNotification(contractorChat, msg, null, true);
        }
        break;
      }

      // ─── Deliverable Disputes & Warranty Control ───────────────────────────
      case 'warranty.dispute_raised': {
        const dispute = payload.dispute || payload;
        const msg = `⚠️ *DELIVERABLE DISPUTE RAISED — WARRANTY FROZEN*\n\n` +
          `Project: *${dispute.projectName || dispute.projectId}*\n` +
          `Dispute ID: *${dispute.id}*\n` +
          `Raised By: *${dispute.raisedBy}*\n` +
          `Reason: ${dispute.reason}\n\n` +
          `⏱️ The 30-day warranty countdown has been PAUSED pending resolution.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'warranty.dispute_resolved': {
        const dispute = payload.dispute || payload;
        const targetChat = options.targetChatId || payload.clientTelegramId;
        if (targetChat) {
          const msg = `✅ *Deliverable Dispute Resolved*\n\n` +
            `Project: *${dispute.projectName || dispute.projectId}*\n` +
            `Resolution: ${dispute.resolutionNotes || 'Defect remediation verified'}\n` +
            `🛡️ Your 30-Day Bug-Fix Warranty has been resumed with an automatic 7-Day protection extension!`;
          notifications.sendTelegramNotification(targetChat, msg, null, false);
        }
        break;
      }

      // ─── COGS Claims & Margin Guardrail ───────────────────────────────────
      case 'cogs.margin_warning': {
        const cogs = payload.claim || payload;
        const margin = payload.grossMarginPercent || payload.margin;
        const msg = `🚨 *MARGIN COMPRESSION ALERT — Below 70% Target*\n\n` +
          `Project: *${payload.projectName || cogs.projectId}*\n` +
          `Claimed Expense: *৳${Number(cogs.amountBDT || cogs.amount || 0).toLocaleString()}* (${cogs.category || 'Compute'})\n` +
          `Vendor: *${cogs.vendor || 'Cloud GPU'}*\n` +
          `Realized Gross Margin: *${margin}%* (Target: ≥70%)\n\n` +
          `Action: Review GPU utilization and pod efficiency immediately.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      // ─── IP Handover Manifest ─────────────────────────────────────────────
      case 'manifest.signed': {
        const manifest = payload.manifest || payload;
        const msg = `📜 *IP HANDOVER MANIFEST DIGITALLY SIGNED*\n\n` +
          `Project: *${manifest.projectName || manifest.projectId}*\n` +
          `Signed By: *${manifest.clientSignerName || 'Client Authorized Signer'}*\n` +
          `Repository: ${manifest.repositoryUrl || 'Transferred'}\n\n` +
          `Digital IP Handover certificate is legally sealed and permanently archived.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      // ─── Affiliate & Partner Lifecycle ────────────────────────────────────
      case 'affiliate.conversion_accrued': {
        const conv = payload.conversion || payload;
        const affChat = options.targetChatId || payload.affiliateTelegramId;
        if (affChat) {
          const msg = `🎉 *New Referral Commission Accrued!*\n\n` +
            `Project: *${conv.projectName || 'Client Sprint'}*\n` +
            `Commission Earned: *৳${Number(conv.commissionEarnedBDT || 0).toLocaleString()} BDT*\n` +
            `Status: *Accrued (Ready for next monthly payout cycle)*.`;
          notifications.sendTelegramNotification(affChat, msg, null, false);
        }
        break;
      }

      case 'affiliate.payout_requested': {
        const payout = payload.payout || payload;
        const msg = `💳 *AFFILIATE PAYOUT REQUEST SUBMITTED*\n\n` +
          `Affiliate: *${payout.affiliateName || payout.affiliateId}*\n` +
          `Amount: *৳${Number(payout.amountBDT || 0).toLocaleString()} BDT*\n` +
          `Bank Rail: *${payout.payoutMethod || 'Corporate Wire'}*\n` +
          `Account: \`${payout.payoutDetails?.accountNumber || 'Pending Details'}\`\n\n` +
          `Verify deal conversions and disburse via BRAC Bank corporate account.`;
        notifications.sendTelegramNotification(ownerChatId, msg, null, true);
        break;
      }

      case 'affiliate.payout_disbursed': {
        const payout = payload.payout || payload;
        const affChat = options.targetChatId || payload.affiliateTelegramId;
        if (affChat) {
          const msg = `✅ *Affiliate Commission Payout Disbursed!*\n\n` +
            `Amount: *৳${Number(payout.amountBDT || 0).toLocaleString()} BDT*\n` +
            `Reference: \`${payout.referenceNumber || payout.id}\`\n` +
            `Settlement: Bank transfer completed. Thank you for partnering with GRO10X!`;
          notifications.sendTelegramNotification(affChat, msg, null, false);
        }
        break;
      }

      default:
        break;
    }
  }
}

// Singleton instance
const stakeholderEvents = new StakeholderEventBus();

module.exports = {
  stakeholderEvents,
  emitStakeholderEvent: (event, payload, options) => stakeholderEvents.emitEvent(event, payload, options)
};
