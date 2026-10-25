/**
 * tests/harvester_ingress.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification test for WhatsApp LeadHarvester AI enrichment & CRM sync ingress.
 */

const request = require('supertest');
const express = require('express');
const leadRoutes = require('../src/routes/leads');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/leads', leadRoutes);
app.use(errorHandler);

describe('WhatsApp LeadHarvester & AI Profiler API Ingress', () => {

  test('POST /api/leads/ai-enrich classifies members, assigns tiers and generates icebreakers', async () => {
    const payload = {
      group_name: 'Dhaka Tech Founders & C-Suite',
      group_description: 'Official community for Bangladeshi startup founders and enterprise CTOs.',
      target_offer: 'Engine 2: Bespoke Agency Tech & Turnkey MVPs',
      members: [
        {
          name: 'Tanvir Hossain',
          phone: '+8801711223344',
          about: 'Founder & CEO at NextFin | Building digital banking rails',
          isAdmin: true
        },
        {
          name: 'Shakil Ahmed',
          phone: '+8801819556677',
          about: 'VP of Engineering | Scaling distributed microservices',
          isAdmin: false
        },
        {
          name: 'Nusrat Jahan',
          phone: '+8801912334455',
          about: 'Growth Marketer & Brand Lead',
          isAdmin: false
        }
      ]
    };

    const res = await request(app)
      .post('/api/leads/ai-enrich')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(3);
    expect(res.body.group_name).toBe('Dhaka Tech Founders & C-Suite');

    const [adminFounder, vp, marketer] = res.body.members;

    // Verify Founder & Admin
    expect(adminFounder.seniority).toContain('C-Level');
    expect(adminFounder.lead_tier).toBe('Tier 1 (High Ticket Enterprise)');
    expect(adminFounder.is_admin).toBe(true);
    expect(adminFounder.icebreaker_en).toContain('Tanvir');
    expect(adminFounder.icebreaker_bn).toContain('সালাম');

    // Verify VP
    expect(vp.seniority).toBe('Director / VP');
    expect(vp.lead_tier).toBe('Tier 2 (Growth Retainer)');

    // Verify Marketer with Lead title
    expect(marketer.seniority).toBe('Manager / Team Lead');
    expect(marketer.match_offer).toContain('Engine');
  });

  test('POST /api/leads/ai-enrich rejects empty member arrays', async () => {
    const res = await request(app)
      .post('/api/leads/ai-enrich')
      .send({ group_name: 'Test', members: [] });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('POST /api/leads/harvester-sync inserts leads into CRM and returns synced count', async () => {
    const payload = {
      group_name: 'Dhaka Real Estate & High Net Worth Investors',
      target_offer: 'Engine 2: Bespoke Agency Tech',
      leads: [
        {
          name: 'Farhan Rahman',
          phone: '+8801711998877',
          about: 'Managing Director at Apex Properties',
          seniority: 'C-Level / Founder',
          lead_tier: 'Tier 1 (High Ticket Enterprise)',
          match_offer: 'Engine 2: Bespoke Agency Tech',
          icebreaker_en: 'Hi Farhan, noticed you in Dhaka Real Estate...',
          icebreaker_bn: 'সালাম ফারহান ভাই...',
          is_admin: true,
          score: 95
        }
      ]
    };

    const res = await request(app)
      .post('/api/leads/harvester-sync')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.synced_leads[0].company).toBe('Dhaka Real Estate & High Net Worth Investors');
    expect(res.body.synced_leads[0].contact_person).toBe('Farhan Rahman');
    expect(res.body.synced_leads[0].source).toBe('WhatsApp LeadHarvester');
  });

});
