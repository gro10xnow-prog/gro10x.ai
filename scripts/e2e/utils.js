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
    const req = http.get(`${BASE_URL}/api/system-health`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
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
    const server = app.listen(PORT, () => {
      console.log(`✅ Server listening on ${BASE_URL}`);
      resolve(server);
    });
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
  TestTracker
};
