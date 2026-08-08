const { supabase } = require('../../supabase');
// Import legacy bot for getClientKeyboard to avoid breaking existing signatures
const legacyBot = require('../../bot');

async function handleServices(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: servicesData, error } = await supabase.from('services').select('*').eq('public', true);
    let text = `🎨 *Purplebot Digital — Core Services:*\n\n`;
    
    if (servicesData && servicesData.length) {
      servicesData.forEach(s => { text += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n  ${s.description}\n\n`; });
    } else {
      text += `• *Social Media Content Retainer* — BDT 50,000–1,50,000/month\n• *TVC & Commercial Production* — Project-based\n• *Product Photography* — Per-shoot packages\n• *Motion Graphics & Animation* — Per-project\n• *Brand Identity & Design* — One-time\n\n📞 Contact your Account Manager for a custom quote.`;
    }
    
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    const keyboard = cData ? legacyBot.getClientKeyboard(cData) : undefined;
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleServices:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching services.');
  }
}

async function handlePortfolio(clientBot, msg) {
  const chatId = msg.chat.id;
  const text = `📁 *Purplebot Digital Portfolio*\n\nExplore our campaign work:\n🔗 https://purpleos-iota.vercel.app/\n\n_Clients include: Chillox Fast Food, Apex Shoes, and more._`;
  clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function handleReviewRoom(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    let pendingReview = [];

    if (cData) {
      const { data: reviews } = await supabase.from('reviews').select('*').or(`client.ilike.%${cData.name}%,client_id.eq.${cData.id}`);
      pendingReview = reviews || [];
    }

    let text = `🎬 *Review Room — Your Deliverables*\n\n`;
    if (pendingReview.length) {
      text += `You have *${pendingReview.length}* deliverable(s) in your Review Room:\n\n`;
      pendingReview.forEach((r, i) => {
        text += `${i+1}. *${r.project_name || r.projectName || 'Video Cut'}*\n`;
        text += `   Version: ${r.active_version || 'v1'} | Items: ${r.total_count || 0}\n`;
        text += `   🔗 Link: https://purpleos-iota.vercel.app/reviewroom.html?id=${r.id}\n\n`;
      });
      text += `Tap any link above to stream & leave timecoded comments in 4K.`;
    } else {
      text += `No deliverables pending review right now.\n\nWe'll notify you when your next cut is ready.`;
    }
    
    const keyboard = cData ? legacyBot.getClientKeyboard(cData) : undefined;
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleReviewRoom:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching review room.');
  }
}

async function handleCampaignStatus(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    let tasks = [];

    if (cData) {
      const { data: tData } = await supabase.from('tasks').select('*').ilike('client', `%${cData.name}%`);
      tasks = tData || [];
    }

    let text = `📋 *Campaign Progress*\n\n`;
    if (tasks.length) {
      tasks.forEach(t => {
        const stages = ['Brief','Shoot','Editing','Client Review','Delivered'];
        const idx = stages.findIndex(s => s.toLowerCase() === (t.stage||'').toLowerCase());
        const bar = stages.map((s,i) => i < idx ? '✅' : i === idx ? '🔵' : '⬜').join('');
        text += `*${t.title}*\n${bar}\nStage: *${t.stage}* | Due: ${t.due_date || t.dueDate || 'TBD'}\n\n`;
      });
    } else {
      text += `No active campaigns found.\nContact your Account Manager to kick off a new campaign.`;
    }
    
    const keyboard = cData ? legacyBot.getClientKeyboard(cData) : undefined;
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleCampaignStatus:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching campaign status.');
  }
}

async function handleInvoices(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    let invoices = [];

    if (cData) {
      const { data: iData } = await supabase.from('invoices').select('*').ilike('client_name', `%${cData.name}%`);
      invoices = iData || [];
    }

    let text = `💳 *Invoice & Payment Summary*\n\n`;
    if (invoices.length) {
      const pending = invoices.filter(i => i.status !== 'Paid');
      const paid = invoices.filter(i => i.status === 'Paid');
      text += `• Pending: *${pending.length} invoice(s)* — BDT ${pending.reduce((s,i)=>s+(i.amount||0),0).toLocaleString()}\n`;
      text += `• Paid: *${paid.length} invoice(s)* — BDT ${paid.reduce((s,i)=>s+(i.amount||0),0).toLocaleString()}\n\n`;
      if (pending.length) {
        text += `📌 *To pay:* Open the client app and use our bKash / bank payment form.\n`;
        text += `🔗 https://purpleos-iota.vercel.app/client-miniapp`;
      }
    } else {
      text += `No invoices found. Invoices are generated upon deliverable approval.`;
    }
    
    const keyboard = cData ? legacyBot.getClientKeyboard(cData) : undefined;
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleInvoices:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching invoices.');
  }
}

async function handleContactAM(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    const amName = cData?.accountManager || 'Your Account Manager';
    const text = `📞 *Your Account Manager*\n\n• Name: *${amName}*\n• Phone: *+8801708459008*\n• Email: *contact@purpleos.agency*\n\n_Office hours: Sun–Thu · 9:00 AM – 7:00 PM_`;
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in handleContactAM:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching AM details.');
  }
}

module.exports = {
  handleServices,
  handlePortfolio,
  handleReviewRoom,
  handleCampaignStatus,
  handleInvoices,
  handleContactAM
};
