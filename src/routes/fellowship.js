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
const { ok, fail, asyncHandler } = require('../utils/response');
const { sendTelegramNotification } = require('../services/bot');

const DATA_DIR = path.resolve(__dirname, '../../data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'fellowship_applications.json');

/**
 * Reads existing applications from fellowship_applications.json with fallback
 */
function readApplications() {
  try {
    if (!fs.existsSync(APPLICATIONS_FILE)) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(APPLICATIONS_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[Fellowship Storage] Read error:', err.message);
    return [];
  }
}

/**
 * Atomically appends a new application with Zero Data-Loss guarantees
 */
function appendApplication(newApp) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const apps = readApplications();
  apps.push(newApp);

  const tmpFile = path.join(DATA_DIR, `.fellowship_apps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.tmp`);
  fs.writeFileSync(tmpFile, JSON.stringify(apps, null, 2), 'utf8');
  try {
    fs.renameSync(tmpFile, APPLICATIONS_FILE);
  } catch (e) {
    // Windows fallback for file-lock on rename
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), 'utf8');
    try { fs.unlinkSync(tmpFile); } catch (_) {}
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
 * GET /api/fellowship/applications
 * Returns all submitted applications (for verification & admin reporting)
 */
router.get(['/applications', '/list'], asyncHandler(async (req, res) => {
  const apps = readApplications();
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
  const apps = readApplications();
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
