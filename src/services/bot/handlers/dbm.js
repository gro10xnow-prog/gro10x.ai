/**
 * src/services/bot/handlers/dbm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Digital Brand Manager (DBM) Telegram Bot Handlers
 * 
 * Includes:
 * 1. 4-step interactive DBM Daily Standup Wizard (/dbmstandup)
 * 2. My Brands & Products Portfolio Viewer (/mybrands)
 * 3. Today's Listing Queue Inspector (/todayqueue)
 * 4. DBM Live Status Snapshot (/mystatus)
 * 5. DBM Incentive & Commission Ledger Summary (/dbmincentive)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { loadBrandsState } = require('../../../routes/brands');
const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

/**
 * Initiates the 4-step DBM Daily Standup Wizard
 */
async function handleDBMStandup(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(
        chatId,
        '⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.',
        { parse_mode: 'Markdown' }
      );
    }

    const brandsState = await loadBrandsState();
    const dbmId = emp.dbmId || 1;
    const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || {
      id: dbmId,
      name: emp.name,
      assignedBrands: [1, 5, 8],
      dailyTarget: 8
    };

    const assignedBrandIds = dbmInfo.assignedBrands || [1, 5, 8];
    const assignedBrands = brandsState.brands.filter(b => assignedBrandIds.includes(b.id));

    const brandButtons = assignedBrands.map(b => [{ text: b.name }]);
    brandButtons.push([{ text: '🌐 All My Brands' }, { text: '❌ Cancel' }]);

    await state.setSession(chatId, {
      action: 'await_dbm_brand',
      empId: emp.emp_code || emp.id,
      empName: emp.name,
      dbmId,
      dailyTarget: Number(dbmInfo.dailyTarget || 8)
    });

    const firstName = (emp.name || 'Brand Manager').split(' ')[0];
    teamBot.sendMessage(
      chatId,
      '📋 *DBM DAILY STANDUP (Step 1/4)*\n\n' +
      'Hi ' + firstName + '! 👋\n\n' +
      'Which brand did you primarily focus on today?\n' +
      '_(Division: DBM ' + dbmId + ')_',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: brandButtons,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  } catch (err) {
    console.error('[DBM Standup] handleDBMStandup error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not start DBM standup. Please try again.');
  }
}

/**
 * Handles each step of the DBM Daily Standup Wizard
 */
