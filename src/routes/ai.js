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
            if (text.length >= 120 && (text.toLowerCase().includes('gro10x') || text.toLowerCase().includes('welcome') || text.toLowerCase().includes('portal'))) return resolve(text);
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
  const { productName, brandName, brandNiche, brandVoice, type, category, pageCount, pageBreakdown, palette, auditScore, price } = req.body;
  if (!productName || !brandName) {
    return res.status(400).json({ error: 'productName and brandName are required' });
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
