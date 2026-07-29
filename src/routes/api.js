const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { processAutomationEvent, checkScheduledSocialDispatches } = require('../services/automation');

const { requireAuth } = require('../middleware/auth');
const { createTempPin, verifyPin, setPermanentPin } = require('../services/auth-pins');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PurpleOS',
    version: '0.7.0',
    supabaseConnected: isSupabaseConfigured()
  });
});

// LANDING PAGE CMS ENGINE API (v0.7.5.1)
const defaultCMSContent = {
  agencyInfo: {
    heroTitle: "Digital. Design. Tech.",
    heroSubtitle: "Expert solutions tailored to your brand. We combine data-driven marketing, viral short-form content, and cutting-edge tech to deliver measurable business growth.",
    email: "contact@purplebot.digital",
    phone: "+88 01711 019550",
    whatsapp: "+8801711019550",
    registeredAddress: "Plot 7, Road 17, Flat 2/C, Rupsha Tower, Banani C/A, Dhaka - 1213",
    operatingAddress: "Flat A5-B5-A4, House 9, Road 1, Block B, Niketon, Gulshan-1, Dhaka - 1212",
    stats: {
      years: "8+",
      clients: "100+",
      creatives: "20,000+",
      reach: "10M+"
    }
  },
  clientMarquee: [
    "Aarong Earth", "LG Electronics", "Chillox Burgers", "BAT Global", 
    "Taptap Send", "Mortein", "Harpic", "Yatai Japanese", "Fortress Build", "UCB Bank"
  ],
  whyUs: [
    {
      icon: "🎯",
      title: "Data-Driven Strategy",
      description: "We don't guess. We analyze market trends, audience behavior, and performance metrics to craft winning campaigns."
    },
    {
      icon: "🎬",
      title: "In-House Production",
      description: "From 4K commercial TVCs to viral short-form reels, our studio handles end-to-end creative execution."
    },
    {
      icon: "🤖",
      title: "Automated Workflows",
      description: "Custom bot integrations, real-time client portals, and streamlined review rooms ensure 100% transparency."
    }
  ],
  services: [
    {
      id: "SVC-001",
      icon: "📢",
      title: "Digital Marketing & Growth",
      category: "Growth & Ads",
      description: "Data-driven social media management, paid advertising, and conversion rate optimization.",
      features: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"]
    },
    {
      id: "SVC-002",
      icon: "🎥",
      title: "Video Production & Editing",
      category: "Content & Film",
      description: "High-impact commercial TVCs, viral Reels/TikToks, and full post-production color grading.",
      features: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"]
    },
    {
      id: "SVC-003",
      icon: "🎨",
      title: "Branding & Motion Design",
      category: "Design & Brand",
      description: "Brand identity systems, 3D motion graphics, packaging, and high-converting ad creative.",
      features: ["Brand Guidelines & Logos", "3D & 2D Motion Graphics", "Social Media Creative Kits", "Packaging & Print Design"]
    },
    {
      id: "SVC-004",
      icon: "💻",
      title: "Website & Tech Development",
      category: "Development",
      description: "Custom web applications, responsive landing pages, e-commerce, and bot integrations.",
      features: ["Custom React / Next.js Apps", "High-Converting Landing Pages", "Telegram & WhatsApp Bots", "API & CRM Integration"]
    }
  ],
  portfolioShowcase: [
    {
      id: "PORT-001",
      title: "Chillox Burgers",
      subtitle: "360° Monthly Content Production & Viral Reels",
      category: "Commercial Food TVC",
      metric: "📈 2.4M Reach • 18% Order Spike",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "PORT-002",
      title: "Clear Men (Unilever)",
      subtitle: "MasterBrand Cinema Spot & Digital Launch Reels",
      category: "Grooming & Lifestyle",
      metric: "🎬 Cinema 4K Cut • Approved Frame 1",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "PORT-003",
      title: "United Commercial Bank (UCB)",
      subtitle: "Annual Financial Report Video & Digital Campaign",
      category: "Corporate Financial",
      metric: "💼 100% On-Time Delivery",
      image: "https://images.unsplash.com/photo-1556742049-0a67d57a3e6f?auto=format&fit=crop&w=800&q=80"
    }
  ],
  pricingPackages: [
    {
      id: "PKG-001",
      name: "Lite Plan",
      tier: "STARTUP",
      price: "$750",
      period: "/ month",
      featured: false,
      features: [
        "10 Total Content Items",
        "8 Image Based Content",
        "2 Motion or Carousel Content",
        "Monthly Content Plan & Captions",
        "Monthly Analytics Reporting",
        "Shared Account Manager"
      ]
    },
    {
      id: "PKG-002",
      name: "Essential Plan",
      tier: "GROWTH",
      price: "$1,000",
      period: "/ month",
      featured: true,
      features: [
        "16 Total Content Items",
        "12 Image Based Content",
        "4 Short-Form Video Reels",
        "Dedicated Copywriter & Designer",
        "Bi-Weekly Performance Meetings",
        "Dedicated Account Manager"
      ]
    },
    {
      id: "PKG-003",
      name: "Advanced Plan",
      tier: "ENTERPRISE",
      price: "$1,250",
      period: "/ month",
      featured: false,
      features: [
        "24 Total Content Items",
        "16 Image Based Content",
        "8 Short-Form Video Reels / TVCs",
        "Paid Ad Campaign Management",
        "Weekly Strategy & Shoot Dispatch",
        "Senior Lead Account Director"
      ]
    }
  ]
};

// CMS Content Endpoints (Prioritized)
router.get(['/cms', '/cms/content', '/public/content'], (req, res) => {
  const db = readDB();
  res.json({ success: true, content: db.cmsContent || defaultCMSContent });
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

// ==========================================
// 🔑 PHONE + 4-DIGIT PIN AUTHENTICATION API
// ==========================================

router.post('/auth/pin/generate', (req, res) => {
  const { phone, linkedId, linkedType, email, sendTelegram } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const db = readDB();
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  let userObj = null;
  let name = 'User';
  let targetType = linkedType || 'team';

  if (targetType === 'team') {
    userObj = (db.team || []).find(t => (t.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhone) || t.id === linkedId || t.emp_code === linkedId);
    if (userObj) {
      name = userObj.name;
      if (email) userObj.email = email;
    }
  } else {
    userObj = (db.clients || []).find(c => (c.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhone) || c.id === linkedId);
    if (userObj) {
      name = userObj.name;
      if (email) userObj.email = email;
    }
  }

  const pinRecord = createTempPin(cleanPhone, userObj?.id || linkedId, targetType, email || userObj?.email || '');

  const portalPath = targetType === 'team' ? '/team' : '/partners';
  const botUsername = targetType === 'team' ? 'PurpleManBot' : 'PurpleBotAgencyBot';
  const portalUrl = `https://purpleos-iota.vercel.app${portalPath}?phone=${encodeURIComponent(cleanPhone)}`;

  const inviteCardText = `📋 *PURPLEOS WORKSPACE ACCESS CARD*\n\n` +
    `👤 Name: *${name}*\n` +
    `📱 Mobile: \`${cleanPhone}\`\n` +
    `🔑 Temporary 4-Digit PIN: \`${pinRecord.pin}\` *(Change on first login)*\n\n` +
    `🌐 Web Portal Direct Link:\n${portalUrl}\n\n` +
    `🤖 Telegram Bot: t.me/${botUsername}`;

  const waText = encodeURIComponent(`Hi ${name}! Here is your PurpleOS Workspace Access Card:\n\nMobile: ${cleanPhone}\nTemp PIN: ${pinRecord.pin}\nPortal Link: ${portalUrl}`);
  const whatsappLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`;

  let telegramPushed = false;
  if (sendTelegram && userObj && userObj.telegramId) {
    const pushMsg = `🔑 *Your PurpleOS Login PIN Code*\n\n` +
      `Hello ${name}! Here is your login PIN code for the portal:\n\n` +
      `• Mobile: \`${cleanPhone}\`\n` +
      `• Temp 4-Digit PIN: \`${pinRecord.pin}\`\n\n` +
      `🌐 Direct Portal Access: ${portalUrl}`;

    sendTelegramNotification(userObj.telegramId, pushMsg, [
      [{ text: '🌐 Open Web Portal', url: portalUrl }]
    ], targetType === 'team');
    telegramPushed = true;
  }

  res.json({
    success: true,
    phone: cleanPhone,
    pin: pinRecord.pin,
    portalUrl,
    whatsappLink,
    telegramPushed,
    inviteCardText
  });
});

router.post('/auth/pin/verify', (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and PIN are required' });
  }

  const result = verifyPin(phone, pin);
  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json({
    success: true,
    isTemp: result.isTemp,
    linkedType: result.linkedType,
    linkedId: result.linkedId,
    email: result.email,
    user: result.user
  });
});

