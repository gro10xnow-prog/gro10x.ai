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

async function handleBrandEmpireSummary(teamBot, msg) {
  const chatId = msg.chat.id;
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) {
    return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
  }

  const isOwnerAdmin = (emp.id === 'GRO-000' || emp.id === 'PBD-000' || emp.accessLevel === 'Owner / Admin' || (emp.role && emp.role.toLowerCase().includes('founder')) || (emp.role && emp.role.toLowerCase().includes('admin')));
  if (!isOwnerAdmin) {
    return teamBot.sendMessage(chatId, `🔒 Brand Empire Command is restricted to Founder / Executive Admin.`);
  }

  try {
    const { loadBrandsState } = require('../../../routes/brands');
    const brandsState = await loadBrandsState();
    const brands = brandsState.brands || [];
    const catalogMap = brandsState.productsCatalog || {};

    let totalLive = 0;
    let totalPending = 0;
    let totalDraft = 0;
    let totalTargetGross = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let todayOutputCount = 0;

    brands.forEach(b => {
      totalTargetGross += (b.target12mo || 0);
      const cat = catalogMap[b.id] || [];
      cat.forEach(p => {
        if (p.status === 'Live') totalLive++;
        else if (p.status === 'Pending Review') totalPending++;
        else totalDraft++;

        if (p.submittedAt && p.submittedAt.startsWith(todayStr)) {
          todayOutputCount++;
        }
      });
    });

    const totalFeesSpent = (totalLive * 0.20).toFixed(2);
    const portfolioCompletion = Math.min(100, Math.round((totalLive / 1300) * 100));

    let text = `👑 *GRO10X DIGITAL BRAND EMPIRE — EXECUTIVE SUMMARY*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏪 *Portfolio:* 13 Digital & POD Brands\n`;
    text += `🎯 *Target ARR:* $${totalTargetGross.toLocaleString()} USD\n`;
    text += `📦 *Catalog Status:* 🟢 *${totalLive} Live* · ⏳ *${totalPending} Pending QC* · 📦 *${totalDraft} Draft*\n`;
    text += `📊 *Portfolio Progress:* ${totalLive} / 1,300 Units (${portfolioCompletion}%)\n`;
    text += `⚡ *Today's DBM Output:* *${todayOutputCount} products submitted*\n`;
    text += `💵 *Etsy Listing Fees Logged:* $${totalFeesSpent} USD\n\n`;

    text += `*Division Snapshot:*\n`;
    brands.slice(0, 5).forEach((b, idx) => {
      const cat = catalogMap[b.id] || [];
      const live = cat.filter(p => p.status === 'Live').length;
      const pending = cat.filter(p => p.status === 'Pending Review').length;
      text += `${idx + 1}. *${b.name}:* ${live}/100 Live ${pending > 0 ? `(⏳ ${pending} in QC)` : ''}\n`;
    });
    if (brands.length > 5) {
      text += `_...and ${brands.length - 5} more brands in rollout pipeline._\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👉 *Action:* Open Web Admin Portal to review QC queue or manage stores:`;

    const buttons = [
      [
        { text: `📋 Open QC Review Queue (${totalPending})`, url: 'https://gro10x-ai.vercel.app/app#brands' }
      ],
      [
        { text: '🛍️ Brand Command Center', url: 'https://gro10x-ai.vercel.app/app#brands' },
        { text: '👤 DBM Operations', url: 'https://gro10x-ai.vercel.app/app#dbm' }
      ]
    ];

    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
  } catch (err) {
    console.error('[Brand Empire Summary Error]:', err.message);
    teamBot.sendMessage(chatId, `⚠️ Could not generate Brand Empire Summary: ${err.message}`);
  }
}

module.exports = {
  handleTechDiagnostics,
  handleFullTeamStatus,
  handleBrandEmpireSummary
};
