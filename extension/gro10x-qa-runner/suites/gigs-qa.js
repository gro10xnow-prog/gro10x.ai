/**
 * Marketplace Gig Studio QA Automation Suite (23 Steps)
 * Engine 1 & 2 Demand Generation Cockpit (#gigs)
 * Added: Copy Studio Tabs 4 & 5, global currency alias, final clean audit
 */

const GIGS_QA_SUITE = {
  id: 'gigs',
  platform: 'admin',
  title: 'Marketplace Gig Studio QA Suite',
  targetHash: '#gigs',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Marketplace Gig Studio',
      action: 'navigate_hash',
      target: '#gigs',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#gigsCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_gigs_bdt' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#gigsCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_gigs_usd' }
    },
    {
      id: 'step-4',
      title: '4. Verify Stats Strip (4 Marketplace KPI Cards)',
      action: 'wait_ms',
      duration: 350,
      assertion: { type: 'custom_check', check: 'assert_gigs_kpi_cards' }
    },
    {
      id: 'step-5',
      title: '5. Verify 7 Gig Slot Cards Grid',
      action: 'wait_ms',
      duration: 350,
      assertion: { type: 'custom_check', check: 'assert_gigs_slot_cards' }
    },
    {
      id: 'step-6',
      title: '6. Filter: 🟢 Live Marketplace Gigs',
      action: 'click',
      selector: '#filterBtnLive',
      assertion: { type: 'custom_check', check: 'assert_gigs_filter_live' }
    },
    {
      id: 'step-7',
      title: '7. Filter: 🟣 Generated Gigs',
      action: 'click',
      selector: '#filterBtnGenerated',
      assertion: { type: 'custom_check', check: 'assert_gigs_filter_generated' }
    },
    {
      id: 'step-8',
      title: '8. Reset Filter to All Gigs',
      action: 'click',
      selector: '#filterBtnAll',
      assertion: { type: 'custom_check', check: 'assert_gigs_filter_all' }
    },
    {
      id: 'step-9',
      title: '9. Search Gig Stack / Tech: "Bolt"',
      action: 'input_text',
      selector: '#gigsSearchInput',
      value: 'Bolt',
      assertion: { type: 'custom_check', check: 'assert_gigs_search' }
    },
    {
      id: 'step-10',
      title: '10. Clear Search Input & Restore Grid',
      action: 'input_text',
      selector: '#gigsSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_gigs_search_cleared' }
    },
    {
      id: 'step-11',
      title: '11. Open Copy Studio (1st Gig Slot)',
      action: 'click',
      selector: '#gigsCardsGrid .gig-slot-card:first-child .btn-open-copy-studio, #gigsCardsGrid .gig-slot-card:first-child button[onclick*="openCopyStudio"]',
      assertion: { type: 'modal_open', selector: '#gigStudioModalOverlay' }
    },
    {
      id: 'step-12',
      title: '12. Copy Studio: Tab 2 (Pricing Matrix)',
      action: 'click',
      selector: '#copyStudioTabBtn2',
      assertion: { type: 'wait_selector', selector: '#gigStudioModalContent table', timeout: 3000 }
    },
    {
      id: 'step-13',
      title: '13. Copy Studio: Tab 3 (Description & FAQ)',
      action: 'click',
      selector: '#copyStudioTabBtn3',
      assertion: { type: 'wait_selector', selector: 'button[onclick*="copyAllFaqs"]', timeout: 3000 }
    },
    {
      id: 'step-14',
      title: '14. Copy Studio: Tab 6 (Publish & Link Live URL)',
      action: 'click',
      selector: '#copyStudioTabBtn6',
      assertion: { type: 'wait_selector', selector: '#liveGigUrlInput', timeout: 3000 }
    },
    {
      id: 'step-15',
      title: '15. Dismiss Copy Studio via ✕ Button',
      action: 'click',
      selector: '#btnCloseCopyStudio',
      assertion: { type: 'modal_closed', selector: '#gigStudioModalOverlay' }
    },
    {
      id: 'step-16',
      title: '16. Open 10-Point Health Audit Inspector',
      action: 'click',
      selector: '#gigsCardsGrid .gig-slot-card:first-child .btn-open-health-inspector, #gigsCardsGrid .gig-slot-card:first-child button[onclick*="openHealthInspector"]',
      assertion: { type: 'modal_open', selector: '#gigHealthModalOverlay' }
    },
    {
      id: 'step-17',
      title: '17. Dismiss Health Inspector via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#gigHealthModalOverlay' }
    },
    {
      id: 'step-18',
      title: '18. Reopen Copy Studio for Backdrop Test',
      action: 'click',
      selector: '#gigsCardsGrid .gig-slot-card:first-child .btn-open-copy-studio, #gigsCardsGrid .gig-slot-card:first-child button[onclick*="openCopyStudio"]',
      assertion: { type: 'modal_open', selector: '#gigStudioModalOverlay' }
    },
    {
      id: 'step-20',
      title: '20. Reopen Copy Studio to Test Tabs 4 & 5',
      action: 'click',
      selector: '#gigsCardsGrid .gig-slot-card:first-child .btn-open-copy-studio, #gigsCardsGrid .gig-slot-card:first-child button[onclick*="openCopyStudio"]',
      assertion: { type: 'modal_open', selector: '#gigStudioModalOverlay' }
    },
    {
      id: 'step-21',
      title: '21. Copy Studio: Tab 4 (Key Highlights & Requirements)',
      action: 'click',
      selector: '#copyStudioTabBtn4',
      assertion: { type: 'custom_check', check: 'assert_gigs_studio_tab4' }
    },
    {
      id: 'step-22',
      title: '22. Copy Studio: Tab 5 (Portfolio Gallery & Media)',
      action: 'click',
      selector: '#copyStudioTabBtn5',
      assertion: { type: 'custom_check', check: 'assert_gigs_studio_tab5' }
    },
    {
      id: 'step-23-pre',
      title: '23a. Dismiss Copy Studio before audit',
      action: 'click',
      selector: '#btnCloseCopyStudio',
      assertion: { type: 'modal_closed', selector: '#gigStudioModalOverlay' }
    },
    {
      id: 'step-23',
      title: '23. Verify window.switchGigsCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_gigs_currency_alias' }
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
  window.GIGS_QA_SUITE = GIGS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GIGS_QA_SUITE };
}
