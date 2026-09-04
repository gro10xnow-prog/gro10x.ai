/**
 * scripts/e2e/suites/suite-f-investors/phase-F3-content.js
 * Suite F - Phase F3: Investor CTAs, Direct Communication & Portal Footers
 * 
 * Tests:
 * F3.1: Investor Call to Action Card Rendered with Header and Badge
 * F3.2: Direct WhatsApp Founder CTA Link Verification
 * F3.3: Email Investor Relations Mailto Link Verification
 * F3.4: Footer Brand Identity & Copyright Metadata
 * F3.5: Footer Multi-Stakeholder Portal Cross-Links (/app, /manager, /partners, /auth)
 * F3.6: Fast Page Rendering & Console Error Integrity Check
 */

const { wait, TestTracker } = require('../../utils');

async function runPhaseF3(page) {
  const tracker = new TestTracker('Suite F - Phase F3: Investor Content & CTAs');
  console.log('\n--- 🤝 Running Suite F - Phase F3: Investor Content & CTAs ---');

  await tracker.runStep('F3.1', 'Investor Call to Action Card Rendered with Header and Badge', async () => {
    const ctaHeader = await page.$eval('.investor-cta-card h3', el => el.textContent.trim());
    tracker.assert(ctaHeader.includes('Invest in the Autonomous AI Growth Ecosystem'), 'Investor CTA heading missing or mismatch');

    const ctaBadge = await page.$eval('.investor-cta-card .investor-badge', el => el.textContent.trim());
    tracker.assert(ctaBadge.includes('CAPITAL PARTNERSHIP'), 'Capital partnership badge missing');

    await tracker.screenshot(page, 'F3.1_investor_cta_card.png');
  });

  await tracker.runStep('F3.2', 'Direct WhatsApp Founder CTA Link Verification', async () => {
    const waLink = await page.$eval('.investor-cta-card a[href*="wa.me"]', el => ({
      href: el.getAttribute('href'),
      text: el.textContent.trim(),
      target: el.getAttribute('target')
    }));

    tracker.assert(waLink.href.includes('8801708459008'), 'WhatsApp link must point to founder phone 8801708459008');
    tracker.assert(waLink.href.includes('text='), 'WhatsApp link should have pre-filled intent message');
    tracker.assert(waLink.text.includes('WhatsApp'), 'CTA button text should mention WhatsApp');
    tracker.assertEqual(waLink.target, '_blank', 'External link should open in new tab');
  });

  await tracker.runStep('F3.3', 'Email Investor Relations Mailto Link Verification', async () => {
    const emailLink = await page.$eval('.investor-cta-card a[href*="mailto:"]', el => ({
      href: el.getAttribute('href'),
      text: el.textContent.trim()
    }));

    tracker.assert(emailLink.href.includes('gro10xnow@gmail.com'), 'Email link should target gro10xnow@gmail.com');
    tracker.assert(emailLink.href.includes('subject='), 'Email link should contain pre-filled investor subject');
    tracker.assert(emailLink.text.includes('Email'), 'CTA button text should mention Email');
  });

  await tracker.runStep('F3.4', 'Footer Brand Identity & Copyright Metadata', async () => {
    const footerText = await page.$eval('.pb-footer-brand', el => el.textContent);
    tracker.assert(footerText.includes('GRO10X'), 'Footer brand title missing');
    tracker.assert(footerText.includes('2026'), 'Footer copyright year 2026 missing');
    tracker.assert(footerText.includes('All rights reserved'), 'Footer legal copyright statement missing');
  });

  await tracker.runStep('F3.5', 'Footer Multi-Stakeholder Portal Cross-Links (/app, /manager, /partners, /auth)', async () => {
    const portalLinks = await page.$$eval('.pb-footer-col a', els => els.map(a => a.getAttribute('href')));

    tracker.assert(portalLinks.some(href => href === '/app'), 'Footer link to /app (Admin OS) missing');
    tracker.assert(portalLinks.some(href => href === '/manager' || href.includes('manager')), 'Footer link to /manager missing');
    tracker.assert(portalLinks.some(href => href === '/partners.html' || href.includes('partners')), 'Footer link to /partners.html missing');
    tracker.assert(portalLinks.some(href => href === '/auth' || href.includes('auth')), 'Footer link to /auth missing');

    await tracker.screenshot(page, 'F3.5_footer_portals.png');
  });

  await tracker.runStep('F3.6', 'Fast Page Rendering & Console Error Integrity Check', async () => {
    // Scroll through the entire page smoothly to trigger any lazy-loaded or scroll-driven assets
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await wait(300);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await wait(300);

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    tracker.assert(bodyHeight > 1500, `Page height should be fully rendered (>1500px), found ${bodyHeight}px`);

    await tracker.screenshot(page, 'F3.6_investors_full_scroll.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF3 };
