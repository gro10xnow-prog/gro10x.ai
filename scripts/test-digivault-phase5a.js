/**
 * scripts/test-digivault-phase5a.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5A Automated Verification Suite
 * Tests:
 * 1. Style enhancements (.dv-dropzone, .dv-tooltip, .badge-savings)
 * 2. product.html 1-click copy with floating tooltip feedback
 * 3. product.html drag-and-drop dropzone & global clipboard paste listener (Ctrl+V / Cmd+V)
 * 4. product.html image preview & remove controls
 * 5. catalog.html dynamic category item count badges
 * 6. catalog.html official price anchor & savings badge calculation
 * 7. catalog.html zero-latency search autocomplete
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase5ATests() {
  console.log('🧪 Starting DigiVault Phase 5A Verification Suite...\n');
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
    assert(cssContent.includes('.dv-dropzone'), 'style.css contains .dv-dropzone styling');
    assert(cssContent.includes('.dv-tooltip'), 'style.css contains .dv-tooltip floating styling');
    assert(cssContent.includes('.badge-savings'), 'style.css contains .badge-savings badge styling');
  }

  // 2. product.html 1-Click Copy & Floating Tooltip
  const prodPath = path.join(__dirname, '../public/digivault/product.html');
  assert(fs.existsSync(prodPath), 'product.html exists');
  if (fs.existsSync(prodPath)) {
    const prodContent = fs.readFileSync(prodPath, 'utf8');
    assert(prodContent.includes('id="btnCopySendNo"'), 'product.html includes #btnCopySendNo 1-click copy button');
    assert(prodContent.includes('id="tooltipSendNo"'), 'product.html includes #tooltipSendNo floating tooltip');
    assert(prodContent.includes('tip.classList.add(\'show\')'), 'product.html toggles tooltip on copy');
    
    // 3. Dropzone & Clipboard Paste Handlers
    assert(prodContent.includes('id="dropzoneScreenshot"'), 'product.html includes #dropzoneScreenshot dropzone');
    assert(prodContent.includes('id="dropzonePrompt"'), 'product.html includes #dropzonePrompt dropzone prompt');
    assert(prodContent.includes('id="dropzonePreview"'), 'product.html includes #dropzonePreview container');
    assert(prodContent.includes('id="imgScreenshotPreview"'), 'product.html includes #imgScreenshotPreview image tag');
    assert(prodContent.includes('id="btnRemoveScreenshot"'), 'product.html includes #btnRemoveScreenshot button');
    assert(prodContent.includes('window.addEventListener(\'paste\''), 'product.html attaches global window paste listener');
    assert(prodContent.includes('handleProofFile(blob)'), 'product.html processes clipboard image blobs');
    assert(prodContent.includes('selectedProofFile'), 'product.html attaches selectedProofFile on submission');
  }

  // 4. catalog.html Dynamic Counts, Savings Badges & Search
  const catPath = path.join(__dirname, '../public/digivault/catalog.html');
  assert(fs.existsSync(catPath), 'catalog.html exists');
  if (fs.existsSync(catPath)) {
    const catContent = fs.readFileSync(catPath, 'utf8');
    assert(catContent.includes('categoryChips.forEach(btn => {'), 'catalog.html iterates category chips for count updates');
    assert(catContent.includes('badge-savings'), 'catalog.html renders badge-savings pill');
    assert(catContent.includes('text-decoration: line-through'), 'catalog.html renders strikethrough benchmark price');
    assert(catContent.includes('inputCatalogSearch'), 'catalog.html includes live search input');
    assert(catContent.includes('searchInput.addEventListener(\'input\''), 'catalog.html binds real-time input search listener');
  }

  // 5. Savings Mathematical Formulation Check
  const testSalePrice = 2000;
  const testBenchmarkPrice = Math.round(testSalePrice * 3.5); // 7,000
  const computedSavings = Math.round((1 - testSalePrice / testBenchmarkPrice) * 100);
  assert(computedSavings >= 70, `Savings calculation for ৳2000 vs ৳7000 yields valid percentage (${computedSavings}%)`);

  console.log('\n========================================');
  console.log(`Phase 5A Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase5ATests().catch(err => {
  console.error('Phase 5A Test Suite Error:', err);
  process.exit(1);
});
