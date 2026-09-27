/**
 * CRM Leads Pipeline QA Automation Suite (18 Steps)
 * Full sales funnel — capture, qualify, convert, and activate clients (#leads)
 */

const LEADS_QA_SUITE = {
  id: 'leads',
  platform: 'admin',
  title: 'CRM Leads Pipeline QA Suite',
  targetHash: '#leads',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to CRM Leads Pipeline',
      action: 'navigate_hash',
      target: '#leads',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 5 KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_leads_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#leadsCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_leads_bdt' }
    },
    {
      id: 'step-4',
      title: '4. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#leadsCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_leads_usd' }
    },
    {
      id: 'step-5',
      title: '5. Verify 5 Kanban Stage Columns',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_leads_kanban_columns' }
    },
    {
      id: 'step-6',
      title: '6. Filter Leads: Search by Query',
      action: 'input_text',
      selector: '#leadsSearchInput',
      value: 'Contractor',
      assertion: { type: 'custom_check', check: 'assert_leads_search' }
    },
    {
      id: 'step-7',
      title: '7. Clear Search Query & Restore Pipeline',
      action: 'input_text',
      selector: '#leadsSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_leads_search_cleared' }
    },
    {
      id: 'step-8',
      title: '8. Filter: Toggle Sprint 01 Source',
      action: 'click',
      selector: '#btnSprintFilter',
      assertion: { type: 'custom_check', check: 'assert_leads_sprint_filtered' }
    },
    {
      id: 'step-9',
      title: '9. Filter: Reset to All Sources',
      action: 'click',
      selector: '#btnSprintFilter',
      assertion: { type: 'custom_check', check: 'assert_leads_all_sources' }
    },
    {
      id: 'step-10',
      title: '10. Sort: Switch to Newest First',
      action: 'input_text',
      selector: '#leadsSortSelect',
      value: 'date',
      assertion: { type: 'custom_check', check: 'assert_leads_sorted_date' }
    },
    {
      id: 'step-11',
      title: '11. Open Add New Lead Modal',
      action: 'click',
      selector: '#btnOpenAddLeadModal',
      assertion: { type: 'modal_open', selector: '#addLeadModal' }
    },
    {
      id: 'step-12',
      title: '12. Dismiss Add Lead Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#addLeadModal' }
    },
    {
      id: 'step-13',
      title: '13. Open Bulk Import CSV Modal',
      action: 'click',
      selector: '#btnOpenImportModal',
      assertion: { type: 'modal_open', selector: '#importLeadsModal' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Bulk Import Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#importLeadsModal',
      assertion: { type: 'modal_closed', selector: '#importLeadsModal' }
    },
    {
      id: 'step-15',
      title: '15. Open Lead Profile Drawer (1st Lead)',
      action: 'click',
      selector: '.btn-open-lead-drawer',
      assertion: { type: 'custom_check', check: 'assert_leads_drawer_open' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Lead Profile Drawer via ✕ Button',
      action: 'click',
      selector: '#btnCloseDrawer',
      assertion: { type: 'custom_check', check: 'assert_leads_drawer_closed' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchLeadsCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_leads_currency_alias' }
    },
    {
      id: 'step-19',
      title: '19. Open Lead Profile Drawer',
      action: 'click',
      selector: '.btn-open-lead-drawer, .kanban-col .lead-card button[onclick*="openDrawer"]',
      assertion: { type: 'element_visible', selector: '#leadProfileDrawer' }
    },
    {
      id: 'step-20',
      title: '20. Verify WhatsApp Quick-Contact Link Present (Lead Cards)',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'element_exists', selector: 'a[href*="wa.me"]' }
    },
    {
      id: 'step-21',
      title: '21. Verify Convert Lead → Client CRM Button Present in Drawer',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: '#leadProfileDrawer button[onclick*="convertLead"], #leadDrawerContent button[onclick*="convertLead"]' }
    },
    {
      id: 'step-22',
      title: '22. Close Lead Profile Drawer',
      action: 'click',
      selector: '#btnCloseDrawer',
      assertion: { type: 'element_hidden', selector: '#leadProfileDrawer' }
    },
    {
      id: 'step-23',
      title: '23. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.LEADS_QA_SUITE = LEADS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEADS_QA_SUITE };
}
