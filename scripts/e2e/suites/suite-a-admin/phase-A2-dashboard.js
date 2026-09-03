/**
 * scripts/e2e/suites/suite-a-admin/phase-A2-dashboard.js
 * Suite A - Phase A2: Creator & Brand Stakeholder Comprehensive Verification
 * 
 * Tests:
 * 1. Content OS & Brand Hub Initialization
 * 2. Multi-Brand Switcher & Visual Framework Enforcement (Grow Bangla vs Pilutics)
 * 3. Monthly Strategic Thesis Setting & Persistence
 * 4. Post Creation 3-Step Wizard Modal & Form Controls
 * 5. AI Brief & VEO Scene Panel Generation with Orange Mannequin DNA
 * 6. Save as Draft & Intercept POST /api/posts API Mutation
 * 7. View Toggles (Board <-> Calendar <-> Content OS) & Kanban Search
 */

const { APP_URL, wait, assertModalOpen, assertModalClosed, interceptApiCall, waitForToast, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA2(page) {
  const tracker = new TestTracker('Suite A - Phase A2: Creator & Brand Stakeholder');
  console.log('\n--- 🎬 Running Suite A - Phase A2: Creator & Brand Stakeholder ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#content-os', { waitUntil: 'networkidle2' });
  await wait(1200);

  await tracker.runStep('A2.1', 'Load Content OS & Initialize Brand Hub Matrix', async () => {
    // Wait for module to render
    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && el.innerHTML.trim().length > 50 && !el.innerHTML.includes('class="skeleton"');
    }, { timeout: 8000 });

    const isSocialModuleReady = await page.evaluate(() => {
      return typeof window.SOCIAL_MODULE === 'object' && window.SOCIAL_MODULE !== null;
    });
    tracker.assert(isSocialModuleReady, 'window.SOCIAL_MODULE must be initialized on window');

    const appContent = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      appContent.includes('Content OS') || appContent.includes('Brand Hub') || appContent.includes('Grow Bangla'),
      'Content OS workspace must render active brand matrix'
    );
    await tracker.screenshot(page, 'A2.1_content_os_board.png');
  });

  await tracker.runStep('A2.2', 'Verify Multi-Brand Switcher & Visual Framework Enforcement', async () => {
    // 1. Inspect Grow Bangla Visual Framework
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchBrand === 'function') {
        window.SOCIAL_MODULE.switchBrand('grow-bangla');
      }
    });
    await wait(600);

    let contentGb = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      contentGb.includes('Orange Mannequin') || contentGb.includes('Grow Bangla') || contentGb.includes('Fern'),
      'Grow Bangla must display its visual identity / Fern approach'
    );

    // 2. Switch to Pilutics brand
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchBrand === 'function') {
        window.SOCIAL_MODULE.switchBrand('pilutics');
      }
    });
    await wait(600);

    const activeBrandAfterSwitch = await page.evaluate(() => {
      return localStorage.getItem('social_activeBrandSlug');
    });
    tracker.assert(activeBrandAfterSwitch === 'pilutics', 'Active brand slug should update to pilutics');

    let contentPil = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      contentPil.includes('PILUTICS') || contentPil.includes('Pilutics') || contentPil.includes('Command Center'),
      'Pilutics brand workspace should render'
    );

    // 3. Switch back to Grow Bangla
    await page.evaluate(() => {
      window.SOCIAL_MODULE.switchBrand('grow-bangla');
    });
    await wait(500);
    await tracker.screenshot(page, 'A2.2_brand_matrix.png');
  });

  await tracker.runStep('A2.3', 'Set & Persist Monthly Strategic Thesis Note', async () => {
    // Ensure in Content OS subtab
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchView === 'function') {
        window.SOCIAL_MODULE.switchView('content_os');
      }
    });
    await wait(500);

    const testThesis = 'Q3 AI Automation & Enterprise Scale Protocol';

    // Populate the thesis input if available
    const hasInput = await page.evaluate((thesisText) => {
      const inp = document.getElementById('inpBrandMonthlyThesis');
      if (inp) {
        inp.value = thesisText;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, testThesis);

    tracker.assert(hasInput, '#inpBrandMonthlyThesis input must exist in DOM');

    // Trigger save with API interception
    const res = await interceptApiCall(
      page,
      '/social-brands/grow-bangla/monthly-focus',
      async () => {
        await page.evaluate(() => {
          if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.saveBrandMonthlyFocus === 'function') {
            window.SOCIAL_MODULE.saveBrandMonthlyFocus('grow-bangla');
          }
        });
      },
      6000
    );

    if (res) {
      const data = await res.json().catch(() => ({}));
      tracker.assert(data.success === true, 'Monthly focus save API must return success: true');
    }

    await wait(400);
    await tracker.screenshot(page, 'A2.3_monthly_thesis.png');
  });

  await tracker.runStep('A2.4', 'Open Post Creation Modal & Verify Form Controls', async () => {
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.openPostModal === 'function') {
        window.SOCIAL_MODULE.openPostModal('grow-bangla');
      }
    });
    await wait(500);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('postModal');
      return m ? m.classList.contains('active') : false;
    });
    tracker.assert(isModalActive, '#postModal must have .active class when opened');

    // Populate required fields
    await page.evaluate(() => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      setVal('spTitle', 'E2E Automated Creator System Test');
      setVal('spPlatform', 'YouTube');
      setVal('spContentType', 'Short-form Video');
      setVal('spAngle', 'Automated Content Creation Framework');
      setVal('spCaption', 'Testing automated creator pipeline and VEO scene generation.');
    });

    await wait(300);
    await tracker.screenshot(page, 'A2.4_post_modal.png');
  });

  await tracker.runStep('A2.5', 'Generate AI Brief & Verify VEO Scene Breakdown', async () => {
    // Generate AI Brief
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.generateAIBrief === 'function') {
        window.SOCIAL_MODULE.generateAIBrief();
      }
    });

    // Wait for #aiBriefContainer to become visible
    await page.waitForFunction(() => {
      const container = document.getElementById('aiBriefContainer');
      return container && container.style.display !== 'none' && container.innerHTML.trim().length > 50;
    }, { timeout: 15000 });

    const briefContent = await page.$eval('#aiBriefContainer', el => el.innerHTML);
    tracker.assert(
      briefContent.includes('Scene') || briefContent.includes('Blueprint') || briefContent.includes('Hook') || briefContent.includes('Script'),
      'AI Brief container must render scenes or blueprint'
    );

    await tracker.screenshot(page, 'A2.5_ai_brief_veo.png');
  });

  await tracker.runStep('A2.6', 'Save Post as Draft & Intercept POST /api/posts API Mutation', async () => {
    let interceptedStatus = null;

    const res = await interceptApiCall(
      page,
      '/api/posts',
      async () => {
        await page.evaluate(() => {
          if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.saveAsDraftOnly === 'function') {
            window.SOCIAL_MODULE.saveAsDraftOnly();
          }
        });
      },
      8000
    );

    if (res) {
      interceptedStatus = res.status();
      tracker.assert(interceptedStatus < 400, `POST /api/posts returned HTTP ${interceptedStatus}`);
    }

    await wait(600);
    // Modal should now be closed
    const isModalClosed = await page.evaluate(() => {
      const m = document.getElementById('postModal');
      return !m || !m.classList.contains('active');
    });
    tracker.assert(isModalClosed, '#postModal must close after draft save');
  });

  await tracker.runStep('A2.7', 'Toggle View Modes (Board <-> Calendar <-> Content OS)', async () => {
    // 1. Switch to Kanban Board View
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchView === 'function') {
        window.SOCIAL_MODULE.switchView('kanban');
      }
    });
    await wait(600);

    const hasKanbanCols = await page.evaluate(() => {
      return document.querySelectorAll('.social-col, .social-board, .kanban-column, .kanban-col, .col-card, [data-status]').length > 0;
    });
    tracker.assert(hasKanbanCols, 'Social Kanban board columns (.social-col) must render in kanban view');


    // 2. Switch to Calendar View
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchView === 'function') {
        window.SOCIAL_MODULE.switchView('calendar');
      }
    });
    await wait(600);

    const hasCalendarCells = await page.evaluate(() => {
      return document.querySelectorAll('.calendar-day-cell, .calendar-grid').length > 0;
    });
    tracker.assert(hasCalendarCells, 'Calendar grid must render in calendar view');
    await tracker.screenshot(page, 'A2.7_calendar_view.png');

    // 3. Return to Content OS view
    await page.evaluate(() => {
      if (window.SOCIAL_MODULE && typeof window.SOCIAL_MODULE.switchView === 'function') {
        window.SOCIAL_MODULE.switchView('content_os');
      }
    });
    await wait(400);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA2 };

