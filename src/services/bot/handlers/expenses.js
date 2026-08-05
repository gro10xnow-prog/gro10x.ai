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
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please send your contact via the Verify button first.`, { parse_mode: 'Markdown' });

  const sess = { action: 'await_expense_amount', empId: emp.emp_code, empName: emp.name };
  await state.setSession(chatId, sess);

  teamBot.sendMessage(chatId,
    `🧾 *EXPENSE CLAIM SUBMISSION*\n\n` +
    `Please reply with the *expense amount in BDT*:\n` +
    `(e.g. \`1500\`)`,
    { parse_mode: 'Markdown' }
  );
}

async function handleExpenseWizardStep(teamBot, msg, wizardState, emp) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (wizardState.action === 'await_expense_amount') {
    const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      return teamBot.sendMessage(chatId, `⚠️ Please enter a valid amount (e.g. \`1500\`).`, { parse_mode: 'Markdown' });
    }
    const nextState = { ...wizardState, amount, action: 'await_expense_category' };
    await state.setSession(chatId, nextState);
    return teamBot.sendMessage(chatId,
      `💰 Amount: *BDT ${amount.toLocaleString()}*\n\nNow please reply with the *category*:\n\n` +
      `1️⃣ Transport\n2️⃣ Food & Meals\n3️⃣ Office Supplies\n4️⃣ Client Entertainment\n5️⃣ Other\n\nReply with \`1\`-\`5\` or type custom category`,
      { parse_mode: 'Markdown' }
    );
  }

  if (wizardState.action === 'await_expense_category') {
    const categories = { '1': 'Transport', '2': 'Food & Meals', '3': 'Office Supplies', '4': 'Client Entertainment', '5': 'Other' };
    const category = categories[text] || text;

    const submittedExpense = await state.submitExpense(emp.emp_code, emp.name, {
      amount: wizardState.amount,
      category,
      description: `Expense submitted via Bot (${category})`
    });

    await state.clearSession(chatId);
    try { broadcast('expense_update', [submittedExpense]); } catch (e) {}

    return teamBot.sendMessage(chatId,
      `✅ *Expense Claim Submitted!*\n\n` +
      `• Amount: *BDT ${wizardState.amount.toLocaleString()}*\n` +
      `• Category: *${category}*\n` +
      `• Status: *Pending Tier-1 Approval*\n\n` +
      `Your claim has been logged to Supabase for line manager review.`,
      { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
    );
  }
}

module.exports = {
  handleInitExpense,
  handleExpenseWizardStep
};
