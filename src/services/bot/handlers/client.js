const { supabase } = require('../../supabase');
const { getClientKeyboard, getProspectKeyboard } = require('../keyboards');
const { DEFAULT_SERVICES } = require('../../../constants/services');

async function handleServices(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: servicesData, error } = await supabase.from('services').select('*').eq('is_public', true);
    let text = `🎨 *GRO10X — CORE SERVICES & PACKAGES:*\n\n`;
    
    const activeList = (servicesData && servicesData.length) ? servicesData : DEFAULT_SERVICES;
    activeList.forEach(s => {
      text += `• *${s.title}* (${s.category || 'Growth Engine Service'})\n  Starting at: *${s.price}*\n  ${s.description}\n\n`;
    });
    
    text += `💡 *Need a custom scope or retainer?* Tap *💬 Get a Custom Quote* or *📅 Book a Strategy Call* below!`;
    
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    const keyboard = cData ? getClientKeyboard(cData) : getProspectKeyboard();
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleServices:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching services.');
  }
}

async function handlePortfolio(clientBot, msg) {
  const chatId = msg.chat.id;
  const text = `📁 *GRO10X — Solutions & Portfolio Showcase*\n\nExplore our latest AI apps, synthetic media workflows, and digital brand scaling cases:\n🔗 https://gro10x.ai\n\n_Scaling businesses 10x faster through software engineering and data science._`;
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

    let text = `🎬 *Creative Review Room — Active Deliverables*\n\n`;
    if (pendingReview.length) {
      text += `You have *${pendingReview.length}* deliverable(s) in your workspace:\n\n`;
      pendingReview.forEach((r, i) => {
        text += `${i+1}. *${r.project_name || r.projectName || 'Video Cut'}*\n`;
        text += `   Version: *${r.active_version || 'v1'}* | Status: *${r.status || 'Client Review'}*\n`;
        text += `   🔗 Review & Approve: https://gro10x-ai.vercel.app/client#review\n\n`;
      });
      text += `Tap any link above to stream live cuts and submit feedback.`;
    } else {
      text += `✅ *All deliverables up to date!*\nNo cuts currently pending your approval.\n\nWe will notify you immediately when your production team uploads your next cut.`;
    }
    
    const keyboard = cData ? getClientKeyboard(cData) : undefined;
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
      const { data: tData } = await supabase.from('tasks').select('*').or(`client.ilike.%${cData.name}%,client_id.eq.${cData.id}`);
      tasks = tData || [];
    }

    let text = `📋 *Campaign Progress & Production Pipeline*\n\n`;
    if (tasks.length) {
      tasks.forEach((t, i) => {
        const stages = ['Brief', 'Script/Pre-Pro', 'Shoot/Production', 'Editing', 'Client Review', 'Delivered'];
        const currentStage = (t.stage || 'Editing');
        const idx = stages.findIndex(s => s.toLowerCase().includes(currentStage.toLowerCase()));
        const bar = stages.map((s, si) => (idx !== -1 && si < idx) ? '✅' : (idx !== -1 && si === idx) ? '🔵' : '⬜').join('');
        text += `*${i+1}. ${t.title || 'Campaign Deliverable'}*\n`;
        text += `${bar}\n`;
        text += `Stage: *${currentStage}* | Due: *${t.due_date || t.dueDate || 'On Schedule'}*\n\n`;
      });
    } else {
      text += `No active production tasks found.\n\nTap *📝 Submit Brief* below to kick off a new campaign or reach out to your Account Manager.`;
    }
    
    const keyboard = cData ? getClientKeyboard(cData) : undefined;
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
      const { data: iData } = await supabase.from('invoices').select('*').or(`client_name.ilike.%${cData.name}%,client_id.eq.${cData.id}`);
      invoices = iData || [];
    }

    let text = `💳 *Billing & Invoice Summary*\n\n`;
    if (invoices.length) {
      const pending = invoices.filter(i => i.status !== 'Paid');
      const paid = invoices.filter(i => i.status === 'Paid');
      
      if (pending.length) {
        text += `⚠️ *Pending Invoices (${pending.length}):*\n`;
        pending.forEach(inv => {
          text += `• *${inv.id || 'INV'}* — BDT ${(Number(inv.amount) || 0).toLocaleString()}\n`;
          text += `  Scope: ${inv.projectName || inv.description || 'Monthly Retainer'}\n`;
          text += `  Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'Due on receipt'}\n\n`;
        });
      }

      text += `📊 *Summary Overview:*\n`;
      text += `• Outstanding: *BDT ${pending.reduce((s,i)=>s+(Number(i.amount)||0),0).toLocaleString()}*\n`;
      text += `• Settled (Paid): *BDT ${paid.reduce((s,i)=>s+(Number(i.amount)||0),0).toLocaleString()}*\n\n`;
      
      if (pending.length) {
        text += `📌 *To complete payment & submit proof:* Open the Client Portal via the button below or transfer via bKash to *01711-019550* (Ref: Invoice ID).\n`;
      }
    } else {
      text += `✅ *No outstanding invoices.*\nAll account billings are settled or up to date. Invoices are generated automatically upon deliverable approval.`;
    }
    
    const keyboard = cData ? getClientKeyboard(cData) : undefined;
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
    
    // Resolve assigned AM dynamically
    let amName = cData?.accountManager || cData?.account_manager || 'Tasin Kabir';
    let amDesignation = 'Senior Manager, Client Services';
    let amPhone = '+880 1709-952672';
    let amEmail = 'gro10xnow@gmail.com';

    if (amName.toLowerCase().includes('sayed')) {
      amName = 'Sayed Ashraf';
      amDesignation = 'Assistant Manager, Client Services';
      amPhone = '+880 1617-410967';
      amEmail = 'gro10xnow@gmail.com';
    } else if (amName.toLowerCase().includes('rimjhim')) {
      amName = 'Rimjhim Rashid';
      amDesignation = 'Assistant Manager, Client Services';
      amPhone = '+880 1759-768962';
      amEmail = 'gro10xnow@gmail.com';
    } else if (amName.toLowerCase().includes('mehedi')) {
      amName = 'MD Mehedi Bin Jayed';
      amDesignation = 'Head of Client & Growth';
      amPhone = '+880 1874-079687';
      amEmail = 'gro10xnow@gmail.com';
    }

    const text = `📞 *Your Dedicated Account Manager*\n\n` +
      `👤 *Name:* ${amName}\n` +
      `💼 *Designation:* ${amDesignation}\n` +
      `📱 *Direct Phone:* \`${amPhone}\`\n` +
      `📧 *Work Email:* \`${amEmail}\`\n\n` +
      `🏢 *GRO10X Client Desk:* \`gro10xnow@gmail.com\` | \`+880 1708-459008\`\n` +
      `⏰ *Office Hours:* Sun–Thu · 9:30 AM – 6:30 PM BST\n\n` +
      `_Feel free to call or WhatsApp your AM directly during business hours for campaign adjustments._`;

    const keyboard = cData ? getClientKeyboard(cData) : getProspectKeyboard();
    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch (err) {
    console.error('Error in handleContactAM:', err);
    clientBot.sendMessage(chatId, '❌ Error fetching Account Manager details.');
  }
}

