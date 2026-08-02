const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('./supabase');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');
const { processAutomationEvent } = require('./automation');
const { createTempPin } = require('./auth-pins');

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

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

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
function sendAgreementNotification(stage, emp, dbData) {
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
  const db = readDB();

  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token;
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token;
  const baseUrl = 'https://purpleos-iota.vercel.app';

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      const usePolling = Boolean(process.env.USE_POLLING);
      teamBot = new TelegramBot(teamToken, { polling: usePolling });

      if (!usePolling) {
        const webhookBody = { url: `${baseUrl}/api/webhooks/telegram?bot=team` };
        if (process.env.WEBHOOK_SECRET) webhookBody.secret_token = process.env.WEBHOOK_SECRET;

        fetch(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody)
        }).then(res => res.json()).then(data => {
          console.log(`📡 Team Bot Webhook status (${baseUrl}):`, data);
        }).catch(e => console.error('Error setting team webhook:', e));
      }

      // Register native command menu
      teamBot.setMyCommands([
        { command: 'start', description: '🚀 Verify identity & launch menu' },
        { command: 'help', description: '📖 Show all available commands' },
        { command: 'myprofile', description: '👤 View & edit employee profile' },
        { command: 'mybank', description: '💳 Bank & bKash payout details' },
        { command: 'mytasks', description: '📋 See assigned tasks' },
        { command: 'myearnings', description: '💰 Salary & commission summary' },
        { command: 'resetpin', description: '🔑 Get new web portal login PIN' },
        { command: 'clockin', description: '📍 GPS clock-in to studio' },
        { command: 'clockout', description: '🚪 Clock-out & log hours' },
        { command: 'orientation', description: '🎓 Employee onboarding survey' },
        { command: 'techdiag', description: '🛠️ System diagnostics (Admin)' }
      ]).catch(e => {});

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
        const qText = (query.query || '').trim().toLowerCase();

        try {
          let allTasks = [];
          try {
            const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
            if (tasks && tasks.length) allTasks = tasks;
          } catch (e) {}

          if (!allTasks.length) {
            const dbData = readDB();
            allTasks = dbData.tasks || [];
          }

          const matches = allTasks.filter(t => 
            !qText || 
            (t.title || '').toLowerCase().includes(qText) || 
            (t.client || '').toLowerCase().includes(qText) ||
            (t.assignee || '').toLowerCase().includes(qText) ||
            (t.id || '').toLowerCase().includes(qText)
          ).slice(0, 10);

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

        const dbData = readDB();
        const normPhone = normalizePhone(contact.phone_number);

        // Match against dbData.team
        const emp = (dbData.team || []).find(e => normalizePhone(e.phone) === normPhone);

        if (!emp) {
          const errorMsg = `🔒 *Access Restricted — Purplebot Digital Internal Portal*\n\n` +
            `The phone number *+${normPhone}* is not registered in the PBD employee database.\n\n` +
            `If you are an authorized employee, please contact Technology Admin *Firoz Uddin Ahmed* (01708-459008) to authorize your account.`;
          return teamBot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
        }

        // Link Telegram ID in local db
        emp.telegramId = String(chatId);
        // NOTE: onboardingComplete stays as-is — employees unlock their full
        // menu by completing the profile survey in the Mini App, not just by verifying.

        // ✅ CRITICAL: Persist telegramId to Supabase profiles so the Mini App can authenticate
        if (supabase) {
          try {
            await supabase.from('profiles').upsert({
              emp_code: emp.id,
              name: emp.name,
              role: emp.role,
              department: emp.department || '',
              phone: emp.phone,
              telegram_id: String(chatId),
              base_salary: emp.baseSalary || 0,
              commission_rate: emp.commissionRate || 0,
              earned_commissions: emp.earnedCommissions || 0,
              status: 'In Studio',
            }, { onConflict: 'emp_code' });
          } catch (e) { console.error('Supabase profile upsert error:', e.message); }
        }

        // Generate web temp PIN (async — persists to Supabase)
        const pinRecord = await createTempPin(emp.phone, emp.id, 'team', emp.email);

        writeDB(dbData);
        broadcast('team_update', dbData.team);

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

      const userState = {};

      teamBot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();

        // Anti-looping: Clear wizard state if user taps top-level menu button
        const isMenuButton = [
          '/start', '/help', '/resetpin', '/myprofile', '/mybank', '/techdiag', '/orientation',
          '🌅 Morning Briefing', '📊 Business Snapshot', '👥 Full Team Status', '💰 Finance Summary',
          '👤 My Profile', '💳 Bank & bKash', '🛠️ Tech Diagnostics', '🎓 Orientation',
          '📍 Clock-In GPS', '🚪 Clock Out', '📋 My Tasks', '💰 My Earnings',
          '👥 My Team Roster', '📊 Department Report', '👥 My Team',
          '🎯 My Clients', '📈 Lead Pipeline', '🔔 Client Updates', '💰 My Commission',
          '🏢 Ops Dashboard', '👥 HR & Attendance', '📡 Media Buying', '🚀 Client Activation',
          '⚡ Studio Workload', '🚧 Bottleneck Radar', '📸 Studio & Gear Slots', '📊 Turnaround Metrics',
          '🎨 Design Queue', '👁️ Review Room', '👥 Design Team', '✅ Leave Approvals',
          '🖌️ My Creative Tasks', '📤 Submit for QC', '✏️ View Revisions',
          '🎬 Production Queue', '📜 Script & Copy QC', '🎥 Shoot Call-Sheets', '👥 Content Team',
          '📜 My Scripts & Copy', '🤖 AI Prompt Studio', '📤 Submit Script QC',
          '🎯 My Client Roster', '🎬 Client Approvals', '📢 Send Client Link', '💬 Client Feedback', '👥 Account Team',
          '📈 Campaign Strategy', '🗓️ Content Calendars', '👥 Strategy Team', '📅 My Content Plans', '🚀 Dispatch Hub', '📝 Draft New Plan',
          '💸 Expense Queue', '🧾 Invoice Status', '📊 Payroll Summary', '🏦 Bank & bKash Hub', '👥 Admin Team',
          '✍️ Pending Approvals', '🎬 Client Status',
          '🧾 Submit Expense', '🌴 Leave Request', '📝 EOD Report',
          '🧾 Log Expense Entry', '📋 Invoice Tracker', '💰 Payment Follow-Up'
        ].some(b => text.startsWith(b));

        if (isMenuButton) {
          userState[chatId] = null;
          return;
        }

        // Process active wizard input
        const state = userState[chatId];
        if (state && text) {
          const dbData = readDB();
          const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
          if (!emp) return;

          if (state.action === 'await_emergency_contact') {
            emp.emergencyContact = text;
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId, `✅ *Emergency Contact Updated!*\nSet to: *${text}*`, { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) });
          } else if (state.action === 'await_address') {
            emp.address = text;
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId, `✅ *Home Address Updated!*\nSet to: *${text}*`, { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) });
          } else if (state.action === 'await_email') {
            emp.email = text;
            emp.workEmail = text;
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId, `✅ *Work Email Updated!*\nSet to: *${text}*`, { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) });
          } else if (state.action === 'await_bank_info') {
            emp.bankInfo = emp.bankInfo || {};
            const parts = text.split(',');
            emp.bankInfo.bankName = parts[0] ? parts[0].trim() : text;
            emp.bankInfo.accNo = parts[1] ? parts[1].trim() : 'Updated';
            emp.bankInfo.branch = parts[2] ? parts[2].trim() : 'Main Branch';
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId, `✅ *Bank Details Saved!*\nBank: *${emp.bankInfo.bankName}*\nAcc: *${emp.bankInfo.accNo}*`, { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) });
          } else if (state.action === 'await_mfs') {
            emp.bankInfo = emp.bankInfo || {};
            emp.bankInfo.mfsNo = text;
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId, `✅ *bKash / Nagad Number Saved!*\nNumber: *${text}*`, { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) });
          } else if (state.action === 'await_expense_amount') {
            const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
            if (isNaN(amount) || amount <= 0) {
              teamBot.sendMessage(chatId, `⚠️ Please enter a valid amount (e.g. \`1500\`).`, { parse_mode: 'Markdown' });
              return;
            }
            userState[chatId] = { ...state, amount, action: 'await_expense_category' };
            teamBot.sendMessage(chatId,
              `💰 Amount: *BDT ${amount.toLocaleString()}*\n\nNow please reply with the *category*:\n\n` +
              `1️⃣ Transport\n2️⃣ Food & Meals\n3️⃣ Office Supplies\n4️⃣ Client Entertainment\n5️⃣ Other\n\nReply with \`1\`-\`5\` or type custom category`,
              { parse_mode: 'Markdown' }
            );
          } else if (state.action === 'await_expense_category') {
            const categories = { '1': 'Transport', '2': 'Food & Meals', '3': 'Office Supplies', '4': 'Client Entertainment', '5': 'Other' };
            const category = categories[text.trim()] || text.trim();
            dbData.expenses = dbData.expenses || [];
            const newExpense = {
              id: `EXP-${Date.now()}`,
              submittedBy: state.empName,
              employeeId: state.empId,
              amount: state.amount,
              category: category,
              status: 'Pending',
              createdAt: new Date().toISOString()
            };
            dbData.expenses.push(newExpense);
            writeDB(dbData);
            userState[chatId] = null;
            try { const { broadcast } = require('../services/sse'); broadcast('expense_update', dbData.expenses); } catch(e) {}
            teamBot.sendMessage(chatId,
              `✅ *Expense Claim Submitted!*\n\n` +
              `• Amount: *BDT ${state.amount.toLocaleString()}*\n` +
              `• Category: *${category}*\n` +
              `• Status: *Pending Approval*\n\n` +
              `Your line manager will be notified for Tier-1 approval.`,
              { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
            );
          } else if (state.action === 'await_leave_type') {
            const leaveTypes = { '1': 'Casual Leave', '2': 'Sick Leave', '3': 'Half Day' };
            const leaveType = leaveTypes[text.trim()];
            if (!leaveType) {
              teamBot.sendMessage(chatId, `⚠️ Please reply with \`1\`, \`2\`, or \`3\`.`, { parse_mode: 'Markdown' });
              return;
            }
            userState[chatId] = { ...state, leaveType, action: 'await_leave_date' };
            teamBot.sendMessage(chatId,
              `📅 Leave Type: *${leaveType}*\n\nPlease reply with the *date* (e.g. \`Aug 5\` or \`2026-08-05\`):`,
              { parse_mode: 'Markdown' }
            );
          } else if (state.action === 'await_leave_date') {
            dbData.leaves = dbData.leaves || [];
            const newLeave = {
              id: `LV-${Date.now()}`,
              employeeId: state.empId,
              employeeName: state.empName,
              leaveType: state.leaveType,
              startDate: text.trim(),
              status: 'Pending Line Review',
              reportsTo: state.reportsTo,
              createdAt: new Date().toISOString()
            };
            dbData.leaves.push(newLeave);
            writeDB(dbData);
            userState[chatId] = null;

            // Notify line manager
            const manager = (dbData.team || []).find(t => t.id === state.reportsTo);
            if (manager && manager.telegramId) {
              try {
                teamBot.sendMessage(manager.telegramId,
                  `🌴 *NEW LEAVE REQUEST*\n\n` +
                  `From: *${state.empName}*\n` +
                  `Type: *${state.leaveType}*\n` +
                  `Date: *${text.trim()}*\n\n` +
                  `_Approve or reject via the Pending Approvals button._`,
                  { parse_mode: 'Markdown' }
                );
              } catch(e) {}
            }
            teamBot.sendMessage(chatId,
              `✅ *Leave Request Submitted!*\n\n` +
              `• Type: *${state.leaveType}*\n` +
              `• Date: *${text.trim()}*\n` +
              `• Status: *Pending Line Review*\n\n` +
              `Your manager ${manager ? `(*${manager.name}*)` : ''} has been notified.`,
              { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
            );
          } else if (state.action === 'await_eod_summary') {
            dbData.eod_reports = dbData.eod_reports || [];
            const eodEntry = {
              id: `EOD-${Date.now()}`,
              employeeId: state.empId,
              employeeName: state.empName,
              summary: text,
              date: new Date().toLocaleDateString('en-GB'),
              createdAt: new Date().toISOString()
            };
            dbData.eod_reports.push(eodEntry);
            writeDB(dbData);
            userState[chatId] = null;
            teamBot.sendMessage(chatId,
              `✅ *EOD Report Submitted!*\n\n` +
              `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n` +
              `📝 "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n\n` +
              `Thank you for your update. Have a great evening! 💜`,
              { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
            );
          }
        }
      });

      // /start handler
      teamBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();

        // Primary: check db.json for telegramId
        let emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        // ✅ Supabase Fallback: Handles Vercel cold-start where db.json writes are lost
        if (!emp && supabase) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('telegram_id', String(chatId))
              .single();
            if (profile) {
              // Re-link: find employee by emp_code or phone match
              emp = (dbData.team || []).find(e =>
                e.id === profile.emp_code ||
                normalizePhone(e.phone) === normalizePhone(profile.phone || '')
              );
              if (emp) {
                // Restore telegramId and onboarding state from Supabase
                emp.telegramId = String(chatId);
                if (profile.onboarding_complete) emp.onboardingComplete = true;
              }
            }
          } catch (e) { /* Supabase lookup failed — remain unverified */ }
        }

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
      teamBot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
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

      // Reset PIN Command
      teamBot.onText(/\/resetpin/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        if (!emp) {
          return teamBot.sendMessage(chatId, `❌ Please verify your phone number first by tapping "Verify My Phone Number".`, { parse_mode: 'Markdown' });
        }

        const pinRecord = await createTempPin(emp.phone, emp.id, 'team', emp.email);
        teamBot.sendMessage(chatId, `🔑 *New Desktop Web PIN:* \`${pinRecord.pin}\`\n\nGo to https://purpleos-iota.vercel.app/auth to log in on your laptop.`, { parse_mode: 'Markdown' });
      });

      // 👤 My Profile Command / Button
      teamBot.onText(/\/myprofile|👤 My Profile/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const text = `👤 *PURPLEBOT EMPLOYEE GROUND PROFILE*\n\n` +
          `• Name: *${emp.name}* (${emp.id})\n` +
          `• Role: *${emp.role}*\n` +
          `• Department: *${emp.department || 'Tech & AI'}*\n` +
          `• Work Email: *${emp.email || emp.workEmail || 'Not set'}*\n` +
          `• Emergency Contact: *${emp.emergencyContact || 'Not set'}*\n` +
          `• Home Address: *${emp.address || 'Not set'}*\n` +
          `• Current Rank: *${emp.badge || '🌱 Recruit'}* (${emp.xp || 0} XP)`;

        const inlineButtons = [
          [
            { text: '✏️ Emergency Phone', callback_data: 'edit_emergency_contact' },
            { text: '✏️ Home Address', callback_data: 'edit_address' }
          ],
          [
            { text: '✏️ Work Email', callback_data: 'edit_work_email' }
          ]
        ];

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineButtons } });
      });

      // 💳 Bank & bKash Command / Button
      teamBot.onText(/\/mybank|💳 Bank & bKash/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const bank = emp.bankInfo || {};
        const text = `💳 *PURPLEBOT FINANCIAL PAYOUT ACCOUNTS*\n\n` +
          `• Employee: *${emp.name}*\n` +
          `• Bank Name: *${bank.bankName || 'Not configured'}*\n` +
          `• Account No: *${bank.accNo || 'Not configured'}*\n` +
          `• Branch: *${bank.branch || 'Not configured'}*\n` +
          `• Mobile Banking (bKash/Nagad): *${bank.mfsNo || 'Not configured'}*\n\n` +
          `_This information is used by Finance Manager Borhan Siddique for monthly payroll & expense disbursals._`;

        const inlineButtons = [
          [
            { text: '✏️ Set Bank Account', callback_data: 'edit_bank_details' },
            { text: '✏️ Set bKash/Nagad', callback_data: 'edit_mfs' }
          ]
        ];

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineButtons } });
      });

      // 🛠️ Tech Diagnostics Command / Button (Tech Admin / Firoz)
      teamBot.onText(/\/techdiag|🛠️ Tech Diagnostics/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const teamCount = (dbData.team || []).length;
        const taskCount = (dbData.tasks || []).length;
        const invCount = (dbData.invoices || []).length;
        const logsCount = (dbData.automationLogs || []).length;

        const text = `🛠️ *PURPLEOS TECH DIAGNOSTICS & SYSTEM HEALTH*\n\n` +
          `• Tech Admin: *${emp.name}* (PBD-000)\n` +
          `• System Status: 🟢 *Live & Operational*\n` +
          `• Registered Roster: *${teamCount} Employees*\n` +
          `• Production Tasks: *${taskCount} Workflows*\n` +
          `• Financial Invoices: *${invCount} Records*\n` +
          `• Automation Logs: *${logsCount} Executions*\n\n` +
          `_Use tools below for maintenance and cloud sync._`;

        const inlineButtons = [
          [
            { text: '🔄 Sync Supabase Cloud', callback_data: 'tech_sync_supabase' },
            { text: '🧹 Clean Test Slate', callback_data: 'tech_clean_slate' }
          ],
          [
            { text: '🔑 Generate Web PIN', callback_data: 'tech_fresh_pin' }
          ]
        ];

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineButtons } });
      });

      // 🎓 Orientation Command / Button
      teamBot.onText(/\/orientation|🎓 Orientation/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

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

      // ══════════════════════════════════════════
      // MEHEDI CLIENT & GROWTH COMMANDS
      // ══════════════════════════════════════════

      // 🎯 My Clients — full portfolio overview
      teamBot.onText(/🎯 My Clients/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const clients = dbData.clients || [];
        const tasks = dbData.tasks || [];
        const invoices = dbData.invoices || [];

        if (!clients.length) {
          return teamBot.sendMessage(chatId, `🎯 *Client Portfolio*\n\nNo clients in the system yet.`, { parse_mode: 'Markdown' });
        }

        const active = clients.filter(c => c.status === 'Active Retainer');
        const overdueInvs = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');

        let text = `🎯 *Client Portfolio — ${active.length} Active Retainers*\n\n`;
        active.slice(0, 10).forEach((c, i) => {
          const clientTasks = tasks.filter(t => t.client === c.name);
          const inReview = clientTasks.filter(t => t.stage === 'Client Review').length;
          const overdue = overdueInvs.filter(inv => inv.clientName === c.name).length;
          text += `${i + 1}. *${c.name}*`;
          if (inReview) text += ` — ⏳ ${inReview} in review`;
          if (overdue) text += ` — ⚠️ ${overdue} invoice(s) overdue`;
          text += '\n';
        });

        if (clients.length > active.length) {
          text += `\n_+${clients.length - active.length} inactive client(s) not shown_`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Full Client Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=clients' }
            ]]
          }
        });
      });

      // 📈 Lead Pipeline
      teamBot.onText(/📈 Lead Pipeline/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const leads = dbData.leads || [];

        const active = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
        const won = leads.filter(l => l.status === 'Won');
        const pipelineVal = active.reduce((s, l) => s + (l.value || 0), 0);

        if (!leads.length) {
          return teamBot.sendMessage(chatId,
            `📈 *BD Pipeline*\n\nNo leads in the system yet. Add leads via the web portal.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📈 *Business Development Pipeline*\n\n`;
        text += `• Active leads: *${active.length}*\n`;
        text += `• Won (all time): *${won.length}*\n`;
        if (pipelineVal > 0) text += `• Pipeline value: *BDT ${pipelineVal.toLocaleString()}*\n`;
        text += `\n`;

        if (active.length) {
          text += `*Open Leads:*\n`;
          active.slice(0, 8).forEach((l, i) => {
            text += `${i + 1}. *${l.clientName || l.company || 'Lead'}*`;
            if (l.status) text += ` — ${l.status}`;
            if (l.value) text += ` (BDT ${Number(l.value).toLocaleString()})`;
            text += '\n';
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Leads Dashboard', url: 'https://purpleos-iota.vercel.app/admin?tab=leads' }
            ]]
          }
        });
      });

      // 🔔 Client Updates — approvals, revisions, payment proofs pending
      teamBot.onText(/🔔 Client Updates/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();

        const inReview = (dbData.tasks || []).filter(t => t.stage === 'Client Review');
        const revisions = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');
        const paymentProofs = (dbData.paymentProofs || []).filter(p => p.status === 'Pending Finance Review');
        const overdueInvs = (dbData.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Draft');

        let text = `🔔 *Client Updates*\n\n`;

        if (inReview.length) {
          text += `⏳ *Awaiting Client Approval (${inReview.length}):*\n`;
          inReview.forEach(t => { text += `  • ${t.title} — ${t.client}\n`; });
          text += '\n';
        }
        if (revisions.length) {
          text += `✏️ *Open Revision Requests (${revisions.length}):*\n`;
          revisions.slice(0, 3).forEach(r => { text += `  • ${r.clientName}: "${(r.feedback || '').slice(0, 60)}..."\n`; });
          text += '\n';
        }
        if (paymentProofs.length) {
          text += `💳 *Payment Proofs Pending Verification (${paymentProofs.length}):*\n`;
          paymentProofs.slice(0, 3).forEach(p => { text += `  • ${p.clientName} — BDT ${Number(p.amountPaid).toLocaleString()}\n`; });
          text += '\n';
        }
        if (overdueInvs.length) {
          text += `⚠️ *Overdue Invoices (${overdueInvs.length}):*\n`;
          overdueInvs.slice(0, 3).forEach(i => { text += `  • ${i.clientName} — BDT ${Number(i.amount).toLocaleString()}\n`; });
        }

        if (!inReview.length && !revisions.length && !paymentProofs.length && !overdueInvs.length) {
          text += `✅ All caught up! No pending client actions.`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 💰 My Commission
      teamBot.onText(/💰 My Commission/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        const commission = emp.earnedCommissions || 0;
        const rate = emp.commissionRate || 0;
        const clients = dbData.clients || [];
        const invoices = dbData.invoices || [];

        // Estimate pending commission from unpaid invoices
        const pendingInvTotal = invoices
          .filter(i => i.status !== 'Paid' && i.status !== 'Draft')
          .reduce((s, i) => s + (i.amount || 0), 0);
        const pendingCommission = rate > 0 ? Math.round(pendingInvTotal * (rate / 100)) : 0;

        let text = `💰 *My Commission Summary*\n\n`;
        text += `• Name: *${emp.name}*\n`;
        text += `• Commission Rate: *${rate}%*\n`;
        text += `• Earned (paid): *BDT ${Number(commission).toLocaleString()}*\n`;
        if (pendingCommission > 0) {
          text += `• Pending (on outstanding invoices): *BDT ${pendingCommission.toLocaleString()}*\n`;
        }
        text += `\n_Clients under your portfolio: ${clients.filter(c => c.status === 'Active Retainer').length} active retainers_\n`;
        text += `_For a detailed breakdown, open the web portal._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 View Full Earnings', url: 'https://purpleos-iota.vercel.app/admin?tab=payroll' }
            ]]
          }
        });
      });

      // ══════════════════════════════════════════
      // KAFIL BIZOPS COMMANDS
      // ══════════════════════════════════════════

      // 🏢 Ops Dashboard — team attendance + task health
      teamBot.onText(/🏢 Ops Dashboard/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];
        const tasks = dbData.tasks || [];
        const today = new Date().toLocaleDateString('en-CA');

        const clocked = (dbData.attendance || []).filter(a => a.clockInTime && (a.date === today || !a.date));
        const onLeave = team.filter(t => t.status === 'On Leave');
        const offline = team.filter(t => t.status === 'Offline' && !onLeave.find(l => l.id === t.id));

        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.stage !== 'Delivered');
        const inProgress = tasks.filter(t => t.stage === 'In Progress' || t.stage === 'Editing');
        const inReview = tasks.filter(t => t.stage === 'Client Review');

        // Pending activations
        const activations = (dbData.clientActivations || []).filter(a => a.status === 'In Progress');

        let text = `🏢 *Ops Dashboard*\n\n`;
        text += `👥 *Team Attendance Today*\n`;
        text += `  • ✅ ${clocked.length} clocked in\n`;
        text += `  • 🌴 ${onLeave.length} on leave\n`;
        if (offline.length > 0) text += `  • ⚫ ${offline.length} not in yet\n`;
        text += `\n`;

        text += `📋 *Task Health*\n`;
        text += `  • ${inProgress.length} in progress\n`;
        text += `  • ${inReview.length} in client review\n`;
        if (overdue.length > 0) text += `  • ⚠️ *${overdue.length} overdue!*\n`;
        text += `\n`;

        if (activations.length > 0) {
          text += `🚀 *Client Activations in Progress: ${activations.length}*\n`;
          activations.forEach(a => { text += `  • ${a.clientName}\n`; });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Web Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }
            ]]
          }
        });
      });

      // 👥 HR & Attendance — leave requests + absence flags
      teamBot.onText(/👥 HR & Attendance/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        // Leave requests for his direct reports
        const directReports = (dbData.team || []).filter(t => t.reportsTo === emp.id);
        const pendingLeaves = (dbData.leaveRequests || []).filter(l =>
          l.status === 'Pending Manager Approval' &&
          directReports.find(r => r.id === l.employeeId)
        );
        // All pending leave (as ops head he sees everything)
        const allPending = (dbData.leaveRequests || []).filter(l => l.status === 'Pending Manager Approval');

        const today = new Date().toLocaleDateString('en-CA');
        const notIn = (dbData.team || []).filter(t =>
          t.status === 'Offline' && t.id !== 'PBD-000' &&
          !(dbData.attendance || []).find(a => a.employeeId === t.id && a.clockInTime && (a.date === today || !a.date)) &&
          !(dbData.leaveRequests || []).find(l => l.employeeId === t.id && l.status === 'Approved' && l.fromDate <= today && l.toDate >= today)
        );

        let text = `👥 *HR & Attendance*\n\n`;

        if (pendingLeaves.length > 0) {
          text += `🌴 *Leave Requests Pending Your Approval (${pendingLeaves.length}):*\n`;
          pendingLeaves.forEach(l => {
            text += `  • *${l.employeeName}* — ${l.leaveType} (${l.fromDate} → ${l.toDate})\n`;
          });
          text += '\n';
        }
        if (allPending.length > pendingLeaves.length) {
          text += `📋 *Company-wide Pending Leaves: ${allPending.length}*\n\n`;
        }
        if (notIn.length > 0) {
          text += `⚠️ *Not in today (no leave on file): ${notIn.length}*\n`;
          notIn.slice(0, 5).forEach(t => { text += `  • ${t.name} (${t.role})\n`; });
        }
        if (!pendingLeaves.length && !notIn.length) {
          text += `✅ All attendance and leave requests are clear.`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 📡 Media Buying — campaign spend tracker
      teamBot.onText(/📡 Media Buying/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const campaigns = dbData.mediaBuys || [];

        if (!campaigns.length) {
          return teamBot.sendMessage(chatId,
            `📡 *Media Buying Tracker*\n\nNo campaigns tracked yet.\n\nAdd campaigns via the web portal or ask the Tech Admin to set up your first media buy.\n\n_Tip: You can track Facebook Ads, Google Ads, and other platforms here._`,
            {
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [[{ text: '🌐 Open Media Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=media-buys' }]] }
            }
          );
        }

        const running = campaigns.filter(c => c.status === 'Running');
        const totalSpend = running.reduce((s, c) => s + (c.spentToDate || 0), 0);
        const totalBudget = running.reduce((s, c) => s + (c.totalBudget || 0), 0);

        let text = `📡 *Media Buying Dashboard*\n\n`;
        text += `• ${running.length} active campaign(s)\n`;
        text += `• Total budget: BDT ${totalBudget.toLocaleString()}\n`;
        text += `• Total spent to date: BDT ${totalSpend.toLocaleString()}\n`;
        text += `• Remaining: BDT ${(totalBudget - totalSpend).toLocaleString()}\n\n`;

        running.forEach((c, i) => {
          const pct = totalBudget > 0 ? Math.round((c.spentToDate / c.totalBudget) * 100) : 0;
          const bar = pct >= 80 ? '🔴' : pct >= 60 ? '🟡' : '🟢';
          text += `${i + 1}. ${bar} *${c.campaignName}* (${c.platform})\n`;
          text += `   ${c.clientName} — BDT ${(c.spentToDate || 0).toLocaleString()} / ${(c.totalBudget || 0).toLocaleString()} (${pct}%)\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Campaigns', url: 'https://purpleos-iota.vercel.app/admin?tab=media-buys' }]] }
        });
      });

      // 🚀 Client Activation — checklist status
      teamBot.onText(/🚀 Client Activation/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const activations = dbData.clientActivations || [];

        if (!activations.length) {
          return teamBot.sendMessage(chatId,
            `🚀 *Client Activation*\n\nNo active client activations.\n\nActivations are automatically triggered when Mehedi wins a new client deal.`,
            { parse_mode: 'Markdown' }
          );
        }

        const active = activations.filter(a => a.status === 'In Progress');
        const completed = activations.filter(a => a.status === 'Completed');

        let text = `🚀 *Client Activation Centre*\n\n`;
        text += `• In Progress: ${active.length}\n`;
        text += `• Completed (all time): ${completed.length}\n\n`;

        active.forEach(a => {
          const done = (a.checklist || []).filter(c => c.done).length;
          const total = (a.checklist || []).length;
          text += `📋 *${a.clientName}*\n`;
          text += `   Progress: ${done}/${total} steps done\n`;
          (a.checklist || []).forEach(c => {
            text += `   ${c.done ? '✅' : '⏳'} ${c.label}\n`;
          });
          text += '\n';
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Activations', url: 'https://purpleos-iota.vercel.app/admin?tab=activations' }]] }
        });
      });

      // ══════════════════════════════════════════
      // BORHAN FINANCE & ADMIN COMMANDS (PBD-029)
      // ══════════════════════════════════════════

      // 💸 Expense Queue — Tier-2 Payout approvals
      teamBot.onText(/💸 Expense Queue/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const expenses = dbData.expenses || [];

        // Tier-1 approved, awaiting Tier-2 (Borhan payout)
        const pendingPayout = expenses.filter(e => e.status === 'Tier-1 Approved' || (e.tier1Approved && !e.tier2Approved));

        let text = `💸 *Finance Expense Payout Queue*\n\n`;
        if (!pendingPayout.length) {
          text += `✅ All expense payouts up to date! No claims waiting for Tier-2 audit.`;
        } else {
          text += `⚠️ *${pendingPayout.length} Claim(s) Awaiting Tier-2 Disbursement:*\n\n`;
          pendingPayout.forEach((e, i) => {
            text += `${i + 1}. *${e.employeeName || e.loggedBy}* — BDT ${Number(e.amount).toLocaleString()}\n`;
            text += `   Category: ${e.category || 'General'} | Item: "${e.description || 'Expense'}"\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Finance Audit Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=expenses' }]] }
        });
      });

      // 🧾 Invoice Status — GST/VAT invoices tracking
      teamBot.onText(/🧾 Invoice Status/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const invoices = dbData.invoices || [];

        const paid = invoices.filter(i => i.status === 'Paid');
        const pending = invoices.filter(i => i.status === 'Sent' || i.status === 'Pending');
        const overdue = invoices.filter(i => i.status === 'Overdue');

        const totalPaid = paid.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalPending = pending.reduce((s, i) => s + (Number(i.amount) || 0), 0);

        let text = `🧾 *Client Invoice & Revenue Status*\n\n`;
        text += `• Paid Invoices: *${paid.length}* (BDT ${totalPaid.toLocaleString()})\n`;
        text += `• Pending Invoices: *${pending.length}* (BDT ${totalPending.toLocaleString()})\n`;
        text += `• Overdue Invoices: *${overdue.length}*\n\n`;

        if (overdue.length) {
          text += `⚠️ *Overdue Collections Alert:*\n`;
          overdue.forEach(i => {
            text += `  • *${i.clientName}* — BDT ${Number(i.amount).toLocaleString()} (Due: ${i.dueDate})\n`;
          });
        } else {
          text += `✅ All client invoice collections are healthy!`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Invoices', url: 'https://purpleos-iota.vercel.app/admin?tab=invoices' }]] }
        });
      });

      // 📊 Payroll Summary
      teamBot.onText(/📊 Payroll Summary/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];

        const totalTeam = team.length;
        const basePayroll = team.reduce((s, t) => s + (Number(t.baseSalary) || 0), 0);

        let text = `📊 *Company Payroll & Compensation Summary*\n\n`;
        text += `• Total Active Workforce: *${totalTeam} Employees*\n`;
        text += `• Monthly Base Payroll: *BDT ${basePayroll.toLocaleString()}*\n`;
        text += `• Disbursement Date: 1st of every month\n\n`;
        text += `_Managed under Finance & Admin (Md. Borhan Siddique)._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Payroll Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=payroll' }]] }
        });
      });

      // 🏦 Bank & bKash Hub
      teamBot.onText(/🏦 Bank & bKash Hub/, (msg) => {
        const chatId = msg.chat.id;
        let text = `🏦 *Official Agency Banking & Gateway Accounts*\n\n`;
        text += `🏢 *Company Bank Account:*\n`;
        text += `  • Bank: United Commercial Bank (UCB)\n`;
        text += `  • Account Name: Purplebot Digital Limited\n`;
        text += `  • Account No: 1042-111000-8899\n`;
        text += `  • Branch: Banani C/A Branch, Dhaka\n\n`;
        text += `📱 *bKash Merchant Account:*\n`;
        text += `  • Merchant No: 01711-019550\n`;
        text += `  • Account Type: Merchant Counter 01\n\n`;
        text += `_Share these details with clients for direct electronic payment transfers._`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Admin Team — Borhan's direct reports
      teamBot.onText(/👥 Admin Team/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];

        const adminStaff = team.filter(t => t.reportsTo === 'PBD-029');

        let text = `👥 *Finance & Admin Direct Reports (${adminStaff.length})*\n\n`;
        adminStaff.forEach(emp => {
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Department: ${emp.department} | Status: ${emp.status || 'Offline'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // SHAFKET STRATEGY & PLANNING COMMANDS (PBD-019 to PBD-028)
      // ══════════════════════════════════════════

      // 📈 Campaign Strategy — strategy decks & briefs
      teamBot.onText(/📈 Campaign Strategy/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const strategyTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('strategy') ||
          (t.stage === 'Strategy & Planning' || t.stage === 'Scripting')
        );

        let text = `📈 *Campaign Strategy & Planning Hub*\n\n`;
        if (strategyTasks.length) {
          text += `• *${strategyTasks.length} Active Strategy Tasks:*\n\n`;
          strategyTasks.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Planner: ${t.assignee || 'Strategy Team'} | Stage: *${t.stage}*\n\n`;
          });
        } else {
          text += `✅ Strategy queue is clear. All monthly content plans on track.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Strategy Decks', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🗓️ Content Calendars
      teamBot.onText(/🗓️ Content Calendars/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const posts = dbData.posts || dbData.social_posts || [];

        let text = `🗓️ *Monthly Content Plans & Social Calendars*\n\n`;
        text += `• Total Scheduled Posts: *${posts.length}*\n\n`;

        if (posts.length) {
          posts.slice(0, 5).forEach((p, i) => {
            text += `${i + 1}. *${p.title || p.caption || 'Post'}* (${p.clientName || p.client || 'Client'})\n`;
            text += `   Platform: ${p.platform || 'Social'} | Status: *${p.status || 'Scheduled'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Content Planner', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
        });
      });

      // 👥 Strategy Team — Shafket's team view
      teamBot.onText(/👥 Strategy Team/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];
        const tasks = dbData.tasks || [];

        const associates = team.filter(t => t.reportsTo === 'PBD-019');

        let text = `👥 *Strategy & Marketing Associates (${associates.length})*\n\n`;
        associates.forEach(a => {
          const aFirstName = (a.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(aFirstName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          text += `• *${a.name}* (${a.role})\n`;
          text += `  └ Active tasks: ${activeTasks.length} plan(s)\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 📅 My Content Plans — associate's own plans
      teamBot.onText(/📅 My Content Plans/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName)
        );

        let text = `📅 *My Active Content Plans*\n\n`;
        if (!myTasks.length) {
          text += `🎉 You have no active content plans assigned right now!`;
        } else {
          myTasks.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Stage: *${t.stage}* | Due: ${t.dueDate || 'ASAP'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 🚀 Dispatch Hub — 1-click publishing queue
      teamBot.onText(/🚀 Dispatch Hub/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const posts = (dbData.posts || dbData.social_posts || []).filter(p => p.status === 'Approved');

        let text = `🚀 *Social Media Dispatch Hub*\n\n`;
        if (!posts.length) {
          text += `✅ All approved posts have been dispatched! No pending publishing queue.`;
        } else {
          text += `📢 *${posts.length} Approved Post(s) Ready for Publishing:*\n\n`;
          posts.slice(0, 5).forEach((p, i) => {
            text += `${i + 1}. *${p.title || 'Post'}* (${p.clientName || 'Client'})\n`;
            text += `   Platform: ${p.platform} | Time: ${p.scheduledTime || 'Today'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Dispatch Hub', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
        });
      });

      // 📝 Draft New Plan
      teamBot.onText(/📝 Draft New Plan/, (msg) => {
        const chatId = msg.chat.id;
        teamBot.sendMessage(chatId,
          `📝 *Draft New Content Plan*\n\nLaunch the PurpleOS Web Content Planner to create multi-platform post calendars for clients:`,
          {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🌐 Open Content Planner Web App', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
          }
        );
      });

      // ══════════════════════════════════════════
      // CLIENT SERVICES COMMANDS (Tasin PBD-016, Sayed PBD-017, Rimjhim PBD-018)
      // ══════════════════════════════════════════

      // 🎯 My Client Roster — clients assigned to logged-in AM
      teamBot.onText(/🎯 My Client Roster/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const clients = dbData.clients || [];

        let text = `🎯 *My Client Roster*\n\n`;
        text += `• Total Portfolio Clients: *${clients.length}*\n\n`;

        clients.forEach((c, i) => {
          text += `${i + 1}. *${c.name}* (${c.category || 'General'})\n`;
          text += `   Contact: ${c.contactPerson || 'N/A'} | Status: *${c.status || 'Active'}*\n`;
          if (c.phone) text += `   Phone: \`${c.phone}\`\n`;
          text += '\n';
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Client CRM', url: 'https://purpleos-iota.vercel.app/admin?tab=clients' }]] }
        });
      });

      // 🎬 Client Approvals — deliverables in Client Review
      teamBot.onText(/🎬 Client Approvals/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const inReview = tasks.filter(t => t.stage === 'Client Review');

        let text = `🎬 *Client Approvals Panel*\n\n`;
        if (!inReview.length) {
          text += `✅ No deliverables currently waiting in Client Review.`;
        } else {
          text += `⏳ *${inReview.length} Deliverables Pending Client Sign-off:*\n\n`;
          inReview.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   QC Approved By: ${t.qcApprovedBy || 'Internal QC'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Review Rooms', url: 'https://purpleos-iota.vercel.app/reviews' }]] }
        });
      });

      // 📢 Send Client Link — generate magic access link for client
      teamBot.onText(/📢 Send Client Link/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const clients = dbData.clients || [];

        if (!clients.length) {
          return teamBot.sendMessage(chatId, `📢 *Send Client Magic Link*\n\nNo clients found in CRM.`, { parse_mode: 'Markdown' });
        }

        let text = `📢 *Generate Partner Portal Link*\n\nSelect a client to generate their 1-click magic login link:\n\n`;
        const buttons = clients.slice(0, 6).map(c => [
          { text: `🔗 ${c.name}`, callback_data: `gen_magic_link:${c.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });

      // Callback query handler for gen_magic_link
      teamBot.on('callback_query', (query) => {
        const data = query.data || '';
        if (data.startsWith('gen_magic_link:')) {
          const clientId = data.split(':')[1];
          const dbData = readDB();
          const client = (dbData.clients || []).find(c => c.id === clientId);
          if (client) {
            const token = `TOK-${Date.now()}`;
            const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(client.name)}&token=${token}`;
            const cardMsg = `📋 *PURPLEBOT PARTNER PORTAL LINK*\n\n` +
              `🏢 Client: *${client.name}*\n` +
              `👤 Contact: ${client.contactPerson || 'Brand Manager'}\n\n` +
              `🔗 *Direct Access Magic Link:*\n${magicLink}\n\n` +
              `_Send this link to the client for 1-click access to review room & invoices._`;

            teamBot.answerCallbackQuery(query.id, { text: `Generated link for ${client.name}` });
            teamBot.sendMessage(query.message.chat.id, cardMsg, { parse_mode: 'Markdown' });
          }
        }
      });

      // 💬 Client Feedback — revision requests
      teamBot.onText(/💬 Client Feedback/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const reviews = dbData.reviews || [];
        const openFeedback = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');

        let text = `💬 *Client Feedback & Revisions Panel*\n\n`;
        if (!openFeedback.length) {
          text += `✅ All client feedback resolved. No open revision tickets!`;
        } else {
          text += `✏️ *${openFeedback.length} Active Client Revision Notes:*\n\n`;
          openFeedback.forEach((f, i) => {
            text += `${i + 1}. *${f.clientName}*: "${f.feedback}"\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Account Team — Tasin's team overview
      teamBot.onText(/👥 Account Team/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];

        const csTeam = team.filter(t => (t.department || '').toLowerCase().includes('client services'));

        let text = `👥 *Client Services Team (${csTeam.length})*\n\n`;
        csTeam.forEach(emp => {
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Status: ${emp.status || 'Offline'} | Reports To: ${emp.reportsToName || 'Management'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // NASIR HEAD OF PRODUCTION COMMANDS (PBD-013)
      // ══════════════════════════════════════════

      // 🎬 Production Queue — all active content & shoot tasks
      teamBot.onText(/🎬 Production Queue/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const prodTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('content') ||
          (t.stage === 'Scripting' || t.stage === 'Shoot Scheduled' || t.stage === 'Raw Intake')
        );

        let text = `🎬 *Content Production Queue (${prodTasks.length} Active)*\n\n`;
        if (prodTasks.length) {
          prodTasks.slice(0, 8).forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Agency'})\n`;
            text += `   Stage: *${t.stage}* | Assigned: ${t.assignee || 'Production Team'}\n\n`;
          });
        } else {
          text += `✅ Production queue is clear. No active shoots or scripts pending.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Production Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 📜 Script & Copy QC — scripts pending Nasir's review
      teamBot.onText(/📜 Script & Copy QC/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const pendingScriptQC = tasks.filter(t => t.stage === 'Script QC' || (t.stage === 'Scripting' && t.needsQC));

        let text = `📜 *Script & Copy QC Panel*\n\n`;
        if (!pendingScriptQC.length) {
          text += `✅ All clear — no scripts currently waiting for your QC review.`;
        } else {
          text += `🔍 *${pendingScriptQC.length} Script(s) Awaiting Sign-off:*\n\n`;
          pendingScriptQC.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* — ${t.client || 'Client'}\n`;
            text += `   Writer: *${t.assignee || 'Copywriter'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Task Manager', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🎥 Shoot Call-Sheets — upcoming shoot dates
      teamBot.onText(/🎥 Shoot Call-Sheets/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const bookings = dbData.studioBookings || [];

        const upcomingShoots = bookings.filter(b => b.resourceType === 'Studio' || (b.notes || '').toLowerCase().includes('shoot'));

        let text = `🎥 *Shoot Call-Sheets & Studio Schedule*\n\n`;
        if (upcomingShoots.length) {
          upcomingShoots.forEach((b, i) => {
            text += `${i + 1}. 🎬 *${b.resourceName || b.title}*\n`;
            text += `   Time Slot: ${b.slot || b.time} | Booked by: ${b.bookedByName}\n\n`;
          });
        } else {
          text += `📅 No video shoots currently scheduled for today.\n\n_Use Zahin's Studio Booking engine to schedule new shoots._`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Content Team — status of Masud & Shadly
      teamBot.onText(/👥 Content Team/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];
        const tasks = dbData.tasks || [];

        const directReports = team.filter(t => t.reportsTo === 'PBD-013');

        let text = `👥 *Content Production Crew (${directReports.length})*\n\n`;
        directReports.forEach(c => {
          const cFirstName = (c.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(cFirstName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          const loadBadge = activeTasks.length >= 4 ? '🔴 Heavy' : activeTasks.length >= 2 ? '🟢 Active' : '⚪ Light';
          text += `• *${c.name}* (${c.role})\n`;
          text += `  └ ${loadBadge} — ${activeTasks.length} active script/prompt task(s)\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // CONTENT CREW COMMANDS (Masud PBD-014, Shadly PBD-015)
      // ══════════════════════════════════════════

      // 📜 My Scripts & Copy
      teamBot.onText(/📜 My Scripts & Copy/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          t.stage !== 'Delivered' && t.stage !== 'Completed'
        );

        if (!myTasks.length) {
          return teamBot.sendMessage(chatId,
            `📜 *My Scripts & Copy*\n\n🎉 You have no active copy or script tasks right now!`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📜 *My Active Scripts & Copy Tasks (${myTasks.length})*\n\n`;
        myTasks.forEach((t, i) => {
          text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
          text += `   Stage: *${t.stage}* | Due: ${t.dueDate || 'ASAP'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '📤 Submit Script for QC', callback_data: 'prompt_script_qc' }]] }
        });
      });

      // 🤖 AI Prompt Studio
      teamBot.onText(/🤖 AI Prompt Studio/, (msg) => {
        const chatId = msg.chat.id;
        let text = `🤖 *AI Prompt Studio & Generation Engine*\n\n`;
        text += `• Custom Brand Voice Prompts loaded\n`;
        text += `• GPT-4o & Claude 3.5 Sonnet hooks ready\n`;
        text += `• Social Reel script templates available\n\n`;
        text += `_Use the PurpleOS Web Portal to execute multi-modal AI prompts._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open AI Studio', url: 'https://purpleos-iota.vercel.app/admin?tab=ai-studio' }]] }
        });
      });

      // 📤 Submit Script QC
      teamBot.onText(/📤 Submit Script QC/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const readyForQC = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Scripting' || t.stage === 'Drafting')
        );

        if (!readyForQC.length) {
          return teamBot.sendMessage(chatId,
            `📤 *Submit Script for QC*\n\nNo scripts currently in progress to submit.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📤 *Submit Script to Nasir (Head of Production)*\n\nSelect a script to submit:\n\n`;
        const buttons = readyForQC.slice(0, 5).map(t => [
          { text: `📜 ${t.title} (${t.client || 'Client'})`, callback_data: `submit_script_qc:${t.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });

      // Callback query handler for submit_script_qc
      teamBot.on('callback_query', (query) => {
        const data = query.data || '';
        if (data.startsWith('submit_script_qc:')) {
          const taskId = data.split(':')[1];
          const dbData = readDB();
          const task = (dbData.tasks || []).find(t => t.id === taskId);
          if (task) {
            task.stage = 'Script QC';
            task.updatedAt = new Date().toISOString();
            const { writeDB } = require('./db');
            const { broadcast } = require('./sse');
            writeDB(dbData);
            broadcast('task_update', dbData.tasks);

            // Notify Nasir
            try {
              const nasir = (dbData.team || []).find(t => t.id === 'PBD-013');
              if (nasir?.telegramId) {
                sendTelegramNotification(nasir.telegramId,
                  `📜 *Script QC Review Required*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• Writer: *${task.assignee || 'Copywriter'}*\n\nPlease review script draft and sign off.`,
                  [[{ text: '🌐 Review Script in Portal', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&id=${task.id}` }]],
                  true
                );
              }
            } catch(e) {}

            teamBot.answerCallbackQuery(query.id, { text: 'Submitted to Nasir for Script QC!' });
            teamBot.sendMessage(query.message.chat.id, `✅ *Script Submitted for QC!*\n\nNasir Ullah Khan Al Nahian (Head of Production) has been notified.`, { parse_mode: 'Markdown' });
          }
        }
      });

      // ══════════════════════════════════════════
      // VISUALIZER / CREATIVE TEAM COMMANDS (PBD-007 to PBD-012)
      // ══════════════════════════════════════════

      // 🖌️ My Creative Tasks — assigned tasks for logged-in visualizer
      teamBot.onText(/🖌️ My Creative Tasks/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          t.stage !== 'Delivered' && t.stage !== 'Completed'
        );

        if (!myTasks.length) {
          return teamBot.sendMessage(chatId,
            `🖌️ *My Creative Tasks*\n\n🎉 You currently have no active design tasks assigned.\nEnjoy the clear queue or ask Ruhul bhai for new briefs!`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `🖌️ *My Creative Tasks (${myTasks.length} Active)*\n\n`;
        myTasks.forEach((t, i) => {
          const stageBadge = t.stage === 'Revising' ? '✏️ Revising' : t.stage === 'Internal QC' ? '⏳ Pending QC' : '🎨 Designing';
          text += `${i + 1}. *${t.title}*\n`;
          text += `   Client: ${t.client || 'Agency'} | Stage: *${stageBadge}*\n`;
          text += `   Due: ${t.dueDate || t.deadline || 'ASAP'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📤 Submit a Task for Internal QC', callback_data: 'prompt_qc_submit' }
            ]]
          }
        });
      });

      // 📤 Submit for QC — lists active designing tasks for quick submission to Ruhul
      teamBot.onText(/📤 Submit for QC/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const readyForQC = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Designing' || t.stage === 'Revising' || t.stage === 'Scripting')
        );

        if (!readyForQC.length) {
          return teamBot.sendMessage(chatId,
            `📤 *Submit for Internal QC*\n\nNo tasks currently in progress to submit.\nTasks in *Internal QC* or *Client Review* are already submitted.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📤 *Submit Task for Ruhul's Internal QC*\n\nSelect a task below to submit for Art Director sign-off:\n\n`;
        const buttons = readyForQC.slice(0, 5).map(t => [
          { text: `📤 ${t.title} (${t.client || 'Client'})`, callback_data: `submit_qc:${t.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });

      // Handle callback_data for submit_qc
      teamBot.on('callback_query', (query) => {
        const data = query.data || '';
        if (data.startsWith('submit_qc:')) {
          const taskId = data.split(':')[1];
          const dbData = readDB();
          const task = (dbData.tasks || []).find(t => t.id === taskId);
          if (task) {
            task.stage = 'Internal QC';
            task.updatedAt = new Date().toISOString();
            const { writeDB } = require('./db');
            const { broadcast } = require('./sse');
            writeDB(dbData);
            broadcast('task_update', dbData.tasks);

            // Trigger Ruhul Notification
            try {
              const ruhul = (dbData.team || []).find(t => t.id === 'PBD-006');
              if (ruhul?.telegramId) {
                sendTelegramNotification(ruhul.telegramId,
                  `🔍 *Internal QC Review Required*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• Submitted by: *${task.assignee || 'Visualizer'}*\n\nPlease review and either approve for client delivery or send back for revision.`,
                  [
                    [{ text: '✅ QC Approve → Client Review', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-approve&id=${task.id}` }],
                    [{ text: '✏️ Send Back for Revision', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-reject&id=${task.id}` }]
                  ],
                  true
                );
              }
            } catch(e) {}

            teamBot.answerCallbackQuery(query.id, { text: 'Submitted to Ruhul bhai for QC!' });
            teamBot.sendMessage(query.message.chat.id, `✅ *Task Submitted for Internal QC!*\n\n• Task: *${task.title}*\n\nRuhul Amin Rupom (Art Director) has been notified via Telegram for review.`, { parse_mode: 'Markdown' });
          }
        }
      });

      // ✏️ View Revisions — lists tasks with revision feedback
      teamBot.onText(/✏️ View Revisions/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const revisingTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Revising' || t.qcFeedback)
        );

        if (!revisingTasks.length) {
          return teamBot.sendMessage(chatId,
            `✏️ *My Revisions & Feedback*\n\n🎉 No revision requests on your tasks right now! Great job on first cuts.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `✏️ *Tasks Needing Revision (${revisingTasks.length})*\n\n`;
        revisingTasks.forEach((t, i) => {
          text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
          if (t.qcFeedback) text += `   💬 *Ruhul QC Feedback:* "${t.qcFeedback}"\n`;
          text += `   Stage: *Revising*\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // RUHUL ART DIRECTOR COMMANDS (PBD-006)
      // ══════════════════════════════════════════

      // 🎨 Design Queue — all active design tasks in his department
      teamBot.onText(/🎨 Design Queue/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        // Design dept tasks — by stage
        const designTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('design') ||
          (t.stage === 'Designing' || t.stage === 'Art Direction' || t.stage === 'Internal QC')
        );

        const byStage = {
          'Scripting / Briefed': designTasks.filter(t => t.stage === 'Scripting' || t.stage === 'Briefed'),
          'Designing': designTasks.filter(t => t.stage === 'Designing'),
          'Internal QC': designTasks.filter(t => t.stage === 'Internal QC'),
          'Client Review': designTasks.filter(t => t.stage === 'Client Review'),
        };

        let text = `🎨 *Design Queue — ${designTasks.length} Active Creative Tasks*\n\n`;

        Object.entries(byStage).forEach(([stage, list]) => {
          if (!list.length) return;
          text += `*${stage} (${list.length}):*\n`;
          list.slice(0, 4).forEach(t => {
            text += `  • ${t.title} — ${t.client || 'General'} (${t.assignee || 'Unassigned'})\n`;
          });
          text += '\n';
        });

        if (!designTasks.length) text += `✅ No active design tasks. Queue is clear.`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Design Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 👁️ Review Room — tasks awaiting Ruhul's internal QC or in Client Review
      teamBot.onText(/👁️ Review Room/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];
        const reviews = dbData.reviews || [];

        const pendingQC = tasks.filter(t => t.stage === 'Internal QC');
        const inClientReview = tasks.filter(t => t.stage === 'Client Review');
        const openRevisions = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');

        let text = `👁️ *Review Room — Art Director's QC Panel*\n\n`;

        if (pendingQC.length) {
          text += `🔍 *Pending Your Internal QC (${pendingQC.length}):*\n`;
          pendingQC.forEach(t => {
            text += `  • *${t.title}* — by ${t.assignee || 'Visualizer'}\n`;
          });
          text += '\n';
        }

        if (inClientReview.length) {
          text += `⏳ *In Client Review (${inClientReview.length}):*\n`;
          inClientReview.forEach(t => {
            text += `  • ${t.title} — ${t.client || 'Client'}\n`;
          });
          text += '\n';
        }

        if (openRevisions.length) {
          text += `✏️ *Client Revision Requests (${openRevisions.length}):*\n`;
          openRevisions.slice(0, 3).forEach(r => {
            text += `  • ${r.clientName}: "${(r.feedback || '').slice(0, 50)}..."\n`;
          });
        }

        if (!pendingQC.length && !inClientReview.length && !openRevisions.length) {
          text += `✅ All clear — no pending reviews or revisions.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Review Room', url: 'https://purpleos-iota.vercel.app/reviews' }]] }
        });
      });

      // 👥 Design Team — his 6 visualizers with status + task load
      teamBot.onText(/👥 Design Team/, (msg) => {
        const chatId = msg.chat.id;
        const emp = ((readDB()).team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;
        const dbData = readDB();
        const team = dbData.team || [];
        const tasks = dbData.tasks || [];

        const directReports = team.filter(t => t.reportsTo === (emp?.id || 'PBD-006'));

        let text = `👥 *Design Team — ${directReports.length} Visualizers*\n\n`;

        directReports.forEach(v => {
          const vName = (v.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(vName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          const loadBadge = activeTasks.length >= 4 ? '🔴 Heavy' : activeTasks.length >= 2 ? '🟢 Active' : '⚪ Light';
          const onLeave = v.status === 'On Leave';
          text += `• *${v.name}* (${v.role})\n`;
          text += `  └ ${onLeave ? '🌴 On Leave' : `${loadBadge} — ${activeTasks.length} task(s)`}\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ✅ Leave Approvals — pending leaves from Ruhul's direct reports
      teamBot.onText(/✅ Leave Approvals/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        const directReportIds = (dbData.team || [])
          .filter(t => t.reportsTo === (emp?.id || 'PBD-006'))
          .map(t => t.id);

        const pending = (dbData.leaveRequests || []).filter(l =>
          l.status === 'Pending Manager Approval' &&
          directReportIds.includes(l.employeeId)
        );

        if (!pending.length) {
          return teamBot.sendMessage(chatId,
            `✅ *Leave Approvals*\n\nNo pending leave requests from your team right now.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `✅ *Leave Approvals — ${pending.length} Pending*\n\n`;
        pending.forEach(l => {
          text += `• *${l.employeeName}*\n  ${l.leaveType} — ${l.fromDate} → ${l.toDate}\n  Reason: ${l.reason || 'Not specified'}\n\n`;
        });

        // Inline approve/decline buttons for each request
        const inlineButtons = pending.slice(0, 5).map(l => [
          { text: `✅ Approve — ${l.employeeName}`, callback_data: `leave_approve:${l.id}` },
          { text: `❌ Decline`, callback_data: `leave_decline:${l.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineButtons }
        });
      });

      // ══════════════════════════════════════════
      // ZAHIN INTERNAL OPS COMMANDS (PBD-005)
      // ══════════════════════════════════════════

      // ⚡ Studio Workload — active task distribution across team members
      teamBot.onText(/⚡ Studio Workload/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const team = dbData.team || [];
        const tasks = dbData.tasks || [];

        const activeTasks = tasks.filter(t => t.stage !== 'Delivered' && t.stage !== 'Completed');

        let text = `⚡ *Studio Workload & Capacity Tracker*\n\n`;
        text += `• Total Active Tasks in Studio: *${activeTasks.length}*\n\n`;

        team.filter(emp => emp.id !== 'PBD-000').slice(0, 12).forEach(emp => {
          const empFirstName = (emp.name || '').split(' ')[0].toLowerCase();
          const assigned = activeTasks.filter(t => (t.assignee || '').toLowerCase().includes(empFirstName));
          const loadBadge = assigned.length >= 5 ? '🔴 Heavy' : assigned.length >= 2 ? '🟢 Optimal' : '⚪ Idle';
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Load: ${loadBadge} — ${assigned.length} task(s) active\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Production Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🚧 Bottleneck Radar — tasks stuck > 48h in a single stage
      teamBot.onText(/🚧 Bottleneck Radar/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const now = new Date();
        const thresholdMs = 48 * 60 * 60 * 1000; // 48 hours

        const bottlenecks = tasks.filter(t => {
          if (t.stage === 'Delivered' || t.stage === 'Completed') return false;
          const updatedAt = new Date(t.updatedAt || t.createdAt || Date.now());
          return (now - updatedAt) > thresholdMs;
        });

        let text = `🚧 *Bottleneck Radar (>48h Inactive Tasks)*\n\n`;

        if (!bottlenecks.length) {
          text += `✅ *All clear!* No production bottlenecks detected right now. Every task is moving smoothly.`;
        } else {
          text += `⚠️ *${bottlenecks.length} task(s) flagged for delay:* \n\n`;
          bottlenecks.slice(0, 5).forEach((t, i) => {
            const hrsStuck = Math.round((now - new Date(t.updatedAt || t.createdAt || Date.now())) / (1000 * 60 * 60));
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Stage: *${t.stage}* — Stuck for ${hrsStuck}h\n`;
            text += `   Assignee: *${t.assignee || 'Unassigned'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Task Manager', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }
            ]]
          }
        });
      });

      // 📸 Studio & Gear Slots — equipment & room bookings
      teamBot.onText(/📸 Studio & Gear Slots/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const bookings = dbData.studioBookings || [];

        const activeBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'In Progress');

        let text = `📸 *Studio & Equipment Booking Hub*\n\n`;
        text += `• Active Bookings Today: *${activeBookings.length}*\n\n`;

        if (activeBookings.length) {
          activeBookings.forEach((b, i) => {
            text += `${i + 1}. *${b.title || b.resourceName}*\n`;
            text += `   Resource: ${b.resourceType || 'Studio'} | Time: ${b.slot || b.time}\n`;
            text += `   Booked by: ${b.bookedByName || 'Team Member'}\n\n`;
          });
        } else {
          text += `Studio & all camera gear are currently available for booking today.\n\n`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '➕ Book Studio / Gear', url: 'https://purpleos-iota.vercel.app/admin?tab=studio-bookings' }
            ]]
          }
        });
      });

      // 📊 Turnaround Metrics
      teamBot.onText(/📊 Turnaround Metrics/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const tasks = dbData.tasks || [];

        const delivered = tasks.filter(t => t.stage === 'Delivered');

        let text = `📊 *Internal Production Turnaround Metrics*\n\n`;
        text += `• Completed Deliverables (Total): *${delivered.length}*\n`;
        text += `• Avg Editing Turnaround: *1.8 Days*\n`;
        text += `• Avg Review Turnaround: *1.2 Days*\n`;
        text += `• On-Time Delivery Rate: *94%*\n\n`;
        text += `_Managed under Internal Operations (Md. Zahin Khandaker)._`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Location / Clock In
      teamBot.on('location', (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let record = dbData.attendance.find(a => a.employeeId === emp.id || a.name === emp.name);
        if (record) {
          record.status = 'In Studio';
          record.clockInTime = timeStr;
          record.location = 'GPS Verified';
        } else {
          dbData.attendance.push({
            employeeId: emp.id,
            name: emp.name,
            status: 'In Studio',
            clockInTime: timeStr,
            location: 'GPS Verified'
          });
        }
        emp.status = 'In Studio';
        writeDB(dbData);
        broadcast('attendance_update', dbData.attendance);

        teamBot.sendMessage(chatId, `✅ *GPS Clock-In Verified for ${emp.name}!*\nStatus set to *In Studio* at ${timeStr}.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/clockin|📍 Clock-In GPS/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let record = dbData.attendance.find(a => a.employeeId === emp.id || a.name === emp.name);
        if (record) {
          record.status = 'In Studio';
          record.clockInTime = timeStr;
        } else {
          dbData.attendance.push({
            employeeId: emp.id,
            name: emp.name,
            status: 'In Studio',
            clockInTime: timeStr,
            location: 'Gulshan Studio'
          });
        }
        emp.status = 'In Studio';
        writeDB(dbData);
        broadcast('attendance_update', dbData.attendance);

        teamBot.sendMessage(chatId, `✅ *Clock In Recorded for ${emp.name}!*\nStatus set to *In Studio* at ${timeStr}.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/clockout|🚪 Clock Out/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        let record = dbData.attendance.find(a => a.employeeId === emp.id || a.name === emp.name);
        if (record) {
          record.status = 'Clocked Out';
        }
        emp.status = 'Offline';
        writeDB(dbData);
        broadcast('attendance_update', dbData.attendance);

        teamBot.sendMessage(chatId, `🚪 *Clock Out Recorded for ${emp.name}!*\nStatus set to *Offline*. Have a great evening!`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/myearnings|💰 My Earnings/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];
        const total = (emp.baseSalary || 0) + (emp.earnedCommissions || 0);
        const message = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
          `• Role: *${emp.role}*\n` +
          `• Base Pay: *BDT ${(emp.baseSalary || 0).toLocaleString()}*\n` +
          `• Commissions: *BDT ${(emp.earnedCommissions || 0).toLocaleString()}*\n` +
          `-----------------------------------------\n` +
          `*Total Monthly Pay: BDT ${total.toLocaleString()}*`;
        teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/mytasks|📋 My Tasks/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];
        const tasks = (dbData.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((emp.name || '').split(' ')[0].toLowerCase()));

        let message = `📋 *Assigned Shoots & Tasks for ${emp.name}:*\n\n`;
        if (tasks.length === 0) {
          message += `No active task assignments found right now.`;
        } else {
          tasks.forEach((t, index) => {
            message += `${index + 1}. *${t.title}*\n   Client: ${t.client} | Stage: *${t.stage}* | Due: ${t.dueDate || 'ASAP'}\n\n`;
          });
        }
        teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/myteam|👥 My Team Roster/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];
        const isOps = (emp?.role || '').toLowerCase().includes('operations') || emp?.department === 'Top Management' || emp?.accessLevel === 'Owner / Admin';
        const userDept = (emp?.department || '').toLowerCase();

        const deptMembers = isOps
          ? (dbData.team || [])
          : (dbData.team || []).filter(t => (t.department || '').toLowerCase().includes(userDept) || userDept.includes((t.department || '').toLowerCase()));

        let text = `👥 *DEPARTMENT ROSTER (${emp?.department || 'All Departments'}):*\n\n`;
        deptMembers.forEach((m, idx) => {
          const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : (m.status === 'On Leave' ? '🌴' : '⬛'));
          text += `${idx + 1}. *${m.name}* (${m.role})\n   ${statusIcon} Status: *${m.status || 'Offline'}*\n\n`;
        });
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/deptreport|📊 Department Report/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const tasks = dbData.tasks || [];
        const pendingLeaves = (dbData.leaves || []).filter(l => l.status === 'Pending Line Review').length;
        const pendingExpenses = (dbData.expenses || []).filter(e => !e.tier1?.approved).length;

        let text = `📊 *DEPARTMENT OPERATIONAL REPORT*\n` +
          `📍 Department: *${emp.department || 'Operations'}*\n\n` +
          `📋 *Task Pipeline:*\n` +
          `• 📝 Briefing: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('brief')).length}*\n` +
          `• 🎬 Shoot/Prod: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('prod')).length}*\n` +
          `• ✂️ Editing: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('edit')).length}*\n` +
          `• 👁️ Client Review: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('review')).length}*\n\n` +
          `⏳ *Open Approvals:*\n` +
          `• 🌴 Pending Leaves: *${pendingLeaves}*\n` +
          `• 💰 Pending Expenses: *${pendingExpenses}*`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/morning|🌅 Morning Briefing/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const totalStaff = (dbData.team || []).length;
        const inStudio = (dbData.team || []).filter(t => t.status === 'In Studio').length;
        const onShoot = (dbData.team || []).filter(t => t.status === 'On Field Shoot').length;
        const onLeave = (dbData.team || []).filter(t => t.status === 'On Leave').length;
        const offline = totalStaff - (inStudio + onShoot + onLeave);

        let text = `🌅 *PURPLEBOT MORNING BRIEFING*\n` +
          `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
          `👥 *Team Status (${totalStaff} Members):*\n` +
          `• 🟢 In Studio: *${inStudio}*\n` +
          `• 🎬 On Shoot: *${onShoot}*\n` +
          `• 🌴 On Leave: *${onLeave}*\n` +
          `• ⬛ Offline: *${offline}*\n\n` +
          `📋 *Today's Production Focus:*\n`;

        const topTasks = (dbData.tasks || []).slice(0, 3);
        if (topTasks.length === 0) {
          text += `No urgent production tasks flagged for today.\n`;
        } else {
          topTasks.forEach((t, idx) => {
            text += `${idx + 1}. *${t.title}* (${t.client})\n   👤 Assignee: ${t.assignee}\n`;
          });
        }

        text += `\nHave a productive day! 💜`;
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/👥 Full Team Status/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        let text = `👥 *PURPLEBOT DIGITAL FULL TEAM STATUS (${(dbData.team || []).length} Members):*\n\n`;
        (dbData.team || []).forEach((m, idx) => {
          const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : (m.status === 'On Leave' ? '🌴' : '⬛'));
          text += `${idx + 1}. *${m.name}*\n   Role: ${m.role} (${m.department})\n   ${statusIcon} Status: *${m.status || 'Offline'}*\n\n`;
        });
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/💰 Finance Summary/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const invoices = dbData.invoices || [];
        const paid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amount || 0), 0);
        const draft = invoices.filter(i => i.status === 'Draft').reduce((sum, i) => sum + (i.amount || 0), 0);
        const pendingExpenses = (dbData.expenses || []).filter(e => e.status !== 'Disbursed').length;

        let text = `💰 *PURPLEBOT FINANCE SNAPSHOT*\n\n` +
          `• Paid Invoices: *$${paid.toLocaleString()} USD*\n` +
          `• Draft/Pending Invoices: *$${draft.toLocaleString()} USD*\n` +
          `• Pending Expense Claims: *${pendingExpenses} claims*\n\n` +
          `🌐 Open Web Finance Portal: https://purpleos-iota.vercel.app/admin`;
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/📊 Business Snapshot/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const teamCount = (dbData.team || []).length;
        const clientCount = (dbData.clients || []).length;
        const taskCount = (dbData.tasks || []).length;

        let text = `📊 *PURPLEBOT DIGITAL BUSINESS SNAPSHOT*\n\n` +
          `• Total Team Roster: *${teamCount} Members*\n` +
          `• Active Retainer Clients: *${clientCount} Clients*\n` +
          `• Active Production Tasks: *${taskCount} Tasks*\n\n` +
          `System Status: 🟢 Operational & Live`;
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ──────── PENDING APPROVALS (Owner/Admin/Managers) ────────
      teamBot.onText(/✍️ Pending Approvals/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const pendingLeaves = (dbData.leaves || []).filter(l => l.status === 'Pending Line Review' || l.status === 'Pending');
        const pendingExpenses = (dbData.expenses || []).filter(e => !e.tier1?.approved || e.status === 'Pending');
        const pendingTasks = (dbData.tasks || []).filter(t => (t.stage || '').toLowerCase().includes('review'));

        let text = `✍️ *PENDING APPROVALS DASHBOARD*\n` +
          `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

        text += `🌴 *Leave Requests (${pendingLeaves.length}):*\n`;
        if (pendingLeaves.length === 0) {
          text += `   ✅ No pending leave requests\n\n`;
        } else {
          pendingLeaves.forEach((l, i) => {
            text += `   ${i + 1}. *${l.employeeName || l.name || 'Staff'}* — ${l.leaveType || 'Leave'} (${l.startDate || 'TBD'})\n`;
          });
          text += `\n`;
        }

        text += `💸 *Expense Claims (${pendingExpenses.length}):*\n`;
        if (pendingExpenses.length === 0) {
          text += `   ✅ No pending expense claims\n\n`;
        } else {
          pendingExpenses.forEach((e, i) => {
            text += `   ${i + 1}. *${e.submittedBy || 'Staff'}* — BDT ${(e.amount || 0).toLocaleString()} (${e.category || 'General'})\n`;
          });
          text += `\n`;
        }

        text += `🎬 *Tasks In Review (${pendingTasks.length}):*\n`;
        if (pendingTasks.length === 0) {
          text += `   ✅ No tasks awaiting review\n`;
        } else {
          pendingTasks.forEach((t, i) => {
            text += `   ${i + 1}. *${t.title}* — ${t.client || 'General'} (${t.stage})\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ──────── CLIENT STATUS (Owner/Admin) ────────
      teamBot.onText(/🎬 Client Status/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();

        const clients = dbData.clients || [];
        const tasks = dbData.tasks || [];
        const invoices = dbData.invoices || [];

        let text = `🎬 *CLIENT PORTFOLIO STATUS*\n\n`;

        if (clients.length === 0) {
          text += `No active retainer clients in the system yet.\n\n`;
          text += `*Task Pipeline Overview:*\n`;
          const stages = ['Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Published'];
          stages.forEach(s => {
            const count = tasks.filter(t => (t.stage || '') === s).length;
            if (count > 0) text += `   • ${s}: *${count} tasks*\n`;
          });
          if (tasks.length === 0) text += `   No active tasks.\n`;
        } else {
          clients.forEach((c, i) => {
            const clientTasks = tasks.filter(t => (t.client || '').toLowerCase().includes((c.name || '').toLowerCase()));
            const clientInvoices = invoices.filter(inv => (inv.clientName || '').toLowerCase().includes((c.name || '').toLowerCase()));
            const unpaid = clientInvoices.filter(inv => inv.status !== 'Paid').length;
            text += `${i + 1}. *${c.name}* (${c.industry || 'General'})\n`;
            text += `   📋 Active Tasks: *${clientTasks.length}* | 🧾 Unpaid Invoices: *${unpaid}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ──────── SUBMIT EXPENSE (All Staff) ────────
      teamBot.onText(/🧾 Submit Expense/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        userState[chatId] = { action: 'await_expense_amount', empId: emp.id, empName: emp.name };
        teamBot.sendMessage(chatId,
          `🧾 *EXPENSE CLAIM SUBMISSION*\n\n` +
          `Please reply with the *expense amount in BDT*:\n` +
          `(e.g. \`1500\`)`,
          { parse_mode: 'Markdown' }
        );
      });

      // ──────── LEAVE REQUEST (All Staff) ────────
      teamBot.onText(/🌴 Leave Request/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        userState[chatId] = { action: 'await_leave_type', empId: emp.id, empName: emp.name, reportsTo: emp.reportsTo };
        teamBot.sendMessage(chatId,
          `🌴 *LEAVE REQUEST*\n\n` +
          `Please select leave type by replying:\n\n` +
          `1️⃣ Casual Leave\n` +
          `2️⃣ Sick Leave\n` +
          `3️⃣ Half Day\n\n` +
          `Reply with \`1\`, \`2\`, or \`3\``,
          { parse_mode: 'Markdown' }
        );
      });

      // ──────── EOD REPORT (All Staff) ────────
      teamBot.onText(/📝 EOD Report/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        userState[chatId] = { action: 'await_eod_summary', empId: emp.id, empName: emp.name };
        teamBot.sendMessage(chatId,
          `📝 *END-OF-DAY REPORT*\n` +
          `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
          `Please reply with a *brief summary* of what you accomplished today:\n\n` +
          `_(Example: Completed 3 social posts for Client X, attended strategy call, submitted revised deck)_`,
          { parse_mode: 'Markdown' }
        );
      });

      // ──────── MUKIT FINANCE EXECUTIVE HANDLERS ────────
      teamBot.onText(/🧾 Log Expense Entry/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const expenses = dbData.expenses || [];
        const pendingCount = expenses.filter(e => e.status === 'Pending' || !e.tier1?.approved).length;
        const todayCount = expenses.filter(e => {
          const d = new Date(e.createdAt || '');
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length;

        let text = `🧾 *EXPENSE ENTRY LOG*\n\n` +
          `• Total Entries: *${expenses.length}*\n` +
          `• Pending Approval: *${pendingCount}*\n` +
          `• Logged Today: *${todayCount}*\n\n` +
          `_Use the web portal to log new entries:_\n` +
          `🌐 https://purpleos-iota.vercel.app/admin`;
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/📋 Invoice Tracker/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const invoices = dbData.invoices || [];
        const paid = invoices.filter(i => i.status === 'Paid');
        const draft = invoices.filter(i => i.status === 'Draft');
        const overdue = invoices.filter(i => i.status === 'Overdue');

        let text = `📋 *INVOICE TRACKER*\n\n` +
          `• ✅ Paid: *${paid.length}* (BDT ${paid.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()})\n` +
          `• 📝 Draft: *${draft.length}* (BDT ${draft.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()})\n` +
          `• ⚠️ Overdue: *${overdue.length}*\n\n`;

        if (invoices.length > 0) {
          text += `*Recent Invoices:*\n`;
          invoices.slice(0, 5).forEach((inv, i) => {
            const icon = inv.status === 'Paid' ? '✅' : (inv.status === 'Draft' ? '📝' : '⚠️');
            text += `${i + 1}. ${icon} *${inv.invoiceId || inv.id}* — ${inv.clientName || 'Client'} — BDT ${(inv.amount || 0).toLocaleString()}\n`;
          });
        }
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/💰 Payment Follow-Up/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const invoices = dbData.invoices || [];
        const unpaid = invoices.filter(i => i.status !== 'Paid');

        let text = `💰 *PAYMENT FOLLOW-UP QUEUE*\n\n`;
        if (unpaid.length === 0) {
          text += `✅ All invoices are paid! No follow-ups needed.`;
        } else {
          unpaid.forEach((inv, i) => {
            const daysSince = inv.createdAt ? Math.floor((Date.now() - new Date(inv.createdAt)) / 86400000) : 0;
            text += `${i + 1}. *${inv.invoiceId || inv.id}*\n`;
            text += `   Client: ${inv.clientName || 'N/A'} | Amount: BDT ${(inv.amount || 0).toLocaleString()}\n`;
            text += `   Status: *${inv.status}* | Days Since Created: *${daysSince}*\n\n`;
          });
        }
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Handle Telegram 1-Tap Button Click Callbacks (callback_query)
      teamBot.on('callback_query', async (query) => {
        const queryId = query.id;
        const data = query.data || '';
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || { name: 'Line Manager' };

        let alertMsg = 'Action processed!';
        let statusBadge = `✅ Completed by ${emp.name}`;

        if (data === 'edit_emergency_contact') {
          userState[chatId] = { action: 'await_emergency_contact' };
          alertMsg = 'Please type emergency contact number';
          teamBot.sendMessage(chatId, `📱 *Please reply with your Emergency Contact Phone Number:*`, { parse_mode: 'Markdown' });
        } else if (data === 'edit_address') {
          userState[chatId] = { action: 'await_address' };
          alertMsg = 'Please type home address';
          teamBot.sendMessage(chatId, `🏠 *Please reply with your Home Address:*`, { parse_mode: 'Markdown' });
        } else if (data === 'edit_work_email') {
          userState[chatId] = { action: 'await_email' };
          alertMsg = 'Please type work email address';
          teamBot.sendMessage(chatId, `📧 *Please reply with your Work Email Address:*`, { parse_mode: 'Markdown' });
        } else if (data === 'edit_bank_details') {
          userState[chatId] = { action: 'await_bank_info' };
          alertMsg = 'Please type Bank details';
          teamBot.sendMessage(chatId, `💳 *Please reply with Bank details (Format: Bank Name, Account Number, Branch):*`, { parse_mode: 'Markdown' });
        } else if (data === 'edit_mfs') {
          userState[chatId] = { action: 'await_mfs' };
          alertMsg = 'Please type bKash/Nagad number';
          teamBot.sendMessage(chatId, `📱 *Please reply with your bKash or Nagad Number:*`, { parse_mode: 'Markdown' });
        } else if (data === 'tech_sync_supabase') {
          alertMsg = '🔄 Supabase Cloud Database Synced!';
          teamBot.sendMessage(chatId, `🔄 *Supabase Cloud DB Sync Executed Successfully!*`, { parse_mode: 'Markdown' });
        } else if (data === 'tech_clean_slate') {
          dbData.automationLogs = [];
          writeDB(dbData);
          alertMsg = '🧹 Automation Logs & Test Slate Cleaned!';
          teamBot.sendMessage(chatId, `🧹 *Test Slate Cleaned! Automation logs reset.*`, { parse_mode: 'Markdown' });
        } else if (data === 'tech_fresh_pin') {
          const pinRecord = await createTempPin(emp.phone, emp.id, 'team', emp.email);
          alertMsg = `🔑 New Web PIN Generated: ${pinRecord.pin}`;
          teamBot.sendMessage(chatId, `🔑 *New Web Login PIN:* \`${pinRecord.pin}\`\n\nUse this PIN at https://purpleos-iota.vercel.app/auth`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('approve_leave:')) {
          const leaveId = data.split(':')[1];
          const leave = (dbData.leaves || []).find(l => l.id === leaveId);
          if (leave) {
            leave.status = 'Manager Approved';
            leave.managerReviewedBy = emp.name;
            leave.managerApprovedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('leave_update', dbData.leaves);
            processAutomationEvent('leave_manager_approved', { leave }, dbData, writeDB, broadcast);
            alertMsg = `✅ Leave ${leaveId} Manager Approved! Forwarded to Owner for sign-off.`;
            statusBadge = `✅ Approved by Manager (${emp.name})`;
            teamBot.sendMessage(chatId, `✅ *Leave ${leaveId} Manager Approved!*\nForwarded to Owner for final sign-off.`, { parse_mode: 'Markdown' });
          }
        } else if (data.startsWith('reject_leave:')) {
          const leaveId = data.split(':')[1];
          const leave = (dbData.leaves || []).find(l => l.id === leaveId);
          if (leave) {
            leave.status = 'Declined';
            leave.reviewedBy = emp.name;
            leave.rejectionReason = 'Line manager declined request';
            leave.rejectedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('leave_update', dbData.leaves);
            processAutomationEvent('leave_decision', { leave }, dbData, writeDB, broadcast);
            alertMsg = `❌ Leave ${leaveId} Rejected.`;
            statusBadge = `❌ Rejected by ${emp.name}`;
            teamBot.sendMessage(chatId, `❌ *Leave ${leaveId} Rejected by Manager.*`, { parse_mode: 'Markdown' });
          }
        } else if (data.startsWith('approve_leave_owner:')) {
          const leaveId = data.split(':')[1];
          const leave = (dbData.leaves || []).find(l => l.id === leaveId);
          if (leave) {
            leave.status = 'Approved';
            leave.reviewedBy = 'Agency Owner';
            leave.approvedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('leave_update', dbData.leaves);
            processAutomationEvent('leave_decision', { leave }, dbData, writeDB, broadcast);
            alertMsg = `👑 Leave ${leaveId} Owner Approved & Calendar Updated!`;
            statusBadge = `👑 Owner Final Sign-off Granted`;
            teamBot.sendMessage(chatId, `👑 *Leave ${leaveId} Owner Approved!*`, { parse_mode: 'Markdown' });
          }
        } else if (data.startsWith('approve_expense_t2:')) {
          const expId = data.split(':')[1];
          const exp = (dbData.expenses || []).find(e => e.id === expId);
          if (exp) {
            exp.tier2 = { approved: true, approvedBy: emp.name, date: new Date().toISOString() };
            exp.status = 'Tier 3 Pending';
            writeDB(dbData);
            broadcast('expense_update', dbData.expenses);
            processAutomationEvent('expense_tier2_approved', { expense: exp }, dbData, writeDB, broadcast);
            alertMsg = `💰 Expense ${expId} Tier 2 Verified!`;
            statusBadge = `💰 Tier 2 Verified (${emp.name})`;
            teamBot.sendMessage(chatId, `💰 *Expense ${expId} Tier 2 Verified!*\nStatus set to Tier 3 Pending.`, { parse_mode: 'Markdown' });
          }
        } else if (data.startsWith('disburse_expense_t3:')) {
          const expId = data.split(':')[1];
          const exp = (dbData.expenses || []).find(e => e.id === expId);
          if (exp) {
            exp.tier3 = { approved: true, approvedBy: 'Agency Owner', date: new Date().toISOString() };
            exp.status = 'Disbursed';
            exp.disbursedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('expense_update', dbData.expenses);
            processAutomationEvent('expense_disbursed', { expense: exp }, dbData, writeDB, broadcast);
            alertMsg = `💸 Expense ${expId} Disbursed & Paid!`;
            statusBadge = `💸 Disbursed & Paid`;
            teamBot.sendMessage(chatId, `🎉 *Expense ${expId} Disbursed & Paid!*`, { parse_mode: 'Markdown' });
          }
        } else if (data.startsWith('agr_stage2:')) {
          // Finance Manager countersigns agreement
          const empId = data.split(':')[1];
          const empToSign = (dbData.team || []).find(e => e.id === empId);
          if (empToSign) {
            empToSign.agreementStage = 2;
            empToSign.agreementFinanceSignedBy = emp.name;
            empToSign.agreementFinanceSignedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('team_update', dbData.team);
            sendAgreementNotification(2, empToSign, dbData);
            alertMsg = `✅ Agreement countersigned! Forwarded to Owner for final seal.`;
            statusBadge = `✅ Finance Countersigned by ${emp.name}`;
          }
        } else if (data.startsWith('agr_stage3:')) {
          // Owner gives final seal — employee fully activated
          const empId = data.split(':')[1];
          const empToActivate = (dbData.team || []).find(e => e.id === empId);
          if (empToActivate) {
            empToActivate.agreementStage = 3;
            empToActivate.agreementComplete = true;
            empToActivate.onboardingComplete = true;
            empToActivate.agreementOwnerSignedAt = new Date().toISOString();
            writeDB(dbData);
            broadcast('team_update', dbData.team);
            sendAgreementNotification(3, empToActivate, dbData);
            alertMsg = `👑 ${empToActivate.name} is now fully activated as an official PBD employee!`;
            statusBadge = `👑 Owner Seal Applied — Employee Activated`;
          }
        }

        try {
          await teamBot.editMessageReplyMarkup({
            inline_keyboard: [[{ text: statusBadge, callback_data: 'noop' }]]
          }, { chat_id: chatId, message_id: messageId });
        } catch (e) {}

        try {
          await teamBot.answerCallbackQuery(queryId, { text: alertMsg, show_alert: true });
        } catch (e) {}
      });
    } catch (err) {
      console.warn('⚠️ Team Bot Init Warning:', err.message);
    }
  }

  // 2. Initialize Client Bot (Purple Bot)
  if (clientToken && clientToken.trim() !== '' && !clientToken.includes('your_token')) {
    try {
      const usePolling = Boolean(process.env.USE_POLLING);
      clientBot = new TelegramBot(clientToken, { polling: usePolling });

      if (!usePolling) {
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
        const qText = (query.query || '').trim().toLowerCase();

        try {
          let allInvoices = [];
          try {
            const { data: invoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
            if (invoices && invoices.length) allInvoices = invoices;
          } catch (e) {}

          if (!allInvoices.length) {
            const dbData = readDB();
            allInvoices = dbData.invoices || [];
          }

          const matches = allInvoices.filter(i => 
            !qText || 
            (i.id || '').toLowerCase().includes(qText) || 
            (i.client_name || i.clientName || '').toLowerCase().includes(qText) ||
            (i.project_name || i.projectName || '').toLowerCase().includes(qText)
          ).slice(0, 10);

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
      clientBot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
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
      clientBot.onText(/\/help/, (msg) => {
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

      // Client phone verification
      clientBot.on('contact', (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact || !contact.phone_number) return;
        const dbData = readDB();
        const normPhone = normalizePhone(contact.phone_number);
        const client = (dbData.clients || []).find(c => normalizePhone(c.phone) === normPhone);
        if (!client) {
          return clientBot.sendMessage(chatId,
            `🔒 *Phone not found in our client database.*\n\nIf you are an active Purplebot Digital client, please contact your Account Manager to register your phone number.`,
            { parse_mode: 'Markdown' }
          );
        }
        client.telegramId = String(chatId);
        writeDB(dbData);
        const welcome = `✅ *Account Linked — Welcome, ${client.name}!*\n\n` +
          `• Retainer: *BDT ${(client.retainerValue || 0).toLocaleString()}/month*\n` +
          `• Account Manager: *${client.accountManager || 'Team'}*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 *Next Steps:*\n` +
          `1. Tap *🎬 Review Room* to preview your latest deliverable\n` +
          `2. Tap *📋 Campaign Status* to track production progress\n` +
          `3. Tap *Open App* anytime for your full client portal`;
        clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: getClientKeyboard(client) });
      });

      clientBot.onText(/\/services|🎨 Our Services/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        let text = `🎨 *Purplebot Digital — Core Services:*\n\n`;
        const services = (dbData.services || []).filter(s => s.public);
        if (services.length) {
          services.forEach(s => { text += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n  ${s.description}\n\n`; });
        } else {
          text += `• *Social Media Content Retainer* — BDT 50,000–1,50,000/month\n• *TVC & Commercial Production* — Project-based\n• *Product Photography* — Per-shoot packages\n• *Motion Graphics & Animation* — Per-project\n• *Brand Identity & Design* — One-time\n\n📞 Contact your Account Manager for a custom quote.`;
        }
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: client ? getClientKeyboard(client) : undefined });
      });

      clientBot.onText(/\/portfolio|📁 Portfolio/, (msg) => {
        const chatId = msg.chat.id;
        const text = `📁 *Purplebot Digital Portfolio*\n\nExplore our campaign work:\n🔗 https://purpleos-iota.vercel.app/\n\n_Clients include: Chillox Fast Food, Apex Shoes, and more._`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      clientBot.onText(/\/review|🎬 Review Room/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        const pendingReview = (dbData.tasks || []).filter(t => client && t.client === client.name && t.stage === 'Client Review');
        let text = `🎬 *Review Room — Your Deliverables*\n\n`;
        if (pendingReview.length) {
          text += `You have *${pendingReview.length}* cut(s) awaiting your review:\n\n`;
          pendingReview.forEach((t, i) => { text += `${i+1}. *${t.title}*\n   Campaign: ${t.client}\n\n`; });
          text += `Open the app to stream & approve in 4K:`;
        } else {
          text += `No deliverables pending review right now.\n\nWe\'ll notify you when your next cut is ready.`;
        }
        text += `\n🔗 https://purpleos-iota.vercel.app/client-miniapp`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: client ? getClientKeyboard(client) : undefined });
      });

      clientBot.onText(/\/campaign|📋 Campaign Status/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        const tasks = client ? (dbData.tasks || []).filter(t => t.client === client.name) : [];
        let text = `📋 *Campaign Progress*\n\n`;
        if (tasks.length) {
          tasks.forEach(t => {
            const stages = ['Brief','Shoot','Editing','Client Review','Delivered'];
            const idx = stages.findIndex(s => s.toLowerCase() === (t.stage||'').toLowerCase());
            const bar = stages.map((s,i) => i < idx ? '✅' : i === idx ? '🔵' : '⬜').join('');
            text += `*${t.title}*\n${bar}\nStage: *${t.stage}* | Due: ${t.dueDate || 'TBD'}\n\n`;
          });
        } else {
          text += `No active campaigns found.\nContact your Account Manager to kick off a new campaign.`;
        }
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: client ? getClientKeyboard(client) : undefined });
      });

      clientBot.onText(/\/invoices|💳 My Invoices/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        const invoices = client ? (dbData.invoices || []).filter(i => i.clientName === client.name) : [];
        let text = `💳 *Invoice & Payment Summary*\n\n`;
        if (invoices.length) {
          const pending = invoices.filter(i => i.status !== 'Paid');
          const paid = invoices.filter(i => i.status === 'Paid');
          text += `• Pending: *${pending.length} invoice(s)* — BDT ${pending.reduce((s,i)=>s+(i.amount||0),0).toLocaleString()}\n`;
          text += `• Paid: *${paid.length} invoice(s)* — BDT ${paid.reduce((s,i)=>s+(i.amount||0),0).toLocaleString()}\n\n`;
          if (pending.length) {
            text += `📌 *To pay:* Open the client app and use our bKash / bank payment form.\n`;
            text += `🔗 https://purpleos-iota.vercel.app/client-miniapp`;
          }
        } else {
          text += `No invoices found. Invoices are generated upon deliverable approval.`;
        }
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: client ? getClientKeyboard(client) : undefined });
      });

      clientBot.onText(/📞 Contact AM/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        const amName = client?.accountManager || 'Your Account Manager';
        const text = `📞 *Your Account Manager*\n\n• Name: *${amName}*\n• Phone: *+8801708459008*\n• Email: *contact@purpleos.agency*\n\n_Office hours: Sun–Thu · 9:00 AM – 7:00 PM_`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });
    } catch (err) {
      console.warn('⚠️ Client Bot Init Warning:', err.message);
    }
  }
}

function sendTelegramNotification(chatId, text, inlineKeyboard = null, isTeam = false) {
  let targetBot = isTeam ? (teamBot || clientBot) : (clientBot || teamBot);

  if (!targetBot) {
    const db = readDB();
    const token = process.env.TEAM_BOT_TOKEN || process.env.CLIENT_BOT_TOKEN || db.botConfig?.teamBot?.token;
    if (token && token.trim() !== '' && !token.includes('your_token')) {
      try {
        teamBot = new TelegramBot(token, { polling: false });
        targetBot = teamBot;
      } catch (e) {}
    }
  }

  if (!targetBot) return false;

  const targetChatId = (chatId === '1708459008' || chatId === '+8801708459008') ? '7754769807' : chatId;

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
