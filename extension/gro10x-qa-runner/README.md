# GRO10X Platform QA Automation Runner — Chrome Extension (Manifest V3)

> **Official Technical Reference, Architecture Guide, and Developer Manual**  
> **Extension Path**: `c:/Users/LeNoVo/Documents/GRO10X Business/Gro10x.ai/extension/gro10x-qa-runner/`  
> **Platform Target**: GRO10X Admin Command Center (`/app/`) & Ecosystem Portals  
> **Standard**: 100% Pass Automated Regression | Zero Native Dialogs Policy | Manifest V3  

---

## 1. Executive Overview & Mission

The **GRO10X Platform QA Automation Runner** is an automated regression testing and compliance auditing Chrome Extension built natively on **Google Chrome Manifest V3** and the **Chrome Side Panel API**.

### Why It Was Built
Enterprise web platforms with complex state machines, rich canvas graphs, multi-currency engines, and interconnected modal dialogs often suffer from silent frontend regressions:
- Unhandled Promise rejections and uncaught runtime errors.
- Native blocking dialogs (`window.alert`, `window.confirm`, `window.prompt`) that freeze background threads and break automation.
- Inverted currency multiplication bugs (e.g. legacy 118× rate vs canonical 120 BDT/USD).
- Orphaned modals, sticky backdrops, and broken Escape key listeners.
- Asynchronous data fetching race conditions on route hash switching.

The QA Runner solves this by orchestrating **deterministic, end-to-end user simulations** directly in the browser's execution environment while observing DOM state, main-world JavaScript globals, network telemetry, and runtime error logs in real time.

---

## 2. Core Architecture & Manifest V3 Design

```
+-----------------------------------------------------------------------------------+
|                              Google Chrome Browser                                |
|                                                                                   |
|  +---------------------------+        +----------------------------------------+  |
|  |   Side Panel UI Context   |        |           Target Web Page              |  |
|  |   (sidepanel.html / .js)  |        |    http://localhost:3000/app/#...      |  |
|  |                           |        |                                        |  |
|  | - Test Suite Controller   |        |  +----------------------------------+  |  |
|  | - Live Action Stream      |        |  |        Isolated World            |  |  |
|  | - Progress Bar & Metrics  |        |  |      (content-script.js)         |  |  |
|  | - Scorecard & MD Report   |        |  |                                  |  |  |
|  +-------------|-------------+        |  | - Pointer / Mouse Simulation     |  |  |
|                |                      |  | - DOM Wait & Selector Engine     |  |  |
|                | chrome.tabs.         |  | - Telemetry / Error Collection   |  |  |
|                | sendMessage          |  +----------------|-----------------+  |  |
|                |                      |                   | CustomEvents       |  |
|                |                      |                   | (__gro10x_qa_*)    |  |
|                v                      |                   v                    |  |
|  +---------------------------+        |  +----------------------------------+  |  |
|  |    Service Worker (MV3)   |        |  |          Main World              |  |  |
|  |    (service-worker.js)    |        |  |     (Injected Bridge Script)     |  |  |
|  |                           |        |  |                                  |  |  |
|  | - Side Panel Lifecycle    |        |  | - window.switch<Module>Currency  |  |  |
|  | - Script Injection Fallback|       |  | - window.alert / confirm Mocks   |  |  |
|  | - Tab Discovery Bus       |        |  | - Global State & Module Aliases  |  |  |
|  +---------------------------+        |  +----------------------------------+  |  |
|                                       +----------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Key Architectural Pillars

1. **Native Side Panel Integration**:
   - Built with `"side_panel": { "default_path": "sidepanel.html" }`.
   - Utilizes `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.
   - Clicking the toolbar icon instantly opens the QA console natively docked to the right of the active web application without obscuring page content or requiring intrusive popups.

2. **Dual-Execution World Bridge**:
   - **Isolated World (`content-script.js`)**: Executes DOM queries, highlights elements with visual green focus borders (`#00df89`), dispatches synthetic user pointer sequences, and monitors DOM mutability.
   - **Main World (`bridgeScript`)**: Injected at `document_start` into `document.head`. Listens for `__gro10x_qa_eval_request__` CustomEvents and answers via `__gro10x_qa_eval_response__`. This allows the QA Runner to evaluate and inspect page-level variables and functions (such as `window.switchFinanceCurrency`, `window.APP_MODULES`, or `window.CURRENT_USER`) that are hidden from the isolated content script.

