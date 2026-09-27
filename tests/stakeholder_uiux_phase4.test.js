/**
 * tests/stakeholder_uiux_phase4.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4 UI/UX Test Suite: Manager Governance, SLA Holdback & Leadership P&L Waterfall
 * Validates:
 * 1. Scope Change Orders Triage Desk & Counter-Proposal Adjustment
 * 2. 24-Hour Contractor Defect SLA Breach Holdback (15% Escrow Freeze)
 * 3. Automated Sprint Retrospective Generator Hub
 * 4. Consolidated 5-Engine P&L Waterfall Card & Unit Economics
 * 5. Weekly Executive Cron & Flash Telegram Dispatch
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');

describe('Phase 4 UI/UX: Manager Governance, SLA Holdback & Leadership P&L Waterfall Suite', () => {

  const managerToken = signToken({
    userId: 'GRO-001',
    name: 'Shamsul Arefin',
    role: 'Delivery Manager',
    accessLevel: 'Manager',
    emp_code: 'GRO-001'
  });

  const leadershipToken = signToken({
    userId: 'GRO-000',
    name: 'Amanullah',
    role: 'Managing Director',
    accessLevel: 'Admin',
    emp_code: 'GRO-000'
  });

  const specialistToken = signToken({
    userId: 'GRO-SPEC-99',
    name: 'Junior Dev',
    role: 'Specialist',
    accessLevel: 'Specialist',
    emp_code: 'GRO-SPEC-99'
  });

  const testProjectId = 'PRJ-MGR-TEST';
  let changeOrderId = null;

  beforeAll(() => {
    saveMemoryProject({
      id: testProjectId,
      projectId: testProjectId,
      name: 'Omnichannel Enterprise CRM Orchestrator',
      title: 'Omnichannel Enterprise CRM Orchestrator',
      stage: 'in_progress',
      status: 'active',
      budget: 350000,
      price: 350000,
      totalCOGS: 45000,
      cogs: 45000,
      target_sla_days: 14,
      targetSlaDays: 14,
      delivery_pod: 'ENTERPRISE_AUTOMATION_POD',
      client: 'Apex FinTech Global',
      client_name: 'Apex FinTech Global',
      clientId: 'CL-APEX-01',
      client_id: 'CL-APEX-01',
      warranty_until: '2026-12-31'
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Scope Change Orders Triage Desk & Counter-Proposal Adjustment
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Scope Change Orders Triage Desk & Counter-Proposal Adjustment', () => {
    test('POST /api/projects/:id/change-order creates pending change order', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Real-Time Telephony SIP Trunk Integration',
          description: 'Add duplex audio WebRTC bridge with Bangladesh local PSTN breakout.',
          proposedFeeBDT: 45000,
          estimatedDays: 4,
          requestedBy: 'Apex FinTech Global'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder).toBeDefined();
      expect(res.body.changeOrder.status).toBe('PENDING_APPROVAL');
      expect(res.body.changeOrder.feeBDT).toBe(45000);
      expect(res.body.changeOrder.estimatedDays).toBe(4);
      changeOrderId = res.body.changeOrder.id;
    });

    test('GET /api/projects/change-orders/pending retrieves unapproved change orders', async () => {
      const res = await request(app)
        .get('/api/projects/change-orders/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.pendingChangeOrders)).toBe(true);
      const found = res.body.pendingChangeOrders.find(co => co.id === changeOrderId);
      expect(found).toBeDefined();
      expect(found.title).toContain('SIP Trunk');
    });

    test('PUT /api/projects/:id/change-order/:coId/adjust modifies fee, days, and notes', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}/change-order/${changeOrderId}/adjust`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          proposedFeeBDT: 55000,
          estimatedDays: 6,
          notes: 'High concurrency SIP signaling requires dedicated Redis buffer server.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder.feeBDT).toBe(55000);
      expect(res.body.changeOrder.estimatedDays).toBe(6);
      expect(res.body.changeOrder.managerNotes).toContain('dedicated Redis buffer');
    });

    test('POST /api/projects/:id/change-order/:coId/approve approves order and issues invoice', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order/${changeOrderId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approvedBy: 'Shamsul Arefin (Pod Manager)' });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder.status).toBe('APPROVED');
      expect(res.body.changeOrder.approvedBy).toContain('Shamsul Arefin');
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.amount).toBe(55000);
    });

    test('public/manager/modules/tickets.js renders change orders desk and counter-proposal drawer', () => {
      const ticketsJsPath = path.join(__dirname, '../public/manager/modules/tickets.js');
      expect(fs.existsSync(ticketsJsPath)).toBe(true);
      const content = fs.readFileSync(ticketsJsPath, 'utf8');

      expect(content).toContain('tabBtnTickets');
      expect(content).toContain('tabBtnChangeOrders');
      expect(content).toContain('managerChangeOrdersDesk');
      expect(content).toContain('mgrCoAdjustModal');
      expect(content).toContain('mgrCoAdjustFee');
      expect(content).toContain('mgrCoAdjustTimeline');
      expect(content).toContain('mgrCoAdjustNotes');
      expect(content).toContain('openAdjustModal');
      expect(content).toContain('submitAdjustProposal');
      expect(content).toContain('approveChangeOrder');
      expect(content).toContain('/projects/change-orders/pending');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. 24-Hour Contractor Defect SLA Breach Holdback (15% Escrow Freeze)
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. 24-Hour Contractor Defect SLA Breach Holdback', () => {
    test('POST /api/tickets/:id/sla-holdback enforces 15% escrow freeze for managers', async () => {
      const res = await request(app)
        .post('/api/tickets/TCK-SLA-TEST-01/sla-holdback')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          holdbackPercent: 15,
          reason: '24-hour SLA breached: WebSocket reconnect loop in staging',
          contractorId: 'CONT-404'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.ticketId).toBe('TCK-SLA-TEST-01');
      expect(res.body.holdback).toBeDefined();
      expect(res.body.holdback.holdbackPercent).toBe(15);
      expect(res.body.holdback.status).toBe('HELD_IN_ESCROW');
      expect(res.body.holdback.remediationRequired).toContain('Hotfix verification');
    });

    test('POST /api/tickets/:id/sla-holdback rejects non-manager / specialist users', async () => {
      const res = await request(app)
        .post('/api/tickets/TCK-SLA-TEST-02/sla-holdback')
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({ holdbackPercent: 15 });

      expect(res.statusCode).toBe(403);
    });

    test('public/manager/modules/tickets.js includes 24h countdown and holdback execution handler', () => {
      const ticketsJsPath = path.join(__dirname, '../public/manager/modules/tickets.js');
      const content = fs.readFileSync(ticketsJsPath, 'utf8');

      expect(content).toContain('24-Hour Contractor Defect SLA Triage Desk');
      expect(content).toContain('15% Escrow Freeze');
      expect(content).toContain('Enforce 15% Holdback');
      expect(content).toContain('enforceHoldback');
      expect(content).toContain('/sla-holdback');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Automated Sprint Retrospective Generator Hub
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Automated Sprint Retrospective Generator Hub', () => {
    test('POST /api/projects/:id/retro compiles retrospective telemetry and margin report', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/retro`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.retrospective).toBeDefined();
      expect(res.body.retrospective.projectId).toBe(testProjectId);
      expect(res.body.retrospective.podName).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(res.body.retrospective.velocityTargetDays).toBe(14);
      expect(res.body.retrospective.realizedGrossMarginPercent).toBeDefined();
      expect(res.body.retrospective.onTimeDelivery).toBe(true);
      expect(Array.isArray(res.body.retrospective.keyHighlights)).toBe(true);
    });

    test('public/manager/modules/overview.js contains retro generator modal and copy actions', () => {
      const overviewJsPath = path.join(__dirname, '../public/manager/modules/overview.js');
      expect(fs.existsSync(overviewJsPath)).toBe(true);
      const content = fs.readFileSync(overviewJsPath, 'utf8');

      expect(content).toContain('btnGenerateSprintRetro');
      expect(content).toContain('mgrSprintRetroModal');
      expect(content).toContain('mgrRetroTitle');
      expect(content).toContain('mgrRetroBody');
      expect(content).toContain('btnCopyRetroMd');
      expect(content).toContain('btnDispatchRetroTelegram');
      expect(content).toContain('openSprintRetroModal');
      expect(content).toContain('copyRetroMarkdown');
      expect(content).toContain('dispatchRetroTelegram');
      expect(content).toContain('/retro');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Consolidated 5-Engine P&L Waterfall Card & Unit Economics
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Consolidated 5-Engine P&L Waterfall Card & Unit Economics', () => {
    test('GET /api/engines/pnl-waterfall returns 5-engine cross-margin waterfall telemetry', async () => {
      const res = await request(app)
        .get('/api/engines/pnl-waterfall')
        .set('Authorization', `Bearer ${leadershipToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.waterfall).toBeDefined();
      expect(res.body.waterfall.grossInflowUSD).toBe(7600);
      expect(res.body.waterfall.cogs.totalCOGS_USD).toBe(1950);
      expect(res.body.waterfall.grossProfitUSD).toBe(5650);
      expect(res.body.waterfall.grossMarginPercent).toBe('74.3%');
      expect(res.body.waterfall.netOperatingIncomeUSD).toBe(4450);
      expect(res.body.waterfall.runwayMonths).toBeGreaterThanOrEqual(12);
      expect(res.body.waterfall.settlementRail).toContain('BRAC Bank Limited');
      expect(res.body.waterfall.settlementRail).toContain('2081636480001');
    });

    test('public/app/modules/engines.js renders #pnlWaterfallCard with all 6 telemetry metrics', () => {
      const enginesJsPath = path.join(__dirname, '../public/app/modules/engines.js');
      expect(fs.existsSync(enginesJsPath)).toBe(true);
      const content = fs.readFileSync(enginesJsPath, 'utf8');

      expect(content).toContain('pnlWaterfallCard');
      expect(content).toContain('pnlWaterfallMarginBadge');
      expect(content).toContain('pnlGrossInflow');
      expect(content).toContain('pnlTotalCOGS');
      expect(content).toContain('pnlGrossProfit');
      expect(content).toContain('pnlFixedOverhead');
      expect(content).toContain('pnlNOI');
      expect(content).toContain('pnlRunway');
      expect(content).toContain('pnlWaterfallBar');
      expect(content).toContain('2081636480001');
      expect(content).toContain('/engines/pnl-waterfall');
    });

    test('public/app/modules/finance.js renders parity #pnlWaterfallCard in leadership finance view', () => {
      const financeJsPath = path.join(__dirname, '../public/app/modules/finance.js');
      expect(fs.existsSync(financeJsPath)).toBe(true);
      const content = fs.readFileSync(financeJsPath, 'utf8');

      expect(content).toContain('pnlWaterfallCard');
      expect(content).toContain('pnlWaterfallMarginBadge');
      expect(content).toContain('pnlGrossInflow');
      expect(content).toContain('pnlTotalCOGS');
      expect(content).toContain('pnlGrossProfit');
      expect(content).toContain('pnlFixedOverhead');
      expect(content).toContain('pnlNOI');
      expect(content).toContain('pnlRunway');
      expect(content).toContain('pnlWaterfallBar');
      expect(content).toContain('2081636480001');
      expect(content).toContain('/engines/pnl-waterfall');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Weekly Executive Cron & Flash Telegram Dispatch
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Weekly Executive Cron & Flash Telegram Dispatch', () => {
    test('POST /api/engines/flash-dispatch dispatches executive P&L brief', async () => {
      const res = await request(app)
        .post('/api/engines/flash-dispatch')
        .set('Authorization', `Bearer ${leadershipToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.dispatched).toBe('boolean');
      expect(res.body.timestamp).toBeDefined();
    });

    test('public/app/modules/engines.js contains weekly cron status strip and flash dispatch handler', () => {
      const enginesJsPath = path.join(__dirname, '../public/app/modules/engines.js');
      const content = fs.readFileSync(enginesJsPath, 'utf8');

      expect(content).toContain('weeklyCronStatusStrip');
      expect(content).toContain('weeklyCronStatusBadge');
      expect(content).toContain('btnFlashDispatchTelegram');
      expect(content).toContain('dispatchFlashPnlSnapshot');
      expect(content).toContain('/engines/flash-dispatch');
    });
  });

});