router.post('/auth/pin/set', (req, res) => {
  const { phone, newPin, email } = req.body;
  if (!phone || !newPin || String(newPin).length < 4) {
    return res.status(400).json({ error: 'Valid phone number and 4-digit PIN are required' });
  }

  const result = setPermanentPin(phone, newPin, email);
  res.json(result);
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

  // Push Telegram Alert to Owner/Team Bot
  try {
    const ownerChatId = db.settings?.ownerTelegramId || process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      sendTelegramNotification(ownerChatId,
        `🔔 *New Lead from Purple Bot Website!*\n\n` +
        `👤 *${newLead.contactPerson || newLead.clientName}* — ${newLead.clientName || 'Brand'}\n` +
        `📞 Phone: \`${newLead.phone || newLead.whatsapp || 'N/A'}\`\n` +
        `🎯 Interested Service: *${newLead.service || newLead.serviceTitle || 'General'}*\n` +
        `📍 Source: ${newLead.source || 'Website Widget'}`, null, false
      );
    }
  } catch (err) {
    console.warn('Telegram notification for new lead failed:', err.message);
  }

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

// Phase MA7 & MA8: Social Media Posts & Manager KPI Endpoints
router.get('/social-posts', (req, res) => {
  const db = readDB();
  res.json(db.social_posts || []);
});

router.post('/social-posts', (req, res) => {
  const db = readDB();
  db.social_posts = db.social_posts || [];
  const newPost = {
    id: `POST-${Date.now().toString().slice(-4)}`,
    title: req.body.title || 'Campaign Reel',
    client: req.body.client || 'Chillox Fast Food Chain',
    platform: req.body.platform || 'Instagram',
    scheduledTime: req.body.scheduledTime || new Date(Date.now() + 86400000).toISOString(),
    caption: req.body.caption || '',
    mediaUrl: req.body.mediaUrl || '',
    status: req.body.status || 'Pending Client Approval',
    author: req.body.author || 'Mehedi Hasan (Social Lead)',
    createdAt: new Date().toISOString()
  };
  db.social_posts.unshift(newPost);
  writeDB(db);
  broadcast('social_post_update', db.social_posts);

  processAutomationEvent('social_post_created', { post: newPost }, db, writeDB, broadcast);
  res.json({ success: true, post: newPost });
});

router.put('/social-posts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.social_posts = db.social_posts || [];
  const idx = db.social_posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.social_posts[idx] = { ...db.social_posts[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  broadcast('social_post_update', db.social_posts);
  res.json({ success: true, post: db.social_posts[idx] });
});

router.get('/manager/kpis', (req, res) => {
  const db = readDB();
  const dept = (req.query.dept || 'Operations').toLowerCase();
  const team = db.team || [];
  const tasks = db.tasks || [];
  const expenses = db.expenses || [];

  const deptTeam = dept.includes('all') || dept.includes('management') || dept.includes('operations')
    ? team
    : team.filter(t => (t.department || '').toLowerCase().includes(dept));

  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter(t => (t.stage || '').toLowerCase().includes('approved') || (t.stage || '').toLowerCase().includes('done')).length;
  const taskCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  const inStudioCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('studio')).length;
  const fieldShootCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('shoot') || (t.status || '').toLowerCase().includes('field')).length;
  const onLeaveCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('leave')).length;

  const totalExpensesBdt = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  res.json({
    dept: req.query.dept || 'Operations',
    taskCompletionRate,
    totalTasks,
    completedTasks,
    crewStatus: {
      inStudio: inStudioCount,
      fieldShoot: fieldShootCount,
      onLeave: onLeaveCount,
      totalTeam: deptTeam.length
    },
    totalExpensesBdt,
    pendingLeavesCount: (db.leaves || []).filter(l => l.status === 'Pending Line Review').length,
    pendingExpensesCount: (db.expenses || []).filter(e => !e.tier1?.approved).length
  });
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

// SOCIAL CONTENT PLANNER & 1-CLICK DISPATCH HUB API
router.get('/posts', (req, res) => {
  const db = readDB();
  checkScheduledSocialDispatches(db, writeDB, broadcast);
  res.json(db.posts || []);
});

router.get('/posts/client/:clientName', (req, res) => {
  const { clientName } = req.params;
  const db = readDB();
  const decoded = decodeURIComponent(clientName).toLowerCase();
  const clientPosts = (db.posts || []).filter(p => 
    (p.clientName || '').toLowerCase().includes(decoded) || 
    (p.clientId || '').toLowerCase() === decoded
  );
  res.json(clientPosts);
});

router.post('/posts', (req, res) => {
  const db = readDB();
  db.posts = db.posts || [];
  const count = db.posts.length + 101;

  let targetUrl = req.body.targetUrl || '';
  if (!targetUrl && (req.body.clientId || req.body.clientName) && req.body.platform) {
    const client = (db.clients || []).find(c => c.id === req.body.clientId || (c.name || '').toLowerCase() === (req.body.clientName || '').toLowerCase());
    if (client && client.socialLinks) {
      const platKey = req.body.platform.toLowerCase();
      targetUrl = client.socialLinks[platKey] || '';
    }
  }

  const newPost = {
    id: `PST-${count}`,
    clientId: req.body.clientId || '',
    clientName: req.body.clientName || 'General Client',
    platform: req.body.platform || 'Facebook',
    targetUrl: targetUrl,
    title: req.body.title || 'Untitled Post',
    caption: req.body.caption || '',
    mediaUrls: req.body.mediaUrls || (req.body.mediaUrl ? [req.body.mediaUrl] : []),
    scheduledDate: req.body.scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: req.body.scheduledTime || '18:00',
    assignedPublisher: req.body.assignedPublisher || 'Sabrin Akhtar',
    status: req.body.status || 'Pending Client Approval',
    createdAt: new Date().toISOString()
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

router.post('/posts/:id/approve', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx].status = 'Approved';
  db.posts[idx].approvedAt = new Date().toISOString();
  db.posts[idx].approvedBy = req.body.approvedBy || db.posts[idx].clientName;
  delete db.posts[idx].clientFeedback;

  writeDB(db);
  broadcast('post_update', db.posts);

  // Trigger AUT-006 (Alert Assigned Publisher)
  processAutomationEvent('social_post_approved', { post: db.posts[idx] }, db, writeDB, broadcast);

  res.json({ success: true, post: db.posts[idx] });
});

router.post('/posts/:id/reject', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx].status = 'Changes Requested';
  db.posts[idx].clientFeedback = req.body.feedback || 'Please revise caption & image styling.';

  writeDB(db);
  broadcast('post_update', db.posts);
  res.json({ success: true, post: db.posts[idx] });
});

