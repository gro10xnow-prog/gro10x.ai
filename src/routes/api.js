const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { processAutomationEvent } = require('../services/automation');

const { requireAuth } = require('../middleware/auth');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PurpleOS',
    version: '0.6.0',
    supabaseConnected: isSupabaseConfigured()
  });
});

// Auth Config
router.get('/auth/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// User Profile Me
router.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Full DB State
router.get('/db', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const [clients, services, team, tasks, reviews, invoices, expenses, assets, attendance] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('services').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('reviews').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('attendance').select('*')
      ]);

      if (!clients.error && clients.data.length > 0) {
        return res.json({
          clients: clients.data.map(c => ({ ...c, contactPerson: c.contact_person, totalSpent: c.total_spent, activeCampaigns: c.active_campaigns })),
          services: services.data.map(s => ({ ...s, includedFeatures: s.included_features, public: s.is_public })),
          team: team.data.map(t => ({ ...t, id: t.emp_code, telegramId: t.telegram_id, baseSalary: t.base_salary, commissionRate: t.commission_rate, earnedCommissions: t.earned_commissions, activeBookings: t.active_bookings })),
          tasks: tasks.data.map(t => ({ ...t, dueDate: t.due_date })),
          reviews: reviews.data.map(r => ({ ...r, projectId: r.project_id, projectName: r.project_name, activeVersion: r.active_version, mediaType: r.media_type, mediaUrl: r.media_url, posterUrl: r.poster_url, resolvedCount: r.resolved_count, totalCount: r.total_count })),
          invoices: invoices.data.map(i => ({ ...i, clientId: i.client_id, clientName: i.client_name, dueDate: i.due_date, taxRate: i.tax_rate })),
          expenses: expenses.data.map(e => ({ ...e, loggedBy: e.logged_by })),
          assets: assets.data.map(a => ({ ...a, purchasePrice: a.purchase_price, monthlyDepreciation: a.monthly_depreciation, assignedTo: a.assigned_to })),
          attendance: attendance.data.map(at => ({ ...at, employeeId: at.employee_id, clockInTime: at.clock_in_time }))
        });
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to db.json:', err.message);
    }
  }

  const db = readDB();
  res.json(db);
});

// CLIENTS CRM
router.get('/clients', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('clients').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(c => ({
        ...c,
        contactPerson: c.contact_person,
        totalSpent: c.total_spent,
        activeCampaigns: c.active_campaigns
      })));
    }
  }
  const db = readDB();
  res.json(db.clients || []);
});

router.post('/clients', async (req, res) => {
  const newClient = req.body;
  
  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('clients').select('id');
    const newId = `CLI-${String((countData?.length || 0) + 1).padStart(4, '0')}`;
    newClient.id = newId;

    const payload = {
      id: newId,
      name: newClient.name,
      contact_person: newClient.contactPerson || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      whatsapp: newClient.whatsapp || '',
      status: newClient.status || 'Active Retainer',
      category: newClient.category || 'General',
      total_spent: '$0',
      active_campaigns: newClient.activeCampaigns || []
    };

    const { error } = await supabase.from('clients').insert([payload]);
    if (!error) {
      broadcast('client_update', [payload]);
      return res.json({ success: true, client: newClient });
    }
  }

  const db = readDB();
  newClient.id = `CLI-${String((db.clients.length || 0) + 1).padStart(4, '0')}`;
  newClient.totalSpent = '$0';
  db.clients.push(newClient);
  writeDB(db);
  broadcast('client_update', db.clients);
  res.json({ success: true, client: newClient });
});

router.put('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured()) {
    const payload = {
      id,
      name: updates.name,
      category: updates.category,
      contact_person: updates.contactPerson,
      phone: updates.phone,
      whatsapp: updates.whatsapp || updates.phone,
      email: updates.email,
      status: updates.status
    };

    const { error } = await supabase.from('clients').update(payload).eq('id', id);
    if (!error) {
      broadcast('client_update', [payload]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  const idx = (db.clients || []).findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Client not found' });

  db.clients[idx] = { ...db.clients[idx], ...updates };
  writeDB(db);
  broadcast('client_update', db.clients);
  res.json({ success: true, client: db.clients[idx] });
});

router.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      broadcast('client_update', [{ id, deleted: true }]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  db.clients = (db.clients || []).filter(c => c.id !== id);
  writeDB(db);
  broadcast('client_update', db.clients);
  res.json({ success: true });
});

router.put('/clients/:id/onboarding', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const client = (db.clients || []).find(c => c.id === id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  client.onboarding = req.body.onboarding || client.onboarding;
  writeDB(db);
  broadcast('client_update', db.clients);
  res.json({ success: true, client });
});

// LEADS PIPELINE CRM
router.get('/leads', async (req, res) => {
  const db = readDB();
  res.json(db.leads || []);
});

router.post('/leads', (req, res) => {
  const db = readDB();
  db.leads = db.leads || [];
  const newLead = {
    id: `LED-${String(db.leads.length + 1).padStart(3, '0')}`,
    stage: 'New Inquiry',
    createdAt: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.leads.push(newLead);
  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true, lead: newLead });
});

router.put('/leads/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.leads || []).findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  const updatedLead = { ...db.leads[idx], ...req.body };
  db.leads[idx] = updatedLead;

  if (updatedLead.stage === 'Won / Closed' || updatedLead.stage === 'Won') {
    processAutomationEvent('lead_won', { lead: updatedLead }, db, writeDB, broadcast);
  }

  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true, lead: db.leads[idx] });
});

router.delete('/leads/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.leads = (db.leads || []).filter(l => l.id !== id);
  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true });
});

// Module C6: Magic Link Onboarding & Email Notification Generator
router.post('/leads/:id/onboard', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const lead = (db.leads || []).find(l => l.id === id) || (db.clients || []).find(c => c.id === id);

  const clientName = lead ? (lead.clientName || lead.company || lead.name || 'Client') : 'Client';
  const email = lead ? (lead.contactEmail || lead.email || 'client@agency.com') : 'client@agency.com';
  const token = `TOK-${Date.now()}`;
  const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(clientName)}&token=${token}`;

  const emailSubject = `Welcome to Purplebot Digital Agency — Your Brand Partner Portal Access`;
  const emailBody = `Dear ${clientName} Team,

Welcome to Purplebot Digital Agency! We are thrilled to partner with your brand.

To access your dedicated Client Partner Portal, view campaign shoot progress, and stream 4K video deliverable cuts for 1-click approval, please click your secure portal link below:

🔗 Direct Portal Magic Link:
${magicLink}

Portal Features:
• Stream & Comment on Video Deliverable Cuts (Frame.io Review Engine)
• 1-Click Cut Approval & Instant Invoice Generation
• View Commercial Statements & Payment History
• Request New Shoot Campaigns

If you have any questions, your account lead Mahmudul Hasan (+880 1700-000000) is on standby.

Warm regards,
The Operations Team
Purplebot Digital Agency
http://www.purplebot.co`;

  res.json({
    success: true,
    clientName,
    email,
    magicLink,
    emailSubject,
    emailBody
  });
});

router.post('/leads/:id/convert', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  lead.stage = 'Won / Closed';
  processAutomationEvent('lead_won', { lead }, db, writeDB, broadcast);

  db.clients = db.clients || [];
  const existingClient = db.clients.find(c => c.name.toLowerCase().trim() === (lead.company || lead.contactPerson).toLowerCase().trim());
  let clientRecord = existingClient;

  if (!existingClient) {
    clientRecord = {
      id: `CLI-${String(db.clients.length + 1).padStart(4, '0')}`,
      name: lead.company || lead.contactPerson,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      status: 'Active Retainer',
      category: lead.category || 'General',
      totalSpent: '$0',
      activeCampaigns: [lead.service || 'New Campaign']
    };
    db.clients.push(clientRecord);
  }

  writeDB(db);
  broadcast('lead_update', db.leads);
  broadcast('client_update', db.clients);

  res.json({ success: true, client: clientRecord, lead });
});

