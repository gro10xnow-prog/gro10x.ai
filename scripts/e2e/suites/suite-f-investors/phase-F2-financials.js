/**
 * scripts/e2e/suites/suite-f-investors/phase-F2-financials.js
 * Suite F - Phase F2: Financial Intelligence, Growth Engines & Unit Economics
 * 
 * Tests:
 * F2.1: 5 Multi-Engine Growth Distribution Cards Rendered
 * F2.2: Verify Revenue Share Percentages & Compounding Engine Targets
 * F2.3: 12-Month Launch Roadmap Timeline Cards (Q1-Q4)
 * F2.4: 12-Month Overhead Cost Map Breakdown ($35k Lean OpEx)
 * F2.5: Unit Economics & Arbitrage Moat Grid (CAC, Margins, Payback)
 * F2.6: Financial Summary Numbers & 65% Net Margin Circle Consistency
 */

const { wait, TestTracker } = require('../../utils');

async function runPhaseF2(page) {
  const tracker = new TestTracker('Suite F - Phase F2: Financial Intelligence & Unit Economics');
  console.log('\n--- 📊 Running Suite F - Phase F2: Financials & Unit Economics ---');

  await tracker.runStep('F2.1', '5 Multi-Engine Growth Distribution Cards Rendered', async () => {
    const engineCards = await page.$$eval('.pb-engine-card', cards => cards.map(c => ({
      title: c.querySelector('h3') ? c.querySelector('h3').textContent.trim() : '',
      share: c.querySelector('.pb-engine-share') ? c.querySelector('.pb-engine-share').textContent.trim() : ''
    })));

    tracker.assert(engineCards.length === 5, `Expected exactly 5 growth engine cards, found ${engineCards.length}`);

    const expectedTitles = [
      'Proprietary Micro-SaaS Software',
      'High-Intent Freelancing Engines',
      'Automated Digital Asset Sales',
      'Core Agency Retainers',
      'Programmatic AI Video Scale'
    ];

    for (const expected of expectedTitles) {
      const found = engineCards.some(c => c.title.includes(expected));
      tracker.assert(found, `Expected growth engine "${expected}" card not found`);
    }

    await tracker.screenshot(page, 'F2.1_engines_grid.png');
  });

  await tracker.runStep('F2.2', 'Verify Revenue Share Percentages & Compounding Engine Targets', async () => {
    const shares = await page.$$eval('.pb-engine-share', els => els.map(el => el.textContent.trim()));
    tracker.assert(shares.length === 5, `Expected 5 engine share metrics, found ${shares.length}`);

    // Check specific target distributions: 35%, 25%, 20%, 15%, 5%
    tracker.assert(shares.some(s => s.includes('35%') && s.includes('35,000')), 'Missing 35% ($35k) Micro-SaaS share');
    tracker.assert(shares.some(s => s.includes('25%') && s.includes('25,000')), 'Missing 25% ($25k) Freelancing share');
    tracker.assert(shares.some(s => s.includes('20%') && s.includes('20,000')), 'Missing 20% ($20k) Digital Assets share');
    tracker.assert(shares.some(s => s.includes('15%') && s.includes('15,000')), 'Missing 15% ($15k) Agency Retainers share');
    tracker.assert(shares.some(s => s.includes('5%') && s.includes('5,000')), 'Missing 5% ($5k) Video Scale share');
  });

  await tracker.runStep('F2.3', '12-Month Launch Roadmap Timeline Cards (Q1-Q4)', async () => {
    const steps = await page.$$eval('.pb-roadmap-step', cards => cards.map(c => ({
      badge: c.querySelector('.step-badge') ? c.querySelector('.step-badge').textContent.trim() : '',
      title: c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : ''
    })));

    tracker.assert(steps.length === 4, `Expected 4 quarterly roadmap steps, found ${steps.length}`);
    tracker.assert(steps[0].badge === 'Q1' && steps[0].title.includes('Build'), 'Q1 Build & Launch missing');
    tracker.assert(steps[1].badge === 'Q2' && steps[1].title.includes('Validate'), 'Q2 Validate & Optimize missing');
    tracker.assert(steps[2].badge === 'Q3' && steps[2].title.includes('Deploy'), 'Q3 Deploy Micro-SaaS missing');
    tracker.assert(steps[3].badge === 'Q4' && steps[3].title.includes('Compound'), 'Q4 Compound & Scale missing');

    await tracker.screenshot(page, 'F2.3_roadmap_timeline.png');
  });

  await tracker.runStep('F2.4', '12-Month Overhead Cost Map Breakdown ($35k Lean OpEx)', async () => {
    const costRows = await page.$$eval('.pb-cost-row', rows => rows.map(r => ({
      item: r.querySelector('span') ? r.querySelector('span').textContent.trim() : '',
      cost: r.querySelector('strong') ? r.querySelector('strong').textContent.trim() : ''
    })));

    tracker.assert(costRows.length === 4, `Expected 4 overhead cost categories, found ${costRows.length}`);
    tracker.assert(costRows.some(r => r.item.includes('AI APIs') && r.cost.includes('12,000')), 'Missing AI APIs $12,000');
    tracker.assert(costRows.some(r => r.item.includes('Cloud Compute') && r.cost.includes('8,000')), 'Missing Cloud Compute $8,000');
    tracker.assert(costRows.some(r => r.item.includes('Platform Tools') && r.cost.includes('6,000')), 'Missing Platform Tools $6,000');
    tracker.assert(costRows.some(r => r.item.includes('Freelance') && r.cost.includes('9,000')), 'Missing Freelance Talent $9,000');
  });

  await tracker.runStep('F2.5', 'Unit Economics & Arbitrage Moat Grid (CAC, Margins, Payback)', async () => {
    const econCards = await page.$$eval('.econ-card', cards => cards.map(c => ({
      title: c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : '',
      val: c.querySelector('.econ-val') ? c.querySelector('.econ-val').textContent.trim() : ''
    })));

    tracker.assert(econCards.length >= 4, `Expected at least 4 unit economics cards, found ${econCards.length}`);
    tracker.assert(econCards.some(c => c.title.includes('CAC') && c.val.includes('$0')), 'CAC ~$0 metric missing');
    tracker.assert(econCards.some(c => c.title.includes('Gross Margin') && c.val.includes('85%')), 'Gross Margin 85%+ missing');
    tracker.assert(econCards.some(c => c.title.includes('Payback') && c.val.includes('7 Days')), 'Payback Period < 7 Days missing');
    tracker.assert(econCards.some(c => c.title.includes('Year 2') && c.val.includes('500,000')), 'Year 2 $500,000 target missing');

    await tracker.screenshot(page, 'F2.5_unit_economics.png');
  });

  await tracker.runStep('F2.6', 'Financial Summary Numbers & 65% Net Margin Circle Consistency', async () => {
    const marginPercent = await page.$eval('.pb-margin-circle .margin-percent', el => el.textContent.trim());
    tracker.assertEqual(marginPercent, '65%', 'Margin circle must display 65%');

    const finNumbers = await page.$$eval('.pb-fin-numbers > div', divs => divs.map(d => ({
      label: d.querySelector('.num-label') ? d.querySelector('.num-label').textContent.trim() : '',
      val: d.querySelector('.num-val') ? d.querySelector('.num-val').textContent.trim() : ''
    })));

    tracker.assert(finNumbers.some(f => f.label.includes('Gross Revenue') && f.val.includes('100,000')), 'Gross Revenue Target must be $100,000');
    tracker.assert(finNumbers.some(f => f.label.includes('Expense Cap') && f.val.includes('35,000')), '12-Month Expense Cap must be $35,000');
    tracker.assert(finNumbers.some(f => f.label.includes('Net Profit') && f.val.includes('65,000')), 'Projected Net Profit must be $65,000');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF2 };
