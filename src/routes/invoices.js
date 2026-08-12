const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (use /tmp on Vercel because of read-only filesystem)
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'payment-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
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

// GET Invoices
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    const clientName = req.user.profile?.name || req.user.name;

    if (isClientUser && clientName) {
      query = query.or(`client_id.eq.${req.user.linkedId || req.user.id},client_name.ilike.%${clientName}%`);
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
router.post('/', requireAuth, requireManager, async (req, res) => {
  try {
    const { randomUUID } = require('crypto');
    const newId = `INV-${randomUUID().split('-')[0].toUpperCase()}`;

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
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
    if (req.body.dueDate) updates.due_date = req.body.dueDate;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.status === 'Paid') updates.paid_date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const invoice = mapInvoice(data);
    const { data: allInvoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    if (req.body.status === 'Paid') {
      try {
        const { processAutomationEvent } = require('../services/automation');
        await processAutomationEvent('invoice_paid', { invoice }, { clients: [], team: [] }, () => {}, broadcast);
      } catch (e) {
        console.warn('Invoice paid automation error:', e.message);
      }
    }

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/send (Send Invoice Email)
router.post('/:id/send', requireAuth, requireManager, async (req, res) => {

  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Invoice not found' });
    
    // We need the client's email. It might not be directly on the invoice, so let's try to fetch it if missing.
    let clientEmail = req.body.email || data.clientEmail || null;
    if (!clientEmail && data.client_id) {
      const { data: clientData } = await supabase.from('clients').select('email, contact_email, company_email').eq('id', data.client_id).maybeSingle();
      if (clientData) {
        clientEmail = clientData.email || clientData.contact_email || clientData.company_email;
      }
    }
    
    if (!clientEmail) {
      return res.status(400).json({ error: 'No client email found to send invoice.' });
    }
    
    const invoice = mapInvoice(data);
    invoice.clientEmail = clientEmail;
    
    const emailResult = await sendInvoiceEmail({ invoice });
    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }
    
    res.json({ success: true, message: 'Invoice sent successfully', simulated: emailResult.simulated });
  } catch (err) {
    console.error('Invoice Send Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/pay (Partner Portal Online Payment Submission)
router.post('/:id/pay', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { id } = req.params;
    const { trxId, method, amount } = req.body;
    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const { data: invData } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    const invoiceAmount = amount || (invData ? invData.amount : 0);

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const paymentPayload = {
      id: paymentId,
      invoice_id: id,
      client_id: invData?.client_id || req.user.linkedId || null,
      client_name: invData?.client_name || req.user.name || 'Client',
      amount: Number(invoiceAmount) || 0,
      currency: 'BDT',
      payment_method: method || 'bKash',
      trx_id: trxId || 'N/A',
      verified: false,
      notes: `Submitted via Partner Portal`
    };
    
    // Add screenshot URL to notes if provided
    if (screenshotUrl) {
      paymentPayload.notes += ` | Screenshot: ${screenshotUrl}`;
    }

    await supabase.from('payment_logs').insert([paymentPayload]);

    const updates = {
      status: 'Verification Pending',
      notes: `Paid via ${method || 'bKash'} (TrxID: ${trxId || 'N/A'})${screenshotUrl ? ' [Screenshot Attached]' : ''} — Verification Pending`
    };

    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select();
    if (error) throw error;

    const invoice = (data && data.length) ? mapInvoice(data[0]) : { id, status: 'Verification Pending', notes: updates.notes };
    const { data: allInvoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    broadcast('invoice_update', (allInvoices || []).map(mapInvoice));

    // Send Telegram alert to Finance Manager / Owner
    try {
      const { sendTelegramNotification } = require('../services/bot');
      let targetTgId = process.env.OWNER_TELEGRAM_ID;
      const { data: borhan } = await supabase.from('profiles').select('telegram_id').eq('emp_code', 'PBD-029').maybeSingle();
      if (borhan?.telegram_id) targetTgId = borhan.telegram_id;

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

        await sendTelegramNotification(targetTgId, msg, keyboard, true);
      }
    } catch (e) {
      console.warn('Payment verification Telegram alert warning:', e.message);
    }

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