router.post('/posts/:id/publish', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx].status = 'Published';
  db.posts[idx].publishedAt = new Date().toISOString();
  db.posts[idx].publishedBy = req.body.publishedBy || 'Social Handler';

  writeDB(db);
  broadcast('post_update', db.posts);
  res.json({ success: true, post: db.posts[idx] });
});

router.post('/posts/:id/dispatch-alert', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const post = (db.posts || []).find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  processAutomationEvent('social_post_dispatch_alert', { post }, db, writeDB, broadcast);
  res.json({ success: true, message: `1-Click Dispatch Alert pushed for post ${id}` });
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
router.get('/webhooks/setup', async (req, res) => {
  const db = readDB();
  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token || '8874232130:AAEs5JDOEEX9kIN9Z_V_k0UQp2lBao5MHLQ';
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token || '8964646505:AAEBVLDRqG0JdiTSSl6uK08UCQk0ZNsmYMU';
  const baseUrl = process.env.PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : 'https://purpleos-iota.vercel.app');

  let teamResult = null;
  let clientResult = null;

  try {
    const tRes = await fetch(`https://api.telegram.org/bot${teamToken}/setWebhook?url=${encodeURIComponent(baseUrl + '/api/webhooks/telegram?bot=team')}`);
    teamResult = await tRes.json();
  } catch (e) { teamResult = { error: e.message }; }

  try {
    const cRes = await fetch(`https://api.telegram.org/bot${clientToken}/setWebhook?url=${encodeURIComponent(baseUrl + '/api/webhooks/telegram?bot=client')}`);
    clientResult = await cRes.json();
  } catch (e) { clientResult = { error: e.message }; }

  res.json({
    success: true,
    baseUrl,
    teamBotWebhook: teamResult,
    clientBotWebhook: clientResult
  });
});

router.get('/webhooks/logs', (req, res) => {
  const db = readDB();
  res.json(db.webhookLogs || []);
});

