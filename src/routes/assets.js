const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { randomUUID } = require('crypto');

// Helper to map DB columns to camelCase JS properties
function mapAsset(a) {
  if (!a) return null;
  return {
    id: a.id,
    name: a.name,
    serial: a.serial,
    category: a.category,
    purchasePrice: Number(a.purchase_price) || 0,
    monthlyDepreciation: Number(a.monthly_depreciation) || 0,
    condition: a.condition || 'Good',
    assignedTo: a.assigned_to || 'Unassigned',
    purchaseDate: a.purchase_date || '',
    warrantyExpiry: a.warranty_expiry || '',
    notes: a.notes || '',
    createdAt: a.created_at,
    updatedAt: a.updated_at
  };
}

const DEFAULT_ASSETS = [];

let inMemoryAssets = [...DEFAULT_ASSETS];

// GET Assets
router.get('/', requireAuth, async (req, res) => {
  try {
    let assets = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          assets = data.map(mapAsset);
        }
      } catch (e) {}
    }

    if (assets.length === 0) {
      assets = inMemoryAssets.map(mapAsset);
    }

    return res.json(assets);
  } catch (err) {
    console.error('Assets GET error:', err.message);
    return res.json(inMemoryAssets.map(mapAsset));
  }
});

// POST Add Asset (Manager+)
router.post('/', requireAuth, async (req, res) => {
  try {
    const newId = `AST-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;

    const payload = {
      id: newId,
      name: req.body.name || 'Studio Camera',
      serial: req.body.serial || `SN-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`,
      category: req.body.category || 'Camera & Cinema',
      purchase_price: Number(req.body.purchasePrice) || 0,
      monthly_depreciation: Number(req.body.monthlyDepreciation) || 0,
      condition: req.body.condition || 'Good',
      assigned_to: req.body.assignedTo || 'Unassigned',
      purchase_date: req.body.purchaseDate || new Date().toISOString().split('T')[0],
      warranty_expiry: req.body.warrantyExpiry || null,
      notes: req.body.notes || '',
      created_at: new Date().toISOString()
    };

    inMemoryAssets.unshift(payload);
    const asset = mapAsset(payload);

    if (supabase) {
      supabase.from('assets').insert([payload]).then(null, e => {
        console.warn('[Assets API] Supabase insert note:', e.message);
      });
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.status(201).json({ success: true, asset });
  } catch (err) {
    console.error('Asset POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Asset Assignment / Condition / Details
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.serial) updates.serial = req.body.serial;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.purchasePrice !== undefined) updates.purchase_price = Number(req.body.purchasePrice);
    if (req.body.condition) updates.condition = req.body.condition;
    if (req.body.assignedTo !== undefined) updates.assigned_to = req.body.assignedTo;
    if (req.body.purchaseDate !== undefined) updates.purchase_date = req.body.purchaseDate;
    if (req.body.warrantyExpiry !== undefined) updates.warranty_expiry = req.body.warrantyExpiry;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;

    const memIdx = inMemoryAssets.findIndex(a => a.id === id);
    if (memIdx !== -1) {
      inMemoryAssets[memIdx] = { ...inMemoryAssets[memIdx], ...updates, updated_at: new Date().toISOString() };
    }
    const asset = mapAsset(inMemoryAssets[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('assets').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset PUT error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST Checkout Asset
router.post('/:id/checkout', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const borrower = req.body.borrower || req.user.name || 'Crew Member';
    const updates = { assigned_to: borrower, condition: 'In Use', updated_at: new Date().toISOString() };

    const memIdx = inMemoryAssets.findIndex(a => a.id === id);
    if (memIdx !== -1) {
      inMemoryAssets[memIdx] = { ...inMemoryAssets[memIdx], ...updates };
    }
    const asset = mapAsset(inMemoryAssets[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('assets').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset Checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST Checkin Asset
router.post('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { assigned_to: 'Unassigned', condition: 'Good', updated_at: new Date().toISOString() };

    const memIdx = inMemoryAssets.findIndex(a => a.id === id);
    if (memIdx !== -1) {
      inMemoryAssets[memIdx] = { ...inMemoryAssets[memIdx], ...updates };
    }
    const asset = mapAsset(inMemoryAssets[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('assets').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset Checkin error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE Asset
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    inMemoryAssets = inMemoryAssets.filter(a => a.id !== id);

    if (supabase) {
      supabase.from('assets').delete().eq('id', id).then(null, () => {});
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Asset DELETE error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
