/**
 * tests/stakeholder_uiux_phase3.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3 UI/UX Test Suite: Specialist SPI, Compute COGS & Contractor Escrow
 * Validates:
 * 1. Specialist Performance Index (SPI) Cockpit Card & Profile Badges
 * 2. Compute COGS & GPU Expense Claim Desk with Live Margin Guardrail
 * 3. Subcontractor Milestone Escrow Vault & Defect SLA Holdback Notice
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');

describe('Phase 3 UI/UX: Specialist SPI, Compute COGS & Contractor Escrow Suite', () => {

  const crewToken = signToken({
    userId: 'GRO-000',
    name: 'Amanullah',
    role: 'Specialist',
    accessLevel: 'Specialist',
    emp_code: 'GRO-000'
  });

  const contractorToken = signToken({
    userId: 'CONT-404',
    name: 'Tariq Rahman',
    role: 'Subcontractor',
    accessLevel: 'Specialist',
    linkedType: 'contractor',
    projectId: 'PRJ-SPI-TEST'
  });

  const testProjectId = 'PRJ-SPI-TEST';

  beforeAll(() => {
    saveMemoryProject({
      id: testProjectId,
      projectId: testProjectId,
      name: 'Autonomous AI Voice Gateway',
      title: 'Autonomous AI Voice Gateway',
      stage: 'in_progress',
      status: 'active',
      budget: 250000,
      price: 250000,
      totalCOGS: 25000,
      cogs: 25000,
      contractorPayoutBDT: 45000,
      contractorMilestone: {
        title: 'Voice Synthesizer Pipeline & Staging Validation',
        amountBDT: 45000
      },
      deliverables: [
        {
          id: 'deliv-01',
          title: 'Core Voice Pipeline Endpoint',
          deliverableType: 'staging_url',
          stagingUrl: 'https://staging.voice.gro10x.ai',
          repoUrl: 'https://github.com/gro10x/voice-pipeline',
          dodChecklist: [
            { title: 'Deterministic audio buffering', passed: true },
            { title: 'Sub-200ms latency verified', passed: true }
          ]
        }
      ],
      tasks: [
        {
          id: 'task-01',
          title: 'Audio streaming WebSocket handler',
          priority: 'high',
          stage: 'In Progress'
        }
      ]
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Specialist Performance Index (SPI) Cockpit Card & Profile Badges
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Specialist Performance Index (SPI) Cockpit Card & Profile Badges', () => {
    test('GET /api/team/specialist/:id/spi computes 0-100 SPI score and 3-factor telemetry', async () => {
      const res = await request(app)
        .get('/api/team/specialist/GRO-000/spi')
        .set('Authorization', `Bearer ${crewToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.specialistId).toBe('GRO-000');
      expect(typeof res.body.spiScore).toBe('number');
      expect(res.body.spiScore).toBeGreaterThanOrEqual(70);
      expect(res.body.tierBadge).toBeDefined();
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.velocityScore).toBeDefined();
      expect(res.body.metrics.defectScore).toBeDefined();
      expect(res.body.metrics.peerReviewScore).toBeDefined();
      expect(res.body.metrics.onTimeDeliveryRate).toBeDefined();
      expect(res.body.settlementRail).toContain('BRAC Bank');
      expect(res.body.settlementRail).toContain('2081636480001');
    });

    test('public/crew/modules/profile.js contains #crewSpiCard, radial gauge and 3-factor telemetry', () => {
      const profileJsPath = path.join(__dirname, '../public/crew/modules/profile.js');
      expect(fs.existsSync(profileJsPath)).toBe(true);
      const content = fs.readFileSync(profileJsPath, 'utf8');

      expect(content).toContain('crewSpiCard');
      expect(content).toContain('crewSpiCircle');
      expect(content).toContain('crewSpiScoreVal');
      expect(content).toContain('crewSpiTierBadge');
      expect(content).toContain('crewSpiVelocityPts');
      expect(content).toContain('crewSpiDefectPts');
      expect(content).toContain('crewSpiPeerPts');
      expect(content).toContain('crewSpiBonusEligible');
      expect(content).toContain('Specialist Performance Index (SPI)');
      expect(content).toContain('/team/specialist/');
    });

    test('public/crew/modules/leaderboard.js renders SPI score pill for production specialists', () => {
      const leaderboardJsPath = path.join(__dirname, '../public/crew/modules/leaderboard.js');
      expect(fs.existsSync(leaderboardJsPath)).toBe(true);
      const content = fs.readFileSync(leaderboardJsPath, 'utf8');

      expect(content).toContain('SPI');
      expect(content).toContain('spiScore');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Compute COGS & GPU Expense Claim Desk with Live Margin Guardrail
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Compute COGS & GPU Expense Claim Desk with Margin Guardrail', () => {
    test('POST /api/projects/:id/cogs-claim logs compute claim and returns margin guardrail telemetry', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs-claim`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          itemType: 'RunPod: Compute / GPU Cluster',
          description: 'H100 batch inference run #8821 for voice embeddings',
          amountBDT: 15000,
          receiptUrl: 'https://runpod.io/receipts/inv-8821.pdf'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.claim).toBeDefined();
      expect(res.body.claim.amountBDT).toBe(15000);
      expect(res.body.totalCOGS).toBe(40000); // 25000 + 15000
      expect(res.body.grossProfit).toBe(210000); // 250000 - 40000
      expect(res.body.marginValue).toBe(84.0); // 210000 / 250000 * 100
      expect(res.body.isHealthy).toBe(true);
    });

    test('POST /api/projects/:id/cogs-claim rejects missing or invalid amounts', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs-claim`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          itemType: 'OpenAI: API Tokens & Inference',
          amountBDT: 0
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('Valid amountBDT > 0');
    });

    test('public/crew/modules/expenses.js contains sub-tabs, form, currency sync and margin preview', () => {
      const expensesJsPath = path.join(__dirname, '../public/crew/modules/expenses.js');
      expect(fs.existsSync(expensesJsPath)).toBe(true);
      const content = fs.readFileSync(expensesJsPath, 'utf8');

      expect(content).toContain('tabBtnStandardExpense');
      expect(content).toContain('tabBtnComputeCogs');
      expect(content).toContain('switchCrewExpenseTab');
      expect(content).toContain('crewCogsClaimForm');
      expect(content).toContain('cogsProjectId');
      expect(content).toContain('cogsVendor');
      expect(content).toContain('cogsItemType');
      expect(content).toContain('cogsAmountUsd');
      expect(content).toContain('cogsAmountBdt');
      expect(content).toContain('syncCogsCurrency');
      expect(content).toContain('cogsMarginPreview');
      expect(content).toContain('updateCogsMarginPreview');
      expect(content).toContain('submitComputeCogsClaim');
      expect(content).toContain('/cogs-claim');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Subcontractor Milestone Escrow Vault & Defect SLA Holdback Notice
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Subcontractor Milestone Escrow Vault & Defect SLA Holdback Notice', () => {
    test('GET /api/projects/:id/contractor-view returns escrow vault and masked commercials', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view`)
        .set('Authorization', `Bearer ${contractorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.financialsMasked).toBe(true);

      // Verify commercial financials are strictly undefined
      expect(res.body.budget).toBeUndefined();
      expect(res.body.price).toBeUndefined();
      expect(res.body.cogs).toBeUndefined();
      expect(res.body.grossMargin).toBeUndefined();

      // Verify contractor milestone escrow
      expect(res.body.escrow).toBeDefined();
      expect(res.body.escrow.amountBDT).toBe(45000);
      expect(res.body.escrow.status).toBe('FUNDED_IN_ESCROW');
      expect(res.body.escrow.statusLabel).toContain('100% Escrow Funded in Vault');
      expect(res.body.escrow.payoutRail).toContain('BRAC Bank PLC');
      expect(res.body.escrow.payoutRail).toContain('Mohakhali');
      expect(res.body.escrow.payoutRail).toContain('060263290');
    });

    test('public/contractor-view.html contains #contractorEscrowCard and #contractorSlaBanner markup', () => {
      const contractorHtmlPath = path.join(__dirname, '../public/contractor-view.html');
      expect(fs.existsSync(contractorHtmlPath)).toBe(true);
      const content = fs.readFileSync(contractorHtmlPath, 'utf8');

      expect(content).toContain('contractorEscrowCard');
      expect(content).toContain('contractorMilestoneName');
      expect(content).toContain('contractorEscrowAmount');
      expect(content).toContain('contractorEscrowStatusBadge');
      expect(content).toContain('contractorPayoutRail');
      expect(content).toContain('contractorSlaBanner');
      expect(content).toContain('Milestone Escrow Vault');
    });

    test('public/contractor-view.html script binds escrow card and renders SLA holdback warnings', () => {
      const contractorHtmlPath = path.join(__dirname, '../public/contractor-view.html');
      const content = fs.readFileSync(contractorHtmlPath, 'utf8');

      expect(content).toContain('contractorEscrowCard');
      expect(content).toContain('contractorSlaBanner');
      expect(content).toContain('15% Milestone Holdback Active');
      expect(content).toContain('Active Defect SLA Clock Running');
      expect(content).toContain('contractorSlaCountdown');
    });
  });

});
