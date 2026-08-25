const express = require('express');
const router = express.Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { getFirstName } = require('../utils/name');

const PORTAL = 'https://gro10x-ai.vercel.app';

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

// POST /api/ai/summarize-brief — Gemini brief TL;DR for specialists
router.post('/summarize-brief', requireAuth, async (req, res) => {
  const { briefText, taskTitle, taskId } = req.body;
  if (!briefText || briefText.trim().length < 10) {
    return res.status(400).json({ error: 'briefText is required (minimum 10 characters)' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({
      success: true,
      summary: [
        `Complete task: ${taskTitle || 'Production task'}.`,
        'Review brief materials and prepare deliverables.',
        'Submit for QC when ready.'
      ],
      generatedBy: 'fallback'
    });
  }

  const prompt =
    `You are a senior creative producer summarizing a task brief for a specialist at a digital agency in Dhaka.\n\n` +
    `Task: "${taskTitle || 'Production Task'}"\n` +
    `Brief: "${briefText.slice(0, 2000)}"\n\n` +
    `Summarize this brief into EXACTLY 3 bullet points. Each bullet must:\n` +
    `- Start with an action verb\n` +
    `- Be concise (max 15 words)\n` +
    `- Be directly actionable for the specialist\n\n` +
    `Output format — ONLY these 3 lines, nothing else:\n` +
    `• [bullet 1]\n• [bullet 2]\n• [bullet 3]`;

  try {
    let summaryText = null;
    for (const model of MODELS) {
      try {
        summaryText = await callSingle(model, prompt, key);
        if (summaryText) break;
      } catch (e) {
        console.warn('[AI Brief] Skip model ' + model + ':', e.message);
      }
    }

    const bullets = (summaryText || '')
      .split('\n')
      .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^[•\-\d\.]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    if (bullets.length === 0) throw new Error('No bullets extracted');

    return res.json({ success: true, summary: bullets, generatedBy: 'gemini' });
  } catch (err) {
    return res.json({
      success: true,
      summary: [
        `Review requirements for ${(taskTitle || 'task').substring(0, 35)}.`,
        'Prepare all necessary assets according to the project specifications.',
        'Upload final deliverable to Internal QC review pipeline.'
      ],
      generatedBy: 'fallback'
    });
  }
});

// POST /api/ai/etsy-seo — Generates Etsy SEO Title, 13 Tags, and Listing Description
router.post('/etsy-seo', requireAuth, async (req, res) => {
  const { productName, brandName, brandNiche, brandVoice, type } = req.body;
  if (!productName || !brandName) {
    return res.status(400).json({ error: 'productName and brandName are required' });
  }

  const key = process.env.GEMINI_API_KEY;

  function generateFallbackSEO(pName, bName, niche, pType) {
    const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
    const title = `${cleanP} | ${bName} Aesthetic ${pType || 'Digital Download'} | Printable & Instant PDF`.slice(0, 140);
    const tags = [
      'digital planner',
      'instant download',
      'printable tracker',
      'aesthetic template',
      'productivity hub',
      'daily organizer',
      'self improvement',
      'minimalist design',
      'pdf planner',
      'goodnotes template',
      'notion system',
      'gift for organized',
      `${(bName || 'gro10x').toLowerCase().slice(0, 20)}`
    ].slice(0, 13);

    const description = `✨ Welcome to ${bName} — ${niche || 'Premium Digital Products'}\n\n` +
      `Upgrade your routine with the **${cleanP}**.\n\n` +
      `📦 WHAT IS INCLUDED:\n` +
      `• High-resolution interactive PDF / Assets\n` +
      `• Easy setup guide & tutorial links\n` +
      `• Commercial & personal use flexibility\n\n` +
      `⚡ HOW IT WORKS:\n` +
      `1. Complete your purchase.\n` +
      `2. Instantly download your files from Etsy Purchases.\n` +
      `3. Open in your favorite app (GoodNotes, Canva, Notion) or print!\n\n` +
      `💌 Need help or custom requests? Send us an Etsy message anytime!`;

    return {
      title,
      tags,
      description,
      keywords: [cleanP.toLowerCase(), 'digital template', 'instant download', 'printable sheet', 'aesthetic system'],
      generatedBy: 'smart_fallback'
    };
  }

  if (!key) {
    return res.json({
      success: true,
      ...generateFallbackSEO(productName, brandName, brandNiche, type)
    });
  }

  const prompt =
    `You are an elite Etsy SEO and copywriting specialist.\n\n` +
    `Generate a high-converting, search-ranked Etsy listing package for:\n` +
    `Product Name: "${productName}"\n` +
    `Brand: "${brandName}"\n` +
    `Niche: "${brandNiche || 'Digital products'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, inspiring, clear'}"\n` +
    `Format / Fulfillment: "${type || 'Digital Download'}"\n\n` +
    `Strict Requirements:\n` +
    `1. "title": Under 140 characters, high-search volume keywords separated by " | ".\n` +
    `2. "tags": EXACTLY 13 comma-separated tag phrases. EACH tag MUST BE 20 CHARACTERS OR FEWER. No single generic words.\n` +
    `3. "description": 3 structured sections: Hook/Overview, What is Included (bullet points), How to Access.\n` +
    `4. "keywords": 5 high-intent buyer keyword phrases.\n\n` +
    `OUTPUT STRICT JSON ONLY with keys "title", "tags" (array of 13 strings), "description", "keywords" (array of 5 strings). No markdown formatting or extra text outside JSON.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key);
        if (resultText) break;
      } catch (e) {
        console.warn('[Etsy SEO] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');

    // Extract JSON block
    const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate 13 tags length (max 20 chars each)
    let tags = (parsed.tags || []).map(t => String(t).trim().slice(0, 20)).filter(Boolean);
    while (tags.length < 13) {
      tags.push('instant download');
    }
    tags = tags.slice(0, 13);

    return res.json({
      success: true,
      title: (parsed.title || productName).slice(0, 140),
      tags,
      description: parsed.description || '',
      keywords: (parsed.keywords || []).slice(0, 5),
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Etsy SEO Gemini Error]:', err.message);
    return res.json({
      success: true,
      ...generateFallbackSEO(productName, brandName, brandNiche, type)
    });
  }
});

router.get('/status', requireAuth, (req, res) => res.json({ success: true, configured: !!process.env.GEMINI_API_KEY, models: MODELS }));

module.exports = router;
