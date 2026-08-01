const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { processAutomationEvent } = require('../services/automation');

// GET Tasks (Supports ?dept= and ?assignee= filters)
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  let tasks = db.tasks || [];

  const { dept, assignee } = req.query;

  if (dept) {
    tasks = tasks.filter(t => (t.department || t.category || '').toLowerCase().includes(dept.toLowerCase()));
  }

  if (assignee) {
    tasks = tasks.filter(t => (t.assignee || t.assigneeId || '').toLowerCase().includes(assignee.toLowerCase()));
  }

  res.json(tasks);
});

// POST Create new Task
router.post('/', requireAuth, (req, res) => {
  const db = readDB();
  db.tasks = db.tasks || [];
  const count = db.tasks.length + 1;

  const newTask = {
    id: `TSK-${String(count).padStart(3, '0')}`,
    title: req.body.title || 'Untitled Task',
    client: req.body.client || 'General Agency',
    stage: req.body.stage || 'Scripting',
    priority: req.body.priority || 'Medium',
    assignee: req.body.assignee || 'Unassigned',
    dueDate: req.body.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  db.tasks.push(newTask);
  writeDB(db);
  broadcast('task_update', db.tasks);

  res.json({ success: true, task: newTask });
});

// PUT Update Task Stage / Assignee (Fires automation trigger)
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.tasks || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const oldStage = db.tasks[idx].stage;
  const updatedTask = { ...db.tasks[idx], ...req.body, updatedAt: new Date().toISOString() };
  db.tasks[idx] = updatedTask;

  // Trigger automation if stage changed
  if (req.body.stage && req.body.stage !== oldStage) {
    processAutomationEvent('task_stage_change', { task: updatedTask, stage: req.body.stage, oldStage }, db, writeDB, broadcast);

    // 🎨 QC GATE — If moved to Internal QC, ping Ruhul (Art Director) immediately
    if (req.body.stage === 'Internal QC') {
      try {
        const { sendTelegramNotification } = require('../services/bot');
        const ruhul = (db.team || []).find(t => t.id === 'PBD-006');
        if (ruhul?.telegramId) {
          sendTelegramNotification(ruhul.telegramId,
            `🔍 *Internal QC Review Required*\n\n• Task: *${updatedTask.title}*\n• Client: *${updatedTask.client || 'Agency'}*\n• Submitted by: *${updatedTask.assignee || 'Visualizer'}*\n\nPlease review and either approve for client delivery or send back for revision.`,
            [
              [{ text: '✅ QC Approve → Client Review', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-approve&id=${updatedTask.id}` }],
              [{ text: '✏️ Send Back for Revision', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-reject&id=${updatedTask.id}` }]
            ],
            true
          );
        }
      } catch(e) {}
    }
  }

  writeDB(db);
  broadcast('task_update', db.tasks);

  res.json({ success: true, task: db.tasks[idx] });
});

// ──────── ART DIRECTOR QC GATE (Ruhul's Design Approval) ────────

