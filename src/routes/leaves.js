const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapLeave(l) {
  if (!l) return null;
  return {
    id: l.id,
    employeeId: l.employee_id,
    employeeName: l.employee_name,
    staffId: l.employee_id,
    staffName: l.employee_name,
    leaveType: l.leave_type,
    type: l.leave_type,
    startDate: l.start_date,
    endDate: l.end_date,
    fromDate: l.start_date,
    toDate: l.end_date,
    reason: l.reason,
    status: l.status || 'Pending',
    reviewedBy: l.manager_reviewed_by,
    createdAt: l.created_at
  };
}

// GET leaves (mounted at /api/leaves or /api)
router.get(['/', '/leaves'], requireAuth, async (req, res) => {
  try {
    const empFilter = req.query.empId || req.query.employeeId;
    let query = supabase.from('leaves').select('*').order('created_at', { ascending: false });

    if (empFilter) {
      query = query.eq('employee_id', empFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(mapLeave));
  } catch (err) {
    console.error('Leaves GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Submit a Leave Request
router.post('/leaves', requireAuth, async (req, res) => {
  try {
    const newId = `LEV-${Date.now()}`;
    const payload = {
      id: newId,
      employee_id: req.body.staffId || req.body.employeeId || req.user.id || 'PBD-001',
      employee_name: req.body.staffName || req.body.employeeName || req.user.name || 'Staff Member',
      leave_type: req.body.leaveType || req.body.type || 'Casual Leave',
      start_date: req.body.startDate || req.body.fromDate || new Date().toISOString().split('T')[0],
      end_date: req.body.endDate || req.body.toDate || new Date().toISOString().split('T')[0],
      reason: req.body.reason || '',
      status: 'Pending'
    };

    const { data, error } = await supabase.from('leaves').insert([payload]).select().single();
    if (error) throw error;

    const leave = mapLeave(data);
    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', (allLeaves || []).map(mapLeave));

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /leaves/:id/approve & /manager-approve
router.post(['/leaves/:id/approve', '/leaves/:id/manager-approve'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Approved',
      reviewed_by: req.body.reviewedBy || req.user.name || 'Manager',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const leave = mapLeave(data);
    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', (allLeaves || []).map(mapLeave));

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /leaves/:id/reject
router.post('/leaves/:id/reject', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Rejected',
      reviewed_by: req.body.reviewedBy || req.user.name || 'Manager',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const leave = mapLeave(data);
    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', (allLeaves || []).map(mapLeave));

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Leave Status
router.put('/leaves/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const leave = mapLeave(data);
    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', (allLeaves || []).map(mapLeave));

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
