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

const STORE_LAUNCH_STEPS = [
  { id: 1, title: 'Create Etsy Seller Account', desc: 'Register with dedicated brand email & payment profile.' },
  { id: 2, title: 'Configure Shop Identity', desc: 'Upload banner, avatar, policy & bio matching brand guidelines.' },
  { id: 3, title: 'Connect Printify to Etsy', desc: 'Only for POD brands: Link store & verify shipping profiles.' },
  { id: 4, title: 'Upload Hero Product #1 + #2', desc: 'Publish first 2 flagship listings with 10 mockup slides & video.' },
  { id: 5, title: 'Run AI SEO Audit on Listings', desc: 'Ensure all 13 tags and 140-char title are populated.' },
  { id: 6, title: 'Enable Etsy Ads ($1/day test)', desc: 'Activate initial test budget on hero listings for rapid indexing.' },
  { id: 7, title: 'Paste Live Etsy URL into CRM', desc: 'Link live store directly in the Brand Command Center.' },
  { id: 8, title: 'Report Store Live in Standup', desc: 'Submit EOD report confirming launch and beginning daily uploads.' }
];

async function loadBrandsStateFromAPI() {
  try {
    if (window.APP_API) {
      const res = await window.APP_API.get('/brands');
      if (res && res.brands) {
        localStorage.setItem('gro10x_brands_data', JSON.stringify(res));
        return res;
      }
    }
  } catch (e) {
    console.warn('[Brands] API load fallback to local:', e.message);
  }

  try {
    const saved = localStorage.getItem('gro10x_brands_data');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_BRANDS_DATA;
}

function saveBrandsStateLocally(state) {
  try {
    localStorage.setItem('gro10x_brands_data', JSON.stringify(state));
  } catch (e) {}
}

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
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1: PORTFOLIO OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  function renderPortfolioTab(container) {
    const totalTarget = state.brands.reduce((acc, b) => acc + b.target12mo, 0);

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
        
        <!-- REVENUE SHARE BY BRAND -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <div>
              <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">📈 Year 1 Revenue Target Distribution</h3>
              <span style="font-size:0.75rem; color:var(--text-muted);">13 Brands compound into $328,116 Gross Revenue</span>
            </div>
            <span style="font-size:0.75rem; font-weight:800; color:#00df89; background:rgba(0,223,137,0.1); padding:0.25rem 0.6rem; border-radius:8px;">
              86.0% Net Margin
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
                  PlannerQueenCo, PromptVault, PageForge KDP (Highest ROI & Speed)
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
        <span style="color:var(--text-secondary); font-size:0.85rem;">Showing all 13 Brands across 4 DBM Divisions:</span>
        <button class="btn-secondary btn-sm" onclick="window.BrandsModule.openAddBrandModal()">+ Add Custom Brand</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.25rem;">
        ${state.brands.map(b => {
          const dbm = state.dbms.find(d => d.id === b.dbmId) || { name: `DBM ${b.dbmId}` };
          const statusBg = b.etsyStatus === 'Live' ? 'rgba(0,223,137,0.15)' : b.etsyStatus === 'In Setup' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)';
          const statusColor = b.etsyStatus === 'Live' ? '#00df89' : b.etsyStatus === 'In Setup' ? '#fbbf24' : 'var(--text-muted)';
          const typeColor = b.type === 'Digital' ? '#00df89' : b.type === 'KDP' ? '#a855f7' : '#06b6d4';

          const checklistCount = Object.values(b.checklist || {}).filter(Boolean).length;

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
                  ${b.palette.slice(0, 5).map(c => `
                    <span style="width:14px; height:14px; border-radius:50%; background:${c}; border:1px solid rgba(255,255,255,0.2);" title="${c}"></span>
                  `).join('')}
                  <span style="font-size:0.68rem; color:var(--text-muted); margin-left:auto;">${b.fonts}</span>
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
                    <span>Net: <strong style="color:#06b6d4;">$${b.netTarget.toLocaleString()}</strong></span>
                    <span>Launch: <strong style="color:#fbbf24;">${checklistCount}/8 Tasks</strong></span>
                  </div>
                </div>

                <!-- ETSY STORE STATUS & URL -->
                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.75rem; margin-bottom:0.5rem;">
                  <span style="color:${statusColor}; font-weight:700;">● ${b.etsyStatus}</span>
                  ${b.etsyUrl ? `
                    <a href="${b.etsyUrl}" target="_blank" style="color:#06b6d4; text-decoration:none; font-weight:700;">🔗 View Etsy Store →</a>
                  ` : `
                    <button class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.15rem 0.4rem;" onclick="window.BrandsModule.editEtsyUrl(${b.id})">
                      + Add Store URL
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
    if (!state.productsCatalog[brand.id] || state.productsCatalog[brand.id].length === 0) {
      state.productsCatalog[brand.id] = generateDefaultProductsForBrand(brand);
      saveBrandsStateLocally(state);
    }
    const products = state.productsCatalog[brand.id];
    const liveCount = products.filter(p => p.status === 'Live').length;

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
              <th style="padding:0.75rem; text-align:right;">AI SEO Actions</th>
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
                  </select>
                </td>
                <td style="padding:0.75rem; text-align:right;">
                  <button class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;" onclick="window.BrandsModule.generateLiveSEOPackage('${encodeURIComponent(p.name)}', '${brand.name}', ${brand.id})">
                    🤖 Generate SEO
                  </button>
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
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">💰 Brand P&L Settlement Ledger</h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">Real-time tracking of Gross Revenue, Etsy & Printify COGS, Ads Spend & Net Cash Profit (Auto-syncs Engine 3)</span>
        </div>
        <button class="btn-primary" onclick="window.BrandsModule.openLogRevenueModal()">
          ⚡ + Log Monthly Revenue
        </button>
      </div>

      <div class="card-glass" style="padding:1.25rem; border-radius:16px; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">
              <th style="padding:0.75rem;">Brand</th>
              <th style="padding:0.75rem;">12-Mo Target</th>
              <th style="padding:0.75rem;">Actual Gross</th>
              <th style="padding:0.75rem;">Platform / POD COGS</th>
              <th style="padding:0.75rem;">Ads Spend</th>
              <th style="padding:0.75rem;">Net Cash Profit</th>
              <th style="padding:0.75rem;">P&L Status</th>
              <th style="padding:0.75rem; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.brands.map(b => {
              const cogs = b.type === 'POD' ? Math.round(b.actualGross * 0.58) : Math.round(b.actualGross * 0.095);
              const net = Math.max(0, b.actualGross - cogs - (b.actualAds || 0));
              const health = b.actualGross > 0 ? (b.actualGross >= (b.target12mo / 12) ? '🟢 On Target' : '🟡 Scaling') : '⚪ Pending Launch';

              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:0.75rem;">
                    <strong style="color:#fff;">${b.name}</strong>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${b.type}</div>
                  </td>
                  <td style="padding:0.75rem; font-weight:700;">$${b.target12mo.toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#00df89; font-weight:800;">$${(b.actualGross || 0).toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#ef4444;">-$${cogs.toLocaleString()}</td>
                  <td style="padding:0.75rem; color:#fbbf24;">-$${(b.actualAds || 0).toLocaleString()}</td>
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
  // TAB 5: DBM TEAM HUB
  // ─────────────────────────────────────────────────────────────────────────
  function renderDBMTab(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">👤 Digital Brand Managers (DBM) Operating Hub</h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">4 Brand Managers × ~3 Brands Each = 1,300 Products Live in ~8 Weeks</span>
        </div>
        <button class="btn-primary btn-sm" onclick="window.BrandsModule.openDBMStandupModal()">
          📋 Submit Daily Standup
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        ${state.dbms.map(d => {
          const assignedBrands = state.brands.filter(b => d.assignedBrands.includes(b.id));
          const totalLive = assignedBrands.reduce((acc, b) => acc + (b.productsLive || 0), 0);
          const totalTarget = assignedBrands.reduce((acc, b) => acc + (b.productsTarget || 100), 0);
          const totalGross = assignedBrands.reduce((acc, b) => acc + (b.actualGross || 0), 0);
          const incentiveBonus = Math.round(totalGross * 0.05);

          return `
            <div class="card-glass" style="padding:1.25rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; display:flex; align-items:center; justify-content:center; font-weight:900;">
                    ${d.name.replace('DBM ', 'D')}
                  </div>
                  <div>
                    <h4 style="font-size:1rem; font-weight:800; color:#fff; margin:0;">${d.name}</h4>
                    <span style="font-size:0.72rem; color:var(--text-muted);">${d.title}</span>
                  </div>
                </div>
                <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89;">
                  🟢 ${d.status}
                </span>
              </div>

              <!-- ASSIGNED BRANDS LIST -->
              <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; margin-bottom:0.85rem;">
                <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Assigned Brands:</span>
                <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.4rem;">
                  ${assignedBrands.map(b => `
                    <div style="display:flex; justify-content:space-between; font-size:0.78rem;">
                      <span style="color:#fff;">${b.name}</span>
                      <span style="color:#06b6d4; font-weight:700;">${b.productsLive || 0}/${b.productsTarget || 100} Live</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- DBM STATS -->
              <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; font-size:0.75rem; margin-bottom:0.75rem;">
                <div style="background:rgba(255,255,255,0.03); padding:0.5rem; border-radius:8px;">
                  <span style="color:var(--text-muted);">Total Output:</span>
                  <div style="font-size:1rem; font-weight:800; color:#fff;">${totalLive} / ${totalTarget}</div>
                </div>
                <div style="background:rgba(255,255,255,0.03); padding:0.5rem; border-radius:8px;">
                  <span style="color:var(--text-muted);">5% Profit Bonus:</span>
                  <div style="font-size:1rem; font-weight:800; color:#00df89;">+$${incentiveBonus}</div>
                </div>
              </div>

              <button class="btn-secondary btn-sm" style="width:100%; font-size:0.75rem;" onclick="window.location.hash='#dbm'">
                Open DBM Operating Workspace →
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER: GENERATE DEFAULT 100 PRODUCTS FOR A BRAND
  // ─────────────────────────────────────────────────────────────────────────
  function generateDefaultProductsForBrand(brand) {
    const list = [];
    const cats = brand.categories || ['Core Planners', 'Trackers', 'Bundles', 'E-books'];

    cats.forEach((cat, cIdx) => {
      for (let i = 1; i <= 10; i++) {
        const prodNum = cIdx * 10 + i;
        const isHero = i <= 2;
        list.push({
          code: `${brand.name.substring(0, 3).toUpperCase()}-${prodNum.toString().padStart(2, '0')}`,
          name: `${cat} #${i} — ${brand.name} Style`,
          category: cat,
          format: brand.type.includes('POD') ? (i % 2 === 0 ? 'POD T-Shirt' : 'Digital ZIP') : 'Digital PDF',
          price: brand.type.includes('POD') ? (i % 2 === 0 ? 28 : 12) : (i === 10 ? 24 : 12),
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

          <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1); display:flex; gap:0.5rem;">
            <button class="btn-primary" style="flex:1;" onclick="document.getElementById('brandDetailDrawer').style.display='none'; window.BrandsModule.viewBrandProducts(${b.id});">
              Open Product Upload Matrix →
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

    async generateLiveSEOPackage(productNameEncoded, brandName, brandId) {
      const prodName = decodeURIComponent(productNameEncoded);
      const b = state.brands.find(x => x.id === brandId) || { name: brandName, niche: 'Digital products', voice: 'Inspiring', type: 'Digital' };

      const modal = document.getElementById('aiSeoModal');
      const modalContent = document.getElementById('aiSeoModalContent');
      if (!modal || !modalContent) return;

      modalContent.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:2.5rem; margin-bottom:1rem; animation:spin 2s linear infinite;">🤖</div>
          <h3 style="color:#fff; font-size:1.2rem; font-weight:800; margin-bottom:0.5rem;">Generating Optimized Etsy SEO Package...</h3>
          <p style="color:var(--text-muted); font-size:0.85rem;">Using Google Gemini AI for Title (140 chars), 13 High-Rank Tags & Description for <strong>${prodName}</strong>.</p>
        </div>
      `;
      modal.style.display = 'flex';

      try {
        let seoResult = null;
        if (window.APP_API) {
          seoResult = await window.APP_API.post('/ai/etsy-seo', {
            productName: prodName,
            brandName: b.name,
            brandNiche: b.niche,
            brandVoice: b.voice,
            type: b.type
          });
        }

        if (!seoResult || !seoResult.title) {
          throw new Error('Could not fetch SEO response');
        }

        const tagsJoined = (seoResult.tags || []).join(', ');

        modalContent.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
            <div>
              <span style="font-size:0.72rem; font-weight:800; color:#00df89; text-transform:uppercase;">Etsy SEO & Listing Package</span>
              <h2 style="font-size:1.3rem; font-weight:900; color:#fff; margin:0.2rem 0 0;">${prodName}</h2>
            </div>
            <button onclick="document.getElementById('aiSeoModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:1.2rem;">
            <!-- 140-CHAR TITLE -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Etsy Listing Title (${(seoResult.title || '').length}/140 chars)</label>
                <button class="btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${escape(seoResult.title)}'); window.showToast('Copied Title!','success');">📋 Copy Title</button>
              </div>
              <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,223,137,0.3); padding:0.75rem; border-radius:10px; color:#00df89; font-weight:700; font-size:0.9rem;">
                ${seoResult.title}
              </div>
            </div>

            <!-- 13 TAGS -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">13 High-Intent Etsy Tags (Max 20 chars each)</label>
                <button class="btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${tagsJoined}'); window.showToast('Copied All 13 Tags!','success');">📋 Copy All 13 Tags</button>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:0.4rem; background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px;">
                ${(seoResult.tags || []).map((tag, tIdx) => `
                  <span onclick="navigator.clipboard.writeText('${tag}'); window.showToast('Copied tag: ${tag}','success');" style="background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); padding:0.25rem 0.6rem; border-radius:999px; font-size:0.75rem; font-weight:700; cursor:pointer;" title="Click to copy tag #${tIdx + 1}">
                    #${tIdx + 1} ${tag}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- DESCRIPTION -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Conversion-Optimized Description</label>
                <button class="btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('aiDescBox').innerText); window.showToast('Copied Description!','success');">📋 Copy Description</button>
              </div>
              <div id="aiDescBox" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:0.85rem; border-radius:10px; color:var(--text-secondary); font-size:0.82rem; white-space:pre-wrap; max-height:220px; overflow-y:auto; line-height:1.5;">${seoResult.description}</div>
            </div>

            <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
              <button class="btn-primary" style="flex:1;" onclick="document.getElementById('aiSeoModal').style.display='none'">
                Done & Apply to Listing
              </button>
            </div>
          </div>
        `;
      } catch (err) {
        modalContent.innerHTML = `
          <div style="text-align:center; padding:1.5rem;">
            <p style="color:#ef4444; font-weight:700;">Could not generate AI SEO: ${err.message}</p>
            <button class="btn-secondary" onclick="document.getElementById('aiSeoModal').style.display='none'">Close</button>
          </div>
        `;
      }
    },

    async openDBMStandupModal() {
      const dbmIdStr = prompt('Select DBM (1, 2, 3, or 4):', '1');
      if (!dbmIdStr) return;
      const dbmId = Number(dbmIdStr);

      const brandName = prompt('Brand Name worked on today:', 'PlannerQueenCo');
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
  `;
  document.head.appendChild(styleEl);

  render();
};
