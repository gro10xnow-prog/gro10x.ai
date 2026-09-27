const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Use memory storage — files uploaded directly to Supabase Storage, avoiding ephemeral disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not permitted for payment proof`));
    }
  }
});


const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast, broadcastToClient } = require('../services/sse');
const { sendInvoiceEmail } = require('../services/resend');

function mapInvoice(i) {
  if (!i) return null;
  const issueDate = i.issue_date || i.date || (i.created_at ? i.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const rawItems = Array.isArray(i.items) ? i.items : (typeof i.items === 'string' ? JSON.parse(i.items || '[]') : []);
  const amount = Number(i.amount) || 0;
  const discount = Number(i.discount) || 0;
  const taxRate = Number(i.tax_rate !== undefined ? i.tax_rate : (i.taxRate !== undefined ? i.taxRate : 5));
  const subtotal = rawItems.reduce((acc, it) => acc + (Number(it.amount) || (Number(it.rate || 0) * Number(it.qty || 1))), 0) || amount;
  const taxableBase = Math.max(0, subtotal - discount);
  const vatAmount = Math.round(taxableBase * (taxRate / 100));

  return {
    id: i.id,
    clientId: i.client_id || i.clientId || null,
    clientName: i.client_name || i.clientName || i.client || 'Agency Client',
    projectName: i.project_name || i.projectName || 'General Services',
    projectRef: i.project_ref || i.projectRef || null,
    engineTag: i.engine_tag || i.engineTag || 'engine2',
    invoiceType: i.invoice_type || i.invoiceType || (typeof i.notes === 'string' && i.notes.match(/\[type:([a-z_]+)\]/)?.[1]) || 'deposit_upfront',
    settlementRail: i.settlement_rail || i.settlementRail || (typeof i.notes === 'string' && i.notes.match(/\[rail:([a-z_]+)\]/)?.[1]) || (i.currency === 'USD' ? 'usd_stripe' : 'bdt_bank_wire'),
    currency: i.currency || 'BDT',
    date: issueDate,
    issueDate: issueDate,
    dueDate: i.due_date || i.dueDate || null,
    paidDate: i.paid_date || i.paidDate || (i.paid_at ? i.paid_at.split('T')[0] : null),
    amount: amount,
    subtotal: subtotal,
    taxRate: taxRate,
    discount: discount,
    taxableBase: taxableBase,
    vatAmount: vatAmount,
    status: i.status || 'Pending',
    items: rawItems,
    notes: i.notes || '',
    affiliateId: i.affiliate_id || i.affiliateId || null,
    refCode: i.ref_code || i.refCode || null,
    createdAt: i.created_at || i.createdAt || new Date().toISOString(),
    updatedAt: i.updated_at || i.updatedAt || null
  };
}

function mapQuote(q) {
  if (!q) return null;
  const items = q.line_items || q.items || [];
  const issueDate = q.issue_date || q.date || (q.created_at ? q.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  return {
    id: q.id,
    clientId: q.client_id || q.clientId || null,
    clientName: q.client_name || q.clientName || 'General Client',
    projectTitle: q.project_title || q.projectTitle || q.description || 'Client Proposal',
    scope: q.scope || '',
    amount: Number(q.amount) || 0,
    currency: q.currency || 'BDT',
    status: q.status || 'Draft',
    date: issueDate,
    issueDate: issueDate,
    validUntil: q.valid_until || q.validUntil || null,
    items: Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items || '[]') : []),
    line_items: Array.isArray(items) ? items : [],
    notes: q.notes || q.terms || '',
    terms: q.terms || q.notes || '',
    createdAt: q.created_at || q.createdAt || new Date().toISOString(),
    updatedAt: q.updated_at || q.updatedAt || null
  };
}

const DEFAULT_INVOICES = [];
const DEFAULT_QUOTES = [];

let inMemoryInvoices = [...DEFAULT_INVOICES];
let inMemoryQuotes = [...DEFAULT_QUOTES];

// GET Invoices
router.get('/', requireAuth, async (req, res) => {
  if (req.user?.role === 'Subcontractor' || req.user?.linkedType === 'contractor') {
    return res.status(403).json({ ok: false, error: 'Forbidden: Subcontractors are not authorized to view commercial invoices' });
  }

  const roleLower = (req.user.role || '').toLowerCase();
  const linkedTypeLower = (req.user.linkedType || '').toLowerCase();
  const accessLower = (req.user.accessLevel || '').toLowerCase();
  const isClientUser = roleLower.includes('client') || linkedTypeLower === 'client' || accessLower.includes('client');
  const clientName = (req.user.profile?.name || req.user.name || '').toLowerCase();
  const clientId = req.user.linkedId || req.user.id;

  function getFilteredFallback() {
    let list = inMemoryInvoices;
    if (isClientUser) {
      list = list.filter(i => (i.client_id && i.client_id === clientId) || ((i.client_name || i.clientName || '').toLowerCase().includes(clientName)));
    }
    return list.map(mapInvoice);
  }

  try {
    let invoices = [];
    if (supabase) {
      try {
        let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

        if (isClientUser && clientName) {
          query = query.or(`client_id.eq.${clientId},client_name.ilike.%${clientName}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          invoices = data.map(mapInvoice);
          if (data.length > 0 && !isClientUser) {
            inMemoryInvoices = data;
          }
        } else if (error) {
          console.warn('[Invoices GET] Supabase query note:', error.message);
        }
      } catch (e) {
        console.warn('[Invoices GET] Supabase query exception:', e.message);
      }
    }

    if (invoices.length === 0 && inMemoryInvoices.length > 0) {
      invoices = getFilteredFallback();
    }

    return res.json(invoices);
  } catch (err) {
    console.error('Invoices GET error:', err.message);
    return res.json(getFilteredFallback());
  }
});

