/**
 * src/routes/meet-copilot.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Meet Copilot Telemetry & Analytics Router.
 * Tracks active users, recorded sessions, compilations, and export events.
 * Supports Supabase with automatic local JSON fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, asyncHandler } = require('../utils/response');

const ANALYTICS_FILE = path.join(__dirname, '../../data/meet_copilot_analytics.json');

// Ensure local fallback store exists
function readLocalAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[MeetCopilot] Local analytics read error:', e.message);
  }
  return {
    events: [],
    users: {},
    sessions: {},
    totals: {
      totalUsers: 0,
      totalSessions: 0,
      totalCompilations: 0,
      totalExports: 0,
      totalMinutesRecorded: 0
    }
  };
}

function writeLocalAnalytics(data) {
  try {
    const dir = path.dirname(ANALYTICS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Keep max last 2,000 events locally to prevent file bloating
    if (data.events && data.events.length > 2000) {
      data.events = data.events.slice(-2000);
    }
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[MeetCopilot] Local analytics write error:', e.message);
  }
}

/**
 * POST /api/meet-copilot/telemetry
 * Ingest anonymous usage events from Meet Copilot extension
 */
router.post('/telemetry', asyncHandler(async (req, res) => {
  const {
    clientId,
    sessionId,
    eventType,
    meetingCode,
    meetingTitle,
    durationSeconds = 0,
    turnCount = 0,
    targetLanguage = 'English',
    exportFormat = null
  } = req.body || {};

  if (!clientId || !eventType) {
    return fail(res, 400, 'clientId and eventType are required', 'MISSING_TELEMETRY_FIELDS');
  }

  const cleanEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    client_id: String(clientId).slice(0, 80),
    session_id: sessionId ? String(sessionId).slice(0, 80) : null,
    event_type: String(eventType).slice(0, 40), // 'session_start' | 'session_compile' | 'session_export' | 'session_heartbeat'
    meeting_code: meetingCode ? String(meetingCode).slice(0, 30) : null,
    meeting_title: meetingTitle ? String(meetingTitle).slice(0, 150) : null,
    duration_seconds: Math.max(0, parseInt(durationSeconds, 10) || 0),
    turn_count: Math.max(0, parseInt(turnCount, 10) || 0),
    target_language: String(targetLanguage || 'English').slice(0, 30),
    export_format: exportFormat ? String(exportFormat).slice(0, 20) : null,
    created_at: new Date().toISOString()
  };

  // 1. Try Supabase if configured
  let savedToSupabase = false;
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('meet_copilot_events').insert([cleanEvent]);
      if (!error) {
        savedToSupabase = true;
      }
    } catch (_) {
      // Graceful fallback to local store if table not yet migrated
    }
  }

  // 2. Always maintain local aggregates / fallback
  const store = readLocalAnalytics();
  store.events.push(cleanEvent);

  if (!store.users[cleanEvent.client_id]) {
    store.users[cleanEvent.client_id] = { firstSeen: cleanEvent.created_at, sessionCount: 0 };
  }
  store.users[cleanEvent.client_id].lastSeen = cleanEvent.created_at;

  if (cleanEvent.session_id) {
    if (!store.sessions[cleanEvent.session_id]) {
      store.sessions[cleanEvent.session_id] = {
        sessionId: cleanEvent.session_id,
        clientId: cleanEvent.client_id,
        meetingCode: cleanEvent.meeting_code,
        meetingTitle: cleanEvent.meeting_title,
        startedAt: cleanEvent.created_at,
        durationSeconds: 0,
        turnCount: 0,
        compiled: false,
        exported: false
      };
      store.users[cleanEvent.client_id].sessionCount = (store.users[cleanEvent.client_id].sessionCount || 0) + 1;
    }
    const sess = store.sessions[cleanEvent.session_id];
    if (cleanEvent.duration_seconds > sess.durationSeconds) {
      sess.durationSeconds = cleanEvent.duration_seconds;
    }
    if (cleanEvent.turn_count > sess.turnCount) {
      sess.turnCount = cleanEvent.turn_count;
    }
    if (cleanEvent.event_type === 'session_compile') {
      sess.compiled = true;
    }
    if (cleanEvent.event_type === 'session_export') {
      sess.exported = true;
    }
  }

  // Compute live totals
  store.totals.totalUsers = Object.keys(store.users).length;
  store.totals.totalSessions = Object.keys(store.sessions).length;
  store.totals.totalCompilations = store.events.filter(e => e.event_type === 'session_compile').length;
  store.totals.totalExports = store.events.filter(e => e.event_type === 'session_export').length;
  
  const totalSeconds = Object.values(store.sessions).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  store.totals.totalMinutesRecorded = Math.round(totalSeconds / 60);

  writeLocalAnalytics(store);

  return ok(res, {
    recorded: true,
    storage: savedToSupabase ? 'supabase' : 'local',
    totals: store.totals
  });
}));

/**
 * GET /api/meet-copilot/stats
 * Returns high-level usage metrics and session summaries
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const store = readLocalAnalytics();

  // Try fetching fresh count from Supabase if available
  let stats = { ...store.totals };
  if (isSupabaseConfigured()) {
    try {
      const { count: eventCount, error: countErr } = await supabase
        .from('meet_copilot_events')
        .select('*', { count: 'exact', head: true });
      if (!countErr && typeof eventCount === 'number') {
        stats.totalEventsRecorded = eventCount;
      }
    } catch (_) {}
  }

  const recentSessions = Object.values(store.sessions)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 15)
    .map(s => ({
      sessionId: s.sessionId,
      meetingTitle: s.meetingTitle || 'Google Meet Sync',
      meetingCode: s.meetingCode,
      durationMinutes: Math.round((s.durationSeconds || 0) / 60),
      turnCount: s.turnCount,
      compiled: s.compiled,
      startedAt: s.startedAt
    }));

  return ok(res, {
    totals: stats,
    recentSessions
  });
}));

module.exports = router;
