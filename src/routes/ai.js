const express = require('express');
const router = express.Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { getFirstName } = require('../utils/name');

const PORTAL = 'https://gro10x-ai.vercel.app/crew';
const BOT_LINK = 'https://t.me/Aigeneral01bot';

const STEPS = {
  no_pin:           '1. Open our Telegram Team Bot (https://t.me/Aigeneral01bot)\n2. Tap /start and press "📱 Verify My Phone Number"\n3. The bot will verify your account and provide your login PIN and Crew Portal access.',
  temp_pin:         'Log in to https://gro10x-ai.vercel.app/crew with your temporary PIN and set your permanent 6-digit PIN in Profile Settings.',
  pin_no_tg:        'Launch our Telegram Team Bot (https://t.me/Aigeneral01bot), tap /start, and link your account for daily operations and attendance.',
  pin_tg_no_survey: 'Open the Telegram Mini App via @Aigeneral01bot, complete your profile survey, and sign your Stage 1 Employment Agreement to activate your DBM workspace.',
  fully_onboarded:  'Clock in daily via Telegram Bot, access your DBM Brand Studio at https://gro10x-ai.vercel.app/app#brands, and submit your EOD reports.'
};

// Rich, complete message for every stage — always reliable
function build(name, role, dept, stage) {
  const fn = getFirstName(name);
  const r = role || 'Digital Brand Manager';
  const d = dept || 'Brand Operations';
  const step = STEPS[stage] || STEPS.no_pin;
  const map = {
    no_pin:           'Hi ' + fn + '! 👋\n\nWelcome to GRO10X! We are thrilled to have you on board as our ' + r + ' in ' + d + '.\n\nYour GRO10X Digital Brand workspace is ready. You will be managing our high-growth digital product brands, running listing launches, and tracking your daily performance.',
    temp_pin:         'Hi ' + fn + '! 👋\n\nGreat to have you on board as our ' + r + ' in ' + d + '! Your account PIN is ready.\n\nYou are just one step away from securing your account and unlocking your Brand Operations Hub.',
    pin_no_tg:        'Hi ' + fn + '! 👋\n\nExcellent work setting your permanent PIN! You are making great progress through onboarding as our ' + r + '.\n\nThe next step is linking your Telegram account so you can clock in, receive daily task briefings, and access the DBM Bot menu directly on your phone.',
    pin_tg_no_survey: 'Hi ' + fn + '! 👋\n\nYou are almost fully onboarded as our ' + r + ' in ' + d + '!\n\nThe Staff Profile Survey and Employment Agreement is the final step. Completing it confirms your role details, connects your payout method, and activates your full DBM workspace.',
    fully_onboarded:  'Hi ' + fn + '! 🎉\n\nYou are officially fully onboarded as our ' + r + ' -- welcome to the GRO10X team!\n\nYour GRO10X Brand Studio is fully unlocked. Here is your daily operational workflow:'
  };
  const intro = map[stage] || map.no_pin;
  return intro + '\n\n📌 Quick Onboarding Steps:\n' + step + '\n\n• Web Crew Portal: ' + PORTAL + '\n• Telegram Bot: ' + BOT_LINK + '\n\nIf you have any questions or need assistance, reply directly to this message.\n\nLooking forward to building great brands together!\n\n-- Firoz Uddin Ahmed · Founder & Tech Lead\nGRO10X';
}

// Gemini with strict response validation
const MODELS = ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'];

function callSingle(model, prompt, key, options = {}) {
  const maxTokens = options.maxTokens || 3500;
  const temperature = options.temperature !== undefined ? options.temperature : 0.4;
  const requireBrandKeyword = options.requireBrandKeyword || false;
  const timeoutMs = options.timeoutMs || (process.env.NODE_ENV === 'test' ? 1500 : 35000);

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
        responseMimeType: options.json ? 'application/json' : undefined
      }
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/' + model + ':generateContent?key=' + key,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.candidates && j.candidates[0] && j.candidates[0].content) {
            const text = (j.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
            if (requireBrandKeyword) {
              if (text.length >= 120 && (text.toLowerCase().includes('gro10x') || text.toLowerCase().includes('welcome') || text.toLowerCase().includes('portal'))) {
                return resolve(text);
              }
              return reject(new Error('Incomplete onboarding text: ' + model + ' only ' + text.length + ' chars'));
            }
            if (text.length > 0) return resolve(text);
            return reject(new Error('Empty text from ' + model));
          }
          reject(new Error((j.error && j.error.message) || 'No output: ' + model));
        } catch (e) {
          reject(new Error('ParseErr: ' + model + ' ' + e.message));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Timeout: ' + model));
    });
    req.write(payload);
    req.end();
  });
}

function cleanJSONText(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  if (text.startsWith('```json')) text = text.replace(/^```json/i, '');
  if (text.startsWith('```')) text = text.replace(/^```/i, '');
  if (text.endsWith('```')) text = text.replace(/```$/i, '');
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Try substring matching for { ... } or [ ... ]
    const firstObj = text.indexOf('{');
    const lastObj = text.lastIndexOf('}');
    if (firstObj !== -1 && lastObj > firstObj) {
      try {
        return JSON.parse(text.slice(firstObj, lastObj + 1));
      } catch (err) {}
    }
    const firstArr = text.indexOf('[');
    const lastArr = text.lastIndexOf(']');
    if (firstArr !== -1 && lastArr > firstArr) {
      try {
        return JSON.parse(text.slice(firstArr, lastArr + 1));
      } catch (err) {}
    }
    return null;
  }
}

async function tryGemini(name, role, dept, stage, key) {
  const fn = getFirstName(name);
  const nextStep = STEPS[stage] || STEPS.no_pin;
  const prompt =
    'You are Firoz Uddin Ahmed, Founder and Tech Lead of GRO10X, a high-growth AI and digital product agency in Dhaka.\n\n' +
    'Write a clear, professional, and welcoming WhatsApp onboarding message in English for ' + name + ' (' + (role || 'Digital Brand Manager') + ', ' + (dept || 'Brand Operations') + '). Stage: ' + stage + '.\n\n' +
    'The message MUST include all of these in order:\n' +
    '1. Hi ' + fn + '! 👋\n' +
    '2. Warm personal welcome to GRO10X mentioning their role (' + role + ' in ' + dept + ')\n' +
    '3. Clear 1-2-3 step instructions on how to get started:\n' +
    '   - Step 1: Open Crew Portal (' + PORTAL + ') using their registered phone number\n' +
    '   - Step 2: Launch Telegram Bot (' + BOT_LINK + ') and tap /start\n' +
    '   - Step 3: Complete profile survey and sign the digital employment agreement\n' +
    '4. Note that they can reach out directly for any questions\n' +
    '5. Encouraging sign-off: "-- Firoz Uddin Ahmed · Founder & Tech Lead, GRO10X"\n\n' +
    'Output the message text ONLY. Do NOT use markdown code fences. Keep formatting clean for WhatsApp with emojis and bullet points.';
  for (const model of MODELS) {
    try {
      const r = await callSingle(model, prompt, key, { requireBrandKeyword: true, maxTokens: 800 });
      console.log('[AI] OK ' + model + ' ' + r.length + ' chars');
      return r;
    } catch (e) {
      console.warn('[AI] skip ' + model + ': ' + e.message);
    }
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

function buildDeterministicSpreadBreakdown(pageBreakdown, pageCount, category, productName) {
  let pagesList = '';
  let count = pageCount;

  if (Array.isArray(pageBreakdown) && pageBreakdown.length > 0) {
    count = pageBreakdown.length;
    pagesList = pageBreakdown.map((p, idx) => {
      const num = p.pageNumber || p.page_number || p.pageNum || p.page || (idx + 1);
      const pTitle = p.title || p.name || `Spread #${num}`;
      const pPurpose = p.purpose || p.description || (p.status === 'clean' ? 'High-resolution printable layout' : '');
      return `• Page ${num}: ${pTitle}${pPurpose ? ` — ${pPurpose}` : ''}`;
    }).join('\n');
  } else {
    // If no page breakdown is passed, resolve category spreads from blueprint generator
    try {
      const { generateCategoryBlueprint } = require('../services/blueprint-generator');
      const bp = generateCategoryBlueprint({ productName, category, brandName: 'PlannerQueenGro' });
      if (bp && Array.isArray(bp.pages) && bp.pages.length > 0) {
        count = bp.pages.length;
        pagesList = bp.pages.map((p, idx) => {
          const num = p.pageNumber || idx + 1;
          return `• Page ${num}: ${p.title}${p.purpose ? ` — ${p.purpose}` : ''}`;
        }).join('\n');
      }
    } catch (e) {
      // Fallback
    }

    if (!pagesList) {
      count = 16;
      pagesList = `• Page 1: Minimalist Aesthetic Cover & Personalization Index\n` +
        `• Page 2: Quick Start Guide & Daily Planning Rituals\n` +
        `• Page 3: Master Index & Hyperlinked Navigation Matrix\n` +
        `• Page 4: Monthly Goals & Intentions Roadmap\n` +
        `• Page 5: Weekly Master Schedule & Priority Matrix\n` +
        `• Page 6: Daily Focused Execution & Time-Blocking Layout\n` +
        `• Page 7: Monthly Income, Expenses & Budget Tracker\n` +
        `• Page 8: 30-Day Habit Matrix & Routine Consistency Tracker\n` +
        `• Page 9: Weekly Reflection, Wins & Mindful Reset\n` +
        `• Page 10: Ideas, Mind Maps & Dot Grid Notes`;
    }
  }

  return {
    sectionHeader: `📋 COMPLETE ${count}-PAGE SPREAD BREAKDOWN (WHAT'S INSIDE):`,
    pagesList,
    count
  };
}

