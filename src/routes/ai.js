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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/product-blueprint — Generates Page-by-Page Product Design Blueprint & Google Flow Prompts
// ─────────────────────────────────────────────────────────────────────────────
router.post('/product-blueprint', requireAuth, async (req, res) => {
  const { productName, brandName, brandNiche, brandVoice, brandPalette, brandFonts, type, category } = req.body;
  if (!productName || !brandName) {
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

  function generateDeterministicBlueprint(pName, bName, niche, voice, palette, fonts, pType) {
    const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
    const isPlanner = cleanP.toLowerCase().includes('planner') || cleanP.toLowerCase().includes('daily') || cleanP.toLowerCase().includes('weekly');
    const isBudget = cleanP.toLowerCase().includes('budget') || cleanP.toLowerCase().includes('financial') || cleanP.toLowerCase().includes('debt');
    const isHabit = cleanP.toLowerCase().includes('habit') || cleanP.toLowerCase().includes('goal') || cleanP.toLowerCase().includes('vision');
    const isTracker = cleanP.toLowerCase().includes('tracker') || cleanP.toLowerCase().includes('log') || cleanP.toLowerCase().includes('sheet');

    let hFont = headingFont;
    let bFont = bodyFont;
    if (typeof fonts === 'string' && fonts.includes('+')) {
      const parts = fonts.split('+').map(s => s.trim());
      hFont = parts[0] || hFont;
      bFont = parts[1] || bFont;
    } else if (fonts && typeof fonts === 'object') {
      hFont = fonts.heading || fonts.headingFont || hFont;
      bFont = fonts.body || fonts.bodyFont || bFont;
    }

    const primaryColor = palette[0] || '#8B5A7A';
    const bgTint = palette[1] || '#FAF3E8';
    const secondaryColor = palette[2] || '#7D9B76';
    const highlightColor = palette[3] || '#C4887C';
    const textColor = palette[4] || '#2E2E2E';

    const pages = [
      {
        pageNumber: 1,
        section: 'Front Cover & Owner Registration',
        title: `${cleanP} · Edition 1.0`,
        purpose: 'Establish premium brand identity, ownership personal license attribution, and aesthetic tone.',
        layoutSpecs: 'Full-bleed minimalist cover with 0.5 in inner safe zone. Top centered brand badge, large serif headline, subtitle banner, fillable "This Planner Belongs To:" card, and bottom personal use license declaration.',
        elements: [
          `Brand Header: "${bName}" in ${hFont} font`,
          `Product Title: "${cleanP}" (${primaryColor})`,
          `Subtitle: "Aesthetic Intentional System for ${niche || 'Daily Productivity'}"`,
          'Fillable Name / Email attribution box with rounded borders and subtle drop shadow',
          'Legal Disclaimer: "© 2026 ' + bName + '. All Rights Reserved. Personal Use License Only. Resale / Redistribution Prohibited."'
        ]
      },
      {
        pageNumber: 2,
        section: 'Master Navigation & Year-at-a-Glance',
        title: 'Master Index & Annual Calendar Matrix',
        purpose: 'Provide high-level annual visibility and hyperlinked navigation jump points for digital PDF users.',
        layoutSpecs: 'Two-column layout. Left column (60%): 12-month calendar mini-grids (Sunday start). Right column (40%): Key annual milestones, quarterly goals, and hyperlinked navigation tabs.',
        elements: [
          '12 Mini Month Calendar Grids with shaded weekend headers',
          'Quarterly Focus Blocks (Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec)',
          'Annual Important Dates & Holiday Checklist',
          `Interactive navigation tabs styled in ${secondaryColor} with white bold labels`
        ]
      },
      {
        pageNumber: 3,
        section: 'Monthly Master Execution Spread',
        title: 'Monthly Intentions & Calendar Overview',
        purpose: 'Set monthly high-level priorities, habit anchors, and key deadlines.',
        layoutSpecs: 'Upper third: 3 Focus Cards (Top 3 Priorities, Monthly Mantra, Major Deadline). Lower two-thirds: 5-week un-dated calendar block with side-column for bills due and habit trackers.',
        elements: [
          'Top 3 Needle-Mover Goals (Ranked 1, 2, 3 with check-boxes)',
          '5x7 Open Calendar Grid with un-dated date circles for universal reuse',
          'Side Column: Upcoming Bills Due ($ Amount + Due Date checkbox)',
          'Monthly Habit Focus Tracker (5 habits with 31-day progress bar)',
          'Notes & Brain Dump dot-grid footer'
        ]
      },
      {
        pageNumber: 4,
        section: 'Weekly Execution Spread (Part 1: Monday – Thursday)',
        title: 'Weekly Master Plan & Priorities',
        purpose: 'Structure weekly high-impact tasks and weekday schedule with time-blocking clarity.',
        layoutSpecs: 'Top bar: Weekly Focus & Top 3 Outcomes. Body: 4 vertical day columns (Monday–Thursday) with 6:00 AM–9:00 PM hourly schedule and top priority boxes.',
        elements: [
          'Weekly Top 3 Non-Negotiables',
          '4 Vertical Column Schedules (Mon, Tue, Wed, Thu) with 1-hour intervals',
          'Top Task Checklist (3 check-boxes per day)',
          'Daily Water Tracker (8 cup bubbles per day)',
          'Inspirational Quote Box styled in italic serif with quote marks'
        ]
      },
      {
        pageNumber: 5,
        section: 'Weekly Execution Spread (Part 2: Friday – Sunday & Review)',
        title: 'Weekend Flow, Meal Plan & Weekly Reflection',
        purpose: 'Capture weekend priorities, lifestyle planning, meal prep, and weekly win review.',
        layoutSpecs: 'Left half: 3 vertical day columns (Friday, Saturday, Sunday). Right half: 7-day Meal Planner grid + Grocery List + Weekly Win Review card.',
        elements: [
          '3 Vertical Column Schedules (Fri, Sat, Sun)',
          '7-Day Meal Planning Grid (Breakfast, Lunch, Dinner, Snacks)',
          'Segmented Grocery Checklist (Produce, Proteins, Pantry, Essentials)',
          'Weekly Reflection Box: "What worked well? What will I adjust next week?"',
          'Next Week Prep Checklist'
        ]
      },
      {
        pageNumber: 6,
        section: 'Daily Deep Work & Schedule Spread',
        title: 'Daily Focused Execution Matrix',
        purpose: 'Ultra-granular hourly time blocking, Eisenhower task triage, and mindfulness tracking.',
        layoutSpecs: 'Split 2-column layout. Left column: 6:00 AM – 9:00 PM hourly timeline. Right column: Eisenhower Priority Triage (Must Do, Should Do, Could Do), Brain Dump, and Mood/Gratitude.',
        elements: [
          'Date, Day of Week & Daily Intention header',
          '6:00 AM – 9:00 PM Time Blocking Schedule with 30-minute divider ticks',
          'Eisenhower Priority Grid: Must Do (High Impact), Should Do (Medium), Could Do (Low)',
          'Daily Gratitude & Win of the Day prompt',
          'Water Intake Tracker (8 droplets) + Mood Selector (5 icons)'
        ]
      },
      {
        pageNumber: 7,
        section: 'Habit Formation & Consistency Matrix',
        title: '30-Day Habit Matrix & Streak Tracker',
        purpose: 'Build consistent daily routines with visual gamification and milestone check-ins.',
        layoutSpecs: 'Full-width matrix table with 20 habit rows on the left and 31 numbered circular check-bubbles across the columns. Bottom cards for reward milestones.',
        elements: [
          '20 Habit Rows with category tags (Morning, Health, Work, Evening)',
          '31-Day Check Circles with shaded 7-day milestone dividers',
          'Milestone Reward Cards (7-Day Streak, 14-Day Streak, 30-Day Perfection)',
          'Monthly Consistency Percentage Calculator formula guide'
        ]
      },
      {
        pageNumber: 8,
        section: 'Financial Health & Cash Flow Tracker',
        title: 'Monthly Cash Flow, Expenses & Savings Tracker',
        purpose: 'Track monthly income streams, fixed/variable expenses, and debt payoff progress.',
        layoutSpecs: '3 KPI summary cards at top (Total Income, Total Expenses, Net Savings). 2 large side-by-side tables for Fixed Bills and Variable Spending logs.',
        elements: [
          'KPI Cards: Income ($), Expenses ($), Savings Rate (%)',
          'Fixed Recurring Bills Checklist (Bill Name, Due Date, Budgeted, Actual, Paid)',
          'Variable Daily Expense Log (Date, Item, Category, Amount, Payment Method)',
          'Debt Snowball / Savings Goal Visual Progress Thermometer'
        ]
      },
      {
        pageNumber: 9,
        section: '90-Day Goal Achievement Roadmap',
        title: '90-Day Vision & Milestone Breakdown',
        purpose: 'Translate high-level aspirations into actionable 3-phase OKR execution plans.',
        layoutSpecs: 'Top: Primary 90-Day Outcome Goal + Emotional "Why". Body: 3 Milestone checkpoints (Day 30, Day 60, Day 90) with KPI targets and weekly action items.',
        elements: [
          'Primary Goal Declaration with target completion date',
          '"Why This Matters To Me" Core Motivation Box',
          '3 Milestone Cards (Month 1 Foundation, Month 2 Momentum, Month 3 Mastery)',
          'Weekly Action Task Checklist (5 tasks per phase)',
          'Obstacle & Solution Contingency Matrix'
        ]
      },
      {
        pageNumber: 10,
        section: 'Creative Brain Dump & Dot Grid Notes',
        title: 'Ideas, Mind Maps & Dot Grid Notes',
        purpose: 'Unstructured creative thinking, meeting notes, project sketches, and brain dump.',
        layoutSpecs: 'Clean 5mm dot grid across the entire canvas with a subtle minimalist botanical corner motif and header for Date / Subject.',
        elements: [
          'Header: Date, Subject & Project Tag',
          '5mm Light Gray Dot Grid (Vector-rendered, non-intrusive #E0DCD5)',
          'Subtle watermark logo at bottom right',
          'Action Items summary footer'
        ]
      }
    ];

    const googleFlowPrompt =
      `BRAND & PRODUCT BRIEF\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Brand: ${bName} | Niche: ${niche || 'Digital Products'}\n` +
      `Product: ${cleanP}\n` +
      `Target Audience: Women 25–45, professionals, moms & students seeking organisation and clarity\n\n` +
      `VISUAL IDENTITY SYSTEM\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Color Palette:\n` +
      `  • Primary Accent: ${primaryColor}\n` +
      `  • Background / Fill: ${bgTint}\n` +
      `  • Secondary Accent: ${secondaryColor}\n` +
      `  • Highlight: ${highlightColor}\n` +
      `  • Body Text: ${textColor}\n\n` +
      `Typography:\n` +
      `  • Headings & Titles: ${hFont} (Elegant serif — bold, refined)\n` +
      `  • Body & Labels: ${bFont} (Clean, highly legible sans-serif)\n` +
      `  • Accent / Quotes: Cormorant Garamond (Italic — soft and aspirational)\n\n` +
      `Design Style: Minimalist botanical — clean white space, subtle line separators, soft warm tones, premium aesthetic.\n\n` +
      `PAGE-BY-PAGE DESIGN BRIEF\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      pages.map(p =>
        `PAGE ${p.pageNumber} — ${p.title.toUpperCase()}\n` +
        `Purpose: ${p.purpose}\n` +
        `Layout: ${p.layoutSpecs}\n` +
        `Elements to include:\n` +
        p.elements.map(el => `  - ${el}`).join('\n') +
        `\n`
      ).join('\n') +
      `OUTPUT INSTRUCTIONS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Generate each page as a VISUAL DESIGN IMAGE in 3:4 PORTRAIT ASPECT RATIO (matching A4 / US Letter portrait orientation — width:height = 3:4).\n\n` +
      `Process all ${pages.length} pages SEQUENTIALLY, one after the other:\n` +
      pages.map(p => `  Step ${p.pageNumber}: Generate the visual design for Page ${p.pageNumber} — "${p.title}"`).join('\n') + `\n\n` +
      `Design Guidelines per page:\n` +
      `  • Background colour: ${bgTint} (warm cream / off-white)\n` +
      `  • Apply the exact hex colours and font hierarchy from the Visual Identity System above\n` +
      `  • Use clean grid lines, rounded table cells, and minimal botanical corner accents where appropriate\n` +
      `  • All text labels, section headers, and fillable boxes should be clearly visible\n` +
      `  • Make it look like a premium, print-ready planner page — the final output will be imported into PowerPoint for minor adjustments before being exported as a PDF product for Etsy\n` +
      `  • DO NOT add any page numbers or extra borders beyond the design spec\n` +
      `  • Keep the design elegant, aspirational, and true to the ${bName} brand voice: ${voice || 'warm, empowering, and practical'}\n`;

    return {
      productName: cleanP,
      brandName: bName,
      documentSpecs: {
        dimensions: 'US Letter (8.5 x 11 in) / A4 Compatible (300 DPI Vector)',
        margins: '0.5 in (12.7 mm) safe printing zone',
        pageCount: `${pages.length} Core Master Spreads`,
        colorSystem: {
          primaryAccent: primaryColor,
          backgroundTint: bgTint,
          secondaryAccent: secondaryColor,
          highlight: highlightColor,
          darkText: textColor
        },
        typography: {
          headingFont: hFont,
          bodyFont: bFont,
          accentFont: 'Cormorant Garamond (Italic)'
        }
      },
      pageBreakdown: pages,
      googleFlowPrompt,
      storageArchitecture: {
        recommendedPath: `brands/${bName.toLowerCase().replace(/[^a-z0-9]/g, '_')}/${cleanP.toLowerCase().replace(/[^a-z0-9]/g, '_')}/v1.0/deliverable.pdf`,
        fileType: 'PDF (Interactive & Printable)',
        targetFileSize: '3–8 MB'
      },
      antiPiracyDelivery: {
        etsyUploadItem: '1-Page Branded GRO10X Access & License Pass (PDF)',
        deliveryPortalUrl: `https://gro10x-ai.vercel.app/delivery?brand=${encodeURIComponent(bName)}&product=${encodeURIComponent(cleanP)}`,
        watermarkTemplate: `Exclusively Licensed to: [Buyer Name] · Order #[Etsy_Receipt_ID] · License ID: GRO-LIC-XXXX · Personal Use Only · Resale Strictly Prohibited`
      }
    };
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({
      success: true,
      blueprint: generateDeterministicBlueprint(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type),
      generatedBy: 'smart_blueprint_engine'
    });
  }

  const prompt =
    `You are an expert Digital Product Designer for premium Etsy digital downloads.\n` +
    `Generate a comprehensive, page-by-page visual design blueprint for the following product:\n` +
    `Product Name: "${productName}"\n` +
    `Brand: "${brandName}"\n` +
    `Niche: "${brandNiche || 'Digital Products'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, empowering, clear'}"\n` +
    `Color Palette: ${JSON.stringify(paletteArr)}\n` +
    `Typography: "${fontString}"\n` +
    `Format / Category: "${type || 'Digital PDF'}" / "${category || 'General'}"\n\n` +
    `Return strict JSON with:\n` +
    `1. "documentSpecs": { "dimensions", "margins", "pageCount", "colorSystem": { "primaryAccent", "backgroundTint", "secondaryAccent", "highlight", "darkText" }, "typography": { "headingFont", "bodyFont", "accentFont" } }\n` +
    `2. "pageBreakdown": Array of 8-12 objects { "pageNumber", "section", "title", "purpose", "layoutSpecs", "elements" (array of strings) }\n` +
    `3. "googleFlowPrompt": A single copy-ready prompt for Google Flow that describes all pages sequentially. The prompt should instruct Flow to generate each page as a VISUAL DESIGN IMAGE in 3:4 PORTRAIT aspect ratio (like A4/US Letter portrait). Include the brand colors, font names, layout details, and elements for each page. End with an instruction to process all pages one by one sequentially, outputting one visual image per page. Do NOT ask for HTML, CSS, or code.\n\n` +
    `OUTPUT STRICT JSON ONLY. No markdown wrapper or extra text outside JSON.`;

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

    const baseBlueprint = generateDeterministicBlueprint(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type);

    return res.json({
      success: true,
      blueprint: {
        productName: parsed.productName || productName,
        brandName: parsed.brandName || brandName,
        documentSpecs: parsed.documentSpecs || baseBlueprint.documentSpecs,
        pageBreakdown: parsed.pageBreakdown || baseBlueprint.pageBreakdown,
        googleFlowPrompt: parsed.googleFlowPrompt || baseBlueprint.googleFlowPrompt,
        storageArchitecture: baseBlueprint.storageArchitecture,
        antiPiracyDelivery: baseBlueprint.antiPiracyDelivery
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Product Blueprint Gemini Error]:', err.message);
    return res.json({
      success: true,
      blueprint: generateDeterministicBlueprint(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type),
      generatedBy: 'smart_blueprint_engine'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/mockup-prompts — Generates 10 Etsy Listing Image Prompts + 10s Video Prompt
// ─────────────────────────────────────────────────────────────────────────────
router.post('/mockup-prompts', requireAuth, async (req, res) => {
  const { productName, brandName, brandNiche, brandVoice, brandPalette, brandFonts, type, category } = req.body;
  if (!productName || !brandName) {
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

  function generateDeterministicMockups(pName, bName, niche, voice, palette, fonts, pType) {
    const cleanP = pName.replace(/^[A-Z]\d+\s*[-–]\s*/, '');
    const primaryColor = palette[0] || '#8B5A7A';
    const bgTint = palette[1] || '#FAF3E8';
    const secondaryColor = palette[2] || '#7D9B76';
    const highlightColor = palette[3] || '#C4887C';
    const textColor = palette[4] || '#2E2E2E';

    const mockups = [
      {
        number: 1,
        title: 'Hero iPad Lifestyle (Main Etsy Thumbnail)',
        type: 'Primary Listing Hero',
        scene: `Professional studio flat-lay photography of an iPad Pro in portrait orientation displaying the aesthetic digital cover of "${cleanP}" by ${bName}. Resting on a luxurious warm cream (${bgTint}) desk surface alongside a sleek minimalist brass pen, soft botanical eucalyptus branches, and gentle natural morning shadows. 8k, hyper-detailed, clean editorial look.`
      },
      {
        number: 2,
        title: 'Flat Lay Cover & Clean Aesthetics',
        type: 'Cover Showcase',
        scene: `Overhead top-down camera angle of "${cleanP}" digital cover printed on luxury textured matte paper or displayed on a tablet. Bordered with aesthetic lifestyle items in brand colors (${primaryColor}, ${secondaryColor}), soft linen napkin, and neutral ceramic mug. Clean white space, crisp typography in ${fonts}.`
      },
      {
        number: 3,
        title: 'Daily Schedule Page Close-Up with Pen',
        type: 'Feature Deep-Dive',
        scene: `Macro angle angled view of the Daily Focused Execution page from "${cleanP}". A gold pen rests across the 6:00 AM – 9:00 PM hourly schedule box. Clear readable section headers: "Top Priorities", "Eisenhower Matrix", "Water Intake". Soft depth of field, bright warm daylight.`
      },
      {
        number: 4,
        title: 'Weekly Master Spread Open on Desk',
        type: 'Spread View',
        scene: `Two-page open spread of the Weekly Master Plan from "${cleanP}" lying flat on a modern scandinavian oak desk. Coffee cup with latte art in background, reading glasses, pastel highlighter. Clean vertical columns from Monday to Sunday clearly visible.`
      },
      {
        number: 5,
        title: '30-Day Habit Matrix in Active Use',
        type: 'Gamification & Results',
        scene: `High-resolution perspective shot focusing on the 30-Day Habit Matrix page. Several circular check-bubbles are neatly filled in with soft pastel ink (${secondaryColor}), displaying a satisfying streak. Inspiring, motivating, aesthetic productivity aesthetic.`
      },
      {
        number: 6,
        title: 'Hands-in-Frame Writing Lifestyle Shot',
        type: 'Human Connection & Scale',
        scene: `First-person point-of-view photo of a well-manicured female hand holding an elegant fine-tip pen, actively writing notes into the "${cleanP}" planner. Soft knit sweater sleeve, cozy warm morning ambience, diffused window light.`
      },
      {
        number: 7,
        title: '10-Pages Fanned-Out Bundle Showcase',
        type: 'Value & Scope Showcase',
        scene: `All core pages of "${cleanP}" dynamically fanned out in a cascading 3D isometric stack, revealing cover, monthly calendar, daily spread, habit tracker, and budget sheet all together. Badge banner overlay style: "Complete 10-Spread Productivity System".`
      },
      {
        number: 8,
        title: '90-Day Vision & Financial Spread',
        type: 'Transformation & Goals',
        scene: `Clean angled shot of the 90-Day Goal Roadmap and Monthly Cash Flow pages side by side. Professional planner setup with minimal gold paperclips, clean calculator, and motivational quote card. High aspiration value.`
      },
      {
        number: 9,
        title: 'Full Aesthetic Desk Aerial Lifestyle',
        type: 'Aspirational Lifestyle',
        scene: `Wide overhead bird's-eye flat lay of an entire productive desk workspace: planner tablet centered, laptop open with ambient screen, small potted succulent, scented candle, notebook, and ceramic dish. Colors harmonized in ${primaryColor} and ${bgTint}.`
      },
      {
        number: 10,
        title: 'Instant Download & Device Compatibility',
        type: 'Etsy Purchase Reassurance',
        scene: `Clean split-screen graphic displaying a smartphone, iPad tablet with Apple Pencil, and printable A4 paper stack, all showing the matching "${cleanP}" layout. Prominent aesthetic text badge: "Instant Digital Download · GoodNotes · Notability · Print at Home".`
      }
    ];

    const masterMockupPrompt =
      `BRAND & MOCKUP VISUAL BRIEF\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Brand: ${bName} | Niche: ${niche || 'Digital Products'}\n` +
      `Product: ${cleanP}\n` +
      `Brand Colors: Primary ${primaryColor}, Background ${bgTint}, Secondary ${secondaryColor}, Highlight ${highlightColor}, Dark ${textColor}\n` +
      `Typography: ${fonts}\n` +
      `Aesthetic Style: Minimalist botanical luxury, warm natural morning lighting, clean editorial depth.\n\n` +
      `INSTRUCTIONS FOR AI AGENT / GOOGLE FLOW:\n` +
      `Generate 10 distinct, high-converting Etsy listing mockup images in 3:4 PORTRAIT aspect ratio, sequentially one after the other:\n\n` +
      mockups.map(m =>
        `MOCKUP #${m.number} — ${m.title.toUpperCase()} (${m.type})\n` +
        `Scene Description: ${m.scene}\n` +
        `Aspect Ratio: 3:4 Portrait | High resolution 300 DPI vector clarity\n`
      ).join('\n') +
      `\nOUTPUT GUIDELINES:\n` +
      `• Process all 10 mockup scenes one by one in sequence\n` +
      `• Maintain consistent brand color palette (${primaryColor}, ${bgTint}) across all images\n` +
      `• Ensure high-end commercial photo realism with soft natural lighting and realistic props\n`;

    const videoPrompt =
      `🎥 10-SECOND ETSY LISTING VIDEO PROMPT\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tool: Google Flow / Kling AI / Runway Gen-3 / Pika / Sora\n` +
      `Duration: 10 Seconds | Format: 4:5 Portrait (Etsy Video) or 9:16 (Reels/TikTok)\n` +
      `Product: "${cleanP}" by ${bName}\n` +
      `Color Grade: Warm cream tones (${bgTint}), soft mauve accents (${primaryColor}), natural golden hour window light\n` +
      `Music / Audio: Relaxing lo-fi acoustic guitar / soft piano instrumental (no vocals)\n\n` +
      `TIMELINE & SCENE TRANSITIONS (10 SECONDS TOTAL):\n\n` +
      `• [0:00 – 0:02s] SCENE 1 — OPENING HOOK (Slow Gliding Pan):\n` +
      `  Camera smoothly glides over a sunlit minimalist desk with coffee and botanical flowers, landing on the unopened aesthetic cover of "${cleanP}".\n\n` +
      `• [0:02 – 0:04s] SCENE 2 — THE OPENING (Smooth Page Turn):\n` +
      `  A female hand gently turns the cover to reveal the elegant Year-at-a-Glance calendar and Monthly Intentions spread with soft depth of field.\n\n` +
      `• [0:04 – 0:06s] SCENE 3 — CORE SPREADS (Fast Smooth Flip):\n` +
      `  Smooth cinematic page-flip motion displaying the Weekly Master Plan and Daily 6AM–9PM time-blocking spread.\n\n` +
      `• [0:06 – 0:08s] SCENE 4 — INTERACTION & ACTIVE USE (Macro Close-Up):\n` +
      `  Close-up shot of a fine-tip gold pen smoothly ticking a habit check-bubble in the 30-Day Habit Matrix, showing tactile satisfaction and clarity.\n\n` +
      `• [0:08 – 0:10s] SCENE 5 — CALL TO ACTION (Pull-Back & Text Fade):\n` +
      `  Camera pulls back to full styled desk view as elegant serif text fades onto screen: "${cleanP} — Instant Digital Download · GoodNotes & Printable".\n`;

    return {
      productName: cleanP,
      brandName: bName,
      mockups,
      masterMockupPrompt,
      videoPrompt
    };
  }

  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({
      success: true,
      data: generateDeterministicMockups(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type),
      generatedBy: 'smart_mockup_engine'
    });
  }

  const prompt =
    `You are an elite Etsy Product Visualizer and E-commerce Art Director.\n` +
    `Generate 10 distinct Etsy listing mockup photo prompts and a 10-second listing video prompt for:\n` +
    `Product Name: "${productName}"\n` +
    `Brand: "${brandName}"\n` +
    `Niche: "${brandNiche || 'Digital Products'}"\n` +
    `Brand Voice: "${brandVoice || 'Warm, empowering, clear'}"\n` +
    `Color Palette: ${JSON.stringify(paletteArr)}\n` +
    `Typography: "${fontString}"\n` +
    `Format: "${type || 'Digital PDF'}"\n\n` +
    `Return strict JSON with:\n` +
    `1. "mockups": Array of 10 objects { "number", "title", "type", "scene" }\n` +
    `2. "masterMockupPrompt": Single copy-ready master prompt for Google Flow / Midjourney containing all 10 image prompts in sequence (3:4 portrait).\n` +
    `3. "videoPrompt": A 10-second structured video creation prompt broken down by timestamps (0-2s, 2-4s, 4-6s, 6-8s, 8-10s).\n\n` +
    `OUTPUT STRICT JSON ONLY. No markdown wrapper or extra text outside JSON.`;

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

    const baseData = generateDeterministicMockups(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type);

    return res.json({
      success: true,
      data: {
        productName: parsed.productName || productName,
        brandName: parsed.brandName || brandName,
        mockups: parsed.mockups || baseData.mockups,
        masterMockupPrompt: parsed.masterMockupPrompt || baseData.masterMockupPrompt,
        videoPrompt: parsed.videoPrompt || baseData.videoPrompt
      },
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.warn('[Mockup Prompts Gemini Error]:', err.message);
    return res.json({
      success: true,
      data: generateDeterministicMockups(productName, brandName, brandNiche, brandVoice, paletteArr, fontString, type),
      generatedBy: 'smart_mockup_engine'
    });
  }
});

router.get('/status', requireAuth, (req, res) => res.json({ success: true, configured: !!process.env.GEMINI_API_KEY, models: MODELS }));

module.exports = router;
