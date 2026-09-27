/**
 * Clients & Retainers CRM QA Automation Suite (18 Steps)
 * Client directory, multi-POC access, retainer spend, and 360 CRM Hub (#crm)
 */

const CRM_QA_SUITE = {
  id: 'crm',
  platform: 'admin',
  title: 'Clients & Retainers CRM QA Suite',
  targetHash: '#crm',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Clients & Retainers CRM',
      action: 'navigate_hash',
      target: '#crm',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 4 KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_crm_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#crmCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_crm_bdt' }
    },
    {
      id: 'step-4',
      title: '4. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#crmCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_crm_usd' }
    },
    {
      id: 'step-5',
      title: '5. Verify Client Cards Grid Loaded',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_crm_cards_grid' }
    },
    {
      id: 'step-6',
      title: '6. Filter Clients: Onboarding Status',
      action: 'input_text',
      selector: '#crmFilterSelect',
      value: 'Onboarding',
      assertion: { type: 'custom_check', check: 'assert_crm_filter_onboarding' }
    },
    {
      id: 'step-7',
      title: '7. Filter Clients: Active Retainer Status',
      action: 'input_text',
      selector: '#crmFilterSelect',
      value: 'Active Retainer',
      assertion: { type: 'custom_check', check: 'assert_crm_filter_active' }
    },
    {
      id: 'step-8',
      title: '8. Filter Clients: Reset to All Statuses',
      action: 'input_text',
      selector: '#crmFilterSelect',
      value: 'all',
      assertion: { type: 'custom_check', check: 'assert_crm_filter_all' }
    },
    {
      id: 'step-9',
      title: '9. Search Clients: Input Search Query',
      action: 'input_text',
      selector: '#crmSearchInput',
      value: 'a',
      assertion: { type: 'custom_check', check: 'assert_crm_search' }
    },
    {
      id: 'step-10',
      title: '10. Clear Search Query & Restore Directory',
      action: 'input_text',
      selector: '#crmSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_crm_search_cleared' }
    },
    {
      id: 'step-11',
      title: '11. Sort Clients: Name A–Z',
      action: 'input_text',
      selector: '#crmSortSelect',
      value: 'name',
      assertion: { type: 'custom_check', check: 'assert_crm_sort_name' }
    },
    {
      id: 'step-12',
      title: '12. Sort Clients: Restore By Spend ↓',
      action: 'input_text',
      selector: '#crmSortSelect',
      value: 'revenue',
      assertion: { type: 'custom_check', check: 'assert_crm_sort_revenue' }
    },
    {
      id: 'step-13',
      title: '13. Open Client Onboarding Wizard Modal',
      action: 'click',
      selector: '#btnOpenNewClient',
      assertion: { type: 'modal_open', selector: '#crmModal' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Wizard Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#crmModal' }
    },
    {
      id: 'step-15',
      title: '15. Re-Open Client Onboarding Wizard Modal',
      action: 'click',
      selector: '#btnOpenNewClient',
      assertion: { type: 'modal_open', selector: '#crmModal' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Wizard Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#crmModal',
      assertion: { type: 'modal_closed', selector: '#crmModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchCRMCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_crm_currency_alias' }
    },
    {
      id: 'step-19',
      title: '19. Open 360° CRM Hub Modal (First Client Card)',
      action: 'click',
      selector: '#crmCardsGrid .btn-open-crm-hub, #crmCardsGrid .card .btn-open-crm-hub',
      assertion: { type: 'element_visible', selector: '#crmHubModal' }
    },
    {
      id: 'step-20',
      title: '20. Verify 360° Hub Content Loaded (Client Name & Sub Header)',
      action: 'wait_ms',
      duration: 600,
      assertion: { type: 'element_exists', selector: '#hubClientSub, #crmHubModal [id^="hubClient"]' }
    },
    {
      id: 'step-21',
      title: '21. Close 360° Hub via ✕ Button',
      action: 'click',
      selector: '#btnCloseCrmHubModal',
      assertion: { type: 'element_hidden', selector: '#crmHubModal' }
    },
    {
      id: 'step-22',
      title: '22. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.CRM_QA_SUITE = CRM_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRM_QA_SUITE };
}
