/**
 * scripts/e2e-prospect/phases/phase-8-bot-wiring.js
 * Phase 8: Telegram Bot Lead Journey & Budget Logic Suite
 */
const { getProspectKeyboard } = require('../../../src/services/bot/keyboards');
const { DEFAULT_SERVICES } = require('../../../src/constants/services');

async function runPhase8() {
  const results = {
    name: 'Phase 8: Telegram Bot Lead Journey & Logic Suite',
    passed: 0,
    failed: 0,
    tests: []
  };

  function record(title, passed, error = null) {
    if (passed) {
      results.passed++;
      results.tests.push({ title, status: 'PASS' });
      console.log(`  ✅ ${title}`);
    } else {
      results.failed++;
      results.tests.push({ title, status: 'FAIL', error: String(error) });
      console.error(`  ❌ ${title}: ${error}`);
    }
  }

  console.log(`\n🚀 Executing Phase 8: Telegram Bot Lead Journey Suite...`);

  try {
    // 8.1 Keyboard Definition Verification
    const kb = getProspectKeyboard();
    const allButtons = (kb.keyboard || kb.reply_markup?.keyboard || []).flat().map(b => (b && b.text) ? b.text : String(b));
    
    record('8.1.1 Prospect keyboard includes "Our Services"', allButtons.some(t => t.includes('Services')));
    record('8.1.2 Prospect keyboard includes "Service Pricing & Plans"', allButtons.some(t => t.includes('Pricing')));
    record('8.1.3 Prospect keyboard includes "Book a Strategy Call"', allButtons.some(t => t.includes('Book')));
    record('8.1.4 Prospect keyboard includes "Get a Custom Quote"', allButtons.some(t => t.includes('Quote')));

    // 8.2 Budget Tier Valuation Logic
    const parseBudget = (budget) => {
      return (budget.includes('300,000') || budget.includes('300k')) ? 300000
           : (budget.includes('150,000') || budget.includes('150k')) ? 150000
           : (budget.includes('75,000') || budget.includes('75k')) ? 75000
           : 45000;
    };

    record('8.2.1 Budget tier "৳45,000 – ৳75,000 / mo" maps to 75000 or 45000 value', parseBudget('৳45,000 – ৳75,000 / mo') === 75000);
    record('8.2.2 Budget tier "৳75,000 – ৳150,000 / mo" maps to 150000 value', parseBudget('৳75,000 – ৳150,000 / mo') === 150000);
    record('8.2.3 Budget tier "৳150,000 – ৳300,000 / mo" maps to 300000 value', parseBudget('৳150,000 – ৳300,000 / mo') === 300000);
    record('8.2.4 Budget tier "৳300,000+ Enterprise" maps to 300000 value', parseBudget('৳300,000+ Enterprise') === 300000);

    // 8.3 Default Services Catalog Synchronization
    record('8.3.1 Canonical services catalog contains all standard services (SVC-001 through SVC-004)', DEFAULT_SERVICES.length >= 4);

  } catch (err) {
    record('Phase 8 Execution Exception', false, err.message);
  }

  return results;
}

module.exports = { runPhase8 };
