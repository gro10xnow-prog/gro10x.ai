const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
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

// GET Review Projects
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    if (isClientUser) {
      const linkedId = req.user.linkedId || req.user.id;
      query = query.or(`client_id.eq.${linkedId},client.ilike.%${req.user.name || ''}%`);
    }

    const { data, error } = await query;
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

    const payload = {
      id: newId,
      project_id: req.body.projectId || req.body.taskId || newId,
      project_name: req.body.projectName || req.body.title || 'Untitled Creative Project',
      client: req.body.client || 'Agency Client',
      client_id: req.body.clientId || null,
      task_id: req.body.taskId || null,
      active_version: req.body.activeVersion || 'v1',
      versions: req.body.versions || ['v1'],
      media_type: req.body.mediaType || req.body.media_type || 'video',
      media_url: req.body.mediaUrl || req.body.media_url || '',
      poster_url: req.body.posterUrl || req.body.poster_url || '',
      resolved_count: 0,
      total_count: 0
    };

    const { data, error } = await supabase.from('reviews').insert([payload]).select().single();
    if (error) throw error;

    const review = mapReview(data);
    const { data: allReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    broadcast('review_update', (allReviews || []).map(mapReview));

    res.json({ success: true, review });
  } catch (err) {
    console.error('Review POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Upload Asset (image/PDF) to Supabase Storage
router.post('/:id/upload', requireAuth, upload.single('asset'), async (req, res) => {
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

    const { data: updatedReview } = await supabase.from('reviews').select('*').eq('id', id).single();
    broadcast('review_update', [mapReview(updatedReview)]);

    res.json({ success: true, url: publicUrl, mediaType });
  } catch (err) {
    console.error('Review Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Add Timecoded Comment to Video Cut
router.post('/:id/comments', requireAuth, async (req, res) => {
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
    broadcast('comment_update', { reviewId: id, comment });

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
    broadcast('comment_update', { reviewId, comment });

    res.json({ success: true, comment });
  } catch (err) {
    console.error('Comment Resolve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/drawings — Load all drawings for a review video
router.get('/:id/drawings', requireAuth, async (req, res) => {
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
router.post('/:id/drawings', requireAuth, async (req, res) => {
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
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: reviewData, error: fetchErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    const updates = {
      approved_by: req.user.name || 'Client',
      approved_at: new Date().toISOString(),
      revision_requested_at: null,
      revision_notes: null
    };

    const { data, error } = await supabase.from('reviews').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Cascade: advance linked Kanban task to 'Approved'
    let invoiceId = null;
    if (reviewData.task_id) {
      await supabase.from('tasks').update({
        stage: 'Approved',
        custom_status: 'Approved',
        updated_at: new Date().toISOString()
      }).eq('id', reviewData.task_id);

      // Broadcast Kanban update
      const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      broadcast('task_update', allTasks || []);

      // Fire automation event
      try {
        const { processAutomationEvent } = require('../services/automation');
        const dbSnapshot = { clients: [], team: [], tasks: allTasks || [] };
        await processAutomationEvent('review_approved', {
          reviewId: id,
          taskId: reviewData.task_id,
          projectName: reviewData.project_name,
          clientName: reviewData.client,
          approvedBy: req.user.name
        }, dbSnapshot, () => {}, broadcast);
      } catch (autoErr) {
        console.warn('Automation event failed (non-fatal):', autoErr.message);
      }
    }

    broadcast('review_update', [mapReview(data)]);
    res.json({ success: true, review: mapReview(data), invoiceId });
  } catch (err) {
    console.error('Review Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/request-revisions — Client formal revision request
router.post('/:id/request-revisions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, notes } = req.body;

    const updates = {
      revision_requested_by: req.user.name || 'Client',
      revision_notes: feedback || notes || 'Revisions requested.',
      revision_requested_at: new Date().toISOString(),
      approved_at: null,
      approved_by: null
    };

    const { data: reviewData, error: fetchErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    const { data, error } = await supabase.from('reviews').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Fire automation event for production team alert
    try {
      const { processAutomationEvent } = require('../services/automation');
      await processAutomationEvent('review_revision_requested', {
        reviewId: id,
        taskId: reviewData.task_id,
        projectName: reviewData.project_name,
        clientName: reviewData.client,
        revisionNotes: updates.revision_notes,
        requestedBy: req.user.name
      }, { clients: [], team: [], tasks: [] }, () => {}, broadcast);
    } catch (autoErr) {
      console.warn('Automation event failed (non-fatal):', autoErr.message);
    }

    broadcast('review_update', [mapReview(data)]);
    res.json({ success: true, review: mapReview(data) });
  } catch (err) {
    console.error('Review Request Revisions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// POST Create Review Room Video Cut
router.post('/', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    const countNum = (count || 0) + 1;
    const newId = `REV-${String(countNum).padStart(3, '0')}`;

    const payload = {
      id: newId,
      project_id: req.body.projectId || `PRJ-${countNum}`,
      project_name: req.body.projectName || 'Untitled Video Cut',
      client: req.body.client || 'Agency Client',
      active_version: req.body.activeVersion || 'v1',
      versions: req.body.versions || ['v1'],
      media_type: req.body.mediaType || 'video',
      media_url: req.body.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      poster_url: req.body.posterUrl || '',
      resolved_count: 0,
      total_count: 0
    };

    const { data, error } = await supabase.from('reviews').insert([payload]).select().single();
    if (error) throw error;

    const review = mapReview(data);
    const { data: allReviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    broadcast('review_update', (allReviews || []).map(mapReview));

    res.json({ success: true, review });
  } catch (err) {
    console.error('Review POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Add Timecoded Comment to Video Cut
router.post('/:id/comments', requireAuth, async (req, res) => {
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
      time_seconds: req.body.timeSeconds || 5,
      text: req.body.text || '',
      resolved: false,
      drawings: req.body.drawings || []
    };

    const { data: insertedComment, error: cErr } = await supabase.from('review_comments').insert([newComment]).select().single();
    if (cErr) throw cErr;

    const newTotal = (review.total_count || 0) + 1;
    await supabase.from('reviews').update({ total_count: newTotal }).eq('id', id);

    const comment = mapComment(insertedComment);
    broadcast('comment_update', { reviewId: id, comment });

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

    // Recalculate resolved count for parent review
    const reviewId = commentData.review_id;
    const { data: allComments } = await supabase.from('review_comments').select('resolved').eq('review_id', reviewId);
    const resolvedCount = (allComments || []).filter(c => c.resolved).length;

    await supabase.from('reviews').update({ resolved_count: resolvedCount }).eq('id', reviewId);

    const comment = mapComment(commentData);
    broadcast('comment_update', { reviewId, comment });

    res.json({ success: true, comment });
  } catch (err) {
    console.error('Comment Resolve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/drawings — Load all drawings for a review video
router.get('/:id/drawings', requireAuth, async (req, res) => {
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
router.post('/:id/drawings', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { timestampSec, drawingData } = req.body;
    
    const payload = {
      review_id: id,
      timestamp_sec: timestampSec,
      drawing_data: drawingData,
      author: req.user.name
    };

    // Note: We might want to overwrite existing drawings at exact timestamp, or append.
    // Let's just insert new ones for now, UI will render all overlapping.
    // We could optionally delete existing for this timestamp by this author before inserting.
    await supabase.from('review_drawings').delete()
      .eq('review_id', id)
      .eq('timestamp_sec', timestampSec)
      .eq('author', req.user.name);

    const { data, error } = await supabase.from('review_drawings').insert([payload]).select().single();
    if (error) throw error;

    broadcast('drawing_update', { reviewId: id, drawing: data });
    res.json({ success: true, drawing: data });
  } catch (err) {
    console.error('Review Drawings POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/approve — Client formal sign-off
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: reviewData, error: fetchErr } = await supabase.from('reviews').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    const updates = {
      approved_by: req.user.name,
      approved_at: new Date().toISOString()
    };
    
    // Auto-release invoice logic (mock)
    // Here you would trigger automation to mark the linked project/invoice as ready for payment
    // updates.invoice_released = true;
    
    const { data, error } = await supabase.from('reviews').update(updates).eq('id', id).select().single();
    if (error) throw error;

    res.json({ success: true, review: data });
  } catch (err) {
    console.error('Review Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
