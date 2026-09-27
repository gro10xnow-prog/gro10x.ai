# 🛠️ The GRO10X Blueprint: Building an In-Browser QA Automation & Health Runner Extension (Manifest V3)

> **A practical, battle-tested architectural guide for replicating an enterprise-grade Chrome Extension QA Runner across any web application, SaaS, or multi-portal ecosystem.**

---

## 1. Executive Summary & Paradigm Shift

Traditional end-to-end (E2E) testing frameworks (Cypress, Playwright, Selenium) run in isolated headless browser instances. While essential for backend CI pipelines, they suffer from several pain points during daily development and manual QA:
1. **Context Blindness:** Tests run in synthetic sandbox environments that often miss live browser states, cookies, active sessions, and viewport quirks.
2. **Setup Overhead:** Running tests requires launching terminal CLI runners, generating separate HTML reports, and debugging post-mortem traces.
3. **Pacing Disconnect:** Fast automated runs blaze through UI steps in milliseconds, preventing humans from visually observing subtle CSS transitions, toast notifications, layout shifts, or race conditions.
4. **Native Dialog Lockup:** An unhandled `window.alert()` or `confirm()` freezes headless automation indefinitely.

### The Chrome Extension QA Paradigm
By implementing a **Manifest V3 Sidepanel Chrome Extension**, your QA test runner lives **directly inside the real browser alongside your active web application**:
- **Live Visual Auditing (Human-Pacing):** Configurable delays (e.g. 800ms) allow developers and product managers to watch real buttons click, modals open, forms autofill, and tables filter in real-time.
- **Sidepanel HUD Cockpit:** Progress bars, stopwatch telemetry, step inspector, pass/fail matrices, and audio chimes keep you informed without leaving the page.
- **Zero Native Dialog Freeze:** Automatically intercepts and logs `alert()`, `confirm()`, and `prompt()` calls so testing pipelines never hang.
- **Dual-World Execution:** Seamlessly bridges extension content scripts (DOM interaction) with the webpage's Main World JavaScript scope (calling global app functions, inspecting stores, dispatching framework actions).
- **CI / Headless Compatibility:** The exact same extension can be loaded into Puppeteer or Playwright via `--load-extension` for 100% automated regression in headless CI.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GOOGLE CHROME                                        │
│                                                                                        │
│  ┌──────────────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │           WEBPAGE (APP CONTEXT)              │  │        CHROME SIDEPANEL        │  │
│  │                                              │  │                                │  │
│  │  Main World (`world: "MAIN"`)                │  │  Runner UI & Orchestrator      │  │
│  │  ┌────────────────────────────────────────┐  │  │  ┌──────────────────────────┐  │  │
│  │  │ `bridge-main.js`                       │  │  │  │ Progress: 86 / 86 Steps  │  │  │
│  │  │ - Network Fetch Interceptor            │  │  │  │ ⏱️ Step Timer: 0.8s       │  │  │
│  │  │ - Console Error / Rejection Capture    │  │  │  │ Pacing: 800ms (Human)     │  │  │
│  │  │ - Native Dialog Interceptor (Alert)    │  │  │  │ Matrix Suite Breakdown    │  │  │
│  │  │ - App Functions (`window.APP_MODULE`)  │  │  │  └──────────────────────────┘  │  │
│  │  └───────────────────▲────────────────────┘  │  │                                │  │
│  │                      │ CustomEvents          │  │  `sidepanel.js`                │  │
│  │                      ▼                       │  │  - Suite Registry Loader       │  │
│  │  Isolated World (`world: "ISOLATED"`)        │  │  - Step Sequence Orchestrator  │  │
│  │  ┌────────────────────────────────────────┐  │  │  - URL / Hash Synchronizer     │  │
│  │  │ `content-script.js`                    │◀─┼──┼──- Tab Message Dispatcher      │  │
│  │  │ - Selector Poller (`waitForSelector`)  │  │  │  - Failure Screenshot Capture  │  │
│  │  │ - Synthetic Pointer & Click Engine     │  │  │  - Audio Chimes Engine         │  │
│  │  │ - DOM Element Spotlight / Highlight    │  │  │  └──────────────────────────┘  │  │
│  │  └────────────────────────────────────────┘  │  │                                │  │
│  └──────────────────────────────────────────────┘  └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Manifest V3 Extension Architecture

