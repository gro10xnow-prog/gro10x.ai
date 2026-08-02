const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');

function mapProfile(p) {
  if (!p) return null;
  return {
    id: p.emp_code || p.id,
    emp_code: p.emp_code,
    name: p.name,
    role: p.role,
    department: p.department,
    telegramId: p.telegram_id,
    phone: p.phone,
    baseSalary: Number(p.base_salary) || 0,
    commissionRate: Number(p.commission_rate) || 0,
    earnedCommissions: Number(p.earned_commissions) || 0,
    status: p.status || 'In Studio',
    activeBookings: p.active_bookings || 0
  };
}

function mapAttendance(a) {
  if (!a) return null;
  return {
    id: a.id,
    employeeId: a.employee_id,
    name: a.name,
    status: a.status,
    clockInTime: a.clock_in_time,
    location: a.location,
    date: a.date,
    createdAt: a.created_at
  };
}

// GET Team Directory
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
    if (error) throw error;
    res.json((data || []).map(mapProfile));
  } catch (err) {
    console.error('Team GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Profile by Telegram ID
router.get('/tg/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const { data: emp, error } = await supabase.from('profiles').select('*').eq('telegram_id', String(telegramId)).single();
    if (error || !emp) return res.status(404).json({ error: 'Employee not found for given Telegram ID' });

    const { data: myTasks } = await supabase.from('tasks').select('*').ilike('assignee', `%${emp.name}%`);
    const today = new Date().toISOString().split('T')[0];
    const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', emp.emp_code).eq('date', today).maybeSingle();

    res.json({
      profile: mapProfile(emp),
      myTasks: myTasks || [],
      attendanceToday: mapAttendance(att),
      xp: emp.xp || 0
    });
  } catch (err) {
    console.error('Team TG GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Clock In / Attendance Check-in
router.post('/attendance', requireAuth, async (req, res) => {
  try {
    const empId = req.user.linkedId || req.user.id || 'PBD-001';
    const name = req.user.profile?.name || req.user.name || 'Specialist';
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const payload = {
      employee_id: empId,
      name: name,
      status: req.body.status || 'In Studio',
      clock_in_time: req.body.clockInTime || nowTime,
      location: req.body.location || 'Niketon Studio',
      date: today
    };

    const { data: record, error } = await supabase.from('attendance').insert([payload]).select().single();
    if (error) throw error;

    // Update profile status
    await supabase.from('profiles').update({ status: payload.status }).eq('emp_code', empId);

    const { data: allAtt } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    broadcast('attendance_update', (allAtt || []).map(mapAttendance));

    res.json({ success: true, attendance: mapAttendance(record) });
  } catch (err) {
    console.error('Attendance POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Attendance Records
router.get('/attendance', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapAttendance));
  } catch (err) {
    console.error('Attendance GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Leaves
router.get('/leaves', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Leaves GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Submit Leave Request
router.post('/leaves', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('leaves').select('*', { count: 'exact', head: true });
    const newId = `LEV-${String((count || 0) + 1).padStart(3, '0')}`;

    const payload = {
      id: newId,
      staff_id: req.user.linkedId || req.user.id || 'PBD-001',
      staff_name: req.user.profile?.name || req.user.name || 'Team Member',
      type: req.body.type || 'Casual Leave',
      start_date: req.body.fromDate || req.body.startDate || new Date().toISOString().split('T')[0],
      end_date: req.body.toDate || req.body.endDate || new Date().toISOString().split('T')[0],
      total_days: Number(req.body.totalDays) || 1,
      reason: req.body.reason || 'Personal work',
      status: 'Pending Line Review'
    };

    const { data: newLeave, error } = await supabase.from('leaves').insert([payload]).select().single();
    if (error) throw error;

    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', allLeaves || []);

    res.json({ success: true, leave: newLeave });
  } catch (err) {
    console.error('Leave POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Approve/Reject Leave Request
router.put('/leaves/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, reviewed_by: req.user.name, updated_at: new Date().toISOString() };

    const { data: leave, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcast('leave_update', allLeaves || []);

    res.json({ success: true, leave });
  } catch (err) {
    console.error('Leave PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
