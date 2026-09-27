/**
 * Platform Portfolio Registry & Architecture Cockpit QA Automation Suite (20 Steps)
 */

const PLATFORMS_QA_SUITE = {
  id: 'platforms',
  platform: 'admin',
  title: 'Platform Portfolio Registry QA Suite',
  targetHash: '#platforms',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Platform Portfolio Registry',
      action: 'navigate_hash',
      target: '#platforms',
      assertion: { type: 'wait_selector', selector: '#platformsStatsStrip', timeout: 12000 }
    },
    {
      id: 'step-2',
      title: '2. Verify Stats Strip (4 Architecture KPI Cards)',
      action: 'wait_ms',
      duration: 350,
      assertion: { type: 'custom_check', check: 'assert_platforms_stats' }
    },
    {
      id: 'step-3',
      title: '3. Verify Full Portfolio Grid (16+ Codebases)',
      action: 'wait_ms',
      duration: 350,
      assertion: { type: 'custom_check', check: 'assert_platforms_grid_count' }
    },
    {
      id: 'step-4',
      title: '4. Filter: 🤝 Engine 4 Retainer OS',
      action: 'click',
      selector: 'button[onclick*="setFilter(\'engine4\')"]',
      assertion: { type: 'custom_check', check: 'assert_platforms_engine4' }
    },
    {
      id: 'step-5',
      title: '5. Filter: 💻 Engine 1 Micro-SaaS',
      action: 'click',
      selector: 'button[onclick*="setFilter(\'engine1\')"]',
      assertion: { type: 'custom_check', check: 'assert_platforms_engine1' }
    },
    {
      id: 'step-6',
      title: '6. Filter: ⚡ Live / Production Ready',
      action: 'click',
      selector: 'button[onclick*="setFilter(\'live\')"]',
      assertion: { type: 'custom_check', check: 'assert_platforms_live' }
    },
    {
      id: 'step-7',
      title: '7. Filter: 👑 Proprietary Owned Platforms',
      action: 'click',
      selector: 'button[onclick*="setFilter(\'owned\')"]',
      assertion: { type: 'custom_check', check: 'assert_platforms_owned' }
    },
    {
      id: 'step-8',
      title: '8. Reset Filter to All Platforms',
      action: 'click',
      selector: 'button[onclick*="setFilter(\'all\')"]',
      assertion: { type: 'custom_check', check: 'assert_platforms_grid_count' }
    },
    {
      id: 'step-9',
      title: '9. Search Stack / ICP: "React"',
      action: 'input_text',
      selector: '#platformSearchInput',
      value: 'React',
      assertion: { type: 'custom_check', check: 'assert_platforms_search' }
    },
    {
      id: 'step-10',
      title: '10. Clear Search Input & Restore Grid',
      action: 'input_text',
      selector: '#platformSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_platforms_grid_count' }
    },
    {
      id: 'step-11',
      title: '11. Open Architecture Spec Drawer (1st Platform)',
      action: 'click',
      selector: '#platformsCardsGrid .platform-card:first-child .btn-open-specs, #platformsCardsGrid .platform-card:first-child button[onclick*="openSpecs"]',
      assertion: { type: 'modal_open', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-12',
      title: '12. Verify Spec Sheet Telemetry & Modules',
      action: 'wait_ms',
      duration: 350,
      assertion: { type: 'custom_check', check: 'assert_specs_content' }
    },
    {
      id: 'step-13',
      title: '13. Dismiss Spec Sheet via ✕ Button',
      action: 'click',
      selector: '#btnCloseSpecsModal, #platformSpecsModal button[onclick*="closeSpecs"]',
      assertion: { type: 'modal_closed', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-14',
      title: '14. Re-open Spec Sheet Drawer',
      action: 'click',
      selector: '#platformsCardsGrid .platform-card:first-child .btn-open-specs, #platformsCardsGrid .platform-card:first-child button[onclick*="openSpecs"]',
      assertion: { type: 'modal_open', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-15',
      title: '15. Dismiss Spec Sheet via Modal Backdrop Click',
      action: 'click_backdrop',
      selector: '#platformSpecsModal',
      assertion: { type: 'modal_closed', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-16',
      title: '16. Re-open Spec Sheet Drawer for Escape Test',
      action: 'click',
      selector: '#platformsCardsGrid .platform-card:first-child .btn-open-specs, #platformsCardsGrid .platform-card:first-child button[onclick*="openSpecs"]',
      assertion: { type: 'modal_open', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-17',
      title: '17. Dismiss Spec Sheet via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#platformSpecsModal' }
    },
    {
      id: 'step-18',
      title: '18. Open Register Platform Modal',
      action: 'click',
      selector: '#btnOpenRegisterModal, button[onclick*="openRegisterModal"]',
      assertion: { type: 'modal_open', selector: '#registerPlatformModal' }
    },
    {
      id: 'step-19',
      title: '19. Dismiss Register Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#registerPlatformModal',
      assertion: { type: 'modal_closed', selector: '#registerPlatformModal' }
    },
    {
      id: 'step-20',
      title: '20. Zero-Error Runtime Health Audit',
      action: 'navigate_hash',
      target: '#platforms',
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.PLATFORMS_QA_SUITE = PLATFORMS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLATFORMS_QA_SUITE };
}