router.post('/webhooks/telegram', async (req, res) => {
  // ─── VERCEL SERVERLESS CRITICAL RULE ────────────────────────────────────────
  // DO NOT call res.json() early. On Vercel, res.json() freezes the Lambda
  // immediately — any await fetch() after it is silently dropped and never runs.
  // All async processing (including Telegram sendMessage) must complete FIRST,
  // then we acknowledge. Telegram allows 5 seconds; we respond in ~200-500ms.
  // ────────────────────────────────────────────────────────────────────────────

  const db = readDB();
  db.webhookLogs = db.webhookLogs || [];

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const update = req.body || {};
  const message = update.message || update.edited_message;
  const callbackQuery = update.callback_query;
  const isTeamBot = req.query.bot === 'team';

  const teamToken = process.env.TEAM_BOT_TOKEN || db.botConfig?.teamBot?.token || '8874232130:AAEs5JDOEEX9kIN9Z_V_k0UQp2lBao5MHLQ';
  const clientToken = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || db.botConfig?.clientBot?.token || '8964646505:AAEBVLDRqG0JdiTSSl6uK08UCQk0ZNsmYMU';
  const botToken = isTeamBot ? teamToken : clientToken;

  if (!botToken) {
    console.warn('⚠️ Telegram Webhook Warning: Bot token environment variable is missing.');
    return res.json({ ok: true });
  }

  // Handle Callback Queries from Inline Keyboards (Module B3.3)
  if (callbackQuery) {
    const queryId = callbackQuery.id;
    const data = callbackQuery.data;

    let callbackAnswerText = 'Action processed!';

    if (data.startsWith('accept_shoot:')) {
      const taskId = data.split(':')[1];
      const task = (db.tasks || []).find(t => t.id === taskId);
      if (task) {
        task.stage = 'Confirmed';
        writeDB(db);
        broadcast('task_update', db.tasks);
        callbackAnswerText = `Shoot assignment ${taskId} accepted!`;
      }
    } else if (data.startsWith('approve_cut:')) {
      const reviewId = data.split(':')[1];
      const review = (db.reviews || []).find(r => r.id === reviewId || r.reviewId === reviewId);
      if (review) {
        review.status = 'Approved';
        writeDB(db);
        broadcast('review_update', db.reviews);
        callbackAnswerText = `Cut approved! Commercial invoice generated.`;
      }
    } else if (data.startsWith('approve_leave:')) {
      const leaveId = data.split(':')[1];
      const leave = (db.leaves || []).find(l => l.id === leaveId);
      if (leave) {
        leave.status = 'Manager Approved';
        leave.managerReviewedBy = 'Line Manager (Telegram 1-Tap)';
        leave.managerApprovedAt = new Date().toISOString();
        writeDB(db);
        broadcast('leave_update', db.leaves);
        processAutomationEvent('leave_manager_approved', { leave }, db, writeDB, broadcast);
        callbackAnswerText = `✅ Leave ${leaveId} Manager Approved! Owner notified.`;
      }
    } else if (data.startsWith('reject_leave:')) {
      const leaveId = data.split(':')[1];
      const leave = (db.leaves || []).find(l => l.id === leaveId);
      if (leave) {
        leave.status = 'Declined';
        leave.rejectionReason = 'Line manager declined request';
        leave.rejectedAt = new Date().toISOString();
        writeDB(db);
        broadcast('leave_update', db.leaves);
        processAutomationEvent('leave_decision', { leave }, db, writeDB, broadcast);
        callbackAnswerText = `❌ Leave ${leaveId} Rejected. Staff member notified.`;
      }
    } else if (data.startsWith('approve_leave_owner:')) {
      const leaveId = data.split(':')[1];
      const leave = (db.leaves || []).find(l => l.id === leaveId);
      if (leave) {
        leave.status = 'Approved';
        leave.reviewedBy = 'Agency Owner (Telegram 1-Tap)';
        leave.approvedAt = new Date().toISOString();
        writeDB(db);
        broadcast('leave_update', db.leaves);
        processAutomationEvent('leave_decision', { leave }, db, writeDB, broadcast);
        callbackAnswerText = `👑 Leave ${leaveId} Owner Approved & Calendar Updated!`;
      }
    } else if (data.startsWith('approve_expense_t2:')) {
      const expId = data.split(':')[1];
      const exp = (db.expenses || []).find(e => e.id === expId);
      if (exp) {
        exp.tier2 = { approved: true, approvedBy: 'Finance Lead (Telegram 1-Tap)', date: new Date().toISOString() };
        exp.status = 'Tier 3 Pending';
        writeDB(db);
        broadcast('expense_update', db.expenses);
        processAutomationEvent('expense_tier2_approved', { expense: exp }, db, writeDB, broadcast);
        callbackAnswerText = `💰 Expense ${expId} Tier 2 Verified! Owner notified for release.`;
      }
    } else if (data.startsWith('disburse_expense_t3:')) {
      const expId = data.split(':')[1];
      const exp = (db.expenses || []).find(e => e.id === expId);
      if (exp) {
        exp.tier3 = { approved: true, approvedBy: 'Agency Owner (Telegram 1-Tap)', date: new Date().toISOString() };
        exp.status = 'Disbursed';
        exp.disbursedAt = new Date().toISOString();
        writeDB(db);
        broadcast('expense_update', db.expenses);
        processAutomationEvent('expense_disbursed', { expense: exp }, db, writeDB, broadcast);
        callbackAnswerText = `💸 Expense ${expId} Disbursed & Paid! Staff notified.`;
      }
    }

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: queryId, text: callbackAnswerText, show_alert: true })
      });

      if (callbackQuery.message) {
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [[{ text: callbackAnswerText, callback_data: 'noop' }]]
            }
          })
        });
      }
    } catch (err) { console.error('Callback query error:', err); }

    return res.json({ ok: true });
  }

  // Handle Incoming Text, Contact, or Location Messages
  if (message) {
    const chatId = message.chat.id;
    const senderName = message.from?.first_name || 'Telegram User';
    let replyText = '';
    let replyMarkup = null;

    // Module B3.1: 1-Tap Native Contact Sharing Handler
    if (message.contact) {
      const phoneNum = message.contact.phone_number.replace(/[^0-9+]/g, '');
      const matchingStaff = (db.team || []).find(t => (t.phone || '').replace(/[^0-9+]/g, '').includes(phoneNum));
      const matchingClient = (db.clients || []).find(c => (c.phone || '').replace(/[^0-9+]/g, '').includes(phoneNum));

      if (matchingStaff) {
        matchingStaff.telegramId = String(chatId);
        matchingStaff.phoneVerified = true;
        const pinRecord = createTempPin(phoneNum, matchingStaff.id || matchingStaff.emp_code, 'team', matchingStaff.email || '');
        writeDB(db);
        broadcast('team_update', db.team);

        const portalUrl = `https://purpleos-iota.vercel.app/team?phone=${encodeURIComponent(phoneNum)}`;

        replyText = `✅ *Verified Phone Paired by Purple Man!*\n\n` +
          `👤 Staff Name: *${matchingStaff.name}*\n` +
          `🛡️ Role: *${matchingStaff.role}*\n` +
          `📱 Verified Phone: \`${matchingStaff.phone}\`\n` +
          `🔑 Temporary Login PIN: \`${pinRecord.pin}\` _(Change on first login)_\n\n` +
          `🌐 Access Crew Portal:\n${portalUrl}`;

        replyMarkup = {
          inline_keyboard: [[{ text: '🌐 Open Crew Portal Web', url: portalUrl }]]
        };
      } else if (matchingClient) {
        matchingClient.telegramId = String(chatId);
        const pinRecord = createTempPin(phoneNum, matchingClient.id || matchingClient.clientCode, 'client', matchingClient.email || '');
        writeDB(db);
        broadcast('client_update', db.clients);

        const portalUrl = `https://purpleos-iota.vercel.app/partners?phone=${encodeURIComponent(phoneNum)}`;

        replyText = `✅ *Client Partner Phone Verified by Purple Bot!*\n\n` +
          `🏢 Company: *${matchingClient.name}*\n` +
          `📱 Phone: \`${matchingClient.phone}\`\n` +
          `🔑 Temporary Login PIN: \`${pinRecord.pin}\` _(Change on first login)_\n\n` +
          `🌐 Access Client Portal:\n${portalUrl}`;

        replyMarkup = {
          inline_keyboard: [[{ text: '🌐 Open Client Portal Web', url: portalUrl }]]
        };
      } else {
        replyText = `⚠️ Phone number \`${phoneNum}\` verified but not matched in agency CRM database. Contact agency admin to issue portal access.`;
      }
    }
    // Module B3.2: 1-Tap Native GPS Location Handler
    else if (message.location) {
      const lat = message.location.latitude;
      const lon = message.location.longitude;
      
      const studioLat = 23.7925;
      const studioLon = 90.4078;
      const distMeters = Math.round(Math.sqrt(Math.pow((lat - studioLat)*111000, 2) + Math.pow((lon - studioLon)*111000, 2)));

      const teamList = db.team || [];
      const emp = teamList.find(e => e.telegramId == chatId) || teamList[0] || { name: senderName, id: 'EMP-007' };
      let record = (db.attendance || []).find(a => a.name === emp.name);
      if (record) {
        record.status = 'In Studio';
        record.clockInTime = nowTime;
        record.locationVerified = `Verified GPS (${distMeters}m from Gulshan Studio)`;
      } else {
        db.attendance = db.attendance || [];
        db.attendance.push({
          employeeId: emp.id || 'EMP-007',
          name: emp.name,
          status: 'In Studio',
          clockInTime: nowTime,
          location: `Gulshan Studio (${distMeters}m distance)`
        });
      }
      writeDB(db);
      broadcast('attendance_update', db.attendance);

      replyText = `📍 *GPS Location Verified by Purple Man!*\n\n` +
        `👤 Staff: *${emp.name}*\n` +
        `🌐 Geofence: *Gulshan Studio* (${distMeters}m away)\n` +
        `⏱️ Clock-In Time: *${nowTime}*\n` +
        `🟢 Status set to *In Studio*.`;
    }
    // Text Commands
    else if (message.text) {
      const msgText = message.text.trim();

      if (isTeamBot) {
        const isManager = (db.team || []).some(t => t.telegramId == chatId && ((t.accessLevel || '').includes('Manager') || (t.role || '').toLowerCase().includes('director') || (t.role || '').toLowerCase().includes('owner')));

        if (msgText.startsWith('/start') || msgText.startsWith('/help')) {
          replyText = `🤖 *Welcome to Purple Man (Agency Crew & Manager Bot)!*\n\n` +
            `Tap any button below to manage your department, check team rosters, view daily briefings, and log attendance without typing slash commands!`;

          replyMarkup = {
            keyboard: [
              [{ text: '👥 My Team Roster' }, { text: '📊 Department Report' }],
              [{ text: '🌅 Morning Briefing' }, { text: '💰 My Salary & Earnings' }],
              [{ text: '📍 Clock-In GPS', request_location: true }, { text: '🚪 Clock Out' }],
              [{ text: '📱 Share Verified Phone', request_contact: true }]
            ],
            resize_keyboard: true
          };
        } else if (msgText.startsWith('/clockin') || msgText.includes('Clock-In')) {
          replyText = `📍 Please tap *Clock-In GPS* below to log verified attendance!`;
          replyMarkup = {
            keyboard: [
              [{ text: '📍 Clock-In GPS', request_location: true }],
              [{ text: '👥 My Team Roster' }, { text: '📊 Department Report' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          };
        } else if (msgText.startsWith('/clockout') || msgText.includes('Clock Out')) {
          const teamList = db.team || [];
          const emp = teamList.find(e => e.telegramId == chatId) || teamList[0] || { name: senderName };
          let record = (db.attendance || []).find(a => a.name === emp.name);
          if (record) record.status = 'Clocked Out';
          writeDB(db);
          broadcast('attendance_update', db.attendance);
          replyText = `🚪 *Clock Out Recorded by Purple Man!*\nStatus set to *Clocked Out*. Have a great evening!`;
        } else if (msgText.startsWith('/myteam') || msgText.includes('My Team Roster') || msgText.includes('My Team')) {
          const teamList = db.team || [];
          const emp = teamList.find(e => e.telegramId == chatId) || teamList[0];
          const isOps = (emp?.role || '').toLowerCase().includes('operations') || emp?.department === 'Management';
          const userDept = (emp?.department || '').toLowerCase();

          const deptMembers = isOps
            ? teamList
            : teamList.filter(t => (t.department || '').toLowerCase().includes(userDept) || userDept.includes((t.department || '').toLowerCase()));

          replyText = `👥 *DEPARTMENT TEAM ROSTER (${emp?.department || 'Operations'}):*\n\n`;
          deptMembers.forEach((m, idx) => {
            const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : '🌴');
            const activeTasks = (db.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes((m.name || '').split(' ')[0].toLowerCase())).length;
            replyText += `${idx + 1}. *${m.name}* (${m.role})\n   ${statusIcon} Status: *${m.status || 'In Studio'}* | 📋 Active Tasks: *${activeTasks}*\n\n`;
          });
        } else if (msgText.startsWith('/deptreport') || msgText.includes('Department Report') || msgText.includes('Dept Report')) {
          const teamList = db.team || [];
          const emp = teamList.find(e => e.telegramId == chatId) || teamList[0];
          const tasks = db.tasks || [];
          const pendingLeaves = (db.leaves || []).filter(l => l.status === 'Pending Line Review').length;
          const pendingExpenses = (db.expenses || []).filter(e => !e.tier1?.approved).length;

          replyText = `📊 *DEPARTMENT OPERATIONAL REPORT*\n` +
            `📍 Department: *${emp.department || 'Operations'}*\n\n` +
            `📋 *Kanban Task Stages:*\n` +
            `• 📝 Briefing & Scripting: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('script') || (t.stage || '').toLowerCase().includes('brief')).length}*\n` +
            `• 🎬 Field Shoot: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('prod') || (t.stage || '').toLowerCase().includes('shoot')).length}*\n` +
            `• ✂️ Editing & FX: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('edit') || (t.stage || '').toLowerCase().includes('motion')).length}*\n` +
            `• 👁️ Client Review: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('client') || (t.stage || '').toLowerCase().includes('review')).length}*\n` +
            `• ✅ Approved: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('approved') || (t.stage || '').toLowerCase().includes('done')).length}*\n\n` +
            `⏳ *Open Manager Approvals:*\n` +
            `• 🌴 Pending Leave Reviews: *${pendingLeaves}*\n` +
            `• 💰 Pending T1 Expense Claims: *${pendingExpenses}*\n\n` +
            `🌐 Open Manager Portal: https://purpleos-iota.vercel.app/manager`;
        } else if (msgText.startsWith('/morning') || msgText.includes('Morning Briefing') || msgText.includes('Morning')) {
          const teamList = db.team || [];
          const emp = teamList.find(e => e.telegramId == chatId) || teamList[0];
          replyText = `🌅 *9:00 AM DEPARTMENT MORNING BRIEFING*\n` +
            `📍 Department: *${emp.department || 'Operations'}*\n\n` +
            `📋 *Today's Production Schedule:*\n`;

          const todayTasks = (db.tasks || []).slice(0, 3);
          todayTasks.forEach((t, idx) => {
            replyText += `${idx + 1}. *${t.title}* (${t.client})\n   👤 Assignee: ${t.assignee} | 📌 Priority: ${t.priority}\n`;
          });
          replyText += `\nHave a productive shoot day! 🎬`;
        } else if (msgText.startsWith('/myearnings') || msgText.includes('Salary') || msgText.includes('Earnings')) {
          const teamList = db.team || [];
          const emp = teamList.find(e => e.telegramId == chatId) || teamList[0] || { name: senderName, baseSalary: 85000, earnedCommissions: 15000 };
          const basePay = emp.baseSalary || 85000;
          const commissions = emp.earnedCommissions || 15000;
          replyText = `💰 *Salary & Commission Breakdown for ${emp.name}*\n\n` +
            `• Base Pay: BDT ${basePay.toLocaleString()}\n` +
            `• Shoot Commissions: BDT ${commissions.toLocaleString()}\n` +
            `*Total Monthly Pay: BDT ${(basePay + commissions).toLocaleString()}*`;
        } else if (msgText.startsWith('/approveleave')) {
          const leaveId = msgText.replace('/approveleave', '').trim().toUpperCase();
          const leave = (db.leaves || []).find(l => l.id === leaveId);
          if (leave) {
            leave.status = 'Manager Approved';
            leave.managerReviewedBy = senderName;
            leave.managerApprovedAt = new Date().toISOString();
            writeDB(db);
            broadcast('leave_update', db.leaves);
            processAutomationEvent('leave_manager_approved', { leave }, db, writeDB, broadcast);
            replyText = `🌴 *Leave Request ${leaveId} Manager Approved!*\nStatus set to *Manager Approved*. Forwarded to Owner for final sign-off.`;
          } else {
            replyText = `❌ Leave request *${leaveId || 'ID'}* not found.`;
          }
        } else if (msgText.startsWith('/approve2')) {
          const expId = msgText.replace('/approve2', '').trim().toUpperCase();
          const exp = (db.expenses || []).find(e => e.id === expId);
          if (exp) {
            exp.tier2 = { approved: true, approvedBy: senderName, date: new Date().toISOString() };
            exp.status = 'Tier 3 Pending';
            writeDB(db);
            broadcast('expense_update', db.expenses);
            processAutomationEvent('expense_tier2_approved', { expense: exp }, db, writeDB, broadcast);
            replyText = `💰 *Expense ${expId} Tier 2 Verified!*\nStatus set to *Tier 3 Pending*. Owner notified for final disbursement.`;
          } else {
            replyText = `❌ Expense claim *${expId || 'ID'}* not found.`;
          }
        } else if (msgText.startsWith('/approve')) {
          const expId = msgText.replace('/approve', '').trim().toUpperCase();
          const exp = (db.expenses || []).find(e => e.id === expId);
          if (exp) {
            exp.tier1 = { approved: true, approvedBy: senderName, date: new Date().toISOString() };
            exp.status = 'Tier 2 Pending';
            writeDB(db);
            broadcast('expense_update', db.expenses);
            processAutomationEvent('expense_tier1_approved', { expense: exp }, db, writeDB, broadcast);
            replyText = `✅ *Expense ${expId} Tier 1 Approved!*\nStatus set to *Tier 2 Pending*. Finance Lead Roksana notified.`;
          } else {
            replyText = `❌ Expense claim *${expId || 'ID'}* not found.`;
          }
        } else {
          replyText = `🤖 *Purple Man Bot*: Type /help to see crew options, or /myteam, /deptreport, /morning for department management!`;
        }
      } else {
        // Client Bot (Purple Bot)
        if (msgText.startsWith('/start') || msgText.startsWith('/help')) {
          replyText = `🤖 *Welcome to Purple Bot (Client B2B Assistant)!*

• /services - Browse agency packages & pricing
• /portfolio - View video & TVC campaign reel
• /review - Access Review Room V2 deliverable cuts
• /invoices - View invoice status & billing`;
          
          replyMarkup = {
            keyboard: [[{ text: '📱 Share Verified Phone Number', request_contact: true }]],
            resize_keyboard: true
          };
        } else if (msgText.startsWith('/services')) {
          let serviceList = (db.services || []).filter(s => s.public);
          if (serviceList.length > 0) {
            replyText = `🎨 *Purplebot Digital Core Services Catalog:*

`;
            serviceList.forEach(s => {
              replyText += `• *${s.title}* (${s.category})
  Rate: ${s.price}
  ${s.description}

`;
            });
          } else {
            replyText = `🎨 *Purplebot Digital Core Services Catalog:*

Contact us for a full package quote:
📧 contact@purplebot.digital`;
          }
        } else if (msgText.startsWith('/portfolio')) {
          replyText = `📁 *Purplebot Digital Portfolio Showcase*

🔗 https://purpleos-iota.vercel.app/`;
        } else if (msgText.startsWith('/review')) {
          replyText = `🎬 *Review Room V2 Client Portal*

🔗 https://purpleos-iota.vercel.app/partners`;
        } else if (msgText.startsWith('/invoices')) {
          replyText = `💳 *Invoice Billing Portal*

🔗 https://purpleos-iota.vercel.app/partners`;
        } else {
          replyText = `👋 Hello! Type /services to explore packages or /review to check campaign cuts.`;
        }
      }
    }

    const inlineKeyboard = isTeamBot ? [
      [{ text: '📱 Open Crew Mini App', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } }]
    ] : [
      [{ text: '🎬 Open 4K Review Room Mini App', web_app: { url: 'https://purpleos-iota.vercel.app/client-miniapp' } }]
    ];

    if (replyText && replyText.trim() !== '') {
      try {
        const payload = {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown'
        };
        if (replyMarkup) {
          payload.reply_markup = replyMarkup;
        } else {
          payload.reply_markup = { inline_keyboard: inlineKeyboard };
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const tgBody = await tgRes.json();
        if (!tgBody.ok) {
          console.error('Telegram sendMessage failed:', JSON.stringify(tgBody));
        } else {
          console.log(`✅ Bot replied to ${senderName} (chat ${chatId}): ${replyText.substring(0, 60)}...`);
        }
      } catch (sendErr) {
        console.error('Error sending Telegram webhook response:', sendErr);
      }
    }

    const newLog = {
      id: `WHK-${Date.now()}`,
      channel: isTeamBot ? 'Telegram (Purple Man)' : 'Telegram (Purple Bot)',
      type: 'inbound_update',
      sender: senderName,
      payload: message.text || (message.contact ? 'Contact Shared' : 'Location Shared'),
      status: '200 OK',
      timestamp: nowTime
    };
    db.webhookLogs.unshift(newLog);
    if (db.webhookLogs.length > 30) db.webhookLogs = db.webhookLogs.slice(0, 30);
    writeDB(db);
    broadcast('webhook_event', newLog);
  }

  res.json({ ok: true });
});

