/**
 * Content OS & Brand Engine QA Automation Suite (18 Steps)
 * Multi-brand architecture, strategic focus deck, channel matrix, and 3-step wizard (#content-os)
 */

const CONTENT_OS_QA_SUITE = {
  id: 'content-os',
  platform: 'admin',
  title: 'Content OS & Brand Engine QA Suite',
  targetHash: '#content-os',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Content OS & Brand Engine',
      action: 'navigate_hash',
      target: '#content-os',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 5 Top-line KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_content_os_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Verify 3-Way Top View Switcher (Kanban, Calendar, Content OS)',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_content_os_view_switchers' }
    },
    {
      id: 'step-4',
      title: '4. Verify Content OS View Mode Active',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_content_os_active' }
    },
    {
      id: 'step-5',
      title: '5. Verify Brand Switcher Tabs Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_content_os_brand_tabs' }
    },
    {
      id: 'step-6',
      title: '6. Switch Brand to PILUTICS',
      action: 'click',
      selector: '#brand-pill-pilutics',
      assertion: { type: 'custom_check', check: 'assert_content_os_brand_pilutics' }
    },
    {
      id: 'step-7',
      title: '7. Switch Brand to Bong Hits',
      action: 'click',
      selector: '#brand-pill-bong-hits',
      assertion: { type: 'custom_check', check: 'assert_content_os_brand_bong_hits' }
    },
    {
      id: 'step-8',
      title: '8. Switch Brand Back to Grow Bangla',
      action: 'click',
      selector: '#brand-pill-grow-bangla',
      assertion: { type: 'custom_check', check: 'assert_content_os_brand_grow_bangla' }
    },
    {
      id: 'step-9',
      title: '9. Switch Subtab to Brand Identity & Asset Kit',
      action: 'click',
      selector: '#subtabBrandAssets',
      assertion: { type: 'custom_check', check: 'assert_content_os_subtab_assets' }
    },
    {
      id: 'step-10',
      title: '10. Switch Subtab Back to Cross-Channel Matrix Overview',
      action: 'click',
      selector: '#subtabBrandOverview',
      assertion: { type: 'custom_check', check: 'assert_content_os_subtab_overview' }
    },
    {
      id: 'step-11',
      title: '11. Verify Brand Monthly Focus Deck Inputs Present',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_content_os_focus_inputs' }
    },
    {
      id: 'step-12',
      title: '12. Input Strategic Monthly Campaign Thesis',
      action: 'input_text',
      selector: '#inpBrandMonthlyThesis',
      value: 'Corporate English Mastery Q4 Sprint',
      assertion: { type: 'custom_check', check: 'assert_content_os_thesis_input' }
    },
    {
      id: 'step-13',
      title: '13. Save Brand Monthly Focus',
      action: 'click',
      selector: '#btnSaveBrandMonthlyFocus',
      assertion: { type: 'custom_check', check: 'assert_content_os_save_focus' }
    },
    {
      id: 'step-14',
      title: '14. Open Draft New Post Wizard Modal',
      action: 'click',
      selector: '#btnOpenPostModal',
      assertion: { type: 'modal_open', selector: '#postModal' }
    },
    {
      id: 'step-15',
      title: '15. Verify 3-Step Wizard Navigation Tabs',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_content_os_wizard_tabs' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Post Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#postModal',
      assertion: { type: 'modal_closed', selector: '#postModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchContentOSCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_content_os_currency_alias' }
    },
    {
      id: 'step-18',
      title: '18. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.CONTENT_OS_QA_SUITE = CONTENT_OS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONTENT_OS_QA_SUITE };
}