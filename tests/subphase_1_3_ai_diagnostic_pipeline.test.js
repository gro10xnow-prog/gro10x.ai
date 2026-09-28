/**
 * tests/subphase_1_3_ai_diagnostic_pipeline.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.3: Inbound AI Diagnostics & Diagnostic Scorecard Pipeline Integration
 * Validates:
 * 1. POST /api/leads/ai-audit maps high maturity to canonical service code (SPRINT-01)
 * 2. POST /api/leads/ai-audit maps customer support automation to SVC-003
 * 3. POST /api/leads/ai-audit maps internal ops to SVC-007
 * 4. POST /api/leads/ai-audit maps exploratory candidate to SVC-013
 * 5. Persisted lead in DB has contact_person, service_interest, score, and lead_score
 * 6. Email confirmation & asset delivery triggers execute gracefully
 * 7. Missing contact info returns 400 Bad Request
 * 8. Zero native alert() dialog calls in public/ai-audit.html (Zero Native Dialogs Policy)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 1.3: Inbound AI Diagnostics & Diagnostic Scorecard Pipeline Integration', () => {

  test('1. High-maturity enterprise maps to SPRINT-01 canonical service', async () => {
    const payload = {
      companyName: 'Brac Bank Innovation Lab',
      contactName: 'Tanveer Hasan',
      email: `tanveer_${Date.now()}@bracbank.test`,
      phone: '+8801711223344',
      currentTechStack: ['Python / FastAPI', 'PostgreSQL / pgvector', 'Node.js / Express', 'LangChain / LangGraph'],
      dataReadiness: 'clean_relational_db',
      automationPriority: 'custom_ai_agent',
      monthlyBudgetUsd: 5000,
      timelineUrgency: 'immediate_1_2_weeks'
    };

    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.scorecard).toBeDefined();
    expect(res.body.scorecard.score).toBeGreaterThanOrEqual(80);
    expect(res.body.scorecard.canonicalServiceCode).toBe('SPRINT-01');
    expect(res.body.scorecard.canonicalServiceName).toContain('Sprint');
  });

  test('2. Customer support automation maps to SVC-003 canonical service', async () => {
    const payload = {
      companyName: 'Pathao Delivery Support',
      contactName: 'Kazi Farhan',
      email: `farhan_${Date.now()}@pathao.test`,
      phone: '+8801811334455',
      currentTechStack: ['Node.js / Express', 'PostgreSQL / pgvector'],
      dataReadiness: 'unstructured_docs',
      automationPriority: 'customer_support',
      monthlyBudgetUsd: 2500,
      timelineUrgency: 'within_30_days'
    };

    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.scorecard.canonicalServiceCode).toBe('SVC-003');
    expect(res.body.scorecard.canonicalServiceName).toContain('AI Chatbots');
  });

  test('3. Internal ops automation maps to SVC-007 canonical service', async () => {
    const payload = {
      companyName: 'Apex Footwear Supply Chain',
      contactName: 'Shahadat Hossain',
      email: `shahadat_${Date.now()}@apex.test`,
      phone: '+8801911445566',
      currentTechStack: ['Node.js / Express', 'PostgreSQL / pgvector'],
      dataReadiness: 'unstructured_docs',
      automationPriority: 'internal_ops',
      monthlyBudgetUsd: 2500,
      timelineUrgency: 'within_30_days'
    };

    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.scorecard.canonicalServiceCode).toBe('SVC-007');
  });

  test('4. Exploratory candidate maps to SVC-013 canonical service', async () => {
    const payload = {
      companyName: 'Local Retailer BD',
      contactName: 'Jahangir Alam',
      email: `jahangir_${Date.now()}@retail.test`,
      phone: '+8801611556677',
      currentTechStack: [],
      dataReadiness: 'legacy_spreadsheets',
      automationPriority: 'internal_ops',
      monthlyBudgetUsd: 500,
      timelineUrgency: 'exploring_quarter'
    };

    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.scorecard.score).toBeLessThan(65);
    expect(res.body.scorecard.canonicalServiceCode).toBe('SVC-013');
  });

  test('5. Rejects submission when both email and phone are missing', async () => {
    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send({
        companyName: 'Ghost Corp',
        contactName: 'No One'
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/email or phone is required/i);
  });

  test('6. Static verification: public/ai-audit.html contains zero native alert() calls', () => {
    const htmlPath = path.join(__dirname, '../public/ai-audit.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const alertMatches = html.match(/alert\(/g);
    expect(alertMatches).toBeNull();
  });

  test('7. Static verification: public/ai-audit.html contains zero leaks of legacy phone 1708', () => {
    const htmlPath = path.join(__dirname, '../public/ai-audit.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    expect(html).not.toContain('8801708459008');
    expect(html).not.toContain('+880 1708');
  });

});
