/**
 * tests/subphase_4_1_creator_settlements.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.1: Vendor & Creator Settlement Clearinghouse Test Suite
 * 
 * Verifies:
 * 1. GET /api/dce/settlements/batches requires DCE Admin authentication
 * 2. GET /api/dce/settlements/batches returns paginated list of settlement runs
 * 3. POST /api/dce/settlements/batches validates required period dates
 * 4. POST /api/dce/settlements/batches creates draft settlement batch
 * 5. POST /api/dce/settlements/batches/:id/calculate calculates Gross GMV, fees, & net yield
 * 6. Calculation idempotency guard protects approved batches from recalculation
 * 7. PUT /api/dce/settlements/batches/:id/approve authorizes batch for disbursement
 * 8. PUT /api/dce/settlements/items/:id/pay records transaction reference and marks item PAID
 * 9. GET /api/dce/settlements/batches/:id/export/csv exports itemized settlement CSV
 * 10. Telegram Bot 1-Tap Settlement Approval callback flow executes cleanly
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 4.1: Vendor & Creator Settlement Clearinghouse', () => {
  let createdBatchId = null;
  let batchItemId = null;
  const testBatchRef = `SETTLE-TEST-${Date.now()}`;

  test('1. GET /api/dce/settlements/batches requires DCE Admin authentication', async () => {
    const res = await request(app).get('/api/dce/settlements/batches');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2. GET /api/dce/settlements/batches returns paginated list of settlement runs', async () => {
    const res = await request(app)
      .get('/api/dce/settlements/batches')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  test('3. POST /api/dce/settlements/batches validates required period dates', async () => {
    const res = await request(app)
      .post('/api/dce/settlements/batches')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({ notes: 'Invalid batch missing periods' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('4. POST /api/dce/settlements/batches creates draft settlement batch', async () => {
    const res = await request(app)
      .post('/api/dce/settlements/batches')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        batch_ref: testBatchRef,
        period_start: '2026-10-01T00:00:00.000Z',
        period_end: '2026-10-31T23:59:59.000Z',
        notes: 'October 2026 automated settlement run for PlannerQueen & 3D Lab'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('DRAFT');
    createdBatchId = res.body.data.id;
  });

  test('5. POST /api/dce/settlements/batches/:id/calculate calculates Gross GMV, fees, & net yield', async () => {
    const res = await request(app)
      .post(`/api/dce/settlements/batches/${createdBatchId}/calculate`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CALCULATED');
    expect(res.body.data).toHaveProperty('total_gross');
    expect(res.body.data).toHaveProperty('total_fees');
    expect(res.body.data).toHaveProperty('total_net');
    expect(res.body.data).toHaveProperty('total_payable');

    // Retrieve items to capture an item ID for payout test
    const getRes = await request(app)
      .get(`/api/dce/settlements/batches/${createdBatchId}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(getRes.status).toBe(200);
    if (getRes.body.data.items && getRes.body.data.items.length > 0) {
      batchItemId = getRes.body.data.items[0].id;
    }
  });

  test('6. PUT /api/dce/settlements/batches/:id/approve authorizes batch for disbursement', async () => {
    const res = await request(app)
      .put(`/api/dce/settlements/batches/${createdBatchId}/approve`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({ approved_by: 'QA Finance Lead' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.approved_by).toBe('QA Finance Lead');
  });

  test('7. Calculation idempotency guard protects approved batches from recalculation', async () => {
    const res = await request(app)
      .post(`/api/dce/settlements/batches/${createdBatchId}/calculate`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Cannot recalculate');
  });

  test('8. PUT /api/dce/settlements/items/:id/pay records transaction reference and marks item PAID', async () => {
    const targetItemId = batchItemId || 'item-01';
    const res = await request(app)
      .put(`/api/dce/settlements/items/${targetItemId}/pay`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        payment_ref: `TRX-${Date.now()}`,
        payment_note: 'Disbursed via automated bank transfer'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PAID');
    expect(res.body.data).toHaveProperty('payment_ref');
  });

  test('9. GET /api/dce/settlements/batches/:id/export/csv exports itemized settlement CSV', async () => {
    const res = await request(app)
      .get(`/api/dce/settlements/batches/${createdBatchId}/export/csv`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Batch Ref');
    expect(res.text).toContain('Recipient');
    expect(res.text).toContain('Net Payable');
  });

  test('10. Telegram Bot 1-Tap Settlement Approval callback flow executes cleanly', async () => {
    const { handleDCEOpsCallback } = require('../src/services/bot/handlers/dce-ops');
    
    let sentMessage = null;
    const mockTeamBot = {
      sendMessage: jest.fn(async (chatId, text, opts) => {
        sentMessage = { chatId, text, opts };
        return { message_id: 999 };
      })
    };

    const mockQuery = {
      id: 'query-123',
      chatId: 100200300,
      data: `dce_approve_batch:${createdBatchId}`,
      message: { chat: { id: 100200300 } }
    };

    await handleDCEOpsCallback(mockTeamBot, mockQuery);

    expect(mockTeamBot.sendMessage).toHaveBeenCalled();
    expect(sentMessage.text).toContain('SETTLEMENT BATCH APPROVED');
    expect(sentMessage.text).toContain(createdBatchId);
  });
});