async function handleDBMStandupWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const dailyTarget = wizardState.dailyTarget || 8;

  if (text.includes('Cancel') || text === '/cancel') {
    await state.clearSession(chatId);
    const { getRoleKeyboard } = require('../keyboards');
    return teamBot.sendMessage(
      chatId,
      '❌ DBM Standup cancelled.',
      { reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
    );
  }

  // Step 1 -> Step 2
  if (wizardState.action === 'await_dbm_brand') {
    await state.setSession(chatId, {
      ...wizardState,
      action: 'await_dbm_listings',
      brand: text
    });

    return teamBot.sendMessage(
      chatId,
      '📋 *DBM DAILY STANDUP (Step 2/4)*\n\n' +
      'Brand selected: *' + text + '* ✅\n\n' +
      '📦 *How many products did you design and list today?*\n' +
      '_(Daily target: *' + dailyTarget + ' listings* · 3 creation blocks)_\n\n' +
      'Reply with a number (e.g. ' + dailyTarget + ', 6, 10):',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: String(dailyTarget) }, { text: '6' }, { text: '4' }],
            [{ text: '10' }, { text: '12' }, { text: '2' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  }

  // Step 2 -> Step 3
  if (wizardState.action === 'await_dbm_listings') {
    const count = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(count) || count < 0) {
      return teamBot.sendMessage(chatId, '⚠️ Please reply with a valid number of listings (e.g. ' + dailyTarget + ').');
    }

    const emoji = count >= dailyTarget ? '🔥' : count >= (dailyTarget / 2) ? '⚡' : '📦';

    await state.setSession(chatId, {
      ...wizardState,
      action: 'await_dbm_revenue',
      listingsCount: count
    });

    return teamBot.sendMessage(
      chatId,
      '📋 *DBM DAILY STANDUP (Step 3/4)*\n\n' +
      emoji + ' Listings logged: *' + count + '/' + dailyTarget + '* products today\n\n' +
      '💵 *What is today\'s total revenue across your brands?*\n' +
      '_(Reply with $ amount, or 0 if store is in setup/no sales yet)_:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '$0' }, { text: '$15' }, { text: '$30' }],
            [{ text: '$50' }, { text: '$100' }, { text: '$200' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  }

  // Step 3 -> Step 4
  if (wizardState.action === 'await_dbm_revenue') {
    const cleanRev = text.replace(/[^0-9.]/g, '');
    const revenue = parseFloat(cleanRev) || 0;

    await state.setSession(chatId, {
      ...wizardState,
      action: 'await_dbm_notes',
      revenue
    });

    return teamBot.sendMessage(
      chatId,
      '📋 *DBM DAILY STANDUP (Step 4/4)*\n\n' +
      '💵 Revenue logged: *$' + revenue.toFixed(2) + ' USD*\n\n' +
      '📝 *Any blockers, challenges, or key product ideas for tomorrow?*\n' +
      '_(Reply with your notes, or type none if everything went smooth)_:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: 'None — All on track!' }],
            [{ text: 'Need more Canva template assets' }],
            [{ text: '❌ Cancel' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  }

  // Step 4 -> Complete & Save
  if (wizardState.action === 'await_dbm_notes') {
    const notes = text;
    const today = new Date().toISOString().split('T')[0];
    const listingsCount = wizardState.listingsCount || 0;
    const revenue = wizardState.revenue || 0;
    const emoji = listingsCount >= dailyTarget ? '🏆' : listingsCount >= (dailyTarget / 2) ? '✅' : '📦';
    const isBlocker = notes.toLowerCase().includes('blocker') || notes.toLowerCase().includes('issue') || notes.toLowerCase().includes('blocked');

    // Persist standup log to backend with EXACT contract field names
    try {
      await fetch(BASE_URL + '/api/brands/dbm-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': process.env.INTERNAL_API_TOKEN || 'gro10x_internal_sync'
        },
        body: JSON.stringify({
          dbmId: wizardState.dbmId,
          empCode: wizardState.empId,
          dbmName: wizardState.empName,
          brandName: wizardState.brand,
          listed: listingsCount,
          revenue: revenue,
          notes,
          isBlocker,
          date: today
        })
      });
    } catch (e) {
      console.warn('[DBM Standup] API persistence note:', e.message);
    }

    await state.clearSession(chatId);

    const { getRoleKeyboard } = require('../keyboards');
    const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);

    const motivationText = listingsCount >= dailyTarget
      ? '🔥 *Outstanding work! You hit your full ' + dailyTarget + '-listing daily target!*'
      : listingsCount >= (dailyTarget / 2)
        ? '⚡ *Solid progress today! Halfway to full velocity.*'
        : '📌 *Log recorded. Let\'s aim for all ' + dailyTarget + ' listings tomorrow!*';

    return teamBot.sendMessage(
      chatId,
      emoji + ' *DBM DAILY STANDUP RECORDED!*\n\n' +
      '📅 *' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + '*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '👤 *Brand Manager:* ' + wizardState.empName + '\n' +
      '🏪 *Primary Brand:* ' + wizardState.brand + '\n' +
      '📦 *Listings Published:* *' + listingsCount + '/' + dailyTarget + '*\n' +
      '💵 *Daily Revenue:* *$' + revenue.toFixed(2) + ' USD*\n' +
      '📝 *Notes:* _' + notes + '_\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      motivationText + '\n\n' +
      '🌐 View live brand metrics: https://gro10x-ai.vercel.app/dbm#workspace',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  }
}

/**
 * Renders the DBM's assigned brands portfolio overview with LIVE state
 */
async function handleMyBrands(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const brandsState = await loadBrandsState();
    const dbmId = emp.dbmId || 1;
    const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || {
      id: dbmId,
      name: emp.name,
      assignedBrands: [1, 5, 8],
      dailyTarget: 8
    };

    const assignedBrandIds = dbmInfo.assignedBrands || [1, 5, 8];
    const assignedBrands = brandsState.brands.filter(b => assignedBrandIds.includes(b.id));

    let responseText = '🛍️ *YOUR ASSIGNED BRANDS PORTFOLIO*\n';
    responseText += '👤 *' + emp.name + '* · DBM Division ' + dbmId + '\n\n';
    responseText += '━━━━━━━━━━━━━━━━━━━━\n';

    assignedBrands.forEach((b, idx) => {
      const catalog = brandsState.productsCatalog?.[b.id] || [];
      const liveCount = catalog.filter(p => p.status === 'Live').length;
      const pendingCount = catalog.filter(p => p.status === 'Pending Review').length;
      const remainingCount = Math.max(0, 100 - liveCount - pendingCount);

      responseText += '*' + (idx + 1) + '. ' + b.name + '* (' + (b.type || 'Digital') + ')\n';
      responseText += '   🎯 Niche: _' + b.niche + '_\n';
      responseText += '   📊 Status: 🟢 *' + liveCount + ' Live* · ⏳ *' + pendingCount + ' Pending* · 📦 *' + remainingCount + ' Draft*\n';
      responseText += '   💰 12-Mo Goal: *$' + Number(b.target12mo || 24000).toLocaleString() + '/yr*\n\n';
    });

    responseText += '━━━━━━━━━━━━━━━━━━━━\n';
    responseText += '📋 *Daily Operating SOP (' + (dbmInfo.dailyTarget || 8) + ' Products / Day):*\n';
    responseText += '• 🌅 *Block 1 (9AM–1PM):* 4 product blueprints & vault deliverables\n';
    responseText += '• ⚡ *Block 2 (1PM–5PM):* 4 mockups, videos & AI SEO packages\n';
    responseText += '• 📝 *Block 3 (5PM–6PM):* QC submit & DBM daily standup\n\n';
    responseText += '🌐 *Open DBM Portal:* https://gro10x-ai.vercel.app/dbm';

    teamBot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[DBM Brands] handleMyBrands error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not load brand portfolio.');
  }
}

/**
 * Renders Today's 8-SKU Listing Queue for immediate action
 */
async function handleTodayQueue(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const brandsState = await loadBrandsState();
    const dbmId = emp.dbmId || 1;
    const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || { assignedBrands: [1, 5, 8], dailyTarget: 8 };
    const activeBrandId = (dbmInfo.assignedBrands && dbmInfo.assignedBrands[0]) || 1;
    const activeBrand = brandsState.brands.find(b => b.id === activeBrandId) || brandsState.brands[0] || {};
    const catalog = brandsState.productsCatalog?.[activeBrand.id] || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const drafts = catalog.filter(p => {
      const isLive = p.status === 'Live';
      const isPending = p.status === 'Pending Review';
      const isSubmittedToday = p.submittedAt && p.submittedAt.startsWith(todayStr);
      return !isLive && !isPending && !isSubmittedToday;
    });
    const dailyTarget = dbmInfo.dailyTarget || 8;
    const todayBatch = drafts.slice(0, dailyTarget);
    const todaySubmitted = catalog.filter(p => p.submittedAt && p.submittedAt.startsWith(todayStr)).length;

    let text = '📦 *TODAY\'S LISTING QUEUE — ' + activeBrand.name + '*\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += '🎯 *Target Batch (' + todayBatch.length + ' of ' + dailyTarget + ' SKUs Remaining Today):*\n\n';

    if (todayBatch.length === 0) {
      if (todaySubmitted >= dailyTarget) {
        text += '🏆 *Daily quota complete! (' + todaySubmitted + '/' + dailyTarget + ' submitted today). Outstanding work!*\n\n';
      } else {
        text += '🎉 *All SKUs in ' + activeBrand.name + ' are submitted or live! Amazing work!*\n\n';
      }
    } else {
      todayBatch.forEach((p, idx) => {
        text += '*' + (idx + 1) + '. ' + p.code + ':* ' + (p.name || p.seoTitle || 'Digital Product').substring(0, 38) + '\n';
        text += '   📂 _' + (p.category || 'General') + '_ · 💵 *$' + Number(p.price || 7.49).toFixed(2) + ' USD*\n';
      });
      text += '\n';
    }

    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += '📊 *Today\'s Velocity:* ' + todaySubmitted + ' / ' + dailyTarget + ' Submitted\n';
    text += '🚀 *Next Action:* Launch Studio in DBM Portal:\n';
    text += 'https://gro10x-ai.vercel.app/dbm#studio';

    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[DBM TodayQueue] error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not load today\'s queue.');
  }
}

/**
 * Renders live DBM performance & status dashboard
 */
async function handleDBMMyStatus(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const brandsState = await loadBrandsState();
    const dbmId = emp.dbmId || 1;
    const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || { assignedBrands: [1, 5, 8], dailyTarget: 8 };
    const assignedBrandIds = dbmInfo.assignedBrands || [1, 5, 8];

    let totalLive = 0;
    let totalPending = 0;
    let totalRemaining = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let todaySubmitted = 0;

    assignedBrandIds.forEach(bId => {
      const cat = brandsState.productsCatalog?.[bId] || [];
      cat.forEach(p => {
        if (p.status === 'Live') totalLive++;
        else if (p.status === 'Pending Review') totalPending++;
        else totalRemaining++;

        if (p.submittedAt && p.submittedAt.startsWith(todayStr)) {
          todaySubmitted++;
        }
      });
    });

    const vaultBonus = (totalLive * 6.99).toFixed(2);
    const dailyTarget = dbmInfo.dailyTarget || 8;
    const progressPct = Math.min(100, Math.round((todaySubmitted / dailyTarget) * 100));

    const statusText =
      '📊 *YOUR LIVE DBM STATUS SNAPSHOT*\n' +
      '📅 *' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + '*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '👤 *Brand Manager:* ' + emp.name + ' (DBM ' + dbmId + ')\n\n' +
      '📦 *Today\'s Output:* *' + todaySubmitted + ' / ' + dailyTarget + '* (' + progressPct + '%)\n' +
      '⏳ *In Founder Review:* *' + totalPending + '* Products\n' +
      '🟢 *Live on Etsy Shops:* *' + totalLive + '* Listings\n' +
      '💰 *Vault Incentive Earned:* *$' + vaultBonus + ' USD*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🚀 *Quick Actions:*\n' +
      '• 🛍️ [Open DBM Workspace](https://gro10x-ai.vercel.app/dbm#workspace)\n' +
      '• 📝 [Submit EOD Standup](https://gro10x-ai.vercel.app/dbm#standup)';

    teamBot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[DBM Status] error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not load status.');
  }
}

