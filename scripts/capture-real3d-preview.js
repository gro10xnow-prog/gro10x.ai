const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureReal3D() {
  const artMediaDir = 'C:/Users/LeNoVo/.gemini/antigravity/brain/895ad1f6-33f4-4ee6-bd65-45d7acd0b387/.tempmediaStorage';
  if (!fs.existsSync(artMediaDir)) fs.mkdirSync(artMediaDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });

    console.log('Navigating to http://127.0.0.1:3000/real3d ...');
    await page.goto('http://127.0.0.1:3000/real3d', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait 3 seconds for 3D model to render in WebGL
    await new Promise(r => setTimeout(r, 3000));

    // Capture 1: Fox Model
    const shot1 = path.join(artMediaDir, 'real3d_fox_view.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved Fox view:', shot1);

    // Switch to Astronaut Model
    const btnAstro = await page.$('.catalog-tab[data-model="astronaut"]');
    if (btnAstro) {
      await btnAstro.click();
      await new Promise(r => setTimeout(r, 3000));
      const shot2 = path.join(artMediaDir, 'real3d_astronaut_view.png');
      await page.screenshot({ path: shot2 });
      console.log('Saved Astronaut view:', shot2);
    }

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('Real3D capture complete!');
  }
}

captureReal3D();
