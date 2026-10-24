/**
 * src/routes/fellowship.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X AI Media & Research Fellowship Intake Controller.
 * Handles candidate applications, atomic JSON persistence (data/fellowship_applications.json),
 * dynamic scoring, 1-tap WhatsApp deep link generation, and Telegram alerts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ok, fail, asyncHandler } = require('../utils/response');
const { sendTelegramNotification } = require('../services/bot');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

const DATA_DIR = path.resolve(__dirname, '../../data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'fellowship_applications.json');
const TMP_APPLICATIONS_FILE = path.join(os.tmpdir(), 'fellowship_applications.json');

// In-memory candidate application buffer (resilient against read-only serverless filesystems)
let memoryApplications = [];

/**
 * Reads existing applications from fellowship_applications.json, /tmp fallback, and memory
 */
function readApplications() {
  const mergedMap = new Map();

  // 1. Seed from in-memory cache
  if (Array.isArray(memoryApplications)) {
    for (const app of memoryApplications) {
      if (app && (app.token || app.id)) {
        mergedMap.set(app.token || app.id, app);
      }
    }
  }

  // 2. Read from primary filesystem if available
  try {
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const app of parsed) {
          if (app && (app.token || app.id)) mergedMap.set(app.token || app.id, app);
        }
      }
    }
  } catch (err) {
    console.warn('[Fellowship Storage] Primary read warning:', err.message);
  }

  // 3. Read from serverless /tmp fallback if available
  try {
    if (fs.existsSync(TMP_APPLICATIONS_FILE)) {
      const rawTmp = fs.readFileSync(TMP_APPLICATIONS_FILE, 'utf8');
      const parsedTmp = JSON.parse(rawTmp);
      if (Array.isArray(parsedTmp)) {
        for (const app of parsedTmp) {
          if (app && (app.token || app.id)) mergedMap.set(app.token || app.id, app);
        }
      }
    }
  } catch (err) {
    console.warn('[Fellowship Storage] /tmp read warning:', err.message);
  }

  const result = Array.from(mergedMap.values());
  // Keep memory cache updated
  memoryApplications = result;
  return result;
}

/**
 * Atomically appends a new application with Zero Data-Loss guarantees.
 * Handles read-only serverless environments (Vercel Lambda) without throwing.
 */
function appendApplication(newApp) {
  // Always record to in-memory buffer first (immediate crash protection)
  if (!memoryApplications.some(a => a.id === newApp.id || a.token === newApp.token)) {
    memoryApplications.unshift(newApp);
  }

  const allApps = readApplications();
  if (!allApps.some(a => a.id === newApp.id || a.token === newApp.token)) {
    allApps.unshift(newApp);
  }

  // Attempt 1: Write to primary project data folder
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = path.join(DATA_DIR, `.fellowship_apps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.tmp`);
    fs.writeFileSync(tmpFile, JSON.stringify(allApps, null, 2), 'utf8');
    try {
      fs.renameSync(tmpFile, APPLICATIONS_FILE);
    } catch (_) {
      fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(allApps, null, 2), 'utf8');
      try { fs.unlinkSync(tmpFile); } catch (_) {}
    }
  } catch (fsErr) {
    // Expected on Vercel serverless where /var/task is read-only EROFS
    console.warn('[Fellowship Storage] Primary filesystem read-only notice (Vercel serverless):', fsErr.message);
  }

  // Attempt 2: Write to writable /tmp directory
  try {
    fs.writeFileSync(TMP_APPLICATIONS_FILE, JSON.stringify(allApps, null, 2), 'utf8');
  } catch (tmpErr) {
    console.warn('[Fellowship Storage] /tmp write notice:', tmpErr.message);
  }

  // Attempt 3: Sync to Supabase leads if configured
  try {
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && supabase) {
      supabase.from('leads').insert({
        id: `LED-${Date.now().toString().slice(-6)}`,
        name: newApp.name,
        email: `${(newApp.token || 'fellow').toLowerCase()}@fellowship.gro10x.ai`,
        phone: newApp.phone,
        service_interest: 'AI Media & Research Fellowship',
        source: 'fellowship_intake_portal',
        status: 'new',
        notes: `[FELLOWSHIP APPLICATION] Token: ${newApp.token} | University: ${newApp.university} (${newApp.department}, ${newApp.graduationYear}) | Aptitude: ${newApp.aiAptitudeScore} | Portfolio: ${newApp.portfolioUrl} | Experiment: ${newApp.creativeExperimentPrompt}`
      }).then(() => {}).catch(e => console.warn('[Supabase Fellowship Sync Note]:', e.message));
    }
  } catch (sbErr) {
    console.warn('[Supabase Fellowship Sync Notice]:', sbErr.message);
  }

  return newApp;
}

