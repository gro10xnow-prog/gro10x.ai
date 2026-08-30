const express = require('express');
const { randomUUID } = require('crypto');
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
    submittedBy: e.submitted_by || e.logged_by || 'Staff Member',
    submittedById: e.submitted_by_id || e.employee_id || null,
    receiptUrl: e.receipt_url,
    description: e.description,
    status: e.status || (e.tier2_approved ? 'Approved' : (e.tier1_approved ? 'Tier 2 Pending' : 'Tier 1 Pending')),
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
    financeVerified: !!e.finance_verified,
    financeVerifiedBy: e.finance_verified_by,
    financeVerifiedAt: e.finance_verified_at,
    disbursed: !!e.disbursed,
    disbursedBy: e.disbursed_by,
    disbursedAt: e.disbursed_at,
    createdAt: e.created_at
  };
}

const DEFAULT_EXPENSES = [];

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
    const newId = `EXP-${randomUUID().slice(0, 8).toUpperCase()}`;

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
      logged_by: req.body.submittedBy || req.body.employeeName || req.body.staffName || req.user?.name || 'Team Member',
      submitted_by: req.body.submittedBy || req.body.employeeName || req.body.staffName || req.user?.name || 'Team Member',
      submitted_by_id: req.body.submittedById || req.body.employeeId || req.body.staffId || req.user?.empCode || req.user?.emp_code || req.user?.id || null,
      submitted_via: 'web_portal',
      currency: 'BDT',
      status: 'Tier 1 Pending',
      receipt_url: receiptUrl,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error: dbErr } = await supabase.from('expenses').insert([payload]);
        if (dbErr) {
          console.warn('[Expenses API] Supabase insert warning, fallback to memory:', dbErr.message);
        }
      } catch (dbEx) {
        console.warn('[Expenses API] Supabase insert exception:', dbEx.message);
      }
    }

    inMemoryExpenses.unshift(payload);
    const expense = mapExpense(payload);

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('expense_submitted', {
          employeeId: payload.submitted_by_id,
          employeeName: payload.submitted_by,
          amount: payload.amount,
          category: payload.category,
          description: payload.description || payload.title
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
      await supabase.from('expenses').update(updates).eq('id', id);
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('expense_tier1_approved', { expense }).catch(() => {});
      }
    } catch (e) {}

    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense approve error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/:id/approve-tier1 (Manager Portal endpoint)
router.post('/:id/approve-tier1', requireAuth, requireManager, async (req, res) => {
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
      await supabase.from('expenses').update(updates).eq('id', id);
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('expense_tier1_approved', { expense }).catch(() => {});
      }
    } catch (e) {}

    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 1 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/:id/approve-tier2 (Manager Portal endpoint)
router.post('/:id/approve-tier2', requireAuth, requireManager, async (req, res) => {
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
      await supabase.from('expenses').update(updates).eq('id', id);
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('expense_tier2_approved', { expense }).catch(() => {});
      }
    } catch (e) {}

    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 2 error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', requireAuth, requireManager, async (req, res) => {
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
      await supabase.from('expenses').update(updates).eq('id', id);
    }

    try { broadcast('expense_update', inMemoryExpenses.map(mapExpense)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        if (status === 'Disbursed') {
          automation.trigger('expense_disbursed', { expense }).catch(() => {});
        } else if (status === 'Approved') {
          automation.trigger('expense_tier2_approved', { expense }).catch(() => {});
        }
      }
    } catch (e) {}

    return res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense PATCH error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