function injectDeterministicSpreadsIntoDescription(description, spreadInfo, productName, brandName, brandNiche) {
  const { sectionHeader, pagesList } = spreadInfo;
  const spreadBlock = `${sectionHeader}\n${pagesList}`;

  if (!description || typeof description !== 'string') {
    return `✨ Welcome to ${brandName || 'PlannerQueenGro'} — ${brandNiche || 'Intentional Productivity & Digital Stationery'}\n\n` +
      `Transform your daily routine, streamline your productivity, and achieve your goals with the **${productName}**.\n\n` +
      `${spreadBlock}\n\n` +
      `📦 WHAT IS INCLUDED & COMPATIBILITY:\n` +
      `• High-Resolution Vector Printable PDF (US Letter & A4 Print-Ready 300 DPI)\n` +
      `• Hyperlinked Digital Tablet Compatibility (GoodNotes, Notability, Samsung Notes, iPad)\n` +
      `• Clean Minimalist Typography & Eye-Friendly Color Palette\n` +
      `• Official Single-User Anti-Piracy License Pass\n` +
      `• Bonus Canva / Notion Quick-Start Setup Guide\n\n` +
      `⚡ HOW IT WORKS:\n` +
      `1. Complete your purchase on Etsy.\n` +
      `2. Instantly download your PDF files from Etsy Purchases.\n` +
      `3. Import into GoodNotes / tablet app or print immediately at home!\n\n` +
      `🔒 LICENSE & USAGE:\n` +
      `For personal use only. Reselling, sharing, or commercial redistribution is strictly prohibited.\n\n` +
      `💌 Need assistance or custom requests? Send us an Etsy message anytime!`;
  }

  // Regex to match existing spread section (from COMPLETE ... PAGE SPREAD BREAKDOWN up to 📦 WHAT IS INCLUDED or next section)
  const spreadSectionRegex = /(?:📋\s*)?(?:COMPLETE\s+)?(?:\d+[-–\s]*PAGE)?\s*SPREAD\s*BREAKDOWN[\s\S]*?(?=(?:📦|⚡|🔒|💌|WHAT IS INCLUDED|HOW IT WORKS|LICENSE|$))/i;

  if (spreadSectionRegex.test(description)) {
    return description.replace(spreadSectionRegex, `${spreadBlock}\n\n`);
  }

  // If no spread section was found, insert it right after the first headline paragraph
  const paragraphs = description.split('\n\n');
  if (paragraphs.length >= 2) {
    paragraphs.splice(2, 0, spreadBlock);
    return paragraphs.join('\n\n');
  }

  return `${description}\n\n${spreadBlock}`;
}

