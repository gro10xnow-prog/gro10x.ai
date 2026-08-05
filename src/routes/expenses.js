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

// GET Expenses
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapExpense));
  } catch (err) {
    console.error('Expenses GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Log Expense Claim
router.post('/', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('expenses').select('*', { count: 'exact', head: true });
    const newId = `EXP-${String((count || 0) + 1).padStart(3, '0')}`;

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
      submitted_by_id: req.body.submittedById || req.user.id || '',
      receipt_url: receiptUrl,
      description: req.body.description || '',
      status: req.body.status || 'Tier 1 Pending'
    };

    const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
    if (error) throw error;

    const expense = mapExpense(data);
    const { data: allExpenses } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    broadcast('expense_update', (allExpenses || []).map(mapExpense));

    res.json({ success: true, expense });
  } catch (err) {
    console.error('Expenses POST error:', err.message);
    res.status(500).json({ error: err.message });
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

    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const expense = mapExpense(data);
    const { data: allExpenses } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    broadcast('expense_update', (allExpenses || []).map(mapExpense));

    res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense approve error:', err.message);
    res.status(500).json({ error: err.message });
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

    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const expense = mapExpense(data);
    const { data: allExpenses } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    broadcast('expense_update', (allExpenses || []).map(mapExpense));

    res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 1 error:', err.message);
    res.status(500).json({ error: err.message });
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
      status: 'Tier 3 Pending'
    };

    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const expense = mapExpense(data);
    const { data: allExpenses } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    broadcast('expense_update', (allExpenses || []).map(mapExpense));

    res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense Tier 2 error:', err.message);
    res.status(500).json({ error: err.message });
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
    
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const expense = mapExpense(data);
    const { data: allExpenses } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    broadcast('expense_update', (allExpenses || []).map(mapExpense));

    res.json({ success: true, expense });
  } catch (err) {
    console.error('Expense PATCH error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
