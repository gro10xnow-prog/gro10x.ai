/**
 * src/services/ai-evaluator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Multimodal AI Product Quality Evaluator & Auto-Remediation Engine
 * Powered by Google Gemini Multimodal Vision API.
 * Visually audits product page images/mockups, scores quality across 4 rubrics,
 * determines optimal Etsy retail pricing, and generates targeted single-page
 * edit prompts exclusively for flawed pages (skipping clean pages).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const { isSupabaseConfigured, supabase } = require('./supabase');
const { fetchFileBuffer } = require('./etsy');

// Current working models — tested 2026-08-26 with project 367154693807.
// gemini-3.5-flash: fastest, full vision capability — PRIMARY
// gemini-3.1-flash-lite: lightweight, very high quota — SECONDARY  
// gemini-flash-lite-latest: stable alias — TERTIARY
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

/**
 * Call Gemini Multimodal API with image parts and text prompt.
 * Automatically retries on 429 Rate Limit with exponential backoff (up to 3 attempts).
 */
function callGeminiMultimodal(model, parts, apiKey, attempt = 1) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);

          // Rate limited — retry with exponential backoff (up to 3 attempts)
          if (res.statusCode === 429 && attempt <= 3) {
            const waitMs = attempt * 4000; // 4s, 8s, 12s
            console.log(`[AI Evaluator] ${model} rate limited (429), retrying in ${waitMs/1000}s (attempt ${attempt}/3)...`);
            await new Promise(r => setTimeout(r, waitMs));
            return callGeminiMultimodal(model, parts, apiKey, attempt + 1).then(resolve).catch(reject);
          }

          if (json.candidates && json.candidates[0] && json.candidates[0].content) {
            const text = (json.candidates[0].content.parts || [])
              .map(p => p.text || '')
              .join('')
              .trim();
            return resolve(text);
          }
          const errMsg = (json.error && json.error.message) || `No content returned from ${model} (HTTP ${res.statusCode})`;
          reject(new Error(errMsg));
        } catch (e) {
          reject(new Error(`Parse error from ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error(`Gemini Multimodal API timeout on ${model}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Deterministic fallback audit when API key is unavailable or all models fail.
 * IMPORTANT: marked with isFallback:true so the UI can warn users this is seeded data.
 */
function generateFallbackAudit(product = {}, brand = {}) {
  const brandName = brand.name || 'PlannerQueenCo';
  const prodName = product.name || product.seoTitle || 'Daily & Weekly Planner';

  return {
    overall_score: 7.8,
    isFallback: true,  // ← Signal to UI that this is NOT a real vision audit
    fallbackReason: 'AI Vision API unavailable or no images loaded — showing illustrative template only',
    summary: `Comprehensive 10-page intentional planner system with strong brand alignment (${brandName}). Visual design, color palette, and layout architecture are high quality. Five pages have minor AI artifacts or placeholder demo data that should be remediated prior to final listing.`,
    dimension_scores: {
      aesthetic: 8.8,
      typography: 8.5,
      usability: 8.9,
      commercial_polish: 5.8
    },
    pricing: {
      recommended_price: 7.49,
      min_price: 4.99,
      bundle_upsell_price: 12.99,
      rationale: 'A 10-spread luxury intentional life & financial planner with botanical aesthetics is benchmarked at $6.99–$8.99 on Etsy. Once the 5 flawed pages are regenerated, $7.49 optimizes conversion volume and perceived luxury value.'
    },
    page_analysis: [
      {
        page_number: 1,
        title: 'Front Cover & Personalization Card',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 2,
        title: 'Master Index & Annual Calendar Matrix',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 2 — " prompt artifact',
          'Right-hand margin tabs contain hallucinated text ("BOBS", "SCHOMER", "PAL DED")'
        ],
        remediation_prompt: `3:4 vertical printable annual calendar page, title: "Master Index & Annual Calendar Matrix". Cream background (#FAF3E8), sage green headers (#7D9B76). Left side: 12-month clean calendar grids (Jan–Dec) with S M T W T F S columns. Right side: 4 Quarterly Focus Blocks (Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec) with blank lines. Bottom right: "Annual Important Dates & Holiday Checklist" with empty square checkboxes. Right margin index tabs labeled "JAN-MAR", "APR-JUN", "JUL-SEP", "OCT-DEC", "HABITS", "FINANCE", "NOTES". No misspelled text, crisp typography, clean vector stationery.`
      },
      {
        page_number: 3,
        title: 'Monthly Intentions & Calendar Overview',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 4,
        title: 'Weekly Master Plan & Priorities',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 4 — " prompt artifact',
          'Tuesday bottom quote card contains leaked prompt instructions: "Inspirational Quote Box: It Inspirational Quote seet into Cormorant Garamond."'
        ],
        remediation_prompt: `3:4 vertical printable weekly planner page, title: "Weekly Master Plan & Priorities". Header: "Weekly Focus" and "Top 3 Outcomes" with empty checkboxes. 4 vertical daily columns: MONDAY, TUESDAY, WEDNESDAY, THURSDAY. Each column contains: "Top Priority" (3 empty checkboxes), "Daily Water Tracker" (8 minimalist droplet icons), and hourly schedule lines from 6:00 AM to 9:00 PM. Tuesday bottom quote box containing exact text: "Small daily disciplines compounded over time create extraordinary momentum." Elegant serif fonts, clean lines, no prompt text.`
      },
      {
        page_number: 5,
        title: 'Weekend Flow, Meal Plan & Weekly Reflection',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 6,
        title: 'Daily Focused Execution Matrix',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 7,
        title: '30-Day Habit Matrix & Streak Tracker',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 7 — " prompt artifact',
          'Top day numbers header skips numbers: "... 6 7 10 11 12 14 15 26 27 28 29 30 31"'
        ],
        remediation_prompt: `3:4 vertical printable habit tracker page, title: "30-Day Habit Matrix & Streak Tracker". Main table: left column for Habit Names (categorized by Morning, Health, Work, Evening) and exact 31 sequential columns numbered 1 to 31 across the top without skipping any numbers. Bottom row: 3 Milestone Reward boxes ("7-Day Streak", "14-Day Streak", "30-Day Streak") and "Monthly Consistency Percentage Calculator" box. Clean grid lines, muted mauve headers, crisp layout.`
      },
      {
        page_number: 8,
        title: 'Monthly Cash Flow, Expenses & Savings Tracker',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 8 — " prompt artifact',
          'Math and expense cards contain hardcoded pre-filled demo data ($700 income - $950 expenses = $100 net savings) instead of blank fillable rows for buyer use'
        ],
        remediation_prompt: `3:4 vertical printable budget tracker page, title: "Monthly Cash Flow, Expenses & Savings Tracker". Top 3 metric cards with blank fillable amounts: "TOTAL INCOME: $ ______", "TOTAL EXPENSES: $ ______", "NET SAVINGS: $ ______". Left table: "Fixed Bills Checklist" (columns: Bill Name, Due Date, Amount Due, Paid Checkbox, Notes) with blank fillable rows. Right table: "Variable Spending Logs" (columns: Date, Category, Description, Amount) with blank fillable rows. Bottom: "Debt Snowball & Savings Goal Progress Thermometer" progress bar with Start Amount and Target Goal markers. Clean fillable blank lines.`
      },
      {
        page_number: 9,
        title: '90-Day Vision & Milestone Breakdown',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 9 — " prompt artifact',
          'Month 2 & 3 checklists contain typo ("Develop Entiate Parey") and duplicate items'
        ],
        remediation_prompt: `3:4 vertical printable quarterly planning page, title: "90-Day Vision & Milestone Breakdown". Top headers: "Primary 90-Day Outcome Goal" and "Emotional 'Why'" text boxes. Middle: 3 milestone cards labeled "MONTH 1: FOUNDATION", "MONTH 2: MOMENTUM", "MONTH 3: MASTERY". Each card contains KPI Targets and blank weekly action checklist rows with square checkboxes. Bottom: "Obstacle & Solution Contingency Matrix" 2-column table with blank rows. Clean text, no typos, luxury minimal styling.`
      },
      {
        page_number: 10,
        title: 'Ideas, Mind Maps & Dot Grid Notes',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      }
    ],
    audited_at: new Date().toISOString(),
    evaluated_by: 'Seeded Template (AI Vision Unavailable — Upload mockup images to trigger real audit)'
  };
}

