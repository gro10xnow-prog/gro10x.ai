/**
 * DigiVault Commerce & Subscriptions QA Test Suite (#digistore)
 * 19-Step Comprehensive Automated Validation
 */

const DIGISTORE_QA_SUITE = {
  id: 'digistore',
  name: 'DigiVault Subs & Commerce QA Suite',
  platform: 'admin',
  targetHash: '#digistore',
  description: 'Validates 9 command tabs, 6 master KPIs, order logging, blind WhatsApp procurement, delivery queue SLA clocks, customer CRM, product catalog search, modal lifecycles, multi-currency engine, and zero native dialogs policy.',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to DigiVault Commerce & Subscriptions',
      action: 'navigate_hash',
      target: '#digistore',
      assertion: {
        type: 'custom_check',
        check: 'assert_digistore_mounted'
      }
    },
    {
      id: 'step-02',
      title: '2. Verify 6 Master KPI Metrics Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_digistore_kpis'
      }
    },
    {
      id: 'step-03',
      title: '3. Verify 9 Navigation Command Tabs Rendered in Nav Bar',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_digistore_tabs'
      }
    },
    {
      id: 'step-04',
      title: '4. Verify Orders Pipeline Tab Active',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="orders"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_orders_tab_active'
      }
    },
    {
      id: 'step-05',
      title: '5. Filter Orders Pipeline by Status',
      action: 'click',
      selector: '#orderFilterChips button:nth-child(2)',
      assertion: {
        type: 'custom_check',
        check: 'assert_orders_filter'
      }
    },
    {
      id: 'step-06',
      title: '6. Switch to Delivery Queue Tab — Verify SLA Clocks',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="delivery"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_delivery_tab_active'
      }
    },
    {
      id: 'step-07',
      title: '7. Switch to Customers CRM Tab — Verify Customer Directory',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="customers"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_customers_tab_active'
      }
    },
    {
      id: 'step-08',
      title: '8. Switch to Products Catalog Tab — Verify 44+ Subscriptions',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="products"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_products_tab_active'
      }
    },
    {
      id: 'step-09',
      title: '9. Filter Catalog by Search Term ("Netflix")',
      action: 'filter_catalog_search',
      selector: '#inputSearchProducts',
      searchTerm: 'Netflix',
      assertion: {
        type: 'custom_check',
        check: 'assert_catalog_search'
      }
    },
    {
      id: 'step-10',
      title: '10. Open Add Product Modal & Dismiss via Escape Key',
      action: 'open_product_modal_and_escape',
      selector: '#btnNewDigiProduct',
      modalSelector: '#newProductModal',
      assertion: {
        type: 'custom_check',
        check: 'assert_new_product_modal_lifecycle'
      }
    },
    {
      id: 'step-11',
      title: '11. Switch to Verified Suppliers Tab — Verify Supplier Cards',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="vendors"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_vendors_tab_active'
      }
    },
    {
      id: 'step-12',
      title: '12. Switch to Renewals Engine Tab — Verify Retention Checks',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="renewals"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_renewals_tab_active'
      }
    },
    {
      id: 'step-13',
      title: '13. Switch to Profit Analytics Tab — Verify Commerce Intelligence',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="analytics"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_analytics_tab_active'
      }
    },
    {
      id: 'step-14',
      title: '14. Switch to Social & Link Studio Tab — Verify Post Generator',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="social"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_social_tab_active'
      }
    },
    {
      id: 'step-15',
      title: '15. Switch to Full Link Manager Tab — Verify UTM Shortlinks',
      action: 'click',
      selector: '#digiNavTabs button[data-tab="links"]',
      assertion: {
        type: 'custom_check',
        check: 'assert_links_tab_active'
      }
    },
    {
      id: 'step-16',
      title: '16. Open Log Order Modal & Dismiss via Backdrop Click',
      action: 'open_order_modal_and_dismiss',
      selector: '#btnNewDigiOrder',
      modalSelector: '#newOrderModal',
      assertion: {
        type: 'custom_check',
        check: 'assert_order_modal_lifecycle'
      }
    },
    {
      id: 'step-17',
      title: '17. Currency Toggle: USD ($) & BDT (৳) — Verify Currency Engine',
      action: 'click',
      selector: '#digistoreCurrencyToggleBtn',
      world: 'MAIN',
      assertion: {
        type: 'custom_check',
        check: 'assert_digistore_currency_toggle'
      }
    },
    {
      id: 'step-18',
      title: '18. Final Clean Audit — 0 Native Dialogs, 0 Unhandled Rejections',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_clean_audit'
      }
    },
    {
      id: 'step-19',
      title: '19. DCE Omnichannel Orders Realtime & Persistence Verification',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_dce_orders_persistence'
      }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.DIGISTORE_QA_SUITE = DIGISTORE_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DIGISTORE_QA_SUITE };
}
