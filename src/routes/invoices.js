const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Use memory storage — files uploaded directly to Supabase Storage, avoiding ephemeral disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast, broadcastToClient } = require('../services/sse');
const { sendInvoiceEmail } = require('../services/resend');

function mapInvoice(i) {
  if (!i) return null;
  return {
    id: i.id,
    clientId: i.client_id || i.clientId,
    clientName: i.client_name || i.clientName || i.client || 'Agency Client',
    projectName: i.project_name || i.projectName,
    projectRef: i.project_ref || i.projectRef,
    date: i.date || i.created_at,
    dueDate: i.due_date || i.dueDate,
    paidDate: i.paid_date || i.paidDate,
    amount: Number(i.amount) || 0,
    taxRate: Number(i.tax_rate || i.taxRate) || 15,
    discount: Number(i.discount) || 0,
    status: i.status || 'Pending',
    items: i.items || [],
    notes: i.notes || '',
    createdAt: i.created_at || i.createdAt
  };
}

function mapQuote(q) {
  if (!q) return null;
  return {
    id: q.id,
    clientName: q.client_name || q.clientName || 'General Client',
    amount: Number(q.amount) || 0,
    taxRate: Number(q.tax_rate || q.taxRate) || 15,
    discount: Number(q.discount) || 0,
    status: q.status || 'Draft',
    date: q.date || q.created_at,
    validUntil: q.valid_until || q.validUntil,
    items: q.items || [],
    terms: q.terms || '',
    createdAt: q.created_at || q.createdAt
  };
}

const DEFAULT_INVOICES = [];
const DEFAULT_QUOTES = [];

let inMemoryInvoices = [...DEFAULT_INVOICES];
let inMemoryQuotes = [...DEFAULT_QUOTES];

// GET Invoices
router.get('/', requireAuth, async (req, res) => {
  const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
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
        if (!error && Array.isArray(data) && data.length > 0) {
          invoices = data.map(mapInvoice);
        }
      } catch (e) {}
    }

    if (invoices.length === 0) {
      invoices = getFilteredFallback();
    }

    return res.json(invoices);
  } catch (err) {
    console.error('Invoices GET error:', err.message);
    return res.json(getFilteredFallback());
  }
});

