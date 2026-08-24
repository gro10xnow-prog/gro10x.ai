/**
 * scripts/e2e-prospect/utils.js
 * Shared Utilities, Assertions, Viewport Configurations, and Puppeteer Setup for Prospect E2E Suite
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/version`, (res) => {
      resolve(res.statusCode === 200);
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
    console.log(`✅ Server already active on ${BASE_URL}`);
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

async function captureScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false },
  laptop: { width: 1024, height: 768, isMobile: false },
  tablet: { width: 768, height: 1024, isMobile: true },
  mobileLarge: { width: 414, height: 896, isMobile: true },
  mobileStandard: { width: 375, height: 667, isMobile: true }
};

module.exports = {
  PORT,
  BASE_URL,
  REPORTS_DIR,
  SCREENSHOTS_DIR,
  VIEWPORTS,
  isServerRunning,
  startServerIfNeeded,
  launchBrowser,
  wait,
  captureScreenshot
};
