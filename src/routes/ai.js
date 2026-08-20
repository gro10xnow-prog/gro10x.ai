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

// ── Gemini API call ────────────────────────────────────────────────────────────
function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
    if (!key) return reject(new Error('GEMINI_API_KEY not configured'));

    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.7 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
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
            resolve(json.candidates[0].content.parts[0].text.trim());
          } else {
            reject(new Error(json.error?.message || 'No candidates returned'));
          }
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Gemini request timed out')); });
    req.write(payload);
    req.end();
  });
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

  const prompt = `You are the Admin of Purplebot Digital, a premier digital agency in Dhaka, Bangladesh.

Write a personalized, encouraging, and clear WhatsApp message in English for our team member:
- Name: ${name} (call them "${firstName}")
- Role: ${role || 'Team Member'}
- Department: ${department || 'General'}
- Status: This member ${stageDescription}.

Rules:
1. Warm greeting using their first name.
2. Mention their role at Purplebot Digital.
3. State their next single action clearly: "${nextStep}".
4. Include the portal URL: https://purpleos-iota.vercel.app
5. Sign off as "— Purplebot Digital Admin 🔮".
6. Keep length under 100 words. Ready to send via WhatsApp.`;

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
