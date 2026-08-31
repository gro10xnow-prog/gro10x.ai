/**
 * scripts/test-digivault-phase5b.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5B Automated Verification Suite
 * Tests:
 * 1. Style keyframes & animations (@keyframes stepPulse, .step-active-pulse, .eta-banner)
 * 2. track.html active step pulsation & live ETA delivery SLA banner
 * 3. digistore.js openLightboxModal full-screen viewer with rotate, zoom & esc controls
 * 4. digistore.js proof-lightbox-trigger binding in orders table
 * 5. digistore.js openDeliveryModal guideline preset templates (Gemini, Netflix, Canva, Office, VPN)
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase5BTests() {
  console.log('🧪 Starting DigiVault Phase 5B Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Style Enhancements Check
  const cssPath = path.join(__dirname, '../public/digivault/style.css');
  assert(fs.existsSync(cssPath), 'style.css exists');
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert(cssContent.includes('@keyframes stepPulse'), 'style.css defines @keyframes stepPulse');
    assert(cssContent.includes('.step-active-pulse'), 'style.css defines .step-active-pulse');
    assert(cssContent.includes('.eta-banner'), 'style.css defines .eta-banner container');
    assert(cssContent.includes('.eta-progress-track'), 'style.css defines .eta-progress-track');
    assert(cssContent.includes('.eta-progress-fill'), 'style.css defines .eta-progress-fill');
  }

  // 2. track.html Live Stepper & ETA Banner Check
  const trackPath = path.join(__dirname, '../public/digivault/track.html');
  assert(fs.existsSync(trackPath), 'track.html exists');
  if (fs.existsSync(trackPath)) {
    const trackContent = fs.readFileSync(trackPath, 'utf8');
    assert(trackContent.includes('activeStepIndex'), 'track.html computes activeStepIndex');
    assert(trackContent.includes('step-active-pulse'), 'track.html applies step-active-pulse on active step');
    assert(trackContent.includes('eta-banner'), 'track.html renders eta-banner for orders in progress');
    assert(trackContent.includes('১৫-২০ মিনিট'), 'track.html displays 15-20 min ETA badge');
  }

  // 3. digistore.js Lightbox Modal & Delivery Presets Check
  const adminJsPath = path.join(__dirname, '../public/app/modules/digistore.js');
  assert(fs.existsSync(adminJsPath), 'digistore.js exists');
  if (fs.existsSync(adminJsPath)) {
    const adminContent = fs.readFileSync(adminJsPath, 'utf8');
    assert(adminContent.includes('openLightboxModal(imgSrc, title'), 'digistore.js implements openLightboxModal');
    assert(adminContent.includes('btnLightboxRotate'), 'Lightbox includes Rotate button');
    assert(adminContent.includes('btnLightboxZoomIn'), 'Lightbox includes Zoom In button');
    assert(adminContent.includes('btnLightboxZoomOut'), 'Lightbox includes Zoom Out button');
    assert(adminContent.includes('lightboxBackdrop'), 'Lightbox includes backdrop click dismiss');
    assert(adminContent.includes('proof-lightbox-trigger'), 'digistore.js uses proof-lightbox-trigger class');
    assert(adminContent.includes('selectGuidelinePreset'), 'Delivery modal includes #selectGuidelinePreset dropdown');
    assert(adminContent.includes('PRESETS'), 'Delivery modal defines guideline PRESETS dictionary');
    assert(adminContent.includes('gemini:') && adminContent.includes('netflix:'), 'PRESETS contains Gemini and Netflix templates');
    assert(adminContent.includes('canva:') && adminContent.includes('office:') && adminContent.includes('vpn:'), 'PRESETS contains Canva, Office, and VPN templates');
  }

  console.log('\n========================================');
  console.log(`Phase 5B Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase5BTests().catch(err => {
  console.error('Phase 5B Test Suite Error:', err);
  process.exit(1);
});
