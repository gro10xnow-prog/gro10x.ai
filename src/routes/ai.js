const express = require('express');
const router = express.Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { getFirstName } = require('../utils/name');

const PORTAL = 'https://gro10x-ai.vercel.app';

const STEPS = {
  no_pin:           'Visit the GRO10X portal and log in with your phone number to receive your temporary access PIN.',
  temp_pin:         'Log in with your temporary PIN and set your permanent 6-digit PIN in Profile Settings.',
  pin_no_tg:        'In GRO10X, go to Profile then Telegram Setup and link your Telegram account to receive daily alerts.',
  pin_tg_no_survey: 'Complete your Staff Survey and Agreement under Profile then Survey inside GRO10X to unlock full access.',
  fully_onboarded:  'Check your daily tasks via the Kanban board, log EOD reports, and clock in through the Team Bot.'
};

// Rich, complete message for every stage — always reliable
function build(name, role, dept, stage) {
  const fn = getFirstName(name);
  const r = role || 'Specialist';
  const d = dept || 'the team';
  const step = STEPS[stage] || STEPS.no_pin;
  const map = {
    no_pin:           'Hi ' + fn + '!\n\nWelcome to GRO10X! We are so excited to have you join us as our ' + r + ' in ' + d + '.\n\nYour GRO10X workspace is ready and waiting. This is where you will track your daily tasks, log your work, and stay connected with the team.',
    temp_pin:         'Hi ' + fn + '!\n\nGreat to have you on board as our ' + r + ' in ' + d + '! You have already received your temporary PIN.\n\nYou are just one step away from securing your account and getting full access to everything inside GRO10X.',
    pin_no_tg:        'Hi ' + fn + '!\n\nExcellent work setting your permanent PIN! You are making great progress through onboarding as our ' + r + '.\n\nThe next step is linking your Telegram account. This is how you will receive your daily task briefings, schedule updates, and team announcements directly on your phone.',
    pin_tg_no_survey: 'Hi ' + fn + '!\n\nYou are almost fully onboarded as our ' + r + ' in ' + d + ' -- you are so close to the finish line!\n\nThe Staff Survey and Agreement is the final step. Completing it unlocks your full GRO10X profile, payslip access, and confirms your role details in our system.',
    fully_onboarded:  'Hi ' + fn + '!\n\nYou are officially fully onboarded as our ' + r + ' -- welcome to the GRO10X team!\n\nYour GRO10X workspace is fully unlocked and ready. Here is your recommended daily workflow to get the most out of the platform:'
  };
  const intro = map[stage] || map.no_pin;
  return intro + '\n\nNext Step:\n' + step + '\n\nPortal: ' + PORTAL + '\n\nReach out to the Admin team anytime if you need help. Looking forward to doing great work together!\n\n-- GRO10X Admin Team';
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

// POST /api/ai/etsy-seo — Generates Category-Aware Etsy SEO Title, 13 Tags, and Listing Description
router.post('/etsy-seo', requireAuth, async (req, res) => {
  const { productName, brandName, brandNiche, brandVoice, type, category, pageCount, palette, auditScore, price } = req.body;
  if (!productName || !brandName) {
    return res.status(400).json({ error: 'productName and brandName are required' });
  }

  const key = process.env.GEMINI_API_KEY;

  function generateFallbackSEO(pName, bName, niche, pType, cat, pCount) {
    const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
    const title = `${cleanP} | ${cat || 'Digital Planner'} Printable | ${bName} Aesthetic GoodNotes PDF`.slice(0, 140);
    const tags = [
      'digital planner',
      'printable organizer',
      'daily life planner',
      'goodnotes template',
      'instant download',
      'aesthetic tracker',
      'notion system',
      'undated planner',
      'hyperlinked pdf',
      'habit matrix',
      'goal setting hub',
      'self improvement',
      `${(bName || 'gro10x').toLowerCase().slice(0, 20)}`
    ].slice(0, 13);

    const description = `✨ Welcome to ${bName} — ${niche || 'Intentional Productivity & Digital Stationery'}\n\n` +
      `Transform your daily routine with the **${cleanP}**.\n\n` +
      `📦 WHAT IS INCLUDED (${pCount || 10}-Page System):\n` +
      `• High-Resolution Vector Printable PDF (US Letter & A4)\n` +
      `• Hyperlinked Digital Tablet Compatibility (GoodNotes, Notability, Samsung Notes)\n` +
      `• Official Single-User Anti-Piracy License Pass\n` +
      `• Bonus Canva / Notion Quick-Start Setup Guide\n\n` +
      `⚡ HOW IT WORKS:\n` +
      `1. Complete your purchase.\n` +
      `2. Instantly download your PDF files from Etsy Purchases.\n` +
      `3. Import to iPad/tablet or print immediately at home!\n\n` +
      `💌 Need assistance or custom requests? Send us an Etsy message anytime!`;

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
      ...generateFallbackSEO(productName, brandName, brandNiche, type, category, pageCount)
    });
  }

  const prompt =
    `You are an elite Etsy SEO and copywriting specialist.\n\n` +
    `Generate a high-converting, search-ranked Etsy listing package for:\n` +
    `Product Name: "${productName}"\n` +
    `Brand: "${brandName}"\n` +
    `Category: "${category || 'Digital Planner'}"\n` +
    `Niche: "${brandNiche || 'Digital productivity'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, inspiring, clear'}"\n` +
    `Format / Delivery: "${type || 'Digital PDF'}"\n` +
    `System Size: "${pageCount || 10} Pages"\n` +
    `Palette: "${Array.isArray(palette) ? palette.join(', ') : (palette || '#8B5A7A, #FAF3E8, #7D9B76')}"\n` +
    `Retail Price: "$${price || 7.49} USD"\n\n` +
    `Strict Requirements:\n` +
    `1. "title": Strictly 140 characters or fewer. Front-load highest-volume Etsy search keywords separated by " | ".\n` +
    `2. "tags": EXACTLY 13 comma-separated tag phrases. EACH tag MUST BE 20 CHARACTERS OR FEWER. Must include long-tail buyer search phrases tailored to "${category || 'planners'}".\n` +
    `3. "description": 4 structured sections: (1) Headline Hook, (2) What is Included (bullet points), (3) How to Access & Print / GoodNotes Guide, (4) Anti-Piracy Single-User License Note.\n` +
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
      ...generateFallbackSEO(productName, brandName, brandNiche, type, category, pageCount)
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/product-blueprint — Generates Category-Intelligent Product Blueprint & Google Flow Prompts
// ─────────────────────────────────────────────────────────────────────────────
const { AVAILABLE_CATEGORIES, generateCategoryBlueprint, generateCategoryMockups } = require('../services/blueprint-generator');

router.post('/product-blueprint', requireAuth, async (req, res) => {
  const {
    productName,
    brandName,
    brandNiche,
    brandVoice,
    brandPalette,
    brandFonts,
    type,
    category,
    categoryOverride,
    targetAudienceOverride,
    productNameOverride,
    hero,
    format,
    seoTags
  } = req.body;

  const effectiveProductName = (productNameOverride && productNameOverride.trim()) ? productNameOverride.trim() : productName;

  if (!effectiveProductName || !brandName) {
    return res.status(400).json({ error: 'productName and brandName are required' });
  }

  const paletteArr = Array.isArray(brandPalette) && brandPalette.length > 0
    ? brandPalette
    : ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'];

  let headingFont = 'Playfair Display';
  let bodyFont = 'Lato';
  if (typeof brandFonts === 'string') {
    const parts = brandFonts.split('+').map(s => s.trim());
    headingFont = parts[0] || 'Playfair Display';
    bodyFont = parts[1] || 'Lato';
  } else if (brandFonts && typeof brandFonts === 'object') {
    headingFont = brandFonts.heading || brandFonts.headingFont || 'Playfair Display';
    bodyFont = brandFonts.body || brandFonts.bodyFont || 'Lato';
  }
  const fontString = `${headingFont} + ${bodyFont}`;

  const deterministicBlueprint = generateCategoryBlueprint(
    effectiveProductName,
    brandName,
    brandNiche,
    brandVoice,
    paletteArr,
    fontString,
    type || format,
    category,
    categoryOverride,
    targetAudienceOverride
  );

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({
      success: true,
      blueprint: deterministicBlueprint,
      generatedBy: 'smart_blueprint_engine_2.0'
    });
  }

  const prompt =
    `You are an elite Digital Product Designer for top 1% Etsy bestseller shops.\n` +
    `Generate a highly specialized, comprehensive, page-by-page design blueprint for the following digital product:\n` +
    `Product Title: "${effectiveProductName}"\n` +
    `Category: "${categoryOverride || category || deterministicBlueprint.categoryName || 'Planners'}"\n` +
    `Brand: "${brandName}"\n` +
    `Target Audience: "${targetAudienceOverride || deterministicBlueprint.targetAudience}"\n` +
    `Brand Niche: "${brandNiche || 'Digital Products'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, empowering, clear'}"\n` +
    `Color Palette: ${JSON.stringify(paletteArr)}\n` +
    `Typography: "${fontString}"\n` +
    `Format: "${type || format || 'Digital PDF'}"\n\n` +
    `CRITICAL IN-CANVAS TYPOGRAPHY & ANTI-ARTIFACT RULES:\n` +
    `• DO NOT generate a generic 10-page planner. Generate 16 to 25 highly specialized, category-relevant spreads (e.g. if academic/teacher, include lesson plans, gradebooks, rosters, IEP notes; if financial, include debt snowball, sinking funds, zero-based budget; if seasonal/holiday, include gift registries, cooking timelines, menu planners).\n` +
    `• Every product MUST include Page 2 as a "How To Use / Quick-Start Guide" to maximize customer satisfaction and prevent support requests.\n` +
    `• In "pageBreakdown" and "googleFlowPrompt", spread titles must be CLEAN titles (e.g. "Master Index & Annual Calendar Matrix"). NEVER include "PAGE X —" or "PAGE 1 —" in the titles or prompt headers.\n` +
    `• The "googleFlowPrompt" must explicitly include negative constraints instructing image generators to NEVER paint page number prefixes onto the visual artwork.\n\n` +
    `Return strict JSON with:\n` +
    `1. "documentSpecs": { "dimensions", "margins", "pageCount", "colorSystem": { "primaryAccent", "backgroundTint", "secondaryAccent", "highlight", "darkText" }, "typography": { "headingFont", "bodyFont", "accentFont" } }\n` +
    `2. "pageBreakdown": Array of 16-25 objects { "pageNumber", "section", "title", "purpose", "layoutSpecs", "elements" (array of strings) }\n` +
    `3. "googleFlowPrompt": A single copy-ready master prompt for Google Flow describing all pages sequentially (3:4 portrait aspect ratio, with strict anti-page-number leakage constraints).\n\n` +
    `OUTPUT STRICT JSON ONLY. No markdown wrappers.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key);
        if (resultText) break;
      } catch (e) {
        console.warn('[Product Blueprint] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');

    const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({
      success: true,
      blueprint: {
        productName: parsed.productName || effectiveProductName,
        brandName: parsed.brandName || brandName,
        categoryName: deterministicBlueprint.categoryName,
        targetAudience: targetAudienceOverride || deterministicBlueprint.targetAudience,
        documentSpecs: parsed.documentSpecs || deterministicBlueprint.documentSpecs,
        pageBreakdown: (parsed.pageBreakdown && parsed.pageBreakdown.length >= 12) ? parsed.pageBreakdown : deterministicBlueprint.pageBreakdown,
        googleFlowPrompt: parsed.googleFlowPrompt || deterministicBlueprint.googleFlowPrompt,
        storageArchitecture: deterministicBlueprint.storageArchitecture,
        antiPiracyDelivery: deterministicBlueprint.antiPiracyDelivery
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Product Blueprint Gemini Error, using Blueprint Engine 2.0 fallback]:', err.message);
    return res.json({
      success: true,
      blueprint: deterministicBlueprint,
      generatedBy: 'smart_blueprint_engine_2.0'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/mockup-prompts — Generates 10 Category-Specific Mockup Prompts + Listing Video Prompt
// ─────────────────────────────────────────────────────────────────────────────
router.post('/mockup-prompts', requireAuth, async (req, res) => {
  const {
    productName,
    brandName,
    brandNiche,
    brandVoice,
    brandPalette,
    brandFonts,
    type,
    category,
    categoryOverride,
    productNameOverride,
    hero,
    format
  } = req.body;

  const effectiveProductName = (productNameOverride && productNameOverride.trim()) ? productNameOverride.trim() : productName;

  if (!effectiveProductName || !brandName) {
    return res.status(400).json({ error: 'productName and brandName are required' });
  }

  const paletteArr = Array.isArray(brandPalette) && brandPalette.length > 0
    ? brandPalette
    : ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'];

  let headingFont = 'Playfair Display';
  let bodyFont = 'Lato';
  if (typeof brandFonts === 'string') {
    const parts = brandFonts.split('+').map(s => s.trim());
    headingFont = parts[0] || 'Playfair Display';
    bodyFont = parts[1] || 'Lato';
  } else if (brandFonts && typeof brandFonts === 'object') {
    headingFont = brandFonts.heading || brandFonts.headingFont || 'Playfair Display';
    bodyFont = brandFonts.body || brandFonts.bodyFont || 'Lato';
  }
  const fontString = `${headingFont} + ${bodyFont}`;

  const deterministicMockups = generateCategoryMockups(
    effectiveProductName,
    brandName,
    brandNiche,
    brandVoice,
    paletteArr,
    fontString,
    type || format,
    category,
    categoryOverride
  );

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({
      success: true,
      data: deterministicMockups,
      generatedBy: 'smart_mockup_engine_2.0'
    });
  }

  const prompt =
    `You are an elite Etsy Product Visualizer and E-commerce Art Director.\n` +
    `Generate 10 distinct, photorealistic Etsy listing mockup photo prompts and a 10-second listing video prompt for:\n` +
    `Product Title: "${productName}"\n` +
    `Category: "${category || 'Planners'}"\n` +
    `Brand: "${brandName}"\n` +
    `Brand Niche: "${brandNiche || 'Digital Products'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, empowering, clear'}"\n` +
    `Color Palette: ${JSON.stringify(paletteArr)}\n` +
    `Typography: "${fontString}"\n` +
    `Format: "${type || format || 'Digital PDF'}"\n\n` +
    `CRITICAL REQUIREMENTS:\n` +
    `• Tailor the props and setting to the specific category (e.g. Teacher planner = classroom desk, grading pens, student roster; Financial planner = gold calculator, leather notebook, debt thermometer; Holiday planner = festive greenery, twinkling fairy lights, gift ribbon).\n` +
    `• All mockups must specify 3:4 portrait ratio (ideal for mobile and desktop Etsy listings).\n\n` +
    `Return strict JSON with:\n` +
    `1. "mockups": Array of 10 objects { "number", "title", "type", "scene" }\n` +
    `2. "masterMockupPrompt": Single copy-ready master prompt for Google Flow / Midjourney containing all 10 image prompts sequentially (3:4 portrait).\n` +
    `3. "videoPrompt": A 10-second structured video creation prompt broken down by timestamps (0-2s, 2-4s, 4-6s, 6-8s, 8-10s).\n\n` +
    `OUTPUT STRICT JSON ONLY. No markdown wrapper.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key);
        if (resultText) break;
      } catch (e) {
        console.warn('[Mockup Prompts] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');

    const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({
      success: true,
      data: {
        productName: parsed.productName || productName,
        brandName: parsed.brandName || brandName,
        mockups: (parsed.mockups && parsed.mockups.length === 10) ? parsed.mockups : deterministicMockups.mockups,
        masterMockupPrompt: parsed.masterMockupPrompt || deterministicMockups.masterMockupPrompt,
        videoPrompt: parsed.videoPrompt || deterministicMockups.videoPrompt
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Mockup Prompts Gemini Error, using Mockup Engine 2.0 fallback]:', err.message);
    return res.json({
      success: true,
      data: deterministicMockups,
      generatedBy: 'smart_mockup_engine_2.0'
    });
  }
});

router.get('/status', requireAuth, (req, res) => res.json({ success: true, configured: !!process.env.GEMINI_API_KEY, models: MODELS }));

module.exports = router;
