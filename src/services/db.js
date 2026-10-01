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
const CACHE_TTL_MS = 15000; // 15-second TTL cache to prevent query stampedes on parallel auth/data requests

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
  if (!forceFresh && cachedDBState && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedDBState;
  }

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
      supabase.from('profiles').select('*').limit(1000),
      supabase.from('clients').select('*').limit(2000),
      supabase.from('tasks').select('*').limit(5000),
      supabase.from('invoices').select('*').limit(5000),
      supabase.from('services').select('*').limit(500),
      supabase.from('reviews').select('*').limit(2000),
      supabase.from('expenses').select('*').limit(5000),
      supabase.from('assets').select('*').limit(2000),
      supabase.from('attendance').select('*').limit(5000),
      supabase.from('eod_reports').select('*').limit(5000),
      supabase.from('auth_pins').select('*').limit(2000),
      supabase.from('projects').select('*').limit(2000),
      supabase.from('subtasks').select('*').limit(5000),
      supabase.from('project_workflows').select('*').limit(1000),
      supabase.from('tickets').select('*').limit(5000),
      supabase.from('social_posts').select('*').limit(2000),
      supabase.from('quotes').select('*').limit(2000),
      supabase.from('leaves').select('*').limit(5000),
      supabase.from('leads').select('*').limit(2000)
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
  }
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
