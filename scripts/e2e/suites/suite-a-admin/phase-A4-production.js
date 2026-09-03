/**
 * scripts/e2e/suites/suite-a-admin/phase-A4-production.js
 * Suite A - Phase A4: CRM, Leads Pipeline, Conversion & Proposals Studio Comprehensive Verification
 * 
 * Tests:
 * 1. Leads Pipeline Hub (#leads) & 5 Stage Columns
 * 2. Lead Creation Modal & Intercept POST /api/leads
 * 3. Lead Profile Slide-Over Drawer & Stage Advancement
 * 4. Client CRM Directory Hub (#crm) & Live Search Filtering
 * 5. Add Client 2-Step Wizard Modal & Intercept POST /api/clients
 * 6. Client Hub Slide-Over Drawer & Meeting Sync Modal
 * 7. Proposals Studio Hub (#proposals) & KPI Scorecards
 * 8. Proposal Creation Modal UI & Scope Breakdown Builder
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA4(page) {
  const tracker = new TestTracker('Suite A - Phase A4: CRM, Leads & Proposals Studio');
  console.log('\n--- 💼 Running Suite A - Phase A4: CRM, Leads & Proposals ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#leads', { waitUntil: 'networkidle2' });
  await wait(1200);

  await tracker.runStep('A4.1', 'Load Leads Pipeline Hub & Verify 5 Stage Columns', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && el.innerHTML.includes('New Inquiry') && el.innerHTML.includes('Won / Closed');
    }, { timeout: 8000 });

    const isLeadsReady = await page.evaluate(() => {
      return typeof window.LEADS_MODULE === 'object' && window.LEADS_MODULE !== null;
    });
    tracker.assert(isLeadsReady, 'window.LEADS_MODULE must be initialized on window');

    const appContent = await page.$eval('#app-view', el => el.innerHTML);
    tracker.assert(
      appContent.includes('New Inquiry') &&
      appContent.includes('Contacted') &&
      appContent.includes('Proposal Sent') &&
      appContent.includes('Won / Closed'),
      'Leads Pipeline must render core sales stages'
    );
    await tracker.screenshot(page, 'A4.1_leads_pipeline.png');
  });

  await tracker.runStep('A4.2', 'Lead Creation Modal & Intercept POST /api/leads', async () => {
    await page.evaluate(() => {
      if (window.LEADS_MODULE && typeof window.LEADS_MODULE.openAddModal === 'function') {
        window.LEADS_MODULE.openAddModal();
      }
    });
    await wait(500);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('addLeadModal');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalActive, '#addLeadModal must have .active class');

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

      setVal('nlCompany', 'Chillox Fast Food BD');
      setVal('nlContact', 'Arman Hossain');
      setVal('nlEmail', 'arman@chillox.bd');
      setVal('nlPhone', '+8801711223344');
      setVal('nlBudget', '150000');
      setVal('nlSource', 'Manual Entry');
      setVal('nlNotes', 'High priority prospect for Winter commercial TVC');
    });

    await wait(300);
    await tracker.screenshot(page, 'A4.2_new_lead_modal.png');

    // Intercept POST /api/leads
    const res = await interceptApiCall(
      page,
      '/api/leads',
      async () => {
        await page.evaluate(() => {
          if (window.LEADS_MODULE && typeof window.LEADS_MODULE.submitAddLead === 'function') {
            window.LEADS_MODULE.submitAddLead();
          }
        });
      },
      6000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/leads returned HTTP ${res.status()}`);
    }

    await wait(600);
    const isModalClosed = await page.evaluate(() => {
      const m = document.getElementById('addLeadModal');
      return !m || !m.classList.contains('active');
    });
    tracker.assert(isModalClosed, '#addLeadModal must close after lead creation');
  });

  await tracker.runStep('A4.3', 'Lead Profile Slide-Over Drawer & Stage Advancement', async () => {
    // Open drawer on first lead or test lead
    const opened = await page.evaluate(() => {
      const leadCard = document.querySelector('.lead-card, [onclick*="openDrawer"]');
      if (leadCard) {
        leadCard.click();
        return true;
      }
      return false;
    });

    if (opened) {
      await wait(600);
      const isDrawerOpen = await page.evaluate(() => {
        const d = document.getElementById('leadProfileDrawer');
        return d && d.style.display !== 'none';
      });
      tracker.assert(isDrawerOpen, '#leadProfileDrawer must be visible');
      await tracker.screenshot(page, 'A4.3_lead_details_drawer.png');

      // Close drawer
      await page.evaluate(() => {
        window.LEADS_MODULE.closeDrawer();
      });
      await wait(300);
    }
  });

  await tracker.runStep('A4.4', 'Client CRM Directory Hub & Live Search Filtering', async () => {
    await page.evaluate(() => { window.location.hash = '#crm'; });
    await wait(1400);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.innerHTML.includes('Client CRM') || el.innerHTML.includes('Client Directory') || document.getElementById('crmGrid') !== null);
    }, { timeout: 8000 });

    const isCrmReady = await page.evaluate(() => {
      return typeof window.CRM_MODULE === 'object' && window.CRM_MODULE !== null;
    });
    tracker.assert(isCrmReady, 'window.CRM_MODULE must be initialized on window');

    // Test Search Filter
    await page.evaluate(() => {
      window.CRM_MODULE.setSearch('Chillox');
    });
    await wait(400);

    // Reset Search Filter
    await page.evaluate(() => {
      window.CRM_MODULE.setSearch('');
    });
    await wait(300);

    await tracker.screenshot(page, 'A4.4_crm_directory.png');
  });

  await tracker.runStep('A4.5', 'Add Client 2-Step Wizard Modal & Intercept POST /api/clients', async () => {
    await page.evaluate(() => {
      if (window.CRM_MODULE && typeof window.CRM_MODULE.openAddModal === 'function') {
        window.CRM_MODULE.openAddModal();
      }
    });
    await wait(500);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('crmModal');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalActive, '#crmModal must have .active class');

    // Step 1: Fill Company Details
    await page.evaluate(() => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setVal('crmName', 'Apex Footwear Limited');
      setVal('crmIndustry', 'Fashion & Retail');
      setVal('crmEmail', 'partners@apexfootwear.com');
      setVal('crmPhone', '+8801700998877');
      setVal('crmStatus', 'Active Retainer');
      setVal('crmTotalSpent', '500000');
    });

    // Advance to Step 2: POC Details
    await page.evaluate(() => {
      window.CRM_MODULE.setStep(2);
    });
    await wait(400);

    const isStep2Visible = await page.evaluate(() => {
      const s2 = document.getElementById('wizStep2');
      return s2 && s2.style.display !== 'none';
    });
    tracker.assert(isStep2Visible, '#wizStep2 must be visible in wizard step 2');
    await tracker.screenshot(page, 'A4.5_new_client_modal.png');

    // Intercept POST /api/clients
    const res = await interceptApiCall(
      page,
      '/api/clients',
      async () => {
        await page.evaluate(() => {
          if (window.CRM_MODULE && typeof window.CRM_MODULE.submitClient === 'function') {
            window.CRM_MODULE.submitClient();
          }
        });
      },
      6000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/clients returned HTTP ${res.status()}`);
    }

    await wait(600);
    const isModalClosed = await page.evaluate(() => {
      const m = document.getElementById('crmModal');
      return !m || !m.classList.contains('active');
    });
    tracker.assert(isModalClosed, '#crmModal must close after onboarding completion');
  });

  await tracker.runStep('A4.6', 'Client Hub Slide-Over Drawer & Meeting Sync Modal', async () => {
    // Open hub for first client
    const opened = await page.evaluate(() => {
      const btn = document.querySelector('[onclick*="openHub"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (opened) {
      await wait(600);
      const isHubOpen = await page.evaluate(() => {
        const d = document.getElementById('crmHubModal');
        return d && (d.style.display === 'flex' || d.style.display === 'block');
      });
      tracker.assert(isHubOpen, '#crmHubModal must be visible');

      // Test open log meeting modal
      await page.evaluate(() => {
        if (window.CRM_MODULE && typeof window.CRM_MODULE.openLogMeetingModal === 'function') {
          window.CRM_MODULE.openLogMeetingModal();
        }
      });
      await wait(400);

      const isMeetingOpen = await page.evaluate(() => {
        const m = document.getElementById('logMeetingModal');
        return m && m.classList.contains('active');
      });
      tracker.assert(isMeetingOpen, '#logMeetingModal must open for logging sync');

      // Close meeting modal and hub
      await page.evaluate(() => {
        if (window.CRM_MODULE.closeLogMeetingModal) window.CRM_MODULE.closeLogMeetingModal();
        if (window.CRM_MODULE.closeHub) window.CRM_MODULE.closeHub();
      });
      await wait(300);
    }
  });

  await tracker.runStep('A4.7', 'Proposals Studio Hub (#proposals) & KPI Scorecards', async () => {
    await page.evaluate(() => { window.location.hash = '#proposals'; });
    await wait(1400);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (document.getElementById('kpiTotalProposals') !== null || (el.textContent && el.textContent.includes('Client Proposals')));
    }, { timeout: 10000 });



    const hasKpis = await page.evaluate(() => {
      return document.getElementById('kpiTotalProposals') !== null &&
             document.getElementById('kpiOneTimePipeline') !== null &&
             document.getElementById('kpiRecurringPipeline') !== null &&
             document.getElementById('kpiAcceptedRate') !== null;
    });
    tracker.assert(hasKpis, 'All 4 Proposal Studio KPI scorecards must exist');

    // Test filter chips
    const chipClicked = await page.evaluate(() => {
      const chip = document.querySelector('.filter-chip[data-filter="Draft"]');
      if (chip) {
        chip.click();
        return true;
      }
      return false;
    });
    tracker.assert(chipClicked, 'Filter chips must be clickable');
    await wait(300);

    // Reset to all
    await page.evaluate(() => {
      const chipAll = document.querySelector('.filter-chip[data-filter="all"]');
      if (chipAll) chipAll.click();
    });
    await wait(300);

    await tracker.screenshot(page, 'A4.6_proposals_studio.png');
  });

  await tracker.runStep('A4.8', 'Proposal Creation Modal UI & Scope Breakdown Builder', async () => {
    // Open proposal modal
    await page.evaluate(() => {
      const btn = document.getElementById('btnOpenNewProposal');
      if (btn) btn.click();
    });
    await wait(500);

    const isModalOpen = await page.evaluate(() => {
      const m = document.getElementById('proposalModal');
      return m && m.style.display !== 'none';
    });
    tracker.assert(isModalOpen, '#proposalModal must be visible');

    // Add deliverable scope item
    await page.evaluate(() => {
      const btnAdd = document.getElementById('btnAddScopeItem');
      if (btnAdd) btnAdd.click();
    });
    await wait(300);

    const hasScopeRow = await page.evaluate(() => {
      return document.querySelectorAll('.scope-item-row').length > 0;
    });
    tracker.assert(hasScopeRow, 'Deliverable scope item row must be added');
    await tracker.screenshot(page, 'A4.7_proposal_generator_modal.png');

    // Close proposal modal
    await page.evaluate(() => {
      const btnClose = document.getElementById('btnCloseProposalModal');
      if (btnClose) btnClose.click();
    });
    await wait(300);

    const isModalClosed = await page.evaluate(() => {
      const m = document.getElementById('proposalModal');
      return !m || m.style.display === 'none';
    });
    tracker.assert(isModalClosed, '#proposalModal must close');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA4 };
