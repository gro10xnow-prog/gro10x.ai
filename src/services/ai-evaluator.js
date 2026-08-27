/**
 * src/services/ai-evaluator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Multimodal AI Product Quality Evaluator & Auto-Remediation Engine
 * Powered by Google Gemini Multimodal Vision API.
 * 
 * Supports both:
 * 1. Native Multi-Page PDF Deliverables (application/pdf) from Product Vault
 * 2. High-Resolution Page Images & Listing Mockups (image/png, image/jpeg, image/webp)
 * 
 * Visually audits product pages in exact sequence, scores quality across 4 rubrics,
 * determines optimal Etsy retail pricing, and generates targeted single-page
 * edit prompts exclusively for flawed pages (skipping clean pages).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const { isSupabaseConfigured, supabase } = require('./supabase');
const { fetchFileBuffer } = require('./etsy');

// Current working models — tested with project 367154693807
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

/**
 * Call Gemini Multimodal API with content parts and text prompt.
 * Automatically retries on 429 Rate Limit with exponential backoff (up to 3 attempts).
 */
function callGeminiMultimodal(model, parts, apiKey, attempt = 1) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 4000,
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
          // Handle rate limit
          if (res.statusCode === 429 && attempt <= 3) {
            const waitMs = attempt * 4000;
            console.log(`[AI Evaluator] ${model} rate limited (429), retrying in ${waitMs / 1000}s (attempt ${attempt}/3)...`);
            await new Promise(r => setTimeout(r, waitMs));
            return callGeminiMultimodal(model, parts, apiKey, attempt + 1).then(resolve).catch(reject);
          }

          const json = JSON.parse(data);

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
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error(`Gemini Multimodal API timeout on ${model}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Deterministic fallback audit when API key is unavailable or all models fail.
 */
function generateFallbackAudit(product = {}, brand = {}) {
  const brandName = brand.name || 'PlannerQueenGro';
  const prodName = product.name || product.seoTitle || 'Daily & Weekly Planner';

  return {
    overall_score: 7.8,
    isFallback: true,
    fallbackReason: 'AI Vision API unavailable or document could not be loaded — showing illustrative template',
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
      rationale: 'A 10-spread luxury intentional life & financial planner with botanical aesthetics is benchmarked at $6.99–$8.99 on Etsy. Once flawed pages are regenerated, $7.49 optimizes conversion volume and perceived luxury value.'
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
        remediation_prompt: `CRITICAL CORRECTIONS & FIXES REQUIRED:
• Remove any "PAGE 2 —" prefix from top header
• Replace tab gibberish with exact crisp text: "JAN-MAR", "APR-JUN", "JUL-SEP", "OCT-DEC", "HABITS", "FINANCE", "NOTES"

TARGETED REDESIGN PROMPT:
3:4 vertical printable annual calendar page, title: "Master Index & Annual Calendar Matrix". Cream background (#FAF3E8), sage green headers (#7D9B76). Left side: 12-month clean calendar grids (Jan–Dec) with S M T W T F S columns. Right side: 4 Quarterly Focus Blocks (Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec) with blank lines. Bottom right: "Annual Important Dates & Holiday Checklist" with empty square checkboxes. Right margin index tabs labeled "JAN-MAR", "APR-JUN", "JUL-SEP", "OCT-DEC", "HABITS", "FINANCE", "NOTES". No misspelled text, crisp typography, clean vector stationery.`
      },
      {
        page_number: 3,
        title: 'Weekly Master Plan & Priorities',
        status: 'needs_fix',
        defects: [
          'Tuesday bottom quote card contains leaked prompt instructions: "Inspirational Quote Box: It Inspirational Quote seet into Cormorant Garamond."'
        ],
        remediation_prompt: `CRITICAL CORRECTIONS & FIXES REQUIRED:
• Tuesday quote card MUST contain ONLY the exact quote: "Small daily disciplines compounded over time create extraordinary momentum."
• Remove all leaked prompt text, font names, and metadata from design elements.

TARGETED REDESIGN PROMPT:
3:4 vertical printable weekly planner page, title: "Weekly Master Plan & Priorities". Header: "Weekly Focus" and "Top 3 Outcomes" with empty checkboxes. 4 vertical daily columns: MONDAY, TUESDAY, WEDNESDAY, THURSDAY. Each column contains: "Top Priority" (3 empty checkboxes), "Daily Water Tracker" (8 minimalist droplet icons), and hourly schedule lines from 6:00 AM to 9:00 PM. Tuesday bottom quote box containing exact text: "Small daily disciplines compounded over time create extraordinary momentum." Elegant serif fonts, clean lines, no prompt text.`
      },
      {
        page_number: 4,
        title: 'Monthly Intentions & Calendar Overview',
        status: 'clean',
        defects: [],
        remediation_prompt: null
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
        title: 'Monthly Cash Flow, Expenses & Savings Tracker',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 8,
        title: '30-Day Habit Matrix & Streak Tracker',
        status: 'needs_fix',
        defects: [
          'Top day numbers header skips numbers: "... 6 7 10 11 12 14 15 26 27 28 29 30 31"'
        ],
        remediation_prompt: `CRITICAL CORRECTIONS & FIXES REQUIRED:
• Column numbers MUST be strictly sequential from 1 through 31 without any skipping or repeating numbers (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31).

TARGETED REDESIGN PROMPT:
3:4 vertical printable habit tracker page, title: "30-Day Habit Matrix & Streak Tracker". Main table: left column for Habit Names (categorized by Morning, Health, Work, Evening) and exact 31 sequential columns numbered 1 to 31 across the top without skipping any numbers. Bottom row: 3 Milestone Reward boxes ("7-Day Streak", "14-Day Streak", "30-Day Streak") and "Monthly Consistency Percentage Calculator" box. Clean grid lines, muted mauve headers, crisp layout.`
      },
      {
        page_number: 9,
        title: 'Ideas, Mind Maps & Dot Grid Notes',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      },
      {
        page_number: 10,
        title: '90-Day Vision & Milestone Breakdown',
        status: 'clean',
        defects: [],
        remediation_prompt: null
      }
    ],
    audited_at: new Date().toISOString(),
    evaluated_by: 'Seeded Template (AI Vision Unavailable — Upload Vault PDF or Mockups to trigger live audit)'
  };
}

