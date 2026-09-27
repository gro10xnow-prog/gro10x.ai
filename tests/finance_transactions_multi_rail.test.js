/**
 * tests/finance_transactions_multi_rail.test.js
 * 
 * End-to-end integration test suite for Engine 2 Multi-Rail Finance & Invoicing Architecture:
 * - Multi-rail invoice models (deposit_upfront, milestone_delivery, monthly_retainer, change_order_addon)
 * - Statutory VAT calculation strictly on taxable base (Gross - Discount)
 * - Corporate Bank Wire payment submission & verification
 * - Automated commercial payment receipt issuance (REC-2026-XXX) with IP transfer certification
 * - Express routing shadowing regression prevention
 */

const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../src/routes/invoices');
const paymentRoutes = require('../src/routes/payments');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

describe('Engine 2 Finance & Multi-Rail Invoicing Architecture', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Finance Director',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'CLI-MTWK4BNC-24F6EA',
    name: 'H. M. Ifteker Mahmud',
    role: 'Managing Director',
    accessLevel: 'Client Partner',
    department: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-MTWK4BNC-24F6EA',
    company: 'Purplebot Digital'
  });

  let createdInvoiceId = null;
  let createdPaymentId = null;

  test('1. Quotes route is not shadowed by /:id parameterized route', async () => {
    const res = await request(app)
      .get('/api/invoices/quotes')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('2. Creates Engine 2 multi-rail invoice with statutory VAT on taxable base', async () => {
    const payload = {
      clientName: 'Purplebot Digital Limited',
      clientId: 'CLI-MTWK4BNC-24F6EA',
      projectName: 'AI Agency OS & Automated Retainer Infrastructure',
      engineTag: 'engine2',
      invoiceType: 'milestone_delivery',
      settlementRail: 'bdt_bank_wire',
      currency: 'BDT',
      items: [
        {
          description: 'AI Agency OS & Retainer Infrastructure Sprint 1',
          qty: 1,
          rate: 35000,
          amount: 35000
        }
      ],
      discount: 10000,
      taxRate: 5,
      notes: 'Neoncore Tech Solution · BRAC Bank Limited (Mohakhali Branch | Routing: 060263290)'
    };

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice).toBeDefined();

    const inv = res.body.invoice;
    createdInvoiceId = inv.id;

    // Verify statutory accounting breakdown
    expect(inv.subtotal).toBe(35000);
    expect(inv.discount).toBe(10000);
    expect(inv.taxableBase).toBe(25000); // 35k - 10k discount
    expect(inv.taxRate).toBe(5);
    expect(inv.vatAmount).toBe(1250); // 5% on 25k taxable base, NOT on 35k
    expect(inv.amount).toBe(26250); // 25k taxable base + 1,250 VAT
    expect(inv.invoiceType).toBe('milestone_delivery');
    expect(inv.settlementRail).toBe('bdt_bank_wire');
    expect(inv.status).toBe('Pending');
  });

  test('3. Fetches created invoice by ID with multi-rail metadata', async () => {
    expect(createdInvoiceId).toBeDefined();

    const res = await request(app)
      .get(`/api/invoices/${createdInvoiceId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createdInvoiceId);
    expect(res.body.clientName).toBe('Purplebot Digital Limited');
    expect(res.body.taxableBase).toBe(25000);
    expect(res.body.vatAmount).toBe(1250);
    expect(res.body.settlementRail).toBe('bdt_bank_wire');
  });

  test('4. Client submits Corporate Bank Wire payment slip', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        invoiceId: createdInvoiceId,
        clientId: 'CLI-MTWK4BNC-24F6EA',
        clientName: 'Purplebot Digital Limited',
        amount: 26250,
        paymentMethod: 'Corporate Bank Wire',
        trxId: 'BRAC-DEP-2026-99120',
        notes: 'Direct wire deposit to Neoncore Tech Solution BRAC Bank A/C: 2081636480001'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment).toBeDefined();
    expect(res.body.payment.payment_method).toBe('Corporate Bank Wire');
    expect(res.body.payment.verified).toBe(false);

    createdPaymentId = res.body.payment.id;

    // Verify invoice status updated to Verification Pending
    const invRes = await request(app).get(`/api/invoices/${createdInvoiceId}`);
    expect(invRes.body.status).toBe('Verification Pending');
  });

  test('5. Finance Director verifies payment and releases Commercial Receipt & IP clearance', async () => {
    expect(createdPaymentId).toBeDefined();

    const res = await request(app)
      .post(`/api/payments/${createdPaymentId}/verify`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.receiptId).toBeDefined();
    expect(res.body.receiptId).toMatch(/^REC-/);

    // Verify invoice is marked Paid with paidDate
    const invRes = await request(app).get(`/api/invoices/${createdInvoiceId}`);
    expect(invRes.body.status).toBe('Paid');
    expect(invRes.body.paidDate).toBeDefined();

    // Query official receipt endpoint
    const recRes = await request(app).get(`/api/invoices/${createdInvoiceId}/receipt`);
    expect(recRes.statusCode).toBe(200);
    expect(recRes.body.success).toBe(true);
    expect(recRes.body.receipt).toBeDefined();

    const receipt = recRes.body.receipt;
    expect(receipt.status).toBe('CLEARED');
    expect(receipt.amountCleared).toBe(26250);
    expect(receipt.ipTransferStatus).toBe('CERTIFIED_AND_RELEASED');
    expect(receipt.beneficiary).toBe('Neoncore Tech Solution');
    expect(receipt.bankName).toBe('BRAC Bank Limited');
    expect(receipt.accountNumber).toBe('2081636480001');
    expect(receipt.warrantyPeriod).toBe('30_DAYS_POST_DELIVERY');
  });

  test('6. Creates International USD Invoice routed to Stripe', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        clientName: 'Global Enterprise AI Client',
        projectName: 'Autonomous Agent Infrastructure Sprint',
        engineTag: 'engine2',
        invoiceType: 'deposit_upfront',
        currency: 'USD',
        amount: 2500,
        taxRate: 0, // Export service tax exemption
        discount: 0,
        settlementRail: 'usd_stripe'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice.currency).toBe('USD');
    expect(res.body.invoice.settlementRail).toBe('usd_stripe');
    expect(res.body.invoice.amount).toBe(2500);
  });
});
