const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapTask(t) {
  if (!t) return null;
  const assigneesArr = Array.isArray(t.assignees) && t.assignees.length > 0 
    ? t.assignees 
    : (t.assignee ? [t.assignee] : ['Unassigned']);

  return {
    id: t.id,
    title: t.title,
    client: t.client,
    clientId: t.client_id || t.clientId,
    projectId: t.project_id || t.projectId,
    parentTaskId: t.parent_task_id || t.parentTaskId,
    blockedBy: t.blocked_by || t.blockedBy,
    stage: t.stage,
    customStatus: t.custom_status || t.stage || 'To Do',
    statusCategory: t.status_category || 'open',
    priority: t.priority,
    assignee: t.assignee || assigneesArr[0],
    assignees: assigneesArr,
    assigneeId: t.assignee_id || t.assigneeId,
    dueDate: t.due_date || t.dueDate,
    department: t.department,
    category: t.category,
    estimatedHours: Number(t.estimated_hours || t.estimatedHours) || 0,
    loggedHours: Number(t.logged_hours || t.loggedHours) || 0,
    sortOrder: Number(t.sort_order || t.sortOrder) || 0,
    qcApprovedBy: t.qc_approved_by,
    qcApprovedAt: t.qc_approved_at,
    qcFeedback: t.qc_feedback,
    qcRejectedBy: t.qc_rejected_by,
    qcRejectedAt: t.qc_rejected_at,
    reassignedBy: t.reassigned_by,
    reassignReason: t.reassign_reason,
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt
  };
}

