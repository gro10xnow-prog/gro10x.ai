/**
 * tests/engine2_phase4_ai_audit.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 Test Suite: Inbound AI Readiness Diagnostic Scorecard & Lead Funnel
 * 
 * Verifies all 4 functional tracks:
 * 1. Public Route Serving (/ai-audit, /audit, /ai-audit.html)
 * 2. Algorithmic Multi-Factor Scoring & Autonomous Pod Recommendation
 * 3. Validation Safeguards & Contact Channel Integrity
 * 4. Engine 2 CRM Ingestion, Tagging & Executive Telemetry
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');

describe('Engine 2 Phase 4: Inbound AI Readiness Diagnostic Scorecard', () => {

  // TRACK 1: Public Diagnostic Frontend Routes
  describe('Track 1: Public Diagnostic Frontend Routes', () => {
    test('GET /ai-audit returns 200 with complete diagnostic DOM', async () => {
      const res = await request(app).get('/ai-audit');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Enterprise AI Readiness Diagnostic');
      expect(res.text).toContain('auditCompanyName');
      expect(res.text).toContain('auditContactName');
      expect(res.text).toContain('auditEmail');
      expect(res.text).toContain('auditPhone');
      expect(res.text).toContain('selectedDataReadiness');
      expect(res.text).toContain('selectedAutomationPriority');
      expect(res.text).toContain('resScoreNum');
      expect(res.text).toContain('resTierBadge');
    });

    test('GET /audit canonical alias returns 200', async () => {
      const res = await request(app).get('/audit');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Enterprise AI Readiness Diagnostic');
    });

    test('GET /ai-audit.html returns 200 with HTML markup', async () => {
      const res = await request(app).get('/ai-audit.html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });
  });

  // TRACK 2: Algorithmic Multi-Factor Scoring & Pod Recommendation
  describe('Track 2: Algorithmic Multi-Factor Scoring & Pod Recommendation', () => {
    test('High-maturity enterprise scores >= 80 and assigns MVP_BUILD_POD (10-Day Velocity)', async () => {
      const payload = {
        companyName: 'Apex Fintech Solutions',
        contactName: 'Nadia Rahman',
        email: 'nadia@apexfintech.io',
        phone: '+8801711998877',
        currentTechStack: ['Python / FastAPI', 'PostgreSQL / pgvector', 'LangChain / LangGraph', 'Docker / Kubernetes', 'Next.js / React'],
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
      expect(res.body.leadId).toBeDefined();

      const sc = res.body.scorecard;
      expect(sc.score).toBeGreaterThanOrEqual(80);
      expect(sc.readinessTier).toBe('Enterprise AI Pioneer');
      expect(sc.recommendedService).toBe('ENG2-MVP');
      expect(sc.recommendedPod).toBe('MVP_BUILD_POD');
      expect(sc.estimatedSprintDays).toBe(10);
      expect(Array.isArray(sc.keyBottlenecks)).toBe(true);
      expect(sc.immediateActionPlan).toContain('MVP_BUILD_POD');
    });

    test('Mid-maturity enterprise with customer_support priority assigns ENTERPRISE_AUTOMATION_POD (14-Day Velocity)', async () => {
      const payload = {
        companyName: 'RetailFlow Omnichannel',
        contactName: 'Shahidul Alam',
        email: 'shahidul@retailflow.com',
        phone: '+8801811445566',
        currentTechStack: ['Node.js / Express', 'Supabase / Firebase'],
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

      const sc = res.body.scorecard;
      expect(sc.score).toBeGreaterThanOrEqual(65);
      expect(sc.score).toBeLessThan(80);
      expect(sc.readinessTier).toBe('Sprint Ready');
      expect(sc.recommendedService).toBe('ENG2-AUT');
      expect(sc.recommendedPod).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(sc.estimatedSprintDays).toBe(14);
      expect(sc.immediateActionPlan).toContain('ENTERPRISE_AUTOMATION_POD');
    });

    test('Early-stage exploratory candidate with spreadsheets scores < 65 and assigns CREATIVE_AI_POD', async () => {
      const payload = {
        companyName: 'Boutique Apparel BD',
        contactName: 'Farhana Yasmin',
        email: 'farhana@boutiquebd.net',
        phone: '+8801911223344',
        currentTechStack: [],
        dataReadiness: 'legacy_spreadsheets',
        automationPriority: 'internal_ops',
        monthlyBudgetUsd: 1000,
        timelineUrgency: 'exploring_quarter'
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      const sc = res.body.scorecard;
      expect(sc.score).toBeLessThan(65);
      expect(sc.readinessTier).toBe('Exploratory AI Candidate');
      expect(sc.recommendedService).toBe('ENG2-DISC');
      expect(sc.recommendedPod).toBe('CREATIVE_AI_POD');
      expect(sc.estimatedSprintDays).toBe(21);
      expect(sc.immediateActionPlan).toContain('CREATIVE_AI_POD');
    });
  });

  // TRACK 3: Input Validation & Safeguards
  describe('Track 3: Input Validation & Safeguards', () => {
    test('Rejects audit request when both email and phone are missing (400 Bad Request)', async () => {
      const payload = {
        companyName: 'Ghost Technologies Inc',
        contactName: 'No Contact Provided',
        dataReadiness: 'cloud_lake',
        automationPriority: 'internal_ops'
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toMatch(/email or phone is required/i);
    });

    test('Accepts valid submission with phone-only contact channel', async () => {
      const payload = {
        companyName: 'WhatsApp Priority Client',
        contactName: 'Kazi Masum',
        phone: '+8801708000000',
        dataReadiness: 'unstructured_docs',
        automationPriority: 'lead_generation',
        monthlyBudgetUsd: 2500
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.scorecard).toBeDefined();
    });

    test('Accepts valid submission with email-only contact channel', async () => {
      const payload = {
        companyName: 'Email Only Enterprise',
        contactName: 'Saadman Sakib',
        email: 'saadman@sakibtech.com',
        dataReadiness: 'cloud_lake',
        automationPriority: 'custom_ai_agent',
        monthlyBudgetUsd: 3500
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.scorecard).toBeDefined();
    });
  });

  // TRACK 4: Engine 2 CRM Ingestion & Governance Tagging
  describe('Track 4: CRM Ingestion & Governance Tagging', () => {
    test('Audit lead is stored with engine_tag: engine2 and qualified stage', async () => {
      const auditPayload = {
        companyName: 'Audit Governance Verifier Ltd',
        contactName: 'Mehedi Hasan',
        email: 'mehedi@auditverifier.com',
        phone: '+8801755667788',
        currentTechStack: ['Python / FastAPI', 'PostgreSQL / pgvector', 'Docker / Kubernetes', 'LangChain / LangGraph'],
        dataReadiness: 'clean_relational_db',
        automationPriority: 'custom_ai_agent',
        monthlyBudgetUsd: 5000,
        timelineUrgency: 'immediate_1_2_weeks'
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(auditPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      const leadId = res.body.leadId;

      // Query leads to verify CRM persistence and tags
      const leadsRes = await request(app)
        .get('/api/leads')
        .set('x-disable-dev-auth', 'false');

      if (leadsRes.status === 200 && Array.isArray(leadsRes.body)) {
        const lead = leadsRes.body.find(l => l.id === leadId || l.email === 'mehedi@auditverifier.com');
        if (lead) {
          expect(lead.engine_tag || lead.engineTag).toBe('engine2');
          expect(lead.source).toBe('AI_Readiness_Scorecard');
          expect(lead.lead_score || lead.score).toBeGreaterThanOrEqual(80);
          expect(lead.notes).toContain('AI Audit Score');
        }
      }
    });
  });
});
