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
    fetch('/api/track', {
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
    fetch('/api/track', {
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

// FETCH & RENDER PUBLIC SERVICES
async function fetchLandingServices() {
  const container = document.getElementById('landingServicesGrid');
  if (!container) return;

  try {
    const res = await fetch('/api/services');
    const services = await res.json();

    if (!services || services.length === 0) return;

    const publicServices = services.filter(s => s.public !== false);
    if (publicServices.length === 0) return;

    const categoryIcons = {
      'Digital Marketing': '📱',
      'Video Production': '🎬',
      'Video Editing & Animation': '🎬',
      'Branding & Graphics': '🎨',
      'Branding': '🎨',
      'Website & Tech': '💻',
      'Tech & Web': '💻'
    };

    container.innerHTML = publicServices.map(s => `
      <div class="pb-service-card">
        <div>
          <div class="pb-svc-icon">${categoryIcons[s.category] || '⚡'}</div>
          <div class="pb-svc-badge-row">
            <span class="pb-svc-category">${s.category}</span>
            <span class="pb-svc-price">${s.price}</span>
          </div>
          <h3><a href="/service-detail.html?id=${s.id}" class="pb-svc-title-link">${s.title}</a></h3>
          <p>${s.description}</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.25rem; width:100%;">
          <a href="/service-detail.html?id=${s.id}" class="pb-svc-details-link">
            🔍 View Full Details & Features →
          </a>
          <button onclick="openPurpleBot('${s.title}')" class="pb-btn-svc">
            Get Custom Quote →
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error fetching services:', err);
  }
}

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
    showLandingToast('🎉 Thank you for subscribing to Purplebot Digital!', 'success');
    input.value = '';
  }
}

// CONTACT PROPOSAL FORM SUBMISSION
async function handleLeadFormSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('leadName');
  const phoneInput = document.getElementById('leadPhone');
  const serviceInput = document.getElementById('leadService');
  const notesInput = document.getElementById('leadNotes');
  const submitBtn = document.getElementById('leadSubmitBtn');

  if (!nameInput || !phoneInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
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
        phone: phone,
        service: service,
        notes: notes ? `${notes} | UTM: ${JSON.stringify(utm)}` : `UTM: ${JSON.stringify(utm)}`,
        source: 'Landing Page Contact Section Form'
      })
    });

    const data = await res.json();
    if (data.success || data.id) {
      showLandingToast(`🎉 Thank you ${name}! Your proposal request for "${service}" has been logged. Our account director will WhatsApp you within 2 hours.`, 'success');
      nameInput.value = '';
      phoneInput.value = '';
      if (serviceInput) serviceInput.selectedIndex = 0;
      if (notesInput) notesInput.value = '';
      trackClick('Proposal Request Form Submitted');
    } else {
      showLandingToast('⚠️ There was an issue submitting your proposal request. Please WhatsApp us directly at +88 01711 019550.', 'error');
    }
  } catch (err) {
    showLandingToast(`🎉 Thank you ${name}! Your request has been recorded. Our team will contact you shortly!`, 'success');
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
  toast.style.cssText = 'background: #0f172a; border: 1px solid #7c3aed; color: #fff; padding: 0.85rem 1.25rem; border-radius: 12px; font-size: 0.9rem; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3); font-family: var(--font-family);';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// FETCH & RENDER PUBLIC CMS CONTENT
async function fetchCMSContent() {
  try {
    const res = await fetch('/api/public/content');
    const data = await res.json();
    if (!data.success || !data.content) return;

    const cms = data.content;

    // 1. Client Marquee
    if (cms.clientMarquee && cms.clientMarquee.length > 0) {
      const marqueeContainer = document.getElementById('clientMarquee');
      if (marqueeContainer) {
        const clientLogosMap = {
          'UCB Bank': '/images/clients/ucb.png',
          'Chillox': '/images/clients/chillox.png',
          'Chillox Burgers': '/images/clients/chillox.png',
          'BAT Global': '/images/clients/bat.png',
          'LG Electronics': '/images/clients/lg.png',
          'Taptap Send': '/images/clients/taptap.png',
          'Mortein': '/images/clients/mortein.png',
          'Harpic': '/images/clients/harpic.png',
          'Yatai Japanese': '/images/clients/yatai.png'
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
    if (cms.portfolio && cms.portfolio.length > 0) {
      const portGrid = document.querySelector('.pb-portfolio-grid');
      if (portGrid) {
        portGrid.innerHTML = cms.portfolio.map(p => `
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
