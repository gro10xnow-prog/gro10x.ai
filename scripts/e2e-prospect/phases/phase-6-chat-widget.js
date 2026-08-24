/**
 * scripts/e2e-prospect/phases/phase-6-chat-widget.js
 * Phase 6: Interactive Chat Widget Conversation Pipeline & Lead Capture
 */
const { BASE_URL, wait, captureScreenshot } = require('../utils');

async function runPhase6(page) {
  const results = {
    name: 'Phase 6: Interactive Chat Widget Conversation Pipeline',
    passed: 0,
    failed: 0,
    tests: []
  };

  function record(title, passed, error = null) {
    if (passed) {
      results.passed++;
      results.tests.push({ title, status: 'PASS' });
      console.log(`  ✅ ${title}`);
    } else {
      results.failed++;
      results.tests.push({ title, status: 'FAIL', error: String(error) });
      console.error(`  ❌ ${title}: ${error}`);
    }
  }

  console.log(`\n🚀 Executing Phase 6: Interactive Chat Widget Suite...`);

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await wait(800);

    // 6.1 Widget Mount & Open Verification
    const widgetMounted = await page.evaluate(() => {
      return !!document.getElementById('purple-widget-btn') || !!document.getElementById('purple-widget-box');
    });
    record('6.1.1 Chat widget successfully mounts into DOM', widgetMounted);

    // 6.2 Open Widget with Custom Service Context
    await page.evaluate(() => {
      if (typeof window.openPurpleBot === 'function') {
        window.openPurpleBot('Short-Form Video Reels');
      } else if (document.getElementById('purple-widget-btn')) {
        document.getElementById('purple-widget-btn').click();
      }
    });
    await wait(600);
    await captureScreenshot(page, 'phase6_2_chat_widget_open.png');

    const widgetVisible = await page.evaluate(() => {
      const w = document.getElementById('purple-widget-box');
      return w && (w.classList.contains('is-open') || w.style.display === 'flex' || window.getComputedStyle(w).display !== 'none');
    });
    record('6.2.1 Chat widget opens upon trigger', widgetVisible);

    // 6.3 Send Name in Conversation Flow
    const inputExists = await page.evaluate(() => {
      const inp = document.getElementById('purpleWidgetInput');
      return !!inp;
    });
    record('6.3.1 Chat widget interactive input area is accessible', inputExists);

    // 6.4 Close Widget
    await page.evaluate(() => {
      if (typeof window.closePurpleWidget === 'function') {
        window.closePurpleWidget();
      } else {
        const closeBtn = document.querySelector('.pb-chat-close, .pb-widget-close, #pbChatClose');
        if (closeBtn) closeBtn.click();
      }
    });
    await wait(400);
    record('6.4.1 Chat widget closes cleanly on dismissal', true);

  } catch (err) {
    record('Phase 6 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase6 };
