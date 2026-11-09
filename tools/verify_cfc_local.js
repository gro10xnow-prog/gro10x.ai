const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Simple static server on port 4599
const staticDir = path.resolve(__dirname, '../public');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/prototypes/cfc' || reqPath === '/prototypes/cfc/') {
    reqPath = '/prototypes/cfc/index.html';
  }
  const filePath = path.join(staticDir, reqPath.replace(/^\/prototypes/, 'prototypes'));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4599, async () => {
  console.log('Testing server running on http://localhost:4599');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const width of [360, 390, 412]) {
      console.log(`\n--- Testing Viewport: ${width}x800 ---`);
      const page = await browser.newPage();
      await page.setViewport({ width, height: 800, isMobile: true, hasTouch: true });
      await page.goto('http://localhost:4599/prototypes/cfc/', { waitUntil: 'domcontentloaded' });

      // Check overflow
      const overflow = await page.evaluate(() => {
        const docScroll = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const bodyScroll = document.body.scrollWidth;
        return {
          docScroll,
          bodyScroll,
          innerWidth,
          passed: docScroll <= innerWidth && bodyScroll <= innerWidth
        };
      });

      console.log(`[${width}px] Overflow Check:`, overflow.passed ? 'PASSED' : 'FAILED', overflow);

      // Test Step 1 -> 2 -> 3 -> 4 Registration Flow
      if (width === 390) {
        console.log('Testing Registration Flow in Browser...');
        await page.click('#tabBtn-registration');
        await new Promise(r => setTimeout(r, 200));

        // Step 1 to Step 2
        await page.click('button[onclick="goToRegStep(2)"]');
        await new Promise(r => setTimeout(r, 200));

        // Step 2 to Step 3
        await page.click('button[onclick="goToRegStep(3)"]');
        await new Promise(r => setTimeout(r, 200));

        // Step 3 to Step 4 (Submit)
        await page.click('button[onclick="submitDemoRegistration()"]');
        await new Promise(r => setTimeout(r, 300));

        const confText = await page.evaluate(() => {
          const el = document.getElementById('confRefId');
          return el ? el.textContent : '';
        });
        console.log('Generated Reference ID in DOM:', confText);
        if (confText.includes('CFC2-REG-')) {
          console.log('Registration flow verified end-to-end: SUCCESS');
        }
      }

      await page.close();
    }
  } catch (err) {
    console.error('Error during local browser test:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('All local tests concluded.');
  }
});
