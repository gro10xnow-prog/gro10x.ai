/**
 * src/services/taxonomy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gro10x Master Product Taxonomy Service
 * Central single source of truth for the 7-tier product hierarchy:
 * Company -> Engine (1-5) -> Vertical -> Brand -> Category -> Product -> SKU
 * 
 * Provides live Supabase data access with an instant offline fallback cache.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');
const { DEFAULT_SERVICES } = require('../constants/services');

// Helper to determine category id for services
function getServiceCategoryId(svc) {
  const num = parseInt((svc.id || '').replace('SVC-', ''), 10);
  if (num >= 1 && num <= 7) return 'cat-e2-mobile-web';
  if (num === 25) return 'cat-e2-mobile-web';
  if (num >= 8 && num <= 13) return 'cat-e2-automation';
  if (num >= 14 && num <= 18) return 'cat-e2-agents';
  if (num >= 19 && num <= 22) return 'cat-e2-data-vision';
  if (num >= 23 && num <= 26) return 'cat-e2-advisory';
  return 'cat-e2-mobile-web';
}

// Build 26 services + Sprint 01 in memory
const COMPILED_ENGINE2_PRODUCTS = [
  {
    id: 'prod-sprint-01',
    brand_id: 'b-gro10x-growth',
    category_id: 'cat-e2-sprints',
    product_code: 'SPRINT-01',
    name: 'Sprint 01: Idea to Reality (14-Day MVP)',
    delivery_type: 'SERVICE',
    pricing_model: 'ONE_TIME',
    metadata: {
      slug: 'sprint-01-idea-to-reality',
      icon: '⚡',
      badge: 'FLAGSHIP SPRINT',
      description: 'Turn your idea into a production-ready, revenue-generating software MVP in exactly 14 days.',
      target_icp: ['Funded Startup Founders', 'Corporate Innovation Teams', 'Solopreneurs'],
      price_usd: 3500,
      price_bdt: 410000,
      proof_pack: {
        case_study_title: 'How a Solo Founder Launched a Production MVP in 14 Days and Secured First 100 Paying Users',
        video_url: 'https://youtu.be/RvNFX5nYDlM',
        video_poster: '/images/video-poster.webp',
        slides_pdf_url: '/assets/case-studies/sprint-01-playbook.pdf',
        audio_overview_url: 'https://open.spotify.com/episode/4yHOpQ5t9LRImJJaUxGCiu',
        blueprint_url: '/assets/blueprints/sprint-01-architecture.pdf',
        deep_research_query: 'Rapid MVP agile development sprint frameworks for 14-day turnaround'
      },
      engineering: {
        tech_stack: ['Next.js', 'Node.js', 'Supabase PostgreSQL', 'Tailwind CSS', 'Vercel Edge'],
        core_deliverables: [
          'Complete UX/UI Wireframe in Figma',
          'Production Full-Stack Application Codebase',
          'Supabase Relational Database with Row-Level Security',
          'Automated CI/CD Deployment on Vercel',
          'Payment Gateway Integration (Stripe or SSLCommerz)'
        ],
        included_features: [
          'Full Source Code Handover (GitHub Repository)',
          '30 Days Bug-Fix Warranty & Maintenance',
          'Live 1-on-1 Founder Handover Call'
        ],
        turnaround_days: 14,
        warranty_days: 30
      },
      faq: [
        { q: 'What happens if we need more features?', a: 'Sprint 01 focuses strictly on core MVP needle-movers. Additional features transition seamlessly into our Engine 4 DevCare Retainer.' },
        { q: 'Do we own 100% of the code?', a: 'Yes. Full intellectual property and GitHub repository are transferred to your organization upon completion.' }
      ]
    }
  },
  ...DEFAULT_SERVICES.map((svc, index) => {
    const priceNum = parseFloat((svc.priceUSD || '$2,500').replace(/[^0-9.]/g, '')) || 2500;
    const priceBdtNum = parseFloat((svc.priceBDT || '৳295,000').replace(/[^0-9.]/g, '')) || 295000;
    const prodId = `prod-${svc.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return {
      id: prodId,
      brand_id: 'b-gro10x-growth',
      category_id: getServiceCategoryId(svc),
      product_code: svc.id,
      name: svc.title,
      delivery_type: 'SERVICE',
      pricing_model: 'ONE_TIME',
      metadata: {
        slug: svc.slug,
        icon: svc.icon || '⚡',
        badge: svc.badge || 'PRO',
        description: svc.description,
        details: svc.details || '',
        price_usd: priceNum,
        price_bdt: priceBdtNum,
        price_cycle: svc.priceCycle || '/ project',
        delivery_time: svc.deliveryTime || '2-3 Weeks',
        proof_pack: {
          case_study_title: svc.caseStudyTitle || `${svc.title} Transformation Case Study`,
          video_url: svc.videoUrl || 'https://youtu.be/RvNFX5nYDlM',
          video_poster: svc.videoPoster || '/images/video-poster.webp',
          slides_pdf_url: svc.slidesPdfUrl || `/assets/case-studies/${svc.slug}.pdf`,
          audio_overview_url: svc.audioOverviewUrl || 'https://open.spotify.com/show/gro10x-ai-case-studies',
          blueprint_url: svc.blueprintUrl || `/assets/blueprints/${svc.slug}-blueprint.pdf`,
          deep_research_query: `Deep research production implementation of ${svc.title} using ${svc.categoryName}`
        },
        engineering: {
          tech_stack: ['Node.js', 'Express', 'Supabase PostgreSQL', 'Gemini AI', 'Vercel Edge'],
          core_deliverables: svc.features || [],
          included_features: svc.includedFeatures || [],
          turnaround_days: 14,
          warranty_days: 30
        },
        faq: svc.faq || []
      }
    };
  })
];

// Build SKUs in memory for Sprint 01 + 26 services
const COMPILED_ENGINE2_SKUS = [
  {
    id: 'sku-sprint01-upw',
    product_id: 'prod-sprint-01',
    sku_code: 'GRO-E2-SME-GWT-SPRINT01-UPW',
    name: 'Sprint 01 Idea-to-Reality on Upwork',
    channel: 'UPWORK',
    price_usd: 3500,
    price_bdt: 410000,
    billing_interval: 'one-time',
    channel_payload: {
      outcome_title: 'You will get a production-ready software MVP launched in 14 days',
      project_steps: [
        { step: 1, name: 'Architecture Blueprint & Figma Prototype', days: 3 },
        { step: 2, name: 'Full-Stack Core Development & Database RLS', days: 7 },
        { step: 3, name: 'Cloud Deployment, Testing & Handover', days: 4 }
      ]
    }
  },
  {
    id: 'sku-sprint01-fiv',
    product_id: 'prod-sprint-01',
    sku_code: 'GRO-E2-SME-GWT-SPRINT01-FIV',
    name: 'Sprint 01 Idea-to-Reality on Fiverr Pro',
    channel: 'FIVERR',
    price_usd: 3000,
    price_bdt: 350000,
    billing_interval: 'one-time',
    channel_payload: {
      gig_title: 'I will build your custom software MVP or PWA in 14 days',
      tags: ['mvp development', 'software build', 'fast web app', 'startup mvp', 'supabase'],
      tiers: {
        basic: { name: 'MVP Prototype', price: 1500, deliveryDays: 5, revisions: 2 },
        standard: { name: 'Production MVP', price: 3000, deliveryDays: 14, revisions: 4 },
        premium: { name: 'Full Launch Suite', price: 4500, deliveryDays: 21, revisions: 'Unlimited' }
      },
      buyer_requirements: [
        'Do you have a product requirements document or reference sketch?',
        'What are your primary business goals for this MVP?',
        'Do you have your cloud hosting or API accounts ready?'
      ]
    }
  },
  {
    id: 'sku-sprint01-dir',
    product_id: 'prod-sprint-01',
    sku_code: 'GRO-E2-SME-GWT-SPRINT01-DIR',
    name: 'Sprint 01 Idea-to-Reality Direct Wire',
    channel: 'DIRECT_WIRE',
    price_usd: 3000,
    price_bdt: 350000,
    billing_interval: 'one-time',
    channel_payload: {
      sow_type: 'FIXED_SPRINT',
      milestones: [
        { name: 'Kickoff & Architecture Approval', percent: 50 },
        { name: 'Staging Delivery & Source Code Handover', percent: 50 }
      ],
      warranty_days: 30
    }
  }
];

// Add SKUs for the 26 services
DEFAULT_SERVICES.forEach(svc => {
  const prodId = `prod-${svc.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const codeClean = svc.id.replace(/[^A-Z0-9]/gi, '');
  const priceNum = parseFloat((svc.priceUSD || '$2,500').replace(/[^0-9.]/g, '')) || 2500;
  const priceBdtNum = parseFloat((svc.priceBDT || '৳295,000').replace(/[^0-9.]/g, '')) || 295000;

  // Upwork SKU
  COMPILED_ENGINE2_SKUS.push({
    id: `sku-${svc.id.toLowerCase()}-upw`,
    product_id: prodId,
    sku_code: `GRO-E2-SME-GWT-${codeClean}-UPW`,
    name: `${svc.title} on Upwork Project Catalog`,
    channel: 'UPWORK',
    price_usd: priceNum,
    price_bdt: priceBdtNum,
    billing_interval: 'one-time',
    channel_payload: {
      outcome_title: `You will get ${svc.title.toLowerCase()} engineered with AI and cloud architecture`,
      delivery_time: svc.deliveryTime || '2-3 Weeks',
      key_deliverables: svc.features || []
    }
  });

  // Fiverr SKU
  COMPILED_ENGINE2_SKUS.push({
    id: `sku-${svc.id.toLowerCase()}-fiv`,
    product_id: prodId,
    sku_code: `GRO-E2-SME-GWT-${codeClean}-FIV`,
    name: `${svc.title} on Fiverr Pro`,
    channel: 'FIVERR',
    price_usd: priceNum,
    price_bdt: priceBdtNum,
    billing_interval: 'one-time',
    channel_payload: {
      gig_title: `I will build your ${svc.title.toLowerCase().substring(0, 45)}`,
      tags: [svc.category || 'ai development', 'automation', 'software', 'mvp', 'fast build'].slice(0, 5),
      tiers: {
        basic: { name: 'Starter Package', price: Math.round(priceNum * 0.5), deliveryDays: 5, revisions: 2 },
        standard: { name: 'Complete Package', price: priceNum, deliveryDays: 14, revisions: 4 },
        premium: { name: 'Enterprise Package', price: Math.round(priceNum * 1.6), deliveryDays: 21, revisions: 'Unlimited' }
      },
      buyer_requirements: [
        'What are the core functional requirements of this project?',
        'Do you have existing UI wireframes or reference apps?',
        'What is your target launch deadline?'
      ]
    }
  });

  // Direct Wire SKU
  COMPILED_ENGINE2_SKUS.push({
    id: `sku-${svc.id.toLowerCase()}-dir`,
    product_id: prodId,
    sku_code: `GRO-E2-SME-GWT-${codeClean}-DIR`,
    name: `${svc.title} Direct Proposal`,
    channel: 'DIRECT_WIRE',
    price_usd: priceNum,
    price_bdt: priceBdtNum,
    billing_interval: 'one-time',
    channel_payload: {
      contract_type: 'FIXED_MILESTONE',
      payment_terms: '50% upfront, 50% upon final acceptance',
      support_days: 30
    }
  });
});

// Canonical In-Memory Catalog Seed (Offline & Test Resilience)
const FALLBACK_CATALOG = {
  engines: [
    { id: 'engine1', engine_num: 1, code: 'E1', name: 'AI Agent Ecosystem and Platform', tagline: 'Proprietary multi-tenant AI agents and SaaS tools', target_arr: 35000, target_share: '35%', icon: '🤖' },
    { id: 'engine2', engine_num: 2, code: 'E2', name: 'AI Service Agency', tagline: 'High-intent client builds, bespoke MVPs, and sprint delivery', target_arr: 25000, target_share: '25%', icon: '⚡' },
    { id: 'engine3', engine_num: 3, code: 'E3', name: 'Omnichannel Commerce & Asset Brands', tagline: 'Interactive micro-software, POD merchandise, and DCE physical goods', target_arr: 20000, target_share: '20%', icon: '📦' },
    { id: 'engine4', engine_num: 4, code: 'E4', name: 'Managed Retainer Services', tagline: 'Recurring operational retainers, vertical OS hosting, and SLAs', target_arr: 15000, target_share: '15%', icon: '🤝' },
    { id: 'engine5', engine_num: 5, code: 'E5', name: 'Programmatic AI Video & Media Scale', tagline: 'Owned channels, executive personal branding, and high-CPM media', target_arr: 5000, target_share: '5%', icon: '🎬' }
  ],
  verticals: [
    { id: 'e1-career', engine_id: 'engine1', code: 'CAR', name: 'Career & Capability', icon: '🎯' },
    { id: 'e1-finance', engine_id: 'engine1', code: 'FIN', name: 'Finance', icon: '💳' },
    { id: 'e1-sme', engine_id: 'engine1', code: 'SME', name: 'Service Provider & SME', icon: '🏢' },
    { id: 'e1-education', engine_id: 'engine1', code: 'EDU', name: 'Education', icon: '🎓' },

    { id: 'e2-enterprise', engine_id: 'engine2', code: 'ENT', name: 'Enterprise', icon: '🏛️' },
    { id: 'e2-sme', engine_id: 'engine2', code: 'SME', name: 'SME', icon: '📈' },
    { id: 'e2-personal', engine_id: 'engine2', code: 'PER', name: 'Personal & Creators', icon: '👤' },
    { id: 'e2-govtech', engine_id: 'engine2', code: 'GOV', name: 'Government & NGOs', icon: '🇧🇩' },

    { id: 'e3-digital', engine_id: 'engine3', code: 'DIG', name: 'Digital', icon: '💻' },
    { id: 'e3-food', engine_id: 'engine3', code: 'FNB', name: 'Food and Beverage', icon: '☕' },
    { id: 'e3-fashion', engine_id: 'engine3', code: 'FAS', name: 'Fashion and Lifestyle', icon: '✨' },
    { id: 'e3-electronics', engine_id: 'engine3', code: 'ELC', name: 'Electronics and IT', icon: '🔌' },
    { id: 'e3-b2b', engine_id: 'engine3', code: 'B2B', name: 'B2B', icon: '💼' },

    { id: 'e4-content', engine_id: 'engine4', code: 'CNT', name: 'AI Brand Content Retainers', icon: '📱' },
    { id: 'e4-os-workflows', engine_id: 'engine4', code: 'SYS', name: 'AI Operating Systems & Workflows', icon: '🖥️' },
    { id: 'e4-devcare', engine_id: 'engine4', code: 'DEV', name: 'AI-Enhanced Digital Products', icon: '🛠️' },
    { id: 'e4-growth', engine_id: 'engine4', code: 'GRO', name: 'AI Growth & Managed Leads', icon: '🚀' },
    { id: 'e4-custom', engine_id: 'engine4', code: 'CUS', name: 'Custom AI Project Retainers', icon: '⚙️' },

    { id: 'e5-owned', engine_id: 'engine5', code: 'OWN', name: 'Owned Brands', icon: '💎' },
    { id: 'e5-managed-brands', engine_id: 'engine5', code: 'MGB', name: 'Managed Brands', icon: '🏷️' },
    { id: 'e5-managed-ind', engine_id: 'engine5', code: 'IND', name: 'Managed Individuals', icon: '👑' },
    { id: 'e5-media-local', engine_id: 'engine5', code: 'MHL', name: 'Media House Local', icon: '📍' },
    { id: 'e5-media-global', engine_id: 'engine5', code: 'MHG', name: 'Media House Global', icon: '🌍' }
  ],
  brands: [
    { id: 'b-group-academy', vertical_id: 'e1-career', code: 'GRP', name: 'GroUp Academy', type: 'PLATFORM' },
    { id: 'b-grocash', vertical_id: 'e1-finance', code: 'CSH', name: 'GroCash FinLedger', type: 'PLATFORM' },
    { id: 'b-sme-os', vertical_id: 'e1-sme', code: 'SMO', name: 'SME Platform Hub', type: 'PLATFORM' },
    { id: 'b-edagent', vertical_id: 'e1-education', code: 'EDA', name: 'EdAgent Labs', type: 'PLATFORM' },

    { id: 'b-gro10x-enterprise', vertical_id: 'e2-enterprise', code: 'ENT', name: 'GRO10X Enterprise Solutions', type: 'PRACTICE' },
    { id: 'b-gro10x-growth', vertical_id: 'e2-sme', code: 'GWT', name: 'GRO10X Growth Studio', type: 'PRACTICE' },

    { id: 'b-plannerqueengro', vertical_id: 'e3-digital', code: 'PLN', name: 'PlannerQueenGro', type: 'BRAND' },
    { id: 'b-promptvault', vertical_id: 'e3-digital', code: 'PRM', name: 'PromptVault', type: 'BRAND' },
    { id: 'b-sparksvg', vertical_id: 'e3-digital', code: 'SPK', name: 'SparkSVG', type: 'BRAND' },
    { id: 'b-letterlab', vertical_id: 'e3-digital', code: 'LLF', name: 'LetterLab Fonts', type: 'BRAND' },
    { id: 'b-littlestars', vertical_id: 'e3-digital', code: 'LSL', name: 'LittleStarsLearning', type: 'BRAND' },
    { id: 'b-pageforge', vertical_id: 'e3-digital', code: 'PGF', name: 'PageForge Publishing', type: 'BRAND' },
    { id: 'b-inkwrapped', vertical_id: 'e3-digital', code: 'INK', name: 'InkWrapped', type: 'BRAND' },
    { id: 'b-digivault-bd', vertical_id: 'e3-digital', code: 'DGV', name: 'DigiVault BD', type: 'BRAND' },

    { id: 'b-cozythreads', vertical_id: 'e3-fashion', code: 'COZ', name: 'CozyThreads™', type: 'BRAND' },
    { id: 'b-wildmutt', vertical_id: 'e3-fashion', code: 'WLD', name: 'WildMutt Co.', type: 'BRAND' },
    { id: 'b-zenwallco', vertical_id: 'e3-fashion', code: 'ZEN', name: 'ZenWallCo', type: 'BRAND' },
    { id: 'b-fiestafoundry', vertical_id: 'e3-fashion', code: 'FST', name: 'FiestaFoundry', type: 'BRAND' },

    { id: 'b-tinydesks', vertical_id: 'e3-b2b', code: 'TNY', name: 'TinyDesks Studio', type: 'BRAND' },
    { id: 'b-proudpro', vertical_id: 'e3-b2b', code: 'PRD', name: 'ProudProfessional', type: 'BRAND' },
    { id: 'b-dce-supplies', vertical_id: 'e3-b2b', code: 'DCE', name: 'DCE Luxury Supplies', type: 'BRAND' },

    { id: 'b-shamsdental', vertical_id: 'e4-os-workflows', code: 'SHM', name: 'Shams Dental Care OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-bellavista', vertical_id: 'e4-os-workflows', code: 'BLV', name: 'BellaVista Hospitality OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-laundrymama', vertical_id: 'e4-os-workflows', code: 'LMA', name: 'LaundryMama Logistics OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-purpleos', vertical_id: 'e4-os-workflows', code: 'PRP', name: 'PurpleOS Agency OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-hrx', vertical_id: 'e4-os-workflows', code: 'HRX', name: 'HRX Staffing OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-shopway', vertical_id: 'e4-os-workflows', code: 'SHP', name: 'ShopWay Commerce OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-dwc', vertical_id: 'e4-os-workflows', code: 'DWC', name: 'Dhaka Wholesale Club OS', type: 'OPERATING_SYSTEM' },
    { id: 'b-tarangini', vertical_id: 'e4-os-workflows', code: 'TRN', name: 'Tarangini Distribution OS', type: 'OPERATING_SYSTEM' },

    { id: 'b-grow-bangla', vertical_id: 'e5-media-local', code: 'GBN', name: 'Grow Bangla', type: 'MEDIA_NETWORK' },
    { id: 'b-jonosharthe', vertical_id: 'e5-media-local', code: 'JNS', name: 'Jonosharthe Bangladesh', type: 'MEDIA_NETWORK' },
    { id: 'b-bong-hits', vertical_id: 'e5-media-local', code: 'BNG', name: 'Bong Hits', type: 'MEDIA_NETWORK' },
    { id: 'b-pilutics', vertical_id: 'e5-media-global', code: 'PLT', name: 'PILUTICS', type: 'MEDIA_NETWORK' }
  ],
  products: [
    { id: 'prod-pla14', brand_id: 'b-plannerqueengro', product_code: 'PLA-14', name: 'Daily & Weekly Planners #1 (Interactive Edition)', delivery_type: 'SOFTWARE', pricing_model: 'ONE_TIME' },
    { id: 'prod-shams-os', brand_id: 'b-shamsdental', product_code: 'SHM-CORE', name: 'Shams Dental Practice Operating System', delivery_type: 'RETAINER_SLA', pricing_model: 'MONTHLY_RETAINER' },
    ...COMPILED_ENGINE2_PRODUCTS
  ],
  skus: [
    { id: 'sku-pla14-etsy', product_id: 'prod-pla14', sku_code: 'GRO-E3-DIG-PLN-PLA14-ETSY', name: 'PlannerQueen Daily Planner #1 on Etsy', channel: 'ETSY', price_usd: 14.99, price_bdt: 1750 },
    { id: 'sku-pla14-portal', product_id: 'prod-pla14', sku_code: 'GRO-E3-DIG-PLN-PLA14-PORTAL', name: 'PlannerQueen Daily Planner #1 Direct Portal', channel: 'OWN_PORTAL', price_usd: 12.99, price_bdt: 1500 },
    { id: 'sku-shams-mth', product_id: 'prod-shams-os', sku_code: 'GRO-E4-SYS-SHM-CORE-MTH', name: 'Shams Dental OS Monthly SLA Retainer', channel: 'RETAINER_SLA', price_usd: 300, price_bdt: 35000 },
    ...COMPILED_ENGINE2_SKUS
  ]
};

/**
 * 1. Get all 5 Engines
 */
