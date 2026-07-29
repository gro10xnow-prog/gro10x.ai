const TelegramBot = require('node-telegram-bot-api');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');
const { processAutomationEvent } = require('./automation');

let teamBot = null;
let clientBot = null;

function initBot() {
  const db = readDB();

  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token;
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token;
  const rawUrl = process.env.PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : 'https://purpleos-iota.vercel.app');
  const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  const isVercel = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_URL) || process.env.NODE_ENV === 'production';

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      teamBot = new TelegramBot(teamToken, { polling: !isVercel });

      if (isVercel) {
        fetch(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${baseUrl}/api/webhooks/telegram?bot=team` })
        }).then(res => res.json()).then(data => {
          console.log(`📡 Team Bot Webhook status (${baseUrl}):`, data);
        }).catch(e => console.error('Error setting team webhook:', e));
      }

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

      teamBot.onText(/\/start|\/help/, (msg) => {
        const chatId = msg.chat.id;
        const welcome = `🤖 *Welcome to Purple Man (Agency Crew & Manager Bot)!*\n\n` +
          `Tap any button below to manage department tasks, check team rosters, view daily briefings, check salary, and log attendance directly!`;
        
        const keyboard = {
          keyboard: [
            [{ text: '👥 My Team Roster' }, { text: '📊 Department Report' }],
            [{ text: '🌅 Morning Briefing' }, { text: '💰 My Salary & Earnings' }],
            [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }],
            [{ text: '📱 Share Verified Phone', request_contact: true }]
          ],
          resize_keyboard: true
        };
        teamBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      teamBot.onText(/\/clockin/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = dbData.team.find(e => e.telegramId == chatId) || dbData.team[0];
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let record = dbData.attendance.find(a => a.name === emp.name);
        if (record) {
          record.status = 'In Studio';
          record.clockInTime = timeStr;
        } else {
          dbData.attendance.push({
            employeeId: emp.id || 'EMP-001',
            name: emp.name,
            status: 'In Studio',
            clockInTime: timeStr,
            location: 'Gulshan Studio'
          });
        }
        writeDB(dbData);
        broadcast('attendance_update', dbData.attendance);
        
        teamBot.sendMessage(chatId, `✅ *Clock In Recorded by Purple Man!*\nStatus set to *In Studio* at ${timeStr}. Dashboard updated.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/clockout/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = dbData.team.find(e => e.telegramId == chatId) || dbData.team[0];
        
        let record = dbData.attendance.find(a => a.name === emp.name);
        if (record) {
          record.status = 'Clocked Out';
        }
        writeDB(dbData);
        broadcast('attendance_update', dbData.attendance);
        
        teamBot.sendMessage(chatId, `🚪 *Clock Out Recorded by Purple Man!*\nStatus set to *Clocked Out*. Have a great evening!`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/myearnings/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = dbData.team.find(e => e.telegramId == chatId) || dbData.team[0];
        const total = (emp.baseSalary || 65000) + (emp.earnedCommissions || 12500);
        const message = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
          `• Role: ${emp.role}\n` +
          `• Base Pay: BDT ${(emp.baseSalary || 65000).toLocaleString()}\n` +
          `• Booking Commissions: BDT ${(emp.earnedCommissions || 12500).toLocaleString()}\n` +
          `-----------------------------------------\n` +
          `*Total Monthly Pay: BDT ${total.toLocaleString()}*`;
        teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/mybookings/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = dbData.team.find(e => e.telegramId == chatId) || dbData.team[0];
        const tasks = dbData.tasks.filter(t => t.assignee.toLowerCase().includes((emp.name || '').split(' ')[0].toLowerCase()));
        
        let message = `📅 *Assigned Shoots & Tasks for ${emp.name}:*\n\n`;
        if (tasks.length === 0) {
          message += `No active shoot assignments found.`;
        } else {
          tasks.forEach((t, index) => {
            message += `${index + 1}. *${t.title}*\n   Client: ${t.client}\n   Stage: ${t.stage}\n   Due: ${t.dueDate}\n\n`;
          });
        }
        teamBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/approve (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const expId = (match[1] || '').trim().toUpperCase();
        const dbData = readDB();
        const exp = (dbData.expenses || []).find(e => e.id === expId);
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || { name: 'Line Manager' };

        if (!exp) {
          return teamBot.sendMessage(chatId, `❌ Expense claim *${expId}* not found.`, { parse_mode: 'Markdown' });
        }

        exp.tier1 = { approved: true, approvedBy: emp.name, date: new Date().toISOString() };
        exp.status = 'Tier 2 Pending';
        writeDB(dbData);
        broadcast('expense_update', dbData.expenses);

        processAutomationEvent('expense_tier1_approved', { expense: exp }, dbData, writeDB, broadcast);
        teamBot.sendMessage(chatId, `✅ *Expense ${expId} Tier 1 Approved!*\nStatus set to *Tier 2 Pending*. Finance Lead Roksana notified.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/approve2 (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const expId = (match[1] || '').trim().toUpperCase();
        const dbData = readDB();
        const exp = (dbData.expenses || []).find(e => e.id === expId);
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || { name: 'Roksana Islam (Finance Lead)' };

        if (!exp) {
          return teamBot.sendMessage(chatId, `❌ Expense claim *${expId}* not found.`, { parse_mode: 'Markdown' });
        }

        exp.tier2 = { approved: true, approvedBy: emp.name, date: new Date().toISOString() };
        exp.status = 'Tier 3 Pending';
        writeDB(dbData);
        broadcast('expense_update', dbData.expenses);

        processAutomationEvent('expense_tier2_approved', { expense: exp }, dbData, writeDB, broadcast);
        teamBot.sendMessage(chatId, `💰 *Expense ${expId} Tier 2 Verified!*\nStatus set to *Tier 3 Pending*. Owner notified for final disbursement.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/approveleave (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const leaveId = (match[1] || '').trim().toUpperCase();
        const dbData = readDB();
        const leave = (dbData.leaves || []).find(l => l.id === leaveId);
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || { name: 'Line Manager' };

        if (!leave) {
          return teamBot.sendMessage(chatId, `❌ Leave request *${leaveId}* not found.`, { parse_mode: 'Markdown' });
        }

        leave.status = 'Manager Approved';
        leave.managerReviewedBy = emp.name;
        leave.managerApprovedAt = new Date().toISOString();
        writeDB(dbData);
        broadcast('leave_update', dbData.leaves);

        processAutomationEvent('leave_manager_approved', { leave }, dbData, writeDB, broadcast);
        teamBot.sendMessage(chatId, `🌴 *Leave Request ${leaveId} Manager Approved!*\nStatus set to *Manager Approved*. Forwarded to Owner for final sign-off.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/rejectleave (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const args = (match[1] || '').trim();
        const parts = args.split(' ');
        const leaveId = parts[0].toUpperCase();
        const reason = parts.slice(1).join(' ') || 'Line manager declined request';

        const dbData = readDB();
        const leave = (dbData.leaves || []).find(l => l.id === leaveId);
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || { name: 'Line Manager' };

        if (!leave) {
          return teamBot.sendMessage(chatId, `❌ Leave request *${leaveId}* not found.`, { parse_mode: 'Markdown' });
        }

        leave.status = 'Declined';
        leave.reviewedBy = emp.name;
        leave.rejectionReason = reason;
        leave.rejectedAt = new Date().toISOString();
        writeDB(dbData);
        broadcast('leave_update', dbData.leaves);

        processAutomationEvent('leave_decision', { leave }, dbData, writeDB, broadcast);
        teamBot.sendMessage(chatId, `❌ *Leave Request ${leaveId} Rejected*\nStaff member notified via Telegram.`, { parse_mode: 'Markdown' });
      });

      // Command: /myteam
      teamBot.onText(/\/myteam/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || (dbData.team || [])[0];
        const isOps = (emp?.role || '').toLowerCase().includes('operations') || emp?.department === 'Management';
        const userDept = (emp?.department || '').toLowerCase();

        const deptMembers = isOps
          ? (dbData.team || [])
          : (dbData.team || []).filter(t => (t.department || '').toLowerCase().includes(userDept) || userDept.includes((t.department || '').toLowerCase()));

        let text = `👥 *DEPARTMENT TEAM ROSTER (${emp?.department || 'Operations'}):*\n\n`;
        deptMembers.forEach((m, idx) => {
          const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : '🌴');
          const activeTasks = (dbData.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((m.name || '').split(' ')[0].toLowerCase())).length;
          text += `${idx + 1}. *${m.name}* (${m.role})\n   ${statusIcon} Status: *${m.status || 'In Studio'}* | 📋 Active Tasks: *${activeTasks}*\n\n`;
        });
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Command: /deptreport
      teamBot.onText(/\/deptreport/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || (dbData.team || [])[0];

        const tasks = dbData.tasks || [];
        const pendingLeaves = (dbData.leaves || []).filter(l => l.status === 'Pending Line Review').length;
        const pendingExpenses = (dbData.expenses || []).filter(e => !e.tier1?.approved).length;

        let text = `📊 *DEPARTMENT OPERATIONAL REPORT*\n` +
          `📍 Department: *${emp.department || 'Operations'}*\n\n` +
          `📋 *Kanban Task Stages:*\n` +
          `• 📝 Briefing & Scripting: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('script') || (t.stage || '').toLowerCase().includes('brief')).length}*\n` +
          `• 🎬 Field Shoot: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('prod') || (t.stage || '').toLowerCase().includes('shoot')).length}*\n` +
          `• ✂️ Editing & FX: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('edit') || (t.stage || '').toLowerCase().includes('motion')).length}*\n` +
          `• 👁️ Client Review: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('client') || (t.stage || '').toLowerCase().includes('review')).length}*\n` +
          `• ✅ Approved: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('approved') || (t.stage || '').toLowerCase().includes('done')).length}*\n\n` +
          `⏳ *Open Manager Approvals:*\n` +
          `• 🌴 Pending Leave Reviews: *${pendingLeaves}*\n` +
          `• 💰 Pending T1 Expense Claims: *${pendingExpenses}*\n\n` +
          `🌐 Open Manager Portal: https://purpleos-iota.vercel.app/manager`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Command: /morning
      teamBot.onText(/\/morning/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || (dbData.team || [])[0];

        let text = `🌅 *9:00 AM DEPARTMENT MORNING BRIEFING*\n` +
          `📍 Department: *${emp.department || 'Operations'}*\n\n` +
          `📋 *Today's Production Schedule:*\n`;

        const todayTasks = (dbData.tasks || []).slice(0, 3);
        todayTasks.forEach((t, idx) => {
          text += `${idx + 1}. *${t.title}* (${t.client})\n   👤 Assignee: ${t.assignee} | 📌 Priority: ${t.priority}\n`;
        });

        text += `\nHave a productive shoot day! 🎬`;
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Handle Telegram 1-Tap Button Click Callbacks (callback_query)
      teamBot.on('callback_query', async (query) => {
        const queryId = query.id;
        const data = query.data || '';
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => e.telegramId == chatId) || { name: 'Line Manager' };

        let alertMsg = 'Action processed!';
        let statusBadge = `✅ Completed by ${emp.name}`;

        if (data.startsWith('approve_leave:')) {
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
            teamBot.sendMessage(chatId, `✅ *Leave ${leaveId} Manager Approved!*\nStatus set to *Manager Approved*. Forwarded to Owner for final sign-off.`, { parse_mode: 'Markdown' });
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
            teamBot.sendMessage(chatId, `❌ *Leave ${leaveId} Rejected by Line Manager.*\nStaff member notified via Telegram.`, { parse_mode: 'Markdown' });
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
            teamBot.sendMessage(chatId, `👑 *Leave ${leaveId} Owner Approved!*\nStaff attendance calendar updated.`, { parse_mode: 'Markdown' });
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
            teamBot.sendMessage(chatId, `💰 *Expense ${expId} Tier 2 Verified!*\nStatus set to *Tier 3 Pending*. Owner notified for final disbursement release.`, { parse_mode: 'Markdown' });
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
            teamBot.sendMessage(chatId, `🎉 *Expense ${expId} Disbursed & Paid!*\nStaff member notified.`, { parse_mode: 'Markdown' });
          }
        }

        // Disable inline buttons and replace with locked status badge
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
      clientBot = new TelegramBot(clientToken, { polling: !isVercel });

      if (isVercel) {
        fetch(`https://api.telegram.org/bot${clientToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${baseUrl}/api/webhooks/telegram?bot=client` })
        }).then(res => res.json()).then(data => {
          console.log(`📡 Client Bot Webhook status (${baseUrl}):`, data);
        }).catch(e => console.error('Error setting client webhook:', e));
      }

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

      clientBot.onText(/\/start|\/help/, (msg) => {
        const chatId = msg.chat.id;
        const welcome = `🤖 *Welcome to Purple Bot (Client B2B Assistant)!*\n\n` +
          `We assist agency clients with campaign status, deliverables & billing:\n` +
          `• /services - Browse agency packages & pricing\n` +
          `• /portfolio - View video & TVC campaign reel\n` +
          `• /review - Access Review Room V2 deliverable cuts\n` +
          `• /invoices - View invoice status & payment instructions`;
        
        const keyboard = {
          keyboard: [
            [{ text: '📱 Share Verified Phone Number', request_contact: true }]
          ],
          resize_keyboard: true
        };
        clientBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
      });

      clientBot.onText(/\/services/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        let text = `🎨 *Purplebot Digital Core Services Catalog:*\n\n`;
        (dbData.services || []).filter(s => s.public).forEach(s => {
          text += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n  ${s.description}\n\n`;
        });
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      clientBot.onText(/\/portfolio/, (msg) => {
        const chatId = msg.chat.id;
        const text = `📁 *Purplebot Digital Portfolio Showcase*\n\n` +
          `Explore our award-winning campaign portfolio:\n` +
          `🔗 https://purpleos-iota.vercel.app/`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      clientBot.onText(/\/review/, (msg) => {
        const chatId = msg.chat.id;
        const text = `🎬 *Review Room V2 Client Portal*\n\n` +
          `Stream & approve your campaign video cuts in 4K:\n` +
          `🔗 https://purpleos-iota.vercel.app/partners`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      clientBot.onText(/\/invoices/, (msg) => {
        const chatId = msg.chat.id;
        const text = `💳 *Invoice & Payment Verification Portal*\n\n` +
          `Verify & pay outstanding invoices via Bkash/Nagad or Bank Wire:\n` +
          `🔗 https://purpleos-iota.vercel.app/partners`;
        clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });
    } catch (err) {
      console.warn('⚠️ Client Bot Init Warning:', err.message);
    }
  }

  if (!teamBot && !clientBot) {
    console.log('ℹ️ No Telegram Bot Tokens active. In-app simulator will handle testing.');
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

  const options = { parse_mode: 'Markdown' };
  if (inlineKeyboard) {
    options.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  targetBot.sendMessage(targetChatId, text, options).catch(err => console.warn('Telegram send error:', err.message));
  return true;
}

function sendToGroup(chatId, text, isTeam = true) {
  return sendTelegramNotification(chatId, text, null, isTeam);
}

module.exports = {
  initBot,
  sendTelegramNotification,
  sendToGroup
};