// POST /api/tasks/:id/qc-approve — Ruhul internally approves, moves to Client Review
router.post('/:id/qc-approve', requireAuth, (req, res) => {
  const db = readDB();
  const idx = (db.tasks || []).findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const task = db.tasks[idx];
  task.stage = 'Client Review';
  task.qcApprovedBy = 'PBD-006'; // Ruhul
  task.qcApprovedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  writeDB(db);
  broadcast('task_update', db.tasks);

  // Notify Mehedi (CC) + assignee that it's approved and in Client Review
  try {
    const { sendTelegramNotification } = require('../services/bot');
    // Notify assignee
    const assignee = (db.team || []).find(t => (t.name || '').toLowerCase().includes((task.assignee || '').toLowerCase()));
    if (assignee?.telegramId) {
      sendTelegramNotification(assignee.telegramId,
        `✅ *Art Director QC Approved!*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n\nYour creative has passed internal QC by Ruhul Amin Rupom and is now in *Client Review*. Well done! 🎨`,
        null, true
      );
    }
    // CC Mehedi
    const mehedi = (db.team || []).find(t => t.id === 'PBD-003');
    if (mehedi?.telegramId) {
      sendTelegramNotification(mehedi.telegramId,
        `[FYI] 🎨 *Creative Approved — In Client Review*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• QC By: Ruhul Amin Rupom (Art Director)`,
        [[{ text: '🌐 View Task', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]],
        true
      );
    }
  } catch(e) {}

  res.json({ success: true, task });
});

// POST /api/tasks/:id/qc-reject — Ruhul rejects, returns to visualizer for revision
router.post('/:id/qc-reject', requireAuth, (req, res) => {
  const { feedback } = req.body;
  const db = readDB();
  const idx = (db.tasks || []).findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const task = db.tasks[idx];
  task.stage = 'Revising'; // Return to visualizer
  task.qcFeedback = feedback || 'Revisions needed. Please check with Ruhul bhai.';
  task.qcRejectedBy = 'PBD-006';
  task.qcRejectedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  writeDB(db);
  broadcast('task_update', db.tasks);

  // Notify the visualizer
  try {
    const { sendTelegramNotification } = require('../services/bot');
    const assignee = (db.team || []).find(t => (t.name || '').toLowerCase().includes((task.assignee || '').toLowerCase()));
    if (assignee?.telegramId) {
      sendTelegramNotification(assignee.telegramId,
        `✏️ *Design Revision Needed*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n\n*Art Director Feedback:*\n"${task.qcFeedback}"\n\nPlease revise and resubmit for QC.`,
        [[{ text: '🌐 Open Task', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]],
        true
      );
    }
  } catch(e) {}

  res.json({ success: true, task });
});

// POST Reassign Task (Internal Ops / Zahin Authority)
router.post('/:id/reassign', requireAuth, (req, res) => {
  const { id } = req.params;
  const { newAssignee, reason } = req.body;
  const db = readDB();
  const idx = (db.tasks || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const task = db.tasks[idx];
  const oldAssignee = task.assignee;
  task.assignee = newAssignee || task.assignee;
  task.reassignedBy = req.user?.name || 'Internal Operations';
  task.reassignReason = reason || 'Workload rebalancing';
  task.updatedAt = new Date().toISOString();

  // Notify new assignee via Telegram
  try {
    const { sendTelegramNotification } = require('../services/bot');
    const newEmp = (db.team || []).find(t => (t.name || '').toLowerCase().includes((newAssignee || '').toLowerCase()));
    if (newEmp?.telegramId) {
      sendTelegramNotification(newEmp.telegramId,
        `📋 *Task Reassigned to You*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• Reassigned by: *Md. Zahin Khandaker (Internal Ops)*\n• Reason: ${reason || 'Workload balancing'}\n\nPlease check your tasks list in Telegram.`,
        null, true
      );
    }
  } catch(e) {}

  writeDB(db);
  broadcast('task_update', db.tasks);
  res.json({ success: true, task });
});

// ──────── STUDIO & GEAR BOOKINGS ────────
router.get('/studio-bookings', requireAuth, async (req, res) => {
  const { supabase, isSupabaseConfigured } = require('../services/supabase');
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('studio_bookings').select('*');
    if (!error && data) {
      return res.json(data.map(b => ({
        ...b,
        resourceName: b.resource_name,
        resourceType: b.resource_type,
        bookedByName: b.booked_by_name,
        createdAt: b.created_at
      })));
    }
  }
  const db = readDB();
  res.json(db.studioBookings || []);
});

router.post('/studio-bookings', requireAuth, async (req, res) => {
  const { resourceName, resourceType, slot, bookedByName, notes } = req.body;
  const { supabase, isSupabaseConfigured } = require('../services/supabase');

  const newBooking = {
    id: `SB-${Date.now()}`,
    resourceName: resourceName || 'Main Studio Room',
    resourceType: resourceType || 'Studio',
    slot: slot || 'Full Day',
    bookedByName: bookedByName || req.user?.name || 'Staff Member',
    notes: notes || '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const payload = {
      id: newBooking.id,
      resource_name: newBooking.resourceName,
      resource_type: newBooking.resourceType,
      slot: newBooking.slot,
      booked_by_name: newBooking.bookedByName,
      notes: newBooking.notes,
      status: newBooking.status
    };
    const { error } = await supabase.from('studio_bookings').insert([payload]);
    if (!error) {
      broadcast('studio_booking_update', [newBooking]);
      return res.json({ success: true, booking: newBooking });
    }
  }

  const db = readDB();
  db.studioBookings = db.studioBookings || [];
  db.studioBookings.push(newBooking);
  writeDB(db);
  broadcast('studio_booking_update', db.studioBookings);

  res.json({ success: true, booking: newBooking });
});

// DELETE Task (Admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.tasks = (db.tasks || []).filter(t => t.id !== id);
  writeDB(db);
  broadcast('task_update', db.tasks);
  res.json({ success: true });
});

module.exports = router;
