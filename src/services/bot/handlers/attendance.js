/**
 * src/services/bot/handlers/attendance.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clock-In GPS and Clock-Out Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');

async function handleLocationClockIn(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
  }

  const clockResult = await state.clockIn(emp.emp_code, emp.name, 'GPS Verified Location');
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📍 Open Attendance Board (Mini App)', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=attendance' } }
        ]
      ]
    }
  };
  teamBot.sendMessage(chatId, `✅ *GPS Clock-In Verified for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, options);
}

async function handleTextClockIn(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
  }

  const clockResult = await state.clockIn(emp.emp_code, emp.name, 'Niketon Studio');
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📍 Open Attendance Board (Mini App)', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=attendance' } }
        ]
      ]
    }
  };
  teamBot.sendMessage(chatId, `✅ *Clock In Recorded for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, options);
}

async function handleClockOut(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
  }

  const result = await state.clockOut(emp.emp_code);
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📱 View Shift Log (Mini App)', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp?tab=attendance' } }
        ]
      ]
    }
  };
  teamBot.sendMessage(chatId, `🚪 *Clock Out Recorded for ${emp.name}!*\nStatus set to *Offline* at ${result.time}. Have a great evening!`, options);
}

module.exports = {
  handleLocationClockIn,
  handleTextClockIn,
  handleClockOut
};
