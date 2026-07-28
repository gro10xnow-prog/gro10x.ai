const TelegramBot = require('node-telegram-bot-api');
const { readDB, writeDB } = require('./db');
const { broadcast } = require('./sse');

let bot = null;

function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === '' || token.includes('your_telegram_bot_token')) {
    console.log('ℹ️ No Telegram Bot Token configured. Telegram Bot Long-Polling skipped.');
    console.log('💡 In-app Telegram Simulator widget will handle bot interactions for testing.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    console.log('🚀 Telegram Bot initialized with Long Polling active!');

    // Commands setup
    bot.onText(/\/start|\/help/, (msg) => {
      const chatId = msg.chat.id;
      const welcome = `🤖 *Welcome to Purplebot Operations Assistant!*\n\n` +
        `Use the commands below to interact with PurpleOS:\n` +
        `• /myearnings - Check monthly salary & shoot commissions\n` +
        `• /mybookings - View assigned shoot schedule\n` +
        `• /services - Fetch public service package links & pricing\n` +
        `• /portfolio - Get public portfolio showcase link\n` +
        `• /clockin - Log attendance (Clock In)\n` +
        `• /clockout - Log attendance (Clock Out)`;
      bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/myearnings/, (msg) => {
      const chatId = msg.chat.id;
      const db = readDB();
      const emp = db.team.find(e => e.telegramId == chatId) || db.team[1]; // default fallback
      const total = emp.baseSalary + emp.earnedCommissions;
      const message = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
        `• Role: ${emp.role}\n` +
        `• Base Pay: BDT ${emp.baseSalary.toLocaleString()}\n` +
        `• Booking Commissions: BDT ${emp.earnedCommissions.toLocaleString()}\n` +
        `-----------------------------------------\n` +
        `*Total Monthly Pay: BDT ${total.toLocaleString()}*`;
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/mybookings/, (msg) => {
      const chatId = msg.chat.id;
      const db = readDB();
      const emp = db.team.find(e => e.telegramId == chatId) || db.team[1];
      const tasks = db.tasks.filter(t => t.assignee.toLowerCase().includes(emp.name.split(' ')[0].toLowerCase()));
      
      let message = `📅 *Assigned Shoots & Tasks for ${emp.name}:*\n\n`;
      if (tasks.length === 0) {
        message += `No active shoot assignments found.`;
      } else {
        tasks.forEach((t, index) => {
          message += `${index + 1}. *${t.title}*\n   Client: ${t.client}\n   Stage: ${t.stage}\n   Due: ${t.dueDate}\n\n`;
        });
      }
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/services/, (msg) => {
      const chatId = msg.chat.id;
      const db = readDB();
      let text = `🎨 *Purplebot Digital Core Services Catalog:*\n\n`;
      db.services.filter(s => s.public).forEach(s => {
        text += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n  ${s.description}\n\n`;
      });
      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/portfolio/, (msg) => {
      const chatId = msg.chat.id;
      const text = `📁 *Purplebot Digital Portfolio Showcase*\n\n` +
        `Explore our award-winning work across FMCG, Banking, Food & TVC campaigns:\n` +
        `🔗 http://www.purplebot.co`;
      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/clockin/, (msg) => {
      const chatId = msg.chat.id;
      const db = readDB();
      const emp = db.team.find(e => e.telegramId == chatId) || db.team[0];
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let record = db.attendance.find(a => a.name === emp.name);
      if (record) {
        record.status = 'In Studio';
        record.clockInTime = timeStr;
      } else {
        db.attendance.push({
          employeeId: emp.id,
          name: emp.name,
          status: 'In Studio',
          clockInTime: timeStr,
          location: 'Gulshan Studio'
        });
      }
      writeDB(db);
      broadcast('attendance_update', db.attendance);
      
      bot.sendMessage(chatId, `✅ *Clock In Recorded!*\nStatus set to *In Studio* at ${timeStr}. Dashboard updated.`, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/clockout/, (msg) => {
      const chatId = msg.chat.id;
      const db = readDB();
      const emp = db.team.find(e => e.telegramId == chatId) || db.team[0];
      
      let record = db.attendance.find(a => a.name === emp.name);
      if (record) {
        record.status = 'Clocked Out';
      }
      writeDB(db);
      broadcast('attendance_update', db.attendance);
      
      bot.sendMessage(chatId, `🚪 *Clock Out Recorded!*\nStatus set to *Clocked Out*. Have a great evening!`, { parse_mode: 'Markdown' });
    });

    // Callback queries for inline keyboard buttons
    bot.on('callback_query', (query) => {
      const data = query.data;
      const db = readDB();

      if (data.startsWith('accept_task:')) {
        const taskId = data.split(':')[1];
        const task = db.tasks.find(t => t.id === taskId);
        if (task) {
          task.stage = 'Confirmed';
          writeDB(db);
          broadcast('task_update', db.tasks);
          bot.answerCallbackQuery(query.id, { text: `Shoot assignment ${taskId} accepted!` });
          bot.editMessageText(`✅ *Assignment Accepted!*\n\nShoot Task: ${task.title}\nStatus: Confirmed`, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown'
          });
        }
      } else if (data.startsWith('resolve_comment:')) {
        const commentId = data.split(':')[1];
        let foundComment = null;
        db.reviews.forEach(r => {
          const c = r.comments.find(item => item.id === commentId);
          if (c) {
            c.resolved = true;
            r.resolvedCount = r.comments.filter(x => x.resolved).length;
            foundComment = c;
          }
        });
        if (foundComment) {
          writeDB(db);
          broadcast('review_update', db.reviews);
          bot.answerCallbackQuery(query.id, { text: `Review comment resolved!` });
          bot.editMessageText(`✅ *Review Feedback Resolved!*\n\nComment: "${foundComment.text}"\nStatus: Marked as Resolved`, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown'
          });
        }
      }
    });

  } catch (err) {
    console.error('Error starting Telegram bot:', err.message);
  }
}

function sendTelegramNotification(chatId, text, inlineKeyboard = null) {
  if (!bot) return false;
  const options = { parse_mode: 'Markdown' };
  if (inlineKeyboard) {
    options.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  bot.sendMessage(chatId, text, options);
  return true;
}

module.exports = {
  initBot,
  sendTelegramNotification
};
