/**
 * Physical Hardware Assets & Equipment Command QA Test Suite (#assets)
 * 18-Step Comprehensive Automated Validation
 */

const ASSETS_QA_SUITE = {
  id: 'assets',
  name: 'Hardware Assets QA Suite',
  platform: 'admin',
  targetHash: '#assets',
  description: 'Validates hardware asset inventory, 4 master KPIs, 5 category filter tabs, equipment checkout/return flow, edit asset modal lifecycle, add asset modal with backdrop dismissal, Escape key handler, multi-currency engine, and zero native dialogs policy.',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to Physical Hardware Assets',
      action: 'navigate_hash',
      target: '#assets',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_mounted'
      }
    },
    {
      id: 'step-02',
      title: '2. Verify 4 Master KPI Metrics Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_kpis'
      }
    },
    {
      id: 'step-03',
      title: '3. Verify 5 Category Filter Tabs Rendered in Nav Bar',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_tabs'
      }
    },
    {
      id: 'step-04',
      title: '4. Verify All Items Category Active & Table Rows Rendered',
      action: 'click',
      selector: '#btnAssetCatAll',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_all_active'
      }
    },
    {
      id: 'step-05',
      title: '5. Filter Category: Laptop & PC (Workstations & MacBooks)',
      action: 'click',
      selector: '#btnAssetCatLaptop',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_cat_laptop'
      }
    },
    {
      id: 'step-06',
      title: '6. Filter Category: Camera & Cinema (Sony FX3 & Cinema Line)',
      action: 'click',
      selector: '#btnAssetCatCamera',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_cat_camera'
      }
    },
    {
      id: 'step-07',
      title: '7. Filter Category: Lighting & Audio (Studio Mics & Key Lights)',
      action: 'click',
      selector: '#btnAssetCatLighting',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_cat_lighting'
      }
    },
    {
      id: 'step-08',
      title: '8. Filter Category: Office & Furniture (Ergonomic Chairs)',
      action: 'click',
      selector: '#btnAssetCatOffice',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_cat_office'
      }
    },
    {
      id: 'step-09',
      title: '9. Reset Filter to All Items — Verify Full Inventory Restored',
      action: 'click',
      selector: '#btnAssetCatAll',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_reset_all'
      }
    },
    {
      id: 'step-10',
      title: '10. Open Check Out Equipment Modal for Unassigned Item',
      action: 'click',
      selector: '.btn-checkout-asset',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_checkout_modal_opened'
      }
    },
    {
      id: 'step-11',
      title: '11. Verify Check Out Form Fields & Dismiss via Cancel Button',
      action: 'click',
      selector: '#btnCancelCheckoutAssetModal',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_checkout_modal_dismissed'
      }
    },
    {
      id: 'step-12',
      title: '12. Open Edit Hardware Modal for Primary Workstation',
      action: 'click',
      selector: '.btn-edit-asset',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_edit_modal_opened'
      }
    },
    {
      id: 'step-13',
      title: '13. Verify Edit Modal Form Fields & Dismiss via Escape Key',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_edit_modal_escape'
      }
    },
    {
      id: 'step-14',
      title: '14. Open Log New Hardware Asset Modal',
      action: 'click',
      selector: '#btnOpenAddAssetModal',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_add_modal_opened'
      }
    },
    {
      id: 'step-15',
      title: '15. Verify Log Hardware Form Fields Rendered',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_add_modal_fields'
      }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Log Hardware Modal via Backdrop Click',
      action: 'none',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_add_modal_dismissed'
      }
    },
    {
      id: 'step-17',
      title: '17. Currency Toggle: BDT (৳) & USD ($) — Verify Currency Engine',
      action: 'click',
      selector: '#assetsCurrencyToggleBtn',
      assertion: {
        type: 'custom_check',
        check: 'assert_assets_currency_toggle'
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
    }
  ]
};

if (typeof window !== 'undefined') {
  window.ASSETS_QA_SUITE = ASSETS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ASSETS_QA_SUITE };
}
