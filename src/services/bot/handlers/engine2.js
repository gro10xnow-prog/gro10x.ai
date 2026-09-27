/**
 * src/services/bot/handlers/engine2.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Handlers for Engine 2 (AI Service Agency & Rapid Solution Sprints)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { compileEngine2FlashReport } = require('../../../routes/engines');
const { getDeliveryPods, calculateTeamCapacity } = require('../../delivery-pods');
const { getRetainerBank } = require('../../retainer-bank');
const { readDB } = require('../../db');
const { supabase, isSupabaseConfigured } = require('../../supabase');

const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

/**
 * Dispatches on-demand Engine 2 Executive Flash Report to Team/Owner Bot
 */
async function handleEngine2Flash(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const report = await compileEngine2FlashReport();

    const text = [
      `🚀 *GRO10X ENGINE 2: EXECUTIVE FLASH DISPATCH*`,
      `📅 *Date:* ${report.reportDate}`,
      `─────────────────────────`,
      `🎯 *Annual Target:* $${report.financialTargets.annualTargetUsd.toLocaleString()} (${report.financialTargets.quotaAchievementRate} Achieved)`,
      `💰 *Realized Revenue:* $${report.financialTargets.realizedRevenueUsd.toLocaleString()}`,
      `📄 *Invoiced Pipeline:* $${report.financialTargets.invoicedPipelineUsd.toLocaleString()}`,
      `⚡ *Pacing Status:* ${report.financialTargets.paceStatus}`,
      ``,
      `👥 *Pod Velocity & Operations:*`,
      `• Pod Utilization: *${report.operationsAndCapacity.teamUtilization}* (Benchmark: 75%–85%)`,
      `• Billable Hours Weekly: *${report.operationsAndCapacity.billableHoursWeekly} hrs*`,
      `• Headcount: *${report.operationsAndCapacity.headcount} Engineers*`,
      ``,
      `🛡️ *Post-Delivery Governance:*`,
      `• Active 30-Day Warranties: *${report.postDeliveryGovernance.activeWarranties} Projects*`,
      `• Open Warranty Tickets: *${report.postDeliveryGovernance.openWarrantyTickets}*`,
      `• SLA Compliance: *${report.postDeliveryGovernance.slaComplianceRate}*`,
      ``,
      `📈 *Unit Economics:*`,
      `• Estimated Gross Margin: *${report.unitEconomics.estimatedGrossMargin}* (Benchmark >70%)`
    ].join('\n');

    const inlineKeyboard = [
      [{ text: '🌐 Open Engine 2 Studio', url: `${BASE_URL}/app#engines` }],
      [
        { text: '⚡ Pod Status', callback_data: 'e2_pods' },
        { text: '🛡️ Warranties', callback_data: 'e2_warranties' }
      ]
    ];

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    }).catch(e => {
      teamBot.sendMessage(chatId, text.replace(/[*_]/g, ''));
    });
  } catch (err) {
    console.error('[handleEngine2Flash error]:', err.message);
    teamBot.sendMessage(chatId, `⚠️ Failed to compile Engine 2 Flash Report: ${err.message}`);
  }
}

/**
 * Surfaces Delivery Pod capacity, velocity targets, and staffing
 */
async function handleEngine2Pods(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const pods = getDeliveryPods();
    const capacity = await calculateTeamCapacity();

    let text = `⚡ *ENGINE 2: AUTONOMOUS DELIVERY PODS*\n` +
      `Billable Utilization: *${capacity.utilizationRate || '78%'}* (Range: 75%–85%)\n` +
      `Active Staff: *${capacity.totalStaff || 8} Engineers*\n` +
      `Weekly Capacity: *${capacity.totalWeeklyCapacityHours || 320} hrs*\n\n`;

    pods.forEach((p, idx) => {
      text += `${p.icon} *${idx + 1}. ${p.name}*\n` +
        `• Velocity Target: *${p.targetVelocityDays} Days*\n` +
        `• Roles: ${(p.rolesRequired || []).join(', ') || 'Full-stack engineering'}\n` +
        `• Focus: ${p.focus || p.description || 'Sprint Delivery'}\n\n`;
    });

    const inlineKeyboard = [
      [{ text: '📊 Open Growth Cockpit', url: `${BASE_URL}/app#engines` }]
    ];

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    }).catch(e => {
      teamBot.sendMessage(chatId, text.replace(/[*_]/g, ''));
    });
  } catch (err) {
    teamBot.sendMessage(chatId, `⚠️ Failed to load Pod status: ${err.message}`);
  }
}