// ==========================================
// QUOTATIONS API (Declared before /:id)
// ==========================================
router.get('/quotes', requireAuth, requireManager, async (req, res) => {
  try {
    let quotes = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          quotes = data.map(mapQuote);
          if (data.length > 0) inMemoryQuotes = data;
        } else if (error) {
          console.warn('[Quotes GET] Supabase query note:', error.message);
        }
      } catch (e) {
        console.warn('[Quotes GET] Supabase query exception:', e.message);
      }
    }

    if (quotes.length === 0) {
      quotes = inMemoryQuotes.map(mapQuote);
    }

    return res.json(quotes);
  } catch (err) {
    console.error('Quotes GET error:', err.message);
    return res.json(inMemoryQuotes.map(mapQuote));
  }
});

router.post('/quotes', requireAuth, requireManager, async (req, res) => {
  try {
    let nextNum = 1;
    if (supabase) {
      try {
        const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
        if (typeof count === 'number') nextNum = count + 1;
      } catch (e) {}
    }
    if (inMemoryQuotes.length >= nextNum) nextNum = inMemoryQuotes.length + 1;
    const newId = `QTE-2026-${String(nextNum).padStart(3, '0')}`;

    const validDays = Number(req.body.validDays) || 14;
    const validUntil = req.body.validUntil || new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];
    const items = req.body.items || req.body.line_items || [];

    const payload = {
      id: newId,
      client_id: req.body.clientId || req.body.client_id || null,
      client_name: req.body.clientName || req.body.client_name || 'Client Proposal',
      project_title: req.body.projectTitle || req.body.project_title || (items[0] && items[0].description) || 'Growth Retainer',
      scope: req.body.scope || '',
      amount: Number(req.body.amount) || 0,
      currency: 'BDT',
      status: 'Draft',
      valid_until: validUntil,
      line_items: items,
      notes: req.body.terms || req.body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: qData, error: qInsErr } = await supabase.from('quotes').insert([payload]).select();
      if (qInsErr) {
        console.error('[Quotes API] Supabase insert error:', qInsErr.message);
        return res.status(500).json({ error: `Database insert failed: ${qInsErr.message}` });
      }
      if (qData && qData[0]) Object.assign(payload, qData[0]);
    }

    inMemoryQuotes.unshift(payload);
    const quote = mapQuote(payload);

    try { broadcast('quote_update', inMemoryQuotes.map(mapQuote)); } catch (e) {}
    return res.status(201).json({ success: true, quote });
  } catch (err) {
    console.error('Quote POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.put('/quotes/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };
    if (req.body.status) updates.status = req.body.status;
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
    if (req.body.projectTitle || req.body.project_title) updates.project_title = req.body.projectTitle || req.body.project_title;
    if (req.body.validUntil || req.body.valid_until) updates.valid_until = req.body.validUntil || req.body.valid_until;
    if (req.body.notes || req.body.terms) updates.notes = req.body.notes || req.body.terms;

    const memIdx = inMemoryQuotes.findIndex(q => q.id === id);
    if (memIdx !== -1) {
      inMemoryQuotes[memIdx] = { ...inMemoryQuotes[memIdx], ...updates };
    }
    let updatedQuote = inMemoryQuotes[memIdx] || { id, ...updates };

    if (supabase) {
      const { data: qUpdData, error: qUpdErr } = await supabase.from('quotes').update(updates).eq('id', id).select();
      if (qUpdErr) {
        console.warn('[Quotes API] Supabase update note:', qUpdErr.message);
      } else if (qUpdData && qUpdData[0]) {
        updatedQuote = qUpdData[0];
        if (memIdx !== -1) inMemoryQuotes[memIdx] = updatedQuote;
      }
    }

    const quote = mapQuote(updatedQuote);
    try { broadcast('quote_update', inMemoryQuotes.map(mapQuote)); } catch (e) {}
    return res.json({ success: true, quote });
  } catch (err) {
    console.error('Quote PUT error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/quotes/:id/convert', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    let quoteData = inMemoryQuotes.find(q => q.id === id);

    if (!quoteData && supabase) {
      const { data } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle();
      if (data) quoteData = data;
    }

    if (!quoteData) return res.status(404).json({ error: 'Quotation not found' });

    let nextNum = inMemoryInvoices.length + 1;
    if (supabase) {
      try {
        const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
        if (typeof count === 'number') nextNum = Math.max(nextNum, count + 1);
      } catch(e) {}
    }

    const items = quoteData.line_items || quoteData.items || [{ description: `Proposal Services: ${quoteData.project_title || quoteData.client_name}`, qty: 1, amount: Number(quoteData.amount) || 0 }];

    const newInvoice = {
      id: `INV-2026-${String(nextNum).padStart(3, '0')}`,
      client_id: quoteData.client_id || quoteData.clientId || null,
      client_name: quoteData.client_name,
      project_name: quoteData.project_title || 'Client Proposal Services',
      amount: Number(quoteData.amount) || 0,
      currency: 'BDT',
      tax_rate: 15,
      discount: 0,
      status: 'Draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: quoteData.valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: items,
      notes: quoteData.notes || '',
      engine_tag: 'engine2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('quotes').update({ status: 'Converted', updated_at: new Date().toISOString() }).eq('id', id);
      const { error: insErr } = await supabase.from('invoices').insert([newInvoice]);
      if (insErr) {
        console.error('[Quotes Convert] Supabase insert error:', insErr.message);
        return res.status(500).json({ error: `Invoice creation failed: ${insErr.message}` });
      }
    }

    const quoteIdx = inMemoryQuotes.findIndex(q => q.id === id);
    if (quoteIdx !== -1) inMemoryQuotes[quoteIdx].status = 'Converted';
    inMemoryInvoices.unshift(newInvoice);

    const invoice = mapInvoice(newInvoice);
    const quote = mapQuote({ ...quoteData, status: 'Converted' });

    try {
      broadcast('quote_update', inMemoryQuotes.map(mapQuote));
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
      if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
    } catch (e) {}

    return res.json({ success: true, invoice, quote });
  } catch (err) {
    console.error('Quote Convert error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET Single Invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let inv = null;
    if (supabase) {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (!error && data) inv = data;
    }
    if (!inv) {
      inv = inMemoryInvoices.find(i => i.id === id);
    }
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    return res.json(mapInvoice(inv));
  } catch (err) {
    console.error('Invoice GET by ID error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /:id/receipt — Official Commercial Tax Payment Receipt & IP Clearance
router.get('/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;
    let inv = null;
    if (supabase) {
      const { data } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (data) inv = data;
    }
    if (!inv) inv = inMemoryInvoices.find(i => i.id === id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const isPaid = inv.status === 'Paid';
    const isPending = inv.status === 'Verification Pending';
    const mapped = mapInvoice(inv);

    const receiptId = `REC-${mapped.id.replace('INV-', '')}`;
    const receiptDate = mapped.paidDate || new Date().toISOString().split('T')[0];

    const receipt = {
      receiptNumber: receiptId,
      invoiceId: mapped.id,
      clientName: mapped.clientName,
      clientId: mapped.clientId,
      projectName: mapped.projectName,
      amountCleared: mapped.amount,
      currency: mapped.currency,
      taxableBase: mapped.taxableBase,
      vatAmount: mapped.vatAmount,
      discount: mapped.discount,
      status: isPaid ? 'CLEARED' : isPending ? 'VERIFICATION_PENDING' : 'PENDING_SETTLEMENT',
      settlementRail: mapped.settlementRail,
      beneficiary: 'Neoncore Tech Solution',
      bankName: 'BRAC Bank Limited',
      accountNumber: '2081636480001',
      branch: 'Mohakhali Branch | Routing: 060263290',
      clearedAt: mapped.paidDate || (isPaid ? receiptDate : null),
      ipTransferStatus: isPaid ? 'CERTIFIED_AND_RELEASED' : 'PENDING_CLEARANCE',
      warrantyPeriod: '30_DAYS_POST_DELIVERY',
      issuer: 'GRO10X Finance & Operations Division',
      verificationSeal: isPaid ? 'GRO10X-VERIFIED-OFFICIAL' : null
    };

    return res.json({ success: true, receipt });
  } catch (err) {
    console.error('Invoice GET receipt error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST Create Invoice
async function createInvoiceRecord(inputData = {}) {
  let candidateNum = 1;
  if (supabase) {
    try {
      const { data } = await supabase.from('invoices').select('id').order('created_at', { ascending: false }).limit(30);
      if (data && data.length > 0) {
        const maxNum = data.reduce((max, row) => {
          const m = (row.id || '').match(/INV-2026-(\d+)/);
          return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0);
        candidateNum = maxNum + 1;
      }
    } catch (e) {}
  }
  candidateNum = Math.max(candidateNum, inMemoryInvoices.length + 1);
  let newId = inputData.id || `INV-2026-${String(candidateNum).padStart(3, '0')}`;
  while (inMemoryInvoices.some(i => i.id === newId)) {
    candidateNum++;
    newId = `INV-2026-${String(candidateNum).padStart(3, '0')}`;
  }

  const issueDate = inputData.issueDate || inputData.date || inputData.issue_date || new Date().toISOString().split('T')[0];
  const dueDate = inputData.dueDate || inputData.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const rawAmount = Number(inputData.amount) || 0;
  const taxRate = Number(inputData.taxRate !== undefined ? inputData.taxRate : (inputData.tax_rate !== undefined ? inputData.tax_rate : 5));
  const discount = Number(inputData.discount) || 0;
  const status = inputData.status || 'Pending';
  const clientName = inputData.clientName || inputData.client_name || 'General Client';
  const clientId = inputData.clientId || inputData.client_id || null;
  const projectName = inputData.projectName || inputData.project_name || 'Client Retainer / Services';
  const projectRef = inputData.projectRef || inputData.project_ref || null;
  const engineTag = inputData.engineTag || inputData.engine_tag || 'engine2';
  const currency = inputData.currency || 'BDT';
  const invoiceType = inputData.invoiceType || inputData.invoice_type || 'deposit_upfront';
  const settlementRail = inputData.settlementRail || inputData.settlement_rail || (currency === 'USD' ? 'usd_stripe' : 'bdt_bank_wire');
  const items = Array.isArray(inputData.items) ? inputData.items : (inputData.items ? [inputData.items] : [{ description: projectName, amount: rawAmount }]);
  const notes = inputData.notes || '';
  const affiliateId = inputData.affiliateId || inputData.affiliate_id || inputData.refCode || inputData.ref_code || null;
  const refCode = inputData.refCode || inputData.ref_code || affiliateId;

  // Statutory calculation: Taxable Base = Gross - Discount, VAT = Taxable Base * (Rate / 100)
  const grossSubtotal = items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.rate || 0) * Number(item.qty || 1)) || 0), 0) || rawAmount;
  const taxableBase = Math.max(0, grossSubtotal - discount);
  const vatAmount = Math.round(taxableBase * (taxRate / 100));
  const finalAmount = rawAmount > 0 ? rawAmount : (taxableBase + vatAmount);

  const payload = {
    id: newId,
    client_id: clientId,
    client_name: clientName,
    project_name: projectName,
    project_ref: projectRef,
    amount: finalAmount,
    subtotal: grossSubtotal,
    currency: currency,
    status: status,
    issue_date: issueDate,
    due_date: dueDate,
    items: items,
    notes: notes,
    tax_rate: taxRate,
    discount: discount,
    engine_tag: engineTag,
    invoice_type: invoiceType,
    settlement_rail: settlementRail,
    affiliate_id: affiliateId,
    ref_code: refCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    const dbPayload = {
      id: newId,
      client_id: clientId,
      client_name: clientName,
      project_name: projectName,
      project_ref: projectRef,
      amount: finalAmount,
      currency: currency,
      status: status,
      issue_date: issueDate,
      due_date: dueDate,
      items: items,
      notes: (notes || '') + ` [type:${invoiceType}][rail:${settlementRail}]`,
      tax_rate: taxRate,
      discount: discount,
      engine_tag: engineTag,
      affiliate_id: affiliateId,
      ref_code: refCode,
      created_at: payload.created_at,
      updated_at: payload.updated_at
    };

    let { data: insertedData, error: insErr } = await supabase.from('invoices').insert([dbPayload]).select();
    if (insErr && insErr.code === '23503' && dbPayload.client_id) {
      dbPayload.client_id = null;
      const retry = await supabase.from('invoices').insert([dbPayload]).select();
      insertedData = retry.data;
      insErr = retry.error;
    }
    if (insErr && insErr.code === '23505') {
      dbPayload.id = `INV-2026-${Date.now().toString().slice(-4)}`;
      payload.id = dbPayload.id;
      const retry = await supabase.from('invoices').insert([dbPayload]).select();
      insertedData = retry.data;
      insErr = retry.error;
    }
    if (insErr && (insErr.message?.includes('affiliate_id') || insErr.message?.includes('schema cache'))) {
      delete dbPayload.affiliate_id;
      delete dbPayload.ref_code;
      const retry = await supabase.from('invoices').insert([dbPayload]).select();
      insertedData = retry.data;
      insErr = retry.error;
    }
    if (insErr) {
      console.warn('[Invoices API] Supabase insert warning, using in-memory store:', insErr.message);
    } else if (insertedData && insertedData[0]) {
      Object.assign(payload, insertedData[0]);
    }
  }

  inMemoryInvoices.unshift(payload);
  const invoice = mapInvoice(payload);

  try {
    broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
    if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
  } catch (e) {}

  return invoice;
}

router.post('/', requireAuth, requireManager, async (req, res) => {
  try {
    const clientId = req.body.clientId || req.body.client_id || (req.user?.linkedType === 'client' ? req.user.linkedId : null);
    const invoice = await createInvoiceRecord({ ...req.body, clientId });
    return res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice POST error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT Update Invoice / Mark Paid
router.put('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
    if (req.body.dueDate || req.body.due_date) updates.due_date = req.body.dueDate || req.body.due_date;
    if (req.body.projectName !== undefined || req.body.project_name !== undefined) updates.project_name = req.body.projectName || req.body.project_name;
    if (req.body.items !== undefined) updates.items = req.body.items;
    if (req.body.taxRate !== undefined || req.body.tax_rate !== undefined) updates.tax_rate = Number(req.body.taxRate !== undefined ? req.body.taxRate : req.body.tax_rate);
    if (req.body.discount !== undefined) updates.discount = Number(req.body.discount);
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.engineTag || req.body.engine_tag) updates.engine_tag = req.body.engineTag || req.body.engine_tag;
    if (req.body.invoiceType || req.body.invoice_type) updates.invoice_type = req.body.invoiceType || req.body.invoice_type;
    if (req.body.settlementRail || req.body.settlement_rail) updates.settlement_rail = req.body.settlementRail || req.body.settlement_rail;
    if (req.body.status === 'Paid') {
      updates.paid_date = new Date().toISOString().split('T')[0];
      updates.paid_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    const memIdx = inMemoryInvoices.findIndex(i => i.id === id);
    if (memIdx !== -1) {
      inMemoryInvoices[memIdx] = { ...inMemoryInvoices[memIdx], ...updates };
    }
    let updatedRecord = inMemoryInvoices[memIdx] || { id, ...updates };

    if (supabase) {
      const { data: dbData, error: updErr } = await supabase.from('invoices').update(updates).eq('id', id).select();
      if (updErr) {
        console.warn('[Invoices API] Supabase update note:', updErr.message);
      } else if (dbData && dbData[0]) {
        const prevMem = memIdx !== -1 ? inMemoryInvoices[memIdx] : {};
        updatedRecord = { ...prevMem, ...dbData[0] };
        if (prevMem.affiliateId && !updatedRecord.affiliateId && !updatedRecord.affiliate_id) {
          updatedRecord.affiliateId = prevMem.affiliateId;
        }
        if (prevMem.refCode && !updatedRecord.refCode && !updatedRecord.ref_code) {
          updatedRecord.refCode = prevMem.refCode;
        }
        if (memIdx !== -1) inMemoryInvoices[memIdx] = updatedRecord;
      }
    }

    const invoice = mapInvoice(updatedRecord);

    try {
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
      if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
    } catch (e) {}

    if (req.body.status === 'Paid') {
      try {
        broadcast('payment_update', { invoiceId: id, status: 'Paid', amount: invoice.amount });
      } catch (e) {}
      try {
        broadcast('commission_disbursed', {
          invoiceId: id,
          projectRef: invoice.projectRef || invoice.project_ref,
          status: 'Disbursed',
          timestamp: new Date().toISOString()
        });
      } catch (e) {}
      try {
        const { processAutomationEvent } = require('../services/automation');
        processAutomationEvent('invoice_paid', { invoice }, { clients: [], team: [] }, () => {}, broadcast).catch(() => {});
      } catch (e) {}

      // Partner & Affiliate Commission Accrual on Paid Invoices
      try {
        const pRef = invoice.projectRef || invoice.project_ref;
        const { findProject } = require('../services/post-delivery');
        let linkedProject = pRef ? await findProject(pRef) : null;
        let linkedProposal = null;
        if (pRef) {
          try {
            const { inMemoryProposals } = require('./proposals');
            if (Array.isArray(inMemoryProposals)) {
              linkedProposal = inMemoryProposals.find(p => p.id === pRef);
            }
          } catch (_) {}
        }
        const affRef = invoice.affiliateId || invoice.refCode || invoice.affiliate_id || invoice.ref_code ||
                       linkedProject?.affiliateId || linkedProject?.affiliate_id ||
                       linkedProject?.refCode || linkedProject?.ref_code ||
                       linkedProposal?.affiliate_id || linkedProposal?.affiliateId ||
                       linkedProposal?.ref_code || linkedProposal?.refCode;
        if (affRef) {
          const { creditAffiliateCommission } = require('./affiliates');
          const invType = (invoice.invoiceType || invoice.invoice_type || '').toLowerCase();
          const isRetainer = invType.includes('retainer') || (invoice.projectName && invoice.projectName.toLowerCase().includes('retainer'));
          const baseAmount = Number(invoice.subtotal != null ? invoice.subtotal : (invoice.amount || 0));
          await creditAffiliateCommission(affRef, {
            amount: baseAmount,
            invoiceId: id,
            projectId: pRef,
            projectName: invoice.projectName || linkedProject?.name || linkedProposal?.project_title || 'Client Project',
            dealType: isRetainer ? 'monthly_retainer_recurring' : 'sprint_closed'
          });
        }
      } catch (retAffErr) {
        console.warn('[Affiliate Commission Accrual Note]:', retAffErr.message);
      }
    }

    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice PUT error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE / Void Invoice
router.delete('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error: delErr } = await supabase.from('invoices').delete().eq('id', id);
      if (delErr) {
        console.error('[Invoices API] Supabase delete error:', delErr.message);
        return res.status(500).json({ error: delErr.message });
      }
    }
    inMemoryInvoices = inMemoryInvoices.filter(i => i.id !== id);
    try {
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
    } catch (e) {}
    return res.json({ success: true, message: `Invoice ${id} deleted successfully.` });
  } catch (err) {
    console.error('Invoice DELETE error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /:id/send (Send Invoice Email)
router.post('/:id/send', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const inv = inMemoryInvoices.find(i => i.id === id);
    
    let clientEmail = req.body.email || (inv ? inv.clientEmail : null);
    if (!clientEmail && inv?.client_id && supabase) {
      try {
        const { data: clientData } = await supabase.from('clients').select('email, contact_email, company_email').eq('id', inv.client_id).maybeSingle();
        if (clientData) {
          clientEmail = clientData.email || clientData.contact_email || clientData.company_email;
        }
      } catch(e) {}
    }
    
    if (!clientEmail) {
      clientEmail = 'gro10xnow@gmail.com';
    }
    
    const invoice = mapInvoice(inv || { id, clientName: 'Agency Client', amount: 50000 });
    invoice.clientEmail = clientEmail;
    
    const emailResult = await sendInvoiceEmail({ invoice });
    return res.json({ success: true, message: 'Invoice sent successfully', simulated: emailResult.simulated });
  } catch (err) {
    console.error('Invoice Send Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /:id/pay (Partner Portal Online Payment Submission)
router.post('/:id/pay', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { id } = req.params;
    const { trxId, method, amount } = req.body;
    let screenshotUrl = null;

    // Fetch invoice from Supabase or memory to verify existence & tenant ownership
    let inv = null;
    if (supabase) {
      const { data } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (data) inv = data;
    }
    if (!inv) {
      inv = inMemoryInvoices.find(i => i.id === id);
    }
    if (!inv) {
      if (id && id.startsWith('INV-')) {
        inv = {
          id,
          client_name: req.body.payerName || req.user?.company || req.user?.name || 'Brand Partner Workspace',
          client_id: req.user?.linkedId || req.user?.id,
          amount: Number(amount) || 2500,
          status: 'Pending'
        };
        inMemoryInvoices.unshift(inv);
      } else {
        return res.status(404).json({ error: 'Invoice not found' });
      }
    }

    // IDOR Tenant Ownership Protection
    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    const userClientId = req.user.linkedId || req.user.clientId || req.user.id;
    const userClientName = (req.user.profile?.name || req.user.name || '').toLowerCase();

    if (isClientUser) {
      const invoiceClientId = inv.client_id || inv.clientId;
      const invoiceClientName = (inv.client_name || inv.clientName || '').toLowerCase();
      const hasMatch = (invoiceClientId && userClientId && invoiceClientId === userClientId) ||
                       (invoiceClientName && userClientName && invoiceClientName.includes(userClientName));
      if (!hasMatch) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to pay this invoice.' });
      }
    }

    if (req.file && supabase) {
      try {
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `payment-${Date.now()}${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(filename, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filename);
          screenshotUrl = publicData?.publicUrl || null;
        } else if (uploadErr) {
          console.warn('[invoices] Supabase storage upload failed:', uploadErr.message);
        }
      } catch (storageErr) {
        console.warn('[invoices] Screenshot storage error:', storageErr.message);
      }
    }

    const invoiceAmount = amount || (inv ? inv.amount : 0);

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const paymentPayload = {
      id: paymentId,
      invoice_id: id,
      client_id: inv?.client_id || req.user.linkedId || null,
      client_name: inv?.client_name || req.user.name || 'Client',
      amount: Number(invoiceAmount) || 0,
      currency: inv?.currency || 'BDT',
      payment_method: method || 'Corporate Bank Wire',
      trx_id: trxId || 'N/A',
      verified: false,
      notes: `Submitted via Partner Portal` + (screenshotUrl ? ` | Deposit Slip/Proof: ${screenshotUrl}` : '')
    };
    
    if (supabase) {
      await supabase.from('payment_logs').insert([paymentPayload]);
    }

    const updates = {
      status: 'Verification Pending',
      notes: `Paid via ${method || 'Corporate Bank Wire'} (Ref: ${trxId || 'N/A'})${screenshotUrl ? ' [Deposit Slip Attached]' : ''} — Verification Pending`
    };

    const memIdx = inMemoryInvoices.findIndex(i => i.id === id);
    if (memIdx !== -1) {
      inMemoryInvoices[memIdx] = { ...inMemoryInvoices[memIdx], ...updates };
    }
    const invoice = mapInvoice(inMemoryInvoices[memIdx] || { id, ...updates });

    if (supabase) {
      await supabase.from('invoices').update(updates).eq('id', id);
    }

    try {
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
      if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
      broadcast('payment_update', { invoiceId: id, status: 'Verification Pending', amount: Number(paymentPayload.amount) });
    } catch (e) {}


    // Send Telegram alert to Finance Manager
    try {
      const { sendTelegramNotification } = require('../services/bot');
      let targetTgId = process.env.OWNER_TELEGRAM_ID;

      if (targetTgId) {
        const msg =
          `💳 *New Payment Proof Received — Verification Required*\n\n` +
          `• Invoice: *${id}*\n` +
          `• Client: *${paymentPayload.client_name}*\n` +
          `• Amount: *BDT ${Number(paymentPayload.amount).toLocaleString()}*\n` +
          `• Method: *${paymentPayload.payment_method}*\n` +
          `• TrxID: \`${paymentPayload.trx_id}\`\n\n` +
          `Please verify in bKash merchant account statement.`;

        const keyboard = [
          [
            { text: '✅ Approve & Mark Paid', callback_data: `pay_approve:${paymentId}` },
            { text: '❌ Reject Payment', callback_data: `pay_reject:${paymentId}` }
          ]
        ];

        sendTelegramNotification(targetTgId, msg, keyboard, true).catch(() => {});
      }
    } catch (e) {}

    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice Pay error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.createInvoiceRecord = createInvoiceRecord;
module.exports.inMemoryInvoices = inMemoryInvoices;
