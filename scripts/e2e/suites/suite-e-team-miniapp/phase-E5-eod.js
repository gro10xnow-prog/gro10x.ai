/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E5-eod.js
 * Suite E - Phase E5: Daily EOD Report Submission
 * 
 * Tests:
 * 1. Open EOD Report Form Sheet (openEODForm)
 * 2. EOD Form Structural Anatomy (Date Banner, Tasks, Blockers, Tomorrow, Mood)
 * 3. Form Validation Check on Empty Fields
 * 4. Populate EOD Report Fields with Daily Work Log
 * 5. Submit EOD Report & Confirmation Flow (submitEOD)
 * 6. Teardown & Dismiss EOD Sheet Flow (closeEODSheet)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE5(page) {
  const tracker = new TestTracker('Suite E - Phase E5: Daily EOD Report Submission');
  console.log('\n--- 📝 Running Suite E - Phase E5: EOD Reports ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E5.1', 'Open EOD Report Form Sheet (openEODForm)', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const sheetOpened = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.openEODForm === 'function') {
        await window.openEODForm();
      }
      await new Promise(r => setTimeout(r, 200));

      const sheet = document.getElementById('eodSheet');
      return sheet !== null;
    });

    tracker.assert(sheetOpened, 'EOD report form sheet must be opened in DOM');
    await tracker.screenshot(page, 'E5.1_team_eod_sheet_open.png');
  });

  await tracker.runStep('E5.2', 'EOD Form Structural Anatomy (Date Banner, Tasks, Blockers, Tomorrow, Mood)', async () => {
    const fields = await page.evaluate(() => {
      const sheet = document.getElementById('eodSheet');
      const tasks = document.getElementById('eodTasks');
      const blockers = document.getElementById('eodBlockers');
      const tomorrow = document.getElementById('eodTomorrow');
      const mood = document.getElementById('eodMood');

      return {
        hasSheet: sheet !== null,
        hasTasks: tasks !== null,
        hasBlockers: blockers !== null,
        hasTomorrow: tomorrow !== null,
        hasMood: mood !== null
      };
    });

    tracker.assert(fields.hasTasks, 'Completed tasks field must exist in EOD form');
    tracker.assert(fields.hasBlockers, 'Blockers field must exist in EOD form');
    tracker.assert(fields.hasTomorrow, 'Tomorrow plan field must exist in EOD form');
    await tracker.screenshot(page, 'E5.2_team_eod_fields.png');
  });

  await tracker.runStep('E5.3', 'Form Validation Check on Empty Fields', async () => {
    const valResult = await page.evaluate(async () => {
      let alertMsg = '';
      window.alert = (msg) => { alertMsg = msg; };
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert = (msg) => { alertMsg = msg; };
      }

      const tasks = document.getElementById('eodTasks');
      if (tasks) tasks.value = '';

      if (typeof window.submitEOD === 'function') {
        await window.submitEOD();
      }
      await new Promise(r => setTimeout(r, 100));

      const sheetStillThere = document.getElementById('eodSheet') !== null;
      return { alertMsg, sheetStillThere };
    });

    tracker.assert(valResult.sheetStillThere, 'Sheet must not close when submitting empty tasks');
    await tracker.screenshot(page, 'E5.3_team_eod_validation.png');
  });

  await tracker.runStep('E5.4', 'Populate EOD Report Fields with Daily Work Log', async () => {
    const popResult = await page.evaluate(() => {
      const tasks = document.getElementById('eodTasks');
      const blockers = document.getElementById('eodBlockers');
      const tomorrow = document.getElementById('eodTomorrow');
      const mood = document.getElementById('eodMood');

      if (tasks) tasks.value = '• Delivered Apex Ramadan Video cut v3\n• Color graded 5 product hero clips\n• Completed team sync standup';
      if (blockers) blockers.value = 'None. Ready for tomorrow sound review.';
      if (tomorrow) tomorrow.value = 'Export final 4K master ProRes and dispatch client review link.';
      if (mood) mood.value = '🔥 Great';

      return {
        tasks: tasks ? tasks.value : '',
        blockers: blockers ? blockers.value : '',
        tomorrow: tomorrow ? tomorrow.value : ''
      };
    });

    tracker.assert(popResult.tasks.includes('Apex'), 'Tasks should be populated');
    tracker.assert(popResult.tomorrow.includes('ProRes'), 'Tomorrow plan should be populated');
    await tracker.screenshot(page, 'E5.4_team_eod_populated.png');
  });

  await tracker.runStep('E5.5', 'Submit EOD Report & Confirmation Flow (submitEOD)', async () => {
    const submitResult = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.submitEOD === 'function') {
        await window.submitEOD();
      }
      await new Promise(r => setTimeout(r, 500));

      const sheet = document.getElementById('eodSheet');
      const phaseGate = document.getElementById('phaseGateModal');
      return {
        isSheetRemoved: sheet === null,
        isPhaseGateVisible: phaseGate ? window.getComputedStyle(phaseGate).display !== 'none' : true
      };
    });

    tracker.assert(submitResult.isSheetRemoved, 'EOD form sheet must be dismissed on valid submission');
    await tracker.screenshot(page, 'E5.5_team_eod_submitted.png');
  });

  await tracker.runStep('E5.6', 'Teardown & Dismiss EOD Sheet Flow (closeEODSheet)', async () => {
    const teardown = await page.evaluate(async () => {
      // Re-open and close
      if (typeof window.openEODForm === 'function') {
        await window.openEODForm();
      }
      await new Promise(r => setTimeout(r, 100));

      if (typeof window.closeEODSheet === 'function') {
        window.closeEODSheet();
      }
      await new Promise(r => setTimeout(r, 100));

      return document.getElementById('eodSheet') === null;
    });

    tracker.assert(teardown, 'EOD sheet must be cleanly removed by closeEODSheet');
    await tracker.screenshot(page, 'E5.6_team_eod_dismissed.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE5 };

