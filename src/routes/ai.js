const express = require('express');
const router = express.Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { getFirstName } = require('../utils/name');

const PORTAL = 'https://purpleos-iota.vercel.app';

const STEPS = {
  no_pin:           'Visit the PurpleOS portal and log in with your phone number to receive your temporary access PIN.',
  temp_pin:         'Log in with your temporary PIN and set your permanent 6-digit PIN in Profile Settings.',
  pin_no_tg:        'In PurpleOS, go to Profile then Telegram Setup and link your Telegram account to receive daily alerts.',
  pin_tg_no_survey: 'Complete your Staff Survey and Agreement under Profile then Survey inside PurpleOS to unlock full access.',
  fully_onboarded:  'Check your daily tasks via the Kanban board, log EOD reports, and clock in through the Team Bot.'
};

// Rich, complete message for every stage — always reliable
function build(name, role, dept, stage) {
  const fn = getFirstName(name);
  const r = role || 'Specialist';
  const d = dept || 'the team';
  const step = STEPS[stage] || STEPS.no_pin;
  const map = {
    no_pin:           'Hi ' + fn + '!\n\nWelcome to Purplebot Digital! We are so excited to have you join us as our ' + r + ' in ' + d + '.\n\nYour PurpleOS workspace is ready and waiting. This is where you will track your daily tasks, log your work, and stay connected with the team.',
    temp_pin:         'Hi ' + fn + '!\n\nGreat to have you on board as our ' + r + ' in ' + d + '! You have already received your temporary PIN.\n\nYou are just one step away from securing your account and getting full access to everything inside PurpleOS.',
    pin_no_tg:        'Hi ' + fn + '!\n\nExcellent work setting your permanent PIN! You are making great progress through onboarding as our ' + r + '.\n\nThe next step is linking your Telegram account. This is how you will receive your daily task briefings, schedule updates, and team announcements directly on your phone.',
    pin_tg_no_survey: 'Hi ' + fn + '!\n\nYou are almost fully onboarded as our ' + r + ' in ' + d + ' -- you are so close to the finish line!\n\nThe Staff Survey and Agreement is the final step. Completing it unlocks your full PurpleOS profile, payslip access, and confirms your role details in our system.',
    fully_onboarded:  'Hi ' + fn + '!\n\nYou are officially fully onboarded as our ' + r + ' -- welcome to the Purplebot Digital family!\n\nYour PurpleOS workspace is fully unlocked and ready. Here is your recommended daily workflow to get the most out of the platform:'
  };
  const intro = map[stage] || map.no_pin;
  return intro + '\n\nNext Step:\n' + step + '\n\nPortal: ' + PORTAL + '\n\nReach out to the Admin team anytime if you need help. Looking forward to doing great work together!\n\n-- Purplebot Digital Admin';
}

// Gemini with strict response validation
const MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

function callSingle(model, prompt, key) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 600, temperature: 0.6 } });
    const req = https.request({ hostname: 'generativelanguage.googleapis.com', path: '/v1beta/models/' + model + ':generateContent?key=' + key, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.candidates && j.candidates[0] && j.candidates[0].content) {
            const text = (j.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
            if (text.length >= 200 && (text.toLowerCase().includes('purpleos') || text.toLowerCase().includes('admin'))) return resolve(text);
            return reject(new Error('Incomplete: ' + model + ' only ' + text.length + ' chars'));
          }
          reject(new Error((j.error && j.error.message) || 'No output: ' + model));
        } catch (e) { reject(new Error('ParseErr: ' + model)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout: ' + model)); });
    req.write(payload); req.end();
  });
}

async function tryGemini(name, role, dept, stage, key) {
  const fn = getFirstName(name);
  const nextStep = STEPS[stage] || '';
  const prompt =
    'You are the Admin of Purplebot Digital, a creative digital agency in Dhaka.\n\n' +
    'Write a complete WhatsApp onboarding message in English for ' + name + ' (' + (role || 'Specialist') + ', ' + (dept || 'General') + ') at Purplebot Digital. Stage: ' + stage + '.\n\n' +
    'The message MUST include all of these in order:\n' +
    '1. Hi ' + fn + '! [one relevant emoji]\n' +
    '2. Warm welcome mentioning role (' + role + ') and department (' + dept + ')\n' +
    '3. Why completing this step matters for them\n' +
    '4. Next Step: ' + nextStep + '\n' +
    '5. Portal: ' + PORTAL + '\n' +
    '6. Short encouraging closing sentence\n' +
    '7. Sign-off: -- Purplebot Digital Admin\n\n' +
    'Output the message text ONLY. No markdown, no code blocks. Minimum 150 words.';
  for (const model of MODELS) {
    try { const r = await callSingle(model, prompt, key); console.log('[AI] OK ' + model + ' ' + r.length + ' chars'); return r; }
    catch (e) { console.warn('[AI] skip ' + model + ': ' + e.message); }
  }
  return null;
}

router.post('/generate-message', requireAuth, requireManager, async (req, res) => {
  const { name, role, department, stage, empCode } = req.body;
  if (!name || !stage || !STEPS[stage]) return res.status(400).json({ success: false, error: 'name and valid stage required' });
  let message = null, generatedBy = 'template';
  const key = process.env.GEMINI_API_KEY;
  if (key) { message = await tryGemini(name, role, department, stage, key).catch(() => null); if (message) generatedBy = 'gemini'; }
  if (!message) { message = build(name, role, department, stage); generatedBy = 'template'; }
  return res.json({ success: true, message, stage, generatedBy, member: { name, role, department, empCode } });
});

router.get('/status', requireAuth, (req, res) => res.json({ success: true, configured: !!process.env.GEMINI_API_KEY, models: MODELS }));

module.exports = router;
