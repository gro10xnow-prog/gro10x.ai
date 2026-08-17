const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { randomUUID } = require('crypto');

function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    clientId: p.client_id || null,
    clientName: p.client_name || 'General Client',
    platform: p.platform || 'Facebook',
    targetUrl: p.target_url || '',
    title: p.title || 'Untitled Post',
    caption: p.caption || '',
    hashtags: p.hashtags || '',
    mediaUrls: p.media_urls || [],
    scheduledDate: p.scheduled_date || '',
    scheduledTime: p.scheduled_time || '18:00',
    assignedPublisher: p.assigned_publisher || 'Unassigned',
    status: p.status || 'Draft',
    clientFeedback: p.client_feedback || null,
    approvedBy: p.approved_by || null,
    approvedAt: p.approved_at || null,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

const DEFAULT_POSTS = [
  {
    id: 'PST-001',
    client_id: 'cli_chillox',
    client_name: 'Chillox Bangladesh',
    platform: 'Instagram',
    target_url: 'https://instagram.com/chillox',
    title: '🍔 Double Patty Burger Weekend Special Reel',
    caption: 'Craving the juiciest bite in town? 🔥 Get 20% off on all Double Gourmet Burgers this weekend only! Tag a friend who owes you a meal. #Chillox #DhakaFoodie #BurgerLover',
    hashtags: '#Chillox #DhakaFoodie #BurgerLover #WeekendTreat',
    media_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'],
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_time: '19:30',
    assigned_publisher: 'Borhan Uddin',
    status: 'Approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'PST-002',
    client_id: 'cli_aura',
    client_name: 'Aura Cosmetics',
    platform: 'Facebook',
    target_url: 'https://facebook.com/auracosmetics',
    title: '✨ Hydrating Vitamin C Serum Product Showcase',
    caption: 'Glow from within! Discover the secret to 24-hour hydration with our newly formulated Vitamin C Radiance Serum. Dermatologically tested. 🌸 #AuraCosmetics #SkincareRoutine #GlowUp',
    hashtags: '#AuraCosmetics #SkincareRoutine #GlowUp #RadiantSkin',
    media_urls: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'],
    scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    scheduled_time: '18:00',
    assigned_publisher: 'Zahin',
    status: 'Client Review',
    created_at: new Date().toISOString()
  },
  {
    id: 'PST-003',
    client_id: 'cli_apex',
    client_name: 'Apex Footwear',
    platform: 'LinkedIn',
    target_url: 'https://linkedin.com/company/apex-footwear',
    title: '💼 Executive Leather Collection — Craftsmanship Behind Every Stitch',
    caption: 'Precision, heritage, and unmatched comfort. Explore how Apex combines traditional artisanal leather craft with modern ergonomics for modern leaders. #ApexFootwear #LeadershipStyle #Craftsmanship',
    hashtags: '#ApexFootwear #LeadershipStyle #Craftsmanship #CorporateFashion',
    media_urls: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
    scheduled_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    scheduled_time: '11:00',
    assigned_publisher: 'Mahmudul Hasan',
    status: 'In Pipeline',
    created_at: new Date().toISOString()
  }
];

// In-memory store for session continuity when Supabase table is unreachable
let inMemoryPosts = [...DEFAULT_POSTS];

