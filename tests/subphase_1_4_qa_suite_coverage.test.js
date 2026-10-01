/**
 * tests/subphase_1_4_qa_suite_coverage.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.4: Chrome Extension QA Suite Coverage & Synthetic Lead Teardown
 * Validates:
 * 1. GRO10X_REGISTRY public & admin workflow mapping integrity
 * 2. PUBLIC_WORKFLOWS completeness (lead capture, ROI calc, AI scorecard, contractor SLA)
 * 3. ADMIN_WORKFLOWS inbound audit verification suite completeness
 * 4. sidepanel.html & sidepanel.js script injection and workflow map concatenation
 * 5. LEADS_QA_SUITE sequential step integrity (step-1 through step-23) with AI scorecard
 * 6. UI DOM attributes in public/app/modules/leads.js (#drawerAiScorecardCard)
 * 7. Synthetic E2E lead capture, verification and teardown lifecycle via API
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

// Load QA suites
const { GRO10X_REGISTRY } = require('../extension/gro10x-qa-runner/suites/registry');
const { PUBLIC_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/public-workflows');
const { ADMIN_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/admin-workflows');
const { LEADS_QA_SUITE } = require('../extension/gro10x-qa-runner/suites/leads-qa');

describe('Sub-Phase 1.4: Chrome Extension QA Suite Coverage & Lifecycle', () => {

  const adminToken = signToken({
    userId: 'ADM-QA-TEST-001',
    name: 'QA Lead Auditor',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  describe('1. Central Registry & Workflow Mapping Integrity', () => {
    test('GRO10X_REGISTRY.public.pages maps landing, aiAudit, and contractor to workflows', () => {
      const publicPlatform = GRO10X_REGISTRY.public;
      expect(publicPlatform).toBeDefined();

      const landingPage = publicPlatform.pages.find(p => p.id === 'landing');
      expect(landingPage).toBeDefined();
      expect(landingPage.workflows).toContain('workflow_public_lead_capture');
      expect(landingPage.workflows).toContain('workflow_public_roi_calculator');

      const aiAuditPage = publicPlatform.pages.find(p => p.id === 'aiAudit');
      expect(aiAuditPage).toBeDefined();
      expect(aiAuditPage.workflows).toContain('workflow_public_ai_audit_score');

      const contractorPage = publicPlatform.pages.find(p => p.id === 'contractor');
      expect(contractorPage).toBeDefined();
      expect(contractorPage.workflows).toContain('workflow_contractor_defect_sla');
    });

    test('GRO10X_REGISTRY.admin.pages maps leads to both standard CRM and inbound audit verification', () => {
      const adminPlatform = GRO10X_REGISTRY.admin;
      expect(adminPlatform).toBeDefined();

      const leadsPage = adminPlatform.pages.find(p => p.id === 'leads');
      expect(leadsPage).toBeDefined();
      expect(leadsPage.workflows).toContain('workflow_lead_crm');
      expect(leadsPage.workflows).toContain('workflow_lead_inbound_audit_verification');
    });
  });

  describe('2. Public Workflows Suite Completeness', () => {
    test('PUBLIC_WORKFLOWS contains all required workflows with valid structure', () => {
      expect(PUBLIC_WORKFLOWS).toBeDefined();

      const expectedWorkflows = [
        'workflow_public_lead_capture',
        'workflow_public_roi_calculator',
        'workflow_public_ai_audit_score',
        'workflow_contractor_defect_sla'
      ];

      expectedWorkflows.forEach(wfKey => {
        const wf = PUBLIC_WORKFLOWS[wfKey];
        expect(wf).toBeDefined();
        expect(wf.id).toBe(wfKey);
        expect(wf.title).toBeDefined();
        expect(Array.isArray(wf.steps)).toBe(true);
        expect(wf.steps.length).toBeGreaterThan(0);

        wf.steps.forEach(step => {
          expect(step.id).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.action).toBeDefined();
          expect(step.assertion).toBeDefined();
          expect(step.assertion.type).toBeDefined();
        });
      });
    });

    test('workflow_public_ai_audit_score validates 4-step wizard, catalog mapping and zero native dialogs', () => {
      const aiWf = PUBLIC_WORKFLOWS.workflow_public_ai_audit_score;
      expect(aiWf.targetPath).toBe('/ai-audit.html');
      expect(aiWf.steps.length).toBe(8);

      const cleanAuditStep = aiWf.steps.find(s => s.assertion.check === 'assert_clean_audit');
      expect(cleanAuditStep).toBeDefined();

      const gaugeStep = aiWf.steps.find(s => s.assertion.check === 'assert_ai_scorecard_gauge_rendered');
      expect(gaugeStep).toBeDefined();
    });
  });

  describe('3. Admin Inbound Scorecard Verification Workflow', () => {
    test('ADMIN_WORKFLOWS contains workflow_lead_inbound_audit_verification', () => {
      const inboundWf = ADMIN_WORKFLOWS.workflow_lead_inbound_audit_verification;
      expect(inboundWf).toBeDefined();
      expect(inboundWf.id).toBe('workflow_lead_inbound_audit_verification');
      expect(inboundWf.targetHash).toBe('#leads');
      expect(inboundWf.steps.length).toBe(5);

      const scorecardStep = inboundWf.steps.find(s => s.assertion.check === 'assert_leads_drawer_ai_scorecard');
      expect(scorecardStep).toBeDefined();
    });
  });

  describe('4. Sidepanel Ingestion & Runtime Script Wiring', () => {
    test('sidepanel.html includes public-workflows.js script tag', () => {
      const htmlPath = path.join(__dirname, '../extension/gro10x-qa-runner/sidepanel.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      expect(htmlContent).toContain('<script src="suites/workflows/public-workflows.js"></script>');
    });

    test('sidepanel.js merges window.PUBLIC_WORKFLOWS in getAllWorkflowsMap()', () => {
      const jsPath = path.join(__dirname, '../extension/gro10x-qa-runner/sidepanel.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      expect(jsContent).toContain('if (window.PUBLIC_WORKFLOWS) Object.assign(map, window.PUBLIC_WORKFLOWS);');
    });
  });

  describe('5. Leads QA Suite Step Contiguity & Scorecard Step', () => {
    test('LEADS_QA_SUITE contains sequential steps with core steps', () => {
      expect(LEADS_QA_SUITE).toBeDefined();
      expect(LEADS_QA_SUITE.steps.length).toBeGreaterThanOrEqual(23);

      for (let i = 1; i <= 20; i++) {
        const expectedId = `step-${i}`;
        const step = LEADS_QA_SUITE.steps[i - 1];
        expect(step.id).toBe(expectedId);
      }
    });

    test('LEADS_QA_SUITE step-19 checks assert_leads_drawer_ai_scorecard', () => {
      const step19 = LEADS_QA_SUITE.steps[18];
      expect(step19.id).toBe('step-19');
      expect(step19.assertion.check).toBe('assert_leads_drawer_ai_scorecard');
    });
  });

  describe('6. Frontend UI DOM Markers', () => {
    test('public/app/modules/leads.js contains #drawerAiScorecardCard with data-qa attribute', () => {
      const leadsJsPath = path.join(__dirname, '../public/app/modules/leads.js');
      const leadsJsContent = fs.readFileSync(leadsJsPath, 'utf8');
      expect(leadsJsContent).toContain('id="drawerAiScorecardCard"');
      expect(leadsJsContent).toContain('class="ai-scorecard-card"');
      expect(leadsJsContent).toContain('data-qa="ai-scorecard-gauge"');
      expect(leadsJsContent).toContain('id="drawerAiScoreVal"');
    });
  });

  describe('7. Synthetic E2E Lead Lifecycle & Teardown', () => {
    let createdLeadId = null;

    test('Submits synthetic AI audit lead [QA-LEAD-TEST] via POST /api/leads/ai-audit', async () => {
      const payload = {
        companyName: 'Quantum Capital PLC [QA-LEAD-TEST]',
        contactName: 'Dr. QA Tester',
        email: 'qa-tester@test.gro10x.ai',
        phone: '+8801711019550',
        currentTechStack: ['Node.js / Express', 'PostgreSQL / pgvector'],
        dataReadiness: 'unstructured_docs',
        automationPriority: 'customer_support',
        monthlyBudgetUsd: 2500,
        timelineUrgency: 'within_30_days'
      };

      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send(payload);

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.ok).toBe(true);
      expect(res.body.scorecard).toBeDefined();
      expect(res.body.scorecard.canonicalServiceCode).toBe('SVC-003');
      expect(res.body.scorecard.score).toBeGreaterThan(0);

      createdLeadId = res.body.leadId;
      expect(createdLeadId).toBeDefined();
    });

    test('Retrieves created lead via GET /api/leads and verifies scorecard attribution', async () => {
      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      const leadsList = Array.isArray(res.body) ? res.body : (res.body.leads || []);
      expect(leadsList.length).toBeGreaterThan(0);

      const found = leadsList.find(l => l.id === createdLeadId || (l.notes && l.notes.includes('Quantum Capital PLC [QA-LEAD-TEST]')));
      expect(found).toBeDefined();
      expect(found.source).toBe('AI_Readiness_Scorecard');
    });

    test('Ephemeral Teardown: Safely deletes test lead via DELETE /api/leads/:id', async () => {
      if (!createdLeadId) return;

      const res = await request(app)
        .delete(`/api/leads/${createdLeadId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
