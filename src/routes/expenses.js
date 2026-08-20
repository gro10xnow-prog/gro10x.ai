const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { uploadFile } = require('../services/storage');

function mapExpense(e) {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    amount: Number(e.amount) || 0,
    date: e.date,
    loggedBy: e.logged_by,
    submittedBy: e.submitted_by || e.logged_by,
    submittedById: e.submitted_by_id,
    receiptUrl: e.receipt_url,
    description: e.description,
    status: e.status || (e.tier1_approved ? 'Tier 2 Pending' : 'Tier 1 Pending'),
    tier1: {
      approved: !!e.tier1_approved,
      approvedBy: e.tier1_approved_by,
      approvedAt: e.tier1_approved_at
    },
    tier2: {
      approved: !!e.tier2_approved,
      approvedBy: e.tier2_approved_by,
      approvedAt: e.tier2_approved_at
    },
    createdAt: e.created_at
  };
}

const DEFAULT_EXPENSES = [
  {
    id: 'EXP-001',
    title: 'Niketon Studio Production Lighting Gear & Softboxes',
    category: 'Equipment & Gear',
    amount: 12500,
    date: '2026-08-10',
    logged_by: 'Borhan (Finance & Studio Lead)',
    submitted_by: 'Borhan (Finance & Studio Lead)',
    description: 'Godox softbox replacement diffuser and C-stand mounts',
    status: 'Approved',
    tier1_approved: true,
    tier1_approved_by: 'Ayman Rahman',
    tier1_approved_at: '2026-08-10T14:30:00Z',
    tier2_approved: true,
    tier2_approved_by: 'H. M. Ifteker Mahmud',
    tier2_approved_at: '2026-08-10T16:00:00Z',
    created_at: '2026-08-10T14:00:00Z'
  },
  {
    id: 'EXP-002',
    title: 'Food Styling & Props for Chillox Campaign Shoot',
    category: 'Shoot Props',
    amount: 4200,
    date: '2026-08-14',
    logged_by: 'Asif (Creative Lead)',
    submitted_by: 'Asif (Creative Lead)',
    description: 'Gourmet background condiments, acrylic styling props, ice cubes',
    status: 'Tier 2 Pending',
    tier1_approved: true,
    tier1_approved_by: 'Ayman Rahman',
    tier1_approved_at: '2026-08-14T11:00:00Z',
    tier2_approved: false,
    created_at: '2026-08-14T10:00:00Z'
  }
];

let inMemoryExpenses = [...DEFAULT_EXPENSES];

// GET Expenses
router.get('/', requireAuth, async (req, res) => {
  try {
    let expenses = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          expenses = data.map(mapExpense);
        }
      } catch (e) {}
    }

    if (expenses.length === 0) {
      expenses = inMemoryExpenses.map(mapExpense);
    }

    const empId = req.query.submittedById || req.query.employeeId;
    if (empId) {
      expenses = expenses.filter(e => e.submittedById === empId || e.submittedBy === empId);
    }
    return res.json(expenses);
  } catch (err) {
    console.error('Expenses GET error:', err.message);
    return res.json(inMemoryExpenses.map(mapExpense));
  }
});

// POST Log Expense Claim
router.post('/', requireAuth, async (req, res) => {
  try {
    const newId = `EXP-${String(inMemoryExpenses.length + 1).padStart(3, '0')}`;

    let receiptUrl = req.body.receiptUrl || '';
    if (req.body.receiptBase64) {
      try {
        const base64Data = req.body.receiptBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `receipts/${newId}_${Date.now()}.png`;
        const uploadRes = await uploadFile('expenses', filename, buffer, 'image/png');
        if (uploadRes.url) receiptUrl = uploadRes.url;
      } catch (e) {
        console.error('Receipt upload failed:', e);
      }
    }

    const payload = {
      id: newId,
      title: req.body.title || req.body.description || 'Studio Expense',
      category: req.body.category || 'Production Supplies',
      amount: Number(req.body.amount) || 0,
      date: req.body.date || new Date().toISOString().split('T')[0],
      logged_by: req.body.submittedBy || req.user.name || 'Team Member',
      submitted_by: req.body.submittedBy || req.user.name || 'Team Member',
      submitted_via: 'web_portal',
      currency: 'BDT',
      status: 'Tier 1 Pending',
      receipt_url: receiptUrl,
      created_at: new Date().toISOString()
    };

    inMemoryExpenses.unshift(payload);
    const expense = mapExpense(payload);

    if (supabase) {
      supabase.from('expenses').insert([payload]).then(null, e => {
        console.warn('[Expenses API] Supabase insert note:', e.message);
      });
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('expense_submitted', {
          employeeId: payload.submitted_by_id,
          employeeName: payload.submitted_by,
          amount: payload.amount,
          category: payload.category,
          description: payload.description
        }).catch(() => {});
      }
    } catch (e) {}

    return res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error('Expenses POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT Approve Expense (Tier 1)
router.put('/:id/approve', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      tier1_approved: true,
      tier1_approved_by: req.user.name,
      tier1_approved_at: new Date().toISOString(),
      status: 'Tier 2 Pending'
    };

    const memIdx = inMemoryExpenses.findIndex(e => e.id === id);
    if (memIdx !== -1) {
      inMemoryExpenses[memIdx] = { ...inMemoryExpenses[memIdx], ...updates };
    }
    const expense = mapExpense(inMemoryExpenses[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('expenses').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}
    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense approve error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/:id/approve-tier1 (Manager Portal endpoint)
router.post('/:id/approve-tier1', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const approver = req.body.approvedBy || req.user.name || 'Line Manager';
    const updates = {
      tier1_approved: true,
      tier1_approved_by: approver,
      tier1_approved_at: new Date().toISOString(),
      status: 'Tier 2 Pending'
    };

    const memIdx = inMemoryExpenses.findIndex(e => e.id === id);
    if (memIdx !== -1) {
      inMemoryExpenses[memIdx] = { ...inMemoryExpenses[memIdx], ...updates };
    }
    const expense = mapExpense(inMemoryExpenses[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('expenses').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}
    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 1 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/:id/approve-tier2 (Manager Portal endpoint)
router.post('/:id/approve-tier2', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const approver = req.body.approvedBy || req.user.name || 'Finance Lead';
    const updates = {
      tier2_approved: true,
      tier2_approved_by: approver,
      tier2_approved_at: new Date().toISOString(),
      status: 'Approved'
    };

    const memIdx = inMemoryExpenses.findIndex(e => e.id === id);
    if (memIdx !== -1) {
      inMemoryExpenses[memIdx] = { ...inMemoryExpenses[memIdx], ...updates };
    }
    const expense = mapExpense(inMemoryExpenses[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('expenses').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}
    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 2 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'Approved') {
        updates.tier1_approved = true;
        updates.tier2_approved = true;
      }
    }

    const memIdx = inMemoryExpenses.findIndex(e => e.id === id);
    if (memIdx !== -1) {
      inMemoryExpenses[memIdx] = { ...inMemoryExpenses[memIdx], ...updates };
    }
    const expense = mapExpense(inMemoryExpenses[memIdx] || { id, ...updates });

    if (supabase) {
      supabase.from('expenses').update(updates).eq('id', id).then(null, () => {});
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}
    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense PATCH error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
