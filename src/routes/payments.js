const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');

/**
 * Helper: Send Telegram alert to Finance Manager / Owner for verification
 */
async function sendFinanceVerificationAlert(paymentLog) {
  try {
    const recipientIds = new Set();
    if (process.env.OWNER_TELEGRAM_ID) recipientIds.add(process.env.OWNER_TELEGRAM_ID);
    if (process.env.TELEGRAM_ADMIN_CHAT_ID) recipientIds.add(process.env.TELEGRAM_ADMIN_CHAT_ID);

    // Check if Finance Manager has a Telegram ID set
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('profiles').select('telegram_id').or('access_level.eq.Finance Manager,role.ilike.%finance manager%').maybeSingle();
      if (data?.telegram_id) recipientIds.add(data.telegram_id);
    }

    if (recipientIds.size === 0) return;

    const msg =
      `💳 *New Payment Proof Received — Verification Required*\n\n` +
      `• Invoice: *${paymentLog.invoice_id || 'N/A'}*\n` +
      `• Client: *${paymentLog.client_name || 'Client'}*\n` +
      `• Amount: *BDT ${Number(paymentLog.amount).toLocaleString()}*\n` +
      `• Method: *${paymentLog.payment_method || 'bKash'}*\n` +
      `• TrxID: \`${paymentLog.trx_id || 'N/A'}\`\n\n` +
      `Please verify the transaction in bKash merchant account statement.`;

    const keyboard = [
      [
        { text: '✅ Approve & Mark Paid', callback_data: `pay_approve:${paymentLog.id}` },
        { text: '❌ Reject Payment', callback_data: `pay_reject:${paymentLog.id}` }
      ]
    ];

    for (const tgId of recipientIds) {
      await sendTelegramNotification(tgId, msg, keyboard, true);
    }
  } catch (err) {
    console.warn('Failed to send payment verification Telegram alert:', err.message);
  }
}

const { ok, fail, asyncHandler } = require('../utils/response');

// GET /api/payments — List payment logs (Admin / Finance)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  if (!isSupabaseConfigured()) return ok(res, []);

  let query = supabase.from('payment_logs').select('*').order('created_at', { ascending: false });

  // Client user restriction
  const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
  if (isClientUser) {
    const clientId = req.user.linkedId || req.user.id;
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) return fail(res, 500, error.message, 'DB_ERROR');

  return ok(res, data || []);
}));

