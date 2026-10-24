const request = require('supertest');
const app = require('../server');

describe('Biniyog.io × Foodpanda Partnership Pitch Deck & Co-Pilot', () => {

  describe('Surface A: Boardroom TV Deck (/pitch/biniyog-foodpanda)', () => {
    test('serves the TV deck at /pitch/biniyog-foodpanda with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the TV deck with trailing slash at /pitch/biniyog-foodpanda/', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders responsive meta viewport and title', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('name="viewport"');
      expect(res.text).toContain('viewport-fit=cover');
      expect(res.text).toContain('Biniyog.io × Foodpanda');
    });

    test('renders all 10 canonical slides (#slide-1 to #slide-10)', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      for (let i = 1; i <= 10; i++) {
        expect(res.text).toContain(`id="slide-${i}"`);
      }
    });

    test('contains Slide 1 hook and Delivery Hero embedded finance precedent', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain("Replicating Delivery Hero's Proven Embedded Finance Model in");
      expect(res.text).toContain('Delivery Hero Precedent');
      expect(res.text).toContain('Zero Balance-Sheet Risk');
      expect(res.text).toContain('100% Halal Murabaha');
    });

    test('contains Slide 2: Regional validation (Foodpanda Pakistan & ABHI precedent)', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Foodpanda & ABHI Scaled Merchant Financing');
      expect(res.text).toContain('Foodpanda Pakistan × ABHI');
      expect(res.text).toContain('-15% Drop');
      expect(res.text).toContain('+12% Growth');
    });

    test('contains Slide 3: Dhaka local capital bottleneck', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Why 85% of Foodpanda Restaurants Starve for Working Capital');
      expect(res.text).toContain('Bank Rejection Rate');
      expect(res.text).toContain('Riba / Interest Aversion');
    });

    test('contains Slide 4: 4-step escrow waterfall flow', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Inventory Financed Today. Repaid Automatically from Weekly Payouts.');
      expect(res.text).toContain('Biniyog Buys Materials');
      expect(res.text).toContain('Goods to Restaurant');
      expect(res.text).toContain('Foodpanda Orders');
      expect(res.text).toContain('Weekly Deductions');
    });

    test('validates dynamic deal economics math (৳300k, ৳30k, ৳27.5k)', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Clear, Predictable, Shariah-Compliant Returns');
      // Advance: ৳300,000
      expect(res.text).toContain('300,000');
      // Markup: ৳30,000 (10%)
      expect(res.text).toContain('30,000');
      // Escrow Weekly Deduction: ৳27,500
      expect(res.text).toContain('27,500');
      // Default rate benchmark: < 1% (or &lt; 1% HTML entity)
      expect(res.text).toMatch(/Dropped from 5% to (&lt;|<)\s*1%/);
    });

    test('contains Slide 6: Foodpanda P&L impact (churn reduction & incremental commission)', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('15% Churn Reduction');
      expect(res.text).toContain('৳4M–৳6M Monthly Commission');
    });

    test('contains Slide 7: Battlecard against conventional banks', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Why Biniyog.io Outperforms Traditional Commercial Lenders');
      expect(res.text).toContain('Conventional Banks');
      expect(res.text).toContain('Biniyog.io Embedded Murabaha');
      expect(res.text).toContain('Zero physical collateral');
    });

    test('contains Slide 8: Tri-Party agreement & escrow waterfall security', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Tri-Party Agreement with Automated Waterfall Security');
      expect(res.text).toContain('Automated Settlement Deduction');
      expect(res.text).toContain('Revenue-Dip Safety Net');
    });

    test('contains Slide 9: 90-day Dhaka pilot roadmap', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Phased Rollout: 50 High-Volume Restaurants in 3 Hubs');
      expect(res.text).toContain('Gulshan, Banani & Dhanmondi');
    });

    test('contains Slide 10: Shabab Bhai contact phone (+8801673113566) and PDF export', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('Shabab Bhai');
      expect(res.text).toContain('1673-113566');
      expect(res.text).toContain('8801673113566');
      expect(res.text).toContain('downloadPdfDeck()');
    });
  });

  describe('Surface B: Mobile Presenter Co-Pilot (/pitch/biniyog-foodpanda/copilot)', () => {
    test('serves the copilot HUD at /pitch/biniyog-foodpanda/copilot and .html alias', async () => {
      const res1 = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res1.status).toBe(200);
      expect(res1.headers['content-type']).toMatch(/text\/html/);

      const res2 = await request(app).get('/pitch/biniyog-foodpanda/copilot.html');
      expect(res2.status).toBe(200);
      expect(res2.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders 15-minute presenter pacing timer HUD and controls', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res.text).toContain('id="timer-display"');
      expect(res.text).toContain('15:00');
      expect(res.text).toContain('id="timer-btn"');
      expect(res.text).toContain('toggleTimer()');
    });

    test('contains speaker notes for all 10 slides', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res.text).toContain('The Hook');
      expect(res.text).toContain('Regional Validation');
      expect(res.text).toContain('The Dhaka Bottleneck');
      expect(res.text).toContain('The Solution');
      expect(res.text).toContain('Deal Economics');
      expect(res.text).toContain('Why Foodpanda Wins');
      expect(res.text).toContain('The Battlecard');
      expect(res.text).toContain('Escrow Safeguards');
      expect(res.text).toContain('90-Day Roadmap');
      expect(res.text).toContain('The Close');
    });

    test('renders 1-tap objection handling drawer with core defenses', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res.text).toContain('tab-objections');
      expect(res.text).toContain('What if a restaurant\'s sales drop drastically');
      expect(res.text).toContain('Why shouldn\'t Foodpanda just partner with City Bank or BRAC Bank');
      expect(res.text).toContain('Does Foodpanda carry any balance-sheet debt or credit risk');
      expect(res.text).toContain('How much engineering effort is required from Foodpanda\'s tech team');
    });

    test('renders WhatsApp follow-up kit with pre-filled message and Shabab Bhai contact', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res.text).toContain('tab-whatsapp');
      expect(res.text).toContain('https://gro10x-ai.vercel.app/pitch/biniyog-foodpanda');
      expect(res.text).toContain('1673-113566');
    });

    test('renders deep link to TV presentation deck', async () => {
      const res = await request(app).get('/pitch/biniyog-foodpanda/copilot');
      expect(res.text).toContain('/pitch/biniyog-foodpanda');
      expect(res.text).toContain('TV Deck');
    });
  });

});
