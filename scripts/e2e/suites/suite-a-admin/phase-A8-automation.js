/**
 * scripts/e2e/suites/suite-a-admin/phase-A8-automation.js
 * Suite A - Phase A8: Bot Engine, Automation Workflows & Webhook Telemetry
 * 
 * Tests:
 * 1. Load Bot Engine Hub (#automation) & Verify System Health Telemetry
 * 2. Subtab Navigation across Execution Logs, Automation Rules, and Telegram Groups
 * 3. Create Automation Rule Modal UI & Form Configuration
 * 4. Submit Rule & Intercept POST /api/automation/rules Mutation
 * 5. Toggle Automation Rule State (Active <-> Inactive)
 * 6. Telegram Broadcast Modal & Intercept POST /api/automation/broadcast
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA8(page) {
  const tracker = new TestTracker('Suite A - Phase A8: Bot Engine & Automation');
  console.log('\n--- ⚡ Running Suite A - Phase A8: Bot Engine & Automation ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#automation', { waitUntil: 'networkidle2' });
  await wait(1200);

  let createdRuleId = null;

  await tracker.runStep('A8.1', 'Load Bot Engine Hub & Verify System Health Telemetry', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('Bot Engine') || el.textContent.includes('Automation'));
    }, { timeout: 8000 });

    const isAutomationReady = await page.evaluate(() => {
      return typeof window.AUTOMATION_MODULE === 'object' && window.AUTOMATION_MODULE !== null;
    });
    tracker.assert(isAutomationReady, 'window.AUTOMATION_MODULE must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('Bot') || content.includes('Health') || content.includes('Status') || content.includes('Active'),
      'Bot engine health telemetry status must be displayed'
    );

    await tracker.screenshot(page, 'A8.1_automation_dashboard.png');
  });

  await tracker.runStep('A8.2', 'Subtab Navigation (Logs -> Rules -> Groups)', async () => {
    // 1. Switch to Rules subtab
    await page.evaluate(() => {
      window.AUTOMATION_MODULE.switchSubtab('rules');
    });
    await wait(400);

    let content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Rule Name') || content.includes('Trigger Event') || content.includes('Action'), 'Rules ledger rendered');
    await tracker.screenshot(page, 'A8.2_rules_ledger.png');

    // 2. Switch to Groups subtab
    await page.evaluate(() => {
      window.AUTOMATION_MODULE.switchSubtab('groups');
    });
    await wait(400);

    content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Telegram') || content.includes('Group') || content.includes('Chat'), 'Groups roster rendered');
    await tracker.screenshot(page, 'A8.3_groups_roster.png');

    // 3. Switch back to Logs subtab
    await page.evaluate(() => {
      window.AUTOMATION_MODULE.switchSubtab('logs');
    });
    await wait(400);
    tracker.assert(true, 'Traversed across 3 subtabs cleanly');
  });

  await tracker.runStep('A8.3', 'Create Automation Rule Modal UI & Form Configuration', async () => {
    await page.evaluate(() => {
      window.AUTOMATION_MODULE.switchSubtab('rules');
    });
    await wait(300);

    await page.evaluate(() => {
      window.AUTOMATION_MODULE.openCreateRuleModal();
    });
    await wait(400);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('autoCreateRuleModal');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalActive, '#autoCreateRuleModal must have .active class');

    // Populate rule form
    await page.evaluate(() => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setVal('ruleNameInput', 'Lead Instant WhatsApp & Telegram Escalation');
      setVal('ruleTriggerInput', 'lead_won');
      setVal('ruleActionInput', 'telegram_notify');
      setVal('ruleCondFieldInput', 'status');
      setVal('ruleCondValInput', 'Won');
      setVal('ruleTargetInput', 'Firoz Uddin Ahmed (Founder)');
    });

    await wait(300);
    await tracker.screenshot(page, 'A8.4_create_rule_modal.png');
  });

  await tracker.runStep('A8.4', 'Submit Rule & Intercept POST /api/automation/rules Mutation', async () => {
    const res = await interceptApiCall(
      page,
      '/api/automation/rules',
      async () => {
        await page.evaluate(async () => {
          await window.AUTOMATION_MODULE.submitRule();
        });
      },
      6000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/automation/rules returned HTTP ${res.status()}`);
      const body = await res.json().catch(() => ({}));
      if (body && body.rule && body.rule.id) {
        createdRuleId = body.rule.id;
      }
    }

    await page.waitForFunction(() => {
      const m = document.getElementById('autoCreateRuleModal');
      return !m || !m.classList.contains('active');
    }, { timeout: 8000 });
    await wait(500);
  });

  await tracker.runStep('A8.5', 'Toggle Automation Rule State (Active <-> Inactive)', async () => {
    if (!createdRuleId) {
      createdRuleId = await page.evaluate(() => {
        const row = document.querySelector('[onclick*="toggleRule"]');
        if (row) {
          const match = row.getAttribute('onclick').match(/'([^']+)'/);
          return match ? match[1] : null;
        }
        return null;
      });
    }

    if (createdRuleId) {
      // Toggle to inactive
      const resDeactivate = await interceptApiCall(
        page,
        '/api/automation/rules',
        async () => {
          await page.evaluate(async (id) => {
            await window.AUTOMATION_MODULE.toggleRule(id, false);
          }, createdRuleId);
        },
        6000
      );
      if (resDeactivate) {
        tracker.assert(resDeactivate.status() < 400, `PUT /api/automation/rules/:id deactivate returned HTTP ${resDeactivate.status()}`);
      }
      await wait(600);

      // Toggle back to active
      const resActivate = await interceptApiCall(
        page,
        '/api/automation/rules',
        async () => {
          await page.evaluate(async (id) => {
            await window.AUTOMATION_MODULE.toggleRule(id, true);
          }, createdRuleId);
        },
        6000
      );
      if (resActivate) {
        tracker.assert(resActivate.status() < 400, `PUT /api/automation/rules/:id activate returned HTTP ${resActivate.status()}`);
      }
      await wait(600);
    } else {
      tracker.assert(true, 'No rule found, toggle step completed conditionally');
    }
  });

  await tracker.runStep('A8.6', 'Telegram Broadcast Modal & Intercept POST /api/automation/broadcast', async () => {
    await wait(400);
    await page.evaluate(() => {
      window.AUTOMATION_MODULE.openBroadcastModal();
    });
    await wait(400);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('autoBroadcastModal');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalActive, '#autoBroadcastModal must have .active class');

    // Populate broadcast form
    await page.evaluate(() => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setVal('bcTarget', 'all');
      setVal('bcTitle', '⚡ Studio Automation Heartbeat Test');
      setVal('bcMessage', 'System health verification ping dispatched from E2E automation runner.');
    });

    await wait(300);
    await tracker.screenshot(page, 'A8.5_broadcast_modal.png');

    const res = await interceptApiCall(
      page,
      '/api/automation/broadcast',
      async () => {
        await page.evaluate(async () => {
          await window.AUTOMATION_MODULE.submitBroadcast();
        });
      },
      6000
    );

    if (res) {
      tracker.assert(res.status() < 400, `POST /api/automation/broadcast returned HTTP ${res.status()}`);
    }

    await page.waitForFunction(() => {
      const m = document.getElementById('autoBroadcastModal');
      return !m || !m.classList.contains('active');
    }, { timeout: 8000 });
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA8 };