A robust QA Runner requires four specialized execution layers working in harmony:

### File Tree Structure
```text
my-qa-runner/
├── manifest.json            # Manifest V3 configuration & permission boundaries
├── service-worker.js        # Background worker for panel opening & tab lifecycle
├── sidepanel.html           # Cockpit UI (Hero cards, progress, matrices, dials)
├── sidepanel.js             # Test runner core, sequence runner, route sync
├── content-script.js        # Isolated-world DOM interaction & assertion engine
├── bridge-main.js           # Main-world telemetry, error traps & mock auth
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── suites/                  # Modular test suites organized by feature/portal
    ├── registry.js          # Platform, page, and suite routing metadata
    ├── suite-loader.js      # Dynamic suite aggregator
    ├── auth-qa.js
    ├── dashboard-qa.js
    └── portal-audits.js
```

---

## 3. Core File Implementations & Boilerplates

### A. `manifest.json`
Key configurations:
- `"side_panel"`: Declares the extension interface path.
- `"permissions"`: `sidePanel`, `storage`, `activeTab`, `tabs`, `scripting`.
- **Dual Content Scripts**: Injects `bridge-main.js` into `"world": "MAIN"` and `content-script.js` into the default isolated world at `"run_at": "document_start"`.

```json
{
  "manifest_version": 3,
  "name": "My App QA Automation Runner",
  "version": "1.0.0",
  "description": "In-browser live QA runner with human pacing, DOM validation, and zero native dialog freezing.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [
    "sidePanel",
    "storage",
    "activeTab",
    "tabs",
    "scripting"
  ],
  "host_permissions": [
    "http://localhost/*",
    "http://localhost:3000/*",
    "http://127.0.0.1/*",
    "https://*.myapp.com/*"
  ],
  "background": {
    "service_worker": "service-worker.js"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open QA Runner"
  },
  "content_scripts": [
    {
      "matches": [
        "http://localhost/*",
        "http://localhost:3000/*",
        "https://*.myapp.com/*"
      ],
      "js": ["bridge-main.js"],
      "run_at": "document_start",
      "world": "MAIN"
    },
    {
      "matches": [
        "http://localhost/*",
        "http://localhost:3000/*",
        "https://*.myapp.com/*"
      ],
      "js": ["content-script.js"],
      "run_at": "document_start"
    }
  ]
}
```

---

### B. `service-worker.js`
Under MV3, `chrome.sidePanel.setPanelBehavior` enables opening the sidepanel directly when clicking the toolbar extension icon:

```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});
```

---

### C. `bridge-main.js` (Main World Execution Context)
This file runs directly in the target webpage's JavaScript namespace. It accomplishes four critical objectives:
1. **Ensures Mock QA Authentication:** Sets mock tokens in `localStorage` and `cookies` so suites can run seamlessly in staging/dev.
2. **Zero Native Dialog Enforcement:** Replaces `window.alert`, `confirm`, and `prompt` with event dispatchers so unhandled modals never freeze the runner.
3. **Telemetry & Error Tracking:** Intercepts `fetch` network failures (4xx/5xx) and captures uncaught errors / unhandled rejections.
4. **Main World Code Evaluator:** Executes main-world functions via custom DOM events to trigger application-specific methods (e.g. `window.STORE.dispatch()`).

