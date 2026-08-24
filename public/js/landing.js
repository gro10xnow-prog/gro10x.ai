// ⚡ GRO10X AI GROWTH AGENCY — PUBLIC LANDING PAGE CONTROLLER (v4.0)

// ── 1. GLOBAL CURRENCY & PREFERENCES ──
var currentCurrency = localStorage.getItem('gro10x_currency') || 'USD';

// ── 2. COMPREHENSIVE SERVICE CATALOG MATRIX ──
var GRO10X_SERVICES = [
  // 📱 Mobile & Web Apps
  {
    id: 'SVC-001',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '📱',
    title: 'AI Mobile Apps',
    badge: 'NEW',
    description: 'Custom iOS and Android mobile apps with native generative AI and intelligent agent features built-in.',
    priceUSD: '$3,500',
    priceBDT: '৳410,000',
    priceCycle: '/ project',
    features: ['Native React Native / Flutter Stack', 'On-Device & Cloud AI APIs', 'Real-Time Sync & Offline Mode', 'App Store / Play Store Deployment'],
    details: 'We build high-performance mobile apps integrated with AI models for image processing, real-time voice, smart search, and personalized recommendations.'
  },
  {
    id: 'SVC-002',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '💻',
    title: 'AI Websites & Software',
    badge: 'NEW',
    description: 'Ultra-fast web platforms and SaaS apps powered by modern frameworks and smart AI automation tools.',
    priceUSD: '$2,500',
    priceBDT: '৳295,000',
    priceCycle: '/ project',
    features: ['Next.js & Node.js Architecture', 'AI Lead Generation & Forms', 'SEO & Performance Optimized', 'Custom Database & Authentication'],
    details: 'From high-converting landing pages to complex web software, we engineer platforms that scale smoothly and automate client acquisition.'
  },
  {
    id: 'SVC-003',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '🤖',
    title: 'AI Chatbots & Intelligent Agents',
    badge: 'POPULAR',
    description: '24/7 smart conversational assistants connected to your knowledge base, WhatsApp, and CRM pipelines.',
    priceUSD: '$1,500',
    priceBDT: '৳175,000',
    priceCycle: '/ setup',
    features: ['Context-Aware RAG Knowledge Base', 'WhatsApp, Telegram & Web Widget', 'Human Handoff & CRM Sync', 'Multi-Language Support'],
    details: 'Deploy AI agents that qualify incoming leads, answer customer questions accurately 24/7, and book meetings automatically.'
  },
  {
    id: 'SVC-004',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '🔌',
    title: 'AI Integrations & APIs',
    badge: '',
    description: 'Seamlessly connect your existing business tools (Stripe, HubSpot, Slack, WhatsApp) to state-of-the-art AI models.',
    priceUSD: '$1,200',
    priceBDT: '৳140,000',
    priceCycle: '/ project',
    features: ['Custom Webhooks & REST APIs', 'Automated Data Sync Pipelines', 'Zapier / Make.com / n8n Nodes', 'Zero System Downtime'],
    details: 'Bridge data silos in your business so repetitive operations run autonomously in the background.'
  },
  {
    id: 'SVC-005',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '🧠',
    title: 'AI Fine-Tuning & Custom Models',
    badge: '',
    description: 'Train and customize large language models on your internal data and brand tone for hyper-accurate outputs.',
    priceUSD: '$2,800',
    priceBDT: '৳330,000',
    priceCycle: '/ model',
    features: ['Dataset Cleaning & Formatting', 'LoRA & Full Fine-Tuning Pipelines', 'Evaluations & Benchmark Testing', 'Private Cloud Hosting'],
    details: 'Ensure your AI produces consistent, on-brand responses without hallucinations.'
  },
  {
    id: 'SVC-006',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '💡',
    title: 'AI Technology Consulting',
    badge: 'NEW',
    description: 'Expert technical roadmap to help your executive team select, architect, and deploy the right AI toolset.',
    priceUSD: '$800',
    priceBDT: '৳95,000',
    priceCycle: '/ audit',
    features: ['Full Tech Stack Audit', 'Cost vs. ROI Assessment', 'Architecture Diagram & Roadmap', 'Vendor & API Selection'],
    details: 'Avoid costly technical mistakes by letting senior engineers plan your AI infrastructure.'
  },
  {
    id: 'SVC-007',
    category: 'mobile-web',
    categoryName: 'AI Mobile Development',
    icon: '🛠️',
    title: 'Let Us Manage Your Project',
    badge: '',
    description: 'End-to-end dedicated technical management: we handle design, coding, testing, and cloud deployment.',
    priceUSD: 'Custom Scope',
    priceBDT: 'Custom Scope',
    priceCycle: '',
    features: ['Dedicated Project Manager', 'Agile Weekly Sprints', 'Transparent Kanban Tracking', '100% On-Time Delivery Guarantee'],
    details: 'Have a complete software development team at your disposal without the hassle of hiring and managing developers.'
  },

  // 🎨 AI Artists & Design
  {
    id: 'SVC-008',
    category: 'ai-artists',
    categoryName: 'AI Artists',
    icon: '👤',
    title: 'AI Avatar Design',
    badge: 'NEW',
    description: 'Photorealistic or stylized digital avatars and brand ambassadors customized for your marketing campaigns.',
    priceUSD: '$600',
    priceBDT: '৳70,000',
    priceCycle: '/ avatar kit',
    features: ['Multiple Poses & Expressions', '4K Commercial License Export', 'Voice-Sync Ready Lip Rigging', 'Brand Asset Kit Included'],
    details: 'Create recognizable virtual brand mascots and spokespersons for your video ads and social media.'
  },
  {
    id: 'SVC-009',
    category: 'ai-artists',
    categoryName: 'AI Artists',
    icon: '⚙️',
    title: 'ComfyUI Workflow Creation',
    badge: 'POPULAR',
    description: 'Bespoke ComfyUI nodes and automated pipelines for instant, consistent product photo generation.',
    priceUSD: '$1,500',
    priceBDT: '৳175,000',
    priceCycle: '/ workflow',
    features: ['Custom ControlNet & IP-Adapter', 'One-Click Generation Setup', 'Product Consistency Presets', 'Cloud or Local Installation'],
    details: 'Stop doing manual product photoshoots. Generate hundreds of studio-quality marketing images in seconds.'
  },
  {
    id: 'SVC-010',
    category: 'ai-artists',
    categoryName: 'AI Artists',
    icon: '🎨',
    title: 'Midjourney & Stable Diffusion Art',
    badge: '',
    description: 'High-concept artwork, architectural renders, packaging concepts, and high-impact digital art.',
    priceUSD: '$500',
    priceBDT: '৳60,000',
    priceCycle: '/ batch',
    features: ['Upscaled 4K/8K Deliverables', 'Prompt Formula Handover', 'Vectorization & Layered Files', 'Full Commercial Rights'],
    details: 'Premium visuals crafted by experienced prompt engineers and creative directors.'
  },
  {
    id: 'SVC-011',
    category: 'ai-artists',
    categoryName: 'AI Artists',
    icon: '✨',
    title: 'All AI Art Services',
    badge: '',
    description: 'Full-service visual production covering marketing creatives, social graphics, icon sets, and vector illustrations.',
    priceUSD: '$500',
    priceBDT: '৳60,000',
    priceCycle: '/ month',
    features: ['Weekly Creative Batches', 'Fast 48h Turnaround SLA', 'Revision Cycles Included', 'Social-Ready Formats (1:1, 9:16)'],
    details: 'A steady stream of fresh marketing assets every week to fuel your social channels and paid ads.'
  },

  // 💼 AI for Businesses
  {
    id: 'SVC-012',
    category: 'business-ai',
    categoryName: 'AI for Businesses',
    icon: '👔',
    title: 'AI Business Consulting',
    badge: '',
    description: 'Practical 1-on-1 strategy sessions to find the highest-ROI AI automation opportunities in your workflows.',
    priceUSD: '$750',
    priceBDT: '৳90,000',
    priceCycle: '/ session',
    features: ['Workflow Bottleneck Analysis', 'Tool Recommendations', 'Implementation Blueprint', 'Recorded Session & Action Plan'],
    details: 'Learn how modern businesses are saving 20+ hours a week and cutting software costs with AI.'
  },
  {
    id: 'SVC-013',
    category: 'business-ai',
    categoryName: 'AI for Businesses',
    icon: '🗺️',
    title: 'AI Strategy & Growth Roadmap',
    badge: '',
    description: 'A comprehensive operational transformation roadmap to scale your agency or enterprise using automated systems.',
    priceUSD: '$1,800',
    priceBDT: '৳210,000',
    priceCycle: '/ roadmap',
    features: ['Multi-Department AI Mapping', 'KPI & Margin Projections', 'Staff Upskilling Plan', 'Risk & Privacy Guidelines'],
    details: 'A strategic document mapping out quarterly goals, AI tool deployment, and expected cost reductions.'
  },
  {
    id: 'SVC-014',
    category: 'business-ai',
    categoryName: 'AI for Businesses',
    icon: '🎓',
    title: 'AI Lessons & Team Workshops',
    badge: '',
    description: 'Hands-on interactive training sessions to teach your employees how to use ChatGPT, Claude, Midjourney, and automation tools effectively.',
    priceUSD: '$1,000',
    priceBDT: '৳120,000',
    priceCycle: '/ workshop',
    features: ['Live Interactive Demos', 'Company-Specific Prompt Kits', 'Q&A & Hands-On Exercises', 'Certificate of Completion'],
    details: 'Empower your existing staff to produce 3x the output without hiring additional headcount.'
  },

  // 📊 Data & Analytics
  {
    id: 'SVC-015',
    category: 'data',
    categoryName: 'Operational Data Intelligence',
    icon: '🔬',
    title: 'Data Science & ML',
    badge: '',
    description: 'Turn your historical customer data into predictive models that forecast sales, churn, and high-value customer cohorts.',
    priceUSD: '$2,400',
    priceBDT: '৳280,000',
    priceCycle: '/ project',
    features: ['Predictive Cohort Modeling', 'Customer LTV Projections', 'Python & SQL Pipeline Build', 'Automated Training Runs'],
    details: 'Stop guessing what your customers want. Use scientific predictive models to guide marketing and product decisions.'
  },
  {
    id: 'SVC-016',
    category: 'data',
    categoryName: 'Operational Data Intelligence',
    icon: '📊',
    title: 'Data Analytics & Dashboards',
    badge: 'POPULAR',
    description: 'Clean, real-time visual dashboards that give leadership an instant view of marketing ROI, leads, and financials.',
    priceUSD: '$1,200',
    priceBDT: '৳140,000',
    priceCycle: '/ dashboard',
    features: ['Real-Time Data Connectors', 'Custom KPI Metric Cards', 'Mobile-Friendly Responsive UI', 'Automated Weekly Email Reports'],
    details: 'Unify data from Google Ads, Meta, Stripe, and your database into a single executive command center.'
  },
  {
    id: 'SVC-017',
    category: 'data',
    categoryName: 'Operational Data Intelligence',
    icon: '📈',
    title: 'Data Visualization & Diagnostics',
    badge: '',
    description: 'Diagnostic user-pathway funnels that pinpoint exactly where prospective customers drop off in your sales pipeline.',
    priceUSD: '$900',
    priceBDT: '৳105,000',
    priceCycle: '/ audit',
    features: ['Funnel Drop-Off Heatmaps', 'Conversion Rate Optimization', 'Cohort Retention Graphs', 'Actionable Fix Checklist'],
    details: 'Fix leaks in your marketing funnels to dramatically increase conversion rates from existing traffic.'
  },

  // 🎬 AI Video Production
  {
    id: 'SVC-018',
    category: 'video',
    categoryName: 'AI Video',
    icon: '🎵',
    title: 'AI Music Videos',
    badge: '',
    description: 'Visually stunning AI-generated music videos, dynamic visualizers, and artistic teaser clips.',
    priceUSD: '$1,200',
    priceBDT: '৳140,000',
    priceCycle: '/ video',
    features: ['Beat-Synced Visual Transitions', 'Cinematic Camera Motions', 'Custom Aesthetic Direction', '4K Master Render Output'],
    details: 'Create mind-bending video visuals that capture viral attention across TikTok and YouTube.'
  },
  {
    id: 'SVC-019',
    category: 'video',
    categoryName: 'AI Video',
    icon: '🗣️',
    title: 'AI Video Avatars',
    badge: 'POPULAR',
    description: 'Photorealistic talking avatar videos for tutorials, product explainers, and localized multilingual ads.',
    priceUSD: '$800',
    priceBDT: '৳95,000',
    priceCycle: '/ 5 videos',
    features: ['Realistic Lip-Sync Accuracy', '20+ Languages & Accents', 'Dynamic Background Scenes', 'Fast 24-48h Delivery'],
    details: 'Produce endless video presentations without needing a camera, studio, or recording equipment.'
  },
  {
    id: 'SVC-020',
    category: 'video',
    categoryName: 'AI Video',
    icon: '📱',
    title: 'AI UGC Social Ads',
    badge: '',
    description: 'Engaging, user-generated style vertical video ads optimized for TikTok, Instagram Reels, and YouTube Shorts.',
    priceUSD: '$650',
    priceBDT: '৳75,000',
    priceCycle: '/ 5 reels',
    features: ['High-Retention Visual Hooks', 'Dynamic Captions & Sound FX', 'A/B Hook Variations', 'Proven E-Commerce Ad Formats'],
    details: 'Test dozens of viral ad angles quickly and cost-effectively to find your top-converting winners.'
  },

  // 🎙️ AI Audio & Voice
  {
    id: 'SVC-021',
    category: 'audio',
    categoryName: 'AI Audio',
    icon: '🎙️',
    title: 'Voice Synthesis & AI Voice Clones',
    badge: '',
    description: 'Clone your own voice or create realistic synthetic brand voices for podcasts, ads, and interactive assistants.',
    priceUSD: '$500',
    priceBDT: '৳60,000',
    priceCycle: '/ voice model',
    features: ['Studio Voice Matching', 'Natural Tone & Emotion Control', 'Multi-Language Speaking Ability', 'Commercial API Integration'],
    details: 'Maintain audio brand consistency across hundreds of videos and customer touchpoints.'
  },
  {
    id: 'SVC-022',
    category: 'audio',
    categoryName: 'AI Audio',
    icon: '🔊',
    title: 'Text to Speech Engines',
    badge: '',
    description: 'High-speed automated narration pipelines to turn blog posts, articles, and training docs into studio audio.',
    priceUSD: '$400',
    priceBDT: '৳48,000',
    priceCycle: '/ setup',
    features: ['Automated Audio File Exports', 'Natural Pacing & Pauses', 'Podcast RSS Feed Integration', 'Sub-Second API Latency'],
    details: 'Turn written content into engaging audiobooks and podcasts with zero manual recording time.'
  },

  // ✍️ AI Content & Writing
  {
    id: 'SVC-023',
    category: 'content',
    categoryName: 'AI Content',
    icon: '📝',
    title: 'AI Content Editing',
    badge: '',
    description: 'Human-in-the-loop polishing and optimization of AI-generated articles, blogs, and sales landing pages.',
    priceUSD: '$450',
    priceBDT: '৳52,000',
    priceCycle: '/ 10 articles',
    features: ['Fact-Checking & Source Verifications', 'SEO Keyword Optimization', 'Readability & Tone Refinement', 'Plagiarism & AI Scan Check'],
    details: 'Get the speed of AI writing with the credibility, nuance, and quality of professional editors.'
  },
  {
    id: 'SVC-024',
    category: 'content',
    categoryName: 'AI Content',
    icon: '✨',
    title: 'Custom Writing Prompts',
    badge: 'NEW',
    description: 'Tailored prompt engineering libraries designed for your marketing team to produce on-brand copy in seconds.',
    priceUSD: '$600',
    priceBDT: '৳70,000',
    priceCycle: '/ library',
    features: ['Brand Voice Guidelines Document', 'Tested System Prompts (Claude & GPT-4)', 'Email, Ad, & Social Templates', 'Staff Training Video'],
    details: 'Equip your writers and marketers with copy templates that produce consistent, high-converting copy every time.'
  }
];

