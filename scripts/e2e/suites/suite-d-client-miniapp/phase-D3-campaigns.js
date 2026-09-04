/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D3-campaigns.js
 * Suite D - Phase D3: Campaign Schedule & Stages
 * 
 * Tests:
 * 1. Navigate to Campaign Schedule Page & Active Tab Highlight
 * 2. Campaign Progress Section & List Container Presence
 * 3. Campaign Item Card Anatomy (Title, Due Date, Team)
 * 4. Multi-Stage Visual Pipeline Rendering (Brief, Shoot, Edit, Review, Done)
 * 5. Active Production Stage Badge Highlight
 * 6. Dynamic Campaign List Re-Fetch Flow (loadCampaigns)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD3(page) {
  const tracker = new TestTracker('Suite D - Phase D3: Campaign Progress');
  console.log('\n--- 📋 Running Suite D - Phase D3: Campaign Schedule ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D3.1', 'Navigate to Campaign Schedule Page & Active Tab Highlight', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navSuccess = await page.evaluate(async () => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageCampaign');
      }
      if (typeof window.loadCampaigns === 'function') {
        await window.loadCampaigns();
      }
      const pageEl = document.getElementById('pageCampaign');
      const navBtn = document.getElementById('navCampaign');
      return {
        isPageActive: pageEl && pageEl.classList.contains('active'),
        isNavActive: navBtn && navBtn.classList.contains('active')
      };
    });

    tracker.assert(navSuccess.isPageActive, 'Campaign page should become active');
    tracker.assert(navSuccess.isNavActive, 'Campaign nav button should be highlighted active');
    await tracker.screenshot(page, 'D3.1_miniapp_campaign_page.png');
  });

  await tracker.runStep('D3.2', 'Campaign Progress Section & List Container Presence', async () => {
    const listExists = await page.evaluate(() => {
      const list = document.getElementById('campaignList');
      return list !== null;
    });

    tracker.assert(listExists, 'campaignList container element must exist in DOM');
  });

  await tracker.runStep('D3.3', 'Campaign Item Card Anatomy (Title, Due Date, Team)', async () => {
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('#campaignList .campaign-card') || document.querySelector('#campaignList > div');
      if (!card) return null;
      const text = card.textContent || '';
      return {
        hasText: text.length > 20,
        hasDue: text.includes('Due:'),
        hasTeam: text.includes('Team:')
      };
    });

    tracker.assert(cardInfo !== null, 'At least one campaign card must render');
    tracker.assert(cardInfo.hasDue, 'Campaign card must indicate due date');
    tracker.assert(cardInfo.hasTeam, 'Campaign card must indicate assigned production team');
    await tracker.screenshot(page, 'D3.3_miniapp_campaign_card.png');
  });

  await tracker.runStep('D3.4', 'Multi-Stage Visual Pipeline Rendering (Brief, Shoot, Edit, Review, Done)', async () => {
    const stageItems = await page.evaluate(() => {
      const stagesContainer = document.querySelector('#campaignList .campaign-stages');
      const stages = stagesContainer ? stagesContainer.querySelectorAll('.cs-step, .stage-step, div') : [];
      return { hasStages: stagesContainer !== null, count: stages.length };
    });

    tracker.assert(stageItems.hasStages, 'Campaign visual stages progression bar must render');
    tracker.assert(stageItems.count > 0, 'Stages must contain milestone step elements');
  });

  await tracker.runStep('D3.5', 'Active Production Stage Badge Highlight', async () => {
    const hasActiveStage = await page.evaluate(() => {
      const activeStep = document.querySelector('#campaignList .cs-step.active, #campaignList .cs-step.done, #campaignList [class*="active"], #campaignList [class*="done"]');
      return activeStep !== null;
    });

    tracker.assert(hasActiveStage, 'Visual progress pipeline must highlight active or completed stages');
  });

  await tracker.runStep('D3.6', 'Dynamic Campaign List Re-Fetch Flow (loadCampaigns)', async () => {
    const refetched = await page.evaluate(async () => {
      if (typeof window.loadCampaigns === 'function') {
        await window.loadCampaigns();
      }
      const list = document.getElementById('campaignList');
      return list && list.children.length > 0;
    });

    tracker.assert(refetched, 'Calling loadCampaigns should re-render campaign list successfully');
    await tracker.screenshot(page, 'D3.6_miniapp_campaigns_refetched.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD3 };
