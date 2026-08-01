const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { processAutomationEvent, checkScheduledSocialDispatches } = require('../services/automation');

// GET All Social Posts (Filtered for clients if client user)
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  checkScheduledSocialDispatches(db, writeDB, broadcast);
  let posts = db.posts || [];

  if (req.user.linkedType === 'client' && req.user.linkedId) {
    const clientNameLower = (req.user.name || '').toLowerCase();
    posts = posts.filter(p => p.clientId === req.user.linkedId || (p.clientName || '').toLowerCase().includes(clientNameLower));
  }

  res.json(posts);
});

// GET Client Posts
router.get('/client/:clientName', requireAuth, (req, res) => {
  const { clientName } = req.params;
  const db = readDB();
  const decoded = decodeURIComponent(clientName).toLowerCase();
  const clientPosts = (db.posts || []).filter(p => 
    (p.clientName || '').toLowerCase().includes(decoded) || 
    (p.clientId || '').toLowerCase() === decoded
  );
  res.json(clientPosts);
});

// POST Schedule Social Post
router.post('/', requireAuth, (req, res) => {
  const db = readDB();
  db.posts = db.posts || [];
  const count = db.posts.length + 101;

  let targetUrl = req.body.targetUrl || '';
  if (!targetUrl && (req.body.clientId || req.body.clientName) && req.body.platform) {
    const client = (db.clients || []).find(c => c.id === req.body.clientId || (c.name || '').toLowerCase() === (req.body.clientName || '').toLowerCase());
    if (client && client.socialLinks) {
      const platKey = req.body.platform.toLowerCase();
      targetUrl = client.socialLinks[platKey] || '';
    }
  }

  const newPost = {
    id: `PST-${count}`,
    clientId: req.body.clientId || '',
    clientName: req.body.clientName || 'General Client',
    platform: req.body.platform || 'Facebook',
    targetUrl: targetUrl,
    title: req.body.title || 'Untitled Post',
    caption: req.body.caption || '',
    mediaUrls: req.body.mediaUrls || (req.body.mediaUrl ? [req.body.mediaUrl] : []),
    scheduledDate: req.body.scheduledDate || new Date().toISOString().split('T')[0],
    scheduledTime: req.body.scheduledTime || '18:00',
    assignedPublisher: req.body.assignedPublisher || 'Sabrin Akhtar',
    status: req.body.status || 'Pending Client Approval',
    createdAt: new Date().toISOString()
  };

  db.posts.push(newPost);
  writeDB(db);
  broadcast('post_update', db.posts);

  res.json({ success: true, post: newPost });
});

// PUT Update Post
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx] = { ...db.posts[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  broadcast('post_update', db.posts);

  res.json({ success: true, post: db.posts[idx] });
});

// POST Approve Post (Client 1-Click Approval)
router.post('/:id/approve', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.posts || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  db.posts[idx].status = 'Approved';
  db.posts[idx].approvedAt = new Date().toISOString();
  db.posts[idx].approvedBy = req.body.approvedBy || req.user.name || db.posts[idx].clientName;
  delete db.posts[idx].clientFeedback;

  processAutomationEvent('social_post_approved', { post: db.posts[idx] }, db, writeDB, broadcast);

  writeDB(db);
  broadcast('post_update', db.posts);

  res.json({ success: true, post: db.posts[idx] });
});

module.exports = router;
