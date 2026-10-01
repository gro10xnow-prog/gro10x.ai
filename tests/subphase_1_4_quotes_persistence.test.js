/**
 * tests/subphase_1_4_quotes_persistence.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.4: Commercial Quotes Dual-Store Persistence & Conversion Engine
 * 
 * Tests:
 * 1. GET /api/invoices/quotes loads persisted quotes from store
 * 2. POST /api/invoices/quotes creates quote and persists to data/db.json
 * 3. PUT /api/invoices/quotes/:id updates quote fields and syncs persistence
 * 4. POST /api/invoices/quotes/:id/convert converts quote, generates invoice & dual-persists both
 * 5. deleteQuoteFromStore cleanly purges temporary test quote from persistent store
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const invoiceRoutes = require('../src/routes/invoices');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use(errorHandler);

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 1.4: Commercial Quotes Dual-Store Persistence & Conversion', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Finance Executive',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  let createdQuoteId = null;
  let convertedInvoiceId = null;
  const testClientName = `QA-Quotes-${Date.now()}`;

  test('1. GET /api/invoices/quotes loads persisted quotes from store with standard schema', async () => {
    const res = await request(app)
      .get('/api/invoices/quotes')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const q = res.body[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('clientName');
      expect(q).toHaveProperty('amount');
      expect(q).toHaveProperty('status');
    }
  });

  test('2. POST /api/invoices/quotes creates a new quotation and dual-persists to data/db.json', async () => {
    const payload = {
      clientName: testClientName,
      clientId: 'CLI-TEST-001',
      projectTitle: 'Autonomous Agentic Ops Sprint',
      amount: 85000,
      validDays: 14,
      items: [
        { description: 'Agentic Core Setup', qty: 1, amount: 50000 },
        { description: 'Telegram Human Escalation Relay', qty: 1, amount: 35000 }
      ],
      notes: 'Initial 50% retainer required on conversion.'
    };

    const res = await request(app)
      .post('/api/invoices/quotes')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.quote).toBeDefined();
    expect(res.body.quote.id).toMatch(/^QTE-2026-\d{3}$/);
    expect(res.body.quote.clientName).toBe(testClientName);
    expect(res.body.quote.amount).toBe(85000);
    expect(res.body.quote.status).toBe('Draft');

    createdQuoteId = res.body.quote.id;

    // Verify dual-persistence to data/db.json
    expect(fs.existsSync(DB_JSON_PATH)).toBe(true);
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(dbContent.quotes)).toBe(true);
    const foundInDb = dbContent.quotes.find(q => q.id === createdQuoteId);
    expect(foundInDb).toBeDefined();
    expect(foundInDb.client_name).toBe(testClientName);
    expect(foundInDb.amount).toBe(85000);
  });

  test('3. PUT /api/invoices/quotes/:id updates quote fields and syncs to store', async () => {
    expect(createdQuoteId).toBeDefined();

    const res = await request(app)
      .put(`/api/invoices/quotes/${createdQuoteId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        amount: 95000,
        notes: 'Revised scope: includes multi-rail finance setup'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quote.amount).toBe(95000);
    expect(res.body.quote.notes).toContain('multi-rail finance');

    // Verify update reflected in data/db.json
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const foundInDb = dbContent.quotes.find(q => q.id === createdQuoteId);
    expect(foundInDb).toBeDefined();
    expect(foundInDb.amount).toBe(95000);
  });

  test('4. POST /api/invoices/quotes/:id/convert converts quote into invoice & dual-persists both', async () => {
    expect(createdQuoteId).toBeDefined();

    const res = await request(app)
      .post(`/api/invoices/quotes/${createdQuoteId}/convert`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quote).toBeDefined();
    expect(res.body.quote.status).toBe('Converted');

    expect(res.body.invoice).toBeDefined();
    expect(res.body.invoice.id).toMatch(/^INV-2026-\d{3}$/);
    expect(res.body.invoice.clientName).toBe(testClientName);
    expect(res.body.invoice.amount).toBe(95000);
    expect(res.body.invoice.status).toBe('Draft');

    convertedInvoiceId = res.body.invoice.id;

    // Verify quote status in data/db.json
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const foundQuote = dbContent.quotes.find(q => q.id === createdQuoteId);
    expect(foundQuote).toBeDefined();
    expect(foundQuote.status).toBe('Converted');

    // Verify invoice presence in data/db.json
    expect(Array.isArray(dbContent.invoices)).toBe(true);
    const foundInvoice = dbContent.invoices.find(i => i.id === convertedInvoiceId);
    expect(foundInvoice).toBeDefined();
    expect(foundInvoice.client_name).toBe(testClientName);
    expect(foundInvoice.amount).toBe(95000);
  });

  test('5. deleteQuoteFromStore cleanly removes temporary test quote from persistent store', async () => {
    expect(createdQuoteId).toBeDefined();

    await invoiceRoutes.deleteQuoteFromStore(createdQuoteId);

    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const foundQuote = dbContent.quotes.find(q => q.id === createdQuoteId);
    expect(foundQuote).toBeUndefined();

    // Clean up created test invoice as well
    if (convertedInvoiceId) {
      await request(app)
        .delete(`/api/invoices/${convertedInvoiceId}`)
        .set('Authorization', `Bearer ${managerToken}`);
    }
  });
});
