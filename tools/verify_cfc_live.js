const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Running Live Production Forensic Audit on Vercel Edge...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const url = 'https://gro10x-ai.vercel.app/prototypes/cfc/';
  for (const w of [360, 390, 412]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
    await page.goto(url, { waitUntil: 'networkidle2' });

    const overflow = await page.evaluate(() => {
      const docScroll = document.documentElement.scrollWidth;
      const bodyScroll = document.body.scrollWidth;
      const innerWidth = window.innerWidth;
      return {
        docScroll,
        bodyScroll,
        innerWidth,
        passed: docScroll <= innerWidth && bodyScroll <= innerWidth
      };
    });
    console.log(`[${w}px Live Edge] Viewport Check:`, overflow.passed ? 'PASSED' : 'FAILED', overflow);

    if (w === 390) {
      console.log('Testing Live Registration Flow...');
      await page.click('#tabBtn-registration');
      await new Promise(r => setTimeout(r, 200));
      await page.click('button[onclick="goToRegStep(2)"]');
      await new Promise(r => setTimeout(r, 200));
      await page.click('button[onclick="goToRegStep(3)"]');
      await new Promise(r => setTimeout(r, 200));
      await page.click('button[onclick="submitDemoRegistration()"]');
      await new Promise(r => setTimeout(r, 300));

      const refId = await page.evaluate(() => {
        const el = document.getElementById('confRefId');
        return el ? el.textContent : '';
      });
      console.log('Live Registration Confirmed Reference ID:', refId);
    }
    await page.close();
  }
  await browser.close();
  console.log('Live Production Audit Finished.');
})();
