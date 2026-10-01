/**
 * src/services/bot/handlers/payment-callbacks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Payment Approval & Rejection Callback Handlers.
 * Handles `pay_approve:{id}` and `pay_reject:{id}` inline keyboard callbacks.
 * Wires:
 * - Supabase payment_logs update (verified/rejected)
 * - Invoice status transition (Paid / Pending) in memory & Supabase
 * - Partner/Affiliate commission accrual
 * - Canonical stakeholder & automation events
 * - SSE real-time broadcasts (payment_update, invoice_update)
 * - Resend payment confirmation receipt email to client
 * - Inline keyboard dismissal/update to prevent double-tap race conditions
 * - Direct Telegram alerts to client (if telegram_id linked)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('../../supabase');
const state = require('../../state');
const sse = require('../../sse');
const resend = require('../../resend');
const { readDB, writeDB } = require('../../db');

/**
 * Main dispatcher for payment callback queries
 */
async function handlePaymentCallback(bot, query) {
  const queryId = query.id;
  const data = query.data || '';

  if (data.startsWith('pay_approve:')) {
    const payId = data.replace('pay_approve:', '').trim();
    return handlePaymentApprove(bot, query, payId);
  }

  if (data.startsWith('pay_reject:')) {
    const payId = data.replace('pay_reject:', '').trim();
    return handlePaymentReject(bot, query, payId);
  }
}

/**
 * Handle payment approval callback
 */
