const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    clientId: p.client_id,
    clientName: p.client_name,
    platform: p.platform,
    targetUrl: p.target_url,
    title: p.title,
    caption: p.caption,
    mediaUrls: p.media_urls || [],
    scheduledDate: p.scheduled_date,
    scheduledTime: p.scheduled_time,
    assignedPublisher: p.assigned_publisher,
    status: p.status,
    clientFeedback: p.client_feedback,
    approvedBy: p.approved_by,
    approvedAt: p.approved_at,
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

    // Hardening: If client role, enforce their own client context
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

// POST Schedule Social Post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('social_posts').select('*', { count: 'exact', head: true });
    const newId = `PST-${(count || 0) + 101}`;

    const payload = {
      id: newId,
      client_id: req.body.clientId || '',
      client_name: req.body.clientName || 'General Client',
      platform: req.body.platform || 'Facebook',
      target_url: req.body.targetUrl || '',
      title: req.body.title || 'Untitled Post',
      caption: req.body.caption || '',
      media_urls: req.body.mediaUrls || (req.body.mediaUrl ? [req.body.mediaUrl] : []),
      scheduled_date: req.body.scheduledDate || new Date().toISOString().split('T')[0],
      scheduled_time: req.body.scheduledTime || '18:00',
      assigned_publisher: req.body.assignedPublisher || req.user?.name || 'Unassigned',
      status: req.body.status || 'Pending Client Approval'
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
    if (req.body.status) updates.status = req.body.status;
    if (req.body.platform) updates.platform = req.body.platform;
    if (req.body.scheduledDate) updates.scheduled_date = req.body.scheduledDate;
    if (req.body.scheduledTime) updates.scheduled_time = req.body.scheduledTime;

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

    // Dispatch Telegram alert to publisher
    try {
      const { sendTelegramNotification } = require('../services/bot/notifications');
      const ownerChatId = process.env.OWNER_TELEGRAM_ID || '7754769807';
      sendTelegramNotification(ownerChatId,
        `🎉 *SOCIAL POST APPROVED BY CLIENT!*\n\n` +
        `• Post: *${post.title}*\n` +
        `• Client: *${post.clientName}*\n` +
        `• Platform: *${post.platform}*\n` +
        `• Scheduled: *${post.scheduledDate} @ ${post.scheduledTime}*\n\n` +
        `Post has been cleared for automated publishing! 🚀`,
        null,
        true
      );
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

    const { data, error } = await supabase.from('social_posts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const post = mapPost(data);
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    broadcast('post_update', (allPosts || []).map(mapPost));

    // Dispatch Telegram alert
    try {
      const { sendTelegramNotification } = require('../services/bot/notifications');
      const ownerChatId = process.env.OWNER_TELEGRAM_ID || '7754769807';
      sendTelegramNotification(ownerChatId,
        `✏️ *REVISION REQUESTED ON SOCIAL POST*\n\n` +
        `• Post: *${post.title}*\n` +
        `• Client: *${post.clientName}*\n` +
        `• Feedback: "${req.body.feedback || 'Revision requested'}"\n\n` +
        `Please update post copy and resubmit for review.`,
        null,
        true
      );
    } catch(e) {}

    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

router.post('/:id/reject', requireAuth, handleRejectPost);
router.patch('/:id/reject', requireAuth, handleRejectPost);

// PATCH Update Post Status (used by Client Review Room)
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

    res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post status update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