/**
 * Renders the DBM's live incentive, commission rate, and tier status with LIVE data
 */
async function handleDBMIncentive(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const brandsState = await loadBrandsState();
    const dbmId = emp.dbmId || 1;
    const dbmInfo = brandsState.dbms?.find(d => d.id === dbmId) || { assignedBrands: [1, 5, 8] };
    const assignedBrandIds = dbmInfo.assignedBrands || [1, 5, 8];

    let totalLive = 0;
    assignedBrandIds.forEach(bId => {
      const cat = brandsState.productsCatalog?.[bId] || [];
      totalLive += cat.filter(p => p.status === 'Live').length;
    });

    const baseSalary = emp.base_salary || emp.baseSalary || 20000;
    const commRate = emp.commission_rate || emp.commissionRate || 10;
    const vaultBonus = (totalLive * 6.99).toFixed(2);

    const incentiveText =
      '💰 *YOUR DBM INCENTIVE & COMMISSION LEDGER*\n\n' +
      '👤 *Brand Manager:* ' + emp.name + ' (DBM ' + dbmId + ')\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '💵 *Base Retainer:* BDT ' + baseSalary.toLocaleString() + ' / month\n' +
      '🎁 *Live Vault Bonus ($6.99/ea):* *$' + vaultBonus + ' USD* (' + totalLive + ' Live)\n' +
      '💸 *Gross Sales Commission:* *' + commRate + '%* of brand revenue\n\n' +
      '🏆 *MONTHLY ACHIEVEMENT TIERS:*\n' +
      '• 🥉 *Bronze (80% target):* +3% gross monthly bonus\n' +
      '• 🥈 *Target Achieved (100%):* +4% gross monthly bonus\n' +
      '• 🥇 *Super Achiever (120%+):* +5% gross monthly bonus\n' +
      '• 🎁 *Mid-Month Surprise Bonus:* $35–$50 on 20th of each month\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🌐 *View Full Live Ledger:* https://gro10x-ai.vercel.app/dbm#output';

    teamBot.sendMessage(chatId, incentiveText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[DBM Incentive] handleDBMIncentive error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not load incentive data.');
  }
}

module.exports = {
  handleDBMStandup,
  handleDBMStandupWizardStep,
  handleMyBrands,
  handleTodayQueue,
  handleDBMMyStatus,
  handleDBMIncentive
};
