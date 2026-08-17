const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('./supabase');
const { normalizePhone } = require('../utils/phone');

const { broadcast } = require('./sse');
const { processAutomationEvent } = require('./automation');
const { createTempPin } = require('./auth-pins');
const state = require('./state');
const { readDB } = require('./db');

let teamBot = null;
let clientBot = null;

function getTeamBot() { return teamBot; }
function getClientBot() { return clientBot; }

module.exports = {
  initBot,
  getTeamBot,
  getClientBot,
  sendTelegramNotification,
  sendToGroup,
  getRoleKeyboard,
  getClientKeyboard,
  sendAgreementNotification
};

function getRoleKeyboard(accessLevel, isVerified = false, emp = null) {
  if (!isVerified || !emp) {
    return {
      keyboard: [
        [{ text: '📱 Verify My Phone Number', request_contact: true }]
      ],
      resize_keyboard: true
    };
  }

  const isTechAdmin = (emp.id === 'PBD-000' || emp.role === 'Technology Admin' || normalizePhone(emp.phone) === '1708459008');

  // Progressive Disclosure: Guided Journey Mode during onboarding
  if (!emp.onboardingComplete) {
    return {
      keyboard: [
        [{ text: '🎓 Complete My Profile Survey', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } }],
        [{ text: '🔑 View My Web Login PIN' }]
      ],
      resize_keyboard: true
    };
  }

  // All onboarding tasks complete -> Unlock Full Operational Menu!
  if (accessLevel === 'Owner / Admin') {
    if (isTechAdmin) {
      return {
        keyboard: [
          [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
          [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
          [{ text: '✍️ Pending Approvals' }, { text: '💸 Expense Queue' }],
          [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '🛠️ Tech Diagnostics' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }
    // Owner / MD — all employee features + executive command layer
    return {
      keyboard: [
        [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
        [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
        [{ text: '✍️ Pending Approvals' }, { text: '💸 Expense Queue' }],
        [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
        [{ text: '👤 My Profile' }, { text: '🎬 Client Status' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Director / Manager') {
    const role = (emp?.role || '').toLowerCase();
    const isClientGrowth = role.includes('client') || role.includes('growth');
    const isBizOps = role.includes('business operation') || role.includes('head of business');
    const isInternalOps = role.includes('internal operation') || role.includes('internal ops');

    if (isClientGrowth) {
      return {
        keyboard: [
          [{ text: '🎯 My Clients' }, { text: '📈 Lead Pipeline' }],
          [{ text: '🔔 Client Updates' }, { text: '💰 My Commission' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    if (isBizOps) {
      return {
        keyboard: [
          [{ text: '🏢 Ops Dashboard' }, { text: '👥 HR & Attendance' }],
          [{ text: '📡 Media Buying' }, { text: '🚀 Client Activation' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    if (isInternalOps) {
      return {
        keyboard: [
          [{ text: '⚡ Studio Workload' }, { text: '🚧 Bottleneck Radar' }],
          [{ text: '📸 Studio & Gear Slots' }, { text: '📊 Turnaround Metrics' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isArtDirector = role.includes('art director') || (role.includes('art') && role.includes('direct'));
    if (isArtDirector) {
      return {
        keyboard: [
          [{ text: '🎨 Design Queue' }, { text: '👁️ Review Room' }],
          [{ text: '👥 Design Team' }, { text: '✅ Leave Approvals' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isHeadOfProduction = role.includes('head of production') || role.includes('production head') || role.includes('production');
    if (isHeadOfProduction) {
      return {
        keyboard: [
          [{ text: '🎬 Production Queue' }, { text: '📜 Script & Copy QC' }],
          [{ text: '🎥 Shoot Call-Sheets' }, { text: '👥 Content Team' }],
          [{ text: '🌅 Morning Briefing' }, { text: '✅ Leave Approvals' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isStrategyLead = role.includes('strategy & planning') || role.includes('strategy');
    if (isStrategyLead) {
      return {
        keyboard: [
          [{ text: '📈 Campaign Strategy' }, { text: '🗓️ Content Calendars' }],
          [{ text: '👥 Strategy Team' }, { text: '✅ Leave Approvals' }],
          [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '👥 My Team' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    const isClientServices = role.includes('client services') || role.includes('account manager') || role.includes('client service');
    if (isClientServices && !role.includes('head of client')) {
      return {
        keyboard: [
          [{ text: '🎯 My Client Roster' }, { text: '🎬 Client Approvals' }],
          [{ text: '📢 Send Client Link' }, { text: '💬 Client Feedback' }],
          [{ text: '🌅 Morning Briefing' }, { text: '👥 Account Team' }],
          [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
          [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
          [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
          [{ text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }

    // Default Director
    return {
      keyboard: [
        [{ text: '👥 My Team' }, { text: '📊 Department Report' }],
        [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '💳 Bank & bKash' }],
        [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Finance Manager' || (emp?.role || '').toLowerCase().includes('finance manager')) {
    return {
      keyboard: [
        [{ text: '💸 Expense Queue' }, { text: '🧾 Invoice Status' }],
        [{ text: '📊 Payroll Summary' }, { text: '🏦 Bank & bKash Hub' }],
        [{ text: '🌅 Morning Briefing' }, { text: '✅ Leave Approvals' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '📝 EOD Report' }, { text: '👥 Admin Team' }],
        [{ text: '👤 My Profile' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Office Staff') {
    return {
      keyboard: [
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }],
        [{ text: '👤 My Profile' }, { text: '🌴 Leave Request' }]
      ],
      resize_keyboard: true
    };
  }

  const userRole = (emp?.role || '').toLowerCase();

  // PBD-028 Rythm: Digital Marketing Associate in Client Services dept → Client Services keyboard
  if (emp?.id === 'PBD-028') {
    return {
      keyboard: [
        [{ text: '🎯 My Client Roster' }, { text: '🎬 Client Approvals' }],
        [{ text: '📢 Send Client Link' }, { text: '💬 Client Feedback' }],
        [{ text: '📝 EOD Report' }, { text: '🧾 Submit Expense' }],
        [{ text: '🌴 Leave Request' }, { text: '👤 My Profile' }],
        [{ text: '💳 Bank & bKash' }, { text: '📍 Clock-In GPS', request_location: true }],
        [{ text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // PBD-030 Mukit: Junior Finance Executive → Finance Assistant keyboard
  if (emp?.id === 'PBD-030' || (userRole.includes('finance') && userRole.includes('executive'))) {
    return {
      keyboard: [
        [{ text: '🧾 Log Expense Entry' }, { text: '📋 Invoice Tracker' }],
        [{ text: '💰 Payment Follow-Up' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Strategy & Digital Marketing Associate Keyboard
  if (userRole.includes('strategy') || userRole.includes('digital marketing') || userRole.includes('associate')) {
    return {
      keyboard: [
        [{ text: '📅 My Content Plans' }, { text: '🚀 Dispatch Hub' }],
        [{ text: '📝 Draft New Plan' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Content Production Crew Keyboard (Copywriter, AI Prompt Engineer)
  if (userRole.includes('copywriter') || userRole.includes('prompt') || userRole.includes('content')) {
    return {
      keyboard: [
        [{ text: '📜 My Scripts & Copy' }, { text: '🤖 AI Prompt Studio' }],
        [{ text: '📤 Submit Script QC' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Visualizer / Creative Specialist Keyboard
  if (userRole.includes('visualizer')) {
    return {
      keyboard: [
        [{ text: '🖌️ My Creative Tasks' }, { text: '📤 Submit for QC' }],
        [{ text: '✏️ View Revisions' }, { text: '📝 EOD Report' }],
        [{ text: '🧾 Submit Expense' }, { text: '🌴 Leave Request' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  // Default: Specialist / Crew
  return {
    keyboard: [
      [{ text: '📋 My Tasks' }, { text: '💰 My Earnings' }],
      [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
      [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
    ],
    resize_keyboard: true
  };
}

// ══════════════════════════════════════════
// CLIENT BOT KEYBOARD
// ══════════════════════════════════════════
function getClientKeyboard(client) {
  return {
    keyboard: [
      [{ text: '🎬 Review Room' }, { text: '📋 Campaign Status' }],
      [{ text: '💳 My Invoices' }, { text: '🎨 Our Services' }],
      [{ text: '📞 Contact AM' }, { text: '📁 Portfolio' }],
      [{ text: '📱 Open App', web_app: { url: 'https://purpleos-iota.vercel.app/client-miniapp' } }]
    ],
    resize_keyboard: true
  };
}

// ══════════════════════════════════════════
// AGREEMENT STAGE NOTIFICATIONS
// ══════════════════════════════════════════
async function sendAgreementNotification(stage, emp, dbData) {
  if (!teamBot) return;

  if (stage === 1) {
    // Employee signed → notify Finance Manager
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
    // Notify employee
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
    // Finance countersigned → notify final approver
    // Special rule: PBD-001 (MD) → Stage 3 goes to PBD-002 (Chairman)
    let finalApprover = null;
    if (emp.id === 'PBD-001') {
      finalApprover = (dbData.team || []).find(e => e.id === 'PBD-002');
    }
    // For everyone else: Stage 3 goes to Owner / MD (PBD-001)
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
    // Notify employee
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
    // Owner approved → fully activate employee
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

function initBot() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const teamToken = process.env.TEAM_BOT_TOKEN || null?.teamBot?.token;
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || null?.clientBot?.token;
  const baseUrl = process.env.BASE_URL || 'https://purpleos-iota.vercel.app';

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      const usePolling = process.env.USE_POLLING === 'true';
      teamBot = new TelegramBot(teamToken, { polling: usePolling });

      if (usePolling) {
        teamBot.deleteWebHook().catch(e => console.error('Error deleting webhook:', e));
        console.log('✅ Local polling enabled for teamBot (Webhook deleted)');
      } else {
        const expectedUrl = `${baseUrl}/api/webhooks/telegram?bot=team`;
        const webhookBody = { url: expectedUrl };
        if (process.env.WEBHOOK_SECRET) webhookBody.secret_token = process.env.WEBHOOK_SECRET;

        // Smart check: fetch current webhook info before re-registering
        fetch(`https://api.telegram.org/bot${teamToken}/getWebhookInfo`)
          .then(res => res.json())
          .then(info => {
            if (info.result && info.result.url === expectedUrl) {
              console.log(`✅ Team Bot webhook already registered to ${expectedUrl} — skipping setWebhook`);
            } else {
              fetch(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookBody)
              }).then(res => res.json()).then(data => {
                console.log(`📡 Team Bot Webhook status (${baseUrl}):`, data);
              }).catch(e => console.error('Error setting team webhook:', e));
            }
          })
          .catch(() => {
            // Fallback direct setWebhook
            fetch(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookBody)
            }).catch(e => console.error('Error setting team webhook:', e));
          });
      }

      // Global bot error handlers — DM Firoz on unhandled errors
      teamBot.on('polling_error', (err) => {
        console.error('🔴 Team Bot polling_error:', err.message);
      });

      teamBot.on('error', (err) => {
        const FIROZ_TG_ID = process.env.TECH_ADMIN_TELEGRAM_ID || '1708459008';
        console.error('🔴 Team Bot unhandled error:', err.message);
        teamBot.sendMessage(FIROZ_TG_ID,
          `⚠️ *PurpleOS Bot Exception*\n\n\`${err.message}\`\n\n_${new Date().toISOString()}_`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      });

      // Register native command menu
      teamBot.setMyCommands([
        { command: 'start', description: '🚀 Verify identity & launch menu' },
        { command: 'help', description: '📖 Show all available commands' },
        { command: 'cancel', description: '🚫 Cancel active wizard session' },
        { command: 'myprofile', description: '👤 View & edit employee profile' },
        { command: 'mybank', description: '💳 Bank & bKash payout details' },
        { command: 'mytasks', description: '📋 See assigned tasks' },
        { command: 'myearnings', description: '💰 Salary & commission summary' },
        { command: 'resetpin', description: '🔑 Get new web portal login PIN' },
        { command: 'clockin', description: '📍 GPS clock-in to studio' },
        { command: 'clockout', description: '🚪 Clock-out & log hours' },
        { command: 'leave', description: '🌴 Apply for leave' },
        { command: 'leavebalance', description: '🌴 Check remaining leave balance' },
        { command: 'expense', description: '🧾 Submit expense claim' },
        { command: 'eod', description: '📝 Submit EOD report' },
        { command: 'myeod', description: '📝 View your submitted EOD history' },
        { command: 'myattendance', description: '📅 View your monthly attendance log' },
        { command: 'leaderboard', description: '🏆 View team XP rankings' },
        { command: 'status', description: '📊 Quick personal dashboard' },
        { command: 'orientation', description: '🎓 Employee onboarding survey' },
        { command: 'techdiag', description: '🛠️ System diagnostics (Admin)' }
      ]).catch(e => {});

      // /cancel command handler
      teamBot.onText(/\/cancel|❌ Cancel/, async (msg) => {
        const chatId = msg.chat.id;
        const sess = await state.getSession(chatId);
        if (sess) {
          await state.clearSession(chatId);
          const emp = await state.getEmployeeByTelegramId(chatId);
          const keyboard = emp ? getRoleKeyboard(emp.accessLevel, true, emp) : {};
          return teamBot.sendMessage(chatId,
            `🚫 *Wizard Cancelled.*\nYour session progress has been cleared.\n\nTap any menu button below to continue.`,
            { parse_mode: 'Markdown', reply_markup: keyboard }
          );
        }
        teamBot.sendMessage(chatId, `✅ No active wizard session to cancel. Tap any button to continue.`);
      });

      // Register persistent Chat Menu Button (Open App)
      fetch(`https://api.telegram.org/bot${teamToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Open App',
            web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' }
          }
        })
      }).catch(e => {});

      // 🔍 TELEGRAM INLINE QUERY HANDLER (@teamBot task search)
      teamBot.on('inline_query', async (query) => {
        const queryId = query.id;
        const qText = (query.query || '').trim();

        try {
          let req = supabase.from('tasks').select('*');
          
          if (qText) {
            const ilikeQuery = `%${qText}%`;
            req = req.or(`title.ilike.${ilikeQuery},client.ilike.${ilikeQuery},assignee.ilike.${ilikeQuery},id.ilike.${ilikeQuery}`);
          }
          
          const { data: matches, error } = await req.order('created_at', { ascending: false }).limit(10);
          if (error) throw error;
          
          if (!matches) return;

          const results = matches.map(t => ({
            type: 'article',
            id: `task-${t.id || Math.random()}`,
            title: `📋 ${t.id || 'TSK'}: ${t.title || 'Task'}`,
            description: `Client: ${t.client || 'PBD'} | Stage: ${t.stage || 'General'} | Priority: ${t.priority || 'Normal'}`,
            input_message_content: {
              message_text: `📋 *PURPLEOS TASK CARD*\n\n` +
                `*Task ID:* \`${t.id || 'N/A'}\`\n` +
                `*Title:* ${t.title || 'Untitled'}\n` +
                `*Client:* ${t.client || 'PBD Client'}\n` +
                `*Stage:* ${t.stage || 'Active'}\n` +
                `*Priority:* ${t.priority || 'Normal'}\n` +
                `*Assignee:* ${t.assignee || 'Unassigned'}\n` +
                `*Due Date:* ${t.due_date || t.dueDate || 'N/A'}\n\n` +
                `🌐 [Open Team Portal](https://purpleos-iota.vercel.app/team)`,
              parse_mode: 'Markdown'
            }
          }));

          teamBot.answerInlineQuery(queryId, results).catch(e => console.error('Inline query error:', e.message));
        } catch (err) {
          console.error('teamBot inline_query error:', err.message);
        }
      });

      // 📱 TELEGRAM CONTACT VERIFICATION HANDLER (1-time phone link)
      teamBot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact || !contact.phone_number) return;

        const normPhone = state.normalizePhone(contact.phone_number);
        const emp = await state.getEmployeeByPhone(normPhone);

        if (!emp) {
          const errorMsg = `🔒 *Access Restricted — Purplebot Digital Internal Portal*\n\n` +
            `The phone number *+${normPhone}* is not registered in the PBD employee database.\n\n` +
            `If you are an authorized employee, please contact Technology Admin *Firoz Uddin Ahmed* (01708-459008) to authorize your account.`;
          return teamBot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
        }

        // Link Telegram ID and generate temp PIN in parallel for max performance
        const [, pinRecord] = await Promise.all([
          state.linkTelegramId(emp.emp_code, chatId),
          createTempPin(emp.phone, emp.emp_code, 'team', emp.email)
        ]);
        emp.telegramId = String(chatId);

        const welcomeMsg = `✅ *Identity Verified — Welcome, ${emp.name}!*\n\n` +
          `• Designation: *${emp.role}*\n` +
          `• Department: *${emp.department}*\n` +
          `• Access Level: *${emp.accessLevel}*\n\n` +
          `🔑 *Desktop Web PIN:* \`${pinRecord.pin}\`\n` +
          `🌐 Portal: https://purpleos-iota.vercel.app/auth\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🚀 *Your full dashboard is now unlocked!*\n` +
          `Use the menu below or tap *Open App* for the full portal.`;

        const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);
        teamBot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      
      // ─── ALL KNOWN MENU BUTTON TEXTS ────────────────────────────────────────────
      // These are the exact keyboard button texts. When pressed, they are handled
      // by dedicated onText() listeners below. The on('message') handler below
      // must NOT intercept them — it only routes active wizard step inputs.
      const ALL_MENU_BUTTONS = [
        // Navigation / display (handled by onText or other specific handlers)
        '📱 Verify My Phone Number', '🎓 Complete My Profile Survey', '🔑 View My Web Login PIN',
        '📋 My Tasks', '💰 My Earnings', '✍️ Pending Approvals', '🎬 Client Status',
        '👥 Full Team Status', '📊 Department Report', '👤 My Profile', '💳 Bank & bKash',
        '🛠️ Tech Diagnostics', '📍 Clock-In GPS', '🚪 Clock Out', '🌅 Morning Briefing',
        '📊 Business Snapshot', '💰 Finance Summary',
        // Wizard-initiating buttons — handled exclusively by their onText() listeners
        '🧾 Submit Expense', '🌴 Leave Request', '📝 EOD Report',
        '🧾 Log Expense Entry', '📋 Invoice Tracker', '💰 Payment Follow-Up'
      ];

      const VALID_WIZARD_ACTIONS = ['await_expense', 'await_leave', 'await_eod'];

      teamBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();

        // Check if there is an active wizard session
        const wizardState = await state.getSession(chatId);

        // F3-5: If a wizard is active and user sends media/photo, warn them gracefully instead of freezing
        if (wizardState && !text) {
          return teamBot.sendMessage(chatId,
            `⚠️ Please reply with *text only* during this wizard.\n` +
            `To upload images/receipts, use the Mini App. Type /cancel to exit.`,
            { parse_mode: 'Markdown' }
          );
        }

        if (!text) return; // Ignore non-wizard non-text messages

        // If the message matches ANY known menu button, let its dedicated onText()
        // handler take it. This handler is ONLY for wizard step inputs.
        const isKnownMenuButton = ALL_MENU_BUTTONS.some(b => text === b || text.startsWith(b));
        if (isKnownMenuButton) {
          // Clear any stale/corrupt session so wizard buttons always start fresh
          await state.clearSession(chatId);
          return;
        }

        if (!wizardState) return; // No active wizard — let onText handlers take it

        // ⚠️ Safety net: if the session action is not a known wizard prefix,
        // it's corrupt/stale. Clear it so the user is never stuck.
        const isValidWizard = VALID_WIZARD_ACTIONS.some(a => wizardState.action?.startsWith(a));
        if (!isValidWizard) {
          console.warn(`[Bot] Clearing corrupt session for chat ${chatId}: action=${wizardState.action}`);
          await state.clearSession(chatId);
          return; // Let onText handlers process the message normally
        }

        // We have a valid active wizard — look up the employee
        const emp = await state.getEmployeeByTelegramId(chatId);
        if (!emp) {
          // Can't identify user — clear the session and ask them to re-verify
          await state.clearSession(chatId);
          return teamBot.sendMessage(chatId, `⚠️ Session expired. Please re-tap the menu button to start again.`, { parse_mode: 'Markdown' });
        }

        // Route to the correct wizard step handler
        if (wizardState.action.startsWith('await_expense')) {
          const expensesHandler = require('./bot/handlers/expenses');
          await expensesHandler.handleExpenseWizardStep(teamBot, msg, wizardState, emp);
        } else if (wizardState.action.startsWith('await_leave')) {
          const leavesHandler = require('./bot/handlers/leaves');
          await leavesHandler.handleLeaveWizardStep(teamBot, msg, wizardState, emp);
        } else if (wizardState.action.startsWith('await_eod')) {
          const eodHandler = require('./bot/handlers/eod');
          await eodHandler.handleEODWizardStep(teamBot, msg, wizardState, emp);
        }
      });

      // /start handler
      teamBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await state.clearSession(chatId);
        
        const emp = await state.getEmployeeByTelegramId(chatId);

        if (emp) {
          const welcome = `💜 *Welcome back, ${emp.name}!*\n\n` +
            `🏢 *${emp.role}* · ${emp.department}\n` +
            `⭐ Rank: *${emp.badge || '🌱 Recruit'}* (${emp.xp || 0} XP)\n\n` +
            `Your dashboard is ready. Tap any menu button below or hit *Open App* for full access.`;
          const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);
          teamBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        } else {
          const welcome = `🟣 *PURPLEBOT DIGITAL — Team Assistant*\n\n` +
            `Welcome to the internal team bot.\n\n` +
            `📌 *Getting Started:*\n` +
            `Tap *📱 Verify My Phone Number* below to link your account. It takes 5 seconds!`;
          const keyboard = getRoleKeyboard('Specialist / Crew', false);
          teamBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        }
      });

      // /help handler
      teamBot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        await state.clearSession(chatId);
        const helpText = `📖 *PURPLEOS TEAM BOT — COMMAND GUIDE*\n\n` +
          `• \`/start\` — Verify identity & launch menu\n` +
          `• \`/help\` — Show all available commands\n` +
          `• \`/myprofile\` — View & update employee profile\n` +
          `• \`/mybank\` — Manage salary bank & bKash payout details\n` +
          `• \`/mytasks\` — See your assigned active tasks\n` +
          `• \`/myearnings\` — Salary + commission breakdown\n` +
          `• \`/resetpin\` — Get a fresh web portal login PIN\n` +
          `• \`/clockin\` — GPS studio clock-in\n` +
          `• \`/clockout\` — Clock-out & log daily hours\n` +
          `• \`/orientation\` — Complete onboarding survey\n` +
          `• \`/techdiag\` — System diagnostics (Admin only)\n\n` +
          `💡 *Tip:* You can also search tasks inline anywhere in Telegram by typing \`@teamBot <search_term>\`!`;
        teamBot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
      });

      // ──────── MODULAR HANDLERS ────────
      const attendanceHandler = require('./bot/handlers/attendance');
      const profileHandler = require('./bot/handlers/profile');
      const adminHandler = require('./bot/handlers/admin');
      const leaderboardHandler = require('./bot/handlers/leaderboard');
      const mystatsHandler = require('./bot/handlers/mystats');
      const leavesHandler = require('./bot/handlers/leaves');
      const eodHandler = require('./bot/handlers/eod');
      const tasksHandler = require('./bot/handlers/tasks');
      const expensesHandler = require('./bot/handlers/expenses');
      const briefingHandler = require('./bot/handlers/briefing');
      const approvalsHandler = require('./bot/handlers/approvals');
      const reportsHandler = require('./bot/handlers/reports');
      const financeHandler = require('./bot/handlers/finance');

      // Core profile & earnings
      teamBot.onText(/\/myprofile|👤 My Profile/, (msg) => profileHandler.handleMyProfile(teamBot, msg));
      teamBot.onText(/\/mybank|💳 Bank & bKash/, (msg) => profileHandler.handleMyBank(teamBot, msg));
      teamBot.onText(/\/myearnings|💰 My Earnings|💰 My Commission/, (msg) => profileHandler.handleMyEarnings(teamBot, msg));
      teamBot.onText(/\/techdiag|🛠️ Tech Diagnostics/, (msg) => adminHandler.handleTechDiagnostics(teamBot, msg));

      // Tasks
      teamBot.onText(/\/mytasks|📋 My Tasks/, (msg) => tasksHandler.handleMyTasks(teamBot, msg));

      // Attendance
      teamBot.onText(/\/clockin|📍 Clock-In GPS/, (msg) => attendanceHandler.handleTextClockIn(teamBot, msg));
      teamBot.onText(/\/clockout|🚪 Clock Out/, (msg) => attendanceHandler.handleClockOut(teamBot, msg));
      teamBot.on('location', (msg) => attendanceHandler.handleLocationClockIn(teamBot, msg));
      teamBot.onText(/\/myattendance|📅 My Attendance Log|👥 HR & Attendance/, (msg) => attendanceHandler.handleMyAttendance(teamBot, msg));

      // Leaves
      teamBot.onText(/\/leave$|\/leaverequest|🌴 Leave Request/, (msg) => leavesHandler.handleInitLeave(teamBot, msg));
      teamBot.onText(/\/leavebalance|🌴 Leave Balance/, (msg) => leavesHandler.handleLeaveBalance(teamBot, msg));

      // Expenses
      teamBot.onText(/\/expense$|\/submitexpense|🧾 Submit Expense|💸 Expense Queue/, (msg) => expensesHandler.handleInitExpense(teamBot, msg));
      teamBot.onText(/\/logexpense|🧾 Log Expense Entry/, (msg) => financeHandler.handleLogExpenseEntry(teamBot, msg));

      // EOD
      teamBot.onText(/\/eod$|\/submiteod|📝 EOD Report/, (msg) => eodHandler.handleInitEOD(teamBot, msg));
      teamBot.onText(/\/myeod|📝 My EOD History/, (msg) => eodHandler.handleMyEODHistory(teamBot, msg));

      // Executive briefing & status
      teamBot.onText(/\/briefing|🌅 Morning Briefing/, (msg) => briefingHandler.handleMorningBriefing(teamBot, msg));
      teamBot.onText(/\/snapshot|📊 Business Snapshot|🏢 Ops Dashboard/, (msg) => briefingHandler.handleBusinessSnapshot(teamBot, msg));
      teamBot.onText(/\/finance|💰 Finance Summary/, (msg) => briefingHandler.handleFinanceSummary(teamBot, msg));
      teamBot.onText(/\/approvals|✍️ Pending Approvals/, (msg) => approvalsHandler.handlePendingApprovals(teamBot, msg));
      teamBot.onText(/\/clients|🎬 Client Status|🎯 My Clients|🔔 Client Updates|🚀 Client Activation/, (msg) => reportsHandler.handleClientStatus(teamBot, msg));
      teamBot.onText(/\/invoicetracker|📋 Invoice Tracker/, (msg) => financeHandler.handleInvoiceTracker(teamBot, msg));
      teamBot.onText(/\/paymentfollowup|💰 Payment Follow-Up/, (msg) => financeHandler.handlePaymentFollowUp(teamBot, msg));

      teamBot.onText(/\/leaderboard|🏆 Leaderboard/, (msg) => leaderboardHandler.handleLeaderboard(teamBot, msg));
      teamBot.onText(/\/status|📊 Dashboard Status/, (msg) => mystatsHandler.handleStatus(teamBot, msg));

      // Reset PIN Command
      teamBot.onText(/\/resetpin|🔑 View My Web Login PIN/, async (msg) => {
        const chatId = msg.chat.id;
        const emp = await state.getEmployeeByTelegramId(chatId);

        if (!emp) {
          return teamBot.sendMessage(chatId, `❌ Please verify your phone number first by tapping "Verify My Phone Number".`, { parse_mode: 'Markdown' });
        }

        const pinRecord = await createTempPin(emp.phone, emp.id, 'team', emp.email);
        teamBot.sendMessage(chatId, `🔑 *New Desktop Web PIN:* \`${pinRecord.pin}\`\n\nGo to https://purpleos-iota.vercel.app/auth to log in on your laptop.`, { parse_mode: 'Markdown' });
      });




      // 🎓 Orientation Command / Button
      teamBot.onText(/\/orientation|🎓 Orientation/, async (msg) => {
        const chatId = msg.chat.id;
        await state.clearSession(chatId);
        const emp = await state.getEmployeeByTelegramId(chatId);
        if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);

        const tasks = emp.onboardingTasks || [
          { label: '📧 Add Work Email', completed: Boolean(emp.email) },
          { label: '🌐 Activate Web Portal (First Login)', completed: Boolean(emp.permanentPinSet) },
          { label: '📍 Submit First GPS Clock-In', completed: Boolean(emp.status && emp.status !== 'Offline') },
          { label: '📋 Submit First EOD Report', completed: false },
          { label: '🌴 Submit Test Leave Request', completed: false },
          { label: '💳 Bank & bKash Payout Setup', completed: Boolean(emp.bankInfo?.bankName || emp.bankInfo?.mfsNo) }
        ];

        let taskText = tasks.map((t, idx) => `${t.completed ? '✅' : '⏳'} ${idx + 1}. *${t.label || t.id}*`).join('\n');

        const text = `🎓 *PURPLEBOT ORIENTATION & ONBOARDING TRACKER*\n\n` +
          `• Employee: *${emp.name}*\n` +
          `• Current Rank: *${emp.badge || '🌱 Recruit'}*\n` +
          `• Earned XP: *${emp.xp || 0} XP*\n\n` +
          `📋 *Onboarding Checklist:*\n${taskText}\n\n` +
          `🌐 Open Onboarding Web Portal: https://purpleos-iota.vercel.app/onboarding`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });
      // Refactored monolithic handlers
      require('./bot/handlers/legacy_menus').registerLegacyTeamMenus(teamBot, readDB);
    } catch (err) {
      console.warn('⚠️ Team Bot Init Warning:', err.message);
    }
  }

  // 2. Initialize Client Bot (Purple Bot)
  if (clientToken && clientToken.trim() !== '' && !clientToken.includes('your_token')) {
    try {
      const usePolling = process.env.USE_POLLING === 'true';
      clientBot = new TelegramBot(clientToken, { polling: usePolling });

      if (usePolling) {
        clientBot.deleteWebHook().catch(e => console.error('Error deleting client webhook:', e));
        console.log('✅ Local polling enabled for clientBot (Webhook deleted)');
      } else {
        const webhookBody = { url: `${baseUrl}/api/webhooks/telegram?bot=client` };
        if (process.env.WEBHOOK_SECRET) webhookBody.secret_token = process.env.WEBHOOK_SECRET;

        fetch(`https://api.telegram.org/bot${clientToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody)
        }).then(res => res.json()).then(data => {
          console.log(`📡 Client Bot Webhook status (${baseUrl}):`, data);
        }).catch(e => console.error('Error setting client webhook:', e));
      }

      // Register native command menu
      clientBot.setMyCommands([
        { command: 'start', description: '🚀 Open client portal & verify' },
        { command: 'help', description: '📖 Show all available client options' },
        { command: 'services', description: '🎨 View agency services & packages' },
        { command: 'portfolio', description: '📁 Explore agency portfolio' },
        { command: 'review', description: '🎬 Access Video Review Room' },
        { command: 'campaign', description: '📋 Track active campaign status' },
        { command: 'invoices', description: '💳 View billing & pay invoices' }
      ]).catch(e => {});

      // Register persistent Chat Menu Button (Open App)
      fetch(`https://api.telegram.org/bot${clientToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Open App',
            web_app: { url: 'https://purpleos-iota.vercel.app/client-miniapp' }
          }
        })
      }).catch(e => {});

      // 🔍 TELEGRAM INLINE QUERY HANDLER (@clientBot invoice & service search)
      clientBot.on('inline_query', async (query) => {
        const queryId = query.id;
        const qText = (query.query || '').trim();

        try {
          let req = supabase.from('invoices').select('*');
          
          if (qText) {
            const ilikeQuery = `%${qText}%`;
            req = req.or(`id.ilike.${ilikeQuery},client_name.ilike.${ilikeQuery},clientName.ilike.${ilikeQuery},project_name.ilike.${ilikeQuery},projectName.ilike.${ilikeQuery}`);
          }
          
          const { data: matches, error } = await req.order('created_at', { ascending: false }).limit(10);
          if (error) throw error;
          
          if (!matches) return;

          const results = matches.map(inv => ({
            type: 'article',
            id: `inv-${inv.id || Math.random()}`,
            title: `💳 ${inv.id || 'INV'}: ${inv.project_name || inv.projectName || 'Invoice'}`,
            description: `Client: ${inv.client_name || inv.clientName || 'Client'} | Amount: BDT ${(Number(inv.amount) || 0).toLocaleString()} | Status: ${inv.status || 'Pending'}`,
            input_message_content: {
              message_text: `💳 *PURPLEOS COMMERCIAL INVOICE CARD*\n\n` +
                `*Invoice ID:* \`${inv.id || 'N/A'}\`\n` +
                `*Client:* ${inv.client_name || inv.clientName || 'Brand Partner'}\n` +
                `*Project:* ${inv.project_name || inv.projectName || 'Campaign Work'}\n` +
                `*Amount:* BDT ${(Number(inv.amount) || 0).toLocaleString()}\n` +
                `*Status:* ${inv.status || 'Pending'}\n` +
                `*Due Date:* ${inv.due_date || inv.dueDate || 'N/A'}\n\n` +
                `🌐 [Open Partner Portal](https://purpleos-iota.vercel.app/partners)`,
              parse_mode: 'Markdown'
            }
          }));

          clientBot.answerInlineQuery(queryId, results).catch(e => console.error('Inline query error:', e.message));
        } catch (err) {
          console.error('clientBot inline_query error:', err.message);
        }
      });

      // /start handler
      clientBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));

        if (client) {
          const pendingCount = (dbData.tasks || []).filter(t => t.client === client.name && t.stage === 'Client Review').length;
          const welcome = `👋 *Welcome back, ${client.name || client.contactPerson}!*\n\n` +
            `📋 *${pendingCount} deliverable(s)* awaiting your review.\n` +
            `💳 Monthly Retainer: *BDT ${(client.retainerValue || 0).toLocaleString()}*\n\n` +
            `Tap any menu button below or hit *Open App* for your client portal.`;
          const keyboard = getClientKeyboard(client);
          clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        } else {
          const welcome = `🎨 *Purplebot Digital — Brand Partner Portal*\n\n` +
            `Your creative agency assistant for:\n` +
            `• 🎬 Reviewing video & TVC deliverables\n` +
            `• 📋 Live campaign progress tracking\n` +
            `• 💳 Invoice & bKash payment verification\n` +
            `• 📞 Direct line to your Account Manager\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📌 *To get started:* Tap *📱 Share My Phone to Get Started* below.`;
          const keyboard = {
            keyboard: [[{ text: '📱 Share My Phone to Get Started', request_contact: true }]],
            resize_keyboard: true
          };
          clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        }
      });

      // /help handler
      clientBot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        const helpText = `📖 *PURPLEOS CLIENT BOT — QUICK GUIDE*\n\n` +
          `• \`/start\` — Open portal & link account\n` +
          `• \`/help\` — Show available options & commands\n` +
          `• \`/review\` — Access Video Review Room for active cuts\n` +
          `• \`/campaign\` — Track live campaign production progress\n` +
          `• \`/invoices\` — View billing & payment history\n` +
          `• \`/services\` — Explore agency services & pricing\n` +
          `• \`/portfolio\` — View agency creative portfolio\n\n` +
          `💡 *Tip:* Tap the persistent *Open App* button at any time for full web portal access!`;
        clientBot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
      });

      // ─── Helper: find client by phone (checks main phone + pocs array) ───
      async function findClientByPhone(normPhone) {
        if (supabase) {
          try {
            const { data: byMain } = await supabase.from('clients').select('*')
              .ilike('phone', `%${normPhone}`).maybeSingle();
            if (byMain) return { ...byMain, activeCampaigns: byMain.active_campaigns || [] };
            const { data: allClients } = await supabase.from('clients').select('*');
            if (allClients) {
              const matched = allClients.find(c => {
                const pocs = Array.isArray(c.pocs) ? c.pocs : [];
                return pocs.some(p => p.phone && normalizePhone(p.phone).includes(normPhone));
              });
              if (matched) return { ...matched, activeCampaigns: matched.active_campaigns || [] };
            }
          } catch (e) {}
        }
        const dbData = await readDB();
        return (dbData.clients || []).find(c => normalizePhone(c.phone || '').includes(normPhone)) || null;
      }

      async function sendClientWelcome(chatId, client) {
        await supabase?.from('clients').update({ telegram_id: String(chatId) }).eq('id', client.id);
        const welcome = `\u2705 *Account Linked \u2014 Welcome, ${client.name}!*\n\n` +
          `\u2022 Account Manager: *${client.account_manager || client.accountManager || 'Team'}*\n\n` +
          `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
          `\ud83d\udccc *Next Steps:*\n` +
          `1. Tap *\ud83c\udfa6 Review Room* to preview your latest deliverable\n` +
          `2. Tap *\ud83d\udccb Campaign Status* to track production progress\n` +
          `3. Tap *Open App* anytime for your full client portal`;
        clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: getClientKeyboard(client) });
      }

      // ─── Client phone verification via shared contact ───
      clientBot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact || !contact.phone_number) return;
        const normPhone = normalizePhone(contact.phone_number);
        const client = await findClientByPhone(normPhone);
        if (!client) {
          return clientBot.sendMessage(chatId,
            `🔒 *Phone not found in our client database.*\n\nIf you are an active Purplebot Digital client, please contact your Account Manager to register your phone number.`,
            { parse_mode: 'Markdown' }
          );
        }
        await sendClientWelcome(chatId, client);
      });

      // ─── Manual phone number typed as text ───
      clientBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();
        if (msg.contact) return; // handled above
        if (!/^[\+\d][\d\s\-]{7,14}$/.test(text)) return; // must look like a phone number
        const normPhone = normalizePhone(text);
        if (!normPhone || normPhone.length < 8) return;
        const client = await findClientByPhone(normPhone);
        if (!client) {
          return clientBot.sendMessage(chatId,
            `🔒 *Phone not found in our client database.*\n\nIf you are an active Purplebot Digital client, please contact your Account Manager to register your phone number.`,
            { parse_mode: 'Markdown' }
          );
        }
        await sendClientWelcome(chatId, client);
      });

      const clientHandler = require('./bot/handlers/client');
      clientBot.onText(/\/services|🎨 Our Services/, (msg) => clientHandler.handleServices(clientBot, msg));
      clientBot.onText(/\/portfolio|📁 Portfolio/, (msg) => clientHandler.handlePortfolio(clientBot, msg));
      clientBot.onText(/\/review|🎬 Review Room/, (msg) => clientHandler.handleReviewRoom(clientBot, msg));
      clientBot.onText(/\/campaign|📋 Campaign Status/, (msg) => clientHandler.handleCampaignStatus(clientBot, msg));
      clientBot.onText(/\/invoices|💳 My Invoices/, (msg) => clientHandler.handleInvoices(clientBot, msg));
      clientBot.onText(/📞 Contact AM/, (msg) => clientHandler.handleContactAM(clientBot, msg));
    } catch (err) {
      console.warn('⚠️ Client Bot Init Warning:', err.message);
    }
  }
}

function sendTelegramNotification(chatId, text, inlineKeyboard = null, isTeam = false) {
  let targetBot = isTeam ? (teamBot || clientBot) : (clientBot || teamBot);

  if (!targetBot) {
    const token = process.env.TEAM_BOT_TOKEN || process.env.CLIENT_BOT_TOKEN || null?.teamBot?.token;
    if (token && token.trim() !== '' && !token.includes('your_token')) {
      try {
        teamBot = new TelegramBot(token, { polling: false });
        targetBot = teamBot;
      } catch (e) {}
    }
  }

  if (!targetBot) return false;

  const targetChatId = chatId;

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

module.exports = {
  initBot,
  getTeamBot,
  getClientBot,
  sendTelegramNotification,
  sendToGroup,
  getRoleKeyboard
};
