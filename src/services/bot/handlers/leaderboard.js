/**
 * src/services/bot/handlers/leaderboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Leaderboard Command Handler (/leaderboard).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

async function handleLeaderboard(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified.`);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('name, xp, badge, role, emp_code')
      .order('xp', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return teamBot.sendMessage(chatId, `🏆 *Team XP Leaderboard*\n\nNo profiles found.`, { parse_mode: 'Markdown' });
    }

    let boardMsg = `🏆 *GRO10X — TOP 10 LEADERBOARD*\n\n`;
    const medals = ['🥇', '🥈', '🥉'];

    profiles.forEach((p, idx) => {
      const rankIcon = medals[idx] || `${idx + 1}.`;
      const xpVal = Number(p.xp) || 0;
      const badge = p.badge || '🌱 Recruit';
      const isSelf = (p.emp_code === emp.emp_code) ? ' *(You)*' : '';
      boardMsg += `${rankIcon} *${p.name}*${isSelf}\n   └ ${xpVal.toLocaleString()} XP • ${badge}\n\n`;
    });

    boardMsg += `_Earn XP: Complete Tasks (+15 XP) · Submit EOD (+10 XP) · Onboarding Milestones (+100–200 XP)_\n\n` +
      `🔥 _Open the Web Leaderboard for live EOD streaks and department filters!_`;

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🏆 Full Agency Leaderboard', web_app: { url: 'https://gro10x-ai.vercel.app/crew#leaderboard' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, boardMsg, options);
  } catch (err) {
    console.error('[Leaderboard Bot] handleLeaderboard error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not fetch team leaderboard.');
  }
}

module.exports = {
  handleLeaderboard
};
