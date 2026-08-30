/**
 * src/services/gig-generator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS AI Marketplace Gig Generator & 10-Point Health Check Engine.
 * Generates platform-compliant, high-converting Fiverr and Upwork gig packages
 * using Google Gemini AI, with automatic validation against 10 marketplace rules.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const { DEFAULT_SERVICES } = require('../constants/services');

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest'];

/**
 * 10-Point Gig Health Check Engine
 * Evaluates gig compliance against marketplace algorithms and GRO10X standards.
 */
function validateGigHealth(gig = {}) {
  const checks = [];

  // Rule 1: Title starts with "I will"
  const title = (gig.title || '').trim();
  const startsWithIWill = /^i\s+will\b/i.test(title);
  checks.push({
    rule: "Title starts with 'I will'",
    passed: startsWithIWill,
    message: startsWithIWill ? 'Valid title format.' : "Title must start with 'I will'."
  });

  // Rule 2: Title character length between 25 and 80 chars
  const titleLen = title.length;
  const titleLenOk = titleLen >= 25 && titleLen <= 80;
  checks.push({
    rule: 'Title length between 25-80 chars',
    passed: titleLenOk,
    message: titleLenOk ? `Title is ${titleLen} chars.` : `Title length is ${titleLen} chars (expected 25-80).`
  });

  // Rule 3: Exactly 5 search tags (each <= 20 chars)
  const tags = Array.isArray(gig.tags) ? gig.tags : [];
  const tagsCountOk = tags.length === 5;
  const tagsLenOk = tags.every(t => typeof t === 'string' && t.trim().length > 0 && t.trim().length <= 20);
  const tagsPassed = tagsCountOk && tagsLenOk;
  checks.push({
    rule: 'Exactly 5 keyword search tags (<= 20 chars each)',
    passed: tagsPassed,
    message: tagsPassed ? '5 valid keyword tags provided.' : `Found ${tags.length} tags (exactly 5 required, <= 20 chars each).`
  });

  // Rule 4: Description length between 800 and 1,250 characters
  const desc = (gig.description || '').trim();
  const descLen = desc.length;
  const descLenOk = descLen >= 800 && descLen <= 1250;
  checks.push({
    rule: 'Description length between 800-1250 chars',
    passed: descLenOk,
    message: descLenOk ? `Description length: ${descLen} chars.` : `Description length is ${descLen} chars (expected 800-1250).`
  });

  // Rule 5: No explicit pricing / dollar amounts in description body (Fiverr TOS)
  const hasPricingInDesc = /\$\d+|\b\d+\s*(usd|dollars|bucks)\b/i.test(desc);
  checks.push({
    rule: 'No pricing amounts in description body',
    passed: !hasPricingInDesc,
    message: !hasPricingInDesc ? 'No dollar amounts in description body.' : 'Description contains explicit pricing numbers (violates Fiverr TOS).'
  });

  // Rule 6: No competitor platform mentions (e.g. mentioning Upwork on a Fiverr gig)
  const competitorRegex = /\b(upwork|freelancer\.com|toptal|fiverr\.com)\b/i;
  const hasCompetitor = competitorRegex.test(desc) || competitorRegex.test(title);
  checks.push({
    rule: 'No competitor platform mentions',
    passed: !hasCompetitor,
    message: !hasCompetitor ? 'Compliant with marketplace TOS.' : 'Found mentions of competitor platforms.'
  });

  // Rule 7: At least 4 FAQs with thorough answers
  const faqs = Array.isArray(gig.faq) ? gig.faq : [];
  const faqCountOk = faqs.length >= 4;
  const faqQualityOk = faqs.every(f => (f.q || '').length >= 10 && (f.a || '').length >= 25);
  const faqPassed = faqCountOk && faqQualityOk;
  checks.push({
    rule: 'At least 4 comprehensive FAQs',
    passed: faqPassed,
    message: faqPassed ? `${faqs.length} detailed FAQ pairs provided.` : `Found ${faqs.length} FAQs (minimum 4 detailed Q&As required).`
  });

  // Rule 8: Rapid Delivery Speed (Basic tier <= 5 days)
  const basicDelivery = gig.pricing?.basic?.deliveryDays || 0;
  const deliverySpeedOk = basicDelivery > 0 && basicDelivery <= 5;
  checks.push({
    rule: 'Rapid delivery turnaround (Basic tier <= 5 days)',
    passed: deliverySpeedOk,
    message: deliverySpeedOk ? `Basic tier turnaround: ${basicDelivery} day(s).` : `Basic turnaround is ${basicDelivery} days (expected <= 5 days for speed advantage).`
  });

  // Rule 9: Buyer onboarding requirements (at least 3 questions)
  const reqs = Array.isArray(gig.buyerRequirements) ? gig.buyerRequirements : [];
  const reqsOk = reqs.length >= 3 && reqs.every(r => (r || '').trim().length >= 10);
  checks.push({
    rule: 'At least 3 clear buyer onboarding requirements',
    passed: reqsOk,
    message: reqsOk ? `${reqs.length} onboarding requirements provided.` : `Found ${reqs.length} requirements (minimum 3 required).`
  });

  // Rule 10: Verified GRO10X tech stack only (No unspecialized tools)
  const unverifiedStackRegex = /\b(comfyui|midjourney|stable diffusion|make\.com)\b/i;
  const hasUnverifiedStack = unverifiedStackRegex.test(desc) || unverifiedStackRegex.test(title);
  checks.push({
    rule: 'Verified GRO10X capability stack only',
    passed: !hasUnverifiedStack,
    message: !hasUnverifiedStack ? 'All referenced tools are within verified stack.' : 'Contains unspecialized legacy tools.'
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = passedCount;
  const passed = score >= 9;

  return {
    score,
    passed,
    checks
  };
}

/**
 * Low-level Gemini API request wrapper
 */
function callGemini(model, prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            const rawText = (parsed.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
            return resolve(rawText);
          }
          const errDetail = (parsed.error && parsed.error.message) || 'No candidates returned';
          reject(new Error(`[Gemini Error ${model}]: ${errDetail}`));
        } catch (e) {
          reject(new Error(`[Gemini Parse Error ${model}]: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`[Gemini Timeout ${model}]: Request exceeded 8s`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Crafts the prompt and generates a marketplace gig pack with Gemini
 */
async function generateGigWithAI({ serviceId, gigIndex = 1, accountId = 'ACC-TECH-001', customPrompt = '' }) {
  const service = DEFAULT_SERVICES.find(s => s.id === serviceId) || {
    id: serviceId || 'SVC-CUSTOM',
    title: 'Custom Engineering & Web App Service',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    description: 'Rapid sprint-based software and AI engineering deliverables.',
    features: ['Modern Node.js Architecture', 'Responsive UI', 'Live Cloud Hosting', 'Fast Turnaround']
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    const prompt = `You are an elite Top-Rated Fiverr and Upwork copywriter and digital agency growth architect for "GRO10X AI Agency".
Generate a complete, high-converting Fiverr gig package for our service:

Service ID: ${service.id}
Service Title: ${service.title}
Category: ${service.categoryName} (${service.category})
Service Description: ${service.description}
Service Key Features: ${(service.features || []).join(', ')}
${customPrompt ? `Special Custom Instructions: ${customPrompt}` : ''}

CRITICAL POSITIONING & RULES:
1. Title MUST start with "I will " and be between 40 and 75 characters.
2. Emphasize SPEED & EXECUTION OUTCOME ("in 48 hours", "rapid sprint", "days not months").
3. DO NOT include dollar signs or prices in the main description (Fiverr TOS violation).
4. Description MUST be formatted cleanly with bullet points and be between 900 and 1,150 characters long.
5. Exactly 5 keyword search tags, max 20 chars each.
6. Pricing Tiers:
   - Basic: $100 - $350 (Turnaround: 2 to 3 days)
   - Standard: $350 - $700 (Turnaround: 4 to 5 days)
   - Premium: $700 - $1,500 (Turnaround: 7 to 10 days)
7. FAQs: Exactly 4 practical, specific Q&A pairs.
8. Buyer Requirements: Exactly 3 specific onboarding questions.
9. Thumbnail Brief: High-impact Canva visual guide (Headline, Subheading, Color Palette, Visual Style, Badge).
10. Tech Stack STRICTLY ALLOWED: Node.js, Express, Supabase PostgreSQL, Google Workspace, Google Apps Script, Gemini AI, CapCut Pro, HeyGen, Vercel, Telegram Bot API. (NEVER mention Midjourney, Stable Diffusion, ComfyUI, or Make.com).

Return a single JSON object with EXACTLY this schema:
{
  "title": "I will build your web app or PWA MVP in 48 hours",
  "categorySelection": {
    "primary": "Programming & Tech",
    "sub": "Web Applications"
  },
  "tags": ["web app", "pwa", "mvp development", "fast web app", "supabase"],
  "pricing": {
    "basic": {
      "title": "Package Name",
      "price": 300,
      "deliveryDays": 2,
      "revisions": 2,
      "description": "Short package summary",
      "features": ["Feature 1", "Feature 2", "Feature 3"]
    },
    "standard": {
      "title": "Package Name",
      "price": 600,
      "deliveryDays": 4,
      "revisions": 3,
      "description": "Short package summary",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
    },
    "premium": {
      "title": "Package Name",
      "price": 1200,
      "deliveryDays": 7,
      "revisions": "Unlimited",
      "description": "Short package summary",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"]
    }
  },
  "description": "Full formatted description text...",
  "faq": [
    { "q": "Question 1", "a": "Answer 1" },
    { "q": "Question 2", "a": "Answer 2" },
    { "q": "Question 3", "a": "Answer 3" },
    { "q": "Question 4", "a": "Answer 4" }
  ],
  "buyerRequirements": [
    "Requirement Question 1",
    "Requirement Question 2",
    "Requirement Question 3"
  ],
  "thumbnailBrief": {
    "headline": "UPPERCASE SHORT TITLE",
    "subheading": "SUBHEADING WITH KEY TECH",
    "colorPalette": ["#00DF89", "#09090B", "#FFFFFF"],
    "visualStyle": "Visual style description",
    "badgeText": "⚡ SPEED BADGE TEXT",
    "layoutAdvice": "Canva layout recommendation"
  }
}`;

    for (const model of GEMINI_MODELS) {
      try {
        const rawJson = await callGemini(model, prompt, apiKey);
        const parsed = JSON.parse(rawJson);

        const title = parsed.title || `I will build your ${service.title.toLowerCase()}`;
        const titleBody = title.replace(/^i\s+will\s+/i, '').trim();

        const gig = {
          id: `GIG-TECH-00${gigIndex}`,
          accountId,
          serviceId: service.id,
          category: service.category,
          platform: 'fiverr',
          gigIndex,
          ...parsed,
          title,
          titleBody,
          pricingMatrix: parsed.pricingMatrix || {
            screens: { basic: 2, standard: 3, premium: 10 },
            apis: { basic: 0, standard: 1, premium: 5 },
            checkboxes: {
              database: [true, true, true],
              auth: [true, true, true],
              seo: [false, false, true],
              analytics: [false, false, true],
              payment: [false, true, true],
              hosting: [true, true, true],
              admin: [true, true, true],
              securityAudit: [false, false, true]
            }
          },
          galleryPrompts: parsed.galleryPrompts || {
            videoScenes: [
              `Scene 1 (0-10s) Hook: Cinematic macro shot of entrepreneur facing weeks of development delay, transitioning into rapid GRO10X sprint timer.`,
              `Scene 2 (10-20s) Problem: Legacy systems and high agency invoices dissolving into streamlined digital flow.`,
              `Scene 3 (20-30s) Solution: Sleek dark-mode dashboard interface loading with fluid 60fps responsiveness.`,
              `Scene 4 (30-40s) Architecture: Node.js backend connecting securely to Supabase PostgreSQL real-time database.`,
              `Scene 5 (40-50s) Feature Demo: Interactive feature walkthrough with live dynamic forms and instant cloud response.`,
              `Scene 6 (50-60s) Handover: Complete GitHub repository ownership and zero recurring maintenance fees badge.`,
              `Scene 7 (60-70s) CTA: High energy closing card: RAPID SPRINT DELIVERY - SEND YOUR PROJECT SCOPE TODAY.`
            ],
            voiceoverScenes: [
              `Tired of waiting months for traditional agencies just to see a basic prototype? There is a much faster way.`,
              `Endless hourly billing, bloated codebases, and missed launch deadlines kill great startup ideas before they even get off the ground.`,
              `At GRO10X, we engineer and deploy your full working web application or Progressive Web App in as fast as 48 hours.`,
              `Powered by modern Node.js, Supabase PostgreSQL, and serverless edge hosting on Vercel with zero downtime and ironclad security.`,
              `Your users get instant mobile installation, secure authentication, dynamic data forms, and interactive analytics ready to pitch to real investors.`,
              `You receive one hundred percent full source code ownership, complete GitHub repository access, and zero monthly lock-in fees.`,
              `Stop waiting and launch your MVP this week. Send us a message today with your project scope!`
            ],
            fullVoiceoverScript: `Tired of waiting months for traditional agencies just to see a basic prototype? There is a much faster way. Endless hourly billing, bloated codebases, and missed launch deadlines kill great startup ideas before they even get off the ground. At GRO10X, we engineer and deploy your full working web application or Progressive Web App in as fast as 48 hours. Powered by modern Node.js, Supabase PostgreSQL, and serverless edge hosting on Vercel with zero downtime and ironclad security. Your users get instant mobile installation, secure authentication, dynamic data forms, and interactive analytics ready to pitch to real investors. You receive one hundred percent full source code ownership, complete GitHub repository access, and zero monthly lock-in fees. Stop waiting and launch your MVP this week. Send us a message today with your project scope!`,
            imagePrompts: [
              `Image 1 (Hero Thumbnail 1280x769): High-contrast dark glassmorphic banner with neon green (#00DF89) bold 3D typography: ${service.title.toUpperCase()}, floating laptop mockup and verified speed badge.`,
              `Image 2 (Feature Matrix Slide): Dark slate grid highlighting 4 core sprint features, Supabase integration, and live Vercel cloud deployment.`,
              `Image 3 (Architecture & Deliverables): 3D isometric diagram illustrating end-to-end full stack architecture and source code handover.`
            ],
            pdfPrompts: [
              `PDF 1 (Agency Case Study & Capabilities Guide): 2-page executive summary detailing GRO10X rapid development methodology, architecture standards, and milestone timeline.`,
              `PDF 2 (Technical Onboarding & Deliverables Spec Sheet): Technical spec sheet and onboarding checklist covering database config, auth roles, and deployment runbook.`
            ]
          },
          status: 'Generated',
          liveUrl: '',
          updatedAt: new Date().toISOString()
        };

        gig.healthCheck = validateGigHealth(gig);
        return gig;
      } catch (err) {
        console.warn(`[GigGenerator] Failed with model ${model}:`, err.message);
      }
    }
  }

  // Fallback intelligent template generator
  return generateTemplateGig({ service, gigIndex, accountId });
}

