/**
 * src/services/state.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Data & State Service for PurpleOS / Telegram Bot.
 * Supabase is the Primary Source of Truth.
 * Fallback to readDB() (static db.json) when Supabase is unreachable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('./supabase');
const { broadcast } = require('./sse');
const { normalizePhone } = require('../utils/phone');
const { getBadge, calcBadge } = require('../utils/xp');

function mapProfile(p) {
  if (!p) return null;
  return {
    id: p.emp_code || p.id,
    emp_code: p.emp_code || p.id,
    name: p.name || 'Team Member',
    role: p.role || 'Specialist',
    department: p.department || '',
    telegramId: p.telegram_id ? String(p.telegram_id) : null,
    phone: p.phone || '',
    baseSalary: Number(p.base_salary) || 0,
    commissionRate: Number(p.commission_rate) || 0,
    earnedCommissions: Number(p.earned_commissions) || 0,
    status: p.status || 'Offline',
    xp: Number(p.xp) || 0,
    badge: p.badge || calcBadge(Number(p.xp) || 0),
    onboardingComplete: Boolean(p.onboarding_complete),
    accessLevel: p.access_level || 'Specialist / Crew',
    reportsTo: p.reports_to || '',
    email: p.email || p.personal_email || '',
    emergencyContact: p.emergency_contact || '',
    address: p.address || '',
    bankInfo: p.bank_info || {}
  };
}

const _cache = new Map();

function getCached(key, fetchFn, ttlMs = 60000) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return Promise.resolve(hit.data);
  }
  return fetchFn().then(data => {
    if (data !== null && data !== undefined) {
      _cache.set(key, { data, ts: Date.now() });
    }
    return data;
  });
}

function invalidateCache(keyPrefix) {
  if (!keyPrefix) {
    _cache.clear();
    return;
  }
  for (const k of _cache.keys()) {
    if (k.startsWith(keyPrefix)) _cache.delete(k);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE LOOKUPS & MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function getEmployeeByTelegramId(chatId) {
  if (!chatId) return null;
  const strId = String(chatId);
  return getCached(`emp_tg_${strId}`, async () => {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', strId)
          .maybeSingle();
        if (data) return mapProfile(data);
      } catch (e) {
        console.warn('state.getEmployeeByTelegramId Supabase err:', e.message);
      }
    }
    return null;
  }, 60000);
}

async function getEmployeeByCode(empCode) {
  if (!empCode) return null;
  const str = String(empCode).trim();
  return getCached(`emp_code_${str}`, async () => {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('emp_code', str)
          .maybeSingle();
        if (data) return mapProfile(data);
      } catch (e) {
        console.warn('state.getEmployeeByCode Supabase err:', e.message);
      }
    }
    return null;
  }, 60000);
}

async function getEmployeeByPhone(phone) {
  if (!phone) return null;
  const norm = normalizePhone(phone);
  const last10 = norm.slice(-10);

  return getCached(`emp_phone_${last10}`, async () => {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .or(`phone.ilike.%${last10}`);
        if (data && data.length > 0) {
          const found = data.find(p => normalizePhone(p.phone) === norm);
          if (found) return mapProfile(found);
        }
      } catch (e) {
        console.warn('state.getEmployeeByPhone Supabase err:', e.message);
      }
    }
    return null;
  }, 60000);
}

async function getAllTeam() {
  return getCached('all_team', async () => {
    if (supabase) {
      try {
        const { data } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
        if (data) return data.map(mapProfile);
      } catch (e) {
        console.warn('state.getAllTeam Supabase err:', e.message);
      }
    }
    return [];
  }, 60000);
}

async function linkTelegramId(empCode, chatId) {
  const strId = String(chatId);
  if (supabase) {
    try {
      await supabase.from('profiles').update({ telegram_id: strId, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
      invalidateCache('all_team');
    } catch (e) {
      console.warn('state.linkTelegramId Supabase err:', e.message);
    }
  }
}

async function setOnboardingComplete(empCode) {
  if (supabase) {
    try {
      await supabase.from('profiles').update({ onboarding_complete: true, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
      invalidateCache('all_team');
    } catch (e) {
      console.warn('state.setOnboardingComplete Supabase err:', e.message);
    }
  }
}

async function awardXP(empCode, xpAmount) {
  const isEmpCode = /^PBD-\d+/i.test(String(empCode));
  const emp = isEmpCode
    ? await getEmployeeByCode(empCode)
    : (await getEmployeeByTelegramId(empCode) || await getEmployeeByPhone(empCode));
  if (!emp) return;

  const newXP = (emp.xp || 0) + Number(xpAmount);
  const badge = calcBadge(newXP);

  if (supabase) {
    try {
      await supabase.from('profiles').update({ xp: newXP, badge, updated_at: new Date().toISOString() }).eq('emp_code', emp.emp_code);
      invalidateCache('all_team');
    } catch (e) {
      console.warn('state.awardXP Supabase err:', e.message);
    }
  }
  return { newXP, badge };
}

function getBroadcast() {
  try {
    return require('./sse').broadcast;
  } catch (e) {
    return () => {};
  }
}

async function updateStatus(empCode, status) {
  if (supabase) {
    try {
      await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
      getBroadcast()('team_update', [{ emp_code: empCode, employee_id: empCode, status }]);
    } catch (e) {
      console.warn('state.updateStatus Supabase err:', e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function clockIn(empCode, empName, location = 'Niketon Studio') {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (supabase) {
    const { error: upsertErr } = await supabase.from('attendance').upsert({
      employee_id: empCode,
      name: empName,
      status: 'In Studio',
      clock_in_time: nowTime,
      location,
      date: today
    }, { onConflict: 'employee_id,date' });

    if (upsertErr) {
      console.warn('state.clockIn Supabase upsert err:', upsertErr.message);
      throw upsertErr;
    }

    try {
      await supabase.from('profiles').update({ status: 'In Studio' }).eq('emp_code', empCode);
    } catch (e) {}

    getBroadcast()('attendance_update', [{ employee_id: empCode, name: empName, status: 'In Studio', clock_in_time: nowTime, clockInTime: nowTime, date: today }]);
    getBroadcast()('team_update', [{ emp_code: empCode, employee_id: empCode, status: 'In Studio' }]);
  }
  return { time: nowTime, status: 'In Studio', location };
}

async function clockOut(empCode) {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (supabase) {
    const { error: updateErr } = await supabase.from('attendance').update({ status: 'Clocked Out', clock_out_time: nowTime }).eq('employee_id', empCode).eq('date', today);
    if (updateErr) {
      console.warn('state.clockOut Supabase update err:', updateErr.message);
      throw updateErr;
    }

    try {
      await supabase.from('profiles').update({ status: 'Offline' }).eq('emp_code', empCode);
    } catch (e) {}

    getBroadcast()('attendance_update', [{ employee_id: empCode, status: 'Clocked Out', clock_out_time: nowTime, clockOutTime: nowTime, date: today }]);
    getBroadcast()('team_update', [{ emp_code: empCode, employee_id: empCode, status: 'Offline' }]);
  }
  return { time: nowTime, status: 'Offline' };
}

async function getTodayAttendance(empCode) {
  const today = new Date().toISOString().split('T')[0];
  if (supabase) {
    try {
      const { data } = await supabase.from('attendance').select('*').eq('employee_id', empCode).eq('date', today).maybeSingle();
      if (data) return data;
    } catch (e) {
      console.warn('state.getTodayAttendance Supabase err:', e.message);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE & EXPENSE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function submitLeave(empCode, empName, leaveData) {
  const newId = `LEV-${Date.now()}`;
  const payload = {
    id: newId,
    employee_id: empCode,
    employee_name: empName,
    leave_type: leaveData.leaveType || leaveData.type || 'Casual Leave',
    start_date: leaveData.startDate || leaveData.fromDate || new Date().toISOString().split('T')[0],
    end_date: leaveData.endDate || leaveData.toDate || new Date().toISOString().split('T')[0],
    total_days: Number(leaveData.totalDays || leaveData.total_days || leaveData.days) || 1,
    reason: leaveData.reason || '',
    status: 'Pending',
    submitted_via: 'telegram_bot'
  };

  if (supabase) {
    const { data, error } = await supabase.from('leaves').insert([payload]).select().single();
    if (error) throw new Error(`Leave DB error: ${error.message}`);
    try { broadcast('leave_update', data || payload); } catch (e) {}
    if (data) return data;
  }
  try { broadcast('leave_update', payload); } catch (e) {}
  return payload;
}

async function getMyLeaves(empCode) {
  if (supabase) {
    try {
      const { data } = await supabase.from('leaves').select('*').eq('employee_id', empCode).order('created_at', { ascending: false });
      if (data) return data;
    } catch (e) {
      console.warn('state.getMyLeaves Supabase err:', e.message);
    }
  }
  return [];
}

async function submitExpense(empCode, empName, expenseData) {
  const count = Date.now();
  const newId = `EXP-${String(count).slice(-6)}`;
  const payload = {
    id: newId,
    title: expenseData.title || expenseData.description || 'Bot Claim',
    category: expenseData.category || 'Production Supplies',
    amount: Number(expenseData.amount) || 0,
    date: expenseData.date || new Date().toISOString().split('T')[0],
    logged_by: empName || 'Team Member',
    submitted_by: empName || 'Team Member',
    submitted_by_id: empCode || null,
    employee_id: empCode || null,
    submitted_via: 'telegram_bot',
    currency: 'BDT',
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
    if (error) throw new Error(`Expense DB error: ${error.message}`);
    try { broadcast('expense_update', data || payload); } catch (e) {}
    if (data) return data;
  }
  try { broadcast('expense_update', payload); } catch (e) {}
  return payload;
}

async function getMyExpenses(empCode, empName = '') {
  if (supabase) {
    try {
      let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (empCode && empName) {
        query = query.or(`submitted_by_id.eq.${empCode},employee_id.eq.${empCode},logged_by.ilike.%${empName}%`);
      } else if (empCode) {
        query = query.or(`submitted_by_id.eq.${empCode},employee_id.eq.${empCode}`);
      } else if (empName) {
        query = query.ilike('logged_by', `%${empName}%`);
      }
      const { data } = await query;
      if (data) return data;
    } catch (e) {
      console.warn('state.getMyExpenses Supabase err:', e.message);
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// EOD REPORTS LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function submitEOD(empCode, empName, eodData) {
  const today = new Date().toISOString().split('T')[0];
  const newId = `EOD-${empCode}-${today}`;
  const payload = {
    id: newId,
    employee_id: empCode,
    employee_name: empName,
    report_date: today,
    tasks_done: eodData.done || eodData.tasksDone || '',
    tasks_tomorrow: eodData.tomorrow || eodData.tasksTomorrow || '',
    blockers: eodData.blockers || 'None',
    mood: eodData.mood || '😊 Energized',
    hours_worked: Number(eodData.hours) || 8,
    submitted_via: 'telegram_bot'
  };

  if (supabase) {
    const { data, error } = await supabase.from('eod_reports').upsert(payload, { onConflict: 'employee_id,report_date' }).select().single();
    if (error) throw new Error(`EOD DB error: ${error.message}`);
    try { broadcast('eod_update', data || payload); } catch (e) {}
    if (data) return data;
  }
  try { broadcast('eod_update', payload); } catch (e) {}
  return payload;
}

async function getMyEODs(empCode) {
  if (supabase) {
    try {
      const { data } = await supabase.from('eod_reports').select('*').eq('employee_id', empCode).order('report_date', { ascending: false });
      if (data) return data;
    } catch (e) {
      console.warn('state.getMyEODs Supabase err:', e.message);
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION STATE (Wizards on Vercel)
// ─────────────────────────────────────────────────────────────────────────────

async function getSession(chatId) {
  if (!chatId) return null;
  const strId = String(chatId);

  if (supabase) {
    try {
      const { data } = await supabase.from('bot_sessions').select('state, updated_at').eq('chat_id', strId).maybeSingle();
      if (data && data.state) {
        // Auto-expire sessions older than 30 minutes
        if (data.updated_at) {
          const updatedAt = new Date(data.updated_at);
          const ageMinutes = (Date.now() - updatedAt.getTime()) / 1000 / 60;
          if (ageMinutes > 30) {
            await supabase.from('bot_sessions').delete().eq('chat_id', strId).catch(() => {});
            return null;
          }
        }
        return data.state;
      }
    } catch (e) {
      console.warn('state.getSession Supabase err:', e.message);
    }
  }
  return null;
}

async function setSession(chatId, stateObject) {
  if (!chatId) return;
  const strId = String(chatId);

  if (supabase) {
    try {
      await supabase.from('bot_sessions').upsert({
        chat_id: strId,
        state: stateObject || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'chat_id' });
    } catch (e) {
      console.warn('state.setSession Supabase err:', e.message);
    }
  }
}

async function clearSession(chatId) {
  if (!chatId) return;
  const strId = String(chatId);

  if (supabase) {
    try {
      await supabase.from('bot_sessions').delete().eq('chat_id', strId);
    } catch (e) {
      console.warn('state.clearSession Supabase err:', e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

async function getTeamSnapshot() {
  const team = await getAllTeam();
  return {
    total: team.length,
    inStudio: team.filter(m => m.status === 'In Studio').length,
    onShoot: team.filter(m => m.status === 'On Field Shoot').length,
    onLeave: team.filter(m => m.status === 'On Leave').length,
    offline: team.filter(m => !m.status || m.status === 'Offline').length,
  };
}

module.exports = {
  getEmployeeByTelegramId,
  getEmployeeByCode,
  getEmployeeByPhone,
  getAllTeam,
  linkTelegramId,
  setOnboardingComplete,
  awardXP,
  updateStatus,
  clockIn,
  clockOut,
  getTodayAttendance,
  submitLeave,
  getMyLeaves,
  submitExpense,
  getMyExpenses,
  submitEOD,
  getMyEODs,
  getSession,
  setSession,
  clearSession,
  getTeamSnapshot,
  normalizePhone,
  invalidateCache,
  calcBadge,
  getBadge
};
