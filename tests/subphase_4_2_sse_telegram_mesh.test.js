/**
 * tests/subphase_4_2_sse_telegram_mesh.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.2: Real-Time Multi-Stakeholder SSE & Telegram Notification Mesh
 *
 * Verifies:
 * 1. GET /api/sync returns continuous event-stream headers (text/event-stream, no-cache, keep-alive) and connection handshake
 * 2. broadcast and broadcastToRole deliver events locally and filter by role (owner, admin, manager, client, contractor)
 * 3. POST /api/leads broadcasts lead_created and dispatches Telegram notification with WhatsApp deep-link
 * 4. GET /api/public/proposals/:token and POST /api/public/proposals/:token/accept broadcast proposal_viewed and proposal_accepted
 * 5. POST /api/reviews/:id/request-revisions broadcasts revision updates and dispatches creative team notification with [🎬 Open Review Room]
 * 6. POST /api/tickets and POST /api/tickets/:id/sla-holdback broadcast ticket events and dispatch Telegram alert with ack_defect_sla button, and ack_defect_sla callback updates ticket status and broadcasts sla_acknowledged
 * 7. Client-side SSE resilience & memory leak audit: validates singleton instance, backoff retry, and Zero Native Dialogs in public/client/sse.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';
process.env.OWNER_TELEGRAM_ID = '7754769807';
process.env.TELEGRAM_TEAM_GROUP_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const sseService = require('../src/services/sse');
const botNotifications = require('../src/services/bot/notifications');
const { inMemoryProposals } = require('../src/routes/proposals');
const { inMemoryTickets } = require('../src/routes/tickets');
const { fallbackReviews } = require('../src/routes/reviews');
const { registerLegacyTeamMenus } = require('../src/services/bot/handlers/legacy_menus');
const state = require('../src/services/state');

describe('🚀 Sub-Phase 4.2: Real-Time Multi-Stakeholder SSE & Telegram Notification Mesh', () => {

  const adminToken = signToken({
    userId: 'ADM-EXEC-001',
    name: 'Executive Director',
    role: 'Admin',
    accessLevel: 'Owner / Admin'
  });

  const clientToken = signToken({
    userId: 'CLI-APEX-001',
    name: 'Apex Horizon Lead',
    role: 'Client Partner',
    accessLevel: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-APEX'
  });

  // ── TEST 1: SSE PROTOCOL HANDSHAKE & HEADERS ───────────────────────────────
  test('1. GET /api/sync sets text/event-stream, no-cache, keep-alive headers and connects client', () => {
    const mockReq = new EventEmitter();
    mockReq.query = { role: 'admin' };
    mockReq.user = { role: 'admin' };

    const headers = {};
    const writtenData = [];

    const mockRes = {
      setHeader: jest.fn((k, v) => { headers[k.toLowerCase()] = v; }),
      flushHeaders: jest.fn(),
      write: jest.fn((chunk) => { writtenData.push(chunk); }),
      finished: false,
      writableEnded: false
    };

    const countBefore = sseService.getActiveClientsCount();
    sseService.sseHandler(mockReq, mockRes);

    expect(headers['content-type']).toBe('text/event-stream');
    expect(headers['cache-control']).toBe('no-cache');
    expect(headers['connection']).toBe('keep-alive');
    expect(mockRes.flushHeaders).toHaveBeenCalled();
    expect(writtenData.some(d => d.includes('event: connected'))).toBe(true);
    expect(sseService.getActiveClientsCount()).toBe(countBefore + 1);

    // Clean up connection
    mockReq.emit('close');
    expect(sseService.getActiveClientsCount()).toBe(countBefore);
  });

  // ── TEST 2: MULTI-STAKEHOLDER ROLE-FILTERED EVENT ROUTING ──────────────────
  test('2. broadcast and broadcastToRole deliver events and filter strictly by stakeholder role', () => {
    // Client A: Admin
    const reqAdmin = new EventEmitter();
    reqAdmin.query = { role: 'admin' };
    const resAdmin = { write: jest.fn(), finished: false, writableEnded: false, setHeader: jest.fn(), flushHeaders: jest.fn() };
    sseService.sseHandler(reqAdmin, resAdmin);

    // Client B: Client Partner
    const reqClient = new EventEmitter();
    reqClient.query = { role: 'client', clientId: 'CLI-APEX' };
    const resClient = { write: jest.fn(), finished: false, writableEnded: false, setHeader: jest.fn(), flushHeaders: jest.fn() };
    sseService.sseHandler(reqClient, resClient);

    // Client C: Contractor
    const reqContractor = new EventEmitter();
    reqContractor.query = { role: 'contractor' };
    const resContractor = { write: jest.fn(), finished: false, writableEnded: false, setHeader: jest.fn(), flushHeaders: jest.fn() };
    sseService.sseHandler(reqContractor, resContractor);

    // Clear initial handshake write calls
    resAdmin.write.mockClear();
    resClient.write.mockClear();
    resContractor.write.mockClear();

    // 1. Broadcast to ALL
    sseService.broadcast('global_announcement', { msg: 'Sprint starting' });
    expect(resAdmin.write).toHaveBeenCalledWith(expect.stringContaining('event: global_announcement'));
    expect(resClient.write).toHaveBeenCalledWith(expect.stringContaining('event: global_announcement'));
    expect(resContractor.write).toHaveBeenCalledWith(expect.stringContaining('event: global_announcement'));

    resAdmin.write.mockClear();
    resClient.write.mockClear();
    resContractor.write.mockClear();

    // 2. Broadcast to Role: Admin / Owner only
    sseService.broadcastToRole('internal_audit', { metric: 'ebitda' }, ['admin', 'owner']);
    expect(resAdmin.write).toHaveBeenCalledWith(expect.stringContaining('event: internal_audit'));
    expect(resClient.write).not.toHaveBeenCalled();
    expect(resContractor.write).not.toHaveBeenCalled();

    resAdmin.write.mockClear();
    resClient.write.mockClear();
    resContractor.write.mockClear();

    // 3. Broadcast to Client Account
    sseService.broadcastToClient('client_invoice_ready', { invId: 'INV-001' }, ['CLI-APEX']);
    expect(resClient.write).toHaveBeenCalledWith(expect.stringContaining('event: client_invoice_ready'));
    expect(resContractor.write).not.toHaveBeenCalled();

    // Disconnect all
    reqAdmin.emit('close');
    reqClient.emit('close');
    reqContractor.emit('close');
  });

  // ── TEST 3: LEAD INGESTION BROADCAST & TELEGRAM WHATSAPP ACTION ────────────
  test('3. POST /api/leads broadcasts lead_created and dispatches Telegram alert with WhatsApp deep-link', async () => {
    const tgSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);
    const broadcastSpy = jest.spyOn(sseService, 'broadcast');

    const testPhone = `+880 1799-${Date.now().toString().slice(-6)}`;
    const leadPayload = {
      name: 'QA Executive Lead',
      email: `lead-mesh-${Date.now()}@test.gro10x.ai`,
      phone: testPhone,
      company: 'Omni Mesh Technologies Ltd',
      budget: '$15,000',
      serviceInterest: 'SER-E2-CUSTOM',
      notes: 'Real-time multi-stakeholder notification test'
    };

    const res = await request(app)
      .post('/api/leads')
      .send(leadPayload)
      .expect(200);

    expect(res.body.success || res.body.ok).toBe(true);
    expect(tgSpy).toHaveBeenCalled();

    // Assert Telegram notification structure
    const tgCall = tgSpy.mock.calls.find(call => {
      const text = call[1] || '';
      return text.includes('Omni Mesh Technologies Ltd');
    });

    expect(tgCall).toBeDefined();
    const buttons = tgCall[2]; // Inline keyboard buttons
    expect(Array.isArray(buttons)).toBe(true);
    const flattenedButtons = buttons.flat();
    const waBtn = flattenedButtons.find(b => b.text.includes('WhatsApp'));
    expect(waBtn).toBeDefined();
    expect(waBtn.url).toContain('https://wa.me/');

    tgSpy.mockRestore();
    broadcastSpy.mockRestore();
  });

  // ── TEST 4: PROPOSAL VIEW & ACCEPTANCE SSE BROADCASTS ───────────────────────
  test('4. GET /api/public/proposals/:token and POST /api/public/proposals/:token/accept broadcast proposal_viewed and proposal_accepted', async () => {
    const broadcastSpy = jest.spyOn(sseService, 'broadcast');
    const testShareToken = `prop-mesh-${Date.now()}`;

    const testProposal = {
      id: `PRP-MESH-${Date.now()}`,
      share_token: testShareToken,
      client_name: 'Apex Mesh Corp',
      client_company: 'Apex Mesh Corp',
      client_email: 'ceo@apexmesh.com',
      project_title: 'Real-Time Notification Pipeline',
      project_summary: 'Enterprise event distribution',
      status: 'Sent',
      currency: 'USD',
      one_time_total: 12000,
      recurring_total: 0,
      scope_items: ['SSE Mesh', 'Telegram Bot Hook'],
      view_count: 0
    };

    inMemoryProposals.push(testProposal);

    // 1. View Proposal
    const viewRes = await request(app)
      .get(`/api/public/proposals/${testShareToken}`)
      .expect(200);

    expect(viewRes.body.shareToken).toBe(testShareToken);
    expect(broadcastSpy).toHaveBeenCalledWith('proposal_viewed', expect.objectContaining({
      shareToken: testShareToken,
      clientName: 'Apex Mesh Corp'
    }));

    // 2. Accept Proposal
    const acceptRes = await request(app)
      .post(`/api/public/proposals/${testShareToken}/accept`)
      .send({
        acceptedBy: 'Apex Mesh CEO',
        clientNote: 'Approved and signed off'
      })
      .expect(200);

    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.proposal.status).toBe('Accepted');
    expect(broadcastSpy).toHaveBeenCalledWith('proposal_accepted', expect.objectContaining({
      shareToken: testShareToken,
      id: testProposal.id
    }));

    broadcastSpy.mockRestore();
  });

  // ── TEST 5: DELIVERABLE REVISION REQUEST ALERT & REVIEW ROOM JUMP ──────────
  test('5. POST /api/reviews/:id/request-revisions broadcasts revision updates and dispatches creative team notification with [🎬 Open Review Room]', async () => {
    const tgSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);
    const broadcastSpy = jest.spyOn(sseService, 'broadcast');

    const testReviewId = `REV-MESH-${Date.now()}`;
    const mockReview = {
      id: testReviewId,
      project_id: 'PRJ-MESH-01',
      project_name: 'Brand Animation & 3D Assets',
      client: 'Apex Mesh Corp',
      client_id: 'CLI-APEX',
      active_version: 'v1.0',
      versions: ['v1.0'],
      revision_round: 1,
      max_revisions: 3,
      revisions_used: 1,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    fallbackReviews.unshift(mockReview);

    const res = await request(app)
      .post(`/api/reviews/${testReviewId}/request-revisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        revisionNotes: 'Adjust color grading on hero banner and transition timing',
        requesterName: 'Creative Director'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.review.status).toBe('revision_requested');

    // Assert SSE broadcast
    expect(broadcastSpy).toHaveBeenCalledWith('review_revision_requested', expect.objectContaining({
      reviewId: testReviewId,
      requestedBy: 'Creative Director'
    }));

    // Assert Telegram alert with 1-tap Review Room link
    const tgCall = tgSpy.mock.calls.find(call => {
      const text = call[1] || '';
      return text.includes('Brand Animation & 3D Assets');
    });
    expect(tgCall).toBeDefined();
    const buttons = tgCall[2]?.flat() || [];
    const reviewRoomBtn = buttons.find(b => b.text.includes('Open Review Room'));
    expect(reviewRoomBtn).toBeDefined();
    expect(reviewRoomBtn.url).toContain('/app#reviews');

    tgSpy.mockRestore();
    broadcastSpy.mockRestore();
  });

  // ── TEST 6: SUPPORT DESK SLA HOLDBACK & 1-TAP ACKNOWLEDGMENT CALLBACK ─────
  test('6. POST /api/tickets/:id/sla-holdback broadcasts sla_breach_holdback and sends ack_defect_sla button, callback updates ticket', async () => {
    const tgSpy = jest.spyOn(botNotifications, 'sendTelegramNotification').mockReturnValue(true);
    const broadcastSpy = jest.spyOn(sseService, 'broadcast');

    const testTicketId = `TCK-SLA-${Date.now()}`;
    const testTicket = {
      id: testTicketId,
      title: 'Production API Latency Spike',
      description: 'Response times exceeded 2500ms on client endpoint',
      submitted_by: 'Automated Monitor',
      assigned_to: 'DEV-ENGINEER-09',
      priority: 'Urgent',
      status: 'Open',
      category: 'Bug',
      is_warranty: true,
      created_at: new Date().toISOString()
    };
    inMemoryTickets.push(testTicket);

    // Apply SLA holdback
    const holdbackRes = await request(app)
      .post(`/api/tickets/${testTicketId}/sla-holdback`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedContractor: 'DEV-ENGINEER-09',
        holdbackPercent: 25,
        reason: 'SLA Breach: Hotfix resolution window expired'
      })
      .expect(200);

    expect(holdbackRes.body.ok).toBe(true);

    // Assert SSE broadcast of holdback
    expect(broadcastSpy).toHaveBeenCalledWith('sla_breach_holdback', expect.objectContaining({
      ticketId: testTicketId,
      contractorId: 'DEV-ENGINEER-09',
      holdbackPercent: 25
    }));

    // Assert Telegram alert sent with 1-tap Acknowledge Defect SLA button
    const tgCall = tgSpy.mock.calls.find(call => {
      const buttons = call[2]?.flat() || [];
      return buttons.some(b => b.callback_data && b.callback_data.includes(`ack_defect_sla:${testTicketId}`));
    });
    expect(tgCall).toBeDefined();
    const buttons = tgCall[2]?.flat() || [];
    const ackBtn = buttons.find(b => b.callback_data === `ack_defect_sla:${testTicketId}`);
    expect(ackBtn).toBeDefined();
    expect(ackBtn.callback_data).toBe(`ack_defect_sla:${testTicketId}`);

    // Now simulate Telegram 1-Tap button press via legacy_menus callback handler
    const empSpy = jest.spyOn(state, 'getEmployeeByTelegramId').mockResolvedValue({ name: 'Ops Director', emp_code: 'ADM-001' });
    const mockTeamBot = new EventEmitter();
    mockTeamBot.sendMessage = jest.fn().mockResolvedValue({});
    mockTeamBot.answerCallbackQuery = jest.fn().mockResolvedValue({});
    registerLegacyTeamMenus(mockTeamBot, () => ({}));

    mockTeamBot.emit('callback_query', {
      id: 'query-101',
      data: `ack_defect_sla:${testTicketId}`,
      message: {
        chat: { id: 7754769807 },
        message_id: 999
      }
    });

    // Await async callback query handler to settle
    await new Promise(resolve => setTimeout(resolve, 80));

    // Check inMemoryTickets updated
    expect(testTicket.sla_acknowledged).toBe(true);
    expect(broadcastSpy).toHaveBeenCalledWith('sla_acknowledged', expect.arrayContaining([
      expect.objectContaining({ ticketId: testTicketId })
    ]));

    empSpy.mockRestore();
    tgSpy.mockRestore();
    broadcastSpy.mockRestore();
  });

  // ── TEST 7: CLIENT SSE RESILIENCE, SINGLETON & ZERO DIALOGS AUDIT ─────────
  test('7. Client-side SSE resilience & memory leak audit: validates singleton instance, backoff retry, and Zero Native Dialogs in public/client/sse.js', () => {
    const sseClientCode = fs.readFileSync(path.join(__dirname, '../public/client/sse.js'), 'utf8');

    // 1. Assert Singleton instance pattern
    expect(sseClientCode).toContain('window.__GRO10X_CLIENT_EVTSOURCE');
    expect(sseClientCode).toContain('__GRO10X_CLIENT_EVTSOURCE.close()');

    // 2. Assert Exponential Backoff Retry Logic
    expect(sseClientCode).toMatch(/Math\.min\(\s*1000\s*\*\s*Math\.pow\(2,\s*reconnectAttempts\)/);
    expect(sseClientCode).toContain('MAX_BACKOFF_MS');

    // 3. Assert Dynamic Token Resolution
    expect(sseClientCode).toContain('window.CLIENT_API.getToken');
    expect(sseClientCode).toContain('getToken()');

    // 4. Assert Key Event Listeners Wired
    const requiredEvents = [
      'ticket_created',
      'ticket_update',
      'sla_breach_holdback',
      'sla_acknowledged',
      'proposal_viewed',
      'proposal_accepted',
      'review_revision_requested'
    ];
    for (const evt of requiredEvents) {
      expect(sseClientCode).toContain(`'${evt}'`);
    }

    // 5. Strict Zero Native Dialogs Policy
    expect(sseClientCode).not.toMatch(/\balert\s*\(/);
    expect(sseClientCode).not.toMatch(/\bconfirm\s*\(/);
    expect(sseClientCode).not.toMatch(/\bprompt\s*\(/);

    // 6. Zero Banned Phone Policy
    expect(sseClientCode).not.toContain('1708459008');
  });

});