// POST /api/payments — Submit new payment proof (Client / Admin)
router.post('/', requireAuth, upload.any(), async (req, res) => {
  try {
    const { invoiceId, clientId, clientName, amount, paymentMethod, trxId, proofUrl, notes } = req.body;

    if (!trxId) {
      return res.status(400).json({ error: 'Transaction ID (TrxID) is required' });
    }

    let finalProofUrl = proofUrl || '';
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : (req.file || null);

    if (uploadedFile && isSupabaseConfigured()) {
      try {
        const ext = path.extname(uploadedFile.originalname) || '.jpg';
        const filename = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(filename, uploadedFile.buffer, {
            contentType: uploadedFile.mimetype || 'image/jpeg',
            upsert: false
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filename);
          if (publicData?.publicUrl) {
            finalProofUrl = publicData.publicUrl;
          }
        } else if (uploadErr) {
          console.warn('[Payments API] Supabase storage upload note:', uploadErr.message);
        }
      } catch (storageErr) {
        console.warn('[Payments API] Screenshot storage exception:', storageErr.message);
      }
    }

    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    const resolvedClientId = clientId || (isClientUser ? req.user.linkedId : null);

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const payload = {
      id: paymentId,
      invoice_id: invoiceId || null,
      client_id: resolvedClientId || null,
      client_name: clientName || req.user.name || 'Client',
      amount: Number(amount) || 0,
      currency: 'BDT',
      payment_method: paymentMethod || 'bKash',
      trx_id: trxId,
      proof_url: finalProofUrl,
      verified: false,
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('payment_logs').insert([payload]);
      if (error) console.warn('[Payments API] Supabase insert note:', error.message);

      // Update invoice status to 'Verification Pending' if invoiceId provided
      if (invoiceId) {
        await supabase.from('invoices')
          .update({
            status: 'Verification Pending',
            notes: `bKash Payment Submitted (TrxID: ${trxId}) — Awaiting Verification`
          })
          .eq('id', invoiceId);
      }
    }

    // Trigger Telegram verification push
    await sendFinanceVerificationAlert(payload);
    broadcast('payment_update', [payload]);

    res.json({ success: true, payment: payload });
  } catch (err) {
    console.error('POST /api/payments error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/verify — Verify & Approve Payment (Admin / Finance)
router.post('/:id/verify', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const verifiedBy = req.user.name || req.user.id || 'Admin';

    if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

    const { data: log, error: fetchErr } = await supabase.from('payment_logs').select('*').eq('id', id).single();
    if (fetchErr || !log) return res.status(404).json({ error: 'Payment record not found' });

    // Update payment log
    const { error: updateErr } = await supabase.from('payment_logs').update({
      verified: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString()
    }).eq('id', id);

    if (updateErr) throw updateErr;

    // Mark invoice as Paid
    if (log.invoice_id) {
      await supabase.from('invoices').update({
        status: 'Paid',
        paid_date: new Date().toISOString().split('T')[0],
        notes: `Verified bKash Payment (TrxID: ${log.trx_id}) by ${verifiedBy}`
      }).eq('id', log.invoice_id);
    }

    broadcast('payment_update', [{ id, verified: true }]);
    broadcast('invoice_update', [{ id: log.invoice_id, status: 'Paid' }]);

    // Trigger invoice_paid automation event (notifies client via Telegram if linked)
    try {
      const { processAutomationEvent } = require('../services/automation');
      const { readDB } = require('../services/db');
      const db = await readDB();
      const invoiceObj = {
        id: log.invoice_id,
        clientId: log.client_id,
        clientName: log.client_name,
        amount: log.amount,
        paidDate: new Date().toISOString().split('T')[0]
      };
      processAutomationEvent('invoice_paid', { invoice: invoiceObj }, db, () => {}, broadcast);
    } catch (autoErr) {
      console.warn('Payment verification automation event error:', autoErr.message);
    }


    // Send email payment receipt to client
    try {
      const { sendPaymentReceiptEmail } = require('../services/resend');
      let clientEmail = null;
      if (log.client_id && supabase) {
        const { data: cData } = await supabase.from('clients').select('email, contact_email').eq('id', log.client_id).maybeSingle();
        if (cData) clientEmail = cData.email || cData.contact_email;
      }
      if (clientEmail) {
        sendPaymentReceiptEmail({
          clientEmail,
          clientName: log.client_name,
          invoiceId: log.invoice_id,
          amount: log.amount,
          transactionId: log.trx_id
        }).catch(() => {});
      }
    } catch (e) {}

    res.json({ success: true, message: 'Payment verified and invoice marked as Paid.' });
  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/reject — Reject Invalid Payment (Admin / Finance)
router.post('/:id/reject', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || 'Invalid TrxID or amount mismatch';

    if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

    const { data: log, error: fetchErr } = await supabase.from('payment_logs').select('*').eq('id', id).single();
    if (fetchErr || !log) return res.status(404).json({ error: 'Payment record not found' });

    await supabase.from('payment_logs').update({
      notes: `REJECTED: ${reason}`
    }).eq('id', id);

    if (log.invoice_id) {
      await supabase.from('invoices').update({
        status: 'Pending',
        notes: `Payment proof rejected: ${reason}`
      }).eq('id', log.invoice_id);
    }

    broadcast('payment_update', [{ id, rejected: true }]);
    broadcast('invoice_update', [{ id: log.invoice_id, status: 'Pending' }]);

    // Notify Client via Telegram of rejection
    if (log.client_id) {
      try {
        const { data: clientObj } = await supabase.from('clients').select('telegram_id, name').eq('id', log.client_id).maybeSingle();
        if (clientObj?.telegram_id) {
          const rejectMsg =
            `⚠️ *Payment Proof Not Verified*\n\n` +
            `Your payment submission for Invoice *${log.invoice_id}* (TrxID: \`${log.trx_id}\`) could not be verified.\n` +
            `• Reason: _${reason}_\n\n` +
            `Please check your transaction details and resubmit proof in the client portal, or contact your Account Manager.`;
          sendTelegramNotification(clientObj.telegram_id, rejectMsg, null, false);
        }
      } catch (tgErr) {
        console.warn('Failed to send payment rejection Telegram alert:', tgErr.message);
      }
    }

    res.json({ success: true, message: 'Payment proof rejected.' });
  } catch (err) {
    console.error('Reject payment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