// GET Tasks (Supports ?dept= and ?assignee= filters)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { dept, assignee } = req.query;
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    if (dept) {
      query = query.or(`department.ilike.%${dept}%,category.ilike.%${dept}%`);
    }

    if (assignee) {
      query = query.ilike('assignee', `%${assignee}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(mapTask));
  } catch (err) {
    console.error('Tasks GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create new Task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
    const countNum = (count || 0) + 1;
    const newId = `TSK-${String(countNum).padStart(3, '0')}`;

    const payload = {
      id: newId,
      title: req.body.title || 'Untitled Task',
      client: req.body.client || 'General Agency',
      stage: req.body.stage || 'Scripting',
      priority: req.body.priority || 'Medium',
      assignee: req.body.assignee || 'Unassigned',
      due_date: req.body.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    };

    let task = null;
    try {
      const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
      if (!error && data) task = mapTask(data);
    } catch (e) {
      console.warn('Supabase tasks insert warning:', e.message);
    }

    if (!task) {
      task = mapTask({ ...payload, created_at: new Date().toISOString() });
    }

    try {
      const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      broadcast('task_update', (allTasks || [task]).map(mapTask));
    } catch (e) {}

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Task Stage / Assignee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };

    if (req.body.title) updates.title = req.body.title;
    if (req.body.stage) updates.stage = req.body.stage;
    if (req.body.priority) updates.priority = req.body.priority;
    if (req.body.assignee) updates.assignee = req.body.assignee;
    if (req.body.dueDate) updates.due_date = req.body.dueDate;

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    // QC Gate Notification if moved to Internal QC
    if (req.body.stage === 'Internal QC') {
      try {
        const { sendTelegramNotification } = require('../services/bot/notifications');
        const { data: ruhul } = await supabase.from('profiles').select('*').eq('emp_code', 'PBD-006').maybeSingle();
        if (ruhul?.telegram_id) {
          sendTelegramNotification(ruhul.telegram_id,
            `🔍 *Internal QC Review Required*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• Submitted by: *${task.assignee || 'Visualizer'}*\n\nPlease review and either approve for client delivery or send back for revision.`,
            [
              [{ text: '✅ QC Approve → Client Review', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-approve&id=${task.id}` }],
              [{ text: '✏️ Send Back for Revision', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-reject&id=${task.id}` }]
            ],
            true
          );
        }
      } catch(e) {}
    }

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Update Task Stage (Mini App & Board Handoffs)
router.patch('/:id/stage', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage is required' });

    // Fetch existing task to check blockers
    const { data: existing } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (existing && existing.blocked_by) {
      // Check if blocking task is approved
      const { data: blocker } = await supabase.from('tasks').select('stage').eq('id', existing.blocked_by).single();
      if (blocker && blocker.stage !== 'Approved') {
        return res.status(400).json({ error: `Cannot advance task. Blocked by task ${existing.blocked_by}` });
      }
    }

    const updates = { stage, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task PATCH stage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Set Task Dependency (Blocker)
router.patch('/:id/dependency', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { blockedBy } = req.body;

    const updates = { blocked_by: blockedBy || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task dependency error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/qc-approve
router.post('/:id/qc-approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      stage: 'Client Review',
      qc_approved_by: 'PBD-006',
      qc_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task QC Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/qc-reject
router.post('/:id/qc-reject', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      stage: 'Revising',
      qc_feedback: req.body.feedback || 'Revisions needed. Please check with Art Director.',
      qc_rejected_by: 'PBD-006',
      qc_rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task QC Reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Reassign Task
router.post('/:id/reassign', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      assignee: req.body.newAssignee || 'Unassigned',
      reassigned_by: req.user?.name || 'Internal Operations',
      reassign_reason: req.body.reason || 'Workload balancing',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task Reassign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ──────── STUDIO & GEAR BOOKINGS ────────
router.get('/studio-bookings', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('studio_bookings').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    res.json((data || []).map(b => ({
      id: b.id,
      resourceName: b.resource_name,
      resourceType: b.resource_type,
      slot: b.slot,
      bookedByName: b.booked_by_name,
      notes: b.notes,
      status: b.status,
      createdAt: b.created_at
    })));
  } catch (err) {
    console.error('Studio Bookings GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/studio-bookings', requireAuth, async (req, res) => {
  try {
    const newId = `SB-${Date.now()}`;
    const payload = {
      id: newId,
      resource_name: req.body.resourceName || 'Main Studio Room',
      resource_type: req.body.resourceType || 'Studio',
      slot: req.body.slot || 'Full Day',
      booked_by_name: req.body.bookedByName || req.user?.name || 'Staff Member',
      notes: req.body.notes || '',
      status: 'Confirmed'
    };

    const { data, error } = await supabase.from('studio_bookings').insert([payload]).select().single();
    if (error) throw error;

    const booking = {
      id: data.id,
      resourceName: data.resource_name,
      resourceType: data.resource_type,
      slot: data.slot,
      bookedByName: data.booked_by_name,
      notes: data.notes,
      status: data.status,
      createdAt: data.created_at
    };

    const { data: allBookings } = await supabase.from('studio_bookings').select('*');
    broadcast('studio_booking_update', allBookings || []);

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Studio Booking POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Task (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcast('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true });
  } catch (err) {
    console.error('Task DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// SUBTASKS APIs (ClickUp Hierarchy Phase 1)
// ─────────────────────────────────────────────

// GET Subtasks for a task
router.get('/:id/subtasks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('subtasks').select('*').eq('task_id', id).order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Subtasks GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create subtask
router.post('/:id/subtasks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignee } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const payload = {
      task_id: id,
      title: title.trim(),
      assignee: assignee || null,
      completed: false
    };

    const { data, error } = await supabase.from('subtasks').insert([payload]).select().single();
    if (error) throw error;

    broadcast('subtask_update', { taskId: id, action: 'create', subtask: data });
    res.json({ success: true, subtask: data });
  } catch (err) {
    console.error('Subtask POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Toggle subtask completion
router.patch('/subtasks/:subtaskId/toggle', requireAuth, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { completed, user } = req.body;

    const updatePayload = {
      completed: Boolean(completed),
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: user || req.user?.name || 'User'
    };

    const { data, error } = await supabase.from('subtasks').update(updatePayload).eq('id', subtaskId).select().single();
    if (error) throw error;

    broadcast('subtask_update', { taskId: data.task_id, action: 'toggle', subtask: data });
    res.json({ success: true, subtask: data });
  } catch (err) {
    console.error('Subtask TOGGLE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// PATCH /api/tasks/:id/stage — Update workflow stage (List View & Kanban drag-and-drop)
router.patch('/:id/stage', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage is required' });

    const { data, error } = await supabase
      .from('tasks')
      .update({ stage, custom_status: stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    broadcast('task_update', { action: 'stage_change', task: mapTask(data) });
    res.json({ success: true, task: mapTask(data) });
  } catch (err) {
    console.error('Task STAGE update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/log-time', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { hours } = req.body;

    const logged = Number(hours) || 0;
    if (logged <= 0) return res.status(400).json({ error: 'Hours must be greater than 0' });

    const { data: existing } = await supabase.from('tasks').select('logged_hours').eq('id', id).single();
    const newLogged = (Number(existing?.logged_hours) || 0) + logged;

    const { data, error } = await supabase.from('tasks').update({
      logged_hours: newLogged,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, task: mapTask(data) });
  } catch (err) {
    console.error('Task log-time error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