async function getEngines() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('catalog_engines').select('*').order('engine_num');
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
  }
  return FALLBACK_CATALOG.engines;
}

/**
 * 2. Get Verticals by Engine ID
 */
async function getVerticals(engineId) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('catalog_verticals').select('*').order('sort_order');
      if (engineId) query = query.eq('engine_id', engineId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
  }
  return engineId
    ? FALLBACK_CATALOG.verticals.filter(v => v.engine_id === engineId)
    : FALLBACK_CATALOG.verticals;
}

/**
 * 3. Get Brands by Vertical ID
 */
async function getBrandsByVertical(verticalId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('catalog_brands').select('*').eq('vertical_id', verticalId).order('sort_order');
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
  }
  return FALLBACK_CATALOG.brands.filter(b => b.vertical_id === verticalId);
}

/**
 * 4. Get Products by Category or Brand
 */
async function getProducts({ categoryId, brandId } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('catalog_products').select('*').order('sort_order');
      if (categoryId) query = query.eq('category_id', categoryId);
      if (brandId) query = query.eq('brand_id', brandId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
  }
  let filtered = FALLBACK_CATALOG.products;
  if (categoryId) filtered = filtered.filter(p => p.category_id === categoryId);
  if (brandId) filtered = filtered.filter(p => p.brand_id === brandId);
  return filtered;
}

