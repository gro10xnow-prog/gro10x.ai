/**
 * src/services/gig-store.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Freelance Gigs Store & State Persistence Engine.
 * Manages marketplace gig catalogs, accounts, and health checks across Fiverr & Upwork.
 * Persists locally to data/freelance_gigs_state.json with Supabase settings fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('./supabase');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'freelance_gigs_state.json');

let seedState = null;
try {
  seedState = require('../../data/freelance_gigs_state.json');
} catch (e) {
  seedState = { accounts: [], gigs: [] };
}

let inMemoryState = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem on Vercel / serverless runtime — safe to ignore
  }
}

/**
 * Reads state from filesystem cache or in-memory
 */
function getFreelanceState() {
  if (inMemoryState) return inMemoryState;

  try {
    ensureDataDir();
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      inMemoryState = JSON.parse(raw);
      return inMemoryState;
    }
  } catch (e) {
    // Fallback to bundled seed state
  }

  inMemoryState = JSON.parse(JSON.stringify(seedState || { accounts: [], gigs: [] }));
  return inMemoryState;
}

/**
 * Saves state to local JSON file and optionally backs up to Supabase
 */
async function saveFreelanceState(state) {
  inMemoryState = state;

  try {
    ensureDataDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    // Read-only filesystem on Vercel — in-memory and Supabase handle persistence
  }

  // Asynchronous backup to Supabase app_settings table if configured
  if (isSupabaseConfigured && isSupabaseConfigured()) {
    try {
      await supabase
        .from('app_settings')
        .upsert({
          key: 'freelance_gigs_state',
          value: state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    } catch (sbErr) {
      console.warn('[GigStore] Supabase app_settings backup notice:', sbErr.message);
    }
  }

  return inMemoryState;
}

/**
 * Retrieves all gigs, with optional filtering
 */
function getAllGigs(filter = {}) {
  const state = getFreelanceState();
  let list = state.gigs || [];

  if (filter.category) {
    list = list.filter(g => g.category === filter.category);
  }
  if (filter.platform) {
    list = list.filter(g => g.platform === filter.platform);
  }
  if (filter.status) {
    list = list.filter(g => g.status === filter.status);
  }
  if (filter.accountId) {
    list = list.filter(g => g.accountId === filter.accountId);
  }

  return list;
}

/**
 * Retrieves a single gig by its ID
 */
function getGigById(id) {
  const state = getFreelanceState();
  return (state.gigs || []).find(g => g.id === id) || null;
}

/**
 * Inserts or replaces a gig
 */
async function saveGig(gigData) {
  const state = getFreelanceState();
  if (!state.gigs) state.gigs = [];

  const existingIdx = state.gigs.findIndex(g => g.id === gigData.id);
  gigData.updatedAt = new Date().toISOString();

  if (existingIdx >= 0) {
    state.gigs[existingIdx] = { ...state.gigs[existingIdx], ...gigData };
  } else {
    state.gigs.push(gigData);
  }

  await saveFreelanceState(state);
  return gigData;
}

/**
 * Partially updates an existing gig
 */
async function updateGig(id, updates) {
  const state = getFreelanceState();
  if (!state.gigs) state.gigs = [];

  const existingIdx = state.gigs.findIndex(g => g.id === id);
  if (existingIdx < 0) {
    return null;
  }

  const updated = {
    ...state.gigs[existingIdx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  state.gigs[existingIdx] = updated;
  await saveFreelanceState(state);
  return updated;
}

/**
 * Returns all configured freelance accounts
 */
function getAccounts() {
  const state = getFreelanceState();
  return state.accounts || [];
}

/**
 * Returns a single account by ID
 */
function getAccountById(id) {
  const state = getFreelanceState();
  return (state.accounts || []).find(a => a.id === id) || null;
}

module.exports = {
  getFreelanceState,
  saveFreelanceState,
  getAllGigs,
  getGigById,
  saveGig,
  updateGig,
  getAccounts,
  getAccountById
};