// POST /api/ai/etsy-seo — Generates Category-Aware Etsy SEO Title, 13 Tags, and Listing Description with Complete Spread Breakdown
router.post('/etsy-seo', requireAuth, async (req, res) => {
  const productName = req.body.productName || req.body.title || req.body.name;
  const brandName = req.body.brandName || req.body.brand || 'PlannerQueenGro';
  const { brandNiche, brandVoice, type, category, pageCount, pageBreakdown, palette, auditScore, price } = req.body;
  if (!productName) {
    return res.status(400).json({ error: 'productName or title is required' });
  }

  const key = process.env.GEMINI_API_KEY;
  const spreadInfo = buildDeterministicSpreadBreakdown(pageBreakdown, pageCount, category, productName);
  const effectivePageCount = spreadInfo.count;

  function generateFallbackSEO(pName, bName, niche, pType, cat, sInfo) {
    const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
    const shortCat = (cat || 'Daily Planner').replace(/Planners|Trackers/i, 'Planner').trim();
    const title = `${cleanP} - ${shortCat} Printable - ${bName || 'PlannerQueen'} GoodNotes PDF`
      .replace(/\|/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140);
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

    const description = injectDeterministicSpreadsIntoDescription(null, sInfo, cleanP, bName, niche);

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
      ...generateFallbackSEO(productName, brandName, brandNiche, type, category, spreadInfo)
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
    `System Size: "${effectivePageCount} Pages"\n` +
    `Palette: "${Array.isArray(palette) ? palette.join(', ') : (palette || '#8B5A7A, #FAF3E8, #7D9B76')}"\n` +
    `Retail Price: "$${price || 7.49} USD"\n` +
    `Actual Tested Page Breakdown:\n${spreadInfo.pagesList}\n` +
    `\nStrict Requirements:\n` +
    `1. "title": Strictly 14 WORDS OR FEWER AND 140 characters or fewer. Comply with Etsy's official SEO ranking recommendation: "Consider using 14 words or less". Front-load highest-volume buyer keywords separated by hyphens (e.g. "Mindful Morning Routine Journal - Printable Daily Planner - GoodNotes PDF"). Avoid pipes (|) and avoid keyword stuffing.\n` +
    `2. "tags": EXACTLY 13 comma-separated tag phrases. EACH tag MUST BE 20 CHARACTERS OR FEWER. Must include long-tail buyer search phrases tailored to "${category || 'planners'}".\n` +
    `3. "description": 5 high-converting structured sections:\n` +
    `   (1) Headline Hook & Value Proposition tailored specifically to "${productName}"\n` +
    `   (2) ${spreadInfo.sectionHeader}\n${spreadInfo.pagesList}\n` +
    `   (3) 📦 What is Included & File Specifications (US Letter & A4 Vector PDF, GoodNotes / iPad tablet compatibility)\n` +
    `   (4) ⚡ How It Works / Instant Download Steps\n` +
    `   (5) 🔒 Anti-Piracy Single-User License Note\n` +
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

    // CRITICAL: Deterministically guarantee Section 2 spreads in the returned description
    const finalDescription = injectDeterministicSpreadsIntoDescription(
      parsed.description,
      spreadInfo,
      productName,
      brandName,
      brandNiche
    );

    return res.json({
      success: true,
      title: (parsed.title || productName).slice(0, 140),
      tags,
      description: finalDescription,
      keywords: (parsed.keywords || []).slice(0, 5),
      generatedBy: 'gemini_with_deterministic_spreads'
    });
  } catch (err) {
    console.warn('[Etsy SEO Gemini Error]:', err.message);
    return res.json({
      success: true,
      ...generateFallbackSEO(productName, brandName, brandNiche, type, category, spreadInfo)
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/product-blueprint — Generates Category-Intelligent Product Blueprint & Google Flow Prompts
// ─────────────────────────────────────────────────────────────────────────────
const { AVAILABLE_CATEGORIES, generateCategoryBlueprint, generateCategoryMockups } = require('../services/blueprint-generator');

router.post('/product-blueprint', requireAuth, async (req, res) => {
  const rawName = req.body.productNameOverride || req.body.productName || req.body.title || req.body.name;
  const effectiveProductName = (rawName && rawName.trim()) ? rawName.trim() : 'Digital Planner';
  const effectiveBrandName = req.body.brandName || req.body.brand || 'PlannerQueenGro';

  if (!effectiveProductName) {
    return res.status(400).json({ error: 'productName or title is required' });
  }

  const {
    brandNiche,
    brandVoice,
    brandPalette,
    brandFonts,
    type,
    category,
    categoryOverride,
    targetAudienceOverride,
    hero,
    format,
    seoTags
  } = req.body;
  const brandName = effectiveBrandName;
  const productName = effectiveProductName;

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

// POST /api/ai/social-brief — Channel & Content-Type Aware Content Blueprint Generator with VEO 3 Chunks & PDF Outlines
router.post('/social-brief', requireAuth, async (req, res) => {
  const {
    channel,
    contentCategory,
    platform,
    topic,
    contentType,
    targetDuration,
    targetDurationSeconds,
    primaryLanguage
  } = req.body;

  const chanName = channel || 'Grow Bangla';
  const category = contentCategory || 'English Lesson';
  const plat = platform || 'YouTube';
  const type = contentType || 'Short-form Video';
  // Topic Normalization & Default Archetype Selection
  let cleanTopic = (topic || '').trim();
  const isGeneric = !cleanTopic || cleanTopic.toLowerCase() === 'english lesson' || cleanTopic.toLowerCase() === 'general' || cleanTopic.toLowerCase() === 'video' || cleanTopic.toLowerCase().includes('english lesson on');

  const chanLower = chanName.toLowerCase();
  const isGb = chanLower.includes('grow bangla') || category.toLowerCase().includes('english') || category.toLowerCase().includes('career');
  const isPilutics = chanLower.includes('pilutics') || category.toLowerCase().includes('geopolit') || category.toLowerCase().includes('documentary');
  const isBongHits = chanLower.includes('bong') || category.toLowerCase().includes('music') || category.toLowerCase().includes('entertainment');
  const isGro10x = chanLower.includes('gro10x') || category.toLowerCase().includes('saas') || category.toLowerCase().includes('ai') || category.toLowerCase().includes('tech');

  if (isGeneric) {
    if (isGb) cleanTopic = 'Corporate Job Interview-e "Tell Me About Yourself"-এর সঠিক ৩টি ফর্মুলা';
    else if (isPilutics) cleanTopic = 'Middle East Trade Corridor Crisis & Geopolitical Shift';
    else if (isBongHits) cleanTopic = 'বাঙালির প্রথম প্রেম ও ক্রাশের ৫টি কমন ট্র্যাজেডি';
    else if (isGro10x) cleanTopic = 'How We Build & Ship Full-Stack AI MVPs in 48 Hours';
    else cleanTopic = `${category} Masterclass`;
  }

  const postTopic = cleanTopic;
  const lang = primaryLanguage || 'Bangla + English (Banglish / Spoken)';

  // Parse duration
  let durationSec = 30;
  if (targetDurationSeconds && Number(targetDurationSeconds) > 0) {
    durationSec = Number(targetDurationSeconds);
  } else if (targetDuration) {
    const raw = String(targetDuration).toLowerCase();
    if (raw.includes('30s') || raw === '30') durationSec = 30;
    else if (raw.includes('60s') || raw === '60' || raw.includes('1 min')) durationSec = 60;
    else if (raw.includes('90s') || raw === '90') durationSec = 90;
    else if (raw.includes('2 min') || raw.includes('120')) durationSec = 120;
    else if (raw.includes('3 min') || raw.includes('180')) durationSec = 180;
    else if (raw.includes('5 min') || raw.includes('300')) durationSec = 300;
    else {
      const match = raw.match(/\d+/);
      if (match) durationSec = parseInt(match[0], 10);
    }
  } else if (type === 'Long-form Video') {
    durationSec = 180;
  } else if (type === 'Music Video') {
    durationSec = 60;
  }

  const isVideoType = type.includes('Video') || type === 'Short-form Video' || type === 'Long-form Video' || type === 'Music Video';
  const isPdfType = type === 'PDF / Document' || (plat === 'LinkedIn' && type.includes('PDF'));
  const isCarouselType = type === 'Carousel';

  const chunkCount = isVideoType ? Math.max(1, Math.min(18, Math.ceil(durationSec / 10))) : 0;

  // Build rich, character-driven VEO 3 scene blueprints
  function buildCinematicVeoScenes(chan, postTop, cat, durSec, l, count) {
    const isGb = chan.toLowerCase().includes('grow bangla') || cat.toLowerCase().includes('english') || cat.toLowerCase().includes('career');
    const isPilutics = chan.toLowerCase().includes('pilutics') || cat.toLowerCase().includes('geopolit') || cat.toLowerCase().includes('documentary');
    const isBongHits = chan.toLowerCase().includes('bong') || cat.toLowerCase().includes('music') || cat.toLowerCase().includes('entertainment');
    const isGro10x = chan.toLowerCase().includes('gro10x') || cat.toLowerCase().includes('saas') || cat.toLowerCase().includes('ai') || cat.toLowerCase().includes('tech');

    const isPronunciation = /pronunciation|উচ্চারণ|accent|phonetic/i.test(postTop);
    const isSalary = /salary|বেতন|negotiat|money|offer|increment/i.test(postTop);
    const isEmail = /email|ইমেইল|mail\b|inbox/i.test(postTop);
    const isInterview = /interview|ইন্টারভিউ|hire|viva|yourself|freshers/i.test(postTop);

    const scenes = [];
    for (let i = 1; i <= count; i++) {
      const startSec = (i - 1) * 10;
      const endSec = i * 10;
      const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2, '0')}`;
      const timeRange = `${formatTime(startSec)}–${formatTime(endSec)}`;

      let section = 'Core Content Progression';
      let characterAction = '';
      let cameraMove = '';
      let prompt = '';
      let voiceLine = '';
      let visualCue = '';

      if (isGb) {
        // Grow Bangla — Host Saira, High-contrast modern educator studio
        if (i === 1) {
          section = 'The Hook (Urgent Warning)';
          characterAction = 'Saira delivering an urgent warning with a serious, high-stakes expression, pointing directly toward camera.';
          cameraMove = 'Cinematic studio medium shot, subtle 35mm slow push-in, shallow depth of field (f/1.8).';
          prompt = `Cinematic studio. Medium shot of young professional Bangladeshi female educator Saira delivering an urgent warning about ${postTop} with an intense, engaging expression. Warm key lighting, dark acoustic wood slats background with vivid cyan LED backlight. 4K 60fps photorealistic.`;
          voiceLine = isPronunciation 
            ? `এই ৫টি ইংরেজি শব্দের ভুল উচ্চারণ আজই বন্ধ করো! স্মার্ট ক্যারিয়ারে এটা বড় বাধা!`
            : (isSalary 
                ? `HR যখন সেলারি এক্সপেক্টেশন জিজ্ঞেস করে, ভুলেও এই ভুলটা করবে না!` 
                : (isEmail 
                    ? `কর্পোরেট ইমেইলে এই ভুলগুলো করলে প্রফেশনাল ইম্প্রেশন সরাসরি নষ্ট হয়!`
                    : (isInterview
                        ? `ইন্টারভিউতে 'Tell Me About Yourself' জিজ্ঞেস করলেই এই ৩টি মারাত্মক ভুল কখনোই করবে না!`
                        : `${postTop} নিয়ে এই মারাত্মক ভুলটা করলেই ক্যারিয়ার শেষ! এখনই শুধরে নাও!`)));
          visualCue = `Red stop-sign alert badge with kinetic text: "${postTop.slice(0, 28)} 🛑"`;
        } else if (i === 2) {
          section = 'The Common Mistake (Demo)';
          characterAction = isPronunciation 
            ? 'Saira demonstrating flawed mouth shape and hesitant pronunciation of a common word with a puzzled look.'
            : (isSalary 
                ? 'Saira acting out nervous candidate blurting out a low salary number with slumped shoulders.'
                : 'Saira acting out a hesitant, confused candidate posture — slumped shoulders, unsure tone, looking away.');
          cameraMove = 'Medium shot, static camera with subtle handheld texture, side warm amber fill.';
          prompt = `Studio medium shot. Female educator Saira acting out a relatable mistake during a high-stakes ${postTop} scenario. Warm amber side lighting, modern studio background, high visual clarity.`;
          voiceLine = isPronunciation 
            ? `সবাই যেমন 'Wednesday'-কে ভুল করে 'ওয়েড-নেস-ডে' বলে, ঠিক তেমনই আরও কিছু মারাত্মক ভুল রয়েছে...`
            : (isSalary 
                ? `নার্ভাস হয়ে 'আমার ৩০ হাজার হলেই চলবে' বলে ফেললে প্রথমেই তোমার বার্গেইনিং পাওয়ার শেষ!`
                : (isEmail
                    ? `ইমেইলের সাবজেক্ট লাইন ও ওপেনিং দুর্বল হলে রিসিভার সেটা পড়বেই না।`
                    : `শুরুতেই নিজের নাম ও ব্যাকগ্রাউন্ড মুখস্থ বলতে থাকলে HR শুরুতেই আগ্রহ হারিয়ে ফেলে।`));
          visualCue = `Split-screen visual with high-contrast Red 'X' and 'Wrong Way' label.`;
        } else if (i === 3) {
          section = 'The Pivot / Transition';
          characterAction = 'Saira nodding with confident reassurance, leaning slightly forward to reveal the secret formula.';
          cameraMove = 'Medium close-up, smooth camera glide forward, eye-level framing.';
          prompt = `Studio medium close-up. Female educator Saira nodding knowingly with an encouraging, confident smile, preparing to share the winning ${postTop} strategy. Cyan and warm golden rim light.`;
          voiceLine = `কিন্তু স্মার্ট প্রফেশনালরা এভাবে বলে না! তারা ব্যবহার করে এই ৩-স্টেপ ম্যাজিক টেকনিক...`;
          visualCue = `Glowing transition badge: 'Winning 3-Step Strategy ⚡'`;
        } else if (i === 4) {
          section = 'The Correct Solution';
          characterAction = isPronunciation
            ? 'Saira demonstrating crisp mouth opening and clear phonetic resonance with confident eye contact.'
            : 'Saira articulating the correct phrase with crisp hand gestures and sharp, authoritative eye contact.';
          cameraMove = 'Crisp close-up shot, sharp focus on facial expression and clear articulation.';
          prompt = `Close-up shot of female educator Saira articulating clearly with confident expressions and authoritative hand gestures for ${postTop}. High-contrast studio lighting, sharp focus on eyes and expression.`;
          voiceLine = isPronunciation 
            ? `সঠিক উচ্চারণ হলো 'ওয়েনয-ডে' এবং 'Receipt'-এর ক্ষেত্রে 'p' সাইলেন্ট থাকবে, বলতে হবে 'রি-সীট'!`
            : (isSalary 
                ? `বলবে: "আমার এক্সপেরিয়েন্স ও মার্কেট ভ্যালু অনুযায়ী আমি এক্সপেক্ট করছি..." — সরাসরি ভ্যালু দেখাও!`
                : (isEmail
                    ? `স্মার্ট ওপেনার: "I hope you are having a productive week" — সরাসরি অ্যাকশন পয়েন্টে আসো!`
                    : `সঠিক ৩-স্টেপ ফর্মুলা: প্রথমে বর্তমান রোল, তারপর সেরা প্রজেক্ট অ্যাচিভমেন্ট, এবং শেষে কোম্পানির জন্য ভ্যালু!`));
          visualCue = `Green checkmark with kinetic phrase overlay in clear Bengali script.`;
        } else if (i === 5) {
          section = 'Actionable Rule & Takeaway';
          characterAction = 'Saira demonstrating the structured formula using 3 distinct finger counts with high energy.';
          cameraMove = 'Medium shot, dynamic fast zoom-in on beat.';
          prompt = `Studio medium shot. Female educator Saira enthusiastically demonstrating a 3-part framework for ${postTop} using hand gestures. Modern glass whiteboard with neon cyan accent.`;
          voiceLine = `এই গোল্ডেন রুলটা মনে রাখলে যে কোনো সিচুয়েশনে তুমি কনফিডেন্টলি নিজেকে প্রেজেন্ট করতে পারবে!`;
          visualCue = `3-step numbered framework pill list glowing on screen.`;
        } else {
          section = 'Call to Action & Studio Signoff';
          characterAction = 'Saira smiling brightly, giving a warm wave and energetic pointing gesture toward subscription button.';
          cameraMove = 'Smooth camera pull-back showing full high-end studio workspace and branding.';
          prompt = `Wide pull-back shot. Female educator Saira smiling warmly and waving, revealing full modern studio set with wood acoustic panels and glowing Grow Bangla branding.`;
          voiceLine = `প্রতিদিনের ক্যারিয়ার ও স্পোকেন ইংলিশ মাস্টারির জন্য Grow Bangla-তে এখনই সাবস্ক্রাইব করো!`;
          visualCue = `Grow Bangla official brand card with Subscribe & Follow animation.`;
        }
      } else if (isPilutics) {
        // PILUTICS — Geopolitical War Room & Analysis
        if (i === 1) {
          section = 'Geopolitical Crisis Hook';
          characterAction = 'Analyst host standing before holographic world map display with stern, analytical expression.';
          cameraMove = 'Dramatic tracking shot entering dark studio, deep blue and crimson ambient lighting.';
          prompt = `Cinematic documentary studio. Strategic geopolitical analyst standing before glowing holographic map display analyzing ${postTop}. Moody dark-mode command center, deep navy and crimson rim lights. 4K 60fps.`;
          voiceLine = `এই ঘটনাটি বিশ্ব রাজনীতিতে এমন এক পরিবর্তন আনছে যা কেউ আশা করেনি!`;
          visualCue = `Pulsing red geopolitical hotspot marker on interactive map.`;
        } else if (i === count) {
          section = 'Strategic Conclusion & CTA';
          characterAction = 'Analyst looking directly into lens with thought-provoking gaze and steady hand gesture.';
          cameraMove = 'Slow pull-back to wide command room view.';
          prompt = `Wide shot of analyst at glass briefing table surrounded by glowing analytical screens. Dramatic cinematic lighting.`;
          voiceLine = `ভূরাজনীতি ও বিশ্ব সংঘাতের গভীর বিশ্লেষণের জন্য PILUTICS ফলো করুন।`;
          visualCue = `PILUTICS signature compass seal and Subscribe overlay.`;
        } else {
          section = `Deep Strategic Breakdown #${i}`;
          characterAction = 'Analyst pointing to key trade routes and defense corridors with precise visual pacing.';
          cameraMove = 'Medium close-up with slow pan across satellite telemetry displays.';
          prompt = `Medium shot of documentary analyst gesturing toward illuminated satellite map overlays for ${postTop}, high visual clarity and photorealistic textures.`;
          voiceLine = `পরিস্থিতি বিশ্লেষণ করলে দেখা যায় কৌশলগত কারণে এই সিদ্ধান্ত নেয়া হয়েছে।`;
          visualCue = `Satellite trajectory graphic and statistical comparison chart.`;
        }
      } else if (isBongHits) {
        // Bong Hits — Entertainment, Skits & Music
        if (i === 1) {
          section = 'High-Energy Comic / Music Hook';
          characterAction = 'Host delivering explosive comic expression, jumping into frame with high-energy body language.';
          cameraMove = 'Fast snap-zoom into face, vibrant neon purple and cyan lighting.';
          prompt = `Vibrant urban neon studio. High-energy creator jumping into frame with hilarious expressive face about ${postTop}. Dynamic magenta and cyan neon backlight, energetic 60fps motion blur.`;
          voiceLine = `এটা কী দেখলাম ভাই! এই ভিডিও না দেখলে চরম মিস!`;
          visualCue = `Exploding comic text bubble and soundwave pulse.`;
        } else if (i === count) {
          section = 'Viral Outro & Share Prompt';
          characterAction = 'Host laughing with friends, pointing enthusiastically at screen for share.';
          cameraMove = 'Quick whip-pan to full vibrant set.';
          prompt = `Wide energetic shot of creator laughing and dancing in neon-lit creator loft, bold pop culture aesthetic.`;
          voiceLine = `বন্ধুদের সাথে শেয়ার করো আর Bong Hits-এ সাবস্ক্রাইব করে বেল বাজিয়ে দাও!`;
          visualCue = `Bong Hits neon logo pulse and Share button animation.`;
        } else {
          section = `Entertainment Skit Beat #${i}`;
          characterAction = 'Expressive comedic acting, dynamic hand gestures and exaggerated relatable expressions.';
          cameraMove = 'Medium dutch angle with rhythmic quick cuts.';
          prompt = `Medium shot of creator acting out funny relatable situation in colorful urban room, sharp focus and vibrant grading.`;
          voiceLine = `সবাই যখন ভাবলো সব শেষ, তখনই ঘটলো আসল টুইস্ট!`;
          visualCue = `Relatable reaction emoji burst and sound effect pop.`;
        }
      } else {
        // GRO10X Brand / Global Tech
        if (i === 1) {
          section = 'High-Value B2B Hook';
          characterAction = 'Tech founder opening ultra-thin dark-mode laptop, displaying rapid MVP dashboard booting live.';
          cameraMove = 'Macro tracking shot over glassmorphic interface, neon emerald (#00DF89) edge highlights.';
          prompt = `Cinematic modern SaaS studio. Entrepreneur opening sleek glassmorphic MacBook showing dark-mode Progressive Web App dashboard for ${postTop} booting with 60fps fluid charts. Neon emerald and obsidian ambient lighting.`;
          voiceLine = `Stop waiting months for traditional agencies. Here is how we ship full-stack MVPs in 48 hours.`;
          visualCue = `Live 48-Hour Sprint Stopwatch HUD with verified GRO10X badge.`;
        } else if (i === count) {
          section = 'Executive CTA';
          characterAction = 'Founder looking into camera with confident smile, closing laptop smoothly.';
          cameraMove = 'Medium pull-back revealing modern minimalist tech agency loft.';
          prompt = `Medium wide shot of tech executive standing in high-end glass office overlooking city skyline, emerald ambient lights.`;
          voiceLine = `Ready to scale your product engine? Visit gro10x.ai or message us today.`;
          visualCue = `GRO10X OS logo and 1-Click Consultation CTA link.`;
        } else {
          section = `Architecture & Feature Demo #${i}`;
          characterAction = 'Hands interacting smoothly with responsive web application on smartphone and desktop monitors.';
          cameraMove = 'Isometric close-up sliding across real-time data visualizations.';
          prompt = `Close-up isometric view of holographic node architecture connecting Node.js backend to Supabase PostgreSQL real-time database with lightning data pulses.`;
          voiceLine = `Powered by modern serverless architecture with 100% full source code ownership and zero vendor lock-in.`;
          visualCue = `Interactive cloud infrastructure flowchart with Supabase and Node.js badges.`;
        }
      }

      scenes.push({
        scene: i,
        timeRange,
        section,
        characterAction,
        cameraMove,
        prompt,
        voiceLine,
        visualCue
      });
    }

    return scenes;
  }

  function formatMasterVeoPrompt(scenes) {
    if (!Array.isArray(scenes) || scenes.length === 0) return null;
    return scenes.map(s => {
      return `Scene ${s.scene} (${s.timeRange}) — ${s.section || 'Beat'}\n` +
        `• Visual Prompt: ${s.prompt || ''}\n` +
        `• Character Action: ${s.characterAction || 'Engaged on-camera subject'}\n` +
        `• Camera & Lighting: ${s.cameraMove || 'Cinematic 4K studio framing'}\n` +
        `• Spoken Line: "${s.voiceLine || ''}"\n` +
        `• Visual Cue / Overlay: ${s.visualCue || 'None'}`;
    }).join('\n\n');
  }

  const fallbackScenes = isVideoType ? buildCinematicVeoScenes(chanName, postTopic, category, durationSec, lang, chunkCount) : [];

  const fallbackPdfSlides = isPdfType ? [
    { slideNumber: 1, type: 'Cover', headline: `${postTopic}`, bullets: [`The Complete Executive Breakdown`, `By GRO10X Media for ${chanName}`], visualNote: 'Bold contrasting typography on dark gradient backdrop with brand icon.' },
    { slideNumber: 2, type: 'The Problem', headline: `Why Most Creators & Teams Fail at ${category}`, bullets: [`Misunderstanding the fundamental workflow`, `Spending 80% of effort on low-leverage tasks`, `Lack of systematic automation`], visualNote: 'Red callout badge with side-by-side comparison diagram.' },
    { slideNumber: 3, type: 'The Framework', headline: `The 3-Step Execution Model`, bullets: [`Step 1: AI Blueprint Grounding`, `Step 2: Rapid Modular Production`, `Step 3: Multi-Channel Distribution`], visualNote: '3-tier pyramid / process flow infographic.' },
    { slideNumber: 4, type: 'Deep Dive Step 1', headline: `Phase 1: Input & Context Strategy`, bullets: [`Structuring high-retention briefing prompts`, `Aligning tone with target audience persona`], visualNote: 'Checklist style cards with green check icons.' },
    { slideNumber: 5, type: 'Deep Dive Step 2', headline: `Phase 2: Execution & Quality Control`, bullets: [`Reviewing against platform constraints`, `Ensuring first-comment and SEO tag readiness`], visualNote: 'Split-screen UI preview.' },
    { slideNumber: 6, type: 'Actionable Takeaways', headline: `Key Rules to Implement Today`, bullets: [`Rule 1: Hook in the first 3 seconds`, `Rule 2: Provide one clear value payoff`, `Rule 3: Single strong call-to-action`], visualNote: 'Highlighted quote box with golden accent.' },
    { slideNumber: 7, type: 'Call to Action', headline: `Ready to Scale Your Content Engine?`, bullets: [`Follow ${chanName} for daily breakthroughs`, `Save this document for your team review`, `Visit gro10x.ai for agency growth systems`], visualNote: 'Large high-contrast CTA button with QR/link placeholder.' }
  ] : null;

  const fallbackCarouselSlides = isCarouselType ? [
    { slide: 1, headline: `Stop Doing ${category} the Hard Way 🛑`, copy: `Swipe to see the exact 5-step method we use at ${chanName}...`, visualCue: 'High-contrast bold cover slide with swipe indicator.' },
    { slide: 2, headline: `1. The Common Mistake`, copy: `Most people rush without a clear angle. Here's what goes wrong.`, visualCue: 'Warning icon with problem breakdown.' },
    { slide: 3, headline: `2. The Smart Shift`, copy: `Instead, use this exact structure to hold retention.`, visualCue: 'Step-by-step numbered visual.' },
    { slide: 4, headline: `3. Actionable Rule`, copy: `Apply this simple formula on your next draft.`, visualCue: 'Formula box.' },
    { slide: 5, headline: `Save This Post! 📌`, copy: `Share with someone who needs this today. Follow for more!`, visualCue: 'Save icon and brand badge.' }
  ] : null;

  const isBanglish = lang.toLowerCase().includes('bangla') || lang.toLowerCase().includes('bengali');
  const deterministicFallback = {
    contentType: type,
    targetDuration: `${durationSec}s`,
    primaryLanguage: lang,
    hook: isBanglish
      ? `${postTopic}-এ এই ভুলটা করলেই বিপদ! 🛑`
      : `Stop making this mistake in ${postTopic}! 🛑`,
    angle: isBanglish
      ? `🎓 ${chanName} অডিয়েন্সদের জন্য — ${postTopic} কীভাবে প্রফেশনাল ক্যারিয়ার ও ডেইলি কনভারসেশনে সর্বোচ্চ ইমপ্যাক্ট ফেলবে তার কমপ্লিট ব্রেকডাউন।`
      : `Direct, high-retention breakdown for ${chanName} audience regarding ${postTopic} on ${plat}.`,
    keyPoints: isBanglish
      ? [
          `${postTopic}-এর সবচেয়ে কমন ভুলটি চিহ্নিত করো`,
          `সরাসরি রিয়েল এক্সাম্পল দিয়ে অ্যাকশনেবল সলিউশন দাও`,
          `একটি মেমোরেবল রুল বা ফ্রেমওয়ার্ক দিয়ে সামারাইজ করো`
        ]
      : [
          `Break down the most common misconception in ${postTopic}`,
          `Provide an immediate, actionable correction with real examples`,
          `Deliver a memorable mnemonic or takeaway rule`
        ],
    caption: isBanglish
      ? `🔥 ${postTopic} নিয়ে কুইক ব্রেকডাউন!\n\nতুমি কি এই ভুলটা করতে? এখনই জেনে নাও সঠিক পদ্ধতি।\n\n📌 Save করে রাখো — প্র্যাকটিসের সময় কাজে লাগবে!\n💬 কমেন্ট করো আরও এমন গাইডলাইন চাইলে!`
      : `🔥 Quick ${postTopic} breakdown for you!\n\nHere is the exact framework to get it right every single time.\n\n📌 Save this post so you don't forget it!\n💬 Drop a comment below if you want Part 2!`,
    hashtags: `#${chanName.replace(/[^a-zA-Z0-9]/g, '')} #${category.replace(/[^a-zA-Z0-9]/g, '')} #CareerHacks #LearnSpokenEnglish #BanglaTips`,
    firstComment: `#${chanName.replace(/[^a-zA-Z0-9]/g, '')} #LearnDaily #Bangladesh #Viral2026 #SpokenEnglish`,
    visualBrief: `Facecam intro with high-contrast text overlay on top 20% of screen. Split-screen visual example with green checkmark vs red X. Warm studio lighting with cyan/amber backlight.`,
    voiceNote: isBanglish
      ? `[0:00-0:03] Hook (Banglish): "${postTopic} নিয়ে এই মারাত্মক ভুলটা কখনোই করবে না!" [0:03-0:12] কমন ভুলটা দেখাও — কেন বেশিরভাগ মানুষ এখানে আটকে যায়। [0:12-0:25] সঠিক ৩-স্টেপ মেথড রিভিল করো: সরাসরি প্র্যাকটিকাল উদাহরণ দিয়ে। [0:25-${durationSec <= 30 ? '0:30' : '0:60'}] Strong CTA: "প্রতিদিনের ক্যারিয়ার ও স্পোকেন ইংলিশ মাস্টারির জন্য Grow Bangla-তে এখনই সাবস্ক্রাইব করো!"`
      : `Start immediately with the hook: "${postTopic} - Stop making this mistake..." (0-3s). Demonstrate the common flaw (3-12s). Reveal the correct method with energy (12-25s). Strong CTA: "Follow for daily breakthroughs" (25-30s).`,
    veoScenes: fallbackScenes,
    masterVeoPrompt: formatMasterVeoPrompt(fallbackScenes),
    pdfOutline: fallbackPdfSlides,
    masterPdfOutline: fallbackPdfSlides ? fallbackPdfSlides.map(s => `### Slide ${s.slideNumber}: ${s.headline} (${s.type})\n${s.bullets.map(b => `- ${b}`).join('\n')}\n*Visual Direction:* ${s.visualNote}`).join('\n\n') : null,
    carouselSlides: fallbackCarouselSlides
  };

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({ success: true, brief: deterministicFallback, generatedBy: 'deterministic_template' });
  }

  let specificPromptInstructions = '';
  if (isVideoType) {
    specificPromptInstructions = `
CRITICAL VEO 3 VIDEO SCENE GENERATION:
Target Video Duration: ${durationSec} seconds.
Because VEO 3 generates video in 10-second segments, you MUST generate an array named "veoScenes" containing EXACTLY ${chunkCount} items.
Each item in "veoScenes" MUST have:
- "scene": integer (1 to ${chunkCount})
- "timeRange": string (e.g. "0:00–0:10", "0:10–0:20", etc.)
- "section": string (e.g. "The Hook", "The Common Mistake", "The Pivot", "The Correction", "Actionable Takeaway", "Call to Action")
- "characterAction": string (Specific physical body language, facial expression, and hand gestures of the host/character)
- "cameraMove": string (Specific camera framing, angle, and motion e.g. "Medium shot with slow 35mm push-in")
- "prompt": string (A full, standalone, photorealistic prompt for Google VEO 3 describing subject, environment, atmospheric studio lighting, color accents, and motion)
- "voiceLine": string (The exact spoken dialogue or voiceover line for this 10-second chunk in ${lang})
- "visualCue": string (Brief on-screen kinetic typography, split-screen, checkmark/X overlay for editors)
`;
  } else if (isPdfType) {
    specificPromptInstructions = `
CRITICAL LINKEDIN PDF DOCUMENT OUTLINE:
Generate an array named "pdfOutline" containing 7 to 10 slide cards designed for an executive LinkedIn PDF document post.
Each item in "pdfOutline" MUST have:
- "slideNumber": integer (1, 2, 3...)
- "type": string ("Cover", "The Problem", "Framework", "Step 1", "Step 2", "Key Takeaways", "CTA")
- "headline": string (Bold, impactful slide header)
- "bullets": array of 2-3 concise, high-value bullet points
- "visualNote": string (Layout recommendation: icons, charts, color accent, split-screen)
`;
  } else if (isCarouselType) {
    specificPromptInstructions = `
CRITICAL CAROUSEL SLIDES:
Generate an array named "carouselSlides" containing 5 to 7 slide cards for Instagram/LinkedIn carousel.
Each item in "carouselSlides" MUST have:
- "slide": integer (1, 2, 3...)
- "headline": string (Engaging headline)
- "copy": string (1-2 sentences of punchy slide body copy)
- "visualCue": string (Visual direction for Canva designer)
`;
  }

  const prompt =
    `You are the Chief Content Strategist and Video Director for GRO10X Media and Engine 5 (Video & Media Scale).\n` +
    `Generate a comprehensive, production-ready social media content blueprint for:\n` +
    `• Channel: "${chanName}" (Context: Grow Bangla=Spoken English learning for Bangladeshis; PILUTICS=Geopolitics & travel analysis; Bong Hits=Humor, music, entertainment & viral TikTok; GRO10X Brand=AI agency, SaaS & B2B growth)\n` +
    `• Content Category: "${category}"\n` +
    `• Content Type: "${type}"\n` +
    `• Target Platform: "${plat}"\n` +
    `• Target Duration: "${durationSec} seconds"\n` +
    `• Topic / Concept: "${postTopic}"\n` +
    `• 🔴 PRIMARY LANGUAGE (MANDATORY): "${lang}"\n\n` +
    `CRITICAL LANGUAGE ENFORCEMENT RULES:\n` +
    `ALL content — hook, angle, keyPoints, caption, voiceNote, and talking script — MUST be written in "${lang}".\n` +
    `For "Bangla + English (Banglish / Spoken)": Write the hook, angle, and key points in natural spoken Banglish (as a young Bangladeshi would naturally speak — mix of Bangla words and English structure). The voiceNote/talking script MUST be fully in spoken Banglish.\n` +
    `For "Bangla / Bengali": Write primarily in standard Bengali script/romanized Bengali.\n` +
    `For "English (Global B2B & Tech)": Write formally in English.\n` +
    `NEVER generate the voiceNote/talking script in pure English if the language is not English.\n\n` +
    specificPromptInstructions +
    `\nSTANDARD REQUIRED FIELDS:\n` +
    `1. "hook": Punchy, stop-the-scroll opening in ${lang} (5-8 words max, curiosity/emotion driven).\n` +
    `2. "angle": 1-2 sentence compelling thesis in ${lang} of why the audience must watch/read this right now.\n` +
    `3. "keyPoints": Array of 3 specific, high-value takeaways written in ${lang}.\n` +
    `4. "caption": Complete ready-to-post copy in ${lang} with emojis, line breaks, and clear CTA, formatted safely for ${plat}.\n` +
    `5. "hashtags": 8-15 high-reach hashtags as a single string (mix local + global for ${plat}).\n` +
    `6. "firstComment": Engagement hook and first-comment hashtag stack for Instagram/TikTok.\n` +
    `7. "visualBrief": Clear overall visual direction (framing, color palette, props, CapCut style direction).\n` +
    `8. "voiceNote": Full verbatim spoken talking script WITH timestamps, written ENTIRELY in ${lang}. This is what the host will read out loud on camera, word for word.\n` +
    `9. "primaryLanguage": "${lang}" (include this in the JSON output)\n\n` +
    `Output STRICT JSON ONLY. Do NOT wrap in markdown code blocks.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key, { maxTokens: 3500, json: true });
        if (resultText) break;
      } catch (e) {
        console.warn('[Social Brief] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');

    const parsed = cleanJSONText(resultText);
    if (!parsed || !parsed.hook) throw new Error('Failed to parse structured JSON brief from AI');

    const finalScenes = Array.isArray(parsed.veoScenes) && parsed.veoScenes.length > 0 ? parsed.veoScenes : fallbackScenes;
    const finalPdf = Array.isArray(parsed.pdfOutline) && parsed.pdfOutline.length > 0 ? parsed.pdfOutline : fallbackPdfSlides;
    const finalCarousel = Array.isArray(parsed.carouselSlides) && parsed.carouselSlides.length > 0 ? parsed.carouselSlides : fallbackCarouselSlides;

    return res.json({
      success: true,
      brief: {
        contentType: type,
        targetDuration: `${durationSec}s`,
        primaryLanguage: lang,
        hook: parsed.hook || deterministicFallback.hook,
        angle: parsed.angle || deterministicFallback.angle,
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : deterministicFallback.keyPoints,
        caption: parsed.caption || deterministicFallback.caption,
        hashtags: parsed.hashtags || deterministicFallback.hashtags,
        firstComment: parsed.firstComment || deterministicFallback.firstComment,
        visualBrief: parsed.visualBrief || deterministicFallback.visualBrief,
        voiceNote: parsed.voiceNote || deterministicFallback.voiceNote,
        veoScenes: finalScenes,
        masterVeoPrompt: formatMasterVeoPrompt(finalScenes),
        pdfOutline: finalPdf,
        masterPdfOutline: finalPdf ? finalPdf.map(s => `### Slide ${s.slideNumber}: ${s.headline} (${s.type})\n${(s.bullets || []).map(b => `- ${b}`).join('\n')}\n*Visual Direction:* ${s.visualNote}`).join('\n\n') : null,
        carouselSlides: finalCarousel
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Social Brief Gemini fallback]:', err.message);
    return res.json({
      success: true,
      brief: deterministicFallback,
      generatedBy: 'deterministic_template'
    });
  }
});