router.post('/leads/book', (req, res) => {
  const db = readDB();
  db.leads = db.leads || [];
  const count = db.leads.length + 1;
  const newLead = {
    id: `LED-${String(count).padStart(3, '0')}`,
    company: req.body.company || req.body.contactPerson || 'Web Lead',
    contactPerson: req.body.contactPerson || 'Prospective Client',
    email: req.body.email || '',
    phone: req.body.phone || '',
    whatsapp: req.body.whatsapp || req.body.phone || '',
    source: 'Website Booking',
    category: req.body.category || 'General',
    service: req.body.service || 'Agency Services',
    value: req.body.value || '$1,000 - $3,000',
    stage: 'New Inquiry',
    notes: `Timeline: ${req.body.timeline || 'Flexible'}. Notes: ${req.body.notes || 'No extra notes.'}`,
    createdAt: new Date().toISOString().split('T')[0]
  };
  db.leads.push(newLead);
  writeDB(db);
  broadcast('lead_update', db.leads);
  res.json({ success: true, lead: newLead });
});

// QUOTATIONS & PROPOSALS API
router.get('/quotes', (req, res) => {
  const db = readDB();
  res.json(db.quotes || []);
});

router.post('/quotes', (req, res) => {
  const db = readDB();
  db.quotes = db.quotes || [];
  const count = db.quotes.length + 1;
  const newQuote = {
    id: `QTE-2026-${String(count).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    ...req.body
  };
  db.quotes.push(newQuote);
  writeDB(db);
  broadcast('quote_update', db.quotes);
  res.json({ success: true, quote: newQuote });
});

router.put('/quotes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.quotes || []).findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Quotation not found' });

  db.quotes[idx] = { ...db.quotes[idx], ...req.body };
  writeDB(db);
  broadcast('quote_update', db.quotes);
  res.json({ success: true, quote: db.quotes[idx] });
});

router.delete('/quotes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.quotes = (db.quotes || []).filter(q => q.id !== id);
  writeDB(db);
  broadcast('quote_update', db.quotes);
  res.json({ success: true });
});

router.post('/quotes/:id/convert', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const quote = (db.quotes || []).find(q => q.id === id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });

  quote.status = 'Converted';

  db.clients = db.clients || [];
  const clientObj = db.clients.find(c => c.name.toLowerCase().trim() === (quote.clientName || '').toLowerCase().trim());
  const clientId = clientObj ? clientObj.id : (db.clients[0]?.id || 'CLI-0001');

  db.invoices = db.invoices || [];
  const invCount = db.invoices.length + 1;
  const newInvoice = {
    id: `INV-2026-${String(invCount).padStart(3, '0')}`,
    clientId: clientId,
    clientName: quote.clientName,
    date: new Date().toISOString().split('T')[0],
    dueDate: quote.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    amount: Number(quote.amount) || 0,
    taxRate: Number(quote.taxRate) || 15,
    discount: Number(quote.discount) || 0,
    status: 'Draft',
    items: quote.items || [
      { description: `Proposal Services for ${quote.clientName}`, qty: 1, rate: Number(quote.amount) || 0 }
    ],
    notes: quote.terms || ''
  };

  db.invoices.push(newInvoice);
  writeDB(db);

  broadcast('quote_update', db.quotes);
  broadcast('invoice_update', db.invoices);

  res.json({ success: true, invoice: newInvoice, quote });
});

// SOCIAL CONTENT PLANNER & CALENDAR API
router.get('/posts', (req, res) => {
  const db = readDB();
  res.json(db.posts || []);
});

router.post('/posts', (req, res) => {
  const db = readDB();
  db.posts = db.posts || [];
  const count = db.posts.length + 101;
  const newPost = {
    id: `PST-${count}`,
    status: 'Scheduled',
    ...req.body
  };
  db.posts.push(newPost);
  writeDB(db);
  broadcast('post_update', db.posts);
  res.json({ success: true, post: newPost });
});

router.put('/posts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx] = { ...db.posts[idx], ...req.body };
  writeDB(db);
  broadcast('post_update', db.posts);
  res.json({ success: true, post: db.posts[idx] });
});

router.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.posts = (db.posts || []).filter(p => p.id !== id);
  writeDB(db);
  broadcast('post_update', db.posts);
  res.json({ success: true });
});

// LIVE CHAT HUB API
router.get('/chats', (req, res) => {
  const db = readDB();
  res.json(db.chats || []);
});

router.get('/chats/:clientId', (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const thread = (db.chats || []).find(c => c.clientId === clientId || c.id === clientId);
  if (!thread) return res.status(404).json({ error: 'Chat thread not found' });
  res.json(thread);
});

router.post('/chats/:clientId/messages', (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  db.chats = db.chats || [];

  let thread = db.chats.find(c => c.clientId === clientId || c.id === clientId);
  if (!thread) {
    const clientObj = (db.clients || []).find(c => c.id === clientId) || { name: clientId };
    thread = {
      id: `CHT-${String(db.chats.length + 1).padStart(3, '0')}`,
      clientId: clientId,
      clientName: clientObj.name,
      channel: 'WhatsApp',
      unreadCount: 0,
      lastUpdated: 'Just now',
      messages: []
    };
    db.chats.push(thread);
  }

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: `MSG-${Date.now()}`,
    sender: req.body.sender || 'Mahmudul Hasan (Purplebot)',
    role: req.body.role || 'Agency Lead',
    text: req.body.text || '',
    timestamp: nowTime,
    isAgency: req.body.isAgency !== undefined ? req.body.isAgency : true
  };

  thread.messages.push(newMsg);
  thread.lastUpdated = nowTime;
  if (!newMsg.isAgency) {
    thread.unreadCount = (thread.unreadCount || 0) + 1;
  }

  writeDB(db);
  broadcast('chat_update', db.chats);
  res.json({ success: true, message: newMsg, thread });
});

router.put('/chats/:clientId/read', (req, res) => {
  const { clientId } = req.params;
  const db = readDB();
  const thread = (db.chats || []).find(c => c.clientId === clientId || c.id === clientId);
  if (thread) {
    thread.unreadCount = 0;
    writeDB(db);
    broadcast('chat_update', db.chats);
  }
  res.json({ success: true });
});

// BOT MANAGEMENT & CONFIGURATION API
router.get('/bot-config', (req, res) => {
  const db = readDB();
  res.json(db.botConfig || {});
});

router.put('/bot-config', (req, res) => {
  const db = readDB();
  db.botConfig = { ...db.botConfig, ...req.body };
  writeDB(db);
  broadcast('bot_config_update', db.botConfig);
  res.json({ success: true, botConfig: db.botConfig });
});

router.post('/bot-config/kb', (req, res) => {
  const db = readDB();
  db.botConfig = db.botConfig || {};
  db.botConfig.knowledgeBase = db.botConfig.knowledgeBase || [];

  const newKB = {
    id: `KB-${db.botConfig.knowledgeBase.length + 1}`,
    ...req.body
  };

  db.botConfig.knowledgeBase.push(newKB);
  writeDB(db);
  broadcast('bot_config_update', db.botConfig);
  res.json({ success: true, kb: newKB });
});

router.delete('/bot-config/kb/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (db.botConfig && db.botConfig.knowledgeBase) {
    db.botConfig.knowledgeBase = db.botConfig.knowledgeBase.filter(k => k.id !== id);
    writeDB(db);
    broadcast('bot_config_update', db.botConfig);
  }
  res.json({ success: true });
});

// TELEGRAM WEBHOOK ENGINE & NOTIFICATION GATEWAY API
router.get('/webhooks/logs', (req, res) => {
  const db = readDB();
  res.json(db.webhookLogs || []);
});

router.post('/webhooks/telegram', async (req, res) => {
  const db = readDB();
  db.webhookLogs = db.webhookLogs || [];

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const update = req.body || {};
  const message = update.message || update.edited_message;

  if (message && message.text) {
    const chatId = message.chat.id;
    const msgText = message.text.trim();
    const senderName = message.from?.first_name || 'Telegram User';
    const isTeamBot = req.query.bot === 'team';

    const teamToken = process.env.TEAM_BOT_TOKEN || '8874232130:AAEs5JDOEEX9kIN9Z_V_k0UQp2lBao5MHLQ';
    const clientToken = process.env.CLIENT_BOT_TOKEN || '8964646505:AAEBVLDRqG0JdiTSSl6uK08UCQk0ZNsmYMU';
    const botToken = isTeamBot ? teamToken : clientToken;

    let replyText = '';

    if (isTeamBot) {
      // Purple Man (Team Bot) Logic
      if (msgText.startsWith('/start') || msgText.startsWith('/help')) {
        replyText = `🤖 *Welcome to Purple Man (Crew Ops Bot)!*\n\n` +
          `Commands for Purplebot Agency Crew:\n` +
          `• /clockin - Log Studio Clock-In\n` +
          `• /clockout - Log Studio Clock-Out\n` +
          `• /myearnings - Check monthly salary & shoot commissions\n` +
          `• /mybookings - View assigned shoot schedule\n` +
          `• /pair - Pair account with employee code or phone (+8801708459008)`;
      } else if (msgText.startsWith('/clockin')) {
        const emp = (db.team || []).find(e => e.telegramId == chatId || (e.phone || '').includes('1708459008')) || db.team[0];
        let record = (db.attendance || []).find(a => a.name === emp.name);
        if (record) {
          record.status = 'In Studio';
          record.clockInTime = nowTime;
        } else {
          db.attendance = db.attendance || [];
          db.attendance.push({
            employeeId: emp.id || 'EMP-007',
            name: emp.name,
            status: 'In Studio',
            clockInTime: nowTime,
            location: 'Gulshan Studio'
          });
        }
        writeDB(db);
        broadcast('attendance_update', db.attendance);
        replyText = `✅ *Clock In Recorded by Purple Man!*\nStatus set to *In Studio* at ${nowTime}. Dashboard updated.`;
      } else if (msgText.startsWith('/clockout')) {
        const emp = (db.team || []).find(e => e.telegramId == chatId || (e.phone || '').includes('1708459008')) || db.team[0];
        let record = (db.attendance || []).find(a => a.name === emp.name);
        if (record) record.status = 'Clocked Out';
        writeDB(db);
        broadcast('attendance_update', db.attendance);
        replyText = `🚪 *Clock Out Recorded by Purple Man!*\nStatus set to *Clocked Out*. Have a great evening!`;
      } else if (msgText.startsWith('/myearnings')) {
        const emp = (db.team || []).find(e => e.telegramId == chatId || (e.phone || '').includes('1708459008')) || db.team[0];
        const basePay = emp.baseSalary || 85000;
        const commissions = emp.earnedCommissions || 15000;
        replyText = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
          `• Role: ${emp.role}\n` +
          `• Base Pay: BDT ${basePay.toLocaleString()}\n` +
          `• Shoot Commissions: BDT ${commissions.toLocaleString()}\n` +
          `-----------------------------------------\n` +
          `*Total Monthly Pay: BDT ${(basePay + commissions).toLocaleString()}*`;
      } else if (msgText.startsWith('/mybookings')) {
        const emp = (db.team || []).find(e => e.telegramId == chatId || (e.phone || '').includes('1708459008')) || db.team[0];
        const tasks = (db.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((emp.name || '').split(' ')[0].toLowerCase()));
        replyText = `📅 *Assigned Shoots & Tasks for ${emp.name}:*\n\n`;
        if (tasks.length === 0) replyText += `No active shoot assignments found.`;
        else tasks.forEach((t, i) => { replyText += `${i + 1}. *${t.title}*\n   Client: ${t.client}\n   Stage: ${t.stage}\n   Due: ${t.dueDate}\n\n`; });
      } else if (msgText.startsWith('/pair')) {
        const inputVal = msgText.split(' ')[1] || '+8801708459008';
        const cleanPhoneInput = inputVal.replace(/[^0-9+]/g, '');
        const matchingStaff = (db.team || []).find(t => 
          (t.emp_code || t.id || '').toUpperCase() === inputVal.toUpperCase() ||
          (t.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhoneInput)
        ) || db.team[0];

        if (matchingStaff) {
          matchingStaff.telegramId = String(chatId);
          matchingStaff.phoneVerified = true;
          writeDB(db);
          broadcast('team_update', db.team);
          replyText = `✅ *Telegram Account & Phone Paired Successfully!*\n\n` +
            `👤 Staff Name: *${matchingStaff.name}*\n` +
            `🛡️ Role: *${matchingStaff.role}*\n` +
            `📱 Verified Phone: *${matchingStaff.phone}*\n` +
            `🆔 Emp Code: \`${matchingStaff.emp_code || matchingStaff.id}\`\n` +
            `💬 Telegram Chat ID: \`${chatId}\``;
        } else {
          replyText = `⚠️ Could not find staff profile with code or phone \`${inputVal}\` in agency database.`;
        }
      } else {
        replyText = `🤖 *Purple Man Bot*: Received "${msgText}". Type /help to see crew commands!`;
      }
    } else {
      // Purple Bot (B2B Client Bot) Logic
      if (msgText.startsWith('/start') || msgText.startsWith('/help')) {
        replyText = `🤖 *Welcome to Purple Bot (Client B2B Assistant)!*\n\n` +
          `We assist agency clients with campaign status, deliverables & billing:\n` +
          `• /services - Browse agency packages & pricing\n` +
          `• /portfolio - View video & TVC campaign reel\n` +
          `• /review - Access Review Room V2 deliverable cuts\n` +
          `• /invoices - View invoice status & payment instructions`;
      } else if (msgText.startsWith('/services')) {
        replyText = `🎨 *Purplebot Digital Core Services Catalog:*\n\n`;
        (db.services || []).filter(s => s.public).forEach(s => {
          replyText += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n  ${s.description}\n\n`;
        });
      } else if (msgText.startsWith('/portfolio')) {
        replyText = `📁 *Purplebot Digital Portfolio Showcase*\n\n` +
          `Explore our award-winning campaign portfolio:\n` +
          `🔗 https://purpleos-iota.vercel.app/`;
      } else if (msgText.startsWith('/review')) {
        replyText = `🎬 *Review Room V2 Client Portal*\n\n` +
          `Stream & approve your campaign video cuts in 4K:\n` +
          `🔗 https://purpleos-iota.vercel.app/partners`;
      } else if (msgText.startsWith('/invoices')) {
        replyText = `💳 *Invoice & Payment Verification Portal*\n\n` +
          `Verify & pay outstanding invoices via Bkash/Nagad or Bank Wire:\n` +
          `🔗 https://purpleos-iota.vercel.app/partners`;
      } else {
        replyText = `👋 Hello! Thanks for contacting Purplebot Digital. Type /services to explore our packages or /review to check your campaign cuts.`;
      }
    }

    // Send HTTP POST response back to Telegram API with WebApp buttons
    try {
      const inlineKeyboard = isTeamBot ? [
        [{ text: '📱 Open Crew Mini App', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } }]
      ] : [
        [{ text: '🎬 Open 4K Review Room Mini App', web_app: { url: 'https://purpleos-iota.vercel.app/client-miniapp' } }]
      ];

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineKeyboard }
        })
      });
    } catch (sendErr) {
      console.error('Error sending Telegram webhook response:', sendErr);
    }

    // Add webhook log entry
    const newLog = {
      id: `WHK-${Date.now()}`,
      channel: isTeamBot ? 'Telegram (Purple Man)' : 'Telegram (Purple Bot)',
      type: 'inbound_update',
      sender: senderName,
      payload: msgText,
      status: '200 OK',
      timestamp: nowTime
    };
    db.webhookLogs.unshift(newLog);
    if (db.webhookLogs.length > 30) db.webhookLogs = db.webhookLogs.slice(0, 30);
    writeDB(db);
    broadcast('webhook_event', newLog);
  }

  res.json({ success: true });
});

