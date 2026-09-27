/**
 * GRO10X QA Suite - Agency Analytics & Intelligence (#analytics)
 * 18 automated steps covering: navigation, KPI cards, currency toggle,
 * timeframe selector, chart canvases, export dropdown, scorecards,
 * UTM donut, switchAnalyticsCurrency alias, clean audit.
 */

const ANALYTICS_QA_SUITE = {
  id: 'analytics',
  platform: 'admin',
  title: 'Agency Analytics & Intelligence QA Suite',
  targetHash: '#analytics',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Agency Analytics & Intelligence',
      action: 'navigate_hash',
      target: '#analytics',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 6 Top-Line KPI Cards Rendered',
      action: 'wait_ms',
      duration: 600,
      assertion: { type: 'custom_check', check: 'assert_analytics_kpi_cards' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#analyticsCurrencyBtn, button[onclick*="switchAnalyticsCurrency"], button[onclick*="toggleCurrency"]',
      assertion: { type: 'custom_check', check: 'assert_analytics_bdt' }
    },
    {
      id: 'step-4',
      title: '4. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#analyticsCurrencyBtn, button[onclick*="switchAnalyticsCurrency"], button[onclick*="toggleCurrency"]',
      assertion: { type: 'custom_check', check: 'assert_analytics_usd' }
    },
    {
      id: 'step-5',
      title: '5. Timeframe: Switch to Last 7 Days',
      action: 'select_option',
      selector: '#analyticsDaysSelect',
      value: '7',
      assertion: { type: 'custom_check', check: 'assert_analytics_timeframe', value: '7' }
    },
    {
      id: 'step-6',
      title: '6. Timeframe: Switch to Last 90 Days',
      action: 'select_option',
      selector: '#analyticsDaysSelect',
      value: '90',
      assertion: { type: 'custom_check', check: 'assert_analytics_timeframe', value: '90' }
    },
    {
      id: 'step-7',
      title: '7. Timeframe: Switch to All Time',
      action: 'select_option',
      selector: '#analyticsDaysSelect',
      value: '1825',
      assertion: { type: 'custom_check', check: 'assert_analytics_timeframe', value: '1825' }
    },
    {
      id: 'step-8',
      title: '8. Timeframe: Restore Last 30 Days',
      action: 'select_option',
      selector: '#analyticsDaysSelect',
      value: '30',
      assertion: { type: 'custom_check', check: 'assert_analytics_timeframe', value: '30' }
    },
    {
      id: 'step-9',
      title: '9. Verify Revenue Trend Chart Canvas',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'element_exists', selector: '#revTrendCanvas' }
    },
    {
      id: 'step-10',
      title: '10. Verify Task Throughput Chart Canvas',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'element_exists', selector: '#taskThroughputCanvas' }
    },
    {
      id: 'step-11',
      title: '11. Verify UTM Attribution Donut Chart Canvas',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'element_exists', selector: '#utmAttributionCanvas' }
    },
    {
      id: 'step-12',
      title: '12. Verify Department Scorecard Table Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'element_exists', selector: '#deptScorecardTbody' }
    },
    {
      id: 'step-13',
      title: '13. Verify Client Delivery Scorecard Table Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'element_exists', selector: '#clientScorecardTbody' }
    },
    {
      id: 'step-14',
      title: '14. Open Export Report Dropdown',
      action: 'click',
      selector: '#btnExportMenu, button[onclick*="toggleExportMenu"]',
      assertion: { type: 'custom_check', check: 'assert_export_dropdown_open' }
    },
    {
      id: 'step-15',
      title: '15. Dismiss Export Dropdown',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'custom_check', check: 'assert_export_dropdown_closed' }
    },
    {
      id: 'step-16',
      title: '16. Verify Refresh Button Exists & Clickable',
      action: 'click',
      selector: '#btnRefreshAnalytics, button[onclick*="refreshAnalytics"]',
      assertion: { type: 'element_exists', selector: '#btnRefreshAnalytics, button[onclick*="refreshAnalytics"]' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchAnalyticsCurrency Global Alias',
      action: 'wait_ms',
      duration: 100,
      assertion: { type: 'custom_check', check: 'assert_analytics_currency_alias' }
    },
    {
      id: 'step-18',
      title: '18. Final Audit: Zero Native Dialogs & Unhandled Rejections',
      action: 'wait_ms',
      duration: 100,
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.ANALYTICS_QA_SUITE = ANALYTICS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ANALYTICS_QA_SUITE };
}