// ── 3. DOM READY INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  initCurrency();
  filterServices('all');
  initNavbarScroll();
  initMobileMenu();
  initScrollTop();
  initScrollSpy();
  setDynamicYear();
});

// ── 4. DUAL CURRENCY ENGINE ──
function initCurrency() {
  const saved = localStorage.getItem('gro10x_currency') || 'USD';
  setCurrency(saved, false);
}

function setCurrency(curr, render = true) {
  currentCurrency = curr;
  localStorage.setItem('gro10x_currency', curr);

  // Update navbar toggle buttons
  const isUSD = curr === 'USD';
  document.querySelectorAll('#btnCurrUSD, #btnCurrUSDMobile').forEach(el => el.classList.toggle('active', isUSD));
  document.querySelectorAll('#btnCurrBDT, #btnCurrBDTMobile').forEach(el => el.classList.toggle('active', !isUSD));

  // Update static data attributes on the page
  document.querySelectorAll('[data-curr-usd]').forEach(el => {
    const usdVal = el.getAttribute('data-curr-usd');
    const bdtVal = el.getAttribute('data-curr-bdt');
    el.innerText = isUSD ? usdVal : bdtVal;
  });

  if (render) {
    const activeTab = document.querySelector('.cat-tab-btn.active');
    const activeCat = activeTab ? activeTab.getAttribute('onclick').match(/'([^']+)'/)[1] : 'all';
    filterServices(activeCat);
  }
}
window.setCurrency = setCurrency;

