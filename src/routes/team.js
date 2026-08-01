const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');

// GET Team Directory
router.get('/', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.team || []);
});

// GET Profile by Telegram ID (For Telegram Mini App authentication)
router.get('/tg/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  const db = readDB();
  const emp = (db.team || []).find(t => String(t.telegramId) === String(telegramId));
  if (!emp) return res.status(404).json({ error: 'Employee not found for given Telegram ID' });

  const tasks = (db.tasks || []).filter(t => (t.assignee || t.assigneeId || '').toLowerCase().includes((emp.name || '').toLowerCase()));
  const today = new Date().toISOString().split('T')[0];
  const attendanceToday = (db.attendance || []).find(a => (a.employeeId === emp.id || a.name === emp.name) && a.date === today);

  res.json({
    profile: emp,
    myTasks: tasks,
    attendanceToday,
    xp: emp.xp || 0
  });
});

// POST Clock In / Attendance Check-in
router.post('/attendance', requireAuth, (req, res) => {
  const db = readDB();
  db.attendance = db.attendance || [];

  const empId = req.user.linkedId || req.user.id || 'EMP-001';
  const name = req.user.profile?.name || req.user.name || 'Specialist';
  const today = new Date().toISOString().split('T')[0];

  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const record = {
    id: `ATT-${Date.now()}`,
    employeeId: empId,
    name: name,
    status: req.body.status || 'In Studio',
    clockInTime: req.body.clockInTime || nowTime,
    location: req.body.location || 'Niketon Studio',
    date: today,
    createdAt: new Date().toISOString()
  };

  db.attendance.unshift(record);

  // Update team member status
  const emp = (db.team || []).find(t => t.id === empId || t.name === name);
  if (emp) {
    emp.status = record.status;
  }

  writeDB(db);
  broadcast('attendance_update', db.attendance);

  res.json({ success: true, attendance: record });
});

// GET Attendance Records
router.get('/attendance', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.attendance || []);
});

// GET Leaves
router.get('/leaves', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.leaves || []);
});

// POST Submit Leave Request
router.post('/leaves', requireAuth, (req, res) => {
  const db = readDB();
  db.leaves = db.leaves || [];

  const newLeave = {
    id: `LEV-${Date.now().toString().slice(-4)}`,
    employeeId: req.user.linkedId || req.user.id,
    name: req.user.profile?.name || req.user.name || 'Team Member',
    type: req.body.type || 'Casual Leave',
    fromDate: req.body.fromDate || new Date().toISOString().split('T')[0],
    toDate: req.body.toDate || new Date().toISOString().split('T')[0],
    reason: req.body.reason || 'Personal work',
    status: 'Pending Line Review',
    createdAt: new Date().toISOString()
  };

  db.leaves.unshift(newLeave);
  writeDB(db);
  broadcast('leave_update', db.leaves);

  // Notify Owner / Manager via Telegram
  try {
    const ownerId = db.settings?.ownerTelegramId || process.env.OWNER_TELEGRAM_ID;
    if (ownerId) {
      sendTelegramNotification(ownerId,
        `📅 *New Leave Request Received*\n\n` +
        `👤 Member: *${newLeave.name}*\n` +
        `🏷️ Type: *${newLeave.type}*\n` +
        `📅 Dates: *${newLeave.fromDate}* to *${newLeave.toDate}*\n` +
        `📝 Reason: ${newLeave.reason}`, null, true
      );
    }
  } catch (err) {}

  res.json({ success: true, leave: newLeave });
});

// PUT Approve/Reject Leave Request (Manager+)
router.put('/leaves/:id', requireAuth, requireManager, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.leaves || []).findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Leave request not found' });

  db.leaves[idx] = { ...db.leaves[idx], ...req.body, reviewedBy: req.user.name, updatedAt: new Date().toISOString() };
  writeDB(db);
  broadcast('leave_update', db.leaves);

  res.json({ success: true, leave: db.leaves[idx] });
});

module.exports = router;
