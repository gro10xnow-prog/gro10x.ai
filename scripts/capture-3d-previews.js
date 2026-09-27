const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function capture3DViewer() {
  const artMediaDir = 'C:/Users/LeNoVo/.gemini/antigravity/brain/895ad1f6-33f4-4ee6-bd65-45d7acd0b387/.tempmediaStorage';
  if (!fs.existsSync(artMediaDir)) fs.mkdirSync(artMediaDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });

    console.log('Navigating to http://127.0.0.1:3000/3d-viewer ...');
    await page.goto('http://127.0.0.1:3000/3d-viewer', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait 1 second for render
    await new Promise(r => setTimeout(r, 1000));

    // Capture Front View
    const shot1 = path.join(artMediaDir, '3d_viewer_front.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved front shot:', shot1);

    // Switch to Left Profile by clicking thumbnail
    const thumbLeft = await page.$('.strip-thumb[data-code="CL"]');
    if (thumbLeft) {
      await thumbLeft.click();
      await new Promise(r => setTimeout(r, 500));
      const shot2 = path.join(artMediaDir, '3d_viewer_left_profile.png');
      await page.screenshot({ path: shot2 });
      console.log('Saved left profile shot:', shot2);
    }

    // Switch to Top-Right High Angle
    const thumbTR = await page.$('.strip-thumb[data-code="TR"]');
    if (thumbTR) {
      await thumbTR.click();
      await new Promise(r => setTimeout(r, 500));
      const shot3 = path.join(artMediaDir, '3d_viewer_top_right.png');
      await page.screenshot({ path: shot3 });
      console.log('Saved top right shot:', shot3);
    }

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('Capture complete!');
  }
}

capture3DViewer();