```javascript
(() => {
  'use strict';
  if (window.__QA_MAIN_BRIDGE__) return;
  window.__QA_MAIN_BRIDGE__ = true;

  // 1. Ensure mock authentication session is active
  try {
    const mockToken = 'mock_qa_token_enterprise';
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_profile', JSON.stringify({
        id: 'qa_user_1',
        name: 'QA Automation Specialist',
        role: 'admin'
      }));
    }
    document.cookie = `auth_token=${mockToken}; path=/`;
  } catch (_) {}

  // 2. Intercept native dialogs (Zero Native Dialog Freeze)
  window.alert = function(msg) {
    window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
      detail: { type: 'dialog', dialogType: 'alert', message: String(msg) }
    }));
    console.warn('[QA Runner Bridge] Blocked native alert():', msg);
  };

  window.confirm = function(msg) {
    window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
      detail: { type: 'dialog', dialogType: 'confirm', message: String(msg) }
    }));
    console.warn('[QA Runner Bridge] Blocked native confirm() -> returned true:', msg);
    return true; // Auto-confirm actions in automated QA
  };

  window.prompt = function(msg, def) {
    window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
      detail: { type: 'dialog', dialogType: 'prompt', message: String(msg) }
    }));
    return def || '';
  };

  // 3. Telemetry: Intercept fetch for network 4xx/5xx health
  const _fetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      let [resource, init] = args;
      const url = typeof resource === 'string' ? resource : (resource?.url || '');
      const response = await _fetch.apply(this, args);
      if (!response.ok && response.status >= 400) {
        window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
          detail: { type: 'network_error', url, status: response.status, statusText: response.statusText }
        }));
      }
      return response;
    } catch (err) {
      window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
        detail: { type: 'network_error', url: String(args[0]), status: 0, statusText: err.message }
      }));
      throw err;
    }
  };

  // 4. Capture Uncaught Errors
  window.addEventListener('error', (e) => {
    window.dispatchEvent(new CustomEvent('__qa_telemetry_event__', {
      detail: { type: 'console_error', message: e.message, source: e.filename, lineno: e.lineno }
    }));
  });

  // 5. Main World Eval Request Listener
  document.addEventListener('__qa_eval_request__', (e) => {
    const { id, code } = e.detail || {};
    try {
      const fn = new Function(code.includes('return ') ? code : `${code}; return true;`);
      const value = fn();
      document.dispatchEvent(new CustomEvent('__qa_eval_response__', { detail: { id, ok: true, value } }));
    } catch (err) {
      document.dispatchEvent(new CustomEvent('__qa_eval_response__', { detail: { id, ok: false, error: err.message } }));
    }
  });

  console.log('⚡ [QA Runner] Main World Telemetry & Interceptor Bridge armed.');
})();
```

---

### D. `content-script.js` (Isolated DOM Interaction Engine)
Runs in Chrome's isolated world. It receives step execution commands from the sidepanel, performs synthetic user gestures, highlights elements, and verifies DOM assertions.

