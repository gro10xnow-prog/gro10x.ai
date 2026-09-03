/**
 * scripts/e2e/utils.js
 * Shared Utilities, Assertions, and Browser Setup for E2E Test Suite
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;
const APP_URL = `${BASE_URL}/app/index.html`;

const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/`, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServerIfNeeded() {
  const running = await isServerRunning();
  if (running) {
    console.log(`✅ Server already running on ${BASE_URL}`);
    return null;
  }
  console.log(`🚀 Starting Express server on port ${PORT}...`);
  const app = require('../../server.js');
  return new Promise((resolve) => {
    try {
      const server = app.listen(PORT, () => {
        console.log(`✅ Server listening on ${BASE_URL}`);
        resolve(server);
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`ℹ️ Port ${PORT} already active (${err.code}), using existing instance.`);
          resolve(null);
        } else {
          console.warn(`[E2E Server] Note on start:`, err.message);
          resolve(null);
        }
      });
    } catch (e) {
      resolve(null);
    }
  });
}


async function launchBrowser(options = {}) {
  const browser = await puppeteer.launch({
    headless: options.headless !== undefined ? options.headless : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  return { browser, page };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TestTracker {
  constructor(phaseName) {
    this.phaseName = phaseName;
    this.results = [];
    this.startTime = Date.now();
  }

  async runStep(id, title, testFn) {
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      console.log(`  ✅ [${id}] ${title} (${duration}ms)`);
      this.results.push({ id, title, status: 'PASSED', duration, error: null });
      return true;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`  ❌ [${id}] ${title} (${duration}ms):`, err.message);
      this.results.push({ id, title, status: 'FAILED', duration, error: err.message });
      return false;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion Failed: ${message} (Expected: "${expected}", Received: "${actual}")`);
    }
  }

  async screenshot(page, filename) {
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    return filePath;
  }

  getSummary() {
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const total = this.results.length;
    const duration = Date.now() - this.startTime;
    return {
      phase: this.phaseName,
      total,
      passed,
      failed,
      duration,
      results: this.results
    };
  }
}

async function waitForToast(page, expectedText = '', timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const toastText = await page.evaluate(() => {
      const container = document.getElementById('gro10xToastContainer') || document.querySelector('.toast-container, .toast, [role="alert"]');
      return container ? container.textContent : '';
    });
    if (toastText && (!expectedText || toastText.toLowerCase().includes(expectedText.toLowerCase()))) {
      return toastText;
    }
    await wait(150);
  }
  return null;
}

async function interceptApiCall(page, urlPattern, actionFn, timeout = 5000) {
  let capturedReq = null;
  let capturedRes = null;

  const responsePromise = page.waitForResponse(response => {
    const match = typeof urlPattern === 'string' 
      ? response.url().includes(urlPattern)
      : urlPattern.test(response.url());
    return match;
  }, { timeout }).catch(() => null);

  await actionFn();
  capturedRes = await responsePromise;
  return capturedRes;
}

async function assertModalOpen(page, modalSelector) {
  const isOpen = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }, modalSelector);
  if (!isOpen) {
    throw new Error(`Modal "${modalSelector}" was expected to be open, but is hidden or absent.`);
  }
  return true;
}

async function assertModalClosed(page, modalSelector) {
  const isClosed = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return true;
    const style = window.getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || !el.classList.contains('active');
  }, modalSelector);
  if (!isClosed) {
    throw new Error(`Modal "${modalSelector}" was expected to be closed, but is visible.`);
  }
  return true;
}

async function assertTableRowCount(page, tableSelector, minCount = 1) {
  const rowCount = await page.evaluate((sel) => {
    const rows = document.querySelectorAll(`${sel} tr, ${sel} .table-row, ${sel} .grid-card`);
    return rows.length;
  }, tableSelector);
  if (rowCount < minCount) {
    throw new Error(`Expected at least ${minCount} items in "${tableSelector}", found ${rowCount}`);
  }
  return rowCount;
}

module.exports = {
  PORT,
  BASE_URL,
  APP_URL,
  REPORTS_DIR,
  SCREENSHOTS_DIR,
  isServerRunning,
  startServerIfNeeded,
  launchBrowser,
  wait,
  waitForToast,
  interceptApiCall,
  assertModalOpen,
  assertModalClosed,
  assertTableRowCount,
  TestTracker
};