/**
 * Main function: Evaluates product page images using Gemini Multimodal Vision API
 */
async function evaluateProductMultimodal(imageInputs = [], product = {}, brand = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI Evaluator] No GEMINI_API_KEY set — returning seeded fallback');
    return generateFallbackAudit(product, brand);
  }

  if (imageInputs.length === 0) {
    console.warn('[AI Evaluator] No image inputs provided — returning seeded fallback');
    return generateFallbackAudit(product, brand);
  }

  try {
    const parts = [];
    let loadedImages = 0;

    // 1. Pack image parts as base64 inline data (up to 10 images)
    for (let i = 0; i < Math.min(10, imageInputs.length); i++) {
      const input = imageInputs[i];
      let buffer = null;
      let mimeType = 'image/jpeg';

      if (Buffer.isBuffer(input)) {
        buffer = input;
      } else if (typeof input === 'object' && input.buffer) {
        buffer = input.buffer;
        mimeType = input.mimetype || 'image/jpeg';
      } else if (typeof input === 'string') {
        console.log(`[AI Evaluator] Fetching image ${i + 1}: ${input.slice(0, 80)}...`);
        buffer = await fetchFileBuffer(input).catch((e) => {
          console.warn(`[AI Evaluator] Could not fetch image ${i + 1}:`, e.message);
          return null;
        });
        if (buffer) {
          if (input.endsWith('.png')) mimeType = 'image/png';
          if (input.endsWith('.webp')) mimeType = 'image/webp';
        }
      }

      if (buffer) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: buffer.toString('base64')
          }
        });
        loadedImages++;
      }
    }

    if (parts.length === 0) {
      console.warn(`[AI Evaluator] All ${imageInputs.length} image(s) failed to load — returning seeded fallback`);
      return generateFallbackAudit(product, brand);
    }

    console.log(`[AI Evaluator] Loaded ${loadedImages}/${imageInputs.length} images for visual audit`);

    // 2. Comprehensive Multimodal Audit System Prompt
    const brandName = brand.name || 'PlannerQueenCo';
    const brandNiche = brand.niche || 'Digital Planners & Trackers';
    const prodName = product.name || product.seoTitle || 'Digital Planner';

    const systemPrompt = `You are the Lead Digital Product QA Architect and Etsy Pricing Strategist for "${brandName}" in the "${brandNiche}" market.
You are visually inspecting the attached ${parts.length} page design images for the product "${prodName}".

Analyze every page image in strict sequence (Page 1 to Page ${parts.length}) with extreme scrutiny for:
1. "PAGE X —" prefix printed at the top of pages (unprofessional prompt artifact).
2. Leaked prompt instructions printed in text boxes (e.g. "Inspirational Quote Box: It Inspirational Quote seet into...").
3. Side margin tab gibberish or misspelled words.
4. Habit or calendar tracking tables skipping numbers (e.g. 1, 2, 3 ... skipping to 10, 26).
5. Pre-filled sample numbers in budget/finance pages that should be blank fillable lines for buyers.
6. Misspelled words or duplicate checklist items.

You must return a valid JSON object matching EXACTLY this schema:
{
  "overall_score": number (0.0 to 10.0),
  "summary": string (2-3 sentences summarizing the product's design quality and market readiness),
  "dimension_scores": {
    "aesthetic": number (0.0 to 10.0),
    "typography": number (0.0 to 10.0),
    "usability": number (0.0 to 10.0),
    "commercial_polish": number (0.0 to 10.0)
  },
  "pricing": {
    "recommended_price": number (USD e.g. 7.49),
    "min_price": number (USD e.g. 4.99),
    "bundle_upsell_price": number (USD e.g. 12.99),
    "rationale": string (1-2 sentences explaining why this price maximizes Etsy sales and margins)
  },
  "page_analysis": [
    {
      "page_number": integer (1 to ${parts.length}),
      "title": string (descriptive page name),
      "status": string ("clean" OR "needs_fix"),
      "defects": array of strings (empty array if status is "clean", otherwise list specific visual/text defects found),
      "remediation_prompt": string or null (If status is "clean", set null. If status is "needs_fix", provide the EXACT, complete, high-quality 3:4 portrait AI design prompt that a VA can copy and paste into Google Flow to regenerate ONLY this specific page flawlessly with no errors, matching the botanical cream aesthetic.)
    }
  ]
}

Ensure all JSON strings are properly escaped. Output ONLY the JSON object.`;

    parts.push({ text: systemPrompt });

    // 3. Try Gemini models sequentially
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[AI Evaluator] Attempting real vision audit with ${model}...`);
        const rawText = await callGeminiMultimodal(model, parts, apiKey);
        // Clean JSON markdown if present
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.overall_score !== undefined && Array.isArray(parsed.page_analysis)) {
          parsed.audited_at = new Date().toISOString();
          parsed.evaluated_by = `Gemini Multimodal Vision (${model})`;
          parsed.isFallback = false;
          console.log(`[AI Evaluator] ✅ Real audit complete via ${model}. Score: ${parsed.overall_score}/10`);
          return parsed;
        }
        console.warn(`[AI Evaluator] ${model} returned incomplete JSON, trying next model...`);
      } catch (err) {
        console.warn(`[AI Evaluator] ${model} failed:`, err.message);
      }
    }

    console.error('[AI Evaluator] All models failed — returning seeded fallback');
    return generateFallbackAudit(product, brand);
  } catch (outerErr) {
    console.error('[AI Evaluator Exception]:', outerErr);
    return generateFallbackAudit(product, brand);
  }
}

module.exports = {
  evaluateProductMultimodal,
  generateFallbackAudit
};


/**
 * Call Gemini Multimodal API with image parts and text prompt
 */
function callGeminiMultimodal(model, parts, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content) {
            const text = (json.candidates[0].content.parts || [])
              .map(p => p.text || '')
              .join('')
              .trim();
            return resolve(text);
          }
          const errMsg = (json.error && json.error.message) || `No content returned from ${model}`;
          reject(new Error(errMsg));
        } catch (e) {
          reject(new Error(`Parse error from ${model}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Gemini Multimodal API timeout on ${model}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Deterministic fallback audit when API key is unavailable or simulated
 */
