/**
 * src/routes/brands.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Empire API v1.0
 * 
 * Provides centralized server-side state & Supabase persistence for:
 * 1. 13-Brand Digital Portfolio & Catalog Tracker ($328k ARR engine)
 * 2. Real-time Product Upload Status syncing
 * 3. Automatic Engine 3 Revenue Syncing into 5-Engine Growth Cockpit
 * 4. DBM EOD Standup Logs & Mobile Check-ins
 * 5. 8-Step Store Launch Checklist State
 * 
 * Mounted at: /api/brands
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB, writeDB } = require('../services/db');

// Multer memory storage configuration for Vault uploads (max 50MB)
const vaultUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Default 13-Brand Portfolio Data
const SEED_BRANDS_DATA = {
  brands: [
    {
      id: 1,
      name: 'PlannerQueenCo',
      tagline: 'Plan it. Own it. Live it.',
      niche: 'Productivity & Life Planning',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 24200,
      netTarget: 20579,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
      fonts: 'Playfair Display + Lato',
      voice: 'Warm, empowering, practical, motivating',
      categories: ['Daily & Weekly Planners', 'Financial Trackers', 'Goal Setting & Habits', 'Life & Project Mgmt', 'Wellness & Self-Dev', 'Work & Career', 'Bundles', 'Seasonal & Holiday', 'Specialty Niches', 'E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 2,
      name: 'WildMutt Co.',
      tagline: 'Wild at Heart. Loyal to the Bone.',
      niche: 'Pet Lovers (Dogs, Cats, Pets)',
      type: 'POD+Digital',
      dbmId: 2,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 33540,
      netTarget: 18840,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#E85D04', '#1A1A2E', '#F48C06', '#FAA307', '#F5F3EF'],
      fonts: 'Abril Fatface + Plus Jakarta Sans',
      voice: 'Playful, fiercely loyal, witty, emotionally warm',
      categories: ['Custom Pet Portraits', 'Breed Graphic Tees', 'Pet Mugs & Tumblers', 'Pet Memorials', 'Bandanas & Apparel', 'Pet Health E-books', 'Party Printables', 'Breed Bundles', 'Holiday Specials', 'Training Guides'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 3,
      name: 'TinyDesks Studio',
      tagline: 'Big Business Systems for Small Desks.',
      niche: 'B2B Templates & Solo Agency Systems',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 22050,
      netTarget: 18630,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#2D6A4F', '#F5F0E8', '#1B4332', '#D8F3DC', '#212529'],
      fonts: 'Syne + Inter',
      voice: 'Sharp, executive, ultra-clean, results-focused',
      categories: ['Canva Social Media Kits', 'Client Proposal Decks', 'Invoice & Contract Packs', 'Notion Client Portals', 'Brand Identity Kits', 'Pricing Calculator Sheets', 'B2B E-books', 'Onboarding SOP Packs', 'Pitch Decks', 'Agency Mega-Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 4,
      name: 'LittleStarsLearning',
      tagline: 'Big Minds Start with Little Stars.',
      niche: 'Kids Early Education & Homeschool',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 17850,
      netTarget: 14800,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#F4A261', '#264653', '#2A9D8F', '#E76F51', '#FFF8F0'],
      fonts: 'Fredoka + Quicksand',
      voice: 'Gentle, enthusiastic, educational, child-safe',
      categories: ['Kindergarten Worksheets', 'Homeschool Curriculum Packs', 'Classroom Decor Printables', 'Montessori Busy Books', 'Sight Words Flashcards', 'Coloring & Activity Books', 'Preschool Math Bundles', 'Phonics Worksheets', 'Reward Charts', 'Parent Starter E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 5,
      name: 'InkWrapped',
      tagline: 'Wrap Your World in Seamless Art.',
      niche: 'Sublimation & Tumbler Craft Files',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20900,
      netTarget: 17590,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#9B2335', '#1C1C1C', '#DFCFBE', '#5B7065', '#FAF7F2'],
      fonts: 'Cinzel Decorative + Montserrat',
      voice: 'Vibrant, crafter-friendly, trend-conscious',
      categories: ['20oz Skinny Tumbler PNGs', '40oz Stanley Style Wraps', 'Seamless Patterns', 'Mug Sublimation Files', 'Seasonal Mega-Bundles', 'Glitter & Marble Textures', 'Floral Wrap Sets', 'Inspirational Quote Wraps', 'Western & Boho PNGs', 'Crafter Business E-books'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 6,
      name: 'CozyThreads™',
      tagline: 'Wear Your Comfort. Live the Aesthetic.',
      niche: 'Cottagecore & Aesthetic POD Apparel',
      type: 'POD',
      dbmId: 2,
      phase: 'Phase 3–4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 23200,
      netTarget: 8657,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#7B9E87', '#F7EDE2', '#F5CAC3', '#84A59D', '#3D405B'],
      fonts: 'Cormorant Garamond + Nunito Sans',
      voice: 'Cozy, nostalgic, gentle, nature-inspired',
      categories: ['Botanical Oversized Hoodies', 'Cottagecore Graphic Tees', 'Wildflower Canvas Totes', 'Embroidered Style Sweatshirts', 'Vintage Bookish Apparel', 'Coffee Lover Sweaters', 'Seasonal Autumn Drops', 'Aesthetic Stickers', 'Lookbook E-books', 'Comfort Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 7,
      name: 'ProudProfessional',
      tagline: 'Wear What You Achieved.',
      niche: 'Career Pride & Graduation Gifts',
      type: 'POD+Digital',
      dbmId: 2,
      phase: 'Phase 4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20650,
      netTarget: 9647,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#1E3A5F', '#C9A84C', '#EAEAEA', '#0B1D3A', '#FFFFFF'],
      fonts: 'Cinzel + Work Sans',
      voice: 'Dignified, celebratory, empowering, proud',
      categories: ['Nurse & Medical Pride Mugs', 'Teacher Appreciation Apparel', 'Engineer & Tech Hoodies', 'Graduation Printable Suites', 'Resume & CV Templates', 'Interview Playbook E-books', 'Desk Nameplate Prints', 'Office Wall Art', 'Milestone Bundles', 'Retirement Gifts'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 8,
      name: 'FiestaFoundry',
      tagline: 'Celebrate Every Milestone in Style.',
      niche: 'Events, Celebrations & Invitation Suites',
      type: 'Digital',
      dbmId: 1,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 21250,
      netTarget: 17909,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#E63946', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'],
      fonts: 'Playfair Display + Montserrat',
      voice: 'Festive, elegant, welcoming, joy-sparking',
      categories: ['Editable Wedding Suites', 'Baby Shower Game Packs', 'Birthday Invitation Bundles', 'Bachelorette Itineraries', 'Graduation Announcements', 'Holiday Party Kits', 'Dinner Menu Templates', 'Seating Chart Posters', 'DIY Party Guide E-books', 'Custom Invitation Services'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 9,
      name: 'ZenWallCo',
      tagline: 'Art That Brings Peace to Your Space.',
      niche: 'Printable Wall Art & Modern Home Décor',
      type: 'Digital',
      dbmId: 3,
      phase: 'Phase 4 (Week 6–8)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 19100,
      netTarget: 15964,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#4A7C59', '#F8F4F0', '#365340', '#D6CEBE', '#1E2522'],
      fonts: 'Tenor Sans + Plus Jakarta Sans',
      voice: 'Serene, minimalist, sophisticated, grounding',
      categories: ['Minimalist Line Art Sets', 'Botanical Gallery Wall Prints', 'Japandi & Neutral Art', 'Typography Affirmation Sets', 'Mid-Century Modern Art', 'Kids Room Boho Prints', 'Architecture Sketch Sets', 'Printable Frame Mockups', 'Interior Styling E-books', 'Full Gallery Room Bundles'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 10,
      name: 'SparkSVG',
      tagline: 'Precision Cut Files for Maker Magic.',
      niche: 'SVG Cut Files for Cricut & Laser Cutters',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 2 (Week 2–4)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 26400,
      netTarget: 22569,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#FF6B35', '#1A1A2E', '#F7C59F', '#004E89', '#EFEFD0'],
      fonts: 'Righteous + Outfit',
      voice: 'Maker-centric, energetic, precise, creative',
      categories: ['Holiday Cut File Bundles', 'Monogram Alphabet SVGs', 'Laser Cut 3D Wood Files', 'Funny Craft Quote SVGs', 'Sticker Sheet Cut Files', 'T-Shirt Decal Designs', 'Earring Pattern SVGs', 'Doormat Stencil Files', 'Cricut Mastery E-books', 'Maker Mega-Vaults'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 11,
      name: 'PageForge Publishing',
      tagline: 'Compounding Knowledge on Amazon KDP.',
      niche: 'Amazon KDP Non-Fiction & Low-Content Books',
      type: 'KDP',
      dbmId: 4,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 33716,
      netTarget: 32786,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#2C3E50', '#E8D5B7', '#8E44AD', '#34495E', '#ECF0F1'],
      fonts: 'Merriweather + Lato',
      voice: 'Authoritative, clear, insightful, evergreen',
      categories: ['Productivity Workbooks', 'Self-Care Guided Journals', 'Niche Career Logbooks', 'Personal Finance Handbooks', 'ADHD Daily Workbooks', 'Habit Tracking Journals', 'Homeschool Lesson Planners', 'Grief & Healing Journals', 'Fitness Logbooks', 'Solopreneur Strategy Guides'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 12,
      name: 'LetterLab Fonts',
      tagline: 'Distinctive Typography for Modern Brands.',
      niche: 'Commercial Font Bundles & Handwritten Scripts',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 3 (Week 4–6)',
      etsyStatus: 'Not Created',
      etsyUrl: '',
      target12mo: 20750,
      netTarget: 17891,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#5B4FCF', '#F0EFF4', '#1E1B3A', '#9D95FF', '#F9F871'],
      fonts: 'Cabinet Grotesk + Inter',
      voice: 'Contemporary, bespoke, design-forward, bold',
      categories: ['Handwritten Script Fonts', 'Modern Serif Duos', 'Retro 70s Display Fonts', 'Cricut Compatible Alphabets', 'Editorial Sans Serifs', 'Calligraphy Wedding Fonts', 'Bold Streetwear Fonts', 'Signature Stamp Fonts', 'Font Pairing Guides', 'Full Commercial Mega-Packs'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    },
    {
      id: 13,
      name: 'PromptVault',
      tagline: 'Unfair AI Advantage Packaged into Systems.',
      niche: 'Professional AI Prompt Systems & Notion Vaults',
      type: 'Digital',
      dbmId: 4,
      phase: 'Phase 1 (Week 1–2)',
      etsyStatus: 'In Setup',
      etsyUrl: '',
      target12mo: 74560,
      netTarget: 65384,
      productsTarget: 100,
      productsLive: 0,
      actualGross: 0,
      actualAds: 0,
      palette: ['#00DF89', '#070B12', '#06B6D4', '#1E293B', '#F8FAFC'],
      fonts: 'Space Grotesk + Plus Jakarta Sans',
      voice: 'Futuristic, hyper-optimized, actionable, elite',
      categories: ['Midjourney Photorealism Vaults', 'ChatGPT Executive Prompts', 'Etsy Seller AI Growth Kits', 'Copywriting Matrix Chains', 'ComfyUI Architecture Guides', 'SEO Programmatic Prompts', 'Social Media Generator Hubs', 'Developer Coding Assistant Vaults', 'Notion Operating Hubs', 'Lifetime Flagship All-Access Vault'],
      checklist: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false }
    }
  ],
  dbms: [
    {
      id: 1,
      name: 'DBM 1',
      title: 'Digital Products Specialist',
      assignedBrands: [1, 5, 8],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm1_gro10x'
    },
    {
      id: 2,
      name: 'DBM 2',
      title: 'POD & Mixed Products Lead',
      assignedBrands: [2, 6, 7],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm2_gro10x'
    },
    {
      id: 3,
      name: 'DBM 3',
      title: 'B2B & Education Products Lead',
      assignedBrands: [3, 4, 9],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm3_gro10x'
    },
    {
      id: 4,
      name: 'DBM 4',
      title: 'Tech, Fonts & AI Vaults Lead',
      assignedBrands: [10, 11, 12, 13],
      todayUploads: 0,
      weeklyUploads: 0,
      status: 'Active',
      contact: '@dbm4_gro10x'
    }
  ],
  productsCatalog: {},
  monthlyLogs: []
};

// In-memory fallback
let memoryBrandsState = JSON.parse(JSON.stringify(SEED_BRANDS_DATA));
let memoryDbmLogs = [
  { date: new Date().toISOString().split('T')[0], dbmId: 1, brandName: 'PlannerQueenCo', listed: 8, revenue: 0, notes: 'Completed Batch 1 Hero daily & weekly planners' },
  { date: new Date().toISOString().split('T')[0], dbmId: 4, brandName: 'PromptVault', listed: 10, revenue: 0, notes: 'Configured Notion duplication templates for Midjourney prompts' }
];

async function loadBrandsState() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'brands_empire_state')
        .maybeSingle();

      if (data && data.value && data.value.brands) {
        return data.value;
      }

      // If not yet saved in Supabase, seed it
      await supabase.from('app_settings').upsert({
        key: 'brands_empire_state',
        value: SEED_BRANDS_DATA,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      return SEED_BRANDS_DATA;
    } catch (e) {
      console.warn('[Brands DB] Error fetching from Supabase, using fallback:', e.message);
    }
  }
  return memoryBrandsState;
}

async function persistBrandsState(state) {
  memoryBrandsState = state;
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('app_settings').upsert({
        key: 'brands_empire_state',
        value: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {
      console.warn('[Brands DB] Error saving to Supabase:', e.message);
    }
  }
}

async function loadDbmLogs() {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'dbm_standup_logs')
        .maybeSingle();

      if (data && Array.isArray(data.value)) {
        return data.value;
      }
    } catch (e) {
      console.warn('[DBM Logs] Error loading logs:', e.message);
    }
  }
  return memoryDbmLogs;
}

async function persistDbmLogs(logs) {
  memoryDbmLogs = logs;
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('app_settings').upsert({
        key: 'dbm_standup_logs',
        value: logs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {
      console.warn('[DBM Logs] Error persisting logs:', e.message);
    }
  }
}

/**
 * GET /api/brands
 * Returns the entire brand empire state (brands, catalogs, dbms)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const state = await loadBrandsState();
    res.json({ success: true, ...state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/product
 * Updates a product's status and recalculates the brand's live product count
 */
