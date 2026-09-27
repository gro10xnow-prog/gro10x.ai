/**
 * Services Catalog & CMS Editor QA Automation Suite (18 Steps)
 * Packages catalog, pricing, feature bullets, companion assets, modals, and real-time sync (#cms)
 */

const CMS_QA_SUITE = {
  id: 'cms',
  platform: 'admin',
  title: 'Services Catalog & CMS QA Suite',
  targetHash: '#cms',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Services Catalog & CMS Editor',
      action: 'navigate_hash',
      target: '#cms',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 3 Top-line KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_cms_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Verify Services Catalog Counter',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_cms_counter' }
    },
    {
      id: 'step-4',
      title: '4. Verify Agency Service Packages Grid Rendered',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_cms_grid_rendered' }
    },
    {
      id: 'step-5',
      title: '5. Verify Service Cards Structure & Feature Badges',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_cms_card_features' }
    },
    {
      id: 'step-6',
      title: '6. Open Create Service Package Modal',
      action: 'click',
      selector: '#btnCreateServicePackage',
      assertion: { type: 'modal_open', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-7',
      title: '7. Verify Create Modal Header & Form Fields',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_cms_create_modal_fields' }
    },
    {
      id: 'step-8',
      title: '8. Dismiss Create Service Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#cmsServiceModal',
      assertion: { type: 'modal_closed', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-9',
      title: '9. Open Edit Service Package Modal',
      action: 'click',
      selector: '.btn-edit-service',
      assertion: { type: 'modal_open', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-10',
      title: '10. Verify Edit Mode Pre-filled Fields',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_cms_edit_prefilled' }
    },
    {
      id: 'step-11',
      title: '11. Dismiss Edit Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-12',
      title: '12. Open Create Modal for Live Form Input',
      action: 'click',
      selector: '#btnCreateServicePackage',
      assertion: { type: 'modal_open', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-13',
      title: '13. Fill in Service Package Details',
      action: 'input_text',
      selector: '#cmsSvcTitle',
      value: 'Autonomous AI Workflow Automation',
      assertion: { type: 'custom_check', check: 'assert_cms_title_input' }
    },
    {
      id: 'step-14',
      title: '14. Fill in Service Package Pricing Label',
      action: 'input_text',
      selector: '#cmsSvcPrice',
      value: '৳95,000 / month',
      assertion: { type: 'custom_check', check: 'assert_cms_price_input' }
    },
    {
      id: 'step-15',
      title: '15. Fill in Included Feature Bullets',
      action: 'input_text',
      selector: '#cmsSvcFeatures',
      value: 'Multi-Agent Swarm, Custom MCP Connectors, Real-time Dashboard',
      assertion: { type: 'custom_check', check: 'assert_cms_features_input' }
    },
    {
      id: 'step-16',
      title: '16. Cancel Creation Modal via Cancel Button',
      action: 'click',
      selector: '#btnCancelCmsModal',
      assertion: { type: 'modal_closed', selector: '#cmsServiceModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchCMSCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_cms_currency_alias' }
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
  window.CMS_QA_SUITE = CMS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CMS_QA_SUITE };
}
