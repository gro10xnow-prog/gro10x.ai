const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapReview(r) {
  if (!r) return null;
  return {
    id: r.id,
    projectId: r.project_id,
    projectName: r.project_name,
    client: r.client,
    activeVersion: r.active_version,
    versions: r.versions || ['v1'],
    mediaType: r.media_type,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url,
    resolvedCount: r.resolved_count || 0,
    totalCount: r.total_count || 0,
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

    if (req.user.linkedType === 'client' && req.user.linkedId) {
      query = query.ilike('client', `%${req.user.name}%`);
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

module.exports = router;
