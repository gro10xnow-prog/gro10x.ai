/**
 * tests/subphase_3_1_spa_routing_brief_sync.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.1 Test Suite: SPA Hash Routing & Navigation Desync Fix
 *
 * Verifies:
 * 1. public/client/modules/brief.js redirects to canonical #home and has 0 #overview
 * 2. Zero Native Dialogs Policy in brief.js (0 alert, confirm, prompt)
 * 3. Client SPA Router: ROUTE_ALIASES normalizes #overview, #dashboard, #sprint to canonical routes
 * 4. Desktop Sidebar and Mobile Bottom Nav Synchronization (including #btnMoreSheet active state)
 * 5. POST /api/projects/intake creates project, auto-matches delivery pod, and returns 201
 * 6. Chrome Extension QA Suite: workflow_client_brief defines complete 5 steps and route sync assertion
 * 7. Static Zero-Leakage: Zero instances of banned phone (1708) in client SPA router and modules
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('🚀 Sub-Phase 3.1: SPA Hash Routing & Navigation Desync Fix', () => {

  const testClientToken = signToken({
    userId: 'CLI-PURPLE-001',
    name: 'Purplebot Digital',
    company: 'Purplebot Digital',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-PURPLE-001'
  });

  const briefJsPath = path.join(__dirname, '../public/client/modules/brief.js');
  const clientJsPath = path.join(__dirname, '../public/client/client.js');
  const indexHtmlPath = path.join(__dirname, '../public/client/index.html');
  const clientWorkflowsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/workflows/client-workflows.js');
  const contentScriptPath = path.join(__dirname, '../extension/gro10x-qa-runner/content-script.js');

  test('1. public/client/modules/brief.js redirects to #home and contains zero references to #overview', () => {
    const content = fs.readFileSync(briefJsPath, 'utf8');
    expect(content).not.toContain('#overview');
    expect(content).toContain("window.location.hash = '#home'");
    expect(content).toContain('Campaign Brief & Sprint Intake registered!');
  });

  test('2. Zero Native Dialogs Policy: brief.js contains zero alert(), confirm(), or prompt() calls', () => {
    const content = fs.readFileSync(briefJsPath, 'utf8');
    const alertMatches = content.match(/\balert\s*\(/g) || [];
    const confirmMatches = content.match(/\bconfirm\s*\(/g) || [];
    const promptMatches = content.match(/\bprompt\s*\(/g) || [];

    expect(alertMatches.length).toBe(0);
    expect(confirmMatches.length).toBe(0);
    expect(promptMatches.length).toBe(0);
  });

  test('3. Client SPA Router: ROUTE_ALIASES normalizes #overview and #dashboard to #home with replaceState', () => {
    const content = fs.readFileSync(clientJsPath, 'utf8');
    expect(content).toContain('const ROUTE_ALIASES');
    expect(content).toContain("'#overview':  '#home'");
    expect(content).toContain("'#dashboard': '#home'");
    expect(content).toContain("'#sprint':    '#lockin'");
    expect(content).toContain('window.ROUTE_ALIASES = ROUTE_ALIASES');
    expect(content).toContain('window.history.replaceState');
  });

  test('4. Mobile Navigation & Bottom Sheet Drawer Synchronization', () => {
    const clientJs = fs.readFileSync(clientJsPath, 'utf8');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Verify #btnMoreSheet active state logic in client.js
    expect(clientJs).toContain("document.getElementById('btnMoreSheet')");
    expect(clientJs).toContain("btnMore.classList.add('active')");
    expect(clientJs).toContain("document.querySelectorAll('#mobileBottomSheet a')");

    // Verify CSS styles in index.html for active mobile nav & drawer links
    expect(indexHtml).toContain('.bottom-nav-item.active');
    expect(indexHtml).toContain('.mobile-bottom-sheet a.active');
  });

  test('5. POST /api/projects/intake creates project, auto-matches delivery pod, and returns 201', async () => {
    const res = await request(app)
      .post('/api/projects/intake')
      .set('Authorization', `Bearer ${testClientToken}`)
      .send({
        title: 'QA Automated Enterprise Automation Sprint',
        objective: 'Autonomous workflow integration with n8n and CRM',
        deliverables: ['CRM Webhook Orchestration', 'Database Sync'],
        budget: 95000,
        clientId: 'CLI-PURPLE-001',
        clientName: 'Purplebot Digital'
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.project).toBeDefined();
    expect(res.body.project.id).toMatch(/^PRJ-INTAKE-/);
    expect(res.body.project.name).toBe('QA Automated Enterprise Automation Sprint');
    expect(res.body.project.delivery_pod).toBe('ENTERPRISE_AUTOMATION_POD');
    expect(res.body.podRecommendation).toBeDefined();
    expect(res.body.podRecommendation.podName).toContain('Enterprise Automation');
  });

  test('6. Chrome Extension QA Suite: workflow_client_brief has complete 5 steps with route sync check', () => {
    const workflowsContent = fs.readFileSync(clientWorkflowsPath, 'utf8');
    const contentScript = fs.readFileSync(contentScriptPath, 'utf8');

    expect(workflowsContent).toContain('workflow_client_brief:');
    expect(workflowsContent).toContain("'wf-cb-1'");
    expect(workflowsContent).toContain("'wf-cb-2'");
    expect(workflowsContent).toContain("'wf-cb-3'");
    expect(workflowsContent).toContain("'wf-cb-4'");
    expect(workflowsContent).toContain("'wf-cb-5'");
    expect(workflowsContent).toContain("keyword: 'Brief'");
    expect(workflowsContent).toContain("check: 'assert_client_route_sync'");

    // Content script must have handlers
    expect(contentScript).toContain("assertion.check === 'assert_brief_form_filled'");
    expect(contentScript).toContain("assertion.check === 'assert_client_route_sync'");
    expect(contentScript).toContain("assertion.check === 'assert_brief_cleaned_up'");
    expect(contentScript).toContain("step.action === 'workflow_assert_home_sync'");
  });

  test('7. Static Zero-Leakage: zero instances of banned phone (1708) in client files', () => {
    const briefContent = fs.readFileSync(briefJsPath, 'utf8');
    const clientContent = fs.readFileSync(clientJsPath, 'utf8');
    expect(briefContent).not.toContain('1708');
    expect(clientContent).not.toContain('1708');
  });
});
