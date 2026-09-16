/**
 * src/utils/mfs-parser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parser for incoming SMS and Push Notifications from Bangladeshi payment
 * networks (bKash, Nagad, Rocket, and BRAC Bank).
 * ─────────────────────────────────────────────────────────────────────────────
 */

function parseMfsSms(rawMessage, senderHint = '') {
  if (!rawMessage || typeof rawMessage !== 'string') return null;

  const msg = rawMessage.trim();
  const hint = (senderHint || '').toUpperCase();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. BKASH
  // Patterns:
  // "You have received Tk 500.00 from 01712345678. Fee Tk 0.00. Balance Tk 12,450.00. TrxID 9K2L4M6N at 16/09/2026 10:45. Ref G10X"
  // "Payment Tk 500.00 from 01712345678 successful. Fee Tk 0.00. Balance Tk 12,450.00. TrxID 9K2L4M6N at 16/09/2026 10:45"
  // ───────────────────────────────────────────────────────────────────────────
  if (hint.includes('BKASH') || hint.includes('16247') || /TrxID\s+[A-Z0-9]+/i.test(msg)) {
    const isBkash = /bKash/i.test(msg) || /TrxID/i.test(msg);
    if (isBkash) {
      const amountMatch = msg.match(/(?:received Tk|Payment Tk|Cash In Tk|Tk)\s*([\d,.]+)/i);
      const trxMatch = msg.match(/TrxID\s*([A-Z0-9]+)/i);
      const senderMatch = msg.match(/from\s*(01\d{9})/i);
      const refMatch = msg.match(/Ref\s*([A-Za-z0-9_-]+)/i);
      const balanceMatch = msg.match(/Balance\s*Tk\s*([\d,.]+)/i);

      if (amountMatch && trxMatch) {
        return {
          platform: 'BKASH',
          amount: parseFloat(amountMatch[1].replace(/,/g, '')),
          trx_id: trxMatch[1].toUpperCase(),
          sender: senderMatch ? senderMatch[1] : null,
          reference: refMatch ? refMatch[1].trim() : null,
          balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null,
          raw: msg
        };
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. NAGAD
  // Patterns:
  // "Customer: 01712345678 Amount: Tk 500.00 TxnID: 71P9K2L4 Date: 16/09/2026 10:45 Balance: Tk 1,250.00 Ref: G10X"
  // "Money Received\nAmount: Tk 500.00\nSender: 01712345678\nTxnID: 71P9K2L4"
  // ───────────────────────────────────────────────────────────────────────────
  if (hint.includes('NAGAD') || hint.includes('16167') || /TxnID\s*:\s*[A-Z0-9]+/i.test(msg)) {
    const amountMatch = msg.match(/Amount\s*:\s*Tk\s*([\d,.]+)/i);
    const txnMatch = msg.match(/TxnID\s*:\s*([A-Z0-9]+)/i);
    const senderMatch = msg.match(/(?:Customer|Sender)\s*:\s*(01\d{9})/i);
    const refMatch = msg.match(/Ref\s*:\s*([A-Za-z0-9_-]+)/i);
    const balanceMatch = msg.match(/Balance\s*:\s*Tk\s*([\d,.]+)/i);

    if (amountMatch && txnMatch) {
      return {
        platform: 'NAGAD',
        amount: parseFloat(amountMatch[1].replace(/,/g, '')),
        trx_id: txnMatch[1].toUpperCase(),
        sender: senderMatch ? senderMatch[1] : null,
        reference: refMatch ? refMatch[1].trim() : null,
        balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null,
        raw: msg
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ROCKET (DBBL)
  // Pattern: "Tk500.00 received from 01712345678 to A/C 017... TxnId: 1234567890"
  // ───────────────────────────────────────────────────────────────────────────
  if (hint.includes('ROCKET') || hint.includes('16216') || /DBBL/i.test(msg)) {
    const amountMatch = msg.match(/Tk\s*([\d,.]+)\s*received/i);
    const txnMatch = msg.match(/TxnId\s*:\s*([A-Z0-9]+)/i);
    const senderMatch = msg.match(/from\s*(01\d{9})/i);

    if (amountMatch && txnMatch) {
      return {
        platform: 'ROCKET',
        amount: parseFloat(amountMatch[1].replace(/,/g, '')),
        trx_id: txnMatch[1].toUpperCase(),
        sender: senderMatch ? senderMatch[1] : null,
        reference: null,
        balance: null,
        raw: msg
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. BRAC BANK
  // Patterns:
  // "Your A/C ... is credited with BDT 5,000.00 on 16-Sep-2026 ... Ref: G10X ... Avail Bal BDT 150,000.00"
  // "A/C ending with 1234 is credited with BDT 5,000.00"
  // ───────────────────────────────────────────────────────────────────────────
  if (hint.includes('BRAC') || /BRAC\s*BANK/i.test(msg) || /credited with (?:BDT|Tk)/i.test(msg)) {
    const amountMatch = msg.match(/credited with\s*(?:BDT|Tk)?\s*([\d,.]+)/i);
    const refMatch = msg.match(/Ref(?:erence)?\s*(?:No|ID)?[:\s]*([A-Za-z0-9_-]+)/i);
    const balMatch = msg.match(/(?:Avail Bal|Balance)\s*(?:BDT|Tk)?\s*([\d,.]+)/i);
    const acctMatch = msg.match(/A\/C\s*(?:ending with)?\s*([0-9*xX]+)/i);

    if (amountMatch) {
      const trxId = refMatch ? refMatch[1].toUpperCase() : `BRAC-${Date.now()}`;
      return {
        platform: 'BRAC_BANK',
        amount: parseFloat(amountMatch[1].replace(/,/g, '')),
        trx_id: trxId,
        sender: acctMatch ? acctMatch[1] : null,
        reference: refMatch ? refMatch[1].trim() : null,
        balance: balMatch ? parseFloat(balMatch[1].replace(/,/g, '')) : null,
        raw: msg
      };
    }
  }

  return null;
}

module.exports = { parseMfsSms };