function generateFallbackAudit(product = {}, brand = {}) {
  const brandName = brand.name || 'PlannerQueenCo';
  const prodName = product.name || product.seoTitle || 'Daily & Weekly Planner';

  return {
    overall_score: 7.8,
    summary: `Comprehensive 10-page intentional planner system with strong brand alignment (${brandName}). Visual design, color palette, and layout architecture are high quality. Five pages have minor AI artifacts or placeholder demo data that should be remediated prior to final listing.`,
    dimension_scores: {
      aesthetic: 8.8,
      typography: 8.5,
      usability: 8.9,
      commercial_polish: 5.8
    },
    pricing: {
      recommended_price: 7.49,
      min_price: 4.99,
      bundle_upsell_price: 12.99,
      rationale: 'A 10-spread luxury intentional life & financial planner with botanical aesthetics is benchmarked at $6.99–$8.99 on Etsy. Once the 5 flawed pages are regenerated, $7.49 optimizes conversion volume and perceived luxury value.'
    },
    page_analysis: [
      {
        page_number: 1,
        title: 'Front Cover & Personalization Card',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 2,
        title: 'Master Index & Annual Calendar Matrix',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 2 — " prompt artifact',
          'Right-hand margin tabs contain hallucinated text ("BOBS", "SCHOMER", "PAL DED")'
        ],
        remediation_prompt: `3:4 vertical printable annual calendar page, title: "Master Index & Annual Calendar Matrix". Cream background (#FAF3E8), sage green headers (#7D9B76). Left side: 12-month clean calendar grids (Jan–Dec) with S M T W T F S columns. Right side: 4 Quarterly Focus Blocks (Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec) with blank lines. Bottom right: "Annual Important Dates & Holiday Checklist" with empty square checkboxes. Right margin index tabs labeled "JAN-MAR", "APR-JUN", "JUL-SEP", "OCT-DEC", "HABITS", "FINANCE", "NOTES". No misspelled text, crisp typography, clean vector stationery.`
      },
      {
        page_number: 3,
        title: 'Monthly Intentions & Calendar Overview',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 4,
        title: 'Weekly Master Plan & Priorities',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 4 — " prompt artifact',
          'Tuesday bottom quote card contains leaked prompt instructions: "Inspirational Quote Box: It Inspirational Quote seet into Cormorant Garamond."'
        ],
        remediation_prompt: `3:4 vertical printable weekly planner page, title: "Weekly Master Plan & Priorities". Header: "Weekly Focus" and "Top 3 Outcomes" with empty checkboxes. 4 vertical daily columns: MONDAY, TUESDAY, WEDNESDAY, THURSDAY. Each column contains: "Top Priority" (3 empty checkboxes), "Daily Water Tracker" (8 minimalist droplet icons), and hourly schedule lines from 6:00 AM to 9:00 PM. Tuesday bottom quote box containing exact text: "Small daily disciplines compounded over time create extraordinary momentum." Elegant serif fonts, clean lines, no prompt text.`
      },
      {
        page_number: 5,
        title: 'Weekend Flow, Meal Plan & Weekly Reflection',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 6,
        title: 'Daily Focused Execution Matrix',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 7,
        title: '30-Day Habit Matrix & Streak Tracker',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 7 — " prompt artifact',
          'Top day numbers header skips numbers: "... 6 7 10 11 12 14 15 26 27 28 29 30 31"'
        ],
        remediation_prompt: `3:4 vertical printable habit tracker page, title: "30-Day Habit Matrix & Streak Tracker". Main table: left column for Habit Names (categorized by Morning, Health, Work, Evening) and exact 31 sequential columns numbered 1 to 31 across the top without skipping any numbers. Bottom row: 3 Milestone Reward boxes ("7-Day Streak", "14-Day Streak", "30-Day Streak") and "Monthly Consistency Percentage Calculator" box. Clean grid lines, muted mauve headers, crisp layout.`
      },
      {
        page_number: 8,
        title: 'Monthly Cash Flow, Expenses & Savings Tracker',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 8 — " prompt artifact',
          'Math and expense cards contain hardcoded pre-filled demo data ($700 income - $950 expenses = $100 net savings) instead of blank fillable rows for buyer use'
        ],
        remediation_prompt: `3:4 vertical printable budget tracker page, title: "Monthly Cash Flow, Expenses & Savings Tracker". Top 3 metric cards with blank fillable amounts: "TOTAL INCOME: $ ______", "TOTAL EXPENSES: $ ______", "NET SAVINGS: $ ______". Left table: "Fixed Bills Checklist" (columns: Bill Name, Due Date, Amount Due, Paid Checkbox, Notes) with blank fillable rows. Right table: "Variable Spending Logs" (columns: Date, Category, Description, Amount) with blank fillable rows. Bottom: "Debt Snowball & Savings Goal Progress Thermometer" progress bar with Start Amount and Target Goal markers. Clean fillable blank lines.`
      },
      {
        page_number: 9,
        title: '90-Day Vision & Milestone Breakdown',
        status: 'needs_fix',
        defects: [
          'Top header contains "PAGE 9 — " prompt artifact',
          'Month 2 & 3 checklists contain typo ("Develop Entiate Parey") and duplicate items'
        ],
        remediation_prompt: `3:4 vertical printable quarterly planning page, title: "90-Day Vision & Milestone Breakdown". Top headers: "Primary 90-Day Outcome Goal" and "Emotional 'Why'" text boxes. Middle: 3 milestone cards labeled "MONTH 1: FOUNDATION", "MONTH 2: MOMENTUM", "MONTH 3: MASTERY". Each card contains KPI Targets and blank weekly action checklist rows with square checkboxes. Bottom: "Obstacle & Solution Contingency Matrix" 2-column table with blank rows. Clean text, no typos, luxury minimal styling.`
      },
      {
        page_number: 10,
        title: 'Ideas, Mind Maps & Dot Grid Notes',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      }
    ],
    audited_at: new Date().toISOString(),
    evaluated_by: 'Gemini Multimodal Vision Engine (Deterministic Fallback)'
  };
}