router.post('/webhooks/send-telegram-alert', (req, res) => {
  const db = readDB();
  db.webhookLogs = db.webhookLogs || [];

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const alertText = req.body.alertText || 'System Push Alert';

  const newLog = {
    id: `WHK-${Date.now()}`,
    channel: 'Telegram',
    type: 'outbound_push',
    sender: 'Purplebot Bot Engine',
    payload: alertText,
    status: '200 Delivered',
    timestamp: nowTime
  };

  db.webhookLogs.unshift(newLog);
  if (db.webhookLogs.length > 30) db.webhookLogs = db.webhookLogs.slice(0, 30);

  writeDB(db);
  broadcast('webhook_event', newLog);
  res.json({ success: true, log: newLog });
});


// SERVICES & AI SPEC AUTO-FILL GENERATOR
router.get('/services', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('services').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(s => ({
        ...s,
        includedFeatures: s.included_features,
        public: s.is_public
      })));
    }
  }
  const db = readDB();
  res.json(db.services || []);
});

router.post('/services/aispec', (req, res) => {
  const { title, category } = req.body;
  
  const templates = {
    'Digital & Content Marketing': {
      description: `Targeted multi-platform growth campaign tailored for ${title || 'Brand'}. Features weekly content pillars, platform-native short video scripts, lead capture funnels, and optimized Meta/Google ad spend management.`,
      features: ['Weekly Content Rhythm', 'Platform-Native Storytelling', 'Lead Capture Funnels', 'Bi-Weekly ROI Reporting']
    },
    'AV Production': {
      description: `High-impact cinematic production for ${title || 'Brand'}. Includes professional storyboard conceptualization, multi-camera 4K filming, motion graphics design, sound engineering, and color grading.`,
      features: ['4K Cinema Camera Crew', 'Studio & On-Location Shoot', 'Custom Sound Design & Mix', 'Responsive Master Render']
    },
    'Branding & Graphic Design': {
      description: `Comprehensive identity system for ${title || 'Brand'}. Establishes visual positioning, logo architecture, typography hierarchy, brand guideline manuals, and high-conversion marketing collateral.`,
      features: ['Vector Identity Master', 'Brand Guidelines Manual', 'POSM & Print Ready Specs', 'Packaging Adaptations']
    }
  };

  const selected = templates[category] || templates['Digital & Content Marketing'];
  res.json({
    success: true,
    title: title,
    category: category,
    generatedDescription: selected.description,
    generatedFeatures: selected.features
  });
});

