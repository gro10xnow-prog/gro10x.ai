const TelegramBot = require('node-telegram-bot-api');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');

let teamBot = null;
let clientBot = null;

function initBot() {
  const db = readDB();

  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token;
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token;
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://purpleos-iota.vercel.app';

  // 1. Initialize Team Bot (Purple Man)
  if (teamToken && teamToken.trim() !== '' && !teamToken.includes('your_token')) {
    try {
      const isVercel = Boolean(process.env.VERCEL);
      teamBot = new TelegramBot(teamToken, { polling: !isVercel });

      if (isVercel) {
        fetch(`https://api.telegram.org/bot${teamToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${baseUrl}/api/webhooks/telegram?bot=team` })
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
        const welcome = `🤖 *Welcome to Purple Man (Crew Ops Bot)!*\n\n` +
          `Commands for Purplebot Agency Crew:\n` +
          `• /clockin - Log Studio Clock-In\n` +
          `• /clockout - Log Studio Clock-Out\n` +
          `• /myearnings - Check monthly salary & shoot commissions\n` +
          `• /mybookings - View assigned shoot schedule\n` +
          `• /pair - Pair account with employee code or phone`;
        
        const keyboard = {
          keyboard: [
            [{ text: '📱 Share Verified Phone Number', request_contact: true }],
            [{ text: '📍 Share GPS Location for Clock-In', request_location: true }]
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
    } catch (err) {
      console.warn('⚠️ Team Bot Init Warning:', err.message);
    }
  }

  // 2. Initialize Client Bot (Purple Bot)
  if (clientToken && clientToken.trim() !== '' && !clientToken.includes('your_token')) {
    try {
      const isVercel = Boolean(process.env.VERCEL);
      clientBot = new TelegramBot(clientToken, { polling: !isVercel });

      if (isVercel) {
        fetch(`https://api.telegram.org/bot${clientToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `${baseUrl}/api/webhooks/telegram?bot=client` })
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
  const targetBot = isTeam ? (teamBot || clientBot) : (clientBot || teamBot);
  if (!targetBot) return false;
  const options = { parse_mode: 'Markdown' };
  if (inlineKeyboard) {
    options.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  targetBot.sendMessage(chatId, text, options).catch(err => console.warn('Telegram send error:', err.message));
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
