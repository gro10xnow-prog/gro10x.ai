/**
 * Social Planner QA Automation Suite (18 Steps)
 * Multi-channel publishing calendar, kanban pipeline, search, filters, modals, and real-time sync (#social)
 */

const SOCIAL_QA_SUITE = {
  id: 'social',
  platform: 'admin',
  title: 'Social Planner QA Suite',
  targetHash: '#social',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Social Planner Hub',
      action: 'navigate_hash',
      target: '#social',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 5 Top-line KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_social_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Verify View Switchers & Kanban Default View Active',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_social_view_switchers' }
    },
    {
      id: 'step-4',
      title: '4. Verify 5 Kanban Columns Rendered',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_social_kanban_cols' }
    },
    {
      id: 'step-5',
      title: '5. Filter by Channel — Grow Bangla',
      action: 'click',
      selector: '#sp-chan-grow-bangla',
      assertion: { type: 'custom_check', check: 'assert_social_chan_grow_bangla' }
    },
    {
      id: 'step-6',
      title: '6. Filter by Platform — YouTube',
      action: 'click',
      selector: '#sp-pill-YouTube',
      assertion: { type: 'custom_check', check: 'assert_social_plat_youtube' }
    },
    {
      id: 'step-7',
      title: '7. Reset Channel & Platform Filters (All)',
      action: 'click',
      selector: '#sp-chan-all',
      assertion: { type: 'custom_check', check: 'assert_social_filters_reset' }
    },
    {
      id: 'step-8',
      title: '8. Real-time Post Search by Title',
      action: 'input_text',
      selector: '#kanbanSearchInput',
      value: 'English',
      assertion: { type: 'custom_check', check: 'assert_social_search_filter' }
    },
    {
      id: 'step-9',
      title: '9. Clear Real-time Post Search',
      action: 'input_text',
      selector: '#kanbanSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_social_search_cleared' }
    },
    {
      id: 'step-10',
      title: '10. Switch to Monthly Publishing Calendar View',
      action: 'click',
      selector: '#btnViewCalendar',
      assertion: { type: 'custom_check', check: 'assert_social_calendar_active' }
    },
    {
      id: 'step-11',
      title: '11. Verify Calendar Grid & Cadence Metronome',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_social_cadence_stats' }
    },
    {
      id: 'step-12',
      title: '12. Switch Back to Pipeline Kanban View',
      action: 'click',
      selector: '#btnViewKanban',
      assertion: { type: 'custom_check', check: 'assert_social_kanban_cols' }
    },
    {
      id: 'step-13',
      title: '13. Open Batch Import Modal',
      action: 'click',
      selector: '#btnOpenBatchImport',
      assertion: { type: 'modal_open', selector: '#batchImportModal' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Batch Import Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#batchImportModal',
      assertion: { type: 'modal_closed', selector: '#batchImportModal' }
    },
    {
      id: 'step-15',
      title: '15. Open Draft New Post Wizard Modal',
      action: 'click',
      selector: '#btnOpenPostModal',
      assertion: { type: 'modal_open', selector: '#postModal' }
    },
    {
      id: 'step-16',
      title: '16. Post Wizard: Navigate to Step 2 (Scheduling & Distribution)',
      action: 'click',
      selector: '#spWizTab2',
      assertion: { type: 'element_exists', selector: '#spWizPane2.active, #spWizPane2[class*="active"]' }
    },
    {
      id: 'step-17',
      title: '17. Post Wizard: Navigate to Step 3 (AI Optimiser & Publish)',
      action: 'click',
      selector: '#spWizTab3',
      assertion: { type: 'element_exists', selector: '#spWizPane3.active, #spWizPane3[class*="active"]' }
    },
    {
      id: 'step-18',
      title: '18. Dismiss Post Modal via ✕ Button',
      action: 'click',
      selector: '#btnClosePostModal',
      assertion: { type: 'modal_closed', selector: '#postModal' }
    },
    {
      id: 'step-19',
      title: '19. Reset Platform Filter: All Platforms',
      action: 'click',
      selector: '#sp-chan-all',
      assertion: { type: 'custom_check', check: 'assert_social_filters_reset' }
    },
    {
      id: 'step-20',
      title: '20. Verify window.switchSocialCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_social_currency_alias' }
    },
    {
      id: 'step-21',
      title: '21. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.SOCIAL_QA_SUITE = SOCIAL_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOCIAL_QA_SUITE };
}
