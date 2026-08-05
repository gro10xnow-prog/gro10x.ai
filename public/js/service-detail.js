// 🔮 PURPLEBOT DIGITAL — SERVICE DETAIL PAGE CONTROLLER (v0.8.0 - Phase 6 Overhaul)

const SERVICE_DATABASE = {
  'digital-marketing': {
    title: 'Digital Marketing',
    category: 'PERFORMANCE & GROWTH',
    heroTitle: 'Digital Marketing & <br><span class="pb-gradient-text">Brand Growth</span>',
    subtitle: 'Strategic social media management, targeted paid ads, content creation, SEO, and community management built to drive high-converting ROI.',
    metaDesc: 'Scale your revenue with Purplebot Digital performance marketing, social media retainers, Meta & Google ads, and SEO.',
    statCard1: { icon: '🎯', title: 'Meta & Google ROI', desc: 'Data-driven conversion funnels' },
    statCard2: { icon: '📈', title: '3.8x Avg ROAS', desc: 'Verified performance metrics' },
    pills: [
      '📱 Social Media Marketing',
      '📈 Meta & Google Paid Ads',
      '🔍 Search Engine Optimization (SEO)',
      '✍️ Content Strategy & Copywriting',
      '💬 Community & Page Management',
      '📊 Performance Analytics & ROI Reports'
    ],
    features: [
      { icon: '📱', title: 'Social Media Strategy & Retainers', desc: 'Monthly content plans, creative graphic posts, captions, and publishing calendar tailored to your target demographic.' },
      { icon: '🎯', title: 'Meta & Google Ads Engine', desc: 'Precision audience targeting, retargeting pixels, A/B ad creative testing, and conversion funnel optimization.' },
      { icon: '💬', title: 'Community Response SLA < 15m', desc: 'Dedicated page moderators ensuring customer inquiries, DMs, and comments are answered rapidly around the clock.' },
      { icon: '🔍', title: 'Search Engine Optimization (SEO)', desc: 'On-page SEO, technical audits, keyword research, and high-authority link building for long-term organic leads.' },
      { icon: '✍️', title: 'Copywriting & Content Strategy', desc: 'High-converting ad copy, landing page content, brand storytelling, and weekly campaign scripts.' },
      { icon: '📊', title: 'Performance Analytics & Reports', desc: 'Transparent weekly and monthly dashboard reports detailing reach, cost-per-lead, conversion rates, and ROI.' }
    ],
    process: [
      { num: '01', icon: '🔍', title: 'Audit & Benchmark', desc: 'We analyze your brand footprint, competitor strategies, and customer demographics to set KPIs.' },
      { num: '02', icon: '✍️', title: 'Content & Campaign Setup', desc: 'Our copywriters and graphic designers build campaign funnels, ad creatives, and posting schedules.' },
      { num: '03', icon: '🚀', title: 'Launch & A/B Testing', desc: 'Campaigns go live with continuous budget optimization and dynamic ad set testing.' },
      { num: '04', icon: '📈', title: 'Scale & Monthly ROI Reports', desc: 'We double down on top-performing assets and provide clear weekly/monthly ROI statements.' }
    ],
    portfolio: [
      { title: 'Chillox Burger Chain Social Scale', client: 'Chillox BD', category: 'Social Media & Paid Ads', metric: '+240% Sales Leads', bg: '#0f172a' },
      { title: 'Crave BD E-Commerce Ad Campaign', client: 'Crave BD', category: 'Meta Ads & Funnels', metric: '4.2x ROAS Delivered', bg: '#1e1b4b' },
      { title: 'Secret Recipe Ramadan Marketing', client: 'Secret Recipe', category: 'Seasonal Campaign', metric: '+1.5M Local Impressions', bg: '#311042' }
    ]
  },
  'video-editing': {
    title: 'Video Editing & Animation',
    category: 'AV PRODUCTION & ANIMATION',
    heroTitle: 'Video Production & <br><span class="pb-gradient-text">Reels & TVC</span>',
    subtitle: 'From viral short-form reels to 2D/3D animated explainers, motion graphics, sound design, color grading, and commercial TVCs.',
    metaDesc: 'Engage your audience with viral video reels, 2D/3D explainers, TVC commercials, color grading, and motion graphics by Purplebot Digital.',
    statCard1: { icon: '🎬', title: '4K Commercial Cut', desc: 'Frame-accurate editing & FX' },
    statCard2: { icon: '⚡', title: '48hr Turnaround', desc: 'Fast delivery for social reels' },
    pills: [
      '🎬 Scriptwriting & Storyboarding',
      '🎥 2D/3D Explainer Video',
      '📢 2D/3D Infomercial Video',
      '✨ Motion Graphics',
      '🕶️ AR Video Production',
      '🔊 Sound Design & SFX',
      '🎨 Color Grading & Correction',
      '✂️ Multi-Cam TVC Editing'
    ],
    features: [
      { icon: '🎬', title: 'Animated AV & 2D/3D Explainers', desc: 'Infographics, storyboarding, character design, and 2D/3D animation for complex product features and company presentations.' },
      { icon: '✂️', title: 'Commercial TVC & Product Cut', desc: 'Multi-cam edits, licensed audio composition, broadcast color grading, and high-impact visual cuts for television and web.' },
      { icon: '📱', title: 'Viral Short-Form Reels & Shorts', desc: 'High-retention vertical cut reels with dynamic captions, sound FX, and hooks optimized for TikTok, Instagram, and YouTube Shorts.' },
      { icon: '✨', title: 'Motion Graphics & Visual Effects', desc: 'Custom lower thirds, logo intros, typography animations, particle effects, and green-screen background keying.' },
      { icon: '🔊', title: 'Sound Engineering & Voiceover', desc: 'Studio voiceover recording in English and Bengali, sound effects layering, noise reduction, and final audio mastering.' },
      { icon: '🎨', title: 'Color Grading & Finishing', desc: 'Professional Davinci Resolve color grading, mood matching, skin-tone correction, and final 4K export master rendering.' }
    ],
    process: [
      { num: '01', icon: '📜', title: 'Script & Storyboard', desc: 'We write compelling video scripts and frame-by-frame visual storyboards for your approval.' },
      { num: '02', icon: '🎥', title: 'Animation & Assembly', desc: 'Animators and editors construct the rough cut, keyframes, transitions, and scene pacing.' },
      { num: '03', icon: '🔊', title: 'Sound FX & Color Grade', desc: 'We apply voiceovers, licensed music tracks, custom SFX, and professional color grading.' },
      { num: '04', icon: '✨', title: 'Review Room Approval', desc: 'You preview the cut in our interactive Review Room, leave timestamped notes, and approve the final master.' }
    ],
    portfolio: [
      { title: 'Chillox TVC Master Commercial Cut', client: 'Chillox Fast Food', category: 'Broadcast Commercial TVC', metric: 'v2.4 Approved Master', bg: '#09090b' },
      { title: 'Hero MotoCorp 2D Explainer Video', client: 'Hero Bangladesh', category: '2D Animated Explainer', metric: '500K Organic Views', bg: '#18181b' },
      { title: 'Foodpanda Viral Reel Series', client: 'Foodpanda BD', category: 'Short-Form Video Reels', metric: '1.2M Total Retention', bg: '#27272a' }
    ]
  },
  'tvc-production': {
    title: 'TVC & OVC Commercial Production',
    category: 'COMMERCIAL TVC & FILM',
    heroTitle: 'TVC & OVC Commercial <br><span class="pb-gradient-text">Video Production</span>',
    subtitle: 'High-production video commercials with creative storyboarding, cinema director, 4K camera crew, talent casting, and broadcast master edit.',
    metaDesc: 'Broadcast commercial TVCs and online video commercials (OVC) produced by Purplebot Digital.',
    statCard1: { icon: '🎬', title: '4K Cinema Cut', desc: 'Broadcast color grading & FX' },
    statCard2: { icon: '🏆', title: '100% SLA Record', desc: 'On-time TVC delivery' },
    pills: [
      '🎬 Creative Storyboarding',
      '🎥 4K Cinema Camera Crew',
      '🎭 Professional Talent Casting',
      '🔊 Custom Music & Sound Design',
      '🎨 DaVinci Color Grading',
      '📺 TVC Broadcast Master Cuts'
    ],
    features: [
      { icon: '🎬', title: 'Commercial TVC & OVC Shoots', desc: 'End-to-end commercial video production featuring 4K cinema cameras, professional lighting setups, and experienced directors.' },
      { icon: '🎭', title: 'Talent Casting & Location Scouting', desc: 'Casting professional actors, models, and voiceover artists alongside scouting premium filming locations.' },
      { icon: '🎨', title: 'Broadcast Color Grading & Mastering', desc: 'DaVinci Resolve color grading, audio mastering, and broadcast-ready delivery cuts for TV and digital media.' },
      { icon: '🔊', title: 'Original Jingle & Sound Composition', desc: 'Custom background scores, jingles, sound effects, and multi-lingual voiceover recording.' }
    ],
    process: [
      { num: '01', icon: '📜', title: 'Concept & Scripting', desc: 'We draft the creative concept, TVC script, and visual storyboard for your brand.' },
      { num: '02', icon: '🎥', title: 'Production Shoot', desc: 'Our cinema crew handles multi-camera filming, lighting, and sound on set.' },
      { num: '03', icon: '✂️', title: 'Post-Production & Grading', desc: 'Editors refine the cut, apply color grading, visual effects, and custom sound design.' },
      { num: '04', icon: '📺', title: 'Broadcast Handover', desc: 'Final 4K master files delivered for TV broadcast and digital ad campaigns.' }
    ],
    portfolio: [
      { title: 'Chillox TVC Commercial Master Cut', client: 'Chillox BD', category: 'Broadcast TVC', metric: '2.4M Organic Reach', bg: '#09090b' },
      { title: 'UCB Financial Report Launch Video', client: 'UCB Bank', category: 'Corporate TVC', metric: '100% On-Time Delivery', bg: '#18181b' },
      { title: 'InterContinental Luxury Promo OVC', client: 'InterContinental', category: 'Hotel Promo Film', metric: '+1.8M Impressions', bg: '#27272a' }
    ]
  },
  'branding-graphics': {
    title: 'Branding & Graphics Design',
    category: 'BRAND IDENTITY & CREATIVE',
    heroTitle: 'Brand Identity & <br><span class="pb-gradient-text">Graphics Design</span>',
    subtitle: 'Cut through the clutter with unique logo design, complete brand books, packaging, and high-impact marketing collaterals.',
    metaDesc: 'Craft an unforgettable brand identity with Purplebot Digital logo design, packaging, brand guidelines, and POSM marketing collaterals.',
    statCard1: { icon: '🎨', title: '360° Identity System', desc: 'Logos, guidelines & toolkits' },
    statCard2: { icon: '📦', title: 'Print & POSM Ready', desc: 'Vector assets for print & packaging' },
    pills: [
      '🎨 Logo & Brand Identity',
      '📦 Packaging & Label Design',
      '📐 Brand Guidelines & Toolkits',
      '🖼️ Graphic Design & POSM',
      '👕 Merchandise & Apparel Design',
      '✨ 3D Packaging Renderings'
    ],
    features: [
      { icon: '🎨', title: '360° Brand Identity System', desc: 'Primary & secondary logos, color palette codes, typography hierarchy, brand voice guide, and vector logo assets.' },
      { icon: '📦', title: 'Product & Packaging Design', desc: 'Retail packaging boxes, bottle labels, unboxing experience graphics, and photorealistic 3D product mockups.' },
      { icon: '📐', title: 'POSM & Retail Marketing Collaterals', desc: 'Banners, standees, flyers, brochures, menu cards, social post templates, and billboard advertising graphics.' },
      { icon: '📘', title: 'Brand Guidelines & Standards Book', desc: 'A comprehensive brand rulebook ensuring consistent visual presentation across print, web, and social channels.' },
      { icon: '✨', title: 'Social Media Graphic Templates', desc: 'Custom Figma & Photoshop templates for promotional posts, stories, banners, and announcement cards.' }
    ],
    process: [
      { num: '01', icon: '💡', title: 'Brand Discovery', desc: 'We explore your target market, brand personality, mood boards, and aesthetic direction.' },
      { num: '02', icon: '🎨', title: 'Concept Creation', desc: 'Designers draft multiple distinct logo directions and visual identity concepts.' },
      { num: '03', icon: '📐', title: 'Refinement & Collaterals', desc: 'We refine the chosen direction and build packaging, POSM, and graphic toolkits.' },
      { num: '04', icon: '📦', title: 'Asset Handover', desc: 'You receive vector SVG, AI, EPS, print-ready PDFs, and the master brand book.' }
    ],
    portfolio: [
      { title: 'Niketon Bistro Brand Identity System', client: 'Niketon Hospitality', category: 'Brand Guidelines & POSM', metric: 'Complete Rebrand', bg: '#1c1917' },
      { title: 'Apex Footwear Campaign POSM Design', client: 'Apex BD', category: 'Retail POSM & Banners', metric: 'Deployed 80+ Stores', bg: '#292524' },
      { title: 'Artisan Gourmet Coffee Packaging', client: 'Artisan Roasters', category: '3D Package & Label Design', metric: 'International Award Winner', bg: '#44403c' }
    ]
  },
  'website-development': {
    title: 'Website Development',
    category: 'WEB ENGINE & DESIGN',
    heroTitle: 'Website Development & <br><span class="pb-gradient-text">Custom Web Apps</span>',
    subtitle: 'Sleek corporate portfolio sites, dynamic e-commerce platforms, custom-coded web apps, fast loading speed, and mobile optimization.',
    metaDesc: 'Build high-converting websites, e-commerce stores, custom Web apps, and responsive mobile interfaces with Purplebot Digital.',
    statCard1: { icon: '🌐', title: 'Sub-Second Speed', desc: 'Optimized lighthouse score 95+' },
    statCard2: { icon: '🔒', title: 'Enterprise Guard', desc: 'SSL, API protection & backup' },
    pills: [
      '🌐 WordPress Custom Themes',
      '💻 React / Next.js Web Apps',
      '🏢 Corporate Portfolio Portals',
      '🛒 E-Commerce Solutions',
      '🛠️ Maintenance & Hosting',
      '📱 Mobile UX Optimization'
    ],
    features: [
      { icon: '🌐', title: 'WordPress & Custom Web Sites', desc: 'Fast, secure, search-engine-friendly corporate websites built with custom themes or lightweight page builders.' },
      { icon: '🛒', title: 'E-Commerce Storefronts', desc: 'Shopping cart integration, payment gateways (bKash, Nagad, Visa), inventory sync, and order notifications.' },
      { icon: '⚡', title: 'Mobile & Device Optimization', desc: 'Flawless responsive design, touch-friendly UI components, and fluid layout adjustments across all screen resolutions.' },
      { icon: '🚀', title: 'Speed & Technical SEO Audit', desc: 'Image compression, code minification, CDN setup, and structured schema markup for top search engine rankings.' },
      { icon: '💻', title: 'Headless Web App Architecture', desc: 'Modern React/Vite/Next.js frontend applications connected to scalable REST and GraphQL APIs.' },
      { icon: '🛡️', title: 'Web Maintenance & SLA Support', desc: 'Routine security patches, automated database backups, speed monitoring, and content updates.' }
    ],
    process: [
      { num: '01', icon: '🎨', title: 'Wireframes & UX Mockup', desc: 'We map out user flows, section hierarchy, and interactive prototypes for design approval.' },
      { num: '02', icon: '💻', title: 'Frontend & Backend Coding', desc: 'Developers write clean, responsive code integrated with secure CMS or custom database backends.' },
      { num: '03', icon: '🧪', title: 'Performance & QA Audit', desc: 'We test cross-browser compatibility, page speed scores, SSL certificates, and mobile responsiveness.' },
      { num: '04', icon: '🚀', title: 'Launch & Training', desc: 'Site goes live on production server with full admin training and 30-day post-launch warranty.' }
    ],
    portfolio: [
      { title: 'GRO10X Business Enterprise Portal', client: 'GRO10X Group', category: 'Custom Web Application', metric: '0.4s Page Load Speed', bg: '#064e3b' },
      { title: 'Rupsha Tower Corporate Website', client: 'Rupsha Real Estate', category: 'Corporate Portfolio Web', metric: '+180% Web Inquiries', bg: '#022c22' },
      { title: 'Lifestyle Fashion E-Commerce Store', client: 'Urban Threads', category: 'E-Commerce & bKash Pay', metric: '$120K Monthly GMV', bg: '#134e4a' }
    ]
  },
  'custom-tech': {
    title: 'Custom Tech Solutions',
    category: 'ENTERPRISE TECH & SYSTEMS',
    heroTitle: 'Custom Tech & <br><span class="pb-gradient-text">Enterprise Systems</span>',
    subtitle: 'Innovative technology solutions designed to streamline business operations, automate workflows, and empower teams.',
    metaDesc: 'Automate business operations with custom ERPs, CRMs, inventory managers, mobile PWAs, and full-stack software by Purplebot Digital.',
    statCard1: { icon: '👥', title: 'Custom CRM & ERP', desc: 'Tailored for your business workflows' },
    statCard2: { icon: '🤖', title: 'AI & Automation', desc: 'Bots, APIs & SSE integrations' },
    pills: [
      '🛒 E-commerce & Inventory System',
      '👥 CRM Sales Pipeline Portal',
      '🍔 Restaurant & Order Delivery App',
      '📋 HR & Operations Management System',
      '⚙️ Enterprise ERP Custom Software',
      '💻 Tech Talent Outsourcing'
    ],
    features: [
      { icon: '👥', title: 'Custom CRM & ERP Engines', desc: 'Tailor-made portals for sales pipelines, automated invoicing, lead tracking, inventory control, and executive reporting.' },
      { icon: '🍔', title: 'Industry Operations Systems', desc: 'Specialized management platforms for restaurants, delivery dispatch, real estate, clinics, and retail chains.' },
      { icon: '🤖', title: 'Automation & Chatbot Integration', desc: 'Telegram/WhatsApp business bots, automated client onboarding, instant lead routing, and workflow webhooks.' },
      { icon: '💻', title: 'Dedicated Tech Resource Deployment', desc: 'Senior full-stack developers, UI/UX designers, and QA engineers integrated directly into your operating team.' },
      { icon: '🔄', title: 'Real-Time Sync & Analytics', desc: 'Server-Sent Events (SSE) and WebSockets for real-time dashboard updates without page refreshing.' },
      { icon: '🔑', title: 'Role-Based Access & Security', desc: 'Bank-grade authentication, session tokens, audit logging, and granual permission controls for team members.' }
    ],
    process: [
      { num: '01', icon: '📋', title: 'System Architecture', desc: 'We map system entities, database schemas, API contracts, and user role permission matrices.' },
      { num: '02', icon: '⚙️', title: 'Sprint Development', desc: 'Agile 2-week coding sprints with active staging preview links for client testing.' },
      { num: '03', icon: '🔐', title: 'Security & Penetration Audit', desc: 'We conduct security audits, database indexing, stress tests, and API token validation.' },
      { num: '04', icon: '🏢', title: 'Deployment & Support', desc: 'Production deployment with full database backup scripts, SLA support, and team onboarding.' }
    ],
    portfolio: [
      { title: 'PurpleOS Agency ERP Platform', client: 'Purplebot Digital', category: 'Internal Operating System', metric: 'Powers Entire Agency', bg: '#3b0764' },
      { title: 'Chillox Kitchen Order Dispatch System', client: 'Chillox BD', category: 'Real-Time Restaurant Tech', metric: 'Handles 5K+ Daily Orders', bg: '#4c1d95' },
      { title: 'Banani Logistics Fleet Tracker', client: 'Banani Express', category: 'Logistics & Inventory App', metric: '99.98% Uptime Record', bg: '#581c87' }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  renderServiceDetailPage();
});

function renderServiceDetailPage() {
  const ID_TO_KEY = {
    // SVC-001 / Digital Marketing
    'svc-001': 'digital-marketing',
    '1': 'digital-marketing',
    'srv_001': 'digital-marketing',
    'digital-marketing': 'digital-marketing',

    // SVC-002 / Reels
    'svc-002': 'video-editing',
    '2': 'video-editing',
    'srv_002': 'video-editing',
    'video-editing': 'video-editing',
    'video-production': 'video-editing',

    // SVC-003 / TVC Commercial
    'svc-003': 'tvc-production',
    '3': 'tvc-production',
    'srv_003': 'tvc-production',
    'tvc-production': 'tvc-production',

    // SVC-004 / Brand Identity
    'svc-004': 'branding-graphics',
    '4': 'branding-graphics',
    'srv_004': 'branding-graphics',
    'branding-graphics': 'branding-graphics',
    'branding': 'branding-graphics',

    // SVC-005 / Website Development
    'svc-005': 'website-development',
    '5': 'website-development',
    'srv_005': 'website-development',
    'website-development': 'website-development',

    // SVC-006 / Custom Tech
    'svc-006': 'custom-tech',
    '6': 'custom-tech',
    'srv_006': 'custom-tech',
    'custom-tech': 'custom-tech'
  };

  const urlParams = new URLSearchParams(window.location.search);
  const rawId = (urlParams.get('id') || urlParams.get('service') || '').trim().toLowerCase();

  const key = ID_TO_KEY[rawId];

  if (!key) {
    document.title = 'Service Not Found — Purplebot Digital';
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'none';
    const notFoundEl = document.getElementById('notFoundContent');
    if (notFoundEl) notFoundEl.style.display = 'block';
    return;
  }

  const data = SERVICE_DATABASE[key];

  // 1. UPDATE PAGE SEO & META TAGS
  const fullTitle = `${data.title} — Purplebot Digital Agency`;
  document.title = fullTitle;

  const metaDescEl = document.getElementById('metaDescription');
  if (metaDescEl) metaDescEl.setAttribute('content', data.metaDesc);

  const ogTitleEl = document.getElementById('ogTitle');
  if (ogTitleEl) ogTitleEl.setAttribute('content', fullTitle);

  const ogDescEl = document.getElementById('ogDescription');
  if (ogDescEl) ogDescEl.setAttribute('content', data.metaDesc);

  const ogUrlEl = document.getElementById('ogUrl');
  if (ogUrlEl) ogUrlEl.setAttribute('content', window.location.href);

  const twitterTitleEl = document.getElementById('twitterTitle');
  if (twitterTitleEl) twitterTitleEl.setAttribute('content', fullTitle);

  const twitterDescEl = document.getElementById('twitterDescription');
  if (twitterDescEl) twitterDescEl.setAttribute('content', data.metaDesc);

  // Set Canonical URL
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', `https://purplebot.digital/services/${key}`);

  // 2. RENDER BREADCRUMB
  renderBreadcrumbs(data.title);

  // 3. RENDER HERO CONTENT
  const badge = document.getElementById('svcCategoryBadge');
  if (badge) badge.innerText = data.category;

  const title = document.getElementById('svcTitle');
  if (title) title.innerHTML = data.heroTitle;

  const subtitle = document.getElementById('svcSubtitle');
  if (subtitle) subtitle.innerText = data.subtitle;

  // Mascot Floating Card 2
  const mascotCard2 = document.getElementById('svcMascotCard2');
  if (mascotCard2 && data.statCard2) {
    mascotCard2.className = 'pb-mascot-card pb-mascot-card-2';
    mascotCard2.innerHTML = `
      <span class="card-icon">${data.statCard2.icon}</span>
      <div>
        <strong>${data.statCard2.title}</strong>
        <span>${data.statCard2.desc}</span>
      </div>
    `;
  }

  // 4. RENDER CAPABILITY PILLS (No inline styles)
  const pillsContainer = document.getElementById('svcPillsContainer');
  if (pillsContainer && data.pills) {
    pillsContainer.innerHTML = data.pills.map(p => `
      <div class="pb-capability-pill">
        <span>${p}</span>
      </div>
    `).join('');
  }

  // 5. RENDER FEATURE GRID
  const grid = document.getElementById('svcFeatureGrid');
  if (grid && data.features) {
    grid.innerHTML = data.features.map(f => `
      <div class="pb-service-card">
        <div>
          <div class="pb-svc-icon">${f.icon}</div>
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
        </div>
        <button onclick="openPurpleBot('${f.title}')" class="pb-btn-svc">
          Inquire For ${f.title.split(' ')[0]} →
        </button>
      </div>
    `).join('');
  }

  // 6. RENDER HOW WE WORK / PROCESS SECTION
  renderProcessSection(data.process);

  // 7. RENDER PORTFOLIO CASE STUDIES
  renderPortfolioSection(data.portfolio);

  // Set global active service for Purple Bot CTA button
  window.activeServiceTitle = data.title;
}

function renderBreadcrumbs(serviceTitle) {
  const container = document.getElementById('svcBreadcrumb');
  if (!container) return;

  container.className = 'pb-breadcrumb-wrap';
  container.innerHTML = `
    <div class="pb-breadcrumb-container">
      <a href="/" class="pb-breadcrumb-link">🏠 Home</a>
      <span class="pb-breadcrumb-sep">›</span>
      <a href="/#capabilities" class="pb-breadcrumb-link">Services</a>
      <span class="pb-breadcrumb-sep">›</span>
      <span class="pb-breadcrumb-current">${serviceTitle}</span>
    </div>
  `;
}

function renderProcessSection(processArray) {
  const section = document.getElementById('svcProcessSection');
  if (!section || !processArray) return;

  section.innerHTML = `
    <div class="pb-section-container">
      <div class="pb-section-header">
        <span class="pb-section-badge">DELIVERY WORKFLOW</span>
        <h2 class="pb-section-title">How We Deliver Results for You</h2>
        <p class="pb-section-desc">Our proven 4-step process ensures transparency, speed, and guaranteed SLA execution from day one.</p>
      </div>

      <div class="pb-process-grid">
        ${processArray.map(p => `
          <div class="pb-process-card">
            <span class="pb-step-num">${p.num}</span>
            <div class="pb-step-icon">${p.icon}</div>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPortfolioSection(portfolioArray) {
  const grid = document.getElementById('svcRelatedPortfolio');
  if (!grid || !portfolioArray) return;

  grid.innerHTML = portfolioArray.map(item => `
    <div class="pb-portfolio-card">
      <div class="pb-portfolio-thumb" style="background:${item.bg || '#0f172a'}; display:flex; flex-direction:column; justify-between; align-items:flex-start; color:#ffffff;">
        <span class="pb-category-tag">${item.category}</span>
        <div style="margin-top:auto; font-size:1.4rem; font-weight:800;">${item.client}</div>
      </div>
      <div class="pb-portfolio-info">
        <h3>${item.title}</h3>
        <p>Delivered by Purplebot senior creative & engineering teams.</p>
        <span class="pb-portfolio-metric">🚀 ${item.metric}</span>
      </div>
    </div>
  `).join('');
}

function triggerServiceQuote() {
  const serviceName = window.activeServiceTitle || 'Service Consultation';
  openPurpleBot(serviceName);
}
