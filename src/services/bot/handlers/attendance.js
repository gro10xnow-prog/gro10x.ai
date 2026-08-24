/**
 * src/services/bot/handlers/attendance.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clock-In GPS, Clock-Out, and Personal Attendance Log Handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { supabase } = require('../../supabase');

async function handleLocationClockIn(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
            { text: '📍 Open Attendance Board (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=attendance' } }
          ]
        ]
      }
    };
    teamBot.sendMessage(chatId, `✅ *GPS Clock-In Verified for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, options);
  } catch (err) {
    console.error('[Attendance Bot] handleLocationClockIn error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Clock-in failed. Please try again.');
  }
}

async function handleTextClockIn(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
            { text: '📍 Open Attendance Board (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=attendance' } }
          ]
        ]
      }
    };
    teamBot.sendMessage(chatId, `✅ *Clock In Recorded for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, options);
  } catch (err) {
    console.error('[Attendance Bot] handleTextClockIn error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Clock-in failed. Please try again.');
  }
}

async function handleClockOut(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
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
            { text: '📱 View Shift Log (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=attendance' } }
          ]
        ]
      }
    };
    teamBot.sendMessage(chatId, `🚪 *Clock Out Recorded for ${emp.name}!*\nStatus set to *Offline* at ${result.time}. Have a great evening!`, options);
  } catch (err) {
    console.error('[Attendance Bot] handleClockOut error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Clock-out failed. Please try again.');
  }
}

async function handleMyAttendance(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

    const empCode = emp.emp_code || emp.id;
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empCode)
      .ilike('date', `${monthStr}%`)
      .order('date', { ascending: false });

    if (error) throw error;

    if (!records || records.length === 0) {
      return teamBot.sendMessage(chatId, `📅 *Your Attendance — ${monthName}*\n\nNo clock-in records logged this month. Use /clockin when arriving at studio!`, { parse_mode: 'Markdown' });
    }

    let reportMsg = `📅 *Your Attendance Log — ${monthName}*\n\n`;
    records.slice(0, 15).forEach(r => {
      const inTime = r.clock_in_time || '—';
      const outTime = r.clock_out_time || '—';
      const loc = r.location ? ` (${r.location})` : '';
      reportMsg += `• *${r.date}*: In ${inTime} | Out ${outTime}${loc}\n`;
    });

    reportMsg += `\n📊 *Total Active Days:* ${records.length} days`;
    teamBot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Attendance Bot] handleMyAttendance error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch attendance history.');
  }
}

module.exports = {
  handleLocationClockIn,
  handleTextClockIn,
  handleClockOut,
  handleMyAttendance
};
