const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireClientOwnership } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

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
      return res.json(data.map(c => ({
        ...c,
        contactPerson: c.contact_person,
        totalSpent: c.total_spent,
        activeCampaigns: c.active_campaigns
      })));
    }
  }

  const db = await readDB();
  let clientsList = db.clients || [];

  if (isClient && clientLimitId) {
    clientsList = clientsList.filter(c => c.id === clientLimitId || (c.name || '').toLowerCase() === (req.user.name || '').toLowerCase());
  }

  res.json(clientsList);
});

// GET single client profile (Enforces Client Ownership)
router.get('/:id', requireAuth, requireClientOwnership, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (!error && data) {
      return res.json({
        ...data,
        contactPerson: data.contact_person,
        totalSpent: data.total_spent,
        activeCampaigns: data.active_campaigns
      });
    }
  }

  const db = await readDB();
  const client = (db.clients || []).find(c => c.id === id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
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
      active_campaigns: newClient.activeCampaigns || []
    };

    const { error } = await supabase.from('clients').insert([payload]);
    if (!error) {
      broadcast('client_update', [payload]);
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
      status: updates.status
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
      activeCampaigns: clientData.active_campaigns || []
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

module.exports = router;
