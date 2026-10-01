const request = require('supertest');
const { signToken } = require('../src/services/jwt');
const app = require('../server');
const sse = require('../src/services/sse');
const resend = require('../src/services/resend');
const { parseMfsSms } = require('../src/utils/mfs-parser');
const { inMemoryInvoices } = require('../src/routes/invoices');
const { readDB, writeDB } = require('../src/services/db');

function createToken(payload) {
  return signToken(payload);
}

describe('Sub-Phase 5.2: Multi-Rail Payment UX & MFS Coverage Integration Tests', () => {
  const testClientId = 'CLI-PAY-502';
  const otherClientId = 'CLI-OTHER-502';
  const testInvoiceId = 'INV-502-TEST';
  const testPaymentId = 'PAY-502-TEST';

  const clientToken = createToken({
    id: testClientId,
    userId: testClientId,
    linkedId: testClientId,
    role: 'Client',
    linkedType: 'client',
    name: 'Apex Horizon Client'
  });

  const otherClientToken = createToken({
    id: otherClientId,
    userId: otherClientId,
    linkedId: otherClientId,
    role: 'Client',
    linkedType: 'client',
    name: 'Different Org Client'
  });

  const managerToken = createToken({
    id: 'USR-FINANCE-01',
    userId: 'USR-FINANCE-01',
    role: 'Admin',
    accessLevel: 'Finance Manager',
    name: 'Finance Controller'
  });

  let sseSpy;
  let receiptEmailSpy;

  beforeAll(async () => {
    // Seed in-memory / local test invoice and payment log
    const testInv = {
      id: testInvoiceId,
      clientId: testClientId,
      client_id: testClientId,
      clientName: 'Apex Horizon Client',
      client_name: 'Apex Horizon Client',
      projectName: 'Full-Stack Autonomous Engine Delivery',
      amount: 45000,
      currency: 'BDT',
      status: 'Verification Pending',
      dueDate: '2026-10-31',
      settlementRail: 'bdt_bank_wire'
    };

    inMemoryInvoices.unshift(testInv);

    const db = await readDB();
    if (!db.invoices) db.invoices = [];
    if (!db.payment_logs) db.payment_logs = [];
    if (!db.clients) db.clients = [];

    db.invoices = db.invoices.filter(i => i.id !== testInvoiceId);
    db.invoices.push(testInv);

    db.clients = db.clients.filter(c => c.id !== testClientId);
    db.clients.push({
      id: testClientId,
      name: 'Apex Horizon Client',
      email: 'finance@apexhorizon.com'
    });

    const testPayment = {
      id: testPaymentId,
      invoice_id: testInvoiceId,
      client_id: testClientId,
      client_name: 'Apex Horizon Client',
      amount: 45000,
      currency: 'BDT',
      payment_method: 'Nagad',
      trx_id: 'NAG-88990011',
      verified: false,
      notes: 'Customer submitted proof via portal',
      created_at: new Date().toISOString()
    };
    db.payment_logs = db.payment_logs.filter(p => p.id !== testPaymentId);
    db.payment_logs.push(testPayment);

    writeDB(db);
  });

  beforeEach(() => {
    sseSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
    receiptEmailSpy = jest.spyOn(resend, 'sendPaymentReceiptEmail').mockResolvedValue({ success: true, simulated: true });
  });

  afterEach(() => {
    sseSpy.mockRestore();
    receiptEmailSpy.mockRestore();
  });

  test('1. MFS parser accurately extracts bKash, Nagad, Rocket, and DBBL NexusPay notifications', () => {
    // 1.1 bKash SMS
    const bkashMsg = "You have received Tk 45,000.00 from 01712345678. Fee Tk 0.00. Balance Tk 95,000.00. TrxID BK98765432 at 16/09/2026 10:45. Ref INV-502";
    const bkashRes = parseMfsSms(bkashMsg, 'bKash');
    expect(bkashRes).not.toBeNull();
    expect(bkashRes.platform).toBe('BKASH');
    expect(bkashRes.amount).toBe(45000);
    expect(bkashRes.trx_id).toBe('BK98765432');
    expect(bkashRes.sender).toBe('01712345678');
    expect(bkashRes.reference).toBe('INV-502');

    // 1.2 Nagad SMS
    const nagadMsg = "Customer: 01898765432 Amount: Tk 32,500.00 TxnID: 71P9K2L4 Date: 16/09/2026 10:45 Balance: Tk 105,250.00 Ref: G10X";
    const nagadRes = parseMfsSms(nagadMsg, 'NAGAD');
    expect(nagadRes).not.toBeNull();
    expect(nagadRes.platform).toBe('NAGAD');
    expect(nagadRes.amount).toBe(32500);
    expect(nagadRes.trx_id).toBe('71P9K2L4');
    expect(nagadRes.sender).toBe('01898765432');

    // 1.3 Rocket SMS
    const rocketMsg = "Tk 12,000.00 received from 01911223344 to A/C 019... TxnId: RK77665544";
    const rocketRes = parseMfsSms(rocketMsg, 'ROCKET');
    expect(rocketRes).not.toBeNull();
    expect(rocketRes.platform).toBe('ROCKET');
    expect(rocketRes.amount).toBe(12000);
    expect(rocketRes.trx_id).toBe('RK77665544');

    // 1.4 DBBL NexusPay
    const nexusMsg = "DBBL NexusPay: Tk 25,000 received. TxnId: NX98765432";
    const nexusRes = parseMfsSms(nexusMsg, 'DBBL');
    expect(nexusRes).not.toBeNull();
    expect(nexusRes.platform).toBe('DBBL_NEXUS');
    expect(nexusRes.amount).toBe(25000);
    expect(nexusRes.trx_id).toBe('NX98765432');
  });

  test('2. GET /api/payments/status/:invoiceId provides real-time status & enforces tenant boundaries', async () => {
    // 2.1 Owner client can view status
    const res = await request(app)
      .get(`/api/payments/status/${testInvoiceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success || res.body.ok).toBe(true);
    expect(res.body.data.invoiceId).toBe(testInvoiceId);
    expect(res.body.data.status).toBe('Verification Pending');
    expect(res.body.data.amount).toBe(45000);
    expect(res.body.data.trxId).toBe('NAG-88990011');

    // 2.2 Foreign client gets 403 Forbidden
    const deniedRes = await request(app)
      .get(`/api/payments/status/${testInvoiceId}`)
      .set('Authorization', `Bearer ${otherClientToken}`);

    expect(deniedRes.status).toBe(403);
  });

  test('3. POST /api/payments/:id/verify approves payment, emits SSE, and dispatches receipt email', async () => {
    const res = await request(app)
      .post(`/api/payments/${testPaymentId}/verify`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.receiptId).toContain('REC-502-TEST');

    // Verify SSE broadcasts triggered
    expect(sseSpy).toHaveBeenCalledWith('payment_update', expect.anything());
    expect(sseSpy).toHaveBeenCalledWith('invoice_update', expect.anything());

    // Verify receipt email sent
    expect(receiptEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      invoiceId: testInvoiceId,
      amount: 45000
    }));

    // Re-check status endpoint to confirm it reflects 'Paid'
    const statusRes = await request(app)
      .get(`/api/payments/status/${testInvoiceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('Paid');
    expect(statusRes.body.data.verified).toBe(true);
  });
});
