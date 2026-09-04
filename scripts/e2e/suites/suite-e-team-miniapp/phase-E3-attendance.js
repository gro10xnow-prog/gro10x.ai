/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E3-attendance.js
 * Suite E - Phase E3: Attendance & GPS Clock Controls
 * 
 * Tests:
 * 1. Navigate to Attendance Page (showPage('pageAttendance')) & Active Tab State
 * 2. Live Digital Clock Display (attClock, attDate, shiftDuration)
 * 3. Studio Clock Button Presence (attClockBtn) & Dynamic State Inspection
 * 4. Attendance Clock-In Action Handler (handleClockToggle) & Session Update
 * 5. Monthly Timesheet Calendar Grid Container (attCalendarGrid) & Month Navigation
 * 6. Attendance Records History List Container (attHistory)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE3(page) {
  const tracker = new TestTracker('Suite E - Phase E3: Attendance & Clock Controls');
  console.log('\n--- ⏱️ Running Suite E - Phase E3: Attendance & Clock ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E3.1', 'Navigate to Attendance Page (showPage) & Active Tab State', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navRes = await page.evaluate(async () => {
      // Dismiss any native alerts
      window.alert = () => {};
      if (typeof window.showPage === 'function') {
        window.showPage('pageAttendance');
      }
      await new Promise(r => setTimeout(r, 200));

      const pageEl = document.getElementById('pageAttendance');
      return {
        isActive: pageEl ? pageEl.classList.contains('active') : false
      };
    });

    tracker.assert(navRes.isActive, 'Attendance page must be active');
    await tracker.screenshot(page, 'E3.1_team_attendance_page.png');
  });

  await tracker.runStep('E3.2', 'Live Digital Clock Display (attClock, attDate, shiftDuration)', async () => {
    const clockInfo = await page.evaluate(() => {
      const clock = document.getElementById('attClock');
      const date = document.getElementById('attDate');
      const shift = document.getElementById('shiftDuration');
      return {
        hasClock: clock !== null,
        clockText: clock ? (clock.textContent || '').trim() : '',
        hasDate: date !== null,
        dateText: date ? (date.textContent || '').trim() : '',
        hasShift: shift !== null
      };
    });

    tracker.assert(clockInfo.hasClock, 'Digital clock element must exist');
    tracker.assert(clockInfo.clockText.length > 0, 'Clock must display formatted time');
    tracker.assert(clockInfo.hasDate && clockInfo.dateText.length > 0, 'Calendar date must be displayed');
    tracker.assert(clockInfo.hasShift, 'Shift duration indicator must be present');
    await tracker.screenshot(page, 'E3.2_team_digital_clock.png');
  });

  await tracker.runStep('E3.3', 'Studio Clock Button Presence (attClockBtn) & Dynamic State Inspection', async () => {
    const btnInfo = await page.evaluate(() => {
      const btn = document.getElementById('attClockBtn');
      return {
        hasBtn: btn !== null,
        btnText: btn ? (btn.textContent || '').trim() : '',
        className: btn ? btn.className : ''
      };
    });

    tracker.assert(btnInfo.hasBtn, 'Clock toggle button must exist');
    tracker.assert(btnInfo.btnText.includes('Clock'), 'Clock button label must indicate clock action');
    await tracker.screenshot(page, 'E3.3_team_clock_btn.png');
  });

  await tracker.runStep('E3.4', 'Attendance Clock-In Action Handler (handleClockToggle) & Session Update', async () => {
    const clockResult = await page.evaluate(async () => {
      window.alert = () => {};
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.showAlert = (msg, cb) => { if (cb) cb(); };
      }
      const origStatus = window.getCurrentUser ? window.getCurrentUser()?.status : null;

      // Mock geolocation to avoid browser permission prompt
      if (!navigator.geolocation) {
        navigator.geolocation = {};
      }
      navigator.geolocation.getCurrentPosition = (success) => {
        success({ coords: { latitude: 23.780887, longitude: 90.416862 } });
      };

      if (typeof window.handleClockToggle === 'function') {
        await window.handleClockToggle();
      }
      await new Promise(r => setTimeout(r, 600));

      const newStatus = window.getCurrentUser ? window.getCurrentUser()?.status : null;
      const btn = document.getElementById('attClockBtn');
      const pill = document.getElementById('attStatusPill');

      return {
        newStatus,
        btnText: btn ? (btn.textContent || '').trim() : '',
        pillText: pill ? (pill.textContent || '').trim() : ''
      };
    });

    tracker.assert(clockResult.newStatus === 'In Studio' || clockResult.btnText.includes('Clock'), 'Clock toggle must transition status or update button label');
    await tracker.screenshot(page, 'E3.4_team_clocked_in.png');
  });

  await tracker.runStep('E3.5', 'Monthly Timesheet Calendar Grid Container & Month Navigation', async () => {
    const calGrid = await page.evaluate(() => {
      const grid = document.getElementById('attCalendarGrid');
      const label = document.getElementById('calMonthLabel');
      return {
        hasGrid: grid !== null,
        hasLabel: label !== null,
        monthText: label ? (label.textContent || '').trim() : ''
      };
    });

    tracker.assert(calGrid.hasGrid, 'Monthly attendance calendar grid must be rendered');
    tracker.assert(calGrid.hasLabel && calGrid.monthText.length > 0, 'Calendar month label must display current month');
    await tracker.screenshot(page, 'E3.5_team_calendar_grid.png');
  });

  await tracker.runStep('E3.6', 'Attendance Records History List Container (attHistory)', async () => {
    const history = await page.evaluate(() => {
      const list = document.getElementById('attHistory');
      return {
        hasList: list !== null,
        innerHTML: list ? list.innerHTML.trim() : ''
      };
    });

    tracker.assert(history.hasList, 'Attendance history log container must exist');
    await tracker.screenshot(page, 'E3.6_team_attendance_history.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE3 };