async function handlePaymentApprove(bot, query, payId) {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  // 1. Immediately dismiss Telegram loading spinner
  try {
    await bot.answerCallbackQuery(queryId, { text: '✅ Verifying & Approving Payment...' });
  } catch (_) {}

  try {
    const emp = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || { name: 'Finance Manager', emp_code: 'FINANCE' };
    const verifierName = emp?.name || 'Finance Manager';

    // 2. Fetch payment log record
    let payLog = null;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payment_logs').select('*').eq('id', payId).maybeSingle();
      if (!error && data) payLog = data;
    }

    if (!payLog) {
      try {
        const db = await readDB();
        payLog = (db.payment_logs || []).find(p => p.id === payId);
      } catch (_) {}
    }

    if (!payLog) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Payment record \`${payId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    // 3. Idempotency check: if already verified
    if (payLog.verified) {
      if (chatId) {
        await bot.sendMessage(chatId, `ℹ️ Payment \`${payId}\` has already been verified and marked as Paid.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      // Clean up buttons if message exists
      await removeMessageButtons(bot, query, `✅ *ALREADY VERIFIED & PAID*`);
      return;
    }

    const now = new Date().toISOString();
    const paidDate = now.split('T')[0];
    const receiptId = `REC-${(payLog.invoice_id || '2026-001').replace('INV-', '')}`;

    // 4. Update payment_logs with fallback for missing schema columns
    if (isSupabaseConfigured()) {
      const { error: updateErr } = await supabase.from('payment_logs').update({
        verified: true,
        verified_by: verifierName,
        verified_at: now
      }).eq('id', payId);

      if (updateErr) {
        // Fallback in case verified_by or verified_at columns don't exist
        const retry = await supabase.from('payment_logs').update({ verified: true }).eq('id', payId);
        if (retry.error) console.warn('[Payment Callback Update Note]:', retry.error.message);
      }
    }

    try {
      const db = await readDB();
      if (Array.isArray(db.payment_logs)) {
        const pIdx = db.payment_logs.findIndex(p => p.id === payId);
        if (pIdx !== -1) {
          db.payment_logs[pIdx].verified = true;
          db.payment_logs[pIdx].verified_by = verifierName;
          await writeDB(db);
        }
      }
    } catch (_) {}

    // 5. Update linked invoice in memory & Supabase
    let invoiceRecord = null;
    if (payLog.invoice_id) {
      const noteStr = `Verified Corporate Payment (Ref: ${payLog.trx_id || 'N/A'}) by ${verifierName} | Receipt: ${receiptId} [Rail: BRAC Bank Limited]`;

      try {
        const { inMemoryInvoices } = require('../../../routes/invoices');
        const memIdx = (inMemoryInvoices || []).findIndex(i => i.id === payLog.invoice_id);
        if (memIdx !== -1) {
          inMemoryInvoices[memIdx] = {
            ...inMemoryInvoices[memIdx],
            status: 'Paid',
            paid_date: paidDate,
            paidDate,
            paid_at: now,
            notes: noteStr
          };
          invoiceRecord = inMemoryInvoices[memIdx];
        }
      } catch (_) {}

      if (isSupabaseConfigured()) {
        try {
          const { data: dbData } = await supabase.from('invoices').update({
            status: 'Paid',
            paid_date: paidDate,
            notes: noteStr,
            updated_at: now
          }).eq('id', payLog.invoice_id).select();

          if (dbData && dbData[0]) {
            invoiceRecord = { ...(invoiceRecord || {}), ...dbData[0] };
          }
        } catch (dbErr) {
          console.warn('[Payment Callback Invoice Note]:', dbErr.message);
        }
      }

      // Partner & Affiliate Commission Accrual
      try {
        const pRef = invoiceRecord?.projectRef || invoiceRecord?.project_ref;
        const { findProject } = require('../../post-delivery');
        let linkedProject = pRef ? await findProject(pRef) : null;
        let linkedProposal = null;
        if (pRef) {
          try {
            const { inMemoryProposals } = require('../../../routes/proposals');
            if (Array.isArray(inMemoryProposals)) linkedProposal = inMemoryProposals.find(p => p.id === pRef);
          } catch (_) {}
        }
        const affRef = invoiceRecord?.affiliateId || invoiceRecord?.refCode || invoiceRecord?.affiliate_id || invoiceRecord?.ref_code ||
                       linkedProject?.affiliateId || linkedProject?.affiliate_id ||
                       linkedProposal?.affiliate_id || linkedProposal?.affiliateId;
        if (affRef) {
          const { creditAffiliateCommission } = require('../../../routes/affiliates');
          const baseAmount = Number(invoiceRecord?.subtotal != null ? invoiceRecord.subtotal : (invoiceRecord?.amount || payLog.amount || 0));
          await creditAffiliateCommission(affRef, {
            amount: baseAmount,
            invoiceId: payLog.invoice_id,
            projectId: pRef,
            projectName: invoiceRecord?.projectName || linkedProject?.name || linkedProposal?.project_title || 'Client Project',
            dealType: 'sprint_closed'
          });
        }
      } catch (affErr) {
        console.warn('[Payment Callback Affiliate Note]:', affErr.message);
      }

      // Emit canonical stakeholder event
      try {
        const { emitStakeholderEvent } = require('../../stakeholder-events');
        await emitStakeholderEvent('invoice.paid', {
          invoice: invoiceRecord || { id: payLog.invoice_id, amount: payLog.amount },
          paymentLog: payLog,
          receiptId
        }, {
          stakeholderId: payLog.client_id,
          stakeholderType: 'client'
        });
      } catch (_) {}

      // Trigger invoice_paid automation event
      try {
        const { processAutomationEvent } = require('../../automation');
        const db = await readDB();
        const invoiceObj = {
          id: payLog.invoice_id,
          clientId: payLog.client_id,
          clientName: payLog.client_name,
          amount: payLog.amount,
          paidDate: paidDate,
          receiptId: receiptId
        };
        processAutomationEvent('invoice_paid', { invoice: invoiceObj }, db, () => {}, sse.broadcast);
      } catch (_) {}
    }

    // 6. Broadcast real-time SSE updates
    sse.broadcast('payment_update', [{ id: payId, verified: true, receiptId }]);
    if (payLog.invoice_id) {
      sse.broadcast('invoice_update', [{ id: payLog.invoice_id, status: 'Paid', receiptId }]);
    }

    // 7. Send Payment Confirmation Receipt Email to Client via Resend
    try {
      let clientEmail = null;
      if (payLog.client_id && isSupabaseConfigured()) {
        const { data: cData } = await supabase.from('clients').select('*').eq('id', payLog.client_id).maybeSingle();
        if (cData) clientEmail = cData.email || cData.contact_email || cData.contactEmail;
      }
      if (!clientEmail) {
        try {
          const db = await readDB();
          const c = (db.clients || []).find(cl => cl.id === payLog.client_id);
          if (c) clientEmail = c.email || c.contactEmail;
        } catch (_) {}
      }
      if (clientEmail) {
        await resend.sendPaymentReceiptEmail({
          clientEmail,
          clientName: payLog.client_name,
          invoiceId: payLog.invoice_id,
          receiptId: receiptId,
          amount: payLog.amount,
          transactionId: payLog.trx_id
        });
      }
    } catch (emailErr) {
      console.warn('[Payment Callback Email Warning]:', emailErr.message);
    }

    // 8. Send Client Telegram Notification if linked
    try {
      const { sendTelegramNotification } = require('../../bot');
      let clientTgId = null;
      if (payLog.client_id && isSupabaseConfigured()) {
        const { data: clientObj } = await supabase.from('clients').select('telegram_id').eq('id', payLog.client_id).maybeSingle();
        clientTgId = clientObj?.telegram_id;
      }
      if (clientTgId) {
        const clientMsg =
          `✅ *Payment Confirmed & Verified!*\n\n` +
          `We have verified your payment for Invoice *${payLog.invoice_id || 'N/A'}*.\n` +
          `• Amount: *BDT ${Number(payLog.amount).toLocaleString()}*\n` +
          `• Receipt ID: \`${receiptId}\`\n\n` +
          `Your invoice status has been updated to *Paid*. Thank you for partnering with GRO10X! 💜`;
        sendTelegramNotification(clientTgId, clientMsg, null, false);
      }
    } catch (_) {}

    // 9. Update original Telegram message: Remove buttons & append audit banner
    await removeMessageButtons(
      bot,
      query,
      `✅ *VERIFIED & APPROVED by ${verifierName}* (Receipt: \`${receiptId}\`)`
    );

    // 10. Send confirmation message in team chat
    if (chatId) {
      await bot.sendMessage(
        chatId,
        `💳 *Payment ${payId} Approved!* Invoice marked as Paid.\n` +
        `• Client: *${payLog.client_name || 'Client'}*\n` +
        `• Amount: *BDT ${Number(payLog.amount).toLocaleString()}*\n` +
        `• Receipt ID: \`${receiptId}\``,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  } catch (err) {
    console.error('[Payment Callback Approve Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error processing payment approval: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Handle payment rejection callback
 */
async function handlePaymentReject(bot, query, payId, reason = 'Invalid TrxID or unconfirmed bank transfer') {
  const queryId = query.id;
  const chatId = query.message?.chat?.id || query.from?.id;

  // 1. Immediately dismiss Telegram loading spinner
  try {
    await bot.answerCallbackQuery(queryId, { text: '❌ Rejecting Payment Proof...' });
  } catch (_) {}

  try {
    const emp = (chatId ? await state.getEmployeeByTelegramId(chatId) : null) || { name: 'Finance Manager', emp_code: 'FINANCE' };
    const verifierName = emp?.name || 'Finance Manager';

    // 2. Fetch payment record
    let payLog = null;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payment_logs').select('*').eq('id', payId).maybeSingle();
      if (!error && data) payLog = data;
    }

    if (!payLog) {
      try {
        const db = await readDB();
        payLog = (db.payment_logs || []).find(p => p.id === payId);
      } catch (_) {}
    }

    if (!payLog) {
      if (chatId) {
        await bot.sendMessage(chatId, `⚠️ Payment record \`${payId}\` not found in database.`, { parse_mode: 'Markdown' }).catch(() => {});
      }
      return;
    }

    const noteText = `REJECTED: ${reason} (by ${verifierName})`;

    // 3. Update payment_logs
    if (isSupabaseConfigured()) {
      await supabase.from('payment_logs').update({
        notes: noteText
      }).eq('id', payId);
    }

    // 4. Update linked invoice in memory & Supabase
    if (payLog.invoice_id) {
      try {
        const { inMemoryInvoices } = require('../../../routes/invoices');
        const memIdx = (inMemoryInvoices || []).findIndex(i => i.id === payLog.invoice_id);
        if (memIdx !== -1) {
          inMemoryInvoices[memIdx] = {
            ...inMemoryInvoices[memIdx],
            status: 'Pending',
            notes: `Payment proof rejected: ${reason}`
          };
        }
      } catch (_) {}

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('invoices').update({
            status: 'Pending',
            notes: `Payment proof rejected: ${reason}`
          }).eq('id', payLog.invoice_id);
        } catch (dbErr) {
          console.warn('[Payment Callback Invoice Reject Note]:', dbErr.message);
        }
      }
    }

    // 5. Broadcast real-time SSE updates
    sse.broadcast('payment_update', [{ id: payId, rejected: true }]);
    if (payLog.invoice_id) {
      sse.broadcast('invoice_update', [{ id: payLog.invoice_id, status: 'Pending' }]);
    }

    // 6. Notify Client via Telegram DM if linked
    try {
      const { sendTelegramNotification } = require('../../bot');
      let clientTgId = null;
      if (payLog.client_id && isSupabaseConfigured()) {
        const { data: clientObj } = await supabase.from('clients').select('telegram_id').eq('id', payLog.client_id).maybeSingle();
        clientTgId = clientObj?.telegram_id;
      }
      if (clientTgId) {
        const rejectMsg =
          `⚠️ *Payment Proof Not Verified*\n\n` +
          `Your payment submission for Invoice *${payLog.invoice_id || 'N/A'}* (TrxID: \`${payLog.trx_id || 'N/A'}\`) could not be verified.\n` +
          `• Reason: _${reason}_\n\n` +
          `Please verify your transaction details and resubmit proof in the client portal, or contact your Account Manager.`;
        sendTelegramNotification(clientTgId, rejectMsg, null, false);
      }
    } catch (tgErr) {
      console.warn('Failed to send payment rejection Telegram alert:', tgErr.message);
    }

    // 7. Update original Telegram message: Remove buttons & append audit banner
    await removeMessageButtons(
      bot,
      query,
      `❌ *PAYMENT PROOF REJECTED by ${verifierName}*`
    );

    // 8. Send confirmation message in team chat
    if (chatId) {
      await bot.sendMessage(
        chatId,
        `❌ *Payment ${payId} Rejected.* Invoice reverted to Pending.\n` +
        `• Client: *${payLog.client_name || 'Client'}*\n` +
        `• Reason: _${reason}_`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  } catch (err) {
    console.error('[Payment Callback Reject Error]:', err.message);
    if (chatId) {
      await bot.sendMessage(chatId, `⚠️ Error processing payment rejection: ${err.message}`).catch(() => {});
    }
  }
}

/**
 * Helper to update message text and strip inline keyboard buttons
 */
async function removeMessageButtons(bot, query, auditBanner) {
  const chatId = query.message?.chat?.id || query.from?.id;
  const messageId = query.message?.message_id;

  if (!chatId || !messageId) return;

  try {
    const existingText = query.message?.text || '';
    const updatedText = existingText ? `${existingText}\n\n${auditBanner}` : auditBanner;

    if (typeof bot.editMessageText === 'function') {
      await bot.editMessageText(updatedText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] }
      }).catch(async () => {
        if (typeof bot.editMessageReplyMarkup === 'function') {
          await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: chatId,
            message_id: messageId
          }).catch(() => {});
        }
      });
    } else if (typeof bot.editMessageReplyMarkup === 'function') {
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: messageId
      }).catch(() => {});
    }
  } catch (_) {}
}

module.exports = {
  handlePaymentCallback,
  handlePaymentApprove,
  handlePaymentReject,
  removeMessageButtons
};
