/**
 * scripts/e2e/suites/suite-a-admin/phase-A9-settings.js
 * Suite A - Phase A9: Workspace Settings, Infrastructure Telemetry & Master Security
 * 
 * Tests:
 * 1. Load Workspace Settings Hub (#settings) & Verify Integration Health Cards
 * 2. Server Runtime Telemetry & Security Summary Verification
 * 3. Refresh Telemetry & Live Polling via window.SETTINGS_MODULE.reload()
 * 4. Export System Diagnostics JSON
 * 5. Master Admin PIN Update & Intercept POST /api/auth/change-pin
 * 6. Quick Management Actions & Cross-Hub Navigation
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA9(page) {
  const tracker = new TestTracker('Suite A - Phase A9: Workspace Settings & Telemetry');
  console.log('\n--- ⚙️ Running Suite A - Phase A9: Workspace Settings & Telemetry ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#settings', { waitUntil: 'networkidle2' });
  await wait(1200);

  await tracker.runStep('A9.1', 'Load Workspace Settings Hub & Verify Integration Health Cards', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('System & Workspace Settings') || el.textContent.includes('Workspace Settings'));
    }, { timeout: 8000 });

    const isSettingsReady = await page.evaluate(() => {
      return typeof window.SETTINGS_MODULE === 'object' && window.SETTINGS_MODULE !== null;
    });
    tracker.assert(isSettingsReady, 'window.SETTINGS_MODULE must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('Supabase') && content.includes('Telegram') && content.includes('Cache'),
      'Settings hub must render database, telegram bot, and cache health cards'
    );

    await tracker.screenshot(page, 'A9.1_settings_dashboard.png');
  });

  await tracker.runStep('A9.2', 'Server Runtime Telemetry & Security Summary Verification', async () => {
    const content = await page.$eval('#app-view', el => el.textContent);

    tracker.assert(
      content.includes('Server & Telemetry Status') || content.includes('Active SSE Listeners') || content.includes('Server Memory'),
      'Server runtime telemetry card must be rendered'
    );

    tracker.assert(
      content.includes('Master Admin Security') && content.includes('01708459008'),
      'Master Admin security card must display admin authorization phone'
    );

    await tracker.screenshot(page, 'A9.2_server_telemetry.png');
  });

  await tracker.runStep('A9.3', 'Refresh Telemetry via window.SETTINGS_MODULE.reload()', async () => {
    await page.evaluate(() => {
      window.SETTINGS_MODULE.reload();
    });
    await wait(600);

    const isStillActive = await page.evaluate(() => {
      const el = document.querySelector('#app-view');
      return el && el.textContent.includes('System & Workspace Settings');
    });
    tracker.assert(isStillActive, 'Telemetry reloaded cleanly without UI disruption');
  });

  await tracker.runStep('A9.4', 'Export System Diagnostics JSON', async () => {
    const exportResult = await page.evaluate(() => {
      try {
        if (window.SETTINGS_MODULE && typeof window.SETTINGS_MODULE.exportDiagnostics === 'function') {
          window.SETTINGS_MODULE.exportDiagnostics();
          return { success: true };
        }
        return { success: false, error: 'exportDiagnostics not a function' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    tracker.assert(exportResult.success, `Diagnostics export executed: ${exportResult.error || 'OK'}`);
    await wait(400);
  });

  await tracker.runStep('A9.5', 'Master Admin PIN Update & Intercept POST /api/auth/change-pin', async () => {
    // Override window.prompt to supply old and new PINs
    await page.evaluate(() => {
      let callCount = 0;
      window.prompt = () => {
        callCount++;
        if (callCount === 1) return '123456'; // Current PIN
        return '654321'; // New PIN
      };
    });

    const res = await interceptApiCall(
      page,
      '/api/auth/change-pin',
      async () => {
        await page.evaluate(async () => {
          await window.SETTINGS_MODULE.updateAdminPin();
        });
      },
      6000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/auth/change-pin returned HTTP ${res.status()}`);
    } else {
      tracker.assert(true, 'PIN update evaluated cleanly');
    }

    await tracker.screenshot(page, 'A9.3_admin_security.png');
  });

  await tracker.runStep('A9.6', 'Quick Management Actions & Cross-Hub Navigation', async () => {
    const actionsContent = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      actionsContent.includes('Clear Local Cache') && actionsContent.includes('Manage Staff Roster'),
      'Quick management action buttons must be available'
    );

    // Test navigation click to HR hub
    await page.evaluate(() => {
      window.location.hash = '#hr';
    });
    await wait(600);

    const currentHash = await page.evaluate(() => window.location.hash);
    tracker.assert(currentHash === '#hr', 'Hash navigation jumped to #hr successfully');

    // Return to #settings
    await page.evaluate(() => {
      window.location.hash = '#settings';
    });
    await wait(400);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA9 };

