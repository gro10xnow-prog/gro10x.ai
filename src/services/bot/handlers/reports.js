const { supabase } = require('../../supabase');
const state = require('../../state');

async function handleClientStatus(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, `❌ Please verify your phone number first.`);
    }

    const role = (emp.role || '').toLowerCase();
    const access = (emp.accessLevel || emp.access_level || '').toLowerCase();
    const isAuth = (
      access.includes('owner') ||
      access.includes('admin') ||
      access.includes('manager') ||
      role.includes('client services') ||
      role.includes('growth') ||
      role.includes('finance') ||
      role.includes('managing director') ||
      role.includes('chairman')
    );

    if (!isAuth) {
      return teamBot.sendMessage(chatId, `🔒 *Access Denied:* Client portfolio reporting is restricted to Account Managers & Leadership.`, { parse_mode: 'Markdown' });
    }

    const [
      { data: clients },
      { data: tasks },
      { data: invoices }
    ] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('invoices').select('*')
    ]);

    const clientsList = clients || [];
    const tasksList = tasks || [];
    const invoicesList = invoices || [];

    let text = `🎬 *CLIENT PORTFOLIO STATUS*\n\n`;

    if (clientsList.length === 0) {
      text += `No active retainer clients in the system yet.\n\n`;
      text += `*Task Pipeline Overview:*\n`;
      const stages = ['Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Published'];
      stages.forEach(s => {
        const count = tasksList.filter(t => (t.stage || '') === s).length;
        if (count > 0) text += `   • ${s}: *${count} tasks*\n`;
      });
      if (tasksList.length === 0) text += `   No active tasks.\n`;
    } else {
      clientsList.forEach((c, i) => {
        const clientTasks = tasksList.filter(t => (t.client || '').toLowerCase().includes((c.name || '').toLowerCase()));
        const clientInvoices = invoicesList.filter(inv => (inv.clientName || '').toLowerCase().includes((c.name || '').toLowerCase()));
        const unpaid = clientInvoices.filter(inv => inv.status !== 'Paid').length;
        text += `${i + 1}. *${c.name}* (${c.industry || 'General'})\n`;
        text += `   📋 Active Tasks: *${clientTasks.length}* | 🧾 Unpaid Invoices: *${unpaid}*\n\n`;
      });
    }

    teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in handleClientStatus:', err);
    teamBot.sendMessage(chatId, '❌ Error fetching client status.');
  }
}

module.exports = {
  handleClientStatus
};