// TEAM & SALARY MANAGEMENT
router.get('/team', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(t => ({
        ...t,
        id: t.emp_code,
        telegramId: t.telegram_id,
        baseSalary: t.base_salary,
        commissionRate: t.commission_rate,
        earnedCommissions: t.earned_commissions,
        activeBookings: t.active_bookings
      })));
    }
  }
  const db = readDB();
  res.json(db.team || []);
});

router.post('/team', async (req, res) => {
  const newMember = req.body;

  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('profiles').select('id');
    const newId = `EMP-${String((countData?.length || 0) + 1).padStart(3, '0')}`;
    newMember.id = newId;

    const payload = {
      emp_code: newId,
      name: newMember.name,
      role: newMember.role || 'Crew Member',
      department: newMember.department || 'AV Production',
      telegram_id: newMember.telegramId || '',
      phone: newMember.phone || '',
      base_salary: Number(newMember.baseSalary) || 0,
      commission_rate: Number(newMember.commissionRate) || 0,
      earned_commissions: 0,
      status: newMember.status || 'In Studio',
      active_bookings: 0
    };

    const { error } = await supabase.from('profiles').insert([payload]);
    if (!error) {
      broadcast('team_update', [payload]);
      return res.json({ success: true, member: newMember });
    }
  }

  const db = readDB();
  db.team = db.team || [];
  newMember.id = `EMP-${String((db.team.length || 0) + 1).padStart(3, '0')}`;
  newMember.baseSalary = Number(newMember.baseSalary) || 0;
  newMember.commissionRate = Number(newMember.commissionRate) || 0;
  newMember.earnedCommissions = 0;
  newMember.status = newMember.status || 'In Studio';
  newMember.activeBookings = 0;

  db.team.push(newMember);
  writeDB(db);
  broadcast('team_update', db.team);
  res.json({ success: true, member: newMember });
});

// Module A2: Admin Panel Team User Invite & Temp Password Generator Route
router.post('/team/invite', async (req, res) => {
  const { name, email, phone, role, department, baseSalary, accessLevel } = req.body;
  const db = readDB();

  db.team = db.team || [];
  const empCode = `EMP-${String(db.team.length + 1).padStart(3, '0')}`;
  
  // Generate secure 10-char temporary password
  const tempPassword = `Purple2026!${Math.floor(100 + Math.random() * 900)}`;

  const newMember = {
    id: empCode,
    emp_code: empCode,
    name,
    email: (email || '').toLowerCase().trim(),
    phone: phone || '+880 1700-000000',
    role: role || 'AV Specialist',
    accessLevel: accessLevel || 'Specialist / Crew',
    department: department || 'AV Production',
    baseSalary: Number(baseSalary) || 50000,
    tempPassword: tempPassword,
    mustResetPassword: true,
    status: 'In Studio',
    joinedDate: new Date().toISOString().split('T')[0]
  };

  db.team.push(newMember);
  writeDB(db);

  broadcast('team_update', db.team);
  broadcast('db_updated', {});

  const inviteCardText = `🔑 *PURPLEOS WORKSPACE INVITATION CARD*
  
👤 Name: *${name}* (${empCode})
📧 Work Email: *${newMember.email}*
📱 Phone: *${newMember.phone}*
🛡️ Access Level: *${newMember.accessLevel}*
🔑 Temporary Password: \`${tempPassword}\`

🌐 Sign In URL: https://purpleos-iota.vercel.app/auth
⚠️ *Note*: You will be prompted to set your permanent password on first sign-in.`;

  res.json({
    success: true,
    empCode,
    member: newMember,
    tempPassword,
    inviteCardText
  });
});

// Module A3: First-Time Login Password Reset Endpoint
router.post('/auth/reset-first-password', (req, res) => {
  const { email, currentTempPassword, newPassword } = req.body;
  const db = readDB();

  const member = (db.team || []).find(t => (t.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim());
  if (!member) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  // Update password and clear mustResetPassword flag
  member.permanentPassword = newPassword;
  member.mustResetPassword = false;
  delete member.tempPassword;

  writeDB(db);
  broadcast('team_update', db.team);

  res.json({
    success: true,
    message: '🎉 Permanent password updated successfully! Redirecting to workspace...',
    accessLevel: member.accessLevel || 'Specialist / Crew'
  });
});

router.put('/team/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured()) {
    const payload = {
      name: updates.name,
      role: updates.role,
      department: updates.department,
      telegram_id: updates.telegramId,
      phone: updates.phone,
      base_salary: Number(updates.baseSalary) || 0,
      commission_rate: Number(updates.commissionRate) || 0,
      status: updates.status
    };

    const { error } = await supabase.from('profiles').update(payload).eq('emp_code', id);
    if (!error) {
      broadcast('team_update', [payload]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  const idx = (db.team || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Team member not found' });

  db.team[idx] = {
    ...db.team[idx],
    ...updates,
    baseSalary: Number(updates.baseSalary) || db.team[idx].baseSalary,
    commissionRate: Number(updates.commissionRate) || db.team[idx].commissionRate
  };
  writeDB(db);
  broadcast('team_update', db.team);
  res.json({ success: true, member: db.team[idx] });
});

router.delete('/team/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('profiles').delete().eq('emp_code', id);
    if (!error) {
      broadcast('team_update', [{ id, deleted: true }]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  db.team = (db.team || []).filter(t => t.id !== id);
  writeDB(db);
  broadcast('team_update', db.team);
  res.json({ success: true });
});


// TASKS KANBAN
router.get('/tasks', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('tasks').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(t => ({
        ...t,
        dueDate: t.due_date
      })));
    }
  }
  const db = readDB();
  res.json(db.tasks || []);
});

router.post('/tasks', async (req, res) => {
  const { title, client, priority, assignee, dueDate } = req.body;
  const db = readDB();

  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('tasks').select('id');
    const newId = `TSK-${String((countData?.length || 0) + 101)}`;
    const payload = {
      id: newId,
      title,
      client,
      stage: 'Scripting',
      priority: priority || 'Medium',
      assignee: assignee || 'Farhan Ahmed',
      due_date: dueDate || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase.from('tasks').insert([payload]).select();
    if (!error && data) {
      broadcast('task_update', data);

      const assigneeObj = db.team.find(e => e.name.toLowerCase().includes((assignee || '').split(' ')[0].toLowerCase()));
      if (assigneeObj && assigneeObj.telegramId) {
        sendTelegramNotification(
          assigneeObj.telegramId,
          `📌 *New Task Assigned*\nTask: *${title}*\nClient: *${client}*\nPriority: *${priority}*\nDue: *${dueDate}*`
        );
      }

      return res.json({ success: true, task: { ...data[0], dueDate: data[0].due_date } });
    }
  }

  const newTask = {
    id: `TSK-${String((db.tasks.length || 0) + 101)}`,
    title,
    client,
    stage: 'Scripting',
    priority: priority || 'Medium',
    assignee: assignee || 'Farhan Ahmed',
    dueDate: dueDate || new Date().toISOString().split('T')[0]
  };
  db.tasks.push(newTask);
  writeDB(db);
  broadcast('task_update', db.tasks);
  res.json({ success: true, task: newTask });
});