3. **Multi-Strategy Tab Discovery**:
   - `checkTabConnection()` executes a 3-tier discovery algorithm:
     1. Query active tab in `lastFocusedWindow`.
     2. Query active tab in `currentWindow`.
     3. Cross-window search across all browser tabs for URLs matching `localhost`, `127.0.0.1`, or `gro10x.ai`.
   - If the content script is not yet active (e.g. page loaded before extension was reloaded), the runner dynamically injects `content-script.js` on the fly via `chrome.scripting.executeScript`.

---

## 3. Directory & File Inventory

```
extension/gro10x-qa-runner/
├── manifest.json              # Chrome Manifest V3 configuration & permission grants
├── service-worker.js          # Background service worker, side panel lifecycle & message router
├── sidepanel.html             # Side panel interface (controls, progress bar, scorecard, action stream)
├── sidepanel.js               # Test orchestrator, execution timer, main-world evaluator, markdown generator
├── styles.css                 # Dark-mode theme, CSS variables, progress bars, responsive typography
├── content-script.js          # DOM action dispatcher, error interceptors, main-world bridge, assertion handlers
├── icons/                     # Extension branding icons
│   ├── icon16.png             # 16x16 px toolbar icon
│   ├── icon48.png             # 48x48 px extensions management icon
│   └── icon128.png            # 128x128 px high-DPI / Web Store icon
    ├── registry.js            # Master 3-tier hierarchy registry (8 platforms, pages, workflows, audits)
    ├── portal-audits.js       # Page Health Audits for Client, Crew, Manager, DCE, Partners, Public
    ├── workflows/             # Deep Interactive E2E Workflows
    │   ├── admin-workflows.js   # Admin OS Workflows (Task pipeline, BRAC billing, AI Creator, Leads, Expense)
    │   ├── client-workflows.js  # Client Portal Workflows (Brief submission, Cut approval, 30d Warranty)
    │   ├── crew-workflows.js    # Crew Workspace Workflows (Clock-in, Deliverables, EOD Standup, Expenses)
    │   ├── manager-workflows.js # Manager Portal Workflows (Task dispatch, Leave approval, Tier 1 Expense)
    │   └── dce-workflows.js     # DCE & Partner Workflows (Order tracking, Affiliate attribution, Cut approval)
    ├── dashboard-qa.js        # Admin Module 01: Executive Overview (#dashboard)
    ├── engines-qa.js          # Admin Module 02: 5-Engine Growth Operations (#engines)
    ├── platforms-qa.js        # Admin Module 03: Platform Portfolio Registry (#platforms)
    ├── gigs-qa.js             # Admin Module 04: Marketplace Gig Studio (#gigs)
    ├── analytics-qa.js        # Admin Module 05: Agency Analytics & Intelligence (#analytics)
    ├── leads-qa.js            # Admin Module 06: CRM Leads Pipeline (#leads)
    ├── proposals-qa.js        # Admin Module 07: Client Proposals & Quotations Studio (#proposals)
    ├── crm-qa.js              # Admin Module 08: Clients & Retainers CRM (#crm)
    ├── kanban-qa.js           # Admin Module 09: Production Pipeline Hub (#kanban)
    ├── reviews-qa.js          # Admin Module 10: Client Review Room & Proofing Hub (#reviews)
    ├── content-os-qa.js       # Admin Module 11: Content OS & Brand Engine (#content-os)
    ├── social-qa.js           # Admin Module 12: Social Media Planner (#social)
    ├── cms-qa.js              # Admin Module 13: Services & CMS Engine (#cms)
    ├── brands-qa.js           # Admin Module 14: Brand Command Center (#brands)
    ├── digistore-qa.js        # Admin Module 15: DigiVault Subs & Commerce (#digistore)
    ├── dbm-qa.js              # Admin Module 16: DBM Operations & Team Command (#dbm)
    ├── finance-qa.js          # Admin Module 17: Financial Intelligence (#finance)
    ├── hr-qa.js               # Admin Module 18: HR Operations & Team Roster (#hr)
    ├── assets-qa.js           # Admin Module 19: Physical Hardware Assets (#assets)
    ├── tickets-qa.js          # Admin Module 20: Support Desk & Operations Triage (#tickets)
    ├── automation-qa.js       # Admin Module 21: Bot Engine & Automation Workflows (#automation)
    └── settings-qa.js         # Admin Module 22: Workspace & System Settings (#settings)
```