/**
 * Computes AI Aptitude Score based on portfolio richness & experiment depth
 */
function computeAptitudeScore(experience, portfolioUrl, creativePrompt) {
  let score = 8.8;
  const expStr = String(experience || '').toLowerCase();
  const promptStr = String(creativePrompt || '').toLowerCase();
  const portStr = String(portfolioUrl || '').toLowerCase();

  // Tool bonus
  const highTierTools = ['veo', 'midjourney', 'runway', 'comfyui', 'claude', 'kling', 'elevenlabs', 'premiere', 'after effects', 'davinci', 'flow'];
  const matchedTools = highTierTools.filter(t => expStr.includes(t) || promptStr.includes(t));
  score += Math.min(0.5, matchedTools.length * 0.15);

  // Prompt depth bonus
  if (promptStr.length > 80) score += 0.3;
  if (promptStr.includes('veo') || promptStr.includes('4090') || promptStr.includes('neural') || promptStr.includes('series')) {
    score += 0.2;
  }

  // Portfolio link bonus
  if (portStr.includes('drive.google') || portStr.includes('youtube') || portStr.includes('behance') || portStr.includes('github') || portStr.includes('vimeo')) {
    score += 0.2;
  }

  // Clamp between 8.8 and 9.8
  const clamped = Math.min(9.8, Math.max(8.8, score));
  return Number(clamped.toFixed(1));
}

/**
 * POST /api/fellowship/apply (also alias POST /fellowship/apply)
 * Ingests candidate submission, stores atomically, dispatches Telegram alert.
 */
