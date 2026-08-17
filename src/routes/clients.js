const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager, requireClientOwnership } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

function mapClient(c) {
  if (!c) return null;
  const rawSpent = c.total_spent !== undefined ? c.total_spent : c.totalSpent;
  const parsedSpent = typeof rawSpent === 'number' ? rawSpent : parseFloat(String(rawSpent || 0).replace(/[^0-9.]/g, '')) || 0;
  
  let campaignsVal = c.active_campaigns !== undefined ? c.active_campaigns : c.activeCampaigns;
  if (Array.isArray(campaignsVal)) {
    campaignsVal = campaignsVal.length;
  } else {
    campaignsVal = Number(campaignsVal) || 1;
  }

  return {
    id: c.id,
    name: c.name || '',
    category: c.category || c.industry || 'General',
    industry: c.industry || c.category || 'General',
    contactPerson: c.contact_person || c.contactPerson || '',
    email: c.email || '',
    phone: c.phone || '',
    whatsapp: c.whatsapp || c.phone || '',
    status: c.status || 'Active Retainer',
    totalSpent: parsedSpent,
    activeCampaigns: campaignsVal,
    pocs: c.pocs && Array.isArray(c.pocs) ? c.pocs : [],
    createdAt: c.created_at || c.createdAt
  };
}

// GET all clients (Admin sees all; Client sees ONLY their own client record)
router.get('/', requireAuth, async (req, res) => {
  const isClient = req.user.linkedType === 'client';
  const clientLimitId = isClient ? req.user.linkedId : null;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('clients').select('*');
      if (isClient && clientLimitId) {
        query = query.eq('id', clientLimitId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data.map(mapClient));
      }
    } catch(e) {}
  }

  let clientsList = [];
  try {
    const db = await readDB();
    clientsList = db.clients || [];
  } catch(e) {}

  if (clientsList.length === 0 && !isClient) {
    clientsList = [
      { id: 'cli_chillox', name: 'Chillox Bangladesh', category: 'Food & Beverage', status: 'Active Retainer' },
      { id: 'cli_aura', name: 'Aura Cosmetics', category: 'Beauty & Fashion', status: 'Active Retainer' },
      { id: 'cli_apex', name: 'Apex Footwear', category: 'Retail', status: 'Active Retainer' },
      { id: 'cli_gp', name: 'Grameenphone', category: 'Telecommunications', status: 'Enterprise' },
      { id: 'cli_daraz', name: 'Daraz Bangladesh', category: 'E-commerce', status: 'Project Basis' }
    ];
  }

  if (isClient && clientLimitId) {
    clientsList = clientsList.filter(c => c.id === clientLimitId || (c.name || '').toLowerCase() === (req.user.name || '').toLowerCase());
  }

  res.json(clientsList.map(mapClient));
});

// GET current authenticated client profile (/api/clients/me)
router.get('/me', requireAuth, async (req, res) => {
  const isClient = req.user.linkedType === 'client';
  const clientId = isClient ? req.user.linkedId : null;

  if (isSupabaseConfigured()) {
    let query = supabase.from('clients').select('*');
    if (clientId) {
      query = query.eq('id', clientId);
    } else {
      query = query.ilike('name', `%${req.user.name || ''}%`);
    }
    const { data } = await query.maybeSingle();
    if (data) return res.json({ success: true, client: mapClient(data) });
  }

  const db = await readDB();
  const client = (db.clients || []).find(c => c.id === clientId || (c.name || '').toLowerCase().includes((req.user.name || '').toLowerCase()));
  res.json({ success: true, client: mapClient(client || db.clients[0]) });
});

