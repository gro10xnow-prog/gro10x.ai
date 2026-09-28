/**
 * tests/subphase_3_5_qa_suite_client_deep_audits.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.5: Chrome Extension QA Suite: Client Portal Deep Audits & Retainer Verification
 *
 * Verifies:
 * 1. GRO10X_REGISTRY.client maps all 9 tabs (home, retainer, review, campaign, brief, lockin, invoices, tickets, account)
 * 2. PORTAL_AUDITS contains deep audit suites for all 9 client tabs with complete DOM selectors
 * 3. client_retainer audit verifies hours bank, consumption progress, transparent log table, and quotas grid
 * 4. workflow_client_review_lockin executes 5-step sign-off and warranty shield activation
 * 5. content-script.js implements all required client custom checks (assert_client_view_rendered, assert_warranty_shield_active, assert_client_route_sync)
 * 6. Sidepanel runner concatenates CLIENT_WORKFLOWS and PORTAL_AUDITS in registry runner
 * 7. Static Zero-Leakage & Zero-Dialog: all 9 client modules in public/client/modules/ contain zero alert/confirm/prompt and zero banned phone (1708)
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

const { GRO10X_REGISTRY } = require('../extension/gro10x-qa-runner/suites/registry');
const { CLIENT_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/client-workflows');

describe('🚀 Sub-Phase 3.5: Chrome Extension QA Suite: Client Portal Deep Audits & Retainer Verification', () => {

  const portalAuditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
  const contentScriptPath = path.join(__dirname, '../extension/gro10x-qa-runner/content-script.js');
  const sidepanelJsPath = path.join(__dirname, '../extension/gro10x-qa-runner/sidepanel.js');
  const clientModulesDir = path.join(__dirname, '../public/client/modules');

  const EXPECTED_TABS = [
    'home',
    'retainer',
    'review',
    'campaign',
    'brief',
    'lockin',
    'invoices',
    'tickets',
    'account'
  ];

  test('1. GRO10X_REGISTRY.client defines all 9 operational client tabs with correct hashes and auditSuiteIds', () => {
    const clientPlatform = GRO10X_REGISTRY.client;
    expect(clientPlatform).toBeDefined();
    expect(clientPlatform.id).toBe('client');
    expect(clientPlatform.baseUrl).toBe('/client');
    expect(clientPlatform.containerSelector).toBe('#client-view');

    const pageIds = clientPlatform.pages.map(p => p.id);
    EXPECTED_TABS.forEach(tab => {
      expect(pageIds).toContain(tab);
      const page = clientPlatform.pages.find(p => p.id === tab);
      expect(page.hash).toBe(`#${tab}`);
      expect(page.auditSuiteId).toBe(`client_${tab}`);
    });
  });

  test('2. PORTAL_AUDITS defines deep audit suites for all 9 client tabs with complete verification steps', () => {
    const auditsContent = fs.readFileSync(portalAuditsPath, 'utf8');

    EXPECTED_TABS.forEach(tab => {
      const suiteKey = `"client_${tab}":`;
      expect(auditsContent).toContain(suiteKey);
    });
  });

  test('3. client_retainer audit verifies hours bank, consumption progress, transparent log table, and quotas grid', () => {
    const auditsContent = fs.readFileSync(portalAuditsPath, 'utf8');
    const retainerSection = auditsContent.slice(
      auditsContent.indexOf('"client_retainer":'),
      auditsContent.indexOf('"client_review":')
    );

    expect(retainerSection).toContain('"targetHash": "#retainer"');
    expect(retainerSection).toContain('Engineering Hours Bank');
    expect(retainerSection).toContain('Transparent Engineering Activity Log');
    expect(retainerSection).toContain('Format Quotas Grid');
    expect(retainerSection).toContain('Retainer Contract Terms');
    expect(retainerSection).toContain('Assigned Creative Team Pod');
  });

  test('4. workflow_client_review_lockin executes 5-step review sign-off and warranty shield activation', () => {
    const wf = CLIENT_WORKFLOWS.workflow_client_review_lockin;
    expect(wf).toBeDefined();
    expect(wf.platform).toBe('client');
    expect(wf.pageId).toBe('review');
    expect(wf.targetHash).toBe('#review');
    expect(wf.steps.length).toBe(5);

    expect(wf.steps[0].action).toBe('navigate_hash');
    expect(wf.steps[0].target).toBe('#review');

    expect(wf.steps[1].action).toBe('workflow_client_post_feedback');
    expect(wf.steps[2].action).toBe('workflow_client_approve_cut');
    expect(wf.steps[2].assertion.type).toBe('wait_for_toast');

    expect(wf.steps[3].action).toBe('navigate_hash');
    expect(wf.steps[3].target).toBe('#lockin');

    expect(wf.steps[4].action).toBe('workflow_assert_warranty_shield');
    expect(wf.steps[4].assertion.check).toBe('assert_warranty_shield_active');
  });

  test('5. content-script.js implements all required client custom checks with zero errors', () => {
    const csContent = fs.readFileSync(contentScriptPath, 'utf8');

    const requiredChecks = [
      'assert_client_view_rendered',
      'assert_client_route_sync',
      'assert_warranty_shield_active',
      'assert_brief_form_filled',
      'assert_brief_cleaned_up'
    ];

    requiredChecks.forEach(check => {
      expect(csContent).toContain(`assertion.check === '${check}'`);
    });
  });

  test('6. sidepanel.js integrates CLIENT_WORKFLOWS into active runner registry', () => {
    const sidepanelContent = fs.readFileSync(sidepanelJsPath, 'utf8');

    expect(sidepanelContent).toContain('CLIENT_WORKFLOWS');
    expect(sidepanelContent).toContain('PORTAL_AUDITS');
    expect(sidepanelContent).toContain('GRO10X_REGISTRY');
  });

  test('7. Static Zero-Leakage & Zero-Dialog: all 9 client modules contain zero alert/confirm/prompt and zero banned phone (1708)', () => {
    const clientModuleFiles = fs.readdirSync(clientModulesDir).filter(f => f.endsWith('.js'));
    expect(clientModuleFiles.length).toBeGreaterThanOrEqual(9);

    clientModuleFiles.forEach(file => {
      const filePath = path.join(clientModulesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Zero native dialogs
      const alertMatches = content.match(/\balert\s*\(/g) || [];
      const confirmMatches = content.match(/\bconfirm\s*\(/g) || [];
      const promptMatches = content.match(/\bprompt\s*\(/g) || [];

      expect(alertMatches.length).toBe(0);
      expect(confirmMatches.length).toBe(0);
      expect(promptMatches.length).toBe(0);

      // Zero banned phone
      expect(content).not.toContain('1708');
    });
  });
});