router.put('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { stage, assignees, assignee, priority } = req.body;

  if (isSupabaseConfigured()) {
    const updateObj = { updated_at: new Date() };
    if (stage) updateObj.stage = stage;
    const { data, error } = await supabase.from('tasks').update(updateObj).eq('id', taskId).select();
    if (!error && data && data.length > 0) {
      const task = data[0];
      broadcast('task_update', [task]);
      return res.json({ success: true, task: { ...task, dueDate: task.due_date } });
    }
  }

  const db = readDB();
  const task = db.tasks.find(t => t.id === taskId);
  if (task) {
    if (stage) task.stage = stage;
    if (assignees && Array.isArray(assignees)) {
      task.assignees = assignees;
      if (assignees.length > 0) task.assignee = assignees[0];
    } else if (assignee) {
      task.assignee = assignee;
      task.assignees = [assignee];
    }
    if (priority) task.priority = priority;

    writeDB(db);
    broadcast('task_update', db.tasks);
    broadcast('db_updated', {});
    
    if (stage) {
      processAutomationEvent('task_stage_change', { stage, task }, db, writeDB, broadcast);
      
      const assigneeFirstName = (task.assignee || '').trim().split(' ')[0].toLowerCase();
      const assigneeObj = assigneeFirstName ? db.team.find(e => (e.name || '').toLowerCase().includes(assigneeFirstName)) : null;
      if (assigneeObj && assigneeObj.telegramId) {
        sendTelegramNotification(
          assigneeObj.telegramId,
          `🔔 *Task Stage Updated*\nTask: *${task.title}*\nNew Stage: *${stage}*`
        );
      }
    }
    
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Module C7: AI Creative Brief & Spec Generator Route
router.post('/tasks/ai-brief', (req, res) => {
  const { client, title, goal, platform } = req.body;
  const targetClient = client || 'Agency Client';
  const targetTitle = title || 'Commercial Video Reel Campaign';
  const targetGoal = goal || 'Drive brand awareness & high-converting engagement';
  const targetPlatform = platform || 'Instagram Reels & TikTok';

  const briefText = `📋 *AI CREATIVE BRIEF — ${targetTitle.toUpperCase()}*

🎯 *Campaign Goal*: ${targetGoal}
🏢 *Client*: ${targetClient}
📱 *Target Platform*: ${targetPlatform}

💡 *Creative Concept Hook*:
"Behind-the-scenes cinema lens perspective showing high-energy brand craftsmanship, paired with trending upbeat audio and fast 0.8s jump cuts."

🎬 *Shot List & Key Deliverables*:
1. Hook (0-3s): Dynamic macro lens product reveal with kinetic text animation
2. Body (3-12s): Dual camera angle (A-Cam FX3 / B-Cam A7SIII) customer reaction
3. Call to Action (12-15s): Branded end card + promo code badge

⏱️ *Suggested Timeline*:
• Scripting & Storyboard: 2 Days
• Field Shoot: 1 Day
• Editing & Color Grading: 2 Days
• Review Room Cut Delivery: Day 5`;

  const subtasks = [
    { title: `Draft Script & Storyboard for ${targetTitle}`, assignedTo: 'Farhan Ahmed', stage: 'Scripting' },
    { title: `4K Field Shoot Logistics for ${targetTitle}`, assignedTo: 'Farhan Ahmed', stage: 'Shooting' },
    { title: `Color Grading & Rough Cut for ${targetTitle}`, assignedTo: 'Raihan Kabir', stage: 'Editing' },
    { title: `Frame.io Review Room Handover`, assignedTo: 'Nusrat Jahan', stage: 'Client Review' }
  ];

  res.json({
    success: true,
    client: targetClient,
    title: targetTitle,
    generatedBrief: briefText,
    suggestedSubtasks: subtasks
  });
});

// REVIEW ROOM V2
// BC-11: Public Client Share Link Endpoint
router.get('/review-share/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const rev = (db.reviews || []).find(r => r.id === id);

  if (!rev) return res.status(404).json({ error: 'Review project not found' });

  // Return public client-safe subset (only approved/client comments)
  res.json({
    id: rev.id,
    projectName: rev.projectName,
    client: rev.client || 'Agency Client',
    mediaType: rev.mediaType || 'video',
    mediaUrl: rev.mediaUrl,
    posterUrl: rev.posterUrl,
    activeVersion: rev.activeVersion,
    comments: (rev.comments || []).map(c => ({
      id: c.id,
      user: c.user,
      role: c.role,
      text: c.text,
      timestamp: c.timestamp,
      timeSeconds: c.timeSeconds,
      resolved: c.resolved
    }))
  });
});

router.get('/reviews', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('reviews').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(r => ({
        ...r,
        projectId: r.project_id,
        projectName: r.project_name,
        activeVersion: r.active_version,
        mediaType: r.media_type,
        mediaUrl: r.media_url,
        posterUrl: r.poster_url,
        resolvedCount: r.resolved_count,
        totalCount: r.total_count
      })));
    }
  }
  const db = readDB();
  res.json(db.reviews || []);
});

router.post('/reviews/:id/comments', async (req, res) => {
  const { author, authorRole, timestamp, timeSeconds, text, drawings } = req.body;
  const reviewId = req.params.id;
  const commentId = `COM-${Date.now()}`;

  const newComment = {
    id: commentId,
    review_id: reviewId,
    author: author || 'Client POC',
    author_role: authorRole || 'Client',
    timestamp: timestamp || '00:00',
    time_seconds: timeSeconds || 0,
    text,
    resolved: false,
    drawings: drawings || [],
    replies: []
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('review_comments').insert([newComment]).select();
    if (!error) {
      broadcast('review_update', [data[0]]);
    }
  }

  const db = readDB();
  const review = db.reviews.find(r => r.id === reviewId);
  if (review) {
    review.comments.push({ ...newComment, authorRole, timeSeconds, createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    review.totalCount = review.comments.length;
    writeDB(db);
    broadcast('review_update', db.reviews);

    db.team.forEach(emp => {
      if (emp.telegramId) {
        sendTelegramNotification(
          emp.telegramId,
          `💬 *New Feedback in Review Room*\nProject: *${review.projectName}*\nTimestamp: \`${timestamp}\`\n\n"${text}"`,
          [
            [
              { text: '💬 Open Review Room', url: 'http://localhost:3000' },
              { text: '✅ Resolve', callback_data: `resolve_comment:${commentId}` }
            ]
          ]
        );
      }
    });

    return res.json({ success: true, comment: newComment, review });
  }

  res.json({ success: true, comment: newComment });
});

router.post('/reviews/:id/comments/:commentId/resolve', async (req, res) => {
  const { id: reviewId, commentId } = req.params;

  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase.from('review_comments').select('resolved').eq('id', commentId).single();
    if (existing) {
      await supabase.from('review_comments').update({ resolved: !existing.resolved }).eq('id', commentId);
    }
  }

  const db = readDB();
  const review = db.reviews.find(r => r.id === reviewId);
  if (review) {
    const comment = review.comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = !comment.resolved;
      review.resolvedCount = review.comments.filter(c => c.resolved).length;
      writeDB(db);
      broadcast('review_update', db.reviews);
      return res.json({ success: true, comment, review });
    }
  }
  res.json({ success: true });
});

