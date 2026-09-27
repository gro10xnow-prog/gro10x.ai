/**
 * Financial Intelligence, Invoices & Expense Command QA Automation Suite (18 Steps)
 * Invoicing, multi-currency scopes, expenses, verifications, and quote conversion (#finance)
 */

const FINANCE_QA_SUITE = {
  id: 'finance',
  platform: 'admin',
  title: 'Financials & Expense Command QA Suite',
  targetHash: '#finance',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Financials & Expense Command',
      action: 'navigate_hash',
      target: '#finance',
      assertion: { type: 'wait_selector', selector: 'h1', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 4 KPI Metrics Rendered',
      action: 'wait_ms',
      duration: 700,
      assertion: { type: 'custom_check', check: 'assert_finance_kpi_strip' }
    },
    {
      id: 'step-3',
      title: '3. Currency Toggle to BDT (৳)',
      action: 'click',
      selector: '#financeCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_finance_bdt' }
    },
    {
      id: 'step-4',
      title: '4. Currency Toggle to USD ($)',
      action: 'click',
      selector: '#financeCurrencyToggleBtn',
      assertion: { type: 'custom_check', check: 'assert_finance_usd' }
    },
    {
      id: 'step-5',
      title: '5. Verify Invoices Data Table Loaded',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'custom_check', check: 'assert_finance_invoices_table' }
    },
    {
      id: 'step-6',
      title: '6. Filter Invoices: Pending Status',
      action: 'click',
      selector: 'button[onclick*="setInvoiceFilter(\'pending\')"]',
      assertion: { type: 'custom_check', check: 'assert_finance_filter_pending' }
    },
    {
      id: 'step-7',
      title: '7. Filter Invoices: Reset to All Invoices',
      action: 'click',
      selector: 'button[onclick*="setInvoiceFilter(\'all\')"]',
      assertion: { type: 'custom_check', check: 'assert_finance_filter_all' }
    },
    {
      id: 'step-8',
      title: '8. Search Invoices: Input Search Query',
      action: 'input_text',
      selector: '#invoiceSearchInput',
      value: 'a',
      assertion: { type: 'custom_check', check: 'assert_finance_search_active' }
    },
    {
      id: 'step-9',
      title: '9. Clear Search Query & Restore Directory',
      action: 'input_text',
      selector: '#invoiceSearchInput',
      value: '',
      assertion: { type: 'custom_check', check: 'assert_finance_search_cleared' }
    },
    {
      id: 'step-10',
      title: '10. Switch Subtab: Expense Queue',
      action: 'click',
      selector: '#subtabExpenses',
      assertion: { type: 'custom_check', check: 'assert_finance_expenses_tab' }
    },
    {
      id: 'step-11',
      title: '11. Switch Subtab: Price Quotes',
      action: 'click',
      selector: '#subtabQuotes',
      assertion: { type: 'custom_check', check: 'assert_finance_quotes_tab' }
    },
    {
      id: 'step-12',
      title: '12. Switch Back to Invoices Subtab',
      action: 'click',
      selector: '#subtabInvoices',
      assertion: { type: 'custom_check', check: 'assert_finance_invoices_table' }
    },
    {
      id: 'step-13',
      title: '13. Open Create Client Invoice Modal',
      action: 'click',
      selector: '#btnOpenCreateInvoice',
      assertion: { type: 'modal_open', selector: '#invoiceModal' }
    },
    {
      id: 'step-14',
      title: '14. Dismiss Invoice Modal via Escape Key',
      action: 'press_key',
      key: 'Escape',
      assertion: { type: 'modal_closed', selector: '#invoiceModal' }
    },
    {
      id: 'step-15',
      title: '15. Open Log Expense Claim Modal',
      action: 'click',
      selector: '#btnOpenExpenseModal',
      assertion: { type: 'modal_open', selector: '#expModal' }
    },
    {
      id: 'step-16',
      title: '16. Dismiss Expense Modal via Backdrop Click',
      action: 'click_backdrop',
      selector: '#expModal',
      assertion: { type: 'modal_closed', selector: '#expModal' }
    },
    {
      id: 'step-17',
      title: '17. Verify window.switchFinanceCurrency Global Alias',
      action: 'wait_ms',
      duration: 200,
      assertion: { type: 'custom_check', check: 'assert_finance_currency_alias' }
    },
    {
      id: 'step-19',
      title: '19. Switch to Payments Subtab & Verify Content',
      action: 'click',
      selector: '#subtabPayments',
      assertion: { type: 'custom_check', check: 'assert_finance_payments_subtab' }
    },
    {
      id: 'step-20',
      title: '20. Switch to Expenses Subtab & Filter: Pending',
      action: 'click',
      selector: '#subtabExpenses',
      assertion: { type: 'custom_check', check: 'assert_finance_expenses_subtab' }
    },
    {
      id: 'step-21',
      title: '21. Expense Filter: Pending Claims',
      action: 'click',
      selector: 'button[onclick*="setExpenseFilter(\'pending\')"]',
      assertion: { type: 'custom_check', check: 'assert_finance_expense_filter_active' }
    },
    {
      id: 'step-22',
      title: '22. Expense Filter: Reset to All',
      action: 'click',
      selector: 'button[onclick*="setExpenseFilter(\'all\')"]',
      assertion: { type: 'custom_check', check: 'assert_finance_expense_filter_active' }
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
  window.FINANCE_QA_SUITE = FINANCE_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FINANCE_QA_SUITE };
}