/**
 * PlannerQueenGro Members Vault & GroCredits Universal Wallet QA Suite (12 Steps)
 * Validates activation view, 1-click instant demo access, dashboard view,
 * PLA-14 active license, wallet KPIs, transaction ledger, companion unlock modal,
 * and zero native dialogs policy.
 */

const MY_PORTAL_QA_SUITE = {
  id: 'my-portal',
  platform: 'public',
  title: 'PlannerQueenGro Members Vault & GroCredits QA Suite',
  targetPath: '/my-portal',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to Customer Vault (/my-portal)',
      action: 'navigate_url',
      target: '/my-portal',
      assertion: { type: 'wait_selector', selector: '.brand-title, .portal-header', timeout: 5000 }
    },
    {
      id: 'step-02',
      title: '2. Verify Header Branding & Nav Links',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '.brand-title, .portal-nav a[href*="/dce/store"]', timeout: 3000 }
    },
    {
      id: 'step-03',
      title: '3. Verify Activation Form & Input Fields Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#inputCode, #inputEmail, #btnSubmitActivation, #btnInstantDemo', timeout: 3000 }
    },
    {
      id: 'step-04',
      title: '4. Trigger 1-Click Instant Demo Vault Access',
      action: 'click',
      selector: '#btnInstantDemo',
      assertion: { type: 'wait_selector', selector: '#dashboardView, #userGreeting, #heroCreditBal', timeout: 6000 }
    },
    {
      id: 'step-05',
      title: '5. Verify Member Dashboard & Welcome Hero Mounted',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'wait_selector', selector: '#userGreeting, #userTier, #headerRight', timeout: 3000 }
    },
    {
      id: 'step-06',
      title: '6. Verify Universal Credit Pill in Header & Hero Banner',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#headerCreditBal, #heroCreditBal', timeout: 3000 }
    },
    {
      id: 'step-07',
      title: '7. Verify Digital Products Vault Grid & PLA-14 Master Card',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'wait_selector', selector: '#productsVaultGrid, #card-pla-14, .btn-primary-action[href*="/planner/"]', timeout: 3000 }
    },
    {
      id: 'step-08',
      title: '8. Verify Universal Credit Wallet KPIs (Balance & Lifetime)',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#walletBalance, #walletLifetime, #walletTier', timeout: 3000 }
    },
    {
      id: 'step-09',
      title: '9. Verify Transactions Ledger Table & Activity History',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#txnsTableBody tr', timeout: 3000 }
    },
    {
      id: 'step-10',
      title: '10. Trigger Companion Product Unlock Modal (#btnUnlockPla15)',
      action: 'click',
      selector: '#btnUnlockPla15',
      assertion: { type: 'wait_selector', selector: '#portalModalOverlay, #portalModalConfirmBtn', timeout: 4000 }
    },
    {
      id: 'step-11',
      title: '11. Dismiss Confirmation Modal via Cancel Button',
      action: 'click',
      selector: '#portalModalCancelBtn',
      assertion: { type: 'wait_ms', duration: 300 }
    },
    {
      id: 'step-12',
      title: '12. Final Clean Audit — 0 Native Dialogs, 0 Unhandled Rejections',
      action: 'none',
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.MY_PORTAL_QA_SUITE = MY_PORTAL_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MY_PORTAL_QA_SUITE };
}