router.post('/:id/product', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productIdx, status, productData } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!state.productsCatalog[brandId]) {
      state.productsCatalog[brandId] = [];
    }

    if (productIdx !== undefined && state.productsCatalog[brandId][productIdx]) {
      if (status) state.productsCatalog[brandId][productIdx].status = status;
      if (productData) Object.assign(state.productsCatalog[brandId][productIdx], productData);
    } else if (productData) {
      state.productsCatalog[brandId].push(productData);
    }

    // Recalculate brand live count
    brand.productsLive = state.productsCatalog[brandId].filter(p => p.status === 'Live').length;

    await persistBrandsState(state);
    res.json({ success: true, brand, productsLive: brand.productsLive });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/revenue
 * Logs monthly revenue and Ads spend, and automatically syncs to Engine 3 in Growth Cockpit
 */
router.post('/:id/revenue', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { amount, adsSpend, note } = req.body;

    const grossNum = Number(amount) || 0;
    const adsNum = Number(adsSpend) || 0;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    brand.actualGross = (brand.actualGross || 0) + grossNum;
    brand.actualAds = (brand.actualAds || 0) + adsNum;

    // Record in monthly logs
    state.monthlyLogs.push({
      date: new Date().toISOString(),
      brandId,
      brandName: brand.name,
      amount: grossNum,
      adsSpend: adsNum,
      note: note || 'Monthly settlement'
    });

    await persistBrandsState(state);

    // AUTO-SYNC TO ENGINE 3 in app_settings (for /api/engines/summary)
    if (isSupabaseConfigured() && grossNum > 0) {
      try {
        const { data: curData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'engine_custom_logs')
          .maybeSingle();

        const currentLogs = (curData && curData.value) ? curData.value : {};
        currentLogs.engine3 = (Number(currentLogs.engine3) || 0) + grossNum;

        await supabase.from('app_settings').upsert({
          key: 'engine_custom_logs',
          value: currentLogs,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {
        console.warn('[Engine 3 Sync] Error updating engine_custom_logs:', e.message);
      }
    }

    res.json({
      success: true,
      brand,
      loggedGross: grossNum,
      loggedAds: adsNum,
      totalBrandGross: brand.actualGross
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/checklist
 * Updates 8-step Store Launch Checklist
 */
router.post('/:id/checklist', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { stepNumber, completed } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (!brand.checklist) brand.checklist = {};
    brand.checklist[stepNumber] = !!completed;

    await persistBrandsState(state);
    res.json({ success: true, brandId, checklist: brand.checklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/settings
 * Updates brand metadata such as Etsy URL, store status
 */
router.post('/:id/settings', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { etsyUrl, etsyStatus, name, tagline } = req.body;

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    if (etsyUrl !== undefined) brand.etsyUrl = etsyUrl;
    if (etsyStatus !== undefined) brand.etsyStatus = etsyStatus;
    if (name !== undefined) brand.name = name;
    if (tagline !== undefined) brand.tagline = tagline;

    await persistBrandsState(state);
    res.json({ success: true, brand });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/dbm-logs
 * Returns all DBM EOD standup reports
 */
router.get('/dbm-logs', requireAuth, async (req, res) => {
  try {
    const logs = await loadDbmLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/dbm-logs
 * Submits a new DBM EOD standup report
 */
router.post('/dbm-logs', requireAuth, async (req, res) => {
  try {
    const { dbmId, brandName, listed, revenue, notes } = req.body;
    if (!dbmId || !brandName) {
      return res.status(400).json({ success: false, error: 'dbmId and brandName are required' });
    }

    const logs = await loadDbmLogs();
    const newEntry = {
      id: 'log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      dbmId: Number(dbmId),
      brandName,
      listed: Number(listed) || 0,
      revenue: Number(revenue) || 0,
      notes: notes || ''
    };

    logs.unshift(newEntry);
    await persistDbmLogs(logs);

    res.json({ success: true, log: newEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/vault/upload
 * Directly uploads deliverable PDF / ZIP into Supabase Storage bucket 'product-vault'
 */
router.post('/:id/vault/upload', requireAuth, vaultUpload.single('file'), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName, version, canvaTemplateUrl, notionTemplateUrl } = req.body;
    const file = req.file;

    if (!file && !canvaTemplateUrl && !notionTemplateUrl) {
      return res.status(400).json({ success: false, error: 'Please provide a file (PDF/ZIP) or template link' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    let storagePath = '';
    let signedDownloadUrl = '';

    if (file) {
      const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ver = (version || '1.0').replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `brands/${brandId}/${cleanCode}/v${ver}/${Date.now()}_${safeFileName}`;

      if (isSupabaseConfigured()) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('product-vault')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype || 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.warn('[Vault Upload] Supabase upload notice:', uploadError.message);
          } else {
            const { data: signedData } = await supabase.storage
              .from('product-vault')
              .createSignedUrl(storagePath, 3600 * 24); // 24 hours
            signedDownloadUrl = signedData?.signedUrl || '';
          }
        } catch (storageErr) {
          console.warn('[Vault Upload] Storage exception:', storageErr.message);
        }
      }
    }

    const vaultData = {
      storagePath: storagePath || (file ? `local/${file.originalname}` : ''),
      fileName: file ? file.originalname : 'Cloud Template',
      fileSizeBytes: file ? file.size : 0,
      fileFormat: file ? (file.mimetype.includes('pdf') ? 'PDF' : (file.mimetype.includes('zip') ? 'ZIP' : 'Digital Deliverable')) : 'Cloud Link',
      version: version || '1.0',
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.name || req.user?.empCode || 'DBM',
      canvaTemplateUrl: canvaTemplateUrl || '',
      notionTemplateUrl: notionTemplateUrl || '',
      downloadUrl: signedDownloadUrl
    };

    // Update product catalog record if present
    if (!state.productsCatalog) state.productsCatalog = {};
    if (state.productsCatalog[brandId]) {
      const prod = state.productsCatalog[brandId].find(p =>
        (productCode && p.code === productCode) ||
        (productName && p.name === productName)
      );
      if (prod) {
        prod.vault = vaultData;
        if (prod.status === 'Pending' || prod.status === 'In Progress') {
          prod.status = 'SEO Ready';
        }
      }
    }

    await persistBrandsState(state);

    res.json({
      success: true,
      vault: vaultData,
      brandId,
      productCode: productCode || ''
    });
  } catch (err) {
    console.error('[Vault Upload Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/brands/:id/vault/download
 * Generates fresh 24h signed URL for deliverable asset
 */
router.get('/:id/vault/download', requireAuth, async (req, res) => {
  try {
    const { storagePath } = req.query;
    if (!storagePath) {
      return res.status(400).json({ success: false, error: 'storagePath is required' });
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from('product-vault')
        .createSignedUrl(storagePath, 3600 * 24);

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.json({ success: true, downloadUrl: data.signedUrl, expiresIn: '24h' });
    }

    return res.json({ success: false, error: 'Cloud storage is not active' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/mockups/upload
 * Uploads up to 10 mockup images for a product to Supabase Storage 'product-vault'
 */
router.post('/:id/mockups/upload', requireAuth, vaultUpload.array('mockups', 10), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName } = req.body;
    const files = req.files || [];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided. Select up to 10 mockup images (PNG/JPG/WEBP).' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadedMockups = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `brands/${brandId}/${cleanCode}/mockups/${Date.now()}_${i + 1}_${safeFileName}`;
      let signedUrl = '';

      if (isSupabaseConfigured()) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('product-vault')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype || 'image/jpeg',
              upsert: true
            });

          if (!uploadError) {
            const { data: signedData } = await supabase.storage
              .from('product-vault')
              .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days
            signedUrl = signedData?.signedUrl || '';
          } else {
            console.warn('[Mockup Upload] Storage notice:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('[Mockup Storage Exception]:', storageErr.message);
        }
      }

      uploadedMockups.push({
        rank: i + 1,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        contentType: file.mimetype,
        storagePath: storagePath,
        url: signedUrl,
        uploadedAt: new Date().toISOString()
      });
    }

    // Update product catalog record
    if (!state.productsCatalog) state.productsCatalog = {};
    if (state.productsCatalog[brandId]) {
      const prod = state.productsCatalog[brandId].find(p =>
        (productCode && p.code === productCode) ||
        (productName && p.name === productName)
      );
      if (prod) {
        prod.mockups = uploadedMockups;
        prod.mockupUrls = uploadedMockups.map(m => m.url).filter(Boolean);
        prod.mockupsCount = uploadedMockups.length;
      }
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      count: uploadedMockups.length,
      mockups: uploadedMockups
    });
  } catch (err) {
    console.error('[Mockups Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/mockups/upload-single
 * Uploads a single mockup image for a product to Supabase Storage 'product-vault'
 */
router.post('/:id/mockups/upload-single', requireAuth, vaultUpload.single('mockup'), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const { productCode, productName, rank, totalFiles } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const state = await loadBrandsState();
    const brand = state.brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const cleanCode = (productCode || 'PROD').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const rankNum = Number(rank) || 1;
    const storagePath = `brands/${brandId}/${cleanCode}/mockups/${Date.now()}_${rankNum}_${safeFileName}`;
    let signedUrl = '';

    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('product-vault')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: true
          });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from('product-vault')
            .createSignedUrl(storagePath, 3600 * 24 * 7); // 7 days
          signedUrl = signedData?.signedUrl || '';
        } else {
          console.warn('[Mockup Upload] Storage notice:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('[Mockup Storage Exception]:', storageErr.message);
      }
    }

    const item = {
      rank: rankNum,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      contentType: file.mimetype,
      storagePath: storagePath,
      url: signedUrl,
      uploadedAt: new Date().toISOString()
    };

    // Update product catalog record
    if (!state.productsCatalog) state.productsCatalog = {};
    if (state.productsCatalog[brandId]) {
      const prod = state.productsCatalog[brandId].find(p =>
        (productCode && p.code === productCode) ||
        (productName && p.name === productName)
      );
      if (prod) {
        if (!Array.isArray(prod.mockups)) prod.mockups = [];
        const existingIdx = prod.mockups.findIndex(m => m.rank === rankNum);
        if (existingIdx >= 0) {
          prod.mockups[existingIdx] = item;
        } else {
          prod.mockups.push(item);
        }
        prod.mockups.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        prod.mockupUrls = prod.mockups.map(m => m.url).filter(Boolean);
        prod.mockupsCount = prod.mockups.length;
      }
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      mockup: item,
      totalSaved: state.productsCatalog?.[brandId]?.find(p => p.code === productCode)?.mockups?.length || 1
    });
  } catch (err) {
    console.error('[Mockup Single Upload Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/products/:code/ai-audit
 * Runs Gemini Multimodal Vision Quality & Dynamic Pricing Audit
 */
router.post('/:id/products/:code/ai-audit', requireAuth, vaultUpload.array('pageImages', 10), async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const directFiles = req.files || [];

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const catalog = state.productsCatalog?.[brandId] || [];
    const prod = catalog.find(p => p.code === productCode) || { code: productCode, name: productCode };

    const { evaluateProductMultimodal } = require('../services/ai-evaluator');

    // Collect image buffers: direct uploads > stored mockups > vault
    let imageInputs = directFiles;
    if (imageInputs.length === 0 && Array.isArray(prod.mockups) && prod.mockups.length > 0) {
      imageInputs = prod.mockups.map(m => m.storagePath || m.url).filter(Boolean);
    }
    if (imageInputs.length === 0 && Array.isArray(prod.mockupUrls) && prod.mockupUrls.length > 0) {
      imageInputs = prod.mockupUrls;
    }

    const auditReport = await evaluateProductMultimodal(imageInputs, prod, brand);

    // Save audit into product record & auto-stage suggested price
    prod.aiAudit = auditReport;
    if (auditReport.pricing?.recommended_price) {
      prod.suggestedPrice = auditReport.pricing.recommended_price;
    }

    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      audit: auditReport
    });
  } catch (err) {
    console.error('[AI Audit Route Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/brands/:id/products/:code/apply-price
 * Applies AI Recommended Price to product in catalog & Etsy listing matrix
 */
router.post('/:id/products/:code/apply-price', requireAuth, async (req, res) => {
  try {
    const brandId = Number(req.params.id);
    const productCode = req.params.code;
    const { price } = req.body;

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive price required' });
    }

    const state = await loadBrandsState();
    const brand = state.brands?.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ success: false, error: 'Brand not found' });

    const catalog = state.productsCatalog?.[brandId] || [];
    const prod = catalog.find(p => p.code === productCode);
    if (!prod) return res.status(404).json({ success: false, error: `Product ${productCode} not found` });

    prod.price = numPrice;
    await persistBrandsState(state);

    return res.json({
      success: true,
      brandId,
      productCode,
      price: numPrice,
      message: `Price updated to $${numPrice.toFixed(2)}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.SEED_BRANDS_DATA = SEED_BRANDS_DATA;
router.loadBrandsState = loadBrandsState;
router.persistBrandsState = persistBrandsState;

module.exports = router;
module.exports.SEED_BRANDS_DATA = SEED_BRANDS_DATA;
module.exports.loadBrandsState = loadBrandsState;
module.exports.persistBrandsState = persistBrandsState;
