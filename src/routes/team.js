const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification, getTeamBot } = require('../services/bot');
const { readDB, writeDB } = require('../services/db');

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

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
    activeBookings: p.active_bookings || 0,
    xp: p.xp || 0,
    badge: p.badge || '🌱 Recruit',
    onboardingComplete: p.onboarding_complete || false,
    accessLevel: p.access_level || 'Specialist / Crew',
    bankInfo: p.bank_info || {},
    email: p.email || p.work_email || '',
    emergencyContact: p.emergency_contact || '',
    address: p.address || '',
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

// Helper: lookup employee by telegramId — checks Supabase first, falls back to db.json
async function findEmpByTelegramId(telegramId) {
  // 1. Supabase lookup
  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', String(telegramId))
      .maybeSingle();
    if (data) return { source: 'supabase', profile: data };
  }
  // 2. db.json fallback (handles cold-start / unseeded Supabase)
  const db = readDB();
  const emp = (db.team || []).find(e => String(e.telegramId) === String(telegramId));
  if (emp) return { source: 'db', profile: emp, db };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/me?telegramId=xxx   ← Mini App init call
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;

    // Fetch tasks assigned to this employee
    let myTasks = [];
    if (supabase) {
      const { data: tasks } = await supabase.from('tasks').select('*').ilike('assignee', `%${empName.split(' ')[0]}%`);
      myTasks = tasks || [];
    } else {
      const db = found.db || readDB();
      myTasks = (db.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes(empName.split(' ')[0].toLowerCase()));
    }

    // Fetch today's attendance
    const today = new Date().toISOString().split('T')[0];
    let attendanceToday = null;
    if (supabase) {
      const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', empCode).eq('date', today).maybeSingle();
      attendanceToday = mapAttendance(att);
    }

    res.json({
      profile: mapProfile(emp),
      myTasks,
      attendanceToday,
      xp: emp.xp || 0
    });
  } catch (err) {
    console.error('GET /team/me error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/snapshot   ← Mini App home: team status counts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/snapshot', async (req, res) => {
  try {
    let team = [];
    if (supabase) {
      const { data } = await supabase.from('profiles').select('name, status, role, department');
      team = data || [];
    } else {
      const db = readDB();
      team = db.team || [];
    }

    const snapshot = {
      total: team.length,
      inStudio: team.filter(m => m.status === 'In Studio').length,
      onShoot: team.filter(m => m.status === 'On Field Shoot').length,
      onLeave: team.filter(m => m.status === 'On Leave').length,
      offline: team.filter(m => !m.status || m.status === 'Offline').length,
    };
    res.json(snapshot);
  } catch (err) {
    console.error('GET /team/snapshot error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/roster   ← Mini App roster page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/roster', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
      if (error) throw error;
      return res.json((data || []).map(mapProfile));
    }
    const db = readDB();
    res.json((db.team || []).map(emp => mapProfile({ ...emp, emp_code: emp.id, telegram_id: emp.telegramId })));
  } catch (err) {
    console.error('GET /team/roster error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/tasks?telegramId=xxx   ← Mini App tasks page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const firstName = (found.profile.name || '').split(' ')[0];
    let tasks = [];

    if (supabase) {
      const { data } = await supabase.from('tasks').select('*').ilike('assignee', `%${firstName}%`);
      tasks = data || [];
    } else {
      const db = found.db || readDB();
      tasks = (db.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes(firstName.toLowerCase()));
    }

    res.json(tasks);
  } catch (err) {
    console.error('GET /team/tasks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/clockin   ← Mini App clock-in button (with GPS)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/clockin', async (req, res) => {
  try {
    const { telegramId, location, latitude, longitude } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const locationStr = location || (latitude && longitude ? `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Niketon Studio');

    // Write to Supabase attendance
    if (supabase) {
      await supabase.from('attendance').upsert({
        employee_id: empCode,
        name: empName,
        status: 'In Studio',
        clock_in_time: nowTime,
        location: locationStr,
        date: today
      }, { onConflict: 'employee_id,date' });

      await supabase.from('profiles').update({ status: 'In Studio' }).eq('emp_code', empCode);
    }

    // Also sync to db.json so bot reads correctly
    const db = readDB();
    const dbEmp = (db.team || []).find(e => e.id === empCode || String(e.telegramId) === String(telegramId));
    if (dbEmp) {
      dbEmp.status = 'In Studio';
      let record = (db.attendance || []).find(a => a.employeeId === empCode || a.name === empName);
      if (record) { record.status = 'In Studio'; record.clockInTime = nowTime; record.location = locationStr; }
      else { (db.attendance = db.attendance || []).push({ employeeId: empCode, name: empName, status: 'In Studio', clockInTime: nowTime, location: locationStr }); }
      writeDB(db);
    }

    broadcast('attendance_update', db.attendance || []);
    res.json({ success: true, time: nowTime, status: 'In Studio' });
  } catch (err) {
    console.error('POST /team/clockin error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/clockout   ← Mini App clock-out button
// ─────────────────────────────────────────────────────────────────────────────
router.post('/clockout', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (supabase) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('attendance').update({ status: 'Clocked Out', clock_out_time: nowTime }).eq('employee_id', empCode).eq('date', today);
      await supabase.from('profiles').update({ status: 'Offline' }).eq('emp_code', empCode);
    }

    const db = readDB();
    const dbEmp = (db.team || []).find(e => e.id === empCode || String(e.telegramId) === String(telegramId));
    if (dbEmp) {
      dbEmp.status = 'Offline';
      const rec = (db.attendance || []).find(a => a.employeeId === empCode || a.name === emp.name);
      if (rec) rec.status = 'Clocked Out';
      writeDB(db);
    }

    broadcast('attendance_update', db.attendance || []);
    res.json({ success: true, time: nowTime, status: 'Offline' });
  } catch (err) {
    console.error('POST /team/clockout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/survey   ← Mini App profile survey parts 1-4
// Body: { telegramId, part, data }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/survey', async (req, res) => {
  try {
    const { telegramId, part, data: partData } = req.body;
    if (!telegramId || !part) return res.status(400).json({ error: 'telegramId and part required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;

    // XP awarded per part
    const XP_PER_PART = { 1: 100, 2: 150, 3: 200, 4: 100 };
    const xpEarned = XP_PER_PART[part] || 50;
    const currentXP = (emp.xp || 0) + xpEarned;

    // Determine badge based on total XP
    let badge = '🌱 Recruit';
    if (currentXP >= 500) badge = '⭐ Rising Star';
    if (currentXP >= 1000) badge = '🔥 Performer';
    if (currentXP >= 2000) badge = '💜 Champion';

    // Build Supabase profile update based on part
    const profileUpdate = { xp: currentXP, badge, updated_at: new Date().toISOString() };

    if (part === 1 && partData) {
      if (partData.emergencyPhone) profileUpdate.emergency_contact = partData.emergencyPhone;
      if (partData.address) profileUpdate.address = partData.address;
      if (partData.personalEmail) profileUpdate.personal_email = partData.personalEmail;
      if (partData.bloodGroup) profileUpdate.blood_group = partData.bloodGroup;
    }
    if (part === 2 && partData) {
      if (partData.nidNo) profileUpdate.nid_no = partData.nidNo;
      if (partData.permanentAddress) profileUpdate.permanent_address = partData.permanentAddress;
    }
    if (part === 3 && partData) {
      // Bank info stored as JSONB
      profileUpdate.bank_info = {
        bankName: partData.bankName || '',
        accountTitle: partData.accountTitle || '',
        accNo: partData.accountNo || '',
        branch: partData.branch || '',
        mfsNo: partData.bkashNo || partData.nagadNo || ''
      };
    }
    if (part === 4 && partData) {
      if (partData.primarySkill) profileUpdate.primary_skill = partData.primarySkill;
      // Part 4 completion → survey done, unlock full menu after agreement
      profileUpdate.survey_complete = true;
    }

    // Update Supabase
    if (supabase) {
      await supabase.from('profiles').update(profileUpdate).eq('emp_code', empCode);
    }

    // Also sync to db.json
    const db = found.db || readDB();
    const dbEmp = (db.team || []).find(e => e.id === empCode || String(e.telegramId) === String(telegramId));
    if (dbEmp) {
      dbEmp.xp = currentXP;
      dbEmp.badge = badge;
      if (part === 1 && partData) {
        if (partData.emergencyPhone) dbEmp.emergencyContact = partData.emergencyPhone;
        if (partData.address) dbEmp.address = partData.address;
      }
      if (part === 3 && partData) {
        dbEmp.bankInfo = profileUpdate.bank_info;
      }
      writeDB(db);
    }

    broadcast('team_update', db.team || []);

    // Send bot notification for XP milestone
    try {
      const teamBot = getTeamBot();
      if (teamBot && telegramId) {
        const partNames = { 1: 'Personal Profile', 2: 'Verification Docs', 3: 'Financial Setup', 4: 'Skills & Equipment' };
        await teamBot.sendMessage(telegramId,
          `🏆 *Part ${part} Complete — ${partNames[part] || 'Survey'}!*\n\n` +
          `+${xpEarned} XP earned! Total: *${currentXP} XP* (${badge})\n\n` +
          (part === 4 ? `🎉 *Survey complete!* Now sign your employment agreement to fully unlock your account.` : `💪 Keep going — Part ${part + 1} next!`),
          { parse_mode: 'Markdown' }
        );
      }
    } catch (e) { /* non-critical */ }

    res.json({ success: true, xp: currentXP, badge, part });
  } catch (err) {
    console.error('POST /team/survey error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/agreement   ← Mini App employment agreement e-sign
// Body: { telegramId, stage, signature, timestamp }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/agreement', async (req, res) => {
  try {
    const { telegramId, stage, signature, timestamp } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;

    // Stage 1: Employee signs → unlock full account, notify Finance Manager
    if (stage === 1) {
      const profileUpdate = {
        agreement_stage: 1,
        agreement_signed_at: timestamp || new Date().toISOString(),
        employee_signature: signature,
        onboarding_complete: true, // ← unlock full menu after signing!
        updated_at: new Date().toISOString()
      };

      if (supabase) {
        await supabase.from('profiles').update(profileUpdate).eq('emp_code', empCode);
      }

      // Sync to db.json — this is what the bot reads for menu rendering
      const db = found.db || readDB();
      const dbEmp = (db.team || []).find(e => e.id === empCode || String(e.telegramId) === String(telegramId));
      if (dbEmp) {
        dbEmp.onboardingComplete = true;
        dbEmp.agreementStage = 1;
        dbEmp.agreementSignedAt = profileUpdate.agreement_signed_at;
        writeDB(db);
      }
      broadcast('team_update', db.team || []);

      // Send bot congrats + unlock notification
      try {
        const teamBot = getTeamBot();
        if (teamBot && telegramId) {
          const keyboard = { keyboard: [], resize_keyboard: true }; // will be repopulated on next /start
          await teamBot.sendMessage(telegramId,
            `🎉 *Agreement Signed — You're Officially Activated!*\n\n` +
            `Welcome to the Purplebot Digital team, *${empName}*!\n\n` +
            `✅ Your account is now fully unlocked.\n` +
            `📱 Tap */start* to open your full dashboard menu.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (e) { /* non-critical */ }

      // Notify Finance Manager (Borhan - PBD-029) via Telegram
      try {
        const db2 = readDB();
        const borhan = (db2.team || []).find(t => t.id === 'PBD-029');
        if (borhan?.telegramId) {
          await sendTelegramNotification(
            borhan.telegramId,
            `📝 *Employment Agreement — Stage 2 Countersign Required*\n\n` +
            `• Employee: *${empName}* (${empCode})\n` +
            `• Role: *${emp.role}*\n` +
            `• Employee signed at: ${new Date().toLocaleString('en-GB')}\n\n` +
            `Please countersign the agreement as Finance Manager.`,
            [[{ text: '✅ Countersign Agreement', callback_data: `agr_stage2:${empCode}` }]],
            true
          );
        }
      } catch (e) { /* non-critical */ }

      return res.json({ success: true, stage: 1, onboardingComplete: true, message: 'Agreement signed. Account fully unlocked!' });
    }

    res.json({ success: true, stage, message: `Stage ${stage} processed` });
  } catch (err) {
    console.error('POST /team/agreement error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/   ← Web panel team directory (requires auth)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/tg/:telegramId   ← Legacy route (keep for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tg/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found for given Telegram ID' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;

    let myTasks = [];
    if (supabase) {
      const { data: tasks } = await supabase.from('tasks').select('*').ilike('assignee', `%${empName.split(' ')[0]}%`);
      myTasks = tasks || [];
    }

    const today = new Date().toISOString().split('T')[0];
    let att = null;
    if (supabase) {
      const { data } = await supabase.from('attendance').select('*').eq('employee_id', empCode).eq('date', today).maybeSingle();
      att = data;
    }

    res.json({
      profile: mapProfile(emp),
      myTasks,
      attendanceToday: mapAttendance(att),
      xp: emp.xp || 0
    });
  } catch (err) {
    console.error('Team TG GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/attendance   ← Web panel clock-in (requires auth)
// ─────────────────────────────────────────────────────────────────────────────
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

    await supabase.from('profiles').update({ status: payload.status }).eq('emp_code', empId);

    const { data: allAtt } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    broadcast('attendance_update', (allAtt || []).map(mapAttendance));

    res.json({ success: true, attendance: mapAttendance(record) });
  } catch (err) {
    console.error('Attendance POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/attendance
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

// GET /api/team/leaves
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

// POST /api/team/leaves
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

// PUT /api/team/leaves/:id
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