---

## 4. The Zero Native Dialogs Policy

### What It Means
Modern enterprise SPAs must never use blocking browser dialogs:
- ❌ `window.alert("Message")`
- ❌ `window.confirm("Are you sure?")`
- ❌ `window.prompt("Enter value")`

These native dialogs halt the browser event loop, freeze background workers, prevent automated testing from proceeding, and create a poor user experience.

### How the QA Runner Enforces It
1. **Main-World Monkey Patching**:
   ```javascript
   // Injected bridge script in the page's execution context
   window.alert = function(msg) {
     window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
       detail: { type: 'dialog', dialogType: 'alert', message: String(msg) }
     }));
     console.warn('[GRO10X QA Main] Captured native alert():', msg);
   };

   window.confirm = function(msg) {
     window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
       detail: { type: 'dialog', dialogType: 'confirm', message: String(msg) }
     }));
     console.warn('[GRO10X QA Main] Captured native confirm():', msg);
     return true; // Non-blocking default affirmative
   };

   window.prompt = function(msg, def) {
     window.dispatchEvent(new CustomEvent('__gro10x_qa_event__', {
       detail: { type: 'dialog', dialogType: 'prompt', message: String(msg) }
     }));
     console.warn('[GRO10X QA Main] Captured native prompt():', msg);
     return def || '';
   };
   ```
2. **Audit Telemetry Capture**:
   All captured events are pushed to `auditLogs.nativeDialogCalls`.
3. **Step 18 Final Clean Audit Enforcement**:
   Every test suite concludes with `assert_clean_audit`. If `auditLogs.nativeDialogCalls.length > 0`, the entire suite **FAILS IMMEDIATELY** with:
   `Violated Zero Native Dialogs rule: N calls captured!`

---

## 5. Test Suite Architecture & Schema

Each test suite file in `suites/` exports a configuration object matching this contract:

```javascript
const <MODULE>_QA_SUITE = {
  id: 'settings',                                 // Unique slug matching dropdown value
  name: 'Workspace & Security Settings QA Suite', // Display title
  platform: 'admin',                              // Target platform ('admin' | 'client' | 'crew')
  targetHash: '#settings',                        // Target route hash
  description: 'Detailed scope of checks...',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to Workspace & System Settings',
      action: 'navigate_hash',                    // Action type
      target: '#settings',                        // Action parameter
      assertion: {
        type: 'custom_check',                     // 'wait_selector' | 'modal_open' | 'modal_closed' | 'hash_equals' | 'custom_check'
        check: 'assert_settings_mounted'          // Custom check identifier
      }
    },
    {
      id: 'step-04',
      title: '4. Verify System Overview Tab Active',
      action: 'click',
      selector: '#btnSettingsTabOverview',
      assertion: {
        type: 'custom_check',
        check: 'assert_settings_overview_active'
      }
    }
  ]
};

// Dual browser / Node.js export compatibility
if (typeof window !== 'undefined') window.SETTINGS_QA_SUITE = SETTINGS_QA_SUITE;
if (typeof module !== 'undefined' && module.exports) module.exports = { SETTINGS_QA_SUITE };
```

### Supported Actions

