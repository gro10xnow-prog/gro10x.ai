const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const sse = require('../services/sse');
const broadcast = (...args) => sse.broadcast(...args);
const broadcastToClient = (...args) => sse.broadcastToClient(...args);
const broadcastToEmployee = (...args) => sse.broadcastToEmployee(...args);
const { mapTask } = require('./tasks');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const isVideo = file.mimetype && file.mimetype.startsWith('video/');
    const isPdf = file.mimetype === 'application/pdf';
    if (isImage || isVideo || isPdf) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not permitted for review deliverable assets`));
    }
  }
});


const fallbackReviews = [
  {
    id: 'REV-SAMPLE01',
    project_id: 'PRJ-CHILLOX01',
    project_name: 'Chillox TVC Master Cut v2',
    client: 'Chillox Bangladesh',
    client_id: null,
    task_id: null,
    active_version: 'v2',
    versions: ['v1', 'v2'],
    media_type: 'video',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    poster_url: null,
    resolved_count: 2,
    total_count: 5,
    created_at: new Date().toISOString()
  }
];

function mapReview(r) {
  if (!r) return null;
  const totalCount = r.total_count || 0;
  const resolvedCount = r.resolved_count || 0;
  const isApproved = !!r.approved_at;
  const isRevisionRequested = !!r.revision_requested_at && !isApproved;
  return {
    id: r.id,
    projectId: r.project_id || r.projectId,
    projectName: r.project_name || r.projectName,
    client: r.client,
    clientName: r.client,           // Explicit alias so SPA doesn't guess
    clientId: r.client_id || r.clientId || null,
    taskId: r.task_id || r.taskId || null,
    activeVersion: r.active_version || r.activeVersion || 'v1',
    versions: r.versions || ['v1'],
    deliverableType: r.deliverable_type || r.deliverableType || (r.media_type === 'video' ? 'video' : 'staging_url'),
    mediaType: r.media_type || r.mediaType || 'video',
    mediaUrl: r.media_url || r.mediaUrl,
    stagingUrl: r.staging_url || r.stagingUrl || null,
    repoUrl: r.repo_url || r.repoUrl || null,
    branchName: r.branch_name || r.branchName || null,
    apiDocsUrl: r.api_docs_url || r.apiDocsUrl || null,
    posterUrl: r.poster_url || r.posterUrl,
    resolvedCount,
    totalCount,
    unresolvedCount: Math.max(0, totalCount - resolvedCount),
    revisionRound: Number(r.revision_round !== undefined ? r.revision_round : (r.revisionRound || 1)),
    maxRevisions: Number(r.max_revisions !== undefined ? r.max_revisions : (r.maxRevisions || 2)),
    dodChecklist: Array.isArray(r.dod_checklist) ? r.dod_checklist : (Array.isArray(r.dodChecklist) ? r.dodChecklist : []),
    approvedBy: r.approved_by || r.approvedBy || null,
    approvedAt: r.approved_at || r.approvedAt || null,
    revisionRequestedBy: r.revision_requested_by || r.revisionRequestedBy || null,
    revisionNotes: r.revision_notes || r.revisionNotes || null,
    revisionRequestedAt: r.revision_requested_at || r.revisionRequestedAt || null,
    status: isApproved ? 'approved' : isRevisionRequested ? 'revision_requested' : (r.status || 'pending'),
    isApproved,
    createdAt: r.created_at || r.createdAt
  };
}

function mapComment(c) {
  if (!c) return null;
  return {
    id: c.id,
    reviewId: c.review_id || c.reviewId,
    author: c.author,
    authorRole: c.author_role || c.authorRole || 'Client Reviewer',
    authorPocId: c.author_poc_id || c.authorPocId || null,
    assignedTeamMember: c.assigned_team_member || c.assignedTeamMember || null,
    commentType: c.comment_type || c.commentType || 'GENERAL',
    scopeFlag: c.scope_flag || c.scopeFlag || 'IN_SCOPE',
    scopeWarning: c.scope_warning || c.scopeWarning || null,
    timestamp: c.timestamp,
    timeSeconds: Number(c.time_seconds !== undefined ? c.time_seconds : (c.timeSeconds || 0)),
    text: c.text,
    resolved: !!c.resolved,
    drawings: c.drawings || [],
    createdAt: c.created_at || c.createdAt
  };
}

async function requireReviewOwnership(req, res, next) {
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
    let review = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('client_id, client')
          .eq('id', req.params.id)
          .maybeSingle();
        if (data) review = data;
      } catch (_) {}
    }

    if (!review) {
      review = fallbackReviews.find(r => r.id === req.params.id);
    }
    if (!review) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        review = getMemoryDeliverable(req.params.id);
      } catch (_) {}
    }

    if (!review) return res.status(404).json({ error: 'Review project not found' });
    
    const revClientId = review.client_id || review.clientId;
    const revClientName = (review.client || review.clientName || '').toLowerCase();

    const matchId = revClientId && userLinkedId && String(revClientId).toLowerCase() === String(userLinkedId).toLowerCase();
    const matchName = revClientName && userName && (revClientName.includes(userName) || userName.includes(revClientName));

    if (matchId || matchName || !revClientId) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this review deliverable' });
  }

  next();
}

// GET Review Projects
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

    const isClientUser = req.user && (
      req.user.role === 'Client' || req.user.role === 'client' ||
      req.user.linkedType === 'client' ||
      (req.user.accessLevel && String(req.user.accessLevel).toLowerCase().includes('client'))
    );
    const clientName = req.user.profile?.name || req.user.name || '';
    const clientId = req.user.clientId || req.user.linkedId || req.user.id || '';

    if (isClientUser) {
      if (clientId && clientName) {
        query = query.or(`client_id.eq.${clientId},client.eq.${clientName},client.eq.${clientId}`);
      } else if (clientId) {
        query = query.or(`client_id.eq.${clientId},client.eq.${clientId}`);
      } else if (clientName) {
        query = query.eq('client', clientName);
      } else {
        return res.json([]);
      }
    }

    let { data, error } = await query;
    if (error && error.message && error.message.includes('client_id') && isClientUser && clientName) {
      // Fallback query if client_id column is not yet present on remote DB instance
      const fallback = await supabase.from('reviews').select('*').ilike('client', `%${clientName}%`).order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      console.warn('[Reviews] Supabase query notice, serving local memory store:', error.message);
      return res.json(fallbackReviews.map(mapReview));
    }

    const enrichedData = (data || []).map(r => {
      const local = fallbackReviews.find(fb => fb.id === r.id);
      return local ? { ...local, ...r } : r;
    });

    res.json(enrichedData.map(mapReview));
  } catch (err) {
    console.warn('[Reviews] GET error fallback:', err.message);
    res.json(fallbackReviews.map(mapReview));
  }
});

// GET Single Review Project with Comments
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    let reviewData = null;
    let commentsData = [];

    try {
      const { data, error: rErr } = await supabase.from('reviews').select('*').eq('id', id).single();
      if (!rErr && data) reviewData = data;
      const { data: cData } = await supabase.from('review_comments').select('*').eq('review_id', id).order('created_at', { ascending: true });
      if (cData) commentsData = cData;
    } catch (_) {}

    const fbRev = fallbackReviews.find(r => r.id === id);
    if (fbRev) {
      reviewData = reviewData ? { ...fbRev, ...reviewData } : fbRev;
    }
    if (!reviewData) return res.status(404).json({ error: 'Review project not found' });

    // IDOR security check: If user is a Client, ensure they own this review project
    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    if (isClientUser) {
      const clientName = (req.user.company || req.user.client || req.user.profile?.company || req.user.profile?.name || req.user.name || '').toLowerCase();
      const clientId = req.user.linkedId || req.user.id;
      const reviewClient = (reviewData.client || '').toLowerCase();
      const reviewClientId = reviewData.client_id;

      const isOwner = (reviewClientId && reviewClientId === clientId) || 
                      (clientName && reviewClient.includes(clientName)) || 
                      (clientName && clientName.includes(reviewClient));
      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to access this deliverable' });
      }
    }

    const review = mapReview(reviewData);
    review.comments = (commentsData || []).map(mapComment);

    res.json(review);
  } catch (err) {
    console.error('Review GET ID error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create Review Room Project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `REV-${randomUUID().split('-')[0].toUpperCase()}`;

    const defaultMedia = 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4';
    const deliverableType = req.body.deliverableType || req.body.deliverable_type || (req.body.mediaType || 'staging_url');
    const stagingUrl = req.body.stagingUrl || req.body.staging_url || null;
    const repoUrl = req.body.repoUrl || req.body.repo_url || null;
    const branchName = req.body.branchName || req.body.branch_name || 'main';
    const apiDocsUrl = req.body.apiDocsUrl || req.body.api_docs_url || null;
    const dodChecklist = Array.isArray(req.body.dodChecklist) ? req.body.dodChecklist : (Array.isArray(req.body.dod_checklist) ? req.body.dod_checklist : []);
    const maxRevisions = Number(req.body.maxRevisions || req.body.max_revisions || 2);
    const primaryMedia = stagingUrl || repoUrl || apiDocsUrl || req.body.mediaUrl || req.body.media_url || defaultMedia;

    const payload = {
      id: newId,
      project_id: req.body.projectId || req.body.taskId || newId,
      project_name: req.body.projectName || req.body.title || 'Untitled Deliverable Project',
      client: req.body.client || 'Agency Client',
      client_id: req.body.clientId || req.body.client_id || (req.user?.linkedType === 'client' ? req.user.linkedId : null),
      task_id: req.body.taskId || req.body.task_id || null,
      active_version: req.body.activeVersion || 'v1.0-alpha',
      versions: req.body.versions || ['v1.0-alpha'],
      deliverable_type: deliverableType,
      media_type: deliverableType === 'video' ? 'video' : 'document',
      media_url: primaryMedia,
      staging_url: stagingUrl,
      repo_url: repoUrl,
      branch_name: branchName,
      api_docs_url: apiDocsUrl,
      poster_url: req.body.posterUrl || req.body.poster_url || null,
      resolved_count: 0,
      total_count: 0,
      revision_round: 1,
      max_revisions: maxRevisions,
      dod_checklist: dodChecklist,
      created_at: new Date().toISOString()
    };

    const supabasePayload = {
      id: newId,
      project_id: req.body.projectId || req.body.taskId || newId,
      project_name: req.body.projectName || req.body.title || 'Untitled Deliverable Project',
      client: req.body.client || 'Agency Client',
      client_id: req.body.clientId || req.body.client_id || (req.user?.linkedType === 'client' ? req.user.linkedId : null),
      task_id: req.body.taskId || req.body.task_id || null,
      active_version: req.body.activeVersion || 'v1.0-alpha',
      versions: req.body.versions || ['v1.0-alpha'],
      media_type: deliverableType === 'video' ? 'video' : 'document',
      media_url: primaryMedia,
      poster_url: req.body.posterUrl || req.body.poster_url || null,
      resolved_count: 0,
      total_count: 0,
      created_at: new Date().toISOString()
    };

    fallbackReviews.unshift(payload);

    if (supabase) {
      try {
        await supabase.from('reviews').insert([supabasePayload]);
      } catch (dbErr) {
        console.warn('[Reviews] DB write notice:', dbErr.message);
      }
    }

    const review = mapReview(payload);
    broadcast('review_update', [review]);
    if (review.clientId) {
      broadcastToClient('review_update', [review], [review.clientId]);
    }

    return res.json({ success: true, review });
  } catch (err) {
    console.error('Review POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// POST Upload Asset (image/PDF) to Supabase Storage
router.post('/:id/upload', requireAuth, requireReviewOwnership, upload.single('asset'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.originalname.split('.').pop();
    const filePath = `reviews/${id}/${Date.now()}.${ext}`;
    const contentType = req.file.mimetype;
    const mediaType = contentType.startsWith('video') ? 'video' : contentType.startsWith('image') ? 'image' : 'pdf';

    const { error: uploadError } = await supabase.storage
      .from('review-assets')
      .upload(filePath, req.file.buffer, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('review-assets').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Update review media_url with the new asset
    await supabase.from('reviews').update({
      media_url: publicUrl,
      media_type: mediaType,
      poster_url: mediaType === 'image' ? publicUrl : ''
    }).eq('id', id);

    const { data: updatedReview } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle();
    if (updatedReview) {
      const mapped = mapReview(updatedReview);
      broadcast('review_update', [mapped]);
      if (mapped.clientId) {
        broadcastToClient('review_update', [mapped], [mapped.clientId]);
      }
    }

    res.json({ success: true, url: publicUrl, mediaType });
  } catch (err) {
    console.error('Review Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Add Timecoded Comment to Video Cut or Deliverable
router.post('/:id/comments', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    let review = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('reviews').select('*').eq('id', id).single();
        if (data) review = data;
      } catch (_) {}
    }
    if (!review) {
      review = fallbackReviews.find(r => r.id === id);
    }
    if (!review) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        review = getMemoryDeliverable(id);
      } catch (_) {}
    }
    if (!review) return res.status(404).json({ error: 'Review project not found' });

    const text = req.body.text || '';
    const commentType = req.body.commentType || req.body.comment_type || 'GENERAL';
    const authorPocId = req.body.authorPocId || req.body.author_poc_id || null;
    const assignedTeamMember = req.body.assignedTeamMember || req.body.assigned_team_member || null;

    // Scope check heuristics
    const textLower = text.toLowerCase();
    const outOfScopeKeywords = [
      'legacy data migration',
      'native mobile app',
      'app store submission',
      'ios app',
      'android apk',
      'additional language localization',
      'custom hardware',
      'white glove on-premise'
    ];
    const isExclusion = outOfScopeKeywords.some(kw => textLower.includes(kw));
    const scopeFlag = (commentType === 'OUT_OF_SCOPE' || isExclusion) ? 'OUT_OF_SCOPE_POTENTIAL' : 'IN_SCOPE';
    const scopeWarning = scopeFlag === 'OUT_OF_SCOPE_POTENTIAL' 
      ? '⚠️ Notice: This request appears to fall outside the locked contract scope. A Phase 2 change order may be required.' 
      : null;

    const newComment = {
      id: `CMT-${Date.now()}`,
      review_id: id,
      author: req.user.name || req.body.author || 'Reviewer',
      author_role: req.user.role || req.body.authorRole || 'Client Reviewer',
      author_poc_id: authorPocId,
      assigned_team_member: assignedTeamMember,
      timestamp: req.body.timestamp || '0:05',
      time_seconds: Number(req.body.timeSeconds) || 5,
      text,
      comment_type: isExclusion ? 'OUT_OF_SCOPE' : commentType,
      scope_flag: scopeFlag,
      scope_warning: scopeWarning,
      resolved: false,
      drawings: req.body.drawings || []
    };

    const supabaseComment = {
      id: newComment.id,
      review_id: id,
      author: newComment.author,
      author_role: newComment.author_role,
      timestamp: newComment.timestamp,
      time_seconds: newComment.time_seconds,
      text: newComment.text,
      resolved: false,
      drawings: newComment.drawings,
      replies: [{
        comment_type: newComment.comment_type,
        scope_flag: newComment.scope_flag,
        scope_warning: newComment.scope_warning,
        author_poc_id: newComment.author_poc_id,
        assigned_team_member: newComment.assigned_team_member
      }]
    };

    if (supabase) {
      try {
        await supabase.from('review_comments').insert([supabaseComment]);
        const newTotal = (review.total_count || 0) + 1;
        await supabase.from('reviews').update({ total_count: newTotal }).eq('id', id);
      } catch (_) {}
    }

    review.total_count = (review.total_count || 0) + 1;
    const fbRev = fallbackReviews.find(r => r.id === id);
    if (fbRev) fbRev.total_count = (fbRev.total_count || 0) + 1;

    const comment = mapComment(newComment);
    broadcast('review_comment_update', { reviewId: id, comment });
    const cId = review.client_id || review.clientId;
    if (cId) {
      broadcastToClient('review_comment_update', { reviewId: id, comment }, [cId]);
    }

    res.json({ success: true, comment });
  } catch (err) {
    console.error('Review Comment POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Resolve Comment
router.put('/comments/:commentId/resolve', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const isResolved = req.body.resolved !== undefined ? req.body.resolved : true;

    const { data: commentData, error: cErr } = await supabase.from('review_comments')
      .update({ resolved: isResolved })
      .eq('id', commentId)
      .select().single();
    if (cErr || !commentData) return res.status(404).json({ error: 'Comment not found' });

    const reviewId = commentData.review_id;
    const { data: allComments } = await supabase.from('review_comments').select('resolved').eq('review_id', reviewId);
    const resolvedCount = (allComments || []).filter(c => c.resolved).length;

    await supabase.from('reviews').update({ resolved_count: resolvedCount }).eq('id', reviewId);

    const comment = mapComment(commentData);
    broadcast('review_comment_update', { reviewId, comment });
    const cId = commentData.client_id || commentData.clientId;
    if (cId) {
      broadcastToClient('review_comment_update', { reviewId, comment }, [cId]);
    }

    res.json({ success: true, comment });
  } catch (err) {
    console.error('Comment Resolve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/drawings — Load all drawings for a review video
router.get('/:id/drawings', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('review_drawings').select('*').eq('review_id', id);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Review Drawings GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/drawings — Save drawing at a specific timestamp
router.post('/:id/drawings', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const { timestampSec, drawingData } = req.body;

    await supabase.from('review_drawings').delete()
      .eq('review_id', id)
      .eq('timestamp_sec', timestampSec)
      .eq('author', req.user.name);

    const payload = {
      review_id: id,
      timestamp_sec: timestampSec,
      drawing_data: drawingData,
      author: req.user.name
    };

    const { data, error } = await supabase.from('review_drawings').insert([payload]).select().single();
    if (error) throw error;

    broadcast('drawing_update', { reviewId: id, drawing: data });
    res.json({ success: true, drawing: data });
  } catch (err) {
    console.error('Review Drawings POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/approve — 1-Tap Cut Approval via In-Chat MiniApp or External Webhook
router.post('/approve', requireAuth, async (req, res, next) => {
  const reviewId = req.body.reviewId || req.body.id;
  if (!reviewId) return res.status(400).json({ ok: false, error: 'reviewId is required in body' });
  req.params.id = reviewId;
  next();
}, requireReviewOwnership, async (req, res) => {
  return handleReviewApproveInternal(req, res);
});

// POST /:id/approve — Client formal sign-off (cascades to project completion + 30-day warranty)
router.post('/:id/approve', requireAuth, requireReviewOwnership, async (req, res) => {
  return handleReviewApproveInternal(req, res);
});

async function handleReviewApproveInternal(req, res) {

  try {
    const { id } = req.params;
    let reviewData = null;
    try {
      const res = await supabase.from('reviews').select('*').eq('id', id).single();
      if (res.data) reviewData = res.data;
    } catch (_) {}

    if (!reviewData) {
      reviewData = fallbackReviews.find(r => r.id === id);
    }
    if (!reviewData) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        reviewData = getMemoryDeliverable(id);
      } catch (_) {}
    }
    if (!reviewData) return res.status(404).json({ error: 'Review project not found' });

    const fbRev = fallbackReviews.find(r => r.id === id);
    if (fbRev) {
      reviewData = { ...fbRev, ...reviewData };
    }

    const approverName = req.body.approvedBy || req.body.approverName || req.user?.name || 'Client Partner';
    const taskId = reviewData.project_id || id;
    const projectId = reviewData.project_id;
    const approvedAt = new Date().toISOString();
    const warrantyUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    reviewData.approved_by = approverName;
    reviewData.approved_at = approvedAt;
    reviewData.invoice_released = true;

    // Add formal approval comment into review_comments
    const approvalComment = {
      id: `CMT-APP-${Date.now()}`,
      review_id: id,
      author: approverName,
      author_role: req.user?.role || 'Client Partner',
      timestamp: '0:00',
      time_seconds: 0,
      text: '✅ Deliverable Approved by Client (Handover & 30-Day Warranty Activated)',
      resolved: true,
      drawings: []
    };
    await supabase.from('review_comments').insert([approvalComment]).then(null, () => {});

    // Persist formal approval to reviews table
    await Promise.resolve(supabase.from('reviews').update({
      approved_by: approverName,
      approved_at: approvedAt,
      invoice_released: true
    }).eq('id', id)).catch(() => {});

    // Cascade: advance linked project to 'Completed', 'APPROVED', and set warranty
    if (projectId) {
      await Promise.resolve(supabase.from('projects').update({
        status: 'Completed',
        delivery_status: 'APPROVED',
        warranty_until: warrantyUntil,
        updated_at: approvedAt
      }).eq('id', projectId)).catch(() => {});

      try {
        const { readDB, writeDB } = require('../services/db');
        const db = await readDB();
        const pIdx = (db.projects || []).findIndex(p => p.id === projectId);
        if (pIdx !== -1) {
          db.projects[pIdx].status = 'Completed';
          db.projects[pIdx].delivery_status = 'APPROVED';
          db.projects[pIdx].warranty_until = warrantyUntil;
          try { writeDB(db); } catch (_) {}
        }
      } catch (_) {}

      try {
        const { memoryProjects } = require('../services/post-delivery');
        if (memoryProjects && memoryProjects.has(projectId)) {
          const memP = memoryProjects.get(projectId);
          memP.status = 'Completed';
          memP.delivery_status = 'APPROVED';
          memP.warranty_until = warrantyUntil;
          memP.warrantyUntil = warrantyUntil;
        }
      } catch (_) {}
    }

    // Cascade: advance linked Kanban task to 'Approved'
    if (taskId) {
      await Promise.resolve(supabase.from('tasks').update({
        stage: 'Approved',
        qc_approved_by: approverName,
        qc_approved_at: approvedAt,
        updated_at: approvedAt
      }).eq('id', taskId)).catch(() => {});

      const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const mappedTasks = (allTasks || []).map(mapTask);
      if (mappedTasks.length > 0) {
        const linkedTask = mappedTasks.find(t => t.id === taskId);
        const empCode = linkedTask?.assigneeId || linkedTask?.assignee;
        if (empCode && empCode !== 'Unassigned') {
          broadcastToEmployee('task_update', [linkedTask], [empCode]);
        }
        broadcast('task_update', mappedTasks);
      }
    }

    // Trigger Cross-Engine Automation Webhook/Event
    try {
      const { processAutomationEvent } = require('./automation');
      if (typeof processAutomationEvent === 'function') {
        await processAutomationEvent('review_approved', {
          reviewId: id,
          projectName: reviewData.project_name,
          client: reviewData.client,
          clientId: reviewData.client_id,
          taskId,
          projectId,
          approvedBy: approverName,
          warrantyUntil
        });
      }
    } catch (autoErr) {
      console.warn('[Automation] Error firing review_approved event:', autoErr.message);
    }

    const mapped = mapReview({
      ...reviewData,
      status: 'approved',
      isApproved: true,
      approvedBy: approverName,
      approvedAt
    });

    broadcast('review_update', [mapped]);
    if (reviewData.client_id) {
      broadcastToClient('review_update', [mapped], [reviewData.client_id]);
    }

    let linkedProject = null;
    try {
      const { sendWarrantyActivatedNotification, sendTeamWarrantyAlert } = require('../services/bot/notifications');
      const { findProject } = require('../services/post-delivery');
      linkedProject = projectId ? await findProject(projectId).catch(() => null) : null;
      if (!linkedProject) {
        linkedProject = {
          id: projectId || id,
          name: reviewData.project_name || 'AI Sprint Solution',
          client_name: reviewData.client,
          client_telegram_id: reviewData.client_telegram_id || null,
          warranty_until: warrantyUntil
        };
      }
      sendWarrantyActivatedNotification(linkedProject, {
        ...reviewData,
        approvedBy: approverName,
        warrantyUntil
      });
      sendTeamWarrantyAlert(linkedProject, {
        ...reviewData,
        approvedBy: approverName,
        warrantyUntil
      });
    } catch (notifErr) {
      console.warn('[Review Approval Telegram Alert Note]:', notifErr.message);
    }

    let milestoneInvoice = null;
    try {
      const { createInvoiceRecord } = require('./invoices');
      const invoiceProjName = reviewData.project_name || linkedProject?.name || 'AI Solution Sprint (Milestone 2 Handover)';
      const invoiceAmount = Number(linkedProject?.budget) > 0 ? Math.round(Number(linkedProject.budget) / 2) : 25000;
      milestoneInvoice = await createInvoiceRecord({
        clientId: reviewData.client_id || linkedProject?.client_id || null,
        clientName: reviewData.client || linkedProject?.client || linkedProject?.client_name || 'Agency Client',
        projectName: `${invoiceProjName} - Milestone 2 (Handover & Acceptance)`,
        projectRef: projectId || id,
        amount: invoiceAmount,
        currency: 'BDT',
        invoiceType: 'milestone_completion',
        settlementRail: 'bdt_bank_wire',
        taxRate: 5,
        notes: `Milestone 2 Completion Invoice — Formally authorized upon deliverable acceptance for ${invoiceProjName}. Activates 30-Day Zero-Cost Bug-Fix Warranty Shield and final IP Handover. [rail:bdt_bank_wire] [type:milestone_completion]`
      });
    } catch (invErr) {
      console.warn('[Milestone Invoice Auto-Creation Note]:', invErr.message);
    }

    const finalInvoiceId = milestoneInvoice?.id || ('INV-' + id.replace('REV-', ''));

    // Generate or seed Formal Handover & IP Transfer Manifest
    let handoverManifest = null;
    try {
      const { getOrCreateHandoverManifest, startWarrantyClock } = require('../services/post-delivery');
      if (projectId) {
        await startWarrantyClock(projectId, 30);
        handoverManifest = await getOrCreateHandoverManifest(projectId).catch(() => null);
      }
    } catch (manErr) {
      console.warn('[Handover Manifest Auto-Creation Note]:', manErr.message);
    }

    // Broadcast warranty_update and handover_update via SSE
    try {
      const { broadcast, broadcastToClient } = require('../services/sse');
      const warrantyPayload = {
        projectId,
        warrantyUntil,
        warrantyDays: 30,
        isActive: true,
        approvedBy: approverName,
        reviewId: id
      };
      broadcast('warranty_update', warrantyPayload);
      broadcast('handover_update', { projectId, manifestId: handoverManifest?.manifestId });
      if (reviewData.client_id) {
        broadcastToClient('warranty_update', warrantyPayload, [reviewData.client_id]);
        broadcastToClient('handover_update', { projectId, manifestId: handoverManifest?.manifestId }, [reviewData.client_id]);
      }
    } catch (_) {}

    res.json({
      success: true,
      review: mapped,
      projectId,
      warrantyUntil,
      warranty: {
        warrantyEndsAt: warrantyUntil,
        warrantyDays: 30
      },
      invoiceId: finalInvoiceId,
      milestoneInvoice: milestoneInvoice || null,
      milestoneInvoiceReleased: true,
      handoverManifest: handoverManifest || null,
      handoverManifestId: handoverManifest?.manifestId || null
    });
  } catch (err) {
    console.error('Review Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// POST /:id/request-revisions — Client formal revision request (enforces max_revisions limit)
router.post('/:id/request-revisions', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, notes } = req.body;
    const requesterName = req.body.requesterName || req.user?.name || 'Client Partner';
    const revisionText = feedback || notes || 'Revisions requested.';

    let reviewData = null;
    try {
      const res = await supabase.from('reviews').select('*').eq('id', id).single();
      if (res.data) reviewData = res.data;
    } catch (_) {}

    if (!reviewData) {
      reviewData = fallbackReviews.find(r => r.id === id);
    }
    if (!reviewData) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        reviewData = getMemoryDeliverable(id);
      } catch (_) {}
    }
    if (!reviewData) return res.status(404).json({ error: 'Review project not found' });

    const fbRev = fallbackReviews.find(r => r.id === id);
    if (fbRev) {
      reviewData = { ...fbRev, ...reviewData };
    }

    const currentRound = Number(reviewData.revision_round) || 1;
    const maxRounds = Number(reviewData.max_revisions) || 2;

    if (currentRound >= maxRounds) {
      try {
        const { sendTelegramNotification } = require('../services/bot/notifications');
        const ownerId = process.env.TELEGRAM_OWNER_CHAT_ID || '7754769807';
        const msg = `⚠️ *SCOPE LIMIT REACHED — Round ${currentRound}/${maxRounds} Exhausted*\n\n` +
          `Project: *${reviewData.project_name || 'Sprint Project'}* (${reviewData.client || 'Client'})\n` +
          `Requested by: *${requesterName}*\n` +
          `Notes: "${revisionText}"\n\n` +
          `📌 *Status:* Additional revisions blocked. Scope Change Order Addendum required.`;
        sendTelegramNotification(ownerId, msg, [[{ text: '📋 View in Change Order Studio', url: 'https://gro10x-ai.vercel.app/app#engines' }]]);
      } catch (_) {}

      return res.status(400).json({
        ok: false,
        success: false,
        error: `Revision limit reached (${currentRound}/${maxRounds} rounds used). Additional revisions require a formal Phase 2 Add-On.`,
        requiresChangeOrder: true,
        currentRound,
        maxRounds
      });
    }

    const nextRound = currentRound + 1;
    const nextVersion = `v1.${nextRound - 1}-rc`;
    const updatedVersions = Array.isArray(reviewData.versions) ? [...reviewData.versions] : ['v1.0-alpha'];
    if (!updatedVersions.includes(nextVersion)) updatedVersions.push(nextVersion);

    const taskId = reviewData.project_id || id;
    reviewData.revision_round = nextRound;
    reviewData.active_version = nextVersion;
    reviewData.versions = updatedVersions;
    if (fbRev) {
      fbRev.revision_round = nextRound;
      fbRev.active_version = nextVersion;
      fbRev.versions = updatedVersions;
    }
    reviewData.revision_requested_by = requesterName;
    reviewData.revision_notes = revisionText;
    reviewData.revision_requested_at = new Date().toISOString();

    // Add revision request comment into review_comments
    const revisionComment = {
      id: `CMT-REV-${Date.now()}`,
      review_id: id,
      author: requesterName,
      author_role: req.user?.role || 'Client Partner',
      timestamp: '0:00',
      time_seconds: 0,
      text: `✏️ Revision Round ${nextRound} Requested: ${revisionText}`,
      resolved: false,
      drawings: []
    };
    await supabase.from('review_comments').insert([revisionComment]).then(null, () => {});

    // Persist revision request to reviews table
    await Promise.resolve(supabase.from('reviews').update({
      revision_round: nextRound,
      active_version: nextVersion,
      versions: updatedVersions,
      revision_requested_by: requesterName,
      revision_notes: revisionText,
      revision_requested_at: new Date().toISOString()
    }).eq('id', id)).catch(() => {});

    // Cascade: move linked task back to 'Editing' with feedback
    if (taskId) {
      await Promise.resolve(supabase.from('tasks').update({
        stage: 'Editing',
        qc_rejected_by: requesterName,
        qc_feedback: revisionText,
        qc_rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', taskId)).catch(() => {});

      const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const mappedTasks = (allTasks || []).map(mapTask);
      if (mappedTasks.length > 0) {
        const linkedTask = mappedTasks.find(t => t.id === taskId);
        const empCode = linkedTask?.assigneeId || linkedTask?.assignee;
        if (empCode && empCode !== 'Unassigned') {
          broadcastToEmployee('task_update', [linkedTask], [empCode]);
        }
        broadcast('task_update', mappedTasks);
      }

      // Fire automation event for production team alert
      try {
        const { processAutomationEvent } = require('../services/automation');
        await processAutomationEvent('review_revision_requested', {
          reviewId: id,
          taskId: taskId,
          projectName: reviewData.project_name,
          clientName: reviewData.client,
          revisionNotes: revisionText,
          requestedBy: requesterName
        }, { clients: [], team: [], tasks: mappedTasks }, () => {}, broadcast);
      } catch (autoErr) {
        console.warn('Automation event failed (non-fatal):', autoErr.message);
      }
    }

    // Dispatch instant Telegram notification to Creative Specialist & Team Group
    try {
      const { sendTelegramNotification } = require('../services/bot/notifications');
      const alertChatId = process.env.TELEGRAM_TEAM_GROUP_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.OWNER_TELEGRAM_ID || '7754769807';
      const roundNum = reviewData.revisions_used || 1;
      const msg = `✂️ *Client Deliverable Revision Requested (Round ${roundNum})*\n\n` +
        `• Project: *${reviewData.project_name || 'Deliverable'}* (${reviewData.client || 'Client'})\n` +
        `• Requested by: *${requesterName}*\n` +
        `• Version: \`${reviewData.version || 'v1.0'}\`\n` +
        `• Notes: _"${revisionText}"_\n\n` +
        `_Action: Open task board and implement revision feedback._`;
      const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
      sendTelegramNotification(alertChatId, msg, [[{ text: '🎬 Open Review Room', url: `${baseUrl}/app#reviews` }]], true);
    } catch (_) {}

    const mapped = {
      ...mapReview(reviewData),
      status: 'revision_requested',
      isApproved: false,
      revisionRequestedBy: requesterName,
      revisionNotes: revisionText,
      revisionRequestedAt: new Date().toISOString()
    };

    broadcast('review_update', [mapped]);
    try {
      broadcast('review_revision_requested', {
        reviewId: id,
        projectName: reviewData.project_name,
        clientName: reviewData.client,
        revisionNotes: revisionText,
        requestedBy: requesterName,
        requestedAt: mapped.revisionRequestedAt
      });
    } catch (_) {}
    if (mapped.clientId) {
      broadcastToClient('review_update', [mapped], [mapped.clientId]);
    }
    res.json({ success: true, review: mapped });
  } catch (err) {
    console.error('Review Request Revisions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Deliverable Side-by-Side Version Comparison
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/compare', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    let reviewData = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle();
        if (data) reviewData = data;
      } catch (_) {}
    }
    if (!reviewData) reviewData = fallbackReviews.find(r => r.id === id);
    if (!reviewData) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        reviewData = getMemoryDeliverable(id);
      } catch (_) {}
    }
    if (!reviewData) return res.status(404).json({ ok: false, error: 'Review deliverable not found' });

    const versions = Array.isArray(reviewData.versions) && reviewData.versions.length > 0
      ? reviewData.versions
      : ['v1', 'v2'];
    const activeVersion = reviewData.active_version || versions[versions.length - 1];
    const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

    return res.json({
      ok: true,
      success: true,
      reviewId: id,
      projectName: reviewData.project_name || 'AI Solution Sprint Cut',
      client: reviewData.client,
      activeVersion,
      previousVersion,
      versions,
      mediaUrl: reviewData.media_url,
      revisionRound: Number(reviewData.revision_round) || 1,
      revisionNotes: reviewData.revision_notes || null,
      resolvedCount: Number(reviewData.resolved_count) || 0,
      totalCount: Number(reviewData.total_count) || 0,
      isApproved: Boolean(reviewData.approved_at || reviewData.is_approved),
      comparisonMode: 'side_by_side_synchronized'
    });
  } catch (err) {
    console.error('Review compare GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Automated Post-Acceptance NPS & Testimonial Harvest
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/feedback', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      csatRating = 5,
      npsScore = 10,
      reviewText = 'Exceptional velocity and engineering execution.',
      consentShowcase = true,
      videoUrl = null
    } = req.body;

    let reviewData = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle();
        if (data) reviewData = data;
      } catch (_) {}
    }
    if (!reviewData) reviewData = fallbackReviews.find(r => r.id === id);
    if (!reviewData) {
      try {
        const { getMemoryDeliverable } = require('../services/delivery-review');
        reviewData = getMemoryDeliverable(id);
      } catch (_) {}
    }
    if (!reviewData) return res.status(404).json({ ok: false, error: 'Review deliverable not found' });

    const projectId = reviewData.project_id || id;
    const { submitProjectTestimonial } = require('../services/post-delivery');

    const testimonial = await submitProjectTestimonial(projectId, {
      csatRating: Number(csatRating),
      npsScore: Number(npsScore),
      reviewText,
      clientDisplayName: req.user?.name || reviewData.client || 'Enterprise Client',
      clientRole: req.user?.role || 'Managing Director',
      clientCompany: req.user?.company || reviewData.client || 'Enterprise Partner',
      consentShowcase: Boolean(consentShowcase),
      videoUrl
    });

    return res.status(201).json({
      ok: true,
      success: true,
      reviewId: id,
      projectId,
      testimonial,
      isFeaturedTestimonial: Number(npsScore) >= 9 && Boolean(consentShowcase)
    });
  } catch (err) {
    console.error('Review feedback POST error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Public Showcase Testimonials
// ─────────────────────────────────────────────────────────────────────────────
router.get('/testimonials/showcase', async (req, res) => {
  try {
    const { getPublicTestimonials } = require('../services/post-delivery');
    const testimonials = await getPublicTestimonials();
    return res.json({
      ok: true,
      success: true,
      count: testimonials.length,
      testimonials
    });
  } catch (err) {
    console.error('Testimonials showcase GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
module.exports.fallbackReviews = fallbackReviews;