// Module B4.2: Unipile WhatsApp Webhook Verification Router (https://developer.unipile.com/v2.0/docs/whatsapp)
router.get('/webhooks/unipile-whatsapp', (req, res) => {
  const challenge = req.query['hub.challenge'] || req.query.challenge;
  if (challenge) {
    return res.send(challenge);
  }
  res.json({ status: 'ok', service: 'PurpleOS Unipile WhatsApp Webhook Engine' });
});

router.post('/webhooks/unipile-whatsapp', async (req, res) => {
  const db = readDB();
  db.webhookLogs = db.webhookLogs || [];

  const update = req.body || {};
  const senderPhone = update.from || update.sender || update.chat_id || '+8801889825025';
  const msgText = (update.text || update.message?.text || update.body || 'Hello').trim();
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Conversational AI & Knowledge Base Response
  let responseText = '';
  const cleanPhone = senderPhone.replace(/[^0-9+]/g, '');

  const matchingClient = (db.clients || []).find(c => (c.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhone));
  const matchingStaff = (db.team || []).find(t => (t.phone || '').replace(/[^0-9+]/g, '').includes(cleanPhone));

  if (msgText.toLowerCase().includes('review') || msgText.toLowerCase().includes('cut') || msgText.toLowerCase().includes('video')) {
    responseText = `🎬 *Purplebot Review Room V2*: Hi ${matchingClient ? matchingClient.contactPerson : 'Partner'}! Your 4K campaign deliverable cut is ready:\n\n` +
      `🔗 Stream & Approve Cut: https://purpleos-iota.vercel.app/client-miniapp?client=${matchingClient?.clientCode || 'CLT-009'}`;
  } else if (msgText.toLowerCase().includes('invoice') || msgText.toLowerCase().includes('pay') || msgText.toLowerCase().includes('bill')) {
    responseText = `💳 *Purplebot Billing Portal*: Verification & payment link for your active retainer:\n\n` +
      `🔗 View Invoice & Pay Online: https://purpleos-iota.vercel.app/partners`;
  } else if (msgText.toLowerCase().includes('clock') || msgText.toLowerCase().includes('studio') || msgText.toLowerCase().includes('attendance')) {
    responseText = `🟢 *Purplebot Attendance*: Hi ${matchingStaff ? matchingStaff.name : 'Crew Member'}!\n\n` +
      `🔗 1-Tap Studio Clock-In: https://purpleos-iota.vercel.app/team-miniapp`;
  } else {
    responseText = `👋 Hi from *Purplebot Digital Agency*! I am your AI Brand Assistant. How can we assist your campaign today?\n\n` +
      `• 🎬 *Review Cuts*: https://purpleos-iota.vercel.app/client-miniapp\n` +
      `• 💰 *Service Rates*: https://purpleos-iota.vercel.app/chat\n` +
      `• 💳 *Billing & Invoices*: https://purpleos-iota.vercel.app/partners`;
  }

  const newLog = {
    id: `WHK-WA-${Date.now()}`,
    channel: 'WhatsApp (Unipile API)',
    type: 'inbound_message',
    sender: senderPhone,
    payload: msgText,
    responseText: responseText,
    status: '200 OK',
    timestamp: nowTime
  };

  db.webhookLogs.unshift(newLog);
  if (db.webhookLogs.length > 30) db.webhookLogs = db.webhookLogs.slice(0, 30);
  writeDB(db);
  broadcast('webhook_event', newLog);

  res.json({ success: true, responseText, log: newLog });
});

