const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireClientOwnership } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

function mapClient(c) {
  if (!c) return null;
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
    totalSpent: Number(c.total_spent || c.totalSpent) || 0,
    activeCampaigns: Number(c.active_campaigns || c.activeCampaigns) || 1,
    pocs: c.pocs && Array.isArray(c.pocs) ? c.pocs : [],
    createdAt: c.created_at || c.createdAt
  };
}

// GET all clients (Admin sees all; Client sees ONLY their own client record)
router.get('/', requireAuth, async (req, res) => {
  const isClient = req.user.linkedType === 'client';
  const clientLimitId = isClient ? req.user.linkedId : null;

  if (isSupabaseConfigured()) {
    let query = supabase.from('clients').select('*');
    if (isClient && clientLimitId) {
      query = query.eq('id', clientLimitId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return res.json(data.map(mapClient));
    }
  }

  const db = await readDB();
  let clientsList = db.clients || [];

  if (isClient && clientLimitId) {
    clientsList = clientsList.filter(c => c.id === clientLimitId || (c.name || '').toLowerCase() === (req.user.name || '').toLowerCase());
  }

  res.json(clientsList.map(mapClient));
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

// POST Create new client (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
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

// GET /api/clients/:id/timeline (CRM Activity Timeline)
router.get('/:id/timeline', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const { data: client } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
    const clientName = client ? client.name : '';

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

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Health Score (1-100)
    let healthScore = 80; // Base score
    const invoices = invoicesRes.data || [];
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
    
    if (invoices.length > 0) {
      healthScore += (paidInvoices.length / invoices.length) * 20; // Up to +20 for paid ratio
    }
    if (overdueInvoices.length > 0) {
      healthScore -= overdueInvoices.length * 10; // -10 for each overdue
    }
    
    const tasks = tasksRes.data || [];
    if (tasks.length > 5) healthScore += 5; // Active engagement bonus
    
    // Clamp score
    healthScore = Math.max(1, Math.min(100, Math.floor(healthScore)));
    
    let healthLabel = 'Healthy';
    if (healthScore < 50) healthLabel = 'At Risk';
    else if (healthScore < 70) healthLabel = 'Needs Attention';
    else if (healthScore >= 90) healthLabel = 'Excellent';

    res.json({
      success: true,
      timeline,
      meetings: meetingsRes.data || [],
      health: {
        score: healthScore,
        label: healthLabel
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// POST /api/clients/:id/meetings
router.post('/:id/meetings', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { meeting_date, notes, action_items } = req.body;

  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const { data, error } = await supabase.from('client_meetings').insert([{
    client_id: id,
    meeting_date,
    notes,
    action_items
  }]).select('*').single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, meeting: data });
});

module.exports = router;