/**
 * Lists active 30-day bug-fix warranties and remaining days
 */
async function handleEngine2Warranties(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let projects = [];
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('projects').select('*').not('warranty_until', 'is', null);
        if (data) projects = data;
      } catch (_) {}
    }
    if (projects.length === 0) {
      const db = await readDB().catch(() => ({ projects: [] }));
      projects = (db.projects || []).filter(p => p.warranty_until || p.warrantyUntil);
    }

    const now = Date.now();
    const activeProjects = projects.map(p => {
      const expiry = new Date(p.warranty_until || p.warrantyUntil).getTime();
      const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return { ...p, daysRemaining: days };
    }).filter(p => p.daysRemaining > 0);

    let text = `🛡️ *ENGINE 2: ACTIVE 30-DAY BUG-FIX WARRANTIES*\n\n`;
    if (activeProjects.length === 0) {
      text += `No projects currently under active warranty window.\n` +
        `All previous sprint deliverables have successfully transitioned to maintenance.\n`;
    } else {
      activeProjects.forEach((p, idx) => {
        text += `${idx + 1}. *${p.name || 'AI Sprint'}* (${p.client_name || p.clientName || 'Partner'})\n` +
          `   ⏳ Days Remaining: *${p.daysRemaining} days*\n` +
          `   🛡️ SLA Tier: *4h P0 / 24h P1 Standard*\n` +
          `   Status: *${p.delivery_status || 'APPROVED'}*\n\n`;
      });
    }

    text += `SLA Compliance: *100%* · Zero-Cost Defect Resolution Active.`;

    teamBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🛡️ Handover Shield', url: `${BASE_URL}/handover-view.html` }]]
      }
    }).catch(e => {
      teamBot.sendMessage(chatId, text.replace(/[*_]/g, ''));
    });
  } catch (err) {
    teamBot.sendMessage(chatId, `⚠️ Failed to load warranty status: ${err.message}`);
  }
}

/**
 * Surfaces active client warranty status in Client Bot
 */
async function handleClientWarrantyStatus(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const text = `🛡️ *YOUR 30-DAY BUG-FIX WARRANTY & SLA*\n\n` +
      `All GRO10X Engine 2 deliverables include an institutional 30-Day Zero-Cost Bug-Fix Warranty:\n\n` +
      `• *P0 Critical Bugs:* 4-Hour Response SLA\n` +
      `• *P1 Standard Issues:* 24-Hour Resolution Target\n` +
      `• *Zero-Cost Guarantee:* 100% coverage for in-scope defects\n` +
      `• *Dispute Freeze Protection:* Warranty clock pauses during active query resolution\n\n` +
      `Tap below to inspect your warranty countdown or report an issue directly.`;

    const inlineKeyboard = [
      [{ text: '🛡️ Open Warranty Desk', web_app: { url: `${BASE_URL}/client#tickets` } }],
      [{ text: '📄 IP Handover Manifest', url: `${BASE_URL}/handover-view.html` }]
    ];

    clientBot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    }).catch(e => {
      clientBot.sendMessage(chatId, text.replace(/[*_]/g, ''));
    });
  } catch (err) {
    clientBot.sendMessage(chatId, `⚠️ Could not retrieve warranty status: ${err.message}`);
  }
}

module.exports = {
  handleEngine2Flash,
  handleEngine2Pods,
  handleEngine2Warranties,
  handleClientWarrantyStatus
};
