const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

describe('Ryze DOP Cinematography & AI Face Swap Pitch Asset (PITCH-RYZE-DOP-CINEMA-V1)', () => {

  describe('Surface A: The Boardroom & TV Audience Display (/pitch/ryze-dop)', () => {
    test('serves the TV deck at /pitch/ryze-dop with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the TV deck with trailing slash at /pitch/ryze-dop/', async () => {
      const res = await request(app).get('/pitch/ryze-dop/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders responsive meta viewport and title', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('name="viewport"');
      expect(res.text).toContain('viewport-fit=cover');
      expect(res.text).toContain('Ryze Commercial × Cinematography Unit');
      expect(res.text).toContain('Real Cinema Lighting + AI Face Swap');
    });

    test('renders strictly 8 canonical slides (#slide-1 to #slide-8)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      for (let i = 1; i <= 8; i++) {
        expect(res.text).toContain(`id="slide-${i}"`);
      }
      expect(res.text).not.toContain('id="slide-9"');
    });

    test('contains Slide 1: The Partnership (আসল ক্যামেরা + AI সোয়াপ)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RYZE COMMERCIAL × CINEMATOGRAPHY UNIT');
      expect(res.text).toContain('Real Cinema Lighting +');
      expect(res.text).toContain('AI Face Swap');
      expect(res.text).toContain('আপনার সিনেম্যাটিক ভিশন থাকবে ১০০% অপরিবর্তিত');
      expect(res.text).toContain('REAL OPTICS FIRST');
      expect(res.text).toContain('IDENTITY SWAP ONLY');
      expect(res.text).toContain('ZERO RESHOOTS');
      expect(res.text).toContain('data-asset="visual-camera-mesh.svg"');
    });

    test('contains Slide 2: Rule 1 — The "Two-Eye" Rule (মাথা ঘোরানো)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 01 • HEAD ROTATION');
      expect(res.text).toContain('The "Two-Eye" Rule');
      expect(res.text).toContain('(দুটো চোখের নিয়ম)');
      expect(res.text).toContain('ক্যামেরায় যেন সবসময় দুটো চোখই ট্র্যাক করা যায়');
      expect(res.text).toContain('SAFE ZONE (±45°)');
      expect(res.text).toContain('DANGER ZONE (90°)');
      expect(res.text).toContain('THE PRACTICAL RULE');
      expect(res.text).toContain('data-asset="visual-two-eye-radar.svg"');
    });

    test('contains Slide 3: Rule 2 — The "Pause-Button" Test (শাটার স্পিড)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 02 • SHUTTER &amp; MOTION');
      expect(res.text).toContain('The "Pause-Button" Test');
      expect(res.text).toContain('(শাটার স্পিড)');
      expect(res.text).toContain('মোশন ব্লার কমালেই AI পাবে ক্রিস্প ডিটেইল');
      expect(res.text).toContain('CAMERA SETTING');
      expect(res.text).toContain('১/১০০s বা ১/১২৫s');
      expect(res.text).toContain('WHY IT MATTERS');
      expect(res.text).toContain('POST-VFX NATURALIZATION');
      expect(res.text).toContain('data-asset="visual-shutter-test.svg"');
    });

    test('contains Slide 4: Rule 3 — Keep the Face Clear (মুখে হাত নয়)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 03 • OCCLUSION BARRIER');
      expect(res.text).toContain('Keep the Face Clear');
      expect(res.text).toContain('(ফেস ক্যানভাস ক্লিয়ার রাখা)');
      expect(res.text).toContain('মুখের ওপর আঙুল বা প্রপস পাস করলে স্কিন গলে যায়');
      expect(res.text).toContain('NO FACE TOUCHING');
      expect(res.text).toContain('CLEAN PROPS');
      expect(res.text).toContain('HAIR STYLING');
      expect(res.text).toContain('data-asset="visual-face-occlusion.svg"');
    });

    test('contains Slide 5: Rule 4 — Soft Diffused Lighting (স্কিন টেক্সচার)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 04 • PHOTOMETRIC INTEGRITY');
      expect(res.text).toContain('Soft Diffused Lighting');
      expect(res.text).toContain('(গাড়ির ভেতরের আলো)');
      expect(res.text).toContain('মুখ অতিরিক্ত সাদা পুড়ে যাবে না, কুচকুচে অন্ধকারও হবে না');
      expect(res.text).toContain('NO BLOWN WHITES');
      expect(res.text).toContain('NIGHT CAR INTERIOR');
      expect(res.text).toContain('MATTE FINISH');
      expect(res.text).toContain('data-asset="visual-photometric-lighting.svg"');
    });

    test('contains Slide 6: Rule 5 — True Portrait Lenses (৩৫মিমি বা ৫০মিমি)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 05 • OPTICAL COMPRESSION');
      expect(res.text).toContain('True Portrait Lenses');
      expect(res.text).toContain('(৩৫মিমি বা ৫০মিমি)');
      expect(res.text).toContain('মুখের কাছে আল্ট্রা-ওয়াইড লেন্স নয়');
      expect(res.text).toContain('HERO GLASS');
      expect(res.text).toContain('AVOID ULTRA-WIDE');
      expect(res.text).toContain('NATURAL PROPORTIONS');
      expect(res.text).toContain('data-asset="visual-lens-distortion.svg"');
    });

    test('contains Slide 7: Rule 6 — The 60-Second Lighting Gift (রেফারেন্স স্টিল)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('RULE 06 • MACHINE LEARNING CALIBRATION');
      expect(res.text).toContain('The 60-Second Lighting Gift');
      expect(res.text).toContain('(রেফারেন্স স্টিল)');
      expect(res.text).toContain('প্রতিটা লাইটিং সেটআপের আগে ৫টা কুইক র\' ছবি');
      expect(res.text).toContain('QUICK 5 CLICKS');
      expect(res.text).toContain('COLOR MATCHING');
      expect(res.text).toContain('ZERO DELAY');
      expect(res.text).toContain('data-asset="visual-raw-calibration.svg"');
    });

    test('contains Slide 8: The Closing Commitment (৫০ লাখ টাকার কোয়ালিটি)', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('SUMMARY • EXECUTIVE HANDSHAKE');
      expect(res.text).toContain('Hollywood-Grade Output');
      expect(res.text).toContain('for Ryze');
      expect(res.text).toContain('ক্যামেরা টিম + AI টিম = আনবিটেবল আউটপুট');
      expect(res.text).toContain('1/100s SHUTTER SPEED');
      expect(res.text).toContain('45° ANGLE &amp; CLEAN FACE');
      expect(res.text).toContain('INTERNATIONAL GRADE');
      expect(res.text).toContain('৫০ লাখ টাকার কোয়ালিটি');
      expect(res.text).toContain('data-asset="visual-closing-handshake.svg"');
    });

    test('verifies deep link to Presenter Co-Pilot and 16:9 widescreen layout', async () => {
      const res = await request(app).get('/pitch/ryze-dop');
      expect(res.text).toContain('href="/pitch/ryze-dop/copilot"');
      expect(res.text).toContain('Presenter Co-Pilot');
      expect(res.text).toContain('max-w-7xl w-full mx-auto px-6 lg:px-12');
      expect(res.text).toContain('min-h-[440px] lg:min-h-[480px]');
    });
  });

  describe('Surface B: Private Presenter Co-Pilot HUD (/pitch/ryze-dop/copilot)', () => {
    test('serves the copilot HUD at /pitch/ryze-dop/copilot and .html alias', async () => {
      const res1 = await request(app).get('/pitch/ryze-dop/copilot');
      expect(res1.status).toBe(200);
      expect(res1.headers['content-type']).toMatch(/text\/html/);

      const res2 = await request(app).get('/pitch/ryze-dop/copilot.html');
      expect(res2.status).toBe(200);
      expect(res2.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders 15-minute pitch pacing timer and controls', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      expect(res.text).toContain('id="timer-display"');
      expect(res.text).toContain('15:00');
      expect(res.text).toContain('id="timer-btn"');
      expect(res.text).toContain('toggleTimer()');
      expect(res.text).toContain('resetTimer()');
    });

    test('contains spoken Bangla dialogues for all 8 slides', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      // Slide 1 dialogue
      expect(res.text).toContain('ভাই, আমরা আপনার ক্যামেরার লাইটিং বা সিনেম্যাটিক ফিল নষ্ট করতে আসিনি');
      // Slide 2 dialogue
      expect(res.text).toContain('প্রথম নিয়মটা হলো \'দুটো চোখের রুল\'');
      // Slide 3 dialogue
      expect(res.text).toContain('দ্বিতীয়টা শাটার স্পিড—\'পজ বাটন টেস্ট\'');
      // Slide 4 dialogue
      expect(res.text).toContain('তিন নম্বরটা হলো মুখের ওপর হাত বা জিনিস না আনা');
      // Slide 5 dialogue
      expect(res.text).toContain('চার নম্বর হলো লাইটিং');
      // Slide 6 dialogue
      expect(res.text).toContain('পাঁচ নম্বর হলো লেন্স');
      // Slide 7 dialogue
      expect(res.text).toContain('লাস্ট একটা ৬০ সেকেন্ডের হেল্প ভাই');
      // Slide 8 dialogue
      expect(res.text).toContain('৫০ লাখ টাকার ইন্টারন্যাশনাল অ্যাড');
    });

    test('renders 1-Tap DOP Objection Handling Drawer with the 3 technical objections', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      // Objection 1
      expect(res.text).toContain('১/১০০s শাটারে ভিডিও স্ট্রোব বা বেশি শার্প লাগবে না?');
      expect(res.text).toContain('না ভাই, আমরা আফটার ইফেক্টসে মোশন ভেক্টর পাস দিয়ে ন্যাচারাল ১৮০ ডিগ্রি ব্লার ফিরিয়ে দিব');
      // Objection 2
      expect(res.text).toContain('অভিনেতার যদি সানগ্লাস পরার দৃশ্য থাকে?');
      expect(res.text).toContain('সানগ্লাস পরার ঠিক আগের ফ্রেমে বা খোলার ঠিক পরের ফ্রেমে ফেস সোয়াপ করব');
      // Objection 3
      expect(res.text).toContain('রাতের সিনে যদি আমরা একদম ডার্ক ড্রামাটিক লুক চাই?');
      expect(res.text).toContain('ডার্ক ড্রামাটিক ব্যাকগ্রাউন্ড রাখেন ভাই, কিন্তু মুখের ওপর হালকা ৫% অ্যাম্বিয়েন্ট সফট ফিল দেন');
    });

    test('renders 5 Camera Rules Cheat Sheet tab', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      expect(res.text).toContain('tab-checklist');
      expect(res.text).toContain('The 5 Golden Rules Quick Reference');
      expect(res.text).toContain('Two-Eye Rule');
      expect(res.text).toContain('Shutter Speed');
      expect(res.text).toContain('Face Occlusion');
      expect(res.text).toContain('Soft Diffused Lighting');
      expect(res.text).toContain('Portrait Lenses');
    });

    test('renders Desktop Dual-Pane vs. Mobile View toggle with localStorage persistence', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      expect(res.text).toContain('id="view-mode-toggle-btn"');
      expect(res.text).toContain('toggleViewMode()');
      expect(res.text).toContain('ryze_copilot_view');
      expect(res.text).toContain('id="desktop-layout"');
      expect(res.text).toContain('id="mobile-layout"');
      expect(res.text).toContain('id="desktop-slide-list"');
    });

    test('renders deep link to TV presentation deck', async () => {
      const res = await request(app).get('/pitch/ryze-dop/copilot');
      expect(res.text).toContain('href="/pitch/ryze-dop"');
      expect(res.text).toContain('TV Deck');
    });
  });

  describe('Routing & Edge Configuration', () => {
    test('verifies vercel.json has dedicated handlers for /pitch/ryze-dop', () => {
      const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
      
      const copilotRoute = vercelConfig.routes.find(r => r.src === '/pitch/ryze-dop/copilot(.*)');
      expect(copilotRoute).toBeDefined();
      expect(copilotRoute.dest).toBe('/public/pitch/ryze-dop/copilot.html');

      const pitchRoute = vercelConfig.routes.find(r => r.src === '/pitch/ryze-dop(/.*)?');
      expect(pitchRoute).toBeDefined();
      expect(pitchRoute.dest).toBe('/public/pitch/ryze-dop/index.html');
    });
  });

});