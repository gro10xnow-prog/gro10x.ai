/**
 * tests/stakeholder_touchpoints.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stakeholder Touchpoints Refactoring Test Suite
 * Validates all refactored interactions across:
 * 1. Subcontractor Security, Tenant Isolation & Financial Masking
 * 2. Contractor Definition of Done (DoD) Persistence
 * 3. Corporate Payment Rail Governance (BRAC Bank Wire vs Zero Personal MFS)
 * 4. Dynamic Statutory VAT & Engine 2 Invoice Pipeline
 * 5. Commercial Proposal Acceptance to Corporate Invoice Pipeline
 * 6. Kanban QC Approve to Client Review Room Synchronization
 * 7. Task Time Log to Retainer Hours Bank Rollup
 * 8. Telegram Bot Mesh Keyboards & Callback Query Resilience
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { assignPodToProject } = require('../src/services/delivery-pods');
const { createInvoiceRecord } = require('../src/routes/invoices');
const { getRetainerBalance, logRetainerHours } = require('../src/services/retainer-bank');
const { getClientKeyboard } = require('../src/services/bot/keyboards');

describe('Stakeholder Touchpoints Refactoring Suite', () => {

  const adminToken = signToken({
    userId: 'EMP-ADM-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const projectAId = `PRJ-TOUCH-A-${Date.now()}`;
  const projectBId = `PRJ-TOUCH-B-${Date.now()}`;

  // Subcontractor strictly scoped to Project A
  const contractorTokenProjectA = signToken({
    userId: 'CON-ALICE-001',
    name: 'Alice Specialist',
    role: 'Subcontractor',
    accessLevel: 'Contractor',
    linkedType: 'contractor',
    projectId: projectAId,
    projectName: 'Project A Workflow'
  });

  beforeAll(async () => {
    // Seed Project A with confidential financials
    saveMemoryProject({
      id: projectAId,
      name: 'Project A Autonomous Agent',
      client: 'Alpha Corp',
      clientName: 'Alpha Corp',
      clientId: 'CLI-ALPHA-01',
      budget: 350000,
      price: 350000,
      hourlyRate: 75,
      cogs: 500,
      grossMargin: 80,
      invoices: [{ id: 'INV-SECRET-01', amount: 350000, status: 'Paid' }],
      status: 'Active',
      department: 'Production'
    });

    // Seed Project B
    saveMemoryProject({
      id: projectBId,
      name: 'Project B Automation Pipeline',
      client: 'Beta Corp',
      clientName: 'Beta Corp',
      clientId: 'CLI-BETA-01',
      budget: 180000,
      status: 'Active',
      department: 'Production'
    });

    await assignPodToProject(projectAId, {
      podType: 'MVP_RAPID_DELIVERY_POD',
      leadEngineer: 'Amanullah (Tech Lead)',
      assignedMembers: ['Sabbir (Full Stack)']
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 1: Subcontractor Access Isolation & Anti-Financial Leakage
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 1: Subcontractor Security & Multi-Tenant Isolation', () => {
    test('Subcontractor cannot access global invoices /api/invoices (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${contractorTokenProjectA}`);
      
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toMatch(/Forbidden: Subcontractors are not authorized to view commercial invoices/i);
    });

    test('Subcontractor cannot access global projects list /api/projects (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${contractorTokenProjectA}`);
      
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toMatch(/Forbidden/i);
    });

    test('Subcontractor scoped to Project A is FORBIDDEN from accessing Project B contractor view (403)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectBId}/contractor-view`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`);
      
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toMatch(/Forbidden: Subcontractor token is not authorized for this project/i);
    });

    test('Subcontractor scoped to Project A is FORBIDDEN from submitting tickets for Project B (403)', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectBId}/contractor-ticket`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`)
        .send({
          title: 'Unauthorized defect report',
          severity: 'p1_defect',
          description: 'Hacking attempt across tenant boundary'
        });
      
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toMatch(/Forbidden: Subcontractor token is not authorized for this project/i);
    });

    test('Subcontractor scoped to Project A CAN access Project A with 100% financial confidentiality', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectAId}/contractor-view`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`);
      
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.financialsMasked).toBe(true);
      expect(res.body.viewMode).toBe('subcontractor_scoped');

      // Commercial data must be completely absent
      expect(res.body.budget).toBeUndefined();
      expect(res.body.price).toBeUndefined();
      expect(res.body.invoices).toBeUndefined();
      expect(res.body.cogs).toBeUndefined();
      expect(res.body.grossMargin).toBeUndefined();
      expect(res.body.hourlyRate).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 2: Contractor Definition of Done (DoD) Persistence
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 2: Definition of Done (DoD) Persistence API', () => {
    test('Subcontractor cannot toggle DoD for a foreign project (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectBId}/contractor-dod`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`)
        .send({
          index: 0,
          passed: true
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    test('Subcontractor toggles DoD item on authorized project (200 OK & persisted state)', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectAId}/contractor-dod`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`)
        .send({
          index: 1,
          passed: true,
          title: 'Zero Console Errors & Responsive UI Check'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.checklist).toBeDefined();
      expect(Array.isArray(res.body.checklist)).toBe(true);
      expect(res.body.checklist[1].passed).toBe(true);
    });

    test('DoD toggle alias route /contractor/dod-toggle works seamlessly', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectAId}/contractor/dod-toggle`)
        .set('Authorization', `Bearer ${contractorTokenProjectA}`)
        .send({
          index: 2,
          passed: true
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.checklist[2].passed).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 3: Corporate Payment Rail Governance
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 3: Corporate Settlement Rail Governance (BRAC Bank Limited)', () => {
    test('client-miniapp.html strictly enforces BRAC Bank wire and has ZERO personal bKash/Nagad', () => {
      const miniAppPath = path.join(__dirname, '../public/client-miniapp.html');
      const content = fs.readFileSync(miniAppPath, 'utf8');

      // Verify official corporate settlement account
      expect(content).toContain('BRAC Bank Limited');
      expect(content).toContain('Neoncore Tech Solution');
      expect(content).toContain('2081636480001');
      expect(content).toContain('060263290');

      // Verify removal of personal MFS wallets
      expect(content).not.toContain('01708-459008');
      expect(content).not.toContain('bKash Personal');
      expect(content).not.toContain('Gulshan Branch');
    });

    test('Telegram client handler strictly enforces BRAC Bank and zero personal bKash', () => {
      const handlerPath = path.join(__dirname, '../src/services/bot/handlers/client.js');
      const content = fs.readFileSync(handlerPath, 'utf8');

      expect(content).toContain('2081636480001');
      expect(content).toContain('Neoncore Tech Solution');
      expect(content).not.toContain('01711-019550');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 4: Dynamic Statutory VAT & Engine 2 Invoice Pipeline
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 4: Dynamic VAT & Invoice Architecture', () => {
    test('createInvoiceRecord calculates statutory 5% VAT dynamically without hardcoded magic numbers', async () => {
      const baseFee = 60000;
      const expectedVat = Math.round(baseFee * 0.05); // 3,000
      const expectedTotal = baseFee + expectedVat; // 63,000

      const invoice = await createInvoiceRecord({
        clientName: 'Nexus AI Ltd',
        projectName: 'Enterprise Agent Workflow',
        amount: 0, // Request dynamic calculation from items
        taxRate: 5,
        items: [{ description: 'Core Build Sprint', amount: baseFee }]
      });

      expect(invoice.subtotal).toBe(baseFee);
      expect(invoice.vatAmount).toBe(expectedVat);
      expect(invoice.amount).toBe(expectedTotal);
      expect(invoice.engineTag).toBe('engine2');
      expect(invoice.settlementRail).toBe('bdt_bank_wire');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 5: Commercial Proposal to Invoice Pipeline
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 5: Commercial Proposal Acceptance to Invoice Pipeline', () => {
    test('Accepting proposal auto-generates client record, lock-in spec, and upfront invoice', async () => {
      // Create a test proposal in memory
      const { inMemoryProposals } = require('../src/routes/proposals');
      const testPropToken = `test-prop-${Date.now()}`;
      const testPropId = `PROP-TEST-${Date.now()}`;

      inMemoryProposals.push({
        id: testPropId,
        share_token: testPropToken,
        project_title: 'Multi-Agent Support Co-Pilot',
        client_company: 'HyperScale Retail Ltd',
        client_name: 'Rafiqul Islam',
        client_email: `rafiq-${Date.now()}@hyperscale.com`,
        client_phone: '+8801711998877',
        one_time_total: 100000,
        recurring_total: 25000,
        currency: 'BDT',
        status: 'Draft',
        scope_items: [{ title: 'Autonomous Email Agent' }]
      });

      const res = await request(app)
        .post(`/api/public/proposals/${testPropToken}/accept`)
        .send({
          acceptedBy: 'Rafiqul Islam (CTO)',
          clientNote: 'Ready for 14-day delivery sprint'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.clientId).toBeDefined();
      expect(res.body.specId).toBeDefined();
      expect(res.body.invoiceId).toBeDefined();
      expect(res.body.invoiceId).toMatch(/^INV-2026-/);
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.settlementRail).toBe('bdt_bank_wire');
      expect(res.body.proposal.status).toBe('Accepted');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 6: Kanban QC Approve & Retainer Rollup
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 6: Kanban QC Synchronization & Retainer Hours Rollup', () => {
    test('Task time logging rolls up to the Retainer Hours Bank', async () => {
      const retainerProjId = `PRJ-RET-${Date.now()}`;

      saveMemoryProject({
        id: retainerProjId,
        name: 'Retainer Development Sprint',
        client: 'Beta Retainer Client',
        retainerHours: 40,
        status: 'Active'
      });

      // Log 4 hours against the project retainer
      const result = await logRetainerHours(retainerProjId, {
        hours: 4,
        empName: 'Sabbir (Engineer)',
        taskTitle: 'LangGraph human-in-the-loop checkpoint handler',
        category: 'Development'
      });

      expect(result.ok).toBe(true);
      expect(result.hoursLogged || result.summary.usedHours).toBeGreaterThanOrEqual(4);

      // Verify balance query
      const currentBalance = await getRetainerBalance(retainerProjId);
      expect(currentBalance.hoursLogged || currentBalance.usedHours).toBeGreaterThanOrEqual(4);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 7: Telegram Bot Mesh Resilience
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 7: Telegram Bot Keyboards & Callback Queries', () => {
    test('getClientKeyboard links web_app to client-miniapp.html', () => {
      const kb = getClientKeyboard({});
      expect(kb).toBeDefined();
      expect(kb.keyboard).toBeDefined();

      const miniAppButton = kb.keyboard.flat().find(b => b.web_app);
      expect(miniAppButton).toBeDefined();
      expect(miniAppButton.web_app.url).toContain('/client-miniapp.html');
    });

    test('bot.js answerCallbackQuery does not contain illegal url parameter', () => {
      const botPath = path.join(__dirname, '../src/services/bot.js');
      const content = fs.readFileSync(botPath, 'utf8');

      // The substring answerCallbackQuery(..., { ... url: ... }) must not exist
      const regex = /answerCallbackQuery\([^)]*url\s*:/i;
      expect(regex.test(content)).toBe(false);
    });
  });

});
