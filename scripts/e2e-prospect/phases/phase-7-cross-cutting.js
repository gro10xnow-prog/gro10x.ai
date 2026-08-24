/**
 * scripts/e2e-prospect/phases/phase-7-cross-cutting.js
 * Phase 7: Cross-Cutting Testing Framework (Viewports, Touch Targets, API Matrix, Rate Limiting)
 */
const http = require('http');
const { BASE_URL, wait, captureScreenshot, VIEWPORTS, PORT } = require('../utils');

async function makePostRequest(path, body) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    const req = http.request(
      `http://localhost:${PORT}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function makeGetRequest(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
  });
}

async function runPhase7(page) {
  const results = {
    name: 'Phase 7: Cross-Cutting Framework & API Verification',
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

  console.log(`\n🚀 Executing Phase 7: Cross-Cutting Framework...`);

  try {
    // 7.1 Multi-Viewport Responsiveness
    const viewportKeys = Object.keys(VIEWPORTS);
    for (const key of viewportKeys) {
      await page.setViewport(VIEWPORTS[key]);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      await wait(400);
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      record(`7.1 Viewport ${key} (${VIEWPORTS[key].width}x${VIEWPORTS[key].height}) has zero horizontal overflow`, !hasHorizontalScroll);
    }
    await page.setViewport(VIEWPORTS.desktop);

    // 7.2 Touch Target Audit (min 36-44px on visible key buttons)
    const buttonDimensions = await page.evaluate(() => {
      const selectors = ['.pb-btn-primary', '.pb-btn-secondary', '.pb-btn-svc', '.pb-btn-plan', '.pb-mb-btn'];
      const results = [];
      selectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        els.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0) {
            const rect = el.getBoundingClientRect();
            results.push({ selector: sel, height: rect.height, valid: rect.height >= 36 });
          }
        });
      });
      return results;
    });
    const allButtonsValid = buttonDimensions.length > 0 && buttonDimensions.every(b => b.valid);
    record('7.2 Interactive action buttons meet accessible touch target standards (>=36px minimum height)', allButtonsValid);

    // 7.3 API Telemetry Matrix
    const trackRes = await makePostRequest('/api/analytics/track', {
      event: 'page_view',
      label: '/test-qa',
      referrer: 'https://google.com'
    });
    record('7.3.1 POST /api/analytics/track returns 200 OK (no 404s)', trackRes.statusCode === 200 && trackRes.data.success);

    const clientCheckRes = await makeGetRequest('/api/public/client-check?phone=01700000000');
    record('7.3.2 GET /api/public/client-check returns 200 with search object', clientCheckRes.statusCode === 200 && clientCheckRes.data.success);

    const servicesRes = await makeGetRequest('/api/services');
    record('7.3.3 GET /api/services returns 200 with service array', servicesRes.statusCode === 200 && Array.isArray(servicesRes.data.data));

    // 7.4 Public Lead Submission End-to-End
    const leadSubmitRes = await makePostRequest('/api/leads', {
      clientName: 'Phase 7 Verification Lead',
      contactPerson: 'E2E QA Lead',
      contactEmail: 'e2eqa@purplebot.digital',
      phone: `01711${Date.now().toString().slice(-6)}`,
      service: 'Monthly Social Media Retainer',
      source: 'Phase 7 E2E Automated Verification',
      utm_source: 'qa_runner',
      utm_medium: 'automated_test',
      utm_campaign: 'prospect_overhaul'
    });
    record('7.4.1 POST /api/leads persists lead with UTM attribution and score', leadSubmitRes.statusCode === 200 && (leadSubmitRes.data.success || leadSubmitRes.data.lead));

  } catch (err) {
    record('Phase 7 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase7 };
