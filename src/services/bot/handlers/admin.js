/**
 * src/services/bot/handlers/admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tech Diagnostics and Full Team Roster Handlers (Admin Only).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');

async function handleTechDiagnostics(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
  }

  const isTechAdmin = (emp.id === 'PBD-000' || emp.role === 'Technology Admin');
  if (!isTechAdmin && emp.accessLevel !== 'Owner / Admin') {
    return teamBot.sendMessage(chatId, `🔒 Tech Diagnostics is restricted to Admin personnel.`);
  }

  const text = `🛠️ *GRO10X SYSTEM DIAGNOSTICS*\n\n` +
    `• Node.js Version: \`${process.version}\`\n` +
    `• Server Uptime: \`${Math.round(process.uptime() / 60)} minutes\`\n` +
    `• Memory Usage (RSS): \`${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB\`\n` +
    `• Node Heap Used: \`${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\`\n` +
    `• Supabase Status: \`${isSupabaseConfigured() ? '🟢 CONNECTED' : '🟡 LOCAL / IN-MEMORY'}\`\n` +
    `• Server Environment: \`${process.env.NODE_ENV || 'production'}\`\n` +
    `• Active Event Streams: \`${getClientCount()} clients connected\`\n` +
    `• Timestamp: \`${new Date().toISOString()}\``;

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleFullTeamStatus(teamBot, msg) {
  const chatId = msg.chat.id;
  const allTeam = await state.getAllTeam();

  let text = `👥 *GRO10X FULL TEAM STATUS (${allTeam.length} Members):*\n\n`;
  allTeam.forEach((m, idx) => {
    const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : (m.status === 'On Leave' ? '🌴' : '⬛'));
    text += `${idx + 1}. *${m.name}*\n   Role: ${m.role} (${m.department || 'General'})\n   ${statusIcon} Status: *${m.status || 'Offline'}*\n\n`;
  });

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

module.exports = {
  handleTechDiagnostics,
  handleFullTeamStatus
};
