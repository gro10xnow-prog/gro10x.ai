/**
 * src/services/state.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Data & State Service for PurpleOS / Telegram Bot.
 * Supabase is the Primary Source of Truth.
 * Fallback to readDB() (static db.json) when Supabase is unreachable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('./supabase');
const { readDB } = require('./db');

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function calcBadge(xp) {
  if (xp >= 2000) return '💜 Champion';
  if (xp >= 1000) return '🔥 Performer';
  if (xp >= 500)  return '⭐ Rising Star';
  return '🌱 Recruit';
}

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
    address: p.address || ''
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE LOOKUPS & MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function getEmployeeByTelegramId(chatId) {
  if (!chatId) return null;
  const strId = String(chatId);

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

  // Fallback to db.json
  const db = readDB();
  const found = (db.team || []).find(e => String(e.telegramId) === strId);
  return found ? mapProfile({ ...found, emp_code: found.id, telegram_id: found.telegramId }) : null;
}

async function getEmployeeByPhone(phone) {
  if (!phone) return null;
  const norm = normalizePhone(phone);

  if (supabase) {
    try {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) {
        const found = data.find(p => normalizePhone(p.phone) === norm);
        if (found) return mapProfile(found);
      }
    } catch (e) {
      console.warn('state.getEmployeeByPhone Supabase err:', e.message);
    }
  }

  // Fallback to db.json
  const db = readDB();
  const found = (db.team || []).find(e => normalizePhone(e.phone) === norm);
  return found ? mapProfile({ ...found, emp_code: found.id, telegram_id: found.telegramId }) : null;
}

async function getAllTeam() {
  if (supabase) {
    try {
      const { data } = await supabase.from('profiles').select('*').order('emp_code', { ascending: true });
      if (data) return data.map(mapProfile);
    } catch (e) {
      console.warn('state.getAllTeam Supabase err:', e.message);
    }
  }
  const db = readDB();
  return (db.team || []).map(e => mapProfile({ ...e, emp_code: e.id, telegram_id: e.telegramId }));
}

async function linkTelegramId(empCode, chatId) {
  const strId = String(chatId);
  if (supabase) {
    try {
      await supabase.from('profiles').update({ telegram_id: strId, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
    } catch (e) {
      console.warn('state.linkTelegramId Supabase err:', e.message);
    }
  }
}

async function setOnboardingComplete(empCode) {
  if (supabase) {
    try {
      await supabase.from('profiles').update({ onboarding_complete: true, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
    } catch (e) {
      console.warn('state.setOnboardingComplete Supabase err:', e.message);
    }
  }
}

async function awardXP(empCode, xpAmount) {
  const emp = await getEmployeeByTelegramId(empCode) || await getEmployeeByPhone(empCode);
  if (!emp) return;

  const newXP = (emp.xp || 0) + Number(xpAmount);
  const badge = calcBadge(newXP);

  if (supabase) {
    try {
      await supabase.from('profiles').update({ xp: newXP, badge, updated_at: new Date().toISOString() }).eq('emp_code', emp.emp_code);
    } catch (e) {
      console.warn('state.awardXP Supabase err:', e.message);
    }
  }
  return { newXP, badge };
}

async function updateStatus(empCode, status) {
  if (supabase) {
    try {
      await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('emp_code', empCode);
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
    try {
      await supabase.from('attendance').upsert({
        employee_id: empCode,
        name: empName,
        status: 'In Studio',
        clock_in_time: nowTime,
        location,
        date: today
      }, { onConflict: 'employee_id,date' });

      await supabase.from('profiles').update({ status: 'In Studio' }).eq('emp_code', empCode);
    } catch (e) {
      console.warn('state.clockIn Supabase err:', e.message);
    }
  }
  return { time: nowTime, status: 'In Studio', location };
}

async function clockOut(empCode) {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (supabase) {
    try {
      await supabase.from('attendance').update({ status: 'Clocked Out', clock_out_time: nowTime }).eq('employee_id', empCode).eq('date', today);
      await supabase.from('profiles').update({ status: 'Offline' }).eq('emp_code', empCode);
    } catch (e) {
      console.warn('state.clockOut Supabase err:', e.message);
    }
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
    total_days: Number(leaveData.totalDays) || 1,
    reason: leaveData.reason || '',
    status: 'Pending Line Review',
    submitted_via: 'telegram_bot'
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('leaves').insert([payload]).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('state.submitLeave Supabase err:', e.message);
    }
  }
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
    logged_by: empName,
    submitted_by: empName,
    submitted_by_id: empCode,
    receipt_url: expenseData.receiptUrl || '',
    description: expenseData.description || '',
    status: 'Tier 1 Pending',
    submitted_via: 'telegram_bot'
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('state.submitExpense Supabase err:', e.message);
    }
  }
  return payload;
}

async function getMyExpenses(empCode) {
  if (supabase) {
    try {
      const { data } = await supabase.from('expenses').select('*').eq('submitted_by_id', empCode).order('created_at', { ascending: false });
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
    try {
      const { data, error } = await supabase.from('eod_reports').upsert(payload, { onConflict: 'employee_id,report_date' }).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('state.submitEOD Supabase err:', e.message);
    }
  }
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
      const { data } = await supabase.from('bot_sessions').select('state').eq('chat_id', strId).maybeSingle();
      if (data && data.state) return data.state;
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
  normalizePhone
};
