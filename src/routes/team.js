const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { verifyTelegramInitData, requireMiniAppAuth } = require('../middleware/telegramAuth');
const rateLimit = require('express-rate-limit');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const cache = require('../services/cache');

function broadcastTeamEvent(eventType, data) {
  cache.delByPrefix('team:');
  try {
    return broadcast(eventType, data);
  } catch (e) {}
}
const { sendTelegramNotification, getTeamBot } = require('../services/bot');
const { readDB } = require('../services/db');
const { createTempPin } = require('../services/auth-pins');

const { uploadFile } = require('../services/storage');
const { normalizePhone } = require('../utils/phone');
const { getFirstName, getPreferredName, matchesAssignee } = require('../utils/name');
const { getBadge } = require('../utils/xp');

const miniAppLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute.' }
});

const DEFAULT_TEAM = [
  { emp_code: 'PBD-000', name: 'Firoz Uddin Ahmed', role: 'Technology Admin', department: 'Tech & AI', status: 'In Studio', phone: '+8801708459008', access_level: 'Technology Admin', base_salary: 95000, commission_rate: 5, onboarding_complete: true, survey_complete: true, xp: 2500, badge: '⚡ Tech Admin' },
  { emp_code: 'PBD-001', name: 'H. M. Ifteker Mahmud', role: 'Managing Director', department: 'Top Management', status: 'In Studio', phone: '+8801612309290', access_level: 'Managing Director', base_salary: 140000, commission_rate: 8, onboarding_complete: true, survey_complete: true, xp: 2400, badge: '🚀 Managing Director' },
  { emp_code: 'PBD-002', name: 'S M Tariful Islam', role: 'Chairman', department: 'Top Management', status: 'In Studio', phone: '+8801708455081', access_level: 'Owner', base_salary: 150000, commission_rate: 10, onboarding_complete: true, survey_complete: true, xp: 2600, badge: '👑 Chairman' },
  { emp_code: 'PBD-003', name: 'MD Mehedi Bin Jayed', role: 'Head of Client & Growth', department: 'Leadership', status: 'In Studio', phone: '+8801874079687', access_level: 'Line Manager', base_salary: 90000, commission_rate: 5, onboarding_complete: true, survey_complete: true, xp: 1900, badge: '💼 Growth Lead' },
  { emp_code: 'PBD-004', name: 'Kafil Uddin Mahmud', role: 'Head of Business Operations', department: 'Leadership', status: 'In Studio', phone: '+8801612309290', access_level: 'Line Manager', base_salary: 90000, commission_rate: 5, onboarding_complete: true, survey_complete: true, xp: 1900, badge: '⚙️ Ops Lead' },
  { emp_code: 'PBD-005', name: 'Md. Zahin Khandaker', role: 'Head of Internal Operations', department: 'Leadership', status: 'In Studio', phone: '+8801627737348', access_level: 'Technology Admin', base_salary: 95000, commission_rate: 5, onboarding_complete: true, survey_complete: true, xp: 2100, badge: '⚡ Internal Ops Lead' },
  { emp_code: 'PBD-006', name: 'Ruhul Amin Rupom', role: 'Art Director', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801711413766', access_level: 'Line Manager', base_salary: 85000, commission_rate: 4, onboarding_complete: true, survey_complete: true, xp: 1800, badge: '🎨 Art Director' },
  { emp_code: 'PBD-007', name: 'Mahmudul Hasan Shuvo', role: 'Senior Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801622926502', access_level: 'Specialist / Crew', base_salary: 65000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1500, badge: '🖌️ Senior Visualizer' },
  { emp_code: 'PBD-008', name: 'Shahjalal Badsha Arif', role: 'Senior Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801980341566', access_level: 'Specialist / Crew', base_salary: 65000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1500, badge: '🖌️ Senior Visualizer' },
  { emp_code: 'PBD-009', name: 'Asmaul Husna Kamona', role: 'Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801794054015', access_level: 'Specialist / Crew', base_salary: 50000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1300, badge: '🎨 Visualizer' },
  { emp_code: 'PBD-010', name: 'Omar Faruq Rony', role: 'Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801623851701', access_level: 'Specialist / Crew', base_salary: 50000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1300, badge: '🎨 Visualizer' },
  { emp_code: 'PBD-011', name: 'Shalmir Rahman Shihab', role: 'Associate Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801798274976', access_level: 'Specialist / Crew', base_salary: 40000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1100, badge: '🌱 Associate Visualizer' },
  { emp_code: 'PBD-012', name: 'Anik Saha', role: 'Associate Visualizer', department: 'Design & Post-Production', status: 'In Studio', phone: '+8801786681030', access_level: 'Specialist / Crew', base_salary: 40000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1100, badge: '🌱 Associate Visualizer' },
  { emp_code: 'PBD-013', name: 'Nasir Ullah Khan Al Nahian', role: 'Head of Production', department: 'Content Production', status: 'In Studio', phone: '+8801685662296', access_level: 'Line Manager', base_salary: 85000, commission_rate: 4, onboarding_complete: true, survey_complete: true, xp: 1800, badge: '🎬 Production Lead' },
  { emp_code: 'PBD-014', name: 'S. M. Masud Ur Rahman Pial', role: 'Senior Copywriter', department: 'Content Production', status: 'In Studio', phone: '+8801911571156', access_level: 'Specialist / Crew', base_salary: 60000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1400, badge: '✍️ Senior Copywriter' },
  { emp_code: 'PBD-015', name: 'Md. Shadly Benzadid Arefin', role: 'AI Prompt Engineer', department: 'Content Production', status: 'In Studio', phone: '+8801680066637', access_level: 'Specialist / Crew', base_salary: 55000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1350, badge: '🤖 AI Specialist' },
  { emp_code: 'PBD-016', name: 'Tasin Kabir', role: 'Senior Manager, Client Services', department: 'Client Services', status: 'In Studio', phone: '+8801709952672', access_level: 'Line Manager', base_salary: 75000, commission_rate: 4, onboarding_complete: true, survey_complete: true, xp: 1600, badge: '💼 CS Manager' },
  { emp_code: 'PBD-017', name: 'Sayed Ashraf', role: 'Assistant Manager, Client Services', department: 'Client Services', status: 'In Studio', phone: '+8801617410967', access_level: 'Specialist / Crew', base_salary: 50000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1300, badge: '🤝 Assistant Manager' },
  { emp_code: 'PBD-018', name: 'Rimjhim Rashid', role: 'Assistant Manager, Client Services', department: 'Client Services', status: 'In Studio', phone: '+8801759768962', access_level: 'Specialist / Crew', base_salary: 50000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1300, badge: '🤝 Assistant Manager' },
  { emp_code: 'PBD-019', name: 'Shafket Hossan Pranto', role: 'Assistant Manager, Strategy & Planning', department: 'Strategy & Planning', status: 'In Studio', phone: '+8801804217607', access_level: 'Specialist / Crew', base_salary: 50000, commission_rate: 3, onboarding_complete: true, survey_complete: true, xp: 1300, badge: '📊 Strategy AM' },
  { emp_code: 'PBD-020', name: 'Syeda Wahida Sabrina', role: 'Strategy Associate', department: 'Strategy & Planning', status: 'In Studio', phone: '+8801796587832', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📈 Strategy Associate' },
  { emp_code: 'PBD-021', name: 'Faiyaz Amin Rahin', role: 'Strategy Associate', department: 'Strategy & Planning', status: 'In Studio', phone: '+8801975089893', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📈 Strategy Associate' },
  { emp_code: 'PBD-022', name: 'Farhat Lamisa Hossain', role: 'Digital Marketing Associate', department: 'Strategy & Planning', status: 'In Studio', phone: '+8801757378806', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-023', name: 'Zaima Zahin', role: 'Digital Marketing Associate', department: 'Strategy & Client Services', status: 'In Studio', phone: '+8801774619700', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-024', name: 'Arib Shahran Hassan', role: 'Digital Marketing Associate', department: 'Strategy & Client Services', status: 'In Studio', phone: '+8801929290000', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-025', name: 'Rafin Islam Awnon', role: 'Digital Marketing Associate', department: 'Strategy & Client Services', status: 'In Studio', phone: '+8801835045407', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-026', name: 'Mahin Islam', role: 'Digital Marketing Associate', department: 'Strategy & Client Services', status: 'In Studio', phone: '+8801516766605', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-027', name: 'Md. Arefin Islam', role: 'Digital Marketing Associate', department: 'Website, Tech & AI', status: 'In Studio', phone: '+8801331401450', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '💻 Tech Associate' },
  { emp_code: 'PBD-028', name: 'Rayeem Jawad Rythm', role: 'Digital Marketing Associate', department: 'Client Services', status: 'In Studio', phone: '+8801634763885', access_level: 'Specialist / Crew', base_salary: 35000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1000, badge: '📱 Marketing Associate' },
  { emp_code: 'PBD-029', name: 'Md. Borhan Siddique', role: 'Manager, Finance & Admin', department: 'Finance & Admin', status: 'In Studio', phone: '+8801688495740', access_level: 'Finance Manager', base_salary: 85000, commission_rate: 5, onboarding_complete: true, survey_complete: true, xp: 1850, badge: '💰 Finance Manager' },
  { emp_code: 'PBD-030', name: 'SK Mukit Hassan', role: 'Junior Executive, Finance & Admin', department: 'Finance & Admin', status: 'In Studio', phone: '+8801754696129', access_level: 'Specialist / Crew', base_salary: 40000, commission_rate: 2, onboarding_complete: true, survey_complete: true, xp: 1150, badge: '💳 Finance Exec' },
  { emp_code: 'PBD-031', name: 'Mohammad Shanto', role: 'Office Assistant', department: 'Administration', status: 'In Studio', phone: '+8801799580967', access_level: 'Office Staff', base_salary: 25000, commission_rate: 0, onboarding_complete: true, survey_complete: true, xp: 900, badge: '🏢 Office Assistant' },
  { emp_code: 'PBD-032', name: 'Mst. Sapia Khatun', role: 'Office Assistant', department: 'Administration', status: 'In Studio', phone: '+8801701614916', access_level: 'Office Staff', base_salary: 25000, commission_rate: 0, onboarding_complete: true, survey_complete: true, xp: 900, badge: '🏢 Office Assistant' }
];

function mapProfile(p) {
  if (!p) return null;

  // Calculate surveyProgress from what fields are filled
  let surveyProgress = 0;
  if (p.blood_group || p.personal_email || p.address || p.emergency_contact) surveyProgress = Math.max(surveyProgress, 1);
  if (p.nid_no || p.permanent_address || p.education_degree || p.tin_no || p.driving_license) surveyProgress = Math.max(surveyProgress, 2);
  if (p.bank_info && (p.bank_info.accountNo || p.bank_info.accNo || p.bank_info.mfsNo || p.bank_info.bkashNo)) surveyProgress = Math.max(surveyProgress, 3);
  if (p.primary_skill || p.secondary_skill || p.tshirt_size || p.portfolio_url) surveyProgress = Math.max(surveyProgress, 4);
  if (p.onboarding_complete && surveyProgress >= 4) surveyProgress = 5;

  return {
    id: p.emp_code || p.id,
    emp_code: p.emp_code,
    name: p.name,
    role: p.role,
    department: p.department,
    telegramId: p.telegram_id,
    phone: p.phone,
    avatarUrl: p.avatar_url || '',
    baseSalary: Number(p.base_salary) || 0,
    commissionRate: Number(p.commission_rate) || 0,
    earnedCommissions: Number(p.earned_commissions) || 0,
    status: p.status || 'Offline',
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
    weeklyCapacityHours: Number(p.weekly_capacity_hours) || 40,
    emergencyRelation: p.emergency_relation || '',
    maritalStatus: p.marital_status || '',
    dateOfBirth: p.date_of_birth || '',
    dependents: p.dependents || null,
    tinNo: p.tin_no || '',
    drivingLicense: p.driving_license || '',
    educationDegree: p.education_degree || '',
    institution: p.institution || '',
    passingYear: p.passing_year || '',
    secondarySkill: p.secondary_skill || '',
    portfolioUrl: p.portfolio_url || '',
    laptopSerial: p.laptop_serial || '',
    studioGear: p.studio_gear || '',
    tshirtSize: p.tshirt_size || '',
    dietaryPref: p.dietary_pref || ''
  };
}

function mapPublicProfile(p) {
  const full = mapProfile(p);
  if (!full) return null;
  delete full.baseSalary;
  delete full.commissionRate;
  delete full.earnedCommissions;
  delete full.nidNo;
  delete full.bankInfo;
  delete full.permanentAddress;
  delete full.bloodGroup;
  delete full.maritalStatus;
  delete full.dependents;
  delete full.tinNo;
  delete full.drivingLicense;
  return full;
}

function mapDepartmentManagerProfile(p) {
  const full = mapProfile(p);
  if (!full) return null;
  delete full.baseSalary;
  delete full.commissionRate;
  delete full.earnedCommissions;
  delete full.bankInfo;
  delete full.tinNo;
  delete full.nidNo;
  delete full.maritalStatus;
  delete full.dependents;
  delete full.drivingLicense;
  return full;
}

function mapAttendance(a) {
  if (!a) return null;
  return {
    id: a.id,
    employeeId: a.employee_id,
    name: a.name,
    status: a.status,
    clockInTime: a.clock_in_time,
    clockOutTime: a.clock_out_time || null,
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
// GET /api/team/me?telegramId=xxx   ← Mini App init call (Telegram) OR web JWT auth
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.query.telegramId;
    let found = telegramId ? await findEmpByTelegramId(telegramId) : null;

    // JWT web fallback: look up by linkedId (emp_code), id, or phone from the JWT payload
    if (!found && req.user) {
      const uid = req.user.linkedId || req.user.id || req.user.emp_code;
      const phone = req.user.phone || req.query.phone;
      if (supabase) {
        let query = supabase.from('profiles').select('*');
        if (uid && phone) {
          query = query.or(`emp_code.eq.${uid},id.eq.${uid},phone.eq.${phone}`);
        } else if (uid) {
          query = query.or(`emp_code.eq.${uid},id.eq.${uid}`);
        } else if (phone) {
          query = query.eq('phone', phone);
        }
        const { data } = await query.maybeSingle();
        if (data) found = { source: 'supabase', profile: mapProfile(data) };
      }
      if (!found) {
        const def = DEFAULT_TEAM.find(t => (uid && (t.emp_code === uid || t.id === uid)) || (phone && (t.phone === phone || t.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10)))));
        if (def) found = { source: 'default', profile: mapProfile(def) };
      }
    }

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
      const prefName = getPreferredName(empName);
      const { data: tasks } = await supabase.from('tasks').select('*')
        .or(`assignee.ilike.%${prefName || empName}%,assignee_id.eq.${empCode}`);
      myTasks = tasks || [];
    } else {
      const db = found.db || (await readDB());
      myTasks = (db.tasks || []).filter(t => matchesAssignee(t.assignee, empName, empCode));
    }

    // Fetch today's attendance
    const today = new Date().toISOString().split('T')[0];
    let attendanceToday = null;
    if (supabase) {
      const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', empCode).eq('date', today).maybeSingle();
      attendanceToday = mapAttendance(att);
    }

    // Build recentActivity feed for user
    const recentActivity = [];
    myTasks.slice(0, 3).forEach(t => {
      recentActivity.push({
        id: `act-task-${t.id}`,
        title: `Task Update: ${t.title || 'Assigned Task'}`,
        description: `Current stage: ${t.stage || t.status || 'In Production'}`,
        icon: '📋',
        time: t.updated_at || t.created_at || new Date().toISOString()
      });
    });

    if (attendanceToday) {
      recentActivity.push({
        id: `act-att-${attendanceToday.id || 'today'}`,
        title: `Attendance Recorded`,
        description: `Status: ${attendanceToday.status} at ${attendanceToday.clockInTime || 'Studio'}`,
        icon: '⏱️',
        time: attendanceToday.createdAt || new Date().toISOString()
      });
    }

    recentActivity.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    res.json({
      profile: mapProfile(emp),
      myTasks,
      attendanceToday,
      recentActivity,
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
      try {
        const { data } = await supabase.from('profiles').select('name, status, role, department');
        if (data && data.length > 0) team = data;
      } catch (e) {}
    }
    if (team.length === 0) team = DEFAULT_TEAM;

    const snapshot = {
      total: team.length,
      inStudio: team.filter(m => m.status === 'In Studio').length,
      onShoot: team.filter(m => m.status === 'On Field Shoot').length,
      onLeave: team.filter(m => m.status === 'On Leave').length,
      offline: team.filter(m => !m.status || m.status === 'Offline' || m.status === 'Remote').length,
    };
    return res.json(snapshot);
  } catch (err) {
    console.error('GET /team/snapshot error:', err.message);
    return res.json({ total: 6, inStudio: 4, onShoot: 0, onLeave: 0, offline: 2 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/roster   ← Mini App roster page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/roster', requireAuth, async (req, res) => {
  try {
    let team = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          team = data;
        }
      } catch (e) {}
    }
    if (team.length === 0) team = DEFAULT_TEAM;
    return res.json(team.map(mapProfile));
  } catch (err) {
    console.error('GET /team/roster error:', err.message);
    return res.json(DEFAULT_TEAM.map(mapProfile));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/tasks?telegramId=xxx   ← Mini App tasks page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tasks', requireMiniAppAuth, async (req, res) => {
  try {
    const { telegramId } = req.query;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const empCode = req.query.empCode || found.profile.emp_code || found.profile.id;
    const firstName = (found.profile.name || '').split(' ')[0];
    let tasks = [];

    if (supabase) {
      const { data } = await supabase.from('tasks')
        .select('*')
        .or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`);
      tasks = data || [];
    } else {
      const db = found.db || (await readDB());
      tasks = (db.tasks || []).filter(t => 
        (t.assignee_id && t.assignee_id === empCode) ||
        (t.assignee || '').toLowerCase().includes(firstName.toLowerCase())
      );
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
router.get('/daily-activity', requireMiniAppAuth, async (req, res) => {
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
router.post('/clockin', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.body.telegramId;
    const { location, latitude, longitude } = req.body;
    let emp = req.user;

    if (!emp && telegramId) {
      const found = await findEmpByTelegramId(telegramId);
      if (found) emp = found.profile;
    }

    if (!emp) return res.status(401).json({ error: 'Authentication required' });

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

    broadcastTeamEvent('attendance_update', [{ employee_id: empCode, status: 'In Studio', clock_in_time: nowTime }]);
    res.json({ success: true, time: nowTime, status: 'In Studio' });
  } catch (err) {
    console.error('POST /team/clockin error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/clockout   ← Mini App clock-out button
// ─────────────────────────────────────────────────────────────────────────────
router.post('/clockout', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.body.telegramId;
    let emp = req.user;

    if (!emp && telegramId) {
      const found = await findEmpByTelegramId(telegramId);
      if (found) emp = found.profile;
    }

    if (!emp) return res.status(401).json({ error: 'Authentication required' });

    const empCode = emp.emp_code || emp.id;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (supabase) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('attendance').update({ status: 'Clocked Out', clock_out_time: nowTime }).eq('employee_id', empCode).eq('date', today);
      await supabase.from('profiles').update({ status: 'Offline' }).eq('emp_code', empCode);
    }

    broadcastTeamEvent('attendance_update', [{ employee_id: empCode, status: 'Clocked Out', clock_out_time: nowTime }]);
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
router.post('/survey', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.body.telegramId;
    let found = telegramId ? await findEmpByTelegramId(telegramId) : null;

    // JWT web fallback: look up by req.user.linkedId (emp_code)
    if (!found && req.user) {
      const uid = req.user.linkedId || req.user.id;
      if (uid && supabase) {
        const { data } = await supabase.from('profiles').select('*')
          .or(`emp_code.eq.${uid},id.eq.${uid}`).maybeSingle();
        if (data) found = { source: 'supabase', profile: mapProfile(data) };
      }
    }

    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const { part, data: partData } = req.body;
    if (!part) return res.status(400).json({ error: 'part required' });

    // Part order enforcement (ensure previous part was submitted)
    const hasPart1 = !!(emp.blood_group || emp.emergency_contact || emp.personal_email || emp.address);
    const hasPart2 = !!(emp.nid_no || emp.permanent_address || emp.education_degree || emp.tin_no || emp.driving_license);
    const hasPart3 = !!(emp.bank_info && (emp.bank_info.accountNo || emp.bank_info.accNo || emp.bank_info.mfsNo || emp.bank_info.bkashNo));

    if (part === 2 && !hasPart1) {
      return res.status(400).json({ error: 'Please complete Part 1 (Personal Info) before Part 2.', code: 'PART_ORDER_VIOLATION' });
    }
    if (part === 3 && !hasPart2) {
      return res.status(400).json({ error: 'Please complete Part 2 (Verification Docs) before Part 3.', code: 'PART_ORDER_VIOLATION' });
    }
    if (part === 4 && !hasPart3) {
      return res.status(400).json({ error: 'Please complete Part 3 (Bank Info) before Part 4.', code: 'PART_ORDER_VIOLATION' });
    }

    // XP awarded per part
    const XP_PER_PART = { 1: 100, 2: 150, 3: 200, 4: 100 };
    const xpEarned = XP_PER_PART[part] || 0;
    const currentXP = (Number(emp.xp) || 0) + xpEarned;

    // Determine badge based on total XP
    const badge = getBadge(currentXP);

    // Build Supabase profile update based on part
    const profileUpdate = { xp: currentXP, badge, updated_at: new Date().toISOString() };

    if (part === 1 && partData) {
      const emerg = partData.emergencyPhone || partData.emergencyContact;
      if (emerg) profileUpdate.emergency_contact = emerg;
      if (partData.emergencyRelation) profileUpdate.emergency_relation = partData.emergencyRelation;
      if (partData.maritalStatus) profileUpdate.marital_status = partData.maritalStatus;
      if (partData.joiningDate) profileUpdate.joining_date = partData.joiningDate;
      if (partData.dob) profileUpdate.date_of_birth = partData.dob;
      if (partData.dependents) profileUpdate.dependents = partData.dependents;
      if (partData.address) profileUpdate.address = partData.address;
      if (partData.personalEmail) profileUpdate.personal_email = partData.personalEmail;
      if (partData.bloodGroup) profileUpdate.blood_group = partData.bloodGroup;
    }
    if (part === 2 && partData) {
      const nid = partData.nidNo || partData.nid;
      const perm = partData.permanentAddress || partData.permAddress;
      if (nid) profileUpdate.nid_no = nid;
      if (perm) profileUpdate.permanent_address = perm;
      if (partData.tin) profileUpdate.tin_no = partData.tin;
      if (partData.license) profileUpdate.driving_license = partData.license;
      if (partData.degree) profileUpdate.education_degree = partData.degree;
      if (partData.institution) profileUpdate.institution = partData.institution;
      if (partData.passingYear) profileUpdate.passing_year = partData.passingYear;
    }
    if (part === 3 && partData) {
      const bkash = partData.bkashNo || partData.bkash || '';
      const nagad = partData.nagadNo || partData.nagad || '';
      const rocket = partData.rocketNo || partData.rocket || '';
      profileUpdate.bank_info = {
        bankName: partData.bankName || '',
        accountTitle: partData.accountTitle || partData.accTitle || '',
        accountNo: partData.accountNo || partData.accNo || '',
        accNo: partData.accountNo || partData.accNo || '',
        branch: partData.branch || '',
        bkashNo: bkash,
        nagadNo: nagad,
        rocketNo: rocket,
        mfsNo: bkash || nagad || rocket || ''
      };
      if (partData.baseSalary) profileUpdate.base_salary = partData.baseSalary;
    }
    if (part === 4 && partData) {
      const skill = partData.primarySkill || partData.skillPrimary;
      if (skill) profileUpdate.primary_skill = skill;
      if (partData.skillSecondary) profileUpdate.secondary_skill = partData.skillSecondary;
      if (partData.portfolio) profileUpdate.portfolio_url = partData.portfolio;
      if (partData.laptopSerial) profileUpdate.laptop_serial = partData.laptopSerial;
      if (partData.studioGear) profileUpdate.studio_gear = partData.studioGear;
      if (partData.tshirtSize) profileUpdate.tshirt_size = partData.tshirtSize;
      if (partData.dietary) profileUpdate.dietary_pref = partData.dietary;
      // Part 4 completion → survey done, unlock full menu after agreement
      profileUpdate.survey_complete = true;
    }

    // Update Supabase
    if (supabase) {
      await supabase.from('profiles').update(profileUpdate).eq('emp_code', empCode);
    }

    broadcastTeamEvent('team_update', [{ emp_code: empCode, xp: currentXP, badge }]);

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
router.post('/agreement', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.body.telegramId;
    const { stage, signature, timestamp } = req.body;
    let found = telegramId ? await findEmpByTelegramId(telegramId) : null;

    // JWT web fallback: look up by req.user.linkedId (emp_code)
    if (!found && req.user) {
      const uid = req.user.linkedId || req.user.id;
      if (uid && supabase) {
        const { data } = await supabase.from('profiles').select('*')
          .or(`emp_code.eq.${uid},id.eq.${uid}`).maybeSingle();
        if (data) found = { source: 'supabase', profile: mapProfile(data) };
      }
    }

    if (!found) return res.status(404).json({ error: 'Employee not found' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;

    if (!emp.survey_complete) {
      return res.status(400).json({ error: 'Please complete the onboarding survey before signing the agreement.', code: 'SURVEY_INCOMPLETE' });
    }

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

      broadcastTeamEvent('team_update', [{ emp_code: empCode, onboarding_complete: true, agreement_stage: 1 }]);

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

      // Notify Finance Manager via Telegram
      try {
        let financeTgId = null;
        if (supabase) {
          const { data: fin } = await supabase.from('profiles').select('telegram_id').or('access_level.eq.Finance Manager,role.ilike.%finance manager%').maybeSingle();
          financeTgId = fin?.telegram_id;
        }
        if (!financeTgId) {
          const db2 = await readDB();
          financeTgId = (db2.team || []).find(t => (t.role || '').toLowerCase().includes('finance') || t.accessLevel === 'Finance Manager')?.telegramId;
        }
        if (financeTgId) {
          await sendTelegramNotification(
            financeTgId,
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
    let profilesList = cache.get('team:raw_profiles');
    if (!profilesList) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
          if (!error && Array.isArray(data) && data.length > 0) {
            profilesList = data;
            cache.set('team:raw_profiles', profilesList, 120000);
          }
        } catch (e) {}
      }
    }

    if (!profilesList || profilesList.length === 0) {
      profilesList = DEFAULT_TEAM;
    }

    const access = (req.user?.accessLevel || req.user?.role || '').toLowerCase();
    const isExecutiveOrFinance = access.includes('admin') || access.includes('owner') || access.includes('finance') || (req.user?.role || '').toLowerCase().includes('finance');
    const isDeptManager = access.includes('manager') || access.includes('director') || access.includes('lead') || access.includes('technology');

    return res.json((profilesList || []).map(p => {
      if (isExecutiveOrFinance) return mapProfile(p);
      if (isDeptManager) return mapDepartmentManagerProfile(p);
      return mapPublicProfile(p);
    }));
  } catch (err) {
    console.error('Team GET error:', err.message);
    return res.json(DEFAULT_TEAM.map(mapPublicProfile));
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/tg/:telegramId   ← Legacy route (keep for backwards compat)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tg/:telegramId', async (req, res) => {
  try {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/team/me>; rel="successor-version"');
    const { telegramId } = req.params;

    const found = await findEmpByTelegramId(telegramId);
    if (!found) return res.status(404).json({ error: 'Employee not found for given Telegram ID' });

    const emp = found.profile;
    const empCode = emp.emp_code || emp.id;
    const empName = emp.name;

    let myTasks = [];
    if (supabase) {
      const prefName = getPreferredName(empName);
      const { data: tasks } = await supabase.from('tasks').select('*')
        .or(`assignee.ilike.%${prefName || empName}%,assignee_id.eq.${empCode}`);
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
    broadcastTeamEvent('attendance_update', (allAtt || []).map(mapAttendance));

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
    let mapped = (data || []).map(mapAttendance);
    const empId = req.query.employeeId || req.query.empId;
    if (empId) {
      mapped = mapped.filter(a => a.employeeId === empId || a.employee_id === empId);
    }
    res.json(mapped);
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
    let rows = data || [];
    const empId = req.query.employeeId || req.query.empId;
    if (empId) {
      rows = rows.filter(l => l.employee_id === empId || l.staff_id === empId || l.employeeId === empId);
    }
    res.json(rows);
  } catch (err) {
    console.error('Leaves GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/eod
router.get('/eod', requireAuth, async (req, res) => {
  try {
    const empId = req.query.employeeId || req.query.empId || req.query.emp_code;
    let rows = [];
    if (supabase) {
      let query = supabase.from('eod_reports').select('*').order('created_at', { ascending: false });
      if (empId) {
        query = query.or(`employee_id.eq.${empId},employee_id.ilike.%${empId}%`);
      }
      const { data, error } = await query;
      if (!error && data) rows = data;
    }
    res.json(rows);
  } catch (err) {
    console.error('EOD GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/leaves
router.post('/leaves', requireAuth, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `LVE-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;

    const payload = {
      id: newId,
      employee_id: req.body.staffId || req.body.employeeId || req.user.empCode || req.user.emp_code || req.user.linkedId || req.user.id || 'PBD-001',
      employee_name: req.body.staffName || req.body.employeeName || req.user.profile?.name || req.user.name || 'Team Member',
      leave_type: req.body.type || req.body.leaveType || 'Casual Leave',
      start_date: req.body.fromDate || req.body.startDate || new Date().toISOString().split('T')[0],
      end_date: req.body.toDate || req.body.endDate || new Date().toISOString().split('T')[0],
      total_days: Number(req.body.totalDays || req.body.total_days || req.body.days) || 1,
      reason: req.body.reason || 'Personal work',
      status: 'Pending',
      submitted_via: req.body.submitted_via || 'web_portal'
    };

    const { data: newLeave, error } = await supabase.from('leaves').insert([payload]).select().single();
    if (error) throw error;

    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcastTeamEvent('leave_update', allLeaves || []);
    
    const dbSnapshot = await readDB();
    const { automation, processAutomationEvent } = require('../services/automation');
    if (automation && automation.trigger) {
      automation.trigger('leave_submitted', { leave: payload }).catch(() => {});
    } else if (processAutomationEvent) {
      await processAutomationEvent('leave_submitted', { leave: payload }, dbSnapshot, writeDB, broadcast).catch(() => {});
    }

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

    // Fetch existing leave request to check if approving
    let leaveReq = null;
    if (supabase) {
      const { data } = await supabase.from('leaves').select('*').eq('id', id).maybeSingle();
      leaveReq = data;
    }

    const { data: leave, error } = await supabase.from('leaves').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Deduct leave balance upon Approval if profiles table columns exist
    if (supabase && req.body.status === 'Approved' && leaveReq && leaveReq.employee_id) {
      try {
        const days = Number(leaveReq.total_days || leaveReq.days) || 1;
        const isSick = (leaveReq.leave_type || '').toLowerCase().includes('sick');
        const usedCol = isSick ? 'sick_leaves_used' : 'casual_leaves_used';

        const { data: profile } = await supabase.from('profiles').select(usedCol).eq('emp_code', leaveReq.employee_id).maybeSingle();
        if (profile && profile[usedCol] !== undefined) {
          const currentUsed = profile[usedCol] || 0;
          await supabase.from('profiles').update({ [usedCol]: currentUsed + days }).eq('emp_code', leaveReq.employee_id);
        } else {
          const { data: profileId } = await supabase.from('profiles').select(usedCol).eq('id', leaveReq.employee_id).maybeSingle();
          if (profileId && profileId[usedCol] !== undefined) {
            const currentUsed = profileId[usedCol] || 0;
            await supabase.from('profiles').update({ [usedCol]: currentUsed + days }).eq('id', leaveReq.employee_id);
          }
        }
      } catch (balErr) {
        console.warn('[Team Leaves API] Leave balance decrement skipped:', balErr.message);
      }
    }

    const { data: allLeaves } = await supabase.from('leaves').select('*').order('created_at', { ascending: false });
    broadcastTeamEvent('leave_update', allLeaves || []);

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
    const { data: countData } = await supabase.from('profiles').select('id');
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

    const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
    if (error) throw error;

    // Register login credentials immediately (phone + PIN) for /crew portal access
    let pinRecord = null;
    try {
      const providedPin = pin && pin.length === 4 ? pin : null;
      pinRecord = await createTempPin(normalizedPhone, newEmpCode, 'team', '');
      // If a specific PIN was provided, update it immediately
      if (providedPin && pinRecord) {
        await supabase.from('auth_pins').update({ pin: providedPin, is_permanent: true })
          .eq('phone', normalizedPhone);
        pinRecord.pin = providedPin;
      }
    } catch (pinErr) {
      console.warn('PIN registration warning (non-critical):', pinErr.message);
    }

    const member = mapProfile(data);
    const { data: allTeam } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    broadcastTeamEvent('team_update', (allTeam || []).map(mapProfile));

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

// POST /api/team/:empCode/reset-pin — Reset PIN for a staff member
router.post('/:empCode/reset-pin', requireAuth, async (req, res) => {
  try {
    const { empCode } = req.params;
    const { customPin } = req.body || {};
    let targetPhone = '';

    if (supabase) {
      const { data } = await supabase.from('profiles').select('phone').eq('emp_code', empCode).maybeSingle();
      if (data && data.phone) targetPhone = data.phone;
    }

    let pinRecord = null;
    try {
      pinRecord = await createTempPin(targetPhone || '01700000000', empCode, 'team', '');
      if (customPin && pinRecord && supabase) {
        await supabase.from('auth_pins').update({ pin: customPin, is_permanent: true }).eq('phone', targetPhone).catch(() => {});
        pinRecord.pin = customPin;
      }
    } catch (e) {
      console.warn('createTempPin error:', e.message);
    }

    return res.json({
      success: true,
      empCode,
      tempPin: pinRecord ? pinRecord.pin : (customPin || '123456'),
      message: 'PIN successfully reset'
    });
  } catch (err) {
    console.error('Reset PIN error:', err.message);
    return res.status(500).json({ error: err.message });
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
      team = DEFAULT_TEAM;
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
// GET /api/team/attendance-report — Generate CSV report for a date range
router.get('/attendance-report', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // In a full implementation, we'd query clock_ins/clock_outs between start and end.
    // For this prototype, we'll export team members and their approved leaves.
    
    const { data: teamData } = await supabase.from('profiles').select('id, name, department, role, status');
    const { data: leaveData } = await supabase.from('leaves').select('*').eq('status', 'Approved');
    
    let csv = 'Employee ID,Name,Department,Role,Current Status,Approved Leaves (Days)\n';
    
    (teamData || []).forEach(emp => {
      const empLeaves = (leaveData || []).filter(l => l.employee_id === emp.id);
      const leaveDays = empLeaves.reduce((acc, curr) => {
        const s = new Date(curr.start_date);
        const e = new Date(curr.end_date);
        return acc + (Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
      }, 0);
      
      csv += `${emp.id},"${emp.name}","${emp.department}","${emp.role}",${emp.status},${leaveDays}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`Attendance_Report_${start || 'all'}_to_${end || 'all'}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('Attendance report error:', err.message);
    res.status(500).send('Error generating report');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/team/:id — Update Team Member Profile (Survey, Settings, HR Ops)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    // Only allow self-edits or manager/admin edits
    const userAccess = (req.user.accessLevel || req.user.role || '').toLowerCase();
    const isOwner = userAccess.includes('admin') || userAccess.includes('owner') || userAccess.includes('technology');
    if (!isOwner && req.user.linkedId !== id && req.user.id !== id && req.user.emp_code !== id) {
      return res.status(403).json({ error: 'Unauthorized to edit this profile' });
    }

    const updates = {};
    if (body.baseSalary !== undefined && isOwner) updates.base_salary = Number(body.baseSalary);
    if (body.phone !== undefined) updates.phone = normalizePhone(body.phone);
    if (body.role !== undefined && isOwner) updates.role = body.role;
    if (body.department !== undefined && isOwner) updates.department = body.department;
    if (body.blood_group !== undefined) updates.blood_group = body.blood_group;
    if (body.personal_email !== undefined) updates.personal_email = body.personal_email;
    if (body.address !== undefined) updates.address = body.address;
    if (body.nid_no !== undefined) updates.nid_no = body.nid_no;
    if (body.permanent_address !== undefined) updates.permanent_address = body.permanent_address;
    if (body.primary_skill !== undefined) updates.primary_skill = body.primary_skill;
    if (body.emergency_contact !== undefined) updates.emergency_contact = body.emergency_contact;
    if (body.bank_info !== undefined) updates.bank_info = body.bank_info;
    if (body.avatar_url !== undefined || body.avatarUrl !== undefined) updates.avatar_url = body.avatar_url || body.avatarUrl;
    if (body.tshirt_size !== undefined || body.tshirtSize !== undefined) updates.tshirt_size = body.tshirt_size || body.tshirtSize;
    if (body.dietary_pref !== undefined || body.dietaryPref !== undefined) updates.dietary_pref = body.dietary_pref || body.dietaryPref;
    if (body.secondary_skill !== undefined || body.secondarySkill !== undefined) updates.secondary_skill = body.secondary_skill || body.secondarySkill;
    if (body.portfolio_url !== undefined || body.portfolioUrl !== undefined) updates.portfolio_url = body.portfolio_url || body.portfolioUrl;
    if (body.laptop_serial !== undefined || body.laptopSerial !== undefined) updates.laptop_serial = body.laptop_serial || body.laptopSerial;
    if (body.studio_gear !== undefined || body.studioGear !== undefined) updates.studio_gear = body.studio_gear || body.studioGear;
    if (body.onboarding_complete !== undefined) updates.onboarding_complete = Boolean(body.onboarding_complete);
    if (body.survey_complete !== undefined) updates.survey_complete = Boolean(body.survey_complete);

    updates.updated_at = new Date().toISOString();

    let updatedProfile = null;
    if (supabase) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().maybeSingle();
        if (!error && data) updatedProfile = data;
      } else {
        const { data, error } = await supabase.from('profiles').update(updates).eq('emp_code', id).select().maybeSingle();
        if (!error && data) {
          updatedProfile = data;
        } else {
          const fallback = await supabase.from('profiles').update(updates).eq('id', id).select().maybeSingle();
          if (fallback.data) updatedProfile = fallback.data;
        }
      }
    }

    if (updatedProfile) {
      const mapped = mapProfile(updatedProfile);
      broadcastTeamEvent('team_update', [mapped]);
      res.json({ success: true, profile: mapped });
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (err) {
    console.error('PUT /team/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/avatar — Upload Profile Picture
// ─────────────────────────────────────────────────────────────────────────────
router.post('/avatar', requireAuth, async (req, res) => {
  try {
    const { base64, mimeType, employeeId } = req.body;
    if (!base64 || !employeeId) {
      return res.status(400).json({ error: 'base64 and employeeId required' });
    }

    const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType && mimeType.includes('png') ? 'png' : 'jpg';
    const filePath = `avatars/${employeeId}_${Date.now()}.${ext}`;

    let avatarUrl = '';
    try {
      const uploaded = await uploadFile('avatars', filePath, buffer, mimeType || 'image/jpeg');
      avatarUrl = uploaded.url || uploaded.publicUrl || '';
    } catch(e) {
      console.warn('Storage upload error, fallback to data URL:', e.message);
      avatarUrl = base64; // fallback to base64 data URL
    }

    if (supabase) {
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('emp_code', employeeId);
    }

    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('POST /team/avatar error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/team/upload-deliverable — Upload Deliverable and auto-advance to Internal QC
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload-deliverable', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const { taskId, fileName, mimeType, base64, versionNote, employeeId } = req.body;
    if (!taskId || !base64) {
      return res.status(400).json({ error: 'taskId and base64 are required' });
    }

    let fileUrl = null;
    try {
      const cleanFileName = (fileName || 'deliverable.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
      const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const uploadPath = `deliverables/${taskId}/${Date.now()}-${cleanFileName}`;
      const uploadResult = await uploadFile('deliverables', uploadPath, buffer, mimeType || 'video/mp4');
      fileUrl = uploadResult?.publicUrl || uploadResult?.url || null;
    } catch (upErr) {
      console.warn('[Upload Deliverable] Storage upload warning:', upErr.message);
      return res.status(500).json({ error: 'File upload to storage failed. Please retry.', detail: upErr.message });
    }

    if (!fileUrl) {
      return res.status(500).json({ error: 'File storage URL could not be generated. Please retry.' });
    }

    if (supabase) {
      const { data: existing } = await supabase.from('tasks').select('custom_fields, title, assignee_id').eq('id', taskId).maybeSingle();
      const existingFields = existing?.custom_fields || {};
      const deliverables = [...(existingFields.deliverables || []), {
        url: fileUrl,
        fileName: fileName || 'deliverable',
        versionNote: versionNote || '',
        submittedBy: employeeId || req.user?.id || 'Crew Member',
        submittedAt: new Date().toISOString()
      }];

      await supabase.from('tasks').update({
        custom_fields: { ...existingFields, deliverables },
        stage: 'Internal QC',
        custom_status: 'Internal QC',
        updated_at: new Date().toISOString()
      }).eq('id', taskId);

      broadcast('task_update', [{ id: taskId, stage: 'Internal QC' }]);
    }

    return res.json({ success: true, fileUrl, stage: 'Internal QC' });
  } catch (err) {
    console.error('POST /team/upload-deliverable error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/team/payslip — Return printable HTML payslip (Print to PDF)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/payslip', requireMiniAppAuth, async (req, res) => {
  try {
    const empCode = req.user?.emp_code || req.user?.id || req.query.empCode;
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    let emp = null;
    if (supabase && empCode) {
      const { data } = await supabase.from('profiles').select('*').or(`emp_code.eq.${empCode},id.eq.${empCode}`).maybeSingle();
      emp = data;
    }
    if (!emp) {
      emp = req.user || { name: 'Specialist Staff', emp_code: empCode || 'PBD-001', role: 'Production Specialist', department: 'Production' };
    }

    const baseSalary = Number(emp.base_salary || emp.salary || 35000);
    const commissions = Number(emp.earned_commissions || emp.earnedCommissions || 0);
    const total = baseSalary + commissions;
    const monthDate = new Date(month + '-01');
    const monthLabel = isNaN(monthDate.getTime())
      ? new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip — ${emp.name} — ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 40px 20px;
    }
    .sheet {
      background: #ffffff;
      max-width: 720px;
      margin: 0 auto;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #8b5cf6;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .logo-area h1 {
      font-size: 22px;
      font-weight: 900;
      color: #7c3aed;
      letter-spacing: -0.02em;
    }
    .logo-area .sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .meta-box strong { color: #0f172a; }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7c3aed;
      margin-bottom: 12px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 28px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }
    .info-label { color: #64748b; }
    .info-val { font-weight: 600; color: #0f172a; }
    .earnings-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .earnings-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .earnings-table td {
      padding: 14px 16px;
      font-size: 13.5px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
    }
    .earnings-table tr.total-row td {
      font-weight: 800;
      font-size: 15px;
      color: #7c3aed;
      background: #faf5ff;
      border-top: 2px solid #8b5cf6;
      border-bottom: 2px solid #8b5cf6;
    }
    .action-bar {
      text-align: center;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .print-btn {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: #ffffff;
      border: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(139,92,246,0.3);
      transition: all 0.2s ease;
    }
    .print-btn:hover { opacity: 0.95; transform: translateY(-1px); }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 11.5px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 20px; max-width: 100%; }
      .action-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="logo-area">
        <h1>🟣 Purplebot Digital</h1>
        <div class="sub">Official Monthly Earnings Statement &bull; ${monthLabel}</div>
      </div>
      <div class="meta-box">
        <div>Employee ID: <strong>${emp.emp_code || emp.id}</strong></div>
        <div>Date Issued: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
        <div>Status: <strong style="color:#059669;">Disbursed / Verified</strong></div>
      </div>
    </div>

    <div class="section-title">Specialist Identification</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">${emp.name}</span></div>
      <div class="info-row"><span class="info-label">Department</span><span class="info-val">${emp.department || 'Production'}</span></div>
      <div class="info-row"><span class="info-label">Designation</span><span class="info-val">${emp.role || 'Specialist'}</span></div>
      <div class="info-row"><span class="info-label">Payout bKash / Acc</span><span class="info-val">${emp.bank_info?.mfsNo || emp.phone || 'Connected'}</span></div>
    </div>

    <div class="section-title">Earnings & Compensation Breakdown</div>
    <table class="earnings-table">
      <thead>
        <tr>
          <th>Compensation Item</th>
          <th>Description</th>
          <th style="text-align:right;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Base Monthly Salary</strong></td>
          <td style="color:#64748b;">Fixed specialist remuneration</td>
          <td style="text-align:right; font-weight:600;">৳${baseSalary.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Project Commissions & Bonuses</strong></td>
          <td style="color:#64748b;">Production milestone deliverables accrued</td>
          <td style="text-align:right; font-weight:600; color:#059669;">+৳${commissions.toLocaleString()}</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total Net Disbursed</strong></td>
          <td style="color:#7c3aed; font-size:12px;">Electronic Payout (bKash / Bank Wire)</td>
          <td style="text-align:right;">৳${total.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="action-bar">
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="footer">
      Purplebot Digital Ltd. &bull; Creative & Engineering Production Network<br>
      This document is electronically generated and digitally stamped by PurpleOS Finance Core.
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.error('GET /team/payslip error:', err.message);
    return res.status(500).send('<p>Payslip generation error: ' + err.message + '</p>');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/team/:id — Remove Team Member
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow manager/admin deletes
    const userAccess = (req.user.accessLevel || req.user.role || '').toLowerCase();
    const isOwner = userAccess.includes('admin') || userAccess.includes('owner') || userAccess.includes('technology');
    if (!isOwner) {
      return res.status(403).json({ error: 'Unauthorized to delete profile' });
    }

    if (supabase) {
      // First try to delete by emp_code
      let { error } = await supabase.from('profiles').delete().eq('emp_code', id);
      if (error) {
        // Fallback to id
        const fallback = await supabase.from('profiles').delete().eq('id', id);
        if (fallback.error) throw fallback.error;
      }
    }

    broadcastTeamEvent('team_update', []); // Force clients to refresh full list
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /team/:id error:', err.message);
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
      team = DEFAULT_TEAM;
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

// POST /api/team/eod — Submit Daily EOD Report
router.post('/eod', miniAppLimiter, requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.telegramUser ? String(req.telegramUser.id) : req.body.telegramId;
    const { employeeId, name, text, summary, blockers } = req.body;
    let empCode = employeeId || req.user?.linkedId || req.user?.id;
    let empName = name || req.user?.name;

    if (telegramId && (!empName || !empCode)) {
      const found = await findEmpByTelegramId(telegramId);
      if (found) {
        empCode = found.profile.emp_code || found.profile.id;
        empName = found.profile.name;
      }
    }

    if (!empCode && req.user) {
      empCode = req.user.linkedId || req.user.id;
      empName = req.user.name;
    }

    const payload = {
      id: `EOD-${Date.now()}`,
      employee_id: empCode || 'PBD-000',
      employee_name: empName || req.user?.name || 'Team Member',
      report_date: new Date().toISOString().split('T')[0],
      tasks_done: text || summary || 'Daily tasks completed',
      tasks_tomorrow: req.body.tasksTomorrow || req.body.tomorrow || 'Standard daily tasks',
      blockers: blockers || 'None',
      mood: req.body.mood || '😊 Energized',
      hours_worked: Number(req.body.hours) || 8,
      submitted_via: req.telegramUser ? 'telegram_miniapp' : 'web_portal',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('eod_reports').insert([payload]);
      // Award +10 XP for daily EOD submission
      if (empCode) {
        try {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empCode);
          let pQuery = supabase.from('profiles').select('xp, badge, telegram_id, custom_fields');
          if (isUUID) {
            pQuery = pQuery.eq('id', empCode);
          } else {
            pQuery = pQuery.eq('emp_code', empCode);
          }
          const { data: prof } = await pQuery.maybeSingle();
          if (prof) {
            const newXP = (prof.xp || 0) + 10;
            const oldBadge = prof.badge || '🌱 Recruit';
            const badge = getBadge(newXP);
            const leveledUp = badge !== oldBadge;

            const existingLog = prof.custom_fields?.xp_log || [];
            const xpLog = [...existingLog.slice(-49), {
              event: 'eod_submit',
              delta: 10,
              total: newXP,
              badge,
              ts: new Date().toISOString()
            }];
            const customFields = { ...(prof.custom_fields || {}), xp_log: xpLog };

            let uQuery = supabase.from('profiles').update({
              xp: newXP,
              badge,
              custom_fields: customFields,
              updated_at: new Date().toISOString()
            });
            if (isUUID) {
              uQuery = uQuery.eq('id', empCode);
            } else {
              uQuery = uQuery.eq('emp_code', empCode);
            }
            await uQuery;
            broadcastTeamEvent('team_update', [{ emp_code: empCode, xp: newXP, badge }]);

            if (leveledUp && prof.telegram_id) {
              try {
                const { sendTelegramNotification } = require('../services/bot');
                await sendTelegramNotification(prof.telegram_id,
                  `🏆 *YOU LEVELED UP!*\n\n` +
                  `Daily EOD submitted! You've advanced to a new specialist rank:\n\n` +
                  `🎖️ *Rank:* ${badge}\n` +
                  `⭐ *Total XP:* ${newXP.toLocaleString()} XP\n\n` +
                  `_Keep up the great work! 🚀_`,
                  null,
                  true
                );
              } catch (notifErr) {
                console.warn('[EOD XP Level-Up] Notification warning:', notifErr.message);
              }
            }
          }
        } catch (xpErr) {
          console.warn('EOD XP update warning:', xpErr.message);
        }
      }
    }

    broadcastTeamEvent('eod_update', [payload]);
    const { automation, processAutomationEvent } = require('../services/automation');
    if (automation && automation.trigger) {
      automation.trigger('eod_submitted', { eod: payload }).catch(() => {});
    } else if (processAutomationEvent) {
      const dbSnapshot = await readDB().catch(() => ({ team: [] }));
      await processAutomationEvent('eod_submitted', { eod: payload }, dbSnapshot, null, broadcast).catch(() => {});
    }

    res.json({ success: true, eod: payload });
  } catch (err) {
    console.error('EOD POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/payroll/summary — Mini App payroll summary data
router.get('/payroll/summary', requireMiniAppAuth, async (req, res) => {
  try {
    const telegramId = req.query.telegramId;
    let emp = null;

    if (telegramId) {
      const found = await findEmpByTelegramId(telegramId);
      if (found) emp = found.profile;
    } else if (req.user) {
      emp = req.user;
    }

    const baseSalary = Number(emp?.base_salary || emp?.baseSalary) || 45000;
    const commissions = Number(emp?.earned_commissions || emp?.earnedCommissions) || 0;
    const bonus = Number(emp?.bonus) || 0;
    const deductions = Number(emp?.deductions) || 0;
    const grossPay = baseSalary + commissions + bonus;
    const netPay = Math.max(0, grossPay - deductions);

    res.json({
      baseSalary,
      commissions,
      bonus,
      deductions,
      grossPay,
      netPay,
      month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      status: emp?.payout_status || 'Paid',
      disbursedDate: emp?.payout_date || new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Payroll summary GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/me/stats — Personal performance statistics for Home tab
router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const empCode = req.user.emp_code || req.user.linkedId || req.user.id;
    const empName = req.user.name || req.user.profile?.name || '';
    const firstName = empName.split(' ')[0] || '';
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let tasksCompleted = 0;
    let attendanceDays = 0;
    let eodSubmitted = 0;

    if (supabase) {
      // Completed tasks this month (match assignee_id or fallback name match)
      const { data: tasks } = await supabase.from('tasks')
        .select('id, stage')
        .or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`)
        .in('stage', ['Done', 'Completed']);
      tasksCompleted = (tasks || []).length;

      // Attendance days this month
      const { data: att } = await supabase.from('attendance')
        .select('date')
        .eq('employee_id', empCode)
        .ilike('date', `${monthStr}%`);
      attendanceDays = (att || []).length;

      // EOD reports this month
      const { data: eods } = await supabase.from('eod_reports')
        .select('id')
        .eq('employee_id', empCode)
        .gte('created_at', monthStart);
      eodSubmitted = (eods || []).length;
    }

    res.json({
      tasksCompleted,
      attendanceDays,
      eodSubmitted,
      month: now.toLocaleString('en-US', { month: 'long' })
    });
  } catch (err) {
    console.error('GET /me/stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/invitation-status — Team onboarding & invitation dashboard data (Manager+)
router.get('/invitation-status', requireAuth, async (req, res) => {
  try {
    let profiles = [];
    if (supabase) {
      try {
        const { data: pData, error: pErr } = await supabase
          .from('profiles')
          .select('emp_code, name, role, phone, department, survey_complete, onboarding_complete, telegram_id')
          .order('name');
        if (!pErr && Array.isArray(pData) && pData.length > 0) {
          profiles = pData;
        }
      } catch (e) {}
    }

    if (profiles.length === 0) {
      profiles = DEFAULT_TEAM;
    }

    let pins = [];
    if (supabase) {
      try {
        const { data: pns } = await supabase
          .from('auth_pins')
          .select('phone, is_temp, attempts, locked_at')
          .eq('linked_type', 'team');
        if (Array.isArray(pns)) pins = pns;
      } catch (e) {}
    }

    const pinMap = {};
    (pins || []).forEach(p => {
      if (p.phone) pinMap[normalizePhone(p.phone)] = p;
    });

    const members = profiles.map(p => {
      const pinRecord = p.phone ? pinMap[normalizePhone(p.phone)] : null;
      return {
        empCode: p.emp_code || p.id,
        name: p.name,
        role: p.role,
        department: p.department || 'General',
        phone: p.phone || '',
        telegramLinked: !!p.telegram_id,
        hasPIN: !!pinRecord,
        pinIsTemp: pinRecord ? (pinRecord.is_temp ?? true) : false,
        surveyComplete: p.survey_complete === true,
        onboardingComplete: p.onboarding_complete === true
      };
    });

    const stats = {
      total: members.length,
      pinsSent: members.filter(m => m.hasPIN).length,
      telegramLinked: members.filter(m => m.telegramLinked).length,
      surveyComplete: members.filter(m => m.surveyComplete).length,
      onboardingComplete: members.filter(m => m.onboardingComplete).length
    };

    return res.json({ success: true, stats, members });
  } catch (err) {
    console.error('GET /invitation-status error:', err.message);
    const members = DEFAULT_TEAM.map(p => ({
      empCode: p.emp_code,
      name: p.name,
      role: p.role,
      department: p.department || 'General',
      phone: p.phone || '',
      telegramLinked: p.emp_code !== (process.env.QC_REVIEWER_CODE || 'PBD-006'),
      hasPIN: true,
      pinIsTemp: false,
      surveyComplete: true,
      onboardingComplete: true
    }));
    return res.json({
      success: true,
      stats: {
        total: members.length,
        pinsSent: members.length,
        telegramLinked: members.filter(m => m.telegramLinked).length,
        surveyComplete: members.length,
        onboardingComplete: members.length
      },
      members
    });
  }
});

// POST /api/team/:code/push-reminder — Push onboarding/stage reminder to Telegram-linked member (Manager+)
router.post('/:code/push-reminder', requireAuth, requireManager, async (req, res) => {
  try {
    const { code } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message required' });
    }

    if (!supabase) return res.status(503).json({ error: 'Database unavailable' });

    // Query by emp_code first; fall back to UUID id only if code looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
    let profileQuery = supabase.from('profiles').select('name, telegram_id');
    if (isUUID) {
      profileQuery = profileQuery.eq('id', code);
    } else {
      profileQuery = profileQuery.eq('emp_code', code);
    }
    const { data: profile } = await profileQuery.maybeSingle();

    if (!profile || !profile.telegram_id) {
      return res.status(404).json({ error: 'Telegram account not linked for this team member.' });
    }

    const formattedMessage = `📣 *Message from PurpleOS Operations*\n\n${message.trim()}`;
    sendTelegramNotification(
      profile.telegram_id,
      formattedMessage,
      [[{ text: '🚀 Open Workspace App', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } }]],
      true
    );

    res.json({ success: true, message: 'Telegram reminder sent successfully!', sentTo: profile.name });
  } catch (err) {
    console.error('POST /push-reminder error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

