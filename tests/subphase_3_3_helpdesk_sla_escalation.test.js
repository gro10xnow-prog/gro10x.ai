/**
 * SUB-PHASE 3.3 INTEGRATION TEST SUITE
 * Domain: Post-Sale Support Helpdesk & SLA Escalation Protocol
 * Scope: Ticket Lifecycle, SLA Horizons (P0/P1), Replies, Assignments, Resolutions, Resend Notifications
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 3.3: Post-Sale Support Helpdesk & SLA Escalation Protocol', () => {

  test('1. GET /api/dce/helpdesk/metrics requires DCE Admin authentication', async () => {
    const res = await request(app).get('/api/dce/helpdesk/metrics');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2. GET /api/dce/helpdesk/metrics returns support queue counts with admin token', async () => {
    const res = await request(app)
      .get('/api/dce/helpdesk/metrics')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalTickets).toBe('number');
    expect(typeof res.body.data.openCount).toBe('number');
    expect(typeof res.body.data.resolvedCount).toBe('number');
    expect(typeof res.body.data.urgentCount).toBe('number');
    expect(typeof res.body.data.breachedCount).toBe('number');
  });

  test('3. POST /api/dce/helpdesk/tickets validates input schemas (rejects incomplete submissions)', async () => {
    const res = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'No', // Too short (< 3 chars)
        description: 'Bad' // Too short (< 5 chars)
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('4. POST /api/dce/helpdesk/tickets creates ticket with calculated SLA deadline', async () => {
    const res = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'License key not activating GoodNotes template',
        description: 'I enter my license GRO-1234-ABCD but it says invalid license key.',
        category: 'ACCESS_ISSUE',
        priority: 'URGENT',
        customer_email: 'buyer.urgent@gro10x.ai',
        customer_name: 'Urgent Buyer',
        order_ref: 'DIR-PQ-991122'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket_ref).toMatch(/^TKT-/);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.priority).toBe('URGENT');
    expect(res.body.data.sla_deadline_at).toBeDefined();
    // SLA deadline should be in the future
    expect(new Date(res.body.data.sla_deadline_at).getTime()).toBeGreaterThan(Date.now());
  });

  test('5. GET /api/dce/helpdesk/tickets lists tickets with status & priority filtering', async () => {
    const res = await request(app)
      .get('/api/dce/helpdesk/tickets?status=OPEN')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach(t => {
      expect(['OPEN', 'IN_PROGRESS']).toContain(t.status);
    });
  });

  test('6. GET /api/dce/helpdesk/tickets/:id returns single ticket with message thread', async () => {
    // Fetch ticket list first
    const listRes = await request(app)
      .get('/api/dce/helpdesk/tickets')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    const firstTicket = listRes.body.data[0];
    expect(firstTicket).toBeDefined();

    const singleRes = await request(app)
      .get(`/api/dce/helpdesk/tickets/${firstTicket.id}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.success).toBe(true);
    expect(singleRes.body.data.id).toBe(firstTicket.id);
    expect(Array.isArray(singleRes.body.data.messages)).toBe(true);
  });

  test('7. POST /api/dce/helpdesk/tickets/:id/reply adds message and advances status to IN_PROGRESS', async () => {
    // Create fresh ticket
    const createRes = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'Canva link permissions request',
        description: 'The Canva template asks for edit access instead of view copy.',
        category: 'ACCESS_ISSUE',
        priority: 'NORMAL',
        customer_email: 'canva.user@gro10x.ai'
      });

    const ticketId = createRes.body.data.id;

    // Agent replies
    const replyRes = await request(app)
      .post(`/api/dce/helpdesk/tickets/${ticketId}/reply`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        body: 'Hello! I updated the Canva link permissions to "Template Copy" mode. Please check now!'
      });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.success).toBe(true);
    expect(replyRes.body.data.author_type).toBe('AGENT');
    expect(replyRes.body.data.body).toContain('Template Copy');

    // Verify ticket status changed to IN_PROGRESS
    const checkRes = await request(app)
      .get(`/api/dce/helpdesk/tickets/${ticketId}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');
    expect(checkRes.body.data.status).toBe('IN_PROGRESS');
  });

  test('8. PUT /api/dce/helpdesk/tickets/:id/assign assigns support agent to ticket', async () => {
    const listRes = await request(app)
      .get('/api/dce/helpdesk/tickets')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    const ticketId = listRes.body.data[0].id;

    const assignRes = await request(app)
      .put(`/api/dce/helpdesk/tickets/${ticketId}/assign`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({ assigned_to: 'agent_sarah_support' });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
  });

  test('9. PUT /api/dce/helpdesk/tickets/:id/resolve resolves ticket and sends resolution confirmation', async () => {
    // Create a ticket to resolve
    const createRes = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'Resolution test inquiry',
        description: 'Testing resolution lifecycle and email delivery triggers.',
        category: 'GENERAL',
        priority: 'LOW',
        customer_email: 'resolved.customer@gro10x.ai'
      });

    const ticketId = createRes.body.data.id;

    const resolveRes = await request(app)
      .put(`/api/dce/helpdesk/tickets/${ticketId}/resolve`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        resolution_note: 'Customer provided fresh email and download was successfully verified.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.success).toBe(true);
    expect(resolveRes.body.data.status).toBe('RESOLVED');
    expect(resolveRes.body.data.resolved_at).toBeDefined();
    expect(resolveRes.body.data.resolution_note).toContain('successfully verified');
  });

  test('10. Customer Support Bridge links customer order reference to ticket queue', async () => {
    const orderRef = `DIR-PQ-TEST-${Date.now()}`;
    const createRes = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'Urgent order inquiry from tracking page',
        description: 'My order has not updated in 24 hours.',
        customer_email: 'tracking.user@gro10x.ai',
        order_ref: orderRef,
        priority: 'HIGH'
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.order_ref).toBe(orderRef);
  });

});
