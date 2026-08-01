const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');

// GET Expenses
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.expenses || []);
});

// POST Log Expense Claim
router.post('/', requireAuth, (req, res) => {
  const db = readDB();
  db.expenses = db.expenses || [];
  const count = db.expenses.length + 1;

  const newExpense = {
    id: `EXP-${String(count).padStart(3, '0')}`,
    title: req.body.title || 'Studio Expense',
    category: req.body.category || 'Production Supplies',
    amount: Number(req.body.amount) || 0,
    date: req.body.date || new Date().toISOString().split('T')[0],
    loggedBy: req.user.name || 'Team Member',
    tier1: {
      approved: false,
      approvedBy: null
    },
    createdAt: new Date().toISOString()
  };

  db.expenses.unshift(newExpense);
  writeDB(db);
  broadcast('expense_update', db.expenses);

  res.json({ success: true, expense: newExpense });
});

// PUT Approve Expense (Manager / Admin)
router.put('/:id/approve', requireAuth, requireManager, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.expenses || []).findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Expense record not found' });

  db.expenses[idx].tier1 = {
    approved: true,
    approvedBy: req.user.name,
    approvedAt: new Date().toISOString()
  };

  writeDB(db);
  broadcast('expense_update', db.expenses);

  res.json({ success: true, expense: db.expenses[idx] });
});

module.exports = router;