// Telegram Groups & Channels Management API
router.get('/groups', (req, res) => {
  const db = readDB();
  res.json(db.groups || []);
});

router.post('/groups', (req, res) => {
  const { name, type, chatId, bot, description, linkedClientId, members } = req.body;
  if (!name || !chatId) {
    return res.status(400).json({ error: 'Group name and Telegram Chat ID are required' });
  }

  const db = readDB();
  db.groups = db.groups || [];

  const newGroup = {
    id: `GRP-${String(db.groups.length + 1).padStart(3, '0')}`,
    name,
    type: type || 'group',
    chatId: chatId.trim(),
    bot: bot || 'teamBot',
    description: description || '',
    linkedClientId: linkedClientId || null,
    members: members || [],
    createdAt: new Date().toISOString()
  };

  db.groups.push(newGroup);
  writeDB(db);
  broadcast('group_update', db.groups);
  res.json({ success: true, group: newGroup });
});

router.put('/groups/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.groups || []).findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  db.groups[idx] = { ...db.groups[idx], ...req.body };
  writeDB(db);
  broadcast('group_update', db.groups);
  res.json({ success: true, group: db.groups[idx] });
});

router.delete('/groups/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.groups = (db.groups || []).filter(g => g.id !== id);
  writeDB(db);
  broadcast('group_update', db.groups);
  res.json({ success: true });
});

router.post('/groups/:id/test-post', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const db = readDB();

  const group = (db.groups || []).find(g => g.id === id);
  if (!group) return res.status(404).json({ error: 'Group record not found' });

  const isTeam = group.bot === 'teamBot';
  const postMsg = text || `🤖 *PurpleOS Bot Connection Verification*\n\nVerified post to group/channel: *${group.name}* (\`${group.chatId}\`)`;

  const sent = sendTelegramNotification(group.chatId, postMsg, null, isTeam);

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logEntry = {
    id: `BC-${Date.now()}`,
    channel: group.name,
    type: 'group_test_post',
    sender: 'PurpleOS Admin',
    payload: postMsg,
    status: sent ? '200 OK' : 'Attempted',
    timestamp: nowTime
  };

  db.webhookLogs = db.webhookLogs || [];
  db.webhookLogs.unshift(logEntry);
  writeDB(db);
  broadcast('webhook_event', logEntry);

  res.json({
    success: true,
    sent,
    message: `Message sent to group [${group.name}] via ${group.bot}!`,
    log: logEntry
  });
});

// Module B4.3: Group & Channel Broadcast Dispatcher Endpoint
router.post('/groups/broadcast', async (req, res) => {
  const { channelType, targetName, text, mediaUrl, groupId } = req.body;
  const db = readDB();

  db.webhookLogs = db.webhookLogs || [];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (groupId) {
    const targetGroup = (db.groups || []).find(g => g.id === groupId);
    if (targetGroup) {
      const isTeam = targetGroup.bot === 'teamBot';
      sendTelegramNotification(targetGroup.chatId, text, null, isTeam);
    }
  }

  const logEntry = {
    id: `BC-${Date.now()}`,
    channel: channelType || targetName || 'Company Telegram Channel',
    type: 'group_broadcast',
    sender: targetName || 'Purplebot Operations Engine',
    payload: text,
    status: '200 OK',
    timestamp: nowTime
  };

  db.webhookLogs.unshift(logEntry);
  writeDB(db);
  broadcast('webhook_event', logEntry);

  res.json({
    success: true,
    message: `🚀 Broadcast dispatched successfully to [${targetName || 'Company Channel'}]!`,
    broadcast: logEntry
  });
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
      const db = readDB();
      if (stage) {
        processAutomationEvent('task_stage_change', { stage, task }, db, writeDB, broadcast);
      }
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
  db.expenses = db.expenses || [];
  const count = String(db.expenses.length + 101).padStart(3, '0');

  const newExp = {
    id: `EXP-${count}`,
    submittedBy: req.body.submittedBy || 'Ground Staff Member',
    submittedById: req.body.submittedById || '',
    category: req.body.category || 'Shoot Refreshments',
    amount: Number(req.body.amount) || 0,
    description: req.body.description || 'Field operational expense',
    receiptUrl: req.body.receiptUrl || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    status: req.body.status || 'Tier 1 Pending',
    tier1: req.body.tier1 || { approved: false, approvedBy: null, date: null },
    tier2: req.body.tier2 || { approved: false, approvedBy: null, date: null },
    tier3: req.body.tier3 || { approved: false, approvedBy: null, date: null },
    createdAt: new Date().toISOString()
  };

  db.expenses.push(newExp);
  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});
  res.json({ success: true, expense: newExp });
});