/**
 * 5. Get Single Service/Product by Product Code (e.g. 'SVC-001' or 'SPRINT-01')
 */
async function getServiceByCode(productCode) {
  if (!productCode) return null;
  const clean = productCode.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('catalog_products')
        .select(`
          *,
          brand:catalog_brands (*),
          skus:catalog_skus (*)
        `)
        .eq('product_code', clean)
        .maybeSingle();

      if (!error && data) return data;
    } catch (_) {}
  }

  const product = FALLBACK_CATALOG.products.find(p => (p.product_code || '').toUpperCase() === clean);
  if (!product) return null;

  const brand = FALLBACK_CATALOG.brands.find(b => b.id === product.brand_id);
  const skus = FALLBACK_CATALOG.skus.filter(s => s.product_id === product.id);

  return {
    ...product,
    brand,
    skus
  };
}

/**
 * 6. Get Full Relational Tree for an Engine
 */
async function getEngineHierarchy(engineId) {
  const engines = await getEngines();
  const engine = engines.find(e => e.id === engineId || e.code.toLowerCase() === engineId.toLowerCase());
  if (!engine) return null;

  const verticals = await getVerticals(engine.id);
  const result = {
    ...engine,
    verticals: []
  };

  for (const v of verticals) {
    const brands = await getBrandsByVertical(v.id);
    result.verticals.push({
      ...v,
      brands
    });
  }

  return result;
}

