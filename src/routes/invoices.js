const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');
const { processAutomationEvent } = require('../services/automation');

// GET Invoices (Client sees only their own invoices)
router.get('/invoices', requireAuth, (req, res) => {
  const db = readDB();
  let invoices = db.invoices || [];

  if (req.user.linkedType === 'client' && req.user.linkedId) {
    const clientNameLower = (req.user.name || '').toLowerCase();
    invoices = invoices.filter(i => i.clientId === req.user.linkedId || (i.clientName || '').toLowerCase().includes(clientNameLower));
  }

  res.json(invoices);
});

// POST Create Invoice
router.post('/invoices', requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  db.invoices = db.invoices || [];
  const count = db.invoices.length + 1;

  const newInvoice = {
    id: `INV-2026-${String(count).padStart(3, '0')}`,
    clientId: req.body.clientId || 'CLI-0001',
    clientName: req.body.clientName || 'General Client',
    date: req.body.date || new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    amount: Number(req.body.amount) || 0,
    taxRate: Number(req.body.taxRate) || 15,
    discount: Number(req.body.discount) || 0,
    status: req.body.status || 'Pending',
    items: req.body.items || [],
    createdAt: new Date().toISOString()
  };

  db.invoices.push(newInvoice);
  writeDB(db);
  broadcast('invoice_update', db.invoices);

  res.json({ success: true, invoice: newInvoice });
});

// PUT Update Invoice / Mark Paid
router.put('/invoices/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.invoices || []).findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

  const oldStatus = db.invoices[idx].status;
  const updated = { ...db.invoices[idx], ...req.body };
  db.invoices[idx] = updated;

  if (updated.status === 'Paid' && oldStatus !== 'Paid') {
    updated.paidDate = new Date().toISOString().split('T')[0];
    processAutomationEvent('invoice_paid', { invoice: updated }, db, writeDB, broadcast);
  }

  writeDB(db);
  broadcast('invoice_update', db.invoices);

  res.json({ success: true, invoice: db.invoices[idx] });
});

// QUOTATIONS API
router.get('/quotes', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.quotes || []);
});

router.post('/quotes', requireAuth, (req, res) => {
  const db = readDB();
  db.quotes = db.quotes || [];
  const count = db.quotes.length + 1;

  const newQuote = {
    id: `QTE-2026-${String(count).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    ...req.body
  };

  db.quotes.push(newQuote);
  writeDB(db);
  broadcast('quote_update', db.quotes);

  res.json({ success: true, quote: newQuote });
});

router.put('/quotes/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.quotes || []).findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Quotation not found' });

  db.quotes[idx] = { ...db.quotes[idx], ...req.body };
  writeDB(db);
  broadcast('quote_update', db.quotes);

  res.json({ success: true, quote: db.quotes[idx] });
});

router.post('/quotes/:id/convert', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const quote = (db.quotes || []).find(q => q.id === id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });

  quote.status = 'Converted';

  db.clients = db.clients || [];
  const clientObj = db.clients.find(c => c.name.toLowerCase().trim() === (quote.clientName || '').toLowerCase().trim());
  const clientId = clientObj ? clientObj.id : (db.clients[0]?.id || 'CLI-0001');

  db.invoices = db.invoices || [];
  const invCount = db.invoices.length + 1;
  const newInvoice = {
    id: `INV-2026-${String(invCount).padStart(3, '0')}`,
    clientId: clientId,
    clientName: quote.clientName,
    date: new Date().toISOString().split('T')[0],
    dueDate: quote.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    amount: Number(quote.amount) || 0,
    taxRate: Number(quote.taxRate) || 15,
    discount: Number(quote.discount) || 0,
    status: 'Draft',
    items: quote.items || [
      { description: `Proposal Services for ${quote.clientName}`, qty: 1, rate: Number(quote.amount) || 0 }
    ],
    notes: quote.terms || ''
  };

  db.invoices.push(newInvoice);
  writeDB(db);

  broadcast('quote_update', db.quotes);
  broadcast('invoice_update', db.invoices);

  res.json({ success: true, invoice: newInvoice, quote });
});

module.exports = router;