// POST Create Invoice
router.post('/', requireAuth, requireManager, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `INV-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;

    const payload = {
      id: newId,
      client_id: req.body.clientId || req.body.client_id || (req.user?.linkedType === 'client' ? req.user.linkedId : null),
      client_name: req.body.clientName || req.body.client_name || 'General Client',
      project_name: req.body.projectName || req.body.project_name || '',
      project_ref: req.body.projectRef || req.body.project_ref || null,
      engine_tag: req.body.engineTag || req.body.engine_tag || 'engine2',
      date: req.body.date || new Date().toISOString().split('T')[0],
      due_date: req.body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      amount: Number(req.body.amount) || 0,
      tax_rate: Number(req.body.taxRate) || 15,
      discount: Number(req.body.discount) || 0,
      status: req.body.status || 'Pending',
      items: req.body.items || [],
      notes: req.body.notes || '',
      created_at: new Date().toISOString()
    };

    inMemoryInvoices.unshift(payload);
    const invoice = mapInvoice(payload);

    if (supabase) {
      const { error: insErr } = await supabase.from('invoices').insert([payload]);
      if (insErr) {
        console.warn('[Invoices API] Supabase insert note:', insErr.message);
      }
    }

    try {
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
      if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
    } catch (e) {}
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
    if (req.body.dueDate) updates.due_date = req.body.dueDate;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.engineTag || req.body.engine_tag) updates.engine_tag = req.body.engineTag || req.body.engine_tag;
    if (req.body.status === 'Paid') updates.paid_date = new Date().toISOString().split('T')[0];
    updates.updated_at = new Date().toISOString();

    const memIdx = inMemoryInvoices.findIndex(i => i.id === id);
    if (memIdx !== -1) {
      inMemoryInvoices[memIdx] = { ...inMemoryInvoices[memIdx], ...updates };
    }
    const invoice = mapInvoice(inMemoryInvoices[memIdx] || { id, ...updates });

    if (supabase) {
      const { error: updErr } = await supabase.from('invoices').update(updates).eq('id', id);
      if (updErr) {
        console.warn('[Invoices API] Supabase update note:', updErr.message);
      }
    }

    try {
      broadcast('invoice_update', inMemoryInvoices.map(mapInvoice));
      if (invoice.clientId) broadcastToClient('invoice_update', [invoice], [invoice.clientId]);
    } catch (e) {}

    if (req.body.status === 'Paid') {
      try {
        const { processAutomationEvent } = require('../services/automation');
        processAutomationEvent('invoice_paid', { invoice }, { clients: [], team: [] }, () => {}, broadcast).catch(() => {});
      } catch (e) {}
    }

    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice PUT error:', err.message);
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
      return res.status(404).json({ error: 'Invoice not found' });
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
      currency: 'BDT',
      payment_method: method || 'bKash',
      trx_id: trxId || 'N/A',
      verified: false,
      notes: `Submitted via Partner Portal` + (screenshotUrl ? ` | Screenshot: ${screenshotUrl}` : '')
    };
    
    if (supabase) {
      await supabase.from('payment_logs').insert([paymentPayload]);
    }

    const updates = {
      status: 'Verification Pending',
      notes: `Paid via ${method || 'bKash'} (TrxID: ${trxId || 'N/A'})${screenshotUrl ? ' [Screenshot Attached]' : ''} — Verification Pending`
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

// QUOTATIONS API
router.get('/quotes', requireAuth, requireManager, async (req, res) => {
  try {
    let quotes = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          quotes = data.map(mapQuote);
        }
      } catch (e) {}
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
    const newId = `QTE-2026-${String(inMemoryQuotes.length + 1).padStart(3, '0')}`;

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
      terms: req.body.terms || '',
      created_at: new Date().toISOString()
    };

    inMemoryQuotes.unshift(payload);
    const quote = mapQuote(payload);

    if (supabase) {
      const { error: qInsErr } = await supabase.from('quotes').insert([payload]);
      if (qInsErr) console.warn('[Quotes API] Supabase insert note:', qInsErr.message);
    }

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

    const memIdx = inMemoryQuotes.findIndex(q => q.id === id);
    if (memIdx !== -1) {
      inMemoryQuotes[memIdx] = { ...inMemoryQuotes[memIdx], ...updates };
    }
    const quote = mapQuote(inMemoryQuotes[memIdx] || { id, ...updates });

    if (supabase) {
      const { error: qUpdErr } = await supabase.from('quotes').update(updates).eq('id', id);
      if (qUpdErr) console.warn('[Quotes API] Supabase update note:', qUpdErr.message);
    }

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
    const quoteIdx = inMemoryQuotes.findIndex(q => q.id === id);
    const quoteData = quoteIdx !== -1 ? inMemoryQuotes[quoteIdx] : null;

    if (!quoteData) return res.status(404).json({ error: 'Quotation not found' });

    inMemoryQuotes[quoteIdx].status = 'Converted';

    const newInvoice = {
      id: `INV-2026-${String(inMemoryInvoices.length + 1).padStart(3, '0')}`,
      client_id: quoteData.client_id || quoteData.clientId || null,
      client_name: quoteData.client_name,
      date: new Date().toISOString().split('T')[0],
      due_date: quoteData.valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      amount: Number(quoteData.amount) || 0,
      tax_rate: Number(quoteData.tax_rate) || 15,
      discount: Number(quoteData.discount) || 0,
      status: 'Draft',
      items: quoteData.items || [{ description: `Proposal Services for ${quoteData.client_name}`, qty: 1, rate: Number(quoteData.amount) || 0 }],
      notes: quoteData.terms || '',
      created_at: new Date().toISOString()
    };

    inMemoryInvoices.unshift(newInvoice);

    if (supabase) {
      await supabase.from('quotes').update({ status: 'Converted' }).eq('id', id);
      await supabase.from('invoices').insert([newInvoice]);
    }

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

module.exports = router;
