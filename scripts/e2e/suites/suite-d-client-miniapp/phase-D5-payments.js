/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D5-payments.js
 * Suite D - Phase D5: Commercial Invoices & Online Payment Modal
 * 
 * Tests:
 * 1. Navigate to Payments Page & Active Tab Highlight
 * 2. Active Invoice Amount Due Card & Reference Numbers
 * 3. Payment Method Switcher (bKash, Nagad, Bank, Rocket chips)
 * 4. Payment Instructions Box & Dynamic Account Information
 * 5. Transaction Reference & Payment Date Form Entry
 * 6. Invoice History List & Commercial Status Badges
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD5(page) {
  const tracker = new TestTracker('Suite D - Phase D5: Client Payments & Billing');
  console.log('\n--- 💳 Running Suite D - Phase D5: Payments & Invoices ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D5.1', 'Navigate to Payments Page & Active Tab Highlight', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navSuccess = await page.evaluate(async () => {
      if (typeof window.showPage === 'function') {
        window.showPage('pagePayment');
      }
      if (typeof window.loadInvoices === 'function') {
        await window.loadInvoices();
      }
      const pageEl = document.getElementById('pagePayment');
      const navBtn = document.getElementById('navPayment');
      return {
        isPageActive: pageEl && pageEl.classList.contains('active'),
        isNavActive: navBtn && navBtn.classList.contains('active')
      };
    });

    tracker.assert(navSuccess.isPageActive, 'Payment page should become active');
    tracker.assert(navSuccess.isNavActive, 'Payment nav button should be highlighted active');
    await tracker.screenshot(page, 'D5.1_miniapp_payment_page.png');
  });

  await tracker.runStep('D5.2', 'Active Invoice Amount Due Card & Reference Numbers', async () => {
    const invCard = await page.evaluate(() => {
      const sec = document.getElementById('activeInvoiceSection');
      const amt = document.getElementById('invAmount')?.innerText || '';
      const id = document.getElementById('invId')?.innerText || '';
      return {
        isSectionVisible: sec && sec.style.display !== 'none',
        hasAmt: amt.includes('BDT'),
        hasId: id.includes('Invoice')
      };
    });

    tracker.assert(invCard.isSectionVisible, 'Active invoice payment card must be visible');
    tracker.assert(invCard.hasAmt, 'Invoice amount due must show BDT currency');
    tracker.assert(invCard.hasId, 'Invoice reference ID must be displayed');
    await tracker.screenshot(page, 'D5.2_miniapp_amount_due.png');
  });

  await tracker.runStep('D5.3', 'Corporate Banking Settlement Rail (BRAC Bank PLC)', async () => {
    const bankChip = await page.evaluate(() => {
      const pmBank = document.getElementById('pmBank');
      const isSelected = pmBank ? pmBank.classList.contains('selected') : false;
      const label = pmBank?.textContent || '';
      return {
        exists: pmBank !== null,
        isSelected,
        hasBrac: label.includes('BRAC Bank') || label.includes('Corporate Bank')
      };
    });

    tracker.assert(bankChip.exists, '#pmBank payment method chip must exist');
    tracker.assert(bankChip.isSelected, 'Corporate Bank wire transfer must be selected');
    tracker.assert(bankChip.hasBrac, 'Corporate settlement rail must reference BRAC Bank Limited');
    await tracker.screenshot(page, 'D5.3_miniapp_bank_selected.png');
  });

  await tracker.runStep('D5.4', 'Payment Instructions Box & BRAC Bank Institutional Settlement Details', async () => {
    const instructions = await page.evaluate(() => {
      const box = document.getElementById('paymentInstructions');
      const text = document.getElementById('payInstrText')?.innerText || '';
      return { hasBox: box !== null, text };
    });

    tracker.assert(instructions.hasBox, 'Payment instructions card must exist');
    tracker.assert(
      instructions.text.includes('Neoncore Tech Solution') &&
      instructions.text.includes('2081636480001') &&
      instructions.text.includes('060263290'),
      'Instructions must display official BRAC Bank details (Neoncore Tech Solution, 2081636480001, Mohakhali / 060263290)'
    );
  });

  await tracker.runStep('D5.5', 'Transaction Reference & Payment Date Form Entry', async () => {
    const formFilled = await page.evaluate(() => {
      const txnInput = document.getElementById('inpTxnId');
      const amtInput = document.getElementById('inpAmtPaid');
      if (txnInput) txnInput.value = 'NGD-992810482';
      if (amtInput) amtInput.value = '150000';
      return {
        txn: txnInput ? txnInput.value : '',
        amt: amtInput ? amtInput.value : ''
      };
    });

    tracker.assert(formFilled.txn.includes('NGD-992810482'), 'Transaction reference field should be populated');
    tracker.assert(formFilled.amt === '150000', 'Amount paid field should be populated');
    await tracker.screenshot(page, 'D5.5_miniapp_payment_form.png');
  });

  await tracker.runStep('D5.6', 'Invoice History List & Commercial Status Badges', async () => {
    const historyList = await page.evaluate(() => {
      const list = document.getElementById('invoiceList');
      const items = list ? list.querySelectorAll('.invoice-item') : [];
      return { hasList: list !== null, count: items.length };
    });

    tracker.assert(historyList.hasList, 'Invoice history list container must exist');
    tracker.assert(historyList.count > 0, 'At least one historical invoice item must be listed');
    await tracker.screenshot(page, 'D5.6_miniapp_invoice_history.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD5 };
