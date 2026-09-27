/**
 * src/routes/webhooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Outbound Webhook Subscriptions & Webhook Management API
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  createSubscription,
  listSubscriptions,
  getSubscription,
  deleteSubscription,
  computeSignature
} = require('../services/webhook-dispatcher');

// POST /api/webhooks/subscriptions — Register new webhook subscription
router.post('/subscriptions', requireAuth, async (req, res) => {
  try {
    const { targetUrl, events, secret, stakeholderType, stakeholderId, metadata } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'targetUrl is required' });
    }

    const type = stakeholderType || (req.user?.role === 'Client' ? 'client' : (req.user?.role === 'Contractor' ? 'contractor' : 'internal'));
    const id = stakeholderId || req.user?.linkedId || req.user?.id || 'unknown';

    const subscription = await createSubscription({
      stakeholderType: type,
      stakeholderId: id,
      targetUrl,
      secret,
      events: events || ['*'],
      metadata: metadata || {}
    });

    return res.status(201).json({ success: true, subscription });
  } catch (err) {
    console.error('Webhook subscription POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks/subscriptions — List active subscriptions
router.get('/subscriptions', requireAuth, async (req, res) => {
  try {
    const isOwnerOrAdmin = req.user?.role === 'Owner / Admin' || req.user?.role === 'Admin' || req.user?.accessLevel === 'Owner / Admin';
    const stakeholderId = isOwnerOrAdmin ? (req.query.stakeholderId || null) : (req.user?.linkedId || req.user?.id);
    const stakeholderType = req.query.stakeholderType || null;

    const subscriptions = await listSubscriptions(stakeholderId, stakeholderType);
    return res.json({ success: true, subscriptions });
  } catch (err) {
    console.error('Webhook subscription GET error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/webhooks/subscriptions/:id — Remove subscription
router.delete('/subscriptions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await getSubscription(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const isOwner = req.user?.role === 'Owner / Admin' || req.user?.accessLevel === 'Owner / Admin';
    const isOwnerOfSub = sub.stakeholderId === (req.user?.linkedId || req.user?.id);

    if (!isOwner && !isOwnerOfSub) {
      return res.status(403).json({ error: 'Unauthorized to delete this subscription' });
    }

    const deleted = await deleteSubscription(id);
    return res.json({ success: true, deleted });
  } catch (err) {
    console.error('Webhook subscription DELETE error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks/subscriptions/:id/test — Send test verification ping
router.post('/subscriptions/:id/test', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await getSubscription(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { dispatchWebhookEvent } = require('../services/webhook-dispatcher');
    const result = await dispatchWebhookEvent('ping.test', {
      message: 'GRO10X Webhook verification ping',
      subscriptionId: id,
      timestamp: new Date().toISOString()
    }, {
      stakeholderId: sub.stakeholderId,
      stakeholderType: sub.stakeholderType
    });

    return res.json({
      success: true,
      message: 'Verification ping dispatched',
      result
    });
  } catch (err) {
    console.error('Webhook test ping error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
