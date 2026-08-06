const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
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

// GET Assets
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapAsset));
  } catch (err) {
    console.error('Assets GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Add Asset (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newId = `AST-${randomUUID().split('-')[0].toUpperCase()}`;

    const payload = {
      id: newId,
      name: req.body.name || 'Studio Camera',
      serial: req.body.serial || `SN-${randomUUID().split('-')[0].toUpperCase()}`,
      category: req.body.category || 'Camera & Cinema',
      purchase_price: Number(req.body.purchasePrice) || 0,
      monthly_depreciation: Number(req.body.monthlyDepreciation) || 0,
      condition: req.body.condition || 'Good',
      assigned_to: req.body.assignedTo || 'Unassigned',
      purchase_date: req.body.purchaseDate || new Date().toISOString().split('T')[0],
      warranty_expiry: req.body.warrantyExpiry || null,
      notes: req.body.notes || ''
    };

    const { data, error } = await supabase.from('assets').insert([payload]).select().single();
    if (error) throw error;

    const asset = mapAsset(data);
    const { data: allAssets } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    broadcast('asset_update', (allAssets || []).map(mapAsset));

    res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Asset Assignment / Condition / Details
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
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

    const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const asset = mapAsset(data);
    const { data: allAssets } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    broadcast('asset_update', (allAssets || []).map(mapAsset));

    res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Checkout Asset
router.post('/:id/checkout', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const borrower = req.body.borrower || req.user.name || 'Crew Member';

    const { data, error } = await supabase.from('assets')
      .update({ assigned_to: borrower, condition: 'In Use' })
      .eq('id', id)
      .select().single();
    if (error) throw error;

    const asset = mapAsset(data);
    const { data: allAssets } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    broadcast('asset_update', (allAssets || []).map(mapAsset));

    res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset Checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Checkin Asset
router.post('/:id/checkin', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from('assets')
      .update({ assigned_to: 'Unassigned', condition: 'Good' })
      .eq('id', id)
      .select().single();
    if (error) throw error;

    const asset = mapAsset(data);
    const { data: allAssets } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    broadcast('asset_update', (allAssets || []).map(mapAsset));

    res.json({ success: true, asset });
  } catch (err) {
    console.error('Asset Checkin error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Asset (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;

    const { data: allAssets } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    broadcast('asset_update', (allAssets || []).map(mapAsset));

    res.json({ success: true, id });
  } catch (err) {
    console.error('Asset DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