/**
 * Main function: Evaluates product deliverable (PDF or image pages) using Gemini Multimodal Vision API
 */
async function evaluateProductMultimodal(inputs = [], product = {}, brand = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI Evaluator] No GEMINI_API_KEY set — returning seeded fallback');
    return generateFallbackAudit(product, brand);
  }

  if (!inputs || inputs.length === 0) {
    console.warn('[AI Evaluator] No inputs provided — returning seeded fallback');
    return generateFallbackAudit(product, brand);
  }

  try {
    const parts = [];
    let isPdfDocument = false;
    let loadedCount = 0;

    // Process inputs (PDF deliverable or array of image buffers/paths)
    for (let i = 0; i < Math.min(10, inputs.length); i++) {
      const input = inputs[i];
      let buffer = null;
      let mimeType = 'image/jpeg';

      if (Buffer.isBuffer(input)) {
        buffer = input;
        if (buffer.slice(0, 4).toString() === '%PDF') {
          mimeType = 'application/pdf';
          isPdfDocument = true;
        }
      } else if (typeof input === 'object' && input.buffer) {
        buffer = input.buffer;
        mimeType = input.mimetype || (buffer.slice(0, 4).toString() === '%PDF' ? 'application/pdf' : 'image/jpeg');
        if (mimeType === 'application/pdf') isPdfDocument = true;
      } else if (typeof input === 'object' && (input.storagePath || input.url)) {
        const filePath = input.storagePath || input.url;
        console.log(`[AI Evaluator] Fetching vault/mockup asset: ${filePath.slice(0, 80)}...`);
        buffer = await fetchFileBuffer(filePath).catch(e => {
          console.warn('[AI Evaluator] Could not fetch asset buffer:', e.message);
          return null;
        });
        if (buffer) {
          if (filePath.toLowerCase().endsWith('.pdf') || (input.fileFormat || '').toUpperCase() === 'PDF' || buffer.slice(0, 4).toString() === '%PDF') {
            mimeType = 'application/pdf';
            isPdfDocument = true;
          } else if (filePath.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          } else if (filePath.toLowerCase().endsWith('.webp')) {
            mimeType = 'image/webp';
          }
        }
      } else if (typeof input === 'string') {
        console.log(`[AI Evaluator] Fetching string path/URL: ${input.slice(0, 80)}...`);
        buffer = await fetchFileBuffer(input).catch(e => {
          console.warn('[AI Evaluator] Could not fetch buffer:', e.message);
          return null;
        });
        if (buffer) {
          if (input.toLowerCase().endsWith('.pdf') || buffer.slice(0, 4).toString() === '%PDF') {
            mimeType = 'application/pdf';
            isPdfDocument = true;
          } else if (input.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          } else if (input.toLowerCase().endsWith('.webp')) {
            mimeType = 'image/webp';
          }
        }
      }

      if (buffer) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: buffer.toString('base64')
          }
        });
        loadedCount++;
        // If we found a PDF document, it already contains all pages, so one part is sufficient
        if (isPdfDocument) break;
      }
    }

    if (parts.length === 0) {
      console.warn('[AI Evaluator] All inputs failed to load — returning seeded fallback');
      return generateFallbackAudit(product, brand);
    }

    console.log(`[AI Evaluator] Successfully loaded ${isPdfDocument ? 'Native PDF Document' : `${loadedCount} Page Images`} for visual audit`);

    // Build Multimodal Prompt tailored to PDF or Image sequence
    const brandName = brand.name || 'PlannerQueenGro';
    const brandNiche = brand.niche || 'Digital Planners & Trackers';
    const prodName = product.name || product.seoTitle || 'Digital Planner';

    const systemPrompt = isPdfDocument ? `
You are the Lead Digital Product QA Architect and Etsy Pricing Strategist for "${brandName}" in the "${brandNiche}" market.
You are visually inspecting the attached multi-page PDF deliverable document for "${prodName}".

Carefully inspect EVERY SINGLE PAGE of the PDF from Page 1 to the final page in strict sequential order.
For each page:
1. Read the exact printed page title (e.g. "Cover Page", "Master Index & Annual Calendar Matrix", "Weekly Master Plan & Priorities", etc.).
2. Visually scrutinize the layout, typography, calendar dates, grid columns, tables, headers, and text boxes for:
   - "PAGE X —" prefix printed at the top of pages (unprofessional prompt artifact).
   - Leaked prompt instructions printed in text boxes (e.g. "Inspirational quote is are in consectentr...").
   - Calendar grids with incorrect/skipping days or bad dates.
   - Side margin tabs with gibberish or misspelled text.
   - Habit tracker tables skipping numbers (e.g. 1 2 3 ... 26 29 30 31).
   - Pre-filled sample numbers in budget/finance pages that should be blank fillable lines for buyers.
   - Any typos or duplicate checklist items.

You must return a valid JSON object matching EXACTLY this schema:
{
  "overall_score": number (0.0 to 10.0),
  "summary": string (2-3 sentences summarizing the product design quality and commercial readiness),
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
    "rationale": string (1-2 sentences explaining pricing rationale)
  },
  "page_analysis": [
    {
      "page_number": integer (exact 1-indexed PDF page number: 1, 2, 3, etc.),
      "title": string (the exact title found on this PDF page),
      "status": string ("clean" OR "needs_fix"),
      "defects": array of strings (empty array if clean, otherwise specific defects found on this exact page),
      "remediation_prompt": string or null (If clean, null. If needs_fix, provide the prompt formatted as: "CRITICAL CORRECTIONS & FIXES REQUIRED:\n• [list each defect to avoid/fix]\n\nTARGETED REDESIGN PROMPT:\n[exact 3:4 portrait AI design prompt to regenerate ONLY this specific page flawlessly with no errors, matching the botanical cream aesthetic.]")
    }
  ]
}

Ensure all JSON strings are properly escaped. Output ONLY the JSON object.
` : `
You are the Lead Digital Product QA Architect and Etsy Pricing Strategist for "${brandName}" in the "${brandNiche}" market.
You are visually inspecting the attached ${parts.length} page design images for "${prodName}".

Analyze every page image in strict sequence (Page 1 to Page ${parts.length}) with extreme scrutiny for:
1. "PAGE X —" prefix printed at the top of pages.
2. Leaked prompt instructions printed in text boxes.
3. Side margin tab gibberish or misspelled words.
4. Habit or calendar tracking tables skipping numbers.
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
      "defects": array of strings (empty array if clean, otherwise list specific visual/text defects found),
      "remediation_prompt": string or null (If clean, null. If needs_fix, provide the prompt formatted as: "CRITICAL CORRECTIONS & FIXES REQUIRED:\n• [list each defect to avoid/fix]\n\nTARGETED REDESIGN PROMPT:\n[exact 3:4 portrait AI design prompt to regenerate ONLY this specific page flawlessly.]")
    }
  ]
}

Ensure all JSON strings are properly escaped. Output ONLY the JSON object.
`;

    parts.push({ text: systemPrompt });

    // Try Gemini models sequentially
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[AI Evaluator] Attempting real vision audit with ${model} on ${isPdfDocument ? 'PDF' : 'Images'}...`);
        const rawText = await callGeminiMultimodal(model, parts, apiKey);
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.overall_score !== undefined && Array.isArray(parsed.page_analysis)) {
          parsed.audited_at = new Date().toISOString();
          parsed.evaluated_by = `Gemini Multimodal Vision (${model} · ${isPdfDocument ? 'Native Vault PDF' : 'Listing Mockups'})`;
          parsed.isFallback = false;
          parsed.documentType = isPdfDocument ? 'pdf_vault' : 'mockup_images';
          console.log(`[AI Evaluator] ✅ Real audit complete via ${model}. Score: ${parsed.overall_score}/10 on ${parsed.page_analysis.length} pages.`);
          return parsed;
        }
        console.warn(`[AI Evaluator] ${model} returned incomplete JSON structure, trying next model...`);
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