| Action | Required Fields | Description |
|---|---|---|
| `none` | — | No action required; directly executes the assertion. |
| `click` | `selector` | Dispatches synthetic mouse sequence (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`). |
| `navigate_hash` | `target` | Sets `window.location.hash` and dispatches `HashChangeEvent`. |
| `navigate_and_click` | `prepHash`, `selector` | Changes hash first, then clicks the target selector. |
| `press_key` | `key` (e.g. `'Escape'`) | Dispatches `KeyboardEvent('keydown')` in isolated and main worlds. |
| `input` | `selector`, `value` | Sets element value and dispatches `input` and `change` events. |
| `click_backdrop` | `selector` | Clicks modal overlay backdrop to verify dismissal. |
| `toggle_currency` | `currency` (`'USD'` / `'BDT'`) | Dispatches currency change to the module's currency engine. |
| `wait_ms` | `duration` | Deliberate async cooldown period. |

### Supported Assertions

| Assertion Type | Parameters | Evaluation Mechanism |
|---|---|---|
| `wait_selector` | `selector`, `timeout` | Polls DOM until element exists or timeout occurs (default 4000ms). |
| `modal_open` | `selector` | Checks that modal exists and has `.active` class or `display: flex/block`. |
| `modal_closed` | `selector` | Confirms modal is detached, hidden, or has `.active` removed. |
| `hash_equals` | `expected` | Asserts `window.location.hash === expected`. |
| `custom_check` | `check` | Executes specialized assertion block in `content-script.js` or main world. |

---

## 6. Complete Admin Command Center Suite Registry (22 Modules)

| # | Module Name | Hash Route | Suite File | Total Steps | Status |
|---|---|---|---|:---:|:---:|
| 01 | Executive Overview | `#dashboard` | `dashboard-qa.js` | 19 | ✅ 100% Passed |
| 02 | 5-Engine Growth Operations | `#engines` | `engines-qa.js` | 16 | ✅ 100% Passed |
| 03 | Platform Portfolio Registry | `#platforms` | `platforms-qa.js` | 20 | ✅ 100% Passed |
| 04 | Marketplace Gig Studio | `#gigs` | `gigs-qa.js` | 19 | ✅ 100% Passed |
| 05 | Agency Analytics & Intelligence | `#analytics` | `analytics-qa.js` | 18 | ✅ 100% Passed |
| 06 | CRM Leads Pipeline | `#leads` | `leads-qa.js` | 18 | ✅ 100% Passed |
| 07 | Client Proposals Studio | `#proposals` | `proposals-qa.js` | 18 | ✅ 100% Passed |
| 08 | Clients & Retainers CRM | `#crm` | `crm-qa.js` | 18 | ✅ 100% Passed |
| 09 | Production Pipeline Hub | `#kanban` | `kanban-qa.js` | 18 | ✅ 100% Passed |
| 10 | Review Room & Proofing Hub | `#reviews` | `reviews-qa.js` | 19 | ✅ 100% Passed |
| 11 | Content OS & Brand Engine | `#content-os` | `content-os-qa.js` | 18 | ✅ 100% Passed |
| 12 | Social Media Planner | `#social` | `social-qa.js` | 18 | ✅ 100% Passed |
| 13 | Services & CMS Engine | `#cms` | `cms-qa.js` | 18 | ✅ 100% Passed |
| 14 | Brand Command Center | `#brands` | `brands-qa.js` | 18 | ✅ 100% Passed |
| 15 | DigiVault Subs & Commerce | `#digistore` | `digistore-qa.js` | 18 | ✅ 100% Passed |
| 16 | DBM Operations & Team Command | `#dbm` | `dbm-qa.js` | 18 | ✅ 100% Passed |
| 17 | Financial Intelligence | `#finance` | `finance-qa.js` | 18 | ✅ 100% Passed |
| 18 | HR Operations & Team Roster | `#hr` | `hr-qa.js` | 18 | ✅ 100% Passed |
| 19 | Physical Hardware Assets | `#assets` | `assets-qa.js` | 18 | ✅ 100% Passed |
| 20 | Support Desk & Operations Triage | `#tickets` | `tickets-qa.js` | 18 | ✅ 100% Passed |
| 21 | Bot Engine & Automation Workflows | `#automation` | `automation-qa.js` | 18 | ✅ 100% Passed |
| 22 | Workspace & System Settings | `#settings` | `settings-qa.js` | 18 | ✅ Ready for Run |

---

## 7. Developer Onboarding: How to Install & Use

### Installation
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the extension directory:
   `c:\Users\LeNoVo\Documents\GRO10X Business\Gro10x.ai\extension\gro10x-qa-runner`
6. Pin the **GRO10X QA Runner** icon (`⚡`) to your Chrome toolbar.

### Running an Audit
1. Open the GRO10X Admin Command Center in Chrome (e.g. `http://localhost:3000/app/`).
2. Click the `⚡` extension icon in the toolbar. The Chrome Side Panel opens on the right.
3. Verify the connection indicator displays `🟢 Connected`.
4. In the **Select Target Tab** dropdown, pick the module you want to test (e.g. `⚙️ Settings (#settings)`).
5. Click **▶ Run QA Suite**.
6. Observe the real-time action stream as elements highlight in green and steps transition from `running` to `passed`.
7. Once complete, view the scorecard and click **📋 Copy Report** to copy the formatted Markdown audit report directly to your clipboard.

### Reloading After Modifying Code
When you modify any extension files (`sidepanel.js`, `content-script.js`, or any suite in `suites/`):
1. Go to `chrome://extensions/`.
2. Locate **GRO10X Platform QA Automation Runner** and click the **circular reload icon** (`🔄`).
3. Switch to your GRO10X browser tab and press **F5** (to reload the page with the freshly updated content script).

---

## 8. Step-by-Step: Adding a New Test Suite

To add an automated test suite for a new module or platform portal (e.g., Client Portal or Crew Portal):

### Step 1: Create the Suite File
Create `suites/new-module-qa.js`:
```javascript
const NEW_MODULE_QA_SUITE = {
  id: 'new-module',
  name: 'New Module QA Suite',
  platform: 'admin',
  targetHash: '#new-module',
  description: 'Validates KPIs, tabs, modals, and zero dialogs.',
  steps: [
    {
      id: 'step-01',
      title: '1. Navigate to New Module',
      action: 'navigate_hash',
      target: '#new-module',
      assertion: { type: 'custom_check', check: 'assert_new_module_mounted' }
    },
    // Add steps 2 through 17...
    {
      id: 'step-18',
      title: '18. Final Clean Audit — 0 Native Dialogs',
      action: 'none',
      assertion: { type: 'custom_check', check: 'assert_clean_audit' }
    }
  ]
};

if (typeof window !== 'undefined') window.NEW_MODULE_QA_SUITE = NEW_MODULE_QA_SUITE;
if (typeof module !== 'undefined' && module.exports) module.exports = { NEW_MODULE_QA_SUITE };
```

### Step 2: Register in `suites/suite-loader.js`
Add your module definition to `PLATFORM_TAB_MAP`:
```javascript
{ id: 'new-module', name: '✨ New Module', hash: '#new-module', suiteFile: 'new-module-qa.js', active: true }
```

### Step 3: Register in `sidepanel.html`
1. Add an `<option>` in the `<select id="tabSelect">`:
   ```html
   <option value="new-module">✨ New Module (#new-module)</option>
   ```
2. Add the script tag before `sidepanel.js`:
   ```html
   <script src="suites/new-module-qa.js"></script>
   ```

### Step 4: Wire Suite in `sidepanel.js`
Add the branch to `getActiveSuite()`:
```javascript
if (selectedTab === 'new-module' && window.NEW_MODULE_QA_SUITE) {
  return window.NEW_MODULE_QA_SUITE;
}
```

### Step 5: Implement Assertions in `content-script.js`
Under `executeStep(step)` in `content-script.js`, handle your custom assertions:
```javascript
} else if (assertion.check === 'assert_new_module_mounted') {
  await sleep(400);
  const root = document.getElementById('newModuleRoot');
  if (!root) throw new Error('New Module root container not found');
  result.detail = 'Element mounted: New Module Root';
}
```

---

## 9. Troubleshooting & FAQ

### Q1: The status indicator shows "Press F5 on Tab" or "Disconnected".
- **Cause**: Chrome extensions lose active message ports when the extension is reloaded in `chrome://extensions` while the tab remains on the old execution context.
- **Solution**: Focus the application tab and press **F5** to refresh the page. The runner will auto-detect the tab and switch to `🟢 Connected`.

### Q2: A step fails with "Timed out waiting for selector: #elementId".
- **Cause**: The element did not mount within 4000ms, or the module failed to render due to a JavaScript error on route transition.
- **Solution**: Check DevTools Console (`F12`) on the page tab for uncaught exceptions, and verify that the target hash router correctly renders the element ID.

### Q3: A step fails with "Violated Zero Native Dialogs rule: 1 calls captured!".
- **Cause**: Legacy code triggered `alert()`, `confirm()`, or `prompt()`.
- **Solution**: Replace the native dialog with an asynchronous, non-blocking UI toast or an inline modal dialog.

---
*Maintained by the GRO10X Engineering & Platform Quality Team.*
