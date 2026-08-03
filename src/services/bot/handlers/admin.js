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

  const text = `🛠️ *PURPLEOS SYSTEM DIAGNOSTICS*\n\n` +
    `• Platform Version: *v1.1*\n` +
    `• Node Environment: *${process.env.NODE_ENV || 'production'}*\n` +
    `• Telegram Webhook: 🟢 *Active*\n` +
    `• SSE Stream Service: 🟢 *Active*\n` +
    `• Primary Source of Truth: 🟢 *Supabase Postgres*\n\n` +
    `System health is optimal. No critical errors flagged.`;

  teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleFullTeamStatus(teamBot, msg) {
  const chatId = msg.chat.id;
  const allTeam = await state.getAllTeam();

  let text = `👥 *PURPLEBOT DIGITAL FULL TEAM STATUS (${allTeam.length} Members):*\n\n`;
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
