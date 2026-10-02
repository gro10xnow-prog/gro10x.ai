/**
 * src/services/db.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase-Native Data Layer.
 * Local db.json has been COMPLETELY ELIMINATED.
 * All reads and writes go directly to Supabase in real-time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('./supabase');

const DB_JSON_PATH = path.join(__dirname, '../../data/db.json');

function getEmptyFallbackDB() {
  return {
    team: [],
    clients: [],
    tasks: [],
    invoices: [],
    services: [],
    reviews: [],
    expenses: [],
    assets: [],
    attendance: [],
    eod_reports: [],
    projects: [],
    subtasks: [],
    workflows: [],
    tickets: [],
    posts: [],
    quotes: [],
    leaves: [],
    authPins: [],
    disputes: [],
    testimonials: [],
    handover_manifests: []
  };
}

function mapProfileToTeam(p) {
  if (!p) return null;
  return {
    id: p.emp_code || p.id,
    emp_code: p.emp_code || p.id,
    name: p.name || '',
    role: p.role || '',
    department: p.department || '',
    telegramId: p.telegram_id ? String(p.telegram_id) : null,
    phone: p.phone || '',
    email: p.email || p.personal_email || '',
    baseSalary: Number(p.base_salary) || 0,
    commissionRate: Number(p.commission_rate) || 0,
    earnedCommissions: Number(p.earned_commissions) || 0,
    status: p.status || 'Offline',
    xp: Number(p.xp) || 0,
    badge: p.badge || '🌱 Recruit',
    onboardingComplete: Boolean(p.onboarding_complete),
    accessLevel: p.access_level || 'Specialist / Crew',
    reportsTo: p.reports_to || '',
    emergencyContact: p.emergency_contact || '',
    address: p.address || ''
  };
}

let cachedDBState = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15-second TTL cache

// Single-flight guard: when a cache miss is in-flight, all concurrent callers
// await the SAME promise instead of each launching a separate 19-table waterfall.
// This prevents the "thundering herd" / cache stampede under high concurrency.
let _inflight = null;

async function readDB(forceFresh = false) {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured — returning fallback data structure.');
    if (cachedDBState) return cachedDBState;
    try {
      if (fs.existsSync(DB_JSON_PATH)) {
        const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
        cachedDBState = { ...getEmptyFallbackDB(), ...JSON.parse(raw) };
        return cachedDBState;
      }
    } catch (_) {}
    return getEmptyFallbackDB();
  }

  const now = Date.now();

  // Cache hit — return immediately without any DB call
  if (!forceFresh && cachedDBState && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedDBState;
  }

  // Single-flight: if a refresh is already in-flight, piggyback on it
  if (_inflight) {
    return _inflight;
  }

  // Launch single-flight: one Promise for all concurrent callers until resolved
  _inflight = (async () => {
    try {
      const [
        { data: profiles },
        { data: clients },
        { data: tasks },
        { data: invoices },
        { data: services },
        { data: reviews },
        { data: expenses },
        { data: assets },
        { data: attendance },
        { data: eod },
        { data: authPins },
        { data: projects },
        { data: subtasks },
        { data: workflows },
        { data: tickets },
        { data: posts },
        { data: quotes },
        { data: leaves },
        { data: leads }
      ] = await Promise.all([
        supabase.from('profiles').select('id, emp_code, name, role, department, dbm_id, telegram_id, phone, base_salary, status, xp, badge, email').limit(1000),
        supabase.from('clients').select('id, name, email, phone, company, status, assigned_am, billing_tier, created_at').limit(2000),
        supabase.from('tasks').select('id, title, stage, priority, due_date, client_id, assigned_to, sprint_id, created_at').limit(3000),
        supabase.from('invoices').select('id, client_id, amount, status, due_date, issue_date, paid_at').limit(2000),
        supabase.from('services').select('*').limit(500),
        supabase.from('reviews').select('id, title, project_id, status, client_id, created_at').limit(1000),
        supabase.from('expenses').select('id, title, amount, category, status, date, logged_by').limit(2000),
        supabase.from('assets').select('*').limit(1000),
        supabase.from('attendance').select('id, emp_code, date, clock_in_time, clock_out_time, status').limit(2000),
        supabase.from('eod_reports').select('id, emp_code, date, tasks_completed, blockers, created_at').limit(2000),
        supabase.from('auth_pins').select('phone, norm_phone, pin, is_temp, linked_id, linked_type, email').limit(2000),
        supabase.from('projects').select('id, name, client_id, delivery_status, warranty_until, created_at').limit(1000),
        supabase.from('subtasks').select('id, task_id, title, completed').limit(2000),
        supabase.from('project_workflows').select('*').limit(500),
        supabase.from('tickets').select('id, title, project_id, client_id, priority, status, created_at').limit(2000),
        supabase.from('social_posts').select('id, client_id, status, scheduled_date, platform, content').limit(1000),
        supabase.from('quotes').select('*').limit(1000),
        supabase.from('leaves').select('id, emp_code, type, status, start_date, end_date').limit(1000),
        supabase.from('leads').select('id, name, email, phone, company, stage, score, created_at').limit(1000)
      ]);

      cachedDBState = {
        team: (profiles || []).map(mapProfileToTeam),
        clients: clients || [],
        tasks: tasks || [],
        invoices: invoices || [],
        services: services || [],
        reviews: reviews || [],
        expenses: expenses || [],
        assets: assets || [],
        attendance: attendance || [],
        eod_reports: eod || [],
        projects: projects || [],
        subtasks: subtasks || [],
        workflows: workflows || [],
        tickets: tickets || [],
        posts: posts || [],
        quotes: quotes || [],
        leaves: leaves || [],
        leads: leads || cachedDBState?.leads || [],
        disputes: cachedDBState?.disputes || [],
        testimonials: cachedDBState?.testimonials || [],
        handover_manifests: cachedDBState?.handover_manifests || [],
        authPins: (authPins || []).map(ap => ({
          phone: ap.phone,
          normPhone: ap.norm_phone,
          pin: ap.pin,
          isTemp: ap.is_temp,
          linkedId: ap.linked_id,
          linkedType: ap.linked_type,
          email: ap.email
        }))
      };
      lastCacheTime = Date.now();
      return cachedDBState;
    } catch (e) {
      console.error('❌ Supabase readDB error:', e.message);
      if (cachedDBState) {
        console.warn('⚠️ Returning last-known-good cached DB state.');
        return cachedDBState;
      }
      try {
        if (fs.existsSync(DB_JSON_PATH)) {
          const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
          cachedDBState = { ...getEmptyFallbackDB(), ...JSON.parse(raw) };
          return cachedDBState;
        }
      } catch (_) {}
      return getEmptyFallbackDB();
    } finally {
      // Always clear the in-flight guard so the next cache miss starts fresh
      _inflight = null;
    }
  })();

  return _inflight;
}

async function writeDB(data) {
  if (data && typeof data === 'object') {
    cachedDBState = { ...(cachedDBState || getEmptyFallbackDB()), ...data };
    try {
      if (fs.existsSync(DB_JSON_PATH)) {
        const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        const merged = { ...parsed, ...data };
        fs.writeFileSync(DB_JSON_PATH, JSON.stringify(merged, null, 2), 'utf8');
      }
    } catch (_) {}
  }
  return true;
}

module.exports = {
  readDB,
  writeDB
};
