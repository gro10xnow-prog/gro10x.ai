/**
 * scripts/e2e/suites/suite-c-partner/phase-C2-dashboard.js
 * Suite C - Phase C2: Partner Dashboard & Campaign Summary
 * 
 * Tests:
 * 1. Partner Dashboard Boot & Client Welcome Strip
 * 2. Campaign Status & Workspace Information
 * 3. Live Review Room Deliverable Player Container
 * 4. Social Media Post Approvals Section
 * 5. Retainer Invoices Section
 * 6. Submit Campaign Brief Button Presence
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC2(page) {
  const tracker = new TestTracker('Suite C - Phase C2: Partner Dashboard');
  console.log('\n--- 📊 Running Suite C - Phase C2: Dashboard & Campaign Summary ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C2.1', 'Partner Dashboard Boot & Client Welcome Strip', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1200);

    const welcome = await page.evaluate(() => {
      const title = document.getElementById('partnerClientTitle')?.textContent || '';
      const badge = document.getElementById('partnerStatusBadge')?.textContent || '';
      return { title, badge };
    });

    tracker.assert(welcome.title.length > 0, 'Partner client title must be rendered');
    tracker.assert(welcome.badge.length > 0, 'Partner status badge must be rendered');

    await tracker.screenshot(page, 'C2.1_partner_welcome_strip.png');
  });

  await tracker.runStep('C2.2', 'Campaign Status & Workspace Information', async () => {
    const subText = await page.evaluate(() => {
      return document.getElementById('partnerClientSub')?.textContent || '';
    });
    tracker.assert(subText.includes('deliverables') || subText.includes('Campaign') || subText.includes('invoices'), 'Subtitle must describe campaign deliverables');
  });

  await tracker.runStep('C2.3', 'Live Review Room Deliverable Player Container', async () => {
    const hasPlayer = await page.evaluate(() => {
      const grid = document.getElementById('partnerPlayerGrid');
      const video = document.getElementById('partnerVideo');
      const select = document.getElementById('partnerProjectSelect');
      return grid !== null && video !== null && select !== null;
    });

    tracker.assert(hasPlayer, 'Video review player, grid, and project select must be present');
    await tracker.screenshot(page, 'C2.3_partner_player_container.png');
  });

  await tracker.runStep('C2.4', 'Social Media Post Approvals Section', async () => {
    const hasSocialSection = await page.evaluate(() => {
      const badge = document.getElementById('partnerSocialBadge');
      const grid = document.getElementById('partnerSocialGrid');
      return badge !== null && grid !== null;
    });

    tracker.assert(hasSocialSection, 'Social media post approvals container must be rendered');
  });

  await tracker.runStep('C2.5', 'Retainer Invoices Section', async () => {
    const hasInvoices = await page.evaluate(() => {
      const tbody = document.getElementById('partnerInvoicesTbody');
      return tbody !== null;
    });

    tracker.assert(hasInvoices, 'Invoices table body must be rendered');
  });

  await tracker.runStep('C2.6', 'Submit Campaign Brief Button Presence', async () => {
    const hasBriefBtn = await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="openPartnerBriefModal"]');
      return btn !== null;
    });

    tracker.assert(hasBriefBtn, 'Submit Campaign Brief button must be visible');
    await tracker.screenshot(page, 'C2.6_partner_brief_cta.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC2 };
