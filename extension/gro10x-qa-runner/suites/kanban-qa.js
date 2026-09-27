/**
 * Production Pipeline Hub QA Automation Suite (18 Steps)
 * Stage pipelines, multi-view boards, blueprints, bulk import, and workspace spaces (#kanban)
 */

const KANBAN_QA_SUITE = {
  id: 'kanban',
  platform: 'admin',
  title: 'Production Pipeline Hub QA Suite',
  targetHash: '#kanban',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Production Pipeline Hub',
      action: 'navigate_hash',
      target: '#kanban',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 4 View Toggle Buttons Rendered',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_kanban_view_toggles' }
    },
    {
      id: 'step-3',
      title: '3. Verify Filter Bar & Search Input Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_kanban_filter_bar' }
    },
    {
      id: 'step-4',
      title: '4. Switch to Board View — Verify Kanban Columns',
      action: 'click',
      selector: '#btnViewKanbanBoard',
      assertion: { type: 'custom_check', check: 'assert_kanban_board_view' }
    },
    {
      id: 'step-5',
      title: '5. Switch to List View — Verify Table Renders',
      action: 'click',
      selector: '#btnViewKanbanList',
      assertion: { type: 'custom_check', check: 'assert_kanban_list_view' }
    },
    {
      id: 'step-6',
      title: '6. Switch to Dashboard View — Verify 5 KPI Metrics',
      action: 'click',
      selector: '#btnViewKanbanDashboard',
      assertion: { type: 'custom_check', check: 'assert_kanban_dashboard_kpis' }
    },
    {
      id: 'step-7',
      title: '7. Verify 4 Workflow Pipeline Matrix Cards Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_kanban_workflow_cards' }
    },
    {
      id: 'step-8',
      title: '8. Switch Back to Board View',
      action: 'click',
      selector: '#btnViewKanbanBoard',
      assertion: { type: 'custom_check', check: 'assert_kanban_board_view' }
    },
    {
      id: 'step-9',
      title: '9. Search Filter: Type Query & Filter Board',
      action: 'input_text',
      selector: '#kanbanSearchQuery',
      value: 'a',
      assertion: { type: 'custom_check', check: 'assert_kanban_search_active' }
    },
    {
      id: 'step-10',
      title: '10. Clear Search Filter & Restore All Deliverables',
      action: 'input_text',
      selector: '#kanbanSearchQuery',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_kanban_search_cleared' }
    },
    {
      id: 'step-11',
      title: '11. Open New Task Creation Modal',
      action: 'click',
      selector: '#btnOpenNewTask',
      assertion: { type: 'modal_open', selector: '#newTaskModalOverlay' }
    },
    {
      id: 'step-12',
      title: '12. Dismiss New Task Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#newTaskModalOverlay' }
    },
    {
      id: 'step-13',
      title: '13. Open Bulk Import CSV Modal',
      action: 'click',
      selector: '#btnOpenBulkImport',
      assertion: { type: 'custom_check', check: 'assert_kanban_import_modal_open' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Bulk Import Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#kanbanImportModal',
      assertion: { type: 'custom_check', check: 'assert_kanban_import_modal_closed' }
    },
    {
      id: 'step-15',
      title: '15. Open Space Manager Modal',
      action: 'click',
      selector: '#btnOpenSpaceModal',
      assertion: { type: 'custom_check', check: 'assert_kanban_space_modal_open' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Space Manager Modal via ✕ Button',
      action: 'click',
      selector: '#btnCloseSpaceModal',
      assertion: { type: 'custom_check', check: 'assert_kanban_space_modal_closed' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchKanbanCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_kanban_currency_alias' }
    },
    {
      id: 'step-19',
      title: '19. Toggle Calendar / Timeline View',
      action: 'click',
      selector: '#btnViewKanbanCalendar',
      assertion: { type: 'custom_check', check: 'assert_kanban_calendar_view' }
    },
    {
      id: 'step-20',
      title: '20. Return to Board View',
      action: 'click',
      selector: '#btnViewKanbanBoard',
      assertion: { type: 'custom_check', check: 'assert_kanban_board_view' }
    },
    {
      id: 'step-21',
      title: '21. Workflow Filter: Select Sprint Workflow',
      action: 'select_option',
      selector: '#kanbanFilterWorkflow',
      value: 'sprints',
      assertion: { type: 'custom_check', check: 'assert_kanban_workflow_filter' }
    },
    {
      id: 'step-22',
      title: '22. Priority Filter: Urgent Only',
      action: 'select_option',
      selector: '#kanbanFilterPriority',
      value: 'urgent',
      assertion: { type: 'custom_check', check: 'assert_kanban_priority_filter' }
    },
    {
      id: 'step-23',
      title: '23. Reset Priority & Workflow Filters',
      action: 'select_option',
      selector: '#kanbanFilterPriority',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_kanban_priority_filter_cleared' }
    },
    {
      id: 'step-24',
      title: '24. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.KANBAN_QA_SUITE = KANBAN_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KANBAN_QA_SUITE };
}