/**
 * 7. Get Entire Company Catalog Tree (All 5 Engines)
 */
async function getFullCatalogTree() {
  const engines = await getEngines();
  const tree = [];
  for (const eng of engines) {
    const hierarchy = await getEngineHierarchy(eng.id);
    if (hierarchy) tree.push(hierarchy);
  }
  return tree;
}

/**
 * 8. Resolve Canonical SKU
 * e.g. GRO-E2-SME-GWT-SVC001-FIV
 */
async function resolveSku(skuCode) {
  if (!skuCode || typeof skuCode !== 'string') return null;
  const cleanCode = skuCode.trim().toUpperCase();

  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('catalog_skus')
        .select(`
          *,
          product:catalog_products (
            *,
            brand:catalog_brands (*)
          )
        `)
        .eq('sku_code', cleanCode)
        .maybeSingle();

      if (!error && data) return data;
    } catch (_) {}
  }

  // Fallback memory resolver
  const matchedSku = FALLBACK_CATALOG.skus.find(s => s.sku_code === cleanCode);
  if (!matchedSku) {
    // Attempt canonical syntax decomposition
    const parts = cleanCode.split('-');
    if (parts.length >= 6 && parts[0] === 'GRO') {
      const engineCode = parts[1]; // E1..E5
      const verticalCode = parts[2];
      const brandCode = parts[3];
      const productCode = parts[4];
      const channel = parts[5];

      const brand = FALLBACK_CATALOG.brands.find(b => b.code === brandCode);
      const vertical = FALLBACK_CATALOG.verticals.find(v => v.code === verticalCode);

      return {
        sku_code: cleanCode,
        name: `${productCode} on ${channel}`,
        channel,
        price_usd: 0,
        price_bdt: 0,
        synthetic: true,
        decomposed: {
          engineCode,
          verticalCode,
          verticalName: vertical?.name || verticalCode,
          brandCode,
          brandName: brand?.name || brandCode,
          productCode,
          channel
        }
      };
    }
    return null;
  }

  const product = FALLBACK_CATALOG.products.find(p => p.id === matchedSku.product_id);
  const brand = product ? FALLBACK_CATALOG.brands.find(b => b.id === product.brand_id) : null;

  return {
    ...matchedSku,
    product: {
      ...product,
      brand
    }
  };
}

module.exports = {
  getEngines,
  getVerticals,
  getBrandsByVertical,
  getProducts,
  getServiceByCode,
  getEngineHierarchy,
  getFullCatalogTree,
  resolveSku,
  FALLBACK_CATALOG
};