// POST /api/ai/content-calendar — Generate 4-Week Strategic Monthly Content Plan
router.post('/content-calendar', requireAuth, async (req, res) => {
  const { channels, month, year, contentMix, analyticsSummary } = req.body;

  const targetMonth = month || new Date().toLocaleString('default', { month: 'long' });
  const targetYear = year || new Date().getFullYear();
  const chanList = Array.isArray(channels) && channels.length > 0
    ? channels
    : ['grow-bangla', 'pilutics', 'bong-hits', 'gro10x'];

  const mix = contentMix || {
    educational: 40,
    entertainment: 30,
    promo: 20,
    bts: 10
  };

  const channelMap = {
    'grow-bangla': { name: '🎓 Grow Bangla', defaultPlatform: 'YouTube', category: 'English Lesson' },
    'pilutics': { name: '🗺️ PILUTICS', defaultPlatform: 'YouTube', category: 'Geopolitical Analysis' },
    'bong-hits': { name: '🎭 Bong Hits', defaultPlatform: 'TikTok', category: 'Entertainment' },
    'gro10x': { name: '📢 GRO10X Brand', defaultPlatform: 'LinkedIn', category: 'AI Tips' },
    'client': { name: '🏢 Client Account', defaultPlatform: 'Facebook', category: 'Promo' }
  };

  // Build deterministic plan
  function buildDeterministicCalendar() {
    const days = ['Monday', 'Wednesday', 'Friday'];
    const plan = [];
    let counter = 1;

    for (let w = 1; w <= 4; w++) {
      chanList.forEach((chKey, chIdx) => {
        const chInfo = channelMap[chKey] || { name: chKey, defaultPlatform: 'YouTube', category: 'General' };
        const day = days[chIdx % days.length];
        const dayOffset = (w - 1) * 7 + (chIdx % 5) + 1;
        const dateStr = `${targetYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.min(28, dayOffset)).padStart(2, '0')}`;

        plan.push({
          id: `plan-item-${counter++}`,
          week: `Week ${w}`,
          dayOfWeek: day,
          scheduledDate: dateStr,
          channel: chInfo.name,
          platform: chInfo.defaultPlatform,
          contentType: chInfo.defaultPlatform === 'LinkedIn' ? 'PDF / Document' : (chInfo.defaultPlatform === 'TikTok' ? 'Short-form Video' : 'Long-form Video'),
          contentCategory: chInfo.category,
          topicIdea: `${chInfo.category} Breakthrough #${w}.${chIdx + 1} for ${targetMonth}`,
          hook: `The single biggest strategy that changed our results this ${targetMonth} 🚀`,
          suggestedTime: '18:00',
          targetDuration: '60s',
          reasoning: `High retention slot designed to capture ${mix.educational}% educational target audience.`
        });
      });
    }
    return plan;
  }

  const deterministicPlan = buildDeterministicCalendar();
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      plan: deterministicPlan,
      generatedBy: 'deterministic_template'
    });
  }

  const prompt =
    `You are the Head of Growth and Content Director for GRO10X Media.\n` +
    `Create a comprehensive, high-retention 4-Week Content Calendar for the month of "${targetMonth} ${targetYear}".\n\n` +
    `CHANNELS TO PLAN FOR:\n` +
    chanList.map(c => `• ${channelMap[c]?.name || c} (Platform: ${channelMap[c]?.defaultPlatform || 'YouTube'})`).join('\n') + `\n\n` +
    `DESIRED CONTENT MIX TARGET:\n` +
    `• Educational / Value: ${mix.educational || 40}%\n` +
    `• Entertainment / Viral: ${mix.entertainment || 30}%\n` +
    `• Promotion / Product / Vault: ${mix.promo || 20}%\n` +
    `• Behind-The-Scenes / Agency: ${mix.bts || 10}%\n\n` +
    (analyticsSummary ? `ANALYTICS INSIGHTS CONTEXT:\n"""\n${JSON.stringify(analyticsSummary).slice(0, 1500)}\n"""\n\n` : '') +
    `OUTPUT REQUIREMENTS:\n` +
    `Generate an array named "plan" with exactly 12 to 20 structured post draft blueprints across Weeks 1 to 4.\n` +
    `Each item in "plan" MUST have:\n` +
    `- "id": string (unique e.g. "plan-w1-1")\n` +
    `- "week": string ("Week 1", "Week 2", "Week 3", "Week 4")\n` +
    `- "dayOfWeek": string ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")\n` +
    `- "scheduledDate": string (Estimated YYYY-MM-DD for ${targetMonth} ${targetYear})\n` +
    `- "channel": string (e.g. "🎓 Grow Bangla", "🗺️ PILUTICS", "🎭 Bong Hits", "📢 GRO10X Brand")\n` +
    `- "platform": string ("YouTube", "TikTok", "Instagram", "Facebook", "LinkedIn", "Twitter")\n` +
    `- "contentType": string ("Short-form Video", "Long-form Video", "Carousel", "PDF / Document", "Static Image / Graphic", "Music Video")\n` +
    `- "contentCategory": string (Relevant channel category)\n` +
    `- "topicIdea": string (Specific, high-engagement headline topic)\n` +
    `- "hook": string (5-8 word stop-the-scroll opening)\n` +
    `- "suggestedTime": string (e.g. "18:00")\n` +
    `- "targetDuration": string (e.g. "30s", "60s", "3 min")\n` +
    `- "reasoning": string (1 sentence explaining why this fits the content cadence and audience psychology)\n\n` +
    `Output STRICT JSON ONLY with key "plan". No markdown code fences.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key, { maxTokens: 4000, json: true });
        if (resultText) break;
      } catch (e) {
        console.warn('[Content Calendar] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');

    const parsed = cleanJSONText(resultText);
    const planItems = parsed && Array.isArray(parsed.plan) && parsed.plan.length > 0 ? parsed.plan : deterministicPlan;

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      plan: planItems,
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Content Calendar fallback]:', err.message);
    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      plan: deterministicPlan,
      generatedBy: 'deterministic_template'
    });
  }
});

// POST /api/ai/parse-analytics-csv — Parse YouTube Studio / Analytics CSV & Extract Growth Insights
router.post('/parse-analytics-csv', requireAuth, async (req, res) => {
  const { csvText, channelName } = req.body;
  if (!csvText || csvText.trim().length < 20) {
    return res.status(400).json({ error: 'csvText content is required' });
  }

  const rawLines = csvText.trim().split('\n').filter(l => l.trim().length > 0);
  const header = rawLines[0] || '';
  const rows = rawLines.slice(1);

  const fallbackInsights = {
    totalRowsAnalyzed: rows.length,
    topCategories: ['Spoken English Hacks', 'Vocabulary Breakthroughs', 'Pronunciation Fixes'],
    bestPostingDays: ['Friday 18:00', 'Monday 19:00', 'Wednesday 20:00'],
    avgDuration: '45s',
    recommendations: [
      'Short-form videos under 45s have 2.8x higher completion rates.',
      'Topics addressing specific common pronunciation mistakes generated 70% of new subscriber conversions.',
      'Posting between 18:00 and 20:00 BD time captured the highest initial velocity within the first 2 hours.'
    ]
  };

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({ success: true, insights: fallbackInsights, generatedBy: 'deterministic_parser' });
  }

  const sampleRows = rows.slice(0, 30).join('\n');
  const prompt =
    `You are an elite YouTube & Social Media Analytics Growth Engineer.\n` +
    `Analyze this raw CSV export from YouTube Studio / Social Analytics for "${channelName || 'GRO10X Channel'}":\n\n` +
    `CSV HEADER:\n${header}\n\n` +
    `CSV SAMPLE ROWS (first 30):\n${sampleRows}\n\n` +
    `Extract key performance signals and generate strategic content recommendations for next month's production calendar.\n` +
    `Return strict JSON with:\n` +
    `1. "totalRowsAnalyzed": number\n` +
    `2. "topCategories": array of top 3-4 performing topic themes\n` +
    `3. "bestPostingDays": array of optimal posting day/time combinations\n` +
    `4. "avgDuration": string (recommended optimal video length)\n` +
    `5. "recommendations": array of 3-5 specific, high-impact growth recommendations\n\n` +
    `Output STRICT JSON ONLY. No markdown code blocks.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key, { maxTokens: 1800, json: true });
        if (resultText) break;
      } catch (e) {
        console.warn('[Analytics CSV] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');
    const parsed = cleanJSONText(resultText);

    return res.json({
      success: true,
      insights: {
        totalRowsAnalyzed: parsed?.totalRowsAnalyzed || rows.length,
        topCategories: parsed?.topCategories || fallbackInsights.topCategories,
        bestPostingDays: parsed?.bestPostingDays || fallbackInsights.bestPostingDays,
        avgDuration: parsed?.avgDuration || fallbackInsights.avgDuration,
        recommendations: parsed?.recommendations || fallbackInsights.recommendations
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Analytics CSV parser fallback]:', err.message);
    return res.json({ success: true, insights: fallbackInsights, generatedBy: 'deterministic_parser' });
  }
});

// POST /api/ai/music-lrc — Bong Hits Music Video Workflow: Timestamped LRC Generator & VEO Scene Director
router.post('/music-lrc', requireAuth, async (req, res) => {
  const { title, lyrics, genre, durationSeconds, bpm } = req.body;
  const songTitle = title || 'Bong Hits Track';
  const songDuration = durationSeconds ? Number(durationSeconds) : 60;
  const songGenre = genre || 'Bengali Folk Rock / Humor';

  const defaultLyrics = lyrics ||
    `[00:00.00] (Heavy bass groove & acoustic intro)\n` +
    `[00:08.50] Chole geche shob, roye geche gaan\n` +
    `[00:15.20] Chayer dokane bikel belar tan\n` +
    `[00:22.00] Mon bole chol aji hariye jai dure\n` +
    `[00:29.40] Bong Hits er shure shure!\n` +
    `[00:36.00] (Electric guitar solo & energetic breakdown)\n` +
    `[00:44.20] Notun bhabna, notun gaan\n` +
    `[00:51.00] Hasi mukhe sobai mile jite nibo pran!\n` +
    `[00:58.00] (Fade out beat)`;

  const chunkCount = Math.max(1, Math.ceil(songDuration / 10));

  function buildFallbackMusicPlan() {
    const scenes = [];
    for (let i = 1; i <= chunkCount; i++) {
      const start = (i - 1) * 10;
      const end = i * 10;
      const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2, '0')}`;
      scenes.push({
        scene: i,
        timeRange: `${formatTime(start)}–${formatTime(end)}`,
        musicSection: i === 1 ? 'Intro Beat' : (i === 2 ? 'Verse 1' : (i === 3 ? 'Chorus Hook' : (i === chunkCount ? 'Outro / Final Beat' : `Verse ${i}`))),
        prompt: `Cinematic music video scene for Bong Hits track "${songTitle}" (${formatTime(start)}-${formatTime(end)}): dynamic camera tracking, rich neon & sunset rim lighting, artist performance with expressive lip-sync, rhythm-synced motion, 4K 60fps photorealistic music video aesthetic.`,
        capcutAction: `Cut clip exactly at ${formatTime(end)} on the snare drum beat. Align lyric caption line #${i}.`
      });
    }
    return scenes;
  }

  const fallbackScenes = buildFallbackMusicPlan();

  const deterministicResponse = {
    title: songTitle,
    durationSeconds: songDuration,
    genre: songGenre,
    lrcContent: defaultLyrics,
    timestamps: [
      { time: '00:00.00', seconds: 0.0, lyric: '(Intro Beat)', section: 'Intro' },
      { time: '00:08.50', seconds: 8.5, lyric: 'Chole geche shob, roye geche gaan', section: 'Verse 1' },
      { time: '00:15.20', seconds: 15.2, lyric: 'Chayer dokane bikel belar tan', section: 'Verse 1' },
      { time: '00:22.00', seconds: 22.0, lyric: 'Mon bole chol aji hariye jai dure', section: 'Chorus Hook' },
      { time: '00:29.40', seconds: 29.4, lyric: 'Bong Hits er shure shure!', section: 'Chorus Hook' },
      { time: '00:36.00', seconds: 36.0, lyric: '(Guitar Breakdown)', section: 'Solo' },
      { time: '00:44.20', seconds: 44.2, lyric: 'Notun bhabna, notun gaan', section: 'Verse 2' },
      { time: '00:51.00', seconds: 51.0, lyric: 'Hasi mukhe sobai mile jite nibo pran!', section: 'Climax' },
      { time: '00:58.00', seconds: 58.0, lyric: '(Fade out beat)', section: 'Outro' }
    ],
    veoScenes: fallbackScenes,
    masterVeoPrompt: fallbackScenes.map(s => `[${s.timeRange} - ${s.musicSection}]: ${s.prompt}`).join('\n\n'),
    capcutGuide: [
      '1. Download the generated .LRC file using the button below.',
      '2. Open CapCut Desktop or Mobile, import your Suno MP3 audio file.',
      '3. In CapCut, navigate to Text > Auto Captions > Import Local Subtitles / LRC.',
      '4. Import the 10-second VEO video clips generated from the prompts onto your video track.',
      '5. Split video cuts on the exact beat markers specified in the scene breakdown.'
    ]
  };

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({ success: true, data: deterministicResponse, generatedBy: 'deterministic_template' });
  }

  const prompt =
    `You are the Chief Music Video Producer and Visual Director for "Bong Hits" (Engine 5 entertainment brand).\n` +
    `A creator has produced a music track in Suno and needs an exact LRC timestamp file and a series of 10-second VEO 3 prompts timed to the music structure.\n\n` +
    `TRACK DETAILS:\n` +
    `• Track Title: "${songTitle}"\n` +
    `• Genre / Mood: "${songGenre}"\n` +
    `• Target Duration: ${songDuration} seconds\n` +
    `• BPM: ${bpm || 100}\n` +
    (lyrics ? `• PROVIDED LYRICS / THEME:\n"""\n${lyrics.slice(0, 2000)}\n"""\n\n` : '') +
    `OUTPUT REQUIREMENTS:\n` +
    `1. "lrcContent": Standard LRC file string format with [mm:ss.xx] timestamps on every line covering the ${songDuration}s duration.\n` +
    `2. "timestamps": Array of objects { "time": "mm:ss.xx", "seconds": number, "lyric": "string", "section": "Intro"|"Verse 1"|"Chorus"|"Solo"|"Outro" }.\n` +
    `3. "veoScenes": Array of exactly ${chunkCount} items (10 seconds each) with:\n` +
    `   - "scene": integer (1 to ${chunkCount})\n` +
    `   - "timeRange": string ("0:00–0:10", "0:10–0:20"...)\n` +
    `   - "musicSection": string (e.g. "Intro Groove", "Verse 1 Vocal", "Chorus Lip-Sync", "Visual Climax")\n` +
    `   - "prompt": string (Photorealistic, cinematic music video shot for VEO 3 with camera movement, mood lighting, performance actions, lip-sync choreography)\n` +
    `   - "capcutAction": string (Editing advice for CapCut timeline sync on the beat)\n` +
    `4. "capcutGuide": Array of 5 practical steps to assemble this in CapCut.\n\n` +
    `Output STRICT JSON ONLY. No markdown code fences.`;

  try {
    let resultText = null;
    for (const model of MODELS) {
      try {
        resultText = await callSingle(model, prompt, key, { maxTokens: 4000, json: true });
        if (resultText) break;
      } catch (e) {
        console.warn('[Music LRC] Skip model ' + model + ':', e.message);
      }
    }

    if (!resultText) throw new Error('No output from Gemini');
    const parsed = cleanJSONText(resultText);

    const scenes = Array.isArray(parsed?.veoScenes) && parsed.veoScenes.length > 0 ? parsed.veoScenes : fallbackScenes;

    return res.json({
      success: true,
      data: {
        title: songTitle,
        durationSeconds: songDuration,
        genre: songGenre,
        lrcContent: parsed?.lrcContent || defaultLyrics,
        timestamps: Array.isArray(parsed?.timestamps) ? parsed.timestamps : deterministicResponse.timestamps,
        veoScenes: scenes,
        masterVeoPrompt: scenes.map(s => `[${s.timeRange} - ${s.musicSection || `Scene ${s.scene}`}]: ${s.prompt}`).join('\n\n'),
        capcutGuide: Array.isArray(parsed?.capcutGuide) ? parsed.capcutGuide : deterministicResponse.capcutGuide
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Music LRC fallback]:', err.message);
    return res.json({ success: true, data: deterministicResponse, generatedBy: 'deterministic_template' });
  }
});

router.get('/status', requireAuth, (req, res) => res.json({ success: true, configured: !!process.env.GEMINI_API_KEY, models: MODELS }));

router.callGeminiPrompt = async function(prompt, options = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const model of MODELS) {
    try {
      const text = await callSingle(model, prompt, key, options);
      if (text) return text;
    } catch (e) {
      console.warn('[callGeminiPrompt] Skip model ' + model + ':', e.message);
    }
  }
  return null;
};
router.cleanJSONText = cleanJSONText;

module.exports = router;

