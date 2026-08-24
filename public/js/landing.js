// 🔮 PURPLEBOT DIGITAL — PUBLIC LANDING PAGE SCRIPT (v0.7.5.1)

document.addEventListener('DOMContentLoaded', () => {
  captureUTM();
  trackPageView();
  fetchLandingServices();
  fetchCMSContent();
  initNavbarScroll();
  initStatCounters();
  initMobileMenu();
  initScrollTop();
  initScrollSpy();
  initScrollReveal();
  setDynamicYear();
});

// DYNAMIC YEAR
function setDynamicYear() {
  const el = document.getElementById('currentYear');
  if (el) {
    el.innerText = new Date().getFullYear();
  }
}

// MOBILE MENU TOGGLE
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

// SCROLL TO TOP & SCROLLSPY
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

// SCROLL REVEAL INTERSECTION OBSERVER
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}


// UTM CAPTURE & SESSION STORAGE
function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utmObj = {};
    let found = false;

    utmKeys.forEach(key => {
      if (params.has(key)) {
        utmObj[key] = params.get(key);
        found = true;
      }
    });

    if (found) {
      sessionStorage.setItem('utm', JSON.stringify(utmObj));
    }
  } catch (err) {}
}

// CLICK & PAGE EVENT TRACKING
function trackPageView() {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        label: window.location.pathname,
        referrer: document.referrer,
        utm: sessionStorage.getItem('utm') || ''
      })
    }).catch(e => {});
  } catch (err) {}
}

function trackClick(label) {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'cta_click',
        label: label || 'Button Click',
        referrer: document.referrer
      })
    }).catch(e => {});
  } catch (err) {}
}

function formatPriceToBDT(priceStr) {
  if (!priceStr) return '৳75,000 / month';
  if (priceStr.includes('৳')) return priceStr;
  
  if (priceStr.includes('1,500') || priceStr.includes('1500')) return '৳75,000 / month';
  if (priceStr.includes('800')) return '৳45,000 / 10 Reels';
  if (priceStr.includes('3,500') || priceStr.includes('3500')) return '৳180,000 / project';
  if (priceStr.includes('1,200') || priceStr.includes('1200')) return '৳65,000 / project';
  if (priceStr.includes('750')) return '৳45,000 / month';
  if (priceStr.includes('1,000') || priceStr.includes('1000')) return '৳75,000 / month';
  if (priceStr.includes('1,250') || priceStr.includes('1250')) return '৳120,000 / month';

  return priceStr.replace(/\$/g, '৳');
}

function getCanonicalServiceId(s, idx) {
  if (s && s.id && String(s.id).toUpperCase().startsWith('SVC-')) {
    return String(s.id).toUpperCase();
  }
  const cat = (s.category || '').toLowerCase();
  const title = (s.title || '').toLowerCase();
  if (title.includes('digital') || cat.includes('growth') || cat.includes('marketing')) return 'SVC-001';
  if (title.includes('short-form') || title.includes('reels')) return 'SVC-002';
  if (title.includes('tvc') || title.includes('commercial') || title.includes('film')) return 'SVC-003';
  if (cat.includes('brand') || title.includes('brand') || title.includes('graphics')) return 'SVC-004';
  if (cat.includes('dev') || cat.includes('web') || title.includes('website')) return 'SVC-005';
  if (cat.includes('tech') || title.includes('tech') || title.includes('software')) return 'SVC-006';
  
  const fallback = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004', 'SVC-005', 'SVC-006'];
  return fallback[idx % fallback.length];
}

const FALLBACK_PUBLIC_SERVICES = [
  {
    id: 'SVC-001',
    category: 'Digital Marketing',
    title: 'Digital Marketing & Growth',
    description: '360° social media management, data-backed paid ad campaigns (Meta & Google), and community engagement designed to scale brand reach.',
    price: '৳75,000 / month'
  },
  {
    id: 'SVC-002',
    category: 'Video Production',
    title: 'Short-Form Video Reels & TikToks',
    description: 'High-converting viral reels, TikToks, and YouTube Shorts. Complete with storyboard, studio shoot, fast color grading, and dynamic captions.',
    price: '৳45,000 / 10 Reels'
  },
  {
    id: 'SVC-003',
    category: 'Video Production',
    title: 'Commercial TVC & Brand Films',
    description: 'Cinematic 4K brand commercials, product hero videos, and corporate documentaries with high-end lighting, voiceover, and sound design.',
    price: '৳180,000 / project'
  },
  {
    id: 'SVC-004',
    category: 'Branding & Graphics',
    title: 'Brand Identity & Visual Positioning',
    description: 'Comprehensive branding packages: logo suites, color psychology, 50-page brand guidelines, stationery, packaging, and digital asset kits.',
    price: '৳65,000 / project'
  },
  {
    id: 'SVC-005',
    category: 'Website & Tech',
    title: 'Modern Web & UI/UX Development',
    description: 'High-speed, SEO-optimized business websites, landing pages, and interactive web applications built on modern web stacks with sub-2s load time.',
    price: '৳120,000 / project'
  },
  {
    id: 'SVC-006',
    category: 'Custom Tech',
    title: 'Custom Tech, Telegram Bots & AI Systems',
    description: 'Proprietary enterprise tooling, automated Telegram bot workflows, CRM integrations, and generative AI-assisted business solutions.',
    price: 'Custom Scope'
  }
];

