const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

// GET all leaves
router.get('/leaves', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return res.json(data.map(l => ({
        ...l,
        employeeId: l.employee_id,
        employeeName: l.employee_name,
        leaveType: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        reportsTo: l.reports_to,
        managerReviewedBy: l.manager_reviewed_by,
        managerApprovedAt: l.manager_approved_at,
        ownerApprovedAt: l.owner_approved_at,
        createdAt: l.created_at
      })));
    }
  }
  const db = readDB();
  res.json(db.leaves || []);
});

// POST Submit a Leave Request
router.post('/leaves', requireAuth, async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const db = readDB();

  const newLeave = {
    id: `LEV-${Date.now()}`,
    employeeId: req.user.id || req.user.linkedId || 'EMP-001',
    employeeName: req.user.name || req.user.profile?.name || 'Staff Member',
    leaveType: leaveType || 'Casual Leave',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || startDate || new Date().toISOString().split('T')[0],
    reason: reason || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const payload = {
      id: newLeave.id,
      employee_id: newLeave.employeeId,
      employee_name: newLeave.employeeName,
      leave_type: newLeave.leaveType,
      start_date: newLeave.startDate,
      end_date: newLeave.endDate,
      reason: newLeave.reason,
      status: newLeave.status
    };
    const { error } = await supabase.from('leaves').insert([payload]);
    if (!error) {
      broadcast('leave_update', [newLeave]);
      return res.json({ success: true, leave: newLeave });
    }
  }

  db.leaves = db.leaves || [];
  db.leaves.unshift(newLeave);
  writeDB(db);
  broadcast('leave_update', db.leaves);

  res.json({ success: true, leave: newLeave });
});

// PUT Update Leave Status (Manager / Owner approval)
router.put('/leaves/:id', requireAuth, requireManager, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isSupabaseConfigured()) {
    const payload = {};
    if (updates.status) payload.status = updates.status;
    if (updates.managerReviewedBy) payload.manager_reviewed_by = updates.managerReviewedBy;
    if (updates.managerApprovedAt) payload.manager_approved_at = updates.managerApprovedAt;
    if (updates.ownerApprovedAt) payload.owner_approved_at = updates.ownerApprovedAt;

    const { error } = await supabase.from('leaves').update(payload).eq('id', id);
    if (!error) {
      broadcast('leave_update', [{ id, ...updates }]);
      return res.json({ success: true });
    }
  }

  const db = readDB();
  const idx = (db.leaves || []).findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Leave request not found' });

  db.leaves[idx] = { ...db.leaves[idx], ...updates };
  writeDB(db);
  broadcast('leave_update', db.leaves);

  res.json({ success: true, leave: db.leaves[idx] });
});

module.exports = router;
