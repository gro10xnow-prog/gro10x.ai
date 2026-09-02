const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { randomUUID } = require('crypto');

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ALLOWED = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp4'
    ];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not permitted for upload`));
    }
  }
});

function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    channel: p.channel || p.channel_name || 'Client Account',
    contentCategory: p.content_category || p.contentCategory || 'General',
    contentType: p.content_type || p.contentType || 'Short-form Video',
    targetDuration: p.target_duration || p.targetDuration || '30s',
    veoPrompts: p.veo_prompts || p.veoPrompts || null,
    pdfOutline: p.pdf_outline || p.pdfOutline || null,
    firstComment: p.first_comment || p.firstComment || '',
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
    assignedPublisher: p.assigned_publisher || p.assignedPublisher || 'Content Team',
    status: p.status || 'Draft',
    clientFeedback: p.client_feedback || null,
    approvedBy: p.approved_by || null,
    approvedAt: p.approved_at || null,
    postedAt: p.posted_at || null,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

async function requirePostOwnership(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized: Authentication required' });

  const access = (user.profile?.accessLevel || user.accessLevel || '').toLowerCase();
  const role = (user.profile?.role || user.role || '').toLowerCase();
  const isAdminOrManager =
    access.includes('admin') || access.includes('owner') || access.includes('director') || access.includes('manager') ||
    role.includes('admin') || role.includes('owner') || role.includes('director') || role.includes('manager');

  if (isAdminOrManager) {
    return next();
  }

  const linkedType = user.linkedType || user.profile?.linkedType || '';
  const userLinkedId = user.linkedId || user.profile?.linkedId || user.id;
  const userName = (user.profile?.name || user.name || user.company || '').toLowerCase();

  if (linkedType === 'client' && (userLinkedId || userName)) {
    if (supabase) {
      const { data: post } = await supabase
        .from('social_posts')
        .select('client_id, client_name')
        .eq('id', req.params.id)
        .maybeSingle();

      if (!post) {
        const memPost = inMemoryPosts.find(p => p.id === req.params.id);
        if (!memPost) return res.status(404).json({ error: 'Post not found' });
        const matchId = memPost.client_id && userLinkedId && String(memPost.client_id).toLowerCase() === String(userLinkedId).toLowerCase();
        const matchName = memPost.client_name && userName && memPost.client_name.toLowerCase() === userName;
        if (matchId || matchName) return next();
        return res.status(403).json({ error: 'Forbidden: You do not have access to this social post' });
      }

      const pClientId = post.client_id;
      const pClientName = (post.client_name || '').toLowerCase();

      const matchId = pClientId && userLinkedId && String(pClientId).toLowerCase() === String(userLinkedId).toLowerCase();
      const matchName = pClientName && userName && pClientName === userName;

      if (matchId || matchName) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden: You do not have access to this social post' });
    }
  }

  next();
}

async function requirePostApprovalAccess(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized: Authentication required' });

  const access = (user.profile?.accessLevel || user.accessLevel || '').toLowerCase();
  const role = (user.profile?.role || user.role || '').toLowerCase();
  const isAdminOrManager =
    access.includes('admin') || access.includes('owner') || access.includes('director') || access.includes('manager') ||
    role.includes('admin') || role.includes('owner') || role.includes('director') || role.includes('manager');

  if (isAdminOrManager) {
    return next();
  }

  const linkedType = user.linkedType || user.profile?.linkedType || '';
  const userLinkedId = user.linkedId || user.profile?.linkedId || user.id;

  if (linkedType === 'client' && userLinkedId) {
    let post = inMemoryPosts.find(p => p.id === req.params.id);
    if (supabase) {
      const { data } = await supabase.from('social_posts').select('client_id').eq('id', req.params.id).maybeSingle();
      if (data) post = data;
    }
    if (post && String(post.client_id || '').toLowerCase() === String(userLinkedId).toLowerCase()) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: You can only approve or review posts assigned to your client account' });
  }

  return res.status(403).json({ error: 'Forbidden: Manager or Client privileges required to approve/reject posts' });
}

const DEFAULT_POSTS = [];

// In-memory store for session continuity when Supabase table is unreachable
let inMemoryPosts = [...DEFAULT_POSTS];

// GET All Social Posts
router.get('/', requireAuth, async (req, res) => {
  const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
  const clientName = (req.user.profile?.name || req.user.name || '').toLowerCase();
  const clientId = req.user.linkedId || req.user.id;

  function getFilteredPosts() {
    let list = inMemoryPosts;
    if (isClientUser) {
      list = list.filter(p => (p.client_id && p.client_id === clientId) || ((p.client_name || p.clientName || '').toLowerCase() === clientName));
    }
    return list.map(mapPost);
  }

  try {
    let posts = [];
    if (supabase) {
      try {
        let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });

        if (isClientUser) {
          if (clientId) {
            query = query.eq('client_id', clientId);
          } else if (clientName) {
            query = query.ilike('client_name', clientName);
          }
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
      posts = getFilteredPosts();
    }

    res.json(posts);
  } catch (err) {
    console.error('Social Posts GET error:', err.message);
    res.json(getFilteredPosts());
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
    if (posts.length === 0) {
      posts = inMemoryPosts.filter(p => 
        (p.client_name && p.client_name.toLowerCase() === decoded.toLowerCase()) ||
        (p.client_id && String(p.client_id).toLowerCase() === decoded.toLowerCase())
      ).map(mapPost);
    }

    res.json(posts);
  } catch (err) {
    console.error('Client Posts GET error:', err.message);
    res.json([]);
  }
});

// POST Upload Media Asset (Image, Video, Document, PDF, Audio)
router.post('/upload-media', requireAuth, mediaUpload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided for upload' });
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `social-media/${Date.now()}_${safeName}`;
    let fileUrl = '';

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: upData, error: upErr } = await supabase.storage
          .from('social-assets')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: true
          });

        if (!upErr) {
          const { data: pubData } = supabase.storage.from('social-assets').getPublicUrl(storagePath);
          fileUrl = pubData?.publicUrl || '';
        }
      } catch (storageErr) {
        console.warn('[Social Media Upload] Supabase storage note:', storageErr.message);
      }
    }

    // Fallback: If not uploaded to Supabase Storage, use data URL for images/small media, or synthetic URL
    if (!fileUrl) {
      const mime = file.mimetype || 'application/octet-stream';
      if (file.size <= 10 * 1024 * 1024) {
        fileUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
      } else {
        fileUrl = `/uploads/${storagePath}`;
      }
    }

    return res.json({
      success: true,
      url: fileUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (err) {
    console.error('Media upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Media upload failed' });
  }
});

// POST Batch Create Social Posts (from Content Calendar AI)
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const { posts } = req.body;
    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'posts array is required' });
    }

    const createdPosts = [];
    const dbPayloads = [];

    for (const p of posts) {
      const rawUuid = randomUUID ? randomUUID() : 'a0000000-0000-0000-0000-000000000000'.replace(/0/g, () => Math.floor(Math.random()*16).toString(16));
      const newId = `PST-${rawUuid.split('-')[0].toUpperCase()}`;

      const payload = {
        id: newId,
        channel: p.channel || p.channel_name || 'Client Account',
        content_category: p.contentCategory || p.content_category || 'General',
        content_type: p.contentType || p.content_type || 'Short-form Video',
        target_duration: p.targetDuration || p.target_duration || '30s',
        veo_prompts: p.veoPrompts || p.veo_prompts || null,
        pdf_outline: p.pdfOutline || p.pdf_outline || null,
        first_comment: p.firstComment || p.first_comment || '',
        client_id: p.clientId || p.client_id || '',
        client_name: p.clientName || p.client_name || 'General Client',
        platform: p.platform || 'Facebook',
        target_url: p.targetUrl || p.target_url || '',
        title: p.title || p.topicIdea || 'Untitled Post',
        caption: p.caption || (p.hook ? `${p.hook}\n\n` : ''),
        hashtags: p.hashtags || '',
        media_urls: p.mediaUrls || (p.mediaUrl ? [p.mediaUrl] : []),
        scheduled_date: p.scheduledDate || p.scheduled_date || new Date().toISOString().split('T')[0],
        scheduled_time: p.scheduledTime || p.scheduled_time || '18:00',
        assigned_publisher: p.assignedPublisher || req.user?.profile?.name || req.user?.name || 'Content Team',
        status: p.status || 'Draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      inMemoryPosts.unshift(payload);
      createdPosts.push(mapPost(payload));
      dbPayloads.push(payload);
    }

    if (supabase) {
      supabase.from('social_posts').insert(dbPayloads).then(null, e => {
        console.warn('[Social API] Supabase batch post insert note:', e.message);
      });
    }

    try {
      broadcast('post_update', inMemoryPosts.map(mapPost));
    } catch (e) {}

    return res.status(201).json({ success: true, count: createdPosts.length, posts: createdPosts });
  } catch (err) {
    console.error('Social Posts batch creation error:', err.message);
    return res.status(500).json({ error: err.message || 'Batch creation failed' });
  }
});

// POST Schedule/Draft Social Post
router.post('/', requireAuth, async (req, res) => {
  try {
    const rawUuid = randomUUID ? randomUUID() : 'a0000000-0000-0000-0000-000000000000'.replace(/0/g, () => Math.floor(Math.random()*16).toString(16));
    const newId = `PST-${rawUuid.split('-')[0].toUpperCase()}`;

    const payload = {
      id: newId,
      channel: req.body.channel || req.body.channel_name || 'Client Account',
      content_category: req.body.contentCategory || req.body.content_category || 'General',
      content_type: req.body.contentType || req.body.content_type || 'Short-form Video',
      target_duration: req.body.targetDuration || req.body.target_duration || '30s',
      veo_prompts: req.body.veoPrompts || req.body.veo_prompts || null,
      pdf_outline: req.body.pdfOutline || req.body.pdf_outline || null,
      first_comment: req.body.firstComment || req.body.first_comment || '',
      client_id: req.body.clientId || req.body.client_id || '',
      client_name: req.body.clientName || req.body.client_name || 'General Client',
      platform: req.body.platform || 'Facebook',
      target_url: req.body.targetUrl || req.body.target_url || '',
      title: req.body.title || 'Untitled Post',
      caption: req.body.caption || '',
      hashtags: req.body.hashtags || '',
      media_urls: req.body.mediaUrls || (req.body.mediaUrl ? [req.body.mediaUrl] : []),
      scheduled_date: req.body.scheduledDate || req.body.scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_time: req.body.scheduledTime || req.body.scheduled_time || '18:00',
      assigned_publisher: req.body.assignedPublisher || req.body.assigned_publisher || req.user?.profile?.name || req.user?.name || 'Content Team',
      status: req.body.status || 'Draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const post = mapPost(payload);
    inMemoryPosts.unshift(payload);

    // Persist to Supabase in background
    if (supabase) {
      supabase.from('social_posts').insert([payload]).then(null, e => {
        console.warn('[Social API] Supabase post insert note:', e.message);
      });
    }

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
router.put('/:id', requireAuth, requirePostOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };

    if (req.body.title) updates.title = req.body.title;
    if (req.body.channel) updates.channel = req.body.channel;
    if (req.body.contentCategory !== undefined) updates.content_category = req.body.contentCategory;
    if (req.body.contentType !== undefined) updates.content_type = req.body.contentType;
    if (req.body.targetDuration !== undefined) updates.target_duration = req.body.targetDuration;
    if (req.body.veoPrompts !== undefined) updates.veo_prompts = req.body.veoPrompts;
    if (req.body.pdfOutline !== undefined) updates.pdf_outline = req.body.pdfOutline;
    if (req.body.firstComment !== undefined) updates.first_comment = req.body.firstComment;
    if (req.body.caption !== undefined) updates.caption = req.body.caption;
    if (req.body.hashtags !== undefined) updates.hashtags = req.body.hashtags;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.platform) updates.platform = req.body.platform;
    if (req.body.clientId !== undefined) updates.client_id = req.body.clientId;
    if (req.body.clientName !== undefined) updates.client_name = req.body.clientName;
    if (req.body.scheduledDate) updates.scheduled_date = req.body.scheduledDate;
    if (req.body.scheduledTime) updates.scheduled_time = req.body.scheduledTime;
    if (req.body.mediaUrls) updates.media_urls = req.body.mediaUrls;

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
    }

    const post = mapPost(inMemoryPosts[memIdx] || { id, ...updates });

    // Persist to Supabase in background
    if (supabase) {
      supabase.from('social_posts').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    return res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post PUT error:', err.message);
    return res.status(500).json({ error: err.message });
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

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
    }
    const post = mapPost(inMemoryPosts[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('social_posts').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}

    // Fire Automation Engine event non-blockingly
    try {
      const { processAutomationEvent } = require('../services/automation');
      processAutomationEvent('social_post_approved', { post }, { clients: [], team: [], tasks: [] }, () => {}, broadcast).catch(() => {});
    } catch(e) {}

    return res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Approve error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

router.post('/:id/approve', requireAuth, requirePostApprovalAccess, handleApprovePost);
router.patch('/:id/approve', requireAuth, requirePostApprovalAccess, handleApprovePost);

// POST/PATCH Reject Post (Client Feedback)
const handleRejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Revision Requested',
      client_feedback: req.body.feedback || 'Revision requested',
      updated_at: new Date().toISOString()
    };

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
    }
    const post = mapPost(inMemoryPosts[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('social_posts').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    return res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Reject error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

router.post('/:id/reject', requireAuth, requirePostApprovalAccess, handleRejectPost);
router.patch('/:id/reject', requireAuth, requirePostApprovalAccess, handleRejectPost);

// POST/PATCH Mark Post as Posted (Engine 5 Loop)
const handlePosted = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Posted',
      posted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
    }
    const post = mapPost(inMemoryPosts[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('social_posts').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    return res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post Posted error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

router.post('/:id/posted', requireAuth, requirePostOwnership, handlePosted);
router.patch('/:id/posted', requireAuth, requirePostOwnership, handlePosted);

// PATCH Update Post Status
router.patch('/:id/status', requireAuth, requirePostOwnership, async (req, res) => {
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

    const memIdx = inMemoryPosts.findIndex(p => p.id === id);
    if (memIdx !== -1) {
      inMemoryPosts[memIdx] = { ...inMemoryPosts[memIdx], ...updates };
    }
    const post = mapPost(inMemoryPosts[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('social_posts').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}
    return res.json({ success: true, post });
  } catch (err) {
    console.error('Social Post status update error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE Post
router.delete('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      supabase.from('social_posts').delete().eq('id', id).then(null, () => {});
    }

    inMemoryPosts = inMemoryPosts.filter(p => p.id !== id);
    try { broadcast('post_update', inMemoryPosts.map(mapPost)); } catch (e) {}

    return res.json({ success: true, id });
  } catch (err) {
    console.error('Social Post DELETE error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