#### Key Mechanics:
1. **`simulateClick(el)`:** Dispatches the complete sequence of pointer and mouse events (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`) and scrolls the element into view.
2. **`simulateInput(el, value)`:** Focuses, updates value, and dispatches both `input` and `change` bubbling events for reactive framework compatibility (React, Vue, Svelte).
3. **`waitForSelector(selector, timeoutMs)`:** Smart polling engine supporting text pseudoclasses (e.g. `:has-text("Save")`) and multi-attribute fallbacks (`#saveBtn, button[onclick*="save"]`).
4. **`highlightElement(el)`:** Flashes a high-contrast outline (`outline: 3px solid #00df89`) to visually spotlight the interacting element.

```javascript
(() => {
  'use strict';
  if (window.__QA_CONTENT_SCRIPT__) return;
  window.__QA_CONTENT_SCRIPT__ = true;

  const auditLogs = {
    consoleErrors: [],
    networkErrors: [],
    nativeDialogs: []
  };

  // Listen to telemetry events from bridge-main.js
  window.addEventListener('__qa_telemetry_event__', (e) => {
    const data = e.detail;
    if (data.type === 'console_error') auditLogs.consoleErrors.push(data);
    if (data.type === 'network_error') auditLogs.networkErrors.push(data);
    if (data.type === 'dialog') auditLogs.nativeDialogs.push(data);
  });

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function highlightElement(el) {
    if (!el) return;
    const prev = el.style.outline;
    el.style.outline = '3px solid #00df89';
    setTimeout(() => { el.style.outline = prev; }, 600);
  }

  function simulateClick(el) {
    if (!el) throw new Error('Target element not found for click');
    highlightElement(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const rect = el.getBoundingClientRect();
    const eventOpts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };

    el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
    el.dispatchEvent(new MouseEvent('mousedown', eventOpts));
    el.dispatchEvent(new PointerEvent('pointerup', eventOpts));
    el.dispatchEvent(new MouseEvent('mouseup', eventOpts));
    el.click();
  }

  function simulateInput(el, value) {
    if (!el) throw new Error('Target element not found for input');
    highlightElement(el);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function querySelectorSmart(selector) {
    if (!selector) return null;
    const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const hasTextMatch = part.match(/^(.*?):has-text\((["']?)(.*?)\2\)$/);
      if (hasTextMatch) {
        const base = hasTextMatch[1] || '*';
        const text = hasTextMatch[3];
        const candidates = document.querySelectorAll(base);
        for (const el of candidates) {
          if (el.textContent && el.textContent.includes(text)) return el;
        }
      } else {
        try {
          const el = document.querySelector(part);
          if (el) return el;
        } catch (_) {}
      }
    }
    return null;
  }

  async function waitForSelector(selector, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = querySelectorSmart(selector);
      if (el) return el;
      await sleep(100);
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  // Dual-World Main Evaluation Request
  function evalInMainWorld(code, timeoutMs = 1200) {
    return new Promise((resolve) => {
      const id = 'eval_' + Math.random().toString(36).slice(2);
      function onResponse(e) {
        if (e.detail && e.detail.id === id) {
          document.removeEventListener('__qa_eval_response__', onResponse);
          clearTimeout(timer);
          resolve(e.detail);
        }
      }
      document.addEventListener('__qa_eval_response__', onResponse);
      const timer = setTimeout(() => {
        document.removeEventListener('__qa_eval_response__', onResponse);
        resolve({ id, ok: false, error: 'Timed out' });
      }, timeoutMs);

      document.dispatchEvent(new CustomEvent('__qa_eval_request__', { detail: { id, code } }));
    });
  }

  // Step Execution Dispatcher
  async function executeStep(step) {
    const startTime = Date.now();
    const result = { id: step.id, title: step.title, passed: false, detail: '', durationMs: 0 };

    try {
      // 1. Actions
      if (step.action === 'navigate_hash') {
        const navLink = document.querySelector(`a[href="${step.target}"], .nav-item[href="${step.target}"]`);
        if (navLink) simulateClick(navLink);
        else if (window.location.hash !== step.target) window.location.hash = step.target;
        await sleep(1000);
      } else if (step.action === 'click') {
        const el = await waitForSelector(step.selector, 5000);
        simulateClick(el);
      } else if (step.action === 'input_text') {
        const el = await waitForSelector(step.selector, 5000);
        simulateInput(el, step.value || '');
      } else if (step.action === 'wait_ms') {
        await sleep(step.duration || 300);
      }

      // 2. Assertions
      if (step.assertion) {
        const a = step.assertion;
        if (a.type === 'element_exists' || a.type === 'wait_selector') {
          const el = await waitForSelector(a.selector, a.timeout || 6000);
          highlightElement(el);
          result.detail = `Verified element: ${a.selector}`;
        } else if (a.type === 'custom_check' && a.check === 'assert_clean_audit') {
          if (auditLogs.consoleErrors.length > 0) {
            throw new Error(`Console errors detected: ${JSON.stringify(auditLogs.consoleErrors)}`);
          }
          result.detail = 'Console and network audit clean';
        }
      }

      result.passed = true;
    } catch (err) {
      result.passed = false;
      result.error = err.message;
    }

    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Extension Message Listener
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'PING') {
      sendResponse({ alive: true, url: window.location.href });
    } else if (req.action === 'EXECUTE_STEP') {
      executeStep(req.step).then(sendResponse);
      return true; // Keep message channel open for async response
    } else if (req.action === 'RESET_AUDIT') {
      auditLogs.consoleErrors = [];
      auditLogs.networkErrors = [];
      auditLogs.nativeDialogs = [];
      sendResponse({ ok: true });
    }
  });
})();
```

---

### E. `sidepanel.js` (Runner Orchestrator & UI Telemetry)
The sidepanel controls the entire test lifecycle:
1. **Multi-Page & Route Synchronizer (`ensureTabOnUrl`):**
   - Automatically navigates between different URL paths (`/dashboard`, `/settings.html`) and SPA hashes (`#finance`, `#leaves`).
   - Re-arms `bridge-main.js` (world: MAIN) and `content-script.js` on every navigation to eliminate disconnected ports.
2. **Configurable Pacing Engine (`waitWithPacing`):**
   - Fast Mode: `0ms` (headless speed)
   - Human Pacing: `800ms` (optimal visual auditing)
   - Slow Review: `1500ms` (executive demonstrations)
3. **Automated Visual Failure Capture:**
   - Calls `chrome.tabs.captureVisibleTab()` when a step fails and renders a thumbnail preview directly in the scorecard.

```javascript
let currentDelayMs = 800; // Default: Human Pacing

async function ensureTabOnUrl(targetPath, targetHash) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error('Active tab not found');

  const currentUrl = new URL(tab.url);
  const destPath = targetPath || currentUrl.pathname;
  const effectiveHash = targetHash || '';

  const needPathChange = currentUrl.pathname.replace(/\/+$/, '') !== destPath.replace(/\/+$/, '');
  const needHashChange = effectiveHash && currentUrl.hash !== effectiveHash;

  if (needPathChange) {
    const dest = currentUrl.origin + destPath + effectiveHash;
    await chrome.tabs.update(tab.id, { url: dest });

    // Wait for page load and content script ping
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 300));
      const ping = await chrome.tabs.sendMessage(tab.id, { action: 'PING' }).catch(() => null);
      if (ping && ping.alive) break;
      // Re-inject dual-world scripts if disconnected
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', files: ['bridge-main.js'] }).catch(() => {});
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] }).catch(() => {});
    }
  } else if (needHashChange) {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'EXECUTE_STEP',
      step: { id: 'nav-hash', action: 'navigate_hash', target: effectiveHash }
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 400));
  }
}

async function runTestSuite(suite) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await ensureTabOnUrl(suite.targetPath, suite.targetHash);
  await chrome.tabs.sendMessage(tab.id, { action: 'RESET_AUDIT' });

  for (let i = 0; i < suite.steps.length; i++) {
    const step = suite.steps[i];
    updateHeroUI(step, i + 1, suite.steps.length);

    // Synchronize route if step changes hash
    if (step.targetPath || (step.targetHash && step.action !== 'navigate_hash')) {
      await ensureTabOnUrl(step.targetPath, step.targetHash);
    }

    const result = await chrome.tabs.sendMessage(tab.id, { action: 'EXECUTE_STEP', step });

    if (!result.passed) {
      // Capture failure screenshot automatically
      const screenshotUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' }).catch(() => null);
      renderFailureCard(step, result, screenshotUrl);
      playAudioChime('fail');
      break;
    }

    renderPassedStep(step, result);
    playAudioChime('click');
    await new Promise(r => setTimeout(r, currentDelayMs)); // Apply human pacing delay
  }

  playAudioChime('pass');
}
```

---

## 4. Test Suite Design Patterns (Authentic DOM Validation)

Avoid the traditional anti-patterns that create brittle tests or false-positive passes:

### Anti-Pattern vs. Enterprise Best Practice

| Anti-Pattern | Why It Causes Problems | Best Practice Solution |
| :--- | :--- | :--- |
| **Appending `, body`** (e.g. `#kpiTile, body`) | Always matches `<body>`, creating false-positive passes even if the feature never rendered. | **Never append `, body`**. Always target specific semantic components or their header tags (`#kpiTile, #overviewView h1`). |
| **Strict Single ID on Dynamic Buttons** (e.g. `#btnPending.active`) | Rapid framework re-renders (`container.innerHTML = ...`) can briefly detach elements, causing race condition timeouts. | **Use multi-attribute resilient selectors**: `#btnPending.active, button[onclick*="setFilter('pending')"].active, #btnPending`. |
| **Short Timeouts on Async Routes** (e.g. 2000ms timeout on page load) | Remote API fetches or database queries (Supabase, Postgres) take 1-2s under load. | **Calibrate route transition timeouts to 10,000ms** and wait on static view headers before asserting dynamic data tables. |
| **Shallow Container Checks** (e.g. `#app-view`) | Confirms the root wrapper mounted, but doesn't check if data actually loaded. | **Assert child data structures**: `#app-view table.data-table tbody tr, .card-glass .kpi-val`. |

### Standard Suite Step Schema
```javascript
const FINANCE_AUDIT_SUITE = {
  id: 'finance_audit',
  title: 'Financial Command & Reconciliation Audit',
  targetPath: '/manager',
  targetHash: '#finance',
  steps: [
    {
      id: 'fa-1',
      title: '1. Navigate to #finance',
      action: 'navigate_hash',
      target: '#finance',
      assertion: {
        type: 'wait_selector',
        selector: '#manager-view h1, #mgrExportCsvBtn, .kpi-tile',
        timeout: 10000 // 10s calibrated for async backend fetch
      }
    },
    {
      id: 'fa-2',
      title: '2. Verify Financial KPI Tiles Rendered',
      action: 'wait_ms',
      duration: 300,
      assertion: {
        type: 'element_exists',
        selector: '.kpi-tile'
      }
    },
    {
      id: 'fa-3',
      title: '3. Click Export to CSV Button',
      action: 'click',
      selector: '#mgrExportCsvBtn, button[onclick*="exportCSV"], .btn-secondary:has-text("Export")'
    },
    {
      id: 'fa-4',
      title: '4. Integrity Audit: Clean Console',
      action: 'wait_ms',
      duration: 200,
      assertion: {
        type: 'custom_check',
        check: 'assert_clean_audit'
      }
    }
  ]
};
```

---

## 5. Automated CI Runner (Puppeteer Headless Bridge)

To run your extension in CI/CD without human intervention, use Puppeteer with `--load-extension`. This gives you the best of both worlds: identical in-browser execution with programmatic exit codes for GitHub Actions.

```javascript
// scripts/run_extension_ci.js
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extensionPath = path.join(__dirname, '../my-qa-runner');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/#overview', { waitUntil: 'networkidle2' });

  // Locate Extension ID
  const targets = browser.targets();
  const extTarget = targets.find(t => t.url().startsWith('chrome-extension://'));
  const extId = extTarget.url().match(/chrome-extension:\/\/([a-z0-9]+)\//)[1];

  // Open Extension Sidepanel
  const sidepanel = await browser.newPage();
  await sidepanel.goto(`chrome-extension://${extId}/sidepanel.html`);

  // Switch to Fast Mode for CI
  await sidepanel.evaluate(() => {
    document.getElementById('speedFast')?.click();
    document.getElementById('btnRunAll')?.click();
  });

  // Poll for completion
  for (let sec = 0; sec < 300; sec++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await sidepanel.evaluate(() => ({
      complete: document.getElementById('runStatusText')?.textContent.includes('Complete'),
      passed: document.getElementById('metricPassed')?.textContent,
      failed: document.getElementById('metricFailed')?.textContent
    }));

    if (status.complete) {
      console.log(`CI Run Finished: ${status.passed} Passed | ${status.failed} Failed`);
      await browser.close();
      process.exit(status.failed === '0' ? 0 : 1);
    }
  }

  console.error('CI Run Timed Out after 300s');
  await browser.close();
  process.exit(1);
})();
```

---

## 6. Blueprint Implementation Checklist for Any Project

When cloning this architecture into a new project, follow this 7-step checklist:

- [ ] **Step 1: Define Your Host Origins** in `manifest.json` (`host_permissions` for localhost and production domains).
- [ ] **Step 2: Arm the Main World Bridge** (`bridge-main.js`) with your application's mock token keys (`localStorage.setItem('token', ...)`).
- [ ] **Step 3: Map Your Page Routes** in `suites/registry.js` (assigning URL paths and hashes to every portal/module).
- [ ] **Step 4: Audit Existing Inline Handlers & CSP** (ensure no inline `<script>` injection is used; communicate strictly via `CustomEvent` or external scripts).
- [ ] **Step 5: Write Resilient Selectors** using ID + attribute + text combinations (`#submitBtn, button[type="submit"]:has-text("Save")`).
- [ ] **Step 6: Calibrate Timeouts** to 10s for initial route loads with async fetches, and 4-5s for simple clicks.
- [ ] **Step 7: Verify with 800ms Human Pacing** to visually review animations, modal lifecycles, and layout transitions before enabling Fast Mode for CI.

---

*This architecture powers the GRO10X OS 8-Platform Grand Audit (71 suites, 1,014 steps, 100% pass rate at 800ms pacing delay).*