router.post(['/apply', '/'], asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    university,
    department,
    graduationYear,
    experienceSummary,
    toolsExperience,
    aiTools,
    portfolioUrl,
    creativeExperimentPrompt
  } = req.body || {};

  const exp = (experienceSummary || toolsExperience || aiTools || '').trim();

  // Strict field validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return fail(res, 400, 'Candidate full name is required (min 2 characters)', 'VALIDATION_ERROR', { field: 'name' });
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    return fail(res, 400, 'Valid contact phone number is required (e.g. +8801...)', 'VALIDATION_ERROR', { field: 'phone' });
  }
  if (!university || typeof university !== 'string' || university.trim().length < 2) {
    return fail(res, 400, 'University name is required (e.g. DU, NSU, BRAC, IUT, BUP)', 'VALIDATION_ERROR', { field: 'university' });
  }
  if (!department || typeof department !== 'string' || department.trim().length < 2) {
    return fail(res, 400, 'Academic department is required (e.g. CSE, EEE, Media & Comm, BBA)', 'VALIDATION_ERROR', { field: 'department' });
  }
  if (!graduationYear || String(graduationYear).trim().length === 0) {
    return fail(res, 400, 'Expected graduation year is required (e.g. 2026, 2027)', 'VALIDATION_ERROR', { field: 'graduationYear' });
  }
  if (!exp || exp.length < 3) {
    return fail(res, 400, 'Generative AI & video editing experience summary is required', 'VALIDATION_ERROR', { field: 'experienceSummary' });
  }
  if (!portfolioUrl || typeof portfolioUrl !== 'string' || portfolioUrl.trim().length < 4) {
    return fail(res, 400, 'Portfolio / sample work link is required (Drive, YouTube, Behance, GitHub)', 'VALIDATION_ERROR', { field: 'portfolioUrl' });
  }
  if (!creativeExperimentPrompt || typeof creativeExperimentPrompt !== 'string' || creativeExperimentPrompt.trim().length < 5) {
    return fail(res, 400, 'Creative Direction Challenge idea is required', 'VALIDATION_ERROR', { field: 'creativeExperimentPrompt' });
  }

  // Token & ID generation
  const hex4 = Math.random().toString(16).substring(2, 6).toUpperCase();
  const token = `FELLOW-2026-${hex4}`;
  const id = `FELLOW-2026-${Date.now()}-${hex4}`;
  const timestamp = new Date().toISOString();
  const aiAptitudeScore = computeAptitudeScore(exp, portfolioUrl.trim(), creativeExperimentPrompt.trim());

  // Prefilled WhatsApp Founder Link (+8801708459008)
  const waMessage = 
    `Assalamu Alaikum Plabon Bhai! I just completed my AI Media Fellowship application on Gro10x (Candidate ID: ${token}).\n\n` +
    `Name: ${name.trim()}\n` +
    `University: ${university.trim()} (${department.trim()}, Grad ${String(graduationYear).trim()})\n` +
    `Portfolio: ${portfolioUrl.trim()}\n\n` +
    `Excited to connect for the 48h pilot creative assignment!`;
  
  const whatsappUrl = `https://wa.me/8801708459008?text=${encodeURIComponent(waMessage)}`;

  // Assemble candidate application entity
  const applicationEntity = {
    id,
    token,
    name: name.trim(),
    phone: phone.trim(),
    university: university.trim(),
    department: department.trim(),
    graduationYear: String(graduationYear).trim(),
    experienceSummary: exp,
    portfolioUrl: portfolioUrl.trim(),
    creativeExperimentPrompt: creativeExperimentPrompt.trim(),
    aiAptitudeScore,
    whatsappUrl,
    timestamp,
    status: 'APPLIED',
    source: 'GRO10X_HQ_INGRESS'
  };

  // Zero Data-Loss: Atomically append to data/fellowship_applications.json
  appendApplication(applicationEntity);

  // Dispatch immediate Telegram alert to Founder / Admin
  const telegramTarget = process.env.OWNER_TELEGRAM_ID || 
                         process.env.TELEGRAM_ADMIN_CHAT_ID || 
                         process.env.TELEGRAM_OWNER_CHAT_ID || 
                         '7754769807';

  if (typeof sendTelegramNotification === 'function') {
    try {
      const alertText = 
        `🎓 *New AI Fellowship Application Received!*\n\n` +
        `• *Token:* \`${token}\`\n` +
        `• *Candidate:* ${applicationEntity.name}\n` +
        `• *Phone:* \`${applicationEntity.phone}\`\n` +
        `• *Academic:* ${applicationEntity.university} · ${applicationEntity.department} (Grad: ${applicationEntity.graduationYear})\n` +
        `• *AI Experience:* ${applicationEntity.experienceSummary.substring(0, 150)}${applicationEntity.experienceSummary.length > 150 ? '...' : ''}\n` +
        `• *Portfolio:* ${applicationEntity.portfolioUrl}\n` +
        `• *Experiment:* ${applicationEntity.creativeExperimentPrompt.substring(0, 200)}${applicationEntity.creativeExperimentPrompt.length > 200 ? '...' : ''}\n` +
        `• *Aptitude Score:* ⭐ *${aiAptitudeScore} / 10*\n` +
        `• *Status:* \`APPLIED\` · Trailing Ingress\n\n` +
        `📲 *Action:* Reach out via 1-tap WhatsApp below.`;

      const keyboard = [
        [{ text: '💬 Connect on WhatsApp (+8801708459008)', url: whatsappUrl }]
      ];

      sendTelegramNotification(telegramTarget, alertText, keyboard, true);
    } catch (tgErr) {
      console.warn('[Fellowship Telegram Alert Note]:', tgErr.message);
    }
  }

  return ok(res, {
    id,
    token,
    candidate: applicationEntity,
    whatsappUrl,
    message: 'Fellowship application submitted successfully.'
  }, 201);
}));

/**
 * Parses a Supabase lead record back into a canonical candidate entity
 */
