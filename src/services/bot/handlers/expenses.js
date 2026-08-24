/**
 * src/services/bot/handlers/expenses.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Submit Expense Claim Interactive Wizard Handler.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { broadcast } = require('../../sse');
const { getRoleKeyboard } = require('../keyboards');

async function handleInitExpense(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please send your contact via the Verify button first.`, { parse_mode: 'Markdown' });

    const sess = { action: 'await_expense_amount', empId: emp.emp_code, empName: emp.name };
    await state.setSession(chatId, sess);

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Open Expense Form (Mini App)', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=expense&action=new' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId,
      `🧾 *EXPENSE CLAIM SUBMISSION*\n\n` +
      `Tap **Open Expense Form** below for full Mini App form (category picker, date & receipt upload).\n\n` +
      `_Or simply reply here with the expense amount in BDT (e.g. \`1500\`):_`,
      options
    );
  } catch (err) {
    console.error('[Expenses Bot] handleInitExpense error:', err.message);
    await state.clearSession(chatId).catch(() => {});
    teamBot.sendMessage(chatId, '⚠️ Could not start expense wizard. Please try again.');
  }
}

async function handleExpenseWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  try {
    if (wizardState.action === 'await_expense_amount') {
      const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(amount) || amount <= 0) {
        return teamBot.sendMessage(chatId, `⚠️ Please enter a valid amount (e.g. \`1500\`).`, { parse_mode: 'Markdown' });
      }
      const nextState = { ...wizardState, amount, action: 'await_expense_category' };
      await state.setSession(chatId, nextState);
      return teamBot.sendMessage(chatId,
        `💰 Amount: *BDT ${amount.toLocaleString()}*\n\nNow please select or reply with the *category* (1-8):\n\n` +
        `1️⃣ Transport / Ride Share\n` +
        `2️⃣ Meals & Team Food\n` +
        `3️⃣ Studio & Shoot Supplies\n` +
        `4️⃣ Hardware / Gear Rental\n` +
        `5️⃣ Internet / Mobile Data\n` +
        `6️⃣ Software / AI Tools\n` +
        `7️⃣ Client Hospitality\n` +
        `8️⃣ Other Operating Expense\n\n` +
        `_Reply with number (1-8) or type category name:_`,
        { parse_mode: 'Markdown' }
      );
    }

    if (wizardState.action === 'await_expense_category') {
      const categories = {
        '1': 'Transport / Ride Share',
        '2': 'Meals & Team Food',
        '3': 'Studio & Shoot Supplies',
        '4': 'Hardware / Gear Rental',
        '5': 'Internet / Mobile Data',
        '6': 'Software / AI Tools',
        '7': 'Client Hospitality',
        '8': 'Other Operating Expense'
      };
      const category = categories[text] || text;

      const submittedExpense = await state.submitExpense(emp.emp_code, emp.name, {
        amount: wizardState.amount,
        category,
        description: `Expense submitted via Bot (${category})`
      });

      await state.clearSession(chatId);
      try { broadcast('expense_update', [submittedExpense]); } catch (e) {}

      // Notify Line Manager / Finance Lead via Telegram DM
      try {
        const managerIdOrCode = emp.reportsTo || 'PBD-029';
        const manager = (typeof state.getEmployeeByIdOrCode === 'function')
          ? await state.getEmployeeByIdOrCode(managerIdOrCode)
          : (typeof state.getEmployeeByCode === 'function' && managerIdOrCode.startsWith('PBD'))
            ? await state.getEmployeeByCode(managerIdOrCode)
            : await state.getEmployeeByTelegramId(managerIdOrCode);

        if (manager && (manager.telegramId || manager.telegram_id)) {
          const targetTgId = manager.telegramId || manager.telegram_id;
          teamBot.sendMessage(targetTgId,
            `💸 *NEW EXPENSE CLAIM SUBMITTED*\n\n` +
            `• From: *${emp.name}*\n` +
            `• Amount: *৳${wizardState.amount.toLocaleString()} BDT*\n` +
            `• Category: *${category}*\n` +
            `• Status: *Pending Tier-1 Line Review*\n\n` +
            `_Tap below for 1-click review:_`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: `✅ Line Approve ৳${wizardState.amount.toLocaleString()}`, callback_data: `approve_expense_t1:${submittedExpense?.id || ''}` },
                    { text: `❌ Decline`, callback_data: `reject_expense_t1:${submittedExpense?.id || ''}` }
                  ]
                ]
              }
            }
          ).catch(() => {});
        }
      } catch (e) {}

      return teamBot.sendMessage(chatId,
        `✅ *Expense Claim Submitted!*\n\n` +
        `• Amount: *BDT ${wizardState.amount.toLocaleString()}*\n` +
        `• Category: *${category}*\n` +
        `• Status: *Pending Tier-1 Approval*\n\n` +
        `Your claim has been logged to Supabase for line manager review.`,
        { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
      );
    }
  } catch (err) {
    console.error('[Expenses Bot] handleExpenseWizardStep error:', err.message);
    await state.clearSession(chatId).catch(() => {});
    teamBot.sendMessage(chatId, '⚠️ Failed to submit expense claim. Please try again.');
  }
}

module.exports = {
  handleInitExpense,
  handleExpenseWizardStep
};
