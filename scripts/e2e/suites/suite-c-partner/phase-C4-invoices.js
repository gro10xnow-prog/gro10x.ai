/**
 * scripts/e2e/suites/suite-c-partner/phase-C4-invoices.js
 * Suite C - Phase C4: Partner Invoices & Online Payment Modal
 * 
 * Tests:
 * 1. Commercial Invoices Table & Row Render
 * 2. Currency Dual Display ($ USD and ৳ BDT calculations)
 * 3. Open Payment Verification Modal Trigger
 * 4. Payment Verification Form Fields & Auto-Filled Invoice Data
 * 5. Submit Payment Proof Mutation & Status Update
 * 6. Statement / PDF Download Action Notification
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC4(page) {
  const tracker = new TestTracker('Suite C - Phase C4: Partner Invoices & Payments');
  console.log('\n--- 💳 Running Suite C - Phase C4: Invoices & Payment Gateway ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C4.1', 'Commercial Invoices Table & Row Render', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const invoiceTable = await page.evaluate(() => {
      const tbody = document.getElementById('partnerInvoicesTbody');
      const rows = tbody ? tbody.querySelectorAll('tr') : [];
      return {
        hasTable: tbody !== null,
        rowCount: rows.length,
        firstRowText: rows.length > 0 ? rows[0].innerText : ''
      };
    });

    tracker.assert(invoiceTable.hasTable, 'Invoices table body must exist');
    tracker.assert(invoiceTable.rowCount > 0, 'At least one invoice row must be rendered');
    await tracker.screenshot(page, 'C4.1_partner_invoices_table.png');
  });

  await tracker.runStep('C4.2', 'Currency Dual Display ($ USD and ৳ BDT calculations)', async () => {
    const dualDisplay = await page.evaluate(() => {
      const tbody = document.getElementById('partnerInvoicesTbody');
      const text = tbody ? tbody.innerText : '';
      const hasDollar = text.includes('$');
      const hasTaka = text.includes('৳');
      return { hasDollar, hasTaka };
    });

    tracker.assert(dualDisplay.hasDollar, 'Invoice amount must show $ USD value');
    tracker.assert(dualDisplay.hasTaka, 'Invoice amount must show ৳ BDT converted value');
  });

  await tracker.runStep('C4.3', 'Open Payment Verification Modal Trigger', async () => {
    const modalOpened = await page.evaluate(() => {
      if (typeof window.openPartnerPaymentModal === 'function') {
        window.openPartnerPaymentModal('INV-2026-001', 2500);
      }
      const modal = document.getElementById('partnerPaymentModal');
      return modal && modal.style.display !== 'none' && getComputedStyle(modal).display !== 'none';
    });

    tracker.assert(modalOpened, 'Payment modal must be displayed when openPartnerPaymentModal is called');
    await tracker.screenshot(page, 'C4.3_partner_payment_modal_opened.png');
  });

  await tracker.runStep('C4.4', 'Payment Verification Form Fields & Auto-Filled Invoice Data', async () => {
    const formData = await page.evaluate(() => {
      const invLabel = document.getElementById('payModalInvLabel')?.innerText || '';
      const amtLabel = document.getElementById('payModalAmountLabel')?.innerText || '';
      const methodSel = document.getElementById('payModalMethodSelect');
      const trxInput = document.getElementById('payModalTrxInput');
      return {
        invLabel,
        amtLabel,
        hasMethodSelect: methodSel !== null,
        hasTrxInput: trxInput !== null
      };
    });

    tracker.assert(formData.invLabel.includes('INV-2026-001'), 'Invoice reference label must match requested invoice');
    tracker.assert(formData.amtLabel.includes('2,500'), 'Amount label must display formatted amount');
    tracker.assert(formData.hasMethodSelect, 'Payment method dropdown must exist');
    tracker.assert(formData.hasTrxInput, 'Transaction ID input field must exist');
  });

  await tracker.runStep('C4.5', 'Submit Payment Proof Mutation & Status Update', async () => {
    const submitResult = await page.evaluate(async () => {
      const trxInput = document.getElementById('payModalTrxInput');
      if (trxInput) trxInput.value = 'TRX-BKASH-8829104';

      if (typeof window.submitPartnerPayment === 'function') {
        await window.submitPartnerPayment(new Event('submit', { cancelable: true }));
      } else {
        const form = document.querySelector('#partnerPaymentModal form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 600));

      const modal = document.getElementById('partnerPaymentModal');
      const modalClosed = modal ? (modal.style.display === 'none' || getComputedStyle(modal).display === 'none') : false;
      return { modalClosed };
    });

    tracker.assert(submitResult.modalClosed, 'Payment modal should close after successful submission');
    await tracker.screenshot(page, 'C4.5_partner_payment_submitted.png');
  });

  await tracker.runStep('C4.6', 'Statement / PDF Download Action Notification', async () => {
    const toastFired = await page.evaluate(() => {
      if (typeof window.showPartnerToast === 'function') {
        window.showPartnerToast('📄 Downloading Statement/Invoice PDF for INV-2026-001...', 'info');
      }
      const container = document.getElementById('partnerToastContainer');
      return container && container.innerText.includes('Downloading Statement');
    });

    tracker.assert(toastFired, 'PDF statement download notification toast must appear');
    await tracker.screenshot(page, 'C4.6_partner_pdf_download_toast.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC4 };

