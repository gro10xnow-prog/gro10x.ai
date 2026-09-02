const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast, broadcastToClient } = require('../services/sse');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function mapReview(r) {
  if (!r) return null;
  const totalCount = r.total_count || 0;
  const resolvedCount = r.resolved_count || 0;
  const isApproved = !!r.approved_at;
  const isRevisionRequested = !!r.revision_requested_at && !isApproved;
  return {
    id: r.id,
    projectId: r.project_id,
    projectName: r.project_name,
    client: r.client,
    clientName: r.client,           // Explicit alias so SPA doesn't guess
    clientId: r.client_id || null,
    taskId: r.task_id || null,
    activeVersion: r.active_version,
    versions: r.versions || ['v1'],
    mediaType: r.media_type,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url,
    resolvedCount,
    totalCount,
    unresolvedCount: Math.max(0, totalCount - resolvedCount),
    approvedBy: r.approved_by || null,
    approvedAt: r.approved_at || null,
    revisionRequestedBy: r.revision_requested_by || null,
    revisionNotes: r.revision_notes || null,
    revisionRequestedAt: r.revision_requested_at || null,
    status: isApproved ? 'approved' : isRevisionRequested ? 'revision_requested' : 'pending',
    isApproved,
    createdAt: r.created_at
  };
}