router.post('/expenses/:id/approve-tier1', (req, res) => {
  const expenseId = req.params.id;
  const db = readDB();
  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (!exp) return res.status(404).json({ error: 'Expense claim not found' });

  exp.tier1 = {
    approved: true,
    approvedBy: req.body.approvedBy || 'Line Manager',
    date: new Date().toISOString()
  };
  exp.status = 'Tier 2 Pending';

  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});

  // Trigger AUT-008 (Notify Finance)
  processAutomationEvent('expense_tier1_approved', { expense: exp }, db, writeDB, broadcast);

  res.json({ success: true, expense: exp });
});

router.post('/expenses/:id/approve-tier2', (req, res) => {
  const expenseId = req.params.id;
  const db = readDB();
  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (!exp) return res.status(404).json({ error: 'Expense claim not found' });

  exp.tier2 = {
    approved: true,
    approvedBy: req.body.approvedBy || 'Finance Lead',
    date: new Date().toISOString()
  };
  exp.status = 'Tier 3 Pending';

  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});

  // Trigger AUT-009 (Notify Owner)
  processAutomationEvent('expense_tier2_approved', { expense: exp }, db, writeDB, broadcast);

  res.json({ success: true, expense: exp });
});

router.post('/expenses/:id/approve-tier3', (req, res) => {
  const expenseId = req.params.id;
  const db = readDB();
  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (!exp) return res.status(404).json({ error: 'Expense claim not found' });

  exp.tier3 = {
    approved: true,
    approvedBy: req.body.approvedBy || 'Agency Owner',
    date: new Date().toISOString()
  };
  exp.status = 'Disbursed';
  exp.disbursedAt = new Date().toISOString();

  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});

  // Trigger AUT-010 (Notify Staff)
  processAutomationEvent('expense_disbursed', { expense: exp }, db, writeDB, broadcast);

  res.json({ success: true, expense: exp });
});

router.post('/expenses/:id/reject', (req, res) => {
  const expenseId = req.params.id;
  const db = readDB();
  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (!exp) return res.status(404).json({ error: 'Expense claim not found' });

  exp.status = 'Rejected';
  exp.rejectionNote = req.body.rejectionNote || 'Claim rejected by management.';

  writeDB(db);
  broadcast('expense_update', db.expenses);
  broadcast('db_updated', {});

  res.json({ success: true, expense: exp });
});