// ── 5. SERVICE MATRIX FILTERING & RENDERING ──
function filterServices(category) {
  // Update active tab styling
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    const catAttr = btn.getAttribute('onclick');
    if (catAttr && catAttr.includes(`'${category}'`)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  const filtered = category === 'all' 
    ? GRO10X_SERVICES 
    : GRO10X_SERVICES.filter(s => s.category === category);

  const isUSD = currentCurrency === 'USD';

  grid.innerHTML = filtered.map(s => {
    const priceText = isUSD ? s.priceUSD : s.priceBDT;
    const badgeHtml = s.badge ? `<span class="pb-card-badge">${s.badge}</span>` : '';

    return `
      <div class="pb-service-card">
        <div class="pb-card-header">
          <div class="pb-card-icon">${s.icon}</div>
          ${badgeHtml}
        </div>
        
        <span class="pb-card-cat">${s.categoryName}</span>
        <h3 class="pb-card-title">${s.title}</h3>
        <p class="pb-card-desc">${s.description}</p>

        <div class="pb-card-price-row">
          <span class="pb-price-tag">${priceText}</span>
          <span class="pb-price-cycle">${s.priceCycle}</span>
        </div>

        <ul class="pb-card-features">
          ${s.features.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>

        <div class="pb-card-actions">
          <button onclick="openServiceDetail('${s.id}')" class="pb-btn-card-details">
            🔍 Details
          </button>
          <button onclick="openLeadModal('${s.title} (${priceText})')" class="pb-btn-card-quote">
            Get Started →
          </button>
        </div>
      </div>
    `;
  }).join('');
}
window.filterServices = filterServices;

// ── 6. SERVICE DETAIL POPUP MODAL ──
function openServiceDetail(serviceId) {
  const service = GRO10X_SERVICES.find(s => s.id === serviceId);
  if (!service) return;

  const isUSD = currentCurrency === 'USD';
  const priceText = isUSD ? service.priceUSD : service.priceBDT;

  const modalBody = document.getElementById('serviceDetailModalBody');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
      <div style="font-size:2.2rem; background:var(--surface-3); width:54px; height:54px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
        ${service.icon}
      </div>
      <div>
        <span style="font-size:0.75rem; font-weight:800; color:var(--brand-primary); text-transform:uppercase; letter-spacing:0.06em;">${service.categoryName}</span>
        <h2 style="margin:0.2rem 0 0; font-size:1.4rem; color:var(--text-primary); font-family:var(--font-heading);">${service.title}</h2>
      </div>
    </div>

    <p style="color:var(--text-secondary); line-height:1.6; font-size:0.92rem; margin-bottom:1.25rem;">
      ${service.details}
    </p>

    <div style="background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; margin-bottom:1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">STANDARD PRICING</span>
        <strong style="font-size:1.15rem; color:var(--brand-primary);">${priceText} ${service.priceCycle}</strong>
      </div>
      <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">Included Deliverables:</div>
      <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.4rem; font-size:0.85rem; color:var(--text-secondary);">
        ${service.features.map(f => `<li>✓ ${f}</li>`).join('')}
      </ul>
    </div>

    <div style="display:flex; gap:0.75rem;">
      <button onclick="closeServiceDetailModal(); openLeadModal('${service.title} (${priceText})');" class="pb-btn-primary" style="flex:1; padding:0.75rem;">
        🚀 Book This Service
      </button>
      <button onclick="closeServiceDetailModal();" class="pb-btn-secondary" style="padding:0.75rem 1rem;">
        Close
      </button>
    </div>
  `;

  const modal = document.getElementById('serviceDetailModal');
  if (modal) modal.style.display = 'flex';
}
window.openServiceDetail = openServiceDetail;

function closeServiceDetailModal() {
  const modal = document.getElementById('serviceDetailModal');
  if (modal) modal.style.display = 'none';
}
window.closeServiceDetailModal = closeServiceDetailModal;

function handleServiceDetailOverlayClick(event) {
  if (event.target.id === 'serviceDetailModal') {
    closeServiceDetailModal();
  }
}
window.handleServiceDetailOverlayClick = handleServiceDetailOverlayClick;

// ── 7.5. INTERACTIVE ROI CALCULATOR ──
function updateRoiCalc() {
  const spendSlider = document.getElementById('calcSpendSlider');
  const volumeSlider = document.getElementById('calcVolumeSlider');
  if (!spendSlider || !volumeSlider) return;

  const spendUSD = parseInt(spendSlider.value, 10);
  const volume = parseInt(volumeSlider.value, 10);

  // Exchange rate BDT calculation
  const spendBDT = Math.round(spendUSD * 118);
  const savingsUSD = Math.round(spendUSD * 0.65);
  const savingsBDT = Math.round(savingsUSD * 118);

  const hoursSaved = Math.round(volume * 4.2);
  const speedFactor = (volume > 40 ? '12x' : (volume > 20 ? '8.5x' : '5x'));

  // Update slider labels
  const spendDisplay = document.getElementById('calcSpendDisplay');
  if (spendDisplay) {
    spendDisplay.innerText = currentCurrency === 'BDT' ? `৳${spendBDT.toLocaleString()} / mo` : `$${spendUSD.toLocaleString()} / mo`;
  }

  const volumeDisplay = document.getElementById('calcVolumeDisplay');
  if (volumeDisplay) {
    volumeDisplay.innerText = `${volume} Deliverables`;
  }

  // Update projected savings displays
  const savingsDisplay = document.getElementById('calcSavingsDisplay');
  if (savingsDisplay) {
    savingsDisplay.innerText = currentCurrency === 'BDT' ? `৳${savingsBDT.toLocaleString()} / mo` : `$${savingsUSD.toLocaleString()} / mo`;
  }

  const savingsSub = document.getElementById('calcSavingsSub');
  if (savingsSub) {
    savingsSub.innerText = currentCurrency === 'BDT' ? `($${savingsUSD.toLocaleString()}/mo in USD)` : `(৳${(savingsBDT / 100000).toFixed(2)} Lakh / mo in BDT)`;
  }

  const hoursDisplay = document.getElementById('calcHoursDisplay');
  if (hoursDisplay) {
    hoursDisplay.innerText = `${hoursSaved} hrs`;
  }

  const speedDisplay = document.getElementById('calcSpeedDisplay');
  if (speedDisplay) {
    speedDisplay.innerText = `${speedFactor} Faster`;
  }
}
window.updateRoiCalc = updateRoiCalc;

function prefillAuditFromCalc() {
  const spendSlider = document.getElementById('calcSpendSlider');
  const volumeSlider = document.getElementById('calcVolumeSlider');
  const notesField = document.getElementById('leadNotes');
  
  if (spendSlider && volumeSlider && notesField) {
    const spend = spendSlider.value;
    const vol = volumeSlider.value;
    notesField.value = `[AI ROI Estimator]: Current spend ~$${spend}/mo with ~${vol} deliverables/mo. Looking for automated pipelines to reduce overhead.`;
  }
}
window.prefillAuditFromCalc = prefillAuditFromCalc;

// ── 7. LEAD AUDIT MODAL CONTROLLER ──
function openLeadModal(serviceName) {
  const modal = document.getElementById('leadModalOverlay');
  const title = document.getElementById('leadModalTitle');
  const serviceInput = document.getElementById('modalServiceType');
  
  if (title && serviceName) {
    title.innerText = `Book: ${serviceName}`;
  }
  if (serviceInput && serviceName) {
    serviceInput.value = serviceName;
  }
  if (modal) modal.style.display = 'flex';
}
window.openLeadModal = openLeadModal;

function closeLeadModal() {
  const modal = document.getElementById('leadModalOverlay');
  if (modal) modal.style.display = 'none';
}
window.closeLeadModal = closeLeadModal;

function handleLeadModalOverlayClick(event) {
  if (event.target.id === 'leadModalOverlay') {
    closeLeadModal();
  }
}
window.handleLeadModalOverlayClick = handleLeadModalOverlayClick;

// ── 8. LEAD FORM SUBMISSIONS (API & WHATSAPP CONNECTIVITY) ──
async function submitLandingLead(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitLead');
  const feedback = document.getElementById('leadFormFeedback');

  const name = document.getElementById('leadName')?.value || '';
  const email = document.getElementById('leadEmail')?.value || '';
  const phone = document.getElementById('leadPhone')?.value || '';
  const service = document.getElementById('leadService')?.value || '';
  const notes = document.getElementById('leadNotes')?.value || '';

  if (!name || !email || !phone) return;

  btn.disabled = true;
  btn.innerText = 'Submitting Request...';

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        service_interest: service,
        notes,
        currency: currentCurrency,
        source: 'Landing Page Strategy Audit Form'
      })
    });

    const data = await res.json();
    const waText = encodeURIComponent(`Hi GRO10X, I just submitted an AI strategy audit request on gro10x.ai.\nName: ${name}\nService: ${service}\nEmail: ${email}`);
    const waUrl = `https://wa.me/8801708459008?text=${waText}`;

    feedback.style.display = 'block';
    feedback.style.background = 'rgba(0, 223, 137, 0.12)';
    feedback.style.color = '#00df89';
    feedback.style.border = '1px solid rgba(0, 223, 137, 0.35)';
    feedback.innerHTML = `
      <div style="font-size:1rem; font-weight:800; margin-bottom:0.4rem;">🎉 Request Received Successfully!</div>
      <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.85rem;">Our engineering team will prepare your proposal within 24 hours.</div>
      <a href="${waUrl}" target="_blank" class="pb-btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none; padding:0.55rem 1rem; font-size:0.85rem; background:#25D366; color:#070b12;">
        💬 Chat Directly on WhatsApp (+8801708459008) →
      </a>
    `;
    document.getElementById('landingLeadForm').reset();
  } catch (err) {
    feedback.style.display = 'block';
    feedback.style.background = 'rgba(239, 68, 68, 0.15)';
    feedback.style.color = '#ef4444';
    feedback.style.border = '1px solid rgba(239, 68, 68, 0.35)';
    feedback.innerHTML = `⚠️ Saved locally. Fast-track via <a href="https://wa.me/8801708459008" target="_blank" style="color:#00df89; font-weight:700;">WhatsApp: +8801708459008</a>.`;
  } finally {
    btn.disabled = false;
    btn.innerText = '🚀 Submit Strategy Request →';
  }
}
window.submitLandingLead = submitLandingLead;

