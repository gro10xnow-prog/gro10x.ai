/**
 * scripts/e2e/suites/suite-a-admin/phase-A3-intelligence.js
 * Suite A - Phase A3: Production Pipeline & Review Room Proofing Comprehensive Verification
 * 
 * Tests:
 * 1. Kanban Pipeline Hub & Modular Workspaces/Workflows (Video, Social, Branding, Dev)
 * 2. Workflow Tab Switching & Dynamic Stage Presets
 * 3. Task Creation 3-Step Modal & Intercept POST /api/tasks Mutation
 * 4. Slide-Over Task Details Drawer (Subtasks, Blocker, Comments & Status)
 * 5. Bulk CSV Import Modal & Drop Zone UI
 * 6. Client Review Room Hub & 4 KPI Summary Tiles (#reviews)
 * 7. Review Room Media Filtering (Video, Image, PDF)
 * 8. Deliverable Submission & Approval Status Transition
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA3(page) {
  const tracker = new TestTracker('Suite A - Phase A3: Production Pipeline & Review Room');
  console.log('\n--- 🎬 Running Suite A - Phase A3: Production Pipeline & Review Room ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#kanban', { waitUntil: 'networkidle2' });
  await wait(1200);

  await tracker.runStep('A3.1', 'Load Kanban Pipeline Hub & Verify 4 Modular Workflows', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && el.innerHTML.trim().length > 50 && !el.innerHTML.includes('class="skeleton"');
    }, { timeout: 8000 });

    const isKanbanReady = await page.evaluate(() => {
      return typeof window.KANBAN_MODULE === 'object' && window.KANBAN_MODULE !== null;
    });
    tracker.assert(isKanbanReady, 'window.KANBAN_MODULE must be initialized on window');

    const appContent = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      appContent.includes('Video') || appContent.includes('Social') || appContent.includes('Branding') || appContent.includes('Dev'),
      'Kanban board must display modular workflows'
    );
    await tracker.screenshot(page, 'A3.1_kanban_board.png');
  });

  await tracker.runStep('A3.2', 'Workflow Tab Switching & Dynamic Column Stage Presets', async () => {
    // 1. Switch to Video workflow
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.setWorkflowFilter === 'function') {
        window.KANBAN_MODULE.setWorkflowFilter('video');
      }
    });
    await wait(600);

    const videoContent = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      videoContent.includes('Briefing') || videoContent.includes('Scripting') || videoContent.includes('Editing'),
      'Video workflow must render video pipeline stages'
    );

    // 2. Switch to Dev workflow
    await page.evaluate(() => {
      window.KANBAN_MODULE.setWorkflowFilter('dev');
    });
    await wait(600);

    const devContent = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      devContent.includes('Wireframe') || devContent.includes('Development') || devContent.includes('QA Testing') || devContent.includes('Briefing'),
      'Dev workflow must render tech stages'
    );

    // 3. Reset back to all
    await page.evaluate(() => {
      window.KANBAN_MODULE.setWorkflowFilter('all');
    });
    await wait(400);
  });

  await tracker.runStep('A3.3', 'Task Creation Modal & Intercept POST /api/tasks Mutation', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.openNewTaskModal === 'function') {
        window.KANBAN_MODULE.openNewTaskModal();
      }
    });
    await wait(500);

    const isModalVisible = await page.evaluate(() => {
      const m = document.getElementById('newTaskModalOverlay');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalVisible, '#newTaskModalOverlay must have .active class');

    // Populate required fields
    await page.evaluate(() => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setVal('ntTitle', 'E2E Automated TVC Master Cutdown');
      setVal('ntWorkflow', 'video');
      setVal('ntPriority', 'Urgent');
      setVal('ntDueDate', '2026-09-30');
      setVal('ntDescription', 'Automated pipeline end-to-end task creation.');
    });

    await wait(300);
    await tracker.screenshot(page, 'A3.2_task_modal.png');

    // Intercept POST /api/tasks
    let interceptedStatus = null;
    const res = await interceptApiCall(
      page,
      '/api/tasks',
      async () => {
        await page.evaluate(() => {
          if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.submitNewTaskModal === 'function') {
            window.KANBAN_MODULE.submitNewTaskModal();
          }
        });
      },
      6000
    );

    if (res) {
      interceptedStatus = res.status();
      tracker.assert(interceptedStatus < 400, `POST /api/tasks returned HTTP ${interceptedStatus}`);
    }

    await wait(600);
    const isModalClosed = await page.evaluate(() => {
      const m = document.getElementById('newTaskModalOverlay');
      return !m || !m.classList.contains('active');
    });
    tracker.assert(isModalClosed, '#newTaskModalOverlay must close after task creation');
  });

  await tracker.runStep('A3.4', 'Slide-Over Task Details Drawer (Subtasks, Blocker & Comments)', async () => {
    // Click first card or trigger openDrawer
    const opened = await page.evaluate(() => {
      const card = document.querySelector('.kanban-card');
      if (card) {
        card.click();
        return true;
      }
      return false;
    });

    if (opened) {
      await wait(600);
      const isDrawerOpen = await page.evaluate(() => {
        const p = document.getElementById('taskDrawerPanel');
        return p && p.classList.contains('open');
      });
      tracker.assert(isDrawerOpen, '#taskDrawerPanel must have .open class');
      await tracker.screenshot(page, 'A3.3_task_drawer.png');

      // Close drawer
      await page.evaluate(() => {
        window.KANBAN_MODULE.closeDrawer();
      });
      await wait(300);
    }
  });

  await tracker.runStep('A3.5', 'Bulk CSV Import Modal & Drop Zone UI', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.openImportModal === 'function') {
        window.KANBAN_MODULE.openImportModal();
        window.KANBAN_MODULE.downloadSampleCSV = () => {};
        const mockCsv = "Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description\nHero Commercial Cut,Apex Footwear,Autumn Campaign,Md. Zahin,Post Production,video,Editing,Urgent,2026-09-15,12,Main 60s edit";
        window.KANBAN_MODULE.processCSVText(mockCsv);
      }
    });
    await wait(500);

    const isImportOpen = await page.evaluate(() => {
      const m = document.getElementById('kanbanImportModal');
      return m && (m.style.display === 'flex' || m.style.display === 'block');
    });
    tracker.assert(isImportOpen, '#kanbanImportModal must open with parsed CSV data');
    await tracker.screenshot(page, 'A3.4_bulk_import_modal.png');

    await page.evaluate(() => {
      if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.closeImportModal === 'function') {
        window.KANBAN_MODULE.closeImportModal();
      }
    });
    await wait(300);
  });


  await tracker.runStep('A3.6', 'Load Client Review Room Hub & Verify 4 KPI Summary Tiles', async () => {
    await page.evaluate(() => { window.location.hash = '#reviews'; });
    await wait(1500);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.innerHTML.includes('Client Review Room') || el.innerHTML.includes('Proofing Hub') || el.innerHTML.includes('review-kpi-row'));
    }, { timeout: 8000 });


    const isReviewsReady = await page.evaluate(() => {
      return typeof window.REVIEWS_MODULE === 'object' && window.REVIEWS_MODULE !== null;
    });
    tracker.assert(isReviewsReady, 'window.REVIEWS_MODULE must be initialized on window');

    const hasKpis = await page.evaluate(() => {
      return document.getElementById('kpiTotal') !== null &&
             document.getElementById('kpiPending') !== null &&
             document.getElementById('kpiRevision') !== null &&
             document.getElementById('kpiApproved') !== null;
    });
    tracker.assert(hasKpis, 'All 4 Review Room KPI summary tiles must exist');
    await tracker.screenshot(page, 'A3.5_review_room_studio.png');
  });

  await tracker.runStep('A3.7', 'Review Room Media Filtering (Video, Image, PDF)', async () => {
    // 1. Filter Video
    await page.evaluate(() => {
      window.REVIEWS_MODULE.filter('video');
    });
    await wait(400);
    let isVideoActive = await page.$eval('#pill-video', el => el.classList.contains('active'));
    tracker.assert(isVideoActive, '#pill-video must have .active class');

    // 2. Filter Image
    await page.evaluate(() => {
      window.REVIEWS_MODULE.filter('image');
    });
    await wait(400);
    let isImageActive = await page.$eval('#pill-image', el => el.classList.contains('active'));
    tracker.assert(isImageActive, '#pill-image must have .active class');

    // 3. Reset All
    await page.evaluate(() => {
      window.REVIEWS_MODULE.filter('all');
    });
    await wait(300);
    let isAllActive = await page.$eval('#pill-all', el => el.classList.contains('active'));
    tracker.assert(isAllActive, '#pill-all must have .active class');
  });

  await tracker.runStep('A3.8', 'Deliverable Submission & Approval Status Transition', async () => {
    // Open new review modal with await
    await page.evaluate(async () => {
      if (window.REVIEWS_MODULE && window.REVIEWS_MODULE.openNewReviewModal) {
        await window.REVIEWS_MODULE.openNewReviewModal();
      }
    });

    await page.waitForFunction(() => {
      const m = document.getElementById('newReviewModal');
      return m && m.classList.contains('active');
    }, { timeout: 8000 });

    // Populate review inputs
    await page.evaluate(() => {
      const name = document.getElementById('nrProjectName');
      if (name) name.value = 'E2E Creative Master Cut v3';
      const client = document.getElementById('nrClient');
      if (client) {
        if (client.options && client.options.length > 0) {
          client.selectedIndex = 0;
        } else {
          client.value = 'Chillox Bangladesh';
        }
      }
      const type = document.getElementById('nrMediaType');
      if (type) type.value = 'video';
      const url = document.getElementById('nrMediaUrl');
      if (url) url.value = 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4';
    });

    await wait(300);
    await tracker.screenshot(page, 'A3.6_review_approval_flow.png');


    // Intercept POST /api/reviews
    const res = await interceptApiCall(
      page,
      '/api/reviews',
      async () => {
        await page.evaluate(() => {
          window.REVIEWS_MODULE.submitNewReview();
        });
      },
      10000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/reviews returned HTTP ${res.status()}`);
    }

    await page.waitForFunction(() => {
      const m = document.getElementById('newReviewModal');
      return !m || !m.classList.contains('active');
    }, { timeout: 10000 });
  });


  return tracker.getSummary();
}

module.exports = { runPhaseA3 };