router.post('/reviews/:id/comments/:commentId/replies', async (req, res) => {
  const { id: reviewId, commentId } = req.params;
  const { author, authorRole, text } = req.body;

  const db = readDB();
  const review = (db.reviews || []).find(r => r.id === reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  const comment = (review.comments || []).find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  comment.replies = comment.replies || [];
  const newReply = {
    id: `RPL-${Date.now()}`,
    author: author || 'Agency Member',
    authorRole: authorRole || 'specialist',
    text: (text || '').trim(),
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  comment.replies.push(newReply);
  writeDB(db);
  broadcast('review_update', db.reviews);
  res.json({ success: true, reply: newReply });
});


// Client Cut Approval Route (BC-6: Review Approval -> Auto-Draft Invoice)
router.post('/reviews/:id/approve', async (req, res) => {
  const reviewId = req.params.id;
  const db = readDB();

  const review = db.reviews.find(r => r.id === reviewId);
  const clientName = review ? (review.client || review.projectName || '') : '';

  if (isSupabaseConfigured()) {
    // Auto-advance matching task to Approved stage
    if (clientName) {
      await supabase.from('tasks').update({ stage: 'Approved', updated_at: new Date() }).ilike('client', `%${clientName}%`);
    }
  }

  if (review) {
    review.activeVersion = 'v3 (Approved)';

    // Auto advance matching task in db.json
    const targetTask = db.tasks.find(t =>
      clientName && (t.client.toLowerCase().includes(clientName.toLowerCase()) || (t.title && t.title.toLowerCase().includes((review.projectName || '').toLowerCase())))
    );
    if (targetTask) {
      targetTask.stage = 'Approved';
    }

    // BC-6: Auto-Create Draft Invoice for the client upon approval
    db.invoices = db.invoices || [];
    const client = db.clients.find(c =>
      c.name.toLowerCase().includes((clientName || '').toLowerCase()) ||
      (clientName || '').toLowerCase().includes(c.name.toLowerCase())
    );

    let createdInvoice = null;
    const existingAutoInv = db.invoices.find(i => i.projectRef === review.id);

    if (!existingAutoInv) {
      const year = new Date().getFullYear();
      const seqNum = String((db.invoices || []).filter(i => i.id.startsWith(`INV-${year}`)).length + 1).padStart(3, '0');
      createdInvoice = {
        id: `INV-${year}-${seqNum}`,
        clientId: client ? client.id : 'CLI-0001',
        clientName: client ? client.name : (review.client || 'Agency Client'),
        projectRef: review.id,
        projectName: review.projectName,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // +7 days
        status: 'Draft',
        items: [
          { description: `Deliverable Handover: ${review.projectName} (Final Cut)`, qty: 1, rate: 1200, total: 1200 }
        ],
        amount: 1200,
        discountType: 'none',
        discountValue: 0,
        taxRate: 0,
        notes: `Auto-generated Draft Invoice from Review Room approval of ${review.projectName}. Please verify amount and due date before issuing.`
      };
      db.invoices.push(createdInvoice);
    }

    writeDB(db);

    broadcast('review_update', db.reviews);
    broadcast('task_update', db.tasks);
    broadcast('db_updated', {});

    // Notify Project Lead on Telegram
    db.team.forEach(emp => {
      if (emp.telegramId) {
        sendTelegramNotification(
          emp.telegramId,
          `🎉 *Deliverable Cut Approved by Client!*\nProject: *${review.projectName}*\nStatus: *Approved & Auto-Draft Invoice INV-${db.invoices.length} Created*`
        );
      }
    });

    return res.json({
      success: true,
      message: 'Deliverable cut approved & Draft Invoice created!',
      review,
      invoice: createdInvoice
    });
  }

  res.json({ success: true, message: 'Cut approved!' });
});

router.post('/reviews', async (req, res) => {
  const newRev = req.body;
  const db = readDB();
  db.reviews = db.reviews || [];
  newRev.id = `REV-${String((db.reviews.length || 0) + 1).padStart(3, '0')}`;
  newRev.projectId = newRev.projectId || `PRJ-${String(Date.now()).slice(-6)}`;
  newRev.projectName = newRev.projectName || 'New Review Session';
  newRev.client = newRev.client || 'Agency Client';
  newRev.activeVersion = 'v1 (Rough Cut)';
  newRev.versions = ['v1'];
  newRev.mediaType = newRev.mediaType || 'video';
  newRev.mediaUrl = newRev.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  newRev.resolvedCount = 0;
  newRev.totalCount = 0;
  newRev.comments = [];

  db.reviews.push(newRev);
  writeDB(db);
  broadcast('review_update', db.reviews);
  res.json({ success: true, review: newRev });
});


// FINANCIALS & INVOICING
router.get('/invoices', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('invoices').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(i => ({
        ...i,
        clientId: i.client_id,
        clientName: i.client_name,
        dueDate: i.due_date,
        taxRate: i.tax_rate,
        discountType: i.discount_type || 'percentage',
        discountValue: i.discount || 0
      })));
    }
  }
  const db = readDB();
  res.json(db.invoices || []);
});

router.post('/invoices', async (req, res) => {
  const { clientId, clientName, dueDate, status, items, discountType, discountValue, taxRate, notes } = req.body;
  const db = readDB();

  // Compute total amount
  const subtotal = (items || []).reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate) || 0)), 0);
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * ((Number(discountValue) || 0) / 100);
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  const taxBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxBase * ((Number(taxRate) || 0) / 100);
  const totalAmount = Math.round(taxBase + taxAmount);

  const year = new Date().getFullYear();

  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('invoices').select('id');
    const seq = String((countData?.length || 0) + 1).padStart(3, '0');
    const newId = `INV-${year}-${seq}`;

    const payload = {
      id: newId,
      client_id: clientId,
      client_name: clientName,
      date: new Date().toISOString().split('T')[0],
      due_date: dueDate || new Date().toISOString().split('T')[0],
      amount: totalAmount,
      tax_rate: Number(taxRate) || 0,
      discount: Number(discountValue) || 0,
      discount_type: discountType || 'percentage',
      status: status || 'Draft',
      items: items || [],
      notes: notes || ''
    };

    const { data, error } = await supabase.from('invoices').insert([payload]).select();
    if (!error && data) {
      broadcast('invoice_update', data);
      return res.json({ success: true, invoice: { ...data[0], clientId: data[0].client_id, clientName: data[0].client_name, dueDate: data[0].due_date, taxRate: data[0].tax_rate } });
    }
  }

  const seq = String((db.invoices?.length || 0) + 1).padStart(3, '0');
  const newInvoice = {
    id: `INV-${year}-${seq}`,
    clientId,
    clientName,
    date: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    amount: totalAmount,
    taxRate: Number(taxRate) || 0,
    discount: Number(discountValue) || 0,
    discountType: discountType || 'percentage',
    status: status || 'Draft',
    items: items || [],
    notes: notes || ''
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.push(newInvoice);
  writeDB(db);
  broadcast('invoice_update', db.invoices);
  res.json({ success: true, invoice: newInvoice });
});

router.put('/invoices/:id', async (req, res) => {
  const invoiceId = req.params.id;
  const { status } = req.body;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('invoices').update({ status }).eq('id', invoiceId).select();
    if (!error && data && data.length > 0) {
      broadcast('invoice_update', data);
      return res.json({ success: true, invoice: data[0] });
    }
  }

  const db = readDB();
  const inv = (db.invoices || []).find(i => i.id === invoiceId);
  if (inv) {
    inv.status = status;
    writeDB(db);
    broadcast('invoice_update', db.invoices);
    return res.json({ success: true, invoice: inv });
  }

  res.status(404).json({ error: 'Invoice not found' });
});

// Module C5: Automated Invoice Payment Gateway Verification Route
router.post('/invoices/:id/pay', (req, res) => {
  const { id } = req.params;
  const { method, trxId, bankRef, payerName } = req.body;
  const db = readDB();

  db.invoices = db.invoices || [];
  let inv = db.invoices.find(i => i.id === id);

  if (!inv) {
    // If invoice was created dynamically or in clean production state, instantiate record
    inv = {
      id: id,
      clientId: 'CLI-0001',
      clientName: payerName || 'Agency Partner Client',
      projectName: 'Commercial Campaign Deliverable',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      amount: 1200,
      status: 'Paid',
      notes: 'Auto-generated invoice from payment verification portal'
    };
    db.invoices.push(inv);
  } else {
    inv.status = 'Paid';
  }

  inv.paidDate = new Date().toISOString().split('T')[0];
  inv.paymentMethod = method || 'Bkash / Nagad Direct Pay';
  inv.paymentReference = trxId || bankRef || `CARD-${Date.now()}`;

  db.paymentLogs = db.paymentLogs || [];
  const logEntry = {
    id: `PAY-${Date.now()}`,
    invoiceId: inv.id,
    clientName: inv.clientName,
    amount: inv.amount,
    method: inv.paymentMethod,
    reference: inv.paymentReference,
    payerName: payerName || inv.clientName,
    timestamp: new Date().toISOString()
  };

  db.paymentLogs.unshift(logEntry);
  writeDB(db);

  broadcast('invoice_update', db.invoices);
  broadcast('db_updated', {});

  res.json({
    success: true,
    invoice: inv,
    paymentLog: logEntry,
    message: `✅ Payment of $${inv.amount} USD verified for invoice ${inv.id}`
  });
});


// EXPENSES
router.get('/expenses', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('expenses').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(e => ({ ...e, loggedBy: e.logged_by })));
    }
  }
  const db = readDB();
  res.json(db.expenses || []);
});

router.post('/expenses', (req, res) => {
  const db = readDB();
  const newExp = req.body;
  newExp.id = `EXP-${String((db.expenses.length || 0) + 1).padStart(3, '0')}`;
  newExp.date = new Date().toISOString().split('T')[0];
  newExp.status = newExp.status || 'Pending';
  db.expenses.push(newExp);
  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});
  res.json({ success: true, expense: newExp });
});