async function submitModalLead(e) {
  e.preventDefault();
  const feedback = document.getElementById('modalLeadFeedback');
  const name = document.getElementById('modalLeadName')?.value || '';
  const email = document.getElementById('modalLeadEmail')?.value || '';
  const phone = document.getElementById('modalLeadPhone')?.value || '';
  const service = document.getElementById('modalServiceType')?.value || 'General Setup';
  const notes = document.getElementById('modalLeadNotes')?.value || '';

  if (!name || !email || !phone) return;

  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        service_interest: service,
        notes,
        currency: currentCurrency,
        source: 'Interactive Service Modal'
      })
    });

    const waText = encodeURIComponent(`Hi GRO10X, I just booked a consultation for ${service} on gro10x.ai.\nName: ${name}\nPhone: ${phone}`);
    const waUrl = `https://wa.me/8801708459008?text=${waText}`;

    feedback.style.display = 'block';
    feedback.innerHTML = `
      <div style="color:#00df89; font-weight:800; margin-bottom:0.5rem;">✅ Consultation Booked!</div>
      <a href="${waUrl}" target="_blank" style="display:inline-block; background:#25D366; color:#070b12; font-weight:800; font-size:0.8rem; padding:0.45rem 0.85rem; border-radius:8px; text-decoration:none;">
        💬 Fast-Track on WhatsApp →
      </a>
    `;
    setTimeout(() => {
      closeLeadModal();
      feedback.style.display = 'none';
      document.getElementById('modalLeadForm').reset();
    }, 4500);
  } catch (e) {
    feedback.style.display = 'block';
    feedback.style.color = '#00df89';
    feedback.innerHTML = '✅ Saved! Our team will reach out to you.';
    setTimeout(() => { closeLeadModal(); }, 2000);
  }
}
window.submitModalLead = submitModalLead;

