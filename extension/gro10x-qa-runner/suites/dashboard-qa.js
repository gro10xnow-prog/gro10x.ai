/**
 * Executive Overview Tab QA Automation Suite (26 Steps)
 * Added: DCE Launch Card, Engine2 Studio Card, Net Profit KPI tile, View Leads CTA,
 *        Leads table, Invoices table, Growth Engines hero link, Sprint Board link
 */

const DASHBOARD_QA_SUITE = {
  id: 'dashboard',
  platform: 'admin',
  title: 'Executive Overview Tab QA Suite',
  targetHash: '#dashboard',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Executive Overview',
      action: 'navigate_hash',
      target: '#dashboard',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: 'button[onclick*="switchModuleCurrency(\'BDT\')"]',
      assertion: { type: 'custom_check', check: 'assert_bdt_mode' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to USD ($)',
      action: 'click',
      selector: 'button[onclick*="switchModuleCurrency(\'USD\')"]',
      assertion: { type: 'custom_check', check: 'assert_usd_mode' }
    },
    {
      id: 'step-4',
      title: '4. Engine Card 1: Micro-SaaS',
      action: 'click',
      selector: 'a[href="#platforms"]',
      assertion: { type: 'hash_equals', expected: '#platforms' }
    },
    {
      id: 'step-5',
      title: '5. Engine Card 2: Platform Revenue',
      action: 'click',
      selector: 'a[href="#engines"]',
      assertion: { type: 'hash_equals', expected: '#engines' }
    },
    {
      id: 'step-6',
      title: '6. Engine Card 3: Digital Assets (DCE)',
      action: 'click',
      selector: 'a[href="/dce"], a[href*="dce"], a[href="#digistore"], a[href="#brands"]',
      assertion: { type: 'custom_check', check: 'assert_engine3_dce_link' }
    },
    {
      id: 'step-7',
      title: '7. Engine Card 4: Agency OS Studio',
      action: 'click',
      selector: 'a[href="#crm"]',
      assertion: { type: 'hash_equals', expected: '#crm' }
    },
    {
      id: 'step-8',
      title: '8. Engine Card 5: Video & Media',
      action: 'click',
      selector: 'a[href="#content-os"]',
      assertion: { type: 'hash_equals', expected: '#content-os' }
    },
    {
      id: 'step-9',
      title: '9. Return to Executive Overview',
      action: 'navigate_hash',
      target: '#dashboard',
      assertion: { type: 'wait_selector', selector: '.kpi-tile', timeout: 5000 }
    },
    {
      id: 'step-10',
      title: '10. KPI Tile: Lean Expense Cap',
      action: 'click',
      selector: 'a.kpi-tile[href="#finance"]',
      assertion: { type: 'hash_equals', expected: '#finance' }
    },
    {
      id: 'step-11',
      title: '11. KPI Tile: Pipeline Lead Value',
      action: 'navigate_and_click',
      prepHash: '#dashboard',
      selector: 'a.kpi-tile[href="#leads"]',
      assertion: { type: 'hash_equals', expected: '#leads' }
    },
    {
      id: 'step-12',
      title: '12. KPI Tile: Active Sprint Tasks',
      action: 'navigate_and_click',
      prepHash: '#dashboard',
      selector: 'a.kpi-tile[href="#kanban"]',
      assertion: { type: 'hash_equals', expected: '#kanban' }
    },
    {
      id: 'step-13',
      title: '13. Header Action: 📋 New Task Dispatcher',
      action: 'navigate_and_click',
      prepHash: '#dashboard',
      selector: 'a[title*="Production Pipeline Hub"]',
      assertion: { type: 'hash_equals', expected: '#kanban' }
    },
    {
      id: 'step-14',
      title: '14. Header Action: 🧾 New Invoice Dispatcher',
      action: 'navigate_and_click',
      prepHash: '#dashboard',
      selector: 'a[title*="Create New Client Invoice"]',
      assertion: { type: 'hash_equals', expected: '#finance' }
    },
    {
      id: 'step-15',
      title: '15. Verify Invoices Client Name Resolution',
      action: 'navigate_hash',
      target: '#dashboard',
      assertion: { type: 'custom_check', check: 'assert_invoice_client_names' }
    },
    {
      id: 'step-16',
      title: '16. Verify WhatsApp Quick Contact 88 Country Code',
      action: 'custom_check',
      assertion: { type: 'custom_check', check: 'assert_whatsapp_country_code' }
    },
    {
      id: 'step-17',
      title: '17. Verify Action Center Button Sign-Off States',
      action: 'custom_check',
      assertion: { type: 'custom_check', check: 'assert_action_center_buttons' }
    },
    {
      id: 'step-18',
      title: '18. Verify Empty-State CTA Global Handler',
      action: 'custom_check',
      world: 'MAIN',
      assertion: { type: 'custom_check', check: 'assert_open_invoice_modal_exists' }
    },
    {
      id: 'step-19',
      title: '19. Verify DCE Commerce Command Hub Card Rendered',
      action: 'navigate_hash',
      target: '#dashboard',
      assertion: { type: 'element_exists', selector: 'a[title*="Open Unified Order Inbox"], a[href="/dce/orders"]' }
    },
    {
      id: 'step-20',
      title: '20. DCE Card: 🛒 Order Inbox Link Present',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: 'a[href="/dce/orders"], a[title*="Unified Order Inbox"]' }
    },
    {
      id: 'step-21',
      title: '21. DCE Card: 🏪 DigiVault Ops Link Present',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: 'a[href="/dce/digivault"], a[title*="DigiVault Subscription"]' }
    },
    {
      id: 'step-22',
      title: '22. Engine 2 Studio Card: Sprint Board Link Present',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: 'a[href="#kanban"][title*="Sprint Board"], a[title*="Engine 2 Sprint Board"]' }
    },
    {
      id: 'step-23',
      title: '23. Engine 2 Studio Card: Handover Shield Link Present',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: 'a[href="/handover-view.html"], a[title*="Handover Shield"]' }
    },
    {
      id: 'step-24',
      title: '24. KPI Tile: Target Net Profit → #finance',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'element_exists', selector: 'a.kpi-tile[href="#finance"], .kpi-tile[title*="Net Margin"], .kpi-tile[title*="Net Profit"]' }
    },
    {
      id: 'step-25',
      title: '25. Header: 🚀 Growth Engines Link → #engines',
      action: 'navigate_and_click',
      prepHash: '#dashboard',
      selector: 'a[href="#engines"][title*="Growth Operations"], a.btn-secondary[href="#engines"]',
      assertion: { type: 'custom_check', check: 'assert_dashboard_engines_link' }
    },
    {
      id: 'step-26',
      title: '26. Zero-Error Runtime Health Audit',
      action: 'navigate_hash',
      target: '#dashboard',
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.DASHBOARD_QA_SUITE = DASHBOARD_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DASHBOARD_QA_SUITE };
}