/**
 * Intelligent deterministic fallback generator if offline or API key missing
 */
function generateTemplateGig({ service, gigIndex = 1, accountId = 'ACC-TECH-001' }) {
  const isPWA = (service.slug || '').includes('pwa') || (service.slug || '').includes('app');
  const isERP = (service.slug || '').includes('erp') || (service.slug || '').includes('business');

  let title = `I will build your ${service.title.toLowerCase()} in rapid sprint`;
  if (title.length > 75) title = `I will build your ${service.title.substring(0, 45)} fast`;
  const titleBody = title.replace(/^i\s+will\s+/i, '').trim();

  const gig = {
    id: `GIG-TECH-00${gigIndex}`,
    accountId,
    serviceId: service.id,
    category: service.category || 'mobile-web',
    platform: 'fiverr',
    gigIndex,
    title,
    titleBody,
    categorySelection: {
      primary: 'Programming & Tech',
      sub: isERP ? 'Databases' : 'Vibe Coding',
      serviceType: 'Development & MVP'
    },
    tags: [
      (service.slug || 'web app').replace(/-/g, ' ').substring(0, 20),
      'fast delivery',
      'supabase',
      'node js',
      'business solution'
    ].slice(0, 5),
    pricing: {
      basic: {
        title: 'Core MVP Sprint',
        price: 250,
        deliveryDays: 2,
        revisions: 2,
        description: '1 core feature working solution with responsive UI and live database connection.',
        features: ['1 Core Feature', 'Supabase Database Setup', 'Responsive UI', 'Live Cloud Deployment', 'Source Code Handover']
      },
      standard: {
        title: 'Full Business Platform',
        price: 550,
        deliveryDays: 5,
        revisions: 3,
        description: 'Complete 3-feature platform with auth, dynamic forms, notification triggers, and admin panel.',
        features: ['3 Core Features', 'User Authentication', 'Notification Webhooks', 'Admin Dashboard', '7 Days Support']
      },
      premium: {
        title: 'Enterprise Suite',
        price: 1100,
        deliveryDays: 8,
        revisions: 'Unlimited',
        description: 'Full production-grade solution with payment gateway, automated digests, and 14 days warranty.',
        features: ['Full Architecture', 'Payment Integration', 'Telegram & Email Alerts', 'Documentation & Runbook', '14 Days Support']
      }
    },
    pricingMatrix: {
      screens: { basic: 2, standard: 3, premium: 10 },
      apis: { basic: 0, standard: 1, premium: 5 },
      checkboxes: {
        database: [true, true, true],
        auth: [true, true, true],
        seo: [false, false, true],
        analytics: [false, false, true],
        payment: [false, true, true],
        hosting: [true, true, true],
        admin: [true, true, true],
        securityAudit: [false, false, true]
      }
    },
    description: `Are you looking for rapid, reliable engineering for your business? Traditional agencies take months and charge high hourly rates. We engineer clean, cloud-native solutions deployed in days, not months.\n\nWhat We Deliver:\n• Clean, maintainable Node.js and Supabase architecture\n• Fully responsive mobile and desktop user interfaces\n• Fast cloud deployment with SSL and zero downtime\n• Real-time database and secure authentication\n• Complete source code ownership and technical handover\n\nWhy Choose GRO10X:\nWe operate a modern, AI-assisted engineering workflow focused on speed, clear communication, and measurable business outcomes. You get a working live platform quickly to validate and grow your business.\n\nVerified Tech Stack:\nNode.js, Express, Supabase PostgreSQL, Telegram Bot API, and Vercel Edge.\n\nSend us a message with your project scope to get started today!`,
    faq: [
      { q: 'How fast can you deliver the project?', a: 'Our sprint approach allows us to deliver basic prototypes in 48 hours and full platforms in 5 to 8 days.' },
      { q: 'Do I get full source code ownership?', a: 'Yes, you receive 100% full source code ownership with complete GitHub repository access.' },
      { q: 'Where will the project be hosted?', a: 'We deploy on serverless edge networks like Vercel with automated SSL certificates and high uptime.' },
      { q: 'Can you add custom integrations later?', a: 'Yes, all code is built modularly so you can easily expand features, payment gateways, and APIs.' }
    ],
    buyerRequirements: [
      'What is the primary goal and target audience for this project?',
      'Do you have reference websites, wireframes, or brand assets?',
      'What are the 1-3 essential features required for the first release?'
    ],
    thumbnailBrief: {
      headline: service.title.toUpperCase().substring(0, 30),
      subheading: 'FAST 48-HR SPRINT · NODE.JS + SUPABASE',
      colorPalette: ['#00DF89', '#3B82F6', '#09090B'],
      visualStyle: 'Dark glassmorphic layout displaying clean dashboard interface and responsive device frames.',
      badgeText: '⚡ RAPID SPRINT DELIVERY',
      layoutAdvice: 'Canva 1280x769 canvas with bold neon green typography on dark background with clean screenshot preview.'
    },
    galleryPrompts: {
      videoScenes: [
        `Scene 1 (0-10s) Hook: Cinematic macro shot of entrepreneur facing weeks of development delay, transitioning into rapid GRO10X sprint timer.`,
        `Scene 2 (10-20s) Problem: Legacy systems and high agency invoices dissolving into streamlined digital flow.`,
        `Scene 3 (20-30s) Solution: Sleek dark-mode dashboard interface loading with fluid 60fps responsiveness.`,
        `Scene 4 (30-40s) Architecture: Node.js backend connecting securely to Supabase PostgreSQL real-time database.`,
        `Scene 5 (40-50s) Feature Demo: Interactive feature walkthrough with live dynamic forms and instant cloud response.`,
        `Scene 6 (50-60s) Handover: Complete GitHub repository ownership and zero recurring maintenance fees badge.`,
        `Scene 7 (60-70s) CTA: High energy closing card: RAPID SPRINT DELIVERY - SEND YOUR PROJECT SCOPE TODAY.`
      ],
      voiceoverScenes: [
        `Tired of waiting months for traditional agencies just to see a basic prototype? There is a much faster way.`,
        `Endless hourly billing, bloated codebases, and missed launch deadlines kill great startup ideas before they even get off the ground.`,
        `At GRO10X, we engineer and deploy your full working web application or Progressive Web App in as fast as 48 hours.`,
        `Powered by modern Node.js, Supabase PostgreSQL, and serverless edge hosting on Vercel with zero downtime and ironclad security.`,
        `Your users get instant mobile installation, secure authentication, dynamic data forms, and interactive analytics ready to pitch to real investors.`,
        `You receive one hundred percent full source code ownership, complete GitHub repository access, and zero monthly lock-in fees.`,
        `Stop waiting and launch your MVP this week. Send us a message today with your project scope!`
      ],
      fullVoiceoverScript: `Tired of waiting months for traditional agencies just to see a basic prototype? There is a much faster way. Endless hourly billing, bloated codebases, and missed launch deadlines kill great startup ideas before they even get off the ground. At GRO10X, we engineer and deploy your full working web application or Progressive Web App in as fast as 48 hours. Powered by modern Node.js, Supabase PostgreSQL, and serverless edge hosting on Vercel with zero downtime and ironclad security. Your users get instant mobile installation, secure authentication, dynamic data forms, and interactive analytics ready to pitch to real investors. You receive one hundred percent full source code ownership, complete GitHub repository access, and zero monthly lock-in fees. Stop waiting and launch your MVP this week. Send us a message today with your project scope!`,
      imagePrompts: [
        `Image 1 (Hero Thumbnail 1280x769): High-contrast dark glassmorphic banner with neon green (#00DF89) bold 3D typography: ${service.title.toUpperCase()}, floating laptop mockup and verified speed badge.`,
        `Image 2 (Feature Matrix Slide): Dark slate grid highlighting 4 core sprint features, Supabase integration, and live Vercel cloud deployment.`,
        `Image 3 (Architecture & Deliverables): 3D isometric diagram illustrating end-to-end full stack architecture and source code handover.`
      ],
      pdfPrompts: [
        `PDF 1 (Agency Case Study & Capabilities Guide): 2-page executive summary detailing GRO10X rapid development methodology, architecture standards, and milestone timeline.`,
        `PDF 2 (Technical Onboarding & Deliverables Spec Sheet): Technical spec sheet and onboarding checklist covering database config, auth roles, and deployment runbook.`
      ]
    },
    status: 'Generated',
    liveUrl: '',
    updatedAt: new Date().toISOString()
  };

  gig.healthCheck = validateGigHealth(gig);
  return gig;
}

module.exports = {
  validateGigHealth,
  generateGigWithAI,
  generateTemplateGig
};