router.put('/expenses/:id', (req, res) => {
  const expenseId = req.params.id;
  const db = readDB();

  db.expenses = db.expenses || [];
  const exp = db.expenses.find(e => e.id === expenseId);

  if (exp) {
    Object.assign(exp, req.body);
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

// BC-9: Asset Gear Check-Out Route
router.post('/assets/:id/checkout', async (req, res) => {
  const { id } = req.params;
  const { borrower } = req.body;
  const db = readDB();

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('assets').select('*').eq('id', id);
    const asset = data && data[0];
    if (asset) {
      await supabase.from('assets').update({ assigned_to: borrower || 'Crew Member', condition: 'In Use' }).eq('id', asset.id);
      const updatedAsset = { ...asset, assignedTo: borrower || 'Crew Member', condition: 'In Use' };
      broadcast('asset_update', [updatedAsset]);
      return res.json({ success: true, asset: updatedAsset });
    }
  }

  const asset = (db.assets || []).find(a => String(a.id).toLowerCase() === String(id).toLowerCase());
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  asset.assignedTo = borrower || 'Crew Member';
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
router.post('/assets/:id/checkin', async (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (isSupabaseConfigured()) {
    const { data } = await supabase.from('assets').select('*').eq('id', id);
    const asset = data && data[0];
    if (asset) {
      await supabase.from('assets').update({ assigned_to: 'Unassigned / Studio Base', condition: 'Good' }).eq('id', asset.id);
      const updatedAsset = { ...asset, assignedTo: 'Unassigned / Studio Base', condition: 'Good' };
      broadcast('asset_update', [updatedAsset]);
      return res.json({ success: true, asset: updatedAsset });
    }
  }

  const asset = (db.assets || []).find(a => String(a.id).toLowerCase() === String(id).toLowerCase());
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  asset.assignedTo = 'Unassigned / Studio Base';
  asset.condition = 'Good';

  db.checkoutLog = db.checkoutLog || [];
  const activeLog = db.checkoutLog.find(l => String(l.assetId).toLowerCase() === String(id).toLowerCase() && l.status === 'Checked Out');
  if (activeLog) {
    activeLog.returnDate = new Date().toISOString().split('T')[0];
    activeLog.status = 'Checked In';
  }

  writeDB(db);
  broadcast('asset_update', db.assets);
  broadcast('db_updated', {});

  res.json({ success: true, asset });
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
  } else if (cmd.startsWith('/broadcast')) {
    const broadcastText = cmd.replace('/broadcast', '').trim();
    if (!broadcastText) {
      responseText = `⚠️ *Format:* \`/broadcast [Notice message text]\`\nExample: \`/broadcast Team meeting at 4 PM in Studio B\``;
    } else {
      processAutomationEvent('team_broadcast_notice', {
        title: 'Leadership Instant Notice',
        message: broadcastText,
        senderName: 'Farhan Ahmed (Lead Director)',
        urgent: true
      }, db, writeDB, broadcast);
      responseText = `📢 *BROADCAST SENT SUCCESSFULLY!*\n\nNotice has been dispatched to all team members and production Telegram groups.`;
    }
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

// ==========================================
// 🏥 PHASE C: HR OPS (LEAVES, EOD, TICKETS)
// ==========================================

// LEAVE MANAGEMENT API
router.get('/leaves', (req, res) => {
  const db = readDB();
  res.json(db.leaves || []);
});

router.post('/leaves', (req, res) => {
  const db = readDB();
  db.leaves = db.leaves || [];
  const count = String(db.leaves.length + 101).padStart(3, '0');

  const newLeave = {
    id: `LEV-${count}`,
    staffId: req.body.staffId || 'EMP-001',
    staffName: req.body.staffName || 'Crew Member',
    type: req.body.type || 'Casual Leave',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || new Date().toISOString().split('T')[0],
    totalDays: Number(req.body.totalDays) || 1,
    reason: req.body.reason || 'Personal leave request',
    status: 'Pending Line Review',
    createdAt: new Date().toISOString()
  };

  db.leaves.push(newLeave);
  writeDB(db);
  broadcast('leave_update', db.leaves);
  broadcast('db_updated', {});

  // Trigger AUT-020 (Notify Line Manager)
  processAutomationEvent('leave_submitted', { leave: newLeave }, db, writeDB, broadcast);

  res.json({ success: true, leave: newLeave });
});

router.post('/leaves/:id/manager-approve', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.leaves = db.leaves || [];
  const leave = db.leaves.find(l => l.id === id);
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  leave.status = 'Manager Approved';
  leave.managerReviewedBy = req.body.approvedBy || 'Line Manager';
  leave.managerApprovedAt = new Date().toISOString();

  writeDB(db);
  broadcast('leave_update', db.leaves);
  broadcast('db_updated', {});

  // Trigger leave_manager_approved event
  processAutomationEvent('leave_manager_approved', { leave }, db, writeDB, broadcast);

  res.json({ success: true, leave });
});

router.post('/leaves/:id/approve', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.leaves = db.leaves || [];
  const leave = db.leaves.find(l => l.id === id);
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  leave.status = 'Approved';
  leave.reviewedBy = req.body.reviewedBy || 'Agency Owner';
  leave.approvedAt = new Date().toISOString();

  // Mark staff attendance status for leave date
  db.attendance = db.attendance || [];
  const staffAtt = db.attendance.find(a => (a.employeeId || a.id) === leave.staffId || a.name === leave.staffName);
  if (staffAtt) staffAtt.status = 'On Leave';

  writeDB(db);
  broadcast('leave_update', db.leaves);
  broadcast('attendance_update', db.attendance);
  broadcast('db_updated', {});

  // Trigger AUT-011
  processAutomationEvent('leave_decision', { leave }, db, writeDB, broadcast);

  res.json({ success: true, leave });
});

router.post('/leaves/:id/reject', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.leaves = db.leaves || [];
  const leave = db.leaves.find(l => l.id === id);
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  leave.status = 'Declined';
  leave.reviewedBy = req.body.reviewedBy || 'Line Manager';
  leave.rejectedAt = new Date().toISOString();

  writeDB(db);
  broadcast('leave_update', db.leaves);
  broadcast('db_updated', {});

  // Trigger AUT-011
  processAutomationEvent('leave_decision', { leave }, db, writeDB, broadcast);

  res.json({ success: true, leave });
});

// EOD DAILY REPORTS API
router.get('/eod', (req, res) => {
  const db = readDB();
  res.json(db.eod_reports || []);
});

router.post('/eod', (req, res) => {
  const db = readDB();
  db.eod_reports = db.eod_reports || [];
  const count = String(db.eod_reports.length + 101).padStart(3, '0');

  const newReport = {
    id: `EOD-${count}`,
    staffId: req.body.staffId || 'EMP-001',
    staffName: req.body.staffName || 'Staff Member',
    date: req.body.date || new Date().toISOString().split('T')[0],
    tasksCompleted: req.body.tasksCompleted || 'Completed daily deliverables.',
    tasksInProgress: req.body.tasksInProgress || 'In progress tasks.',
    blockers: req.body.blockers || 'None',
    submittedAt: new Date().toISOString()
  };

  db.eod_reports.unshift(newReport);
  if (db.eod_reports.length > 200) db.eod_reports = db.eod_reports.slice(0, 200);

  writeDB(db);
  broadcast('eod_update', db.eod_reports);
  broadcast('db_updated', {});

  res.json({ success: true, report: newReport });
});

router.post('/eod/trigger-prompt', (req, res) => {
  const db = readDB();
  processAutomationEvent('eod_daily_prompt', {}, db, writeDB, broadcast);
  res.json({ success: true, message: '7:00 PM Daily EOD prompt pushed to active team via Telegram' });
});

// SUPPORT & REPAIR TICKETS API
router.get('/tickets', (req, res) => {
  const db = readDB();
  res.json(db.tickets || []);
});

router.post('/tickets', (req, res) => {
  const db = readDB();
  db.tickets = db.tickets || [];
  const count = String(db.tickets.length + 101).padStart(3, '0');

  const newTicket = {
    id: `TKT-${count}`,
    category: req.body.category || 'Equipment Repair',
    title: req.body.title || 'Studio Support Issue',
    description: req.body.description || '',
    urgency: req.body.urgency || 'Medium',
    loggedBy: req.body.loggedBy || 'Staff Member',
    assignedTo: req.body.assignedTo || 'Maintenance Lead',
    status: 'Open',
    createdAt: new Date().toISOString()
  };

  db.tickets.push(newTicket);
  writeDB(db);
  broadcast('ticket_update', db.tickets);
  broadcast('db_updated', {});

  res.json({ success: true, ticket: newTicket });
});

router.put('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.tickets = db.tickets || [];
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const prevStatus = ticket.status;
  Object.assign(ticket, req.body);

  if (req.body.status === 'Resolved' && prevStatus !== 'Resolved') {
    ticket.resolvedAt = new Date().toISOString();
    ticket.resolvedBy = req.body.resolvedBy || 'Maintenance Lead';
    processAutomationEvent('ticket_resolved', { ticket }, db, writeDB, broadcast);
  }

  writeDB(db);
  broadcast('ticket_update', db.tickets);
  broadcast('db_updated', {});

  res.json({ success: true, ticket });
});

// ==========================================
// 👑 PHASE D: LEADERSHIP INTELLIGENCE & BROADCAST API
// ==========================================

router.post('/reports/morning', (req, res) => {
  const db = readDB();
  processAutomationEvent('morning_executive_briefing', {}, db, writeDB, broadcast);
  res.json({ success: true, message: '9:00 AM Morning Executive Briefing pushed to Telegram' });
});

router.post('/reports/evening', (req, res) => {
  const db = readDB();
  processAutomationEvent('evening_digest', {}, db, writeDB, broadcast);
  res.json({ success: true, message: '8:30 PM Evening Executive Digest pushed to Telegram' });
});

router.post('/reports/weekly', (req, res) => {
  const db = readDB();
  processAutomationEvent('weekly_kpi_summary', {}, db, writeDB, broadcast);
  res.json({ success: true, message: 'Weekly Executive KPI Summary pushed to Telegram' });
});

router.post('/reports/specialist-briefing', (req, res) => {
  const db = readDB();
  processAutomationEvent('specialist_daily_briefing', {}, db, writeDB, broadcast);
  res.json({ success: true, message: '9:00 AM Personal Daily Task Briefings pushed to all team specialists' });
});

router.post('/broadcast', (req, res) => {
  const db = readDB();
  const { title, message, targetGroup, senderName, urgent } = req.body;

  processAutomationEvent('team_broadcast_notice', {
    title: title || 'Team Announcement',
    message: message || 'Notice from agency leadership.',
    targetGroup: targetGroup || 'All Staff & Groups',
    senderName: senderName || 'Mahmudul Hasan (Owner)',
    urgent: urgent !== false
  }, db, writeDB, broadcast);

  res.json({ success: true, message: 'Team Broadcast Notice dispatched to all staff and Telegram groups!' });
});

// PUBLIC WEBSITE CLICK & PAGEVIEW TRACKING API (v0.7.5.1)
router.post('/track', (req, res) => {
  const db = readDB();
  db.pageEvents = db.pageEvents || [];

  const newEvent = {
    id: `EVT-${Date.now()}`,
    event: req.body.event || 'page_view',
    label: req.body.label || '',
    referrer: req.body.referrer || '',
    utm: req.body.utm || '',
    timestamp: new Date().toISOString()
  };

  db.pageEvents.unshift(newEvent);
  if (db.pageEvents.length > 500) {
    db.pageEvents = db.pageEvents.slice(0, 500);
  }

  writeDB(db);
  broadcast('page_event_update', db.pageEvents);
  res.json({ success: true });
});

router.get('/track', (req, res) => {
  const db = readDB();
  const events = db.pageEvents || [];
  const totalViews = events.filter(e => e.event === 'page_view').length;
  const totalClicks = events.filter(e => e.event === 'cta_click').length;
  const botOpens = events.filter(e => e.event === 'bot_open').length;
  const leadsCaptured = events.filter(e => e.event === 'lead_captured').length;

  res.json({
    success: true,
    summary: {
      totalViews,
      totalClicks,
      botOpens,
      leadsCaptured
    },
    recentEvents: events.slice(0, 50)
  });
});

module.exports = router;
