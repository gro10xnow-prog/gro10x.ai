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

const DEFAULT_ASSETS = [
  {
    id: 'AST-001',
    name: 'Sony FX3 Cinema Line Camera + 24-70mm GM II',
    serial: 'SN-FX3-98214',
    category: 'Camera & Cinema',
    purchase_price: 480000,
    monthly_depreciation: 8000,
    condition: 'In Use',
    assigned_to: 'Asif (Senior Video Editor & Colorist)',
    purchase_date: '2025-11-15',
    warranty_expiry: '2027-11-15',
    notes: 'Main primary shoot rig for Chillox & Aura brand TVCs',
    created_at: '2025-11-15T10:00:00Z'
  },
  {
    id: 'AST-002',
    name: 'Apple MacBook Pro 16" (M3 Max / 64GB RAM / 2TB)',
    serial: 'SN-MBP-44021',
    category: 'Laptop & PC',
    purchase_price: 395000,
    monthly_depreciation: 6500,
    condition: 'Good',
    assigned_to: 'Zahin (Lead Full-Stack Developer)',
    purchase_date: '2026-01-10',
    warranty_expiry: '2028-01-10',
    notes: 'Platform engineering & AI model inference workstation',
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'AST-003',
    name: 'Godox Knowled M600D Daylight LED + Light Dome III',
    serial: 'SN-GDX-77123',
    category: 'Lighting & Audio',
    purchase_price: 165000,
    monthly_depreciation: 2500,
    condition: 'Good',
    assigned_to: 'Borhan (Finance & Studio Lead)',
    purchase_date: '2026-02-01',
    warranty_expiry: '2027-02-01',
    notes: 'Niketon HQ key studio lighting fixture',
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'AST-004',
    name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
    serial: 'SN-DJI-33981',
    category: 'Camera & Cinema',
    purchase_price: 95000,
    monthly_depreciation: 1800,
    condition: 'Good',
    assigned_to: 'Unassigned',
    purchase_date: '2026-03-05',
    warranty_expiry: '2027-03-05',
    notes: 'Available for checkout in equipment cabinet 2',
    created_at: '2026-03-05T10:00:00Z'
  },
  {
    id: 'AST-005',
    name: 'Sennheiser MKH 416 Shotgun Microphone + Boom Kit',
    serial: 'SN-SNN-10944',
    category: 'Lighting & Audio',
    purchase_price: 110000,
    monthly_depreciation: 1500,
    condition: 'Good',
    assigned_to: 'Unassigned',
    purchase_date: '2026-04-12',
    warranty_expiry: '2028-04-12',
    notes: 'High-directional dialogue capture rig for field sets',
    created_at: '2026-04-12T10:00:00Z'
  }
];

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
      supabase.from('assets').insert([payload]).catch(e => {
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
      supabase.from('assets').update(updates).eq('id', id).catch(() => {});
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
      supabase.from('assets').update(updates).eq('id', id).catch(() => {});
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
      supabase.from('assets').update(updates).eq('id', id).catch(() => {});
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
      supabase.from('assets').delete().eq('id', id).catch(() => {});
    }

    try { broadcast('asset_update', inMemoryAssets.map(mapAsset)); } catch (e) {}
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Asset DELETE error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