// FETCH & RENDER PUBLIC SERVICES
async function fetchLandingServices() {
  const container = document.getElementById('landingServicesGrid');
  if (!container) return;

  const categoryIcons = {
    'Digital Marketing': '📱',
    'Video Production': '🎬',
    'Video Editing & Animation': '🎬',
    'Branding & Graphics': '🎨',
    'Branding': '🎨',
    'Website & Tech': '💻',
    'Tech & Web': '💻',
    'Custom Tech': '⚡'
  };

  function renderServices(servicesList) {
    container.innerHTML = servicesList.map((s, index) => {
      const canonicalId = getCanonicalServiceId(s, index);
      return `
        <div class="pb-service-card">
          <div>
            <div class="pb-svc-icon">${categoryIcons[s.category] || '⚡'}</div>
            <div class="pb-svc-badge-row">
              <span class="pb-svc-category">${s.category}</span>
              <span class="pb-svc-price">${formatPriceToBDT(s.price)}</span>
            </div>
            <h3><a href="/service-detail.html?id=${canonicalId}" class="pb-svc-title-link">${s.title}</a></h3>
            <p>${s.description}</p>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.25rem; width:100%;">
            <a href="/service-detail.html?id=${canonicalId}" class="pb-svc-details-link">
              🔍 View Full Details & Features →
            </a>
            <button onclick="openPurpleBot('${s.title}')" class="pb-btn-svc">
              Get Custom Quote →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/cms', { signal: controller.signal });
    clearTimeout(timeoutId);

    const cmsData = await res.json();
    const services = (cmsData.content && cmsData.content.services) || cmsData.services || [];
    const publicServices = (services || []).filter(s => s.public !== false && s.is_public !== false);

    if (publicServices.length > 0) {
      renderServices(publicServices);
      return;
    }
  } catch (err) {
    console.warn('CMS services fetch timed out or failed, falling back to static catalogue:', err.message);
  }

  // Fallback to static catalogue
  renderServices(FALLBACK_PUBLIC_SERVICES);
}

// FAQ ACCORDION INTERACTION
function toggleFAQ(button) {
  const item = button.closest('.pb-faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('is-open');

  // Accordion behavior: close others
  document.querySelectorAll('.pb-faq-item').forEach(el => {
    el.classList.remove('is-open');
    const qBtn = el.querySelector('.pb-faq-question');
    if (qBtn) qBtn.setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    item.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
  }
}
window.toggleFAQ = toggleFAQ;

// PRICING CATEGORY TABS
function switchPricingTab(tabKey, button) {
  document.querySelectorAll('.pb-pricing-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  if (button) {
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
  }

  document.querySelectorAll('.pb-pricing-tab-content').forEach(content => {
    content.classList.remove('is-active');
  });
  const activeContent = document.getElementById(`pricing-tab-${tabKey}`);
  if (activeContent) {
    activeContent.classList.add('is-active');
  }
  trackClick(`Pricing Tab: ${tabKey}`);
}
window.switchPricingTab = switchPricingTab;

function selectServiceCategory(category) {
  const inquirySec = document.getElementById('services');
  if (inquirySec) {
    inquirySec.scrollIntoView({ behavior: 'smooth' });
  }
}

// NAVBAR SCROLL EFFECT
function initNavbarScroll() {
  const nav = document.getElementById('topNav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

// STAT COUNTER ANIMATION
function initStatCounters() {
  const statElements = document.querySelectorAll('.pb-stat-num');
  if (!statElements || statElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target') || '0', 10);
        if (target > 0) {
          animateCount(el, target);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statElements.forEach(el => observer.observe(el));
}

function animateCount(el, target) {
  let current = 0;
  const increment = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    
    if (target === 8) el.innerText = current + '+';
    else if (target === 100) el.innerText = current + '+';
    else if (target === 20000) el.innerText = current.toLocaleString() + '+';
    else if (target === 10) el.innerText = current + 'M+';
    else el.innerText = current + '+';
  }, 40);
}

// NEWSLETTER SUBMISSION
async function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('newsEmail');
  if (!input || !input.value) return;

  const email = input.value.trim();

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Newsletter Subscriber',
        contactPerson: 'Subscriber',
        contactEmail: email,
        service: 'Monthly Newsletter',
        source: 'Landing Page Newsletter'
      })
    });

    const data = await res.json();
    if (data.success) {
      showLandingToast(`🎉 Thank you! ${email} has been subscribed to the Purplebot Digital Newsletter.`, 'success');
      input.value = '';
      trackClick('Newsletter Subscribed');
    }
  } catch (err) {
    showLandingToast('⚠️ Could not subscribe right now. Please try again later or message us on WhatsApp!', 'error');
  }
}

// CONTACT PROPOSAL FORM SUBMISSION
async function handleLeadFormSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('leadName');
  const phoneInput = document.getElementById('leadPhone');
  const emailInput = document.getElementById('leadEmail');
  const serviceInput = document.getElementById('leadService');
  const notesInput = document.getElementById('leadNotes');
  const submitBtn = document.getElementById('leadSubmitBtn');

  if (!nameInput || !phoneInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput ? emailInput.value.trim() : '';
  const service = serviceInput ? serviceInput.value : 'General Proposal Request';
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!name || !phone) {
    showLandingToast('⚠️ Please provide your Name and WhatsApp/Phone number.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = '⏳ Submitting Request...';
  }

  try {
    const utmRaw = sessionStorage.getItem('utm');
    const utm = utmRaw ? JSON.parse(utmRaw) : {};

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: name + ' (Direct Web Form)',
        contactPerson: name,
        contactEmail: email,
        phone: phone,
        service: service,
        notes: notes,
        source: utm.utm_source ? `UTM: ${utm.utm_source}` : 'Landing Page Contact Section Form',
        utm_source: utm.utm_source || '',
        utm_medium: utm.utm_medium || '',
        utm_campaign: utm.utm_campaign || ''
      })
    });

    const data = await res.json();
    if (data.isDuplicate) {
      showLandingToast(`ℹ️ We already have your proposal request on file, ${name}! Our account director will follow up with you within 2 business hours.`, 'success');
      nameInput.value = '';
      phoneInput.value = '';
      if (emailInput) emailInput.value = '';
      if (serviceInput) serviceInput.selectedIndex = 0;
      if (notesInput) notesInput.value = '';
      trackClick('Proposal Request Form Submitted (Duplicate)');
    } else if (data.success || data.id) {
      const emailNote = (email && email.includes('@')) ? ' A confirmation email has been sent.' : '';
      showLandingToast(`🎉 Thank you ${name}! Your proposal request for "${service}" has been logged.${emailNote} Our account director will WhatsApp you within 2 hours.`, 'success');
      nameInput.value = '';
      phoneInput.value = '';
      if (emailInput) emailInput.value = '';
      if (serviceInput) serviceInput.selectedIndex = 0;
      if (notesInput) notesInput.value = '';
      trackClick('Proposal Request Form Submitted');
    } else {
      showLandingToast('⚠️ There was an issue submitting your proposal request. Please WhatsApp us directly at +88 01711 019550.', 'error');
    }
  } catch (err) {
    showLandingToast('⚠️ Form submission error. Please contact us via WhatsApp at +88 01711 019550.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = '🚀 Submit Proposal Request →';
    }
  }
}

window.handleLeadFormSubmit = handleLeadFormSubmit;

function showLandingToast(message, type = 'success') {
  let container = document.getElementById('landingToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'landingToastContainer';
    container.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; z-index: 99999; display: flex; flex-direction: column; gap: 0.5rem;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = 'background: #0f172a; border: 1px solid #7c3aed; color: #fff; padding: 0.85rem 1.25rem; border-radius: 12px; font-size: 0.9rem; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3); font-family: var(--font-family); display: flex; justify-content: space-between; align-items: center; gap: 1rem;';
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; font-size:1.1rem; padding:0;">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

// FETCH & RENDER PUBLIC CMS CONTENT
async function fetchCMSContent() {
  try {
    const res = await fetch('/api/cms');
    const cms = await res.json();
    if (!cms) return;

    // 1. Client Marquee
    if (cms.clientMarquee && cms.clientMarquee.length > 0) {
      const marqueeContainer = document.getElementById('clientMarquee');
      if (marqueeContainer) {
        const clientLogosMap = {
          'UCB Bank': '/images/clients/ucb.webp',
          'Chillox': '/images/clients/chillox.webp',
          'Chillox Burgers': '/images/clients/chillox.webp',
          'BAT Global': '/images/clients/bat.webp',
          'LG Electronics': '/images/clients/lg.webp',
          'Taptap Send': '/images/clients/taptap.webp',
          'Mortein': '/images/clients/mortein.webp',
          'Harpic': '/images/clients/harpic.webp',
          'Yatai Japanese': '/images/clients/yatai.webp'
        };

        const activeBrands = cms.clientMarquee.filter(b => !b.toLowerCase().includes('fortress'));
        const pillsHtml = activeBrands.map(brand => `
          <div class="pb-client-pill">
            ${clientLogosMap[brand] ? `<img src="${clientLogosMap[brand]}" alt="${brand}" class="pb-client-logo-img">` : ''}
            <span>${brand}</span>
          </div>
        `).join('');

        marqueeContainer.innerHTML = pillsHtml + pillsHtml;
      }
    }

    // 2. Portfolio Showcase
    if (cms.portfolioShowcase && cms.portfolioShowcase.length > 0) {
      const portGrid = document.querySelector('.pb-portfolio-grid');
      if (portGrid) {
        portGrid.innerHTML = cms.portfolioShowcase.map(p => `
          <div class="pb-portfolio-card">
            <div class="pb-portfolio-thumb" style="background-image: url('${p.image}');">
              <span class="pb-category-tag">${p.category}</span>
            </div>
            <div class="pb-portfolio-info">
              <h3>${p.title}</h3>
              <p>${p.subtitle}</p>
              <div class="pb-portfolio-metric">${p.metric}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Pricing Packages
    if (cms.pricingPackages && cms.pricingPackages.length > 0) {
      const priceGrid = document.querySelector('.pb-pricing-grid');
      if (priceGrid) {
        priceGrid.innerHTML = cms.pricingPackages.map(pkg => `
          <div class="pb-pricing-card ${pkg.featured ? 'pb-featured-plan' : ''}">
            ${pkg.featured ? '<div class="pb-featured-tag">MOST POPULAR</div>' : ''}
            <div class="pb-price-header">
              <span class="pb-plan-badge">${pkg.tier || 'PACKAGE'}</span>
              <h3>${pkg.name}</h3>
              <div class="pb-price-tag">${pkg.price} <span>${pkg.period || '/ month'}</span></div>
            </div>
            <ul class="pb-price-features">
              ${(pkg.features || []).map(f => `<li>✓ ${f}</li>`).join('')}
            </ul>
            <button onclick="openPurpleBot('${pkg.name} (${pkg.price})')" class="pb-btn-plan ${pkg.featured ? 'pb-btn-plan-featured' : ''}">
              Select ${pkg.name}
            </button>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading public CMS content:', err);
  }
}

// INTERACTIVE WORKFLOW STEP SWITCHER (HOW WE WORK SECTION)
function switchWorkStep(stepNum) {
  const tabs = document.querySelectorAll('.pb-work-tab');
  const cards = document.querySelectorAll('.pb-work-card');

  tabs.forEach((tab, index) => {
    if (index + 1 === stepNum) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  cards.forEach((card, index) => {
    if (index + 1 === stepNum) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// INTERACTIVE PORTFOLIO CASE STUDY CONTROLLER
const PORTFOLIO_CASE_STUDIES = {
  lg: {
    client: 'LG Electronics Bangladesh',
    category: 'Electronics & Tech • 3+ Years Retainer',
    heroImg: '/images/portfolio/lg.webp',
    metric: '📱 500,000+ Social Community Growth',
    challenge: 'LG required a unified digital agency partner to elevate social brand affinity, launch new consumer electronic lineups, and manage customer community interactions with sub-15 minute response times.',
    solution: 'Purplebot deployed an integrated 360 retainer comprising monthly product launch reels, high-end motion graphic ads, Facebook/Instagram page moderation, and high-ROI conversion funnels.',
    deliverables: ['16x Monthly Content Items', '4K Product Commercial Reels', 'Sub-15min DM/Comment Response SLA', 'Meta Pixel Performance Campaigns'],
    results: 'Grew organic Facebook & Instagram following to 500,000+ active followers with consistent 4.2% engagement rate.'
  },
  intercontinental: {
    client: 'InterContinental Dhaka',
    category: 'Luxury Hospitality • 2+ Years Creative Retainer',
    heroImg: '/images/portfolio/intercontinental.webp',
    metric: '🏨 2+ Years Full Content Support',
    challenge: 'Showcase luxury dining experiences, corporate event venues, and seasonal promotions while maintaining five-star international brand guidelines.',
    solution: 'Designed multi-tier social calendars, cinematic 4K video walkthroughs, and VIP dining event motion graphics reviewed collaboratively via PurpleOS.',
    deliverables: ['Cinematic 4K Venue Walkthroughs', 'Seasonal Dining Social Campaigns', 'Executive Print & Digital Menus', 'VIP Event Coverage'],
    results: 'Supported 120+ sold-out luxury dining promotions and sustained premium brand positioning across Bangladesh.'
  },
  ucb: {
    client: 'United Commercial Bank (UCB)',
    category: 'Corporate Financial & Banking',
    heroImg: '/images/portfolio/ucb.webp',
    metric: '💼 100% On-Time Board Delivery',
    challenge: 'Produce a comprehensive, broadcast-ready Annual Financial Report video and executive milestone highlights for board stakeholders on strict regulatory deadlines.',
    solution: 'Executed full scriptwriting, motion infographic visualization of corporate balance sheets, and bilingual executive voiceover.',
    deliverables: ['Annual Financial Video Master', 'Infographic Motion Graphics', 'Corporate Board Presentations', 'Bilingual Voiceover Suite'],
    results: 'Delivered 100% on-time with zero revisions required on board presentation day.'
  },
  chillox: {
    client: 'Chillox Burger Chain',
    category: 'Food & FMCG Retainer',
    heroImg: '/images/portfolio/chillox.webp',
    metric: '🍔 2.4M+ Organic Short-Form Views',
    challenge: 'Drive youth foot traffic to 15+ branches across Dhaka and build viral engagement with burger releases.',
    solution: 'Produced weekly viral TikTok/Reels batches featuring rapid ASMR audio cuts, mouth-watering macro close-ups, and influencer collabs.',
    deliverables: ['8x Monthly Viral Video Reels', 'ASMR Audio & Dynamic Captions', 'Branch Opening Campaign Suites', 'Meta Ad Retargeting'],
    results: 'Surpassed 2.4M organic video views with a +38% documented surge in weekend store visits.'
  },
  mortein: {
    client: 'Mortein Protection (Reckitt)',
    category: 'Health & Home Care FMCG',
    heroImg: '/images/portfolio/mortein.webp',
    metric: '🛡️ 1.8M Campaign Reach',
    challenge: 'Communicate seasonal monsoon pest protection and Dengue prevention awareness across mass demographic segments.',
    solution: 'Crafted dynamic 3D mosquito animation, high-impact digital TVCs, and targeted vernacular social messaging.',
    deliverables: ['Digital Commercial TVC (15s & 30s)', '3D CGI Product Visuals', 'Dengue Awareness Carousel Series', 'Meta Video Ads Engine'],
    results: 'Achieved 1.8M verified reach with 74% video completion rate on Meta and YouTube.'
  },
  harpic: {
    client: 'Harpic Hygiene (Reckitt)',
    category: 'Home Care & FMCG Awareness',
    heroImg: '/images/portfolio/harpic.webp',
    metric: '✨ 3.2M National Impressions',
    challenge: 'Educate urban households on deep sanitation and product efficacy with high-clarity motion graphics.',
    solution: 'Produced an educational animated awareness series combining relatable household scenarios and scientific cleaning visuals.',
    deliverables: ['National Awareness Video Series', 'Multi-Language Explainer Motion Graphics', 'Digital Display Ad Kits', 'Social Distribution Plan'],
    results: 'Delivered 3.2M impressions and reinforced Harpic as the #1 household sanitation authority.'
  },
  bat: {
    client: 'BAT Global',
    category: 'Corporate Enterprise Motion Production',
    heroImg: '/images/portfolio/bat.webp',
    metric: '⚡ Executive Asset Delivery',
    challenge: 'Execute internal corporate event motion graphics, award opener stings, and confidential leadership video packages.',
    solution: 'Dispatched dedicated senior motion designers under strict NDA workflows via PurpleOS secure asset pipelines.',
    deliverables: ['Event Opener 3D Motion Stings', 'Leadership Milestone Videos', 'Audio Mastering & SFX', 'Confidential Cloud Review Access'],
    results: 'Executed 12 consecutive enterprise events with zero operational hitches.'
  },
  taptap: {
    client: 'Taptap Send Remittance App',
    category: 'Fintech & Cross-Border Mobile',
    heroImg: '/images/portfolio/taptap.webp',
    metric: '💸 +45% Verified App Installs',
    challenge: 'Acquire cross-border remittance senders across UK, EU, and USA sending money to Bangladesh bank accounts and mobile wallets.',
    solution: 'Deployed high-converting vernacular video ads, social proof testimonials from diaspora creators, and performance ad retargeting.',
    deliverables: ['Diaspora Creator Video Ads', 'App Store Creative Optimizations', 'Meta & TikTok Performance Campaigns', 'Real-Time ROAS Telemetry'],
    results: 'Increased app installs by +45% while reducing cost-per-acquisition (CPA) by 28%.'
  },
  yatai: {
    client: 'Yatai Japanese Dining',
    category: 'Dining & Restaurant Launch',
    heroImg: '/images/portfolio/yatai.webp',
    metric: '🍣 850k Local Foodie Reach',
    challenge: 'Launch a premium authentic Japanese dining spot in Dhaka and establish immediate buzz among food enthusiasts.',
    solution: 'Shot authentic sushi preparation reels, ambiance moodfilms, and coordinated top foodie creator launch visits.',
    deliverables: ['Launch Moodfilms & Reels', 'Foodie Creator Coordination', 'Google Maps & Local SEO Setup', 'Instagram Page Aesthetic Kit'],
    results: 'Generated 850k local reach within 30 days and sustained full weekend table bookings.'
  }
};

function openCaseStudy(id) {
  const cs = PORTFOLIO_CASE_STUDIES[id];
  const modal = document.getElementById('caseStudyModal');
  const container = document.getElementById('caseStudyModalContent');
  if (!cs || !modal || !container) return;

  container.innerHTML = `
    <div style="margin-bottom:1.25rem;">
      <span style="font-size:0.75rem; font-weight:700; color:#c084fc; text-transform:uppercase; letter-spacing:0.05em;">${cs.category}</span>
      <h2 style="font-size:1.6rem; color:#fff; margin:0.35rem 0 0.5rem; font-weight:800;">${cs.client}</h2>
      <div style="display:inline-block; background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); border-radius:999px; padding:0.3rem 0.85rem; font-size:0.85rem; font-weight:700;">
        ${cs.metric}
      </div>
    </div>

    <div style="border-radius:14px; overflow:hidden; margin-bottom:1.5rem; border:1px solid rgba(255,255,255,0.1);">
      <img src="${cs.heroImg}" alt="${cs.client}" style="width:100%; max-height:280px; object-fit:cover; display:block;">
    </div>

    <div style="display:flex; flex-direction:column; gap:1rem; font-size:0.9rem; line-height:1.65; color:#cbd5e1; margin-bottom:1.75rem;">
      <div>
        <strong style="color:#fff; display:block; margin-bottom:0.25rem;">🎯 The Challenge:</strong>
        <p style="margin:0;">${cs.challenge}</p>
      </div>
      <div>
        <strong style="color:#fff; display:block; margin-bottom:0.25rem;">💡 Our Solution:</strong>
        <p style="margin:0;">${cs.solution}</p>
      </div>
      <div>
        <strong style="color:#fff; display:block; margin-bottom:0.4rem;">📦 Deliverables Executed:</strong>
        <ul style="margin:0; padding-left:1.25rem; display:flex; flex-direction:column; gap:0.35rem;">
          ${cs.deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
      <div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.25); border-radius:12px; padding:0.9rem;">
        <strong style="color:#c084fc; display:block; margin-bottom:0.2rem;">📈 Verified Impact:</strong>
        <p style="margin:0; color:#f8fafc; font-weight:600;">${cs.results}</p>
      </div>
    </div>

    <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
      <button onclick="closeCaseStudyModal(); openPurpleBot('${cs.client} Case Study Inquiry');" class="pb-btn-primary" style="flex:1;">
        🚀 Request Similar Campaign for Your Brand →
      </button>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCaseStudyModal() {
  const modal = document.getElementById('caseStudyModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function handleCaseStudyOverlayClick(event) {
  if (event.target && event.target.id === 'caseStudyModal') {
    closeCaseStudyModal();
  }
}

