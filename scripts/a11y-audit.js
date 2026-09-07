/**
 * scripts/a11y-audit.js
 * Comprehensive Accessibility (a11y) Automated Debugger & Auditor
 * Based on Google web.dev & Chrome DevTools accessibility standards.
 */
const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple static server for audit target pages if needed
const app = require('../server');

async function runAudit() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Temporary audit server listening on ${baseUrl}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pagesToAudit = [
    { name: 'Admin Command Center (App Shell)', url: `${baseUrl}/app/index.html` },
    { name: 'Sprint 01 Campaign Portal', url: `${baseUrl}/sprint.html` },
    { name: 'Agency Homepage', url: `${baseUrl}/index.html` },
    { name: 'Review Room', url: `${baseUrl}/reviewroom.html` }
  ];

  const results = {};

  for (const pageInfo of pagesToAudit) {
    console.log(`\n==================================================`);
    console.log(`🔍 Auditing: ${pageInfo.name} (${pageInfo.url})`);
    console.log(`==================================================`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Enable issue / console logging
    const consoleIssues = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleIssues.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    try {
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Allow dynamic rendering
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.warn(`⚠️ Navigation notice: ${e.message}`);
    }

    // 1. Global Page Checks
    const globalChecks = await page.evaluate(() => ({
      lang: document.documentElement.lang || 'MISSING - Screen readers need this for pronunciation',
      title: document.title || 'MISSING - Required for context',
      viewport: document.querySelector('meta[name="viewport"]')?.content || 'MISSING - Check for user-scalable=no',
      hasReducedMotionMedia: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Enabled' : 'Disabled'
    }));

    // 2. Orphaned Form Inputs
    const orphanedInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, select, textarea'))
        .filter(i => {
          // Ignore hidden inputs
          if (i.type === 'hidden' || i.style.display === 'none' || i.getAttribute('aria-hidden') === 'true') return false;
          const hasId = i.id && document.querySelector(`label[for="${i.id}"]`);
          const hasAria = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('title');
          return !hasId && !hasAria && !i.closest('label');
        })
        .map(i => ({
          tag: i.tagName.toLowerCase(),
          type: i.type || 'text',
          id: i.id || '(no-id)',
          name: i.name || '(no-name)',
          placeholder: i.placeholder || '',
          className: i.className || ''
        }));
    });

    // 3. Unlabeled Buttons & Links (Missing Accessible Names)
    const unlabeledInteractives = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll('button, a[href]').forEach(el => {
        if (el.offsetParent === null || el.getAttribute('aria-hidden') === 'true') return; // hidden
        const text = el.innerText ? el.innerText.trim() : '';
        const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
        const imgAlt = el.querySelector('img')?.getAttribute('alt');
        const accessibleName = text || ariaLabel || imgAlt;

        if (!accessibleName) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            htmlSnippet: el.outerHTML.substring(0, 120),
            id: el.id || '',
            className: el.className || ''
          });
        }
      });
      return issues;
    });

    // 4. Images Missing Alt Attributes
    const missingAltImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => !img.hasAttribute('alt') && img.getAttribute('aria-hidden') !== 'true')
        .map(img => ({
          src: img.src?.substring(0, 80) || '',
          className: img.className || '',
          id: img.id || ''
        }));
    });

    // 5. Heading Structure & Levels
    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .filter(h => h.offsetParent !== null)
        .map(h => ({
          level: parseInt(h.tagName.substring(1), 10),
          tag: h.tagName.toLowerCase(),
          text: h.innerText?.trim().substring(0, 60) || ''
        }));

      const issues = [];
      if (headings.length === 0) {
        issues.push('No headings found on page');
      } else {
        if (headings[0].level !== 1) {
          issues.push(`First heading is <${headings[0].tag}> instead of <h1>`);
        }
        for (let i = 0; i < headings.length - 1; i++) {
          const curr = headings[i].level;
          const next = headings[i + 1].level;
          if (next > curr + 1) {
            issues.push(`Skipped heading level: <${headings[i].tag}> ("${headings[i].text}") jumped to <${headings[i + 1].tag}> ("${headings[i + 1].text}")`);
          }
        }
      }
      return { totalHeadings: headings.length, headings: headings.slice(0, 10), issues };
    });

    // 6. Tap Target Sizing (< 44px x 44px on interactive controls)
    const smallTapTargets = await page.evaluate(() => {
      const small = [];
      document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
        if (el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40)) {
          // Filter out inline text links inside paragraphs
          if (el.tagName === 'A' && el.closest('p')) return;
          small.push({
            tag: el.tagName.toLowerCase(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: (el.innerText || el.getAttribute('aria-label') || el.id || el.className || '').trim().substring(0, 40)
          });
        }
      });
      return small.slice(0, 15);
    });

    // 7. Low Color Contrast Approximation
    const contrastIssues = await page.evaluate(() => {
      function getRGBA(colorStr) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return [255, 255, 255, 1];
        return [
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
          match[4] !== undefined ? parseFloat(match[4]) : 1
        ];
      }
      function blendWithBase(rgba, base = [6, 8, 14]) {
        const a = rgba[3];
        return [
          Math.round(rgba[0] * a + base[0] * (1 - a)),
          Math.round(rgba[1] * a + base[1] * (1 - a)),
          Math.round(rgba[2] * a + base[2] * (1 - a))
        ];
      }
      function luminance(r, g, b) {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      const issues = [];
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a, label');
      textElements.forEach(el => {
        if (el.offsetParent === null || !el.innerText || el.innerText.trim().length === 0) return;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

        // Skip elements with transparent background (relies on parent)
        if (style.backgroundColor.includes('0, 0, 0, 0') || style.backgroundColor === 'transparent') return;

        const fg = blendWithBase(getRGBA(style.color));
        const bg = blendWithBase(getRGBA(style.backgroundColor));
        const l1 = luminance(fg[0], fg[1], fg[2]);
        const l2 = luminance(bg[0], bg[1], bg[2]);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        const fontSize = parseFloat(style.fontSize) || 16;
        const isBold = parseInt(style.fontWeight, 10) >= 700;
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
        const minRatio = isLargeText ? 3.0 : 4.5;

        if (ratio < minRatio) {
          issues.push({
            text: el.innerText.trim().substring(0, 45),
            color: style.color,
            bgColor: style.backgroundColor,
            ratio: ratio.toFixed(2),
            required: minRatio
          });
        }
      });
      return issues.slice(0, 10);
    });

    results[pageInfo.name] = {
      globalChecks,
      orphanedInputs,
      unlabeledInteractives,
      missingAltImages,
      headingStructure,
      smallTapTargets,
      contrastIssues
    };

    console.log(`Global Checks:`, globalChecks);
    console.log(`Orphaned Inputs: ${orphanedInputs.length}`);
    if (orphanedInputs.length > 0) console.log(orphanedInputs);
    console.log(`Unlabeled Buttons/Links: ${unlabeledInteractives.length}`);
    if (unlabeledInteractives.length > 0) console.log(unlabeledInteractives.slice(0, 5));
    console.log(`Missing Alt Images: ${missingAltImages.length}`);
    console.log(`Heading Issues: ${headingStructure.issues.length}`);
    if (headingStructure.issues.length > 0) console.log(headingStructure.issues);
    console.log(`Small Tap Targets (<40px): ${smallTapTargets.length}`);
    console.log(`Low Contrast Items: ${contrastIssues.length}`);

    await page.close();
  }

  await browser.close();
  server.close();

  const reportPath = path.join(__dirname, '../data/a11y-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✅ Full a11y audit report saved to ${reportPath}`);
  process.exit(0);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