function mapComment(c) {
  if (!c) return null;
  return {
    id: c.id,
    reviewId: c.review_id,
    author: c.author,
    authorRole: c.author_role,
    timestamp: c.timestamp,
    timeSeconds: Number(c.time_seconds) || 0,
    text: c.text,
    resolved: !!c.resolved,
    drawings: c.drawings || [],
    createdAt: c.created_at
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
    if (isSupabaseConfigured()) {
      const { data: review } = await supabase
        .from('reviews')
        .select('client_id, client')
        .eq('id', req.params.id)
        .maybeSingle();

      if (!review) return res.status(404).json({ error: 'Review project not found' });
      
      const revClientId = review.client_id;
      const revClientName = (review.client || '').toLowerCase();

      const matchId = revClientId && userLinkedId && String(revClientId).toLowerCase() === String(userLinkedId).toLowerCase();
      const matchName = revClientName && userName && (revClientName.includes(userName) || userName.includes(revClientName));

      if (matchId || matchName || !revClientId) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this review deliverable' });
    }
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
    if (error) throw error;

    res.json((data || []).map(mapReview));
  } catch (err) {
    console.error('Reviews GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Single Review Project with Comments
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reviewData, error: rErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (rErr || !reviewData) return res.status(404).json({ error: 'Review project not found' });

    // IDOR security check: If user is a Client, ensure they own this review project
    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    if (isClientUser) {
      const clientName = (req.user.profile?.name || req.user.name || '').toLowerCase();
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

    const { data: commentsData } = await supabase.from('review_comments').select('*').eq('review_id', id).order('created_at', { ascending: true });

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
    const payload = {
      id: newId,
      project_id: req.body.projectId || req.body.taskId || newId,
      project_name: req.body.projectName || req.body.title || 'Untitled Creative Project',
      client: req.body.client || 'Agency Client',
      client_id: req.body.clientId || req.body.client_id || (req.user?.linkedType === 'client' ? req.user.linkedId : null),
      task_id: req.body.taskId || req.body.task_id || null,
      active_version: req.body.activeVersion || 'v1',
      versions: req.body.versions || ['v1'],
      media_type: req.body.mediaType || req.body.media_type || 'video',
      media_url: req.body.mediaUrl || req.body.media_url || defaultMedia,
      poster_url: req.body.posterUrl || req.body.poster_url || null,
      resolved_count: 0,
      total_count: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('reviews').insert([payload]).select().single();
    if (error) throw error;

    const review = mapReview(data);
    const { data: allReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    broadcast('review_update', (allReviews || []).map(mapReview));
    if (review.clientId) {
      broadcastToClient('review_update', [review], [review.clientId]);
    }

    res.json({ success: true, review });
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

// POST Add Timecoded Comment to Video Cut
router.post('/:id/comments', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: review } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (!review) return res.status(404).json({ error: 'Review project not found' });

    const newComment = {
      id: `CMT-${Date.now()}`,
      review_id: id,
      author: req.user.name || req.body.author || 'Reviewer',
      author_role: req.user.role || req.body.authorRole || 'Client Reviewer',
      timestamp: req.body.timestamp || '0:05',
      time_seconds: Number(req.body.timeSeconds) || 5,
      text: req.body.text || '',
      resolved: false,
      drawings: req.body.drawings || []
    };

    const { data: insertedComment, error: cErr } = await supabase.from('review_comments').insert([newComment]).select().single();
    if (cErr) throw cErr;

    const newTotal = (review.total_count || 0) + 1;
    await supabase.from('reviews').update({ total_count: newTotal }).eq('id', id);

    const comment = mapComment(insertedComment);
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

// POST /:id/approve — Client formal sign-off (cascades to task stage + automation)
router.post('/:id/approve', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: reviewData, error: fetchErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (fetchErr || !reviewData) return res.status(404).json({ error: 'Review project not found' });

    const approverName = req.user?.name || 'Client Partner';
    const taskId = reviewData.project_id || id;

    // Add formal approval comment into review_comments
    const approvalComment = {
      id: `CMT-APP-${Date.now()}`,
      review_id: id,
      author: approverName,
      author_role: req.user?.role || 'Client Partner',
      timestamp: '0:00',
      time_seconds: 0,
      text: '✅ Deliverable Approved by Client',
      resolved: true,
      drawings: []
    };
    await supabase.from('review_comments').insert([approvalComment]).then(null, () => {});

    // Persist formal approval to reviews table
    await Promise.resolve(supabase.from('reviews').update({
      approved_by: approverName,
      approved_at: new Date().toISOString()
    }).eq('id', id)).catch(() => {});

    // Cascade: advance linked Kanban task to 'Approved'
    if (taskId) {
      await Promise.resolve(supabase.from('tasks').update({
        stage: 'Approved',
        qc_approved_by: approverName,
        qc_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', taskId)).catch(() => {});

      const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (allTasks) broadcast('task_update', allTasks);

      // Fire automation event
      try {
        const { processAutomationEvent } = require('../services/automation');
        const dbSnapshot = { clients: [], team: [], tasks: allTasks || [] };
        await processAutomationEvent('review_approved', {
          reviewId: id,
          taskId: taskId,
          projectName: reviewData.project_name,
          clientName: reviewData.client,
          approvedBy: approverName
        }, dbSnapshot, () => {}, broadcast);
      } catch (autoErr) {
        console.warn('Automation event failed (non-fatal):', autoErr.message);
      }
    }

    const mapped = {
      ...mapReview(reviewData),
      status: 'approved',
      isApproved: true,
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };

    broadcast('review_update', [mapped]);
    if (mapped.clientId) {
      broadcastToClient('review_update', [mapped], [mapped.clientId]);
    }
    res.json({ success: true, review: mapped });
  } catch (err) {
    console.error('Review Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/request-revisions — Client formal revision request
router.post('/:id/request-revisions', requireAuth, requireReviewOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, notes } = req.body;
    const requesterName = req.user?.name || 'Client Partner';
    const revisionText = feedback || notes || 'Revisions requested.';

    const { data: reviewData, error: fetchErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (fetchErr || !reviewData) return res.status(404).json({ error: 'Review project not found' });

    const taskId = reviewData.project_id || id;

    // Add revision request comment into review_comments
    const revisionComment = {
      id: `CMT-REV-${Date.now()}`,
      review_id: id,
      author: requesterName,
      author_role: req.user?.role || 'Client Partner',
      timestamp: '0:00',
      time_seconds: 0,
      text: `✏️ Revision Requested: ${revisionText}`,
      resolved: false,
      drawings: []
    };
    await supabase.from('review_comments').insert([revisionComment]).then(null, () => {});

    // Persist revision request to reviews table
    await Promise.resolve(supabase.from('reviews').update({
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
      if (allTasks) broadcast('task_update', allTasks);

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
        }, { clients: [], team: [], tasks: allTasks || [] }, () => {}, broadcast);
      } catch (autoErr) {
        console.warn('Automation event failed (non-fatal):', autoErr.message);
      }
    }

    const mapped = {
      ...mapReview(reviewData),
      status: 'revision_requested',
      isApproved: false,
      revisionRequestedBy: requesterName,
      revisionNotes: revisionText,
      revisionRequestedAt: new Date().toISOString()
    };

    broadcast('review_update', [mapped]);
    if (mapped.clientId) {
      broadcastToClient('review_update', [mapped], [mapped.clientId]);
    }
    res.json({ success: true, review: mapped });
  } catch (err) {
    console.error('Review Request Revisions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