// GET /api/clients/dashboard — Supports ?telegramId= or JWT auth for Client Mini App
router.get('/dashboard', async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    let client = null;
    if (telegramId && supabase && isSupabaseConfigured()) {
      const { data } = await supabase.from('clients').select('*').eq('telegram_id', String(telegramId)).maybeSingle();
      if (data) client = data;
    }
    if (!client && req.headers.authorization) {
      const { verifyToken } = require('../services/jwt');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = verifyToken(token);
      if (decoded && decoded.linkedId) {
        const { data } = await supabase.from('clients').select('*').eq('id', decoded.linkedId).maybeSingle();
        if (data) client = data;
      }
    }
    if (!client) {
      if (supabase && isSupabaseConfigured()) {
        const { data } = await supabase.from('clients').select('*').limit(1).maybeSingle();
        client = data;
      }
    }

    const clientName = client?.name || 'Chillox Bangladesh';
    const clientId = client?.id || 'CLI-001';

    let activeCampaign = null;
    let latestInvoice = null;
    let activeReview = null;

    if (supabase && isSupabaseConfigured()) {
      const [{ data: tasks }, { data: invs }, { data: revs }] = await Promise.all([
        supabase.from('tasks').select('*').or(`client.ilike.%${clientName}%,client_id.eq.${clientId}`).order('created_at', { ascending: false }).limit(1),
        supabase.from('invoices').select('*').or(`client.ilike.%${clientName}%,client_id.eq.${clientId}`).order('created_at', { ascending: false }).limit(1),
        supabase.from('reviews').select('*').or(`client.ilike.%${clientName}%,client_id.eq.${clientId}`).order('created_at', { ascending: false }).limit(1)
      ]);

      if (tasks && tasks[0]) {
        activeCampaign = {
          id: tasks[0].id,
          reviewId: revs && revs[0] ? revs[0].id : 'REV-001',
          title: tasks[0].title,
          stage: (tasks[0].stage || 'brief').toLowerCase(),
          dueDate: tasks[0].due_date,
          videoUrl: revs && revs[0] ? revs[0].media_url : 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4'
        };
      }

      if (invs && invs[0]) {
        latestInvoice = {
          id: invs[0].id,
          description: invs[0].description || `${clientName} Campaign Invoice`,
          amount: invs[0].amount || invs[0].total || 50000,
          status: invs[0].status || 'Pending'
        };
      }

      if (revs && revs[0]) {
        activeReview = {
          id: revs[0].id,
          title: revs[0].project_name,
          version: revs[0].active_version || 'v1',
          mediaUrl: revs[0].media_url,
          status: revs[0].status
        };
      }
    }

    return res.json({
      client: client || { name: clientName },
      activeCampaign,
      activeReview,
      latestInvoice
    });
  } catch (err) {
    console.error('Client MiniApp Dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/campaigns — Client campaign listing for Telegram Mini App
router.get('/campaigns', async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    let client = null;
    if (telegramId && supabase && isSupabaseConfigured()) {
      const { data } = await supabase.from('clients').select('*').eq('telegram_id', String(telegramId)).maybeSingle();
      client = data;
    }
    const clientName = client?.name || 'Chillox';
    let tasks = [];
    if (supabase && isSupabaseConfigured()) {
      const { data } = await supabase.from('tasks').select('*').ilike('client', `%${clientName}%`).order('created_at', { ascending: false });
      tasks = data || [];
    }
    res.json(tasks.map(t => ({
      id: t.id,
      title: t.title,
      stage: t.stage,
      dueDate: t.due_date,
      priority: t.priority
    })));
  } catch (err) {
    res.json([]);
  }
});

// Client Portal Workspace Dashboard Data (Isolated for authenticated client)
router.get('/:id/dashboard', requireAuth, requireClientOwnership, async (req, res) => {
  const { id } = req.params;

  let client, reviews, posts, invoices;

  if (isSupabaseConfigured()) {
    // Fetch client record from Supabase
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .or(`id.eq.${id},name.ilike.${req.user.name || '_'}`)
      .maybeSingle();

    if (!clientData) return res.status(404).json({ error: 'Client account workspace not found' });

    client = {
      ...clientData,
      contactPerson: clientData.contact_person,
      totalSpent: clientData.total_spent,
      activeCampaigns: clientData.active_campaigns || [],
      pocs: clientData.pocs || []
    };

    const clientName = client.name || '';

    // Fetch reviews from Supabase
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .or(`client_id.eq.${id},client.ilike.%${clientName}%`);
    reviews = reviewData || [];

    // Fetch social posts from Supabase
    const { data: postData } = await supabase
      .from('social_posts')
      .select('*')
      .or(`client_id.eq.${id},client_name.ilike.%${clientName}%`);
    posts = postData || [];

    // Fetch invoices from Supabase
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .or(`client_id.eq.${id},client_name.ilike.%${clientName}%`);
    invoices = invoiceData || [];

  } else {
    // db.json fallback (local dev only)
    const db = await readDB();
    client = (db.clients || []).find(c => c.id === id || (c.name || '').toLowerCase() === (req.user.name || '').toLowerCase());
    if (!client) return res.status(404).json({ error: 'Client account workspace not found' });
    const clientNameLower = (client.name || '').toLowerCase();
    reviews  = (db.reviews || []).filter(r => (r.client || '').toLowerCase().includes(clientNameLower) || r.clientId === id);
    posts    = (db.posts   || []).filter(p => (p.clientName || '').toLowerCase().includes(clientNameLower) || p.clientId === id);
    invoices = (db.invoices|| []).filter(i => (i.clientName || '').toLowerCase().includes(clientNameLower) || i.clientId === id);
  }

  res.json({
    client,
    stats: {
      activeCampaignsCount:       (client.activeCampaigns || []).length,
      pendingReviewsCount:        reviews.filter(r => (r.resolved_count ?? r.resolvedCount ?? 0) < (r.total_count ?? r.totalCount ?? 1)).length,
      pendingPostsApprovalCount:  posts.filter(p => (p.status || p.approval_status) === 'Pending Client Approval').length,
      unpaidInvoicesCount:        invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length
    },
    reviews,
    posts,
    invoices
  });
});

