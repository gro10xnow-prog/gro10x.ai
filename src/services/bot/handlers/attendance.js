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
  teamBot.sendMessage(chatId, `✅ *GPS Clock-In Verified for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, { parse_mode: 'Markdown' });
}

async function handleTextClockIn(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
  }

  const clockResult = await state.clockIn(emp.emp_code, emp.name, 'Niketon Studio');
  teamBot.sendMessage(chatId, `✅ *Clock In Recorded for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, { parse_mode: 'Markdown' });
}

async function handleClockOut(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
  }

  await state.clockOut(emp.emp_code);
  teamBot.sendMessage(chatId, `🚪 *Clock Out Recorded for ${emp.name}!*\nStatus set to *Offline*. Have a great evening!`, { parse_mode: 'Markdown' });
}

module.exports = {
  handleLocationClockIn,
  handleTextClockIn,
  handleClockOut
};
