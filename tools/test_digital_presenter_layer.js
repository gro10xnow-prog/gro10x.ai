const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  const filePath = 'file:///' + path.resolve('public/pitch/nhf/index.html').replace(/\\\\/g, '/');

  console.log('--- 1. TESTING SLIDE 0 INITIAL LOAD ---');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  const initialCheck = await page.evaluate(() => {
    const s0 = document.getElementById('slide-0');
    const s1 = document.getElementById('slide-1');
    const counter = document.getElementById('slideCounter').innerText;
    const audioHUD = document.getElementById('audioHUD');
    const captionBand = document.getElementById('captionBand');
    const captionText = document.getElementById('captionText').innerText;
    const portrait = s0.querySelector('img').src;

    return {
      s0Active: s0.classList.contains('active'),
      s1Active: s1.classList.contains('active'),
      counter,
      audioHUDExists: !!audioHUD,
      captionBandExists: !!captionBand,
      captionText,
      portrait
    };
  });
  console.log('Initial Check on Slide 0:', initialCheck);

  console.log('\n--- 2. TESTING PLAY / PAUSE / RESTART AUDIO CONTROLS ---');
  // Trigger play via evaluate
  await page.evaluate(() => {
    toggleCurrentAudio();
  });
  await new Promise(r => setTimeout(r, 1500));

  const playingCheck = await page.evaluate(() => {
    return {
      paused: slideAudio.paused,
      currentTime: slideAudio.currentTime,
      progress: document.getElementById('audioProgressBar').style.width,
      playIcon: document.getElementById('audioPlayIcon').innerText,
      status: document.getElementById('audioStatusBadge').innerText,
      captionText: document.getElementById('captionText').innerText
    };
  });
  console.log('After 1.5s Play:', playingCheck);

  // Trigger pause (pause holds position)
  await page.evaluate(() => {
    toggleCurrentAudio();
  });
  const pausedTime1 = await page.evaluate(() => slideAudio.currentTime);
  await new Promise(r => setTimeout(r, 1000));
  const pausedTime2 = await page.evaluate(() => slideAudio.currentTime);
  console.log('Pause Holds Position Check:', { pausedTime1, pausedTime2, held: pausedTime1 === pausedTime2 });

  // Trigger resume
  await page.evaluate(() => {
    toggleCurrentAudio();
  });
  await new Promise(r => setTimeout(r, 1000));
  const resumeTime = await page.evaluate(() => slideAudio.currentTime);
  console.log('Resume Check:', { pausedTime1, resumeTime, resumed: resumeTime > pausedTime1 });

  // Trigger restart
  await page.evaluate(() => {
    restartCurrentAudio();
  });
  await new Promise(r => setTimeout(r, 500));
  const restartedTime = await page.evaluate(() => slideAudio.currentTime);
  console.log('Restart Check (should be < 1.0s):', restartedTime);

  console.log('\n--- 3. TESTING SLIDE ADVANCE TERMINATES PREVIOUS AUDIO ---');
  await page.evaluate(() => {
    nextSlide(); // Go to Slide 1
  });
  const slide1Check = await page.evaluate(() => {
    const s0 = document.getElementById('slide-0');
    const s1 = document.getElementById('slide-1');
    const counter = document.getElementById('slideCounter').innerText;
    return {
      s0Active: s0.classList.contains('active'),
      s1Active: s1.classList.contains('active'),
      counter,
      audioPaused: slideAudio.paused,
      audioCurrentTime: slideAudio.currentTime,
      audioSrc: slideAudio.src,
      captionText: document.getElementById('captionText').innerText
    };
  });
  console.log('Slide 1 State (No autoplay, audio reset):', slide1Check);

  console.log('\n--- 4. TESTING SLIDE 8 (COMMERCIALS / MONEY SLIDE) CLEARANCE ---');
  await page.evaluate(() => {
    goToSlide(8); // Navigate to Slide 8
  });
  const slide8Check = await page.evaluate(() => {
    const s8 = document.getElementById('slide-8');
    const counter = document.getElementById('slideCounter').innerText;
    const commercialCard = s8.querySelector('.lg\\:col-span-7');
    const captionBand = document.getElementById('captionBand');
    
    const cardRect = commercialCard.getBoundingClientRect();
    const captionRect = captionBand.getBoundingClientRect();

    // Check collision: does captionRect overlap cardRect?
    const overlap = !(captionRect.right < cardRect.left || 
                      captionRect.left > cardRect.right || 
                      captionRect.bottom < cardRect.top || 
                      captionRect.top > cardRect.bottom);

    return {
      counter,
      s8Active: s8.classList.contains('active'),
      cardBottom: cardRect.bottom,
      captionTop: captionRect.top,
      distanceBetweenCardAndCaption: captionRect.top - cardRect.bottom,
      overlap
    };
  });
  console.log('Slide 8 Collision Check:', slide8Check);

  console.log('\n--- 5. ZERO HORIZONTAL SCROLL AUDIT ACROSS VIEWPORTS ---');
  const widths = [360, 375, 390, 412, 768, 1280, 1920];
  for (const w of widths) {
    await page.setViewport({ width: w, height: 1080 });
    const scrollCheck = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollable: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log(`Width ${w}px: scrollable=${scrollCheck.scrollable} (client=${scrollCheck.clientWidth}, scroll=${scrollCheck.scrollWidth})`);
  }

  await browser.close();
  console.log('\n--- LOCAL AUDIT COMPLETE ---');
})();