// GET single client profile (Enforces Client Ownership)
router.get('/:id', requireAuth, requireClientOwnership, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (!error && data) {
      return res.json(mapClient(data));
    }
  }

  const db = await readDB();
  const client = (db.clients || []).find(c => c.id === id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(mapClient(client));
});

// POST Create new client (Manager+ — heads, directors, admins)
router.post('/', requireAuth, requireManager, async (req, res) => {
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
      active_campaigns: newClient.activeCampaigns || [],
      pocs: newClient.pocs || []
    };

    const { error } = await supabase.from('clients').insert([payload]);
    if (!error) {
      broadcast('client_update', [payload]);
      const dbSnapshot = await readDB();
      const { processAutomationEvent } = require('../services/automation');
      await processAutomationEvent('client_onboarded', { client: payload }, dbSnapshot, writeDB, broadcast);
      return res.json({ success: true, client: newClient });
    }
  }

  const db = await readDB();
  newClient.id = `CLI-${String((db.clients.length || 0) + 1).padStart(4, '0')}`;
  newClient.totalSpent = '$0';
  db.clients.push(newClient);
  try { writeDB(db); } catch (e) { console.warn('Local writeDB skipped:', e.message); }
  broadcast('client_update', db.clients);
  res.json({ success: true, client: newClient });
});

// PUT Update client (Admin or matching client)
router.put('/:id', requireAuth, requireClientOwnership, async (req, res) => {
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
      status: updates.status,
      pocs: updates.pocs
    };

    const { error } = await supabase.from('clients').update(payload).eq('id', id);
    if (!error) {
      broadcast('client_update', [payload]);
      return res.json({ success: true });
    }
  }

  const db = await readDB();
  const idx = (db.clients || []).findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Client not found' });

  db.clients[idx] = { ...db.clients[idx], ...updates };
  try { writeDB(db); } catch (e) { console.warn('Local writeDB skipped:', e.message); }
  broadcast('client_update', db.clients);
  res.json({ success: true, client: db.clients[idx] });
});

// DELETE Client (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      broadcast('client_update', [{ id, deleted: true }]);
      return res.json({ success: true });
    }
  }

  const db = await readDB();
  db.clients = (db.clients || []).filter(c => c.id !== id);
  try { writeDB(db); } catch (e) { console.warn('Local writeDB skipped:', e.message); }
  broadcast('client_update', db.clients);
  res.json({ success: true });
});

