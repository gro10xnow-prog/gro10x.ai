/**
 * Client Proposals & Quotations Studio QA Automation Suite (18 Steps)
 * Voice/AI proposal drafting, multi-currency scopes, and project conversion (#proposals)
 */

const PROPOSALS_QA_SUITE = {
  id: 'proposals',
  platform: 'admin',
  title: 'Client Proposals & Quotations Studio QA Suite',
  targetHash: '#proposals',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Client Proposals Studio',
      action: 'navigate_hash',
      target: '#proposals',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 4 KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_proposals_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#btnProposalsToggleCurrency',
      assertion: { type: 'custom_check', check: 'assert_proposals_bdt' }
    },
    {
      id: 'step-4',
      title: '4. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#btnProposalsToggleCurrency',
      assertion: { type: 'custom_check', check: 'assert_proposals_usd' }
    },
    {
      id: 'step-5',
      title: '5. Verify Proposals Table Loaded',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_proposals_table' }
    },
    {
      id: 'step-6',
      title: '6. Verify Filter Chips Present',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_chips' }
    },
    {
      id: 'step-7',
      title: '7. Filter: Click Draft Filter Chip',
      action: 'click',
      selector: '#proposalFilterChips button[data-filter="Draft"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_draft' }
    },
    {
      id: 'step-8',
      title: '8. Filter: Reset to All Proposals',
      action: 'click',
      selector: '#proposalFilterChips button[data-filter="all"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_all' }
    },
    {
      id: 'step-9',
      title: '9. Search Proposals: Input Search Query',
      action: 'input_text',
      selector: '#proposalsSearchInput',
      value: 'AI',
      assertion: { type: 'custom_check', check: 'assert_proposals_search' }
    },
    {
      id: 'step-10',
      title: '10. Clear Search Query & Restore Proposals',
      action: 'input_text',
      selector: '#proposalsSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_proposals_search_cleared' }
    },
    {
      id: 'step-11',
      title: '11. Sort: Switch to Build Fee (High ↓)',
      action: 'input_text',
      selector: '#proposalsSortSelect',
      value: 'onetime',
      assertion: { type: 'custom_check', check: 'assert_proposals_sort_onetime' }
    },
    {
      id: 'step-12',
      title: '12. Sort: Restore Newest First',
      action: 'input_text',
      selector: '#proposalsSortSelect',
      value: 'newest',
      assertion: { type: 'custom_check', check: 'assert_proposals_sort_newest' }
    },
    {
      id: 'step-13',
      title: '13. Open Proposal Builder Modal',
      action: 'click',
      selector: '#btnOpenNewProposal',
      assertion: { type: 'modal_open', selector: '#proposalModal' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Proposal Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#proposalModal' }
    },
    {
      id: 'step-15',
      title: '15. Re-Open Proposal Builder Modal',
      action: 'click',
      selector: '#btnOpenNewProposal',
      assertion: { type: 'modal_open', selector: '#proposalModal' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Proposal Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#proposalModal',
      assertion: { type: 'modal_closed', selector: '#proposalModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchProposalsCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_proposals_currency_alias' }
    },
    {
      id: 'step-19',
      title: '19. Filter Chip: Sent Proposals',
      action: 'click',
      selector: '#proposalFilterChips .filter-chip[data-filter="Sent"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_active' }
    },
    {
      id: 'step-20',
      title: '20. Filter Chip: Viewed Proposals',
      action: 'click',
      selector: '#proposalFilterChips .filter-chip[data-filter="Viewed"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_active' }
    },
    {
      id: 'step-21',
      title: '21. Filter Chip: Accepted Proposals',
      action: 'click',
      selector: '#proposalFilterChips .filter-chip[data-filter="Accepted"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_active' }
    },
    {
      id: 'step-22',
      title: '22. Filter Chip: Converted to Project',
      action: 'click',
      selector: '#proposalFilterChips .filter-chip[data-filter="Converted"]',
      assertion: { type: 'custom_check', check: 'assert_proposals_filter_active' }
    },
    {
      id: 'step-23',
      title: '23. Reset to All Proposals & Verify AI Draft Button Present',
      action: 'click',
      selector: '#proposalFilterChips .filter-chip[data-filter="all"]',
      assertion: { type: 'element_exists', selector: '#btnRunAIDraft' }
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
  window.PROPOSALS_QA_SUITE = PROPOSALS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROPOSALS_QA_SUITE };
}
