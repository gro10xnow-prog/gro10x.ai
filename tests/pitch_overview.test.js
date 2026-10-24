const request = require('supertest');
const app = require('../server');

describe('GRO10X Overview & Portfolio Pitch Deck (Arif Sales Kit)', () => {

  describe('Surface A: Fullscreen TV Pitch Deck (/pitch/overview)', () => {
    test('serves the deck at /pitch/overview with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the deck with trailing slash at /pitch/overview/', async () => {
      const res = await request(app).get('/pitch/overview/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders responsive meta viewport and title', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('name="viewport"');
      expect(res.text).toContain('viewport-fit=cover');
      expect(res.text).toContain('GRO10X Overview & Portfolio');
    });

    test('renders all 10 canonical slides', async () => {
      const res = await request(app).get('/pitch/overview');
      for (let i = 1; i <= 10; i++) {
        expect(res.text).toContain(`id="slide-${i}"`);
      }
    });

    test('contains Slide 1 hook and zero-jargon value proposition', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('What if high-end creative and tech work took');
      expect(res.text).toContain('days instead of months?');
      expect(res.text).toContain('Ready in 3 to 5 Days');
      expect(res.text).toContain('1/10th the Agency Cost');
      expect(res.text).toContain('Live Working Prototypes');
    });

    test('contains Slide 2: 3 core capabilities pillars', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Broadcast AI Video & Commercials');
      expect(res.text).toContain('Custom Web Apps & Portals');
      expect(res.text).toContain('Smart Business Automations');
    });

    test('contains Slide 3: Traditional Agency vs GRO10X comparison', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Why Enterprise Leaders Are Switching From Slow Agencies');
      expect(res.text).toContain('Traditional Agency');
      expect(res.text).toContain('GRO10X Autonomous Studio');
      expect(res.text).toContain('3 to 5 Days Deployment');
    });

    test('contains Slide 4: Case Study 1 (Banglalink RYZE AI Video) with live prototype link', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Banglalink RYZE');
      expect(res.text).toContain('60-Second Broadcast Commercial in 48 Hours');
      expect(res.text).toContain('5 Photorealistic Youth Characters');
      expect(res.text).toContain('/prototypes/ryze-ai-star/');
    });

    test('contains Slide 5: Case Study 2 (Bahon EV Fleet Command) with live prototype link', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Bahon Fleet OS');
      expect(res.text).toContain('Real-Time Telematics & Revenue Protection');
      expect(res.text).toContain('৳48,500');
      expect(res.text).toContain('/prototypes/bahon/');
    });

    test('contains Slide 6: Case Study 3 (ToffeeCon 2026 VIP Event OS) with link', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('ToffeeCon 2026');
      expect(res.text).toContain('Sub-50ms Optical Turnstile');
      expect(res.text).toContain('VIP Fast-Pass');
      expect(res.text).toContain('300 DPI');
      expect(res.text).toContain('TOFFEECON_TECH_QUOTATION_550K.pdf');
    });

    test('contains Slide 7: Case Study 4 (Sahanabag City 3D Twin) with live prototype link', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Sahanabag City');
      expect(res.text).toContain('Interactive 3D Township & Plot Booking Twin');
      expect(res.text).toContain('/prototypes/sahanabag-city/');
    });

    test('contains Slide 8: How We Work 3 simple steps', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('From First Conversation to Live System in 3 Steps');
      expect(res.text).toContain('Discovery & Alignment');
      expect(res.text).toContain('Working Live Prototype');
      expect(res.text).toContain('Refine, Launch & Scale');
    });

    test('contains Slide 9: The Zero-Risk 48-Hour Prototype Offer', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('The 48-Hour Working Prototype');
      expect(res.text).toContain('Test Before You Invest');
      expect(res.text).toContain('Zero Upfront Retainer');
    });

    test('contains Slide 10: Dual WhatsApp contacts (Arif & Plabon) and 1-Click PDF export', async () => {
      const res = await request(app).get('/pitch/overview');
      expect(res.text).toContain('Arif Ahmed');
      expect(res.text).toContain('1680061704');
      expect(res.text).toContain('Plabon');
      expect(res.text).toContain('1708459008');
      expect(res.text).toContain('downloadPdfDeck()');
      expect(res.text).toContain('Download PDF Deck');
    });
  });

  describe('Surface B: Mobile Presenter Co-Pilot (/pitch/overview/copilot)', () => {
    test('serves the copilot HUD at /pitch/overview/copilot and .html alias', async () => {
      const res1 = await request(app).get('/pitch/overview/copilot');
      expect(res1.status).toBe(200);
      expect(res1.headers['content-type']).toMatch(/text\/html/);

      const res2 = await request(app).get('/pitch/overview/copilot.html');
      expect(res2.status).toBe(200);
      expect(res2.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders presenter pacing timer HUD and controls', async () => {
      const res = await request(app).get('/pitch/overview/copilot');
      expect(res.text).toContain('id="timer-display"');
      expect(res.text).toContain('id="timer-btn"');
      expect(res.text).toContain('toggleTimer()');
    });

    test('contains speaker notes for all 10 slides', async () => {
      const res = await request(app).get('/pitch/overview/copilot');
      expect(res.text).toContain('The Hook');
      expect(res.text).toContain('What We Do');
      expect(res.text).toContain('The Unfair Advantage');
      expect(res.text).toContain('Case Study 1');
      expect(res.text).toContain('Case Study 2');
      expect(res.text).toContain('Case Study 3');
      expect(res.text).toContain('Case Study 4');
      expect(res.text).toContain('How We Work');
      expect(res.text).toContain('The Zero-Risk Offer');
      expect(res.text).toContain("Let's Connect");
    });

    test('renders 1-tap objection handling drawer', async () => {
      const res = await request(app).get('/pitch/overview/copilot');
      expect(res.text).toContain('tab-objections');
      expect(res.text).toContain('How can you build in 48 hours');
      expect(res.text).toContain('Is this just a cheap template');
      expect(res.text).toContain('What happens after delivery');
      expect(res.text).toContain('Can you sign an NDA');
    });

    test('renders WhatsApp follow-up kit with pre-filled handoff copy', async () => {
      const res = await request(app).get('/pitch/overview/copilot');
      expect(res.text).toContain('tab-whatsapp');
      expect(res.text).toContain('https://gro10x-ai.vercel.app/pitch/overview');
      expect(res.text).toContain('48-Hour Working Prototype');
    });

    test('renders deep link to TV presentation deck', async () => {
      const res = await request(app).get('/pitch/overview/copilot');
      expect(res.text).toContain('/pitch/overview');
      expect(res.text).toContain('TV Deck');
    });
  });

});
