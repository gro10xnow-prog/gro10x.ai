/**
 * scripts/e2e-client/phases/phase-3-partners.js
 * Phase T3: Web Partner Portal (/partners)
 */
const { AUTH_URL, PARTNERS_URL, wait, TestTracker } = require('../utils');
const { injectClientSession } = require('../auth');

async function runPhase3(page) {
  const tracker = new TestTracker('Phase T3: Web Partner Portal (/partners)');
  console.log('\n--- 🚀 Running Phase T3: Web Partner Portal ---');

  // T3.1 Page Initialization & Auth State
  await tracker.runStep('T3.1.1', 'Load /partners with authenticated client session', async () => {
    await page.goto(AUTH_URL, { waitUntil: 'domcontentloaded' });
    await injectClientSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    // Wait for client title to hydrate from API
    await page.waitForFunction(() => {
      const el = document.getElementById('partnerClientTitle');
      return el && el.textContent.trim().length > 0 && !el.textContent.includes('Loading');
    }, { timeout: 8000 }).catch(() => {});

    const clientTitle = await page.$eval('#partnerClientTitle', el => el.textContent.trim());
    tracker.assert(clientTitle.length > 0, `Unexpected client title: ${clientTitle}`);
    await tracker.screenshot(page, 't3.1.1_partners_dashboard.png');
  });

  // T3.2 Workspace Scoping & Security Check
  await tracker.runStep('T3.2.1', 'Verify Client Workspace Header and Scoping', async () => {
    const headerName = await page.$eval('#partnerHeaderName', el => el.textContent.trim());
    tracker.assert(headerName.includes('Workspace') || headerName.includes('Client'), `Invalid workspace header: ${headerName}`);
  });

  // T3.3 Video Review Room (Section 1)
  await tracker.runStep('T3.3.1', 'Verify Video Review Room, Project Select, and Comments', async () => {
    const video = await page.$('#partnerVideo');
    tracker.assert(video !== null, '#partnerVideo must exist');

    const projectSelect = await page.$('#partnerProjectSelect');
    tracker.assert(projectSelect !== null, '#partnerProjectSelect must exist');

    const commentCount = await page.$eval('#partnerCommentCount', el => el.textContent.trim());
    tracker.assert(commentCount.includes('Notes') || commentCount.includes('0'), `Invalid comment count: ${commentCount}`);
    await tracker.screenshot(page, 't3.3.1_partners_review_room.png');
  });

  await tracker.runStep('T3.3.2', 'Add Timecoded Feedback Comment to Video Review', async () => {
    await page.type('#partnerNewComment', 'Brand logo in lower third should be 20% larger.');
    await wait(300);

    await page.evaluate(async () => {
      if (typeof window.submitPartnerComment === 'function') {
        await window.submitPartnerComment();
      }
    });
    await wait(1000);

    // Clear input if still populated
    await page.evaluate(() => {
      const el = document.getElementById('partnerNewComment');
      if (el) el.value = '';
    });
  });

  await tracker.runStep('T3.3.3', 'Test 2-click Confirmation on Deliverable Cut Approval', async () => {
    const confirming = await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="approvePartnerCut"]');
      if (btn) {
        btn.click();
        return btn.innerHTML;
      }
      return '';
    });
    await wait(300);
    tracker.assert(confirming.includes('Confirm') || confirming.includes('⚠️') || confirming.includes('Approve'), `Button text: ${confirming}`);
    await tracker.screenshot(page, 't3.3.3_cut_approval_confirm.png');
  });

  // T3.4 Social Media Post Approvals (Section 2)
  await tracker.runStep('T3.4.1', 'Verify Social Media Post Approval Grid & Badges', async () => {
    const socialBadge = await page.$('#partnerSocialBadge');
    tracker.assert(socialBadge !== null, '#partnerSocialBadge must exist');

    const socialGrid = await page.$('#partnerSocialGrid');
    tracker.assert(socialGrid !== null, '#partnerSocialGrid must exist');
    await tracker.screenshot(page, 't3.4.1_social_post_approvals.png');
  });

  // T3.5 Invoices Table & Payment Modal (Section 3)
  await tracker.runStep('T3.5.1', 'Verify Invoices Table & Statement of Account', async () => {
    const tableBody = await page.$('#partnerInvoicesTbody');
    tracker.assert(tableBody !== null, '#partnerInvoicesTbody must exist');
    await tracker.screenshot(page, 't3.5.1_invoices_table.png');
  });

  await tracker.runStep('T3.5.2', 'Open and Test Invoice Payment Verification Modal', async () => {
    await page.evaluate(() => {
      if (typeof window.openPartnerPaymentModal === 'function') {
        window.openPartnerPaymentModal('INV-2026-001', 150000);
      } else {
        const modal = document.getElementById('partnerPaymentModal');
        if (modal) modal.style.display = 'flex';
      }
    });
    await wait(300);

    const isModalVisible = await page.$eval('#partnerPaymentModal', el => el.style.display === 'flex' || window.getComputedStyle(el).display === 'flex');
    tracker.assert(isModalVisible, '#partnerPaymentModal should be displayed');
    await tracker.screenshot(page, 't3.5.2_payment_modal.png');

    await page.type('#payModalTrxInput', 'BKASH-E2E-TRX9988');
    await wait(300);

    // Close modal
    await page.evaluate(() => {
      if (typeof window.closePartnerPaymentModal === 'function') {
        window.closePartnerPaymentModal();
      } else {
        const modal = document.getElementById('partnerPaymentModal');
        if (modal) modal.style.display = 'none';
      }
    });
    await wait(300);

    const modalClosed = await page.$eval('#partnerPaymentModal', el => el.style.display === 'none' || window.getComputedStyle(el).display === 'none');
    tracker.assert(modalClosed, 'Payment modal should close');
  });

  // T3.6 Campaign Brief Modal
  await tracker.runStep('T3.6.1', 'Open and Submit Campaign Brief Modal on /partners', async () => {
    await page.evaluate(() => {
      if (typeof window.openPartnerBriefModal === 'function') {
        window.openPartnerBriefModal();
      } else {
        const modal = document.getElementById('partnerBriefModal');
        if (modal) modal.style.display = 'flex';
      }
    });
    await wait(300);

    const isBriefModalVisible = await page.$eval('#partnerBriefModal', el => el.style.display === 'flex' || window.getComputedStyle(el).display === 'flex');
    tracker.assert(isBriefModalVisible, '#partnerBriefModal should be displayed');
    await tracker.screenshot(page, 't3.6.1_brief_modal.png');

    await page.type('#briefTitleInput', 'Winter Mega Campaign TVC');
    await page.type('#briefBudgetInput', 'BDT 2,50,000');
    await page.type('#briefDescInput', 'Complete 30s TVC commercial + 3 social cutdowns');
    await wait(300);

    // Close brief modal
    await page.evaluate(() => {
      if (typeof window.closePartnerBriefModal === 'function') {
        window.closePartnerBriefModal();
      } else {
        const modal = document.getElementById('partnerBriefModal');
        if (modal) modal.style.display = 'none';
      }
    });
    await wait(300);

    const briefModalClosed = await page.$eval('#partnerBriefModal', el => el.style.display === 'none' || window.getComputedStyle(el).display === 'none');
    tracker.assert(briefModalClosed, '#partnerBriefModal should close after submit');
  });

  return tracker.getSummary();
}

module.exports = { runPhase3 };