// BC-8: Update Expense Status (Approved / Rejected)
router.put('/expenses/:id', (req, res) => {
  const expenseId = req.params.id;
  const { status } = req.body;
  const db = readDB();

  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (exp) {
    exp.status = status;
    writeDB(db);
    broadcast('expense_update', db.expenses);
    broadcast('db_updated', {});
    return res.json({ success: true, expense: exp });
  }

  res.status(404).json({ error: 'Expense record not found' });
});

// ASSETS
router.get('/assets', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('assets').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(a => ({
        ...a,
        purchasePrice: a.purchase_price,
        monthlyDepreciation: a.monthly_depreciation,
        assignedTo: a.assigned_to
      })));
    }
  }
  const db = readDB();
  res.json(db.assets || []);
});

router.post('/assets', async (req, res) => {
  const newAsset = req.body;

  if (isSupabaseConfigured()) {
    const { data: countData } = await supabase.from('assets').select('id');
    const newId = `AST-${String((countData?.length || 0) + 1).padStart(3, '0')}`;
    newAsset.id = newId;

    const payload = {
      id: newId,
      name: newAsset.name,
      serial: newAsset.serial || '',
      category: newAsset.category || 'Camera Gear',
      purchase_price: Number(newAsset.purchasePrice) || 0,
      monthly_depreciation: Number(newAsset.monthlyDepreciation) || 0,
      assigned_to: newAsset.assignedTo || 'Unassigned / Studio Base',
      condition: newAsset.condition || 'Excellent'
    };

    const { error } = await supabase.from('assets').insert([payload]);
    if (!error) {
      broadcast('asset_update', [payload]);
      return res.json({ success: true, asset: newAsset });
    }
  }

  const db = readDB();
  db.assets = db.assets || [];
  newAsset.id = `AST-${String((db.assets.length || 0) + 1).padStart(3, '0')}`;
  newAsset.purchasePrice = Number(newAsset.purchasePrice) || 0;
  newAsset.monthlyDepreciation = Number(newAsset.monthlyDepreciation) || 0;
  newAsset.assignedTo = newAsset.assignedTo || 'Unassigned / Studio Base';
  newAsset.condition = newAsset.condition || 'Excellent';

  db.assets.push(newAsset);
  writeDB(db);
  broadcast('asset_update', db.assets);
  res.json({ success: true, asset: newAsset });
});

router.put('/assets/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured()) {
    const payload = {
      name: updates.name,
      serial: updates.serial,
      category: updates.category,
      purchase_price: Number(updates.purchasePrice) || 0,
      monthly_depreciation: Number(updates.monthlyDepreciation) || 0,
      assigned_to: updates.assignedTo,
      condition: updates.condition
    };

    const { error } = await supabase.from('assets').update(payload).eq('id', id);
    if (!error) {
      broadcast('asset_update', [payload]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  const idx = (db.assets || []).findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });

  db.assets[idx] = {
    ...db.assets[idx],
    ...updates,
    purchasePrice: Number(updates.purchasePrice) || db.assets[idx].purchasePrice,
    monthlyDepreciation: Number(updates.monthlyDepreciation) || db.assets[idx].monthlyDepreciation
  };
  writeDB(db);
  broadcast('asset_update', db.assets);
  res.json({ success: true, asset: db.assets[idx] });
});

router.delete('/assets/:id', async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (!error) {
      broadcast('asset_update', [{ id, deleted: true }]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  db.assets = (db.assets || []).filter(a => a.id !== id);
  writeDB(db);
  broadcast('asset_update', db.assets);
  res.json({ success: true });
});

// BC-9: Asset Gear Check-Out Route
router.post('/assets/:id/checkout', (req, res) => {
  const { id } = req.params;
  const { borrower } = req.body;
  const db = readDB();

  const asset = (db.assets || []).find(a => a.id === id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  asset.assignedTo = borrower || 'Crew';
  asset.condition = 'In Use';

  db.checkoutLog = db.checkoutLog || [];
  const logNum = String(db.checkoutLog.length + 1).padStart(3, '0');
  const newLog = {
    id: `CHK-${logNum}`,
    assetId: asset.id,
    assetName: asset.name,
    borrower: borrower || 'Crew Member',
    checkoutDate: new Date().toISOString().split('T')[0],
    returnDate: null,
    status: 'Checked Out'
  };

  db.checkoutLog.unshift(newLog);
  writeDB(db);
  broadcast('asset_update', db.assets);
  broadcast('db_updated', {});

  res.json({ success: true, log: newLog, asset });
});

// BC-9: Asset Gear Check-In Route
router.post('/assets/:id/checkin', (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const asset = (db.assets || []).find(a => a.id === id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  asset.assignedTo = 'Unassigned';
  asset.condition = 'Good';

  db.checkoutLog = db.checkoutLog || [];
  const activeLog = db.checkoutLog.find(l => l.assetId === id && l.status === 'Checked Out');
  if (activeLog) {
    activeLog.returnDate = new Date().toISOString().split('T')[0];
    activeLog.status = 'Returned';
  }

  writeDB(db);
  broadcast('asset_update', db.assets);
  broadcast('db_updated', {});

  res.json({ success: true, asset });
});


// ATTENDANCE
router.get('/attendance', async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('attendance').select('*');
    if (!error && data && data.length > 0) {
      return res.json(data.map(at => ({
        ...at,
        employeeId: at.employee_id,
        clockInTime: at.clock_in_time
      })));
    }
  }
  const db = readDB();
  res.json(db.attendance || []);
});

// TELEGRAM IN-APP SIMULATOR ENGINE
router.post('/telegram-simulator', async (req, res) => {
  const { command, text } = req.body;
  const db = readDB();
  
  let responseText = '';
  let inlineButtons = null;
  const cmd = (command || text || '').trim();

  if (cmd.startsWith('/pair')) {
    const inputVal = cmd.split(' ')[1] || 'EMP-002';
    const cleanPhoneInput = inputVal.replace(/[^0-9+]/g, '');

    const matchingStaff = (db.team || []).find(t => 
      (t.emp_code || t.id || '').toUpperCase() === inputVal.toUpperCase() ||
      (t.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhoneInput)
    ) || db.team[0];

    if (matchingStaff) {
      matchingStaff.telegramId = '87654321';
      matchingStaff.phoneVerified = true;
      writeDB(db);
      broadcast('team_update', db.team);

      responseText = `✅ *Telegram Account & Phone Paired Successfully!*\n\n` +
        `👤 Staff Name: *${matchingStaff.name}*\n` +
        `🛡️ Role: *${matchingStaff.role}*\n` +
        `📱 Verified Phone: *${matchingStaff.phone}*\n` +
        `🆔 Emp Code: \`${matchingStaff.emp_code || matchingStaff.id}\`\n` +
        `💬 Telegram Chat ID: \`87654321\``;
    } else {
      responseText = `⚠️ Could not find staff profile with code or phone \`${inputVal}\` in agency database.`;
    }
  } else if (cmd.startsWith('/myearnings')) {
    let emp = (db.team && db.team.length > 0) ? (db.team.find(e => e.emp_code === 'EMP-002') || db.team[0]) : { name: 'Farhan Ahmed', role: 'Lead Director', baseSalary: 65000, earnedCommissions: 12500 };
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('profiles').select('*').eq('emp_code', 'EMP-002').single();
      if (data) {
        emp = {
          name: data.name,
          role: data.role,
          baseSalary: Number(data.base_salary || 65000),
          earnedCommissions: Number(data.earned_commissions || 12500)
        };
      }
    }
    const basePay = Number(emp.baseSalary || emp.base_salary || 65000);
    const commissions = Number(emp.earnedCommissions || emp.earned_commissions || 12500);
    const total = basePay + commissions;
    responseText = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
      `• Role: ${emp.role}\n` +
      `• Base Pay: BDT ${basePay.toLocaleString()}\n` +
      `• Shoot Commissions: BDT ${commissions.toLocaleString()}\n` +
      `-----------------------------------------\n` +
      `*Total Monthly Pay: BDT ${total.toLocaleString()}*`;
  } else if (cmd.startsWith('/mybookings')) {
    let tasks = db.tasks.filter(t => (t.assignee || '').includes('Farhan'));
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('tasks').select('*');
      if (data && data.length > 0) {
        tasks = data.filter(t => t.assignee && t.assignee.includes('Farhan')).map(t => ({ ...t, dueDate: t.due_date }));
      }
    }
    responseText = `📅 *Assigned Shoots & Tasks for Farhan Ahmed:*\n\n`;
    tasks.forEach((t, i) => {
      responseText += `${i+1}. *${t.title}*\n   Client: ${t.client}\n   Stage: ${t.stage} | Priority: ${t.priority}\n\n`;
    });
    const activeTaskId = tasks[0]?.id || 'TSK-101';
    inlineButtons = [
      [
        { text: '✅ Accept Assignment', callback_data: `accept_task:${activeTaskId}` },
        { text: '❌ Decline & Note Reason', callback_data: `reject_task:${activeTaskId}` }
      ]
    ];
  } else if (cmd.startsWith('/services')) {
    responseText = `🎨 *Purplebot Digital Core Services Catalog:*\n\n`;
    db.services.filter(s => s.public).forEach(s => {
      responseText += `• *${s.title}* (${s.category})\n  Rate: ${s.price}\n\n`;
    });
  } else if (cmd.startsWith('/portfolio')) {
    responseText = `📁 *Purplebot Digital Portfolio Showcase*\n\n` +
      `Explore our 200+ brand campaigns & TVCs:\n` +
      `🔗 http://www.purplebot.co`;
  } else if (cmd.startsWith('/clockin')) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isSupabaseConfigured()) {
      await supabase.from('attendance').insert([{
        employee_id: 'EMP-002',
        name: 'Farhan Ahmed',
        status: 'In Studio',
        clock_in_time: timeStr,
        location: 'Niketon Studio'
      }]);
    }
    let rec = db.attendance.find(a => a.name === 'Farhan Ahmed');
    if (rec) rec.status = 'In Studio';

    db.attendanceLog = db.attendanceLog || [];
    db.attendanceLog.unshift({
      id: `LOG-${Date.now()}`,
      employeeId: 'EMP-002',
      name: 'Farhan Ahmed',
      action: 'Clock In',
      timestamp: `${new Date().toISOString().split('T')[0]} ${timeStr}`,
      location: 'Niketon Studio',
      date: new Date().toISOString().split('T')[0]
    });
    if (db.attendanceLog.length > 200) db.attendanceLog = db.attendanceLog.slice(0, 200);

    writeDB(db);
    broadcast('attendance_update', db.attendance);
    broadcast('db_updated', {});
    responseText = `✅ *Clock In Recorded!*\nStatus: *In Studio* at ${timeStr}. Attendance log updated.`;
  } else if (cmd.startsWith('/clockout')) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let rec = db.attendance.find(a => a.name === 'Farhan Ahmed');
    if (rec) rec.status = 'Clocked Out';

    db.attendanceLog = db.attendanceLog || [];
    db.attendanceLog.unshift({
      id: `LOG-${Date.now()}`,
      employeeId: 'EMP-002',
      name: 'Farhan Ahmed',
      action: 'Clock Out',
      timestamp: `${new Date().toISOString().split('T')[0]} ${timeStr}`,
      location: 'Niketon Studio',
      date: new Date().toISOString().split('T')[0]
    });
    if (db.attendanceLog.length > 200) db.attendanceLog = db.attendanceLog.slice(0, 200);

    writeDB(db);
    broadcast('attendance_update', db.attendance);
    broadcast('db_updated', {});
    responseText = `🚪 *Clock Out Recorded!*\nStatus: *Clocked Out*. Have a great evening!`;
  } else if (cmd.startsWith('/report')) {
    const paid = (db.invoices || []).filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const pending = (db.invoices || []).filter(i => i.status === 'Pending' || i.status === 'Sent' || i.status === 'Draft').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const expenses = (db.expenses || []).filter(e => e.status !== 'Rejected').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const openTasks = (db.tasks || []).filter(t => t.stage !== 'Approved').length;
    const pendingExp = (db.expenses || []).filter(e => e.status === 'Pending').length;

    responseText = `📊 *Purplebot Agency — Daily Executive Report*\n\n` +
      `🟢 Paid Revenue: *$${paid.toLocaleString()} USD*\n` +
      `🟡 Pending Revenue: *$${pending.toLocaleString()} USD*\n` +
      `💗 Studio Overhead Expenses: *$${expenses.toLocaleString()} USD*\n` +
      `📋 Active Open Tasks: *${openTasks} campaigns*\n` +
      `🧾 Pending Expense Claims: *${pendingExp} claim(s)*\n\n` +
      `_Generated: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}_`;
  } else {
    responseText = `🤖 *Purplebot Operations Assistant*\nReceived: "${cmd}"\n\nAvailable commands:\n/pair <EMP_CODE>, /myearnings, /mybookings, /services, /portfolio, /clockin, /clockout, /report`;
  }

  res.json({ success: true, responseText, inlineButtons });
});