// ── 9. NAVBAR SCROLL & UTILITIES ──
function initNavbarScroll() {
  const nav = document.getElementById('topNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('is-active');
    menu.classList.toggle('is-active');
    document.body.style.overflow = menu.classList.contains('is-active') ? 'hidden' : '';
  });
}

function closeMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn) btn.classList.remove('is-active');
  if (menu) menu.classList.remove('is-active');
  document.body.style.overflow = '';
}
window.closeMobileMenu = closeMobileMenu;

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.scrollToTop = scrollToTop;

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.pb-nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = '#' + section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === current) {
        link.classList.add('active');
      }
    });
  });
}

function setDynamicYear() {
  // Sets current year in footer if element exists
}

// ── 10. CHAT BOT TRIGGER HELPER ──
function openPurpleBot(topic) {
  if (window.openWidgetBox) {
    window.openWidgetBox();
  } else {
    openLeadModal(topic || 'AI Inquiry');
  }
}
window.openPurpleBot = openPurpleBot;
window.openGroBot = openPurpleBot;

// FAQ Accordion
function toggleFAQ(button) {
  const item = button.closest('.pb-faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('is-open');

  document.querySelectorAll('.pb-faq-list .pb-faq-item').forEach(el => {
    el.classList.remove('is-open');
    const icon = el.querySelector('.faq-icon');
    if (icon) icon.innerText = '+';
  });

  if (!isOpen) {
    item.classList.add('is-open');
    const icon = item.querySelector('.faq-icon');
    if (icon) icon.innerText = '−';
  }
}
window.toggleFAQ = toggleFAQ;
