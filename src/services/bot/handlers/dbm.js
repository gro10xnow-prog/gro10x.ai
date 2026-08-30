/**
 * src/services/bot/handlers/dbm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Digital Brand Manager (DBM) Telegram Bot Handlers
 * Includes:
 * 1. 4-step interactive DBM Daily Standup Wizard (/dbmstandup)
 * 2. My Brands & Products Portfolio Viewer (/mybrands)
 * 3. DBM Incentive & Commission Ledger Summary (/dbmincentive)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';

const DBM_DIVISIONS = {
  1: {
    name: 'DBM 1 · Digital Products Specialist',
    brands: [
      { id: 1, name: 'PlannerQueenGro', niche: 'Productivity & Life Planning', target: '$24,200/yr', type: 'Digital' },
      { id: 5, name: 'InkWrapped', niche: 'Sublimation & Tumbler Craft Files', target: '$20,900/yr', type: 'Digital' },
      { id: 8, name: 'FiestaFoundry', niche: 'Events & Celebration Suites', target: '$21,250/yr', type: 'Digital' }
    ]
  },
  2: {
    name: 'DBM 2 · POD & Mixed Products Lead',
    brands: [
      { id: 2, name: 'WildMutt Co.', niche: 'Pet Lovers (Dogs, Cats, Pets)', target: '$33,540/yr', type: 'POD+Digital' },
      { id: 6, name: 'CozyThreads™', niche: 'Cottagecore & Aesthetic POD Apparel', target: '$23,200/yr', type: 'POD' },
      { id: 7, name: 'ProudProfessional', niche: 'Career Pride & Graduation Gifts', target: '$20,650/yr', type: 'POD+Digital' }
    ]
  },
  3: {
    name: 'DBM 3 · B2B & Education Products Lead',
    brands: [
      { id: 3, name: 'TinyDesks Studio', niche: 'B2B Templates & Solo Agency Systems', target: '$22,050/yr', type: 'Digital' },
      { id: 4, name: 'LittleStarsLearning', niche: 'Kids Early Education & Homeschool', target: '$17,850/yr', type: 'Digital' },
      { id: 9, name: 'ZenWallCo', niche: 'Printable Wall Art & Modern Home Décor', target: '$19,100/yr', type: 'Digital' }
    ]
  },
  4: {
    name: 'DBM 4 · Tech, Fonts & AI Vaults Lead',
    brands: [
      { id: 10, name: 'SparkSVG', niche: 'SVG Cut Files for Cricut & Laser', target: '$26,400/yr', type: 'Digital' },
      { id: 11, name: 'PageForge Publishing', niche: 'Amazon KDP Non-Fiction & Journals', target: '$33,716/yr', type: 'KDP' },
      { id: 12, name: 'LetterLab Fonts', niche: 'Commercial Font Bundles & Scripts', target: '$20,750/yr', type: 'Digital' },
      { id: 13, name: 'PromptVault', niche: 'Professional AI Prompt Systems & Vaults', target: '$74,560/yr', type: 'Digital' }
    ]
  }
};

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

    const dbmId = emp.dbmId || 1;
    const division = DBM_DIVISIONS[dbmId] || DBM_DIVISIONS[1];
    const brandButtons = division.brands.map(b => [{ text: b.name }]);
    brandButtons.push([{ text: '🌐 All My Brands' }, { text: '❌ Cancel' }]);

    await state.setSession(chatId, {
      action: 'await_dbm_brand',
      empId: emp.emp_code || emp.id,
      empName: emp.name,
      dbmId
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
      '_(Daily target: *8 listings* · 3 creation blocks)_\n\n' +
      'Reply with a number (e.g. 8, 6, 10):',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '8' }, { text: '6' }, { text: '4' }],
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
      return teamBot.sendMessage(chatId, '⚠️ Please reply with a valid number of listings (e.g. 8).');
    }

    const emoji = count >= 8 ? '🔥' : count >= 4 ? '⚡' : '📦';

    await state.setSession(chatId, {
      ...wizardState,
      action: 'await_dbm_revenue',
      listingsCount: count
    });

    return teamBot.sendMessage(
      chatId,
      '📋 *DBM DAILY STANDUP (Step 3/4)*\n\n' +
      emoji + ' Listings logged: *' + count + '/8* products today\n\n' +
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
    const emoji = listingsCount >= 8 ? '🏆' : listingsCount >= 4 ? '✅' : '📦';

    // Persist standup log to backend
    try {
      await axios.post(BASE_URL + '/api/brands/dbm-logs', {
        dbmId: wizardState.dbmId,
        empCode: wizardState.empId,
        empName: wizardState.empName,
        brand: wizardState.brand,
        listingsToday: listingsCount,
        revenueToday: revenue,
        notes,
        date: today
      }, {
        headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN || 'gro10x_internal_sync' },
        timeout: 5000
      });
    } catch (e) {
      console.warn('[DBM Standup] API persistence note:', e.message);
    }

    await state.clearSession(chatId);

    const { getRoleKeyboard } = require('../keyboards');
    const keyboard = getRoleKeyboard(emp.accessLevel, true, emp);

    const motivationText = listingsCount >= 8
      ? '🔥 *Outstanding work! You hit your full 8-listing daily target!*'
      : listingsCount >= 4
        ? '⚡ *Solid progress today! Halfway to full velocity.*'
        : '📌 *Log recorded. Let\'s aim for all 8 listings tomorrow!*';

    return teamBot.sendMessage(
      chatId,
      emoji + ' *DBM DAILY STANDUP RECORDED!*\n\n' +
      '📅 *' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + '*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '👤 *Brand Manager:* ' + wizardState.empName + '\n' +
      '🏪 *Primary Brand:* ' + wizardState.brand + '\n' +
      '📦 *Listings Published:* *' + listingsCount + '/8*\n' +
      '💵 *Daily Revenue:* *$' + revenue.toFixed(2) + ' USD*\n' +
      '📝 *Notes:* _' + notes + '_\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      motivationText + '\n\n' +
      '🌐 View live brand metrics: https://gro10x-ai.vercel.app/app#brands',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  }
}

/**
 * Renders the DBM's assigned brands portfolio overview
 */