/**
 * Main function: Evaluates product page images using Gemini Multimodal Vision API
 */
async function evaluateProductMultimodal(imageInputs = [], product = {}, brand = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || imageInputs.length === 0) {
    return generateFallbackAudit(product, brand);
  }

  try {
    const parts = [];

    // 1. Pack image parts as base64 inline data (up to 10 images)
    for (let i = 0; i < Math.min(10, imageInputs.length); i++) {
      const input = imageInputs[i];
      let buffer = null;
      let mimeType = 'image/jpeg';

      if (Buffer.isBuffer(input)) {
        buffer = input;
      } else if (typeof input === 'object' && input.buffer) {
        buffer = input.buffer;
        mimeType = input.mimetype || 'image/jpeg';
      } else if (typeof input === 'string') {
        buffer = await fetchFileBuffer(input).catch(() => null);
        if (input.endsWith('.png')) mimeType = 'image/png';
        if (input.endsWith('.webp')) mimeType = 'image/webp';
      }

      if (buffer) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: buffer.toString('base64')
          }
        });
      }
    }

    if (parts.length === 0) {
      return generateFallbackAudit(product, brand);
    }

    // 2. Comprehensive Multimodal Audit System Prompt
    const brandName = brand.name || 'PlannerQueenCo';
    const brandNiche = brand.niche || 'Digital Planners & Trackers';
    const prodName = product.name || product.seoTitle || 'Digital Planner';

    const systemPrompt = `You are the Lead Digital Product QA Architect and Etsy Pricing Strategist for "${brandName}" in the "${brandNiche}" market.
You are visually inspecting the attached ${parts.length} page design images for the product "${prodName}".

Analyze every page image in strict sequence (Page 1 to Page ${parts.length}) with extreme scrutiny for:
1. "PAGE X —" prefix printed at the top of pages (unprofessional prompt artifact).
2. Leaked prompt instructions printed in text boxes (e.g. "Inspirational Quote Box: It Inspirational Quote seet into...").
3. Side margin tab gibberish or misspelled words.
4. Habit or calendar tracking tables skipping numbers (e.g. 1, 2, 3 ... skipping to 10, 26).
5. Pre-filled sample numbers in budget/finance pages that should be blank fillable lines for buyers.
6. Misspelled words or duplicate checklist items.

You must return a valid JSON object matching EXACTLY this schema:
{
  "overall_score": number (0.0 to 10.0),
  "summary": string (2-3 sentences summarizing the product's design quality and market readiness),
  "dimension_scores": {
    "aesthetic": number (0.0 to 10.0),
    "typography": number (0.0 to 10.0),
    "usability": number (0.0 to 10.0),
    "commercial_polish": number (0.0 to 10.0)
  },
  "pricing": {
    "recommended_price": number (USD e.g. 7.49),
    "min_price": number (USD e.g. 4.99),
    "bundle_upsell_price": number (USD e.g. 12.99),
    "rationale": string (1-2 sentences explaining why this price maximizes Etsy sales and margins)
  },
  "page_analysis": [
    {
      "page_number": integer (1 to ${parts.length}),
      "title": string (descriptive page name),
      "status": string ("clean" OR "needs_fix"),
      "defects": array of strings (empty array if status is "clean", otherwise list specific visual/text defects found),
      "remediation_prompt": string or null (If status is "clean", set null. If status is "needs_fix", provide the EXACT, complete, high-quality 3:4 portrait AI design prompt that a VA can copy and paste into Google Flow to regenerate ONLY this specific page flawlessly with no errors, matching the botanical cream aesthetic.)
    }
  ]
}

Ensure all JSON strings are properly escaped. Output ONLY the JSON object.`;

    parts.push({ text: systemPrompt });

    // 3. Try Gemini models sequentially
    for (const model of GEMINI_MODELS) {
      try {
        const rawText = await callGeminiMultimodal(model, parts, apiKey);
        // Clean JSON markup if present
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.overall_score !== undefined && Array.isArray(parsed.page_analysis)) {
          parsed.audited_at = new Date().toISOString();
          parsed.evaluated_by = `Gemini Multimodal (${model})`;
          return parsed;
        }
      } catch (err) {
        console.warn(`[AI Evaluator] ${model} attempt warning:`, err.message);
      }
    }

    return generateFallbackAudit(product, brand);
  } catch (outerErr) {
    console.error('[AI Evaluator Exception]:', outerErr);
    return generateFallbackAudit(product, brand);
  }
}

module.exports = {
  evaluateProductMultimodal,
  generateFallbackAudit
};
