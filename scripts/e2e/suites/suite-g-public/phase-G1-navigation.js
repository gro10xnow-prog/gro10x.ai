/**
 * scripts/e2e/suites/suite-g-public/phase-G1-navigation.js
 * Suite G - Phase G1: Public Site Navigation, Hero & Responsive Layout
 * 
 * Tests:
 * G1.1: Load Public Landing Page and Verify Hero & Title Metadata
 * G1.2: Brand Identity & Navbar Branding (GRO10X AI Agency)
 * G1.3: Desktop Navigation Anchor Links Integrity
 * G1.4: Client Portal Link & Primary Action Triggers
 * G1.5: Live Currency Switcher (USD <-> BDT) in Hero CTA
 * G1.6: Mobile Viewport (375x812) & Hamburger Drawer Menu
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseG1(page) {
  const tracker = new TestTracker('Suite G - Phase G1: Public Navigation & Hero');
  console.log('\n--- 🚀 Running Suite G - Phase G1: Navigation & Hero ---');

  const LANDING_URL = `${BASE_URL}/index.html`;

  await tracker.runStep('G1.1', 'Load Public Landing Page and Verify Hero & Title Metadata', async () => {
    await page.goto(LANDING_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const title = await page.title();
    tracker.assert(title.includes('GRO10X'), 'Page title should include GRO10X');

    const heroTitle = await page.$eval('.pb-hero-title', el => el.textContent.trim());
    tracker.assert(heroTitle.includes('Grow') && heroTitle.includes('10x Smarter'), 'Hero title should match "Grow 10x Smarter"');

    const badge = await page.$eval('.pb-hero-badge', el => el.textContent.trim());
    tracker.assert(badge.includes('MULTI-ENGINE') || badge.includes('GROWTH AGENCY'), 'Hero badge missing or incorrect');

    await tracker.screenshot(page, 'G1.1_public_landing_hero.png');
  });

  await tracker.runStep('G1.2', 'Brand Identity & Navbar Branding (GRO10X AI Agency)', async () => {
    const brandTitle = await page.$eval('#topNav .pb-brand-title', el => el.textContent.trim());
    tracker.assertEqual(brandTitle, 'GRO10X', 'Navbar brand title must be GRO10X');

    const brandSub = await page.$eval('#topNav .pb-brand-sub', el => el.textContent.trim());
    tracker.assert(brandSub.includes('AI AGENCY'), 'Navbar brand sub-label should be AI AGENCY');

    const badgeIcon = await page.$eval('#topNav .pb-logo-badge', el => el.textContent.trim());
    tracker.assert(badgeIcon.includes('⚡'), 'Navbar logo badge should display ⚡');
  });

  await tracker.runStep('G1.3', 'Desktop Navigation Anchor Links Integrity', async () => {
    const links = await page.$$eval('#desktopNavLinks a', els => els.map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    })));

    tracker.assert(links.length >= 5, `Expected at least 5 nav links, found ${links.length}`);
    const hrefs = links.map(l => l.href);
    tracker.assert(hrefs.includes('#capabilities'), 'Missing #capabilities anchor');
    tracker.assert(hrefs.includes('#services'), 'Missing #services anchor');
    tracker.assert(hrefs.includes('#roadmap'), 'Missing #roadmap anchor');
    tracker.assert(hrefs.includes('#pricing'), 'Missing #pricing anchor');
    tracker.assert(hrefs.includes('#contact'), 'Missing #contact anchor');
  });

  await tracker.runStep('G1.4', 'Client Portal Link & Primary Action Triggers', async () => {
    const portalLink = await page.$eval('#topNav .pb-btn-portal', el => el.getAttribute('href'));
    tracker.assert(portalLink === '/auth' || portalLink.includes('auth'), 'Portal link should point to /auth');

    // Click "Book AI Setup" in header and verify lead modal opens
    const bookBtn = await page.$eval('#topNav button.pb-btn-primary', el => el.textContent.trim());
    tracker.assert(bookBtn.includes('Book AI Setup'), 'Header action button should be Book AI Setup');

    await page.click('#topNav button.pb-btn-primary');
    await wait(400);

    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('leadModalOverlay');
      return modal && modal.style.display !== 'none';
    });
    tracker.assert(isModalOpen, 'Lead modal should open when clicking Book AI Setup button');

    // Close modal
    await page.click('.pb-modal-close');
    await wait(300);

    const isModalClosed = await page.evaluate(() => {
      const modal = document.getElementById('leadModalOverlay');
      return modal && modal.style.display === 'none';
    });
    tracker.assert(isModalClosed, 'Lead modal should close when clicking close button');
  });

  await tracker.runStep('G1.5', 'Live Currency Switcher (USD <-> BDT) in Hero CTA', async () => {
    // Check initial hero CTA currency
    let ctaPrice = await page.$eval('.pb-hero-cta-row button.pb-btn-primary', el => el.textContent.trim());
    tracker.assert(ctaPrice.includes('$1,500'), 'Hero CTA price should initially be in USD ($1,500)');

    // Switch to BDT
    await page.click('#btnCurrBDT');
    await wait(300);

    ctaPrice = await page.$eval('.pb-hero-cta-row button.pb-btn-primary', el => el.textContent.trim());
    tracker.assert(ctaPrice.includes('175,000') || ctaPrice.includes('৳'), 'Hero CTA price should switch to BDT (৳175,000), got ' + ctaPrice);

    // Switch back to USD
    await page.click('#btnCurrUSD');
    await wait(300);

    ctaPrice = await page.$eval('.pb-hero-cta-row button.pb-btn-primary', el => el.textContent.trim());
    tracker.assert(ctaPrice.includes('$1,500'), 'Hero CTA price should revert to USD ($1,500)');

    await tracker.screenshot(page, 'G1.5_hero_currency_switched.png');
  });

  await tracker.runStep('G1.6', 'Mobile Viewport (375x812) & Hamburger Drawer Menu', async () => {
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await wait(400);

    // Verify hamburger button is visible
    const isHamburgerVisible = await page.$eval('#mobileMenuBtn', el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    tracker.assert(isHamburgerVisible, 'Mobile hamburger button should be visible');

    // Click hamburger button to open drawer
    await page.click('#mobileMenuBtn');
    await wait(400);

    const isMenuOpen = await page.$eval('#mobileMenu', el => el.classList.contains('is-active'));
    tracker.assert(isMenuOpen, 'Mobile drawer menu should have class "is-active" when opened');

    await tracker.screenshot(page, 'G1.6_mobile_drawer_open.png');

    // Click close / link to dismiss
    await page.evaluate(() => window.closeMobileMenu());
    await wait(300);

    const isMenuClosed = await page.$eval('#mobileMenu', el => !el.classList.contains('is-active'));
    tracker.assert(isMenuClosed, 'Mobile drawer menu should close');

    // Reset viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseG1 };