async function handleSubmitBrief(clientBot, msg) {
  const chatId = msg.chat.id;
  const text = `📝 *Submit New Campaign Brief*\n\n` +
    `Ready to kick off a new campaign, video commercial, or creative retainer cycle?\n\n` +
    `1. Open your *Client Portal* via the button below\n` +
    `2. Go to *Support & Service Requests* or tap *+ Submit Ticket*\n` +
    `3. Select *Campaign Scope* and attach your requirements\n\n` +
    `Your assigned Account Manager will review and schedule your kickoff within 24 hours. 🚀`;

  const inlineKeyboard = [[
    { text: '🌐 Launch Client Portal', web_app: { url: 'https://gro10x-ai.vercel.app/client' } }
  ]];

  clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } });
}

async function handleClientDigest(clientBot, msg) {
  const chatId = msg.chat.id;
  try {
    const { data: cData } = await supabase.from('clients').select('*').eq('telegram_id', String(chatId)).maybeSingle();
    const clientName = cData?.name || '';

    const [reviewsRes, invoicesRes, postsRes] = await Promise.all([
      cData ? supabase.from('reviews').select('*').or(`client.ilike.%${cData.name}%,client_id.eq.${cData.id}`) : { data: [] },
      cData ? supabase.from('invoices').select('*').or(`client_name.ilike.%${cData.name}%,client_id.eq.${cData.id}`) : { data: [] },
      cData ? supabase.from('social_posts').select('*').or(`client_name.ilike.%${cData.name}%,client_id.eq.${cData.id}`) : { data: [] }
    ]);

    const reviews = reviewsRes.data || [];
    const invoices = invoicesRes.data || [];
    const posts = postsRes.data || [];

    const pendingReviews = reviews.filter(r => !r.approved_at);
    const approvedReviews = reviews.filter(r => !!r.approved_at);
    const pendingInvoices = invoices.filter(i => i.status !== 'Paid');
    const upcomingScheduled = posts.filter(p => p.status === 'Approved' || p.status === 'Scheduled');

    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let text = `📊 *Executive Client Partner Digest — ${monthName}*\n\n` +
      `🏢 *Organization:* ${clientName || 'Client Partner'}\n` +
      `⚡ *Retainer Status:* ${cData?.status || 'Active Retainer'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎬 *Creative Deliverables & Approvals:*\n` +
      `• Approved this cycle: *${approvedReviews.length} cut(s)*\n` +
      `• Pending your review: *${pendingReviews.length} cut(s)*\n\n` +
      `📅 *Content Publishing Pipeline:*\n` +
      `• Scheduled Live Posts: *${upcomingScheduled.length} post(s)*\n` +
      `• Total Monthly Posts in Motion: *${posts.length}*\n\n` +
      `💳 *Billing & Financial Summary:*\n` +
      `• Outstanding Invoices: *${pendingInvoices.length}* (${pendingInvoices.length > 0 ? `BDT ${pendingInvoices.reduce((s,i)=>s+(Number(i.amount)||0),0).toLocaleString()}` : 'All Clear ✅'})\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Dedicated AM:* ${cData?.accountManager || 'Tasin Kabir'} · gro10xnow@gmail.com\n` +
      `Tap below to access your live Retainer Health & Intelligence Dashboard:`;

    const inlineKeyboard = [
      [{ text: '⚡ Launch Retainer Health Dashboard', web_app: { url: 'https://gro10x-ai.vercel.app/client#retainer' } }],
      [{ text: '🎬 Review Active Video Cuts', web_app: { url: 'https://gro10x-ai.vercel.app/client#review' } }]
    ];

    clientBot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } });
  } catch (err) {
    console.error('Error in handleClientDigest:', err);
    clientBot.sendMessage(chatId, '❌ Error generating executive digest.');
  }
}

module.exports = {
  handleServices,
  handlePortfolio,
  handleReviewRoom,
  handleCampaignStatus,
  handleInvoices,
  handleContactAM,
  handleSubmitBrief,
  handleClientDigest
};
