/**
 * src/routes/ai.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS AI Intelligence Route — Gemini-Powered Message Generator
 * Mounted at: /api/ai/*
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-flash-latest';

// ── Stage definitions ──────────────────────────────────────────────────────────
const STAGE_LABELS = {
  no_pin: 'has not received or set any PIN yet',
  temp_pin: 'has a temporary PIN generated but has not set a permanent PIN yet',
  pin_no_tg: 'has set their permanent PIN but has not linked their Telegram account yet',
  pin_tg_no_survey: 'has set their PIN and linked Telegram but has not completed the survey & agreement yet',
  fully_onboarded: 'has completed all onboarding steps successfully'
};

const STAGE_NEXT_STEPS = {
  no_pin: 'Step 1: Visit the PurpleOS portal and log in with your phone number. Your temporary access PIN will be sent to you.',
  temp_pin: 'Step 2: Log in to PurpleOS using your temporary PIN, then go to Profile Settings and set your permanent 6-digit PIN.',
  pin_no_tg: 'Step 3: In PurpleOS, navigate to Telegram Setup and link your account so you receive daily briefings and task alerts.',
  pin_tg_no_survey: 'Step 4 (Final!): Complete your Staff Survey & Agreement inside PurpleOS under Profile → Survey to unlock full platform access.',
  fully_onboarded: 'Keep using the platform daily — check your tasks via Kanban, log your EOD report, and clock in via the Team Bot.'
};

// ── Fallback templates when Gemini is unavailable ─────────────────────────────
function getFallbackMessage(name, role, stage) {
  const firstName = (name || 'Team Member').split(' ')[0];
  const step = STAGE_NEXT_STEPS[stage] || STAGE_NEXT_STEPS.no_pin;
  const greetings = {
    no_pin: `Hi ${firstName}! 👋 Welcome to Purplebot Digital's PurpleOS platform. We're excited to have you on the team as our ${role || 'Specialist'}. Let's get you set up!`,
    temp_pin: `Hey ${firstName}! 🔑 Your PurpleOS account is almost ready. You've received your temporary PIN — the next step is to make it permanent.`,
    pin_no_tg: `Hi ${firstName}! ✅ Great work setting your PIN! One more step — connect your Telegram to receive team alerts and daily briefings directly.`,
    pin_tg_no_survey: `Hey ${firstName}! 🎯 You're almost there! Just one final step: complete your Staff Survey & Agreement inside PurpleOS to get fully onboarded.`,
    fully_onboarded: `Hi ${firstName}! 🎉 You're fully onboarded on PurpleOS! Start using the platform to track your tasks, log your hours, and stay connected with the team.`
  };
  const greeting = greetings[stage] || greetings.no_pin;
  return `${greeting}\n\n📌 Next Step:\n${step}\n\n🔗 Platform: https://purpleos-iota.vercel.app\n\nFor support, reach out to the Admin team.\n\n— Purplebot Digital Admin`;
}

const CANDIDATE_MODELS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

// ── Gemini API call with model fallback ───────────────────────────────────────
async function callGeminiSingle(model, prompt, key) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.6 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content) {
            const parts = json.candidates[0].content.parts || [];
            const text = parts.map(p => p.text).join('').trim();
            if (text && text.length > 20) {
              return resolve(text);
            }
          }
          reject(new Error(json.error?.message || 'Empty or short response'));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error(`Timeout on ${model}`)); });
    req.write(payload);
    req.end();
  });
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');

  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const result = await callGeminiSingle(model, prompt, key);
      if (result) return result;
    } catch (err) {
      lastError = err;
      console.warn(`[AI Route] Model ${model} failed (${err.message}), trying next...`);
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

// ── POST /api/ai/generate-message ─────────────────────────────────────────────
/**
 * Body: { name, role, department, stage, empCode }
 * stage: 'no_pin' | 'temp_pin' | 'pin_no_tg' | 'pin_tg_no_survey' | 'fully_onboarded'
 */
router.post('/generate-message', requireAuth, requireManager, async (req, res) => {
  const { name, role, department, stage, empCode } = req.body;

  if (!name || !stage || !STAGE_LABELS[stage]) {
    return res.status(400).json({
      success: false,
      error: 'name and a valid stage are required'
    });
  }

  const stageDescription = STAGE_LABELS[stage];
  const nextStep = STAGE_NEXT_STEPS[stage];
  const firstName = name.split(' ')[0];

  const prompt = `Write a complete, professional, and friendly WhatsApp onboarding message in English for a team member at Purplebot Digital agency:
- Member Name: ${name} (call them "${firstName}")
- Role: ${role || 'Specialist'}
- Department: ${department || 'General'}
- Status: This member ${stageDescription}.

Structure the message cleanly as:
1. Warm greeting: "Hi ${firstName}! 👋 Welcome to Purplebot Digital as our ${role || 'Specialist'}."
2. Brief encouragement welcoming them to the ${department || 'agency'} team.
3. Next step:
📌 Next Step:
${nextStep}
4. Portal URL: 🔗 https://purpleos-iota.vercel.app
5. Sign-off: "— Purplebot Digital Admin 🔮"

Output ONLY the full message text ready to send.`;

  try {
    let message;
    const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY;

    if (key) {
      try {
        message = await callGemini(prompt);
      } catch (geminiError) {
        console.warn('[AI Route] Gemini call fallback:', geminiError.message);
        message = getFallbackMessage(name, role, stage);
      }
    } else {
      message = getFallbackMessage(name, role, stage);
    }

    return res.json({
      success: true,
      message,
      stage,
      generatedBy: key ? 'gemini' : 'fallback',
      member: { name, role, department, empCode }
    });
  } catch (err) {
    console.error('[AI Route] generate-message error:', err.message);
    return res.json({
      success: true,
      message: getFallbackMessage(name, role, stage),
      stage,
      generatedBy: 'fallback',
      member: { name, role, department, empCode }
    });
  }
});

// ── GET /api/ai/status ─────────────────────────────────────────────────────────
router.get('/status', requireAuth, (req, res) => {
  const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  return res.json({
    success: true,
    configured: !!key,
    model: GEMINI_MODEL
  });
});

module.exports = router;
