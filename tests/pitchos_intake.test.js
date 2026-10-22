const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const INTAKES_FILE = path.join(__dirname, '../data/pitch_intakes.json');

describe('PitchOS Inbound Funnel & Intake API', () => {
  let originalFileContent = null;

  beforeAll(() => {
    if (fs.existsSync(INTAKES_FILE)) {
      originalFileContent = fs.readFileSync(INTAKES_FILE, 'utf-8');
    }
  });

  afterAll(() => {
    if (originalFileContent !== null) {
      fs.writeFileSync(INTAKES_FILE, originalFileContent, 'utf-8');
    } else if (fs.existsSync(INTAKES_FILE)) {
      // Clean up test file if it didn't exist prior to test
      try {
        fs.unlinkSync(INTAKES_FILE);
      } catch (_) {}
    }
  });

  describe('GET /pitch — Showcase & Inbound Portal', () => {
    test('renders PitchOS portal with dual-surface showcase, rate card and order modal', async () => {
      const res = await request(app).get('/pitch');
      expect(res.status).toBe(200);
      expect(res.text).toContain('PitchOS by GRO10X');
      expect(res.text).toContain('Turn Your Static PowerPoint into a');
      expect(res.text).toContain('Dual-Surface Presentation Architecture');
      expect(res.text).toContain('Surface A · Audience Display');
      expect(res.text).toContain('Surface B · Smartphone Co-Pilot');
      expect(res.text).toContain('3-Tier Commercial Rate Card');
      expect(res.text).toContain('Standard Deck Conversion');
      expect(res.text).toContain('Interactive Enterprise Deck');
      expect(res.text).toContain('Venture Boardroom Flagship');
      expect(res.text).toContain('id="orderModal"');
      expect(res.text).toContain('id="pitchIntakeForm"');
    });
  });

  describe('POST /api/pitch/intake — Lead Ingress Validation', () => {
    test('rejects request missing companyName', async () => {
      const res = await request(app)
        .post('/api/pitch/intake')
        .send({
          contactName: 'Plabon Ahmed',
          phone: '+8801798558479',
          tier: 'Enterprise (৳45,000 BDT)'
        });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('companyName');
    });

    test('rejects request missing contactName', async () => {
      const res = await request(app)
        .post('/api/pitch/intake')
        .send({
          companyName: 'Acme Robotics',
          phone: '+8801798558479',
          tier: 'Enterprise (৳45,000 BDT)'
        });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('contactName');
    });

    test('rejects request missing phone', async () => {
      const res = await request(app)
        .post('/api/pitch/intake')
        .send({
          companyName: 'Acme Robotics',
          contactName: 'Plabon Ahmed',
          tier: 'Enterprise (৳45,000 BDT)'
        });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('phone');
    });

    test('rejects request missing tier', async () => {
      const res = await request(app)
        .post('/api/pitch/intake')
        .send({
          companyName: 'Acme Robotics',
          contactName: 'Plabon Ahmed',
          phone: '+8801798558479'
        });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('tier');
    });

    test('successfully processes valid pitch intake and persists to ledger', async () => {
      const testLead = {
        companyName: 'Veritas Health AI',
        contactName: 'Dr. Rafid Hasan',
        phone: '01712345678',
        email: 'rafid@veritashealth.ai',
        tier: 'Enterprise (৳45,000 BDT)',
        presentationTarget: 'Investors & Angels (Seed / Series A)',
        deckUrl: 'https://drive.google.com/file/d/test-pitch-deck/view',
        presentationDate: 'Tomorrow 2 PM',
        notes: 'Need real-time patient LTV and clinic expansion calculator embed.'
      };

      const res = await request(app)
        .post('/api/pitch/intake')
        .send(testLead);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.trackingId).toMatch(/^PITCH-2026-[A-Z0-9]{4}$/);
      expect(res.body.tier).toBe('Enterprise (৳45,000 BDT)');
      expect(res.body.message).toContain('Chief of Staff will dispatch your conversion preview within 24 hours');
      expect(res.body.lead).toBeDefined();
      expect(res.body.lead.companyName).toBe('Veritas Health AI');
      expect(res.body.lead.status).toBe('NEW_LEAD');

      // Verify file persistence
      expect(fs.existsSync(INTAKES_FILE)).toBe(true);
      const data = JSON.parse(fs.readFileSync(INTAKES_FILE, 'utf-8'));
      const saved = data.find(i => i.trackingId === res.body.trackingId);
      expect(saved).toBeDefined();
      expect(saved.companyName).toBe('Veritas Health AI');
      expect(saved.contactName).toBe('Dr. Rafid Hasan');
      expect(saved.phone).toBe('+8801712345678');
      expect(saved.deckUrl).toBe('https://drive.google.com/file/d/test-pitch-deck/view');
      expect(saved.status).toBe('NEW_LEAD');
    });

    test('GET /api/pitch/intakes retrieves persisted intake leads', async () => {
      const res = await request(app).get('/api/pitch/intakes');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.intakes)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });
});