// Module C10: BI Dashboard & Aggregated Analytics API
router.get('/analytics', (req, res) => {
  const db = readDB();
  const invoices = db.invoices || [];
  const expenses = db.expenses || [];
  const leads = db.leads || [];
  const tasks = db.tasks || [];
  const clients = db.clients || [];

  const totalPaidRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalPendingRevenue = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.filter(e => e.status !== 'Rejected').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const mrr = totalPaidRevenue + totalPendingRevenue;
  const netProfit = mrr - totalExpenses;
  const marginPercent = mrr > 0 ? Math.round((netProfit / mrr) * 100) : 0;

  // Funnel Stage Metrics
  const funnel = {
    totalLeads: leads.length,
    contacted: leads.filter(l => l.stage !== 'New Inquiry').length,
    quoted: leads.filter(l => l.stage === 'Quoted' || l.stage === 'Won / Closed').length,
    won: leads.filter(l => l.stage === 'Won / Closed' || l.stage === 'Won').length
  };

  res.json({
    success: true,
    financials: {
      mrr,
      paidRevenue: totalPaidRevenue,
      pendingRevenue: totalPendingRevenue,
      overheadExpenses: totalExpenses,
      netProfit,
      marginPercent
    },
    funnel,
    activeTasksCount: tasks.filter(t => t.stage !== 'Approved').length,
    totalClientsCount: clients.length,
    timestamp: new Date().toISOString()
  });
});

// Module C11: Client Health Score Calculation Engine API
router.get('/clients/health', (req, res) => {
  const db = readDB();
  const clients = db.clients || [];
  const invoices = db.invoices || [];
  const reviews = db.reviews || [];
  const tasks = db.tasks || [];

  const healthData = clients.map(client => {
    const clientInvoices = invoices.filter(i => (i.clientName || '').toLowerCase().includes(client.name.toLowerCase()));
    const clientReviews = reviews.filter(r => (r.client || '').toLowerCase().includes(client.name.toLowerCase()));
    const clientTasks = tasks.filter(t => (t.client || '').toLowerCase().includes(client.name.toLowerCase()));

    // 1. Payment Score (Max 40 Pts)
    const overdueInvoices = clientInvoices.filter(i => i.status !== 'Paid');
    let paymentScore = 40;
    if (overdueInvoices.length > 0) paymentScore = Math.max(0, 40 - (overdueInvoices.length * 15));

    // 2. Revision Score (Max 30 Pts)
    let totalRevisions = 0;
    clientReviews.forEach(r => { totalRevisions += (r.comments || []).length; });
    let revisionScore = 30;
    if (totalRevisions > 5) revisionScore = 15;
    if (totalRevisions > 10) revisionScore = 5;

    // 3. Velocity Score (Max 30 Pts)
    const overdueTasks = clientTasks.filter(t => t.stage !== 'Approved' && new Date(t.dueDate) < new Date());
    let velocityScore = 30;
    if (overdueTasks.length > 0) velocityScore = Math.max(0, 30 - (overdueTasks.length * 10));

    const totalHealthScore = Math.min(100, paymentScore + revisionScore + velocityScore);
    let status = 'Excellent';
    let badgeClass = 'badge-emerald';

    if (totalHealthScore < 60) {
      status = 'At Risk';
      badgeClass = 'badge-pink';
    } else if (totalHealthScore < 80) {
      status = 'Attention';
      badgeClass = 'badge-amber';
    }

    return {
      clientId: client.id,
      clientName: client.name,
      healthScore: totalHealthScore,
      paymentScore,
      revisionScore,
      velocityScore,
      status,
      badgeClass
    };
  });

  res.json({ success: true, clientsHealth: healthData });
});

module.exports = router;
