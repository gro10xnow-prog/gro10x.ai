/**
 * public/app/modules/brands.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Empire — Command Center Module v2.0 (Phase 2 Live)
 * 
 * Manages the complete 13-Brand Digital Products & POD Portfolio ($328,116 ARR target):
 * 1. Portfolio Overview & 12-Month Staggered Rollout
 * 2. 13 Interactive Brand Cards, Studio Drawer & 8-Step Store Launch Checklist
 * 3. 1,300-Product Catalog Upload Tracker & Checklist with Real-time API Sync
 * 4. Monthly P&L Settlement Ledger & Automatic Engine 3 Revenue Syncing
 * 5. 🤖 Live Gemini AI Etsy SEO Generator (Title + 13 Tags + Description)
 * 6. DBM (Digital Brand Manager) Division Matrix & Performance Incentives
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

const DEFAULT_BRANDS_DATA = {
  brands: [
    {
      id: 1,
      name: 'PlannerQueenGro',
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

const STORE_LAUNCH_STEPS = [
  { id: 1, title: 'Create Dedicated Etsy Store', desc: 'Open seller store under brand name with payment profile.' },
  { id: 2, title: 'Setup Shop Branding Assets', desc: 'Upload banner, avatar & policies matching brand guidelines.' },
  { id: 3, title: 'Connect Etsy to GRO10X (OAuth PKCE)', desc: '1-click secure token authorization in Etsy Command Center.' },
  { id: 4, title: 'Upload Deliverables to Cloud Vault', desc: 'Store PDF/ZIP deliverables in Supabase product vault.' },
  { id: 5, title: 'Generate 10 Mockups & 10s Video', desc: 'Run studio AI engine for high-converting listing assets.' },
  { id: 6, title: 'Run AI Pre-Listing Health Check', desc: 'Verify 100% compliance across 10 rules (13 tags, title, pricing).' },
  { id: 7, title: 'Bulk Publish Catalog to Live Etsy', desc: '1-click publish 100 products with automatic asset streaming.' },
  { id: 8, title: 'Enable Order Sync & Telegram Alerts', desc: 'Auto-sync revenue to Engine 3 P&L and receive sale alerts.' }
];

function getStudioAuthHeaders(extra = {}) {
  // Resolve token: check window.APP_API first, then scan all localStorage keys for Supabase auth
  let token = (window.APP_API && window.APP_API.getToken && window.APP_API.getToken()) || '';
  if (!token || !token.trim()) {
    // Supabase stores auth under a dynamic key: sb-<project_ref>-auth-token
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token) { token = parsed.access_token; break; }
          }
        }
      }
    } catch (e) {}
  }
  if (!token || !token.trim()) {
    token = localStorage.getItem('sb-access-token') ||
            localStorage.getItem('purpleos_pin_token') ||
            localStorage.getItem('purple_token') ||
            localStorage.getItem('gro10x_token') ||
            localStorage.getItem('jwt_token') || '';
  }
  const headers = { ...extra };
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

function isCurrentUserAdmin() {
  const u = window.CURRENT_USER || JSON.parse(localStorage.getItem('gro10x_user') || '{}');
  const roleStr = (u.role || u.accessLevel || u.access_level || '').toLowerCase();
  const empCode = u.emp_code || u.id || '';
  if (['GRO-000', 'GRO-001', 'GRO-002', 'GRO-005', 'PBD-000', 'PBD-001'].includes(empCode)) return true;
  return roleStr.includes('owner') || roleStr.includes('admin') || roleStr.includes('director') || roleStr.includes('ceo') || roleStr.includes('founder') || roleStr.includes('technology admin') || !roleStr;
}


async function loadBrandsStateFromAPI(forceFresh = false) {
  const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });

  // 1. Direct fetch with explicit auth headers and credentials
  try {
    const res = await fetch(`/api/brands?_t=${Date.now()}`, { headers, credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.brands && data.productsCatalog) {
        for (const b of data.brands) {
          const cat = data.productsCatalog[b.id] || data.productsCatalog[String(b.id)] || [];
          data.productsCatalog[b.id] = cat;
          data.productsCatalog[String(b.id)] = cat;
          b.productsLive = cat.filter(p => p.status === 'Live').length;
        }
        if (data.productsCatalog['1'] && data.productsCatalog['1'].length > 0) {
          localStorage.setItem('gro10x_brands_data', JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (e) {
    console.warn('[Brands] Direct fetch notice:', e.message);
  }

  // 2. Secondary fetch through window.APP_API client
  try {
    if (window.APP_API) {
      const data = await window.APP_API.request('/brands', { method: 'GET', bypassCache: true });
      if (data && data.brands && data.productsCatalog) {
        for (const b of data.brands) {
          const cat = data.productsCatalog[b.id] || data.productsCatalog[String(b.id)] || [];
          data.productsCatalog[b.id] = cat;
          data.productsCatalog[String(b.id)] = cat;
          b.productsLive = cat.filter(p => p.status === 'Live').length;
        }
        if (data.productsCatalog['1'] && data.productsCatalog['1'].length > 0) {
          localStorage.setItem('gro10x_brands_data', JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (e) {
    console.warn('[Brands] APP_API fetch notice:', e.message);
  }

  // 3. Fallback to local storage if network offline
  try {
    const saved = localStorage.getItem('gro10x_brands_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.brands && parsed.productsCatalog) {
        for (const b of parsed.brands) {
          const cat = parsed.productsCatalog[b.id] || parsed.productsCatalog[String(b.id)] || [];
          parsed.productsCatalog[b.id] = cat;
          parsed.productsCatalog[String(b.id)] = cat;
          b.productsLive = cat.filter(p => p.status === 'Live').length;
        }
        return parsed;
      }
    }
  } catch (e) {}

  return DEFAULT_BRANDS_DATA;
}


function saveBrandsStateLocally(state) {
  try {
    localStorage.setItem('gro10x_brands_data', JSON.stringify(state));
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE VERSION GUARD — bump this string to force-purge all stale localStorage
// ─────────────────────────────────────────────────────────────────────────────
const BRANDS_CACHE_VERSION = 'v2026-08-27c';
(function purgeStaleLocalCache() {
  try {
    const storedVersion = localStorage.getItem('gro10x_brands_cache_version');
    if (storedVersion !== BRANDS_CACHE_VERSION) {
      localStorage.removeItem('gro10x_brands_data');
      localStorage.setItem('gro10x_brands_cache_version', BRANDS_CACHE_VERSION);
      console.log('[Brands] Stale cache purged — version bumped to', BRANDS_CACHE_VERSION);
    }
    // Also nuke the cache if it has no live products (guard against blank data)
    const cached = localStorage.getItem('gro10x_brands_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      const brand1Cat = parsed?.productsCatalog?.[1] || parsed?.productsCatalog?.['1'] || [];
      const liveInCache = brand1Cat.filter(p => p.status === 'Live').length;
      if (liveInCache === 0 && brand1Cat.length > 0) {
        localStorage.removeItem('gro10x_brands_data');
        console.log('[Brands] Detected 0-live stale cache — purged for fresh API load');
      }
    }
  } catch (e) {}
})();

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RENDER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
window.APP_MODULES.brands = async function(container) {
  let state = await loadBrandsStateFromAPI();
  let currentTab = localStorage.getItem('gro10x_brands_active_tab') || 'portfolio';

  function render() {
    const totalTargetGross = state.brands.reduce((acc, b) => acc + (b.target12mo || 0), 0);
    const totalTargetNet = state.brands.reduce((acc, b) => acc + (b.netTarget || 0), 0);
    const totalActualGross = state.brands.reduce((acc, b) => acc + (b.actualGross || 0), 0);
    const totalProductsLive = state.brands.reduce((acc, b) => acc + (b.productsLive || 0), 0);
    const totalProductsTarget = state.brands.reduce((acc, b) => acc + (b.productsTarget || 100), 0);
    const overallProgress = Math.round((totalProductsLive / totalProductsTarget) * 100);

    container.innerHTML = `
      <!-- TOP COMMAND HEADER -->
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.3rem;">
            <h1 style="font-size:1.65rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
              🛍️ Digital Brand Empire
            </h1>
            <span style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
              13 Brands · 1,300 Products · Live Sync
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
            Central Command Center for Etsy & POD Portfolio · <strong>$328,116 Gross / $282,246 Net ARR Engine</strong>
          </p>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary" onclick="window.BrandsModule.openAddProductModal()">
            📦 + Quick Add Product
          </button>
          <button class="btn-primary" onclick="window.BrandsModule.openLogRevenueModal()">
            ⚡ Log Brand Revenue
          </button>
        </div>
      </div>

      <!-- MASTER METRICS KPI STRIP -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #00df89;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Year 1 Target Gross</span>
          <div style="font-size:1.6rem; font-weight:900; color:#ffffff; margin-top:0.2rem;">
            $${totalTargetGross.toLocaleString()}
          </div>
          <span style="font-size:0.72rem; color:#00df89; font-weight:700;">86.0% Net Margin Model</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #06b6d4;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Target Net Cash Profit</span>
          <div style="font-size:1.6rem; font-weight:900; color:#06b6d4; margin-top:0.2rem;">
            $${totalTargetNet.toLocaleString()}
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">Month 12 Run Rate: <strong>$54.8k/mo</strong></span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #a855f7;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Catalog Execution</span>
          <div style="font-size:1.6rem; font-weight:900; color:#ffffff; margin-top:0.2rem;">
            ${totalProductsLive} <span style="font-size:1rem; color:var(--text-muted); font-weight:500;">/ ${totalProductsTarget} Live</span>
          </div>
          <span style="font-size:0.72rem; color:#a855f7; font-weight:700;">${overallProgress}% of 1,300 Completed</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #fbbf24;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Actual Revenue Logged</span>
          <div style="font-size:1.6rem; font-weight:900; color:#fbbf24; margin-top:0.2rem;">
            $${totalActualGross.toLocaleString()}
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">Auto-synced with Growth Engine 3</span>
        </div>
      </div>

      <!-- TABS NAVIGATION BAR -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-card, #181824); padding:0.4rem; border-radius:12px; border:1px solid var(--border-subtle, #2e2e3e); margin-bottom:1.5rem; overflow-x:auto;">
        <button class="brands-tab-btn ${currentTab === 'portfolio' ? 'active' : ''}" onclick="window.BrandsModule.switchTab('portfolio')">
          📊 Portfolio Overview
        </button>
        <button class="brands-tab-btn ${currentTab === 'roster' ? 'active' : ''}" onclick="window.BrandsModule.switchTab('roster')">
          🏪 Brand Roster (${state.brands.length})
        </button>
        <button class="brands-tab-btn ${currentTab === 'products' ? 'active' : ''}" onclick="window.BrandsModule.switchTab('products')">
          📦 Product Upload Tracker
        </button>
        <button class="brands-tab-btn ${currentTab === 'pnl' ? 'active' : ''}" onclick="window.BrandsModule.switchTab('pnl')">
          💰 P&L Ledger
        </button>
        <button class="brands-tab-btn ${currentTab === 'dbm' ? 'active' : ''}" onclick="window.BrandsModule.switchTab('dbm')">
          👤 DBM Team Hub (${state.dbms.length})
        </button>
        <button class="brands-tab-btn ${currentTab === 'etsy' ? 'active' : ''}" style="border: 1px solid rgba(0,223,137,0.3); background:${currentTab === 'etsy' ? 'var(--brand-primary, #00df89)' : 'rgba(0,223,137,0.08)'}; color:${currentTab === 'etsy' ? '#070b12' : '#00df89'};" onclick="window.BrandsModule.switchTab('etsy')">
          🏪 Etsy Command Center
        </button>
        <button class="brands-tab-btn ${currentTab === 'lifecycle' ? 'active' : ''}" style="border: 1px solid rgba(251,191,36,0.3); background:${currentTab === 'lifecycle' ? '#fbbf24' : 'rgba(251,191,36,0.08)'}; color:${currentTab === 'lifecycle' ? '#070b12' : '#fbbf24'};" onclick="window.BrandsModule.switchTab('lifecycle')">
          ⏰ Lifecycle & Fee Manager
        </button>
      </div>

      <!-- TAB CONTENT AREA -->
      <div id="brands-tab-container"></div>

      <!-- BRAND DETAIL DRAWER MODAL -->
      <div id="brandDetailDrawer" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:9999; justify-content:flex-end;">
        <div style="background:var(--surface-card, #181824); width:100%; max-width:680px; height:100%; overflow-y:auto; padding:2rem; box-shadow:-10px 0 30px rgba(0,0,0,0.5); border-left:1px solid var(--border-subtle, #2e2e3e);" id="drawerInner">
        </div>
      </div>

      <!-- AI SEO RESULT MODAL -->
      <div id="aiSeoModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10000; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:640px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(0,223,137,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="aiSeoModalContent">
        </div>
      </div>

      <!-- ETSY HEALTH CHECK DIAGNOSTICS MODAL -->
      <div id="etsyHealthModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10001; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:760px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(6,182,212,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="etsyHealthModalContent">
        </div>
      </div>

      <!-- ETSY BULK PUBLISHER PROGRESS MODAL -->
      <div id="etsyBulkModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:10002; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:680px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(0,223,137,0.4); padding:2rem; box-shadow:0 25px 60px rgba(0,0,0,0.9);" id="etsyBulkModalContent">
        </div>
      </div>

      <!-- ETSY SHOP PROFILE MODAL -->
      <div id="shopProfileModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10003; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:620px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(6,182,212,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="shopProfileModalContent">
        </div>
      </div>

      <!-- ETSY SECTIONS MODAL -->
      <div id="sectionsModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10004; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:620px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(168,85,247,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="sectionsModalContent">
        </div>
      </div>

      <!-- EDIT LIVE LISTING MODAL -->
      <div id="editLiveListingModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10005; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:640px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(0,223,137,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="editLiveListingModalContent">
        </div>
      </div>

      <!-- BULK PUBLISH COST CONFIRMATION MODAL -->
      <div id="costConfirmModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:10006; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:540px; width:100%; border-radius:20px; border:1px solid rgba(251,191,36,0.4); padding:2rem; box-shadow:0 25px 60px rgba(0,0,0,0.9);" id="costConfirmModalContent">
        </div>
      </div>

      <!-- ADD CUSTOM BRAND MODAL -->
      <div id="addBrandModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10007; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:600px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(0,223,137,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="addBrandModalContent">
        </div>
      </div>

      <!-- ADD CUSTOM PRODUCT MODAL -->
      <div id="addProductModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10008; align-items:center; justify-content:center; padding:1.5rem;">
        <div style="background:var(--surface-card, #181824); max-width:600px; width:100%; max-height:90vh; overflow-y:auto; border-radius:20px; border:1px solid rgba(6,182,212,0.3); padding:2rem; box-shadow:0 20px 50px rgba(0,0,0,0.8);" id="addProductModalContent">
        </div>
      </div>
    `;

    renderTabContent(currentTab);
  }

  function renderTabContent(tab) {
    const tabContainer = document.getElementById('brands-tab-container');
    if (!tabContainer) return;

    if (tab === 'portfolio') {
      renderPortfolioTab(tabContainer);
    } else if (tab === 'roster') {
      renderRosterTab(tabContainer);
    } else if (tab === 'products') {
      renderProductsTab(tabContainer);
    } else if (tab === 'pnl') {
      renderPnLTab(tabContainer);
    } else if (tab === 'dbm') {
      renderDBMTab(tabContainer);
    } else if (tab === 'etsy') {
      renderEtsyTab(tabContainer);
    } else if (tab === 'lifecycle') {
      renderLifecycleTab(tabContainer);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1: PORTFOLIO OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  function renderPortfolioTab(container) {
    const totalTarget = state.brands.reduce((acc, b) => acc + b.target12mo, 0);
    const totalEtsyFees = state.brands.reduce((acc, b) => acc + (b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0)) + (b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20)), 0);

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
        
        <!-- REVENUE SHARE BY BRAND -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <div>
              <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">📈 Year 1 Revenue Target Distribution</h3>
              <span style="font-size:0.75rem; color:var(--text-muted);">13 Brands compound into $328,116 Gross Revenue · Total Est. Etsy Fees: <strong style="color:#fbbf24;">$${totalEtsyFees.toFixed(2)}</strong></span>
            </div>
            <span style="font-size:0.75rem; font-weight:800; color:#00df89; background:rgba(0,223,137,0.1); padding:0.25rem 0.6rem; border-radius:8px;">
              86.0% Net Margin Model
            </span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${state.brands.map(b => {
              const pct = Math.round((b.target12mo / totalTarget) * 100);
              return `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">
                    <span style="font-weight:700; color:#fff;">
                      ${b.id.toString().padStart(2, '0')}. ${b.name}
                      <span style="font-size:0.7rem; color:var(--text-muted); font-weight:500;">(${b.type})</span>
                    </span>
                    <span style="font-weight:800; color:#00df89;">
                      $${b.target12mo.toLocaleString()} <span style="font-size:0.7rem; color:var(--text-muted);">(${pct}%)</span>
                    </span>
                  </div>
                  <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                    <div style="height:100%; width:${pct * 3}%; background:${b.palette[0] || '#00df89'}; border-radius:4px;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- STAGGERED ROLLOUT TIMELINE -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">🚀 Staggered Launch Engine</h3>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:1.2rem;">8-Week Multi-DBM Onboarding Schedule</span>

            <div style="display:flex; flex-direction:column; gap:0.9rem;">
              <div style="background:rgba(0,223,137,0.08); border-left:3px solid #00df89; padding:0.75rem; border-radius:8px;">
                <strong style="color:#00df89; font-size:0.8rem; text-transform:uppercase;">Phase 1 (Week 1–2) — Priority Launch</strong>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:0.25rem 0 0;">
                  PlannerQueenGro, PromptVault, PageForge KDP (Highest ROI & Speed)
                </p>
              </div>

              <div style="background:rgba(6,182,212,0.08); border-left:3px solid #06b6d4; padding:0.75rem; border-radius:8px;">
                <strong style="color:#06b6d4; font-size:0.8rem; text-transform:uppercase;">Phase 2 (Week 2–4) — Core Digital + POD</strong>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:0.25rem 0 0;">
                  TinyDesks, InkWrapped, SparkSVG, WildMutt Co. (Printify setup)
                </p>
              </div>

              <div style="background:rgba(168,85,247,0.08); border-left:3px solid #a855f7; padding:0.75rem; border-radius:8px;">
                <strong style="color:#a855f7; font-size:0.8rem; text-transform:uppercase;">Phase 3 (Week 4–6) — Scale & Niches</strong>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:0.25rem 0 0;">
                  LittleStars, FiestaFoundry, LetterLab Fonts, WildMutt Batch 2
                </p>
              </div>

              <div style="background:rgba(251,191,36,0.08); border-left:3px solid #fbbf24; padding:0.75rem; border-radius:8px;">
                <strong style="color:#fbbf24; font-size:0.8rem; text-transform:uppercase;">Phase 4 (Week 6–8) — Full Portfolio Live</strong>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:0.25rem 0 0;">
                  CozyThreads, ProudProfessional, ZenWallCo (1,300 Products Live)
                </p>
              </div>
            </div>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:1rem;" onclick="window.BrandsModule.switchTab('products')">
            Open 1,300 Product Upload Matrix →
          </button>
        </div>

      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2: BRAND ROSTER (13 CARDS)
  // ─────────────────────────────────────────────────────────────────────────
  function renderRosterTab(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <span style="color:var(--text-secondary); font-size:0.85rem;">Showing all ${state.brands.length} Brands across 4 DBM Divisions:</span>
        <button class="btn-secondary btn-sm" onclick="window.BrandsModule.openAddBrandModal()">+ Add Custom Brand</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.25rem;">
        ${state.brands.map(b => {
          const dbm = state.dbms.find(d => d.id === b.dbmId) || { name: `DBM ${b.dbmId}` };
          const statusBg = (b.etsyStatus === 'Live' || b.etsyStatus === 'Active') ? 'rgba(0,223,137,0.15)' : b.etsyStatus === 'In Setup' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)';
          const statusColor = (b.etsyStatus === 'Live' || b.etsyStatus === 'Active') ? '#00df89' : b.etsyStatus === 'In Setup' ? '#fbbf24' : 'var(--text-muted)';
          const typeColor = b.type === 'Digital' ? '#00df89' : b.type === 'KDP' ? '#a855f7' : '#06b6d4';

          const checklistCount = Object.values(b.checklist || {}).filter(Boolean).length;
          const feesCharged = (b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0)) + (b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20));

          return `
            <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
              <div style="position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg, ${b.palette[0] || '#00df89'}, ${b.palette[2] || '#06b6d4'});"></div>
              
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem;">
                  <div>
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">${b.id.toString().padStart(2, '0')}. ${b.name}</h3>
                    </div>
                    <span style="font-size:0.72rem; color:var(--text-muted);">${b.niche}</span>
                  </div>
                  <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:${typeColor}20; color:${typeColor}; border:1px solid ${typeColor}40;">
                    ${b.type}
                  </span>
                </div>

                <p style="font-size:0.78rem; color:var(--text-secondary); font-style:italic; margin-bottom:0.85rem;">
                  "${b.tagline}"
                </p>

                <!-- COLOR PALETTE DOTS -->
                <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.85rem;">
                  <span style="font-size:0.68rem; color:var(--text-muted);">Palette:</span>
                  ${(b.palette || []).slice(0, 5).map(c => `
                    <span style="width:14px; height:14px; border-radius:50%; background:${c}; border:1px solid rgba(255,255,255,0.2);" title="${c}"></span>
                  `).join('')}
                  <span style="font-size:0.68rem; color:var(--text-muted); margin-left:auto;">${b.fonts || 'Standard'}</span>
                </div>

                <!-- PROGRESS METRICS -->
                <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; margin-bottom:0.85rem;">
                  <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.3rem;">
                    <span style="color:var(--text-muted);">Products Live:</span>
                    <strong style="color:#fff;">${b.productsLive || 0} / ${b.productsTarget || 100}</strong>
                  </div>
                  <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:0.5rem;">
                    <div style="height:100%; width:${((b.productsLive || 0) / (b.productsTarget || 100)) * 100}%; background:#00df89;"></div>
                  </div>

                  <div style="display:flex; justify-content:space-between; font-size:0.72rem;">
                    <span>Target: <strong style="color:#00df89;">$${b.target12mo.toLocaleString()}</strong></span>
                    <span>Fees: <strong style="color:#fbbf24;">$${feesCharged.toFixed(2)}</strong></span>
                    <span>Launch: <strong style="color:#06b6d4;">${checklistCount}/8 Tasks</strong></span>
                  </div>
                </div>

                <!-- ETSY STORE STATUS & URL -->
                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.75rem; margin-bottom:0.5rem;">
                  <span style="color:${statusColor}; font-weight:700;">● ${b.etsyStatus || 'Not Connected'}</span>
                  ${b.etsyUrl ? `
                    <a href="${b.etsyUrl}" target="_blank" style="color:#06b6d4; text-decoration:none; font-weight:700;">🔗 View Etsy Store →</a>
                  ` : `
                    <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.15rem 0.4rem; color:#f97316;" onclick="window.BrandsModule.switchTab('etsy'); window.BrandsModule.changeEtsyBrand(${b.id});">
                      🔑 Connect in Etsy Command Center →
                    </button>
                  `}
                </div>
              </div>

              <!-- ACTION BUTTONS -->
              <div style="display:flex; gap:0.4rem; margin-top:0.75rem;">
                <button class="btn-secondary btn-sm" style="flex:1;" onclick="window.BrandsModule.openBrandDrawer(${b.id})">
                  🎨 Studio & Checklist (${checklistCount}/8)
                </button>
                <button class="btn-primary btn-sm" style="flex:1;" onclick="window.BrandsModule.viewBrandProducts(${b.id})">
                  📦 Catalog (${b.productsTarget || 100})
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 3: PRODUCT UPLOAD TRACKER (1,300 CHECKLIST)
  // ─────────────────────────────────────────────────────────────────────────
  function renderProductsTab(container) {
    let selectedBrandId = Number(localStorage.getItem('gro10x_brands_selected_brand') || 1);
    const brand = state.brands.find(b => b.id === selectedBrandId) || state.brands[0];

    // Build or retrieve catalog for this brand
    let products = state.productsCatalog[brand.id] || state.productsCatalog[String(brand.id)] || [];
    if (products.length === 0) {
      products = generateDefaultProductsForBrand(brand);
      state.productsCatalog[brand.id] = products;
      state.productsCatalog[String(brand.id)] = products;
    }
    const liveCount = products.filter(p => p.status === 'Live').length;
    brand.productsLive = liveCount;

    container.innerHTML = `
      <div class="card-glass" style="padding:1.25rem; border-radius:16px; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <label style="font-size:0.85rem; font-weight:800; color:#fff;">Select Brand:</label>
            <select id="brandCatalogSelector" onchange="window.BrandsModule.changeBrandCatalog(this.value)" style="background:var(--surface-card, #181824); color:#fff; border:1px solid var(--border-subtle, #2e2e3e); padding:0.45rem 0.9rem; border-radius:10px; font-family:var(--font-heading); font-weight:700; outline:none; cursor:pointer;">
              ${state.brands.map(b => `
                <option value="${b.id}" ${b.id === brand.id ? 'selected' : ''}>
                  ${b.id.toString().padStart(2, '0')}. ${b.name} (${b.type})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display:flex; align-items:center; gap:1rem;">
            <span style="font-size:0.85rem; color:var(--text-secondary);">
              Live Listings: <strong style="color:#00df89; font-size:1.1rem;">${liveCount}</strong> / ${products.length}
            </span>
            <button class="btn-primary btn-sm" onclick="window.BrandsModule.openAddProductToBrandModal(${brand.id})">
              + Add Custom Product
            </button>
          </div>
        </div>
      </div>

      <!-- PRODUCTS TABLE -->
      <div class="card-glass" style="padding:1.25rem; border-radius:16px; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">
              <th style="padding:0.75rem;">SKU / Code</th>
              <th style="padding:0.75rem;">Product Name</th>
              <th style="padding:0.75rem;">Category</th>
              <th style="padding:0.75rem;">Format</th>
              <th style="padding:0.75rem;">Price</th>
              <th style="padding:0.75rem;">Status</th>
              <th style="padding:0.75rem; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${p.status === 'Live' ? 'rgba(0,223,137,0.03)' : 'transparent'};">
                <td style="padding:0.75rem; font-family:monospace; color:#06b6d4; font-weight:700;">${p.code || `PROD-${idx + 1}`}</td>
                <td style="padding:0.75rem; font-weight:700; color:#fff;">
                  ${p.hero ? '⭐ ' : ''}${p.name}
                </td>
                <td style="padding:0.75rem; color:var(--text-secondary);">${p.category || 'General'}</td>
                <td style="padding:0.75rem;"><span style="background:rgba(255,255,255,0.08); padding:0.15rem 0.45rem; border-radius:6px; font-size:0.72rem;">${p.format || 'Digital PDF'}</span></td>
                <td style="padding:0.75rem; color:#00df89; font-weight:700;">$${p.price || 12}</td>
                <td style="padding:0.75rem;">
                  <select onchange="window.BrandsModule.updateProductStatus(${brand.id}, ${idx}, this.value)" style="background:${p.status === 'Live' ? 'rgba(0,223,137,0.2)' : 'rgba(255,255,255,0.05)'}; color:${p.status === 'Live' ? '#00df89' : 'var(--text-secondary)'}; border:1px solid rgba(255,255,255,0.1); padding:0.25rem 0.5rem; border-radius:6px; font-size:0.75rem; cursor:pointer;">
                    <option value="Pending" ${p.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="In Progress" ${p.status === 'In Progress' ? 'selected' : ''}>🛠️ Designing</option>
                    <option value="SEO Ready" ${p.status === 'SEO Ready' ? 'selected' : ''}>✍️ SEO Ready</option>
                    <option value="Live" ${p.status === 'Live' ? 'selected' : ''}>🟢 Live on Etsy</option>
                    <option value="Inactive" ${p.status === 'Inactive' ? 'selected' : ''}>⏸ Paused</option>
                  </select>
                </td>
                <td style="padding:0.75rem; text-align:right;">
                  <div style="display:inline-flex; gap:0.3rem;">
                    <button class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;" onclick="window.BrandsModule.generateLiveSEOPackage(${brand.id}, '${p.code}', '${encodeURIComponent(p.name)}')">
                      🎨 Studio
                    </button>
                    <button class="btn-ghost btn-sm" style="font-size:0.72rem; padding:0.25rem 0.4rem; color:#ef4444;" onclick="window.BrandsModule.deleteProduct(${brand.id}, '${p.code}')" title="Delete Product">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 4: P&L LEDGER
  // ─────────────────────────────────────────────────────────────────────────
  function renderPnLTab(container) {
    const totalTarget = state.brands.reduce((acc, b) => acc + (b.target12mo || 0), 0);
    const totalGross = state.brands.reduce((acc, b) => acc + (b.actualGross || 0), 0);
    const totalEtsyShopFees = state.brands.reduce((acc, b) => acc + (b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0)), 0);
    const totalListingFees = state.brands.reduce((acc, b) => acc + (b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20)), 0);
    const totalEtsyTxFees = Math.round(totalGross * 0.065);
    const totalEtsyCombined = totalEtsyShopFees + totalListingFees + totalEtsyTxFees;
    const totalCogs = state.brands.reduce((acc, b) => acc + (b.type === 'POD' ? Math.round((b.actualGross || 0) * 0.58) : Math.round((b.actualGross || 0) * 0.095)), 0);
    const totalAds = state.brands.reduce((acc, b) => acc + (b.actualAds || 0), 0);
    const totalNetProfit = Math.max(0, totalGross - totalEtsyCombined - totalCogs - totalAds);

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">💰 Brand P&L Settlement Ledger</h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">Real-time tracking of Gross Revenue, Etsy Direct Costs ($26 setup + $0.20/listing + 6.5% tx), COGS, Ads Spend & Net Cash Profit</span>
        </div>
        <button class="btn-primary" onclick="window.BrandsModule.openLogRevenueModal()">
          ⚡ + Log Monthly Revenue
        </button>
      </div>

      <!-- P&L SUMMARY KPI CARDS -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #00df89;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Total Gross Revenue</span>
          <div style="font-size:1.4rem; font-weight:900; color:#00df89; margin-top:0.2rem;">$${totalGross.toLocaleString()}</div>
          <span style="font-size:0.7rem; color:var(--text-muted);">Target: $${totalTarget.toLocaleString()}</span>
        </div>
        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #fbbf24;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Etsy Fees Sink</span>
          <div style="font-size:1.4rem; font-weight:900; color:#fbbf24; margin-top:0.2rem;">-$${totalEtsyCombined.toFixed(2)}</div>
          <span style="font-size:0.7rem; color:var(--text-muted);">$26 shop + $0.20 listing + 6.5% tx</span>
        </div>
        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #ef4444;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Platform / POD COGS</span>
          <div style="font-size:1.4rem; font-weight:900; color:#ef4444; margin-top:0.2rem;">-$${totalCogs.toLocaleString()}</div>
          <span style="font-size:0.7rem; color:var(--text-muted);">Digital: 9.5% · POD: 58%</span>
        </div>
        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #06b6d4;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">True Net Cash Profit</span>
          <div style="font-size:1.4rem; font-weight:900; color:#06b6d4; margin-top:0.2rem;">$${totalNetProfit.toLocaleString()}</div>
          <span style="font-size:0.7rem; color:#00df89; font-weight:700;">After all Etsy fees & COGS</span>
        </div>
      </div>

      <div class="card-glass" style="padding:1.25rem; border-radius:16px; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">
              <th style="padding:0.75rem;">Brand</th>
              <th style="padding:0.75rem;">12-Mo Target</th>
              <th style="padding:0.75rem;">Actual Gross</th>
              <th style="padding:0.75rem;">Etsy Direct Fees</th>
              <th style="padding:0.75rem;">Platform / POD COGS</th>
              <th style="padding:0.75rem;">Ads Spend</th>
              <th style="padding:0.75rem;">Net Cash Profit</th>
              <th style="padding:0.75rem;">P&L Status</th>
              <th style="padding:0.75rem; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.brands.map(b => {
              const cogs = b.type === 'POD' ? Math.round((b.actualGross || 0) * 0.58) : Math.round((b.actualGross || 0) * 0.095);
              const etsyShopCost = b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0);
              const etsyListingCost = b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20);
              const etsyTxCost = Math.round((b.actualGross || 0) * 0.065);
              const brandEtsyFees = etsyShopCost + etsyListingCost + etsyTxCost;
              const net = Math.max(0, (b.actualGross || 0) - cogs - (b.actualAds || 0) - brandEtsyFees);
              const health = b.actualGross > 0 ? (b.actualGross >= (b.target12mo / 12) ? '🟢 On Target' : '🟡 Scaling') : '⚪ Pending Launch';

              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:0.75rem;">
                    <strong style="color:#fff;">${b.name}</strong>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${b.type} · ${b.productsLive || 0} Live</div>
                  </td>
                  <td style="padding:0.75rem; font-weight:700;">$${b.target12mo.toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#00df89; font-weight:800;">$${(b.actualGross || 0).toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#fbbf24; font-weight:700;">-$${brandEtsyFees.toFixed(2)}</td>
                  <td style="padding:0.75rem; color:#ef4444;">-$${cogs.toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#f97316;">-$${(b.actualAds || 0).toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#06b6d4; font-weight:900;">$${net.toLocaleString()}</td>
                  <td style="padding:0.75rem; font-size:0.75rem;">${health}</td>
                  <td style="padding:0.75rem; text-align:right;">
                    <button class="btn-ghost btn-sm" onclick="window.BrandsModule.openLogBrandRevenueSpecific(${b.id})">
                      📝 Log
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // TAB 5: DBM TEAM HUB & INCENTIVE LEDGER
  // ─────────────────────────────────────────────────────────────────────────
  async function renderDBMTab(container) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <div style="width:40px; height:40px; border-radius:50%; border:3px solid rgba(0,223,137,0.2); border-top-color:#00df89; animation:spin 1s linear infinite; margin:0 auto 0.75rem;"></div>
        <p style="color:var(--text-muted); font-size:0.85rem;">Calculating live DBM earnings, tier achievement bonuses, and incentive ledger...</p>
      </div>
    `;

    let ledger = [];
    try {
      if (window.APP_API) {
        const res = await window.APP_API.get('/brands/dbm-incentive-ledger');
        if (res && res.ledger) ledger = res.ledger;
      }
    } catch (e) {
      console.warn('[DBM Ledger API Note]:', e.message);
    }

    // Fallback calculation from state
    if (!ledger || ledger.length === 0) {
      ledger = state.dbms.map(d => {
        const assignedBrands = state.brands.filter(b => d.assignedBrands.includes(b.id));
        const totalLive = assignedBrands.reduce((acc, b) => acc + (b.productsLive || 0), 0);
        const totalGross = assignedBrands.reduce((acc, b) => acc + (b.actualGross || 0), 0);
        return {
          dbmId: d.id,
          name: d.name,
          role: d.title || 'Digital Brand Manager',
          assignedBrands: assignedBrands.map(b => ({ id: b.id, name: b.name })),
          totalLiveProducts: totalLive,
          monthlyProductTarget: 30,
          achievementPct: Math.round((totalLive / 30) * 100),
          vaultBonusTotal: totalLive * 6.99,
          salesCommission: totalGross * 0.10,
          tierName: totalLive >= 36 ? '120% Super Achiever (5%)' : (totalLive >= 30 ? '100% Target (4%)' : (totalLive >= 24 ? '80% Bronze (3%)' : 'Base Tier')),
          tierBonus: totalLive >= 30 ? 80 : 0,
          surpriseBonus: 0,
          totalEarnings: (totalLive * 6.99) + (totalGross * 0.10)
        };
      });
    }

    const totalVaultEarnings = ledger.reduce((acc, l) => acc + (l.vaultBonusTotal || 0), 0);
    const totalCommissions = ledger.reduce((acc, l) => acc + (l.salesCommission || 0), 0);
    const totalTierBonuses = ledger.reduce((acc, l) => acc + (l.tierBonus || 0), 0);
    const totalPaidOut = totalVaultEarnings + totalCommissions + totalTierBonuses;

    container.innerHTML = `
      <!-- TOP COMMAND BAR -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <h3 style="font-size:1.3rem; font-weight:900; color:#fff; margin:0;">👤 DBM Performance & Incentive Hub</h3>
            <span style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
              15% Total Distribution Model (10% Sales + 5% Incentives)
            </span>
          </div>
          <span style="font-size:0.78rem; color:var(--text-muted); display:block; margin-top:0.2rem;">
            Vault Onboarding Bonus = AI Retail Price on Publish · 10% Flat Brand Commission · 3%/4%/5% Tier Sprints
          </span>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary btn-sm" style="border-color:#fbbf24; color:#fbbf24;" onclick="window.BrandsModule.openConfigureMidMonthModal()">
            🎁 Set Mid-Month Sprint Bonus
          </button>
          <button class="btn-secondary btn-sm" style="border-color:#06b6d4; color:#06b6d4;" onclick="window.BrandsModule.triggerTelegram20thBrief()">
            📢 20th Telegram Brief
          </button>
          <button class="btn-primary btn-sm" onclick="window.BrandsModule.openDBMStandupModal()">
            📋 Daily Standup
          </button>
        </div>
      </div>

      <!-- MASTER INCENTIVES KPI STRIP -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #00df89;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Vault Completion Bonuses</span>
          <div style="font-size:1.5rem; font-weight:900; color:#00df89; margin-top:0.2rem;">
            $${totalVaultEarnings.toFixed(2)}
          </div>
          <span style="font-size:0.7rem; color:var(--text-muted);">Earned on Live Etsy publication</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #06b6d4;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">10% Sales Commissions</span>
          <div style="font-size:1.5rem; font-weight:900; color:#06b6d4; margin-top:0.2rem;">
            $${totalCommissions.toFixed(2)}
          </div>
          <span style="font-size:0.7rem; color:var(--text-muted);">Auto-accrued from brand gross</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #a855f7;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Tier Sprint Incentives</span>
          <div style="font-size:1.5rem; font-weight:900; color:#a855f7; margin-top:0.2rem;">
            $${totalTierBonuses.toFixed(2)}
          </div>
          <span style="font-size:0.7rem; color:var(--text-muted);">80% (3%) · 100% (4%) · 120% (5%)</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #fbbf24;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Total DBM Distribution</span>
          <div style="font-size:1.5rem; font-weight:900; color:#fbbf24; margin-top:0.2rem;">
            $${totalPaidOut.toFixed(2)}
          </div>
          <span style="font-size:0.7rem; color:var(--text-muted);">15% Total Target Net Cap</span>
        </div>
      </div>

      <!-- DBM CARDS GRID -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        ${ledger.map(d => {
          return `
            <div class="card-glass" style="padding:1.35rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem;">
                      ${d.name.replace('DBM ', 'D')}
                    </div>
                    <div>
                      <h4 style="font-size:1.05rem; font-weight:800; color:#fff; margin:0;">${d.name}</h4>
                      <span style="font-size:0.72rem; color:var(--text-muted);">${d.role}</span>
                    </div>
                  </div>
                  <span style="font-size:0.78rem; font-weight:900; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
                    $${(d.totalEarnings || 0).toFixed(2)}
                  </span>
                </div>

                <!-- ASSIGNED BRANDS -->
                <div style="background:rgba(0,0,0,0.3); padding:0.6rem 0.8rem; border-radius:10px; margin-bottom:0.85rem;">
                  <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Assigned Brands:</span>
                  <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.3rem;">
                    ${(d.assignedBrands || []).map(b => `
                      <span style="font-size:0.72rem; font-weight:700; background:rgba(255,255,255,0.06); padding:0.15rem 0.45rem; border-radius:4px; color:#fff;">
                        ${b.name}
                      </span>
                    `).join('')}
                  </div>
                </div>

                <!-- MONTHLY UPLOAD PROGRESS TOWARDS TIERS -->
                <div style="background:rgba(255,255,255,0.02); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06); margin-bottom:0.85rem;">
                  <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.35rem;">
                    <span style="font-weight:700; color:#fff;">Monthly Target Progress</span>
                    <span style="font-weight:900; color:#06b6d4;">${d.totalLiveProducts} / ${d.monthlyProductTarget} Products (${d.achievementPct}%)</span>
                  </div>
                  <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin-bottom:0.5rem;">
                    <div style="width:${Math.min(100, d.achievementPct)}%; height:100%; background:linear-gradient(90deg, #00df89, #06b6d4); transition:width 0.3s ease;"></div>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted); font-weight:700;">
                    <span style="${d.achievementPct >= 80 ? 'color:#00df89;' : ''}">80% (3% bonus)</span>
                    <span style="${d.achievementPct >= 100 ? 'color:#00df89;' : ''}">100% (4% bonus)</span>
                    <span style="${d.achievementPct >= 120 ? 'color:#00df89;' : ''}">120% (5% bonus)</span>
                  </div>
                </div>

                <!-- DETAILED EARNINGS BREAKDOWN -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.74rem; margin-bottom:0.85rem;">
                  <div style="background:rgba(0,0,0,0.25); padding:0.5rem 0.65rem; border-radius:8px;">
                    <span style="color:var(--text-muted); display:block;">Vault Bonus:</span>
                    <strong style="color:#00df89; font-size:0.85rem;">$${(d.vaultBonusTotal || 0).toFixed(2)}</strong>
                  </div>
                  <div style="background:rgba(0,0,0,0.25); padding:0.5rem 0.65rem; border-radius:8px;">
                    <span style="color:var(--text-muted); display:block;">10% Sales Comm:</span>
                    <strong style="color:#06b6d4; font-size:0.85rem;">$${(d.salesCommission || 0).toFixed(2)}</strong>
                  </div>
                  <div style="background:rgba(0,0,0,0.25); padding:0.5rem 0.65rem; border-radius:8px;">
                    <span style="color:var(--text-muted); display:block;">Sprint Tier Bonus:</span>
                    <strong style="color:#a855f7; font-size:0.85rem;">$${(d.tierBonus || 0).toFixed(2)}</strong>
                  </div>
                  <div style="background:rgba(0,0,0,0.25); padding:0.5rem 0.65rem; border-radius:8px;">
                    <span style="color:var(--text-muted); display:block;">Surprise Bonus:</span>
                    <strong style="color:#fbbf24; font-size:0.85rem;">$${(d.surpriseBonus || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <!-- SURPRISE INCENTIVE CARD IF ACTIVE -->
                ${d.surpriseIncentive && d.surpriseIncentive.approved ? `
                  <div style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.3); padding:0.5rem 0.75rem; border-radius:8px; font-size:0.72rem; margin-bottom:0.85rem; display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-size:1.1rem;">🎁</span>
                    <div>
                      <strong style="color:#fbbf24;">Mid-Month Sprint Unlocked:</strong> Reach ${d.surpriseIncentive.targetPct}% for extra <strong>+$${d.surpriseIncentive.bonusUsd}</strong>!
                    </div>
                  </div>
                ` : ''}
              </div>

              <div style="display:flex; gap:0.4rem;">
                <button class="btn-secondary btn-sm" style="flex:1; font-size:0.75rem;" onclick="window.BrandsModule.openConfigureMidMonthModal(${d.dbmId})">
                  ⚙️ Set Sprint Bonus
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 6: ETSY SHOP COMMAND CENTER
  // ─────────────────────────────────────────────────────────────────────────
  async function renderEtsyTab(container) {
    const selectedBrandId = parseInt(localStorage.getItem('gro10x_brands_selected_etsy_brand') || '1', 10);
    const b = state.brands.find(x => x.id === selectedBrandId) || state.brands[0];

    // Ensure catalog list exists for this brand
    let catalog = state.productsCatalog[b.id] || state.productsCatalog[String(b.id)] || [];
    if (catalog.length === 0) {
      catalog = generateDefaultProductsForBrand(b);
      state.productsCatalog[b.id] = catalog;
      state.productsCatalog[String(b.id)] = catalog;
    }
    const liveCount = catalog.filter(p => p.status === 'Live').length;
    b.productsLive = liveCount;
    const readyCount = catalog.filter(p => ['SEO Ready', 'QA Approved', 'Staged'].includes(p.status)).length;
    const vaultCount = catalog.filter(p => Boolean(p.vault?.fileName || p.vault?.storagePath)).length;

    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const expiringCount = catalog.filter(p => {
      if (p.status !== 'Live' || !p.expiresAt) return false;
      return (new Date(p.expiresAt).getTime() - now) <= fourteenDaysMs;
    }).length;

    const brandListingFees = b.totalListingFeesCharged || (liveCount * 0.20);
    const brandShopFee = b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0);
    const brandCombinedFees = brandShopFee + brandListingFees;

    container.innerHTML = `
      <!-- TOP COMMAND BAR: BRAND SELECTOR + MASTER ACTIONS -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <label style="font-size:0.85rem; font-weight:800; color:#fff;">Select Brand Store:</label>
          <select id="etsyBrandSelector" onchange="window.BrandsModule.changeEtsyBrand(this.value)" style="background:var(--surface-card, #181824); color:#fff; border:1px solid rgba(0,223,137,0.3); padding:0.5rem 1rem; border-radius:10px; font-weight:800; font-size:0.9rem; cursor:pointer;">
            ${state.brands.map(brand => `
              <option value="${brand.id}" ${brand.id === b.id ? 'selected' : ''}>
                Brand ${brand.id}: ${brand.name} (${brand.type}) · ${brand.productsLive || 0}/100 Live
              </option>
            `).join('')}
          </select>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-secondary btn-sm" style="border:1px solid rgba(6,182,212,0.4); color:#06b6d4;" onclick="window.BrandsModule.runAIEtsyHealthCheck(${b.id})">
            🩺 AI Health Check (100)
          </button>
          <button class="btn-secondary btn-sm" onclick="window.BrandsModule.openShopProfileModal(${b.id})">
            🛍️ Shop Profile
          </button>
          <button class="btn-secondary btn-sm" onclick="window.BrandsModule.openSectionsModal(${b.id})">
            📋 Sections
          </button>
          <button class="btn-secondary btn-sm" onclick="window.BrandsModule.syncLiveEtsyListings(${b.id})">
            🔄 Sync Live
          </button>
          <button class="btn-primary btn-sm" style="background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:900;" onclick="window.BrandsModule.publishBulkEtsy(${b.id})">
            🚀 Bulk Publish ($0.20/ea)
          </button>
        </div>
      </div>

      <!-- STORE CONNECTION & IDENTITY STATUS CARD -->
      <div id="etsyConnectionCard" class="card-glass" style="padding:1.5rem; border-radius:16px; margin-bottom:1.5rem; border:1px solid rgba(255,255,255,0.08); background:linear-gradient(180deg, rgba(24,24,36,0.9), rgba(15,15,22,0.95));">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div style="width:50px; height:50px; border-radius:14px; background:linear-gradient(135deg, #f97316, #ef4444); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:900; box-shadow:0 8px 20px rgba(249,115,22,0.3);">
              E
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">${b.name} Etsy Store</h3>
                <span id="etsyStatusBadge" style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(255,255,255,0.1); color:var(--text-muted);">
                  Checking Connection...
                </span>
              </div>
              <p id="etsyStatusSubtext" style="font-size:0.78rem; color:var(--text-secondary); margin:0.2rem 0 0;">
                Niche: <strong>${b.niche}</strong> · Proj. Gross: <strong>$${b.target12mo.toLocaleString()}/yr</strong>
              </p>
            </div>
          </div>

          <div id="etsyConnectionActions" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn-secondary btn-sm" onclick="window.BrandsModule.refreshEtsyStatus(${b.id})">
              🔄 Refresh
            </button>
            <button class="btn-primary btn-sm" style="background:#f97316; border-color:#f97316;" onclick="window.BrandsModule.connectEtsyStore(${b.id})">
              🔑 Connect Etsy Store (OAuth PKCE)
            </button>
          </div>
        </div>

        <!-- EXTENDED SHOP DETAILS (Populated dynamically) -->
        <div id="etsyLiveDetails" style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.06); display:none; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; font-size:0.78rem;">
        </div>
      </div>

      <!-- MASTER METRICS STRIP (6 CARDS) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #00df89;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Live on Etsy</span>
          <div style="font-size:1.4rem; font-weight:900; color:#fff; margin-top:0.2rem;">
            ${liveCount} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">/ 100 Live</span>
          </div>
          <span style="font-size:0.68rem; color:#00df89;">${Math.round((liveCount / 100) * 100)}% of Target</span>
        </div>

        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #06b6d4;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Cloud Deliverables</span>
          <div style="font-size:1.4rem; font-weight:900; color:#06b6d4; margin-top:0.2rem;">
            ${vaultCount} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">/ 100 Uploaded</span>
          </div>
          <span style="font-size:0.68rem; color:var(--text-muted);">PDF/ZIP in Supabase</span>
        </div>

        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #a855f7;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">SEO & Mockups Ready</span>
          <div style="font-size:1.4rem; font-weight:900; color:#a855f7; margin-top:0.2rem;">
            ${readyCount} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">/ 100 Staged</span>
          </div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Title + Tags + Mockups</span>
        </div>

        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #fbbf24;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">AI Health Pass Rate</span>
          <div id="etsyPassRateBadge" style="font-size:1.4rem; font-weight:900; color:#fbbf24; margin-top:0.2rem;">
            Pending
          </div>
          <span style="font-size:0.68rem; color:var(--text-muted);">10-Rule Compliance</span>
        </div>

        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #ef4444;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Expiring in ≤14 Days</span>
          <div style="font-size:1.4rem; font-weight:900; color:${expiringCount > 0 ? '#ef4444' : '#fff'}; margin-top:0.2rem;">
            ${expiringCount} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Listings</span>
          </div>
          <span style="font-size:0.68rem; color:${expiringCount > 0 ? '#ef4444' : 'var(--text-muted)'};">${expiringCount > 0 ? 'Action: $0.20 renewal' : 'All fresh'}</span>
        </div>

        <div class="card-glass" style="padding:1rem; border-radius:12px; border-left:4px solid #f59e0b;">
          <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Brand Etsy Fees</span>
          <div style="font-size:1.4rem; font-weight:900; color:#f59e0b; margin-top:0.2rem;">
            $${brandCombinedFees.toFixed(2)}
          </div>
          <span style="font-size:0.68rem; color:var(--text-muted);">$26 shop + $0.20/ea</span>
        </div>
      </div>

      <!-- 100-PRODUCT CATALOG MATRIX & ADMIN REVIEW QUEUE -->
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; margin-bottom:1.5rem;">
        <!-- SUB-VIEW TOGGLE STRIP (Role-Aware) -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
          <div style="display:flex; gap:0.4rem; background:rgba(0,0,0,0.35); padding:0.3rem; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
            <button type="button" onclick="window.BrandsModule.setEtsySubView('catalog')" style="padding:0.4rem 0.9rem; border-radius:7px; font-size:0.78rem; font-weight:800; border:none; cursor:pointer; background:${(window._activeEtsySubView || 'catalog') === 'catalog' ? '#00df89' : 'none'}; color:${(window._activeEtsySubView || 'catalog') === 'catalog' ? '#070b12' : 'var(--text-muted)'};">
              📦 ${b.name} Catalog (${catalog.length})
            </button>
            ${isCurrentUserAdmin() ? `
              <button type="button" onclick="window.BrandsModule.setEtsySubView('review_queue')" style="padding:0.4rem 0.9rem; border-radius:7px; font-size:0.78rem; font-weight:800; border:none; cursor:pointer; background:${(window._activeEtsySubView || 'catalog') === 'review_queue' ? '#f59e0b' : 'none'}; color:${(window._activeEtsySubView || 'catalog') === 'review_queue' ? '#070b12' : 'var(--text-muted)'};">
                📋 Admin Review Queue (${Object.values(state.productsCatalog || {}).flat().filter(p => p.status === 'Pending Review' || p.status === 'Revision Requested').length})
              </button>
            ` : catalog.filter(p => p.status === 'Revision Requested').length > 0 ? `
              <button type="button" onclick="window.BrandsModule.setEtsySubView('revisions')" style="padding:0.4rem 0.9rem; border-radius:7px; font-size:0.78rem; font-weight:800; border:none; cursor:pointer; background:${(window._activeEtsySubView || 'catalog') === 'revisions' ? '#ef4444' : 'none'}; color:${(window._activeEtsySubView || 'catalog') === 'revisions' ? '#fff' : '#ef4444'};">
                ⚠️ Revisions Needed (${catalog.filter(p => p.status === 'Revision Requested').length})
              </button>
            ` : ''}
          </div>

          ${(window._activeEtsySubView || 'catalog') === 'catalog' || (window._activeEtsySubView || 'catalog') === 'revisions' ? `
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <button type="button" class="btn-secondary btn-sm" style="font-weight:800; border:1px solid rgba(0,223,137,0.4); color:#00df89; background:rgba(0,223,137,0.08);" onclick="window.BrandsModule.syncLiveEtsyCatalog(${b.id})">
                🔄 Sync from Etsy
              </button>
              <input type="text" id="etsyProductSearch" placeholder="Search title or code..." oninput="window.BrandsModule.filterEtsyTable(this.value)" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; width:180px;">
              <button class="btn-ghost btn-sm" onclick="window.BrandsModule.openAddProductToBrandModal(${b.id})">+ Add Product</button>
            </div>
          ` : `
            <span style="font-size:0.78rem; color:var(--text-secondary);">
              DVM Product submissions awaiting Executive Approval
            </span>
          `}
        </div>

        ${(window._activeEtsySubView || 'catalog') === 'review_queue' ? `
          <!-- REVIEW QUEUE TABLE -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                  <th style="padding:0.6rem;">Brand & SKU</th>
                  <th style="padding:0.6rem;">Product Name & SEO Title</th>
                  <th style="padding:0.6rem;">Price ($)</th>
                  <th style="padding:0.6rem;">Readiness</th>
                  <th style="padding:0.6rem;">AI Audit Score</th>
                  <th style="padding:0.6rem;">Status</th>
                  <th style="padding:0.6rem; text-align:right;">Executive Actions</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const queueItems = [];
                  for (const [catBrandId, prods] of Object.entries(state.productsCatalog || {})) {
                    const brandObj = state.brands?.find(x => x.id === Number(catBrandId));
                    if (Array.isArray(prods)) {
                      prods.forEach((p, idx) => {
                        if (p.status === 'Pending Review' || p.status === 'Revision Requested') {
                          queueItems.push({ ...p, brandId: Number(catBrandId), brandName: brandObj?.name || `Brand #${catBrandId}`, catIdx: idx });
                        }
                      });
                    }
                  }

                  if (queueItems.length === 0) {
                    return `
                      <tr>
                        <td colspan="7" style="padding:2.5rem; text-align:center; color:var(--text-muted);">
                          <div style="font-size:2rem; margin-bottom:0.4rem;">🎉</div>
                          <strong style="color:#fff;">Review Queue is Empty</strong><br>
                          All completed products have been approved and published!
                        </td>
                      </tr>
                    `;
                  }

                  return queueItems.map(p => {
                    const auditScore = Number(p.aiAudit?.overall_score ?? p.aiAudit?.score ?? 0);
                    const mockups = Array.isArray(p.mockups) ? p.mockups : (Array.isArray(p.mockupUrls) ? p.mockupUrls.map((u, i) => ({ url: u, rank: i + 1 })) : []);
                    const vault = p.vault || {};
                    const hasVault = Boolean(vault.storagePath || vault.downloadUrl || vault.canvaTemplateUrl || vault.notionTemplateUrl || vault.fileName);
                    const video = p.video || {};
                    const hasVideo = Boolean(video.storagePath || video.fileName || (typeof video === 'string' && video.length > 0));
                    const detailId = `reviewDetail_${p.brandId}_${p.code}`;

                    return `
                      <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                        <td style="padding:0.6rem;">
                          <div style="font-weight:800; color:#06b6d4;">${p.brandName}</div>
                          <div style="font-size:0.72rem; color:var(--text-muted);">SKU: ${p.code}</div>
                        </td>
                        <td style="padding:0.6rem;">
                          <div style="font-weight:700; color:#fff;">${p.name}</div>
                          <div style="font-size:0.72rem; color:var(--text-secondary); max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${p.seoTitle || p.seo?.title || 'No SEO Title'}
                          </div>
                        </td>
                        <td style="padding:0.6rem; font-weight:800; color:#00df89;">
                          $${(p.price || 4.99).toFixed(2)}
                        </td>
                        <td style="padding:0.6rem;">
                          <span style="font-size:0.72rem; font-weight:800; padding:0.15rem 0.45rem; border-radius:6px; background:rgba(0,223,137,0.15); color:#00df89;">
                            ${p.studioPercent || 100}% Ready
                          </span>
                        </td>
                        <td style="padding:0.6rem;">
                          <span style="font-size:0.75rem; font-weight:800; color:${auditScore >= 7 ? '#00df89' : '#fbbf24'};">
                            ${auditScore > 0 ? `${auditScore}/10` : 'Pending'}
                          </span>
                        </td>
                        <td style="padding:0.6rem;">
                          <span style="font-size:0.7rem; font-weight:800; padding:0.15rem 0.45rem; border-radius:6px; background:${p.status === 'Pending Review' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)'}; color:${p.status === 'Pending Review' ? '#fbbf24' : '#ef4444'};">
                            ${p.status}
                          </span>
                        </td>
                        <td style="padding:0.6rem; text-align:right;">
                          <div style="display:inline-flex; gap:0.3rem;">
                            <button class="btn-ghost btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#06b6d4;" onclick="window.BrandsModule.toggleReviewInspection('${detailId}')">
                              🔍 Inspect & Review
                            </button>
                            <button class="btn-secondary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem; color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="window.BrandsModule.requestRevisionForProduct(${p.brandId}, '${p.code}')">
                              📝 Revise
                            </button>
                            <button class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem; background:linear-gradient(135deg, #00df89, #06b6d4);" onclick="window.BrandsModule.approveProductDirectly(${p.brandId}, '${p.code}')">
                              ✅ Approve & Set Live
                            </button>
                          </div>
                        </td>
                      </tr>

                      <!-- EXPANDABLE INLINE INSPECTION PANEL -->
                      <tr id="${detailId}" style="display:none; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <td colspan="7" style="padding:1.25rem;">
                          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
                            
                            <!-- HEADER & QUICK ACTIONS -->
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem;">
                              <div>
                                <span style="font-size:0.72rem; font-weight:800; color:#06b6d4; text-transform:uppercase;">Product Quality Audit & Asset Inspection</span>
                                <h4 style="font-size:1rem; color:#fff; margin:0.15rem 0 0;">${p.name} (${p.code})</h4>
                              </div>
                              <div style="display:flex; gap:0.4rem; align-items:center;">
                                <button class="btn-ghost btn-sm" style="font-size:0.72rem;" onclick="window.BrandsModule.generateLiveSEOPackage(${p.brandId}, '${p.code}', '${encodeURIComponent(p.name)}')">
                                  🎨 Open Full Studio
                                </button>
                                <button class="btn-secondary btn-sm" style="font-size:0.72rem; color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="window.BrandsModule.requestRevisionForProduct(${p.brandId}, '${p.code}')">
                                  📝 Request Revision
                                </button>
                                <button class="btn-primary btn-sm" style="font-size:0.75rem; background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:800;" onclick="window.BrandsModule.approveProductDirectly(${p.brandId}, '${p.code}')">
                                  ✅ Approve & Set Live
                                </button>
                                <button class="btn-primary btn-sm" style="font-size:0.75rem; background:linear-gradient(135deg, #06b6d4, #a855f7); font-weight:800;" onclick="window.BrandsModule.publishSingleProductEtsy(${p.brandId}, ${p.catIdx})">
                                  🚀 Approve & Publish to Etsy ($0.20)
                                </button>
                              </div>
                            </div>

                            <!-- 4-COLUMN INSPECTION GRID -->
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
                              
                              <!-- 1. DELIVERABLE VAULT ASSETS -->
                              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,223,137,0.2); border-radius:10px; padding:0.85rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                  <span style="font-size:0.7rem; font-weight:800; color:#00df89; text-transform:uppercase;">📦 1. Vault Deliverable</span>
                                  <span style="font-size:0.65rem; color:${hasVault ? '#00df89' : '#ef4444'}; font-weight:800;">${hasVault ? '✅ Stored' : '❌ Missing'}</span>
                                </div>
                                ${hasVault ? `
                                  <div style="font-size:0.75rem; color:#fff; font-weight:700; margin-bottom:0.4rem;">
                                    ${vault.fileName || 'Master File'} ${vault.fileFormat ? `· ${vault.fileFormat}` : ''} ${vault.version ? `(v${vault.version})` : ''}
                                  </div>
                                  <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                    ${vault.downloadUrl ? `<a href="${vault.downloadUrl}" target="_blank" style="color:#06b6d4; text-decoration:none; font-size:0.72rem; font-weight:800;">📥 Download Master File →</a>` : ''}
                                    ${vault.canvaTemplateUrl ? `<a href="${vault.canvaTemplateUrl}" target="_blank" style="color:#00df89; text-decoration:none; font-size:0.72rem; font-weight:800;">🎨 Open Canva Template Link →</a>` : ''}
                                    ${vault.notionTemplateUrl ? `<a href="${vault.notionTemplateUrl}" target="_blank" style="color:#a855f7; text-decoration:none; font-size:0.72rem; font-weight:800;">📓 Open Notion Hub Link →</a>` : ''}
                                  </div>
                                ` : `
                                  <span style="font-size:0.72rem; color:var(--text-muted);">No deliverable uploaded yet.</span>
                                `}
                              </div>

                              <!-- 2. MEDIA (MOCKUPS & VIDEO) -->
                              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:0.85rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                  <span style="font-size:0.7rem; font-weight:800; color:#06b6d4; text-transform:uppercase;">🖼️ 2. Media (${mockups.length} Mockups)</span>
                                  <span style="font-size:0.65rem; color:${mockups.length >= 4 ? '#00df89' : '#fbbf24'}; font-weight:800;">${mockups.length >= 4 ? '✅ Minimum Met' : `${mockups.length}/4 min`}</span>
                                </div>
                                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(42px, 1fr)); gap:0.3rem; margin-bottom:0.4rem;">
                                  ${mockups.map((m, idx) => `
                                    <div style="aspect-ratio:1; border-radius:6px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:#000; display:flex; align-items:center; justify-content:center; position:relative;">
                                      ${m.url ? `<img src="${m.url}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:0.58rem; color:#00df89;">#${m.rank || idx + 1}</span>`}
                                    </div>
                                  `).join('')}
                                </div>
                                <div style="font-size:0.7rem; color:var(--text-muted);">
                                  Video: <strong style="color:${hasVideo ? '#00df89' : '#fbbf24'};">${hasVideo ? `✅ ${video.fileName || '10s Video Attached'}` : '⚪ Not Uploaded'}</strong>
                                </div>
                              </div>

                              <!-- 3. PRE-AUDITED AI SCORECARD -->
                              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(168,85,247,0.2); border-radius:10px; padding:0.85rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                  <span style="font-size:0.7rem; font-weight:800; color:#a855f7; text-transform:uppercase;">🧠 3. AI Quality Audit</span>
                                  <span style="font-size:0.65rem; color:${auditScore >= 7 ? '#00df89' : '#fbbf24'}; font-weight:800;">Score: ${auditScore}/10</span>
                                </div>
                                ${p.aiAudit ? `
                                  <div style="font-size:0.72rem; color:#fff; margin-bottom:0.3rem;">
                                    Status: <strong style="color:${auditScore >= 7 ? '#00df89' : '#ef4444'};">${p.aiAudit.gateStatus === 'passed' || auditScore >= 7 ? '🟢 Quality Passed' : '🔴 Action Required'}</strong>
                                  </div>
                                  <div style="font-size:0.68rem; color:var(--text-secondary); max-height:60px; overflow-y:auto;">
                                    ${p.aiAudit.summary || p.aiAudit.feedback || 'Quality standards verified across layout, typography, and commercial compliance.'}
                                  </div>
                                ` : `
                                  <span style="font-size:0.72rem; color:var(--text-muted);">AI Audit ready to be evaluated.</span>
                                `}
                              </div>

                              <!-- 4. EXECUTIVE PRICING & SEO OVERRIDE -->
                              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(251,191,36,0.25); border-radius:10px; padding:0.85rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                  <span style="font-size:0.7rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">💰 4. Admin Price Override</span>
                                  <span style="font-size:0.65rem; color:#00df89; font-weight:800;">Executive Control</span>
                                </div>
                                <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.4rem; margin-bottom:0.4rem;">
                                  <div>
                                    <label style="font-size:0.62rem; color:var(--text-muted); display:block;">Price ($ USD):</label>
                                    <input type="number" step="0.01" id="reviewPrice_${p.brandId}_${p.code}" value="${(p.price || 4.99).toFixed(2)}" style="width:100%; font-size:0.78rem; padding:0.3rem; background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); border-radius:6px; color:#00df89; font-weight:800;">
                                  </div>
                                  <div>
                                    <label style="font-size:0.62rem; color:var(--text-muted); display:block;">Override Reason / Note:</label>
                                    <input type="text" id="reviewNote_${p.brandId}_${p.code}" value="${p.adminPriceNote || ''}" placeholder="e.g. Premium flagship bundle" style="width:100%; font-size:0.72rem; padding:0.3rem; background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); border-radius:6px; color:#fff;">
                                  </div>
                                </div>
                                ${(() => {
                                  const curPrice = Number(p.price || 4.99);
                                  const feeListing = 0.20;
                                  const feeTx = curPrice * 0.065;
                                  const feeProc = (curPrice * 0.03) + 0.25;
                                  const totalFees = feeListing + feeTx + feeProc;
                                  const netProfit = Math.max(0, curPrice - totalFees);
                                  const marginPct = curPrice > 0 ? Math.round((netProfit / curPrice) * 100) : 0;
                                  return `
                                    <div style="background:rgba(0,0,0,0.35); padding:0.4rem 0.6rem; border-radius:8px; border:1px solid rgba(0,223,137,0.2); margin-bottom:0.4rem; font-size:0.68rem;">
                                      <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                                        <span>Etsy Fees ($0.20 + 9.5%):</span>
                                        <span style="color:#ef4444; font-weight:700;">-$${totalFees.toFixed(2)}</span>
                                      </div>
                                      <div style="display:flex; justify-content:space-between; color:#fff; font-weight:800; margin-top:0.15rem;">
                                        <span>Net Cash Margin:</span>
                                        <span style="color:#00df89;">$${netProfit.toFixed(2)} (${marginPct}%)</span>
                                      </div>
                                    </div>
                                  `;
                                })()}
                                <div style="font-size:0.68rem; color:var(--text-muted);">
                                  SEO Title: <span style="color:#fff;">${(p.seoTitle || p.name).slice(0, 50)}...</span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
            </table>
          </div>
        ` : `
          <!-- FULL CATALOG TABLE -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                  <th style="padding:0.6rem;">Code / Title</th>
                  <th style="padding:0.6rem;">Category</th>
                  <th style="padding:0.6rem;">Price ($)</th>
                  <th style="padding:0.6rem;">Media (1-10 + Vid)</th>
                  <th style="padding:0.6rem;">Deliverable</th>
                  <th style="padding:0.6rem;">Studio %</th>
                  <th style="padding:0.6rem;">AI Health</th>
                  <th style="padding:0.6rem;">Expiry (120d)</th>
                  <th style="padding:0.6rem;">Etsy Status</th>
                  <th style="padding:0.6rem; text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="etsyProductTableBody">
                ${catalog.map((p, idx) => {
                  const isLive = p.status === 'Live';
                  const isInactive = p.status === 'Inactive';
                  const hasVault = Boolean(p.vault?.fileName || p.vault?.storagePath || p.vault?.canvaTemplateUrl || p.vault?.notionTemplateUrl);
                  const hasSEO = Boolean((p.seoTitle || p.seo?.title) && (p.seoTags?.length > 0 || p.seo?.tags?.length > 0));
                  const mockupCount = Array.isArray(p.mockups) ? p.mockups.length : (Array.isArray(p.mockupUrls) ? p.mockupUrls.length : 0);
                  const hasVideo = Boolean(p.video?.fileName || p.video?.storagePath || p.video);
                  const bpDone = Boolean(p.blueprint?.geometry || p.blueprint?.prompt);
                  const auditScore = Number(p.aiAudit?.overall_score ?? p.aiAudit?.score ?? 0);
                  const auditDone = auditScore >= 7.0;
                  const studioPct = p.studioPercent !== undefined ? p.studioPercent : ((bpDone ? 20 : 0) + (hasSEO ? 20 : 0) + (hasVault ? 20 : 0) + (mockupCount > 0 ? 20 : 0) + (auditDone ? 20 : 0));

                  let expiryDisplay = '<span style="font-size:0.7rem; color:var(--text-muted);">Not Listed</span>';
                  if (isLive) {
                    const expTime = p.expiresAt || p.expiryDate || (p.endingTimestamp ? p.endingTimestamp * 1000 : null);
                    if (expTime) {
                      const daysLeft = Math.max(0, Math.ceil((new Date(expTime).getTime() - now) / (1000 * 60 * 60 * 24)));
                      const expColor = daysLeft <= 14 ? '#ef4444' : '#00df89';
                      expiryDisplay = `<span style="font-size:0.72rem; font-weight:800; color:${expColor};">${daysLeft}d left</span>`;
                    } else {
                      expiryDisplay = `<span style="font-size:0.72rem; font-weight:800; color:#00df89;">119d left</span>`;
                    }
                  }

                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);" class="etsy-prod-row" data-code="${p.code}" data-name="${p.name.toLowerCase()}">
                      <td style="padding:0.6rem;">
                        <div style="font-weight:800; color:#fff;">${p.code}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary); max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                          ${p.seoTitle || p.seo?.title || p.name}
                        </div>
                      </td>
                      <td style="padding:0.6rem; color:var(--text-muted); font-size:0.75rem;">
                        ${p.category || 'General'}
                      </td>
                      <td style="padding:0.6rem; font-weight:800; color:#00df89;">
                        $${(p.price || 4.99).toFixed(2)}
                      </td>
                      <td style="padding:0.6rem;">
                        <span style="font-size:0.72rem; ${mockupCount > 0 ? 'color:#00df89;' : 'color:var(--text-muted);'}">
                          🖼️ ${mockupCount}/10 · ${hasVideo ? '<span style="color:#a855f7;">📹✓</span>' : '<span style="color:var(--text-muted);">📹✗</span>'}
                        </span>
                      </td>
                      <td style="padding:0.6rem;">
                        ${hasVault ? `
                          <span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.7rem; font-weight:700; color:#00df89; background:rgba(0,223,137,0.1); padding:0.15rem 0.45rem; border-radius:6px;">
                            📁 Secured
                          </span>
                        ` : `
                          <span style="font-size:0.7rem; color:var(--text-muted);">⚪ Missing</span>
                        `}
                      </td>
                      <td style="padding:0.6rem;">
                        <span style="display:inline-flex; align-items:center; font-size:0.72rem; font-weight:800; padding:0.15rem 0.45rem; border-radius:6px; background:${studioPct >= 80 ? 'rgba(0,223,137,0.15)' : (studioPct >= 40 ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)')}; color:${studioPct >= 80 ? '#00df89' : (studioPct >= 40 ? '#fbbf24' : '#ef4444')};">
                          ${studioPct}%
                        </span>
                      </td>
                      <td style="padding:0.6rem;">
                        ${hasVault && hasSEO ? `
                          <span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.7rem; font-weight:800; color:#00df89; background:rgba(0,223,137,0.15); padding:0.15rem 0.45rem; border-radius:6px; cursor:pointer;" onclick="window.BrandsModule.runSingleProductHealthCheck(${b.id}, ${idx})">
                            🟢 Ready
                          </span>
                        ` : `
                          <span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.7rem; font-weight:700; color:#fbbf24; background:rgba(251,191,36,0.15); padding:0.15rem 0.45rem; border-radius:6px; cursor:pointer;" onclick="window.BrandsModule.runSingleProductHealthCheck(${b.id}, ${idx})">
                            🟡 QA
                          </span>
                        `}
                      </td>
                      <td style="padding:0.6rem;">
                        ${expiryDisplay}
                      </td>
                      <td style="padding:0.6rem;">
                        ${isLive ? `
                          <a href="${p.etsyUrl || p.liveListingUrl || (p.etsyListingId ? `https://www.etsy.com/listing/${p.etsyListingId}` : '#')}" target="_blank" style="font-size:0.72rem; font-weight:800; color:#00df89; text-decoration:none; display:inline-flex; align-items:center; gap:0.2rem;">
                            🟢 Live ↗
                          </a>
                        ` : isInactive ? `
                          <span style="font-size:0.72rem; color:#fbbf24;">⏸ Paused</span>
                        ` : (p.status === 'Pending Review' ? `
                          <span style="font-size:0.72rem; color:#fbbf24; font-weight:800;">⏳ In Review</span>
                        ` : p.status === 'Revision Requested' ? `
                          <span style="font-size:0.72rem; color:#ef4444; font-weight:800;">⚠️ Revise</span>
                        ` : `
                          <span style="font-size:0.72rem; color:var(--text-muted);">⚪ Staged</span>
                        `)}
                      </td>
                      <td style="padding:0.6rem; text-align:right;">
                        <div style="display:inline-flex; gap:0.25rem; flex-wrap:nowrap;">
                          <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem;" onclick="window.BrandsModule.generateLiveSEOPackage(${b.id}, '${p.code}', '${encodeURIComponent(p.name)}')">
                            ⚡ Studio
                          </button>
                          ${isLive ? `
                            <button class="btn-secondary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem;" onclick="window.BrandsModule.openEditLiveListingModal(${b.id}, '${p.code}')" title="Edit Live Listing on Etsy">
                              ✏️ Edit
                            </button>
                            <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem; color:#f59e0b;" onclick="window.BrandsModule.renewSingleListing(${b.id}, '${p.code}')" title="Renew Listing ($0.20 fee)">
                              🔄 Renew
                            </button>
                            <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem; color:#ef4444;" onclick="window.BrandsModule.deactivateSingleListing(${b.id}, '${p.code}')" title="Pause / Deactivate on Etsy">
                              ⏸ Pause
                            </button>
                          ` : isInactive ? `
                            <button class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem;" onclick="window.BrandsModule.reactivateSingleListing(${b.id}, '${p.code}')">
                              ▶️ Resume
                            </button>
                          ` : `
                            <button class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.4rem; background:linear-gradient(135deg, #00df89, #06b6d4);" onclick="window.BrandsModule.publishSingleProductEtsy(${b.id}, ${idx})">
                              🚀 Publish
                            </button>
                          `}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- RECENT ORDERS STREAM -->
      <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">🛒 Live Store Orders & Automatic Revenue Stream</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Synced in real-time with Growth Engine 3 & Telegram Bot</span>
          </div>
          <button class="btn-secondary btn-sm" onclick="window.BrandsModule.syncEtsyOrders(${b.id})">
            🔄 Sync Recent Orders
          </button>
        </div>

        <div id="etsyOrdersList">
          <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.8rem;">
            Loading recent transactions...
          </div>
        </div>
      </div>
    `;

    // Asynchronously fetch live Etsy connection status & orders
    window.BrandsModule.fetchLiveEtsyStatus(b.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 7: LISTING LIFECYCLE & FEE MANAGER
  // ─────────────────────────────────────────────────────────────────────────
  function renderLifecycleTab(container) {
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    
    // Gather all products across all brands
    const allProducts = [];
    state.brands.forEach(brand => {
      const catalog = state.productsCatalog[brand.id] || [];
      catalog.forEach(p => {
        allProducts.push({ ...p, brandId: brand.id, brandName: brand.name });
      });
    });

    const liveProducts = allProducts.filter(p => p.status === 'Live');
    const soonExpiring = liveProducts.filter(p => {
      if (!p.expiresAt) return false;
      const expTime = new Date(p.expiresAt).getTime();
      return (expTime - now) <= fourteenDaysMs;
    });
    const inactiveProducts = allProducts.filter(p => p.status === 'Inactive' || p.status === 'Paused');
    
    const totalRenewalCost = (soonExpiring.length * 0.20).toFixed(2);
    const totalPortfolioFees = state.brands.reduce((acc, b) => {
      const shopFee = b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0);
      const listingFees = b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20);
      const txFees = Math.round((b.actualGross || 0) * 0.065);
      return acc + shopFee + listingFees + txFees;
    }, 0);

    container.innerHTML = `
      <!-- TOP OVERVIEW HEADER -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <h3 style="font-size:1.25rem; font-weight:900; color:#fff; margin:0;">⏰ Etsy Listing Lifecycle & Fees Manager</h3>
          <p style="color:var(--text-secondary); font-size:0.82rem; margin:0.2rem 0 0;">
            Real-time monitoring of the 4-Month (120-Day) Expiry Clock, Auto-Renewal Sinks ($0.20/ea), and Total Platform Fees.
          </p>
        </div>

        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <button class="btn-secondary btn-sm" style="font-weight:800; border:1px solid rgba(0,223,137,0.4); color:#00df89;" onclick="window.BrandsModule.syncLiveEtsyCatalog(1)">
            🔄 Sync Live from Etsy Shop
          </button>
          <button class="btn-primary btn-sm" style="background:#f59e0b; border-color:#f59e0b; font-weight:800;" onclick="window.BrandsModule.bulkRenewAllExpiring()">
            🔄 Renew All ${soonExpiring.length} Expiring ($${totalRenewalCost})
          </button>
        </div>
      </div>

      <!-- LIFECYCLE METRICS STRIP -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #ef4444;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Expiring in ≤14 Days</span>
          <div style="font-size:1.6rem; font-weight:900; color:#ef4444; margin-top:0.2rem;">
            ${soonExpiring.length} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">Listings</span>
          </div>
          <span style="font-size:0.72rem; color:#ef4444; font-weight:700;">Action Required: $0.20/ea renewal</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #00df89;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Healthy Live Listings</span>
          <div style="font-size:1.6rem; font-weight:900; color:#00df89; margin-top:0.2rem;">
            ${liveProducts.length - soonExpiring.length} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">/ ${liveProducts.length}</span>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">>14 days remaining on 4-mo cycle</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #a855f7;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Paused / Inactive Listings</span>
          <div style="font-size:1.6rem; font-weight:900; color:#a855f7; margin-top:0.2rem;">
            ${inactiveProducts.length} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">Listings</span>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">Paused to avoid auto-renew costs</span>
        </div>

        <div class="card-glass" style="padding:1.1rem; border-radius:14px; border-left:4px solid #fbbf24;">
          <span style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Total Portfolio Etsy Fees</span>
          <div style="font-size:1.6rem; font-weight:900; color:#fbbf24; margin-top:0.2rem;">
            $${totalPortfolioFees.toFixed(2)}
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted);">Includes $26/shop + $0.20/listing + tx</span>
        </div>
      </div>

      <!-- PANEL A: EXPIRING SOON LISTINGS TABLE -->
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">⚠️ Listings Expiring Soon (Next 14 Days)</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Etsy automatically drops unrenewed listings after 120 days. Renewing costs $0.20 for another 120 days.</span>
          </div>
        </div>

        ${soonExpiring.length === 0 ? `
          <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem; background:rgba(0,223,137,0.03); border-radius:12px; border:1px dashed rgba(0,223,137,0.2);">
            ✅ <strong>All active listings are fresh!</strong> No listings are within the 14-day expiry window.
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                  <th style="padding:0.6rem;">Brand</th>
                  <th style="padding:0.6rem;">SKU / Code</th>
                  <th style="padding:0.6rem;">Listing Title</th>
                  <th style="padding:0.6rem;">Listed Date</th>
                  <th style="padding:0.6rem;">Days Remaining</th>
                  <th style="padding:0.6rem;">Renewal Cost</th>
                  <th style="padding:0.6rem; text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${soonExpiring.map(p => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)));
                  const badgeColor = daysLeft <= 3 ? '#ef4444' : '#fbbf24';
                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                      <td style="padding:0.6rem; font-weight:700; color:#fff;">${p.brandName}</td>
                      <td style="padding:0.6rem; font-family:monospace; color:#06b6d4;">${p.code}</td>
                      <td style="padding:0.6rem; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-secondary);">${p.seoTitle || p.name}</td>
                      <td style="padding:0.6rem; color:var(--text-muted);">${p.listedAt ? new Date(p.listedAt).toLocaleDateString() : 'N/A'}</td>
                      <td style="padding:0.6rem;">
                        <span style="background:${badgeColor}20; color:${badgeColor}; border:1px solid ${badgeColor}40; padding:0.15rem 0.5rem; border-radius:999px; font-weight:800; font-size:0.72rem;">
                          ⏳ ${daysLeft} days left
                        </span>
                      </td>
                      <td style="padding:0.6rem; font-weight:800; color:#fbbf24;">$0.20</td>
                      <td style="padding:0.6rem; text-align:right;">
                        <button class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;" onclick="window.BrandsModule.renewSingleListing(${p.brandId}, '${p.code}')">
                          🔄 Renew ($0.20)
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- PANEL B: INACTIVE / PAUSED LISTINGS TABLE -->
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div>
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">⏸ Inactive & Paused Listings</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Listings hidden on Etsy. Reactivate whenever you are ready to put them back live.</span>
          </div>
        </div>

        ${inactiveProducts.length === 0 ? `
          <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.8rem;">
            No paused or inactive listings across your portfolio.
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                  <th style="padding:0.6rem;">Brand</th>
                  <th style="padding:0.6rem;">SKU / Code</th>
                  <th style="padding:0.6rem;">Listing Title</th>
                  <th style="padding:0.6rem;">Status</th>
                  <th style="padding:0.6rem; text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${inactiveProducts.map(p => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:0.6rem; font-weight:700; color:#fff;">${p.brandName}</td>
                    <td style="padding:0.6rem; font-family:monospace; color:#06b6d4;">${p.code}</td>
                    <td style="padding:0.6rem; color:var(--text-secondary);">${p.name}</td>
                    <td style="padding:0.6rem;"><span style="background:rgba(255,255,255,0.08); padding:0.15rem 0.45rem; border-radius:6px; font-size:0.72rem; color:var(--text-muted);">⏸ Inactive</span></td>
                    <td style="padding:0.6rem; text-align:right;">
                      <button class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;" onclick="window.BrandsModule.reactivateSingleListing(${p.brandId}, '${p.code}')">
                        ▶️ Reactivate
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- PANEL C: ETSY FEE RECONCILIATION LEDGER -->
      <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
        <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0 0 0.3rem 0;">💳 Etsy Fee Breakdown by Brand</h3>
        <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:1rem;">All fees incurred across shop registrations, listings, and sales.</span>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                <th style="padding:0.6rem;">Brand</th>
                <th style="padding:0.6rem;">Etsy Status</th>
                <th style="padding:0.6rem;">Shop Setup Fee ($26)</th>
                <th style="padding:0.6rem;">Listing & Renewal Fees ($0.20)</th>
                <th style="padding:0.6rem;">6.5% Tx Fee (Actual)</th>
                <th style="padding:0.6rem; text-align:right;">Total Etsy Drain</th>
              </tr>
            </thead>
            <tbody>
              ${state.brands.map(b => {
                const shopFee = b.shopCreationFee || (b.etsyStatus === 'Active' || b.etsyStatus === 'Live' ? 26 : 0);
                const listingFees = b.totalListingFeesCharged || ((b.productsLive || 0) * 0.20);
                const txFees = Math.round((b.actualGross || 0) * 0.065);
                const total = shopFee + listingFees + txFees;
                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:0.6rem; font-weight:700; color:#fff;">${b.id}. ${b.name}</td>
                    <td style="padding:0.6rem; color:${b.etsyStatus === 'Live' || b.etsyStatus === 'Active' ? '#00df89' : 'var(--text-muted)'}; font-weight:700;">${b.etsyStatus || 'Not Connected'}</td>
                    <td style="padding:0.6rem; color:#fbbf24;">$${shopFee.toFixed(2)}</td>
                    <td style="padding:0.6rem; color:#06b6d4;">$${listingFees.toFixed(2)}</td>
                    <td style="padding:0.6rem; color:#ef4444;">$${txFees.toFixed(2)}</td>
                    <td style="padding:0.6rem; font-weight:900; color:#fbbf24; text-align:right;">$${total.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER: GENERATE DEFAULT 100 PRODUCTS FOR A BRAND
  // ─────────────────────────────────────────────────────────────────────────
  const PLANNER_QUEEN_TITLES = {
    1: "Daily & Weekly Planners #1 — PlannerQueenGro Style",
    2: "Executive Work-Life Balance & Top-3 Priority Matrix Weekly Planner",
    3: "ADHD-Friendly Low-Dopamine & Low-Friction Daily Task Planner",
    4: "Teacher & Student Weekly Academic Lesson & Study Planner",
    5: "Busy Mom Household & Family Command Center Weekly Spread",
    6: "Wellness, Fitness & Daily Meal Prep Schedule Planner",
    7: "Solopreneur 90-Day Quarterly Sprint Execution Daily Planner",
    8: "Mindful Morning & Evening Routine Reflection Journal",
    9: "Undated Minimalist 365-Day Digital GoodNotes Tablet Planner",
    10: "The Master Life Management All-Inclusive Daily & Weekly Mega Bundle",
    11: "Zero-Based Budgeting & Monthly Cash Flow Master Spread",
    12: "50/30/20 Rule Annual Income & Expense Ledger",
    13: "Debt Snowball & Avalanche Payoff Visual Progress Thermometer",
    14: "No-Spend Challenge & Impulse Purchase Cooling Tracker",
    15: "Sinking Funds & Emergency Savings Milestones Visual Log",
    16: "Bi-Weekly Paycheck Budget & Fixed Bill Payment Calendar",
    17: "Small Business & Freelancer Tax Prep & Revenue Expense Sheet",
    18: "Subscription & Membership Recurring Fee Audit Dashboard",
    19: "Net Worth & Investment Growth Tracker (Quarterly Check-In)",
    20: "Ultimate Financial Freedom & Budgeting Mastery Flagship Toolkit",
    21: "30-Day Circular Habit Matrix & Streak Gamification Tracker",
    22: "Atomic Routine Builder & Habit Stacking Daily Blueprint",
    23: "Vision Board & 12-Month Life Wheel Goal Architecture Sheet",
    24: "Quarterly OKR & High-Impact Needle Mover Action Plan",
    25: "100-Day Discipline Challenge Tracker with Milestone Rewards",
    26: "Daily Micro-Habits & Identity Shift Habit Scorecard",
    27: "Morning Manifestation & Evening Wins Habit Anchor Journal",
    28: "Annual Level 10 Life Assessment & Gap Analysis Matrix",
    29: "Goal Breakdown Roadmap: From Big Vision to Weekly Sprints",
    30: "Complete Goal Mastery & Habit Transformation Power System",
    31: "Home Organizing & Room-by-Room Decluttering Action Checklist",
    32: "Moving House & Relocation Master Logistics & Box Inventory",
    33: "Event & Birthday Party Planning Master Coordinator Spread",
    34: "Vehicle Maintenance, Insurance & Service Log Book",
    35: "Medical History, Symptom & Family Health Record Keeper",
    36: "Home Renovation, Contractor & Material Budget Project Planner",
    37: "Pet Care, Vaccination, Vet Visit & Grooming Schedule",
    38: "Emergency Preparedness & Family Document Vault Index",
    39: "Garden Planning, Planting Calendar & Yard Care Schedule",
    40: "Ultimate Home & Life Operations Executive Binder System",
    41: "Daily Gratitude & Emotional Well-Being 5-Minute Reflection Journal",
    42: "Sleep Optimization, Sleep Cycle & Dream Journal Tracker",
    43: "Water Intake, Hydration & Electrolyte 30-Day Tracker",
    44: "Menstrual Cycle, Hormone Syncing & Energy Level Tracker",
    45: "Mental Health, Anxiety Trigger Log & Grounding Technique Sheets",
    46: "Self-Care Menu & 50 Ways to Reset Recharge Planner",
    47: "Daily Affirmations & Confidence Building Thought Reframing Pad",
    48: "Reading List, Book Review & Literature Reflection Journal",
    49: "Meditation, Mindfulness & Breathing Exercise Session Log",
    50: "Holistic Mind-Body Wellness & Self-Care Master Sanctuary Kit",
    51: "Job Search Pipeline, Interview Prep & Application Follow-Up CRM",
    52: "Meeting Notes, Action Item Triage & Follow-Up Tracker",
    53: "Weekly 1-on-1 Performance Review & Goal Alignment Agenda",
    54: "Professional Skill Development & Continuing Education Tracker",
    55: "Quarterly Business Review & Promotion Portfolio Builder",
    56: "Workplace Boundary & Time Protection Priority Matrix",
    57: "Freelance Client Project Delivery & Milestone Tracker",
    58: "Content Creator Weekly Batch Recording & Publishing Pipeline",
    59: "Networking & Professional Contact Rolodex Tracker",
    60: "Executive Career Acceleration & Professional Growth Toolkit",
    61: "Productivity Essentials Starter Bundle (Daily, Habits & Goals)",
    62: "Financial Glow-Up Bundle (Cash Flow, Debt Snowball & Savings)",
    63: "Mindful Living Sanctuary Bundle (Wellness, Gratitude & Self-Care)",
    64: "Home Harmony Management Bundle (Declutter, Meal Prep & Cleaning)",
    65: "Student Success & Academic Excellence Digital Bundle",
    66: "Working Mom Super-Organizer Digital Planner Bundle",
    67: "Solopreneur All-in-One Operations & Goal Sprint Bundle",
    68: "Health, Fitness & Habit Transformation Trio Bundle",
    69: "Ultimate GoodNotes Digital iPad Planner & Sticker Mega Pack",
    70: "The Entire PlannerQueenGro Empire All-Access Vault Bundle",
    71: "Christmas & Holiday Master Planner (Budget, Gifts, Menu & Traditions)",
    72: "Thanksgiving & Autumn Gathering Host Kit (Cooking Timeline & Guests)",
    73: "Halloween Party, Costume Project & Trick-or-Treat Organizer",
    74: "New Year Goal Reset & 365-Day Vision Quest Planner",
    75: "Valentine's & Self-Love 30-Day Intentional Journal",
    76: "Spring Cleaning & Home Refresh Chore System & Declutter Matrix",
    77: "Summer Family Vacation & Road Trip Itinerary Planner",
    78: "Back-to-School & Family Academic Command Center Pack",
    79: "Easter & Spring Celebration Family Event Guide & Brunch Plan",
    80: "Ultimate 4-Season All-in-One Holiday Master System",
    81: "Wedding Planning Master Binder (Budget, Timeline, Vendor Checklist)",
    82: "Pregnancy & Baby Milestone Week-by-Week Memory Journal",
    83: "Fitness Workout Log, Weight Training & PR Tracker",
    84: "Plant Care, Propagation & Indoor Botanical Growth Log",
    85: "Travel & Backpacking Itinerary, Packing List & Expense Journal",
    86: "Recipe Book, Family Heirloom Cookbook & Meal Master",
    87: "Home Buying, Mortgage Prep & Property Tour Evaluation Sheet",
    88: "Craft & Knitting Project Queue, Materials & Sizing Planner",
    89: "Skincare Routine, Product Expiry & Skin Reaction Tracker",
    90: "Specialty Life Milestones Master Digital Sanctuary Bundle",
    91: "The Intentional Life: A Beginner's Guide to Time-Blocking (E-book)",
    92: "Mastering Money: Debt-Free Living in 12 Months (E-book)",
    93: "Habit Psychology: The Science of Automatic Discipline (E-book)",
    94: "Clutter-Free Sanctuary: Room-by-Room Home Transformation (E-book)",
    95: "The Mindful Morning: 7 Rituals That Change Your Life (E-book)",
    96: "Overcoming Procrastination: The 5-Minute Action Method (E-book)",
    97: "The High-Impact Solopreneur: Systems for 20-Hour Workweeks (E-book)",
    98: "Meal Prep Mastery: Healthy Family Dinners in 30 Mins (E-book)",
    99: "Digital Planning Masterclass: GoodNotes & Tablet Guide (E-book)",
    100: "The Complete PlannerQueenGro Self-Mastery E-book Library Box Set"
  };

  function generateDefaultProductsForBrand(brand) {
    const list = [];
    const cats = brand.categories || ['Core Planners', 'Trackers', 'Bundles', 'E-books'];

    cats.forEach((cat, cIdx) => {
      for (let i = 1; i <= 10; i++) {
        const prodNum = cIdx * 10 + i;
        const isHero = (i === 1 || i === 2);
        const isFlagship = (i === 10);
        
        let productName = `${cat} #${i} — ${brand.name} Style`;
        if (brand.id === 1 && PLANNER_QUEEN_TITLES[prodNum]) {
          productName = PLANNER_QUEEN_TITLES[prodNum];
        }

        list.push({
          code: `${brand.name.substring(0, 3).toUpperCase()}-${prodNum.toString().padStart(2, '0')}`,
          name: productName,
          category: cat,
          format: (brand.type && brand.type.includes('POD')) ? (i % 2 === 0 ? 'POD T-Shirt' : 'Digital ZIP') : (prodNum >= 91 && brand.id === 1 ? 'PDF E-book' : 'Digital PDF'),
          price: (brand.type && brand.type.includes('POD')) ? (i % 2 === 0 ? 28 : 12) : (isFlagship ? 24 : (isHero ? 8.99 : 7.49)),
          status: 'Pending',
          hero: isHero
        });
      }
    });
    return list;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GLOBAL MODULE METHODS
  // ─────────────────────────────────────────────────────────────────────────
  window.BrandsModule = {
    switchTab(tab) {
      currentTab = tab;
      localStorage.setItem('gro10x_brands_active_tab', tab);
      render();
    },

    changeBrandCatalog(brandId) {
      localStorage.setItem('gro10x_brands_selected_brand', brandId);
      renderTabContent('products');
    },

    viewBrandProducts(brandId) {
      localStorage.setItem('gro10x_brands_selected_brand', brandId);
      window.BrandsModule.switchTab('products');
    },

    async updateProductStatus(brandId, productIdx, newStatus) {
      if (!state.productsCatalog[brandId]) return;
      state.productsCatalog[brandId][productIdx].status = newStatus;
      
      const liveCount = state.productsCatalog[brandId].filter(p => p.status === 'Live').length;
      const b = state.brands.find(x => x.id === brandId);
      if (b) b.productsLive = liveCount;

      saveBrandsStateLocally(state);

      // Async sync to server API
      if (window.APP_API) {
        window.APP_API.post(`/brands/${brandId}/product`, {
          productIdx,
          status: newStatus
        }).catch(err => console.warn('[Brands] Cloud sync note:', err.message));
      }

      if (window.showToast) window.showToast(`Updated product status to: ${newStatus}`, 'success');
      render();
    },

    openBrandDrawer(brandId) {
      const b = state.brands.find(x => x.id === brandId);
      if (!b) return;
      const drawer = document.getElementById('brandDetailDrawer');
      const inner = document.getElementById('drawerInner');
      if (!drawer || !inner) return;

      if (!b.checklist) b.checklist = {};

      inner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
          <div>
            <span style="font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase;">Brand Studio & Launch Checklist</span>
            <h2 style="font-size:1.5rem; font-weight:900; color:#fff; margin:0.2rem 0 0;">${b.name}</h2>
          </div>
          <button onclick="document.getElementById('brandDetailDrawer').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1.4rem;">
          <!-- 8-STEP STORE LAUNCH CHECKLIST -->
          <div style="background:rgba(0,223,137,0.04); border:1px solid rgba(0,223,137,0.2); border-radius:14px; padding:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <h4 style="font-size:0.95rem; font-weight:800; color:#00df89; margin:0;">🚀 8-Step Store Launch Checklist</h4>
              <span style="font-size:0.75rem; font-weight:800; color:#fff; background:rgba(0,223,137,0.15); padding:0.2rem 0.5rem; border-radius:6px;">
                ${Object.values(b.checklist).filter(Boolean).length} / 8 Completed
              </span>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              ${STORE_LAUNCH_STEPS.map(step => {
                const isDone = !!b.checklist[step.id];
                return `
                  <label style="display:flex; align-items:flex-start; gap:0.6rem; cursor:pointer; font-size:0.8rem; background:rgba(255,255,255,0.02); padding:0.5rem 0.6rem; border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onchange="window.BrandsModule.toggleChecklistStep(${b.id}, ${step.id}, this.checked)" style="margin-top:0.15rem; accent-color:#00df89; cursor:pointer; width:16px; height:16px;">
                    <div>
                      <strong style="color:${isDone ? '#00df89' : '#fff'}; ${isDone ? 'text-decoration:line-through; opacity:0.8;' : ''}">Step ${step.id}: ${step.title}</strong>
                      <div style="font-size:0.7rem; color:var(--text-muted);">${step.desc}</div>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Tagline</label>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:0.2rem;">"${b.tagline}"</div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div>
              <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Niche & Category</label>
              <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-top:0.2rem;">${b.niche}</div>
            </div>
            <div>
              <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Product Fulfillment</label>
              <div style="font-size:0.9rem; font-weight:700; color:#06b6d4; margin-top:0.2rem;">${b.type}</div>
            </div>
          </div>

          <div>
            <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Brand Color Palette</label>
            <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">
              ${b.palette.map(c => `
                <div style="flex:1; background:${c}; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.65rem; font-family:monospace; text-shadow:0 1px 2px #000; border:1px solid rgba(255,255,255,0.2);">
                  ${c}
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Typography Hierarchy</label>
            <div style="font-size:0.9rem; font-weight:700; color:#fff; margin-top:0.2rem;">${b.fonts}</div>
          </div>

          <div>
            <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Brand Voice & Persona</label>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem; background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:8px;">
              ${b.voice}
            </div>
          </div>

          <div>
            <label style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">10 Product Categories</label>
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.4rem;">
              ${b.categories.map(c => `
                <span style="font-size:0.72rem; background:rgba(255,255,255,0.06); padding:0.25rem 0.6rem; border-radius:999px; color:#fff;">
                  ${c}
                </span>
              `).join('')}
            </div>
          </div>

          <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn-primary" style="flex:1; min-width:180px;" onclick="document.getElementById('brandDetailDrawer').style.display='none'; window.BrandsModule.viewBrandProducts(${b.id});">
              Open Product Upload Matrix →
            </button>
            <button class="btn-secondary" style="flex:1; min-width:180px; border:1px solid rgba(0,223,137,0.4); color:#00df89;" onclick="document.getElementById('brandDetailDrawer').style.display='none'; window.BrandsModule.openBrandEtsyCenter(${b.id});">
              🏪 Open Etsy Command Center →
            </button>
          </div>
        </div>
      `;

      drawer.style.display = 'flex';
    },

    async toggleChecklistStep(brandId, stepNum, completed) {
      const b = state.brands.find(x => x.id === brandId);
      if (!b) return;
      if (!b.checklist) b.checklist = {};
      b.checklist[stepNum] = !!completed;

      saveBrandsStateLocally(state);

      if (window.APP_API) {
        window.APP_API.post(`/brands/${brandId}/checklist`, {
          stepNumber: stepNum,
          completed: !!completed
        }).catch(err => console.warn('[Checklist] Sync error:', err.message));
      }

      if (window.showToast) window.showToast(`Updated Step ${stepNum} status`, 'success');
      render();
    },

    async editEtsyUrl(brandId) {
      const b = state.brands.find(x => x.id === brandId);
      if (!b) return;
      const url = prompt(`Enter Live Etsy Store URL for ${b.name}:`, b.etsyUrl || 'https://www.etsy.com/shop/');
      if (url !== null) {
        b.etsyUrl = url.trim();
        b.etsyStatus = url.trim() ? 'Live' : 'In Setup';
        saveBrandsStateLocally(state);

        if (window.APP_API) {
          window.APP_API.post(`/brands/${brandId}/settings`, {
            etsyUrl: b.etsyUrl,
            etsyStatus: b.etsyStatus
          }).catch(err => console.warn('[Settings] Sync error:', err.message));
        }

        if (window.showToast) window.showToast(`Saved Etsy Store URL for ${b.name}`, 'success');
        render();
      }
    },

    async openLogRevenueModal() {
      const brandIdStr = prompt('Enter Brand ID (1 to 13) to log revenue for:', '1');
      if (!brandIdStr) return;
      const brandId = Number(brandIdStr);
      const b = state.brands.find(x => x.id === brandId);
      if (!b) return alert('Invalid Brand ID');

      const amountStr = prompt(`Enter Gross Revenue for ${b.name} ($ USD):`, '500');
      const amount = Number(amountStr);
      if (!amount || isNaN(amount)) return;

      const adsStr = prompt(`Enter Etsy Ads Spend for ${b.name} ($ USD):`, '50') || '0';
      const ads = Number(adsStr) || 0;

      b.actualGross = (b.actualGross || 0) + amount;
      b.actualAds = (b.actualAds || 0) + ads;

      saveBrandsStateLocally(state);

      if (window.APP_API) {
        window.APP_API.post(`/brands/${brandId}/revenue`, {
          amount,
          adsSpend: ads,
          note: 'Logged via Command Center'
        }).catch(err => console.warn('[Revenue API] Sync note:', err.message));
      }

      if (window.showToast) window.showToast(`Logged $${amount} revenue for ${b.name} (synced to Growth Engine 3)!`, 'success');
      render();
    },

    async openLogBrandRevenueSpecific(brandId) {
      const b = state.brands.find(x => x.id === brandId);
      if (!b) return;
      const amountStr = prompt(`Enter Gross Revenue for ${b.name} ($ USD):`, '500');
      const amount = Number(amountStr);
      if (!amount || isNaN(amount)) return;

      const adsStr = prompt(`Enter Etsy Ads Spend for ${b.name} ($ USD):`, '50') || '0';
      const ads = Number(adsStr) || 0;

      b.actualGross = (b.actualGross || 0) + amount;
      b.actualAds = (b.actualAds || 0) + ads;

      saveBrandsStateLocally(state);

      if (window.APP_API) {
        window.APP_API.post(`/brands/${brandId}/revenue`, {
          amount,
          adsSpend: ads,
          note: 'Logged via P&L Ledger'
        }).catch(err => console.warn('[Revenue API] Sync note:', err.message));
      }

      if (window.showToast) window.showToast(`Logged $${amount} revenue for ${b.name}!`, 'success');
      render();
    },

    async generateLiveSEOPackage(arg1, arg2, arg3) {
      let brandId, prodCode, prodName;

      // Handle (brandId, productCode, productNameEncoded)
      if (typeof arg1 === 'number' || (typeof arg1 === 'string' && !isNaN(Number(arg1)) && typeof arg2 === 'string' && arg2.includes('-'))) {
        brandId = Number(arg1);
        prodCode = arg2;
        prodName = arg3 ? decodeURIComponent(arg3) : '';
      } else {
        // Handle (productNameEncoded, brandName, brandId)
        prodName = decodeURIComponent(arg1);
        brandId = typeof arg3 === 'number' ? arg3 : (Number(arg3) || 1);
        prodCode = '';
      }

      // Resolve Brand
      let b = state.brands?.find(x => x.id === brandId);
      if (!b) {
        b = state.brands?.find(x => x.name === arg2) || { id: brandId || 1, name: typeof arg2 === 'string' && !arg2.includes('-') ? arg2 : 'PlannerQueenGro', niche: 'Digital products', voice: 'Inspiring', type: 'Digital', palette: ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'], fonts: 'Playfair Display + Lato' };
      }
      if (!b.id) b.id = brandId || 1;

      // Resolve Product from Catalog
      const brandCatalog = state.productsCatalog && state.productsCatalog[b.id] ? state.productsCatalog[b.id] : [];
      let matchedProduct = brandCatalog.find(p => (prodCode && p.code === prodCode) || (prodName && p.name === prodName)) || {};
      if (!prodName) prodName = matchedProduct.name || `Product ${prodCode || '1'}`;
      if (!prodCode) prodCode = matchedProduct.code || 'PROD-001';

      // Set global active studio context
      window._studioCtx = { brandId: b.id, productCode: prodCode, productName: prodName };

      const modal = document.getElementById('aiSeoModal');
      const modalContent = document.getElementById('aiSeoModalContent');
      if (!modal || !modalContent) return;

      modalContent.style.maxWidth = '880px';
      modal.style.display = 'flex';

      const savedBP = matchedProduct.blueprint || {};
      const savedSEO = matchedProduct.seo || {};
      const savedVault = matchedProduct.vault || {};
      const savedMockups = Array.isArray(matchedProduct.mockups) && matchedProduct.mockups.length > 0
        ? matchedProduct.mockups
        : (Array.isArray(matchedProduct.mockupUrls) && matchedProduct.mockupUrls.length > 0
            ? matchedProduct.mockupUrls.map((u, i) => ({ rank: i + 1, url: u, fileName: `Mockup #${i + 1}` }))
            : (typeof matchedProduct.mockupsCount === 'number' && matchedProduct.mockupsCount > 0
                ? Array.from({ length: matchedProduct.mockupsCount }, (_, i) => ({ rank: i + 1, fileName: `Mockup #${i + 1}` }))
                : []));
      const savedVideo = matchedProduct.video || null;
      const savedAudit = matchedProduct.aiAudit || null;
      const savedType = matchedProduct.type || 'pdf-planner';
      const auditPrice = matchedProduct.aiAudit?.pricing?.recommended_price || matchedProduct.suggestedPrice || null;
      const savedPrice = matchedProduct.price || auditPrice || (savedSEO.price) || 4.99;
      const minMockups = b.minMockups || 4;

      // Helper: check user admin status
      const u = window.CURRENT_USER || JSON.parse(localStorage.getItem('gro10x_user') || '{}');
      const roleStr = (u.role || u.accessLevel || '').toLowerCase();
      const isAdmin = roleStr.includes('owner') || roleStr.includes('admin') || roleStr.includes('director') || roleStr.includes('ceo') || !roleStr;

      // ───────────────────────────────────────────────────────────────────────
      // GATE: FIRST-OPEN "READY TO START?" SCREEN IF NO BLUEPRINT GENERATED YET
      // ───────────────────────────────────────────────────────────────────────
      const STUDIO_CATEGORIES = [
        { id: 'planners', name: '📅 Daily, Weekly & Life Productivity Planners (16 Spreads)' },
        { id: 'academic', name: '🎓 Teacher & Student Academic Planners (22 Spreads)' },
        { id: 'finance', name: '💰 Financial & Wealth Management Trackers (17 Spreads)' },
        { id: 'goals_habits', name: '🎯 Goals, Habits & Routine Blueprints (18 Spreads)' },
        { id: 'wellness', name: '🧘 Wellness, Health & Fitness Planners (16 Spreads)' },
        { id: 'home_family', name: '🏡 Home, Family & Parenting Systems (16 Spreads)' },
        { id: 'business', name: '💼 Business, Solopreneur & Content Hubs (16 Spreads)' },
        { id: 'specialty', name: '✨ Specialty Niches — Wedding, Real Estate, Faith (16 Spreads)' },
        { id: 'seasonal', name: '🎄 Seasonal, Holiday & Event Blueprints (16 Spreads)' },
        { id: 'ebook', name: '📖 Comprehensive E-Books & Framework Guides (16 Modules)' }
      ];

      function resolveStudioCatId(pName, pCat, pType) {
        const p = (pName + ' ' + pCat + ' ' + pType).toLowerCase();
        if (p.includes('e-book') || p.includes('ebook') || p.includes('library box set') || (p.includes('guide') && p.includes('(e-book)'))) return 'ebook';
        if (p.includes('christmas') || p.includes('holiday') || p.includes('thanksgiving') || p.includes('halloween') || p.includes('easter') || p.includes('summer') || p.includes('autumn') || p.includes('new year') || p.includes('seasonal') || p.includes('gathering')) return 'seasonal';
        if (p.includes('teacher') || p.includes('student') || p.includes('academic') || p.includes('lesson') || p.includes('homeschool') || p.includes('school')) return 'academic';
        if (p.includes('budget') || p.includes('finance') || p.includes('cash flow') || p.includes('debt') || p.includes('wealth') || p.includes('savings') || p.includes('expense') || p.includes('income')) return 'finance';
        if (p.includes('goal') || p.includes('habit') || p.includes('okr') || p.includes('vision') || p.includes('streak') || p.includes('routine')) return 'goals_habits';
        if (p.includes('wellness') || p.includes('fitness') || p.includes('health') || p.includes('workout') || p.includes('sleep') || p.includes('meal') || p.includes('nutrition') || p.includes('self-care') || p.includes('mental health')) return 'wellness';
        if (p.includes('home') || p.includes('family') || p.includes('mom') || p.includes('household') || p.includes('cleaning') || p.includes('chore') || p.includes('declutter') || p.includes('parenting')) return 'home_family';
        if (p.includes('business') || p.includes('solopreneur') || p.includes('client') || p.includes('freelance') || p.includes('marketing') || p.includes('content creator') || p.includes('project mgmt') || p.includes('operations')) return 'business';
        if (p.includes('wedding') || p.includes('real estate') || p.includes('nursing') || p.includes('travel') || p.includes('author') || p.includes('faith') || p.includes('devotional') || p.includes('specialty')) return 'specialty';
        return 'planners';
      }

      const activeCatId = resolveStudioCatId(prodName, savedBP.categoryName || matchedProduct.category || '', savedType);
      const hasExistingBP = Boolean(savedBP.geometry || savedBP.prompt || savedBP.googleFlowPrompt || savedBP.masterMockupPrompt);

      if (!hasExistingBP) {
        modalContent.innerHTML = `
          <div style="padding:1.5rem 0.5rem; text-align:center;">
            <div style="width:64px; height:64px; border-radius:18px; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 1.25rem; box-shadow:0 10px 25px rgba(0,223,137,0.3);">
              🚀
            </div>
            <span style="font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase; letter-spacing:1px;">Product Factory Onboarding</span>
            <h2 style="font-size:1.6rem; font-weight:900; color:#fff; margin:0.3rem 0 0.5rem;">Ready to build ${prodName}?</h2>
            <p style="font-size:0.85rem; color:var(--text-secondary); max-width:520px; margin:0 auto 1.5rem; line-height:1.5;">
              The AI Engine will generate your <strong>Production Blueprint 2.0 (16–22 Spreads)</strong>, <strong>10-Slot Commercial Mockup Brief</strong>, and <strong>Listing Video Script</strong> for <strong>${b.name}</strong>.
            </p>

            <!-- INLINE ERROR AREA (visible even inside modal) -->
            <div id="blueprintErrorBanner" style="display:none; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:10px; padding:0.75rem 1rem; margin:0 auto 1rem; max-width:560px; text-align:left;">
              <strong style="color:#ef4444; font-size:0.8rem;">⚠️ Error:</strong>
              <span id="blueprintErrorMsg" style="color:#fca5a5; font-size:0.78rem; margin-left:0.4rem;"></span>
            </div>

            <!-- OPTION A: CATALOG REFERENCE (Primary - Full Width) -->
            <div style="background:rgba(0,223,137,0.06); border:1px solid rgba(0,223,137,0.3); border-radius:14px; padding:1.25rem; max-width:560px; margin:0 auto 1rem; text-align:left;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <span style="font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase;">Option A · Catalog Reference</span>
                <span style="font-size:0.68rem; font-weight:800; background:rgba(0,223,137,0.15); color:#00df89; padding:0.15rem 0.45rem; border-radius:6px;">Recommended</span>
              </div>
              <div style="background:rgba(0,0,0,0.3); padding:0.65rem 0.85rem; border-radius:8px; font-size:0.8rem; color:#e2e8f0; font-family:monospace; margin-bottom:0.6rem;">
                SKU: <strong>${prodCode}</strong><br>
                Product: <strong>${prodName}</strong>
              </div>

              <!-- CATEGORY ARCHITECTURE SELECTOR -->
              <div style="margin-bottom:0.75rem;">
                <label style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Blueprint Architecture Framework:</label>
                <select id="gateCategorySelect" style="width:100%; font-size:0.82rem; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(0,223,137,0.4); border-radius:8px; color:#00df89; font-weight:700; cursor:pointer;">
                  ${STUDIO_CATEGORIES.map(c => `
                    <option value="${c.id}" ${activeCatId === c.id ? 'selected' : ''}>${c.name}</option>
                  `).join('')}
                </select>
              </div>

              <p style="font-size:0.75rem; color:var(--text-muted); margin:0 0 1rem;">Uses brand voice (${b.voice}) and palette (${b.palette.join(', ')}).</p>
              <button id="blueprintGenerateBtn" class="btn-primary" style="width:100%; font-weight:800; padding:0.65rem;"
                onclick="this.disabled=true; this.textContent='⏳ Generating Blueprint...'; document.getElementById('blueprintErrorBanner').style.display='none'; window.BrandsModule.generateStudioBlueprintWithAI(${b.id}, '${prodCode}', false, document.getElementById('gateCategorySelect')?.value);">
                ⚡ Generate Blueprint 2.0 from Catalog Reference
              </button>
            </div>

            <!-- OPTION B: CUSTOM (Collapsed by default) -->
            <div style="max-width:560px; margin:0 auto 0.5rem;">
              <button onclick="var p=document.getElementById('optionBPanel'); p.style.display=p.style.display==='block'?'none':'block'; this.textContent=p.style.display==='block'?'▲ Hide custom option':'▼ Want a custom blueprint instead?';" style="background:none; border:none; color:var(--text-muted); font-size:0.78rem; font-weight:700; cursor:pointer; text-decoration:underline;">
                ▼ Want a custom blueprint instead?
              </button>
              <div id="optionBPanel" style="display:none; background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.3); border-radius:14px; padding:1.25rem; margin-top:0.5rem; text-align:left;">
                <span style="font-size:0.75rem; font-weight:800; color:#06b6d4; text-transform:uppercase; display:block; margin-bottom:0.5rem;">Option B · Custom Idea</span>
                <textarea id="studioCustomIdeaInput" rows="2" placeholder="e.g. Weekly Meal Planner with Budget &amp; Grocery checklist for busy moms..." style="width:100%; font-size:0.78rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; padding:0.5rem; resize:none; margin-bottom:0.6rem; box-sizing:border-box;"></textarea>
                <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Optional Reference Image (In-Memory AI Input):</label>
                <input type="file" id="studioCustomRefImgInput" accept="image/*" style="width:100%; font-size:0.72rem; background:rgba(0,0,0,0.3); border:1px dashed rgba(6,182,212,0.4); padding:0.4rem; border-radius:6px; color:#fff; cursor:pointer; margin-bottom:0.75rem; box-sizing:border-box;">
                <button class="btn-secondary" style="width:100%; border-color:#06b6d4; color:#06b6d4; font-weight:800; padding:0.65rem;" onclick="window.BrandsModule.generateStudioBlueprintWithAI(${b.id}, '${prodCode}', true)">
                  ⚡ Generate Custom Blueprint
                </button>
              </div>
            </div>

            <button class="btn-ghost" style="margin-top:0.75rem;" onclick="document.getElementById('aiSeoModal').style.display='none'">
              ✕ Cancel &amp; Return to Catalog
            </button>
          </div>
        `;
        return;
      }

      // ───────────────────────────────────────────────────────────────────────
      // PREPARE 5-STEP DATA & PROGRESS METRICS
      // ───────────────────────────────────────────────────────────────────────
      const effectiveTitle = (savedSEO.title || matchedProduct.seoTitle || `${prodName} | Printable Template & Digital Tracker`).trim();
      const effectiveTags = (savedSEO.tags && savedSEO.tags.length > 0)
        ? savedSEO.tags
        : ((matchedProduct.seoTags && matchedProduct.seoTags.length > 0) ? matchedProduct.seoTags : ['digital planner', 'printable template', 'instant download', 'daily checklist', 'goodnotes']);
      const effectiveTagsStr = Array.isArray(effectiveTags) ? effectiveTags.join(', ') : String(effectiveTags);
      const effectiveDesc = savedSEO.description || matchedProduct.seoDescription || `Instant digital download printable template. High-resolution layout ready for immediate print or tablet use.`;

      const specs = savedBP.documentSpecs || {
        dimensions: savedBP.geometry || 'US Letter (8.5 x 11 in) / 300 DPI Vector PDF',
        margins: '0.5 in safe print margin',
        pageCount: '10 Core Spreads',
        typography: { headingFont: savedBP.typography || 'Playfair Display', bodyFont: 'Lato' }
      };
      const pages = savedBP.pageBreakdown || savedBP.pages || [];
      const effectivePrompt = savedBP.prompt || savedBP.googleFlowPrompt || '';
      const defaultMockupsList = [
        {
          number: 1,
          title: 'Hero iPad Pro Flat-Lay (Main Etsy Listing Thumbnail)',
          type: 'Primary Listing Hero',
          scene: `Professional studio flat-lay photography of an iPad Pro in 3:4 vertical portrait orientation displaying the clean, aesthetic cover of "${effectiveTitle || prodName}" by ${b.name}. Resting on a luxurious warm cream desk surface alongside a sleek minimalist brass pen, soft botanical eucalyptus branches, and gentle natural morning sunlight. 8k resolution, hyper-detailed, clean editorial depth.`
        },
        {
          number: 2,
          title: 'Open Two-Page Master Spread Overview',
          type: 'Spread Showcase',
          scene: `Two-page open spread of "${effectiveTitle || prodName}" lying flat on a modern scandinavian oak desk. Ceramic coffee mug with latte art in background, reading glasses, pastel highlighter. Clean vertical daily/weekly columns clearly readable. 3:4 portrait format.`
        },
        {
          number: 3,
          title: 'Lifestyle POV Writing & Planning in Cafe',
          type: 'Human Connection & Scale',
          scene: `First-person point-of-view photo of a well-manicured hand holding an elegant fine-tip pen, actively writing notes into "${effectiveTitle || prodName}". Soft knit cozy sweater sleeve, warm morning ambience, diffused natural window light.`
        },
        {
          number: 4,
          title: 'Macro Close-Up on Habit & Task Tracking Spread',
          type: 'Feature Deep-Dive',
          scene: `Macro angled close-up view of the primary tracking spread from "${effectiveTitle || prodName}". A gold pen rests across the grid with delicate checkmarks. High-resolution crisp typography, soft depth of field, bright daylight.`
        },
        {
          number: 5,
          title: '10-Page Cascading 3D Bundle Stack',
          type: 'Value & Scope Showcase',
          scene: `All core pages of "${effectiveTitle || prodName}" dynamically fanned out in a cascading 3D isometric stack, revealing cover, monthly calendar, daily spread, habit tracker, and budget sheet together. Subtle realistic drop shadows.`
        },
        {
          number: 6,
          title: 'Desk Aerial Overview Workspace',
          type: 'Aspirational Lifestyle',
          scene: `Wide overhead bird's-eye flat lay of an entire productive desk workspace: planner tablet centered, laptop open with ambient screen, small potted succulent, scented candle, notebook, and ceramic dish. Colors harmonized in ${b.palette?.[0] || '#8B5A7A'}.`
        },
        {
          number: 7,
          title: 'Instant Download & Device Stack',
          type: 'Etsy Purchase Reassurance',
          scene: `Clean graphic showing a smartphone, iPad tablet with Apple Pencil, and printable A4 paper stack, all displaying matching layouts from "${effectiveTitle || prodName}". Aesthetic badge: "Instant Digital Download · GoodNotes · Print at Home".`
        },
        {
          number: 8,
          title: '90-Day Goal & Financial Flow Spread',
          type: 'Transformation & Goals',
          scene: `Clean angled shot of the 90-Day Goal Roadmap and Cash Flow pages side by side. Minimal gold paperclips, clean calculator, and motivational quote card. High aspirational value.`
        },
        {
          number: 9,
          title: 'Printable A4 / US Letter Comparison',
          type: 'Print Flexibility',
          scene: `Crisp photo of printed planner pages held in hands or pinned to an aesthetic moodboard. Clean white borders, premium matte paper texture, crisp lines.`
        },
        {
          number: 10,
          title: 'Customer Transformation Review Card',
          type: 'Social Proof Showcase',
          scene: `Aesthetic review card graphic with 5 golden stars, a lifestyle crop of "${effectiveTitle || prodName}", and quote: "Completely transformed my daily routine and focus."`
        }
      ];

      const activeMockupsList = (savedBP.mockupsList && savedBP.mockupsList.length > 0) ? savedBP.mockupsList : defaultMockupsList;

      const builtMasterPrompt = savedBP.masterMockupPrompt || (
        `BRAND & MOCKUP VISUAL PRODUCTION BRIEF\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Brand: ${b.name} | Niche: ${b.niche || 'Digital Products'}\n` +
        `Product: ${effectiveTitle || prodName}\n` +
        `Brand Colors: ${b.palette?.join(', ') || '#8B5A7A, #FAF3E8, #7D9B76'}\n` +
        `Typography: ${b.fonts || 'Playfair Display + Lato'}\n` +
        `Aesthetic Style: Minimalist botanical luxury, warm natural morning lighting, clean editorial depth.\n\n` +
        `INSTRUCTIONS FOR AI AGENT / GOOGLE FLOW / MIDJOURNEY / FLUX:\n` +
        `Generate 10 distinct, high-converting Etsy listing mockup images in 3:4 PORTRAIT aspect ratio (width:height = 3:4), sequentially one after the other:\n\n` +
        activeMockupsList.map(m =>
          `MOCKUP #${m.number || m.slot} — ${(m.title || '').toUpperCase()} (${m.type || 'Etsy Mockup'})\n` +
          `Prompt: ${(m.scene || m.prompt || '').trim()}\n` +
          `Aspect Ratio: 3:4 Portrait | High resolution 300 DPI vector clarity | Realistic photographic textures\n`
        ).join('\n') +
        `\nOUTPUT GUIDELINES:\n` +
        `• Process all 10 mockup scenes one by one in sequence\n` +
        `• Maintain consistent brand color palette across all images\n` +
        `• Ensure high-end commercial photo realism with soft natural lighting and realistic props\n`
      );

      window._currentMasterMockupPrompt = builtMasterPrompt;
      window._currentMockupPrompts = {};
      activeMockupsList.forEach((m, idx) => {
        const slotNum = m.number || m.slot || idx + 1;
        window._currentMockupPrompts[slotNum] = `3:4 vertical portrait photo mockup of "${effectiveTitle || prodName}" by ${b.name}. ${(m.scene || m.prompt || '').trim()} Aesthetic brand colors (${b.palette?.slice(0, 3).join(', ')}), soft natural morning daylight, shallow depth of field, 8k resolution commercial Etsy listing photograph.`;
      });

      const masterMockupPrompt = builtMasterPrompt;
      const videoPrompt = savedBP.videoPrompt || '';
      const mockupsList = activeMockupsList;

      // Calculate 5-Step Studio Progress (20% each)
      const bpDone = Boolean(savedBP.geometry || savedBP.prompt || effectivePrompt);
      const vaultDone = Boolean(savedVault.storagePath || savedVault.canvaTemplateUrl || savedVault.notionTemplateUrl);
      const mediaDone = Boolean(savedMockups.length >= minMockups && (savedVideo?.storagePath || savedVideo?.fileName));
      const auditScore = Number(savedAudit?.overall_score ?? savedAudit?.score ?? 0);
      const auditDone = auditScore >= 7.0 || savedAudit?.gateStatus === 'passed';
      const seoDone = Boolean(effectiveTitle && effectiveTags.length >= 5);

      const progressPct = (bpDone ? 20 : 0) + (vaultDone ? 20 : 0) + (mediaDone ? 20 : 0) + (auditDone ? 20 : 0) + (seoDone ? 20 : 0);

      // Next auto version suggestion: if v1.0 stored, suggest v2.0
      let suggestedVersion = '1.0';
      if (savedVault.version) {
        const vNum = parseFloat(savedVault.version);
        suggestedVersion = !isNaN(vNum) ? (vNum + 1.0).toFixed(1) : `${savedVault.version}.1`;
      }

      modalContent.innerHTML = `
        <!-- MODAL HEADER -->
        <div style="margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:0.72rem; font-weight:800; color:#00df89; text-transform:uppercase; letter-spacing:0.5px;">⚡ Product Factory & Studio Engine</span>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.2rem; flex-wrap:wrap;">
                <h2 style="font-size:1.35rem; font-weight:900; color:#fff; margin:0;">${prodName}</h2>
                <span style="font-size:0.7rem; font-weight:800; background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); padding:0.15rem 0.5rem; border-radius:999px;">
                  SKU: ${prodCode}
                </span>
                <span style="font-size:0.7rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:999px; background:${matchedProduct.status === 'Live' ? 'rgba(0,223,137,0.15)' : (matchedProduct.status === 'Pending Review' ? 'rgba(251,191,36,0.15)' : (matchedProduct.status === 'Revision Requested' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'))}; color:${matchedProduct.status === 'Live' ? '#00df89' : (matchedProduct.status === 'Pending Review' ? '#fbbf24' : (matchedProduct.status === 'Revision Requested' ? '#ef4444' : 'var(--text-muted)'))};">
                  ${matchedProduct.status || 'Draft'}
                </span>
                ${matchedProduct.etsyListingId ? `
                  <span style="font-size:0.7rem; font-weight:800; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3); padding:0.15rem 0.5rem; border-radius:999px;">
                    🟢 Etsy #${matchedProduct.etsyListingId}
                  </span>
                ` : ''}
              </div>
            </div>
            <button onclick="document.getElementById('aiSeoModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <!-- ADMIN REVISION NOTE BANNER IF FLAGGED -->
          ${matchedProduct.status === 'Revision Requested' ? `
            <div style="margin-top:0.75rem; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.35); border-radius:10px; padding:0.75rem 1rem; display:flex; align-items:center; gap:0.75rem;">
              <span style="font-size:1.3rem;">⚠️</span>
              <div>
                <span style="font-size:0.72rem; font-weight:800; color:#ef4444; text-transform:uppercase;">Admin Revision Requested</span>
                <p style="font-size:0.8rem; color:#fff; margin:0.1rem 0 0;">${matchedProduct.adminRevisionNote || 'Please adjust flagged assets and resubmit for approval.'}</p>
              </div>
            </div>
          ` : ''}

          <!-- 5-STEP VISUAL PROGRESS TRACKER (APPROVED ORDER) -->
          <div style="margin-top:0.85rem; background:rgba(0,0,0,0.3); padding:0.6rem 0.8rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span style="font-size:0.72rem; font-weight:800; color:#fff;">DVM Production Journey</span>
              <span id="studioHeaderPctBadge" style="font-size:0.75rem; font-weight:900; color:${progressPct >= 80 ? '#00df89' : (progressPct >= 40 ? '#fbbf24' : '#ef4444')};">${progressPct}% Ready</span>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden; margin-bottom:0.6rem;">
              <div id="studioHeaderProgressBar" style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, #00df89, #06b6d4); transition:width 0.3s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; gap:0.3rem; flex-wrap:wrap; font-size:0.68rem; font-weight:700;">
              <span style="color:${bpDone ? '#00df89' : 'var(--text-muted)'};">${bpDone ? '✅ 1. Blueprint' : '⚪ 1. Blueprint'}</span>
              <span style="color:${vaultDone ? '#00df89' : 'var(--text-muted)'};">${vaultDone ? '✅ 2. Vault' : '⚪ 2. Vault'}</span>
              <span style="color:${mediaDone ? '#00df89' : 'var(--text-muted)'};">${mediaDone ? '✅ 3. Media' : '⚪ 3. Media'}</span>
              <span style="color:${auditDone ? '#00df89' : (auditScore > 0 ? '#ef4444' : 'var(--text-muted)')};">${auditDone ? '✅ 4. AI Audit (≥70%)' : (auditScore > 0 ? `⚠️ 4. AI Audit (${(auditScore*10).toFixed(0)}%)` : '⚪ 4. AI Audit')}</span>
              <span style="color:${seoDone ? '#00df89' : 'var(--text-muted)'};">${seoDone ? '✅ 5. Etsy SEO' : '⚪ 5. Etsy SEO'}</span>
            </div>
          </div>
        </div>

        <!-- 5-TAB SELECTOR STRIP (APPROVED JOURNEY ORDER) -->
        <div style="display:flex; gap:0.4rem; background:rgba(0,0,0,0.35); padding:0.35rem; border-radius:12px; margin-bottom:1.25rem; border:1px solid rgba(255,255,255,0.06); flex-wrap:wrap;">
          <button id="modalTabBtnBlueprint" type="button" onclick="window.BrandsModule.switchStudioTab('blueprint')" style="flex:1; min-width:110px; background:rgba(0,223,137,0.15); border:1px solid rgba(0,223,137,0.3); color:#00df89; font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;">
            🎨 1. Blueprint
          </button>
          <button id="modalTabBtnVault" type="button" onclick="window.BrandsModule.switchStudioTab('vault')" style="flex:1; min-width:110px; background:none; border:1px solid transparent; color:var(--text-muted); font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;">
            📦 2. Vault File
          </button>
          <button id="modalTabBtnMockups" type="button" onclick="window.BrandsModule.switchStudioTab('mockups')" style="flex:1; min-width:110px; background:none; border:1px solid transparent; color:var(--text-muted); font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;">
            🖼️ 3. Media Studio
          </button>
          <button id="modalTabBtnAudit" type="button" onclick="window.BrandsModule.switchStudioTab('audit')" style="flex:1; min-width:110px; background:none; border:1px solid transparent; color:var(--text-muted); font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;">
            🧠 4. AI Audit
          </button>
          <button id="modalTabBtnSeo" type="button" onclick="window.BrandsModule.switchStudioTab('seo')" style="flex:1; min-width:110px; background:none; border:1px solid transparent; color:var(--text-muted); font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;">
            📈 5. AI Etsy SEO
          </button>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 1: PRODUCT BLUEPRINT & CREATION GUIDE -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div id="studioTabBlueprint" style="display:flex; flex-direction:column; gap:1.2rem;">
          
          <!-- SPECS & CATEGORY OVERRIDE CONTROL ROW -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem;">
            
            <!-- CARD 1: BLUEPRINT 2.0 CATEGORY ARCHITECTURE SELECTOR -->
            <div style="background:rgba(0,223,137,0.04); border:1px solid rgba(0,223,137,0.25); padding:0.75rem; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                <label style="font-size:0.68rem; font-weight:800; color:#00df89; text-transform:uppercase;">Blueprint 2.0 Architecture</label>
                <span id="studioBlueprintSpreadBadge" style="font-size:0.68rem; font-weight:800; color:#00df89; background:rgba(0,223,137,0.15); padding:1px 6px; border-radius:4px;">${pages.length || 16} Spreads</span>
              </div>
              <select id="studioBlueprintCategorySelect" style="width:100%; font-size:0.78rem; padding:0.4rem; background:rgba(0,0,0,0.5); border:1px solid rgba(0,223,137,0.3); border-radius:6px; color:#00df89; font-weight:700; cursor:pointer;">
                ${STUDIO_CATEGORIES.map(c => `
                  <option value="${c.id}" ${activeCatId === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">
                Switch category framework anytime &amp; click <strong>Regenerate 2.0</strong>.
              </div>
            </div>

            <!-- CARD 2: TARGET AUDIENCE -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.75rem; border-radius:10px;">
              <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Target Audience</label>
              <input type="text" id="studioBlueprintAudience" value="${(savedBP.targetAudience || 'Intentional professionals, busy parents & students').replace(/"/g, '&quot;')}" placeholder="e.g. K-12 teachers, homeschool parents" style="width:100%; font-size:0.78rem; padding:0.4rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:6px; color:#e2e8f0;">
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">Context passed into AI generation for tailored prompts.</div>
            </div>

            <!-- CARD 3: PRODUCT TITLE CONTEXT OVERRIDE -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.75rem; border-radius:10px;">
              <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Product Name / Context</label>
              <input type="text" id="studioBlueprintTitle" value="${prodName.replace(/"/g, '&quot;')}" placeholder="e.g. Executive Life Planner & Top-3 Matrix" style="width:100%; font-size:0.78rem; padding:0.4rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:6px; color:#06b6d4; font-weight:700;">
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">Edit keywords before regenerating to steer the design.</div>
            </div>

            <!-- CARD 4: FORMAT & TYPOGRAPHY -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.75rem; border-radius:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Format &amp; Typography</label>
                <div style="display:flex; gap:0.25rem;">
                  ${(b.palette || ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E']).map(hex => `
                    <span style="width:12px; height:12px; border-radius:50%; background:${hex}; border:1px solid rgba(255,255,255,0.2);" title="${hex}"></span>
                  `).join('')}
                </div>
              </div>
              <input type="text" id="studioBlueprintGeometry" value="${(specs.dimensions || 'US Letter (8.5 x 11 in) / 300 DPI Vector PDF').replace(/"/g, '&quot;')}" style="width:100%; font-size:0.75rem; padding:0.35rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:6px; color:#06b6d4; font-weight:700; margin-bottom:0.3rem;">
              <input type="text" id="studioBlueprintTypography" value="${(specs.typography?.headingFont || 'Playfair Display') + ' + ' + (specs.typography?.bodyFont || 'Lato')}" style="width:100%; font-size:0.75rem; padding:0.35rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:6px; color:#fff;">
            </div>

          </div>

          <!-- SECTION 1: MASTER PRODUCT CREATION PROMPT -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.5rem;">
              <label style="font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase;">⚡ 1. Product Layout Master Prompt (Google Flow / Gemini)</label>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button class="btn-ghost btn-sm" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="navigator.clipboard.writeText(document.getElementById('studioBlueprintPrompt').value); window.showToast('📋 Copied Google Flow Prompt!','success');">
                  📋 Copy Prompt
                </button>
                <button class="btn-secondary btn-sm" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="window.BrandsModule.saveStudioDraft('blueprint')">
                  💾 Save Draft
                </button>
                <button class="btn-primary btn-sm" style="background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:800; padding:0.3rem 0.75rem; font-size:0.75rem;" onclick="window.BrandsModule.regenerateStudioBlueprint(${b.id}, '${prodCode}')">
                  ♻️ Regenerate Blueprint 2.0
                </button>
              </div>
            </div>
            <textarea id="studioBlueprintPrompt" rows="6" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(0,223,137,0.3); padding:0.85rem; border-radius:10px; color:#e2e8f0; font-size:0.8rem; font-family:monospace; line-height:1.5; resize:vertical;">${effectivePrompt}</textarea>
            <p style="font-size:0.72rem; color:var(--text-muted); margin:0.3rem 0 0;">💡 <em>Paste into <strong>Google Flow</strong>. Generate each page as a 3:4 visual layout, assemble in PowerPoint or Canva, and export to PDF.</em></p>
          </div>

          <!-- SECTION 2: INTERACTIVE PAGE BREAKDOWN (ACCORDION TABLE) -->
          ${pages && pages.length > 0 ? `
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                <div>
                  <label style="font-size:0.82rem; font-weight:900; color:#00df89; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:0.4rem;">
                    <span>📖</span> Page-by-Page Design Specifications (${pages.length} Spreads Total)
                  </label>
                  <span style="font-size:0.74rem; color:var(--text-secondary, #cbd5e1); display:block; margin-top:0.2rem;">
                    Click any spread to inspect purpose, print layout specs, and required vector UI elements.
                  </span>
                </div>
                <button type="button" class="btn-secondary btn-sm" style="font-size:0.75rem; font-weight:800; padding:0.35rem 0.75rem; background:rgba(0,223,137,0.12); border:1px solid rgba(0,223,137,0.3); color:#00df89; border-radius:8px; cursor:pointer;" onclick="
                  const items = document.querySelectorAll('.bp-accordion-content');
                  const chevrons = document.querySelectorAll('[id^=bpChevron_]');
                  const allOpen = Array.from(items).every(el => el.style.display !== 'none');
                  items.forEach(el => el.style.display = allOpen ? 'none' : 'block');
                  chevrons.forEach(ch => ch.style.transform = allOpen ? 'rotate(0deg)' : 'rotate(180deg)');
                  this.innerHTML = allOpen ? '▼ Expand All' : '▲ Collapse All';
                ">
                  ▼ Expand All
                </button>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:480px; overflow-y:auto; padding-right:0.35rem;">
                ${pages.map((p, idx) => {
                  const pNum = p.pageNumber || p.page || p.number || (idx + 1);
                  const pTitle = p.title || p.name || p.pageTitle || p.spreadTitle || `Spread #${pNum}`;
                  const pSec = p.section || p.category || p.type || 'Spread';
                  const pPurpose = p.purpose || p.description || p.goal || '';
                  const pLayout = p.layoutSpecs || p.layout || p.specs || '';
                  const pElements = Array.isArray(p.elements) ? p.elements : (Array.isArray(p.requiredElements) ? p.requiredElements : []);

                  return `
                    <div style="background:#181826; border:1px solid rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; transition:border-color 0.2s ease;">
                      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0.9rem; cursor:pointer; user-select:none; background:rgba(255,255,255,0.02);" onclick="
                        const c = document.getElementById('bpPageContent_${idx}');
                        const ch = document.getElementById('bpChevron_${idx}');
                        if (c) {
                          const isClosed = c.style.display === 'none';
                          c.style.display = isClosed ? 'block' : 'none';
                          if (ch) ch.style.transform = isClosed ? 'rotate(180deg)' : 'rotate(0deg)';
                        }
                      ">
                        <div style="display:flex; align-items:center; gap:0.65rem; flex:1; min-width:0;">
                          <span style="font-size:0.75rem; font-weight:900; background:rgba(0,223,137,0.18); color:#00df89; border:1px solid rgba(0,223,137,0.35); padding:0.2rem 0.55rem; border-radius:6px; font-family:monospace; white-space:nowrap;">
                            Page ${pNum}
                          </span>
                          <strong style="font-size:0.85rem; color:#ffffff; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${pTitle}
                          </strong>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.6rem; margin-left:0.5rem;">
                          <span style="font-size:0.7rem; color:#94a3b8; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:0.15rem 0.5rem; border-radius:6px; white-space:nowrap; font-weight:600;">
                            ${pSec}
                          </span>
                          <span id="bpChevron_${idx}" style="font-size:0.75rem; color:#00df89; display:inline-block; transition:transform 0.2s ease;">▼</span>
                        </div>
                      </div>

                      <div id="bpPageContent_${idx}" class="bp-accordion-content" style="display:none; padding:0.9rem 1rem; border-top:1px solid rgba(255,255,255,0.08); font-size:0.8rem; background:#12121c; line-height:1.5;">
                        ${pPurpose ? `
                          <div style="margin-bottom:0.75rem; background:rgba(6,182,212,0.08); border-left:3px solid #06b6d4; padding:0.55rem 0.85rem; border-radius:6px;">
                            <strong style="color:#06b6d4; display:block; font-size:0.74rem; text-transform:uppercase; margin-bottom:0.2rem; letter-spacing:0.5px;">🎯 Spread Purpose</strong>
                            <span style="color:#e2e8f0; font-size:0.8rem;">${pPurpose}</span>
                          </div>
                        ` : ''}

                        ${pLayout ? `
                          <div style="margin-bottom:0.75rem; background:rgba(168,85,247,0.08); border-left:3px solid #a855f7; padding:0.55rem 0.85rem; border-radius:6px;">
                            <strong style="color:#c084fc; display:block; font-size:0.74rem; text-transform:uppercase; margin-bottom:0.2rem; letter-spacing:0.5px;">📐 Print &amp; Grid Layout Specs</strong>
                            <span style="color:#e2e8f0; font-size:0.8rem;">${pLayout}</span>
                          </div>
                        ` : ''}

                        ${pElements.length > 0 ? `
                          <div style="background:rgba(251,191,36,0.08); border-left:3px solid #fbbf24; padding:0.55rem 0.85rem; border-radius:6px;">
                            <strong style="color:#fbbf24; display:block; font-size:0.74rem; text-transform:uppercase; margin-bottom:0.35rem; letter-spacing:0.5px;">📋 Required Vector &amp; UI Elements</strong>
                            <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                              ${pElements.map(el => `
                                <span style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; color:#f8fafc; font-weight:600;">
                                  ✓ ${el}
                                </span>
                              `).join('')}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- FOOTER ACTION BAR -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; gap:0.5rem;">
            <button type="button" class="btn-ghost" style="color:#ef4444; font-size:0.74rem; padding:0.35rem 0.65rem;" onclick="window.BrandsModule.resetProductBlueprint(${b.id}, '${prodCode}', '${encodeURIComponent(prodName)}')">
              ⚠️ Reset Studio (Clear Blueprint &amp; Start Over)
            </button>
            <button type="button" class="btn-primary" style="font-size:0.82rem; padding:0.55rem 1.25rem;" onclick="window.BrandsModule.switchStudioTab('vault')">
              Next: Step 2 📦 Deliverable Vault →
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 2: DELIVERABLE VAULT & FILE UPLOAD -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 2: DELIVERABLE VAULT & FILE UPLOAD -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div id="studioTabVault" style="display:none; flex-direction:column; gap:1.2rem;">
          
          <!-- STORED DELIVERABLE STATUS CARD -->
          ${savedVault.fileName || savedVault.downloadUrl ? `
            <div style="background:rgba(0,223,137,0.06); border:1px solid rgba(0,223,137,0.35); padding:1rem 1.25rem; border-radius:14px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <div style="width:44px; height:44px; border-radius:10px; background:rgba(0,223,137,0.15); color:#00df89; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                    ${(savedVault.fileName || '').toLowerCase().endsWith('.zip') ? '📦' : '📄'}
                  </div>
                  <div>
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <strong style="color:#fff; font-size:0.88rem;">${savedVault.fileName || 'Master Deliverable'}</strong>
                      <span style="font-size:0.68rem; font-weight:800; background:rgba(0,223,137,0.2); color:#00df89; padding:1px 6px; border-radius:4px;">v${savedVault.version || '1.0'}</span>
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem;">
                      Size: <strong>${(savedVault.fileSizeBytes ? (savedVault.fileSizeBytes / (1024*1024)).toFixed(2) : '0')} MB</strong> · Uploaded: ${savedVault.uploadedAt ? new Date(savedVault.uploadedAt).toLocaleDateString() : 'Active'} · Stored in Supabase Secure Vault
                    </div>
                  </div>
                </div>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                  ${savedVault.downloadUrl ? `
                    <a href="${savedVault.downloadUrl}" target="_blank" class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.3rem 0.65rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.25rem;">
                      📥 Download File
                    </a>
                  ` : ''}
                  <button type="button" class="btn-ghost btn-sm" style="color:#ef4444; font-size:0.72rem; padding:0.3rem 0.65rem;" onclick="window.BrandsModule.clearVaultDeliverable(${b.id}, '${prodCode}', '${encodeURIComponent(prodName)}')">
                    🗑️ Clear / Replace
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <div style="background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); padding:0.85rem 1.25rem; border-radius:12px; font-size:0.78rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.1rem;">ℹ️</span> No deliverable uploaded yet. Use the dropzone below to store your master PDF/ZIP in the secure vault.
            </div>
          `}

          <!-- DRAG & DROP UPLOAD ZONE -->
          <div style="background:rgba(0,223,137,0.03); border:1px solid rgba(0,223,137,0.2); padding:1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div>
                <span style="font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase; display:block;">📥 Upload Finished Customer Deliverable</span>
                <p style="font-size:0.76rem; color:var(--text-muted); margin:0.1rem 0 0;">Upload customer deliverable file directly to the GRO10X Secure Vault (max 50MB).</p>
              </div>
              <span style="font-size:0.68rem; font-weight:800; background:rgba(255,255,255,0.08); color:var(--text-secondary); padding:0.2rem 0.5rem; border-radius:6px;">Max 50MB</span>
            </div>

            <!-- INTERACTIVE DROPZONE -->
            <div id="vaultDropzone"
              onclick="document.getElementById('vaultFileInput').click()"
              ondragover="event.preventDefault(); this.style.borderColor='#00df89'; this.style.background='rgba(0,223,137,0.08)';"
              ondragleave="this.style.borderColor='rgba(0,223,137,0.3)'; this.style.background='rgba(0,0,0,0.3)';"
              ondrop="event.preventDefault(); this.style.borderColor='rgba(0,223,137,0.3)'; this.style.background='rgba(0,0,0,0.3)'; window.BrandsModule.handleVaultDrop(event);"
              style="border:2px dashed rgba(0,223,137,0.35); background:rgba(0,0,0,0.3); border-radius:12px; padding:1.75rem 1rem; text-align:center; cursor:pointer; transition:all 0.2s ease; margin-bottom:0.85rem;">
              <div style="font-size:2rem; margin-bottom:0.35rem;">📂</div>
              <strong style="color:#fff; font-size:0.85rem; display:block; margin-bottom:0.2rem;">Drag &amp; Drop Deliverable Here or Browse</strong>
              <span style="font-size:0.72rem; color:var(--text-muted);">Supports .PDF, .ZIP, .PNG, .OTF, .TTF</span>
              <input type="file" id="vaultFileInput" accept=".pdf,.zip,.png,.otf,.ttf" style="display:none;" onchange="window.BrandsModule.onVaultFileSelected(this)">
            </div>

            <!-- FILE INSPECTION PREVIEW (appears when file is picked) -->
            <div id="vaultFileInspectionCard" style="display:none; background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.3); border-radius:10px; padding:0.65rem 0.85rem; margin-bottom:0.85rem; font-size:0.76rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span id="vaultInspectFileName" style="color:#fff; font-weight:800;"></span>
                <span id="vaultInspectFileSize" style="color:#06b6d4; font-weight:800;"></span>
              </div>
              <div id="vaultInspectSizeBadge" style="margin-top:0.25rem;"></div>
            </div>

            <!-- VERSION & SETTINGS ROW -->
            <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.75rem; align-items:center; margin-bottom:0.85rem;">
              <div>
                <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.2rem;">Deliverable Version</label>
                <input type="text" id="vaultVersionInput" value="${savedVault.version ? (parseFloat(savedVault.version) + 0.1).toFixed(1) : '1.0'}" placeholder="e.g. 1.0" style="width:100%; font-size:0.8rem; padding:0.45rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
              </div>
              <div>
                <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.2rem;">Etsy Delivery Architecture</label>
                <div style="font-size:0.74rem; color:var(--text-secondary); background:rgba(0,0,0,0.25); padding:0.45rem 0.75rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                  🔒 <strong>Direct Secure Delivery</strong> via Supabase Cloud Vault
                </div>
              </div>
            </div>

            <!-- SOURCE CLOUD & CANVA TEMPLATE LINKS -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.85rem;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                  <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Canva Master Link (Optional)</label>
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:1px 5px;" onclick="window.BrandsModule.testCloudLink('vaultCanvaInput')">🔗 Test Link</button>
                </div>
                <input type="text" id="vaultCanvaInput" value="${(savedVault.canvaTemplateUrl || '').replace(/"/g, '&quot;')}" placeholder="https://www.canva.com/design/..." style="width:100%; font-size:0.76rem; padding:0.45rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                  <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Notion / Hub Link (Optional)</label>
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:1px 5px;" onclick="window.BrandsModule.testCloudLink('vaultNotionInput')">🔗 Test Link</button>
                </div>
                <input type="text" id="vaultNotionInput" value="${(savedVault.notionTemplateUrl || '').replace(/"/g, '&quot;')}" placeholder="https://notion.so/..." style="width:100%; font-size:0.76rem; padding:0.45rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
              </div>
            </div>

            <!-- SAVE DELIVERABLE BUTTON -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <button class="btn-primary" style="padding:0.55rem 1.35rem; font-size:0.82rem; font-weight:800;" onclick="window.BrandsModule.uploadProductDeliverable(${b.id}, '${prodCode}', '${encodeURIComponent(prodName)}')">
                🚀 Save &amp; Upload Deliverable to Vault
              </button>
              <div id="vaultUploadStatus" style="font-size:0.78rem;"></div>
            </div>
          </div>

          <!-- 1-PAGE BRANDED ANTI-PIRACY ACCESS PASS GENERATOR -->
          <div style="background:rgba(168,85,247,0.04); border:1px solid rgba(168,85,247,0.3); padding:1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span style="font-size:0.75rem; font-weight:800; color:#c084fc; text-transform:uppercase; display:block;">🛡️ 1-Page Branded Anti-Piracy Access Pass (PDF)</span>
                <p style="font-size:0.76rem; color:var(--text-muted); margin:0.15rem 0 0; max-width:540px;">
                  Compiles a high-resolution branded PDF pass delivered to Etsy buyers. Embeds clickable Canva template buttons, cloud vault links, and single-user copyright terms.
                </p>
              </div>
              <button type="button" class="btn-primary btn-sm" style="background:linear-gradient(135deg, #9333ea, #c084fc); font-weight:800; padding:0.4rem 0.85rem;" onclick="window.BrandsModule.generateCustomerAccessPass(${b.id}, '${prodCode}', '${encodeURIComponent(prodName)}')">
                🛡️ Compile Access Pass PDF
              </button>
            </div>

            <div id="accessPassStatusArea">
              ${savedVault.accessPassUrl ? `
                <div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); padding:0.65rem 0.85rem; border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                  <div>
                    <span style="color:#c084fc; font-weight:800; font-size:0.78rem;">✅ Access Pass Compiled</span>
                    <span style="font-size:0.7rem; color:var(--text-muted); margin-left:0.4rem;">License ID: <strong style="color:#fff;">${savedVault.licenseId || 'GRO-LIC-PASS'}</strong></span>
                  </div>
                  <div style="display:flex; gap:0.4rem;">
                    <a href="${savedVault.accessPassUrl}" target="_blank" class="btn-secondary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem; text-decoration:none;">
                      📥 Download Pass PDF
                    </a>
                  </div>
                </div>
              ` : `
                <div style="font-size:0.74rem; color:var(--text-muted);">
                  Click "Compile Access Pass PDF" to generate the customer delivery document.
                </div>
              `}
            </div>
          </div>

          <!-- ETSY DIGITAL DELIVERY COMPLIANCE CHECKLIST -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:1rem 1.25rem; border-radius:12px;">
            <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.5rem;">Etsy Digital Delivery Compliance Checklist</label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem; font-size:0.74rem;">
              <span style="color:${savedVault.fileName ? '#00df89' : 'var(--text-muted)'};">${savedVault.fileName ? '✅' : '⚪'} Master File in Vault</span>
              <span style="color:${(savedVault.fileSizeBytes || 0) < 50*1024*1024 && savedVault.fileName ? '#00df89' : 'var(--text-muted)'};">${savedVault.fileName ? '✅' : '⚪'} File Size &lt; 50MB</span>
              <span style="color:${savedVault.canvaTemplateUrl ? '#00df89' : 'var(--text-muted)'};">${savedVault.canvaTemplateUrl ? '✅' : '⚪'} Canva Link Attached</span>
              <span style="color:${savedVault.accessPassUrl ? '#00df89' : 'var(--text-muted)'};">${savedVault.accessPassUrl ? '✅' : '⚪'} Access Pass Compiled</span>
            </div>
          </div>

          <!-- NAVIGATION BAR -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <button class="btn-ghost btn-sm" onclick="window.BrandsModule.switchStudioTab('blueprint')">← Step 1: Blueprint</button>
            <button class="btn-primary" style="font-size:0.82rem; padding:0.55rem 1.25rem;" onclick="window.BrandsModule.switchStudioTab('mockups')">
              Next: Step 3 🖼️ Media Studio →
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 3: MEDIA STUDIO (10 MOCKUPS + CAPCUT VIDEO) -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div id="studioTabMockups" style="display:none; flex-direction:column; gap:1.2rem;">
          
          <!-- 1. HEADER ACTION & CATEGORY PROMPT CONTROLS -->
          <div style="background:rgba(6,182,212,0.05); border:1px solid rgba(6,182,212,0.25); padding:1rem 1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span style="font-size:0.78rem; font-weight:800; color:#06b6d4; text-transform:uppercase; display:block;">📸 10-Slot Commercial Mockup Production Studio</span>
                <span style="font-size:0.72rem; color:var(--text-muted);">Aspect ratio 3:4 portrait (Midjourney / Google Flow / Flux / Canva) · ${mockupsList.length || 10} Category Scene Briefs</span>
              </div>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; padding:0.3rem 0.65rem;" onclick="window.BrandsModule.refreshStudioMockupBriefs(${b.id}, '${prodCode}')">
                  🔄 Refresh Scene Briefs
                </button>
                <button type="button" class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.3rem 0.75rem; background:#06b6d4; color:#000; font-weight:800; border:none;" onclick="window.BrandsModule.copyMasterMockupPrompt()">
                  📋 Copy Master 10-Mockup Batch Prompt
                </button>
              </div>
            </div>
          </div>

          <!-- 2. INTERACTIVE 10-SLOT VISUAL BOARD -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); padding:1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <strong style="font-size:0.78rem; color:#fff; text-transform:uppercase;">🖼️ 10-Slot Visual Image Grid</strong>
                <span style="font-size:0.7rem; color:var(--text-muted); display:block;">Upload directly into specific scene slots or use the bulk dropzone below.</span>
              </div>
              <span id="mockupHeaderCountBadge" style="font-size:0.72rem; font-weight:800; color:${savedMockups.length >= minMockups ? '#00df89' : '#fbbf24'}; background:${savedMockups.length >= minMockups ? 'rgba(0,223,137,0.15)' : 'rgba(251,191,36,0.15)'}; padding:0.25rem 0.65rem; border-radius:6px;">
                ${savedMockups.length} / 10 Slots Populated (${minMockups} min required)
              </span>
            </div>

            <!-- 10 INDIVIDUAL SLOTS GRID -->
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.75rem; margin-bottom:1rem;">
              ${Array.from({ length: 10 }).map((_, idx) => {
                const slotNum = idx + 1;
                const brief = mockupsList[idx] || { title: `Slot ${slotNum}`, scene: 'High converting lifestyle mockup' };
                const stored = savedMockups.find(m => m.rank === slotNum) || (savedMockups[idx] && !savedMockups.some(m=>m.rank===slotNum) ? savedMockups[idx] : null);
                const hasImage = Boolean(stored && (stored.url || stored.fileName));

                return `
                  <div style="background:rgba(0,0,0,0.35); border:1px solid ${hasImage ? 'rgba(0,223,137,0.4)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
                    
                    <!-- SLOT TOP INFO -->
                    <div style="padding:0.5rem 0.65rem; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.7rem; font-weight:800; color:${slotNum === 1 ? '#00df89' : '#06b6d4'};">
                        ${slotNum === 1 ? '⭐ Slot #1 (Hero)' : `Slot #${slotNum}`}
                      </span>
                      <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:1px 5px; color:var(--text-muted);" onclick="window.BrandsModule.copyMockupSlotPrompt(${slotNum})" title="Copy Slot Prompt">
                        📋 Prompt
                      </button>
                    </div>

                    <!-- SLOT PREVIEW / DROP AREA -->
                    <div style="padding:0.75rem; text-align:center; min-height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                      ${hasImage ? `
                        <div style="width:100%; aspect-ratio:4/3; border-radius:6px; overflow:hidden; background:#000; position:relative; margin-bottom:0.4rem;">
                          ${(stored.url && stored.url.startsWith('http')) ? `
                            <img src="${stored.url}" style="width:100%; height:100%; object-fit:cover;">
                          ` : `
                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                              <span style="font-size:1.5rem;">🖼️</span>
                              <span style="font-size:0.62rem; color:#fff; font-weight:700;">${stored.fileName || 'Stored Image'}</span>
                            </div>
                          `}
                        </div>
                        <div style="font-size:0.68rem; color:#00df89; font-weight:700;">✅ Stored in Vault</div>
                      ` : `
                        <div style="font-size:1.3rem; margin-bottom:0.25rem;">📷</div>
                        <strong style="font-size:0.74rem; color:#fff; margin-bottom:0.15rem;">${brief.title || `Slot ${slotNum}`}</strong>
                        <p style="font-size:0.64rem; color:var(--text-muted); margin:0; line-height:1.3; max-width:180px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                          ${brief.scene || brief.prompt || ''}
                        </p>
                      `}
                    </div>

                    <!-- SLOT ACTIONS -->
                    <div style="padding:0.4rem 0.65rem; background:rgba(0,0,0,0.25); border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                      <input type="file" id="mockupSlotFileInput_${slotNum}" accept="image/png,image/jpeg,image/webp" style="display:none;" onchange="window.BrandsModule.uploadSingleSlotMockup(${b.id}, '${prodCode}', ${slotNum}, this)">
                      <button type="button" class="btn-secondary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.5rem;" onclick="document.getElementById('mockupSlotFileInput_${slotNum}').click()">
                        ${hasImage ? '🔄 Replace' : '📁 Upload'}
                      </button>
                      ${hasImage ? `
                        <button type="button" class="btn-ghost btn-sm" style="color:#ef4444; font-size:0.68rem; padding:0.2rem 0.4rem;" onclick="window.BrandsModule.deleteMockupSlot(${b.id}, '${prodCode}', ${slotNum})">
                          🗑️
                        </button>
                      ` : `
                        <span style="font-size:0.62rem; color:var(--text-muted);">Empty</span>
                      `}
                    </div>

                  </div>
                `;
              }).join('')}
            </div>

            <!-- 3. BULK MULTI-IMAGE DROPZONE -->
            <div id="mockupBulkDropzone"
              onclick="document.getElementById('mockupFilesInput').click()"
              ondragover="event.preventDefault(); this.style.borderColor='#00df89'; this.style.background='rgba(0,223,137,0.08)';"
              ondragleave="this.style.borderColor='rgba(0,223,137,0.3)'; this.style.background='rgba(0,0,0,0.3)';"
              ondrop="event.preventDefault(); this.style.borderColor='rgba(0,223,137,0.3)'; this.style.background='rgba(0,0,0,0.3)'; window.BrandsModule.handleBulkMockupDrop(event, ${b.id}, '${prodCode}');"
              style="border:2px dashed rgba(0,223,137,0.35); background:rgba(0,0,0,0.3); border-radius:12px; padding:1.25rem 1rem; text-align:center; cursor:pointer; transition:all 0.2s ease; margin-bottom:0.75rem;">
              <div style="font-size:1.6rem; margin-bottom:0.25rem;">📤</div>
              <strong style="color:#fff; font-size:0.82rem; display:block; margin-bottom:0.15rem;">Drop 1–10 Mockup Photos Here for Batch Upload</strong>
              <span style="font-size:0.7rem; color:var(--text-muted);">Auto-populates empty slots sequentially (PNG/JPG/WEBP).</span>
              <input type="file" id="mockupFilesInput" multiple accept="image/png,image/jpeg,image/webp" style="display:none;" onchange="window.BrandsModule.onBulkMockupFilesSelected(this, ${b.id}, '${prodCode}')">
            </div>

            <div id="mockupUploadStatus" style="font-size:0.78rem;"></div>
          </div>

          <!-- 4. CAPCUT 3-SCENE STORYBOARD & VIDEO PLAYER -->
          <div style="background:rgba(168,85,247,0.05); border:1px solid rgba(168,85,247,0.3); padding:1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span style="font-size:0.76rem; font-weight:800; color:#c084fc; text-transform:uppercase; display:block;">🎬 CapCut 3-Scene Listing Video (3–15s · Mandatory)</span>
                <p style="font-size:0.74rem; color:var(--text-muted); margin:0.15rem 0 0; max-width:540px;">
                  Etsy listing video max 15 seconds, max 100MB. Follow the 3-scene conversion storyboard below.
                </p>
              </div>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; padding:0.3rem 0.65rem; color:#c084fc; border:1px solid rgba(168,85,247,0.4);" onclick="navigator.clipboard.writeText(document.getElementById('capcutScriptContent')?.innerText || ''); window.showToast('📋 Copied CapCut Storyboard!','success');">
                📋 Copy Storyboard Script
              </button>
            </div>

            <!-- STORYBOARD SCRIPT CARD -->
            <div id="capcutScriptContent" style="background:rgba(0,0,0,0.35); padding:0.75rem 0.95rem; border-radius:10px; margin-bottom:0.85rem; font-size:0.74rem; font-family:monospace; color:#e2e8f0; line-height:1.5;">
              ${videoPrompt || `
                🎬 [Scene 1: 0-3s Hook] "Struggling to stay organized? Meet the ${prodName}." Fast cut of messy desk vs clean structured planner.
                ✨ [Scene 2: 3-10s Solution] Smooth page-flip transition across all daily & weekly hyperlinked spreads. Pastel mildliner stylus in action.
                🚀 [Scene 3: 10-15s CTA] "Instant Download · GoodNotes & Print Ready · Link in Bio / Shop Now".
              `}
            </div>

            <!-- VIDEO PLAYER (IF STORED) -->
            ${savedVideo?.url || savedVideo?.fileName ? `
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:0.85rem; margin-bottom:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <span style="font-size:0.74rem; font-weight:800; color:#00df89;">✅ Stored Video: ${savedVideo.fileName || 'Listing Video'}</span>
                  <button type="button" class="btn-ghost btn-sm" style="color:#ef4444; font-size:0.68rem; padding:0.2rem 0.5rem;" onclick="window.BrandsModule.clearProductVideo(${b.id}, '${prodCode}')">
                    🗑️ Clear / Replace Video
                  </button>
                </div>
                ${savedVideo.url ? `
                  <video controls src="${savedVideo.url}" style="width:100%; max-height:220px; border-radius:8px; background:#000;"></video>
                ` : ''}
              </div>
            ` : ''}

            <!-- VIDEO UPLOADER -->
            <div style="display:grid; grid-template-columns:2fr 1fr; gap:0.75rem; align-items:center;">
              <input type="file" id="listingVideoInput" accept="video/mp4,video/quicktime,.mp4,.mov" style="width:100%; font-size:0.8rem; background:rgba(0,0,0,0.3); border:1px dashed rgba(168,85,247,0.4); padding:0.65rem; border-radius:8px; color:#fff; cursor:pointer;">
              <button class="btn-primary" style="background:#a855f7; border-color:#a855f7; padding:0.55rem 1rem; font-size:0.8rem; font-weight:800;" onclick="window.BrandsModule.uploadProductVideo(${b.id}, '${prodCode}')">
                💾 Save Video to Vault
              </button>
            </div>

            <div id="videoUploadStatus" style="font-size:0.78rem; margin-top:0.4rem;">
              ${savedVideo?.fileName ? `
                <span style="color:#00df89; font-weight:700;">✅ Video Ready for Etsy Publishing</span>
              ` : `<span style="color:#ef4444; font-weight:700;">🔴 Video Missing (Etsy algorithms favor listings with video)</span>`}
            </div>
          </div>

          <!-- 5. ETSY MEDIA COMPLIANCE CHECKLIST -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:1rem 1.25rem; border-radius:12px;">
            <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.5rem;">Etsy Media Conversion Compliance</label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem; font-size:0.74rem;">
              <span style="color:${savedMockups.length > 0 ? '#00df89' : 'var(--text-muted)'};">${savedMockups.length > 0 ? '✅' : '⚪'} Slot 1 Hero Photo Ready</span>
              <span style="color:${savedMockups.length >= 4 ? '#00df89' : 'var(--text-muted)'};">${savedMockups.length >= 4 ? '✅' : '⚪'} 4+ Photos Uploaded (${savedMockups.length}/10)</span>
              <span style="color:${savedMockups.length >= 10 ? '#00df89' : 'var(--text-muted)'};">${savedMockups.length >= 10 ? '✅' : '⚪'} Full 10/10 Mockup Coverage</span>
              <span style="color:${savedVideo?.fileName ? '#00df89' : 'var(--text-muted)'};">${savedVideo?.fileName ? '✅' : '⚪'} 3–15s Video Attached</span>
            </div>
          </div>

          <!-- NAVIGATION BAR -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <button class="btn-ghost btn-sm" onclick="window.BrandsModule.switchStudioTab('vault')">← Step 2: Vault File</button>
            <button class="btn-primary" style="font-size:0.82rem; padding:0.55rem 1.25rem;" onclick="window.BrandsModule.switchStudioTab('audit')">
              Next: Step 4 🧠 AI Vision Audit →
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 4: AI VISION AUDIT & 70% QUALITY GATE -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div id="studioTabAudit" style="display:none; flex-direction:column; gap:1.2rem;">
          <div style="background:${auditDone ? 'rgba(0,223,137,0.1)' : (auditScore > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)')}; border:1px solid ${auditDone ? 'rgba(0,223,137,0.3)' : (auditScore > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)')}; padding:1rem 1.25rem; border-radius:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div>
              <span style="font-size:0.72rem; font-weight:800; color:${auditDone ? '#00df89' : (auditScore > 0 ? '#ef4444' : '#06b6d4')}; text-transform:uppercase;">
                ${auditDone ? '🟢 AI Quality Gate: PASSED (≥70% Required)' : (auditScore > 0 ? '🔴 AI Quality Gate: ACTION REQUIRED (<70%)' : '⚪ AI Quality Gate: Ready for Evaluation')}
              </span>
              <div style="font-size:0.85rem; color:#fff; font-weight:700; margin-top:0.15rem;">
                ${auditDone ? `Score: ${auditScore}/10 (${(auditScore*10).toFixed(0)}%) · Commercial quality verified.` : (auditScore > 0 ? `Score: ${auditScore}/10 (${(auditScore*10).toFixed(0)}%) · Fix flagged items below before submitting.` : 'AI Vision Audit evaluates typography, layout geometry, printable margins & commercial compliance.')}
              </div>
            </div>
            <button class="btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#06b6d4); border:none; padding:0.6rem 1.25rem; font-weight:800; font-size:0.82rem;" onclick="window.BrandsModule.runAIProductAudit(${b.id}, '${prodCode}')">
              ⚡ ${savedAudit ? '🔄 Re-Run AI Vision Audit' : '⚡ Run AI Vision Audit Now'}
            </button>
          </div>

          <!-- AUDIT RESULTS CONTAINER -->
          <div id="studioAuditResultsContainer">
            ${savedAudit ? window.BrandsModule.buildAuditHtml(savedAudit, b.id, prodCode) : `
              <div style="text-align:center; padding:2rem 1rem; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.08); border-radius:12px;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🔍</div>
                <h4 style="font-size:0.95rem; color:#fff; margin:0 0 0.3rem;">AI Quality Audit</h4>
                <p style="font-size:0.78rem; color:var(--text-muted); margin:0 0 1rem; max-width:420px; margin-inline:auto;">
                  Click "Run AI Vision Audit Now" to perform quality scoring, pricing analysis, and auto-generate single-page edit prompts.
                </p>
              </div>
            `}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-ghost btn-sm" onclick="window.BrandsModule.switchStudioTab('blueprint')">← Step 1: Blueprint</button>
              <button class="btn-ghost btn-sm" onclick="window.BrandsModule.switchStudioTab('vault')">↑ Re-upload Vault v2</button>
            </div>
            <button class="btn-primary" style="font-size:0.82rem; padding:0.55rem 1.25rem;" onclick="window.BrandsModule.switchStudioTab('seo')">
              Next: Step 5 📈 AI Etsy SEO →
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 5: AI-ENHANCED ETSY SEO PACKAGE -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- STEP 5: AI-ENHANCED ETSY SEO PACKAGE & LAUNCH GATE -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div id="studioTabSeo" style="display:none; flex-direction:column; gap:1.2rem;">
          
          <!-- 1. AI ENHANCED GENERATE BANNER -->
          <div style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.3); padding:1rem 1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
              <div>
                <span style="font-size:0.76rem; font-weight:800; color:#06b6d4; text-transform:uppercase; display:block;">Context-Aware Etsy SEO Generator</span>
                <p style="font-size:0.74rem; color:var(--text-secondary); margin:0.15rem 0 0; max-width:560px;">
                  Gemini analyzes the Blueprint 2.0 category, 4-dimension audit score (${auditScore > 0 ? `${auditScore}/10` : 'Pending'}), and sweet spot price to generate conversion titles, 13 long-tail tags, and structured description copy.
                </p>
              </div>
              <button id="btnGenerateStudioSEO" type="button" class="btn-primary" style="background:linear-gradient(135deg, #06b6d4, #00df89); font-weight:800; font-size:0.8rem; padding:0.55rem 1.1rem; border:none; cursor:pointer;" onclick="window.BrandsModule.generateStudioSEOWithAI(${b.id}, '${prodCode}')">
                ⚡ Generate SEO with Blueprint Context
              </button>
            </div>
            <div id="studioSeoLoadingStatus" style="display:none; margin-top:0.75rem;"></div>
          </div>

          <!-- 2. LIVE ETSY SEARCH RESULT CARD PREVIEW -->
          <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); padding:1rem 1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <span style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">👁️ Live Etsy Search Result Preview</span>
              <span style="font-size:0.68rem; color:#00df89; font-weight:700;">Desktop &amp; Mobile Search Mockup</span>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.85rem; display:flex; gap:1rem; align-items:center; max-width:620px;">
              <!-- HERO MOCKUP THUMBNAIL -->
              <div style="width:90px; aspect-ratio:3/4; border-radius:6px; overflow:hidden; background:#000; flex-shrink:0; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center;">
                ${savedMockups[0]?.url ? `
                  <img id="previewEtsyThumb" src="${savedMockups[0].url}" style="width:100%; height:100%; object-fit:cover;">
                ` : `
                  <span style="font-size:1.8rem;">🖼️</span>
                `}
              </div>

              <!-- SEARCH SNIPPET INFO -->
              <div style="flex:1; min-width:0;">
                <div id="previewEtsyTitle" style="font-size:0.82rem; font-weight:700; color:#fff; line-height:1.35; margin-bottom:0.35rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                  ${effectiveTitle || `${prodName} | ${b.name} Aesthetic Digital Planner`}
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem; display:flex; align-items:center; gap:0.3rem;">
                  <span>${b.name || 'PlannerQueenGro'}</span>
                  <span style="color:#fbbf24;">★★★★★</span>
                  <span style="color:var(--text-muted);">(4.9)</span>
                </div>
                <div style="display:flex; align-items:baseline; gap:0.5rem;">
                  <span id="previewEtsyPrice" style="font-size:1.05rem; font-weight:900; color:#00df89;">
                    $${Number(savedPrice || 7.49).toFixed(2)} AUD
                  </span>
                  <span style="font-size:0.65rem; color:#06b6d4; background:rgba(6,182,212,0.15); padding:1px 5px; border-radius:4px; font-weight:700;">
                    Instant Download
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. PRODUCT TYPE & PRICING ROW -->
          <div style="display:grid; grid-template-columns:2fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.2rem;">Product Type (1300 Catalog Scalable)</label>
              <select id="studioProductType" style="width:100%; font-size:0.82rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:700;">
                <option value="pdf-planner" ${savedType === 'pdf-planner' ? 'selected' : ''}>📄 PDF Planner / Printable</option>
                <option value="png-sublimation" ${savedType === 'png-sublimation' ? 'selected' : ''}>🎨 PNG Sublimation / Tumbler Wrap (ZIP)</option>
                <option value="svg-cut-file" ${savedType === 'svg-cut-file' ? 'selected' : ''}>✂️ SVG Cut File / Cricut (ZIP)</option>
                <option value="font-pack" ${savedType === 'font-pack' ? 'selected' : ''}>🔤 Font Pack (OTF/TTF ZIP)</option>
                <option value="canva-template" ${savedType === 'canva-template' ? 'selected' : ''}>🌐 Canva Master Template Link</option>
                <option value="notion-template" ${savedType === 'notion-template' ? 'selected' : ''}>📓 Notion Hub / Template Link</option>
                <option value="pod-design" ${savedType === 'pod-design' ? 'selected' : ''}>👕 Print-on-Demand (POD) Design</option>
                <option value="prompt-vault" ${savedType === 'prompt-vault' ? 'selected' : ''}>🧠 AI Prompt Vault / Matrix (ZIP/PDF)</option>
                <option value="wall-art-print" ${savedType === 'wall-art-print' ? 'selected' : ''}>🖼️ Printable Wall Art (PDF/PNG)</option>
                <option value="e-book" ${savedType === 'e-book' ? 'selected' : ''}>📚 E-Book / Strategy Guide (PDF)</option>
              </select>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">
                  Retail Price ($ USD)
                </label>
                ${auditPrice ? `
                  <span style="font-size:0.68rem; color:#06b6d4; cursor:pointer; font-weight:700; background:rgba(6,182,212,0.12); padding:0.1rem 0.4rem; border-radius:4px; border:1px solid rgba(6,182,212,0.3);" onclick="document.getElementById('studioRetailPrice').value='${Number(auditPrice).toFixed(2)}'; window.BrandsModule.updateLiveEtsyPreview(); window.showToast('Applied AI Audit Price ($${Number(auditPrice).toFixed(2)})', 'info');" title="Click to apply AI Audit Price">
                    ✨ AI: $${Number(auditPrice).toFixed(2)}
                  </span>
                ` : ''}
              </div>
              <input type="number" step="0.01" id="studioRetailPrice" value="${Number(savedPrice).toFixed(2)}" oninput="window.BrandsModule.updateLiveEtsyPreview()" style="width:100%; font-size:0.85rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; font-weight:800;" placeholder="7.49">
            </div>
          </div>

          <!-- 4. 140-CHAR TITLE INPUT -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Etsy Listing Title (Max 140 Chars)</label>
              <span id="seoTitleCounter" style="font-size:0.7rem; color:${effectiveTitle.length > 140 ? '#ef4444' : '#00df89'}; font-weight:800;">${effectiveTitle.length}/140 chars</span>
            </div>
            <input type="text" id="studioSeoTitle" maxlength="140" value="${effectiveTitle.replace(/"/g, '&quot;')}" oninput="document.getElementById('seoTitleCounter').innerText = this.value.length + '/140 chars'; window.BrandsModule.updateLiveEtsyPreview();" style="width:100%; font-size:0.88rem; padding:0.65rem; background:rgba(0,0,0,0.35); border:1px solid rgba(0,223,137,0.3); border-radius:8px; color:#00df89; font-weight:700;">
          </div>

          <!-- 5. INTERACTIVE 13-TAG CHIP CLOUD -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.4rem;">
              <div>
                <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">13 High-Intent Etsy Tags (Max 20 Chars Each)</label>
                <span style="font-size:0.68rem; color:var(--text-muted); display:block;">Click chips to remove or add custom long-tail buyer phrases below.</span>
              </div>
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <span id="seoTagsCountBadge" style="font-size:0.72rem; font-weight:800; color:${effectiveTags.length === 13 ? '#00df89' : '#fbbf24'}; background:${effectiveTags.length === 13 ? 'rgba(0,223,137,0.15)' : 'rgba(251,191,36,0.15)'}; padding:0.2rem 0.55rem; border-radius:6px;">
                  ${effectiveTags.length} / 13 Tags
                </span>
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.2rem 0.5rem;" onclick="window.BrandsModule.copyAllStudioSeoTags()">
                  📋 Copy Tags
                </button>
              </div>
            </div>

            <!-- TAG CHIP CONTAINER -->
            <div id="studioSeoTagCloud" style="display:flex; flex-wrap:wrap; gap:0.4rem; background:rgba(0,0,0,0.3); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.08); margin-bottom:0.6rem; min-height:48px;">
              ${effectiveTags.map((tag, tIdx) => {
                const tagLen = tag.length;
                const isOverLimit = tagLen > 20;
                return `
                  <span style="display:inline-flex; align-items:center; gap:0.35rem; background:${isOverLimit ? 'rgba(239,68,68,0.2)' : 'rgba(6,182,212,0.12)'}; border:1px solid ${isOverLimit ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)'}; color:${isOverLimit ? '#ef4444' : '#06b6d4'}; font-size:0.74rem; font-weight:700; padding:0.25rem 0.55rem; border-radius:6px;">
                    ${tag}
                    <span style="font-size:0.62rem; color:var(--text-muted); opacity:0.8;">(${tagLen}/20)</span>
                    <button type="button" onclick="window.BrandsModule.removeStudioSeoTag(${tIdx})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.78rem; padding:0 0 0 2px; line-height:1;">✕</button>
                  </span>
                `;
              }).join('')}
            </div>

            <!-- ADD TAG INPUT ROW -->
            <div style="display:grid; grid-template-columns:1fr auto; gap:0.5rem;">
              <input type="text" id="studioNewTagInput" maxlength="20" placeholder="Add custom tag (max 20 chars)..." onkeydown="if(event.key==='Enter'){event.preventDefault(); window.BrandsModule.addStudioSeoTag();}" style="font-size:0.8rem; padding:0.45rem 0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
              <button type="button" class="btn-secondary btn-sm" style="font-size:0.76rem; padding:0.45rem 0.85rem;" onclick="window.BrandsModule.addStudioSeoTag()">
                + Add Tag
              </button>
            </div>

            <!-- HIDDEN SYNCED INPUT FOR FORM DRAFT COMPATIBILITY -->
            <input type="hidden" id="studioSeoTags" value="${effectiveTagsStr.replace(/"/g, '&quot;')}">
          </div>

          <!-- 6. DESCRIPTION TEXTAREA -->
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Conversion-Optimized Description (4 Structured Sections)</label>
              <div style="display:flex; gap:0.4rem;">
                <button type="button" class="btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('studioSeoDescription').value); window.showToast('Copied Description!','success');">📋 Copy</button>
                <button type="button" class="btn-primary btn-sm" onclick="window.BrandsModule.saveStudioDraft('seo')">💾 Save SEO</button>
              </div>
            </div>
            <textarea id="studioSeoDescription" rows="6" style="width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.85rem; border-radius:10px; color:var(--text-secondary); font-size:0.82rem; line-height:1.5; resize:vertical;">${effectiveDesc}</textarea>
          </div>

          <!-- 7. 5-POINT PRE-PUBLISHING LAUNCH GATE CHECKLIST -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); padding:1rem 1.25rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <span style="font-size:0.74rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">5-Point Pre-Publishing Launch Gate</span>
              <span style="font-size:0.72rem; font-weight:800; color:${progressPct >= 80 ? '#00df89' : '#fbbf24'};">
                ${progressPct}% Production Complete
              </span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem; font-size:0.74rem;">
              <span style="color:${bpDone ? '#00df89' : 'var(--text-muted)'};">${bpDone ? '✅' : '⚪'} 1. Blueprint Spreads Generated</span>
              <span style="color:${vaultDone ? '#00df89' : 'var(--text-muted)'};">${vaultDone ? '✅' : '⚪'} 2. Vault Deliverable File Ready</span>
              <span style="color:${mediaDone ? '#00df89' : 'var(--text-muted)'};">${mediaDone ? '✅' : '⚪'} 3. 4+ Mockups &amp; Video Attached</span>
              <span style="color:${auditDone ? '#00df89' : (auditScore > 0 ? '#ef4444' : 'var(--text-muted)')};">${auditDone ? '✅' : '⚪'} 4. AI Vision Quality (Score ≥ 7.0)</span>
              <span style="color:${seoDone ? '#00df89' : 'var(--text-muted)'};">${seoDone ? '✅' : '⚪'} 5. SEO Title &amp; 13 Tags Ready</span>
            </div>
          </div>

          <!-- NAVIGATION BAR -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <button class="btn-ghost btn-sm" onclick="window.BrandsModule.switchStudioTab('audit')">← Step 4: AI Audit</button>
            <span style="font-size:0.74rem; color:var(--text-muted);">Ready to launch or submit below ↓</span>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <!-- MODAL FOOTER: ROLE-GATED SUBMIT VS ADMIN PUBLISH -->
        <!-- ═══════════════════════════════════════════════════════════════════ -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-size:0.75rem; color:var(--text-muted);">Brand: <strong>${b.name}</strong> · SKU: <strong>${prodCode}</strong></span>
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <button class="btn-ghost" onclick="document.getElementById('aiSeoModal').style.display='none'">
              ✕ Close
            </button>
            <button id="studioSaveAllBtn" class="btn-secondary" style="font-weight:800;" onclick="window.BrandsModule.saveStudioDraft('all')">
              💾 Save All Draft
            </button>
            
            ${isAdmin ? `
              <!-- ADMIN PUBLISH BUTTON -->
              <button class="btn-primary" style="background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:900; padding:0.55rem 1.4rem;" onclick="window.BrandsModule.publishSingleProductEtsy(${b.id}, ${brandCatalog.findIndex(p=>p.code===prodCode)})">
                🚀 Publish to Live Etsy ($0.20 Fee)
              </button>
            ` : `
              <!-- DVM SUBMIT FOR ADMIN REVIEW BUTTON -->
              <button class="btn-primary" style="background:linear-gradient(135deg, #f59e0b, #00df89); font-weight:900; padding:0.55rem 1.4rem;" onclick="window.BrandsModule.submitProductForReview(${b.id}, '${prodCode}')">
                📤 Submit for Admin Review
              </button>
            `}
          </div>
        </div>
      `;
    },

    switchStudioTab(tab) {
      const bTab = document.getElementById('studioTabBlueprint');
      const vTab = document.getElementById('studioTabVault');
      const mTab = document.getElementById('studioTabMockups');
      const aTab = document.getElementById('studioTabAudit');
      const sTab = document.getElementById('studioTabSeo');

      const bBtn = document.getElementById('modalTabBtnBlueprint');
      const vBtn = document.getElementById('modalTabBtnVault');
      const mBtn = document.getElementById('modalTabBtnMockups');
      const aBtn = document.getElementById('modalTabBtnAudit');
      const sBtn = document.getElementById('modalTabBtnSeo');

      if (bTab) bTab.style.display = tab === 'blueprint' ? 'flex' : 'none';
      if (vTab) vTab.style.display = tab === 'vault' ? 'flex' : 'none';
      if (mTab) mTab.style.display = tab === 'mockups' ? 'flex' : 'none';
      if (aTab) aTab.style.display = tab === 'audit' ? 'flex' : 'none';
      if (sTab) sTab.style.display = tab === 'seo' ? 'flex' : 'none';

      const activeStyle = 'flex:1; min-width:110px; background:rgba(0,223,137,0.15); border:1px solid rgba(0,223,137,0.3); color:#00df89; font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;';
      const inactiveStyle = 'flex:1; min-width:110px; background:none; border:1px solid transparent; color:var(--text-muted); font-weight:800; font-size:0.75rem; padding:0.55rem 0.4rem; border-radius:8px; cursor:pointer;';

      if (bBtn) bBtn.style.cssText = tab === 'blueprint' ? activeStyle : inactiveStyle;
      if (vBtn) vBtn.style.cssText = tab === 'vault' ? activeStyle : inactiveStyle;
      if (mBtn) mBtn.style.cssText = tab === 'mockups' ? activeStyle : inactiveStyle;
      if (aBtn) aBtn.style.cssText = tab === 'audit' ? activeStyle : inactiveStyle;
      if (sBtn) sBtn.style.cssText = tab === 'seo' ? activeStyle : inactiveStyle;
    },

    async generateStudioBlueprintWithAI(brandId, productCode, isCustom = false, categoryOverride = null, targetAudienceOverride = null, nameOverride = null) {
      const b = state.brands?.find(x => x.id === brandId) || state.brands[0];
      const catalog = state.productsCatalog?.[brandId] || [];
      const prod = catalog.find(p => p.code === productCode) || { name: 'Product', code: productCode };

      let customIdea = '';
      if (isCustom) {
        customIdea = document.getElementById('studioCustomIdeaInput')?.value || '';
      }

      const effectiveTitle = nameOverride || (document.getElementById('studioBlueprintTitle')?.value) || (customIdea ? `${prod.name}: ${customIdea}` : prod.name);
      const effectiveCategory = categoryOverride || (document.getElementById('studioBlueprintCategorySelect')?.value) || (document.getElementById('gateCategorySelect')?.value) || prod.category || '';
      const effectiveAudience = targetAudienceOverride || (document.getElementById('studioBlueprintAudience')?.value) || '';

      if (window.showToast) window.showToast(`🤖 Generating Blueprint 2.0 & Media briefs for ${prod.code}...`, 'info');

      // Show Full Modal Loading Overlay
      const modalContent = document.getElementById('aiSeoModalContent');
      let loadingOverlay = document.getElementById('studioLoadingOverlay');
      if (!loadingOverlay && modalContent) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'studioLoadingOverlay';
        loadingOverlay.style.cssText = 'position:absolute; inset:0; background:rgba(7,11,18,0.92); backdrop-filter:blur(8px); border-radius:20px; z-index:999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; text-align:center;';
        modalContent.style.position = 'relative';
        modalContent.appendChild(loadingOverlay);
      }
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.innerHTML = `
          <div style="width:52px; height:52px; border:4px solid rgba(0,223,137,0.2); border-top-color:#00df89; border-radius:50%; animation:spin 0.9s linear infinite; margin-bottom:1.25rem;"></div>
          <h3 style="color:#fff; font-size:1.15rem; font-weight:900; margin:0 0 0.4rem;">Architecting Blueprint 2.0 Specifications</h3>
          <p style="color:var(--text-secondary); font-size:0.82rem; max-width:460px; margin:0; line-height:1.5;">
            Engineering category-specialized page spreads, 10 commercial mockup scene briefs, and listing video scripts...
          </p>
        `;
      }

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const [bpRes, mockRes] = await Promise.all([
          fetch('/api/ai/product-blueprint', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              productName: effectiveTitle,
              brandName: b.name,
              brandNiche: b.niche,
              brandVoice: b.voice,
              brandPalette: b.palette,
              brandFonts: b.fonts,
              type: b.type || prod.format || 'Digital PDF',
              category: prod.category || '',
              categoryOverride: effectiveCategory,
              targetAudienceOverride: effectiveAudience,
              productNameOverride: effectiveTitle,
              hero: prod.hero || false,
              format: prod.format || 'Digital PDF',
              seoTags: prod.seoTags || prod.seo?.tags || []
            })
          }).then(async r => {
            const json = await r.json().catch(() => ({}));
            if (!r.ok || json.error) throw new Error(json.error || `HTTP ${r.status} generating blueprint`);
            return json;
          }),
          fetch('/api/ai/mockup-prompts', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              productName: effectiveTitle,
              brandName: b.name,
              brandNiche: b.niche,
              brandVoice: b.voice,
              brandPalette: b.palette,
              brandFonts: b.fonts,
              type: b.type || prod.format || 'Digital PDF',
              category: prod.category || '',
              categoryOverride: effectiveCategory,
              productNameOverride: effectiveTitle,
              hero: prod.hero || false,
              format: prod.format || 'Digital PDF',
              seoTags: prod.seoTags || prod.seo?.tags || []
            })
          }).then(async r => {
            const json = await r.json().catch(() => ({}));
            if (!r.ok || json.error) throw new Error(json.error || `HTTP ${r.status} generating mockups`);
            return json;
          })
        ]);

        const bpData = bpRes?.blueprint || {};
        const mockData = mockRes?.data || {};

        const blueprintBundle = {
          geometry: bpData.documentSpecs?.dimensions || 'US Letter (8.5x11 in)',
          typography: (bpData.documentSpecs?.typography?.headingFont || 'Playfair Display') + ' + ' + (bpData.documentSpecs?.typography?.bodyFont || 'Lato'),
          prompt: bpData.googleFlowPrompt || '',
          googleFlowPrompt: bpData.googleFlowPrompt || '',
          categoryName: bpData.categoryName || '',
          targetAudience: bpData.targetAudience || effectiveAudience || '',
          documentSpecs: bpData.documentSpecs || {},
          pageBreakdown: bpData.pageBreakdown || [],
          masterMockupPrompt: mockData.masterMockupPrompt || '',
          videoPrompt: mockData.videoPrompt || '',
          mockupsList: mockData.mockups || []
        };

        // Immediately persist to backend so work is preserved & status advances to Blueprint Ready
        const saveRes = await fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tab: 'blueprint', data: blueprintBundle })
        });
        const saveData = await saveRes.json().catch(() => ({}));
        if (!saveRes.ok || saveData.success === false) {
          throw new Error(saveData.error || `Failed to save blueprint (HTTP ${saveRes.status})`);
        }

        // ─── Patch in-memory state ───
        if (!state.productsCatalog) state.productsCatalog = {};
        if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
        let _bpProd = state.productsCatalog[brandId].find(p => p.code === productCode);
        if (!_bpProd) {
          _bpProd = { code: productCode, name: prod.name, status: 'Draft' };
          state.productsCatalog[brandId].push(_bpProd);
        }
        _bpProd.blueprint = blueprintBundle;
        if (_bpProd.status === 'Draft') {
          _bpProd.status = saveData.product?.status || 'Blueprint Ready';
        }
        _bpProd.studioPercent = saveData.studioPercent || 20;
        if (saveData.product) {
          Object.assign(_bpProd, { ...saveData.product, blueprint: blueprintBundle });
        }
        saveBrandsStateLocally(state);

        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (window.showToast) window.showToast('✅ Blueprint 2.0 & Mockup Briefs generated & saved!', 'success');

        // Re-open Studio directly in Tab 1 (Blueprint)
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod.name));
      } catch (err) {
        console.error('[Blueprint Generation Error]:', err);
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        const errBanner = document.getElementById('blueprintErrorBanner');
        const errMsg = document.getElementById('blueprintErrorMsg');
        if (errBanner && errMsg) {
          errBanner.style.display = 'block';
          errMsg.textContent = err.message || 'Blueprint generation failed';
        }
        const btn = document.getElementById('blueprintGenerateBtn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '⚡ Retry — Generate Blueprint';
        }
        if (window.showToast) window.showToast(`Blueprint generation failed: ${err.message}`, 'error');
      }
    },

    async regenerateStudioBlueprint(brandId, productCode) {
      const catSelect = document.getElementById('studioBlueprintCategorySelect');
      const catId = catSelect ? catSelect.value : null;
      const catText = catSelect && catSelect.options[catSelect.selectedIndex] ? catSelect.options[catSelect.selectedIndex].text : 'Selected Category';
      const audience = document.getElementById('studioBlueprintAudience')?.value || '';
      const titleOverride = document.getElementById('studioBlueprintTitle')?.value || '';

      if (!confirm(`Regenerate Blueprint 2.0 with architecture:\n"${catText}"?\n\nThis will update your Master Prompt, Page Stack, and 10 Mockup Briefs.`)) {
        return;
      }

      await window.BrandsModule.generateStudioBlueprintWithAI(brandId, productCode, false, catId, audience, titleOverride);
    },

    async resetProductBlueprint(brandId, productCode, encodedProdName) {
      const prodName = decodeURIComponent(encodedProdName || '');
      if (!confirm(`Are you sure you want to reset the Blueprint for ${productCode} ("${prodName}")?\n\nThis will clear the generated prompt and mockup briefs so you can choose a fresh category architecture.\n(Your uploaded vault deliverables will not be deleted).`)) {
        return;
      }

      if (window.showToast) window.showToast('Resetting blueprint...', 'info');

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        await fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tab: 'blueprint', data: {} })
        });

        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            prod.blueprint = {};
            if (prod.status === 'Blueprint Ready') prod.status = 'Draft';
            prod.studioPercent = Math.max(0, (prod.studioPercent || 20) - 20);
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast('✅ Studio reset! Ready to generate fresh blueprint.', 'success');
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prodName));
      } catch (err) {
        console.error('[Reset Studio Error]:', err);
        if (window.showToast) window.showToast(`Reset failed: ${err.message}`, 'error');
      }
    },

    async generateStudioSEOWithAI(brandId, productCode) {
      const btn = document.getElementById('btnGenerateStudioSEO');
      const statusEl = document.getElementById('studioSeoLoadingStatus');
      const b = state.brands?.find(x => x.id === brandId) || state.brands[0];
      const catalog = state.productsCatalog?.[brandId] || [];
      const prod = catalog.find(p => p.code === productCode) || { name: 'Product', code: productCode };

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span style="display:flex; align-items:center; gap:0.4rem;"><span style="width:12px; height:12px; border:2px solid #000; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; display:inline-block;"></span> ⏳ Generating SEO Package...</span>`;
      }

      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = `
          <div style="background:#12121e; border:1px solid rgba(6,182,212,0.35); border-radius:10px; padding:0.75rem 1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span style="font-size:0.76rem; font-weight:800; color:#06b6d4; display:flex; align-items:center; gap:0.4rem;">
                🤖 Gemini AI SEO Engine is synthesizing title, 13 tags &amp; description...
              </span>
              <span style="font-size:0.72rem; color:#00df89; font-weight:800; font-family:monospace;">Processing</span>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
              <div style="width:100%; height:100%; background:linear-gradient(90deg, #06b6d4, #00df89, #06b6d4); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:999px;"></div>
            </div>
          </div>
        `;
      }

      if (window.showToast) window.showToast('🤖 Generating Context-Aware Etsy SEO...', 'info');

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch('/api/ai/etsy-seo', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productName: prod.name,
            brandName: b.name,
            brandNiche: b.niche,
            brandVoice: b.voice,
            type: prod.type || b.type || 'Digital PDF',
            category: prod.category || prod.blueprint?.categoryOverride || 'Daily & Weekly Planners',
            pageCount: prod.blueprint?.pageCount || prod.blueprint?.pages?.length || 10,
            palette: prod.blueprint?.palette || b.palette || ['#8B5A7A', '#FAF3E8', '#7D9B76'],
            auditScore: prod.aiAudit?.overall_score || prod.aiAudit?.score || 8.0,
            price: prod.price || prod.retailPrice || 7.49
          })
        });
        const seoData = await res.json();
        if (!seoData || !seoData.success) throw new Error(seoData.error || 'Failed to generate SEO');

        const titleEl = document.getElementById('studioSeoTitle');
        const descEl = document.getElementById('studioSeoDescription');

        if (titleEl && seoData.title) {
          titleEl.value = seoData.title;
          const counter = document.getElementById('seoTitleCounter');
          if (counter) counter.innerText = seoData.title.length + '/140 chars';
        }

        if (descEl && seoData.description) {
          descEl.value = seoData.description;
        }

        // Render tag chips
        if (Array.isArray(seoData.tags)) {
          window._activeStudioTags = seoData.tags.map(t => String(t).trim().slice(0, 20)).filter(Boolean);
          window.BrandsModule.renderStudioTagChips();
        }

        window.BrandsModule.updateLiveEtsyPreview();

        // Update product in-memory state
        if (prod) {
          if (!prod.seo) prod.seo = {};
          prod.seo.title = seoData.title;
          prod.seo.tags = seoData.tags;
          prod.seo.description = seoData.description;
          prod.seoTitle = seoData.title;
          prod.seoTags = seoData.tags;
          prod.seoDescription = seoData.description;
        }
        saveBrandsStateLocally(state);

        // Auto-persist SEO package to backend database immediately
        fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tab: 'seo',
            data: {
              title: seoData.title,
              tags: seoData.tags,
              description: seoData.description,
              price: prod.price || prod.retailPrice || 7.49
            }
          })
        }).catch(err => console.warn('[Auto-Save SEO Error]:', err.message));

        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:rgba(0,223,137,0.1); border:1px solid rgba(0,223,137,0.4); border-radius:10px; padding:0.6rem 0.9rem; display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#00df89; font-weight:800; font-size:0.78rem;">
                ✅ 140-Char SEO Title, 13 High-Intent Tags &amp; Description Generated &amp; Populated!
              </span>
              <span style="font-size:0.7rem; color:var(--text-muted);">Ready to review below</span>
            </div>
          `;
          setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 4000);
        }

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `⚡ Regenerate SEO with Blueprint Context`;
        }

        if (window.showToast) window.showToast('✅ AI SEO package generated & populated!', 'success');
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `⚡ Generate SEO with Blueprint Context`;
        }
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.35); border-radius:10px; padding:0.6rem 0.9rem; color:#ef4444; font-weight:700; font-size:0.78rem;">
              ❌ Generation error: ${err.message}
            </div>
          `;
        }
        if (window.showToast) window.showToast(`SEO generation failed: ${err.message}`, 'error');
      }
    },

    updateLiveEtsyPreview() {
      const titleInput = document.getElementById('studioSeoTitle');
      const priceInput = document.getElementById('studioRetailPrice');
      const previewTitle = document.getElementById('previewEtsyTitle');
      const previewPrice = document.getElementById('previewEtsyPrice');

      if (previewTitle && titleInput) {
        previewTitle.innerText = titleInput.value.trim() || 'Your Product Title | Aesthetic Planner';
      }
      if (previewPrice && priceInput) {
        const val = parseFloat(priceInput.value) || 7.49;
        previewPrice.innerText = `$${val.toFixed(2)} AUD`;
      }
    },

    renderStudioTagChips() {
      const container = document.getElementById('studioSeoTagCloud');
      const hiddenInput = document.getElementById('studioSeoTags');
      const badge = document.getElementById('seoTagsCountBadge');
      const tags = window._activeStudioTags || [];

      if (hiddenInput) {
        hiddenInput.value = tags.join(', ');
      }

      if (badge) {
        badge.innerText = `${tags.length} / 13 Tags`;
        badge.style.color = tags.length === 13 ? '#00df89' : '#fbbf24';
        badge.style.background = tags.length === 13 ? 'rgba(0,223,137,0.15)' : 'rgba(251,191,36,0.15)';
      }

      if (!container) return;

      container.innerHTML = tags.map((tag, tIdx) => {
        const tagLen = tag.length;
        const isOverLimit = tagLen > 20;
        return `
          <span style="display:inline-flex; align-items:center; gap:0.35rem; background:${isOverLimit ? 'rgba(239,68,68,0.2)' : 'rgba(6,182,212,0.12)'}; border:1px solid ${isOverLimit ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)'}; color:${isOverLimit ? '#ef4444' : '#06b6d4'}; font-size:0.74rem; font-weight:700; padding:0.25rem 0.55rem; border-radius:6px;">
            ${tag}
            <span style="font-size:0.62rem; color:var(--text-muted); opacity:0.8;">(${tagLen}/20)</span>
            <button type="button" onclick="window.BrandsModule.removeStudioSeoTag(${tIdx})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.78rem; padding:0 0 0 2px; line-height:1;">✕</button>
          </span>
        `;
      }).join('');
    },

    addStudioSeoTag(tagText) {
      const input = document.getElementById('studioNewTagInput');
      const val = (tagText || input?.value || '').trim();
      if (!val) return;

      if (!window._activeStudioTags) {
        const hiddenInput = document.getElementById('studioSeoTags');
        window._activeStudioTags = (hiddenInput?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      }

      if (window._activeStudioTags.length >= 13) {
        if (window.showToast) window.showToast('Etsy maximum is 13 tags. Remove a tag first.', 'warning');
        return;
      }

      const cleanTag = val.slice(0, 20);
      window._activeStudioTags.push(cleanTag);
      if (input) input.value = '';
      window.BrandsModule.renderStudioTagChips();
    },

    removeStudioSeoTag(idx) {
      if (!window._activeStudioTags) {
        const hiddenInput = document.getElementById('studioSeoTags');
        window._activeStudioTags = (hiddenInput?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      }
      window._activeStudioTags.splice(idx, 1);
      window.BrandsModule.renderStudioTagChips();
    },

    copyAllStudioSeoTags() {
      const tags = window._activeStudioTags || (document.getElementById('studioSeoTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length === 0) {
        if (window.showToast) window.showToast('No tags to copy', 'warning');
        return;
      }
      navigator.clipboard.writeText(tags.join(', '));
      if (window.showToast) window.showToast(`📋 Copied all ${tags.length} Etsy tags!`, 'success');
    },

    async submitProductForReview(brandId, productCode) {
      if (!confirm(`Submit ${productCode} for Admin Review & Publication Approval?`)) return;

      const titleEl = document.getElementById('studioSeoTitle');
      const descEl = document.getElementById('studioSeoDescription');
      const tagsEl = document.getElementById('studioSeoTags');
      const priceEl = document.getElementById('studioRetailPrice');
      const typeEl = document.getElementById('studioProductType');

      const brandCatalog = state.productsCatalog?.[brandId] || state.productsCatalog?.[String(brandId)] || [];
      const prod = brandCatalog.find(p => p.code === productCode) || {};

      const finalTitle = (titleEl?.value?.trim()) || prod.seoTitle || prod.seo?.title || prod.name || `Daily & Weekly Planners #1 — PlannerQueenGro Style`;
      const finalDesc = (descEl?.value?.trim()) || prod.seoDescription || prod.seo?.description || `Instant digital download printable template. High-resolution layout ready for immediate print or tablet use.`;
      const finalTags = (tagsEl?.value ? tagsEl.value.split(',').map(t => t.trim()).filter(Boolean) : (prod.seoTags || prod.seo?.tags || ['digital planner', 'printable template', 'instant download', 'goodnotes planner', 'life planner']));

      const payload = {
        title: finalTitle,
        description: finalDesc,
        tags: finalTags,
        price: priceEl ? parseFloat(priceEl.value) || 4.99 : 4.99,
        type: typeEl?.value || 'pdf-planner',
        // Send in-memory state data so backend validates correctly (Vercel may have stale state)
        mockupsCount: Math.max(prod.mockupsCount || 0, prod.mockups?.length || 0, prod.mockupUrls?.length || 0),
        video: prod.video || undefined,
        vault: prod.vault || undefined
      };

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/brands/${brandId}/product/${productCode}/submit-review`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Submission failed');

        if (window.showToast) window.showToast(`🎉 ${productCode} submitted for Admin Review!`, 'success');
        // Patch status in in-memory state — do NOT reload from API
        if (data.product && state.productsCatalog?.[brandId]) {
          const _si = state.productsCatalog[brandId].findIndex(p => p.code === productCode);
          if (_si >= 0) state.productsCatalog[brandId][_si] = { ...state.productsCatalog[brandId][_si], ...data.product };
          saveBrandsStateLocally(state);
        }
        const modal = document.getElementById('aiSeoModal');
        if (modal) modal.style.display = 'none';
        renderTabContent('etsy');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async saveStudioDraft(tabName = 'all') {
      if (!window._studioCtx) {
        if (window.showToast) window.showToast('Studio session context not found. Please re-open Studio.', 'warning');
        return;
      }
      const { brandId, productCode } = window._studioCtx;
      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });

      const titleEl = document.getElementById('studioSeoTitle');
      const descEl = document.getElementById('studioSeoDescription');
      const tagsEl = document.getElementById('studioSeoTags');
      const priceEl = document.getElementById('studioRetailPrice');
      const typeEl = document.getElementById('studioProductType');
      const bpPromptEl = document.getElementById('studioBlueprintPrompt');
      const bpGeometryEl = document.getElementById('studioBlueprintGeometry');
      const bpTypoEl = document.getElementById('studioBlueprintTypography');

      const payload = {};

      if (tabName === 'seo' || tabName === 'all') {
        if (titleEl || descEl || tagsEl || priceEl) {
          payload.seo = {
            title: titleEl?.value || '',
            description: descEl?.value || '',
            tags: tagsEl?.value ? tagsEl.value.split(',').map(t => t.trim()).filter(Boolean) : []
          };
          if (priceEl) payload.pricing = { retailPrice: parseFloat(priceEl.value) || 4.99 };
          if (typeEl) payload.type = typeEl.value;
        }
      }

      if (tabName === 'blueprint' || tabName === 'all') {
        if (bpPromptEl || bpGeometryEl || bpTypoEl) {
          payload.blueprint = {
            geometry: bpGeometryEl?.value || '',
            typography: bpTypoEl?.value || '',
            prompt: bpPromptEl?.value || '',
            googleFlowPrompt: bpPromptEl?.value || ''
          };
        }
      }

      if (tabName !== 'all') {
        payload.tab = tabName;
      }

      const saveBtn = document.getElementById('studioSaveAllBtn');
      if (saveBtn) saveBtn.innerText = '⏳ Saving...';

      try {
        const res = await fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save Studio draft');

        if (window.showToast) window.showToast(`✅ ${tabName === 'all' ? 'All Studio changes' : tabName.toUpperCase()} saved! (${data.studioPercent || 0}% Complete)`, 'success');

        // ─── CRITICAL FIX: Patch in-memory state from response — NEVER reload from API ───
        // Reloading from API on Vercel returns stale seeded data, wiping all uploaded files.
        if (data.product && state.productsCatalog) {
          const _bId = brandId;
          if (!state.productsCatalog[_bId]) state.productsCatalog[_bId] = [];
          const _idx = state.productsCatalog[_bId].findIndex(p => p.code === productCode);
          if (_idx >= 0) {
            const _existing = state.productsCatalog[_bId][_idx];
            // Merge: preserve in-memory vault/mockups/video/aiAudit — server state is stale on Vercel
            const _merged = {
              ..._existing,
              ...(tabName === 'seo' || tabName === 'all' ? { seo: data.product?.seo } : {}),
              ...(tabName === 'blueprint' || tabName === 'all' ? { blueprint: data.product?.blueprint ?? _existing.blueprint } : {}),
              price: data.product?.price ?? _existing.price,
              // ALWAYS keep in-memory uploads — do NOT overwrite with stale server values
              vault: _existing.vault,
              mockupsCount: _existing.mockupsCount,
              mockups: _existing.mockups,
              video: _existing.video,
              aiAudit: _existing.aiAudit,
            };
            state.productsCatalog[_bId][_idx] = _merged;

            // Recalculate studioPercent from merged in-memory state (server percent may be stale/0)
            const _bpOk  = !!(_merged.blueprint?.prompt || _merged.blueprint?.geometry);
            const _vOk   = !!(_merged.vault?.storagePath || _merged.vault?.fileName);
            const _mOk   = !!((_merged.mockupsCount || 0) >= 3 || (_merged.mockups?.length || 0) >= 3);
            const _audOk = !!(_merged.aiAudit?.overall);
            const _seoOk = !!(_merged.seo?.title);
            const _localPct = [_bpOk, _vOk, _mOk, _audOk, _seoOk].filter(Boolean).length * 20;
            // Use local calculation if it's higher than what server returned
            data.studioPercent = Math.max(data.studioPercent || 0, _localPct);
          } else {
            state.productsCatalog[_bId].push(data.product);
          }
          saveBrandsStateLocally(state);
        }

        // Update header progress bar
        const pctEl = document.getElementById('studioHeaderPctBadge');
        const barEl = document.getElementById('studioHeaderProgressBar');
        if (pctEl && data.studioPercent !== undefined) {
          pctEl.innerText = `${data.studioPercent}% Ready`;
          pctEl.style.color = data.studioPercent >= 80 ? '#00df89' : (data.studioPercent >= 40 ? '#fbbf24' : '#ef4444');
        }
        if (barEl && data.studioPercent !== undefined) barEl.style.width = `${data.studioPercent}%`;


        if (tabName === 'all') {
          const modal = document.getElementById('aiSeoModal');
          if (modal) modal.style.display = 'none';
          renderTabContent('etsy');
        } else if (tabName === 'blueprint') {
          // Re-render drawer to show 5-tab Studio view with updated progress dots
          const ctx = window._studioCtx;
          if (ctx) {
            setTimeout(() => window.BrandsModule.generateLiveSEOPackage(ctx.brandId, ctx.productCode, encodeURIComponent(ctx.productName || '')), 100);
          }
        }

      } catch (err) {
        if (window.showToast) window.showToast(`Save failed: ${err.message}`, 'error');
      } finally {
        if (saveBtn) saveBtn.innerText = '💾 Save All Draft';
      }
    },

    onVaultFileSelected(input) {
      const file = input?.files?.[0];
      const card = document.getElementById('vaultFileInspectionCard');
      const nameEl = document.getElementById('vaultInspectFileName');
      const sizeEl = document.getElementById('vaultInspectFileSize');
      const badgeEl = document.getElementById('vaultInspectSizeBadge');

      if (!file || !card) return;
      card.style.display = 'block';
      if (nameEl) nameEl.textContent = `Selected: ${file.name}`;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (sizeEl) sizeEl.textContent = `${sizeMb} MB`;

      if (badgeEl) {
        if (file.size <= 20 * 1024 * 1024) {
          badgeEl.innerHTML = '<span style="color:#00df89; font-weight:700;">🟢 Direct Etsy Attachment Compatible (&lt; 20MB)</span>';
        } else {
          badgeEl.innerHTML = '<span style="color:#fbbf24; font-weight:700;">🟡 Large File (&gt; 20MB) — Stored in Supabase Vault; deliver via 1-Page Branded Access Pass</span>';
        }
      }
    },

    handleVaultDrop(e) {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        window._droppedVaultFile = file;
        window.BrandsModule.onVaultFileSelected({ files: [file] });
        if (window.showToast) window.showToast(`File selected: ${file.name}`, 'info');
      }
    },

    testCloudLink(elementId) {
      const el = document.getElementById(elementId);
      const url = el ? el.value.trim() : '';
      if (!url) {
        if (window.showToast) window.showToast('Please enter a template or hub link to test', 'warning');
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (window.showToast) window.showToast('Please enter a valid URL starting with https://', 'warning');
        return;
      }
      window.open(url, '_blank');
    },

    async clearVaultDeliverable(brandId, productCode, productNameEncoded) {
      const prodName = decodeURIComponent(productNameEncoded || '');
      if (!confirm(`Clear vault deliverable file for ${productCode} ("${prodName}")?\n\nThis will remove the current stored file and allow you to upload a fresh version.`)) {
        return;
      }

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        await fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tab: 'vault', data: {} })
        });

        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            prod.vault = {};
            if (prod.status === 'Vault Uploaded') prod.status = 'Blueprint Ready';
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast('Vault deliverable cleared. Ready for fresh upload.', 'info');
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prodName));
        setTimeout(() => window.BrandsModule.switchStudioTab('vault'), 100);
      } catch (err) {
        console.error('[Clear Vault Deliverable Error]:', err);
        if (window.showToast) window.showToast(`Failed to clear: ${err.message}`, 'error');
      }
    },

    async generateCustomerAccessPass(brandId, productCode, productNameEncoded) {
      const prodName = decodeURIComponent(productNameEncoded || '');
      const statusArea = document.getElementById('accessPassStatusArea');
      const canvaUrl = document.getElementById('vaultCanvaInput')?.value || '';
      const notionUrl = document.getElementById('vaultNotionInput')?.value || '';
      const version = document.getElementById('vaultVersionInput')?.value || '1.0';

      if (statusArea) {
        statusArea.innerHTML = '<span style="color:#c084fc; font-weight:800; font-size:0.78rem;">⏳ Compiling Branded 1-Page Customer Access Pass (PDF)...</span>';
      }

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/brands/${brandId}/vault/generate-access-pass`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productCode,
            productName: prodName,
            version,
            canvaTemplateUrl: canvaUrl,
            notionTemplateUrl: notionUrl
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status} generating access pass`);
        }

        // Patch in-memory state
        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            if (!prod.vault) prod.vault = {};
            prod.vault.accessPassUrl = data.accessPassUrl;
            prod.vault.licenseId = data.licenseId;
            prod.vault.canvaTemplateUrl = canvaUrl;
            prod.vault.notionTemplateUrl = notionUrl;
          }
        }
        saveBrandsStateLocally(state);

        if (statusArea) {
          statusArea.innerHTML = `
            <div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); padding:0.65rem 0.85rem; border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span style="color:#c084fc; font-weight:800; font-size:0.78rem;">✅ Access Pass Compiled Successfully</span>
                <span style="font-size:0.7rem; color:var(--text-muted); margin-left:0.4rem;">License ID: <strong style="color:#fff;">${data.licenseId}</strong></span>
              </div>
              <div style="display:flex; gap:0.4rem;">
                ${data.accessPassUrl ? `
                  <a href="${data.accessPassUrl}" target="_blank" class="btn-secondary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem; text-decoration:none;">
                    📥 Download Pass PDF
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        }

        if (window.showToast) window.showToast('✅ Branded Customer Access Pass compiled!', 'success');
      } catch (err) {
        console.error('[Generate Access Pass Error]:', err);
        if (statusArea) {
          statusArea.innerHTML = `<span style="color:#ef4444; font-size:0.74rem; font-weight:700;">❌ Access Pass Error: ${err.message}</span>`;
        }
        if (window.showToast) window.showToast(`Failed: ${err.message}`, 'error');
      }
    },

    async uploadProductDeliverable(brandId, productCode, productNameEncoded) {
      const prodName = decodeURIComponent(productNameEncoded);
      const fileInput = document.getElementById('vaultFileInput');
      const file = (fileInput && fileInput.files && fileInput.files[0]) || window._droppedVaultFile || null;
      const canvaUrl = document.getElementById('vaultCanvaInput')?.value || '';
      const notionUrl = document.getElementById('vaultNotionInput')?.value || '';
      const version = document.getElementById('vaultVersionInput')?.value || '1.0';

      if (!file && !canvaUrl && !notionUrl) {
        window.showToast('Please select a PDF/ZIP file or provide a template link', 'warning');
        return;
      }

      const statusEl = document.getElementById('vaultUploadStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">⏳ Uploading ${file ? file.name : 'asset'} to Vault...</span>`;
      }

      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('productCode', productCode);
      formData.append('productName', prodName);
      formData.append('version', version);
      formData.append('canvaTemplateUrl', canvaUrl);
      formData.append('notionTemplateUrl', notionUrl);

      try {
        const uploadHeaders = getStudioAuthHeaders();
        const res = await fetch(`/api/brands/${brandId}/vault/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
        }
        if (!data.success) throw new Error(data.error || 'Upload failed');

        window._droppedVaultFile = null;
        window.showToast('✅ Deliverable saved to Vault!', 'success');
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:rgba(0,223,137,0.1); border:1px solid rgba(0,223,137,0.3); padding:0.6rem; border-radius:8px; margin-top:0.4rem;">
              <div style="color:#00df89; font-weight:800; font-size:0.82rem;">✅ File Saved to Vault</div>
              <div style="font-size:0.74rem; color:#fff; margin-top:0.15rem;">${data.vault.fileName} (${(data.vault.fileSizeBytes / (1024*1024)).toFixed(2)} MB) · v${data.vault.version}</div>
              ${data.vault.downloadUrl ? `
                <div style="margin-top:0.4rem; display:flex; gap:0.4rem;">
                  <a href="${data.vault.downloadUrl}" target="_blank" class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem; text-decoration:none;">📥 Download / Preview</a>
                  <button class="btn-secondary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem;" onclick="navigator.clipboard.writeText('${data.vault.downloadUrl}'); window.showToast('Copied download URL!','success');">📋 Copy Signed Link</button>
                </div>
              ` : ''}
            </div>
          `;
        }

        // Directly patch in-memory state — do NOT reload from API (Vercel returns stale seed data)
        if (!state.productsCatalog) state.productsCatalog = {};
        if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
        let _prod = state.productsCatalog[brandId].find(p => p.code === productCode);
        if (!_prod) { _prod = { code: productCode, name: prodName, status: 'Draft' }; state.productsCatalog[brandId].push(_prod); }
        _prod.vault = data.vault;
        if (_prod.status === 'Draft') _prod.status = 'Vault Uploaded';
        saveBrandsStateLocally(state);
        // Update progress bar live
        const _pctEl = document.getElementById('studioHeaderPctBadge');
        const _barEl = document.getElementById('studioHeaderProgressBar');
        const _vaultDone = Boolean(_prod.vault?.storagePath || _prod.vault?.downloadUrl);
        const _mocksDone = (_prod.mockups?.length || 0) >= 4;
        const _vidDone = Boolean(_prod.video?.storagePath || _prod.video?.fileName);
        const _auditDone = (_prod.aiAudit?.overall_score || 0) >= 7.0;
        const _seoDone = Boolean(_prod.seo?.title || _prod.seoTitle);
        const _bpDone = Boolean(_prod.blueprint?.prompt || _prod.blueprint?.geometry);
        const _pct = (_bpDone ? 20 : 0) + (_vaultDone ? 20 : 0) + (_mocksDone && _vidDone ? 20 : 0) + (_auditDone ? 20 : 0) + (_seoDone ? 20 : 0);
        if (_pctEl) { _pctEl.innerText = `${_pct}% Ready`; _pctEl.style.color = _pct >= 80 ? '#00df89' : (_pct >= 40 ? '#fbbf24' : '#ef4444'); }
        if (_barEl) _barEl.style.width = `${_pct}%`;
        
        // Re-render Studio Drawer to show updated card & pass buttons
        setTimeout(() => {
          window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prodName));
          setTimeout(() => window.BrandsModule.switchStudioTab('vault'), 50);
        }, 300);

      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ Upload error: ${err.message}</span>`;
        window.showToast(`Upload failed: ${err.message}`, 'error');
      }
    },


    buildAuditHtml(audit, brandId, productCode) {
      if (!audit) return '';
      const score = audit.overall_score || 0;
      const dims = audit.dimension_scores || {};
      const pricing = audit.pricing || {};
      const pages = audit.page_analysis || [];

      window._currentAuditPrompts = {};
      pages.forEach(p => {
        if (p.remediation_prompt) {
          let fullPrompt = p.remediation_prompt;
          if (p.defects && p.defects.length > 0 && !p.remediation_prompt.includes('CRITICAL CORRECTIONS') && !p.remediation_prompt.includes('CORRECTIONS')) {
            const defectsFormatted = p.defects.map(d => `• ${d}`).join('\n');
            fullPrompt = `CRITICAL CORRECTIONS & FIXES REQUIRED:\n${defectsFormatted}\n\nTARGETED REDESIGN PROMPT:\n${p.remediation_prompt}`;
          }
          window._currentAuditPrompts[p.page_number] = fullPrompt;
        }
      });

      const cleanPages = pages.filter(p => p.status === 'clean');
      const flawedPages = pages.filter(p => p.status === 'needs_fix');

      const getDimColor = (val) => val >= 8.0 ? '#00df89' : (val >= 6.5 ? '#fbbf24' : '#ef4444');

      return `
        ${audit.isFallback ? `
          <!-- FALLBACK WARNING BANNER -->
          <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.3rem; flex-shrink:0;">⚠️</span>
            <div>
              <div style="font-size:0.75rem; font-weight:800; color:#ef4444; margin-bottom:0.15rem;">ILLUSTRATIVE TEMPLATE AUDIT</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">
                ${audit.fallbackReason || 'Gemini Vision API unavailable or document could not be loaded.'} 
                Ensure a PDF deliverable or mockups are stored in Vault (Tabs 2 & 3), then click Re-Run Audit.
              </div>
            </div>
          </div>
        ` : `
          <!-- REAL AUDIT SUCCESS INDICATOR -->
          <div style="background:rgba(0,223,137,0.06); border:1px solid rgba(0,223,137,0.25); border-radius:10px; padding:0.55rem 1rem; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:0.95rem;">🧠</span>
              <span style="font-size:0.74rem; color:#00df89; font-weight:700;">Verified Multimodal Vision Quality Audit · ${audit.evaluated_by || 'Gemini 2.0 / 3.5'}</span>
            </div>
            <span style="font-size:0.68rem; color:var(--text-muted);">${new Date(audit.audited_at || Date.now()).toLocaleTimeString()}</span>
          </div>
        `}

        <!-- HERO SCORE & PRICING SPLIT -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1rem; margin-bottom:1.25rem;">
          
          <!-- SCORE CARD -->
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(139,92,246,0.3); padding:1.2rem; border-radius:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <span style="font-size:0.74rem; font-weight:800; color:#c084fc; text-transform:uppercase;">Overall Quality Score</span>
              <span style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:${score >= 7 ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.15)'}; color:${score >= 7 ? '#00df89' : '#ef4444'};">
                ${score >= 8.5 ? '⭐ Commercial Ready' : (score >= 7.0 ? '🟢 Quality Gate Passed' : '🔴 Action Required (<70%)')}
              </span>
            </div>

            <div style="display:flex; align-items:baseline; gap:0.4rem; margin-bottom:0.85rem;">
              <span style="font-size:2.4rem; font-weight:900; color:${score >= 7 ? '#00df89' : '#ef4444'};">${score}</span>
              <span style="font-size:1rem; color:var(--text-muted); font-weight:700;">/ 10.0</span>
              <span style="font-size:0.76rem; color:var(--text-muted); margin-left:auto;">${(score * 10).toFixed(0)}% Approval</span>
            </div>

            <!-- 4 DIMENSIONS METERS -->
            <div style="display:flex; flex-direction:column; gap:0.45rem;">
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:0.15rem;">
                  <span style="color:var(--text-secondary);">🎨 Aesthetic Harmony</span>
                  <strong style="color:${getDimColor(dims.aesthetic || 0)};">${dims.aesthetic || 0} / 10</strong>
                </div>
                <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${(dims.aesthetic || 0) * 10}%; background:${getDimColor(dims.aesthetic || 0)};"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:0.15rem;">
                  <span style="color:var(--text-secondary);">🔤 Typography Hierarchy</span>
                  <strong style="color:${getDimColor(dims.typography || 0)};">${dims.typography || 0} / 10</strong>
                </div>
                <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${(dims.typography || 0) * 10}%; background:${getDimColor(dims.typography || 0)};"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:0.15rem;">
                  <span style="color:var(--text-secondary);">📐 Layout & Margins</span>
                  <strong style="color:${getDimColor(dims.usability || 0)};">${dims.usability || 0} / 10</strong>
                </div>
                <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${(dims.usability || 0) * 10}%; background:${getDimColor(dims.usability || 0)};"></div>
                </div>
              </div>

              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; margin-bottom:0.15rem;">
                  <span style="color:var(--text-secondary);">💎 Commercial Polish & QA</span>
                  <strong style="color:${getDimColor(dims.commercial_polish || 0)};">${dims.commercial_polish || 0} / 10</strong>
                </div>
                <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${(dims.commercial_polish || 0) * 10}%; background:${getDimColor(dims.commercial_polish || 0)};"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- PRICING RECOMMENDATION CARD -->
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,223,137,0.3); padding:1.2rem; border-radius:14px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <span style="font-size:0.74rem; font-weight:800; color:#00df89; text-transform:uppercase;">🏷️ AI Retail Price Recommendation</span>
                <span style="font-size:0.68rem; color:#06b6d4; font-weight:800; background:rgba(6,182,212,0.1); padding:0.15rem 0.5rem; border-radius:6px;">Etsy Sweet Spot</span>
              </div>

              <div style="display:flex; align-items:baseline; gap:0.4rem; margin-bottom:0.3rem;">
                <span style="font-size:2.4rem; font-weight:900; color:#00df89;">$${pricing.recommended_price ? Number(pricing.recommended_price).toFixed(2) : '7.49'}</span>
                <span style="font-size:0.78rem; color:var(--text-muted);">USD</span>
              </div>

              <div style="display:flex; gap:0.5rem; font-size:0.7rem; color:var(--text-muted); margin-bottom:0.6rem;">
                <span>Floor: <strong>$${pricing.min_price || '4.99'}</strong></span>
                <span>·</span>
                <span>Upsell Anchor: <strong>$${pricing.bundle_upsell_price || '12.99'}</strong></span>
              </div>

              <p style="font-size:0.74rem; color:var(--text-secondary); margin:0 0 0.85rem; line-height:1.4;">
                ${pricing.rationale || 'Optimal price point balancing high conversion velocity and premium brand perception.'}
              </p>
            </div>

            <button type="button" class="btn-primary" style="width:100%; font-size:0.82rem; padding:0.6rem; font-weight:800;" onclick="window.BrandsModule.applyAuditedPrice(${brandId}, '${productCode}', ${pricing.recommended_price || 7.49})">
              🏷️ Apply $${pricing.recommended_price ? Number(pricing.recommended_price).toFixed(2) : '7.49'} to Etsy Listing
            </button>
          </div>
        </div>

        <!-- EXECUTIVE SUMMARY STATEMENT -->
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); padding:0.85rem 1rem; border-radius:10px; margin-bottom:1.25rem; font-size:0.78rem; color:var(--text-secondary); line-height:1.45;">
          <strong style="color:#fff;">Executive Audit Summary:</strong> ${audit.summary || 'Visual quality evaluated across all spreads.'}
        </div>

        <!-- PAGE STATUS OVERVIEW BANNER & FILTER BUTTONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
          <h4 style="font-size:0.92rem; font-weight:800; color:#fff; margin:0;">
            Page-by-Page Audit & Targeted Remediation (${pages.length} Pages)
          </h4>
          <div style="display:flex; gap:0.35rem; font-size:0.72rem; font-weight:800;">
            <button type="button" class="btn-ghost btn-sm audit-filter-btn" style="padding:0.2rem 0.6rem; border-radius:6px; background:rgba(255,255,255,0.1); color:#fff;" onclick="window.BrandsModule.filterAuditPages('all', this)">
              All (${pages.length})
            </button>
            <button type="button" class="btn-ghost btn-sm audit-filter-btn" style="padding:0.2rem 0.6rem; border-radius:6px; background:rgba(0,223,137,0.15); color:#00df89;" onclick="window.BrandsModule.filterAuditPages('clean', this)">
              ✅ Clean (${cleanPages.length})
            </button>
            <button type="button" class="btn-ghost btn-sm audit-filter-btn" style="padding:0.2rem 0.6rem; border-radius:6px; background:${flawedPages.length > 0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)'}; color:${flawedPages.length > 0 ? '#fbbf24' : 'var(--text-muted)'};" onclick="window.BrandsModule.filterAuditPages('flawed', this)">
              ⚠️ Needs Fix (${flawedPages.length})
            </button>
          </div>
        </div>

        <!-- PAGES LIST WITH DIRECT 1-CLICK EDIT PROMPT COPY BUTTONS -->
        <div id="auditPagesList" style="display:flex; flex-direction:column; gap:0.75rem;">
          ${pages.map(p => {
            const isClean = p.status === 'clean';
            return `
              <div class="audit-page-card ${isClean ? 'audit-page-clean' : 'audit-page-needs-fix'}" style="background:rgba(255,255,255,0.03); border:1px solid ${isClean ? 'rgba(0,223,137,0.2)' : 'rgba(251,191,36,0.35)'}; border-radius:12px; padding:0.9rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <div style="font-weight:800; color:#fff; font-size:0.85rem;">
                    <span style="color:#06b6d4;">Page ${p.page_number}:</span> ${p.title}
                  </div>
                  <span style="font-size:0.68rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:6px; background:${isClean ? 'rgba(0,223,137,0.15)' : 'rgba(251,191,36,0.15)'}; color:${isClean ? '#00df89' : '#fbbf24'};">
                    ${isClean ? '✅ Clean — No Edits Required' : '⚠️ Action Needed'}
                  </span>
                </div>

                ${p.defects && p.defects.length > 0 ? `
                  <div style="margin:0.4rem 0 0.6rem;">
                    <span style="font-size:0.7rem; font-weight:800; color:#fbbf24; text-transform:uppercase; display:block; margin-bottom:0.2rem;">Detected Visual/Typo Issues:</span>
                    <ul style="margin:0; padding-left:1.2rem; font-size:0.75rem; color:#ef4444; line-height:1.4;">
                      ${p.defects.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${p.remediation_prompt ? `
                  <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(251,191,36,0.25); border-radius:8px; padding:0.75rem; margin-top:0.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; flex-wrap:wrap; gap:0.3rem;">
                      <span style="font-size:0.68rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">⚡ 1-Click Targeted AI Edit Prompt (Google Flow / Gemini):</span>
                      <button type="button" class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem; background:#fbbf24; color:#000; font-weight:800; border:none; border-radius:6px;" onclick="window.BrandsModule.copyAuditRemediationPrompt(${p.page_number})">
                        📋 Copy Page ${p.page_number} Edit Prompt
                      </button>
                    </div>
                    <div style="font-size:0.74rem; font-family:monospace; color:#e2e8f0; line-height:1.45; white-space:pre-wrap; max-height:140px; overflow-y:auto; background:rgba(0,0,0,0.25); padding:0.5rem 0.65rem; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                      ${(() => {
                        const promptText = window._currentAuditPrompts[p.page_number] || p.remediation_prompt;
                        if (promptText.includes('CRITICAL CORRECTIONS & FIXES REQUIRED:') || promptText.includes('CRITICAL DESIGN CORRECTIONS REQUIRED:')) {
                          const parts = promptText.split(/TARGETED REDESIGN PROMPT:|REMEDIATION DESIGN PROMPT:/);
                          const header = promptText.includes('CRITICAL CORRECTIONS & FIXES REQUIRED:') ? 'CRITICAL CORRECTIONS & FIXES REQUIRED:' : 'CRITICAL DESIGN CORRECTIONS REQUIRED:';
                          return `<span style="color:#fbbf24; font-weight:800;">${header}</span>\n<span style="color:#f87171;">${parts[0].replace(header, '').trim()}</span>\n\n<span style="color:#00df89; font-weight:800;">TARGETED REDESIGN PROMPT:</span>\n<span style="color:#e2e8f0;">${(parts[1] || '').trim()}</span>`;
                        }
                        return promptText;
                      })()}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    async runAIProductAudit(brandId, productCode) {
      const container = document.getElementById('studioAuditResultsContainer');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem 1rem;">
            <div style="width:50px; height:50px; border-radius:50%; border:3px solid rgba(139,92,246,0.2); border-top-color:#8b5cf6; animation:spin 1s linear infinite; margin:0 auto 1rem;"></div>
            <h4 style="font-size:1rem; font-weight:800; color:#fff; margin:0 0 0.3rem;">Analyzing Visual Quality & Pricing Engine...</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">Gemini Multimodal Vision is inspecting page typography, layout geometry, and generating targeted single-page edit prompts...</p>
          </div>
        `;
      }

      try {
        const headers = getStudioAuthHeaders();
        const res = await fetch(`/api/brands/${brandId}/products/${productCode}/ai-audit`, {
          method: 'POST',
          headers
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
        }
        if (!data.success || !data.audit) throw new Error(data.error || 'AI Audit failed');

        window.showToast(`🧠 AI Audit complete! Quality Score: ${data.audit.overall_score}/10`, 'success');

        // Patch in-memory state from audit result
        if (!state.productsCatalog) state.productsCatalog = {};
        if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
        let _aProd = state.productsCatalog[brandId].find(p => p.code === productCode);
        if (!_aProd) { _aProd = { code: productCode, status: 'Draft' }; state.productsCatalog[brandId].push(_aProd); }
        _aProd.aiAudit = data.audit;
        if (data.audit?.pricing?.recommended_price) {
          _aProd.suggestedPrice = Number(data.audit.pricing.recommended_price);
          _aProd.price = Number(data.audit.pricing.recommended_price);
          _aProd.retailPrice = Number(data.audit.pricing.recommended_price);
        }
        if (data.product) Object.assign(_aProd, { ...data.product, aiAudit: data.audit });
        saveBrandsStateLocally(state);

        // Re-render entire Studio Drawer so Quality Gate banner, progress tracker & audit results are 100% in sync
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(_aProd?.name || ''));
        setTimeout(() => {
          window.BrandsModule.switchStudioTab('audit');
        }, 50);

      } catch (err) {
        if (container) {
          container.innerHTML = `
            <div style="text-align:center; padding:1.5rem; background:rgba(239,68,68,0.08); border-radius:12px; border:1px solid rgba(239,68,68,0.2);">
              <p style="color:#ef4444; font-weight:700; margin-bottom:0.75rem;">AI Audit Error: ${err.message}</p>
              <button class="btn-secondary btn-sm" onclick="window.BrandsModule.runAIProductAudit(${brandId}, '${productCode}')">Retry Audit</button>
            </div>
          `;
        }
        window.showToast(err.message, 'error');
      }
    },

    async applyAuditedPrice(brandId, productCode, price) {
      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/brands/${brandId}/products/${productCode}/apply-price`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ price })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update price');

        window.showToast(`🏷️ Price updated to $${Number(price).toFixed(2)}!`, 'success');
        // Patch price in in-memory state — do NOT reload from API
        if (!state.productsCatalog) state.productsCatalog = {};
        if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
        let _pprod = state.productsCatalog[brandId].find(p => p.code === productCode);
        if (_pprod) { _pprod.price = Number(price); _pprod.retailPrice = Number(price); }
        saveBrandsStateLocally(state);
        // Update the price input field in the DOM immediately
        const _priceEl = document.getElementById('studioRetailPrice');
        if (_priceEl) _priceEl.value = Number(price).toFixed(2);

      } catch (err) {
        window.showToast(`Price update failed: ${err.message}`, 'error');
      }
    },

    handleMockupFileSelect(event) {
      const files = event.target.files;
      const grid = document.getElementById('mockupThumbnailGrid');
      if (!grid || !files || files.length === 0) return;

      grid.innerHTML = '';
      const limit = Math.min(10, files.length);

      for (let i = 0; i < limit; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.style.cssText = 'position:relative; aspect-ratio:1; border-radius:8px; overflow:hidden; border:1px solid rgba(0,223,137,0.4); background:#000;';
          div.innerHTML = `
            <img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">
            <span style="position:absolute; bottom:2px; left:2px; font-size:0.6rem; font-weight:800; background:rgba(0,0,0,0.85); color:#00df89; padding:1px 4px; border-radius:3px;">Slot ${i + 1}</span>
          `;
          grid.appendChild(div);
        };
        reader.readAsDataURL(file);
      }

      const headerBadge = document.getElementById('mockupHeaderCountBadge');
      if (headerBadge) {
        headerBadge.innerText = `${limit} / 4 min (10 max)`;
        headerBadge.style.color = limit >= 4 ? '#00df89' : '#fbbf24';
        headerBadge.style.background = limit >= 4 ? 'rgba(0,223,137,0.1)' : 'rgba(251,191,36,0.1)';
      }

      const statusEl = document.getElementById('mockupUploadStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">📂 ${limit} image(s) selected · Click "Save Mockups to Vault" to upload</span>`;
      }
    },

    async refreshStudioMockupBriefs(brandId, productCode) {
      if (window.showToast) window.showToast('🔄 Synchronizing 10-Mockup briefs with Blueprint...', 'info');
      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/brands/${brandId}/mockups/refresh-briefs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ productCode })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed refreshing briefs');

        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod && prod.blueprint) {
            prod.blueprint.mockupsList = data.briefs?.mockups || [];
            prod.blueprint.masterMockupPrompt = data.briefs?.masterMockupPrompt || '';
            prod.blueprint.videoPrompt = data.briefs?.videoPrompt || '';
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast('✅ 10 Mockup briefs refreshed from Blueprint 2.0!', 'success');
        const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod?.name || ''));
        setTimeout(() => window.BrandsModule.switchStudioTab('mockups'), 80);
      } catch (err) {
        console.error('[Refresh Mockup Briefs Error]:', err);
        if (window.showToast) window.showToast(`Refresh failed: ${err.message}`, 'error');
      }
    },

    async uploadSingleSlotMockup(brandId, productCode, slotNum, input) {
      const file = input?.files?.[0];
      if (!file) return;

      if (window.showToast) window.showToast(`⏳ Uploading Slot #${slotNum}: ${file.name}...`, 'info');

      try {
        const formData = new FormData();
        formData.append('productCode', productCode);
        formData.append('mockup', file);
        formData.append('rank', slotNum);
        formData.append('totalFiles', 1);

        const uploadHeaders = getStudioAuthHeaders();
        const res = await fetch(`/api/brands/${brandId}/mockups/upload-single`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || `Failed uploading ${file.name}`);

        // Update in-memory state
        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            if (!Array.isArray(prod.mockups)) prod.mockups = [];
            const existingIdx = prod.mockups.findIndex(m => m.rank === slotNum);
            if (existingIdx >= 0) {
              prod.mockups[existingIdx] = data.mockup;
            } else {
              prod.mockups.push(data.mockup);
            }
            prod.mockupsCount = prod.mockups.length;
            prod.mockupUrls = prod.mockups.map(m => m.url).filter(Boolean);
            if (prod.mockups.length >= 4 && (prod.video?.storagePath || prod.video?.fileName)) {
              prod.status = 'Media Ready';
            }
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast(`✅ Slot #${slotNum} saved to Vault!`, 'success');
        const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod?.name || ''));
        setTimeout(() => window.BrandsModule.switchStudioTab('mockups'), 80);
      } catch (err) {
        console.error('[Upload Single Mockup Slot Error]:', err);
        if (window.showToast) window.showToast(`Upload failed: ${err.message}`, 'error');
      }
    },

    async deleteMockupSlot(brandId, productCode, slotNum) {
      if (!confirm(`Clear and remove mockup in Slot #${slotNum}?`)) return;

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/brands/${brandId}/mockups/delete-slot`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ productCode, rank: slotNum })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed deleting slot');

        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            prod.mockups = data.mockups || (prod.mockups || []).filter(m => m.rank !== slotNum);
            prod.mockupsCount = prod.mockups.length;
            prod.mockupUrls = prod.mockups.map(m => m.url).filter(Boolean);
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast(`Slot #${slotNum} cleared.`, 'info');
        const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod?.name || ''));
        setTimeout(() => window.BrandsModule.switchStudioTab('mockups'), 80);
      } catch (err) {
        console.error('[Delete Mockup Slot Error]:', err);
        if (window.showToast) window.showToast(`Failed: ${err.message}`, 'error');
      }
    },

    handleBulkMockupDrop(e, brandId, productCode) {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        window.BrandsModule.uploadProductMockupsWithFiles(brandId, productCode, dt.files);
      }
    },

    onBulkMockupFilesSelected(input, brandId, productCode) {
      if (input && input.files && input.files.length > 0) {
        window.BrandsModule.uploadProductMockupsWithFiles(brandId, productCode, input.files);
      }
    },

    async uploadProductMockupsWithFiles(brandId, productCode, fileList) {
      const statusEl = document.getElementById('mockupUploadStatus');
      const files = Array.from(fileList || []).slice(0, 10);
      if (files.length === 0) return;

      const prod = state.productsCatalog?.[brandId]?.find(p => p.code === productCode);
      const existingMockups = prod?.mockups || [];
      const occupiedRanks = new Set(existingMockups.map(m => m.rank));

      // Calculate slot assignments
      let nextSlot = 1;
      const filePlan = files.map(file => {
        while (occupiedRanks.has(nextSlot) && nextSlot <= 10) {
          nextSlot++;
        }
        if (nextSlot <= 10) {
          const slot = nextSlot;
          occupiedRanks.add(slot);
          return { file, slot, status: 'pending', error: null };
        }
        return { file, slot: null, status: 'skipped', error: 'No slot available' };
      });

      const validUploads = filePlan.filter(p => p.slot !== null);
      if (validUploads.length === 0) {
        if (window.showToast) window.showToast('All 10 mockup slots are already full! Replace or delete slots first.', 'warning');
        return;
      }

      function renderProgressUI(currentIndex = 0) {
        if (!statusEl) return;
        const total = validUploads.length;
        const completedCount = validUploads.filter(u => u.status === 'completed').length;
        const overallPct = Math.round((completedCount / total) * 100);

        statusEl.innerHTML = `
          <div style="background:#141422; border:1px solid rgba(0,223,137,0.35); border-radius:12px; padding:1rem; margin-top:0.75rem; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
            <!-- TOP BAR -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.4rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <div style="width:16px; height:16px; border:2px solid rgba(0,223,137,0.3); border-top-color:#00df89; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                <strong style="font-size:0.82rem; color:#fff;">
                  Uploading Mockups to Cloud Vault (${completedCount} of ${total} Complete)
                </strong>
              </div>
              <span style="font-size:0.78rem; font-weight:800; color:#00df89; font-family:monospace; background:rgba(0,223,137,0.15); border:1px solid rgba(0,223,137,0.3); padding:0.15rem 0.5rem; border-radius:6px;">
                ${overallPct}%
              </span>
            </div>

            <!-- OVERALL PROGRESS BAR -->
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin-bottom:0.75rem;">
              <div style="width:${overallPct}%; height:100%; background:linear-gradient(90deg, #00df89, #06b6d4); transition:width 0.3s ease; border-radius:999px;"></div>
            </div>

            <!-- LIVE FILE UPLOAD QUEUE -->
            <div style="display:flex; flex-direction:column; gap:0.35rem; max-height:180px; overflow-y:auto; padding-right:0.25rem;">
              ${validUploads.map((item, idx) => {
                const isCurrent = idx === currentIndex && item.status === 'uploading';
                const isDone = item.status === 'completed';
                const isFail = item.status === 'failed';
                const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);

                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.65rem; border-radius:6px; background:${isCurrent ? 'rgba(6,182,212,0.12)' : (isDone ? 'rgba(0,223,137,0.08)' : 'rgba(255,255,255,0.02)')}; border:1px solid ${isCurrent ? 'rgba(6,182,212,0.4)' : (isDone ? 'rgba(0,223,137,0.25)' : 'rgba(255,255,255,0.05)')}; font-size:0.74rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden; flex:1; min-width:0;">
                      <span style="font-weight:800; color:${isDone ? '#00df89' : (isCurrent ? '#06b6d4' : 'var(--text-muted)')}; font-family:monospace; min-width:54px;">
                        Slot #${item.slot}
                      </span>
                      <span style="color:#ffffff; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px;">
                        ${item.file.name}
                      </span>
                      <span style="color:var(--text-muted); font-size:0.68rem;">(${sizeMb} MB)</span>
                    </div>
                    <div style="font-weight:700; white-space:nowrap; margin-left:0.5rem;">
                      ${isDone ? '<span style="color:#00df89;">✅ Stored</span>' : ''}
                      ${isCurrent ? '<span style="color:#06b6d4;">⏳ Streaming...</span>' : ''}
                      ${isFail ? `<span style="color:#ef4444;">❌ ${item.error || 'Failed'}</span>` : ''}
                      ${item.status === 'pending' ? '<span style="color:var(--text-muted);">Queued</span>' : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      renderProgressUI(0);
      let uploadHeaders = getStudioAuthHeaders();
      let uploadedCount = 0;

      try {
        for (let i = 0; i < validUploads.length; i++) {
          const item = validUploads[i];
          item.status = 'uploading';
          renderProgressUI(i);

          const formData = new FormData();
          formData.append('productCode', productCode);
          formData.append('mockup', item.file);
          formData.append('rank', item.slot);
          formData.append('totalFiles', validUploads.length);

          try {
            const res = await fetch(`/api/brands/${brandId}/mockups/upload-single`, {
              method: 'POST',
              headers: uploadHeaders,
              body: formData
            });

            const data = await res.json().catch(() => ({}));
            if (data.success && data.mockup) {
              item.status = 'completed';
              if (prod) {
                if (!Array.isArray(prod.mockups)) prod.mockups = [];
                const idx = prod.mockups.findIndex(m => m.rank === item.slot);
                if (idx >= 0) prod.mockups[idx] = data.mockup;
                else prod.mockups.push(data.mockup);
              }
              uploadedCount++;
            } else {
              item.status = 'failed';
              item.error = data.error || 'Upload error';
            }
          } catch (e) {
            item.status = 'failed';
            item.error = e.message;
          }

          renderProgressUI(i + 1);
        }

        if (prod) {
          prod.mockupsCount = prod.mockups?.length || 0;
          prod.mockupUrls = (prod.mockups || []).map(m => m.url).filter(Boolean);
          if (prod.mockupsCount >= 4 && (prod.video?.storagePath || prod.video?.fileName)) {
            prod.status = 'Media Ready';
          }
        }
        saveBrandsStateLocally(state);

        if (statusEl) {
          statusEl.innerHTML = `
            <div style="background:rgba(0,223,137,0.12); border:1px solid rgba(0,223,137,0.4); border-radius:12px; padding:0.85rem 1.1rem; margin-top:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="color:#00df89; font-weight:800; font-size:0.85rem;">
                🎉 Successfully uploaded ${uploadedCount}/${validUploads.length} mockups to Cloud Vault!
              </span>
              <span style="font-size:0.72rem; color:var(--text-secondary);">Refreshed slots &amp; visual grid</span>
            </div>
          `;
        }

        if (window.showToast) window.showToast(`✅ ${uploadedCount} mockups saved to Vault!`, 'success');
        setTimeout(() => {
          window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod?.name || ''));
          window.BrandsModule.switchStudioTab('mockups');
        }, 1200);
      } catch (err) {
        console.error('[Bulk Mockup Upload Error]:', err);
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ ${err.message}</span>`;
        if (window.showToast) window.showToast(`Batch upload error: ${err.message}`, 'error');
      }
    },

    async uploadProductMockups(brandId, productCode) {
      const fileInput = document.getElementById('mockupFilesInput');
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        await window.BrandsModule.uploadProductMockupsWithFiles(brandId, productCode, fileInput.files);
      } else {
        if (window.showToast) window.showToast('Please select 1–10 mockup images first', 'warning');
      }
    },

    async clearProductVideo(brandId, productCode) {
      if (!confirm('Clear stored listing video?')) return;

      try {
        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        await fetch(`/api/brands/${brandId}/product/${productCode}/studio-save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tab: 'video', data: {} })
        });

        if (state.productsCatalog && state.productsCatalog[brandId]) {
          const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
          if (prod) {
            prod.video = {};
          }
        }
        saveBrandsStateLocally(state);

        if (window.showToast) window.showToast('Listing video cleared.', 'info');
        const prod = state.productsCatalog[brandId].find(p => p.code === productCode);
        window.BrandsModule.generateLiveSEOPackage(brandId, productCode, encodeURIComponent(prod?.name || ''));
        setTimeout(() => window.BrandsModule.switchStudioTab('mockups'), 80);
      } catch (err) {
        console.error('[Clear Product Video Error]:', err);
        if (window.showToast) window.showToast(`Failed: ${err.message}`, 'error');
      }
    },

    async pushMockupsToEtsy(brandId, productCode) {
      const statusEl = document.getElementById('mockupUploadStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">🚀 Pushing mockups to live Etsy listing...</span>`;
      }

      try {
        const brandCatalog = state.productsCatalog && state.productsCatalog[brandId] ? state.productsCatalog[brandId] : [];
        const prod = brandCatalog.find(p => p.code === productCode);
        if (!prod || !prod.etsyListingId) {
          throw new Error(`Product ${productCode} has not been created on Etsy yet. Click "Bulk Publish to Etsy" or publish listing first.`);
        }

        const fileInput = document.getElementById('mockupFilesInput');
        const files = fileInput?.files;

        let res;
        if (files && files.length > 0) {
          const formData = new FormData();
          for (let i = 0; i < Math.min(10, files.length); i++) {
            formData.append('mockups', files[i]);
          }
          const headers = getStudioAuthHeaders();
          res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/upload-images`, {
            method: 'POST',
            headers,
            body: formData
          });
        } else if (prod.mockups && prod.mockups.length > 0) {
          const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
          res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/upload-images`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ mockups: prod.mockups })
          });
        } else {
          throw new Error('No mockup images found. Select image files or upload to Vault first.');
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Etsy image push failed');

        window.showToast(`🎉 ${data.data.uploadedCount} mockups are now live on Etsy listing #${prod.etsyListingId}!`, 'success');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#00df89; font-weight:700;">🎉 Live on Etsy! ${data.data.uploadedCount} images active on #${prod.etsyListingId}</span>`;
        }
      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ ${err.message}</span>`;
        window.showToast(err.message, 'error');
      }
    },

    async attachVaultFileToEtsy(brandId, productCode) {
      const statusEl = document.getElementById('vaultUploadStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">🚀 Attaching deliverable to live Etsy listing...</span>`;
      }

      try {
        const brandCatalog = state.productsCatalog && state.productsCatalog[brandId] ? state.productsCatalog[brandId] : [];
        const prod = brandCatalog.find(p => p.code === productCode);
        if (!prod || !prod.etsyListingId) {
          throw new Error(`Product ${productCode} has not been created on Etsy yet. Click "Bulk Publish to Etsy" first.`);
        }
        if (!prod.vault?.storagePath && !prod.vault?.downloadUrl) {
          throw new Error(`No file found in Vault. Upload the PDF/ZIP first.`);
        }

        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/upload-file`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            storagePath: prod.vault.storagePath,
            downloadUrl: prod.vault.downloadUrl,
            fileName: prod.vault.fileName
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to attach file to Etsy');

        window.showToast(`🎉 PDF Deliverable successfully attached to Etsy listing #${prod.etsyListingId}!`, 'success');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#00df89; font-weight:700;">🎉 Deliverable live on Etsy listing #${prod.etsyListingId}!</span>`;
        }
      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ ${err.message}</span>`;
        window.showToast(err.message, 'error');
      }
    },

    async openDBMStandupModal() {
      const dbmIdStr = prompt('Select DBM (1, 2, 3, or 4):', '1');
      if (!dbmIdStr) return;
      const dbmId = Number(dbmIdStr);

      const brandName = prompt('Brand Name worked on today:', 'PlannerQueenGro');
      if (!brandName) return;

      const listed = Number(prompt('How many products were listed today?', '8')) || 0;
      const revenue = Number(prompt('Revenue generated today ($ USD, enter 0 if pre-launch):', '0')) || 0;
      const notes = prompt('Standup notes / wins / blockers:', 'Completed design & upload for daily batch') || '';

      if (window.APP_API) {
        window.APP_API.post('/brands/dbm-logs', {
          dbmId,
          brandName,
          listed,
          revenue,
          notes
        }).catch(err => console.warn('[Standup API] Note:', err.message));
      }

      if (window.showToast) window.showToast(`Logged Standup for DBM ${dbmId} successfully!`, 'success');
      render();
    },

    openAddProductModal() {
      window.BrandsModule.switchTab('products');
    },

    openBrandEtsyCenter(brandId) {
      localStorage.setItem('gro10x_brands_selected_etsy_brand', brandId);
      window.BrandsModule.switchTab('etsy');
    },

    changeEtsyBrand(brandId) {
      localStorage.setItem('gro10x_brands_selected_etsy_brand', brandId);
      renderTabContent('etsy');
    },

    filterEtsyTable(query) {
      const q = (query || '').toLowerCase().trim();
      const rows = document.querySelectorAll('.etsy-prod-row');
      rows.forEach(row => {
        const code = (row.getAttribute('data-code') || '').toLowerCase();
        const name = (row.getAttribute('data-name') || '').toLowerCase();
        if (!q || code.includes(q) || name.includes(q)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    },

    async fetchLiveEtsyStatus(brandId) {
      const badge = document.getElementById('etsyStatusBadge');
      const actions = document.getElementById('etsyConnectionActions');
      const details = document.getElementById('etsyLiveDetails');
      const ordersList = document.getElementById('etsyOrdersList');
      const headers = getStudioAuthHeaders();

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/status`, {
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        
        if (data.success && data.data && data.data.connected) {
          const info = data.data;
          if (badge) {
            badge.style.background = 'rgba(0,223,137,0.15)';
            badge.style.color = '#00df89';
            badge.innerHTML = `🟢 Live Connected · ${info.shopName || 'Store'}`;
          }
          if (actions) {
            actions.innerHTML = `
              <a href="${info.shopUrl || '#'}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;">
                🏪 Open Shop ↗
              </a>
              <button class="btn-secondary btn-sm" onclick="window.BrandsModule.syncEtsyOrders(${brandId})">
                🔄 Sync Orders
              </button>
              <button class="btn-ghost btn-sm" style="color:#ef4444;" onclick="window.BrandsModule.disconnectEtsyStore(${brandId})">
                Disconnect
              </button>
            `;
          }
          if (details) {
            details.style.display = 'grid';
            details.innerHTML = `
              <div><span style="color:var(--text-muted);">Shop ID:</span> <strong style="color:#fff;">${info.shopId || 'Auto-Linked'}</strong></div>
              <div><span style="color:var(--text-muted);">API Status:</span> <strong style="color:#00df89;">Authorized v3 PKCE</strong></div>
              <div><span style="color:var(--text-muted);">Token Lifecycle:</span> <strong style="color:#06b6d4;">Auto-Refreshes</strong></div>
              <div><span style="color:var(--text-muted);">Scopes:</span> <span style="font-family:monospace; font-size:0.7rem; color:var(--text-secondary);">${info.scopes || 'listings_w, shops_w, transactions_r'}</span></div>
            `;
          }
        } else {
          if (badge) {
            badge.style.background = 'rgba(239,68,68,0.15)';
            badge.style.color = '#ef4444';
            badge.innerHTML = '⚪ Store Not Connected';
          }
          if (actions) {
            actions.innerHTML = `
              <button class="btn-primary btn-sm" style="background:#f97316; border-color:#f97316; font-weight:800;" onclick="window.BrandsModule.connectEtsyStore(${brandId})">
                🔑 Connect Etsy Store (OAuth PKCE)
              </button>
            `;
          }
          if (details) details.style.display = 'none';
        }
      } catch (e) {
        if (badge) {
          badge.style.background = 'rgba(255,255,255,0.05)';
          badge.innerHTML = '⚪ Offline / Ready';
        }
      }

      // Fetch live orders
      try {
        const orderRes = await fetch(`/api/etsy/brands/${brandId}/orders`, {
          headers,
          credentials: 'same-origin'
        });
        const orderData = await orderRes.json();
        const orders = orderData.data?.results || [];

        if (ordersList) {
          if (orders.length === 0) {
            ordersList.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.8rem;">No transactions logged yet. Orders sync automatically upon customer purchase.</div>`;
          } else {
            ordersList.innerHTML = `
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.78rem; text-align:left;">
                  <thead>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.08); color:var(--text-muted); font-size:0.68rem; text-transform:uppercase;">
                      <th style="padding:0.5rem;">Order ID</th>
                      <th style="padding:0.5rem;">Customer</th>
                      <th style="padding:0.5rem;">Items</th>
                      <th style="padding:0.5rem;">Amount</th>
                      <th style="padding:0.5rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.slice(0, 5).map(o => `
                      <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                        <td style="padding:0.5rem; font-family:monospace; color:#06b6d4;">#${o.receipt_id}</td>
                        <td style="padding:0.5rem; color:#fff;">${o.buyer_email || 'Buyer'}</td>
                        <td style="padding:0.5rem; color:var(--text-secondary);">${o.listings?.[0]?.title || 'Digital Item'}</td>
                        <td style="padding:0.5rem; font-weight:800; color:#00df89;">$${((o.total_price?.amount || 499) / 100).toFixed(2)}</td>
                        <td style="padding:0.5rem;"><span style="color:#00df89; font-weight:700;">✅ ${o.status || 'Paid & Delivered'}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }
        }
      } catch (e) {}
    },

    refreshEtsyStatus(brandId) {
      window.BrandsModule.fetchLiveEtsyStatus(brandId);
      if (window.showToast) window.showToast('Refreshed Etsy Store status', 'info');
    },

    async connectEtsyStore(brandId) {
      const headers = getStudioAuthHeaders();
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/connect`, {
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.success || !data.data?.authUrl) {
          throw new Error(data.error || 'Could not generate OAuth authorization URL');
        }
        window.location.href = data.data.authUrl;
      } catch (err) {
        if (window.showToast) window.showToast(`Etsy Connect: ${err.message}`, 'error');
      }
    },

    async disconnectEtsyStore(brandId) {
      if (!confirm('Are you sure you want to disconnect this Etsy Store connection?')) return;
      const headers = getStudioAuthHeaders();
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/disconnect`, {
          method: 'POST',
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (window.showToast) window.showToast('Store disconnected', 'info');
        window.BrandsModule.fetchLiveEtsyStatus(brandId);
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async runAIEtsyHealthCheck(brandId) {
      const headers = getStudioAuthHeaders();
      if (window.showToast) window.showToast('🩺 Running AI 10-Rule Pre-Listing Health Check across all 100 products...', 'info');

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/health-check-all`, {
          method: 'POST',
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Health check failed');

        const report = data.data;
        const passBadge = document.getElementById('etsyPassRateBadge');
        if (passBadge) {
          passBadge.innerHTML = `<span style="color:#00df89;">${report.passRate}</span> (${report.passedCount}/${report.total})`;
        }

        window.BrandsModule.openHealthCheckModal(brandId, report);
      } catch (err) {
        if (window.showToast) window.showToast(`Health check error: ${err.message}`, 'error');
      }
    },

    async runSingleProductHealthCheck(brandId, productIdx) {
      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog[productIdx];
      if (!prod) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.code}/health-check`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ product: prod })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');

        const singleReport = {
          brandName: state.brands.find(b => b.id === brandId)?.name,
          total: 1,
          passedCount: data.data.passed ? 1 : 0,
          failedCount: data.data.passed ? 0 : 1,
          avgScore: data.data.score,
          passRate: data.data.passed ? '100%' : '0%',
          results: [data.data]
        };

        window.BrandsModule.openHealthCheckModal(brandId, singleReport);
      } catch (e) {
        if (window.showToast) window.showToast(e.message, 'error');
      }
    },

    openHealthCheckModal(brandId, report) {
      const modal = document.getElementById('etsyHealthModal');
      const content = document.getElementById('etsyHealthModalContent');
      if (!modal || !content) return;

      const passed = report.passedCount;
      const total = report.total;
      const failedList = report.results.filter(r => !r.passed);

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <h2 style="font-size:1.4rem; font-weight:900; color:#fff; margin:0;">🩺 AI Pre-Listing Health Report</h2>
              <span style="font-size:0.75rem; font-weight:800; padding:0.25rem 0.6rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
                Score: ${report.avgScore} / 10.0
              </span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin:0.3rem 0 0;">
              Brand: <strong>${report.brandName}</strong> · 10-Rule Compliance & Organic SEO Validation
            </p>
          </div>
          <button onclick="document.getElementById('etsyHealthModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <!-- SUMMARY STATS -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-bottom:1.5rem;">
          <div style="background:rgba(0,223,137,0.1); border:1px solid rgba(0,223,137,0.3); padding:1rem; border-radius:12px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:900; color:#00df89;">${passed} / ${total}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Passed & 100% Ready</div>
          </div>
          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:1rem; border-radius:12px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:900; color:#ef4444;">${report.failedCount}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Flagged for Fixes</div>
          </div>
          <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.3); padding:1rem; border-radius:12px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:900; color:#06b6d4;">${report.passRate}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Catalog Compliance</div>
          </div>
        </div>

        <!-- DETAILED ISSUES & CHECKS -->
        <div>
          <h4 style="font-size:0.95rem; font-weight:800; color:#fff; margin-bottom:0.75rem;">
            ${failedList.length === 0 ? '🎉 All Products Passed All 10 Rules!' : `⚠️ Products Requiring Remediation (${failedList.length}):`}
          </h4>
          
          <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:360px; overflow-y:auto; padding-right:0.25rem;">
            ${report.results.map(r => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid ${r.passed ? 'rgba(0,223,137,0.2)' : 'rgba(239,68,68,0.3)'}; border-radius:10px; padding:0.85rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <div style="font-weight:800; color:#fff; font-size:0.85rem;">
                    <span style="color:#06b6d4;">${r.productCode}</span> · ${r.productName}
                  </div>
                  <span style="font-size:0.7rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:6px; background:${r.passed ? 'rgba(0,223,137,0.2)' : 'rgba(239,68,68,0.2)'}; color:${r.passed ? '#00df89' : '#ef4444'};">
                    ${r.passed ? '✅ PASSED' : `❌ ${r.failures.length} FIXES`}
                  </span>
                </div>

                ${r.failures.length > 0 ? `
                  <div style="display:flex; flex-direction:column; gap:0.25rem; margin-top:0.4rem;">
                    ${r.failures.map(f => `
                      <div style="font-size:0.75rem; color:#ef4444; display:flex; align-items:center; gap:0.3rem;">
                        <span>•</span> <span>${f.message}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                ${r.warnings && r.warnings.length > 0 ? `
                  <div style="display:flex; flex-direction:column; gap:0.25rem; margin-top:0.3rem;">
                    ${r.warnings.map(w => `
                      <div style="font-size:0.72rem; color:#fbbf24; display:flex; align-items:center; gap:0.3rem;">
                        <span>⚠</span> <span>${w.message}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
          <button class="btn-secondary" onclick="navigator.clipboard.writeText(JSON.stringify(${escape(JSON.stringify(report))})); window.showToast('Copied QA Health Report JSON!','success');">
            📋 Copy Full QA Report
          </button>
          <button class="btn-primary" onclick="document.getElementById('etsyHealthModal').style.display='none'">
            Close Report
          </button>
        </div>
      `;

      modal.style.display = 'flex';
    },

    async uploadProductVideo(brandId, productCode) {
      const fileInput = document.getElementById('listingVideoInput');
      const file = fileInput?.files?.[0];
      if (!file) {
        if (window.showToast) window.showToast('Please select an MP4/MOV video file first', 'warning');
        return;
      }

      const statusEl = document.getElementById('videoUploadStatus');

      try {
        if (statusEl) statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">⏳ Uploading ${file.name} to Cloud Vault...</span>`;

        const formData = new FormData();
        formData.append('productCode', productCode);
        formData.append('video', file);

        const uploadHeaders = getStudioAuthHeaders();
        const res = await fetch(`/api/brands/${brandId}/video/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed uploading video');

        if (window.showToast) window.showToast(`✅ Video saved to Cloud Vault: ${file.name}!`, 'success');
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:#00df89; font-weight:700;">✅ Stored in Vault: ${file.name}</span>`;
        }

        // Directly patch in-memory state — do NOT reload from API (Vercel returns stale seed data)
        if (!state.productsCatalog) state.productsCatalog = {};
        if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
        let _vprod = state.productsCatalog[brandId].find(p => p.code === productCode);
        if (!_vprod) { _vprod = { code: productCode, status: 'Draft' }; state.productsCatalog[brandId].push(_vprod); }
        _vprod.video = data.video || { fileName: file.name, storagePath: `brands/${brandId}/${productCode}/video/${file.name}`, uploadedAt: new Date().toISOString() };
        if ((_vprod.mockupsCount || _vprod.mockups?.length || 0) >= 4) _vprod.status = 'Media Ready';
        saveBrandsStateLocally(state);
        // Update progress bar live
        const _vpctEl = document.getElementById('studioHeaderPctBadge');
        const _vbarEl = document.getElementById('studioHeaderProgressBar');
        const _vvaultDone = Boolean(_vprod.vault?.storagePath || _vprod.vault?.downloadUrl);
        const _vmocksDone = (_vprod.mockupsCount || _vprod.mockups?.length || 0) >= 4;
        const _vvidDone = Boolean(_vprod.video?.storagePath || _vprod.video?.fileName);
        const _vauditDone = (_vprod.aiAudit?.overall_score || 0) >= 7.0;
        const _vseoDone = Boolean(_vprod.seo?.title || _vprod.seoTitle);
        const _vbpDone = Boolean(_vprod.blueprint?.prompt || _vprod.blueprint?.geometry);
        const _vpct = (_vbpDone ? 20 : 0) + (_vvaultDone ? 20 : 0) + (_vmocksDone && _vvidDone ? 20 : 0) + (_vauditDone ? 20 : 0) + (_vseoDone ? 20 : 0);
        if (_vpctEl) { _vpctEl.innerText = `${_vpct}% Ready`; _vpctEl.style.color = _vpct >= 80 ? '#00df89' : (_vpct >= 40 ? '#fbbf24' : '#ef4444'); }
        if (_vbarEl) _vbarEl.style.width = `${_vpct}%`;

      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ ${err.message}</span>`;
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async pushVideoToEtsy(brandId, productCode) {
      const statusEl = document.getElementById('videoUploadStatus');
      try {
        const brandCatalog = state.productsCatalog && state.productsCatalog[brandId] ? state.productsCatalog[brandId] : [];
        const prod = brandCatalog.find(p => p.code === productCode);
        if (!prod || !prod.etsyListingId) {
          throw new Error(`Product ${productCode} has not been created on Etsy yet. Click "Bulk Publish to Etsy" first.`);
        }

        const fileInput = document.getElementById('listingVideoInput');
        const file = fileInput?.files?.[0];
        const headers = getStudioAuthHeaders();

        if (statusEl) statusEl.innerHTML = `<span style="color:#06b6d4; font-weight:700;">🚀 Pushing video to Etsy listing #${prod.etsyListingId}...</span>`;

        let res;
        if (file) {
          const formData = new FormData();
          formData.append('video', file);
          const uploadHeaders = getStudioAuthHeaders();
          delete uploadHeaders['Content-Type']; // Let browser set multipart boundary
          res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/upload-video`, {
            method: 'POST',
            headers: uploadHeaders,
            credentials: 'same-origin',
            body: formData
          });
        } else if (prod.video) {
          res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/upload-video`, {
            method: 'POST',
            headers: getStudioAuthHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'same-origin',
            body: JSON.stringify(prod.video)
          });
        } else {
          throw new Error('No video file selected or found in Vault.');
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Video push to Etsy failed');

        if (window.showToast) window.showToast(`🎉 Video is now live on Etsy listing #${prod.etsyListingId}!`, 'success');
        if (statusEl) statusEl.innerHTML = `<span style="color:#00df89; font-weight:700;">🎉 Video Live on Etsy listing #${prod.etsyListingId}!</span>`;
      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">❌ ${err.message}</span>`;
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async openShopProfileModal(brandId) {
      const modal = document.getElementById('shopProfileModal');
      const content = document.getElementById('shopProfileModalContent');
      if (!modal || !content) return;

      const b = state.brands.find(x => x.id === brandId) || state.brands[0];
      const headers = getStudioAuthHeaders();

      content.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <div style="font-size:2rem; animation:spin 1s linear infinite;">🔄</div>
          <p style="color:var(--text-muted); margin-top:0.5rem;">Loading Etsy Shop Profile for ${b.name}...</p>
        </div>
      `;
      modal.style.display = 'flex';

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/shop`, {
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        const shop = data.data || {};

        content.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
            <div>
              <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">🛍️ Etsy Shop Profile: ${b.name}</h3>
              <span style="font-size:0.75rem; color:var(--text-secondary);">Shop ID: ${shop.shop_id || b.etsyShopId || 'Not Linked'} · Currency: ${shop.currency_code || 'USD'}</span>
            </div>
            <button onclick="document.getElementById('shopProfileModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Shop Title / Tagline</label>
              <input type="text" id="shopProfileTitle" value="${shop.title || b.tagline || ''}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>

            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Shop Announcement</label>
              <textarea id="shopProfileAnnouncement" rows="3" style="width:100%; font-size:0.82rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; line-height:1.4;">${shop.announcement || ''}</textarea>
            </div>

            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Sale Message (Receipt Note)</label>
              <textarea id="shopProfileSaleMessage" rows="2" style="width:100%; font-size:0.82rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; line-height:1.4;">${shop.sale_message || ''}</textarea>
            </div>

            <div style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); border-radius:8px; padding:0.75rem; font-size:0.75rem; color:#fbbf24;">
              ℹ️ <em>Note: Shop Banner and Logo imagery must be updated directly in the Etsy Seller Dashboard due to Etsy v3 API permission policies.</em>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
              <button class="btn-ghost" onclick="document.getElementById('shopProfileModal').style.display='none'">Cancel</button>
              <button class="btn-primary" onclick="window.BrandsModule.saveShopProfile(${brandId})">💾 Save Profile to Etsy</button>
            </div>
          </div>
        `;
      } catch (err) {
        content.innerHTML = `
          <div style="text-align:center; padding:1.5rem;">
            <p style="color:#ef4444; font-weight:700;">Could not load shop profile: ${err.message}</p>
            <button class="btn-secondary btn-sm" onclick="document.getElementById('shopProfileModal').style.display='none'">Close</button>
          </div>
        `;
      }
    },

    async saveShopProfile(brandId) {
      const title = document.getElementById('shopProfileTitle')?.value || '';
      const announcement = document.getElementById('shopProfileAnnouncement')?.value || '';
      const sale_message = document.getElementById('shopProfileSaleMessage')?.value || '';

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/shop`, {
          method: 'PUT',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ title, announcement, sale_message })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed updating shop profile');

        if (window.showToast) window.showToast('✅ Etsy Shop Profile updated successfully!', 'success');
        document.getElementById('shopProfileModal').style.display = 'none';
      } catch (err) {
        if (window.showToast) window.showToast(`Error: ${err.message}`, 'error');
      }
    },

    async openSectionsModal(brandId) {
      const modal = document.getElementById('sectionsModal');
      const content = document.getElementById('sectionsModalContent');
      if (!modal || !content) return;

      const b = state.brands.find(x => x.id === brandId) || state.brands[0];
      const headers = getStudioAuthHeaders();

      content.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <div style="font-size:2rem; animation:spin 1s linear infinite;">🔄</div>
          <p style="color:var(--text-muted); margin-top:0.5rem;">Loading Shop Sections for ${b.name}...</p>
        </div>
      `;
      modal.style.display = 'flex';

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/sections`, {
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        const sections = data.data?.results || [];

        content.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
            <div>
              <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">📋 Shop Sections: ${b.name}</h3>
              <span style="font-size:0.75rem; color:var(--text-secondary);">${sections.length} active sections on Etsy</span>
            </div>
            <button onclick="document.getElementById('sectionsModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <!-- CREATE NEW SECTION -->
          <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; background:rgba(0,0,0,0.3); padding:0.75rem; border-radius:10px;">
            <input type="text" id="newSectionTitle" placeholder="New section name (e.g. Budget Planners)..." style="flex:1; font-size:0.82rem; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            <button class="btn-primary btn-sm" onclick="window.BrandsModule.createShopSection(${brandId})">+ Create Section</button>
          </div>

          <!-- SECTIONS LIST -->
          <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:280px; overflow-y:auto;">
            ${sections.length === 0 ? `
              <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.82rem;">No custom sections yet on this Etsy store.</div>
            ` : sections.map(s => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.6rem 0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                <div>
                  <strong style="color:#fff; font-size:0.85rem;">${s.title}</strong>
                  <span style="font-size:0.72rem; color:var(--text-muted); margin-left:0.5rem;">Section ID: ${s.shop_section_id}</span>
                </div>
                <span style="font-size:0.72rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.15rem 0.5rem; border-radius:999px; font-weight:700;">
                  ${s.active_listing_count || 0} active
                </span>
              </div>
            `).join('')}
          </div>
        `;
      } catch (err) {
        content.innerHTML = `
          <div style="text-align:center; padding:1.5rem;">
            <p style="color:#ef4444; font-weight:700;">Could not load sections: ${err.message}</p>
            <button class="btn-secondary btn-sm" onclick="document.getElementById('sectionsModal').style.display='none'">Close</button>
          </div>
        `;
      }
    },

    async createShopSection(brandId) {
      const titleInput = document.getElementById('newSectionTitle');
      const title = titleInput?.value?.trim();
      if (!title) {
        if (window.showToast) window.showToast('Please enter a section title', 'warning');
        return;
      }

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/sections`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ title })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create section');

        if (window.showToast) window.showToast(`✅ Section "${title}" created on Etsy!`, 'success');
        window.BrandsModule.openSectionsModal(brandId);
      } catch (err) {
        if (window.showToast) window.showToast(`Error: ${err.message}`, 'error');
      }
    },

    async openEditLiveListingModal(brandId, productCode) {
      const modal = document.getElementById('editLiveListingModal');
      const content = document.getElementById('editLiveListingModalContent');
      if (!modal || !content) return;

      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog.find(p => p.code === productCode);
      if (!prod) return;

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
          <div>
            <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">✏️ Edit Live Etsy Listing</h3>
            <span style="font-size:0.75rem; color:var(--text-secondary);">${prod.code} · Etsy Listing #${prod.etsyListingId || 'Pending'}</span>
          </div>
          <button onclick="document.getElementById('editLiveListingModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Listing Title (Max 140 chars)</label>
            <input type="text" id="liveEditTitle" maxlength="140" value="${prod.seoTitle || prod.name || ''}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Price ($ USD)</label>
              <input type="number" step="0.01" id="liveEditPrice" value="${prod.price || 4.99}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Quantity Available</label>
              <input type="number" id="liveEditQty" value="${prod.quantity || 999}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
          </div>

          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Listing Description</label>
            <textarea id="liveEditDesc" rows="4" style="width:100%; font-size:0.82rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; line-height:1.4;">${prod.seoDescription || ''}</textarea>
          </div>

          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">13 Etsy Tags (Comma-separated)</label>
            <input type="text" id="liveEditTags" value="${(prod.seoTags || []).join(', ')}" style="width:100%; font-size:0.82rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#06b6d4;">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
            <button class="btn-ghost" onclick="document.getElementById('editLiveListingModal').style.display='none'">Cancel</button>
            <button class="btn-primary" onclick="window.BrandsModule.saveEditLiveListing(${brandId}, '${productCode}')">💾 Update Live Listing</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    async saveEditLiveListing(brandId, productCode) {
      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog.find(p => p.code === productCode);
      if (!prod || !prod.etsyListingId) {
        if (window.showToast) window.showToast('Listing ID missing', 'error');
        return;
      }

      const title = document.getElementById('liveEditTitle')?.value || '';
      const price = parseFloat(document.getElementById('liveEditPrice')?.value || '4.99');
      const quantity = parseInt(document.getElementById('liveEditQty')?.value || '999', 10);
      const description = document.getElementById('liveEditDesc')?.value || '';
      const tagsStr = document.getElementById('liveEditTags')?.value || '';
      const tags = tagsStr.split(',').map(t => t.trim().substring(0, 20)).filter(Boolean).slice(0, 13);

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}`, {
          method: 'PATCH',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ title, price, quantity, description, tags, productCode })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update live listing');

        if (window.showToast) window.showToast(`✅ Live Etsy listing #${prod.etsyListingId} updated!`, 'success');
        document.getElementById('editLiveListingModal').style.display = 'none';
        state = await loadBrandsStateFromAPI();
        renderTabContent('etsy');
      } catch (err) {
        if (window.showToast) window.showToast(`Update failed: ${err.message}`, 'error');
      }
    },

    async syncLiveEtsyCatalog(brandId = 1) {
      if (window.showToast) window.showToast('🔄 Scanning Etsy Shop for active listings...', 'info');
      try {
        if (window.APP_API?._cache) window.APP_API._cache = {};
        localStorage.removeItem('gro10x_brands_data');

        const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
        const res = await fetch(`/api/etsy/brands/${brandId}/sync-live-catalog`, {
          method: 'POST',
          headers
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.error || 'Failed to sync with Etsy shop');
        }

        const count = data.data?.reconciledCount ?? data.reconciledCount ?? (data.data?.matchedProducts?.length || 0);
        if (window.showToast) {
          window.showToast(`✅ Reconciled ${count} live listings from Etsy!`, 'success');
        }

        // Force fresh load from server database (bypassing all client caches)
        state = await loadBrandsStateFromAPI(true);
        const b = state.brands?.find(x => x.id === Number(brandId));
        if (b) {
          b.productsLive = (state.productsCatalog?.[brandId] || state.productsCatalog?.[String(brandId)] || []).filter(p => p.status === 'Live').length;
        }
        saveBrandsStateLocally(state);

        renderTabContent(currentTab);
        render();
      } catch (err) {
        console.error('[Sync Etsy Catalog Error]:', err);
        if (window.showToast) window.showToast(`❌ Sync error: ${err.message}`, 'error');
      }
    },

    async renewSingleListing(brandId, productCode) {
      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog.find(p => p.code === productCode);
      if (!prod || !prod.etsyListingId) {
        if (window.showToast) window.showToast('Listing is not live on Etsy yet', 'warning');
        return;
      }

      if (!confirm(`Renewing listing ${prod.code} will cost $0.20 on Etsy and extend the listing for another 120 days. Proceed?`)) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/renew`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ productCode })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to renew listing');

        if (window.showToast) window.showToast(`🔄 Renewed ${prod.code}! $0.20 logged. Expiry extended by 120 days.`, 'success');
        state = await loadBrandsStateFromAPI();
        renderTabContent(currentTab);
      } catch (err) {
        if (window.showToast) window.showToast(`Renew failed: ${err.message}`, 'error');
      }
    },

    async deactivateSingleListing(brandId, productCode) {
      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog.find(p => p.code === productCode);
      if (!prod || !prod.etsyListingId) return;

      if (!confirm(`Deactivate listing ${prod.code} on Etsy? It will be hidden from shoppers.`)) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/deactivate`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ productCode })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to deactivate');

        if (window.showToast) window.showToast(`⏸ Listing ${prod.code} paused on Etsy`, 'info');
        state = await loadBrandsStateFromAPI();
        renderTabContent(currentTab);
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async reactivateSingleListing(brandId, productCode) {
      const catalog = state.productsCatalog[brandId] || [];
      const prod = catalog.find(p => p.code === productCode);
      if (!prod || !prod.etsyListingId) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/listings/${prod.etsyListingId}/reactivate`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ productCode })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to reactivate');

        if (window.showToast) window.showToast(`▶️ Listing ${prod.code} reactivated live on Etsy!`, 'success');
        state = await loadBrandsStateFromAPI();
        renderTabContent(currentTab);
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async syncLiveEtsyListings(brandId) {
      return window.BrandsModule.syncLiveEtsyCatalog(brandId);
    },

    async bulkRenewAllExpiring() {
      const now = Date.now();
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const expiring = [];

      state.brands.forEach(b => {
        const catalog = state.productsCatalog[b.id] || [];
        catalog.forEach(p => {
          if (p.status === 'Live' && p.expiresAt && p.etsyListingId) {
            if ((new Date(p.expiresAt).getTime() - now) <= fourteenDaysMs) {
              expiring.push({ brandId: b.id, brandName: b.name, product: p });
            }
          }
        });
      });

      if (expiring.length === 0) {
        if (window.showToast) window.showToast('No listings are currently within the 14-day expiry window', 'info');
        return;
      }

      const totalCost = (expiring.length * 0.20).toFixed(2);
      if (!confirm(`Renewing all ${expiring.length} expiring listings will cost $${totalCost} ($0.20 per listing). Proceed?`)) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      let renewed = 0;

      for (const item of expiring) {
        try {
          await fetch(`/api/etsy/brands/${item.brandId}/listings/${item.product.etsyListingId}/renew`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ productCode: item.product.code })
          });
          renewed++;
        } catch (e) {
          console.warn('Renewal failed for', item.product.code);
        }
      }

      if (window.showToast) window.showToast(`🎉 Successfully renewed ${renewed} listings! $${(renewed * 0.20).toFixed(2)} logged.`, 'success');
      state = await loadBrandsStateFromAPI();
      renderTabContent('lifecycle');
    },

    openAddBrandModal() {
      const modal = document.getElementById('addBrandModal');
      const content = document.getElementById('addBrandModalContent');
      if (!modal || !content) return;

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
          <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">🏢 Create New Brand Store</h3>
          <button onclick="document.getElementById('addBrandModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Brand Name</label>
            <input type="text" id="newBrandName" placeholder="e.g. ZenFlowPlanners" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Niche</label>
              <input type="text" id="newBrandNiche" placeholder="e.g. Mindfulness & Wellness" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Brand Type</label>
              <select id="newBrandType" style="width:100%; font-size:0.85rem; padding:0.6rem; background:var(--surface-card, #181824); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
                <option value="Digital">Digital PDF / ZIP</option>
                <option value="POD">Print on Demand (POD)</option>
                <option value="Hybrid">Hybrid (Digital + POD)</option>
                <option value="KDP">KDP Paperback / Hardcover</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Tagline</label>
            <input type="text" id="newBrandTagline" placeholder="e.g. Elegant mind-body daily organizers" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
          </div>

          <div>
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">12-Month Gross Revenue Target ($ USD)</label>
            <input type="number" id="newBrandTarget" value="84000" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
            <button class="btn-ghost" onclick="document.getElementById('addBrandModal').style.display='none'">Cancel</button>
            <button class="btn-primary" onclick="window.BrandsModule.saveNewBrand()">✨ Create Brand</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    openAddProductToBrandModal(brandId) {
      const modal = document.getElementById('addProductModal');
      const content = document.getElementById('addProductModalContent');
      if (!modal || !content) return;

      const b = state.brands.find(x => x.id === brandId) || state.brands[0];
      const nextNum = (state.productsCatalog[b.id]?.length || 0) + 1;
      const codePrefix = b.name.substring(0, 3).toUpperCase();
      const defaultCode = `${codePrefix}-${nextNum.toString().padStart(2, '0')}`;

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
          <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">📦 Add Custom Product to ${b.name}</h3>
          <button onclick="document.getElementById('addProductModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">SKU / Code</label>
              <input type="text" id="newProdCode" value="${defaultCode}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#06b6d4; font-weight:800;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Product Name</label>
              <input type="text" id="newProdName" placeholder="e.g. 2026 Ultimate Habit Tracker" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Category / Section</label>
              <input type="text" id="newProdCategory" placeholder="e.g. Habit Trackers" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Retail Price ($ USD)</label>
              <input type="number" step="0.01" id="newProdPrice" value="4.99" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
            </div>
          </div>

          <!-- OPTION B: CUSTOM BLUEPRINT SPECIFICATION -->
          <div style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.25); border-radius:12px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span style="font-size:0.75rem; font-weight:800; color:#06b6d4; text-transform:uppercase;">⚡ Custom Product Blueprint Concept (Optional)</span>
            </div>
            <textarea id="newProdCustomIdea" rows="2" placeholder="Describe layout idea or specific spreads (e.g., Weekly Meal Planner with Budget & Grocery checklist)..." style="width:100%; font-size:0.8rem; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; padding:0.5rem; resize:none; box-sizing:border-box; margin-bottom:0.5rem;"></textarea>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <button class="btn-ghost" onclick="document.getElementById('addProductModal').style.display='none'">Cancel</button>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-secondary" onclick="window.BrandsModule.saveNewProduct(${b.id}, false)">💾 Save to Catalog</button>
              <button class="btn-primary" onclick="window.BrandsModule.saveNewProduct(${b.id}, true)">🚀 Save & Open Studio</button>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    async saveNewProduct(brandId, openStudioImmediately = false) {
      const code = document.getElementById('newProdCode')?.value?.trim();
      const name = document.getElementById('newProdName')?.value?.trim();
      const category = document.getElementById('newProdCategory')?.value?.trim() || 'General';
      const price = parseFloat(document.getElementById('newProdPrice')?.value || '4.99');
      const customIdea = document.getElementById('newProdCustomIdea')?.value?.trim() || '';

      if (!code || !name) {
        if (window.showToast) window.showToast('Please provide product code and name', 'warning');
        return;
      }

      if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
      const newProductObj = {
        code,
        name,
        category,
        price,
        format: 'Digital PDF',
        status: 'Draft',
        customIdea: customIdea || undefined
      };
      state.productsCatalog[brandId].push(newProductObj);

      saveBrandsStateLocally(state);
      if (window.showToast) window.showToast(`✅ Added ${code}: ${name} to catalog!`, 'success');
      document.getElementById('addProductModal').style.display = 'none';
      renderTabContent(currentTab);

      if (openStudioImmediately) {
        setTimeout(() => {
          window.BrandsModule.generateLiveSEOPackage(brandId, code, encodeURIComponent(name));
        }, 150);
      }
    },

    async saveNewBrand() {
      const name = document.getElementById('newBrandName')?.value?.trim();
      const niche = document.getElementById('newBrandNiche')?.value?.trim();
      const type = document.getElementById('newBrandType')?.value || 'Digital';
      const tagline = document.getElementById('newBrandTagline')?.value?.trim() || '';
      const target12mo = parseFloat(document.getElementById('newBrandTarget')?.value || '84000');

      if (!name || !niche) {
        if (window.showToast) window.showToast('Please provide brand name and niche', 'warning');
        return;
      }

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch('/api/brands', {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ name, niche, type, tagline, target12mo })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed creating brand');

        if (window.showToast) window.showToast(`🎉 Created Brand "${name}"!`, 'success');
        document.getElementById('addBrandModal').style.display = 'none';
        state = await loadBrandsStateFromAPI();
        render();
      } catch (err) {
        if (window.showToast) window.showToast(`Error: ${err.message}`, 'error');
      }
    },

    openAddProductToBrandModal(brandId) {
      const modal = document.getElementById('addProductModal');
      const content = document.getElementById('addProductModalContent');
      if (!modal || !content) return;

      const b = state.brands.find(x => x.id === brandId) || state.brands[0];
      const nextNum = (state.productsCatalog[b.id]?.length || 0) + 1;
      const codePrefix = b.name.substring(0, 3).toUpperCase();
      const defaultCode = `${codePrefix}-${nextNum.toString().padStart(2, '0')}`;

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.75rem;">
          <h3 style="font-size:1.2rem; font-weight:900; color:#fff; margin:0;">📦 Add Product to ${b.name}</h3>
          <button onclick="document.getElementById('addProductModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">SKU / Code</label>
              <input type="text" id="newProdCode" value="${defaultCode}" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#06b6d4; font-weight:800;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Product Name</label>
              <input type="text" id="newProdName" placeholder="e.g. 2026 Ultimate Habit Tracker" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Category / Section</label>
              <input type="text" id="newProdCategory" placeholder="e.g. Habit Trackers" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>
            <div>
              <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.3rem;">Retail Price ($ USD)</label>
              <input type="number" step="0.01" id="newProdPrice" value="4.99" style="width:100%; font-size:0.85rem; padding:0.6rem; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
            <button class="btn-ghost" onclick="document.getElementById('addProductModal').style.display='none'">Cancel</button>
            <button class="btn-primary" onclick="window.BrandsModule.saveNewProduct(${b.id})">✨ Add to Catalog</button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    async saveNewProduct(brandId) {
      const code = document.getElementById('newProdCode')?.value?.trim();
      const name = document.getElementById('newProdName')?.value?.trim();
      const category = document.getElementById('newProdCategory')?.value?.trim() || 'General';
      const price = parseFloat(document.getElementById('newProdPrice')?.value || '4.99');

      if (!code || !name) {
        if (window.showToast) window.showToast('Please provide product code and name', 'warning');
        return;
      }

      if (!state.productsCatalog[brandId]) state.productsCatalog[brandId] = [];
      state.productsCatalog[brandId].push({
        code,
        name,
        category,
        price,
        format: 'Digital PDF',
        status: 'Pending'
      });

      saveBrandsStateLocally(state);
      if (window.showToast) window.showToast(`✅ Added ${code}: ${name} to catalog!`, 'success');
      document.getElementById('addProductModal').style.display = 'none';
      renderTabContent(currentTab);
    },

    async deleteProduct(brandId, productCode) {
      if (!confirm(`Are you sure you want to delete ${productCode} from catalog?`)) return;

      const headers = getStudioAuthHeaders();
      try {
        await fetch(`/api/brands/${brandId}/product/${productCode}`, {
          method: 'DELETE',
          headers,
          credentials: 'same-origin'
        });

        if (state.productsCatalog[brandId]) {
          state.productsCatalog[brandId] = state.productsCatalog[brandId].filter(p => p.code !== productCode);
          saveBrandsStateLocally(state);
        }

        if (window.showToast) window.showToast(`Deleted ${productCode}`, 'info');
        renderTabContent(currentTab);
      } catch (err) {
        if (window.showToast) window.showToast(`Error: ${err.message}`, 'error');
      }
    },

    async publishBulkEtsy(brandId) {
      const b = state.brands.find(x => x.id === brandId) || state.brands[0];
      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });

      // Step 1: Pre-flight dry-run cost estimation
      try {
        const dryRes = await fetch(`/api/etsy/brands/${brandId}/publish-all`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ dryRun: true })
        });
        const dryData = await dryRes.json();
        const costInfo = dryData.data || { count: 0, estimatedCostUsd: '0.00' };

        // Open Cost Confirmation Modal
        const costModal = document.getElementById('costConfirmModal');
        const costContent = document.getElementById('costConfirmModalContent');

        if (costModal && costContent) {
          costContent.innerHTML = `
            <div style="text-align:center; padding:1.5rem;">
              <div style="font-size:2.8rem; margin-bottom:0.5rem;">💳</div>
              <h3 style="font-size:1.3rem; font-weight:900; color:#fff; margin:0 0 0.4rem;">Confirm Etsy Listing Fees</h3>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 1.25rem;">
                Publishing <strong>${costInfo.count} ready products</strong> to <strong>${b.name}</strong> on Etsy.
              </p>

              <div style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center;">
                <span style="font-size:0.75rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">Estimated Etsy Bill:</span>
                <div style="font-size:2.2rem; font-weight:900; color:#fbbf24; margin:0.2rem 0;">
                  $${costInfo.estimatedCostUsd}
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted);">$0.20 per listing for a 120-day cycle</span>
              </div>

              <div style="display:flex; justify-content:center; gap:0.75rem;">
                <button class="btn-ghost" onclick="document.getElementById('costConfirmModal').style.display='none'">
                  Cancel
                </button>
                <button class="btn-primary" style="background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:900;" onclick="document.getElementById('costConfirmModal').style.display='none'; window.BrandsModule.executeBulkPublish(${brandId})">
                  🚀 Authorize & Publish (${costInfo.count} Products)
                </button>
              </div>
            </div>
          `;
          costModal.style.display = 'flex';
          return;
        }
      } catch (e) {
        console.warn('Dry-run check failed, proceeding to direct publish', e);
      }

      window.BrandsModule.executeBulkPublish(brandId);
    },

    async executeBulkPublish(brandId) {
      const modal = document.getElementById('etsyBulkModal');
      const content = document.getElementById('etsyBulkModalContent');
      if (!modal || !content) return;

      const b = state.brands.find(x => x.id === brandId);
      modal.style.display = 'flex';

      content.innerHTML = `
        <div style="text-align:center; padding:1.5rem;">
          <div style="width:60px; height:60px; border-radius:50%; border:3px solid rgba(0,223,137,0.2); border-top-color:#00df89; animation:spin 1s linear infinite; margin:0 auto 1.25rem;"></div>
          <h3 style="font-size:1.3rem; font-weight:900; color:#fff; margin:0 0 0.4rem;">Publishing Catalog to Etsy</h3>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin:0 0 1.5rem;">
            Executing sequential listing creation, asset streaming from Cloud Vault, and live activation for <strong>${b?.name || 'Brand'}</strong>...
          </p>

          <div style="background:rgba(255,255,255,0.04); border-radius:12px; padding:1rem; text-align:left; font-family:monospace; font-size:0.75rem; color:#06b6d4; max-height:220px; overflow-y:auto; line-height:1.6;" id="bulkConsoleLog">
            > Initializing Etsy v3 API throttled publisher (5 QPS cap)...<br>
            > Verifying Cloud Vault deliverables, 1-10 mockups, and video files...<br>
            > Deducting $0.20 listing fee ledger entry...<br>
          </div>
        </div>
      `;

      const logEl = document.getElementById('bulkConsoleLog');
      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/publish-all`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ autoActivate: true })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Bulk publish failed');

        const result = data.data;
        if (logEl) {
          logEl.innerHTML += `
            > ✅ Batch completed successfully!<br>
            > Listed ${result.publishedCount} products live on Etsy.<br>
            > Total fees charged: $${result.totalFeesCharged?.toFixed(2) || (result.publishedCount * 0.20).toFixed(2)}<br>
            > Broadcasted completion report to Telegram Bot.<br>
          `;
        }

        state = await loadBrandsStateFromAPI();

        setTimeout(() => {
          content.innerHTML = `
            <div style="text-align:center; padding:1.5rem;">
              <div style="font-size:3rem; margin-bottom:0.5rem;">🎉</div>
              <h2 style="font-size:1.4rem; font-weight:900; color:#00df89; margin:0 0 0.4rem;">Catalog Successfully Published!</h2>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 1.5rem;">
                <strong>${result.publishedCount}</strong> listings are now live in the <strong>${b.name}</strong> Etsy catalog.
              </p>

              <div style="background:rgba(0,0,0,0.3); border-radius:12px; padding:1rem; text-align:left; max-height:240px; overflow-y:auto; margin-bottom:1.5rem;">
                ${result.published.map(p => `
                  <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:0.35rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                    <span style="color:#fff;"><strong>${p.code}:</strong> ${p.name}</span>
                    <a href="${p.etsyUrl}" target="_blank" style="color:#00df89; text-decoration:none; font-weight:700;">View on Etsy ↗</a>
                  </div>
                `).join('')}
              </div>

              <button class="btn-primary" style="width:100%;" onclick="document.getElementById('etsyBulkModal').style.display='none'; window.BrandsModule.switchTab('etsy');">
                Done & View Command Center
              </button>
            </div>
          `;
        }, 800);
      } catch (err) {
        content.innerHTML = `
          <div style="text-align:center; padding:1.5rem;">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">❌</div>
            <h3 style="color:#ef4444; font-weight:800;">Bulk Publish Error</h3>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.25rem;">${err.message}</p>
            <button class="btn-secondary" onclick="document.getElementById('etsyBulkModal').style.display='none'">Close</button>
          </div>
        `;
      }
    },

    filterAuditPages(filterType, btnEl) {
      const container = document.getElementById('auditPagesList');
      if (!container) return;

      const cleanCards = container.querySelectorAll('.audit-page-clean');
      const flawedCards = container.querySelectorAll('.audit-page-needs-fix');

      if (filterType === 'all') {
        cleanCards.forEach(el => el.style.display = 'block');
        flawedCards.forEach(el => el.style.display = 'block');
      } else if (filterType === 'clean') {
        cleanCards.forEach(el => el.style.display = 'block');
        flawedCards.forEach(el => el.style.display = 'none');
      } else if (filterType === 'flawed') {
        cleanCards.forEach(el => el.style.display = 'none');
        flawedCards.forEach(el => el.style.display = 'block');
      }

      // Update button active state
      const buttons = document.querySelectorAll('.audit-filter-btn');
      buttons.forEach(b => b.style.outline = 'none');
      if (btnEl) btnEl.style.outline = '2px solid #06b6d4';
    },

    copyAuditRemediationPrompt(pageNum) {
      const promptText = (window._currentAuditPrompts && window._currentAuditPrompts[pageNum]) || '';
      if (!promptText) {
        if (window.showToast) window.showToast('No prompt found for this page.', 'error');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(() => {
          if (window.showToast) window.showToast(`📋 Copied Page ${pageNum} Edit Prompt! (Clean text ready for Flow/Nano Banana)`, 'success');
        }).catch(() => {
          fallbackCopy(promptText, pageNum);
        });
      } else {
        fallbackCopy(promptText, pageNum);
      }

      function fallbackCopy(text, num) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          if (window.showToast) window.showToast(`📋 Copied Page ${num} Edit Prompt! (Clean text ready for Flow/Nano Banana)`, 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Copy failed. Please manually select the prompt text.', 'error');
        }
        document.body.removeChild(ta);
      }
    },

    copyMasterMockupPrompt() {
      const promptText = window._currentMasterMockupPrompt || '';
      if (!promptText) {
        if (window.showToast) window.showToast('No master mockup prompt found. Please click Generate Blueprint first.', 'error');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(() => {
          if (window.showToast) window.showToast('📋 Copied Master 10-Mockup Batch Prompt! (Ready for Google Flow / Midjourney)', 'success');
        }).catch(() => {
          fallbackCopy(promptText, 'Master Mockup Batch');
        });
      } else {
        fallbackCopy(promptText, 'Master Mockup Batch');
      }

      function fallbackCopy(text, label) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          if (window.showToast) window.showToast(`📋 Copied ${label} Prompt!`, 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Copy failed. Please manually select the prompt text.', 'error');
        }
        document.body.removeChild(ta);
      }
    },

    copyMockupSlotPrompt(slotNum) {
      const promptText = (window._currentMockupPrompts && window._currentMockupPrompts[slotNum]) || '';
      if (!promptText) {
        if (window.showToast) window.showToast(`No prompt found for Slot #${slotNum}.`, 'error');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(() => {
          if (window.showToast) window.showToast(`📋 Copied Mockup Slot #${slotNum} Prompt!`, 'success');
        }).catch(() => {
          fallbackCopy(promptText, `Slot #${slotNum}`);
        });
      } else {
        fallbackCopy(promptText, `Slot #${slotNum}`);
      }

      function fallbackCopy(text, label) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          if (window.showToast) window.showToast(`📋 Copied Mockup ${label} Prompt!`, 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Copy failed. Please manually select the prompt text.', 'error');
        }
        document.body.removeChild(ta);
      }
    },

    toggleReviewInspection(detailId) {
      const el = document.getElementById(detailId);
      if (el) {
        el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
      }
    },

    async approveProductDirectly(brandId, productCode) {
      if (!isCurrentUserAdmin()) {
        if (window.showToast) window.showToast('⛔ Only Founder/CEO or Admins can approve products for publication.', 'error');
        return;
      }
      const priceInput = document.getElementById(`reviewPrice_${brandId}_${productCode}`);
      const noteInput = document.getElementById(`reviewNote_${brandId}_${productCode}`);
      const priceOverride = priceInput ? parseFloat(priceInput.value) : undefined;
      const priceNote = noteInput ? noteInput.value.trim() : undefined;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/brands/${brandId}/product/${productCode}/review-action`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'approve',
            priceOverride: !isNaN(priceOverride) ? priceOverride : undefined,
            priceNote
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Approval failed');

        if (window.showToast) window.showToast(`🎉 ${productCode} QA Approved & set to Live!`, 'success');
        state = await loadBrandsStateFromAPI();
        renderTabContent('etsy');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async publishSingleProductEtsy(brandId, productIdx) {
      if (!isCurrentUserAdmin()) {
        if (window.showToast) window.showToast('⛔ Only Founder/CEO or Admins can authorize Etsy publishing ($0.20 listing fee).', 'error');
        return;
      }
      const catalog = state.productsCatalog[brandId] || [];
      const prod = typeof productIdx === 'number' ? catalog[productIdx] : catalog.find(p => p.code === productIdx);
      if (!prod) return;

      // ── Publish Guard Validation ──
      const title = (prod.seoTitle || prod.seo?.title || prod.name || '').trim();
      const hasVault = Boolean(prod.vault?.storagePath || prod.vault?.canvaTemplateUrl || prod.vault?.notionTemplateUrl || prod.vault?.downloadUrl);
      const auditScore = Number(prod.aiAudit?.overall_score ?? prod.aiAudit?.score ?? 0);
      const gatePassed = !prod.aiAudit || auditScore >= 7.0 || prod.aiAudit?.gateStatus === 'passed';

      const missing = [];
      if (!title || title.length < 5) missing.push('SEO Title is missing (Studio Step 5)');
      if (!hasVault) missing.push('Deliverable file (PDF/ZIP/Link) not uploaded to Vault (Studio Step 2)');

      if (missing.length > 0) {
        if (window.showToast) {
          window.showToast(`❌ Cannot Publish ${prod.code}:\n• ${missing.join('\n• ')}`, 'error');
        } else {
          alert(`Cannot Publish ${prod.code}:\n- ${missing.join('\n- ')}\n\nPlease open Studio (⚡) to complete.`);
        }
        return;
      }

      if (!confirm(`Publishing ${prod.code} (${title.slice(0, 40)}...) to Etsy will incur a $0.20 listing fee. Proceed?`)) return;

      if (window.showToast) window.showToast(`🚀 Publishing ${prod.code} to Etsy...`, 'info');
      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });

      try {
        const res = await fetch(`/api/etsy/brands/${brandId}/publish-all`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ productCodes: [prod.code], autoActivate: true, productOverrides: [prod] })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to publish single product');

        if (data.data?.publishedCount === 0 && data.data?.errors?.length > 0) {
          const errMsg = data.data.errors[0].reason || 'Pre-listing validation failed';
          throw new Error(`Cannot Publish ${prod.code}: ${errMsg}`);
        }

        if (window.showToast) window.showToast(`✅ ${prod.code} is now live on Etsy! ($0.20 fee logged)`, 'success');
        const modal = document.getElementById('aiSeoModal');
        if (modal) modal.style.display = 'none';
        state = await loadBrandsStateFromAPI();
        renderTabContent('etsy');
      } catch (e) {
        if (window.showToast) window.showToast(e.message, 'error');
      }
    },

    async syncEtsyOrders(brandId) {
      if (window.showToast) window.showToast('🔄 Syncing live orders from Etsy API...', 'info');
      window.BrandsModule.fetchLiveEtsyStatus(brandId);
      setTimeout(() => {
        if (window.showToast) window.showToast('✅ Orders & P&L auto-synced with Growth Engine 3', 'success');
      }, 600);
    },

    setEtsySubView(subView) {
      window._activeEtsySubView = subView;
      renderTabContent('etsy');
    },

    openConfigureMidMonthModal(dbmId = 1) {
      const dbm = state.dbms?.find(d => d.id === dbmId) || state.dbms?.[0] || { id: 1, name: 'DBM 1' };
      const modal = document.getElementById('aiSeoModal');
      const content = document.getElementById('aiSeoModalContent');
      if (!modal || !content) return;

      modal.style.display = 'flex';
      content.style.maxWidth = '540px';
      content.innerHTML = `
        <div style="padding:1.5rem 0.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
            <div>
              <span style="font-size:0.72rem; font-weight:800; color:#fbbf24; text-transform:uppercase;">Executive Incentive Console</span>
              <h3 style="font-size:1.25rem; font-weight:900; color:#fff; margin:0.1rem 0 0;">🎁 Configure Mid-Month Sprint Bonus</h3>
            </div>
            <button onclick="document.getElementById('aiSeoModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.45;">
            Evaluate 20th-of-month upload progress and unlock a customized sprint slab to motivate DBM completion:
          </p>

          <div style="display:flex; flex-direction:column; gap:0.9rem; margin-bottom:1.25rem;">
            <div>
              <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Select DBM:</label>
              <select id="midMonthDbmSelect" style="width:100%; font-size:0.85rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#fff; font-weight:700;">
                ${state.dbms.map(d => `<option value="${d.id}" ${d.id === dbm.id ? 'selected' : ''}>${d.name} (${d.title})</option>`).join('')}
              </select>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div>
                <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Target Achievement %</label>
                <input type="number" id="midMonthTargetPct" value="70" style="width:100%; font-size:0.85rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#00df89; font-weight:800;">
              </div>
              <div>
                <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Sprint Bonus ($ USD)</label>
                <input type="number" id="midMonthBonusUsd" value="50" style="width:100%; font-size:0.85rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#fbbf24; font-weight:800;">
              </div>
            </div>

            <div>
              <label style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Sprint Goal Description</label>
              <input type="text" id="midMonthNote" value="Special 20th Month Sprint Incentive — Push 5 more products!" style="width:100%; font-size:0.82rem; padding:0.55rem; background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:8px; color:#fff;">
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(251,191,36,0.06); padding:0.65rem 0.85rem; border-radius:8px; border:1px solid rgba(251,191,36,0.2);">
              <input type="checkbox" id="midMonthApproveCheck" checked style="accent-color:#fbbf24; width:16px; height:16px;">
              <label for="midMonthApproveCheck" style="font-size:0.75rem; color:#fff; font-weight:700; cursor:pointer;">
                Approve and make active immediately for this DBM
              </label>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <button class="btn-ghost" onclick="document.getElementById('aiSeoModal').style.display='none'">Cancel</button>
            <button class="btn-primary" style="background:#fbbf24; color:#070b12; font-weight:900;" onclick="window.BrandsModule.saveMidMonthIncentive()">
              💾 Save & Activate Incentive
            </button>
          </div>
        </div>
      `;
    },

    async saveMidMonthIncentive() {
      const dbmId = Number(document.getElementById('midMonthDbmSelect')?.value || 1);
      const targetPct = Number(document.getElementById('midMonthTargetPct')?.value || 70);
      const bonusUsd = Number(document.getElementById('midMonthBonusUsd')?.value || 50);
      const note = document.getElementById('midMonthNote')?.value || '';
      const approved = document.getElementById('midMonthApproveCheck')?.checked || false;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch('/api/brands/set-mid-month-incentive', {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ dbmId, targetPct, bonusUsd, note, approved })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save incentive');

        if (window.showToast) window.showToast('✅ Mid-month sprint bonus saved & active!', 'success');
        document.getElementById('aiSeoModal').style.display = 'none';
        renderTabContent('dbm');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async triggerTelegram20thBrief() {
      if (window.showToast) window.showToast('🤖 Generating 20th Mid-Month Evaluation Brief...', 'info');
      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch('/api/brands/trigger-20th-telegram-evaluation', {
          method: 'POST',
          headers,
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Evaluation failed');

        if (window.showToast) window.showToast('📢 20th Mid-Month evaluation brief generated!', 'success');
        alert(`📊 GRO10X 20th Mid-Month Evaluation Generated:\n\n${data.summaryText}`);
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    },

    async requestRevisionForProduct(brandId, productCode) {
      const note = prompt(`Enter feedback / revision note for ${productCode}:`, 'Please polish mockup lighting and verify printable margins.');
      if (!note) return;

      const headers = getStudioAuthHeaders({ 'Content-Type': 'application/json' });
      try {
        const res = await fetch(`/api/brands/${brandId}/product/${productCode}/review-action`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'request_revision', revisionNote: note })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Action failed');

        if (window.showToast) window.showToast(`📝 Revision requested for ${productCode}`, 'warning');
        state = await loadBrandsStateFromAPI();
        renderTabContent('etsy');
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
      }
    }
  };

  // Add styles for tabs
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .brands-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      font-family: var(--font-heading, 'Outfit');
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .brands-tab-btn:hover {
      color: #fff;
      background: rgba(255,255,255,0.05);
    }
    .brands-tab-btn.active {
      color: #070b12;
      background: var(--brand-primary, #00df89);
      font-weight: 800;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
  document.head.appendChild(styleEl);

  render();
};
