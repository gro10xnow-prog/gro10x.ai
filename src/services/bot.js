const TelegramBot = require('node-telegram-bot-api');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');
const { processAutomationEvent } = require('./automation');
const { createTempPin } = require('./auth-pins');

let teamBot = null;
let clientBot = null;

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
    if (!emp.permanentPinSet) {
      return {
        keyboard: [
          [{ text: '🌐 I Completed Web Account Setup' }],
          [{ text: '🔑 View My Web Login PIN' }]
        ],
        resize_keyboard: true
      };
    }

    if (!emp.emergencyContact) {
      return {
        keyboard: [
          [{ text: '👤 Set Emergency Contact' }]
        ],
        resize_keyboard: true
      };
    }

    if (!emp.address) {
      return {
        keyboard: [
          [{ text: '🏠 Set Home Address' }]
        ],
        resize_keyboard: true
      };
    }

    if (!emp.bankInfo || (!emp.bankInfo.bankName && !emp.bankInfo.mfsNo)) {
      return {
        keyboard: [
          [{ text: '💳 Setup Bank & bKash Payouts' }]
        ],
        resize_keyboard: true
      };
    }

    if (isTechAdmin && !emp.onboardingTasks?.find(t => t.id === 'registerGroups')?.completed) {
      return {
        keyboard: [
          [{ text: '📡 Register Group Channel' }],
          [{ text: '📍 Submit First GPS Clock-In', request_location: true }]
        ],
        resize_keyboard: true
      };
    }

    if (!emp.status || emp.status === 'Offline') {
      return {
        keyboard: [
          [{ text: '📍 Submit First GPS Clock-In', request_location: true }]
        ],
        resize_keyboard: true
      };
    }
  }

  // All onboarding tasks complete -> Unlock Full Operational Menu!
  if (accessLevel === 'Owner / Admin') {
    if (isTechAdmin) {
      return {
        keyboard: [
          [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
          [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
          [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
          [{ text: '🛠️ Tech Diagnostics' }, { text: '🎓 Orientation' }],
          [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
        ],
        resize_keyboard: true
      };
    }
    return {
      keyboard: [
        [{ text: '🌅 Morning Briefing' }, { text: '📊 Business Snapshot' }],
        [{ text: '👥 Full Team Status' }, { text: '💰 Finance Summary' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Director / Manager') {
    return {
      keyboard: [
        [{ text: '👥 My Team Roster' }, { text: '📊 Department Report' }],
        [{ text: '🌅 Morning Briefing' }, { text: '📋 My Tasks' }],
        [{ text: '👤 My Profile' }, { text: '💳 Bank & bKash' }],
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Finance Manager') {
    return {
      keyboard: [
        [{ text: '💰 Expense Queue' }, { text: '🧾 Invoice Status' }],
        [{ text: '📊 Payroll Summary' }, { text: '👤 My Profile' }],
        [{ text: '💳 Bank & bKash' }, { text: '📍 Clock-In GPS', request_location: true }]
      ],
      resize_keyboard: true
    };
  }

  if (accessLevel === 'Office Staff') {
    return {
      keyboard: [
        [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }],
        [{ text: '👤 My Profile' }]
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

function initBot() {
  const db = readDB();

  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token;
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token;
  const rawUrl = process.env.PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : 'https://purpleos-iota.vercel.app');
  const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      const usePolling = Boolean(process.env.USE_POLLING);
      teamBot = new TelegramBot(teamToken, { polling: usePolling });

      if (!usePolling) {
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

      // 📱 TELEGRAM CONTACT VERIFICATION HANDLER (1-time phone link)
      teamBot.on('contact', (msg) => {
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

        // Link Telegram ID
        emp.telegramId = String(chatId);

        // Generate web temp PIN
        const pinRecord = createTempPin(emp.phone, emp.id, 'team', emp.email);

        writeDB(dbData);
        broadcast('team_update', dbData.team);

        const welcomeMsg = `✅ *Identity Verified as ${emp.name}!*\n\n` +
          `• Designation: *${emp.role}*\n` +
          `• Department: *${emp.department}*\n` +
          `• Access Level: *${emp.accessLevel}*\n\n` +
          `🔑 *Desktop Web Login PIN:* \`${pinRecord.pin}\`\n` +
          `🌐 *Web Portal:* https://purpleos-iota.vercel.app/auth\n\n` +
          `Your Telegram account is now linked. Tapping *Open App* will launch your role dashboard automatically without logging in again!`;

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
          '📍 Clock-In GPS', '🚪 Clock Out', '📋 My Tasks', '💰 My Earnings', '👥 My Team Roster', '📊 Department Report'
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
          }
        }
      });

      // /start or /help handler
      teamBot.onText(/\/start|\/help/, (msg) => {
        const chatId = msg.chat.id;
        userState[chatId] = null;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        if (emp) {
          const welcome = `🤖 *Welcome back, ${emp.name}!*\n\n` +
            `Role: *${emp.role}* (${emp.department})\n\n` +
            `Use the quick menu below or tap *Open App* to launch your dashboard.`;
          const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);
          teamBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        } else {
          const welcome = `🤖 *Welcome to Purple Man (Purplebot Digital Team Bot)!*\n\n` +
            `Please tap the button below to verify your phone number and link your PBD account.`;
          const keyboard = getRoleKeyboard('Specialist / Crew', false);
          teamBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: keyboard });
        }
      });

      // Reset PIN Command
      teamBot.onText(/\/resetpin/, (msg) => {
        const chatId = msg.chat.id;
        const dbData = readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        if (!emp) {
          return teamBot.sendMessage(chatId, `❌ Please verify your phone number first by tapping "Verify My Phone Number".`, { parse_mode: 'Markdown' });
        }

        const pinRecord = createTempPin(emp.phone, emp.id, 'team', emp.email);
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
          const pinRecord = createTempPin(emp.phone, emp.id, 'team', emp.email);
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
        const welcome = `🤖 *Welcome to Purple Bot (Client Assistant)!*\n\n` +
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
          `Explore our campaign portfolio:\n` +
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
  sendTelegramNotification,
  sendToGroup,
  getRoleKeyboard
};
