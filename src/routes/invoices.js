const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapInvoice(i) {
  if (!i) return null;
  return {
    id: i.id,
    clientId: i.client_id,
    clientName: i.client_name,
    projectName: i.project_name,
    projectRef: i.project_ref,
    date: i.date,
    dueDate: i.due_date,
    paidDate: i.paid_date,
    amount: Number(i.amount) || 0,
    taxRate: Number(i.tax_rate) || 15,
    discount: Number(i.discount) || 0,
    status: i.status || 'Pending',
    items: i.items || [],
    notes: i.notes,
    createdAt: i.created_at
  };
}

function mapQuote(q) {
  if (!q) return null;
  return {
    id: q.id,
    clientName: q.client_name,
    amount: Number(q.amount) || 0,
    taxRate: Number(q.tax_rate) || 15,
    discount: Number(q.discount) || 0,
    status: q.status || 'Draft',
    date: q.date,
    validUntil: q.valid_until,
    items: q.items || [],
    terms: q.terms,
    createdAt: q.created_at
  };
}

// GET Invoices
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

    if (req.user.linkedType === 'client' && req.user.linkedId) {
      query = query.or(`client_id.eq.${req.user.linkedId},client_name.ilike.%${req.user.name}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(mapInvoice));
  } catch (err) {
    console.error('Invoices GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create Invoice
router.post('/invoices', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
    const countNum = (count || 0) + 1;
    const newId = `INV-2026-${String(countNum).padStart(3, '0')}`;

    const payload = {
      id: newId,
      client_id: req.body.clientId || 'CLI-0001',
      client_name: req.body.clientName || 'General Client',
      project_name: req.body.projectName || '',
      date: req.body.date || new Date().toISOString().split('T')[0],
      due_date: req.body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      amount: Number(req.body.amount) || 0,
      tax_rate: Number(req.body.taxRate) || 15,
      discount: Number(req.body.discount) || 0,
      status: req.body.status || 'Pending',
      items: req.body.items || []
    };

    const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
    if (error) throw error;

    const invoice = mapInvoice(data);
    const { data: allInvoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Invoice / Mark Paid
router.put('/invoices/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
    if (req.body.dueDate) updates.due_date = req.body.dueDate;
    if (req.body.status === 'Paid') updates.paid_date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const invoice = mapInvoice(data);
    const { data: allInvoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /invoices/:id/pay (Partner Portal Online Payment Verification)
router.post('/invoices/:id/pay', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      status: 'Paid',
      paid_date: new Date().toISOString().split('T')[0],
      notes: `Paid via ${req.body.method || 'Online Gateway'} (TrxID: ${req.body.trxId || 'N/A'})`
    };

    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const invoice = mapInvoice(data);
    const { data: allInvoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice Pay error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// QUOTATIONS API
router.get('/quotes', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapQuote));
  } catch (err) {
    console.error('Quotes GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/quotes', requireAuth, async (req, res) => {
  try {
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
    const countNum = (count || 0) + 1;
    const newId = `QTE-2026-${String(countNum).padStart(3, '0')}`;

    const payload = {
      id: newId,
      client_name: req.body.clientName || 'Client Proposal',
      amount: Number(req.body.amount) || 0,
      tax_rate: Number(req.body.taxRate) || 15,
      discount: Number(req.body.discount) || 0,
      status: 'Draft',
      date: req.body.date || new Date().toISOString().split('T')[0],
      valid_until: req.body.validUntil || null,
      items: req.body.items || [],
      terms: req.body.terms || ''
    };

    const { data, error } = await supabase.from('quotes').insert([payload]).select().single();
    if (error) throw error;

    const quote = mapQuote(data);
    const { data: allQuotes } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    broadcast('quote_update', (allQuotes || []).map(mapQuote));

    res.json({ success: true, quote });
  } catch (err) {
    console.error('Quote POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/quotes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);

    const { data, error } = await supabase.from('quotes').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const quote = mapQuote(data);
    const { data: allQuotes } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    broadcast('quote_update', (allQuotes || []).map(mapQuote));

    res.json({ success: true, quote });
  } catch (err) {
    console.error('Quote PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/quotes/:id/convert', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: quoteData, error: qErr } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (qErr || !quoteData) return res.status(404).json({ error: 'Quotation not found' });

    await supabase.from('quotes').update({ status: 'Converted' }).eq('id', id);

    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
    const invCount = (count || 0) + 1;
    const newInvoice = {
      id: `INV-2026-${String(invCount).padStart(3, '0')}`,
      client_id: 'CLI-0001',
      client_name: quoteData.client_name,
      date: new Date().toISOString().split('T')[0],
      due_date: quoteData.valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      amount: Number(quoteData.amount) || 0,
      tax_rate: Number(quoteData.tax_rate) || 15,
      discount: Number(quoteData.discount) || 0,
      status: 'Draft',
      items: quoteData.items || [{ description: `Proposal Services for ${quoteData.client_name}`, qty: 1, rate: Number(quoteData.amount) || 0 }],
      notes: quoteData.terms || ''
    };

    const { data: insertedInv, error: iErr } = await supabase.from('invoices').insert([newInvoice]).select().single();
    if (iErr) throw iErr;

    const invoice = mapInvoice(insertedInv);
    const quote = mapQuote({ ...quoteData, status: 'Converted' });

    const { data: allQuotes } = await supabase.from('quotes').select('*');
    const { data: allInvoices } = await supabase.from('invoices').select('*');

    broadcast('quote_update', (allQuotes || []).map(mapQuote));
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    res.json({ success: true, invoice, quote });
  } catch (err) {
    console.error('Quote Convert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