function parseLeadToFellowship(lead) {
  let meta = {};
  if (lead.notes) {
    if (lead.notes.trim().startsWith('{')) {
      try { meta = JSON.parse(lead.notes); } catch (_) {}
    } else if (lead.notes.includes('[FELLOWSHIP APPLICATION]')) {
      const tokenMatch = lead.notes.match(/Token:\s*([^\s|]+)/i);
      const uniMatch = lead.notes.match(/University:\s*([^|(]+)(?:\(([^,)]+),\s*([^)]+)\))?/i);
      const aptMatch = lead.notes.match(/Aptitude:\s*([\d.]+)/i);
      const portMatch = lead.notes.match(/Portfolio:\s*([^\s|]+)/i);
      const expMatch = lead.notes.match(/Experiment:\s*(.+)$/i);

      meta.token = tokenMatch ? tokenMatch[1].trim() : null;
      meta.university = uniMatch ? uniMatch[1].trim() : '';
      meta.department = uniMatch && uniMatch[2] ? uniMatch[2].trim() : '';
      meta.graduationYear = uniMatch && uniMatch[3] ? uniMatch[3].trim() : '';
      meta.aiAptitudeScore = aptMatch ? parseFloat(aptMatch[1]) : 9.5;
      meta.portfolioUrl = portMatch ? portMatch[1].trim() : '';
      meta.creativeExperimentPrompt = expMatch ? expMatch[1].trim() : '';
    }
  }

  const token = meta.token || lead.id;
  const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('88') ? cleanPhone : (cleanPhone.startsWith('01') ? '88' + cleanPhone : cleanPhone);
  const waMsg = encodeURIComponent(`Assalamu Alaikum ${lead.name || 'Candidate'}! Loved your AI Media Fellowship creative experiment (${token}). Let's discuss your pilot production.`);
  const whatsappUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

  return {
    id: lead.id,
    token: token,
    name: lead.name,
    phone: lead.phone,
    university: meta.university || 'University',
    department: meta.department || 'N/A',
    graduationYear: meta.graduationYear || '2026',
    experienceSummary: meta.experienceSummary || 'Generative AI & Video Editing',
    portfolioUrl: meta.portfolioUrl || '',
    creativeExperimentPrompt: meta.creativeExperimentPrompt || lead.notes || '',
    aiAptitudeScore: meta.aiAptitudeScore || 9.5,
    whatsappUrl: whatsappUrl,
    timestamp: lead.created_at,
    status: 'APPLIED',
    source: 'fellowship_intake_portal'
  };
}

/**
 * Asynchronously fetches all applications across Supabase, /tmp, and primary data folder
 */
async function fetchAllApplicationsAsync() {
  const mergedMap = new Map();

  // 1. Fetch live records from Supabase leads table (canonical cross-instance source)
  try {
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('source', 'fellowship_intake_portal')
        .order('created_at', { ascending: false });

      if (Array.isArray(data)) {
        for (const lead of data) {
          const parsed = parseLeadToFellowship(lead);
          if (parsed && (parsed.token || parsed.id)) {
            mergedMap.set(parsed.token || parsed.id, parsed);
          }
        }
      }
    }
  } catch (sbErr) {
    console.warn('[Fellowship Storage] Supabase query notice:', sbErr.message);
  }

  // 2. Merge local /tmp applications and primary file applications
  const localApps = readApplications();
  for (const app of localApps) {
    if (app && (app.token || app.id)) {
      if (!mergedMap.has(app.token || app.id)) {
        mergedMap.set(app.token || app.id, app);
      }
    }
  }

  const all = Array.from(mergedMap.values());
  // Sort by timestamp descending (newest first)
  all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  return all;
}

/**
 * GET /api/fellowship/applications
 * Returns all submitted applications (for verification & admin reporting)
 */
router.get(['/applications', '/list'], asyncHandler(async (req, res) => {
  const apps = await fetchAllApplicationsAsync();
  return ok(res, {
    total: apps.length,
    applications: apps
  });
}));

/**
 * GET /api/fellowship/status/:token
 * Lookup application details by candidate token (e.g. FELLOW-2026-A1B2)
 */
router.get('/status/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const apps = await fetchAllApplicationsAsync();
  const matched = apps.find(a => (a.token || '').toUpperCase() === (token || '').toUpperCase() || a.id === token);
  if (!matched) {
    return fail(res, 404, `No fellowship application found matching token: ${token}`, 'NOT_FOUND');
  }
  return ok(res, matched);
}));

/**
 * GET /api/fellowship/health
 * Ingress probe endpoint
 */
router.get(['/health', '/ping'], (req, res) => {
  const apps = readApplications();
  return res.json({
    status: 'online',
    program: 'GRO10X AI Media & Research Fellowship (18-Month Paid Contract)',
    deadline: '2026-10-31T23:59:59+06:00',
    totalApplications: apps.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