async function handleMyBrands(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const dbmId = emp.dbmId || 1;
    const division = DBM_DIVISIONS[dbmId] || DBM_DIVISIONS[1];

    let responseText = '🛍️ *YOUR ASSIGNED BRANDS — ' + division.name + '*\n\n';
    responseText += '━━━━━━━━━━━━━━━━━━━━\n';

    division.brands.forEach((b, idx) => {
      responseText += '*' + (idx + 1) + '. ' + b.name + '* (' + b.type + ')\n';
      responseText += '   🎯 Niche: _' + b.niche + '_\n';
      responseText += '   💰 12-Mo Target: *' + b.target + '*\n\n';
    });

    responseText += '━━━━━━━━━━━━━━━━━━━━\n';
    responseText += '📋 *Daily Operating SOP (8 Hours):*\n';
    responseText += '• 🌅 *Block 1 (9AM–1PM):* 4 new product blueprints & vault deliverables\n';
    responseText += '• ⚡ *Block 2 (1PM–5PM):* 4 mockups, videos & SEO packages\n';
    responseText += '• 📝 *Block 3 (5PM–6PM):* QC submit & DBM daily standup\n\n';
    responseText += '🌐 *Open Brand Studio:* https://gro10x-ai.vercel.app/app#brands';

    teamBot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[DBM Brands] handleMyBrands error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Could not load brand portfolio.');
  }
}

/**
 * Renders the DBM's live incentive, commission rate, and tier status
 */
async function handleDBMIncentive(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified.');
    }

    const baseSalary = emp.base_salary || emp.baseSalary || 20000;
    const commRate = emp.commission_rate || emp.commissionRate || 10;

    const incentiveText =
      '💰 *YOUR DBM INCENTIVE & COMMISSION LEDGER*\n\n' +
      '👤 *Brand Manager:* ' + emp.name + ' (DBM ' + (emp.dbmId || 1) + ')\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '💵 *Base Salary:* BDT ' + baseSalary.toLocaleString() + ' / month\n' +
      '💸 *Sales Commission:* *' + commRate + '%* of gross revenue from your brands\n\n' +
      '🏆 *MONTHLY ACHIEVEMENT TIERS:*\n' +
      '• 🥉 *Bronze (80% target):* +3% gross monthly bonus\n' +
      '• 🥈 *Target Achieved (100%):* +4% gross monthly bonus\n' +
      '• 🥇 *Super Achiever (120%+):* +5% gross monthly bonus\n' +
      '• 🎁 *Mid-Month Surprise Bonus:* $35–$50 on 20th of each month\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '🌐 *View Full Live Ledger:* https://gro10x-ai.vercel.app/app#brands';

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
  handleDBMIncentive
};
