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

// GET All Social Posts
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });

    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    const clientName = req.user.profile?.name || req.user.name;

    if (isClientUser && clientName) {
      query = query.or(`client_id.eq.${req.user.linkedId || req.user.id},client_name.ilike.%${clientName}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(mapPost));
  } catch (err) {
    console.error('Social Posts GET error:', err.message);
    res.status(500).json({ error: err.message });
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

    const { data, error } = await supabase.from('social_posts')
      .select('*')
      .or(`client_name.ilike.%${decoded}%,client_id.eq.${decoded}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((data || []).map(mapPost));
  } catch (err) {
    console.error('Client Posts GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Schedule/Draft Social Post
router.post('/', requireAuth, async (req, res) => {
  try {
    const newId = `PST-${randomUUID().split('-')[0].toUpperCase()}`;

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
      status: req.body.status || 'Draft'
    };

    const { data, error } = await supabase.from('social_posts').insert([payload]).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post POST error:', err.message);
    res.status(500).json({ error: err.message });
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

    const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

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

    const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

    // Fire Automation Engine event
    try {
      const { processAutomationEvent } = require('../services/automation');
      await processAutomationEvent('social_post_approved', {
        post
      }, { clients: [], team: [], tasks: [] }, () => {}, broadcast);
    } catch(e) {
      console.warn('Social post approved automation error:', e.message);
    }

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

    const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

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
    if (feedback) {
      updates.client_feedback = feedback;
    }
    if (status === 'Approved') {
      updates.approved_by = req.user.name || 'Client';
      updates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

    if (status === 'Pending Client Approval' || status === 'Client Review') {
      try {
        const { processAutomationEvent } = require('../services/automation');
        await processAutomationEvent('social_post_client_review', { post }, { clients: [], team: [] }, () => {}, broadcast);
      } catch (e) {
        console.warn('Client review automation error:', e.message);
      }
    } else if (status === 'Approved') {
      try {
        const { processAutomationEvent } = require('../services/automation');
        await processAutomationEvent('social_post_approved', { post }, { clients: [], team: [] }, () => {}, broadcast);
      } catch (e) {
        console.warn('Approved post automation error:', e.message);
      }
    }

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
    const { error } = await supabase.from('social_posts').delete().eq('id', id);
    if (error) throw error;

    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

    res.json({ success: true, id });
  } catch (err) {
    console.error('Social Post DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
