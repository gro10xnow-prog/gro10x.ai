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

// GET leaves (mounted at /api/leaves)
router.get('/', requireAuth, async (req, res) => {
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
router.post('/', requireAuth, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `LVE-${randomUUID().split('-')[0].toUpperCase()}`;
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

    try {
      const { automation } = require('../services/automation');
      await automation.trigger('leave_submitted', {
        employeeId: payload.employee_id,
        employeeName: payload.employee_name,
        leaveType: payload.leave_type,
        startDate: payload.start_date,
        endDate: payload.end_date,
        reason: payload.reason
      });
    } catch (e) { console.warn('Automation trigger leave_submitted failed:', e.message); }

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/approve & /:id/manager-approve
router.post(['/:id/approve', '/:id/manager-approve'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch leave to determine type and days
    const { data: leaveReq, error: fetchErr } = await supabase.from('leaves').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    // 2. Update Leave Status
    const updates = {
      status: 'Approved',
      manager_reviewed_by: req.body.reviewedBy || req.user.name || 'Manager',
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // 3. Update Leave Balances
    if (leaveReq && leaveReq.employee_id) {
      const start = new Date(leaveReq.start_date);
      const end = new Date(leaveReq.end_date);
      let days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (days < 1) days = 1;

      const isSick = (leaveReq.leave_type || '').toLowerCase().includes('sick');
      const usedCol = isSick ? 'sick_leaves_used' : 'casual_leaves_used';

      const { data: profile } = await supabase.from('profiles').select(usedCol).eq('id', leaveReq.employee_id).single();
      
      if (profile) {
        const currentUsed = profile[usedCol] || 0;
        await supabase.from('profiles').update({
          [usedCol]: currentUsed + days
        }).eq('id', leaveReq.employee_id);
      } else {
        const { data: profileEmpCode } = await supabase.from('profiles').select(usedCol).eq('emp_code', leaveReq.employee_id).single();
        if (profileEmpCode) {
          const currentUsed = profileEmpCode[usedCol] || 0;
          await supabase.from('profiles').update({
            [usedCol]: currentUsed + days
          }).eq('emp_code', leaveReq.employee_id);
        }
      }
    }

    const leave = mapLeave(data);
    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', (allLeaves || []).map(mapLeave));
    const { data: teamData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    broadcast('team_update', teamData || []);

    try {
      const { automation } = require('../services/automation');
      await automation.trigger('leave_decision', {
        employeeId: data.employee_id,
        employeeName: data.employee_name,
        status: 'Approved',
        leaveType: data.leave_type,
        decidedBy: updates.manager_reviewed_by
      });
    } catch (e) { console.warn('Automation trigger leave_decision (Approved) failed:', e.message); }

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/reject
router.post('/:id/reject', requireAuth, async (req, res) => {
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

    try {
      const { automation } = require('../services/automation');
      await automation.trigger('leave_decision', {
        employeeId: data.employee_id,
        employeeName: data.employee_name,
        status: 'Rejected',
        leaveType: data.leave_type,
        decidedBy: updates.reviewed_by
      });
    } catch (e) { console.warn('Automation trigger leave_decision (Rejected) failed:', e.message); }

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Leave Status
router.put('/:id', requireAuth, requireManager, async (req, res) => {
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
