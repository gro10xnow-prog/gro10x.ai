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
    totalDays: Number(l.total_days || l.days) || 1,
    total_days: Number(l.total_days || l.days) || 1,
    reviewedBy: l.manager_reviewed_by || l.reviewed_by || null,
    ownerApprovedAt: l.owner_approved_at || null,
    createdAt: l.created_at,
    updatedAt: l.updated_at || null
  };
}

async function updateSupabaseLeave(id, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select().maybeSingle();
    if (!error) return data;
    if (error.message && error.message.includes('updated_at')) {
      const { updated_at, ...cleanUpdates } = updates;
      const { data: retryData, error: retryErr } = await supabase.from('leaves').update(cleanUpdates).eq('id', id).select().maybeSingle();
      if (!retryErr) return retryData;
    }
    console.warn('[Leaves API] Supabase update warning:', error.message);
  } catch (err) {
    console.warn('[Leaves API] Supabase update exception:', err.message);
  }
  return null;
}

const DEFAULT_LEAVES = [
  {
    id: 'LEV-001',
    employee_id: 'PBD-010',
    employee_name: 'Lead Designer',
    leave_type: 'Annual Leave',
    start_date: '2026-08-20',
    end_date: '2026-08-22',
    reason: 'Family event & travel',
    status: 'Approved',
    manager_reviewed_by: 'Department Head',
    created_at: '2026-08-15T10:00:00Z'
  },
  {
    id: 'LEV-002',
    employee_id: 'PBD-011',
    employee_name: 'Video Editor',
    leave_type: 'Casual Leave',
    start_date: '2026-08-25',
    end_date: '2026-08-26',
    reason: 'Personal work',
    status: 'Pending',
    created_at: '2026-08-17T12:00:00Z'
  }
];

let inMemoryLeaves = [...DEFAULT_LEAVES];

// GET leaves (mounted at /api/leaves)
router.get('/', requireAuth, async (req, res) => {
  try {
    let leaves = [];
    if (supabase) {
      try {
        const empFilter = req.query.empId || req.query.employeeId;
        let query = supabase.from('leaves').select('*').order('created_at', { ascending: false });

        if (empFilter) {
          query = query.eq('employee_id', empFilter);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          leaves = data.map(mapLeave);
        }
      } catch (e) {}
    }

    if (leaves.length === 0) {
      leaves = inMemoryLeaves.map(mapLeave);
    }

    return res.json(leaves);
  } catch (err) {
    console.error('Leaves GET error:', err.message);
    return res.json(inMemoryLeaves.map(mapLeave));
  }
});

