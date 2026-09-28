/**
 * tests/subphase_4_4_full_regression_matrix.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.4 Test Suite: Full Regression E2E QA Matrix Execution
 *
 * Verifies:
 * 1. GRO10X_REGISTRY completeness across all 5 platforms and 57+ pages
 * 2. PLATFORM_TAB_MAP alignment in suite-loader.js
 * 3. Health audit mapping and action/assertion integrity in PORTAL_AUDITS
 * 4. Workflow definition integrity across admin, client, and partner workflows
 * 5. Full ecosystem Zero Native Dialogs Policy enforcement (0 alert, confirm, prompt)
 * 6. Full ecosystem Zero Banned Phone Numbers Policy enforcement
 * 7. End-to-End Multi-Stakeholder Lifecycle (Lead ➔ Proposal ➔ Workspace ➔ Vault ➔ Redeem)
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const sse = require('../src/services/sse');

// Load QA Registry & Suite Modules
const { GRO10X_REGISTRY } = require('../extension/gro10x-qa-runner/suites/registry');
const { PLATFORM_TAB_MAP } = require('../extension/gro10x-qa-runner/suites/suite-loader');
const { PORTAL_AUDITS } = require('../extension/gro10x-qa-runner/suites/portal-audits');
const { MY_PORTAL_QA_SUITE } = require('../extension/gro10x-qa-runner/suites/my-portal-qa');
const { PARTNERS_QA_SUITE } = require('../extension/gro10x-qa-runner/suites/partners-qa');

describe('🚀 Sub-Phase 4.4: Full Regression E2E QA Matrix Execution', () => {

  let sseBroadcastSpy = null;

  beforeAll(() => {
    sseBroadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
  });

  afterAll(() => {
    if (sseBroadcastSpy) sseBroadcastSpy.mockRestore();
  });

  // 1. Registry Platform & Page Completeness
  test('1. GRO10X_REGISTRY contains all 5 platforms with full page coverage', () => {
    expect(GRO10X_REGISTRY).toBeDefined();
    const platforms = Object.keys(GRO10X_REGISTRY);
    expect(platforms).toEqual(expect.arrayContaining(['admin', 'client', 'partners', 'public', 'workspace']));

    // Admin has 22 operational tabs
    expect(GRO10X_REGISTRY.admin.pages.length).toBe(22);

    // Client has 9 operational tabs
    expect(GRO10X_REGISTRY.client.pages.length).toBe(9);
    const clientPageIds = GRO10X_REGISTRY.client.pages.map(p => p.id);
    expect(clientPageIds).toEqual(expect.arrayContaining([
      'home', 'retainer', 'review', 'campaign', 'brief', 'lockin', 'invoices', 'tickets', 'account'
    ]));

    // Partners has 2 tabs
    expect(GRO10X_REGISTRY.partners.pages.length).toBe(2);

    // Public has 8 pages
    expect(GRO10X_REGISTRY.public.pages.length).toBe(8);
    const publicPageIds = GRO10X_REGISTRY.public.pages.map(p => p.id);
    expect(publicPageIds).toEqual(expect.arrayContaining([
      'landing', 'investors', 'aiAudit', 'contractor', 'planner', 'viewer3d', 'proposal', 'myPortal'
    ]));

    // Workspace has 16 tabs
    expect(GRO10X_REGISTRY.workspace.pages.length).toBe(16);
  });

  // 2. Suite Loader Alignment
  test('2. PLATFORM_TAB_MAP mirrors all platforms and tabs in suite-loader.js', () => {
    expect(PLATFORM_TAB_MAP).toBeDefined();
    expect(PLATFORM_TAB_MAP.admin.tabs.length).toBe(22);
    expect(PLATFORM_TAB_MAP.client.tabs.length).toBe(9);
    expect(PLATFORM_TAB_MAP.partners.tabs.length).toBe(2);
    expect(PLATFORM_TAB_MAP.public.tabs.length).toBe(8);
    expect(PLATFORM_TAB_MAP.workspace.tabs.length).toBe(16);

    // Verify myPortal is present in public tabs
    const myPortalTab = PLATFORM_TAB_MAP.public.tabs.find(t => t.id === 'myPortal');
    expect(myPortalTab).toBeDefined();
    expect(myPortalTab.suiteFile).toBe('my-portal-qa.js');
  });

  // 3. Health Audit Suite Resolution
  test('3. Every public and client auditSuiteId maps to a registered audit definition', () => {
    expect(PORTAL_AUDITS).toBeDefined();

    // Check all client audit suites
    GRO10X_REGISTRY.client.pages.forEach(page => {
      const audit = PORTAL_AUDITS[page.auditSuiteId];
      expect(audit).toBeDefined();
      expect(Array.isArray(audit.steps)).toBe(true);
      expect(audit.steps.length).toBeGreaterThan(0);
    });

    // Check public audit suites
    GRO10X_REGISTRY.public.pages.forEach(page => {
      if (page.auditSuiteId === 'public_my_portal') {
        expect(PORTAL_AUDITS['public_my_portal']).toBeDefined();
      } else {
        expect(PORTAL_AUDITS[page.auditSuiteId]).toBeDefined();
      }
    });

    // Check partners audit suites
    GRO10X_REGISTRY.partners.pages.forEach(page => {
      expect(PORTAL_AUDITS[page.auditSuiteId]).toBeDefined();
    });
  });

  // 4. Dedicated QA Suite Integrity
  test('4. Dedicated QA Suites (my-portal-qa.js & partners-qa.js) define valid step sequences', () => {
    expect(MY_PORTAL_QA_SUITE).toBeDefined();
    expect(MY_PORTAL_QA_SUITE.steps.length).toBe(12);
    MY_PORTAL_QA_SUITE.steps.forEach(step => {
      expect(step.id).toBeDefined();
      expect(step.title).toBeDefined();
      expect(step.action).toBeDefined();
      expect(step.assertion).toBeDefined();
    });

    expect(PARTNERS_QA_SUITE).toBeDefined();
    expect(PARTNERS_QA_SUITE.steps.length).toBeGreaterThanOrEqual(10);
  });

  // 5. Full Ecosystem Zero Native Dialogs Audit
  test('5. Static Code Audit: Entire public and client ecosystem enforces Zero Native Dialogs (0 alert, confirm, prompt)', () => {
    const filesToScan = [
      'public/my-portal/portal.js',
      'public/my-portal/index.html',
      'public/client/client.js',
      'public/client/modules/home.js',
      'public/client/modules/brief.js',
      'public/client/modules/retainer.js',
      'public/client/modules/review.js',
      'public/client/modules/lockin.js',
      'public/client/modules/tickets.js',
      'public/client/modules/account.js',
      'public/client/modules/invoices.js',
      'public/client/modules/campaign.js',
      'public/partners.html',
      'public/ai-audit.html',
      'public/proposal.html',
      'public/service-detail.html',
      'public/index.html'
    ];

    const nativeDialogRegex = /\b(alert|confirm|prompt)\s*\(/g;
    const violations = [];

    filesToScan.forEach(relPath => {
      const fullPath = path.join(__dirname, '..', relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(nativeDialogRegex);
        if (matches && matches.length > 0) {
          violations.push({ file: relPath, count: matches.length, matches });
        }
      }
    });

    expect(violations).toEqual([]);
  });

  // 6. Full Ecosystem Zero Banned Phone Numbers Audit
  test('6. Static Code Audit: Entire public codebase strictly excludes banned phone numbers', () => {
    const filesToScan = [
      'public/my-portal/portal.js',
      'public/my-portal/index.html',
      'public/client/client.js',
      'public/partners.html',
      'public/ai-audit.html',
      'public/proposal.html',
      'public/service-detail.html',
      'public/index.html',
      'src/routes/leads.js',
      'src/routes/proposals.js',
      'src/routes/portal.js',
      'src/routes/affiliates.js'
    ];

    const violations = [];

    filesToScan.forEach(relPath => {
      const fullPath = path.join(__dirname, '..', relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('1708459008') || content.includes('1708-459008')) {
          violations.push(relPath);
        }
      }
    });

    expect(violations).toEqual([]);
  });

  // 7. End-to-End Multi-Stakeholder Lifecycle
  test('7. End-to-End Lifecycle: Lead ➔ Proposal ➔ Workspace Provisioning ➔ Vault Activation ➔ GroCredits Redemption', async () => {
    const timestamp = Date.now();
    const testEmail = `nhf.lead.${timestamp}@nationalhousingbd.com`;

    // Step A: Ingest High-Intent Lead
    const leadRes = await request(app)
      .post('/api/leads')
      .send({
        name: 'Sayeed Ahmed',
        email: testEmail,
        company: 'National Housing Finance PLC',
        service_interest: 'ENTERPRISE_AI_AUTOMATION',
        notes: 'Enterprise AI Transformation with EMI simulator and REHAB sync',
        estimated_budget: '$15,000+'
      });

    expect([200, 201]).toContain(leadRes.status);
    expect(leadRes.body.success || leadRes.body.ok).toBe(true);
    expect(leadRes.body.lead).toBeDefined();
    const leadId = leadRes.body.lead.id;

    // Step B: Create Enterprise SOW Proposal
    const propRes = await request(app)
      .post('/api/proposals')
      .send({
        client_name: 'National Housing Finance PLC',
        client_email: testEmail,
        lead_id: leadId,
        title: 'Enterprise AI Transformation SOW - National Housing Finance',
        scope_description: 'AI Digital Sales Officer, EMI simulator engine, and regulatory DBR/LTV guardrails',
        total_amount: 15000,
        currency: 'USD'
      });

    expect(propRes.status).toBe(201);
    expect(propRes.body.success || propRes.body.ok).toBe(true);
    expect(propRes.body.proposal).toBeDefined();
    const proposalToken = propRes.body.proposal.share_token || propRes.body.proposal.shareToken || propRes.body.proposal.id;

    // Step C: Client Accepts Proposal & Provisions Workspace
    const acceptRes = await request(app)
      .post(`/api/proposals/${proposalToken}/accept`)
      .send({
        signee_name: 'Sayeed Ahmed',
        signee_title: 'Head of Retail Lending & AI Transformation'
      });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success || acceptRes.body.ok).toBe(true);
    expect(acceptRes.body.clientId).toBeDefined();

    const clientSessionToken = acceptRes.body.clientToken || acceptRes.body.sessionToken;
    expect(clientSessionToken).toBeDefined();

    // Step D: Client Logs Into Workspace via Magic Link Handshake
    const clientMeRes = await request(app)
      .get('/api/clients/me')
      .set('Authorization', `Bearer ${clientSessionToken}`);

    expect(clientMeRes.status).toBe(200);
    expect(clientMeRes.body.success || clientMeRes.body.ok).toBe(true);
    expect(clientMeRes.body.client).toBeDefined();

    // Step E: Member Activates Digital Product Vault
    const vaultRes = await request(app)
      .post('/api/portal/activate')
      .send({
        code: 'PLA14-DEMO-2026',
        email: testEmail,
        name: 'Sayeed Ahmed'
      });

    expect(vaultRes.status).toBe(200);
    expect(vaultRes.body.ok).toBe(true);
    expect(vaultRes.body.wallet.balance).toBe(200);
    expect(vaultRes.body.unlockedSkus).toContain('PLA-14');

    const customerToken = vaultRes.body.token;

    // Step F: Member Redeems GroCredits for PLA-15 Companion
    const redeemRes = await request(app)
      .post('/api/portal/redeem')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sku: 'PLA-15',
        creditsCost: 150,
        name: 'ADHD Low-Dopamine Daily Planner'
      });

    expect(redeemRes.status).toBe(200);
    expect(redeemRes.body.ok).toBe(true);
    expect(redeemRes.body.newBalance).toBe(50);
    expect(redeemRes.body.unlockedSkus).toContain('PLA-15');
  });

});
