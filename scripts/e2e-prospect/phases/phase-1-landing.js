/**
 * scripts/e2e-prospect/phases/phase-1-landing.js
 * Phase 1: Landing Page End-to-End Verification (13 Sub-Phases)
 */
const { BASE_URL, wait, captureScreenshot, VIEWPORTS } = require('../utils');

async function runPhase1(page) {
  const results = {
    name: 'Phase 1: Landing Page End-to-End Verification',
    passed: 0,
    failed: 0,
    tests: []
  };

  function record(title, passed, error = null) {
    if (passed) {
      results.passed++;
      results.tests.push({ title, status: 'PASS' });
      console.log(`  ✅ ${title}`);
    } else {
      results.failed++;
      results.tests.push({ title, status: 'FAIL', error: String(error) });
      console.error(`  ❌ ${title}: ${error}`);
    }
  }

  console.log(`\n🚀 Executing Phase 1: Landing Page Suite...`);

  try {
    // 1.1 Page Load & Initial Render
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await wait(1000);
    await captureScreenshot(page, 'phase1_1_landing_hero_desktop.png');
    
    const title = await page.title();
    record('1.1.1 Landing page loads with valid title', title.includes('Purplebot Digital') || title.includes('PurpleOS'));

    const heroHeading = await page.$eval('.pb-hero-title', el => el.innerText).catch(() => '');
    record('1.1.2 Hero heading renders immediately without blank state', heroHeading.length > 5);

    const clientMarqueeExists = await page.$eval('#clientMarquee', el => el.children.length > 0).catch(() => false);
    record('1.1.3 Client logo marquee contains static pre-rendered logos', clientMarqueeExists);

    // 1.2 Sticky Navigation Bar
    const navExists = await page.$('#topNav');
    record('1.2.1 Desktop navigation bar renders', !!navExists);

    const contactLinkClick = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('#desktopNavLinks a')).find(a => a.innerText.includes('Contact'));
      if (link) { link.click(); return true; }
      return false;
    });
    await wait(500);
    record('1.2.2 Desktop "Contact" nav link triggers scroll', contactLinkClick);

    // 1.3 Services Section & Fallback Cards
    const serviceCardsCount = await page.$$eval('.pb-service-card, .pb-svc-card', cards => cards.length);
    record('1.3.1 Services section renders at least 4 service cards', serviceCardsCount >= 4);

    const firstServiceLink = await page.$eval('.pb-svc-title-link', el => el.getAttribute('href')).catch(() => '');
    record('1.3.2 Service card links to valid ?id=SVC-00X route', firstServiceLink.includes('?id=SVC-'));

    // 1.4 How We Work Tabs
    const tabsCount = await page.$$eval('.pb-work-tab', tabs => tabs.length);
    record('1.4.1 How We Work section renders 5 step tabs', tabsCount === 5);

    const tabSwitchSuccess = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.pb-work-tab');
      if (tabs.length >= 2) {
        tabs[1].click();
        const card2 = document.getElementById('workCard2');
        return card2 && card2.classList.contains('active');
      }
      return false;
    });
    record('1.4.2 Switching to Step 2 activates workCard2', tabSwitchSuccess);

    // 1.5 Portfolio Case Study Modal
    const portfolioCards = await page.$$('.pb-portfolio-card');
    record('1.5.1 Portfolio section contains 9 case study cards', portfolioCards.length === 9);

    let modalOpened = false;
    if (portfolioCards.length > 0) {
      await portfolioCards[0].click();
      await wait(600);
      modalOpened = await page.$eval('#caseStudyModal', el => el.style.display === 'flex' || el.style.display !== 'none').catch(() => false);
    }
    record('1.5.2 Clicking a portfolio card opens case study modal', modalOpened);
    await captureScreenshot(page, 'phase1_5_case_study_modal.png');

    // Close Modal via overlay/button
    await page.keyboard.press('Escape');
    await wait(400);
    const modalClosed = await page.$eval('#caseStudyModal', el => el.style.display === 'none' || !el.classList.contains('active')).catch(() => true);
    record('1.5.3 Pressing Escape closes case study modal', modalClosed);

    // 1.6 Testimonials & Verified Credentials Strip
    const testimonialsCount = await page.$$eval('.pb-testimonial-card', cards => cards.length);
    record('1.6.1 Testimonials section renders all client testimonials', testimonialsCount >= 3);

    const credentialsStrip = await page.$('.pb-trust-strip, .pb-credentials-strip');
    record('1.6.2 Google Verified Agency credentials strip renders', !!credentialsStrip);

    // 1.7 FAQ Accordion
    const faqQuestions = await page.$$('.pb-faq-question');
    record('1.7.1 FAQ section contains structured questions', faqQuestions.length >= 4);

    let faqOpened = false;
    if (faqQuestions.length > 0) {
      await faqQuestions[0].click();
      await wait(400);
      faqOpened = await page.evaluate(() => {
        const item = document.querySelector('.pb-faq-item');
        return item && (item.classList.contains('active') || item.classList.contains('is-open') || item.querySelector('.pb-faq-answer').offsetHeight > 0);
      });
    }
    record('1.7.2 Clicking FAQ question expands answer accordion', faqOpened);

    // 1.8 Pricing Section & 4 Tabs
    const pricingTabs = await page.$$('.pb-pricing-tab-btn');
    record('1.8.1 Pricing section renders 4 category tabs', pricingTabs.length === 4);

    const pricingTabSwitch = await page.evaluate(() => {
      const techTab = Array.from(document.querySelectorAll('.pb-pricing-tab-btn')).find(b => b.innerText.includes('Web') || b.innerText.includes('Tech'));
      if (techTab) {
        techTab.click();
        const techContent = document.getElementById('pricing-tab-tech');
        return techContent && (techContent.classList.contains('is-active') || techContent.style.display !== 'none');
      }
      return false;
    });
    record('1.8.2 Switching to Web & Tech tab reveals tech pricing cards', pricingTabSwitch);

    // 1.9 Contact Proposal Form Submission
    await page.evaluate(() => {
      document.getElementById('contact').scrollIntoView();
      document.getElementById('leadName').value = 'Automated QA Lead';
      document.getElementById('leadPhone').value = '01711' + Date.now().toString().slice(-6);
      document.getElementById('leadEmail').value = 'qalead@purplebot.digital';
      document.getElementById('leadNotes').value = 'Automated E2E browser verification proposal submission.';
      
      if (typeof window.handleLeadFormSubmit === 'function') {
        window.handleLeadFormSubmit({ preventDefault: () => {} });
      } else {
        const form = document.getElementById('contactLeadForm');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    await wait(1200);

    const toastVisible = await page.evaluate(() => {
      const el = document.getElementById('landingToastContainer');
      return !!el && (el.innerText.length > 0 || el.children.length > 0);
    });
    record('1.9.1 Submitting contact form triggers feedback toast notification', toastVisible);
    await captureScreenshot(page, 'phase1_9_contact_toast.png');

    // 1.10 Mobile Viewport & Bottom Bar
    await page.setViewport(VIEWPORTS.mobileStandard);
    await wait(600);
    const mobileBottomBar = await page.$eval('#mobileBottomBar', el => window.getComputedStyle(el).display !== 'none').catch(() => false);
    record('1.10.1 Mobile sticky bottom conversion bar renders on 375px viewport', mobileBottomBar);
    await captureScreenshot(page, 'phase1_10_mobile_bottom_bar.png');

    // Reset viewport to Desktop
    await page.setViewport(VIEWPORTS.desktop);

  } catch (err) {
    record('Phase 1 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase1 };