// GET /api/leaves/balance (B-P2-6)
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const empCode = req.query.empCode || req.query.employeeId || req.user?.emp_code || req.user?.empCode || req.user?.id || '';
    let casualAllowed = 14;
    let sickAllowed = 10;
    let casualUsed = 0;
    let sickUsed = 0;

    if (supabase) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empCode);
      let pQuery = supabase.from('profiles').select('casual_leaves_allowed, sick_leaves_allowed, casual_leaves_used, sick_leaves_used');
      if (isUUID) pQuery = pQuery.eq('id', empCode);
      else pQuery = pQuery.eq('emp_code', empCode);
      const { data: prof } = await pQuery.maybeSingle();

      if (prof) {
        casualAllowed = prof.casual_leaves_allowed ?? 14;
        sickAllowed = prof.sick_leaves_allowed ?? 10;
        if (prof.casual_leaves_used !== undefined && prof.casual_leaves_used !== null) casualUsed = Number(prof.casual_leaves_used);
        if (prof.sick_leaves_used !== undefined && prof.sick_leaves_used !== null) sickUsed = Number(prof.sick_leaves_used);
      }

      if (casualUsed === 0 && sickUsed === 0) {
        const { data: leaves } = await supabase.from('leaves').select('leave_type, total_days, status').eq('employee_id', empCode);
        const approved = (leaves || []).filter(l => l.status === 'Approved');
        casualUsed = approved.filter(l => (l.leave_type || '').toLowerCase().includes('casual'))
          .reduce((sum, l) => sum + (Number(l.total_days) || 1), 0);
        sickUsed = approved.filter(l => (l.leave_type || '').toLowerCase().includes('sick'))
          .reduce((sum, l) => sum + (Number(l.total_days) || 1), 0);
      }
    }

    return res.json({
      success: true,
      casualAllowed,
      sickAllowed,
      casualUsed,
      sickUsed,
      casualRemaining: Math.max(0, casualAllowed - casualUsed),
      sickRemaining: Math.max(0, sickAllowed - sickUsed)
    });
  } catch (err) {
    console.error('Leaves /balance error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST Submit a Leave Request
router.post('/', requireAuth, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `LVE-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;
    const payload = {
      id: newId,
      employee_id: req.body.staffId || req.body.employeeId || req.user.empCode || req.user.emp_code || req.user.id || 'GRO-001',
      employee_name: req.body.staffName || req.body.employeeName || req.user.name || 'Staff Member',
      leave_type: req.body.leaveType || req.body.type || 'Casual Leave',
      start_date: req.body.startDate || req.body.fromDate || new Date().toISOString().split('T')[0],
      end_date: req.body.endDate || req.body.toDate || new Date().toISOString().split('T')[0],
      total_days: Number(req.body.totalDays || req.body.total_days || req.body.days) || 1,
      reason: req.body.reason || '',
      status: 'Pending',
      submitted_via: req.body.submitted_via || 'web_portal',
      created_at: new Date().toISOString()
    };

    inMemoryLeaves.unshift(payload);
    const leave = mapLeave(payload);

    if (supabase) {
      try {
        await supabase.from('leaves').insert([payload]);
      } catch (dbErr) {
        console.warn('[Leaves API] Supabase insert warning:', dbErr.message);
      }
    }

    try { broadcast('leave_update', inMemoryLeaves.map(mapLeave)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        automation.trigger('leave_submitted', {
          employeeId: payload.employee_id,
          employeeName: payload.employee_name,
          leaveType: payload.leave_type,
          startDate: payload.start_date,
          endDate: payload.end_date,
          reason: payload.reason
        }).catch(() => {});
      }
    } catch (e) {}

    return res.status(201).json({ success: true, leave });
  } catch (err) {
    console.error('Leave POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /:id/approve & /:id/manager-approve
router.post(['/:id/approve', '/:id/manager-approve'], requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const approver = req.body.reviewedBy || req.user?.name || 'Department Manager';
    const updates = {
      status: 'Approved',
      manager_reviewed_by: approver,
      updated_at: new Date().toISOString()
    };

    let leaveData = null;

    if (supabase) {
      // 1. Fetch leave to determine type and days
      const { data: leaveReq } = await supabase.from('leaves').select('*').eq('id', id).maybeSingle();
      
      // 2. Update Leave Status
      leaveData = await updateSupabaseLeave(id, updates);

      // 3. Update Leave Balances if columns exist
      if (leaveReq && leaveReq.employee_id) {
        try {
          const start = new Date(leaveReq.start_date);
          const end = new Date(leaveReq.end_date);
          let days = Number(leaveReq.total_days || leaveReq.days) || Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
          if (days < 1) days = 1;

          const isSick = (leaveReq.leave_type || '').toLowerCase().includes('sick');
          const usedCol = isSick ? 'sick_leaves_used' : 'casual_leaves_used';

          const { data: profile } = await supabase.from('profiles').select(usedCol).eq('id', leaveReq.employee_id).maybeSingle();
          
          if (profile && profile[usedCol] !== undefined) {
            const currentUsed = profile[usedCol] || 0;
            await supabase.from('profiles').update({ [usedCol]: currentUsed + days }).eq('id', leaveReq.employee_id);
          } else {
            const { data: profileEmpCode } = await supabase.from('profiles').select(usedCol).eq('emp_code', leaveReq.employee_id).maybeSingle();
            if (profileEmpCode && profileEmpCode[usedCol] !== undefined) {
              const currentUsed = profileEmpCode[usedCol] || 0;
              await supabase.from('profiles').update({ [usedCol]: currentUsed + days }).eq('emp_code', leaveReq.employee_id);
            }
          }
        } catch (balErr) {
          console.warn('[Leaves API] Leave balance decrement skipped:', balErr.message);
        }
      }
    }

    const memIdx = inMemoryLeaves.findIndex(l => l.id === id);
    if (memIdx !== -1) {
      inMemoryLeaves[memIdx] = { ...inMemoryLeaves[memIdx], ...updates };
    }
    const leave = mapLeave(leaveData || inMemoryLeaves[memIdx] || { id, ...updates });

    try { broadcast('leave_update', inMemoryLeaves.map(mapLeave)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        await automation.trigger('leave_decision', {
          leave: {
            staffName: leave.employeeName || leave.staffName,
            employeeId: leave.employeeId,
            status: 'Approved',
            type: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reviewedBy: updates.manager_reviewed_by
          },
          employeeId: leave.employeeId,
          employeeName: leave.employeeName,
          status: 'Approved',
          leaveType: leave.leaveType,
          decidedBy: updates.manager_reviewed_by
        }).catch(() => {});

        await automation.trigger('leave_manager_approved', {
          leave: {
            id: leave.id,
            staffName: leave.employeeName || leave.staffName,
            employeeName: leave.employeeName,
            leaveType: leave.leaveType,
            type: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            managerReviewedBy: updates.manager_reviewed_by
          }
        }).catch(() => {});
      }
    } catch (e) {}

    // Push Telegram DM to the applicant
    if (supabase && leave.employeeId) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leave.employeeId);
        let q = supabase.from('profiles').select('name, telegram_id');
        if (isUUID) q = q.eq('id', leave.employeeId);
        else q = q.eq('emp_code', leave.employeeId);

        q.maybeSingle().then(({ data: prof }) => {
          if (prof?.telegram_id) {
            const { sendTelegramNotification } = require('../services/bot');
            sendTelegramNotification(
              prof.telegram_id,
              `✅ *Leave Request APPROVED!*\n\n` +
              `Your *${leave.leaveType || 'Leave'}* from *${leave.startDate}* to *${leave.endDate}* has been approved by *${updates.manager_reviewed_by}*.\n\n` +
              `_Enjoy your time off! 🌴_`,
              null, true
            );
          }
        }).catch(err => console.warn('[Leaves API] Telegram approval notification warning:', err.message));
      } catch (e) {}
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave approve error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /:id/reject
router.post('/:id/reject', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const reviewer = req.body.reviewedBy || req.user?.name || 'Department Manager';
    const updates = {
      status: 'Rejected',
      manager_reviewed_by: reviewer,
      updated_at: new Date().toISOString()
    };

    let leaveData = null;
    if (supabase) {
      leaveData = await updateSupabaseLeave(id, updates);
    }

    const memIdx = inMemoryLeaves.findIndex(l => l.id === id);
    if (memIdx !== -1) {
      inMemoryLeaves[memIdx] = { ...inMemoryLeaves[memIdx], ...updates };
    }
    const leave = mapLeave(leaveData || inMemoryLeaves[memIdx] || { id, ...updates });

    try { broadcast('leave_update', inMemoryLeaves.map(mapLeave)); } catch (e) {}

    try {
      const { automation } = require('../services/automation');
      if (automation && automation.trigger) {
        await automation.trigger('leave_decision', {
          leave: {
            staffName: leave.employeeName || leave.staffName,
            employeeId: leave.employeeId,
            status: 'Rejected',
            type: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            reviewedBy: updates.manager_reviewed_by
          },
          employeeId: leave.employeeId,
          employeeName: leave.employeeName,
          status: 'Rejected',
          leaveType: leave.leaveType,
          decidedBy: updates.manager_reviewed_by
        }).catch(() => {});
      }
    } catch (e) {}

    // Push Telegram DM to the applicant
    if (supabase && leave.employeeId) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leave.employeeId);
        let q = supabase.from('profiles').select('name, telegram_id');
        if (isUUID) q = q.eq('id', leave.employeeId);
        else q = q.eq('emp_code', leave.employeeId);

        q.maybeSingle().then(({ data: prof }) => {
          if (prof?.telegram_id) {
            const { sendTelegramNotification } = require('../services/bot');
            sendTelegramNotification(
              prof.telegram_id,
              `❌ *Leave Request Declined*\n\n` +
              `Your *${leave.leaveType || 'Leave'}* request for *${leave.startDate}* to *${leave.endDate}* was declined by *${updates.manager_reviewed_by}*.\n\n` +
              `_Please check in with your department lead for details._`,
              null, true
            );
          }
        }).catch(err => console.warn('[Leaves API] Telegram rejection notification warning:', err.message));
      } catch (e) {}
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave reject error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Leave Status
router.put('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    let leaveData = null;
    if (supabase) {
      leaveData = await updateSupabaseLeave(id, updates);
    }

    const memIdx = inMemoryLeaves.findIndex(l => l.id === id);
    if (memIdx !== -1) {
      inMemoryLeaves[memIdx] = { ...inMemoryLeaves[memIdx], ...updates };
    }
    const leave = mapLeave(leaveData || inMemoryLeaves[memIdx] || { id, ...updates });

    try { broadcast('leave_update', inMemoryLeaves.map(mapLeave)); } catch (e) {}

    return res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave PUT error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
