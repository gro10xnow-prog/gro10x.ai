const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');

// GET Assets
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.assets || []);
});

// POST Add Asset (Admin only)
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  db.assets = db.assets || [];
  const count = db.assets.length + 1;

  const newAsset = {
    id: `AST-${String(count).padStart(3, '0')}`,
    name: req.body.name || 'Studio Camera',
    serial: req.body.serial || 'SN-0000',
    category: req.body.category || 'Camera Gear',
    purchasePrice: Number(req.body.purchasePrice) || 0,
    monthlyDepreciation: Number(req.body.monthlyDepreciation) || 0,
    condition: req.body.condition || 'Good',
    assignedTo: req.body.assignedTo || 'Niketon Studio Vault',
    createdAt: new Date().toISOString()
  };

  db.assets.push(newAsset);
  writeDB(db);
  broadcast('asset_update', db.assets);

  res.json({ success: true, asset: newAsset });
});

// PUT Update Asset Assignment / Condition
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.assets || []).findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });

  db.assets[idx] = { ...db.assets[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  broadcast('asset_update', db.assets);

  res.json({ success: true, asset: db.assets[idx] });
});

module.exports = router;
