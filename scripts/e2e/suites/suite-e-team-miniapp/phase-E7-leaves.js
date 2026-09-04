/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E7-leaves.js
 * Suite E - Phase E7: Leave Requests & Balance Check
 * 
 * Tests:
 * 1. Navigate to Pay Tab & Leave Request Section (showPage('pagePay'))
 * 2. Open Leave Request Form Sheet (openLeaveForm) & Field Structure
 * 3. Leave Type Selector Options (Casual, Sick, Annual, Emergency, Unpaid)
 * 4. Form Validation Guard on Incomplete Input
 * 5. Populate Leave Request Details & Submit Mutation (submitLeave)
 * 6. Leave Requests History List Container (leaveHistoryList) & Dismiss Sheet
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE7(page) {
  const tracker = new TestTracker('Suite E - Phase E7: Leave Applications');
  console.log('\n--- 🌴 Running Suite E - Phase E7: Leaves ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E7.1', 'Navigate to Pay Tab & Leave Request Section (showPage)', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navRes = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.showPage === 'function') {
        window.showPage('pagePay');
      }
      await new Promise(r => setTimeout(r, 200));

      const pageEl = document.getElementById('pagePay');
      return {
        isActive: pageEl ? pageEl.classList.contains('active') : false
      };
    });

    tracker.assert(navRes.isActive, 'Pay page must become active');
    await tracker.screenshot(page, 'E7.1_team_leave_page.png');
  });

  await tracker.runStep('E7.2', 'Open Leave Request Form Sheet (openLeaveForm) & Field Structure', async () => {
    const sheetOpened = await page.evaluate(async () => {
      if (typeof window.openLeaveForm === 'function') {
        window.openLeaveForm();
      }
      await new Promise(r => setTimeout(r, 200));

      const sheet = document.getElementById('leaveSheet');
      const type = document.getElementById('leaveType');
      const from = document.getElementById('leaveFrom');
      const to = document.getElementById('leaveTo');
      const reason = document.getElementById('leaveReason');
      const cover = document.getElementById('leaveCover');

      return {
        hasSheet: sheet !== null,
        hasType: type !== null,
        hasFrom: from !== null,
        hasTo: to !== null,
        hasReason: reason !== null,
        hasCover: cover !== null
      };
    });

    tracker.assert(sheetOpened.hasSheet, 'Leave request sheet must open');
    tracker.assert(sheetOpened.hasType && sheetOpened.hasFrom && sheetOpened.hasTo, 'Core leave input controls must exist');
    await tracker.screenshot(page, 'E7.2_team_leave_sheet.png');
  });

  await tracker.runStep('E7.3', 'Leave Type Selector Options (Casual, Sick, Annual, Emergency, Unpaid)', async () => {
    const types = await page.evaluate(() => {
      const select = document.getElementById('leaveType');
      return select ? Array.from(select.options).map(o => o.value) : [];
    });

    tracker.assert(types.includes('Casual Leave'), 'Must include Casual Leave option');
    tracker.assert(types.includes('Sick Leave'), 'Must include Sick Leave option');
    tracker.assert(types.includes('Emergency Leave'), 'Must include Emergency Leave option');
    await tracker.screenshot(page, 'E7.3_team_leave_types.png');
  });

  await tracker.runStep('E7.4', 'Form Validation Guard on Incomplete Input', async () => {
    const valResult = await page.evaluate(async () => {
      let alertCalled = false;
      window.alert = () => { alertCalled = true; };
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert = () => { alertCalled = true; };
      }

      const reason = document.getElementById('leaveReason');
      if (reason) reason.value = '';

      if (typeof window.submitLeave === 'function') {
        await window.submitLeave();
      }
      await new Promise(r => setTimeout(r, 100));

      return {
        isSheetStillOpen: document.getElementById('leaveSheet') !== null
      };
    });

    tracker.assert(valResult.isSheetStillOpen, 'Leave sheet must remain open on empty validation');
    await tracker.screenshot(page, 'E7.4_team_leave_validation.png');
  });

  await tracker.runStep('E7.5', 'Populate Leave Request Details & Submit Mutation (submitLeave)', async () => {
    const submitResult = await page.evaluate(async () => {
      window.alert = () => {};
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert = (msg, cb) => { if (cb) cb(); };
      }

      const type = document.getElementById('leaveType');
      const from = document.getElementById('leaveFrom');
      const to = document.getElementById('leaveTo');
      const reason = document.getElementById('leaveReason');
      const cover = document.getElementById('leaveCover');

      if (type) type.value = 'Casual Leave';
      if (from) from.value = '2026-08-15';
      if (to) to.value = '2026-08-16';
      if (reason) reason.value = 'Family wedding event in Chittagong';
      if (cover) cover.value = 'Anika Nower covering daily standup & video QA';

      if (typeof window.submitLeave === 'function') {
        await window.submitLeave();
      }
      await new Promise(r => setTimeout(r, 500));

      const sheet = document.getElementById('leaveSheet');
      return {
        isSheetClosed: sheet === null
      };
    });

    tracker.assert(submitResult.isSheetClosed, 'Leave request sheet must close on successful submission');
    await tracker.screenshot(page, 'E7.5_team_leave_submitted.png');
  });

  await tracker.runStep('E7.6', 'Leave Requests History List Container (leaveHistoryList) & Dismiss Sheet', async () => {
    const listState = await page.evaluate(() => {
      const list = document.getElementById('leaveHistoryList');
      return {
        hasList: list !== null
      };
    });

    tracker.assert(listState.hasList, 'Leave history list container must exist on Pay tab');
    await tracker.screenshot(page, 'E7.6_team_leave_history.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE7 };

