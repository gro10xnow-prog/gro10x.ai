const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification, getTeamBot } = require('../services/bot');
const { readDB } = require('../services/db');
const { createTempPin } = require('../services/auth-pins');

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function mapProfile(p) {
  if (!p) return null;

  // Calculate surveyProgress from what fields are filled
  let surveyProgress = 0;
  if (p.blood_group || p.personal_email || p.address) surveyProgress = Math.max(surveyProgress, 1);
  if (p.nid_no || p.permanent_address) surveyProgress = Math.max(surveyProgress, 2);
  if (p.bank_info && (p.bank_info.accNo || p.bank_info.mfsNo)) surveyProgress = Math.max(surveyProgress, 3);
  if (p.primary_skill || p.survey_complete) surveyProgress = Math.max(surveyProgress, 4);
  if (p.onboarding_complete) surveyProgress = 5;

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
    surveyComplete: p.survey_complete || false,
    surveyProgress,
    accessLevel: p.access_level || 'Specialist / Crew',
    bankInfo: p.bank_info || {},
    email: p.email || p.work_email || '',
    personalEmail: p.personal_email || '',
    emergencyContact: p.emergency_contact || '',
    address: p.address || '',
    permanentAddress: p.permanent_address || '',
    bloodGroup: p.blood_group || '',
    nidNo: p.nid_no || '',
    primarySkill: p.primary_skill || '',
    joiningDate: p.joining_date || '',
    reportsTo: p.reports_to || '',
    weeklyCapacityHours: Number(p.weekly_capacity_hours) || 40
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

// Helper: lookup employee by telegramId — strictly via Supabase
async function findEmpByTelegramId(telegramId) {
  const state = require('../services/state');
  const emp = await state.getEmployeeByTelegramId(telegramId);
  if (emp) return { source: 'supabase', profile: emp };
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

    // Refetch the full profile with all survey columns to ensure surveyProgress is accurate
    if (supabase) {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('emp_code', empCode)
        .maybeSingle();
      if (fullProfile) {
        Object.assign(found.profile, mapProfile(fullProfile));
      }
    }

    // Fetch tasks assigned to this employee
    let myTasks = [];
    if (supabase) {
      const { data: tasks } = await supabase.from('tasks').select('*').ilike('assignee', `%${empName.split(' ')[0]}%`);
      myTasks = tasks || [];
    } else {
      const db = found.db || (await readDB());
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
      const db = await readDB();
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
    const db = await readDB();
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
      const db = found.db || (await readDB());
      tasks = (db.tasks || []).filter(t => (t.assignee || '').toLowerCase().includes(firstName.toLowerCase()));
    }

    res.json(tasks);
  } catch (err) {
    console.error('GET /team/tasks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/daily-activity   ← Phase 2: Mini App EOD Auto-fill
// ─────────────────────────────────────────────────────────────────────────────
router.get('/daily-activity', async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });
    
    const empName = found.profile.name || 'Crew Member';
    
    let subtasksCompleted = [];
    if (supabase) {
      // Get today's start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('subtasks')
        .select('title, task_id')
        .eq('completed', true)
        .eq('completed_by', empName)
        .gte('completed_at', today.toISOString());
        
      if (!error && data) {
        subtasksCompleted = data;
      }
    }

    // Build markdown string
    let autoFillText = "Today's Activity:\n";
    if (subtasksCompleted.length > 0) {
      subtasksCompleted.forEach(st => {
        autoFillText += `- ✅ Completed subtask: ${st.title}\n`;
      });
    } else {
      autoFillText += "- Worked on assigned tasks\n";
    }
    
    autoFillText += "\nBlockers:\n- None";

    res.json({ text: autoFillText });
  } catch (err) {
    console.error('GET /team/daily-activity error:', err.message);
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

    broadcast('attendance_update', [{ employee_id: empCode, status: 'In Studio', clock_in_time: nowTime }]);
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

    broadcast('attendance_update', [{ employee_id: empCode, status: 'Clocked Out', clock_out_time: nowTime }]);
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

    broadcast('team_update', [{ emp_code: empCode, xp: currentXP, badge }]);

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

      broadcast('team_update', [{ emp_code: empCode, onboarding_complete: true, agreement_stage: 1 }]);

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
        let borhanTgId = null;
        if (supabase) {
          const { data: borhan } = await supabase.from('profiles').select('telegram_id').eq('emp_code', 'PBD-029').maybeSingle();
          borhanTgId = borhan?.telegram_id;
        }
        if (!borhanTgId) {
          const db2 = await readDB();
          borhanTgId = (db2.team || []).find(t => t.id === 'PBD-029')?.telegramId;
        }
        if (borhanTgId) {
          await sendTelegramNotification(
            borhanTgId,
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

// POST /api/team — Add New Team Member & Generate Portal Access
router.post('/', requireAuth, requireManager, async (req, res) => {
  try {
    const { name, role, department, phone, pin, baseSalary, bkashNo } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const normalizedPhone = normalizePhone(phone);
    const { data: countData } = await supabase.from('team_members').select('id');
    const newEmpCode = `PBD-${String((countData?.length || 0) + 1).padStart(3, '0')}`;

    const payload = {
      emp_code: newEmpCode,
      name,
      role: role || 'Production Specialist',
      department: department || 'Production',
      phone: normalizedPhone,
      base_salary: Number(baseSalary) || 0,
      status: 'Active',
      access_level: 'Specialist / Crew',
      bank_info: { mfsType: 'bKash', mfsNo: bkashNo || normalizedPhone },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('team_members').insert([payload]).select().single();
    if (error) throw error;

    // Register login credentials immediately (phone + PIN) for /crew portal access
    let pinRecord = null;
    try {
      const providedPin = pin && pin.length === 4 ? pin : null;
      pinRecord = await createTempPin(normalizedPhone, newEmpCode, 'team', '');
      // If a specific PIN was provided, update it immediately
      if (providedPin && pinRecord) {
        await supabase.from('pins').update({ pin: providedPin, is_permanent: true })
          .eq('phone', normalizedPhone);
        pinRecord.pin = providedPin;
      }
    } catch (pinErr) {
      console.warn('PIN registration warning (non-critical):', pinErr.message);
    }

    const member = mapProfile(data);
    const { data: allTeam } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
    broadcast('team_update', (allTeam || []).map(mapProfile));

    res.json({
      success: true,
      member,
      credentials: pinRecord ? {
        phone: normalizedPhone,
        pin: pinRecord.pin,
        portalUrl: '/crew'
      } : null
    });
  } catch (err) {
    console.error('Team Member POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/workload — Get workload & capacity stats for team members
router.get('/workload', requireAuth, async (req, res) => {
  try {
    let team = [];
    try {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) team = data;
    } catch(e) {}
    if (team.length === 0) {
      const db = await readDB();
      team = db.team || [];
    }

    let tasks = [];
    try {
      const { data } = await supabase.from('tasks').select('*');
      if (data) tasks = data;
    } catch(e) {}

    const workloadList = team.map(member => {
      const name = member.name || 'Team Member';
      const empCode = member.emp_code || member.id || name;
      const capacity = Number(member.weekly_capacity_hours) || 40;

      const memberTasks = tasks.filter(t => {
        const stage = (t.stage || '').toLowerCase();
        if (stage.includes('approved') || stage.includes('done') || stage.includes('completed')) return false;
        const assignee = (t.assignee || '').toLowerCase();
        return assignee.includes(name.toLowerCase()) || assignee.includes(empCode.toLowerCase());
      });

      const assignedHours = memberTasks.reduce((sum, t) => sum + (Number(t.estimated_hours || t.estimatedHours) || 0), 0);
      const loggedHours = memberTasks.reduce((sum, t) => sum + (Number(t.logged_hours || t.loggedHours) || 0), 0);
      const workloadPercent = Math.round((assignedHours / capacity) * 100);

      let status = 'Available';
      if (workloadPercent >= 100) status = 'Overloaded';
      else if (workloadPercent >= 75) status = 'Balanced';

      return {
        id: empCode,
        empCode,
        name,
        role: member.role || 'Specialist',
        department: member.department || 'Production',
        weeklyCapacityHours: capacity,
        assignedHours,
        loggedHours,
        activeTasksCount: memberTasks.length,
        workloadPercent,
        status,
        availableCapacityHours: Math.max(0, capacity - assignedHours)
      };
    });

    res.json(workloadList);
  } catch (err) {
    console.error('Workload GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/best-match — Recommend best assignee for a task based on department & available capacity
router.get('/best-match', requireAuth, async (req, res) => {
  try {
    const { department, estimatedHours } = req.query;
    const taskEst = Number(estimatedHours) || 0;

    let team = [];
    try {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) team = data;
    } catch(e) {}
    if (team.length === 0) {
      const db = await readDB();
      team = db.team || [];
    }

    let tasks = [];
    try {
      const { data } = await supabase.from('tasks').select('*');
      if (data) tasks = data;
    } catch(e) {}

    const candidates = team.map(member => {
      const name = member.name || 'Team Member';
      const empCode = member.emp_code || member.id || name;
      const capacity = Number(member.weekly_capacity_hours) || 40;
      const dept = member.department || 'Production';

      const memberTasks = tasks.filter(t => {
        const stage = (t.stage || '').toLowerCase();
        if (stage.includes('approved') || stage.includes('done') || stage.includes('completed')) return false;
        const assignee = (t.assignee || '').toLowerCase();
        return assignee.includes(name.toLowerCase()) || assignee.includes(empCode.toLowerCase());
      });

      const assignedHours = memberTasks.reduce((sum, t) => sum + (Number(t.estimated_hours || t.estimatedHours) || 0), 0);
      const freeHours = Math.max(0, capacity - assignedHours);

      let deptMatch = false;
      if (department) {
        deptMatch = dept.toLowerCase().includes(department.toLowerCase()) || department.toLowerCase().includes(dept.toLowerCase());
      }

      return {
        id: empCode,
        empCode,
        name,
        role: member.role || 'Specialist',
        department: dept,
        weeklyCapacityHours: capacity,
        assignedHours,
        freeHours,
        deptMatch,
        canFitTask: freeHours >= taskEst
      };
    });

    candidates.sort((a, b) => {
      if (a.deptMatch !== b.deptMatch) return b.deptMatch ? 1 : -1;
      return b.freeHours - a.freeHours;
    });

    res.json({
      bestMatch: candidates[0] || null,
      recommendations: candidates
    });
  } catch (err) {
    console.error('Best Match GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
