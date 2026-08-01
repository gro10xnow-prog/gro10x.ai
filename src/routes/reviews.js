const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');

// GET Review Projects (Client sees only their own client reviews)
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  let reviews = db.reviews || [];

  if (req.user.linkedType === 'client' && req.user.linkedId) {
    const clientNameLower = (req.user.name || '').toLowerCase();
    reviews = reviews.filter(r => r.clientId === req.user.linkedId || (r.client || '').toLowerCase().includes(clientNameLower));
  }

  res.json(reviews);
});

// GET Single Review Project
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const review = (db.reviews || []).find(r => r.id === id);
  if (!review) return res.status(404).json({ error: 'Review project not found' });

  const comments = (db.reviewComments || []).filter(c => c.reviewId === id || c.review_id === id);
  res.json({ ...review, comments });
});

// POST Create Review Room Video Cut
router.post('/', requireAuth, (req, res) => {
  const db = readDB();
  db.reviews = db.reviews || [];
  const count = db.reviews.length + 1;

  const newReview = {
    id: `REV-${String(count).padStart(3, '0')}`,
    projectId: req.body.projectId || `PRJ-${count}`,
    projectName: req.body.projectName || 'Untitled Video Cut',
    client: req.body.client || 'Agency Client',
    activeVersion: req.body.activeVersion || 'v1',
    versions: req.body.versions || ['v1'],
    mediaType: req.body.mediaType || 'video',
    mediaUrl: req.body.mediaUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: req.body.posterUrl || '',
    resolvedCount: 0,
    totalCount: 0,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(newReview);
  writeDB(db);
  broadcast('review_update', db.reviews);

  res.json({ success: true, review: newReview });
});

// POST Add Timecoded Comment to Video Cut
router.post('/:id/comments', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const review = (db.reviews || []).find(r => r.id === id);
  if (!review) return res.status(404).json({ error: 'Review project not found' });

  db.reviewComments = db.reviewComments || [];
  const newComment = {
    id: `CMT-${Date.now()}`,
    reviewId: id,
    author: req.user.name || req.body.author || 'Reviewer',
    authorRole: req.user.role || req.body.authorRole || 'Client Reviewer',
    timestamp: req.body.timestamp || '0:05',
    timeSeconds: req.body.timeSeconds || 5,
    text: req.body.text || '',
    resolved: false,
    drawings: req.body.drawings || [],
    createdAt: new Date().toISOString()
  };

  db.reviewComments.push(newComment);
  review.totalCount = (review.totalCount || 0) + 1;
  writeDB(db);
  broadcast('comment_update', { reviewId: id, comment: newComment });

  res.json({ success: true, comment: newComment });
});

// PUT Resolve Comment
router.put('/comments/:commentId/resolve', requireAuth, (req, res) => {
  const { commentId } = req.params;
  const db = readDB();
  const comment = (db.reviewComments || []).find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  comment.resolved = req.body.resolved !== undefined ? req.body.resolved : true;

  const review = (db.reviews || []).find(r => r.id === comment.reviewId);
  if (review) {
    const allForReview = db.reviewComments.filter(c => c.reviewId === review.id);
    review.resolvedCount = allForReview.filter(c => c.resolved).length;
  }

  writeDB(db);
  broadcast('comment_update', { reviewId: comment.reviewId, comment });

  res.json({ success: true, comment });
});

module.exports = router;
