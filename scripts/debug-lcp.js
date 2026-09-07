/**
 * scripts/debug-lcp.js
 * Comprehensive LCP & Core Web Vitals Diagnostic Suite
 * Follows Chrome DevTools and web.dev LCP debugging guidelines.
 */

const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const fs = require('fs');

const http = require('http');
const app = require('../server');

async function runLcpAudit() {
  console.log('🚀 Starting LCP Audit Suite...\n');

  // 1. Launch temporary server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Temporary audit server running at ${baseUrl}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const pagesToAudit = [
    { name: 'Agency Homepage', url: `${baseUrl}/index.html` },
    { name: 'Sprint 01 Campaign', url: `${baseUrl}/sprint.html` },
    { name: 'Review Room', url: `${baseUrl}/reviewroom.html` },
    { name: 'Admin Command Center', url: `${baseUrl}/app/index.html` }
  ];

  const fullReport = {};

  for (const target of pagesToAudit) {
    for (const mode of ['Desktop (Unthrottled)', 'Mobile (Fast 3G + 4x CPU)']) {
      const isMobile = mode.includes('Mobile');
      console.log(`\n==================================================`);
      console.log(`🔍 Profiling [${mode}] LCP for: ${target.name}`);
      console.log(`==================================================`);

      const page = await browser.newPage();
      if (isMobile) {
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      } else {
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
      }

      // Enable CDP performance and network emulation
      const client = await page.target().createCDPSession();
      await client.send('Performance.enable');

      if (isMobile) {
        await client.send('Network.enable');
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150, // 150ms RTT
          downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps Fast 3G
          uploadThroughput: (750 * 1024) / 8
        });
        await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      }

      // Register PerformanceObserver before navigation
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('gro10x_token', 'mock_admin_audit_token');
        localStorage.setItem('gro10x_user', JSON.stringify({
          id: 'admin-audit',
          name: 'Founder Admin',
          email: 'gro10xnow@gmail.com',
          role: 'admin'
        }));
        window.__lcpEntries = [];
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              window.__lcpEntries.push({
                elementTag: entry.element ? entry.element.tagName : null,
                elementId: entry.element ? entry.element.id : null,
                elementClass: entry.element ? entry.element.className : null,
                elementText: entry.element ? (entry.element.innerText || '').substring(0, 100).trim() : null,
                url: entry.url || '',
                startTime: entry.startTime,
                renderTime: entry.renderTime,
                loadTime: entry.loadTime,
                size: entry.size
              });
            }
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          console.error('LCP observer error:', e);
        }
      });

      const navStartTime = Date.now();
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // Allow paint events to settle
      await new Promise(r => setTimeout(r, isMobile ? 3500 : 1500));

    // Allow paint events to settle
    await new Promise(r => setTimeout(r, 1200));

    // Evaluate LCP metrics and subparts
    const analysis = await page.evaluate(() => {
      // 1. Retrieve LCP entry
      const entries = window.__lcpEntries || [];
      const lcpEntry = entries.length > 0 ? entries[entries.length - 1] : null;

      // 2. Navigation timing
      const navEntry = performance.getEntriesByType('navigation')[0];
      const ttfb = navEntry ? (navEntry.responseStart - navEntry.requestStart) : 0;
      const domContentLoaded = navEntry ? navEntry.domContentLoadedEventEnd : 0;
      const loadComplete = navEntry ? navEntry.loadEventEnd : 0;

      // 3. Subpart breakdown calculation
      let breakdown = null;
      if (lcpEntry && navEntry) {
        const totalLcp = lcpEntry.renderTime || lcpEntry.loadTime || lcpEntry.startTime;
        const ttfbTime = navEntry.responseStart;

        if (lcpEntry.url) {
          // Image/resource based LCP
          const resource = performance.getEntriesByName(lcpEntry.url)[0];
          if (resource) {
            const loadDelay = Math.max(0, resource.startTime - ttfbTime);
            const loadDuration = Math.max(0, resource.responseEnd - resource.startTime);
            const renderDelay = Math.max(0, totalLcp - resource.responseEnd);
            breakdown = {
              type: 'image',
              totalLcpMs: Math.round(totalLcp),
              ttfbMs: Math.round(ttfbTime),
              ttfbPct: Math.round((ttfbTime / totalLcp) * 100),
              resourceLoadDelayMs: Math.round(loadDelay),
              resourceLoadDelayPct: Math.round((loadDelay / totalLcp) * 100),
              resourceLoadDurationMs: Math.round(loadDuration),
              resourceLoadDurationPct: Math.round((loadDuration / totalLcp) * 100),
              elementRenderDelayMs: Math.round(renderDelay),
              elementRenderDelayPct: Math.round((renderDelay / totalLcp) * 100)
            };
          }
        }

        if (!breakdown) {
          // Text-based or immediate LCP
          const renderDelay = Math.max(0, totalLcp - ttfbTime);
          breakdown = {
            type: 'text',
            totalLcpMs: Math.round(totalLcp),
            ttfbMs: Math.round(ttfbTime),
            ttfbPct: Math.round((ttfbTime / (totalLcp || 1)) * 100),
            resourceLoadDelayMs: 0,
            resourceLoadDelayPct: 0,
            resourceLoadDurationMs: 0,
            resourceLoadDurationPct: 0,
            elementRenderDelayMs: Math.round(renderDelay),
            elementRenderDelayPct: Math.round((renderDelay / (totalLcp || 1)) * 100)
          };
        }
      }

      // 4. Common LCP Issues Audit
      const issues = [];

      // Lazy-loaded images in viewport
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          issues.push({
            type: 'lazy-loaded-in-viewport',
            severity: 'HIGH',
            element: img.outerHTML.substring(0, 160),
            fix: 'Remove loading="lazy" from this image — it is visible in the initial viewport and harms LCP.'
          });
        }
      });

      // Large viewport images missing fetchpriority="high"
      document.querySelectorAll('img:not([fetchpriority="high"])').forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width * rect.height > 40000) {
          issues.push({
            type: 'missing-fetchpriority-high',
            severity: 'MEDIUM',
            element: img.outerHTML.substring(0, 160),
            fix: 'Add fetchpriority="high" to this above-the-fold image to eliminate resource load delay.'
          });
        }
      });

      // Render-blocking scripts in <head>
      document.querySelectorAll('head script:not([async]):not([defer]):not([type="module"])').forEach(script => {
        if (script.src) {
          issues.push({
            type: 'render-blocking-head-script',
            severity: 'HIGH',
            element: script.outerHTML.substring(0, 160),
            fix: 'Add defer or async to avoid blocking the main thread during initial HTML parsing.'
          });
        }
      });

      // Preconnect / font display checks
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]'));
      const hasPreconnect = fontLinks.some(l => l.rel === 'preconnect');

      return {
        lcpEntry,
        breakdown,
        timing: {
          ttfb: Math.round(ttfb),
          domContentLoaded: Math.round(domContentLoaded),
          loadComplete: Math.round(loadComplete)
        },
        issues,
        fontCheck: {
          fontLinksCount: fontLinks.length,
          hasPreconnect
        }
      };
    });

    console.log(`⏱️  LCP Timing: ${analysis.breakdown ? analysis.breakdown.totalLcpMs + 'ms' : 'N/A'}`);
    if (analysis.lcpEntry) {
      console.log(`📌 LCP Element: <${analysis.lcpEntry.elementTag}> ${analysis.lcpEntry.elementId ? '#' + analysis.lcpEntry.elementId : ''} ${analysis.lcpEntry.elementClass ? '.' + analysis.lcpEntry.elementClass : ''}`);
      if (analysis.lcpEntry.url) console.log(`🔗 Resource URL: ${analysis.lcpEntry.url}`);
      if (analysis.lcpEntry.elementText) console.log(`📝 Text Snippet: "${analysis.lcpEntry.elementText.substring(0, 60)}..."`);
    }

    if (analysis.breakdown) {
      console.log(`📊 Subparts Breakdown:`);
      console.log(`   • TTFB: ${analysis.breakdown.ttfbMs}ms (${analysis.breakdown.ttfbPct}%)`);
      console.log(`   • Resource Load Delay: ${analysis.breakdown.resourceLoadDelayMs}ms (${analysis.breakdown.resourceLoadDelayPct}%)`);
      console.log(`   • Resource Load Duration: ${analysis.breakdown.resourceLoadDurationMs}ms (${analysis.breakdown.resourceLoadDurationPct}%)`);
      console.log(`   • Element Render Delay: ${analysis.breakdown.elementRenderDelayMs}ms (${analysis.breakdown.elementRenderDelayPct}%)`);
    }

    console.log(`⚠️  Issues Found: ${analysis.issues.length}`);
    if (analysis.issues.length > 0) {
      analysis.issues.forEach((iss, idx) => {
        console.log(`   [${idx + 1}] [${iss.severity}] ${iss.type}: ${iss.fix}`);
      });
    }

    fullReport[`${target.name} [${mode}]`] = analysis;
    await page.close();
    }
  }

  await browser.close();
  server.close();

  const reportPath = path.join(__dirname, '../data/lcp-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2), 'utf8');
  console.log(`\n✅ Full LCP audit report saved to ${reportPath}`);
  process.exit(0);
}

runLcpAudit().catch(err => {
  console.error('LCP audit failed:', err);
  process.exit(1);
});
