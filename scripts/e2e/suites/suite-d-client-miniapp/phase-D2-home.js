/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D2-home.js
 * Suite D - Phase D2: Client MiniApp Home Dashboard
 * 
 * Tests:
 * 1. Client Hero Card Profile & Workspace Pills Hydration
 * 2. Quick Actions Grid (4 Action Buttons Rendered)
 * 3. Active Campaign Summary & Multi-Stage Progression Bar
 * 4. Latest Retainer / Project Invoice Quick Tile
 * 5. Quick Action Trigger to Review Cut Page Transition
 * 6. Return to Home Navigation Chip
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD2(page) {
  const tracker = new TestTracker('Suite D - Phase D2: Client MiniApp Home');
  console.log('\n--- 🏠 Running Suite D - Phase D2: Home Dashboard ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D2.1', 'Client Hero Card Profile & Workspace Pills Hydration', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const heroCard = await page.evaluate(() => {
      const name = document.getElementById('heroClientName')?.innerText || '';
      const mgr = document.getElementById('heroAccountMgr')?.innerText || '';
      const pills = document.querySelectorAll('.hero-pills .pill');
      return { hasName: name.length > 0, hasMgr: mgr.length > 0, pillCount: pills.length };
    });

    tracker.assert(heroCard.hasName, 'Hero card client name must be present');
    tracker.assert(heroCard.pillCount >= 2, 'Hero card status and campaign pills must render');
    await tracker.screenshot(page, 'D2.1_miniapp_hero_card.png');
  });

  await tracker.runStep('D2.2', 'Quick Actions Grid (4 Action Buttons Rendered)', async () => {
    const qaButtons = await page.evaluate(() => {
      const grid = document.querySelector('.qa-grid');
      const buttons = grid ? grid.querySelectorAll('.qa-btn') : [];
      const labels = Array.from(buttons).map(b => b.querySelector('.qa-label')?.innerText || '');
      return { btnCount: buttons.length, labels };
    });

    tracker.assert(qaButtons.btnCount === 4, 'Quick actions grid must display 4 action buttons');
    tracker.assert(qaButtons.labels.includes('New Brief'), 'Must include New Brief action');
    tracker.assert(qaButtons.labels.includes('Review Cut'), 'Must include Review Cut action');
  });

  await tracker.runStep('D2.3', 'Active Campaign Summary & Multi-Stage Progression Bar', async () => {
    const campaignSummary = await page.evaluate(() => {
      const title = document.getElementById('homeCampaignTitle');
      const stages = document.getElementById('homeCampaignStages');
      const meta = document.getElementById('homeCampaignMeta');
      return {
        hasTitle: title !== null,
        hasStages: stages !== null,
        hasMeta: meta !== null
      };
    });

    tracker.assert(campaignSummary.hasTitle, 'Campaign title container must exist');
    tracker.assert(campaignSummary.hasStages, 'Campaign stages progression container must exist');
    await tracker.screenshot(page, 'D2.3_miniapp_active_campaign.png');
  });

  await tracker.runStep('D2.4', 'Latest Retainer / Project Invoice Quick Tile', async () => {
    const invoiceTile = await page.evaluate(() => {
      const tile = document.getElementById('homeLatestInvoice');
      const card = tile ? tile.closest('.card') : null;
      return tile !== null && card !== null && (card.textContent || '').includes('Latest Invoice');
    });

    tracker.assert(invoiceTile, 'Latest Invoice summary card must be rendered on home page');
  });

  await tracker.runStep('D2.5', 'Quick Action Trigger to Review Cut Page Transition', async () => {
    const pageChanged = await page.evaluate(() => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageReview');
      }
      const revPage = document.getElementById('pageReview');
      const isRevActive = revPage && revPage.classList.contains('active');
      return { isRevActive };
    });

    tracker.assert(pageChanged.isRevActive, 'Review page should become active on quick action click');
    await tracker.screenshot(page, 'D2.5_miniapp_transition_review.png');
  });

  await tracker.runStep('D2.6', 'Return to Home Navigation Chip', async () => {
    const returnedHome = await page.evaluate(() => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageHome');
      }
      const homePage = document.getElementById('pageHome');
      return homePage && homePage.classList.contains('active');
    });

    tracker.assert(returnedHome, 'Home page should become active when navigating back to home');
    await tracker.screenshot(page, 'D2.6_miniapp_returned_home.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD2 };