// GET All Social Posts
router.get('/', requireAuth, async (req, res) => {
  try {
    let posts = [];
    if (supabase) {
      try {
        let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });

        const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
        const clientName = req.user.profile?.name || req.user.name;

        if (isClientUser && clientName) {
          query = query.or(`client_id.eq.${req.user.linkedId || req.user.id},client_name.ilike.%${clientName}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          posts = data.map(mapPost);
        }
      } catch (dbErr) {
        console.warn('Supabase social_posts query note:', dbErr.message);
      }
    }

    if (posts.length === 0) {
      posts = inMemoryPosts.map(mapPost);
    }

    res.json(posts);
  } catch (err) {
    console.error('Social Posts GET error:', err.message);
    res.json(inMemoryPosts.map(mapPost));
  }
});

// GET Client Posts
router.get('/client/:clientName', requireAuth, async (req, res) => {
  try {
    let { clientName } = req.params;
    let decoded = decodeURIComponent(clientName);

    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    const userClientName = req.user.profile?.name || req.user.name;

    if (isClientUser && userClientName) {
      decoded = userClientName;
    }

    let posts = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts')
          .select('*')
          .or(`client_name.ilike.%${decoded}%,client_id.eq.${decoded}`)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          posts = data.map(mapPost);
        }
      } catch (e) {}
    }

    if (posts.length === 0) {
      posts = inMemoryPosts.filter(p => (p.client_name || '').toLowerCase().includes(decoded.toLowerCase())).map(mapPost);
      if (posts.length === 0) posts = inMemoryPosts.map(mapPost);
    }

    res.json(posts);
  } catch (err) {
    console.error('Client Posts GET error:', err.message);
    res.json(inMemoryPosts.map(mapPost));
  }
});

// POST Schedule/Draft Social Post
router.post('/', requireAuth, async (req, res) => {
  try {
    const rawUuid = randomUUID ? randomUUID() : 'a0000000-0000-0000-0000-000000000000'.replace(/0/g, () => Math.floor(Math.random()*16).toString(16));
    const newId = `PST-${rawUuid.split('-')[0].toUpperCase()}`;

    const payload = {
      id: newId,
      client_id: req.body.clientId || '',
      client_name: req.body.clientName || 'General Client',
      platform: req.body.platform || 'Facebook',
      target_url: req.body.targetUrl || '',
      title: req.body.title || 'Untitled Post',
      caption: req.body.caption || '',
      hashtags: req.body.hashtags || '',
      media_urls: req.body.mediaUrls || (req.body.mediaUrl ? [req.body.mediaUrl] : []),
      scheduled_date: req.body.scheduledDate || new Date().toISOString().split('T')[0],
      scheduled_time: req.body.scheduledTime || '18:00',
      assigned_publisher: req.body.assignedPublisher || req.user?.name || 'Unassigned',
      status: req.body.status || 'Draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let post = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts').insert([payload]).select().single();
        if (!error && data) post = mapPost(data);
      } catch (e) {
        console.warn('Supabase post insert note:', e.message);
      }
    }

    if (!post) {
      post = mapPost(payload);
    }

    inMemoryPosts.unshift(payload);

    try {
      broadcast('post_update', inMemoryPosts.map(mapPost));
    } catch (e) {}

    return res.status(201).json({ success: true, post });
  } catch (err) {
    console.error('Social Post POST error:', err.message);
    return res.status(500).json({ error: err.message || 'Post creation failed' });
  }
});

// PUT Update Post
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };

    if (req.body.title) updates.title = req.body.title;
    if (req.body.caption !== undefined) updates.caption = req.body.caption;
    if (req.body.hashtags !== undefined) updates.hashtags = req.body.hashtags;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.platform) updates.platform = req.body.platform;
    if (req.body.clientId !== undefined) updates.client_id = req.body.clientId;
    if (req.body.clientName !== undefined) updates.client_name = req.body.clientName;
    if (req.body.scheduledDate) updates.scheduled_date = req.body.scheduledDate;
    if (req.body.scheduledTime) updates.scheduled_time = req.body.scheduledTime;
    if (req.body.mediaUrls) updates.media_urls = req.body.mediaUrls;

    let post = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
        if (!error && data) post = mapPost(data);
      } catch (e) {}
    }

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
      if (!post) post = mapPost(inMemoryPosts[memIdx]);
    }

    if (!post) post = mapPost({ id, ...updates });

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST/PATCH Approve Post (Client 1-Click Approval)
const handleApprovePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Approved',
      approved_at: new Date().toISOString(),
      approved_by: req.body.approvedBy || req.user.name || 'Client Reviewer',
      client_feedback: null,
      updated_at: new Date().toISOString()
    };

    let post = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
        if (!error && data) post = mapPost(data);
      } catch (e) {}
    }

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
      if (!post) post = mapPost(inMemoryPosts[memIdx]);
    }
    if (!post) post = mapPost({ id, ...updates });

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}

    // Fire Automation Engine event non-blockingly
    try {
      const { processAutomationEvent } = require('../services/automation');
      processAutomationEvent('social_post_approved', { post }, { clients: [], team: [], tasks: [] }, () => {}, broadcast).catch(() => {});
    } catch(e) {}

    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

router.post('/:id/approve', requireAuth, handleApprovePost);
router.patch('/:id/approve', requireAuth, handleApprovePost);

// POST/PATCH Reject Post (Client Feedback)
const handleRejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Revision Requested',
      client_feedback: req.body.feedback || 'Revision requested',
      updated_at: new Date().toISOString()
    };

    let post = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
        if (!error && data) post = mapPost(data);
      } catch (e) {}
    }

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
      if (!post) post = mapPost(inMemoryPosts[memIdx]);
    }
    if (!post) post = mapPost({ id, ...updates });

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

router.post('/:id/reject', requireAuth, handleRejectPost);
router.patch('/:id/reject', requireAuth, handleRejectPost);

// PATCH Update Post Status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    const updates = {
      status: status || 'Approved',
      updated_at: new Date().toISOString()
    };
    if (feedback) updates.client_feedback = feedback;
    if (status === 'Approved') {
      updates.approved_by = req.user.name || 'Client';
      updates.approved_at = new Date().toISOString();
    }

    let post = null;
    if (supabase) {
      try {
        const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
        if (!error && data) post = mapPost(data);
      } catch (e) {}
    }

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
      if (!post) post = mapPost(inMemoryPosts[memIdx]);
    }
    if (!post) post = mapPost({ id, ...updates });

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post status update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      try {
        await supabase.from('social_posts').delete().eq('id', id);
      } catch (e) {}
    }

    inMemoryPosts = inMemoryPosts.filter(p => p.id !== id);
    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}

    res.json({ success: true, id });
  } catch (err) {
    console.error('Social Post DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
