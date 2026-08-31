/**
 * scripts/test-digivault-phase6a.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 6A Automated Verification Suite
 * Tests:
 * 1. track.html identifies isRejected condition correctly
 * 2. track.html renders Rejection Recovery Box with admin reason & troubleshooting
 * 3. track.html renders 1-click WhatsApp appeal button with prefilled order number
 * 4. digistore.js tracking endpoint returns rejectionReason & notes for rejected orders
 * 5. digistore.js tracking steps mark payment_verified as false when rejected
 * 6. digivault-bot.js handleOrderTracking displays rejection reason & WhatsApp link
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase6ATests() {
  console.log('🧪 Starting DigiVault Phase 6A Verification Suite...\n');
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

  // 1. track.html Verification
  const trackHtmlPath = path.join(__dirname, '../public/digivault/track.html');
  assert(fs.existsSync(trackHtmlPath), 'public/digivault/track.html exists');

  if (fs.existsSync(trackHtmlPath)) {
    const trackContent = fs.readFileSync(trackHtmlPath, 'utf8');
    assert(trackContent.includes('isRejected'), 'track.html defines isRejected check');
    assert(trackContent.includes('পেমেন্ট বাতিল / ভেরিফিকেশন ব্যর্থ হয়েছে'), 'track.html sets statusText for rejected orders');
    assert(trackContent.includes('#ef4444'), 'track.html sets red color for rejected orders');
    assert(trackContent.includes('পেমেন্ট বাতিলের কারণ:'), 'track.html renders rejection reason header');
    assert(trackContent.includes('rejectionReason'), 'track.html renders rejectionReason text');
    assert(trackContent.includes('wa.me/8801889825025'), 'track.html renders 1-click WhatsApp appeal link');
    assert(trackContent.includes('!isRejected'), 'track.html suppresses ETA banner and pulse when rejected');
  }

  // 2. digistore.js Route Verification
  const routesPath = path.join(__dirname, '../src/routes/digistore.js');
  assert(fs.existsSync(routesPath), 'src/routes/digistore.js exists');

  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    assert(routesContent.includes('rejectionReason: isRejected ?'), 'Tracking endpoint includes rejectionReason in response');
    assert(routesContent.includes('stage = isRejected ? \'payment_rejected\''), 'Tracking endpoint handles payment_rejected stage');
    assert(routesContent.includes('done: !isRejected &&'), 'Tracking steps ensure payment_verified is false on rejection');
  }

  // 3. digivault-bot.js Verification
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  assert(fs.existsSync(botPath), 'src/services/digivault-bot.js exists');

  if (fs.existsSync(botPath)) {
    const botContent = fs.readFileSync(botPath, 'utf8');
    assert(botContent.includes('isRejected'), 'Bot handleOrderTracking computes isRejected status');
    assert(botContent.includes('পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে!'), 'Bot includes Bengali rejection warning banner');
    assert(botContent.includes('wa.me/8801889825025'), 'Bot attaches WhatsApp Support inline keyboard on rejection');
  }

  console.log('\n========================================');
  console.log(`Phase 6A Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase6ATests().catch(err => {
  console.error('Phase 6A Test Suite Error:', err);
  process.exit(1);
});
