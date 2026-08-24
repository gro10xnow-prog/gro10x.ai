const { supabase } = require('../../supabase');
const state = require('../../state');

async function isFinanceAuthorized(chatId) {
  const emp = await state.getEmployeeByTelegramId(chatId);
  if (!emp) return false;
  const role = (emp.role || '').toLowerCase();
  const access = (emp.accessLevel || emp.access_level || '').toLowerCase();
  return (
    access.includes('owner') ||
    access.includes('admin') ||
    access.includes('manager') ||
    role.includes('finance') ||
    role.includes('managing director') ||
    role.includes('chairman')
  );
}

async function handleLogExpenseEntry(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    if (!(await isFinanceAuthorized(chatId))) {
      return teamBot.sendMessage(chatId, '🔒 *Access Denied:* Expense tracking is restricted to Finance & Management.', { parse_mode: 'Markdown' });
    }

    const { data: expenses, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    
    const expList = expenses || [];
    const pendingCount = expList.filter(e => e.status === 'Pending' || !e.tier1?.approved).length;
    const todayCount = expList.filter(e => {
      const d = new Date(e.createdAt || '');
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;

    let text = `🧾 *EXPENSE ENTRY LOG*\n\n` +
      `• Total Entries: *${expList.length}*\n` +
      `• Pending Approval: *${pendingCount}*\n` +
      `• Logged Today: *${todayCount}*\n\n` +
      `_Use the web portal to log new entries:_\n` +
      `🌐 https://purpleos-iota.vercel.app/admin`;
    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in handleLogExpenseEntry:', err);
    teamBot.sendMessage(chatId, '❌ Error fetching expenses.');
  }
}

async function handleInvoiceTracker(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    if (!(await isFinanceAuthorized(chatId))) {
      return teamBot.sendMessage(chatId, '🔒 *Access Denied:* Invoicing is restricted to Finance & Management.', { parse_mode: 'Markdown' });
    }

    const { data: invoices, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    const invList = invoices || [];
    const paid = invList.filter(i => i.status === 'Paid');
    const draft = invList.filter(i => i.status === 'Draft');
    const overdue = invList.filter(i => i.status === 'Overdue');

    let text = `📋 *INVOICE TRACKER*\n\n` +
      `• ✅ Paid: *${paid.length}* (BDT ${paid.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()})\n` +
      `• 📝 Draft: *${draft.length}* (BDT ${draft.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()})\n` +
      `• ⚠️ Overdue: *${overdue.length}*\n\n`;

    if (invList.length > 0) {
      text += `*Recent Invoices:*\n`;
      invList.slice(0, 5).forEach((inv, i) => {
        const icon = inv.status === 'Paid' ? '✅' : (inv.status === 'Draft' ? '📝' : '⚠️');
        text += `${i + 1}. ${icon} *${inv.invoiceId || inv.id}* — ${inv.clientName || 'Client'} — BDT ${(inv.amount || 0).toLocaleString()}\n`;
      });
    }
    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in handleInvoiceTracker:', err);
    teamBot.sendMessage(chatId, '❌ Error fetching invoices.');
  }
}

async function handlePaymentFollowUp(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    if (!(await isFinanceAuthorized(chatId))) {
      return teamBot.sendMessage(chatId, '🔒 *Access Denied:* Payment tracking is restricted to Finance & Management.', { parse_mode: 'Markdown' });
    }

    const { data: invoices, error } = await supabase.from('invoices').select('*').neq('status', 'Paid');
    if (error) throw error;
    
    const unpaid = invoices || [];
    let text = `💰 *PAYMENT FOLLOW-UP QUEUE*\n\n`;
    
    if (unpaid.length === 0) {
      text += `✅ All invoices are paid! No follow-ups needed.`;
    } else {
      unpaid.forEach((inv, i) => {
        const daysSince = inv.createdAt ? Math.floor((Date.now() - new Date(inv.createdAt)) / 86400000) : 0;
        text += `${i + 1}. *${inv.invoiceId || inv.id}*\n`;
        text += `   Client: ${inv.clientName || 'N/A'} | Amount: BDT ${(inv.amount || 0).toLocaleString()}\n`;
        text += `   Status: *${inv.status}* | Days Since Created: *${daysSince}*\n\n`;
      });
    }
    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in handlePaymentFollowUp:', err);
    teamBot.sendMessage(chatId, '❌ Error fetching payment follow-ups.');
  }
}

module.exports = {
  handleLogExpenseEntry,
  handleInvoiceTracker,
  handlePaymentFollowUp
};