// GET /api/clients/:id/timeline (CRM Activity Timeline)
router.get('/:id/timeline', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  if (isSupabaseConfigured()) {
    try {
      const { data: client } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();

      // Fetch related records
      const [tasksRes, invoicesRes, reviewsRes, meetingsRes] = await Promise.all([
        supabase.from('tasks').select('id, title, status, stage, created_at, updated_at').eq('client_id', id),
        supabase.from('invoices').select('id, project_name, amount, status, issue_date').eq('client_id', id),
        supabase.from('reviews').select('id, video_title, status, created_at').eq('client_id', id),
        supabase.from('client_meetings').select('*').eq('client_id', id).order('meeting_date', { ascending: false })
      ]);

      const timeline = [];

      (tasksRes.data || []).forEach(t => {
        timeline.push({
          type: 'task',
          title: `Task: ${t.title}`,
          description: `Stage: ${t.stage || t.status}`,
          date: t.updated_at || t.created_at,
          icon: '📋',
          color: 'var(--blue-brand)'
        });
      });

      (invoicesRes.data || []).forEach(i => {
        timeline.push({
          type: 'invoice',
          title: `Invoice Generated: BDT ${i.amount}`,
          description: `Project: ${i.project_name || 'N/A'} - Status: ${i.status}`,
          date: i.issue_date,
          icon: '💳',
          color: 'var(--emerald-accent)'
        });
      });

      (reviewsRes.data || []).forEach(r => {
        timeline.push({
          type: 'review',
          title: `Deliverable Review: ${r.video_title}`,
          description: `Status: ${r.status}`,
          date: r.created_at,
          icon: '🎬',
          color: 'var(--purple-primary)'
        });
      });

      timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

      let healthScore = 80;
      const invoices = invoicesRes.data || [];
      const paidInvoices = invoices.filter(i => i.status === 'Paid');
      const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
      
      if (invoices.length > 0) {
        healthScore += (paidInvoices.length / invoices.length) * 20;
      }
      if (overdueInvoices.length > 0) {
        healthScore -= overdueInvoices.length * 10;
      }
      
      const tasks = tasksRes.data || [];
      if (tasks.length > 5) healthScore += 5;
      
      healthScore = Math.max(1, Math.min(100, Math.floor(healthScore)));
      
      let healthLabel = 'Healthy';
      if (healthScore < 50) healthLabel = 'At Risk';
      else if (healthScore < 70) healthLabel = 'Needs Attention';
      else if (healthScore >= 90) healthLabel = 'Excellent';

      return res.json({
        success: true,
        timeline,
        meetings: meetingsRes.data || [],
        health: { score: healthScore, label: healthLabel }
      });
    } catch (err) {
      console.warn('Timeline Supabase fetch error:', err.message);
    }
  }

  // Local DB Fallback (dev mode)
  const db = await readDB();
  const client = (db.clients || []).find(c => c.id === id);
  const cName = (client?.name || '').toLowerCase();

  const tasks = (db.tasks || []).filter(t => t.clientId === id || (t.client || '').toLowerCase().includes(cName));
  const invoices = (db.invoices || []).filter(i => i.clientId === id || (i.clientName || '').toLowerCase().includes(cName));
  const reviews = (db.reviews || []).filter(r => r.clientId === id || (r.client || '').toLowerCase().includes(cName));
  const meetings = (db.clientMeetings || []).filter(m => m.client_id === id);

  const timeline = [];
  tasks.forEach(t => timeline.push({ type: 'task', title: `Task: ${t.title}`, description: `Stage: ${t.stage || t.status}`, date: t.updatedAt || t.createdAt, icon: '📋', color: 'var(--blue-brand)' }));
  invoices.forEach(i => timeline.push({ type: 'invoice', title: `Invoice: BDT ${i.amount}`, description: `Status: ${i.status}`, date: i.date || i.issueDate, icon: '💳', color: 'var(--emerald-accent)' }));
  reviews.forEach(r => timeline.push({ type: 'review', title: `Review: ${r.projectName || r.video_title}`, description: `Status: ${r.status}`, date: r.createdAt, icon: '🎬', color: 'var(--purple-primary)' }));

  timeline.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  res.json({
    success: true,
    timeline,
    meetings,
    health: { score: 85, label: 'Healthy' }
  });
});

// POST /api/clients/:id/meetings
router.post('/:id/meetings', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { meeting_date, notes, action_items } = req.body;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('client_meetings').insert([{
      client_id: id,
      meeting_date,
      notes,
      action_items
    }]).select('*').single();

    if (!error) return res.json({ success: true, meeting: data });
  }

  // Fallback to local DB
  const db = await readDB();
  db.clientMeetings = db.clientMeetings || [];
  const newMeeting = { id: `MTG-${Date.now()}`, client_id: id, meeting_date, notes, action_items, created_at: new Date().toISOString() };
  db.clientMeetings.unshift(newMeeting);
  try { writeDB(db); } catch (e) {}

  res.json({ success: true, meeting: newMeeting });
});

module.exports = router;
