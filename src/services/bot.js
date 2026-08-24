const TelegramBot = require('node-telegram-bot-api');
const { supabase } = require('./supabase');
const { normalizePhone } = require('../utils/phone');

const { broadcast } = require('./sse');
const { processAutomationEvent } = require('./automation');
const { createTempPin } = require('./auth-pins');
const state = require('./state');
const { readDB } = require('./db');

const { getRoleKeyboard, getClientKeyboard, getProspectKeyboard } = require('./bot/keyboards');

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
  const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      const usePolling = process.env.USE_POLLING === 'true';
      teamBot = new TelegramBot(teamToken, { polling: usePolling });

      if (usePolling) {
        teamBot.deleteWebHook().catch(e => console.error('Error deleting webhook:', e));
        console.log('✅ Local polling enabled for teamBot (Webhook deleted)');
      }

      // Global bot error handlers — DM Firoz on unhandled errors

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
            web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp' }
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
                `🌐 [Open Team Portal](https://gro10x-ai.vercel.app/team)`,
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
        try {
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
            `🌐 Portal: https://gro10x-ai.vercel.app/auth\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 *Your full dashboard is now unlocked!*\n` +
            `Use the menu below or tap *Open App* for the full portal.`;

          const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);
          teamBot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown', reply_markup: keyboard });
        } catch (err) {
          console.error('[Bot Error: contact handler]', err.message);
          teamBot.sendMessage(msg.chat.id, '⚠️ An error occurred during verification. Please try again.').catch(() => {});
        }
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
        '📊 Business Snapshot', '💰 Finance Summary', '💰 My Commission', '📊 My Status',
        // Creative & Specialists
        '🎨 Design Queue', '👁️ Review Room', '👥 Design Team', '🖌️ My Creative Tasks', '📤 Submit for QC', '✏️ View Revisions',
        '✂️ My Edit Queue', '📤 Submit for Review', '🎨 My 3D Task Queue', '📤 Submit Render', '📸 Book Gear / Studio',
        '🎟️ My Tickets', '🚀 Log Deployment',
        // Copywriters & Content Strategy
        '📜 My Scripts & Copy', '🤖 AI Prompt Studio', '📤 Submit Script QC',
        '📅 My Content Plans', '🚀 Dispatch Hub', '📝 Draft New Plan',
        // Studio Lead & Production
        '⚡ Studio Workload', '🚧 Bottleneck Radar', '📸 Studio & Gear Slots', '📊 Turnaround Metrics',
        '🎬 Production Queue', '📜 Script & Copy QC', '🎥 Shoot Call-Sheets', '👥 Content Team',
        // Strategy & Clients
        '📈 Campaign Strategy', '🗓️ Content Calendars', '👥 Strategy Team', '🎯 My Clients', '🎯 My Client Roster',
        '🎬 Client Approvals', '📢 Send Client Link', '💬 Client Feedback', '👥 Account Team', '📡 Media Buying', '🚀 Client Activation', '🏢 Ops Dashboard',
        // Finance Manager
        '💸 Expense Queue', '🧾 Invoice Status', '📊 Payroll Summary', '🏦 Bank & bKash Hub', '👥 Admin Team',
        // Shared Manager & Approvals
        '👥 My Team', '✅ Leave Approvals', '👥 HR & Attendance',
        // Wizard-initiating buttons — handled exclusively by their onText() listeners
        '🧾 Submit Expense', '🌴 Leave Request', '📝 EOD Report',
        '🧾 Log Expense Entry', '📋 Invoice Tracker', '💰 Payment Follow-Up'
      ];

      const VALID_WIZARD_ACTIONS = ['await_expense', 'await_leave', 'await_eod', 'await_deploy'];

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
        } else if (wizardState.action.startsWith('await_deploy')) {
          const ticketsHandler = require('./bot/handlers/tickets');
          await ticketsHandler.handleDeployWizardStep(teamBot, msg, wizardState, emp);
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
      const creativeHandler = require('./bot/handlers/creative');
      const studioHandler = require('./bot/handlers/studio');
      const finMgrHandler = require('./bot/handlers/finance-manager');
      const ticketsHandler = require('./bot/handlers/tickets');

      // Core profile & earnings
      teamBot.onText(/\/myprofile|👤 My Profile/, (msg) => profileHandler.handleMyProfile(teamBot, msg));
      teamBot.onText(/\/mybank|💳 Bank & bKash/, (msg) => profileHandler.handleMyBank(teamBot, msg));
      teamBot.onText(/\/myearnings|💰 My Earnings|💰 My Commission/, (msg) => profileHandler.handleMyEarnings(teamBot, msg));
      teamBot.onText(/\/techdiag|🛠️ Tech Diagnostics/, (msg) => adminHandler.handleTechDiagnostics(teamBot, msg));

      // Tasks & Craft Queues
      teamBot.onText(/\/mytasks|📋 My Tasks|🖌️ My Creative Tasks/, (msg) => tasksHandler.handleMyTasks(teamBot, msg));
      teamBot.onText(/✂️ My Edit Queue|📤 Submit for Review|🎨 My 3D Task Queue|📤 Submit Render|📤 Submit for QC|✏️ View Revisions|📤 Submit Script QC/, (msg) => creativeHandler.handleMyEditQueue(teamBot, msg));
      teamBot.onText(/\/mytickets|🎟️ My Tickets/, (msg) => ticketsHandler.handleMyTickets(teamBot, msg));
      teamBot.onText(/\/logdeploy|🚀 Log Deployment/, (msg) => ticketsHandler.handleDeployLog(teamBot, msg));

      // Specialist Web Links & Tools
      teamBot.onText(/📅 My Content Plans|🚀 Dispatch Hub|📝 Draft New Plan/, (msg) => {
        teamBot.sendMessage(msg.chat.id,
          `📅 *Content Planning & Dispatch Hub*\n\n` +
          `Manage your campaigns, editorial calendars, and dispatch queues directly on the web portal:\n` +
          `👉 https://gro10x-ai.vercel.app/crew#calendar`,
          { parse_mode: 'Markdown' }
        );
      });
      teamBot.onText(/📜 My Scripts & Copy|🤖 AI Prompt Studio/, (msg) => {
        teamBot.sendMessage(msg.chat.id,
          `📜 *Script & Copy Studio*\n\n` +
          `Access AI brief summarization, copy templates, and script QC feeds:\n` +
          `👉 https://gro10x-ai.vercel.app/crew#tasks`,
          { parse_mode: 'Markdown' }
        );
      });

      // Admin & Team Overview
      teamBot.onText(/\/fullteam(?:@\w+)?|👥 Full Team Status/, (msg) => adminHandler.handleFullTeamStatus(teamBot, msg));

      // Attendance (with aliases /clock_in, /clock_out)
      teamBot.onText(/\/clockin(?:@\w+)?|\/clock_in(?:@\w+)?|📍 Clock-In GPS/, (msg) => attendanceHandler.handleTextClockIn(teamBot, msg));
      teamBot.onText(/\/clockout(?:@\w+)?|\/clock_out(?:@\w+)?|🚪 Clock Out/, (msg) => attendanceHandler.handleClockOut(teamBot, msg));
      teamBot.on('location', (msg) => attendanceHandler.handleLocationClockIn(teamBot, msg));
      teamBot.onText(/\/myattendance(?:@\w+)?|📅 My Attendance Log|👥 HR & Attendance/, (msg) => attendanceHandler.handleMyAttendance(teamBot, msg));

      // Leaves
      teamBot.onText(/\/leave(?:@\w+)?|\/leaverequest(?:@\w+)?|🌴 Leave Request/, (msg) => leavesHandler.handleInitLeave(teamBot, msg));
      teamBot.onText(/\/leavebalance(?:@\w+)?|🌴 Leave Balance/, (msg) => leavesHandler.handleLeaveBalance(teamBot, msg));
      teamBot.onText(/\/leaveapprovals(?:@\w+)?|✅ Leave Approvals/, (msg) => leavesHandler.handleManagerLeaveApprovals(teamBot, msg));

      // Creative Director & Review Room
      teamBot.onText(/\/designqueue(?:@\w+)?|🎨 Design Queue/, (msg) => creativeHandler.handleDesignQueue(teamBot, msg));
      teamBot.onText(/\/reviewroom(?:@\w+)?|👁️ Review Room/, (msg) => creativeHandler.handleReviewRoom(teamBot, msg));
      teamBot.onText(/\/myteam(?:@\w+)?|👥 My Team|👥 Design Team|👥 Content Team|👥 Strategy Team|👥 Account Team/, (msg) => creativeHandler.handleMyTeam(teamBot, msg));

      // Studio Lead & Production Operations
      teamBot.onText(/\/workload(?:@\w+)?|⚡ Studio Workload|🎬 Production Queue/, (msg) => studioHandler.handleStudioWorkload(teamBot, msg));
      teamBot.onText(/\/bottlenecks(?:@\w+)?|🚧 Bottleneck Radar/, (msg) => studioHandler.handleBottleneckRadar(teamBot, msg));
      teamBot.onText(/\/gearslots(?:@\w+)?|📸 Studio & Gear Slots|🎥 Shoot Call-Sheets|📸 Book Gear \/ Studio/, (msg) => studioHandler.handleCrewStudioRequest(teamBot, msg));
      teamBot.onText(/\/metrics(?:@\w+)?|📊 Turnaround Metrics|📊 Department Report/, (msg) => studioHandler.handleTurnaroundMetrics(teamBot, msg));

      // Expenses - Role-aware dispatch for Expense Queue vs Personal Submit
      teamBot.onText(/\/expense(?:@\w+)?|\/submitexpense(?:@\w+)?|🧾 Submit Expense/, (msg) => expensesHandler.handleInitExpense(teamBot, msg));
      teamBot.onText(/\/logexpense(?:@\w+)?|🧾 Log Expense Entry/, (msg) => financeHandler.handleLogExpenseEntry(teamBot, msg));
      teamBot.onText(/\/expensequeue(?:@\w+)?|💸 Expense Queue/, async (msg) => {
        try {
          const emp = await state.getEmployeeByTelegramId(msg.chat.id);
          const access = emp?.accessLevel || '';
          const role = (emp?.role || '').toLowerCase();
          if (access === 'Finance Manager' || role.includes('finance') || access === 'Owner / Admin' || emp?.id === 'PBD-000') {
            return finMgrHandler.handleExpenseQueueFinance(teamBot, msg);
          }
          return expensesHandler.handleInitExpense(teamBot, msg);
        } catch (e) {
          return expensesHandler.handleInitExpense(teamBot, msg);
        }
      });

      // Finance Manager Hubs & Invoice Tracking
      teamBot.onText(/\/invoicetracker(?:@\w+)?|📋 Invoice Tracker|🧾 Invoice Status/, (msg) => financeHandler.handleInvoiceTracker(teamBot, msg));
      teamBot.onText(/\/paymentfollowup(?:@\w+)?|💰 Payment Follow-Up/, (msg) => financeHandler.handlePaymentFollowUp(teamBot, msg));
      teamBot.onText(/\/payroll(?:@\w+)?|📊 Payroll Summary/, (msg) => finMgrHandler.handlePayrollSummary(teamBot, msg));
      teamBot.onText(/\/bankhub(?:@\w+)?|🏦 Bank & bKash Hub/, (msg) => finMgrHandler.handleBankBkashHub(teamBot, msg));
      teamBot.onText(/\/adminteam(?:@\w+)?|👥 Admin Team/, (msg) => finMgrHandler.handleAdminTeam(teamBot, msg));

      // EOD
      teamBot.onText(/\/eod(?:@\w+)?|\/submiteod(?:@\w+)?|📝 EOD Report/, (msg) => eodHandler.handleInitEOD(teamBot, msg));
      teamBot.onText(/\/myeod(?:@\w+)?|📝 My EOD History/, (msg) => eodHandler.handleMyEODHistory(teamBot, msg));

      // Executive briefing & status
      teamBot.onText(/\/briefing(?:@\w+)?|🌅 Morning Briefing/, (msg) => briefingHandler.handleMorningBriefing(teamBot, msg));
      teamBot.onText(/\/snapshot(?:@\w+)?|📊 Business Snapshot|🏢 Ops Dashboard/, (msg) => briefingHandler.handleBusinessSnapshot(teamBot, msg));
      teamBot.onText(/\/finance(?:@\w+)?|💰 Finance Summary/, (msg) => briefingHandler.handleFinanceSummary(teamBot, msg));
      teamBot.onText(/\/approvals(?:@\w+)?|✍️ Pending Approvals/, (msg) => approvalsHandler.handlePendingApprovals(teamBot, msg));
      teamBot.onText(/\/clients(?:@\w+)?|🎬 Client Status|🎯 My Clients|🔔 Client Updates|🚀 Client Activation|📜 Script & Copy QC|📈 Campaign Strategy|🗓️ Content Calendars|🎯 My Client Roster|🎬 Client Approvals|📢 Send Client Link|💬 Client Feedback|📡 Media Buying/, (msg) => reportsHandler.handleClientStatus(teamBot, msg));

      teamBot.onText(/\/leaderboard(?:@\w+)?|🏆 Leaderboard/, (msg) => leaderboardHandler.handleLeaderboard(teamBot, msg));
      teamBot.onText(/\/status(?:@\w+)?|\/mystats(?:@\w+)?|\/my_stats(?:@\w+)?|📊 Dashboard Status|📊 My Status/, (msg) => mystatsHandler.handleStatus(teamBot, msg));

      // Reset PIN Command
      teamBot.onText(/\/resetpin|🔑 View My Web Login PIN/, async (msg) => {
        const chatId = msg.chat.id;
        try {
          const emp = await state.getEmployeeByTelegramId(chatId);

          if (!emp) {
            return teamBot.sendMessage(chatId, `❌ Please verify your phone number first by tapping "Verify My Phone Number".`, { parse_mode: 'Markdown' });
          }

          const pinRecord = await createTempPin(emp.phone, emp.id, 'team', emp.email);
          teamBot.sendMessage(chatId, `🔑 *New Desktop Web PIN:* \`${pinRecord.pin}\`\n\nGo to https://gro10x-ai.vercel.app/auth to log in on your laptop.`, { parse_mode: 'Markdown' });
        } catch (err) {
          console.error('[Bot Error: resetpin]', err.message);
          teamBot.sendMessage(chatId, '❌ Could not generate login PIN. Please try again later.').catch(() => {});
        }
      });

      // 🎓 Orientation Command / Button
      teamBot.onText(/\/orientation|🎓 Orientation/, async (msg) => {
        const chatId = msg.chat.id;
        try {
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
            `🌐 Open Onboarding Web Portal: https://gro10x-ai.vercel.app/onboarding`;

          teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (err) {
          console.error('[Bot Error: orientation]', err.message);
          teamBot.sendMessage(chatId, '❌ Could not load orientation tracker. Please try again.').catch(() => {});
        }
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
      }

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
                `🌐 [Open Partner Portal](https://gro10x-ai.vercel.app/partners)`,
              parse_mode: 'Markdown'
            }
          }));

          clientBot.answerInlineQuery(queryId, results).catch(e => console.error('Inline query error:', e.message));
        } catch (err) {
          console.error('clientBot inline_query error:', err.message);
        }
      });

      // ─── Helper: find client by phone (checks main phone + pocs array) ───
      async function findClientAndPoc(normPhone) {
        const { findClientAndPocByPhone } = require('./auth-pins');
        const match = await findClientAndPocByPhone(normPhone);
        if (match) {
          return {
            ...match.client,
            activeCampaigns: match.client.active_campaigns || [],
            matchedPoc: match.poc
          };
        }
        const dbData = await readDB();
        const found = (dbData.clients || []).find(c => normalizePhone(c.phone || '').includes(normPhone));
        return found ? { ...found, matchedPoc: { name: found.contact_person || found.name, role: 'Primary POC', phone: found.phone } } : null;
      }

      async function sendClientWelcome(chatId, client, normPhone) {
        const poc = client.matchedPoc || { name: client.contact_person || client.name, role: 'Authorized POC' };
        
        if (supabase) {
          try {
            const updatedPocs = (client.pocs || []).map(p => {
              if (p.phone && normalizePhone(p.phone).includes(normPhone)) {
                return { ...p, telegram_id: String(chatId) };
              }
              return p;
            });
            await supabase.from('clients').update({
              telegram_id: String(chatId),
              pocs: updatedPocs
            }).eq('id', client.id);
          } catch (e) {
            console.warn('sendClientWelcome Supabase update error:', e.message);
          }
        }

        const pinRecord = await createTempPin(normPhone, client.id, 'client', poc.email || client.email || '');

        let amName = client.accountManager || client.account_manager || 'Tasin Kabir';
        let amPhone = '+880 1709-952672';
        if (amName.toLowerCase().includes('sayed')) {
          amName = 'Sayed Ashraf';
          amPhone = '+880 1617-410967';
        } else if (amName.toLowerCase().includes('rimjhim')) {
          amName = 'Rimjhim Rashid';
          amPhone = '+880 1759-768962';
        } else if (amName.toLowerCase().includes('mehedi')) {
          amName = 'MD Mehedi Bin Jayed';
          amPhone = '+880 1874-079687';
        }

        const welcome = `🎉 *Welcome to Purplebot Digital, ${poc.name}!* \n\n` +
          `🏢 *Organization:* ${client.name}\n` +
          `👤 *Authorized POC:* ${poc.role || 'Brand Representative'}\n` +
          `⚡ *Retainer Status:* ${client.status || 'Active Retainer'}\n` +
          `🔑 *Your Web Portal PIN:* \`${pinRecord.pin}\`\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🤝 *Your Dedicated Account Manager:*\n` +
          `• *${amName}* (Client Services)\n` +
          `• Direct Line: \`${amPhone}\`\n\n` +
          `📌 *Workspace Quick Menu:*\n` +
          `• Tap *🎬 Review Room* to stream & approve video cuts\n` +
          `• Tap *📋 Campaign Status* to track your production pipeline\n` +
          `• Tap *📝 Submit Brief* to launch a new campaign\n` +
          `• Tap *Open Client Portal* anytime for full web analytics!`;

        clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: getClientKeyboard(client) });
      }

      // ─── Helper: Complete Prospect Quote Wizard ───
      async function handleProspectQuoteCompletion(msg, session, phoneInput) {
        const chatId = msg.chat.id;
        const cleanPhone = (phoneInput || '').trim();
        const contactPerson = session.data?.fullName || [session.data?.firstName, session.data?.lastName].filter(Boolean).join(' ') || session.data?.company || 'Telegram Prospect';
        const company = session.data?.company || 'Prospect Brand';
        const service = session.data?.service || 'General Inquiry';
        const budget = session.data?.budget || 'Not Specified';
        const timeline = session.data?.timeline || 'Immediate';

        const newLead = {
          id: `LED-${Date.now().toString().slice(-6)}`,
          stage: 'New Inquiry',
          created_at: new Date().toISOString(),
          company: company,
          contact_person: contactPerson,
          phone: cleanPhone,
          whatsapp: cleanPhone,
          service: service,
          value: (budget.includes('300,000') || budget.includes('300k')) ? 300000
               : (budget.includes('150,000') || budget.includes('150k')) ? 150000
               : (budget.includes('75,000') || budget.includes('75k')) ? 75000
               : 45000,
          notes: `Captured via Telegram Bot (@purpleosbot). Budget: ${budget} | Timeline: ${timeline} | TG User: ${session.data?.telegramUser || 'N/A'}, Chat ID: ${chatId}`,
          source: 'Telegram Bot — @purpleosbot'
        };

        if (supabase) {
          try {
            await supabase.from('leads').insert([newLead]);
          } catch (e) {
            console.warn('[Bot] Lead insert error from telegram bot:', e.message);
          }
        }

        await state.clearSession(chatId);

        // Send telegram alert to owner / sales
        try {
          const ownerChatId = process.env.OWNER_TELEGRAM_ID;
          if (ownerChatId) {
            sendTelegramNotification(ownerChatId,
              `🔔 *New Qualified Lead from Telegram Bot (@purpleosbot)!*\n\n` +
              `👤 *${contactPerson}* (${company})\n` +
              `📞 Phone: \`${cleanPhone}\`\n` +
              `🎯 Service: *${service}*\n` +
              `💰 Budget Range: *${budget}*\n` +
              `⏱️ Timeline: *${timeline}*\n` +
              `💬 TG User: ${session.data?.telegramUser || 'N/A'}\n` +
              `📍 Source: ${newLead.source}`, null, true
            );
          }
        } catch (err) {}

        const successMsg = `✅ *Thank you, ${contactPerson}!* \n\n` +
          `Your campaign request for *${company}* has been received:\n` +
          `• Service: *${service}*\n` +
          `• Target Budget: *${budget}*\n` +
          `• Timeline: *${timeline}*\n\n` +
          `Our Account Director will review your requirements and reach out via WhatsApp at \`${cleanPhone}\` within 2 business hours with a custom proposal! 🚀\n\n` +
          `📞 *Direct Priority Line:* \`+880 1711-019550\`\n` +
          `🌐 *Agency Website:* ${process.env.PUBLIC_URL || 'https://gro10x-ai.vercel.app'}`;

        clientBot.sendMessage(chatId, successMsg, { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() });
      }

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
          const welcome = `💜 *Welcome to Purplebot Digital!*\n\n` +
            `We are Bangladesh's premier creative production, digital marketing, and tech agency — trusted by *LG, InterContinental, BAT, Reckitt (Mortein/Harpic), Chillox, UCB*, and 100+ high-growth brands.\n\n` +
            `🎯 *How can we help your brand today?*\n\n` +
            `• 💬 *Get a Custom Quote* — 1-minute tailored campaign proposal\n` +
            `• 📅 *Book a Strategy Call* — 15-min discovery consultation\n` +
            `• 💰 *Service Pricing & Plans* — Transparent package rates from ৳40k/mo\n` +
            `• 📁 *See Portfolio* — Review award-winning TVCs and reels\n\n` +
            `👇 *Select an option below to get started:*`;
          const keyboard = getProspectKeyboard();
          clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        }
      });

      // /help handler
      clientBot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        const helpText = `📖 *PURPLEOS CLIENT BOT — QUICK GUIDE*\n\n` +
          `• \`/start\` — Open portal & main menu\n` +
          `• \`/help\` — Show available options & commands\n` +
          `• \`/quote\` — Request a tailored campaign proposal\n` +
          `• \`/book\` — Schedule a 15-minute strategy call\n` +
          `• \`/pricing\` — View transparent service package rates\n` +
          `• \`/services\` — Explore agency capabilities\n` +
          `• \`/portfolio\` — View creative showreels & case studies\n` +
          `• \`/review\` — Access Video Review Room for active deliverables\n` +
          `• \`/campaign\` — Track live campaign production pipeline\n` +
          `• \`/invoices\` — View billing & payment history\n\n` +
          `💡 *Tip:* Tap *Open Client Portal* anytime for full dashboard access!`;
        clientBot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
      });

      // ─── Prospect Pricing & Plans Handler ───
      clientBot.onText(/\/pricing|💰 Service Pricing & Plans|💰 Service Pricing/, async (msg) => {
        const chatId = msg.chat.id;
        const pricingText = `💰 *PURPLEBOT DIGITAL — SERVICE PACKAGES & PRICING*\n\n` +
          `📱 *Social Media Retainers:*\n` +
          `• Lite Plan: *BDT 45,000/mo* (~$410)\n` +
          `• Essential Plan (Popular): *BDT 75,000/mo* (~$680)\n` +
          `• Advanced Plan: *BDT 120,000/mo* (~$1,090)\n\n` +
          `🎬 *Video Production & TVCs:*\n` +
          `• Viral Reels Batch (8x): *BDT 40,000/batch* (~$360)\n` +
          `• Commercial Brand Film: *BDT 250,000/project* (~$2,270)\n\n` +
          `🎨 *Branding & Identity:*\n` +
          `• Brand Starter Kit: *BDT 80,000* (~$730)\n` +
          `• Corporate Rebrand 360: *BDT 200,000* (~$1,820)\n\n` +
          `💻 *Website & Custom Tech:*\n` +
          `• Business Landing Site: *BDT 150,000* (~$1,360)\n` +
          `• Custom Store & Portal: *BDT 250,000* (~$2,270)\n\n` +
          `Ready to start? Tap *💬 Get a Custom Quote* below! 👇`;
        clientBot.sendMessage(chatId, pricingText, { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() });
      });

      // ─── Prospect Book Strategy Call Handler ───
      clientBot.onText(/\/book|📅 Book a Strategy Call|📅 Book Consultation|📅 Book Call/, async (msg) => {
        const chatId = msg.chat.id;
        const bookText = `📅 *BOOK A 15-MINUTE STRATEGY CONSULTATION*\n\n` +
          `Schedule a 1-on-1 discovery call with our Account Director to discuss your brand's growth goals, video production scope, or tech requirements.\n\n` +
          `🕒 *Consultation Hours:* Sat – Thu (10:00 AM – 7:00 PM BST)\n` +
          `📍 *Format:* Google Meet, Zoom, or In-Person (Banani Studio)\n\n` +
          `💬 *Instant WhatsApp Booking:* [Chat Directly with Account Director](https://wa.me/8801711019550?text=Hi%20Purplebot%20Digital,%20I'd%20like%20to%20book%20a%2015-min%20strategy%20consultation.)\n` +
          `📞 *Direct Line:* \`+880 1711-019550\`\n\n` +
          `Prefer a written quote first? Tap *💬 Get a Custom Quote* below! 👇`;
        clientBot.sendMessage(chatId, bookText, { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() });
      });

      // ─── Prospect Quote Wizard Trigger ───
      clientBot.onText(/\/quote|💬 Get a Custom Quote|💬 Get a Quote/, async (msg) => {
        const chatId = msg.chat.id;
        const defaultName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || '';
        await state.setSession(chatId, {
          action: 'await_prospect_quote',
          step: 1,
          data: {
            telegramUser: msg.from?.username ? `@${msg.from.username}` : '',
            firstName: msg.from?.first_name || '',
            lastName: msg.from?.last_name || '',
            fullName: defaultName
          }
        });

        const text = `💬 *Get a Tailored Proposal & Quote*\n\n` +
          `Let's understand your campaign requirements in a few quick steps.\n\n` +
          `*Step 1 of 5:* What is your *Full Name*?` + (defaultName ? `\n_(Or tap your name below)_` : '');
        const keyboard = {
          keyboard: [
            ...(defaultName ? [[{ text: defaultName }]] : []),
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true
        };
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      // ─── Existing Client Login Intent ───
      clientBot.onText(/🔐 I'm an Existing Client →|🔐 Client Login/, async (msg) => {
        const chatId = msg.chat.id;
        const promptText = `🔐 *Client Partner Verification*\n\n` +
          `To access your active campaign dashboard, video review room, and invoices, please share your registered phone number below:`;
        const keyboard = {
          keyboard: [
            [{ text: '📱 Share My Phone to Verify', request_contact: true }],
            [{ text: '🔙 Back to Main Menu' }]
          ],
          resize_keyboard: true
        };
        clientBot.sendMessage(chatId, promptText, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      // ─── Back to Main Menu ───
      clientBot.onText(/🔙 Back to Main Menu/, async (msg) => {
        const chatId = msg.chat.id;
        await state.clearSession(chatId);
        const dbData = await readDB();
        const client = (dbData.clients || []).find(c => String(c.telegramId) === String(chatId));
        const keyboard = client ? getClientKeyboard(client) : getProspectKeyboard();
        clientBot.sendMessage(chatId, `👋 *Main Menu*`, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      // ─── Client phone verification via shared contact ───
      clientBot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact || !contact.phone_number) return;

        // Check if user is in the Quote Wizard (Final Step)
        const session = await state.getSession(chatId);
        if (session && session.action === 'await_prospect_quote' && session.step >= 5) {
          return handleProspectQuoteCompletion(msg, session, contact.phone_number);
        }

        const normPhone = normalizePhone(contact.phone_number);
        const client = await findClientAndPoc(normPhone);
        if (!client) {
          return clientBot.sendMessage(chatId,
            `👋 *Hi there!*\n\nThe phone number *+${normPhone}* is not registered in our active client database yet.\n\n` +
            `Looking to scale your brand with Purplebot Digital? Tap *💬 Get a Custom Quote* below to get started! 💜`,
            { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() }
          );
        }
        await sendClientWelcome(chatId, client, normPhone);
      });

      // ─── Message router for wizard steps & manual phone input ───
      clientBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = (msg.text || '').trim();
        if (msg.contact) return; // Handled in contact event

        // Global /cancel
        if (text === '/cancel' || text === '❌ Cancel') {
          const session = await state.getSession(chatId);
          if (session && session.action === 'await_prospect_quote') {
            await state.clearSession(chatId);
            return clientBot.sendMessage(chatId, `🚫 Proposal wizard cancelled. Tap any button below to continue.`, { reply_markup: getProspectKeyboard() });
          }
        }

        // Active Wizard Session Routing
        const session = await state.getSession(chatId);
        if (session && session.action === 'await_prospect_quote') {
          const KNOWN_MENUS = [
            '🎨 Our Services', '📁 See Portfolio', '📁 Portfolio', '💬 Get a Custom Quote',
            '💬 Get a Quote', '📞 Talk to an Expert', '📞 Contact AM', '🔐 I\'m an Existing Client →',
            '🔙 Back to Main Menu', '💰 Service Pricing & Plans', '📅 Book a Strategy Call',
            '/start', '/help', '/services', '/portfolio', '/quote', '/book', '/pricing'
          ];
          if (KNOWN_MENUS.some(m => text === m || text.startsWith(m))) {
            await state.clearSession(chatId);
            return; // Let onText listener handle it
          }

          if (session.step === 1) {
            session.data.fullName = text;
            session.step = 2;
            await state.setSession(chatId, session);

            const replyText = `Nice to meet you, *${text}*! 👋\n\n` +
              `*Step 2 of 5:* What is your *Company or Brand Name*?`;
            const keyboard = {
              keyboard: [[{ text: '❌ Cancel' }]],
              resize_keyboard: true
            };
            return clientBot.sendMessage(chatId, replyText, { parse_mode: 'Markdown', reply_markup: keyboard });
          }

          if (session.step === 2) {
            session.data.company = text;
            session.step = 3;
            await state.setSession(chatId, session);

            const replyText = `Great, *${text}*! 🎯\n\n` +
              `*Step 3 of 5:* Which service are you most interested in?`;
            const keyboard = {
              keyboard: [
                [{ text: '📱 Digital Marketing & Growth' }, { text: '🎬 Video Reels & TVC' }],
                [{ text: '🎨 Branding & Motion Design' }, { text: '💻 Website & Tech Development' }],
                [{ text: '⚡ 360 Full Campaign' }, { text: '❌ Cancel' }]
              ],
              resize_keyboard: true
            };
            return clientBot.sendMessage(chatId, replyText, { parse_mode: 'Markdown', reply_markup: keyboard });
          }

          if (session.step === 3) {
            session.data.service = text;
            session.step = 4;
            await state.setSession(chatId, session);

            const replyText = `Got it! 🚀\n\n` +
              `*Step 4 of 5:* What is your *Estimated Monthly Budget*?`;
            const keyboard = {
              keyboard: [
                [{ text: '৳45,000 – ৳75,000 / mo' }, { text: '৳75,000 – ৳150,000 / mo' }],
                [{ text: '৳150,000 – ৳300,000 / mo' }, { text: '৳300,000+ Enterprise' }],
                [{ text: '❌ Cancel' }]
              ],
              resize_keyboard: true
            };
            return clientBot.sendMessage(chatId, replyText, { parse_mode: 'Markdown', reply_markup: keyboard });
          }

          if (session.step === 4) {
            session.data.budget = text;
            session.step = 5;
            await state.setSession(chatId, session);

            const replyText = `Understood! ⏱️\n\n` +
              `*Step 5 of 5:* When do you plan to launch this project?`;
            const keyboard = {
              keyboard: [
                [{ text: '🚀 Immediately (This Week)' }, { text: '📅 Within 2–4 Weeks' }],
                [{ text: '🔍 Planning / Q3-Q4' }, { text: '❌ Cancel' }]
              ],
              resize_keyboard: true
            };
            return clientBot.sendMessage(chatId, replyText, { parse_mode: 'Markdown', reply_markup: keyboard });
          }

          if (session.step === 5) {
            session.data.timeline = text;
            session.step = 6;
            await state.setSession(chatId, session);

            const replyText = `Almost done! ✨\n\n` +
              `*Final Step:* What is your *WhatsApp or Phone Number* so our Account Director can send your proposal?`;
            const keyboard = {
              keyboard: [
                [{ text: '📱 Share My Phone', request_contact: true }],
                [{ text: '❌ Cancel' }]
              ],
              resize_keyboard: true
            };
            return clientBot.sendMessage(chatId, replyText, { parse_mode: 'Markdown', reply_markup: keyboard });
          }

          if (session.step === 6) {
            const digits = text.replace(/[^0-9]/g, '');
            if (digits.length < 7) {
              return clientBot.sendMessage(chatId, `⚠️ Please enter a valid WhatsApp/phone number with at least 7 digits (or tap 📱 Share My Phone):`);
            }
            return handleProspectQuoteCompletion(msg, session, text);
          }
        }

        // Manual phone number typed outside wizard
        if (/^[\+\d][\d\s\-]{7,14}$/.test(text)) {
          const normPhone = normalizePhone(text);
          if (normPhone && normPhone.length >= 8) {
            const client = await findClientAndPoc(normPhone);
            if (!client) {
              return clientBot.sendMessage(chatId,
                `👋 *Hi there!*\n\nThe phone number *+${normPhone}* is not registered in our active client database yet.\n\n` +
                `Looking to scale your brand with Purplebot Digital? Tap *💬 Get a Custom Quote* below to get started! 💜`,
                { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() }
              );
            }
            return sendClientWelcome(chatId, client, normPhone);
          }
        }

        // Friendly guidance for unregistered users sending unexpected text
        const isClient = (await readDB()).clients?.some(c => String(c.telegramId) === String(chatId));
        if (!isClient && !text.startsWith('/')) {
          clientBot.sendMessage(chatId,
            `👋 *Hi there! I received your message.*\n\n` +
            `I'm the PurpleOS Virtual Assistant. How can we assist your brand today?\n\n` +
            `• Tap *💬 Get a Custom Quote* to request a proposal\n` +
            `• Tap *📅 Book a Strategy Call* to schedule a consultation\n` +
            `• Tap *💰 Service Pricing & Plans* to view rates\n` +
            `• Or call our team directly at \`+880 1711-019550\` 📞`,
            { parse_mode: 'Markdown', reply_markup: getProspectKeyboard() }
          );
        }
      });

      const clientHandler = require('./bot/handlers/client');
      clientBot.onText(/\/services|🎨 Our Services/, (msg) => clientHandler.handleServices(clientBot, msg));
      clientBot.onText(/\/portfolio|📁 Portfolio|📁 See Portfolio/, (msg) => clientHandler.handlePortfolio(clientBot, msg));
      clientBot.onText(/\/review|🎬 Review Room/, (msg) => clientHandler.handleReviewRoom(clientBot, msg));
      clientBot.onText(/\/campaign|📋 Campaign Status/, (msg) => clientHandler.handleCampaignStatus(clientBot, msg));
      clientBot.onText(/\/invoices|💳 My Invoices/, (msg) => clientHandler.handleInvoices(clientBot, msg));
      clientBot.onText(/📞 Contact AM|📞 Talk to an Expert/, (msg) => clientHandler.handleContactAM(clientBot, msg));
      clientBot.onText(/\/brief|📝 Submit Brief/, (msg) => clientHandler.handleSubmitBrief(clientBot, msg));
      clientBot.onText(/\/digest|📊 Monthly Digest/, (msg) => clientHandler.handleClientDigest(clientBot, msg));

      // ── Client Bot Callback Query Handler ──────────────────────────────────
      // Required: Telegram will show infinite spinner if answerCallbackQuery()
      // is never called. This handler resolves all inline button presses.
      clientBot.on('callback_query', async (query) => {
        const queryId = query.id;
        const data = query.data || '';

        try {
          if (data.startsWith('open_portal')) {
            await clientBot.answerCallbackQuery(queryId, {
              text: '🌐 Opening your client portal...',
              url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/client`
            });
          } else if (data.startsWith('open_review')) {
            await clientBot.answerCallbackQuery(queryId, {
              text: '🎬 Opening Review Room...',
              url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/client#review`
            });
          } else if (data.startsWith('open_invoice')) {
            await clientBot.answerCallbackQuery(queryId, {
              text: '💳 Opening invoices...',
              url: `${process.env.BASE_URL || 'https://gro10x-ai.vercel.app'}/client#invoices`
            });
          } else {
            // Generic acknowledgement — dismiss spinner
            await clientBot.answerCallbackQuery(queryId, { text: '✅ Received' });
          }
        } catch (e) {
          console.warn('[clientBot] callback_query error:', e.message);
          try { await clientBot.answerCallbackQuery(queryId, { text: '' }); } catch (_) {}
        }
      });

      // ── Client Bot Error Handler ────────────────────────────────────────────
      clientBot.on('error', (err) => {
        console.error('[clientBot] polling/webhook error:', err.message || err);
      });
      clientBot.on('polling_error', (err) => {
        console.error('[clientBot] polling_error:', err.message || err);
      });
    } catch (err) {
      console.warn('⚠️ Client Bot Init Warning:', err.message);
    }
  }
}

function sendTelegramNotification(chatId, text, inlineKeyboard = null, isTeam = false) {
  let targetBot = isTeam ? teamBot : clientBot;

  if (!targetBot) {
    if (isTeam) {
      const token = process.env.TEAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      if (token && token.trim() !== '' && !token.includes('your_token')) {
        try {
          teamBot = new TelegramBot(token, { polling: false });
          targetBot = teamBot;
        } catch (e) {}
      }
    } else {
      const token = process.env.CLIENT_BOT_TOKEN || process.env.TEAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      if (token && token.trim() !== '' && !token.includes('your_token')) {
        try {
          clientBot = new TelegramBot(token, { polling: false });
          targetBot = clientBot;
        } catch (e) {}
      }
    }
  }

  // Final fallback to whatever bot is available
  if (!targetBot) {
    targetBot = teamBot || clientBot;
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
  getRoleKeyboard,
  getClientKeyboard
};
